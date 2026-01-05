// Urutix Service Worker
const CACHE_NAME = 'urutix-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API calls (always fetch fresh)
  if (event.request.url.includes('/api/')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return cached response
        if (response) {
          // Update cache in background
          fetch(event.request).then((fetchResponse) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, fetchResponse.clone());
            });
          });
          return response;
        }

        // Network request
        return fetch(event.request).then((fetchResponse) => {
          // Don't cache if not a valid response
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse;
          }

          // Clone the response
          const responseToCache = fetchResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return fetchResponse;
        });
      })
      .catch(() => {
        // Offline fallback
        return caches.match('/index.html');
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    tag: 'urutix-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Urutix', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-shipments') {
    event.waitUntil(syncShipments());
  }
});

// Helper function for background sync
async function syncShipments() {
  try {
    // Sync logic here
    console.log('[Service Worker] Background sync completed');
  } catch (error) {
    console.error('[Service Worker] Background sync failed:', error);
  }
}

