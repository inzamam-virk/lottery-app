import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔗 Supabase: Initializing client...');
console.log('🔗 Supabase: URL =', supabaseUrl ? 'SET' : 'MISSING');
console.log('🔗 Supabase: Anon Key =', supabaseAnonKey ? 'SET' : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🔗 Supabase: Missing environment variables');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
