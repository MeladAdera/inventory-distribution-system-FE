'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { TransfersTableCard } from '@/features/transfers/components/TransfersTableCard';
import { TransferModal } from '@/features/transfers/components/TransferModal';
import {
  MOCK_TRANSFERS,
  MOCK_TRANSFER_CLIENTS,
  MOCK_TRANSFER_PRODUCTS,
} from '@/features/transfers/mock/transfersData';
import type { Transfer } from '@/features/transfers/types/transfers.types';

const PAGE_SIZE = 10;

export default function TransfersPage() {
  const { t } = useI18n();
  const p = t.transfers;
  const toast = useToast();

  const [transfers, setTransfers] = useState<Transfer[]>(MOCK_TRANSFERS);
  const [isLoading, setIsLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setIsLoading(false), 650);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [clientFilter, productFilter]);

  const filtered = useMemo(() => {
    return transfers.filter((tr) => {
      const matchClient = !clientFilter || tr.client_id === Number(clientFilter);
      const matchProduct = !productFilter || tr.product_id === Number(productFilter);
      return matchClient && matchProduct;
    });
  }, [transfers, clientFilter, productFilter]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSave = (data: Omit<Transfer, 'id'>) => {
    const nextId = transfers.length > 0 ? Math.max(...transfers.map((t) => t.id)) + 1 : 1;
    setTransfers((prev) => [{ id: nextId, ...data }, ...prev]);
    setModalOpen(false);
    toast.success(p.toast.success);
  };

  return (
    <div className="max-w-330 mx-auto pb-16 lg:pb-6">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight text-ink-900">{p.page.title}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {p.page.count.replace('{n}', String(transfers.length))}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          <Plus size={16} />
          {p.page.newTransfer}
        </button>
      </div>

      {/* ── Table Card ── */}
      <TransfersTableCard
        transfers={paginated}
        filteredCount={filtered.length}
        isLoading={isLoading}
        page={page}
        pageSize={PAGE_SIZE}
        clientFilter={clientFilter}
        productFilter={productFilter}
        clients={MOCK_TRANSFER_CLIENTS}
        products={MOCK_TRANSFER_PRODUCTS}
        onClientChange={setClientFilter}
        onProductChange={setProductFilter}
        onPageChange={setPage}
        onAddTransfer={() => setModalOpen(true)}
      />

      {/* ── Modal ── */}
      <TransferModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  );
}
