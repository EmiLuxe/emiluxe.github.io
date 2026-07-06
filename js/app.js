import './firebase-init.js';
import { COCTELES, PRODUCTOS, calcularPrecioCoctel, productoDisplayName } from './products.js';
import {
  formatCOP, showToast, showView, openModal, closeModal, confirmDialog
} from './utils.js';
import {
  getTurnoAbierto, iniciarTurno, finalizarTurno, calcTurnoTotalFromCuentas, subscribeTurnoAbierto, getAllTurnosFinalizados
} from './turno.js';
import {
  subscribeCuentas, crearCuenta, agregarProducto, editarProducto,
  eliminarProducto, cambiarCantidad, cerrarCuenta, deleteCuenta
} from './cuentas.js';
import { getStats, getStatsByDate, renderStatsUI, renderDateStatsUI, destroyCharts } from './stats.js';
import { db, collection, doc, getDocs, deleteDoc } from './firebase-init.js';

const state = {
  turno: null,
  cuentas: [],
  cuentaActual: null,
  search: '',
  editingProducto: null,
  selectedProduct: null,
  qty: 1,
  coctelSize: 'pequeno',
  statsPeriod: 'daily'
};

let unsubCuentas = null;
let unsubTurnoAbierto = null;

function init() {
  registerSW();
  bindEvents();
  unsubTurnoAbierto = subscribeTurnoAbierto(handleTurnoSync);
  bindStatsActionsIfPresent();
}

function handleTurnoSync(turno) {
  document.getElementById('loading').classList.remove('active');
  updateStartScreen(!!turno);

  if (turno) {
    openTurno(turno);
    return;
  }

  const hadTurno = !!state.turno;
  resetTurnoLocal();

  const activeView = document.querySelector('.view.active')?.id;
  if (hadTurno && activeView !== 'view-desempeno') {
    showView('view-start');
  } else if (activeView === 'loading' || activeView === 'view-turno' || activeView === 'view-cuenta') {
    showView('view-start');
  }
}

function resetTurnoLocal() {
  if (unsubCuentas) {
    unsubCuentas();
    unsubCuentas = null;
  }
  state.turno = null;
  state.cuentas = [];
  state.cuentaActual = null;
  document.getElementById('btn-iniciar-turno').disabled = false;
}

function updateStartScreen(turnoActivo) {
  document.getElementById('btn-iniciar-turno').classList.toggle('hidden', turnoActivo);
  document.getElementById('start-turno-msg').classList.toggle('hidden', !turnoActivo);
}

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

function bindEvents() {
  document.getElementById('btn-iniciar-turno').addEventListener('click', onIniciarTurno);
  document.getElementById('btn-desempeno-start').addEventListener('click', () => openDesempeno());
  document.getElementById('btn-desempeno').addEventListener('click', () => openDesempeno());
  document.getElementById('btn-back-desempeno').addEventListener('click', () => {
    destroyCharts();
    if (state.turno) showView('view-turno');
    else showView('view-start');
  });
  document.getElementById('btn-finalizar-turno').addEventListener('click', onFinalizarTurno);
  document.getElementById('btn-nueva-cuenta').addEventListener('click', () => {
    document.getElementById('input-nombre-cuenta').value = '';
    openModal('nueva-cuenta');
    setTimeout(() => document.getElementById('input-nombre-cuenta').focus(), 100);
  });
  document.getElementById('btn-confirmar-cuenta').addEventListener('click', onCrearCuenta);
  document.getElementById('search-cuentas').addEventListener('input', (e) => {
    state.search = e.target.value.toLowerCase();
    renderCuentasList();
  });
  document.getElementById('btn-back-cuenta').addEventListener('click', () => showView('view-turno'));
  document.getElementById('btn-cerrar-cuenta').addEventListener('click', () => openModal('pago'));
  document.getElementById('btn-agregar-producto').addEventListener('click', () => openProductoModal());
  document.getElementById('btn-confirmar-producto').addEventListener('click', onConfirmarProducto);
  document.getElementById('qty-minus').addEventListener('click', () => { if (state.qty > 1) { state.qty--; updateProductoPreview(); } });
  document.getElementById('qty-plus').addEventListener('click', () => { state.qty++; updateProductoPreview(); });

  document.querySelectorAll('.modal-cancel').forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  document.querySelectorAll('.pago-btn').forEach((btn) => {
    btn.addEventListener('click', () => onPago(btn.dataset.pago));
  });

  document.querySelectorAll('.period-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.period-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      state.statsPeriod = tab.dataset.period;
      document.getElementById('stats-date').value = '';
      loadStats();
    });
  });

  document.getElementById('stats-date').addEventListener('change', (e) => {
    if (e.target.value) loadStatsByDate(e.target.value);
    else loadStats();
  });

  document.getElementById('input-nombre-cuenta').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') onCrearCuenta();
  });
}

