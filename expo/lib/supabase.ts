import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.placeholder';

// Valide que l'URL est une vraie URL http(s) : une valeur mal formée
// (sans https://, intervertie avec la clé, etc.) ferait planter createClient
// au démarrage et provoquerait un écran blanc. On retombe alors en mode démo.
function isValidHttpUrl(value: string): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

const hasValidConfig = isValidHttpUrl(supabaseUrl) && Boolean(supabaseAnonKey);

if (!hasValidConfig) {
  if (supabaseUrl && !isValidHttpUrl(supabaseUrl)) {
    console.warn('[Supabase] EXPO_PUBLIC_SUPABASE_URL invalide (doit commencer par https://) — mode démo');
  } else {
    console.warn('[Supabase] EXPO_PUBLIC_SUPABASE_URL/ANON_KEY manquant — mode démo');
  }
}

function makeClient(): SupabaseClient {
  try {
    return createClient(
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
  } catch (e) {
    // Garde-fou ultime : ne jamais laisser une erreur de config casser le boot.
    console.warn('[Supabase] Échec d’initialisation, repli mode démo:', e);
    return createClient(FALLBACK_URL, FALLBACK_KEY, {
      auth: { storage: AsyncStorage, autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }
}

export const supabase: SupabaseClient = makeClient();

export const isSupabaseConfigured = hasValidConfig;

console.log('[Supabase] Client initialized:', hasValidConfig ? supabaseUrl.substring(0, 30) + '...' : 'DEMO MODE (no/invalid config)');
