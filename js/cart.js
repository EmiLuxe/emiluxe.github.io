 
// ========================================
// EMILUXE - CART SYSTEM
// ========================================

// Cart key for localStorage
const CART_KEY = 'emiluxe_cart';

// Initialize cart from localStorage
function initCart() {
  let cart = localStorage.getItem(CART_KEY);
  if (!cart) {
    localStorage.setItem(CART_KEY, JSON.stringify([]));
    return [];
  }
  return JSON.parse(cart);
}

// Get current cart
function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

// Add product to cart
function addToCart(product, quantity = 1) {
  let cart = getCart();
  const existingItem = cart.find(item => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity
    });
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
  return cart;
}

// Remove product from cart
function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
  return cart;
}

// Update product quantity
function updateQuantity(productId, quantity) {
  let cart = getCart();
  const item = cart.find(item => item.id === productId);

  if (item) {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    item.quantity = quantity;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  return cart;
}

// Get cart total
function getCartTotal() {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

// Get cart item count
function getCartCount() {
  const cart = getCart();
  return cart.reduce((count, item) => count + item.quantity, 0);
}

// Clear cart
function clearCart() {
  localStorage.setItem(CART_KEY, JSON.stringify([]));
  updateCartBadge();
}

// Update cart badge display
function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (badge) {
    const count = getCartCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// Initialize cart badge on page load
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    getCartCount,
    clearCart,
    updateCartBadge,
    initCart
  };
}