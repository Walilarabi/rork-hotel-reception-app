import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Search, AlertTriangle, Clock, CheckCircle, ChevronDown } from 'lucide-react-native';
import UserMenuButton from '@/components/UserMenuButton';
import { useHotel } from '@/providers/HotelProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { MaintenanceTask, MaintenanceStatus } from '@/constants/types';

const PRIORITY_CONFIG = {
  haute: { label: 'Haute', color: '#EF4444' },
  moyenne: { label: 'Moyenne', color: '#F59E0B' },
  basse: { label: 'Basse', color: '#3B82F6' },
};

const STATUS_CONFIG = {
  en_attente: { label: 'En attente', color: '#F59E0B', icon: Clock },
  en_cours: { label: 'En cours', color: '#0D9488', icon: Clock },
  resolu: { label: 'Résolu', color: '#22C55E', icon: CheckCircle },
};

export default function MaintenanceScreen() {
  const router = useRouter();
  const { maintenanceTasks } = useHotel();
  const { theme } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'all'>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const filteredTasks = useMemo(() => {
    let result = statusFilter === 'all' ? maintenanceTasks : maintenanceTasks.filter((t) => t.status === statusFilter);
    if (searchText) {
      const s = searchText.toLowerCase();
      result = result.filter((t) =>
        t.roomNumber.includes(s) || t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s)
      );
    }
    return result.sort((a, b) => {
      const statusOrder = { en_attente: 0, en_cours: 1, resolu: 2 };
      const priorityOrder = { haute: 0, moyenne: 1, basse: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [maintenanceTasks, statusFilter, searchText]);

  const stats = useMemo(() => ({
    total: maintenanceTasks.length,
    pending: maintenanceTasks.filter((t) => t.status === 'en_attente').length,
    inProgress: maintenanceTasks.filter((t) => t.status === 'en_cours').length,
    resolved: maintenanceTasks.filter((t) => t.status === 'resolu').length,
  }), [maintenanceTasks]);

  const renderTaskItem = useCallback(({ item }: { item: MaintenanceTask }) => {
    const priorityConfig = PRIORITY_CONFIG[item.priority];
    const taskStatusConfig = STATUS_CONFIG[item.status];

    return (
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => router.push({ pathname: '/ticket-detail', params: { taskId: item.id } })}
        activeOpacity={0.7}
      >
        <View style={[styles.priorityStripe, { backgroundColor: priorityConfig.color }]} />
        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskRoom}>Ch. {item.roomNumber}</Text>
            <View style={[styles.taskStatusBadge, { backgroundColor: taskStatusConfig.color + '15' }]}>
              <View style={[styles.taskStatusDot, { backgroundColor: taskStatusConfig.color }]} />
              <Text style={[styles.taskStatusText, { color: taskStatusConfig.color }]}>{taskStatusConfig.label}</Text>
            </View>
          </View>
          <Text style={styles.taskTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.taskMeta}>
            <Text style={styles.taskReporter}>Signalé par {item.reportedBy}</Text>
            <Text style={styles.taskTime}>
              {new Date(item.reportedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          {item.assignedTo && (
            <Text style={[styles.taskAssignee, { color: theme.primaryLight }]}>👤 {item.assignedTo}</Text>
          )}
          <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.color + '12' }]}>
            <AlertTriangle size={10} color={priorityConfig.color} />
            <Text style={[styles.priorityText, { color: priorityConfig.color }]}>{priorityConfig.label}</Text>
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  }, [router, theme]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: theme.headerBg },
          headerTintColor: '#FFF',
          headerShadowVisible: false,
          headerTitle: () => <Text style={styles.headerText}>Maintenance</Text>,
          headerRight: () => <UserMenuButton />,
        }}
      />

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.primary + '15' }]}>
          <Search size={16} color={theme.primaryLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor={theme.primaryLight + '80'}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statCount, { color: '#F59E0B' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statCount, { color: '#0D9488' }]}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statCount, { color: '#22C55E' }]}>{stats.resolved}</Text>
          <Text style={styles.statLabel}>Résolu</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterDropdown}
          onPress={() => setShowStatusDropdown(!showStatusDropdown)}
        >
          <Text style={styles.filterText}>
            {statusFilter === 'all' ? 'Tous statuts' : STATUS_CONFIG[statusFilter].label}
          </Text>
          <ChevronDown size={14} color="#5A6B78" />
        </TouchableOpacity>
      </View>

      {showStatusDropdown && (
        <View style={styles.dropdown}>
          {[
            { value: 'all' as const, label: 'Tous' },
            { value: 'en_attente' as const, label: 'En attente' },
            { value: 'en_cours' as const, label: 'En cours' },
            { value: 'resolu' as const, label: 'Résolu' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.dropdownItem, statusFilter === opt.value && styles.dropdownItemActive]}
              onPress={() => { setStatusFilter(opt.value); setShowStatusDropdown(false); }}
            >
              <Text style={styles.dropdownText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔧</Text>
            <Text style={styles.emptyTitle}>Aucune intervention</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  headerText: { fontSize: 17, fontWeight: '700' as const, color: '#FFF' },
  searchContainer: { backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E4E8EC' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A2B33' },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E4E8EC' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statCount: { fontSize: 22, fontWeight: '800' as const },
  statLabel: { fontSize: 11, color: '#8A9AA8', fontWeight: '500' as const },
  statDivider: { width: 1, height: 30, backgroundColor: '#E4E8EC' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E4E8EC' },
  filterDropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6, borderWidth: 1, borderColor: '#E4E8EC' },
  filterText: { fontSize: 12, color: '#5A6B78', fontWeight: '500' as const },
  dropdown: { position: 'absolute', top: 190, left: 14, right: 14, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E4E8EC', zIndex: 100, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E4E8EC' },
  dropdownItemActive: { backgroundColor: '#E4F0F3' },
  dropdownText: { fontSize: 14, color: '#1A2B33' },
  listContent: { padding: 14, paddingBottom: 20, gap: 8 },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E4E8EC', overflow: 'hidden' },
  priorityStripe: { width: 4, alignSelf: 'stretch' },
  taskContent: { flex: 1, padding: 14, gap: 4 },
  taskHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  taskRoom: { fontSize: 14, fontWeight: '700' as const, color: '#1A4D5C' },
  taskStatusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4 },
  taskStatusDot: { width: 6, height: 6, borderRadius: 3 },
  taskStatusText: { fontSize: 11, fontWeight: '600' as const },
  taskTitle: { fontSize: 14, fontWeight: '500' as const, color: '#1A2B33' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  taskReporter: { fontSize: 11, color: '#8A9AA8' },
  taskTime: { fontSize: 11, color: '#8A9AA8' },
  taskAssignee: { fontSize: 11, fontWeight: '500' as const },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, gap: 4, marginTop: 2 },
  priorityText: { fontSize: 10, fontWeight: '600' as const },
  chevron: { fontSize: 20, color: '#8A9AA8', fontWeight: '300' as const, paddingRight: 14 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600' as const, color: '#1A2B33' },
});
