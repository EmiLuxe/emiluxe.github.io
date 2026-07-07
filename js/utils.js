export function formatCOP(amount) {
  const n = Math.round(Number(amount) || 0);
  return '$' + n.toLocaleString('es-CO');
}

export function nowDateStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function nowTimeStr() {
  const d = new Date();
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}

export function calcCuentaTotal(productos) {
  return (productos || []).reduce((sum, p) => sum + (p.precioTotal || 0), 0);
}

export function recalcProductoLine(item) {
  const qty = Math.max(1, item.cantidad || 1);
  item.cantidad = qty;
  item.precioTotal = (item.precioUnitario || 0) * qty;
  return item;
}

export function formatDuration(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfWeek(date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

export function endOfWeek(date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  return endOfDay(d);
}

export function startOfMonth(date) {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

export function endOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return d;
}

export function startOfYear(date) {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export function endOfYear(date) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

export function showToast(msg, type = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast show ' + type;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.className = 'toast hidden'; }, 2800);
}

export function showView(id) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

export function openModal(name) {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
  const modal = document.getElementById('modal-' + name);
  if (modal) modal.classList.remove('hidden');
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('hidden');
  document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
}

export function confirmDialog(title, message) {
  return new Promise((resolve) => {
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    openModal('confirm');
    const btn = document.getElementById('btn-confirm-action');
    const handler = () => {
      btn.removeEventListener('click', handler);
      closeModal();
      resolve(true);
    };
    if (btn) btn.addEventListener('click', handler);
    const cancel = document.querySelector('#modal-confirm .modal-cancel');
    const cancelHandler = () => {
      if (cancel) cancel.removeEventListener('click', cancelHandler);
      closeModal();
      resolve(false);
    };
    if (cancel) cancel.addEventListener('click', cancelHandler);
  });
}
