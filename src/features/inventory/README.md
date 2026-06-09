# Inventory Feature

Manage warehouse inventory and stock levels.

## Structure

```
inventory/
├── api/
│   └── inventory.api.ts       # API calls
├── hooks/
│   └── useInventory.ts        # Custom hooks
├── types/
│   └── inventory.types.ts     # Type definitions
├── validations/
│   └── inventory.schema.ts    # Zod validation
├── components/                # Feature components
└── README.md
```

## Key Types

- `InventoryItem` - Single inventory record
- `CreateInventoryInput` - Create operation
- `UpdateInventoryInput` - Update operation

## Usage

```typescript
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { inventoryApi } from '@/features/inventory';
```
