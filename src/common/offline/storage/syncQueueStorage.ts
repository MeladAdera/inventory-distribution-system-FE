import { createStore, get, set, type UseStore } from 'idb-keyval';
import type { QueueEntry } from '../engine/createSyncQueueEngine';

// Dedicated IndexedDB store for the durable mutation queue, separate from the
// query-cache store in idbStorage.ts. Lazy-created so it never touches
// `indexedDB` during SSR.
let store: UseStore | undefined;
function getStore(): UseStore {
  if (!store) {
    store = createStore('offline-sync-queue', 'keyval');
  }
  return store;
}

// One JSON array per queue key — the queue is tiny (a handful of Save actions),
// so a single key is simpler than the full `idb` package with object stores.
export function createQueueStorage<TOp>(key: string) {
  return {
    loadEntries: async (): Promise<QueueEntry<TOp>[]> =>
      (await get<QueueEntry<TOp>[]>(key, getStore())) ?? [],
    saveEntries: (entries: QueueEntry<TOp>[]): Promise<void> => set(key, entries, getStore()),
  };
}
