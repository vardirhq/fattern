# Fattern design system

This is the brand book for Fattern. The tokens are in [`tokens.json`](tokens.json) and compile to `src/ui/src/styles/tokens.css` with `npm run tokens`. The component classes (`ft-*`) are in `src/ui/src/styles/components.css`, and the logo files are in `src/ui/public/brand/`.

Fattern is a local-first invoicing and expense app for Norwegian freelancers and small businesses. It runs on the desktop, keeps everything in a database on the user's own machine, and needs no account. The design system serves that: it should feel like a well-kept ledger and a solid trade tool. Calm surfaces, exact numbers, one confident green.

## Principles

- **Numbers are the content.** Amounts, invoice numbers, KID and dates are set in mono with tabular digits and line up in columns. Everything else steps back.
- **Quiet until it matters.** Most of a screen is `ink` on `surface`. Colour is spent on one primary action and on status.
- **Solid, not soft.** Small radii, hairlines before shadows, no gradients, no decoration. A control looks like something you can press.
- **Yours, on your machine.** Say where data lives when it matters ("lagres lokalt", "slettes fra denne maskinen"). Never imply a cloud.

## Voice and content

- Norwegian (bokmål) first, English second. Write both plainly; address the user as "du".
- Sentence case everywhere: "Ny faktura", "Send på e-post". No title case, no exclamation marks, no emoji.
- Buttons are a verb and its object: "Lagre faktura", "Slett utkast". Never "OK" or "Ja".
- Confirmations state what happened and name the thing: "Faktura 2026-0142 er sendt".
- Errors say what is wrong and how to fix it: "Organisasjonsnummer har ni sifre." No apology.
- Use the trade's own words: faktura, utkast, forfall, mva., KID, kreditnota, regnskapsår, EHF.

### Formats

| What | Format | Example |
|---|---|---|
| Amount | thin space between thousands, comma, unit after | `12 500,00 kr` |
| Negative amount | true minus sign | `−220,00 kr` |
| Percent | space before the sign | `25 %` |
| Date | dd.mm.yyyy | `13.11.2026` |
| Invoice number | year and four digits | `2026-0142` |
| Organisation number | three groups, MVA suffix when VAT-registered | `923 456 783 MVA` |
| Account number | 4.2.5 | `1503.40.12345` |

Always say whether a sum is "inkl. mva." or "eks. mva.".

## Color

Two themes, `light` and `dark`, with the same token names. Build with tokens only; never write a hex value in a component.

- **Ground.** The window is `bg`. Cards, tables, inputs and the sidebar are `surface`. Table headers and wells are `surface-sunken`. Dialogs, menus and toasts are `surface-raised` with a shadow.
- **Text.** `ink` for content, `ink-muted` for labels and metadata, `ink-subtle` for placeholders and hints. All three pass 4.5:1 on all four grounds in both themes.
- **Lines.** `line` divides. `line-strong` is the border of every control and holds 3:1.
- **Gran (spruce green).** `brand` fills the one primary button, checked controls and the active marker; text on it is `on-brand`, which is dark in the dark theme. Green text is `brand-ink`; a green tint is `brand-soft`.
- **Rav (amber).** `accent` is a fill for highlights and the expense series in charts, with `on-accent` text. It is too light to be text on light surfaces: use `accent-ink`, on `accent-soft` for a tint.
- **Status.** Each status is a `-soft` tint with its text colour, plus an icon and a word:

| Status | Text | Tint |
|---|---|---|
| Utkast (draft) | `ink-muted` | `surface-sunken` |
| Sendt (sent) | `info` | `info-soft` |
| Forfaller snart (due soon) | `warning` | `warning-soft` |
| Forfalt (overdue) | `danger` | `danger-soft` |
| Betalt (paid) | `success` | `success-soft` |

  `success` is an alias of `brand-ink`: money in is the brand colour. Never tell paid from overdue by colour alone.
- **Charts.** Income is `brand`, expenses are `accent`. They differ in lightness, so they hold up without colour vision. Label series directly.
- **Focus.** Every interactive element shows `focus-ring` on keyboard focus: a 2px gap, then a solid 2px ring in `focus`.

## Typography

Three families, bundled with the app through `@fontsource-variable` (no network needed):

- **Schibsted Grotesk** (`display`): page titles, card and dialog titles. Weights 600 and 700, slightly tight tracking.
- **Hanken Grotesk** (`sans`): everything you read or press. 400 for text, 600 for labels and buttons.
- **JetBrains Mono** (`mono`): amounts, invoice numbers, KID, organisation and account numbers, dates in tables. Weight 500 for amounts.

