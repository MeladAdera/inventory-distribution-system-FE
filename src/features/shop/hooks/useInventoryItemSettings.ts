'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/features/shared/inventory/api/inventory.api';
import type { InventoryItemSettingsChanges } from '../types/clientInventory.types';

/**
 * The per-shop settings on one inventory row: selling price and minimum
 * quantity. Both live on the shop's own row, so editing them on a catalog
 * product never touches other shops or the warehouse.
 *
 * Online only — unlike stock changes these are not queued for offline sync.
 */
export function useInventoryItemSettings() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, changes }: { id: number; changes: InventoryItemSettingsChanges }) => {
      const calls: Promise<unknown>[] = [];
      if (changes.salePrice !== undefined) {
        calls.push(inventoryApi.updateSalePrice(id, { salePrice: changes.salePrice }));
      }
      if (changes.lowStockThreshold !== undefined) {
        calls.push(
          inventoryApi.updateLowStockThreshold(id, { lowStockThreshold: changes.lowStockThreshold })
        );
      }
      // Two separate endpoints. Let both finish before reporting a failure, so
      // the one that did save is not mistaken for unsaved.
      const results = await Promise.allSettled(calls);
      const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (failed) throw failed.reason;
    },
    // On a partial failure too: the half that saved has to show up.
    // The threshold drives is_low_stock, which feeds the status badges, the
    // dashboard (both read 'client-inventory') and the shortages list.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['client-inventory'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory', 'low-stock'] }),
      ]),
  });

  return {
    saveSettings: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
