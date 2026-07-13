// API
export { productsApi } from './api/products.api';

// Hooks
export { useProducts, useProduct } from './hooks/useProducts';

// Types
export type {
  Product,
  ProductDetail,
  CreateProductInput,
  UpdateProductInput,
  ProductListParams,
} from './types/products.types';
export { ProductSource, StockStatus } from './types/products.types';

// Validations
export {
  createProductSchema,
  updateProductSchema,
  productFormSchema,
} from './validations/products.schema';
export type { ProductFormData } from './validations/products.schema';

// Components
export { ProductThumb } from './components/ProductThumb';
export { StatusBadge } from './components/StatusBadge';
export { ProductsTableCard } from './components/ProductsTableCard';
export { ProductFormModal } from './components/ProductFormModal';
export { ProductDetailModal } from './components/ProductDetailModal';
export { DeleteConfirmModal } from './components/DeleteConfirmModal';
