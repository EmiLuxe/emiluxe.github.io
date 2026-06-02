import { cn } from '@/utils/cn';

type BadgeVariant = 'default' | 'accent' | 'gold' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-surface-card text-muted-foreground',
  accent: 'bg-accent/20 text-accent border border-accent/30',
  gold: 'bg-gold/15 text-gold border border-gold/25',
  outline: 'bg-transparent border border-border text-muted-foreground',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tracking-wide uppercase',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
