/** @type {import('tailwindcss').Config} */

const brandCore = {
  deep: '#0d3e51',
  base: '#2f8981',
  lift: '#67b999'
};

const brandScale = {
  950: '#041318',
  900: brandCore.deep,
  800: '#144d5b',
  700: '#1b5c64',
  600: brandCore.base,
  500: '#59a19a',
  400: '#82b8b3',
  300: '#a4d5c2',
  200: '#c2e3d6',
  100: '#e1f1eb',
  50: '#f0f8f5'
};

module.exports = {
  content: [
    './src/ui/index.html',
    './src/ui/src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Use CSS variables for runtime theme switching
        // Format: rgb() allows Tailwind opacity modifiers to work
        brand: {
          50: 'rgb(var(--color-brand-50-rgb) / <alpha-value>)',
          100: 'rgb(var(--color-brand-100-rgb) / <alpha-value>)',
          200: 'rgb(var(--color-brand-200-rgb) / <alpha-value>)',
          300: 'rgb(var(--color-brand-300-rgb) / <alpha-value>)',
          400: 'rgb(var(--color-brand-400-rgb) / <alpha-value>)',
          500: 'rgb(var(--color-brand-500-rgb) / <alpha-value>)',
          600: 'rgb(var(--color-brand-600-rgb) / <alpha-value>)',
          700: 'rgb(var(--color-brand-700-rgb) / <alpha-value>)',
          800: 'rgb(var(--color-brand-800-rgb) / <alpha-value>)',
          900: 'rgb(var(--color-brand-900-rgb) / <alpha-value>)',
          950: 'rgb(var(--color-brand-950-rgb) / <alpha-value>)',
        },
        ink: 'rgb(var(--color-ink-rgb) / <alpha-value>)',
        'ink-soft': 'rgb(var(--color-ink-soft-rgb) / <alpha-value>)',
        'ink-subtle': 'rgb(var(--color-ink-subtle-rgb) / <alpha-value>)',
        accent: 'rgb(var(--color-accent-rgb) / <alpha-value>)',
        moss: 'rgb(var(--color-moss-rgb) / <alpha-value>)',
        cloud: 'rgb(var(--color-cloud-rgb) / <alpha-value>)',
        mist: 'rgb(var(--color-mist-rgb) / <alpha-value>)',
        sand: 'rgb(var(--color-sand-rgb) / <alpha-value>)',
        foam: 'rgb(var(--color-foam-rgb) / <alpha-value>)',
        tide: 'rgb(var(--color-tide-rgb) / <alpha-value>)',
        // Keep these for backwards compatibility
        white: 'var(--color-white)',
        black: 'var(--color-black)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Space Grotesk"', 'Inter', 'ui-monospace', 'monospace'],
      },
      // Calmer corners: large Tailwind radii are capped so cards read as sheets
      borderRadius: {
        xl: '12px',
        '2xl': '14px',
        '3xl': '18px',
      },
      boxShadow: {
        card: '0 1px 2px var(--f-glass-shadow), 0 8px 24px var(--f-glass-shadow)'
      }
    }
  },
  plugins: []
};
