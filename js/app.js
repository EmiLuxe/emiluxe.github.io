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
  try {
    unsubTurnoAbierto = subscribeTurnoAbierto(handleTurnoSync);
  } catch (err) {
    console.error('subscribeTurnoAbierto failed at init:', err);
    // ensure UI isn't blocked
    document.getElementById('loading')?.classList.remove('active');
    showView('view-start');
  }
  bindStatsActionsIfPresent();
}

function handleTurnoSync(turno) {
  try {
    document.getElementById('loading')?.classList.remove('active');
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
  } catch (err) {
    console.error('handleTurnoSync error:', err);
    document.getElementById('loading')?.classList.remove('active');
    showView('view-start');
  }
}

function resetTurnoLocal() {
  if (unsubCuentas) {
    try { unsubCuentas(); } catch (e) { /* ignore */ }
    unsubCuentas = null;
  }
  state.turno = null;
  state.cuentas = [];
  state.cuentaActual = null;
  const btn = document.getElementById('btn-iniciar-turno');
  if (btn) btn.disabled = false;
}

function updateStartScreen(turnoActivo) {
  document.getElementById('btn-iniciar-turno')?.classList.toggle('hidden', turnoActivo);
  document.getElementById('start-turno-msg')?.classList.toggle('hidden', !turnoActivo);
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    console.log('ServiceWorker registered', reg);

    // If there's a waiting worker, tell it to skip waiting
    if (reg.waiting) {
      try { reg.waiting.postMessage({ type: 'SKIP_WAITING' }); } catch (e) {}
    }

    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          try { newWorker.postMessage({ type: 'SKIP_WAITING' }); } catch (e) {}
        }
      });
    });

    // When a new SW takes control, reload so clients use fresh files
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service worker controller changed, reloading to activate new SW');
      window.location.reload();
    });
  }).catch((err) => {
    console.warn('ServiceWorker registration failed:', err);
  });
}

function bindEvents() {
  // helper to safely bind if element exists
  const on = (id, evt, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(evt, fn);
  };

  on('btn-iniciar-turno', 'click', onIniciarTurno);
  on('btn-desempeno-start', 'click', () => openDesempeno());
  on('btn-desempeno', 'click', () => openDesempeno);
  on('btn-back-desempeno', 'click', () => {
    destroyCharts();
    if (state.turno) showView('view-turno');
    else showView('view-start');
  });
  on('btn-finalizar-turno', 'click', onFinalizarTurno);
  on('btn-nueva-cuenta', 'click', () => {
    const input = document.getElementById('input-nombre-cuenta');
    if (input) input.value = '';
    openModal('nueva-cuenta');
    setTimeout(() => document.getElementById('input-nombre-cuenta')?.focus(), 100);
  });
  on('btn-confirmar-cuenta', 'click', onCrearCuenta);

  const search = document.getElementById('search-cuentas');
  if (search) {
    search.addEventListener('input', (e) => {
      state.search = e.target.value.toLowerCase();
      renderCuentasList();
    });
  }

  on('btn-back-cuenta', 'click', () => showView('view-turno'));
  on('btn-cerrar-cuenta', 'click', () => openModal('pago'));
  on('btn-agregar-producto', 'click', () => openProductoModal());
  on('btn-confirmar-producto', 'click', onConfirmarProducto);
  on('qty-minus', 'click', () => { if (state.qty > 1) { state.qty--; updateProductoPreview(); } });
  on('qty-plus', 'click', () => { state.qty++; updateProductoPreview(); });

  document.querySelectorAll('.modal-cancel').forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.addEventListener('click', (e) => {
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
      const sd = document.getElementById('stats-date');
      if (sd) sd.value = '';
      loadStats();
    });
  });

  const statsDate = document.getElementById('stats-date');
  if (statsDate) statsDate.addEventListener('change', (e) => {
    if (e.target.value) loadStatsByDate(e.target.value);
    else loadStats();
  });

  const inputNombre = document.getElementById('input-nombre-cuenta');
  if (inputNombre) inputNombre.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') onCrearCuenta();
  });
}

async function onIniciarTurno() {
  const btn = document.getElementById('btn-iniciar-turno');
  if (btn) btn.disabled = true;
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
    console.error('onIniciarTurno error:', err);
    showToast(err.message || 'Error al iniciar turno', 'error');
    if (btn) btn.disabled = false;
  }
}

