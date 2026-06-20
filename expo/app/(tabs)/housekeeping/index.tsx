import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, CheckCircle2, ShieldCheck, Star, RotateCcw } from 'lucide-react-native';
import { FT } from '@/constants/flowtym';
import { useAuth } from '@/providers/AuthProvider';
import { useHkTasks } from '@/providers/HkTasksProvider';
import { HK_STATUS, type HkTaskRow } from '@/lib/db/housekeeping';

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'done' | 'validated';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'À nettoyer', color: FT.danger, bg: FT.dangerSoft },
  in_progress: { label: 'En cours', color: FT.info, bg: FT.infoSoft },
  done: { label: 'À contrôler', color: FT.warning, bg: FT.warningSoft },
  validated: { label: 'Propre', color: FT.success, bg: FT.successSoft },
  skipped: { label: 'Ignoré', color: FT.textMuted, bg: FT.surfaceHover },
};

const TYPE_LABEL: Record<string, string> = {
  checkout: 'Départ',
  cleaning: 'Recouche',
  turndown: 'Couverture',
  deep_clean: 'Grand ménage',
  inspection: 'Inspection',
};

function priorityMeta(p: string | null): { label: string; color: string } | null {
  if (p === 'high' || p === 'urgent') return { label: 'Critique', color: FT.danger };
  if (p === 'normal') return { label: 'Moyenne', color: FT.warning };
  if (p === 'low') return { label: 'Basse', color: FT.textMuted };
  return null;
}

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'pending', label: 'À nettoyer' },
  { id: 'in_progress', label: 'En cours' },
  { id: 'done', label: 'À contrôler' },
  { id: 'validated', label: 'Propre' },
];

