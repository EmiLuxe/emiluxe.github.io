import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-muted-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border border-border bg-surface-card px-4 py-2.5 text-sm text-white',
            'placeholder:text-muted transition-colors duration-200',
            'focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20',
            error && 'border-accent focus:ring-accent/30',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-accent">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
