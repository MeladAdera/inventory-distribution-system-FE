# Project Roadmap — Inventory Distribution System (Frontend)

> Work top-to-bottom. Each ticket is one focused unit of work.
> Tickets within a phase are independent unless noted with **"depends on"**.

---

## Legend
- `[ ]` Not started
- `[x]` Done
- **Files** — what to create or edit
- **AC** — acceptance criteria

---

## Phase 0 — Infrastructure ✅

| ID | Title | Status |
|----|-------|--------|
| TICKET-001 | Project scaffolding (Next.js 14, TypeScript, Tailwind, ESLint, Prettier, Husky) | `[x]` |
| TICKET-002 | Folder structure (`app/`, `features/`, `common/`, `providers/`, `config/`) | `[x]` |
| TICKET-003 | Axios client with base URL and timeout | `[x]` |
| TICKET-004 | Path aliases (`@/*`) | `[x]` |
| TICKET-005 | Common UI components: `Button`, `FormField`, `ErrorAlert`, `LoadingSpinner` | `[x]` |
| TICKET-006 | Common hooks: `usePagination`, `usePermission` | `[x]` |
| TICKET-007 | Layout shell: `DashboardLayout`, `Sidebar`, `TopBar`, `NavDrawer`, `BottomNav`, `BottomSheet`, i18n | `[x]` |
| TICKET-008 | App constants and route map (`ROUTES`, `PAGINATION`) | `[x]` |

---

## Phase 1 — Auth Layer ✅

| ID | Title | Status |
|----|-------|--------|
| TICKET-009 | `authStore` (Zustand) — user, isAuthenticated, isInitializing | `[x]` |
| TICKET-010 | `tokenUtils` — cookie-based read/write/clear/isExpired | `[x]` |
| TICKET-011 | `authApi` — login, logout, refresh, getCurrentUser | `[x]` |
| TICKET-012 | Route protection middleware (Next.js `middleware.ts`) | `[x]` |
| TICKET-013 | Token refresh interceptor (Axios response interceptor) | `[x]` |
| TICKET-014 | `AuthProvider` — hydrates store from `/auth/me` on mount | `[x]` |
| TICKET-015 | Login page with React Hook Form + Zod validation | `[x]` |

---

## Phase 2 — Shared Type Fixes & Missing Feature Scaffolds ✅ (partial)

> Fix the shared API envelope types and create the 5 missing feature scaffolds before building any pages.

---

### TICKET-016 — Fix shared API envelope types `[x]`

**Files:** `src/common/types/api.types.ts`

The current `ApiResponse` has a `success` field and an optional `message` field that the backend does not return. `PaginatedResponse` has a `totalPages` field the backend does not send.

**Changes:**
```ts
// Before (wrong)
interface ApiResponse<T> { success: boolean; data: T; message?: string; timestamp: string; }
interface PaginatedResponse<T> { data: T[]; total: number; page: number; limit: number; totalPages: number; }

// After (matches backend envelope)
interface ApiResponse<T> { data: T; statusCode: number; timestamp: string; }
interface PaginatedResponse<T> { data: T[]; total: number; page: number; limit: number; }
```

**AC:**
- [ ] `ApiResponse` fields exactly match `{ data, statusCode, timestamp }`
- [ ] `PaginatedResponse` fields exactly match `{ data, total, page, limit }`
- [ ] `npx tsc --noEmit` passes with zero errors

---

### TICKET-017 — `features/users` scaffold `[x]`

**Files to create:**
```
src/features/users/
  types/users.types.ts
  api/users.api.ts
  hooks/useUsers.ts
  validations/users.schema.ts
  index.ts
```

**Types** (from backend):
```ts
// User shape (backend SafeUser)
interface User {
  id: number; shop_id: number | null; name: string; email: string;
  role: UserRole; is_active: boolean; created_at: string; updated_at: string;
}

interface UserListParams { page?: number; limit?: number; role?: UserRole; shop_id?: number; search?: string; }
interface CreateShopOwnerInput { shopName: string; shopAddress?: string; ownerName: string; email: string; password: string; }
interface CreateEmployeeInput { name: string; email: string; password: string; }
interface UpdateUserInput { name?: string; email?: string; }
```

