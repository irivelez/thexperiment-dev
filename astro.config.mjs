// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://thexperiment.dev',
  trailingSlash: 'never',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
