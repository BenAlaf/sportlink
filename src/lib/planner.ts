/**
 * Rule-based training-plan generator (M4). This is the always-works core of the
 * AI Coach: it turns a UserProfile into a sensible 7-day plan with zero API keys.
 * When an OpenAI key + Supabase project are wired up, the Edge Function can
 * produce a richer plan, but this engine remains the offline fallback.
 */

import type { FitnessLevel, PlanDay, SportType, TrainingPlan, UserProfile } from '@/types';

import { indefiniteArticle } from './text';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

type Session = { title: string; detail: string };

/** Run distances (km) per level, used to scale the running sessions. */
const RUN_KM: Record<FitnessLevel, { easy: number; tempo: number; long: number }> = {
  beginner: { easy: 3, tempo: 3, long: 5 },
  intermediate: { easy: 5, tempo: 4, long: 8 },
  advanced: { easy: 8, tempo: 6, long: 12 },
};

/** Which weekdays are active, by number of active days. Sunday stays rest. */
const ACTIVE_DAYS: Record<number, number[]> = {
  2: [1, 5], //          Tue, Sat
  3: [0, 2, 5], //       Mon, Wed, Sat
  4: [0, 1, 3, 5], //    Mon, Tue, Thu, Sat
  5: [0, 1, 3, 4, 5], // Mon, Tue, Thu, Fri, Sat
  6: [0, 1, 2, 3, 4, 5], // Mon–Sat
};

type Emphasis = 'balanced' | 'endurance' | 'speed' | 'weight' | 'strength';

/** Infer training emphasis from the free-text goal so the plan reflects intent. */
function readEmphasis(goal: string): Emphasis {
  const g = goal.toLowerCase();
  if (/(10k|5k|marathon|half|endurance|distance|stamina)/.test(g)) return 'endurance';
  if (/(speed|fast|sprint|pace|race)/.test(g)) return 'speed';
  if (/(weight|fat|lean|slim|lose)/.test(g)) return 'weight';
  if (/(strength|muscle|power|tone)/.test(g)) return 'strength';
  return 'balanced';
}

const REST: Session = { title: 'Rest', detail: 'Full rest or gentle stretching.' };

function sportSession(sport: SportType): Session {
  return sport === 'basketball'
    ? { title: 'Basketball', detail: '45 min pickup — full-court if you can.' }
    : { title: 'Tennis', detail: '1 hr hitting session at the local courts.' };
}

/**
 * Build the ordered pool of active sessions for the week. The order matters:
 * harder sessions are interleaved with easy/sport days so nothing lands two
 * hard efforts back-to-back once the days are filled in sequence.
 */
function buildSessionPool(profile: UserProfile, emphasis: Emphasis): Session[] {
  const km = RUN_KM[profile.fitnessLevel];
  const sports = profile.preferredSports.length ? profile.preferredSports : (['basketball'] as SportType[]);
  const sportA = sportSession(sports[0]);
  const sportB = sportSession(sports[sports.length > 1 ? 1 : 0]);

  const easy: Session = { title: 'Easy run', detail: `${km.easy} km at a conversational pace.` };
  const tempo: Session = {
    title: 'Tempo run',
    detail: `${km.tempo} km with the middle section at a comfortably-hard effort.`,
  };
  const long: Session = { title: 'Long run', detail: `${km.long} km steady to build your aerobic base.` };
  const intervals: Session = { title: 'Intervals', detail: '6 × 400 m fast with 90 s jog recovery.' };
  const strength: Session = {
    title: 'Strength',
    detail: '30 min bodyweight circuit: squats, lunges, push-ups, planks.',
  };
  const cross: Session = { title: 'Cross-train', detail: '40 min easy cycling or swimming.' };

  switch (emphasis) {
    case 'endurance':
      return [long, sportA, easy, tempo, sportB, easy, cross];
    case 'speed':
      return [intervals, sportA, tempo, easy, sportB, long, strength];
    case 'weight':
      return [easy, sportA, cross, tempo, sportB, strength, long];
    case 'strength':
      return [strength, easy, sportA, tempo, sportB, long, cross];
    default:
      return [long, sportA, easy, tempo, sportB, strength, cross];
  }
}

function summaryFor(profile: UserProfile, emphasis: Emphasis, activeDays: number): string {
  const focus: Record<Emphasis, string> = {
    balanced: 'a balanced mix of running, court play and recovery',
    endurance: 'aerobic base-building with longer, easier running',
    speed: 'faster running — intervals and tempo work',
    weight: 'frequent, calorie-burning sessions and cross-training',
    strength: 'running paired with strength work',
  };
  return `A ${activeDays}-day week focused on ${focus[emphasis]} — tuned for ${indefiniteArticle(profile.fitnessLevel)} ${profile.fitnessLevel} athlete.`;
}

function titleFor(emphasis: Emphasis): string {
  const titles: Record<Emphasis, string> = {
    balanced: 'Weekly Base Builder',
    endurance: 'Endurance Base Builder',
    speed: 'Speed & Tempo Week',
    weight: 'Active Burn Week',
    strength: 'Run & Strength Week',
  };
  return titles[emphasis];
}

/**
 * Generate a 7-day training plan from the profile.
 * @param variant rotates the session pool so "Regenerate" yields a fresh plan.
 */
export function buildPlan(profile: UserProfile, variant = 0): TrainingPlan {
  const emphasis = readEmphasis(profile.goal);
  const activeCount = Math.min(Math.max(profile.weeklyTarget, 2), 6);
  const activeDayIdx = ACTIVE_DAYS[activeCount];

  // Rotate the pool by `variant` so repeated taps shuffle which sessions appear.
  const pool = buildSessionPool(profile, emphasis);
  const rotated = pool.map((_, i) => pool[(i + variant) % pool.length]);

  const days: PlanDay[] = WEEKDAYS.map((day, idx) => {
    const slot = activeDayIdx.indexOf(idx);
    const session = slot === -1 ? REST : rotated[slot % rotated.length];
    return { day, title: session.title, detail: session.detail };
  });

  return {
    title: titleFor(emphasis),
    summary: summaryFor(profile, emphasis, activeCount),
    days,
    source: 'local',
  };
}
