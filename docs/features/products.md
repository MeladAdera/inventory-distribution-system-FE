# Feature: Products Admin Page (FIGMA-003)

**Status**: Complete  
**Created Date**: 2026-06-11  
**Last Updated**: 2026-06-11  
**Assignee**: Melad Adera  
**Ticket**: FIGMA-003

---

## 📋 Overview

### Purpose
The Products admin page (`/products`) is the primary interface for warehouse managers to view, search, filter, and manage the product catalogue. It provides full CRUD operations through modal dialogs without leaving the page.

### Business Value
- Single-screen product management: create, view detail, edit, restock, delete
- Live status derived from qty + min-stock thresholds — no manual status updates needed
- Client-side search and filter with instant feedback
- Bilingual (AR/EN) with full RTL/LTR layout support
- 650ms skeleton load simulation ready to swap for a real API hook

---

## 🏗️ Architecture

### File Structure

```
src/features/products/
├── api/
│   └── products.api.ts              # Backend CRUD API (Phase 5 integration)
├── components/
│   ├── ProductThumb.tsx             # Coloured square + package icon
│   ├── StatusBadge.tsx              # Dot + label pill (in_stock / low / out / inactive)
│   ├── ProductsTableCard.tsx        # Full table card: toolbar + grid + skeleton + pagination
│   ├── ProductFormModal.tsx         # Add / Edit modal (react-hook-form + zod)
│   ├── ProductDetailModal.tsx       # View-only detail modal (6 info rows)
│   ├── RestockModal.tsx             # Qty stepper + before/after summary
│   └── DeleteConfirmModal.tsx       # Danger confirm (no backdrop close)
├── hooks/
│   └── useProducts.ts               # React Query hook (Phase 5 integration)
├── mock/
│   └── productsData.ts              # 12 MOCK_PRODUCTS — used until API integration
├── types/
│   └── products.types.ts            # AdminProduct, ProductStatus, ProductCategory,
│                                    # getProductStatus(), CATEGORY_COLORS
├── validations/
│   └── products.schema.ts           # adminProductFormSchema (z.number + valueAsNumber)
└── index.ts                         # Barrel export

src/app/(dashboard)/products/page.tsx   # Page — state, filtering, CRUD, modal routing
src/i18n/en/products.json               # English translations
src/i18n/ar/products.json               # Arabic translations
src/app/globals.css                      # Added: @keyframes shimmer + .skeleton-shimmer
```

### Page Layout (2 layers)

```
Layer 1 — Page Header
  ├── Title: "المنتجات / Products"
  ├── Count: "N منتج / N products"  (total, not filtered)
  └── "+ إضافة منتج / Add product" button → opens ProductFormModal (add mode)

Layer 2 — Table Card  (bg-paper, border, rounded-xl)
  ├── Toolbar
  │   ├── Search input  (name + SKU, instant)
  │   ├── Category select  (bev / snk / dry / cln / can / bky)
  │   ├── Status select  (in_stock / low / out / inactive)
  │   └── Export button  (stub)
  ├── Header row  (hidden on mobile)
  │   └── CSS grid: 40px 2fr 1.2fr 1fr 1fr 0.9fr 1fr 156px
  ├── Body
  │   ├── Skeleton (6 shimmer rows, 650ms on first load)
  │   ├── Data rows (desktop grid / mobile stacked card)
  │   └── Empty state  (PackageSearch icon + "no results" + add button)
  └── Pagination  (shown only when filtered count > 1 page)
```

---

## 🧩 Component Reference

### `ProductThumb`
```tsx
<ProductThumb color="#DCEBE9" size={38} />
// Renders: coloured rounded-lg square with a Package icon overlay (opacity 50%)
// size prop controls both width/height and scales icon proportionally (47%)
```

### `StatusBadge`
```tsx
<StatusBadge status="low" label="مخزون منخفض" />
// Renders: dot + label pill. Dot and text share the same colour token.
```

Status → colour mapping:

| Status | Dot / text | Background |
|--------|-----------|------------|
| `in_stock` | `success-700` | `success-100` |
| `low` | `warning-700` | `warning-100` |
| `out` | `danger-700` | `danger-100` |
| `inactive` | `ink-500` | `sand-200` |

### `ProductsTableCard`

Receives paginated products + filter state + callbacks. Owns the toolbar UI, skeleton, and pagination UI. Status is derived inside `ProductRow` via `getProductStatus()`.

Key prop: `startIndex` — so row numbers are correct across pages (e.g. page 2 starts at 11, not 1).

### `ProductFormModal`

- `mode: 'add' | 'edit'` controls title and whether the form pre-fills.
- Image upload zone is **visual-only** — shows a colour swatch derived from `product.color` (edit) or `CATEGORY_COLORS[watchCategory]` (add).
- Form uses `z.number()` fields with `{ valueAsNumber: true }` on number inputs — **not** `z.coerce.number()` which would break the zodResolver generic.
- Required fields: Arabic name, SKU, selling price, initial qty.

### `ProductDetailModal`

View-only. Derives total value: `warehouse_qty × sell_price`. Formats with `toLocaleString`.

### `RestockModal`

Stepper with `+` / `-` buttons. Shows "Current qty" → arrow → "New total" summary boxes. "Add stock" button disabled when qty = 0. Arrow direction respects `dir` (RTL ← / LTR →).

### `DeleteConfirmModal`

Backdrop click is **intentionally disabled** (`closeOnBackdrop: false`). User must choose Delete or Cancel explicitly.

---

