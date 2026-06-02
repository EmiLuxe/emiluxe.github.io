import type { PelisplusKind } from './types';
import type { PelisplusPlayback } from './playback-types';
import { playbackJsonUrl, useStaticCatalog } from './static-mode';

export async function fetchPelisplusPlayback(
  kind: PelisplusKind,
  slug: string,
): Promise<PelisplusPlayback> {
  const res = useStaticCatalog
    ? await fetch(playbackJsonUrl(kind, slug))
    : await fetch(`/api/pelisplus/play?${new URLSearchParams({ kind, slug })}`);

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Reproducción ${res.status}: ${body.slice(0, 160)}`);
  }

  return res.json() as Promise<PelisplusPlayback>;
}
