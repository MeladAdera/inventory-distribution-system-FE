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
import { ProductBanner } from './ProductBanner';
import { StatusBadge } from './StatusBadge';
import type { Product, ProductSource } from '../types/products.types';
import type { Category } from '@/features/shared/categories/types/categories.types';
import type { Shop } from '@/features/admin/shops/types/shops.types';

const GRID = '40px 2fr 1.2fr 1.2fr 1fr 1fr 1fr 156px';
const HEADER_KEYS = [
  'num',
  'product',
  'barcode',
  'category',
  'price',
  'source',
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
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded skeleton-shimmer"
          style={{ width: i === 0 ? '70%' : '55%' }}
        />
      ))}
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
  products: Product[];
  total: number;
  isLoading: boolean;
  page: number;
  pageSize: number;
  startIndex: number;
  search: string;
  shopNameFilter: string;
  categoryFilter: string;
  categories: Category[];
  shops: Shop[];
  isAdmin: boolean;
  onSearchChange: (v: string) => void;
  onShopNameChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onAddProduct: () => void;
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onRestock: (p: Product) => void;
  onDelete: (p: Product) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function ProductsTableCard({
  products,
  total,
  isLoading,
  page,
  pageSize,
  startIndex,
  search,
  shopNameFilter,
  categoryFilter,
  categories,
  shops,
  isAdmin,
  onSearchChange,
  onShopNameChange,
  onCategoryChange,
  onPageChange,
  onAddProduct,
  onView,
  onEdit,
  onRestock,
  onDelete,
}: ProductsTableCardProps) {
  const { t } = useI18n();
  const p = t.products;

  const pageCount = Math.ceil(total / pageSize);
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
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Shop filter (admin only) */}
        {isAdmin && (
          <select
            value={shopNameFilter}
            onChange={(e) => onShopNameChange(e.target.value)}
            className={selectCls}
          >
            <option value="">{p.toolbar.allShops}</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.name}>
                {shop.name}
              </option>
            ))}
          </select>
        )}

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
              .replace('{total}', String(total))}
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
  product: Product;
  rowNum: number;
  p: ProductsT;
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onRestock: (p: Product) => void;
  onDelete: (p: Product) => void;
}

function ProductRow({ product, rowNum, p, onView, onEdit, onRestock, onDelete }: ProductRowProps) {
  const categoryName = product.category_name;
  const sourceLabel = p.toolbar.sources[product.source as ProductSource];
  const statusLabel = product.is_active ? p.toolbar.statuses.active : p.toolbar.statuses.inactive;

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
        <span className="font-mono text-xs text-ink-400">{rowNum}</span>

        <div className="flex items-center gap-3 min-w-0">
          <ProductThumb id={product.id} size={38} imageUrl={product.image_url} />
          <span className="font-medium text-ink-900 truncate">{product.name}</span>
        </div>

        <span className="font-mono text-xs text-ink-500 whitespace-nowrap">
          {product.barcode ?? '—'}
        </span>

        <span className="text-ink-600 whitespace-nowrap">{categoryName}</span>

        <span className="font-mono text-ink-700 whitespace-nowrap">
          د.إ {Number(product.price).toFixed(2)}
        </span>

        <span className="text-ink-600">{sourceLabel}</span>

        <StatusBadge isActive={product.is_active} label={statusLabel} />

        {actions}
      </div>

      {/* Mobile card */}
      <div className="md:hidden flex flex-col">
        <ProductBanner id={product.id} imageUrl={product.image_url} height="h-40" />
        <div className="p-4 flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-ink-900 text-[15px] leading-snug">{product.name}</p>
            <StatusBadge isActive={product.is_active} label={statusLabel} />
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
            <span className="text-ink-500">
              {p.table.category}: <span className="text-ink-700">{categoryName}</span>
            </span>
            <span className="text-ink-500">
              {p.table.price}:{' '}
              <span className="font-mono text-ink-700">د.إ {Number(product.price).toFixed(2)}</span>
            </span>
            <span className="text-ink-500">
              {p.table.source}: <span className="text-ink-700">{sourceLabel}</span>
            </span>
          </div>
          <div className="flex items-center gap-0.5 pt-1 border-t border-border">{actions}</div>
        </div>
      </div>
    </div>
  );
}
