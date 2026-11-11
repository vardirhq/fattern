/**
 * Smoke check for the invoice editor's save path.
 *
 * Builds create and edit payloads with the same function the editor uses
 * (buildInvoicePayload), sends them to a real FatternDatabase in a
 * throwaway folder, and checks what comes back. Your own data is never
 * touched: FATTERN_ROOT points at a temporary directory.
 *
 * Run with: npm run check:invoice-save
 * (runs under Electron's Node, so better-sqlite3 must be built for
 * Electron, which `npm install` does.)
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fattern-check-'));
process.env.FATTERN_ROOT = root;

const require = createRequire(import.meta.url);
const { FatternDatabase } = require('../src/db/fatternDatabase.js');
const { buildInvoicePayload, validInvoiceItems } = await import(
  '../src/ui/src/components/invoices/invoicePayload.mjs'
);

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`  ok    ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL  ${name}\n        ${error.message.split('\n').join('\n        ')}`);
  }
}

const db = new FatternDatabase();
try {
  const year = db.listBudgetYears().find((y) => y.is_current) || db.listBudgetYears()[0];
  const customer = db.createCustomer({ name: 'Havbris Eiendom AS', email: 'faktura@havbris.no' });
  const product = db.createProduct({ name: 'Designsprint', unitPrice: 1250, vatRate: 0.25, unit: 'time' });

  // Form state as the editor holds it after picking a customer, adding a
  // product, adding a typed line and leaving one blank line.
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const formItems = [
    { id: 'temp-1', productId: product.id, description: 'Designsprint', quantity: 12, unitPrice: 1250, vatRate: 0.25 },
    { id: 'temp-2', productId: '', description: 'Reise Oslo–Bergen', quantity: 1, unitPrice: 2000, vatRate: 0.25 },
    { id: 'temp-3', productId: '', description: '', quantity: 1, unitPrice: 0, vatRate: 0.25 },
  ];

  console.log('Create');
  const createPayload = buildInvoicePayload({
    customerId: String(customer.id),
    invoiceDate: today,
    dueDate: due,
    status: 'draft',
    notes: '  Takk for samarbeidet!  ',
    yourReference: 'Ingrid Solheim',
    items: validInvoiceItems(formItems),
  });
  createPayload.budgetYearId = year.id; // App.jsx adds this before calling createInvoice

  check('blank line is dropped before save', () => assert.equal(createPayload.items.length, 2));
  const created = db.createInvoice(createPayload);
  check('createInvoice returns an id', () => assert.ok(created?.id));

  const saved = db.getInvoice(created.id);
  check('customer is stored', () => assert.equal(saved.customer_id, customer.id));
  check('dates are stored', () => {
    assert.equal(saved.invoice_date, today);
    assert.equal(saved.due_date, due);
  });
  check('notes are trimmed', () => assert.equal(saved.notes, 'Takk for samarbeidet!'));
  check('reference is stored', () => assert.equal(saved.your_reference, 'Ingrid Solheim'));
  check('two lines are stored, product link kept', () => {
    assert.equal(saved.items.length, 2);
    assert.equal(saved.items[0].productId, product.id);
    assert.equal(saved.items[1].productId, null);
  });
  check('totals are calculated (17 000 + 4 250 MVA = 21 250)', () => {
    assert.equal(saved.subtotal, 17000);
    assert.equal(saved.vat_total, 4250);
    assert.equal(saved.total, 21250);
  });
  check('an invoice number is assigned', () => assert.ok(saved.invoice_number));

  const listed = db.listInvoicesForBudgetYear(year.id, null).find((inv) => inv.dbId === created.id);
  check('list includes due_date (used for days overdue)', () => assert.equal(listed?.due_date, due));

  console.log('Edit');
  // Form state as the editor initialises it from getInvoice(), then the
  // user changes a quantity and the status.
  const editItems = saved.items.map((item) => ({
    id: item.id,
    productId: item.productId || '',
    description: item.description || '',
    quantity: item.quantity || 1,
    unitPrice: item.unitPrice || 0,
    vatRate: item.vatRate != null ? item.vatRate : 0.25,
  }));
  editItems[0].quantity = 16;
  const editPayload = buildInvoicePayload({
    customerId: saved.customer_id,
    invoiceDate: saved.invoice_date,
    dueDate: saved.due_date,
    status: 'sent',
    notes: saved.notes || '',
    yourReference: saved.your_reference || '',
    items: validInvoiceItems(editItems),
  });
  db.updateInvoice(created.id, editPayload);

  const edited = db.getInvoice(created.id);
  check('status is updated', () => assert.equal(edited.status, 'sent'));
  check('quantity change is saved', () => assert.equal(edited.items[0].quantity, 16));
  check('totals are recalculated', () => assert.equal(edited.total, (16 * 1250 + 2000) * 1.25));
  check('invoice number is unchanged', () => assert.equal(edited.invoice_number, saved.invoice_number));
} finally {
  db.close();
  fs.rmSync(root, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
