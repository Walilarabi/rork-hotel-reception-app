import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Stack } from 'expo-router';
import { Search, ChevronDown, Filter } from 'lucide-react-native';
import { useFilteredLogs, useSuperAdmin } from '@/providers/SuperAdminProvider';
import { AdminLog, LogAction, LOG_ACTION_CONFIG } from '@/constants/types';

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

const ACTION_FILTERS: { value: LogAction | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes les actions' },
  { value: 'hotel_created', label: 'Hôtels créés' },
  { value: 'hotel_updated', label: 'Hôtels modifiés' },
  { value: 'hotel_suspended', label: 'Hôtels suspendus' },
  { value: 'hotel_reactivated', label: 'Hôtels réactivés' },
  { value: 'hotel_deleted', label: 'Hôtels supprimés' },
  { value: 'user_invited', label: 'Invitations' },
  { value: 'user_suspended', label: 'Utilisateurs suspendus' },
  { value: 'support_mode_entered', label: 'Mode support activé' },
  { value: 'support_mode_exited', label: 'Mode support quitté' },
  { value: 'admin_login', label: 'Connexions' },
  { value: 'pms_sync_forced', label: 'Sync PMS' },
  { value: 'data_export', label: 'Exports' },
];

export default function LogsScreen() {
  useSuperAdmin();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<LogAction | 'all'>('all');
  const [showActionDrop, setShowActionDrop] = useState(false);

  const filtered = useFilteredLogs({ action: actionFilter, search });

  const getActionColor = useCallback((action: LogAction) => {
    if (action.includes('created') || action.includes('reactivated') || action === 'admin_login') return SA.success;
    if (action.includes('suspended') || action.includes('deleted')) return SA.danger;
    if (action.includes('support')) return SA.warning;
    return SA.accent;
  }, []);

  const renderLog = useCallback(({ item }: { item: AdminLog }) => {
    const config = LOG_ACTION_CONFIG[item.action];
    const color = getActionColor(item.action);

    return (
      <View style={styles.logCard}>
        <View style={styles.logCardLeft}>
          <View style={[styles.logIcon, { backgroundColor: color + '15' }]}>
            <Text style={styles.logIconText}>{config.icon}</Text>
          </View>
          <View style={[styles.logLine, { backgroundColor: SA.border }]} />
        </View>
        <View style={styles.logCardContent}>
          <View style={styles.logCardTop}>
            <View style={[styles.actionTag, { backgroundColor: color + '15' }]}>
              <Text style={[styles.actionTagText, { color }]}>{config.label}</Text>
            </View>
            <Text style={styles.logTime}>
              {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              {' '}
              {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={styles.logDetails}>{item.details}</Text>
          <View style={styles.logMeta}>
            {item.hotelName ? (
              <Text style={styles.logMetaText}>{item.hotelName}</Text>
            ) : null}
            <Text style={styles.logMetaText}>{item.userName}</Text>
            <Text style={styles.logMetaIp}>{item.ipAddress}</Text>
          </View>
        </View>
      </View>
    );
  }, [getActionColor]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Logs & Activité' }} />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={16} color={SA.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans les logs..."
            placeholderTextColor={SA.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setShowActionDrop(!showActionDrop)}
        >
          <Filter size={12} color={SA.textSecondary} />
          <Text style={styles.filterChipText}>
            {actionFilter === 'all' ? 'Toutes actions' : LOG_ACTION_CONFIG[actionFilter].label}
          </Text>
          <ChevronDown size={12} color={SA.textSecondary} />
        </TouchableOpacity>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filtered.length} entrées</Text>
        </View>
      </View>

      {showActionDrop && (
        <View style={styles.dropdown}>
          {ACTION_FILTERS.map((af) => (
            <TouchableOpacity
              key={af.value}
              style={[styles.dropdownItem, actionFilter === af.value && styles.dropdownItemActive]}
              onPress={() => { setActionFilter(af.value); setShowActionDrop(false); }}
            >
              {af.value !== 'all' && (
                <Text style={styles.dropdownIcon}>{LOG_ACTION_CONFIG[af.value].icon}</Text>
              )}
              <Text style={styles.dropdownItemText}>{af.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderLog}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Aucun log trouvé</Text>
          </View>
        }
      />
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
  dropdown: { position: 'absolute', top: 110, left: 16, right: 16, backgroundColor: SA.surface, borderRadius: 10, borderWidth: 1, borderColor: SA.border, zIndex: 100, elevation: 10, maxHeight: 350 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: SA.border, gap: 8 },
  dropdownItemActive: { backgroundColor: SA.accent + '15' },
  dropdownIcon: { fontSize: 14 },
  dropdownItemText: { fontSize: 14, color: SA.text },
  listContent: { padding: 16, paddingBottom: 40 },
  logCard: { flexDirection: 'row', marginBottom: 4 },
  logCardLeft: { alignItems: 'center', width: 36, marginRight: 12 },
  logIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  logIconText: { fontSize: 16 },
  logLine: { width: 2, flex: 1, marginTop: 4, marginBottom: -4, borderRadius: 1 },
  logCardContent: { flex: 1, backgroundColor: SA.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: SA.border },
  logCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  actionTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  actionTagText: { fontSize: 10, fontWeight: '700' as const },
  logTime: { fontSize: 10, color: SA.textMuted },
  logDetails: { fontSize: 13, color: SA.text, fontWeight: '500' as const, marginBottom: 8, lineHeight: 18 },
  logMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  logMetaText: { fontSize: 10, color: SA.textMuted, backgroundColor: SA.surfaceLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  logMetaIp: { fontSize: 10, color: SA.textMuted },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600' as const, color: SA.textMuted },
});
