// ========================================
// EMILUXE - ORDERS MANAGEMENT
// ========================================

// Crear orden en Firebase
export async function createOrderInFirebase(order) {
  try {
    const { createOrder } = await import('./firebaseDB.js');
    const newOrder = await createOrder(order);
    return newOrder;
  } catch (error) {
    console.error('Error creando orden:', error);
    throw error;
  }
}

// Obtener todas las órdenes
export async function getAllOrdersFromFirebase() {
  try {
    const { getAllOrders } = await import('./firebaseDB.js');
    return await getAllOrders();
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    return [];
  }
}

// Actualizar estado de orden
export async function updateOrderStatusInFirebase(orderId, status) {
  try {
    const { updateOrderStatus } = await import('./firebaseDB.js');
    return await updateOrderStatus(orderId, status);
  } catch (error) {
    console.error('Error actualizando orden:', error);
    throw error;
  }
}

// Eliminar orden
export async function deleteOrderFromFirebase(orderId) {
  try {
    const { deleteOrderDB } = await import('./firebaseDB.js');
    return await deleteOrderDB(orderId);
  } catch (error) {
    console.error('Error eliminando orden:', error);
    throw error;
  }
}

// Obtener órdenes por teléfono
export async function getOrdersByPhoneFromFirebase(phoneNumber) {
  try {
    const { getOrdersByPhone } = await import('./firebaseDB.js');
    return await getOrdersByPhone(phoneNumber);
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    return [];
  }
}