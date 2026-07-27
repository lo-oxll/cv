// Minimal offline-first service worker for the static profile site.
// Bump CACHE_NAME whenever the cached file list changes to force a refresh.
const CACHE_NAME = 'ali-site-v3';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './favicon.jpeg',
  './apple-touch-icon.png',
  './avatar-96.webp',
  './avatar-128.webp',
  './avatar-256.webp',
  './avatar-96.jpeg',
  './avatar-128.jpeg',
  './avatar-256.jpeg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Network-first for the generated projects list (and the old GitHub
  // API path, kept here in case anything still references it) so the
  // project order/content stays fresh whenever the pins change.
  if (request.url.indexOf('projects.json') !== -1 || request.url.indexOf('api.github.com') !== -1) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for same-origin static assets, with a network fallback
  // that updates the cache for next time.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.ok && request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
