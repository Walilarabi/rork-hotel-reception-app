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
import { DoorOpen, UserPlus, X, ChevronDown, Coffee, List, LayoutGrid, Eye, Star, Pencil, Upload, Check, Search, FileText, Download, SlidersHorizontal, BedDouble, LogOut, RefreshCw, CheckCircle, AlertTriangle, Clock, Moon, Sun, MapPin, Zap } from 'lucide-react-native';
import UserMenuButton from '@/components/UserMenuButton';
import FlowtymHeader from '@/components/FlowtymHeader';
import DeskFloorSection from '@/components/DeskFloorSection';
import StaffForecastCard from '@/components/StaffForecastCard';
import * as Haptics from 'expo-haptics';
import { useHotel, useFilteredRooms } from '@/providers/HotelProvider';
import { PMSStatusIndicator } from '@/components/PMSStatusIndicator';
import { useTheme } from '@/providers/ThemeProvider';

import { RoomStatus, ClientBadge, Room, ROOM_STATUS_CONFIG, CLEANING_STATUS_CONFIG, ROOM_CLEANLINESS_CONFIG, BOOKING_SOURCE_CONFIG, CHANNEL_TYPE_CONFIG, ALL_BOOKING_SOURCES } from '@/constants/types';

const DS_LIGHT = {
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  surfaceWarm: '#FAFBFD',
  surfaceHover: '#F0F1F6',
  headerBg: '#0F172A',
  accent: '#4F6BED',
  accentSoft: 'rgba(79,107,237,0.07)',
  accentLight: '#6B83F2',
  accentDark: '#3A50C7',
  text: '#0F172A',
  textSec: '#475569',
  textMuted: '#94A3B8',
  textLight: '#CBD5E1',
  border: '#E8ECF1',
  borderLight: '#F1F5F9',
  success: '#10B981',
  successSoft: 'rgba(16,185,129,0.08)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245,158,11,0.08)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239,68,68,0.06)',
  info: '#3B82F6',
  infoSoft: 'rgba(59,130,246,0.08)',
  teal: '#14B8A6',
  tealSoft: 'rgba(20,184,166,0.08)',
  rowEven: '#FFFFFF',
  rowOdd: '#FAFBFD',
  rowSelected: 'rgba(79,107,237,0.06)',
  rowSelectedBorder: 'rgba(79,107,237,0.12)',
  rowBorder: '#F1F5F9',
  checkboxBg: '#FFF',
  checkboxBorder: '#D1D5DB',
  tableHeaderBg: '#0F172A',
  tableHeaderText: 'rgba(255,255,255,0.5)',
  shadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  } as const,
  shadowMd: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 5,
  } as const,
};

const DS_DARK = {
  bg: '#0B0E14',
  surface: '#141820',
  surfaceWarm: '#1A1F2B',
  surfaceHover: '#222836',
  headerBg: '#0B0E14',
  accent: '#6B83F2',
  accentSoft: 'rgba(107,131,242,0.12)',
  accentLight: '#8B9DF5',
  accentDark: '#4F6BED',
  text: '#E2E8F0',
  textSec: '#94A3B8',
  textMuted: '#64748B',
  textLight: '#475569',
  border: '#1E2433',
  borderLight: '#171C26',
  success: '#34D399',
  successSoft: 'rgba(52,211,153,0.12)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251,191,36,0.12)',
  danger: '#F87171',
  dangerSoft: 'rgba(248,113,113,0.10)',
  info: '#60A5FA',
  infoSoft: 'rgba(96,165,250,0.12)',
  teal: '#2DD4BF',
  tealSoft: 'rgba(45,212,191,0.12)',
  rowEven: '#141820',
  rowOdd: '#171C26',
  rowSelected: 'rgba(107,131,242,0.10)',
  rowSelectedBorder: 'rgba(107,131,242,0.18)',
  rowBorder: '#1E2433',
  checkboxBg: '#1A1F2B',
  checkboxBorder: '#374151',
  tableHeaderBg: '#0B0E14',
  tableHeaderText: 'rgba(255,255,255,0.4)',
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  } as const,
  shadowMd: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  } as const,
};

interface DSColors {
  bg: string; surface: string; surfaceWarm: string; surfaceHover: string; headerBg: string;
  accent: string; accentSoft: string; accentLight: string; accentDark: string;
  text: string; textSec: string; textMuted: string; textLight: string;
  border: string; borderLight: string;
  success: string; successSoft: string; warning: string; warningSoft: string;
  danger: string; dangerSoft: string; info: string; infoSoft: string;
  teal: string; tealSoft: string;
  rowEven: string; rowOdd: string; rowSelected: string; rowSelectedBorder: string; rowBorder: string;
  checkboxBg: string; checkboxBorder: string; tableHeaderBg: string; tableHeaderText: string;
  shadow: { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number; elevation: number };
  shadowMd: { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number; elevation: number };
}

