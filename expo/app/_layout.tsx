import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState, Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HotelProvider } from '@/providers/HotelProvider';
import { SuperAdminProvider } from '@/providers/SuperAdminProvider';
import { SubscriptionProvider } from '@/providers/SubscriptionProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ChatbotProvider } from '@/providers/ChatbotProvider';
import { ForecastProvider } from '@/providers/ForecastProvider';
import { ConfigurationProvider } from '@/providers/ConfigurationProvider';
import { SatisfactionProvider } from '@/providers/SatisfactionProvider';
import { HousekeepingManagerProvider } from '@/providers/HousekeepingProvider';
import ChatBot from '@/components/ChatBot';
import { Colors } from '@/constants/colors';
import { FT } from '@/constants/flowtym';

const DATA_VERSION_KEY = 'flowtym_data_version';
const CURRENT_DATA_VERSION = '4';

try {
  void SplashScreen.preventAutoHideAsync();
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
      <Stack.Screen name="history" options={{ title: 'Historique' }} />
      <Stack.Screen name="client-review" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="chatbot-admin" options={{ presentation: 'modal', title: 'FAQ Assistant' }} />
      <Stack.Screen name="forecast-config" options={{ presentation: 'modal', title: 'Planification' }} />
      <Stack.Screen name="import-reservations" options={{ presentation: 'modal', title: 'Import réservations' }} />
      <Stack.Screen name="configuration" options={{ presentation: 'modal', title: 'Configuration' }} />
      <Stack.Screen name="import-rooms" options={{ presentation: 'modal', title: 'Import chambres' }} />
      <Stack.Screen name="qr-manager" options={{ title: 'QR Codes' }} />
      <Stack.Screen name="satisfaction-dashboard" options={{ title: 'Satisfaction' }} />
      <Stack.Screen name="import-hotel" options={{ presentation: 'modal', title: 'Import Hôtel' }} />
      <Stack.Screen name="hotel-plan" options={{ title: 'Plan de l\'hôtel' }} />
      <Stack.Screen name="housekeeping-assignments" options={{ title: 'Répartition chambres' }} />
      <Stack.Screen name="control-center" options={{ title: 'Centre de contrôle' }} />
      <Stack.Screen name="reception-signalements" options={{ title: 'Signalements' }} />
      <Stack.Screen name="reception-objets-trouves" options={{ title: 'Objets trouvés' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    async function initData() {
      try {
        console.log('[RootLayout] Checking data version...');
        const storedVersion = await AsyncStorage.getItem(DATA_VERSION_KEY);
        if (storedVersion !== CURRENT_DATA_VERSION) {
          console.log('[RootLayout] Data version mismatch, clearing stale data. stored:', storedVersion, 'current:', CURRENT_DATA_VERSION);
          await AsyncStorage.clear();
          await AsyncStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
          console.log('[RootLayout] AsyncStorage cleared and version set.');
        } else {
          console.log('[RootLayout] Data version OK.');
        }
      } catch (e) {
        console.log('[RootLayout] Error during data init, clearing all:', e);
        try {
          await AsyncStorage.clear();
          await AsyncStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
        } catch (clearError) {
          console.log('[RootLayout] Failed to clear AsyncStorage:', clearError);
        }
      } finally {
        setIsDataReady(true);
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.log('[RootLayout] SplashScreen.hideAsync failed:', e);
        }
      }
    }
    void initData();
  }, []);

  if (!isDataReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: FT.bg }}>
        <ActivityIndicator size="large" color={FT.brand} />
      </View>
    );
  }

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: FT.bg }}>
          <AuthProvider>
            <ThemeProvider>
              <HotelProvider>
                <ForecastProvider>
                  <SuperAdminProvider>
                    <SubscriptionProvider>
                      <ConfigurationProvider>
                        <SatisfactionProvider>
                          <HousekeepingManagerProvider>
                            <ChatbotProvider>
                              <RootLayoutNav />
                              <ChatBot />
                            </ChatbotProvider>
                          </HousekeepingManagerProvider>
                        </SatisfactionProvider>
                      </ConfigurationProvider>
                    </SubscriptionProvider>
                  </SuperAdminProvider>
                </ForecastProvider>
              </HotelProvider>
            </ThemeProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
