# **Fattern – Desktop App (Local-First Edition)**

### **Project Summary & Developer Instructions**

Fattern is a modern, local-first invoicing and expense management system designed for freelancers and small Norwegian businesses. The desktop app is the **primary and authoritative** version of Fattern. It uses SQLite as its storage engine, works entirely offline, and prioritizes simplicity, clarity, and the craftsmanship vibe.

This document outlines the vision, structure, requirements, schema, and guidelines for the **Fattern Desktop App v1**.

---

# 1. **Vision**

Fattern should feel like:

* Notion → in clarity and friendliness
* Figma → in cleanliness and restraint
* A modern trade tool → fast, local, solid

It replaces outdated accounting apps with a simple, private, elegant application that works **100% offline**, stores all data in **local SQLite**, and gives users a smooth invoicing + expense-tracking experience.

There is **no need for logins**, **no SaaS backend**, and **no cloud** in v1.
The user owns their data entirely.

---

# 2. **Core Philosophy**

### **Local-First**

* SQLite is the single source of truth.
* No server dependency.
* No accounts or online licensing.
* Fattern must work offline without restrictions.

### **Privacy & Control**

* All financial data remains on-device.
* Later optional sync is end-to-end encrypted and opt-in (via GESH).

### **Simplicity**

* Clean UI.
* Clear flows.
* Zero bloat.

### **Extensibility**

Future features (mobile app, OCR, AI, etc.) should integrate without breaking core design.

---

# 3. **Feature Overview (v1)**

## **3.1 Invoices**

* Create, edit, and delete invoices.
* Customer selection.
* Line items with unit price, quantity, VAT rate.
* Product support (optional use).
* Status:

  * Draft
  * Sent
  * Paid
  * Overdue (auto-flag based on due date)
* PDF generation (clean template).
* Unique invoice numbering (auto-increment with yearly reset rules).

## **3.2 Expenses**

* Add expenses manually.
* Vendor, amount, category, date, notes.
* Attach image or PDF receipts.
* Currency (default NOK).
* Optional: link expenses to invoices (for users who want job-level tracking).

## **3.3 Expense Categories**

* Nested categories (e.g. “Travel > Fuel”).
* Customizable.

## **3.4 Customers**

* Store customer business info.
* Store org number, address, contact person.
* Vat-exempt flag.
* Active flag (soft delete).

## **3.5 Products**

* Predefined items/services:

  * Name
  * Description
  * Price
  * VAT rate
* Active toggle.
* Used to quickly add line items to invoices.

## **3.6 Dashboard**

* Income vs expense overview.
* Breakdown by budget year and month.
* Simple charts (bar/line using something like Recharts).
* Totals for:

  * Income
  * Expenses
  * Net
  * Unpaid invoices
  * Overdue invoices

## **3.7 Budget Years (NEW)**

Budget years allow custom financial periods.

User can define:

* Start date
* End date
* Label (auto or manual)
* “Current” toggle

Types of labels:

* Calendar years: `2025`
* Split years: `2024/2025`
* Custom labels for special accounting periods.

Used for:

* Reports
* Income/expense summaries
* Invoice numbering resets (optional)
* Forecasting and trend analysis

## **3.8 Settings**

* Company information
* Invoice numbering
* Default VAT rate
* Theme (light/dark)
* Tax & layout preferences
* Export/import tools

---

# 4. **Non-Goals (for v1)**

The following are explicitly *not* part of v1:

❌ Accounts or login
❌ Licensing or subscriptions
❌ Online database
❌ Mobile companion
❌ GESH sync
❌ OCR or AI
❌ Multi-company support
❌ Multi-user support

These will come later in v2/v3.

---

# 5. **Tech Stack**

### **Frontend**

* **Electron**
* **React (with Vite)**
* **Plain CSS** with design tokens (see `docs/design-system/`)
* **Framer Motion** (subtle animation)
* **react-icons**

### **Backend (inside Electron main process)**

* SQLite using:

  * `better-sqlite3` (preferred)
* IPC bridging for:

  * DB operations
  * Filesystem operations (attachments)
  * PDF exporting

---

# 6. **UI/UX Direction**

### **Aesthetic**

* Clean, flat, friendly.
* Light spacing, generous margins.
* Typography-led.
* Light motion on hover/intro transitions.

### **Navigation Layout**

Left sidebar with icons:

```
Dashboard
Invoices
Expenses
Customers
Products
Budget Years
Settings
```

### **Primary Panels**

#### **Invoices**

* Table view with columns:

  * Invoice No.
  * Customer
  * Amount
  * Status
  * Date
