import { posterFromThumbSrc } from './pelisplus-scrape-core.mjs';

const BASE = 'https://www.pelisplushd.la';

function decodeHtml(s) {
  return s.replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"');
}

function absUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export function segmentForKind(kind) {
  if (kind === 'series') return 'serie';
  if (kind === 'animes') return 'anime';
  return 'pelicula';
}

export function pageUrlFor(kind, slug) {
  return `${BASE}/${segmentForKind(kind)}/${slug}`;
}

export function parsePlaybackFromHtml(html, pageUrl) {
  const sources = [];
  const seen = new Set();

  const liRe = /<li[^>]*class="[^"]*playurl[^"]*"[^>]*>[\s\S]*?<\/li>/gi;
  let m;
  while ((m = liRe.exec(html)) !== null) {
    const block = m[0];
    const embedUrl = decodeHtml(block.match(/data-url="([^"]+)"/i)?.[1]?.trim() ?? '');
    if (!embedUrl || seen.has(embedUrl)) continue;
    seen.add(embedUrl);
    const anchor = decodeHtml(block.match(/<a[^>]*>([^<]*)<\/a>/i)?.[1]?.trim() ?? '');
    const dataName = decodeHtml(block.match(/data-name="([^"]*)"/i)?.[1]?.trim() ?? '');
    const label = anchor || dataName || `Servidor ${sources.length + 1}`;
    sources.push({ label, embedUrl });
  }

  if (!sources.length) {
    const fallback = [...html.matchAll(/data-url="(https?:\/\/[^"]+)"/gi)];
    for (const fm of fallback) {
      const embedUrl = decodeHtml(fm[1].trim());
      if (!embedUrl || seen.has(embedUrl)) continue;
      seen.add(embedUrl);
      sources.push({ label: `Servidor ${sources.length + 1}`, embedUrl });
    }
  }

  const title =
    decodeHtml(html.match(/<h1[^>]*>([^<]+)/i)?.[1]?.trim() ?? '') ||
    decodeHtml(html.match(/property="og:title"\s+content="([^"]+)"/i)?.[1]?.trim() ?? '');

  const ogPoster = html.match(/property="og:image"\s+content="([^"]+)"/i)?.[1];
  const posterPath = html.match(/src="(\/poster\/[^"]+)"/i)?.[1];
  const rawPoster = ogPoster || posterPath || '';
  const posterUrl = rawPoster ? posterFromThumbSrc(rawPoster) : '';

  return {
    pageUrl,
    title: title || undefined,
    posterUrl: posterUrl || undefined,
    sources,
  };
}

export async function scrapePelisplusPlayback(kind, slug) {
  const pageUrl = pageUrlFor(kind, slug);
  console.info('[Pelisplus play] →', pageUrl);
  const res = await fetch(pageUrl, {
    headers: { 'User-Agent': 'EmiLuxe-Player/1.0', Accept: 'text/html' },
  });
  if (!res.ok) throw new Error(`Fetch ${res.status} ${pageUrl}`);
  const html = await res.text();
  const playback = parsePlaybackFromHtml(html, pageUrl);
  if (!playback.sources.length) {
    throw new Error('No se encontraron servidores de reproducción en la ficha.');
  }
  console.info('[Pelisplus play] ←', playback.sources.length, 'fuentes');
  return { kind, slug, ...playback };
}
