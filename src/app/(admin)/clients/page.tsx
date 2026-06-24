'use client';

import { useState, useMemo, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { useClients } from '@/features/admin/clients/hooks/useClients';
import { ClientsTableCard } from '@/features/admin/clients/components/ClientsTableCard';
import { ClientFormModal } from '@/features/admin/clients/components/ClientFormModal';
import { ClientDeleteConfirmModal } from '@/features/admin/clients/components/ClientDeleteConfirmModal';
import { AddShopOwnerModal } from '@/features/admin/clients/components/AddShopOwnerModal';
import type { AdminClient } from '@/features/admin/clients/types/clients.types';
import { getErrorMessage } from '@/common/utils/error.utils';
import type {
  ClientFormData,
  AddShopOwnerFormData,
} from '@/features/admin/clients/validations/clients.schema';

const PAGE_SIZE = 10;

type ModalState =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'edit'; client: AdminClient }
  | { type: 'view'; client: AdminClient }
  | { type: 'delete'; client: AdminClient };

export default function ClientsPage() {
  const { t } = useI18n();
  const p = t.clients;
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const {
    clients,
    total,
    isLoading,
    createShopOwner,
    isCreating,
    updateShop,
    isUpdating,
    toggleStatus,
  } = useClients({ page, limit: PAGE_SIZE, search: debouncedSearch || undefined });

  const filteredClients = useMemo(() => {
    if (!statusFilter) return clients;
    return clients.filter((c) => c.status === statusFilter);
  }, [clients, statusFilter]);

  const displayTotal = statusFilter ? filteredClients.length : total;

  // ── CRUD handlers ──────────────────────────────────────────────────────

  const handleAdd = async (data: AddShopOwnerFormData) => {
    try {
      await createShopOwner(data);
      toast.success(p.toast.created);
      setModal({ type: 'none' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleEdit = async (client: AdminClient, data: ClientFormData) => {
    try {
      await updateShop({
        id: client.id,
        data: { name: data.name, phone: data.phone, address: data.address },
      });
      toast.success(p.toast.updated);
      setModal({ type: 'none' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleToggleStatus = async (client: AdminClient) => {
    const willActivate = client.status === 'inactive';
    try {
      await toggleStatus({ id: client.id, isActive: willActivate });
      toast.success(willActivate ? p.toast.activated : p.toast.deactivated);
      setModal({ type: 'none' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-330 mx-auto pb-16 lg:pb-6">
      {/* ── Layer 1: Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight text-ink-900">{p.page.title}</h1>
          <p className="mt-1 text-sm text-ink-500">{p.page.count.replace('{n}', String(total))}</p>
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
        clients={filteredClients}
        filteredCount={displayTotal}
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
      <AddShopOwnerModal
        open={modal.type === 'add'}
        isSubmitting={isCreating}
        onClose={() => setModal({ type: 'none' })}
        onSubmit={handleAdd}
      />
      <ClientFormModal
        open={modal.type === 'edit'}
        client={modal.type === 'edit' ? modal.client : null}
        isSubmitting={isUpdating}
        onClose={() => setModal({ type: 'none' })}
        onEdit={handleEdit}
      />
      <ClientDeleteConfirmModal
        open={modal.type === 'delete'}
        client={modal.type === 'delete' ? modal.client : null}
        onClose={() => setModal({ type: 'none' })}
        onConfirm={handleToggleStatus}
      />
    </div>
  );
}
