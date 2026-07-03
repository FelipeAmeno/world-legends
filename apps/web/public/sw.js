/**
 * public/sw.js — World Legends Service Worker (T070)
 *
 * Estratégias de cache:
 *   - Static assets (_next/static/*): Cache-First (imutáveis)
 *   - Páginas app: Network-First com fallback cache
 *   - API calls: Network-Only (dados sempre frescos)
 *   - Offline: servir página de fallback
 *
 * Cache version: incrementar ao mudar qualquer asset
 */

const CACHE_VERSION   = 'wl-v1';
const STATIC_CACHE    = `${CACHE_VERSION}-static`;
const PAGES_CACHE     = `${CACHE_VERSION}-pages`;
const OFFLINE_URL     = '/offline';

// Recursos pré-cacheados no install
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon.svg',
];

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Remover caches antigos
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith('wl-') && !key.startsWith(CACHE_VERSION))
            .map(key => caches.delete(key)),
        ),
      ),
      // Tomar controle imediatamente
      self.clients.claim(),
    ]),
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests não-HTTP
  if (!url.protocol.startsWith('http')) return;

  // Ignorar requests de outras origens (Supabase, PostHog, Sentry)
  if (url.origin !== self.location.origin) return;

  // API routes: sempre da rede
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/monitoring')) {
    event.respondWith(fetch(request));
    return;
  }

  // Assets estáticos: Cache-First (Next.js adiciona hash ao nome)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Fontes e ícones: Cache-First de longa duração
  if (url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Páginas HTML: Network-First com fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Resto: Network-First
  event.respondWith(networkFirst(request, PAGES_CACHE));
});

// ─── Estratégias ─────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Network error', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Tentar cache da página específica
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback: página offline
    const offlinePage = await caches.match(OFFLINE_URL);
    return offlinePage ?? new Response('<h1>Offline</h1>', {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

// ─── Push Notifications (futuro) ─────────────────────────────────────────────

self.addEventListener('push', event => {
  if (!event.data) return;
  const { title, body, icon, data } = event.data.json();

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:    icon ?? '/icons/icon-192.png',
      badge:   '/icons/icon-72.png',
      data,
      vibrate: [200, 100, 200],
      actions: data?.action
        ? [{ action:'open', title:data.action }]
        : [],
    }),
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.href ?? '/';
  event.waitUntil(
    clients.matchAll({ type:'window' }).then(windowClients => {
      const existing = windowClients.find(c => c.url === url);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    }),
  );
});
