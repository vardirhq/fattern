const path = require('path');
const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const { FatternDatabase } = require('../db/fatternDatabase');
const { DATA_ROOT } = require('../db/paths');
const { registerDatabaseHandlers } = require('./dbHandlers');
const { registerTemplateHandlers } = require('./templateHandlers');
const { generateInvoicePDF } = require('./pdfGenerator');
const { generateTemplatePDF } = require('./templatePdfGenerator');
const { registerEmailHandlers } = require('./emailHandler');
const { registerEhfHandlers } = require('./ehfHandlers');
const { registerPeppolHandlers } = require('./peppolHandlers');

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
let database;

// Set app icon
const iconPath = path.join(__dirname, '..', 'assets', 'icons', 'icon.png');
const fs = require('fs');
if (fs.existsSync(iconPath)) {
  // Set icon for the app (affects dock/taskbar)
  if (process.platform === 'darwin') {
    // macOS dock icon
    app.dock?.setIcon(iconPath);
  }
  // Windows/Linux will use the icon from BrowserWindow
}

function createWindow() {
  // Use PNG icon if available, fallback to SVG
  const iconPathSvg = path.join(__dirname, '..', 'ui', 'public', 'fattern-monogram.svg');
  const icon = fs.existsSync(iconPath) ? iconPath : iconPathSvg;

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Fattern',
    icon: icon,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, '..', '..', 'dist', 'ui', 'index.html');
    win.loadFile(indexPath);
  }
}

function setupDatabase() {
  try {
    database = new FatternDatabase();
    registerDatabaseHandlers(database);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    dialog.showErrorBox('Fattern failed to start', error.message || String(error));
    app.exit(1);
  }
}

function disposeDatabase() {
  database?.close();
  database = null;
}

