const CACHE = 'cr2-pwa-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event?.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, resClone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});

// Push notification handling
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'ControlRoom Notification';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/images/Coin-logo.png',
    badge: '/images/badge-72x72.svg',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: data.requireInteraction || true,
    silent: data.silent || false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  if (action === 'dismiss') {
    return;
  }

  // Default action: open the app
  const urlToOpen = data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICKED', data });
            return client.focus();
          }
        }
        // Open new window if none exists
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close handling
self.addEventListener('notificationclose', (event) => {
  // Can track notification dismissal analytics here
});

// Push subscription change handling
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    fetch('/push/resubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': self.csrfToken || '',
      },
      body: JSON.stringify({
        old_endpoint: event.oldSubscription?.endpoint,
      }),
    }).catch((err) => {
      console.error('Failed to resubscribe:', err);
    })
  );
});
