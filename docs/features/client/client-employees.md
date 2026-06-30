# Client Employees Page

**Status**: ✅ Complete (real API integrated)  
**Created Date**: 2026-06-25  
**Last Updated**: 2026-06-30  
**Assignee**: Melad Adera  
**Route**: `/client/employees`  
**File**: `src/app/client/employees/page.tsx`  
**Page Component**: `src/features/shop/components/ClientEmployeesPage.tsx`

---

## 📋 Overview

### Purpose
Allows shop owners to manage the employees of their shop — create new accounts, edit name/email, deactivate access, and reactivate previously deactivated employees — directly from the client portal.

### Business Value
Shop owners are self-sufficient in managing their team without needing to contact the warehouse admin. Employees receive login credentials and land in the client portal automatically.

### Who Sees What

| Action | SHOP_OWNER | EMPLOYEE |
|--------|:-:|:-:|
| View employee list | ✅ | ✅ |
| Add employee | ✅ | — |
| Edit employee | ✅ | — |
| Deactivate employee | ✅ | — |
| Reactivate employee | ✅ | — |

---

## 🎯 Requirements

### Functional Requirements
- [x] List all `EMPLOYEE` users belonging to the current shop via `GET /users?role=EMPLOYEE`
- [x] Show name, email, active/inactive status badge per employee
- [x] "Add Employee" button opens `CreateEmployeeModal` → `POST /users/employees`
- [x] "Edit" button opens `EditUserModal` → `PATCH /users/:id`
- [x] "Deactivate" button (active employees only) opens `DeactivateUserDialog` → `DELETE /users/:id`
- [x] "Activate" button (inactive employees only) fires immediately without a dialog → `PATCH /users/:id/activate`; shows success/error toast
- [x] Empty state with CTA when no employees exist
- [x] Loading and error states
- [x] AR/EN i18n for all labels and toasts

### Non-Functional Requirements
- [x] Modals reused from `features/admin/users` with zero changes
- [x] Desktop table + mobile card layout following client portal conventions
- [x] Deactivate action only shown for `is_active: true` employees; Activate action only shown for `is_active: false` employees

---

## 🏗 Architecture

### File Structure

```
src/
├── app/client/employees/
│   └── page.tsx                                   ← thin route wrapper
│
└── features/shop/components/
    ├── ClientEmployeesPage.tsx                    ← orchestrator
    └── employees/
        └── EmployeesTableCard.tsx                 ← desktop table + mobile cards + empty state

features/admin/users/                              ← reused with zero changes
├── api/users.api.ts                               ← createEmployee, update, deactivate
├── hooks/useUsers.ts                              ← list query + mutations
├── components/
│   ├── CreateEmployeeModal.tsx
│   ├── EditUserModal.tsx
│   └── DeactivateUserDialog.tsx
└── types/users.types.ts

i18n/
├── en/client.json                                 ← t.client.employees.*
└── ar/client.json
```

### Component Hierarchy

```
ClientEmployeesPage
├── EmployeesTableCard
│   ├── StatusPill           ← teal (active) / red (inactive)
│   ├── Desktop grid rows
│   └── Mobile card rows
├── CreateEmployeeModal      ← from admin/users
├── EditUserModal            ← from admin/users
└── DeactivateUserDialog     ← from admin/users
```

---

## Data Flow

```
GET /users?role=EMPLOYEE
    ↓  usersApi.list({ role: EMPLOYEE })
    ↓  useUsers({ role: EMPLOYEE })   — unwraps data.data.data → User[]
    ↓  ClientEmployeesPage            — holds createOpen, editUser, deactivateUser state

  on "Add Employee":
    ↓  setCreateOpen(true)
    ↓  CreateEmployeeModal → POST /users/employees
    ↓  onSuccess: setCreateOpen(false), invalidates ['users']

  on "Edit":
    ↓  setEditUser(user)
    ↓  EditUserModal → PATCH /users/:id
    ↓  onSuccess: setEditUser(null), invalidates ['users']

  on "Deactivate":
    ↓  setDeactivateUser(user)
    ↓  DeactivateUserDialog → DELETE /users/:id
    ↓  onSuccess: setDeactivateUser(null), invalidates ['users']

  on "Activate" (direct — no dialog):
    ↓  handleReactivate(user)
    ↓  reactivateUser(user.id) → PATCH /users/:id/activate
    ↓  onSuccess: toast.success, invalidates ['users']
    ↓  onError: toast.error(getErrorMessage)
```

