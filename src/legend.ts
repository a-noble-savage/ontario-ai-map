/**
 * The legend carries the part of the encoding that colour cannot: what a solid
 * circle means versus an outlined one, and what a soft area means. Without it
 * the fill distinction is decoration.
 */

import type { LayerId } from "./config.ts";
import type { Translate } from "./i18n/index.ts";
import { LAYER_HUES } from "./layers/index.ts";

const swatch = (className: string, hue: string): HTMLSpanElement => {
  const element = document.createElement("span");
  element.className = `swatch ${className}`;
  element.style.setProperty("--hue", hue);
  // Decorative: the adjacent text is the actual label.
  element.setAttribute("aria-hidden", "true");
  return element;
};

const item = (mark: HTMLElement, label: string): HTMLLIElement => {
  const li = document.createElement("li");
  const text = document.createElement("span");
  text.textContent = label;
  li.append(mark, text);
  return li;
};

export const renderLegend = (
  layers: readonly LayerId[],
  t: Translate,
): HTMLElement => {
  const section = document.createElement("section");
  section.className = "legend";
  section.setAttribute("aria-label", t("legend.title"));

  const layerHeading = document.createElement("h2");
  layerHeading.textContent = t("legend.layers");
  section.append(layerHeading);

  const layerList = document.createElement("ul");
  for (const layer of layers) {
    layerList.append(
      item(swatch("swatch-solid", LAYER_HUES[layer]), t(`layer.${layer}`)),
    );
  }
  section.append(layerList);

  const statusHeading = document.createElement("h2");
  statusHeading.textContent = t("legend.status");
  section.append(statusHeading);

  // Neutral grey, because these three marks describe the shape grammar rather
  // than any one layer's hue.
  const neutral = "#4a4a4a";
  const statusList = document.createElement("ul");
  statusList.append(item(swatch("swatch-solid", neutral), t("legend.solid")));
  statusList.append(item(swatch("swatch-hollow", neutral), t("legend.hollow")));
  statusList.append(item(swatch("swatch-area", neutral), t("legend.area")));

  // The numeral is the whole point of the cluster mark — it is what separates
  // an aggregate from a single outlined feature — so the legend swatch carries
  // one too rather than showing a bare ring.
  const clusterMark = swatch("swatch-cluster", neutral);
  clusterMark.textContent = "3";
  statusList.append(item(clusterMark, t("legend.cluster")));

  section.append(statusList);

  return section;
};
