# Products Feature

Manage product catalog and product information.

## Structure

```
products/
├── api/
│   └── products.api.ts        # API calls
├── hooks/
│   └── useProducts.ts         # Custom hooks
├── types/
│   └── products.types.ts      # Type definitions
├── validations/
│   └── products.schema.ts     # Zod validation
├── components/                # Feature components
└── README.md
```

## Key Types

- `Product` - Product information
- `CreateProductInput` - Create operation
- `UpdateProductInput` - Update operation

## Product Sources

- `WAREHOUSE` - From internal warehouse
- `SUPPLIER` - Direct from supplier
- `IMPORTED` - Imported products

## Usage

```typescript
import { useProducts } from '@/features/products/hooks/useProducts';
import { productsApi, Product, ProductSource } from '@/features/products';
```
