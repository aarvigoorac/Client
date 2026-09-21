const CACHE_NAME = 'aarvi-stores-v1';

// All the core shell files and views required for offline/instant loading
const APP_SHELL = [
  './',
  './index.html',
  './config.js',
  './manifest.json',
  './images/icon.png',
  './pages/login.html',
  './pages/home.html',
  './pages/search.html',
  './pages/cart.html',
  './pages/orders.html',
  './pages/account.html'
];

// 1. Install Event: Cache the App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching App Shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up old caches if the version changes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Serve from Cache, Fallback to Network
self.addEventListener('fetch', (event) => {
  // IMPORTANT: Only intercept requests for your own domain's static files.
  // This allows Firebase API calls and Cloudinary image fetches to bypass the cache seamlessly.
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip POST requests (like form submissions or specific API calls)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return the cached file if found
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise, fetch from the network
        return fetch(event.request).then((networkResponse) => {
          // Optional: Dynamically cache new local files as they are fetched
          // (Disabled here to strictly control the cache via APP_SHELL, but can be enabled if needed)
          return networkResponse;
        }).catch(() => {
          // If both cache and network fail (user is fully offline on a page they haven't visited)
          // You could return a custom offline.html fallback here if you create one
          console.log('[Service Worker] Fetch failed; returning offline fallback if available.');
        });
      })
  );
});