const DS: DSColors = DS_LIGHT;

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
        style={[pdjStyles.btn, !included ? pdjStyles.btnActiveOff : pdjStyles.btnOff]}
        onPress={() => {
          onToggle(false);
          if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        activeOpacity={0.7}
        testID="pdj-toggle-off"
      >
        <X size={10} color={!included ? '#FFF' : DS.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[pdjStyles.btn, included ? pdjStyles.btnActiveOn : pdjStyles.btnOn]}
        onPress={() => {
          onToggle(true);
          if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        activeOpacity={0.7}
        testID="pdj-toggle-on"
      >
        <Check size={10} color={included ? '#FFF' : DS.textMuted} />
      </TouchableOpacity>
    </View>
  );
});

const pdjStyles = StyleSheet.create({
  container: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  btn: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center' as const, alignItems: 'center' as const },
  btnOff: { backgroundColor: DS.borderLight },
  btnOn: { backgroundColor: DS.borderLight },
  btnActiveOff: { backgroundColor: '#EF4444' },
  btnActiveOn: { backgroundColor: '#10B981' },
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
          <Text style={calStyles.navBtnText}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={calStyles.monthLabel}>{MONTHS_FR[mo]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
          <Text style={calStyles.navBtnText}>{'›'}</Text>
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
  wrap: { marginTop: 8, backgroundColor: DS.surfaceWarm, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: DS.border },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  navBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: DS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: DS.border },
  navBtnText: { fontSize: 16, fontWeight: '600' as const, color: DS.accent },
  monthLabel: { fontSize: 14, fontWeight: '700' as const, color: DS.text },
  daysRow: { flexDirection: 'row' },
  dayHeaderCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  dayHeaderText: { fontSize: 10, fontWeight: '600' as const, color: DS.textMuted, textTransform: 'uppercase' as const },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  cell: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  cellSelected: { backgroundColor: DS.accent, borderRadius: 12 },
  cellToday: { backgroundColor: DS.accentSoft, borderRadius: 12 },
  cellText: { fontSize: 13, fontWeight: '500' as const, color: DS.text },
  cellTextSelected: { color: '#FFF', fontWeight: '700' as const },
  cellTextToday: { color: DS.accent, fontWeight: '700' as const },
});

const KPI_CARDS_CONFIG = [
  { key: 'chambres', label: 'Chambres', icon: BedDouble, color: DS.accent, bg: DS.accentSoft },
  { key: 'departs', label: 'Départs', icon: LogOut, color: '#EF4444', bg: 'rgba(239,68,68,0.06)' },
  { key: 'recouches', label: 'Recouches', icon: RefreshCw, color: '#F59E0B', bg: 'rgba(245,158,11,0.06)' },
  { key: 'en_cours', label: 'En cours', icon: Clock, color: '#3B82F6', bg: 'rgba(59,130,246,0.06)' },
  { key: 'terminees', label: 'Terminées', icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.06)' },
  { key: 'a_valider', label: 'À valider', icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245,158,11,0.06)' },
  { key: 'pdj_inclus', label: 'PDJ inclus', icon: Coffee, color: '#8B5CF6', bg: 'rgba(139,92,246,0.06)' },
  { key: 'eta_urgents', label: 'ETA urgents', icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239,68,68,0.06)' },
] as const;

export default function ReceptionDashboard() {
  const router = useRouter();
  const { t, isDarkMode, toggleDarkMode } = useTheme();
  const d: DSColors = useMemo(() => isDarkMode ? DS_DARK : DS_LIGHT, [isDarkMode]);
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
  const [cleanlinessModalRoomId, setCleanlinessModalRoomId] = useState<string | null>(null);
  const [etaModalRoomId, setEtaModalRoomId] = useState<string | null>(null);
  const [etaCustomTime, setEtaCustomTime] = useState('');

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
    if (room.status === 'depart') return { label: 'Départ', color: '#EF4444', softBg: 'rgba(239,68,68,0.06)' };
    if (room.status === 'recouche') return { label: 'Recouche', color: '#F59E0B', softBg: 'rgba(245,158,11,0.06)' };
    if (room.status === 'hors_service') return { label: 'Bloquée', color: '#64748B', softBg: 'rgba(100,116,139,0.06)' };
    if (room.cleaningStatus === 'en_cours') return { label: 'En cours', color: '#14B8A6', softBg: 'rgba(20,184,166,0.06)' };
    if (room.cleaningStatus === 'nettoyee') return { label: 'Terminé', color: '#10B981', softBg: 'rgba(16,185,129,0.06)' };
    if (room.cleaningStatus === 'validee') return { label: 'Validé', color: '#10B981', softBg: 'rgba(16,185,129,0.06)' };
    if (room.status === 'libre') return { label: 'Libre', color: '#94A3B8', softBg: 'rgba(148,163,184,0.06)' };
    return { label: '', color: '#94A3B8', softBg: 'transparent' };
  }, []);

  const getGouvernanteDisplay = useCallback((room: Room) => {
    if (room.cleaningStatus === 'nettoyee') return { label: 'À valider', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' };
    if (room.cleaningStatus === 'validee') return { label: 'Validé', color: '#10B981', bg: 'rgba(16,185,129,0.08)' };
    if (room.cleaningStatus === 'refusee') return { label: 'Refusé', color: '#EF4444', bg: 'rgba(239,68,68,0.08)' };
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

    const STATUS_SOFT_COLORS: Record<string, string> = {
      libre: '#10B981',
      occupe: '#3B82F6',
      depart: '#EF4444',
      recouche: '#F59E0B',
      hors_service: '#64748B',
    };
    const statusColor = STATUS_SOFT_COLORS[room.status] ?? '#94A3B8';

    return (
      <View style={[tbl.row, { backgroundColor: isSelected ? d.rowSelected : isEven ? d.rowEven : d.rowOdd, borderBottomColor: isSelected ? d.rowSelectedBorder : d.rowBorder }]}>
        <TouchableOpacity
          style={tbl.checkCell}
          onPress={() => {
            toggleRoomSelection(room.id);
            if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={[tbl.checkbox, { backgroundColor: d.checkboxBg, borderColor: d.checkboxBorder }, isSelected && tbl.checkboxActive]}>
            {isSelected && <Check size={10} color="#FFF" />}
          </View>
        </TouchableOpacity>

        <View style={tbl.chambreCell}>
          <View style={[tbl.roomBadge, { backgroundColor: statusColor }]}>
            <Text style={tbl.roomBadgeText}>{room.roomNumber}</Text>
          </View>
          <View style={tbl.roomMeta}>
            <Text style={[tbl.roomTypeLabel, { color: d.text }]}>{room.roomType}</Text>
            <Text style={[tbl.roomSubLabel, { color: d.textMuted }]} numberOfLines={1}>
              {room.roomCategory ?? 'Classique'} · {room.roomSize ?? 16}m²
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={tbl.cleanlinessCell}
          onPress={() => {
            setCleanlinessModalRoomId(room.id);
            if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          activeOpacity={0.6}
        >
          {(() => {
            const cls = room.cleanlinessStatus ?? 'sale';
            const cfg = ROOM_CLEANLINESS_CONFIG[cls];
            return (
              <View style={[tbl.softBadge, { backgroundColor: cfg.color + '0D' }]}>
                <Text style={tbl.softBadgeIcon}>{cfg.icon}</Text>
                <Text style={[tbl.softBadgeLabel, { color: cfg.color }]} numberOfLines={1}>{cfg.label}</Text>
                <Pencil size={9} color={cfg.color} style={{ marginLeft: 2 }} />
              </View>
            );
          })()}
        </TouchableOpacity>

        <TouchableOpacity style={tbl.clientCell} onPress={() => handleEditClient(room)} activeOpacity={0.6}>
          {hasClient ? (
            <View style={tbl.clientContent}>
              <View style={tbl.clientRow}>
                {room.clientBadge === 'vip' && (
                  <View style={tbl.vipTag}>
                    <Text style={tbl.vipTagText}>VIP</Text>
                  </View>
                )}
                {room.clientBadge === 'prioritaire' && (
                  <Star size={11} color="#F59E0B" fill="#F59E0B" />
                )}
                <Text style={[tbl.clientName, { color: d.text }]} numberOfLines={1}>
                  {room.currentReservation?.guestName}
                </Text>
              </View>
              <Pencil size={10} color={d.textMuted} />
            </View>
          ) : (
            <View style={tbl.clientEmptyWrap}>
              <View style={[tbl.clientEmptyDot, { backgroundColor: d.textLight }]} />
              <Text style={[tbl.clientEmptyText, { color: d.textMuted }]}>Libre</Text>
              <Text style={[tbl.clientAddBtn, { color: d.accent }]}>+ Ajouter</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={tbl.paxCell}>
          {hasClient ? (
            <Text style={[tbl.paxText, { color: d.textSec }]}>
              {room.currentReservation?.adults ?? 1}
              {(room.currentReservation?.children ?? 0) > 0 ? ` + ${room.currentReservation?.children}` : ''}
            </Text>
          ) : (
            <Text style={[tbl.dash, { color: d.textLight }]}>—</Text>
          )}
        </View>

        <View style={tbl.dateCell}>
          {hasClient && room.currentReservation?.checkInDate ? (
            <Text style={tbl.dateIn}>{formatShortDate(room.currentReservation.checkInDate)}</Text>
          ) : (
            <Text style={[tbl.dash, { color: d.textLight }]}>—</Text>
          )}
        </View>

        <View style={tbl.dateCell}>
          {hasClient && room.currentReservation?.checkOutDate ? (
            <Text style={tbl.dateOut}>{formatShortDate(room.currentReservation.checkOutDate)}</Text>
          ) : (
            <Text style={[tbl.dash, { color: d.textLight }]}>—</Text>
          )}
        </View>

        <TouchableOpacity
          style={tbl.etaArrivalCell}
          onPress={() => {
            setEtaModalRoomId(room.id);
            setEtaCustomTime(room.etaArrival ?? '');
            if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          activeOpacity={0.6}
        >
          {room.etaArrival ? (
            <View style={[tbl.etaArrivalPill, { backgroundColor: d.accentSoft }]}>
              <Text style={[tbl.etaArrivalText, { color: d.accent }]}>{room.etaArrival}</Text>
              <Pencil size={9} color={d.accent} style={{ marginLeft: 3 }} />
            </View>
          ) : (
            <View style={[tbl.etaArrivalEmpty, { borderColor: d.textLight }]}>
              <Clock size={10} color={d.textMuted} />
              <Text style={[tbl.etaArrivalEmptyText, { color: d.textMuted }]}>+ ETA</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={tbl.sourceCell}>
          {room.bookingSource ? (() => {
            const srcCfg = BOOKING_SOURCE_CONFIG[room.bookingSource];
            const chCfg = CHANNEL_TYPE_CONFIG[srcCfg.channelType];
            return (
              <TouchableOpacity
                style={tbl.sourceWrap}
                onPress={() => setSourceDropdownRoomId(sourceDropdownRoomId === room.id ? null : room.id)}
                activeOpacity={0.7}
              >
                <View style={[tbl.sourceDot, { backgroundColor: srcCfg.color }]}>
                  <Text style={tbl.sourceDotText}>{srcCfg.icon}</Text>
                </View>
                <View style={tbl.sourceInfo}>
                  <Text style={[tbl.sourceLabel, { color: srcCfg.color }]} numberOfLines={1}>
                    {room.bookingSource === 'Téléphone' ? 'Tél.' : room.bookingSource === 'Walk-in' ? 'Walk-in' : room.bookingSource}
                  </Text>
                  <View style={[tbl.channelPill, { backgroundColor: chCfg.bgColor }]}>
                    <Text style={[tbl.channelPillText, { color: chCfg.color }]}>
                      {srcCfg.hasCommission ? 'OTA' : chCfg.label}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })() : (
            <TouchableOpacity
              style={[tbl.sourceEmpty, { borderColor: d.textLight }]}
              onPress={() => setSourceDropdownRoomId(sourceDropdownRoomId === room.id ? null : room.id)}
              activeOpacity={0.7}
            >
              <Text style={[tbl.sourceEmptyText, { color: d.textMuted }]}>+ Source</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={tbl.hkCell}>
          {hkDisplay.label ? (
            <View style={[tbl.softBadge, { backgroundColor: hkDisplay.softBg }]}>
              <View style={[tbl.hkDot, { backgroundColor: hkDisplay.color }]} />
              <Text style={[tbl.softBadgeLabel, { color: hkDisplay.color }]} numberOfLines={1}>
                {hkDisplay.label}
              </Text>
            </View>
          ) : (
            <Text style={[tbl.dash, { color: d.textLight }]}>—</Text>
          )}
        </View>

        <View style={tbl.gouvCell}>
          {gouvDisplay ? (
            <View style={[tbl.softBadge, { backgroundColor: gouvDisplay.bg }]}>
              <Text style={[tbl.softBadgeLabel, { color: gouvDisplay.color }]}>{gouvDisplay.label}</Text>
            </View>
          ) : (
            <Text style={[tbl.dash, { color: d.textLight }]}>—</Text>
          )}
        </View>

        <View style={tbl.assignCell}>
          {assignee ? (
            <View style={tbl.assignWrap}>
              <View style={tbl.assignAvatar}>
                <Text style={tbl.assignAvatarText}>{assigneeInitials}</Text>
              </View>
              <Text style={[tbl.assignName, { color: d.textSec }]} numberOfLines={1}>{assignee}</Text>
            </View>
          ) : (
            <Text style={[tbl.dash, { color: d.textLight }]}>—</Text>
          )}
        </View>

        <View style={tbl.viewSdbCell}>
          <Text style={[tbl.viewText, { color: d.text }]}>{room.viewType ?? 'Rue'}</Text>
          <Text style={[tbl.sdbText, { color: d.textMuted }]}>{room.bathroomType ?? 'Douche'}</Text>
        </View>

        <View style={tbl.pdjCell}>
          <PdjToggleButtons
            included={pdjIncluded}
            onToggle={(val) => handleToggleBreakfast(room.id, val)}
          />
        </View>

        <View style={tbl.etaCell}>
          {eta ? (
            <View style={[tbl.etaPill, { backgroundColor: d.infoSoft }]}>
              <Text style={[tbl.etaPillText, { color: d.info }]}>{eta}</Text>
            </View>
          ) : (
            <Text style={[tbl.dash, { color: d.textLight }]}>—</Text>
          )}
        </View>

        <View style={tbl.actionsCell}>
          <TouchableOpacity
            onPress={() => handleRoomPress(room)}
            style={[tbl.actionBtn, { backgroundColor: d.surfaceWarm, borderColor: d.border }]}
            testID={`action-detail-${room.roomNumber}`}
          >
            <Eye size={14} color={d.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSetDeparture(room)}
            style={[tbl.actionBtn, tbl.actionBtnDanger, { borderColor: isDarkMode ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.15)' }]}
            testID={`action-depart-${room.roomNumber}`}
          >
            <DoorOpen size={14} color={d.danger} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleTogglePriority(room)}
            style={[tbl.actionBtn, room.clientBadge === 'prioritaire' && tbl.actionBtnStar]}
            testID={`action-priority-${room.roomNumber}`}
          >
            <Star
              size={14}
              color={room.clientBadge === 'prioritaire' ? '#F59E0B' : d.textMuted}
              fill={room.clientBadge === 'prioritaire' ? '#F59E0B' : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [selectedRoomIds, handleRoomPress, toggleRoomSelection, handleEditClient, handleToggleBreakfast, handleSetDeparture, handleTogglePriority, getHousekeepingDisplay, getGouvernanteDisplay, getCleaningEta, sourceDropdownRoomId, d, isDarkMode]);

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
      <View style={[s.loadingWrap, { backgroundColor: d.bg }]}>
        <Stack.Screen options={{ title: t.reception.title }} />
        <ActivityIndicator size="large" color={d.accent} />
        <Text style={[s.loadingText, { color: d.textSec }]}>{t.common.loading}...</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: d.bg }]}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: d.headerBg },
          headerTintColor: '#FFF',
          headerShadowVisible: false,
          headerTitle: () => (
            <FlowtymHeader
              hotelName="Grand Hôtel"
              navItems={[
                { label: t.direction.todayAlerts, icon: '🔔', badge: unbilledBreakfasts.length },
              ]}
              rightItems={
                <View style={s.headerRight}>
                  {unbilledBreakfasts.length > 0 && (
                    <TouchableOpacity style={s.billingBtn} onPress={() => {
                      Alert.alert(
                        `${unbilledBreakfasts.length} PDJ ${t.reception.billing}`,
                        unbilledBreakfasts.map((o) => `Ch. ${o.roomNumber} — ${o.personCount} pers.`).join('\n'),
                        [{ text: t.common.ok }]
                      );
                    }}>
                      <Coffee size={16} color="#FFF" />
                      <View style={s.billingBadge}>
                        <Text style={s.billingBadgeText}>{unbilledBreakfasts.length}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  <PMSStatusIndicator syncState={pmsSync} isSyncing={isSyncing} onSync={syncPms} />
                  <TouchableOpacity style={s.csvBtn} onPress={handleDownloadTemplate}>
                    <Download size={12} color="rgba(255,255,255,0.6)" />
                    <Text style={s.csvBtnText}>CSV</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.importBtn, { backgroundColor: d.accent }]}
                    onPress={handleImportPress}
                    testID="import-clients-btn"
                  >
                    <Upload size={12} color="#FFF" />
                    <Text style={s.importBtnText}>Import</Text>
                  </TouchableOpacity>
                  <UserMenuButton />
                </View>
              }
            />
          ),
          headerRight: () => null,
        }}
      />

      <View style={[s.navStripSection, { backgroundColor: d.surface, borderBottomColor: d.borderLight }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.navStripScroll}>
          {[
            { label: 'Plan Chambres', icon: MapPin, color: d.info, route: '/hotel-plan' as const },
            { label: 'Répartition', icon: Zap, color: d.success, route: '/housekeeping-assignments' as const },
          ].map((item) => {
            const IconComp = item.icon;
            return (
              <TouchableOpacity
                key={item.label}
                style={[s.navStripItem, { backgroundColor: d.surfaceWarm, borderColor: d.border }]}
                onPress={() => router.push(item.route)}
                activeOpacity={0.7}
              >
                <View style={[s.navStripIcon, { backgroundColor: item.color + '15' }]}>
                  <IconComp size={16} color={item.color} />
                </View>
                <Text style={[s.navStripLabel, { color: d.text }]} numberOfLines={1}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {showKpi && (
        <View style={[s.kpiSection, { backgroundColor: d.surface, borderBottomColor: d.borderLight }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.kpiScroll}>
            {KPI_CARDS_CONFIG.map((cfg) => {
              const IconComp = cfg.icon;
              return (
                <View key={cfg.key} style={[s.kpiCard, d.shadow, { backgroundColor: d.surface, borderColor: d.borderLight }]}>
                  <View style={[s.kpiIconWrap, { backgroundColor: cfg.bg }]}>
                    <IconComp size={16} color={cfg.color} />
                  </View>
                  <View style={s.kpiTextBlock}>
                    <Text style={[s.kpiValue, { color: cfg.color }]}>{kpiData[cfg.key]}</Text>
                    <Text style={[s.kpiLabel, { color: d.textMuted }]}>{cfg.label}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={[s.toolbar, { backgroundColor: d.surface, borderBottomColor: d.borderLight }]}>
        <View style={s.toolbarTop}>
          <View style={[s.searchWrap, { backgroundColor: d.surfaceWarm, borderColor: d.border }]}>
            <Search size={15} color={d.textMuted} />
            <TextInput
              style={[s.searchInput, { color: d.text }]}
              placeholder="Chambre, client..."
              placeholderTextColor={d.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              testID="search-rooms"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <X size={14} color={d.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillsScroll} style={s.pillsWrap}>
            <TouchableOpacity
              style={[s.pill, { backgroundColor: d.surfaceWarm, borderColor: floorFilter !== 'all' ? d.accent : d.border }]}
              onPress={() => { closeAllDropdowns(); setShowFloorDrop(!showFloorDrop); }}
            >
              <Text style={[s.pillText, { color: floorFilter !== 'all' ? d.accent : d.textSec }]}>
                {floorFilter === 'all' ? 'Étage' : `Ét. ${floorFilter}`}
              </Text>
              <ChevronDown size={10} color={floorFilter !== 'all' ? d.accent : d.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.pill, { backgroundColor: d.surfaceWarm, borderColor: statusFilter !== 'all' ? d.accent : d.border }]}
              onPress={() => { closeAllDropdowns(); setShowStatusDrop(!showStatusDrop); }}
            >
              <Text style={[s.pillText, { color: statusFilter !== 'all' ? d.accent : d.textSec }]}>
                {statusFilter === 'all' ? 'Statut' : ROOM_STATUS_CONFIG[statusFilter].label}
              </Text>
              <ChevronDown size={10} color={statusFilter !== 'all' ? d.accent : d.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.pill, { backgroundColor: d.surfaceWarm, borderColor: badgeFilter !== 'all' ? d.accent : d.border }]}
              onPress={() => { closeAllDropdowns(); setShowBadgeDrop(!showBadgeDrop); }}
            >
              <Text style={[s.pillText, { color: badgeFilter !== 'all' ? d.accent : d.textSec }]}>
                {badgeFilter === 'all' ? 'Badge' : badgeFilter === 'vip' ? 'VIP' : 'Prioritaire'}
              </Text>
              <ChevronDown size={10} color={badgeFilter !== 'all' ? d.accent : d.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.pill, { backgroundColor: d.surfaceWarm, borderColor: assigneeFilter !== 'all' ? d.accent : d.border }]}
              onPress={() => { closeAllDropdowns(); setShowAssigneeDrop(!showAssigneeDrop); }}
            >
              <Text style={[s.pillText, { color: assigneeFilter !== 'all' ? d.accent : d.textSec }]}>
                {assigneeFilter === 'all' ? 'Assignée' : assigneeFilter === 'none' ? 'Non assignées' : assigneeFilter}
              </Text>
              <ChevronDown size={10} color={assigneeFilter !== 'all' ? d.accent : d.textMuted} />
            </TouchableOpacity>
          </ScrollView>

          <View style={s.toolbarRight}>
            <View style={[s.viewSwitch, { backgroundColor: d.surfaceWarm, borderColor: d.border }]}>
              <TouchableOpacity
                style={[s.viewBtn, viewMode === 'plan' && { backgroundColor: d.accent }]}
                onPress={() => setViewMode('plan')}
              >
                <LayoutGrid size={14} color={viewMode === 'plan' ? '#FFF' : d.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.viewBtn, viewMode === 'table' && { backgroundColor: d.accent }]}
                onPress={() => setViewMode('table')}
              >
                <List size={14} color={viewMode === 'table' ? '#FFF' : d.textMuted} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[s.kpiToggle, { backgroundColor: isDarkMode ? d.accent : d.surfaceWarm, borderColor: isDarkMode ? d.accent : d.border }]}
              onPress={() => {
                void toggleDarkMode();
                if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              testID="toggle-dark-mode-btn"
            >
              {isDarkMode ? <Sun size={14} color="#FFF" /> : <Moon size={14} color={d.textMuted} />}
            </TouchableOpacity>
            <Text style={[s.counterText, { color: d.textMuted }]}>{filtered.length}/{total}</Text>
            <TouchableOpacity
              style={[s.kpiToggle, { backgroundColor: d.surfaceWarm, borderColor: d.border }]}
              onPress={() => {
                setShowKpi(!showKpi);
                if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              testID="toggle-kpi-btn"
            >
              <SlidersHorizontal size={14} color={showKpi ? d.accent : d.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showFloorDrop && (
        <View style={[s.dropdown, { backgroundColor: d.surface, borderColor: d.border }]}>
          <TouchableOpacity style={[s.dropItem, floorFilter === 'all' && s.dropItemActive]} onPress={() => { setFloorFilter('all'); setShowFloorDrop(false); }}>
            <Text style={[s.dropText, { color: d.text }, floorFilter === 'all' && { color: d.accent }]}>Tous étages</Text>
          </TouchableOpacity>
          {floors.map((f) => (
            <TouchableOpacity key={f} style={[s.dropItem, floorFilter === f && s.dropItemActive]} onPress={() => { setFloorFilter(f); setShowFloorDrop(false); }}>
              <Text style={[s.dropText, { color: d.text }, floorFilter === f && { color: d.accent }]}>{`Étage ${f}`}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {showStatusDrop && (
        <View style={[s.dropdown, { backgroundColor: d.surface, borderColor: d.border }]}>
          <TouchableOpacity style={[s.dropItem, statusFilter === 'all' && s.dropItemActive]} onPress={() => { setStatusFilter('all'); setShowStatusDrop(false); }}>
            <Text style={[s.dropText, { color: d.text }, statusFilter === 'all' && { color: d.accent }]}>Tous statuts</Text>
          </TouchableOpacity>
          {(['libre', 'occupe', 'depart', 'recouche', 'hors_service'] as const).map((st) => (
            <TouchableOpacity key={st} style={[s.dropItem, statusFilter === st && s.dropItemActive]} onPress={() => { setStatusFilter(st); setShowStatusDrop(false); }}>
              <View style={[s.dropDot, { backgroundColor: ROOM_STATUS_CONFIG[st].color }]} />
              <Text style={[s.dropText, { color: d.text }, statusFilter === st && { color: d.accent }]}>{ROOM_STATUS_CONFIG[st].label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {showBadgeDrop && (
        <View style={[s.dropdown, { backgroundColor: d.surface, borderColor: d.border }]}>
          <TouchableOpacity style={[s.dropItem, badgeFilter === 'all' && s.dropItemActive]} onPress={() => { setBadgeFilter('all'); setShowBadgeDrop(false); }}>
            <Text style={[s.dropText, { color: d.text }, badgeFilter === 'all' && { color: d.accent }]}>Tous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.dropItem, badgeFilter === 'vip' && s.dropItemActive]} onPress={() => { setBadgeFilter('vip'); setShowBadgeDrop(false); }}>
            <Text style={[s.dropText, { color: d.text }, badgeFilter === 'vip' && { color: d.accent }]}>VIP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.dropItem, badgeFilter === 'prioritaire' && s.dropItemActive]} onPress={() => { setBadgeFilter('prioritaire'); setShowBadgeDrop(false); }}>
            <Text style={[s.dropText, { color: d.text }, badgeFilter === 'prioritaire' && { color: d.accent }]}>Prioritaire</Text>
          </TouchableOpacity>
        </View>
      )}
      {showAssigneeDrop && (
        <View style={[s.dropdown, { backgroundColor: d.surface, borderColor: d.border }]}>
          <TouchableOpacity style={[s.dropItem, assigneeFilter === 'all' && s.dropItemActive]} onPress={() => { setAssigneeFilter('all'); setShowAssigneeDrop(false); }}>
            <Text style={[s.dropText, { color: d.text }, assigneeFilter === 'all' && { color: d.accent }]}>Toutes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.dropItem, assigneeFilter === 'none' && s.dropItemActive]} onPress={() => { setAssigneeFilter('none'); setShowAssigneeDrop(false); }}>
            <Text style={[s.dropText, { color: d.text }, assigneeFilter === 'none' && { color: d.accent }]}>Non assignées</Text>
          </TouchableOpacity>
          {assigneeList.map((a) => (
            <TouchableOpacity key={a} style={[s.dropItem, assigneeFilter === a && s.dropItemActive]} onPress={() => { setAssigneeFilter(a); setShowAssigneeDrop(false); }}>
              <Text style={[s.dropText, { color: d.text }, assigneeFilter === a && { color: d.accent }]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showMoreMenu && (
        <View style={[s.moreMenu, { backgroundColor: d.surface, borderColor: d.border }]}>
          <TouchableOpacity style={s.moreItem} onPress={() => { router.push('/history'); setShowMoreMenu(false); }}>
            <Text style={s.moreIcon}>📋</Text>
            <Text style={[s.moreText, { color: d.text }]}>{t.direction.historyLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.moreItem} onPress={() => { router.push('/breakfast-stats'); setShowMoreMenu(false); }}>
            <Text style={s.moreIcon}>☕</Text>
            <Text style={[s.moreText, { color: d.text }]}>{t.breakfast.title}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.moreItem} onPress={() => { router.push('/economat'); setShowMoreMenu(false); }}>
            <Text style={s.moreIcon}>📦</Text>
            <Text style={[s.moreText, { color: d.text }]}>{t.economat.title}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.moreItem} onPress={() => { router.push('/settings'); setShowMoreMenu(false); }}>
            <Text style={s.moreIcon}>⚙️</Text>
            <Text style={[s.moreText, { color: d.text }]}>{t.menu.settings}</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectionCount > 0 && (
        <View style={[s.selBar, { backgroundColor: d.accentSoft, borderBottomColor: isDarkMode ? 'rgba(107,131,242,0.15)' : 'rgba(79,107,237,0.1)' }]}>
          <View style={s.selLeft}>
            <View style={[s.selBadge, { backgroundColor: d.accent }]}>
              <Text style={s.selBadgeText}>{selectionCount}</Text>
            </View>
            <Text style={[s.selLabel, { color: d.accent }]}>{t.common.selected}</Text>
            <TouchableOpacity onPress={clearSelection} style={s.selClear}>
              <X size={14} color={d.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={s.selActions}>
            <TouchableOpacity style={s.selAssignBtn} onPress={handleAssign}>
              <UserPlus size={14} color="#FFF" />
              <Text style={s.selActText}>{t.rooms.assign}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.selDepartBtn, selectedOccupied === 0 && s.selBtnOff]}
              onPress={handleDeparture}
              disabled={selectedOccupied === 0}
            >
              <DoorOpen size={14} color="#FFF" />
              <Text style={s.selActText}>{t.rooms.departure}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {viewMode === 'plan' ? (
        <FlatList
          data={groupedByFloor}
          keyExtractor={(item) => `floor-${item.floor}`}
          renderItem={renderFloorSection}
          contentContainerStyle={s.planContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<StaffForecastCard />}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={s.emptyIcon}>🏨</Text>
              <Text style={[s.emptyTitle, { color: d.textSec }]}>{t.rooms.noRoomFound}</Text>
            </View>
          }
        />
      ) : (
        <View style={s.tableWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true} style={s.tableScrollH}>
            <View style={s.tableInner}>
              <View style={[tbl.headerWrap, { backgroundColor: d.tableHeaderBg }]}>
                <View style={tbl.headerRow}>
                  <View style={tbl.checkCell}><Text style={[tbl.hText, { color: d.tableHeaderText }]}>✓</Text></View>
                  <View style={tbl.chambreCell}><Text style={[tbl.hText, { color: d.tableHeaderText }]}>CHAMBRE</Text></View>
                  <View style={tbl.cleanlinessCell}><Text style={[tbl.hText, { color: d.tableHeaderText }]}>STATUT</Text></View>
                  <View style={tbl.clientCell}><Text style={[tbl.hText, { color: d.tableHeaderText }]}>CLIENT</Text></View>
                  <View style={tbl.paxCell}><Text style={[tbl.hText, { color: d.tableHeaderText }]}>PAX</Text></View>
                  <View style={tbl.dateCell}><Text style={[tbl.hText, { color: d.tableHeaderText }]}>ARRIVÉE</Text></View>
                  <View style={tbl.dateCell}><Text style={[tbl.hText, { color: d.tableHeaderText }]}>DÉPART</Text></View>
                  <View style={tbl.etaArrivalCell}><Text style={[tbl.hText, { color: d.tableHeaderText }]}>ETA</Text></View>
                  <View style={tbl.sourceCell}><Text style={[tbl.hText, { color: d.tableHeaderText }]}>SOURCE</Text></View>
                  <View style={tbl.hkCell}><Text style={[tbl.hText, { color: d.tableHeaderText }]}>HOUSEKEEPING</Text></View>
                  <View style={tbl.gouvCell}><Text style={[tbl.hText, { color: d.tableHeaderText }]}>GOUVERNANTE</Text></View>
                  <View style={tbl.assignCell}><Text style={[tbl.hText, { color: d.tableHeaderText }]}>ASSIGNÉE</Text></View>
                  <View style={tbl.viewSdbCell}><Text style={[tbl.hText, { color: d.tableHeaderText }]}>VUE / SDB</Text></View>
                  <View style={tbl.pdjCell}><Text style={[tbl.hText, { color: d.tableHeaderText }]}>PDJ</Text></View>
                  <View style={tbl.etaCell}><Text style={[tbl.hText, { color: d.tableHeaderText }]}>TEMPS</Text></View>
                  <View style={tbl.actionsCell}><Text style={[tbl.hText, { color: d.tableHeaderText }]}>ACTIONS</Text></View>
                </View>
              </View>
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={renderTableRow}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={
                  <View style={s.emptyWrap}>
                    <Text style={s.emptyIcon}>🏨</Text>
                    <Text style={s.emptyTitle}>{t.rooms.noRoomFound}</Text>
                  </View>
                }
              />
            </View>
          </ScrollView>
        </View>
      )}

      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <TouchableOpacity style={mod.overlay} activeOpacity={1} onPress={() => setEditModalVisible(false)}>
          <TouchableOpacity style={[mod.card, { backgroundColor: d.surface }]} activeOpacity={1} onPress={() => {}}>
            <View style={mod.topBar}>
              <View>
                <Text style={[mod.title, { color: d.text }]}>Modifier le client</Text>
                <Text style={[mod.subtitle, { color: d.textMuted }]}>Chambre {editingRoom?.roomNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={mod.closeBtn}>
                <X size={18} color={d.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[mod.label, { color: d.textSec }]}>Nom du client</Text>
            <TextInput
              style={[mod.input, { backgroundColor: d.surfaceWarm, borderColor: d.border, color: d.text }]}
              value={editGuestName}
              onChangeText={setEditGuestName}
              placeholder="Nom du client"
              placeholderTextColor={d.textMuted}
              testID="edit-guest-name"
            />

            <View style={mod.dateRow}>
              <View style={mod.dateField}>
                <Text style={[mod.label, { color: d.textSec }]}>Arrivée</Text>
                <TouchableOpacity
                  style={[mod.input, mod.dateBtn, { backgroundColor: d.surfaceWarm, borderColor: d.border }, calendarField === 'checkIn' && { borderColor: d.accent, backgroundColor: d.accentSoft }]}
                  onPress={() => {
                    setCalendarField(calendarField === 'checkIn' ? null : 'checkIn');
                    if (editCheckIn) { try { setCalendarMonth(new Date(editCheckIn)); } catch { /* */ } }
                  }}
                  testID="edit-check-in"
                >
                  <Text style={[mod.dateBtnText, { color: d.text }, !editCheckIn && { color: d.textMuted }]}>
                    {editCheckIn ? formatShortDate(editCheckIn) : 'Sélectionner'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={mod.dateField}>
                <Text style={[mod.label, { color: d.textSec }]}>Départ</Text>
                <TouchableOpacity
                  style={[mod.input, mod.dateBtn, { backgroundColor: d.surfaceWarm, borderColor: d.border }, calendarField === 'checkOut' && { borderColor: d.accent, backgroundColor: d.accentSoft }]}
                  onPress={() => {
                    setCalendarField(calendarField === 'checkOut' ? null : 'checkOut');
                    if (editCheckOut) { try { setCalendarMonth(new Date(editCheckOut)); } catch { /* */ } }
                  }}
                  testID="edit-check-out"
                >
                  <Text style={[mod.dateBtnText, { color: d.text }, !editCheckOut && { color: d.textMuted }]}>
                    {editCheckOut ? formatShortDate(editCheckOut) : 'Sélectionner'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {calendarField && (
              <View style={mod.calWrap}>
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

            <TouchableOpacity style={[mod.moveToggle, { backgroundColor: d.accentSoft, borderColor: isDarkMode ? 'rgba(107,131,242,0.18)' : 'rgba(79,107,237,0.12)' }]} onPress={() => setShowMoveRoomPicker(!showMoveRoomPicker)}>
              <Text style={[mod.moveText, { color: d.accent }]}>Déplacer vers une autre chambre</Text>
              <ChevronDown size={14} color={d.accent} />
            </TouchableOpacity>

            {showMoveRoomPicker && (
              <ScrollView style={[mod.roomScroll, { borderColor: d.border, backgroundColor: d.surfaceWarm }]} nestedScrollEnabled>
                {freeRooms.length > 0 ? freeRooms.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[mod.roomOpt, moveToRoomId === r.id && mod.roomOptActive]}
                    onPress={() => setMoveToRoomId(moveToRoomId === r.id ? null : r.id)}
                  >
                    <Text style={[mod.roomOptText, { color: d.text }, moveToRoomId === r.id && { color: d.accent }]}>
                      {r.roomNumber} — {r.roomType}
                    </Text>
                  </TouchableOpacity>
                )) : (
                  <Text style={mod.noRooms}>Aucune chambre libre</Text>
                )}
              </ScrollView>
            )}

            <View style={mod.actionRow}>
              <TouchableOpacity style={[mod.saveBtn, { backgroundColor: d.accent }]} onPress={handleSaveClient}>
                <Text style={mod.saveBtnText}>Enregistrer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[mod.cancelBtn, { borderColor: d.border }]} onPress={() => setEditModalVisible(false)}>
                <Text style={[mod.cancelBtnText, { color: d.textSec }]}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={sourceDropdownRoomId !== null} transparent animationType="fade" onRequestClose={() => setSourceDropdownRoomId(null)}>
        <TouchableOpacity style={srcMod.overlay} activeOpacity={1} onPress={() => setSourceDropdownRoomId(null)}>
          <TouchableOpacity style={[srcMod.card, { backgroundColor: d.surface }]} activeOpacity={1} onPress={() => {}}>
            <View style={[srcMod.header, { borderBottomColor: d.borderLight }]}>
              <Text style={[srcMod.headerTitle, { color: d.text }]}>Sélectionner la source</Text>
              <TouchableOpacity onPress={() => setSourceDropdownRoomId(null)} style={srcMod.closeBtn}>
                <X size={18} color={d.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={srcMod.list} nestedScrollEnabled>
              {ALL_BOOKING_SOURCES.map((src) => {
                const sc = BOOKING_SOURCE_CONFIG[src];
                const cc = CHANNEL_TYPE_CONFIG[sc.channelType];
                const currentRoom = sourceDropdownRoomId ? rooms.find((r) => r.id === sourceDropdownRoomId) : null;
                const isActive = currentRoom?.bookingSource === src;
                return (
                  <TouchableOpacity
                    key={src}
                    style={[srcMod.item, { borderBottomColor: d.borderLight }, isActive && { backgroundColor: d.accentSoft }]}
                    onPress={() => {
                      if (sourceDropdownRoomId) {
                        updateRoom({ roomId: sourceDropdownRoomId, updates: { bookingSource: src } });
                      }
                      setSourceDropdownRoomId(null);
                      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <View style={[srcMod.logo, { backgroundColor: sc.color }]}>
                      <Text style={srcMod.logoText}>{sc.icon}</Text>
                    </View>
                    <Text style={[srcMod.label, { color: d.textSec }, isActive && { fontWeight: '700' as const, color: d.text }]} numberOfLines={1}>{sc.label}</Text>
                    <View style={[srcMod.tag, { backgroundColor: cc.bgColor }]}>
                      <Text style={[srcMod.tagText, { color: cc.color }]}>{sc.hasCommission ? 'OTA' : cc.label}</Text>
                    </View>
                    {isActive && <Check size={14} color={d.accent} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={cleanlinessModalRoomId !== null} transparent animationType="fade" onRequestClose={() => setCleanlinessModalRoomId(null)}>
        <TouchableOpacity style={clnMod.overlay} activeOpacity={1} onPress={() => setCleanlinessModalRoomId(null)}>
          <TouchableOpacity style={[clnMod.card, { backgroundColor: d.surface }]} activeOpacity={1} onPress={() => {}}>
            <View style={[clnMod.header, { borderBottomColor: d.borderLight }]}>
              <Text style={[clnMod.headerTitle, { color: d.text }]}>Statut chambre</Text>
              <TouchableOpacity onPress={() => setCleanlinessModalRoomId(null)} style={clnMod.closeBtn}>
                <X size={18} color={d.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={clnMod.list}>
              {(['propre', 'en_nettoyage', 'sale', 'inspectee'] as const).map((status) => {
                const cfg = ROOM_CLEANLINESS_CONFIG[status];
                const currentRoom = cleanlinessModalRoomId ? rooms.find((r) => r.id === cleanlinessModalRoomId) : null;
                const isActive = (currentRoom?.cleanlinessStatus ?? 'sale') === status;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[clnMod.item, { borderBottomColor: d.borderLight }, isActive && { backgroundColor: d.accentSoft }]}
                    onPress={() => {
                      if (cleanlinessModalRoomId) {
                        updateRoom({ roomId: cleanlinessModalRoomId, updates: { cleanlinessStatus: status } });
                        console.log('[Reception] Updated cleanliness status for room', cleanlinessModalRoomId, 'to', status);
                      }
                      setCleanlinessModalRoomId(null);
                      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <View style={[clnMod.iconCircle, { backgroundColor: cfg.color + '18' }]}>
                      <Text style={clnMod.iconText}>{cfg.icon}</Text>
                    </View>
                    <Text style={[clnMod.label, { color: d.textSec }, isActive && { fontWeight: '700' as const, color: d.text }]}>{cfg.label}</Text>
                    {isActive && <Check size={16} color={d.accent} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={etaModalRoomId !== null} transparent animationType="fade" onRequestClose={() => setEtaModalRoomId(null)}>
        <TouchableOpacity style={etaMod.overlay} activeOpacity={1} onPress={() => setEtaModalRoomId(null)}>
          <TouchableOpacity style={[etaMod.card, { backgroundColor: d.surface }]} activeOpacity={1} onPress={() => {}}>
            <View style={[etaMod.header, { borderBottomColor: d.borderLight }]}>
              <View>
                <Text style={[etaMod.headerTitle, { color: d.text }]}>Heure d'arrivée (ETA)</Text>
                <Text style={[etaMod.headerSub, { color: d.textMuted }]}>
                  {etaModalRoomId ? `Chambre ${rooms.find((r) => r.id === etaModalRoomId)?.roomNumber ?? ''}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEtaModalRoomId(null)} style={etaMod.closeBtn}>
                <X size={18} color={d.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={etaMod.body}>
              <Text style={[etaMod.sectionLabel, { color: d.textSec }]}>Raccourcis</Text>
              <View style={etaMod.presetsRow}>
                {[
                  { label: 'Early arrival', value: 'Early arrival', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
                  { label: 'Late check-in', value: 'Late check-in', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
                  { label: 'Late check-out', value: 'Late check-out', color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
                ].map((preset) => (
                  <TouchableOpacity
                    key={preset.value}
                    style={[etaMod.presetChip, { backgroundColor: preset.bg, borderColor: preset.color + '30' }]}
                    onPress={() => {
                      if (etaModalRoomId) {
                        updateRoom({ roomId: etaModalRoomId, updates: { etaArrival: preset.value } });
                        console.log('[Reception] Set ETA preset for room', etaModalRoomId, ':', preset.value);
                      }
                      setEtaModalRoomId(null);
                      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[etaMod.presetText, { color: preset.color }]}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[etaMod.sectionLabel, { color: d.textSec, marginTop: 16 }]}>Horaires rapides</Text>
              <View style={etaMod.timesGrid}>
                {['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'].map((time) => {
                  const currentRoom = etaModalRoomId ? rooms.find((r) => r.id === etaModalRoomId) : null;
                  const isActive = currentRoom?.etaArrival === time;
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[etaMod.timeChip, { backgroundColor: d.surfaceWarm, borderColor: d.border }, isActive && { backgroundColor: d.accent, borderColor: d.accent }]}
                      onPress={() => {
                        if (etaModalRoomId) {
                          updateRoom({ roomId: etaModalRoomId, updates: { etaArrival: time } });
                          console.log('[Reception] Set ETA time for room', etaModalRoomId, ':', time);
                        }
                        setEtaModalRoomId(null);
                        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={[etaMod.timeText, { color: d.textSec }, isActive && { color: '#FFF', fontWeight: '700' as const }]}>{time}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[etaMod.sectionLabel, { color: d.textSec, marginTop: 16 }]}>Horaire personnalisé</Text>
              <View style={etaMod.customRow}>
                <TextInput
                  style={[etaMod.customInput, { backgroundColor: d.surfaceWarm, borderColor: d.border, color: d.text }]}
                  value={etaCustomTime}
                  onChangeText={setEtaCustomTime}
                  placeholder="Ex: 15:30"
                  placeholderTextColor={d.textMuted}
                  testID="eta-custom-input"
                />
                <TouchableOpacity
                  style={[etaMod.customBtn, { backgroundColor: d.accent }]}
                  onPress={() => {
                    if (etaModalRoomId && etaCustomTime.trim()) {
                      updateRoom({ roomId: etaModalRoomId, updates: { etaArrival: etaCustomTime.trim() } });
                      console.log('[Reception] Set custom ETA for room', etaModalRoomId, ':', etaCustomTime.trim());
                    }
                    setEtaModalRoomId(null);
                    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                >
                  <Check size={16} color="#FFF" />
                </TouchableOpacity>
              </View>

              {(() => {
                const currentRoom = etaModalRoomId ? rooms.find((r) => r.id === etaModalRoomId) : null;
                if (!currentRoom?.etaArrival) return null;
                return (
                  <TouchableOpacity
                    style={[etaMod.clearBtn, { borderColor: d.danger + '30' }]}
                    onPress={() => {
                      if (etaModalRoomId) {
                        updateRoom({ roomId: etaModalRoomId, updates: { etaArrival: null } });
                        console.log('[Reception] Cleared ETA for room', etaModalRoomId);
                      }
                      setEtaModalRoomId(null);
                      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <X size={14} color={d.danger} />
                    <Text style={[etaMod.clearText, { color: d.danger }]}>Supprimer l'ETA</Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showImportModal} transparent animationType="fade" onRequestClose={() => setShowImportModal(false)}>
        <TouchableOpacity style={impMod.overlay} activeOpacity={1} onPress={() => setShowImportModal(false)}>
          <TouchableOpacity style={[impMod.card, { backgroundColor: d.surface }]} activeOpacity={1} onPress={() => {}}>
            <View style={[impMod.headerBg, { backgroundColor: d.headerBg }]}>
              <View style={impMod.headerRow}>
                <View>
                  <Text style={impMod.headerTag}>IMPORT CLIENTS</Text>
                  <Text style={impMod.headerTitle}>Import intelligent par IA</Text>
                </View>
                <TouchableOpacity onPress={() => setShowImportModal(false)} style={impMod.closeBtnImp}>
                  <X size={20} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={impMod.body}>
              <Text style={[impMod.desc, { color: d.textSec }]}>
                {"Importez vos données clients depuis "}
                <Text style={[impMod.descBold, { color: d.text }]}>{"n'importe quel format"}</Text>
                {". L'IA extrait et normalise automatiquement les données."}
              </Text>

              <View style={impMod.modeRow}>
                {([
                  { key: 'csv' as const, label: 'CSV / TXT', color: d.accent },
                  { key: 'excel' as const, label: 'Excel', color: '#10B981' },
                  { key: 'pdf' as const, label: 'PDF', color: '#EF4444' },
                  { key: 'image' as const, label: 'Image', color: '#F59E0B' },
                ] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[impMod.modeChip, { borderColor: d.border, backgroundColor: d.surfaceWarm }, importMode === opt.key && { borderColor: opt.color, backgroundColor: opt.color + '12' }]}
                    onPress={() => setImportMode(opt.key)}
                    activeOpacity={0.7}
                  >
                    <FileText size={14} color={importMode === opt.key ? opt.color : d.textMuted} />
                    <Text style={[impMod.modeText, { color: d.textSec }, importMode === opt.key && { color: opt.color, fontWeight: '700' as const }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[impMod.dropzone, { borderColor: d.border, backgroundColor: d.surfaceWarm }]} onPress={handleImportFile} activeOpacity={0.7} testID="import-dropzone">
                <View style={[impMod.dropzoneIcon, { backgroundColor: d.surface, borderColor: d.border }]}>
                  <Upload size={24} color={d.textMuted} />
                </View>
                <Text style={[impMod.dropzoneTitle, { color: d.text }]}>Glissez votre fichier ici</Text>
                <Text style={[impMod.dropzoneDesc, { color: d.textMuted }]}>CSV · Excel · PDF · Image — ou cliquez</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[impMod.templateBtn, { borderColor: d.border, backgroundColor: d.surface }]} onPress={handleDownloadTemplate} activeOpacity={0.7}>
                <Download size={14} color={d.textSec} />
                <Text style={[impMod.templateText, { color: d.textSec }]}>Modèle CSV</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const ftStyles = StyleSheet.create({
  roomChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60 },
  roomChipSelected: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },
  roomCheck: { width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.35)', justifyContent: 'center', alignItems: 'center' },
  roomCheckText: { fontSize: 9, color: '#FFF', fontWeight: '700' as const },
  roomNum: { fontSize: 15, fontWeight: '700' as const, color: '#FFF' },
  roomBadge: { fontSize: 10 },
  roomCleanIcon: { fontSize: 10 },
  roomAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginLeft: 2 },
  roomAvatarText: { fontSize: 8, fontWeight: '700' as const, color: '#FFF' },
});

const TABLE_W = 1700;

const tbl = StyleSheet.create({
  headerWrap: { backgroundColor: '#0F172A', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, minWidth: TABLE_W },
  hText: { fontSize: 10, fontWeight: '600' as const, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.8, textTransform: 'uppercase' as const },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, minHeight: 62, minWidth: TABLE_W, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  rowEven: { backgroundColor: '#FFFFFF' },
  rowOdd: { backgroundColor: '#FAFBFD' },
  rowSelected: { backgroundColor: 'rgba(79,107,237,0.06)', borderBottomColor: 'rgba(79,107,237,0.12)' },
  checkCell: { width: 48, alignItems: 'center' as const, justifyContent: 'center' as const, paddingLeft: 14 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#D1D5DB', justifyContent: 'center' as const, alignItems: 'center' as const, backgroundColor: '#FFF' },
  checkboxActive: { backgroundColor: DS.accent, borderColor: DS.accent },
  chambreCell: { width: 160, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingHorizontal: 10 },
  roomBadge: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center' as const, alignItems: 'center' as const },
  roomBadgeText: { fontSize: 14, fontWeight: '800' as const, color: '#FFF' },
  roomMeta: { flexShrink: 1 },
  roomTypeLabel: { fontSize: 13, fontWeight: '600' as const, color: DS.text },
  roomSubLabel: { fontSize: 10, color: DS.textMuted, marginTop: 2 },
  cleanlinessCell: { width: 115, paddingHorizontal: 8, justifyContent: 'center' as const },
  softBadge: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start' as const },
  softBadgeIcon: { fontSize: 10 },
  softBadgeLabel: { fontSize: 11, fontWeight: '600' as const },
  hkDot: { width: 6, height: 6, borderRadius: 3 },
  clientCell: { width: 190, paddingHorizontal: 10, justifyContent: 'center' as const },
  clientContent: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  clientRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, flexShrink: 1 },
  clientName: { fontSize: 13, fontWeight: '600' as const, color: DS.text, flexShrink: 1 },
  vipTag: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  vipTagText: { fontSize: 8, fontWeight: '800' as const, color: '#D97706' },
  clientEmptyWrap: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  clientEmptyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: DS.textLight },
  clientEmptyText: { fontSize: 12, color: DS.textMuted },
  clientAddBtn: { color: DS.accent, fontWeight: '600' as const, fontSize: 11 },
  paxCell: { width: 70, paddingHorizontal: 8, justifyContent: 'center' as const },
  paxText: { fontSize: 12, fontWeight: '500' as const, color: DS.textSec },
  dateCell: { width: 90, paddingHorizontal: 8, justifyContent: 'center' as const },
  dateIn: { fontSize: 12, fontWeight: '600' as const, color: '#3B82F6' },
  dateOut: { fontSize: 12, fontWeight: '600' as const, color: '#EF4444' },
  dash: { fontSize: 12, color: DS.textLight },
  etaArrivalCell: { width: 90, paddingHorizontal: 8, justifyContent: 'center' as const },
  etaArrivalPill: { backgroundColor: DS.accentSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' as const, flexDirection: 'row' as const, alignItems: 'center' as const },
  etaArrivalText: { fontSize: 11, fontWeight: '600' as const, color: DS.accent },
  etaArrivalEmpty: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed' as const, alignSelf: 'flex-start' as const, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  etaArrivalEmptyText: { fontSize: 10, fontWeight: '500' as const },
  sourceCell: { width: 125, paddingHorizontal: 8, justifyContent: 'center' as const, overflow: 'visible' as const, zIndex: 50 },
  sourceWrap: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 7 },
  sourceDot: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center' as const, alignItems: 'center' as const },
  sourceDotText: { fontSize: 11, fontWeight: '800' as const, color: '#FFF' },
  sourceInfo: { flexShrink: 1, gap: 2 },
  sourceLabel: { fontSize: 11, fontWeight: '700' as const },
  channelPill: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, alignSelf: 'flex-start' as const },
  channelPillText: { fontSize: 8, fontWeight: '700' as const, letterSpacing: 0.3 },
  sourceEmpty: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed' as const, borderColor: DS.textLight, alignSelf: 'flex-start' as const },
  sourceEmptyText: { fontSize: 11, fontWeight: '500' as const, color: DS.textMuted },
  hkCell: { width: 130, paddingHorizontal: 8, justifyContent: 'center' as const },
  gouvCell: { width: 110, paddingHorizontal: 8, justifyContent: 'center' as const },
  assignCell: { width: 145, paddingHorizontal: 8, justifyContent: 'center' as const },
  assignWrap: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  assignAvatar: { width: 28, height: 28, borderRadius: 10, backgroundColor: DS.accent, justifyContent: 'center' as const, alignItems: 'center' as const },
  assignAvatarText: { fontSize: 10, fontWeight: '700' as const, color: '#FFF' },
  assignName: { fontSize: 12, color: DS.textSec, flexShrink: 1, fontWeight: '500' as const },
  viewSdbCell: { width: 100, paddingHorizontal: 8, justifyContent: 'center' as const },
  viewText: { fontSize: 12, fontWeight: '600' as const, color: DS.text },
  sdbText: { fontSize: 10, color: DS.textMuted, marginTop: 2 },
  pdjCell: { width: 74, alignItems: 'center' as const, justifyContent: 'center' as const },
  etaCell: { width: 64, alignItems: 'center' as const, justifyContent: 'center' as const },
  etaPill: { backgroundColor: DS.infoSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  etaPillText: { fontSize: 11, fontWeight: '700' as const, color: DS.info },
  actionsCell: { width: 120, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6, paddingRight: 14 },
  actionBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: DS.surfaceWarm, borderWidth: 1, borderColor: DS.border, justifyContent: 'center' as const, alignItems: 'center' as const },
  actionBtnDanger: { backgroundColor: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.15)' },
  actionBtnStar: { backgroundColor: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' },
});

const mod = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: DS.surface, borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 5 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '700' as const, color: DS.text },
  subtitle: { fontSize: 13, color: DS.textMuted, marginTop: 3 },
  closeBtn: { padding: 6 },
  label: { fontSize: 12, fontWeight: '600' as const, color: DS.textSec, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: DS.surfaceWarm, borderWidth: 1, borderColor: DS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: DS.text },
  dateRow: { flexDirection: 'row', gap: 14 },
  dateField: { flex: 1 },
  dateBtn: { justifyContent: 'center' as const },
  dateBtnActive: { borderColor: DS.accent, backgroundColor: DS.accentSoft },
  dateBtnText: { fontSize: 14, color: DS.text },
  calWrap: { marginTop: 4 },
  moveToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: DS.accentSoft, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(79,107,237,0.12)' },
  moveText: { fontSize: 13, fontWeight: '600' as const, color: DS.accent },
  roomScroll: { maxHeight: 150, marginTop: 8, borderWidth: 1, borderColor: DS.border, borderRadius: 12, backgroundColor: DS.surfaceWarm },
  roomOpt: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: DS.borderLight },
  roomOptActive: { backgroundColor: DS.accentSoft },
  roomOptText: { fontSize: 13, color: DS.text },
  roomOptTextActive: { color: DS.accent, fontWeight: '600' as const },
  noRooms: { fontSize: 12, color: DS.textMuted, padding: 16, textAlign: 'center' as const },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 28 },
  saveBtn: { flex: 1, backgroundColor: DS.accent, paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700' as const, color: '#FFF' },
  cancelBtn: { paddingVertical: 15, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: DS.border },
  cancelBtnText: { fontSize: 14, fontWeight: '600' as const, color: DS.textSec },
});

const srcMod = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#FFF', borderRadius: 20, width: '100%', maxWidth: 360, overflow: 'hidden' as const, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 5 },
  header: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingHorizontal: 22, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: DS.borderLight },
  headerTitle: { fontSize: 17, fontWeight: '700' as const, color: DS.text },
  closeBtn: { padding: 4 },
  list: { maxHeight: 420 },
  item: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingHorizontal: 22, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: DS.borderLight },
  itemActive: { backgroundColor: DS.accentSoft },
  logo: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center' as const, alignItems: 'center' as const },
  logoText: { fontSize: 12, fontWeight: '800' as const, color: '#FFF' },
  label: { flex: 1, fontSize: 14, fontWeight: '500' as const, color: DS.textSec },
  labelActive: { fontWeight: '700' as const, color: DS.text },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  tagText: { fontSize: 9, fontWeight: '700' as const },
});

const clnMod = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { borderRadius: 20, width: '100%', maxWidth: 340, overflow: 'hidden' as const, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 5 },
  header: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingHorizontal: 22, paddingVertical: 18, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700' as const },
  closeBtn: { padding: 4 },
  list: { paddingVertical: 4 },
  item: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 14, paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1 },
  iconCircle: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center' as const, alignItems: 'center' as const },
  iconText: { fontSize: 14 },
  label: { flex: 1, fontSize: 15, fontWeight: '500' as const },
});

const etaMod = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { borderRadius: 20, width: '100%', maxWidth: 400, overflow: 'hidden' as const, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 5 },
  header: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingHorizontal: 22, paddingVertical: 18, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700' as const },
  headerSub: { fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 4 },
  body: { padding: 22 },
  sectionLabel: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const, marginBottom: 10 },
  presetsRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  presetChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  presetText: { fontSize: 13, fontWeight: '600' as const },
  timesGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  timeChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, minWidth: 64, alignItems: 'center' as const },
  timeText: { fontSize: 13, fontWeight: '500' as const },
  customRow: { flexDirection: 'row' as const, gap: 10, alignItems: 'center' as const },
  customInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 },
  customBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center' as const, alignItems: 'center' as const },
  clearBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6, marginTop: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  clearText: { fontSize: 13, fontWeight: '600' as const },
});

const impMod = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: DS.surface, borderRadius: 24, width: '100%', maxWidth: 500, overflow: 'hidden' as const, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 5 },
  headerBg: { backgroundColor: DS.headerBg, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTag: { fontSize: 10, fontWeight: '700' as const, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' as const },
  headerTitle: { fontSize: 22, fontWeight: '800' as const, color: '#FFF', marginTop: 6 },
  closeBtnImp: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  body: { padding: 28, gap: 20 },
  desc: { fontSize: 14, color: DS.textSec, lineHeight: 22 },
  descBold: { fontWeight: '700' as const, color: DS.text },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modeChip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: DS.border, backgroundColor: DS.surfaceWarm },
  modeText: { fontSize: 13, fontWeight: '500' as const, color: DS.textSec },
  dropzone: { borderWidth: 2, borderColor: DS.border, borderStyle: 'dashed' as const, borderRadius: 18, paddingVertical: 36, alignItems: 'center', gap: 10, backgroundColor: DS.surfaceWarm },
  dropzoneIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: DS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: DS.border },
  dropzoneTitle: { fontSize: 16, fontWeight: '700' as const, color: DS.text },
  dropzoneDesc: { fontSize: 12, color: DS.textMuted },
  templateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: DS.border, backgroundColor: DS.surface },
  templateText: { fontSize: 13, fontWeight: '600' as const, color: DS.textSec },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.bg },
  loadingWrap: { flex: 1, backgroundColor: DS.bg, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: DS.textSec, fontSize: 14 },

  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  billingBtn: { position: 'relative', padding: 4 },
  billingBadge: { position: 'absolute', top: -3, right: -5, backgroundColor: '#F59E0B', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  billingBadgeText: { fontSize: 9, fontWeight: '700' as const, color: '#FFF' },
  csvBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' },
  csvBtnText: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500' as const },
  importBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: DS.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  importBtnText: { fontSize: 12, fontWeight: '700' as const, color: '#FFF' },

  navStripSection: { backgroundColor: DS.surface, borderBottomWidth: 1, borderBottomColor: DS.borderLight, paddingVertical: 10 },
  navStripScroll: { paddingHorizontal: 16, gap: 10 },
  navStripItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: DS.border, backgroundColor: DS.surfaceWarm },
  navStripIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  navStripLabel: { fontSize: 13, fontWeight: '600' as const, color: DS.text },

  kpiSection: { backgroundColor: DS.surface, borderBottomWidth: 1, borderBottomColor: DS.borderLight, paddingVertical: 12 },
  kpiScroll: { paddingHorizontal: 16, gap: 10 },
  kpiCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: DS.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: DS.borderLight, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  kpiIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  kpiTextBlock: {},
  kpiValue: { fontSize: 20, fontWeight: '800' as const },
  kpiLabel: { fontSize: 10, fontWeight: '500' as const, color: DS.textMuted, marginTop: 1 },

  toolbar: { backgroundColor: DS.surface, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: DS.borderLight },
  toolbarTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: DS.surfaceWarm, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 8, borderWidth: 1, borderColor: DS.border, width: 190 },
  searchInput: { flex: 1, fontSize: 13, color: DS.text, padding: 0 },
  pillsWrap: { flex: 1 },
  pillsScroll: { gap: 6, paddingRight: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: DS.surfaceWarm, borderWidth: 1, borderColor: DS.border },
  pillActive: { borderColor: DS.accent, backgroundColor: DS.accentSoft },
  pillText: { fontSize: 12, fontWeight: '500' as const, color: DS.textSec },
  pillTextActive: { color: DS.accent, fontWeight: '600' as const },
  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewSwitch: { flexDirection: 'row', backgroundColor: DS.surfaceWarm, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: DS.border },
  viewBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  viewBtnActive: { backgroundColor: DS.accent },
  counterText: { fontSize: 12, color: DS.textMuted, fontWeight: '600' as const },
  kpiToggle: { width: 34, height: 34, borderRadius: 10, backgroundColor: DS.surfaceWarm, borderWidth: 1, borderColor: DS.border, justifyContent: 'center', alignItems: 'center' },

  dropdown: { position: 'absolute', top: 200, left: 16, right: 16, backgroundColor: DS.surface, borderRadius: 14, borderWidth: 1, borderColor: DS.border, zIndex: 100, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 10 },
  dropItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: DS.borderLight, gap: 10 },
  dropItemActive: { backgroundColor: DS.accentSoft },
  dropText: { fontSize: 14, color: DS.text, fontWeight: '500' as const },
  dropTextActive: { color: DS.accent, fontWeight: '600' as const },
  dropDot: { width: 8, height: 8, borderRadius: 4 },

  moreMenu: { backgroundColor: DS.surface, position: 'absolute', top: 54, right: 16, zIndex: 200, borderRadius: 14, borderWidth: 1, borderColor: DS.border, paddingVertical: 6, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 10 },
  moreItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14 },
  moreIcon: { fontSize: 16 },
  moreText: { fontSize: 14, color: DS.text, fontWeight: '500' as const },

  selBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: DS.accentSoft, borderBottomWidth: 1, borderBottomColor: 'rgba(79,107,237,0.1)' },
  selLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selBadge: { backgroundColor: DS.accent, width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  selBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' as const },
  selLabel: { fontSize: 13, fontWeight: '600' as const, color: DS.accent },
  selClear: { padding: 4, marginLeft: 4 },
  selActions: { flexDirection: 'row', gap: 8 },
  selAssignBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, gap: 6, backgroundColor: DS.accent },
  selDepartBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, gap: 6, backgroundColor: '#EF4444' },
  selBtnOff: { opacity: 0.35 },
  selActText: { color: '#FFF', fontSize: 12, fontWeight: '600' as const },

  planContent: { padding: 16, paddingBottom: 100, gap: 12 },
  tableWrap: { flex: 1 },
  tableScrollH: { flex: 1 },
  tableInner: { flex: 1, minWidth: TABLE_W },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600' as const, color: DS.textSec },
});
