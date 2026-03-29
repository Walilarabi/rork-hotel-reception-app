import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/providers/AuthProvider";
import { HotelProvider } from "@/providers/HotelProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Retour", headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(superadmin)" />
      <Stack.Screen name="room-details" options={{ headerShown: true, title: "Détails chambre" }} />
      <Stack.Screen name="task-detail" options={{ headerShown: true, title: "Détail tâche" }} />
      <Stack.Screen name="ticket-detail" options={{ headerShown: true, title: "Détail ticket" }} />
      <Stack.Screen name="validate-room" options={{ headerShown: true, title: "Valider chambre" }} />
      <Stack.Screen name="add-room" options={{ presentation: "modal", title: "Ajouter chambre" }} />
      <Stack.Screen name="assign-rooms" options={{ presentation: "modal", title: "Affecter chambres" }} />
      <Stack.Screen name="settings" options={{ headerShown: true, title: "Paramètres" }} />
      <Stack.Screen name="team" options={{ headerShown: true, title: "Équipe" }} />
      <Stack.Screen name="invite-user" options={{ presentation: "modal", title: "Inviter" }} />
      <Stack.Screen name="history" options={{ headerShown: true, title: "Historique" }} />
      <Stack.Screen name="configuration" options={{ headerShown: true, title: "Configuration" }} />
      <Stack.Screen name="hotel-plan" options={{ headerShown: true, title: "Plan hôtel" }} />
      <Stack.Screen name="hotel-detail" options={{ headerShown: true, title: "Détail hôtel" }} />
      <Stack.Screen name="control-center" options={{ headerShown: true, title: "Centre de contrôle" }} />
      <Stack.Screen name="economat" options={{ headerShown: true, title: "Économat" }} />
      <Stack.Screen name="satisfaction-dashboard" options={{ headerShown: true, title: "Satisfaction" }} />
      <Stack.Screen name="client-review" options={{ presentation: "modal", title: "Avis client" }} />
      <Stack.Screen name="housekeeping-assignments" options={{ headerShown: true, title: "Affectations" }} />
      <Stack.Screen name="maintenance-tracking" options={{ headerShown: true, title: "Suivi maintenance" }} />
      <Stack.Screen name="reception-objets-trouves" options={{ headerShown: true, title: "Objets trouvés" }} />
      <Stack.Screen name="reception-signalements" options={{ headerShown: true, title: "Signalements" }} />
      <Stack.Screen name="breakfast-config" options={{ headerShown: true, title: "Config petit-déj" }} />
      <Stack.Screen name="breakfast-stats" options={{ headerShown: true, title: "Stats petit-déj" }} />
      <Stack.Screen name="breakfast-walkin" options={{ presentation: "modal", title: "Walk-in" }} />
      <Stack.Screen name="forecast-config" options={{ headerShown: true, title: "Prévisions" }} />
      <Stack.Screen name="import-hotel" options={{ presentation: "modal", title: "Importer hôtel" }} />
      <Stack.Screen name="import-rooms" options={{ presentation: "modal", title: "Importer chambres" }} />
      <Stack.Screen name="import-reservations" options={{ presentation: "modal", title: "Importer réservations" }} />
      <Stack.Screen name="qr-manager" options={{ headerShown: true, title: "QR Codes" }} />
      <Stack.Screen name="chatbot-admin" options={{ headerShown: true, title: "Assistant IA" }} />
      <Stack.Screen name="order-detail" options={{ presentation: "modal", title: "Détail commande" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <ThemeProvider>
            <HotelProvider>
              <RootLayoutNav />
            </HotelProvider>
          </ThemeProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
