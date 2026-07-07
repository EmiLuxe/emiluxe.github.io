import './firebase-init.js';
import { COCTELES, PRODUCTOS, calcularPrecioCoctel, productoDisplayName } from './products.js';
import {
  formatCOP, showToast, showView, openModal, closeModal, confirmDialog,
  calcCuentaTotal, recalcProductoLine, uuid
} from './utils.js';
import {
  getTurnoAbierto, iniciarTurno, finalizarTurno, calcTurnoTotalFromCuentas,
  subscribeTurnoAbierto, getAllTurnosFinalizados, deleteTurno
} from './turno.js';
import {
  subscribeCuentas, crearCuenta, agregarProducto, editarProducto,
  eliminarProducto, cambiarCantidad, cerrarCuenta, deleteCuenta, updateCuenta
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

// modalSelected: map key "tipo:id" -> item { tipo, id, nombre, cantidad, size, gomas, shot }
let modalSelected = {};

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

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service worker controller changed, reloading to activate new SW');
      window.location.reload();
    });
  }).catch((err) => {
    console.warn('ServiceWorker registration failed:', err);
  });
}

function bindEvents() {
  const on = (id, evt, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(evt, fn);
  };

  on('btn-iniciar-turno', 'click', onIniciarTurno);
  on('btn-desempeno-start', 'click', () => openDesempeno());
  on('btn-desempeno', 'click', openDesempeno); // fixed
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
      ${!isLocked ?
      `<div class="producto-actions">
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

/* -----------------------
   Modal productos: permitir multi-selección y qty por producto
   ----------------------- */

function openProductoModal(editItem = null) {
  state.editingProducto = editItem;
  state.qty = editItem?.cantidad || 1;
  state.coctelSize = editItem?.size || 'pequeno';
  state.selectedProduct = editItem ? { tipo: editItem.tipo, id: editItem.productoId } : null;

  // reset modalSelected unless we are editing (we will prefill below)
  modalSelected = {};

  document.getElementById('modal-producto-title').textContent = editItem ? 'Editar producto' : 'Agregar producto';
  document.getElementById('btn-confirmar-producto').textContent = editItem ? 'Guardar' : 'Agregar';

  const selector = document.getElementById('producto-selector');
  if (!selector) return;

  selector.innerHTML = `
    <div class="product-section">
      <h4>Cocteles</h4>
      <div class="product-grid">
        ${COCTELES.map((c) => `
          <div class="product-grid-item">
            <button class="product-btn" data-tipo="coctel" data-id="${c.id}">${c.nombre}</button>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="product-section">
      <h4>Otros</h4>
      <div class="product-grid">
        ${PRODUCTOS.map((p) => `
          <div class="product-grid-item">
            <button class="product-btn" data-tipo="producto" data-id="${p.id}">${p.nombre}<span class="product-price-tag">${formatCOP(p.precio)}</span></button>
          </div>
        `).join('')}
      </div>
    </div>

    <div id="selected-products" class="selected-products" style="margin-top:18px;">
      <h4>Seleccionados</h4>
      <div id="selected-list"></div>
    </div>
  `;

  // product button behavior: toggle selection and add/remove from modalSelected
  selector.querySelectorAll('.product-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tipo = btn.dataset.tipo;
      const id = btn.dataset.id;
      const key = `${tipo}:${id}`;
      if (modalSelected[key]) {
        delete modalSelected[key];
        btn.classList.remove('selected');
      } else {
        const name = btn.textContent.trim();
        const item = {
          tipo,
          id,
          nombre: name,
          cantidad: 1,
          size: 'pequeno',
          gomas: false,
          shot: false
        };
        // set precioUnitario on demand in recalc
        modalSelected[key] = item;
        btn.classList.add('selected');
      }
      renderSelectedList();
      updateProductoPreview();
    });
  });

  // if editing a product, prefill modalSelected with that product (so user edits it)
  if (editItem) {
    const key = `${editItem.tipo}:${editItem.productoId}`;
    modalSelected[key] = {
      tipo: editItem.tipo,
      id: editItem.productoId,
      nombre: editItem.nombre,
      cantidad: editItem.cantidad || 1,
      size: editItem.size || 'pequeno',
      gomas: !!editItem.gomas,
      shot: !!editItem.shot
    };
    const btn = selector.querySelector(`.product-btn[data-id="${editItem.productoId}"]`);
    if (btn) btn.classList.add('selected');
    renderSelectedList();
    updateProductoPreview();
  }

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

function recalcItemPrice(item) {
  if (item.tipo === 'coctel') {
    return calcularPrecioCoctel(item.size || 'pequeno', !!item.gomas, !!item.shot);
  }
  const prod = PRODUCTOS.find((p) => p.id === item.id);
  return prod ? prod.precio : 0;
}

function renderSelectedList() {
  const list = document.getElementById('selected-list');
  if (!list) return;
  const items = Object.values(modalSelected);
  if (!items.length) {
    list.innerHTML = '<div class="empty-state small">No hay productos seleccionados</div>';
    return;
  }

  list.innerHTML = items.map((it) => {
    const unit = recalcItemPrice(it);
    const price = unit * (it.cantidad || 1);
    const sizeHtml = it.tipo === 'coctel' ? `
      <div class="size-row" style="margin-top:6px;">
        <button class="size-btn ${it.size === 'pequeno' ? 'active' : ''}" data-key="${it.tipo}:${it.id}" data-size="pequeno">Pequeño</button>
        <button class="size-btn ${it.size === 'grande' ? 'active' : ''}" data-key="${it.tipo}:${it.id}" data-size="grande">Grande</button>
      </div>
      <div style="margin-top:6px;">
        <label style="margin-right:10px"><input type="checkbox" class="opt-gomas" data-key="${it.tipo}:${it.id}" ${it.gomas ? 'checked' : ''} /> Gomas</label>
        <label><input type="checkbox" class="opt-shot" data-key="${it.tipo}:${it.id}" ${it.shot ? 'checked' : ''} /> Shot</label>
      </div>
    ` : '';

    return `
      <div class="selected-item" data-key="${it.tipo}:${it.id}" style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.03)">
        <div style="flex:1">
          <div style="font-weight:600">${escapeHtml(it.nombre)}</div>
          ${sizeHtml}
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <button class="btn qty-minus" data-key="${it.tipo}:${it.id}">−</button>
          <div class="qty-value" data-key="${it.tipo}:${it.id}" style="min-width:20px;text-align:center">${it.cantidad}</div>
          <button class="btn qty-plus" data-key="${it.tipo}:${it.id}">+</button>
          <div style="min-width:90px;text-align:right">${formatCOP(price)}</div>
        </div>
      </div>
    `;
  }).join('');

  // attach listeners
  list.querySelectorAll('.qty-minus').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const it = modalSelected[key];
      if (!it) return;
      it.cantidad = Math.max(1, (it.cantidad || 1) - 1);
      renderSelectedList();
      updateProductoPreview();
    });
  });
  list.querySelectorAll('.qty-plus').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const it = modalSelected[key];
      if (!it) return;
      it.cantidad = (it.cantidad || 1) + 1;
      renderSelectedList();
      updateProductoPreview();
    });
  });

  list.querySelectorAll('.size-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const it = modalSelected[key];
      if (!it) return;
      it.size = btn.dataset.size;
      renderSelectedList();
      updateProductoPreview();
    });
  });

  list.querySelectorAll('.opt-gomas').forEach((chk) => {
    chk.addEventListener('change', () => {
      const key = chk.dataset.key;
      const it = modalSelected[key];
      if (!it) return;
      it.gomas = chk.checked;
      renderSelectedList();
      updateProductoPreview();
    });
  });
  list.querySelectorAll('.opt-shot').forEach((chk) => {
    chk.addEventListener('change', () => {
      const key = chk.dataset.key;
      const it = modalSelected[key];
      if (!it) return;
      it.shot = chk.checked;
      renderSelectedList();
      updateProductoPreview();
    });
  });

  // sync product buttons visual state
  const selector = document.getElementById('producto-selector');
  if (selector) {
    selector.querySelectorAll('.product-btn').forEach((b) => {
      const key = `${b.dataset.tipo}:${b.dataset.id}`;
      if (modalSelected[key]) b.classList.add('selected'); else b.classList.remove('selected');
    });
  }
}

