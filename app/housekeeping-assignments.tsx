import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Zap,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  CheckCircle2,
  AlertTriangle,
  X,
  Play,
  Square,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import { useHousekeepingManager } from '@/providers/HousekeepingProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { CLEANING_TYPE_CONFIG } from '@/constants/types';
import { FT } from '@/constants/flowtym';

export default function HousekeepingAssignmentsScreen() {
  const { rooms: _rooms } = useHotel();
  const {
    hkStaff,
    todayTasks,
    taskStats,
    staffPerformance,
    autoAssignRooms,
    startCleaningTask,
    completeCleaningTask,
    addHkStaff,
  } = useHousekeepingManager();
  const { isDarkMode } = useTheme();

  const [expandedStaff, setExpandedStaff] = useState<Set<string>>(new Set());
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffMax, setNewStaffMax] = useState('12');
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);

  const bg = isDarkMode ? '#0F1117' : '#F3F4F8';
  const surface = isDarkMode ? '#1A1D27' : '#FFFFFF';
  const txt = isDarkMode ? '#E8ECF2' : '#1A1A2E';
  const txtSec = isDarkMode ? '#8B95A8' : '#5A5878';
  const brd = isDarkMode ? '#2A2D3A' : '#E4E3EE';

  const today = new Date().toISOString().split('T')[0];

  const handleAutoAssign = useCallback(async () => {
    setIsAutoAssigning(true);
    try {
      const result = await autoAssignRooms({ date: today });
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Répartition terminée', `${result.assigned} chambres réparties automatiquement.`);
    } catch (e) {
      console.log('[Assignments] Auto-assign error:', e);
      Alert.alert('Erreur', 'Impossible de répartir les chambres.');
    } finally {
      setIsAutoAssigning(false);
    }
  }, [autoAssignRooms, today]);

  const handleAddStaff = useCallback(() => {
    if (!newStaffName.trim()) return;
    addHkStaff({ name: newStaffName.trim(), maxRoomsPerDay: parseInt(newStaffMax, 10) || 12 });
    setNewStaffName('');
    setNewStaffMax('12');
    setShowAddStaff(false);
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [newStaffName, newStaffMax, addHkStaff]);

  const toggleStaff = useCallback((id: string) => {
    setExpandedStaff((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const staffTasksMap = useMemo(() => {
    const map = new Map<string, typeof todayTasks>();
    for (const task of todayTasks) {
      if (task.assignedTo) {
        const existing = map.get(task.assignedTo) || [];
        existing.push(task);
        map.set(task.assignedTo, existing);
      }
    }
    return map;
  }, [todayTasks]);

  const progressPercent = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;

  const getElapsed = useCallback((startedAt: string | null) => {
    if (!startedAt) return '';
    const mins = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
    return `${mins} min`;
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Stack.Screen options={{ title: 'Répartition chambres', headerStyle: { backgroundColor: FT.headerBg }, headerTintColor: '#FFF', headerShadowVisible: false }} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.summaryCard, { backgroundColor: FT.headerBg }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{taskStats.total}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{taskStats.pending}</Text>
              <Text style={styles.summaryLabel}>En attente</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#EAB308' }]}>{taskStats.inProgress}</Text>
              <Text style={styles.summaryLabel}>En cours</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#4ADE80' }]}>{taskStats.completed}</Text>
              <Text style={styles.summaryLabel}>Terminés</Text>
            </View>
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>{progressPercent}%</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.autoAssignBtn, isAutoAssigning && styles.btnDisabled]}
            onPress={handleAutoAssign}
            disabled={isAutoAssigning}
            activeOpacity={0.7}
          >
            <Zap size={18} color="#FFF" />
            <Text style={styles.autoAssignText}>
              {isAutoAssigning ? 'Répartition...' : 'Répartition auto'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addStaffBtn, { borderColor: brd }]}
            onPress={() => setShowAddStaff(true)}
            activeOpacity={0.7}
          >
            <Plus size={18} color={FT.brand} />
            <Text style={[styles.addStaffText, { color: FT.brand }]}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: surface, borderColor: brd }]}>
          <View style={styles.sectionHeader}>
            <Users size={18} color={FT.brand} />
            <Text style={[styles.sectionTitle, { color: txt }]}>Équipe du jour</Text>
            <Text style={[styles.sectionCount, { color: txtSec }]}>
              {hkStaff.filter((s) => s.status === 'available').length} disponibles
            </Text>
          </View>

          {staffPerformance.map((perf) => {
            const isExpanded = expandedStaff.has(perf.id);
            const staffTasks = staffTasksMap.get(perf.id) || [];
            const loadPercent = perf.totalRooms > 0 ? Math.round((perf.completed / perf.totalRooms) * 100) : 0;
            const loadColor = loadPercent >= 80 ? '#22C55E' : loadPercent >= 50 ? '#EAB308' : '#3B82F6';

            return (
              <View key={perf.id} style={[styles.staffCard, { borderColor: brd }]}>
                <TouchableOpacity style={styles.staffHeader} onPress={() => toggleStaff(perf.id)} activeOpacity={0.7}>
                  <View style={[styles.staffAvatar, { backgroundColor: loadColor + '15' }]}>
                    <Text style={[styles.staffAvatarText, { color: loadColor }]}>
                      {perf.name.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={styles.staffInfo}>
                    <Text style={[styles.staffName, { color: txt }]}>{perf.name}</Text>
                    <View style={styles.staffMeta}>
                      <Text style={[styles.staffMetaText, { color: txtSec }]}>
                        {perf.completed}/{perf.totalRooms} ch.
                      </Text>
                      {perf.avgTimeMinutes > 0 && (
                        <Text style={[styles.staffMetaText, { color: txtSec }]}>
                          • moy. {perf.avgTimeMinutes} min
                        </Text>
                      )}
                    </View>
                    <View style={styles.staffLoadBar}>
                      <View style={[styles.staffLoadFill, { width: `${loadPercent}%`, backgroundColor: loadColor }]} />
                    </View>
                  </View>
                  <View style={[styles.staffCountBadge, { backgroundColor: loadColor + '15' }]}>
                    <Text style={[styles.staffCountText, { color: loadColor }]}>{perf.totalRooms}</Text>
                  </View>
                  {isExpanded ? <ChevronUp size={16} color={txtSec} /> : <ChevronDown size={16} color={txtSec} />}
                </TouchableOpacity>

                {isExpanded && staffTasks.length > 0 && (
                  <View style={styles.tasksList}>
                    {staffTasks.map((task) => {
                      const typeConfig = CLEANING_TYPE_CONFIG[task.cleaningType];
                      return (
                        <View key={task.id} style={[styles.taskRow, { borderColor: brd }]}>
                          <View style={[styles.taskTypeDot, { backgroundColor: typeConfig.color }]} />
                          <View style={styles.taskInfo}>
                            <View style={styles.taskInfoTop}>
                              <Text style={[styles.taskRoomNum, { color: txt }]}>{task.roomNumber}</Text>
                              <View style={[styles.taskTypeBadge, { backgroundColor: typeConfig.color + '15' }]}>
                                <Text style={[styles.taskTypeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
                              </View>
                            </View>
                            <Text style={[styles.taskEstimate, { color: txtSec }]}>
                              ~{task.estimatedMinutes} min
                              {task.status === 'in_progress' && task.startedAt && ` • ${getElapsed(task.startedAt)}`}
                            </Text>
                          </View>
                          {task.status === 'pending' && (
                            <TouchableOpacity
                              style={[styles.taskActionBtn, { backgroundColor: '#22C55E15' }]}
                              onPress={() => {
                                startCleaningTask(task.id);
                                if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              }}
                            >
                              <Play size={14} color="#22C55E" />
                            </TouchableOpacity>
                          )}
                          {task.status === 'in_progress' && (
                            <TouchableOpacity
                              style={[styles.taskActionBtn, { backgroundColor: '#EAB30815' }]}
                              onPress={() => {
                                completeCleaningTask(task.id);
                                if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                              }}
                            >
                              <Square size={14} color="#EAB308" />
                            </TouchableOpacity>
                          )}
                          {task.status === 'completed' && (
                            <View style={[styles.taskActionBtn, { backgroundColor: '#22C55E15' }]}>
                              <CheckCircle2 size={14} color="#22C55E" />
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {isExpanded && staffTasks.length === 0 && (
                  <View style={styles.noTasks}>
                    <Text style={[styles.noTasksText, { color: txtSec }]}>Aucune chambre assignée</Text>
                  </View>
                )}
              </View>
            );
          })}

          {staffPerformance.length === 0 && (
            <View style={styles.emptyState}>
              <Users size={32} color={txtSec} />
              <Text style={[styles.emptyText, { color: txtSec }]}>Aucun personnel disponible</Text>
            </View>
          )}
        </View>

        {todayTasks.filter((t) => {
          const task = t;
          if (task.status !== 'in_progress' || !task.startedAt) return false;
          const elapsed = (Date.now() - new Date(task.startedAt).getTime()) / 60000;
          return elapsed > task.estimatedMinutes * 1.5;
        }).length > 0 && (
          <View style={[styles.alertCard, { backgroundColor: surface, borderColor: '#EF444440' }]}>
            <View style={styles.alertHeader}>
              <AlertTriangle size={18} color="#EF4444" />
              <Text style={[styles.alertTitle, { color: txt }]}>Alertes retard</Text>
            </View>
            {todayTasks
              .filter((t) => {
                if (t.status !== 'in_progress' || !t.startedAt) return false;
                const elapsed = (Date.now() - new Date(t.startedAt).getTime()) / 60000;
                return elapsed > t.estimatedMinutes * 1.5;
              })
              .map((task) => (
                <View key={task.id} style={[styles.alertRow, { borderColor: brd }]}>
                  <Text style={[styles.alertRoomNum, { color: '#EF4444' }]}>{task.roomNumber}</Text>
                  <Text style={[styles.alertText, { color: txtSec }]}>
                    {getElapsed(task.startedAt)} (estimé {task.estimatedMinutes} min)
                  </Text>
                </View>
              ))}
          </View>
        )}

        <View style={[styles.sectionCard, { backgroundColor: surface, borderColor: brd }]}>
          <View style={styles.sectionHeader}>
            <Clock size={18} color={FT.brand} />
            <Text style={[styles.sectionTitle, { color: txt }]}>Performance</Text>
          </View>
          {staffPerformance.filter((p) => p.completed > 0).map((perf) => (
            <View key={perf.id} style={[styles.perfRow, { borderColor: brd }]}>
              <Text style={[styles.perfName, { color: txt }]}>{perf.name}</Text>
              <View style={styles.perfStats}>
                <View style={styles.perfStatItem}>
                  <Text style={[styles.perfStatValue, { color: FT.brand }]}>{perf.completed}</Text>
                  <Text style={[styles.perfStatLabel, { color: txtSec }]}>ch.</Text>
                </View>
                <View style={styles.perfStatItem}>
                  <Text style={[styles.perfStatValue, { color: txt }]}>{perf.avgTimeMinutes}</Text>
                  <Text style={[styles.perfStatLabel, { color: txtSec }]}>min moy.</Text>
                </View>
              </View>
            </View>
          ))}
          {staffPerformance.filter((p) => p.completed > 0).length === 0 && (
            <Text style={[styles.emptyPerfText, { color: txtSec }]}>Aucune donnée de performance encore</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddStaff} transparent animationType="fade" onRequestClose={() => setShowAddStaff(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: txt }]}>Ajouter une femme de chambre</Text>
              <TouchableOpacity onPress={() => setShowAddStaff(false)}>
                <X size={20} color={txtSec} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalFields}>
              <View style={styles.modalField}>
                <Text style={[styles.modalFieldLabel, { color: txtSec }]}>Nom complet</Text>
                <TextInput
                  style={[styles.modalFieldInput, { color: txt, borderColor: brd, backgroundColor: bg }]}
                  value={newStaffName}
                  onChangeText={setNewStaffName}
                  placeholder="Ex: Maria Lopez"
                  placeholderTextColor={txtSec}
                />
              </View>
              <View style={styles.modalField}>
                <Text style={[styles.modalFieldLabel, { color: txtSec }]}>Max chambres/jour</Text>
                <TextInput
                  style={[styles.modalFieldInput, { color: txt, borderColor: brd, backgroundColor: bg }]}
                  value={newStaffMax}
                  onChangeText={setNewStaffMax}
                  keyboardType="numeric"
                  placeholderTextColor={txtSec}
                />
              </View>
            </View>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddStaff} activeOpacity={0.7}>
              <Text style={styles.modalSaveBtnText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 14, gap: 14 },

  summaryCard: { borderRadius: 16, padding: 18 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '800' as const, color: '#FFF' },
  summaryLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '500' as const, textTransform: 'uppercase' as const, marginTop: 2 },
  summaryDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  progressBg: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  progressText: { fontSize: 13, fontWeight: '700' as const, color: '#4ADE80', minWidth: 36 },

  actionsRow: { flexDirection: 'row', gap: 10 },
  autoAssignBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: FT.brand,
    paddingVertical: 14,
    borderRadius: 12,
  },
  autoAssignText: { fontSize: 14, fontWeight: '700' as const, color: '#FFF' },
  btnDisabled: { opacity: 0.5 },
  addStaffBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  addStaffText: { fontSize: 13, fontWeight: '600' as const },

  sectionCard: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700' as const, flex: 1 },
  sectionCount: { fontSize: 12, fontWeight: '500' as const },

  staffCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  staffHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  staffAvatar: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  staffAvatarText: { fontSize: 14, fontWeight: '700' as const },
  staffInfo: { flex: 1, gap: 3 },
  staffName: { fontSize: 14, fontWeight: '600' as const },
  staffMeta: { flexDirection: 'row', gap: 4 },
  staffMetaText: { fontSize: 11 },
  staffLoadBar: { height: 3, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden', marginTop: 2 },
  staffLoadFill: { height: 3, borderRadius: 2 },
  staffCountBadge: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  staffCountText: { fontSize: 14, fontWeight: '800' as const },

  tasksList: { paddingHorizontal: 12, paddingBottom: 8, gap: 4 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 0.5 },
  taskTypeDot: { width: 6, height: 6, borderRadius: 3 },
  taskInfo: { flex: 1, gap: 2 },
  taskInfoTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskRoomNum: { fontSize: 15, fontWeight: '700' as const },
  taskTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  taskTypeText: { fontSize: 10, fontWeight: '600' as const },
  taskEstimate: { fontSize: 11 },
  taskActionBtn: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  noTasks: { padding: 16, alignItems: 'center' },
  noTasksText: { fontSize: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13 },

  alertCard: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 10 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertTitle: { fontSize: 14, fontWeight: '700' as const },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 0.5 },
  alertRoomNum: { fontSize: 15, fontWeight: '700' as const, minWidth: 40 },
  alertText: { fontSize: 12, flex: 1 },

  perfRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5 },
  perfName: { fontSize: 13, fontWeight: '600' as const },
  perfStats: { flexDirection: 'row', gap: 14 },
  perfStatItem: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  perfStatValue: { fontSize: 16, fontWeight: '700' as const },
  perfStatLabel: { fontSize: 10 },
  emptyPerfText: { fontSize: 12, textAlign: 'center' as const, paddingVertical: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 17, fontWeight: '700' as const },
  modalFields: { gap: 16 },
  modalField: { gap: 6 },
  modalFieldLabel: { fontSize: 12, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  modalFieldInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  modalSaveBtn: { backgroundColor: FT.brand, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  modalSaveBtnText: { fontSize: 15, fontWeight: '700' as const, color: '#FFF' },
});
