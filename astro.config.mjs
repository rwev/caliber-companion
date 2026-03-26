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
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    preact(),
    mdx(),
    sitemap(),
  ],
});
