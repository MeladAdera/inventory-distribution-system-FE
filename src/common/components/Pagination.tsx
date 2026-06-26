'use client';

import { useI18n } from '@/providers/I18nProvider';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, total, limit, onPageChange }: PaginationProps) {
  const { t } = useI18n();
  const pg = t.sidebar.pagination;

  const totalPages = Math.ceil(total / limit);
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-600">
        {pg.showing} {start}–{end} {pg.of} {total} {pg.results}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          {pg.previous}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          {pg.next}
        </Button>
      </div>
    </div>
  );
}
