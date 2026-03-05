# Color Scheme Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the gold/military dark-only scheme with a neutral "Lab Report" palette supporting both dark and light themes via CSS variables and a toggle.

**Architecture:** CSS custom properties define all colors. Dark mode is the default (`:root`), light mode overrides via `[data-theme="light"]`. A small inline script in `<head>` reads `localStorage` and `prefers-color-scheme` before paint to prevent flash. A Preact island provides the toggle button in the nav.

**Tech Stack:** Tailwind CSS 4 (with `@theme`), Astro, Preact, CSS custom properties

---

### Task 1: Update CSS color variables for dark mode

**Files:**
- Modify: `src/styles/global.css`

**Step 1: Replace the color values in the `@theme` block**

Replace the entire `@theme` block contents (keeping fonts) with the new dark mode palette:

```css
@theme {
  --font-sans: "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
  --font-display: "Oswald", system-ui, sans-serif;

  --color-surface: #111111;
  --color-surface-raised: #1a1a1a;
  --color-surface-overlay: #222222;
  --color-surface-border: #2e2e2e;
  --color-surface-border-subtle: #1f1f1f;

  --color-text-primary: #e5e5e5;
  --color-text-secondary: #8a8a8a;
  --color-text-muted: #555555;

  --color-accent: #e05a2b;
  --color-accent-bright: #f07040;
  --color-accent-dim: #a33d1a;
  --color-info: #5a9bcf;
  --color-info-dim: #3a6a94;
  --color-danger: #cf4444;
  --color-success: #4a8a54;
}
```

**Step 2: Verify the build still works**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: update dark mode palette to neutral Lab Report scheme"
```

---

### Task 2: Add light mode CSS overrides

**Files:**
- Modify: `src/styles/global.css`

**Step 1: Add light theme variable overrides after the `@theme` block**

Add a `[data-theme="light"]` selector that overrides all color variables. Place this right after the closing `}` of `@theme`:

```css
/* Light theme overrides */
[data-theme="light"] {
  --color-surface: #fafafa;
  --color-surface-raised: #ffffff;
  --color-surface-overlay: #f0f0f0;
  --color-surface-border: #d4d4d4;
  --color-surface-border-subtle: #e8e8e8;

  --color-text-primary: #1a1a1a;
  --color-text-secondary: #666666;
  --color-text-muted: #999999;

  --color-accent: #d04a1c;
  --color-accent-bright: #e05a2b;
  --color-accent-dim: #a33d1a;
  --color-info: #3a7abf;
  --color-info-dim: #2a5a8f;
  --color-danger: #c03030;
  --color-success: #3a7a44;
}
```

**Step 2: Update the grain overlay opacity for light mode**

The grain overlay at `body::before` currently uses `opacity: 0.025`. For light mode, add a separate rule:

```css
[data-theme="light"] body::before {
  opacity: 0.04;
}
```

**Step 3: Update the scrollbar thumb for light mode**

The dark scrollbar colors will look wrong on a light background. Add after the existing scrollbar rules:

```css
[data-theme="light"] ::-webkit-scrollbar-track {
  background: var(--color-surface);
}
[data-theme="light"] ::-webkit-scrollbar-thumb {
  background: var(--color-surface-border);
}
[data-theme="light"] ::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}
```

Note: Since these already use CSS variables, the scrollbar styles may self-update. But the `::-webkit-scrollbar` pseudo-elements sometimes don't inherit CSS variables correctly in all browsers, so explicit overrides are safer.

**Step 4: Verify the build**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add light theme CSS variable overrides"
```

---

### Task 3: Add theme initialization script to prevent flash

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

**Step 1: Add an inline script in `<head>` before the stylesheet**

Add this script block inside `<head>`, after the `<meta>` tags but before the font `<link>` tags:

```html
<script is:inline>
  (function() {
    var theme = localStorage.getItem('theme');
    if (theme === 'light' || (!theme && window.matchMedia('(prefers-color-scheme: light)').matches)) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  })();
</script>
```

Key: `is:inline` tells Astro to emit this verbatim (no bundling), so it runs synchronously before anything paints.

**Step 2: Verify the build**

Run: `npm run build`
Expected: Build succeeds. The script appears inline in the HTML `<head>`.

**Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: add inline theme init script to prevent flash of wrong theme"
```

---

### Task 4: Create the ThemeToggle Preact island

**Files:**
- Create: `src/components/islands/ThemeToggle.tsx`

**Step 1: Create the component**

```tsx
import { useState, useEffect } from 'preact/hooks';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'light' ? 'light' : 'dark');
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', next);
  }

  return (
    <button
      onClick={toggle}
      class="flex h-7 w-7 items-center justify-center border border-surface-border text-text-muted transition-colors hover:border-accent hover:text-accent"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}
