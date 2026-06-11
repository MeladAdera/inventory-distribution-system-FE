'use client';

import {
  Search,
  Download,
  PackagePlus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  Plus,
} from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import { ProductThumb } from './ProductThumb';
import { StatusBadge } from './StatusBadge';
import {
  getProductStatus,
  type AdminProduct,
  type ProductCategory,
  type ProductStatus,
} from '../types/products.types';

const GRID = '40px 2fr 1.2fr 1fr 1fr 0.9fr 1fr 156px';
const HEADER_KEYS = [
  'num',
  'product',
  'sku',
  'category',
  'warehouseQty',
  'unitPrice',
  'status',
  'actions',
] as const;

type ProductsT = ReturnType<typeof useI18n>['t']['products'];

// ── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div
      className="grid gap-4 px-5 py-4 border-t border-border"
      style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
    >
      <div className="h-3 rounded skeleton-shimmer" style={{ width: '70%' }} />
      <div className="h-3 rounded skeleton-shimmer" style={{ width: '55%' }} />
      <div className="h-3 rounded skeleton-shimmer" style={{ width: '55%' }} />
      <div className="h-3 rounded skeleton-shimmer" style={{ width: '55%' }} />
      <div className="h-3 rounded skeleton-shimmer" style={{ width: '55%' }} />
      <div className="h-3 rounded skeleton-shimmer" style={{ width: '40%' }} />
    </div>
  );
}

// ── Pagination helpers ─────────────────────────────────────────────────────

function getPageNumbers(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (page >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', page - 1, page, page + 1, '…', total];
}

// ── Action icon button ─────────────────────────────────────────────────────

interface IconBtnProps {
  onClick: () => void;
  title: string;
  colorClass: string;
  children: React.ReactNode;
}
function IconBtn({ onClick, title, colorClass, children }: IconBtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-colors',
        'bg-transparent hover:bg-ink-900/6',
        colorClass
      )}
    >
      {children}
    </button>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

