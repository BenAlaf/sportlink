/**
 * Route generation client (M3). Mirrors `coach.ts`: when a Supabase backend is
 * configured it asks the GraphHopper-backed `routes` Edge Function for a real
 * road-following loop; otherwise (and on any error) it falls back to the
 * on-device synthetic loop. The GraphHopper key stays server-side.
 */

import type { Activity, GeneratedRoute, GeoPoint } from '@/types';

import { backend, isBackendConfigured } from './config';
import { estimateMinutes, generateLoop } from './loop';

function routeName(distanceKm: number, activity: Activity): string {
  const verb = activity === 'walk' ? 'Walk' : 'Run';
  return `${distanceKm.toFixed(1).replace(/\.0$/, '')} km ${verb} Loop`;
}

interface RoutesFnResponse {
  coordinates?: GeoPoint[];
  distanceKm?: number;
  timeMin?: number;
  ascentM?: number;
}

export async function generateRoute(params: {
  center: GeoPoint;
  distanceKm: number;
  activity: Activity;
  seed: number;
}): Promise<GeneratedRoute> {
  const { center, distanceKm, activity, seed } = params;

  if (isBackendConfigured) {
    try {
      const res = await fetch(`${backend.functionsUrl}/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${backend.supabaseAnonKey}`,
        },
        body: JSON.stringify({ center, distanceKm, activity, seed }),
      });
      if (!res.ok) throw new Error(`routes function ${res.status}`);
      const data = (await res.json()) as RoutesFnResponse;
      if (!data.coordinates || data.coordinates.length < 2) {
        throw new Error('routes function returned no coordinates');
      }
      const actualKm = data.distanceKm ?? distanceKm;
      return {
        id: `gh-${seed}`,
        name: routeName(actualKm, activity),
        distanceKm: Math.round(actualKm * 10) / 10,
        estimatedMinutes: Math.round(data.timeMin ?? estimateMinutes(actualKm, activity)),
        ascentM: Math.round(data.ascentM ?? 0),
        activity,
        coordinates: data.coordinates,
        source: 'graphhopper',
      };
    } catch (err) {
      if (__DEV__) console.warn('[routes] falling back to synthetic loop:', err);
    }
  }

  // Fallback: synthetic loop around the user.
  const coordinates = generateLoop(center, distanceKm, seed);
  return {
    id: `local-${seed}`,
    name: routeName(distanceKm, activity),
    distanceKm,
    estimatedMinutes: estimateMinutes(distanceKm, activity),
    ascentM: Math.round(distanceKm * (4 + (seed % 4))),
    activity,
    coordinates,
    source: 'local',
  };
}
