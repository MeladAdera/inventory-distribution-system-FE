// API
export { shopsApi } from './api/shops.api';

// Hooks
export { useShops } from './hooks/useShops';

// Types
export type {
  Shop,
  ShopListParams,
  UpdateShopInput,
  UpdateShopStatusInput,
} from './types/shops.types';
export { ShopType } from './types/shops.types';

// Validations
export { updateShopSchema, updateShopStatusSchema } from './validations/shops.schema';
