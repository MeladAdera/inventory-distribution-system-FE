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

- `Order` - Order with items
- `OrderItem` - Individual order line item
- `CreateOrderInput` - Create operation
- `UpdateOrderInput` - Update operation

## Order Status

- `PENDING` - Awaiting processing
- `PROCESSING` - Being prepared
- `SHIPPED` - In transit
- `DELIVERED` - Received by customer
- `CANCELLED` - Order cancelled

## Usage

```typescript
import { useOrders } from '@/features/orders/hooks/useOrders';
import { ordersApi, Order, OrderStatus } from '@/features/orders';
```
