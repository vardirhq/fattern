#!/usr/bin/env node
/**
 * Compiles docs/design-system/tokens.json into src/ui/src/styles/tokens.css.
 * Run with `npm run tokens` after editing the tokens.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const tokens = JSON.parse(fs.readFileSync(path.join(root, 'docs/design-system/tokens.json'), 'utf8'));
const themes = tokens.color.themes.map((t) => t.id);
const first = themes[0];

const resolve = (value, theme) => {
  const raw = typeof value === 'string' ? value : value[theme] ?? value[first];
  const alias = /^\{(.+)\}$/.exec(raw);
  return alias ? `var(--${alias[1]})` : raw;
};
const differs = (token, theme) => typeof token.value !== 'string' && token.value[theme] && token.value[theme] !== token.value[first];

const themed = [...tokens.color.tokens, ...(tokens.shadow?.tokens ?? [])];
const flatFamilies = Object.keys(tokens).filter((k) => !['name', 'version', 'color', 'type', 'shadow'].includes(k) && tokens[k]?.tokens);

let css = `/* ${tokens.name} — generated from docs/design-system/tokens.json by scripts/build-tokens.js. Do not edit by hand. */\n\n`;
css += `:root,\n[data-theme="${first}"] {\n  color-scheme: light;\n`;
for (const t of themed) css += `  --${t.name}: ${resolve(t.value, first)};\n`;
css += '}\n\n';
for (const theme of themes.slice(1)) {
  css += `[data-theme="${theme}"] {\n  color-scheme: ${theme};\n`;
  for (const t of themed) if (differs(t, theme)) css += `  --${t.name}: ${resolve(t.value, theme)};\n`;
  css += '}\n\n';
}
css += ':root {\n';
for (const family of flatFamilies) for (const t of tokens[family].tokens) css += `  --${t.name}: ${t.value};\n`;
for (const [key, stack] of Object.entries(tokens.type.families)) css += `  --font-${key}: ${stack};\n`;
css += '}\n\n/* Type styles */\n';
for (const group of tokens.type.groups) {
  for (const s of group.styles) {
    const family = s.family ?? group.family;
    css += `.type-${s.name} { font-family: var(--font-${family}); font-size: ${s.fontSize}; line-height: ${s.lineHeight}; font-weight: ${s.fontWeight};`;
    if (s.letterSpacing) css += ` letter-spacing: ${s.letterSpacing};`;
    if (s.name === 'overline') css += ' text-transform: uppercase;';
    if (family === 'mono') css += ' font-variant-numeric: tabular-nums;';
    css += ' }\n';
  }
}
fs.writeFileSync(path.join(root, 'src/ui/src/styles/tokens.css'), css);
console.log('Wrote src/ui/src/styles/tokens.css');
