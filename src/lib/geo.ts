/** Geo helpers: distance math + handing off navigation to the native maps app. */

import { Linking, Platform } from 'react-native';

export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Great-circle distance between two points, in kilometers. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371; // earth radius km
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Format a km distance for display, e.g. "850 m" or "2.4 km". */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** Open the native maps app with directions to a destination. */
export function openDirections(dest: LatLng, label?: string): Promise<void> {
  const name = label ? encodeURIComponent(label) : '';
  const url = Platform.select({
    ios: `maps://?daddr=${dest.latitude},${dest.longitude}${name ? `&q=${name}` : ''}`,
    android: `geo:${dest.latitude},${dest.longitude}?q=${dest.latitude},${dest.longitude}(${name})`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${dest.latitude},${dest.longitude}`,
  });
  return Linking.openURL(url).catch(() => {
    // Fall back to a universal web maps link if the native scheme fails.
    return Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${dest.latitude},${dest.longitude}`,
    );
  });
}
