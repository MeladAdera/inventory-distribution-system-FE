import { Loader2 } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { ProductThumb } from '@/features/shared/products/components/ProductThumb';
import { useReceiptDetail } from '@/features/shared/receipts';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/common/utils/error.utils';

function formatDate(iso: string, locale: 'ar' | 'en'): string {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface ReceiptDetailModalProps {
  receiptId: number | null;
  // Not part of GET /receipts/:id — comes from the list row (ReceiptListItem)
  // the caller already fetched, same pattern as audit logs' user_name.
  createdByName?: string;
  open: boolean;
  onClose: () => void;
  locale: 'ar' | 'en';
  labels: {
    title: string;
    product: string;
    consumed: string;
    before: string;
    after: string;
    price: string;
    totalPrice: string;
    notesLabel: string;
    createdBy: string;
    date: string;
    closeBtn: string;
    noNotes: string;
    freeBadge: string;
    makeFreeBtn: string;
    undoFreeBtn: string;
    freeSuccess: string;
    unfreeSuccess: string;
    freeError: string;
  };
}

export function ReceiptDetailModal({
  receiptId,
  createdByName,
  open,
  onClose,
  locale,
  labels,
}: ReceiptDetailModalProps) {
  const { receipt, isLoading, setFree, isSettingFree } = useReceiptDetail(open ? receiptId : null);
  const { success: toastSuccess, error: toastError } = useToast();

  async function handleToggleFree() {
    if (!receipt) return;
    const nextIsFree = !receipt.is_free;
    try {
      await setFree(nextIsFree);
      toastSuccess(nextIsFree ? labels.freeSuccess : labels.unfreeSuccess);
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`${labels.title} #${receiptId ?? ''}`} size="md">
      {isLoading || !receipt ? (
        <div className="flex items-center justify-center py-12 gap-2 text-ink-500">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
            <div>
              <span className="text-ink-400">{labels.date}: </span>
              <span className="text-ink-700 font-medium">
                {formatDate(receipt.created_at, locale)}
              </span>
            </div>
            {createdByName && (
              <div>
                <span className="text-ink-400">{labels.createdBy}: </span>
                <span className="text-ink-700 font-medium">{createdByName}</span>
              </div>
            )}
            {receipt.notes && (
              <div>
                <span className="text-ink-400">{labels.notesLabel}: </span>
                <span className="text-ink-700 font-medium">{receipt.notes}</span>
              </div>
            )}
            {receipt.is_free && (
              <span className="inline-flex items-center h-5.5 px-2 rounded-full bg-amber-100 text-amber-700 text-[11px] font-medium">
                {labels.freeBadge}
              </span>
            )}
          </div>

          {/* Items table */}
          <div className="rounded-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 bg-sand-100 border-b border-border px-4 py-2.5">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">
                {labels.product}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 text-end w-12">
                {labels.before}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 text-end w-14">
                {labels.consumed}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 text-end w-12">
                {labels.after}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 text-end w-16">
                {labels.price}
              </span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border max-h-64 overflow-y-auto">
              {receipt.items.map((item) => {
                const lineTotal = parseFloat(item.price) * item.quantity;
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ProductThumb id={item.product_id} size={26} />
                      <span className="text-[13px] text-ink-800 truncate">{item.product_name}</span>
                    </div>
                    <span className="font-mono text-[13px] text-ink-400 w-12 text-end">
                      {item.quantity_before}
                    </span>
                    <span className="font-mono text-[13px] font-semibold text-danger-600 w-14 text-end">
                      −{item.quantity}
                    </span>
                    <span className="font-mono text-[13px] text-ink-700 w-12 text-end">
                      {item.quantity_after}
                    </span>
                    <span className="font-mono text-[13px] text-ink-600 w-16 text-end">
                      {lineTotal.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Total row */}
            <div className="flex items-center justify-between px-4 py-3 bg-sand-50 border-t border-border">
              <span className="text-[13px] font-semibold text-ink-700">{labels.totalPrice}</span>
              <span className="font-mono text-[15px] font-bold text-ink-900">
                {receipt.total_price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
        {receipt && (
          <button
            onClick={handleToggleFree}
            disabled={isSettingFree}
            className="h-9 px-4 rounded-lg border border-amber-300 bg-amber-50 text-[13px] font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            {isSettingFree ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                {receipt.is_free ? labels.undoFreeBtn : labels.makeFreeBtn}
              </span>
            ) : receipt.is_free ? (
              labels.undoFreeBtn
            ) : (
              labels.makeFreeBtn
            )}
          </button>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
        >
          {labels.closeBtn}
        </button>
      </div>
    </Modal>
  );
}
