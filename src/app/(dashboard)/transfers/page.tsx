'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { usePermission } from '@/common/hooks/usePermission';
import { TransfersTableCard } from '@/features/transfers/components/TransfersTableCard';
import { TransferModal } from '@/features/transfers/components/TransferModal';
import { TransferDetailModal } from '@/features/transfers/components/TransferDetailModal';
import { useTransfers, useTransferShops } from '@/features/transfers/hooks/useTransfers';
import { TransferStatus } from '@/features/transfers/types/transfers.types';
import { transfersApi } from '@/features/transfers/api/transfers.api';
import type { Shop } from '@/features/shops/types/shops.types';

const PAGE_SIZE = 10;

export default function TransfersPage() {
  const { t } = useI18n();
  const p = t.transfers;
  const toast = useToast();
  const { isWarehouseAdmin, canCreate } = usePermission();

  const [shopFilter, setShopFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: transferDetailData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['transfer-detail', selectedTransferId],
    queryFn: () => transfersApi.getById(selectedTransferId!),
    enabled: !!selectedTransferId,
  });

  const selectedTransfer = transferDetailData?.data ?? null;

  const {
    transfers,
    total,
    isLoading,
    createTransfer,
    isCreating,
    updateStatus,
    isUpdatingStatus,
  } = useTransfers({
    page,
    limit: PAGE_SIZE,
    status: (statusFilter as TransferStatus) || undefined,
  });

  const { data: shopsData } = useTransferShops();
  const shops = (shopsData?.data ?? []) as Shop[];

  // Client-side shop filter applied on top of server-side status filter
  const visibleTransfers = shopFilter
    ? transfers.filter((t) => t.to_shop_id === Number(shopFilter))
    : transfers;

  const handleShopChange = (v: string) => {
    setShopFilter(v);
    setPage(1);
  };

  const handleStatusChange = (v: string) => {
    setStatusFilter(v);
    setPage(1);
  };

  const handleSave = async (items: { productId: number; quantity: number }[], shopId?: number) => {
    try {
      await createTransfer({ items, shopId });
      setModalOpen(false);
      toast.success(p.toast.success);
    } catch {
      toast.error(p.toast.error);
    }
  };

  const handleUpdateStatus = async (id: number, status: TransferStatus) => {
    try {
      await updateStatus({ id, data: { status } });
      toast.success(p.toast.statusUpdated);
    } catch {
      toast.error(p.toast.error);
    }
  };

  return (
    <div className="max-w-330 mx-auto pb-16 lg:pb-6">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight text-ink-900">{p.page.title}</h1>
          <p className="mt-1 text-sm text-ink-500">{p.page.count.replace('{n}', String(total))}</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
          >
            <Plus size={16} />
            {p.page.newTransfer}
          </button>
        )}
      </div>

      {/* ── Table Card ── */}
      <TransfersTableCard
        transfers={visibleTransfers}
        total={total}
        shops={shops}
        isLoading={isLoading}
        page={page}
        pageSize={PAGE_SIZE}
        shopFilter={shopFilter}
        statusFilter={statusFilter}
        isAdmin={isWarehouseAdmin}
        isUpdatingStatus={isUpdatingStatus}
        onShopChange={handleShopChange}
        onStatusChange={handleStatusChange}
        onPageChange={setPage}
        onAddTransfer={() => setModalOpen(true)}
        onUpdateStatus={handleUpdateStatus}
        onView={(transfer) => {
          setSelectedTransferId(transfer.id);
          setDetailOpen(true);
        }}
      />

      {/* ── Create Modal ── */}
      {canCreate && (
        <TransferModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          isSaving={isCreating}
          isAdmin={isWarehouseAdmin}
          shops={shops}
        />
      )}

      {/* ── Detail Modal ── */}
      <TransferDetailModal
        transfer={selectedTransfer}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        isAdmin={isWarehouseAdmin}
        isLoadingDetail={isLoadingDetail}
        isUpdatingStatus={isUpdatingStatus}
        onUpdateStatus={async (id, status) => {
          await handleUpdateStatus(id, status);
          setDetailOpen(false);
        }}
        labels={{
          title: p.detail.title,
          shop: p.detail.shop,
          productsLabel: p.detail.productsLabel,
          qty: p.detail.qty,
          price: p.detail.price,
          totalPrice: p.detail.totalPrice,
          closeBtn: p.detail.closeBtn,
          statusLabels: {
            [TransferStatus.PENDING]: p.status.PENDING,
            [TransferStatus.PROCESSING]: p.status.PROCESSING,
            [TransferStatus.SHIPPED]: p.status.SHIPPED,
            [TransferStatus.RECEIVED]: p.status.RECEIVED,
            [TransferStatus.COMPLETED]: p.status.COMPLETED,
          },
          actionLabels: {
            process: p.actions.process,
            ship: p.actions.ship,
            complete: p.actions.complete,
            awaitingReceipt: p.actions.awaitingReceipt,
          },
        }}
      />
    </div>
  );
}
