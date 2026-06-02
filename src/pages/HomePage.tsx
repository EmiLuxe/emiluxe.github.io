import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CinematicHero, ContentRow } from '@/components/media';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/design-system/components';
import { pelisplusHomeRows } from '@/lib/pelisplus/home';

export default function HomePage() {
  const home = useQuery({
    queryKey: ['pelisplus', 'home'],
    queryFn: pelisplusHomeRows,
  });

  useEffect(() => {
    if (home.error) console.error('[Pelisplus] HomePage error', home.error);
  }, [home.error]);

  if (home.isLoading) {
    return (
      <div className="-mt-16 space-y-8 md:-mt-18">
        <Skeleton className="h-[70vh] w-full" />
        <Skeleton className="mx-auto h-8 w-48" />
      </div>
    );
  }

  if (home.error || !home.data) {
    return (
      <div className="content-container-wide py-24">
        <ErrorState
          message={
            home.error instanceof Error
              ? home.error.message
              : 'No se pudo cargar títulos desde tu catálogo.'
          }
          onRetry={() => home.refetch()}
        />
      </div>
    );
  }

  const data = home.data;

  return (
    <div className="-mt-16 md:-mt-18">
      <CinematicHero item={data.hero} />

      <div className="relative z-10 -mt-8 space-y-2 md:-mt-16">
        <ContentRow title="Películas" subtitle="PelisPlusHD" items={data.movies} />
        <ContentRow title="Series" subtitle="PelisPlusHD" items={data.series} />
        <ContentRow title="Animes" subtitle="PelisPlusHD" items={data.animes} />
      </div>
    </div>
  );
}
