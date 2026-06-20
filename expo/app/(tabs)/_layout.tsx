import { Tabs } from 'expo-router';
import {
  ClipboardCheck,
  Wrench,
  Coffee,
  BarChart3,
  Bed,
} from 'lucide-react-native';
import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRoles } from '@/providers/RolesProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { MOBILE_MODULES, type MobileModuleId } from '@/constants/roles';

// Mapping clé d'icône (registre) -> composant lucide.
const MODULE_ICONS: Record<MobileModuleId, React.ComponentType<{ size: number; color: string }>> = {
  housekeeping: Bed,
  gouvernante: ClipboardCheck,
  maintenance: Wrench,
  breakfast: Coffee,
  direction: BarChart3,
};

export default function TabLayout() {
  const { currentUser } = useAuth();
  const { canAccess } = useRoles();
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
      {MOBILE_MODULES.map((module) => {
        const Icon = MODULE_ICONS[module.id];
        return (
          <Tabs.Screen
            key={module.id}
            name={module.routeName}
            options={{
              title: module.label,
              tabBarIcon: ({ color, size }) => <Icon size={size - 2} color={color} />,
              // Onglet visible uniquement si le rôle courant a accès au module.
              href: canAccess(role, module.id) ? (module.route as any) : null,
            }}
          />
        );
      })}
      {/* Réception : extraite de l'app mobile (gérée par le poste web Flowtym Check-in).
          Le code de l'écran est conservé mais masqué de la navigation. */}
      <Tabs.Screen name="reception" options={{ href: null }} />
    </Tabs>
  );
}
