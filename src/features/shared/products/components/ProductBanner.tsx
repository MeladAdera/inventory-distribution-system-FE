import { getCategoryIcon } from '@/features/shared/categories/utils/categoryIcons';

const PALETTE = ['#FAEACB', '#F8EBD3', '#DDE6F3', '#DCEBE9', '#F6DDDB', '#F5EFE4'];
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function resolveImageUrl(url: string) {
  if (url.startsWith('blob:') || url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

interface ProductBannerProps {
  id: number;
  imageUrl: string | null;
  height?: string;
  /** Lucide icon name from the product's category; falls back to Package when null/unknown. */
  categoryIcon?: string | null;
}

export function ProductBanner({ id, imageUrl, height = 'h-36', categoryIcon }: ProductBannerProps) {
  const color = PALETTE[id % PALETTE.length];
  const Icon = getCategoryIcon(categoryIcon);
  return (
    <div
      style={{ backgroundColor: color }}
      className={`w-full ${height} rounded-t-xl overflow-hidden flex items-center justify-center`}
    >
      {imageUrl ? (
        <img src={resolveImageUrl(imageUrl)} alt="" className="w-full h-full object-contain" />
      ) : (
        <Icon size={36} className="text-ink-700 opacity-40" />
      )}
    </div>
  );
}
