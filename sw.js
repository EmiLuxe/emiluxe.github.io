// sw.js (recomendado)
const CACHE = 'bar-facturacion-v3';
const ASSETS = [
  './index.html',
  './manifest.json',
  './css/styles.css',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Assets estáticos que podemos servir cache-first
const STATIC_CACHE = new Set(ASSETS);

// Durante la instalación cacheamos solo los assets estáticos (no los módulos JS)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        // No romper la instalación si algo falla; registrar para diagnóstico
        console.warn('SW install cache error', err);
      })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Helper: network-first with cache fallback
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok && request.url.startsWith(self.location.origin)) {
      const clone = response.clone();
      const cache = await caches.open(CACHE);
      cache.put(request, clone);
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // si no hay cached devolver index.html para navegaciones
    if (request.mode === 'navigate') {
      return caches.match('./index.html');
    }
    throw err;
  }
}

// Helper: cache-first
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok && request.url.startsWith(self.location.origin)) {
    const clone = response.clone();
    const cache = await caches.open(CACHE);
    cache.put(request, clone);
  }
  return response;
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // For Google / GStatic resources: use network-first (do not serve stale cached firebase libs)
  if (url.origin.includes('googleapis.com') || url.origin.includes('gstatic.com')) {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // Navigation requests (page loads): network-first, fallback to cached index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(networkFirst(e.request).catch(() => caches.match('./index.html')));
    return;
  }

  // Scripts / modules (type=module) and HTML: network-first
  const dest = e.request.destination || '';
  if (dest === 'script' || dest === 'document' || e.request.url.endsWith('.js') || e.request.url.endsWith('.html')) {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // Static assets (css, images): cache-first
  if (dest === 'style' || dest === 'image' || e.request.url.endsWith('.css') || e.request.url.match(/\.(png|svg|jpg|jpeg|webp|ico)$/)) {
    e.respondWith(cacheFirst(e.request));
    return;
  }

  // Fallback: try cache first then network
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
