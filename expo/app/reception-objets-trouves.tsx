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
import { ChevronRight, Package, Clock, User, Calendar, ChevronDown, X, Undo2, Gift } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { LostFoundItem } from '@/constants/types';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const OBJECT_TYPE_ICONS: Record<string, string> = {
  'Téléphone': '📱',
  'PC portable': '💻',
  'Clés': '🔑',
  'Vêtement': '👔',
  'Sac': '👜',
  'Chaussures': '👟',
  'Bijoux': '💍',
  'Argent': '💶',
};

const STATUS_CONFIG = {
  en_attente: { label: 'En attente', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  rendu: { label: 'Rendu', color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
  donne: { label: 'Donné', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
};

const pad = (n: number) => n.toString().padStart(2, '0');

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

export default function ReceptionObjetsTrouvesScreen() {
  const { lostFoundItems } = useHotel();
  const { isDarkMode } = useTheme();
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);

  const groupedByDay = useMemo(() => {
    const groups: Record<string, LostFoundItem[]> = {};
    for (const item of lostFoundItems) {
      const key = item.foundDate;
      if (!key) continue;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, items]) => ({
        dateKey,
        label: getDayLabel(dateKey),
        items,
        pending: items.filter((i) => i.status === 'en_attente').length,
        total: items.length,
      }));
  }, [lostFoundItems]);

  const pendingTotal = useMemo(
    () => lostFoundItems.filter((i) => i.status === 'en_attente').length,
    [lostFoundItems]
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
          title: 'Objets trouvés',
          headerStyle: { backgroundColor: isDarkMode ? '#0B0E14' : '#0F172A' },
          headerTintColor: '#FFF',
        }}
      />

      <View style={[s.summaryBar, { backgroundColor: surface, borderBottomColor: border }]}>
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { backgroundColor: 'rgba(245,158,11,0.08)' }]}>
            <Package size={18} color="#F59E0B" />
            <View>
              <Text style={[s.summaryValue, { color: '#F59E0B' }]}>{pendingTotal}</Text>
              <Text style={[s.summaryLabel, { color: textMuted }]}>En attente</Text>
            </View>
          </View>
          <View style={[s.summaryCard, { backgroundColor: 'rgba(16,185,129,0.08)' }]}>
            <Undo2 size={18} color="#10B981" />
            <View>
              <Text style={[s.summaryValue, { color: '#10B981' }]}>{lostFoundItems.filter((i) => i.status === 'rendu').length}</Text>
              <Text style={[s.summaryLabel, { color: textMuted }]}>Rendus</Text>
            </View>
          </View>
          <View style={[s.summaryCard, { backgroundColor: 'rgba(139,92,246,0.08)' }]}>
            <Gift size={18} color="#8B5CF6" />
            <View>
              <Text style={[s.summaryValue, { color: '#8B5CF6' }]}>{lostFoundItems.filter((i) => i.status === 'donne').length}</Text>
              <Text style={[s.summaryLabel, { color: textMuted }]}>Donnés</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {groupedByDay.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>{'📦'}</Text>
            <Text style={[s.emptyTitle, { color: text }]}>Aucun objet trouvé</Text>
            <Text style={[s.emptySubtext, { color: textSec }]}>Aucun objet n'a été déclaré</Text>
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
                  <View style={[s.dayIconCircle, { backgroundColor: day.pending > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)' }]}>
                    <Calendar size={16} color={day.pending > 0 ? '#F59E0B' : '#10B981'} />
                  </View>
                  <View>
                    <Text style={[s.dayLabel, { color: text }]}>{day.label}</Text>
                    <Text style={[s.dayMeta, { color: textMuted }]}>
                      {day.total} objet{day.total > 1 ? 's' : ''}
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
                  {day.items.map((item) => {
                    const statusCfg = STATUS_CONFIG[item.status];
                    const icon = OBJECT_TYPE_ICONS[item.itemName] ?? '📦';
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[s.itemCard, { backgroundColor: surfaceWarm, borderColor: border }]}
                        onPress={() => {
                          setSelectedItem(item);
                          if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        activeOpacity={0.7}
                        testID={`item-${item.id}`}
                      >
                        <View style={s.itemTop}>
                          <View style={[s.objectIconCircle, { backgroundColor: accent + '12' }]}>
                            <Text style={s.objectIconText}>{icon}</Text>
                          </View>
                          <View style={s.itemTitleBlock}>
                            <Text style={[s.itemTitle, { color: text }]}>{item.itemName}</Text>
                            <Text style={[s.itemRoom, { color: textMuted }]}>Chambre {item.roomNumber}</Text>
                          </View>
                          <View style={[s.statusPill, { backgroundColor: statusCfg.bg }]}>
                            <Text style={[s.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                          </View>
                        </View>

                        {item.description ? (
                          <Text style={[s.itemDesc, { color: textSec }]} numberOfLines={2}>{item.description}</Text>
                        ) : null}

                        <View style={s.itemBottom}>
                          <View style={s.itemMetaRow}>
                            <User size={12} color={textMuted} />
                            <Text style={[s.itemMetaText, { color: textMuted }]}>{item.reportedBy}</Text>
                          </View>
                          <View style={s.itemMetaRow}>
                            <Clock size={12} color={textMuted} />
                            <Text style={[s.itemMetaText, { color: textMuted }]}>{item.foundDate}</Text>
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

      <Modal visible={selectedItem !== null} transparent animationType="fade" onRequestClose={() => setSelectedItem(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setSelectedItem(null)}>
          <TouchableOpacity style={[s.modalCard, { backgroundColor: surface }]} activeOpacity={1} onPress={() => {}}>
            {selectedItem && (() => {
              const statusCfg = STATUS_CONFIG[selectedItem.status];
              const icon = OBJECT_TYPE_ICONS[selectedItem.itemName] ?? '📦';
              return (
                <>
                  <View style={[s.modalHeader, { borderBottomColor: border }]}>
                    <View style={s.modalHeaderLeft}>
                      <View style={[s.modalIconCircle, { backgroundColor: accent + '12' }]}>
                        <Text style={s.modalIconText}>{icon}</Text>
                      </View>
                      <View style={[s.modalStatusPill, { backgroundColor: statusCfg.bg }]}>
                        <Text style={[s.modalStatusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedItem(null)} style={[s.modalCloseBtn, { backgroundColor: surfaceWarm }]}>
                      <X size={18} color={textMuted} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
                    <Text style={[s.modalTitle, { color: text }]}>{selectedItem.itemName}</Text>

                    <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                      <Text style={[s.modalInfoLabel, { color: textMuted }]}>Chambre</Text>
                      <View style={[s.modalRoomBadge, { backgroundColor: accent }]}>
                        <Text style={s.modalRoomText}>{selectedItem.roomNumber}</Text>
                      </View>
                    </View>

                    <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                      <Text style={[s.modalInfoLabel, { color: textMuted }]}>Type d'objet</Text>
                      <Text style={[s.modalInfoValue, { color: text }]}>{icon} {selectedItem.itemName}</Text>
                    </View>

                    <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                      <Text style={[s.modalInfoLabel, { color: textMuted }]}>Trouvé par</Text>
                      <Text style={[s.modalInfoValue, { color: text }]}>{selectedItem.reportedBy}</Text>
                    </View>

                    <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                      <Text style={[s.modalInfoLabel, { color: textMuted }]}>Date</Text>
                      <Text style={[s.modalInfoValue, { color: text }]}>{selectedItem.foundDate}</Text>
                    </View>

                    {selectedItem.returnedTo ? (
                      <View style={[s.modalInfoRow, { borderBottomColor: border }]}>
                        <Text style={[s.modalInfoLabel, { color: textMuted }]}>Restitué à</Text>
                        <Text style={[s.modalInfoValue, { color: text }]}>{selectedItem.returnedTo}</Text>
                      </View>
                    ) : null}

                    {selectedItem.description ? (
                      <View style={s.modalDescBlock}>
                        <Text style={[s.modalDescLabel, { color: textMuted }]}>Description</Text>
                        <Text style={[s.modalDescText, { color: textSec }]}>{selectedItem.description}</Text>
                      </View>
                    ) : null}

                    {selectedItem.status === 'en_attente' && (
                      <View style={[s.pendingNotice, { backgroundColor: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.15)' }]}>
                        <Package size={14} color="#F59E0B" />
                        <Text style={[s.pendingNoticeText, { color: '#F59E0B' }]}>
                          Objet en attente de restitution au propriétaire
                        </Text>
                      </View>
                    )}
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
  pendingBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, minWidth: 24, alignItems: 'center' },
  pendingBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' as const },
  dayContent: { borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  itemCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  objectIconCircle: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  objectIconText: { fontSize: 20 },
  itemTitleBlock: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '600' as const },
  itemRoom: { fontSize: 11, marginTop: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' as const },
  itemDesc: { fontSize: 12, lineHeight: 17 },
  itemBottom: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemMetaText: { fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 20, maxHeight: '85%', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalIconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  modalIconText: { fontSize: 24 },
  modalStatusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  modalStatusText: { fontSize: 12, fontWeight: '700' as const },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  modalBody: { paddingHorizontal: 20, paddingVertical: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' as const, marginBottom: 16 },
  modalInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  modalInfoLabel: { fontSize: 13 },
  modalInfoValue: { fontSize: 13, fontWeight: '600' as const },
  modalRoomBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  modalRoomText: { color: '#FFF', fontSize: 13, fontWeight: '800' as const },
  modalDescBlock: { marginTop: 16, gap: 6 },
  modalDescLabel: { fontSize: 12, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  modalDescText: { fontSize: 14, lineHeight: 20 },
  pendingNotice: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  pendingNoticeText: { fontSize: 12, fontWeight: '600' as const, flex: 1 },
});
