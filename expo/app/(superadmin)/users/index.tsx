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
  UserPlus,
  ChevronDown,
  UserX,
  UserCheck,
  Trash2,
  Mail,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSuperAdmin, useFilteredUsers } from '@/providers/SuperAdminProvider';
import {
  AdminUser,
  AdminUserRole,
  ADMIN_ROLE_CONFIG,
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

export default function UsersScreen() {
  const router = useRouter();
  const { hotels, toggleUserStatus, deleteUser } = useSuperAdmin();
  const [search, setSearch] = useState('');
  const [hotelFilter, setHotelFilter] = useState<string | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<AdminUserRole | 'all'>('all');
  const [showHotelDrop, setShowHotelDrop] = useState(false);
  const [showRoleDrop, setShowRoleDrop] = useState(false);

  const filtered = useFilteredUsers({ hotelId: hotelFilter, role: roleFilter, search });

  const handleToggle = useCallback((user: AdminUser) => {
    const action = user.active ? 'Suspendre' : 'Réactiver';
    Alert.alert(`${action} l'utilisateur`, `${action} ${user.firstName} ${user.lastName} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: action,
        style: user.active ? 'destructive' : 'default',
        onPress: () => {
          toggleUserStatus({ userId: user.id, active: !user.active });
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [toggleUserStatus]);

  const handleDelete = useCallback((user: AdminUser) => {
    Alert.alert('Supprimer l\'utilisateur', `Supprimer définitivement ${user.firstName} ${user.lastName} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          deleteUser(user.id);
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, [deleteUser]);

  const renderUser = useCallback(({ item }: { item: AdminUser }) => {
    const roleConfig = ADMIN_ROLE_CONFIG[item.role];
    const initials = `${item.firstName.charAt(0)}${item.lastName.charAt(0)}`;
    const isPending = item.invitationAcceptedAt === null;

    return (
      <View style={styles.userCard}>
        <View style={styles.userCardTop}>
          <View style={[styles.avatar, { backgroundColor: roleConfig.color + '25' }]}>
            <Text style={[styles.avatarText, { color: roleConfig.color }]}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
            <View style={styles.userEmailRow}>
              <Mail size={11} color={SA.textMuted} />
              <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
            </View>
          </View>
          <View style={[styles.activeIndicator, { backgroundColor: item.active ? SA.success : SA.danger }]} />
        </View>

        <View style={styles.userCardMid}>
          <View style={[styles.roleBadge, { backgroundColor: roleConfig.color + '20' }]}>
            <Text style={[styles.roleBadgeText, { color: roleConfig.color }]}>{roleConfig.label}</Text>
          </View>
          {item.hotelName ? (
            <Text style={styles.hotelLabel} numberOfLines={1}>{item.hotelName}</Text>
          ) : null}
          {isPending && (
            <View style={[styles.roleBadge, { backgroundColor: SA.warning + '20' }]}>
              <Clock size={10} color={SA.warning} />
              <Text style={[styles.roleBadgeText, { color: SA.warning }]}>En attente</Text>
            </View>
          )}
        </View>

        <View style={styles.userCardBottom}>
          {item.lastLoginAt ? (
            <Text style={styles.lastLogin}>
              Dernière connexion: {new Date(item.lastLoginAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </Text>
          ) : null}
          {!item.lastLoginAt && <Text style={styles.lastLogin}>Jamais connecté</Text>}
          <View style={styles.userActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: item.active ? SA.warning + '20' : SA.success + '20' }]}
              onPress={() => handleToggle(item)}
            >
              {item.active
                ? <UserX size={14} color={SA.warning} />
                : <UserCheck size={14} color={SA.success} />
              }
            </TouchableOpacity>
            {item.role !== 'super_admin' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: SA.danger + '20' }]}
                onPress={() => handleDelete(item)}
              >
                <Trash2 size={14} color={SA.danger} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }, [handleToggle, handleDelete]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Gestion des Utilisateurs' }} />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={16} color={SA.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un utilisateur..."
            placeholderTextColor={SA.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => { setShowHotelDrop(!showHotelDrop); setShowRoleDrop(false); }}
        >
          <Text style={styles.filterChipText} numberOfLines={1}>
            {hotelFilter === 'all' ? 'Tous hôtels' : hotels.find((h) => h.id === hotelFilter)?.name ?? 'Hôtel'}
          </Text>
          <ChevronDown size={12} color={SA.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => { setShowRoleDrop(!showRoleDrop); setShowHotelDrop(false); }}
        >
          <Text style={styles.filterChipText}>
            {roleFilter === 'all' ? 'Tous rôles' : ADMIN_ROLE_CONFIG[roleFilter].label}
          </Text>
          <ChevronDown size={12} color={SA.textSecondary} />
        </TouchableOpacity>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filtered.length}</Text>
        </View>
      </View>

      {showHotelDrop && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={[styles.dropdownItem, hotelFilter === 'all' && styles.dropdownItemActive]}
            onPress={() => { setHotelFilter('all'); setShowHotelDrop(false); }}
          >
            <Text style={styles.dropdownItemText}>Tous les hôtels</Text>
          </TouchableOpacity>
          {hotels.map((h) => (
            <TouchableOpacity
              key={h.id}
              style={[styles.dropdownItem, hotelFilter === h.id && styles.dropdownItemActive]}
              onPress={() => { setHotelFilter(h.id); setShowHotelDrop(false); }}
            >
              <Text style={styles.dropdownItemText} numberOfLines={1}>{h.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showRoleDrop && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={[styles.dropdownItem, roleFilter === 'all' && styles.dropdownItemActive]}
            onPress={() => { setRoleFilter('all'); setShowRoleDrop(false); }}
          >
            <Text style={styles.dropdownItemText}>Tous les rôles</Text>
          </TouchableOpacity>
          {(Object.keys(ADMIN_ROLE_CONFIG) as AdminUserRole[]).map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.dropdownItem, roleFilter === role && styles.dropdownItemActive]}
              onPress={() => { setRoleFilter(role); setShowRoleDrop(false); }}
            >
              <View style={[styles.roleFilterDot, { backgroundColor: ADMIN_ROLE_CONFIG[role].color }]} />
              <Text style={styles.dropdownItemText}>{ADMIN_ROLE_CONFIG[role].label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Aucun utilisateur trouvé</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/invite-user')}>
        <UserPlus size={22} color="#FFFFFF" />
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
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: SA.surfaceLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6, borderWidth: 1, borderColor: SA.border, maxWidth: 150 },
  filterChipText: { fontSize: 12, color: SA.textSecondary, fontWeight: '500' as const },
  countBadge: { marginLeft: 'auto', backgroundColor: SA.accent + '25', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countBadgeText: { fontSize: 12, color: SA.accent, fontWeight: '700' as const },
  dropdown: { position: 'absolute', top: 110, left: 16, right: 16, backgroundColor: SA.surface, borderRadius: 10, borderWidth: 1, borderColor: SA.border, zIndex: 100, elevation: 10 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: SA.border, gap: 8 },
  dropdownItemActive: { backgroundColor: SA.accent + '15' },
  dropdownItemText: { fontSize: 14, color: SA.text },
  roleFilterDot: { width: 8, height: 8, borderRadius: 4 },
  listContent: { padding: 16, paddingBottom: 100, gap: 12 },
  userCard: { backgroundColor: SA.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: SA.border },
  userCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' as const },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700' as const, color: SA.text },
  userEmailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  userEmail: { fontSize: 11, color: SA.textMuted, flex: 1 },
  activeIndicator: { width: 10, height: 10, borderRadius: 5 },
  userCardMid: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 4 },
  roleBadgeText: { fontSize: 11, fontWeight: '600' as const },
  hotelLabel: { fontSize: 12, color: SA.textSecondary, flex: 1 },
  userCardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: SA.border, paddingTop: 12 },
  lastLogin: { fontSize: 11, color: SA.textMuted, flex: 1 },
  userActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600' as const, color: SA.textMuted },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 52, height: 52, borderRadius: 16, backgroundColor: SA.accent, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: SA.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
});
