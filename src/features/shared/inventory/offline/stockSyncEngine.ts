'use client';

import { useMemo } from 'react';
import { create } from 'zustand';
import type { AxiosRequestConfig } from 'axios';
import type { QueryClient } from '@tanstack/react-query';
import {
  createSyncQueueEngine,
  RetryableSyncError,
  type ProcessContext,
  type ProcessResult,
  type QueueEntry,
} from '@/common/offline/engine/createSyncQueueEngine';
import { createQueueStorage } from '@/common/offline/storage/syncQueueStorage';
import { createSyncQueueStore } from '@/common/offline/store/syncQueueStore';
import { getIsOnline } from '@/common/offline/connectivity/useOnlineStatus';
import { isAxiosError, getErrorMessage } from '@/common/utils/error.utils';
import { inventoryApi } from '@/features/shared/inventory/api/inventory.api';
import { receiptsApi } from '@/features/shared/receipts/api/receipts.api';
import type { InventoryItem } from '@/features/shared/inventory/types/inventory.types';

// Lives in shared/inventory (not features/shop) since admin warehouse inventory
// could reuse this queue later.

export type SyncItemStatus = 'pending' | 'done' | 'conflict';

export interface StockSyncItem {
  inventoryId: number;
  productId: number; // snapshotted at enqueue time — replay must not depend on live query data
  productName: string;
  delta: number; // signed: negative = decrease, positive = increase
  status: SyncItemStatus;
  error?: string;
}

export interface StockSaveOp {
  shopId?: number;
  decreaseNotes?: string;
  increaseNotes?: string;
  // Chosen at confirm time; applied via a follow-up PATCH once the receipt exists.
  isFree?: boolean;
  // The batched decrease receipt is one atomic server call.
  decreases: StockSyncItem[];
  decreaseStatus: SyncItemStatus;
  decreaseError?: string;
  // Increases are N sequential stock-in calls, each with independent status.
  increases: StockSyncItem[];
}

// Replayed sync requests opt out of the interceptor's forced /login redirect.
const SYNC_REQUEST_CONFIG: AxiosRequestConfig & { skipAuthRedirect: boolean } = {
  skipAuthRedirect: true,
};

const QUEUE_KEY = 'stock-sync-queue';

// Set on every enqueue so processStockSave (invoked later by the flush loop,
// possibly on a different page) can invalidate the receipts cache after a
// decrease succeeds. The engine itself stays domain-agnostic — this is the
// one piece of React Query wiring the receipts side effect needs.
let activeQueryClient: QueryClient | null = null;

// ── Meta store: connectivity-independent sync flags (auth expiry) ───────────
interface StockSyncMeta {
  authRequired: boolean;
  setAuthRequired: (v: boolean) => void;
}
const useMetaStore = create<StockSyncMeta>((set) => ({
  authRequired: false,
  setAuthRequired: (authRequired) => set({ authRequired }),
}));
function setAuthRequired(v: boolean) {
  if (useMetaStore.getState().authRequired !== v) useMetaStore.getState().setAuthRequired(v);
}

// ── Error classification ────────────────────────────────────────────────────
// Network/offline and auth-expired are retryable (keep pending, stop the pass).
// A real HTTP response (4xx/5xx) is terminal → the caller marks it a conflict.
function throwIfRetryable(err: unknown): void {
  if (isAxiosError(err)) {
    if ((err as { authRequired?: boolean }).authRequired) {
      setAuthRequired(true);
      throw new RetryableSyncError('auth-required');
    }
    if (!err.response) {
      throw new RetryableSyncError('network');
    }
    return; // has a response → terminal, treat as conflict
  }
  // Non-axios error: be conservative and treat as retryable.
  throw new RetryableSyncError('unknown');
}

// ── The one operation: replay a batched Save ────────────────────────────────
async function processStockSave(
  op: StockSaveOp,
  ctx: ProcessContext<StockSaveOp>
): Promise<ProcessResult<StockSaveOp>> {
  const next: StockSaveOp = structuredClone(op);

  // 1) Decreases — one atomic consumption receipt.
  if (next.decreases.length > 0 && next.decreaseStatus !== 'done') {
    try {
      const created = await receiptsApi.create(
        {
          items: next.decreases.map((d) => ({
            inventoryId: d.inventoryId,
            quantity: Math.abs(d.delta),
          })),
          ...(next.decreaseNotes ? { notes: next.decreaseNotes } : {}),
        },
        SYNC_REQUEST_CONFIG
      );
      setAuthRequired(false);
      next.decreaseStatus = 'done';
      next.decreases.forEach((d) => (d.status = 'done'));
      await ctx.commit(next);
      // The free flag isn't part of POST /receipts — it's a separate PATCH,
      // best-effort here since the receipt itself was already created successfully.
      const createdId: number | undefined = created?.data?.id;
      if (next.isFree && createdId) {
        try {
          await receiptsApi.setFree(createdId, true, SYNC_REQUEST_CONFIG);
        } catch {
          // Ignore — the receipt exists; the user can still toggle free from its detail view.
        }
      }
      // A receipt was actually created on the server — the receipts list/detail
      // queries are stale wherever they're cached (e.g. the Receipts page).
      void activeQueryClient?.invalidateQueries({ queryKey: ['receipts'], refetchType: 'all' });
      void activeQueryClient?.invalidateQueries({ queryKey: ['analytics'], refetchType: 'all' });
    } catch (err) {
      throwIfRetryable(err);
      const message = getErrorMessage(err);
      next.decreaseStatus = 'conflict';
      next.decreaseError = message;
      next.decreases.forEach((d) => {
        d.status = 'conflict';
        d.error = message;
      });
      await ctx.commit(next);
    }
  }

  // 2) Increases — sequential (non-idempotent stock-ins), skipping any already done.
  for (const inc of next.increases) {
    if (inc.status === 'done') continue;
    try {
      await inventoryApi.stockIn(
        {
          productId: inc.productId,
          quantity: inc.delta,
          ...(next.increaseNotes ? { notes: next.increaseNotes } : {}),
        },
        SYNC_REQUEST_CONFIG
      );
      setAuthRequired(false);
      inc.status = 'done';
      await ctx.commit(next);
    } catch (err) {
      throwIfRetryable(err);
      inc.status = 'conflict';
      inc.error = getErrorMessage(err);
      await ctx.commit(next);
    }
  }

  const hasConflict =
    next.decreaseStatus === 'conflict' || next.increases.some((i) => i.status === 'conflict');
  return { status: hasConflict ? 'conflict' : 'done', op: next };
}