interface ProductsTableCardProps {
  products: AdminProduct[];
  filteredCount: number;
  isLoading: boolean;
  page: number;
  pageSize: number;
  startIndex: number;
  search: string;
  categoryFilter: string;
  statusFilter: string;
  onSearchChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onAddProduct: () => void;
  onView: (p: AdminProduct) => void;
  onEdit: (p: AdminProduct) => void;
  onRestock: (p: AdminProduct) => void;
  onDelete: (p: AdminProduct) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function ProductsTableCard({
  products,
  filteredCount,
  isLoading,
  page,
  pageSize,
  startIndex,
  search,
  categoryFilter,
  statusFilter,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onPageChange,
  onAddProduct,
  onView,
  onEdit,
  onRestock,
  onDelete,
}: ProductsTableCardProps) {
  const { t, locale } = useI18n();
  const p = t.products;

  const pageCount = Math.ceil(filteredCount / pageSize);
  const showPagination = pageCount > 1;
  const pages = getPageNumbers(page, pageCount);

  const selectCls =
    'h-9.5 border border-border rounded-lg bg-paper text-[13px] text-ink-800 px-3 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-50 cursor-pointer';

  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-border">
        {/* Search */}
        <div className="flex items-center gap-2 h-9.5 px-3 border border-border rounded-lg bg-paper min-w-45 flex-1 sm:flex-none sm:w-55">
          <Search size={15} className="text-ink-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={p.toolbar.searchPlaceholder}
            className="flex-1 text-[13px] text-ink-900 placeholder-ink-400 bg-transparent focus:outline-none"
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={selectCls}
        >
          <option value="">{p.toolbar.allCategories}</option>
          {(['bev', 'snk', 'dry', 'cln', 'can', 'bky'] as ProductCategory[]).map((cat) => (
            <option key={cat} value={cat}>
              {p.toolbar.categories[cat]}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className={selectCls}
        >
          <option value="">{p.toolbar.allStatuses}</option>
          {(['in_stock', 'low', 'out', 'inactive'] as ProductStatus[]).map((s) => (
            <option key={s} value={s}>
              {p.toolbar.statuses[s]}
            </option>
          ))}
        </select>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export */}
        <button className="inline-flex items-center gap-2 h-9.5 px-4 border border-border rounded-lg bg-paper text-[13px] text-ink-700 font-medium hover:bg-sand-100 transition-colors">
          <Download size={15} />
          {p.toolbar.export}
        </button>
      </div>

      {/* ── Table header (desktop only) ──────────────────────────── */}
      <div
        className="hidden md:grid items-center bg-sand-100 border-b border-border px-5 py-3"
        style={{ gridTemplateColumns: GRID }}
      >
        {HEADER_KEYS.map((key, i) => (
          <span key={key} className={cn('text-xs font-medium text-ink-500', i === 7 && 'text-end')}>
            {p.table[key]}
          </span>
        ))}
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
      ) : products.length === 0 ? (
        <EmptyState onAdd={onAddProduct} p={p} />
      ) : (
        products.map((product, idx) => (
          <ProductRow
            key={product.id}
            product={product}
            rowNum={startIndex + idx + 1}
            locale={locale}
            p={p}
            onView={onView}
            onEdit={onEdit}
            onRestock={onRestock}
            onDelete={onDelete}
          />
        ))
      )}

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {!isLoading && showPagination && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border">
          <span className="text-[13px] text-ink-500">
            {p.pagination.showing
              .replace('{n}', String(products.length))
              .replace('{total}', String(filteredCount))}
          </span>
          <div className="flex items-center gap-1">
            <PageBtn onClick={() => onPageChange(page - 1)} disabled={page === 1}>
              <ChevronLeft size={14} />
            </PageBtn>
            {pages.map((pg, i) =>
              pg === '…' ? (
                <span key={`ellipsis-${i}`} className="w-8 text-center text-[13px] text-ink-400">
                  …
                </span>
              ) : (
                <PageBtn key={pg} active={pg === page} onClick={() => onPageChange(pg as number)}>
                  {pg}
                </PageBtn>
              )
            )}
            <PageBtn onClick={() => onPageChange(page + 1)} disabled={page === pageCount}>
              <ChevronRight size={14} />
            </PageBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page button ────────────────────────────────────────────────────────────

function PageBtn({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'min-w-8 h-8 px-1 rounded-lg border text-[13px] font-mono transition-colors',
        active
          ? 'bg-ink-900 text-amber-500 border-ink-900'
          : 'bg-paper text-ink-700 border-border hover:bg-sand-100',
        disabled && 'opacity-40 pointer-events-none'
      )}
    >
      {children}
    </button>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ onAdd, p }: { onAdd: () => void; p: ProductsT }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-[14px] bg-sand-100 border border-border flex items-center justify-center mb-4">
        <PackageSearch size={24} className="text-ink-400" />
      </div>
      <p className="text-base font-semibold text-ink-900">{p.emptyState.title}</p>
      <p className="mt-1.5 text-sm text-ink-500 max-w-xs">{p.emptyState.sub}</p>
      <button
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus size={15} />
        {p.emptyState.addProduct}
      </button>
    </div>
  );
}

// ── Table row ──────────────────────────────────────────────────────────────

interface ProductRowProps {
  product: AdminProduct;
  rowNum: number;
  locale: string;
  p: ProductsT;
  onView: (p: AdminProduct) => void;
  onEdit: (p: AdminProduct) => void;
  onRestock: (p: AdminProduct) => void;
  onDelete: (p: AdminProduct) => void;
}

