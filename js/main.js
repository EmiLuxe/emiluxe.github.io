// ========================================
// EMILUXE - MAIN SCRIPT
// ========================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initCart();
  updateCartBadge();
  setupNavigation();
  setupCategoryLinks();
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

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background-color: ${type === 'success' ? '#d4edda' : '#f8d7da'};
    border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
    color: ${type === 'success' ? '#155724' : '#721c24'};
    padding: 1rem 1.5rem;
    border-radius: 8px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-width: 300px;
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