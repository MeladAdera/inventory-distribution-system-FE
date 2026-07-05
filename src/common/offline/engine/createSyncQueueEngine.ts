// Generic offline sync queue engine. Domain-agnostic per CLAUDE.md's common/ rule:
// it owns FIFO ordering, persistence, the flush loop, cross-tab locking, and
// subscriptions — but knows nothing about receipts, stock, or HTTP. The caller
// supplies `processEntry` (how to actually perform one queued operation).

export type EntryStatus = 'pending' | 'syncing' | 'conflict' | 'error';

export interface QueueEntry<TOp> {
  id: string;
  createdAt: number;
  status: EntryStatus;
  op: TOp;
}

// Thrown by processEntry when the failure is transient (offline / network / auth-expired).
// The engine keeps the entry 'pending' and stops the current flush pass — no point
// trying the rest of the queue when connectivity is gone.
export class RetryableSyncError extends Error {
  constructor(message = 'retryable-sync-error') {
    super(message);
    this.name = 'RetryableSyncError';
  }
}

export interface ProcessContext<TOp> {
  // Persist partial progress mid-operation (e.g. per-item 'done' markers) so a
  // network drop halfway through doesn't re-apply already-succeeded items on retry.
  commit: (op: TOp) => Promise<void>;
}

export interface ProcessResult<TOp> {
  // 'done' → operation fully applied, entry is removed from the queue.
  // 'conflict' → server rejected part/all of it; entry stays for manual resolution.
  status: 'done' | 'conflict';
  op: TOp;
}

export interface SyncQueueEngineConfig<TOp> {
  // Web Locks name; guarantees only one tab flushes at a time.
  lockName: string;
  loadEntries: () => Promise<QueueEntry<TOp>[]>;
  saveEntries: (entries: QueueEntry<TOp>[]) => Promise<void>;
  processEntry: (op: TOp, ctx: ProcessContext<TOp>) => Promise<ProcessResult<TOp>>;
}

export interface SyncQueueEngine<TOp> {
  init: () => Promise<void>;
  enqueue: (op: TOp) => Promise<QueueEntry<TOp>>;
  flush: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  getEntries: () => QueueEntry<TOp>[];
  subscribe: (listener: (entries: QueueEntry<TOp>[]) => void) => () => void;
}

export function createSyncQueueEngine<TOp>(
  config: SyncQueueEngineConfig<TOp>
): SyncQueueEngine<TOp> {
  let entries: QueueEntry<TOp>[] = [];
  let flushing = false;
  let initialized = false;
  const listeners = new Set<(entries: QueueEntry<TOp>[]) => void>();

  function snapshot(): QueueEntry<TOp>[] {
    // Structural copy so subscribers can't mutate internal state.
    return entries.map((e) => ({ ...e }));
  }

  function notify() {
    const snap = snapshot();
    listeners.forEach((l) => l(snap));
  }

  async function save() {
    await config.saveEntries(entries);
  }

  async function init() {
    if (initialized) return;
    initialized = true;
    entries = await config.loadEntries();
    // Anything left 'syncing' from a previous session that was killed mid-flush
    // is really still pending.
    entries.forEach((e) => {
      if (e.status === 'syncing') e.status = 'pending';
    });
    notify();
  }

  async function enqueue(op: TOp): Promise<QueueEntry<TOp>> {
    const entry: QueueEntry<TOp> = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      status: 'pending',
      op,
    };
    entries.push(entry);
    await save();
    notify();
    return entry;
  }

  async function remove(id: string) {
    entries = entries.filter((e) => e.id !== id);
    await save();
    notify();
  }

  async function runFlush() {
    if (flushing) return;
    flushing = true;
    try {
      // Iterate over a snapshot of ids: the live array mutates as entries resolve.
      for (const { id } of [...entries]) {
        const entry = entries.find((e) => e.id === id);
        // Skip anything already resolved, in conflict (needs the user), or removed.
        if (!entry || entry.status === 'conflict') continue;

        entry.status = 'syncing';
        notify();

        try {
          const result = await config.processEntry(entry.op, {
            commit: async (op) => {
              entry.op = op;
              await save();
              notify();
            },
          });
          entry.op = result.op;
          if (result.status === 'done') {
            entries = entries.filter((e) => e.id !== id);
          } else {
            entry.status = 'conflict';
          }
          await save();
          notify();
        } catch (err) {
          if (err instanceof RetryableSyncError) {
            // Offline / auth-expired: leave it pending and stop — retry next pass.
            entry.status = 'pending';
            await save();
            notify();
            break;
          }
          // Unexpected error: mark it and move on so it doesn't block the queue.
          entry.status = 'error';
          await save();
          notify();
        }
      }
    } finally {
      flushing = false;
    }
  }

  async function flush() {
    // Web Locks: only one tab flushes at a time. `ifAvailable` means we bail
    // immediately (rather than queue) if another tab holds the lock.
    if (typeof navigator !== 'undefined' && 'locks' in navigator) {
      await navigator.locks.request(config.lockName, { ifAvailable: true }, async (lock) => {
        if (!lock) return;
        await runFlush();
      });
    } else {
      await runFlush();
    }
  }

  function subscribe(listener: (entries: QueueEntry<TOp>[]) => void) {
    listeners.add(listener);
    listener(snapshot());
    return () => listeners.delete(listener);
  }

  return { init, enqueue, flush, remove, getEntries: snapshot, subscribe };
}
