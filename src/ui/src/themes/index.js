/**
 * Theme registry.
 *
 * Colours live in CSS (styles/tokens.css and styles/theme.css). A theme here only says
 * which base scheme to use (light or dark), which accent replaces the default Gran green,
 * and whether the neutrals are tinted toward that accent (premium palettes).
 */

const BASE = {
  light: { surface: '#FFFFFF', bg: '#F4F7F5', ink: '#101816' },
  dark: { surface: '#141A18', bg: '#0C1110', ink: '#ECF1EF' },
};

/** The design system's own brand colour; choosing it means "no override". */
export const DEFAULT_ACCENT = '#0C6A5B';

const ACCENT_OPTIONS = [
  { name: 'Gran', color: DEFAULT_ACCENT }, // Standard
  { name: 'Kobolt', color: '#2F4BD8' },
  { name: 'Lyng', color: '#7A3DB8' },
  { name: 'Rust', color: '#B4501F' },
  { name: 'Bær', color: '#B3265A' },
  { name: 'Skifer', color: '#475569' },
];

export const themes = [
  { id: 'light', name: 'Lys', premium: false, dark: false, accent: DEFAULT_ACCENT, accentOptions: ACCENT_OPTIONS },
  { id: 'dark', name: 'Mørk', premium: false, dark: true, accent: DEFAULT_ACCENT, accentOptions: ACCENT_OPTIONS },
  { id: 'ocean', name: 'Hav', premium: true, dark: false, accent: '#2563EB', palette: true },
  { id: 'forest', name: 'Skog', premium: true, dark: false, accent: '#15803D', palette: true },
  { id: 'sunset', name: 'Solnedgang', premium: true, dark: false, accent: '#B45309', palette: true },
  { id: 'slate', name: 'Skifer', premium: true, dark: false, accent: '#475569', palette: true },
  { id: 'midnight', name: 'Midnatt', premium: true, dark: true, accent: '#7E22CE', palette: true },
].map(withSwatches);

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(clean.substring(i, i + 2), 16));
}

/** Mix two hex colours; amount is how much of `b` to use (0–1). */
function mix(a, b, amount) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return `#${ca.map((v, i) => Math.round(v + (cb[i] - v) * amount).toString(16).padStart(2, '0')).join('')}`;
}

/** Adds the handful of colours the theme picker draws its preview with. */
function withSwatches(theme) {
  const base = theme.dark ? BASE.dark : BASE.light;
  // Dark schemes show a lightened accent, as the CSS does.
  const shown = theme.dark ? mix(theme.accent, '#FFFFFF', 0.42) : theme.accent;
  return {
    ...theme,
    colors: {
      accent: theme.accent,
      ink: base.ink,
      white: base.surface,
      cloud: base.surface,
      mist: base.bg,
      brand: {
        50: mix(shown, base.surface, 0.9),
        100: mix(shown, base.surface, 0.82),
        400: mix(shown, base.surface, 0.4),
        500: mix(shown, base.surface, 0.2),
        600: shown,
      },
    },
  };
}

/** A copy of a theme with a different accent (only for themes that offer accent options). */
export function createThemeVariant(baseTheme, accentColor) {
  if (!baseTheme.accentOptions || !/^#[0-9a-fA-F]{6}$/.test(accentColor || '')) {
    return baseTheme;
  }
  return withSwatches({ ...baseTheme, accent: accentColor });
}

export function getTheme(themeId) {
  return themes.find((t) => t.id === themeId) || themes[0];
}

export function getAllThemes() {
  return themes;
}

export function getFreeThemes() {
  return themes.filter((t) => !t.premium);
}

export function getPremiumThemes() {
  return themes.filter((t) => t.premium);
}

/** Applies a theme by setting attributes on <html>; the stylesheets do the rest. */
export function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement;
  root.dataset.theme = theme.dark ? 'dark' : 'light';

  const customAccent = theme.accent && theme.accent.toLowerCase() !== DEFAULT_ACCENT.toLowerCase();
  if (customAccent) {
    root.dataset.accent = 'custom';
    root.style.setProperty('--theme-accent', theme.accent);
  } else {
    delete root.dataset.accent;
    root.style.removeProperty('--theme-accent');
  }

  if (theme.palette) {
    root.dataset.palette = theme.id;
  } else {
    delete root.dataset.palette;
  }
}
