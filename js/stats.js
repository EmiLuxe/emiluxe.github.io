import {
  db, collection, getDocs, query, where, Timestamp
} from './firebase-init.js';
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, formatCOP
} from './utils.js';

const TURNOS = 'turnos';

function tsToDate(ts) {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

export async function fetchTurnosFinalizados() {
  const q = query(collection(db, TURNOS), where('status', '==', 'finalizado'));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.fechaInicio?.seconds || 0) - (a.fechaInicio?.seconds || 0));
}

export async function fetchTurnoAbiertoStats() {
  const q = query(collection(db, TURNOS), where('status', '==', 'abierto'));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const turno = { id: snap.docs[0].id, ...snap.docs[0].data() };
  const cuentasSnap = await getDocs(collection(db, TURNOS, turno.id, 'cuentas'));
  const cuentas = cuentasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return aggregateTurnos([{ ...turno, _cuentasLive: cuentas }], true);
}

function turnoInRange(turno, start, end) {
  const d = tsToDate(turno.fechaInicio);
  if (!d) return false;
  return d >= start && d <= end;
}

function aggregateFromTurno(turno, includeLive) {
  let ventasTotales = turno.ventasTotales || 0;
  let totalEfectivo = turno.totalEfectivo || 0;
  let totalTransferencia = turno.totalTransferencia || 0;
  let cantidadCuentas = turno.cantidadCuentas || 0;
  const productosVendidos = { ...(turno.productosVendidos || {}) };
  const coctelesVendidos = { ...(turno.coctelesVendidos || {}) };

  if (includeLive && turno._cuentasLive) {
    ventasTotales = 0;
    totalEfectivo = 0;
    totalTransferencia = 0;
    cantidadCuentas = 0;
    Object.keys(productosVendidos).forEach((k) => delete productosVendidos[k]);
    Object.keys(coctelesVendidos).forEach((k) => delete coctelesVendidos[k]);

    for (const c of turno._cuentasLive) {
      if (c.estado !== 'pagada') continue;
      cantidadCuentas++;
      ventasTotales += c.total || 0;
      if (c.metodoPago === 'efectivo') totalEfectivo += c.total || 0;
      if (c.metodoPago === 'transferencia') totalTransferencia += c.total || 0;
      for (const p of c.productos || []) {
        const qty = p.cantidad || 1;
        const name = p.tipo === 'coctel' ? `Coctel: ${p.nombre}` : p.nombre;
        productosVendidos[name] = (productosVendidos[name] || 0) + qty;
        if (p.tipo === 'coctel') {
          const label = [p.nombre, p.size === 'grande' ? 'Grande' : 'Pequeño'].join(' · ');
          const extras = [];
          if (p.gomas) extras.push('Gomas');
          if (p.shot) extras.push('Shot');
          const key = extras.length ? `${label} · ${extras.join(' · ')}` : label;
          coctelesVendidos[key] = (coctelesVendidos[key] || 0) + qty;
        }
      }
    }
  }

  return { ventasTotales, totalEfectivo, totalTransferencia, cantidadCuentas, productosVendidos, coctelesVendidos };
}

function aggregateTurnos(turnos, includeLive = false) {
  let ventasTotales = 0;
  let totalEfectivo = 0;
  let totalTransferencia = 0;
  let cantidadCuentas = 0;
  const productosVendidos = {};
  const coctelesVendidos = {};

  for (const t of turnos) {
    const agg = aggregateFromTurno(t, includeLive && t.status === 'abierto');
    ventasTotales += agg.ventasTotales;
    totalEfectivo += agg.totalEfectivo;
    totalTransferencia += agg.totalTransferencia;
    cantidadCuentas += agg.cantidadCuentas;
    for (const [k, v] of Object.entries(agg.productosVendidos)) {
      productosVendidos[k] = (productosVendidos[k] || 0) + v;
    }
    for (const [k, v] of Object.entries(agg.coctelesVendidos)) {
      coctelesVendidos[k] = (coctelesVendidos[k] || 0) + v;
    }
  }

  // ticketPromedio left in data structure but we won't render it in UI (per request)
  const ticketPromedio = cantidadCuentas > 0 ? Math.round(ventasTotales / cantidadCuentas) : 0;
  let topProducto = '—';
  let topQty = 0;
  for (const [name, qty] of Object.entries(productosVendidos)) {
    if (qty > topQty) { topQty = qty; topProducto = name; }
  }

  return {
    ventasTotales,
    totalEfectivo,
    totalTransferencia,
    cantidadCuentas,
    ticketPromedio,
    topProducto,
    topQty,
    productosVendidos,
    coctelesVendidos,
    turnosCount: turnos.length
  };
}

