/**
 * Supabase client for React Native. Sessions persist on-device via AsyncStorage
 * and auto-refresh while the app is foregrounded. The URL polyfill is required
 * because React Native's built-in URL is incomplete for supabase-js.
 */

import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { backend } from './config';

export const supabase = createClient(backend.supabaseUrl, backend.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No URL-based session detection on native (that's a web/OAuth concern).
    detectSessionInUrl: false,
  },
});

// Pause token auto-refresh in the background, resume on foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
