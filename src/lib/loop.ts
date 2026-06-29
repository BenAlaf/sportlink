/**
 * Synthetic loop generator (M3 fallback). Produces an organic-looking closed
 * loop centered on the user's location, scaled to a target distance. It does NOT
 * follow streets — that's what the GraphHopper Edge Function adds later — but it
 * works anywhere with zero keys so the Routes pillar always demos.
 */

import type { Activity, GeoPoint } from '@/types';

/** Deterministic PRNG (mulberry32) so a given seed always yields the same loop. */
function rng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const KM_PER_DEG_LAT = 110.574;

/** Build a closed loop of ~`distanceKm` around `center`. `seed` varies the shape. */
export function generateLoop(center: GeoPoint, distanceKm: number, seed: number): GeoPoint[] {
  const rand = rng(seed + 1);
  const N = 36;

  // Base radius if the loop were a perfect circle of the target circumference.
  const baseRadius = distanceKm / (2 * Math.PI);

  // Seeded shape: a rotation plus two low-frequency wobbles for an organic outline.
  const rotation = rand() * Math.PI * 2;
  const a1 = 0.18 + rand() * 0.12;
  const p1 = rand() * Math.PI * 2;
  const a2 = 0.1 + rand() * 0.1;
  const p2 = rand() * Math.PI * 2;

  const latRad = (center.latitude * Math.PI) / 180;
  const kmPerDegLng = 111.32 * Math.cos(latRad);

  // Offsets from center in km.
  const offsets: { dx: number; dy: number }[] = [];
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const radius = baseRadius * (1 + a1 * Math.sin(t + p1) + a2 * Math.sin(2 * t + p2));
    const ang = t + rotation;
    offsets.push({ dx: radius * Math.cos(ang), dy: radius * Math.sin(ang) });
  }

  // Scale offsets so the actual perimeter matches the requested distance.
  let perimeter = 0;
  for (let i = 0; i < N; i++) {
    const a = offsets[i];
    const b = offsets[(i + 1) % N];
    perimeter += Math.hypot(a.dx - b.dx, a.dy - b.dy);
  }
  const scale = perimeter > 0 ? distanceKm / perimeter : 1;

  const points: GeoPoint[] = offsets.map(({ dx, dy }) => ({
    latitude: center.latitude + (dy * scale) / KM_PER_DEG_LAT,
    longitude: center.longitude + (dx * scale) / kmPerDegLng,
  }));
  points.push(points[0]); // close the loop
  return points;
}

/** Minutes per km for the chosen activity. */
export function paceMinPerKm(activity: Activity): number {
  return activity === 'walk' ? 11 : 6;
}

/** Estimated duration in minutes for a distance + activity. */
export function estimateMinutes(distanceKm: number, activity: Activity): number {
  return Math.round(distanceKm * paceMinPerKm(activity));
}
