'use client';

import { useState } from 'react';
import { Minus, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { Button } from '@/common/components/ui/button';
import type { EnrichedInventoryItem } from '../../types/clientInventory.types';

export interface SellTrayItem {
  item: EnrichedInventoryItem;
  qty: number;
}

interface SellTrayProps {
  items: SellTrayItem[];
  totalUnits: number;
  onInc: (inventoryId: number) => void;
  onDec: (inventoryId: number) => void;
  onRemove: (inventoryId: number) => void;
  onContinue: () => void;
  labels: {
    title: string;
    totalUnits: string;
    unitsUnit: string;
    continueBtn: string;
  };
}

export function SellTray({
  items,
  totalUnits,
  onInc,
  onDec,
  onRemove,
  onContinue,
  labels,
}: SellTrayProps) {
  const [expanded, setExpanded] = useState(true);

  if (items.length === 0) return null;

  const Chevron = expanded ? ChevronDown : ChevronUp;

  return (
    <div className="fixed bottom-14 md:bottom-0 inset-x-0 z-30 bg-paper border-t border-border shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="max-w-330 mx-auto px-4 lg:px-6">
        {/* Header — toggles the item list */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between gap-2 py-2.5"
        >
          <span className="flex items-center gap-2 text-[13px] font-semibold text-ink-900">
            {labels.title}
            <span className="min-w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center px-1.5 tabular-nums">
              {items.length}
            </span>
          </span>
          <Chevron size={16} className="text-ink-400 shrink-0" />
        </button>

        {/* Item list */}
        {expanded && (
          <div className="max-h-44 overflow-y-auto border-t border-border divide-y divide-border">
            {items.map(({ item, qty }) => {
              const maxed = qty >= item.current_quantity;
              return (
                <div key={item.id} className="flex items-center gap-2 py-2">
                  <p className="flex-1 min-w-0 text-[13px] font-medium text-ink-800 truncate">
                    {item.product_name}
                  </p>

                  <div className="flex items-center rounded-full border border-border bg-paper overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => onDec(item.id)}
                      className="w-8 h-8 flex items-center justify-center text-ink-400 hover:text-ink-700 transition-colors"
                    >
                      <Minus size={12} strokeWidth={2.5} />
                    </button>
                    <span className="w-7 text-center font-mono text-[13px] font-bold text-amber-600 tabular-nums">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onInc(item.id)}
                      disabled={maxed}
                      className={cn(
                        'w-8 h-8 flex items-center justify-center transition-colors',
                        maxed
                          ? 'text-ink-200 cursor-not-allowed'
                          : 'text-ink-400 hover:text-ink-700'
                      )}
                    >
                      <Plus size={12} strokeWidth={2.5} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="w-8 h-8 flex items-center justify-center text-ink-300 hover:text-danger-500 transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer — total + continue */}
        <div className="flex items-center justify-between gap-3 py-2.5 border-t border-border">
          <span className="text-[13px] text-ink-600">
            {labels.totalUnits}:{' '}
            <span className="font-mono font-bold text-ink-900 tabular-nums">{totalUnits}</span>{' '}
            {labels.unitsUnit}
          </span>
          <Button onClick={onContinue} className="px-6">
            {labels.continueBtn}
          </Button>
        </div>
      </div>
    </div>
  );
}
