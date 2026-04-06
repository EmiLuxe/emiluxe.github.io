// js/firebaseDB.js
import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ========================================
// PRODUCTS - FUNCIONES DE FIRESTORE
// ========================================

// Obtener todos los productos (una sola vez)
export async function getAllProducts() {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    const products = [];
    snapshot.forEach(doc => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    console.log('✓ Productos cargados:', products.length);
    return products;
  } catch (error) {
    console.error('✗ Error obteniendo productos:', error);
    return [];
  }
}

// Escuchar cambios en REAL-TIME (para admin)
export function listenToProducts(callback) {
  try {
    const productsRef = collection(db, 'products');
    
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const products = [];
      snapshot.forEach(doc => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(products);
    }, (error) => {
      console.error('Error en listener:', error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error configurando listener:', error);
  }
}

// Obtener productos por categoría
export async function getProductsByCategory(category) {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('category', '==', category));
    const snapshot = await getDocs(q);
    const products = [];
    snapshot.forEach(doc => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return products;
  } catch (error) {
    console.error('Error obteniendo productos por categoría:', error);
    return [];
  }
}

// Agregar producto
export async function addProduct(product) {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      name: product.name,
      description: product.description,
      price: parseInt(product.price),
      image: product.image,
      category: product.category.toLowerCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('✓ Producto agregado con ID:', docRef.id);
    return {
      id: docRef.id,
      ...product
    };
  } catch (error) {
    console.error('✗ Error agregando producto:', error);
    throw error;
  }
}

// Actualizar producto
export async function updateProduct(productId, updatedData) {
  try {
    const productRef = doc(db, 'products', productId);
    
    const dataToUpdate = {
      name: updatedData.name,
      description: updatedData.description,
      price: parseInt(updatedData.price),
      updatedAt: new Date().toISOString()
    };

    // Solo actualizar imagen si se proporciona
    if (updatedData.image) {
      dataToUpdate.image = updatedData.image;
    }

    await updateDoc(productRef, dataToUpdate);
    console.log('✓ Producto actualizado:', productId);
    return true;
  } catch (error) {
    console.error('✗ Error actualizando producto:', error);
    throw error;
  }
}

// Eliminar producto
export async function deleteProduct(productId) {
  try {
    await deleteDoc(doc(db, 'products', productId));
    console.log('✓ Producto eliminado:', productId);
    return true;
  } catch (error) {
    console.error('✗ Error eliminando producto:', error);
    throw error;
  }
}

// ========================================
// ORDERS - FUNCIONES
// ========================================

// Obtener todas las órdenes
export async function getAllOrders() {
  try {
    const ordersRef = collection(db, 'orders');
    const snapshot = await getDocs(ordersRef);
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    // Ordenar por fecha descendente
    return orders.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    return [];
  }
}

// Crear orden
export async function createOrder(order) {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      orderId: order.orderId,
      date: order.date,
      phoneNumber: order.phoneNumber,
      total: order.total,
      items: order.items,
      status: 'Pendiente de Confirmación',
      createdAt: new Date().toISOString()
    });
    return {
      id: docRef.id,
      ...order
    };
  } catch (error) {
    console.error('Error creando orden:', error);
    throw error;
  }
}

// Actualizar estado de orden
export async function updateOrderStatus(orderId, status) {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: status,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error actualizando orden:', error);
    throw error;
  }
}

// Eliminar orden
export async function deleteOrderDB(orderId) {
  try {
    await deleteDoc(doc(db, 'orders', orderId));
    return true;
  } catch (error) {
    console.error('Error eliminando orden:', error);
    throw error;
  }
}

// Obtener órdenes por teléfono
export async function getOrdersByPhone(phoneNumber) {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('phoneNumber', '==', phoneNumber));
    const snapshot = await getDocs(q);
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return orders;
  } catch (error) {
    console.error('Error obteniendo órdenes por teléfono:', error);
    return [];
  }
}
