/**
 * Sending EHF through the user's own Recommand team.
 *
 * - peppol:get-config   provider settings (never returns the secret)
 * - peppol:save-config  store key id / secret (secret encrypted via safeStorage)
 * - peppol:test         check the key and list the team's companies
 * - peppol:send         build the EHF for an invoice and send it
 */
const fs = require('fs');
const path = require('path');
const { safeStorage } = require('electron');
const { DATA_ROOT } = require('../db/paths');
const { INVOICE_DOCTYPE } = require('../db/ehf');
const recommand = require('./recommand');

const CONFIG_PATH = path.join(DATA_ROOT, 'peppol-config.json');

function readConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return {};
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeConfig(config) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { encoding: 'utf8', mode: 0o600 });
}

function encrypt(value) {
  if (!value) return '';
  if (safeStorage.isEncryptionAvailable()) return safeStorage.encryptString(value).toString('base64');
  return value;
}

function decrypt(stored) {
  if (!stored) return '';
  if (safeStorage.isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(Buffer.from(stored, 'base64'));
    } catch {
      return stored;
    }
  }
  return stored;
}

function credentials(config = readConfig()) {
  return { keyId: config.keyId || '', secret: decrypt(config.secret) };
}

function publicConfig(config = readConfig()) {
  return {
    provider: 'recommand',
    keyId: config.keyId || '',
    hasSecret: Boolean(config.secret),
    companyId: config.companyId || null,
    companyName: config.companyName || null,
    encrypted: safeStorage.isEncryptionAvailable(),
  };
}

function registerPeppolHandlers(ipcMain, database) {
  ipcMain.handle('peppol:get-config', () => publicConfig());

  ipcMain.handle('peppol:save-config', (event, updates = {}) => {
    const config = readConfig();
    if ('keyId' in updates) config.keyId = String(updates.keyId || '').trim();
    if (updates.secret) config.secret = encrypt(String(updates.secret).trim());
    if ('companyId' in updates) {
      config.companyId = updates.companyId || null;
      config.companyName = updates.companyName || null;
    }
    if (updates.clear) {
      delete config.keyId;
      delete config.secret;
      delete config.companyId;
      delete config.companyName;
    }
    writeConfig(config);
    return publicConfig(config);
  });

  ipcMain.handle('peppol:test', async () => {
    const creds = credentials();
    const verified = await recommand.verifyCredentials(creds);
    if (!verified.ok) return verified;
    return recommand.listCompanies(creds);
  });

  ipcMain.handle('peppol:send', async (event, invoiceId) => {
    const config = readConfig();
    if (!config.secret || !config.companyId) {
      return { ok: false, category: 'not_configured', message: 'EHF-sending er ikke satt opp. Gå til Innstillinger → Faktura.' };
    }

    const ehf = database.buildEhfForInvoice(invoiceId);
    if (!ehf.ok) {
      return { ok: false, category: 'invalid', message: 'Fakturaen mangler opplysninger som kreves for EHF.', problems: ehf.problems };
    }

    // The sender in the file must be the Recommand company we send as.
    const creds = credentials(config);
    const companies = await recommand.listCompanies(creds);
    if (!companies.ok) return companies;
    const company = companies.companies.find((c) => c.id === config.companyId);
    if (!company) {
      return recommand.describeRecommandError({ status: 404, data: null });
    }
    const sellerOrg = String(database.ensureCompany()?.org_number || '').replace(/\D/g, '');
    if (company.enterpriseNumber && company.enterpriseNumber !== sellerOrg) {
      return {
        ok: false,
        category: 'company_mismatch',
        message: `Organisasjonsnummeret ditt (${sellerOrg}) er ikke det samme som firmaet i Recommand (${company.enterpriseNumber}).`,
      };
    }

    const result = await recommand.sendXml(creds, {
      companyId: config.companyId,
      xml: ehf.xml,
      recipient: ehf.receiverId,
      doctypeId: INVOICE_DOCTYPE,
    });
    if (!result.ok) return result;

    database.logInvoiceEvent(invoiceId, 'ehf_sent', `EHF sendt til ${ehf.receiverId}`, {
      provider: 'recommand',
      documentId: result.documentId,
      deliveryStatus: result.deliveryStatus,
    });
    const invoice = database.getInvoice(invoiceId);
    if (invoice?.status === 'draft') {
      database.updateInvoiceStatus(invoiceId, 'sent', null);
    }
    return result;
  });
}

module.exports = { registerPeppolHandlers };
