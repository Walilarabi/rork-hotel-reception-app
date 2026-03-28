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
  Modal,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Camera, Search, ChevronRight, X, ScanLine, Play, CheckCircle, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import UserMenuButton from '@/components/UserMenuButton';
import { useHotel } from '@/providers/HotelProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useColors } from '@/hooks/useColors';
import { Colors } from '@/constants/colors';
import { Room } from '@/constants/types';

const SWIPE_THRESHOLD = 80;

type RoomFilter = 'all' | 'depart' | 'recouche';

interface SwipeableCardProps {
  room: Room;
  onPress: () => void;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onManualStart: () => void;
  elapsed: string | null;
  themeColor: string;
}

const SwipeableRoomCard = React.memo(function SwipeableRoomCard({
  room,
  onPress,
  onSwipeRight,
  onSwipeLeft,
  onManualStart,
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
  const isNpd = room.status === 'hors_service' && room.vipInstructions === 'NPD';
  const isPriority = room.clientBadge === 'prioritaire' || room.clientBadge === 'vip';
  const isNotStarted = room.cleaningStatus === 'none' || room.cleaningStatus === 'refusee';

  const getBadgeConfig = () => {
    if (isNpd) return { label: 'NPD', color: '#78909C', bg: '#ECEFF1' };
    if (isRefused) return { label: 'A refaire', color: '#E53935', bg: '#FFEBEE' };
    if (isDone) return { label: 'Terminé', color: '#2E7D32', bg: '#E8F5E9' };
    if (isInProgress) return null;
    if (isDepart) return { label: 'Départ', color: '#C62828', bg: '#FFCDD2' };
    if (isRecouche) return { label: 'Recouche', color: '#1565C0', bg: '#BBDEFB' };
    return null;
  };

  const badge = getBadgeConfig();
  const leftAction = isInProgress ? '✅' : '▶️';
  const leftLabel = isInProgress ? 'Terminer' : 'Commencer';

  const statusBarColor = isNpd ? '#78909C' : isRefused ? '#E53935' : isInProgress ? themeColor : isDone ? '#43A047' : isDepart ? '#E53935' : isRecouche ? '#1565C0' : '#CFD8DC';

  return (
    <View style={cardStyles.wrapper}>
      <View style={[cardStyles.actionBg, cardStyles.actionBgLeft]}>
        <Text style={cardStyles.actionEmoji}>{leftAction}</Text>
        <Text style={cardStyles.actionLabel}>{leftLabel}</Text>
      </View>
      <View style={[cardStyles.actionBg, cardStyles.actionBgRight]}>
        <Text style={cardStyles.actionEmoji}>{'🔒'}</Text>
        <Text style={cardStyles.actionLabel}>NPD</Text>
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
            <View style={cardStyles.roomNumRow}>
              {isPriority && (
                <Flame size={14} color="#E53935" fill="#E53935" style={{ marginRight: 2 }} />
              )}
              <Text style={cardStyles.roomNum}>{room.roomNumber}</Text>
            </View>
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
              <View style={cardStyles.guestRow}>
                <Text style={cardStyles.guestName} numberOfLines={1}>
                  {room.currentReservation.guestName}
                </Text>
                {isNotStarted && !isNpd && (
                  <TouchableOpacity
                    style={cardStyles.miniPlayBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      onManualStart();
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Play size={12} color="#FFF" fill="#FFF" />
                  </TouchableOpacity>
                )}
              </View>
            ) : null}
            {room.vipInstructions && room.vipInstructions !== 'NPD' ? (
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
    backgroundColor: '#ECEFF1',
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
  roomNumRow: { flexDirection: 'row', alignItems: 'center' },
  roomNum: { fontSize: 26, fontWeight: '900' as const, color: '#1A2B33', letterSpacing: -0.5 },
  roomType: { fontSize: 10, color: '#8A9AA8', marginTop: 1 },
  centerSection: { flex: 1, gap: 3 },
  badgeRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  smallBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  smallBadgeText: { fontSize: 10, fontWeight: '700' as const },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  guestName: { fontSize: 12, color: '#5A6B78', fontWeight: '500' as const, flex: 1 },
  miniPlayBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#00897B',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  const { rooms, startCleaning, completeCleaning, updateRoom } = useHotel();
  const { theme, t } = useTheme();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState<RoomFilter>('all');
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
    let result = assignedRooms;
    if (activeFilter === 'depart') {
      result = result.filter((r) => r.status === 'depart');
    } else if (activeFilter === 'recouche') {
      result = result.filter((r) => r.status === 'recouche');
    }
    if (!searchText.trim()) return result;
    const q = searchText.toLowerCase();
    return result.filter((r) =>
      r.roomNumber.toLowerCase().includes(q) ||
      r.roomType.toLowerCase().includes(q) ||
      r.currentReservation?.guestName?.toLowerCase().includes(q)
    );
  }, [assignedRooms, searchText, activeFilter]);

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
        router.push({ pathname: '/task-detail', params: { roomId: room.id } });
      }
    },
    [startCleaning, completeCleaning, router]
  );

  const handleSwipeLeft = useCallback(
    (room: Room) => {
      if (room.status === 'hors_service' && room.vipInstructions === 'NPD') {
        updateRoom({ roomId: room.id, updates: { status: 'occupe', vipInstructions: '' } });
      } else {
        updateRoom({ roomId: room.id, updates: { status: 'hors_service', vipInstructions: 'NPD' } });
      }
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [updateRoom]
  );

  const handleManualStart = useCallback(
    (room: Room) => {
      startCleaning(room.id);
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({ pathname: '/task-detail', params: { roomId: room.id } });
    },
    [startCleaning, router]
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

  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [scanInput, setScanInput] = useState('');

  const handleScanQR = useCallback(() => {
    setScanInput('');
    setScanModalVisible(true);
  }, []);

  const handleScanRoom = useCallback((roomNumber: string) => {
    const room = rooms.find((r) => r.roomNumber === roomNumber.trim());
    if (!room) {
      Alert.alert('Chambre introuvable', `Aucune chambre trouvée avec le numéro "${roomNumber.trim()}".`);
      return;
    }
    if (room.cleaningStatus === 'en_cours') {
      Alert.alert(
        'Terminer le nettoyage',
        `Chambre ${room.roomNumber} — Confirmer la fin du nettoyage ?\nStatut: Terminé, en Attente de Validation`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Terminer',
            onPress: () => {
              completeCleaning(room.id);
              if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setScanModalVisible(false);
              setScanInput('');
            },
          },
        ]
      );
    } else if (room.cleaningStatus === 'none' || room.cleaningStatus === 'refusee') {
      startCleaning(room.id);
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setScanModalVisible(false);
      setScanInput('');
      router.push({ pathname: '/task-detail', params: { roomId: room.id } });
    } else {
      setScanModalVisible(false);
      setScanInput('');
      router.push({ pathname: '/task-detail', params: { roomId: room.id } });
    }
  }, [rooms, startCleaning, completeCleaning, router]);

  const scanFilteredRooms = useMemo(() => {
    if (!scanInput.trim()) return assignedRooms;
    const q = scanInput.trim().toLowerCase();
    return rooms.filter((r) => r.roomNumber.toLowerCase().includes(q));
  }, [rooms, assignedRooms, scanInput]);

  const renderItem = useCallback(
    ({ item }: { item: Room }) => (
      <SwipeableRoomCard
        room={item}
        elapsed={getElapsedTime(item.cleaningStartedAt)}
        onPress={() => handlePress(item)}
        onSwipeRight={() => handleSwipeRight(item)}
        onSwipeLeft={() => handleSwipeLeft(item)}
        onManualStart={() => handleManualStart(item)}
        themeColor={theme.primary}
      />
    ),
    [getElapsedTime, handlePress, handleSwipeRight, handleSwipeLeft, handleManualStart, theme]
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
          <Text style={styles.scannerSub}>Scannez le QR code ou entrez le numéro</Text>
        </View>
        <ChevronRight size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActiveAll]}
          onPress={() => setActiveFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActiveAll]}>
            Toutes ({assignedRooms.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, styles.filterTabDepart, activeFilter === 'depart' && styles.filterTabActiveDepart]}
          onPress={() => setActiveFilter('depart')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterTabText, styles.filterTabTextDepart, activeFilter === 'depart' && styles.filterTabTextActiveDepart]}>
            Départs ({stats.departs})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, styles.filterTabRecouche, activeFilter === 'recouche' && styles.filterTabActiveRecouche]}
          onPress={() => setActiveFilter('recouche')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterTabText, styles.filterTabTextRecouche, activeFilter === 'recouche' && styles.filterTabTextActiveRecouche]}>
            Recouches ({stats.recouches})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.swipeHintBar}>
        <Text style={styles.swipeHintText}>
          {'→ Glisser droite: Commencer/Terminer • ← Glisser gauche: NPD'}
        </Text>
      </View>

      <Modal
        visible={scanModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setScanModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.scanModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.scanModalContainer}>
            <View style={styles.scanModalHeader}>
              <View style={styles.scanModalTitleRow}>
                <ScanLine size={22} color={theme.primary} />
                <Text style={styles.scanModalTitle}>Scanner / Sélectionner</Text>
              </View>
              <TouchableOpacity
                style={styles.scanModalClose}
                onPress={() => setScanModalVisible(false)}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.scanInputRow}>
              <View style={[styles.scanInputContainer, { borderColor: theme.primary + '40' }]}>
                <Search size={16} color="#94A3B8" />
                <TextInput
                  style={styles.scanInputField}
                  placeholder="Numéro de chambre (ex: 205)"
                  placeholderTextColor="#94A3B8"
                  value={scanInput}
                  onChangeText={setScanInput}
                  keyboardType="default"
                  autoFocus
                  returnKeyType="go"
                  onSubmitEditing={() => {
                    if (scanInput.trim()) handleScanRoom(scanInput);
                  }}
                  testID="scan-room-input"
                />
              </View>
              <TouchableOpacity
                style={[styles.scanGoBtn, { backgroundColor: theme.primary, opacity: scanInput.trim() ? 1 : 0.4 }]}
                onPress={() => { if (scanInput.trim()) handleScanRoom(scanInput); }}
                disabled={!scanInput.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.scanGoBtnText}>OK</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.scanSectionLabel}>
              {scanInput.trim() ? `Résultats (${scanFilteredRooms.length})` : `Mes chambres (${assignedRooms.length})`}
            </Text>

            <FlatList
              data={scanFilteredRooms}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.scanListContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isInProg = item.cleaningStatus === 'en_cours';
                const isDoneStatus = item.cleaningStatus === 'nettoyee' || item.cleaningStatus === 'validee';
                const isRefusedStatus = item.cleaningStatus === 'refusee';
                const canAct = isInProg || item.cleaningStatus === 'none' || isRefusedStatus;
                const actionColor = isInProg ? '#16A34A' : theme.primary;
                const actionIcon = isInProg ? <CheckCircle size={16} color="#FFF" /> : <Play size={16} color="#FFF" />;
                const actionLabel = isInProg ? 'Terminer' : 'Démarrer';
                const statusLabel = isInProg ? '🧹 En cours' : isDoneStatus ? '✅ Terminé' : isRefusedStatus ? '🔄 À refaire' : '';

                return (
                  <TouchableOpacity
                    style={styles.scanRoomItem}
                    onPress={() => handleScanRoom(item.roomNumber)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.scanRoomLeft}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {(item.clientBadge === 'prioritaire' || item.clientBadge === 'vip') && (
                          <Flame size={14} color="#E53935" fill="#E53935" />
                        )}
                        <Text style={styles.scanRoomNumber}>{item.roomNumber}</Text>
                      </View>
                      <Text style={styles.scanRoomType}>{item.roomType}</Text>
                      {statusLabel ? <Text style={styles.scanRoomStatus}>{statusLabel}</Text> : null}
                    </View>
                    {canAct && (
                      <View style={[styles.scanRoomAction, { backgroundColor: actionColor }]}>
                        {actionIcon}
                        <Text style={styles.scanRoomActionText}>{actionLabel}</Text>
                      </View>
                    )}
                    {isDoneStatus && (
                      <View style={[styles.scanRoomAction, { backgroundColor: '#E2E8F0' }]}>
                        <CheckCircle size={16} color="#16A34A" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.scanEmpty}>
                  <Text style={styles.scanEmptyText}>Aucune chambre trouvée</Text>
                </View>
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

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

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#E8ECF0',
  },
  filterTabActiveAll: {
    backgroundColor: '#1A4D5C',
  },
  filterTabDepart: {
    backgroundColor: '#FFEBEE',
  },
  filterTabActiveDepart: {
    backgroundColor: '#E53935',
  },
  filterTabRecouche: {
    backgroundColor: '#E3F2FD',
  },
  filterTabActiveRecouche: {
    backgroundColor: '#1565C0',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#546E7A',
  },
  filterTabTextActiveAll: {
    color: '#FFF',
  },
  filterTabTextDepart: {
    color: '#C62828',
  },
  filterTabTextActiveDepart: {
    color: '#FFF',
  },
  filterTabTextRecouche: {
    color: '#1565C0',
  },
  filterTabTextActiveRecouche: {
    color: '#FFF',
  },

  swipeHintBar: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  swipeHintText: { fontSize: 10, textAlign: 'center', fontWeight: '500' as const, color: '#90A4AE' },

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

  scanModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  scanModalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  scanModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  scanModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scanModalTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#1E293B',
  },
  scanModalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanInputRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },
  scanInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  scanInputField: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontWeight: '600' as const,
  },
  scanGoBtn: {
    width: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanGoBtnText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#FFF',
  },
  scanSectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94A3B8',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  scanListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scanRoomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scanRoomLeft: {
    flex: 1,
    gap: 2,
  },
  scanRoomNumber: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#1E293B',
  },
  scanRoomType: {
    fontSize: 11,
    color: '#64748B',
  },
  scanRoomStatus: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  scanRoomAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  scanRoomActionText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  scanEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  scanEmptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
});
