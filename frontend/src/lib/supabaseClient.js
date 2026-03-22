/**
 * Supabase Client — singleton used across the React app for auth & database.
 *
 * Reads config from Vite environment variables:
 *   VITE_SUPABASE_URL      → Supabase project URL
 *   VITE_SUPABASE_ANON_KEY → Supabase anon / public key
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — auth features will not work.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
