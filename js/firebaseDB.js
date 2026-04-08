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
  orderBy,
  limit,
  onSnapshot,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ========================================
// PRODUCTS - FUNCIONES DE FIRESTORE
// ========================================

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

export function listenToProducts(callback) {
  try {
    const productsRef = collection(db, 'products');
    
    const unsubscribe = onSnapshot(
      productsRef,
      (snapshot) => {
        const products = [];
        snapshot.forEach(doc => {
          products.push({
            id: doc.id,
            ...doc.data()
          });
        });
        console.log('🔄 Productos actualizados en tiempo real:', products.length);
        callback(products);
      },
      (error) => {
        console.error('✗ Error en listener de productos:', error);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('✗ Error configurando listener de productos:', error);
    return null;
  }
}

export async function getProductsByCategory(category) {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('category', '==', category.toLowerCase())
    );
    
    const snapshot = await getDocs(q);
    const products = [];
    
    snapshot.forEach(doc => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✓ Productos de ${category}:`, products.length);
    return products;
  } catch (error) {
    console.error('✗ Error obteniendo productos por categoría:', error);
    return [];
  }
}

export async function getProductById(productId) {
  try {
    const docRef = doc(db, 'products', productId);
    const snapshot = await getDocs(collection(db, 'products'));
    
    let found = null;
    snapshot.forEach(doc => {
      if (doc.id === productId) {
        found = {
          id: doc.id,
          ...doc.data()
        };
      }
    });
    
    return found;
  } catch (error) {
    console.error('✗ Error obteniendo producto por ID:', error);
    return null;
  }
}

export async function addProduct(product) {
  try {
    console.log('📝 Agregando producto:', product.name);
    
    const docRef = await addDoc(collection(db, 'products'), {
      name: product.name,
      description: product.description,
      price: parseInt(product.price),
      image: product.image,
      category: product.category.toLowerCase(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log('✓ Producto agregado con ID:', docRef.id);
    
    return {
      id: docRef.id,
      ...product,
      price: parseInt(product.price),
      category: product.category.toLowerCase()
    };
  } catch (error) {
    console.error('✗ Error agregando producto:', error);
    throw error;
  }
}

export async function updateProduct(productId, updatedData) {
  try {
    console.log('📝 Actualizando producto:', productId);
    
    const productRef = doc(db, 'products', productId);
    
    const dataToUpdate = {
      updatedAt: Timestamp.now()
    };

    if (updatedData.name) dataToUpdate.name = updatedData.name;
    if (updatedData.description) dataToUpdate.description = updatedData.description;
    if (updatedData.price) dataToUpdate.price = parseInt(updatedData.price);
    if (updatedData.image) dataToUpdate.image = updatedData.image;
    if (updatedData.category) dataToUpdate.category = updatedData.category.toLowerCase();

    await updateDoc(productRef, dataToUpdate);
    
    console.log('✓ Producto actualizado:', productId);
    return true;
  } catch (error) {
    console.error('✗ Error actualizando producto:', error);
    throw error;
  }
}

export async function deleteProduct(productId) {
  try {
    console.log('🗑️ Eliminando producto:', productId);
    
    await deleteDoc(doc(db, 'products', productId));
    
    console.log('✓ Producto eliminado:', productId);
    return true;
  } catch (error) {
    console.error('✗ Error eliminando producto:', error);
    throw error;
  }
}

export async function getRecentProducts(limitCount = 6) {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
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
    console.error('✗ Error obteniendo productos recientes:', error);
    return [];
  }
}

// ========================================
// ORDERS - FUNCIONES
// ========================================

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
    
    return orders.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('✗ Error obteniendo órdenes:', error);
    return [];
  }
}

export function listenToOrders(callback) {
  try {
    const ordersRef = collection(db, 'orders');
    
    const unsubscribe = onSnapshot(
      ordersRef,
      (snapshot) => {
        const orders = [];
        snapshot.forEach(doc => {
          orders.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        orders.sort((a, b) => {
          const dateA = new Date(a.date || 0);
          const dateB = new Date(b.date || 0);
          return dateB - dateA;
        });
        
        console.log('🔄 Órdenes actualizadas en tiempo real:', orders.length);
        callback(orders);
      },
      (error) => {
        console.error('✗ Error en listener de órdenes:', error);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('✗ Error configurando listener de órdenes:', error);
    return null;
  }
}

/**
 * Crear orden en Firebase
 * @param {Object} order - Objeto de orden
 * @param {string} order.orderId - ID único de la orden
 * @param {string} order.date - Fecha de la orden
 * @param {string} order.phoneNumber - Número de teléfono del cliente
 * @param {string} order.customerName - Nombre del cliente (IMPORTANTE: debe venir del cuestionario)
 * @param {number} order.total - Total de la orden
 * @param {Array} order.items - Items de la orden
 * @param {string} order.status - Estado de la orden
 * @returns {Promise<Object>} Orden creada
 */
export async function createOrder(order) {
  try {
    console.log('📝 Creando orden:', order.orderId);
    
    // Validar que customerName existe, sino usar "Cliente"
    const customerName = order.customerName && order.customerName.trim() !== '' 
      ? order.customerName 
      : 'Cliente';
    
    const docRef = await addDoc(collection(db, 'orders'), {
      orderId: order.orderId,
      date: order.date,
      phoneNumber: order.phoneNumber,
      customerName: customerName, // ✅ AGREGADO: Guardar nombre del cliente
      total: order.total,
      items: order.items,
      status: order.status || 'Pendiente de Confirmación',
      createdAt: Timestamp.now()
    });
    
    console.log('✓ Orden creada con ID:', docRef.id);
    console.log('✓ Cliente registrado como:', customerName);
    
    return {
      id: docRef.id,
      ...order,
      customerName: customerName // Retornar con el nombre garantizado
    };
  } catch (error) {
    console.error('✗ Error creando orden:', error);
    throw error;
  }
}

export async function updateOrderStatus(orderId, status) {
  try {
    console.log('📝 Actualizando estado de orden:', orderId);
    
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: status,
      updatedAt: Timestamp.now()
    });
    
    console.log('✓ Estado de orden actualizado:', status);
    return true;
  } catch (error) {
    console.error('✗ Error actualizando estado de orden:', error);
    throw error;
  }
}

/**
 * Actualizar información de la orden (incluyendo nombre del cliente)
 * @param {string} orderId - ID de la orden
 * @param {Object} updatedData - Datos a actualizar
 * @returns {Promise<boolean>} true si se actualizó
 */
export async function updateOrderInfo(orderId, updatedData) {
  try {
    console.log('📝 Actualizando información de orden:', orderId);
    
    const orderRef = doc(db, 'orders', orderId);
    
    const dataToUpdate = {
      updatedAt: Timestamp.now()
    };

    if (updatedData.customerName) dataToUpdate.customerName = updatedData.customerName;
    if (updatedData.status) dataToUpdate.status = updatedData.status;
    if (updatedData.phoneNumber) dataToUpdate.phoneNumber = updatedData.phoneNumber;
    if (updatedData.total) dataToUpdate.total = updatedData.total;

    await updateDoc(orderRef, dataToUpdate);
    
    console.log('✓ Información de orden actualizada:', orderId);
    return true;
  } catch (error) {
    console.error('✗ Error actualizando información de orden:', error);
    throw error;
  }
}

export async function deleteOrderDB(orderId) {
  try {
    console.log('🗑️ Eliminando orden:', orderId);
    
    await deleteDoc(doc(db, 'orders', orderId));
    
    console.log('✓ Orden eliminada:', orderId);
    return true;
  } catch (error) {
    console.error('✗ Error eliminando orden:', error);
    throw error;
  }
}

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
    
    return orders.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('✗ Error obteniendo órdenes por teléfono:', error);
    return [];
  }
}

export async function getPendingOrders() {
  try {
    const ordersRef = collection(db, 'orders');
    const snapshot = await getDocs(ordersRef);
    const orders = [];
    
    snapshot.forEach(doc => {
      const order = doc.data();
      if (!order.status || !order.status.includes('Confirmada')) {
        orders.push({
          id: doc.id,
          ...order
        });
      }
    });
    
    return orders.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('✗ Error obteniendo órdenes pendientes:', error);
    return [];
  }
}

export async function getConfirmedOrders() {
  try {
    const ordersRef = collection(db, 'orders');
    const snapshot = await getDocs(ordersRef);
    const orders = [];
    
    snapshot.forEach(doc => {
      const order = doc.data();
      if (order.status && order.status.includes('Confirmada')) {
        orders.push({
          id: doc.id,
          ...order
        });
      }
    });
    
    return orders.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('✗ Error obteniendo órdenes confirmadas:', error);
    return [];
  }
}

// ========================================
// EXPORT DEFAULT
// ========================================

export default {
  getAllProducts,
  listenToProducts,
  getProductsByCategory,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getRecentProducts,
  getAllOrders,
  listenToOrders,
  createOrder,
  updateOrderStatus,
  updateOrderInfo,
  deleteOrderDB,
  getOrdersByPhone,
  getPendingOrders,
  getConfirmedOrders
};
