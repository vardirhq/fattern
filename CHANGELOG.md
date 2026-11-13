Here it is — the **fully rewritten, cleaned, structured, and chronologically correct changelog**, using the realistic rapid-development timeline you approved.

This version removes duplicates, fixes structure, preserves all features, and reads like a professional-but-indie product history.

---

# **Changelog**

All notable changes to **Fattern** are documented here.
This project follows **Keep a Changelog** and **Semantic Versioning (pre-1.0)**.

---

# **[Unreleased]**

### Changed

* **New design system.** Spruce-green brand colour, amber accent, cool neutrals, small radii, and three bundled typefaces (Schibsted Grotesk, Hanken Grotesk, JetBrains Mono for amounts and identifiers). Documented in `docs/design-system/`.
* **New logo.** An F with a moustache crossbar, plus a wordmark; app icons regenerated.
* **Plain CSS.** Tailwind, PostCSS and Autoprefixer are removed. Styles live in `src/ui/src/styles/` and tokens compile from `docs/design-system/tokens.json` with `npm run tokens`.
* **Themes.** Light and Dark are now defined in CSS. Accent colours and the premium palettes (Hav, Skog, Solnedgang, Skifer, Midnatt) are applied on top of them; the default accent is Gran.
* Fonts are bundled with the app and no longer loaded from Google Fonts.

---

# **[0.6.0] – 2025-12-09**

### Added

#### PDF & Template System

* **Template-Based PDF Generator (Stable)**

  * Invoices now export using the user’s selected default template.
  * Automatic fallback to legacy generator if template missing.
  * All template images correctly embedded as data URLs.
  * Compatible with PNG, JPEG, WebP, GIF, SVG.

* **Template Editor – Finalized Core**

  * Full drag-and-drop WYSIWYG template canvas.
  * Element types: Text, Field, Image, Shape, Table.
  * Z-index stacking system.
  * Grid snapping.
  * Pan + zoom.
  * Undo/redo with history timeline.
  * Preview mode sharing the same scale/offset.

* **Template Management**

  * Template list with create, duplicate, delete.
  * Default template selector.
  * Support for free + premium templates.
  * Storage in `~/Fattern/data/templates/`.

#### Invoicing System

* Full invoice CRUD.
* 3-panel invoice modal (customer, content, products).
* Invoice line item system with automatic subtotal/VAT/total.
* Status management: draft, sent, paid, overdue, cancelled.
* **Payment date** tracked and displayed.
* Inline status selector in lists.
* Invoice view modal (read-only) with quick Edit / Download.

#### Expense System

* Full expense CRUD.
* Expense items (multiple per expense).
* Hierarchical categories with management modal.
* Attachments (images stored under `attachments/`).
* Card-based expenses page with category sidebar.

#### Dashboard

* Income, expenses, overdue, unpaid stats.
* Collection rate and utilization metrics.
* Budget year selector.
* Activity feed and customer insights.
* Budget year cards.

#### Budget Years

* Full CRUD.
* Custom date ranges (e.g., 2024 → 2025).
* Year labels auto-generated (e.g., "24/25").
* Year-specific financial aggregation.

#### Catalogs (Products, Customers)

* CRUD for products & customers.
* Image uploads with preview.
* Table view and card view.
* Deactivate products/customers (soft delete).
* Custom units for products.

#### Themes & Styling

* Complete design system based on brand colors.
* Premium theme pack (Supporter Pack).
* User-defined accent color system.
* Theme picker redesigned with card previews.

#### Import & Migration

* CSV import with automatic delimiter detection.
* Column mapping UI.
* CSV presets (save/load mapping profiles).
* Bulk create for customers/products.
* SAF-T parser skeleton (future full importer).
* Mamut migration helper infrastructure.

#### AI & Supporter Pack

* Supporter Pack system (locally verified).
* Cryptographic credit ledger:

  * HMAC-SHA256 signed transactions.
  * Device-bound keys.
  * Ledger viewer for dev tools.

#### UI & Experience

* Framer Motion animations:

  * Modals, lists, page transitions, toasts.
* Toast system with progress bars.
* Portal-based dropdowns (Select, StatusSelector).
* HTML-based instant loading screen.
* About page redesigned.
* Dev tools reorganized.

### Changed

* Template render engine fully modularized.
* Invoice system converted from legacy generator to template PDFs.
* Expense page redesigned from table → card grid.
* DataTable sorting & indicators upgraded.
* Sidebar layout made fixed and full-height.
* Settings reorganized with template + import tabs.
* All date inputs unified using new DatePicker.
* Images stored as files instead of base64 in JSON.
* Date handling standardized (ISO storage, Norwegian display).

### Technical Details

* DB additions: `payment_date`, `image_path` (products/customers).
* New utilities: `csvParser`, `csvPresets`, `templateRenderer`, `saftParser`.
* New hooks: `useInvoices`, `useExpenses`, `useDashboardData`, `useTemplateHistory`, `useSupporterPack`.
* IPC handlers expanded for template CRUD, PDF generation, CSV import, expenses.
* Localization set up (`i18next`) with NO as primary.

---

# **[0.5.0] – 2025-12-07**

### Added

* Stable template PDF generation v1.
* DatePicker component.
* Invoice status modal.
* Invoice view modal.
* Credit ledger foundational implementation.
* Expense attachments system.
* Loading screen & About redesign.
* Template preview zoom and scaling refinements.

### Changed

* Template system moved to multi-file structure.
* Dev section reorganized.
* Company default template respected.

---

# **[0.4.0] – 2025-12-04**

### Added

* CSV import system: mapping UI, presets, preview workflow.
* CSV bulk-create operations.
* Import section in Settings.
* SAF-T parser scaffolding.
* Supporter Pack foundation (feature flags).

### Changed

* Database updated to support bulk ops.
* Import UX validation improved.

---

# **[0.3.0] – 2025-12-01**

### Added

* First major Template Editor release:

  * Text, Field, Image, Table elements.
  * Canvas with drag-and-drop.
  * Pan/zoom.
  * Layering system.
  * Typography + styling panel.
* Theme system:

  * Core brand palette.
  * Premium themes.
  * Accent customization (Supporter Pack).
* Template manager UI.

### Changed

* App UI rebuilt into desktop layout with fixed sidebar.
* PDF generation moved toward template pipeline.

---

# **[0.2.0] – 2025-11-28**

### Added

* Dashboard v1.
* Budget years CRUD.
* Product CRUD (table + card view).
* Customer CRUD (table + card view).
* Invoice CRUD with line items.
* Settings page with company info.
* Toasts, confirmation modals.
* DataTable with sorting.
* Select / UnitSelect components.

### Changed

* Full application design system applied.
* Sidebar navigation improved.
* Date inputs formatted consistently.

---

# **[0.1.0] – 2025-11-26**

### Added

* Initial Electron + React + Vite + Tailwind setup.
* SQLite connection & base schema.
* Early layout.
* Initial navigation + placeholder pages.