async function onIniciarTurno() {
  const btn = document.getElementById('btn-iniciar-turno');
  btn.disabled = true;
  try {
    const existing = await getTurnoAbierto();
    if (existing) {
      openTurno(existing);
      showToast('Turno ya activo', 'info');
      return;
    }
    const turno = await iniciarTurno();
    openTurno(turno);
    showToast('Turno iniciado', 'success');
  } catch (err) {
    showToast(err.message || 'Error al iniciar turno', 'error');
    btn.disabled = false;
  }
}

function openTurno(turno) {
  if (turno.status === 'finalizado') {
    resetTurnoLocal();
    showView('view-start');
    return;
  }

  const isNewTurno = !state.turno || state.turno.id !== turno.id;
  state.turno = turno;
  updateStartScreen(true);

  if (isNewTurno) {
    if (unsubCuentas) unsubCuentas();
    unsubCuentas = subscribeCuentas(turno.id, (cuentas) => {
      state.cuentas = cuentas;
      renderCuentasList();
      updateTurnoTotal();
      if (state.cuentaActual) {
        const updated = cuentas.find((c) => c.id === state.cuentaActual.id);
        if (updated) {
          state.cuentaActual = updated;
          renderProductosList();
        }
      }
    });
  }

  const activeView = document.querySelector('.view.active')?.id;
  // Opción B: asegurar que si no hay vista activa, la vista de turno se activa
  if (!activeView || activeView === 'loading' || activeView === 'view-start' || activeView === 'view-turno') {
    showView('view-turno');
  }
}

function updateTurnoTotal() {
  const total = calcTurnoTotalFromCuentas(state.cuentas);
  document.getElementById('turno-total-vendido').textContent = formatCOP(total);
}

