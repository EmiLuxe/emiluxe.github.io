import type { PelisplusKind } from './types';

export interface PelisplusSource {
  label: string;
  embedUrl: string;
}

export interface PelisplusPlayback {
  kind: PelisplusKind;
  slug: string;
  pageUrl: string;
  title?: string;
  posterUrl?: string;
  sources: PelisplusSource[];
}
