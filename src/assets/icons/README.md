# App Icons

The app icon is the Fattern mark: a lowercase f whose crossbar is a moustache.
Source drawings:

- `src/ui/public/fattern-monogram.svg` (also at the repo root) — the full mark, used for 64 px and up
- `fattern-mark-small.svg` (this folder) — a heavier drawing for 16 and 32 px, so the moustache stays legible

The React version lives in `src/ui/src/components/brand/FatternMark.jsx`.

## Required Files

For best cross-platform support, create PNG files in the following sizes:
- `icon.png` (512x512) - Main icon file
- `icon-256.png` (256x256) - For high-DPI displays
- `icon-128.png` (128x128) - Standard size
- `icon-64.png` (64x64) - Small size
- `icon-32.png` (32x32) - Very small size
- `icon-16.png` (16x16) - Tiny size

## Converting SVG to PNG

You can convert the SVG monogram to PNG using one of these methods:

### Using Inkscape (recommended)
```bash
inkscape src/ui/public/fattern-monogram.svg --export-filename=src/assets/icons/icon.png --export-width=512 --export-height=512
```

### Using ImageMagick
```bash
convert -background none -density 300 src/ui/public/fattern-monogram.svg -resize 512x512 src/assets/icons/icon.png
```

### Using rsvg-convert
```bash
rsvg-convert -w 512 -h 512 src/ui/public/fattern-monogram.svg -o src/assets/icons/icon.png
```

## Platform-Specific Icons (Optional)

For better platform integration, you can also create:
- `icon.ico` (Windows) - Multi-size ICO file
- `icon.icns` (macOS) - Multi-size ICNS file

These can be generated using tools like:
- `electron-icon-maker` npm package
- Online converters
- Platform-specific tools

