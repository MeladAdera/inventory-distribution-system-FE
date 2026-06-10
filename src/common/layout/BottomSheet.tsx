'use client';

import { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/common/utils/cn';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'full';
  className?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  size = 'sm',
  className,
}: BottomSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Scrim */}
      <div className="absolute inset-0 bg-ink-900/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Sheet */}
      <div
        className={cn(
          'relative w-full max-w-160 mx-auto bg-paper animate-sheet-up overflow-y-auto',
          size === 'full' ? 'h-screen' : 'max-h-[85vh] rounded-t-2xl',
          className
        )}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-2.5">
          <span className="w-10 h-1 rounded-full bg-ink-200" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-border">
            <h2 className="text-[16px] font-semibold text-ink-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-400 hover:bg-sand-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
