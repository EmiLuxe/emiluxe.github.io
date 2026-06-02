import type { PelisplusKind, PelisplusScrapeResult } from './types';
import { catalogJsonUrl, useStaticCatalog } from './static-mode';

export async function fetchPelisplusTitles(
  kind: PelisplusKind = 'movies',
  page = 1,
): Promise<PelisplusScrapeResult> {
  const res = useStaticCatalog
    ? await fetch(catalogJsonUrl(kind, page))
    : await fetch(`/api/pelisplus/titles?${new URLSearchParams({ kind, page: String(page) })}`);

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[Pelisplus] scrape error', res.status, body);
    if (useStaticCatalog && res.status === 404) {
      throw new Error(
        `Página ${page} no está en este despliegue. Usa «Cargar más» solo hasta las páginas publicadas en la última build.`,
      );
    }
    throw new Error(`Pelisplus scrape ${res.status}: ${body.slice(0, 120)}`);
  }

  const data = (await res.json()) as PelisplusScrapeResult;
  console.info('[Pelisplus] títulos', {
    kind,
    page,
    count: data.titles.length,
    withPosters: data.titles.filter((t) => t.posterUrl).length,
    totalPages: data.totalPages,
  });
  return data;
}
