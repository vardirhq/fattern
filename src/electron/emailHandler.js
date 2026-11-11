/**
 * emailHandler.js
 *
 * IPC handlers for email sending:
 *  - email:get-config       → read saved SMTP settings
 *  - email:save-config      → persist SMTP settings (password encrypted via safeStorage)
 *  - email:test-connection  → verify SMTP credentials
 *  - email:send-invoice     → generate PDF + send via SMTP
 *  - email:open-mailto      → fallback: save PDF to temp dir + open mailto: link
 */

const path = require('path');
const fs = require('fs');
const { app, shell, safeStorage } = require('electron');
const nodemailer = require('nodemailer');
const { DATA_ROOT } = require('../db/paths');

// ─── Config helpers ───────────────────────────────────────────────────────────

const CONFIG_PATH = path.join(DATA_ROOT, 'email-config.json');

function readRawConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return {};
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeRawConfig(raw) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(raw, null, 2), 'utf8');
}

function encryptPassword(plaintext) {
  if (!plaintext) return '';
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(plaintext).toString('base64');
  }
  // Fallback: store as-is (no OS keychain — uncommon, warn in UI)
  return plaintext;
}

function decryptPassword(stored) {
  if (!stored) return '';
  if (safeStorage.isEncryptionAvailable()) {
    try {
      const buf = Buffer.from(stored, 'base64');
      return safeStorage.decryptString(buf);
    } catch {
      // Stored value might be from before safeStorage was available, return raw
      return stored;
    }
  }
  return stored;
}

// ─── Transporter factory ─────────────────────────────────────────────────────

function createTransporter(config) {
  const { host, port, secure, user, password } = config;
  return nodemailer.createTransport({
    host,
    port: Number(port) || 587,
    secure: secure === true || Number(port) === 465,
    auth: { user, pass: password },
    tls: { rejectUnauthorized: false }, // Accept self-signed certs for corp servers
  });
}

// ─── PDF helper (reuse existing pdf:generate-invoice logic) ──────────────────

async function generatePdfForInvoice(database, invoiceId) {
  const { generateInvoicePDF } = require('./pdfGenerator');
  const { generateTemplatePDF } = require('./templatePdfGenerator');
  const { TemplateStorage } = require('../db/templateStorage');

  const invoice = database.getInvoice(invoiceId);
  if (!invoice) throw new Error('Faktura ikke funnet');

  const company = database.ensureCompany();
  const customer = invoice.customer_id
    ? database.db.prepare('SELECT * FROM customers WHERE id = ?').get(invoice.customer_id)
    : null;

  // Try to use the user's default template (same logic as pdf:generate-invoice in main.js)
  try {
    const templateStorage = new TemplateStorage();
    // Stored default template, or Nordisk Pro when none was chosen (see resolveTemplate.js)
    const { resolveInvoiceTemplate } = require('../db/resolveTemplate');
    const template = resolveInvoiceTemplate(templateStorage, database.getSetting('invoice.defaultTemplate', null));
    if (template) {
      return await generateTemplatePDF(template, invoice, company, customer);
    }
    // If that ID isn't found, try the first available template
    const templates = templateStorage.listTemplates();
    if (templates.length > 0) {
      const firstId = templates[0].meta?.id || templates[0].id;
      const firstTemplate = templateStorage.loadTemplate(firstId);
      if (firstTemplate) {
        return await generateTemplatePDF(firstTemplate, invoice, company, customer);
      }
    }
  } catch (err) {
    console.warn('Template PDF failed, falling back:', err.message);
  }

  return await generateInvoicePDF(invoice, company, customer);
}

// ─── IPC handler registration ────────────────────────────────────────────────

function registerEmailHandlers(ipcMain, database) {
  // Get config (returns config with password masked)
  ipcMain.handle('email:get-config', () => {
    const raw = readRawConfig();
    return {
      host:     raw.host     || '',
      port:     raw.port     || '587',
      secure:   raw.secure   || false,
      user:     raw.user     || '',
      hasPassword: Boolean(raw.password),
      encryptionAvailable: safeStorage.isEncryptionAvailable(),
    };
  });

  // Save config
  ipcMain.handle('email:save-config', (event, config) => {
    const existing = readRawConfig();
    const raw = {
      host:   config.host   || '',
      port:   config.port   || '587',
      secure: config.secure || false,
      user:   config.user   || '',
      // Only update password if a new one was provided
      password: config.password
        ? encryptPassword(config.password)
        : (existing.password || ''),
    };
    writeRawConfig(raw);
    return { ok: true };
  });

  // Test connection
  ipcMain.handle('email:test-connection', async (event, config) => {
    const raw = readRawConfig();
    const password = config.password
      ? config.password
      : decryptPassword(raw.password);

    const transporter = createTransporter({ ...config, password });
    await transporter.verify();
    return { ok: true };
  });

  // Send invoice email via SMTP
  ipcMain.handle('email:send-invoice', async (event, { invoiceId, to, subject, message, templateId, kind }) => {
    const raw = readRawConfig();
    if (!raw.host || !raw.user) {
      throw new Error('SMTP ikke konfigurert. Gå til Innstillinger → E-post.');
    }

    const password = decryptPassword(raw.password);
    const transporter = createTransporter({ ...raw, password });

    // Generate PDF
    const pdfPath = await generatePdfForInvoice(database, invoiceId);
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Build filename from subject/invoiceId
    const safeSubject = subject.replace(/[^a-zA-Z0-9æøåÆØÅ\-_ ]/g, '').slice(0, 60);
    const filename = `${safeSubject}.pdf`;

    await transporter.sendMail({
      from: raw.user,
      to,
      subject,
      text: message,
      html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${message}</pre>`,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    if (kind === 'reminder') {
      database.logInvoiceEvent(invoiceId, 'reminder_sent', `Purring sendt til ${to}`, { to, subject, via: 'smtp' });
    } else {
      database.logInvoiceEvent(invoiceId, 'email_sent', `E-post sendt til ${to}`, { to, subject });
    }
    return { ok: true };
  });

  // Mailto fallback: save PDF to temp dir + open mailto: link
  ipcMain.handle('email:open-mailto', async (event, { invoiceId, to, subject, message, kind }) => {
    // Save PDF to temp dir
    const pdfPath = await generatePdfForInvoice(database, invoiceId);

    // Copy to Downloads so the user can find it easily
    const downloadsDir = app.getPath('downloads');
    const filename = path.basename(pdfPath);
    const destPath = path.join(downloadsDir, filename);
    fs.copyFileSync(pdfPath, destPath);

    // Open mailto: link (no attachment possible via protocol, but fills everything else)
    const params = new URLSearchParams({ subject, body: message });
    const mailto = `mailto:${encodeURIComponent(to)}?${params.toString()}`;
    await shell.openExternal(mailto);

    // Also reveal PDF in Finder/Explorer so user can drag to email compose window
    shell.showItemInFolder(destPath);

    if (kind === 'reminder') {
      database.logInvoiceEvent(invoiceId, 'reminder_sent', `Purring klargjort i e-postprogrammet til ${to}`, { to, subject, via: 'mailto' });
    }

    return { ok: true, pdfPath: destPath };
  });
}

module.exports = { registerEmailHandlers };
