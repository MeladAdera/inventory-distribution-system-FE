'use client';

import { useState } from 'react';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

export function usePagination(initialLimit = 10) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: initialLimit,
    total: 0,
  });

  const goToPage = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(1, page),
    }));
  };

  const nextPage = () => {
    goToPage(pagination.page + 1);
  };

  const prevPage = () => {
    goToPage(pagination.page - 1);
  };

  const setLimit = (limit: number) => {
    setPagination((prev) => ({
      ...prev,
      limit,
      page: 1,
    }));
  };

  const setTotal = (total: number) => {
    setPagination((prev) => ({
      ...prev,
      total,
    }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const hasNextPage = pagination.page < totalPages;
  const hasPrevPage = pagination.page > 1;

  return {
    ...pagination,
    goToPage,
    nextPage,
    prevPage,
    setLimit,
    setTotal,
    totalPages,
    hasNextPage,
    hasPrevPage,
  };
}
