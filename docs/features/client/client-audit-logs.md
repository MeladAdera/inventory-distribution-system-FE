# Client Audit Logs Page

**Status**: ✅ Complete (real API integrated)  
**Created Date**: 2026-06-27  
**Last Updated**: 2026-06-27  
**Assignee**: Melad Adera  
**Route**: `/client/audit-logs`  
**File**: `src/app/client/audit-logs/page.tsx`  
**Page Component**: `src/features/shop/components/ClientAuditLogsPage.tsx`

---

## 📋 Overview

### Purpose
Gives shop owners a read-only, filterable record of every significant action that has taken place in their shop — inventory movements (stock-in, adjustments, transfers) and order status transitions.

### Business Value
Shop owners can audit what happened in their shop at any time without calling the warehouse. They can narrow the log to a date range or a specific type (inventory vs order) and drill into any row for full details including the product name.

### Who Sees What

| Action | SHOP_OWNER | EMPLOYEE |
|--------|:-:|:-:|
| View activity log | ✅ | ✅ |
| Filter by type / date | ✅ | ✅ |
| View log detail (modal) | ✅ | ✅ |

> The backend automatically scopes `GET /audit-logs` to the caller's shop — no `shopId` filter needs to be sent for non-admin users.

---

## 🎯 Requirements

### Functional Requirements
- [x] List audit logs for the current shop via `GET /audit-logs` with server-side pagination (15 per page)
- [x] Filter by log type (`INVENTORY` / `ORDER`) via dropdown
- [x] Filter by date range (`fromDate` / `toDate`) via date inputs
- [x] Clear all active filters with a single tap
- [x] Each row shows: date/time, user, type badge, action, quantity, notes
- [x] Clicking a row opens `AuditLogDetailModal` which fetches `GET /audit-logs/:id` for full detail including `product_name`
- [x] Prev / Next pagination controls with "X–Y / total" counter
- [x] Responsive: desktop table + mobile stacked cards
- [x] Responsive filter toolbar: inline on desktop, stacked on mobile
- [x] Loading and error states
- [x] AR/EN i18n for all labels, filter options, type/action names, and modal strings

### Non-Functional Requirements
- [x] Types, API, and hooks live in `features/admin/audit-logs` and are shared — no duplication
- [x] Hook exposes unwrapped arrays (`logs: AuditLog[]`, `total`, `totalPages`) — page component never touches raw response shape
- [x] Changing any filter resets `page` to 1 automatically
- [x] Detail modal only fetches when a log is selected (`enabled: !!id`)

---

## 🏗 Architecture

### File Structure

```
src/
├── app/client/audit-logs/
│   └── page.tsx                                        ← thin route wrapper
│
└── features/shop/components/
    ├── ClientAuditLogsPage.tsx                         ← orchestrator: state + hook wiring
    └── audit-logs/
        ├── AuditLogTypeBadge.tsx                       ← INVENTORY (warning) / ORDER (info) badge
        ├── AuditLogsTableCard.tsx                      ← filter toolbar + desktop table + mobile cards
        └── AuditLogDetailModal.tsx                     ← bottom-sheet modal with full log detail

features/admin/audit-logs/                             ← shared layer (no duplication)
├── api/audit-logs.api.ts                              ← list() + getById()
├── hooks/useAuditLogs.ts                              ← useAuditLogs() + useAuditLogDetail()
├── types/audit-logs.types.ts                          ← AuditLog, AuditLogDetail, enums, params
└── index.ts

i18n/
├── en/client.json                                     ← t.client.auditLogs.* + t.client.nav.auditLogs
└── ar/client.json

common/layout/
└── clientNavConfig.ts                                 ← auditLogs nav item (ScrollText icon)
```

### Component Hierarchy

```
ClientAuditLogsPage
├── TypewriterText              ← rotating taglines in the page header
├── AuditLogsTableCard
│   ├── AuditLogTypeBadge       ← per-row type badge
│   ├── Desktop grid rows       ← hidden sm:block
│   └── Mobile card rows        ← sm:hidden
├── Pagination controls         ← inline in page, shown only when totalPages > 1
└── AuditLogDetailModal
    └── AuditLogTypeBadge       ← inside modal detail row
```

---

## Data Flow

```
GET /audit-logs?page=1&limit=15[&type=...][&fromDate=...][&toDate=...]
    ↓  auditLogsApi.list(params)
    ↓  useAuditLogs(params)        — unwraps data.data.data → AuditLog[]
    ↓  ClientAuditLogsPage         — holds page, typeFilter, fromDate, toDate, selectedLogId, modalOpen

  on filter change:
    ↓  setTypeFilter / setFromDate / setToDate
    ↓  setPage(1)                  — always reset to page 1 when filter changes
    ↓  params updates → TanStack Query refetches with new key

  on row view click:
    ↓  setSelectedLogId(log.id)
    ↓  setModalOpen(true)
    ↓  AuditLogDetailModal mounts → useAuditLogDetail(id)
    ↓  GET /audit-logs/:id         — fetches once per unique id (cached)
    ↓  renders detail rows including product_name (if INVENTORY type)

  on modal close:
    ↓  setModalOpen(false)
    ↓  selectedLogId kept in state (avoids refetch if reopened)
```

---

## 🔌 API Integration

| Action | Endpoint | Roles |
|--------|----------|-------|
| List logs (paginated) | `GET /audit-logs` | All |
| Get single log detail | `GET /audit-logs/:id` | All |

**Supported query params sent from the page:**

