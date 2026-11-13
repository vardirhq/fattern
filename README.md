# Fattern (Local-First Desktop Core)

Fattern is a modern, local-first invoicing and expense manager for freelancers and small Norwegian businesses. The desktop app stores everything in SQLite on the user's machine—no logins, no cloud dependency.

This repository currently contains the groundwork for the data layer described in `PROJECT.md`, including a reproducible SQLite schema and a helper script to create the database in the expected filesystem layout.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Initialize the local database (creates `~/Fattern/data/fattern.db` and supporting folders):
   ```bash
   npm run init-db
   ```
3. The script will confirm the paths and ensure the schema tables exist:
   - companies
   - customers
   - products
   - invoices
   - invoice_items
   - expense_categories
   - expenses
   - invoice_expense_links
   - budget_years
   - settings

## Database helpers

The `FatternDatabase` class wraps `better-sqlite3` to apply the schema, ensure filesystem folders exist, and expose convenience helpers for the workflows described in `PROJECT.md`.

```js
const { FatternDatabase } = require('./src/db/fatternDatabase');

const db = new FatternDatabase();
const category = db.createExpenseCategory({ name: 'Travel' });
const product = db.createProduct({ name: 'Workshop time', unitPrice: 1200, vatRate: 0.25, unit: 'hour' });
const customer = db.createCustomer({ name: 'Oslo Bikes AS', email: 'post@oslobikes.no' });
const invoice = db.createInvoice({
  customerId: customer.id,
  invoiceDate: '2025-01-10',
  dueDate: '2025-01-24',
  items: [
    { productId: product.id, description: product.name, quantity: 5, unitPrice: product.unit_price, vatRate: product.vat_rate },
    { description: 'Parts', quantity: 1, unitPrice: 800, vatRate: 0.25 },
  ],
});

const expense = db.addExpense({ vendor: 'Flytoget', amount: 220, date: '2025-01-08', categoryId: category.id });
db.linkExpenseToInvoice(invoice.id, expense.id);

const summary = db.getIncomeExpenseSummary();
console.log(summary);

db.close();
```

### Helper highlights

- **Filesystem safety**: uses `~/Fattern/data`, `~/Fattern/exports`, and `~/Fattern/logs` as outlined in `PROJECT.md`.
- **Invoice numbers**: sequential numbering with yearly (or budget-year) resets using the `companies.invoice_count` and `invoice_reset_date` columns.
- **Products & expense categories**: helpers to seed and list reusable products and nested categories.
- **Budget years**: auto-creates the current budget year if none exists, lets you switch the current year, and allows summaries scoped to a selected period.
- **Offline-first**: no external services; all state lives in SQLite on disk.

## UI preview

The UI preview now uses the intended stack from `PROJECT.md`: **React + Vite with plain CSS**. The Vite root is `src/ui`, and the build output lands in `dist/ui`.

To explore the dashboard locally:

```bash
npm run ui:dev
```

Then open `http://localhost:4173` in your browser. You can also produce a production bundle with:

```bash
npm run ui:build
```

The UI is fully connected to the SQLite database and includes:
- Dashboard with financial overview
- Full CRUD for invoices, products, customers, and budget years
- Sortable tables with visual indicators
- Toast notification system
- Custom invoice template editor
- PDF generation (default and template-based)

## Styling and design system

The UI uses plain CSS, with no CSS framework or preprocessor. The Fattern design system is documented in [`docs/design-system/`](docs/design-system/README.md).

- `docs/design-system/tokens.json` is the source for colours, type, spacing, radii and shadows. Run `npm run tokens` after editing it to regenerate `src/ui/src/styles/tokens.css`.
- `src/ui/src/styles/` holds the stylesheets, loaded in this order by `src/ui/src/index.css`: `tokens.css` (generated), `theme.css` (app tokens, accent and premium palettes), `base.css` (reset), `components.css` (`ft-*` component classes) and `utilities.css` (layout utilities on the 4px grid).
- Themes are applied by setting `data-theme`, `data-accent` and `data-palette` on `<html>` (see `src/ui/src/themes/index.js`).
- Fonts (Schibsted Grotesk, Hanken Grotesk, JetBrains Mono) are bundled through `@fontsource-variable`, so the app needs no network to render.
- The logo files are in `src/ui/public/brand/`; the React version is `src/ui/src/components/brand/FatternMark.jsx`.

## Desktop shell (Electron)

Electron is now wired up to host the Vite renderer. During development you can launch both the dev server and the Electron shell together:

```bash
npm run desktop:dev
```

For a production-like view that renders the built assets instead of the dev server:

```bash
npm run desktop:start
```

The Electron entry point is `src/electron/main.js`, and the preload hook lives in `src/electron/preload.js`.

## Project direction

The intended stack for the desktop app is Electron + React (Vite) with plain CSS, Framer Motion, and `better-sqlite3` for data storage (see `PROJECT.md`). Future work will connect the renderer and main processes to this schema via IPC while keeping the app fully offline and private.
