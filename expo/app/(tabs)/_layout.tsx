import { Tabs } from 'expo-router';
import {
  Hotel,
  ClipboardCheck,
  Wrench,
  Coffee,
  BarChart3,
  Bed,
} from 'lucide-react-native';
import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';

export default function TabLayout() {
  const { currentUser } = useAuth();
  const { theme: mobileTheme, modeColors } = useTheme();
  const role = currentUser?.role;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: mobileTheme.primary,
        tabBarInactiveTintColor: modeColors.textMuted,
        tabBarStyle: {
          backgroundColor: modeColors.surface,
          borderTopColor: modeColors.border,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="reception"
        options={{
          title: 'Réception',
          tabBarIcon: ({ color, size }) => <Hotel size={size - 2} color={color} />,
          href: (role === 'reception' || role === 'direction') ? '/(tabs)/reception' : null,
        }}
      />
      <Tabs.Screen
        name="housekeeping"
        options={{
          title: 'Ménage',
          tabBarIcon: ({ color, size }) => <Bed size={size - 2} color={color} />,
          href: (role === 'femme_de_chambre' || role === 'gouvernante' || role === 'direction') ? '/(tabs)/housekeeping' : null,
        }}
      />
      <Tabs.Screen
        name="gouvernante"
        options={{
          title: 'Contrôle',
          tabBarIcon: ({ color, size }) => <ClipboardCheck size={size - 2} color={color} />,
          href: (role === 'gouvernante' || role === 'direction') ? '/(tabs)/gouvernante' : null,
        }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{
          title: 'Maintenance',
          tabBarIcon: ({ color, size }) => <Wrench size={size - 2} color={color} />,
          href: (role === 'maintenance' || role === 'direction') ? '/(tabs)/maintenance' : null,
        }}
      />
      <Tabs.Screen
        name="breakfast"
        options={{
          title: 'Petit-déj',
          tabBarIcon: ({ color, size }) => <Coffee size={size - 2} color={color} />,
          href: (role === 'breakfast' || role === 'direction') ? '/(tabs)/breakfast' : null,
        }}
      />
      <Tabs.Screen
        name="direction"
        options={{
          title: 'Direction',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size - 2} color={color} />,
          href: role === 'direction' ? '/(tabs)/direction' : null,
        }}
      />
    </Tabs>
  );
}
