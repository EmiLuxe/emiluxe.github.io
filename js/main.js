// ========================================
// EMILUXE - MAIN SCRIPT ✨ MODIFICADO ✨
// ========================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  initCart();
  updateCartBadge();
  setupNavigation();
  setupCategoryLinks();
  
  // Inicializar módulos nuevos ✨ NUEVO ✨
  try {
    const { initCartDrawer } = await import('./cart-drawer.js');
    initCartDrawer();
  } catch (error) {
    console.warn('Cart Drawer no disponible en esta página');
  }

  try {
    const { initSearch } = await import('./search.js');
    await initSearch();
  } catch (error) {
    console.warn('Search no disponible en esta página');
  }

  try {
    const { initFilters } = await import('./filters.js');
    await initFilters();
  } catch (error) {
    console.warn('Filters no disponible en esta página');
  }
});

// Setup navigation link
function setupNavigation() {
  // Get current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Update active link
  const navLinks = document.querySelectorAll('.navbar-menu a');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.style.color = 'var(--dark-pink)';
    }
  });
}

// Setup category links to navigate to shop
function setupCategoryLinks() {
  const categoryCards = document.querySelectorAll('.category-card');
  categoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const category = card.querySelector('h3').textContent;
      localStorage.setItem('selectedCategory', category);
      window.location.href = 'shop.html';
    });
  });
}

// Format price to currency
function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

// Show notification ✨ MEJORADO ✨
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  
  const colors = {
    success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
    error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
    info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' },
    warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' }
  };

  const color = colors[type] || colors.info;

  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background-color: ${color.bg};
    border: 1px solid ${color.border};
    color: ${color.text};
    padding: 1rem 1.5rem;
    border-radius: 8px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-width: 400px;
    font-weight: 500;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

// Validate phone number
function validatePhoneNumber(phone) {
  const regex = /^[0-9]{10}$/;
  return regex.test(phone);
}

// Get order history
function getOrderHistory() {
  return JSON.parse(localStorage.getItem('emiluxe_orders')) || [];
}

// Clear order data after sending
function clearOrderData() {
  localStorage.removeItem('emiluxe_current_order');
}

// ========================================
// DRAWER GLOBALES ✨ NUEVO ✨
// ========================================

/**
 * Abrir drawer del carrito
 * @returns {void}
 */
window.openDrawer = async function() {
  try {
    const { openCartDrawer } = await import('./cart-drawer.js');
    openCartDrawer();
  } catch (error) {
    console.error('Error abriendo drawer:', error);
  }
}

/**
 * Cerrar drawer del carrito
 * @returns {void}
 */
window.closeDrawer = async function() {
  try {
    const { closeCartDrawer } = await import('./cart-drawer.js');
    closeCartDrawer();
  } catch (error) {
    console.error('Error cerrando drawer:', error);
  }
}

// ========================================
// LAZY LOADING ✨ NUEVO ✨
// ========================================

/**
 * Lazy loading de imágenes
 */
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px'
  });

  document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => imageObserver.observe(img));
  });
}

// ========================================
// HELPERS GLOBALES ✨ NUEVO ✨
// ========================================

/**
 * Validar email
 * @param {string} email
 * @returns {boolean}
 */
window.isValidEmail = function(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Sanitizar entrada
 * @param {string} input
 * @returns {string}
 */
window.sanitizeInput = function(input) {
  return input
    .trim()
    .replace(/[<>\"]/g, '')
    .substring(0, 500);
}

/**
 * Copiar al portapapeles
 * @param {string} text
 * @returns {Promise<void>}
 */
window.copyToClipboard = async function(text) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      showNotification('Copiado al portapapeles', 'success');
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showNotification('Copiado al portapapeles', 'success');
    }
  } catch (error) {
    console.error('Error copiando:', error);
    showNotification('Error al copiar', 'error');
  }
}

/**
 * Scroll suave
 * @param {string} selector
 * @param {number} offset
 * @returns {void}
 */
window.smoothScroll = function(selector, offset = 0) {
  const element = document.querySelector(selector);
  if (element) {
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({
      top,
      behavior: 'smooth'
    });
  }
}
