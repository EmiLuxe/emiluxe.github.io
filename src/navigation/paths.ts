export const paths = {
  home: '/',
  anime: '/anime',
  movies: '/movies',
  series: '/series',
  search: '/search',
  pelisplusWatch: '/ver/:kind/:slug',
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];

export function pelisplusWatchPath(id: string): string | null {
  const m = id.match(/^pelisplus-(movies|series|animes)-(.+)$/);
  if (!m) return null;
  return `/ver/${m[1]}/${m[2]}`;
}

export function contentPath(item: { id: string; type: string }): string {
  const pp = pelisplusWatchPath(item.id);
  if (pp) return `${pp}?play=1`;
  return paths.home;
}
