'use client';

import { X } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { ClientSidebar } from './ClientSidebar';

interface ClientNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ClientNavDrawer({ open, onClose }: ClientNavDrawerProps) {
  const { dir } = useI18n();
  const isRtl = dir === 'rtl';

  return (
    <>
      {/* Scrim — tablet only */}
      {open && (
        <div
          className="hidden md:block lg:hidden fixed inset-0 z-40 bg-ink-900/30 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      {/* Drawer panel — tablet only */}
      <div
        className={cn(
          'hidden md:block lg:hidden fixed top-0 z-50 h-screen w-65 max-w-[85vw]',
          'transition-transform duration-220 ease-[cubic-bezier(0.2,0,0,1)]',
          isRtl ? 'right-0' : 'left-0',
          open ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 z-10 p-1.5 rounded-lg text-[rgba(245,239,228,0.66)] hover:bg-white/6 transition-colors"
          style={{ insetInlineEnd: '12px' }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* ClientSidebar in fluid mode */}
        <div className="h-full overflow-hidden [&>aside]:flex [&>aside]:w-full [&>aside]:lg:flex">
          <ClientSidebar fluid />
        </div>
      </div>
    </>
  );
}
