# Client Order Page

**Status**: ✅ Complete (mock data)  
**Version**: 1.0.0  
**Ticket**: CLIENT-004  
**Route**: `/client/order`  
**File**: `src/features/client-dashboard/components/ClientOrderPage.tsx`  
**Page**: `src/app/client/order/page.tsx`

---

## Overview

The client order page lets shop owners submit a new product order to their supplier. It follows a **3-step flow**:

1. **Step 1 — Choose category**: category grid with cart badge pill and amber "N added" overlay per category
2. **Step 2 — Add products**: product cards with steppers; sticky bottom bar with "Review order" CTA
3. **Step 3 — Review & Submit**: 2-col layout (product list + summary + notes), confirm modal on submit

Cart state is accumulated across all categories; the user can move between steps without losing it.

---

## File Structure

```
src/features/client-dashboard/
├── components/
│   └── ClientOrderPage.tsx    ← full page (all sub-components defined locally)
└── mock/
    └── clientInventory.ts     ← shared mock: CLIENT_INVENTORY, CATEGORIES (reused from inventory page)

src/app/client/order/
└── page.tsx                   ← thin wrapper: <ClientOrderPage />
```

---

## State Model

```ts
const [step, setStep]           // 1 | 2 | 3 — current step
const [selectedCat, setSelectedCat] // string | null — active category in step 2
const [cart, setCart]           // Record<productId, qty> — ordered quantities
const [query, setQuery]         // string — search text (step 1: categories; step 2: products)
const [notes, setNotes]         // string — optional supplier notes (step 3)
const [modalOpen, setModalOpen] // boolean — submit confirmation modal
```

---

## Step 1 — Category Selection

Shown when `step === 1`.

**Search bar**: filters categories by name (AR/EN).

**Cart badge pill** (top-right of search row):
- Shows `{totalCartItems} items added to order`
- Disabled + `opacity-55` when cart is empty
- Clicking when cart has items jumps directly to Step 3

**Category grid** (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`):

Each `CategoryCard` shows:
- Category icon (sand-100 background, 20px)
- Category name (AR/EN)
- Product count + `ord.products` label
- Amber pill badge (`amber-100/700`) in top-right when any cart item belongs to this category:
  `{cartCount} {ord.addedBadge}`

Clicking a card → `handleSelectCat(catId)` → `step = 2`.

---

## Step 2 — Product List

Shown when `step === 2 && selectedCatData !== null`.

**Header row**: breadcrumb back button + category name + `{count} products · {cartItems} items added`.

**Search bar**: filters the current category's products by name.

**Product grid** (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`):

Each `ProductCard` has two visual states:

| State | Border | Background |
|---|---|---|
| Not in cart (`qty === 0`) | `1px solid --border-1` | `--paper` |
| In cart (`qty > 0`) | `2px solid --amber-600` | `--amber-50` |

Card anatomy:
```
Row 1: [ProductThumb 38px]  [Name + SKU]              [Added to order badge] (when in cart)
Row 2: "Current quantity"   [qty number]  [StatusBadge]
Row 3: "Requested quantity" [Stepper: − qty +]
```

### `Stepper` (local)

Controls the **ordered quantity** directly (not a delta). Min = 0, no max (supplier order).

```ts
// Setting qty to 0 → removes product from cart (delete key from Record)
// Setting qty > 0 → upserts into cart
```

### `StatusBadge` (local)

Same colour mapping as the inventory page:

| Status | Style |
|---|---|
| HIGH_STOCK | success-100 bg + success-700 text |
| LOW_STOCK | warning-100 bg + warning-700 text |
| OUT_OF_STOCK | danger-100 bg + danger-700 text |

### Sticky Bottom Bar

Appears when `step === 2 && totalCartItems > 0`:

```tsx
<div className="fixed bottom-14 sm:bottom-0 inset-x-0 z-30 ...">
  {totalCartItems} items added   [Review order →]
</div>
```

`bottom-14` on mobile avoids overlap with `ClientBottomNav` (`h-14 fixed bottom-0`).  
The product grid container has `pb-24` to avoid content hiding under the bar.

