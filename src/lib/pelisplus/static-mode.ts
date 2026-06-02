/** true en build de GitHub Pages (catálogo JSON pregenerado en /data). */
export const useStaticCatalog = import.meta.env.VITE_STATIC_CATALOG === 'true';

function baseUrl(): string {
  const b = import.meta.env.BASE_URL;
  return b.endsWith('/') ? b : `${b}/`;
}

export function catalogJsonUrl(kind: string, page: number): string {
  return `${baseUrl()}data/catalog/${kind}/page-${page}.json`;
}

export function playbackJsonUrl(kind: string, slug: string): string {
  return `${baseUrl()}data/playback/${kind}/${encodeURIComponent(slug)}.json`;
}
