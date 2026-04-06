// js/imageLoader.js
// Sistema dinámico para cargar imágenes desde GitHub

const GITHUB_API = 'https://api.github.com/repos/EmiLuxe/emiluxe.github.io/contents/assets/images/products';

/**
 * Obtener lista de imágenes de una carpeta en GitHub
 * @param {string} category - Categoría (pijamas, lenceria, casual)
 * @returns {Promise<Array>} Array de nombres de archivos
 */
export async function getImagesFromCategory(category) {
  try {
    const response = await fetch(`${GITHUB_API}/${category.toLowerCase()}`);
    
    if (!response.ok) {
      console.warn(`Carpeta ${category} no encontrada o vacía`);
      return [];
    }

    const data = await response.json();
    
    // Filtrar solo archivos de imagen (JPG, JPEG, PNG, GIF)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const images = data
      .filter(file => {
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        return imageExtensions.includes(ext);
      })
      .map(file => file.name)
      .sort(); // Ordenar alfabéticamente

    console.log(`✓ ${images.length} imágenes encontradas en ${category}:`, images);
    return images;
  } catch (error) {
    console.error(`Error cargando imágenes de ${category}:`, error);
    return [];
  }
}

/**
 * Cargar imágenes para todas las categorías
 * @returns {Promise<Object>} Objeto con im��genes por categoría
 */
export async function getAllCategoryImages() {
  try {
    const categories = ['pijamas', 'lenceria', 'casual'];
    const imagesByCategory = {};

    for (const category of categories) {
      imagesByCategory[category] = await getImagesFromCategory(category);
    }

    return imagesByCategory;
  } catch (error) {
    console.error('Error cargando imágenes:', error);
    return {};
  }
}

/**
 * Generar ruta completa de imagen
 * @param {string} category - Categoría
 * @param {string} filename - Nombre del archivo
 * @returns {string} Ruta completa
 */
export function getImagePath(category, filename) {
  return `assets/images/products/${category.toLowerCase()}/${filename}`;
}
