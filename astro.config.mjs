// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

/**
 * Static by default (Astro 5 collapsed hybrid into static). Each API route
 * opts into server rendering via `export const prerender = false`. The
 * Vercel adapter then deploys those routes as serverless/edge functions.
 */
export default defineConfig({
  site: 'https://thexperiment.dev',
  trailingSlash: 'never',
  output: 'static',
  adapter: vercel(),
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
