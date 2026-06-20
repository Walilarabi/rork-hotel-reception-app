import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/providers/AuthProvider';
import {
  listHkTasks,
  startHkTask,
  completeHkTask,
  validateHkTask,
  redoHkTask,
  type HkTaskRow,
} from '@/lib/db/housekeeping';
import { isSupabaseConfigured } from '@/lib/supabase';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Tâches ménage RÉELLES (Supabase Check-in), scopées à l'hôtel de
 * l'utilisateur connecté. Remplace la donnée mock pour le module ménage.
 */
export const [HkTasksProvider, useHkTasks] = createContextHook(() => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const hotelId = currentUser?.hotelId ?? null;
  // La femme de chambre ne voit que ses chambres ; les superviseurs voient tout.
  const assignedTo = currentUser?.role === 'femme_de_chambre' ? currentUser?.id : undefined;

  const queryKey = useMemo(() => ['hk-tasks', hotelId, assignedTo ?? 'all'], [hotelId, assignedTo]);

  const tasksQuery = useQuery({
    queryKey,
    enabled: Boolean(hotelId) && isSupabaseConfigured,
    queryFn: () => listHkTasks({ hotelId: hotelId as string, date: todayISO(), assignedTo }),
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
      isLoading: tasksQuery.isLoading,
      isError: tasksQuery.isError,
      refetch: tasksQuery.refetch,
      hotelId,
      startTask: startMutation.mutate,
      completeTask: completeMutation.mutate,
      validateTask: validateMutation.mutate,
      redoTask: redoMutation.mutate,
    }),
    [tasksQuery.data, tasksQuery.isLoading, tasksQuery.isError, tasksQuery.refetch, hotelId, startMutation.mutate, completeMutation.mutate, validateMutation.mutate, redoMutation.mutate],
  );
});