**API methods:**
- `list(params?)` → `GET /users`
- `getById(id)` → `GET /users/:id`
- `createShopOwner(data)` → `POST /users/shop-owners`
- `createEmployee(data)` → `POST /users/employees`
- `update(id, data)` → `PATCH /users/:id`
- `deactivate(id)` → `DELETE /users/:id`

**Hook:** `useUsers(params?)` — list query + createShopOwner, createEmployee, update, deactivate mutations with `invalidateQueries`

**Validations:**
- `createShopOwnerSchema` — shopName required, email valid, password min 6
- `createEmployeeSchema` — name required, email valid, password min 6
- `updateUserSchema` — name min 2, email valid (all optional)

**AC:**
- [ ] All types match backend shapes exactly
- [ ] API uses correct HTTP verbs and paths
- [ ] `npx tsc --noEmit` passes

---

### TICKET-018 — `features/shops` scaffold `[x]`

**Files to create:**
```
src/features/shops/
  types/shops.types.ts
  api/shops.api.ts
  hooks/useShops.ts
  validations/shops.schema.ts
  index.ts
```

**Types:**
```ts
enum ShopType { WAREHOUSE = 'WAREHOUSE', SHOP = 'SHOP' }

interface Shop {
  id: number; name: string; address: string | null; phone: string | null;
  type: ShopType; is_active: boolean; created_at: string; updated_at: string;
}

interface UpdateShopInput { name?: string; address?: string; phone?: string; }
interface UpdateShopStatusInput { isActive: boolean; }
```

**API methods:**
- `list()` → `GET /shops`
- `getById(id)` → `GET /shops/:id`
- `update(id, data)` → `PATCH /shops/:id`
- `updateStatus(id, data)` → `PATCH /shops/:id/status`

**Hook:** `useShops()` — list query + update, updateStatus mutations

**AC:**
- [x] `ShopType` enum values match backend exactly
- [x] `npx tsc --noEmit` passes

---

### TICKET-019 — `features/categories` scaffold `[x]`

**Files to create:**
```
src/features/categories/
  types/categories.types.ts
  api/categories.api.ts
  hooks/useCategories.ts
  validations/categories.schema.ts
  index.ts
```

**Types:**
```ts
interface Category { id: number; shop_id: number; name: string; created_at: string; updated_at: string; }
interface CategoryListParams { shopId?: number; }
interface CreateCategoryInput { name: string; }
interface UpdateCategoryInput { name: string; }
```

**API methods:**
- `list(params?)` → `GET /categories`
- `getById(id)` → `GET /categories/:id`
- `create(data, shopId?)` → `POST /categories?shopId=`
- `update(id, data)` → `PATCH /categories/:id`
- `delete(id)` → `DELETE /categories/:id`

**Validation:** `categorySchema` — name 3–100 chars

**AC:**
- [x] `npx tsc --noEmit` passes

---

### TICKET-020 — `features/notifications` scaffold `[x]`

**Files to create:**
```
src/features/notifications/
  types/notifications.types.ts
  api/notifications.api.ts
  hooks/useNotifications.ts
  index.ts
```

**Types:**
```ts
enum NotificationType { LOW_STOCK = 'LOW_STOCK', ORDER_UPDATE = 'ORDER_UPDATE' }

interface Notification {
  id: number; shop_id: number; user_id: number | null; title: string;
  message: string; type: NotificationType; is_read: boolean; created_at: string;
}

interface NotificationListParams { page?: number; limit?: number; isRead?: boolean; }
```

**API methods:**
- `list(params?)` → `GET /notifications`
- `markRead(id)` → `PATCH /notifications/:id/read`
- `markAllRead()` → `PATCH /notifications/read-all`

**Hook:** `useNotifications(params?)` — list query + markRead, markAllRead mutations. Also expose `unreadCount` (derived from list data where `is_read === false`).

**AC:**
- [x] `npx tsc --noEmit` passes

---

### TICKET-021 — `features/audit-logs` scaffold `[x]`

**Files to create:**
```
src/features/audit-logs/
  types/audit-logs.types.ts
  api/audit-logs.api.ts
  hooks/useAuditLogs.ts
  index.ts
```

