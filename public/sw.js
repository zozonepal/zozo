// Service Worker for Zozo Nepal - Offline Caching & Background Device Notifications (Mobile & Laptop)
const CACHE_NAME = 'zozo-cache-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/product.html',
  '/checkout.html',
  '/admin.html',
  '/manifest.json',
  '/zozonepal.png',
  '/sw-push-manager.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('SW pre-cache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => response)
      .catch(() => caches.match(event.request))
  );
});

// --- NATIVE DEVICE NOTIFICATION EVENT HANDLERS (OUTSIDE OF WEBSITE) ---

// 1. Push Event Handler (for web push server payloads)
self.addEventListener('push', (event) => {
  let data = {
    title: '🛍️ Zozo Nepal Order Alert',
    body: 'New order activity registered in store.',
    url: '/admin.html',
    tag: 'zozo-order-alert'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = Object.assign(data, parsed);
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/zozonepal.png',
    badge: data.badge || '/zozonepal.png',
    vibrate: data.vibrate || [300, 100, 300, 100, 300],
    tag: data.tag || 'zozo-order-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/admin.html',
      orderId: data.orderId || null,
      timestamp: Date.now()
    },
    actions: [
      { action: 'view', title: '👁️ View Order' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// 2. Client Message Handler (Triggered from window tabs for direct OS notification)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_DEVICE_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// 3. Native Notification Click Handler (Directs mobile/laptop users to the order)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }

  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/admin.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if an existing open tab can be focused
      for (const client of windowClients) {
        if (client.url && (client.url.includes('admin.html') || client.url.includes(targetUrl.split('?')[0])) && 'focus' in client) {
          client.postMessage({
            type: 'ZOZO_NOTIFICATION_OPEN_ORDER',
            orderId: notificationData.orderId,
            url: targetUrl
          });
          return client.focus();
        }
      }
      // If no matching window open, launch a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
