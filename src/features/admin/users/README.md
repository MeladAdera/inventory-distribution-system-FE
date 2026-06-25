# Users Feature (Admin)

Manage system users — shop owners and employees. Used by the admin portal and partially reused by the client portal's employees page.

## Structure

```
users/
├── api/
│   └── users.api.ts              # API calls
├── components/
│   ├── UsersTable.tsx            # Table with role/shop/status badges, edit + deactivate actions
│   ├── CreateEmployeeModal.tsx   # POST /users/employees
│   ├── CreateShopOwnerModal.tsx  # POST /users/shop-owners (creates shop + owner in one call)
│   ├── EditUserModal.tsx         # PATCH /users/:id (name, email)
│   └── DeactivateUserDialog.tsx  # DELETE /users/:id (soft-deactivate)
├── hooks/
│   └── useUsers.ts               # List query + createShopOwner, createEmployee, updateUser, deactivateUser mutations
├── types/
│   └── users.types.ts            # User, UserListParams, CreateShopOwnerInput, CreateEmployeeInput, UpdateUserInput
├── validations/
│   └── users.schema.ts           # Zod schemas
└── index.ts                      # Barrel exports
```

## Key Types

- `User` — full user object including `shop_id`, `shop_name`, `role`, `is_active`
- `CreateEmployeeInput` — `{ name, email, password }` — shop is inferred from the caller's account
- `CreateShopOwnerInput` — `{ shopName, shopAddress?, ownerName, email, password }`
- `UpdateUserInput` — `{ name?, email? }`

## API Methods

| Method | HTTP | Path | Roles |
|--------|------|------|-------|
| `list(params?)` | GET | `/users` | `WAREHOUSE_ADMIN`, `SHOP_OWNER` |
| `getById(id)` | GET | `/users/:id` | `WAREHOUSE_ADMIN`, `SHOP_OWNER` |
| `createShopOwner(data)` | POST | `/users/shop-owners` | `WAREHOUSE_ADMIN` |
| `createEmployee(data)` | POST | `/users/employees` | `SHOP_OWNER` |
| `update(id, data)` | PATCH | `/users/:id` | `WAREHOUSE_ADMIN`, `SHOP_OWNER` |
| `deactivate(id)` | DELETE | `/users/:id` | `WAREHOUSE_ADMIN`, `SHOP_OWNER` |

## Query Params (`list`)

| Param | Description |
|-------|-------------|
| `role` | Filter by `WAREHOUSE_ADMIN`, `SHOP_OWNER`, `EMPLOYEE` |
| `shop_id` | Admin only — filter by shop |
| `search` | Search by name or email |
| `page` / `limit` | Pagination |

## Permissions

| Action | Roles |
|--------|-------|
| Create shop owner | `WAREHOUSE_ADMIN` |
| Create employee | `SHOP_OWNER` |
| Edit user | `WAREHOUSE_ADMIN`, `SHOP_OWNER` |
| Deactivate user | `WAREHOUSE_ADMIN`, `SHOP_OWNER` |

## Reuse in Client Portal

`CreateEmployeeModal`, `EditUserModal`, and `DeactivateUserDialog` are reused as-is in the client portal's employees page (`src/features/shop/components/ClientEmployeesPage.tsx`). They read from `t.users.*` i18n keys which are shared between both portals.

```typescript
// Client portal employees page
import { useUsers } from '@/features/admin/users/hooks/useUsers';
import { CreateEmployeeModal } from '@/features/admin/users/components/CreateEmployeeModal';

const { users, isLoading } = useUsers({ role: UserRole.EMPLOYEE });
```

## i18n

Keys live in `src/i18n/en/users.json` and `src/i18n/ar/users.json`:
- `users.createEmployee.*`
- `users.editUser.*`
- `users.deactivateUser.*`
- `users.table.*`
- `users.roles.*`
