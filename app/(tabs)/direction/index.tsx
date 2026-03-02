import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Coffee,
  UserPlus,
  BedDouble,
  Users,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';
import UserMenuButton from '@/components/UserMenuButton';
import FlowtymHeader from '@/components/FlowtymHeader';
import DeskRoomChip from '@/components/DeskRoomChip';
import { useHotel } from '@/providers/HotelProvider';
import { useAuth } from '@/providers/AuthProvider';
import { FT } from '@/constants/flowtym';
import { ROOM_STATUS_CONFIG } from '@/constants/types';

export default function DirectionDashboard() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const {
    rooms,
    staff,
    maintenanceTasks,
    breakfastOrders,
    pendingInspections,
    todayConsumptionTotal,
  } = useHotel();

  const roomStats = useMemo(() => {
    const total = rooms.length;
    const occupe = rooms.filter((r) => r.status === 'occupe').length;
    const libre = rooms.filter((r) => r.status === 'libre').length;
    const depart = rooms.filter((r) => r.status === 'depart').length;
    const recouche = rooms.filter((r) => r.status === 'recouche').length;
    const horsService = rooms.filter((r) => r.status === 'hors_service').length;
    const occupancyRate = total > 0 ? Math.round(((occupe + depart + recouche) / total) * 100) : 0;
    const cleaningDone = rooms.filter((r) => r.cleaningStatus === 'validee').length;
    const cleaningRate = total > 0 ? Math.round((cleaningDone / total) * 100) : 0;
    return { total, occupe, libre, depart, recouche, horsService, occupancyRate, cleaningDone, cleaningRate };
  }, [rooms]);

  const maintenanceStats = useMemo(() => ({
    pending: maintenanceTasks.filter((t) => t.status === 'en_attente').length,
    inProgress: maintenanceTasks.filter((t) => t.status === 'en_cours').length,
    urgent: maintenanceTasks.filter((t) => t.priority === 'haute' && t.status !== 'resolu').length,
  }), [maintenanceTasks]);

  const breakfastStats = useMemo(() => ({
    toPrepare: breakfastOrders.filter((o) => o.status === 'a_preparer').length,
    served: breakfastOrders.filter((o) => o.status === 'servi').length,
    paid: breakfastOrders.filter((o) => !o.included && o.status === 'servi').length,
  }), [breakfastOrders]);

  const activeHousekeepers = useMemo(() =>
    staff.filter((s) => s.role === 'femme_de_chambre' && s.active),
    [staff]
  );

  const groupedByFloor = useMemo(() => {
    const floorSet = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b);
    return floorSet.map((floor) => ({
      floor,
      rooms: rooms.filter((r) => r.floor === floor).sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)),
    }));
  }, [rooms]);

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <FlowtymHeader
              hotelName={currentUser?.hotelName ?? 'Direction'}
              navItems={[
                { label: 'Statistiques', icon: '📊' },
                { label: 'Rapports', icon: '📋' },
              ]}
            />
          ),
          headerStyle: { backgroundColor: FT.headerBg },
          headerTintColor: '#FFF',
          headerShadowVisible: false,
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => router.push('/team')} style={styles.headerBtn}>
                <UserPlus size={18} color="#FFF" />
              </TouchableOpacity>
              <UserMenuButton />
            </View>
          ),
        }}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>Bonjour, {currentUser?.firstName ?? 'Direction'}</Text>
            <Text style={styles.dateText}>{today}</Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, styles.kpiCardHighlight]}>
            <View style={[styles.kpiIconCircle, { backgroundColor: FT.brand + '15' }]}>
              <TrendingUp size={18} color={FT.brand} />
            </View>
            <Text style={styles.kpiValue}>{roomStats.occupancyRate}%</Text>
            <Text style={styles.kpiLabel}>Occupation</Text>
            <View style={styles.kpiBar}>
              <View style={[styles.kpiBarFill, { width: `${roomStats.occupancyRate}%`, backgroundColor: FT.brand }]} />
            </View>
          </View>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconCircle, { backgroundColor: FT.dangerSoft }]}>
              <BedDouble size={18} color={FT.danger} />
            </View>
            <Text style={styles.kpiValue}>{roomStats.depart}</Text>
            <Text style={styles.kpiLabel}>Départs</Text>
          </View>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconCircle, { backgroundColor: FT.successSoft }]}>
              <Sparkles size={18} color={FT.success} />
            </View>
            <Text style={styles.kpiValue}>{roomStats.cleaningRate}%</Text>
            <Text style={styles.kpiLabel}>Propreté</Text>
          </View>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconCircle, { backgroundColor: FT.warningSoft }]}>
              <Wrench size={18} color={FT.warning} />
            </View>
            <Text style={styles.kpiValue}>{maintenanceStats.pending + maintenanceStats.inProgress}</Text>
            <Text style={styles.kpiLabel}>Maintenance</Text>
          </View>
        </View>

        {(maintenanceStats.urgent > 0 || pendingInspections.length > 0 || breakfastStats.toPrepare > 0) && (
          <View style={styles.alertsCard}>
            <Text style={styles.widgetTitle}>Alertes du jour</Text>
            {maintenanceStats.urgent > 0 && (
              <View style={styles.alertRow}>
                <View style={[styles.alertDot, { backgroundColor: FT.danger }]} />
                <AlertTriangle size={14} color={FT.danger} />
                <Text style={styles.alertText}>{maintenanceStats.urgent} intervention(s) urgente(s)</Text>
              </View>
            )}
            {pendingInspections.length > 0 && (
              <View style={styles.alertRow}>
                <View style={[styles.alertDot, { backgroundColor: FT.warning }]} />
                <Clock size={14} color={FT.warning} />
                <Text style={styles.alertText}>{pendingInspections.length} chambre(s) à valider</Text>
              </View>
            )}
            {breakfastStats.toPrepare > 0 && (
              <View style={styles.alertRow}>
                <View style={[styles.alertDot, { backgroundColor: FT.info }]} />
                <Coffee size={14} color={FT.info} />
                <Text style={styles.alertText}>{breakfastStats.toPrepare} PDJ à préparer</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.widgetCard}>
          <View style={styles.widgetHeader}>
            <Text style={styles.widgetTitle}>Statuts des chambres</Text>
            <Text style={styles.widgetSub}>{roomStats.total} chambres</Text>
          </View>
          <View style={styles.statusChipsRow}>
            {(['libre', 'occupe', 'depart', 'recouche', 'hors_service'] as const).map((status) => {
              const config = ROOM_STATUS_CONFIG[status];
              const count = rooms.filter((r) => r.status === status).length;
              return (
                <View key={status} style={styles.statusChip}>
                  <View style={[styles.statusChipDot, { backgroundColor: config.color }]} />
                  <Text style={styles.statusChipCount}>{count}</Text>
                  <Text style={styles.statusChipLabel}>{config.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.widgetCard}>
          <View style={styles.widgetHeader}>
            <Text style={styles.widgetTitle}>Plan des étages</Text>
          </View>
          {groupedByFloor.map(({ floor, rooms: floorRooms }) => (
            <View key={floor} style={styles.floorBlock}>
              <Text style={styles.floorLabel}>Étage {floor}</Text>
              <View style={styles.roomChipGrid}>
                {floorRooms.map((room) => (
                  <DeskRoomChip
                    key={room.id}
                    roomNumber={room.roomNumber}
                    status={room.status}
                    cleaningStatus={room.cleaningStatus}
                    clientBadge={room.clientBadge}
                    onPress={() => router.push({ pathname: '/room-details', params: { roomId: room.id } })}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.widgetCard, styles.twoColCard]}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>PDJ</Text>
            </View>
            <View style={styles.pdjStatsCol}>
              <View style={styles.pdjStatRow}>
                <Coffee size={14} color={FT.warning} />
                <Text style={styles.pdjStatValue}>{breakfastStats.toPrepare}</Text>
                <Text style={styles.pdjStatLabel}>À préparer</Text>
              </View>
              <View style={styles.pdjStatRow}>
                <CheckCircle size={14} color={FT.success} />
                <Text style={styles.pdjStatValue}>{breakfastStats.served}</Text>
                <Text style={styles.pdjStatLabel}>Servis</Text>
              </View>
              <View style={styles.pdjStatRow}>
                <Text style={styles.pdjEmoji}>💰</Text>
                <Text style={styles.pdjStatValue}>{breakfastStats.paid}</Text>
                <Text style={styles.pdjStatLabel}>Payants</Text>
              </View>
            </View>
          </View>

          <View style={[styles.widgetCard, styles.twoColCard]}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>Économat</Text>
            </View>
            <Text style={styles.economatValue}>{todayConsumptionTotal.toFixed(0)}€</Text>
            <Text style={styles.economatLabel}>Consommations du jour</Text>
            <TouchableOpacity
              style={styles.economatBtn}
              onPress={() => router.push('/economat')}
              activeOpacity={0.7}
            >
              <Text style={styles.economatBtnText}>Voir détails</Text>
              <ArrowRight size={12} color={FT.brand} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.widgetCard}>
          <View style={styles.widgetHeader}>
            <Text style={styles.widgetTitle}>Équipe du jour</Text>
            <TouchableOpacity onPress={() => router.push('/team')} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>Voir tout</Text>
              <ArrowRight size={12} color={FT.brand} />
            </TouchableOpacity>
          </View>
          {activeHousekeepers.map((hk) => {
            const assigned = rooms.filter((r) => r.assignedTo === hk.id).length;
            const loadPercent = hk.maxLoad > 0 ? Math.round((hk.currentLoad / hk.maxLoad) * 100) : 0;
            const loadColor = loadPercent > 80 ? FT.danger : loadPercent > 50 ? FT.warning : FT.success;
            return (
              <View key={hk.id} style={styles.staffRow}>
                <View style={styles.staffAvatar}>
                  <Text style={styles.staffAvatarText}>{hk.firstName[0]}{hk.lastName[0]}</Text>
                </View>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{hk.firstName} {hk.lastName}</Text>
                  <View style={styles.loadRow}>
                    <View style={styles.loadBarBg}>
                      <View style={[styles.loadBarFill, { width: `${loadPercent}%`, backgroundColor: loadColor }]} />
                    </View>
                    <Text style={styles.loadText}>{hk.currentLoad}/{hk.maxLoad}</Text>
                  </View>
                </View>
                <View style={[styles.staffCountBadge, { backgroundColor: loadColor + '15' }]}>
                  <Text style={[styles.staffCountText, { color: loadColor }]}>{assigned} ch.</Text>
                </View>
              </View>
            );
          })}
          {activeHousekeepers.length === 0 && (
            <View style={styles.emptyStaff}>
              <Users size={20} color={FT.textMuted} />
              <Text style={styles.emptyStaffText}>Aucune femme de chambre active</Text>
            </View>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FT.bg },
  headerRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  headerBtn: { padding: 4 },
  scroll: { flex: 1 },
  content: { padding: 14, gap: 14 },

  greetingRow: { paddingVertical: 4 },
  greeting: { fontSize: 22, fontWeight: '800' as const, color: FT.text },
  dateText: { fontSize: 13, color: FT.textSec, marginTop: 2, textTransform: 'capitalize' as const },

  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    width: '47%' as unknown as number,
    backgroundColor: FT.surface,
    borderRadius: FT.cardRadius,
    padding: 14,
    borderWidth: 1,
    borderColor: FT.border,
    flexGrow: 1,
    gap: 4,
  },
  kpiCardHighlight: { borderColor: FT.brand + '40', borderWidth: 1.5 },
  kpiIconCircle: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  kpiValue: { fontSize: 28, fontWeight: '800' as const, color: FT.text },
  kpiLabel: { fontSize: 11, color: FT.textSec, fontWeight: '500' as const },
  kpiBar: { height: 4, backgroundColor: FT.bg, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  kpiBarFill: { height: 4, borderRadius: 2 },

  alertsCard: { backgroundColor: FT.surface, borderRadius: FT.cardRadius, padding: 16, borderWidth: 1, borderColor: FT.warning + '30', gap: 10 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertDot: { width: 6, height: 6, borderRadius: 3 },
  alertText: { fontSize: 13, color: FT.text, fontWeight: '500' as const, flex: 1 },

  widgetCard: { backgroundColor: FT.surface, borderRadius: FT.cardRadius, padding: 16, borderWidth: 1, borderColor: FT.border, gap: 12 },
  widgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  widgetTitle: { fontSize: 15, fontWeight: '700' as const, color: FT.text },
  widgetSub: { fontSize: 12, color: FT.textMuted, fontWeight: '500' as const },

  statusChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: FT.surfaceAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: FT.border },
  statusChipDot: { width: 8, height: 8, borderRadius: 4 },
  statusChipCount: { fontSize: 14, fontWeight: '700' as const, color: FT.text },
  statusChipLabel: { fontSize: 11, color: FT.textMuted },

  floorBlock: { marginBottom: 6 },
  floorLabel: { fontSize: 11, fontWeight: '700' as const, color: FT.textSec, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 },
  roomChipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  twoColRow: { flexDirection: 'row', gap: 10 },
  twoColCard: { flex: 1 },

  pdjStatsCol: { gap: 8 },
  pdjStatRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pdjStatValue: { fontSize: 16, fontWeight: '700' as const, color: FT.text, minWidth: 20 },
  pdjStatLabel: { fontSize: 11, color: FT.textMuted },
  pdjEmoji: { fontSize: 14 },

  economatValue: { fontSize: 26, fontWeight: '800' as const, color: FT.text },
  economatLabel: { fontSize: 11, color: FT.textSec },
  economatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  economatBtnText: { fontSize: 12, fontWeight: '600' as const, color: FT.brand },

  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllText: { fontSize: 12, color: FT.brand, fontWeight: '600' as const },

  staffRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10, borderBottomWidth: 1, borderBottomColor: FT.border },
  staffAvatar: { width: 38, height: 38, borderRadius: 10, backgroundColor: FT.brandSoft, justifyContent: 'center', alignItems: 'center' },
  staffAvatarText: { fontSize: 13, fontWeight: '700' as const, color: FT.brand },
  staffInfo: { flex: 1, gap: 4 },
  staffName: { fontSize: 13, fontWeight: '600' as const, color: FT.text },
  loadRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadBarBg: { flex: 1, height: 4, backgroundColor: FT.bg, borderRadius: 2, overflow: 'hidden' },
  loadBarFill: { height: 4, borderRadius: 2 },
  loadText: { fontSize: 10, color: FT.textMuted, fontWeight: '500' as const },
  staffCountBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  staffCountText: { fontSize: 11, fontWeight: '600' as const },

  emptyStaff: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16, justifyContent: 'center' },
  emptyStaffText: { fontSize: 13, color: FT.textMuted },
});
