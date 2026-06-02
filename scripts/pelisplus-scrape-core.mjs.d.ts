declare module './scripts/pelisplus-scrape-core.mjs' {
  export type PelisplusKind = 'movies' | 'series' | 'animes';

  export interface PelisplusTitle {
    title: string;
    slug: string;
    url: string;
    rating?: number;
    kind: PelisplusKind;
  }

  export interface PelisplusScrapeResult {
    kind: PelisplusKind;
    page: number;
    totalPages?: number;
    titles: PelisplusTitle[];
    scrapedAt: string;
  }

  export function scrapePelisplusPage(
    kind: PelisplusKind,
    page: number,
  ): Promise<PelisplusScrapeResult>;
}
