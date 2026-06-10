# Shops Feature

Manage shops (warehouses and retail branches), their details, and active status.

## Structure

```
shops/
├── api/
│   └── shops.api.ts              # API calls
├── components/
│   ├── ShopsTable.tsx            # Table with Type + Active badges, role-gated actions
│   ├── EditShopModal.tsx         # Edit name / address / phone
│   └── ToggleShopStatusDialog.tsx # Activate / Deactivate confirm dialog
├── hooks/
│   └── useShops.ts               # List query + update + updateStatus mutations
├── types/
│   └── shops.types.ts            # Shop, ShopType, UpdateShopInput, UpdateShopStatusInput
├── validations/
│   └── shops.schema.ts           # Zod schemas: updateShopSchema, updateShopStatusSchema
└── index.ts                      # Barrel exports
```

## Key Types

- `Shop` — full shop object returned by the backend
- `ShopType` — `WAREHOUSE` | `SHOP`
- `UpdateShopInput` — optional name, address, phone
- `UpdateShopStatusInput` — `{ isActive: boolean }`

## API Methods

| Method | HTTP | Path |
|--------|------|------|
| `list(params?)` | GET | `/shops` |
| `getById(id)` | GET | `/shops/:id` |
| `update(id, data)` | PATCH | `/shops/:id` |
| `updateStatus(id, data)` | PATCH | `/shops/:id/status` |

## Permissions

| Action | Roles |
|--------|-------|
| View list | `WAREHOUSE_ADMIN`, `SHOP_OWNER` |
| Edit shop | `WAREHOUSE_ADMIN`, `SHOP_OWNER` |
| Toggle status | `WAREHOUSE_ADMIN` only |

## Notes

- The backend returns `type: "SHOP"` (not `"RETAIL"`) for non-warehouse shops — `ShopType.SHOP = 'SHOP'`
- The list endpoint returns `{ success, data: Shop[] }` — no pagination wrapper; `total` is absent

## Usage

```typescript
import { useShops, ShopType } from '@/features/shops';

const { shops, isLoading, updateShop, updateShopStatus } = useShops({ page: 1, limit: 10 });
```
