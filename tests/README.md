# SelfTrack PRO — Test & QA layer

## Automated unit tests

Run (no `npm install` required — uses Node ≥22 native TypeScript stripping + test runner):

```bash
npm test
# or directly:
node --experimental-strip-types --test "tests/*.test.ts"
```

| File | Covers | Notable chaos cases |
|------|--------|---------------------|
| `tests/utils.test.ts` | `ymd`, `today`, `shift`, `computeStreak`, `calGrid`, `sleepDuration`, `rub`, `pcolor` | streak grace-day & gaps, duplicate dates, leap-year February, Monday-aligned grid, overnight sleep, invalid time strings |
| `tests/swStrategy.test.ts` | `classifyRequest` (service-worker caching policy) | non-GET passthrough, cross-origin passthrough, navigation network-first, hashed-asset cache-first, malformed URL never throws |
| `tests/storage.test.ts` | `safeGet*/safeSet*/safeGetJSON` | **corrupt JSON self-heal**, **quota-exceeded write**, validator rejection, `localStorage` entirely absent |

All 33 assertions pass. The SW strategy is unit-tested via the pure
`src/lib/swStrategy.ts`; `public/sw.js` inlines the identical logic (it ships
unbundled), so keep the two in sync.

## What is NOT automated here (and why)

A browser/integration/e2e suite (Playwright/Vitest + jsdom) and the Express
endpoint test require `npm install` and a runtime that wasn't available in the
hardening environment. They are the recommended next CI step. Below is the
manual checklist that substitutes for them until that CI exists.

## Manual QA / chaos checklist

Reliability-critical paths to verify in a real browser (DevTools → Application/Network):

1. **Corrupt-data recovery**: in DevTools, set `localStorage.selfTrack_events = "{bad"`, reload → app still mounts (key is auto-cleared), no white screen.
2. **Quota**: fill `localStorage` near the limit, add an expense → no uncaught exception; UI keeps working (write silently degrades).
3. **Render failure containment**: throw inside a view → `ErrorBoundary` fallback appears with "Продолжить / Перезагрузить", not a blank page.
4. **Offline cold start**: load once online, go offline (Network → Offline), reload → app shell renders from cache (not the browser dino).
5. **Offline navigation**: offline, switch tabs and reopen → no crash, cached shell served.
6. **Deploy freshness**: change a file, rebuild, reload → new HTML is fetched (network-first), the SW activates via the `SKIP_WAITING` handshake, page reloads once to a coherent state (no half-updated asset mix).
7. **Slow 3G**: throttle to Slow 3G, open Analytics → loading state shows, AI advice resolves or falls back to local advice (server never 500s the UI).
8. **AI endpoint without key**: unset `GEMINI_API_KEY` → `/api/ai-advisor` returns rule-based advice, UI populated.
9. **Empty datasets**: fresh profile (no events/metrics/expenses) → every view renders, charts show "надо больше данных" instead of erroring.
10. **Rapid-fire input**: spam-tap habit/task toggles and tab swipes → state stays consistent (functional `setState` updaters), no lost/duplicated updates.
11. **Tab reload spam**: hard-reload repeatedly → no double-fetch of AI advice (StrictMode guard), no console errors.
