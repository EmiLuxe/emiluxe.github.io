// ========================================
// EMILUXE - SIZE SELECTOR MODAL
// ========================================
// Modal para seleccionar talla antes de agregar al carrito

import { 
  hasSize, 
  isUniqueSizeProduct, 
  requiresSizeSelection,
  getSizesReadable,
  SIZE_OPTIONS 
} from './product-utils.js';
import { addProductToDrawer } from './cart-drawer.js';

// ========================================
// ESTADO DEL MODAL
// ========================================

let sizeModalState = {
  isOpen: false,
  currentProduct: null,
  selectedSize: null
};

// ========================================
// ABRIR MODAL DE SELECCIÓN DE TALLA
// ========================================

/**
 * Abrir modal para seleccionar talla
 * @param {Object} product - Producto
 * @returns {void}
 */
export function openSizeModal(product) {
  // Si el producto no requiere talla, agregar directo
  if (!requiresSizeSelection(product)) {
    addProductToDrawer(product, null, 1);
    showNotification(`${product.name} agregado al carrito 🛒`, 'success');
    return;
  }

  sizeModalState.currentProduct = product;
  sizeModalState.selectedSize = null;
  sizeModalState.isOpen = true;

  renderSizeModal(product);
}

/**
 * Cerrar modal de talla
 * @returns {void}
 */
export function closeSizeModal() {
  sizeModalState.isOpen = false;
  sizeModalState.currentProduct = null;
  sizeModalState.selectedSize = null;

  const modal = document.getElementById('sizeSelectModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// ========================================
// RENDERIZAR MODAL
// ========================================

/**
 * Renderizar contenido del modal
 * @param {Object} product - Producto
 * @returns {void}
 */
function renderSizeModal(product) {
  const modalHTML = createSizeModalHTML(product);
  
  let modal = document.getElementById('sizeSelectModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'sizeSelectModal';
    modal.className = 'size-select-modal';
    document.body.appendChild(modal);
  }

  modal.innerHTML = modalHTML;
  modal.style.display = 'flex';

  // Agregar estilos si no existen
  if (!document.getElementById('sizeSelectorStyles')) {
    addSizeModalStyles();
  }
}

/**
 * Crear HTML del modal
 * @param {Object} product - Producto
 * @returns {string}
 */
function createSizeModalHTML(product) {
  const sizes = product.sizes || [];
  const hasUnique = sizes.includes('UNIQUE');
  const isOnlyUnique = sizes.length === 1 && hasUnique;

  let sizeButtonsHTML = '';

  if (isOnlyUnique) {
    // Solo talla única - mostrar mensaje informativo
    sizeButtonsHTML = `
      <div class="size-info-message">
        <div class="size-info-icon">ℹ️</div>
        <p>Este producto solo está disponible en <strong>Talla Única</strong></p>
      </div>
    `;
  } else {
    // Mostrar botones de talla seleccionables
    sizeButtonsHTML = `
      <div class="size-buttons-grid">
        ${sizes.map(size => {
          const sizeOption = SIZE_OPTIONS.find(opt => opt.value === size);
          const label = sizeOption ? sizeOption.label : size;
          
          return `
            <button 
              type="button" 
              class="size-btn" 
              onclick="window.selectProductSize('${size}')"
              data-size="${size}"
            >
              ${label}
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  return `
    <div class="size-modal-overlay" onclick="window.closeSizeModal()"></div>
    <div class="size-modal-content">
      <button class="size-modal-close" onclick="window.closeSizeModal()">✕</button>
      
      <div class="size-modal-header">
        <img src="${product.image}" alt="${product.name}" class="size-modal-image" onerror="this.src='assets/images/placeholder.png'">
      </div>

      <div class="size-modal-body">
        <h2 class="size-modal-title">${product.name}</h2>
        <p class="size-modal-price">${formatPrice(product.price)}</p>

        <div class="size-selection-section">
          <label class="size-selection-label">Selecciona tu talla:</label>
          ${sizeButtonsHTML}
        </div>

        <button 
          type="button" 
          class="size-modal-add-btn" 
          onclick="window.confirmSizeSelection()"
          ${isOnlyUnique ? '' : 'disabled'}
          id="sizeConfirmBtn"
        >
          Agregar al Carrito
        </button>

        <div class="size-modal-info">
          <p>💳 Pago contra entrega</p>
          <p>🚚 Envío a todo Colombia</p>
        </div>
      </div>
    </div>
  `;
}

// ========================================
// MANEJAR SELECCIÓN
// ========================================

/**
 * Seleccionar talla
 * @param {string} size - Talla seleccionada
 * @returns {void}
 */
export function selectProductSize(size) {
  sizeModalState.selectedSize = size;

  // Actualizar UI
  const sizeBtns = document.querySelectorAll('.size-btn');
  sizeBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.size === size) {
      btn.classList.add('active');
    }
  });

  // Habilitar botón de confirmación
  const confirmBtn = document.getElementById('sizeConfirmBtn');
  if (confirmBtn) {
    confirmBtn.disabled = false;
  }
}

