import { Pencil, Plus } from 'lucide-react';
import { ProductThumb } from '@/features/products/components/ProductThumb';
import { CardShell } from '@/features/dashboard/components/CardShell';
import type { OrderableProduct } from '../../types/clientOrderProducts.types';

interface OrderReviewPanelProps {
  cartItems: OrderableProduct[];
  cart: Record<number, number>;
  onEditProduct: (categoryId: number) => void;
  onAddMore: () => void;
  labels: {
    productsTitle: string;
    backBtn: string;
    addLineBtn: string;
  };
}

export function OrderReviewPanel({
  cartItems,
  cart,
  onEditProduct,
  onAddMore,
  labels,
}: OrderReviewPanelProps) {
  return (
    <CardShell title={labels.productsTitle}>
      <div className="-mx-5 -mb-5">
        {cartItems.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0"
          >
            <ProductThumb id={product.id} size={38} />
            <span className="flex-1 text-[14px] text-ink-800 truncate">{product.name}</span>
            <span className="font-mono text-[14px] font-semibold text-ink-900 shrink-0 me-1">
              {cart[product.id]}
            </span>
            <button
              onClick={() => onEditProduct(product.category_id)}
              className="p-1.5 rounded-lg text-ink-400 hover:text-amber-700 hover:bg-amber-50 transition-colors shrink-0"
              title={labels.backBtn}
            >
              <Pencil size={14} />
            </button>
          </div>
        ))}

        <div className="px-5 py-4">
          <button
            onClick={onAddMore}
            className="w-full flex items-center justify-center gap-2 py-3.25 border border-dashed border-border rounded-xl text-[14px] text-ink-500 hover:border-amber-600 hover:text-amber-700 transition-colors"
          >
            <Plus size={14} />
            {labels.addLineBtn}
          </button>
        </div>
      </div>
    </CardShell>
  );
}
