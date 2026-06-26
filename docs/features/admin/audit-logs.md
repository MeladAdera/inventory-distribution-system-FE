# Feature: Audit Logs (Admin)

**Status**: ✅ Complete (real API integrated)  
**Created**: 2026-06-27  
**Last Updated**: 2026-06-27  
**Route**: `/audit-logs`  
**File**: `src/app/(admin)/audit-logs/page.tsx`

---

## Overview

The Admin Audit Logs page gives `WAREHOUSE_ADMIN` users a cross-shop, filterable view of every significant action that has happened across all shops in the system — inventory movements and order status transitions. Unlike the client portal version (which is auto-scoped to a single shop), the admin page can see all shops and filter by specific shop or user.

`EMPLOYEE` role has no access — they are redirected to `/dashboard` on load.

---

## Key Differences vs Client Portal Audit Logs

| Concern | Admin (`/audit-logs`) | Client (`/client/audit-logs`) |
|---------|----------------------|-------------------------------|
| Scope | All shops | Caller's shop only (backend-scoped) |
| Shop column | ✅ Visible | ❌ Hidden |
| Filter: shop | Select populated from `useShops()` → sends `shopId` | Not applicable |
| Filter: user | Select populated from `useUsers()` → sends `userId` | Not applicable |
| Filter: type | Dropdown (ALL / INVENTORY / ORDER) | Same |
| Filter: dates | `fromDate` / `toDate` date inputs | Same |
| Layout | Desktop-only table via `DataTable` | Desktop table + mobile cards |
| Modal style | Centered overlay | Bottom-sheet on mobile, centered on desktop |
| i18n namespace | `t.auditLogs.*` (own file) | `t.client.auditLogs.*` (in client.json) |
| Types/API/hooks | Shared from `features/admin/audit-logs/` | Same shared layer |

---

## File Structure

```
src/
├── app/(admin)/audit-logs/
│   └── page.tsx                                        ← full page component (admin pattern)
│
└── features/admin/audit-logs/
    ├── types/
    │   └── audit-logs.types.ts                         ← AuditLog, AuditLogDetail, enums, params
    ├── api/
    │   └── audit-logs.api.ts                           ← list() + getById()
    ├── hooks/
    │   └── useAuditLogs.ts                             ← useAuditLogs() + useAuditLogDetail()
    ├── components/
    │   ├── AuditLogTypeBadge.tsx                       ← INVENTORY (warning) / ORDER (info) badge
    │   ├── AuditLogsTable.tsx                          ← wraps DataTable, locale-aware date formatting
    │   └── AuditLogDetailModal.tsx                     ← centered modal with full log detail
    └── index.ts

i18n/
├── en/audit-logs.json                                  ← t.auditLogs.* (own namespace)
└── ar/audit-logs.json

common/layout/
└── navConfig.ts                                        ← auditLogs nav item (ScrollText icon)
```

---

## API Integration

| Method | Endpoint | Used for |
|--------|----------|----------|
| `GET` | `/audit-logs` | Paginated list with filters |
| `GET` | `/audit-logs/:id` | Full single log detail |

### Query Params

| Param | Type | When sent |
|-------|------|-----------|
| `page` | number | Always |
| `limit` | number | Always (15) |
| `type` | `AuditLogType` | When type filter is not empty |
| `shopId` | number | When a shop is selected |
| `userId` | number | When a user is selected |
| `fromDate` | string (YYYY-MM-DD) | When fromDate input has a value |
| `toDate` | string (YYYY-MM-DD) | When toDate input has a value |

### Response Unwrapping

```ts
// useAuditLogs
const logs: AuditLog[]   = listQuery.data?.data?.data ?? [];
const total: number      = listQuery.data?.data?.total ?? 0;
const totalPages: number = listQuery.data?.data?.totalPages ?? 1;

// useAuditLogDetail
const log = (query.data?.data ?? null) as AuditLogDetail | null;
```

---

## Data Flow

```
Filter change (type / shopId / userId / fromDate / toDate)
    ↓  setPage(1)               — always reset on filter change
    ↓  params object rebuilds
    ↓  TanStack Query refetches with new queryKey: ['audit-logs', params]
    ↓  useAuditLogs unwraps → AuditLog[]
    ↓  AuditLogsTable renders DataTable

Row click:
    ↓  setSelectedLog(log)      — holds full AuditLog row
    ↓  AuditLogDetailModal opens
    ↓  useAuditLogDetail(log.id) — enabled: !!id, fetches once per unique id
    ↓  GET /audit-logs/:id
    ↓  renders detail rows

Shop / user selects:
    ↓  useShops() → shopList: Shop[]       — populates shop select
    ↓  useUsers({ limit: 100 }) → userList: User[]  — populates user select
    ↓  selected name → value = ID → sent as shopId / userId to API (server-side filtering)
```

