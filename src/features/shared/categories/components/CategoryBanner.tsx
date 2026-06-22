import { Tag } from 'lucide-react';

const PALETTE = ['#FAEACB', '#F8EBD3', '#DDE6F3', '#DCEBE9', '#F6DDDB', '#F5EFE4'];
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function resolveImageUrl(url: string) {
  if (url.startsWith('blob:') || url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

interface CategoryBannerProps {
  id: number;
  imageUrl: string | null;
  height?: string;
}

export function CategoryBanner({ id, imageUrl, height = 'h-36' }: CategoryBannerProps) {
  const color = PALETTE[id % PALETTE.length];
  return (
    <div
      style={{ backgroundColor: color }}
      className={`w-full ${height} rounded-t-xl overflow-hidden flex items-center justify-center`}
    >
      {imageUrl ? (
        <img src={resolveImageUrl(imageUrl)} alt="" className="w-full h-full object-contain" />
      ) : (
        <Tag size={36} className="text-ink-700 opacity-40" />
      )}
    </div>
  );
}
