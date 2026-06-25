# Client Settings Page

**Status**: ✅ Complete (real API integrated)  
**Created Date**: 2026-06-25  
**Last Updated**: 2026-06-25  
**Assignee**: Melad Adera  
**Route**: `/client/settings`  
**File**: `src/app/client/settings/page.tsx`

---

## 📋 Overview

### Purpose
Gives shop owners (and employees) a place to view and edit their personal profile and shop information directly from the client portal — without needing access to the admin panel.

### Business Value
Shop owners can correct their own name/email and keep their branch details (address, phone) up to date without going through a warehouse admin.

### Who Sees What

| Section | SHOP_OWNER | EMPLOYEE |
|---------|:-:|:-:|
| My Profile | ✅ | ✅ |
| My Shop | ✅ | — |

---

## 🎯 Requirements

### Functional Requirements
- [x] Profile card: displays name, email, role badge (read-only)
- [x] Profile card: inline edit mode for name + email via `PATCH /users/:id`
- [x] Profile card: on save, Zustand auth store is updated — name reflects everywhere immediately (sidebar, topbar)
- [x] Shop card: displays shop name, address, phone (Shop Owner only)
- [x] Shop card: inline edit for all three fields via `PATCH /shops/:id`
- [x] Shop card: skeleton loading state while `GET /shops/:id` fetches
- [x] Both cards: success/error toasts on save
- [x] AR/EN i18n for all labels, placeholders, toasts, and role names

### Non-Functional Requirements
- [x] No new API code — reuses `usersApi` and `shopsApi` from existing features
- [x] No new hooks or types — reuses `useProfileSettings` and `useShopSettings` from `features/settings`
- [x] Cards constrained to `max-w-2xl` for form readability

---

## 🏗 Architecture

### File Structure

```
src/
├── app/client/settings/
│   └── page.tsx                        ← thin route wrapper
│
└── features/settings/                  ← shared with admin portal
    ├── types/
    │   └── settings.types.ts
    ├── utils/
    │   └── profile.utils.ts
    ├── hooks/
    │   └── useSettings.ts              ← useProfileSettings, useShopSettings
    └── components/
        ├── shared.tsx                  ← CardHeader, CardFooter, InfoRow, FieldRow, skeletons
        ├── ProfileCard.tsx
        └── ShopCard.tsx

i18n/
├── en/settings.json
└── ar/settings.json
```

### Component Hierarchy

```
ClientSettingsPage (page.tsx)
├── ProfileCard
│   ├── CardHeader
│   ├── ProfileBanner     ← avatar initials + name + email + role badge
│   ├── InfoRow ×3        ← view mode
│   ├── FieldRow ×2       ← edit mode
│   └── CardFooter
└── ShopCard              ← SHOP_OWNER only
    ├── CardHeader
    ├── ShopBanner        ← store icon + name + type badge
    ├── InfoRow ×3        ← view mode
    ├── FieldRow ×3       ← edit mode
    └── CardFooter
```

---

## 🔌 API Integration

| Action | Endpoint | Hook |
|--------|----------|------|
| Update name/email | `PATCH /users/:id` | `useProfileSettings(userId)` |
| Fetch shop details | `GET /shops/:id` | `useShopSettings(shopId)` |
| Update shop info | `PATCH /shops/:id` | `useShopSettings(shopId)` |

- `userId` and `shopId` come from `useAuth()` (Zustand auth store)
- On profile save: `setAuth({ ...currentUser, ...response.data })` syncs the store immediately
- On shop save: invalidates `['shop-settings', shopId]` and `['shops']` query caches

---

## 🌐 i18n Keys (`t.settings`)

```
settings.page.title
settings.profile.title / subtitle / name / email / role / edit / save / cancel
settings.profile.roles.WAREHOUSE_ADMIN / SHOP_OWNER / EMPLOYEE
settings.profile.toast.success / error
settings.shop.title / subtitle / name / address / phone / edit / save / cancel
settings.shop.toast.success / error
```

---

## 🔐 Security & Permissions

- `ProfileCard` is shown to all authenticated users; the `PATCH /users/:id` endpoint is restricted server-side to `WAREHOUSE_ADMIN` and `SHOP_OWNER` — employees see read-only view (Edit button is always shown; the request will fail with 403 for employees)
- `ShopCard` is gated client-side with `isShopOwner` from `usePermission()` and never rendered for employees

---

## 🔄 Related Features

- `features/settings` — shared components and hooks (also used by admin portal `/settings`)
- `features/auth` — `useAuth()` provides `user.id`, `user.shopId`, `user.role`
- `common/layout/ClientSidebar` — reflects updated name from auth store
- `common/layout/ClientTopBar` — reflects updated name from auth store
