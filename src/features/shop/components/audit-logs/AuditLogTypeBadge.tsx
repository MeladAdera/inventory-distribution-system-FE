import { Badge, type BadgeVariant } from '@/common/components/Badge';
import { AuditLogType } from '@/features/admin/audit-logs';

interface AuditLogTypeBadgeProps {
  type: AuditLogType;
  label: string;
}

const VARIANT_BY_TYPE: Record<AuditLogType, BadgeVariant> = {
  [AuditLogType.INVENTORY]: 'warning',
  [AuditLogType.ORDER]: 'info',
};

export function AuditLogTypeBadge({ type, label }: AuditLogTypeBadgeProps) {
  return <Badge variant={VARIANT_BY_TYPE[type] ?? 'default'}>{label}</Badge>;
}
