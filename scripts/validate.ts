/**
 * npm run validate — the gate that must pass before any commit.
 *
 * Two jobs:
 *   1. Every feature in data/ conforms to schema/feature.schema.json.
 *   2. The rules a per-feature schema structurally cannot see: identifier
 *      uniqueness across files, layer/filename agreement, coordinate
 *      collisions, the licence gate, and the geocoding provenance rule.
 *
 * The schema's own fixtures are exercised on every run so they cannot rot
 * into decoration.
 *
 * Errors block. Warnings are printed and do not block, because a coordinate
 * collision is a rendering problem to solve rather than a wrong fact.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020, { type AnySchema, type ErrorObject } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const LAYERS = [
  "datacentres",
  "companies",
  "accelerators",
  "research",
  "programs",
] as const;

/** Precisions that assert a specific address, and so must come from a real
 *  geocoder run rather than from anyone's recollection. */
const GEOCODED_PRECISIONS = new Set(["rooftop", "street"]);

/** Fixture annotation key, stripped before validating. The schema is strict,
 *  so leaving it in place would make every invalid fixture fail for the
 *  annotation instead of the rule it exists to pin. */
const ANNOTATION = "_expected_failure";

const errors: string[] = [];
const warnings: string[] = [];

const error = (msg: string) => errors.push(msg);
const warn = (msg: string) => warnings.push(msg);

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8"));

const formatAjvErrors = (errs: ErrorObject[] | null | undefined): string =>
  (errs ?? [])
    .map((e) => `${e.instancePath || "(root)"}: ${e.message}`)
    .join("; ");

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const schema = readJson(join(ROOT, "schema/feature.schema.json")) as AnySchema;
const validateFeature = ajv.compile(schema);

const check = (doc: unknown): string | null =>
  validateFeature(doc) ? null : formatAjvErrors(validateFeature.errors);

// ---------------------------------------------------------------------------
// Fixture self-test — the schema must still reject what it claims to reject
// ---------------------------------------------------------------------------

const runFixtures = (): void => {
  const dir = join(ROOT, "schema/fixtures");
  if (!existsSync(dir)) return;

  for (const expectation of ["valid", "invalid"] as const) {
    const subdir = join(dir, expectation);
    if (!existsSync(subdir)) continue;

    for (const file of readdirSync(subdir).filter((f) => f.endsWith(".json"))) {
      const doc = readJson(join(subdir, file)) as Record<string, unknown>;
      delete doc[ANNOTATION];
      const failure = check(doc);

      if (expectation === "valid" && failure) {
        error(`fixture ${file}: expected to pass, but failed — ${failure}`);
      }
      if (expectation === "invalid" && !failure) {
        error(`fixture ${file}: expected to fail, but the schema accepted it`);
      }
    }
  }
};

// ---------------------------------------------------------------------------
// Data files
// ---------------------------------------------------------------------------

type FeatureProps = {
  id: string;
  name: string;
  layer: string;
  location_precision: string;
  licence: string;
};
type Feature = {
  geometry: { coordinates: [number, number] };
  properties: FeatureProps;
};

/** id -> where it was first seen, for the uniqueness check. */
const seenIds = new Map<string, string>();
/** "lon,lat" -> every feature sitting on that exact point. */
const seenPoints = new Map<string, string[]>();

const geocodeCachePath = join(ROOT, "scripts/geocode-cache.json");
const geocodeCache: Record<string, unknown> = existsSync(geocodeCachePath)
  ? (readJson(geocodeCachePath) as Record<string, unknown>)
  : {};

const runLayer = (layer: string): void => {
  const path = join(ROOT, `data/${layer}.geojson`);
  if (!existsSync(path)) {
    error(`data/${layer}.geojson is missing`);
    return;
  }

  const collection = readJson(path) as { type?: string; features?: unknown };

  if (collection.type !== "FeatureCollection") {
    error(`data/${layer}.geojson: type must be "FeatureCollection"`);
    return;
  }
  if (!Array.isArray(collection.features)) {
    error(`data/${layer}.geojson: "features" must be an array`);
    return;
  }

  collection.features.forEach((raw, i) => {
    const where = `data/${layer}.geojson[${i}]`;

    const failure = check(raw);
    if (failure) {
      error(`${where}: ${failure}`);
      return; // Shape is wrong; the checks below would read junk.
    }

    const feature = raw as Feature;
    const { id, layer: declared, location_precision, licence } = feature.properties;
    const label = `${where} (${id})`;

    // The file a feature lives in and the layer it claims must agree, or the
    // legend and the ?layers= parameter disagree about what is on screen.
    if (declared !== layer) {
      error(`${label}: declares layer "${declared}" but lives in ${layer}.geojson`);
    }

    const firstSeen = seenIds.get(id);
    if (firstSeen) {
      error(`${label}: id already used by ${firstSeen}. Ids are never reused.`);
    } else {
      seenIds.set(id, where);
    }

    // Rule 4: a source whose terms have not been checked cannot be published.
    if (licence.trim().toLowerCase() === "unverified") {
      error(
        `${label}: licence is "unverified". Confirm the terms and record the ` +
          `finding in docs/sources.md before this record ships.`,
      );
    }

    // Rule 3: an address-level claim requires a real geocoder run. Precision
    // asserted without a cache entry is precision nobody can account for.
    if (GEOCODED_PRECISIONS.has(location_precision) && !(id in geocodeCache)) {
      error(
        `${label}: location_precision "${location_precision}" asserts an ` +
          `address, but there is no scripts/geocode-cache.json entry for it. ` +
          `Run the geocoder or downgrade the precision.`,
      );
    }

    const [lon, lat] = feature.geometry.coordinates;
    const key = `${lon},${lat}`;
    seenPoints.set(key, [...(seenPoints.get(key) ?? []), label]);
  });
};

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

runFixtures();
for (const layer of LAYERS) runLayer(layer);

// Exact collisions hide features underneath each other. Not a wrong fact, so
// it warns — but it stays visible until clustering or offsetting lands.
for (const [point, labels] of seenPoints) {
  if (labels.length > 1) {
    warn(`${labels.length} features share the exact point ${point}:`);
    for (const l of labels) warn(`    ${l}`);
  }
}

const featureCount = seenIds.size;

for (const w of warnings) console.warn(`  warn  ${w}`);
if (warnings.length) console.warn("");

if (errors.length) {
  for (const e of errors) console.error(`  ERROR ${e}`);
  console.error(`\nvalidate: ${errors.length} error(s) across ${featureCount} feature(s)`);
  process.exit(1);
}

console.log(
  `validate: ${featureCount} feature(s) across ${LAYERS.length} layer(s) OK` +
    (warnings.length ? ` (${warnings.length} warning line(s))` : ""),
);
