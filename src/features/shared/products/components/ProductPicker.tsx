'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, Plus, Check } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useProducts } from '../hooks/useProducts';
import type { Product, ProductSource } from '../types/products.types';

const SEARCH_DEBOUNCE_MS = 300;
/** Enough to scan without turning the panel into its own paginated list. */
const RESULT_LIMIT = 8;

interface ProductPickerProps {
  onPick: (product: Product) => void;
  /** Offers a "＋ New product" row. Omit to hide the escape hatch entirely. */
  onCreateNew?: (searchTerm: string) => void;
  /** Products already chosen — shown ticked, and picking one again is a merge, not a duplicate. */
  takenIds?: Set<number>;
  /**
   * Narrow the search to one side of the catalog.
   *
   * Omit to offer everything the caller may reference — for a shop that is its
   * own products plus the warehouse's. The warehouse stocking its OWN shelves
   * passes `WAREHOUSE`, because a shop's local product is not something it can
   * hold.
   */
  source?: ProductSource;
  /** Blocks picking once the caller is at its ceiling (a bill takes at most 200 lines). */
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Search the catalog and pick a product.
 *
 * Results render inline, directly beneath the field, rather than in a floating
 * dropdown. Every caller so far lives inside a scrolling modal, where an
 * absolutely positioned panel gets clipped by the dialog's overflow — pushing
 * the page down instead is both simpler and immune to it.
 *
 * The search is server-side (`GET /products?search=`) because a catalog is not
 * a list you can hold in a `<select>` — rendering every product as an option
 * means fetching the whole book to let someone pick one thing out of it.
 */
export function ProductPicker({
  onPick,
  onCreateNew,
  takenIds,
  source,
  disabled = false,
  autoFocus = false,
}: ProductPickerProps) {
  const { t } = useI18n();
  const pk = t.products.picker;

  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [term]);

  // Only active products can be picked — an inactive one is a 404 from the
  // server's point of view, so it should never be offered.
  const { products, isLoading } = useProducts({
    search: debounced || undefined,
    limit: RESULT_LIMIT,
    is_active: true,
    source,
  });

  // While a new search is in flight the previous results are still on screen;
  // showing them as final would let the user pick a product they can no longer
  // see a reason for. `isStale` greys them out instead of blanking the panel.
  const isStale = term.trim() !== debounced;
  const results = useMemo(() => products.slice(0, RESULT_LIMIT), [products]);
  const showEmpty = !isLoading && !isStale && debounced !== '' && results.length === 0;

  function handlePick(product: Product) {
    if (disabled) return;
    onPick(product);
    // Cleared so the next scan starts from nothing — the picked product is now
    // visible as a line, which is a better confirmation than a filled field.
    setTerm('');
    setDebounced('');
  }

  return (
    <div>
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 text-ink-400"
        />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={pk.placeholder}
          className="w-full rounded-lg border border-border bg-page py-2 pe-3 ps-9 text-[14px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-amber-500 disabled:opacity-60"
        />
        {(isLoading || isStale) && term !== '' && (
          <Loader2
            size={14}
            className="absolute inset-e-3 top-1/2 -translate-y-1/2 animate-spin text-ink-400"
          />
        )}
      </div>

      {term !== '' && (
        <div className="mt-1.5 overflow-hidden rounded-lg border border-border bg-paper">
          <ul className={`max-h-56 overflow-y-auto ${isStale ? 'opacity-50' : ''}`}>
            {results.map((product) => {
              const taken = takenIds?.has(product.id) ?? false;
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(product)}
                    disabled={disabled}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-start transition-colors hover:bg-sand-100 disabled:opacity-60"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {taken && <Check size={13} className="shrink-0 text-success-700" />}
                      <span className="truncate text-[14px] text-ink-900">{product.name}</span>
                      {product.barcode && (
                        <span className="shrink-0 font-mono text-[11px] text-ink-400" dir="ltr">
                          {product.barcode}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-[12px] text-ink-500">
                      {product.category_name}
                    </span>
                  </button>
                </li>
              );
            })}

            {showEmpty && (
              <li className="px-3 py-3 text-[13px] text-ink-500">
                {pk.noResults.replace('{term}', debounced)}
              </li>
            )}
          </ul>

          {/* Pinned below the results, not inside them: it must stay reachable
              when the search DID match something but not the right thing. */}
          {onCreateNew && (
            <button
              type="button"
              onClick={() => onCreateNew(term.trim())}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-start text-[13px] font-medium text-amber-700 transition-colors hover:bg-amber-50"
            >
              <Plus size={14} className="shrink-0" />
              {term.trim() ? pk.createNamed.replace('{term}', term.trim()) : pk.createNew}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
