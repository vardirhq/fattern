const { ipcMain } = require('electron');

function toDate(value, fallback = new Date()) {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function registerDatabaseHandlers(database) {
  if (!database) {
    throw new Error('Database instance is required to register handlers');
  }

  const handle = (channel, handler) => {
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        return await handler(...args);
      } catch (error) {
        console.error(`[IPC:${channel}]`, error);
        throw error;
      }
    });
  };

  handle('db:ensure-company', (defaults = {}) => database.ensureCompany(defaults));
  handle('db:update-company', (updates = {}) => database.updateCompany(updates));
  handle('db:get-income-expense-summary', (budgetYearId) =>
    database.getIncomeExpenseSummary(budgetYearId)
  );
  handle('db:list-budget-years', () => database.listBudgetYears());
  handle('db:create-budget-year', (payload = {}) =>
    database.createBudgetYear({
      label: payload.label || `${toDate(payload.startDate).getFullYear()}`,
      startDate: toDate(payload.startDate),
      endDate: toDate(payload.endDate, toDate(payload.startDate)),
      isCurrent: Boolean(payload.isCurrent),
    })
  );
  handle('db:set-current-budget-year', (budgetYearId) =>
    database.setCurrentBudgetYear(budgetYearId)
  );
  handle('db:update-budget-year', (payload = {}) =>
    database.updateBudgetYear({
      id: payload.id,
      label: payload.label,
      startDate: toDate(payload.startDate, undefined),
      endDate: toDate(payload.endDate, undefined),
    })
  );
  handle('db:delete-budget-year', (budgetYearId) =>
    database.deleteBudgetYear(budgetYearId)
  );

  handle('db:create-customer', (customer) => database.createCustomer(customer));
  handle('db:update-customer', (customerId, updates) => database.updateCustomer(customerId, updates));
  handle('db:delete-customer', (customerId) => database.deleteCustomer(customerId));
  handle('db:create-invoice', (invoice) => database.createInvoice(invoice));
  handle('db:get-invoice', (invoiceId) => database.getInvoice(invoiceId));
  handle('db:update-invoice', (invoiceId, invoice) => database.updateInvoice(invoiceId, invoice));
  handle('db:update-invoice-status', (invoiceId, status, paymentDate) => database.updateInvoiceStatus(invoiceId, status, paymentDate));
  handle('db:delete-invoice', (invoiceId) => database.deleteInvoice(invoiceId));

  handle('db:create-expense', (expense = {}) =>
    database.addExpense({
      ...expense,
      date: toDate(expense.date),
    })
  );
  handle('db:get-expense', (expenseId) => database.getExpense(expenseId));
  handle('db:update-expense', (expenseId, expense = {}) =>
    database.updateExpense(expenseId, {
      ...expense,
      date: expense.date ? toDate(expense.date) : undefined,
    })
  );
  handle('db:delete-expense', (expenseId) => database.deleteExpense(expenseId));
  handle('db:create-expense-category', (category) => database.createExpenseCategory(category));
  handle('db:get-expense-category', (categoryId) => database.getExpenseCategory(categoryId));
  handle('db:update-expense-category', (categoryId, category) => database.updateExpenseCategory(categoryId, category));
  handle('db:delete-expense-category', (categoryId) => database.deleteExpenseCategory(categoryId));
  handle('db:list-expense-categories', () => database.listExpenseCategories());
  handle('db:get-expense-category-breakdown', ({ budgetYearId }) =>
    database.getExpenseCategoryBreakdown(budgetYearId)
  );
  handle('db:list-invoices', ({ budgetYearId, limit } = {}) =>
    database.listInvoicesForBudgetYear(budgetYearId, limit)
  );
  handle('db:list-expenses', ({ budgetYearId, limit } = {}) =>
    database.listExpensesForBudgetYear(budgetYearId, limit)
  );
  handle('db:list-customers', () => database.listCustomers());
  handle('db:list-products', (options = {}) => database.listProducts(options));
  handle('db:create-product', (product) => database.createProduct(product));
  handle('db:update-product', (productId, updates) => database.updateProduct(productId, updates));
  handle('db:delete-product', (productId) => database.deleteProduct(productId));
  handle('db:set-product-active', (productId, active) => database.setProductActive(productId, active));
  handle('db:get-setting', (key, defaultValue) => database.getSetting(key, defaultValue));
  handle('db:set-setting', (key, value) => database.setSetting(key, value));
  handle('db:get-all-settings', () => database.getAllSettings());

  // Import handlers
  handle('db:bulk-create-customers', (customers) => database.bulkCreateCustomers(customers));
  handle('db:bulk-create-products', (products) => database.bulkCreateProducts(products));

  // Task 03 — Monthly breakdown + expense-invoice linking
  handle('db:get-monthly-breakdown', (budgetYearId) =>
    database.getMonthlyBreakdown(budgetYearId)
  );
  handle('db:get-expenses-for-invoice', (invoiceId) =>
    database.getExpensesForInvoice(invoiceId)
  );
  handle('db:get-unlinked-expenses', (budgetYearId) =>
    database.getUnlinkedExpenses(budgetYearId)
  );
  handle('db:link-expense-to-invoice', (invoiceId, expenseId) =>
    database.linkExpenseToInvoice(invoiceId, expenseId)
  );
  handle('db:unlink-expense-from-invoice', (invoiceId, expenseId) =>
    database.unlinkExpenseFromInvoice(invoiceId, expenseId)
  );

  // Invoice event log
  handle('db:get-invoice-events', (invoiceId) => database.getInvoiceEvents(invoiceId));
  handle('db:get-vat-summary', () => database.getVatSummary());
  handle('db:log-invoice-event', (invoiceId, type, description, metadata) =>
    database.logInvoiceEvent(invoiceId, type, description, metadata)
  );
}

module.exports = {
  registerDatabaseHandlers,
};

