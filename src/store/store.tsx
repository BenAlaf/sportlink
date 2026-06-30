/**
 * App data store, backed by Supabase (M5). Login is required, so there is always
 * a user: on sign-in we load the profile + saved routes/courts from Supabase, and
 * every change writes back (optimistic local update + fire-and-forget persist).
 * On sign-out it resets to defaults.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { defaultProfile } from '@/data/mock';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import type { GeneratedRoute, UserProfile } from '@/types';

interface AppStore {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  savedRoutes: GeneratedRoute[];
  toggleSavedRoute: (route: GeneratedRoute) => void;
  isRouteSaved: (id: string) => boolean;
  savedCourtIds: string[];
  toggleSavedCourt: (id: string) => void;
  isCourtSaved: (id: string) => boolean;
}

const AppContext = createContext<AppStore | null>(null);

// ── DB row mapping ────────────────────────────────────────────────────────────
interface ProfileRow {
  id: string;
  name: string;
  fitness_level: string;
  preferred_sports: string[];
  goal: string;
  weekly_target: number;
}

function rowToProfile(row: ProfileRow): UserProfile {
  return {
    name: row.name,
    fitnessLevel: row.fitness_level as UserProfile['fitnessLevel'],
    preferredSports: row.preferred_sports as UserProfile['preferredSports'],
    goal: row.goal,
    weeklyTarget: row.weekly_target,
  };
}

function profileToRow(id: string, p: UserProfile) {
  return {
    id,
    name: p.name,
    fitness_level: p.fitnessLevel,
    preferred_sports: p.preferredSports,
    goal: p.goal,
    weekly_target: p.weeklyTarget,
    updated_at: new Date().toISOString(),
  };
}

/** Log Supabase write failures without breaking the optimistic UI. */
function reportError(label: string, error: { message: string } | null) {
  if (error && __DEV__) console.warn(`[store] ${label} failed: ${error.message}`);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfileState] = useState<UserProfile>(defaultProfile);
  const [savedRoutes, setSavedRoutes] = useState<GeneratedRoute[]>([]);
  const [savedCourtIds, setSavedCourtIds] = useState<string[]>([]);

  // Load everything for the signed-in user; reset when signed out.
  useEffect(() => {
    if (!user) {
      setProfileState(defaultProfile);
      setSavedRoutes([]);
      setSavedCourtIds([]);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;

      if (prof) {
        setProfileState(rowToProfile(prof as ProfileRow));
      } else {
        // First sign-in: seed a default profile row.
        const row = profileToRow(user.id, defaultProfile);
        const { error } = await supabase.from('profiles').upsert(row);
        reportError('seed profile', error);
        if (!cancelled) setProfileState(defaultProfile);
      }

      const { data: routes } = await supabase
        .from('saved_routes')
        .select('route')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!cancelled && routes) {
        setSavedRoutes(routes.map((r) => r.route as GeneratedRoute));
      }

      const { data: courts } = await supabase
        .from('saved_courts')
        .select('court_id')
        .eq('user_id', user.id);
      if (!cancelled && courts) {
        setSavedCourtIds(courts.map((c) => c.court_id as string));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const setProfile = useCallback(
    (p: UserProfile) => {
      setProfileState(p);
      if (user) {
        supabase
          .from('profiles')
          .upsert(profileToRow(user.id, p))
          .then(({ error }) => reportError('save profile', error));
      }
    },
    [user],
  );

  const toggleSavedRoute = useCallback(
    (route: GeneratedRoute) => {
      const exists = savedRoutes.some((r) => r.id === route.id);
      setSavedRoutes(exists ? savedRoutes.filter((r) => r.id !== route.id) : [route, ...savedRoutes]);
      if (!user) return;
      if (exists) {
        supabase
          .from('saved_routes')
          .delete()
          .eq('user_id', user.id)
          .eq('id', route.id)
          .then(({ error }) => reportError('delete route', error));
      } else {
        supabase
          .from('saved_routes')
          .insert({ user_id: user.id, id: route.id, route })
          .then(({ error }) => reportError('save route', error));
      }
    },
    [savedRoutes, user],
  );

  const isRouteSaved = useCallback((id: string) => savedRoutes.some((r) => r.id === id), [savedRoutes]);

  const toggleSavedCourt = useCallback(
    (id: string) => {
      const exists = savedCourtIds.includes(id);
      setSavedCourtIds(exists ? savedCourtIds.filter((x) => x !== id) : [...savedCourtIds, id]);
      if (!user) return;
      if (exists) {
        supabase
          .from('saved_courts')
          .delete()
          .eq('user_id', user.id)
          .eq('court_id', id)
          .then(({ error }) => reportError('delete court', error));
      } else {
        supabase
          .from('saved_courts')
          .insert({ user_id: user.id, court_id: id })
          .then(({ error }) => reportError('save court', error));
      }
    },
    [savedCourtIds, user],
  );

  const isCourtSaved = useCallback((id: string) => savedCourtIds.includes(id), [savedCourtIds]);

  const value = useMemo<AppStore>(
    () => ({
      profile,
      setProfile,
      savedRoutes,
      toggleSavedRoute,
      isRouteSaved,
      savedCourtIds,
      toggleSavedCourt,
      isCourtSaved,
    }),
    [profile, setProfile, savedRoutes, toggleSavedRoute, isRouteSaved, savedCourtIds, toggleSavedCourt, isCourtSaved],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within an AppProvider');
  return ctx;
}
