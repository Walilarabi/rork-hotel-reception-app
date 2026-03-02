import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import {
  Hotel,
  AdminUser,
  AdminLog,
  SupportSession,
  HotelStatus,
  SubscriptionPlan,
  AdminUserRole,
  LogAction,
} from '@/constants/types';
import { INITIAL_HOTELS, INITIAL_ADMIN_USERS, INITIAL_ADMIN_LOGS } from '@/mocks/superadmin';

const HOTELS_KEY = 'superadmin_hotels';
const USERS_KEY = 'superadmin_users';
const LOGS_KEY = 'superadmin_logs';
const SUPPORT_KEY = 'superadmin_support_session';

export const [SuperAdminProvider, useSuperAdmin] = createContextHook(() => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [supportSession, setSupportSession] = useState<SupportSession | null>(null);

  const hotelsQuery = useQuery({
    queryKey: ['admin_hotels'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(HOTELS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Hotel[];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.log('[SuperAdmin] Error reading hotels:', e);
        await AsyncStorage.removeItem(HOTELS_KEY);
      }
      await AsyncStorage.setItem(HOTELS_KEY, JSON.stringify(INITIAL_HOTELS));
      return INITIAL_HOTELS;
    },
  });

  const usersQuery = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(USERS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AdminUser[];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.log('[SuperAdmin] Error reading users:', e);
        await AsyncStorage.removeItem(USERS_KEY);
      }
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_ADMIN_USERS));
      return INITIAL_ADMIN_USERS;
    },
  });

  const logsQuery = useQuery({
    queryKey: ['admin_logs'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(LOGS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AdminLog[];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.log('[SuperAdmin] Error reading logs:', e);
        await AsyncStorage.removeItem(LOGS_KEY);
      }
      await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(INITIAL_ADMIN_LOGS));
      return INITIAL_ADMIN_LOGS;
    },
  });

  const supportQuery = useQuery({
    queryKey: ['admin_support'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(SUPPORT_KEY);
        if (stored) return JSON.parse(stored) as SupportSession;
      } catch (e) {
        console.log('[SuperAdmin] Error reading support session:', e);
        await AsyncStorage.removeItem(SUPPORT_KEY);
      }
      return null;
    },
  });

  useEffect(() => { if (hotelsQuery.data) setHotels(hotelsQuery.data); }, [hotelsQuery.data]);
  useEffect(() => { if (usersQuery.data) setUsers(usersQuery.data); }, [usersQuery.data]);
  useEffect(() => { if (logsQuery.data) setLogs(logsQuery.data); }, [logsQuery.data]);
  useEffect(() => { if (supportQuery.data !== undefined) setSupportSession(supportQuery.data); }, [supportQuery.data]);

  const persistHotels = useCallback(async (updated: Hotel[]) => {
    setHotels(updated);
    await AsyncStorage.setItem(HOTELS_KEY, JSON.stringify(updated));
  }, []);

  const persistUsers = useCallback(async (updated: AdminUser[]) => {
    setUsers(updated);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updated));
  }, []);

  const addLog = useCallback(async (action: LogAction, details: string, hotelName: string | null = null) => {
    const newLog: AdminLog = {
      id: `log-${Date.now()}`,
      userId: 'u-sa1',
      userName: 'Alexandre Fontaine',
      action,
      details,
      hotelName,
      ipAddress: '82.66.140.12',
      createdAt: new Date().toISOString(),
    };
    const updated = [newLog, ...logs];
    setLogs(updated);
    await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(updated));
  }, [logs]);

  const addHotelMutation = useMutation({
    mutationFn: async (params: Omit<Hotel, 'id' | 'createdAt' | 'updatedAt' | 'roomCount' | 'userCount'>) => {
      const newHotel: Hotel = {
        ...params,
        id: `h-${Date.now()}`,
        roomCount: 0,
        userCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await persistHotels([...hotels, newHotel]);
      await addLog('hotel_created', `Nouveau client: ${params.name} (plan: ${params.subscriptionPlan})`, params.name);
      return newHotel;
    },
  });

  const updateHotelMutation = useMutation({
    mutationFn: async (params: { hotelId: string; updates: Partial<Hotel> }) => {
      const updated = hotels.map((h) =>
        h.id === params.hotelId ? { ...h, ...params.updates, updatedAt: new Date().toISOString() } : h
      );
      await persistHotels(updated);
      const hotel = hotels.find((h) => h.id === params.hotelId);
      if (hotel) {
        await addLog('hotel_updated', `Hôtel mis à jour`, hotel.name);
      }
    },
  });

  const toggleHotelStatusMutation = useMutation({
    mutationFn: async (params: { hotelId: string; newStatus: HotelStatus }) => {
      const updated = hotels.map((h) =>
        h.id === params.hotelId ? { ...h, status: params.newStatus, updatedAt: new Date().toISOString() } : h
      );
      await persistHotels(updated);
      const hotel = hotels.find((h) => h.id === params.hotelId);
      if (hotel) {
        const action = params.newStatus === 'suspended' ? 'hotel_suspended' as const : 'hotel_reactivated' as const;
        await addLog(action, `Statut changé à ${params.newStatus}`, hotel.name);
      }
    },
  });

  const deleteHotelMutation = useMutation({
    mutationFn: async (hotelId: string) => {
      const hotel = hotels.find((h) => h.id === hotelId);
      const updated = hotels.filter((h) => h.id !== hotelId);
      await persistHotels(updated);
      const updatedUsers = users.filter((u) => u.hotelId !== hotelId);
      await persistUsers(updatedUsers);
      if (hotel) {
        await addLog('hotel_deleted', `Hôtel supprimé: ${hotel.name}`, hotel.name);
      }
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: async (params: { email: string; firstName: string; lastName: string; role: AdminUserRole; hotelId: string }) => {
      const hotel = hotels.find((h) => h.id === params.hotelId);
      const newUser: AdminUser = {
        id: `u-${Date.now()}`,
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email,
        role: params.role,
        hotelId: params.hotelId,
        hotelName: hotel?.name ?? null,
        active: true,
        invitedBy: 'u-sa1',
        invitationAcceptedAt: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      };
      await persistUsers([...users, newUser]);
      await addLog('user_invited', `${params.email} invité en tant que ${params.role}`, hotel?.name ?? null);
      return newUser;
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async (params: { userId: string; active: boolean }) => {
      const updated = users.map((u) =>
        u.id === params.userId ? { ...u, active: params.active } : u
      );
      await persistUsers(updated);
      const user = users.find((u) => u.id === params.userId);
      if (user) {
        const action = params.active ? 'user_reactivated' as const : 'user_suspended' as const;
        await addLog(action, `${user.email} ${params.active ? 'réactivé' : 'suspendu'}`, user.hotelName);
      }
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const user = users.find((u) => u.id === userId);
      const updated = users.filter((u) => u.id !== userId);
      await persistUsers(updated);
      if (user) {
        await addLog('user_deleted', `${user.email} supprimé`, user.hotelName);
      }
    },
  });

  const enterSupportModeMutation = useMutation({
    mutationFn: async (params: { hotelId: string; role: AdminUserRole }) => {
      const hotel = hotels.find((h) => h.id === params.hotelId);
      if (!hotel) throw new Error('Hotel not found');
      const session: SupportSession = {
        hotelId: params.hotelId,
        hotelName: hotel.name,
        role: params.role,
        enteredAt: new Date().toISOString(),
      };
      setSupportSession(session);
      await AsyncStorage.setItem(SUPPORT_KEY, JSON.stringify(session));
      await addLog('support_mode_entered', `Vue ${params.role} - ${hotel.name}`, hotel.name);
      return session;
    },
  });

  const exitSupportModeMutation = useMutation({
    mutationFn: async () => {
      if (supportSession) {
        const duration = Math.round((Date.now() - new Date(supportSession.enteredAt).getTime()) / 60000);
        await addLog('support_mode_exited', `Session de ${duration} minute(s)`, supportSession.hotelName);
      }
      setSupportSession(null);
      await AsyncStorage.removeItem(SUPPORT_KEY);
    },
  });

  const isLoading = hotelsQuery.isLoading || usersQuery.isLoading || logsQuery.isLoading;

  const stats = useMemo(() => {
    const activeHotels = hotels.filter((h) => h.status === 'active').length;
    const trialHotels = hotels.filter((h) => h.status === 'trial').length;
    const suspendedHotels = hotels.filter((h) => h.status === 'suspended').length;
    const totalUsers = users.length;
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const renewingSoon = hotels.filter((h) => {
      const end = new Date(h.subscriptionEnd);
      return end > now && end <= sevenDaysLater && h.status === 'active';
    }).length;
    return { activeHotels, trialHotels, suspendedHotels, totalUsers, renewingSoon, totalHotels: hotels.length };
  }, [hotels, users]);

  return {
    hotels,
    users,
    logs,
    supportSession,
    isLoading,
    stats,
    addHotel: addHotelMutation.mutate,
    updateHotel: updateHotelMutation.mutate,
    toggleHotelStatus: toggleHotelStatusMutation.mutate,
    deleteHotel: deleteHotelMutation.mutate,
    inviteUser: inviteUserMutation.mutate,
    toggleUserStatus: toggleUserStatusMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    enterSupportMode: enterSupportModeMutation.mutate,
    exitSupportMode: exitSupportModeMutation.mutate,
    isSupportActive: supportSession !== null,
  };
});

export function useFilteredHotels(filters: { status: HotelStatus | 'all'; plan: SubscriptionPlan | 'all'; search: string }) {
  const { hotels } = useSuperAdmin();
  return useMemo(() => {
    return hotels.filter((h) => {
      if (filters.status !== 'all' && h.status !== filters.status) return false;
      if (filters.plan !== 'all' && h.subscriptionPlan !== filters.plan) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        return h.name.toLowerCase().includes(s) || h.email.toLowerCase().includes(s);
      }
      return true;
    });
  }, [hotels, filters]);
}

export function useFilteredUsers(filters: { hotelId: string | 'all'; role: AdminUserRole | 'all'; search: string }) {
  const { users } = useSuperAdmin();
  return useMemo(() => {
    return users.filter((u) => {
      if (filters.hotelId !== 'all' && u.hotelId !== filters.hotelId) return false;
      if (filters.role !== 'all' && u.role !== filters.role) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        return u.firstName.toLowerCase().includes(s) || u.lastName.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
      }
      return true;
    });
  }, [users, filters]);
}

export function useFilteredLogs(filters: { action: LogAction | 'all'; search: string }) {
  const { logs } = useSuperAdmin();
  return useMemo(() => {
    return logs.filter((l) => {
      if (filters.action !== 'all' && l.action !== filters.action) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        return l.details.toLowerCase().includes(s) || (l.hotelName?.toLowerCase().includes(s) ?? false) || l.userName.toLowerCase().includes(s);
      }
      return true;
    });
  }, [logs, filters]);
}