## 🔧 State & Data Flow

```
page.tsx
  │
  ├── products: AdminProduct[]       ← useState(MOCK_PRODUCTS), updated by CRUD handlers
  ├── isLoading: boolean             ← setTimeout(650ms) on mount, simulates fetch
  ├── search / categoryFilter / statusFilter  ← useState, reset page on change
  ├── page: number                   ← pagination cursor
  └── modal: ModalState              ← discriminated union: none | add | edit | view | restock | delete
       │
       ├── filtered = useMemo(...)   ← client-side filter on products array
       └── paginated = filtered.slice(...)
```

### CRUD Operations (local state, swappable with API mutations)

| Action | Handler | Effect |
|--------|---------|--------|
| Add | `handleAdd(data)` | Appends `AdminProduct` with next id + `CATEGORY_COLORS[category]` |
| Edit | `handleEdit(product, data)` | Updates matching product by id |
| Restock | `handleRestock(product, qty)` | Increments `warehouse_qty` |
| Delete | `handleDelete(product)` | Filters out by id |

---

## 📊 Status Derivation

Status is **never stored** — always computed from the product record:

```typescript
function getProductStatus(product: AdminProduct): ProductStatus {
  if (!product.is_active) return 'inactive';
  if (product.warehouse_qty === 0) return 'out';
  if (product.warehouse_qty <= product.min_stock) return 'low';
  return 'in_stock';
}
```

---

## 🎨 Design Tokens Used

| Token | Used for |
|-------|---------|
| `--color-sand-100` / `sand-200` | Shimmer gradient, table header bg, inactive badge bg |
| `--color-ink-500/600/700/800/900` | Text hierarchy |
| `--color-amber-600/700` | Primary action buttons |
| `--color-success-100/700` | In-stock badge, restock new-total box |
| `--color-warning-100/700` | Low-stock badge |
| `--color-danger-100/700` | Out-of-stock badge, delete button, error text |
| `--color-border` | All borders |
| `--color-paper` | Card / modal backgrounds |

New global CSS added:

```css
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.skeleton-shimmer {
  background: linear-gradient(90deg, #F5EFE4 25%, #ECE3D2 50%, #F5EFE4 75%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
```

---

## 🌐 i18n Keys

Both `src/i18n/en/products.json` and `src/i18n/ar/products.json` cover:

```
products.page.{title, count, addProduct}
products.toolbar.{searchPlaceholder, allCategories, allStatuses, export, categories.*, statuses.*}
products.table.{num, product, sku, category, warehouseQty, unitPrice, status, actions}
products.emptyState.{title, sub, addProduct}
products.pagination.{showing}
products.form.{addTitle, editTitle, save, cancel, image, imageDrag,
               nameAr, nameArPlaceholder, nameEn, nameEnPlaceholder,
               sku, skuPlaceholder, category, description,
               costPrice, sellPrice, pricePlaceholder,
               initialQty, minStock, qtyPlaceholder,
               errNameAr, errSku, errSellPrice, errQty}
products.detail.{title, warehouseQty, minStock, costPrice, sellPrice, totalValue, category, units}
products.restock.{title, qtyLabel, currentQty, newTotal, addStock, cancel}
products.delete.{title, warning, delete, cancel}
```

---

## 📱 Responsive Behaviour

| Breakpoint | Table header | Data rows | Modals |
|------------|-------------|-----------|--------|
| Mobile `<md` | Hidden | Stacked card (flex-col) | Slide up from bottom (rounded-t-2xl) |
| Tablet/Desktop `≥md` | CSS grid 8-col | CSS grid 8-col | Centred overlay |

---

## ⚠️ Known Stubs (future tickets)

| Location | Stub | Future ticket |
|----------|------|---------------|
| All product data | `MOCK_PRODUCTS` + local state | Phase 5 — TICKET-029 API wiring |
| Export button | No-op | TICKET-TBD |
| Image upload zone | Visual only, no file input | TICKET-TBD |
| `productsApi` + `useProducts` hook | Exists but unused by page | Phase 5 TICKET-029 |

---

## ✅ Acceptance Criteria

- [x] Table renders 12 mock products with correct columns and values
- [x] Status badge derived live (in_stock / low / out / inactive)
- [x] Search filters by name (AR + EN) and SKU instantly
- [x] Category + status dropdowns filter the list
- [x] Page resets to 1 when any filter changes
- [x] Pagination renders only when filtered count > page size (10)
- [x] 650ms skeleton shimmer shows on first load
- [x] Empty state shown when all filters yield zero results
- [x] Row numbers correct across pages (startIndex offset)
- [x] Add modal opens with empty form; valid submit appends product
- [x] Edit modal pre-fills from selected product; valid submit updates product
- [x] Restock modal updates `warehouse_qty` and re-derives status
- [x] Delete removes product from list; resets derived counts
- [x] Detail modal shows all 6 info rows including computed total value
- [x] All text switches AR ↔ EN on locale toggle
- [x] Modals slide up from bottom on mobile, centred on desktop
- [x] DeleteConfirmModal does NOT close on backdrop click
- [x] `npx tsc --noEmit` passes with zero errors

---

## 🔗 Related

- Admin layout shell: [admin-layout-shell.md](admin-layout-shell.md)
- Dashboard: [dashboard.md](dashboard.md)
- API integration: [ROADMAP.md](../../ROADMAP.md) — TICKET-029 through TICKET-032
- Phase 5 Products CRUD (API): depends on `productsApi` + `useProducts` already scaffolded
