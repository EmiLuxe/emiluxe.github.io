// ========================================
// EMILUXE - PRODUCT UTILITIES
// ========================================
// Utilidades para gestionar tallas, etiquetas y badges de productos

// ========================================
// CONSTANTES DE TALLAS
// ========================================

export const SIZES = {
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL',
  UNIQUE: 'Talla Única'
};

export const SIZE_OPTIONS = [
  { value: 'S', label: 'S (Pequeña)' },
  { value: 'M', label: 'M (Mediana)' },
  { value: 'L', label: 'L (Grande)' },
  { value: 'XL', label: 'XL (Extra Grande)' },
  { value: 'UNIQUE', label: 'Talla Única' }
];

// ========================================
// CONSTANTES DE ETIQUETAS Y BADGES
// ========================================

export const BADGE_TYPES = {
  BESTSELLER: 'bestseller',
  OFFER: 'offer',
  NEW: 'new',
  LOW_STOCK: 'low_stock'
};

export const BADGE_CONFIG = {
  bestseller: {
    label: '🔥 Más vendido',
    color: '#FF6B9D',
    bgColor: '#FFE5E5'
  },
  offer: {
    label: '💝 Oferta',
    color: '#FF6B9D',
    bgColor: '#FFE5E5'
  },
  new: {
    label: '✨ Nuevo',
    color: '#8B5CF6',
    bgColor: '#F3E8FF'
  },
  low_stock: {
    label: '⚡ Stock bajo',
    color: '#EA580C',
    bgColor: '#FFEDD5'
  }
};

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

/**
 * Formatear precio en pesos colombianos
 * @param {number} price - Precio a formatear
 * @returns {string} Precio formateado
 */
export function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

/**
 * Validar si un producto tiene talla
 * @param {Object} product - Producto a validar
 * @returns {boolean}
 */
export function hasSize(product) {
  return product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0;
}

/**
 * Validar si un producto tiene talla única
 * @param {Object} product - Producto a validar
 * @returns {boolean}
 */
export function isUniqueSizeProduct(product) {
  return product.sizes && product.sizes.length === 1 && product.sizes[0] === 'UNIQUE';
}

/**
 * Obtener las tallas disponibles de un producto
 * @param {Object} product - Producto
 * @returns {Array} Array de tallas
 */
export function getAvailableSizes(product) {
  if (!product.sizes) return [];
  return product.sizes.map(size => {
    const sizeOption = SIZE_OPTIONS.find(opt => opt.value === size);
    return sizeOption ? sizeOption.label : size;
  });
}

/**
 * Obtener etiqueta (badge) de un producto
 * @param {Object} product - Producto
 * @returns {Object|null} Objeto con configuración del badge o null
 */
export function getProductBadge(product) {
  if (!product.badges || product.badges.length === 0) return null;

  // Retornar el primer badge (prioridad: bestseller > offer > new > low_stock)
  const badgeType = product.badges[0];
  return BADGE_CONFIG[badgeType] || null;
}

/**
 * Obtener HTML del badge
 * @param {Object} product - Producto
 * @returns {string} HTML del badge
 */
export function getProductBadgeHTML(product) {
  const badge = getProductBadge(product);
  if (!badge) return '';

  return `
    <div class="product-badge" style="background-color: ${badge.bgColor}; color: ${badge.color};">
      ${badge.label}
    </div>
  `;
}

/**
 * Validar stock bajo
 * @param {Object} product - Producto
 * @param {number} lowStockThreshold - Umbral de stock bajo (default: 5)
 * @returns {boolean}
 */
export function isLowStock(product, lowStockThreshold = 5) {
  return product.stock && product.stock > 0 && product.stock <= lowStockThreshold;
}

/**
 * Obtener texto de stock
 * @param {Object} product - Producto
 * @returns {string|null} Texto del stock o null
 */
export function getStockText(product) {
  if (!product.stock) return null;

  if (product.stock === 0) {
    return '❌ Agotado';
  } else if (product.stock <= 3) {
    return `⚡ Solo ${product.stock} disponible${product.stock > 1 ? 's' : ''}`;
  } else if (product.stock <= 10) {
    return `⚠️ Quedan pocas unidades`;
  }

  return null;
}

/**
 * Formatear producto para carrito (con talla seleccionada)
 * @param {Object} product - Producto
 * @param {string} selectedSize - Talla seleccionada
 * @param {number} quantity - Cantidad
 * @returns {Object} Producto formateado para carrito
 */
