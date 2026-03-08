import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Animated,
  PanResponder,
  Platform,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Camera, Search, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import UserMenuButton from '@/components/UserMenuButton';
import { useHotel } from '@/providers/HotelProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useColors } from '@/hooks/useColors';
import { Colors } from '@/constants/colors';
import { Room } from '@/constants/types';

const SWIPE_THRESHOLD = 80;

interface SwipeableCardProps {
  room: Room;
  onPress: () => void;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  elapsed: string | null;
  themeColor: string;
}

const SwipeableRoomCard = React.memo(function SwipeableRoomCard({
  room,
  onPress,
  onSwipeRight,
  onSwipeLeft,
  elapsed,
  themeColor,
}: SwipeableCardProps) {
  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        pan.setValue(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSwipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSwipeLeft();
        }
        Animated.spring(pan, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
      },
    })
  ).current;

  const isInProgress = room.cleaningStatus === 'en_cours';
  const isRefused = room.cleaningStatus === 'refusee';
  const isDone = room.cleaningStatus === 'nettoyee' || room.cleaningStatus === 'validee';
  const isDepart = room.status === 'depart';
  const isRecouche = room.status === 'recouche';
  const isBlocked = room.status === 'hors_service';

  const getBadgeConfig = () => {
    if (isRefused) return { label: 'A refaire', color: '#E53935', bg: '#FFEBEE' };
    if (isDone) return { label: 'Terminé', color: '#2E7D32', bg: '#E8F5E9' };
    if (isInProgress) return null;
    if (isDepart) return { label: 'Départ', color: '#C62828', bg: '#FFCDD2' };
    if (isRecouche) return { label: 'Recouche', color: '#E65100', bg: '#FFE0B2' };
    if (isBlocked) return { label: 'Bloquée', color: '#546E7A', bg: '#ECEFF1' };
    return null;
  };

  const badge = getBadgeConfig();
  const leftAction = isInProgress ? '✅' : '▶️';
  const leftLabel = isInProgress ? 'Terminer' : 'Commencer';

  const statusBarColor = isRefused ? '#E53935' : isInProgress ? themeColor : isDone ? '#43A047' : isDepart ? '#E53935' : isRecouche ? '#FB8C00' : '#CFD8DC';

  return (
    <View style={cardStyles.wrapper}>
      <View style={[cardStyles.actionBg, cardStyles.actionBgLeft]}>
        <Text style={cardStyles.actionEmoji}>{leftAction}</Text>
        <Text style={cardStyles.actionLabel}>{leftLabel}</Text>
      </View>
      <View style={[cardStyles.actionBg, cardStyles.actionBgRight]}>
        <Text style={cardStyles.actionEmoji}>{'⚠️'}</Text>
        <Text style={cardStyles.actionLabel}>Signaler</Text>
      </View>

      <Animated.View
        style={[cardStyles.card, { transform: [{ translateX: pan }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={cardStyles.cardInner}
          onPress={onPress}
          activeOpacity={0.7}
          testID={`room-card-${room.roomNumber}`}
        >
          <View style={[cardStyles.statusBar, { backgroundColor: statusBarColor }]} />

          <View style={cardStyles.leftSection}>
            <Text style={cardStyles.roomNum}>{room.roomNumber}</Text>
            <Text style={cardStyles.roomType} numberOfLines={1}>{room.roomType}</Text>
          </View>

          <View style={cardStyles.centerSection}>
            <View style={cardStyles.badgeRow}>
              {room.clientBadge === 'vip' && (
                <View style={[cardStyles.smallBadge, { backgroundColor: '#FFF8E1' }]}>
                  <Text style={cardStyles.smallBadgeText}>{'⭐ VIP'}</Text>
                </View>
              )}
              {room.clientBadge === 'prioritaire' && (
                <View style={[cardStyles.smallBadge, { backgroundColor: '#FFEBEE' }]}>
                  <Text style={cardStyles.smallBadgeText}>{'⚡ Prio'}</Text>
                </View>
              )}
              {badge && (
                <View style={[cardStyles.smallBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[cardStyles.smallBadgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              )}
            </View>
            {room.currentReservation ? (
              <Text style={cardStyles.guestName} numberOfLines={1}>
                {room.currentReservation.guestName}
              </Text>
            ) : null}
            {room.vipInstructions ? (
              <Text style={cardStyles.instructions} numberOfLines={1}>
                {room.vipInstructions}
              </Text>
            ) : null}
          </View>

          <View style={cardStyles.rightSection}>
            {isInProgress && elapsed ? (
              <View style={[cardStyles.timerPill, { backgroundColor: themeColor }]}>
                <Text style={cardStyles.timerIcon}>{'🧹'}</Text>
                <Text style={cardStyles.timerText}>{elapsed}</Text>
              </View>
            ) : (
              <ChevronRight size={18} color={Colors.textMuted} />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

const cardStyles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  actionBgLeft: {
    left: 0,
    backgroundColor: '#E8F5E9',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  actionBgRight: {
    right: 0,
    backgroundColor: '#FFF3E0',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  actionEmoji: { fontSize: 26 },
  actionLabel: { fontSize: 10, fontWeight: '600' as const, color: '#546E7A' },
  card: {
    borderRadius: 14,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardInner: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingLeft: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 10,
  },
  leftSection: { minWidth: 54, marginRight: 10 },
  roomNum: { fontSize: 26, fontWeight: '900' as const, color: '#1A2B33', letterSpacing: -0.5 },
  roomType: { fontSize: 10, color: '#8A9AA8', marginTop: 1 },
  centerSection: { flex: 1, gap: 3 },
  badgeRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  smallBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  smallBadgeText: { fontSize: 10, fontWeight: '700' as const },
  guestName: { fontSize: 12, color: '#5A6B78', fontWeight: '500' as const },
  instructions: { fontSize: 10, color: '#8A9AA8', fontStyle: 'italic' as const },
  rightSection: { marginLeft: 8, alignItems: 'flex-end' },
  timerPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  timerIcon: { fontSize: 14 },
  timerText: { fontSize: 13, fontWeight: '700' as const, color: '#FFF', fontVariant: ['tabular-nums'] },
});

interface SectionData {
  title: string;
  data: Room[];
}

export default function HousekeepingScreen() {
  const router = useRouter();
  const { rooms, startCleaning, completeCleaning } = useHotel();
  const { theme, t } = useTheme();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const assignedRooms = useMemo(() => {
    return rooms
      .filter((r) => r.assignedTo === 's1' || r.assignedTo === 's2')
      .sort((a, b) => {
        const priorityMap: Record<string, number> = { refusee: 0, none: 2, en_cours: 1, nettoyee: 3, validee: 4 };
        const badgeMap: Record<string, number> = { prioritaire: 0, vip: 1, normal: 2 };
        const statusMap: Record<string, number> = { hors_service: 0, depart: 1, recouche: 2, occupe: 3, libre: 4 };
        const aBadge = badgeMap[a.clientBadge] ?? 2;
        const bBadge = badgeMap[b.clientBadge] ?? 2;
        if (aBadge !== bBadge) return aBadge - bBadge;
        const aClean = priorityMap[a.cleaningStatus] ?? 2;
        const bClean = priorityMap[b.cleaningStatus] ?? 2;
        if (aClean !== bClean) return aClean - bClean;
        return (statusMap[a.status] ?? 3) - (statusMap[b.status] ?? 3);
      });
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    if (!searchText.trim()) return assignedRooms;
    const q = searchText.toLowerCase();
    return assignedRooms.filter((r) =>
      r.roomNumber.toLowerCase().includes(q) ||
      r.roomType.toLowerCase().includes(q) ||
      r.currentReservation?.guestName?.toLowerCase().includes(q)
    );
  }, [assignedRooms, searchText]);

  const sections: SectionData[] = useMemo(() => {
    const floorMap = new Map<number, Room[]>();
    for (const room of filteredRooms) {
      const existing = floorMap.get(room.floor) ?? [];
      existing.push(room);
      floorMap.set(room.floor, existing);
    }
    return Array.from(floorMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([floor, data]) => ({
        title: `${floor}${floor === 1 ? 'er' : 'e'} étage`,
        data,
      }));
  }, [filteredRooms]);

  const stats = useMemo(() => {
    const total = assignedRooms.length;
    const done = assignedRooms.filter(
      (r) => r.cleaningStatus === 'nettoyee' || r.cleaningStatus === 'validee'
    ).length;
    const departs = assignedRooms.filter((r) => r.status === 'depart').length;
    const recouches = assignedRooms.filter((r) => r.status === 'recouche').length;
    const inProgress = assignedRooms.filter((r) => r.cleaningStatus === 'en_cours').length;
    return { total, done, departs, recouches, inProgress };
  }, [assignedRooms]);

  useEffect(() => {
    const target = stats.total > 0 ? stats.done / stats.total : 0;
    Animated.spring(progressAnim, {
      toValue: target,
      useNativeDriver: false,
      tension: 30,
      friction: 10,
    }).start();
  }, [stats.done, stats.total, progressAnim]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((prev) => prev + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const getElapsedTime = useCallback((startedAt: string | null) => {
    if (!startedAt) return null;
    const diff = Date.now() - new Date(startedAt).getTime();
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}:${String(mins % 60).padStart(2, '0')}`;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  const handleSwipeRight = useCallback(
    (room: Room) => {
      if (room.cleaningStatus === 'en_cours') {
        completeCleaning(room.id);
        if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (room.cleaningStatus === 'none' || room.cleaningStatus === 'refusee') {
        startCleaning(room.id);
        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    },
    [startCleaning, completeCleaning]
  );

  const handleSwipeLeft = useCallback(
    (room: Room) => {
      router.push({ pathname: '/task-detail', params: { roomId: room.id, openReport: '1' } });
    },
    [router]
  );

  const handlePress = useCallback(
    (room: Room) => {
      router.push({ pathname: '/task-detail', params: { roomId: room.id } });
    },
    [router]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const progressPercent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const handleScanQR = useCallback(() => {
    Alert.alert(
      '📷 Scanner QR Code',
      'Scannez le QR code sur la porte de la chambre pour accéder directement à sa fiche.',
      [{ text: 'OK' }]
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Room }) => (
      <SwipeableRoomCard
        room={item}
        elapsed={getElapsedTime(item.cleaningStartedAt)}
        onPress={() => handlePress(item)}
        onSwipeRight={() => handleSwipeRight(item)}
        onSwipeLeft={() => handleSwipeLeft(item)}
        themeColor={theme.primary}
      />
    ),
    [getElapsedTime, handlePress, handleSwipeRight, handleSwipeLeft, theme]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionData }) => (
      <View style={styles.sectionHeader}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
        <Text style={styles.sectionCount}>{section.data.length}</Text>
      </View>
    ),
    []
  );

  const userName = 'Sophie';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={[styles.heroSection, { backgroundColor: theme.headerBg }]}>
        <View style={styles.heroTop}>
          <View style={styles.heroGreeting}>
            <Text style={styles.heroHello}>{t.housekeeping.goodMorning}</Text>
            <Text style={styles.heroName}>{userName}</Text>
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.heroIconBtn}
              onPress={() => setShowSearch((p) => !p)}
            >
              <Search size={20} color="#FFF" />
            </TouchableOpacity>
            <UserMenuButton />
          </View>
        </View>

        {showSearch && (
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Search size={15} color="rgba(255,255,255,0.5)" />
              <TextInput
                style={styles.searchInput}
                placeholder={t.common.search}
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
                testID="search-rooms"
              />
            </View>
          </View>
        )}

        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <Text style={styles.summaryRoomCount}>{stats.total}</Text>
            <Text style={styles.summaryLabel}>{t.housekeeping.roomsToday}</Text>
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.progressPct}>{progressPercent}%</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatVal}>{stats.done}</Text>
              <Text style={styles.miniStatLabel}>{t.housekeeping.done}</Text>
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatVal}>{stats.departs}</Text>
              <Text style={styles.miniStatLabel}>{t.housekeeping.departures}</Text>
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatVal}>{stats.recouches}</Text>
              <Text style={styles.miniStatLabel}>{t.housekeeping.stayovers}</Text>
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatVal}>{stats.inProgress}</Text>
              <Text style={styles.miniStatLabel}>{t.rooms.inProgress}</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.scannerBtn, { borderColor: theme.primary + '30' }]}
        onPress={handleScanQR}
        activeOpacity={0.7}
        testID="scan-qr-btn"
      >
        <View style={[styles.scannerIconCircle, { backgroundColor: theme.primarySoft }]}>
          <Camera size={22} color={theme.primary} />
        </View>
        <View style={styles.scannerTextCol}>
          <Text style={[styles.scannerTitle, { color: colors.text }]}>Scanner une chambre</Text>
          <Text style={styles.scannerSub}>Scannez le QR code pour commencer</Text>
        </View>
        <ChevronRight size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.swipeHintBar}>
        <Text style={styles.swipeHintText}>
          {t.housekeeping.swipeHint}
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{'🎉'}</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.housekeeping.allDone}</Text>
            <Text style={styles.emptySubtext}>{t.housekeeping.noAssigned}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },

  heroSection: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroGreeting: { gap: 2 },
  heroHello: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' as const },
  heroName: { fontSize: 26, fontWeight: '800' as const, color: '#FFF', letterSpacing: -0.5 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 4 },
  heroIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchRow: { marginTop: 12 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#FFF', padding: 0 },

  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
  },
  summaryRoomCount: { fontSize: 36, fontWeight: '900' as const, color: '#FFF' },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' as const },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  progressPct: { fontSize: 13, fontWeight: '700' as const, color: '#4ADE80', minWidth: 36 },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniStat: { flex: 1, alignItems: 'center' },
  miniStatVal: { fontSize: 18, fontWeight: '800' as const, color: '#FFF' },
  miniStatLabel: { fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: '500' as const, textTransform: 'uppercase' as const },
  miniStatDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.15)' },

  scannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: -10,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  scannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTextCol: { flex: 1 },
  scannerTitle: { fontSize: 15, fontWeight: '700' as const },
  scannerSub: { fontSize: 11, color: '#8A9AA8', marginTop: 1 },

  swipeHintBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  swipeHintText: { fontSize: 11, textAlign: 'center', fontWeight: '500' as const, color: '#90A4AE' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 8,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#90A4AE',
  },
  sectionHeaderText: { fontSize: 13, fontWeight: '600' as const, color: '#5A6B78' },
  sectionCount: { fontSize: 11, fontWeight: '700' as const, color: '#90A4AE', backgroundColor: '#ECEFF1', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  listContent: { paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const, color: '#1A2B33' },
  emptySubtext: { fontSize: 13, color: '#5A6B78' },
});
