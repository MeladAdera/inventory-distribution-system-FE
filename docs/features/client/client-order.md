# Client Order Page

**Status**: ✅ Complete (real API integrated)  
**Version**: 2.0.0  
**Ticket**: CLIENT-004  
**Route**: `/client/order`  
**File**: `src/features/client-dashboard/components/ClientOrderPage.tsx`  
**Page**: `src/app/client/order/page.tsx`

---

## Overview

The client order page lets shop owners submit a new product order to the warehouse. It follows a **3-step flow**:

1. **Step 1 — Choose category**: category grid, cart badge, search
2. **Step 2 — Add products**: product cards with steppers and stock status; sticky bottom bar
3. **Step 3 — Review & Submit**: 2-col layout (product list + summary), confirm modal on submit

Cart state is accumulated across all categories; the user can move freely between steps without losing it.

---

## File Structure

```
src/features/client-dashboard/
├── components/
│   ├── ClientOrderPage.tsx              ← thin orchestrator: hook + step state + cart + wires atoms
│   └── order/
│       ├── OrderCategoryCard.tsx        ← category grid card with "N added" amber badge
│       ├── OrderProductCard.tsx         ← product card (Stepper + InvStatusBadge)
│       ├── OrderReviewPanel.tsx         ← Step 3 left panel: product rows + pencil edit
│       ├── OrderSummaryPanel.tsx        ← Step 3 right panel: totals + submit button
│       └── OrderSubmitModal.tsx         ← confirm modal with scrollable product list
├── hooks/
│   └── useClientOrderProducts.ts        ← 2 queries + join + createOrder mutation
└── types/
    └── clientOrderProducts.types.ts     ← OrderableProduct, OrderableCategory

src/app/client/order/
└── page.tsx                             ← thin wrapper: <ClientOrderPage />
```

---

## Data Flow

```
GET /products?source=WAREHOUSE&is_orderable=true&stock_status=IN_STOCK&limit=100
    +
GET /inventory?limit=100
    ↓  useClientOrderProducts()
       ├── invMap: Map<product_id, InventoryItem>
       ├── for each product → join inv → compute StockStatus → push to category group
       └── returns categories: OrderableCategory[]

    ↓  ClientOrderPage
       ├── step 1 → OrderCategoryCard grid
       ├── step 2 → OrderProductCard grid + sticky bar
       └── step 3 → OrderReviewPanel + OrderSummaryPanel
                        ↓
                   OrderSubmitModal → POST /orders
```

---

## Key Types

```ts
// clientOrderProducts.types.ts
interface OrderableProduct {
  id: number;
  name: string;           // single language string from API
  category_id: number;
  category_name: string;
  price: string;          // e.g. "1200.00"
  current_quantity: number; // from inventory join; 0 if product never stocked
  status: StockStatus;    // derived: qty=0 → OUT, qty≤threshold → LOW, else HIGH
}

interface OrderableCategory {
  id: number;
  name: string;
  products: OrderableProduct[];
}
```

---

## State Model (`ClientOrderPage`)

```ts
const [step, setStep]               // 1 | 2 | 3 — current step
const [selectedCatId, setSelectedCatId] // number | null — category being browsed in step 2
const [cart, setCart]               // Record<productId, qty> — ordered quantities
const [query, setQuery]             // string — search text (step 1: categories; step 2: products)
const [modalOpen, setModalOpen]     // boolean — submit confirmation modal
```

> Notes field removed — `POST /orders` does not accept a notes/comments field.

---

## Derived Values

```ts
const allProducts     = categories.flatMap((c) => c.products);
const cartItems       = allProducts.filter((p) => (cart[p.id] ?? 0) > 0);
const totalCartItems  = cartItems.length;           // unique products with qty > 0
const totalCartUnits  = cartItems.reduce(...)       // sum of all ordered quantities
const filteredCategories = categories.filter by query on name
const filteredProducts   = selectedCategory.products filtered by query on name
```

---

## Step 1 — Category Grid

**Search bar** + **cart badge pill** (disabled + opacity-55 when empty; jumps to step 3 when clicked with items).

`OrderCategoryCard` props per card:
- `category` — the `OrderableCategory`
- `cartCount` — products in this category with `cart[id] > 0`
- `onClick` → `handleSelectCat(cat.id)` → step 2

> All categories use the `Package` icon — the API returns no icon metadata.  
> Category/product names are single-language strings; no `locale === 'ar'` branching needed.

---

## Step 2 — Product List

`OrderProductCard` for each product in the selected category.

Card anatomy:
```
Row 1: [ProductThumb 38px]  [name + #id]              ["Added to order" badge when qty > 0]
Row 2: "Current quantity"   [current_quantity]  [InvStatusBadge]
Row 3: "Requested quantity" [Stepper: − qty +]
```

`InvStatusBadge` reused from `components/inventory/InvStatusBadge.tsx` — no duplication. The card's
placeholder banner uses the selected category's Lucide icon when the product has no photo
([category-icons.md](../category-icons.md)).

**Stepper** (local to `OrderProductCard`): min = 0, no max. Setting qty to 0 removes the product from the cart.

