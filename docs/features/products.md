# Feature: Products Admin Page (FIGMA-003 + Phase 5 API Integration)

**Status**: API Integrated — Known gaps documented below  
**Created Date**: 2026-06-11  
**Last Updated**: 2026-06-14  
**Assignee**: Melad Adera  
**Tickets**: FIGMA-003, TICKET-029, TICKET-030, TICKET-031, TICKET-032

---

## 📋 Overview

### Purpose
The Products admin page (`/products`) is the primary interface for warehouse managers to view, search, filter, and manage the product catalogue. It provides full CRUD operations through modal dialogs. All data is fetched from the real backend API — mock data is no longer used.

### Business Value
- Single-screen product management: create, view detail, edit, restock, delete
- Live `current_quantity` fetched per-product when the detail modal opens
- Source filter (WAREHOUSE / LOCAL) via `GET /products?source=`
- Category filter via `GET /products?category_name=` — dropdown populated from live categories
- Bilingual (AR/EN) with full RTL/LTR layout support

---

## 🏗️ Architecture

### File Structure

```
src/features/products/
├── api/
│   └── products.api.ts              # Typed API methods — list, getById, create, update, delete
├── components/
│   ├── ProductThumb.tsx             # Coloured square + package icon
│   ├── StatusBadge.tsx              # Active / Inactive dot + label pill
│   ├── ProductsTableCard.tsx        # Table card: toolbar + CSS grid + skeleton + pagination
│   ├── ProductFormModal.tsx         # Add / Edit modal (react-hook-form + zod)
│   ├── ProductDetailModal.tsx       # View-only modal; fetches GET /products/:id for current_quantity
│   ├── RestockModal.tsx             # Qty stepper → POST /inventory/stock-in
│   └── DeleteConfirmModal.tsx       # Danger confirm → DELETE /products/:id
├── hooks/
│   ├── useProducts(params?)         # List query + create / update / delete mutations
│   └── useProduct(id)              # Single product query (GET /products/:id) — enables/disables by id
├── mock/
│   └── productsData.ts              # Legacy mock — no longer used by the page
├── types/
│   └── products.types.ts            # Product, ProductDetail, ProductSource, StockStatus,
│                                    # ProductListParams, CreateProductInput, UpdateProductInput
├── validations/
│   └── products.schema.ts           # createProductSchema, updateProductSchema, productFormSchema
└── index.ts                         # Barrel export

src/app/(dashboard)/products/page.tsx   # Page — params state, modal routing, CRUD handlers
src/i18n/en/products.json               # English translations
src/i18n/ar/products.json               # Arabic translations
```

---

## 🔌 API Integration

### Endpoints Used

| Action | Method | Path | Hook |
|--------|--------|------|------|
| List products | GET | `/products` | `useProducts(params)` |
| Product detail + qty | GET | `/products/:id` | `useProduct(id)` |
| Create product | POST | `/products` | `useProducts().createProduct` |
| Update product | PATCH | `/products/:id` | `useProducts().updateProduct` |
| Soft-delete product | DELETE | `/products/:id` | `useProducts().deleteProduct` |
| Add stock | POST | `/inventory/stock-in` | `inventoryApi.stockIn` (direct) |
| Category dropdown | GET | `/categories` (+ `?shopId=X` for WAREHOUSE_ADMIN) | `useCategories({ shopId? })` |

### Supported Query Params (`GET /products`)

| Param | Type | Notes |
|-------|------|-------|
| `page` | number | Default 1 |
| `limit` | number | Default 10, max 100 |
| `source` | `WAREHOUSE \| LOCAL` | Exposed in toolbar dropdown |
| `category_name` | string | Case-insensitive substring — exposed in toolbar category dropdown |
| `shop_id` | number | Admin only |
| `is_active` | boolean | `false` includes soft-deleted — not yet in toolbar UI |
| `stock_status` | `OUT_OF_STOCK \| LOW_STOCK \| HIGH_STOCK` | Not yet in toolbar UI |

> **Note:** The backend does NOT support a `search` (name/barcode) param for `GET /products`. The current search input in the toolbar sends a param the backend ignores — this is a known gap (see below).

---

## 🧩 Type Reference

### `Product` (list response)
```ts
interface Product {
  id: number;
  shop_id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string | null;
  barcode: string | null;
  price: string;           // Backend returns string — use Number(price) to format
  source: ProductSource;   // 'WAREHOUSE' | 'LOCAL'
  is_global: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### `ProductDetail` (single GET /products/:id response)
```ts
interface ProductDetail extends Product {
  current_quantity: number;  // 0 if no inventory record exists yet
}
```

### `ProductListParams`
```ts
interface ProductListParams {
  page?: number;
  limit?: number;
  source?: ProductSource;
  category_name?: string;
  shop_id?: number;
  is_active?: boolean;
  stock_status?: StockStatus;
  search?: string;           // Ignored by backend — here for future use
}
```

---

## 🔧 State & Data Flow

```
page.tsx
  │
  ├── useProducts({ page, limit, search, source, category_name })  ← list + mutations
  ├── useCategories({ shopId? })     ← toolbar category filter + ProductFormModal dropdown
  │     WAREHOUSE_ADMIN: shopId from authStore → GET /categories?shopId=X
  ├── search / sourceFilter / categoryFilter / page  ← useState; all three reset page to 1
  └── modal: ModalState             ← 'none' | 'add' | 'edit' | 'view' | 'restock' | 'delete'

