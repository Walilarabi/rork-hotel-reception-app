import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Package, AlertTriangle, Check, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { FT } from '@/constants/flowtym';
import { useAuth } from '@/providers/AuthProvider';
import { useHkTasks } from '@/providers/HkTasksProvider';
import {
  elapsedSeconds,
  getTaskChecklist,
  setTaskCheck,
  createIncident,
  createFoundItem,
  type HkChecklistItem,
} from '@/lib/db/housekeeping';

const INCIDENT_TYPES: { key: 'wc' | 'ampoule' | 'clim' | 'serrure' | 'fuite' | 'mobilier' | 'tv' | 'autre'; label: string }[] = [
  { key: 'wc', label: 'WC bouché' },
  { key: 'ampoule', label: 'Ampoule grillée' },
  { key: 'clim', label: 'Climatisation en panne' },
  { key: 'serrure', label: 'Serrure cassée' },
  { key: 'fuite', label: 'Fuite robinet' },
  { key: 'mobilier', label: 'Mobilier abîmé' },
  { key: 'tv', label: 'TV en panne' },
  { key: 'autre', label: 'Autre problème' },
];

function fmt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function HkRoomScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { getTask, hotelId, startTask, pauseTask, resumeTask, completeTask, invalidate } = useHkTasks();
  const task = id ? getTask(id) : undefined;

  const [tick, setTick] = useState(0);
  const [checklist, setChecklist] = useState<HkChecklistItem[]>([]);
  const [clOpen, setClOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [foundOpen, setFoundOpen] = useState(false);

  const running = task?.status === 'in_progress' && !task?.paused_at;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (!id || !hotelId) return;
    void getTaskChecklist(hotelId, id).then(setChecklist);
  }, [id, hotelId]);

  const elapsed = useMemo(() => (task ? elapsedSeconds(task) : 0), [task, tick]);
  const checkedCount = checklist.filter((c) => c.checked).length;

  const toggleCheck = useCallback(async (item: HkChecklistItem) => {
    if (!hotelId || !id) return;
    setChecklist((prev) => prev.map((c) => (c.id === item.id ? { ...c, checked: !c.checked } : c)));
    try {
      await setTaskCheck(hotelId, id, item.id, !item.checked, currentUser?.id ?? '');
    } catch {
      setChecklist((prev) => prev.map((c) => (c.id === item.id ? { ...c, checked: item.checked } : c)));
      Alert.alert('Erreur', 'Impossible d’enregistrer la checklist.');
    }
  }, [hotelId, id, currentUser?.id]);

  const onTerminate = useCallback(() => {
    if (!id) return;
    Alert.alert('Terminer la chambre', 'Marquer comme terminée — en attente de validation gouvernante ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Terminer', onPress: () => { completeTask(id); router.back(); } },
    ]);
  }, [id, completeTask, router]);

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Chambre' }} />
        <View style={styles.center}><ActivityIndicator color={FT.brand} /></View>
      </SafeAreaView>
    );
  }

  const category = task.room?.category ?? (task.task_type === 'checkout' ? 'Départ' : 'Recouche');
  const isNpd = task.is_npd;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: `Chambre ${task.room_number}` }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* En-tête chambre */}
        <View style={styles.head}>
          <View style={styles.headRow}>
            <Text style={styles.roomNumber}>{task.room_number}</Text>
            <View style={styles.occupBadge}><Text style={styles.occupTxt}>{category}</Text></View>
          </View>
          {task.assignee ? (
            <View style={styles.assigneeRow}>
              <View style={[styles.assigneeDot, { backgroundColor: (task.assignee.color ?? FT.brand) + '22' }]}>
                <Text style={[styles.assigneeInit, { color: task.assignee.color ?? FT.brand }]}>{task.assignee.first_name[0]}</Text>
              </View>
              <Text style={styles.assigneeName}>{task.assignee.first_name} {task.assignee.last_name}</Text>
            </View>
          ) : null}
          <Text style={styles.timer}>⏱ {fmt(elapsed)}</Text>
        </View>

        {/* Toggles */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>🔒  NPD</Text>
            <Switch
              value={isNpd}
              onValueChange={(v) => { if (v) pauseTask({ id: task.id, npd: true }); else resumeTask(task.id); invalidate(); }}
              trackColor={{ true: FT.warning }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>🧹  En cours</Text>
            <Switch
              value={running}
              onValueChange={(v) => {
                if (v) { task.status === 'pending' ? startTask(task.id) : resumeTask(task.id); }
                else { pauseTask({ id: task.id, npd: false }); }
                invalidate();
              }}
              trackColor={{ true: FT.brand }}
            />
          </View>
        </View>

        {/* Checklist */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => setClOpen((o) => !o)}>
            <Text style={styles.sectionTitle}>✅  Checklist ({checkedCount}/{checklist.length})</Text>
            <ChevronRight size={18} color={FT.textMuted} style={{ transform: [{ rotate: clOpen ? '90deg' : '0deg' }] }} />
          </TouchableOpacity>
          {clOpen && checklist.map((item) => (
            <TouchableOpacity key={item.id} style={styles.checkRow} onPress={() => toggleCheck(item)}>
              <View style={[styles.checkbox, item.checked && styles.checkboxOn]}>
                {item.checked && <Check size={14} color="#FFFFFF" />}
              </View>
              <Text style={[styles.checkLabel, item.checked && styles.checkLabelOn]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Actions secondaires */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.gridBtn, { backgroundColor: FT.infoSoft }]} onPress={() => setFoundOpen(true)}>
            <Package size={22} color={FT.info} />
            <Text style={styles.gridLabel}>Objet trouvé</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.gridBtn, { backgroundColor: FT.warningSoft }]} onPress={() => setIncidentOpen(true)}>
            <AlertTriangle size={22} color={FT.warning} />
            <Text style={styles.gridLabel}>Signaler</Text>
          </TouchableOpacity>
        </View>

        {task.status !== 'validated' && (
          <TouchableOpacity style={styles.terminateBtn} onPress={onTerminate}>
            <CheckCircle2 size={20} color="#FFFFFF" />
            <Text style={styles.terminateTxt}>{task.status === 'done' ? 'Terminée — en attente de validation' : 'Terminer la chambre'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <IncidentModal
        visible={incidentOpen}
        onClose={() => setIncidentOpen(false)}
        onSubmit={async (key, label, comment) => {
          try {
            await createIncident({ hotelId: hotelId as string, roomId: task.room_id, roomNumber: task.room_number, categoryKey: key, title: label, description: comment, reportedBy: currentUser?.id });
            setIncidentOpen(false);
            Alert.alert('Signalement envoyé', 'Un ticket maintenance a été créé.');
          } catch { Alert.alert('Erreur', 'Échec de l’envoi du signalement.'); }
        }}
      />
      <FoundModal
        visible={foundOpen}
        onClose={() => setFoundOpen(false)}
        onSubmit={async (desc) => {
          try {
            await createFoundItem({ hotelId: hotelId as string, roomNumber: task.room_number, description: desc, foundBy: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : undefined });
            setFoundOpen(false);
            Alert.alert('Objet enregistré', 'La réception a été notifiée.');
          } catch { Alert.alert('Erreur', 'Échec de l’enregistrement.'); }
        }}
      />
    </SafeAreaView>
  );
}

function IncidentModal({ visible, onClose, onSubmit }: { visible: boolean; onClose: () => void; onSubmit: (key: typeof INCIDENT_TYPES[number]['key'], label: string, comment: string) => void }) {
  const [sel, setSel] = useState<typeof INCIDENT_TYPES[number] | null>(null);
  const [comment, setComment] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Signaler un problème</Text>
          <ScrollView style={{ maxHeight: 260 }}>
            {INCIDENT_TYPES.map((t) => (
              <TouchableOpacity key={t.key} style={[styles.optRow, sel?.key === t.key && styles.optRowOn]} onPress={() => setSel(t)}>
                <Text style={styles.optTxt}>{t.label}</Text>
                {sel?.key === t.key && <Check size={16} color={FT.brand} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TextInput style={styles.sheetInput} value={comment} onChangeText={setComment} placeholder="Commentaire (optionnel)" placeholderTextColor={FT.textMuted} multiline />
          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.sheetCancel} onPress={onClose}><Text style={styles.sheetCancelTxt}>Annuler</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.sheetOk, !sel && styles.sheetOkDisabled]} disabled={!sel} onPress={() => sel && onSubmit(sel.key, sel.label, comment)}>
              <Text style={styles.sheetOkTxt}>Envoyer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FoundModal({ visible, onClose, onSubmit }: { visible: boolean; onClose: () => void; onSubmit: (desc: string) => void }) {
  const [desc, setDesc] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Objet trouvé</Text>
          <TextInput style={styles.sheetInput} value={desc} onChangeText={setDesc} placeholder="Description (ex. trousseau de clés, téléphone…)" placeholderTextColor={FT.textMuted} multiline />
          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.sheetCancel} onPress={onClose}><Text style={styles.sheetCancelTxt}>Annuler</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.sheetOk, !desc.trim() && styles.sheetOkDisabled]} disabled={!desc.trim()} onPress={() => onSubmit(desc.trim())}>
              <Text style={styles.sheetOkTxt}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FT.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, gap: 14 },
  head: { paddingVertical: 6 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roomNumber: { fontSize: 40, fontWeight: '800', color: FT.text },
  occupBadge: { backgroundColor: FT.infoSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  occupTxt: { color: FT.info, fontWeight: '700', fontSize: 13 },
  assigneeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  assigneeDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  assigneeInit: { fontWeight: '800', fontSize: 12 },
  assigneeName: { fontSize: 14, fontWeight: '600', color: FT.text },
  timer: { fontSize: 22, fontWeight: '800', color: FT.brand, marginTop: 12, fontVariant: ['tabular-nums'] },
  card: { backgroundColor: FT.surface, borderRadius: 14, borderWidth: 1, borderColor: FT.border, padding: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  toggleLabel: { fontSize: 16, fontWeight: '700', color: FT.text },
  divider: { height: 1, backgroundColor: FT.border, marginVertical: 6 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: FT.text },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: FT.border, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: FT.success, borderColor: FT.success },
  checkLabel: { fontSize: 15, color: FT.text },
  checkLabelOn: { color: FT.textMuted, textDecorationLine: 'line-through' },
  actionsGrid: { flexDirection: 'row', gap: 12 },
  gridBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 18, borderRadius: 14 },
  gridLabel: { fontSize: 13, fontWeight: '700', color: FT.text },
  terminateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: FT.success, borderRadius: 14, paddingVertical: 16, marginTop: 4 },
  terminateTxt: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(26,16,53,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: FT.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: FT.text, marginBottom: 14 },
  optRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 12, borderRadius: 10 },
  optRowOn: { backgroundColor: FT.brandSoft },
  optTxt: { fontSize: 15, color: FT.text },
  sheetInput: { backgroundColor: FT.surfaceAlt, borderWidth: 1, borderColor: FT.border, borderRadius: 10, padding: 12, fontSize: 15, color: FT.text, minHeight: 70, marginTop: 12, textAlignVertical: 'top' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  sheetCancel: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: FT.surfaceAlt, alignItems: 'center' },
  sheetCancelTxt: { color: FT.textSec, fontWeight: '700' },
  sheetOk: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: FT.brand, alignItems: 'center' },
  sheetOkDisabled: { opacity: 0.4 },
  sheetOkTxt: { color: '#FFFFFF', fontWeight: '700' },
});
