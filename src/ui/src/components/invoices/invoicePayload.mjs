/**
 * Turns the invoice editor's form state into the payload that
 * `db.createInvoice` / `db.updateInvoice` expect.
 *
 * Kept free of React so it can be exercised against a real database
 * (see scripts/check-invoice-save.mjs). The .mjs extension lets that
 * script import it under Electron's Node, where this package is CommonJS.
 */
export function buildInvoicePayload({
  customerId,
  invoiceDate,
  dueDate,
  status,
  notes = '',
  yourReference = '',
  ourReference = '',
  startDate = '',
  endDate = '',
  deliveryReference = '',
  reference = '',
  credited = false,
  items = [],
}) {
  return {
    customerId: parseInt(customerId),
    invoiceDate,
    dueDate,
    status,
    notes: notes.trim() || null,
    yourReference: yourReference.trim() || null,
    ourReference: ourReference.trim() || null,
    startDate: startDate || null,
    endDate: endDate || null,
    deliveryReference: deliveryReference.trim() || null,
    reference: reference.trim() || null,
    credited: credited,
    items: items.map((item) => ({
      productId: item.productId ? parseInt(item.productId) : null,
      description: item.description.trim(),
      quantity: parseFloat(item.quantity),
      unitPrice: parseFloat(item.unitPrice),
      vatRate: parseFloat(item.vatRate),
    })),
  };
}

/** The lines the editor keeps on save: described, positive quantity and price. */
export function validInvoiceItems(items = []) {
  return items.filter((item) => item.description.trim() && item.quantity > 0 && item.unitPrice > 0);
}
