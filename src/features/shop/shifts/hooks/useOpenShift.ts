'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOnlineStatus } from '@/common/offline/connectivity/useOnlineStatus';
import { useAuthStore } from '@/features/auth/store/authStore';
import { UserRole } from '@/features/auth/types/enums';
import { shiftsApi } from '../api/shifts.api';
import {
  ShiftSessionStatus,
  type CloseShiftInput,
  type OpenShiftInput,
  type ShiftSession,
  type ShiftSessionListParams,
  type ShiftSessionRow,
} from '../types/shifts.types';

// The shop's open shift drives the sell gate and the top-bar chip, so it has to
// notice a shift someone else opened or closed on another till. Polling is the
// only mechanism the API offers. Query dedupes across every mounted consumer, and
// TanStack pauses the interval while the tab is hidden, so this is one request
// per 30s per open tab, not per component.
const OPEN_SHIFT_POLL_MS = 30_000;

/** The newest closed shift, for the opening-float suggestion. */
const LAST_CLOSED_PARAMS: ShiftSessionListParams = {
  page: 1,
  limit: 1,
  status: ShiftSessionStatus.CLOSED,
};

interface UseOpenShiftOptions {
  /**
   * Also fetch the previous shift's hand count for the opening-float
   * suggestion. Off by default: this hook is mounted on every client page by
   * the top-bar chip, and only the start-shift form has any use for it.
   */
  withSuggestedFloat?: boolean;
}

/**
 * The shop's open shift — is anyone working, is it me, and starting/ending it.
 *
 * One shop has at most one open session, so a single row answers both questions.
 */
export function useOpenShift({ withSuggestedFloat = false }: UseOpenShiftOptions = {}) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isOnline = useOnlineStatus();

  // RequestUser.id is a string while every API id is a number — comparing them
  // raw silently never matches. Same coercion the settings pages use.
  const currentUserId = user ? Number(user.id) : null;
  const isOwner = user?.role === UserRole.SHOP_OWNER;

  const openQuery = useQuery({
    queryKey: ['shifts', 'open'],
    queryFn: () => shiftsApi.getOpen(),
    staleTime: 0,
    refetchInterval: OPEN_SHIFT_POLL_MS,
    refetchOnWindowFocus: true,
  });

  /**
   * Previous shift's hand count, which the start form offers as the float —
   * that hand-off is what keeps the money chain intact from shift to shift.
   *
   * Owner-only: GET /shifts/sessions is 403 for an EMPLOYEE, and an employee has
   * no other way to reach the last closed shift (sessions/:id is readable only
   * for shifts they worked, and there is no way to discover the id). So the very
   * people who start most shifts get no suggestion. Gated on role rather than
   * left to 403 on every mount — see the README for the open question.
   */
  const lastClosedQuery = useQuery({
    queryKey: ['shifts', 'sessions', LAST_CLOSED_PARAMS],
    queryFn: () => shiftsApi.getSessions(LAST_CLOSED_PARAMS),
    enabled: withSuggestedFloat && isOwner,
    staleTime: 0,
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ['shifts'], refetchType: 'all' });
  }

  const openMutation = useMutation({
    mutationFn: (data: OpenShiftInput) => shiftsApi.open(data),
    onSuccess: invalidate,
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CloseShiftInput }) => shiftsApi.close(id, data),
    onSuccess: invalidate,
  });

  const openShift: ShiftSession | null = openQuery.data?.data ?? null;
  const lastClosed: ShiftSessionRow | undefined = lastClosedQuery.data?.data?.data?.[0];

  const isMine =
    openShift !== null && currentUserId !== null && openShift.user_id === currentUserId;

  return {
    openShift,
    hasOpenShift: openShift !== null,
    /** True when the open shift is the current user's own. */
    isMine,
    /** Whose shift is open — for the "Ahmad's shift is still open" branch. */
    holderName: openShift?.user_name ?? null,
    /**
     * Suggested opening float, or null when there is nothing to suggest (no
     * closed shift yet, or the reader is an employee — see above). Never
     * defaulted to "0.00": an empty field asks for a count, a zero asserts one.
     */
    suggestedFloat: lastClosed?.counted_cash ?? null,
    /**
     * Whether the till should be replaced by "start your shift".
     *
     * Only ever true on a confirmed "nobody is working": still loading, or
     * offline with no answer, leaves selling open. Gating is a discipline tool,
     * not a lock — it must never strand a shop that cannot reach the server.
     */
    shouldBlockSelling:
      isOnline && !openQuery.isLoading && !openQuery.isError && openShift === null,
    isLoading: openQuery.isLoading,
    isFetching: openQuery.isFetching,
    error: openQuery.error,
    startShift: openMutation.mutateAsync,
    isStarting: openMutation.isPending,
    closeShift: closeMutation.mutateAsync,
    isClosing: closeMutation.isPending,
  };
}
