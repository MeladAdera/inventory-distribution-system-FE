'use client';

import { useEffect, useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { useDeepLinkParam } from '@/common/hooks/useDeepLinkParam';
import { getErrorMessage } from '@/common/utils/error.utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/common/components/ui/card';
import { useProducts } from '@/features/shared/products/hooks/useProducts';
import { useAdminInventory } from './hooks/useAdminInventory';
import { InventoryStatsCards } from './components/InventoryStatsCards';
import { StockHealthChart } from './components/StockHealthChart';
import { TopStockChart } from './components/TopStockChart';
import { InventoryTable } from './components/InventoryTable';
import { InventoryRestockModal } from './components/InventoryRestockModal';
import { StockInModal } from './components/StockInModal';
import type { InventoryItem } from '@/features/shared/inventory/types/inventory.types';

export function InventoryPage() {
  const { t } = useI18n();
  const iv = t.inventory;
  const toast = useToast();

  const { items, stats, isLoading, stockIn } = useAdminInventory();

  // Mutation only. The stock-in modal searches the catalog server-side through
  // ProductPicker, so nothing here renders a product list — fetching one would
  // be a request whose result is thrown away.
  const { updateProduct } = useProducts(undefined, { enabled: false });

  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [stockInOpen, setStockInOpen] = useState(false);
  const [searchSeed, setSearchSeed] = useState<string | undefined>(undefined);

  // `/inventory?product=Sugar` — a low-stock notification lands on its own row.
  // The payload carries the product name, not an id, so the search box is the hook.
  const { value: productParam, clear: clearProductParam } = useDeepLinkParam('product');

  useEffect(() => {
    if (!productParam) return;
    setSearchSeed(productParam);
    setLowStockFilter(false);
    clearProductParam();
  }, [productParam, clearProductParam]);

  async function handleRestock(item: InventoryItem, qty: number, unitCost?: number) {
    try {
      await stockIn({ productId: item.product_id, quantity: qty, unitCost });
      toast.success(iv.restock.success);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleStockIn(
    productId: number,
    qty: number,
    unitCost?: number,
    makeOrderable?: boolean
  ) {
    try {
      await stockIn({ productId, quantity: qty, unitCost });
      if (makeOrderable) {
        await updateProduct({ id: productId, data: { is_orderable: true } });
      }
      toast.success(iv.restock.success);
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  }

  return (
    <div className="max-w-330 mx-auto pb-16 lg:pb-6 space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight text-ink-900">{iv.page.title}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {iv.page.subtitle.replace('{n}', isLoading ? '…' : String(stats.totalSKUs))}
          </p>
        </div>
        <button
          onClick={() => setStockInOpen(true)}
          className="inline-flex items-center gap-2 h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          <PackagePlus size={16} />
          {iv.stockIn.btn}
        </button>
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
        searchSeed={searchSeed}
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

      {/* ── First-time stock-in (any catalog product) ── */}
      <StockInModal
        open={stockInOpen}
        items={items}
        onClose={() => setStockInOpen(false)}
        onConfirm={handleStockIn}
      />
    </div>
  );
}
