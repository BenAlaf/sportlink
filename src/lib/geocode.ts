/**
 * On-device reverse geocoding. Turns a court's coordinates into a short,
 * human-readable location like "Etzel Road, Rehovot" using the phone's built-in
 * geocoder (Apple on iOS, the platform Geocoder on Android) — no API key and no
 * external service. Most OpenStreetMap courts have only a sport + coordinates,
 * so this is how we give every nearby court a real sense of place.
 *
 * Results are cached in memory for the session, and we only ever geocode the
 * handful of courts shown near the user, so we stay well under the OS geocoder's
 * rate limits.
 */

import * as Location from 'expo-location';

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

function keyFor(lat: number, lon: number): string {
  return `${lat.toFixed(5)},${lon.toFixed(5)}`;
}

/** Build a short "area, city" label from a geocoded address, skipping blanks. */
function formatLabel(a: Location.LocationGeocodedAddress): string {
  const area = a.street || a.district || a.subregion || a.name || undefined;
  const city = a.city || a.subregion || a.region || undefined;
  const parts: string[] = [];
  if (area) parts.push(area);
  if (city && city !== area) parts.push(city);
  return parts.join(', ');
}

/**
 * Reverse-geocode a coordinate to a short label, or '' if unavailable. Cached
 * per coordinate; concurrent calls for the same point share a single request.
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  const key = keyFor(latitude, longitude);

  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const pending = inflight.get(key);
  if (pending) return pending;

  const request = (async () => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      const label = results[0] ? formatLabel(results[0]) : '';
      cache.set(key, label); // cache success (incl. a genuine blank) so we don't retry it
      return label;
    } catch {
      return ''; // transient failure (e.g. rate limit) — don't cache, allow a later retry
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, request);
  return request;
}
