export type ContentType = 'anime' | 'movie' | 'series';

export type ContentRating = 'G' | 'PG' | 'PG-13' | 'R' | 'TV-MA';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  posterUrl: string;
  backdropUrl: string;
  year: number;
  rating: number;
  duration?: string;
  genres: string[];
  contentRating: ContentRating;
  featured?: boolean;
  trending?: boolean;
  progress?: number;
  episodeLabel?: string;
  /** Enlace externo (ej. ficha en pelisplushd) */
  externalUrl?: string;
}

export interface ContentDetail extends ContentItem {
  tmdbId: number;
  trailerKey?: string;
  tagline?: string;
}

export interface AnimeItem extends ContentItem {
  type: 'anime';
  episodes: number;
  status: 'airing' | 'completed' | 'upcoming';
  studio: string;
  malScore?: number;
}

export interface MovieItem extends ContentItem {
  type: 'movie';
  director: string;
  cast: string[];
  tmdbId?: number;
}

export interface SeriesItem extends ContentItem {
  type: 'series';
  seasons: number;
  episodes: number;
  network: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  plan: 'free' | 'premium' | 'ultra';
  memberSince: string;
}

export interface WatchHistoryEntry {
  id: string;
  contentId: string;
  watchedAt: string;
  progress: number;
}

export interface AppSettings {
  autoplay: boolean;
  autoplayPreviews: boolean;
  subtitles: boolean;
  subtitleLanguage: string;
  videoQuality: 'auto' | '1080p' | '720p' | '480p';
  language: string;
  notifications: boolean;
}
