# Feature: Products Admin Page (FIGMA-003 + Phase 5 API Integration)

**Status**: API Integrated — Known gaps documented below  
**Created Date**: 2026-06-11  
**Last Updated**: 2026-06-20  
**Assignee**: Melad Adera  
**Tickets**: FIGMA-003, TICKET-029, TICKET-030, TICKET-031, TICKET-032

---

## 📋 Overview

### Purpose
The Products admin page (`/products`) is the primary interface for warehouse managers to view, search, filter, and manage the product catalogue. It provides full CRUD operations through modal dialogs. All data is fetched from the real backend API — mock data is no longer used.

### Business Value
- Single-screen product management: create, view detail, edit, restock, delete
- Live `current_quantity` fetched per-product when the detail modal opens
- Shop name filter (admin only) via `GET /products?shop_name=` — dropdown populated from live shops
- Category filter via `GET /products?category_name=` — dropdown populated from live categories
- Source column (WAREHOUSE / LOCAL) displayed in the table row — set automatically by the backend
- Bilingual (AR/EN) with full RTL/LTR layout support

---

## 🏗️ Architecture

### File Structure

```
src/features/products/
├── api/
│   └── products.api.ts              # Typed API methods — list, getById, create, update, delete,
│                                    # uploadImage, deleteImage
├── components/
│   ├── ProductThumb.tsx             # Shows product image if imageUrl prop set; falls back to colour+icon
│   ├── StatusBadge.tsx              # Active / Inactive dot + label pill
│   ├── ProductsTableCard.tsx        # Table card: toolbar + CSS grid + skeleton + pagination
│   ├── ProductFormModal.tsx         # Add / Edit modal (react-hook-form + zod + image upload zone)
│   ├── ProductDetailModal.tsx       # View-only modal; fetches GET /products/:id for current_quantity
│   ├── RestockModal.tsx             # Qty stepper → POST /inventory/stock-in
│   └── DeleteConfirmModal.tsx       # Danger confirm → DELETE /products/:id
├── hooks/
│   ├── useProducts(params?)         # List query + create / update / delete /
│   │                                # uploadProductImage / deleteProductImage mutations
│   └── useProduct(id)              # Single product query (GET /products/:id) — enables/disables by id
├── mock/
│   └── productsData.ts              # Legacy mock — no longer used by the page
├── types/
│   └── products.types.ts            # Product, ProductDetail, ProductSource, StockStatus,
│                                    # ProductListParams, CreateProductInput, UpdateProductInput
├── validations/
│   └── products.schema.ts           # createProductSchema, updateProductSchema, productFormSchema
└── index.ts                         # Barrel export

src/app/(dashboard)/products/page.tsx   # Page — params state, modal routing, CRUD + image handlers
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
| Upload product image | PATCH | `/products/:id/image` | `useProducts().uploadProductImage` |
| Delete product image | DELETE | `/products/:id/image` | `useProducts().deleteProductImage` |
| Add stock | POST | `/inventory/stock-in` | `inventoryApi.stockIn` (direct) |
| Category dropdown | GET | `/categories` (+ `?shopId=X` for WAREHOUSE_ADMIN) | `useCategories({ shopId? })` |

### Supported Query Params (`GET /products`)

| Param | Type | Notes |
|-------|------|-------|
| `page` | number | Default 1 |
| `limit` | number | Default 10, max 100 |
| `source` | `WAREHOUSE \| LOCAL` | Not in toolbar UI — set automatically by backend on create |
| `category_name` | string | Case-insensitive substring — exposed in toolbar category dropdown |
| `shop_name` | string | Admin only — exposed in toolbar shop dropdown (`WAREHOUSE_ADMIN` role) |
| `shop_id` | number | Admin only — silently ignored for `SHOP_OWNER` / `EMPLOYEE` |
| `is_active` | boolean | `false` includes soft-deleted — not yet in toolbar UI |
| `stock_status` | `OUT_OF_STOCK \| LOW_STOCK \| HIGH_STOCK` | Not yet in toolbar UI |

> **Note:** `shop_name`, `shop_id`, and `is_active` are silently ignored by the backend for non-admin roles. The shop filter dropdown is only rendered for `WAREHOUSE_ADMIN`.

> **Note:** The backend does NOT support a `search` (name/barcode) param for `GET /products`. The current search input in the toolbar sends a param the backend ignores — this is a known gap (see below).

**Filter examples (admin):**
```
GET /products?shop_name=melad                          → all products belonging to Melad Market
GET /products?shop_name=melad&source=LOCAL             → only products Melad Market created itself
GET /products?shop_name=melad&source=WAREHOUSE         → only warehouse products visible to Melad Market
GET /products?source=LOCAL                             → all shop-created products across all shops
GET /products?stock_status=LOW_STOCK&shop_name=melad   → low-stock items in Melad Market
```

---

## 🧩 Type Reference

### `Product` (list response)
```ts
interface Product {
  id: number;
  shop_id: number;
  shop_name: string;       // Name of the shop that owns this product
  category_id: number;
  category_name: string;
  name: string;
  description: string | null;
  barcode: string | null;
  price: string;           // Backend returns string — use Number(price) to format
  source: ProductSource;   // 'WAREHOUSE' | 'LOCAL' — set by backend, cannot be set manually
  is_global: boolean;
  is_active: boolean;
  image_url: string | null; // e.g. "/uploads/products/uuid.jpg" — prepend NEXT_PUBLIC_API_URL for full URL
  created_at: string;
  updated_at: string;
}
```

> **`source` values:** `WAREHOUSE` — product created by the warehouse admin, visible to all shops. `LOCAL` — product created by a specific shop, visible only to that shop. The `source` is set automatically by the backend based on who creates the product.

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
  shop_name?: string;        // Admin only — toolbar shop dropdown
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
  ├── useProducts({ page, limit, search, shop_name, category_name })  ← list + mutations
  ├── useCategories({ shopId? })     ← toolbar category filter + ProductFormModal dropdown
  │     WAREHOUSE_ADMIN: shopId from authStore → GET /categories?shopId=X
  ├── useShops({ type: 'SHOP', limit: 999 })  ← admin-only; populates shop name dropdown
  │     only called when isAdmin === true (WAREHOUSE_ADMIN role)
  ├── search / shopNameFilter / categoryFilter / page  ← useState; all three reset page to 1
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
  createProduct(args): Promise<ApiResponse<Product>>;  // returns created product (id used for image upload)
  isCreating: boolean;
  updateProduct(args): Promise<void>;
  isUpdating: boolean;
  deleteProduct(id): Promise<void>;
  isDeleting: boolean;
  uploadProductImage({ id, file }): Promise<void>;     // PATCH /products/:id/image
  isUploadingImage: boolean;
  deleteProductImage(id): Promise<void>;               // DELETE /products/:id/image
  isDeletingImage: boolean;
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
- Image upload zone at the top of the form — see **Image Upload** section below

### `ProductThumb`
- Accepts optional `imageUrl?: string | null` prop
- When set: renders `<img>` fitted to the container; relative paths (starting with `/uploads/`) are prefixed with `NEXT_PUBLIC_API_URL`; blob object URLs are used as-is for previews
- When not set: renders the colour-coded square + Package icon fallback (colour derived from `id % palette.length`)

### `RestockModal`
- Stepper (+/-) with manual input (min 1)
- On confirm → calls `inventoryApi.stockIn({ productId, quantity })` directly (no mutation hook)

### `DeleteConfirmModal`
- Backdrop click intentionally disabled — user must choose Delete or Cancel

---

## 🖼️ Image Upload

### Overview
Each product can have one image stored server-side under `uploads/products/`. The image is optional — products without an image fall back to the colour-coded `ProductThumb` placeholder.

### Backend endpoints
| Method | Path | Payload | Returns |
|--------|------|---------|---------|
| `PATCH` | `/products/:id/image` | `multipart/form-data`, field name `image` | `{ image_url: "/uploads/products/uuid.jpg" }` |
| `DELETE` | `/products/:id/image` | — | updated product (or `204`) |

### Frontend flow — Edit mode
1. User opens the Edit modal → the existing `product.image_url` is shown in the upload zone via `ProductThumb`
2. **Upload:** user clicks the zone (or the camera overlay on hover) → file picker opens → on file select, `PATCH /products/:id/image` fires immediately (no need to hit Save) → the blob preview replaces the old image instantly
3. **Remove:** user clicks the red trash icon → image disappears immediately (local state cleared before the API call) → `DELETE /products/:id/image` fires in the background → spinner shown on the trash icon while the request is in flight

### Frontend flow — Add mode
1. User opens the Add modal → no image shown
2. **Select file:** clicking the zone stores the file as `pendingFile` in component state and shows a blob preview — no API call yet (the product doesn't exist yet)
3. **Save:** form submits → `POST /products` creates the product → the returned `id` is used to call `PATCH /products/:id/image` with the pending file → modal closes
4. **Remove before save:** clicking trash clears `pendingFile` and the preview — nothing was uploaded, so no API call needed

### Key implementation details
- `imageRemoved` flag: set to `true` the instant the trash button is clicked, which short-circuits `currentImageUrl = imageRemoved ? null : (previewUrl ?? product?.image_url)`. This prevents the stale `product.image_url` prop from being shown while the DELETE request is still in flight.
- Object URLs from `URL.createObjectURL(file)` are revoked via cleanup to prevent memory leaks
- The Save button is disabled while `isUploadingImage || isDeletingImage` to prevent concurrent state conflicts
- Both `uploadProductImage` and `deleteProductImage` call `queryClient.invalidateQueries(['products'])` on success so the table refreshes automatically

### `ProductFormModal` props related to images
```ts
onAdd: (data: CreateProductInput) => Promise<{ id: number }>;  // returns id for post-create upload
onUploadImage: (id: number, file: File) => Promise<void>;
onDeleteImage: (id: number) => Promise<void>;
```

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
products.toolbar.{searchPlaceholder, allCategories, allSources, allShops, allStatuses, export, sources.*, statuses.*}
products.table.{num, product, barcode, category, price, source, status, actions}
products.emptyState.{title, sub, addProduct}
products.pagination.{showing}
products.form.{addTitle, editTitle, save, cancel, name, namePlaceholder, barcode,
               barcodePlaceholder, category, categoryPlaceholder, description,
               price, pricePlaceholder, errName, errPrice, errCategory}
products.detail.{title, currentQty, price, source, barcode, category, description, createdAt}
products.restock.{title, qtyLabel, addStock, cancel}
products.delete.{title, warning, delete, cancel}
products.image.{upload, change, remove, hint, uploadError}
```

---

## ✅ Acceptance Criteria

- [x] Table renders live products from `GET /products` with correct columns
- [x] Shop name filter (admin only) passes `shop_name` param to API; dropdown populated from `GET /shops?type=SHOP`; hidden for non-admin roles
- [x] Source column in table shows WAREHOUSE / LOCAL label from `product.source`
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
- [x] Upload image: PATCH `/products/:id/image` called immediately on file select in edit mode; called after create in add mode
- [x] Delete image: DELETE `/products/:id/image` called immediately on trash click; image disappears from UI before API responds
- [x] `ProductThumb` shows actual image when `image_url` is present in the product; falls back to colour placeholder when null
- [ ] Search field works against backend (backend gap)
- [ ] Edit saves barcode + category changes
- [ ] Error feedback on failed mutations

---

## 🔗 Related

- Categories feature: `src/features/categories/` — `useCategories` hook
- Inventory feature: `src/features/inventory/api/inventory.api.ts` — `stockIn` method
- Backend API docs: `http://localhost:3001/api` (Swagger)
- Roadmap tickets: TICKET-029 through TICKET-032
