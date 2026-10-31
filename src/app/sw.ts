/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from 'serwist';
import {
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  type SerwistPlugin,
} from 'serwist';
import {
  API_CACHE_NAME,
  API_OTHER_CACHE_NAME,
  LEGACY_API_CACHE_NAMES,
} from '../common/offline/storage/cacheNames';

// Serwist injects the precache manifest here at build time.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// NEXT_PUBLIC_* vars are inlined into the SW bundle at build time.
// The API is a different origin (e.g. http://localhost:3001), so we match on its origin.
const API_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? '').origin;
  } catch {
    return '';
  }
})();

const isApiRead = /\/(inventory|products|categories)/;

// Who a request is for, read from the bearer token's payload ("<sub>.<shopId>").
// Not verified — the server does that. It only has to tell sessions apart, so
// one user's cached response is never served to another user or shop on the
// same device (the Cache API keys on URL alone, not on the Authorization header).
// No token → "anon": the server only answers those with public data (images).
function requestOwner(request: Request): string {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return 'anon';
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(part)) as { sub?: unknown; shopId?: unknown };
    if (payload.sub === undefined || payload.sub === null) return 'unknown';
    return `${payload.sub}.${payload.shopId ?? 'none'}`;
  } catch {
    return 'unknown';
  }
}

const perUserCacheKey: SerwistPlugin = {
  cacheKeyWillBeUsed: async ({ request }) => {
    const url = new URL(request.url);
    url.searchParams.set('__sw_owner', requestOwner(request));
    return url.href;
  },
  // A token we couldn't read is never written, so it can never be matched.
  cacheWillUpdate: async ({ request, response }) =>
    requestOwner(request) === 'unknown' ? null : response,
};

// A gateway error means the API itself was not reached (proxy up, backend
// down) — treat it like a network failure so NetworkFirst falls back to cache.
// Other errors (401, 404, 500) pass through: the app has to see them, e.g. the
// 401 → refresh → retry interceptor.
const gatewayErrorsAsNetworkFailure: SerwistPlugin = {
  fetchDidSucceed: async ({ response }) => {
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      throw new Error(`Gateway error ${response.status}`);
    }
    return response;
  },
};

const runtimeCaching: RuntimeCaching[] = [
  // Page navigations: NetworkFirst so the app shell still loads cold-offline from cache.
  {
    matcher: ({ request }) => request.mode === 'navigate',
    handler: new NetworkFirst({
      cacheName: 'pages',
      networkTimeoutSeconds: 3,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 7 * 24 * 60 * 60 }),
      ],
    }),
  },
  // The connectivity probe (useOnlineStatus) asks with cache: 'no-store' — it
  // has to see the real network, or a cached answer reads as "online".
  {
    matcher: ({ url, request }) => url.origin === API_ORIGIN && request.cache === 'no-store',
    handler: new NetworkOnly(),
  },
  // Inventory/products/categories GET reads from the API: NetworkFirst, so a
  // refetch right after a save returns the new data instead of the copy cached
  // before it. The cache is only the fallback for offline, a failed request,
  // or no answer within 3s (the network response still updates the cache when
  // it lands). Instant first paint comes from the persisted React Query cache.
  {
    matcher: ({ url, request }) =>
      request.method === 'GET' && url.origin === API_ORIGIN && isApiRead.test(url.pathname),
    handler: new NetworkFirst({
      cacheName: API_CACHE_NAME,
      networkTimeoutSeconds: 3,
      plugins: [
        gatewayErrorsAsNetworkFailure,
        perUserCacheKey,
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    }),
  },
  // Every other API GET (/auth/me, shifts, customers, receipts…). Without this
  // rule they fall to defaultCache's cross-origin rule, which caches by URL
  // alone — one user's /auth/me could then be served to the next one offline.
  // Same per-user keying; keeps that rule's 10s timeout, since slower reports
  // (analytics) shouldn't fall back to a cached copy after only 3s. The offline
  // cold start depends on this: AuthProvider sends a failed /auth/me to /login.
  {
    matcher: ({ url, request }) => request.method === 'GET' && url.origin === API_ORIGIN,
    handler: new NetworkFirst({
      cacheName: API_OTHER_CACHE_NAME,
      networkTimeoutSeconds: 10,
      plugins: [
        gatewayErrorsAsNetworkFailure,
        perUserCacheKey,
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    }),
  },
  // Any non-GET API call (mutations): never cache/queue at the SW layer.
  // Offline mutations are handled by the app-level sync queue (Phase 3).
  {
    matcher: ({ url, request }) => url.origin === API_ORIGIN && request.method !== 'GET',
    handler: new NetworkOnly(),
  },
  // Everything else (Next static assets, etc.) keeps Serwist's tuned defaults.
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

serwist.addEventListeners();

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all(LEGACY_API_CACHE_NAMES.map((name) => caches.delete(name))));
});
