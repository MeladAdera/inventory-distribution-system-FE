# Feature: Users

**Status**: ✅ Complete  
**Tickets**: TICKET-017, TICKET-022–027, TICKET-040–044  
**Created**: 2026-06-10  
**Last Updated**: 2026-07-06

---

## Overview

The Users feature lets `WAREHOUSE_ADMIN` and `SHOP_OWNER` roles manage team members. Admins can create shop owners (which also creates the shop); shop owners can create employees within their own shop. Both roles can edit, deactivate, and reactivate users.

`EMPLOYEE` role has no access — they are redirected to `/dashboard` on load.

---

## File Structure

```
src/features/users/
├── api/
│   └── users.api.ts               # All user HTTP calls
├── components/
│   ├── UsersTable.tsx             # DataTable with role/status badges + action buttons
│   ├── CreateShopOwnerModal.tsx   # Form: shopName, shopAddress, ownerName, email, password
│   ├── CreateEmployeeModal.tsx    # Form: name, email, password
│   ├── EditUserModal.tsx          # Form: name, email (pre-filled), password (optional, min 6 — blank keeps current)
│   └── DeactivateUserDialog.tsx   # ConfirmDialog wrapping DELETE /users/:id
├── hooks/
│   └── useUsers.ts                # List query + createShopOwner, createEmployee, update, deactivate mutations
├── types/
│   └── users.types.ts             # User, UserListParams, Create/Update input types
├── validations/
│   └── users.schema.ts            # createShopOwnerSchema, createEmployeeSchema, updateUserSchema
└── index.ts                       # Barrel export

src/app/(dashboard)/users/
└── page.tsx                       # Users list page with filters and modal orchestration
```

---

## API Integration

| Method | Endpoint | Used for | Role |
|--------|----------|----------|------|
| `GET` | `/users` | Paginated list with filters | WAREHOUSE_ADMIN, SHOP_OWNER |
| `GET` | `/users/:id` | Single user | WAREHOUSE_ADMIN, SHOP_OWNER |
| `POST` | `/users/shop-owners` | Create shop + owner in one request | WAREHOUSE_ADMIN |
| `POST` | `/users/employees` | Create employee in caller's shop | SHOP_OWNER |
| `PATCH` | `/users/:id` | Update name / email / password. All fields optional — only changed fields are sent; password (min 6) is hashed server-side and never returned. `SHOP_OWNER` can only update their own employees; `WAREHOUSE_ADMIN` can update any user. | WAREHOUSE_ADMIN, SHOP_OWNER |
| `DELETE` | `/users/:id` | Soft-delete (sets `is_active = false`) | WAREHOUSE_ADMIN, SHOP_OWNER |
| `PATCH` | `/users/:id/activate` | Reactivate (sets `is_active = true`). No-op if already active. `SHOP_OWNER` can only target their own shop's employees — cross-shop returns `403`. | WAREHOUSE_ADMIN, SHOP_OWNER |

### Query Params (list)
| Param | Type | Notes |
|-------|------|-------|
| `page` | number | Default 1 |
| `limit` | number | Fixed at 10 |
| `role` | UserRole | Filter by exact role |
| `search` | string | Matches name or email (300 ms debounce) |

---

## Types

```ts
interface User {
  id: number;
  shop_id: number | null;
  name: string;
  email: string;
  role: UserRole;           // WAREHOUSE_ADMIN | SHOP_OWNER | EMPLOYEE
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateShopOwnerInput {
  shopName: string; shopAddress?: string;
  ownerName: string; email: string; password: string;
}

interface CreateEmployeeInput { name: string; email: string; password: string; }

interface UpdateUserInput { name?: string; email?: string; password?: string; }
```

---

## Hook

```ts
const {
  users,           // ApiResponse<PaginatedResponse<User>> — access .data.data for the array
  isLoading,
  error,
  createShopOwner, // (data: CreateShopOwnerInput) => Promise<void>
  createEmployee,  // (data: CreateEmployeeInput) => Promise<void>
  updateUser,      // ({ id, data }) => Promise<void>
  deactivateUser,  // (id: number) => Promise<void>
  reactivateUser,  // (id: number) => Promise<void>
} = useUsers(params);
```

All mutations call `invalidateQueries(['users'])` on success so the list refreshes automatically.

