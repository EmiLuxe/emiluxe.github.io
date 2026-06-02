import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { ContentGrid } from '@/components/media';
import { fetchPelisplusTitles } from '@/lib/pelisplus/api';
import { pelisplusToContentItem } from '@/lib/pelisplus/to-content';

export default function SearchPage() {
  const [query, setQuery] = useState('');

  const { data: catalog } = useQuery({
    queryKey: ['pelisplus', 'search-index'],
    queryFn: async () => {
      const [movies, series, animes] = await Promise.all([
        fetchPelisplusTitles('movies', 1),
        fetchPelisplusTitles('series', 1),
        fetchPelisplusTitles('animes', 1),
      ]);
      return [...movies.titles, ...series.titles, ...animes.titles].map(pelisplusToContentItem);
    },
    staleTime: 1000 * 60 * 5,
  });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2 || !catalog) return [];
    return catalog.filter((item) => item.title.toLowerCase().includes(q));
  }, [query, catalog]);

  return (
    <div className="pb-16 pt-4">
      <div className="content-container-wide">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en la primera página de cada catálogo…"
            className="w-full rounded-2xl border border-border bg-surface-card py-4 pl-12 pr-12 text-lg text-white placeholder:text-muted focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {query.length >= 2 && (
          <div className="mt-10">
            <p className="mb-6 text-sm text-muted">
              {results.length} resultados (página 1 de películas, series y animes)
            </p>
            {results.length > 0 ? (
              <ContentGrid items={results} />
            ) : (
              <p className="text-center text-muted">Sin resultados en esta muestra</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
