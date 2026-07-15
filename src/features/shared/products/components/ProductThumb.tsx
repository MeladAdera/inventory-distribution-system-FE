import { getCategoryIcon } from '@/features/shared/categories/utils/categoryIcons';

const PALETTE = ['#FAEACB', '#F8EBD3', '#DDE6F3', '#DCEBE9', '#F6DDDB', '#F5EFE4'];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function resolveImageUrl(url: string): string {
  if (url.startsWith('blob:') || url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

interface ProductThumbProps {
  id?: number;
  size?: number;
  imageUrl?: string | null;
  /** Lucide icon name from the product's category; falls back to Package when null/unknown. */
  categoryIcon?: string | null;
}

export function ProductThumb({ id = 0, size = 38, imageUrl, categoryIcon }: ProductThumbProps) {
  if (imageUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-lg overflow-hidden shrink-0 border border-black/6 bg-sand-100"
      >
        <img src={resolveImageUrl(imageUrl)} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  const color = PALETTE[id % PALETTE.length];
  const iconSize = Math.round(size * 0.47);
  const Icon = getCategoryIcon(categoryIcon);
  return (
    <div
      style={{ backgroundColor: color, width: size, height: size }}
      className="rounded-lg flex items-center justify-center shrink-0 border border-black/6"
    >
      <Icon size={iconSize} className="text-ink-700 opacity-50" />
    </div>
  );
}
