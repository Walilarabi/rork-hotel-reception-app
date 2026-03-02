import { Tabs } from 'expo-router';
import { LayoutDashboard, Building2, Users, Headphones, ScrollText } from 'lucide-react-native';
import React from 'react';
import { SA_THEME as SA } from '@/constants/flowtym';

export default function SuperAdminTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: SA.accent,
        tabBarInactiveTintColor: SA.textMuted,
        tabBarStyle: {
          backgroundColor: SA.bg,
          borderTopColor: SA.border,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="hotels"
        options={{
          title: 'Hôtels',
          tabBarIcon: ({ color, size }) => <Building2 size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Utilisateurs',
          tabBarIcon: ({ color, size }) => <Users size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'Support',
          tabBarIcon: ({ color, size }) => <Headphones size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color, size }) => <ScrollText size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}
