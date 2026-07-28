'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, UserPlus } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers';
import { usePermission } from '@/common/hooks/usePermission';
import { ConfirmDialog } from '@/common/components';
import { getErrorMessage } from '@/common/utils/error.utils';
import { useCustomers } from '../hooks/useCustomers';
import { useCustomerDetail } from '../hooks/useCustomerDetail';
import { CustomersTableCard } from './CustomersTableCard';
import { CustomerFormModal } from './CustomerFormModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import { CollectPaymentModal } from './CollectPaymentModal';
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
  const [hasDebt, setHasDebt] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deactivating, setDeactivating] = useState<Customer | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);
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
      ...(hasDebt ? { hasDebt: true } : {}),
      ...(includeInactive ? { includeInactive: true } : {}),
    }),
    [page, debouncedSearch, hasDebt, includeInactive]
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
  } = useCustomers(params);

  // Idle until a row is opened.
  const {
    customer: viewedCustomer,
    summary,
    openDebts,
    isLoading: isLoadingDetail,
    collectPayment,
    isCollecting,
  } = useCustomerDetail(viewingId);

  const hasFilters = Boolean(debouncedSearch) || hasDebt || includeInactive;

  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setHasDebt(false);
    setIncludeInactive(false);
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
    <div className="max-w-330 mx-auto">
      <div className="flex items-end justify-between gap-4 mb-5.5">
        <div>
          <p className="text-[12px] font-semibold tracking-wider uppercase text-amber-700">
            {c.header.eyebrow}
          </p>
          <h1 className="text-[26px] font-semibold text-ink-900">{c.header.title}</h1>
          <p className="text-[14px] text-ink-500 mt-1">
            {total > 0 ? c.count.replace('{n}', String(total)) : c.header.subtitle}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 h-10 rounded-lg bg-amber-600 text-white text-[14px] font-semibold hover:bg-amber-700 transition-colors shrink-0"
        >
          <UserPlus size={16} />
          <span className="hidden sm:inline">{c.addBtn}</span>
        </button>
      </div>

      <CustomersTableCard
        customers={customers}
        search={search}
        hasDebt={hasDebt}
        includeInactive={includeInactive}
        hasFilters={hasFilters}
        onSearchChange={setSearch}
        onHasDebtChange={(v) => {
          setHasDebt(v);
          setPage(1);
        }}
        onIncludeInactiveChange={(v) => {
          setIncludeInactive(v);
          setPage(1);
        }}
        onClearFilters={clearFilters}
        onView={(customer) => setViewingId(customer.id)}
        onEdit={openEdit}
        // Only a SHOP_OWNER may deactivate — omit the action for employees
        // rather than letting them discover the 403.
        onDeactivate={isShopOwner ? setDeactivating : undefined}
        onAdd={openCreate}
        currency={t.debts.currency}
        labels={{
          searchPlaceholder: c.searchPlaceholder,
          filters: c.filters,
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

      <CustomerDetailModal
        open={viewingId !== null}
        onClose={() => setViewingId(null)}
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
        onClose={() => setCollectOpen(false)}
        customerName={viewedCustomer?.name ?? ''}
        totalRemaining={summary.total_remaining}
        openDebts={openDebts}
        onCollect={collectPayment}
        isCollecting={isCollecting}
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
