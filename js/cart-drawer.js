// ========================================
// EMILUXE - CART DRAWER
// ========================================
// Gestión del carrito flotante (drawer)

import { formatPrice } from './product-utils.js';

// ========================================
// ESTADO DEL CARRITO
// ========================================

let cartDrawerState = {
  isOpen: false,
  items: []
};

// ========================================
// INICIALIZAR CARRITO
// ========================================

/**
 * Cargar carrito desde localStorage
 * @returns {void}
 */
function initializeCart() {
  const savedCart = localStorage.getItem('emiluxeCart');
  if (savedCart) {
    try {
      cartDrawerState.items = JSON.parse(savedCart);
      updateCartBadge();
    } catch (error) {
      console.error('Error cargando carrito:', error);
      cartDrawerState.items = [];
    }
  }
}

/**
 * Guardar carrito en localStorage
 * @returns {void}
 */
function saveCart() {
  localStorage.setItem('emiluxeCart', JSON.stringify(cartDrawerState.items));
  updateCartBadge();
}

// ========================================
// OPERACIONES DEL CARRITO
// ========================================

/**
 * Agregar producto al carrito
 * @param {Object} product - Producto a agregar
 * @param {string|null} size - Talla seleccionada
 * @param {number} quantity - Cantidad
 * @returns {void}
 */
export function addProductToDrawer(product, size, quantity = 1) {
  if (!product || !product.id) {
    throw new Error('Producto inválido');
  }

  // Buscar si el producto ya está en el carrito con la misma talla
  const existingItemIndex = cartDrawerState.items.findIndex(
    item => item.id === product.id && item.size === size
  );

  if (existingItemIndex > -1) {
    // Si existe, incrementar cantidad
    cartDrawerState.items[existingItemIndex].quantity += quantity;
  } else {
    // Si no existe, agregarlo
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: size,
      quantity: quantity
    };
    cartDrawerState.items.push(cartItem);
  }

  saveCart();
}

/**
 * Remover producto del carrito
 * @param {string} productId - ID del producto
 * @param {string|null} size - Talla
 * @returns {void}
 */
export function removeProductFromDrawer(productId, size) {
  cartDrawerState.items = cartDrawerState.items.filter(
    item => !(item.id === productId && item.size === size)
  );
  saveCart();
  renderCartDrawer();
}

/**
 * Actualizar cantidad de producto
 * @param {string} productId - ID del producto
 * @param {string|null} size - Talla
 * @param {number} newQuantity - Nueva cantidad
 * @returns {void}
 */
export function updateProductQuantity(productId, size, newQuantity) {
  const item = cartDrawerState.items.find(
    item => item.id === productId && item.size === size
  );

  if (item) {
    if (newQuantity <= 0) {
      removeProductFromDrawer(productId, size);
    } else {
      item.quantity = newQuantity;
      saveCart();
      renderCartDrawer();
    }
  }
}

/**
 * Vaciar carrito
 * @returns {void}
 */
export function clearCart() {
  if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
    cartDrawerState.items = [];
    saveCart();
    renderCartDrawer();
    showNotification('Carrito vaciado', 'info');
  }
}

/**
 * Obtener total del carrito
 * @returns {number}
 */
export function getCartTotal() {
  return cartDrawerState.items.reduce(
    (total, item) => total + (item.price * item.quantity),
    0
  );
}

/**
 * Obtener cantidad de items en el carrito
 * @returns {number}
 */
export function getCartItemCount() {
  return cartDrawerState.items.reduce((count, item) => count + item.quantity, 0);
}

/**
 * Obtener items del carrito
 * @returns {Array}
 */
export function getCartItems() {
  return cartDrawerState.items;
}

// ========================================
// DRAWER (PANEL FLOTANTE)
// ========================================

/**
 * Abrir drawer del carrito
 * @returns {void}
 */
export function openDrawer() {
  cartDrawerState.isOpen = true;
  const drawer = document.getElementById('cartDrawer');
  if (drawer) {
    drawer.style.display = 'flex';
  }
  renderCartDrawer();
}

