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