**Types:**
```ts
interface AuditLog {
  id: number; shop_id: number; user_id: number; type: string; action: string;
  entity_type: string; entity_id: number; quantity: number | null;
  amount: number | null; notes: string | null; created_at: string;
}

interface AuditLogListParams {
  page?: number; limit?: number; shopId?: number; userId?: number;
  type?: string; action?: string; entityType?: string; entityId?: number;
  fromDate?: string; toDate?: string;
}
```

**API methods:**
- `list(params?)` → `GET /audit-logs`
- `getById(id)` → `GET /audit-logs/:id`

**Hook:** `useAuditLogs(params?)` — list query only (read-only feature)

**AC:**
- [x] `npx tsc --noEmit` passes

---

## Phase 3 — Shared UI Components ✅

> These components are used by multiple feature pages. Build them before the pages.

---

### TICKET-022 — `DataTable` component `[x]`

**File:** `src/common/components/DataTable.tsx`

Generic, typed table component used by every list page.

```ts
interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
}
```

**AC:**
- [ ] Shows a skeleton row (3 rows × full width) while `isLoading` is true
- [ ] Shows `emptyMessage` when `data` is empty
- [ ] `render` function, if provided, overrides the default cell value
- [ ] Exported from `src/common/components/index.ts`

---

### TICKET-023 — `Modal` component `[x]`

**File:** `src/common/components/Modal.tsx`

Wrapper around a simple dialog overlay for create/edit forms.

```ts
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
```

**AC:**
- [ ] Renders children in a centered overlay with backdrop
- [ ] Closes on backdrop click and on `onClose` call
- [ ] Traps focus while open (use `dialog` element or `role="dialog"`)
- [ ] Exported from `src/common/components/index.ts`

---

### TICKET-024 — `ConfirmDialog` component `[x]`

**File:** `src/common/components/ConfirmDialog.tsx`

Reusable "are you sure?" dialog used for delete / deactivate actions.

```ts
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;    // default "Confirm"
  isLoading?: boolean;
}
```

**AC:**
- [ ] Confirm button disabled and shows spinner while `isLoading`
- [ ] Cancel calls `onClose`, Confirm calls `onConfirm`
- [ ] Exported from `src/common/components/index.ts`

---

### TICKET-025 — `Badge` component `[x]`

**File:** `src/common/components/Badge.tsx`

```ts
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps { variant?: BadgeVariant; children: React.ReactNode; }
```

Used for: order status, low-stock indicator, user role, shop active/inactive.

**AC:**
- [ ] Each variant maps to a distinct color
- [ ] Exported from `src/common/components/index.ts`

---

### TICKET-026 — `Pagination` component `[x]`

**File:** `src/common/components/Pagination.tsx`

```ts
interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}
```

Shows "Showing X–Y of Z results" and Prev / page numbers / Next buttons.

**AC:**
- [ ] Previous disabled on page 1, Next disabled on last page
- [ ] Calculates total pages from `total / limit`
- [ ] Exported from `src/common/components/index.ts`

---

### TICKET-027 — Toast notification system `[x]`

**File:** `src/common/components/Toast.tsx` + `src/providers/ToastProvider.tsx`

A lightweight toast (success / error / info) shown after mutations.

**AC:**
- [ ] `useToast()` hook exposes `toast.success(msg)`, `toast.error(msg)`
- [ ] Toasts auto-dismiss after 4 s
- [ ] `ToastProvider` added to `src/providers/index.tsx`
- [ ] Exported from `src/common/components/index.ts`

---

## Phase 3.5 — Figma Design Implementation 🎨

> Build every page as a pixel-accurate UI shell using the Figma designs **before** wiring real API data.
> Each page delivers a fully responsive, bilingual (AR/EN) layout that can be filled with live data in the next pass.
> Work order follows the sidebar navigation top-to-bottom.

