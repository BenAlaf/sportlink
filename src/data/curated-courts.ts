/**
 * Curated court showcase — Tel Aviv + Rehovot. The Court Finder shows this
 * detailed set when the user is in one of our demo cities; everywhere else in
 * Israel it queries the full OpenStreetMap set in Supabase. Kept in the app so
 * the demo is instant and works offline.
 *
 * Every court is real. Provenance:
 *  - coordinates, surface, and floodlights come straight from OpenStreetMap;
 *  - neighborhood/street labels are the OSM reverse-geocoded location in English;
 *  - `free` reflects the facility type — public municipal courts are free and
 *    open; the tennis clubs/centers require booking, so they're marked paid.
 * Fields OSM doesn't record for a court (e.g. lighting on some) are omitted, not guessed.
 */

import type { Court } from '@/types';

/** A curated court without a distance — the client fills `distanceKm` per user location. */
export type CuratedCourt = Omit<Court, 'distanceKm'>;

export const curatedCourts: CuratedCourt[] = [
  { id: 'osm-way-91609716', name: "New North Basketball Court", sport: 'basketball', address: "Rokach Blvd, New North", latitude: 32.097541, longitude: 34.788772, surface: 'Concrete', lit: true, free: true },
  { id: 'osm-way-322756065', name: "Jaffa Basketball Court", sport: 'basketball', address: "Yehuda HaYamit St, Jaffa", latitude: 32.049902, longitude: 34.752493, surface: 'Tartan', lit: true, free: true },
  { id: 'osm-way-363404542', name: "Sarona Basketball Court", sport: 'basketball', address: "HaArba'a St, Sarona", latitude: 32.070648, longitude: 34.784084, surface: 'Asphalt', lit: true, free: true },
  { id: 'osm-way-539795389', name: "Kikar HaMedina Basketball Court", sport: 'basketball', address: "Givat HaMoreh St, Kikar HaMedina", latitude: 32.086262, longitude: 34.784991, surface: 'Asphalt', lit: false, free: true },
  { id: 'osm-way-630992776', name: "Neve Tzedek Basketball Court", sport: 'basketball', address: "HaMered St, Neve Tzedek", latitude: 32.059955, longitude: 34.761941, surface: 'Asphalt', lit: true, free: true },
  { id: 'osm-way-1029330154', name: "Kochav HaTzafon Basketball Court", sport: 'basketball', address: "Abba Kovner St, Kochav HaTzafon", latitude: 32.100848, longitude: 34.786315, surface: 'Asphalt', lit: true, free: true },
  { id: 'osm-way-143105286', name: "Kiryat Shalom Basketball Court", sport: 'basketball', address: "Kiryat Shalom, Tel Aviv", latitude: 32.04616, longitude: 34.774701, surface: 'Concrete', free: true },
  { id: 'osm-way-249768563', name: "HaHorshot Park Basketball Court", sport: 'basketball', address: "Herzl St, Tel Aviv", latitude: 32.049001, longitude: 34.770144, surface: 'Concrete', free: true },
  { id: 'osm-way-262514603', name: "Bitzaron Basketball Court", sport: 'basketball', address: "Dam HaMakabim St, Bitzaron", latitude: 32.06878, longitude: 34.800274, surface: 'Tartan', free: true },
  { id: 'osm-way-509833304', name: "Montefiore Basketball Court", sport: 'basketball', address: "Givat HaTachmoshet St, Montefiore", latitude: 32.072758, longitude: 34.791419, surface: 'Concrete', free: true },
  { id: 'ta-tennis-tlv-center', name: "Tel Aviv Tennis Center", sport: 'tennis', address: "Hadar Yosef, Tel Aviv", latitude: 32.1013, longitude: 34.7971, free: false },
  { id: 'ta-tennis-jaffa-center', name: "Jaffa Tennis Center", sport: 'tennis', address: "Jaffa, Tel Aviv-Yafo", latitude: 32.0369, longitude: 34.7565, free: false },
  { id: 'ta-tennis-academy', name: "The Tennis Academy", sport: 'tennis', address: "Ramat Aviv, Tel Aviv", latitude: 32.0971, longitude: 34.7802, free: false },
  { id: 'osm-way-98989826', name: "Tel Aviv University Tennis Courts", sport: 'tennis', address: "Ramat Aviv, Tel Aviv", latitude: 32.117577, longitude: 34.801769, free: true },
  { id: 'osm-way-211619614', name: "Jaffa Public Tennis Courts", sport: 'tennis', address: "Jaffa, Tel Aviv-Yafo", latitude: 32.036795, longitude: 34.750415, free: true },
  { id: 'osm-way-232898379', name: "Park Darom Tennis Courts", sport: 'tennis', address: "Park Darom, Tel Aviv", latitude: 32.042424, longitude: 34.792553, free: true },
  { id: 'osm-way-520798950', name: "Neve Yehuda Basketball Court", sport: 'basketball', address: "HaGefen St, Neve Yehuda", latitude: 31.90197, longitude: 34.801026, surface: 'Concrete', lit: true, free: true },
  { id: 'osm-way-170572152', name: "Ezorei Weizmann Basketball Court", sport: 'basketball', address: "Haim Sireni St, Rehovot", latitude: 31.899934, longitude: 34.819119, surface: 'Asphalt', free: true },
  { id: 'osm-way-172541915', name: "Efraim Basketball Court", sport: 'basketball', address: "Rozhinski St, Efraim", latitude: 31.896455, longitude: 34.801939, surface: 'Tartan', lit: false, free: true },
  { id: 'osm-way-1242465052', name: "Hatzerot HaMoshava Basketball Court", sport: 'basketball', address: "Derech HaYam, Rehovot", latitude: 31.893087, longitude: 34.791583, surface: 'Acrylic', free: true },
  { id: 'osm-way-199984272', name: "HaHolandit Basketball Court", sport: 'basketball', address: "HaHolandit, Rehovot", latitude: 31.895639, longitude: 34.784674, surface: 'Clay', lit: true, free: true },
  { id: 're-tennis-318726-348225', name: "Rehovot Tennis Center", sport: 'tennis', address: "Derech HaBiluyim, Rehovot", latitude: 31.8726, longitude: 34.8225, free: false },
  { id: 'osm-way-83426002', name: "Weizmann Tennis Courts", sport: 'tennis', address: "Weizmann Institute, Rehovot", latitude: 31.911092, longitude: 34.815746, free: true },
  { id: 'osm-way-195419959', name: "Neve Yehuda Tennis Court", sport: 'tennis', address: "Neve Yehuda, Rehovot", latitude: 31.903869, longitude: 34.801913, surface: 'Clay', lit: true, free: true },
];
