import { makeLightTokens, paperBg } from './tokens';

/**
 * Light Theme ("Papir") - Default free theme
 * Warm paper ground, graphite ink and a single cobalt accent.
 * Visual reference: the "Fattern Redesign" design canvas (Oversikt, Foundations).
 */
export const lightTheme = {
  id: 'light',
  name: 'Papir',
  premium: false,
  accentOptions: [
    { name: 'Kobolt',  color: '#2F4BD8' }, // Standard
    { name: 'Blekk',   color: '#15171A' },
    { name: 'Fjord',   color: '#0F6E6A' },
    { name: 'Lyng',    color: '#7A3DB8' },
    { name: 'Rust',    color: '#B4501F' },
    { name: 'Bær',     color: '#B3265A' },
  ],
  colors: {
    // Brand scale — cobalt
    brand: {
      50:  '#F3F5FE',
      100: '#E6EAFB',
      200: '#CBD3F6',
      300: '#A6B4F0',
      400: '#7187E6',
      500: '#4A63DE',
      600: '#2F4BD8',
      700: '#2337A8',
      800: '#1C2C85',
      900: '#162266',
      950: '#0D1440',
    },
    // Ink
    ink:           '#15171A',
    'ink-soft':    '#4A4F57',
    'ink-subtle':  '#62666E',
    // Accent colors
    accent: '#2F4BD8',
    moss:   '#2337A8',
    // Grounds — paper and sheets
    cloud: '#FFFFFF',
    mist:  '#F4F2EC',
    sand:  '#ECEAE3',
    foam:  '#E3DFD5',
    tide:  '#D6D1C4',
    // Base
    white: '#FFFFFF',
    black: '#15171A',
  },

  tokens: makeLightTokens(paperBg),
};
