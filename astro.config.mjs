// @ts-check
import { defineConfig } from 'astro/config';

// Public site URL (canonical, sitemap, Open Graph). Override with SITE_URL at build time.
const site = process.env.SITE_URL || 'https://hypsos.co';

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  vite: {
    build: { chunkSizeWarningLimit: 900 },
  },
});
