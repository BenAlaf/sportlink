/**
 * Foreground location hook. Requests permission once and returns the user's
 * coordinates. Falls back to the Tel Aviv demo center if permission is denied
 * or location is unavailable, so screens always have a sensible region.
 */

import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { DEMO_CITY } from '@/data/mock';
import type { LatLng } from '@/lib/geo';

const FALLBACK: LatLng = { latitude: DEMO_CITY.latitude, longitude: DEMO_CITY.longitude };

export type LocationStatus = 'loading' | 'granted' | 'denied';

export function useLocation() {
  const [coords, setCoords] = useState<LatLng>(FALLBACK);
  const [status, setStatus] = useState<LocationStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        if (perm !== 'granted') {
          setStatus('denied');
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;

        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setStatus('granted');
      } catch {
        if (!cancelled) setStatus('denied');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /** True when we're showing the fallback region rather than the real device location. */
  const usingFallback = status !== 'granted';

  return { coords, status, usingFallback };
}
