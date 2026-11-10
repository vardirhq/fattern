/**
 * Token factories for --f-* CSS custom properties.
 *
 * Each theme supplies its bg overrides; everything else
 * (surfaces, borders, text, status, component tokens) is shared
 * per colour-scheme so all light themes look consistent and all
 * dark themes look consistent.
 *
 * Visual direction ("papir, blekk og én farge"): a warm paper ground,
 * solid white sheets with 1px lines instead of glass and glow, graphite
 * ink for text and a single accent colour for actions.
 *
 * --f-green* / --f-border-green* are NOT included here — they are
 * always derived dynamically from colors.accent by applyTheme().
 * (The name is historical: they hold the theme's accent, whatever its hue.)
 */

const SHARED_LIGHT = {
  // Surfaces — solid paper and white sheets
  '--f-surface':          '#FFFFFF',
  '--f-surface-hover':    '#FAF9F6',
  '--f-surface-elevated': '#FFFFFF',
  '--f-surface-topbar':   'var(--f-bg-base)',
  '--f-surface-rail':     'var(--f-bg-base)',
  '--f-surface-bottom':   'var(--f-bg-base)',

  // Borders — warm hairlines
  '--f-border':            '#E3DFD5',
  '--f-border-subtle':     '#EAE7DF',
  '--f-border-faint':      '#F1EEE7',
  '--f-border-top':        '#E3DFD5',
  '--f-border-strong':     '#D6D1C4',
  '--f-chart-muted':       '#C9C3B4',

  // "Sent" status
  '--f-blue':        '#2F4BD8',
  '--f-blue-bg':     '#E6EAFB',
  '--f-blue-border': '#CBD3F6',
  '--f-blue-text':   '#2337A8',

  // "Paid" / positive status — independent of the accent colour
  '--f-success':        '#1E7A4C',
  '--f-success-bg':     '#E3F2E9',
  '--f-success-border': '#C3E2CF',
  '--f-success-text':   '#17603B',

  // Text — graphite ink (all body/label shades pass 4.5:1 on paper and white)
  '--f-text':        '#15171A',
  '--f-text-body':   '#22252A',
  '--f-text-soft':   '#4A4F57',
  '--f-text-subtle': '#62666E',
  '--f-text-muted':  '#8A8E95',
  '--f-text-label':  '#62666E',

  // Status
  '--f-warn':          '#9A5B00',
  '--f-warn-bg':       '#FBF0DC',
  '--f-warn-border':   '#EED6A8',
  '--f-danger':        '#B4321F',
  '--f-danger-bg':     '#FBE6E1',
  '--f-danger-border': '#F2CFC6',
  '--f-danger-text':   '#8F2818',

  // Hover tints
  '--f-hover':          'rgba(21,23,26,0.04)',
  '--f-hover-elevated': 'rgba(21,23,26,0.07)',

  // Tooltip / popover — ink chip
  '--f-tooltip-bg':     '#15171A',
  '--f-tooltip-border': '#15171A',
  '--f-tooltip-text':   '#F4F2EC',
  '--f-tooltip-shadow': 'rgba(21,23,26,0.18)',

  // Nav badge dot border (should match surface-rail)
  '--f-badge-border': 'var(--f-bg-base)',

  // Sheets (modals, hero cards) — solid, no frosted glass
  '--f-glass-hero-bg':     '#FFFFFF',
  '--f-glass-hero-border': '#E3DFD5',
  '--f-glass-shadow':      'rgba(21,23,26,0.06)',
  '--f-glass-inner':       'rgba(255,255,255,0)',
  '--f-glass-hero-inner':  'rgba(255,255,255,0)',
  '--f-blur':              'none',

  // Inputs
  '--f-input-bg':         '#FFFFFF',
  '--f-input-focus-ring': 'rgba(47,75,216,0.16)',

  // Ghost / secondary button
  '--f-btn-ghost-bg':    '#FFFFFF',
  '--f-btn-ghost-hover': '#F4F2EC',

  // Inverse (ink) surface — e.g. active nav item, dark summary cards
  '--f-inverse-bg':   '#15171A',
  '--f-inverse-text': '#F4F2EC',

  // Logo mark
  '--f-mark-tile': '#15171A',
  '--f-mark-ink':  '#F4F2EC',

  // Scrollbar
  '--f-scrollbar-thumb':       'rgba(21,23,26,0.16)',
  '--f-scrollbar-thumb-hover': 'rgba(21,23,26,0.28)',
};

