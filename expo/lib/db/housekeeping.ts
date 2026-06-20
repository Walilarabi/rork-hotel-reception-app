// ============================================================
// Couche d'accès aux données MÉNAGE — Supabase Flowtym Check-in
// ------------------------------------------------------------
// Cible la table réelle `hk_tasks` du backend Check-in
// (projet Supabase flowtym-housekeeping), scopée par hôtel.
// Remplace la donnée mock d'HousekeepingProvider/HotelProvider.
// ============================================================

import { supabase } from '@/lib/supabase';

// Statuts de tâche ménage. La colonne est en `text` côté DB :
// ces valeurs DOIVENT rester alignées avec celles utilisées par
// l'app web Flowtym Check-in pour l'interopérabilité.
export const HK_STATUS = {
  pending: 'pending',
  inProgress: 'in_progress',
  completed: 'completed',
  validated: 'validated',
  toRedo: 'to_redo',
} as const;

export type HkTaskStatus = (typeof HK_STATUS)[keyof typeof HK_STATUS];

export interface HkTaskRow {
  id: string;
  hotel_id: string;
  room_id: string | null;
  room_number: string | null;
  task_type: string | null;
  status: string;
  priority: string | null;
  assigned_to: string | null;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  validated_at: string | null;
  validated_by: string | null;
  scheduled_for: string | null;
  reservation_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const TASK_COLUMNS =
  'id,hotel_id,room_id,room_number,task_type,status,priority,assigned_to,notes,started_at,completed_at,validated_at,validated_by,scheduled_for,reservation_id,created_at,updated_at';

export interface ListHkTasksParams {
  hotelId: string;
  /** Filtre par date planifiée (YYYY-MM-DD). */
  date?: string;
  /** Filtre par utilisateur assigné (femme de chambre). */
  assignedTo?: string;
}

export async function listHkTasks(params: ListHkTasksParams): Promise<HkTaskRow[]> {
  let query = supabase
    .from('hk_tasks')
    .select(TASK_COLUMNS)
    .eq('hotel_id', params.hotelId);

  if (params.date) query = query.eq('scheduled_for', params.date);
  if (params.assignedTo) query = query.eq('assigned_to', params.assignedTo);

  const { data, error } = await query
    .order('priority', { ascending: true })
    .order('room_number', { ascending: true });

  if (error) {
    console.warn('[hk] listHkTasks error:', error.message);
    throw error;
  }
  return (data ?? []) as HkTaskRow[];
}

async function patchTask(id: string, patch: Record<string, unknown>): Promise<HkTaskRow> {
  const { data, error } = await supabase
    .from('hk_tasks')
    .update(patch)
    .eq('id', id)
    .select(TASK_COLUMNS)
    .single();
  if (error) {
    console.warn('[hk] patchTask error:', error.message);
    throw error;
  }
  return data as HkTaskRow;
}

/** Démarrer le nettoyage d'une chambre. */
export function startHkTask(id: string) {
  return patchTask(id, { status: HK_STATUS.inProgress, started_at: new Date().toISOString() });
}

/** Marquer le nettoyage terminé (passe en attente de validation gouvernante). */
export function completeHkTask(id: string) {
  return patchTask(id, { status: HK_STATUS.completed, completed_at: new Date().toISOString() });
}

/** Validation par la gouvernante. */
export function validateHkTask(id: string, validatedBy: string) {
  return patchTask(id, {
    status: HK_STATUS.validated,
    validated_at: new Date().toISOString(),
    validated_by: validatedBy,
  });
}

/** Refuser / demander une reprise. */
export function redoHkTask(id: string) {
  return patchTask(id, { status: HK_STATUS.toRedo });
}
