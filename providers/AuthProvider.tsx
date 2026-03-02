import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { AdminUserRole } from '@/constants/types';

const AUTH_KEY = 'auth_current_user';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AdminUserRole;
  hotelId: string | null;
  hotelName: string | null;
}

const DEMO_USERS: AuthUser[] = [
  { id: 'u-sa1', firstName: 'Alexandre', lastName: 'Fontaine', email: 'alex@flowtym.com', role: 'super_admin', hotelId: null, hotelName: null },
  { id: 'u1', firstName: 'Marie', lastName: 'Leclerc', email: 'marie.leclerc@grandhotelparis.fr', role: 'direction', hotelId: 'h1', hotelName: 'Le Grand Hôtel Paris' },
  { id: 'u2', firstName: 'Sophie', lastName: 'Martin', email: 'sophie.martin@grandhotelparis.fr', role: 'reception', hotelId: 'h1', hotelName: 'Le Grand Hôtel Paris' },
  { id: 'u3', firstName: 'Catherine', lastName: 'Moreau', email: 'c.moreau@grandhotelparis.fr', role: 'gouvernante', hotelId: 'h1', hotelName: 'Le Grand Hôtel Paris' },
  { id: 'u-fdc1', firstName: 'Julie', lastName: 'Thomas', email: 'julie@grandhotelparis.fr', role: 'femme_de_chambre', hotelId: 'h1', hotelName: 'Le Grand Hôtel Paris' },
  { id: 'u5', firstName: 'Pierre', lastName: 'Durand', email: 'pierre.durand@beaurivage.ch', role: 'maintenance', hotelId: 'h2', hotelName: 'Hôtel Beau Rivage' },
  { id: 'u-pdj1', firstName: 'Claire', lastName: 'Petit', email: 'claire@grandhotelparis.fr', role: 'breakfast', hotelId: 'h1', hotelName: 'Le Grand Hôtel Paris' },
];

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const authQuery = useQuery({
    queryKey: ['auth_user'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser;
          if (parsed && parsed.id) return parsed;
        }
      } catch (e) {
        console.log('[AuthProvider] Error reading auth:', e);
        await AsyncStorage.removeItem(AUTH_KEY);
      }
      return null;
    },
  });

  useEffect(() => {
    if (!authQuery.isLoading) {
      setCurrentUser(authQuery.data ?? null);
      setIsReady(true);
    }
  }, [authQuery.data, authQuery.isLoading]);

  const loginMutation = useMutation({
    mutationFn: async (user: AuthUser) => {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
      setCurrentUser(user);
      return user;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(AUTH_KEY);
      setCurrentUser(null);
    },
  });

  const canInviteRoles = useCallback((role: AdminUserRole): AdminUserRole[] => {
    if (role === 'super_admin') {
      return ['direction', 'reception', 'gouvernante', 'femme_de_chambre', 'maintenance', 'breakfast'];
    }
    if (role === 'direction' || role === 'reception') {
      return ['gouvernante', 'femme_de_chambre', 'maintenance', 'breakfast'];
    }
    return [];
  }, []);

  return {
    currentUser,
    isAuthenticated: currentUser !== null,
    isReady,
    demoUsers: DEMO_USERS,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    canInviteRoles,
  };
});
