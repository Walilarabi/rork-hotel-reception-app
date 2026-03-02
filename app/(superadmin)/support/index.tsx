import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Headphones,
  Building2,
  Eye,
  ArrowLeft,
  Shield,
  Zap,
  ChevronDown,
  CheckCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSuperAdmin } from '@/providers/SuperAdminProvider';
import {
  AdminUserRole,
  ADMIN_ROLE_CONFIG,
  HOTEL_STATUS_CONFIG,
  SUBSCRIPTION_PLAN_CONFIG,
} from '@/constants/types';

const SA = {
  bg: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#222240',
  accent: '#7C4DFF',
  accentLight: '#B388FF',
  border: '#2A2A4A',
  text: '#F0F0F5',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

const SUPPORT_ROLES: AdminUserRole[] = ['direction', 'reception', 'gouvernante', 'femme_de_chambre', 'maintenance', 'breakfast'];

export default function SupportScreen() {
  const router = useRouter();
  const { hotels, supportSession, enterSupportMode, exitSupportMode } = useSuperAdmin();
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminUserRole | null>(null);
  const [showHotelPicker, setShowHotelPicker] = useState(false);

  const selectedHotel = hotels.find((h) => h.id === selectedHotelId);
  const activeHotels = hotels.filter((h) => h.status === 'active' || h.status === 'trial');

  const handleActivate = useCallback(() => {
    if (!selectedHotelId || !selectedRole) return;
    const hotel = hotels.find((h) => h.id === selectedHotelId);
    if (!hotel) return;

    Alert.alert(
      'Activer le mode support',
      `Vous allez voir l'application exactement comme un utilisateur "${ADMIN_ROLE_CONFIG[selectedRole].label}" de "${hotel.name}".`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Activer',
          onPress: () => {
            enterSupportMode({ hotelId: selectedHotelId, role: selectedRole });
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [selectedHotelId, selectedRole, hotels, enterSupportMode]);

  const handleExit = useCallback(() => {
    Alert.alert('Quitter le mode support', 'Retourner à l\'interface Super Admin ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter',
        onPress: () => {
          exitSupportMode();
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [exitSupportMode]);

  if (supportSession) {
    const duration = Math.round((Date.now() - new Date(supportSession.enteredAt).getTime()) / 60000);
    const roleConfig = ADMIN_ROLE_CONFIG[supportSession.role];

    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Mode Support' }} />
        <ScrollView contentContainerStyle={styles.activeSupportContent}>
          <View style={styles.activeBanner}>
            <View style={styles.activePulse}>
              <Zap size={28} color={SA.warning} />
            </View>
            <Text style={styles.activeBannerTitle}>Mode Support Actif</Text>
            <Text style={styles.activeBannerSub}>
              Vous êtes connecté en tant que :
            </Text>
          </View>

          <View style={styles.activeCard}>
            <View style={styles.activeCardRow}>
              <Building2 size={18} color={SA.accent} />
              <View style={styles.activeCardInfo}>
                <Text style={styles.activeCardLabel}>Hôtel</Text>
                <Text style={styles.activeCardValue}>{supportSession.hotelName}</Text>
              </View>
            </View>
            <View style={styles.activeCardDivider} />
            <View style={styles.activeCardRow}>
              <Eye size={18} color={roleConfig.color} />
              <View style={styles.activeCardInfo}>
                <Text style={styles.activeCardLabel}>Vue</Text>
                <Text style={[styles.activeCardValue, { color: roleConfig.color }]}>{roleConfig.label}</Text>
              </View>
            </View>
            <View style={styles.activeCardDivider} />
            <View style={styles.activeCardRow}>
              <Shield size={18} color={SA.textMuted} />
              <View style={styles.activeCardInfo}>
                <Text style={styles.activeCardLabel}>Durée de session</Text>
                <Text style={styles.activeCardValue}>{duration} minute(s)</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.viewBtn} onPress={() => router.replace('/(tabs)/reception' as never)}>
            <Eye size={18} color="#FFFFFF" />
            <Text style={styles.viewBtnText}>Voir l{"'"}interface hôtel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.exitBtn} onPress={handleExit}>
            <ArrowLeft size={18} color={SA.danger} />
  <Text style={styles.exitBtnText}>Quitter le mode support</Text>
          </TouchableOpacity>

          <View style={styles.warningBox}>
            <Shield size={14} color={SA.warning} />
            <Text style={styles.warningText}>
              Toutes les actions effectuées en mode support sont enregistrées dans les logs d{"'"}activité.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Mode Support' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Headphones size={32} color={SA.accent} />
          </View>
          <Text style={styles.heroTitle}>Mode Support</Text>
          <Text style={styles.heroSub}>
            Visualisez l{"'"}application exactement comme un utilisateur d{"'"}un hôtel spécifique pour diagnostiquer des problèmes.
          </Text>
        </View>

        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepNumber, selectedHotelId ? styles.stepNumberDone : {}]}>
              {selectedHotelId ? <CheckCircle size={16} color={SA.success} /> : <Text style={styles.stepNumberText}>1</Text>}
            </View>
            <Text style={styles.stepTitle}>Sélectionnez un hôtel</Text>
          </View>

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
              <Text style={styles.selectorPlaceholder}>Choisir un hôtel...</Text>
            )}
            <ChevronDown size={16} color={SA.textMuted} />
          </TouchableOpacity>

          {showHotelPicker && (
            <View style={styles.pickerList}>
              {activeHotels.map((h) => {
                const statusConfig = HOTEL_STATUS_CONFIG[h.status];
                const planConfig = SUBSCRIPTION_PLAN_CONFIG[h.subscriptionPlan];
                return (
                  <TouchableOpacity
                    key={h.id}
                    style={[styles.pickerItem, selectedHotelId === h.id && styles.pickerItemActive]}
                    onPress={() => { setSelectedHotelId(h.id); setShowHotelPicker(false); }}
                  >
                    <View style={styles.pickerItemLeft}>
                      <Text style={styles.pickerItemName}>{h.name}</Text>
                      <View style={styles.pickerItemBadges}>
                        <View style={[styles.microBadge, { backgroundColor: statusConfig.color + '20' }]}>
                          <Text style={[styles.microBadgeText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                        </View>
                        <View style={[styles.microBadge, { backgroundColor: planConfig.color + '20' }]}>
                          <Text style={[styles.microBadgeText, { color: planConfig.color }]}>{planConfig.label}</Text>
                        </View>
                      </View>
                    </View>
                    {selectedHotelId === h.id && <CheckCircle size={16} color={SA.accent} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepNumber, selectedRole ? styles.stepNumberDone : {}]}>
              {selectedRole ? <CheckCircle size={16} color={SA.success} /> : <Text style={styles.stepNumberText}>2</Text>}
            </View>
            <Text style={styles.stepTitle}>Choisissez la vue (rôle)</Text>
          </View>

          <View style={styles.roleGrid}>
            {SUPPORT_ROLES.map((role) => {
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

        {selectedHotelId && selectedRole && (
          <View style={styles.summarySection}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Résumé</Text>
              <Text style={styles.summaryText}>
                Vous allez voir exactement ce que voit :{'\n'}
                <Text style={styles.summaryBold}>{selectedHotel?.name}</Text> dans la vue{' '}
                <Text style={[styles.summaryBold, { color: ADMIN_ROLE_CONFIG[selectedRole].color }]}>
                  {ADMIN_ROLE_CONFIG[selectedRole].label}
                </Text>
              </Text>
            </View>

            <TouchableOpacity style={styles.activateBtn} onPress={handleActivate}>
              <Zap size={18} color="#FFFFFF" />
              <Text style={styles.activateBtnText}>Activer le Mode Support</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SA.bg },
  content: { padding: 20 },
  heroSection: { alignItems: 'center', marginBottom: 32, paddingTop: 8 },
  heroIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: SA.accent + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: '800' as const, color: SA.text, marginBottom: 8 },
  heroSub: { fontSize: 13, color: SA.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  stepSection: { marginBottom: 24 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: SA.surfaceLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: SA.border },
  stepNumberDone: { backgroundColor: SA.success + '15', borderColor: SA.success + '40' },
  stepNumberText: { fontSize: 13, fontWeight: '700' as const, color: SA.accent },
  stepTitle: { fontSize: 16, fontWeight: '700' as const, color: SA.text },
  selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: SA.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: SA.border },
  selectorPlaceholder: { fontSize: 14, color: SA.textMuted },
  selectedItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedItemText: { fontSize: 14, fontWeight: '600' as const, color: SA.text },
  pickerList: { backgroundColor: SA.surface, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: SA.border, overflow: 'hidden' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: SA.border },
  pickerItemActive: { backgroundColor: SA.accent + '10' },
  pickerItemLeft: { flex: 1 },
  pickerItemName: { fontSize: 14, fontWeight: '600' as const, color: SA.text, marginBottom: 4 },
  pickerItemBadges: { flexDirection: 'row', gap: 6 },
  microBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  microBadgeText: { fontSize: 10, fontWeight: '600' as const },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: SA.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: SA.border, minWidth: '45%' as unknown as number, flexGrow: 1 },
  roleDot: { width: 8, height: 8, borderRadius: 4 },
  roleCardText: { fontSize: 13, fontWeight: '500' as const, color: SA.textSecondary, flex: 1 },
  summarySection: { marginTop: 8 },
  summaryCard: { backgroundColor: SA.surface, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: SA.accent + '30', marginBottom: 16 },
  summaryTitle: { fontSize: 14, fontWeight: '700' as const, color: SA.accent, marginBottom: 8 },
  summaryText: { fontSize: 13, color: SA.textSecondary, lineHeight: 22 },
  summaryBold: { fontWeight: '700' as const, color: SA.text },
  activateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: SA.accent, paddingVertical: 16, borderRadius: 14 },
  activateBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' as const },
  activeSupportContent: { padding: 20, alignItems: 'center' },
  activeBanner: { alignItems: 'center', marginBottom: 24, paddingTop: 20 },
  activePulse: { width: 64, height: 64, borderRadius: 32, backgroundColor: SA.warning + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  activeBannerTitle: { fontSize: 22, fontWeight: '800' as const, color: SA.warning, marginBottom: 4 },
  activeBannerSub: { fontSize: 14, color: SA.textSecondary },
  activeCard: { backgroundColor: SA.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: SA.warning + '30', width: '100%', marginBottom: 24 },
  activeCardRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  activeCardInfo: { flex: 1 },
  activeCardLabel: { fontSize: 11, color: SA.textMuted, marginBottom: 2 },
  activeCardValue: { fontSize: 15, fontWeight: '700' as const, color: SA.text },
  activeCardDivider: { height: 1, backgroundColor: SA.border, marginVertical: 4 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: SA.accent, paddingVertical: 16, borderRadius: 14, width: '100%', marginBottom: 12 },
  viewBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' as const },
  exitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: SA.danger + '15', paddingVertical: 16, borderRadius: 14, width: '100%', borderWidth: 1, borderColor: SA.danger + '30', marginBottom: 24 },
  exitBtnText: { color: SA.danger, fontSize: 16, fontWeight: '700' as const },
  warningBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: SA.warning + '10', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: SA.warning + '20' },
  warningText: { fontSize: 12, color: SA.warning, flex: 1, lineHeight: 18 },
});
