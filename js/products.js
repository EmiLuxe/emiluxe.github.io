// ========================================
// EMILUXE - PRODUCTS (FIRESTORE)
// ========================================

import { getAllProducts as getAllProductsFromDB } from './firebaseDB.js';

let productsCache = [];
let isLoadingProducts = false;

// Cargar productos de Firestore
export async function loadProductsFromFirebase() {
  if (isLoadingProducts) return productsCache;
  
  isLoadingProducts = true;
  
  try {
    console.log('Cargando productos de Firestore...');
    productsCache = await getAllProductsFromDB();
    console.log(`✓ ${productsCache.length} productos cargados`);
    isLoadingProducts = false;
    return productsCache;
  } catch (error) {
    console.error('Error cargando productos:', error);
    isLoadingProducts = false;
    return [];
  }
}

// Obtener todos los productos (con caché)
export async function getAllProducts() {
  if (productsCache.length === 0) {
    await loadProductsFromFirebase();
  }
  return productsCache;
}

// Obtener productos por categoría
export async function getProductsByCategory(category) {
  const allProducts = await getAllProducts();
  return allProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
}

// Obtener categorías disponibles
export function getCategories() {
  return ['pijamas', 'lenceria', 'casual'];
}

// Obtener producto por ID
export async function getProductById(id) {
  const allProducts = await getAllProducts();
  return allProducts.find(p => p.id === id);
}

// Agregar producto (desde admin)
export async function addProduct(product) {
  try {
    const { addProduct: addProductDB } = await import('./firebaseDB.js');
    const newProduct = await addProductDB(product);
    
    // Actualizar caché
    productsCache.push(newProduct);
    
    return newProduct;
  } catch (error) {
    console.error('Error agregando producto:', error);
    throw error;
  }
}

// Actualizar producto (desde admin)
export async function updateProduct(id, updatedData) {
  try {
    const { updateProduct: updateProductDB } = await import('./firebaseDB.js');
    await updateProductDB(id, updatedData);
    
    // Actualizar caché
    const index = productsCache.findIndex(p => p.id === id);
    if (index !== -1) {
      productsCache[index] = { 
        id: id, 
        ...productsCache[index], 
        ...updatedData 
      };
    }
    
    return true;
  } catch (error) {
    console.error('Error actualizando producto:', error);
    throw error;
  }
}

// Eliminar producto (desde admin)
export async function deleteProduct(id) {
  try {
    const { deleteProduct: deleteProductDB } = await import('./firebaseDB.js');
    await deleteProductDB(id);
    
    // Actualizar caché
    productsCache = productsCache.filter(p => p.id !== id);
    
    return true;
  } catch (error) {
    console.error('Error eliminando producto:', error);
    throw error;
  }
}

// Actualizar caché manualmente
export function updateProductsCache(newProducts) {
  productsCache = newProducts;
}

// Limpiar caché
export function clearProductsCache() {
  productsCache = [];
}
