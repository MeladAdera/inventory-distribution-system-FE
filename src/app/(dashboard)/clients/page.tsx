'use client';

import { useState, useMemo, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { MOCK_CLIENTS } from '@/features/clients/mock/clientsData';
import { ClientsTableCard } from '@/features/clients/components/ClientsTableCard';
import { ClientFormModal } from '@/features/clients/components/ClientFormModal';
import { ClientDeleteConfirmModal } from '@/features/clients/components/ClientDeleteConfirmModal';
import type { AdminClient } from '@/features/clients/types/clients.types';
import type { ClientFormData } from '@/features/clients/validations/clients.schema';

const PAGE_SIZE = 10;

type ModalState =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'edit'; client: AdminClient }
  | { type: 'view'; client: AdminClient }
  | { type: 'delete'; client: AdminClient };

export default function ClientsPage() {
  const { t, locale } = useI18n();
  const p = t.clients;

  const [clients, setClients] = useState<AdminClient[]>(MOCK_CLIENTS);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  useEffect(() => {
    const id = setTimeout(() => setIsLoading(false), 650);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const name = locale === 'ar' ? c.name_ar : c.name_en;
      const matchSearch =
        !search ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.replace(/\s/g, '').includes(search.replace(/\s/g, ''));
      const matchStatus = !statusFilter || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [clients, search, statusFilter, locale]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── CRUD handlers ──────────────────────────────────────────────────────

  const handleAdd = (data: ClientFormData) => {
    const nextId = clients.length > 0 ? Math.max(...clients.map((c) => c.id)) + 1 : 1;
    const newClient: AdminClient = {
      id: nextId,
      name_ar: data.nameAr,
      name_en: data.nameEn ?? '',
      phone: data.phone,
      city_ar: data.address ?? '',
      city_en: data.address ?? '',
      product_count: 0,
      last_activity_ar: 'الآن',
      last_activity_en: 'Just now',
      status: 'active',
      notes: data.notes,
    };
    setClients((prev) => [...prev, newClient]);
    setModal({ type: 'none' });
  };

  const handleEdit = (client: AdminClient, data: ClientFormData) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === client.id
          ? {
              ...c,
              name_ar: data.nameAr,
              name_en: data.nameEn ?? '',
              phone: data.phone,
              city_ar: data.address ?? c.city_ar,
              city_en: data.address ?? c.city_en,
              notes: data.notes,
            }
          : c
      )
    );
    setModal({ type: 'none' });
  };

  const handleDelete = (client: AdminClient) => {
    setClients((prev) => prev.filter((c) => c.id !== client.id));
    setModal({ type: 'none' });
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-330 mx-auto pb-16 lg:pb-6">
      {/* ── Layer 1: Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight text-ink-900">{p.page.title}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {p.page.count.replace('{n}', String(clients.length))}
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'add' })}
          className="inline-flex items-center gap-2 h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          <UserPlus size={16} />
          {p.page.addClient}
        </button>
      </div>

      {/* ── Layer 2: Table Card ── */}
      <ClientsTableCard
        clients={paginated}
        filteredCount={filtered.length}
        isLoading={isLoading}
        page={page}
        pageSize={PAGE_SIZE}
        startIndex={(page - 1) * PAGE_SIZE}
        search={search}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onPageChange={setPage}
        onAddClient={() => setModal({ type: 'add' })}
        onView={(c) => setModal({ type: 'view', client: c })}
        onEdit={(c) => setModal({ type: 'edit', client: c })}
        onDelete={(c) => setModal({ type: 'delete', client: c })}
      />

      {/* ── Modals ── */}
      <ClientFormModal
        open={modal.type === 'add' || modal.type === 'edit'}
        mode={modal.type === 'edit' ? 'edit' : 'add'}
        client={modal.type === 'edit' ? modal.client : null}
        onClose={() => setModal({ type: 'none' })}
        onAdd={handleAdd}
        onEdit={handleEdit}
      />
      <ClientDeleteConfirmModal
        open={modal.type === 'delete'}
        client={modal.type === 'delete' ? modal.client : null}
        onClose={() => setModal({ type: 'none' })}
        onConfirm={handleDelete}
      />
    </div>
  );
}
