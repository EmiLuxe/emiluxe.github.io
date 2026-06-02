/**
 * Genera JSON estático para GitHub Pages (catálogo + reproductor).
 * Se ejecuta en CI antes de `vite build` con VITE_STATIC_CATALOG=true.
 */
import fs from 'node:fs';
import path from 'node:path';
import { scrapePelisplusPage } from './pelisplus-scrape-core.mjs';
import { scrapePelisplusPlayback } from './pelisplus-playback.mjs';

const KINDS = ['movies', 'series', 'animes'];
const MAX_PAGES = Math.max(1, parseInt(process.env.CATALOG_MAX_PAGES || '3', 10));
const PLAYBACK_DELAY_MS = Math.max(0, parseInt(process.env.PLAYBACK_DELAY_MS || '350', 10));
const ROOT = process.cwd();
const DATA = path.join(ROOT, 'public', 'data');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data));
}

/** @type {Map<string, { kind: string, slug: string }>} */
const playbackJobs = new Map();

console.log(`[EmiLuxe] Generando catálogo estático (hasta ${MAX_PAGES} páginas por tipo)…`);

for (const kind of KINDS) {
  for (let page = 1; page <= MAX_PAGES; page++) {
    console.log(`  · ${kind} página ${page}`);
    const result = await scrapePelisplusPage(kind, page);
    const out = path.join(DATA, 'catalog', kind, `page-${page}.json`);
    writeJson(out, result);

    for (const t of result.titles) {
      if (t.slug) playbackJobs.set(`${kind}:${t.slug}`, { kind, slug: t.slug });
    }
  }
}

const manifest = {
  generatedAt: new Date().toISOString(),
  catalogMaxPages: MAX_PAGES,
  kinds: KINDS,
  playbackCount: playbackJobs.size,
};
writeJson(path.join(DATA, 'manifest.json'), manifest);

console.log(`[EmiLuxe] Generando ${playbackJobs.size} ficheros de reproducción…`);

let done = 0;
for (const { kind, slug } of playbackJobs.values()) {
  done += 1;
  if (done % 10 === 0 || done === playbackJobs.size) {
    console.log(`  · playback ${done}/${playbackJobs.size}`);
  }
  try {
    const playback = await scrapePelisplusPlayback(kind, slug);
    const out = path.join(DATA, 'playback', kind, `${slug}.json`);
    writeJson(out, playback);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  ⚠ ${kind}/${slug}: ${msg}`);
  }
  if (PLAYBACK_DELAY_MS > 0) await sleep(PLAYBACK_DELAY_MS);
}

console.log('[EmiLuxe] Datos estáticos listos en public/data/');