/**
 * Confirmar selección de talla y agregar al carrito
 * @returns {void}
 */
export function confirmSizeSelection() {
  const product = sizeModalState.currentProduct;
  const selectedSize = sizeModalState.selectedSize;

  if (!product) {
    showNotification('Error: Producto no encontrado', 'error');
    closeSizeModal();
    return;
  }

  // Si es talla única, usar UNIQUE
  const sizeToAdd = requiresSizeSelection(product) ? selectedSize : 'UNIQUE';

  if (requiresSizeSelection(product) && !selectedSize) {
    showNotification('Por favor selecciona una talla', 'error');
    return;
  }

  try {
    // Agregar al drawer del carrito
    addProductToDrawer(product, sizeToAdd, 1);
    
    showNotification(`${product.name} agregado al carrito 🛒`, 'success');
    closeSizeModal();

    // Abrir drawer automáticamente
    window.openDrawer();
  } catch (error) {
    console.error('Error agregando al carrito:', error);
    showNotification('Error al agregar al carrito', 'error');
  }
}

// ========================================
// ESTILOS CSS
// ========================================

/**
 * Agregar estilos del modal
 * @returns {void}
 */
function addSizeModalStyles() {
  const style = document.createElement('style');
  style.id = 'sizeSelectorStyles';
  style.textContent = `
    /* Size Modal Styles */
    .size-select-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2000;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    }

    .size-modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      cursor: pointer;
    }

    .size-modal-content {
      position: relative;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 0.3s ease;
    }

    .size-modal-close {
      position: absolute;
      top: 15px;
      right: 15px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
      z-index: 10;
      transition: color 0.2s;
    }

    .size-modal-close:hover {
      color: #333;
    }

    .size-modal-header {
      width: 100%;
      height: 250px;
      overflow: hidden;
      border-radius: 16px 16px 0 0;
      background: #f5f5f5;
    }

    .size-modal-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .size-modal-body {
      padding: 2rem 1.5rem;
    }

    .size-modal-title {
      font-size: 1.5rem;
      color: #333;
      margin: 0 0 0.5rem 0;
      font-weight: 700;
    }

    .size-modal-price {
      font-size: 1.3rem;
      color: #FF6B9D;
      font-weight: 800;
      margin: 0 0 1.5rem 0;
    }

    .size-selection-section {
      margin-bottom: 2rem;
    }

    .size-selection-label {
      display: block;
      font-weight: 600;
      color: #333;
      margin-bottom: 1rem;
      font-size: 1rem;
    }

    .size-buttons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 0.8rem;
      margin-bottom: 1rem;
    }

    .size-btn {
      padding: 0.8rem 1rem;
      border: 2px solid #ddd;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      color: #333;
      transition: all 0.2s ease;
      font-size: 0.9rem;
    }

    .size-btn:hover {
      border-color: #FF6B9D;
      background: #fff5f8;
      color: #FF6B9D;
    }

    .size-btn.active {
      background: linear-gradient(135deg, #FF6B9D 0%, #E63A7F 100%);
      color: white;
      border-color: #FF6B9D;
      box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
    }

    .size-info-message {
      background: #f0f8ff;
      border: 2px solid #b3d9ff;
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
      margin-bottom: 1rem;
    }

    .size-info-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .size-info-message p {
      color: #0066cc;
      margin: 0;
      font-weight: 500;
    }

    .size-modal-add-btn {
      width: 100%;
      padding: 0.9rem;
      background: linear-gradient(135deg, #FF6B9D 0%, #E63A7F 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
      margin-bottom: 1rem;
    }

    .size-modal-add-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(255, 107, 157, 0.4);
    }

    .size-modal-add-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #ccc;
    }

    .size-modal-info {
      background: #f9f9f9;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }

    .size-modal-info p {
      margin: 0.5rem 0;
      color: #666;
      font-size: 0.9rem;
    }

    @media (max-width: 480px) {
      .size-modal-content {
        width: 95%;
        max-height: 85vh;
      }

      .size-modal-body {
        padding: 1.5rem 1rem;
      }

      .size-buttons-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .size-modal-header {
        height: 200px;
      }
    }

    @keyframes slideUp {
      from {
        transform: translateY(30px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;

  document.head.appendChild(style);
}

// ========================================
// FUNCIONES GLOBALES
// ========================================

window.selectProductSize = selectProductSize;
window.confirmSizeSelection = confirmSizeSelection;
window.closeSizeModal = closeSizeModal;

// ========================================
// EXPORT DEFAULT
// ========================================

export default {
  openSizeModal,
  closeSizeModal,
  selectProductSize,
  confirmSizeSelection
};
