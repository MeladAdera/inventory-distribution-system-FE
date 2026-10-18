/**
 * Collapses a paginated list endpoint into one envelope holding every row.
 *
 * The API has no page-size ceiling but defaults to 10 rows, and several shop
 * screens render a whole collection at once (the warehouse catalog, the shop's
 * inventory). Fetching a single page of 100 silently dropped everything past
 * row 100 — a 141-product catalog rendered as 100. Page 1 reports
 * `totalPages`; the remaining pages are fetched in parallel and merged.
 *
 * Rows are de-duplicated by `id`: a row can straddle a page boundary and come
 * back twice when the server's ordering has ties.
 */
export interface PaginatedEnvelope<T> {
  success?: boolean;
  data?: {
    data?: T[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  timestamp?: string;
}

/** Rows requested per page when fetching a whole collection. */
export const ALL_PAGES_SIZE = 100;

export async function fetchAllPages<T extends { id: number }>(
  fetchPage: (page: number) => Promise<PaginatedEnvelope<T>>
): Promise<PaginatedEnvelope<T>> {
  const first = await fetchPage(1);
  const totalPages = first?.data?.totalPages ?? 1;
  const rest = await Promise.all(
    Array.from({ length: Math.max(totalPages - 1, 0) }, (_, i) => fetchPage(i + 2))
  );

  const seen = new Set<number>();
  const rows: T[] = [];
  for (const envelope of [first, ...rest]) {
    for (const row of envelope?.data?.data ?? []) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      rows.push(row);
    }
  }

  // Same envelope shape as a single page, so cached consumers (setQueryData,
  // the offline persister) keep reading `data.data` exactly as before.
  return {
    ...first,
    data: {
      ...first?.data,
      data: rows,
      page: 1,
      limit: rows.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };
}
