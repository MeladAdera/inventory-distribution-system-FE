import { Package } from 'lucide-react';

const PALETTE = ['#FAEACB', '#F8EBD3', '#DDE6F3', '#DCEBE9', '#F6DDDB', '#F5EFE4'];

interface ProductThumbProps {
  id?: number;
  size?: number;
}

export function ProductThumb({ id = 0, size = 38 }: ProductThumbProps) {
  const color = PALETTE[id % PALETTE.length];
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
