import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Search,
  X,
  Clock,
  User,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import { useHousekeepingManager } from '@/providers/HousekeepingProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Room, RoomPlanStatus, ROOM_PLAN_STATUS_CONFIG } from '@/constants/types';
import { FT } from '@/constants/flowtym';

function getRoomPlanStatus(room: Room): RoomPlanStatus {
  if (room.status === 'hors_service') return 'out_of_service';
  if (room.cleaningStatus === 'en_cours') return 'cleaning';
  if (room.cleaningStatus === 'nettoyee') return 'inspection';
  if (room.cleaningStatus === 'validee') return 'clean';
  if (room.status === 'occupe') return 'occupied';
  if (room.status === 'depart' || room.status === 'recouche') return 'dirty';
  if (room.status === 'libre') return 'clean';
  return 'dirty';
}

interface RoomBlockProps {
  room: Room;
  onPress: () => void;
}

const RoomBlock = React.memo(function RoomBlock({ room, onPress }: RoomBlockProps) {
  const planStatus = getRoomPlanStatus(room);
  const config = ROOM_PLAN_STATUS_CONFIG[planStatus];

  return (
    <TouchableOpacity
      style={[styles.roomBlock, { backgroundColor: config.bgColor, borderColor: config.color + '40' }]}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`room-block-${room.roomNumber}`}
    >
      <Text style={[styles.roomBlockNumber, { color: config.color }]}>{room.roomNumber}</Text>
      <View style={[styles.roomBlockDot, { backgroundColor: config.color }]} />
    </TouchableOpacity>
  );
});

