'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, UserPlus, Download } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers';
import { usePermission } from '@/common/hooks/usePermission';
import { ConfirmDialog } from '@/common/components';
import { getErrorMessage } from '@/common/utils/error.utils';
import { downloadCsv, dateStampedName } from '@/common/utils/csv.utils';
import { useCustomers } from '../hooks/useCustomers';
import { useCustomerDetail } from '../hooks/useCustomerDetail';
import { useCustomerStats } from '../hooks/useCustomerStats';
import { useCustomerRows } from '../hooks/useCustomerRows';
import { CustomersTableCard } from './CustomersTableCard';
import { CustomerStatsCards } from './CustomerStatsCards';
import { CustomerFormModal } from './CustomerFormModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import { CollectPaymentModal } from './CollectPaymentModal';
import { CustomerSort, CustomerView } from '../types/customers.types';
import type { Customer, CreateCustomerInput } from '../types/customers.types';

const LIMIT = 15;
const SEARCH_DEBOUNCE_MS = 300;

export function ClientCustomersPage() {
  const { t, locale } = useI18n();
  const c = t.debts.customers;
  const toast = useToast();
  const { isShopOwner } = usePermission();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [view, setView] = useState<CustomerView>(CustomerView.ALL);
  const [sort, setSort] = useState<CustomerSort>(CustomerSort.DEBT_DESC);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deactivating, setDeactivating] = useState<Customer | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // `active` is whichever customer's detail data is loaded; the two booleans say
  // what is actually on screen. Kept apart so "collect" can be reached straight
  // from a list row without the detail modal opening behind it.
  const [active, setActive] = useState<Customer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);

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
      ...(view === CustomerView.HAS_DEBT ? { hasDebt: true } : {}),
      ...(view === CustomerView.REMOVED ? { includeInactive: true } : {}),
    }),
    [page, debouncedSearch, view]
  );

  const {
    customers,
    total,
    totalPages,
    isLoading,
    error,
    createCustomer,
    updateCustomer,
    deactivateCustomer,
    isDeactivating,
    fetchAllForExport,
  } = useCustomers(params);

  const { stats, isLoading: isLoadingStats } = useCustomerStats();
  const { rows } = useCustomerRows(customers, sort);

  // Idle until a row is opened.
  const {
    customer: viewedCustomer,
    summary,
    openDebts,
    isLoading: isLoadingDetail,
    collectPayment,
    isCollecting,
  } = useCustomerDetail(active?.id ?? null);

  const hasFilters = Boolean(debouncedSearch) || view !== CustomerView.ALL;

  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setView(CustomerView.ALL);
    setPage(1);
  }

  function changeView(next: CustomerView) {
    setView(next);
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setFormOpen(true);
  }

  function openDetail(customer: Customer) {
    setActive(customer);
    setDetailOpen(true);
  }

  function openCollect(customer: Customer) {
    setActive(customer);
    setCollectOpen(true);
  }

  // The detail queries stay mounted while either modal is open; drop the active
  // customer only once nothing is left showing, so closing the collect form
  // doesn't blank the detail view sitting behind it.
  function closeDetail() {
    setDetailOpen(false);
    if (!collectOpen) setActive(null);
  }

  function closeCollect() {
    setCollectOpen(false);
    if (!detailOpen) setActive(null);
  }

  // Throws on failure so the modal can render the server message inline
  // (e.g. 409 customer.PHONE_TAKEN) instead of closing over a lost error.
  async function handleSubmit(data: CreateCustomerInput) {
    if (editing) {
      await updateCustomer({ id: editing.id, data });
      toast.success(c.form.updatedToast);
    } else {
      await createCustomer(data);
      toast.success(c.form.createdToast);
    }
  }

  async function handleDeactivate() {
    if (!deactivating) return;
    try {
      await deactivateCustomer(deactivating.id);
      toast.success(c.deactivate.toast);
      setDeactivating(null);
    } catch (err) {
      // 400 customer.HAS_OPEN_DEBT — "settle the balance first".
      toast.error(getErrorMessage(err));
      setDeactivating(null);
    }
  }

  /** Exports every customer matching the current filters, not just this page. */
  async function handleExport() {
    setIsExporting(true);
    try {
      const all = await fetchAllForExport();
      if (all.length === 0) {
        toast.error(c.exportEmpty);
        return;
      }
      downloadCsv(
        dateStampedName('customers'),
        [
          c.table.name,
          c.table.phone,
          c.table.openDebts,
          `${c.table.remaining} (${t.debts.currency})`,
        ],
        // Raw money strings, not the grouped display form: a spreadsheet reads
        // "1952.79" as a number it can total, and "1,952.79" as text it can't.
        all.map((row) => [row.name, row.phone ?? '', row.open_debts_count, row.total_remaining])
      );
      toast.success(c.exportDone.replace('{n}', String(all.length)));
    } catch {
      toast.error(c.exportFailed);
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading && customers.length === 0) {
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
        <p className="text-[14px] text-ink-600">{c.loadError}</p>
      </div>
    );
  }

  return (
    <div className="max-w-330 mx-auto pb-20 sm:pb-6">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-[12px] font-semibold tracking-wider uppercase text-amber-700">
            {c.header.eyebrow}
          </p>
          <h1 className="text-[26px] font-semibold text-ink-900">{c.header.title}</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 sm:px-4 h-10 rounded-lg border border-border bg-paper text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span className="hidden sm:inline">{isExporting ? c.exporting : c.exportBtn}</span>
          </button>

          {/* On a phone the add button lives in the FAB below, where a thumb
              can reach it — no need for it twice. */}
          <button
            onClick={openCreate}
            className="hidden sm:flex items-center gap-2 px-4 h-10 rounded-lg bg-amber-600 text-white text-[14px] font-semibold hover:bg-amber-700 transition-colors cursor-pointer"
          >
            <UserPlus size={16} />
            {c.addBtn}
          </button>
        </div>
      </div>

      <div className="mb-5">
        <CustomerStatsCards
          stats={stats}
          isLoading={isLoadingStats}
          currency={t.debts.currency}
          onWithDebtClick={() => changeView(CustomerView.HAS_DEBT)}
          labels={c.stats}
        />
      </div>

      <CustomersTableCard
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
        onView={openDetail}
        onEdit={openEdit}
        // Only a SHOP_OWNER may deactivate — omit the action for employees
        // rather than letting them discover the 403.
        onDeactivate={isShopOwner ? setDeactivating : undefined}
        onCollect={openCollect}
        onAdd={openCreate}
        currency={t.debts.currency}
        labels={{
          searchPlaceholder: c.searchPlaceholder,
          views: c.views,
          sort: c.sort,
          since: c.since,
          due: c.due,
          callBtn: c.callBtn,
          collectBtn: c.collectBtn,
          footer: c.footer,
          clearFilters: c.filters.clear,
          table: c.table,
          badge: c.badge,
          empty: c.empty,
          emptyFiltered: c.emptyFiltered,
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
        aria-label={c.addBtn}
        className="sm:hidden fixed bottom-18 inset-e-4 z-30 w-14 h-14 rounded-2xl bg-amber-600 text-white shadow-lg flex items-center justify-center active:bg-amber-700 transition-colors"
      >
        <UserPlus size={22} />
      </button>

      <CustomerDetailModal
        open={detailOpen}
        onClose={closeDetail}
        customer={viewedCustomer}
        summary={summary}
        openDebts={openDebts}
        isLoading={isLoadingDetail}
        onCollect={() => setCollectOpen(true)}
        onEdit={() => {
          if (viewedCustomer) openEdit(viewedCustomer);
        }}
        locale={locale}
        currency={t.debts.currency}
        labels={{
          ...c.detail,
          inactiveBadge: c.badge.inactive,
          statusNames: t.debts.status,
        }}
      />

      <CollectPaymentModal
        open={collectOpen}
        onClose={closeCollect}
        customerName={viewedCustomer?.name ?? active?.name ?? ''}
        totalRemaining={summary.total_remaining}
        openDebts={openDebts}
        onCollect={collectPayment}
        isCollecting={isCollecting}
        isLoadingDebts={isLoadingDetail}
        currency={t.debts.currency}
        labels={{
          ...t.debts.collect,
          receiptLabel: c.detail.receiptLink,
          methodNames: t.debts.method,
          statusNames: t.debts.status,
        }}
      />

      <CustomerFormModal
        open={formOpen}
        customer={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        labels={c.form}
      />

      <ConfirmDialog
        open={deactivating !== null}
        onClose={() => setDeactivating(null)}
        onConfirm={handleDeactivate}
        title={c.deactivate.title}
        description={c.deactivate.description}
        confirmLabel={c.deactivate.confirm}
        cancelLabel={c.form.cancel}
        isLoading={isDeactivating}
      />
    </div>
  );
}
