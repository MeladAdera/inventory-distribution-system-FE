'use client';

import { X } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { Sidebar } from './Sidebar';

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function NavDrawer({ open, onClose }: NavDrawerProps) {
  const { dir } = useI18n();
  const isRtl = dir === 'rtl';

  return (
    <>
      {/* Scrim */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-ink-900/30 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={cn(
          'lg:hidden fixed top-0 z-50 h-screen w-70 max-w-[85vw]',
          'transition-transform duration-220 ease-[cubic-bezier(0.2,0,0,1)]',
          isRtl ? 'right-0' : 'left-0',
          open ? 'translate-x-0' : isRtl ? 'translate-x-10' : '-translate-x-10'
        )}
      >
        {/* Close button overlay */}
        <button
          onClick={onClose}
          className="absolute top-4 z-10 p-1.5 rounded-lg text-ink-400 hover:bg-sand-200 transition-colors"
          style={{ insetInlineEnd: '12px' }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Reuse Sidebar in fluid mode (no collapse toggle, full width) */}
        <div className="h-full overflow-hidden [&>aside]:flex [&>aside]:w-full [&>aside]:lg:flex">
          <Sidebar fluid />
        </div>
      </div>
    </>
  );
}
