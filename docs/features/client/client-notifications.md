# Client Notifications Page

**Status**: ✅ Complete (real API integrated)
**Created Date**: 2026-06-30
**Last Updated**: 2026-06-30
**Assignee**: Melad Adera
**Route**: `/client/notifications`
**File**: `src/app/client/notifications/page.tsx`

---

## 📋 Overview

### Purpose
Gives shop owners and employees the same low-stock and order-update notifications visibility that the warehouse admin has, from within the client portal. Until this page existed, `ClientTopBar` had no bell icon at all.

### Business Value
Shop staff can see and clear low-stock alerts and order status updates without needing access to the admin panel.

---

## 🎯 Requirements

### Functional Requirements
- [x] Bell icon added to `ClientTopBar` (previously absent) — unread badge, dropdown preview (last 20), mark-read on click, "View all" link
- [x] `/client/notifications` page — same filter tabs, pagination, and mark-read/mark-all-read behavior as the admin page
- [x] AR/EN i18n for the bell dropdown strings under `client.topbar.notifications`

### Non-Functional Requirements
- [x] No new component, hook, API, or type code — reuses everything from `features/shared/notifications` and the admin `NotificationsPage` component
- [x] Same `/notifications` backend endpoint as admin — no client-specific endpoint needed; the backend scopes results by the authenticated user

---

## 🏗 Architecture

### File Structure

```
src/
├── app/client/notifications/
│   └── page.tsx                          ← thin route wrapper, renders the SAME
│                                            NotificationsPage component as admin
│
├── common/layout/
│   └── ClientTopBar.tsx                  ← bell icon + dropdown preview (client)
│
└── features/
    ├── shared/notifications/             ← shared with admin portal (see admin doc)
    └── admin/notifications/components/
        └── NotificationsPage.tsx         ← role-agnostic, imported directly by both route shells
```

```typescript
// src/app/client/notifications/page.tsx
import { NotificationsPage } from '@/features/admin/notifications/components/NotificationsPage';
export default function Page() {
  return <NotificationsPage />;
}
```

The component lives under `features/admin/` for historical reasons (built for the admin portal first) but has zero admin-specific logic — it only calls `useNotifications`, which hits the same `/notifications` endpoint for any authenticated user.

---

## 🔌 API Integration

Identical to the admin page — see [notifications.md](../admin/notifications.md#-api-integration) for the full `Notification` shape, server-side localization behavior, and `useNotifications` hook contract.

---

## 🌐 i18n Keys

Page content reuses `t.notifications.*` (same namespace as admin — see [notifications.md](../admin/notifications.md#-i18n-keys-tnotifications)).

`ClientTopBar`'s bell dropdown uses its own namespace, added under `client.topbar.notifications`:
```
client.topbar.notifications.title / markAllRead / viewAll / emptyState
client.nav.notifications              ← page title shown in ClientTopBar's header
```

---

## 🔄 Related Features

- [notifications.md](../admin/notifications.md) — full architecture, hook contract, and known-issues history (applies here too)
- `common/layout/ClientTopBar` — bell icon + dropdown preview (client)
- [client-portal-layout.md](client-portal-layout.md) — overall client shell `ClientTopBar` lives in
