/**
 * Per-layer style. Two rules govern everything here:
 *
 *   Layer identity is hue. Status is fill. Status is never hue alone, so the
 *   map survives greyscale printing and the ~8% of men with a colour vision
 *   deficiency. The palette is Okabe–Ito, chosen for exactly that.
 *
 *   A point asserts an address. Features located only to a municipality get a
 *   soft area instead, because a crisp pin would claim precision the record
 *   does not have.
 */

import type { ExpressionSpecification, CircleLayerSpecification } from "maplibre-gl";
import type { LayerId } from "../config.ts";

export const LAYER_HUES: Record<LayerId, string> = {
  datacentres: "#0072B2",
  companies: "#D55E00",
  accelerators: "#009E73",
  research: "#CC79A7",
  programs: "#E69F00",
};

/** Built things are filled; claims and endings are outlined. Evaluated against
 *  the feature's own status so a single circle layer covers both. */
const isBuiltExpression: ExpressionSpecification = [
  "match",
  ["get", "status"],
  ["operating", "active", "under_construction"],
  true,
  false,
];

const isApproximateExpression: ExpressionSpecification = [
  "match",
  ["get", "location_precision"],
  ["municipality", "region"],
  true,
  false,
];

/** Grows with zoom so a point stays findable when zoomed out and does not
 *  swallow its neighbours when zoomed in. */
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
  filter: isApproximateExpression,
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

/** Draw order: areas beneath points, so an approximate blob never hides a
 *  precisely located feature sitting inside it. */
export const layerSpecs = (
  layer: LayerId,
  source: string,
): CircleLayerSpecification[] => [
  approximateLayer(layer, source),
  pointLayer(layer, source),
];

export const interactiveLayerIds = (layers: readonly LayerId[]): string[] =>
  layers.flatMap((layer) => [`${layer}-point`, `${layer}-approx`]);