function ProductRow({
  product,
  rowNum,
  locale,
  p,
  onView,
  onEdit,
  onRestock,
  onDelete,
}: ProductRowProps) {
  const name = locale === 'ar' ? product.name_ar : product.name_en;
  const status = getProductStatus(product);
  const statusLabel = p.toolbar.statuses[status];
  const categoryLabel = p.toolbar.categories[product.category];

  const actions = (
    <div className="flex items-center gap-0.5 justify-end">
      <IconBtn
        onClick={() => onRestock(product)}
        title={p.restock.title}
        colorClass="text-success-700"
      >
        <PackagePlus size={15} />
      </IconBtn>
      <IconBtn onClick={() => onView(product)} title={p.detail.title} colorClass="text-ink-600">
        <Eye size={15} />
      </IconBtn>
      <IconBtn onClick={() => onEdit(product)} title={p.form.editTitle} colorClass="text-ink-600">
        <Pencil size={15} />
      </IconBtn>
      <IconBtn
        onClick={() => onDelete(product)}
        title={p.delete.delete}
        colorClass="text-danger-700"
      >
        <Trash2 size={15} />
      </IconBtn>
    </div>
  );

  return (
    <div className="border-t border-border hover:bg-[#FCFAF6] transition-colors duration-120">
      {/* Desktop grid row */}
      <div
        className="hidden md:grid items-center px-5 min-h-15 text-[13px] text-ink-800"
        style={{ gridTemplateColumns: GRID }}
      >
        {/* # */}
        <span className="font-mono text-xs text-ink-400">{rowNum}</span>

        {/* Product */}
        <div className="flex items-center gap-3 min-w-0">
          <ProductThumb color={product.color} size={38} />
          <span className="font-medium text-ink-900 truncate">{name}</span>
        </div>

        {/* SKU */}
        <span className="font-mono text-xs text-ink-500 whitespace-nowrap">{product.sku}</span>

        {/* Category */}
        <span className="text-ink-600 whitespace-nowrap">{categoryLabel}</span>

        {/* WH Qty */}
        <span
          className={cn(
            'font-mono font-medium',
            product.warehouse_qty === 0 ? 'text-danger-700' : 'text-ink-800'
          )}
        >
          {product.warehouse_qty.toLocaleString()}
        </span>

        {/* Unit price */}
        <span className="font-mono text-ink-700 whitespace-nowrap">
          د.إ {product.sell_price.toFixed(2)}
        </span>

        {/* Status */}
        <StatusBadge status={status} label={statusLabel} />

        {/* Actions */}
        {actions}
      </div>

      {/* Mobile card */}
      <div className="md:hidden p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <ProductThumb color={product.color} size={42} />
            <div className="min-w-0">
              <p className="font-medium text-ink-900 text-sm truncate">{name}</p>
              <p className="font-mono text-xs text-ink-500 mt-0.5">{product.sku}</p>
            </div>
          </div>
          <StatusBadge status={status} label={statusLabel} />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span className="text-ink-500">
            {p.table.category}: <span className="text-ink-700">{categoryLabel}</span>
          </span>
          <span className="text-ink-500">
            {p.table.warehouseQty}:{' '}
            <span
              className={cn(
                'font-mono font-medium',
                product.warehouse_qty === 0 ? 'text-danger-700' : 'text-ink-700'
              )}
            >
              {product.warehouse_qty.toLocaleString()}
            </span>
          </span>
          <span className="text-ink-500">
            {p.table.unitPrice}:{' '}
            <span className="font-mono text-ink-700">د.إ {product.sell_price.toFixed(2)}</span>
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <IconBtn
            onClick={() => onRestock(product)}
            title={p.restock.title}
            colorClass="text-success-700"
          >
            <PackagePlus size={15} />
          </IconBtn>
          <IconBtn onClick={() => onView(product)} title={p.detail.title} colorClass="text-ink-600">
            <Eye size={15} />
          </IconBtn>
          <IconBtn
            onClick={() => onEdit(product)}
            title={p.form.editTitle}
            colorClass="text-ink-600"
          >
            <Pencil size={15} />
          </IconBtn>
          <IconBtn
            onClick={() => onDelete(product)}
            title={p.delete.delete}
            colorClass="text-danger-700"
          >
            <Trash2 size={15} />
          </IconBtn>
        </div>
      </div>
    </div>
  );
}
