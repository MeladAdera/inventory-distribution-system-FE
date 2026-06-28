import { Loader2 } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { ProductThumb } from '@/features/shared/products/components/ProductThumb';
import { useReceiptDetail } from '@/features/shared/receipts';

function formatDate(iso: string, locale: 'ar' | 'en'): string {
  const date = new Date(iso);
  if (locale === 'ar') {
    const day = date.getDate();
    const year = date.getFullYear();
    const month = new Intl.DateTimeFormat('ar', { month: 'long' }).format(date);
    return `${day} / ${month} / ${year}`;
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

interface ReceiptDetailModalProps {
  receiptId: number | null;
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
  };
}

export function ReceiptDetailModal({
  receiptId,
  open,
  onClose,
  locale,
  labels,
}: ReceiptDetailModalProps) {
  const { receipt, isLoading } = useReceiptDetail(open ? receiptId : null);

  return (
    <Modal open={open} onClose={onClose} title={`${labels.title} #${receiptId ?? ''}`} size="md">
      {isLoading || !receipt ? (
        <div className="flex items-center justify-center py-12 gap-2 text-ink-500">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Meta row */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
            <div>
              <span className="text-ink-400">{labels.date}: </span>
              <span className="text-ink-700 font-medium">
                {formatDate(receipt.created_at, locale)}
              </span>
            </div>
            {receipt.notes && (
              <div>
                <span className="text-ink-400">{labels.notesLabel}: </span>
                <span className="text-ink-700 font-medium">{receipt.notes}</span>
              </div>
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

      <div className="flex justify-end pt-4 border-t border-border mt-4">
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
