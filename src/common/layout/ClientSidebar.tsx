'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Warehouse } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { getInitials } from '@/common/utils/string.utils';
import { useI18n } from '@/providers/I18nProvider';
import { useAuth } from '@/features/auth';
import { getClientNavItems } from './clientNavConfig';

interface ClientSidebarProps {
  fluid?: boolean;
}

export function ClientSidebar({ fluid = false }: ClientSidebarProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const { user } = useAuth();

  const c = t.client;
  const nav = c.nav as Record<string, string>;
  const userName = user?.name ?? '';
  const roleLabel = user
    ? ((t.settings.profile.roles as Record<string, string>)[user.role] ?? user.role)
    : '';
  const initials = getInitials(userName);
  const navItems = getClientNavItems(user?.role);

  return (
    <aside
      className={cn(
        'flex flex-col h-screen shrink-0',
        'bg-ink-900 border-e border-white/8',
        'w-65',
        !fluid && 'hidden lg:flex'
      )}
    >
      {/* ── Brand ── */}
      <div className="flex items-center gap-3 h-16 px-4.5 border-b border-white/8 shrink-0">
        <div className="w-8.5 h-8.5 rounded-lg bg-amber-600 flex items-center justify-center shrink-0">
          <Warehouse size={19} className="text-ink-900" />
        </div>
        <div className="overflow-hidden">
          <p className="font-serif text-[19px] font-semibold leading-[1.1] text-sand-100 truncate">
            {c.brand.name}
          </p>
          <p className="text-[11px] text-[rgba(245,239,228,0.66)] truncate">{c.brand.sub}</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.75">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.25 rounded-lg text-[14px] font-medium transition-colors',
                active
                  ? 'bg-white/[0.07] text-sand-100'
                  : 'text-[rgba(245,239,228,0.66)] hover:bg-white/6 hover:text-sand-100'
              )}
            >
              {active && (
                <span
                  className="absolute top-1/2 -translate-y-1/2 w-0.75 h-5.5 rounded-full bg-amber-600"
                  style={{ insetInlineStart: '-12px' }}
                />
              )}
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{nav[item.id] ?? item.id}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── User block ── */}
      <div className="p-3 border-t border-white/8 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.25">
          <div className="w-8.5 h-8.5 rounded-full bg-amber-600 flex items-center justify-center shrink-0">
            <span className="text-[13px] font-semibold text-ink-900">{initials}</span>
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-[13px] font-medium text-sand-100 truncate">{userName}</p>
            <p className="text-[11px] text-[rgba(245,239,228,0.66)] truncate">{roleLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
