export const COCTELES = [
  { id: 'sangre-de-marte', nombre: 'Sangre de Marte' },
  { id: 'nubo-estelar', nombre: 'Nubo Estelar' },
  { id: 'mora-cosmic', nombre: 'Mora Cosmic' },
  { id: 'plasma-green', nombre: 'Plasma Green' }
];

export const PRECIOS_COCTEL = {
  pequeno: 13000,
  grande: 16000
};

export const ADICIONES = {
  gomas: 2000,
  shot: 3000
};

export const PRODUCTOS = [
  { id: 'michelada', nombre: 'Michelada', precio: 7000 },
  { id: 'cerveza', nombre: 'Cerveza', precio: 5000 },
  { id: 'soda-saborizada', nombre: 'Soda saborizada', precio: 11000 },
  { id: 'maracumango', nombre: 'Maracumango', precio: 12000 },
  { id: 'cuates-enchilados', nombre: 'Cuates enchilados', precio: 16000 }
];

export const SIZE_LABELS = {
  pequeno: 'Pequeño',
  grande: 'Grande'
};

export function calcularPrecioCoctel(size, gomas, shot) {
  let precio = PRECIOS_COCTEL[size] || PRECIOS_COCTEL.pequeno;
  if (gomas) precio += ADICIONES.gomas;
  if (shot) precio += ADICIONES.shot;
  return precio;
}

export function getProductoById(id) {
  return PRODUCTOS.find((p) => p.id === id);
}

export function getCoctelById(id) {
  return COCTELES.find((c) => c.id === id);
}

export function productoLineKey(item) {
  if (item.tipo === 'coctel') {
    return `${item.productoId}_${item.size}_${item.gomas ? 'g' : ''}_${item.shot ? 's' : ''}`;
  }
  return item.productoId;
}

export function productoDisplayName(item) {
  if (item.tipo === 'coctel') {
    const parts = [item.nombre, SIZE_LABELS[item.size] || item.size];
    if (item.gomas) parts.push('Gomas');
    if (item.shot) parts.push('Shot');
    return parts.join(' · ');
  }
  return item.nombre;
}

export function aggregateProductStats(productos) {
  const productosVendidos = {};
  const coctelesVendidos = {};

  for (const item of productos) {
    const qty = item.cantidad || 1;
    if (item.tipo === 'coctel') {
      const key = productoDisplayName(item);
      coctelesVendidos[key] = (coctelesVendidos[key] || 0) + qty;
      productosVendidos[`Coctel: ${item.nombre}`] = (productosVendidos[`Coctel: ${item.nombre}`] || 0) + qty;
    } else {
      productosVendidos[item.nombre] = (productosVendidos[item.nombre] || 0) + qty;
    }
  }

  return { productosVendidos, coctelesVendidos };
}

export function flattenCuentaProductos(cuentas) {
  const all = [];
  for (const cuenta of cuentas) {
    for (const p of cuenta.productos || []) {
      for (let i = 0; i < (p.cantidad || 1); i++) {
        all.push(p);
      }
    }
  }
  return all;
}
