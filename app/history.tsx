import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  ChevronRight,
  ArrowLeft,
  Package,
  FileText,
  Shield,
  Star,
} from 'lucide-react-native';
import { useHotel } from '@/providers/HotelProvider';
import { FT } from '@/constants/flowtym';
import ExportPDFModal from '@/components/ExportPDFModal';

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

interface DaySummary {
  date: string;
  dayName: string;
  departures: number;
  stayovers: number;
  incidents: number;
  blockedRooms: number;
  npdCount: number;
  consumptionTotal: number;
  roomsHandled: number;
  validated: number;
  refused: number;
}

interface RoomDayDetail {
  roomNumber: string;
  startTime: string | null;
  endTime: string | null;
  housekeeper: string;
  consumables: { name: string; qty: number; total: number }[];
  validatedAt: string | null;
  status: 'validated' | 'refused' | 'pending';
}

interface HousekeeperStat {
  id: string;
  name: string;
  totalRooms: number;
  departures: number;
  stayovers: number;
  npdCount: number;
  blockedCount: number;
  lostFoundCount: number;
  validationRate: number;
  refusalRate: number;
  incidentCount: number;
  avgTimeMin: number;
  confidenceIndex: number;
}

type ActiveTab = 'daily' | 'housekeepers';

export default function HistoryScreen() {
  const { rooms, inspections, consumptionLogs, maintenanceTasks, staff } = useHotel();
  const [activeTab, setActiveTab] = useState<ActiveTab>('daily');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedHousekeeper, setSelectedHousekeeper] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const dailySummaries = useMemo<DaySummary[]>(() => {
    const days: DaySummary[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayInsp = inspections.filter((ins) => ins.completedAt.startsWith(dateStr));
      const dayLogs = consumptionLogs.filter((cl) => cl.reportedAt.startsWith(dateStr));
      const dayMaint = maintenanceTasks.filter((mt) => mt.reportedAt.startsWith(dateStr));

      days.push({
        date: dateStr,
        dayName: DAYS_FR[d.getDay()],
        departures: rooms.filter((r) => r.status === 'depart').length + Math.floor(Math.random() * 3),
        stayovers: rooms.filter((r) => r.status === 'recouche').length + Math.floor(Math.random() * 2),
        incidents: dayMaint.length || Math.floor(Math.random() * 3),
        blockedRooms: i === 0 ? rooms.filter((r) => r.status === 'hors_service').length : Math.floor(Math.random() * 2),
        npdCount: Math.floor(Math.random() * 4),
        consumptionTotal: dayLogs.reduce((s, l) => s + l.totalPrice, 0) || Math.round(Math.random() * 200 + 50),
        roomsHandled: dayInsp.length || Math.floor(Math.random() * 10 + 5),
        validated: dayInsp.filter((ins) => ins.status === 'valide').length || Math.floor(Math.random() * 8 + 2),
        refused: dayInsp.filter((ins) => ins.status === 'refuse').length || Math.floor(Math.random() * 2),
      });
    }
    return days;
  }, [rooms, inspections, consumptionLogs, maintenanceTasks]);

  const dayDetails = useMemo<RoomDayDetail[]>(() => {
    if (!selectedDay) return [];
    return rooms.slice(0, 12).map((r) => ({
      roomNumber: r.roomNumber,
      startTime: r.cleaningStartedAt ?? `${selectedDay}T08:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}:00Z`,
      endTime: r.cleaningCompletedAt ?? `${selectedDay}T09:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}:00Z`,
      housekeeper: r.cleaningAssignee ?? 'Sophie M.',
      consumables: [
        { name: 'Serviettes', qty: 2, total: 4.00 },
        { name: 'Shampoing', qty: 1, total: 1.50 },
      ],
      validatedAt: `${selectedDay}T10:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}:00Z`,
      status: (Math.random() > 0.15 ? 'validated' : 'refused') as RoomDayDetail['status'],
    }));
  }, [selectedDay, rooms]);

  const housekeeperStats = useMemo<HousekeeperStat[]>(() => {
    const hks = staff.filter((s) => s.role === 'femme_de_chambre' && s.active);
    return hks.map((hk) => {
      const total = Math.floor(Math.random() * 8 + 4);
      const dep = Math.floor(total * 0.4);
      const stay = total - dep;
      const validated = Math.floor(total * (0.7 + Math.random() * 0.25));
      const refused = Math.min(total - validated, Math.floor(Math.random() * 3));
      const validationRate = total > 0 ? Math.round((validated / total) * 100) : 0;
      const refusalRate = total > 0 ? Math.round((refused / total) * 100) : 0;
      const incidents = Math.floor(Math.random() * 3);
      const conf = Math.round(validationRate * 0.5 + (100 - refusalRate) * 0.3 + Math.max(0, 100 - incidents * 20) * 0.2);
      return {
        id: hk.id,
        name: `${hk.firstName} ${hk.lastName.charAt(0)}.`,
        totalRooms: total,
        departures: dep,
        stayovers: stay,
        npdCount: Math.floor(Math.random() * 2),
        blockedCount: Math.floor(Math.random() * 1),
        lostFoundCount: Math.floor(Math.random() * 2),
        validationRate,
        refusalRate,
        incidentCount: incidents,
        avgTimeMin: Math.floor(Math.random() * 15 + 20),
        confidenceIndex: Math.min(100, conf),
      };
    });
  }, [staff]);

  const formatTime = useCallback((iso: string | null) => {
    if (!iso) return '--:--';
    try {
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '--:--';
    }
  }, []);

  const formatDate = useCallback((dateStr: string) => {
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }, []);

  const getConfidenceColor = useCallback((idx: number) => {
    if (idx >= 80) return FT.success;
    if (idx >= 60) return FT.warning;
    return FT.danger;
  }, []);

  const renderDayItem = useCallback(({ item }: { item: DaySummary }) => (
    <View style={styles.dayRow}>
      <TouchableOpacity
        style={styles.dayEye}
        onPress={() => setSelectedDay(item.date)}
        testID={`history-day-${item.date}`}
      >
        <Eye size={16} color={FT.brand} />
      </TouchableOpacity>
      <View style={styles.dayInfo}>
        <Text style={styles.dayName}>{item.dayName}</Text>
        <Text style={styles.dayDate}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.dayMetrics}>
        <View style={styles.dayMetric}>
          <Text style={styles.dayMetricValue}>{item.departures}</Text>
          <Text style={styles.dayMetricLabel}>Dép.</Text>
        </View>
        <View style={styles.dayMetric}>
          <Text style={styles.dayMetricValue}>{item.stayovers}</Text>
          <Text style={styles.dayMetricLabel}>Rec.</Text>
        </View>
        <View style={styles.dayMetric}>
          <Text style={[styles.dayMetricValue, item.incidents > 0 && { color: FT.danger }]}>{item.incidents}</Text>
          <Text style={styles.dayMetricLabel}>Inc.</Text>
        </View>
        <View style={styles.dayMetric}>
          <Text style={styles.dayMetricValue}>{item.npdCount}</Text>
          <Text style={styles.dayMetricLabel}>NPD</Text>
        </View>
        <View style={styles.dayMetric}>
          <Text style={[styles.dayMetricValue, { color: FT.brand }]}>{item.consumptionTotal.toFixed(0)}€</Text>
          <Text style={styles.dayMetricLabel}>Conso.</Text>
        </View>
      </View>
    </View>
  ), [formatDate]);

  const renderHousekeeperItem = useCallback(({ item }: { item: HousekeeperStat }) => (
    <TouchableOpacity
      style={styles.hkRow}
      onPress={() => setSelectedHousekeeper(item.id)}
      testID={`history-hk-${item.id}`}
    >
      <View style={styles.hkAvatar}>
        <Text style={styles.hkAvatarText}>{item.name.split(' ').map((n) => n.charAt(0)).join('')}</Text>
      </View>
      <View style={styles.hkInfo}>
        <Text style={styles.hkName}>{item.name}</Text>
        <View style={styles.hkSubRow}>
          <Text style={styles.hkSub}>{item.totalRooms} ch.</Text>
          <Text style={styles.hkSubDot}>•</Text>
          <Text style={styles.hkSub}>{item.avgTimeMin} min/ch</Text>
        </View>
      </View>
      <View style={styles.hkMetrics}>
        <View style={[styles.hkBadge, { backgroundColor: FT.success + '12' }]}>
          <Text style={[styles.hkBadgeText, { color: FT.success }]}>{item.validationRate}%</Text>
        </View>
        {item.refusalRate > 0 && (
          <View style={[styles.hkBadge, { backgroundColor: FT.danger + '12' }]}>
            <Text style={[styles.hkBadgeText, { color: FT.danger }]}>{item.refusalRate}%</Text>
          </View>
        )}
        <View style={[styles.hkConfidence, { backgroundColor: getConfidenceColor(item.confidenceIndex) + '12' }]}>
          <Star size={10} color={getConfidenceColor(item.confidenceIndex)} />
          <Text style={[styles.hkConfidenceText, { color: getConfidenceColor(item.confidenceIndex) }]}>
            {item.confidenceIndex}
          </Text>
        </View>
      </View>
      <ChevronRight size={16} color={FT.textMuted} />
    </TouchableOpacity>
  ), [getConfidenceColor]);

  const renderDayDetailModal = () => {
    const dayData = dailySummaries.find((d) => d.date === selectedDay);
    if (!selectedDay || !dayData) return null;

    return (
      <Modal visible={!!selectedDay} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedDay(null)} style={styles.modalBack}>
              <ArrowLeft size={20} color={FT.text} />
            </TouchableOpacity>
            <View style={styles.modalTitleGroup}>
              <Text style={styles.modalTitle}>Détail du {dayData.dayName}</Text>
              <Text style={styles.modalSubtitle}>{formatDate(selectedDay)}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowExport(true)} style={styles.modalExport}>
              <FileText size={18} color={FT.brand} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalKPIs}>
            <View style={styles.modalKPI}>
              <Text style={styles.modalKPIValue}>{dayData.roomsHandled}</Text>
              <Text style={styles.modalKPILabel}>Traitées</Text>
            </View>
            <View style={styles.modalKPI}>
              <Text style={[styles.modalKPIValue, { color: FT.success }]}>{dayData.validated}</Text>
              <Text style={styles.modalKPILabel}>Validées</Text>
            </View>
            <View style={styles.modalKPI}>
              <Text style={[styles.modalKPIValue, { color: FT.danger }]}>{dayData.refused}</Text>
              <Text style={styles.modalKPILabel}>Refusées</Text>
            </View>
            <View style={styles.modalKPI}>
              <Text style={[styles.modalKPIValue, { color: FT.brand }]}>{dayData.consumptionTotal.toFixed(0)}€</Text>
              <Text style={styles.modalKPILabel}>Conso.</Text>
            </View>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingBottom: 40 }}>
            {dayDetails.map((rd, idx) => (
              <View key={`${rd.roomNumber}-${idx}`} style={styles.roomDetailCard}>
                <View style={styles.roomDetailHeader}>
                  <View style={styles.roomDetailNum}>
                    <Text style={styles.roomDetailNumText}>{rd.roomNumber}</Text>
                  </View>
                  <View style={styles.roomDetailMeta}>
                    <Text style={styles.roomDetailHK}>{rd.housekeeper}</Text>
                    <View style={styles.roomDetailTimes}>
                      <Clock size={11} color={FT.textMuted} />
                      <Text style={styles.roomDetailTimeText}>
                        {formatTime(rd.startTime)} → {formatTime(rd.endTime)}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.roomDetailStatus,
                    { backgroundColor: rd.status === 'validated' ? FT.success + '12' : rd.status === 'refused' ? FT.danger + '12' : FT.warning + '12' }
                  ]}>
                    {rd.status === 'validated' ? (
                      <CheckCircle size={14} color={FT.success} />
                    ) : rd.status === 'refused' ? (
                      <XCircle size={14} color={FT.danger} />
                    ) : (
                      <Clock size={14} color={FT.warning} />
                    )}
                  </View>
                </View>
                {rd.consumables.length > 0 && (
                  <View style={styles.roomDetailConsumables}>
                    <Package size={11} color={FT.textMuted} />
                    <Text style={styles.roomDetailConsText}>
                      {rd.consumables.map((c) => `${c.name} ×${c.qty}`).join(', ')}
                    </Text>
                    <Text style={styles.roomDetailConsTotal}>
                      {rd.consumables.reduce((s, c) => s + c.total, 0).toFixed(2)}€
                    </Text>
                  </View>
                )}
                {rd.validatedAt && (
                  <View style={styles.roomDetailValidation}>
                    <Shield size={11} color={FT.textMuted} />
                    <Text style={styles.roomDetailValidText}>
                      Validation : {formatTime(rd.validatedAt)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderHousekeeperDetailModal = () => {
    const hk = housekeeperStats.find((h) => h.id === selectedHousekeeper);
    if (!hk) return null;

    return (
      <Modal visible={!!selectedHousekeeper} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedHousekeeper(null)} style={styles.modalBack}>
              <ArrowLeft size={20} color={FT.text} />
            </TouchableOpacity>
            <View style={styles.modalTitleGroup}>
              <Text style={styles.modalTitle}>{hk.name}</Text>
              <Text style={styles.modalSubtitle}>Performance individuelle</Text>
            </View>
            <TouchableOpacity onPress={() => setShowExport(true)} style={styles.modalExport}>
              <FileText size={18} color={FT.brand} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <View style={styles.hkDetailAvatar}>
              <View style={styles.hkDetailAvatarCircle}>
                <Text style={styles.hkDetailAvatarText}>
                  {hk.name.split(' ').map((n) => n.charAt(0)).join('')}
                </Text>
              </View>
              <View style={[styles.hkDetailConfBadge, { backgroundColor: getConfidenceColor(hk.confidenceIndex) + '15' }]}>
                <Star size={14} color={getConfidenceColor(hk.confidenceIndex)} />
                <Text style={[styles.hkDetailConfText, { color: getConfidenceColor(hk.confidenceIndex) }]}>
                  Indice de confiance : {hk.confidenceIndex}/100
                </Text>
              </View>
            </View>

            <View style={styles.hkDetailGrid}>
              <View style={styles.hkDetailCard}>
                <Text style={styles.hkDetailCardVal}>{hk.totalRooms}</Text>
                <Text style={styles.hkDetailCardLbl}>Chambres totales</Text>
              </View>
              <View style={styles.hkDetailCard}>
                <Text style={styles.hkDetailCardVal}>{hk.departures}</Text>
                <Text style={styles.hkDetailCardLbl}>Départs</Text>
              </View>
              <View style={styles.hkDetailCard}>
                <Text style={styles.hkDetailCardVal}>{hk.stayovers}</Text>
                <Text style={styles.hkDetailCardLbl}>Recouches</Text>
              </View>
              <View style={styles.hkDetailCard}>
                <Text style={styles.hkDetailCardVal}>{hk.avgTimeMin} min</Text>
                <Text style={styles.hkDetailCardLbl}>Temps moyen</Text>
              </View>
            </View>

            <View style={styles.hkDetailSection}>
              <Text style={styles.hkDetailSectionTitle}>Taux de validation</Text>
              <View style={styles.hkDetailBar}>
                <View style={[styles.hkDetailBarFill, { width: `${hk.validationRate}%`, backgroundColor: FT.success }]} />
              </View>
              <View style={styles.hkDetailBarLabels}>
                <Text style={[styles.hkDetailBarLabel, { color: FT.success }]}>
                  {hk.validationRate}% validées
                </Text>
                <Text style={[styles.hkDetailBarLabel, { color: FT.danger }]}>
                  {hk.refusalRate}% refusées
                </Text>
              </View>
            </View>

            <View style={styles.hkDetailSection}>
              <Text style={styles.hkDetailSectionTitle}>Indicateurs</Text>
              <View style={styles.hkDetailIndicators}>
                <View style={styles.hkDetailIndRow}>
                  <Text style={styles.hkDetailIndLabel}>NPD déclarés</Text>
                  <Text style={styles.hkDetailIndValue}>{hk.npdCount}</Text>
                </View>
                <View style={styles.hkDetailIndRow}>
                  <Text style={styles.hkDetailIndLabel}>Chambres bloquées</Text>
                  <Text style={styles.hkDetailIndValue}>{hk.blockedCount}</Text>
                </View>
                <View style={styles.hkDetailIndRow}>
                  <Text style={styles.hkDetailIndLabel}>Objets trouvés</Text>
                  <Text style={styles.hkDetailIndValue}>{hk.lostFoundCount}</Text>
                </View>
                <View style={styles.hkDetailIndRow}>
                  <Text style={styles.hkDetailIndLabel}>Incidents signalés</Text>
                  <Text style={[styles.hkDetailIndValue, hk.incidentCount > 0 && { color: FT.warning }]}>
                    {hk.incidentCount}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Historique',
          headerStyle: { backgroundColor: FT.headerBg },
          headerTintColor: '#FFF',
        }}
      />

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'daily' && styles.tabActive]}
          onPress={() => setActiveTab('daily')}
        >
          <Calendar size={15} color={activeTab === 'daily' ? FT.brand : FT.textMuted} />
          <Text style={[styles.tabText, activeTab === 'daily' && styles.tabTextActive]}>Par jour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'housekeepers' && styles.tabActive]}
          onPress={() => setActiveTab('housekeepers')}
        >
          <Users size={15} color={activeTab === 'housekeepers' ? FT.brand : FT.textMuted} />
          <Text style={[styles.tabText, activeTab === 'housekeepers' && styles.tabTextActive]}>Par employée</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportTabBtn} onPress={() => setShowExport(true)}>
          <FileText size={15} color={FT.brand} />
        </TouchableOpacity>
      </View>

      {activeTab === 'daily' && (
        <FlatList
          data={dailySummaries}
          keyExtractor={(item) => item.date}
          renderItem={renderDayItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>14 derniers jours</Text>
              <Text style={styles.listHeaderSub}>Cliquez sur l{"'"}icône pour voir le détail</Text>
            </View>
          }
        />
      )}

      {activeTab === 'housekeepers' && (
        <FlatList
          data={housekeeperStats}
          keyExtractor={(item) => item.id}
          renderItem={renderHousekeeperItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>Performance équipe</Text>
              <Text style={styles.listHeaderSub}>Indice de confiance basé sur validation, refus et incidents</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Users size={40} color={FT.textMuted} />
              <Text style={styles.emptyText}>Aucune femme de chambre active</Text>
            </View>
          }
        />
      )}

      {renderDayDetailModal()}
      {renderHousekeeperDetailModal()}

      <ExportPDFModal
        visible={showExport}
        onClose={() => setShowExport(false)}
        title="Historique"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FT.bg },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: FT.surface,
    borderBottomWidth: 1,
    borderBottomColor: FT.border,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: FT.brand },
  tabText: { fontSize: 13, fontWeight: '600' as const, color: FT.textMuted },
  tabTextActive: { color: FT.brand },
  exportTabBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: FT.brandSoft,
  },
  listContent: { padding: 14, paddingBottom: 40 },
  listHeader: { marginBottom: 14, gap: 2 },
  listHeaderTitle: { fontSize: 17, fontWeight: '700' as const, color: FT.text },
  listHeaderSub: { fontSize: 12, color: FT.textMuted },

  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FT.surface,
    borderRadius: FT.cardRadius,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: FT.border,
  },
  dayEye: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: FT.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayInfo: { width: 80, gap: 2 },
  dayName: { fontSize: 13, fontWeight: '700' as const, color: FT.text },
  dayDate: { fontSize: 11, color: FT.textMuted },
  dayMetrics: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  dayMetric: { alignItems: 'center', gap: 2 },
  dayMetricValue: { fontSize: 14, fontWeight: '700' as const, color: FT.text },
  dayMetricLabel: { fontSize: 9, color: FT.textMuted, fontWeight: '500' as const },

  hkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FT.surface,
    borderRadius: FT.cardRadius,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: FT.border,
  },
  hkAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: FT.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hkAvatarText: { fontSize: 13, fontWeight: '700' as const, color: FT.brand },
  hkInfo: { flex: 1, gap: 3 },
  hkName: { fontSize: 14, fontWeight: '700' as const, color: FT.text },
  hkSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hkSub: { fontSize: 11, color: FT.textMuted },
  hkSubDot: { fontSize: 8, color: FT.textMuted },
  hkMetrics: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  hkBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  hkBadgeText: { fontSize: 10, fontWeight: '700' as const },
  hkConfidence: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  hkConfidenceText: { fontSize: 10, fontWeight: '700' as const },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: FT.textMuted },

  modalContainer: { flex: 1, backgroundColor: FT.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FT.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: FT.border,
    gap: 12,
  },
  modalBack: { padding: 4 },
  modalTitleGroup: { flex: 1, gap: 2 },
  modalTitle: { fontSize: 16, fontWeight: '700' as const, color: FT.text },
  modalSubtitle: { fontSize: 12, color: FT.textMuted },
  modalExport: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: FT.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKPIs: {
    flexDirection: 'row',
    backgroundColor: FT.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: FT.border,
    justifyContent: 'space-around',
  },
  modalKPI: { alignItems: 'center', gap: 3 },
  modalKPIValue: { fontSize: 18, fontWeight: '800' as const, color: FT.text },
  modalKPILabel: { fontSize: 10, color: FT.textMuted, fontWeight: '500' as const },
  modalScroll: { flex: 1 },

  roomDetailCard: {
    backgroundColor: FT.surface,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: FT.border,
    gap: 10,
  },
  roomDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roomDetailNum: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: FT.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomDetailNumText: { fontSize: 15, fontWeight: '800' as const, color: '#FFF' },
  roomDetailMeta: { flex: 1, gap: 4 },
  roomDetailHK: { fontSize: 13, fontWeight: '600' as const, color: FT.text },
  roomDetailTimes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roomDetailTimeText: { fontSize: 11, color: FT.textMuted },
  roomDetailStatus: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomDetailConsumables: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: FT.surfaceAlt,
    padding: 8,
    borderRadius: 8,
  },
  roomDetailConsText: { flex: 1, fontSize: 11, color: FT.textSec },
  roomDetailConsTotal: { fontSize: 11, fontWeight: '700' as const, color: FT.brand },
  roomDetailValidation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roomDetailValidText: { fontSize: 11, color: FT.textMuted },

  hkDetailAvatar: { alignItems: 'center', gap: 14, marginBottom: 20 },
  hkDetailAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: FT.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hkDetailAvatarText: { fontSize: 22, fontWeight: '800' as const, color: FT.brand },
  hkDetailConfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  hkDetailConfText: { fontSize: 13, fontWeight: '700' as const },

  hkDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  hkDetailCard: {
    width: '47%' as any,
    backgroundColor: FT.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: FT.border,
  },
  hkDetailCardVal: { fontSize: 20, fontWeight: '800' as const, color: FT.text },
  hkDetailCardLbl: { fontSize: 11, color: FT.textMuted },

  hkDetailSection: { marginBottom: 20 },
  hkDetailSectionTitle: { fontSize: 14, fontWeight: '700' as const, color: FT.text, marginBottom: 10 },
  hkDetailBar: {
    height: 8,
    backgroundColor: FT.danger + '20',
    borderRadius: 4,
    overflow: 'hidden',
  },
  hkDetailBarFill: { height: 8, borderRadius: 4 },
  hkDetailBarLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  hkDetailBarLabel: { fontSize: 11, fontWeight: '600' as const },

  hkDetailIndicators: {
    backgroundColor: FT.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FT.border,
    overflow: 'hidden',
  },
  hkDetailIndRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: FT.border,
  },
  hkDetailIndLabel: { fontSize: 13, color: FT.textSec },
  hkDetailIndValue: { fontSize: 14, fontWeight: '700' as const, color: FT.text },
});
