// ========================================
// EMILUXE - CART DRAWER SYSTEM
// ========================================
// Carrito lateral moderno con gestor de cantidades

import { formatProductForCart, requiresSizeSelection } from './product-utils.js';
import { getAllProducts } from './products.js';

// ========================================
// ESTADO DEL DRAWER
// ========================================

let drawerState = {
  isOpen: false,
  cartItems: [],
  isAnimating: false
};

// ========================================
// INICIALIZAR CART DRAWER
// ========================================

/**
 * Inicializar el sistema de carrito drawer
 * @returns {void}
 */
export function initCartDrawer() {
  console.log('🛒 Inicializando Cart Drawer...');
  loadCartFromStorage();
  setupDrawerEventListeners();
  setupDrawerHTML();
  console.log('✓ Cart Drawer inicializado');
}

/**
 * Asegurar que el HTML del drawer existe
 * @returns {void}
 */
function setupDrawerHTML() {
  // Verificar que los elementos del drawer existen
  let drawer = document.getElementById('cartDrawer');
  let overlay = document.getElementById('cartDrawerOverlay');

  if (!drawer || !overlay) {
    console.warn('⚠️ Elementos del drawer no encontrados en HTML');
    // Crear drawer si no existe
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'cartDrawerOverlay';
      document.body.appendChild(overlay);
    }
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'cartDrawer';
      drawer.innerHTML = `
        <div class="cart-drawer-header">
          <h2>Tu Carrito</h2>
          <button class="cart-drawer-close" onclick="window.closeDrawer()">✕</button>
        </div>
        <div id="cartDrawerEmpty" class="show">
          <div class="empty-icon">🛒</div>
          <h3>Carrito Vacío</h3>
          <p>Agrega productos para comenzar</p>
          <a href="shop.html">Continuar Comprando</a>
        </div>
        <div id="cartDrawerItems"></div>
        <div class="cart-drawer-footer">
          <div id="cartDrawerTotal"></div>
          <button id="cartDrawerCheckoutBtn" onclick="window.goToCheckout()" style="display: none;">
            Ir a Checkout
          </button>
        </div>
      `;
      document.body.appendChild(drawer);
    }
  }
}

/**
 * Configurar event listeners del drawer
 * @returns {void}
 */
function setupDrawerEventListeners() {
  // Cerrar al hacer click fuera del drawer
  document.addEventListener('click', (e) => {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartDrawerOverlay');

    if (drawer && overlay && !drawer.contains(e.target) && !overlay.contains(e.target)) {
      if (drawerState.isOpen && !drawerState.isAnimating) {
        closeCartDrawer();
      }
    }
  });

  // Cerrar con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawerState.isOpen) {
      closeCartDrawer();
    }
  });
}

// ========================================
// ABRIR Y CERRAR DRAWER
// ========================================

/**
 * Abrir carrito drawer - ✨ DEFINITIVO CON ESTILOS INLINE ✨
 * @returns {void}
 */
export function openCartDrawer() {
  console.log('📂 Intentando abrir drawer...');
  console.log('Estado actual:', {
    isOpen: drawerState.isOpen,
    isAnimating: drawerState.isAnimating
  });
  
  if (drawerState.isOpen && !drawerState.isAnimating) {
    console.log('ℹ️ Drawer ya está abierto');
    return;
  }

  if (drawerState.isAnimating) {
    console.warn('⏳ Drawer está animando, esperando...');
    return;
  }

  drawerState.isAnimating = true;
  drawerState.isOpen = true;

  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartDrawerOverlay');

  console.log('🎯 Drawer encontrado:', !!drawer);
  console.log('🎯 Overlay encontrado:', !!overlay);

  if (drawer && overlay) {
    console.log('✨ Agregando clases: open y visible');
    drawer.classList.add('open');
    overlay.classList.add('visible');
    
    // ✨ AGREGAR ESTILOS INLINE PARA FORZAR
    drawer.style.right = '0';
    drawer.style.zIndex = '1000';
    overlay.style.zIndex = '999';
    overlay.style.display = 'block';
    
    console.log('✓ Clase "open" en drawer:', drawer.classList.contains('open'));
    console.log('✓ Clase "visible" en overlay:', overlay.classList.contains('visible'));
    console.log('✓ Drawer style.right:', drawer.style.right);
    console.log('✓ Drawer abierto');

    setTimeout(() => {
      drawerState.isAnimating = false;
      console.log('✓ Animación completada');
    }, 300);
  } else {
    console.error('❌ Drawer o overlay no encontrados');
    drawerState.isAnimating = false;
    drawerState.isOpen = false;
  }
}

