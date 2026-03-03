import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Search, ChevronDown, CheckCircle, Package, Users, ArrowRight, RefreshCw, History } from 'lucide-react-native';
import UserMenuButton from '@/components/UserMenuButton';
import FlowtymHeader from '@/components/FlowtymHeader';
import DeskKPI from '@/components/DeskKPI';
import DeskTeamCard from '@/components/DeskTeamCard';
import DeskRoomChip from '@/components/DeskRoomChip';
import { useHotel } from '@/providers/HotelProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { FT } from '@/constants/flowtym';
import { Inspection, ROOM_STATUS_CONFIG } from '@/constants/types';

export default function GouvernanteScreen() {
  const router = useRouter();
  const { t } = useTheme();
  const { pendingInspections, inspections, rooms, staff, lowStockItems, inventoryItems } = useHotel();
  const [searchText, setSearchText] = useState('');
  const [floorFilter, setFloorFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'en_attente' | 'valide' | 'refuse'>('all');
  const [showFloorDropdown, setShowFloorDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'validation' | 'equipe' | 'stocks'>('validation');

  const floors = useMemo(() => [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b), [rooms]);

  const filteredInspections = useMemo(() => {
    let result = statusFilter === 'all' ? inspections : inspections.filter((i) => i.status === statusFilter);
    if (floorFilter !== 'all') result = result.filter((i) => i.floor === floorFilter);
    if (searchText) {
      const s = searchText.toLowerCase();
      result = result.filter((i) => i.roomNumber.includes(s) || i.cleanedBy.toLowerCase().includes(s));
    }
    return result.sort((a, b) => {
      if (a.status === 'en_attente' && b.status !== 'en_attente') return -1;
      if (a.status !== 'en_attente' && b.status === 'en_attente') return 1;
      return 0;
    });
  }, [inspections, statusFilter, floorFilter, searchText]);

  const housekeepers = useMemo(() =>
    staff.filter((s) => s.role === 'femme_de_chambre' && s.active),
    [staff]
  );

  const inspectionStats = useMemo(() => ({
    pending: inspections.filter((i) => i.status === 'en_attente').length,
    validated: inspections.filter((i) => i.status === 'valide').length,
    refused: inspections.filter((i) => i.status === 'refuse').length,
  }), [inspections]);

  const roomsByFloor = useMemo(() => {
    const grouped: Record<number, typeof rooms> = {};
    rooms.forEach((r) => {
      if (!grouped[r.floor]) grouped[r.floor] = [];
      grouped[r.floor].push(r);
    });
    return Object.entries(grouped)
      .map(([f, rms]) => ({ floor: parseInt(f, 10), rooms: rms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)) }))
      .sort((a, b) => a.floor - b.floor);
  }, [rooms]);

  const todoRooms = useMemo(() =>
    rooms.filter((r) => r.cleaningStatus === 'none' && (r.status === 'depart' || r.status === 'recouche')),
    [rooms]
  );

  const renderInspectionItem = useCallback(({ item }: { item: Inspection }) => {
    const room = rooms.find((r) => r.id === item.roomId);
    const statusConfig = room ? ROOM_STATUS_CONFIG[room.status] : null;

    const getColor = () => {
      switch (item.status) {
        case 'en_attente': return FT.warning;
        case 'valide': return FT.success;
        case 'refuse': return FT.danger;
        default: return FT.textMuted;
      }
    };

    const getLabel = () => {
      switch (item.status) {
        case 'en_attente': return t.gouvernante.toValidate;
        case 'valide': return t.gouvernante.validatedF;
        case 'refuse': return t.rooms.refused;
        default: return '';
      }
    };

    const color = getColor();

    return (
      <TouchableOpacity
        style={styles.inspCard}
        onPress={() => router.push({ pathname: '/validate-room', params: { inspectionId: item.id } })}
        activeOpacity={0.7}
      >
        <View style={[styles.inspStripe, { backgroundColor: color }]} />
        <View style={styles.inspContent}>
          <View style={styles.inspTop}>
            <Text style={styles.inspRoom}>{item.roomNumber}</Text>
            <Text style={styles.inspType}>{item.roomType}</Text>
            {statusConfig && (
              <View style={[styles.inspStatusChip, { backgroundColor: statusConfig.color }]}>
                <Text style={styles.inspStatusChipText}>{statusConfig.label}</Text>
              </View>
            )}
          </View>
          <View style={styles.inspMid}>
            <View style={[styles.inspBadge, { backgroundColor: color + '12' }]}>
              <View style={[styles.inspDot, { backgroundColor: color }]} />
              <Text style={[styles.inspBadgeText, { color }]}>{getLabel()}</Text>
            </View>
          </View>
          <Text style={styles.inspSub}>
            {item.cleanedBy} • {new Date(item.completedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  }, [rooms, router, t]);

  const renderEquipeTab = () => (
    <ScrollView style={styles.scrollFlex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Supervision Housekeeping Gouvernante</Text>
          <Text style={styles.sectionSub}>{housekeepers.length} membres actifs</Text>
        </View>
      </View>

      <View style={styles.twoCol}>
        <View style={styles.colLeft}>
          {housekeepers.map((hk) => {
            const assignedRooms = rooms.filter((r) => r.assignedTo === hk.id);
            const loadPercent = hk.maxLoad > 0 ? (hk.currentLoad / hk.maxLoad) * 100 : 0;

            return (
              <DeskTeamCard
                key={hk.id}
                name={`${hk.firstName} ${hk.lastName}`}
                details={`${assignedRooms.length} chambres`}
                metrics={`${hk.currentLoad}/${hk.maxLoad} charge`}
                loadPercent={loadPercent}
                loadCurrent={hk.currentLoad}
                loadMax={hk.maxLoad}
                roomChips={
                  assignedRooms.length > 0 ? (
                    <>
                      {assignedRooms.map((r) => (
                        <DeskRoomChip
                          key={r.id}
                          roomNumber={r.roomNumber}
                          status={r.status}
                          cleaningStatus={r.cleaningStatus}
                          clientBadge={r.clientBadge}
                          onPress={() => router.push({ pathname: '/room-details', params: { roomId: r.id } })}
                        />
                      ))}
                    </>
                  ) : undefined
                }
              />
            );
          })}

          {todoRooms.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Soute chambres à faire</Text>
              <View style={styles.chipGrid}>
                {todoRooms.slice(0, 6).map((r) => (
                  <DeskRoomChip
                    key={r.id}
                    roomNumber={r.roomNumber}
                    status={r.status}
                    cleaningStatus={r.cleaningStatus}
                    clientBadge={r.clientBadge}
                    onPress={() => router.push({ pathname: '/room-details', params: { roomId: r.id } })}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.colRight}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Toute chambres à faire</Text>
            <Text style={styles.sectionSub}>Tâches</Text>
            {roomsByFloor.map(({ floor, rooms: fRooms }) => {
              const todoFloor = fRooms.filter((r) => r.cleaningStatus !== 'validee');
              if (todoFloor.length === 0) return null;
              return (
                <View key={floor} style={styles.miniFloor}>
                  <Text style={styles.miniFloorLabel}>Étage {floor}</Text>
                  <View style={styles.chipGrid}>
                    {todoFloor.map((r) => (
                      <DeskRoomChip
                        key={r.id}
                        roomNumber={r.roomNumber}
                        status={r.status}
                        cleaningStatus={r.cleaningStatus}
                        clientBadge={r.clientBadge}
                        onPress={() => router.push({ pathname: '/room-details', params: { roomId: r.id } })}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>KPIs</Text>
            <DeskKPI value={inspectionStats.pending} label={t.gouvernante.toValidate} color={FT.warning} />
            <DeskKPI value={inspectionStats.refused} label={t.gouvernante.toRedo} color={FT.danger} />
            <DeskKPI value={inspectionStats.validated} label={t.gouvernante.validatedF} color={FT.success} />
            <DeskKPI value={rooms.filter((r) => r.cleaningStatus === 'none' && r.assignedTo).length} label="Affecter" color={FT.info} />
            <DeskKPI value={rooms.filter((r) => r.status === 'recouche').length} label="Reterie" color={FT.teal} />
          </View>

          <TouchableOpacity style={styles.actionBtnPrimary} activeOpacity={0.7}>
            <RefreshCw size={14} color="#FFF" />
            <Text style={styles.actionBtnText}>{t.gouvernante.reassign}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnSecondary}
            activeOpacity={0.7}
            onPress={() => {
              const first = pendingInspections[0];
              if (first) router.push({ pathname: '/validate-room', params: { inspectionId: first.id } });
            }}
          >
            <CheckCircle size={14} color={FT.brand} />
            <Text style={styles.actionBtnSecText}>{t.gouvernante.validateRooms}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnOutline} activeOpacity={0.7}>
            <Users size={14} color={FT.textSec} />
            <Text style={styles.actionBtnOutText}>Affecter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnOutline}
            activeOpacity={0.7}
            onPress={() => router.push('/history')}
          >
            <History size={14} color={FT.textSec} />
            <Text style={styles.actionBtnOutText}>{t.gouvernante.history}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {housekeepers.length === 0 && (
        <View style={styles.emptyState}>
          <Users size={24} color={FT.textMuted} />
          <Text style={styles.emptyTitle}>{t.gouvernante.noActiveHousekeeper}</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderStocksTab = () => (
    <ScrollView style={styles.scrollFlex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        style={styles.economatLink}
        onPress={() => router.push('/economat')}
        activeOpacity={0.7}
      >
        <View style={styles.economatIcon}>
          <Package size={18} color={FT.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.economatTitle}>{t.gouvernante.fullEconomat}</Text>
          <Text style={styles.economatSub}>Stocks, consommations, analyses</Text>
        </View>
        <ArrowRight size={16} color={FT.brand} />
      </TouchableOpacity>

      {lowStockItems.length > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>⚠️ {lowStockItems.length} article(s) en stock bas</Text>
        </View>
      )}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t.gouvernante.inventory}</Text>
        {inventoryItems.map((item) => {
          const isLow = item.currentStock <= item.minimumThreshold;
          const percent = item.minimumThreshold > 0 ? Math.min(100, (item.currentStock / (item.minimumThreshold * 3)) * 100) : 100;
          const barColor = isLow ? FT.danger : percent < 50 ? FT.warning : FT.success;
          return (
            <View key={item.id} style={styles.stockItem}>
              <View style={styles.stockItemTop}>
                <Text style={styles.stockName}>{item.itemName}</Text>
                <Text style={[styles.stockCount, isLow && { color: FT.danger }]}>
                  {item.currentStock} {item.unit}
                </Text>
              </View>
              <View style={styles.stockBarBg}>
                <View style={[styles.stockBarFill, { width: `${percent}%`, backgroundColor: barColor }]} />
              </View>
              <Text style={styles.stockLoc}>{item.location} • Seuil: {item.minimumThreshold}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: FT.headerBg },
          headerTintColor: '#FFF',
          headerShadowVisible: false,
          headerTitle: () => (
            <FlowtymHeader
              navItems={[
                { label: 'Statistiques', icon: '📊' },
                { label: 'Alertes', icon: '🔔', badge: pendingInspections.length },
              ]}
            />
          ),
          headerRight: () => <UserMenuButton />,
        }}
      />

      <View style={styles.dashTitle}>
        <Text style={styles.dashTitleBold}>Supervision </Text>
        <Text style={styles.dashTitleLight}>Housekeeping Gouvernante</Text>
      </View>

      <View style={styles.tabRow}>
        {[
          { key: 'validation' as const, label: 'Validation', icon: <CheckCircle size={14} color={activeTab === 'validation' ? FT.brand : FT.textMuted} /> },
          { key: 'equipe' as const, label: 'Équipe', icon: <Users size={14} color={activeTab === 'equipe' ? FT.brand : FT.textMuted} /> },
          { key: 'stocks' as const, label: 'Stocks', icon: <Package size={14} color={activeTab === 'stocks' ? FT.brand : FT.textMuted} /> },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'validation' && (
        <>
          <View style={styles.filterBar}>
            <View style={styles.searchBar}>
              <Search size={14} color={FT.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder={t.common.search + '...'}
                placeholderTextColor={FT.textMuted}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
            <TouchableOpacity
              style={styles.filterChip}
              onPress={() => { setShowFloorDropdown(!showFloorDropdown); setShowStatusDropdown(false); }}
            >
              <Text style={styles.filterChipText}>{floorFilter === 'all' ? 'Étage' : `É${floorFilter}`}</Text>
              <ChevronDown size={12} color={FT.textSec} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterChip}
              onPress={() => { setShowStatusDropdown(!showStatusDropdown); setShowFloorDropdown(false); }}
            >
              <Text style={styles.filterChipText}>
                {statusFilter === 'all' ? 'Statut' : statusFilter === 'en_attente' ? 'À val.' : statusFilter === 'valide' ? 'Valid.' : 'Refus.'}
              </Text>
              <ChevronDown size={12} color={FT.textSec} />
            </TouchableOpacity>
          </View>

          {showFloorDropdown && (
            <View style={styles.dropdown}>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setFloorFilter('all'); setShowFloorDropdown(false); }}>
                <Text style={styles.dropdownText}>{t.rooms.allFloors}</Text>
              </TouchableOpacity>
              {floors.map((f) => (
                <TouchableOpacity key={f} style={styles.dropdownItem} onPress={() => { setFloorFilter(f); setShowFloorDropdown(false); }}>
                  <Text style={styles.dropdownText}>Étage {f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showStatusDropdown && (
            <View style={styles.dropdown}>
              {[
                { value: 'all' as const, label: 'Tous' },
                { value: 'en_attente' as const, label: t.gouvernante.toValidate },
                { value: 'valide' as const, label: t.gouvernante.validatedF },
                { value: 'refuse' as const, label: 'Refusée' },
              ].map((opt) => (
                <TouchableOpacity key={opt.value} style={styles.dropdownItem} onPress={() => { setStatusFilter(opt.value); setShowStatusDropdown(false); }}>
                  <Text style={styles.dropdownText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.kpiStrip}>
            <View style={[styles.kpiMini, { borderLeftColor: FT.warning }]}>
              <Text style={styles.kpiMiniVal}>{inspectionStats.pending}</Text>
              <Text style={styles.kpiMiniLabel}>{t.gouvernante.toValidate}</Text>
            </View>
            <View style={[styles.kpiMini, { borderLeftColor: FT.success }]}>
              <Text style={styles.kpiMiniVal}>{inspectionStats.validated}</Text>
              <Text style={styles.kpiMiniLabel}>{t.gouvernante.validatedF}</Text>
            </View>
            <View style={[styles.kpiMini, { borderLeftColor: FT.danger }]}>
              <Text style={styles.kpiMiniVal}>{inspectionStats.refused}</Text>
              <Text style={styles.kpiMiniLabel}>Refusées</Text>
            </View>
          </View>

          <FlatList
            data={filteredInspections}
            keyExtractor={(item) => item.id}
            renderItem={renderInspectionItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyTitle}>{t.gouvernante.noInspectionPending}</Text>
              </View>
            }
          />
        </>
      )}

      {activeTab === 'equipe' && renderEquipeTab()}
      {activeTab === 'stocks' && renderStocksTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FT.bg },

  dashTitle: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  dashTitleBold: { fontSize: 18, fontWeight: '800' as const, color: FT.text },
  dashTitleLight: { fontSize: 18, fontWeight: '400' as const, color: FT.textSec },

  tabRow: { flexDirection: 'row', backgroundColor: FT.surface, borderBottomWidth: 1, borderBottomColor: FT.border },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: FT.brand },
  tabBtnText: { fontSize: 13, fontWeight: '500' as const, color: FT.textMuted },
  tabBtnTextActive: { color: FT.brand, fontWeight: '600' as const },

  filterBar: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: FT.surface, borderBottomWidth: 1, borderBottomColor: FT.border, gap: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: FT.surfaceAlt, borderRadius: 8, paddingHorizontal: 10, gap: 6, borderWidth: 1, borderColor: FT.border },
  searchInput: { flex: 1, fontSize: 13, color: FT.text, paddingVertical: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: FT.surfaceAlt, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, gap: 4, borderWidth: 1, borderColor: FT.border },
  filterChipText: { fontSize: 11, color: FT.textSec, fontWeight: '500' as const },

  dropdown: { position: 'absolute', top: 220, left: 14, right: 14, backgroundColor: FT.surface, borderRadius: 12, borderWidth: 1, borderColor: FT.border, zIndex: 100, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: FT.border },
  dropdownText: { fontSize: 14, color: FT.text },

  kpiStrip: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: FT.surface, borderBottomWidth: 1, borderBottomColor: FT.border },
  kpiMini: { flex: 1, backgroundColor: FT.surfaceAlt, borderRadius: 10, padding: 12, borderLeftWidth: 3, alignItems: 'center' },
  kpiMiniVal: { fontSize: 24, fontWeight: '800' as const, color: FT.text },
  kpiMiniLabel: { fontSize: 10, color: FT.textMuted, fontWeight: '500' as const, marginTop: 2 },

  listContent: { padding: 14, paddingBottom: 20, gap: 8 },
  inspCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: FT.surface, borderRadius: FT.cardRadius, borderWidth: 1, borderColor: FT.border, overflow: 'hidden' },
  inspStripe: { width: 4, alignSelf: 'stretch' },
  inspContent: { flex: 1, padding: 14, gap: 4 },
  inspTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inspRoom: { fontSize: 20, fontWeight: '800' as const, color: FT.text },
  inspType: { fontSize: 12, color: FT.textSec },
  inspStatusChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  inspStatusChipText: { fontSize: 10, fontWeight: '600' as const, color: '#FFF' },
  inspMid: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inspBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
  inspDot: { width: 6, height: 6, borderRadius: 3 },
  inspBadgeText: { fontSize: 11, fontWeight: '600' as const },
  inspSub: { fontSize: 11, color: FT.textMuted },
  chevron: { fontSize: 20, color: FT.textMuted, fontWeight: '300' as const, paddingRight: 14 },

  scrollFlex: { flex: 1 },
  scrollContent: { padding: 14, gap: 10 },

  twoCol: { flexDirection: 'row', gap: 10 },
  colLeft: { flex: 1, gap: 10 },
  colRight: { width: 200, gap: 10 },

  sectionCard: { backgroundColor: FT.surface, borderRadius: FT.cardRadius, padding: 14, borderWidth: 1, borderColor: FT.border, gap: 8 },
  sectionHeader: { gap: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '700' as const, color: FT.text },
  sectionSub: { fontSize: 11, color: FT.textMuted },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  miniFloor: { gap: 4, marginTop: 4 },
  miniFloorLabel: { fontSize: 11, fontWeight: '600' as const, color: FT.textSec },

  actionBtnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: FT.brand, paddingVertical: 12, borderRadius: 10 },
  actionBtnText: { fontSize: 13, fontWeight: '600' as const, color: '#FFF' },
  actionBtnSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: FT.brandSoft, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: FT.brand + '25' },
  actionBtnSecText: { fontSize: 13, fontWeight: '600' as const, color: FT.brand },
  actionBtnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: FT.surfaceAlt, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: FT.border },
  actionBtnOutText: { fontSize: 13, fontWeight: '600' as const, color: FT.textSec },

  economatLink: { flexDirection: 'row', alignItems: 'center', backgroundColor: FT.brandSoft, paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderRadius: FT.cardRadius, borderWidth: 1, borderColor: FT.brand + '20' },
  economatIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: FT.brand + '12', justifyContent: 'center', alignItems: 'center' },
  economatTitle: { fontSize: 14, fontWeight: '700' as const, color: FT.brand },
  economatSub: { fontSize: 11, color: FT.textSec, marginTop: 1 },

  alertBanner: { backgroundColor: FT.warningSoft, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: FT.warning + '25' },
  alertText: { fontSize: 13, fontWeight: '600' as const, color: FT.warning },

  stockItem: { gap: 4, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: FT.border },
  stockItemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stockName: { fontSize: 13, fontWeight: '500' as const, color: FT.text },
  stockCount: { fontSize: 14, fontWeight: '700' as const, color: FT.text },
  stockBarBg: { height: 4, backgroundColor: FT.bg, borderRadius: 2, overflow: 'hidden' },
  stockBarFill: { height: 4, borderRadius: 2 },
  stockLoc: { fontSize: 10, color: FT.textMuted },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 15, fontWeight: '600' as const, color: FT.text },
});