| ID | Page | Key components | Status |
|----|------|----------------|--------|
| FIGMA-001 | Admin Layout Shell | Sidebar, TopBar, NavDrawer, BottomNav, BottomSheet, i18n | `[x]` |
| FIGMA-002 | Dashboard | 6× KPI cards, consumption trend chart, top-consumed bars, low-stock table, activity feed | `[x]` |
| FIGMA-003 | Products | Data table, category filter, create/edit slide-over | `[ ]` |
| FIGMA-004 | Clients (Shops) | Cards grid + table, status badge, edit drawer | `[ ]` |
| FIGMA-005 | Transfers (نقل المخزون) | Timeline list, new transfer wizard, status stepper | `[ ]` |
| FIGMA-006 | Shortages (نقص المخزون) | Low-stock table, restock request action | `[ ]` |
| FIGMA-007 | Settings | Profile section, preferences, security | `[ ]` |

**Docs:** `docs/features/admin-layout-shell.md` ✅  `docs/features/dashboard.md` ✅ — one doc per page as it completes.

---

## Phase 4 — Dashboard Page (API Integration)

### TICKET-028 — Dashboard stats cards

**File:** `src/app/(dashboard)/dashboard/page.tsx`

Replace the placeholder page with 4 real stat cards fetched from the API.

| Card | API call |
|------|----------|
| Pending Orders | `GET /orders?status=PENDING&limit=1` → use `total` |
| Low-Stock Items | `GET /inventory/low-stock` → count array length |
| Total Products | `GET /products?limit=1` → use `total` |
| Total Users | `GET /users?limit=1` → use `total` (WAREHOUSE_ADMIN only) |

**AC:**
- [ ] Each card shows a number, a label, and a subtle icon/color
- [ ] Cards show a skeleton while loading
- [ ] Total Users card only renders for `WAREHOUSE_ADMIN`
- [ ] Numbers are real — fetched on mount, not hardcoded

---

## Phase 5 — Products Pages

**Depends on:** TICKET-022, TICKET-023, TICKET-024, TICKET-025, TICKET-026, TICKET-027

---

### TICKET-029 — Products list page

**Files:**
```
src/app/(dashboard)/products/page.tsx
src/features/products/components/ProductsTable.tsx
src/features/products/components/ProductFilters.tsx
```

**AC:**
- [ ] Paginated table: columns = Name, Category ID, Price, Source, Active, Actions
- [ ] Filters: `source` (WAREHOUSE / LOCAL) dropdown
- [ ] URL reflects current page: `?page=2`
- [ ] Active badge: green "Active" / red "Inactive" using `Badge`
- [ ] Action column: Edit, Delete buttons (hidden for `EMPLOYEE`)

---

### TICKET-030 — Create product modal

**File:** `src/features/products/components/CreateProductModal.tsx`

**AC:**
- [ ] Form fields: Name, Description (optional), Barcode (optional), Price, Category (dropdown from `GET /categories`)
- [ ] Validated with `createProductSchema`
- [ ] On success: closes modal, shows success toast, invalidates `['products']`
- [ ] `WAREHOUSE_ADMIN` sees a Shop selector; `SHOP_OWNER` does not (uses their own shop)
- [ ] Only `WAREHOUSE_ADMIN` and `SHOP_OWNER` can open this modal

---

### TICKET-031 — Edit product modal

**File:** `src/features/products/components/EditProductModal.tsx`

**AC:**
- [ ] Pre-fills Name, Description, Price from selected product
- [ ] Uses `updateProductSchema`
- [ ] On success: closes modal, success toast, invalidates `['products']`

---

### TICKET-032 — Delete product confirmation

**AC:**
- [ ] Uses `ConfirmDialog`
- [ ] On confirm: calls `DELETE /products/:id` (soft delete)
- [ ] On success: success toast, invalidates `['products']`

---

## Phase 6 — Inventory Pages

**Depends on:** TICKET-022 – TICKET-027

---

### TICKET-033 — Inventory list page

**Files:**
```
src/app/(dashboard)/inventory/page.tsx
src/features/inventory/components/InventoryTable.tsx
```

**AC:**
- [ ] Paginated table: columns = Product ID, Product Name, Current Qty, Low Stock Threshold, Last Updated, Actions
- [ ] Rows with `is_low_stock: true` have a red "Low Stock" `Badge` in the Qty cell
- [ ] Filter toggle: "Show low stock only" checkbox → passes `lowStock=true`
- [ ] Action column: "Stock In" and "Adjust" buttons (hidden for `EMPLOYEE`)

---

### TICKET-034 — Stock-in modal

