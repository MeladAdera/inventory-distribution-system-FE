'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import type { Product } from '../types/products.types';
import { useProduct } from '../hooks/useProducts';
import { ProductThumb } from './ProductThumb';
import { StatusBadge } from './StatusBadge';

interface ProductDetailModalProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}

export function ProductDetailModal({ open, product, onClose }: ProductDetailModalProps) {
  const { t } = useI18n();
  const p = t.products;

  const { data: detailData, isLoading: isLoadingDetail } = useProduct(
    open && product ? product.id : null
  );
  const detail = detailData?.data ?? null;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !product) return null;

  const categoryName = product.category_name;
  const sourceLabel = p.toolbar.sources[product.source];
  const statusLabel = product.is_active ? p.toolbar.statuses.active : p.toolbar.statuses.inactive;
  const createdAt = new Date(product.created_at).toLocaleDateString();

  const rows: { label: string; value: string | null }[] = [
    {
      label: p.detail.currentQty,
      value: isLoadingDetail ? null : String(detail?.current_quantity ?? 0),
    },
    { label: p.detail.price, value: `د.إ ${Number(product.price).toFixed(2)}` },
    { label: p.detail.source, value: sourceLabel },
    { label: p.detail.barcode, value: product.barcode ?? '—' },
    { label: p.detail.category, value: categoryName },
    { label: p.detail.createdAt, value: createdAt },
  ];

  if (product.description) {
    rows.push({ label: p.detail.description, value: product.description });
  }

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
          {/* Top: thumb + name + status */}
          <div className="flex items-center gap-4 mb-5">
            <ProductThumb id={product.id} size={64} />
            <div>
              <p className="font-semibold text-ink-900">{product.name}</p>
              <p className="font-mono text-[13px] text-ink-500 mt-0.5">{product.barcode ?? '—'}</p>
              <div className="mt-2">
                <StatusBadge isActive={product.is_active} label={statusLabel} />
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
                {row.value === null ? (
                  <span className="h-3 w-12 rounded skeleton-shimmer" />
                ) : (
                  <span className="text-[13px] font-medium text-ink-900">{row.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