---

## Shared Components Built for This Feature

These live in `src/common/components/` and are reused by all subsequent features.

| Component | Purpose |
|-----------|---------|
| `Badge` | Colored label — variants: `default`, `success`, `warning`, `danger`, `info` |
| `DataTable<T>` | Generic paginated table with skeleton loading and empty state |
| `Modal` | Centered overlay dialog with backdrop and close button |
| `ConfirmDialog` | Modal variant for destructive confirmations with loading state |
| `Pagination` | Prev/Next with "Showing X–Y of Z" count |
| `PasswordInput` | Drop-in `<input type="password">` replacement with Eye/EyeOff toggle; works with `react-hook-form` |

The `ToastProvider` (in `src/providers/ToastProvider.tsx`) was also added — import `useToast` from `@/providers` to show success/error messages.

```ts
const toast = useToast();
toast.success('User created');
toast.error('Something went wrong');
```

---

## `usePermission` Hook (improved)

`src/common/hooks/usePermission.ts` now exposes:

```ts
const {
  isWarehouseAdmin, isShopOwner, isEmployee,  // boolean shortcuts
  canCreate, canEdit, canDelete,               // false for EMPLOYEE
  hasPermission(role),                         // exact role match
  hasMinRole(minRole),                         // hierarchy check (ADMIN > OWNER > EMPLOYEE)
} = usePermission();
```

---

## Page Behaviour

**Route**: `/users`

| Role | Can see page | Create button shown | Edit / Deactivate / Activate shown |
|------|:-----------:|:------------------:|:----------------------------------:|
| WAREHOUSE_ADMIN | ✓ | "Create Shop Owner" | ✓ |
| SHOP_OWNER | ✓ | "Create Employee" | ✓ (own shop's employees only) |
| EMPLOYEE | ✗ (redirected to `/dashboard`) | — | — |

**Filters**: search (debounced 300 ms) + role dropdown. Both reset pagination to page 1 on change.

**Pagination**: shows only when `total > 10`. Uses the shared `Pagination` component.

---

## Validation Rules

| Schema | Field | Rules |
|--------|-------|-------|
| `createShopOwnerSchema` | shopName | required |
| | shopAddress | optional |
| | ownerName | required |
| | email | required, valid email |
| | password | required, min 6 chars |
| `createEmployeeSchema` | name | required |
| | email | required, valid email |
| | password | required, min 6 chars |
| `updateUserSchema` | name | optional, min 2 chars |
| | email | optional, valid email |
| | password | optional, min 6 chars if provided (empty string treated as "unchanged") |

---

## Manual Testing Checklist

- [ ] `/users` redirects EMPLOYEE to `/dashboard`
- [ ] WAREHOUSE_ADMIN sees "Create Shop Owner" button, not "Create Employee"
- [ ] SHOP_OWNER sees "Create Employee" button, not "Create Shop Owner"
- [ ] Search filters the list and resets to page 1
- [ ] Role dropdown filters correctly
- [ ] Create Shop Owner — form validates, success toast, list refreshes
- [ ] Create Employee — form validates, success toast, list refreshes
- [ ] Edit User — pre-fills current values, saves changes, success toast
- [ ] Edit User — leaving the new password field blank keeps the existing password (no `password` key sent in the PATCH body)
- [ ] Edit User — entering a new password (min 6 chars) updates it; `EditUserModal` is shared, so this also works from the shop-owner "Employees" page
- [ ] Deactivate — confirm dialog shows user name, sets `is_active = false`, row status badge changes to "Inactive", "Deactivate" button replaced by "Activate" for that row
- [ ] Activate — clicking "Activate" on an inactive row fires immediately (no dialog), sets `is_active = true`, status badge changes to "Active", "Activate" button replaced by "Deactivate"
- [ ] Activate shows success toast with user name; API errors (e.g. 403 cross-shop) surface as error toast
- [ ] Server errors (e.g. duplicate email) surface inside the modal as an `ErrorAlert`
- [ ] Pagination shows only when total > 10

---

## Known Issues

None.

---

## Related Features

- **Auth** — `usePermission` reads from `authStore` populated by `AuthProvider`
- **Shops** (upcoming) — Creating a shop owner also creates a shop; the shop list will reflect it
