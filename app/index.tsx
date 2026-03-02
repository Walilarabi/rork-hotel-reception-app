import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { Colors } from '@/constants/colors';

export default function IndexScreen() {
  const router = useRouter();
  const { currentUser, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) return;

    if (!currentUser) {
      router.replace('/login');
    } else if (currentUser.role === 'super_admin') {
      router.replace('/(superadmin)/dashboard');
    } else {
      router.replace('/(tabs)/reception');
    }
  }, [isReady, currentUser, router]);

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
