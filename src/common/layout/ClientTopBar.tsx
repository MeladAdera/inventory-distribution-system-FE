'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Languages, ChevronDown, LogOut } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { getInitials } from '@/common/utils/string.utils';
import { useI18n } from '@/providers/I18nProvider';
import { useAuth } from '@/features/auth';

interface ClientTopBarProps {
  onMenuClick?: () => void;
}

export function ClientTopBar({ onMenuClick }: ClientTopBarProps) {
  const { t, locale, setLocale } = useI18n();
  const { logout } = useAuth();
  const pathname = usePathname();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const c = t.client;
  const nav = c.nav as Record<string, string>;

  // resolve page title from the 3rd path segment: /client/<page>
  const segments = pathname.split('/').filter(Boolean);
  const pageKey = segments[1] ?? 'dashboard';
  const pageTitle = nav[pageKey] ?? '';

  const { user } = useAuth();
  const clientName = user?.name ?? '';
  const roleLabel = user
    ? ((t.settings.profile.roles as Record<string, string>)[user.role] ?? user.role)
    : '';
  const initials = getInitials(clientName);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="h-16 bg-page border-b border-border flex items-center px-6 gap-4 shrink-0 sticky top-0 z-100">
      {/* Hamburger — tablet only */}
      <button
        onClick={onMenuClick}
        className="hidden md:block lg:hidden p-2.5 rounded-lg text-ink-800 hover:bg-sand-100 transition-colors"
        aria-label={c.topbar.menuLabel}
      >
        <Menu size={22} />
      </button>

      {/* Page title */}
      <h1 className="text-[22px] font-semibold text-ink-900 shrink-0">{pageTitle}</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right cluster */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
          className="h-9 px-3.5 rounded-full border border-border text-[13px] font-semibold text-ink-700 hover:bg-sand-100 transition-colors flex items-center gap-1.5"
        >
          <Languages size={14} />
          {c.topbar.langSwitchLabel}
        </button>

        {/* Avatar + logout dropdown — hidden on mobile */}
        <div className="relative hidden md:block" ref={avatarRef}>
          <button
            onClick={() => setAvatarOpen((v) => !v)}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-sand-100 transition-colors"
            aria-label={c.topbar.accountLabel}
          >
            <div className="w-8.5[34px] rounded-full bg-amber-600 flex items-center justify-center">
              <span className="text-[13px] font-semibold text-ink-900">{initials}</span>
            </div>
            <ChevronDown size={14} className="text-ink-400" />
          </button>

          {avatarOpen && (
            <div
              className={cn(
                'absolute top-[calc(100%+8px)] inset-e-0 z-50 w-52',
                'bg-paper border border-border rounded-xl shadow-(--shadow-md) animate-pop-in'
              )}
            >
              {/* User info */}
              <div className="px-3 py-3 border-b border-border">
                <p className="text-[14px] font-semibold text-ink-900 truncate">{clientName}</p>
                <p className="text-[12px] text-ink-500 truncate">{roleLabel}</p>
              </div>

              {/* Logout */}
              <div className="p-1.5">
                <button
                  onClick={() => {
                    setAvatarOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.25 rounded-lg text-[14px] text-danger-700 hover:bg-danger-100 transition-colors"
                >
                  <LogOut size={16} className="shrink-0" />
                  {c.topbar.logout}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