/**
 * Cerrar carrito drawer - ✨ DEFINITIVO CON ESTILOS INLINE ✨
 * @returns {void}
 */
export function closeCartDrawer() {
  if (drawerState.isAnimating || !drawerState.isOpen) return;

  drawerState.isAnimating = true;
  drawerState.isOpen = false;

  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartDrawerOverlay');

  if (drawer && overlay) {
    drawer.classList.remove('open');
    overlay.classList.remove('visible');
    
    // ✨ REMOVER ESTILOS INLINE
    drawer.style.right = '-450px';
    overlay.style.display = 'none';

    setTimeout(() => {
      drawerState.isAnimating = false;
    }, 300);
  } else {
    drawerState.isAnimating = false;
  }
}

/**
 * Toggle abrir/cerrar drawer
 * @returns {void}
 */
export function toggleCartDrawer() {
  if (drawerState.isOpen) {
    closeCartDrawer();
  } else {
    openCartDrawer();
  }
}

// ========================================
// GESTIONAR ITEMS DEL CARRITO
// ========================================

/**
 * Agregar producto al drawer
 * @param {Object} product - Producto a agregar
 * @param {string} selectedSize - Talla seleccionada
 * @param {number} quantity - Cantidad
 * @returns {Object|null} Item agregado o null si requiere seleccionar talla
 */
export function addProductToDrawer(product, selectedSize = null, quantity = 1) {
  // Validar si requiere talla
  if (requiresSizeSelection(product) && !selectedSize) {
    console.warn('⚠️ Producto requiere seleccionar talla');
    return null;
  }

  const cartItem = formatProductForCart(product, selectedSize, quantity);
  const existingIndex = drawerState.cartItems.findIndex(
    item => item.cartItemId === cartItem.cartItemId
  );

  if (existingIndex !== -1) {
    // Si existe, aumentar cantidad
    drawerState.cartItems[existingIndex].quantity += quantity;
  } else {
    // Agregar nuevo item
    drawerState.cartItems.push(cartItem);
  }

  saveCartToStorage();
  updateDrawerDisplay();
  updateCartBadge();

  console.log('✓ Producto agregado al carrito:', product.name);
  return cartItem;
}

/**
 * Eliminar producto del carrito
 * @param {string} cartItemId - ID del item del carrito
 * @returns {boolean}
 */
export function removeFromDrawer(cartItemId) {
  const initialLength = drawerState.cartItems.length;

  drawerState.cartItems = drawerState.cartItems.filter(
    item => item.cartItemId !== cartItemId
  );

  if (drawerState.cartItems.length < initialLength) {
    saveCartToStorage();
    updateDrawerDisplay();
    updateCartBadge();
    console.log('✓ Producto eliminado del carrito');
    return true;
  }

  return false;
}

/**
 * Actualizar cantidad de producto
 * @param {string} cartItemId - ID del item
 * @param {number} quantity - Nueva cantidad
 * @returns {boolean}
 */
export function updateQuantity(cartItemId, quantity) {
  const item = drawerState.cartItems.find(i => i.cartItemId === cartItemId);

  if (!item) return false;

  if (quantity <= 0) {
    return removeFromDrawer(cartItemId);
  }

  item.quantity = quantity;
  saveCartToStorage();
  updateDrawerDisplay();
  updateCartBadge();

  return true;
}

/**
 * Aumentar cantidad de producto
 * @param {string} cartItemId - ID del item
 * @returns {number|null} Nueva cantidad o null si no existe
 */
export function increaseQuantity(cartItemId) {
  const item = drawerState.cartItems.find(i => i.cartItemId === cartItemId);

  if (!item) return null;

  item.quantity += 1;
  saveCartToStorage();
  updateDrawerDisplay();
  updateCartBadge();

  return item.quantity;
}

