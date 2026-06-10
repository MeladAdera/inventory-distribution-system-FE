# Categories Feature

Manage product categories scoped to a shop.

## Structure

```
categories/
├── api/
│   └── categories.api.ts         # API calls
├── components/                   # Feature components (added in TICKET-048)
├── hooks/
│   └── useCategories.ts          # List query + create/update/delete mutations
├── types/
│   └── categories.types.ts       # Category, CategoryListParams, CreateCategoryInput, UpdateCategoryInput
├── validations/
│   └── categories.schema.ts      # categorySchema — name 3–100 chars
└── index.ts                      # Barrel exports
```

## Key Types

- `Category` — category object; always belongs to a `shop_id`
- `CreateCategoryInput` / `UpdateCategoryInput` — both only carry `name`

## API Methods

| Method | HTTP | Path |
|--------|------|------|
| `list(params?)` | GET | `/categories` |
| `getById(id)` | GET | `/categories/:id` |
| `create(data, shopId?)` | POST | `/categories?shopId=` |
| `update(id, data)` | PATCH | `/categories/:id` |
| `delete(id)` | DELETE | `/categories/:id` |

## Notes

- `create` passes `shopId` as a **query param**, not in the body — the body only carries `{ name }`
- One `categorySchema` covers both create and update (same fields)

## Usage

```typescript
import { useCategories } from '@/features/categories';

const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useCategories({ shopId: 1 });
```
