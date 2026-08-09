/* Zozo Nepal - Service Worker for Push Notifications & Offline Support */
const CACHE_NAME = 'zozonepal-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/product.html',
  '/checkout.html',
  '/admin.html',
  '/zozonepal.png',
  '/favicon.png',
  '/favicon.ico'
];

// Service Worker Install
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Cache addAll non-fatal warning:', err);
      });
    })
  );
});

// Service Worker Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interceptor for offline support (Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Push Notification Event Listener (Web Push API)
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Zozo Nepal Update 🛍️',
    body: 'You have a new update regarding your order or exclusive promotional offer!',
    icon: '/zozonepal.png',
    badge: '/zozonepal.png',
    tag: 'zozo-notification',
    data: { url: '/index.html', type: 'general' },
    actions: [
      { action: 'open_url', title: '🛍️ View Details' },
      { action: 'dismiss', title: '✕ Dismiss' }
    ]
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      notificationData = { ...notificationData, ...parsed };
      if (parsed.data) {
        notificationData.data = { ...notificationData.data, ...parsed.data };
      }
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/zozonepal.png',
    badge: notificationData.badge || '/zozonepal.png',
    tag: notificationData.tag || 'zozo-general',
    data: notificationData.data,
    vibrate: [100, 50, 100, 50, 100],
    requireInteraction: notificationData.requireInteraction || false,
    actions: notificationData.actions || [
      { action: 'open_url', title: '🛍️ View Details' },
      { action: 'dismiss', title: '✕ Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification Click Event Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with this URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl || client.url.includes(location.origin)) {
          if ('focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Client PostMessage Handler for local / simulated push dispatches
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'TRIGGER_PUSH_NOTIFICATION') {
    const payload = event.data.payload || {};
    const title = payload.title || 'Zozo Nepal Update';
    const options = {
      body: payload.body || 'New update available!',
      icon: payload.icon || '/zozonepal.png',
      badge: payload.badge || '/zozonepal.png',
      tag: payload.tag || ('zozo-tag-' + Date.now()),
      data: payload.data || { url: '/index.html' },
      vibrate: [100, 50, 100],
      actions: payload.actions || [
        { action: 'open_url', title: '🛍️ Open Details' },
        { action: 'dismiss', title: '✕ Dismiss' }
      ]
    };

    self.registration.showNotification(title, options);
  }
});
