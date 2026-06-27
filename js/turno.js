import {
  db, collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, onSnapshot, serverTimestamp, Timestamp
} from './firebase-init.js';
import { aggregateProductStats } from './products.js';
import { nowDateStr, nowTimeStr, formatDuration } from './utils.js';

const TURNOS = 'turnos';

export async function getTurnoAbierto() {
  const q = query(collection(db, TURNOS), where('status', '==', 'abierto'));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export function subscribeTurnoAbierto(callback) {
  const q = query(collection(db, TURNOS), where('status', '==', 'abierto'));
  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null);
      return;
    }
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    docs.sort((a, b) => (a.fechaInicio?.seconds || 0) - (b.fechaInicio?.seconds || 0));
    callback(docs[0]);
  });
}

export async function iniciarTurno() {
  const existing = await getTurnoAbierto();
  if (existing) return existing;

  const now = new Date();
  const data = {
    status: 'abierto',
    fecha: nowDateStr(),
    fechaInicio: Timestamp.fromDate(now),
    horaInicio: nowTimeStr(),
    ventasTotales: 0,
    totalEfectivo: 0,
    totalTransferencia: 0,
    productosVendidos: {},
    coctelesVendidos: {},
    createdAt: serverTimestamp()
  };

  const ref = await addDoc(collection(db, TURNOS), data);

  const abiertos = await getDocs(query(collection(db, TURNOS), where('status', '==', 'abierto')));
  if (abiertos.docs.length > 1) {
    const sorted = abiertos.docs.sort(
      (a, b) => (a.data().fechaInicio?.seconds || 0) - (b.data().fechaInicio?.seconds || 0)
    );
    const principal = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      await deleteDoc(doc(db, TURNOS, sorted[i].id));
    }
    if (principal.id !== ref.id) {
      return { id: principal.id, ...principal.data() };
    }
  }

  return { id: ref.id, ...data };
}

export function subscribeTurno(turnoId, callback) {
  return onSnapshot(doc(db, TURNOS, turnoId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

export async function getAllTurnosFinalizados() {
  const q = query(collection(db, TURNOS), where('status', '==', 'finalizado'));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.fechaInicio?.seconds || 0) - (a.fechaInicio?.seconds || 0));
}

export async function getTurnoByDate(dateStr) {
  const q = query(collection(db, TURNOS), where('fecha', '==', dateStr), where('status', '==', 'finalizado'));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function finalizarTurno(turnoId, cuentas) {
  const pendientes = cuentas.filter((c) => c.estado === 'pendiente');
  if (pendientes.length > 0) {
    throw new Error(`Hay ${pendientes.length} cuenta(s) pendiente(s)`);
  }

  const pagadas = cuentas.filter((c) => c.estado === 'pagada');
  let ventasTotales = 0;
  let totalEfectivo = 0;
  let totalTransferencia = 0;

  for (const c of pagadas) {
    ventasTotales += c.total || 0;
    if (c.metodoPago === 'efectivo') totalEfectivo += c.total || 0;
    if (c.metodoPago === 'transferencia') totalTransferencia += c.total || 0;
  }

  const allProducts = pagadas.flatMap((c) => c.productos || []);
  const { productosVendidos, coctelesVendidos } = aggregateProductStats(allProducts);

  const turnoRef = doc(db, TURNOS, turnoId);
  let fechaInicio = new Date();
  const turnoDoc = await getDoc(turnoRef);
  if (turnoDoc.exists() && turnoDoc.data().fechaInicio) {
    fechaInicio = turnoDoc.data().fechaInicio.toDate();
  }

  const now = new Date();
  const duracionMs = now - fechaInicio;

  await updateDoc(turnoRef, {
    status: 'finalizado',
    fechaFin: Timestamp.fromDate(now),
    horaFin: nowTimeStr(),
    duracionMs,
    duracion: formatDuration(duracionMs),
    ventasTotales,
    totalEfectivo,
    totalTransferencia,
    productosVendidos,
    coctelesVendidos,
    cuentasSnapshot: pagadas.map((c) => ({
      nombre: c.nombre,
      fecha: c.fecha,
      hora: c.hora,
      estado: c.estado,
      metodoPago: c.metodoPago,
      productos: c.productos,
      total: c.total
    })),
    productosSnapshot: allProducts,
    cantidadCuentas: pagadas.length,
    updatedAt: serverTimestamp()
  });
}

export function calcTurnoTotalFromCuentas(cuentas) {
  return cuentas
    .filter((c) => c.estado === 'pagada')
    .reduce((sum, c) => sum + (c.total || 0), 0);
}
