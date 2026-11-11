/**
 * EHF (Peppol BIS Billing 3.0) IPC handlers.
 *
 * - ehf:check   build the EHF for an invoice and report problems (offline)
 * - ehf:save    write the EHF XML to a file the user picks (offline)
 * - ehf:lookup  ask the public Peppol Directory whether an organisation
 *               can receive EHF invoices (the only online step; free, no key)
 */
const fs = require('fs');
const { BrowserWindow, dialog } = require('electron');
const { INVOICE_DOCTYPE, ORG_SCHEME, isValidOrgNumber } = require('../db/ehf');

const DIRECTORY_URL = 'https://directory.peppol.eu/search/1.0/json';

async function lookupPeppolReceiver(orgNumber, { timeoutMs = 8000 } = {}) {
  const org = String(orgNumber ?? '').replace(/\D/g, '');
  if (!isValidOrgNumber(org)) return { status: 'invalid' };

  const participant = `iso6523-actorid-upis::${ORG_SCHEME}:${org}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${DIRECTORY_URL}?participant=${encodeURIComponent(participant)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return { status: 'unknown', error: `HTTP ${response.status}` };
    const data = await response.json();
    const match = (data.matches || [])[0];
    if (!match) return { status: 'not_registered' };
    const docTypes = (match.docTypes || []).map((d) => d.value);
    const acceptsInvoice = docTypes.some((value) => value === INVOICE_DOCTYPE);
    const name = match.entities?.[0]?.name?.[0]?.name || null;
    return { status: acceptsInvoice ? 'accepts_invoice' : 'registered_other', name };
  } catch (error) {
    return { status: 'unknown', error: error.name === 'AbortError' ? 'timeout' : error.message };
  } finally {
    clearTimeout(timer);
  }
}

function registerEhfHandlers(ipcMain, database) {
  ipcMain.handle('ehf:check', (event, invoiceId) => {
    const { problems, ok, totals, receiverId } = database.buildEhfForInvoice(invoiceId);
    return { problems, ok, totals, receiverId };
  });

  ipcMain.handle('ehf:save', async (event, invoiceId) => {
    const result = database.buildEhfForInvoice(invoiceId);
    if (!result.ok) return { saved: false, problems: result.problems };

    const invoice = database.getInvoice(invoiceId);
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getAllWindows()[0];
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Lagre EHF-faktura',
      defaultPath: `EHF-faktura-${String(invoice.invoice_number).replace(/[^\w-]/g, '_')}.xml`,
      filters: [{ name: 'EHF / Peppol (XML)', extensions: ['xml'] }],
    });
    if (canceled || !filePath) return { saved: false, canceled: true };

    fs.writeFileSync(filePath, result.xml, 'utf8');
    database.logInvoiceEvent(invoiceId, 'ehf_exported', 'EHF-fil lagret', { filePath });
    return { saved: true, filePath };
  });

  ipcMain.handle('ehf:lookup', (event, orgNumber) => lookupPeppolReceiver(orgNumber));
}

module.exports = { registerEhfHandlers, lookupPeppolReceiver };
