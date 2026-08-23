'use client';

interface PageHeaderProps {
  title: string;
  description: string;
  /** Page-level actions — export, create. Wraps under the title on a phone. */
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[24px] font-bold leading-tight text-ink-900">{title}</h1>
        <p className="mt-1 text-[13px] text-ink-500">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
