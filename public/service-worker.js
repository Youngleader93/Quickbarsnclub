/**
 * QuickBar Service Worker
 * Gère le cache pour le mode offline et les notifications
 */

const CACHE_NAME = 'quickbar-v1';
const STATIC_CACHE = 'quickbar-static-v1';

// Ressources à mettre en cache immédiatement
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Mise en cache des ressources statiques');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Installation terminée');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Erreur installation:', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Supprimer les anciens caches
              return cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation terminée');
        return self.clients.claim();
      })
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes Firebase (temps réel)
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebase.google.com')) {
    return;
  }

  // Stratégie: Network First avec fallback cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Mettre en cache la réponse si valide
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback sur le cache si offline
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Pour les pages de navigation, retourner index.html (SPA)
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }

          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Gestion des notifications push (pour futur)
self.addEventListener('push', (event) => {
  console.log('[SW] Push reçu:', event);

  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body || 'Nouvelle notification QuickBar',
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'quickbar-notification',
      requireInteraction: true,
      actions: [
        { action: 'open', title: 'Ouvrir' },
        { action: 'close', title: 'Fermer' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'QuickBar', options)
    );
  }
});

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Clic notification:', event);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Si une fenêtre est déjà ouverte, la focus
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Message du client
self.addEventListener('message', (event) => {
  console.log('[SW] Message reçu:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker chargé');
