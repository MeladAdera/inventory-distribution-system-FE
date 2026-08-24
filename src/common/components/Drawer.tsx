'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/common/utils/cn';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Pinned below the scroll area so actions stay reachable however tall the body grows. */
  footer?: React.ReactNode;
}

// Drawers and modals can stack. Without a shared count, closing the top one
// restores body scroll while another is still open and the page scrolls behind.
let openOverlayCount = 0;

/**
 * A panel anchored to the inline-start edge — the left in English, the right in
 * Arabic — for detail that should not take the reader off the list they are
 * working through. On a phone it becomes a bottom sheet instead, because a
 * 420px side panel on a 390px screen is just a worse modal.
 *
 * Closes on the ×, on Escape, and on the overlay. Focus moves into the panel on
 * open and returns to whatever opened it on close, so keyboard users are not
 * dropped back at the top of the document.
 */
export function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    openOverlayCount += 1;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);

    // Wait a frame so the panel is painted before it takes focus.
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 0);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
      openOverlayCount -= 1;
      if (openOverlayCount === 0) document.body.style.overflow = '';
      restoreFocusTo.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 animate-fade-in bg-ink-900/28"
        onClick={onClose}
        aria-hidden
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'absolute flex flex-col bg-paper shadow-(--shadow-lg) outline-none',
          // Phone: a sheet rising from the bottom.
          'inset-x-0 bottom-0 max-h-[92dvh] animate-sheet-up rounded-t-2xl',
          // From sm up: a full-height panel on the inline-start edge.
          'sm:inset-y-0 sm:inset-e-auto sm:inset-s-0 sm:max-h-none sm:w-105 sm:max-w-full',
          'sm:animate-drawer-in sm:rounded-none'
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="min-w-0 truncate text-[16px] font-semibold text-ink-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={title}
            className="rounded p-1 text-ink-400 transition-colors hover:bg-sand-100 hover:text-ink-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* The one scroll container, so the header and footer stay put. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && <div className="shrink-0 border-t border-border px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}
