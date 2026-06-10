# Audit Logs Feature

Read-only audit trail of all system actions. The backend writes logs automatically — the frontend only reads them.

## Structure

```
audit-logs/
├── api/
│   └── audit-logs.api.ts         # API calls (list, getById)
├── hooks/
│   └── useAuditLogs.ts           # List query only — no mutations
├── types/
│   └── audit-logs.types.ts       # AuditLog, AuditLogListParams
└── index.ts                      # Barrel exports
```

## Key Types

- `AuditLog` — a single log entry; `quantity` and `amount` are `null` when not applicable
- `type` / `action` / `entity_type` are plain `string` — vocabulary is owned by the backend

## API Methods

| Method | HTTP | Path |
|--------|------|------|
| `list(params?)` | GET | `/audit-logs` |
| `getById(id)` | GET | `/audit-logs/:id` |

## Filtering (`AuditLogListParams`)

Supports rich server-side filtering — pass any combination:

| Param | Filters by |
|-------|-----------|
| `shopId` | Shop |
| `userId` | Who performed the action |
| `type` | Log category (e.g. `"STOCK"`, `"ORDER"`) |
| `action` | Operation (e.g. `"CREATE"`, `"UPDATE"`) |
| `entityType` | Affected resource (e.g. `"Product"`, `"Order"`) |
| `entityId` | Specific resource ID |
| `fromDate` / `toDate` | Date range (ISO strings) |

## Notes

- No mutations — audit logs are immutable by design
- No validations file — no create/update forms
- Sidebar link `/audit-logs` is pre-wired; page is built in TICKET-051

## Usage

```typescript
import { useAuditLogs } from '@/features/audit-logs';

const { auditLogs, isLoading } = useAuditLogs({ shopId: 1, fromDate: '2026-01-01' });
```
