import {
  db, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp
} from './firebase-init.js';
import { calcCuentaTotal, nowDateStr, nowTimeStr, uuid, recalcProductoLine } from './utils.js';

export function cuentasRef(turnoId) {
  return collection(db, 'turnos', turnoId, 'cuentas');
}

export function subscribeCuentas(turnoId, callback) {
  return onSnapshot(cuentasRef(turnoId), (snap) => {
    const cuentas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cuentas.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(cuentas);
  });
}

export async function crearCuenta(turnoId, nombre) {
  const now = new Date();
  const data = {
    nombre: nombre.trim(),
    fecha: nowDateStr(),
    hora: nowTimeStr(),
    estado: 'pendiente',
    metodoPago: null,
    productos: [],
    total: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(cuentasRef(turnoId), data);
  return { id: ref.id, ...data };
}

export async function updateCuenta(turnoId, cuentaId, updates) {
  await updateDoc(doc(db, 'turnos', turnoId, 'cuentas', cuentaId), {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function agregarProducto(turnoId, cuentaId, producto, productosActuales) {
  const line = recalcProductoLine({ ...producto, id: uuid() });
  const productos = [...productosActuales, line];
  await updateCuenta(turnoId, cuentaId, {
    productos,
    total: calcCuentaTotal(productos)
  });
}

export async function editarProducto(turnoId, cuentaId, productoId, updates, productosActuales) {
  const productos = productosActuales.map((p) => {
    if (p.id !== productoId) return p;
    return recalcProductoLine({ ...p, ...updates });
  });
  await updateCuenta(turnoId, cuentaId, {
    productos,
    total: calcCuentaTotal(productos)
  });
}

export async function eliminarProducto(turnoId, cuentaId, productoId, productosActuales) {
  const productos = productosActuales.filter((p) => p.id !== productoId);
  await updateCuenta(turnoId, cuentaId, {
    productos,
    total: calcCuentaTotal(productos)
  });
}

export async function cambiarCantidad(turnoId, cuentaId, productoId, delta, productosActuales) {
  const productos = productosActuales.map((p) => {
    if (p.id !== productoId) return p;
    return recalcProductoLine({ ...p, cantidad: (p.cantidad || 1) + delta });
  }).filter((p) => p.cantidad > 0);

  await updateCuenta(turnoId, cuentaId, {
    productos,
    total: calcCuentaTotal(productos)
  });
}

export async function cerrarCuenta(turnoId, cuentaId, opcion) {
  if (opcion === 'pendiente') {
    await updateCuenta(turnoId, cuentaId, { estado: 'pendiente', metodoPago: null });
    return;
  }
  await updateCuenta(turnoId, cuentaId, {
    estado: 'pagada',
    metodoPago: opcion
  });
}

export async function deleteCuenta(turnoId, cuentaId) {
  await deleteDoc(doc(db, 'turnos', turnoId, 'cuentas', cuentaId));
}