export default function HotelPlanScreen() {
  const router = useRouter();
  const { rooms } = useHotel();
  const { todayTasks } = useHousekeepingManager();
  const { isDarkMode } = useTheme();

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<RoomPlanStatus | 'all'>('all');


  const bg = isDarkMode ? '#0F1117' : '#F3F4F8';
  const surface = isDarkMode ? '#1A1D27' : '#FFFFFF';
  const text = isDarkMode ? '#E8ECF2' : '#1A1A2E';
  const textSec = isDarkMode ? '#8B95A8' : '#5A5878';
  const border = isDarkMode ? '#2A2D3A' : '#E4E3EE';

  const stats = useMemo(() => {
    let clean = 0, dirty = 0, cleaning = 0, occupied = 0, inspection = 0, outOfService = 0;
    for (const room of rooms) {
      const s = getRoomPlanStatus(room);
      if (s === 'clean') clean++;
      else if (s === 'dirty') dirty++;
      else if (s === 'cleaning') cleaning++;
      else if (s === 'occupied') occupied++;
      else if (s === 'inspection') inspection++;
      else if (s === 'out_of_service') outOfService++;
    }
    return { clean, dirty, cleaning, occupied, inspection, outOfService };
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    let result = rooms;
    if (activeFilter !== 'all') {
      result = result.filter((r) => getRoomPlanStatus(r) === activeFilter);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter((r) =>
        r.roomNumber.toLowerCase().includes(q) ||
        r.currentReservation?.guestName?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [rooms, activeFilter, searchText]);

  const groupedByFloor = useMemo(() => {
    const floorSet = [...new Set(filteredRooms.map((r) => r.floor))].sort((a, b) => b - a);
    return floorSet.map((floor) => ({
      floor,
      rooms: filteredRooms.filter((r) => r.floor === floor).sort((a, b) =>
        a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })
      ),
    }));
  }, [filteredRooms]);

  const handleRoomPress = useCallback((room: Room) => {
    setSelectedRoom(room);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const getTaskForRoom = useCallback((roomId: string) => {
    return todayTasks.find((t) => t.roomId === roomId && t.status !== 'completed');
  }, [todayTasks]);

  const getElapsed = useCallback((startedAt: string | null) => {
    if (!startedAt) return null;
    const mins = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
    return `${mins} min`;
  }, []);

  const selectedRoomTask = selectedRoom ? getTaskForRoom(selectedRoom.id) : null;
  const selectedRoomStatus = selectedRoom ? getRoomPlanStatus(selectedRoom) : null;
  const selectedRoomStatusConfig = selectedRoomStatus ? ROOM_PLAN_STATUS_CONFIG[selectedRoomStatus] : null;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Stack.Screen options={{ title: 'Plan de l\'hôtel', headerStyle: { backgroundColor: FT.headerBg }, headerTintColor: '#FFF', headerShadowVisible: false }} />

      <View style={[styles.statsBar, { backgroundColor: surface, borderBottomColor: border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsContent}>
          {[
            { label: 'Propres', value: stats.clean, color: '#22C55E' },
            { label: 'À nettoyer', value: stats.dirty, color: '#EF4444' },
            { label: 'En cours', value: stats.cleaning, color: '#EAB308' },
            { label: 'Occupées', value: stats.occupied, color: '#3B82F6' },
            { label: 'Inspection', value: stats.inspection, color: '#8B5CF6' },
            { label: 'H.S.', value: stats.outOfService, color: '#6B7280' },
          ].map((s) => (
            <TouchableOpacity
              key={s.label}
              style={[styles.statChip, activeFilter === s.label.toLowerCase() && { borderColor: s.color }]}
              onPress={() => {
                const map: Record<string, RoomPlanStatus | 'all'> = {
                  'Propres': 'clean', 'À nettoyer': 'dirty', 'En cours': 'cleaning',
                  'Occupées': 'occupied', 'Inspection': 'inspection', 'H.S.': 'out_of_service',
                };
                const f = map[s.label] || 'all';
                setActiveFilter((prev) => prev === f ? 'all' : f);
              }}
            >
              <View style={[styles.statDot, { backgroundColor: s.color }]} />
              <Text style={[styles.statValue, { color: text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: textSec }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.searchBar, { backgroundColor: surface, borderBottomColor: border }]}>
        <View style={[styles.searchInput, { backgroundColor: bg, borderColor: border }]}>
          <Search size={16} color={textSec} />
          <TextInput
            style={[styles.searchText, { color: text }]}
            placeholder="Rechercher chambre..."
            placeholderTextColor={textSec}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <X size={16} color={textSec} />
            </TouchableOpacity>
          )}
        </View>
        {activeFilter !== 'all' && (
          <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setActiveFilter('all')}>
            <X size={14} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.planScroll} contentContainerStyle={styles.planContent} showsVerticalScrollIndicator={false}>
        {groupedByFloor.map(({ floor, rooms: floorRooms }) => (
          <View key={floor} style={[styles.floorSection, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.floorHeader}>
              <View style={[styles.floorBadge, { backgroundColor: FT.brand + '15' }]}>
                <Text style={[styles.floorBadgeText, { color: FT.brand }]}>É{floor}</Text>
              </View>
              <Text style={[styles.floorTitle, { color: text }]}>Étage {floor}</Text>
              <Text style={[styles.floorCount, { color: textSec }]}>{floorRooms.length} ch.</Text>
            </View>
            <View style={styles.roomGrid}>
              {floorRooms.map((room) => (
                <RoomBlock key={room.id} room={room} onPress={() => handleRoomPress(room)} />
              ))}
            </View>
          </View>
        ))}
        {groupedByFloor.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40 }}>🏨</Text>
            <Text style={[styles.emptyTitle, { color: text }]}>Aucune chambre trouvée</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={!!selectedRoom} transparent animationType="slide" onRequestClose={() => setSelectedRoom(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: surface }]}>
            <View style={styles.modalHandle} />
            {selectedRoom && selectedRoomStatusConfig && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalRoomInfo}>
                    <Text style={[styles.modalRoomNumber, { color: text }]}>{selectedRoom.roomNumber}</Text>
                    <View style={[styles.modalStatusBadge, { backgroundColor: selectedRoomStatusConfig.bgColor }]}>
                      <View style={[styles.modalStatusDot, { backgroundColor: selectedRoomStatusConfig.color }]} />
                      <Text style={[styles.modalStatusText, { color: selectedRoomStatusConfig.color }]}>
                        {selectedRoomStatusConfig.label}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: bg }]} onPress={() => setSelectedRoom(null)}>
                    <X size={18} color={textSec} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.modalDivider, { backgroundColor: border }]} />

                <View style={styles.modalBody}>
                  <View style={styles.modalInfoRow}>
                    <Text style={[styles.modalInfoLabel, { color: textSec }]}>Étage</Text>
                    <Text style={[styles.modalInfoValue, { color: text }]}>{selectedRoom.floor}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={[styles.modalInfoLabel, { color: textSec }]}>Type</Text>
                    <Text style={[styles.modalInfoValue, { color: text }]}>{selectedRoom.roomType} {selectedRoom.roomCategory}</Text>
                  </View>
                  {selectedRoom.currentReservation && (
                    <View style={styles.modalInfoRow}>
                      <Text style={[styles.modalInfoLabel, { color: textSec }]}>Client</Text>
                      <Text style={[styles.modalInfoValue, { color: text }]}>{selectedRoom.currentReservation.guestName}</Text>
                    </View>
                  )}
                  {selectedRoomTask && (
                    <>
                      <View style={[styles.modalDivider, { backgroundColor: border }]} />
                      <View style={styles.modalTaskSection}>
                        <Text style={[styles.modalTaskTitle, { color: text }]}>Nettoyage en cours</Text>
                        {selectedRoomTask.assignedToName && (
                          <View style={styles.modalTaskRow}>
                            <User size={14} color={textSec} />
                            <Text style={[styles.modalTaskText, { color: text }]}>{selectedRoomTask.assignedToName}</Text>
                          </View>
                        )}
                        {selectedRoomTask.startedAt && (
                          <View style={styles.modalTaskRow}>
                            <Clock size={14} color={textSec} />
                            <Text style={[styles.modalTaskText, { color: text }]}>
                              Début: {new Date(selectedRoomTask.startedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            <Text style={[styles.modalTaskElapsed, { color: FT.warning }]}>
                              {getElapsed(selectedRoomTask.startedAt)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </>
                  )}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: FT.brand + '10', borderColor: FT.brand + '30' }]}
                    onPress={() => {
                      setSelectedRoom(null);
                      router.push({ pathname: '/room-details', params: { roomId: selectedRoom.id } });
                    }}
                  >
                    <FileText size={16} color={FT.brand} />
                    <Text style={[styles.modalActionText, { color: FT.brand }]}>Détails</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#22C55E10', borderColor: '#22C55E30' }]}
                    onPress={() => {
                      setSelectedRoom(null);
                    }}
                  >
                    <CheckCircle2 size={16} color="#22C55E" />
                    <Text style={[styles.modalActionText, { color: '#22C55E' }]}>Inspection</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#F59E0B10', borderColor: '#F59E0B30' }]}
                    onPress={() => {
                      setSelectedRoom(null);
                    }}
                  >
                    <AlertTriangle size={16} color="#F59E0B" />
                    <Text style={[styles.modalActionText, { color: '#F59E0B' }]}>Note</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsBar: { borderBottomWidth: 1 },
  statsContent: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statValue: { fontSize: 16, fontWeight: '800' as const },
  statLabel: { fontSize: 11, fontWeight: '500' as const },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1 },
  searchInput: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 8, borderRadius: 10, borderWidth: 1 },
  searchText: { flex: 1, fontSize: 14, padding: 0 },
  clearFilterBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: FT.brand, justifyContent: 'center', alignItems: 'center' },
  planScroll: { flex: 1 },
  planContent: { padding: 14, gap: 12 },
  floorSection: { borderRadius: 14, padding: 16, borderWidth: 1 },
  floorHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  floorBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  floorBadgeText: { fontSize: 13, fontWeight: '800' as const },
  floorTitle: { fontSize: 15, fontWeight: '700' as const, flex: 1 },
  floorCount: { fontSize: 12, fontWeight: '500' as const },
  roomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roomBlock: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  roomBlockNumber: { fontSize: 14, fontWeight: '800' as const },
  roomBlockDot: { width: 6, height: 6, borderRadius: 3 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600' as const },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 20, maxHeight: '70%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginTop: 10, marginBottom: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  modalRoomInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalRoomNumber: { fontSize: 32, fontWeight: '900' as const },
  modalStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  modalStatusDot: { width: 8, height: 8, borderRadius: 4 },
  modalStatusText: { fontSize: 12, fontWeight: '700' as const },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  modalDivider: { height: 1, marginVertical: 14, marginHorizontal: 20 },
  modalBody: { paddingHorizontal: 20, gap: 10 },
  modalInfoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalInfoLabel: { fontSize: 13, fontWeight: '500' as const },
  modalInfoValue: { fontSize: 13, fontWeight: '600' as const },
  modalTaskSection: { gap: 8 },
  modalTaskTitle: { fontSize: 14, fontWeight: '700' as const },
  modalTaskRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTaskText: { fontSize: 13, fontWeight: '500' as const },
  modalTaskElapsed: { fontSize: 12, fontWeight: '700' as const, marginLeft: 'auto' },
  modalActions: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 16 },
  modalActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  modalActionText: { fontSize: 12, fontWeight: '600' as const },
});
