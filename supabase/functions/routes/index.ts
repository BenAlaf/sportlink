/**
 * SportLink Route Generator — Supabase Edge Function (M3).
 *
 * Keeps the GraphHopper key server-side. The app POSTs a start point + target
 * distance; we ask GraphHopper's round_trip routing for a real road-following
 * loop and return its coordinates. If GRAPHHOPPER_API_KEY is missing we return
 * 503 and the app silently falls back to its on-device synthetic loop.
 *
 * Deploy:
 *   supabase functions deploy routes
 *   supabase secrets set GRAPHHOPPER_API_KEY=...
 *
 * This file targets Deno (the Edge runtime) and is excluded from the app build.
 */

// @ts-nocheck — Deno runtime; not part of the Expo app's type-check.

const GRAPHHOPPER_API_KEY = Deno.env.get('GRAPHHOPPER_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (!GRAPHHOPPER_API_KEY) return json({ error: 'GRAPHHOPPER_API_KEY not configured' }, 503);

  try {
    const { center, distanceKm, seed = 1 } = await req.json();
    if (!center?.latitude || !center?.longitude || !distanceKm) {
      return json({ error: 'center and distanceKm are required' }, 400);
    }

    // run + walk both use the foot profile; the app handles the pace estimate.
    const url = new URL('https://graphhopper.com/api/1/route');
    url.searchParams.set('profile', 'foot');
    url.searchParams.set('point', `${center.latitude},${center.longitude}`);
    url.searchParams.set('algorithm', 'round_trip');
    url.searchParams.set('round_trip.distance', String(Math.round(distanceKm * 1000)));
    url.searchParams.set('round_trip.seed', String(seed));
    url.searchParams.set('points_encoded', 'false');
    url.searchParams.set('elevation', 'true');
    url.searchParams.set('key', GRAPHHOPPER_API_KEY);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`GraphHopper ${res.status}: ${await res.text()}`);
    const data = await res.json();

    const path = data.paths?.[0];
    if (!path?.points?.coordinates?.length) throw new Error('no path returned');

    // GraphHopper returns [lng, lat, (ele)] tuples.
    const coordinates = path.points.coordinates.map((c: number[]) => ({
      latitude: c[1],
      longitude: c[0],
    }));

    return json({
      coordinates,
      distanceKm: Math.round((path.distance / 1000) * 10) / 10,
      timeMin: Math.round(path.time / 60000),
      ascentM: Math.round(path.ascend ?? 0),
    });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
