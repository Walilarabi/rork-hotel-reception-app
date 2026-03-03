import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Wrench, Plus, ChevronRight, Repeat, Building2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Colors } from '@/constants/colors';
import {
  MaintenanceType,
  MaintenanceSchedule,
  MaintenanceTask,
  MAINTENANCE_TYPE_TEMPLATES,
  FREQUENCY_OPTIONS,
} from '@/constants/types';

type ViewMode = 'rooms' | 'common' | 'types' | 'history';

export default function MaintenanceTrackingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    rooms,
    maintenanceTasks,
    maintenanceTypes,
    maintenanceSchedules,
    addMaintenanceType,
  } = useHotel();

  const [viewMode, setViewMode] = useState<ViewMode>('rooms');
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCategory, setNewTypeCategory] = useState<'chambre' | 'parties_communes'>('chambre');
  const [newTypeFreqIdx, setNewTypeFreqIdx] = useState(0);

  const roomSchedules = useMemo(() => {
    const map = new Map<string, { roomNumber: string; schedules: (MaintenanceSchedule & { typeName: string; overdue: boolean })[] }>();
    maintenanceSchedules.filter((ms) => ms.roomId).forEach((ms) => {
      const room = rooms.find((r) => r.id === ms.roomId);
      const mt = maintenanceTypes.find((t) => t.id === ms.maintenanceTypeId);
      if (!room || !mt) return;
      const key = ms.roomId!;
      if (!map.has(key)) map.set(key, { roomNumber: room.roomNumber, schedules: [] });
      const overdue = ms.nextDue ? new Date(ms.nextDue) <= new Date() : false;
      map.get(key)!.schedules.push({ ...ms, typeName: mt.name, overdue });
    });
    return Array.from(map.entries()).sort((a, b) => a[1].roomNumber.localeCompare(b[1].roomNumber));
  }, [maintenanceSchedules, maintenanceTypes, rooms]);

  const commonSchedules = useMemo(() => {
    return maintenanceSchedules
      .filter((ms) => !ms.roomId && ms.commonArea)
      .map((ms) => {
        const mt = maintenanceTypes.find((t) => t.id === ms.maintenanceTypeId);
        const overdue = ms.nextDue ? new Date(ms.nextDue) <= new Date() : false;
        return { ...ms, typeName: mt?.name ?? 'Inconnu', overdue };
      })
      .sort((a, b) => (a.commonArea ?? '').localeCompare(b.commonArea ?? ''));
  }, [maintenanceSchedules, maintenanceTypes]);

  const historyByDay = useMemo(() => {
    const resolved = maintenanceTasks.filter((t) => t.status === 'resolu' && t.resolvedAt);
    const map = new Map<string, { date: string; dayLabel: string; tasks: MaintenanceTask[]; totalCost: number }>();
    resolved.forEach((t) => {
      const date = t.resolvedAt!.split('T')[0];
      if (!map.has(date)) {
        const d = new Date(date);
        const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        map.set(date, { date, dayLabel, tasks: [], totalCost: 0 });
      }
      const entry = map.get(date)!;
      entry.tasks.push(t);
      entry.totalCost += t.costTotal;
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [maintenanceTasks]);

  const stats = useMemo(() => {
    const overdue = maintenanceSchedules.filter((ms) => ms.nextDue && new Date(ms.nextDue) <= new Date()).length;
    const totalCost = maintenanceTasks.reduce((s, t) => s + t.costTotal, 0);
    const pending = maintenanceTasks.filter((t) => t.status === 'en_attente').length;
    const inProgress = maintenanceTasks.filter((t) => t.status === 'en_cours').length;
    return { overdue, totalCost, pending, inProgress };
  }, [maintenanceSchedules, maintenanceTasks]);

  const handleAddType = useCallback(() => {
    if (!newTypeName.trim()) return;
    const freq = FREQUENCY_OPTIONS[newTypeFreqIdx];
    addMaintenanceType({
      hotelId: 'h1',
      name: newTypeName.trim(),
      category: newTypeCategory,
      frequencyValue: freq.value,
      frequencyUnit: freq.unit,
      active: true,
    });
    setNewTypeName('');
    setShowAddType(false);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [newTypeName, newTypeCategory, newTypeFreqIdx, addMaintenanceType]);

  const renderRoomItem = useCallback(({ item }: { item: [string, { roomNumber: string; schedules: (MaintenanceSchedule & { typeName: string; overdue: boolean })[] }] }) => {
    const [, data] = item;
    const overdueCount = data.schedules.filter((s) => s.overdue).length;
    return (
      <View style={styles.roomCard}>
        <View style={styles.roomCardHeader}>
          <Text style={styles.roomNumber}>Ch. {data.roomNumber}</Text>
          <View style={styles.roomBadges}>
            <Text style={styles.scheduleCount}>{data.schedules.length} maintenances</Text>
            {overdueCount > 0 && (
              <View style={styles.overdueBadge}>
                <Text style={styles.overdueText}>{overdueCount} en retard</Text>
              </View>
            )}
          </View>
        </View>
        {data.schedules.map((s) => (
          <View key={s.id} style={[styles.scheduleRow, s.overdue && styles.scheduleOverdue]}>
            <Wrench size={12} color={s.overdue ? Colors.danger : Colors.textMuted} />
            <Text style={[styles.scheduleName, s.overdue && { color: Colors.danger }]} numberOfLines={1}>{s.typeName}</Text>
            <Text style={[styles.scheduleDate, s.overdue && { color: Colors.danger }]}>
              {s.nextDue ? new Date(s.nextDue).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}
            </Text>
          </View>
        ))}
      </View>
    );
  }, []);

  const renderCommonItem = useCallback(({ item }: { item: MaintenanceSchedule & { typeName: string; overdue: boolean } }) => (
    <View style={[styles.commonCard, item.overdue && styles.scheduleOverdue]}>
      <View style={styles.commonCardHeader}>
        <Building2 size={16} color={item.overdue ? Colors.danger : Colors.primary} />
        <Text style={[styles.commonArea, item.overdue && { color: Colors.danger }]}>{item.commonArea}</Text>
      </View>
      <Text style={styles.commonType}>{item.typeName}</Text>
      <View style={styles.commonDates}>
        <Text style={styles.commonDateLabel}>Dernière : {item.lastDone ? new Date(item.lastDone).toLocaleDateString('fr-FR') : '—'}</Text>
        <Text style={[styles.commonDateLabel, item.overdue && { color: Colors.danger, fontWeight: '700' as const }]}>
          Prochaine : {item.nextDue ? new Date(item.nextDue).toLocaleDateString('fr-FR') : '—'}
        </Text>
      </View>
    </View>
  ), []);

  const renderHistoryDay = useCallback(({ item }: { item: { date: string; dayLabel: string; tasks: MaintenanceTask[]; totalCost: number } }) => (
    <View style={styles.historyDayCard}>
      <View style={styles.historyDayHeader}>
        <View>
          <Text style={styles.historyDayLabel}>{item.dayLabel}</Text>
          <Text style={styles.historyDayCount}>{item.tasks.length} intervention{item.tasks.length > 1 ? 's' : ''}</Text>
        </View>
        {item.totalCost > 0 && (
          <Text style={styles.historyDayCost}>{item.totalCost.toFixed(2)}€</Text>
        )}
      </View>
      {item.tasks.map((t) => (
        <TouchableOpacity
          key={t.id}
          style={styles.historyTaskRow}
          onPress={() => router.push({ pathname: '/ticket-detail', params: { taskId: t.id } })}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.historyTaskTitle} numberOfLines={1}>{t.title}</Text>
            <Text style={styles.historyTaskMeta}>Ch. {t.roomNumber} • {t.assignedTo ?? 'Non assigné'}</Text>
          </View>
          {t.costTotal > 0 && <Text style={styles.historyTaskCost}>{t.costTotal.toFixed(2)}€</Text>}
          <ChevronRight size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  ), [router]);

  const renderTypeItem = useCallback(({ item }: { item: MaintenanceType }) => {
    const freq = FREQUENCY_OPTIONS.find((f) => f.value === item.frequencyValue && f.unit === item.frequencyUnit);
    return (
      <View style={styles.typeCard}>
        <View style={styles.typeInfo}>
          <Repeat size={14} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.typeName}>{item.name}</Text>
            <Text style={styles.typeFreq}>{freq?.label ?? `${item.frequencyValue} ${item.frequencyUnit}`}</Text>
          </View>
          <View style={[styles.typeCatBadge, { backgroundColor: item.category === 'chambre' ? '#3B82F615' : '#F59E0B15' }]}>
            <Text style={[styles.typeCatText, { color: item.category === 'chambre' ? '#3B82F6' : '#F59E0B' }]}>
              {item.category === 'chambre' ? 'Chambre' : 'Commun'}
            </Text>
          </View>
        </View>
      </View>
    );
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Suivi Maintenance',
          headerStyle: { backgroundColor: theme.headerBg },
          headerTintColor: '#FFF',
        }}
      />

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statCount, { color: Colors.danger }]}>{stats.overdue}</Text>
          <Text style={styles.statLabel}>En retard</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statCount, { color: Colors.warning }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statCount, { color: Colors.teal }]}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statCount, { color: Colors.primary }]}>{stats.totalCost.toFixed(0)}€</Text>
          <Text style={styles.statLabel}>Coûts total</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        {[
          { key: 'rooms' as ViewMode, label: '🏨 Chambres' },
          { key: 'common' as ViewMode, label: '🏢 Communs' },
          { key: 'types' as ViewMode, label: '⚙️ Types' },
          { key: 'history' as ViewMode, label: '📋 Historique' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, viewMode === tab.key && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => setViewMode(tab.key)}
          >
            <Text style={[styles.tabBtnText, viewMode === tab.key && { color: '#FFF' }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {viewMode === 'rooms' && (
        <FlatList
          data={roomSchedules}
          keyExtractor={(item) => item[0]}
          renderItem={renderRoomItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyIcon}>🔧</Text><Text style={styles.emptyText}>Aucune planification</Text></View>}
        />
      )}

      {viewMode === 'common' && (
        <FlatList
          data={commonSchedules}
          keyExtractor={(item) => item.id}
          renderItem={renderCommonItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyIcon}>🏢</Text><Text style={styles.emptyText}>Aucune planification</Text></View>}
        />
      )}

      {viewMode === 'types' && (
        <View style={{ flex: 1 }}>
          <FlatList
            data={maintenanceTypes}
            keyExtractor={(item) => item.id}
            renderItem={renderTypeItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyIcon}>⚙️</Text><Text style={styles.emptyText}>Aucun type défini</Text></View>}
          />
          <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]} onPress={() => setShowAddType(true)}>
            <Plus size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {viewMode === 'history' && (
        <FlatList
          data={historyByDay}
          keyExtractor={(item) => item.date}
          renderItem={renderHistoryDay}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyIcon}>📋</Text><Text style={styles.emptyText}>Aucun historique</Text></View>}
        />
      )}

      <Modal visible={showAddType} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouveau type de maintenance</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nom (ex: Filtres climatisation)"
              placeholderTextColor={Colors.textMuted}
              value={newTypeName}
              onChangeText={setNewTypeName}
            />
            <View style={styles.templateRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {MAINTENANCE_TYPE_TEMPLATES.slice(0, 6).map((t) => (
                  <TouchableOpacity key={t} style={styles.templateChip} onPress={() => setNewTypeName(t)}>
                    <Text style={styles.templateChipText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Text style={styles.modalSubtitle}>Catégorie</Text>
            <View style={styles.catRow}>
              <TouchableOpacity
                style={[styles.catBtn, newTypeCategory === 'chambre' && styles.catBtnActive]}
                onPress={() => setNewTypeCategory('chambre')}
              >
                <Text style={[styles.catBtnText, newTypeCategory === 'chambre' && styles.catBtnTextActive]}>🏨 Chambre</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.catBtn, newTypeCategory === 'parties_communes' && styles.catBtnActive]}
                onPress={() => setNewTypeCategory('parties_communes')}
              >
                <Text style={[styles.catBtnText, newTypeCategory === 'parties_communes' && styles.catBtnTextActive]}>🏢 Commun</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Fréquence</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {FREQUENCY_OPTIONS.map((f, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.freqChip, newTypeFreqIdx === i && { backgroundColor: Colors.primary }]}
                  onPress={() => setNewTypeFreqIdx(i)}
                >
                  <Text style={[styles.freqChipText, newTypeFreqIdx === i && { color: '#FFF' }]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddType(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, !newTypeName.trim() && { opacity: 0.5 }]}
                onPress={handleAddType}
                disabled={!newTypeName.trim()}
              >
                <Text style={styles.modalConfirmText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E4E8EC' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statCount: { fontSize: 20, fontWeight: '800' as const },
  statLabel: { fontSize: 10, color: '#8A9AA8', fontWeight: '500' as const },
  statDivider: { width: 1, height: 28, backgroundColor: '#E4E8EC' },
  tabScroll: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E4E8EC', maxHeight: 52 },
  tabContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E4E8EC', backgroundColor: '#FFF' },
  tabBtnText: { fontSize: 12, fontWeight: '600' as const, color: '#5A6B78' },
  listContent: { padding: 14, paddingBottom: 80, gap: 10 },
  roomCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, borderColor: '#E4E8EC' },
  roomCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roomNumber: { fontSize: 16, fontWeight: '800' as const, color: Colors.primary },
  roomBadges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scheduleCount: { fontSize: 11, color: '#8A9AA8' },
  overdueBadge: { backgroundColor: Colors.danger + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  overdueText: { fontSize: 10, fontWeight: '600' as const, color: Colors.danger },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#F8FAFB', borderRadius: 8 },
  scheduleOverdue: { backgroundColor: Colors.danger + '08' },
  scheduleName: { flex: 1, fontSize: 12, color: '#1A2B33', fontWeight: '500' as const },
  scheduleDate: { fontSize: 11, color: '#8A9AA8', fontWeight: '500' as const },
  commonCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, gap: 6, borderWidth: 1, borderColor: '#E4E8EC' },
  commonCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commonArea: { fontSize: 16, fontWeight: '700' as const, color: Colors.primary },
  commonType: { fontSize: 13, color: '#5A6B78', fontWeight: '500' as const },
  commonDates: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  commonDateLabel: { fontSize: 11, color: '#8A9AA8' },
  typeCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E4E8EC' },
  typeInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeName: { fontSize: 14, fontWeight: '600' as const, color: '#1A2B33' },
  typeFreq: { fontSize: 11, color: '#8A9AA8' },
  typeCatBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeCatText: { fontSize: 10, fontWeight: '600' as const },
  historyDayCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, borderColor: '#E4E8EC' },
  historyDayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E4E8EC' },
  historyDayLabel: { fontSize: 14, fontWeight: '700' as const, color: '#1A2B33', textTransform: 'capitalize' as const },
  historyDayCount: { fontSize: 11, color: '#8A9AA8' },
  historyDayCost: { fontSize: 16, fontWeight: '800' as const, color: Colors.primary },
  historyTaskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  historyTaskTitle: { fontSize: 13, fontWeight: '600' as const, color: '#1A2B33' },
  historyTaskMeta: { fontSize: 11, color: '#8A9AA8' },
  historyTaskCost: { fontSize: 12, fontWeight: '700' as const, color: Colors.primary },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 14, color: '#8A9AA8' },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 14 },
  modalTitle: { fontSize: 18, fontWeight: '700' as const, color: '#1A2B33' },
  modalSubtitle: { fontSize: 13, fontWeight: '600' as const, color: '#5A6B78', marginTop: 4 },
  modalInput: { backgroundColor: '#F8FAFB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A2B33', borderWidth: 1, borderColor: '#E4E8EC' },
  templateRow: { maxHeight: 36 },
  templateChip: { backgroundColor: '#E4F0F3', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 6 },
  templateChipText: { fontSize: 11, color: Colors.primary, fontWeight: '500' as const },
  catRow: { flexDirection: 'row', gap: 10 },
  catBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E4E8EC' },
  catBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catBtnText: { fontSize: 13, fontWeight: '600' as const, color: '#5A6B78' },
  catBtnTextActive: { color: '#FFF' },
  freqChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 6, borderWidth: 1, borderColor: '#E4E8EC', backgroundColor: '#F8FAFB' },
  freqChipText: { fontSize: 12, fontWeight: '500' as const, color: '#5A6B78' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: '#F8FAFB', borderWidth: 1, borderColor: '#E4E8EC' },
  modalCancelText: { fontSize: 14, fontWeight: '600' as const, color: '#5A6B78' },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.teal },
  modalConfirmText: { fontSize: 14, fontWeight: '600' as const, color: '#FFF' },
});
