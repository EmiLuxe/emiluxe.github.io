import type { ContentItem, ContentType } from '@/data/types/content';
import type { PelisplusTitle } from './types';

function toContentType(kind: PelisplusTitle['kind']): ContentType {
  if (kind === 'series') return 'series';
  if (kind === 'animes') return 'anime';
  return 'movie';
}

export function pelisplusToContentItem(item: PelisplusTitle): ContentItem {
  return {
    id: `pelisplus-${item.kind}-${item.slug}`,
    title: item.title,
    description: `Disponible en tu catálogo · ${item.url}`,
    type: toContentType(item.kind),
    posterUrl: item.posterUrl ?? '',
    backdropUrl: item.backdropUrl ?? item.posterUrl ?? '',
    year: item.year ?? new Date().getFullYear(),
    rating: item.rating ?? 0,
    genres: [],
    contentRating: 'PG-13',
    externalUrl: item.url,
  };
}
