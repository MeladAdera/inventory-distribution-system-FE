'use client';

import { Loader2, Phone, AlertTriangle, FilePlus2, Pencil } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { formatMoney, isPositiveMoney } from '@/common/utils/money';
import { DebtStatusBadge } from '@/features/shared/debts';
import type { DebtStatus } from '@/features/shared/debts';
import type { Supplier, SupplierBill, SupplierSummary } from '../types/suppliers.types';

function formatDate(iso: string, locale: 'ar' | 'en'): string {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface SupplierDetailModalProps {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  summary: SupplierSummary;
  /** Every bill, settled ones included — this is the account history. */
  bills: SupplierBill[];
  isLoading: boolean;
  onRecordBill: () => void;
  onEdit: () => void;
  locale: 'ar' | 'en';
  currency: string;
  labels: {
    title: string;
    billed: string;
    paid: string;
    remaining: string;
    openCount: string;
    refundDue: string;
    billsTitle: string;
    noBills: string;
    noInvoiceNo: string;
    billRef: string;
    recordBillBtn: string;
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
          accent ? 'text-danger-700' : 'text-ink-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function SupplierDetailModal({
  open,
  onClose,
  supplier,
  summary,
  bills,
  isLoading,
  onRecordBill,
  onEdit,
  locale,
  currency,
  labels,
}: SupplierDetailModalProps) {
  const owesMoney = isPositiveMoney(summary.total_remaining);

  return (
    <Modal open={open} onClose={onClose} title={supplier?.name ?? labels.title} size="lg">
      {isLoading || !supplier ? (
        <div className="flex items-center justify-center py-12 text-ink-500">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Identity */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
            {supplier.phone && (
              <span className="inline-flex items-center gap-1.5 text-ink-600">
                <Phone size={12} className="text-ink-400" />
                <span className="font-mono" dir="ltr">
                  {supplier.phone}
                </span>
              </span>
            )}
            {!supplier.is_active && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-sand-200 text-ink-500">
                {labels.inactiveBadge}
              </span>
            )}
            {supplier.note && <span className="text-ink-500">{supplier.note}</span>}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-page border border-border rounded-xl">
            <Stat label={labels.billed} value={formatMoney(summary.total_billed)} />
            <Stat label={labels.paid} value={formatMoney(summary.total_collected)} />
            <Stat
              label={labels.remaining}
              value={formatMoney(summary.total_remaining)}
              accent={owesMoney}
            />
            <Stat label={labels.openCount} value={String(summary.open_count)} />
          </div>

          {/* Money the SUPPLIER owes back, from a cancelled bill the shop had
              paid against. v1 only reports it — there is no endpoint to settle
              a refund — so this stays a flagged line, never a button. */}
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

          {/* Bills. Settled ones stay listed — unlike the customer view, which
              shows only what is still owed. A supplier account is a running
              relationship, and "what did we buy from them" is the question the
              invoice numbers are here to answer. */}
          <div>
            <p className="text-[12px] font-semibold tracking-wider uppercase text-ink-400 mb-2">
              {labels.billsTitle}
            </p>
            {bills.length === 0 ? (
              <p className="text-[13px] text-ink-500 py-6 text-center bg-page border border-border rounded-xl">
                {labels.noBills}
              </p>
            ) : (
              <div className="border border-border rounded-xl divide-y divide-border max-h-64 overflow-y-auto">
                {bills.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-medium text-ink-900 truncate">
                        {b.invoice_no ? (
                          <bdi className="font-mono">{b.invoice_no}</bdi>
                        ) : (
                          // A bill with no invoice number is complete, not
                          // missing data — name it rather than showing a dash.
                          <span className="text-ink-500">
                            {labels.noInvoiceNo}
                            <span className="text-ink-400">
                              {' · '}
                              {labels.billRef.replace('{id}', String(b.id))}
                            </span>
                          </span>
                        )}
                      </span>
                      <span className="block text-[12px] text-ink-400">
                        {formatDate(b.created_at, locale)}
                      </span>
                    </span>
                    <span className="text-end shrink-0">
                      <span className="block font-mono text-[13px] font-bold tabular-nums text-danger-700">
                        {formatMoney(b.remaining)}
                      </span>
                      <span className="block font-mono text-[11px] text-ink-400 tabular-nums">
                        {formatMoney(b.total_amount)}
                      </span>
                    </span>
                    <DebtStatusBadge status={b.status} label={labels.statusNames[b.status]} small />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-4 border-t border-border mt-4">
        <div className="flex items-center gap-2">
          {/* Always available, unlike the customer modal's collect button: a new
              delivery can arrive whether or not anything is currently owed. */}
          <button
            onClick={onRecordBill}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-amber-600 text-[13px] font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            <FilePlus2 size={15} />
            {labels.recordBillBtn}
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
