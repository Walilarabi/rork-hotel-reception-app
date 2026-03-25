import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Search,
  Plus,
  Building2,
  ChevronRight,
  Pause,
  Play,
  Trash2,
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSuperAdmin, useFilteredHotels } from '@/providers/SuperAdminProvider';
import {
  Hotel,
  HotelStatus,
  SubscriptionPlan,
  HOTEL_STATUS_CONFIG,
  SUBSCRIPTION_PLAN_CONFIG,
} from '@/constants/types';

const SA = {
  bg: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#222240',
  accent: '#7C4DFF',
  border: '#2A2A4A',
  text: '#F0F0F5',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

export default function HotelsScreen() {
  const router = useRouter();
  const { toggleHotelStatus, deleteHotel } = useSuperAdmin();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<HotelStatus | 'all'>('all');
  const [planFilter, setPlanFilter] = useState<SubscriptionPlan | 'all'>('all');
  const [showStatusDrop, setShowStatusDrop] = useState(false);
  const [showPlanDrop, setShowPlanDrop] = useState(false);

  const filtered = useFilteredHotels({ status: statusFilter, plan: planFilter, search });

  const handleToggleStatus = useCallback((hotel: Hotel) => {
    const newStatus = hotel.status === 'suspended' ? 'active' : 'suspended';
    const action = newStatus === 'suspended' ? 'Suspendre' : 'Réactiver';
    Alert.alert(`${action} ${hotel.name}`, `Voulez-vous ${action.toLowerCase()} cet hôtel ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: action,
        style: newStatus === 'suspended' ? 'destructive' : 'default',
        onPress: () => {
          toggleHotelStatus({ hotelId: hotel.id, newStatus });
          if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [toggleHotelStatus]);

  const handleDelete = useCallback((hotel: Hotel) => {
    Alert.alert('Supprimer l\'hôtel', `Supprimer définitivement "${hotel.name}" et tous ses utilisateurs ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          deleteHotel(hotel.id);
          if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, [deleteHotel]);

  const renderHotel = useCallback(({ item }: { item: Hotel }) => {
    const statusConfig = HOTEL_STATUS_CONFIG[item.status];
    const planConfig = SUBSCRIPTION_PLAN_CONFIG[item.subscriptionPlan];
    const daysLeft = Math.ceil((new Date(item.subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
      <TouchableOpacity
        style={styles.hotelCard}
        onPress={() => router.push({ pathname: '/hotel-detail', params: { hotelId: item.id } })}
        activeOpacity={0.7}
      >
        <View style={styles.hotelCardTop}>
          <View style={styles.hotelInfo}>
            <View style={[styles.hotelIcon, { backgroundColor: planConfig.color + '20' }]}>
              <Building2 size={18} color={planConfig.color} />
            </View>
            <View style={styles.hotelNameBlock}>
              <Text style={styles.hotelName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.hotelEmail} numberOfLines={1}>{item.email}</Text>
            </View>
          </View>
          <ChevronRight size={18} color={SA.textMuted} />
        </View>

        <View style={styles.hotelCardMid}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
            <View style={[styles.statusDotSmall, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
          <View style={[styles.planBadge, { backgroundColor: planConfig.color + '20' }]}>
            <Text style={[styles.planBadgeText, { color: planConfig.color }]}>{planConfig.label}</Text>
          </View>
          {daysLeft > 0 && daysLeft <= 30 && (
            <View style={[styles.statusBadge, { backgroundColor: SA.warning + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: SA.warning }]}>{daysLeft}j restants</Text>
            </View>
          )}
        </View>

        <View style={styles.hotelCardBottom}>
          <View style={styles.hotelStat}>
            <Text style={styles.hotelStatValue}>{item.roomCount}</Text>
            <Text style={styles.hotelStatLabel}>chambres</Text>
          </View>
          <View style={styles.hotelStatDivider} />
          <View style={styles.hotelStat}>
            <Text style={styles.hotelStatValue}>{item.userCount}</Text>
            <Text style={styles.hotelStatLabel}>utilisateurs</Text>
          </View>
          <View style={styles.hotelStatDivider} />
          <View style={styles.hotelStat}>
            <Text style={styles.hotelStatValue}>
              {new Date(item.subscriptionEnd).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </Text>
            <Text style={styles.hotelStatLabel}>fin abo.</Text>
          </View>
          <View style={styles.hotelActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: item.status === 'suspended' ? SA.success + '20' : SA.warning + '20' }]}
              onPress={() => handleToggleStatus(item)}
            >
              {item.status === 'suspended'
                ? <Play size={14} color={SA.success} />
                : <Pause size={14} color={SA.warning} />
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: SA.danger + '20' }]}
              onPress={() => handleDelete(item)}
            >
              <Trash2 size={14} color={SA.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [router, handleToggleStatus, handleDelete]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Gestion des Hôtels' }} />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={16} color={SA.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un hôtel..."
            placeholderTextColor={SA.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => { setShowStatusDrop(!showStatusDrop); setShowPlanDrop(false); }}
        >
          <Text style={styles.filterChipText}>
            {statusFilter === 'all' ? 'Tous statuts' : HOTEL_STATUS_CONFIG[statusFilter].label}
          </Text>
          <ChevronDown size={12} color={SA.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => { setShowPlanDrop(!showPlanDrop); setShowStatusDrop(false); }}
        >
          <Text style={styles.filterChipText}>
            {planFilter === 'all' ? 'Tous plans' : SUBSCRIPTION_PLAN_CONFIG[planFilter].label}
          </Text>
          <ChevronDown size={12} color={SA.textSecondary} />
        </TouchableOpacity>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filtered.length}</Text>
        </View>
      </View>

      {showStatusDrop && (
        <View style={styles.dropdown}>
          {(['all', 'active', 'trial', 'suspended'] as const).map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.dropdownItem, statusFilter === v && styles.dropdownItemActive]}
              onPress={() => { setStatusFilter(v); setShowStatusDrop(false); }}
            >
              <Text style={styles.dropdownItemText}>{v === 'all' ? 'Tous statuts' : HOTEL_STATUS_CONFIG[v].label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showPlanDrop && (
        <View style={styles.dropdown}>
          {(['all', 'basic', 'premium', 'enterprise'] as const).map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.dropdownItem, planFilter === v && styles.dropdownItemActive]}
              onPress={() => { setPlanFilter(v); setShowPlanDrop(false); }}
            >
              <Text style={styles.dropdownItemText}>{v === 'all' ? 'Tous plans' : SUBSCRIPTION_PLAN_CONFIG[v].label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderHotel}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Building2 size={40} color={SA.textMuted} />
            <Text style={styles.emptyTitle}>Aucun hôtel trouvé</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.importFab} onPress={() => router.push('/import-hotel' as any)} activeOpacity={0.7}>
        <FileSpreadsheet size={18} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/hotel-detail')}>
        <Plus size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SA.bg },
  searchContainer: { backgroundColor: '#1A1A2E', paddingHorizontal: 16, paddingBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: SA.surfaceLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: SA.text },
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: SA.surface, borderBottomWidth: 1, borderBottomColor: SA.border },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: SA.surfaceLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6, borderWidth: 1, borderColor: SA.border },
  filterChipText: { fontSize: 12, color: SA.textSecondary, fontWeight: '500' as const },
  countBadge: { marginLeft: 'auto', backgroundColor: SA.accent + '25', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countBadgeText: { fontSize: 12, color: SA.accent, fontWeight: '700' as const },
  dropdown: { position: 'absolute', top: 110, left: 16, right: 16, backgroundColor: SA.surface, borderRadius: 10, borderWidth: 1, borderColor: SA.border, zIndex: 100, elevation: 10 },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: SA.border },
  dropdownItemActive: { backgroundColor: SA.accent + '15' },
  dropdownItemText: { fontSize: 14, color: SA.text },
  listContent: { padding: 16, paddingBottom: 100, gap: 12 },
  hotelCard: { backgroundColor: SA.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: SA.border },
  hotelCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  hotelInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  hotelIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  hotelNameBlock: { flex: 1 },
  hotelName: { fontSize: 15, fontWeight: '700' as const, color: SA.text },
  hotelEmail: { fontSize: 11, color: SA.textMuted, marginTop: 2 },
  hotelCardMid: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 6 },
  statusDotSmall: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: '600' as const },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  planBadgeText: { fontSize: 11, fontWeight: '600' as const },
  hotelCardBottom: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: SA.border, paddingTop: 12 },
  hotelStat: { alignItems: 'center' },
  hotelStatValue: { fontSize: 13, fontWeight: '700' as const, color: SA.text },
  hotelStatLabel: { fontSize: 10, color: SA.textMuted, marginTop: 2 },
  hotelStatDivider: { width: 1, height: 24, backgroundColor: SA.border, marginHorizontal: 12 },
  hotelActions: { flexDirection: 'row', gap: 8, marginLeft: 'auto' },
  actionBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600' as const, color: SA.textMuted },
  importFab: { position: 'absolute', bottom: 88, right: 20, width: 44, height: 44, borderRadius: 14, backgroundColor: '#14B8A6', justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 52, height: 52, borderRadius: 16, backgroundColor: SA.accent, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: SA.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
});
