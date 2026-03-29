import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import {
  Database,
  RefreshCw,
  Trash2,
  Info,
  Clock,
  CheckCircle,
  AlertTriangle,
  Server,
  Shield,
  ChevronRight,
  LogOut,
  Users,
  User,
  Moon,
  Sun,
  Palette,
  Globe,
  Check,
  BedDouble,
  History,
  Settings,
  Upload,
  QrCode,
  BarChart3,
} from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHotel } from '@/providers/HotelProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme, MOBILE_THEMES, MobileThemeId } from '@/providers/ThemeProvider';
import { Colors } from '@/constants/colors';
import { ADMIN_ROLE_CONFIG } from '@/constants/types';
import { LANGUAGES } from '@/constants/i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const { pmsSync, isSyncing, syncPms, rooms } = useHotel();
  const { currentUser, logout, canInviteRoles } = useAuth();
  const { t, themeId, setMobileTheme, isDarkMode, toggleDarkMode, languageId, setLanguage, modeColors } = useTheme();

  const roleConfig = currentUser ? ADMIN_ROLE_CONFIG[currentUser.role] : null;
  const canManageTeam = currentUser ? canInviteRoles(currentUser.role).length > 0 : false;
  const MOBILE_ROLES: string[] = ['reception', 'gouvernante', 'femme_de_chambre', 'maintenance', 'breakfast', 'spa'];
  const isMobileRole = currentUser ? MOBILE_ROLES.includes(currentUser.role) : false;

  const bg = isDarkMode ? modeColors.background : Colors.background;
  const cardBg = isDarkMode ? modeColors.surface : Colors.surface;
  const textColor = isDarkMode ? modeColors.text : Colors.text;
  const textSec = isDarkMode ? modeColors.textSecondary : Colors.textSecondary;
  const textMut = isDarkMode ? modeColors.textMuted : Colors.textMuted;
  const borderCol = isDarkMode ? modeColors.border : Colors.border;

  const handleResetData = useCallback(() => {
    Alert.alert(
      t.settings.resetAllData,
      t.settings.resetConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.settings.resetAllData,
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert(t.common.success, t.settings.resetDone);
          },
        },
      ]
    );
  }, [t]);

  const handleLogout = useCallback(() => {
    Alert.alert(t.menu.logout, t.auth.logoutConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.auth.logout,
        style: 'destructive',
        onPress: () => {
          logout(undefined, {
            onSuccess: () => {
              router.replace('/login');
            },
          });
        },
      },
    ]);
  }, [logout, router, t]);

  const getSyncStatusIcon = () => {
    switch (pmsSync.status) {
      case 'success': return <CheckCircle size={16} color={Colors.success} />;
      case 'error': return <AlertTriangle size={16} color={Colors.danger} />;
      case 'syncing': return <RefreshCw size={16} color={Colors.warning} />;
      default: return <Clock size={16} color={textMut} />;
    }
  };

  const getSyncStatusLabel = () => {
    switch (pmsSync.status) {
      case 'success': return t.settings.connected;
      case 'error': return t.settings.connectionError;
      case 'syncing': return t.settings.syncing;
      default: return t.settings.notSynced;
    }
  };

  const currentLang = LANGUAGES.find((l) => l.id === languageId);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Stack.Screen options={{ title: t.settings.title, headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.white }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {currentUser && (
          <View style={styles.section}>
            <View style={[styles.profileCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
              <View style={[styles.profileAvatar, { backgroundColor: (roleConfig?.color ?? Colors.primary) + '18' }]}>
                <User size={24} color={roleConfig?.color ?? Colors.primary} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: textColor }]}>{currentUser.firstName} {currentUser.lastName}</Text>
                <Text style={[styles.profileEmail, { color: textMut }]}>{currentUser.email}</Text>
                <View style={styles.profileMeta}>
                  <View style={[styles.profileRoleBadge, { backgroundColor: (roleConfig?.color ?? Colors.primary) + '12' }]}>
                    <View style={[styles.profileRoleDot, { backgroundColor: roleConfig?.color ?? Colors.primary }]} />
                    <Text style={[styles.profileRoleText, { color: roleConfig?.color ?? Colors.primary }]}>
                      {t.roles[currentUser.role] ?? roleConfig?.label ?? currentUser.role}
                    </Text>
                  </View>
                  {currentUser.hotelName ? (
                    <Text style={[styles.profileHotel, { color: textSec }]}>{currentUser.hotelName}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={18} color={Colors.primary} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>{t.menu.colorTheme}</Text>
          </View>

          <View style={[styles.prefCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            {!isMobileRole && (
              <>
                <View style={styles.prefRow}>
                  <View style={[styles.prefIcon, { backgroundColor: '#6366F112' }]}>
                    {isDarkMode ? <Sun size={16} color="#F59E0B" /> : <Moon size={16} color="#6366F1" />}
                  </View>
                  <Text style={[styles.prefLabel, { color: textColor }]}>{t.menu.darkMode}</Text>
                  <Switch
                    value={isDarkMode}
                    onValueChange={toggleDarkMode}
                    trackColor={{ false: borderCol, true: Colors.primary + '60' }}
                    thumbColor={isDarkMode ? Colors.primary : '#f4f3f4'}
                    style={styles.prefSwitch}
                  />
                </View>

                <View style={[styles.prefDivider, { backgroundColor: borderCol }]} />
              </>
            )}

            <View style={styles.prefSection}>
              <View style={styles.prefRow}>
                <View style={[styles.prefIcon, { backgroundColor: MOBILE_THEMES[themeId].primary + '15' }]}>
                  <Palette size={16} color={MOBILE_THEMES[themeId].primary} />
                </View>
                <Text style={[styles.prefLabel, { color: textColor }]}>{t.menu.colorTheme}</Text>
              </View>
              <View style={styles.themeRow}>
                {(Object.keys(MOBILE_THEMES) as MobileThemeId[]).map((id) => {
                  const th = MOBILE_THEMES[id];
                  const isActive = themeId === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[styles.themeChip, isActive && { borderColor: th.primary, backgroundColor: th.primary + '10' }]}
                      onPress={() => setMobileTheme(id)}
                    >
                      <View style={[styles.themeSwatch, { backgroundColor: th.primary }]}>
                        {isActive && <Check size={10} color="#FFF" />}
                      </View>
                      <Text style={[styles.themeLabel, { color: isActive ? th.primary : textSec }]}>{th.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={[styles.prefDivider, { backgroundColor: borderCol }]} />

            <View style={styles.prefSection}>
              <View style={styles.prefRow}>
                <View style={[styles.prefIcon, { backgroundColor: '#3B82F612' }]}>
                  <Globe size={16} color="#3B82F6" />
                </View>
                <Text style={[styles.prefLabel, { color: textColor }]}>{t.menu.language}</Text>
                <Text style={[styles.prefValue, { color: textSec }]}>{currentLang?.flag} {currentLang?.nativeLabel}</Text>
              </View>
              <View style={styles.langRow}>
                {LANGUAGES.map((lang) => {
                  const isActive = languageId === lang.id;
                  return (
                    <TouchableOpacity
                      key={lang.id}
                      style={[styles.langChip, isActive && styles.langChipActive]}
                      onPress={() => setLanguage(lang.id)}
                    >
                      <Text style={styles.langFlag}>{lang.flag}</Text>
                      <Text style={[styles.langLabel, isActive && styles.langLabelActive]}>
                        {lang.id.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {canManageTeam && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users size={18} color={Colors.primary} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>{t.menu.team}</Text>
            </View>
            <TouchableOpacity style={[styles.menuBtn, { backgroundColor: cardBg, borderColor: borderCol }]} onPress={() => router.push('/team')}>
              <View style={styles.menuBtnLeft}>
                <Users size={18} color={Colors.primary} />
                <View>
                  <Text style={[styles.menuBtnTitle, { color: textColor }]}>{t.menu.teamManagement}</Text>
                  <Text style={[styles.menuBtnSub, { color: textSec }]}>{t.menu.teamManagementDesc}</Text>
                </View>
              </View>
              <ChevronRight size={16} color={textMut} />
            </TouchableOpacity>
          </View>
        )}

        {currentUser?.role === 'direction' && (
          <View style={styles.section}>
            <View style={[styles.configNotice, { backgroundColor: Colors.teal + '08', borderColor: Colors.teal + '25' }]}>
              <Settings size={16} color={Colors.teal} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.configNoticeTitle, { color: textColor }]}>Gestion de l'hôtel</Text>
                <Text style={[styles.configNoticeSub, { color: textSec }]}>Accédez à la Configuration depuis le menu Direction de votre tableau de bord.</Text>
              </View>
            </View>
          </View>
        )}

        {(currentUser?.role === 'gouvernante' || currentUser?.role === 'reception' || currentUser?.role === 'super_admin') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BedDouble size={18} color={Colors.primary} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>{t.hotel.hotelConfig}</Text>
            </View>
            <TouchableOpacity style={[styles.menuBtn, { backgroundColor: cardBg, borderColor: borderCol }]} onPress={() => router.push('/configuration' as any)}>
              <View style={styles.menuBtnLeft}>
                <Settings size={18} color={Colors.teal} />
                <View>
                  <Text style={[styles.menuBtnTitle, { color: textColor }]}>Configuration</Text>
                  <Text style={[styles.menuBtnSub, { color: textSec }]}>Produits, checklists, signalements, types de chambres, personnel</Text>
                </View>
              </View>
              <ChevronRight size={16} color={textMut} />
            </TouchableOpacity>
            <View style={{ height: 8 }} />
            <TouchableOpacity style={[styles.menuBtn, { backgroundColor: cardBg, borderColor: borderCol }]} onPress={() => router.push('/add-room')}>
              <View style={styles.menuBtnLeft}>
                <BedDouble size={18} color={Colors.primary} />
                <View>
                  <Text style={[styles.menuBtnTitle, { color: textColor }]}>{t.rooms.rooms}</Text>
                  <Text style={[styles.menuBtnSub, { color: textSec }]}>{t.rooms.addRoom}</Text>
                </View>
              </View>
              <ChevronRight size={16} color={textMut} />
            </TouchableOpacity>
            {currentUser?.role === 'super_admin' && (
              <>
                <View style={{ height: 8 }} />
                <TouchableOpacity style={[styles.menuBtn, { backgroundColor: cardBg, borderColor: borderCol }]} onPress={() => router.push('/import-rooms' as any)}>
                  <View style={styles.menuBtnLeft}>
                    <Upload size={18} color={Colors.teal} />
                    <View>
                      <Text style={[styles.menuBtnTitle, { color: textColor }]}>Importer des chambres</Text>
                      <Text style={[styles.menuBtnSub, { color: textSec }]}>Import en masse via CSV / Excel</Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color={textMut} />
                </TouchableOpacity>
              </>
            )}
            <View style={{ height: 8 }} />
            <TouchableOpacity style={[styles.menuBtn, { backgroundColor: cardBg, borderColor: borderCol }]} onPress={() => router.push('/qr-manager' as any)}>
              <View style={styles.menuBtnLeft}>
                <QrCode size={18} color="#6B5CE7" />
                <View>
                  <Text style={[styles.menuBtnTitle, { color: textColor }]}>QR Codes</Text>
                  <Text style={[styles.menuBtnSub, { color: textSec }]}>Ménage, avis chambres, avis PDJ</Text>
                </View>
              </View>
              <ChevronRight size={16} color={textMut} />
            </TouchableOpacity>
            <View style={{ height: 8 }} />
            <TouchableOpacity style={[styles.menuBtn, { backgroundColor: cardBg, borderColor: borderCol }]} onPress={() => router.push('/satisfaction-dashboard' as any)}>
              <View style={styles.menuBtnLeft}>
                <BarChart3 size={18} color="#F59E0B" />
                <View>
                  <Text style={[styles.menuBtnTitle, { color: textColor }]}>Satisfaction Clients</Text>
                  <Text style={[styles.menuBtnSub, { color: textSec }]}>Dashboard, alertes, avis</Text>
                </View>
              </View>
              <ChevronRight size={16} color={textMut} />
            </TouchableOpacity>
            <View style={{ height: 8 }} />
            <TouchableOpacity style={[styles.menuBtn, { backgroundColor: cardBg, borderColor: borderCol }]} onPress={() => router.push('/history')}>
              <View style={styles.menuBtnLeft}>
                <History size={18} color={Colors.primary} />
                <View>
                  <Text style={[styles.menuBtnTitle, { color: textColor }]}>{t.direction.historyLabel}</Text>
                  <Text style={[styles.menuBtnSub, { color: textSec }]}>{t.gouvernante.economatDesc}</Text>
                </View>
              </View>
              <ChevronRight size={16} color={textMut} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={18} color={Colors.primary} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>{t.settings.pmsConnectivity}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={styles.cardRow}>
              <Server size={16} color={textMut} />
              <Text style={[styles.cardLabel, { color: textSec }]}>{t.settings.connectionStatus}</Text>
              <View style={styles.statusBadge}>
                {getSyncStatusIcon()}
                <Text style={[styles.statusText, { color: textColor }]}>{getSyncStatusLabel()}</Text>
              </View>
            </View>
            {pmsSync.lastSyncTime ? (
              <View style={styles.cardRow}>
                <Clock size={16} color={textMut} />
                <Text style={[styles.cardLabel, { color: textSec }]}>{t.settings.lastSync}</Text>
                <Text style={[styles.cardValue, { color: textColor }]}>
                  {new Date(pmsSync.lastSyncTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ) : null}
            {pmsSync.recordsUpdated > 0 && (
              <View style={styles.cardRow}>
                <CheckCircle size={16} color={textMut} />
                <Text style={[styles.cardLabel, { color: textSec }]}>{t.settings.records}</Text>
                <Text style={[styles.cardValue, { color: textColor }]}>{pmsSync.recordsUpdated}</Text>
              </View>
            )}
            {pmsSync.errorMessage ? (
              <View style={styles.errorBox}>
                <AlertTriangle size={14} color={Colors.danger} />
                <Text style={styles.errorText}>{pmsSync.errorMessage}</Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={[styles.syncBtn, isSyncing && styles.syncBtnDisabled]}
              onPress={() => syncPms()}
              disabled={isSyncing}
            >
              <RefreshCw size={16} color={Colors.white} />
              <Text style={styles.syncBtnText}>{isSyncing ? t.settings.syncing : t.settings.forceSync}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={18} color={Colors.primary} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>{t.settings.statistics}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={styles.cardRow}>
              <Text style={[styles.cardLabel, { color: textSec }]}>{t.settings.totalRooms}</Text>
              <Text style={[styles.cardValue, { color: textColor }]}>{rooms.length}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={[styles.cardLabel, { color: textSec }]}>{t.settings.activeReservations}</Text>
              <Text style={[styles.cardValue, { color: textColor }]}>{rooms.filter((r) => r.currentReservation !== null).length}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={[styles.cardLabel, { color: textSec }]}>{t.settings.floors}</Text>
              <Text style={[styles.cardValue, { color: textColor }]}>{[...new Set(rooms.map((r) => r.floor))].length}</Text>
            </View>
          </View>
        </View>

        {currentUser?.role === 'super_admin' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={18} color="#7C4DFF" />
              <Text style={[styles.sectionTitle, { color: textColor }]}>{t.settings.administration}</Text>
            </View>
            <TouchableOpacity style={[styles.adminBtn, { backgroundColor: cardBg }]} onPress={() => router.push('/(superadmin)/dashboard')}>
              <View style={styles.adminBtnLeft}>
                <Shield size={18} color="#7C4DFF" />
                <View>
                  <Text style={[styles.adminBtnTitle, { color: textColor }]}>{t.settings.superAdmin}</Text>
                  <Text style={[styles.adminBtnSub, { color: textSec }]}>{t.settings.superAdminDesc}</Text>
                </View>
              </View>
              <ChevronRight size={16} color={textMut} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trash2 size={18} color={Colors.danger} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>{t.settings.data}</Text>
          </View>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleResetData}>
            <Trash2 size={16} color={Colors.danger} />
            <Text style={styles.dangerBtnText}>{t.settings.resetAllData}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: cardBg }]} onPress={handleLogout}>
          <LogOut size={18} color={Colors.danger} />
          <Text style={styles.logoutBtnText}>{t.auth.logout}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <Text style={styles.footerBrandAccent}>FLOW</Text>
            <Text style={[styles.footerBrandText, { color: textMut }]}>TYM</Text>
          </View>
          <Text style={[styles.footerSub, { color: textMut }]}>Gestion Hôtelière • v2.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const },
  profileCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16, gap: 14, borderWidth: 1 },
  profileAvatar: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontSize: 16, fontWeight: '700' as const },
  profileEmail: { fontSize: 12 },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  profileRoleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  profileRoleDot: { width: 6, height: 6, borderRadius: 3 },
  profileRoleText: { fontSize: 11, fontWeight: '600' as const },
  profileHotel: { fontSize: 11 },

  prefCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  prefIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  prefLabel: { flex: 1, fontSize: 14, fontWeight: '600' as const },
  prefValue: { fontSize: 12, fontWeight: '500' as const },
  prefSwitch: { transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] },
  prefDivider: { height: 1, marginHorizontal: 16 },
  prefSection: { paddingBottom: 12 },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 4 },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceLight,
  },
  themeSwatch: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  themeLabel: { fontSize: 11, fontWeight: '500' as const },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 8 },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  langChipActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  langFlag: { fontSize: 14 },
  langLabel: { fontSize: 11, fontWeight: '600' as const, color: Colors.textSecondary },
  langLabelActive: { color: Colors.primary },

  menuBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1 },
  menuBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  menuBtnTitle: { fontSize: 14, fontWeight: '700' as const },
  menuBtnSub: { fontSize: 11, marginTop: 2 },
  card: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardLabel: { flex: 1, fontSize: 13 },
  cardValue: { fontSize: 13, fontWeight: '600' as const },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 12, fontWeight: '600' as const },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.danger + '10', padding: 10, borderRadius: 8 },
  errorText: { fontSize: 12, color: Colors.danger, flex: 1 },
  syncBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 10, marginTop: 4 },
  syncBtnDisabled: { opacity: 0.5 },
  syncBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' as const },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.danger + '10', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.danger + '25' },
  dangerBtnText: { color: Colors.danger, fontSize: 14, fontWeight: '600' as const },
  adminBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: '#7C4DFF25' },
  adminBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  adminBtnTitle: { fontSize: 14, fontWeight: '700' as const },
  adminBtnSub: { fontSize: 11, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, marginBottom: 24, borderRadius: 14, borderWidth: 1, borderColor: Colors.danger + '25' },
  logoutBtnText: { fontSize: 15, fontWeight: '600' as const, color: Colors.danger },
  footer: { alignItems: 'center', paddingTop: 10, gap: 4 },
  footerBrand: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  footerBrandAccent: { fontSize: 14, fontWeight: '800' as const, color: Colors.primary, letterSpacing: -0.3 },
  footerBrandText: { fontSize: 14, fontWeight: '800' as const, letterSpacing: -0.3 },
  footerSub: { fontSize: 11 },
  configNotice: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  configNoticeTitle: { fontSize: 14, fontWeight: '700' as const },
  configNoticeSub: { fontSize: 12, marginTop: 2, lineHeight: 17 },
});