export function formatProductForCart(product, selectedSize = null, quantity = 1) {
  const cartItem = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    quantity: quantity,
    category: product.category
  };

  // Agregar talla si el producto la tiene
  if (hasSize(product) && !isUniqueSizeProduct(product) && selectedSize) {
    cartItem.size = selectedSize;
    // Crear ID único incluyendo talla
    cartItem.cartItemId = `${product.id}_${selectedSize}`;
  } else {
    cartItem.cartItemId = product.id;
  }

  return cartItem;
}

/**
 * Validar si un producto necesita seleccionar talla
 * @param {Object} product - Producto
 * @returns {boolean}
 */
export function requiresSizeSelection(product) {
  return hasSize(product) && !isUniqueSizeProduct(product);
}

/**
 * Obtener lista de tallas en formato legible
 * @param {Object} product - Producto
 * @returns {string} Texto con tallas disponibles
 */
export function getSizesReadable(product) {
  if (!hasSize(product)) return 'N/A';

  if (isUniqueSizeProduct(product)) {
    return 'Talla Única';
  }

  const sizes = product.sizes
    .map(size => SIZE_OPTIONS.find(opt => opt.value === size)?.label || size)
    .join(', ');

  return sizes;
}

/**
 * Crear producto HTML con todas las características
 * @param {Object} product - Producto
 * @param {Function} onAddToCart - Callback al agregar al carrito
 * @returns {string} HTML del producto
 */
export function createProductCardHTML(product, onAddToCart) {
  const badge = getProductBadgeHTML(product);
  const stockText = getStockText(product);
  const sizesText = getSizesReadable(product);
  const isOutOfStock = product.stock === 0;

  return `
    <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}">
      ${badge}
      <div class="product-image-wrapper">
        <img 
          src="${product.image}" 
          alt="${product.name}" 
          class="product-image" 
          onerror="this.src='assets/images/placeholder.png'"
          loading="lazy"
        >
      </div>
      <div class="product-info">
        <p class="product-category">${product.category}</p>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        ${stockText ? `<p class="product-stock-text">${stockText}</p>` : ''}
        <p class="product-sizes">Tallas: ${sizesText}</p>
        <div class="product-footer">
          <span class="product-price">${formatPrice(product.price)}</span>
          <button 
            class="add-to-cart-btn" 
            onclick="${onAddToCart}('${product.id}')"
            ${isOutOfStock ? 'disabled' : ''}
          >
            ${isOutOfStock ? 'Agotado' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Validar estructura de producto (para admin)
 * @param {Object} product - Producto a validar
 * @returns {Object} Resultado de validación
 */
export function validateProduct(product) {
  const errors = [];

  if (!product.name || product.name.trim() === '') {
    errors.push('El nombre es requerido');
  }

  if (!product.price || product.price <= 0) {
    errors.push('El precio debe ser mayor a 0');
  }

  if (!product.category) {
    errors.push('La categoría es requerida');
  }

  if (!product.image) {
    errors.push('La imagen es requerida');
  }

  if (!product.sizes || product.sizes.length === 0) {
    errors.push('Al menos una talla es requerida');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Enriquecer producto con datos por defecto
 * @param {Object} product - Producto
 * @returns {Object} Producto enriquecido
 */
export function enrichProduct(product) {
  return {
    ...product,
    sizes: product.sizes || ['UNIQUE'],
    badges: product.badges || [],
    stock: product.stock || null,
    createdAt: product.createdAt || new Date().toISOString(),
    description: product.description || ''
  };
}

/**
 * Clonar estructura de producto para crear nuevo
 * @returns {Object} Estructura base de producto
 */
export function getEmptyProductStructure() {
  return {
    id: null,
    name: '',
    description: '',
    price: 0,
    image: '',
    category: 'pijamas',
    sizes: ['UNIQUE'],
    badges: [],
    stock: null,
    createdAt: new Date().toISOString()
  };
}

// ========================================
// EXPORT DEFAULT
// ========================================

export default {
  SIZES,
  SIZE_OPTIONS,
  BADGE_TYPES,
  BADGE_CONFIG,
  formatPrice,
  hasSize,
  isUniqueSizeProduct,
  getAvailableSizes,
  getProductBadge,
  getProductBadgeHTML,
  isLowStock,
  getStockText,
  formatProductForCart,
  requiresSizeSelection,
  getSizesReadable,
  createProductCardHTML,
  validateProduct,
  enrichProduct,
  getEmptyProductStructure
};
