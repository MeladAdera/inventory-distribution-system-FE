# Feature: Offline-First PWA (Shop Inventory)

**Status**: ✅ Implemented — build/lint/serve verified; runtime offline flow not yet device-tested
**Created Date**: 2026-07-05
**Last Updated**: 2026-07-06
**Assignee**: Melad Adera

---

## 📋 Overview

### Purpose
The shop-owner inventory page (`/client/inventory`) now works with **zero connectivity from a cold start** — installable to the home screen, opens in airplane mode, and lets the owner adjust stock (both increases and decreases) completely offline. Changes sync automatically on reconnect; the server stays the source of truth, so anything that would go invalid on sync (e.g. pushing stock negative) surfaces as a conflict for manual resolution instead of being silently dropped or forced through.

### Business Value
Shop owners in areas with unreliable connectivity can keep working — counting stock, recording sales — without losing changes or blocking on a signal. No feature (beyond this scope) was removed or degraded for online users.

### Key Stakeholders
`SHOP_OWNER` — the only role this page serves. Nothing here touches the admin/warehouse inventory page (though the sync engine was placed in `shared/inventory` so that page could reuse it later).

---

## 🏗️ Architecture

### File Structure
```
src/app/
├── manifest.ts                          # Web app manifest (installability)
├── sw.ts                                 # Service worker source (Serwist)
└── layout.tsx                            # viewport/themeColor, apple-touch-icon, favicon

src/common/offline/                       # Domain-agnostic — no inventory/receipt knowledge
├── engine/createSyncQueueEngine.ts        # Generic FIFO queue: enqueue/flush/subscribe, Web Locks
├── storage/
│   ├── idbStorage.ts                      # AsyncStorage adapter → IndexedDB (query cache)
│   └── syncQueueStorage.ts                # IndexedDB store for the queue itself
├── connectivity/useOnlineStatus.ts        # navigator.onLine + real reachability probe
└── store/syncQueueStore.ts                # Zustand read-model factory (UI subscriptions)

src/features/shared/inventory/offline/
├── stockSyncEngine.ts                     # Domain wiring: how to replay a Save, error classification
└── OfflineSyncBanner.tsx                  # App-shell banner (offline/pending/conflict/needs-login)

src/features/shop/components/inventory/
└── SyncConflictModal.tsx                  # Lists conflicted items; Discard / Edit again

src/providers/
├── QueryProvider.tsx                      # PersistQueryClientProvider — cache → IndexedDB
└── OfflineSyncProvider.tsx                # Mounts monitor + engine, auto-flush, success toast

src/i18n/{en,ar}/offline.json               # banner / badge / conflict / toast strings
```

### Data Flow — the Save path (online or offline, same code path)
```
ClientInventoryPage.handleSave()
    ↓
enqueueStockSave({ queryClient, changes, items, notes, shopId })
    ↓
buildStockSaveOp() — snapshots productId/inventoryId per item (not resolved live on replay)
    ↓
applyOptimisticPatch() — queryClient.setQueryData(['client-inventory'], ...) — instant UI update
    ↓
engine.enqueue() — durably written to IndexedDB queue
    ↓
flushStockQueue() (only attempted if actually online)
    ↓
processStockSave():
  1. decreases → one receiptsApi.create() call (atomic)
  2. increases → sequential inventoryApi.stockIn() calls (NOT Promise.all — non-idempotent,
     so a retry after partial failure only re-sends items still pending)
    ↓
  network/auth error  → RetryableSyncError → entry stays 'pending', flush pass stops
  4xx/5xx response     → entry marked 'conflict', flush continues to the next entry
  success               → entry removed from queue
```

### State Management
- **Durable**: the mutation queue (IndexedDB, one JSON array per queue key) and the persisted TanStack Query cache (also IndexedDB, separate store) — both survive a full tab close.
- **Read-model**: a plain (non-persisted) Zustand store mirrors the queue for UI — `useStockSyncQueue()`, `useStockSyncAuthRequired()`.
- **Server state**: TanStack Query, whitelisted to persist only `client-inventory`, `client-inventory-products`, `client-inventory-categories`.

---

## 🔌 PWA Shell

### Service Worker (Serwist)
`src/app/sw.ts` registers three runtime caching rules on top of Serwist's defaults:

| Matcher | Strategy | Why |
|---|---|---|
| Page navigations | `NetworkFirst` (3s timeout) | Cold-offline app shell still loads from cache |
| API GET `/inventory`, `/products`, `/categories` | `StaleWhileRevalidate` | Instant paint from cache, revalidates in background |
| Any non-GET API call | `NetworkOnly` | Mutations are never cached at the SW layer — the app-level queue owns that (no Workbox Background Sync) |

