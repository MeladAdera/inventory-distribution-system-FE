# Feature: Clients Admin Page (FIGMA-004)

**Status**: ✅ API Integrated  
**Created Date**: 2026-06-11  
**Last Updated**: 2026-06-16  
**Assignee**: Melad Adera  
**Ticket**: FIGMA-004

---

## 📋 Overview

### Purpose
The Clients admin page (`/clients`) is the primary interface for managing shop accounts. It supports creating new shop owners, editing shop details, toggling active/inactive status, and searching/filtering — all from real backend data.

### Business Value
- Server-side search with 300ms debounce — no full list download needed
- Server-side pagination — scales to any number of shops
- Create flow uses `POST /users/shop-owners` — creates both the shop and the owner account in one call
- Edit flow uses `PATCH /shops/:id` — updates name, phone, address independently
- Deactivate/Activate uses `PATCH /shops/:id/status` — reversible, no data loss
- Bilingual (AR/EN) with full RTL/LTR layout support

---

## 🏗️ Architecture

### File Structure
```
src/features/clients/
├── components/
│   ├── ClientAvatar.tsx              # Initials circle (bg ink-900, text amber-500)
│   ├── ClientStatusBadge.tsx         # Active / Inactive pill
│   ├── ClientsTableCard.tsx          # Table: toolbar + 8-col grid + skeleton + pagination
│   ├── AddShopOwnerModal.tsx         # Create modal — shopName, shopAddress, ownerName, email, password
│   ├── ClientFormModal.tsx           # Edit modal — name, phone, address (edit-only)
│   └── ClientDeleteConfirmModal.tsx  # Deactivate/Activate confirm dialog
├── hooks/
│   └── useClients.ts                 # TanStack Query list + 3 mutations
├── types/
│   └── clients.types.ts              # AdminClient, ClientStatus
├── validations/
│   └── clients.schema.ts             # clientFormSchema + addShopOwnerSchema (Zod)
└── index.ts                          # Barrel export

src/app/(dashboard)/clients/page.tsx  # Page — debounced search, pagination, modal routing
src/i18n/en/clients.json              # English translations
src/i18n/ar/clients.json              # Arabic translations
```

---

## 🪝 `useClients(params)`

```typescript
const {
  clients,        // AdminClient[] — current page mapped from Shop[]
  total,          // number — server total (used for pagination)
  isLoading,
  createShopOwner,  // mutateAsync(CreateShopOwnerInput) → POST /users/shop-owners
  isCreating,
  updateShop,       // mutateAsync({ id, data: UpdateShopInput }) → PATCH /shops/:id
  isUpdating,
  toggleStatus,     // mutateAsync({ id, isActive }) → PATCH /shops/:id/status
  isTogglingStatus,
} = useClients({ page, limit, search });
```

### `Shop → AdminClient` mapping
```
id           → id
name         → name_ar, name_en   (single name used for both locales)
phone        → phone  (null → '—')
address      → city_ar, city_en  (null → '—')
is_active    → status: 'active' | 'inactive'
(not in API) → product_count: 0, last_activity_ar/en: '—'
```

### Pagination
- `page` and `limit` sent as query params to `GET /shops?type=SHOP`
- `total` drives the pagination controls in `ClientsTableCard`
- Status filter is client-side on the current page (API has no status param)

---

## 🧩 Modals

### `AddShopOwnerModal` (create)
Fields: Shop name *(required)*, Shop address, Owner name *(required)*, Email *(required)*, Password *(required, min 8)*  
Calls: `POST /users/shop-owners` — creates shop + owner account atomically  
Schema: `addShopOwnerSchema`

### `ClientFormModal` (edit-only)
Fields: Shop name *(required)*, Phone *(required)*, Address  
Calls: `PATCH /shops/:id`  
Schema: `clientFormSchema`  
Pre-fills from `AdminClient`: `name_ar` → name, phone (empty if `'—'`), `city_ar` → address

### `ClientDeleteConfirmModal` (deactivate / activate)
Confirm button calls `PATCH /shops/:id/status { isActive: !current }`.  
If client is active → deactivates. If inactive → activates. Toast confirms which action occurred.

---

## 🌐 i18n Keys

```
clients.page.{title, count, addClient}
clients.toolbar.{searchPlaceholder, allStatuses, export, statuses.{active, inactive}}
clients.table.{num, client, phone, address, products, lastActivity, status, actions}
clients.emptyState.{title, sub, addClient}
clients.pagination.showing
clients.add.{title, shopName, shopNamePlaceholder, shopAddress, shopAddressPlaceholder,
             ownerName, ownerNamePlaceholder, email, emailPlaceholder,
             password, passwordPlaceholder, errShopName, errOwnerName, errEmail, errPassword,
             save, cancel}
clients.form.{editTitle, save, cancel, name, namePlaceholder, phone, phonePlaceholder,
              address, addressPlaceholder, errName, errPhone}
clients.delete.{title, warning, delete, cancel}
clients.toast.{created, updated, deactivated, activated}
```

---

## ✅ Acceptance Criteria

- [x] Table shows real shops from `GET /shops?type=SHOP`
- [x] Search debounces 300ms then triggers a server-side re-fetch
- [x] Pagination works server-side via `page` + `limit` params
- [x] Status filter works client-side on the current page
- [x] Add button opens `AddShopOwnerModal`; success → invalidates shop list query
- [x] Edit button opens `ClientFormModal` pre-filled; success → invalidates shop list query
- [x] Deactivate/Activate confirm dialog toggles `is_active` via `PATCH /shops/:id/status`
- [x] Toast shown for every mutation result (success and failure)
- [x] `npx tsc --noEmit` — zero errors

---

## 🔗 Related

- Shop types/API: `src/features/shops/`
- User types/API: `src/features/users/`