app.whenReady().then(() => {
  setupDatabase();
  createWindow();

  ipcMain.handle('ping', () => 'pong');
  ipcMain.handle('system:get-locale', () => app.getLocale());
  
  // Register template handlers
  registerTemplateHandlers(ipcMain);

  // Register email handlers
  registerEmailHandlers(ipcMain, database);
  registerEhfHandlers(ipcMain, database);
  registerPeppolHandlers(ipcMain, database);
  
  // File dialogs for template import/export
  ipcMain.handle('dialog:show-open-dialog', async (event, options) => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win || BrowserWindow.getAllWindows()[0], options);
    return result;
  });

  ipcMain.handle('dialog:show-save-dialog', async (event, options) => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(win || BrowserWindow.getAllWindows()[0], options);
    return result;
  });
  
  // Window controls
  ipcMain.handle('window:minimize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
  });
  
  ipcMain.handle('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });
  
  ipcMain.handle('window:close', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
  });
  
  ipcMain.handle('window:is-maximized', () => {
    const win = BrowserWindow.getFocusedWindow();
    return win ? win.isMaximized() : false;
  });

  // Dev tools toggle
  ipcMain.handle('window:toggle-devtools', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools();
      } else {
        win.webContents.openDevTools({ mode: 'detach' });
      }
    }
  });

  // Keyboard shortcut for dev tools (F12 or Ctrl+Shift+I)
  app.on('browser-window-created', (event, window) => {
    window.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
        if (window.webContents.isDevToolsOpened()) {
          window.webContents.closeDevTools();
        } else {
          window.webContents.openDevTools({ mode: 'detach' });
        }
      }
    });
  });

  // PDF generation
  ipcMain.handle('pdf:generate-invoice', async (event, invoiceId, templateId = null) => {
    try {
      const invoice = database.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const company = database.ensureCompany();
      const customer = invoice.customer_id
        ? database.db.prepare('SELECT * FROM customers WHERE id = ?').get(invoice.customer_id)
        : null;

      // If templateId is provided, try template-based generation
      if (templateId) {
        try {
          const { TemplateStorage } = require('../db/templateStorage');
          const templateStorage = new TemplateStorage();
          const { resolveInvoiceTemplate } = require('../db/resolveTemplate');
          const template = resolveInvoiceTemplate(templateStorage, templateId);
          if (template) {
            const filepath = await generateTemplatePDF(template, invoice, company, customer);
            database.logInvoiceEvent(invoiceId, 'pdf_generated', 'PDF generert');
            return { success: true, filepath };
          }
          // Template not found, fall back to default generator
          console.warn(`Template ${templateId} not found, falling back to default PDF generator`);
        } catch (error) {
          // Template generation failed, fall back to default generator
          console.warn(`Template-based PDF generation failed: ${error.message}, falling back to default PDF generator`);
        }
      }

      // Use the default PDF generator (either no templateId provided, or template not found/failed)
      const filepath = await generateInvoicePDF(invoice, company, customer);
      database.logInvoiceEvent(invoiceId, 'pdf_generated', 'PDF generert');
      return { success: true, filepath };
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  });

  ipcMain.handle('pdf:open-file', async (event, filepath) => {
    try {
      await shell.openPath(filepath);
      return { success: true };
    } catch (error) {
      console.error('Error opening file:', error);
      throw error;
    }
  });

  // Expense attachment handlers
  const fs = require('fs');
  const attachmentsDir = path.join(DATA_ROOT, 'attachments');
  
  // Ensure attachments directory exists
  if (!fs.existsSync(attachmentsDir)) {
    fs.mkdirSync(attachmentsDir, { recursive: true });
  }

  // Save expense attachment (receipt/image)
  ipcMain.handle('expense:save-attachment', async (event, expenseId, imageData) => {
    try {
      // Extract image data from data URL if needed
      let buffer;
      let extension = 'png';
      
      if (typeof imageData === 'string') {
        if (imageData.startsWith('data:')) {
          // Parse data URL: data:image/png;base64,...
          const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
          if (matches) {
            extension = matches[1];
            const base64Data = matches[2];
            buffer = Buffer.from(base64Data, 'base64');
          } else {
            throw new Error('Invalid image data URL format');
          }
        } else {
          // Assume it's already a file path
          return imageData;
        }
      } else {
        throw new Error('Image data must be a string (data URL or file path)');
      }

      // Generate unique filename: expense_<expenseId>_<timestamp>.<extension>
      const timestamp = Date.now();
      const filename = `expense_${expenseId || 'new'}_${timestamp}.${extension}`;
      const filepath = path.join(attachmentsDir, filename);
      
      // Save the file
      fs.writeFileSync(filepath, buffer);
      
      // Return relative path from attachments directory
      return filename;
    } catch (error) {
      console.error('Error saving expense attachment:', error);
      throw error;
    }
  });

  // Get absolute path for an expense attachment
  ipcMain.handle('expense:get-attachment-path', (event, filename) => {
    if (!filename) return null;
    if (path.isAbsolute(filename)) return filename;
    return path.join(attachmentsDir, filename);
  });

  // Read expense attachment and return as data URL
  ipcMain.handle('expense:read-attachment', async (event, filename) => {
    try {
      const absolutePath = path.join(attachmentsDir, filename);
      
      if (!fs.existsSync(absolutePath)) {
        throw new Error('Attachment file not found');
      }
      
      const buffer = fs.readFileSync(absolutePath);
      const base64 = buffer.toString('base64');
      
      // Determine MIME type from file extension
      const ext = path.extname(absolutePath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
      };
      const mimeType = mimeTypes[ext] || 'image/png';
      
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Error reading expense attachment:', error);
      throw error;
    }
  });

  // Task 04 — SAF-T import handlers
  const { parseSAFT } = require('./saftImporter');
  const { importSAFT } = require('./saftImportHandler');

  ipcMain.handle('saft:parse-preview', async (event, filepath) => {
    const parsed = await parseSAFT(filepath);
    return parsed.summary;
  });

  ipcMain.handle('saft:import', async (event, filepath, options) => {
    return await importSAFT(filepath, database, options);
  });

  // Wipe all data — nukes every table and re-initialises the database
  ipcMain.handle('app:wipe-all-data', async () => {
    database.wipeAllData();
    return { ok: true };
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  try {
    dialog.showErrorBox('Unhandled Error', reason?.message || String(reason));
  } finally {
    app.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  try {
    dialog.showErrorBox('Unhandled Error', error?.message || String(error));
  } finally {
    app.exit(1);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    disposeDatabase();
    app.quit();
  }
});

app.on('before-quit', () => {
  disposeDatabase();
});
