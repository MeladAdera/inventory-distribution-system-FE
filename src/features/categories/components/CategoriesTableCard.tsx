'use client';

import { Search, Download, TagsIcon, Pencil, Trash2, Plus } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import { CategoryThumb } from './CategoryThumb';
import type { Category } from '../types/categories.types';

const GRID = '40px 1fr 160px 120px';

type CategoriesT = ReturnType<typeof useI18n>['t']['categories'];

// ── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div
      className="grid gap-4 px-5 py-4 border-t border-border"
      style={{ gridTemplateColumns: GRID }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded skeleton-shimmer"
          style={{ width: i === 0 ? '40%' : '60%' }}
        />
      ))}
    </div>
  );
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

interface CategoriesTableCardProps {
  categories: Category[];
  isLoading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  onAddCategory: () => void;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function CategoriesTableCard({
  categories,
  isLoading,
  search,
  onSearchChange,
  onAddCategory,
  onEdit,
  onDelete,
}: CategoriesTableCardProps) {
  const { t } = useI18n();
  const c = t.categories;

  const filtered = search
    ? categories.filter((cat) => cat.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2 h-9.5 px-3 border border-border rounded-lg bg-paper min-w-45 flex-1 sm:flex-none sm:w-55">
          <Search size={15} className="text-ink-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={c.toolbar.searchPlaceholder}
            className="flex-1 text-[13px] text-ink-900 placeholder-ink-400 bg-transparent focus:outline-none"
          />
        </div>

        <div className="flex-1" />

        <button className="inline-flex items-center gap-2 h-9.5 px-4 border border-border rounded-lg bg-paper text-[13px] text-ink-700 font-medium hover:bg-sand-100 transition-colors">
          <Download size={15} />
          {c.toolbar.export}
        </button>
      </div>

      {/* ── Table header (desktop) ───────────────────────────────────── */}
      <div
        className="hidden md:grid items-center bg-sand-100 border-b border-border px-5 py-3"
        style={{ gridTemplateColumns: GRID }}
      >
        <span className="text-xs font-medium text-ink-500">{c.table.num}</span>
        <span className="text-xs font-medium text-ink-500">{c.table.category}</span>
        <span className="text-xs font-medium text-ink-500">{c.table.created}</span>
        <span className="text-xs font-medium text-ink-500 text-end">{c.table.actions}</span>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={onAddCategory} c={c} />
      ) : (
        filtered.map((cat, idx) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            rowNum={idx + 1}
            c={c}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ onAdd, c }: { onAdd: () => void; c: CategoriesT }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-[14px] bg-sand-100 border border-border flex items-center justify-center mb-4">
        <TagsIcon size={24} className="text-ink-400" />
      </div>
      <p className="text-base font-semibold text-ink-900">{c.emptyState.title}</p>
      <p className="mt-1.5 text-sm text-ink-500 max-w-xs">{c.emptyState.sub}</p>
      <button
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus size={15} />
        {c.emptyState.addCategory}
      </button>
    </div>
  );
}

// ── Table row ──────────────────────────────────────────────────────────────

interface CategoryRowProps {
  category: Category;
  rowNum: number;
  c: CategoriesT;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}

function CategoryRow({ category, rowNum, c, onEdit, onDelete }: CategoryRowProps) {
  const createdDate = new Date(category.created_at).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const actions = (
    <div className="flex items-center gap-0.5 justify-end">
      <IconBtn onClick={() => onEdit(category)} title={c.form.editTitle} colorClass="text-ink-600">
        <Pencil size={15} />
      </IconBtn>
      <IconBtn
        onClick={() => onDelete(category)}
        title={c.delete.delete}
        colorClass="text-danger-700"
      >
        <Trash2 size={15} />
      </IconBtn>
    </div>
  );

  return (
    <div className="border-t border-border hover:bg-[#FCFAF6] transition-colors duration-120">
      {/* Desktop row */}
      <div
        className="hidden md:grid items-center px-5 min-h-15 text-[13px] text-ink-800"
        style={{ gridTemplateColumns: GRID }}
      >
        <span className="font-mono text-xs text-ink-400">{rowNum}</span>

        <div className="flex items-center gap-3 min-w-0">
          <CategoryThumb id={category.id} size={38} imageUrl={category.image_url} />
          <span className="font-medium text-ink-900 truncate">{category.name}</span>
        </div>

        <span className="text-ink-500 text-xs">{createdDate}</span>

        {actions}
      </div>

      {/* Mobile card */}
      <div className="md:hidden p-4 flex items-center gap-3">
        <CategoryThumb id={category.id} size={42} imageUrl={category.image_url} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-ink-900 text-sm truncate">{category.name}</p>
          <p className="text-xs text-ink-500 mt-0.5">{createdDate}</p>
        </div>
        <div className="flex items-center gap-0.5">{actions}</div>
      </div>
    </div>
  );
}
