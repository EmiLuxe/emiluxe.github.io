import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Plus, Star } from 'lucide-react';
import type { ContentItem } from '@/data/types/content';
import { Badge } from '@/design-system/components';
import { contentPath } from '@/navigation/paths';
import { cn } from '@/utils/cn';
import { formatRating, getTypeLabel } from '@/utils/content';

interface ContentCardProps {
  item: ContentItem;
  variant?: 'poster' | 'wide';
  showProgress?: boolean;
  className?: string;
}

export function ContentCard({
  item,
  variant = 'poster',
  showProgress = false,
  className,
}: ContentCardProps) {
  const navigate = useNavigate();
  const progress = item.progress ?? 0;
  const imageUrl = variant === 'wide' ? item.backdropUrl || item.posterUrl : item.posterUrl;
  const detailTo = contentPath(item);
  const isPelisplus = item.id.startsWith('pelisplus-');
  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(detailTo);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (!isPelisplus) return;
    e.preventDefault();
    navigate(detailTo);
  };

  const poster = (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-surface-card shadow-card',
        variant === 'poster' ? 'aspect-[2/3]' : 'aspect-video',
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-surface-hover px-2 text-center text-xs text-muted">
          {item.title}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <button
          type="button"
          onClick={handlePlay}
          aria-label={`Reproducir ${item.title}`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg"
        >
          <Play className="h-4 w-4 fill-current" />
        </button>
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          aria-label={`Añadir ${item.title}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/50 backdrop-blur-sm"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {showProgress && progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="absolute top-2 left-2">
        <Badge variant="outline" className="bg-black/60 backdrop-blur-sm text-[10px]">
          {getTypeLabel(item.type)}
        </Badge>
      </div>
    </div>
  );

  const titleEl = (
    <h3 className="line-clamp-2 text-sm font-medium text-white transition-colors group-hover:text-accent">
      {item.title}
    </h3>
  );

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'group relative shrink-0',
        variant === 'poster' ? 'w-[140px] sm:w-[160px] md:w-[180px]' : 'w-[280px] sm:w-[320px]',
        className,
      )}
    >
      {isPelisplus ? (
        <button type="button" onClick={handleCardClick} className="block w-full text-left">
          {poster}
        </button>
      ) : (
        <Link to={detailTo} className="block">
          {poster}
        </Link>
      )}

      <div className="mt-2 px-0.5">
        {isPelisplus ? (
          <button type="button" onClick={handleCardClick} className="text-left">
            {titleEl}
          </button>
        ) : (
          <Link to={detailTo}>{titleEl}</Link>
        )}
        <div className="mt-1 flex items-center gap-2 text-xs text-muted">
          {item.rating > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-gold text-gold" />
              {formatRating(item.rating)}
            </span>
          )}
          <span>{item.year}</span>
        </div>
      </div>
    </motion.article>
  );
}
