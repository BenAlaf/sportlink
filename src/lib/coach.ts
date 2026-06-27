/**
 * Coach chat client (M4). Tries the OpenAI-backed Supabase Edge Function when a
 * backend is configured, and falls back to on-device rule-based replies so the
 * coach always answers — with or without keys. The OpenAI key itself never
 * reaches the app; it lives in the Edge Function's secrets.
 */

import type { UserProfile } from '@/types';

import { backend, isBackendConfigured } from './config';

export type ChatTurn = { from: 'user' | 'coach'; text: string };

export interface CoachReply {
  text: string;
  source: 'local' | 'ai';
}

/** Rule-based replies — broad enough to feel like a real coach with no key. */
export function localCoachReply(question: string, profile: UserProfile): string {
  const q = question.toLowerCase();
  const name = profile.name || 'there';

  if (/(endurance|stamina|longer|further|aerobic)/.test(q)) {
    return `Build endurance gradually, ${name} — add one longer easy run each week and keep most runs at a pace where you can still hold a conversation.`;
  }
  if (/(eat|food|nutrition|fuel|diet)/.test(q)) {
    return 'Before a run, aim for a light carb snack 30–60 min ahead (banana, toast). Hydrate well, and keep it low-fiber to avoid stomach trouble.';
  }
  if (/(knee|injur|pain|sore|hurt|ache)/.test(q)) {
    return "Let's ease off this week: swap one run for an easy court session or a walk, ice after activity, and stop if pain is sharp. See a physio if it persists.";
  }
  if (/(rest|recover|tired|fatigue|sleep)/.test(q)) {
    return 'Recovery is where you get stronger. Keep at least one full rest day, prioritise sleep, and make easy days genuinely easy.';
  }
  if (/(faster|speed|pace|sprint|race)/.test(q)) {
    return 'For speed, add one quality session a week — intervals (e.g. 6 × 400 m) or a tempo run — and keep the rest easy so you can absorb the hard work.';
  }
  if (/(weight|lose|fat|lean)/.test(q)) {
    return 'For body composition, consistency beats intensity: keep your weekly sessions, add a bit of cross-training, and pair it with steady, whole-food nutrition.';
  }
  if (/(plan|schedule|week|adjust|change)/.test(q)) {
    return `Your plan is built from your profile, ${name}. Tweak your fitness level, weekly target or goal on the Profile tab and it updates automatically.`;
  }
  if (/(basketball|tennis|court|sport)/.test(q)) {
    return 'Court play is great cross-training — it sharpens agility and keeps cardio fun. Slot it on a non-running-hard day so legs stay fresh.';
  }
  return `Good question, ${name}! For now I'm giving rule-based guidance — connect an OpenAI key and I'll tailor answers to your full profile and history. Meanwhile, lean on the weekly plan above.`;
}

/**
 * Ask the coach a question. Uses the Edge Function when configured, otherwise
 * (and on any network/error) returns the local rule-based reply.
 */
export async function askCoach(params: {
  question: string;
  profile: UserProfile;
  history?: ChatTurn[];
}): Promise<CoachReply> {
  const { question, profile, history = [] } = params;

  if (!isBackendConfigured) {
    return { text: localCoachReply(question, profile), source: 'local' };
  }

  try {
    const res = await fetch(`${backend.functionsUrl}/coach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${backend.supabaseAnonKey}`,
      },
      body: JSON.stringify({ mode: 'chat', question, profile, history }),
    });
    if (!res.ok) throw new Error(`coach function ${res.status}`);
    const data = (await res.json()) as { reply?: string };
    if (!data.reply) throw new Error('coach function returned no reply');
    return { text: data.reply, source: 'ai' };
  } catch (err) {
    // Never block the user — degrade to the on-device coach.
    if (__DEV__) console.warn('[coach] falling back to local reply:', err);
    return { text: localCoachReply(question, profile), source: 'local' };
  }
}
