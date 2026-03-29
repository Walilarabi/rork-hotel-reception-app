import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.placeholder';

const hasValidConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasValidConfig) {
  console.warn('[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY — running in demo mode');
}

export const supabase: SupabaseClient = createClient(
  hasValidConfig ? supabaseUrl : FALLBACK_URL,
  hasValidConfig ? supabaseAnonKey : FALLBACK_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: hasValidConfig,
      persistSession: hasValidConfig,
      detectSessionInUrl: false,
    },
  },
);

export const isSupabaseConfigured = hasValidConfig;

console.log('[Supabase] Client initialized:', hasValidConfig ? supabaseUrl.substring(0, 30) + '...' : 'DEMO MODE (no config)');
