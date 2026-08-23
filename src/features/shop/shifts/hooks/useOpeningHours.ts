'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { shiftsApi } from '../api/shifts.api';
import { WEEKDAYS, type OpeningHours, type UpdateOpeningHoursInput } from '../types/shifts.types';

/**
 * The shop's trading week.
 *
 * The API always returns all 7 days, so the grid never has holes and this hook
 * does no filling-in of its own.
 */
export function useOpeningHours() {
  const queryClient = useQueryClient();

  const hoursQuery = useQuery({
    queryKey: ['shifts', 'opening-hours'],
    queryFn: () => shiftsApi.getOpeningHours(),
    staleTime: 0,
  });

  const saveMutation = useMutation({
    mutationFn: (data: UpdateOpeningHoursInput) => shiftsApi.updateOpeningHours(data),
    // Opening hours bound where slots may sit and feed each slot's
    // duration_minutes, so templates are stale the moment hours move.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'], refetchType: 'all' }),
  });

  const hours: OpeningHours | null = hoursQuery.data?.data ?? null;

  return {
    hours,
    /** Ordered 0–6 as the API returns them; empty until loaded. */
    days: hours?.days ?? [],
    timezone: hours?.timezone ?? null,
    /** Weekdays the shop actually trades — what the slot editor may target. */
    openWeekdays: WEEKDAYS.filter(
      (w) => hours?.days.find((d) => d.weekday === w)?.is_closed === false
    ),
    isLoading: hoursQuery.isLoading,
    error: hoursQuery.error,
    saveHours: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
