import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Coffee, Truck, CheckCircle, Plus } from 'lucide-react-native';
import UserMenuButton from '@/components/UserMenuButton';
import * as Haptics from 'expo-haptics';
import { useHotel } from '@/providers/HotelProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { BreakfastOrder, BreakfastStatus } from '@/constants/types';

const STATUS_CONFIG: Record<BreakfastStatus, { label: string; color: string }> = {
  a_preparer: { label: 'À préparer', color: '#F59E0B' },
  prepare: { label: 'Préparé', color: '#3B82F6' },
  en_livraison: { label: 'En livraison', color: '#0D9488' },
  servi: { label: 'Servi', color: '#22C55E' },
};

export default function BreakfastScreen() {
  const router = useRouter();
  const { breakfastOrders, updateBreakfast } = useHotel();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'cuisine' | 'livraison' | 'historique'>('cuisine');

  const cuisineOrders = useMemo(() =>
    breakfastOrders.filter((o) => o.status === 'a_preparer').sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)),
    [breakfastOrders]
  );

  const deliveryOrders = useMemo(() =>
    breakfastOrders.filter((o) => o.status === 'prepare' || o.status === 'en_livraison').sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)),
    [breakfastOrders]
  );

  const historyOrders = useMemo(() =>
    breakfastOrders.filter((o) => o.status === 'servi').sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)),
    [breakfastOrders]
  );

  const stats = useMemo(() => ({
    toPrepare: breakfastOrders.filter((o) => o.status === 'a_preparer').length,
    prepared: breakfastOrders.filter((o) => o.status === 'prepare').length,
    delivering: breakfastOrders.filter((o) => o.status === 'en_livraison').length,
    served: breakfastOrders.filter((o) => o.status === 'servi').length,
  }), [breakfastOrders]);

  const handleStatusUpdate = useCallback((orderId: string, newStatus: BreakfastStatus) => {
    const statusLabel = STATUS_CONFIG[newStatus].label;
    Alert.alert('Confirmer', `Marquer comme "${statusLabel}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: () => {
          const updates: Partial<BreakfastOrder> = { status: newStatus };
          if (newStatus === 'servi') updates.servedAt = new Date().toISOString();
          updateBreakfast({ orderId, updates });
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [updateBreakfast]);

  const renderOrderItem = useCallback(({ item }: { item: BreakfastOrder }) => {
    const statusConfig = STATUS_CONFIG[item.status];

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderRoom}>
            <Text style={styles.orderRoomNumber}>{item.roomNumber}</Text>
            <View style={[styles.orderStatusBadge, { backgroundColor: statusConfig.color }]}>
              <Text style={styles.orderStatusText}>{statusConfig.label}</Text>
            </View>
          </View>
          {!item.included && (
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>💰 Payant</Text>
            </View>
          )}
        </View>

        <Text style={styles.orderGuest}>{item.guestName}</Text>
        <Text style={styles.orderDetails}>
          {item.formule} • {item.personCount} pers. • {item.boissons.join(', ')}
        </Text>
        {item.options.length > 0 && (
          <Text style={styles.orderOptions}>⚠️ {item.options.join(', ')}</Text>
        )}
        {item.notes ? <Text style={styles.orderNotes}>📝 {item.notes}</Text> : null}

        <View style={styles.orderActions}>
          {item.status === 'a_preparer' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
              onPress={() => handleStatusUpdate(item.id, 'prepare')}
            >
              <Coffee size={14} color="#FFF" />
              <Text style={styles.actionBtnText}>Préparé</Text>
            </TouchableOpacity>
          )}
          {item.status === 'prepare' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#0D9488' }]}
              onPress={() => handleStatusUpdate(item.id, 'en_livraison')}
            >
              <Truck size={14} color="#FFF" />
              <Text style={styles.actionBtnText}>En livraison</Text>
            </TouchableOpacity>
          )}
          {item.status === 'en_livraison' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#22C55E' }]}
              onPress={() => handleStatusUpdate(item.id, 'servi')}
            >
              <CheckCircle size={14} color="#FFF" />
              <Text style={styles.actionBtnText}>Servi</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [handleStatusUpdate]);

  const currentOrders = activeTab === 'cuisine' ? cuisineOrders : activeTab === 'livraison' ? deliveryOrders : historyOrders;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: theme.headerBg },
          headerTintColor: '#FFF',
          headerShadowVisible: false,
          headerTitle: () => <Text style={styles.headerText}>Petit-déjeuner</Text>,
          headerRight: () => <UserMenuButton />,
        }}
      />

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statCount, { color: '#F59E0B' }]}>{stats.toPrepare}</Text>
          <Text style={styles.statLabel}>À préparer</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statCount, { color: '#0D9488' }]}>{stats.prepared + stats.delivering}</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statCount, { color: '#22C55E' }]}>{stats.served}</Text>
          <Text style={styles.statLabel}>Servis</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'cuisine' && { borderBottomColor: theme.primary }]}
          onPress={() => setActiveTab('cuisine')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'cuisine' && { color: theme.primary, fontWeight: '600' as const }]}>
            🍳 Cuisine ({cuisineOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'livraison' && { borderBottomColor: theme.primary }]}
          onPress={() => setActiveTab('livraison')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'livraison' && { color: theme.primary, fontWeight: '600' as const }]}>
            🚚 Livraison ({deliveryOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'historique' && { borderBottomColor: theme.primary }]}
          onPress={() => setActiveTab('historique')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'historique' && { color: theme.primary, fontWeight: '600' as const }]}>
            ✅ Servis ({historyOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>☕</Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'cuisine' ? 'Aucune commande à préparer' :
               activeTab === 'livraison' ? 'Aucune livraison en cours' : 'Aucun historique'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => router.push('/breakfast-walkin')}
        testID="breakfast-walkin-fab"
      >
        <Plus size={22} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  headerText: { fontSize: 17, fontWeight: '700' as const, color: '#FFF' },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E4E8EC' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statCount: { fontSize: 22, fontWeight: '800' as const },
  statLabel: { fontSize: 11, color: '#8A9AA8', fontWeight: '500' as const },
  statDivider: { width: 1, height: 30, backgroundColor: '#E4E8EC' },
  tabRow: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E4E8EC' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnText: { fontSize: 12, fontWeight: '500' as const, color: '#8A9AA8' },
  listContent: { padding: 14, paddingBottom: 80, gap: 8 },
  orderCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E4E8EC', gap: 6 },
  orderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderRoom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderRoomNumber: { fontSize: 20, fontWeight: '800' as const, color: '#1A2B33' },
  orderStatusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  orderStatusText: { fontSize: 11, fontWeight: '600' as const, color: '#FFF' },
  paidBadge: { backgroundColor: '#FFF8E1', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#FFB30020' },
  paidBadgeText: { fontSize: 10, fontWeight: '600' as const, color: '#F59E0B' },
  orderGuest: { fontSize: 14, fontWeight: '600' as const, color: '#1A2B33' },
  orderDetails: { fontSize: 12, color: '#5A6B78' },
  orderOptions: { fontSize: 11, color: '#EF4444', fontWeight: '500' as const },
  orderNotes: { fontSize: 11, color: '#3B82F6', fontStyle: 'italic' as const },
  orderActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '600' as const, color: '#FFF' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600' as const, color: '#1A2B33' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
