export type PelisplusKind = 'movies' | 'series' | 'animes';

export interface PelisplusTitle {
  title: string;
  slug: string;
  url: string;
  rating?: number;
  kind: PelisplusKind;
  /** Portadas desde pelisplushd.la (/poster/...) */
  posterUrl?: string;
  backdropUrl?: string;
  year?: number;
}

export interface PelisplusScrapeResult {
  kind: PelisplusKind;
  page: number;
  totalPages?: number;
  titles: PelisplusTitle[];
  scrapedAt: string;
}
