import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import {
  DoorOpen,
  BedDouble,
  Wrench,
  Coffee,
  ClipboardCheck,
  BarChart3,
} from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import Colors from '@/constants/colors';

export default function TabLayout() {
  const { currentUser } = useAuth();
  const { theme, isDarkMode } = useTheme();

  const role = currentUser?.role;
  const tint = theme?.primary ?? Colors.light.tint;
  const tabBg = isDarkMode ? '#1A1A2E' : '#FFFFFF';
  const inactiveTint = isDarkMode ? '#8E8EA0' : '#999';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarStyle: {
          backgroundColor: tabBg,
          borderTopColor: isDarkMode ? '#2A2A3E' : '#E8E8EE',
          ...Platform.select({
            web: { maxWidth: 600, alignSelf: 'center' as const, width: '100%' },
            default: {},
          }),
        },
      }}
    >
      <Tabs.Screen
        name="reception"
        options={{
          title: 'Réception',
          tabBarIcon: ({ color, size }) => <DoorOpen size={size} color={color} />,
        }}
        redirect={role === 'femme_de_chambre' || role === 'maintenance' || role === 'breakfast'}
      />
      <Tabs.Screen
        name="housekeeping"
        options={{
          title: 'Ménage',
          tabBarIcon: ({ color, size }) => <BedDouble size={size} color={color} />,
        }}
        redirect={role === 'maintenance' || role === 'breakfast'}
      />
      <Tabs.Screen
        name="maintenance"
        options={{
          title: 'Maintenance',
          tabBarIcon: ({ color, size }) => <Wrench size={size} color={color} />,
        }}
        redirect={role === 'femme_de_chambre' || role === 'breakfast'}
      />
      <Tabs.Screen
        name="breakfast"
        options={{
          title: 'Petit-déj',
          tabBarIcon: ({ color, size }) => <Coffee size={size} color={color} />,
        }}
        redirect={role === 'femme_de_chambre' || role === 'maintenance'}
      />
      <Tabs.Screen
        name="gouvernante"
        options={{
          title: 'Gouvernante',
          tabBarIcon: ({ color, size }) => <ClipboardCheck size={size} color={color} />,
        }}
        redirect={role !== 'gouvernante' && role !== 'direction' && role !== 'reception'}
      />
      <Tabs.Screen
        name="direction"
        options={{
          title: 'Direction',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
        redirect={role !== 'direction'}
      />
    </Tabs>
  );
}
