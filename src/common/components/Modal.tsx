'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/common/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Pinned below the scroll area. Actions passed here stay reachable no matter
   * how tall the body grows; actions left inside `children` scroll away with it.
   */
  footer?: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  // For forms built around a table of rows — a line-items editor needs room for
  // a name, a quantity, a price and a total side by side before it starts to
  // wrap. Still a centred dialog from `sm` up, still a bottom sheet on phones.
  xl: 'max-w-3xl',
};

// Modals stack (a detail modal opening a confirm modal on top). Without a count,
// closing the topmost one restores body scroll while the one beneath is still
// open, and the page scrolls behind it.
let openModalCount = 0;

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    openModalCount += 1;
    document.body.style.overflow = 'hidden';
    return () => {
      openModalCount -= 1;
      if (openModalCount === 0) document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    // Bottom sheet on phones, centred dialog from `sm` up.
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative z-10 flex w-full flex-col overflow-hidden bg-white shadow-xl',
          'max-h-[92dvh] rounded-t-2xl sm:max-h-[85dvh] sm:rounded-lg',
          sizeClasses[size]
        )}
      >
        <div className="flex shrink-0 items-center justify-between px-6 pb-4 pt-6">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* The one scroll container. Everything tall lives here so the header and
            footer stay put instead of being pushed off-screen. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>

        {footer && <div className="shrink-0 border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
