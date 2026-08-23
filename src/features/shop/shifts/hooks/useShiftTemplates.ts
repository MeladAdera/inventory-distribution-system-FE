'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { shiftsApi } from '../api/shifts.api';
import {
  MAX_SLOTS_PER_WEEKDAY,
  WEEKDAYS,
  type AssignEmployeesInput,
  type CreateShiftTemplateInput,
  type ShiftTemplate,
  type UpdateShiftTemplateInput,
  type Weekday,
} from '../types/shifts.types';

/**
 * The weekly shift plan: slots per weekday, and who is on each rota.
 *
 * Overlap, slot limits and outside-opening-hours are all judged by the server.
 * This hook deliberately adds no client-side guard of its own — in particular
 * touching slots (08:00–16:00 and 16:00–24:00) are adjacent, not conflicting,
 * and a naive guard would reject the most common split there is.
 */
export function useShiftTemplates() {
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['shifts', 'templates'],
    queryFn: () => shiftsApi.getTemplates(),
    staleTime: 0,
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ['shifts'], refetchType: 'all' });
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateShiftTemplateInput) => shiftsApi.createTemplate(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateShiftTemplateInput }) =>
      shiftsApi.updateTemplate(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => shiftsApi.deleteTemplate(id),
    onSuccess: invalidate,
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssignEmployeesInput }) =>
      shiftsApi.assignEmployees(id, data),
    onSuccess: invalidate,
  });

  const templates: ShiftTemplate[] = useMemo(
    () => templatesQuery.data?.data ?? [],
    [templatesQuery.data]
  );

  /** Slots grouped into the 7 columns the week grid renders, order preserved. */
  const byWeekday = useMemo(() => {
    const map = new Map<Weekday, ShiftTemplate[]>(WEEKDAYS.map((w) => [w, []]));
    templates.forEach((tpl) => map.get(tpl.weekday)?.push(tpl));
    return map;
  }, [templates]);

  return {
    templates,
    byWeekday,
    /** False once a day holds 4 slots — the server rejects a 5th. */
    canAddSlot: (weekday: Weekday) => (byWeekday.get(weekday)?.length ?? 0) < MAX_SLOTS_PER_WEEKDAY,
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateTemplate: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteTemplate: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    assignEmployees: assignMutation.mutateAsync,
    isAssigning: assignMutation.isPending,
  };
}
