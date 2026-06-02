import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
// @ts-expect-error — script ESM
import { scrapePelisplusPage } from './scripts/pelisplus-scrape-core.mjs';

const CACHE_TTL_MS = 5 * 60 * 1000;
const scrapeCache = new Map<string, { at: number; body: string }>();

function getCached(key: string) {
  const hit = scrapeCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    scrapeCache.delete(key);
    return null;
  }
  return hit.body;
}

function setCached(key: string, body: string) {
  scrapeCache.set(key, { at: Date.now(), body });
}

function loadEnvFiles() {
  const root = process.cwd();
  for (const file of ['.env.local', '.env', '.env.example']) {
    const fp = path.join(root, file);
    if (!fs.existsSync(fp)) continue;
    for (const line of fs.readFileSync(fp, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (key.startsWith('VITE_') && !process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

function pelisplusScrapePlugin(): Plugin {
  const handler: Connect.NextHandleFunction = async (req, res, next) => {
    const raw = req.url ?? '';
    if (!raw.startsWith('/api/pelisplus/')) return next();

    try {
      const url = new URL(raw, 'http://localhost');

      if (raw.startsWith('/api/pelisplus/play')) {
        const kind = url.searchParams.get('kind') || 'movies';
        const slug = url.searchParams.get('slug') || '';
        if (!['movies', 'series', 'animes'].includes(kind) || !slug) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'kind y slug requeridos' }));
          return;
        }
        const cacheKey = `play:${kind}:${slug}`;
        const cached = getCached(cacheKey);
        if (cached) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(cached);
          return;
        }
        // @ts-expect-error script ESM
        const { scrapePelisplusPlayback } = await import('./scripts/pelisplus-playback.mjs');
        const playback = await scrapePelisplusPlayback(kind, slug);
        const body = JSON.stringify(playback);
        setCached(cacheKey, body);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(body);
        return;
      }

      if (!raw.startsWith('/api/pelisplus/titles')) return next();

      const kind = url.searchParams.get('kind') || 'movies';
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));

      if (!['movies', 'series', 'animes'].includes(kind)) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'kind inválido' }));
        return;
      }

      const cacheKey = `titles:${kind}:${page}`;
      const cached = getCached(cacheKey);
      if (cached) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(cached);
        return;
      }

      const result = await scrapePelisplusPage(kind, page);
      const body = JSON.stringify(result);
      setCached(cacheKey, body);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(body);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Pelisplus API]', msg);
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: msg }));
    }
  };

  return {
    name: 'pelisplus-scrape-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(({ mode }) => {
  loadEnvFiles();
  loadEnv(mode, process.cwd(), 'VITE_');

  return {
    base: process.env.BASE_PATH || '/',
    plugins: [
      react(),
      pelisplusScrapePlugin(),
      {
        name: 'github-pages-spa-fallback',
        closeBundle() {
          const index = path.join(process.cwd(), 'dist', 'index.html');
          const fallback = path.join(process.cwd(), 'dist', '404.html');
          if (fs.existsSync(index)) {
            fs.copyFileSync(index, fallback);
          }
        },
      },
    ],
    envPrefix: 'VITE_',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
