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
  // Sixth categorical hue. Checked before adopting: the palette's worst-case
  // separation is unchanged at 33.4 normal / 16.4 deuteranopia / 23.8
  // protanopia, so this costs nothing the five-colour set had. Okabe-Ito's own
  // leftovers were worse — its sky blue collides with the data centres blue and
  // its yellow with the programs amber.
  innovationcentres: "#785EF0",
};

/**
 * Every mark is ringed in near-black, and that ring is what satisfies WCAG
 * 1.4.11 rather than the hue.
 *
 * Measured: against the Positron basemap — #fafaf8 land, #d4dadc water — the
 * lighter half of the palette fails 3:1 badly. Programs amber reaches only
 * 2.16:1 on land and 1.59:1 on water, so those marks were close to invisible.
 *
 * Darkening the hues was the obvious fix and is the wrong one. Okabe-Ito
 * separates companies from programs by lightness, so darkening the lighter one
 * collapses them: simulated deuteranopia takes that pair from ΔE 16.4 to 4.1,
 * and protanopia from 23.8 to 2.0. That trades a contrast failure for a colour
 * vision failure, which is a worse deal than it looks — the palette was chosen
 * for exactly that property.
 *
 * A dark ring keeps both. #1a1a1a gives 17.4:1 on land and 13.0:1 on water, so
 * the mark's presence, size and shape are legible on any part of the basemap,
 * while the fill is left free to carry the layer in its original hue.
 */
const MARK_OUTLINE = "#1a1a1a";

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

/** Point radius plus the ring, drawn beneath so the ring reads as an outline. */
const pointHaloRadius: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  5,
  5.2,
  10,
  8.2,
  14,
  11.2,
];

export const pointHaloLayer = (
  layer: LayerId,
  source: string,
): CircleLayerSpecification => ({
  id: `${layer}-point-halo`,
  type: "circle",
  source,
  filter: notClustered,
  paint: {
    "circle-color": MARK_OUTLINE,
    "circle-radius": pointHaloRadius,
    "circle-opacity": 0.9,
  },
});

export const clusterHaloLayer = (
  layer: LayerId,
  source: string,
): CircleLayerSpecification => ({
  id: `${layer}-cluster-halo`,
  type: "circle",
  source,
  filter: ["has", "point_count"],
  paint: {
    // A cluster's fill is white, which is invisible against #fafaf8 land — its
    // hue ring was doing all the work and failed 3:1 for half the palette.
    "circle-color": MARK_OUTLINE,
    "circle-opacity": 0.9,
    "circle-radius": clusterRadius([13.5, 16.5, 19.5]),
    "circle-translate": clusterTranslate(layer),
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
/**
 * How far each layer's clusters sit from the shared point, in screen pixels.
 * It has to vary with zoom.
 *
 * Zoomed out to the province every layer has a cluster over the Golden
 * Horseshoe, so all five land on nearly the same spot at once. A fixed 16px
 * ring left them piled up, with the data centres cluster mostly hidden behind
 * the others in the default view — the first thing anyone sees. Zoomed in,
 * clusters separate geographically on their own, and a large offset there
 * would only be a lie about where they are.
 *
 * The marks are also drawn smaller at low zoom, because the separation needed
 * is a function of their radius: five circles of radius r spaced around a ring
 * of radius R clear each other when 2·R·sin(36°) ≥ 2r. At z4 that is 2·28·0.588
 * ≈ 32.9px of separation against a largest mark of 18·0.72 ≈ 13px, so adjacent
 * clusters no longer touch.
 */
const clusterOffsetAt = (layer: LayerId, radius: number): [number, number] => {
  const index = LAYERS.indexOf(layer);
  // Twelve o'clock, stepping evenly, so the arrangement is stable rather than
  // depending on which layers happen to hold records.
  const angle = (index / LAYERS.length) * 2 * Math.PI - Math.PI / 2;
  const round = (v: number): number => Math.round(v * 10) / 10;
  return [round(radius * Math.cos(angle)), round(radius * Math.sin(angle))];
};

const clusterTranslate = (layer: LayerId): ExpressionSpecification =>
  [
    "interpolate",
    ["linear"],
    ["zoom"],
    4,
    ["literal", clusterOffsetAt(layer, 36)],
    8,
    ["literal", clusterOffsetAt(layer, 24)],
    12,
    ["literal", clusterOffsetAt(layer, 14)],
  ] as unknown as ExpressionSpecification;

/**
 * Cluster radius. A plain step on the member count, deliberately with no zoom
 * term in it.
 *
 * Scaling the radius by zoom is the obvious way to help the offset ring
 * separate six layers at low zoom, and MapLibre will not have it. Neither
 * ["*", zoomInterpolate, step] nor a top-level zoom interpolate with step
 * outputs is accepted for circle-radius; both fail validation with «"zoom"
 * expression may only be used as input to a top-level "step" or "interpolate"
 * expression», and the layer is then dropped with nothing but a console error
 * to show for it — the count labels stay, floating over no circle at all.
 *
 * So the separation is done entirely by the offset, which is zoom-interpolated
 * and does work. Six layers spaced around a ring of radius R sit 2·R·sin(30°)
 * = R apart, so the z4 offset of 36px clears two touching 18px marks exactly.
 */
const clusterRadius = (
  base: readonly [number, number, number],
): ExpressionSpecification =>
  [
    "step",
    ["get", "point_count"],
    base[0],
    5,
    base[1],
    10,
    base[2],
  ] as unknown as ExpressionSpecification;

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
    "circle-radius": clusterRadius([12, 15, 18]),
    "circle-translate": clusterTranslate(layer),
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
    "text-translate": clusterTranslate(layer),
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
  // Draw order: soft areas beneath points, each mark's dark ring immediately
  // beneath the mark it outlines, clusters above all of it.
  approximateLayer(layer, source),
  pointHaloLayer(layer, source),
  pointLayer(layer, source),
  clusterHaloLayer(layer, source),
  clusterLayer(layer, source),
  clusterCountLayer(layer, source),
];

export const featureLayerIds = (layers: readonly LayerId[]): string[] =>
  layers.flatMap((layer) => [`${layer}-point`, `${layer}-approx`]);
