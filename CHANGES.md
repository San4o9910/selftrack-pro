# SelfTrack PRO — Hardening changelog

Production-readiness pass. Scope: runtime stability, PWA correctness, data
integrity, server hardening, privacy, and a runnable test layer.

## Reliability / crash-proofing
- **NEW `src/components/ErrorBoundary.tsx`** — top-level boundary. Any render
  exception now shows a recoverable fallback (RU/EN) instead of unmounting the
  whole tree to a white screen. "Try again" clears only the volatile AI-advice
  cache, never user data. Wired in `src/main.tsx`.
- **NEW `src/lib/storage.ts`** — total, never-throwing localStorage layer with
  shape validation and self-healing. Fixes the most severe defect: a single
  corrupted persisted value made `App` fail to mount **permanently** (raw
  `JSON.parse` in `useState` initializers threw on every reload). Writes now
  swallow `QuotaExceededError` (Safari Private / iOS standalone) instead of
  throwing inside effects.
- `src/App.tsx` — all 6 collection initializers + 6 persistence effects + all
  string settings routed through the safe layer.

## PWA — service worker rewrite (`public/sw.js`, mirrored to `dist/` + iOS)
Previous SW: cached only 3 shell files, **never cached fetched assets** (app was
blank offline), was **cache-first on HTML** (permanently stale app after deploy),
and returned `undefined` on miss (a TypeError). Replaced with:
- versioned shell + runtime caches, old caches purged on activate;
- **network-first** navigations with offline-shell fallback;
- **cache-first** for content-hashed `/assets/*` (with runtime population);
- **stale-while-revalidate** for other same-origin GETs;
- every path returns a valid `Response`;
- controlled update flow via `SKIP_WAITING` message — no mid-session asset swap.
- `index.html` registration rewritten with a safe update handshake + single
  reload on `controllerchange`.
- **NEW `src/lib/swStrategy.ts`** — pure, unit-tested classifier (source of truth).

## Server (`server.ts`)
- `express.json({ limit: '256kb' })` body cap; basic security headers.
- Input validation/coercion (`asArray`, bounded) before reaching Gemini.
- Graceful fallback to local rule-based advice on empty/unparseable/malformed
  model output instead of a 500 that breaks the UI.
- Verified `gemini-3.5-flash` is a current GA model — intentionally **not** changed.

## Data integrity / correctness
- `AnalyticsView` — cache via safe layer; runtime `isAdviceData` guard on both
  cache and network payloads; StrictMode double-fetch guard (`useRef`).
- `applyPeriod` — "month"/"year" now use true period boundaries (start of
  month/year) instead of `shift(-30)`/`shift(-365)` approximations.

## UI / styling
- `src/index.css` — registered ~12 missing in-between palette shades
  (`stone-550`, `stone-850`, `slate-850`, …) in `@theme`. These ~100 utility
  usages previously generated no CSS and the intended colors silently vanished.

## Privacy
- Removed a real-looking name/email (`Sanj Narmatov` / `sanj.narmatov@gmail.com`)
  shipped as defaults, placeholders, and reset values across `App.tsx`,
  `Header.tsx`, `SettingsView.tsx`. Defaults are now empty/generic.

## Tests
- **NEW `tests/`** — 33 passing unit tests (`npm test`, Node-native, no install)
  plus `tests/README.md` with the manual QA/chaos checklist.

## Audited and intentionally left unchanged (no bug)
- Expense/weight number inputs already guard `NaN`/non-positive.
- Both weight/mood charts already guard `< 2` points and flat-data zero-range.
- Metric updaters already use functional `setState` (no rapid-fire races).
