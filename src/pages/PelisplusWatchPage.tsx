import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { EmbedPlayer } from '@/components/media/EmbedPlayer';
import { BrandLogo } from '@/components/common/BrandLogo';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton, Badge } from '@/design-system/components';
import { MotionButton } from '@/design-system/components/Button';
import { fetchPelisplusPlayback } from '@/lib/pelisplus/playback-api';
import type { PelisplusKind } from '@/lib/pelisplus/types';
import { paths } from '@/navigation/paths';
import { cn } from '@/utils/cn';

const kinds: PelisplusKind[] = ['movies', 'series', 'animes'];

export default function PelisplusWatchPage() {
  const { kind, slug } = useParams<{ kind: string; slug: string }>();
  const validKind = kinds.includes(kind as PelisplusKind) ? (kind as PelisplusKind) : null;
  const [sourceIndex, setSourceIndex] = useState(0);

  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: ['pelisplus', 'play', validKind, slug],
    queryFn: () => {
      if (!validKind || !slug) throw new Error('Enlace inválido');
      return fetchPelisplusPlayback(validKind, slug);
    },
    enabled: Boolean(validKind && slug),
    staleTime: 60_000,
  });

  const dataMatches = data?.slug === slug && data?.kind === validKind;
  const isResolving = isPending || (isFetching && !dataMatches);

  useEffect(() => {
    setSourceIndex(0);
  }, [validKind, slug]);

  const activeSource = useMemo(() => {
    if (!dataMatches || !data?.sources?.length) return undefined;
    return data.sources[sourceIndex] ?? data.sources[0];
  }, [data, dataMatches, sourceIndex]);

  const playerKey = activeSource
    ? `${validKind}-${slug}-${sourceIndex}-${activeSource.embedUrl}`
    : `${validKind}-${slug}-loading`;

  if (!validKind || !slug) {
    return (
      <div className="content-container-wide py-24">
        <ErrorState message="Enlace de reproducción inválido." />
      </div>
    );
  }

  if (isResolving) {
    return (
      <div className="content-container-wide space-y-6 py-24">
        <Skeleton className="h-10 w-2/3 max-w-md" />
        <Skeleton className="aspect-video w-full max-w-5xl rounded-2xl" />
      </div>
    );
  }

  if (error || !data || !dataMatches || !data.sources.length) {
    return (
      <div className="content-container-wide py-24">
        <ErrorState
          message={error instanceof Error ? error.message : 'No se pudo cargar el reproductor.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const title = data.title ?? slug.replace(/-/g, ' ');

  return (
    <div className="pb-16 pt-16">
      <section className="relative">
        <div className="content-container-wide relative z-[1] py-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <BrandLogo size="sm" />
            <Badge variant="outline">
              {validKind === 'movies' ? 'Película' : validKind === 'series' ? 'Serie' : 'Anime'}
            </Badge>
          </div>

          <h1 className="font-display text-4xl tracking-wide text-white md:text-5xl">{title}</h1>

          <div className="mt-8 max-w-5xl">
            {activeSource?.embedUrl ? (
              <EmbedPlayer
                mountId={playerKey}
                embedUrl={activeSource.embedUrl}
                title={title}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-2xl bg-black text-muted">
                Sin fuentes de reproducción
              </div>
            )}

            {activeSource && (
              <p className="mt-3 text-sm text-muted">{activeSource.label}</p>
            )}

            {data.sources.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {data.sources.map((src, i) => (
                  <button
                    key={src.embedUrl}
                    type="button"
                    onClick={() => setSourceIndex(i)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      i === sourceIndex
                        ? 'border-accent bg-accent/20 text-white'
                        : 'border-border text-muted hover:border-white/40',
                    )}
                  >
                    {src.label}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6">
              <a href={data.pageUrl} target="_blank" rel="noopener noreferrer">
                <MotionButton variant="secondary" size="md" type="button">
                  <ExternalLink className="h-4 w-4" />
                  Abrir en sitio original
                </MotionButton>
              </a>
            </div>
          </div>

          <div className="mt-10">
            <Link to={paths.home} className="text-sm text-accent hover:underline">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
