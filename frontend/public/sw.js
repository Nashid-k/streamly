const CACHE_NAME = 'streamly-v7';

self.addEventListener('install', (event) => {
  // Skip waiting — activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete ALL old caches, then claim all clients
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Listen for version check messages from the page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // Network-first for API calls and HTML navigations
  if (event.request.url.includes('/api/') || event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Network-first for JS/CSS assets (always fetch latest, fall back to cache)
  if (event.request.url.match(/\.(js|css)$/)) {
    event.respondWith(
      fetch(event.request).then((response) => {
        // Update cache with fresh version
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for images
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      });
    })
  );
});
