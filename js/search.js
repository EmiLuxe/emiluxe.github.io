// ========================================
// EMILUXE - REAL-TIME SEARCH SYSTEM
// ========================================
// Sistema de búsqueda en tiempo real sin recargar la página

import { getAllProducts } from './products.js';

// ========================================
// ESTADO DE BÚSQUEDA
// ========================================

let searchState = {
  isOpen: false,
  currentTerm: '',
  results: [],
  recentSearches: [],
  maxRecentSearches: 5
};

let allProducts = [];

// ========================================
// INICIALIZAR BÚSQUEDA
// ========================================

/**
 * Inicializar sistema de búsqueda
 * @returns {Promise<void>}
 */
export async function initSearch() {
  try {
    console.log('🔍 Inicializando sistema de búsqueda...');
    allProducts = await getAllProducts();
    loadRecentSearches();
    console.log('✓ Sistema de búsqueda inicializado');
  } catch (error) {
    console.error('✗ Error inicializando búsqueda:', error);
    throw error;
  }
}

// ========================================
// BUSCAR EN TIEMPO REAL
// ========================================

/**
 * Realizar búsqueda en tiempo real
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Array} Resultados de búsqueda
 */
export function search(searchTerm) {
  const term = searchTerm.trim().toLowerCase();
  searchState.currentTerm = term;

  if (term.length === 0) {
    searchState.results = [];
    return [];
  }

  // Búsqueda por nombre y descripción
  const results = allProducts.filter(product => {
    const name = (product.name || '').toLowerCase();
    const description = (product.description || '').toLowerCase();
    const category = (product.category || '').toLowerCase();

    return (
      name.includes(term) ||
      description.includes(term) ||
      category.includes(term)
    );
  });

  searchState.results = results;
  return results;
}

/**
 * Búsqueda avanzada con múltiples criterios
 * @param {Object} options - Opciones de búsqueda
 * @param {string} options.term - Término de búsqueda
 * @param {string} options.category - Filtrar por categoría
 * @param {Object} options.priceRange - { min, max }
 * @param {Array} options.sizes - Array de tallas
 * @returns {Array} Resultados
 */
export function advancedSearch(options = {}) {
  let results = [...allProducts];

  // Filtro por término
  if (options.term) {
    const term = options.term.toLowerCase();
    results = results.filter(product => {
      const name = (product.name || '').toLowerCase();
      const description = (product.description || '').toLowerCase();
      return name.includes(term) || description.includes(term);
    });
  }

  // Filtro por categoría
  if (options.category) {
    results = results.filter(p =>
      p.category.toLowerCase() === options.category.toLowerCase()
    );
  }

  // Filtro por precio
  if (options.priceRange) {
    const { min = 0, max = Infinity } = options.priceRange;
    results = results.filter(p => p.price >= min && p.price <= max);
  }

  // Filtro por tallas
  if (options.sizes && options.sizes.length > 0) {
    results = results.filter(product => {
      if (!product.sizes) return false;
      return options.sizes.some(size => product.sizes.includes(size));
    });
  }

  return results;
}

/**
 * Búsqueda con sugerencias automáticas
 * @param {string} searchTerm - Término incompleto
 * @returns {Array} Sugerencias
 */
export function getSearchSuggestions(searchTerm) {
  const term = searchTerm.trim().toLowerCase();

  if (term.length < 2) {
    return [];
  }

  const suggestions = new Set();

  allProducts.forEach(product => {
    // Sugerencias por nombre
    if (product.name.toLowerCase().includes(term)) {
      const words = product.name.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.startsWith(term)) {
          suggestions.add(word.charAt(0).toUpperCase() + word.slice(1));
        }
      });
    }

    // Sugerencias por descripción
    if (product.description && product.description.toLowerCase().includes(term)) {
      const words = product.description.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.startsWith(term) && word.length > 2) {
          suggestions.add(word.charAt(0).toUpperCase() + word.slice(1));
        }
      });
    }

    // Sugerencias por categoría
    if (product.category.toLowerCase().includes(term)) {
      suggestions.add(product.category);
    }
  });

  return Array.from(suggestions).slice(0, 5);
}

/**
 * Obtener búsquedas recientes
 * @returns {Array}
 */
export function getRecentSearches() {
  return [...searchState.recentSearches];
}

