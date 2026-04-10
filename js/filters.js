// ========================================
// EMILUXE - FILTERS SYSTEM
// ========================================
// Sistema dinámico de filtros sin recargar la página

import { getAllProducts } from './products.js';

// ========================================
// ESTADO GLOBAL DE FILTROS
// ========================================

let filterState = {
  category: null,
  priceRange: {
    min: 0,
    max: Infinity
  },
  sizes: [],
  sortBy: 'default', // default, price-asc, price-desc, newest, bestsellers
  searchTerm: ''
};

let allProducts = [];
let filteredProducts = [];

// ========================================
// INICIALIZAR FILTROS
// ========================================

/**
 * Inicializar el sistema de filtros
 * @returns {Promise<void>}
 */
export async function initFilters() {
  try {
    console.log('📊 Inicializando sistema de filtros...');
    allProducts = await getAllProducts();
    filteredProducts = [...allProducts];
    console.log('✓ Filtros inicializados:', allProducts.length, 'productos');
  } catch (error) {
    console.error('✗ Error inicializando filtros:', error);
    throw error;
  }
}

// ========================================
// FUNCIONES DE FILTRADO
// ========================================

/**
 * Aplicar todos los filtros activos
 * @returns {Array} Productos filtrados
 */
export function applyFilters() {
  let result = [...allProducts];

  // Filtro por categoría
  if (filterState.category) {
    result = result.filter(p =>
      p.category.toLowerCase() === filterState.category.toLowerCase()
    );
  }

  // Filtro por rango de precio
  result = result.filter(p =>
    p.price >= filterState.priceRange.min && p.price <= filterState.priceRange.max
  );

  // Filtro por tallas
  if (filterState.sizes.length > 0) {
    result = result.filter(p => {
      if (!p.sizes || p.sizes.length === 0) return false;
      return filterState.sizes.some(size => p.sizes.includes(size));
    });
  }

  // Filtro por búsqueda
  if (filterState.searchTerm) {
    const term = filterState.searchTerm.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term))
    );
  }

  // Ordenamiento
  result = applySorting(result, filterState.sortBy);

  filteredProducts = result;
  return result;
}

/**
 * Aplicar ordenamiento a los productos
 * @param {Array} products - Productos a ordenar
 * @param {string} sortBy - Tipo de ordenamiento
 * @returns {Array} Productos ordenados
 */
function applySorting(products, sortBy) {
  const sorted = [...products];

  switch (sortBy) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;

    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;

    case 'newest':
      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      break;

    case 'bestsellers':
      // Ordenar por badges que contengan 'bestseller'
      sorted.sort((a, b) => {
        const aIsBestseller = a.badges && a.badges.includes('bestseller') ? 1 : 0;
        const bIsBestseller = b.badges && b.badges.includes('bestseller') ? 1 : 0;
        return bIsBestseller - aIsBestseller;
      });
      break;

    case 'default':
    default:
      // Mantener orden original
      break;
  }

  return sorted;
}

// ========================================
// SETTERS DE FILTROS
// ========================================

/**
 * Establecer filtro de categoría
 * @param {string|null} category - Categoría o null para limpiar
 * @returns {Array} Productos filtrados
 */
export function setCategory(category) {
  filterState.category = category;
  return applyFilters();
}

/**
 * Establecer rango de precio
 * @param {number} min - Precio mínimo
 * @param {number} max - Precio máximo
 * @returns {Array} Productos filtrados
 */
export function setPriceRange(min, max) {
  filterState.priceRange = { min, max };
  return applyFilters();
}

/**
 * Establecer tallas seleccionadas
 * @param {Array} sizes - Array de tallas
 * @returns {Array} Productos filtrados
 */
export function setSizes(sizes) {
  filterState.sizes = sizes;
  return applyFilters();
}

/**
 * Agregar o quitar talla
 * @param {string} size - Talla
 * @param {boolean} add - true para agregar, false para quitar
 * @returns {Array} Productos filtrados
 */
export function toggleSize(size, add = true) {
  if (add) {
    if (!filterState.sizes.includes(size)) {
      filterState.sizes.push(size);
    }
  } else {
    filterState.sizes = filterState.sizes.filter(s => s !== size);
  }

  return applyFilters();
}

