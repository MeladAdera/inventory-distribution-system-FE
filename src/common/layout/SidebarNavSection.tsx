import Link from 'next/link';
import { cn } from '@/common/utils/cn';
import type { NavItem } from './navConfig';

export interface NavSectionProps {
  label?: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  nav: Record<string, string>;
}

export function NavSection({ label, items, pathname, collapsed, nav }: NavSectionProps) {
  return (
    <div className="flex flex-col gap-0.75">
      {label && (
        <p className="px-3 pt-1 pb-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-400 select-none">
          {label}
        </p>
      )}
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? (nav[item.id] ?? item.id) : undefined}
            className={cn(
              'relative flex items-center rounded-lg transition-colors',
              collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2.25',
              active
                ? 'bg-sand-200 text-ink-900'
                : 'text-ink-600 hover:bg-sand-200 hover:text-ink-900'
            )}
          >
            {active && (
              <span
                className="absolute top-1/2 -translate-y-1/2 w-0.75 h-5.5 rounded-full bg-amber-600"
                style={{ insetInlineStart: '-12px' }}
              />
            )}

            <Icon size={18} className="shrink-0" />

            {!collapsed && (
              <>
                <span className="flex-1 text-[14px] font-medium">{nav[item.id] ?? item.id}</span>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'font-mono text-[11px] px-1.75 py-px rounded-full',
                      item.badgeVariant === 'danger'
                        ? 'bg-danger-100 text-danger-700'
                        : 'bg-paper border border-border text-ink-500'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
}
