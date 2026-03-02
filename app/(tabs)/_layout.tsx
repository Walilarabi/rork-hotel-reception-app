import { Tabs } from 'expo-router';
import { BedDouble, ClipboardCheck, Sparkles, Wrench, Coffee, BarChart3 } from 'lucide-react-native';
import React from 'react';
import { FT } from '@/constants/flowtym';
import { useAuth } from '@/providers/AuthProvider';

export default function TabLayout() {
  const { currentUser } = useAuth();
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
        tabBarActiveTintColor: FT.brand,
        tabBarInactiveTintColor: FT.textMuted,
        tabBarStyle: {
          backgroundColor: FT.surface,
          borderTopColor: FT.border,
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
          title: 'Direction',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size - 2} color={color} />,
          href: showDirection ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="reception"
        options={{
          title: 'Réception',
          tabBarIcon: ({ color, size }) => <BedDouble size={size - 2} color={color} />,
          href: showReception ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="gouvernante"
        options={{
          title: 'Gouvernante',
          tabBarIcon: ({ color, size }) => <ClipboardCheck size={size - 2} color={color} />,
          href: showGouvernante ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="housekeeping"
        options={{
          title: 'Chambres',
          tabBarIcon: ({ color, size }) => <Sparkles size={size - 2} color={color} />,
          href: showHousekeeping ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{
          title: 'Maintenance',
          tabBarIcon: ({ color, size }) => <Wrench size={size - 2} color={color} />,
          href: showMaintenance ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="breakfast"
        options={{
          title: 'PDJ',
          tabBarIcon: ({ color, size }) => <Coffee size={size - 2} color={color} />,
          href: showBreakfast ? undefined : null,
        }}
      />
    </Tabs>
  );
}
