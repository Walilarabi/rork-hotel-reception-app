import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, ChevronRight, Play, Flame, Search } from 'lucide-react-native';
import { FT } from '@/constants/flowtym';
import { useAuth } from '@/providers/AuthProvider';
import { useHkTasks } from '@/providers/HkTasksProvider';
import { type HkTaskRow } from '@/lib/db/housekeeping';

type Filter = 'all' | 'checkout' | 'cleaning' | 'priority';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'À faire', color: FT.textSec, bg: FT.surfaceHover },
  in_progress: { label: 'En cours', color: FT.info, bg: FT.infoSoft },
  done: { label: 'Terminé', color: FT.success, bg: FT.successSoft },
  validated: { label: 'Validé', color: FT.success, bg: FT.successSoft },
  skipped: { label: 'NPD', color: FT.warning, bg: FT.warningSoft },
};

function statusColor(s: string): string {
  return STATUS_META[s]?.color ?? FT.textMuted;
}
function floorOf(num: string | null): number {
  const n = Number(num ?? 0);
  return Number.isFinite(n) ? Math.floor(n / 100) : 0;
}
function isPriority(t: HkTaskRow): boolean {
  return t.priority === 'high' || t.priority === 'urgent';
}

export default function HousekeepingScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { tasks, isLoading, isConfigured, isPersonal, refetch, startTask } = useHkTasks();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanInput, setScanInput] = useState('');

  const kpi = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done' || t.status === 'validated').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const departs = tasks.filter((t) => t.task_type === 'checkout').length;
    const recouches = tasks.filter((t) => t.task_type === 'cleaning').length;
    return { total, done, inProgress, departs, recouches, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [tasks]);

  const counts = useMemo(() => ({
    all: tasks.length,
    checkout: tasks.filter((t) => t.task_type === 'checkout').length,
    cleaning: tasks.filter((t) => t.task_type === 'cleaning').length,
    priority: tasks.filter(isPriority).length,
  }), [tasks]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === 'checkout') list = tasks.filter((t) => t.task_type === 'checkout');
    else if (filter === 'cleaning') list = tasks.filter((t) => t.task_type === 'cleaning');
    else if (filter === 'priority') list = tasks.filter(isPriority);
    return list;
  }, [tasks, filter]);

  const byFloor = useMemo(() => {
    const map = new Map<number, HkTaskRow[]>();
    filtered.forEach((t) => {
      const f = floorOf(t.room_number);
      if (!map.has(f)) map.set(f, []);
      map.get(f)!.push(t);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const openTask = useCallback((id: string) => {
    router.push({ pathname: '/hk-room', params: { id } } as never);
  }, [router]);

  const submitScan = useCallback(() => {
    const num = scanInput.trim();
    const match = tasks.find((t) => (t.room_number ?? '').replace(/^0+/, '') === num.replace(/^0+/, ''));
    setScanOpen(false);
    setScanInput('');
    if (match) openTask(match.id);
    else Alert.alert('Chambre introuvable', `Aucune chambre ${num} dans vos attributions du jour.`);
  }, [scanInput, tasks, openTask]);

  if (!isConfigured) {
    return (
      <SafeAreaView style={styles.containerPlain} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Backend non connecté</Text>
          <Text style={styles.emptySub}>Connectez-vous à un compte Flowtym pour charger vos chambres.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = `${currentUser?.firstName?.[0] ?? ''}${currentUser?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <View style={styles.containerPlain}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
      >
        {/* Header violet */}
        <SafeAreaView edges={['top']} style={styles.headerWrap}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.hello}>Bonjour</Text>
              <Text style={styles.name}>{currentUser?.firstName ?? 'Bonjour'}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconCircle} onPress={() => setScanOpen(true)}>
                <Search size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.avatarCircle}><Text style={styles.avatarTxt}>{initials || '–'}</Text></View>
            </View>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiBig}>{kpi.total}</Text>
              <Text style={styles.kpiBigLabel}>chambres aujourd&apos;hui</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${kpi.pct}%` }]} />
              <Text style={styles.progressPct}>{kpi.pct}%</Text>
            </View>
            <View style={styles.kpiStatsRow}>
              <KpiStat value={kpi.done} label="TERMINÉES" />
              <KpiStat value={kpi.departs} label="DÉPARTS" />
              <KpiStat value={kpi.recouches} label="RECOUCHES" />
              <KpiStat value={kpi.inProgress} label="EN COURS" last />
            </View>
          </View>
        </SafeAreaView>

        {/* Scanner */}
        <TouchableOpacity style={styles.scanCard} onPress={() => setScanOpen(true)} activeOpacity={0.9}>
          <View style={styles.scanIcon}><Camera size={22} color={FT.brand} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.scanTitle}>Scanner une chambre</Text>
            <Text style={styles.scanSub}>Scannez le QR code ou entrez le numéro</Text>
          </View>
          <ChevronRight size={20} color={FT.textMuted} />
        </TouchableOpacity>

        {/* Filtres */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <FilterChip label={`Toutes (${counts.all})`} active={filter === 'all'} onPress={() => setFilter('all')} color={FT.headerBg} />
          <FilterChip label={`Départs (${counts.checkout})`} active={filter === 'checkout'} onPress={() => setFilter('checkout')} color={FT.danger} />
          <FilterChip label={`Recouches (${counts.cleaning})`} active={filter === 'cleaning'} onPress={() => setFilter('cleaning')} color={FT.info} />
          <FilterChip label={`Prioritaires (${counts.priority})`} active={filter === 'priority'} onPress={() => setFilter('priority')} color={FT.warning} />
        </ScrollView>

        <Text style={styles.hint}>→ Glisser droite : Commencer/Terminer • Toucher : ouvrir la fiche</Text>

        {isLoading && tasks.length === 0 ? (
          <View style={styles.center}><ActivityIndicator color={FT.brand} /></View>
        ) : byFloor.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Aucune chambre</Text>
            <Text style={styles.emptySub}>
              {isPersonal ? 'Aucune chambre ne vous est assignée aujourd’hui.' : 'Aucune tâche ménage pour ce filtre.'}
            </Text>
          </View>
        ) : (
          byFloor.map(([floor, rooms]) => (
            <View key={floor} style={styles.floorSection}>
              <View style={styles.floorHeader}>
                <View style={styles.floorDot} />
                <Text style={styles.floorTitle}>{floor === 0 ? 'RDC' : `${floor}${floor === 1 ? 'er' : 'e'} étage`}</Text>
                <Text style={styles.floorCount}>{rooms.length}</Text>
              </View>
              {rooms.map((task) => (
                <RoomRow key={task.id} task={task} onOpen={() => openTask(task.id)} onStart={() => startTask(task.id)} />
              ))}
            </View>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Saisie manuelle de chambre */}
      <Modal visible={scanOpen} transparent animationType="fade" onRequestClose={() => setScanOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Entrer un numéro de chambre</Text>
            <TextInput
              style={styles.modalInput}
              value={scanInput}
              onChangeText={setScanInput}
              keyboardType="number-pad"
              placeholder="Ex. 104"
              placeholderTextColor={FT.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setScanOpen(false)}>
                <Text style={styles.modalCancelTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOk} onPress={submitScan}>
                <Text style={styles.modalOkTxt}>Ouvrir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function KpiStat({ value, label, last }: { value: number; label: string; last?: boolean }) {
  return (
    <View style={[styles.kpiStat, !last && styles.kpiStatBorder]}>
      <Text style={styles.kpiStatValue}>{value}</Text>
      <Text style={styles.kpiStatLabel}>{label}</Text>
    </View>
  );
}

function FilterChip({ label, active, onPress, color }: { label: string; active: boolean; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity style={[styles.fChip, active && { backgroundColor: color, borderColor: color }]} onPress={onPress}>
      <Text style={[styles.fChipTxt, active && styles.fChipTxtActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function RoomRow({ task, onOpen, onStart }: { task: HkTaskRow; onOpen: () => void; onStart: () => void }) {
  const meta = STATUS_META[task.status] ?? STATUS_META.pending;
  const category = task.room?.category ?? (task.task_type === 'checkout' ? 'Départ' : 'Recouche');
  return (
    <TouchableOpacity style={styles.roomCard} onPress={onOpen} activeOpacity={0.85}>
      <View style={[styles.roomBar, { backgroundColor: statusColor(task.status) }]} />
      <View style={styles.roomMain}>
        <View style={styles.roomTitleRow}>
          {isPriority(task) && <Flame size={15} color={FT.danger} />}
          <Text style={styles.roomNumber}>{task.room_number}</Text>
          <View style={[styles.roomStatusBadge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.roomStatusTxt, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        <Text style={styles.roomCategory}>{category}</Text>
        {task.notes ? <Text style={styles.roomNote} numberOfLines={1}>{task.notes}</Text> : null}
      </View>
      {task.status === 'pending' ? (
        <TouchableOpacity style={styles.startBtn} onPress={onStart}>
          <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        <ChevronRight size={20} color={FT.textMuted} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  containerPlain: { flex: 1, backgroundColor: FT.bg },
  scroll: { paddingBottom: 16 },
  center: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 40 },
  headerWrap: { backgroundColor: FT.brand, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingHorizontal: 18, paddingBottom: 18 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  hello: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600' },
  name: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', marginTop: -2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  kpiCard: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 18, padding: 16, marginTop: 16 },
  kpiTopRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  kpiBig: { color: '#FFFFFF', fontSize: 34, fontWeight: '800' },
  kpiBigLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '500' },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 12, justifyContent: 'center' },
  progressFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: FT.success, borderRadius: 4 },
  progressPct: { position: 'absolute', right: 4, top: -20, color: FT.success, fontWeight: '800', fontSize: 14 },
  kpiStatsRow: { flexDirection: 'row', marginTop: 18 },
  kpiStat: { flex: 1, alignItems: 'center' },
  kpiStatBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' },
  kpiStatValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  kpiStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600', marginTop: 2 },
  scanCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: FT.surface, marginHorizontal: 16, marginTop: -14, borderRadius: 16, padding: 16, ...FT.shadowMedium },
  scanIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: FT.brandSoft, alignItems: 'center', justifyContent: 'center' },
  scanTitle: { fontSize: 16, fontWeight: '700', color: FT.text },
  scanSub: { fontSize: 13, color: FT.textSec, marginTop: 2 },
  filterRow: { gap: 8, paddingHorizontal: 16, paddingTop: 16 },
  fChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: FT.surface, borderWidth: 1, borderColor: FT.border },
  fChipTxt: { fontSize: 13, fontWeight: '700', color: FT.textSec },
  fChipTxtActive: { color: '#FFFFFF' },
  hint: { fontSize: 11, color: FT.textMuted, textAlign: 'center', marginTop: 12 },
  floorSection: { marginTop: 14, paddingHorizontal: 16 },
  floorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  floorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: FT.textMuted },
  floorTitle: { fontSize: 14, fontWeight: '700', color: FT.text },
  floorCount: { fontSize: 13, color: FT.textMuted },
  roomCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: FT.surface, borderRadius: 14, padding: 14, marginBottom: 10, ...FT.shadowLight },
  roomBar: { width: 4, alignSelf: 'stretch', borderRadius: 2, marginRight: 12 },
  roomMain: { flex: 1 },
  roomTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roomNumber: { fontSize: 20, fontWeight: '800', color: FT.text },
  roomStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roomStatusTxt: { fontSize: 11, fontWeight: '700' },
  roomCategory: { fontSize: 12, color: FT.textSec, marginTop: 2 },
  roomNote: { fontSize: 12, color: FT.textMuted, marginTop: 3 },
  startBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: FT.brand, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: FT.text },
  emptySub: { fontSize: 13, color: FT.textSec, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,16,53,0.45)', alignItems: 'center', justifyContent: 'center', padding: 30 },
  modalCard: { width: '100%', backgroundColor: FT.surface, borderRadius: 18, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: FT.text, marginBottom: 14 },
  modalInput: { backgroundColor: FT.surfaceAlt, borderWidth: 1, borderColor: FT.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, color: FT.text, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancel: { flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: FT.surfaceAlt, alignItems: 'center' },
  modalCancelTxt: { color: FT.textSec, fontWeight: '700' },
  modalOk: { flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: FT.brand, alignItems: 'center' },
  modalOkTxt: { color: '#FFFFFF', fontWeight: '700' },
});
