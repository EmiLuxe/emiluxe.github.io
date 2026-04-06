// ========================================
// EMILUXE - PRODUCTS (FIRESTORE)
// ========================================

import { 
  getAllProducts as getAllProductsFromDB,
  getProductsByCategory as getProductsByCategoryFromDB,
  addProduct as addProductDB,
  updateProduct as updateProductDB,
  deleteProduct as deleteProductDB
} from './firebaseDB.js';

let productsCache = [];
let isLoadingProducts = false;

// ========================================
// CARGAR PRODUCTOS DESDE FIREBASE
// ========================================

export async function loadProductsFromFirebase() {
  if (isLoadingProducts) return productsCache;
  
  isLoadingProducts = true;
  
  try {
    console.log('🔥 Cargando productos de Firestore...');
    productsCache = await getAllProductsFromDB();
    console.log(`✓ ${productsCache.length} productos cargados exitosamente`);
    isLoadingProducts = false;
    return productsCache;
  } catch (error) {
    console.error('✗ Error cargando productos de Firestore:', error);
    isLoadingProducts = false;
    return [];
  }
}

// ========================================
// GET PRODUCTS - FUNCIONES PRINCIPALES
// ========================================

/**
 * Obtener todos los productos (con caché)
 * @returns {Promise<Array>} Array de productos
 */
export async function getAllProducts() {
  if (productsCache.length === 0) {
    await loadProductsFromFirebase();
  }
  return productsCache;
}

/**
 * Obtener productos por categoría
 * @param {string} category - Categoría (pijamas, lenceria, casual)
 * @returns {Promise<Array>} Array de productos filtrados
 */
export async function getProductsByCategory(category) {
  try {
    const allProducts = await getAllProducts();
    return allProducts.filter(p => 
      p.category.toLowerCase() === category.toLowerCase()
    );
  } catch (error) {
    console.error('Error filtrando productos por categoría:', error);
    return [];
  }
}

/**
 * Obtener categorías disponibles
 * @returns {Array} Array de categorías
 */
export function getCategories() {
  return ['pijamas', 'lenceria', 'casual'];
}

/**
 * Obtener producto por ID
 * @param {string} id - ID del producto
 * @returns {Promise<Object|null>} Producto encontrado o null
 */
export async function getProductById(id) {
  try {
    const allProducts = await getAllProducts();
    return allProducts.find(p => p.id === id) || null;
  } catch (error) {
    console.error('Error obteniendo producto por ID:', error);
    return null;
  }
}

/**
 * Obtener todos los productos incluyendo customizados
 * @returns {Promise<Array>} Array de todos los productos
 */
export async function getAllProductsIncludingCustom() {
  return await getAllProducts();
}

// ========================================
// ADD PRODUCT - AGREGAR PRODUCTO
// ========================================

/**
 * Agregar nuevo producto a Firestore
 * @param {Object} product - Datos del producto
 * @param {string} product.name - Nombre del producto
 * @param {string} product.description - Descripción
 * @param {number} product.price - Precio en COP
 * @param {string} product.image - Ruta de la imagen
 * @param {string} product.category - Categoría (pijamas, lenceria, casual)
 * @returns {Promise<Object>} Producto creado con ID
 */
export async function addProduct(product) {
  try {
    console.log('📝 Agregando producto:', product.name);
    
    const newProduct = await addProductDB(product);
    
    // Actualizar caché
    productsCache.push(newProduct);
    
    console.log('✓ Producto agregado con ID:', newProduct.id);
    return newProduct;
  } catch (error) {
    console.error('✗ Error agregando producto:', error);
    throw error;
  }
}

// ========================================
// UPDATE PRODUCT - ACTUALIZAR PRODUCTO
// ========================================

/**
 * Actualizar producto existente en Firestore
 * @param {string} id - ID del producto a actualizar
 * @param {Object} updatedData - Datos a actualizar
 * @param {string} updatedData.name - Nuevo nombre (opcional)
 * @param {string} updatedData.description - Nueva descripción (opcional)
 * @param {number} updatedData.price - Nuevo precio (opcional)
 * @param {string} updatedData.image - Nueva ruta de imagen (opcional)
 * @param {string} updatedData.category - Nueva categoría (opcional)
 * @returns {Promise<boolean>} true si se actualizó correctamente
 */
export async function updateProduct(id, updatedData) {
  try {
    console.log('📝 Actualizando producto:', id);
    
    await updateProductDB(id, updatedData);
    
    // Actualizar caché
    const index = productsCache.findIndex(p => p.id === id);
    if (index !== -1) {
      productsCache[index] = { 
        id: id, 
        ...productsCache[index], 
        ...updatedData 
      };
    }
    
    console.log('✓ Producto actualizado:', id);
    return true;
  } catch (error) {
    console.error('✗ Error actualizando producto:', error);
    throw error;
  }
}

// ========================================
// DELETE PRODUCT - ELIMINAR PRODUCTO
// ========================================