function renderCuentasList() {
  const container = document.getElementById('cuentas-list');
  let cuentas = state.cuentas;
  if (state.search) {
    cuentas = cuentas.filter((c) => c.nombre.toLowerCase().includes(state.search));
  }

  if (!cuentas.length) {
    container.innerHTML = `<div class="empty-state">${state.search ? 'Sin resultados' : 'Sin cuentas. Toca + para crear una.'}</div>`;
    return;
  }

  container.innerHTML = cuentas.map((c) => {
    const isPending = c.estado === 'pendiente';
    return `
      <div class="cuenta-card ${isPending ? 'pending' : 'paid'}" data-id="${c.id}">
        <div class="cuenta-card-top">
          <span class="cuenta-name">${escapeHtml(c.nombre)}</span>
          <span class="cuenta-total">${formatCOP(c.total)}</span>
        </div>
        <div class="cuenta-card-bottom">
          <span class="cuenta-time">${c.hora || ''}</span>
          <span class="badge ${isPending ? 'badge-pending' : 'badge-paid'}">${isPending ? 'Pendiente' : 'Pagada'}</span>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.cuenta-card').forEach((card) => {
    card.addEventListener('click', () => openCuenta(card.dataset.id));
  });
}

function openCuenta(id) {
  const cuenta = state.cuentas.find((c) => c.id === id);
  if (!cuenta) return;
  state.cuentaActual = cuenta;
  document.getElementById('cuenta-nombre-display').textContent = cuenta.nombre;
  const badge = document.getElementById('cuenta-estado-badge');
  badge.textContent = cuenta.estado === 'pendiente' ? 'Pendiente' : 'Pagada';
  badge.className = 'badge ' + (cuenta.estado === 'pendiente' ? 'badge-pending' : 'badge-paid');

  const isLocked = cuenta.estado === 'pagada';
  document.getElementById('btn-agregar-producto').classList.toggle('hidden', isLocked);
  document.getElementById('btn-cerrar-cuenta').classList.toggle('hidden', isLocked);

  renderProductosList();
  showView('view-cuenta');
}

function renderProductosList() {
  const cuenta = state.cuentaActual;
  if (!cuenta) return;
  document.getElementById('cuenta-total-display').textContent = formatCOP(cuenta.total);
  const container = document.getElementById('productos-list');
  const isLocked = cuenta.estado === 'pagada';

  if (!cuenta.productos?.length) {
    container.innerHTML = '<div class="empty-state">Agrega productos con +</div>';
    return;
  }

  container.innerHTML = cuenta.productos.map((p) => `
    <div class="producto-item" data-id="${p.id}">
      <div class="producto-info">
        <span class="producto-name">${escapeHtml(productoDisplayName(p))}</span>
        <span class="producto-price">${formatCOP(p.precioTotal)}</span>
      </div>
      ${!isLocked ? `
      <div class="producto-actions">
        <button class="btn btn-icon btn-sm qty-btn" data-action="minus" data-id="${p.id}">−</button>
        <span class="qty-display">${p.cantidad}</span>
        <button class="btn btn-icon btn-sm qty-btn" data-action="plus" data-id="${p.id}">+</button>
        <button class="btn btn-icon btn-sm edit-btn" data-id="${p.id}">✎</button>
        <button class="btn btn-icon btn-sm btn-danger-icon del-btn" data-id="${p.id}">✕</button>
      </div>` : `<span class="qty-readonly">×${p.cantidad}</span>`}
    </div>
  `).join('');

  if (!isLocked) {
    container.querySelectorAll('.qty-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const delta = btn.dataset.action === 'plus' ? 1 : -1;
        try {
          await cambiarCantidad(state.turno.id, cuenta.id, btn.dataset.id, delta, cuenta.productos);
        } catch (err) { showToast(err.message, 'error'); }
      });
    });
    container.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = cuenta.productos.find((x) => x.id === btn.dataset.id);
        if (p) openProductoModal(p);
      });
    });
    container.querySelectorAll('.del-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await eliminarProducto(state.turno.id, cuenta.id, btn.dataset.id, cuenta.productos);
        } catch (err) { showToast(err.message, 'error'); }
      });
    });
  }
}

async function onCrearCuenta() {
  const nombre = document.getElementById('input-nombre-cuenta').value.trim();
  if (!nombre) { showToast('Ingresa un nombre', 'error'); return; }
  try {
    const cuenta = await crearCuenta(state.turno.id, nombre);
    closeModal();
    if (!state.cuentas.find((c) => c.id === cuenta.id)) {
      state.cuentas.unshift({
        id: cuenta.id,
        nombre: nombre,
        fecha: cuenta.fecha,
        hora: cuenta.hora,
        estado: 'pendiente',
        metodoPago: null,
        productos: [],
        total: 0
      });
    }
    openCuenta(cuenta.id);
  } catch (err) { showToast(err.message, 'error'); }
}

function openProductoModal(editItem = null) {
  state.editingProducto = editItem;
  state.qty = editItem?.cantidad || 1;
  state.coctelSize = editItem?.size || 'pequeno';
  state.selectedProduct = editItem ? { tipo: editItem.tipo, id: editItem.productoId } : null;

  document.getElementById('modal-producto-title').textContent = editItem ? 'Editar producto' : 'Agregar producto';
  document.getElementById('btn-confirmar-producto').textContent = editItem ? 'Guardar' : 'Agregar';

  const selector = document.getElementById('producto-selector');
  selector.innerHTML = `
    <div class="product-section">
      <h4>Cocteles</h4>
      <div class="product-grid">
        ${COCTELES.map((c) => `
          <button class="product-btn ${editItem?.productoId === c.id ? 'selected' : ''}" data-tipo="coctel" data-id="${c.id}">${c.nombre}</button>
        `).join('')}
      </div>
    </div>
    <div class="product-section">
      <h4>Otros</h4>
      <div class="product-grid">
        ${PRODUCTOS.map((p) => `
          <button class="product-btn ${editItem?.productoId === p.id ? 'selected' : ''}" data-tipo="producto" data-id="${p.id}">${p.nombre}<span class="product-price-tag">${formatCOP(p.precio)}</span></button>
        `).join('')}
      </div>
    </div>
  `;

  selector.querySelectorAll('.product-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selector.querySelectorAll('.product-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.selectedProduct = { tipo: btn.dataset.tipo, id: btn.dataset.id };
      toggleCoctelOptions(btn.dataset.tipo === 'coctel');
      updateProductoPreview();
    });
  });

  const coctelOpts = document.getElementById('coctel-options');
  const isCoctel = editItem?.tipo === 'coctel' || state.selectedProduct?.tipo === 'coctel';
  coctelOpts.classList.toggle('hidden', !isCoctel);

  document.getElementById('chk-gomas').checked = editItem?.gomas || false;
  document.getElementById('chk-shot').checked = editItem?.shot || false;

  coctelOpts.querySelectorAll('[data-size]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.size === state.coctelSize);
    btn.onclick = () => {
      coctelOpts.querySelectorAll('[data-size]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.coctelSize = btn.dataset.size;
      updateProductoPreview();
    };
  });

  document.getElementById('chk-gomas').onchange = updateProductoPreview;
  document.getElementById('chk-shot').onchange = updateProductoPreview;

  if (editItem) {
    toggleCoctelOptions(editItem.tipo === 'coctel');
  }

  updateProductoPreview();
  openModal('producto');
}

function toggleCoctelOptions(show) {
  document.getElementById('coctel-options').classList.toggle('hidden', !show);
}

function updateProductoPreview() {
  document.getElementById('qty-value').textContent = state.qty;
  let unit = 0;
  if (state.selectedProduct?.tipo === 'coctel') {
    unit = calcularPrecioCoctel(
      state.coctelSize,
      document.getElementById('chk-gomas').checked,
      document.getElementById('chk-shot').checked
    );
  } else if (state.selectedProduct?.tipo === 'producto') {
    const p = PRODUCTOS.find((x) => x.id === state.selectedProduct.id);
    unit = p?.precio || 0;
  }
  document.getElementById('producto-preview-price').textContent = formatCOP(unit * state.qty);
}

async function onConfirmarProducto() {
  if (!state.selectedProduct) { showToast('Selecciona un producto', 'error'); return; }
  const cuenta = state.cuentaActual;
  if (!cuenta || cuenta.estado === 'pagada') return;

  let item;
  if (state.selectedProduct.tipo === 'coctel') {
    const coctel = COCTELES.find((c) => c.id === state.selectedProduct.id);
    const gomas = document.getElementById('chk-gomas').checked;
    const shot = document.getElementById('chk-shot').checked;
    const precioUnitario = calcularPrecioCoctel(state.coctelSize, gomas, shot);
    item = {
      tipo: 'coctel',
      productoId: coctel.id,
      nombre: coctel.nombre,
      size: state.coctelSize,
      gomas,
      shot,
      cantidad: state.qty,
      precioUnitario,
      precioTotal: precioUnitario * state.qty
    };
  } else {
    const prod = PRODUCTOS.find((p) => p.id === state.selectedProduct.id);
    item = {
      tipo: 'producto',
      productoId: prod.id,
      nombre: prod.nombre,
      cantidad: state.qty,
      precioUnitario: prod.precio,
      precioTotal: prod.precio * state.qty
    };
  }

  try {
    if (state.editingProducto) {
      await editarProducto(state.turno.id, cuenta.id, state.editingProducto.id, item, cuenta.productos);
    } else {
      await agregarProducto(state.turno.id, cuenta.id, item, cuenta.productos);
    }
    closeModal();
  } catch (err) { showToast(err.message, 'error'); }
}

async function onPago(opcion) {
  closeModal();
  const cuenta = state.cuentaActual;
  if (!cuenta) return;

  // Nueva opción: eliminar cuenta
  if (opcion === 'eliminar') {
    if (cuenta.estado === 'pagada') {
      showToast('No se puede eliminar una cuenta pagada', 'error');
      return;
    }
    const ok = await confirmDialog('Eliminar cuenta', '¿Eliminar esta cuenta permanentemente? Esta acción no se puede deshacer.');
    if (!ok) return;
    try {
      await deleteCuenta(state.turno.id, cuenta.id);
      // actualizar estado local
      state.cuentas = state.cuentas.filter((c) => c.id !== cuenta.id);
      state.cuentaActual = null;
      showToast('Cuenta eliminada', 'success');
      showView('view-turno');
    } catch (err) {
      showToast(err.message || 'Error al eliminar cuenta', 'error');
    }
    return;
  }

  // Comportamiento previo: cerrar cuenta con metodo de pago
  try {
    await cerrarCuenta(state.turno.id, cuenta.id, opcion);
    if (opcion === 'pendiente') {
      showToast('Cuenta sigue pendiente', 'info');
    } else {
      showToast('Cuenta pagada', 'success');
      showView('view-turno');
    }
  } catch (err) { showToast(err.message, 'error'); }
}

async function onFinalizarTurno() {
  const pendientes = state.cuentas.filter((c) => c.estado === 'pendiente');
  if (pendientes.length) {
    showToast(`${pendientes.length} cuenta(s) pendiente(s). Ciérralas primero.`, 'error');
    return;
  }
  const ok = await confirmDialog('Finalizar turno', '¿Confirmar cierre del turno? Esta acción no se puede deshacer.');
  if (!ok) return;
  try {
    await finalizarTurno(state.turno.id, state.cuentas);
    showToast('Turno finalizado', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

async function openDesempeno() {
  showView('view-desempeno');
  document.getElementById('stats-date').value = '';
  await loadStats();
}

async function loadStats() {
  const container = document.getElementById('stats-content');
  container.innerHTML = '<div class="loader-inline"></div>';
  try {
    const data = await getStats(state.statsPeriod, new Date());
    renderStatsUI(container, data);
    // si existen botones en DOM para exportar/borrar, adjuntamos listeners dinámicamente
    bindStatsActionsIfPresent();
  } catch (err) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

async function loadStatsByDate(dateStr) {
  const container = document.getElementById('stats-content');
  container.innerHTML = '<div class="loader-inline"></div>';
  try {
    const result = await getStatsByDate(dateStr);
    renderDateStatsUI(container, result);
    bindStatsActionsIfPresent();
  } catch (err) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* -----------------------
   Funciones auxiliares para export / borrado de turnos
   - Estas funciones usan las utilidades de firestore ya exportadas en firebase-init.js.
   - Los listeners para botones se adjuntan solo si los elementos existen en DOM.
   ----------------------- */

async function deleteTurnoById(turnoId) {
  if (!turnoId) throw new Error('turnoId requerido');
  // confirmar antes de llamar esta función desde la UI
  // borrar todas las cuentas del turno
  const cuentasSnap = await getDocs(collection(db, 'turnos', turnoId, 'cuentas'));
  for (const d of cuentasSnap.docs) {
    await deleteDoc(doc(db, 'turnos', turnoId, 'cuentas', d.id));
  }
  // borrar el documento de turno
  await deleteDoc(doc(db, 'turnos', turnoId));
}

function objectArrayToCsv(rows, columns) {
  // columns = array de keys en el orden deseado
  const header = columns.join(',');
  const lines = rows.map((r) => columns.map((k) => {
    const v = r[k] == null ? '' : String(r[k]).replace(/"/g, '""');
    return `"${v}"`;
  }).join(','));
  return [header, ...lines].join('\r\n');
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function exportAllTurnosCsv() {
  try {
    const turns = await getAllTurnosFinalizados(); // viene de turno.js
    if (!turns || !turns.length) {
      showToast('No hay turnos para exportar', 'info');
      return;
    }
    // mapear campos relevantes
    const rows = turns.map((t) => ({
      id: t.id,
      fecha: t.fecha || '',
      horaInicio: t.horaInicio || '',
      horaFin: t.horaFin || '',
      ventasTotales: t.ventasTotales || 0,
      totalEfectivo: t.totalEfectivo || 0,
      totalTransferencia: t.totalTransferencia || 0,
      cantidadCuentas: t.cantidadCuentas || 0
    }));
    const cols = ['id', 'fecha', 'horaInicio', 'horaFin', 'ventasTotales', 'totalEfectivo', 'totalTransferencia', 'cantidadCuentas'];
    const csv = objectArrayToCsv(rows, cols);
    downloadText('turnos_export.csv', csv);
    showToast('CSV generado', 'success');
  } catch (err) {
    showToast(err.message || 'Error al exportar CSV', 'error');
  }
}

/* Bind dinámico para acciones en sección Desempeño (si los botones existen) */
function bindStatsActionsIfPresent() {
  const statsContainer = document.getElementById('stats-content');
  if (!statsContainer) return;

  // exportar CSV global: elemento con id="btn-export-turnos-csv"
  const exportBtn = document.getElementById('btn-export-turnos-csv');
  if (exportBtn && !exportBtn._bound) {
    exportBtn.addEventListener('click', exportAllTurnosCsv);
    exportBtn._bound = true;
  }

  // delegación: si en la lista de turnos cada fila tiene class "turno-row" y data-id,
  // y un botón con class "btn-delete-turn", el click lo maneja aquí.
  if (!statsContainer._deleteBound) {
    statsContainer.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-delete-turn');
      if (!btn) return;
      const turnoId = btn.dataset.turnoId;
      if (!turnoId) return;
      const ok = await confirmDialog('Borrar turno', '¿Borrar este turno y todas sus cuentas? Esta acción no se puede deshacer.');
      if (!ok) return;
      try {
        await deleteTurnoById(turnoId);
        showToast('Turno eliminado', 'success');
        // recargar estadísticas/listado
        loadStats();
      } catch (err) {
        showToast(err.message || 'Error al borrar turno', 'error');
      }
    });
    statsContainer._deleteBound = true;
  }
}

/* -----------------------
   Fin utilitarios export/delete
   ----------------------- */

init();
