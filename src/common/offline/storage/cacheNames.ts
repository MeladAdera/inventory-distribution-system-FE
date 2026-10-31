// Cache Storage names shared by the service worker (src/app/sw.ts) and the page,
// which deletes the API caches when a session ends (see clearUserCaches).
// Imported relatively from sw.ts — keep this file free of '@/' imports.

/** API reads (inventory / products / categories), keyed per user + shop. */
export const API_CACHE_NAME = 'api-reads';

/** Every other API GET (/auth/me, shifts, customers…), keyed per user + shop. */
export const API_OTHER_CACHE_NAME = 'api-other';

/**
 * Earlier caches that held API responses keyed by URL alone, so they can't be
 * attributed to a user: the old inventory cache, and Serwist's default
 * cross-origin cache, which every other API GET used to land in. Deleted on
 * activate and at every login/logout; nothing reads from them any more.
 */
export const LEGACY_API_CACHE_NAMES = ['api-inventory', 'cross-origin'];
