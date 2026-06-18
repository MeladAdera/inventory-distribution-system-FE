# Orders Feature

Manage customer orders and order fulfillment.

## Structure

```
orders/
├── api/
│   └── orders.api.ts          # API calls
├── hooks/
│   └── useOrders.ts           # Custom hooks
├── types/
│   └── orders.types.ts        # Type definitions
├── validations/
│   └── orders.schema.ts       # Zod validation
├── components/                # Feature components
└── README.md
```

## Key Types

- `Order` — full order object including `items[]`; `to_shop_name` identifies the destination shop
- `OrderItem` — product_id, product_name, quantity, price (string, e.g. `"1200.00"`)
- `CreateOrderInput` — `{ items: CreateOrderItem[] }` (shop owner); add `shopId` for admin
- `UpdateOrderStatusInput` — `{ status: OrderStatus }`

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
import { useOrders } from '@/features/orders/hooks/useOrders';
import { ordersApi, Order, OrderStatus } from '@/features/orders';
```
