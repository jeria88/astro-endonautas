import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://endonautas.cl',
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/draft/') && !page.includes('/fractones/') && !page.includes('/review-social'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
});
