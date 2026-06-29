/** Domain types shared across SportLink. */

export type SportType = 'basketball' | 'tennis';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export type RouteTerrain = 'road' | 'park' | 'beach' | 'mixed';

export interface UserProfile {
  name: string;
  fitnessLevel: FitnessLevel;
  preferredSports: SportType[];
  /** Free-text training goal, e.g. "Run a 10k". */
  goal: string;
  /** Target workouts per week. */
  weeklyTarget: number;
}

export interface Court {
  id: string;
  name: string;
  sport: SportType;
  address: string;
  /** Straight-line distance from the demo location, in km. */
  distanceKm: number;
  latitude: number;
  longitude: number;
  surface?: string;
  /** Has floodlights for night play. */
  lit?: boolean;
  /** Free to use (no booking/fee). */
  free?: boolean;
}

export interface RunRoute {
  id: string;
  name: string;
  distanceKm: number;
  elevationM: number;
  terrain: RouteTerrain;
  estimatedMinutes: number;
  description: string;
}

export interface PlanDay {
  /** Short weekday label, e.g. "Mon". */
  day: string;
  title: string;
  detail: string;
}

export interface TrainingPlan {
  title: string;
  summary: string;
  days: PlanDay[];
  /** Where the plan came from — drives the "AI active" UI cues. */
  source?: 'local' | 'ai';
}

/** A geographic coordinate (matches react-native-maps' LatLng shape). */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export type Activity = 'run' | 'walk';

/** A generated running/walking loop drawn on the map. */
export interface GeneratedRoute {
  id: string;
  name: string;
  distanceKm: number;
  estimatedMinutes: number;
  ascentM: number;
  activity: Activity;
  /** Ordered loop coordinates (first === last). */
  coordinates: GeoPoint[];
  /** 'graphhopper' = real road loop; 'local' = synthetic fallback. */
  source: 'graphhopper' | 'local';
}
