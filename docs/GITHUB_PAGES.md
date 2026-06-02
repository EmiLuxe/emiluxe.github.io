# Publicar EmiLuxe en GitHub Pages (emiluxe.github.io)

## Requisito del repositorio

Para la URL **https://emiluxe.github.io** el repo debe llamarse exactamente:

`TU_USUARIO.github.io`

Ejemplo: usuario `emiluxe` → repo `emiluxe.github.io`.

Si el repo tiene otro nombre, la URL será `https://emiluxe.github.io/NOMBRE-DEL-REPO/` y hay que configurar `BASE_PATH` en el workflow.

## Pasos (una sola vez en GitHub)

1. Sube el código a GitHub (rama `main` o `master`).
2. **Settings → Pages → Build and deployment**
   - **Source:** GitHub Actions
3. Haz **push** a `main`. El workflow `.github/workflows/deploy.yml` hará:
   - Descargar títulos y enlaces de reproducción de PelisPlus (3 páginas × películas, series, anime).
   - Generar JSON en `public/data/`.
   - Compilar la app con `VITE_STATIC_CATALOG=true`.
   - Publicar la carpeta `dist/` en Pages.

4. En unos minutos entra en **https://emiluxe.github.io**

## Desarrollo en tu PC

```bash
npm install
npm run dev
```

Usa la API en vivo (`/api/pelisplus/...`). No hace falta generar `public/data/`.

## Probar el build igual que en Pages

```bash
npm run build:pages
npm run preview
```

Abre la URL que muestra `preview` (con `VITE_STATIC_CATALOG` vía `.env.production`).

## Límites en GitHub Pages

| En local (`npm run dev`) | En emiluxe.github.io |
|--------------------------|----------------------|
| Catálogo en tiempo real | Catálogo **pregenerado** en cada deploy |
| Todas las páginas del sitio | «Cargar más» solo hasta **3 páginas** por tipo (configurable en el workflow) |
| Reproductor al instante | Reproductor solo para títulos incluidos en esas páginas |

Para más páginas en producción, edita en `.github/workflows/deploy.yml`:

```yaml
CATALOG_MAX_PAGES: "5"
```

Cada deploy tardará más (más títulos = más JSON de reproducción).

## Si algo falla

- **Página en blanco al recargar /ver/...** → el workflow debe generar `404.html` (ya incluido en el build).
- **No hay títulos** → revisa la pestaña **Actions** del repo; si el scrape falla, el job en rojo.
- **Un título no reproduce** → no estaba en el catálogo generado; vuelve a desplegar o sube `CATALOG_MAX_PAGES`.

## Comandos git (resumen)

```bash
git add .
git commit -m "Deploy EmiLuxe en GitHub Pages"
git remote add origin https://github.com/TU_USUARIO/TU_USUARIO.github.io.git
git push -u origin main
```

Sustituye `TU_USUARIO` por tu usuario de GitHub.
