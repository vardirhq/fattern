/**
 * Which invoice template a PDF should use.
 *
 * The bare "default_invoice" template has no seller, customer, totals or
 * payment details, so people who never picked a template get the complete
 * "Nordisk Pro" preset instead. An explicit choice is always kept.
 * A template that is not installed in template storage yet falls back to
 * its built-in definition.
 */
const definitions = require('./templates');

const DEFAULT_TEMPLATE_ID = 'preset_nordisk_pro';

function resolveInvoiceTemplate(storage, templateId) {
  const id = templateId || DEFAULT_TEMPLATE_ID;
  const stored = storage.loadTemplate(id);
  if (stored) return stored;
  const builtIn = definitions.getAllTemplates().find((t) => t.meta?.id === id);
  return builtIn || null;
}

module.exports = { resolveInvoiceTemplate, DEFAULT_TEMPLATE_ID };
