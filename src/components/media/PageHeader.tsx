import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
}

export function PageHeader({ title, description, badge }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="content-container-wide border-b border-border pb-8 pt-6 md:pt-10"
    >
      {badge && (
        <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-accent">
          {badge}
        </span>
      )}
      <h1 className="font-display text-4xl tracking-wide text-white md:text-5xl lg:text-6xl">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-2xl text-base text-muted md:text-lg">{description}</p>
      )}
    </motion.header>
  );
}
