// ========================================
// EMILUXE - WHATSAPP CHECKOUT SYSTEM
// ========================================
// Sistema de compra por WhatsApp con formulario de datos

import { getCartItems, getCartTotal, clearCart } from './cart-drawer.js';

// ========================================
// CONFIGURACIÓN
// ========================================

const WHATSAPP_PHONE = '5731179654744'; // 

const CHECKOUT_CONFIG = {
  storeName: 'EmiLuxe',
  formFields: ['name', 'phone', 'address', 'city'],
  enablePromo: true
};

// ========================================
// ESTADO DEL CHECKOUT
// ========================================

let checkoutState = {
  formData: {
    name: '',
    phone: '',
    address: '',
    city: ''
  },
  isProcessing: false,
  lastOrder: null
};

// ========================================
// INICIALIZAR CHECKOUT
// ========================================

/**
 * Inicializar sistema de checkout
 * @returns {void}
 */
export function initWhatsappCheckout() {
  console.log('💳 Inicializando WhatsApp Checkout...');
  loadCheckoutFormData();
  console.log('✓ WhatsApp Checkout inicializado');
}

/**
 * Validar carrito antes de checkout
 * @returns {Object} Resultado de validación
 */
export function validateCheckout() {
  const cartItems = getCartItems();

  if (cartItems.length === 0) {
    return {
      valid: false,
      error: 'El carrito está vacío. Agrega productos antes de continuar.'
    };
  }

  return {
    valid: true,
    itemsCount: cartItems.length,
    total: getCartTotal()
  };
}

// ========================================
// FORMULARIO
// ========================================

/**
 * Validar datos del formulario
 * @param {Object} formData - Datos del formulario
 * @returns {Object} Resultado de validación
 */
export function validateFormData(formData) {
  const errors = [];

  // Validar nombre
  if (!formData.name || formData.name.trim().length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres');
  }

  // Validar teléfono
  if (!formData.phone || formData.phone.trim().length < 7) {
    errors.push('El teléfono debe tener al menos 7 dígitos');
  }

  // Validar formato de teléfono (solo números)
  if (!/^[0-9+\-\s()]*$/.test(formData.phone)) {
    errors.push('El teléfono contiene caracteres inválidos');
  }

  // Validar dirección
  if (!formData.address || formData.address.trim().length < 5) {
    errors.push('La dirección debe tener al menos 5 caracteres');
  }

  // Validar ciudad
  if (!formData.city || formData.city.trim().length < 2) {
    errors.push('La ciudad es requerida');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Guardar datos del formulario en localStorage
 * @param {Object} formData - Datos del formulario
 * @returns {void}
 */
export function saveCheckoutFormData(formData) {
  checkoutState.formData = { ...formData };
  localStorage.setItem(
    'emiluxe_checkout_form',
    JSON.stringify(checkoutState.formData)
  );
  console.log('✓ Datos del formulario guardados');
}

/**
 * Cargar datos del formulario del localStorage
 * @returns {Object}
 */
export function loadCheckoutFormData() {
  const saved = localStorage.getItem('emiluxe_checkout_form');
  if (saved) {
    try {
      checkoutState.formData = JSON.parse(saved);
    } catch (error) {
      console.warn('Error cargando datos del formulario:', error);
    }
  }
  return checkoutState.formData;
}

/**
 * Obtener datos del formulario
 * @returns {Object}
 */
export function getFormData() {
  return { ...checkoutState.formData };
}

/**
 * Actualizar campo del formulario
 * @param {string} fieldName - Nombre del campo
 * @param {string} value - Nuevo valor
 * @returns {void}
 */
export function updateFormField(fieldName, value) {
  if (CHECKOUT_CONFIG.formFields.includes(fieldName)) {
    checkoutState.formData[fieldName] = value;
  }
}

// ========================================
// GENERAR MENSAJE DE WHATSAPP
// ========================================

/**
 * Generar mensaje de WhatsApp formateado
 * @param {Array} cartItems - Items del carrito
 * @param {number} total - Total del pedido
 * @param {Object} customerData - Datos del cliente
 * @returns {string} Mensaje formateado
 */
export function generateWhatsappMessage(cartItems, total, customerData) {
  let message = `*Nuevo Pedido de ${CHECKOUT_CONFIG.storeName}* 📦\n\n`;

  message += `*CLIENTE* 👤\n`;
  message += `Nombre: ${customerData.name}\n`;
  message += `Teléfono: ${customerData.phone}\n`;
  message += `Dirección: ${customerData.address}\n`;
  message += `Ciudad: ${customerData.city}\n\n`;

  message += `*PRODUCTOS* 🛍️\n`;
  message += `${'─'.repeat(40)}\n`;

  cartItems.forEach((item, index) => {
    const sizeText = item.size ? ` (${item.size})` : '';
    const subtotal = item.price * item.quantity;
    message += `${index + 1}. ${item.name}${sizeText}\n`;
    message += `   Cantidad: ${item.quantity}\n`;
    message += `   Precio unitario: ${formatPrice(item.price)}\n`;
    message += `   Subtotal: ${formatPrice(subtotal)}\n\n`;
  });

  message += `${'─'.repeat(40)}\n`;
  message += `*TOTAL: ${formatPrice(total)}*\n\n`;
  message += `✅ Pago: Contra entrega\n`;
  message += `📍 Envío: Coordinado al recibir el pedido\n`;

  return message;
}

/**
 * Obtener URL de WhatsApp con mensaje
 * @param {Array} cartItems - Items del carrito
 * @param {number} total - Total
 * @param {Object} customerData - Datos del cliente
 * @returns {string} URL de WhatsApp
 */
export function getWhatsappURL(cartItems, total, customerData) {
  const message = generateWhatsappMessage(cartItems, total, customerData);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;
}

// ========================================
// PROCESAR CHECKOUT
// ========================================

/**
 * Procesar checkout completo
 * @param {Object} formData - Datos del formulario
 * @returns {Object} Resultado del proceso
 */
export async function processCheckout(formData) {
  // Validar carrito
  const cartValidation = validateCheckout();
  if (!cartValidation.valid) {
    return {
      success: false,
      error: cartValidation.error
    };
  }

  // Validar formulario
  const formValidation = validateFormData(formData);
  if (!formValidation.valid) {
    return {
      success: false,
      errors: formValidation.errors
    };
  }

  checkoutState.isProcessing = true;

  try {
    // Obtener items del carrito
    const cartItems = getCartItems();
    const total = getCartTotal();

    // Guardar datos del formulario
    saveCheckoutFormData(formData);

    // Crear orden
    const order = createOrder(formData, cartItems, total);

    // Guardar orden en historial
    saveOrderToHistory(order);

    // Generar URL de WhatsApp
    const whatsappURL = getWhatsappURL(cartItems, total, formData);

    // Limpiar carrito
    clearCart();

    // Guardar última orden
    checkoutState.lastOrder = order;

    checkoutState.isProcessing = false;

    return {
      success: true,
      order,
      whatsappURL,
      message: 'Redirigiendo a WhatsApp...'
    };
  } catch (error) {
    console.error('Error en checkout:', error);
    checkoutState.isProcessing = false;

    return {
      success: false,
      error: 'Error procesando el pedido. Intenta nuevamente.'
    };
  }
}

/**
 * Enviar pedido por WhatsApp
 * @param {Object} formData - Datos del formulario
 * @returns {Promise<Object>} Resultado del envío
 */
export async function sendOrderToWhatsapp(formData) {
  const result = await processCheckout(formData);

  if (result.success) {
    // Abrir WhatsApp en nueva pestaña
    window.open(result.whatsappURL, '_blank');
    return { success: true, order: result.order };
  }

  return result;
}

// ========================================
// GESTIONAR ÓRDENES
// ========================================

/**
 * Crear objeto de orden
 * @param {Object} customerData - Datos del cliente
 * @param {Array} items - Items de la orden
 * @param {number} total - Total de la orden
 * @returns {Object} Objeto de orden
 */
export function createOrder(customerData, items, total) {
  return {
    id: generateOrderId(),
    timestamp: new Date().toISOString(),
    customer: {
      name: customerData.name,
      phone: customerData.phone,
      address: customerData.address,
      city: customerData.city
    },
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      size: item.size || null
    })),
    total,
    status: 'pending', // pending, confirmed, delivered, cancelled
    paymentMethod: 'cash_on_delivery'
  };
}

