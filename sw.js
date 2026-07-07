// Simple service worker: static asset caching with cache-first strategy.
// Place at project root: /sw.js
const CACHE_NAME = 'nebula-cache-v1';
const OFFLINE_URL = '/';
const ASSETS_TO_CACHE = [
  '/', // navigation fallback
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/lib/chart.min.js',
  '/js/app.js',
  '/js/utils.js',
  '/js/products.js',
  '/js/cuentas.js',
  '/js/turno.js',
  '/js/stats.js',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install: cache app shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .catch((err) => {
        // swallow to avoid blocking install completely
        console.error('SW install error caching assets', err);
      })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
        return Promise.resolve();
      })
    )).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Always allow non-GET through (Firestore/network requests)
  if (req.method !== 'GET') {
    return event.respondWith(fetch(req));
  }

  const url = new URL(req.url);

  // For navigation requests, try network first then fallback to cache (useful for updates)
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // For same-origin static assets, use cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // For cross-origin requests (CDN, API), try network then cache fallback
  event.respondWith(networkFirst(req));
});

// Cache-first strategy for static assets
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    // put a copy in cache (best-effort)
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    // fallback to offline page for navigations is handled elsewhere; here return cached or error
    return cached || Response.error();
  }
}

// Network-first strategy with cache fallback
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    // cache successful responses (only same-origin or static)
    if (response && response.ok && request.method === 'GET') {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // As last resort return offline index.html for navigations
    if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
      const fallback = await cache.match('/index.html') || cache.match('/');
      if (fallback) return fallback;
    }
    return Response.error();
  }
}

// Support skipWaiting via postMessage from client
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