const SHARED_DARK = {
  // Surfaces — solid ink sheets
  '--f-surface':          '#1D2024',
  '--f-surface-hover':    '#23262B',
  '--f-surface-elevated': '#1D2024',
  '--f-surface-topbar':   'var(--f-bg-base)',
  '--f-surface-rail':     'var(--f-bg-base)',
  '--f-surface-bottom':   'var(--f-bg-base)',

  // Borders
  '--f-border':            'rgba(244,242,236,0.10)',
  '--f-border-subtle':     'rgba(244,242,236,0.07)',
  '--f-border-faint':      'rgba(244,242,236,0.05)',
  '--f-border-top':        'rgba(244,242,236,0.09)',
  '--f-border-strong':     'rgba(244,242,236,0.18)',
  '--f-chart-muted':       'rgba(244,242,236,0.24)',

  // "Sent" status
  '--f-blue':        '#8FA2FF',
  '--f-blue-bg':     'rgba(143,162,255,0.14)',
  '--f-blue-border': 'rgba(143,162,255,0.26)',
  '--f-blue-text':   '#AEBBFF',

  // "Paid" / positive status
  '--f-success':        '#6FCF97',
  '--f-success-bg':     'rgba(111,207,151,0.14)',
  '--f-success-border': 'rgba(111,207,151,0.26)',
  '--f-success-text':   '#8EDDB0',

  // Text — paper on ink
  '--f-text':        '#F4F2EC',
  '--f-text-body':   'rgba(244,242,236,0.88)',
  '--f-text-soft':   'rgba(244,242,236,0.70)',
  '--f-text-subtle': 'rgba(244,242,236,0.56)',
  '--f-text-muted':  'rgba(244,242,236,0.38)',
  '--f-text-label':  'rgba(244,242,236,0.56)',

  // Status
  '--f-warn':          '#F0B840',
  '--f-warn-bg':       'rgba(240,184,64,0.14)',
  '--f-warn-border':   'rgba(240,184,64,0.24)',
  '--f-danger':        '#FF8A75',
  '--f-danger-bg':     'rgba(255,138,117,0.14)',
  '--f-danger-border': 'rgba(255,138,117,0.24)',
  '--f-danger-text':   '#FFA595',

  // Hover tints
  '--f-hover':          'rgba(244,242,236,0.05)',
  '--f-hover-elevated': 'rgba(244,242,236,0.08)',

  // Tooltip / popover — paper chip
  '--f-tooltip-bg':     '#F4F2EC',
  '--f-tooltip-border': '#F4F2EC',
  '--f-tooltip-text':   '#15171A',
  '--f-tooltip-shadow': 'rgba(0,0,0,0.40)',

  // Nav badge dot border (matches surface-rail)
  '--f-badge-border': 'var(--f-bg-base)',

  // Sheets (modals, hero cards)
  '--f-glass-hero-bg':     '#1D2024',
  '--f-glass-hero-border': 'rgba(244,242,236,0.10)',
  '--f-glass-shadow':      'rgba(0,0,0,0.30)',
  '--f-glass-inner':       'rgba(255,255,255,0)',
  '--f-glass-hero-inner':  'rgba(255,255,255,0)',
  '--f-blur':              'none',

  // Inputs
  '--f-input-bg':         '#15171A',
  '--f-input-focus-ring': 'rgba(143,162,255,0.20)',

  // Ghost / secondary button
  '--f-btn-ghost-bg':    'rgba(244,242,236,0.04)',
  '--f-btn-ghost-hover': 'rgba(244,242,236,0.08)',

  // Inverse surface
  '--f-inverse-bg':   '#F4F2EC',
  '--f-inverse-text': '#15171A',

  // Logo mark — paper tile on ink
  '--f-mark-tile': '#F4F2EC',
  '--f-mark-ink':  '#15171A',

  // Scrollbar
  '--f-scrollbar-thumb':       'rgba(244,242,236,0.14)',
  '--f-scrollbar-thumb-hover': 'rgba(244,242,236,0.26)',
};

/**
 * Build tokens for a light-scheme theme.
 * @param {object} bg  Background layer overrides: bgBase, bgMid, bgDark, bgGradient, bgRadial
 */
export function makeLightTokens({ bgBase, bgMid, bgDark, bgGradient, bgRadial }) {
  return {
    '--f-bg-base':     bgBase,
    '--f-bg-mid':      bgMid,
    '--f-bg-dark':     bgDark,
    '--f-bg-gradient': bgGradient,
    '--f-bg-radial':   bgRadial,
    ...SHARED_LIGHT,
  };
}

/**
 * Build tokens for a dark-scheme theme.
 * @param {object} bg  Background layer overrides: bgBase, bgMid, bgDark, bgGradient, bgRadial
 * @param {object} surfaceOverrides  Optional surface/border overrides for tinted dark themes.
 */
export function makeDarkTokens({ bgBase, bgMid, bgDark, bgGradient, bgRadial }, surfaceOverrides = {}) {
  return {
    '--f-bg-base':     bgBase,
    '--f-bg-mid':      bgMid,
    '--f-bg-dark':     bgDark,
    '--f-bg-gradient': bgGradient,
    '--f-bg-radial':   bgRadial,
    ...SHARED_DARK,
    ...surfaceOverrides,
  };
}

/** A flat background: no gradient washes or orbs. */
export function flatBg(color) {
  return {
    bgBase:     color,
    bgMid:      color,
    bgDark:     color,
    bgGradient: `linear-gradient(${color}, ${color})`,
    bgRadial:   'linear-gradient(transparent, transparent)',
  };
}

/** Default light ground: warm paper. */
export const paperBg = flatBg('#F4F2EC');

/** Default dark ground: ink. */
export const defaultDarkBg = flatBg('#121417');
