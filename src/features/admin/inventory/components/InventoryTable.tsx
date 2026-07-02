'use client';

import { useMemo, useState } from 'react';
import { Search, PackagePlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { Button } from '@/common/components/ui/button';
import { Input } from '@/common/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/common/components/ui/card';
import type { InventoryItem } from '@/features/shared/inventory/types/inventory.types';

const PAGE_SIZE = 12;

type StatusKey = 'healthy' | 'low' | 'out';

function getStatus(item: InventoryItem): StatusKey {
  if (item.current_quantity === 0) return 'out';
  if (item.is_low_stock || item.current_quantity <= item.low_stock_threshold) return 'low';
  return 'healthy';
}

const STATUS_STYLES: Record<StatusKey, string> = {
  healthy: 'bg-green-50 text-green-700 border-green-200',
  low: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  out: 'bg-red-50 text-red-700 border-red-200',
};

// ── Desktop skeleton ───────────────────────────────────────────────────────────
function SkeletonRow({ index }: { index: number }) {
  return (
    <div
      className={cn(
        'grid gap-3 px-5 py-3.5 items-center',
        'grid-cols-[40px_2fr_1fr_1fr_1fr_1fr_100px]',
        index > 0 && 'border-t border-border'
      )}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded skeleton-shimmer"
          style={{ width: i === 0 ? '60%' : '70%' }}
        />
      ))}
      <div className="h-7 w-18 rounded-lg skeleton-shimmer" />
    </div>
  );
}

// ── Mobile skeleton ────────────────────────────────────────────────────────────
function MobileSkeletonCard({ index }: { index: number }) {
  return (
    <div className={cn('px-4 py-3.5', index > 0 && 'border-t border-border')}>
      <div className="flex items-start justify-between gap-3">
        <div className="h-3.5 w-32 rounded skeleton-shimmer" />
        <div className="h-5 w-16 rounded-full skeleton-shimmer" />
      </div>
      <div className="mt-2.5 flex gap-4">
        <div className="h-3 w-20 rounded skeleton-shimmer" />
        <div className="h-3 w-20 rounded skeleton-shimmer" />
      </div>
      <div className="mt-3 h-7 w-20 rounded-lg skeleton-shimmer" />
    </div>
  );
}

interface Props {
  items: InventoryItem[];
  isLoading: boolean;
  lowStockFilter: boolean;
  onLowStockFilterChange: (v: boolean) => void;
  onRestock: (item: InventoryItem) => void;
}

