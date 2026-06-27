/**
 * SportLink AI Coach — Supabase Edge Function (M4).
 *
 * Keeps the OpenAI key server-side. The app calls this with a profile + question
 * ("chat") or a profile ("plan"); we ask OpenAI and return JSON. If OPENAI_API_KEY
 * is missing the function returns 503 and the app silently falls back to its
 * on-device rule-based coach.
 *
 * Deploy:
 *   supabase functions deploy coach
 *   supabase secrets set OPENAI_API_KEY=sk-...
 *
 * This file targets Deno (the Edge runtime) and is intentionally excluded from
 * the app's TypeScript build.
 */

// @ts-nocheck — Deno runtime; not part of the Expo app's type-check.

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';

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

function systemPrompt(profile: any): string {
  const sports = (profile?.preferredSports ?? []).join(' and ') || 'general fitness';
  return [
    'You are SportLink, a concise, encouraging running and fitness coach.',
    `The athlete is ${profile?.name ?? 'an athlete'}, a ${profile?.fitnessLevel ?? 'intermediate'} level athlete`,
    `who plays ${sports}, trains about ${profile?.weeklyTarget ?? 4} days/week,`,
    `with the goal: "${profile?.goal ?? 'general fitness'}".`,
    'Keep replies practical and under 80 words. Never give medical diagnoses; suggest a professional for persistent pain.',
  ].join(' ');
}

async function callOpenAI(messages: { role: string; content: string }[]) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.6, max_tokens: 300 }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (!OPENAI_API_KEY) return json({ error: 'OPENAI_API_KEY not configured' }, 503);

  try {
    const { mode = 'chat', question, profile, history = [] } = await req.json();
    const system = { role: 'system', content: systemPrompt(profile) };

    if (mode === 'plan') {
      const reply = await callOpenAI([
        system,
        {
          role: 'user',
          content:
            'Write a 7-day training plan as JSON: {"title","summary","days":[{"day","title","detail"}]}. ' +
            'Use weekday labels Mon–Sun. Respond with JSON only.',
        },
      ]);
      return json({ reply });
    }

    // mode === 'chat'
    const turns = (history as { from: string; text: string }[]).map((t) => ({
      role: t.from === 'user' ? 'user' : 'assistant',
      content: t.text,
    }));
    const reply = await callOpenAI([system, ...turns, { role: 'user', content: String(question ?? '') }]);
    return json({ reply });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
