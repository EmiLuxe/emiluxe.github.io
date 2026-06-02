import { PageHeader } from '@/components/media';
import { PelisplusInfiniteCatalog } from '@/components/catalog/PelisplusInfiniteCatalog';

export default function SeriesPage() {
  return (
    <div className="pb-16">
      <PageHeader
        badge="Tu catálogo"
        title="Series"
        description="Todas las series de tu sitio. Pulsa «Cargar más» para siguientes páginas."
      />
      <div className="content-container-wide py-8">
        <PelisplusInfiniteCatalog kind="series" />
      </div>
    </div>
  );
}
