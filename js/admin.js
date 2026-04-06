// ========================================
// EMILUXE - ADMIN PANEL (ADD & EDIT MODE)
// ========================================

let editingProductId = null;
let currentMode = 'add';
let availableImages = [];
let selectedImagePath = '';

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
  loadAvailableImages();
  loadProductsToSelect();
  loadAdminProducts();
  setupFormHandlers();
});

// Check if user is authenticated
function checkAdminAuth() {
  const isAuthenticated = localStorage.getItem('emiluxe_admin_logged_in');
  if (!isAuthenticated) {
    window.location.href = 'login.html';
  }
}

// Switch between add and edit mode
function switchMode(mode) {
  currentMode = mode;
  const addModeDiv = document.getElementById('addMode');
  const editModeDiv = document.getElementById('editMode');
  
  if (mode === 'add') {
    addModeDiv.style.display = 'block';
    editModeDiv.style.display = 'none';
    clearForm();
    document.getElementById('submitBtn').textContent = 'Agregar Producto';
  } else {
    addModeDiv.style.display = 'none';
    editModeDiv.style.display = 'block';
    clearForm();
    document.getElementById('submitBtn').textContent = 'Guardar Cambios';
  }
}

// Load available images from pijamas folder
function loadAvailableImages() {
  // Simular carga de imágenes disponibles
  // En un entorno real, esto vendría del servidor
  const pijamasFolder = 'assets/images/products/pijamas/';
  
  // Images que sabemos que están disponibles
  const imageList = [
    'producto1.jpg',
    'producto2.jpg',
    'producto3.jpg',
    'producto4.jpg',
    'producto5.jpg',
    'producto6.jpg',
    'producto7.jpg',
    'producto8.jpg',
    'producto9.jpg',
    'producto10.jpg'
  ];

  availableImages = imageList.map(img => ({
    name: img,
    path: pijamasFolder + img
  }));

  updateImageSelect();
}

// Update image select dropdown
function updateImageSelect() {
  const imageSelect = document.getElementById('imageSelect');
  
  imageSelect.innerHTML = '<option value="">Selecciona una imagen...</option>' +
    availableImages.map(img => `
      <option value="${img.path}">${img.name.replace('.jpg', '').replace('.png', '')}</option>
    `).join('');
}

// Update image preview
function updateImagePreview() {
  const imageSelect = document.getElementById('imageSelect');
  const preview = document.getElementById('previewImage');
  
  selectedImagePath = imageSelect.value;
  
  if (selectedImagePath) {
    preview.src = selectedImagePath;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
}

// Load products into select dropdown for edit mode
function loadProductsToSelect() {
  const allProducts = getAllProductsIncludingCustom();
  const productSelect = document.getElementById('productSelect');

  productSelect.innerHTML = '<option value="">Elige un producto...</option>' + 
    allProducts.map(product => `
      <option value="${product.id}">${product.name}</option>
    `).join('');
}

// Load product data into form for editing
function loadProductData() {
  const productSelect = document.getElementById('productSelect');
  const productId = productSelect.value;

  if (!productId) {
    clearForm();
    return;
  }

  const allProducts = getAllProductsIncludingCustom();
  const product = allProducts.find(p => p.id == productId);

  if (product) {
    editingProductId = parseInt(productId);
    document.getElementById('name').value = product.name;
    document.getElementById('description').value = product.description;
    document.getElementById('price').value = product.price;
    
    // Show current image
    const preview = document.getElementById('previewImage');
    preview.src = product.image;
    preview.style.display = 'block';
    selectedImagePath = product.image;
  }
}

// Setup form event handlers
function setupFormHandlers() {
  const form = document.getElementById('productForm');
  if (!form) return;

  const submitBtn = form.querySelector('.btn-primary');
  const resetBtn = form.querySelector('.btn-secondary');

  submitBtn.addEventListener('click', handleFormSubmit);
  resetBtn.addEventListener('click', clearForm);
}

// Handle form submission
function handleFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const description = document.getElementById('description').value.trim();
  const price = parseFloat(document.getElementById('price').value);

  // Validate form
  if (!name || !description || !price) {
    showNotification('Por favor completa todos los campos', 'error');
    return;
  }

  if (price <= 0) {
    showNotification('El precio debe ser mayor a 0', 'error');
    return;
  }

  if (currentMode === 'add') {
    // Agregar nuevo producto
    if (!selectedImagePath) {
      showNotification('Por favor selecciona una imagen', 'error');
      return;
    }

    const newProduct = {
      name,
      description,
      price,
      image: selectedImagePath,
      category: 'Pijamas'
    };

    addProduct(newProduct);
    showNotification('Producto agregado exitosamente', 'success');
  } else {
    // Editar producto existente
    if (!editingProductId) {
      showNotification('Por favor selecciona un producto', 'error');
      return;
    }

    const product = {
      name,
      description,
      price
    };

    // Solo actualizar imagen si se cambió
    if (selectedImagePath) {
      product.image = selectedImagePath;
    }

    updateProduct(editingProductId, product);
    showNotification('Producto actualizado exitosamente', 'success');
  }

  clearForm();
  loadProductsToSelect();
  loadAdminProducts();
}

// Clear form
function clearForm() {
  const form = document.getElementById('productForm');
  if (form) {
    form.reset();
  }
  editingProductId = null;
  selectedImagePath = '';
  
  const preview = document.getElementById('previewImage');
  preview.style.display = 'none';
  preview.src = '';
  
  const imageSelect = document.getElementById('imageSelect');
  if (imageSelect) {
    imageSelect.value = '';
  }
}

// Load and display admin products
function loadAdminProducts() {
  const productsList = document.getElementById('productsList');
  if (!productsList) return;

  const allProducts = getAllProductsIncludingCustom();

  if (allProducts.length === 0) {
    productsList.innerHTML = '<p style="text-align: center; color: #999;">No hay productos aún. ¡Agrega uno!</p>';
    return;
  }

  productsList.innerHTML = allProducts.map(product => `
    <div class="admin-product-item">
      <img src="${product.image}" alt="${product.name}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;">
      <div class="admin-product-info">
        <div class="admin-product-name">${product.name}</div>
        <div class="admin-product-price">${formatPrice(product.price)}</div>
      </div>
      <div class="admin-product-actions">
        <button class="btn-edit" onclick="selectProductToEdit(${product.id})">Editar</button>
        <button class="btn-delete" onclick="deleteProductConfirm(${product.id})">Eliminar</button>
      </div>
    </div>
  `).join('');
}

// Select product to edit
function selectProductToEdit(id) {
  // Cambiar a modo edit
  document.querySelector('input[name="mode"][value="edit"]').checked = true;
  switchMode('edit');
  
  const productSelect = document.getElementById('productSelect');
  productSelect.value = id;
  loadProductData();
  document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
}

// Delete product with confirmation
function deleteProductConfirm(id) {
  if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
    deleteProduct(id);
    loadAdminProducts();
    loadProductsToSelect();
    showNotification('Producto eliminado exitosamente', 'success');
  }
}

// Logout
function logoutAdmin() {
  localStorage.removeItem('emiluxe_admin_logged_in');
  window.location.href = 'login.html';
}

// Add logout button listener
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.querySelector('[onclick="logoutAdmin()"]');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutAdmin);
  }
});