---

## Step 3 — Review & Submit

Shown when `step === 3`.

**Header**: `← Edit` back button (returns to step 2, restoring `selectedCat`) + "Review order" title.

**Layout**: `grid-cols-1 lg:grid-cols-2 gap-6`

### Left — Requested Products (`CardShell`)

Rows for each cart item:
```
[ProductThumb 38px]  [Name]           [qty]  [✏ pencil]
```
- Pencil icon → sets `selectedCat = item.categoryId` + `step = 2` (edit that product's qty)
- "Add another product" dashed button at bottom → `handleBackToCategories()` (step 1)

### Right — Order Summary (`CardShell`)

```
Total items    N items
Total units    N units
─────────────────────────────
[Notes textarea — optional]
[Submit order button]
```

`totalCartItems` = count of unique products with qty > 0.  
`totalCartUnits` = sum of all ordered quantities.

---

## Submit Flow

1. User clicks "Submit order" → `setModalOpen(true)`
2. `SubmitModal` shows the full order table (name + qty rows) + notes preview
3. User confirms → `handleSubmitConfirm()`:
   - Calls `toast.success(t.client.order.toast.success)`
   - `router.push('/client/orders')`
4. User cancels → modal closes, step 3 remains active

---

## Empty States

| Condition | Message |
|---|---|
| Category search yields no results | `t.client.order.empty.noCategories` |
| No products in selected category | `t.client.order.empty.noProducts` |

---

## Mock Data

Reuses `CLIENT_INVENTORY` and `CATEGORIES` from `src/features/client-dashboard/mock/clientInventory.ts`.  
No separate order-specific mock file is needed at this stage.

---

## i18n Keys (`t.client.order`)

```json
{
  "title": "New product order",
  "datePrefix": "Order date:",
  "stepLabel": "1 — Choose category",
  "search": "Search category or product…",
  "cartBadge": "items added to order",
  "addedBadge": "added",
  "products": "products",
  "backToCategories": "Categories",
  "productCard": {
    "currentQty": "Current quantity",
    "requestedQty": "Requested quantity",
    "addedToOrder": "Added to order",
    "statusEnough": "Enough",
    "statusLow": "Low stock",
    "statusOut": "Out of stock"
  },
  "bottomBar": {
    "itemsAdded": "items added",
    "reviewBtn": "Review order"
  },
  "review": {
    "backBtn": "Edit",
    "title": "Review order",
    "productsTitle": "Requested products",
    "summaryTitle": "Order summary",
    "totalItems": "Total items",
    "totalUnits": "Total units",
    "itemsUnit": "items",
    "unitsUnit": "units",
    "notesLabel": "Notes for supplier (optional)",
    "notesPlaceholder": "Any special instructions for the supplier…",
    "submitBtn": "Submit order",
    "addLineBtn": "Add another product"
  },
  "modal": {
    "title": "Confirm order submission",
    "intro": "The following order will be submitted:",
    "notesLabel": "Notes:",
    "confirmBtn": "Confirm",
    "cancelBtn": "Cancel"
  },
  "toast": { "success": "Your order was submitted successfully" },
  "empty": {
    "noCategories": "No categories available.",
    "noProducts": "No products in this category."
  }
}
```

---

## API Integration (pending)

| Action | Endpoint |
|---|---|
| Load orderable products | `GET /products?shopId=X&available=true` |
| Submit order | `POST /orders` body: `{ shopId, items: [{ productId, qty }], notes }` |
| Redirect after submit | `GET /orders` (My Orders page) |

---

## Reused Components

| Component | Source |
|---|---|
| `ProductThumb` | `src/features/products/components/ProductThumb.tsx` |
| `CardShell` | `src/features/dashboard/components/CardShell.tsx` |
| `Modal` | `src/common/components/Modal.tsx` |
| `StockStatus` enum | `src/features/products/types/products.types.ts` |
| `useToast` | `src/providers/ToastProvider.tsx` |
| `CLIENT_INVENTORY`, `CATEGORIES` | `src/features/client-dashboard/mock/clientInventory.ts` |
