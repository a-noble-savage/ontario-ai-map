/** Mirrors schema/feature.schema.json. The schema is the authority; if these
 *  disagree, the schema is right and this file is stale. */

import type { LayerId } from "./config.ts";

export type LocationPrecision = "rooftop" | "street" | "municipality" | "region";

export type Status =
  | "operating"
  | "under_construction"
  | "announced"
  | "proposed"
  | "cancelled"
  | "active"
  | "closed";

export type FeatureProperties = {
  id: string;
  name: string;
  name_fr: string | null;
  layer: LayerId;
  status: Status;
  operator: string | null;
  municipality: string;
  capacity_mw: number | null;
  location_precision: LocationPrecision;
  source_name: string;
  source_url: string;
  retrieved: string;
  licence: string;
  notes: string | null;
};

export type MapFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: FeatureProperties;
};

export type FeatureCollection = {
  type: "FeatureCollection";
  name: string;
  features: MapFeature[];
};

/** Precisions that mark a real address rather than a stand-in centroid. */
const PRECISE: ReadonlySet<LocationPrecision> = new Set(["rooftop", "street"]);

export const isPrecise = (precision: LocationPrecision): boolean =>
  PRECISE.has(precision);

/** Statuses describing something that physically exists. Everything else is
 *  either a claim about the future or a record of something ended — both get
 *  an outlined treatment so the map never asserts more than the data does. */
const BUILT: ReadonlySet<Status> = new Set([
  "operating",
  "active",
  "under_construction",
]);

export const isBuilt = (status: Status): boolean => BUILT.has(status);

/** Rule 5: announced and proposed sites are claims, not facts, and say so in
 *  plain language in the popup. */
const CLAIM: ReadonlySet<Status> = new Set(["announced", "proposed"]);

export const isClaim = (status: Status): boolean => CLAIM.has(status);