export function InventoryTable({
  items,
  isLoading,
  lowStockFilter,
  onLowStockFilterChange,
  onRestock,
}: Props) {
  const { t, locale } = useI18n();
  const iv = t.inventory;
  const tbl = iv.table;
  const localeCode = locale === 'ar' ? 'ar-SA' : 'en-US';

  // ar-SY-u-nu-latn → Levantine month names (تموز، آب…) + Gregorian + Western numerals
  const dateLocale = locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-US';
  const dateOptions: Intl.DateTimeFormatOptions =
    locale === 'ar'
      ? { day: 'numeric', month: 'long', year: 'numeric' }
      : { day: 'numeric', month: 'short', year: 'numeric' };

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(dateLocale, dateOptions);
  }

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const nameMatch = !q || (item.product_name ?? '').toLowerCase().includes(q);
      const lowMatch = !lowStockFilter || getStatus(item) !== 'healthy';
      return nameMatch && lowMatch;
    });
  }, [items, search, lowStockFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  function handleLowStockToggle() {
    onLowStockFilterChange(!lowStockFilter);
    setPage(1);
  }

  const GRID = '40px 2fr 1fr 1fr 1fr 1fr 100px';

  const headers = [
    tbl.colNum,
    tbl.colProduct,
    tbl.colQty,
    tbl.colThreshold,
    tbl.colStatus,
    tbl.colUpdated,
    tbl.colActions,
  ];

  // ── Shared pagination footer ───────────────────────────────────────────────
  const paginationFooter = !isLoading && totalPages > 1 && (
    <CardContent className="flex items-center justify-between px-5 py-3 border-t border-border pt-3">
      <span className="text-[12px] text-ink-400">
        {t.sidebar.pagination.showing} {(safePage - 1) * PAGE_SIZE + 1}–
        {Math.min(safePage * PAGE_SIZE, filtered.length)} {t.sidebar.pagination.of}{' '}
        {filtered.length} {t.sidebar.pagination.results}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPage((p) => p - 1)}
          disabled={safePage === 1}
          className="w-7 h-7"
        >
          <ChevronLeft size={13} />
        </Button>
        <span className="text-[12px] text-ink-500 tabular-nums px-2">
          {safePage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPage((p) => p + 1)}
          disabled={safePage === totalPages}
          className="w-7 h-7"
        >
          <ChevronRight size={13} />
        </Button>
      </div>
    </CardContent>
  );

  // ── Empty state ────────────────────────────────────────────────────────────
  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-ink-400">
      <Search size={28} className="opacity-30" />
      <p className="text-sm">{tbl.empty}</p>
    </div>
  );

  return (
    <Card className="overflow-hidden">
      {/* ── Toolbar ── */}
      <CardHeader className="flex-col gap-3 px-5 py-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base shrink-0">{tbl.title}</CardTitle>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={tbl.searchPlaceholder}
              className="h-9 pl-8 bg-sand-100 border-border w-full sm:w-52 text-sm"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLowStockToggle}
            className={cn(
              'rounded-lg border shrink-0',
              lowStockFilter
                ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                : 'border-border'
            )}
          >
            {tbl.showLowStock}
          </Button>
        </div>
      </CardHeader>

      {/* ══════════════════════════════════════════════════
          MOBILE — card per row  (hidden on md+)
      ══════════════════════════════════════════════════ */}
      <div className="md:hidden">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <MobileSkeletonCard key={i} index={i} />)
          : pageItems.length === 0
            ? emptyState
            : pageItems.map((item, i) => {
                const status = getStatus(item);
                const displayName = item.product_name ?? `Product ${item.product_id}`;
                const updatedAt = formatDate(item.updated_at);

                return (
                  <div
                    key={item.id}
                    className={cn('px-4 py-3.5', i > 0 && 'border-t border-border')}
                  >
                    {/* Row 1 — name + status badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-ink-900 truncate">
                        {displayName}
                      </span>
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center text-[11px] font-medium px-2 py-0.5 rounded-full border',
                          STATUS_STYLES[status]
                        )}
                      >
                        {iv.status[status]}
                      </span>
                    </div>

                    {/* Row 2 — qty / threshold / updated */}
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[12px] text-ink-400">
                      <span>
                        {tbl.colQty}:{' '}
                        <span
                          className={cn(
                            'font-semibold tabular-nums',
                            status === 'out'
                              ? 'text-danger-700'
                              : status === 'low'
                                ? 'text-warning-700'
                                : 'text-ink-800'
                          )}
                        >
                          {item.current_quantity.toLocaleString(localeCode)}
                        </span>
                      </span>
                      <span>
                        {tbl.colThreshold}:{' '}
                        <span className="font-semibold text-ink-800 tabular-nums">
                          {item.low_stock_threshold.toLocaleString(localeCode)}
                        </span>
                      </span>
                      <span>{updatedAt}</span>
                    </div>

                    {/* Row 3 — restock button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onRestock(item)}
                      className="mt-2.5 gap-1.5 h-7 px-2.5 text-[12px]"
                    >
                      <PackagePlus size={13} />
                      {tbl.restock}
                    </Button>
                  </div>
                );
              })}
        {paginationFooter}
      </div>

      {/* ══════════════════════════════════════════════════
          DESKTOP — grid table  (hidden below md)
      ══════════════════════════════════════════════════ */}
      <div className="hidden md:block">
        {/* Column headers */}
        <div
          className="grid gap-3 px-5 py-2.5 text-[11px] font-medium text-ink-400 border-b border-border"
          style={{ gridTemplateColumns: GRID }}
        >
          {headers.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} index={i} />)
          : pageItems.length === 0
            ? emptyState
            : pageItems.map((item, i) => {
                const status = getStatus(item);
                const displayName = item.product_name ?? `Product ${item.product_id}`;
                const updatedAt = formatDate(item.updated_at);
                const globalIndex = (safePage - 1) * PAGE_SIZE + i + 1;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'grid gap-3 px-5 py-3.5 items-center',
                      i > 0 && 'border-t border-border'
                    )}
                    style={{ gridTemplateColumns: GRID }}
                  >
                    <span className="text-[13px] text-ink-400 tabular-nums">{globalIndex}</span>
                    <span className="text-[13px] font-medium text-ink-900 truncate">
                      {displayName}
                    </span>
                    <span
                      className={cn(
                        'text-[13px] font-semibold tabular-nums',
                        status === 'out'
                          ? 'text-danger-700'
                          : status === 'low'
                            ? 'text-warning-700'
                            : 'text-ink-900'
                      )}
                    >
                      {item.current_quantity.toLocaleString(localeCode)}
                    </span>
                    <span className="text-[13px] text-ink-900 font-semibold tabular-nums">
                      {item.low_stock_threshold.toLocaleString(localeCode)}
                    </span>
                    <span
                      className={cn(
                        'inline-flex w-fit items-center text-[11px] font-medium px-2 py-0.5 rounded-full border',
                        STATUS_STYLES[status]
                      )}
                    >
                      {iv.status[status]}
                    </span>
                    <span className="text-[12px] text-ink-400">{updatedAt}</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onRestock(item)}
                      className="gap-1.5 h-7 px-2.5 text-[12px]"
                    >
                      <PackagePlus size={13} />
                      {tbl.restock}
                    </Button>
                  </div>
                );
              })}
        {paginationFooter}
      </div>
    </Card>
  );
}
