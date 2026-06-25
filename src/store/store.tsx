/**
 * Lightweight in-memory app store (M1). Holds the user profile and saved items
 * so they persist across tabs within a session. M5 will back this with
 * AsyncStorage + Supabase, but the API here stays the same.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { defaultProfile } from '@/data/mock';
import type { UserProfile } from '@/types';

interface AppStore {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  savedRouteIds: string[];
  toggleSavedRoute: (id: string) => void;
  isRouteSaved: (id: string) => boolean;
}

const AppContext = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [savedRouteIds, setSavedRouteIds] = useState<string[]>([]);

  const toggleSavedRoute = useCallback((id: string) => {
    setSavedRouteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const isRouteSaved = useCallback(
    (id: string) => savedRouteIds.includes(id),
    [savedRouteIds],
  );

  const value = useMemo<AppStore>(
    () => ({ profile, setProfile, savedRouteIds, toggleSavedRoute, isRouteSaved }),
    [profile, savedRouteIds, toggleSavedRoute, isRouteSaved],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within an AppProvider');
  return ctx;
}