**File:** `src/features/inventory/components/StockInModal.tsx`

**AC:**
- [ ] Fields: Product ID (number input), Quantity, Notes (optional)
- [ ] Validated with `stockInSchema`
- [ ] On success: toast, invalidates `['inventory']`

---

### TICKET-035 — Adjust inventory modal

**File:** `src/features/inventory/components/AdjustInventoryModal.tsx`

**AC:**
- [ ] Fields: Adjustment (positive or negative integer, cannot be 0), Reason (optional)
- [ ] Validated with `adjustInventorySchema`
- [ ] Shows "Current quantity: X" above the form
- [ ] On success: toast, invalidates `['inventory']`

---

## Phase 7 — Orders Pages

**Depends on:** TICKET-022 – TICKET-027

---

### TICKET-036 — Orders list page

**Files:**
```
src/app/(dashboard)/orders/page.tsx
src/features/orders/components/OrdersTable.tsx
```

**AC:**
- [ ] Paginated table: columns = ID, From Shop, Status, Total Items, Created At, Actions
- [ ] Status filter dropdown (PENDING / PROCESSING / SHIPPED / RECEIVED / COMPLETED)
- [ ] Status column renders a `Badge` with color per status:
  - PENDING → gray, PROCESSING → blue, SHIPPED → yellow, RECEIVED → purple, COMPLETED → green
- [ ] "Create Order" button visible only to `SHOP_OWNER`
- [ ] "View" link navigates to `/orders/:id`

---

### TICKET-037 — Create order modal

**File:** `src/features/orders/components/CreateOrderModal.tsx`

**AC:**
- [ ] Dynamic list of items: each row has a Product ID input + Quantity input
- [ ] "Add item" button appends a new row; "Remove" button deletes a row
- [ ] Validated with `createOrderSchema` (min 1 item, all quantities > 0)
- [ ] Only rendered for `SHOP_OWNER`
- [ ] On success: toast, invalidates `['orders']`

---

### TICKET-038 — Order detail page

**File:** `src/app/(dashboard)/orders/[id]/page.tsx`

**AC:**
- [ ] Shows order header (ID, from/to shop, status, created date)
- [ ] Shows line items table: Product Name, Quantity, Price
- [ ] Shows status history as a simple step indicator (PENDING → PROCESSING → SHIPPED → RECEIVED → COMPLETED), current step highlighted
- [ ] "Advance Status" button visible only to `WAREHOUSE_ADMIN` (calls TICKET-039 inline)

---

### TICKET-039 — Advance order status

**AC:**
- [ ] Button label shows the next status: e.g. "Mark as Processing"
- [ ] Status flow enforced: PENDING → PROCESSING → SHIPPED → RECEIVED → COMPLETED
- [ ] Button hidden once status is COMPLETED
- [ ] On success: toast, re-fetches the order

---

## Phase 8 — Users Pages ✅

**Depends on:** TICKET-022 – TICKET-027

---

### TICKET-040 — Users list page `[x]`

**Files:**
```
src/app/(dashboard)/users/page.tsx
src/features/users/components/UsersTable.tsx
src/features/users/components/UserFilters.tsx
```

**AC:**
- [ ] Paginated table: columns = Name, Email, Role, Shop ID, Active, Created At, Actions
- [ ] Filters: Role dropdown, Search input (debounced 300 ms)
- [ ] Role shown as `Badge`
- [ ] Action column: Edit, Deactivate (hidden for `EMPLOYEE`)
- [ ] Page only accessible to `WAREHOUSE_ADMIN` and `SHOP_OWNER`

---

### TICKET-041 — Create shop owner modal `[x]`

**File:** `src/features/users/components/CreateShopOwnerModal.tsx`

**AC:**
- [ ] Fields: Shop Name, Shop Address (optional), Owner Name, Email, Password
- [ ] Validated with `createShopOwnerSchema`
- [ ] Visible only to `WAREHOUSE_ADMIN`
- [ ] On success: toast, invalidates `['users']`

---

### TICKET-042 — Create employee modal `[x]`

**File:** `src/features/users/components/CreateEmployeeModal.tsx`