### Manifest (`src/app/manifest.ts`)
`scope: '/client/'`, `start_url: '/client/inventory'`, `display: 'standalone'`, `lang: 'ar'` / `dir: 'rtl'` to match the app default. Icons at `public/icons/` (currently **placeholder PNGs** — dark bg + amber box glyph; swap for real design assets before shipping to the client).

### ⚠️ Turbopack vs. webpack — read this before touching `next.config.ts` or `package.json` scripts
- `@serwist/next` injects its precache manifest via a **webpack** plugin. Next 16 defaults to **Turbopack** for both `dev` and `build`.
- **`npm run dev`** → runs on **plain Turbopack, no Serwist wrapper, no service worker.** (`next.config.ts` conditionally skips the Serwist wrap when `NODE_ENV === 'development'` — otherwise Turbopack errors on seeing an injected webpack config.)
- **`npm run build`** → `next build --webpack` (see `package.json`). This is required — plain `next build` (Turbopack) fails outright with the Serwist wrapper present.
- **Practical effect**: you cannot manually test the installable-shell/cold-offline behavior against `next dev`. Use `npm run build && npm run start` for that.
- Track [serwist/serwist#54](https://github.com/serwist/serwist/issues/54) for native Turbopack support, which would let us drop this split.

### Favicon
`layout.tsx` → `metadata.icons.icon` and `.apple` both point at `/icons/icon-192.png` — the same icon used for the installed PWA now also appears in the browser tab, so there's one consistent icon identity rather than the framework default.

---

## 🔨 Offline Mutation Queue — Implementation Details

### Generic engine (`createSyncQueueEngine.ts`)
No domain knowledge — reusable for any future offline mutation flow.
```typescript
createSyncQueueEngine<TOp>({
  lockName,       // Web Locks name — only one browser tab flushes at a time
  loadEntries, saveEntries,   // persistence (caller-supplied)
  processEntry,   // (op, { commit }) => { status: 'done' | 'conflict', op }
})
// → { init, enqueue, flush, remove, getEntries, subscribe }
```
Throwing `RetryableSyncError` from `processEntry` keeps the entry `pending` and stops the current flush pass (no point burning through the rest of the queue with no connection).

### Domain wiring (`stockSyncEngine.ts`)
- `StockSaveOp` — one queued entry = one Save action (matches the existing transaction boundary): a batched decrease receipt + N independent increase items, each with its own `pending/done/conflict` status.
- `buildStockSaveOp()` **snapshots `productId` at enqueue time** from the live `allItems` — a queued op replayed after reconnect must not depend on the query cache still holding that product.
- `applyOptimisticPatch()` patches `['client-inventory']` quantities immediately, online or offline.
- Error classification: no response object (network) or an `authRequired`-tagged error → retryable; any real HTTP response → terminal (conflict).

### Auth-expiry handling (`src/common/api/client.ts`)
Replayed sync requests pass `skipAuthRedirect: true`. The 401→refresh-fails branch now checks this flag: if set, it tags the error `authRequired` instead of force-navigating to `/login` — a background flush must not yank the owner off whatever page they're on and lose queue state. The banner shows "log in again to finish syncing" instead.

### ⚠️ TanStack `mutationFn` gotcha
Adding the optional `config?: AxiosRequestConfig` parameter to `inventoryApi.stockIn` / `receiptsApi.create` (needed for `skipAuthRedirect`) broke every existing `mutationFn: apiFn` reference — TanStack Query v5 passes a `MutationFunctionContext` as the second argument, which collides with the new `config` param at the type level. Fixed by wrapping at each call site: `mutationFn: (data) => apiFn(data)`. Affected: `useInventory.ts`, `useAdminInventory.ts`, `useReceipts.ts`.

### Connectivity (`useOnlineStatus.ts`)
`navigator.onLine` alone is unreliable (reports "online" on a dead network). Combined with a probe: any HTTP response from `GET /inventory?limit=1` (even 401) proves reachability; only a thrown fetch means offline. Polled every 20s + on browser `online`/`offline` events. No dedicated `/health` endpoint exists yet — flagged as a backend follow-up.

### Multi-tab safety
`engine.flush()` wraps the flush pass in `navigator.locks.request(lockName, { ifAvailable: true }, ...)` — if another tab already holds the lock, this tab's flush attempt is a no-op rather than a duplicate send.

---

## 📱 UI/UX

| Piece | Behavior |
|---|---|
| `ProductCard` `syncStatus` prop | Amber "pending sync" badge (spinning icon) or red "sync failed" badge, keyed by `inventoryId` from `useStockSyncQueue().itemStatus` |
| `OfflineSyncBanner` | Mounted in `ClientLayout` (shell-wide, not just the inventory page). Priority: needs-login > conflicts > offline > syncing. Hidden entirely when idle (online, empty queue) |
| `SyncConflictModal` | Self-connected (reads the queue directly). Per conflicted entry: item list with delta + server error message, **Discard** (drop the entry) or **Edit again** (same as discard — both refetch server truth; the difference is purely about closing the modal or not) |
| Toast on drain | `OfflineSyncProvider` watches `pendingCount` transition to 0 with no conflicts → fires the existing success toast, invalidates `client-inventory*` queries to reconcile with authoritative server data |

### i18n
New namespace `offline` (`src/i18n/{en,ar}/offline.json`), registered in `src/i18n/index.ts`: `banner.*`, `badge.pendingSync` / `badge.conflict`, `conflict.*`, `toast.*`. Placeholder interpolation (`{count}`, `{qty}`, `{error}`) done via manual `.replace()` — this project's i18n has no built-in interpolation helper.

---

## 📲 Mobile / Real-Device Requirements

**Service workers only register in a secure context.** This is the #1 thing that breaks "it works on my laptop but not my phone":

| Origin | SW registers? |
|---|---|
| `https://...` | ✅ |
| `http://localhost` | ✅ (dev exception) |
| `http://192.168.x.x:3000` (phone over LAN IP) | ❌ silently refused |

To test on a real phone: tunnel the **production** build over HTTPS (e.g. `npx cloudflared tunnel --url http://localhost:3000`) after `npm run build && npm run start`, and open the tunnel URL on the phone. `NEXT_PUBLIC_API_URL` is baked in at build time — if the API is also `localhost`-only, the phone can't reach it either (tunnel that too, or point at a real deployed API, and rebuild).

- **Android/Chrome**: full support, install prompt appears automatically, background sync on reconnect is reliable.
- **iOS/Safari**: installable via manual **Share → Add to Home Screen** (no auto-prompt). Works offline once installed, but iOS throttles background activity — auto-sync fires reliably while the app is foregrounded, not necessarily while backgrounded. Our reconnect-flush + 30s interval both run on foreground, so this is covered in practice but is a softer guarantee than Android.

For a real deployment, both frontend and API need permanent HTTPS hosts (e.g. Vercel + an HTTPS API), with `NEXT_PUBLIC_API_URL` set to the real API URL at build time and CORS configured accordingly.

---

## ✅ Acceptance Criteria / Verification Status

- [x] `npm run build` (webpack) — zero TypeScript errors, `sw.js` emitted with populated precache manifest + `api-inventory` runtime cache
- [x] `npm run lint` — zero errors (5 pre-existing `<img>` warnings unrelated to this work)
- [x] `npm run dev` (Turbopack) — no config conflict, runs clean
- [x] Serve-level: `/manifest.webmanifest`, `/sw.js`, `/icons/*` all return 200; SW registration code confirmed present in the client bundle
- [ ] **Not yet device/DevTools-verified**: actual offline edit → queue → reconnect → auto-sync flow; conflict path (offline decrease that would push stock negative); multi-tab Web Lock; token-expiry-while-offline banner; real iOS Safari behavior
- [ ] Placeholder PNG icons need real design assets before client-facing use

---

## 🐛 Known Issues / Accepted Gaps

| Issue | Notes |
|---|---|
| No `/health` endpoint | Connectivity probe piggybacks on `GET /inventory?limit=1` as a pragmatic default |
| `stockIn`/`receipts.create` lack idempotency keys server-side | Client-side sequential processing + per-item status mitigates double-apply risk on partial-failure retries, but doesn't fully eliminate it — flagged for backend follow-up |
| Cross-tab query-cache consistency after a flush | A second open tab won't reflect a flush from tab A until it refetches (accepted v1 gap; Web Locks already prevents duplicate sends) |
| Shared-device data leakage | IndexedDB cache/queue is origin-scoped, not user-scoped — low-probability given typical one-owner-per-device usage |
| Stray `package-lock.json` one directory above the project | Causes a harmless Next "workspace root" warning during build; pre-existing, unrelated to this feature |

---

## 🔗 Related

- Client Inventory page: [client/client-inventory.md](client/client-inventory.md)
- Full original design doc: `/home/lenovo/.claude/plans/the-client-told-me-parsed-church.md`
