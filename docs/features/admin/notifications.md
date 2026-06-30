# Notifications

**Status**: ✅ Complete (real API integrated)
**Created Date**: 2026-06-29
**Last Updated**: 2026-06-30
**Assignee**: Melad Adera
**Route**: `/notifications`
**File**: `src/app/(admin)/notifications/page.tsx`

---

## 📋 Overview

### Purpose
Gives the warehouse admin a dedicated page to browse, filter, and clear low-stock and order notifications, beyond the 20-item preview in the topbar bell dropdown. Shared codebase with the client portal's `/client/notifications` — see [client-notifications.md](../client/client-notifications.md).

### Business Value
- Bell icon in `TopBar` gives an at-a-glance unread count and quick preview
- Full page adds filtering (All / Unread / Read) and pagination so nothing gets lost once notification volume grows
- One-click mark-read (per item) and mark-all-read

---

## 🎯 Requirements

### Functional Requirements
- [x] Bell icon in `TopBar` with unread badge, dropdown preview (last 20), mark-read on click, "View all" link
- [x] `/notifications` page: All / Unread / Read filter tabs with unread-count badge on the Unread tab
- [x] Paginated list (20/page) with prev/next controls
- [x] Mark-read on row click (only for unread rows); mark-all-read button (disabled when nothing unread)
- [x] Loading skeleton, per-filter empty states
- [x] AR/EN i18n for all labels, including localized `Accept-Language`-driven `title`/`message` from the backend

### Non-Functional Requirements
- [x] No client-side translation of notification content — server renders `title`/`message` per `Accept-Language`
- [x] Pagination uses `keepPreviousData` so switching pages doesn't flash a loading skeleton
- [x] Unread badge reflects the true DB count, not just the current page (see Known Issues Fixed below)

---

## 🏗 Architecture

### File Structure

```
src/
├── app/(admin)/notifications/
│   └── page.tsx                          ← thin route wrapper
│
├── features/
│   ├── shared/notifications/             ← shared with client portal
│   │   ├── api/notifications.api.ts      ← list, markRead, markAllRead
│   │   ├── hooks/useNotifications.ts     ← paginated query + mutations + unreadCount
│   │   ├── types/notifications.types.ts  ← NotificationType, Notification, NotificationListParams
│   │   └── index.ts                      ← barrel export
│   │
│   └── admin/notifications/
│       └── components/
│           └── NotificationsPage.tsx     ← full page UI, reused by both portals
│
├── common/layout/
│   └── TopBar.tsx                        ← bell icon + dropdown preview (admin)
│
└── i18n/
    ├── en/notifications.json
    └── ar/notifications.json
```

### Component Hierarchy

```
NotificationsPage
├── Header (title + "Mark all read" button)
├── Filter tabs (All / Unread / Read)
└── List
    ├── Skeleton rows        ← while isLoading
    ├── Empty state          ← per-filter message
    └── Notification row ×N  ← icon, title, type badge, message, relative time, unread dot
└── Pagination (prev/next, page indicator)
```

---

## 🔌 API Integration

| Action | Endpoint | Hook |
|--------|----------|------|
| List (paginated, filterable) | `GET /notifications?page&limit&isRead` | `useNotifications(params)` |
| Mark one read | `PATCH /notifications/:id/read` | `markRead(id)` |
| Mark all read | `PATCH /notifications/read-all` | `markAllRead()` |

### Notification shape

```typescript
interface Notification {
  id: number;
  shop_id: number;
  user_id: number | null;          // null = system-wide
  title: string;                   // pre-translated by backend, render as-is
  message: string;                 // pre-translated by backend, render as-is
  type: NotificationType;          // LOW_STOCK | ORDER_UPDATE | ORDER_CREATED | ORDER_STATUS
  args: Record<string, unknown> | null;  // raw interpolation values; null for legacy rows
  is_read: boolean;
  created_at: string;
}
```

### Server-side localization

`title` and `message` are translated by the backend from stored i18n keys + `args`, based on the `Accept-Language` request header — not translated client-side. The Axios interceptor (`src/common/api/client.ts`) already sends `Accept-Language` from `document.documentElement.lang`, which `I18nProvider` keeps in sync with the active locale. No extra wiring was needed; the page just renders `item.title` / `item.message` directly.

`?lang=ar` query param is **not** supported by the backend (rejected by `forbidNonWhitelisted: true`) — only the header works.

---

## 🪝 `useNotifications(params)`

```typescript
const {
  items,                                  // Notification[] for current page/filter
  total, totalPages, hasNext, hasPrev,    // pagination, from the response envelope
  unreadCount,                            // unread count WITHIN `items` — not global, see below
  isLoading, isFetching, error,
  markRead, isMarkingRead,
  markAllRead, isMarkingAllRead,
} = useNotifications({ page, limit, isRead });
```

`unreadCount` is derived from whatever `items` the current params returned — **page/filter-scoped, not a global total**. `NotificationsPage` works around this with a second, independent call:

```typescript
const { total: unreadCount } = useNotifications({ isRead: false, limit: 1 });
```

Reading `total` from a query scoped to `isRead: false` gives the real DB-wide unread count regardless of which tab/page is active. Any other consumer needing an accurate badge should do the same rather than trusting `unreadCount` from a filtered/paginated call.

---

## 🌐 i18n Keys (`t.notifications`)

```
notifications.page.title / subtitle
notifications.filters.all / unread / read
notifications.types.LOW_STOCK / ORDER_UPDATE / ORDER_CREATED / ORDER_STATUS
notifications.markAllRead
notifications.total                       ← "{count} total" / "{count} إجمالي"
notifications.emptyState.all / unread / read
```

Topbar bell dropdown uses a separate, smaller set under `t.topbar.notifications`:
```
topbar.notifications.title / markAllRead / viewAll / emptyState
```

---

## 🐛 Known Issues Fixed

| Issue | Fix |
|-------|-----|
| Duplicate import of `useNotifications` and `NotificationType` from the same barrel | Merged into one import statement |
| `unreadCount` showed 0 (or a wrong count) when on the "Read" tab or page 2+ | Added a dedicated `useNotifications({ isRead: false, limit: 1 })` call so the badge always reflects the true DB total |
| Hardcoded `"products"` and `"{count} total"` strings | Moved to i18n (`notifications.total`, `dashboard.charts.products`) |
| Dead `src/common/layout/mockNotifications.ts` (pre-API mock data, never imported) | Deleted, along with its re-exports from `common/layout/index.ts` |

---

## 🔄 Related Features

- `features/shared/notifications` — shared hook/api/types (also used by client portal `/client/notifications`)
- `common/layout/TopBar` — bell icon + dropdown preview (admin)
- [client-notifications.md](../client/client-notifications.md) — client portal counterpart