**AC:**
- [ ] Fields: Name, Email, Password
- [ ] Validated with `createEmployeeSchema`
- [ ] Visible only to `SHOP_OWNER`
- [ ] On success: toast, invalidates `['users']`

---

### TICKET-043 — Edit user modal `[x]`

**File:** `src/features/users/components/EditUserModal.tsx`

**AC:**
- [ ] Fields: Name, Email (both optional to change)
- [ ] Pre-fills current values
- [ ] On success: toast, invalidates `['users']`

---

### TICKET-044 — Deactivate user confirmation `[x]`

**AC:**
- [ ] Uses `ConfirmDialog`
- [ ] Confirm label: "Deactivate"
- [ ] On confirm: calls `DELETE /users/:id`
- [ ] On success: toast, invalidates `['users']`

---

## Phase 9 — Shops Pages

**Depends on:** TICKET-022 – TICKET-027

---

### TICKET-045 — Shops list page `[x]`

**Files:**
```
src/app/(dashboard)/shops/page.tsx
src/features/shops/components/ShopsTable.tsx
```

**AC:**
- [x] Table: columns = Name, Address, Phone, Type, Active, Actions
- [x] Type badge: WAREHOUSE → blue, SHOP → gray
- [x] Active badge: green / red
- [x] Edit button visible to `WAREHOUSE_ADMIN` and `SHOP_OWNER`
- [x] Toggle Status button visible to `WAREHOUSE_ADMIN` only

---

### TICKET-046 — Edit shop modal `[x]`

**File:** `src/features/shops/components/EditShopModal.tsx`

**AC:**
- [x] Fields: Name, Address, Phone (all optional)
- [x] Pre-fills current values
- [x] On success: toast, invalidates `['shops']`

---

### TICKET-047 — Toggle shop status `[x]`

**AC:**
- [x] Uses `ConfirmDialog`
- [x] Message: "Deactivate [Shop Name]?" or "Activate [Shop Name]?"
- [x] Calls `PATCH /shops/:id/status` with `{ isActive: !current }`
- [x] On success: toast, invalidates `['shops']`

---

## Phase 10 — Categories Pages

**Depends on:** TICKET-022 – TICKET-027

---

### TICKET-048 — Categories page (full CRUD inline)

**Files:**
```
src/app/(dashboard)/categories/page.tsx
src/features/categories/components/CategoriesTable.tsx
src/features/categories/components/CategoryModal.tsx
```

**AC:**
- [ ] Table: columns = Name, Shop ID, Created At, Actions
- [ ] Create / Edit share one `CategoryModal` (title changes based on mode)
- [ ] Delete uses `ConfirmDialog`
- [ ] Create / Edit / Delete hidden for `EMPLOYEE`
- [ ] On any mutation success: toast, invalidates `['categories']`

---

## Phase 11 — Notifications Pages

**Depends on:** TICKET-022 – TICKET-027

---

### TICKET-049 — Notifications list page

**Files:**
```
src/app/(dashboard)/notifications/page.tsx
src/features/notifications/components/NotificationsTable.tsx
```

**AC:**
- [ ] Paginated list: columns = Title, Message, Type, Read, Created At, Actions
- [ ] Unread rows visually highlighted (e.g. bold text or blue left border)
- [ ] Filter: All / Unread / Read tabs
- [ ] "Mark all as read" button at top right
- [ ] Each row has "Mark as read" action (hidden if already read)

---

### TICKET-050 — Notification badge in Navbar

**File:** `src/common/layout/Navbar.tsx`

**AC:**
- [ ] Bell icon in Navbar fetches `GET /notifications?isRead=false&limit=1` on mount
- [ ] Shows a red dot/count badge when `total > 0`
- [ ] Clicking navigates to `/notifications`
- [ ] Badge disappears after all notifications are read

---

## Phase 12 — Audit Logs Page

**Depends on:** TICKET-022, TICKET-025, TICKET-026

---

### TICKET-051 — Audit logs page

**Files:**
```
src/app/(dashboard)/audit-logs/page.tsx
src/features/audit-logs/components/AuditLogsTable.tsx
src/features/audit-logs/components/AuditLogFilters.tsx
```

