/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Safe localStorage access layer.
 *
 * Rationale: the previous code called `JSON.parse(localStorage.getItem(...))`
 * directly inside React `useState` initializers. If ANY persisted value became
 * corrupted (truncated write, quota-evicted entry, manual tampering, a half-
 * finished sync), the parse threw synchronously during render and the whole
 * <App/> failed to mount — a permanent, unrecoverable white screen on every
 * reload. Writes had the same problem: `setItem` throws on quota-exceeded
 * (common in Safari Private Mode / iOS standalone) and the throw escaped an
 * effect.
 *
 * Every function here is total: it never throws. Reads validate the decoded
 * shape and fall back (and self-heal by clearing the bad key) when invalid.
 * Writes swallow quota/security errors and report success/failure as a boolean.
 */

function hasStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    // Accessing localStorage can itself throw (e.g. disabled cookies / sandbox).
    return false;
  }
}

/** Read a raw string. Never throws. */
export function safeGetString(key: string, fallback = ''): string {
  if (!hasStorage()) return fallback;
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
}

/** Write a raw string. Returns false on failure (e.g. quota exceeded). */
export function safeSetString(key: string, value: string): boolean {
  if (!hasStorage()) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    // QuotaExceededError / SecurityError — degrade gracefully, do not crash.
    console.warn(`[storage] failed to persist "${key}"`, err);
    return false;
  }
}

export function safeRemove(key: string): void {
  if (!hasStorage()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Read and JSON-decode a value with shape validation.
 *
 * @param key       storage key
 * @param fallback  value returned when missing / corrupt / invalid
 * @param validate  optional predicate; when it returns false the stored value
 *                  is treated as corrupt, removed, and `fallback` is returned.
 */
export function safeGetJSON<T>(
  key: string,
  fallback: T,
  validate?: (value: unknown) => value is T,
): T {
  if (!hasStorage()) return fallback;

  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return fallback;
  }
  if (raw === null) return fallback;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Corrupt JSON — self-heal so the app can recover on next load.
    safeRemove(key);
    return fallback;
  }

  if (validate && !validate(parsed)) {
    safeRemove(key);
    return fallback;
  }
  return parsed as T;
}

/** JSON-encode and persist. Returns false on failure. */
export function safeSetJSON(key: string, value: unknown): boolean {
  let encoded: string;
  try {
    encoded = JSON.stringify(value);
  } catch (err) {
    console.warn(`[storage] failed to serialize "${key}"`, err);
    return false;
  }
  return safeSetString(key, encoded);
}

/** Convenience validator for the app's array-shaped collections. */
export function isArray<T = unknown>(v: unknown): v is T[] {
  return Array.isArray(v);
}
