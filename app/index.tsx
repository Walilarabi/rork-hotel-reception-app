import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Colors } from '@/constants/colors';

export default function IndexScreen() {
  const router = useRouter();
  const { currentUser, isReady } = useAuth();
  const { loadUserPrefs } = useTheme();

  useEffect(() => {
    if (!isReady) return;

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    loadUserPrefs(currentUser.id).then(() => {
      console.log('[Index] User prefs loaded for:', currentUser.id);
      if (currentUser.role === 'super_admin' || currentUser.role === 'support') {
        router.replace('/(superadmin)/dashboard');
      } else if (currentUser.role === 'femme_de_chambre') {
        router.replace('/(tabs)/housekeeping');
      } else if (currentUser.role === 'maintenance') {
        router.replace('/(tabs)/maintenance');
      } else if (currentUser.role === 'breakfast') {
        router.replace('/(tabs)/breakfast');
      } else if (currentUser.role === 'gouvernante') {
        router.replace('/(tabs)/gouvernante');
      } else if (currentUser.role === 'direction') {
        router.replace('/(tabs)/direction');
      } else {
        router.replace('/(tabs)/reception');
      }
    });
  }, [isReady, currentUser, router, loadUserPrefs]);

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
