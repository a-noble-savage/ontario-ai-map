/**
 * MapLibre setup.
 *
 * The basemap is CARTO Positron: keyless, already near-grey, and served over a
 * plain URL with no account behind it. That last part is the requirement that
 * ruled out the alternatives — the embed has to keep working on a page nobody
 * maintains, and an API key is a thing that expires or gets revoked.
 */

// This module is loaded dynamically from main.ts, and pulls MapLibre and its
// stylesheet into a separate chunk with it. Nothing here is reachable until
// the WebGL check has already passed.
import maplibregl, {
  type Map as MapLibreMap,
  type GeoJSONSource,
  type MapLayerMouseEvent,
  Popup,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { Lang, LayerId } from "./config.ts";
import type { Translate } from "./i18n/index.ts";
import {
  layerSpecs,
  featureLayerIds,
  CLUSTER_MAX_ZOOM,
  CLUSTER_RADIUS,
} from "./layers/index.ts";
import { buildPopup, buildClusterPopup } from "./popup.ts";
import type { FeatureCollection, MapFeature, FeatureProperties } from "./types.ts";

const BASEMAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

/** Ontario, comfortably. Matches the bounds the schema enforces. */
const ONTARIO_BOUNDS: [[number, number], [number, number]] = [
  [-95.2, 41.6],
  [-74.3, 56.9],
];

const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export type MapController = {
  showFeature: (feature: MapFeature, trigger: HTMLElement | null) => void;
};

export type MapOptions = {
  container: HTMLElement;
  layers: readonly LayerId[];
  byLayer: Map<LayerId, FeatureCollection>;
  t: Translate;
  lang: Lang;
};

export const createMap = (options: MapOptions): MapController => {
  const { container, layers, byLayer, t, lang } = options;

  const map = new maplibregl.Map({
    container,
    style: BASEMAP_STYLE,
    bounds: ONTARIO_BOUNDS,
    fitBoundsOptions: { padding: 24 },
    attributionControl: { compact: false },
  });

  // MapLibre measures its container once, at construction. That measurement is
  // unreliable here for two reasons: the container is sized by aspect-ratio,
  // and MapLibre's own stylesheet arrives with this dynamically imported
  // chunk. Watching the container covers both, and is required regardless —
  // the host page can resize the iframe at any time.
  //
  // The constructor's fitBounds used that same bad measurement, so the initial
  // framing has to be redone once the container is really sized. Exactly once:
  // re-framing on every resize would throw away wherever the reader has panned
  // to whenever the host page reflows.
  let framed = false;

  const resizeObserver = new ResizeObserver(() => {
    map.resize();
    if (framed || container.clientWidth === 0 || container.clientHeight === 0) {
      return;
    }
    framed = true;
    map.fitBounds(ONTARIO_BOUNDS, { padding: 24, animate: false });
  });
  resizeObserver.observe(container);

  map.addControl(
    new maplibregl.NavigationControl({ showCompass: false }),
    "top-right",
  );

  // The canvas is the keyboard target for pan and zoom. Feature traversal is
  // the table's job, so the canvas gets a name but not a feature-by-feature
  // tab sequence that would trap the reader in a list of circles.
  //
  // MapLibre puts the canvas in the tab order and handles arrow keys and
  // +/- itself, so the role has to match that behaviour: "application" tells
  // assistive technology to pass keystrokes through. Labelling something
  // focusable and interactive as an image would announce it as a static
  // picture and leave a screen reader user with no idea the keys do anything.
  const canvas = map.getCanvas();
  canvas.setAttribute("role", "application");
  canvas.setAttribute("aria-label", t("app.title"));

  // A role alone does not say which keys work. Spell it out, and point at the
  // table so the reader knows an easier route to the same records exists.
  const instructions = document.createElement("p");
  instructions.id = "map-instructions";
  instructions.className = "visually-hidden";
  instructions.textContent = t("map.instructions");
  container.append(instructions);
  canvas.setAttribute("aria-describedby", instructions.id);

  const popup = new Popup({
    closeButton: true,
    closeOnClick: true,
    maxWidth: "22rem",
    focusAfterOpen: false,
  });

  /** The element that opened the current popup, so Esc can hand focus back
   *  rather than dropping it to the top of the document. */
  let lastTrigger: HTMLElement | null = null;

  const openPopup = (
    coordinates: [number, number],
    properties: FeatureProperties,
    trigger: HTMLElement | null,
  ): void => {
    lastTrigger = trigger;
    popup
      .setLngLat(coordinates)
      .setDOMContent(buildPopup(properties, t, lang))
      .addTo(map);
  };

  popup.on("close", () => {
    lastTrigger?.focus();
    lastTrigger = null;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && popup.isOpen()) {
      event.stopPropagation();
      popup.remove();
    }
  });

  /**
   * Sources and layers go in as soon as the *style* is ready.
   *
   * Deliberately not on "load". That event waits for the style **and** the
   * map's first render, which ties data setup to the render loop for no good
   * reason: a browser that throttles animation frames — a background tab, an
   * iframe scrolled out of view, which is exactly how this thing gets
   * embedded — may never produce that first frame, and "load" then never
   * fires. The result is a basemap with no data on it and no error anywhere.
   * "styledata" with an isStyleLoaded guard depends only on the style being
   * ready, which is the actual precondition for addSource and addLayer.
   */
  let layersAdded = false;

  const addDataLayers = (): void => {
    if (layersAdded) return;

    // `isStyleLoaded()` is the obvious guard and the wrong one: it also waits
    // for every source's tiles, so it stays false long after the style spec
    // is parsed and ready to accept layers. There is no public predicate for
    // "spec parsed but tiles still arriving", so attempt the work and treat a
    // throw as "not yet". Each add is idempotent, so a retry cannot duplicate
    // anything it already managed on an earlier attempt.
    try {
      for (const layer of layers) {
        const collection = byLayer.get(layer);
        if (collection === undefined) continue;

        const sourceId = `src-${layer}`;
        if (map.getSource(sourceId) === undefined) {
          map.addSource(sourceId, {
            type: "geojson",
            data: collection,
            cluster: true,
            clusterRadius: CLUSTER_RADIUS,
            clusterMaxZoom: CLUSTER_MAX_ZOOM,
          });
        }

        for (const spec of layerSpecs(layer, sourceId)) {
          if (map.getLayer(spec.id) === undefined) map.addLayer(spec);
        }
      }
    } catch {
      return;
    }

    layersAdded = true;

    // Lets a cluster's member list open the record it names.
    const featuresById = new Map<string, MapFeature>();
    for (const collection of byLayer.values()) {
      for (const feature of collection.features) {
        featuresById.set(feature.properties.id, feature);
      }
    }

    const trackCursor = (layerId: string): void => {
      map.on("mouseenter", layerId, () => {
        canvas.style.cursor = "pointer";
      });
      map.on("mouseleave", layerId, () => {
        canvas.style.cursor = "";
      });
    };

    for (const layerId of featureLayerIds(layers)) {
      if (map.getLayer(layerId) === undefined) continue;

      map.on("click", layerId, (event) => {
        const hit = event.features?.[0];
        if (hit === undefined) return;
        // GeoJSON sources hand properties back as a flat record; the schema
        // guarantees the shape, so the assertion is safe here.
        openPopup(
          [event.lngLat.lng, event.lngLat.lat],
          hit.properties as unknown as FeatureProperties,
          null,
        );
      });

      trackCursor(layerId);
    }

    /**
     * Clicking a cluster does one of two things, and which one depends on
     * whether zooming would actually help.
     *
     * Most of this data sits on municipal centroids, so a cluster's members
     * frequently share one coordinate exactly. Zooming those apart is
     * impossible, and a map that responds to a click by zooming and changing
     * nothing is a map that looks broken. In that case list the members
     * instead, and let the reader open any of them.
     */
    const handleClusterClick = async (
      sourceId: string,
      event: MapLayerMouseEvent,
    ): Promise<void> => {
      const hit = event.features?.[0];
      if (hit === undefined) return;

      const clusterId = hit.properties?.["cluster_id"] as number | undefined;
      const pointCount = hit.properties?.["point_count"] as number | undefined;
      if (clusterId === undefined || pointCount === undefined) return;

      const source = map.getSource(sourceId) as GeoJSONSource | undefined;
      if (source === undefined) return;

      framed = true;

      const leaves = await source.getClusterLeaves(clusterId, pointCount, 0);

      const positions = new Set(
        leaves.map((leaf) =>
          leaf.geometry.type === "Point"
            ? `${leaf.geometry.coordinates[0]},${leaf.geometry.coordinates[1]}`
            : "",
        ),
      );

      const center: [number, number] = [event.lngLat.lng, event.lngLat.lat];

      if (positions.size > 1) {
        const zoom = await source.getClusterExpansionZoom(clusterId);
        if (prefersReducedMotion()) map.jumpTo({ center, zoom });
        else map.easeTo({ center, zoom });
        return;
      }

      const members = leaves.map(
        (leaf) => leaf.properties as unknown as FeatureProperties,
      );

      lastTrigger = null;
      popup
        .setLngLat(center)
        .setDOMContent(
          buildClusterPopup(members, true, t, lang, (id) => {
            const feature = featuresById.get(id);
            if (feature !== undefined) showFeature(feature, null);
          }),
        )
        .addTo(map);
    };

    for (const layer of layers) {
      const clusterLayerId = `${layer}-cluster`;
      if (map.getLayer(clusterLayerId) === undefined) continue;

      map.on("click", clusterLayerId, (event) => {
        void handleClusterClick(`src-${layer}`, event);
      });

      trackCursor(clusterLayerId);
      trackCursor(`${layer}-cluster-count`);
    }
  };

  // Several chances to succeed, none of which require a rendered frame. The
  // immediate call covers a style that was ready before we got here.
  map.on("styledata", addDataLayers);
  map.on("sourcedata", addDataLayers);
  map.on("idle", addDataLayers);
  addDataLayers();

  const showFeature = (
    feature: MapFeature,
    trigger: HTMLElement | null,
  ): void => {
    // A pending initial fit would otherwise land after this and yank the view
    // back to the province — most visibly on a `?focus=` load, where the
    // observer has not necessarily fired yet.
    framed = true;

    const coordinates = feature.geometry.coordinates;
    const target = { center: coordinates, zoom: Math.max(map.getZoom(), 9) };

    // Motion only where it aids orientation, and not at all when the reader
    // has asked for less of it.
    if (prefersReducedMotion()) {
      map.jumpTo(target);
    } else {
      map.flyTo({ ...target, speed: 1.2 });
    }

    openPopup(coordinates, feature.properties, trigger);
  };

  return { showFeature };
};

export type { MapLibreMap };
