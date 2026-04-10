// ========================================
// EMILUXE - QUICK BUY SYSTEM
// ========================================
// Sistema de compra rápida sin pasar por el carrito

import { getAllProducts } from './products.js';
import { requiresSizeSelection, formatProductForCart } from './product-utils.js';
import { 
  generateWhatsappMessage, 
  getWhatsappURL,
  createOrder,
  saveOrderToHistory,
  generateOrderId 
} from './whatsapp-checkout.js';

const WHATSAPP_PHONE = '573164321234'; // ⚠️ REEMPLAZAR CON TU NÚMERO

// ========================================
// ESTADO DE QUICK BUY
// ========================================

let quickBuyState = {
  isOpen: false,
  currentProduct: null,
  selectedSize: null,
  quantity: 1
};

// ========================================
// ABRIR FORMULARIO QUICK BUY
// ========================================

/**
 * Abrir modal de compra rápida
 * @param {Object} product - Producto a comprar
 * @returns {void}
 */
export function openQuickBuyModal(product) {
  quickBuyState.currentProduct = product;
  quickBuyState.selectedSize = null;
  quickBuyState.quantity = 1;

  const modal = document.getElementById('quickBuyModal');
  if (modal) {
    modal.style.display = 'flex';
    renderQuickBuyContent(product);
  }
}

/**
 * Cerrar modal de compra rápida
 * @returns {void}
 */
export function closeQuickBuyModal() {
  const modal = document.getElementById('quickBuyModal');
  if (modal) {
    modal.style.display = 'none';
  }
  quickBuyState = {
    isOpen: false,
    currentProduct: null,
    selectedSize: null,
    quantity: 1
  };
}

/**
 * Toggle del modal
 * @returns {void}
 */
export function toggleQuickBuyModal(product) {
  if (quickBuyState.isOpen) {
    closeQuickBuyModal();
  } else {
    openQuickBuyModal(product);
  }
}

// ========================================
// RENDERIZAR CONTENIDO
// ========================================

/**
 * Renderizar contenido del modal de quick buy
 * @param {Object} product - Producto
 * @returns {void}
 */
function renderQuickBuyContent(product) {
  const content = document.getElementById('quickBuyContent');
  if (!content) return;

  const needsSize = requiresSizeSelection(product);
  const sizes = product.sizes || [];

  let sizeHTML = '';
  if (needsSize) {
    sizeHTML = `
      <div class="quick-buy-sizes">
        <label>Selecciona la talla:</label>
        <div class="size-options">
          ${sizes.map(size => `
            <button 
              class="size-btn" 
              onclick="window.selectQuickBuySize('${size}')"
            >
              ${size === 'UNIQUE' ? 'Talla Única' : size}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  content.innerHTML = `
    <div class="quick-buy-modal-content">
      <button class="quick-buy-close" onclick="window.closeQuickBuyModal()">✕</button>

      <div class="quick-buy-container">
        <div class="quick-buy-image">
          <img 
            src="${product.image}" 
            alt="${product.name}"
            onerror="this.src='assets/images/placeholder.png'"
          >
        </div>

        <div class="quick-buy-info">
          <h2>${product.name}</h2>
          <p class="quick-buy-category">${product.category}</p>
          <p class="quick-buy-description">${product.description}</p>
          <div class="quick-buy-price">${formatPrice(product.price)}</div>

          ${sizeHTML}

          <div class="quick-buy-quantity">
            <label>Cantidad:</label>
            <div class="quantity-selector">
              <button onclick="window.decreaseQuickBuyQty()">−</button>
              <span id="quickBuyQtyDisplay">1</span>
              <button onclick="window.increaseQuickBuyQty()">+</button>
            </div>
          </div>

          <button 
            class="quick-buy-btn" 
            onclick="window.processQuickBuy()"
          >
            Comprar por WhatsApp
          </button>

          <div class="quick-buy-info-box">
            <p>💳 Pago contra entrega</p>
            <p>🚚 Envío a todo Colombia</p>
          </div>
        </div>
      </div>
    </div>
  `;

  quickBuyState.isOpen = true;
}

// ========================================
// GESTIONAR ESTADO
// ========================================

/**
 * Seleccionar talla
 * @param {string} size - Talla seleccionada
 * @returns {void}
 */
export function selectQuickBuySize(size) {
  quickBuyState.selectedSize = size;

  // Actualizar UI
  const sizeBtns = document.querySelectorAll('.size-btn');
  sizeBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.includes(size === 'UNIQUE' ? 'Talla Única' : size)) {
      btn.classList.add('active');
    }
  });
}

/**
 * Aumentar cantidad
 * @returns {void}
 */
export function increaseQuickBuyQty() {
  quickBuyState.quantity += 1;
  updateQuickBuyQtyDisplay();
}

/**
 * Disminuir cantidad
 * @returns {void}
 */
export function decreaseQuickBuyQty() {
  if (quickBuyState.quantity > 1) {
    quickBuyState.quantity -= 1;
    updateQuickBuyQtyDisplay();
  }
}

/**
 * Actualizar display de cantidad
 * @returns {void}
 */
function updateQuickBuyQtyDisplay() {
  const display = document.getElementById('quickBuyQtyDisplay');
  if (display) {
    display.textContent = quickBuyState.quantity;
  }
}

// ========================================
// PROCESAR COMPRA RÁPIDA
// ========================================

/**
 * Validar antes de procesar compra
 * @returns {Object}
 */
