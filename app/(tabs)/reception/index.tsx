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
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { DoorOpen, UserPlus, X, ChevronDown, Coffee, Filter, MoreHorizontal, List, LayoutGrid, Eye, Star, Pencil, Upload, Check } from 'lucide-react-native';
import UserMenuButton from '@/components/UserMenuButton';
import FlowtymHeader from '@/components/FlowtymHeader';
import DeskFloorSection from '@/components/DeskFloorSection';
import DeskStatusBar from '@/components/DeskStatusBar';
import StaffForecastCard from '@/components/StaffForecastCard';
import * as Haptics from 'expo-haptics';
import { useHotel, useFilteredRooms } from '@/providers/HotelProvider';
import { PMSStatusIndicator } from '@/components/PMSStatusIndicator';
import { useTheme } from '@/providers/ThemeProvider';
import { FT } from '@/constants/flowtym';
import { RoomStatus, ClientBadge, Room, ROOM_STATUS_CONFIG, CLEANING_STATUS_CONFIG } from '@/constants/types';

const formatShortDate = (dateStr: string) => {
  try {
    const parts = dateStr.split('-');
    const day = parseInt(parts[2], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const months = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    return `${day} ${months[monthIdx]}`;
  } catch {
    return dateStr;
  }
};

interface PdjToggleButtonsProps {
  included: boolean;
  onToggle: (val: boolean) => void;
}

const PdjToggleButtons = React.memo(function PdjToggleButtons({ included, onToggle }: PdjToggleButtonsProps) {
  return (
    <View style={pdjStyles.container}>
      <TouchableOpacity
        style={[pdjStyles.btn, pdjStyles.btnRed, !included && pdjStyles.btnActiveRed]}
        onPress={() => {
          onToggle(false);
          if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        activeOpacity={0.7}
        testID="pdj-toggle-off"
      >
        <X size={11} color={!included ? '#FFF' : FT.danger} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[pdjStyles.btn, pdjStyles.btnGreen, included && pdjStyles.btnActiveGreen]}
        onPress={() => {
          onToggle(true);
          if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        activeOpacity={0.7}
        testID="pdj-toggle-on"
      >
        <Check size={11} color={included ? '#FFF' : FT.success} />
      </TouchableOpacity>
    </View>
  );
});

const pdjStyles = StyleSheet.create({
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  btn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  btnRed: {
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  btnGreen: {
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  btnActiveRed: {
    backgroundColor: FT.danger,
  },
  btnActiveGreen: {
    backgroundColor: FT.success,
  },
});

export default function ReceptionDashboard() {
  const router = useRouter();
  const { t } = useTheme();
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
    updateRoom,
  } = useHotel();

  const unbilledBreakfasts = useMemo(
    () => breakfastOrders.filter((o) => !o.included && o.status === 'servi' && !o.billingNotificationSent),
    [breakfastOrders]
  );

  const [statusFilter, setStatusFilter] = useState<RoomStatus | 'all'>('all');
  const [floorFilter, setFloorFilter] = useState<number | 'all'>('all');
  const [badgeFilter] = useState<ClientBadge | 'all'>('all');
  const [searchText] = useState('');
  const [showFloorDropdown, setShowFloorDropdown] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'plan' | 'table'>('plan');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editGuestName, setEditGuestName] = useState('');
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [showMoveRoomPicker, setShowMoveRoomPicker] = useState(false);
  const [moveToRoomId, setMoveToRoomId] = useState<string | null>(null);

  const { filtered, floors, total } = useFilteredRooms({
    status: statusFilter,
    floor: floorFilter,
    badge: badgeFilter,
    search: searchText,
  });

  const freeRooms = useMemo(
    () => rooms.filter((r) => r.status === 'libre' && r.id !== editingRoom?.id),
    [rooms, editingRoom]
  );

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
      Alert.alert(t.reception.actionImpossible, t.reception.noOccupiedSelected);
      return;
    }
    Alert.alert(t.reception.confirmDeparture, t.reception.confirmDepartureMsg, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.confirm,
        style: 'destructive',
        onPress: () => {
          const ids = rooms.filter((r) => selectedRoomIds.has(r.id) && r.status === 'occupe').map((r) => r.id);
          bulkDeparture(ids);
          if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [selectedOccupied, rooms, selectedRoomIds, bulkDeparture, t]);

  const handleAssign = useCallback(() => {
    if (selectionCount === 0) return;
    const ids = Array.from(selectedRoomIds);
    router.push({ pathname: '/assign-rooms', params: { roomIds: ids.join(',') } });
  }, [selectionCount, selectedRoomIds, router]);

  const handleEditClient = useCallback((room: Room) => {
    console.log('[Reception] Edit client for room', room.roomNumber);
    setEditingRoom(room);
    setEditGuestName(room.currentReservation?.guestName ?? '');
    setEditCheckIn(room.currentReservation?.checkInDate ?? '');
    setEditCheckOut(room.currentReservation?.checkOutDate ?? '');
    setMoveToRoomId(null);
    setShowMoveRoomPicker(false);
    setEditModalVisible(true);
  }, []);

  const handleSaveClient = useCallback(() => {
    if (!editingRoom) return;
    console.log('[Reception] Saving client edit for room', editingRoom.roomNumber);

    if (moveToRoomId && moveToRoomId !== editingRoom.id) {
      const newReservation = editingRoom.currentReservation
        ? { ...editingRoom.currentReservation, guestName: editGuestName, checkInDate: editCheckIn, checkOutDate: editCheckOut }
        : {
            id: `r-${Date.now()}`,
            roomId: moveToRoomId,
            pmsReservationId: '',
            guestName: editGuestName,
            checkInDate: editCheckIn,
            checkOutDate: editCheckOut,
            adults: 1,
            children: 0,
            preferences: '',
            status: 'checked_in' as const,
            lastSync: new Date().toISOString(),
          };

      updateRoom({
        roomId: moveToRoomId,
        updates: {
          currentReservation: { ...newReservation, roomId: moveToRoomId },
          status: editingRoom.status === 'libre' ? 'occupe' : editingRoom.status,
          clientBadge: editingRoom.clientBadge,
          breakfastIncluded: editingRoom.breakfastIncluded,
        },
      });
      updateRoom({
        roomId: editingRoom.id,
        updates: {
          currentReservation: null,
          status: 'libre',
          clientBadge: 'normal',
          breakfastIncluded: false,
        },
      });
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      const updatedReservation = editingRoom.currentReservation
        ? { ...editingRoom.currentReservation, guestName: editGuestName, checkInDate: editCheckIn, checkOutDate: editCheckOut }
        : editGuestName.trim()
          ? {
              id: `r-${Date.now()}`,
              roomId: editingRoom.id,
              pmsReservationId: '',
              guestName: editGuestName,
              checkInDate: editCheckIn,
              checkOutDate: editCheckOut,
              adults: 1,
              children: 0,
              preferences: '',
              status: 'checked_in' as const,
              lastSync: new Date().toISOString(),
            }
          : null;

      updateRoom({
        roomId: editingRoom.id,
        updates: {
          currentReservation: updatedReservation,
          status: updatedReservation && editingRoom.status === 'libre' ? 'occupe' : editingRoom.status,
        },
      });
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setEditModalVisible(false);
    setEditingRoom(null);
  }, [editingRoom, editGuestName, editCheckIn, editCheckOut, moveToRoomId, updateRoom]);

  const handleSetDeparture = useCallback((room: Room) => {
    if (room.status !== 'occupe' && room.status !== 'recouche') {
      Alert.alert('Action impossible', 'Seules les chambres occupées ou en recouche peuvent être mises en départ.');
      return;
    }
    Alert.alert(
      'Signaler le départ',
      `Signaler le départ du client en chambre ${room.roomNumber} ?`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.confirm,
          style: 'destructive',
          onPress: () => {
            updateRoom({ roomId: room.id, updates: { status: 'depart' } });
            if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [updateRoom, t]);

  const handleTogglePriority = useCallback((room: Room) => {
    const newBadge = room.clientBadge === 'prioritaire' ? 'normal' : 'prioritaire';
    console.log('[Reception] Toggle priority for room', room.roomNumber, 'to', newBadge);
    updateRoom({ roomId: room.id, updates: { clientBadge: newBadge } });
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [updateRoom]);

  const handleToggleBreakfast = useCallback((roomId: string, newValue: boolean) => {
    console.log('[Reception] Toggle breakfast for room', roomId, 'to', newValue);
    updateRoom({ roomId, updates: { breakfastIncluded: newValue } });
  }, [updateRoom]);

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

  const getHousekeepingDisplay = useCallback((room: Room) => {
    if (room.status === 'depart') return { label: 'Départ', color: '#E53935', icon: '↪' };
    if (room.status === 'recouche') return { label: 'Recouche', color: '#FB8C00', icon: '' };
    if (room.status === 'hors_service') return { label: 'Bloquée', color: '#78909C', icon: '🔒' };
    if (room.cleaningStatus === 'en_cours') return { label: 'En cours', color: '#00897B', icon: '' };
    if (room.cleaningStatus === 'nettoyee') return { label: 'Terminé', color: '#43A047', icon: '✓' };
    if (room.cleaningStatus === 'validee') return { label: 'Terminé', color: '#43A047', icon: '✓' };
    if (room.status === 'libre') return { label: 'Libre', color: '#94A3B8', icon: '' };
    return { label: '', color: '#94A3B8', icon: '' };
  }, []);

  const getGouvernanteDisplay = useCallback((room: Room) => {
    if (room.cleaningStatus === 'nettoyee') return { label: 'À valider', color: '#FB8C00', bg: 'rgba(251,140,0,0.12)' };
    if (room.cleaningStatus === 'validee') return { label: 'Validé', color: '#43A047', bg: 'rgba(67,160,71,0.12)' };
    if (room.cleaningStatus === 'refusee') return { label: 'Refusé', color: '#E53935', bg: 'rgba(229,57,53,0.12)' };
    return null;
  }, []);

  const getCleaningEta = useCallback((room: Room) => {
    if (!room.cleaningStartedAt) return null;
    const start = new Date(room.cleaningStartedAt).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - start) / 60000);
    return `${elapsed}m`;
  }, []);

  const renderTableRow = useCallback(({ item: room }: { item: Room }) => {
    const isSelected = selectedRoomIds.has(room.id);
    const hkDisplay = getHousekeepingDisplay(room);
    const gouvDisplay = getGouvernanteDisplay(room);
    const assignee = room.cleaningAssignee;
    const eta = getCleaningEta(room);
    const pdjIncluded = room.breakfastIncluded;
    const hasClient = !!room.currentReservation;
    const assigneeInitials = assignee
      ? assignee.split(' ').map((n) => n.charAt(0)).join('').toUpperCase()
      : null;

    return (
      <View style={[tableStyles.row, isSelected && tableStyles.rowSelected]}>
        <TouchableOpacity
          style={tableStyles.checkCell}
          onPress={() => {
            toggleRoomSelection(room.id);
            if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={[tableStyles.checkbox, isSelected && tableStyles.checkboxActive]}>
            {isSelected && <Text style={tableStyles.checkMark}>{'✓'}</Text>}
          </View>
        </TouchableOpacity>

        <View style={tableStyles.chambreCell}>
          <View style={[tableStyles.roomBadge, { backgroundColor: ROOM_STATUS_CONFIG[room.status].color }]}>
            <Text style={tableStyles.roomBadgeText}>{room.roomNumber}</Text>
          </View>
          <View>
            <Text style={tableStyles.roomTypeText}>{room.roomType}</Text>
            <Text style={tableStyles.roomCatText} numberOfLines={1}>
              {'Classique'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={tableStyles.clientCell} onPress={() => handleEditClient(room)} activeOpacity={0.6}>
          {hasClient ? (
            <>
              <View style={tableStyles.clientNameRow}>
                {room.clientBadge === 'vip' && (
                  <View style={tableStyles.vipBadgeInline}>
                    <Text style={tableStyles.vipBadgeInlineText}>VIP</Text>
                  </View>
                )}
                {room.clientBadge === 'prioritaire' && <Text style={tableStyles.priorityStar}>{'★'}</Text>}
                <Text style={tableStyles.clientName} numberOfLines={1}>
                  {room.currentReservation?.guestName}
                </Text>
                <Pencil size={10} color={FT.textMuted} style={{ marginLeft: 3 }} />
              </View>
              <Text style={tableStyles.clientDates} numberOfLines={1}>
                {formatShortDate(room.currentReservation?.checkInDate ?? '')} {'→'} {formatShortDate(room.currentReservation?.checkOutDate ?? '')}
              </Text>
            </>
          ) : (
            <Text style={tableStyles.clientEmpty}>
              {'Libre'} {'·'} <Text style={tableStyles.clientAddLink}>{'Ajouter'}</Text>
            </Text>
          )}
        </TouchableOpacity>

        <View style={tableStyles.hkCell}>
          <View style={tableStyles.hkDot}>
            <View style={[tableStyles.dot, { backgroundColor: hkDisplay.color }]} />
          </View>
          {hkDisplay.label ? (
            <Text style={[tableStyles.hkLabel, { color: hkDisplay.color }]} numberOfLines={1}>
              {hkDisplay.icon ? `${hkDisplay.icon} ` : ''}{hkDisplay.label}
            </Text>
          ) : (
            <Text style={tableStyles.emptyDash}>{'—'}</Text>
          )}
        </View>

        <View style={tableStyles.gouvCell}>
          {gouvDisplay ? (
            <View style={[tableStyles.gouvBadge, { backgroundColor: gouvDisplay.bg }]}>
              <Text style={[tableStyles.gouvText, { color: gouvDisplay.color }]}>{gouvDisplay.label}</Text>
            </View>
          ) : (
            <Text style={tableStyles.emptyDash}>{'—'}</Text>
          )}
        </View>

        <View style={tableStyles.assignCell}>
          {assignee ? (
            <View style={tableStyles.assignRow}>
              <View style={tableStyles.assignAvatar}>
                <Text style={tableStyles.assignAvatarText}>{assigneeInitials}</Text>
              </View>
              <Text style={tableStyles.assignName} numberOfLines={1}>{assignee}</Text>
            </View>
          ) : (
            <Text style={tableStyles.emptyDash}>{'—'}</Text>
          )}
        </View>

        <View style={tableStyles.pdjCell}>
          <PdjToggleButtons
            included={pdjIncluded}
            onToggle={(val) => handleToggleBreakfast(room.id, val)}
          />
        </View>

        <View style={tableStyles.etaCell}>
          {eta ? (
            <Text style={tableStyles.etaText}>{eta}</Text>
          ) : (
            <Text style={tableStyles.emptyDash}>{'—'}</Text>
          )}
        </View>

        <View style={tableStyles.actionsCell}>
          <TouchableOpacity
            onPress={() => handleRoomPress(room)}
            style={tableStyles.actionIconBtn}
            testID={`action-detail-${room.roomNumber}`}
          >
            <Eye size={14} color={FT.brand} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSetDeparture(room)}
            style={[tableStyles.actionIconBtn, tableStyles.actionIconDeparture]}
            testID={`action-depart-${room.roomNumber}`}
          >
            <DoorOpen size={13} color={FT.orange} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleTogglePriority(room)}
            style={tableStyles.actionIconBtn}
            testID={`action-priority-${room.roomNumber}`}
          >
            <Star
              size={14}
              color={room.clientBadge === 'prioritaire' ? '#F59E0B' : FT.textMuted}
              fill={room.clientBadge === 'prioritaire' ? '#F59E0B' : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [selectedRoomIds, handleRoomPress, toggleRoomSelection, handleEditClient, handleToggleBreakfast, handleSetDeparture, handleTogglePriority, getHousekeepingDisplay, getGouvernanteDisplay, getCleaningEta]);

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
                  if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                activeOpacity={0.7}
                testID={`room-card-${room.roomNumber}`}
              >
                {isSelected && <View style={ftStyles.roomCheck}><Text style={ftStyles.roomCheckText}>{'✓'}</Text></View>}
                <Text style={ftStyles.roomNum}>{room.roomNumber}</Text>
                {room.clientBadge === 'vip' && <Text style={ftStyles.roomBadge}>{'⭐'}</Text>}
                {room.clientBadge === 'prioritaire' && <Text style={ftStyles.roomBadge}>{'⚡'}</Text>}
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
        <Stack.Screen options={{ title: t.reception.title }} />
        <ActivityIndicator size="large" color={FT.brand} />
        <Text style={styles.loadingText}>{t.common.loading}...</Text>
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
                { label: t.direction.todayAlerts, icon: '🔔', badge: unbilledBreakfasts.length },
              ]}
              rightItems={
                <View style={styles.headerRight}>
                  {unbilledBreakfasts.length > 0 && (
                    <TouchableOpacity style={styles.billingBtn} onPress={() => {
                      Alert.alert(
                        `${unbilledBreakfasts.length} PDJ ${t.reception.billing}`,
                        unbilledBreakfasts.map((o) => `Ch. ${o.roomNumber} — ${o.personCount} pers.`).join('\n'),
                        [{ text: t.common.ok }]
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
          <Text style={styles.dashTitle}>{t.reception.dashboard}</Text>
        </View>
        <View style={styles.dashActions}>
          <TouchableOpacity
            style={styles.importBtn}
            onPress={() => router.push('/import-reservations')}
            testID="import-btn"
          >
            <Upload size={14} color="#FFF" />
            <Text style={styles.importBtnText}>{'Import'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggle, viewMode === 'plan' && styles.viewToggleActive]}
            onPress={() => setViewMode('plan')}
          >
            <LayoutGrid size={14} color={viewMode === 'plan' ? '#FFF' : FT.textSec} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggle, viewMode === 'table' && styles.viewToggleActive]}
            onPress={() => setViewMode('table')}
          >
            <List size={14} color={viewMode === 'table' ? '#FFF' : FT.textSec} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => { setShowFilterPanel(!showFilterPanel); setShowMoreMenu(false); }}>
            <Filter size={16} color={showFilterPanel ? FT.brand : FT.textSec} />
            <Text style={[styles.iconBtnText, showFilterPanel && { color: FT.brand }]}>{t.reception.filters}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => { setShowMoreMenu(!showMoreMenu); setShowFilterPanel(false); }}>
            <MoreHorizontal size={16} color={showMoreMenu ? FT.brand : FT.textSec} />
          </TouchableOpacity>
        </View>
      </View>

      {showFilterPanel && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterPanelTitle}>{t.reception.filters}</Text>
          <View style={styles.filterChipRow}>
            <TouchableOpacity
              style={[styles.filterChipBtn, statusFilter === 'all' && styles.filterChipBtnActive]}
              onPress={() => setStatusFilter('all')}
            >
              <Text style={[styles.filterChipBtnText, statusFilter === 'all' && styles.filterChipBtnTextActive]}>{t.common.all}</Text>
            </TouchableOpacity>
            {(['libre', 'occupe', 'depart', 'recouche', 'hors_service'] as const).map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.filterChipBtn, statusFilter === st && { backgroundColor: ROOM_STATUS_CONFIG[st].color }]}
                onPress={() => setStatusFilter(st === statusFilter ? 'all' : st)}
              >
                <Text style={[styles.filterChipBtnText, statusFilter === st && { color: '#FFF' }]}>{ROOM_STATUS_CONFIG[st].label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.filterChipRow}>
            <TouchableOpacity
              style={[styles.filterChipBtn, floorFilter === 'all' && styles.filterChipBtnActive]}
              onPress={() => setFloorFilter('all')}
            >
              <Text style={[styles.filterChipBtnText, floorFilter === 'all' && styles.filterChipBtnTextActive]}>{t.rooms.allFloors}</Text>
            </TouchableOpacity>
            {floors.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChipBtn, floorFilter === f && styles.filterChipBtnActive]}
                onPress={() => setFloorFilter(f === floorFilter ? 'all' : f)}
              >
                <Text style={[styles.filterChipBtnText, floorFilter === f && styles.filterChipBtnTextActive]}>{t.rooms.floorN} {f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {showMoreMenu && (
        <View style={styles.moreMenu}>
          <TouchableOpacity style={styles.moreMenuItem} onPress={() => { router.push('/history'); setShowMoreMenu(false); }}>
            <Text style={styles.moreMenuIcon}>{'📋'}</Text>
            <Text style={styles.moreMenuText}>{t.direction.historyLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreMenuItem} onPress={() => { router.push('/breakfast-stats'); setShowMoreMenu(false); }}>
            <Text style={styles.moreMenuIcon}>{'☕'}</Text>
            <Text style={styles.moreMenuText}>{t.breakfast.title}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreMenuItem} onPress={() => { router.push('/economat'); setShowMoreMenu(false); }}>
            <Text style={styles.moreMenuIcon}>{'📦'}</Text>
            <Text style={styles.moreMenuText}>{t.economat.title}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreMenuItem} onPress={() => { router.push('/import-reservations'); setShowMoreMenu(false); }}>
            <Text style={styles.moreMenuIcon}>{'📥'}</Text>
            <Text style={styles.moreMenuText}>{t.fileImport.importReservations}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreMenuItem} onPress={() => { router.push('/settings'); setShowMoreMenu(false); }}>
            <Text style={styles.moreMenuIcon}>{'⚙️'}</Text>
            <Text style={styles.moreMenuText}>{t.menu.settings}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterDrop}
          onPress={() => { setShowFloorDropdown(!showFloorDropdown); }}
        >
          <Text style={styles.filterDropText}>
            {floorFilter === 'all' ? `🏢 ${t.rooms.floor}` : `${t.rooms.floorN} ${floorFilter}`}
          </Text>
          <ChevronDown size={12} color={FT.textSec} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterDrop}>
          <Text style={styles.filterDropText}>{'🗓'} {today}</Text>
        </TouchableOpacity>
        <View style={styles.roomCounter}>
          <Text style={styles.roomCounterText}>{'🏠'} {filtered.length} / {total} {t.rooms.rooms}</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <DeskStatusBar
          items={[
            { label: t.reception.toDo, count: statusCounts.depart + statusCounts.recouche, color: FT.roomOrange, sublabel: `${statusCounts.depart} ${t.reception.departuresOfDay}` },
            { label: t.reception.urgent, count: rooms.filter((r) => r.clientBadge === 'prioritaire').length, color: FT.roomRed, sublabel: '' },
            { label: t.reception.delays, count: rooms.filter((r) => r.cleaningStatus === 'refusee').length, color: FT.danger, sublabel: '' },
            { label: t.rooms.outOfService, count: statusCounts.hors_service, color: FT.roomGray, sublabel: '' },
          ]}
        />
      </View>

      {showFloorDropdown && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={[styles.dropItem, floorFilter === 'all' && styles.dropItemActive]}
            onPress={() => { setFloorFilter('all'); setShowFloorDropdown(false); }}
          >
            <Text style={styles.dropItemText}>{t.rooms.allFloors}</Text>
          </TouchableOpacity>
          {floors.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.dropItem, floorFilter === f && styles.dropItemActive]}
              onPress={() => { setFloorFilter(f); setShowFloorDropdown(false); }}
            >
              <Text style={styles.dropItemText}>{t.rooms.floorN} {f}</Text>
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
            <Text style={styles.selCount}>{t.common.selected}</Text>
            <TouchableOpacity onPress={clearSelection} style={styles.selClear}>
              <X size={14} color={FT.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.selActions}>
            <TouchableOpacity style={styles.selAssignBtn} onPress={handleAssign}>
              <UserPlus size={14} color="#FFF" />
              <Text style={styles.selActText}>{t.rooms.assign}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selDepartBtn, selectedOccupied === 0 && styles.selBtnDisabled]}
              onPress={handleDeparture}
              disabled={selectedOccupied === 0}
            >
              <DoorOpen size={14} color="#FFF" />
              <Text style={styles.selActText}>{t.rooms.departure}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {viewMode === 'plan' ? (
        <FlatList
          data={groupedByFloor}
          keyExtractor={(item) => `floor-${item.floor}`}
          renderItem={renderFloorSection}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<StaffForecastCard />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{'🏨'}</Text>
              <Text style={styles.emptyTitle}>{t.rooms.noRoomFound}</Text>
            </View>
          }
        />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScrollH}>
          <View style={styles.tableInner}>
            <View style={tableStyles.stickyHeader}>
              <View style={tableStyles.headerRow}>
                <View style={tableStyles.checkCell}>
                  <Text style={tableStyles.headerText}>{'✓'}</Text>
                </View>
                <View style={tableStyles.chambreCell}>
                  <Text style={tableStyles.headerText}>{'CHAMBRE'}</Text>
                </View>
                <View style={tableStyles.clientCell}>
                  <Text style={tableStyles.headerText}>{'CLIENT'}</Text>
                </View>
                <View style={tableStyles.hkCell}>
                  <Text style={tableStyles.headerText}>{'HOUSEKEEPING'}</Text>
                </View>
                <View style={tableStyles.gouvCell}>
                  <Text style={tableStyles.headerText}>{'GOUVERNANTE'}</Text>
                </View>
                <View style={tableStyles.assignCell}>
                  <Text style={tableStyles.headerText}>{'ASSIGNÉE'}</Text>
                </View>
                <View style={tableStyles.pdjCell}>
                  <Text style={tableStyles.headerText}>{'PDJ'}</Text>
                </View>
                <View style={tableStyles.etaCell}>
                  <Text style={tableStyles.headerText}>{'ETA'}</Text>
                </View>
                <View style={tableStyles.actionsCell}>
                  <Text style={tableStyles.headerText}>{'ACTIONS'}</Text>
                </View>
              </View>
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={renderTableRow}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>{'🏨'}</Text>
                  <Text style={styles.emptyTitle}>{t.rooms.noRoomFound}</Text>
                </View>
              }
            />
          </View>
        </ScrollView>
      )}

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <TouchableOpacity
          style={modalStyles.overlay}
          activeOpacity={1}
          onPress={() => setEditModalVisible(false)}
        >
          <TouchableOpacity style={modalStyles.card} activeOpacity={1} onPress={() => {}}>
            <View style={modalStyles.headerRow}>
              <View>
                <Text style={modalStyles.title}>{'Modifier le client'}</Text>
                <Text style={modalStyles.subtitle}>{'Chambre'} {editingRoom?.roomNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={modalStyles.closeBtn}>
                <X size={18} color={FT.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={modalStyles.label}>{'Nom du client'}</Text>
            <TextInput
              style={modalStyles.input}
              value={editGuestName}
              onChangeText={setEditGuestName}
              placeholder="Nom du client"
              placeholderTextColor={FT.textMuted}
              testID="edit-guest-name"
            />

            <View style={modalStyles.dateRow}>
              <View style={modalStyles.dateField}>
                <Text style={modalStyles.label}>{'Arrivée'}</Text>
                <TextInput
                  style={modalStyles.input}
                  value={editCheckIn}
                  onChangeText={setEditCheckIn}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor={FT.textMuted}
                  testID="edit-check-in"
                />
              </View>
              <View style={modalStyles.dateField}>
                <Text style={modalStyles.label}>{'Départ'}</Text>
                <TextInput
                  style={modalStyles.input}
                  value={editCheckOut}
                  onChangeText={setEditCheckOut}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor={FT.textMuted}
                  testID="edit-check-out"
                />
              </View>
            </View>

            <TouchableOpacity
              style={modalStyles.moveToggle}
              onPress={() => setShowMoveRoomPicker(!showMoveRoomPicker)}
            >
              <Text style={modalStyles.moveToggleText}>{'Déplacer vers une autre chambre'}</Text>
              <ChevronDown size={14} color={FT.brand} />
            </TouchableOpacity>

            {showMoveRoomPicker && (
              <ScrollView style={modalStyles.roomPickerScroll} nestedScrollEnabled>
                {freeRooms.length > 0 ? freeRooms.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[modalStyles.roomOption, moveToRoomId === r.id && modalStyles.roomOptionActive]}
                    onPress={() => setMoveToRoomId(moveToRoomId === r.id ? null : r.id)}
                  >
                    <Text style={[modalStyles.roomOptionText, moveToRoomId === r.id && modalStyles.roomOptionTextActive]}>
                      {r.roomNumber} — {r.roomType}
                    </Text>
                  </TouchableOpacity>
                )) : (
                  <Text style={modalStyles.noRoomsText}>{'Aucune chambre libre disponible'}</Text>
                )}
              </ScrollView>
            )}

            <View style={modalStyles.actionRow}>
              <TouchableOpacity style={modalStyles.saveBtn} onPress={handleSaveClient}>
                <Text style={modalStyles.saveBtnText}>{'Enregistrer'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={modalStyles.cancelBtnText}>{'Annuler'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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

const tableStyles = StyleSheet.create({
  stickyHeader: {
    backgroundColor: FT.headerBg,
    borderBottomWidth: 2,
    borderBottomColor: FT.brand,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  headerText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFF',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: FT.surface,
    borderBottomWidth: 1,
    borderBottomColor: FT.borderLight,
    minHeight: 60,
  },
  rowSelected: { backgroundColor: FT.brandSoft },
  checkCell: { width: 32, alignItems: 'center', justifyContent: 'center' },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: FT.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: { backgroundColor: FT.brand, borderColor: FT.brand },
  checkMark: { fontSize: 10, color: '#FFF', fontWeight: '700' as const },

  chambreCell: { width: 120, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  roomBadge: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  roomBadgeText: { fontSize: 13, fontWeight: '800' as const, color: '#FFF' },
  roomTypeText: { fontSize: 12, fontWeight: '600' as const, color: FT.text },
  roomCatText: { fontSize: 9, color: FT.textMuted },

  clientCell: { width: 170, paddingHorizontal: 6, justifyContent: 'center' },
  clientNameRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  clientName: { fontSize: 12, fontWeight: '600' as const, color: FT.text, flexShrink: 1 },
  clientDates: { fontSize: 10, color: FT.textSec, marginTop: 2 },
  clientEmpty: { fontSize: 11, color: FT.textMuted },
  clientAddLink: { color: FT.brand, fontWeight: '600' as const },
  vipBadgeInline: { backgroundColor: '#F59E0B', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  vipBadgeInlineText: { fontSize: 8, fontWeight: '800' as const, color: '#FFF' },
  priorityStar: { fontSize: 12, color: '#F59E0B' },

  hkCell: { width: 110, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  hkDot: { width: 14, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  hkLabel: { fontSize: 11, fontWeight: '600' as const },

  gouvCell: { width: 100, paddingHorizontal: 4, justifyContent: 'center' },
  gouvBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' as const },
  gouvText: { fontSize: 10, fontWeight: '600' as const },

  assignCell: { width: 120, paddingHorizontal: 4, justifyContent: 'center' },
  assignRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  assignAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: FT.brand, justifyContent: 'center', alignItems: 'center' },
  assignAvatarText: { fontSize: 9, fontWeight: '700' as const, color: '#FFF' },
  assignName: { fontSize: 11, color: FT.textSec, flexShrink: 1 },

  pdjCell: { width: 70, alignItems: 'center', justifyContent: 'center' },

  etaCell: { width: 50, alignItems: 'center', justifyContent: 'center' },
  etaText: { fontSize: 12, fontWeight: '700' as const, color: FT.brand },

  actionsCell: { width: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: FT.surfaceAlt,
    borderWidth: 1,
    borderColor: FT.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconDeparture: {
    backgroundColor: 'rgba(249,115,22,0.08)',
    borderColor: 'rgba(249,115,22,0.2)',
  },
  emptyDash: { fontSize: 12, color: FT.textMuted },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: FT.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    ...FT.shadowMedium,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: FT.text,
  },
  subtitle: {
    fontSize: 13,
    color: FT.textSec,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: FT.textSec,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: FT.surfaceAlt,
    borderWidth: 1,
    borderColor: FT.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: FT.text,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  moveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: FT.brandSoft,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: FT.brand + '20',
  },
  moveToggleText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: FT.brand,
  },
  roomPickerScroll: {
    maxHeight: 150,
    marginTop: 8,
    borderWidth: 1,
    borderColor: FT.border,
    borderRadius: 10,
    backgroundColor: FT.surfaceAlt,
  },
  roomOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: FT.borderLight,
  },
  roomOptionActive: {
    backgroundColor: FT.brandSoft,
  },
  roomOptionText: {
    fontSize: 13,
    color: FT.text,
  },
  roomOptionTextActive: {
    color: FT.brand,
    fontWeight: '600' as const,
  },
  noRoomsText: {
    fontSize: 12,
    color: FT.textMuted,
    padding: 14,
    textAlign: 'center' as const,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: FT.brand,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: FT.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: FT.textSec,
  },
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
  dashActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  importBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: FT.brand, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  importBtnText: { fontSize: 12, fontWeight: '600' as const, color: '#FFF' },
  viewToggle: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: FT.surfaceAlt, borderWidth: 1, borderColor: FT.border },
  viewToggleActive: { backgroundColor: FT.brand, borderColor: FT.brand },
  iconBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: FT.surfaceAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: FT.border },
  iconBtnText: { fontSize: 12, color: FT.textSec, fontWeight: '500' as const },

  filterPanel: { backgroundColor: FT.surface, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: FT.border, gap: 8 },
  filterPanelTitle: { fontSize: 12, fontWeight: '700' as const, color: FT.textSec, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  filterChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterChipBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: FT.surfaceAlt, borderWidth: 1, borderColor: FT.border },
  filterChipBtnActive: { backgroundColor: FT.brand, borderColor: FT.brand },
  filterChipBtnText: { fontSize: 11, fontWeight: '500' as const, color: FT.textSec },
  filterChipBtnTextActive: { color: '#FFF' },

  moreMenu: { backgroundColor: FT.surface, borderBottomWidth: 1, borderBottomColor: FT.border, paddingVertical: 4 },
  moreMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  moreMenuIcon: { fontSize: 16 },
  moreMenuText: { fontSize: 14, color: FT.text, fontWeight: '500' as const },

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
  tableScrollH: { flex: 1 },
  tableInner: { minWidth: 900, flex: 1 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600' as const, color: FT.text },
});
