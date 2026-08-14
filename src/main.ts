import "./style.css";

import { readConfig } from "./config.ts";
import { loadLayers } from "./data.ts";
import { createTranslator } from "./i18n/index.ts";
import { renderLegend } from "./legend.ts";
import { renderList } from "./list/index.ts";
import { reportHeightToParent } from "./embed.ts";
import { webglAvailable } from "./webgl.ts";
import type { MapFeature } from "./types.ts";

const requireElement = (id: string): HTMLElement => {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`Missing #${id} in index.html`);
  return element;
};

const notice = (title: string, body: string): HTMLElement => {
  const wrapper = document.createElement("div");
  wrapper.className = "notice";

  const heading = document.createElement("h2");
  heading.textContent = title;

  const paragraph = document.createElement("p");
  paragraph.textContent = body;

  wrapper.append(heading, paragraph);
  return wrapper;
};

const main = async (): Promise<void> => {
  const config = readConfig(window.location.search);
  const t = createTranslator(config.lang);

  // Announce the language to assistive technology before anything renders, and
  // let CSS key French-specific typographic tweaks off it if they are ever
  // needed.
  document.documentElement.lang = config.lang;
  document.title = t("app.title");

  const skipLink = requireElement("skip-link");
  skipLink.textContent = t("app.skipToList");

  const mapContainer = requireElement("map");
  const legendContainer = requireElement("legend");
  const tableContainer = requireElement("table-region");
  tableContainer.setAttribute("aria-label", t("view.list"));

  const hasWebgl = webglAvailable();

  let data;
  try {
    data = await loadLayers(config.layers);
  } catch (cause) {
    console.error("Could not load map data", cause);
    tableContainer.append(notice(t("error.title"), t("error.body")));
    mapContainer.remove();
    return;
  }

  legendContainer.append(renderLegend(config.layers, t));

  let showFeature:
    | ((feature: MapFeature, trigger: HTMLElement | null) => void)
    | null = null;

  if (hasWebgl) {
    // Dynamic: MapLibre is by far the largest thing the page loads, and a
    // browser that cannot use it should never pay for it.
    const { createMap } = await import("./map.ts");
    const controller = createMap({
      container: mapContainer,
      layers: config.layers,
      byLayer: data.byLayer,
      t,
      lang: config.lang,
    });
    showFeature = (feature, trigger) => controller.showFeature(feature, trigger);
  } else {
    // Degrade to the table rather than leaving an empty grey rectangle.
    mapContainer.append(notice(t("nowebgl.title"), t("nowebgl.body")));
    mapContainer.classList.add("map-unavailable");
  }

  tableContainer.append(
    renderList({
      features: data.all,
      t,
      lang: config.lang,
      onShowOnMap:
        showFeature === null
          ? null
          : (feature) => {
              const trigger = document.activeElement;
              showFeature(
                feature,
                trigger instanceof HTMLElement ? trigger : null,
              );
            },
    }),
  );

  // ?focus= runs last: the id may be stale, and a host page pointing at a
  // record that has since been removed should still get a working map.
  if (config.focus !== null && showFeature !== null) {
    const target = data.all.find(
      (feature) => feature.properties.id === config.focus,
    );
    if (target === undefined) {
      console.warn(`?focus=${config.focus} matched no feature`);
    } else {
      showFeature(target, document.body);
    }
  }

  reportHeightToParent();
};

void main();