/**
 * Disminuir cantidad de producto
 * @param {string} cartItemId - ID del item
 * @returns {number|null} Nueva cantidad o null si no existe
 */
export function decreaseQuantity(cartItemId) {
  const item = drawerState.cartItems.find(i => i.cartItemId === cartItemId);

  if (!item) return null;

  if (item.quantity <= 1) {
    removeFromDrawer(cartItemId);
    return 0;
  }

  item.quantity -= 1;
  saveCartToStorage();
  updateDrawerDisplay();
  updateCartBadge();

  return item.quantity;
}

/**
 * Limpiar carrito completo
 * @returns {void}
 */
export function clearCart() {
  drawerState.cartItems = [];
  saveCartToStorage();
  updateDrawerDisplay();
  updateCartBadge();
  console.log('✓ Carrito vaciado');
}

// ========================================
// GETTERS
// ========================================

/**
 * Obtener items del carrito
 * @returns {Array}
 */
export function getCartItems() {
  return [...drawerState.cartItems];
}

/**
 * Obtener total del carrito
 * @returns {number}
 */
export function getCartTotal() {
  return drawerState.cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}

/**
 * Obtener cantidad de items
 * @returns {number}
 */
export function getCartItemCount() {
  return drawerState.cartItems.reduce((count, item) => count + item.quantity, 0);
}

/**
 * Obtener cantidad de productos únicos
 * @returns {number}
 */
export function getCartProductCount() {
  return drawerState.cartItems.length;
}

/**
 * Obtener estado del drawer
 * @returns {Object}
 */
export function getDrawerState() {
  return {
    isOpen: drawerState.isOpen,
    itemCount: getCartItemCount(),
    productCount: getCartProductCount(),
    total: getCartTotal()
  };
}

/**
 * Obtener item específico del carrito
 * @param {string} cartItemId - ID del item
 * @returns {Object|null}
 */
export function getCartItem(cartItemId) {
  return drawerState.cartItems.find(item => item.cartItemId === cartItemId) || null;
}

// ========================================
// ACTUALIZAR DISPLAY
// ========================================

/**
 * Actualizar visualización del drawer
 * @returns {void}
 */
export function updateDrawerDisplay() {
  const itemsContainer = document.getElementById('cartDrawerItems');
  const emptyMessage = document.getElementById('cartDrawerEmpty');
  const totalElement = document.getElementById('cartDrawerTotal');
  const checkoutBtn = document.getElementById('cartDrawerCheckoutBtn');

  if (!itemsContainer) {
    console.warn('⚠️ Contenedor de items no encontrado');
    return;
  }

  if (drawerState.cartItems.length === 0) {
    itemsContainer.innerHTML = '';
    if (emptyMessage) emptyMessage.style.display = 'flex';
    if (totalElement) totalElement.style.display = 'none';
    if (checkoutBtn) checkoutBtn.style.display = 'none';
    return;
  }

  if (emptyMessage) emptyMessage.style.display = 'none';
  if (totalElement) totalElement.style.display = 'block';
  if (checkoutBtn) checkoutBtn.style.display = 'block';

  itemsContainer.innerHTML = drawerState.cartItems
    .map(item => createCartItemHTML(item))
    .join('');

  // Actualizar total
  if (totalElement) {
    totalElement.innerHTML = `
      <div class="cart-total-row">
        <span>Subtotal:</span>
        <span>${formatPrice(getCartTotal())}</span>
      </div>
      <div class="cart-total-row highlight">
        <span>Total:</span>
        <span>${formatPrice(getCartTotal())}</span>
      </div>
    `;
  }

  // Agregar event listeners a los botones
  setupItemEventListeners();
}

/**
 * Crear HTML de item del carrito
 * @param {Object} item - Item del carrito
 * @returns {string}
 */
