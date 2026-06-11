'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import { getProductStatus, type AdminProduct } from '../types/products.types';
import { ProductThumb } from './ProductThumb';
import { StatusBadge } from './StatusBadge';

interface ProductDetailModalProps {
  open: boolean;
  product: AdminProduct | null;
  onClose: () => void;
}

export function ProductDetailModal({ open, product, onClose }: ProductDetailModalProps) {
  const { t, locale } = useI18n();
  const p = t.products;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !product) return null;

  const name = locale === 'ar' ? product.name_ar : product.name_en;
  const status = getProductStatus(product);
  const totalValue = (product.warehouse_qty * product.sell_price).toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const rows: { label: string; value: string }[] = [
    {
      label: p.detail.warehouseQty,
      value: p.detail.units.replace('{n}', String(product.warehouse_qty.toLocaleString())),
    },
    { label: p.detail.minStock, value: String(product.min_stock) },
    { label: p.detail.costPrice, value: `د.إ ${product.cost_price.toFixed(2)}` },
    { label: p.detail.sellPrice, value: `د.إ ${product.sell_price.toFixed(2)}` },
    { label: p.detail.totalValue, value: `د.إ ${totalValue}` },
    { label: p.detail.category, value: p.toolbar.categories[product.category] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/32 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 w-full bg-paper flex flex-col',
          'sm:rounded-xl sm:max-w-130',
          'rounded-t-2xl sm:rounded-t-xl',
          'animate-pop-in'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border">
          <h2 className="text-lg font-semibold text-ink-900">{p.detail.title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-sand-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* Top: thumb + sku + status */}
          <div className="flex items-center gap-4 mb-5">
            <ProductThumb color={product.color} size={64} />
            <div>
              <p className="font-semibold text-ink-900">{name}</p>
              <p className="font-mono text-[13px] text-ink-500 mt-0.5">{product.sku}</p>
              <div className="mt-2">
                <StatusBadge status={status} label={p.toolbar.statuses[status]} />
              </div>
            </div>
          </div>

          {/* Info rows */}
          <div className="border border-border rounded-[10px] overflow-hidden">
            {rows.map((row, i) => (
              <div
                key={row.label}
                className={cn(
                  'flex items-center justify-between px-4 py-2.75',
                  i > 0 && 'border-t border-border'
                )}
              >
                <span className="text-[13px] text-ink-500">{row.label}</span>
                <span className="text-[13px] font-medium text-ink-900">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
