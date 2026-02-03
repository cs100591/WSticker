/**
 * Environment configuration
 * Loads environment variables from Expo Constants
 */

import Constants from 'expo-constants';

// Get environment variables from Expo Constants
const expoConfig = Constants.expoConfig?.extra || {};

export const ENV = {
  SUPABASE_URL: expoConfig.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY: expoConfig.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
  API_URL: expoConfig.apiUrl || process.env.EXPO_PUBLIC_API_URL || '',
  ENV: expoConfig.env || process.env.EXPO_PUBLIC_ENV || 'development',
  // OpenAI key - now optional since we use Supabase Edge Functions
  // Only used for client-side Whisper transcription fallback
  OPENAI_API_KEY: expoConfig.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
  // Google Cloud API Key for additional services
  GOOGLE_CLOUD_API_KEY: expoConfig.googleCloudApiKey || process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY || '',
} as const;

export function validateEnv(): boolean {
  return !!(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY &&
    ENV.SUPABASE_URL !== 'https://placeholder.supabase.co');
}
