import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ========================================
// PRODUCTS - FUNCIONES
// ========================================

// Obtener todos los productos
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
    return products;
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    return [];
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
      price: product.price,
      image: product.image,
      category: product.category,
      createdAt: new Date()
    });
    return {
      id: docRef.id,
      ...product
    };
  } catch (error) {
    console.error('Error agregando producto:', error);
    throw error;
  }
}

// Actualizar producto
export async function updateProductDB(productId, updatedData) {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      name: updatedData.name,
      description: updatedData.description,
      price: updatedData.price,
      image: updatedData.image || undefined,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error actualizando producto:', error);
    throw error;
  }
}

// Eliminar producto
export async function deleteProductDB(productId) {
  try {
    await deleteDoc(doc(db, 'products', productId));
    return true;
  } catch (error) {
    console.error('Error eliminando producto:', error);
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
      createdAt: new Date()
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
      updatedAt: new Date()
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