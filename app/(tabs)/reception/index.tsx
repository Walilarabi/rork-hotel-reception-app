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
import { DoorOpen, UserPlus, X, ChevronDown, Coffee, List, LayoutGrid, Eye, Star, Pencil, Upload, Check, Search, FileText, Image, Download } from 'lucide-react-native';
import UserMenuButton from '@/components/UserMenuButton';
import FlowtymHeader from '@/components/FlowtymHeader';
import DeskFloorSection from '@/components/DeskFloorSection';
import StaffForecastCard from '@/components/StaffForecastCard';
import * as Haptics from 'expo-haptics';
import { useHotel, useFilteredRooms } from '@/providers/HotelProvider';
import { PMSStatusIndicator } from '@/components/PMSStatusIndicator';
import { useTheme } from '@/providers/ThemeProvider';
import { FT } from '@/constants/flowtym';
import { RoomStatus, ClientBadge, Room, ROOM_STATUS_CONFIG, CLEANING_STATUS_CONFIG, ROOM_CLEANLINESS_CONFIG, BOOKING_SOURCE_CONFIG, CHANNEL_TYPE_CONFIG, ALL_BOOKING_SOURCES } from '@/constants/types';

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
  container: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  btn: { width: 26, height: 26, borderRadius: 6, justifyContent: 'center' as const, alignItems: 'center' as const },
  btnRed: { backgroundColor: 'rgba(239,68,68,0.12)' },
  btnGreen: { backgroundColor: 'rgba(34,197,94,0.12)' },
  btnActiveRed: { backgroundColor: FT.danger },
  btnActiveGreen: { backgroundColor: FT.success },
});

