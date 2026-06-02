/**
 * Parser usado solo en Node (middleware Vite / scripts).
 * Duplicado mínimo para evitar importar en cliente.
 */
import type { PelisplusKind, PelisplusTitle } from './types';

const BASE = 'https://www.pelisplushd.la';

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
    .replace(/&quot;/g, '"');
}

export function parseTitlesFromHtml(html: string, kind: PelisplusKind): PelisplusTitle[] {
  const segment =
    kind === 'movies' ? 'pelicula' : kind === 'series' ? 'serie' : 'anime';
  const byUrl = new Map<string, PelisplusTitle>();

  const verRe = /VER\s+(.+?)\s+Online\s+Gratis\s+HD\s+.+?\s+([\d.]+)\/10/gi;
  let m: RegExpExecArray | null;
  while ((m = verRe.exec(html)) !== null) {
    const title = decodeHtml(m[1].trim());
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    byUrl.set(slug, {
      title,
      slug,
      url: `${BASE}/${segment}/${slug}`,
      rating: parseFloat(m[2]),
      kind,
    });
  }

  const linkRe = new RegExp(
    `<a[^>]+href="(/${segment}/[^"#?]+)"[^>]*>[\\s\\S]*?<\\/a>`,
    'gi',
  );
  while ((m = linkRe.exec(html)) !== null) {
    const path = m[1];
    const block = m[0];
    const alt = block.match(/alt="([^"]+)"/i)?.[1];
    const h2 = block.match(/<h2[^>]*>([^<]+)</i)?.[1];
    const title = decodeHtml((alt || h2 || slugFromUrl(path).replace(/-/g, ' ')).trim());
    if (!title || title.length < 2) continue;
    const slug = slugFromUrl(path);
    const ratingMatch = block.match(/([\d.]+)\/10/);
    byUrl.set(slug, {
      title,
      slug,
      url: `${BASE}${path}`,
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : undefined,
      kind,
    });
  }

  return [...byUrl.values()];
}

export function parseTotalPages(html: string): number | undefined {
  const pages = [...html.matchAll(/\/page\/(\d+)/g)].map((x) => parseInt(x[1], 10));
  return pages.length ? Math.max(...pages) : undefined;
}