function validateQuickBuyData() {
  const errors = [];

  if (!quickBuyState.currentProduct) {
    errors.push('Error: Producto no disponible');
  }

  if (requiresSizeSelection(quickBuyState.currentProduct) && !quickBuyState.selectedSize) {
    errors.push('Selecciona una talla antes de continuar');
  }

  if (quickBuyState.quantity < 1) {
    errors.push('La cantidad debe ser mayor a 0');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Procesar compra rápida
 * @returns {void}
 */
export async function processQuickBuy() {
  const validation = validateQuickBuyData();

  if (!validation.valid) {
    validation.errors.forEach(error => {
      showNotification(error, 'error');
    });
    return;
  }

  // Mostrar modal de datos del cliente
  showQuickBuyCustomerForm();
}

/**
 * Mostrar formulario de datos del cliente
 * @returns {void}
 */
function showQuickBuyCustomerForm() {
  const modal = document.getElementById('quickBuyCustomerModal');
  if (!modal) {
    console.error('Modal de cliente no encontrado');
    return;
  }

  modal.innerHTML = `
    <div class="quick-buy-customer-content">
      <button class="quick-buy-close" onclick="window.closeQuickBuyCustomerForm()">✕</button>

      <h3>Completa tus datos</h3>

      <form id="quickBuyCustomerForm" onsubmit="window.submitQuickBuyForm(event)">
        <div class="form-group">
          <label for="qb_name">Nombre *</label>
          <input 
            type="text" 
            id="qb_name" 
            name="name" 
            placeholder="Tu nombre"
            required
          >
        </div>

        <div class="form-group">
          <label for="qb_phone">Teléfono *</label>
          <input 
            type="tel" 
            id="qb_phone" 
            name="phone" 
            placeholder="Ej: 3101234567"
            required
          >
        </div>

        <div class="form-group">
          <label for="qb_address">Dirección *</label>
          <input 
            type="text" 
            id="qb_address" 
            name="address" 
            placeholder="Tu dirección"
            required
          >
        </div>

        <div class="form-group">
          <label for="qb_city">Ciudad *</label>
          <input 
            type="text" 
            id="qb_city" 
            name="city" 
            placeholder="Tu ciudad"
            required
          >
        </div>

        <button type="submit" class="quick-buy-submit-btn">
          Enviar pedido por WhatsApp
        </button>
      </form>
    </div>
  `;

  modal.style.display = 'flex';
}

/**
 * Cerrar formulario de cliente
 * @returns {void}
 */
export function closeQuickBuyCustomerForm() {
  const modal = document.getElementById('quickBuyCustomerModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Enviar formulario de compra rápida
 * @param {Event} event - Evento del formulario
 * @returns {void}
 */
export function submitQuickBuyForm(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  const customerData = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    city: formData.get('city')
  };

  // Validar datos
  const validation = validateCustomerData(customerData);
  if (!validation.valid) {
    validation.errors.forEach(error => {
      showNotification(error, 'error');
    });
    return;
  }

  // Procesar compra
  completeQuickBuy(customerData);
}

/**
 * Completar compra rápida
 * @param {Object} customerData - Datos del cliente
 * @returns {void}
 */
function completeQuickBuy(customerData) {
  try {
    const product = quickBuyState.currentProduct;
    const quantity = quickBuyState.quantity;
    const selectedSize = quickBuyState.selectedSize;

    // Crear item de carrito
    const cartItem = formatProductForCart(product, selectedSize, quantity);
    const items = [cartItem];
    const total = product.price * quantity;

    // Crear orden
    const order = createOrder(customerData, items, total);
    saveOrderToHistory(order);

    // Generar mensaje WhatsApp
    const message = generateWhatsappMessage(items, total, customerData);
    const whatsappURL = getWhatsappURL(items, total, customerData);

    // Cerrar modales
    closeQuickBuyModal();
    closeQuickBuyCustomerForm();

    // Mostrar notificación
    showNotification('Redirigiendo a WhatsApp...', 'success');

    // Abrir WhatsApp
    setTimeout(() => {
      window.open(whatsappURL, '_blank');
    }, 500);

  } catch (error) {
    console.error('Error en compra rápida:', error);
    showNotification('Error procesando la compra. Intenta nuevamente.', 'error');
  }
}

// ========================================
// VALIDACIÓN
// ========================================

/**
 * Validar datos del cliente
 * @param {Object} customerData - Datos
 * @returns {Object}
 */
function validateCustomerData(customerData) {
  const errors = [];

  if (!customerData.name || customerData.name.trim().length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres');
  }

  if (!customerData.phone || customerData.phone.trim().length < 7) {
    errors.push('El teléfono debe tener al menos 7 dígitos');
  }

  if (!customerData.address || customerData.address.trim().length < 5) {
    errors.push('La dirección debe tener al menos 5 caracteres');
  }

  if (!customerData.city || customerData.city.trim().length < 2) {
    errors.push('La ciudad es requerida');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ========================================
// FUNCIONES GLOBALES
// ========================================

window.selectQuickBuySize = selectQuickBuySize;
window.increaseQuickBuyQty = increaseQuickBuyQty;
window.decreaseQuickBuyQty = decreaseQuickBuyQty;
window.processQuickBuy = processQuickBuy;
window.closeQuickBuyModal = closeQuickBuyModal;
window.closeQuickBuyCustomerForm = closeQuickBuyCustomerForm;
window.submitQuickBuyForm = submitQuickBuyForm;

// ========================================
// EXPORT DEFAULT
// ========================================

export default {
  openQuickBuyModal,
  closeQuickBuyModal,
  toggleQuickBuyModal,
  selectQuickBuySize,
  increaseQuickBuyQty,
  decreaseQuickBuyQty,
  processQuickBuy,
  closeQuickBuyCustomerForm,
  submitQuickBuyForm
};
