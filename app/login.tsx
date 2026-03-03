import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Shield, Building2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth, AuthUser } from '@/providers/AuthProvider';
import { ADMIN_ROLE_CONFIG, AdminUserRole } from '@/constants/types';

const ROLE_ICONS: Record<AdminUserRole, string> = {
  super_admin: '🛡️',
  support: '🎧',
  direction: '📊',
  reception: '🏨',
  gouvernante: '✅',
  femme_de_chambre: '🧹',
  maintenance: '🔧',
  breakfast: '☕',
};

export default function LoginScreen() {
  const router = useRouter();
  const { demoUsers, login } = useAuth();
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, logoScale]);

  const handleLogin = useCallback((user: AuthUser) => {
    setSelectedUser(user);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    login(user, {
      onSuccess: () => {
        console.log('[Login] Success, role:', user.role);
        if (user.role === 'super_admin' || user.role === 'support') {
          router.replace('/(superadmin)/dashboard');
        } else if (user.role === 'femme_de_chambre') {
          router.replace('/(tabs)/housekeeping');
        } else if (user.role === 'maintenance') {
          router.replace('/(tabs)/maintenance');
        } else if (user.role === 'breakfast') {
          router.replace('/(tabs)/breakfast');
        } else if (user.role === 'gouvernante') {
          router.replace('/(tabs)/gouvernante');
        } else if (user.role === 'direction') {
          router.replace('/(tabs)/direction');
        } else {
          router.replace('/(tabs)/reception');
        }
      },
    });
  }, [login, router]);

  const groupedByHotel = demoUsers.reduce<Record<string, AuthUser[]>>((acc, user) => {
    const key = user.hotelName ?? 'Plateforme FLOWTYM';
    if (!acc[key]) acc[key] = [];
    acc[key].push(user);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Building2 size={28} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.brandRow}>
              <Text style={styles.brandBold}>FLOW</Text>
              <Text style={styles.brandLight}>TYM</Text>
            </View>
            <Text style={styles.subtitle}>Gestion Hôtelière Intelligente</Text>
          </Animated.View>

          <Animated.View style={[styles.formSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.demoNotice}>
              <Shield size={14} color="#5B8A9A" />
              <Text style={styles.demoNoticeText}>Mode démo — Sélectionnez un profil pour accéder à l{"'"}application</Text>
            </View>

            {Object.entries(groupedByHotel).map(([hotelName, users]) => (
              <View key={hotelName} style={styles.hotelGroup}>
                <View style={styles.hotelGroupHeader}>
                  <Building2 size={14} color="#5B8A9A" />
                  <Text style={styles.hotelGroupName}>{hotelName}</Text>
                </View>
                {users.map((user) => {
                  const roleConfig = ADMIN_ROLE_CONFIG[user.role];
                  const isSelected = selectedUser?.id === user.id;
                  return (
                    <TouchableOpacity
                      key={user.id}
                      style={[styles.userCard, isSelected && styles.userCardSelected]}
                      onPress={() => handleLogin(user)}
                      activeOpacity={0.7}
                      testID={`login-user-${user.id}`}
                    >
                      <View style={[styles.userAvatar, { backgroundColor: roleConfig.color + '18' }]}>
                        <Text style={styles.userAvatarEmoji}>{ROLE_ICONS[user.role]}</Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
                        <View style={styles.userMeta}>
                          <View style={[styles.roleBadge, { backgroundColor: roleConfig.color + '15' }]}>
                            <View style={[styles.roleDot, { backgroundColor: roleConfig.color }]} />
                            <Text style={[styles.roleLabel, { color: roleConfig.color }]}>{roleConfig.label}</Text>
                          </View>
                        </View>
                      </View>
                      <ChevronRight size={16} color="#90A4AE" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>v2.0 • Propulsé par FLOWTYM</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B2E3B',
  },
  flex: { flex: 1 },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 30,
    gap: 10,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#1A4D5C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A4D5C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBold: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  brandLight: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },
  formSection: {
    paddingHorizontal: 20,
    gap: 6,
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(26,77,92,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  demoNoticeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    flex: 1,
  },
  hotelGroup: {
    marginBottom: 16,
  },
  hotelGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  hotelGroupName: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#5B8A9A',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  userCardSelected: {
    backgroundColor: 'rgba(26,77,92,0.4)',
    borderColor: '#1A4D5C',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarEmoji: {
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 30,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
  },
});
