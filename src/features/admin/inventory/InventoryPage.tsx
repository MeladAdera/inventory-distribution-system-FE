'use client';

import { useState } from 'react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/common/utils/error.utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/common/components/ui/card';
import { useAdminInventory } from './hooks/useAdminInventory';
import { InventoryStatsCards } from './components/InventoryStatsCards';
import { StockHealthChart } from './components/StockHealthChart';
import { TopStockChart } from './components/TopStockChart';
import { InventoryTable } from './components/InventoryTable';
import { InventoryRestockModal } from './components/InventoryRestockModal';
import type { InventoryItem } from '@/features/shared/inventory/types/inventory.types';

export function InventoryPage() {
  const { t } = useI18n();
  const iv = t.inventory;
  const toast = useToast();

  const { items, stats, isLoading, stockIn } = useAdminInventory();

  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);

  async function handleRestock(item: InventoryItem, qty: number) {
    try {
      await stockIn({ productId: item.product_id, quantity: qty });
      toast.success(iv.restock.success);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="max-w-330 mx-auto pb-16 lg:pb-6 space-y-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-[26px] font-semibold leading-tight text-ink-900">{iv.page.title}</h1>
        <p className="mt-1 text-sm text-ink-500">
          {iv.page.subtitle.replace('{n}', isLoading ? '…' : String(stats.totalSKUs))}
        </p>
      </div>

      {/* ── KPI cards ── */}
      <InventoryStatsCards
        stats={stats}
        isLoading={isLoading}
        onLowStockClick={() => setLowStockFilter(true)}
        onOutOfStockClick={() => setLowStockFilter(true)}
      />

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
        {/* Stock health donut */}
        <Card className="overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-border">
            <CardTitle className="text-base">{iv.charts.health}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <StockHealthChart stats={stats} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Top products bar */}
        <Card className="overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-border">
            <CardTitle className="text-base">{iv.charts.topProducts}</CardTitle>
          </CardHeader>
          <TopStockChart items={items} isLoading={isLoading} />
        </Card>
      </div>

      {/* ── Inventory table ── */}
      <InventoryTable
        items={items}
        isLoading={isLoading}
        lowStockFilter={lowStockFilter}
        onLowStockFilterChange={setLowStockFilter}
        onRestock={setRestockItem}
      />

      {/* ── Restock modal ── */}
      <InventoryRestockModal
        open={restockItem !== null}
        item={restockItem}
        onClose={() => setRestockItem(null)}
        onConfirm={handleRestock}
      />
    </div>
  );
}
