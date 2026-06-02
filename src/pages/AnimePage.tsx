import { PageHeader } from '@/components/media';
import { PelisplusInfiniteCatalog } from '@/components/catalog/PelisplusInfiniteCatalog';

export default function AnimePage() {
  return (
    <div className="pb-16">
      <PageHeader
        badge="Tu catálogo"
        title="Anime"
        description="Animes desde PelisPlusHD. Carga más páginas con el botón inferior."
      />
      <div className="content-container-wide py-8">
        <PelisplusInfiniteCatalog kind="animes" />
      </div>
    </div>
  );
}
