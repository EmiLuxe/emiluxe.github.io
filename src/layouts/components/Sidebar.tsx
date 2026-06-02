import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BrandLogo } from '@/components/common/BrandLogo';
import { mainNavItems } from '../config/navigation';
import { paths } from '@/navigation/paths';
import { cn } from '@/utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function NavSection({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: readonly { label: string; path: string; icon: React.ComponentType<{ className?: string }> }[];
  onNavigate?: () => void;
}) {
  const location = useLocation();

  return (
    <div className="mb-6">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map(({ label, path, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <li key={path}>
              <Link
                to={path}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-accent/15 text-white'
                    : 'text-muted-foreground hover:bg-surface-hover hover:text-white',
                )}
              >
                <Icon
                  className={cn('h-5 w-5 shrink-0', active && 'text-accent')}
                />
                {label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const sidebarContent = (
    <aside className="flex h-full w-[280px] flex-col border-r border-border bg-surface-elevated/95 backdrop-blur-xl">
      <div className="flex h-16 items-center border-b border-border px-4 lg:hidden">
        <Link to={paths.home} onClick={onClose}>
          <BrandLogo />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <NavSection title="Menú" items={mainNavItems} onNavigate={onClose} />
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-xl bg-gradient-to-br from-accent/20 to-surface-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Premium
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Desbloquea 4K, descargas y perfiles ilimitados.
          </p>
          <button
            type="button"
            className="mt-3 w-full rounded-lg bg-accent py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Mejorar plan
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-sidebar lg:block lg:pt-16">
        {sidebarContent}
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-overlay bg-black/70 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-sidebar lg:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
