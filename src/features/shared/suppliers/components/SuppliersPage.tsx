'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Download, Plus } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers';
import { ConfirmDialog } from '@/common/components';
import { getErrorMessage } from '@/common/utils/error.utils';
import { downloadCsv, dateStampedName } from '@/common/utils/csv.utils';
import { useSuppliers } from '../hooks/useSuppliers';
import { useSupplierStats } from '../hooks/useSupplierStats';
import { useSupplierRows } from '../hooks/useSupplierRows';
import { SuppliersTableCard } from './SuppliersTableCard';
import { SupplierStatsCards } from './SupplierStatsCards';
import { SupplierFormModal } from './SupplierFormModal';
import { SupplierSort, SupplierView } from '../types/suppliers.types';
import type { Supplier, CreateSupplierInput } from '../types/suppliers.types';

const LIMIT = 15;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Suppliers — who this shop buys from, and what it still owes each of them.
 *
 * Rendered unchanged by BOTH portals: `/suppliers` for a warehouse admin and
 * `/client/suppliers` for a shop owner. There is nothing to branch on, because
 * the API resolves the shop from the caller either way — the warehouse buys from
 * its own distribution centers exactly as a shop buys from its local suppliers.
 * Only the surrounding layout differs, and that is the route's job, not this
 * component's.
 *
 * No role gate on the page itself: every `/suppliers` endpoint is ADMIN or OWNER
 * only, and an EMPLOYEE never reaches either route — the middleware turns them
 * away and neither nav offers it.
 */
export function SuppliersPage() {
  const { t } = useI18n();
  const s = t.debts.suppliers;
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [view, setView] = useState<SupplierView>(SupplierView.ALL);
  const [sort, setSort] = useState<SupplierSort>(SupplierSort.DEBT_DESC);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deactivating, setDeactivating] = useState<Supplier | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Typing a search shouldn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const params = useMemo(
    () => ({
      page,
      limit: LIMIT,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(view === SupplierView.HAS_DEBT ? { hasDebt: true } : {}),
      ...(view === SupplierView.REMOVED ? { includeInactive: true } : {}),
    }),
    [page, debouncedSearch, view]
  );

  const {
    suppliers,
    total,
    totalPages,
    isLoading,
    error,
    createSupplier,
    updateSupplier,
    deactivateSupplier,
    isDeactivating,
    fetchAllForExport,
  } = useSuppliers(params);

  const { stats, isLoading: isLoadingStats } = useSupplierStats();
  const { rows } = useSupplierRows(suppliers, sort);

  const hasFilters = Boolean(debouncedSearch) || view !== SupplierView.ALL;

  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setView(SupplierView.ALL);
    setPage(1);
  }

  function changeView(next: SupplierView) {
    setView(next);
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setFormOpen(true);
  }

  // Throws on failure so the modal can render the server message inline
  // (e.g. 409 supplier.PHONE_TAKEN) instead of closing over a lost error.
  async function handleSubmit(data: CreateSupplierInput) {
    if (editing) {
      await updateSupplier({ id: editing.id, data });
      toast.success(s.form.updatedToast);
    } else {
      await createSupplier(data);
      toast.success(s.form.createdToast);
    }
  }

  async function handleDeactivate() {
    if (!deactivating) return;
    try {
      await deactivateSupplier(deactivating.id);
      toast.success(s.deactivate.toast);
      setDeactivating(null);
    } catch (err) {
      // 400 supplier.HAS_OPEN_DEBT — "settle the balance first".
      toast.error(getErrorMessage(err));
      setDeactivating(null);
    }
  }

  /** Exports every supplier matching the current filters, not just this page. */
  async function handleExport() {
    setIsExporting(true);
    try {
      const all = await fetchAllForExport();
      if (all.length === 0) {
        toast.error(s.exportEmpty);
        return;
      }
      downloadCsv(
        dateStampedName('suppliers'),
        [
          s.table.name,
          s.table.phone,
          s.table.openBills,
          `${s.table.remaining} (${t.debts.currency})`,
        ],
        // Raw money strings, not the grouped display form: a spreadsheet reads
        // "1952.79" as a number it can total, and "1,952.79" as text it can't.
        all.map((row) => [row.name, row.phone ?? '', row.open_debts_count, row.total_remaining])
      );
      toast.success(s.exportDone.replace('{n}', String(all.length)));
    } catch {
      toast.error(s.exportFailed);
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading && suppliers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-ink-500">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle size={28} className="text-danger-700" />
        <p className="text-[14px] text-ink-600">{s.loadError}</p>
      </div>
    );
  }

  return (
    <div className="max-w-330 mx-auto pb-20 sm:pb-6">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-[12px] font-semibold tracking-wider uppercase text-amber-700">
            {s.header.eyebrow}
          </p>
          <h1 className="text-[26px] font-semibold text-ink-900">{s.header.title}</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 sm:px-4 h-10 rounded-lg border border-border bg-paper text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span className="hidden sm:inline">{isExporting ? s.exporting : s.exportBtn}</span>
          </button>

          {/* On a phone the add button lives in the FAB below, where a thumb can
              reach it — no need for it twice. */}
          <button
            onClick={openCreate}
            className="hidden sm:flex items-center gap-2 px-4 h-10 rounded-lg bg-amber-600 text-white text-[14px] font-semibold hover:bg-amber-700 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            {s.addBtn}
          </button>
        </div>
      </div>

      <div className="mb-5">
        <SupplierStatsCards
          stats={stats}
          isLoading={isLoadingStats}
          currency={t.debts.currency}
          onWithDebtClick={() => changeView(SupplierView.HAS_DEBT)}
          labels={s.stats}
        />
      </div>

      <SuppliersTableCard
        rows={rows}
        total={total}
        search={search}
        view={view}
        sort={sort}
        hasFilters={hasFilters}
        onSearchChange={setSearch}
        onViewChange={changeView}
        onSortChange={setSort}
        onClearFilters={clearFilters}
        onEdit={openEdit}
        onDeactivate={setDeactivating}
        onAdd={openCreate}
        currency={t.debts.currency}
        labels={{
          searchPlaceholder: s.searchPlaceholder,
          views: s.views,
          sort: s.sort,
          since: s.since,
          callBtn: s.callBtn,
          footer: s.footer,
          clearFilters: s.filters.clear,
          table: s.table,
          badge: s.badge,
          empty: s.empty,
          emptyFiltered: s.emptyFiltered,
        }}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-[13px] text-ink-400">
            {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="h-9 px-4 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ‹
            </button>
            <span className="h-9 px-3 flex items-center text-[13px] text-ink-600 tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="h-9 px-4 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Mobile add button. Sits clear of the fixed bottom nav (h-14). */}
      <button
        onClick={openCreate}
        aria-label={s.addBtn}
        className="sm:hidden fixed bottom-18 inset-e-4 z-30 w-14 h-14 rounded-2xl bg-amber-600 text-white shadow-lg flex items-center justify-center active:bg-amber-700 transition-colors"
      >
        <Plus size={22} />
      </button>

      <SupplierFormModal
        open={formOpen}
        supplier={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        labels={s.form}
      />

      <ConfirmDialog
        open={deactivating !== null}
        onClose={() => setDeactivating(null)}
        onConfirm={handleDeactivate}
        title={s.deactivate.title}
        description={s.deactivate.description}
        confirmLabel={s.deactivate.confirm}
        cancelLabel={s.form.cancel}
        isLoading={isDeactivating}
      />
    </div>
  );
}
