import { Package } from 'lucide-react';

interface ProductThumbProps {
  color: string;
  size?: number;
}

export function ProductThumb({ color, size = 38 }: ProductThumbProps) {
  const iconSize = Math.round(size * 0.47);
  return (
    <div
      style={{ backgroundColor: color, width: size, height: size }}
      className="rounded-lg flex items-center justify-center shrink-0 border border-black/6"
    >
      <Package size={iconSize} className="text-ink-700 opacity-50" />
    </div>
  );
}
