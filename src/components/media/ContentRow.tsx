import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ContentItem } from '@/data/types/content';
import { ContentCard } from './ContentCard';
import { cn } from '@/utils/cn';

interface ContentRowProps {
  title: string;
  subtitle?: string;
  items: ContentItem[];
  showProgress?: boolean;
  variant?: 'poster' | 'wide';
  className?: string;
}

export function ContentRow({
  title,
  subtitle,
  items,
  showProgress = false,
  variant = 'poster',
  className,
}: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <section className={cn('relative py-6 md:py-8', className)}>
      <div className="content-container-wide mb-4 flex items-end justify-between gap-4">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="font-display text-2xl tracking-wide text-white md:text-3xl"
          >
            {title}
          </motion.h2>
          {subtitle && (
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          )}
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Desplazar izquierda"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-card/80 text-white transition-colors hover:bg-surface-hover"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Desplazar derecha"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-card/80 text-white transition-colors hover:bg-surface-hover"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-3 overflow-x-auto px-4 sm:gap-4 sm:px-6 lg:px-8 3xl:px-12"
        >
          {items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              variant={variant}
              showProgress={showProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