* Editor view with:

  * Customer selector
  * Dates
  * Line items table
  * Totals sidebar
  * “Preview PDF”

#### **Expenses**

* Card/list layout
* Quick add button
* Receipt viewer sidebar

#### **Budget Years**

* List view:

  * Each row showing label, dates, totals
* “Add budget year” form

---

# 7. **Filesystem Organization**

Attachments saved at:

```
~/Fattern/data/attachments/<uuid>.<ext>
```

Database at:

```
~/Fattern/data/fattern.db
```

Exports at:

```
~/Fattern/exports/
```

App logs (optional):

```
~/Fattern/logs/
```

---

# 8. **Database Schema**

Here is the **v1 SQLite schema** (complete).
Use `INTEGER PRIMARY KEY` for auto-incremented IDs.

---

## **8.1 companies**

```sql
CREATE TABLE companies (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  org_number TEXT,
  address TEXT,
  post_number TEXT,
  post_location TEXT,
  contact_email TEXT,
  contact_number TEXT,
  account_number TEXT,
  vat_rate REAL DEFAULT 0.25,
  invoice_count INTEGER DEFAULT 0,
  invoice_reset_date DATE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## **8.2 customers**

```sql
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  address TEXT,
  email TEXT,
  phone TEXT,
  org_number TEXT,
  post_number TEXT,
  post_location TEXT,
  vat_exempt INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## **8.3 products**

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  unit_price REAL NOT NULL,
  vat_rate REAL,
  unit TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## **8.4 invoices**

```sql
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  vat_total REAL,
  subtotal REAL,
  total REAL,
  notes TEXT,
  status TEXT,
  your_reference TEXT,
  our_reference TEXT,
  start_date DATE,
  end_date DATE,
  delivery_reference TEXT,
  reference TEXT,
  custom_fields TEXT,
  credited INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## **8.5 invoice_items**

```sql
CREATE TABLE invoice_items (
  id INTEGER PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL,
  vat_rate REAL,
  line_total REAL
);
```

---

## **8.6 expense_categories**

```sql
CREATE TABLE expense_categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id INTEGER REFERENCES expense_categories(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## **8.7 expenses**

```sql
CREATE TABLE expenses (
  id INTEGER PRIMARY KEY,
  category_id INTEGER REFERENCES expense_categories(id),
  vendor TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'NOK',
  date DATE NOT NULL,
  notes TEXT,
  attachment_path TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## **8.8 invoice_expense_links**

```sql
CREATE TABLE invoice_expense_links (
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  PRIMARY KEY (invoice_id, expense_id)
);
```

---

## **8.9 budget_years (NEW)**

```sql
CREATE TABLE budget_years (
  id INTEGER PRIMARY KEY,
  label TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## **8.10 settings**

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

---

# 9. **Business Logic Guidelines**

## **9.1 Invoice Numbering**

* Use `invoice_count` in `companies` for sequential values.
* Reset based on:

  * Year boundary
  * Or user-defined budget year boundary
* Number format:

  * `YYYY-XXX`
  * or custom pattern later.

## **9.2 Budget Year Labeling**

If auto-generating labels:

* If same year:

  * `2025`
* If crossing years:

  * `2024/2025`
* Allow manual override.

## **9.3 Income vs Expense Report**

For a given budget year:

Compute:

```sql
SUM(total) FROM invoices WHERE invoice_date BETWEEN start AND end
SUM(amount) FROM expenses WHERE date BETWEEN start AND end
```

UI shows:

* Income total
* Expense total
* Net
* Trend graph per month

## **9.4 Overdue invoices**

Automatically mark overdue if:
`NOW > due_date AND status != 'paid'`

---

# 10. **Future Features (Not Required for v1)**

These will be added in later versions:

### **10.1 GESH Sync (v2)**

* Encrypted event syncing
* Local-first pairing
* Mobile receipt capture app

### **10.2 OCR Receipt Parsing**

* Local or API-based text extraction
* Auto-fill vendor/amount/category

### **10.3 AI Suggestions**

* Auto-categorize expenses
* Predict line-item prices
* Smart insights

### **10.4 Multi-Company Mode**

* Multiple companies per app install

---

# 11. **Overall Goals for v1**

* Build a stable, polished, fully local invoicing + expense tool.
* Create an architecture that is easy to extend.
* Keep UI delightful and professional.
* Be strict about:

  * No accounts
  * No external services
  * No sync
  * No online dependencies

Fattern v1 is the **stable offline core**.
Everything else grows from this.