function openTurno(turno) {
  try {
    if (turno.status === 'finalizado') {
      resetTurnoLocal();
      showView('view-start');
      return;
    }

    const isNewTurno = !state.turno || state.turno.id !== turno.id;
    state.turno = turno;
    updateStartScreen(true);

    if (isNewTurno) {
      if (unsubCuentas) {
        try { unsubCuentas(); } catch (e) {}
      }
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
    if (!activeView || activeView === 'loading' || activeView === 'view-start' || activeView === 'view-turno') {
      showView('view-turno');
    }
  } catch (err) {
    console.error('openTurno error:', err);
    showView('view-start');
  }
}

function updateTurnoTotal() {
  const total = calcTurnoTotalFromCuentas(state.cuentas);
  const el = document.getElementById('turno-total-vendido');
  if (el) el.textContent = formatCOP(total);
}

function renderCuentasList() {
  const container = document.getElementById('cuentas-list');
  if (!container) return;
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
  const nombreEl = document.getElementById('cuenta-nombre-display');
  if (nombreEl) nombreEl.textContent = cuenta.nombre;
  const badge = document.getElementById('cuenta-estado-badge');
  if (badge) {
    badge.textContent = cuenta.estado === 'pendiente' ? 'Pendiente' : 'Pagada';
    badge.className = 'badge ' + (cuenta.estado === 'pendiente' ? 'badge-pending' : 'badge-paid');
  }

  const isLocked = cuenta.estado === 'pagada';
  document.getElementById('btn-agregar-producto')?.classList.toggle('hidden', isLocked);
  document.getElementById('btn-cerrar-cuenta')?.classList.toggle('hidden', isLocked);

  renderProductosList();
  showView('view-cuenta');
}

function renderProductosList() {
  const cuenta = state.cuentaActual;
  if (!cuenta) return;
  const totalEl = document.getElementById('cuenta-total-display');
  if (totalEl) totalEl.textContent = formatCOP(cuenta.total);
  const container = document.getElementById('productos-list');
  if (!container) return;
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
  const nombre = document.getElementById('input-nombre-cuenta')?.value.trim();
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
  if (!selector) return;
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
  if (coctelOpts) coctelOpts.classList.toggle('hidden', !isCoctel);

  const chkGomas = document.getElementById('chk-gomas');
  const chkShot = document.getElementById('chk-shot');
  if (chkGomas) chkGomas.checked = editItem?.gomas || false;
  if (chkShot) chkShot.checked = editItem?.shot || false;

  coctelOpts?.querySelectorAll('[data-size]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.size === state.coctelSize);
    btn.onclick = () => {
      coctelOpts.querySelectorAll('[data-size]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.coctelSize = btn.dataset.size;
      updateProductoPreview();
    };
  });

  if (chkGomas) chkGomas.onchange = updateProductoPreview;
  if (chkShot) chkShot.onchange = updateProductoPreview;

  if (editItem) {
    toggleCoctelOptions(editItem.tipo === 'coctel');
  }

  updateProductoPreview();
  openModal('producto');
}

function toggleCoctelOptions(show) {
  document.getElementById('coctel-options')?.classList.toggle('hidden', !show);
}

function updateProductoPreview() {
  const qtyEl = document.getElementById('qty-value');
  if (qtyEl) qtyEl.textContent = state.qty;
  let unit = 0;
  if (state.selectedProduct?.tipo === 'coctel') {
    unit = calcularPrecioCoctel(
      state.coctelSize,
      document.getElementById('chk-gomas')?.checked,
      document.getElementById('chk-shot')?.checked
    );
  } else if (state.selectedProduct?.tipo === 'producto') {
    const p = PRODUCTOS.find((x) => x.id === state.selectedProduct.id);
    unit = p?.precio || 0;
  }
  const preview = document.getElementById('producto-preview-price');
  if (preview) preview.textContent = formatCOP(unit * state.qty);
}

async function onConfirmarProducto() {
  if (!state.selectedProduct) { showToast('Selecciona un producto', 'error'); return; }
  const cuenta = state.cuentaActual;
  if (!cuenta || cuenta.estado === 'pagada') return;

  let item;
  if (state.selectedProduct.tipo === 'coctel') {
    const coctel = COCTELES.find((c) => c.id === state.selectedProduct.id);
    const gomas = document.getElementById('chk-gomas')?.checked;
    const shot = document.getElementById('chk-shot')?.checked;
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

  if (opcion === 'eliminar') {
    if (cuenta.estado === 'pagada') {
      showToast('No se puede eliminar una cuenta pagada', 'error');
      return;
    }
    const ok = await confirmDialog('Eliminar cuenta', '¿Eliminar esta cuenta permanentemente? Esta acción no se puede deshacer.');
    if (!ok) return;
    try {
      await deleteCuenta(state.turno.id, cuenta.id);
      state.cuentas = state.cuentas.filter((c) => c.id !== cuenta.id);
      state.cuentaActual = null;
      showToast('Cuenta eliminada', 'success');
      showView('view-turno');
    } catch (err) {
      showToast(err.message || 'Error al eliminar cuenta', 'error');
    }
    return;
  }

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
  const sd = document.getElementById('stats-date');
  if (sd) sd.value = '';
  await loadStats();
}

async function loadStats() {
  const container = document.getElementById('stats-content');
  if (!container) return;
  container.innerHTML = '<div class="loader-inline"></div>';
  try {
    const data = await getStats(state.statsPeriod, new Date());
    renderStatsUI(container, data);
    bindStatsActionsIfPresent();
  } catch (err) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

async function loadStatsByDate(dateStr) {
  const container = document.getElementById('stats-content');
  if (!container) return;
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
   ----------------------- */

async function deleteTurnoById(turnoId) {
  if (!turnoId) throw new Error('turnoId requerido');
  const cuentasSnap = await getDocs(collection(db, 'turnos', turnoId, 'cuentas'));
  for (const d of cuentasSnap.docs) {
    await deleteDoc(doc(db, 'turnos', turnoId, 'cuentas', d.id));
  }
  await deleteDoc(doc(db, 'turnos', turnoId));
}

function objectArrayToCsv(rows, columns) {
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
    const turns = await getAllTurnosFinalizados();
    if (!turns || !turns.length) {
      showToast('No hay turnos para exportar', 'info');
      return;
    }
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

  const exportBtn = document.getElementById('btn-export-turnos-csv');
  if (exportBtn && !exportBtn._bound) {
    exportBtn.addEventListener('click', exportAllTurnosCsv);
    exportBtn._bound = true;
  }

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
