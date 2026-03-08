import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { DoorOpen, UserPlus, X, ChevronDown, Coffee, Filter, MoreHorizontal, List, LayoutGrid, Eye } from 'lucide-react-native';
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

const SWIPE_THRESHOLD = 30;

interface BreakfastSwipeToggleProps {
  included: boolean;
  onToggle: (newValue: boolean) => void;
  includedLabel: string;
  notIncludedLabel: string;
}

const BreakfastSwipeToggle = React.memo(function BreakfastSwipeToggle({
  included,
  onToggle,
  includedLabel,
  notIncludedLabel,
}: BreakfastSwipeToggleProps) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_: GestureResponderEvent, gs: PanResponderGestureState) =>
        Math.abs(gs.dx) > 5 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderGrant: () => {
        translateX.setValue(0);
      },
      onPanResponderMove: (_: GestureResponderEvent, gs: PanResponderGestureState) => {
        const clamped = Math.max(-40, Math.min(40, gs.dx));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_: GestureResponderEvent, gs: PanResponderGestureState) => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }).start();

        if (gs.dx > SWIPE_THRESHOLD && !included) {
          onToggle(true);
        } else if (gs.dx < -SWIPE_THRESHOLD && included) {
          onToggle(false);
        }
      },
    })
  ).current;

  const handleTap = useCallback(() => {
    onToggle(!included);
  }, [included, onToggle]);

  const bgColor = included ? FT.success : FT.danger;
  const bgSoft = included ? FT.successSoft : FT.dangerSoft;
  const label = included ? includedLabel : notIncludedLabel;

  return (
    <View style={pdjToggleStyles.cell}>
      <Animated.View
        style={[pdjToggleStyles.track, { backgroundColor: bgSoft }, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={handleTap}
          activeOpacity={0.7}
          style={pdjToggleStyles.touchable}
          testID="pdj-toggle"
        >
          <View style={[pdjToggleStyles.dot, { backgroundColor: bgColor }]} />
          <Text style={[pdjToggleStyles.label, { color: bgColor }]} numberOfLines={1}>
            {label}
          </Text>
        </TouchableOpacity>
      </Animated.View>
      <View style={pdjToggleStyles.hintRow}>
        <Text style={pdjToggleStyles.hintArrowLeft}>◀</Text>
        <Text style={pdjToggleStyles.hintArrowRight}>▶</Text>
      </View>
    </View>
  );
});

