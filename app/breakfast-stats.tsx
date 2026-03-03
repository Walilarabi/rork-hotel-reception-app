import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { Users, Coffee, DollarSign, ChevronRight, Star } from 'lucide-react-native';
import { useHotel } from '@/providers/HotelProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Colors } from '@/constants/colors';
import { BreakfastService, BREAKFAST_STAFF_POSITIONS } from '@/constants/types';

type PeriodFilter = 'today' | 'week' | 'month' | 'all';
type ViewMode = 'overview' | 'history' | 'staff';

function getDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function isInPeriod(dateStr: string, period: PeriodFilter): boolean {
  if (period === 'all') return true;
  const now = new Date();
  const date = new Date(dateStr);
  if (period === 'today') return getDateStr(date) === getDateStr(now);
  if (period === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  }
  if (period === 'month') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  return true;
}

export default function BreakfastStatsScreen() {
  const { theme } = useTheme();
  const { breakfastServices, breakfastStaff, breakfastConfig } = useHotel();

  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const filtered = useMemo(() =>
    breakfastServices.filter((s) => isInPeriod(s.serviceDate, period)),
    [breakfastServices, period]
  );

  const kpis = useMemo(() => {
    const totalCouverts = filtered.reduce((s, sv) => s + sv.adults + sv.children, 0);
    const totalAdults = filtered.reduce((s, sv) => s + sv.adults, 0);
    const totalChildren = filtered.reduce((s, sv) => s + sv.children, 0);
    const included = filtered.filter((s) => s.included).length;
    const notIncluded = filtered.filter((s) => !s.included).length;
    const inRoom = filtered.filter((s) => s.location === 'chambre').length;
    const inDining = filtered.filter((s) => s.location === 'salle').length;

    let ca = 0;
    filtered.forEach((s) => {
      if (!s.included) {
        const adultPrice = s.location === 'chambre' ? breakfastConfig.adultPriceRoom : breakfastConfig.adultPriceDining;
        ca += s.adults * adultPrice + s.children * breakfastConfig.childPrice;
      }
    });
    if (filtered.some((s) => s.amount > 0)) {
      ca = filtered.reduce((sum, s) => sum + s.amount, 0);
    }

    const scores = filtered.filter((s) => s.satisfactionScore !== null).map((s) => s.satisfactionScore!);
    const avgSatisfaction = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const occupancyRate = breakfastConfig.seatingCapacity > 0
      ? Math.round((inDining / Math.max(1, filtered.length)) * 100)
      : 0;

    return { totalCouverts, totalAdults, totalChildren, included, notIncluded, inRoom, inDining, ca, avgSatisfaction, occupancyRate };
  }, [filtered, breakfastConfig]);

  const historyByDay = useMemo(() => {
    const map = new Map<string, { date: string; dayLabel: string; services: BreakfastService[]; totalCouverts: number; ca: number }>();
    filtered.forEach((s) => {
      const date = s.serviceDate;
      if (!map.has(date)) {
        const d = new Date(date);
        const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        map.set(date, { date, dayLabel, services: [], totalCouverts: 0, ca: 0 });
      }
      const entry = map.get(date)!;
      entry.services.push(s);
      entry.totalCouverts += s.adults + s.children;
      entry.ca += s.amount;
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filtered]);

  const staffStats = useMemo(() => {
    const map = new Map<string, { staff: typeof breakfastStaff[0] | null; name: string; servicesCount: number; totalCouverts: number; avgSatisfaction: number; scores: number[] }>();
    filtered.forEach((s) => {
      const key = s.staffId ?? 'unknown';
      if (!map.has(key)) {
        const staff = breakfastStaff.find((bs) => bs.id === s.staffId) ?? null;
        map.set(key, { staff, name: s.staffName || 'Inconnu', servicesCount: 0, totalCouverts: 0, avgSatisfaction: 0, scores: [] });
      }
      const entry = map.get(key)!;
      entry.servicesCount++;
      entry.totalCouverts += s.adults + s.children;
      if (s.satisfactionScore !== null) entry.scores.push(s.satisfactionScore);
    });
    return Array.from(map.values()).map((entry) => ({
      ...entry,
      avgSatisfaction: entry.scores.length > 0 ? entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length : 0,
    })).sort((a, b) => b.totalCouverts - a.totalCouverts);
  }, [filtered, breakfastStaff]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Stats Petit-déjeuner',
          headerStyle: { backgroundColor: theme.headerBg },
          headerTintColor: '#FFF',
        }}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodRow} contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 8 }}>
        {[
          { key: 'today' as PeriodFilter, label: "Aujourd'hui" },
          { key: 'week' as PeriodFilter, label: 'Semaine' },
          { key: 'month' as PeriodFilter, label: 'Mois' },
          { key: 'all' as PeriodFilter, label: 'Tout' },
        ].map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodBtn, period === p.key && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.periodText, period === p.key && { color: '#FFF' }]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: '#3B82F615' }]}>
            <Users size={18} color="#3B82F6" />
          </View>
          <Text style={styles.kpiValue}>{kpis.totalCouverts}</Text>
          <Text style={styles.kpiLabel}>Couverts</Text>
        </View>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: '#22C55E15' }]}>
            <DollarSign size={18} color="#22C55E" />
          </View>
          <Text style={styles.kpiValue}>{kpis.ca.toFixed(0)}€</Text>
          <Text style={styles.kpiLabel}>CA Payant</Text>
        </View>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: '#F59E0B15' }]}>
            <Star size={18} color="#F59E0B" />
          </View>
          <Text style={styles.kpiValue}>{kpis.avgSatisfaction > 0 ? kpis.avgSatisfaction.toFixed(1) : '—'}</Text>
          <Text style={styles.kpiLabel}>Satisfaction</Text>
        </View>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: '#6B5CE715' }]}>
            <Coffee size={18} color="#6B5CE7" />
          </View>
          <Text style={styles.kpiValue}>{filtered.length}</Text>
          <Text style={styles.kpiLabel}>Services</Text>
        </View>
      </View>

      <View style={styles.splitRow}>
        <View style={styles.splitCard}>
          <Text style={styles.splitTitle}>Lieu</Text>
          <View style={styles.splitItem}>
            <View style={[styles.splitDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.splitLabel}>Salle</Text>
            <Text style={styles.splitValue}>{kpis.inDining}</Text>
          </View>
          <View style={styles.splitItem}>
            <View style={[styles.splitDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.splitLabel}>Chambre</Text>
            <Text style={styles.splitValue}>{kpis.inRoom}</Text>
          </View>
        </View>
        <View style={styles.splitCard}>
          <Text style={styles.splitTitle}>Inclusion</Text>
          <View style={styles.splitItem}>
            <View style={[styles.splitDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.splitLabel}>Inclus</Text>
            <Text style={styles.splitValue}>{kpis.included}</Text>
          </View>
          <View style={styles.splitItem}>
            <View style={[styles.splitDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.splitLabel}>Payant</Text>
            <Text style={styles.splitValue}>{kpis.notIncluded}</Text>
          </View>
        </View>
      </View>

      <View style={styles.viewTabs}>
        {[
          { key: 'overview' as ViewMode, label: '📊 Vue' },
          { key: 'history' as ViewMode, label: '📋 Historique' },
          { key: 'staff' as ViewMode, label: '👥 Personnel' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.viewTab, viewMode === tab.key && { borderBottomColor: theme.primary }]}
            onPress={() => setViewMode(tab.key)}
          >
            <Text style={[styles.viewTabText, viewMode === tab.key && { color: theme.primary, fontWeight: '700' as const }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {viewMode === 'overview' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Résumé détaillé</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Adultes</Text>
              <Text style={styles.summaryValue}>{kpis.totalAdults}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Enfants</Text>
              <Text style={styles.summaryValue}>{kpis.totalChildren}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Places assises</Text>
              <Text style={styles.summaryValue}>{breakfastConfig.seatingCapacity}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Cafetières en service</Text>
              <Text style={styles.summaryValue}>{staffStats.length}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {viewMode === 'history' && (
        <FlatList
          data={historyByDay}
          keyExtractor={(item) => item.date}
          contentContainerStyle={{ padding: 14, paddingBottom: 40, gap: 10 }}
          renderItem={({ item }) => {
            const isExpanded = expandedDay === item.date;
            return (
              <View style={styles.historyCard}>
                <TouchableOpacity style={styles.historyHeader} onPress={() => setExpandedDay(isExpanded ? null : item.date)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDayLabel}>{item.dayLabel}</Text>
                    <Text style={styles.historyDayMeta}>{item.totalCouverts} couverts • {item.services.length} services</Text>
                  </View>
                  {item.ca > 0 && <Text style={styles.historyDayCa}>{item.ca.toFixed(0)}€</Text>}
                  <ChevronRight size={16} color="#8A9AA8" style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }} />
                </TouchableOpacity>
                {isExpanded && item.services.map((s) => (
                  <View key={s.id} style={styles.serviceRow}>
                    <Text style={styles.serviceRoom}>Ch. {s.roomNumber}</Text>
                    <Text style={styles.serviceInfo}>{s.adults}A{s.children > 0 ? `+${s.children}E` : ''} • {s.location === 'salle' ? '🍽️' : '🛏️'}</Text>
                    <Text style={styles.serviceStaff}>{s.staffName}</Text>
                    {s.satisfactionScore !== null && (
                      <View style={styles.satisfactionBadge}>
                        <Star size={10} color="#F59E0B" />
                        <Text style={styles.satisfactionText}>{s.satisfactionScore}</Text>
                      </View>
                    )}
                    {!s.included && <Text style={styles.servicePaid}>💰</Text>}
                  </View>
                ))}
              </View>
            );
          }}
          ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyIcon}>📋</Text><Text style={styles.emptyText}>Aucun historique</Text></View>}
        />
      )}

      {viewMode === 'staff' && (
        <FlatList
          data={staffStats}
          keyExtractor={(item) => item.name}
          contentContainerStyle={{ padding: 14, paddingBottom: 40, gap: 10 }}
          renderItem={({ item }) => {
            const posConfig = item.staff ? BREAKFAST_STAFF_POSITIONS[item.staff.position] : null;
            return (
              <View style={styles.staffStatCard}>
                <View style={styles.staffStatAvatar}>
                  <Text style={styles.staffStatInitials}>
                    {item.name.split(' ').map((n) => n.charAt(0)).join('').substring(0, 2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.staffStatName}>{item.name}</Text>
                  {posConfig && (
                    <View style={[styles.staffPosBadge, { backgroundColor: posConfig.color + '15' }]}>
                      <Text style={[styles.staffPosText, { color: posConfig.color }]}>{posConfig.label}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.staffStatMetrics}>
                  <View style={styles.staffMetric}>
                    <Text style={styles.staffMetricValue}>{item.servicesCount}</Text>
                    <Text style={styles.staffMetricLabel}>services</Text>
                  </View>
                  <View style={styles.staffMetric}>
                    <Text style={styles.staffMetricValue}>{item.totalCouverts}</Text>
                    <Text style={styles.staffMetricLabel}>couverts</Text>
                  </View>
                  {item.avgSatisfaction > 0 && (
                    <View style={styles.staffMetric}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Star size={10} color="#F59E0B" />
                        <Text style={styles.staffMetricValue}>{item.avgSatisfaction.toFixed(1)}</Text>
                      </View>
                      <Text style={styles.staffMetricLabel}>note</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyIcon}>👥</Text><Text style={styles.emptyText}>Aucune donnée personnel</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  periodRow: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E4E8EC', maxHeight: 52 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E4E8EC' },
  periodText: { fontSize: 12, fontWeight: '600' as const, color: '#5A6B78' },
  kpiGrid: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#FFF', gap: 6, borderBottomWidth: 1, borderBottomColor: '#E4E8EC' },
  kpiCard: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: '#F8FAFB', borderRadius: 12, padding: 10 },
  kpiIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  kpiValue: { fontSize: 18, fontWeight: '800' as const, color: '#1A2B33' },
  kpiLabel: { fontSize: 9, fontWeight: '500' as const, color: '#8A9AA8', textAlign: 'center' as const },
  splitRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  splitCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 12, gap: 6, borderWidth: 1, borderColor: '#E4E8EC' },
  splitTitle: { fontSize: 12, fontWeight: '700' as const, color: '#1A2B33', marginBottom: 2 },
  splitItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  splitDot: { width: 8, height: 8, borderRadius: 4 },
  splitLabel: { flex: 1, fontSize: 12, color: '#5A6B78' },
  splitValue: { fontSize: 14, fontWeight: '700' as const, color: '#1A2B33' },
  viewTabs: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E4E8EC' },
  viewTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  viewTabText: { fontSize: 12, fontWeight: '500' as const, color: '#8A9AA8' },
  summaryCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, gap: 10, borderWidth: 1, borderColor: '#E4E8EC' },
  summaryTitle: { fontSize: 15, fontWeight: '700' as const, color: '#1A2B33' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 13, color: '#5A6B78' },
  summaryValue: { fontSize: 14, fontWeight: '700' as const, color: '#1A2B33' },
  historyCard: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E4E8EC' },
  historyHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  historyDayLabel: { fontSize: 13, fontWeight: '700' as const, color: '#1A2B33', textTransform: 'capitalize' as const },
  historyDayMeta: { fontSize: 11, color: '#8A9AA8' },
  historyDayCa: { fontSize: 14, fontWeight: '800' as const, color: Colors.primary },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F0F2F5', backgroundColor: '#FAFBFC' },
  serviceRoom: { fontSize: 13, fontWeight: '700' as const, color: Colors.primary, width: 60 },
  serviceInfo: { fontSize: 11, color: '#5A6B78', width: 70 },
  serviceStaff: { flex: 1, fontSize: 11, color: '#8A9AA8' },
  satisfactionBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#F59E0B15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  satisfactionText: { fontSize: 10, fontWeight: '600' as const, color: '#F59E0B' },
  servicePaid: { fontSize: 12 },
  staffStatCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E4E8EC' },
  staffStatAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  staffStatInitials: { fontSize: 15, fontWeight: '700' as const, color: Colors.primary },
  staffStatName: { fontSize: 14, fontWeight: '600' as const, color: '#1A2B33' },
  staffPosBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 2 },
  staffPosText: { fontSize: 10, fontWeight: '600' as const },
  staffStatMetrics: { flexDirection: 'row', gap: 10 },
  staffMetric: { alignItems: 'center' },
  staffMetricValue: { fontSize: 14, fontWeight: '800' as const, color: '#1A2B33' },
  staffMetricLabel: { fontSize: 9, color: '#8A9AA8' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 14, color: '#8A9AA8' },
});
