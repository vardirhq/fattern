const { initializeDatabase, DB_PATH } = require('./initDatabase');
const { relevantVatTerm } = require('./vatTerms');
const { loadBetterSqlite3 } = require('./loadBetterSqlite3');

function toDateOnlyString(dateLike) {
  const date = dateLike instanceof Date ? dateLike : new Date(dateLike);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const CATEGORY_COLOR_PALETTE = [
  '#3fd9a0', '#6ab0c8', '#c47eb0', '#e8a84a', '#e87a6a',
  '#7ab0e8', '#a8c87a', '#c8a06a', '#8ab0c8', '#b8b0e8',
];

class FatternDatabase {
  constructor() {
    const { db } = initializeDatabase();
    this.db = db;
    this.ensureCurrentBudgetYear();
  }

  close() {
    this.db?.close();
  }

  /**
   * Wipes every table and re-initialises a clean database.
   * Called only from the "Wipe all data" danger-zone action.
   */
  wipeAllData() {
    const tables = [
      'invoice_expense_links',
      'invoice_items',
      'invoices',
      'expense_items',
      'expenses',
      'expense_categories',
      'budget_years',
      'products',
      'customers',
      'settings',
      'companies',
    ];

    // Pragmas must run outside a transaction
    this.db.pragma('foreign_keys = OFF');

    const wipe = this.db.transaction(() => {
      for (const table of tables) {
        this.db.prepare(`DELETE FROM ${table}`).run();
      }
      // Reset auto-increment counters (sqlite_sequence only exists if any
      // AUTOINCREMENT table has ever had a row — ignore if missing)
      try {
        this.db.prepare(`DELETE FROM sqlite_sequence`).run();
      } catch (_) { /* table may not exist yet */ }
    });

    try {
      wipe();
    } finally {
      this.db.pragma('foreign_keys = ON');
    }

    // Re-seed the essentials so the app starts in a clean but functional state
    this.ensureCompany();
    this.ensureCurrentBudgetYear();
  }

  /**
   * Ensures a company record exists and returns it.
   */
  ensureCompany(defaults = {}) {
    const existing = this.db.prepare('SELECT * FROM companies LIMIT 1').get();
    if (existing) return existing;

    const insert = this.db.prepare(
      `INSERT INTO companies (name, vat_rate, created_at, updated_at)
       VALUES (@name, @vat_rate, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    );

    const info = insert.run({
      name: defaults.name || 'Default Company',
      vat_rate: defaults.vat_rate ?? 0.25,
    });

    return this.db.prepare('SELECT * FROM companies WHERE id = ?').get(info.lastInsertRowid);
  }

  updateCompany(updates = {}) {
    const existing = this.ensureCompany();
    const payload = {
      id: existing.id,
      name: updates.name ?? existing.name,
      org_number: updates.org_number ?? existing.org_number,
      address: updates.address ?? existing.address,
      post_number: updates.post_number ?? existing.post_number,
      post_location: updates.post_location ?? existing.post_location,
      contact_email: updates.contact_email ?? existing.contact_email,
      contact_number: updates.contact_number ?? existing.contact_number,
      account_number: updates.account_number ?? existing.account_number,
      vat_rate:
        typeof updates.vat_rate === 'number'
          ? updates.vat_rate
          : existing.vat_rate ?? 0.25,
    };

    this.db.prepare(
      `UPDATE companies
       SET name = @name,
           org_number = @org_number,
           address = @address,
           post_number = @post_number,
           post_location = @post_location,
           contact_email = @contact_email,
           contact_number = @contact_number,
           account_number = @account_number,
           vat_rate = @vat_rate,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = @id`
    ).run(payload);

    return this.db.prepare('SELECT * FROM companies WHERE id = ?').get(existing.id);
  }

  getCurrentBudgetYear() {
    const row = this.db.prepare('SELECT * FROM budget_years WHERE is_current = 1 LIMIT 1').get();
    return row || null;
  }

  createBudgetYear({ label, startDate, endDate, isCurrent = false }) {
    const statement = this.db.prepare(`
      INSERT INTO budget_years (label, start_date, end_date, is_current, created_at, updated_at)
      VALUES (@label, @start_date, @end_date, @is_current, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const info = statement.run({
      label,
      start_date: toDateOnlyString(startDate),
      end_date: toDateOnlyString(endDate),
      is_current: isCurrent ? 1 : 0,
    });

    if (isCurrent) {
      this.db.prepare('UPDATE budget_years SET is_current = 0 WHERE id != ?').run(info.lastInsertRowid);
    }

    return this.db.prepare('SELECT * FROM budget_years WHERE id = ?').get(info.lastInsertRowid);
  }

  ensureCurrentBudgetYear() {
    const current = this.getCurrentBudgetYear();
    if (current) return current;

    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    const label = `${start.getFullYear()}`;

    return this.createBudgetYear({ label, startDate: start, endDate: end, isCurrent: true });
  }

  generateInvoiceNumber({ invoiceDate = new Date(), budgetYearId } = {}) {
    const company = this.ensureCompany();
    const date = invoiceDate instanceof Date ? invoiceDate : new Date(invoiceDate);
    const budgetYear = budgetYearId
      ? this.db.prepare('SELECT * FROM budget_years WHERE id = ?').get(budgetYearId)
      : this.ensureCurrentBudgetYear();

    const label = budgetYear ? budgetYear.label || `${date.getFullYear()}` : `${date.getFullYear()}`;
    const resetBoundary = budgetYear ? new Date(budgetYear.start_date) : new Date(date.getFullYear(), 0, 1);
    const hasResetDate = company.invoice_reset_date ? new Date(company.invoice_reset_date) : null;
    const resetRequired = !hasResetDate || hasResetDate < resetBoundary;

    if (resetRequired) {
      this.db
        .prepare('UPDATE companies SET invoice_count = 0, invoice_reset_date = ? WHERE id = ?')
        .run(toDateOnlyString(resetBoundary), company.id);
      company.invoice_count = 0;
    }

    const nextCount = (company.invoice_count || 0) + 1;
    this.db
      .prepare('UPDATE companies SET invoice_count = ?, invoice_reset_date = ? WHERE id = ?')
      .run(nextCount, toDateOnlyString(resetBoundary), company.id);
    company.invoice_count = nextCount;

    const padded = `${nextCount}`.padStart(3, '0');
    return `${label}-${padded}`;
  }

  createCustomer(customer) {
    const insert = this.db.prepare(`
      INSERT INTO customers (name, contact_name, address, email, phone, org_number, post_number, post_location, vat_exempt, active, image_path)
      VALUES (@name, @contact_name, @address, @email, @phone, @org_number, @post_number, @post_location, @vat_exempt, @active, @image_path)
    `);

    const info = insert.run({
      name: customer.name,
      contact_name: customer.contactName || null,
      address: customer.address || null,
      email: customer.email || null,
      phone: customer.phone || null,
      org_number: customer.orgNumber || null,
      post_number: customer.postNumber || null,
      post_location: customer.postLocation || null,
      vat_exempt: customer.vatExempt ? 1 : 0,
      active: customer.active === false ? 0 : 1,
      image_path: customer.imagePath || null,
    });

    return this.db.prepare('SELECT * FROM customers WHERE id = ?').get(info.lastInsertRowid);
  }

  updateCustomer(customerId, updates) {
    const existing = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    if (!existing) {
      throw new Error('Customer not found');
    }

    const payload = {
      id: customerId,
      name: updates.name ?? existing.name,
      contact_name: updates.contactName !== undefined ? (updates.contactName || null) : existing.contact_name,
      address: updates.address !== undefined ? (updates.address || null) : existing.address,
      email: updates.email !== undefined ? (updates.email || null) : existing.email,
      phone: updates.phone !== undefined ? (updates.phone || null) : existing.phone,
      org_number: updates.orgNumber !== undefined ? (updates.orgNumber || null) : existing.org_number,
      post_number: updates.postNumber !== undefined ? (updates.postNumber || null) : existing.post_number,
      post_location: updates.postLocation !== undefined ? (updates.postLocation || null) : existing.post_location,
      vat_exempt: updates.vatExempt !== undefined ? (updates.vatExempt ? 1 : 0) : existing.vat_exempt,
      active: updates.active !== undefined ? (updates.active ? 1 : 0) : existing.active,
      image_path: updates.imagePath !== undefined ? (updates.imagePath || null) : existing.image_path,
    };

    this.db
      .prepare(
        `UPDATE customers
         SET name = @name,
             contact_name = @contact_name,
             address = @address,
             email = @email,
             phone = @phone,
             org_number = @org_number,
             post_number = @post_number,
             post_location = @post_location,
             vat_exempt = @vat_exempt,
             active = @active,
             image_path = @image_path,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = @id`
      )
      .run(payload);

    return this.db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
  }

  deleteCustomer(customerId) {
    const existing = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    if (!existing) {
      throw new Error('Customer not found');
    }

    this.db.prepare('DELETE FROM customers WHERE id = ?').run(customerId);
    return true;
  }

  createInvoice(invoice) {
    const customerId = invoice.customerId;
    const invoiceNumber = this.generateInvoiceNumber({
      invoiceDate: invoice.invoiceDate,
      budgetYearId: invoice.budgetYearId,
    });

    const items = invoice.items || [];
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const vatTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice * (item.vatRate ?? 0), 0);
    const total = subtotal + vatTotal;

    const transaction = this.db.transaction(() => {
      const insertInvoice = this.db.prepare(`
        INSERT INTO invoices (customer_id, invoice_number, invoice_date, due_date, vat_total, subtotal, total, notes, status, your_reference, our_reference, start_date, end_date, delivery_reference, reference, custom_fields, credited)
        VALUES (@customer_id, @invoice_number, @invoice_date, @due_date, @vat_total, @subtotal, @total, @notes, @status, @your_reference, @our_reference, @start_date, @end_date, @delivery_reference, @reference, @custom_fields, @credited)
      `);

      const invoiceInfo = insertInvoice.run({
        customer_id: customerId,
        invoice_number: invoiceNumber,
        invoice_date: toDateOnlyString(invoice.invoiceDate || new Date()),
        due_date: toDateOnlyString(invoice.dueDate || new Date()),
        vat_total: vatTotal,
        subtotal,
        total,
        notes: invoice.notes || null,
        status: invoice.status || 'draft',
        your_reference: invoice.yourReference || null,
        our_reference: invoice.ourReference || null,
        start_date: invoice.startDate ? toDateOnlyString(invoice.startDate) : null,
        end_date: invoice.endDate ? toDateOnlyString(invoice.endDate) : null,
        delivery_reference: invoice.deliveryReference || null,
        reference: invoice.reference || null,
        custom_fields: invoice.customFields ? JSON.stringify(invoice.customFields) : null,
        credited: invoice.credited ? 1 : 0,
      });

      const insertItem = this.db.prepare(`
        INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, vat_rate, line_total)
        VALUES (@invoice_id, @product_id, @description, @quantity, @unit_price, @vat_rate, @line_total)
      `);

      items.forEach((item) => {
        const lineTotal = item.quantity * item.unitPrice * (1 + (item.vatRate ?? 0));
        insertItem.run({
          invoice_id: invoiceInfo.lastInsertRowid,
          product_id: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          vat_rate: item.vatRate ?? null,
          line_total: lineTotal,
        });
      });

      return invoiceInfo.lastInsertRowid;
    });

    const invoiceId = transaction();
    this.logInvoiceEvent(invoiceId, 'created', 'Faktura opprettet');
    return this.db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
  }

  getInvoice(invoiceId) {
    const invoice = this.db.prepare(`
      SELECT invoices.*,
             customers.name  AS customer_name,
             customers.email AS customer_email
      FROM invoices
      LEFT JOIN customers ON customers.id = invoices.customer_id
      WHERE invoices.id = ?
    `).get(invoiceId);
    if (!invoice) return null;

    const items = this.db
      .prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id')
      .all(invoiceId);

    return {
      ...invoice,
      items: items.map((item) => ({
        id: item.id,
        productId: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        vatRate: item.vat_rate,
        lineTotal: item.line_total,
      })),
    };
  }

  updateInvoice(invoiceId, invoice) {
    const existing = this.db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    if (!existing) {
      throw new Error('Invoice not found');
    }

    // Capture existing items for diff
    const existingItems = this.db
      .prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id')
      .all(invoiceId);

    const items = invoice.items || [];
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const vatTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice * (item.vatRate ?? 0), 0);
    const total = subtotal + vatTotal;

    const transaction = this.db.transaction(() => {
      // Update invoice
      const updateInvoice = this.db.prepare(`
        UPDATE invoices
        SET customer_id = @customer_id,
            invoice_date = @invoice_date,
            due_date = @due_date,
            vat_total = @vat_total,
            subtotal = @subtotal,
            total = @total,
            notes = @notes,
            status = @status,
            payment_date = @payment_date,
            your_reference = @your_reference,
            our_reference = @our_reference,
            start_date = @start_date,
            end_date = @end_date,
            delivery_reference = @delivery_reference,
            reference = @reference,
            custom_fields = @custom_fields,
            credited = @credited,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `);

      updateInvoice.run({
        id: invoiceId,
        customer_id: invoice.customerId,
        invoice_date: toDateOnlyString(invoice.invoiceDate || new Date()),
        due_date: toDateOnlyString(invoice.dueDate || new Date()),
        vat_total: vatTotal,
        subtotal,
        total,
        notes: invoice.notes || null,
        status: invoice.status || 'draft',
        payment_date: invoice.paymentDate ? toDateOnlyString(invoice.paymentDate) : null,
        your_reference: invoice.yourReference || null,
        our_reference: invoice.ourReference || null,
        start_date: invoice.startDate ? toDateOnlyString(invoice.startDate) : null,
        end_date: invoice.endDate ? toDateOnlyString(invoice.endDate) : null,
        delivery_reference: invoice.deliveryReference || null,
        reference: invoice.reference || null,
        custom_fields: invoice.customFields ? JSON.stringify(invoice.customFields) : null,
        credited: invoice.credited ? 1 : 0,
      });

      // Delete existing items
      this.db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(invoiceId);

      // Insert new items
      const insertItem = this.db.prepare(`
        INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, vat_rate, line_total)
        VALUES (@invoice_id, @product_id, @description, @quantity, @unit_price, @vat_rate, @line_total)
      `);

      items.forEach((item) => {
        const lineTotal = item.quantity * item.unitPrice * (1 + (item.vatRate ?? 0));
        insertItem.run({
          invoice_id: invoiceId,
          product_id: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          vat_rate: item.vatRate ?? null,
          line_total: lineTotal,
        });
      });
    });

    transaction();

    // Build field diff for the log
    const fmtAmt = (v) => v != null ? `kr ${Number(v).toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
    const changes = [];

    if (existing.customer_id !== (invoice.customerId ?? null)) {
      const oldName = existing.customer_id
        ? this.db.prepare('SELECT name FROM customers WHERE id = ?').get(existing.customer_id)?.name ?? '—'
        : '—';
      const newName = invoice.customerId
        ? this.db.prepare('SELECT name FROM customers WHERE id = ?').get(invoice.customerId)?.name ?? '—'
        : '—';
      changes.push({ field: 'Kunde', from: oldName, to: newName });
    }
    const newInvoiceDate = toDateOnlyString(invoice.invoiceDate || new Date());
    if (existing.invoice_date !== newInvoiceDate)
      changes.push({ field: 'Fakturadato', from: existing.invoice_date ?? '—', to: newInvoiceDate });

    const newDueDate = toDateOnlyString(invoice.dueDate || new Date());
    if (existing.due_date !== newDueDate)
      changes.push({ field: 'Forfallsdato', from: existing.due_date ?? '—', to: newDueDate });

    if (Math.abs((existing.total ?? 0) - total) > 0.001)
      changes.push({ field: 'Beløp', from: fmtAmt(existing.total), to: fmtAmt(total) });

    if ((existing.notes ?? '') !== (invoice.notes ?? ''))
      changes.push({ field: 'Notater', from: existing.notes ?? '—', to: invoice.notes ?? '—' });

    if ((existing.your_reference ?? '') !== (invoice.yourReference ?? ''))
      changes.push({ field: 'Deres ref.', from: existing.your_reference ?? '—', to: invoice.yourReference ?? '—' });

    if ((existing.our_reference ?? '') !== (invoice.ourReference ?? ''))
      changes.push({ field: 'Vår ref.', from: existing.our_reference ?? '—', to: invoice.ourReference ?? '—' });

    if (existingItems.length !== items.length)
      changes.push({ field: 'Linjer', from: String(existingItems.length), to: String(items.length) });

    const postSend = ['sent', 'paid', 'overdue'].includes(existing.status);
    const eventType = postSend ? 'updated_after_send' : 'updated';
    const prefix = postSend ? 'Faktura redigert etter utsending' : 'Faktura redigert';

    const desc = changes.length === 0
      ? prefix
      : changes.length === 1
        ? `${prefix} · ${changes[0].field}: ${changes[0].from} → ${changes[0].to}`
        : `${prefix} · ${changes.length} felt endret`;

    this.logInvoiceEvent(
      invoiceId,
      eventType,
      desc,
      { ...(changes.length > 0 ? { changes } : {}), ...(postSend ? { statusAtEdit: existing.status } : {}) } || null,
    );
    return this.getInvoice(invoiceId);
  }

  updateInvoiceStatus(invoiceId, status, paymentDate = null) {
    const existing = this.db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    if (!existing) {
      throw new Error('Invoice not found');
    }

    const prevStatus = existing.status;

    this.db
      .prepare(
        `UPDATE invoices
         SET status = @status,
             payment_date = @payment_date,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = @id`
      )
      .run({
        id: invoiceId,
        status,
        payment_date: paymentDate ? toDateOnlyString(paymentDate) : null,
      });

    const statusLabels = {
      draft: 'Utkast', sent: 'Sendt', paid: 'Betalt',
      overdue: 'Forfalt', cancelled: 'Kansellert',
    };
    const from = statusLabels[prevStatus] || prevStatus;
    const to   = statusLabels[status]     || status;
    const desc = paymentDate
      ? `Status endret: ${from} → ${to} (betalt ${toDateOnlyString(paymentDate)})`
      : `Status endret: ${from} → ${to}`;
    this.logInvoiceEvent(invoiceId, 'status_changed', desc, { from: prevStatus, to: status });

    return this.getInvoice(invoiceId);
  }

  deleteInvoice(invoiceId) {
    const existing = this.db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    if (!existing) {
      throw new Error('Invoice not found');
    }

    // Items will be deleted via CASCADE
    this.db.prepare('DELETE FROM invoices WHERE id = ?').run(invoiceId);
    return true;
  }

  // ─── VAT (MVA) ────────────────────────────────────────────────────────────

  /**
   * Estimated VAT for one two-monthly term (see vatTerms.js).
   * Output VAT: invoices that are sent, paid or overdue and not credited,
   * by invoice date. Input VAT: VAT lines on expenses, by expense date.
   * Expenses without VAT lines cannot be counted and are reported as such.
   */
  getVatSummary(today = new Date()) {
    const term = relevantVatTerm(today);

    const output = this.db.prepare(`
      SELECT COALESCE(SUM(vat_total), 0) AS vat, COUNT(*) AS count
      FROM invoices
      WHERE invoice_date BETWEEN @start AND @end
        AND status IN ('sent', 'paid', 'overdue')
        AND COALESCE(credited, 0) = 0
    `).get(term);

    const input = this.db.prepare(`
      SELECT COALESCE(SUM(expense_items.quantity * expense_items.unit_price * COALESCE(expense_items.vat_rate, 0)), 0) AS vat
      FROM expense_items
      JOIN expenses ON expenses.id = expense_items.expense_id
      WHERE expenses.date BETWEEN @start AND @end
    `).get(term);

    const withoutVat = this.db.prepare(`
      SELECT COUNT(*) AS count
      FROM expenses
      WHERE date BETWEEN @start AND @end
        AND NOT EXISTS (
          SELECT 1 FROM expense_items
          WHERE expense_items.expense_id = expenses.id AND COALESCE(expense_items.vat_rate, 0) > 0
        )
    `).get(term);

    const round = (n) => Math.round(n * 100) / 100;
    return {
      ...term,
      outputVat: round(output.vat),
      inputVat: round(input.vat),
      payable: round(output.vat - input.vat),
      invoiceCount: output.count,
      expensesWithoutVat: withoutVat.count,
    };
  }

  // ─── Invoice event log ───────────────────────────────────────────────────────

  logInvoiceEvent(invoiceId, type, description, metadata = null) {
    try {
      this.db.prepare(
        `INSERT INTO invoice_events (invoice_id, type, description, metadata)
         VALUES (?, ?, ?, ?)`
      ).run(invoiceId, type, description, metadata ? JSON.stringify(metadata) : null);
    } catch (err) {
      // Never let logging break the main operation
      console.warn('[invoice_events] Failed to log event:', err.message);
    }
  }

  getInvoiceEvents(invoiceId) {
    try {
      const rows = this.db.prepare(
        `SELECT * FROM invoice_events WHERE invoice_id = ? ORDER BY created_at ASC`
      ).all(invoiceId);
      return rows.map((r) => ({
        ...r,
        metadata: r.metadata ? JSON.parse(r.metadata) : null,
      }));
    } catch {
      return [];
    }
  }

  addExpense(expense) {
    const items = expense.items || [];
    
    // Calculate total from items if provided, otherwise use amount
    let totalAmount = expense.amount || 0;
    if (items.length > 0) {
      totalAmount = items.reduce((sum, item) => {
        const lineTotal = (item.quantity || 1) * (item.unitPrice || 0) * (1 + (item.vatRate || 0));
        return sum + lineTotal;
      }, 0);
    }

    const transaction = this.db.transaction(() => {
      const insert = this.db.prepare(`
        INSERT INTO expenses (category_id, vendor, amount, currency, date, notes, attachment_path)
        VALUES (@category_id, @vendor, @amount, @currency, @date, @notes, @attachment_path)
      `);

      const info = insert.run({
        category_id: expense.categoryId || null,
        vendor: expense.vendor || null,
        amount: totalAmount,
        currency: expense.currency || 'NOK',
        date: toDateOnlyString(expense.date || new Date()),
        notes: expense.notes || null,
        attachment_path: expense.attachmentPath || null,
      });

      const expenseId = info.lastInsertRowid;

      // Insert expense items if provided
      if (items.length > 0) {
        const insertItem = this.db.prepare(`
          INSERT INTO expense_items (expense_id, description, quantity, unit_price, vat_rate, line_total)
          VALUES (@expense_id, @description, @quantity, @unit_price, @vat_rate, @line_total)
        `);

        items.forEach((item) => {
          const lineTotal = (item.quantity || 1) * (item.unitPrice || 0) * (1 + (item.vatRate || 0));
          insertItem.run({
            expense_id: expenseId,
            description: item.description,
            quantity: item.quantity || 1,
            unit_price: item.unitPrice || 0,
            vat_rate: item.vatRate ?? null,
            line_total: lineTotal,
          });
        });
      }

      return expenseId;
    });

    const expenseId = transaction();
    return this.getExpense(expenseId);
  }

  createExpenseCategory(category) {
    // Auto-assign color from palette if not provided
    let color = category.color || null;
    if (!color) {
      const count = this.db.prepare('SELECT COUNT(*) as n FROM expense_categories').get().n;
      color = CATEGORY_COLOR_PALETTE[count % CATEGORY_COLOR_PALETTE.length];
    }

    const insert = this.db.prepare(`
      INSERT INTO expense_categories (name, parent_id, color)
      VALUES (@name, @parent_id, @color)
    `);

    const info = insert.run({
      name: category.name,
      parent_id: category.parentId || null,
      color,
    });

    return this.db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(info.lastInsertRowid);
  }

  listExpenseCategories() {
    return this.db.prepare('SELECT * FROM expense_categories ORDER BY name').all();
  }

  getExpense(expenseId) {
    const expense = this.db.prepare('SELECT * FROM expenses WHERE id = ?').get(expenseId);
    if (!expense) return null;
    
    // Get category name if exists
    if (expense.category_id) {
      const category = this.db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(expense.category_id);
      if (category) {
        expense.category_name = category.name;
      }
    }
    
    // Get expense items
    const items = this.db.prepare('SELECT * FROM expense_items WHERE expense_id = ? ORDER BY id').all(expenseId);
    expense.items = items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      vatRate: item.vat_rate,
      lineTotal: item.line_total,
    }));
    
    return expense;
  }

  updateExpense(expenseId, updates) {
    const existing = this.db.prepare('SELECT * FROM expenses WHERE id = ?').get(expenseId);
    if (!existing) {
      throw new Error('Expense not found');
    }

    const items = updates.items || [];
    
    // Calculate total from items if provided, otherwise use amount
    let totalAmount = updates.amount !== undefined ? updates.amount : existing.amount;
    if (items.length > 0) {
      totalAmount = items.reduce((sum, item) => {
        const lineTotal = (item.quantity || 1) * (item.unitPrice || 0) * (1 + (item.vatRate || 0));
        return sum + lineTotal;
      }, 0);
    }

    const transaction = this.db.transaction(() => {
      const payload = {
        id: expenseId,
        category_id: updates.categoryId !== undefined ? (updates.categoryId || null) : existing.category_id,
        vendor: updates.vendor !== undefined ? (updates.vendor || null) : existing.vendor,
        amount: totalAmount,
        currency: updates.currency !== undefined ? updates.currency : existing.currency,
        date: updates.date !== undefined ? toDateOnlyString(updates.date) : existing.date,
        notes: updates.notes !== undefined ? (updates.notes || null) : existing.notes,
        attachment_path: updates.attachmentPath !== undefined ? (updates.attachmentPath || null) : existing.attachment_path,
      };

      this.db
        .prepare(
          `UPDATE expenses
           SET category_id = @category_id,
               vendor = @vendor,
               amount = @amount,
               currency = @currency,
               date = @date,
               notes = @notes,
               attachment_path = @attachment_path,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = @id`
        )
        .run(payload);

      // Delete existing items
      this.db.prepare('DELETE FROM expense_items WHERE expense_id = ?').run(expenseId);

      // Insert new items if provided
      if (items.length > 0) {
        const insertItem = this.db.prepare(`
          INSERT INTO expense_items (expense_id, description, quantity, unit_price, vat_rate, line_total)
          VALUES (@expense_id, @description, @quantity, @unit_price, @vat_rate, @line_total)
        `);

        items.forEach((item) => {
          const lineTotal = (item.quantity || 1) * (item.unitPrice || 0) * (1 + (item.vatRate || 0));
          insertItem.run({
            expense_id: expenseId,
            description: item.description,
            quantity: item.quantity || 1,
            unit_price: item.unitPrice || 0,
            vat_rate: item.vatRate ?? null,
            line_total: lineTotal,
          });
        });
      }
    });

    transaction();
    return this.getExpense(expenseId);
  }

  deleteExpense(expenseId) {
    const existing = this.db.prepare('SELECT * FROM expenses WHERE id = ?').get(expenseId);
    if (!existing) {
      throw new Error('Expense not found');
    }

    this.db.prepare('DELETE FROM expenses WHERE id = ?').run(expenseId);
    return true;
  }

  getExpenseCategory(categoryId) {
    return this.db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(categoryId);
  }

  updateExpenseCategory(categoryId, updates) {
    const existing = this.db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(categoryId);
    if (!existing) {
      throw new Error('Expense category not found');
    }

    const payload = {
      id: categoryId,
      name: updates.name !== undefined ? updates.name : existing.name,
      parent_id: updates.parentId !== undefined ? (updates.parentId || null) : existing.parent_id,
      color: updates.color !== undefined ? updates.color : existing.color,
    };

    this.db
      .prepare(
        `UPDATE expense_categories
         SET name = @name,
             parent_id = @parent_id,
             color = @color,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = @id`
      )
      .run(payload);

    return this.db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(categoryId);
  }

  deleteExpenseCategory(categoryId) {
    const existing = this.db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(categoryId);
    if (!existing) {
      throw new Error('Expense category not found');
    }

    // Check if category is used by any expenses
    const expenseCount = this.db.prepare('SELECT COUNT(*) as count FROM expenses WHERE category_id = ?').get(categoryId);
    if (expenseCount.count > 0) {
      throw new Error('Cannot delete category that is used by expenses');
    }

    this.db.prepare('DELETE FROM expense_categories WHERE id = ?').run(categoryId);
    return true;
  }

  getBudgetYearRange(budgetYearId) {
    if (budgetYearId) {
      const record = this.db.prepare('SELECT * FROM budget_years WHERE id = ?').get(budgetYearId);
      if (record) {
        return {
          start: record.start_date,
          end: record.end_date,
        };
      }
    }

    const now = new Date();
    const start = `${now.getFullYear()}-01-01`;
    const end = `${now.getFullYear()}-12-31`;
    return { start, end };
  }

  listInvoicesForBudgetYear(budgetYearId, limit = 10) {
    const { start, end } = this.getBudgetYearRange(budgetYearId);

    const query = `
      SELECT
        invoices.id,
        invoices.invoice_number,
        invoices.invoice_date,
        invoices.due_date,
        invoices.total,
        invoices.status,
        invoices.payment_date,
        customers.name as customer_name,
        (SELECT MAX(created_at) FROM invoice_events
          WHERE invoice_events.invoice_id = invoices.id AND invoice_events.type = 'reminder_sent') as last_reminder_at,
        (SELECT COUNT(*) FROM invoice_events
          WHERE invoice_events.invoice_id = invoices.id AND invoice_events.type = 'reminder_sent') as reminder_count
      FROM invoices
      LEFT JOIN customers ON customers.id = invoices.customer_id
      WHERE invoices.invoice_date BETWEEN @start AND @end
      ORDER BY invoices.invoice_date DESC
      ${limit != null ? 'LIMIT @limit' : ''}
    `;

    const params = limit != null ? { start, end, limit } : { start, end };
    const rows = this.db.prepare(query).all(params);

    return rows.map((row) => ({
      dbId: row.id,
      id: row.invoice_number || `#${row.id}`,
      customer: row.customer_name || 'Ukjent kunde',
      amount: row.total ?? 0,
      status: row.status || 'draft',
      date: row.invoice_date,
      due_date: row.due_date,
      payment_date: row.payment_date,
      last_reminder_at: row.last_reminder_at || null,
      reminder_count: row.reminder_count || 0,
    }));
  }

  listExpensesForBudgetYear(budgetYearId, limit = 10) {
    const { start, end } = this.getBudgetYearRange(budgetYearId);

    const query = `
      SELECT
        expenses.*,
        expense_categories.name as category_name,
        expense_categories.color as category_color
      FROM expenses
      LEFT JOIN expense_categories ON expense_categories.id = expenses.category_id
      WHERE expenses.date BETWEEN @start AND @end
      ORDER BY expenses.date DESC
      ${limit != null ? 'LIMIT @limit' : ''}
    `;

    const params = limit != null ? { start, end, limit } : { start, end };
    const rows = this.db.prepare(query).all(params);

    return rows.map((row) => ({
      id: row.id,
      vendor: row.vendor || 'Ukjent leverandør',
      amount: row.amount ?? 0,
      category_name: row.category_name || null,
      category_color: row.category_color || null,
      date: row.date,
      currency: row.currency || 'NOK',
      category_id: row.category_id,
      notes: row.notes,
      attachment_path: row.attachment_path,
    }));
  }

  getExpenseCategoryBreakdown(budgetYearId) {
    const { start, end } = this.getBudgetYearRange(budgetYearId);

    const rows = this.db.prepare(`
      SELECT
        ec.id,
        ec.name,
        ec.color,
        COALESCE(SUM(e.amount), 0) AS total
      FROM expense_categories ec
      LEFT JOIN expenses e
        ON e.category_id = ec.id
        AND e.date BETWEEN @start AND @end
      GROUP BY ec.id
      ORDER BY total DESC
    `).all({ start, end });

    // Include uncategorised row
    const uncatTotal = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE category_id IS NULL
        AND date BETWEEN @start AND @end
    `).get({ start, end }).total;

    const result = rows.filter((r) => r.total > 0);

    if (uncatTotal > 0) {
      result.push({ id: null, name: 'Ukategorisert', color: '#555555', total: uncatTotal });
    }

    return result;
  }

  listCustomers() {
    return this.db.prepare('SELECT * FROM customers ORDER BY name').all();
  }

  createProduct(product) {
    const insert = this.db.prepare(`
      INSERT INTO products (name, sku, description, unit_price, vat_rate, unit, active, image_path)
      VALUES (@name, @sku, @description, @unit_price, @vat_rate, @unit, @active, @image_path)
    `);

    const info = insert.run({
      name: product.name,
      sku: product.sku || null,
      description: product.description || null,
      unit_price: product.unitPrice,
      vat_rate: product.vatRate ?? null,
      unit: product.unit || null,
      active: product.active === false ? 0 : 1,
      image_path: product.imagePath || null,
    });

    return this.db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  }

  listProducts({ includeInactive = false } = {}) {
    const query = includeInactive
      ? 'SELECT * FROM products ORDER BY name'
      : 'SELECT * FROM products WHERE active = 1 ORDER BY name';

    return this.db.prepare(query).all();
  }

  setProductActive(productId, active) {
    const activeValue = active === true || active === 1 || active === '1' ? 1 : 0;
    this.db
      .prepare('UPDATE products SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(activeValue, productId);

    return this.db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  }

  updateProduct(productId, updates) {
    const existing = this.db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!existing) {
      throw new Error('Product not found');
    }

    const payload = {
      id: productId,
      name: updates.name ?? existing.name,
      sku: updates.sku ?? existing.sku,
      description: updates.description ?? existing.description,
      unit_price: updates.unitPrice ?? existing.unit_price,
      vat_rate: updates.vatRate ?? existing.vat_rate,
      unit: updates.unit ?? existing.unit,
      active: updates.active !== undefined ? (updates.active ? 1 : 0) : existing.active,
      image_path: updates.imagePath !== undefined ? (updates.imagePath || null) : existing.image_path,
    };

    this.db
      .prepare(
        `UPDATE products
         SET name = @name,
             sku = @sku,
             description = @description,
             unit_price = @unit_price,
             vat_rate = @vat_rate,
             unit = @unit,
             active = @active,
             image_path = @image_path,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = @id`
      )
      .run(payload);

    return this.db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  }

  deleteProduct(productId) {
    const existing = this.db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!existing) {
      throw new Error('Product not found');
    }

    this.db.prepare('DELETE FROM products WHERE id = ?').run(productId);
    return true;
  }

  linkExpenseToInvoice(invoiceId, expenseId) {
    this.db
      .prepare('INSERT OR IGNORE INTO invoice_expense_links (invoice_id, expense_id) VALUES (?, ?)')
      .run(invoiceId, expenseId);
  }

  getIncomeExpenseSummary(budgetYearId) {
    const budgetYear = budgetYearId
      ? this.db.prepare('SELECT * FROM budget_years WHERE id = ?').get(budgetYearId)
      : this.ensureCurrentBudgetYear();

    const startDate = toDateOnlyString(budgetYear.start_date);
    const endDate = toDateOnlyString(budgetYear.end_date);

    const incomeRow = this.db
      .prepare('SELECT COALESCE(SUM(total), 0) as income FROM invoices WHERE invoice_date BETWEEN ? AND ?')
      .get(startDate, endDate);
    const expenseRow = this.db
      .prepare('SELECT COALESCE(SUM(amount), 0) as expenses FROM expenses WHERE date BETWEEN ? AND ?')
      .get(startDate, endDate);
    
    // Calculate overdue and unpaid amounts
    const overdueRow = this.db
      .prepare('SELECT COALESCE(SUM(total), 0) as overdue FROM invoices WHERE invoice_date BETWEEN ? AND ? AND status = ?')
      .get(startDate, endDate, 'overdue');
    const unpaidRow = this.db
      .prepare('SELECT COALESCE(SUM(total), 0) as unpaid FROM invoices WHERE invoice_date BETWEEN ? AND ? AND status = ?')
      .get(startDate, endDate, 'sent');
    
    // Calculate paid amount (invoices with status 'paid')
    const paidRow = this.db
      .prepare('SELECT COALESCE(SUM(total), 0) as paid FROM invoices WHERE invoice_date BETWEEN ? AND ? AND status = ?')
      .get(startDate, endDate, 'paid');

    const income = incomeRow.income;
    const expenses = expenseRow.expenses;
    const overdue = overdueRow.overdue;
    const unpaid = unpaidRow.unpaid;
    const paid = paidRow.paid;

    return {
      budgetYear,
      income,
      expenses,
      net: income - expenses,
      overdue,
      unpaid,
      paid,
    };
  }

  listBudgetYears() {
    return this.db.prepare('SELECT * FROM budget_years ORDER BY start_date').all();
  }

  updateBudgetYear({ id, label, startDate, endDate }) {
    const existing = this.db.prepare('SELECT * FROM budget_years WHERE id = ?').get(id);
    if (!existing) {
      throw new Error('Budget year not found');
    }

    const payload = {
      id,
      label: label ?? existing.label,
      start_date: startDate ? toDateOnlyString(startDate) : existing.start_date,
      end_date: endDate ? toDateOnlyString(endDate) : existing.end_date,
    };

    this.db
      .prepare(
        `UPDATE budget_years
         SET label = @label,
             start_date = @start_date,
             end_date = @end_date,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = @id`
      )
      .run(payload);

    return this.db.prepare('SELECT * FROM budget_years WHERE id = ?').get(id);
  }

  deleteBudgetYear(id) {
    const existing = this.db.prepare('SELECT * FROM budget_years WHERE id = ?').get(id);
    if (!existing) {
      return false;
    }

    // Prevent deleting the current active year to avoid confusing state.
    if (existing.is_current) {
      throw new Error('Cannot delete the active budget year');
    }

    const result = this.db.prepare('DELETE FROM budget_years WHERE id = ?').run(id);
    return result.changes > 0;
  }

  setCurrentBudgetYear(budgetYearId) {
    const existing = this.db.prepare('SELECT * FROM budget_years WHERE id = ?').get(budgetYearId);
    if (!existing) {
      throw new Error('Budget year not found');
    }

    const transaction = this.db.transaction(() => {
      this.db.prepare('UPDATE budget_years SET is_current = 0').run();
      this.db.prepare('UPDATE budget_years SET is_current = 1 WHERE id = ?').run(budgetYearId);
    });

    transaction();
    return this.getCurrentBudgetYear();
  }

  getSetting(key, defaultValue = null) {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : defaultValue;
  }

  setSetting(key, value) {
    this.db
      .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .run(key, String(value));
    return this.getSetting(key);
  }

  // ──────────────────────────────────────────────────
  // Monthly breakdown (Task 03)
  // ──────────────────────────────────────────────────

  getMonthlyBreakdown(budgetYearId) {
    const budgetYear = budgetYearId
      ? this.db.prepare('SELECT * FROM budget_years WHERE id = ?').get(budgetYearId)
      : this.ensureCurrentBudgetYear();

    const startDate = toDateOnlyString(budgetYear.start_date);
    const endDate = toDateOnlyString(budgetYear.end_date);

    const invoiceRows = this.db.prepare(`
      SELECT
        strftime('%Y-%m', invoice_date) as month,
        SUM(total) as total
      FROM invoices
      WHERE invoice_date BETWEEN ? AND ?
        AND status IN ('paid', 'sent', 'overdue')
      GROUP BY month
      ORDER BY month
    `).all(startDate, endDate);

    const expenseRows = this.db.prepare(`
      SELECT
        strftime('%Y-%m', date) as month,
        SUM(amount) as total
      FROM expenses
      WHERE date BETWEEN ? AND ?
      GROUP BY month
      ORDER BY month
    `).all(startDate, endDate);

    // Build full month list for the budget year range
    const months = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    let current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      months.push(key);
      current.setMonth(current.getMonth() + 1);
    }

    const incomeByMonth = Object.fromEntries(invoiceRows.map((r) => [r.month, r.total]));
    const expenseByMonth = Object.fromEntries(expenseRows.map((r) => [r.month, r.total]));

    return months.map((month) => ({
      month,
      label: new Date(month + '-01').toLocaleDateString('nb-NO', { month: 'short', year: '2-digit' }),
      income: incomeByMonth[month] || 0,
      expenses: expenseByMonth[month] || 0,
      net: (incomeByMonth[month] || 0) - (expenseByMonth[month] || 0),
    }));
  }

  // ──────────────────────────────────────────────────
  // Expense-invoice linking (Task 03)
  // ──────────────────────────────────────────────────

  getExpensesForInvoice(invoiceId) {
    return this.db.prepare(`
      SELECT expenses.*, expense_categories.name as category_name
      FROM expenses
      JOIN invoice_expense_links ON invoice_expense_links.expense_id = expenses.id
      LEFT JOIN expense_categories ON expense_categories.id = expenses.category_id
      WHERE invoice_expense_links.invoice_id = ?
      ORDER BY expenses.date DESC
    `).all(invoiceId);
  }

  getUnlinkedExpenses(budgetYearId) {
    const { start, end } = this.getBudgetYearRange(budgetYearId);
    return this.db.prepare(`
      SELECT expenses.*, expense_categories.name as category_name
      FROM expenses
      LEFT JOIN invoice_expense_links ON invoice_expense_links.expense_id = expenses.id
      LEFT JOIN expense_categories ON expense_categories.id = expenses.category_id
      WHERE invoice_expense_links.invoice_id IS NULL
        AND expenses.date BETWEEN ? AND ?
      ORDER BY expenses.date DESC
    `).all(start, end);
  }

  unlinkExpenseFromInvoice(invoiceId, expenseId) {
    this.db.prepare(
      'DELETE FROM invoice_expense_links WHERE invoice_id = ? AND expense_id = ?'
    ).run(invoiceId, expenseId);
    return true;
  }

  getAllSettings() {
    const rows = this.db.prepare('SELECT key, value FROM settings').all();
    return rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  }

  // Bulk import methods
  bulkCreateCustomers(customers) {
    const insert = this.db.prepare(`
      INSERT INTO customers (name, contact_name, address, email, phone, org_number, post_number, post_location, vat_exempt, active, image_path)
      VALUES (@name, @contact_name, @address, @email, @phone, @org_number, @post_number, @post_location, @vat_exempt, @active, @image_path)
    `);

    const transaction = this.db.transaction((customers) => {
      const results = [];
      for (const customer of customers) {
        const info = insert.run({
          name: customer.name || '',
          contact_name: customer.contact_name || customer.contactName || null,
          address: customer.address || null,
          email: customer.email || null,
          phone: customer.phone || null,
          org_number: customer.org_number || customer.orgNumber || null,
          post_number: customer.post_number || customer.postNumber || null,
          post_location: customer.post_location || customer.postLocation || null,
          vat_exempt: customer.vat_exempt || customer.vatExempt ? 1 : 0,
          active: customer.active !== false ? 1 : 0,
          image_path: customer.image_path || customer.imagePath || null,
        });
        results.push(info.lastInsertRowid);
      }
      return results;
    });

    return transaction(customers);
  }

  bulkCreateProducts(products) {
    const insert = this.db.prepare(`
      INSERT INTO products (name, sku, description, unit_price, vat_rate, unit, active, image_path)
      VALUES (@name, @sku, @description, @unit_price, @vat_rate, @unit, @active, @image_path)
    `);

    const transaction = this.db.transaction((products) => {
      const results = [];
      for (const product of products) {
        const info = insert.run({
          name: product.name || '',
          sku: product.sku || null,
          description: product.description || null,
          unit_price: product.unit_price || product.unitPrice || 0,
          vat_rate: product.vat_rate !== undefined ? product.vat_rate : (product.vatRate !== undefined ? product.vatRate : null),
          unit: product.unit || null,
          active: product.active !== false ? 1 : 0,
          image_path: product.image_path || product.imagePath || null,
        });
        results.push(info.lastInsertRowid);
      }
      return results;
    });

    return transaction(products);
  }
}

function openFatternDatabase() {
  // initializeDatabase already applies the schema and opens the same DB path.
  // This helper mirrors better-sqlite3's API for advanced usage when the class is not needed.
  initializeDatabase();
  const Database = loadBetterSqlite3();
  return new Database(DB_PATH);
}

module.exports = {
  FatternDatabase,
  openFatternDatabase,
};
