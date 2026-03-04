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
import { Bell, Search, ChevronRight } from 'lucide-react-native';
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
  themeSoft: string;
}

const SwipeableRoomCard = React.memo(function SwipeableRoomCard({
  room,
  onPress,
  onSwipeRight,
  onSwipeLeft,
  elapsed,
  themeColor,
  themeSoft,
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
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSwipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    if (isRefused) return { label: 'À refaire', color: '#E53935', bg: '#FFEBEE' };
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

  return (
    <View style={cardStyles.wrapper}>
      <View style={[cardStyles.actionBg, cardStyles.actionBgLeft]}>
        <Text style={cardStyles.actionEmoji}>{leftAction}</Text>
        <Text style={cardStyles.actionLabel}>{leftLabel}</Text>
      </View>
      <View style={[cardStyles.actionBg, cardStyles.actionBgRight]}>
        <Text style={cardStyles.actionEmoji}>⚠️</Text>
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
          <View style={cardStyles.leftSection}>
            <Text style={cardStyles.roomNum}>{room.roomNumber}</Text>
            <Text style={cardStyles.roomType} numberOfLines={1}>{room.roomType}</Text>
          </View>

          <View style={cardStyles.centerSection}>
            {room.clientBadge === 'vip' && (
              <View style={[cardStyles.smallBadge, { backgroundColor: '#FFF8E1' }]}>
                <Text style={cardStyles.smallBadgeText}>⭐ VIP</Text>
              </View>
            )}
            {room.clientBadge === 'prioritaire' && (
              <View style={[cardStyles.smallBadge, { backgroundColor: '#FFEBEE' }]}>
                <Text style={cardStyles.smallBadgeText}>⚡</Text>
              </View>
            )}
            {room.vipInstructions ? (
              <Text style={cardStyles.instructions} numberOfLines={1}>
                {room.vipInstructions}
              </Text>
            ) : null}
          </View>

          <View style={cardStyles.rightSection}>
            {isInProgress && elapsed ? (
              <View style={[cardStyles.timerPill, { backgroundColor: themeColor }]}>
                <Text style={cardStyles.timerIcon}>🧹</Text>
                <Text style={cardStyles.timerText}>{elapsed}</Text>
              </View>
            ) : badge ? (
              <View style={[cardStyles.statusBadge, { backgroundColor: badge.bg }]}>
                <Text style={[cardStyles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
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
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInner: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSection: { minWidth: 60, marginRight: 12 },
  roomNum: { fontSize: 24, fontWeight: '800' as const, color: '#1A2B33', letterSpacing: -0.5 },
  roomType: { fontSize: 11, color: '#8A9AA8', marginTop: 1 },
  centerSection: { flex: 1, gap: 4 },
  smallBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  smallBadgeText: { fontSize: 11, fontWeight: '600' as const },
  instructions: { fontSize: 11, color: '#5A6B78', fontStyle: 'italic' as const },
  rightSection: { marginLeft: 8, alignItems: 'flex-end' },
  timerPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  timerIcon: { fontSize: 14 },
  timerText: { fontSize: 13, fontWeight: '700' as const, color: '#FFF', fontVariant: ['tabular-nums'] },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' as const },
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
        title: `${floor}${floor === 1 ? 'er' : 'ème'} étage`,
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
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
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
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (room.cleaningStatus === 'none' || room.cleaningStatus === 'refusee') {
        startCleaning(room.id);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  const pendingCount = stats.total - stats.done;
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const renderItem = useCallback(
    ({ item }: { item: Room }) => (
      <SwipeableRoomCard
        room={item}
        elapsed={getElapsedTime(item.cleaningStartedAt)}
        onPress={() => handlePress(item)}
        onSwipeRight={() => handleSwipeRight(item)}
        onSwipeLeft={() => handleSwipeLeft(item)}
        themeColor={theme.primary}
        themeSoft={theme.primarySoft}
      />
    ),
    [getElapsedTime, handlePress, handleSwipeRight, handleSwipeLeft, theme]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionData }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
      </View>
    ),
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: theme.headerBg },
          headerTintColor: '#FFF',
          headerShadowVisible: false,
          headerTitle: () => (
            <Text style={styles.headerTitle}>{t.housekeeping.assignedRooms}</Text>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.notifContainer}
                onPress={() => {
                  const pending = assignedRooms.filter((r) => r.cleaningStatus === 'none' || r.cleaningStatus === 'refusee');
                  if (pending.length === 0) {
                    Alert.alert(t.housekeeping.allDone, t.housekeeping.noAssigned);
                  } else {
                    Alert.alert(
                      `${pendingCount} ${t.housekeeping.roomsToday}`,
                      pending.slice(0, 5).map((r) => `${t.rooms.room} ${r.roomNumber}`).join('\n') + (pending.length > 5 ? '\n...' : '')
                    );
                  }
                }}
              >
                <Bell size={20} color="#FFF" />
                {pendingCount > 0 && (
                  <View style={[styles.notifBadge, { borderColor: theme.headerBg }]}>
                    <Text style={styles.notifBadgeText}>{pendingCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <UserMenuButton />
            </View>
          ),
        }}
      />

      <View style={[styles.topArea, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t.common.search}
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            testID="search-rooms"
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.primary }]}>{stats.done}/{stats.total}</Text>
            <Text style={styles.statLabel}>{t.housekeeping.done}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.departs}</Text>
            <Text style={styles.statLabel}>🚪 {t.housekeeping.departures}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.recouches}</Text>
            <Text style={styles.statLabel}>🔄 {t.housekeeping.stayovers}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>⏳ {t.rooms.inProgress}</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth, backgroundColor: theme.primary }]} />
        </View>
      </View>

      <View style={[styles.swipeHintBar, { backgroundColor: theme.primarySoft }]}>
        <Text style={[styles.swipeHintText, { color: theme.primaryDark }]}>
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
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>{t.housekeeping.allDone}</Text>
            <Text style={styles.emptySubtext}>{t.housekeeping.noAssigned}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' } as const,
  headerTitle: { fontSize: 17, fontWeight: '700' as const, color: '#FFF' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 4 },
  notifContainer: { position: 'relative' },
  notifBadge: {
    position: 'absolute',
    top: -5,
    right: -7,
    backgroundColor: '#E53935',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  notifBadgeText: { fontSize: 9, fontWeight: '800' as const, color: '#FFF' },
  topArea: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8EC',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E4E8EC',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1A2B33', padding: 0 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 12 },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '800' as const, color: '#1A2B33' },
  statLabel: { fontSize: 10, color: '#5A6B78', marginTop: 2, fontWeight: '500' as const },
  statDivider: { width: 1, height: 28, backgroundColor: '#E4E8EC' },
  progressBarContainer: { height: 6, backgroundColor: '#E4E8EC', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, borderRadius: 3 },
  swipeHintBar: { paddingVertical: 6, paddingHorizontal: 16 },
  swipeHintText: { fontSize: 11, textAlign: 'center', fontWeight: '500' as const },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
  sectionHeaderText: { fontSize: 13, fontWeight: '600' as const, color: '#5A6B78', textTransform: 'lowercase' as const },
  listContent: { paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const, color: '#1A2B33' },
  emptySubtext: { fontSize: 13, color: '#5A6B78' },
});
