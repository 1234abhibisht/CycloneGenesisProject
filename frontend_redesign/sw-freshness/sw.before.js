// Cyclone AI - Service Worker for PWA Offline Support
const _CACHE_NAME = 'cyclone-ai-v1';
const STATIC_CACHE = 'cyclone-ai-static-v1';
const DYNAMIC_CACHE = 'cyclone-ai-dynamic-v1';
const OFFLINE_CACHE = 'cyclone-ai-offline-v1';

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/badge-72.png',
  '/icons/alert-192.png',
];

const OFFLINE_PAGES = [
  '/offline',
  '/dashboard/offline',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS)),
      caches.open(OFFLINE_CACHE).then(cache => cache.addAll(OFFLINE_PAGES)),
    ]).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== OFFLINE_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first for API, cache first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // API requests - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
    return;
  }

  // Map tiles - cache first with network fallback
  if (url.hostname.includes('tile') || url.pathname.includes('/tiles/')) {
    event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE));
    return;
  }

  // Static assets - cache first
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'image' || request.destination === 'font') {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // HTML pages - network first with offline fallback
  if (request.destination === 'document') {
    event.respondWith(networkFirstWithOfflineStrategy(request));
    return;
  }

  // Default - network first
  event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

// Cache first strategy
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      const offlineCache = await caches.open(OFFLINE_CACHE);
      return offlineCache.match('/offline') || new Response('Offline', { status: 503 });
    }
    throw new Error('Network error');
  }
}

// Network first strategy
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw new Error('Network error');
  }
}

// Network first with offline fallback
async function networkFirstWithOfflineStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineCache = await caches.open(OFFLINE_CACHE);
    return offlineCache.match('/offline') || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/html' } });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-alerts') {
    event.waitUntil(syncAlerts());
  }
  if (event.tag === 'sync-location') {
    event.waitUntil(syncLocation());
  }
});

async function syncAlerts() {
  try {
    const db = await openDB();
    const tx = db.transaction('pending-alerts', 'readwrite');
    const store = tx.objectStore('pending-alerts');
    const alerts = await store.getAll();
    
    for (const alert of alerts) {
      try {
        await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert),
        });
        await store.delete(alert.id);
      } catch {
        // Keep in queue for next sync
      }
    }
  } catch (error) {
    console.error('Sync alerts failed:', error);
  }
}

async function syncLocation() {
  try {
    const db = await openDB();
    const tx = db.transaction('pending-location', 'readwrite');
    const store = tx.objectStore('pending-location');
    const locations = await store.getAll();
    
    for (const location of locations) {
      try {
        await fetch('/api/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(location),
        });
        await store.delete(location.id);
      } catch {
        // Keep in queue
      }
    }
  } catch (error) {
    console.error('Sync location failed:', error);
  }
}

// IndexedDB for offline storage
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CycloneAI-Offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-alerts')) {
        db.createObjectStore('pending-alerts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-location')) {
        db.createObjectStore('pending-location', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cached-data')) {
        db.createObjectStore('cached-data', { keyPath: 'key' });
      }
    };
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.message,
    icon: '/icons/alert-192.png',
    badge: '/icons/badge-72.png',
    tag: data.id || 'cyclone-alert',
    requireInteraction: data.severity === 'critical' || data.severity === 'danger',
    actions: data.actions?.map((a) => ({ action: a.type, title: a.label })) || [],
    data: { alertId: data.id, url: data.url },
    vibrate: getVibrationPattern(data.severity),
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

function getVibrationPattern(severity) {
  const patterns = {
    info: [100],
    watch: [200, 100, 200],
    warning: [300, 100, 300, 100, 300],
    danger: [500, 100, 500, 100, 500, 100, 500],
    critical: [1000, 200, 1000, 200, 1000],
  };
  return patterns[severity] || [200];
}

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  const url = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Periodic background sync for data updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cyclone-data') {
    event.waitUntil(updateCycloneData());
  }
});

async function updateCycloneData() {
  try {
    const response = await fetch('/api/cyclones/active');
    if (response.ok) {
      const data = await response.json();
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put('/api/cyclones/active', new Response(JSON.stringify(data)));
      
      // Notify clients
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({ type: 'CYCLONE_DATA_UPDATED', data });
      });
    }
  } catch (error) {
    console.error('Periodic sync failed:', error);
  }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'CACHE_CYCLONE_DATA') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then(cache => 
        cache.put('/api/cyclones/active', new Response(JSON.stringify(event.data.data)))
      )
    );
  }
  
  if (event.data?.type === 'GET_CACHED_DATA') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then(cache => 
        cache.match(event.data.key).then(response => {
          if (response) {
            response.json().then(data => {
              event.ports[0].postMessage({ data });
            });
          }
        })
      )
    );
  }
});