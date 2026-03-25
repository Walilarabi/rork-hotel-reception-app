import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  UserPlus,
  Search,
  ChevronDown,
  CheckCircle,
  XCircle,
  Mail,
  User,
  Phone,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/providers/AuthProvider';
import { useSuperAdmin } from '@/providers/SuperAdminProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Colors } from '@/constants/colors';
import { AdminUserRole, AdminUser, ADMIN_ROLE_CONFIG } from '@/constants/types';

export default function TeamScreen() {
  const { t } = useTheme();
  const { currentUser, canInviteRoles } = useAuth();
  const { users, inviteUser, toggleUserStatus } = useSuperAdmin();
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<AdminUserRole | 'all'>('all');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminUserRole | null>(null);

  const availableRoles = useMemo(() => {
    if (!currentUser) return [];
    return canInviteRoles(currentUser.role);
  }, [currentUser, canInviteRoles]);

  const teamMembers = useMemo(() => {
    let result = users.filter((u) => {
      if (currentUser?.role === 'super_admin') return true;
      return u.hotelId === currentUser?.hotelId;
    });
    if (roleFilter !== 'all') result = result.filter((u) => u.role === roleFilter);
    if (searchText) {
      const s = searchText.toLowerCase();
      result = result.filter((u) =>
        u.firstName.toLowerCase().includes(s) ||
        u.lastName.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s)
      );
    }
    return result.sort((a, b) => {
      const roleOrder: Record<string, number> = { super_admin: 0, direction: 1, reception: 2, gouvernante: 3, femme_de_chambre: 4, maintenance: 5, breakfast: 6 };
      return (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99);
    });
  }, [users, currentUser, roleFilter, searchText]);

  const handleInvite = useCallback(() => {
    if (!inviteFirstName.trim() || !inviteLastName.trim()) {
      Alert.alert('Erreur', 'Le nom et prénom sont obligatoires.');
      return;
    }
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      Alert.alert('Erreur', 'Veuillez saisir un email valide.');
      return;
    }
    if (!inviteRole) {
      Alert.alert('Erreur', 'Veuillez sélectionner un rôle.');
      return;
    }
    if (!currentUser?.hotelId && currentUser?.role !== 'super_admin') {
      Alert.alert('Erreur', 'Impossible de déterminer l\'hôtel.');
      return;
    }

    const hotelId = currentUser?.hotelId ?? '';

    Alert.alert(
      'Confirmer',
      `${inviteFirstName} ${inviteLastName} - ${ADMIN_ROLE_CONFIG[inviteRole].label}`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.confirm,
          onPress: () => {
            inviteUser({
              email: inviteEmail,
              firstName: inviteFirstName,
              lastName: inviteLastName,
              role: inviteRole,
              hotelId,
            });
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Invitation envoyée', `Un email a été envoyé à ${inviteEmail}.`);
            setShowInviteForm(false);
            setInviteFirstName('');
            setInviteLastName('');
            setInviteEmail('');
            setInviteRole(null);
          },
        },
      ]
    );
  }, [inviteFirstName, inviteLastName, inviteEmail, inviteRole, currentUser, inviteUser, t]);

  const handleToggleStatus = useCallback((user: AdminUser) => {
    const action = user.active ? t.common.delete : t.common.confirm;
    Alert.alert(action, `${user.firstName} ${user.lastName}?`, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: action,
        style: user.active ? 'destructive' : 'default',
        onPress: () => {
          toggleUserStatus({ userId: user.id, active: !user.active });
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [toggleUserStatus, t]);

  const renderMember = useCallback(({ item }: { item: AdminUser }) => {
    const roleConfig = ADMIN_ROLE_CONFIG[item.role];
    const isPending = !item.invitationAcceptedAt;
    return (
      <View style={styles.memberCard}>
        <View style={[styles.memberAvatar, { backgroundColor: roleConfig.color + '15' }]}>
          <Text style={[styles.memberAvatarText, { color: roleConfig.color }]}>
            {item.firstName[0]}{item.lastName[0]}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.memberEmail}>{item.email}</Text>
          <View style={styles.memberMeta}>
            <View style={[styles.memberRoleBadge, { backgroundColor: roleConfig.color + '12' }]}>
              <View style={[styles.memberRoleDot, { backgroundColor: roleConfig.color }]} />
              <Text style={[styles.memberRoleText, { color: roleConfig.color }]}>{roleConfig.label}</Text>
            </View>
            {isPending && (
              <View style={styles.pendingBadge}>
                <Mail size={10} color={Colors.warning} />
                <Text style={styles.pendingText}>{t.maintenance.pending}</Text>
              </View>
            )}
            {!item.active && (
              <View style={styles.inactiveBadge}>
                <XCircle size={10} color={Colors.danger} />
                <Text style={styles.inactiveText}>{t.hotel.suspended}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.memberActions}>
          <TouchableOpacity
            style={styles.phoneBtnSmall}
            onPress={() => {
              if (Platform.OS === 'web') {
                Alert.alert(`${item.firstName} ${item.lastName}`, '+33 6 12 34 56 78');
              } else {
                Linking.openURL('tel:+33612345678');
              }
            }}
          >
            <Phone size={14} color={Colors.primary} />
          </TouchableOpacity>
          {item.id !== currentUser?.id && (
            <TouchableOpacity
              style={styles.memberAction}
              onPress={() => handleToggleStatus(item)}
            >
              {item.active ? (
                <XCircle size={18} color={Colors.textMuted} />
              ) : (
                <CheckCircle size={18} color={Colors.success} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [currentUser, handleToggleStatus, t]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t.menu.teamManagement }} />

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={`${t.common.search}...`}
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterDropdown}
          onPress={() => setShowRoleDropdown(!showRoleDropdown)}
        >
          <Text style={styles.filterText}>
            {roleFilter === 'all' ? t.common.all : ADMIN_ROLE_CONFIG[roleFilter].label}
          </Text>
          <ChevronDown size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{teamMembers.length}</Text>
        </View>
        {availableRoles.length > 0 && (
          <TouchableOpacity
            style={styles.inviteBtn}
            onPress={() => setShowInviteForm(!showInviteForm)}
          >
            <UserPlus size={14} color={Colors.white} />
            <Text style={styles.inviteBtnText}>{t.common.add}</Text>
          </TouchableOpacity>
        )}
      </View>

      {showRoleDropdown && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => { setRoleFilter('all'); setShowRoleDropdown(false); }}
          >
            <Text style={styles.dropdownText}>{t.common.all}</Text>
          </TouchableOpacity>
          {(['direction', 'reception', 'gouvernante', 'femme_de_chambre', 'maintenance', 'breakfast'] as AdminUserRole[]).map((role) => (
            <TouchableOpacity
              key={role}
              style={styles.dropdownItem}
              onPress={() => { setRoleFilter(role); setShowRoleDropdown(false); }}
            >
              <View style={[styles.dropdownDot, { backgroundColor: ADMIN_ROLE_CONFIG[role].color }]} />
              <Text style={styles.dropdownText}>{ADMIN_ROLE_CONFIG[role].label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showInviteForm && (
        <View style={styles.inviteForm}>
          <Text style={styles.inviteFormTitle}>{t.common.add}</Text>
          <View style={styles.inviteNameRow}>
            <View style={[styles.inviteInputGroup, { flex: 1 }]}>
              <User size={14} color={Colors.textMuted} />
              <TextInput
                style={styles.inviteInput}
                placeholder="Prénom"
                placeholderTextColor={Colors.textMuted}
                value={inviteFirstName}
                onChangeText={setInviteFirstName}
              />
            </View>
            <View style={[styles.inviteInputGroup, { flex: 1 }]}>
              <TextInput
                style={styles.inviteInput}
                placeholder="Nom"
                placeholderTextColor={Colors.textMuted}
                value={inviteLastName}
                onChangeText={setInviteLastName}
              />
            </View>
          </View>
          <View style={styles.inviteInputGroup}>
            <Mail size={14} color={Colors.textMuted} />
            <TextInput
              style={styles.inviteInput}
              placeholder="Email"
              placeholderTextColor={Colors.textMuted}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <Text style={styles.inviteRoleLabel}>Rôle</Text>
          <View style={styles.inviteRoleGrid}>
            {availableRoles.map((role) => {
              const config = ADMIN_ROLE_CONFIG[role];
              const isSelected = inviteRole === role;
              return (
                <TouchableOpacity
                  key={role}
                  style={[styles.inviteRoleBtn, isSelected && { borderColor: config.color, backgroundColor: config.color + '10' }]}
                  onPress={() => setInviteRole(role)}
                >
                  <View style={[styles.inviteRoleDot, { backgroundColor: config.color }]} />
                  <Text style={[styles.inviteRoleName, isSelected && { color: config.color }]}>{config.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.inviteActions}>
            <TouchableOpacity style={styles.inviteCancelBtn} onPress={() => setShowInviteForm(false)}>
              <Text style={styles.inviteCancelText}>{t.common.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.inviteSubmitBtn} onPress={handleInvite}>
              <Mail size={14} color={Colors.white} />
              <Text style={styles.inviteSubmitText}>{t.common.confirm}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={teamMembers}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>{t.common.noData}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 8 },
  filterDropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6, borderWidth: 1, borderColor: Colors.border },
  filterText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' as const },
  countBadge: { flex: 1 },
  countText: { fontSize: 12, color: Colors.textMuted },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  inviteBtnText: { fontSize: 12, fontWeight: '600' as const, color: Colors.white },
  dropdown: { position: 'absolute', top: 110, left: 16, right: 16, backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, zIndex: 100, elevation: 10, shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, gap: 8 },
  dropdownDot: { width: 8, height: 8, borderRadius: 4 },
  dropdownText: { fontSize: 14, color: Colors.text },
  inviteForm: { backgroundColor: Colors.surface, marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.primary + '30', gap: 10 },
  inviteFormTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text, marginBottom: 4 },
  inviteNameRow: { flexDirection: 'row', gap: 8 },
  inviteInputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, borderRadius: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  inviteInput: { flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 10 },
  inviteRoleLabel: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary, marginTop: 4 },
  inviteRoleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  inviteRoleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surfaceLight, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.border },
  inviteRoleDot: { width: 6, height: 6, borderRadius: 3 },
  inviteRoleName: { fontSize: 12, fontWeight: '500' as const, color: Colors.textSecondary },
  inviteActions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  inviteCancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  inviteCancelText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' as const },
  inviteSubmitBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.primary },
  inviteSubmitText: { fontSize: 13, color: Colors.white, fontWeight: '600' as const },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20, gap: 6 },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 14, gap: 12, borderWidth: 1, borderColor: Colors.border },
  memberAvatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  memberAvatarText: { fontSize: 15, fontWeight: '700' as const },
  memberInfo: { flex: 1, gap: 3 },
  memberName: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  memberEmail: { fontSize: 11, color: Colors.textMuted },
  memberMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  memberRoleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  memberRoleDot: { width: 5, height: 5, borderRadius: 2.5 },
  memberRoleText: { fontSize: 10, fontWeight: '600' as const },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: Colors.warning + '12' },
  pendingText: { fontSize: 10, color: Colors.warning, fontWeight: '500' as const },
  inactiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: Colors.danger + '12' },
  inactiveText: { fontSize: 10, color: Colors.danger, fontWeight: '500' as const },
  memberActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phoneBtnSmall: { width: 30, height: 30, borderRadius: 8, backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
  memberAction: { padding: 6 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
});
