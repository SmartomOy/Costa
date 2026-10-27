// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages: SITE_URL=https://<käyttäjä>.github.io BASE_PATH=/costa
// Oma domain: SITE_URL=https://www.trimmaamocosta.fi (BASE_PATH jätetään pois)
export default defineConfig({
  site: process.env.SITE_URL || 'https://trimmaamocosta.fi', // PAIKKATIETO: oma domain
  base: process.env.BASE_PATH || '/',
  compressHTML: true,
});