---

## 🔌 API Integration

| Action | Endpoint | Roles |
|--------|----------|-------|
| List employees | `GET /users?role=EMPLOYEE` | `SHOP_OWNER`, `EMPLOYEE` |
| Create employee | `POST /users/employees` | `SHOP_OWNER` |
| Update employee | `PATCH /users/:id` | `SHOP_OWNER` |
| Deactivate employee | `DELETE /users/:id` | `SHOP_OWNER` |
| Reactivate employee | `PATCH /users/:id/activate` | `SHOP_OWNER` |

> `POST /users/employees` automatically assigns the new employee to the calling shop owner's shop. No `shop_id` is needed in the request body.

**Response unwrapping:**
```ts
const employees: User[] = users?.data?.data ?? [];
const total: number = users?.data?.total ?? 0;
```

---

## 🧩 EmployeesTableCard

### Desktop Table (`hidden sm:block`)

Grid columns: `grid-cols-[1fr_1fr_0.6fr_auto]`

| Column | Content |
|--------|---------|
| Name | `emp.name` — truncated |
| Email | `emp.email` — truncated |
| Status | `StatusPill` — teal Active / red Inactive |
| Actions | Edit button + Deactivate (`UserX`, red, active only) or Activate (`RotateCcw`, teal, inactive only) |

### Mobile Cards (`sm:hidden`)

```
[Name]                          [StatusPill]
[Email]
[Edit button]  [Deactivate button]   ← active employees
[Edit button]  [Activate button]     ← inactive employees
```

### Empty State

Icon (`Users`) + title + subtitle + "Add Employee" CTA button.

---

## 🌐 i18n Keys (`t.client.employees`)

```json
{
  "title": "My Employees",
  "subtitle": "Manage your shop's team members",
  "addBtn": "+ Add Employee",
  "count": "employees",
  "loading": "Loading employees…",
  "errorMsg": "Failed to load employees. Please try again.",
  "table": {
    "name": "Name",
    "email": "Email",
    "status": "Status",
    "active": "Active",
    "inactive": "Inactive",
    "editBtn": "Edit",
    "deactivateBtn": "Deactivate",
    "activateBtn": "Activate",
    "empty": "No employees yet"
  },
  "empty": {
    "title": "No employees yet",
    "sub": "Add your first employee to give them access to your shop."
  }
}
```

Modal strings reuse `t.users.createEmployee.*`, `t.users.editUser.*`, `t.users.deactivateUser.*`. Reactivate toast uses `t.users.activateUser.toastSuccess`.

---

## 🔐 Security & Permissions

- Backend scopes `GET /users` to the caller's shop — employees cannot see employees from other shops
- `POST /users/employees` is restricted to `SHOP_OWNER` server-side; the backend auto-assigns `shop_id`
- Client-side: Edit and Deactivate buttons are always rendered (no `isShopOwner` gate currently) — a future task should hide them for employees since the underlying API calls will return `403`

---

## 🔄 Employee Login Flow (Middleware)

After an employee is created they log in at `/login`. The middleware in `src/middleware.ts` routes them correctly:

| Step | Logic |
|------|-------|
| Login redirect | `role === EMPLOYEE` → `/client/dashboard` |
| Admin route guard | `isAdminRoute && (SHOP_OWNER \|\| EMPLOYEE)` → redirect to `/client/dashboard` |
| Client route guard | `isClientRoute && role !== SHOP_OWNER && role !== EMPLOYEE` → redirect to `/dashboard` |

---

## 🔄 Related Features

- `features/admin/users` — API, hook, and modals are reused directly
- `features/auth` — middleware controls employee portal access
- `common/layout/clientNavConfig` — `employees` nav item (5th, in overflow)
- `i18n/en/client.json` + `i18n/ar/client.json` — `employees` nav label + page strings
