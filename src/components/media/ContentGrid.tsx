import { motion } from 'framer-motion';
import type { ContentItem } from '@/data/types/content';
import { ContentCard } from './ContentCard';

interface ContentGridProps {
  items: ContentItem[];
  showProgress?: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export function ContentGrid({ items, showProgress }: ContentGridProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:gap-6"
    >
      {items.map((item) => (
        <ContentCard key={item.id} item={item} showProgress={showProgress} className="w-full" />
      ))}
    </motion.div>
  );
}