**AC:**
- [ ] Paginated table: columns = Type, Action, Entity Type, Entity ID, Quantity, Notes, Created At
- [ ] Filter panel: Type, Action, Entity Type, Shop (WAREHOUSE_ADMIN), Date range (from/to)
- [ ] Read-only — no action column
- [ ] Filters serialize to URL query params so they survive refresh

---

## Phase 13 — Role-Based UI

---

### TICKET-052 — Role-based sidebar navigation

**File:** `src/common/layout/Sidebar.tsx`

**AC:**
- [ ] Reads `user.role` from `useAuth()`
- [ ] Nav items visible by role:

| Route | WAREHOUSE_ADMIN | SHOP_OWNER | EMPLOYEE |
|-------|:-:|:-:|:-:|
| Dashboard | ✓ | ✓ | ✓ |
| Inventory | ✓ | ✓ | ✓ |
| Orders | ✓ | ✓ | ✓ |
| Products | ✓ | ✓ | ✓ |
| Categories | ✓ | ✓ | — |
| Shops | ✓ | ✓ | — |
| Users | ✓ | ✓ | — |
| Audit Logs | ✓ | ✓ | ✓ |
| Notifications | ✓ | ✓ | ✓ |

- [ ] Active link is visually highlighted (current route)

---

### TICKET-053 — Improve `usePermission` hook

**File:** `src/common/hooks/usePermission.ts`

**AC:**
- [ ] Add `isWarehouseAdmin`, `isShopOwner`, `isEmployee` boolean shortcuts
- [ ] Add `hasMinRole(role)` that returns true if the user's role is >= the required role
  (hierarchy: `WAREHOUSE_ADMIN` > `SHOP_OWNER` > `EMPLOYEE`)
- [ ] Add `canCreate`, `canEdit`, `canDelete` helpers (false for `EMPLOYEE`)
- [ ] All existing callsites still work (no breaking changes)

---

## Phase 14 — Polish

---

### TICKET-054 — Loading skeletons for all list pages

Apply to: Products, Inventory, Orders, Users, Shops, Categories, Notifications, Audit Logs

**AC:**
- [ ] Each list page shows a skeleton table (5 rows, pulsing gray blocks) while `isLoading`
- [ ] Skeleton matches the column count of the real table

---

### TICKET-055 — Empty states for all list pages

**AC:**
- [ ] When a list is empty (not loading, not error), show a centered message with an icon:
  - Generic: "No [items] found"
  - With active filters: "No results match your filters. Try clearing them."
- [ ] "Clear filters" link resets all filter state

---

### TICKET-056 — Global error boundary + custom 404/403 pages

**Files:**
- `src/app/error.tsx` — Next.js error boundary
- `src/app/not-found.tsx` — already exists, improve it
- `src/app/(dashboard)/unauthorized/page.tsx` — shown when role check fails

**AC:**
- [ ] `error.tsx` catches unexpected errors and shows a "Something went wrong" page with a Retry button
- [ ] `not-found.tsx` has a "Go to Dashboard" link
- [ ] Feature pages that require a specific role redirect to `/unauthorized` instead of silently hiding content

---

## Summary Table

| Phase | Tickets | Deliverable |
|-------|---------|-------------|
| 0 | 001–008 | ✅ Infrastructure |
| 1 | 009–015 | ✅ Auth layer |
| 2 | 016–021 | ✅ Feature scaffolds (types, API, hooks) |
| 3 | 022–027 | ✅ Shared UI components (DataTable, Modal, Badge, Pagination, Toast) |
| 3.5 | FIGMA-001–007 | 🔄 Figma UI shells — layout shell ✅, dashboard ✅, pages ⬜ |
| 4 | 028 | Dashboard (API integration) |
| 5 | 029–032 | Products CRUD |
| 6 | 033–035 | Inventory management |
| 7 | 036–039 | Orders lifecycle |
| 8 | 040–044 | ✅ Users management |
| 9 | 045–047 | ✅ Shops management |
| 10 | 048 | Categories CRUD |
| 11 | 049–050 | Notifications |
| 12 | 051 | Audit logs |
| 13 | 052–053 | Role-based UI |
| 14 | 054–056 | Polish (skeletons, empty states, error pages) |

**Total: 63 tickets** (56 original + 7 Figma) — 24 done, 39 remaining.
