import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Info, Play, Plus } from 'lucide-react';
import type { ContentItem } from '@/data/types/content';
import { Badge } from '@/design-system/components';
import { MotionButton } from '@/design-system/components/Button';
import { contentPath } from '@/navigation/paths';
import { formatRating, getTypeLabel } from '@/utils/content';

interface CinematicHeroProps {
  item: ContentItem;
}

export function CinematicHero({ item }: CinematicHeroProps) {
  const navigate = useNavigate();
  const bg = item.backdropUrl || item.posterUrl;
  const detailTo = contentPath(item);

  return (
    <section className="relative h-[70vh] min-h-[480px] max-h-[900px] w-full overflow-hidden md:h-[85vh]">
      <div className="absolute inset-0">
        {bg ? (
          <img src={bg} alt="" className="h-full w-full object-cover object-top" />
        ) : (
          <div className="h-full w-full bg-surface-card" />
        )}
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute inset-0 bg-hero-side" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/40 to-transparent" />
      </div>

      <div className="relative z-10 flex h-full items-end">
        <div className="content-container-wide pb-16 md:pb-24 lg:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl lg:max-w-3xl"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="accent">{getTypeLabel(item.type)}</Badge>
              <Badge variant="gold">★ {formatRating(item.rating)}</Badge>
              <Badge variant="outline">{item.year}</Badge>
            </div>

            <h1 className="font-display text-5xl leading-none tracking-wide text-white sm:text-6xl md:text-7xl lg:text-8xl">
              {item.title}
            </h1>

            <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-white/80 md:text-base md:max-w-2xl">
              {item.description}
            </p>

            {item.genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.genres.slice(0, 4).map((genre) => (
                  <span key={genre} className="text-xs text-muted-foreground">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <MotionButton
                variant="primary"
                size="lg"
                className="min-w-[140px]"
                onClick={() => navigate(detailTo)}
              >
                <Play className="h-5 w-5 fill-current" />
                Reproducir
              </MotionButton>
              <Link to={detailTo}>
                <MotionButton variant="secondary" size="lg" type="button">
                  <Info className="h-5 w-5" />
                  Más info
                </MotionButton>
              </Link>
              <MotionButton variant="ghost" size="lg" className="!px-3">
                <Plus className="h-5 w-5" />
              </MotionButton>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface to-transparent" />
    </section>
  );
}
