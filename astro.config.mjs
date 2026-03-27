// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://rwev.github.io',
  base: '/caliber-companion',
  output: 'static',
  redirects: {
    '/browse': '/calibers',
    '/ammo': '/calibers/ammo',
    '/quiz': '/guides/quiz',
    '/best-deer-calibers': '/guides/best-deer-calibers',
    '/best-elk-calibers': '/guides/best-elk-calibers',
    '/best-self-defense-calibers': '/guides/best-self-defense-calibers',
    '/best-home-defense-calibers': '/guides/best-home-defense-calibers',
    '/best-bear-defense-calibers': '/guides/best-bear-defense-calibers',
    '/best-long-range-calibers': '/guides/best-long-range-calibers',
    '/best-calibers-for-beginners': '/guides/best-calibers-for-beginners',
    '/glossary': '/reference/glossary',
    '/timeline': '/reference/timeline',
    '/nato-equivalents': '/reference/nato-equivalents',
    '/reloading': '/reference/reloading',
    '/hunting-regulations': '/reference/hunting-regulations',
    '/firearms': '/reference/firearms',
    '/family-tree': '/reference/family-tree',
    '/myths': '/reference/myths',
    '/terminal-performance': '/reference/terminal-performance',
    '/recoil-ranking': '/reference/recoil-ranking',
    '/use-cases': '/reference/use-cases',
    '/cost-comparison': '/reference/cost-comparison',
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    preact(),
    mdx(),
    sitemap(),
  ],
});
