import { Tabs } from 'expo-router';
import { BedDouble, ClipboardCheck, Sparkles, Wrench, Coffee, BarChart3 } from 'lucide-react-native';
import React from 'react';
import { FT } from '@/constants/flowtym';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';

export default function TabLayout() {
  const { currentUser } = useAuth();
  const { isDarkMode, modeColors, theme, t } = useTheme();
  const role = currentUser?.role;

  const showDirection = role === 'direction';
  const showReception = role === 'reception' || role === 'direction';
  const showGouvernante = role === 'gouvernante' || role === 'direction';
  const showHousekeeping = role === 'femme_de_chambre' || role === 'direction' || role === 'gouvernante';
  const showMaintenance = role === 'maintenance' || role === 'direction';
  const showBreakfast = role === 'breakfast' || role === 'direction';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: isDarkMode ? modeColors.textMuted : FT.textMuted,
        tabBarStyle: {
          backgroundColor: isDarkMode ? modeColors.surface : FT.surface,
          borderTopColor: isDarkMode ? modeColors.border : FT.border,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="direction"
        options={{
          title: t.direction.title,
          tabBarIcon: ({ color, size }) => <BarChart3 size={size - 2} color={color} />,
          href: showDirection ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="reception"
        options={{
          title: t.reception.title,
          tabBarIcon: ({ color, size }) => <BedDouble size={size - 2} color={color} />,
          href: showReception ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="gouvernante"
        options={{
          title: t.gouvernante.title,
          tabBarIcon: ({ color, size }) => <ClipboardCheck size={size - 2} color={color} />,
          href: showGouvernante ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="housekeeping"
        options={{
          title: t.housekeeping.title,
          tabBarIcon: ({ color, size }) => <Sparkles size={size - 2} color={color} />,
          href: showHousekeeping ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{
          title: t.maintenance.title,
          tabBarIcon: ({ color, size }) => <Wrench size={size - 2} color={color} />,
          href: showMaintenance ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="breakfast"
        options={{
          title: t.breakfast.title,
          tabBarIcon: ({ color, size }) => <Coffee size={size - 2} color={color} />,
          href: showBreakfast ? undefined : null,
        }}
      />
    </Tabs>
  );
}
