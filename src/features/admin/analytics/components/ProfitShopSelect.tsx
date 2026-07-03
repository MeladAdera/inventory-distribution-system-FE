'use client';

import { cn } from '@/common/utils/cn';
import { useShops, ShopType } from '@/features/admin/shops';
import type { Shop } from '@/features/admin/shops';

interface ProfitShopSelectProps {
  value: number | undefined;
  warehouseLabel: string;
  onChange: (shopId: number | undefined) => void;
}

/**
 * Admin-only scope switcher: no selection = warehouse profit,
 * a shop = that shop's sales profit. Rendered only for WAREHOUSE_ADMIN,
 * so the shops list is never fetched by shop owners.
 */
export function ProfitShopSelect({ value, warehouseLabel, onChange }: ProfitShopSelectProps) {
  const { shops, isLoading } = useShops({ type: ShopType.SHOP, limit: 999 });
  const shopList: Shop[] = shops?.data ?? [];

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
      disabled={isLoading}
      className={cn(
        'text-[13px] font-medium bg-sand-100 border border-border rounded-full px-3.5 py-1.25 outline-none cursor-pointer disabled:opacity-50 transition-opacity',
        value ? 'text-ink-700' : 'text-ink-400'
      )}
    >
      <option value="">{warehouseLabel}</option>
      {shopList.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
