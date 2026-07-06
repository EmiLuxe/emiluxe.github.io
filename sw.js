const CACHE = 'bar-facturacion-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/config.js',
  './js/firebase-init.js',
  './js/products.js',
  './js/utils.js',
  './js/turno.js',
  './js/cuentas.js',
  './js/stats.js',
  './js/lib/chart.min.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  
  // Permite que Firebase y Google se carguen desde la red
  if (url.origin.includes('googleapis.com') || url.origin.includes('gstatic.com')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  
  // Todos los demás archivos: primero intenta caché, luego red
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached || fetch(e.request).then((res) => {
        if (res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
    ).catch(() => caches.match(e.request))
  );
});
