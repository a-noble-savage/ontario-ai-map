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
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";

import { layerSpecs } from "../src/layers/index.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const LAYERS = [
  "datacentres",
  "companies",
  "accelerators",
  "research",
  "programs",
  "innovationcentres",
] as const;

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
// Layer specs — the renderer's own definitions, against MapLibre's style spec
// ---------------------------------------------------------------------------

/**
 * Checks every layer this project asks MapLibre to draw.
 *
 * This exists because of a specific failure. A cluster radius was written as
 * ["*", zoomInterpolate, stepByCount], which MapLibre rejects — a zoom
 * expression may only be the input to a top-level step or interpolate. Both
 * `npm run validate` and `npm run build` passed, because neither had any idea
 * what a layer spec is, and the broken output reached production. addLayer
 * reports such failures as console errors rather than throwing, so the map
 * simply rendered without its cluster circles and nothing anywhere said so.
 *
 * The style spec validator runs offline and catches exactly that error, so the
 * gate now covers the renderer as well as the data.
 */
const runLayerSpecs = (): void => {
  const style = {
    version: 8 as const,
    // Symbol layers reference a font stack, so the spec wants glyphs declared.
    // Never fetched: this style is validated, never rendered.
    glyphs: "https://example.invalid/{fontstack}/{range}.pbf",
    sources: Object.fromEntries(
      LAYERS.map((layer) => [
        `src-${layer}`,
        { type: "geojson", data: { type: "FeatureCollection", features: [] } },
      ]),
    ),
    layers: LAYERS.flatMap((layer) => layerSpecs(layer, `src-${layer}`)),
  };

  for (const failure of validateStyleMin(style as never)) {
    error(`layer spec — ${failure.message}`);
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

/** Every coordinate the geocoder has ever returned, as "lon,lat".
 *
 *  Rule 3 says coordinates never come from memory or hand entry, and the only
 *  way to actually enforce that is to require each feature's coordinates to be
 *  a value some recorded lookup produced. Keying on the coordinates rather
 *  than on the feature id matters: an id could be present in the cache while
 *  the geometry beside it was quietly edited afterwards, and several features
 *  in one municipality legitimately share a centroid. */
const geocodeCachePath = join(ROOT, "scripts/geocode-cache.json");
const geocodeCache: Record<string, { lon: number; lat: number }> = existsSync(
  geocodeCachePath,
)
  ? (readJson(geocodeCachePath) as Record<string, { lon: number; lat: number }>)
  : {};

const geocodedPoints = new Set(
  Object.values(geocodeCache).map((entry) => `${entry.lon},${entry.lat}`),
);

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
    const { id, layer: declared, licence } = feature.properties;
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

    const [lon, lat] = feature.geometry.coordinates;
    const key = `${lon},${lat}`;

    // Rule 3, enforced rather than trusted: these coordinates must be a value
    // some recorded geocoder lookup actually returned. This applies at every
    // precision — a municipal centroid typed from memory is exactly the thing
    // the rule exists to stop.
    if (!geocodedPoints.has(key)) {
      error(
        `${label}: coordinates [${lon}, ${lat}] match no entry in ` +
          `scripts/geocode-cache.json. Run \`npm run geocode\` and use the ` +
          `coordinates it returns — never hand-entered or remembered ones.`,
      );
    }

    seenPoints.set(key, [...(seenPoints.get(key) ?? []), label]);
  });
};

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

runFixtures();
runLayerSpecs();
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
