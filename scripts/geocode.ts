/**
 * npm run geocode -- "Clarington" "1 Example Road, Clarington" …
 *
 * Takes either a municipality name or a street address. Address-level
 * precision needs the latter: a feature claiming rooftop or street precision
 * must carry an `address`, and that address is what gets looked up here.
 *
 * Resolves Ontario place names to coordinates through a real geocoder and
 * records what answered and when. This is the only sanctioned way coordinates
 * enter the project: data rule 3 forbids geocoding from model knowledge or
 * memory, and `npm run validate` enforces it by requiring every feature's
 * coordinates to appear in the cache this script writes.
 *
 * The geocoder is Nominatim — keyless, open data, and already the source
 * behind the basemap, so it adds no new account or billing relationship. Its
 * usage policy asks for an identifying User-Agent and at most one request per
 * second; both are honoured below. Results are ODbL, which is why each entry
 * stores the licence string Nominatim returns.
 *
 * A failed lookup is reported and skipped, never guessed at. A feature without
 * coordinates is a feature we leave out.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_PATH = join(ROOT, "scripts/geocode-cache.json");

const GEOCODER = "nominatim.openstreetmap.org";
const ENDPOINT = `https://${GEOCODER}/search`;

/** Nominatim's policy requires a User-Agent identifying the application and a
 *  way to contact whoever runs it. */
const USER_AGENT =
  "ontario-ai-map/0.1 (https://github.com/a-noble-savage/ontario-ai-map)";

/** Policy ceiling is one request per second. The margin is deliberate. */
const REQUEST_INTERVAL_MS = 1100;

/** Everything mapped here is in Ontario; saying so disambiguates the many
 *  Ontario place names that also exist elsewhere (London, Windsor, Chatham). */
const qualify = (place: string): string =>
  `${place.trim()}, Ontario, Canada`;

export type CacheEntry = {
  query: string;
  lon: number;
  lat: number;
  /** What the geocoder called the thing it matched. Kept so a wrong match is
   *  visible in review rather than buried behind a plausible number. */
  display_name: string;
  geocoder: string;
  licence: string;
  osm_type: string | null;
  osm_id: number | null;
  retrieved: string;
};

type Cache = Record<string, CacheEntry>;

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  licence?: string;
  osm_type?: string;
  osm_id?: number;
};

const today = (): string => new Date().toISOString().slice(0, 10);

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const readCache = (): Cache =>
  existsSync(CACHE_PATH)
    ? (JSON.parse(readFileSync(CACHE_PATH, "utf8")) as Cache)
    : {};

/** Written with sorted keys so a new lookup is a one-line diff rather than a
 *  reshuffle of the whole file. */
const writeCache = (cache: Cache): void => {
  const sorted: Cache = {};
  for (const key of Object.keys(cache).sort()) {
    const entry = cache[key];
    if (entry !== undefined) sorted[key] = entry;
  }
  writeFileSync(CACHE_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
};

const lookup = async (query: string): Promise<CacheEntry | null> => {
  const url = new URL(ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "ca");

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
  });

  if (!response.ok) {
    console.error(`  HTTP ${response.status} for "${query}"`);
    return null;
  }

  const results = (await response.json()) as NominatimResult[];
  const first = results[0];
  if (first === undefined) return null;

  return {
    query,
    lon: Number(first.lon),
    lat: Number(first.lat),
    display_name: first.display_name,
    geocoder: GEOCODER,
    licence: first.licence ?? "Data © OpenStreetMap contributors, ODbL 1.0",
    osm_type: first.osm_type ?? null,
    osm_id: first.osm_id ?? null,
    retrieved: today(),
  };
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const refresh = args.includes("--refresh");
  const places = args.filter((arg) => !arg.startsWith("--"));

  if (places.length === 0) {
    console.error(
      'Usage: npm run geocode -- "Clarington" "Greater Sudbury" [--refresh]',
    );
    process.exit(1);
  }

  const cache = readCache();
  let added = 0;
  let failed = 0;
  let first = true;

  for (const place of places) {
    const query = qualify(place);

    if (!refresh && cache[query] !== undefined) {
      console.log(`  cached  ${query}`);
      continue;
    }

    // Rate limit applies between network calls only; cached hits are free.
    if (!first) await sleep(REQUEST_INTERVAL_MS);
    first = false;

    const entry = await lookup(query);

    if (entry === null) {
      // Rule 3: no result means the feature stays out. Never approximate.
      console.error(`  FAILED  ${query} — no match, leave the feature out`);
      failed += 1;
      continue;
    }

    cache[query] = entry;
    added += 1;
    console.log(`  ok      ${query}`);
    console.log(`            ${entry.display_name}`);
    console.log(
      `            "geometry": { "type": "Point", "coordinates": [${entry.lon}, ${entry.lat}] },`,
    );
  }

  writeCache(cache);

  console.log(
    `\ngeocode: ${added} added, ${failed} failed, ${Object.keys(cache).length} in cache`,
  );
  if (failed > 0) process.exit(1);
};

await main();