function createCartItemHTML(item) {
  const sizeText = item.size ? `<small style="color: #999;">Talla: ${item.size}</small>` : '';
  const subtotal = item.price * item.quantity;

  return `
    <div class="cart-drawer-item" data-cart-item-id="${item.cartItemId}">
      <div class="cart-item-image">
        <img 
          src="${item.image}" 
          alt="${item.name}"
          onerror="this.src='https://via.placeholder.com/400x500?text=Sin+Imagen'"
        >
      </div>
      <div class="cart-item-details">
        <h4>${item.name}</h4>
        ${sizeText}
        <div class="cart-item-price">${formatPrice(item.price)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn minus" onclick="window.decreaseQtyInDrawer('${item.cartItemId}')">
          −
        </button>
        <span class="qty-value">${item.quantity}</span>
        <button class="qty-btn plus" onclick="window.increaseQtyInDrawer('${item.cartItemId}')">
          +
        </button>
      </div>
      <div class="cart-item-subtotal">
        <span>${formatPrice(subtotal)}</span>
      </div>
      <button 
        class="cart-item-remove" 
        onclick="window.removeFromDrawerUI('${item.cartItemId}')"
        title="Eliminar"
      >
        ✕
      </button>
    </div>
  `;
}

/**
 * Configurar event listeners de items
 * @returns {void}
 */
function setupItemEventListeners() {
  // Los eventos se configuran a través de onclick inline en el HTML
  // para mayor compatibilidad
}

/**
 * Actualizar badge del carrito en navbar
 * @returns {void}
 */
export function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (badge) {
    const count = getCartItemCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// ========================================
// ✨ SINCRONIZACIÓN CON LOCALSTORAGE
// ========================================

/**
 * Guardar carrito en localStorage (sincronizar con cart.js antiguo)
 * @returns {void}
 */
function saveCartToStorage() {
  // Guardar en drawer
  localStorage.setItem('emiluxe_cart_drawer', JSON.stringify(drawerState.cartItems));
  // Sincronizar también con cart.js antiguo para compatibilidad
  localStorage.setItem('emiluxe_cart', JSON.stringify(drawerState.cartItems));
  console.log('✓ Carrito sincronizado en localStorage:', drawerState.cartItems.length, 'items');
}

/**
 * Cargar carrito del localStorage (con fallback al formato antiguo)
 * @returns {void}
 */
function loadCartFromStorage() {
  // Intentar cargar del drawer primero
  let saved = localStorage.getItem('emiluxe_cart_drawer');
  
  // Si no existe, cargar del cart.js antiguo
  if (!saved) {
    saved = localStorage.getItem('emiluxe_cart');
  }
  
  if (saved) {
    try {
      drawerState.cartItems = JSON.parse(saved);
      console.log('✓ Carrito cargado del localStorage:', drawerState.cartItems.length, 'items');
      updateCartBadge();
      updateDrawerDisplay();
    } catch (error) {
      console.warn('⚠️ Error cargando carrito:', error);
      drawerState.cartItems = [];
    }
  } else {
    console.log('ℹ️ Carrito vacío (primera vez)');
    drawerState.cartItems = [];
  }
}

// ========================================
// FUNCIONES GLOBALES (para onclick)
// ========================================

// Estas funciones se exponen globalmente para ser usadas en onclick del HTML

window.decreaseQtyInDrawer = function(cartItemId) {
  decreaseQuantity(cartItemId);
};

window.increaseQtyInDrawer = function(cartItemId) {
  increaseQuantity(cartItemId);
};

window.removeFromDrawerUI = function(cartItemId) {
  removeFromDrawer(cartItemId);
};

/**
 * Abrir drawer - ✨ MEJORADO CON DEBUGGING ✨
 * @returns {void}
 */
window.openDrawer = function() {
  console.log('🔔 openDrawer() llamado');
  try {
    openCartDrawer();
  } catch (error) {
    console.error('❌ Error en openDrawer:', error);
  }
};

/**
 * Cerrar drawer
 * @returns {void}
 */
window.closeDrawer = function() {
  try {
    closeCartDrawer();
  } catch (error) {
    console.error('Error en closeDrawer:', error);
  }
};

// ========================================
// EXPORT DEFAULT
// ========================================

export default {
  initCartDrawer,
  openCartDrawer,
  closeCartDrawer,
  toggleCartDrawer,
  addProductToDrawer,
  removeFromDrawer,
  updateQuantity,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
  getCartItems,
  getCartTotal,
  getCartItemCount,
  getCartProductCount,
  getDrawerState,
  getCartItem,
  updateDrawerDisplay,
  updateCartBadge
};
