// ============================================================
// Couche d'accès aux données MÉNAGE — Supabase Flowtym Check-in
// ------------------------------------------------------------
// Cible la table réelle `hk_tasks` du backend Check-in
// (projet Supabase flowtym-housekeeping), scopée par hôtel.
// Remplace la donnée mock d'HousekeepingProvider/HotelProvider.
// ============================================================

import { supabase } from '@/lib/supabase';

// Statuts de tâche ménage — valeurs réelles de la contrainte CHECK
// `hk_tasks_status_check` du backend Check-in.
export const HK_STATUS = {
  pending: 'pending',
  inProgress: 'in_progress',
  done: 'done',
  validated: 'validated',
  skipped: 'skipped',
} as const;

export type HkTaskStatus = (typeof HK_STATUS)[keyof typeof HK_STATUS];

export interface HkStaffRef {
  first_name: string;
  last_name: string;
  color: string | null;
}

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
  /** Personnel d'étage assigné (jointure hk_staff via assigned_to). */
  assignee: HkStaffRef | null;
}

const TASK_COLUMNS =
  'id,hotel_id,room_id,room_number,task_type,status,priority,assigned_to,notes,started_at,completed_at,validated_at,validated_by,scheduled_for,reservation_id,created_at,updated_at';

const TASK_SELECT = `${TASK_COLUMNS},assignee:hk_staff!assigned_to(first_name,last_name,color)`;

export interface ListHkTasksParams {
  hotelId: string;
  /** Filtre par date planifiée (YYYY-MM-DD). */
  date?: string;
  /** Filtre par membre du personnel d'étage assigné (hk_staff.id). */
  assignedTo?: string;
}

export async function listHkTasks(params: ListHkTasksParams): Promise<HkTaskRow[]> {
  let query = supabase
    .from('hk_tasks')
    .select(TASK_SELECT)
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

export interface HkStaffRow {
  id: string;
  hotel_id: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  color: string | null;
}

export async function listHkStaff(hotelId: string): Promise<HkStaffRow[]> {
  const { data, error } = await supabase
    .from('hk_staff')
    .select('id,hotel_id,first_name,last_name,role,status,color')
    .eq('hotel_id', hotelId)
    .order('first_name', { ascending: true });
  if (error) {
    console.warn('[hk] listHkStaff error:', error.message);
    throw error;
  }
  return (data ?? []) as HkStaffRow[];
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
  return patchTask(id, { status: HK_STATUS.done, completed_at: new Date().toISOString() });
}

/** Validation par la gouvernante. */
export function validateHkTask(id: string, validatedBy: string) {
  return patchTask(id, {
    status: HK_STATUS.validated,
    validated_at: new Date().toISOString(),
    validated_by: validatedBy,
  });
}

/** Refuser / demander une reprise : la tâche repart en « à nettoyer ». */
export function redoHkTask(id: string) {
  return patchTask(id, { status: HK_STATUS.pending, completed_at: null, started_at: null });
}
