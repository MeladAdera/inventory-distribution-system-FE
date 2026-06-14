'use client';

import { useState, useMemo, useEffect } from 'react';
import { XCircle, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { ShortagesTableCard } from '@/features/shortages/components/ShortagesTableCard';
import { MOCK_SHORTAGES, MOCK_SHORTAGE_CLIENTS } from '@/features/shortages/mock/shortagesData';
import { TransferModal } from '@/features/transfers/components/TransferModal';
import type { Shortage } from '@/features/shortages/types/shortages.types';
import type { Transfer } from '@/features/transfers/types/transfers.types';
import type { TransferPrefill } from '@/features/transfers/types/transfers.types';

export default function ShortagesPage() {
  const { t } = useI18n();
  const p = t.shortages;
  const toast = useToast();

  const [shortages] = useState<Shortage[]>(MOCK_SHORTAGES);
  const [isLoading, setIsLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferPrefill, setTransferPrefill] = useState<TransferPrefill | undefined>();

  useEffect(() => {
    const id = setTimeout(() => setIsLoading(false), 650);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!transferOpen) setTransferPrefill(undefined);
  }, [transferOpen]);

  const outCount = shortages.filter((s) => s.status === 'out').length;
  const lowCount = shortages.filter((s) => s.status === 'low').length;

  const filtered = useMemo(() => {
    return shortages.filter((s) => {
      const matchClient = !clientFilter || s.client_id === Number(clientFilter);
      const matchStatus = !statusFilter || s.status === statusFilter;
      return matchClient && matchStatus;
    });
  }, [shortages, clientFilter, statusFilter]);

  const handleReplenish = (shortage: Shortage) => {
    setTransferPrefill({
      client_id: shortage.client_id,
      product_id: shortage.product_id,
      qty: shortage.suggested,
    });
    setTransferOpen(true);
  };

  const handleTransferSave = (_data: Omit<Transfer, 'id'>) => {
    setTransferOpen(false);
    toast.success(t.transfers.toast.success);
  };

  return (
    <div className="max-w-330 mx-auto pb-16 lg:pb-6">
      {/* ── Page Header ── */}
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold leading-tight text-ink-900">{p.page.title}</h1>
        <p className="mt-1 text-sm text-ink-500">{p.page.subtitle}</p>
      </div>

      {/* ── Summary Strip ── */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Out of stock */}
        <div
          className="flex items-center gap-3 px-5 py-3.5 bg-paper border rounded-xl min-w-45"
          style={{ borderColor: '#F6DDDB' }}
        >
          <XCircle size={18} className="text-danger-700 shrink-0" />
          <div>
            <p className="font-serif text-[22px] font-medium text-ink-900 leading-none">
              {outCount}
            </p>
            <p className="text-[13px] text-ink-500 mt-1">{p.summary.outOfStock}</p>
          </div>
        </div>

        {/* Low stock */}
        <div
          className="flex items-center gap-3 px-5 py-3.5 bg-paper border rounded-xl min-w-45"
          style={{ borderColor: '#FAEACB' }}
        >
          <AlertTriangle size={18} className="text-warning-700 shrink-0" />
          <div>
            <p className="font-serif text-[22px] font-medium text-ink-900 leading-none">
              {lowCount}
            </p>
            <p className="text-[13px] text-ink-500 mt-1">{p.summary.lowStock}</p>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <ShortagesTableCard
        shortages={filtered}
        isLoading={isLoading}
        clientFilter={clientFilter}
        statusFilter={statusFilter}
        clients={MOCK_SHORTAGE_CLIENTS}
        onClientChange={setClientFilter}
        onStatusChange={setStatusFilter}
        onReplenish={handleReplenish}
      />

      {/* ── Transfer Modal (from replenish) ── */}
      <TransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        onSave={handleTransferSave}
        prefill={transferPrefill}
      />
    </div>
  );
}
