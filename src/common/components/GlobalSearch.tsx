'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, User } from 'lucide-react';
import { productsApi } from '@/features/shared/products/api/products.api';
import { usersApi } from '@/features/admin/users/api/users.api';
import { useAuth } from '@/features/auth';
import { useI18n } from '@/providers/I18nProvider';
import { UserRole } from '@/features/auth/types/enums';
import type { Product } from '@/features/shared/products/types/products.types';
import type { User as UserType } from '@/features/admin/users/types/users.types';

const MIN_CHARS = 2;

export function GlobalSearch() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const s = t.topbar.search as {
    searching: string;
    noResults: string;
    sections: { products: string; users: string };
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Employees cannot list users at all
  const canSearchUsers = user?.role !== UserRole.EMPLOYEE;
  const enabled = debouncedSearch.length >= MIN_CHARS;

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Open/close based on input length
  useEffect(() => {
    setIsOpen(search.length >= MIN_CHARS);
  }, [search]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['global-search-products', debouncedSearch],
    queryFn: () => productsApi.list({ search: debouncedSearch, limit: 5 }),
    enabled,
    staleTime: 10_000,
  });

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['global-search-users', debouncedSearch],
    queryFn: () => usersApi.list({ search: debouncedSearch, limit: 4 }),
    enabled: enabled && canSearchUsers,
    staleTime: 10_000,
  });

  const products: Product[] = productsData?.data?.data ?? [];
  const users: UserType[] = usersData?.data?.data ?? [];
  const isLoading = loadingProducts || (canSearchUsers && loadingUsers);
  const hasResults = products.length > 0 || users.length > 0;

  const productPath = user?.role === UserRole.WAREHOUSE_ADMIN ? '/products' : '/client/inventory';
  const userPath = user?.role === UserRole.WAREHOUSE_ADMIN ? '/users' : '/client/employees';

  function handleSelect(path: string) {
    router.push(path);
    setSearch('');
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="relative hidden lg:block w-75">
      {/* Input */}
      <div className="flex items-center h-9.5 bg-paper border border-border rounded-lg px-3 gap-2">
        <Search size={15} className="text-ink-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.topbar.searchPlaceholder}
          className="flex-1 text-[13px] text-ink-900 placeholder:text-ink-400 bg-transparent outline-none"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] inset-s-0-0 inset-e-0 z-50 bg-paper border border-border rounded-xl shadow-(--shadow-md) overflow-hidden animate-pop-in">
          {isLoading ? (
            <p className="px-4 py-3 text-[13px] text-ink-400">{s.searching}</p>
          ) : !hasResults ? (
            <p className="px-4 py-3 text-[13px] text-ink-400">
              {s.noResults.replace('{q}', debouncedSearch)}
            </p>
          ) : (
            <>
              {/* Products section */}
              {products.length > 0 && (
                <div>
                  <p className="px-3 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    {s.sections.products}
                  </p>
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelect(productPath)}
                      className="flex items-center gap-3 w-full px-3 py-2 hover:bg-sand-100 transition-colors text-start"
                    >
                      <Package size={15} className="text-ink-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-ink-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-[12px] text-ink-500 truncate">
                          {product.category_name} · ل.س {Number(product.price).toFixed(2)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Users section */}
              {canSearchUsers && users.length > 0 && (
                <div className={products.length > 0 ? 'border-t border-border' : ''}>
                  <p className="px-3 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    {s.sections.users}
                  </p>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleSelect(userPath)}
                      className="flex items-center gap-3 w-full px-3 py-2 hover:bg-sand-100 transition-colors text-start"
                    >
                      <User size={15} className="text-ink-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-ink-900 truncate">{u.name}</p>
                        <p className="text-[12px] text-ink-500 truncate">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
