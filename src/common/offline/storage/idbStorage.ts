import { createStore, del, get, set, type UseStore } from 'idb-keyval';
import type { AsyncStorage } from '@tanstack/query-persist-client-core';

// `createStore` opens IndexedDB immediately, which throws during SSR (no `indexedDB`).
// Create it lazily so it only runs in the browser, on first read/write.
let store: UseStore | undefined;
function getStore(): UseStore {
  if (!store) {
    store = createStore('offline-query-cache', 'keyval');
  }
  return store;
}

/** Key the persisted React Query cache is written under (see QueryProvider). */
export const QUERY_CACHE_STORAGE_KEY = 'offline-query-cache';

// The persister throttles its saves, and a save already under way carries a
// snapshot taken before the cache was cleared — it can land right after the
// removal and bring the previous user's data back. clearUserCaches closes this
// gate while it clears, so that save is dropped; anything after it reopens can
// only snapshot the emptied cache.
let writesPaused = false;
export function pauseQueryCacheWrites(paused: boolean): void {
  writesPaused = paused;
}

// Bridges idb-keyval to the AsyncStorage shape the query persister expects.
export const idbStorage: AsyncStorage<string> = {
  getItem: async (key) => (await get<string>(key, getStore())) ?? null,
  setItem: async (key, value) => {
    if (writesPaused) return;
    await set(key, value, getStore());
  },
  removeItem: (key) => del(key, getStore()),
};
