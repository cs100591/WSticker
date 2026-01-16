/**
 * Supabase client configuration for React Native
 * Uses AsyncStorage for session persistence
 * Enforces HTTPS for all connections
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV, validateEnv } from '@/config/env';

// Create a mock client for preview mode when env vars are not set
const createMockClient = () => {
  console.log('Running in preview mode - Supabase not configured');
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Preview mode - login disabled' } }),
      signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Preview mode - signup disabled' } }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: { message: 'Preview mode' } }),
      update: () => ({ data: null, error: { message: 'Preview mode' } }),
      delete: () => ({ data: null, error: { message: 'Preview mode' } }),
    }),
  } as unknown as SupabaseClient;
};

// Create Supabase client or mock for preview mode
let supabase: SupabaseClient;

if (validateEnv() && ENV.SUPABASE_URL.startsWith('https://')) {
  supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'dailypa-mobile',
      },
    },
  });
} else {
  supabase = createMockClient();
}

export { supabase };
