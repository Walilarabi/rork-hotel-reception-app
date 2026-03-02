import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  UserPlus,
  Mail,
  User,
  Building2,
  ChevronDown,
  CheckCircle,
  Send,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSuperAdmin } from '@/providers/SuperAdminProvider';
import {
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

const INVITABLE_ROLES: AdminUserRole[] = ['direction', 'reception', 'gouvernante', 'femme_de_chambre', 'maintenance', 'breakfast'];

export default function InviteUserScreen() {
  const router = useRouter();
  const { hotels, inviteUser } = useSuperAdmin();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminUserRole | null>(null);
  const [showHotelPicker, setShowHotelPicker] = useState(false);

  const selectedHotel = hotels.find((h) => h.id === selectedHotelId);
  const activeHotels = hotels.filter((h) => h.status !== 'suspended');

  const handleInvite = useCallback(() => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Erreur', 'Le nom et prénom sont obligatoires.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Erreur', 'Veuillez saisir un email valide.');
      return;
    }
    if (!selectedHotelId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un hôtel.');
      return;
    }
    if (!selectedRole) {
      Alert.alert('Erreur', 'Veuillez sélectionner un rôle.');
      return;
    }

    Alert.alert(
      'Confirmer l\'invitation',
      `Inviter ${firstName} ${lastName} (${email}) en tant que ${ADMIN_ROLE_CONFIG[selectedRole].label} à ${selectedHotel?.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Inviter',
          onPress: () => {
            inviteUser({
              email,
              firstName,
              lastName,
              role: selectedRole,
              hotelId: selectedHotelId,
            });
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Invitation envoyée', `Un email a été envoyé à ${email} pour créer son compte.`);
            router.back();
          },
        },
      ]
    );
  }, [firstName, lastName, email, selectedHotelId, selectedRole, selectedHotel, inviteUser, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Inviter un utilisateur',
          presentation: 'modal',
          headerStyle: { backgroundColor: SA.surface },
          headerTintColor: SA.text,
        }}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconRow}>
          <View style={styles.iconLarge}>
            <UserPlus size={28} color={SA.accent} />
          </View>
          <Text style={styles.formTitle}>Nouvelle invitation</Text>
          <Text style={styles.formSub}>L{"'"}utilisateur recevra un email pour créer son mot de passe.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Identité</Text>
          <View style={styles.nameRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <View style={styles.inputIcon}><User size={16} color={SA.textMuted} /></View>
              <TextInput style={styles.input} placeholder="Prénom *" placeholderTextColor={SA.textMuted} value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <TextInput style={[styles.input, { paddingLeft: 14 }]} placeholder="Nom *" placeholderTextColor={SA.textMuted} value={lastName} onChangeText={setLastName} />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}><Mail size={16} color={SA.textMuted} /></View>
            <TextInput style={styles.input} placeholder="Adresse email *" placeholderTextColor={SA.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Hôtel</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowHotelPicker(!showHotelPicker)}
          >
            {selectedHotel ? (
              <View style={styles.selectedItem}>
                <Building2 size={16} color={SA.accent} />
                <Text style={styles.selectedItemText}>{selectedHotel.name}</Text>
              </View>
            ) : (
              <Text style={styles.selectorPlaceholder}>Sélectionner un hôtel *</Text>
            )}
            <ChevronDown size={16} color={SA.textMuted} />
          </TouchableOpacity>

          {showHotelPicker && (
            <View style={styles.pickerList}>
              {activeHotels.map((h) => (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.pickerItem, selectedHotelId === h.id && styles.pickerItemActive]}
                  onPress={() => { setSelectedHotelId(h.id); setShowHotelPicker(false); }}
                >
                  <Text style={styles.pickerItemName}>{h.name}</Text>
                  {selectedHotelId === h.id && <CheckCircle size={16} color={SA.accent} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Rôle</Text>
          <View style={styles.roleGrid}>
            {INVITABLE_ROLES.map((role) => {
              const config = ADMIN_ROLE_CONFIG[role];
              const isSelected = selectedRole === role;
              return (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleCard, isSelected && { borderColor: config.color, backgroundColor: config.color + '10' }]}
                  onPress={() => setSelectedRole(role)}
                >
                  <View style={[styles.roleDot, { backgroundColor: config.color }]} />
                  <Text style={[styles.roleCardText, isSelected && { color: config.color }]}>{config.label}</Text>
                  {isSelected && <CheckCircle size={14} color={config.color} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {firstName && lastName && email && selectedHotelId && selectedRole && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Résumé de l{"'"}invitation</Text>
            <Text style={styles.summaryLine}>
              <Text style={styles.summaryBold}>{firstName} {lastName}</Text> ({email})
            </Text>
            <Text style={styles.summaryLine}>
              Rôle : <Text style={[styles.summaryBold, { color: ADMIN_ROLE_CONFIG[selectedRole].color }]}>{ADMIN_ROLE_CONFIG[selectedRole].label}</Text>
            </Text>
            <Text style={styles.summaryLine}>
              Hôtel : <Text style={styles.summaryBold}>{selectedHotel?.name}</Text>
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite}>
          <Send size={18} color="#FFFFFF" />
          <Text style={styles.inviteBtnText}>Envoyer l{"'"}invitation</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SA.bg },
  scroll: { flex: 1 },
  content: { padding: 20 },
  iconRow: { alignItems: 'center', marginBottom: 24, gap: 8 },
  iconLarge: { width: 56, height: 56, borderRadius: 18, backgroundColor: SA.accent + '15', justifyContent: 'center', alignItems: 'center' },
  formTitle: { fontSize: 18, fontWeight: '700' as const, color: SA.text },
  formSub: { fontSize: 12, color: SA.textSecondary, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '700' as const, color: SA.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 12 },
  nameRow: { flexDirection: 'row', gap: 10 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: SA.surface, borderRadius: 12, borderWidth: 1, borderColor: SA.border, marginBottom: 10, overflow: 'hidden' },
  inputIcon: { paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 14, color: SA.text, paddingVertical: 14, paddingRight: 14 },
  selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: SA.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: SA.border },
  selectorPlaceholder: { fontSize: 14, color: SA.textMuted },
  selectedItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedItemText: { fontSize: 14, fontWeight: '600' as const, color: SA.text },
  pickerList: { backgroundColor: SA.surface, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: SA.border, overflow: 'hidden' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: SA.border },
  pickerItemActive: { backgroundColor: SA.accent + '10' },
  pickerItemName: { fontSize: 14, fontWeight: '600' as const, color: SA.text },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: SA.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1.5, borderColor: SA.border, minWidth: '45%' as unknown as number, flexGrow: 1 },
  roleDot: { width: 8, height: 8, borderRadius: 4 },
  roleCardText: { fontSize: 13, fontWeight: '500' as const, color: SA.textSecondary, flex: 1 },
  summaryCard: { backgroundColor: SA.accent + '08', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: SA.accent + '25', marginBottom: 20, gap: 6 },
  summaryTitle: { fontSize: 13, fontWeight: '700' as const, color: SA.accent, marginBottom: 4 },
  summaryLine: { fontSize: 13, color: SA.textSecondary, lineHeight: 20 },
  summaryBold: { fontWeight: '700' as const, color: SA.text },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: SA.accent, paddingVertical: 16, borderRadius: 14 },
  inviteBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' as const },
});
