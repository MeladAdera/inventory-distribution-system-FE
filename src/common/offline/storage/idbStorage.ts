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

// Bridges idb-keyval to the AsyncStorage shape the query persister expects.
export const idbStorage: AsyncStorage<string> = {
  getItem: async (key) => (await get<string>(key, getStore())) ?? null,
  setItem: (key, value) => set(key, value, getStore()),
  removeItem: (key) => del(key, getStore()),
};
