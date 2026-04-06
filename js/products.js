// ========================================
// EMILUXE - PRODUCTS DATA
// ========================================

let productsCache = [];
let isLoadingProducts = false;

// Productos por defecto (fallback si Firebase no carga)
const defaultProducts = [
  {
    id: 1,
    name: 'Pijama Elegante Rosa',
    description: 'Pijama de seda con encaje delicado',
    price: 89990,
    image: 'assets/images/products/pijamas/producto1.jpg',
    category: 'Pijamas'
  },
  {
    id: 2,
    name: 'Body Pijama Rosa Pastel',
    description: 'Body cómodo y elegante para dormir',
    price: 69990,
    image: 'assets/images/products/pijamas/producto2.jpg',
    category: 'Pijamas'
  },
  {
    id: 3,
    name: 'Pijama Coquette Blanco',
    description: 'Pijama romántico con detalles en encaje',
    price: 79990,
    image: 'assets/images/products/pijamas/producto3.jpg',
    category: 'Pijamas'
  },
  {
    id: 4,
    name: 'Pijama Satén Premium',
    description: 'Pijama de satén para máximo confort',
    price: 99990,
    image: 'assets/images/products/pijamas/producto4.jpg',
    category: 'Pijamas'
  },
  {
    id: 5,
    name: 'Pijama Floral Rosa',
    description: 'Pijama con estampado floral delicado',
    price: 85990,
    image: 'assets/images/products/pijamas/producto5.jpg',
    category: 'Pijamas'
  },
  {
    id: 6,
    name: 'Pijama Beige Minimalista',
    description: 'Diseño minimalista y cómodo',
    price: 74990,
    image: 'assets/images/products/pijamas/producto6.jpg',
    category: 'Pijamas'
  }
];

// ========================================
// CARGAR PRODUCTOS DESDE FIREBASE
// ========================================

export async function loadProductsFromFirebase() {
  if (isLoadingProducts) return productsCache;
  
  isLoadingProducts = true;
  
  try {
    const { db } = await import('./firebase-config.js');
    const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js");
    
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    
    productsCache = [];
    snapshot.forEach(doc => {
      productsCache.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log('Productos cargados de Firebase:', productsCache.length);
    isLoadingProducts = false;
    return productsCache;
  } catch (error) {
    console.error('Error cargando productos de Firebase:', error);
    // Usar productos por defecto si Firebase falla
    productsCache = defaultProducts;
    isLoadingProducts = false;
    return productsCache;
  }
}

// ========================================
// GET PRODUCTS - FUNCIONES PRINCIPALES
// ========================================

export async function getAllProducts() {
  if (productsCache.length === 0) {
    await loadProductsFromFirebase();
  }
  return productsCache;
}

export async function getProductsByCategory(category) {
  const allProducts = await getAllProducts();
  return allProducts.filter(product => product.category === category);
}

export function getCategories() {
  return ['Pijamas', 'Lencería', 'Ropa casual'];
}

export async function getProductById(id) {
  const allProducts = await getAllProducts();
  return allProducts.find(product => product.id === id);
}

export async function getAllProductsIncludingCustom() {
  return await getAllProducts();
}

// ========================================
// ADD PRODUCT - AGREGAR PRODUCTO
// ========================================

export async function addProduct(product) {
  try {
    const { db } = await import('./firebase-config.js');
    const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js");
    
    const docRef = await addDoc(collection(db, 'products'), {
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      createdAt: new Date()
    });
    
    const newProduct = {
      id: docRef.id,
      ...product
    };
    
    productsCache.push(newProduct);
    return newProduct;
  } catch (error) {
    console.error('Error agregando producto:', error);
    throw error;
  }
}

// ========================================
// UPDATE PRODUCT - ACTUALIZAR PRODUCTO
// ========================================

export async function updateProduct(id, updatedData) {
  try {
    const { db } = await import('./firebase-config.js');
    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js");
    
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, {
      name: updatedData.name,
      description: updatedData.description,
      price: updatedData.price,
      image: updatedData.image || undefined,
      updatedAt: new Date()
    });
    
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

// ========================================
// DELETE PRODUCT - ELIMINAR PRODUCTO
// ========================================

export async function deleteProduct(id) {
  try {
    const { db } = await import('./firebase-config.js');
    const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js");
    
    await deleteDoc(doc(db, 'products', id));
    
    // Eliminar del caché
    productsCache = productsCache.filter(p => p.id !== id);
    
    return true;
  } catch (error) {
    console.error('Error eliminando producto:', error);
    throw error;
  }
}

// ========================================
// FUNCIONES LEGADAS (para compatibilidad)
// ========================================

export function getCategories_Sync() {
  return ['Pijamas', 'Lencería', 'Ropa casual'];
}

export function getDefaultProducts() {
  return defaultProducts;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadProductsFromFirebase,
    getAllProducts,
    getProductsByCategory,
    getCategories,
    getProductById,
    addProduct,
    getAllProductsIncludingCustom,
    updateProduct,
    deleteProduct,
    getDefaultProducts
  };
}