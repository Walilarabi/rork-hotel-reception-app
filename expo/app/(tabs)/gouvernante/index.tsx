import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, X, Clock, Moon, AlertTriangle } from 'lucide-react-native';
import { FT } from '@/constants/flowtym';
import { useAuth } from '@/providers/AuthProvider';
import { useHkTasks } from '@/providers/HkTasksProvider';
import { elapsedSeconds, type HkTaskRow } from '@/lib/db/housekeeping';

type Tab = 'control' | 'all';

function fmtMin(sec: number): string {
  const m = Math.round(sec / 60);
  return `${m} min`;
}

export default function GouvernanteScreen() {
  const { currentUser } = useAuth();
  const { tasks, isLoading, isConfigured, refetch, validateTask, redoTask } = useHkTasks();
  const [tab, setTab] = useState<Tab>('control');
  const [refreshing, setRefreshing] = useState(false);

  const kpi = useMemo(() => {
    const toControl = tasks.filter((t) => t.status === 'done').length;
    const validated = tasks.filter((t) => t.status === 'validated').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const npd = tasks.filter((t) => t.is_npd).length;
    const finished = tasks.filter((t) => t.status === 'done' || t.status === 'validated');
    const avg = finished.length
      ? Math.round(finished.reduce((s, t) => s + elapsedSeconds(t), 0) / finished.length)
      : 0;
    return { toControl, validated, inProgress, npd, avg };
  }, [tasks]);

  const list = useMemo(
    () => (tab === 'control' ? tasks.filter((t) => t.status === 'done') : tasks),
    [tasks, tab],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const onValidate = useCallback((t: HkTaskRow) => validateTask(t.id), [validateTask]);
  const onReject = useCallback((t: HkTaskRow) => {
    Alert.alert('Refuser la chambre', `La chambre ${t.room_number} repassera en « à nettoyer ».`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Refuser', style: 'destructive', onPress: () => redoTask(t.id) },
    ]);
  }, [redoTask]);

  if (!isConfigured) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><Text style={styles.emptyTitle}>Backend non connecté</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Contrôle</Text>
        <Text style={styles.subtitle}>{currentUser?.hotelName ?? 'Mon hôtel'} · supervision du jour</Text>
      </View>

      <View style={styles.kpiRow}>
        <KpiCard value={kpi.toControl} label="À contrôler" color={FT.warning} icon={<AlertTriangle size={16} color={FT.warning} />} />
        <KpiCard value={kpi.validated} label="Validées" color={FT.success} icon={<Check size={16} color={FT.success} />} />
        <KpiCard value={kpi.inProgress} label="En cours" color={FT.info} icon={<Clock size={16} color={FT.info} />} />
        <KpiCard value={kpi.npd} label="NPD" color={FT.textSec} icon={<Moon size={16} color={FT.textSec} />} />
      </View>
      <View style={styles.avgRow}>
        <Clock size={14} color={FT.textMuted} />
        <Text style={styles.avgText}>Temps moyen de nettoyage : <Text style={styles.avgBold}>{fmtMin(kpi.avg)}</Text></Text>
      </View>

      <View style={styles.tabs}>
        <TabBtn label={`À contrôler (${kpi.toControl})`} active={tab === 'control'} onPress={() => setTab('control')} />
        <TabBtn label={`Toutes (${tasks.length})`} active={tab === 'all'} onPress={() => setTab('all')} />
      </View>

      {isLoading && tasks.length === 0 ? (
        <View style={styles.center}><ActivityIndicator color={FT.brand} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={FT.brand} />}
        >
          {list.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>Rien à contrôler</Text>
              <Text style={styles.emptySub}>Toutes les chambres terminées ont été validées.</Text>
            </View>
          ) : (
            list.map((t) => <ControlRow key={t.id} task={t} onValidate={() => onValidate(t)} onReject={() => onReject(t)} />)
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function KpiCard({ value, label, color, icon }: { value: number; label: string; color: string; icon: React.ReactNode }) {
  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiIconRow}>{icon}<Text style={[styles.kpiValue, { color }]}>{value}</Text></View>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function TabBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={onPress}>
      <Text style={[styles.tabTxt, active && styles.tabTxtActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'À nettoyer', color: FT.danger, bg: FT.dangerSoft },
  in_progress: { label: 'En cours', color: FT.info, bg: FT.infoSoft },
  done: { label: 'À contrôler', color: FT.warning, bg: FT.warningSoft },
  validated: { label: 'Validée', color: FT.success, bg: FT.successSoft },
  skipped: { label: 'NPD', color: FT.textSec, bg: FT.surfaceHover },
};

function ControlRow({ task, onValidate, onReject }: { task: HkTaskRow; onValidate: () => void; onReject: () => void }) {
  const meta = STATUS_LABEL[task.status] ?? STATUS_LABEL.pending;
  const assignee = task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : 'Non assignée';
  const mins = Math.round(elapsedSeconds(task) / 60);
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <View style={styles.rowTitleLine}>
          <Text style={styles.roomNum}>{task.room_number}</Text>
          <View style={[styles.badge, { backgroundColor: meta.bg }]}><Text style={[styles.badgeTxt, { color: meta.color }]}>{meta.label}</Text></View>
          {task.is_npd ? <View style={[styles.badge, { backgroundColor: FT.surfaceHover }]}><Text style={[styles.badgeTxt, { color: FT.textSec }]}>NPD</Text></View> : null}
        </View>
        <Text style={styles.rowSub}>{assignee} · {mins} min</Text>
      </View>
      {task.status === 'done' ? (
        <View style={styles.rowActions}>
          <TouchableOpacity style={[styles.actBtn, styles.rejectBtn]} onPress={onReject}>
            <X size={18} color={FT.danger} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actBtn, styles.validateBtn]} onPress={onValidate}>
            <Check size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : task.status === 'validated' ? (
        <View style={styles.validatedTag}><Check size={16} color={FT.success} /></View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FT.bg },
  center: { paddingVertical: 60, alignItems: 'center', gap: 6, paddingHorizontal: 40 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: FT.text },
  subtitle: { fontSize: 13, color: FT.textSec, marginTop: 2 },
  kpiRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 6 },
  kpiCard: { flex: 1, backgroundColor: FT.surface, borderRadius: 12, borderWidth: 1, borderColor: FT.border, padding: 10, alignItems: 'center' },
  kpiIconRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  kpiValue: { fontSize: 18, fontWeight: '800' },
  kpiLabel: { fontSize: 10, color: FT.textMuted, marginTop: 3, fontWeight: '600' },
  avgRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 10 },
  avgText: { fontSize: 13, color: FT.textSec },
  avgBold: { fontWeight: '800', color: FT.text },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: FT.surface, borderWidth: 1, borderColor: FT.border },
  tabBtnActive: { backgroundColor: FT.brand, borderColor: FT.brand },
  tabTxt: { fontSize: 13, fontWeight: '700', color: FT.textSec },
  tabTxtActive: { color: '#FFFFFF' },
  list: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: FT.surface, borderRadius: 14, borderWidth: 1, borderColor: FT.border, padding: 14 },
  rowMain: { flex: 1 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roomNum: { fontSize: 18, fontWeight: '800', color: FT.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  rowSub: { fontSize: 13, color: FT.textSec, marginTop: 4 },
  rowActions: { flexDirection: 'row', gap: 8 },
  actBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { backgroundColor: FT.dangerSoft },
  validateBtn: { backgroundColor: FT.success },
  validatedTag: { width: 42, height: 42, borderRadius: 21, backgroundColor: FT.successSoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: FT.text },
  emptySub: { fontSize: 13, color: FT.textSec, textAlign: 'center' },
});
