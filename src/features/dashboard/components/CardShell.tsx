import { type ReactNode } from 'react';

interface CardShellProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
}

export function CardShell({ title, action, children, noPadding }: CardShellProps) {
  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
        {action && <div>{action}</div>}
      </div>
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}
