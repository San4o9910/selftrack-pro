/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure caching-strategy classifier for the service worker.
 *
 * This is the single, unit-tested source of truth for "given a request, which
 * caching strategy applies". The actual service worker (public/sw.js) is a
 * standalone script that is NOT processed by the bundler, so it inlines an
 * identical copy of this logic. Keeping this pure version lets us assert the
 * behaviour in `node --test` without a browser. If you change one, change both
 * and the tests will tell you if they diverge in spirit.
 */

export type Strategy =
  | 'passthrough'        // non-GET or cross-origin: let the network handle it
  | 'network-first'      // navigations: fresh HTML, fall back to cached shell
  | 'cache-first'        // content-hashed immutable build assets
  | 'stale-while-revalidate'; // other same-origin GETs (icons, manifest)

export interface RequestLike {
  method: string;
  url: string;
  mode?: string;
  destination?: string;
}

/**
 * @param req     the request descriptor
 * @param origin  the service worker's own origin (self.location.origin)
 */
export function classifyRequest(req: RequestLike, origin: string): Strategy {
  if (req.method !== 'GET') return 'passthrough';

  let sameOrigin = false;
  try {
    sameOrigin = new URL(req.url).origin === origin;
  } catch {
    sameOrigin = false;
  }
  if (!sameOrigin) return 'passthrough';

  // Navigations: always prefer fresh markup so a deploy is never invisible.
  if (req.mode === 'navigate' || req.destination === 'document') {
    return 'network-first';
  }

  // Vite emits content-hashed files under /assets/ (e.g. index-mRPHtjVI.js).
  // The hash alphabet is base64url, not hex, so we don't try to match the hash
  // itself — any fingerprintable static asset under /assets/ is immutable and
  // safe to cache-first.
  if (/\/assets\/.+\.(js|css|woff2?|png|jpe?g|svg|gif|webp|ico)$/i.test(new URL(req.url).pathname)) {
    return 'cache-first';
  }

  // Everything else same-origin (manifest, root icons): serve fast, refresh in bg.
  return 'stale-while-revalidate';
}
