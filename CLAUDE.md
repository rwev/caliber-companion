# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Caliber Companion is a website for firearm enthusiasts — hobbyists, law enforcement, military operators, hunters, and other lawful users. The site enables users to research calibers, compare ballistics, projectiles, weapon dynamics, size/weight, popularity, and government/military usage across various sections.

## Tech Stack

- **Framework**: Astro 5 (static output, deployed to GitHub Pages)
- **UI Islands**: Preact (interactive components hydrated via `client:idle` / `client:load` / `client:visible`)
- **Styling**: Tailwind CSS 4 (via `@tailwindcss/vite` plugin) with `@tailwindcss/typography` for prose
- **Charts**: Chart.js (ballistics line charts)
- **Content**: MDX for prose, JSON for structured caliber data (both via Astro content collections)
- **Config**: `astro.config.mjs` — `site: https://rwev.github.io`, `base: /caliber-companion`

## Project Structure

- `src/pages/` — Astro pages: `index.astro` (home), `browse.astro`, `compare.astro`, `calibers/[slug].astro` (detail)
- `src/components/` — Astro components: `Nav`, `Footer`, `SpecTable`, `CaliberCard`, `UsageBadges`
- `src/components/islands/` — Preact islands: `CaliberSearch`, `FilterBar`, `ComparisonTool`, `BallisticsChart`, `ThemeToggle`
- `src/layouts/BaseLayout.astro` — Shared HTML shell with nav, footer, theme init script, font loading
- `src/styles/global.css` — Theme variables (dark default + `[data-theme="light"]` overrides), focus styles, skip-link, scrollbar, prose
- `src/data/calibers/` — 100 JSON files (structured caliber data with dimensions, ballistics, loads)
- `src/content/calibers/` — 100 MDX files (prose content per caliber, rendered on detail pages)
- `src/content.config.ts` — Zod schemas for `caliberData` and `caliberProse` collections
- `src/lib/format.ts` — Formatting utilities (`fmtRange`, `fmtNumber`, `fmtCurrency`, `titleCase`)

## Design System

- **Fonts**: Barlow (body), Barlow Condensed (display/headings), JetBrains Mono (data/mono) — loaded from Google Fonts
- **Theme**: Dark by default. Light theme via `[data-theme="light"]` on `<html>`. Persisted in `localStorage`. Colors defined as CSS custom properties in `global.css` under `@theme`.
- **Color tokens**: `--color-surface[-raised|-overlay|-border|-border-subtle]`, `--color-text-[primary|secondary|muted]`, `--color-accent[-bright|-dim]`, `--color-info[-dim]`, `--color-danger`, `--color-success`
- **Sizing convention**: Labels/tags use `text-sm`, data values use `text-base`, units stay `text-sm text-text-muted`

## Build & Dev

```sh
npm run dev       # astro dev
npm run build     # astro build (static to dist/)
npm run preview   # astro preview
```

All paths in the site are prefixed with `/caliber-companion` (the `base` config). Links and asset references must include this prefix.

## Caliber Categories

`handgun`, `rifle`, `shotgun`, `pdw`, `magnum_handgun`, `magnum_rifle`
