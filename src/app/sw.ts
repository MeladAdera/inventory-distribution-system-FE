/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from 'serwist';
import {
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from 'serwist';

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
  // Inventory/products/categories GET reads from the API: serve cached instantly, revalidate.
  {
    matcher: ({ url, request }) =>
      request.method === 'GET' && url.origin === API_ORIGIN && isApiRead.test(url.pathname),
    handler: new StaleWhileRevalidate({
      cacheName: 'api-inventory',
      plugins: [
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
