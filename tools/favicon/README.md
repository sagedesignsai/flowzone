# Flowzone Favicon Generator

Generates all standard favicon sizes and formats from the app icon.

## Output

| Location | File | Purpose |
|----------|------|---------|
| `public/favicon.ico` | `favicon.ico` (16/32/48) | Legacy browser auto-discovery |
| `public/favicon/` | `favicon-16x16.png` | Small tab icon |
| `public/favicon/` | `favicon-32x32.png` | Standard tab icon |
| `public/favicon/` | `favicon-96x96.png` | Desktop shortcut |
| `public/favicon/` | `apple-touch-icon.png` (180) | iOS home screen |
| `public/favicon/` | `android-chrome-192x192.png` | Android/PWA |
| `public/favicon/` | `android-chrome-512x512.png` | Android/PWA splash |
| `public/favicon/` | `site.webmanifest` | PWA manifest |

## Usage

```bash
pnpm tool:favicon
```
