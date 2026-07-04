#!/usr/bin/env node
/**
 * Seed the `courts` table with real basketball & tennis courts across Israel,
 * pulled from OpenStreetMap via the free Overpass API. Run this once:
 *
 *   cd mobile
 *   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... node scripts/seed-courts.mjs
 *
 * The service_role key bypasses Row-Level Security so the script can write the
 * shared court data. NEVER put it in .env, the app bundle, or git — pass it
 * inline as above so it only lives in your shell for that one command.
 *
 * The Supabase URL is read automatically from mobile/.env
 * (EXPO_PUBLIC_SUPABASE_URL). Re-running is safe: rows are upserted by `id`,
 * so a second run refreshes the data instead of creating duplicates.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────────────
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const SUPABASE_URL = (process.env.SUPABASE_URL ?? readEnv('EXPO_PUBLIC_SUPABASE_URL'))?.replace(/\/+$/, '');

// Public Overpass mirrors, tried in order. If one is busy or rejects us, the
// next is used automatically.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const BATCH_SIZE = 500;

// Israel (ISO country code IL), all basketball + tennis pitches. `out center`
// returns one coordinate per court (the polygon center for mapped courts) and
// `tags` gives us the name, surface, lighting, etc.
const OVERPASS_QUERY = `
[out:json][timeout:180];
area["ISO3166-1"="IL"][admin_level=2]->.il;
(
  nwr["leisure"="pitch"]["sport"~"basketball|tennis"](area.il);
);
out center tags;
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Read a single key out of mobile/.env without needing a dotenv dependency. */
function readEnv(key) {
  try {
    const file = readFileSync(join(HERE, '..', '.env'), 'utf8');
    for (const line of file.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '').trim();
    }
  } catch {
    // No .env file — that's fine, the caller handles a missing URL.
  }
  return undefined;
}

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function buildAddress(tags) {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  return [street, tags['addr:city']].filter(Boolean).join(', ');
}

/** Map one raw OSM element to a courts-table row, or null if it has no coords. */
function toCourt(el) {
  const tags = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null) return null;

  // A pitch can be tagged "basketball", "tennis" or a mix like "basketball;tennis".
  // We classify multi-use courts as basketball; everything else is tennis.
  const sport = String(tags.sport ?? '').includes('basketball') ? 'basketball' : 'tennis';

  // Use any real name OSM gives us (English, Hebrew, or the operator) before
  // falling back to a generic label. The app fills in a location for the
  // generic ones by reverse-geocoding their coordinates on-device.
  const realName = (tags.name ?? tags['name:en'] ?? tags['name:he'] ?? tags.operator ?? '').trim();
  const name = realName || (sport === 'basketball' ? 'Basketball court' : 'Tennis court');

  return {
    id: `osm-${el.type}-${el.id}`,
    name,
    sport,
    latitude: lat,
    longitude: lon,
    address: buildAddress(tags),
    surface: tags.surface ? capitalize(String(tags.surface).replace(/_/g, ' ')) : null,
    lit: tags.lit === 'yes' ? true : tags.lit === 'no' ? false : null,
    free: tags.fee === 'no' ? true : tags.fee === 'yes' ? false : null,
    source: 'osm',
  };
}

async function fetchCourts() {
  console.log('→ Querying OpenStreetMap (Overpass) for courts in Israel…');
  let lastError;
  for (const url of OVERPASS_ENDPOINTS) {
    const host = new URL(url).host;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // A User-Agent is required by the OSM usage policy; without one the
          // public endpoints reject the request (that's the 406 you saw).
          'User-Agent': 'SportLink-CourtSeeder/1.0',
          Accept: 'application/json',
        },
        body: 'data=' + encodeURIComponent(OVERPASS_QUERY),
      });
      if (!res.ok) {
        lastError = new Error(`${host} → ${res.status} ${res.statusText}`);
        console.log(`  ${host} returned ${res.status}, trying another mirror…`);
        continue;
      }
      const json = await res.json();
      return json.elements ?? [];
    } catch (err) {
      lastError = err;
      console.log(`  ${host} failed (${err.message}), trying another mirror…`);
    }
  }
  throw new Error(
    `All Overpass mirrors failed. Last error: ${lastError?.message}. ` +
      'Wait a minute and run it again — the public API is sometimes busy.',
  );
}

async function upsertBatch(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/courts`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      // merge-duplicates = upsert on the primary key; return=minimal skips echoing rows back.
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`Supabase upsert failed (${res.status}): ${await res.text()}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!SERVICE_ROLE_KEY) {
    console.error(
      '✗ Missing SUPABASE_SERVICE_ROLE_KEY.\n' +
        '  Run:  SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/seed-courts.mjs\n' +
        '  Find the key in Supabase → Project Settings → API → service_role (secret).',
    );
    process.exit(1);
  }
  if (!SUPABASE_URL) {
    console.error('✗ Missing Supabase URL. Expected EXPO_PUBLIC_SUPABASE_URL in mobile/.env');
    process.exit(1);
  }

  const elements = await fetchCourts();

  // De-dupe by id (a court occasionally appears as both a node and a way).
  const seen = new Set();
  const courts = [];
  for (const el of elements) {
    const court = toCourt(el);
    if (!court || seen.has(court.id)) continue;
    seen.add(court.id);
    courts.push(court);
  }

  const basketball = courts.filter((c) => c.sport === 'basketball').length;
  console.log(`→ Found ${courts.length} courts (${basketball} basketball, ${courts.length - basketball} tennis).`);
  if (courts.length === 0) {
    console.error('✗ No courts returned — aborting so nothing gets wiped.');
    process.exit(1);
  }
  console.log('  example row:', JSON.stringify(courts[0]));

  console.log(`→ Writing to Supabase in batches of ${BATCH_SIZE}…`);
  for (let i = 0; i < courts.length; i += BATCH_SIZE) {
    const batch = courts.slice(i, i + BATCH_SIZE);
    await upsertBatch(batch);
    console.log(`  upserted ${Math.min(i + batch.length, courts.length)}/${courts.length}`);
  }

  console.log('✓ Done. Courts are live in Supabase.');
}

main().catch((err) => {
  console.error('✗', err.message);
  process.exit(1);
});
