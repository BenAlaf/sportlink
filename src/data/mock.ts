/**
 * Mock data for the Tel Aviv demo. This is the M1 fallback layer — every screen
 * works fully against this data with zero API keys. Later milestones swap these
 * for live sources (Supabase courts, GraphHopper routes, OpenAI plans).
 */

import type { Court, RunRoute, UserProfile } from '@/types';

/** Demo city center (Tel Aviv) used as the reference point for distances/maps. */
export const DEMO_CITY = {
  name: 'Tel Aviv',
  latitude: 32.0809,
  longitude: 34.7806,
} as const;

export const defaultProfile: UserProfile = {
  name: 'Athlete',
  fitnessLevel: 'intermediate',
  preferredSports: ['basketball', 'tennis'],
  goal: 'Improve overall fitness',
  weeklyTarget: 4,
};

export const mockCourts: Court[] = [
  {
    id: 'c1',
    name: 'Gan Meir Basketball Court',
    sport: 'basketball',
    address: 'Gan Meir, King George St',
    distanceKm: 0.9,
    latitude: 32.0746,
    longitude: 34.7748,
    surface: 'Asphalt',
    lit: true,
    free: true,
  },
  {
    id: 'c2',
    name: 'Rabin Square Court',
    sport: 'basketball',
    address: 'Rabin Square',
    distanceKm: 1.3,
    latitude: 32.0809,
    longitude: 34.7806,
    surface: 'Concrete',
    lit: true,
    free: true,
  },
  {
    id: 'c3',
    name: 'Sportek Basketball Courts',
    sport: 'basketball',
    address: 'Hayarkon Park, Sportek',
    distanceKm: 2.8,
    latitude: 32.101,
    longitude: 34.805,
    surface: 'Acrylic',
    lit: true,
    free: true,
  },
  {
    id: 'c4',
    name: 'Gordon Tennis Courts',
    sport: 'tennis',
    address: 'Gordon Beach Promenade',
    distanceKm: 1.6,
    latitude: 32.083,
    longitude: 34.768,
    surface: 'Hard court',
    lit: true,
    free: false,
  },
  {
    id: 'c5',
    name: 'Hayarkon Tennis Club',
    sport: 'tennis',
    address: 'Rokach Blvd, Hayarkon Park',
    distanceKm: 3.1,
    latitude: 32.099,
    longitude: 34.8,
    surface: 'Clay',
    lit: false,
    free: false,
  },
  {
    id: 'c6',
    name: 'Tel Aviv University Tennis',
    sport: 'tennis',
    address: 'Ramat Aviv',
    distanceKm: 4.4,
    latitude: 32.1133,
    longitude: 34.8044,
    surface: 'Hard court',
    lit: true,
    free: false,
  },
];

export const mockRoutes: RunRoute[] = [
  {
    id: 'r1',
    name: 'Rothschild – Habima Loop',
    distanceKm: 3,
    elevationM: 8,
    terrain: 'road',
    estimatedMinutes: 18,
    description: 'Flat city loop along the leafy Rothschild Boulevard median.',
  },
  {
    id: 'r2',
    name: 'Hayarkon Park Loop',
    distanceKm: 5,
    elevationM: 20,
    terrain: 'park',
    estimatedMinutes: 30,
    description: 'Shaded riverside paths through Tel Aviv’s biggest park.',
  },
  {
    id: 'r3',
    name: 'Beach Promenade Out & Back',
    distanceKm: 7,
    elevationM: 5,
    terrain: 'beach',
    estimatedMinutes: 42,
    description: 'Seafront tayelet from the port down toward Jaffa.',
  },
  {
    id: 'r4',
    name: 'Old Jaffa Coastal Circuit',
    distanceKm: 10,
    elevationM: 40,
    terrain: 'mixed',
    estimatedMinutes: 60,
    description: 'Longer loop mixing promenade, old city alleys and parkland.',
  },
];

/** Target distances offered in the Routes filter. */
export const ROUTE_DISTANCES = [3, 5, 10] as const;

/**
 * Starter prompts shown as chips on the Coach screen. The plan itself is now
 * generated from the profile by `@/lib/planner`.
 */
export const coachSuggestions = [
  'How do I improve my endurance?',
  'What should I eat before a run?',
  'Adjust my plan for sore knees',
];
