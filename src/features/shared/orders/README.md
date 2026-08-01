# Orders Feature

The canonical order model. **One order is the same row on both sides of the system** —
the shop calls it "my order", the warehouse calls it a transfer:

| Portal | UI lives in | Reads |
|---|---|---|
| Shop | `@/features/shop` (`ClientOrdersPage`, `ClientOrderPage`) | `/orders` |
| Warehouse | `@/features/shared/transfers` (`TransfersTableCard`, …) | `/orders` |

`@/features/shared/transfers/types` **aliases** the types defined here rather than
redeclaring them, and `transfersApi` delegates to `ordersApi`. Define order shape in
this folder only.

## Structure

```
orders/
├── api/
│   └── orders.api.ts          # API calls — the only place /orders URLs are written
├── types/
│   └── orders.types.ts        # Type definitions + NEXT_STATUS state machine
├── validations/
│   └── orders.schema.ts       # Zod validation
└── README.md
```

There is no hook here — the live list/mutate hook is `useTransfers`
(`@/features/shared/transfers/hooks/useTransfers`), which reads this same resource
and unwraps the `data.data` envelope.

## Key Types

- `Order` — `to_shop_name` identifies the destination shop. `items` is **optional**:
  `GET /orders` omits line items, only `GET /orders/:id` returns them
- `OrderItem` — product_id, product_name, quantity, price
- `CreateOrderInput` — `{ items: CreateOrderItem[] }`, plus `shopId` for admin
- `UpdateOrderStatusInput` — `{ status: OrderStatus }`

> ⚠️ `total_price` and `OrderItem.price` are typed `number` (floats), unlike every
> money field on debts, which are 2-decimal strings handled through
> `@/common/utils/money`. Never derive a balance from `total_price` — read
> `remaining` off the debt instead.

## Order Status Flow

```
PENDING → PROCESSING → SHIPPED → RECEIVED → COMPLETED
```

- `PENDING` — shop submitted, awaiting warehouse action
- `PROCESSING` — warehouse accepted and is preparing
- `SHIPPED` — order dispatched
- `RECEIVED` — shop confirmed delivery; inventory transferred automatically
- `COMPLETED` — order fully closed

> The backend enforces **strict sequential transitions** — always send the immediate next status.
> Skipping a step returns `400 Bad Request`.

## Usage

```typescript
import { ordersApi, OrderStatus, NEXT_STATUS } from '@/features/shared/orders';
import type { Order } from '@/features/shared/orders';

// Warehouse list/mutate:
import { useTransfers } from '@/features/shared/transfers/hooks/useTransfers';
```
