const CACHE_NAME = 'madyafa-pwa-cache-v3';

// Core shell assets to precache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
];

// Install Event - Pre-cache core shell safely without failing if one asset is missing
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Pre-cache item skipped/failed:', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean old caches & claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Smart routing for Next.js PWA & Offline Support
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Avoid handling non-http schemes (e.g. chrome-extension:)
  if (!url.protocol.startsWith('http')) return;

  // 1. API Requests: Let the network handle them, Dexie handles offline storage
  if (url.pathname.startsWith('/api/')) {
    // Network-only for API to prevent stale data mixing with local Dexie DB
    return;
  }

  // 2. Navigation Requests (HTML Pages like /, /dashboard, /workspace/[id], /index.html)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline navigation: try matching the exact requested URL
          const exactMatch = await caches.match(event.request);
          if (exactMatch) return exactMatch;

          // If navigation to /index.html was requested by an old install, return cached root
          if (url.pathname === '/index.html') {
            const rootMatch = await caches.match('/');
            if (rootMatch) return rootMatch;
          }

          // Fallback to cached dashboard, root, or login
          const dashboardMatch = await caches.match('/dashboard');
          if (dashboardMatch) return dashboardMatch;

          const rootFallback = await caches.match('/');
          if (rootFallback) return rootFallback;

          return caches.match('/login');
        })
    );
    return;
  }

  // 3. Static Next.js Bundles, CSS, JS Chunks, Images, Fonts
  // Strategy: Cache-first with background network update (Stale-While-Revalidate)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          /* Network failed, reliance on cache */
        });

      return cachedResponse || fetchPromise;
    })
  );
});
