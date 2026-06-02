/**
 * Exporta títulos a JSON (solo metadatos, sin vídeos).
 * Uso: node scripts/scrape-pelisplus-titles.mjs movies 1
 */
import fs from 'node:fs';
import path from 'node:path';
import { scrapePelisplusPage } from './pelisplus-scrape-core.mjs';

const kind = process.argv[2] || 'movies';
const page = parseInt(process.argv[3] || '1', 10);

if (!['movies', 'series', 'animes'].includes(kind)) {
  console.error('kind debe ser: movies | series | animes');
  process.exit(1);
}

const result = await scrapePelisplusPage(kind, page);
const out = path.join(process.cwd(), 'public', `pelisplus-${kind}-p${page}.json`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(result, null, 2));
console.log('Guardado:', out, '→', result.titles.length, 'títulos');
