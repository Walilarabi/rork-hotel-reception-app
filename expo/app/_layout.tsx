import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { HotelProvider } from "@/providers/HotelProvider";
import { SuperAdminProvider } from "@/providers/SuperAdminProvider";
import { HousekeepingManagerProvider } from "@/providers/HousekeepingProvider";
import { SubscriptionProvider } from "@/providers/SubscriptionProvider";
import { ForecastProvider } from "@/providers/ForecastProvider";
import { SatisfactionProvider } from "@/providers/SatisfactionProvider";
import { ChatbotProvider } from "@/providers/ChatbotProvider";
import { ConfigurationProvider } from "@/providers/ConfigurationProvider";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Retour" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(superadmin)" options={{ headerShown: false }} />
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
              <SuperAdminProvider>
                <SubscriptionProvider>
                  <HousekeepingManagerProvider>
                        <ForecastProvider>
                          <SatisfactionProvider>
                            <ChatbotProvider>
                              <ConfigurationProvider>
                                <RootLayoutNav />
                              </ConfigurationProvider>
                            </ChatbotProvider>
                          </SatisfactionProvider>
                        </ForecastProvider>
                      </HousekeepingManagerProvider>
                </SubscriptionProvider>
              </SuperAdminProvider>
            </HotelProvider>
          </ThemeProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