**The requested-quantity value is a text input**, not a read-only number: ordering 40 cases meant 40
taps on `+`. Details:

- `type="text"` + `inputMode="numeric"` (numeric keypad without the spinner arrows), `dir="ltr"` so
  digits stay LTR in Arabic
- `onChange` strips non-digits (`replace(/\D/g, '')`) and calls `onQty(parsed)` — an empty field is
  local-only state and does **not** push `0`, so clearing the box to retype doesn't drop the product
  out of the cart mid-edit
- `onBlur` re-syncs the display from the cart (`qty === 0 ? '' : String(qty)`), and a `useEffect` on
  `qty` keeps it in step with the ± buttons
- Placeholder `—` when nothing is requested, matching the previous read-only look

**Sticky bottom bar** — appears when `step === 2 && totalCartItems > 0`:
```
{totalCartItems} items added          [Review order →]
```
`bottom-14` on mobile avoids overlap with `ClientBottomNav`.

---

## Step 3 — Review & Submit

Two-column layout (`grid-cols-1 lg:grid-cols-2`):

### `OrderReviewPanel` (left)

One row per cart item: `[ProductThumb] [name] [qty] [✏ pencil]`

- Pencil → `setSelectedCatId(product.category_id)` + `setStep(2)`
- "Add another product" dashed button → `handleBackToCategories()`

### `OrderSummaryPanel` (right)

```
Total items    N items
Total units    N units
──────────────────────
[Submit order]   ← disabled + opacity-60 while isSubmitting
```

---

## Submit Flow

1. "Submit order" → `setModalOpen(true)`
2. `OrderSubmitModal` shows scrollable product list (name + qty)
3. Both buttons disabled while `isSubmitting`
4. User confirms → `handleSubmitConfirm()`:
   ```ts
   await createOrder({
     items: cartItems.map((p) => ({ productId: p.id, quantity: cart[p.id] })),
   });
   toastSuccess(ord.toast.success);
   router.push('/client/orders');
   ```
5. On error → `toastError(ord.toast.error)`
6. On success → `queryClient.invalidateQueries(['client-orders'])` (inside the mutation)

---

## `formatOrderDate` helper

Used in the page header ("Order date: …"):

```ts
function formatOrderDate(locale: 'ar' | 'en'): string {
  const date = new Date();
  if (locale === 'ar') {
    const day = date.getDate();
    const year = date.getFullYear();
    const month = new Intl.DateTimeFormat('ar', { month: 'long' }).format(date);
    return `${day} / ${month} / ${year}`;  // → "18 / يونيو / 2026"
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(date);  // → "18 June 2026"
}
```

---

## i18n Keys (`t.client.order`)

```json
{
  "title": "New product order",
  "datePrefix": "Order date:",
  "stepLabel": "1 — Choose category",
  "loading": "Loading products…",
  "errorMsg": "Failed to load products. Please try again.",
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
  "bottomBar": { "itemsAdded": "items added", "reviewBtn": "Review order" },
  "review": {
    "backBtn": "Edit",
    "title": "Review order",
    "productsTitle": "Requested products",
    "summaryTitle": "Order summary",
    "totalItems": "Total items",
    "totalUnits": "Total units",
    "itemsUnit": "items",
    "unitsUnit": "units",
    "submitBtn": "Submit order",
    "addLineBtn": "Add another product"
  },
  "modal": {
    "title": "Confirm order submission",
    "intro": "The following order will be submitted:",
    "confirmBtn": "Confirm",
    "cancelBtn": "Cancel"
  },
  "toast": {
    "success": "Your order was submitted successfully",
    "error": "Failed to submit order. Please try again."
  },
  "empty": {
    "noCategories": "No categories available.",
    "noProducts": "No products in this category."
  }
}
```

---

## API Integration

| Action | Endpoint | Notes |
|--------|----------|-------|
| Load products | `GET /products?source=WAREHOUSE&is_orderable=true&stock_status=IN_STOCK&limit=100` | Only what the warehouse both *supplies* and *currently has* — see [catalog-vs-orderable.md](../catalog-vs-orderable.md) |
| Load stock levels | `GET /inventory?limit=100` | Joined with products for current qty + status |
| Submit order | `POST /orders` | `{ items: [{ productId, quantity }] }` — shop owner only |

On submit success, `['client-orders']` query is invalidated so My Orders reflects the new order immediately.

On a **400** (not orderable / out of stock / insufficient stock) the mutation's `onError` invalidates
`['order-products']`: a 400 means the cached picker list no longer matches the warehouse, so it
refetches instead of letting the shop retry an impossible order.

---

## Reused Components

| Component | Source |
|-----------|--------|
| `InvStatusBadge` | `components/inventory/InvStatusBadge.tsx` |
| `ProductThumb` | `src/features/products/components/ProductThumb.tsx` |
| `CardShell` | `src/features/dashboard/components/CardShell.tsx` |
| `Modal` | `src/common/components/Modal.tsx` |
| `useToast` | `src/providers/ToastProvider.tsx` |
