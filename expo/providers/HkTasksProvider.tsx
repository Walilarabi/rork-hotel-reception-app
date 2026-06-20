import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/providers/AuthProvider';
import {
  listHkTasks,
  listHkStaff,
  startHkTask,
  completeHkTask,
  validateHkTask,
  redoHkTask,
  type HkTaskRow,
  type HkStaffRow,
} from '@/lib/db/housekeeping';
import { isSupabaseConfigured } from '@/lib/supabase';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Données ménage RÉELLES (Supabase Check-in), scopées à l'hôtel de
 * l'utilisateur connecté : tâches du jour (hk_tasks) + équipe d'étage
 * (hk_staff). Remplace la donnée mock pour le module ménage.
 */
export const [HkTasksProvider, useHkTasks] = createContextHook(() => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const hotelId = currentUser?.hotelId ?? null;
  const enabled = Boolean(hotelId) && isSupabaseConfigured;

  const tasksQuery = useQuery({
    queryKey: ['hk-tasks', hotelId],
    enabled,
    queryFn: () => listHkTasks({ hotelId: hotelId as string, date: todayISO() }),
  });

  const staffQuery = useQuery({
    queryKey: ['hk-staff', hotelId],
    enabled,
    queryFn: () => listHkStaff(hotelId as string),
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['hk-tasks'] });
  }, [queryClient]);

  const startMutation = useMutation({ mutationFn: startHkTask, onSuccess: invalidate });
  const completeMutation = useMutation({ mutationFn: completeHkTask, onSuccess: invalidate });
  const redoMutation = useMutation({ mutationFn: redoHkTask, onSuccess: invalidate });
  const validateMutation = useMutation({
    mutationFn: (id: string) => validateHkTask(id, currentUser?.id ?? ''),
    onSuccess: invalidate,
  });

  return useMemo(
    () => ({
      tasks: (tasksQuery.data ?? []) as HkTaskRow[],
      staff: (staffQuery.data ?? []) as HkStaffRow[],
      isLoading: tasksQuery.isLoading || staffQuery.isLoading,
      isError: tasksQuery.isError,
      isConfigured: enabled,
      refetch: tasksQuery.refetch,
      hotelId,
      startTask: startMutation.mutate,
      completeTask: completeMutation.mutate,
      validateTask: validateMutation.mutate,
      redoTask: redoMutation.mutate,
    }),
    [tasksQuery.data, tasksQuery.isLoading, tasksQuery.isError, tasksQuery.refetch, staffQuery.data, staffQuery.isLoading, enabled, hotelId, startMutation.mutate, completeMutation.mutate, validateMutation.mutate, redoMutation.mutate],
  );
});
