'use client';

import { Loader2, Phone, AlertTriangle, HandCoins, Pencil } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { formatMoney, isPositiveMoney } from '@/common/utils/money';
import { DebtStatusBadge } from '@/features/shared/debts';
import type { DebtStatus, DebtListItem, DebtsSummary } from '@/features/shared/debts';
import type { Customer } from '../types/customers.types';

function formatDate(iso: string, locale: 'ar' | 'en'): string {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface CustomerDetailModalProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  summary: DebtsSummary;
  openDebts: DebtListItem[];
  isLoading: boolean;
  onCollect: () => void;
  onEdit: () => void;
  locale: 'ar' | 'en';
  currency: string;
  labels: {
    title: string;
    billed: string;
    collected: string;
    remaining: string;
    openCount: string;
    refundDue: string;
    debtsTitle: string;
    noDebts: string;
    receiptLink: string;
    collectBtn: string;
    editBtn: string;
    close: string;
    inactiveBadge: string;
    statusNames: Record<DebtStatus, string>;
  };
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">{label}</p>
      <p
        className={`font-mono text-[16px] font-bold tabular-nums ${
          accent ? 'text-amber-700' : 'text-ink-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function CustomerDetailModal({
  open,
  onClose,
  customer,
  summary,
  openDebts,
  isLoading,
  onCollect,
  onEdit,
  locale,
  currency,
  labels,
}: CustomerDetailModalProps) {
  const owesMoney = isPositiveMoney(summary.total_remaining);

  return (
    <Modal open={open} onClose={onClose} title={customer?.name ?? labels.title} size="lg">
      {isLoading || !customer ? (
        <div className="flex items-center justify-center py-12 text-ink-500">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Identity */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
            {customer.phone && (
              <span className="inline-flex items-center gap-1.5 text-ink-600">
                <Phone size={12} className="text-ink-400" />
                <span className="font-mono" dir="ltr">
                  {customer.phone}
                </span>
              </span>
            )}
            {!customer.is_active && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-sand-200 text-ink-500">
                {labels.inactiveBadge}
              </span>
            )}
            {customer.note && <span className="text-ink-500">{customer.note}</span>}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-page border border-border rounded-xl">
            <Stat label={labels.billed} value={formatMoney(summary.total_billed)} />
            <Stat label={labels.collected} value={formatMoney(summary.total_collected)} />
            <Stat
              label={labels.remaining}
              value={formatMoney(summary.total_remaining)}
              accent={owesMoney}
            />
            <Stat label={labels.openCount} value={String(summary.open_count)} />
          </div>

          {/* Money owed BACK to the customer, from a cancelled sale they'd paid.
              v1 has no endpoint to process it, so this is information only. */}
          {isPositiveMoney(summary.refund_due) && (
            <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg bg-warning-100 text-warning-700">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <p className="text-[13px]">
                {labels.refundDue.replace(
                  '{amount}',
                  `${formatMoney(summary.refund_due)} ${currency}`
                )}
              </p>
            </div>
          )}

          {/* Unpaid sales */}
          <div>
            <p className="text-[12px] font-semibold tracking-wider uppercase text-ink-400 mb-2">
              {labels.debtsTitle}
            </p>
            {openDebts.length === 0 ? (
              <p className="text-[13px] text-ink-500 py-6 text-center bg-page border border-border rounded-xl">
                {labels.noDebts}
              </p>
            ) : (
              <div className="border border-border rounded-xl divide-y divide-border max-h-64 overflow-y-auto">
                {openDebts.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-medium text-ink-900">
                        {labels.receiptLink.replace('{id}', String(d.receipt_id ?? d.id))}
                      </span>
                      <span className="block text-[12px] text-ink-400">
                        {formatDate(d.created_at, locale)}
                      </span>
                    </span>
                    <span className="font-mono text-[13px] font-bold text-amber-700 tabular-nums text-end shrink-0">
                      {formatMoney(d.remaining)}
                    </span>
                    <DebtStatusBadge status={d.status} label={labels.statusNames[d.status]} small />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-4 border-t border-border mt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onCollect}
            disabled={!owesMoney}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-amber-600 text-[13px] font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <HandCoins size={15} />
            {labels.collectBtn}
          </button>
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
          >
            <Pencil size={14} />
            {labels.editBtn}
          </button>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors shrink-0"
        >
          {labels.close}
        </button>
      </div>
    </Modal>
  );
}
