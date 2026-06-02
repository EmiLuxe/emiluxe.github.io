# EmiLuxe

Catálogo y reproductor (anime, películas y series) — frontend React con catálogo PelisPlusHD.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router v6
- Framer Motion

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages (emiluxe.github.io)

Guía completa: [docs/GITHUB_PAGES.md](docs/GITHUB_PAGES.md).

Resumen: repo `USUARIO.github.io`, Pages con **GitHub Actions**, push a `main`. En producción el catálogo y los embeds van en JSON estático generados en cada deploy.

## Arquitectura

```
src/
├── app/              # App root
├── design-system/    # Tokens + componentes base
├── theme/            # Theme provider
├── layouts/          # MainLayout, Navbar, Sidebar, Footer
├── navigation/       # Rutas y paths
├── components/       # Componentes de dominio (media)
├── pages/            # Páginas lazy-loaded
├── data/             # Types + mock data
└── utils/            # Helpers
```

## Fase 1

Layout global, navegación, 10 páginas principales y catálogo mock listo para integraciones futuras (MAL, TMDb).
