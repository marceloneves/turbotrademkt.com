import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { noindexUrls } from './src/lib/site.js';

const SITE = 'https://turbotrademkt.com';
const excluded = new Set(noindexUrls().map((u) => SITE + u));

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !excluded.has(page) })],
});
