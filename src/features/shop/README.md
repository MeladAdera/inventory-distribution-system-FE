# Shop (Client Portal) Feature

All pages and logic for the client-facing portal used by `SHOP_OWNER` and `EMPLOYEE` roles. Lives under the `/client/*` route group.

## Structure

```
shop/
├── components/
│   ├── ClientDashboardPage.tsx       # Dashboard with KPIs and low-stock summary
│   ├── ClientInventoryPage.tsx       # View and update shelf quantities
│   ├── ClientOrderPage.tsx           # Build and submit a new order
│   ├── ClientOrdersPage.tsx          # Order history with status filter
│   ├── ClientEmployeesPage.tsx       # Employee list with create/edit/deactivate
│   ├── inventory/
│   │   ├── CategoryCard.tsx
│   │   ├── ProductCard.tsx
│   │   ├── InventorySaveModal.tsx
│   │   └── InvStatusBadge.tsx
│   ├── order/
│   │   ├── OrderCategoryCard.tsx
│   │   ├── OrderProductCard.tsx
│   │   ├── OrderReviewPanel.tsx
│   │   ├── OrderSubmitModal.tsx
│   │   └── OrderSummaryPanel.tsx
│   ├── orders/
│   │   ├── OrdersTableCard.tsx       # Desktop table + mobile cards + status filter
│   │   ├── OrderDetailModal.tsx      # Order detail with confirm received / cancel
│   │   └── OrderStatusBadge.tsx
│   └── employees/
│       └── EmployeesTableCard.tsx    # Desktop table + mobile cards + actions
├── hooks/
│   ├── useClientInventory.ts
│   ├── useClientOrderProducts.ts
│   └── useClientOrders.ts
├── types/
│   ├── clientInventory.types.ts
│   ├── clientOrderProducts.types.ts
│   └── clientOrders.types.ts
└── validations/
```

## Pages

### Employees — `ClientEmployeesPage`

Lists all `EMPLOYEE` users belonging to the current shop. Shop owners can create, edit name/email, and deactivate employees.

**Hook:** `useUsers({ role: UserRole.EMPLOYEE })` from `@/features/admin/users/hooks/useUsers`

**Modals reused from admin/users:**
- `CreateEmployeeModal` — `POST /users/employees`
- `EditUserModal` — `PATCH /users/:id`
- `DeactivateUserDialog` — `DELETE /users/:id`

**Permissions:** Edit/deactivate actions are only available to `SHOP_OWNER`. Employees can view the list but cannot modify it (gate with `isShopOwner` from `usePermission`).

### Settings — `/client/settings`

Reuses `ProfileCard` and `ShopCard` from `@/features/settings`. See [settings README](../settings/README.md).

## Route → Page mapping

| Route | Component |
|-------|-----------|
| `/client/dashboard` | `ClientDashboardPage` |
| `/client/inventory` | `ClientInventoryPage` |
| `/client/order` | `ClientOrderPage` |
| `/client/orders` | `ClientOrdersPage` |
| `/client/employees` | `ClientEmployeesPage` |
| `/client/settings` | `ProfileCard` + `ShopCard` (from settings feature) |

## Middleware & Role Access

Defined in `src/middleware.ts`:

| Role | After login | Admin routes | Client routes |
|------|-------------|--------------|---------------|
| `WAREHOUSE_ADMIN` | `/dashboard` | ✅ allowed | ❌ → `/dashboard` |
| `SHOP_OWNER` | `/client/dashboard` | ❌ → `/client/dashboard` | ✅ allowed |
| `EMPLOYEE` | `/client/dashboard` | ❌ → `/client/dashboard` | ✅ allowed |

## i18n

All client portal strings live in `src/i18n/en/client.json` and `src/i18n/ar/client.json` under namespaced keys:
- `client.nav.*` — sidebar and bottom nav labels
- `client.inventory.*` — inventory page
- `client.orders.*` — orders list and detail
- `client.order.*` — new order flow
- `client.employees.*` — employees page
- `client.dashboard.*` — dashboard page
