import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Plus, DoorOpen, UserPlus, X, ChevronDown, Coffee, Filter, MoreHorizontal } from 'lucide-react-native';
import UserMenuButton from '@/components/UserMenuButton';
import FlowtymHeader from '@/components/FlowtymHeader';
import DeskFloorSection from '@/components/DeskFloorSection';
import DeskStatusBar from '@/components/DeskStatusBar';
import * as Haptics from 'expo-haptics';
import { useHotel, useFilteredRooms } from '@/providers/HotelProvider';
import { PMSStatusIndicator } from '@/components/PMSStatusIndicator';
import { FT } from '@/constants/flowtym';
import { RoomStatus, ClientBadge, Room, ROOM_STATUS_CONFIG, CLEANING_STATUS_CONFIG } from '@/constants/types';


export default function ReceptionDashboard() {
  const router = useRouter();
  const {
    rooms,
    selectedRoomIds,
    isLoading,
    pmsSync,
    isSyncing,
    syncPms,
    bulkDeparture,
    breakfastOrders,
    toggleRoomSelection,
    toggleFloorSelection,
    clearSelection,
  } = useHotel();

  const unbilledBreakfasts = useMemo(
    () => breakfastOrders.filter((o) => !o.included && o.status === 'servi' && !o.billingNotificationSent),
    [breakfastOrders]
  );

  const [statusFilter] = useState<RoomStatus | 'all'>('all');
  const [floorFilter, setFloorFilter] = useState<number | 'all'>('all');
  const [badgeFilter] = useState<ClientBadge | 'all'>('all');
  const [searchText] = useState('');
  const [showFloorDropdown, setShowFloorDropdown] = useState(false);

  const { filtered, floors, total } = useFilteredRooms({
    status: statusFilter,
    floor: floorFilter,
    badge: badgeFilter,
    search: searchText,
  });

  const selectionCount = selectedRoomIds.size;
  const selectedOccupied = useMemo(
    () => rooms.filter((r) => selectedRoomIds.has(r.id) && r.status === 'occupe').length,
    [rooms, selectedRoomIds]
  );

  const statusCounts = useMemo(() => {
    const counts = { libre: 0, occupe: 0, depart: 0, recouche: 0, hors_service: 0 };
    rooms.forEach((r) => { counts[r.status]++; });
    return counts;
  }, [rooms]);

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const handleRoomPress = useCallback((room: Room) => {
    router.push({ pathname: '/room-details', params: { roomId: room.id } });
  }, [router]);

  const handleDeparture = useCallback(() => {
    if (selectedOccupied === 0) {
      Alert.alert('Action impossible', 'Aucune chambre occupée sélectionnée.');
      return;
    }
    Alert.alert('Confirmer le départ', `Confirmer le départ pour ${selectedOccupied} chambre(s) ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        style: 'destructive',
        onPress: () => {
          const ids = rooms.filter((r) => selectedRoomIds.has(r.id) && r.status === 'occupe').map((r) => r.id);
          bulkDeparture(ids);
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [selectedOccupied, rooms, selectedRoomIds, bulkDeparture]);

  const handleAssign = useCallback(() => {
    if (selectionCount === 0) return;
    const ids = Array.from(selectedRoomIds);
    router.push({ pathname: '/assign-rooms', params: { roomIds: ids.join(',') } });
  }, [selectionCount, selectedRoomIds, router]);

  const groupedByFloor = useMemo(() => {
    const groups: Record<number, Room[]> = {};
    filtered.forEach((room) => {
      if (!groups[room.floor]) groups[room.floor] = [];
      groups[room.floor].push(room);
    });
    return Object.entries(groups)
      .map(([floor, floorRooms]) => ({
        floor: parseInt(floor, 10),
        rooms: floorRooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)),
      }))
      .sort((a, b) => a.floor - b.floor);
  }, [filtered]);

  const renderFloorSection = useCallback(
    ({ item }: { item: { floor: number; rooms: Room[] } }) => {
      const floorRoomIds = item.rooms.map((r) => r.id);
      const allSelected = floorRoomIds.every((id) => selectedRoomIds.has(id));

      return (
        <DeskFloorSection
          floorNumber={item.floor}
          onSelectAll={() => toggleFloorSelection(item.floor)}
          allSelected={allSelected}
        >
          {item.rooms.map((room) => {
            const isSelected = selectedRoomIds.has(room.id);
            const staffMember = room.assignedTo ? room.cleaningAssignee : undefined;
            const initials = staffMember ? staffMember.split(' ').map((n) => n.charAt(0)).join('') : undefined;

            return (
              <TouchableOpacity
                key={room.id}
                style={[
                  ftStyles.roomChip,
                  { backgroundColor: ROOM_STATUS_CONFIG[room.status].color },
                  isSelected && ftStyles.roomChipSelected,
                ]}
                onPress={() => handleRoomPress(room)}
                onLongPress={() => {
                  toggleRoomSelection(room.id);
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                activeOpacity={0.7}
                testID={`room-card-${room.roomNumber}`}
              >
                {isSelected && <View style={ftStyles.roomCheck}><Text style={ftStyles.roomCheckText}>✓</Text></View>}
                <Text style={ftStyles.roomNum}>{room.roomNumber}</Text>
                {room.clientBadge === 'vip' && <Text style={ftStyles.roomBadge}>⭐</Text>}
                {room.clientBadge === 'prioritaire' && <Text style={ftStyles.roomBadge}>⚡</Text>}
                {room.cleaningStatus !== 'none' && (
                  <Text style={ftStyles.roomCleanIcon}>{CLEANING_STATUS_CONFIG[room.cleaningStatus].icon}</Text>
                )}
                {initials && (
                  <View style={ftStyles.roomAvatar}>
                    <Text style={ftStyles.roomAvatarText}>{initials}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </DeskFloorSection>
      );
    },
    [selectedRoomIds, handleRoomPress, toggleRoomSelection, toggleFloorSelection]
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Réception' }} />
        <ActivityIndicator size="large" color={FT.brand} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: FT.headerBg },
          headerTintColor: '#FFF',
          headerShadowVisible: false,
          headerTitle: () => (
            <FlowtymHeader
              hotelName="Grand Hôtel"
              navItems={[
                { label: 'Statistiques', icon: '📊' },
                { label: 'Alertes', icon: '🔔', badge: unbilledBreakfasts.length },
              ]}
              rightItems={
                <View style={styles.headerRight}>
                  {unbilledBreakfasts.length > 0 && (
                    <TouchableOpacity style={styles.billingBtn} onPress={() => {
                      Alert.alert(
                        `${unbilledBreakfasts.length} PDJ à facturer`,
                        unbilledBreakfasts.map((o) => `Ch. ${o.roomNumber} — ${o.personCount} pers.`).join('\n'),
                        [{ text: 'OK' }]
                      );
                    }}>
                      <Coffee size={16} color="#FFF" />
                      <View style={styles.billingBadge}>
                        <Text style={styles.billingBadgeText}>{unbilledBreakfasts.length}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  <PMSStatusIndicator syncState={pmsSync} isSyncing={isSyncing} onSync={syncPms} />
                  <UserMenuButton />
                </View>
              }
            />
          ),
          headerRight: () => null,
        }}
      />

      <View style={styles.dashHeader}>
        <View>
          <Text style={styles.dashTitle}>Housekeeping <Text style={styles.dashTitleLight}>Dashboard</Text></Text>
        </View>
        <View style={styles.dashActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Filter size={16} color={FT.textSec} />
            <Text style={styles.iconBtnText}>Filtres</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <MoreHorizontal size={16} color={FT.textSec} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterDrop}
          onPress={() => { setShowFloorDropdown(!showFloorDropdown); }}
        >
          <Text style={styles.filterDropText}>
            {floorFilter === 'all' ? '🏢 Étage' : `Étage ${floorFilter}`}
          </Text>
          <ChevronDown size={12} color={FT.textSec} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterDrop}>
          <Text style={styles.filterDropText}>🗓 {today}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterDrop}>
          <Text style={styles.filterDropText}>👥 Occupées</Text>
        </TouchableOpacity>
        <View style={styles.roomCounter}>
          <Text style={styles.roomCounterText}>🏠 {filtered.length} / {total} chambres</Text>
        </View>
        <TouchableOpacity style={styles.filterDrop}>
          <Text style={styles.filterDropText}>📊 Reports</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusRow}>
        <DeskStatusBar
          items={[
            { label: 'À faire', count: statusCounts.depart + statusCounts.recouche, color: FT.roomOrange, sublabel: `${statusCounts.depart} Départs` },
            { label: 'Urgentes', count: rooms.filter((r) => r.clientBadge === 'prioritaire').length, color: FT.roomRed, sublabel: 'Attente du jour' },
            { label: 'Retards', count: rooms.filter((r) => r.cleaningStatus === 'refusee').length, color: FT.danger, sublabel: 'À refaire' },
            { label: 'Hors service', count: statusCounts.hors_service, color: FT.roomGray, sublabel: "Hors d'service" },
          ]}
        />
      </View>

      {showFloorDropdown && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={[styles.dropItem, floorFilter === 'all' && styles.dropItemActive]}
            onPress={() => { setFloorFilter('all'); setShowFloorDropdown(false); }}
          >
            <Text style={styles.dropItemText}>Tous les étages</Text>
          </TouchableOpacity>
          {floors.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.dropItem, floorFilter === f && styles.dropItemActive]}
              onPress={() => { setFloorFilter(f); setShowFloorDropdown(false); }}
            >
              <Text style={styles.dropItemText}>Étage {f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectionCount > 0 && (
        <View style={styles.selBar}>
          <View style={styles.selInfo}>
            <View style={styles.selBadge}>
              <Text style={styles.selBadgeText}>{selectionCount}</Text>
            </View>
            <Text style={styles.selCount}>sélectionnée(s)</Text>
            <TouchableOpacity onPress={clearSelection} style={styles.selClear}>
              <X size={14} color={FT.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.selActions}>
            <TouchableOpacity style={styles.selAssignBtn} onPress={handleAssign}>
              <UserPlus size={14} color="#FFF" />
              <Text style={styles.selActText}>Assigner</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selDepartBtn, selectedOccupied === 0 && styles.selBtnDisabled]}
              onPress={handleDeparture}
              disabled={selectedOccupied === 0}
            >
              <DoorOpen size={14} color="#FFF" />
              <Text style={styles.selActText}>Départ</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={groupedByFloor}
        keyExtractor={(item) => `floor-${item.floor}`}
        renderItem={renderFloorSection}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏨</Text>
            <Text style={styles.emptyTitle}>Aucune chambre trouvée</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-room')} testID="add-room-fab">
        <Plus size={22} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const ftStyles = StyleSheet.create({
  roomChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: FT.chipRadius,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minWidth: 56,
  },
  roomChipSelected: { borderWidth: 2, borderColor: '#FFF' },
  roomCheck: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center' },
  roomCheckText: { fontSize: 8, color: '#FFF', fontWeight: '700' as const },
  roomNum: { fontSize: 14, fontWeight: '700' as const, color: '#FFF' },
  roomBadge: { fontSize: 9 },
  roomCleanIcon: { fontSize: 9 },
  roomAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginLeft: 2 },
  roomAvatarText: { fontSize: 8, fontWeight: '700' as const, color: '#FFF' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FT.bg },
  loadingContainer: { flex: 1, backgroundColor: FT.bg, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: FT.textSec, fontSize: 14 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  billingBtn: { position: 'relative', padding: 4 },
  billingBadge: { position: 'absolute', top: -2, right: -4, backgroundColor: FT.warning, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  billingBadgeText: { fontSize: 9, fontWeight: '700' as const, color: '#FFF' },

  dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  dashTitle: { fontSize: 20, fontWeight: '800' as const, color: FT.text },
  dashTitleLight: { fontWeight: '400' as const, color: FT.textSec },
  dashActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: FT.surfaceAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: FT.border },
  iconBtnText: { fontSize: 12, color: FT.textSec, fontWeight: '500' as const },

  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: FT.surface, borderBottomWidth: 1, borderBottomColor: FT.border, gap: 6, flexWrap: 'wrap' },
  filterDrop: { flexDirection: 'row', alignItems: 'center', backgroundColor: FT.surfaceAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4, borderWidth: 1, borderColor: FT.border },
  filterDropText: { fontSize: 11, color: FT.textSec, fontWeight: '500' as const },
  roomCounter: { marginLeft: 'auto' },
  roomCounterText: { fontSize: 11, color: FT.textMuted, fontWeight: '600' as const },

  statusRow: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: FT.surface, borderBottomWidth: 1, borderBottomColor: FT.border },

  dropdown: { position: 'absolute', top: 200, left: 14, right: 14, backgroundColor: FT.surface, borderRadius: 12, borderWidth: 1, borderColor: FT.border, zIndex: 100, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
  dropItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: FT.border, gap: 8 },
  dropItemActive: { backgroundColor: FT.brandSoft },
  dropItemText: { fontSize: 14, color: FT.text },

  selBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: FT.brandSoft, borderBottomWidth: 1, borderBottomColor: FT.brand + '25' },
  selInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  selBadge: { backgroundColor: FT.brand, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  selBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' as const },
  selCount: { fontSize: 12, fontWeight: '600' as const, color: FT.brand },
  selClear: { padding: 4, marginLeft: 4 },
  selActions: { flexDirection: 'row', gap: 6 },
  selAssignBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, gap: 5, backgroundColor: FT.brand },
  selDepartBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, gap: 5, backgroundColor: FT.danger },
  selBtnDisabled: { opacity: 0.4 },
  selActText: { color: '#FFF', fontSize: 11, fontWeight: '600' as const },

  listContent: { padding: 14, paddingBottom: 100, gap: 10 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600' as const, color: FT.text },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: FT.brand,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: FT.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
