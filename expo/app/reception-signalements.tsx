import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { ChevronRight, AlertTriangle, Clock, CheckCircle, Wrench, User, Calendar, ChevronDown, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { MaintenanceTask } from '@/constants/types';

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const PRIORITY_CONFIG = {
  haute: { label: 'Haute', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', icon: '🔴' },
  moyenne: { label: 'Moyenne', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', icon: '🟡' },
  basse: { label: 'Basse', color: '#10B981', bg: 'rgba(16,185,129,0.08)', icon: '🟢' },
};

const STATUS_CONFIG = {
  en_attente: { label: 'En attente', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  en_cours: { label: 'En cours', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
  resolu: { label: 'Résolu', color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
};

const pad = (n: number) => n.toString().padStart(2, '0');

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

function formatFullDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return dateStr;
  }
}

function getDayKey(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return '';
  }
}

function getDayLabel(dateKey: string): string {
  try {
    const parts = dateKey.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;

    const dayName = DAYS_FR[d.getDay()];
    const dateLabel = `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;

    if (dateKey === todayKey) return `Aujourd'hui — ${dateLabel}`;
    if (dateKey === yesterdayKey) return `Hier — ${dateLabel}`;
    return `${dayName} ${dateLabel}`;
  } catch {
    return dateKey;
  }
}

export default function ReceptionSignalementsScreen() {
  const { maintenanceTasks } = useHotel();
  const { isDarkMode } = useTheme();
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);

  const nonPeriodicTasks = useMemo(
    () => maintenanceTasks.filter((t) => !t.isPeriodic),
    [maintenanceTasks]
  );

  const groupedByDay = useMemo(() => {
    const groups: Record<string, MaintenanceTask[]> = {};
    for (const task of nonPeriodicTasks) {
      const key = getDayKey(task.reportedAt);
      if (!key) continue;
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, tasks]) => ({
        dateKey,
        label: getDayLabel(dateKey),
        tasks: tasks.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()),
        pending: tasks.filter((t) => t.status !== 'resolu').length,
        total: tasks.length,
      }));
  }, [nonPeriodicTasks]);

  const pendingTotal = useMemo(
    () => nonPeriodicTasks.filter((t) => t.status !== 'resolu').length,
    [nonPeriodicTasks]
  );

  const toggleDay = useCallback((dateKey: string) => {
    setExpandedDay((prev) => (prev === dateKey ? null : dateKey));
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const bg = isDarkMode ? '#0B0E14' : '#F5F6FA';
  const surface = isDarkMode ? '#141820' : '#FFFFFF';
  const surfaceWarm = isDarkMode ? '#1A1F2B' : '#FAFBFD';
  const text = isDarkMode ? '#E2E8F0' : '#0F172A';
  const textSec = isDarkMode ? '#94A3B8' : '#475569';
  const textMuted = isDarkMode ? '#64748B' : '#94A3B8';
  const border = isDarkMode ? '#1E2433' : '#E8ECF1';
  const accent = isDarkMode ? '#6B83F2' : '#4F6BED';

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <Stack.Screen
        options={{
          title: 'Signalements',
          headerStyle: { backgroundColor: isDarkMode ? '#0B0E14' : '#0F172A' },
          headerTintColor: '#FFF',
        }}
      />

      <View style={[s.summaryBar, { backgroundColor: surface, borderBottomColor: border }]}>
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
            <AlertTriangle size={18} color="#EF4444" />
            <View>
              <Text style={[s.summaryValue, { color: '#EF4444' }]}>{pendingTotal}</Text>
              <Text style={[s.summaryLabel, { color: textMuted }]}>Non traités</Text>
            </View>
          </View>
          <View style={[s.summaryCard, { backgroundColor: 'rgba(59,130,246,0.08)' }]}>
            <Wrench size={18} color="#3B82F6" />
            <View>
              <Text style={[s.summaryValue, { color: '#3B82F6' }]}>{nonPeriodicTasks.filter((t) => t.status === 'en_cours').length}</Text>
              <Text style={[s.summaryLabel, { color: textMuted }]}>En cours</Text>
            </View>
          </View>
          <View style={[s.summaryCard, { backgroundColor: 'rgba(16,185,129,0.08)' }]}>
            <CheckCircle size={18} color="#10B981" />
            <View>
              <Text style={[s.summaryValue, { color: '#10B981' }]}>{nonPeriodicTasks.filter((t) => t.status === 'resolu').length}</Text>
              <Text style={[s.summaryLabel, { color: textMuted }]}>Résolus</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {groupedByDay.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>{'✅'}</Text>
            <Text style={[s.emptyTitle, { color: text }]}>Aucun signalement</Text>
            <Text style={[s.emptySubtext, { color: textSec }]}>Tous les problèmes ont été traités</Text>
          </View>
        )}

        {groupedByDay.map((day) => {
          const isExpanded = expandedDay === day.dateKey;
          return (
            <View key={day.dateKey} style={[s.dayCard, { backgroundColor: surface, borderColor: border }]}>
              <TouchableOpacity
                style={s.dayHeader}
                onPress={() => toggleDay(day.dateKey)}
                activeOpacity={0.7}
                testID={`day-${day.dateKey}`}
              >
                <View style={s.dayHeaderLeft}>
                  <View style={[s.dayIconCircle, { backgroundColor: day.pending > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)' }]}>
                    <Calendar size={16} color={day.pending > 0 ? '#EF4444' : '#10B981'} />
                  </View>
                  <View>
                    <Text style={[s.dayLabel, { color: text }]}>{day.label}</Text>
                    <Text style={[s.dayMeta, { color: textMuted }]}>
                      {day.total} signalement{day.total > 1 ? 's' : ''}
                      {day.pending > 0 ? ` · ${day.pending} en attente` : ''}
                    </Text>
                  </View>
                </View>
                <View style={s.dayHeaderRight}>
                  {day.pending > 0 && (
                    <View style={s.pendingBadge}>
                      <Text style={s.pendingBadgeText}>{day.pending}</Text>
                    </View>
                  )}
                  {isExpanded ? (
                    <ChevronDown size={18} color={textMuted} />
                  ) : (
                    <ChevronRight size={18} color={textMuted} />
                  )}
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={[s.dayContent, { borderTopColor: border }]}>
                  {day.tasks.map((task) => {
                    const priorityCfg = PRIORITY_CONFIG[task.priority];
                    const statusCfg = STATUS_CONFIG[task.status];
                    return (
                      <TouchableOpacity
                        key={task.id}
                        style={[s.taskCard, { backgroundColor: surfaceWarm, borderColor: border }]}
                        onPress={() => {
                          setSelectedTask(task);
                          if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        activeOpacity={0.7}
                        testID={`task-${task.id}`}
                      >
                        <View style={s.taskTop}>
                          <View style={[s.roomBadge, { backgroundColor: accent }]}>
                            <Text style={s.roomBadgeText}>{task.roomNumber}</Text>
                          </View>
                          <View style={s.taskTitleBlock}>
                            <Text style={[s.taskTitle, { color: text }]} numberOfLines={1}>{task.title}</Text>
                            <Text style={[s.taskCategory, { color: textMuted }]}>{task.category || 'Autre'}</Text>
                          </View>
                          <View style={[s.priorityPill, { backgroundColor: priorityCfg.bg }]}>
                            <Text style={s.priorityIcon}>{priorityCfg.icon}</Text>
                            <Text style={[s.priorityText, { color: priorityCfg.color }]}>{priorityCfg.label}</Text>
                          </View>
                        </View>

                        {task.description ? (
                          <Text style={[s.taskDesc, { color: textSec }]} numberOfLines={2}>{task.description}</Text>
                        ) : null}

                        <View style={s.taskBottom}>
                          <View style={s.taskMetaRow}>
                            <User size={12} color={textMuted} />
                            <Text style={[s.taskMetaText, { color: textMuted }]}>{task.reportedBy}</Text>
                          </View>
                          <View style={s.taskMetaRow}>
                            <Clock size={12} color={textMuted} />
                            <Text style={[s.taskMetaText, { color: textMuted }]}>{formatTime(task.reportedAt)}</Text>
                          </View>
                          <View style={[s.statusPill, { backgroundColor: statusCfg.bg }]}>
                            <Text style={[s.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={selectedTask !== null} transparent animationType="fade" onRequestClose={() => setSelectedTask(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setSelectedTask(null)}>
          <TouchableOpacity style={[s.modalCard, { backgroundColor: surface }]} activeOpacity={1} onPress={() => {}}>
            {selectedTask && (() => {
              const priorityCfg = PRIORITY_CONFIG[selectedTask.priority];
              const statusCfg = STATUS_CONFIG[selectedTask.status];
              return (
                <>
                  <View style={[s.modalHeader, { borderBottomColor: border }]}>
                    <View style={s.modalHeaderLeft}>
                      <View style={[s.modalRoomBadge, { backgroundColor: accent }]}>
                        <Text style={s.modalRoomText}>Ch. {selectedTask.roomNumber}</Text>
                      </View>
                      <View style={[s.modalStatusPill, { backgroundColor: statusCfg.bg }]}>
                        <Text style={[s.modalStatusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedTask(null)} style={[s.modalCloseBtn, { backgroundColor: surfaceWarm }]}>
                      <X size={18} color={textMuted} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
                    <Text style={[s.modalTitle, { color: text }]}>{selectedTask.title}</Text>

                    <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                      <Text style={[s.modalInfoLabel, { color: textMuted }]}>Priorité</Text>
                      <View style={[s.priorityPill, { backgroundColor: priorityCfg.bg }]}>
                        <Text style={s.priorityIcon}>{priorityCfg.icon}</Text>
                        <Text style={[s.priorityText, { color: priorityCfg.color }]}>{priorityCfg.label}</Text>
                      </View>
                    </View>

                    <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                      <Text style={[s.modalInfoLabel, { color: textMuted }]}>Catégorie</Text>
                      <Text style={[s.modalInfoValue, { color: text }]}>{selectedTask.category || 'Autre'}</Text>
                    </View>

                    <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                      <Text style={[s.modalInfoLabel, { color: textMuted }]}>Signalé par</Text>
                      <Text style={[s.modalInfoValue, { color: text }]}>{selectedTask.reportedBy}</Text>
                    </View>

                    <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                      <Text style={[s.modalInfoLabel, { color: textMuted }]}>Date / Heure</Text>
                      <Text style={[s.modalInfoValue, { color: text }]}>{formatFullDate(selectedTask.reportedAt)}</Text>
                    </View>

                    {selectedTask.assignedTo && (
                      <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                        <Text style={[s.modalInfoLabel, { color: textMuted }]}>Assigné à</Text>
                        <Text style={[s.modalInfoValue, { color: text }]}>{selectedTask.assignedTo}</Text>
                      </View>
                    )}

                    {selectedTask.description ? (
                      <View style={s.modalDescBlock}>
                        <Text style={[s.modalDescLabel, { color: textMuted }]}>Description</Text>
                        <Text style={[s.modalDescText, { color: textSec }]}>{selectedTask.description}</Text>
                      </View>
                    ) : null}

                    {selectedTask.resolutionNotes ? (
                      <View style={[s.modalResolution, { backgroundColor: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.15)' }]}>
                        <Text style={[s.modalResLabel, { color: '#10B981' }]}>Notes de résolution</Text>
                        <Text style={[s.modalResText, { color: textSec }]}>{selectedTask.resolutionNotes}</Text>
                      </View>
                    ) : null}

                    {selectedTask.comments.length > 0 && (
                      <View style={s.modalCommentsBlock}>
                        <Text style={[s.modalCommentsLabel, { color: textMuted }]}>Commentaires ({selectedTask.comments.length})</Text>
                        {selectedTask.comments.map((c) => (
                          <View key={c.id} style={[s.commentCard, { backgroundColor: surfaceWarm, borderColor: border }]}>
                            <View style={s.commentTop}>
                              <Text style={[s.commentAuthor, { color: text }]}>{c.author}</Text>
                              <Text style={[s.commentDate, { color: textMuted }]}>{formatFullDate(c.date)}</Text>
                            </View>
                            <Text style={[s.commentText, { color: textSec }]}>{c.text}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={[s.maintenanceNotice, { backgroundColor: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.15)' }]}>
                      <Wrench size={14} color="#3B82F6" />
                      <Text style={[s.maintenanceNoticeText, { color: '#3B82F6' }]}>
                        La maintenance a été notifiée automatiquement
                      </Text>
                    </View>
                  </ScrollView>
                </>
              );
            })()}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  summaryBar: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12 },
  summaryValue: { fontSize: 20, fontWeight: '800' as const },
  summaryLabel: { fontSize: 10, fontWeight: '500' as const, marginTop: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 10 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const },
  emptySubtext: { fontSize: 13 },
  dayCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  dayHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dayIconCircle: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dayLabel: { fontSize: 14, fontWeight: '700' as const },
  dayMeta: { fontSize: 11, marginTop: 2 },
  dayHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pendingBadge: { backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, minWidth: 24, alignItems: 'center' },
  pendingBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' as const },
  dayContent: { borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  taskCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  taskTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  roomBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, minWidth: 42, alignItems: 'center' },
  roomBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '800' as const },
  taskTitleBlock: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '600' as const },
  taskCategory: { fontSize: 11, marginTop: 1 },
  priorityPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  priorityIcon: { fontSize: 8 },
  priorityText: { fontSize: 11, fontWeight: '600' as const },
  taskDesc: { fontSize: 12, lineHeight: 17 },
  taskBottom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskMetaText: { fontSize: 11 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 'auto' },
  statusText: { fontSize: 10, fontWeight: '700' as const },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 20, maxHeight: '85%', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalRoomBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  modalRoomText: { color: '#FFF', fontSize: 14, fontWeight: '800' as const },
  modalStatusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  modalStatusText: { fontSize: 12, fontWeight: '700' as const },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  modalBody: { paddingHorizontal: 20, paddingVertical: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' as const, marginBottom: 16 },
  modalInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  modalInfoLabel: { fontSize: 13 },
  modalInfoValue: { fontSize: 13, fontWeight: '600' as const },
  modalDescBlock: { marginTop: 16, gap: 6 },
  modalDescLabel: { fontSize: 12, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  modalDescText: { fontSize: 14, lineHeight: 20 },
  modalResolution: { marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 1, gap: 6 },
  modalResLabel: { fontSize: 12, fontWeight: '700' as const },
  modalResText: { fontSize: 13, lineHeight: 19 },
  modalCommentsBlock: { marginTop: 16, gap: 8 },
  modalCommentsLabel: { fontSize: 12, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  commentCard: { padding: 12, borderRadius: 10, borderWidth: 1, gap: 4 },
  commentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commentAuthor: { fontSize: 13, fontWeight: '600' as const },
  commentDate: { fontSize: 10 },
  commentText: { fontSize: 13, lineHeight: 18 },
  maintenanceNotice: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  maintenanceNoticeText: { fontSize: 12, fontWeight: '600' as const, flex: 1 },
});