Use the named styles: `h1` once per page; `h2` for sections and dialogs; `h3` for cards; `body` (14/20) as the default; `small` for hints; `label` above fields; `overline` in uppercase for column headers and stat labels; `figure` for a headline number; `amount` and `id` for data. Do not set text below 11px. Keep running text under 70 characters a line.

## Layout and spacing

- A 4px grid: every gap and padding is a `space-*` token.
- The app frame is a 232px sidebar (`sidebar`) and a content column with a `space-6` gutter. Page title in `h1` at the top left, the primary action at the top right.
- Controls are 36px tall (`control-md`); 28px (`control-sm`) inside rows and toolbars. Table rows are 44px (`row`).
- `space-4` between fields, `space-6` between cards, `space-8` between sections.
- Left-align. Centre only the contents of a dialog scrim.

## Shape, borders and elevation

- Radii: `radius-md` (6px) for controls, `radius-lg` (10px) for cards, tables, dialogs and toasts, `radius-sm` for badges, `radius-full` only for switches and count pills.
- A resting surface has a 1px `line` border and no shadow. `shadow-md` is for menus and toasts, `shadow-lg` for dialogs, both on `surface-raised`.
- No gradients, no blur, no coloured borders on one side of a card.

## Motion

Short and functional: 120ms ease for hover, focus and toggles; 160ms for a dialog or toast entering. Nothing loops, bounces or moves on its own. Honour `prefers-reduced-motion` by removing transitions.

## Iconography

Use [Tabler Icons](https://tabler.io/icons) in the outline style (`@tabler/icons-react`, already a dependency of the app): 24 grid, 1.75 stroke, `currentColor`. Sizes are 16px beside text, 18px in navigation, 20px in empty states. An icon never replaces a label except in a table row action, where it needs `aria-label`. The `Icon` component in the bundle draws only the handful of glyphs the components need themselves, in the same style. No emoji, no filled or two-tone icons.

## Logo

The logo is a mark and a wordmark. The mark is an F whose crossbar is a moustache: "fattern" is Norwegian slang for the old man, the one who keeps the papers in order. The stem is cut clear around the moustache so it reads in one colour too. The wordmark is "Fattern" in Schibsted Grotesk 700 with the two t's joined by one crossbar. All files have fixed colours and do not follow the theme; pick the file for the ground.

| File | What | Use on |
|---|---|---|
| `fattern-logo.svg` | Mark and wordmark, wordmark in `ink` (`#101816`) | `bg`, `surface` and other light grounds |
| `fattern-logo-white.svg` | Mark and wordmark, wordmark in white | dark grounds and the dark theme |
| `fattern-mark.svg` | The mark on its tile: `brand` light value `#0C6A5B`, white F, moustache in `accent` `#F0B03A` | any ground; the app icon, title bar, sidebar, favicon |
| `fattern-wordmark-ink.svg`, `fattern-wordmark-white.svg` | Wordmark alone | where the mark already appears nearby |
| `fattern-glyph-ink.svg`, `fattern-glyph-white.svg` | The F and moustache without the tile, one colour | single-colour print, stamps, PDF invoice footers, on a `brand` fill (white) |

- Lead with the lockup (`fattern-logo`). Use the mark alone where space is square or under 80px wide.
- Minimum sizes: mark 16px, lockup 20px tall, wordmark 14px tall.
- Clear space: a quarter of the mark's width on every side.
- Do not recolour, outline, rotate, stretch or add effects. Do not retype the wordmark in a font; use the file, since the joined t's are drawn.
- Do not put the ink wordmark on a dark ground or the white one on a light ground.
- `src/ui/public/fattern-monogram.svg` is a copy of `fattern-mark.svg` under the name the Electron shell loads.

In React, use `FatternMark`, `FatternWordmark` and `FatternLogo` from `src/ui/src/components/brand/FatternMark.jsx`.

## In the app

- Set `data-theme="light"` or `"dark"` on `<html>`. `src/ui/src/themes/index.js` does this, and also applies a chosen accent (`data-accent` with `--theme-accent`) and the premium palettes (`data-palette`). A custom accent replaces Gran for the brand tokens; `success` stays green.
- Component classes: `ft-btn` with `ft-btn-primary`, `ft-btn-secondary`, `ft-btn-ghost` or `ft-btn-danger`; `ft-input`; `ft-label`; `ft-card` (add `ft-raised` for dialogs); `ft-badge` with `ft-badge-sent`, `-paid`, `-due-soon`, `-overdue` or `-credited`; `ft-mono` for numbers and identifiers; `ft-overline`.
- Layout uses the small utility classes in `src/ui/src/styles/utilities.css` (`flex`, `gap-3`, `p-4`, `md-grid-cols-2`). Spacing steps are multiples of 4px. Colour is never set with a utility; use tokens.
