/**
 * Client-side CSV download. No domain knowledge — callers pass already-localized
 * headers and stringified cells.
 */

/**
 * Wrap a cell so separators, quotes and newlines survive the round trip.
 * Values that start with `=`, `+`, `-` or `@` are prefixed with a single quote:
 * spreadsheets otherwise read them as formulas, which turns an exported phone
 * number like `+963...` into an error cell.
 */
function escapeCell(value: string | number | null | undefined): string {
  const raw = value == null ? '' : String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * Build a CSV from `headers` + `rows` and hand it to the browser as a download.
 *
 * The leading BOM is what makes Excel open the file as UTF-8; without it Arabic
 * names arrive as mojibake, which is the whole point of exporting a customer
 * list. Firefox/Safari need the anchor in the document, so it is appended and
 * removed rather than just clicked.
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','));
  const blob = new Blob(['﻿' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** `customers-2026-08-02` — a stable, sortable name for an exported list. */
export function dateStampedName(prefix: string): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}`;
}
