const fs = require('fs');
const path = require('path');
const { loadBetterSqlite3 } = require('./loadBetterSqlite3');
const { schemaStatements } = require('./schema');
const { DATA_ROOT, EXPORT_ROOT, LOG_ROOT } = require('./paths');

const DB_PATH = path.join(DATA_ROOT, 'fattern.db');

function ensureDataDirectories() {
  const attachmentDir = path.join(DATA_ROOT, 'attachments');
  const exportDir = EXPORT_ROOT;
  const logDir = LOG_ROOT;

  [DATA_ROOT, attachmentDir, exportDir, logDir].forEach((dirPath) => {
    fs.mkdirSync(dirPath, { recursive: true });
  });
}

function applySchema(db) {
  const transaction = db.transaction(() => {
    schemaStatements.forEach((statement) => {
      db.prepare(statement).run();
    });
  });

  transaction();
}

function applyMigrations(db) {
  // Add image_path column to products if it doesn't exist
  try {
    db.prepare('ALTER TABLE products ADD COLUMN image_path TEXT').run();
  } catch (error) {
    // Column already exists, ignore
    if (!error.message.includes('duplicate column')) {
      console.warn('Migration warning (products.image_path):', error.message);
    }
  }

  // Add image_path column to customers if it doesn't exist
  try {
    db.prepare('ALTER TABLE customers ADD COLUMN image_path TEXT').run();
  } catch (error) {
    // Column already exists, ignore
    if (!error.message.includes('duplicate column')) {
      console.warn('Migration warning (customers.image_path):', error.message);
    }
  }

  // Create expense_items table if it doesn't exist (migration for existing databases)
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS expense_items (
        id INTEGER PRIMARY KEY,
        expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        vat_rate REAL,
        line_total REAL
      )
    `).run();
  } catch (error) {
    console.warn('Migration warning (expense_items):', error.message);
  }

  // Add kid (payment reference) column to invoices if it doesn't exist
  try {
    db.prepare('ALTER TABLE invoices ADD COLUMN kid TEXT').run();
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      console.warn('Migration warning (invoices.kid):', error.message);
    }
  }

  // Add payment_date column to invoices if it doesn't exist
  try {
    db.prepare('ALTER TABLE invoices ADD COLUMN payment_date DATE').run();
  } catch (error) {
    // Column already exists, ignore
    if (!error.message.includes('duplicate column')) {
      console.warn('Migration warning (invoices.payment_date):', error.message);
    }
  }

  // Add color column to expense_categories if it doesn't exist
  try {
    db.prepare('ALTER TABLE expense_categories ADD COLUMN color TEXT').run();
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      console.warn('Migration warning (expense_categories.color):', error.message);
    }
  }

  // Create invoice_events table for existing databases
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS invoice_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata TEXT,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      )
    `).run();
  } catch (error) {
    console.warn('Migration warning (invoice_events):', error.message);
  }
}

function initializeDatabase() {
  ensureDataDirectories();

  const Database = loadBetterSqlite3();
  const db = new Database(DB_PATH);
  applySchema(db);
  applyMigrations(db);

  return { db, dbPath: DB_PATH };
}

module.exports = {
  initializeDatabase,
  DB_PATH,
  DATA_ROOT,
};
