import { create } from 'zustand';
import type { QueueEntry } from '../engine/createSyncQueueEngine';

// Plain (non-persisted) Zustand read-model — IndexedDB is the durable store;
// this just mirrors engine state for UI subscriptions (badges/banners).
// A factory (not a singleton) so it stays domain-agnostic in common/: each
// feature instantiates its own typed store.
export interface SyncQueueReadModel<TOp> {
  entries: QueueEntry<TOp>[];
  setEntries: (entries: QueueEntry<TOp>[]) => void;
}

export function createSyncQueueStore<TOp>() {
  return create<SyncQueueReadModel<TOp>>((set) => ({
    entries: [],
    setEntries: (entries) => set({ entries }),
  }));
}
