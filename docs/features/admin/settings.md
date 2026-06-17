# Feature Documentation: Settings

**Status**: Complete  
**Created Date**: 2026-06-16  
**Last Updated**: 2026-06-16  
**Assignee**: Melad Adera

---

## 📋 Overview

### Purpose
The Settings page gives each authenticated user a place to view and update their personal account information and (for Shop Owners) their shop details. It is intentionally minimal for now — a placeholder section for future UI preferences (theme, language default, density) is planned but not yet built.

### Business Value
Users can correct their own name/email without going through an admin. Shop Owners can keep their branch contact info (address, phone) up to date directly from the UI.

### Who Sees What

| Section | WAREHOUSE_ADMIN | SHOP_OWNER | EMPLOYEE |
|---------|:-:|:-:|:-:|
| My Profile | ✅ | ✅ | ✅ |
| My Shop | — | ✅ | — |

---

## 🎯 Requirements

### Functional Requirements
- [x] Profile card: displays name, email, role badge (read-only)
- [x] Profile card: inline edit mode for name + email (saved via `PATCH /users/:id`)
- [x] Profile card: on save, auth store is updated so name reflects everywhere immediately (sidebar, topbar, dashboard greeting)
- [x] Shop card: displays shop name, address, phone (Shop Owner only)
- [x] Shop card: inline edit for all three fields (saved via `PATCH /shops/:id`)
- [x] Shop card: skeleton loading state while `GET /shops/:id` fetches
- [x] Both cards: success/error toasts on save
- [x] Both cards: Save/Cancel footer with disabled state while saving
- [x] AR/EN i18n for all labels, placeholders, toasts, and role names

### Non-Functional Requirements
- [x] Cards constrained to `max-w-2xl` (672 px) for form readability
- [x] No new API client code — reuses `usersApi` and `shopsApi` from existing features
- [x] Clean separation of concerns: types / utils / hooks / shared UI / card components

---

## 🏗 Architecture

### File Structure

```
src/
├── app/(dashboard)/settings/
│   └── page.tsx                        # Route entry — orchestrates both cards
│
├── features/settings/
│   ├── types/
│   │   └── settings.types.ts           # ProfileCardProps, ProfileFormValues, ShopCardProps, ShopFormValues
│   ├── utils/
│   │   └── profile.utils.ts            # ROLE_BADGE_CLS map; re-exports getInitials from common
│   ├── hooks/
│   │   └── useSettings.ts              # useProfileSettings, useShopSettings
│   └── components/
│       ├── shared.tsx                  # CardHeader, CardFooter, InfoRow, FieldRow, inputCls, skeletons
│       ├── ProfileCard.tsx             # RoleBadge, ProfileBanner, ProfileCard
│       └── ShopCard.tsx                # ShopBanner, ShopCard
│
├── common/utils/
│   └── string.utils.ts                 # getInitials (single source of truth)
│
└── i18n/
    ├── en/settings.json
    └── ar/settings.json
```

### Component Hierarchy

```
SettingsPage
├── ProfileCard
│   ├── CardHeader        (shared)
│   ├── ProfileBanner     (avatar initials + name + email + role badge)
│   ├── InfoRow ×3        (view mode — shared)
│   ├── FieldRow ×2       (edit mode — shared)
│   └── CardFooter        (shared)
└── ShopCard              (SHOP_OWNER only)
    ├── CardHeader        (shared)
    ├── ShopBanner        (store icon + shop name + type badge)
    ├── InfoRow ×3        (view mode — shared)
    ├── FieldRow ×3       (edit mode — shared)
    └── CardFooter        (shared)
```

---

## 🔌 API Integration

### Profile

| Action | Endpoint | Hook |
|--------|----------|------|
| Update name/email | `PATCH /users/:id` | `useProfileSettings(userId)` |

- `userId` comes from `useAuth().user.id` (auth store, always available)
- On success: `setAuth({ ...currentUser, ...response.data })` updates the auth store so name/initials reflect everywhere without a page reload
- Also invalidates `['users']` query cache

### Shop

| Action | Endpoint | Hook |
|--------|----------|------|
| Fetch shop details | `GET /shops/:id` | `useShopSettings(shopId)` |
| Update shop info | `PATCH /shops/:id` | `useShopSettings(shopId)` |

- `shopId` comes from `useAuth().user.shopId`
- Query key: `['shop-settings', shopId]` — scoped separately from the shops list cache
- On success: invalidates both `['shop-settings', shopId]` and `['shops']`

---

## 🌐 i18n Keys

```
settings.page.title
settings.profile.title / subtitle / name / email / role / edit / save / cancel
settings.profile.roles.WAREHOUSE_ADMIN / SHOP_OWNER / EMPLOYEE
settings.profile.toast.success / error
settings.shop.title / subtitle / name / address / phone / edit / save / cancel
settings.shop.toast.success / error
```

---

## 🎨 Design Decisions

- **Row layout** — label (w-32, ink-500) + value on the same line with border-b dividers, instead of stacked label/value pairs. Matches professional settings pages (Linear, Stripe style).
- **Identity banner** — sand-100 tinted block above the rows. Avatar uses ink-900 circle with amber initials (consistent with sidebar/topbar). Shop uses a Store icon in the same style.
- **Edit footer** — `bg-sand-100/50` strip at the bottom, separated from the fields — same pattern as modal footers in the rest of the app.
- **No modal** — edit happens inline within the card, not in a popup. Settings pages should feel stable, not interruptive.
- **max-w-2xl** — form cards constrained to 672 px. Full-width settings cards look awkward on large screens.

---

## 🚧 Known Limitations / Future Work

- **UI preferences** — theme switcher (warm/ink), accent color, table density, language default are planned but not yet built. These will be client-side only (localStorage/Zustand), no backend needed.
- **Password change** — not in scope for this phase. Will require a separate `PATCH /users/:id/password` endpoint.
- **Avatar upload** — no file upload support yet. Initials-based avatar is the current solution.
- **Employee visibility** — Employees see the Profile card but cannot edit their own data (the `PATCH /users/:id` endpoint is restricted to `WAREHOUSE_ADMIN` and `SHOP_OWNER`). A future task should either hide the Edit button for employees or add a dedicated self-edit endpoint.
