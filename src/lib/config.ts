/**
 * Runtime configuration for optional backends. Everything here is read from
 * `EXPO_PUBLIC_*` env vars, which Expo inlines at build time. When they are
 * absent the app runs fully on its on-device fallbacks (rule-based coach,
 * mock data) — adding the values later upgrades a pillar with no code change.
 *
 * Note: only the Supabase URL + anon key live in the app. Secret provider keys
 * (OpenAI, GraphHopper) stay server-side in Supabase Edge Function secrets and
 * never reach the bundle.
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

/** True once a Supabase project is wired up — gates the live Edge Function calls. */
export const isBackendConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const backend = {
  supabaseUrl,
  supabaseAnonKey,
  /** Base URL for invoking Edge Functions, e.g. `${functionsUrl}/coach`. */
  get functionsUrl() {
    return supabaseUrl ? `${supabaseUrl}/functions/v1` : '';
  },
} as const;
