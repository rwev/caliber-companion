# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build (static output to dist/)
npm run preview   # Preview built site locally
```

There are no tests or linter configured.

## Architecture

**Astro 5 static site** with **Preact islands** for interactivity, styled with **Tailwind CSS 4**.

### Content & Data Pipeline

Four content collections defined in `src/content.config.ts` with Zod validation:

| Collection | Source | Loader | What |
|---|---|---|---|
| `caliberData` | `src/data/calibers/*.json` | glob (JSON) | 102 caliber specs, ballistics, loads |
| `caliberProse` | `src/content/calibers/*.mdx` | glob (MDX) | Narrative prose per caliber |
| `guides` | `src/content/guides/*.mdx` | glob (MDX) | Curated "best calibers for X" articles |
| `firearmsData` | `src/data/firearms/*.json` | glob (JSON) | Firearm specs linked by caliber slug |

All cross-references use **slug strings** (e.g. `parent_cartridge: "308-winchester"`), not IDs.

### Page Silos

Pages are organized into 5 thematic silos under `src/pages/`:

- **`/calibers/`** — Browse hub (`index.astro`), individual pages (`[slug].astro`), ammo finder (`ammo.astro`)
- **`/compare/`** — Comparison tool (`index.astro`), 48 pre-built matchups (`[slug].astro`)
- **`/tools/`** — 9 interactive calculators (ballistics, recoil, cost, range card, etc.)
- **`/guides/`** — Content collection guides (`[slug].astro`), 7 standalone best-of pages, quiz
- **`/reference/`** — Glossary, timeline, firearms DB, NATO equivalents, reloading, hunting regs, myths, rankings, etc.

Old root-level URLs redirect to new silo paths via `astro.config.mjs` `redirects`. The `/vs/[slug].astro` pages also redirect to `/compare/[slug]`.

### Component Pattern

- **Astro components** (`src/components/*.astro`) — Static layout: Nav, Footer, Breadcrumb, CaliberCard, SpecTable, UsageBadges, CartridgeLineage, AdoptionTimeline
- **Preact islands** (`src/components/islands/*.tsx`) — Interactive widgets hydrated with `client:idle`, `client:load`, or `client:visible`. ~30 islands total.

Islands receive serializable props from Astro pages. They read `data-theme` attribute for dark mode and use CSS variables from the theme. LocalStorage backs favorites, recently viewed, and theme preference.

### Styling

`src/styles/global.css` defines a design token system with CSS custom properties:
- Surfaces: `--color-surface`, `--color-surface-raised`, `--color-surface-overlay`
- Text: `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`
- Accent: `--color-accent` (teal `#0d7c66`)
- Dark mode via `[data-theme="dark"]` attribute overrides
- Fonts: Inter (sans), IBM Plex Mono (mono)

### Utilities

`src/lib/format.ts` — `fmtRange()`, `fmtNumber()`, `fmtCurrency()`, `titleCase()`

## Key Conventions

- **Schema changes must be backwards-compatible.** New fields on caliber/firearms JSON should be optional or have defaults so existing files still validate.
- **Links are root-relative** (`/calibers/308-winchester`, not `./`). No base path prefix — the site deploys to a root domain.
- **Dynamic routes** use `getStaticPaths()` pulling from content collections.
- **Nav** uses 5 dropdown sections (Calibers, Compare, Tools, Guides, Reference) with CSS hover dropdowns on desktop and JS-toggled collapsible sections on mobile.
- **Chart.js** is used for ballistic trajectory/energy charts in island components.
- **Breadcrumbs** use a `breadcrumbs` prop on `BaseLayout`, rendered with JSON-LD BreadcrumbList schema. Spoke pages include their silo hub as parent (e.g., `[{ label: 'Reference', href: '/reference' }, { label: 'Glossary' }]`).
