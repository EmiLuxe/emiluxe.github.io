import { PageHeader } from '@/components/media';
import { PelisplusInfiniteCatalog } from '@/components/catalog/PelisplusInfiniteCatalog';

export default function MoviesPage() {
  return (
    <div className="pb-16">
      <PageHeader
        badge="Tu catálogo"
        title="Películas"
        description="Catálogo completo de PelisPlusHD. Usa «Cargar más» para ver todas las páginas."
      />
      <div className="content-container-wide py-8">
        <PelisplusInfiniteCatalog kind="movies" />
      </div>
    </div>
  );
}
