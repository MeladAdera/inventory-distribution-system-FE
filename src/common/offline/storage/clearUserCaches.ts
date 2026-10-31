import type { QueryClient } from '@tanstack/react-query';
import { idbStorage, pauseQueryCacheWrites, QUERY_CACHE_STORAGE_KEY } from './idbStorage';
import { API_CACHE_NAME, API_OTHER_CACHE_NAME, LEGACY_API_CACHE_NAMES } from './cacheNames';

// Drop every cached copy of the signed-in user's server data, so the next
// person to sign in on this device never sees it — not even for the moment
// before their own data loads. Called when a session ends (logout, failed
// refresh) and again when a new one starts (login), which also covers sessions
// that ended without either, e.g. cookies that simply expired.
//
// Deliberately leaves the offline sync queue alone: unsynced sales are not a
// cache, and dropping them loses money. The queue only replays entries for the
// shop that made them (see stockSyncEngine).
export async function clearUserCaches(queryClient?: QueryClient): Promise<void> {
  // Closed until the removal below is done (see pauseQueryCacheWrites).
  pauseQueryCacheWrites(true);
  try {
    queryClient?.clear();
    await Promise.allSettled([
      idbStorage.removeItem(QUERY_CACHE_STORAGE_KEY),
      // Cache Storage is shared with the service worker; absent on insecure origins.
      ...(typeof caches !== 'undefined'
        ? [API_CACHE_NAME, API_OTHER_CACHE_NAME, ...LEGACY_API_CACHE_NAMES].map((name) =>
            caches.delete(name)
          )
        : []),
    ]);
  } finally {
    pauseQueryCacheWrites(false);
  }
}