```

**Step 2: Verify the build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/islands/ThemeToggle.tsx
git commit -m "feat: create ThemeToggle Preact island component"
```

---

### Task 5: Add ThemeToggle to the Nav

**Files:**
- Modify: `src/components/Nav.astro`

**Step 1: Import ThemeToggle at the top of the frontmatter**

Add after the CaliberSearch import:

```astro
import ThemeToggle from './islands/ThemeToggle';
```

**Step 2: Add the toggle button in the nav bar**

Insert the ThemeToggle component after the CaliberSearch div, inside the `flex items-center gap-1` container. Add it as a new `div` with a left border separator, matching the search separator pattern:

```astro
<div class="ml-2 border-l border-surface-border pl-3">
  <ThemeToggle client:idle />
</div>
```

Place this after the existing CaliberSearch `<div>` block (the one ending with `</div>` at the bottom of the flex container).

**Step 3: Verify the build**

Run: `npm run build`
Expected: Build succeeds. The toggle appears in the nav.

**Step 4: Commit**

```bash
git add src/components/Nav.astro
git commit -m "feat: add theme toggle button to navigation bar"
```

---

### Task 6: Update hardcoded colors in index.astro

**Files:**
- Modify: `src/pages/index.astro`

**Step 1: Replace hardcoded gold rgba in the CTA button hover shadow**

Line 58 has `hover:shadow-[0_0_20px_rgba(212,168,67,0.15)]`. Replace with the orange accent:

```
hover:shadow-[0_0_20px_rgba(224,90,43,0.15)]
```

**Step 2: Verify the build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "fix: update hardcoded gold shadow to new orange accent color"
```

---

### Task 7: Update hardcoded colors in CaliberCard.astro and FilterBar.tsx

**Files:**
- Modify: `src/components/CaliberCard.astro`
- Modify: `src/components/islands/FilterBar.tsx`

**Step 1: Update CaliberCard.astro**

Line 21 has `hover:shadow-[0_0_24px_rgba(212,168,67,0.06)]`. Replace with:

```
hover:shadow-[0_0_24px_rgba(224,90,43,0.06)]
```

**Step 2: Update FilterBar.tsx**

Line 169 has the same `hover:shadow-[0_0_24px_rgba(212,168,67,0.06)]`. Replace with:

```
hover:shadow-[0_0_24px_rgba(224,90,43,0.06)]
```

**Step 3: Verify the build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/CaliberCard.astro src/components/islands/FilterBar.tsx
git commit -m "fix: update hardcoded gold shadow colors in CaliberCard and FilterBar"
```

---

### Task 8: Update hardcoded colors in BallisticsChart.tsx

**Files:**
- Modify: `src/components/islands/BallisticsChart.tsx`

**Step 1: Update the COLORS array (line 42-47)**

Replace the first color (gold) with the new accent orange. Keep other chart colors updated:

```tsx
const COLORS = [
  { line: '#e05a2b', bg: 'rgba(224, 90, 43, 0.1)' },
  { line: '#5a9bcf', bg: 'rgba(90, 155, 207, 0.1)' },
  { line: '#cf4444', bg: 'rgba(207, 68, 68, 0.1)' },
  { line: '#4a8a54', bg: 'rgba(74, 138, 84, 0.1)' },
];
```

**Step 2: Update hardcoded chart theme colors**

Replace all hardcoded hex values in the Chart.js options with the new palette colors. These are spread across the `legend`, `tooltip`, and `scales` config:

- `'#8b919e'` → `'#8a8a8a'` (text-secondary)
- `'#1a1e26'` → `'#222222'` (surface-overlay)
- `'#252a34'` → `'#2e2e2e'` (surface-border)
- `'#e2e4e9'` → `'#e5e5e5'` (text-primary)
- `'#555b68'` → `'#555555'` (text-muted)
- `'rgba(37, 42, 52, 0.6)'` → `'rgba(46, 46, 46, 0.6)'` (grid lines based on new surface-border)

Note: Chart.js doesn't support CSS variables, so these must stay as hardcoded values. They will display correctly in dark mode. For light mode, a future enhancement could read computed CSS variable values at render time, but that's out of scope for this task.

**Step 3: Verify the build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/islands/BallisticsChart.tsx
git commit -m "fix: update hardcoded chart colors to new neutral palette"
```

---

### Task 9: Update hardcoded colors in ComparisonTool.tsx

**Files:**
- Modify: `src/components/islands/ComparisonTool.tsx`

**Step 1: Update the COLORS array (line 66-71)**

Same replacement as BallisticsChart:

```tsx
const COLORS = [
  { line: '#e05a2b', bg: 'rgba(224, 90, 43, 0.1)' },
  { line: '#5a9bcf', bg: 'rgba(90, 155, 207, 0.1)' },
  { line: '#cf4444', bg: 'rgba(207, 68, 68, 0.1)' },
  { line: '#4a8a54', bg: 'rgba(74, 138, 84, 0.1)' },
];
```

**Step 2: Update hardcoded chart theme colors**

Same replacements as Task 8:

- `'#8b919e'` → `'#8a8a8a'`
- `'#1a1e26'` → `'#222222'`
- `'#252a34'` → `'#2e2e2e'`
- `'#e2e4e9'` → `'#e5e5e5'`
- `'#555b68'` → `'#555555'`
- `'rgba(37, 42, 52, 0.6)'` → `'rgba(46, 46, 46, 0.6)'`

**Step 3: Verify the build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/islands/ComparisonTool.tsx
git commit -m "fix: update hardcoded chart colors in ComparisonTool"
```

