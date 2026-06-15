'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { usePermission } from '@/common/hooks/usePermission';
import { TransfersTableCard } from '@/features/transfers/components/TransfersTableCard';
import { TransferModal } from '@/features/transfers/components/TransferModal';
import { useTransfers, useTransferShops } from '@/features/transfers/hooks/useTransfers';
import type { TransferStatus } from '@/features/transfers/types/transfers.types';

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
  const shops = shopsData?.data?.data ?? [];

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

  const handleSave = async (productId: number, quantity: number, shopId?: number) => {
    try {
      await createTransfer({ productId, quantity, shopId });
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
      />

      {/* ── Modal ── */}
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
    </div>
  );
}
