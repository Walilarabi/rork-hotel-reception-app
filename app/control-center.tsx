import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Star,
  Activity,
  ArrowRight,
  MapPin,
  Users,
  Zap,
} from 'lucide-react-native';
import { useHotel } from '@/providers/HotelProvider';
import { useHousekeepingManager } from '@/providers/HousekeepingProvider';
import { useSatisfaction } from '@/providers/SatisfactionProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Room, ROOM_PLAN_STATUS_CONFIG, RoomPlanStatus, ActivityEvent } from '@/constants/types';
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

const EVENT_TYPE_CONFIG: Record<ActivityEvent['type'], { color: string; icon: string }> = {
  cleaning: { color: '#22C55E', icon: '🧹' },
  checkin: { color: '#3B82F6', icon: '🔑' },
  checkout: { color: '#F59E0B', icon: '🚪' },
  review: { color: '#8B5CF6', icon: '⭐' },
  alert: { color: '#EF4444', icon: '⚠️' },
  maintenance: { color: '#6B7280', icon: '🔧' },
};

export default function ControlCenterScreen() {
  const router = useRouter();
  const { rooms, maintenanceTasks } = useHotel();
  const { taskStats, staffPerformance, activityEvents } = useHousekeepingManager();
  const { reviews, alerts: qualityAlerts } = useSatisfaction();
  const { isDarkMode } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const bg = isDarkMode ? '#0F1117' : '#F3F4F8';
  const surface = isDarkMode ? '#1A1D27' : '#FFFFFF';
  const txt = isDarkMode ? '#E8ECF2' : '#1A1A2E';
  const txtSec = isDarkMode ? '#8B95A8' : '#5A5878';
  const brd = isDarkMode ? '#2A2D3A' : '#E4E3EE';

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const roomStats = useMemo(() => {
    const total = rooms.length;
    const occupe = rooms.filter((r) => r.status === 'occupe').length;
    const depart = rooms.filter((r) => r.status === 'depart').length;
    const recouche = rooms.filter((r) => r.status === 'recouche').length;
    const libre = rooms.filter((r) => r.status === 'libre').length;
    const horsService = rooms.filter((r) => r.status === 'hors_service').length;
    const occupancyRate = total > 0 ? Math.round(((occupe + depart + recouche) / total) * 100) : 0;
    return { total, occupe, libre, depart, recouche, horsService, occupancyRate };
  }, [rooms]);

  const planStats = useMemo(() => {
    let clean = 0, dirty = 0, cleaning = 0;
    for (const room of rooms) {
      const s = getRoomPlanStatus(room);
      if (s === 'clean') clean++;
      else if (s === 'dirty') dirty++;
      else if (s === 'cleaning') cleaning++;
    }
    return { clean, dirty, cleaning };
  }, [rooms]);

  const satisfactionScore = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => {
      const ratings = r.ratings as unknown as Record<string, number>;
      const values = Object.values(ratings).filter((v): v is number => typeof v === 'number');
      const avg = values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0;
      return sum + avg;
    }, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }, [reviews]);

  const activeAlerts = useMemo(() =>
    qualityAlerts.filter((a: { status: string }) => a.status === 'active'),
    [qualityAlerts]
  );

  const urgentMaintenance = useMemo(() =>
    maintenanceTasks.filter((t) => t.priority === 'haute' && t.status !== 'resolu'),
    [maintenanceTasks]
  );

  const groupedByFloor = useMemo(() => {
    const floorSet = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => b - a);
    return floorSet.map((floor) => ({
      floor,
      rooms: rooms.filter((r) => r.floor === floor).sort((a, b) =>
        a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })
      ),
    }));
  }, [rooms]);

  const sortedEvents = useMemo(() =>
    [...activityEvents].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8),
    [activityEvents]
  );

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Stack.Screen options={{ title: 'Centre de contrôle', headerStyle: { backgroundColor: FT.headerBg }, headerTintColor: '#FFF', headerShadowVisible: false }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={FT.brand} colors={[FT.brand]} />}
      >
        <View style={[styles.kpiSection, { backgroundColor: FT.headerBg }]}>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiMainCard}>
              <TrendingUp size={20} color="#4ADE80" />
              <Text style={styles.kpiMainValue}>{roomStats.occupancyRate}%</Text>
              <Text style={styles.kpiMainLabel}>Occupation</Text>
              <View style={styles.kpiProgressBg}>
                <View style={[styles.kpiProgressFill, { width: `${roomStats.occupancyRate}%` }]} />
              </View>
            </View>
            <View style={styles.kpiSmallGrid}>
              <View style={styles.kpiSmallCard}>
                <Text style={styles.kpiSmallValue}>{roomStats.occupe}</Text>
                <Text style={styles.kpiSmallLabel}>Occupées</Text>
              </View>
              <View style={styles.kpiSmallCard}>
                <Text style={styles.kpiSmallValue}>{roomStats.libre}</Text>
                <Text style={styles.kpiSmallLabel}>Disponibles</Text>
              </View>
              <View style={styles.kpiSmallCard}>
                <Text style={styles.kpiSmallValue}>{roomStats.horsService}</Text>
                <Text style={styles.kpiSmallLabel}>Hors service</Text>
              </View>
              <View style={styles.kpiSmallCard}>
                <Text style={styles.kpiSmallValue}>{roomStats.depart}</Text>
                <Text style={styles.kpiSmallLabel}>Check-out</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.widgetCard, { backgroundColor: surface, borderColor: brd }]}
          onPress={() => router.push('/hotel-plan')}
          activeOpacity={0.7}
        >
          <View style={styles.widgetHeader}>
            <MapPin size={18} color={FT.brand} />
            <Text style={[styles.widgetTitle, { color: txt }]}>Plan de l'hôtel</Text>
            <ArrowRight size={16} color={txtSec} />
          </View>
          <View style={styles.miniPlan}>
            {groupedByFloor.slice(0, 3).map(({ floor, rooms: floorRooms }) => (
              <View key={floor} style={styles.miniFloor}>
                <Text style={[styles.miniFloorLabel, { color: txtSec }]}>É{floor}</Text>
                <View style={styles.miniRoomRow}>
                  {floorRooms.slice(0, 10).map((room) => {
                    const status = getRoomPlanStatus(room);
                    const config = ROOM_PLAN_STATUS_CONFIG[status];
                    return (
                      <View key={room.id} style={[styles.miniRoom, { backgroundColor: config.bgColor }]}>
                        <View style={[styles.miniRoomDot, { backgroundColor: config.color }]} />
                      </View>
                    );
                  })}
                  {floorRooms.length > 10 && (
                    <Text style={[styles.miniMore, { color: txtSec }]}>+{floorRooms.length - 10}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
          <View style={styles.planLegend}>
            {[
              { color: '#22C55E', label: `${planStats.clean} propres` },
              { color: '#EF4444', label: `${planStats.dirty} à nettoyer` },
              { color: '#EAB308', label: `${planStats.cleaning} en cours` },
            ].map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendText, { color: txtSec }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.widgetCard, { backgroundColor: surface, borderColor: brd }]}
          onPress={() => router.push('/housekeeping-assignments')}
          activeOpacity={0.7}
        >
          <View style={styles.widgetHeader}>
            <Sparkles size={18} color={FT.brand} />
            <Text style={[styles.widgetTitle, { color: txt }]}>Housekeeping du jour</Text>
            <ArrowRight size={16} color={txtSec} />
          </View>
          <View style={styles.hkStatsRow}>
            <View style={styles.hkStatItem}>
              <Text style={[styles.hkStatValue, { color: '#EF4444' }]}>{taskStats.pending}</Text>
              <Text style={[styles.hkStatLabel, { color: txtSec }]}>À nettoyer</Text>
            </View>
            <View style={styles.hkStatDivider} />
            <View style={styles.hkStatItem}>
              <Text style={[styles.hkStatValue, { color: '#EAB308' }]}>{taskStats.inProgress}</Text>
              <Text style={[styles.hkStatLabel, { color: txtSec }]}>En cours</Text>
            </View>
            <View style={styles.hkStatDivider} />
            <View style={styles.hkStatItem}>
              <Text style={[styles.hkStatValue, { color: '#22C55E' }]}>{taskStats.completed}</Text>
              <Text style={[styles.hkStatLabel, { color: txtSec }]}>Terminés</Text>
            </View>
          </View>
          <View style={styles.staffList}>
            {staffPerformance.slice(0, 3).map((perf) => {
              const pct = perf.totalRooms > 0 ? Math.round((perf.completed / perf.totalRooms) * 100) : 0;
              return (
                <View key={perf.id} style={[styles.staffRow, { borderColor: brd }]}>
                  <Text style={[styles.staffName, { color: txt }]}>{perf.name}</Text>
                  <Text style={[styles.staffRooms, { color: txtSec }]}>{perf.completed}/{perf.totalRooms} ch.</Text>
                  <View style={styles.staffBar}>
                    <View style={[styles.staffBarFill, { width: `${pct}%`, backgroundColor: pct >= 80 ? '#22C55E' : '#3B82F6' }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </TouchableOpacity>

        <View style={[styles.widgetCard, { backgroundColor: surface, borderColor: brd }]}>
          <View style={styles.widgetHeader}>
            <Star size={18} color="#F59E0B" />
            <Text style={[styles.widgetTitle, { color: txt }]}>Satisfaction clients</Text>
            <TouchableOpacity onPress={() => router.push('/satisfaction-dashboard')}>
              <ArrowRight size={16} color={txtSec} />
            </TouchableOpacity>
          </View>
          <View style={styles.satisfactionRow}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{satisfactionScore > 0 ? satisfactionScore.toFixed(1) : '-'}</Text>
              <Text style={styles.scoreMax}>/5</Text>
            </View>
            <View style={styles.satisfactionInfo}>
              <Text style={[styles.satisfactionLabel, { color: txt }]}>Note moyenne</Text>
              <Text style={[styles.satisfactionSub, { color: txtSec }]}>{reviews.length} avis collectés</Text>
              {reviews.length > 0 && (
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Text key={i} style={{ fontSize: 16, opacity: i <= Math.round(satisfactionScore) ? 1 : 0.2 }}>⭐</Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {(activeAlerts.length > 0 || urgentMaintenance.length > 0) && (
          <View style={[styles.widgetCard, { backgroundColor: surface, borderColor: '#EF444440' }]}>
            <View style={styles.widgetHeader}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <AlertTriangle size={18} color="#EF4444" />
              </Animated.View>
              <Text style={[styles.widgetTitle, { color: txt }]}>Alertes & incidents</Text>
              <View style={[styles.alertCountBadge, { backgroundColor: '#EF444415' }]}>
                <Text style={styles.alertCountText}>{activeAlerts.length + urgentMaintenance.length}</Text>
              </View>
            </View>
            {activeAlerts.slice(0, 3).map((alert) => (
              <View key={alert.id} style={[styles.alertItem, { borderColor: brd }]}>
                <View style={[styles.alertDot, { backgroundColor: '#EF4444' }]} />
                <View style={styles.alertInfo}>
                  <Text style={[styles.alertRoom, { color: txt }]}>
                    {alert.roomNumber ? `Chambre ${alert.roomNumber}` : 'Hôtel'}
                  </Text>
                  <Text style={[styles.alertDesc, { color: txtSec }]}>
                    {alert.category} — {alert.score}/5
                  </Text>
                </View>
              </View>
            ))}
            {urgentMaintenance.slice(0, 2).map((task) => (
              <View key={task.id} style={[styles.alertItem, { borderColor: brd }]}>
                <View style={[styles.alertDot, { backgroundColor: '#F59E0B' }]} />
                <View style={styles.alertInfo}>
                  <Text style={[styles.alertRoom, { color: txt }]}>Chambre {task.roomNumber}</Text>
                  <Text style={[styles.alertDesc, { color: txtSec }]}>{task.title}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.widgetCard, { backgroundColor: surface, borderColor: brd }]}>
          <View style={styles.widgetHeader}>
            <Activity size={18} color={FT.brand} />
            <Text style={[styles.widgetTitle, { color: txt }]}>Activité en temps réel</Text>
          </View>
          <View style={styles.timeline}>
            {sortedEvents.map((event, index) => {
              const config = EVENT_TYPE_CONFIG[event.type];
              const time = new Date(event.time);
              const timeStr = time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              return (
                <View key={event.id} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <Text style={[styles.timelineTime, { color: txtSec }]}>{timeStr}</Text>
                  </View>
                  <View style={styles.timelineLine}>
                    <View style={[styles.timelineDot, { backgroundColor: config.color }]} />
                    {index < sortedEvents.length - 1 && (
                      <View style={[styles.timelineConnector, { backgroundColor: brd }]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineDesc, { color: txt }]}>
                      {config.icon} {event.description}
                    </Text>
                    {event.roomNumber && (
                      <Text style={[styles.timelineRoom, { color: txtSec }]}>Ch. {event.roomNumber}</Text>
                    )}
                  </View>
                </View>
              );
            })}
            {sortedEvents.length === 0 && (
              <Text style={[styles.emptyText, { color: txtSec }]}>Aucune activité récente</Text>
            )}
          </View>
        </View>

        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={[styles.quickLink, { backgroundColor: surface, borderColor: brd }]}
            onPress={() => router.push('/hotel-plan')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickLinkIcon, { backgroundColor: FT.brand + '15' }]}>
              <MapPin size={18} color={FT.brand} />
            </View>
            <Text style={[styles.quickLinkText, { color: txt }]}>Plan hôtel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickLink, { backgroundColor: surface, borderColor: brd }]}
            onPress={() => router.push('/housekeeping-assignments')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickLinkIcon, { backgroundColor: '#22C55E15' }]}>
              <Zap size={18} color="#22C55E" />
            </View>
            <Text style={[styles.quickLinkText, { color: txt }]}>Répartition</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickLink, { backgroundColor: surface, borderColor: brd }]}
            onPress={() => router.push('/satisfaction-dashboard')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickLinkIcon, { backgroundColor: '#F59E0B15' }]}>
              <Star size={18} color="#F59E0B" />
            </View>
            <Text style={[styles.quickLinkText, { color: txt }]}>Satisfaction</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickLink, { backgroundColor: surface, borderColor: brd }]}
            onPress={() => router.push('/team')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickLinkIcon, { backgroundColor: '#3B82F615' }]}>
              <Users size={18} color="#3B82F6" />
            </View>
            <Text style={[styles.quickLinkText, { color: txt }]}>Équipe</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { gap: 12 },

  kpiSection: { paddingTop: 4, paddingBottom: 18, paddingHorizontal: 14 },
  kpiGrid: { flexDirection: 'row', gap: 10 },
  kpiMainCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  kpiMainValue: { fontSize: 36, fontWeight: '900' as const, color: '#FFF', marginTop: 4 },
  kpiMainLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' as const },
  kpiProgressBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden', marginTop: 6 },
  kpiProgressFill: { height: 4, borderRadius: 2, backgroundColor: '#4ADE80' },
  kpiSmallGrid: { flex: 1, gap: 6 },
  kpiSmallCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiSmallValue: { fontSize: 18, fontWeight: '800' as const, color: '#FFF' },
  kpiSmallLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '500' as const },

  widgetCard: {
    marginHorizontal: 14,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  widgetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  widgetTitle: { fontSize: 15, fontWeight: '700' as const, flex: 1 },

  miniPlan: { gap: 6 },
  miniFloor: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniFloorLabel: { fontSize: 10, fontWeight: '700' as const, width: 22 },
  miniRoomRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', flex: 1 },
  miniRoom: { width: 20, height: 20, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  miniRoomDot: { width: 6, height: 6, borderRadius: 3 },
  miniMore: { fontSize: 10, fontWeight: '600' as const, alignSelf: 'center', marginLeft: 2 },
  planLegend: { flexDirection: 'row', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 10, fontWeight: '500' as const },

  hkStatsRow: { flexDirection: 'row', alignItems: 'center' },
  hkStatItem: { flex: 1, alignItems: 'center' },
  hkStatValue: { fontSize: 22, fontWeight: '800' as const },
  hkStatLabel: { fontSize: 10, fontWeight: '500' as const, marginTop: 2 },
  hkStatDivider: { width: 1, height: 24, backgroundColor: '#E4E3EE' },
  staffList: { gap: 6 },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 0.5 },
  staffName: { fontSize: 12, fontWeight: '600' as const, width: 100 },
  staffRooms: { fontSize: 11, width: 50 },
  staffBar: { flex: 1, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' },
  staffBarFill: { height: 4, borderRadius: 2 },

  satisfactionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F59E0B15',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  scoreValue: { fontSize: 24, fontWeight: '900' as const, color: '#F59E0B' },
  scoreMax: { fontSize: 12, fontWeight: '500' as const, color: '#F59E0B80', marginTop: 6 },
  satisfactionInfo: { flex: 1, gap: 3 },
  satisfactionLabel: { fontSize: 15, fontWeight: '700' as const },
  satisfactionSub: { fontSize: 12 },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 4 },

  alertCountBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  alertCountText: { fontSize: 12, fontWeight: '700' as const, color: '#EF4444' },
  alertItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5 },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertInfo: { flex: 1, gap: 2 },
  alertRoom: { fontSize: 13, fontWeight: '600' as const },
  alertDesc: { fontSize: 11 },

  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', minHeight: 40 },
  timelineLeft: { width: 44, alignItems: 'flex-end', paddingRight: 8, paddingTop: 2 },
  timelineTime: { fontSize: 10, fontWeight: '600' as const },
  timelineLine: { alignItems: 'center', width: 16 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  timelineConnector: { width: 1.5, flex: 1, marginTop: 2 },
  timelineContent: { flex: 1, paddingLeft: 8, paddingBottom: 12 },
  timelineDesc: { fontSize: 12, fontWeight: '500' as const },
  timelineRoom: { fontSize: 10, marginTop: 1 },
  emptyText: { fontSize: 12, textAlign: 'center' as const, paddingVertical: 16 },

  quickLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14 },
  quickLink: {
    width: '47%' as unknown as number,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexGrow: 1,
  },
  quickLinkIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  quickLinkText: { fontSize: 13, fontWeight: '600' as const },
});
