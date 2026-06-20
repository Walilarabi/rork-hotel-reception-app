import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useRoles } from '@/providers/RolesProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Colors } from '@/constants/colors';

export default function IndexScreen() {
  const router = useRouter();
  const { currentUser, isReady } = useAuth();
  const { getLanding } = useRoles();
  const { loadUserPrefs } = useTheme();

  useEffect(() => {
    if (!isReady) return;

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    void loadUserPrefs(currentUser.id, currentUser.role).then(() => {
      console.log('[Index] User prefs loaded for:', currentUser.id);
      // Rôles web (super admin / support) -> console web.
      if (currentUser.role === 'super_admin' || currentUser.role === 'support') {
        router.replace('/(superadmin)/dashboard');
        return;
      }
      // Rôles terrain (builtin ou personnalisés) -> module d'atterrissage du registre.
      const landing = getLanding(currentUser.role);
      if (landing) {
        router.replace(landing.route as any);
      } else {
        // Rôle sans module mobile (ex. réception, gérée côté web) : repli connexion.
        console.warn('[Index] No mobile landing module for role:', currentUser.role);
        router.replace('/login');
      }
    });
  }, [isReady, currentUser, router, loadUserPrefs, getLanding]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