export default function HousekeepingScreen() {
  const { currentUser } = useAuth();
  const { tasks, staff, isLoading, isConfigured, refetch, startTask, completeTask, validateTask, redoTask } = useHkTasks();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tasks.length, pending: 0, in_progress: 0, done: 0, validated: 0 };
    tasks.forEach((t) => { c[t.status] = (c[t.status] ?? 0) + 1; });
    return c;
  }, [tasks]);

  const progress = useMemo(() => {
    const total = tasks.length;
    const ready = tasks.filter((t) => t.status === HK_STATUS.validated).length;
    return { total, ready, pct: total ? Math.round((ready / total) * 100) : 0 };
  }, [tasks]);

  const filtered = useMemo(
    () => (filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (!isConfigured) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Backend non connecté</Text>
          <Text style={styles.emptySub}>Configurez EXPO_PUBLIC_SUPABASE_URL / ANON_KEY pour charger les tâches réelles.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Housekeeping</Text>
          <Text style={styles.subtitle}>{currentUser?.hotelName ?? 'Mon hôtel'} · aujourd&apos;hui</Text>
        </View>
        <View style={styles.progressPill}>
          <Text style={styles.progressPct}>{progress.pct}%</Text>
          <Text style={styles.progressSub}>{progress.ready}/{progress.total} prêtes</Text>
        </View>
      </View>

      {/* Équipe d'étage */}
      {staff.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamRow} contentContainerStyle={styles.teamRowContent}>
          {staff.map((s) => {
            const load = tasks.filter((t) => t.assigned_to === s.id).length;
            const doneCount = tasks.filter((t) => t.assigned_to === s.id && (t.status === 'validated' || t.status === 'done')).length;
            return (
              <View key={s.id} style={styles.teamChip}>
                <View style={[styles.avatar, { backgroundColor: (s.color ?? FT.brand) + '22' }]}>
                  <Text style={[styles.avatarTxt, { color: s.color ?? FT.brand }]}>{s.first_name[0]}{s.last_name[0]}</Text>
                </View>
                <View>
                  <Text style={styles.teamName}>{s.first_name}</Text>
                  <Text style={styles.teamLoad}>{doneCount}/{load}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Filtres par statut */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <TouchableOpacity key={f.id} style={[styles.filterChip, active && styles.filterChipActive]} onPress={() => setFilter(f.id)}>
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
              <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>{counts[f.id] ?? 0}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading && tasks.length === 0 ? (
        <View style={styles.center}><ActivityIndicator color={FT.brand} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={FT.brand} />}
        >
          {filtered.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>Aucune chambre</Text>
              <Text style={styles.emptySub}>Rien à afficher pour ce filtre.</Text>
            </View>
          ) : (
            filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStart={() => startTask(task.id)}
                onComplete={() => completeTask(task.id)}
                onValidate={() => validateTask(task.id)}
                onRedo={() => redoTask(task.id)}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function TaskCard({ task, onStart, onComplete, onValidate, onRedo }: {
  task: HkTaskRow;
  onStart: () => void;
  onComplete: () => void;
  onValidate: () => void;
  onRedo: () => void;
}) {
  const meta = STATUS_META[task.status] ?? STATUS_META.pending;
  const prio = priorityMeta(task.priority);
  const isVip = prio?.label === 'Critique';
  const assigneeName = task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : 'Non assignée';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.roomNumber}>{(task.room_number ?? '').padStart(4, '0')}</Text>
          {isVip && <Star size={13} color={FT.warning} fill={FT.warning} />}
          {task.task_type ? <Text style={styles.typeTag}>{TYPE_LABEL[task.task_type] ?? task.task_type}</Text> : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.statusBadgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      {prio ? (
        <View style={styles.metaRow}>
          <View style={[styles.prioDot, { backgroundColor: prio.color }]} />
          <Text style={[styles.prioText, { color: prio.color }]}>{prio.label}</Text>
        </View>
      ) : null}

      {task.notes ? <Text style={styles.notes}>{task.notes}</Text> : null}

      <View style={styles.assigneeRow}>
        <View style={[styles.assigneeDot, { backgroundColor: (task.assignee?.color ?? FT.textMuted) + '22' }]}>
          <Text style={[styles.assigneeInitial, { color: task.assignee?.color ?? FT.textMuted }]}>
            {task.assignee ? task.assignee.first_name[0] : '–'}
          </Text>
        </View>
        <Text style={styles.assigneeName}>{assigneeName}</Text>
      </View>

      <View style={styles.actions}>
        <ActionBtn label="Démarrer" icon={Play} active={task.status === 'pending'} onPress={onStart} />
        <ActionBtn label="Terminer" icon={CheckCircle2} active={task.status === 'in_progress'} onPress={onComplete} />
        <ActionBtn label="Valider" icon={ShieldCheck} active={task.status === 'done'} onPress={onValidate} />
        {(task.status === 'done' || task.status === 'validated') ? (
          <ActionBtn label="" icon={RotateCcw} active={false} onPress={onRedo} iconOnly />
        ) : null}
      </View>
    </View>
  );
}

function ActionBtn({ label, icon: Icon, active, onPress, iconOnly }: {
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  active: boolean;
  onPress: () => void;
  iconOnly?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, iconOnly && styles.actionBtnIcon, active && styles.actionBtnActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Icon size={15} color={active ? '#FFFFFF' : FT.textSec} />
      {!iconOnly && <Text style={[styles.actionLabel, active && styles.actionLabelActive]}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FT.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: FT.text },
  subtitle: { fontSize: 13, color: FT.textSec, marginTop: 2 },
  progressPill: { alignItems: 'center', backgroundColor: FT.surface, borderRadius: 14, borderWidth: 1, borderColor: FT.border, paddingHorizontal: 14, paddingVertical: 8 },
  progressPct: { fontSize: 18, fontWeight: '800', color: FT.brand },
  progressSub: { fontSize: 11, color: FT.textMuted },
  teamRow: { maxHeight: 64, flexGrow: 0 },
  teamRowContent: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  teamChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: FT.surface, borderRadius: 12, borderWidth: 1, borderColor: FT.border, paddingHorizontal: 10, paddingVertical: 8 },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 11, fontWeight: '800' },
  teamName: { fontSize: 13, fontWeight: '700', color: FT.text },
  teamLoad: { fontSize: 11, color: FT.textMuted },
  filterRow: { maxHeight: 48, flexGrow: 0 },
  filterRowContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 6 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: FT.surface, borderRadius: FT.chipRadius, borderWidth: 1, borderColor: FT.border, paddingHorizontal: 12, paddingVertical: 7 },
  filterChipActive: { backgroundColor: FT.brand, borderColor: FT.brand },
  filterChipText: { fontSize: 13, fontWeight: '600', color: FT.textSec },
  filterChipTextActive: { color: '#FFFFFF' },
  filterBadge: { minWidth: 18, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 9, backgroundColor: FT.surfaceHover, alignItems: 'center' },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterBadgeText: { fontSize: 11, fontWeight: '700', color: FT.textSec },
  filterBadgeTextActive: { color: '#FFFFFF' },
  list: { padding: 16, paddingTop: 6, gap: 12 },
  card: { backgroundColor: FT.surface, borderRadius: FT.cardRadius, borderWidth: 1, borderColor: FT.border, padding: 14, ...FT.shadowLight },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roomNumber: { fontSize: 17, fontWeight: '800', color: FT.text },
  typeTag: { fontSize: 11, color: FT.textSec, backgroundColor: FT.surfaceAlt, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  prioDot: { width: 7, height: 7, borderRadius: 4 },
  prioText: { fontSize: 11, fontWeight: '700' },
  notes: { fontSize: 13, color: FT.textSec, marginTop: 8, lineHeight: 18 },
  assigneeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  assigneeDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  assigneeInitial: { fontSize: 11, fontWeight: '800' },
  assigneeName: { fontSize: 13, fontWeight: '600', color: FT.text },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: FT.surfaceAlt, borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: FT.border },
  actionBtnIcon: { flex: 0, width: 42 },
  actionBtnActive: { backgroundColor: FT.brand, borderColor: FT.brand },
  actionLabel: { fontSize: 12, fontWeight: '700', color: FT.textSec },
  actionLabelActive: { color: '#FFFFFF' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: FT.text },
  emptySub: { fontSize: 13, color: FT.textSec, textAlign: 'center' },
});