function getPeriodRange(period, refDate) {
  const d = refDate || new Date();
  switch (period) {
    case 'daily':
      return { start: startOfDay(d), end: endOfDay(d), label: d.toLocaleDateString('es-CO') };
    case 'weekly':
      return { start: startOfWeek(d), end: endOfWeek(d), label: 'Semana del ' + startOfWeek(d).toLocaleDateString('es-CO') };
    case 'monthly':
      return { start: startOfMonth(d), end: endOfMonth(d), label: d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }) };
    case 'yearly':
      return { start: startOfYear(d), end: endOfYear(d), label: String(d.getFullYear()) };
    default:
      return { start: startOfDay(d), end: endOfDay(d), label: '' };
  }
}

function getPreviousPeriodRange(period, refDate) {
  const d = new Date(refDate || new Date());
  switch (period) {
    case 'daily':
      d.setDate(d.getDate() - 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() - 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() - 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() - 1);
      break;
  }
  return getPeriodRange(period, d);
}

export async function getStats(period, refDate) {
  const allTurnos = await fetchTurnosFinalizados();
  const openQ = query(collection(db, TURNOS), where('status', '==', 'abierto'));
  const openSnap = await getDocs(openQ);
  const liveTurnos = [];

  for (const d of openSnap.docs) {
    const turno = { id: d.id, ...d.data() };
    const cuentasSnap = await getDocs(collection(db, TURNOS, turno.id, 'cuentas'));
    turno._cuentasLive = cuentasSnap.docs.map((c) => ({ id: c.id, ...c.data() }));
    liveTurnos.push(turno);
  }

  const combined = [...allTurnos, ...liveTurnos];
  const range = getPeriodRange(period, refDate);
  const prevRange = getPreviousPeriodRange(period, refDate);

  const current = combined.filter((t) => turnoInRange(t, range.start, range.end));
  const previous = combined.filter((t) => turnoInRange(t, prevRange.start, prevRange.end));

  const enrichTurno = (t) => {
    if (t.status === 'abierto' && t._cuentasLive) {
      const agg = aggregateFromTurno(t, true);
      return { ...t, ventasTotales: agg.ventasTotales };
    }
    return t;
  };

  const currentStats = aggregateTurnos(current, true);
  const previousStats = aggregateTurnos(previous, true);

  return {
    period,
    range,
    prevRange,
    current: currentStats,
    previous: previousStats,
    turnos: current.map(enrichTurno)
  };
}

export async function getStatsByDate(dateStr) {
  const allTurnos = await fetchTurnosFinalizados();
  const openQ = query(collection(db, TURNOS), where('status', '==', 'abierto'));
  const openSnap = await getDocs(openQ);

  let turno = allTurnos.find((t) => t.fecha === dateStr);
  if (!turno) {
    for (const d of openSnap.docs) {
      const t = { id: d.id, ...d.data() };
      if (t.fecha === dateStr) {
        const cuentasSnap = await getDocs(collection(db, TURNOS, t.id, 'cuentas'));
        t._cuentasLive = cuentasSnap.docs.map((c) => ({ id: c.id, ...c.data() }));
        turno = t;
        break;
      }
    }
  }

  if (!turno) return null;

  const isLive = turno.status === 'abierto';
  const stats = aggregateTurnos([turno], isLive);
  return { turno, stats };
}

export function destroyCharts() {
  // Charts removed per request — no-op kept for compatibility
}

/**
 * Renderizado simplificado para Desempeño:
 * - No mostraremos grandes cuadros gráficos.
 * - Eliminamos "Ticket promedio".
 * - Mostramos: Ventas totales, Cuentas, Efectivo, Transferencia, Más vendido, total de turnos.
 * - Añadimos botón "Exportar CSV" (id=btn-export-turnos-csv)
 * - Cada turno listado incluirá un botón de borrar (class="btn-delete-turn" data-turno-id="...").
 */