const pdjToggleStyles = StyleSheet.create({
  cell: {
    width: 90,
    paddingHorizontal: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  track: {
    borderRadius: 8,
    overflow: 'hidden' as const,
  },
  touchable: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600' as const,
    flexShrink: 1,
  },
  hintRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    width: '100%' as unknown as number,
    paddingHorizontal: 8,
    marginTop: 1,
  },
  hintArrowLeft: {
    fontSize: 6,
    color: FT.textMuted,
    opacity: 0.5,
  },
  hintArrowRight: {
    fontSize: 6,
    color: FT.textMuted,
    opacity: 0.5,
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

  const getCleaningLabel = useCallback((status: string) => {
    switch (status) {
      case 'none': return t.rooms.cleaning;
      case 'en_cours': return t.rooms.inProgress;
      case 'nettoyee': return t.rooms.toValidate;
      case 'validee': return t.rooms.validated;
      case 'refusee': return t.rooms.refused;
      default: return '';
    }
  }, [t.rooms.cleaning, t.rooms.inProgress, t.rooms.toValidate, t.rooms.validated, t.rooms.refused]);

  const handleToggleBreakfast = useCallback((roomId: string, newValue: boolean) => {
    console.log('[Reception] Toggle breakfast for room', roomId, 'to', newValue);
    updateRoom({ roomId, updates: { breakfastIncluded: newValue } });
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [updateRoom]);

  const renderTableRow = useCallback(({ item: room }: { item: Room }) => {
    const isSelected = selectedRoomIds.has(room.id);
    const statusConfig = ROOM_STATUS_CONFIG[room.status];
    const cleanConfig = CLEANING_STATUS_CONFIG[room.cleaningStatus];
    const assignee = room.cleaningAssignee ?? '-';
    const pdjIncluded = room.breakfastIncluded;

    return (
      <TouchableOpacity
        style={[tableStyles.row, isSelected && tableStyles.rowSelected]}
        onPress={() => handleRoomPress(room)}
        onLongPress={() => {
          toggleRoomSelection(room.id);
          if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        activeOpacity={0.7}
        testID={`table-row-${room.roomNumber}`}
      >
        <TouchableOpacity
          style={tableStyles.checkCell}
          onPress={() => {
            toggleRoomSelection(room.id);
            if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={[tableStyles.checkbox, isSelected && tableStyles.checkboxActive]}>
            {isSelected && <Text style={tableStyles.checkMark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <View style={tableStyles.roomCell}>
          <Text style={tableStyles.roomNum}>{room.roomNumber}</Text>
          <Text style={tableStyles.roomType}>{room.roomType}</Text>
          {room.currentReservation && (
            <Text style={tableStyles.roomDates} numberOfLines={1}>
              ↓ {room.currentReservation.checkInDate.slice(5)} ↑ {room.currentReservation.checkOutDate.slice(5)}
            </Text>
          )}
        </View>

        <View style={tableStyles.statusCell}>
          <View style={[tableStyles.statusBadge, { backgroundColor: statusConfig.color }]}>
            <Text style={tableStyles.statusText}>{statusConfig.label}</Text>
          </View>
          {room.clientBadge === 'vip' && <Text style={tableStyles.badgeIcon}>⭐</Text>}
          {room.clientBadge === 'prioritaire' && <Text style={tableStyles.badgeIcon}>⚡</Text>}
        </View>

        <View style={tableStyles.cleanCell}>
          {room.cleaningStatus !== 'none' ? (
            <View style={[tableStyles.cleanBadge, { backgroundColor: cleanConfig.color + '18' }]}>
              <Text style={[tableStyles.cleanText, { color: cleanConfig.color }]}>
                {getCleaningLabel(room.cleaningStatus)}
              </Text>
            </View>
          ) : (
            <Text style={tableStyles.emptyDash}>-</Text>
          )}
        </View>

        <View style={tableStyles.assignCell}>
          <Text style={tableStyles.assignText} numberOfLines={1}>{assignee}</Text>
        </View>

        <BreakfastSwipeToggle
          included={pdjIncluded}
          onToggle={(val) => handleToggleBreakfast(room.id, val)}
          includedLabel={t.rooms.breakfastIncluded}
          notIncludedLabel={t.rooms.breakfastNotIncluded}
        />

        <View style={tableStyles.actionsCell}>
          <TouchableOpacity onPress={() => handleRoomPress(room)} style={tableStyles.actionBtn}>
            <Eye size={14} color={FT.brand} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [selectedRoomIds, handleRoomPress, toggleRoomSelection, getCleaningLabel, handleToggleBreakfast, t.rooms.breakfastIncluded, t.rooms.breakfastNotIncluded]);

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
            <Text style={styles.moreMenuIcon}>📋</Text>
            <Text style={styles.moreMenuText}>{t.direction.historyLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreMenuItem} onPress={() => { router.push('/breakfast-stats'); setShowMoreMenu(false); }}>
            <Text style={styles.moreMenuIcon}>☕</Text>
            <Text style={styles.moreMenuText}>{t.breakfast.title}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreMenuItem} onPress={() => { router.push('/economat'); setShowMoreMenu(false); }}>
            <Text style={styles.moreMenuIcon}>📦</Text>
            <Text style={styles.moreMenuText}>{t.economat.title}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreMenuItem} onPress={() => { router.push('/import-reservations'); setShowMoreMenu(false); }}>
            <Text style={styles.moreMenuIcon}>📥</Text>
            <Text style={styles.moreMenuText}>{t.fileImport.importReservations}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreMenuItem} onPress={() => { router.push('/settings'); setShowMoreMenu(false); }}>
            <Text style={styles.moreMenuIcon}>⚙️</Text>
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
          <Text style={styles.filterDropText}>🗓 {today}</Text>
        </TouchableOpacity>
        <View style={styles.roomCounter}>
          <Text style={styles.roomCounterText}>🏠 {filtered.length} / {total} {t.rooms.rooms}</Text>
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
              <Text style={styles.emptyIcon}>🏨</Text>
              <Text style={styles.emptyTitle}>{t.rooms.noRoomFound}</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderTableRow}
          contentContainerStyle={styles.tableListContent}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[0]}
          ListHeaderComponent={
            <View style={tableStyles.stickyHeader}>
              <View style={tableStyles.headerRow}>
                <View style={tableStyles.checkCell}>
                  <Text style={tableStyles.headerText}>✓</Text>
                </View>
                <View style={tableStyles.roomCell}>
                  <Text style={tableStyles.headerText}>{t.rooms.room}</Text>
                </View>
                <View style={tableStyles.statusCell}>
                  <Text style={tableStyles.headerText}>{t.rooms.status}</Text>
                </View>
                <View style={tableStyles.cleanCell}>
                  <Text style={tableStyles.headerText}>{t.rooms.cleaning}</Text>
                </View>
                <View style={tableStyles.assignCell}>
                  <Text style={tableStyles.headerText}>{t.rooms.assignmentCol}</Text>
                </View>
                <View style={tableStyles.pdjCell}>
                  <Text style={tableStyles.headerText}>{t.rooms.breakfastCol}</Text>
                </View>
                <View style={tableStyles.actionsCell}>
                  <Text style={tableStyles.headerText}>{t.common.actions}</Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏨</Text>
              <Text style={styles.emptyTitle}>{t.rooms.noRoomFound}</Text>
            </View>
          }
        />
      )}
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
    backgroundColor: FT.surfaceAlt,
    borderBottomWidth: 2,
    borderBottomColor: FT.border,
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
    color: FT.textMuted,
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
  roomCell: { flex: 1.2, minWidth: 80, paddingHorizontal: 4 },
  roomNum: { fontSize: 15, fontWeight: '800' as const, color: FT.text },
  roomType: { fontSize: 10, color: FT.textMuted },
  roomDates: { fontSize: 9, color: FT.textSec, marginTop: 1 },
  statusCell: { flex: 1, minWidth: 70, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: '600' as const, color: '#FFF' },
  badgeIcon: { fontSize: 10 },
  cleanCell: { flex: 1, minWidth: 70, paddingHorizontal: 4 },
  cleanBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' as const },
  cleanText: { fontSize: 9, fontWeight: '600' as const },
  emptyDash: { fontSize: 12, color: FT.textMuted },
  assignCell: { flex: 1, minWidth: 70, paddingHorizontal: 4 },
  assignText: { fontSize: 11, color: FT.textSec },
  pdjCell: { width: 90, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  actionsCell: { width: 40, alignItems: 'center' },
  actionBtn: { padding: 4 },
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
  tableListContent: { paddingBottom: 100 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600' as const, color: FT.text },
});
