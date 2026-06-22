/**
 * Unit tests for src/lib/swStrategy.ts — the service-worker caching classifier.
 * Run: node --experimental-strip-types --test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyRequest } from '../src/lib/swStrategy.ts';

const ORIGIN = 'https://app.selftrack.test';

test('non-GET requests pass through to the network', () => {
  assert.equal(classifyRequest({ method: 'POST', url: `${ORIGIN}/api/ai-advisor` }, ORIGIN), 'passthrough');
  assert.equal(classifyRequest({ method: 'PUT', url: `${ORIGIN}/x` }, ORIGIN), 'passthrough');
});

test('cross-origin GETs pass through (no opaque cache bloat)', () => {
  assert.equal(
    classifyRequest({ method: 'GET', url: 'https://fonts.googleapis.com/css2?family=Inter' }, ORIGIN),
    'passthrough',
  );
});

test('navigations use network-first (fresh HTML, never stale app)', () => {
  assert.equal(
    classifyRequest({ method: 'GET', url: `${ORIGIN}/`, mode: 'navigate' }, ORIGIN),
    'network-first',
  );
  assert.equal(
    classifyRequest({ method: 'GET', url: `${ORIGIN}/calendar`, destination: 'document' }, ORIGIN),
    'network-first',
  );
});

test('content-hashed build assets use cache-first', () => {
  assert.equal(
    classifyRequest({ method: 'GET', url: `${ORIGIN}/assets/index-mRPHtjVI.js` }, ORIGIN),
    'cache-first',
  );
  assert.equal(
    classifyRequest({ method: 'GET', url: `${ORIGIN}/assets/index-DVSQkXXs.css` }, ORIGIN),
    'cache-first',
  );
  assert.equal(
    classifyRequest({ method: 'GET', url: `${ORIGIN}/assets/logo-O6gfvCXs.jpg` }, ORIGIN),
    'cache-first',
  );
});

test('non-hashed same-origin assets use stale-while-revalidate', () => {
  assert.equal(
    classifyRequest({ method: 'GET', url: `${ORIGIN}/manifest.json` }, ORIGIN),
    'stale-while-revalidate',
  );
  assert.equal(
    classifyRequest({ method: 'GET', url: `${ORIGIN}/pwa-icon-192.png` }, ORIGIN),
    'stale-while-revalidate',
  );
});

test('a malformed URL never throws and degrades to passthrough', () => {
  assert.equal(classifyRequest({ method: 'GET', url: 'not-a-url' }, ORIGIN), 'passthrough');
});
