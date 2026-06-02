import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ContentGrid } from '@/components/media';
import { ErrorState } from '@/components/common/ErrorState';
import { Button, Skeleton } from '@/design-system/components';
import { fetchPelisplusTitles } from '@/lib/pelisplus/api';
import { pelisplusToContentItem } from '@/lib/pelisplus/to-content';
import type { PelisplusKind } from '@/lib/pelisplus/types';

interface PelisplusInfiniteCatalogProps {
  kind: PelisplusKind;
}

export function PelisplusInfiniteCatalog({ kind }: PelisplusInfiniteCatalogProps) {
  const query = useInfiniteQuery({
    queryKey: ['pelisplus', 'catalog', kind],
    queryFn: ({ pageParam }) => fetchPelisplusTitles(kind, pageParam),
    initialPageParam: 1,
    refetchOnMount: 'always',
    getNextPageParam: (last) => {
      const total = last.totalPages ?? 1;
      if (last.page >= total) return undefined;
      return last.page + 1;
    },
  });

  const items = useMemo(
    () =>
      query.data?.pages.flatMap((p) => p.titles.map(pelisplusToContentItem)) ?? [],
    [query.data],
  );

  const totalPages = query.data?.pages[0]?.totalPages ?? 1;
  const loadedPages = query.data?.pages.length ?? 0;
  const approxTotal = totalPages * (query.data?.pages[0]?.titles.length ?? 24);

  if (query.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (query.error) {
    return (
      <ErrorState
        message={query.error instanceof Error ? query.error.message : 'Error al cargar catálogo'}
        onRetry={() => query.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Mostrando <span className="text-white">{items.length}</span> títulos · página {loadedPages} de{' '}
        {totalPages}
        {approxTotal > 0 && (
          <>
            {' '}
            (~{approxTotal.toLocaleString('es')} en el catálogo)
          </>
        )}
      </p>

      <ContentGrid items={items} />

      {query.hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="secondary"
            disabled={query.isFetchingNextPage}
            onClick={() => query.fetchNextPage()}
          >
            {query.isFetchingNextPage
              ? 'Cargando más…'
              : `Cargar más (siguiente página · ${loadedPages + 1}/${totalPages})`}
          </Button>
        </div>
      )}

      {!query.hasNextPage && items.length > 0 && (
        <p className="text-center text-sm text-muted">Has cargado todo el catálogo disponible.</p>
      )}
    </div>
  );
}
