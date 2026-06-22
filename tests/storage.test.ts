/**
 * Unit tests for src/lib/storage.ts — the crash-proof localStorage layer.
 * Run: node --experimental-strip-types --test
 *
 * Node has no localStorage, so we install a controllable in-memory mock onto
 * globalThis before importing the module under test.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

// --- Controllable localStorage mock -----------------------------------------
class MockStorage {
  store = new Map<string, string>();
  failOnSet = false;
  getItem(k: string) { return this.store.has(k) ? this.store.get(k)! : null; }
  setItem(k: string, v: string) {
    if (this.failOnSet) {
      const e: any = new Error('QuotaExceededError');
      e.name = 'QuotaExceededError';
      throw e;
    }
    this.store.set(k, v);
  }
  removeItem(k: string) { this.store.delete(k); }
}

const mock = new MockStorage();
(globalThis as any).localStorage = mock;

const {
  safeGetString, safeSetString, safeRemove, safeGetJSON, safeSetJSON, isArray,
} = await import('../src/lib/storage.ts');

test('safeSetString / safeGetString round-trip', () => {
  assert.equal(safeSetString('k', 'hello'), true);
  assert.equal(safeGetString('k'), 'hello');
});

test('safeGetString returns fallback for a missing key', () => {
  assert.equal(safeGetString('missing', 'def'), 'def');
});

test('safeSetString returns false on quota exceeded (and does not throw)', () => {
  mock.failOnSet = true;
  assert.equal(safeSetString('big', 'x'), false);
  mock.failOnSet = false;
});

test('safeGetJSON round-trips structured values', () => {
  safeSetJSON('arr', [1, 2, 3]);
  assert.deepEqual(safeGetJSON('arr', []), [1, 2, 3]);
});

test('safeGetJSON returns fallback AND self-heals on corrupt JSON', () => {
  mock.store.set('corrupt', '{not valid json');
  const out = safeGetJSON('corrupt', ['fallback']);
  assert.deepEqual(out, ['fallback']);
  // The bad key must have been removed so the app can recover next load.
  assert.equal(mock.getItem('corrupt'), null);
});

test('safeGetJSON rejects values failing the validator and self-heals', () => {
  mock.store.set('notarray', JSON.stringify({ a: 1 }));
  const out = safeGetJSON('notarray', [], isArray);
  assert.deepEqual(out, []);
  assert.equal(mock.getItem('notarray'), null);
});

test('safeGetJSON accepts values passing the validator', () => {
  mock.store.set('good', JSON.stringify([{ id: 'x' }]));
  const out = safeGetJSON<any[]>('good', [], isArray);
  assert.deepEqual(out, [{ id: 'x' }]);
});

test('safeRemove deletes a key', () => {
  safeSetString('temp', '1');
  safeRemove('temp');
  assert.equal(safeGetString('temp', 'gone'), 'gone');
});

test('storage functions never throw when localStorage is absent', () => {
  // hasStorage() is evaluated on every call, so the already-imported functions
  // honour the deleted global — no fresh module import needed.
  const saved = (globalThis as any).localStorage;
  delete (globalThis as any).localStorage;
  try {
    assert.equal(safeGetString('x', 'fb'), 'fb');
    assert.equal(safeSetString('x', 'y'), false);
    assert.deepEqual(safeGetJSON('x', []), []);
  } finally {
    (globalThis as any).localStorage = saved;
  }
});
