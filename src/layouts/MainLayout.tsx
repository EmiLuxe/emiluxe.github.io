import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { paths } from '@/navigation/paths';
import { cn } from '@/utils/cn';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === paths.home;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        onMenuToggle={() => setSidebarOpen((o) => !o)}
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={cn('flex flex-1 flex-col lg:pl-[280px]')}>
        <main
          className={cn(
            'flex-1',
            !isHome && 'pt-16 md:pt-18',
          )}
        >
          <Outlet key={location.pathname} />
        </main>
        <Footer />
      </div>
    </div>
  );
}