interface MiniCalendarProps {
  month: Date;
  selectedDate: string;
  onSelect: (dateStr: string) => void;
  onChangeMonth: (d: Date) => void;
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const MiniCalendar = React.memo(function MiniCalendar({ month, selectedDate, onSelect, onChangeMonth }: MiniCalendarProps) {
  const year = month.getFullYear();
  const mo = month.getMonth();
  const firstDay = new Date(year, mo, 1).getDay();
  const daysInMonth = new Date(year, mo + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => onChangeMonth(new Date(year, mo - 1, 1));
  const nextMonth = () => onChangeMonth(new Date(year, mo + 1, 1));
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <View style={calStyles.wrap}>
      <View style={calStyles.header}>
        <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
          <Text style={calStyles.navBtnText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={calStyles.monthLabel}>{MONTHS_FR[mo]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
          <Text style={calStyles.navBtnText}>{'>'}</Text>
        </TouchableOpacity>
      </View>
      <View style={calStyles.daysRow}>
        {DAYS_FR.map((d) => (
          <View key={d} style={calStyles.dayHeaderCell}>
            <Text style={calStyles.dayHeaderText}>{d}</Text>
          </View>
        ))}
      </View>
      <View style={calStyles.grid}>
        {cells.map((day, idx) => {
          if (day === null) return <View key={`e-${idx}`} style={calStyles.cell} />;
          const dateStr = `${year}-${pad(mo + 1)}-${pad(day)}`;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          return (
            <TouchableOpacity
              key={dateStr}
              style={[calStyles.cell, isSelected && calStyles.cellSelected, isToday && !isSelected && calStyles.cellToday]}
              onPress={() => onSelect(dateStr)}
              activeOpacity={0.6}
            >
              <Text style={[calStyles.cellText, isSelected && calStyles.cellTextSelected, isToday && !isSelected && calStyles.cellTextToday]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const calStyles = StyleSheet.create({
  wrap: { marginTop: 8, backgroundColor: FT.surfaceAlt, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: FT.borderLight },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  navBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: FT.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: FT.borderLight },
  navBtnText: { fontSize: 14, fontWeight: '700' as const, color: FT.brand },
  monthLabel: { fontSize: 13, fontWeight: '700' as const, color: FT.text },
  daysRow: { flexDirection: 'row' },
  dayHeaderCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dayHeaderText: { fontSize: 10, fontWeight: '600' as const, color: FT.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  cell: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  cellSelected: { backgroundColor: FT.brand, borderRadius: 20 },
  cellToday: { backgroundColor: FT.brandSoft, borderRadius: 20 },
  cellText: { fontSize: 12, fontWeight: '500' as const, color: FT.text },
  cellTextSelected: { color: '#FFF', fontWeight: '700' as const },
  cellTextToday: { color: FT.brand, fontWeight: '700' as const },
});

const KPI_CARDS_CONFIG = [
  { key: 'chambres', label: 'CHAMBRES', color: FT.brand, borderColor: FT.brand, iconBg: FT.brandSoft },
  { key: 'departs', label: 'DÉPARTS', color: '#E53935', borderColor: '#E53935', iconBg: 'rgba(229,57,53,0.10)' },
  { key: 'recouches', label: 'RECOUCHES', color: '#FB8C00', borderColor: '#FB8C00', iconBg: 'rgba(251,140,0,0.10)' },
  { key: 'en_cours', label: 'EN COURS', color: '#1E88E5', borderColor: '#1E88E5', iconBg: 'rgba(30,136,229,0.10)' },
  { key: 'terminees', label: 'TERMINÉES', color: '#43A047', borderColor: '#43A047', iconBg: 'rgba(67,160,71,0.10)' },
  { key: 'a_valider', label: 'À VALIDER', color: '#F59E0B', borderColor: '#F59E0B', iconBg: 'rgba(245,158,11,0.10)' },
  { key: 'pdj_inclus', label: 'PDJ INCLUS', color: FT.brand, borderColor: FT.brand, iconBg: FT.brandSoft },
  { key: 'eta_urgents', label: 'ETA URGENTS', color: '#EF4444', borderColor: '#EF4444', iconBg: 'rgba(239,68,68,0.10)' },
] as const;

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
  const [badgeFilter, setBadgeFilter] = useState<ClientBadge | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'plan' | 'table'>('plan');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<'csv' | 'excel' | 'pdf' | 'image'>('csv');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editGuestName, setEditGuestName] = useState('');
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [showMoveRoomPicker, setShowMoveRoomPicker] = useState(false);
  const [moveToRoomId, setMoveToRoomId] = useState<string | null>(null);
  const [calendarField, setCalendarField] = useState<'checkIn' | 'checkOut' | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [showKpi, setShowKpi] = useState(true);
  const [showFloorDrop, setShowFloorDrop] = useState(false);
  const [showStatusDrop, setShowStatusDrop] = useState(false);
  const [showBadgeDrop, setShowBadgeDrop] = useState(false);
  const [showAssigneeDrop, setShowAssigneeDrop] = useState(false);
  const [sourceDropdownRoomId, setSourceDropdownRoomId] = useState<string | null>(null);

  const { filtered: preFiltered, floors, total } = useFilteredRooms({
    status: statusFilter,
    floor: floorFilter,
    badge: badgeFilter,
    search: searchText,
  });

  const filtered = useMemo(() => {
    if (assigneeFilter === 'all') return preFiltered;
    return preFiltered.filter((r) => {
      if (assigneeFilter === 'none') return !r.cleaningAssignee;
      return r.cleaningAssignee === assigneeFilter;
    });
  }, [preFiltered, assigneeFilter]);

  const assigneeList = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach((r) => { if (r.cleaningAssignee) set.add(r.cleaningAssignee); });
    return Array.from(set).sort();
  }, [rooms]);

  const freeRooms = useMemo(
    () => rooms.filter((r) => r.status === 'libre' && r.id !== editingRoom?.id),
    [rooms, editingRoom]
  );

  const selectionCount = selectedRoomIds.size;
  const selectedOccupied = useMemo(
    () => rooms.filter((r) => selectedRoomIds.has(r.id) && r.status === 'occupe').length,
    [rooms, selectedRoomIds]
  );

  const kpiData = useMemo(() => {
    const totalRooms = rooms.length;
    const departCount = rooms.filter((r) => r.status === 'depart').length;
    const recoucheCount = rooms.filter((r) => r.status === 'recouche').length;
    const enCoursCount = rooms.filter((r) => r.cleaningStatus === 'en_cours').length;
    const termineeCount = rooms.filter((r) => r.cleaningStatus === 'nettoyee' || r.cleaningStatus === 'validee').length;
    const aValiderCount = rooms.filter((r) => r.cleaningStatus === 'nettoyee').length;
    const pdjInclusCount = rooms.filter((r) => r.breakfastIncluded).length;
    const etaUrgentCount = rooms.filter((r) => {
      if (!r.cleaningStartedAt) return false;
      const elapsed = Math.floor((Date.now() - new Date(r.cleaningStartedAt).getTime()) / 60000);
      return elapsed > 30;
    }).length;
    return {
      chambres: totalRooms,
      departs: departCount,
      recouches: recoucheCount,
      en_cours: enCoursCount,
      terminees: termineeCount,
      a_valider: aValiderCount,
      pdj_inclus: pdjInclusCount,
      eta_urgents: etaUrgentCount,
    };
  }, [rooms]);

  const closeAllDropdowns = useCallback(() => {
    setShowFloorDrop(false);
    setShowStatusDrop(false);
    setShowBadgeDrop(false);
    setShowAssigneeDrop(false);
  }, []);

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

  const handleImportPress = useCallback(() => {
    setShowImportModal(true);
    setImportMode('csv');
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleImportFile = useCallback(() => {
    setShowImportModal(false);
    router.push({ pathname: '/import-reservations', params: { mode: importMode } });
  }, [router, importMode]);

  const handleDownloadTemplate = useCallback(() => {
    Alert.alert('Modèle CSV', 'Le modèle CSV contient les colonnes :\nNom client, Date arrivée, Date départ, N° chambre, Adultes, Enfants\n\nFormat de date : JJ/MM/AAAA');
  }, []);

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

  const renderTableRow = useCallback(({ item: room, index }: { item: Room; index: number }) => {
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
    const isEven = index % 2 === 0;

    return (
      <View style={[tableStyles.row, isEven && tableStyles.rowEven, isSelected && tableStyles.rowSelected]}>
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
          <View style={tableStyles.roomInfo}>
            <Text style={tableStyles.roomTypeText}>{room.roomType}</Text>
            <Text style={tableStyles.roomCatText} numberOfLines={1}>
              {room.roomCategory ?? 'Classique'} {'·'} {room.roomSize ?? 16}{'m²'}
            </Text>
          </View>
        </View>

        <View style={tableStyles.cleanlinessCell}>
          {(() => {
            const cls = room.cleanlinessStatus ?? 'sale';
            const cfg = ROOM_CLEANLINESS_CONFIG[cls];
            return (
              <View style={[tableStyles.cleanlinessBadge, { backgroundColor: cfg.color + '14' }]}>
                <Text style={tableStyles.cleanlinessIcon}>{cfg.icon}</Text>
                <Text style={[tableStyles.cleanlinessLabel, { color: cfg.color }]} numberOfLines={1}>{cfg.label}</Text>
              </View>
            );
          })()}
        </View>

        <TouchableOpacity style={tableStyles.clientCell} onPress={() => handleEditClient(room)} activeOpacity={0.6}>
          {hasClient ? (
            <>
              <View style={tableStyles.clientNameRow}>
                {room.clientBadge === 'vip' && (
                  <View style={tableStyles.vipBadgeInline}>
                    <Text style={tableStyles.vipBadgeInlineText}>{'VIP'}</Text>
                  </View>
                )}
                {room.clientBadge === 'prioritaire' && <Text style={tableStyles.priorityStar}>{'★'}</Text>}
                <Text style={tableStyles.clientName} numberOfLines={1}>
                  {room.currentReservation?.guestName}
                </Text>
                <Pencil size={10} color={FT.textMuted} style={{ marginLeft: 4 }} />
              </View>
            </>
          ) : (
            <View style={tableStyles.clientEmptyRow}>
              <View style={tableStyles.clientEmptyDot} />
              <Text style={tableStyles.clientEmpty}>{'Libre'}</Text>
              <Text style={tableStyles.clientAddLink}>{'+ Ajouter'}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={tableStyles.paxCell}>
          {hasClient ? (
            <Text style={tableStyles.paxText}>
              {room.currentReservation?.adults ?? 1}
              {(room.currentReservation?.children ?? 0) > 0
                ? ` + ${room.currentReservation?.children} enf.`
                : ''}
            </Text>
          ) : (
            <Text style={tableStyles.emptyDash}>{'—'}</Text>
          )}
        </View>

        <View style={tableStyles.arriveeCell}>
          {hasClient && room.currentReservation?.checkInDate ? (
            <Text style={tableStyles.dateText}>{formatShortDate(room.currentReservation.checkInDate)}</Text>
          ) : (
            <Text style={tableStyles.emptyDash}>{'—'}</Text>
          )}
        </View>

        <View style={tableStyles.departCell}>
          {hasClient && room.currentReservation?.checkOutDate ? (
            <Text style={tableStyles.dateTextDepart}>{formatShortDate(room.currentReservation.checkOutDate)}</Text>
          ) : (
            <Text style={tableStyles.emptyDash}>{'—'}</Text>
          )}
        </View>

        <View style={tableStyles.etaArrivalCell}>
          {room.etaArrival ? (
            <Text style={tableStyles.etaArrivalText}>{room.etaArrival}</Text>
          ) : (
            <Text style={tableStyles.emptyDash}>{'—'}</Text>
          )}
        </View>

        <View style={tableStyles.sourceCell}>
          {room.bookingSource ? (() => {
            const srcCfg = BOOKING_SOURCE_CONFIG[room.bookingSource];
            const chCfg = CHANNEL_TYPE_CONFIG[srcCfg.channelType];
            return (
              <TouchableOpacity
                style={tableStyles.sourceWrapper}
                onPress={() => setSourceDropdownRoomId(sourceDropdownRoomId === room.id ? null : room.id)}
                activeOpacity={0.7}
              >
                <View style={[tableStyles.sourceLogo, { backgroundColor: srcCfg.color }]}>
                  <Text style={tableStyles.sourceLogoText}>{srcCfg.icon}</Text>
                </View>
                <View style={tableStyles.sourceInfo}>
                  <Text style={[tableStyles.sourceLabel, { color: srcCfg.color }]} numberOfLines={1}>{room.bookingSource === 'Téléphone' ? 'Tél.' : room.bookingSource === 'Walk-in' ? 'Walk-in' : room.bookingSource}</Text>
                  <View style={[tableStyles.channelTag, { backgroundColor: chCfg.bgColor }]}>
                    <Text style={[tableStyles.channelTagText, { color: chCfg.color }]}>{srcCfg.hasCommission ? 'OTA' : chCfg.label}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })() : (
            <TouchableOpacity
              style={tableStyles.sourceEmptyBtn}
              onPress={() => setSourceDropdownRoomId(sourceDropdownRoomId === room.id ? null : room.id)}
              activeOpacity={0.7}
            >
              <Text style={tableStyles.sourceEmptyText}>{'+ Source'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={tableStyles.hkCell}>
          {hkDisplay.label ? (
            <View style={[tableStyles.hkBadge, { backgroundColor: hkDisplay.color + '14' }]}>
              <View style={[tableStyles.hkDotInner, { backgroundColor: hkDisplay.color }]} />
              <Text style={[tableStyles.hkLabel, { color: hkDisplay.color }]} numberOfLines={1}>
                {hkDisplay.label}
              </Text>
            </View>
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

        <View style={tableStyles.vueSdbCell}>
          <View>
            <Text style={tableStyles.vueSdbText}>{room.viewType ?? 'Rue'}</Text>
            <Text style={tableStyles.vueSdbSubtext}>{room.bathroomType ?? 'Douche'}</Text>
          </View>
        </View>

        <View style={tableStyles.pdjCell}>
          <PdjToggleButtons
            included={pdjIncluded}
            onToggle={(val) => handleToggleBreakfast(room.id, val)}
          />
        </View>

        <View style={tableStyles.etaCell}>
          {eta ? (
            <View style={tableStyles.etaBadge}>
              <Text style={tableStyles.etaText}>{eta}</Text>
            </View>
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
            <Eye size={13} color={FT.brand} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSetDeparture(room)}
            style={[tableStyles.actionIconBtn, tableStyles.actionIconDeparture]}
            testID={`action-depart-${room.roomNumber}`}
          >
            <DoorOpen size={13} color={'#E53935'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleTogglePriority(room)}
            style={[tableStyles.actionIconBtn, room.clientBadge === 'prioritaire' && tableStyles.actionIconPriority]}
            testID={`action-priority-${room.roomNumber}`}
          >
            <Star
              size={13}
              color={room.clientBadge === 'prioritaire' ? '#F59E0B' : FT.textMuted}
              fill={room.clientBadge === 'prioritaire' ? '#F59E0B' : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [selectedRoomIds, handleRoomPress, toggleRoomSelection, handleEditClient, handleToggleBreakfast, handleSetDeparture, handleTogglePriority, getHousekeepingDisplay, getGouvernanteDisplay, getCleaningEta, sourceDropdownRoomId, updateRoom]);

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
                  <TouchableOpacity style={styles.csvTemplateBtn} onPress={handleDownloadTemplate}>
                    <Download size={12} color={FT.textSec} />
                    <Text style={styles.csvTemplateBtnText}>{'CSV modèle'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.importClientBtn}
                    onPress={handleImportPress}
                    testID="import-clients-btn"
                  >
                    <Text style={styles.importClientBtnText}>{'Import clients'}</Text>
                  </TouchableOpacity>
                  <UserMenuButton />
                </View>
              }
            />
          ),
          headerRight: () => null,
        }}
      />

      <View style={styles.kpiBar}>
        {showKpi && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiRow} contentContainerStyle={styles.kpiRowContent}>
            {KPI_CARDS_CONFIG.map((cfg) => (
              <View key={cfg.key} style={[styles.kpiChip, { borderLeftColor: cfg.borderColor }]}>
                <Text style={[styles.kpiChipValue, { color: cfg.color }]}>{kpiData[cfg.key]}</Text>
                <Text style={styles.kpiChipLabel}>{cfg.label}</Text>
              </View>
            ))}
          </ScrollView>
        )}
        <TouchableOpacity
          style={styles.kpiToggleBtn}
          onPress={() => {
            setShowKpi(!showKpi);
            if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          activeOpacity={0.7}
          testID="toggle-kpi-btn"
        >
          <Eye size={12} color={showKpi ? FT.brand : FT.textMuted} />
          <Text style={[styles.kpiToggleText, showKpi && styles.kpiToggleTextActive]}>
            {showKpi ? 'Masquer KPI' : 'Afficher KPI'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchFilterRow}>
        <View style={styles.filterRow2}>
          <View style={styles.searchBox}>
            <Search size={14} color={FT.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Chambre, client..."
              placeholderTextColor={FT.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              testID="search-rooms"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <X size={14} color={FT.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsContent} style={styles.filterScrollFlex}>
            <TouchableOpacity
              style={[styles.filterPill, floorFilter !== 'all' && styles.filterPillActive]}
              onPress={() => { closeAllDropdowns(); setShowFloorDrop(!showFloorDrop); }}
            >
              <Text style={[styles.filterPillText, floorFilter !== 'all' && styles.filterPillTextActive]}>
                {floorFilter === 'all' ? 'Tous étages' : `Étage ${floorFilter}`}
              </Text>
              <ChevronDown size={10} color={floorFilter !== 'all' ? FT.brand : FT.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterPill, statusFilter !== 'all' && styles.filterPillActive]}
              onPress={() => { closeAllDropdowns(); setShowStatusDrop(!showStatusDrop); }}
            >
              <Text style={[styles.filterPillText, statusFilter !== 'all' && styles.filterPillTextActive]}>
                {statusFilter === 'all' ? 'Tous statuts' : ROOM_STATUS_CONFIG[statusFilter].label}
              </Text>
              <ChevronDown size={10} color={statusFilter !== 'all' ? FT.brand : FT.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterPill, badgeFilter !== 'all' && styles.filterPillActive]}
              onPress={() => { closeAllDropdowns(); setShowBadgeDrop(!showBadgeDrop); }}
            >
              <Text style={[styles.filterPillText, badgeFilter !== 'all' && styles.filterPillTextActive]}>
                {badgeFilter === 'all' ? 'Toutes catégories' : badgeFilter === 'vip' ? 'VIP' : 'Prioritaire'}
              </Text>
              <ChevronDown size={10} color={badgeFilter !== 'all' ? FT.brand : FT.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterPill, assigneeFilter !== 'all' && styles.filterPillActive]}
              onPress={() => { closeAllDropdowns(); setShowAssigneeDrop(!showAssigneeDrop); }}
            >
              <Text style={[styles.filterPillText, assigneeFilter !== 'all' && styles.filterPillTextActive]}>
                {assigneeFilter === 'all' ? 'Toutes assignées' : assigneeFilter === 'none' ? 'Non assignées' : assigneeFilter}
              </Text>
              <ChevronDown size={10} color={assigneeFilter !== 'all' ? FT.brand : FT.textMuted} />
            </TouchableOpacity>
          </ScrollView>
          <View style={styles.filterRightBlock}>
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
            <Text style={styles.roomCounterText}>{filtered.length} / {total} {t.rooms.rooms}</Text>
          </View>
        </View>
      </View>

      {showFloorDrop && (
        <View style={styles.dropdown}>
          <TouchableOpacity style={[styles.dropItem, floorFilter === 'all' && styles.dropItemActive]} onPress={() => { setFloorFilter('all'); setShowFloorDrop(false); }}>
            <Text style={styles.dropItemText}>{'Tous étages'}</Text>
          </TouchableOpacity>
          {floors.map((f) => (
            <TouchableOpacity key={f} style={[styles.dropItem, floorFilter === f && styles.dropItemActive]} onPress={() => { setFloorFilter(f); setShowFloorDrop(false); }}>
              <Text style={styles.dropItemText}>{`Étage ${f}`}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {showStatusDrop && (
        <View style={styles.dropdown}>
          <TouchableOpacity style={[styles.dropItem, statusFilter === 'all' && styles.dropItemActive]} onPress={() => { setStatusFilter('all'); setShowStatusDrop(false); }}>
            <Text style={styles.dropItemText}>{'Tous statuts'}</Text>
          </TouchableOpacity>
          {(['libre', 'occupe', 'depart', 'recouche', 'hors_service'] as const).map((st) => (
            <TouchableOpacity key={st} style={[styles.dropItem, statusFilter === st && styles.dropItemActive]} onPress={() => { setStatusFilter(st); setShowStatusDrop(false); }}>
              <View style={[styles.dropDot, { backgroundColor: ROOM_STATUS_CONFIG[st].color }]} />
              <Text style={styles.dropItemText}>{ROOM_STATUS_CONFIG[st].label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {showBadgeDrop && (
        <View style={styles.dropdown}>
          <TouchableOpacity style={[styles.dropItem, badgeFilter === 'all' && styles.dropItemActive]} onPress={() => { setBadgeFilter('all'); setShowBadgeDrop(false); }}>
            <Text style={styles.dropItemText}>{'Toutes catégories'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dropItem, badgeFilter === 'vip' && styles.dropItemActive]} onPress={() => { setBadgeFilter('vip'); setShowBadgeDrop(false); }}>
            <Text style={styles.dropItemText}>{'VIP'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dropItem, badgeFilter === 'prioritaire' && styles.dropItemActive]} onPress={() => { setBadgeFilter('prioritaire'); setShowBadgeDrop(false); }}>
            <Text style={styles.dropItemText}>{'Prioritaire'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {showAssigneeDrop && (
        <View style={styles.dropdown}>
          <TouchableOpacity style={[styles.dropItem, assigneeFilter === 'all' && styles.dropItemActive]} onPress={() => { setAssigneeFilter('all'); setShowAssigneeDrop(false); }}>
            <Text style={styles.dropItemText}>{'Toutes assignées'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dropItem, assigneeFilter === 'none' && styles.dropItemActive]} onPress={() => { setAssigneeFilter('none'); setShowAssigneeDrop(false); }}>
            <Text style={styles.dropItemText}>{'Non assignées'}</Text>
          </TouchableOpacity>
          {assigneeList.map((a) => (
            <TouchableOpacity key={a} style={[styles.dropItem, assigneeFilter === a && styles.dropItemActive]} onPress={() => { setAssigneeFilter(a); setShowAssigneeDrop(false); }}>
              <Text style={styles.dropItemText}>{a}</Text>
            </TouchableOpacity>
          ))}
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
          <TouchableOpacity style={styles.moreMenuItem} onPress={() => { router.push('/settings'); setShowMoreMenu(false); }}>
            <Text style={styles.moreMenuIcon}>{'⚙️'}</Text>
            <Text style={styles.moreMenuText}>{t.menu.settings}</Text>
          </TouchableOpacity>
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
        <View style={styles.tableWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollH}>
            <View style={styles.tableInner}>
              <View style={tableStyles.stickyHeader}>
                <View style={tableStyles.headerRow}>
                  <View style={tableStyles.checkCell}>
                    <Text style={tableStyles.headerText}>{'✓'}</Text>
                  </View>
                  <View style={tableStyles.chambreCell}>
                    <Text style={tableStyles.headerText}>{'CHAMBRE'}</Text>
                  </View>
                  <View style={tableStyles.cleanlinessCell}>
                    <Text style={tableStyles.headerText}>{'STATUT'}</Text>
                  </View>
                  <View style={tableStyles.clientCell}>
                    <Text style={tableStyles.headerText}>{'CLIENT'}</Text>
                  </View>
                  <View style={tableStyles.paxCell}>
                    <Text style={tableStyles.headerText}>{'PAX'}</Text>
                  </View>
                  <View style={tableStyles.arriveeCell}>
                    <Text style={tableStyles.headerText}>{'ARRIVÉE'}</Text>
                  </View>
                  <View style={tableStyles.departCell}>
                    <Text style={tableStyles.headerText}>{'DÉPART'}</Text>
                  </View>
                  <View style={tableStyles.etaArrivalCell}>
                    <Text style={tableStyles.headerText}>{'ETA CLIENT'}</Text>
                  </View>
                  <View style={tableStyles.sourceCell}>
                    <Text style={tableStyles.headerText}>{'SOURCE'}</Text>
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
                  <View style={tableStyles.vueSdbCell}>
                    <Text style={tableStyles.headerText}>{'VUE / SDB'}</Text>
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
        </View>
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
                <TouchableOpacity
                  style={[modalStyles.input, modalStyles.dateBtn, calendarField === 'checkIn' && modalStyles.dateBtnActive]}
                  onPress={() => {
                    setCalendarField(calendarField === 'checkIn' ? null : 'checkIn');
                    if (editCheckIn) {
                      try { setCalendarMonth(new Date(editCheckIn)); } catch { /* ignore */ }
                    }
                  }}
                  testID="edit-check-in"
                >
                  <Text style={[modalStyles.dateBtnText, !editCheckIn && { color: FT.textMuted }]}>
                    {editCheckIn ? formatShortDate(editCheckIn) : 'Sélectionner'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={modalStyles.dateField}>
                <Text style={modalStyles.label}>{'Départ'}</Text>
                <TouchableOpacity
                  style={[modalStyles.input, modalStyles.dateBtn, calendarField === 'checkOut' && modalStyles.dateBtnActive]}
                  onPress={() => {
                    setCalendarField(calendarField === 'checkOut' ? null : 'checkOut');
                    if (editCheckOut) {
                      try { setCalendarMonth(new Date(editCheckOut)); } catch { /* ignore */ }
                    }
                  }}
                  testID="edit-check-out"
                >
                  <Text style={[modalStyles.dateBtnText, !editCheckOut && { color: FT.textMuted }]}>
                    {editCheckOut ? formatShortDate(editCheckOut) : 'Sélectionner'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {calendarField && (
              <View style={modalStyles.calendarWrap}>
                <MiniCalendar
                  month={calendarMonth}
                  selectedDate={calendarField === 'checkIn' ? editCheckIn : editCheckOut}
                  onSelect={(dateStr) => {
                    if (calendarField === 'checkIn') setEditCheckIn(dateStr);
                    else setEditCheckOut(dateStr);
                    setCalendarField(null);
                  }}
                  onChangeMonth={setCalendarMonth}
                />
              </View>
            )}

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

      <Modal
        visible={sourceDropdownRoomId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSourceDropdownRoomId(null)}
      >
        <TouchableOpacity
          style={sourceModalStyles.overlay}
          activeOpacity={1}
          onPress={() => setSourceDropdownRoomId(null)}
        >
          <TouchableOpacity style={sourceModalStyles.card} activeOpacity={1} onPress={() => {}}>
            <View style={sourceModalStyles.header}>
              <Text style={sourceModalStyles.headerTitle}>{'Sélectionner la source'}</Text>
              <TouchableOpacity onPress={() => setSourceDropdownRoomId(null)} style={sourceModalStyles.closeBtn}>
                <X size={18} color={FT.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={sourceModalStyles.list} nestedScrollEnabled>
              {ALL_BOOKING_SOURCES.map((src) => {
                const sc = BOOKING_SOURCE_CONFIG[src];
                const cc = CHANNEL_TYPE_CONFIG[sc.channelType];
                const currentRoom = sourceDropdownRoomId ? rooms.find((r) => r.id === sourceDropdownRoomId) : null;
                const isActive = currentRoom?.bookingSource === src;
                return (
                  <TouchableOpacity
                    key={src}
                    style={[sourceModalStyles.item, isActive && sourceModalStyles.itemActive]}
                    onPress={() => {
                      if (sourceDropdownRoomId) {
                        updateRoom({ roomId: sourceDropdownRoomId, updates: { bookingSource: src } });
                      }
                      setSourceDropdownRoomId(null);
                      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <View style={[sourceModalStyles.logo, { backgroundColor: sc.color }]}>
                      <Text style={sourceModalStyles.logoText}>{sc.icon}</Text>
                    </View>
                    <Text style={[sourceModalStyles.label, isActive && sourceModalStyles.labelActive]} numberOfLines={1}>{sc.label}</Text>
                    <View style={[sourceModalStyles.tag, { backgroundColor: cc.bgColor }]}>
                      <Text style={[sourceModalStyles.tagText, { color: cc.color }]}>{sc.hasCommission ? 'OTA' : cc.label}</Text>
                    </View>
                    {isActive && <Text style={sourceModalStyles.checkMark}>{'✓'}</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showImportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImportModal(false)}
      >
        <TouchableOpacity
          style={importModalStyles.overlay}
          activeOpacity={1}
          onPress={() => setShowImportModal(false)}
        >
          <TouchableOpacity style={importModalStyles.card} activeOpacity={1} onPress={() => {}}>
            <View style={importModalStyles.headerGradient}>
              <View style={importModalStyles.headerContent}>
                <View>
                  <Text style={importModalStyles.headerLabel}>{'IMPORT CLIENTS'}</Text>
                  <Text style={importModalStyles.headerTitle}>{'Import intelligent par IA'}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowImportModal(false)}
                  style={importModalStyles.closeBtn}
                >
                  <X size={20} color={FT.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={importModalStyles.body}>
              <Text style={importModalStyles.desc}>
                {"Importez vos données clients depuis "}
                <Text style={importModalStyles.descBold}>{"n'importe quel format"}</Text>
                {". L'IA extrait et normalise automatiquement les données."}
              </Text>

              <View style={importModalStyles.modeRow}>
                {([
                  { key: 'csv' as const, label: 'CSV / TXT', color: FT.brand, icon: 'csv' },
                  { key: 'excel' as const, label: 'Excel', color: '#43A047', icon: 'excel' },
                  { key: 'pdf' as const, label: 'PDF', color: '#E53935', icon: 'pdf' },
                  { key: 'image' as const, label: 'Image (photo / scan)', color: '#FB8C00', icon: 'image' },
                ] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      importModalStyles.modeChip,
                      importMode === opt.key && { borderColor: opt.color, backgroundColor: opt.color + '10' },
                    ]}
                    onPress={() => setImportMode(opt.key)}
                    activeOpacity={0.7}
                  >
                    {opt.icon === 'csv' && <FileText size={14} color={importMode === opt.key ? opt.color : FT.textSec} />}
                    {opt.icon === 'excel' && <FileText size={14} color={importMode === opt.key ? opt.color : FT.textSec} />}
                    {opt.icon === 'pdf' && <FileText size={14} color={importMode === opt.key ? opt.color : FT.textSec} />}
                    {opt.icon === 'image' && <Image size={14} color={importMode === opt.key ? opt.color : FT.textSec} />}
                    <Text style={[
                      importModalStyles.modeChipText,
                      importMode === opt.key && { color: opt.color, fontWeight: '700' as const },
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={importModalStyles.dropzone}
                onPress={handleImportFile}
                activeOpacity={0.7}
                testID="import-dropzone"
              >
                <View style={importModalStyles.dropzoneIcon}>
                  <Upload size={28} color={FT.textMuted} />
                </View>
                <Text style={importModalStyles.dropzoneTitle}>{'Glissez votre fichier ici'}</Text>
                <Text style={importModalStyles.dropzoneDesc}>
                  {'CSV · Excel · PDF · Image — ou cliquez pour parcourir'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={importModalStyles.templateBtn}
                onPress={handleDownloadTemplate}
                activeOpacity={0.7}
              >
                <Download size={14} color={FT.textSec} />
                <Text style={importModalStyles.templateBtnText}>{'Modèle CSV'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const ftStyles = StyleSheet.create({
  roomChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: FT.chipRadius, flexDirection: 'row', alignItems: 'center', gap: 3, minWidth: 56 },
  roomChipSelected: { borderWidth: 2, borderColor: '#FFF' },
  roomCheck: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center' },
  roomCheckText: { fontSize: 8, color: '#FFF', fontWeight: '700' as const },
  roomNum: { fontSize: 14, fontWeight: '700' as const, color: '#FFF' },
  roomBadge: { fontSize: 9 },
  roomCleanIcon: { fontSize: 9 },
  roomAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginLeft: 2 },
  roomAvatarText: { fontSize: 8, fontWeight: '700' as const, color: '#FFF' },
});

const TABLE_MIN_WIDTH = 1700;

const tableStyles = StyleSheet.create({
  stickyHeader: {
    backgroundColor: '#1E293B',
    borderBottomWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    minWidth: TABLE_MIN_WIDTH,
  },
  headerText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 0,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    minHeight: 56,
    minWidth: TABLE_MIN_WIDTH,
  },
  rowEven: {
    backgroundColor: '#F8FAFC',
  },
  rowSelected: {
    backgroundColor: '#EEF2FF',
    borderBottomColor: '#C7D2FE',
  },
  checkCell: { width: 44, alignItems: 'center' as const, justifyContent: 'center' as const, paddingLeft: 12 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF',
  },
  checkboxActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  checkMark: { fontSize: 10, color: '#FFF', fontWeight: '700' as const },
  chambreCell: {
    width: 150,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingHorizontal: 8,
  },
  roomBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  roomBadgeText: { fontSize: 14, fontWeight: '800' as const, color: '#FFF' },
  roomInfo: { flexShrink: 1 },
  roomTypeText: { fontSize: 12, fontWeight: '600' as const, color: '#1E293B' },
  roomCatText: { fontSize: 10, color: '#94A3B8', marginTop: 1 },
  clientCell: { width: 180, paddingHorizontal: 8, justifyContent: 'center' as const },
  clientNameRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  clientName: { fontSize: 13, fontWeight: '600' as const, color: '#1E293B', flexShrink: 1 },
  arriveeCell: { width: 90, paddingHorizontal: 8, justifyContent: 'center' as const },
  departCell: { width: 90, paddingHorizontal: 8, justifyContent: 'center' as const },
  dateText: { fontSize: 12, fontWeight: '600' as const, color: '#1E88E5' },
  dateTextDepart: { fontSize: 12, fontWeight: '600' as const, color: '#E53935' },
  clientEmptyRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  clientEmptyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  clientEmpty: { fontSize: 12, color: '#94A3B8', fontWeight: '500' as const },
  clientAddLink: { color: '#4F46E5', fontWeight: '600' as const, fontSize: 11 },
  vipBadgeInline: { backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  vipBadgeInlineText: { fontSize: 8, fontWeight: '800' as const, color: '#FFF' },
  priorityStar: { fontSize: 12, color: '#F59E0B' },
  hkCell: { width: 130, paddingHorizontal: 8, justifyContent: 'center' as const },
  hkBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start' as const,
  },
  hkDotInner: { width: 7, height: 7, borderRadius: 4 },
  hkLabel: { fontSize: 11, fontWeight: '600' as const },
  gouvCell: { width: 110, paddingHorizontal: 8, justifyContent: 'center' as const },
  gouvBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start' as const,
  },
  gouvText: { fontSize: 10, fontWeight: '600' as const },
  assignCell: { width: 140, paddingHorizontal: 8, justifyContent: 'center' as const },
  assignRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  assignAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  assignAvatarText: { fontSize: 10, fontWeight: '700' as const, color: '#FFF' },
  assignName: { fontSize: 12, color: '#475569', flexShrink: 1, fontWeight: '500' as const },
  vueSdbCell: { width: 100, paddingHorizontal: 8, justifyContent: 'center' as const },
  vueSdbText: { fontSize: 11, fontWeight: '600' as const, color: '#334155' },
  vueSdbSubtext: { fontSize: 10, color: '#94A3B8', marginTop: 1 },
  pdjCell: { width: 70, alignItems: 'center' as const, justifyContent: 'center' as const },
  etaCell: { width: 60, alignItems: 'center' as const, justifyContent: 'center' as const },
  etaBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  etaText: { fontSize: 11, fontWeight: '700' as const, color: '#4F46E5' },
  actionsCell: { width: 116, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6, paddingRight: 12 },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  actionIconDeparture: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  actionIconPriority: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  emptyDash: { fontSize: 12, color: '#CBD5E1' },
  cleanlinessCell: { width: 110, paddingHorizontal: 8, justifyContent: 'center' as const },
  cleanlinessBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start' as const,
  },
  cleanlinessIcon: { fontSize: 10 },
  cleanlinessLabel: { fontSize: 10, fontWeight: '600' as const },
  paxCell: { width: 80, paddingHorizontal: 8, justifyContent: 'center' as const },
  paxText: { fontSize: 12, fontWeight: '500' as const, color: '#475569' },
  etaArrivalCell: { width: 90, paddingHorizontal: 8, justifyContent: 'center' as const },
  etaArrivalText: { fontSize: 12, fontWeight: '500' as const, color: '#64748B' },
  sourceCell: { width: 120, paddingHorizontal: 6, justifyContent: 'center' as const, overflow: 'visible' as const, zIndex: 50 },
  sourceWrapper: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, position: 'relative' as const },
  sourceLogo: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  sourceLogoText: { fontSize: 11, fontWeight: '800' as const, color: '#FFF' },
  sourceInfo: { flexShrink: 1, gap: 2 },
  sourceLabel: { fontSize: 11, fontWeight: '700' as const },
  channelTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start' as const,
  },
  channelTagText: { fontSize: 8, fontWeight: '700' as const, letterSpacing: 0.3 },
  sourceEmptyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    borderColor: '#CBD5E1',
    alignSelf: 'flex-start' as const,
    position: 'relative' as const,
  },
  sourceEmptyText: { fontSize: 11, fontWeight: '600' as const, color: '#94A3B8' },
  sourceDropdown: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 999,
    width: 200,
    paddingVertical: 4,
  },
  sourceDropItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sourceDropItemActive: { backgroundColor: '#F0F9FF' },
  sourceDropLogo: {
    width: 22,
    height: 22,
    borderRadius: 5,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  sourceDropLogoText: { fontSize: 9, fontWeight: '800' as const, color: '#FFF' },
  sourceDropLabel: { flex: 1, fontSize: 12, fontWeight: '500' as const, color: '#334155' },
  sourceDropTag: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceDropTagText: { fontSize: 8, fontWeight: '700' as const },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: FT.surface, borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, ...FT.shadowMedium },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700' as const, color: FT.text },
  subtitle: { fontSize: 13, color: FT.textSec, marginTop: 2 },
  closeBtn: { padding: 4 },
  label: { fontSize: 12, fontWeight: '600' as const, color: FT.textSec, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: FT.surfaceAlt, borderWidth: 1, borderColor: FT.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: FT.text },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1 },
  moveToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: FT.brandSoft, borderRadius: 10, borderWidth: 1, borderColor: FT.brand + '20' },
  moveToggleText: { fontSize: 13, fontWeight: '600' as const, color: FT.brand },
  roomPickerScroll: { maxHeight: 150, marginTop: 8, borderWidth: 1, borderColor: FT.border, borderRadius: 10, backgroundColor: FT.surfaceAlt },
  roomOption: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: FT.borderLight },
  roomOptionActive: { backgroundColor: FT.brandSoft },
  roomOptionText: { fontSize: 13, color: FT.text },
  roomOptionTextActive: { color: FT.brand, fontWeight: '600' as const },
  noRoomsText: { fontSize: 12, color: FT.textMuted, padding: 14, textAlign: 'center' as const },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  saveBtn: { flex: 1, backgroundColor: FT.brand, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700' as const, color: '#FFF' },
  cancelBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: FT.border },
  cancelBtnText: { fontSize: 14, fontWeight: '600' as const, color: FT.textSec },
  dateBtn: { justifyContent: 'center' as const },
  dateBtnActive: { borderColor: FT.brand, backgroundColor: FT.brandSoft },
  dateBtnText: { fontSize: 14, color: FT.text },
  calendarWrap: { marginTop: 4 },
});

const sourceModalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 16, width: '100%', maxWidth: 340, overflow: 'hidden' as const, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 20 },
  header: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 16, fontWeight: '700' as const, color: '#1E293B' },
  closeBtn: { padding: 4 },
  list: { maxHeight: 400 },
  item: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  itemActive: { backgroundColor: '#F0F9FF' },
  logo: { width: 28, height: 28, borderRadius: 7, justifyContent: 'center' as const, alignItems: 'center' as const },
  logoText: { fontSize: 11, fontWeight: '800' as const, color: '#FFF' },
  label: { flex: 1, fontSize: 14, fontWeight: '500' as const, color: '#334155' },
  labelActive: { fontWeight: '700' as const, color: '#1E293B' },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 9, fontWeight: '700' as const },
  checkMark: { fontSize: 14, color: '#4F46E5', fontWeight: '700' as const, marginLeft: 4 },
});

const importModalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: FT.surface, borderRadius: 20, width: '100%', maxWidth: 500, overflow: 'hidden' as const, ...FT.shadowMedium },
  headerGradient: { backgroundColor: FT.headerBg, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLabel: { fontSize: 10, fontWeight: '700' as const, color: FT.brandLight, letterSpacing: 1, textTransform: 'uppercase' as const },
  headerTitle: { fontSize: 20, fontWeight: '800' as const, color: '#FFF', marginTop: 4 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  body: { padding: 24, gap: 16 },
  desc: { fontSize: 14, color: FT.textSec, lineHeight: 20 },
  descBold: { fontWeight: '700' as const, color: FT.text },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: FT.border, backgroundColor: FT.surfaceAlt },
  modeChipText: { fontSize: 12, fontWeight: '500' as const, color: FT.textSec },
  dropzone: { borderWidth: 2, borderColor: FT.borderLight, borderStyle: 'dashed' as const, borderRadius: 16, paddingVertical: 32, alignItems: 'center', gap: 8, backgroundColor: FT.surfaceAlt },
  dropzoneIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: FT.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: FT.borderLight },
  dropzoneTitle: { fontSize: 15, fontWeight: '700' as const, color: FT.text },
  dropzoneDesc: { fontSize: 12, color: FT.textMuted },
  templateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: FT.border, backgroundColor: FT.surface },
  templateBtnText: { fontSize: 13, fontWeight: '600' as const, color: FT.textSec },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FT.bg },
  loadingContainer: { flex: 1, backgroundColor: FT.bg, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: FT.textSec, fontSize: 14 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  billingBtn: { position: 'relative', padding: 4 },
  billingBadge: { position: 'absolute', top: -2, right: -4, backgroundColor: FT.warning, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  billingBadgeText: { fontSize: 9, fontWeight: '700' as const, color: '#FFF' },

  csvTemplateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)' },
  csvTemplateBtnText: { fontSize: 10, color: '#CCC', fontWeight: '500' as const },
  importClientBtn: { backgroundColor: FT.brand, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  importClientBtnText: { fontSize: 12, fontWeight: '700' as const, color: '#FFF' },

  kpiBar: { backgroundColor: FT.surface, borderBottomWidth: 1, borderBottomColor: FT.borderLight },
  kpiRow: {},
  kpiRowContent: { paddingHorizontal: 10, paddingVertical: 6, gap: 6, alignItems: 'center' as const },
  kpiChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: FT.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: FT.borderLight,
  },
  kpiChipValue: { fontSize: 15, fontWeight: '800' as const },
  kpiChipLabel: { fontSize: 9, fontWeight: '600' as const, color: FT.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.3 },
  kpiToggleBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 4, paddingVertical: 4, paddingHorizontal: 12, alignSelf: 'flex-end' as const, marginRight: 10, marginBottom: 2 },
  kpiToggleText: { fontSize: 10, fontWeight: '600' as const, color: FT.textMuted },
  kpiToggleTextActive: { color: FT.brand },

  searchFilterRow: { backgroundColor: FT.surface, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: FT.borderLight },
  searchBox: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: FT.surfaceAlt, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6, borderWidth: 1, borderColor: FT.borderLight, width: 180, minWidth: 140 },
  searchInput: { flex: 1, fontSize: 12, color: FT.text, padding: 0 },
  filterRow2: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  filterScrollFlex: { flex: 1 },
  filterPillsContent: { gap: 6, paddingRight: 8 },
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: FT.surfaceAlt, borderWidth: 1, borderColor: FT.borderLight },
  filterPillActive: { borderColor: FT.brand, backgroundColor: FT.brandSoft },
  filterPillText: { fontSize: 12, fontWeight: '500' as const, color: FT.textSec },
  filterPillTextActive: { color: FT.brand, fontWeight: '600' as const },
  filterRightBlock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roomCounterText: { fontSize: 11, color: FT.textMuted, fontWeight: '600' as const },
  viewToggle: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: FT.surfaceAlt, borderWidth: 1, borderColor: FT.border },
  viewToggleActive: { backgroundColor: FT.brand, borderColor: FT.brand },

  moreMenu: { backgroundColor: FT.surface, borderBottomWidth: 1, borderBottomColor: FT.border, paddingVertical: 4, position: 'absolute' as const, top: 52, right: 14, zIndex: 200, borderRadius: 12, shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 20 },
  moreMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  moreMenuIcon: { fontSize: 16 },
  moreMenuText: { fontSize: 14, color: FT.text, fontWeight: '500' as const },

  dropdown: { position: 'absolute', top: 200, left: 14, right: 14, backgroundColor: FT.surface, borderRadius: 12, borderWidth: 1, borderColor: FT.border, zIndex: 100, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
  dropItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: FT.border, gap: 8 },
  dropItemActive: { backgroundColor: FT.brandSoft },
  dropItemText: { fontSize: 14, color: FT.text },
  dropDot: { width: 8, height: 8, borderRadius: 4 },

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
  tableWrapper: { flex: 1 },
  tableScrollH: { flex: 1 },
  tableInner: { flex: 1, minWidth: TABLE_MIN_WIDTH },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600' as const, color: FT.text },
});