---

### Task 10: Make Chart.js colors theme-aware

**Files:**
- Modify: `src/components/islands/BallisticsChart.tsx`
- Modify: `src/components/islands/ComparisonTool.tsx`

Chart.js doesn't accept CSS variables, but we can read computed styles at render time so charts adapt to the active theme.

**Step 1: Add a helper function to read CSS variable values**

Add this function at the top of each file (or create a shared util, but since there are only 2 files, inline is fine):

```tsx
function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
```

**Step 2: Replace hardcoded chart config colors with `getCSSVar()` calls**

In each chart's `useEffect` (where the Chart is constructed), replace the hardcoded values:

```tsx
// Inside the useEffect, before creating the Chart:
const textSecondary = getCSSVar('--color-text-secondary');
const textMuted = getCSSVar('--color-text-muted');
const textPrimary = getCSSVar('--color-text-primary');
const surfaceOverlay = getCSSVar('--color-surface-overlay');
const surfaceBorder = getCSSVar('--color-surface-border');
const gridColor = surfaceBorder + '99'; // ~60% opacity
```

Then use those variables in the Chart.js config instead of the hardcoded hex strings.

**Step 3: Add a theme change listener to re-render charts**

Add a `MutationObserver` watching `data-theme` attribute changes on `<html>`, and trigger chart re-render:

```tsx
useEffect(() => {
  const observer = new MutationObserver(() => {
    // Force re-render by toggling a state
    setThemeKey(k => k + 1);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}, []);
```

Add `themeKey` as a dependency of the chart `useEffect` so it rebuilds on theme change.

**Step 4: Verify the build**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/components/islands/BallisticsChart.tsx src/components/islands/ComparisonTool.tsx
git commit -m "feat: make Chart.js colors respond to theme changes"
```

---

### Task 11: Update prose styling for light mode

**Files:**
- Modify: `src/pages/calibers/[slug].astro`

**Step 1: Update the Tailwind prose class**

Line 184 uses `prose-invert` which forces light-on-dark text. This needs to be conditional. Replace `prose-invert` with a dynamic class or use CSS to handle it.

Since Astro templates don't have runtime JS, the simplest approach is to remove `prose-invert` and instead style prose via CSS variables. Replace:

```
prose prose-invert
```

With:

```
prose
```

Then add custom prose color overrides in `global.css` that use our CSS variables:

```css
.prose {
  --tw-prose-body: var(--color-text-secondary);
  --tw-prose-headings: var(--color-text-primary);
  --tw-prose-bold: var(--color-text-primary);
  --tw-prose-links: var(--color-accent);
  --tw-prose-counters: var(--color-text-muted);
  --tw-prose-bullets: var(--color-text-muted);
  --tw-prose-quotes: var(--color-text-secondary);
  --tw-prose-code: var(--color-text-primary);
  --tw-prose-pre-bg: var(--color-surface-raised);
  --tw-prose-th-borders: var(--color-surface-border);
  --tw-prose-td-borders: var(--color-surface-border-subtle);
}
```

**Step 2: Verify the build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/pages/calibers/[slug].astro src/styles/global.css
git commit -m "feat: make prose typography theme-aware via CSS variables"
```

---

### Task 12: Visual verification and final build

**Step 1: Run the dev server**

Run: `npm run dev`

**Step 2: Verify dark mode**

- Check homepage, browse, compare, and a caliber detail page
- Verify neutral gray backgrounds (no blue/green tint)
- Verify orange accent on CTAs, hover states, active filters
- Verify chart colors render with new palette

**Step 3: Verify light mode**

- Click the theme toggle
- Check all the same pages
- Verify light backgrounds, dark text, orange accent
- Verify charts re-render with appropriate colors
- Verify toggle persists across page navigation (localStorage)

**Step 4: Verify system preference default**

- Clear localStorage (`localStorage.removeItem('theme')`)
- Set OS to light mode — page should default to light
- Set OS to dark mode — page should default to dark

**Step 5: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors or warnings.

**Step 6: Commit any fixups**

If any visual issues were found and fixed during verification, commit them:

```bash
git add -A
git commit -m "fix: visual adjustments from theme verification"
```