export function renderStatsUI(container, data) {
  destroyCharts();
  const { current, previous, range, turnos } = data;

  const cmp = (curr, prev) => {
    if (!prev) return '';
    const diff = curr - prev;
    const pct = prev ? Math.round((diff / prev) * 100) : (diff > 0 ? 100 : 0);
    const cls = diff >= 0 ? 'up' : 'down';
    const sign = diff >= 0 ? '+' : '';
    return `<span class="cmp ${cls}">${sign}${pct}% vs anterior</span>`;
  };

  container.innerHTML = `
    <div class="stats-header">
      <div class="stats-period-label">${range.label}</div>
      <div class="stats-actions">
        <button id="btn-export-turnos-csv" class="btn btn-ghost">Exportar CSV</button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Ventas totales</span>
        <span class="stat-value">${formatCOP(current.ventasTotales)}</span>
        ${cmp(current.ventasTotales, previous.ventasTotales)}
      </div>
      <div class="stat-card">
        <span class="stat-label">Cuentas</span>
        <span class="stat-value">${current.cantidadCuentas}</span>
        ${cmp(current.cantidadCuentas, previous.cantidadCuentas)}
      </div>
      <div class="stat-card">
        <span class="stat-label">Efectivo</span>
        <span class="stat-value">${formatCOP(current.totalEfectivo)}</span>
        ${cmp(current.totalEfectivo, previous.totalEfectivo)}
      </div>
      <div class="stat-card">
        <span class="stat-label">Transferencia</span>
        <span class="stat-value">${formatCOP(current.totalTransferencia)}</span>
        ${cmp(current.totalTransferencia, previous.totalTransferencia)}
      </div>
      <div class="stat-card highlight">
        <span class="stat-label">Más vendido</span>
        <span class="stat-value stat-sm">${current.topProducto}</span>
        <span class="stat-sub">${current.topQty} uds</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Turnos en selección</span>
        <span class="stat-value">${turnos.length}</span>
      </div>
    </div>

    ${turnos.length ? `<div class="turnos-historial">
      <h3>Turnos (${turnos.length})</h3>
      <div class="turnos-list">
        ${turnos.map((t) =>
          `<div class="turno-row">
            <div class="turno-info"><span class="turno-date">${t.fecha} · ${t.horaInicio || ''}${t.horaFin ? ' - ' + t.horaFin : ''}</span></div>
            <div class="turno-meta"><span class="turno-ventas">${formatCOP(t.ventasTotales || 0)}</span>
            <button class="btn btn-icon btn-delete-turn" data-turno-id="${t.id}" title="Borrar turno">🗑</button>
            </div>
          </div>`
        ).join('')}
      </div>
    </div>` : `<div class="empty-state">No hay turnos en este periodo</div>`}
  `;
}

/**
 * Renderizado para consulta por fecha específica.
 * Mantiene la información requerida y añade botón de borrar para ese turno.
 */
export function renderDateStatsUI(container, result) {
  destroyCharts();
  if (!result) {
    container.innerHTML = '<div class="empty-state">No hay turno para esta fecha</div>';
    return;
  }

  const { turno, stats } = result;

  container.innerHTML = `
    <div class="stats-header">
      <div class="stats-period-label">Turno ${turno.fecha} · ${turno.horaInicio || ''}${turno.horaFin ? ' → ' + turno.horaFin : ' (abierto)'}</div>
      <div class="stats-actions">
        <button id="btn-export-turnos-csv" class="btn btn-ghost">Exportar CSV</button>
        <button class="btn btn-ghost btn-delete-turn" data-turno-id="${turno.id}" title="Borrar turno">Borrar turno</button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><span class="stat-label">Ventas</span><span class="stat-value">${formatCOP(stats.ventasTotales)}</span></div>
      <div class="stat-card"><span class="stat-label">Cuentas</span><span class="stat-value">${stats.cantidadCuentas}</span></div>
      <div class="stat-card"><span class="stat-label">Efectivo</span><span class="stat-value">${formatCOP(stats.totalEfectivo)}</span></div>
      <div class="stat-card"><span class="stat-label">Transferencia</span><span class="stat-value">${formatCOP(stats.totalTransferencia)}</span></div>
      <div class="stat-card highlight"><span class="stat-label">Más vendido</span><span class="stat-value stat-sm">${stats.topProducto}</span><span class="stat-sub">${stats.topQty} uds</span></div>
    </div>

    <div class="turnos-historial">
      <h3>Detalle de turnos</h3>
      <div class="turno-detail">
        <div>Ventas: ${formatCOP(stats.ventasTotales)}</div>
        <div>Cuentas: ${stats.cantidadCuentas}</div>
      </div>
    </div>
  `;
}