// ── Engine + read-model instances ───────────────────────────────────────────
const storage = createQueueStorage<StockSaveOp>(QUEUE_KEY);
const engine = createSyncQueueEngine<StockSaveOp>({
  lockName: 'stock-sync-flush',
  loadEntries: storage.loadEntries,
  saveEntries: storage.saveEntries,
  processEntry: processStockSave,
});
const useQueueStore = createSyncQueueStore<StockSaveOp>();

let initialized = false;
export async function initStockSyncEngine(): Promise<void> {
  if (initialized) return;
  initialized = true;
  engine.subscribe((entries) => useQueueStore.getState().setEntries(entries));
  await engine.init();
}

// ── Build + enqueue a Save from the page's `changes` state ──────────────────
interface EnqueueParams {
  queryClient: QueryClient;
  changes: Record<number, number>;
  items: { id: number; product_id: number; product_name: string }[];
  decreaseNotes?: string;
  increaseNotes?: string;
  isFree?: boolean;
  shopId?: number;
}

function buildStockSaveOp(params: EnqueueParams): StockSaveOp {
  const itemMap = new Map(params.items.map((i) => [i.id, i]));
  const decreases: StockSyncItem[] = [];
  const increases: StockSyncItem[] = [];

  for (const [idStr, delta] of Object.entries(params.changes)) {
    if (delta === 0) continue;
    const inventoryId = Number(idStr);
    const item = itemMap.get(inventoryId);
    const entry: StockSyncItem = {
      inventoryId,
      productId: item?.product_id ?? -1,
      productName: item?.product_name ?? 'Unknown',
      delta,
      status: 'pending',
    };
    if (delta < 0) decreases.push(entry);
    else increases.push(entry);
  }

  return {
    shopId: params.shopId,
    decreaseNotes: params.decreaseNotes?.trim() || undefined,
    increaseNotes: params.increaseNotes?.trim() || undefined,
    isFree: params.isFree,
    decreases,
    decreaseStatus: decreases.length ? 'pending' : 'done',
    increases,
  };
}

// Patch the persisted inventory cache so the new quantities show instantly,
// online or offline, before the server confirms.
function applyOptimisticPatch(queryClient: QueryClient, op: StockSaveOp) {
  const deltaByInv = new Map<number, number>();
  [...op.decreases, ...op.increases].forEach((i) =>
    deltaByInv.set(i.inventoryId, (deltaByInv.get(i.inventoryId) ?? 0) + i.delta)
  );

  queryClient.setQueryData(
    ['client-inventory'],
    (old: { data?: { data?: InventoryItem[] } } | undefined) => {
      const list = old?.data?.data;
      if (!list) return old;
      return {
        ...old,
        data: {
          ...old.data,
          data: list.map((item) => {
            const d = deltaByInv.get(item.id);
            if (!d) return item;
            return { ...item, current_quantity: Math.max(0, item.current_quantity + d) };
          }),
        },
      };
    }
  );
}

export async function enqueueStockSave(params: EnqueueParams): Promise<void> {
  const op = buildStockSaveOp(params);
  if (op.decreases.length === 0 && op.increases.length === 0) return;
  activeQueryClient = params.queryClient;
  applyOptimisticPatch(params.queryClient, op);
  await engine.enqueue(op);
  void flushStockQueue();
}

// Attempt a flush only when actually reachable — avoids a doomed request offline.
export async function flushStockQueue(): Promise<void> {
  if (!getIsOnline()) return;
  await engine.flush();
}

export function discardSyncEntry(id: string): Promise<void> {
  return engine.remove(id);
}

// ── Hooks for UI ────────────────────────────────────────────────────────────
export interface StockSyncSummary {
  entries: QueueEntry<StockSaveOp>[];
  itemStatus: Map<number, SyncItemStatus>; // inventoryId → status (for per-card badges)
  pendingCount: number;
  conflictCount: number;
  hasPending: boolean;
  hasConflicts: boolean;
}

export function useStockSyncQueue(): StockSyncSummary {
  const entries = useQueueStore((s) => s.entries);
  return useMemo(() => {
    const itemStatus = new Map<number, SyncItemStatus>();
    let pendingCount = 0;
    let conflictCount = 0;
    entries.forEach((e) => {
      [...e.op.decreases, ...e.op.increases].forEach((i) => {
        itemStatus.set(i.inventoryId, i.status);
        if (i.status === 'conflict') conflictCount += 1;
        else if (i.status !== 'done') pendingCount += 1;
      });
    });
    return {
      entries,
      itemStatus,
      pendingCount,
      conflictCount,
      hasPending: pendingCount > 0,
      hasConflicts: conflictCount > 0,
    };
  }, [entries]);
}

export function useStockSyncAuthRequired(): boolean {
  return useMetaStore((s) => s.authRequired);
}
