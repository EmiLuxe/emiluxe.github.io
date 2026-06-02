import { Film, Home, Search, Sparkles, Tv } from 'lucide-react';
import { paths } from '@/navigation/paths';

export const mainNavItems = [
  { label: 'Inicio', path: paths.home, icon: Home },
  { label: 'Películas', path: paths.movies, icon: Film },
  { label: 'Series', path: paths.series, icon: Tv },
  { label: 'Anime', path: paths.anime, icon: Sparkles },
  { label: 'Buscar', path: paths.search, icon: Search },
] as const;