---

## Filters

Five filters, all combined as server-side query params:

| Filter | Control | Sends |
|--------|---------|-------|
| Type | `<select>` (ALL / INVENTORY / ORDER) | `type` enum |
| Shop | `<select>` populated from `useShops()` | `shopId: number` |
| User | `<select>` populated from `useUsers({ limit: 100 })` | `userId: number` |
| From date | `<input type="date">` | `fromDate: string` |
| To date | `<input type="date">` | `toDate: string` |

A "Clear filters" text link appears when any filter is active and resets all five to empty + page to 1.

---

## AuditLogsTable

Wraps the common `DataTable<AuditLog>` component. Columns:

| Column | Content |
|--------|---------|
| Date | Locale-aware: `'ar-EG'` for Arabic (bidi-safe), `'en-GB'` for English |
| Shop | `log.shop_name` (unique to admin; null → `—`) |
| User | `log.user_name` |
| Type | `AuditLogTypeBadge` |
| Action | Translated via `labels.actions[log.action]` |
| Qty | `+N` / `-N` / `—` |
| Notes | `line-clamp-1` with native `title` tooltip |
| — | "Detail" text button → opens modal |

**RTL fix:** `DataTable` uses `text-start` (CSS logical property) on `<th>` and `<td>` so column alignment flips correctly in Arabic.

---

## AuditLogDetailModal

Centered overlay (admin pattern, no bottom-sheet). Fetches `GET /audit-logs/:id` on open via `useAuditLogDetail`.

| Row | Always shown | Condition |
|-----|:---:|-----------|
| Log ID | ✅ | — |
| Shop | ✅ | Shown even if null (admin needs to see it) |
| User | ✅ | — |
| Type | ✅ | — |
| Action | ✅ | — |
| Entity | ✅ | e.g. "Inventory #7" or "Order #15" |
| Product | — | Only when `log.product_name` is not null |
| Quantity | — | Only when `log.quantity` is not null |
| Notes | — | Only when `log.notes` is not null |

Quantity is colored: green (`text-success-600`) for positive, red (`text-danger-600`) for negative.

---

## i18n

Own namespace `t.auditLogs` (separate from client portal's `t.client.auditLogs`).

Files: `src/i18n/en/audit-logs.json` + `src/i18n/ar/audit-logs.json`  
Wired in: `src/i18n/index.ts` → `auditLogs: auditLogsEn / auditLogsAr`

Key groups: `page`, `filter`, `table`, `types`, `actions`, `entity`, `modal`, `empty`.

Nav label: `t.sidebar.nav.auditLogs` → `"Audit Logs"` / `"سجل التدقيق"`.

---

## Shared Components Modified

| File | Change |
|------|--------|
| `src/common/components/DataTable.tsx` | `text-left` → `text-start` for RTL-correct column alignment |
| `src/common/components/Pagination.tsx` | Added `useI18n()` — Previous/Next and "Showing X–Y of Z" now fully translated via `t.sidebar.pagination` |
| `src/i18n/en/sidebar.json` + `ar/sidebar.json` | Added `pagination` object and `nav.auditLogs` key |

---

## Permissions

| Role | Access |
|------|:------:|
| `WAREHOUSE_ADMIN` | ✅ Full access (all shops visible) |
| `SHOP_OWNER` | ❌ Redirected to `/dashboard` |
| `EMPLOYEE` | ❌ Redirected to `/dashboard` |

Guard: `usePermission()` → `isEmployee` check; `useEffect` + `router.replace('/dashboard')`.

---

## Related Features

- `docs/features/client/client-audit-logs.md` — client portal version (shop-scoped, mobile cards, bottom-sheet modal)
- `features/admin/audit-logs/` — shared types, API, and hooks used by both admin and client portal
- `features/admin/dashboard/components/RecentActivityFeed` — also uses `useAuditLogs`; updated to use the `logs` field from the refactored hook return shape
- `common/layout/navConfig.ts` — `auditLogs` nav item (ScrollText icon, between Shortages and Settings)