/**
 * Eliminar producto de Firestore
 * @param {string} id - ID del producto a eliminar
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export async function deleteProduct(id) {
  try {
    console.log('🗑️ Eliminando producto:', id);
    
    await deleteProductDB(id);
    
    // Eliminar del caché
    productsCache = productsCache.filter(p => p.id !== id);
    
    console.log('✓ Producto eliminado:', id);
    return true;
  } catch (error) {
    console.error('✗ Error eliminando producto:', error);
    throw error;
  }
}

// ========================================
// CACHE MANAGEMENT - GESTIÓN DE CACHÉ
// ========================================

/**
 * Actualizar caché manualmente con nuevos productos
 * @param {Array} newProducts - Array de nuevos productos
 */
export function updateProductsCache(newProducts) {
  productsCache = newProducts;
  console.log('✓ Caché actualizado:', newProducts.length, 'productos');
}

/**
 * Limpiar caché de productos
 */
export function clearProductsCache() {
  productsCache = [];
  isLoadingProducts = false;
  console.log('✓ Caché limpiado');
}

/**
 * Obtener estado del caché
 * @returns {Object} Estado actual del caché
 */
export function getCacheStatus() {
  return {
    cached: productsCache.length,
    isLoading: isLoadingProducts,
    products: productsCache
  };
}

/**
 * Recargar productos forzando actualización
 * @returns {Promise<Array>} Array de productos recargados
 */
export async function reloadProducts() {
  console.log('🔄 Recargando productos...');
  clearProductsCache();
  return await loadProductsFromFirebase();
}

// ========================================
// UTILITY FUNCTIONS - FUNCIONES DE UTILIDAD
// ========================================

/**
 * Buscar productos por nombre
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Promise<Array>} Array de productos coincidentes
 */
export async function searchProducts(searchTerm) {
  try {
    const allProducts = await getAllProducts();
    const term = searchTerm.toLowerCase();
    
    return allProducts.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error('Error buscando productos:', error);
    return [];
  }
}

/**
 * Obtener productos por rango de precio
 * @param {number} minPrice - Precio mínimo
 * @param {number} maxPrice - Precio máximo
 * @returns {Promise<Array>} Array de productos en rango
 */
export async function getProductsByPriceRange(minPrice, maxPrice) {
  try {
    const allProducts = await getAllProducts();
    
    return allProducts.filter(product =>
      product.price >= minPrice && product.price <= maxPrice
    );
  } catch (error) {
    console.error('Error filtrando por precio:', error);
    return [];
  }
}

/**
 * Obtener productos ordenados por precio
 * @param {string} order - 'asc' para ascendente, 'desc' para descendente
 * @returns {Promise<Array>} Array de productos ordenados
 */
export async function getProductsSortedByPrice(order = 'asc') {
  try {
    const allProducts = await getAllProducts();
    
    const sorted = [...allProducts].sort((a, b) => {
      return order === 'asc' ? a.price - b.price : b.price - a.price;
    });
    
    return sorted;
  } catch (error) {
    console.error('Error ordenando productos:', error);
    return [];
  }
}

/**
 * Obtener productos ordenados por fecha de creación
 * @param {string} order - 'asc' para antiguo primero, 'desc' para nuevo primero
 * @returns {Promise<Array>} Array de productos ordenados
 */
export async function getProductsSortedByDate(order = 'desc') {
  try {
    const allProducts = await getAllProducts();
    
    const sorted = [...allProducts].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    return sorted;
  } catch (error) {
    console.error('Error ordenando productos por fecha:', error);
    return [];
  }
}

/**
 * Obtener productos destacados (los primeros N)
 * @param {number} limit - Cantidad de productos a retornar
 * @returns {Promise<Array>} Array de productos destacados
 */
export async function getFeaturedProducts(limit = 6) {
  try {
    const allProducts = await getAllProducts();
    return allProducts.slice(0, limit);
  } catch (error) {
    console.error('Error obteniendo productos destacados:', error);
    return [];
  }
}

/**
 * Obtener estadísticas de productos
 * @returns {Promise<Object>} Objeto con estadísticas
 */
export async function getProductsStats() {
  try {
    const allProducts = await getAllProducts();
    
    const stats = {
      total: allProducts.length,
      byCategory: {},
      priceStats: {
        min: 0,
        max: 0,
        avg: 0
      }
    };
    
    // Contar por categoría
    allProducts.forEach(product => {
      const category = product.category.toLowerCase();
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });
    
    // Estadísticas de precio
    if (allProducts.length > 0) {
      const prices = allProducts.map(p => p.price);
      stats.priceStats.min = Math.min(...prices);
      stats.priceStats.max = Math.max(...prices);
      stats.priceStats.avg = Math.round(
        prices.reduce((a, b) => a + b, 0) / prices.length
      );
    }
    
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return null;
  }
}

// ========================================
// EXPORT DEFAULT
// ========================================

export default {
  loadProductsFromFirebase,
  getAllProducts,
  getProductsByCategory,
  getCategories,
  getProductById,
  getAllProductsIncludingCustom,
  addProduct,
  updateProduct,
  deleteProduct,
  updateProductsCache,
  clearProductsCache,
  getCacheStatus,
  reloadProducts,
  searchProducts,
  getProductsByPriceRange,
  getProductsSortedByPrice,
  getProductsSortedByDate,
  getFeaturedProducts,
  getProductsStats
};
