# Color Scheme Redesign: "Lab Report"

## Goal

Replace the generic dark/military gold scheme with a neutral, clinical, data-forward palette. Support both dark and light themes.

## Dark Mode Palette

| Token | Hex | Use |
|-------|-----|-----|
| `--color-surface` | `#111111` | Base background |
| `--color-surface-raised` | `#1a1a1a` | Cards, elevated surfaces |
| `--color-surface-overlay` | `#222222` | Overlays, dropdowns |
| `--color-surface-border` | `#2e2e2e` | Primary borders |
| `--color-surface-border-subtle` | `#1f1f1f` | Subtle borders |
| `--color-text-primary` | `#e5e5e5` | Main text |
| `--color-text-secondary` | `#8a8a8a` | Secondary text |
| `--color-text-muted` | `#555555` | Muted text |
| `--color-accent` | `#e05a2b` | Primary accent (orange) |
| `--color-accent-bright` | `#f07040` | Hover/highlight |
| `--color-accent-dim` | `#a33d1a` | Selection, subtle |
| `--color-info` | `#5a9bcf` | Informational |
| `--color-info-dim` | `#3a6a94` | Info subtle |
| `--color-danger` | `#cf4444` | Danger/warning |
| `--color-success` | `#4a8a54` | Success |

## Light Mode Palette

| Token | Hex | Use |
|-------|-----|-----|
| `--color-surface` | `#fafafa` | Base background |
| `--color-surface-raised` | `#ffffff` | Cards, elevated surfaces |
| `--color-surface-overlay` | `#f0f0f0` | Overlays |
| `--color-surface-border` | `#d4d4d4` | Primary borders |
| `--color-surface-border-subtle` | `#e8e8e8` | Subtle borders |
| `--color-text-primary` | `#1a1a1a` | Main text |
| `--color-text-secondary` | `#666666` | Secondary text |
| `--color-text-muted` | `#999999` | Muted text |
| `--color-accent` | `#d04a1c` | Primary accent |
| `--color-accent-bright` | `#e05a2b` | Hover |
| `--color-accent-dim` | `#a33d1a` | Selection |
| `--color-info` | `#3a7abf` | Informational |
| `--color-info-dim` | `#2a5a8f` | Info subtle |
| `--color-danger` | `#c03030` | Danger |
| `--color-success` | `#3a7a44` | Success |

## Theme Toggle

- Default: system preference via `prefers-color-scheme`
- Toggle: button in Nav
- Persistence: `localStorage`
- Mechanism: `data-theme="light"` attribute on `<html>`
- Flash prevention: inline script in `<head>` applies saved theme before paint

## Files to Change

- `src/styles/global.css` — replace color variables with dark/light variants
- `src/components/Nav.astro` or new island — theme toggle UI
- `src/layouts/BaseLayout.astro` — theme init script in `<head>`
