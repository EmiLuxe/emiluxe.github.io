import './firebase-init.js';
import { COCTELES, PRODUCTOS, calcularPrecioCoctel, productoDisplayName } from './products.js';
import {
  formatCOP, showToast, showView, openModal, closeModal, confirmDialog
} from './utils.js';
import {
  getTurnoAbierto, iniciarTurno, finalizarTurno, calcTurnoTotalFromCuentas
} from './turno.js';
import {
  subscribeCuentas, crearCuenta, agregarProducto, editarProducto,
  eliminarProducto, cambiarCantidad, cerrarCuenta
} from './cuentas.js';
import { getStats, getStatsByDate, renderStatsUI, renderDateStatsUI, destroyCharts } from './stats.js';

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

async function init() {
  registerSW();
  bindEvents();
  const turno = await getTurnoAbierto();
  document.getElementById('loading').classList.remove('active');
  if (turno) {
    openTurno(turno);
  } else {
    showView('view-start');
  }
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
    const turno = await iniciarTurno();
    openTurno(turno);
    showToast('Turno iniciado', 'success');
  } catch (err) {
    showToast(err.message || 'Error al iniciar turno', 'error');
    btn.disabled = false;
  }
}

function openTurno(turno) {
  state.turno = turno;
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
  showView('view-turno');
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
    if (unsubCuentas) { unsubCuentas(); unsubCuentas = null; }
    state.turno = null;
    state.cuentas = [];
    showToast('Turno finalizado', 'success');
    showView('view-start');
    document.getElementById('btn-iniciar-turno').disabled = false;
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
  } catch (err) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

init();
