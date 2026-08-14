/**
 * Per-layer style. Three rules govern everything here:
 *
 *   Layer identity is hue. Status is fill. Status is never hue alone, so the
 *   map survives greyscale printing and the ~8% of men with a colour vision
 *   deficiency. The palette is Okabe–Ito, chosen for exactly that.
 *
 *   A point asserts an address. Features located only to a municipality get a
 *   soft area instead, because a crisp pin would claim precision the record
 *   does not have.
 *
 *   A cluster is an aggregate, and must not read as a feature. Clustering
 *   necessarily mixes statuses — three operating sites and two proposed ones
 *   become one circle — so a cluster carries no status encoding at all. It
 *   carries a number instead, which is the one mark no single feature has.
 */

import type {
  ExpressionSpecification,
  CircleLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";
import { LAYERS, type LayerId } from "../config.ts";

export const LAYER_HUES: Record<LayerId, string> = {
  datacentres: "#0072B2",
  companies: "#D55E00",
  accelerators: "#009E73",
  research: "#CC79A7",
  programs: "#E69F00",
};

/** Built things are filled; claims and endings are outlined. */
export const isBuiltExpression: ExpressionSpecification = [
  "match",
  ["get", "status"],
  ["operating", "active", "under_construction"],
  true,
  false,
];

export const isApproximateExpression: ExpressionSpecification = [
  "match",
  ["get", "location_precision"],
  ["municipality", "region"],
  true,
  false,
];

/** Clustered points are drawn by the cluster layers, not the feature layers. */
const notClustered: ExpressionSpecification = ["!", ["has", "point_count"]];

const pointRadius: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  5,
  4,
  10,
  7,
  14,
  10,
];

/** The soft area is deliberately much larger than a point: it should read as
 *  "somewhere around here", not as a slightly fat pin. */
const areaRadius: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  5,
  10,
  10,
  22,
  14,
  40,
];

export const approximateLayer = (
  layer: LayerId,
  source: string,
): CircleLayerSpecification => ({
  id: `${layer}-approx`,
  type: "circle",
  source,
  filter: ["all", notClustered, isApproximateExpression],
  paint: {
    "circle-color": LAYER_HUES[layer],
    "circle-opacity": 0.14,
    "circle-radius": areaRadius,
    "circle-stroke-color": LAYER_HUES[layer],
    "circle-stroke-opacity": 0.35,
    "circle-stroke-width": 1,
  },
});

export const pointLayer = (
  layer: LayerId,
  source: string,
): CircleLayerSpecification => ({
  id: `${layer}-point`,
  type: "circle",
  source,
  filter: notClustered,
  paint: {
    // Built: hue fill, white keyline. Claim or ended: white fill, hue keyline.
    // The two are distinguishable with no colour information at all.
    "circle-color": ["case", isBuiltExpression, LAYER_HUES[layer], "#ffffff"],
    "circle-stroke-color": [
      "case",
      isBuiltExpression,
      "#ffffff",
      LAYER_HUES[layer],
    ],
    "circle-stroke-width": ["case", isBuiltExpression, 1.5, 2],
    "circle-radius": pointRadius,
    "circle-opacity": 0.95,
    "circle-stroke-opacity": 1,
  },
});

/**
 * Clustering runs per source, so two layers with records in the same
 * municipality produce two clusters on the identical centroid, and whichever
 * layer is drawn last hides the other completely — an entire layer missing
 * from the map with nothing to indicate it.
 *
 * Each layer's clusters are therefore nudged to its own position on a small
 * circle around the shared point. Three properties make this honest:
 *
 *   Only clusters move. Features are never translated, because a feature
 *   marks a place and this would be inventing one.
 *
 *   The offset is in screen pixels, so it is constant at every zoom and never
 *   grows into something that reads as a real distance.
 *
 *   A cluster was already not a location — it is drawn at the average of its
 *   members — so displacing it by a few pixels degrades nothing that was
 *   precise to begin with.
 */
// Has to clear the cluster rings themselves, which run to 18px. Adjacent
// layers sit 2·R·sin(36°) ≈ 19px apart at this value, which puts a neighbour's
// centre just outside the largest ring's edge: they still overlap, but both
// rings read as separate marks.
const CLUSTER_OFFSET_RADIUS = 16;

const clusterOffset = (layer: LayerId): [number, number] => {
  const index = LAYERS.indexOf(layer);
  // Start at twelve o'clock and step evenly, so the arrangement is stable and
  // predictable rather than depending on which layers happen to have records.
  const angle = (index / LAYERS.length) * 2 * Math.PI - Math.PI / 2;
  const round = (value: number): number => Math.round(value * 10) / 10;
  return [
    round(CLUSTER_OFFSET_RADIUS * Math.cos(angle)),
    round(CLUSTER_OFFSET_RADIUS * Math.sin(angle)),
  ];
};

export const clusterLayer = (
  layer: LayerId,
  source: string,
): CircleLayerSpecification => ({
  id: `${layer}-cluster`,
  type: "circle",
  source,
  filter: ["has", "point_count"],
  paint: {
    // White fill with a heavy hue ring. The ring is thicker than any feature's
    // keyline and the circle is larger, but the count label inside is what
    // makes a cluster unmistakably an aggregate rather than one record.
    "circle-color": "#ffffff",
    "circle-opacity": 0.95,
    "circle-stroke-color": LAYER_HUES[layer],
    "circle-stroke-width": 3,
    "circle-radius": ["step", ["get", "point_count"], 12, 5, 15, 10, 18],
    "circle-translate": clusterOffset(layer),
  },
});

export const clusterCountLayer = (
  layer: LayerId,
  source: string,
): SymbolLayerSpecification => ({
  id: `${layer}-cluster-count`,
  type: "symbol",
  source,
  filter: ["has", "point_count"],
  layout: {
    "text-field": ["get", "point_count_abbreviated"],
    // Both are used by the CARTO Positron style itself, so the glyphs are
    // guaranteed to be served by its font endpoint.
    "text-font": ["Open Sans Bold", "Noto Sans Regular"],
    "text-size": 12,
    "text-allow-overlap": true,
    "text-ignore-placement": true,
  },
  paint: {
    // Near-black on white clears 4.5:1 for every layer hue. White-on-hue does
    // not: at #E69F00 it lands near 2:1, which would fail AA outright.
    "text-color": "#1a1a1a",
    "text-halo-color": "#ffffff",
    "text-halo-width": 1,
    // Must match the ring exactly, or the count drifts out of its own circle.
    "text-translate": clusterOffset(layer),
  },
});

/**
 * Clustering thresholds.
 *
 * `clusterMaxZoom` is deliberately high. Most of this data sits on municipal
 * centroids, so features in one municipality share a coordinate *exactly* and
 * no amount of zooming will ever separate them. Un-clustering them early
 * would just stack them invisibly on top of one another and hand the reader a
 * single pin standing in for five records. Keeping them grouped means the
 * count stays visible, and clicking opens the full list.
 */
export const CLUSTER_MAX_ZOOM = 13;
export const CLUSTER_RADIUS = 44;

export const layerSpecs = (
  layer: LayerId,
  source: string,
): (CircleLayerSpecification | SymbolLayerSpecification)[] => [
  // Draw order: soft areas beneath points, clusters above both.
  approximateLayer(layer, source),
  pointLayer(layer, source),
  clusterLayer(layer, source),
  clusterCountLayer(layer, source),
];

export const featureLayerIds = (layers: readonly LayerId[]): string[] =>
  layers.flatMap((layer) => [`${layer}-point`, `${layer}-approx`]);
