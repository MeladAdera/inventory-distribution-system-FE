'use client';

import { Loader2 } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { AuditLogTypeBadge } from './AuditLogTypeBadge';
import { useAuditLogDetail } from '../hooks/useAuditLogs';

interface AuditLogDetailModalLabels {
  title: string;
  logId: string;
  shop: string;
  user: string;
  type: string;
  action: string;
  entity: string;
  product: string;
  quantity: string;
  notes: string;
  date: string;
  closeBtn: string;
}

interface AuditLogDetailModalProps {
  logId: number | null;
  open: boolean;
  onClose: () => void;
  labels: AuditLogDetailModalLabels;
  typeLabels: Record<string, string>;
  actionLabels: Record<string, string>;
  entityLabels: Record<string, string>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-gray-100 last:border-b-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  );
}

export function AuditLogDetailModal({
  logId,
  open,
  onClose,
  labels,
  typeLabels,
  actionLabels,
  entityLabels,
}: AuditLogDetailModalProps) {
  const { log, isLoading } = useAuditLogDetail(logId);

  return (
    <Modal open={open} onClose={onClose} title={labels.title} size="md">
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
      ) : log ? (
        <div>
          <Row label={labels.logId}>
            <span className="font-mono text-gray-500">#{log.id}</span>
          </Row>

          <Row label={labels.date}>
            {new Date(log.created_at).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Row>

          {log.shop_name && <Row label={labels.shop}>{log.shop_name}</Row>}

          <Row label={labels.user}>{log.user_name}</Row>

          <Row label={labels.type}>
            <AuditLogTypeBadge type={log.type} label={typeLabels[log.type] ?? log.type} />
          </Row>

          <Row label={labels.action}>{actionLabels[log.action] ?? log.action}</Row>

          <Row label={labels.entity}>
            {entityLabels[log.entity_type] ?? log.entity_type} #{log.entity_id}
          </Row>

          {log.product_name && <Row label={labels.product}>{log.product_name}</Row>}

          {log.quantity != null && (
            <Row label={labels.quantity}>
              <span className={log.quantity < 0 ? 'text-red-600' : 'text-green-600'}>
                {log.quantity > 0 ? `+${log.quantity}` : String(log.quantity)}
              </span>
            </Row>
          )}

          {log.notes && <Row label={labels.notes}>{log.notes}</Row>}
        </div>
      ) : null}

      <div className="mt-5 flex justify-end">
        <button
          onClick={onClose}
          className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          {labels.closeBtn}
        </button>
      </div>
    </Modal>
  );
}
