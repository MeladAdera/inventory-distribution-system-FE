'use client';

import { Loader2 } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { ProductThumb } from '@/features/products/components/ProductThumb';
import { ClientAvatar } from '@/features/clients/components/ClientAvatar';
import { cn } from '@/common/utils/cn';
import { TransferStatus, NEXT_STATUS } from '../types/transfers.types';
import type { Transfer } from '../types/transfers.types';

const STATUS_STYLES: Record<TransferStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  SHIPPED: 'bg-purple-50 text-purple-700 border-purple-200',
  RECEIVED: 'bg-teal-50 text-teal-700 border-teal-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
};

interface TransferDetailModalProps {
  transfer: Transfer | null;
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  isLoadingDetail: boolean;
  isUpdatingStatus: boolean;
  onUpdateStatus: (id: number, status: TransferStatus) => void;
  labels: {
    title: string;
    shop: string;
    productsLabel: string;
    qty: string;
    price: string;
    totalPrice: string;
    closeBtn: string;
    statusLabels: Record<TransferStatus, string>;
    actionLabels: {
      process: string;
      ship: string;
      complete: string;
      awaitingReceipt: string;
    };
  };
}

export function TransferDetailModal({
  transfer,
  open,
  onClose,
  isAdmin,
  isLoadingDetail,
  isUpdatingStatus,
  onUpdateStatus,
  labels,
}: TransferDetailModalProps) {
  if (isLoadingDetail || !transfer) {
    return (
      <Modal open={open} onClose={onClose} title={labels.title} size="lg">
        <div className="flex items-center justify-center h-40">
          <Loader2 size={22} className="animate-spin text-ink-400" />
        </div>
      </Modal>
    );
  }

  const date = new Date(transfer.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const shopName = transfer.to_shop_name ?? `Shop #${transfer.to_shop_id}`;
  const nextStatus = NEXT_STATUS[transfer.status];

  function getActionLabel(): string {
    switch (transfer!.status) {
      case TransferStatus.PENDING:
        return labels.actionLabels.process;
      case TransferStatus.PROCESSING:
        return labels.actionLabels.ship;
      case TransferStatus.RECEIVED:
        return labels.actionLabels.complete;
      default:
        return '';
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={labels.title} size="lg">
      {/* Order meta */}
      <div className="flex items-center gap-4 mb-5">
        <span
          className={cn(
            'inline-flex items-center h-6 px-2.5 rounded-full border text-[11px] font-medium shrink-0',
            STATUS_STYLES[transfer.status]
          )}
        >
          {labels.statusLabels[transfer.status]}
        </span>
        <div className="flex items-center gap-2.5 min-w-0">
          <ClientAvatar name={shopName} size={28} />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-ink-900 truncate">{shopName}</p>
            <p className="text-[12px] text-ink-500 mt-0.5">{date}</p>
          </div>
        </div>
      </div>

      {/* Product list */}
      <p className="text-[12px] font-medium uppercase tracking-wide text-ink-400 mb-3">
        {labels.productsLabel}
      </p>
      <div className="border border-border rounded-[10px] overflow-hidden mb-5">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 bg-sand-100 border-b border-border">
          <span className="text-[11px] font-medium text-ink-500">Product</span>
          <span className="text-[11px] font-medium text-ink-500 text-end w-20">{labels.price}</span>
          <span className="text-[11px] font-medium text-ink-500 text-end w-16">{labels.qty}</span>
        </div>

        {transfer.items && transfer.items.length > 0 ? (
          transfer.items.map((item, i) => (
            <div
              key={item.product_id}
              className={cn(
                'grid grid-cols-[1fr_auto_auto] gap-4 items-center px-4 py-3',
                i > 0 && 'border-t border-border'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <ProductThumb id={item.product_id} size={28} />
                <span className="text-[13px] font-medium text-ink-800 truncate">
                  {item.product_name}
                </span>
              </div>
              <span className="font-mono text-[13px] text-ink-700 text-end w-20">{item.price}</span>
              <span className="font-mono text-[14px] font-semibold text-ink-900 text-end w-16">
                {item.quantity}
              </span>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-center text-[13px] text-ink-400">
            {transfer.total_items} item{transfer.total_items !== 1 ? 's' : ''}
          </div>
        )}

        {/* Total price row */}
        {transfer.total_price != null && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-sand-50">
            <span className="text-[13px] font-semibold text-ink-700">{labels.totalPrice}</span>
            <span className="font-mono text-[15px] font-bold text-ink-900">
              {transfer.total_price.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        {isAdmin && nextStatus && (
          <button
            onClick={() => onUpdateStatus(transfer.id, nextStatus)}
            disabled={isUpdatingStatus}
            className="h-9 px-4 bg-ink-900 hover:bg-ink-800 text-white text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {getActionLabel()}
          </button>
        )}
        {isAdmin && transfer.status === TransferStatus.SHIPPED && (
          <span className="text-[12px] text-ink-400 italic me-2">
            {labels.actionLabels.awaitingReceipt}
          </span>
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
