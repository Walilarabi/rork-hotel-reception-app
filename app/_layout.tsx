import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HotelProvider } from '@/providers/HotelProvider';
import { SuperAdminProvider } from '@/providers/SuperAdminProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Colors } from '@/constants/colors';
import { FT } from '@/constants/flowtym';

try {
  SplashScreen.preventAutoHideAsync();
} catch (e) {
  console.log('[RootLayout] SplashScreen.preventAutoHideAsync failed:', e);
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.log('[AppErrorBoundary] Caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={ebStyles.container}>
          <Text style={ebStyles.icon}>⚠️</Text>
          <Text style={ebStyles.title}>Une erreur est survenue</Text>
          <Text style={ebStyles.message}>{this.state.error?.message ?? 'Erreur inconnue'}</Text>
          <TouchableOpacity
            style={ebStyles.button}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={ebStyles.buttonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const ebStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 24, gap: 12 },
  icon: { fontSize: 48 },
  title: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  message: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  button: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: Colors.white, fontSize: 14, fontWeight: '600' as const },
});

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Retour',
        headerStyle: { backgroundColor: FT.headerBg },
        headerTintColor: '#FFFFFF',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(superadmin)" options={{ headerShown: false }} />
      <Stack.Screen name="room-details" options={{ title: 'Détails chambre' }} />
      <Stack.Screen name="add-room" options={{ presentation: 'modal', title: 'Nouvelle chambre' }} />
      <Stack.Screen name="assign-rooms" options={{ presentation: 'modal', title: 'Assigner' }} />
      <Stack.Screen name="validate-room" options={{ title: 'Validation' }} />
      <Stack.Screen name="task-detail" options={{ title: 'Détail tâche' }} />
      <Stack.Screen name="ticket-detail" options={{ title: 'Intervention' }} />
      <Stack.Screen name="order-detail" options={{ title: 'Commande PDJ' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal', title: 'Paramètres' }} />
      <Stack.Screen name="hotel-detail" options={{ presentation: 'modal', title: 'Hôtel', headerStyle: { backgroundColor: FT.headerBg }, headerTintColor: '#FFFFFF' }} />
      <Stack.Screen name="invite-user" options={{ presentation: 'modal', title: 'Inviter', headerStyle: { backgroundColor: FT.headerBg }, headerTintColor: '#FFFFFF' }} />
      <Stack.Screen name="team" options={{ presentation: 'modal', title: 'Équipe' }} />
      <Stack.Screen name="breakfast-walkin" options={{ presentation: 'modal', title: 'PDJ Hors-forfait' }} />
      <Stack.Screen name="economat" options={{ title: 'Économat' }} />
      <Stack.Screen name="maintenance-tracking" options={{ title: 'Suivi Maintenance' }} />
      <Stack.Screen name="breakfast-config" options={{ presentation: 'modal', title: 'Config. PDJ' }} />
      <Stack.Screen name="breakfast-stats" options={{ title: 'Stats PDJ' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    try {
      SplashScreen.hideAsync();
    } catch (e) {
      console.log('[RootLayout] SplashScreen.hideAsync failed:', e);
    }
  }, []);

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: FT.bg }}>
          <AuthProvider>
            <ThemeProvider>
              <HotelProvider>
                <SuperAdminProvider>
                  <RootLayoutNav />
                </SuperAdminProvider>
              </HotelProvider>
            </ThemeProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
