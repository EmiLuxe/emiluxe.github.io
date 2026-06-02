import type { ContentItem } from '@/data/types/content';
import { fetchPelisplusTitles } from './api';
import { pelisplusToContentItem } from './to-content';
export async function pelisplusHomeRows(): Promise<{
  hero: ContentItem;
  movies: ContentItem[];
  series: ContentItem[];
  animes: ContentItem[];
}> {
  const [moviesRes, seriesRes, animesRes] = await Promise.all([
    fetchPelisplusTitles('movies', 1),
    fetchPelisplusTitles('series', 1),
    fetchPelisplusTitles('animes', 1),
  ]);

  const movies = moviesRes.titles.map(pelisplusToContentItem);
  const series = seriesRes.titles.map(pelisplusToContentItem);
  const animes = animesRes.titles.map(pelisplusToContentItem);

  const hero = movies[0] ?? series[0] ?? animes[0];
  if (!hero) {
    throw new Error('No se encontraron títulos en el catálogo.');
  }

  return { hero, movies, series, animes };
}
