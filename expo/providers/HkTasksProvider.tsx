import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/providers/AuthProvider';
import {
  listHkTasks,
  listHkStaff,
  resolveStaffId,
  startHkTask,
  pauseHkTask,
  resumeHkTask,
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
 * l'utilisateur connecté. Si le compte est lié à une fiche hk_staff
 * (femme de chambre), seules SES chambres sont remontées ; sinon
 * (gouvernante/direction) toutes les chambres de l'hôtel (supervision).
 */
export const [HkTasksProvider, useHkTasks] = createContextHook(() => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const hotelId = currentUser?.hotelId ?? null;
  const userId = currentUser?.id ?? null;
  const enabled = Boolean(hotelId) && isSupabaseConfigured;

  const staffIdQuery = useQuery({
    queryKey: ['hk-my-staff', userId],
    enabled: Boolean(userId) && isSupabaseConfigured,
    queryFn: () => resolveStaffId(userId as string),
  });
  const myStaffId = staffIdQuery.data ?? null;

  const tasksQuery = useQuery({
    queryKey: ['hk-tasks', hotelId, myStaffId ?? 'all'],
    enabled: enabled && !staffIdQuery.isLoading,
    queryFn: () =>
      listHkTasks({ hotelId: hotelId as string, date: todayISO(), assignedTo: myStaffId ?? undefined }),
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
  const resumeMutation = useMutation({ mutationFn: resumeHkTask, onSuccess: invalidate });
  const redoMutation = useMutation({ mutationFn: redoHkTask, onSuccess: invalidate });
  const pauseMutation = useMutation({ mutationFn: (p: { id: string; npd?: boolean }) => pauseHkTask(p.id, p.npd), onSuccess: invalidate });
  const validateMutation = useMutation({
    mutationFn: (id: string) => validateHkTask(id, currentUser?.id ?? ''),
    onSuccess: invalidate,
  });

  const getTask = useCallback(
    (id: string): HkTaskRow | undefined => (tasksQuery.data ?? []).find((t) => t.id === id),
    [tasksQuery.data],
  );

  return useMemo(
    () => ({
      tasks: (tasksQuery.data ?? []) as HkTaskRow[],
      staff: (staffQuery.data ?? []) as HkStaffRow[],
      myStaffId,
      isPersonal: Boolean(myStaffId),
      isLoading: tasksQuery.isLoading || staffQuery.isLoading || staffIdQuery.isLoading,
      isError: tasksQuery.isError,
      isConfigured: enabled,
      refetch: tasksQuery.refetch,
      invalidate,
      hotelId,
      getTask,
      startTask: startMutation.mutate,
      pauseTask: pauseMutation.mutate,
      resumeTask: resumeMutation.mutate,
      completeTask: completeMutation.mutate,
      validateTask: validateMutation.mutate,
      redoTask: redoMutation.mutate,
    }),
    [tasksQuery.data, tasksQuery.isLoading, tasksQuery.isError, tasksQuery.refetch, staffQuery.data, staffQuery.isLoading, staffIdQuery.isLoading, myStaffId, enabled, hotelId, getTask, invalidate, startMutation.mutate, pauseMutation.mutate, resumeMutation.mutate, completeMutation.mutate, validateMutation.mutate, redoMutation.mutate],
  );
});