/**
 * Agregar búsqueda a historial
 * @param {string} searchTerm - Término de búsqueda
 * @returns {void}
 */
export function addToRecentSearches(searchTerm) {
  const term = searchTerm.trim();

  if (term.length === 0) return;

  // Remover duplicados
  searchState.recentSearches = searchState.recentSearches.filter(
    s => s !== term
  );

  // Agregar al inicio
  searchState.recentSearches.unshift(term);

  // Limitar cantidad
  if (searchState.recentSearches.length > searchState.maxRecentSearches) {
    searchState.recentSearches.pop();
  }

  saveRecentSearches();
}

/**
 * Limpiar historial de búsquedas
 * @returns {void}
 */
export function clearRecentSearches() {
  searchState.recentSearches = [];
  localStorage.removeItem('emiluxe_recent_searches');
}

/**
 * Eliminar búsqueda específica del historial
 * @param {string} searchTerm - Término a eliminar
 * @returns {void}
 */
export function removeFromRecentSearches(searchTerm) {
  searchState.recentSearches = searchState.recentSearches.filter(
    s => s !== searchTerm
  );
  saveRecentSearches();
}

// ========================================
// PERSISTENCIA EN LOCALSTORAGE
// ========================================

/**
 * Guardar búsquedas recientes en localStorage
 * @returns {void}
 */
function saveRecentSearches() {
  localStorage.setItem(
    'emiluxe_recent_searches',
    JSON.stringify(searchState.recentSearches)
  );
}

/**
 * Cargar búsquedas recientes del localStorage
 * @returns {void}
 */
function loadRecentSearches() {
  const saved = localStorage.getItem('emiluxe_recent_searches');
  if (saved) {
    try {
      searchState.recentSearches = JSON.parse(saved);
    } catch (error) {
      console.warn('Error cargando búsquedas recientes:', error);
      searchState.recentSearches = [];
    }
  }
}

// ========================================
// GETTERS DE ESTADO
// ========================================

/**
 * Obtener resultados actuales de búsqueda
 * @returns {Array}
 */
export function getSearchResults() {
  return [...searchState.results];
}

/**
 * Obtener término de búsqueda actual
 * @returns {string}
 */
export function getCurrentSearchTerm() {
  return searchState.currentTerm;
}

/**
 * Obtener estado completo de búsqueda
 * @returns {Object}
 */
export function getSearchState() {
  return { ...searchState };
}

// ========================================
// ESTADÍSTICAS
// ========================================

/**
 * Obtener estadísticas de búsqueda
 * @returns {Object}
 */
export function getSearchStats() {
  return {
    resultsCount: searchState.results.length,
    currentTerm: searchState.currentTerm,
    recentSearchesCount: searchState.recentSearches.length,
    totalProducts: allProducts.length
  };
}

/**
 * Buscar productos similares a uno dado
 * @param {Object} product - Producto referencia
 * @param {number} limit - Límite de resultados
 * @returns {Array}
 */
export function getSimilarProducts(product, limit = 5) {
  const keywords = [
    ...product.name.toLowerCase().split(' '),
    product.category.toLowerCase()
  ];

  const similar = allProducts.filter(p =>
    p.id !== product.id &&
    keywords.some(keyword =>
      p.name.toLowerCase().includes(keyword) ||
      (p.description && p.description.toLowerCase().includes(keyword))
    )
  );

  return similar.slice(0, limit);
}

// ========================================
// VALIDACIÓN Y LIMPIEZA
// ========================================

/**
 * Validar si un término es válido para búsqueda
 * @param {string} term - Término a validar
 * @returns {boolean}
 */
export function isValidSearchTerm(term) {
  return term.trim().length > 0;
}

/**
 * Sanitizar término de búsqueda
 * @param {string} term - Término a sanitizar
 * @returns {string}
 */
export function sanitizeSearchTerm(term) {
  return term
    .trim()
    .toLowerCase()
    .replace(/[<>\"]/g, '');
}

// ========================================
// EXPORT DEFAULT
// ========================================

export default {
  initSearch,
  search,
  advancedSearch,
  getSearchSuggestions,
  getRecentSearches,
  addToRecentSearches,
  clearRecentSearches,
  removeFromRecentSearches,
  getSearchResults,
  getCurrentSearchTerm,
  getSearchState,
  getSearchStats,
  getSimilarProducts,
  isValidSearchTerm,
  sanitizeSearchTerm
};
