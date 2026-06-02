const BASE = 'https://www.pelisplushd.la';

export function listPath(kind, page) {
  const base =
    kind === 'movies' ? '/peliculas' : kind === 'series' ? '/series' : '/animes';
  if (page <= 1) return `${BASE}${base}`;
  return `${BASE}${base}?page=${page}`;
}

function slugFromUrl(path) {
  const parts = path.replace(/\/$/, '').split('/');
  return parts[parts.length - 1] || path;
}

function decodeHtml(s) {
  return s.replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"');
}

function absUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Thumb → imagen más grande en el mismo servidor */
export function posterFromThumbSrc(src) {
  if (!src) return '';
  const full = src.replace(/-thumb\.(jpe?g|webp|png)$/i, '.$1');
  return absUrl(full);
}

function titleFromPosterAlt(alt) {
  return decodeHtml(
    alt
      .replace(/^VER\s+/i, '')
      .replace(/\s+Online\s+Gratis\s+HD.*$/i, '')
      .trim(),
  );
}

export function parseTitlesFromHtml(html, kind) {
  const segment =
    kind === 'movies' ? 'pelicula' : kind === 'series' ? 'serie' : 'anime';
  const bySlug = new Map();

  const posterBlockRe = new RegExp(
    `<a\\s+href="(/${segment}/[^"#?]+)"[^>]*class="Posters-link"[^>]*>\\s*<img[^>]+src="([^"]+)"[^>]*alt="([^"]+)"`,
    'gi',
  );
  let m;
  while ((m = posterBlockRe.exec(html)) !== null) {
    const path = m[1];
    const thumbSrc = m[2];
    const slug = slugFromUrl(path);
    const title = titleFromPosterAlt(m[3]);
    const posterUrl = posterFromThumbSrc(thumbSrc);
    bySlug.set(slug, {
      title: title || slug.replace(/-/g, ' '),
      slug,
      url: `${BASE}${path}`,
      posterUrl,
      backdropUrl: posterUrl,
      kind,
    });
  }

  const verRe = /VER\s+(.+?)\s+Online\s+Gratis\s+HD\s+.+?\s+([\d.]+)\/10/gi;
  while ((m = verRe.exec(html)) !== null) {
    const title = decodeHtml(m[1].trim());
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const existing = bySlug.get(slug) ?? {
      title,
      slug,
      url: `${BASE}/${segment}/${slug}`,
      kind,
    };
    existing.rating = parseFloat(m[2]);
    if (!existing.title) existing.title = title;
    bySlug.set(slug, existing);
  }

  const linkRe = new RegExp(
    `<a[^>]+href="(/${segment}/[^"#?]+)"[^>]*>[\\s\\S]*?<\\/a>`,
    'gi',
  );
  while ((m = linkRe.exec(html)) !== null) {
    const path = m[1];
    const block = m[0];
    const slug = slugFromUrl(path);
    const alt = block.match(/alt="([^"]+)"/i)?.[1];
    const h2 = block.match(/<h2[^>]*>([^<]+)</i)?.[1];
    const title = decodeHtml(
      (alt ? titleFromPosterAlt(alt) : h2 || slugFromUrl(path).replace(/-/g, ' ')).trim(),
    );
    if (!title || title.length < 2) continue;

    const imgSrc =
      block.match(/class="[^"]*Posters-img[^"]*"[^>]*src="([^"]+)"/i)?.[1] ??
      block.match(/src="(\/poster\/[^"]+)"/i)?.[1];
    const ratingMatch = block.match(/([\d.]+)\/10/);

    const existing = bySlug.get(slug) ?? {
      title,
      slug,
      url: `${BASE}${path}`,
      kind,
    };
    if (!existing.title) existing.title = title;
    if (ratingMatch) existing.rating = parseFloat(ratingMatch[1]);
    if (imgSrc && !existing.posterUrl) {
      const posterUrl = posterFromThumbSrc(imgSrc);
      existing.posterUrl = posterUrl;
      existing.backdropUrl = posterUrl;
    }
    bySlug.set(slug, existing);
  }

  return [...bySlug.values()];
}

export function parseTotalPages(html) {
  const pages = [...html.matchAll(/[?&]page=(\d+)/gi)]
    .map((x) => parseInt(x[1], 10))
    .filter((n) => n >= 1 && n <= 10_000);
  return pages.length ? Math.max(...pages) : 1;
}

export async function scrapePelisplusPage(kind, page) {
  const url = listPath(kind, page);
  console.info('[Pelisplus scrape] →', url);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'EmiLuxe-CatalogSync/1.0',
      Accept: 'text/html',
    },
  });
  if (!res.ok) throw new Error(`Fetch ${res.status} ${url}`);
  const html = await res.text();
  const titles = parseTitlesFromHtml(html, kind);
  const withPoster = titles.filter((t) => t.posterUrl).length;
  const totalPages = parseTotalPages(html);
  console.info('[Pelisplus scrape] ←', titles.length, 'títulos,', withPoster, 'con portada');
  return {
    kind,
    page,
    totalPages,
    titles,
    scrapedAt: new Date().toISOString(),
  };
}
