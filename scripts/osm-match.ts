/**
 * npm run osm-match -- --file names.txt
 *
 * Looks up organisations by name in OpenStreetMap, restricted to Ontario, and
 * records any that carry a street address into scripts/geocode-cache.json.
 *
 * This exists because a directory can name an organisation without saying
 * where it is. Rather than supplying the location from memory — which data
 * rule 3 forbids for good reason — the name is taken to a second source that
 * publishes both an address and a position, and what that source answered is
 * written down.
 *
 * Overpass rather than Nominatim: matching several hundred names one request
 * at a time is bulk geocoding, which Nominatim's usage policy does not permit.
 * Overpass answers a batch of names in a single query, which is both far
 * fewer requests and the tool actually designed for the job.
 *
 * A match is only recorded when OSM has an address for it. A mapped point
 * with no address cannot honestly claim street precision under our schema,
 * and inventing one is the thing this script exists to avoid.
 *
 * Measured yield, 2026-08-14, against the 563 organisations named in the
 * canada.ai directory: roughly one usable match per forty names. Vector
 * Institute, Borealis AI, Creative Destruction Lab and Cologix are all absent
 * from OSM as addressed features; Communitech is present, MaRS only as a
 * street with no number. OSM's coverage of offices is driven by whoever
 * happened to map them, which does not correlate with being an AI company, so
 * a layer built this way would be an arbitrary sample rather than a survey.
 *
 * Wide name regexes over the whole province are also expensive for Overpass —
 * batches of forty returned 504s consistently — hence the small batch size and
 * the retries. The tool is sound for looking up a modest list of named
 * institutions; it is the wrong instrument for enumerating an industry.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_PATH = join(ROOT, "scripts/geocode-cache.json");

const ENDPOINT = "https://overpass-api.de/api/interpreter";
const GEOCODER = "overpass-api.de (OpenStreetMap)";
const LICENCE = "Data © OpenStreetMap contributors, ODbL 1.0";
const USER_AGENT =
  "ontario-ai-map/0.1 (https://github.com/a-noble-savage/ontario-ai-map)";

/** Names per query. Forty was too many: a regex alternation that wide, matched
 *  against every named feature in Ontario, times out server-side with a 504. */
const BATCH_SIZE = 12;
const BATCH_DELAY_MS = 3000;

/** Overpass is a free shared service that answers slowly under load and drops
 *  connections outright when busy. Both are normal and neither should cost a
 *  run its progress. */
const MAX_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 8000;

type CacheEntry = {
  query: string;
  lon: number;
  lat: number;
  display_name: string;
  address: string;
  geocoder: string;
  licence: string;
  osm_type: string | null;
  osm_id: number | null;
  retrieved: string;
};

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const today = (): string => new Date().toISOString().slice(0, 10);
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** OSM names rarely carry the parenthetical qualifiers and legal suffixes a
 *  directory uses, so match on the bare trading name. */
export const normalise = (name: string): string =>
  name
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(Inc|Ltd|Limited|Corp|Corporation|LLC|LP|Co)\.?\b/gi, " ")
    .replace(/[.,]+\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();

const escapeForRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const readCache = (): Record<string, CacheEntry> =>
  existsSync(CACHE_PATH)
    ? (JSON.parse(readFileSync(CACHE_PATH, "utf8")) as Record<string, CacheEntry>)
    : {};

const writeCache = (cache: Record<string, CacheEntry>): void => {
  const sorted: Record<string, CacheEntry> = {};
  for (const key of Object.keys(cache).sort()) {
    const entry = cache[key];
    if (entry !== undefined) sorted[key] = entry;
  }
  writeFileSync(CACHE_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
};

/** Only an address good enough to stand behind street precision counts, which
 *  means a house number as well as a street. A bare "College Street, Toronto"
 *  reads as an address in a popup while telling the reader almost nothing, and
 *  the point it came with is far more precise than that text implies. */
const composeAddress = (tags: Record<string, string>): string | null => {
  const number = tags["addr:housenumber"];
  const street = tags["addr:street"];
  const city = tags["addr:city"];
  if (street === undefined || number === undefined) return null;
  return city === undefined
    ? `${number} ${street}`
    : `${number} ${street}, ${city}`;
};

const queryBatch = async (names: string[]): Promise<OverpassElement[]> => {
  const pattern = names.map(escapeForRegex).join("|");
  const query = `[out:json][timeout:90];
area["ISO3166-2"="CA-ON"]->.on;
nwr["name"~"^(${pattern})$"](area.on);
out center tags;`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "User-Agent": USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ data: query }),
      });

      if (response.ok) {
        const payload = (await response.json()) as {
          elements?: OverpassElement[];
        };
        return payload.elements ?? [];
      }

      console.error(
        `  HTTP ${response.status} (attempt ${attempt}/${MAX_ATTEMPTS})`,
      );
    } catch (cause) {
      // A dropped connection is not a reason to lose the whole run.
      const message = cause instanceof Error ? cause.message : String(cause);
      console.error(`  ${message} (attempt ${attempt}/${MAX_ATTEMPTS})`);
    }

    if (attempt < MAX_ATTEMPTS) await sleep(RETRY_BACKOFF_MS * attempt);
  }

  console.error(`  giving up on this batch of ${names.length}`);
  return [];
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const fileFlag = args.indexOf("--file");
  if (fileFlag === -1 || args[fileFlag + 1] === undefined) {
    console.error("Usage: npm run osm-match -- --file names.txt");
    process.exit(1);
  }

  const names = readFileSync(args[fileFlag + 1] as string, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  const wanted = new Map<string, string>();
  for (const name of names) {
    const key = normalise(name);
    if (key.length > 2) wanted.set(key.toLowerCase(), name);
  }

  console.log(`looking up ${wanted.size} distinct names in Ontario OSM`);

  const cache = readCache();
  const keys = [...wanted.keys()];
  let matched = 0;
  let withoutAddress = 0;

  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    const batch = keys.slice(i, i + BATCH_SIZE);
    const originals = batch.map((k) => wanted.get(k) as string);

    if (i > 0) await sleep(BATCH_DELAY_MS);
    const elements = await queryBatch(originals.map(normalise));

    for (const element of elements) {
      const tags = element.tags ?? {};
      const name = tags["name"];
      if (name === undefined) continue;

      const original = wanted.get(normalise(name).toLowerCase());
      if (original === undefined) continue;

      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;
      if (lat === undefined || lon === undefined) continue;

      const address = composeAddress(tags);
      if (address === null) {
        withoutAddress += 1;
        console.log(`  no address  ${original}`);
        continue;
      }

      cache[`osm:${original}`] = {
        query: `osm:${original}`,
        lon,
        lat,
        display_name: `${name}${tags["addr:city"] ? `, ${tags["addr:city"]}` : ""}`,
        address,
        geocoder: GEOCODER,
        licence: LICENCE,
        osm_type: element.type,
        osm_id: element.id,
        retrieved: today(),
      };
      matched += 1;
      console.log(`  matched     ${original}  ->  ${address}`);
    }

    // Written every batch rather than at the end: a run this long will
    // sometimes be interrupted, and losing an hour of other people's server
    // time to keep an in-memory object tidy would be a poor trade.
    writeCache(cache);

    console.log(
      `  ... batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(keys.length / BATCH_SIZE)} done (${matched} matched so far)`,
    );
  }

  writeCache(cache);
  console.log(
    `\nosm-match: ${matched} with an address, ${withoutAddress} found but unaddressed, ${Object.keys(cache).length} entries in cache`,
  );
};

await main();
