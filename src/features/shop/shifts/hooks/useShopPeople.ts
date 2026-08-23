'use client';

import { useMemo } from 'react';
import { useUsers } from '@/features/admin/users/hooks/useUsers';
import type { User } from '@/features/admin/users/types/users.types';

// One page wide enough to cover any shop's staff — this is a name lookup, not a
// browsable list, and a second page would silently leave ids unresolved.
const PEOPLE_LIMIT = 100;

/**
 * Everyone in the shop who could have worked or closed a shift.
 *
 * Exists because the sessions API returns `closed_by` as a bare id with no
 * accompanying name, while the handoff asks for "closed by Sara" on Ahmad's
 * shift. Resolved client-side until the backend carries a `closed_by_name`.
 *
 * Deactivated staff are kept: they still appear on shifts they worked before
 * they left, and dropping them would turn those rows back into bare ids.
 */
export function useShopPeople() {
  const { users, isLoading } = useUsers({ limit: PEOPLE_LIMIT });

  const people: User[] = useMemo(() => users?.data?.data ?? [], [users]);

  const userNames = useMemo(
    () => new Map<number, string>(people.map((u) => [u.id, u.name])),
    [people]
  );

  return {
    people: useMemo(() => people.map((u) => ({ id: u.id, name: u.name })), [people]),
    userNames,
    isLoading,
  };
}
