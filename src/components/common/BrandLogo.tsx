import { cn } from '@/utils/cn';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl',
} as const;

/** Marca: EMI en blanco, LUXE en rojo (accent). */
export function BrandLogo({ className, size = 'md' }: BrandLogoProps) {
  return (
    <span className={cn('font-display tracking-wider', sizeClasses[size], className)}>
      <span className="text-white">EMI</span>
      <span className="text-accent">LUXE</span>
    </span>
  );
}