/**
 * Establecer término de búsqueda
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Array} Productos filtrados
 */
export function setSearchTerm(searchTerm) {
  filterState.searchTerm = searchTerm.trim();
  return applyFilters();
}

/**
 * Establecer ordenamiento
 * @param {string} sortBy - Tipo de ordenamiento
 * @returns {Array} Productos filtrados
 */
export function setSortBy(sortBy) {
  filterState.sortBy = sortBy;
  return applyFilters();
}

// ========================================
// GETTERS DE ESTADO
// ========================================

/**
 * Obtener estado actual de filtros
 * @returns {Object} Estado de filtros
 */
export function getFilterState() {
  return { ...filterState };
}

/**
 * Obtener productos filtrados actuales
 * @returns {Array}
 */
export function getFilteredProducts() {
  return [...filteredProducts];
}

/**
 * Obtener rango de precios disponibles
 * @returns {Object} Min y max de precios
 */
export function getAvailablePriceRange() {
  if (allProducts.length === 0) return { min: 0, max: 0 };

  const prices = allProducts.map(p => p.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}

/**
 * Obtener todas las tallas disponibles
 * @returns {Array} Tallas únicas
 */
export function getAvailableSizes() {
  const sizes = new Set();
  allProducts.forEach(product => {
    if (product.sizes && Array.isArray(product.sizes)) {
      product.sizes.forEach(size => sizes.add(size));
    }
  });
  return Array.from(sizes);
}

/**
 * Obtener todas las categorías disponibles
 * @returns {Array} Categorías únicas
 */
export function getAvailableCategories() {
  const categories = new Set();
  allProducts.forEach(product => {
    if (product.category) {
      categories.add(product.category.toLowerCase());
    }
  });
  return Array.from(categories);
}

// ========================================
// LIMPIAR FILTROS
// ========================================

/**
 * Limpiar todos los filtros
 * @returns {Array} Todos los productos
 */
export function clearAllFilters() {
  filterState = {
    category: null,
    priceRange: {
      min: 0,
      max: Infinity
    },
    sizes: [],
    sortBy: 'default',
    searchTerm: ''
  };

  filteredProducts = [...allProducts];
  return filteredProducts;
}

/**
 * Limpiar filtro específico
 * @param {string} filterType - Tipo de filtro: 'category', 'price', 'sizes', 'search', 'sort'
 * @returns {Array} Productos filtrados
 */
export function clearFilter(filterType) {
  switch (filterType) {
    case 'category':
      filterState.category = null;
      break;
    case 'price':
      filterState.priceRange = { min: 0, max: Infinity };
      break;
    case 'sizes':
      filterState.sizes = [];
      break;
    case 'search':
      filterState.searchTerm = '';
      break;
    case 'sort':
      filterState.sortBy = 'default';
      break;
  }

  return applyFilters();
}

// ========================================
// UTILIDADES
// ========================================

/**
 * Obtener estadísticas de filtrado
 * @returns {Object} Estadísticas
 */
export function getFilterStats() {
  return {
    totalProducts: allProducts.length,
    filteredProducts: filteredProducts.length,
    activeFilters: countActiveFilters(),
    priceRange: getAvailablePriceRange()
  };
}

/**
 * Contar filtros activos
 * @returns {number}
 */
function countActiveFilters() {
  let count = 0;
  if (filterState.category) count++;
  if (filterState.priceRange.min > 0 || filterState.priceRange.max !== Infinity) count++;
  if (filterState.sizes.length > 0) count++;
  if (filterState.searchTerm) count++;
  if (filterState.sortBy !== 'default') count++;
  return count;
}

/**
 * Resetear a productos originales
 * @returns {void}
 */
export async function resetFilters() {
  await initFilters();
  clearAllFilters();
  console.log('✓ Filtros reseteados');
}

// ========================================
// EXPORT DEFAULT
// ========================================

export default {
  initFilters,
  applyFilters,
  setCategory,
  setPriceRange,
  setSizes,
  toggleSize,
  setSearchTerm,
  setSortBy,
  getFilterState,
  getFilteredProducts,
  getAvailablePriceRange,
  getAvailableSizes,
  getAvailableCategories,
  clearAllFilters,
  clearFilter,
  getFilterStats,
  resetFilters
};
