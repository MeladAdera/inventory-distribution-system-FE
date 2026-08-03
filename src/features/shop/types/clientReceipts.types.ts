import type { ReceiptListItem } from '@/features/shared/receipts';

/**
 * Which slice of the loaded page the toolbar is showing.
 *
 * All three are applied client-side. `GET /receipts` filters by date range only,
 * so the range picker narrows on the server and these narrow what is on screen —
 * the footer reports both numbers so the difference is never hidden.
 */
export enum ReceiptView {
  ALL = 'ALL',
  THIS_WEEK = 'THIS_WEEK',
  WITH_NOTES = 'WITH_NOTES',
}

/** Headline figures for the receipts page. Never page-scoped. */
export interface ReceiptStats {
  /** Every receipt on record, cancelled ones included. */
  total: number;
  /** Receipts raised since the start of this week, cancellations excluded. */
  thisWeek: number;
  /** Line items consumed, cancellations excluded — they put the stock back. */
  itemsConsumed: number;
  /** ISO timestamp of the newest receipt, or null when there are none. */
  lastReceiptAt: string | null;
}

/** Rows split into the two buckets the mobile list groups by. */
export interface GroupedReceipts {
  thisWeek: ReceiptListItem[];
  earlier: ReceiptListItem[];
}
