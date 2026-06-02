import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Search, X } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { paths } from '@/navigation/paths';
import { mainNavItems } from '../config/navigation';
import { cn } from '@/utils/cn';

interface NavbarProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

export function Navbar({ onMenuToggle, isSidebarOpen }: NavbarProps) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isHome = location.pathname === paths.home;

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-nav transition-all duration-300',
        scrolled || !isHome
          ? 'bg-surface/95 shadow-lg shadow-black/20 backdrop-blur-xl'
          : 'bg-gradient-to-b from-black/80 to-transparent',
      )}
    >
      <nav className="content-container-wide flex h-16 items-center justify-between gap-4 md:h-18">
        <div className="flex items-center gap-4 lg:gap-8">
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10 lg:hidden"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to={paths.home} className="group flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent shadow-glow">
              <span className="ml-0.5 h-0 w-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-white" />
            </span>
            <BrandLogo className="transition-opacity group-hover:opacity-90" />
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {mainNavItems.map(({ label, path }) => {
              const active = location.pathname === path;
              return (
                <li key={path}>
                  <Link
                    to={path}
                    className={cn(
                      'relative px-4 py-2 text-sm font-medium transition-colors',
                      active ? 'text-white' : 'text-muted-foreground hover:text-white',
                    )}
                  >
                    {label}
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-accent"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to={paths.search}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </Link>

        </div>
      </nav>
    </header>
  );
}
