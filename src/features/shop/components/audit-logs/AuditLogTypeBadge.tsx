import { Badge } from '@/common/components/Badge';
import { AuditLogType } from '@/features/admin/audit-logs';

interface AuditLogTypeBadgeProps {
  type: AuditLogType;
  label: string;
}

export function AuditLogTypeBadge({ type, label }: AuditLogTypeBadgeProps) {
  return <Badge variant={type === AuditLogType.INVENTORY ? 'warning' : 'info'}>{label}</Badge>;
}
