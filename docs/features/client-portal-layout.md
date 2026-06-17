# Client Portal Layout Shell

**Status**: ✅ Complete  
**Version**: 1.0.0  
**Ticket**: CLIENT-001  
**Route group**: `src/app/client/layout.tsx`

---

## Overview

The client portal layout shell is the persistent frame rendered around every `/client/*` page for `SHOP_OWNER` users. It mirrors the admin layout shell in structure but uses a dark ink theme with amber accents and has no sidebar collapse button or notification bell.

---

## File Structure

```
src/common/layout/
├── ClientLayout.tsx       ← orchestrator — composes all 4 shell pieces
├── ClientSidebar.tsx      ← desktop sidebar (lg+)
├── ClientTopBar.tsx       ← header bar (md+)
├── ClientNavDrawer.tsx    ← tablet slide-in drawer (md–lg)
├── ClientBottomNav.tsx    ← mobile bottom nav (< md)
└── clientNavConfig.ts     ← nav item definitions (single source of truth)

src/app/client/
└── layout.tsx             ← thin 'use client' wrapper → <ClientLayout>
```

---

## Components

### `ClientLayout`

Orchestrates the four shell pieces and owns the `drawerOpen` state for the tablet drawer.

```tsx
<div className="flex h-screen bg-paper">
  <ClientSidebar />                        {/* lg+ only */}
  <div className="flex flex-1 flex-col">
    <ClientTopBar onMenuClick={openDrawer} />
    <main>{children}</main>
  </div>
  <ClientNavDrawer open={drawerOpen} onClose={closeDrawer} />
  <ClientBottomNav />                      {/* < md only */}
</div>
```

---

### `ClientSidebar`

| Property | Value |
|---|---|
| Visibility | `hidden lg:flex` (desktop only) |
| Width | `w-65` (260px) |
| Background | `bg-ink-900` |
| Border | `border-e border-white/8` |
| Active indicator | 4px amber-600 bar, `insetInlineStart: '-12px'` (RTL-aware) |
| Active item bg | `bg-white/[0.07] text-sand-100` |
| Inactive item | `text-ink-300 hover:bg-white/6 hover:text-sand-100` |

**Props**

| Prop | Type | Purpose |
|---|---|---|
| `fluid` | `boolean?` | When `true`, removes the `hidden lg:flex` guard — used inside `ClientNavDrawer` |

**Sections**

1. **Brand block** — amber-600 background square + Warehouse icon in ink-900; brand name + subtitle from `t.client.brand`
2. **Nav items** — from `CLIENT_NAV_ITEMS`; active detection via `pathname.includes(item.href)`
3. **User block** — amber-600 avatar circle with initials from `getInitials(clientName)`; name + role from `t.client.user`
4. **Portal switch** — `ArrowLeftRight` icon + link to `/dashboard` (admin portal)

---

### `ClientTopBar`

| Property | Value |
|---|---|
| Visibility | All breakpoints |
| Hamburger | `hidden md:block lg:hidden` (tablet only) |
| Search bar | None |
| Notification bell | None |

**Page title** — derived from the second URL segment: `/client/dashboard` → looks up `t.client.nav.dashboard`.

**Right section** — language toggle + avatar dropdown with logout (calls `useAuth().logout()`).

---

### `ClientNavDrawer`

Tablet slide-in drawer (visible `md` to `lg`). Renders `<ClientSidebar fluid />` inside a fixed overlay. Pattern mirrors the admin `NavDrawer`.

---

### `ClientBottomNav`

| Property | Value |
|---|---|
| Visibility | `md:hidden` (mobile only) |
| Position | `fixed bottom-0` |
| Height | `h-14` (56px) |
| Items | 4 (no "More" button — all 4 items fit) |

Active item: amber-500 icon + amber-600 label. Inactive: ink-400 icon + ink-300 label.

---

### `clientNavConfig.ts`

```ts
export interface ClientNavItem {
  id: 'dashboard' | 'inventory' | 'order' | 'orders';
  href: string;
  icon: LucideIcon;
}

export const CLIENT_NAV_ITEMS: ClientNavItem[] = [
  { id: 'dashboard', href: '/client/dashboard', icon: LayoutDashboard },
  { id: 'inventory', href: '/client/inventory', icon: Package },
  { id: 'order',     href: '/client/order',     icon: ShoppingCart },
  { id: 'orders',    href: '/client/orders',    icon: ClipboardList },
];
```

---

## i18n Keys (`t.client`)

```json
{
  "brand":        { "name": "...", "sub": "..." },
  "nav":          { "dashboard": "...", "inventory": "...", "order": "...", "orders": "..." },
  "user":         { "name": "...", "role": "..." },
  "portalSwitch": "...",
  "topbar":       { "menuLabel": "...", "langSwitchLabel": "...", "logout": "...", "accountLabel": "..." }
}
```

---

## Responsive Behaviour

| Breakpoint | Sidebar | TopBar hamburger | Bottom nav |
|---|---|---|---|
| < md (mobile) | hidden | hidden | visible (fixed bottom) |
| md–lg (tablet) | hidden | visible → opens NavDrawer | hidden |
| lg+ (desktop) | visible | hidden | hidden |

---

## Route Protection

Access to all `/client/*` routes is enforced by `src/middleware.ts`:
- Non-`SHOP_OWNER` roles hitting `/client/*` are redirected to `/dashboard`
- Unauthenticated requests are redirected to `/login`

See [auth.md](auth.md) for middleware implementation details.

---

## Known Gaps

| Item | Notes |
|---|---|
| Client name / shop name from API | Currently hardcoded in i18n (`t.client.user.name`). Will be replaced with `useAuth().user.name` when real API is wired |
| Notification bell | Not present in client portal (by design) |
