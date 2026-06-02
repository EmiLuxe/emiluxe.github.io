import type { PelisplusKind, PelisplusTitle } from './types';

const BASE = 'https://www.pelisplushd.la';

/** Rutas por sección del sitio */
export function listPath(kind: PelisplusKind, page: number): string {
  const base =
    kind === 'movies' ? '/peliculas' : kind === 'series' ? '/series' : '/animes';
  if (page <= 1) return `${BASE}${base}`;
  return `${BASE}${base}/page/${page}`;
}

function slugFromUrl(path: string): string {
  const parts = path.replace(/\/$/, '').split('/');
  return parts[parts.length - 1] || path;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/** "VER Título Online Gratis HD Título 7.5/10" */
function parseVerPattern(html: string, kind: PelisplusKind): PelisplusTitle[] {
  const items: PelisplusTitle[] = [];
  const re =
    /VER\s+(.+?)\s+Online\s+Gratis\s+HD\s+.+?\s+([\d.]+)\/10/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const title = decodeHtml(m[1].trim());
    if (title.length < 2) continue;
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    items.push({
      title,
      slug,
      url: `${BASE}/${kind === 'movies' ? 'pelicula' : kind === 'series' ? 'serie' : 'anime'}/${slug}`,
      rating: parseFloat(m[2]),
      kind,
    });
  }
  return items;
}

/** Enlaces reales del HTML */
function parseAnchorPattern(html: string, kind: PelisplusKind): PelisplusTitle[] {
  const segment =
    kind === 'movies' ? 'pelicula' : kind === 'series' ? 'serie' : 'anime';
  const items: PelisplusTitle[] = [];
  const re = new RegExp(
    `<a[^>]+href="(/${segment}/[^"#?]+)"[^>]*>[\\s\\S]*?<\\/a>`,
    'gi',
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const path = m[1];
    const block = m[0];
    const alt = block.match(/alt="([^"]+)"/i)?.[1];
    const h2 = block.match(/<h2[^>]*>([^<]+)</i)?.[1];
    const titleRaw = alt || h2 || slugFromUrl(path).replace(/-/g, ' ');
    const title = decodeHtml(titleRaw.trim());
    if (!title || title.length < 2) continue;

    const ratingMatch = block.match(/([\d.]+)\/10/);
    items.push({
      title,
      slug: slugFromUrl(path),
      url: `${BASE}${path}`,
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : undefined,
      kind,
    });
  }
  return items;
}

export function parseTitlesFromHtml(html: string, kind: PelisplusKind): PelisplusTitle[] {
  const byUrl = new Map<string, PelisplusTitle>();

  for (const item of [...parseAnchorPattern(html, kind), ...parseVerPattern(html, kind)]) {
    const key = item.slug.toLowerCase();
    if (!byUrl.has(key)) byUrl.set(key, item);
  }

  return [...byUrl.values()];
}

export function parseTotalPages(html: string): number | undefined {
  const pages = [...html.matchAll(/\/page\/(\d+)/g)].map((m) => parseInt(m[1], 10));
  if (!pages.length) {
    const last = html.match(/>\s*(\d{2,4})\s*<\/a>\s*\\?>/i);
    if (last) return parseInt(last[1], 10);
  }
  return pages.length ? Math.max(...pages) : undefined;
}
