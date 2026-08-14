/**
 * Data loading. These are static files served from the same origin as the
 * embed — not an API. The built site is files, and a data correction is a
 * commit, not a deploy of anything with a runtime.
 */

import type { LayerId } from "./config.ts";
import type { FeatureCollection, MapFeature } from "./types.ts";

/** Respects Vite's base so the embed survives being served from a subpath. */
const dataUrl = (layer: LayerId): string =>
  `${import.meta.env.BASE_URL}data/${layer}.geojson`;

const emptyCollection = (layer: LayerId): FeatureCollection => ({
  type: "FeatureCollection",
  name: layer,
  features: [],
});

const loadLayer = async (layer: LayerId): Promise<FeatureCollection> => {
  const response = await fetch(dataUrl(layer));
  if (!response.ok) {
    throw new Error(`${layer}: HTTP ${response.status}`);
  }

  const parsed = (await response.json()) as FeatureCollection;
  if (parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
    throw new Error(`${layer}: not a FeatureCollection`);
  }
  return parsed;
};

export type LoadedData = {
  byLayer: Map<LayerId, FeatureCollection>;
  /** Every feature across every requested layer, in canonical layer order.
   *  This is what the table renders and what ?focus= is resolved against. */
  all: MapFeature[];
};

export const loadLayers = async (
  layers: readonly LayerId[],
): Promise<LoadedData> => {
  const collections = await Promise.all(
    layers.map(async (layer) => {
      try {
        return [layer, await loadLayer(layer)] as const;
      } catch (cause) {
        // One missing layer should not blank the whole map. Log it and carry
        // on with an empty collection so the other layers still render.
        console.error(`Could not load layer "${layer}"`, cause);
        return [layer, emptyCollection(layer)] as const;
      }
    }),
  );

  const byLayer = new Map<LayerId, FeatureCollection>(collections);
  const all = collections.flatMap(([, collection]) => collection.features);

  return { byLayer, all };
};
