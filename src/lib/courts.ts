/**
 * Court data access.
 *
 * In our demo cities (Tel Aviv & Rehovot) we show the curated, fully-detailed
 * showcase bundled in the app (@/data/curated-courts). Anywhere else in Israel
 * we query the shared `courts` table in Supabase (the full OpenStreetMap set)
 * with a bounding-box query around the user, sorted by distance and capped so
 * the map and list stay fast.
 */

import { curatedCourts } from '@/data/curated-courts';
import { isBackendConfigured } from '@/lib/config';
import { distanceKm, type LatLng } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import type { Court, SportType } from '@/types';

/** How far around the user to look, and how many courts to keep. */
const DEFAULT_RADIUS_KM = 25;
const DEFAULT_LIMIT = 50;
/** Safety cap on rows pulled from the DB before we distance-sort them locally. */
const MAX_ROWS = 500;
/** Within this distance of a curated court, the user is "in a demo city" and we
 *  show the detailed showcase instead of the national OSM data. Tel Aviv and
 *  Rehovot are ~21 km apart, so this cleanly picks one city's courts. */
const DEMO_RADIUS_KM = 15;

export type CourtFilter = 'all' | SportType;

interface CourtRow {
  id: string;
  name: string;
  sport: string;
  latitude: number;
  longitude: number;
  address: string | null;
  surface: string | null;
  lit: boolean | null;
  free: boolean | null;
}

function rowToCourt(row: CourtRow, center: LatLng): Court {
  return {
    id: row.id,
    name: row.name,
    sport: row.sport === 'tennis' ? 'tennis' : 'basketball',
    address: row.address ?? '',
    latitude: row.latitude,
    longitude: row.longitude,
    distanceKm: distanceKm(center, { latitude: row.latitude, longitude: row.longitude }),
    surface: row.surface ?? undefined,
    lit: row.lit ?? undefined,
    free: row.free ?? undefined,
  };
}

/** Sort a list by distance from `center` and keep the nearest `limit`. */
function nearest(courts: Array<Omit<Court, 'distanceKm'>>, center: LatLng, limit: number): Court[] {
  return courts
    .map((c) => ({ ...c, distanceKm: distanceKm(center, c) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export interface FetchCourtsOptions {
  center: LatLng;
  filter?: CourtFilter;
  radiusKm?: number;
  limit?: number;
}

/**
 * Fetch the nearest courts to `center`. Throws on a backend error so the UI can
 * offer a retry; returns [] when the area genuinely has no courts.
 */
export async function fetchNearbyCourts({
  center,
  filter = 'all',
  radiusKm = DEFAULT_RADIUS_KM,
  limit = DEFAULT_LIMIT,
}: FetchCourtsOptions): Promise<Court[]> {
  const curated = filter === 'all' ? curatedCourts : curatedCourts.filter((c) => c.sport === filter);

  // In Tel Aviv or Rehovot (near the curated courts) → the detailed showcase.
  const localCurated = curated.filter((c) => distanceKm(center, c) <= DEMO_RADIUS_KM);
  if (localCurated.length > 0) {
    return nearest(localCurated, center, limit);
  }

  // No Supabase configured → the curated set is the only data we have.
  if (!isBackendConfigured) {
    return nearest(curated, center, limit);
  }

  // Elsewhere in Israel → the full OpenStreetMap data in Supabase.
  // Convert the search radius into a lat/lon box. ~111 km per degree of
  // latitude; longitude degrees shrink with latitude (cos), so scale by it.
  const latDelta = radiusKm / 111;
  const cosLat = Math.cos((center.latitude * Math.PI) / 180) || 1;
  const lonDelta = radiusKm / (111 * cosLat);

  let query = supabase
    .from('courts')
    .select('id,name,sport,latitude,longitude,address,surface,lit,free')
    .gte('latitude', center.latitude - latDelta)
    .lte('latitude', center.latitude + latDelta)
    .gte('longitude', center.longitude - lonDelta)
    .lte('longitude', center.longitude + lonDelta)
    .limit(MAX_ROWS);

  if (filter !== 'all') query = query.eq('sport', filter);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const courts = (data as CourtRow[]).map((r) => rowToCourt(r, center));
  courts.sort((a, b) => a.distanceKm - b.distanceKm);
  return courts.slice(0, limit);
}