/**
 * Generar ID único de orden
 * @returns {string}
 */
export function generateOrderId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Guardar orden en historial
 * @param {Object} order - Orden a guardar
 * @returns {void}
 */
export function saveOrderToHistory(order) {
  const orders = getOrderHistory();
  orders.push(order);
  localStorage.setItem('emiluxe_orders', JSON.stringify(orders));
  console.log('✓ Orden guardada en historial:', order.id);
}

/**
 * Obtener historial de órdenes
 * @returns {Array}
 */
export function getOrderHistory() {
  const saved = localStorage.getItem('emiluxe_orders');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.warn('Error cargando órdenes:', error);
      return [];
    }
  }
  return [];
}

/**
 * Obtener orden por ID
 * @param {string} orderId - ID de la orden
 * @returns {Object|null}
 */
export function getOrderById(orderId) {
  const orders = getOrderHistory();
  return orders.find(order => order.id === orderId) || null;
}

/**
 * Obtener última orden
 * @returns {Object|null}
 */
export function getLastOrder() {
  return checkoutState.lastOrder;
}

/**
 * Actualizar estado de orden
 * @param {string} orderId - ID de la orden
 * @param {string} newStatus - Nuevo estado
 * @returns {boolean}
 */
export function updateOrderStatus(orderId, newStatus) {
  const orders = getOrderHistory();
  const orderIndex = orders.findIndex(o => o.id === orderId);

  if (orderIndex === -1) return false;

  orders[orderIndex].status = newStatus;
  localStorage.setItem('emiluxe_orders', JSON.stringify(orders));

  return true;
}

// ========================================
// UTILIDADES
// ========================================

/**
 * Obtener resumen de orden
 * @param {Object} order - Orden
 * @returns {Object} Resumen
 */
export function getOrderSummary(order) {
  return {
    id: order.id,
    customer: order.customer.name,
    itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    total: order.total,
    status: order.status,
    date: new Date(order.timestamp).toLocaleDateString('es-CO')
  };
}

/**
 * Obtener estadísticas de órdenes
 * @returns {Object}
 */
export function getOrdersStats() {
  const orders = getOrderHistory();

  return {
    totalOrders: orders.length,
    totalSales: orders.reduce((sum, order) => sum + order.total, 0),
    averageOrder: orders.length > 0
      ? Math.round(orders.reduce((sum, order) => sum + order.total, 0) / orders.length)
      : 0,
    byStatus: {
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    }
  };
}

// ========================================
// EXPORT DEFAULT
// ========================================

export default {
  initWhatsappCheckout,
  validateCheckout,
  validateFormData,
  saveCheckoutFormData,
  loadCheckoutFormData,
  getFormData,
  updateFormField,
  generateWhatsappMessage,
  getWhatsappURL,
  processCheckout,
  sendOrderToWhatsapp,
  createOrder,
  generateOrderId,
  saveOrderToHistory,
  getOrderHistory,
  getOrderById,
  getLastOrder,
  updateOrderStatus,
  getOrderSummary,
  getOrdersStats
};
