import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { paths } from './paths';
import { Skeleton } from '@/design-system/components';

const HomePage = lazy(() => import('@/pages/HomePage'));
const AnimePage = lazy(() => import('@/pages/AnimePage'));
const MoviesPage = lazy(() => import('@/pages/MoviesPage'));
const SeriesPage = lazy(() => import('@/pages/SeriesPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const PelisplusWatchPage = lazy(() => import('@/pages/PelisplusWatchPage'));

function PageLoader() {
  return (
    <div className="content-container-wide space-y-6 py-12">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="aspect-video w-full max-w-3xl" />
    </div>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<LazyPage><HomePage /></LazyPage>} />
        <Route path={paths.anime} element={<LazyPage><AnimePage /></LazyPage>} />
        <Route path={paths.movies} element={<LazyPage><MoviesPage /></LazyPage>} />
        <Route path={paths.series} element={<LazyPage><SeriesPage /></LazyPage>} />
        <Route path={paths.search} element={<LazyPage><SearchPage /></LazyPage>} />
        <Route
          path={paths.pelisplusWatch}
          element={
            <LazyPage>
              <PelisplusWatchPage />
            </LazyPage>
          }
        />
        <Route path="*" element={<Navigate to={paths.home} replace />} />
      </Route>
    </Routes>
  );
}
