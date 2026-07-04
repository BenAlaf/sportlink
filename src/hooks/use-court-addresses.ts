/**
 * Lazily fills in a location label for courts that arrive without an address
 * (most OSM courts have only coordinates). It reverse-geocodes each one on-device
 * and returns a courtId → label map that grows as results come in. Courts are
 * processed one at a time in list order, so the nearest, most-visible courts get
 * their location first and the OS geocoder is never hammered.
 */

import { useEffect, useState } from 'react';

import { reverseGeocode } from '@/lib/geocode';
import type { Court } from '@/types';

export function useCourtAddresses(courts: Court[]): Record<string, string> {
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const missing = courts.filter((c) => !c.address);

    (async () => {
      for (const court of missing) {
        if (cancelled) return;
        const label = await reverseGeocode(court.latitude, court.longitude);
        if (cancelled) return;
        if (label) {
          setLabels((prev) => (prev[court.id] === label ? prev : { ...prev, [court.id]: label }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courts]);

  return labels;
}
