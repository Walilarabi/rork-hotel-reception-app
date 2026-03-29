import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { AdminUserRole } from '@/constants/types';
import type { Session } from '@supabase/supabase-js';

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
  { id: 'u-sup1', firstName: 'Thomas', lastName: 'Renard', email: 'thomas@flowtym.com', role: 'support', hotelId: null, hotelName: null },
  { id: 'u1', firstName: 'Marie', lastName: 'Leclerc', email: 'marie.leclerc@grandhotelparis.fr', role: 'direction', hotelId: 'h1', hotelName: 'Le Grand Hôtel Paris' },
  { id: 'u2', firstName: 'Sophie', lastName: 'Martin', email: 'sophie.martin@grandhotelparis.fr', role: 'reception', hotelId: 'h1', hotelName: 'Le Grand Hôtel Paris' },
  { id: 'u3', firstName: 'Catherine', lastName: 'Moreau', email: 'c.moreau@grandhotelparis.fr', role: 'gouvernante', hotelId: 'h1', hotelName: 'Le Grand Hôtel Paris' },
  { id: 'u-fdc1', firstName: 'Julie', lastName: 'Thomas', email: 'julie@grandhotelparis.fr', role: 'femme_de_chambre', hotelId: 'h1', hotelName: 'Le Grand Hôtel Paris' },
  { id: 'u5', firstName: 'Pierre', lastName: 'Durand', email: 'pierre.durand@beaurivage.ch', role: 'maintenance', hotelId: 'h2', hotelName: 'Hôtel Beau Rivage' },
  { id: 'u-pdj1', firstName: 'Claire', lastName: 'Petit', email: 'claire@grandhotelparis.fr', role: 'breakfast', hotelId: 'h1', hotelName: 'Le Grand Hôtel Paris' },
];

async function fetchUserProfile(authId: string): Promise<AuthUser | null> {
  console.log('[AuthProvider] Fetching user profile for auth_id:', authId);
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      first_name,
      last_name,
      email,
      role,
      hotel_id,
      hotels ( name )
    `)
    .eq('auth_id', authId)
    .single();

  if (error || !data) {
    console.log('[AuthProvider] No user profile found in Supabase:', error?.message);
    return null;
  }

  const hotelName = (data as Record<string, unknown>).hotels
    ? ((data as Record<string, unknown>).hotels as { name: string })?.name ?? null
    : null;

  return {
    id: data.id,
    firstName: data.first_name ?? '',
    lastName: data.last_name ?? '',
    email: data.email,
    role: data.role as AdminUserRole,
    hotelId: data.hotel_id ?? null,
    hotelName,
  };
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const isReadyRef = useRef(false);

  useEffect(() => {
    console.log('[AuthProvider] Initializing Supabase auth listener...');

    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      console.log('[AuthProvider] Initial session:', s ? 'found' : 'none');
      setSession(s);
      if (s?.user) {
        void fetchUserProfile(s.user.id).then((profile) => {
          setCurrentUser(profile);
          setIsReady(true);
          isReadyRef.current = true;
          console.log('[AuthProvider] Profile loaded:', profile?.email, profile?.role);
        });
      } else {
        setIsReady(true);
        isReadyRef.current = true;
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      console.log('[AuthProvider] Auth state changed:', _event, s ? 'session' : 'no session');
      setSession(s);
      if (s?.user) {
        void fetchUserProfile(s.user.id).then((profile) => {
          setCurrentUser(profile);
          if (!isReadyRef.current) {
            setIsReady(true);
            isReadyRef.current = true;
          }
        });
      } else {
        setCurrentUser(null);
        if (!isReadyRef.current) {
          setIsReady(true);
          isReadyRef.current = true;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInMutation = useMutation({
    mutationFn: async (params: { email: string; password: string }) => {
      console.log('[AuthProvider] Signing in with email:', params.email);
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: params.email,
        password: params.password,
      });
      if (error) {
        console.log('[AuthProvider] Sign in error:', error.message);
        setAuthError(error.message);
        throw error;
      }
      console.log('[AuthProvider] Sign in success, fetching profile...');
      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        if (profile) {
          setCurrentUser(profile);
          return profile;
        }
        throw new Error('Profil utilisateur non trouvé dans la base de données');
      }
      throw new Error('Erreur de connexion');
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (params: { email: string; password: string; firstName: string; lastName: string; role: AdminUserRole; hotelId?: string }) => {
      console.log('[AuthProvider] Signing up:', params.email);
      setAuthError(null);
      const { data, error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
      });
      if (error) {
        console.log('[AuthProvider] Sign up error:', error.message);
        setAuthError(error.message);
        throw error;
      }
      if (data.user) {
        const { error: profileError } = await supabase.from('users').insert({
          auth_id: data.user.id,
          email: params.email,
          first_name: params.firstName,
          last_name: params.lastName,
          role: params.role,
          hotel_id: params.hotelId ?? null,
          status: 'active',
        });
        if (profileError) {
          console.log('[AuthProvider] Profile creation error:', profileError.message);
          setAuthError(profileError.message);
          throw profileError;
        }
        console.log('[AuthProvider] Sign up + profile creation success');
        return data.user;
      }
      throw new Error('Erreur lors de la création du compte');
    },
  });

  const demoLoginMutation = useMutation({
    mutationFn: async (user: AuthUser) => {
      console.log('[AuthProvider] Demo login as:', user.email, user.role);
      setCurrentUser(user);
      return user;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('[AuthProvider] Logging out...');
      if (session) {
        const { error } = await supabase.auth.signOut();
        if (error) console.log('[AuthProvider] Sign out error:', error.message);
      }
      setCurrentUser(null);
      setSession(null);
      setAuthError(null);
    },
  });

  const canInviteRoles = useCallback((role: AdminUserRole): AdminUserRole[] => {
    if (role === 'super_admin') {
      return ['support', 'direction', 'reception', 'gouvernante', 'femme_de_chambre', 'maintenance', 'breakfast'];
    }
    if (role === 'direction' || role === 'reception') {
      return ['gouvernante', 'femme_de_chambre', 'maintenance', 'breakfast'];
    }
    return [];
  }, []);

  const updateUserName = useCallback(async (firstName: string, lastName: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, firstName, lastName };
    setCurrentUser(updated);
    if (session) {
      await supabase
        .from('users')
        .update({ first_name: firstName, last_name: lastName })
        .eq('auth_id', session.user.id);
    }
  }, [currentUser, session]);

  return useMemo(() => ({
    currentUser,
    session,
    isAuthenticated: currentUser !== null,
    isReady,
    authError,
    demoUsers: DEMO_USERS,
    signIn: signInMutation.mutate,
    signUp: signUpMutation.mutate,
    login: demoLoginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: signInMutation.isPending || demoLoginMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    canInviteRoles,
    updateUserName,
  }), [
    currentUser, session, isReady, authError,
    signInMutation.mutate, signInMutation.isPending,
    signUpMutation.mutate, signUpMutation.isPending,
    demoLoginMutation.mutate, demoLoginMutation.isPending,
    logoutMutation.mutate, canInviteRoles, updateUserName,
  ]);
});
