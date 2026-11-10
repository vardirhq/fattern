import { makeDarkTokens, defaultDarkBg } from './tokens';

/**
 * Dark Theme ("Blekk") - Free theme
 * Ink ground with paper-coloured text and a light cobalt accent.
 */
export const darkTheme = {
  id: 'dark',
  name: 'Blekk',
  premium: false,
  dark: true,
  accentOptions: [
    { name: 'Kobolt',  color: '#8FA2FF' }, // Standard
    { name: 'Papir',   color: '#F4F2EC' },
    { name: 'Fjord',   color: '#5EC8C0' },
    { name: 'Lyng',    color: '#C9A2F2' },
    { name: 'Rust',    color: '#F2A273' },
    { name: 'Bær',     color: '#F28DB0' },
  ],
  colors: {
    brand: {
      50:  '#10142A',
      100: '#171D3D',
      200: '#222B5C',
      300: '#33417F',
      400: '#4E61B8',
      500: '#6F84E6',
      600: '#8FA2FF',
      700: '#AEBBFF',
      800: '#C9D2FF',
      900: '#E1E6FF',
      950: '#F3F5FF',
    },
    ink: '#F4F2EC',
    'ink-soft': '#C9C5BB',
    'ink-subtle': '#9C988F',
    accent: '#8FA2FF',
    moss: '#AEBBFF',
    cloud: '#121417',
    mist: '#1D2024',
    sand: '#262A2F',
    foam: '#34383E',
    tide: '#4A4F57',
    white: '#1D2024',
    black: '#F4F2EC',
  },

  tokens: makeDarkTokens(defaultDarkBg),
};