function toggleCoctelOptions(show) {
  document.getElementById('coctel-options')?.classList.toggle('hidden', !show);
}

function updateProductoPreview() {
  // preview total from modalSelected
  const items = Object.values(modalSelected);
  let total = 0;
  if (items.length) {
    for (const it of items) {
      const unit = recalcItemPrice(it);
      total += unit * (it.cantidad || 1);
    }
  } else {
    // fallback to single-selection behavior
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
    total = unit * state.qty;
  }

  const preview = document.getElementById('producto-preview-price');
  if (preview) preview.textContent = formatCOP(total);

  // update global qty display only when single-selection mode
  const qtyEl = document.getElementById('qty-value');
  if (qtyEl) qtyEl.textContent = state.qty;
}

// onConfirmarProducto: add or edit
async function onConfirmarProducto() {
  const cuenta = state.cuentaActual;
  if (!cuenta || cuenta.estado === 'pagada') return;

  const items = Object.values(modalSelected);
  if (state.editingProducto) {
    // if editing, take first item from selection (user edits one product)
    if (!items.length) { showToast('Selecciona al menos un producto para editar', 'error'); return; }
    const it = items[0];
    const updates = {
      tipo: it.tipo,
      productoId: it.id,
      nombre: it.nombre,
      size: it.size,
      gomas: it.gomas,
      shot: it.shot,
      cantidad: it.cantidad,
      precioUnitario: recalcItemPrice(it),
      precioTotal: recalcItemPrice(it) * it.cantidad
    };
    try {
      await editarProducto(state.turno.id, cuenta.id, state.editingProducto.id, updates, cuenta.productos);
      closeModal();
    } catch (err) {
      showToast(err.message || 'Error editando producto', 'error');
    }
    return;
  }

  if (!items.length) { showToast('Selecciona al menos un producto', 'error'); return; }

  // Build all new product lines locally (single write)
  const newLines = items.map((it) => {
    const precioUnitario = recalcItemPrice(it);
    const line = {
      id: uuid(),
      tipo: it.tipo,
      productoId: it.id,
      nombre: it.nombre,
      size: it.size,
      gomas: it.gomas,
      shot: it.shot,
      cantidad: it.cantidad,
      precioUnitario,
      precioTotal: precioUnitario * it.cantidad
    };
    return recalcProductoLine(line);
  });

  // Compose final productos once
  const productosActuales = Array.isArray(cuenta.productos) ? cuenta.productos : [];
  const finalProductos = [...productosActuales, ...newLines];
  const finalTotal = calcCuentaTotal(finalProductos);

  // Close modal immediately for better UX
  closeModal();
  showToast('Guardando productos...', 'info');

  try {
    // Single update to avoid lost updates and make it faster
    await updateCuenta(state.turno.id, cuenta.id, {
      productos: finalProductos,
      total: finalTotal
    });
    showToast('Productos agregados', 'success');
    // Firestore subscription will update UI
  } catch (err) {
    console.error('Error guardando productos en lote:', err);
    showToast(err.message || 'Error agregando productos', 'error');
    // Optionally reopen modal to retry
    // openModal('producto');
  }
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
  await deleteTurno(turnoId);
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
