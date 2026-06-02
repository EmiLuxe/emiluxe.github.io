import type { ContentItem, ContentType } from '@/data/types/content';

export function filterByType(items: ContentItem[], type: ContentType) {
  return items.filter((item) => item.type === type);
}

export function getContentById(items: ContentItem[], id: string) {
  return items.find((item) => item.id === id);
}

export function formatRating(rating: number) {
  return rating.toFixed(1);
}

export function getTypeLabel(type: ContentType) {
  const labels: Record<ContentType, string> = {
    anime: 'Anime',
    movie: 'Película',
    series: 'Serie',
  };
  return labels[type];
}