| Param | When sent |
|-------|-----------|
| `page` | Always |
| `limit` | Always (15) |
| `type` | When typeFilter is not empty |
| `fromDate` | When fromDate input has a value |
| `toDate` | When toDate input has a value |

**Response unwrapping in `useAuditLogs`:**
```ts
const logs: AuditLog[]    = listQuery.data?.data?.data ?? [];
const total: number       = listQuery.data?.data?.total ?? 0;
const totalPages: number  = listQuery.data?.data?.totalPages ?? 1;
```

**Response unwrapping in `useAuditLogDetail`:**
```ts
const log = (query.data?.data ?? null) as AuditLogDetail | null;
```

---

## 🧩 AuditLogsTableCard

### Filter Toolbar

Two separate layouts rendered via `sm:hidden` / `hidden sm:flex`:

**Mobile:**
```
[ Type select — full width              ]
[ From date input  ] [ To date input    ]  ← grid-cols-2
[ Clear (amber link, self-start)        ]  ← only when a filter is active
```

**Desktop:**
```
[ Type select ] [ From: date ] [ To: date ] [ Clear ]   ← single flex row
```

### Desktop Table (`hidden sm:block`)

Grid columns: `grid-cols-[1.4fr_1fr_0.7fr_0.9fr_0.7fr_1.6fr_auto]`

| Column | Content |
|--------|---------|
| Date | `formatDateTime` — short month, day, year, HH:MM |
| User | `log.user_name` |
| Type | `AuditLogTypeBadge` |
| Action | Translated action label |
| Qty | `+N` / `-N` / `—` |
| Notes | Truncated with native `title` tooltip |
| — | Eye icon button → opens modal |

### Mobile Cards (`sm:hidden`)

```
[user_name]  [TypeBadge]           [Eye button]
[Action label]  (+qty / -qty)
[notes — line-clamp-2]
[date/time — small, mono]
```

### Empty State

`ScrollText` icon + title + subtitle (no CTA — logs are read-only).

---

## 🧩 AuditLogDetailModal

Slides up from the bottom on mobile (`items-end`), centered on desktop (`sm:items-center`). Body is scrollable (`max-h-[70vh] overflow-y-auto`) to handle long notes.

Fetches `GET /audit-logs/:id` via `useAuditLogDetail(logId)` — shows a spinner while loading.

**Detail rows rendered:**

| Row | Always shown | Condition |
|-----|:---:|-----------|
| Log ID | ✅ | — |
| Date | ✅ | — |
| User | ✅ | — |
| Type | ✅ | — |
| Action | ✅ | — |
| Entity | ✅ | e.g. "Inventory #7" or "Order #15" |
| Product | — | Only when `log.product_name` is not null (INVENTORY type) |
| Quantity | — | Only when `log.quantity` is not null |
| Notes | — | Only when `log.notes` is not null |

Quantity is colored: green (`text-success-600`) for positive, red (`text-danger-600`) for negative.

---

## 🧩 AuditLogTypeBadge

| `type` | Badge variant | Display |
|--------|:---:|---------|
| `INVENTORY` | `warning` (yellow) | Inventory |
| `ORDER` | `info` (blue) | Order |

Uses the common `Badge` component from `src/common/components/Badge.tsx`.

---

## 🌐 i18n Keys (`t.client.auditLogs`)

```json
{
  "title": "Activity log",
  "subtitle": "A complete record of all actions taken in your shop.",
  "loading": "Loading activity log…",
  "errorMsg": "Failed to load activity log. Please try again.",
  "taglines": ["Every action, fully recorded", "..."],
  "filter": {
    "typeAll": "All types",
    "typeInventory": "Inventory",
    "typeOrder": "Order",
    "fromDate": "From",
    "toDate": "To",
    "clear": "Clear"
  },
  "table": {
    "date": "Date",
    "user": "User",
    "type": "Type",
    "action": "Action",
    "entity": "Entity",
    "qty": "Qty",
    "notes": "Notes"
  },
  "types": { "INVENTORY": "Inventory", "ORDER": "Order" },
  "actions": {
    "STOCK_IN": "Stock in",
    "ADJUSTMENT": "Adjustment",
    "TRANSFER_OUT": "Transfer out",
    "TRANSFER_IN": "Transfer in",
    "STATUS_CHANGED": "Status changed"
  },
  "entity": { "inventory": "Inventory", "order": "Order" },
  "empty": {
    "title": "No activity yet",
    "sub": "Actions in your shop will appear here."
  },
  "modal": {
    "title": "Log detail",
    "logId": "Log ID",
    "user": "User",
    "type": "Type",
    "action": "Action",
    "entity": "Entity",
    "product": "Product",
    "quantity": "Quantity",
    "notes": "Notes",
    "date": "Date",
    "closeBtn": "Close"
  }
}
```

Nav label: `t.client.nav.auditLogs` → `"Activity log"`.

---

## 🔐 Security & Permissions

- `GET /audit-logs` is available to all roles. The backend auto-scopes results to the caller's shop — no `shopId` filter is sent by the client portal.
- The page and all sub-components are read-only — no mutations exist.
- `WAREHOUSE_ADMIN` users never land in the client portal, so they cannot access this route.

---

## 🔄 Related Features

- `features/admin/audit-logs` — shared types, API, and hooks (no client-side duplication)
- `features/admin/dashboard/components/RecentActivityFeed` — also uses `useAuditLogs`; updated to use the new `logs` return field when the hook was refactored
- `common/layout/clientNavConfig` — `auditLogs` nav item added (6th item, appears in mobile overflow sheet)
- `i18n/en/client.json` + `i18n/ar/client.json` — `auditLogs` namespace + nav label
