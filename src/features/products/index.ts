// API
export { productsApi } from './api/products.api';

// Hooks
export { useProducts } from './hooks/useProducts';

// Types
export type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductListParams,
  AdminProduct,
  ProductCategory,
  ProductStatus,
} from './types/products.types';
export { ProductSource, getProductStatus, CATEGORY_COLORS } from './types/products.types';

// Validations
export {
  createProductSchema,
  updateProductSchema,
  adminProductFormSchema,
} from './validations/products.schema';
export type { AdminProductFormData } from './validations/products.schema';

// Mock
export { MOCK_PRODUCTS } from './mock/productsData';

// Components
export { ProductThumb } from './components/ProductThumb';
export { StatusBadge } from './components/StatusBadge';
export { ProductsTableCard } from './components/ProductsTableCard';
export { ProductFormModal } from './components/ProductFormModal';
export { ProductDetailModal } from './components/ProductDetailModal';
export { RestockModal } from './components/RestockModal';
export { DeleteConfirmModal } from './components/DeleteConfirmModal';
