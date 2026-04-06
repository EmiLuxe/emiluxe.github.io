// ========================================
// DYNAMIC IMAGE LOADER
// ========================================

let availableImages = [];

export async function loadAvailableImages() {
  try {
    // Obtenemos la lista de imágenes del repositorio
    const response = await fetch('https://api.github.com/repos/EmiLuxe/emiluxe.github.io/contents/assets/images/products/pijamas');
    const files = await response.json();

    availableImages = files
      .filter(file => {
        const ext = file.name.toLowerCase();
        return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || ext.endsWith('.webp');
      })
      .map(file => ({
        name: file.name,
        path: `assets/images/products/pijamas/${file.name}`
      }));

    console.log('Imágenes cargadas dinámicamente:', availableImages);
    return availableImages;
  } catch (error) {
    console.error('Error cargando imágenes:', error);
    return [];
  }
}

export function getAvailableImages() {
  return availableImages;
}

export async function ensureImagesLoaded() {
  if (availableImages.length === 0) {
    await loadAvailableImages();
  }
  return availableImages;
}