/**
 * Cerrar drawer del carrito
 * @returns {void}
 */
export function closeDrawer() {
  cartDrawerState.isOpen = false;
  const drawer = document.getElementById('cartDrawer');
  if (drawer) {
    drawer.style.display = 'none';
  }
}

/**
 * Renderizar drawer del carrito
 * @returns {void}
 */
function renderCartDrawer() {
  let drawer = document.getElementById('cartDrawer');
  
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'cartDrawer';
    drawer.className = 'cart-drawer';
    document.body.appendChild(drawer);
    
    // Agregar estilos si no existen
    if (!document.getElementById('cartDrawerStyles')) {
      addCartDrawerStyles();
    }
  }

  const itemsHTML = cartDrawerState.items.map((item, index) => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='assets/images/placeholder.png'">
      <div class="cart-item-info">
        <h4 class="cart-item-name">${item.name}</h4>
        ${item.size ? `<p class="cart-item-size">Talla: ${item.size}</p>` : ''}
        <p class="cart-item-price">${formatPrice(item.price)}</p>
      </div>
      <div class="cart-item-controls">
        <div class="quantity-control">
          <button onclick="window.decrementQuantity('${item.id}', '${item.size || 'null'}')" class="qty-btn">−</button>
          <input type="number" value="${item.quantity}" min="1" readonly class="qty-input">
          <button onclick="window.incrementQuantity('${item.id}', '${item.size || 'null'}')" class="qty-btn">+</button>
        </div>
        <button onclick="window.removeFromCart('${item.id}', '${item.size || 'null'}')" class="cart-item-remove">🗑️</button>
      </div>
    </div>
  `).join('');

  const total = getCartTotal();

  drawer.innerHTML = `
    <div class="cart-drawer-overlay" onclick="window.closeCartDrawer()"></div>
    <div class="cart-drawer-content">
      <div class="cart-drawer-header">
        <h2>🛒 Tu Carrito</h2>
        <button class="drawer-close-btn" onclick="window.closeCartDrawer()">✕</button>
      </div>

      ${cartDrawerState.items.length === 0 ? `
        <div class="cart-empty">
          <p>Tu carrito está vacío</p>
          <button onclick="window.closeCartDrawer()" class="continue-shopping-btn">Continuar comprando</button>
        </div>
      ` : `
        <div class="cart-items-list">
          ${itemsHTML}
        </div>

        <div class="cart-drawer-footer">
          <div class="cart-total">
            <span>Total:</span>
            <span class="total-price">${formatPrice(total)}</span>
          </div>
          <button class="checkout-btn" onclick="window.proceedToCheckout()">Ir al Carrito</button>
          <button class="clear-cart-btn" onclick="window.clearCartDrawer()">Vaciar Carrito</button>
        </div>
      `}
    </div>
  `;

  if (cartDrawerState.isOpen) {
    drawer.style.display = 'flex';
  }
}

/**
 * Actualizar badge del carrito
 * @returns {void}
 */
function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (badge) {
    const count = getCartItemCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// ========================================
// ESTILOS CSS
// ========================================

/**
 * Agregar estilos del drawer
 * @returns {void}
 */
function addCartDrawerStyles() {
  const style = document.createElement('style');
  style.id = 'cartDrawerStyles';
  style.textContent = `
    /* Cart Drawer Styles */
    .cart-drawer {
      display: none;
      position: fixed;
      top: 0;
      right: 0;
      width: 100%;
      height: 100%;
      z-index: 1500;
      align-items: center;
      justify-content: flex-end;
    }

    .cart-drawer-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      cursor: pointer;
    }

    .cart-drawer-content {
      position: relative;
      background: white;
      width: 100%;
      max-width: 450px;
      height: 100%;
      box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      animation: slideInRight 0.3s ease;
    }

    .cart-drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #eee;
    }

    .cart-drawer-header h2 {
      margin: 0;
      font-size: 1.3rem;
      color: #333;
    }

    .drawer-close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
      transition: color 0.2s;
    }

    .drawer-close-btn:hover {
      color: #333;
    }

    .cart-items-list {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .cart-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid #eee;
      align-items: flex-start;
    }

    .cart-item-image {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 8px;
    }

    .cart-item-info {
      flex: 1;
    }

    .cart-item-name {
      margin: 0 0 0.3rem 0;
      font-size: 0.95rem;
      color: #333;
      font-weight: 600;
    }

    .cart-item-size {
      margin: 0.2rem 0;
      font-size: 0.8rem;
      color: #999;
    }

    .cart-item-price {
      margin: 0.5rem 0 0 0;
      font-size: 0.95rem;
      color: #FF6B9D;
      font-weight: 700;
    }

    .cart-item-controls {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .quantity-control {
      display: flex;
      align-items: center;
      border: 1px solid #ddd;
      border-radius: 6px;
    }

    .qty-btn {
      background: none;
      border: none;
      padding: 0.3rem 0.5rem;
      cursor: pointer;
      color: #333;
      font-weight: bold;
    }

    .qty-btn:hover {
      background: #f5f5f5;
    }

    .qty-input {
      width: 35px;
      border: none;
      text-align: center;
      font-weight: 600;
    }

    .cart-item-remove {
      background: none;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 0.5rem;
    }

    .cart-item-remove:hover {
      opacity: 0.7;
    }

    .cart-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
    }

    .cart-empty p {
      color: #999;
      font-size: 1.1rem;
    }

    .continue-shopping-btn {
      padding: 0.8rem 1.5rem;
      background: #f5f5f5;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      color: #333;
    }

    .continue-shopping-btn:hover {
      background: #eee;
    }

    .cart-drawer-footer {
      border-top: 2px solid #eee;
      padding: 1.5rem;
    }

    .cart-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      font-size: 1.2rem;
      font-weight: 700;
      color: #333;
    }

    .total-price {
      color: #FF6B9D;
      font-size: 1.3rem;
    }

    .checkout-btn,
    .clear-cart-btn {
      width: 100%;
      padding: 0.9rem;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 0.8rem;
    }

    .checkout-btn {
      background: linear-gradient(135deg, #FF6B9D 0%, #E63A7F 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
    }

    .checkout-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(255, 107, 157, 0.4);
    }

    .clear-cart-btn {
      background: #f5f5f5;
      color: #333;
    }

    .clear-cart-btn:hover {
      background: #eee;
    }

    @media (max-width: 600px) {
      .cart-drawer-content {
        max-width: 100%;
      }
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0);
      }
    }
  `;

  document.head.appendChild(style);
}

// ========================================
// FUNCIONES GLOBALES
// ========================================

window.openCartDrawer = openDrawer;
window.closeCartDrawer = closeDrawer;

window.incrementQuantity = (productId, size) => {
  const item = cartDrawerState.items.find(
    i => i.id === productId && i.size === (size === 'null' ? null : size)
  );
  if (item) {
    updateProductQuantity(productId, item.size, item.quantity + 1);
  }
};

window.decrementQuantity = (productId, size) => {
  const item = cartDrawerState.items.find(
    i => i.id === productId && i.size === (size === 'null' ? null : size)
  );
  if (item) {
    updateProductQuantity(productId, item.size, item.quantity - 1);
  }
};

window.removeFromCart = (productId, size) => {
  removeProductFromDrawer(productId, size === 'null' ? null : size);
};

window.clearCartDrawer = clearCart;

window.proceedToCheckout = () => {
  closeDrawer();
  window.location.href = 'cart.html';
};

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  initializeCart();
  updateCartBadge();
});

// ========================================
// EXPORT DEFAULT
// ========================================

export default {
  addProductToDrawer,
  removeProductFromDrawer,
  updateProductQuantity,
  clearCart,
  openDrawer,
  closeDrawer,
  getCartTotal,
  getCartItemCount,
  getCartItems
};
