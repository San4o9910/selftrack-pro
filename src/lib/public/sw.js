/* SelfTrack PRO — service worker (production-grade).
 *
 * Strategy summary (mirror of src/lib/swStrategy.ts, kept inline because this
 * file is shipped as-is and not bundled):
 *   - non-GET / cross-origin .......... passthrough (network)
 *   - navigations ..................... network-first, fall back to cached shell
 *   - /assets/<name>.<hash>.<ext> ..... cache-first (immutable, content-hashed)
 *   - other same-origin GET ........... stale-while-revalidate
 *
 * Guarantees:
 *   - Every fetch handler path resolves to a valid Response (never undefined).
 *   - A deploy is visible immediately (HTML is never served stale).
 *   - Offline navigations render the cached app shell instead of a crash.
 *   - Old caches are purged on activate (no cache poisoning / ghost assets).
 *   - The new worker does NOT auto-activate mid-session; it waits for an
 *     explicit SKIP_WAITING message from the page (no session corruption).
 */

const VERSION = 'v2';
const SHELL_CACHE = `selftrack-shell-${VERSION}`;
const RUNTIME_CACHE = `selftrack-runtime-${VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/apple-touch-icon.png',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
];

const OFFLINE_FALLBACK = '/index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.all(
        SHELL_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[sw] shell asset skipped:', url, err);
          }),
        ),
      ),
    ),
  );
  // No skipWaiting() here — the page decides when to apply the update.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isHashedAsset(url) {
  return /\/assets\/.+\.(js|css|woff2?|png|jpe?g|svg|gif|webp|ico)$/i.test(url.pathname);
}

async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch {
    const cached = (await caches.match(request)) || (await caches.match(OFFLINE_FALLBACK));
    return (
      cached ||
      new Response('<h1>Offline</h1>', {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh && (fresh.ok || fresh.type === 'opaque')) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch {
    return new Response('', { status: 504, statusText: 'Gateway Timeout' });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((fresh) => {
      if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
      return fresh;
    })
    .catch(() => null);
  return cached || (await network) || new Response('', { status: 504 });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }
  if (isHashedAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});