ProductDetailModal
  └── useProduct(product.id)        ← fires GET /products/:id when modal opens
                                       shows skeleton shimmer on current_quantity row while loading
```

### `useProducts` Return Shape
```ts
{
  products: Product[];        // listQuery.data?.data?.data ?? []
  total: number;              // listQuery.data?.data?.total ?? 0
  isLoading: boolean;
  error: unknown;
  createProduct(args): Promise<void>;
  isCreating: boolean;
  updateProduct(args): Promise<void>;
  isUpdating: boolean;
  deleteProduct(id): Promise<void>;
  isDeleting: boolean;
}
```

### `useProduct(id)` — Detail Hook
```ts
// Enabled only when id !== null (i.e. modal is open)
useProduct(open && product ? product.id : null)
// Returns ApiResponse<ProductDetail> — unwrap with .data
```

---

## 🧩 Component Reference

### `ProductDetailModal`
- Receives a `Product` (from list) — uses it immediately for all fields
- In parallel, fires `useProduct(id)` to fetch `current_quantity`
- The `current_quantity` row shows a shimmer skeleton while loading; renders the value once resolved
- If the product has no inventory record yet, backend returns `current_quantity: 0`

### `ProductFormModal`
- `mode: 'add' | 'edit'` controls title and pre-fill
- Edit pre-fills: `name`, `description`, `barcode`, `price` (converted `Number(price)`), `category_id`
- `price` uses `{ valueAsNumber: true }` on the input — form value is `number`, stored as `string` in backend
- Category dropdown populated from `useCategories()`

### `RestockModal`
- Stepper (+/-) with manual input (min 1)
- On confirm → calls `inventoryApi.stockIn({ productId, quantity })` directly (no mutation hook)

### `DeleteConfirmModal`
- Backdrop click intentionally disabled — user must choose Delete or Cancel

---

## ⚠️ Known Gaps

| Gap | Location | Impact | Fix Ticket |
|-----|----------|--------|------------|
| Search field ignored by backend | Toolbar → `ProductListParams.search` | Typing in search has no effect | Need backend `search` param |
| Edit form only sends `{name, description, price}` | `ProductFormModal.tsx:74` | Barcode and category changes on edit are not saved | Fix `onSubmit` to include `barcode` and `category_id` |
| No error feedback on failed mutations | `page.tsx` handlers | Silent failure on API errors | Add toast on mutation `.catch()` |
| `is_active`, `stock_status` filters not in UI | `ProductListParams` has them, toolbar doesn't | Advanced filtering not accessible | Add filter controls to toolbar |

---

## 📱 Responsive Behaviour

| Breakpoint | Table header | Data rows | Modals |
|------------|-------------|-----------|--------|
| Mobile `<md` | Hidden | Stacked card (flex-col) | Slide up from bottom (rounded-t-2xl) |
| Tablet/Desktop `≥md` | CSS grid 8-col | CSS grid 8-col | Centred overlay |

---

## 🌐 i18n Keys

Both `src/i18n/en/products.json` and `src/i18n/ar/products.json` cover:

```
products.page.{title, count, addProduct}
products.toolbar.{searchPlaceholder, allCategories, allSources, allStatuses, export, sources.*, statuses.*}
products.table.{num, product, barcode, category, price, source, status, actions}
products.emptyState.{title, sub, addProduct}
products.pagination.{showing}
products.form.{addTitle, editTitle, save, cancel, name, namePlaceholder, barcode,
               barcodePlaceholder, category, categoryPlaceholder, description,
               price, pricePlaceholder, errName, errPrice, errCategory}
products.detail.{title, currentQty, price, source, barcode, category, description, createdAt}
products.restock.{title, qtyLabel, addStock, cancel}
products.delete.{title, warning, delete, cancel}
```

---

## ✅ Acceptance Criteria

- [x] Table renders live products from `GET /products` with correct columns
- [x] Source filter (WAREHOUSE / LOCAL) passes `source` param to API
- [x] Category filter dropdown passes `category_name` param to API; resets page to 1 on change
- [x] Pagination: page/limit sent to API; total from response drives page count
- [x] Skeleton shimmer shows while `isLoading`
- [x] Empty state shown when `products.length === 0`
- [x] Row numbers correct across pages (startIndex offset)
- [x] Add modal creates product via `POST /products`; invalidates query on success
- [x] Edit modal pre-fills; submits via `PATCH /products/:id`
- [x] Detail modal fetches `GET /products/:id`; shows `current_quantity` with loading skeleton
- [x] Restock calls `POST /inventory/stock-in`
- [x] Delete calls `DELETE /products/:id`; invalidates query on success
- [x] Category dropdown populated from `GET /categories`; WAREHOUSE_ADMIN passes `?shopId=X` from auth store
- [x] All text switches AR ↔ EN on locale toggle
- [x] `npx tsc --noEmit` passes with zero errors
- [ ] Search field works against backend (backend gap)
- [ ] Edit saves barcode + category changes
- [ ] Error feedback on failed mutations

---

## 🔗 Related

- Categories feature: `src/features/categories/` — `useCategories` hook
- Inventory feature: `src/features/inventory/api/inventory.api.ts` — `stockIn` method
- Backend API docs: `http://localhost:3001/api` (Swagger)
- Roadmap tickets: TICKET-029 through TICKET-032
