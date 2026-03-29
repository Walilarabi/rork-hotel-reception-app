import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Platform,
  Switch,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {
  User,
  Moon,
  Sun,
  Lock,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  Palette,
  Check,
  Globe,
  ChevronLeft,
  Pencil,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme, MOBILE_THEMES, MobileThemeId } from '@/providers/ThemeProvider';
import { Colors } from '@/constants/colors';
import { ADMIN_ROLE_CONFIG } from '@/constants/types';
import { LANGUAGES, LanguageId } from '@/constants/i18n';
import SecurityPolicyModal from '@/components/SecurityPolicyModal';

interface UserMenuButtonProps {
  tintColor?: string;
  size?: number;
}

type SubMenu = 'none' | 'theme' | 'language' | 'editName';

export default function UserMenuButton({ tintColor = Colors.white, size = 28 }: UserMenuButtonProps) {
  const router = useRouter();
  const { currentUser, logout, updateUserName } = useAuth();
  const { themeId, setMobileTheme, isDarkMode, toggleDarkMode, languageId, setLanguage, t, modeColors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [subMenu, setSubMenu] = useState<SubMenu>('none');
  const [securityVisible, setSecurityVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const roleConfig = currentUser ? ADMIN_ROLE_CONFIG[currentUser.role] : null;
  const MOBILE_ROLES: string[] = ['reception', 'gouvernante', 'femme_de_chambre', 'maintenance', 'breakfast', 'spa'];
  const isMobileRole = currentUser ? MOBILE_ROLES.includes(currentUser.role) : false;

  const initials = currentUser
    ? `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`
    : '??';

  const openMenu = useCallback(() => {
    setVisible(true);
    setSubMenu('none');
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const closeMenu = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      setSubMenu('none');
    });
  }, [fadeAnim, scaleAnim]);

  const handleAction = useCallback((action: string) => {
    closeMenu();
    setTimeout(() => {
      switch (action) {
        case 'profile':
          router.push('/settings');
          break;
        case 'settings':
          router.push('/settings');
          break;
        case 'password':
          break;
        case 'security':
          setSecurityVisible(true);
          break;
        case 'logout':
          logout(undefined, {
            onSuccess: () => {
              router.replace('/login');
            },
          });
          break;
      }
    }, 200);
  }, [closeMenu, router, logout]);

  const handleToggleDark = useCallback(() => {
    void toggleDarkMode();
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [toggleDarkMode]);

  const handleThemeSelect = useCallback((id: MobileThemeId) => {
    void setMobileTheme(id);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubMenu('none');
  }, [setMobileTheme]);

  const handleLanguageSelect = useCallback((id: LanguageId) => {
    void setLanguage(id);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubMenu('none');
  }, [setLanguage]);

  const handleOpenEditName = useCallback(() => {
    if (currentUser) {
      setEditFirstName(currentUser.firstName);
      setEditLastName(currentUser.lastName);
    }
    setSubMenu('editName');
  }, [currentUser]);

  const handleSaveName = useCallback(() => {
    const fn = editFirstName.trim();
    const ln = editLastName.trim();
    if (!fn || !ln) {
      Alert.alert(t.common.error, t.common.noData);
      return;
    }
    void updateUserName(fn, ln);
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubMenu('none');
  }, [editFirstName, editLastName, updateUserName, t]);

  const currentLang = LANGUAGES.find((l) => l.id === languageId);

  if (!currentUser) return null;

  const menuBg = isDarkMode ? modeColors.surface : Colors.surface;
  const menuText = isDarkMode ? modeColors.text : Colors.text;
  const menuTextSec = isDarkMode ? modeColors.textSecondary : Colors.textSecondary;
  const menuTextMut = isDarkMode ? modeColors.textMuted : Colors.textMuted;
  const menuBorder = isDarkMode ? modeColors.border : Colors.border;

  const renderMainMenu = () => (
    <>
      <View style={[styles.menuHeader, { borderBottomColor: menuBorder }]}>
        <View style={[styles.menuAvatar, { backgroundColor: (roleConfig?.color ?? Colors.primary) + '20' }]}>
          <Text style={[styles.menuAvatarText, { color: roleConfig?.color ?? Colors.primary }]}>{initials}</Text>
        </View>
        <View style={styles.menuHeaderInfo}>
          <Text style={[styles.menuUserName, { color: menuText }]}>{currentUser.firstName} {currentUser.lastName}</Text>
          <Text style={[styles.menuUserEmail, { color: menuTextMut }]}>{currentUser.email}</Text>
          <View style={[styles.menuRoleBadge, { backgroundColor: (roleConfig?.color ?? Colors.primary) + '15' }]}>
            <View style={[styles.menuRoleDot, { backgroundColor: roleConfig?.color ?? Colors.primary }]} />
            <Text style={[styles.menuRoleText, { color: roleConfig?.color ?? Colors.primary }]}>
              {t.roles[currentUser.role] ?? roleConfig?.label ?? currentUser.role}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.menuDivider, { backgroundColor: menuBorder }]} />

      <TouchableOpacity style={styles.menuItem} onPress={() => handleAction('profile')} activeOpacity={0.6}>
        <View style={[styles.menuItemIcon, { backgroundColor: Colors.primary + '12' }]}>
          <User size={16} color={Colors.primary} />
        </View>
        <Text style={[styles.menuItemLabel, { color: menuText }]}>{t.menu.myProfile}</Text>
        <ChevronRight size={14} color={menuTextMut} />
      </TouchableOpacity>

      {(currentUser.role === 'super_admin' || currentUser.role === 'support') && (
        <TouchableOpacity style={styles.menuItem} onPress={handleOpenEditName} activeOpacity={0.6}>
          <View style={[styles.menuItemIcon, { backgroundColor: '#8B5CF612' }]}>
            <Pencil size={16} color="#8B5CF6" />
          </View>
          <Text style={[styles.menuItemLabel, { color: menuText }]}>{t.menu.editName}</Text>
          <ChevronRight size={14} color={menuTextMut} />
        </TouchableOpacity>
      )}

      {!isMobileRole && (
        <View style={styles.menuItem}>
          <View style={[styles.menuItemIcon, { backgroundColor: '#6366F112' }]}>
            {isDarkMode ? <Sun size={16} color="#F59E0B" /> : <Moon size={16} color="#6366F1" />}
          </View>
          <Text style={[styles.menuItemLabel, { color: menuText }]}>{t.menu.darkMode}</Text>
          <Switch
            value={isDarkMode}
            onValueChange={handleToggleDark}
            trackColor={{ false: menuBorder, true: Colors.primary + '60' }}
            thumbColor={isDarkMode ? Colors.primary : '#f4f3f4'}
            style={styles.menuSwitch}
          />
        </View>
      )}

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setSubMenu('theme')}
        activeOpacity={0.6}
      >
        <View style={[styles.menuItemIcon, { backgroundColor: MOBILE_THEMES[themeId].primary + '15' }]}>
          <Palette size={16} color={MOBILE_THEMES[themeId].primary} />
        </View>
        <Text style={[styles.menuItemLabel, { color: menuText }]}>{t.menu.colorTheme}</Text>
        <View style={[styles.themePreviewDot, { backgroundColor: MOBILE_THEMES[themeId].primary }]} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setSubMenu('language')}
        activeOpacity={0.6}
      >
        <View style={[styles.menuItemIcon, { backgroundColor: '#3B82F612' }]}>
          <Globe size={16} color="#3B82F6" />
        </View>
        <Text style={[styles.menuItemLabel, { color: menuText }]}>{t.menu.language}</Text>
        <View style={styles.langPreview}>
          <Text style={styles.langFlag}>{currentLang?.flag}</Text>
          <Text style={[styles.langCode, { color: menuTextSec }]}>{currentLang?.nativeLabel}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => handleAction('password')} activeOpacity={0.6}>
        <View style={[styles.menuItemIcon, { backgroundColor: '#F59E0B12' }]}>
          <Lock size={16} color="#F59E0B" />
        </View>
        <Text style={[styles.menuItemLabel, { color: menuText }]}>{t.auth.changePassword}</Text>
        <ChevronRight size={14} color={menuTextMut} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => handleAction('settings')} activeOpacity={0.6}>
        <View style={[styles.menuItemIcon, { backgroundColor: Colors.textSecondary + '12' }]}>
          <Settings size={16} color={Colors.textSecondary} />
        </View>
        <Text style={[styles.menuItemLabel, { color: menuText }]}>{t.menu.settings}</Text>
        <ChevronRight size={14} color={menuTextMut} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => handleAction('security')} activeOpacity={0.6}>
        <View style={[styles.menuItemIcon, { backgroundColor: '#10B98112' }]}>
          <Shield size={16} color="#10B981" />
        </View>
        <Text style={[styles.menuItemLabel, { color: menuText }]}>{t.menu.securityPolicy}</Text>
        <ChevronRight size={14} color={menuTextMut} />
      </TouchableOpacity>

      <View style={[styles.menuDividerDanger, { backgroundColor: Colors.danger + '15' }]} />

      <TouchableOpacity style={styles.menuItemDanger} onPress={() => handleAction('logout')} activeOpacity={0.6}>
        <View style={[styles.menuItemIcon, { backgroundColor: Colors.danger + '12' }]}>
          <LogOut size={16} color={Colors.danger} />
        </View>
        <Text style={styles.menuItemLabelDanger}>{t.menu.logout}</Text>
      </TouchableOpacity>
    </>
  );

  const renderThemeMenu = () => (
    <>
      <TouchableOpacity
        style={[styles.subMenuHeader, { borderBottomColor: menuBorder }]}
        onPress={() => setSubMenu('none')}
        activeOpacity={0.7}
      >
        <ChevronLeft size={18} color={menuText} />
        <Text style={[styles.subMenuTitle, { color: menuText }]}>{t.menu.colorTheme}</Text>
      </TouchableOpacity>
      <View style={styles.themeGrid}>
        {(Object.keys(MOBILE_THEMES) as MobileThemeId[]).map((id) => {
          const th = MOBILE_THEMES[id];
          const isActive = themeId === id;
          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.themeCard,
                { borderColor: isActive ? th.primary : menuBorder, backgroundColor: isDarkMode ? modeColors.surfaceLight : Colors.surfaceLight },
                isActive && { borderWidth: 2 },
              ]}
              onPress={() => handleThemeSelect(id)}
              activeOpacity={0.7}
            >
              <View style={styles.themeCardTop}>
                <View style={[styles.themeCardSwatch, { backgroundColor: th.primary }]}>
                  {isActive && <Check size={14} color="#FFF" />}
                </View>
                <View style={[styles.themeCardAccent, { backgroundColor: th.primaryLight }]} />
              </View>
              <Text style={[styles.themeCardLabel, { color: isActive ? th.primary : menuTextSec }]}>
                {th.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  const renderLanguageMenu = () => (
    <>
      <TouchableOpacity
        style={[styles.subMenuHeader, { borderBottomColor: menuBorder }]}
        onPress={() => setSubMenu('none')}
        activeOpacity={0.7}
      >
        <ChevronLeft size={18} color={menuText} />
        <Text style={[styles.subMenuTitle, { color: menuText }]}>{t.menu.language}</Text>
      </TouchableOpacity>
      {LANGUAGES.map((lang) => {
        const isActive = languageId === lang.id;
        return (
          <TouchableOpacity
            key={lang.id}
            style={[styles.langItem, isActive && { backgroundColor: Colors.primary + '08' }]}
            onPress={() => handleLanguageSelect(lang.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.langItemFlag}>{lang.flag}</Text>
            <View style={styles.langItemInfo}>
              <Text style={[styles.langItemName, { color: isActive ? Colors.primary : menuText }]}>{lang.nativeLabel}</Text>
              {lang.nativeLabel !== lang.label && (
                <Text style={[styles.langItemSub, { color: menuTextMut }]}>{lang.label}</Text>
              )}
            </View>
            {isActive && <Check size={16} color={Colors.primary} />}
          </TouchableOpacity>
        );
      })}
    </>
  );

  const renderEditNameMenu = () => (
    <>
      <TouchableOpacity
        style={[styles.subMenuHeader, { borderBottomColor: menuBorder }]}
        onPress={() => setSubMenu('none')}
        activeOpacity={0.7}
      >
        <ChevronLeft size={18} color={menuText} />
        <Text style={[styles.subMenuTitle, { color: menuText }]}>{t.menu.editName}</Text>
      </TouchableOpacity>
      <View style={styles.editNameContainer}>
        <View style={styles.editNameField}>
          <Text style={[styles.editNameLabel, { color: menuTextSec }]}>{t.menu.myProfile}</Text>
          <TextInput
            style={[styles.editNameInput, { color: menuText, backgroundColor: isDarkMode ? modeColors.surfaceLight : '#F8F9FA', borderColor: menuBorder }]}
            value={editFirstName}
            onChangeText={setEditFirstName}
            placeholder={t.menu.editName}
            placeholderTextColor={menuTextMut}
          />
        </View>
        <View style={styles.editNameField}>
          <Text style={[styles.editNameLabel, { color: menuTextSec }]}>{t.roles[currentUser.role]}</Text>
          <TextInput
            style={[styles.editNameInput, { color: menuText, backgroundColor: isDarkMode ? modeColors.surfaceLight : '#F8F9FA', borderColor: menuBorder }]}
            value={editLastName}
            onChangeText={setEditLastName}
            placeholder={t.menu.editName}
            placeholderTextColor={menuTextMut}
          />
        </View>
        <TouchableOpacity
          style={[styles.editNameSaveBtn, { backgroundColor: Colors.primary }]}
          onPress={handleSaveName}
          activeOpacity={0.7}
        >
          <Text style={styles.editNameSaveBtnText}>{t.common.save}</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.avatarBtn, { width: size, height: size, borderRadius: size / 2 }]}
        onPress={openMenu}
        activeOpacity={0.7}
        testID="user-menu-button"
      >
        <Text style={[styles.avatarText, { fontSize: size * 0.38, color: tintColor }]}>{initials}</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <Pressable style={styles.overlay} onPress={closeMenu}>
          <Animated.View
            style={[
              styles.menuContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Pressable onPress={() => {}} style={[styles.menuInner, { backgroundColor: menuBg }]}>
              <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={styles.menuScroll}>
                {subMenu === 'none' && renderMainMenu()}
                {subMenu === 'theme' && renderThemeMenu()}
                {subMenu === 'language' && renderLanguageMenu()}
                {subMenu === 'editName' && renderEditNameMenu()}
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      <SecurityPolicyModal visible={securityVisible} onClose={() => setSecurityVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  avatarBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  avatarText: {
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 100 : 60,
    paddingRight: 12,
  },
  menuContainer: {
    width: 290,
    maxWidth: '90%' as const,
    maxHeight: '75%' as const,
  },
  menuInner: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      },
    }),
  },
  menuScroll: {
    maxHeight: 560,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuAvatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  menuHeaderInfo: {
    flex: 1,
    gap: 2,
  },
  menuUserName: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  menuUserEmail: {
    fontSize: 11,
  },
  menuRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 3,
  },
  menuRoleDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  menuRoleText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  menuDividerDanger: {
    height: 1,
    marginHorizontal: 16,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  menuItemDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemLabelDanger: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  menuSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  themePreviewDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  langPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langFlag: {
    fontSize: 14,
  },
  langCode: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  subMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderBottomWidth: 1,
  },
  subMenuTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  themeCard: {
    width: '47%' as const,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  themeCardTop: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  themeCardSwatch: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeCardAccent: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  themeCardLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  langItemFlag: {
    fontSize: 22,
  },
  langItemInfo: {
    flex: 1,
    gap: 1,
  },
  langItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  langItemSub: {
    fontSize: 11,
  },
  editNameContainer: {
    padding: 16,
    gap: 12,
  },
  editNameField: {
    gap: 4,
  },
  editNameLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  editNameInput: {
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  editNameSaveBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  editNameSaveBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
