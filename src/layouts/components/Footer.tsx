import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/common/BrandLogo';
import { paths } from '@/navigation/paths';

const footerLinks = [
  { label: 'Inicio', to: paths.home },
  { label: 'Películas', to: paths.movies },
  { label: 'Series', to: paths.series },
  { label: 'Anime', to: paths.anime },
  { label: 'Buscar', to: paths.search },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface-elevated/50">
      <div className="content-container-wide py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link to={paths.home}>
            <BrandLogo />
          </Link>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map(({ label, to }) => (
              <li key={to}>
                <Link to={to} className="text-sm text-muted hover:text-accent">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-6 text-xs text-muted">Catálogo sincronizado con PelisPlusHD · Solo títulos y reproductor embebido</p>
      </div>
    </footer>
  );
}
