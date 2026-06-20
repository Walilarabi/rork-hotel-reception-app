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
  is_npd: boolean;
  paused_at: string | null;
  elapsed_seconds: number;
  /** Personnel d'étage assigné (jointure hk_staff via assigned_to). */
  assignee: HkStaffRef | null;
  /** Chambre liée (jointure rooms via room_id). */
  room: { category: string | null; type: string | null; floor: number | null; number: string | null } | null;
}

const TASK_COLUMNS =
  'id,hotel_id,room_id,room_number,task_type,status,priority,assigned_to,notes,started_at,completed_at,validated_at,validated_by,scheduled_for,reservation_id,created_at,updated_at,is_npd,paused_at,elapsed_seconds';

const TASK_SELECT = `${TASK_COLUMNS},assignee:hk_staff!assigned_to(first_name,last_name,color),room:rooms!room_id(category,type,floor,number)`;

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

async function fetchTaskTimer(id: string): Promise<{ started_at: string | null; paused_at: string | null; elapsed_seconds: number }> {
  const { data, error } = await supabase
    .from('hk_tasks')
    .select('started_at,paused_at,elapsed_seconds')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as { started_at: string | null; paused_at: string | null; elapsed_seconds: number };
}

function secondsSince(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
}

/** Temps écoulé courant d'une tâche (chrono), en secondes. */
export function elapsedSeconds(task: Pick<HkTaskRow, 'status' | 'started_at' | 'paused_at' | 'elapsed_seconds'>): number {
  const running = task.status === HK_STATUS.inProgress && !task.paused_at;
  return (task.elapsed_seconds ?? 0) + (running ? secondsSince(task.started_at) : 0);
}

/** Démarrer le nettoyage d'une chambre (chrono à zéro). */
export function startHkTask(id: string) {
  return patchTask(id, {
    status: HK_STATUS.inProgress,
    started_at: new Date().toISOString(),
    paused_at: null,
    is_npd: false,
    elapsed_seconds: 0,
  });
}

/** Mettre en pause (ou NPD) : fige le chrono. */
export async function pauseHkTask(id: string, npd = false) {
  const t = await fetchTaskTimer(id);
  const add = t.paused_at ? 0 : secondsSince(t.started_at);
  return patchTask(id, {
    paused_at: new Date().toISOString(),
    is_npd: npd,
    elapsed_seconds: (t.elapsed_seconds ?? 0) + add,
  });
}

/** Reprendre une chambre en pause/NPD : relance le chrono. */
export function resumeHkTask(id: string) {
  return patchTask(id, {
    status: HK_STATUS.inProgress,
    started_at: new Date().toISOString(),
    paused_at: null,
    is_npd: false,
  });
}

/** Terminer (en attente de validation gouvernante). Fige le temps total. */
export async function completeHkTask(id: string) {
  const t = await fetchTaskTimer(id);
  const add = t.paused_at ? 0 : secondsSince(t.started_at);
  return patchTask(id, {
    status: HK_STATUS.done,
    completed_at: new Date().toISOString(),
    paused_at: new Date().toISOString(),
    elapsed_seconds: (t.elapsed_seconds ?? 0) + add,
  });
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
  return patchTask(id, { status: HK_STATUS.pending, completed_at: null, started_at: null, paused_at: null, elapsed_seconds: 0 });
}

// ---- Lien compte connecté → fiche personnel d'étage ----------------------

/** Retrouve l'id hk_staff lié au compte utilisateur connecté (ou null). */
export async function resolveStaffId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('hk_staff')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[hk] resolveStaffId error:', error.message);
    return null;
  }
  return data?.id ?? null;
}

// ---- Checklist -----------------------------------------------------------

export interface HkChecklistItem {
  id: string;
  label: string;
  order_index: number;
  checked: boolean;
}

/** Items de la checklist par défaut de l'hôtel + état coché pour une tâche. */
export async function getTaskChecklist(hotelId: string, taskId: string): Promise<HkChecklistItem[]> {
  const { data: cl } = await supabase
    .from('hk_checklists')
    .select('id')
    .eq('hotel_id', hotelId)
    .eq('is_default', true)
    .limit(1)
    .maybeSingle();
  if (!cl) return [];

  const [{ data: items }, { data: checks }] = await Promise.all([
    supabase.from('hk_checklist_items').select('id,label,order_index').eq('checklist_id', cl.id).order('order_index'),
    supabase.from('hk_task_checks').select('item_id,checked').eq('task_id', taskId),
  ]);

  const checkedSet = new Set((checks ?? []).filter((c) => c.checked).map((c) => c.item_id));
  return (items ?? []).map((i) => ({ id: i.id, label: i.label, order_index: i.order_index, checked: checkedSet.has(i.id) }));
}

/** Coche/décoche un item de checklist (upsert dans hk_task_checks). */
export async function setTaskCheck(hotelId: string, taskId: string, itemId: string, checked: boolean, userId: string) {
  const { error } = await supabase
    .from('hk_task_checks')
    .upsert(
      { hotel_id: hotelId, task_id: taskId, item_id: itemId, checked, checked_at: checked ? new Date().toISOString() : null, checked_by: checked ? userId : null },
      { onConflict: 'task_id,item_id' },
    );
  if (error) throw error;
}

// ---- Signalement → maintenance_tickets -----------------------------------

const INCIDENT_CATEGORY: Record<string, string> = {
  wc: 'plumbing',
  fuite: 'plumbing',
  ampoule: 'electrical',
  tv: 'electrical',
  clim: 'hvac',
  serrure: 'safety',
  mobilier: 'furniture',
  autre: 'general',
};

export interface CreateIncidentInput {
  hotelId: string;
  roomId: string | null;
  roomNumber: string | null;
  categoryKey: keyof typeof INCIDENT_CATEGORY;
  title: string;
  description?: string;
  reportedBy?: string;
  photoUrl?: string;
}

export async function createIncident(input: CreateIncidentInput) {
  const { error } = await supabase.from('maintenance_tickets').insert({
    hotel_id: input.hotelId,
    room_id: input.roomId,
    room_number: input.roomNumber,
    title: input.title,
    description: input.description ?? null,
    category: INCIDENT_CATEGORY[input.categoryKey] ?? 'general',
    priority: 'normal',
    status: 'open',
    reported_by: input.reportedBy ?? null,
    photos: input.photoUrl ? [input.photoUrl] : [],
  });
  if (error) throw error;
}

// ---- Objet trouvé → lost_found_items -------------------------------------

export interface CreateFoundItemInput {
  hotelId: string;
  roomNumber: string | null;
  description: string;
  foundBy?: string;
  storageLoc?: string;
  photoUrl?: string;
}

export async function createFoundItem(input: CreateFoundItemInput) {
  const { error } = await supabase.from('lost_found_items').insert({
    hotel_id: input.hotelId,
    room_num: input.roomNumber,
    description: input.description,
    found_by: input.foundBy ?? null,
    found_date: new Date().toISOString().slice(0, 10),
    status: 'declared',
    storage_loc: input.storageLoc ?? null,
    photo_url: input.photoUrl ?? null,
  });
  if (error) throw error;
}
