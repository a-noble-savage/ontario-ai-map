/**
 * Popup contents. Built as DOM nodes rather than an HTML string: every value
 * here originates in a data file transcribed from a source, and `textContent`
 * removes the whole class of questions about what is in `notes`.
 *
 * Provenance is not optional chrome. Source and retrieval date are always
 * rendered, because a record the reader cannot check is a record they have to
 * take on faith.
 */

import type { Translate } from "./i18n/index.ts";
import { localiseName } from "./i18n/index.ts";
import type { Lang } from "./config.ts";
import type { FeatureProperties } from "./types.ts";
import { isClaim, isPrecise } from "./types.ts";

const row = (label: string, value: string): HTMLDivElement => {
  const wrapper = document.createElement("div");
  wrapper.className = "popup-row";

  const term = document.createElement("span");
  term.className = "popup-label";
  term.textContent = label;

  const detail = document.createElement("span");
  detail.className = "popup-value";
  detail.textContent = value;

  wrapper.append(term, detail);
  return wrapper;
};

const caveat = (text: string): HTMLParagraphElement => {
  const element = document.createElement("p");
  element.className = "popup-caveat";
  element.textContent = text;
  return element;
};

/**
 * Contents for a cluster the reader clicked.
 *
 * Clustering is the only place this map hides a record, so this popup exists
 * to make that reversible: every member is listed by name and can be opened.
 * Where the members share one municipal centroid — which most of them do —
 * zooming will never separate them, and the popup says so rather than leaving
 * the reader to discover it by scrolling the wheel.
 */
export const buildClusterPopup = (
  members: readonly FeatureProperties[],
  sharesOnePoint: boolean,
  t: Translate,
  lang: Lang,
  onSelect: (id: string) => void,
): HTMLElement => {
  const container = document.createElement("div");
  container.className = "popup";

  const heading = document.createElement("h2");
  heading.className = "popup-title";
  heading.textContent = `${members.length} · ${t("cluster.heading")}`;
  container.append(heading);

  if (sharesOnePoint) {
    container.append(caveat(t("cluster.sharedPoint")));
  }

  const list = document.createElement("ul");
  list.className = "cluster-list";

  for (const member of members) {
    const item = document.createElement("li");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "cluster-item";
    button.textContent = localiseName(member.name, member.name_fr, lang);
    button.addEventListener("click", () => onSelect(member.id));

    const status = document.createElement("span");
    status.className = "cluster-item-status";
    status.textContent = t(`status.${member.status}`);

    item.append(button, status);
    list.append(item);
  }

  container.append(list);
  return container;
};

export const buildPopup = (
  properties: FeatureProperties,
  t: Translate,
  lang: Lang,
): HTMLElement => {
  const container = document.createElement("div");
  container.className = "popup";

  const heading = document.createElement("h2");
  heading.className = "popup-title";
  heading.textContent = localiseName(properties.name, properties.name_fr, lang);
  container.append(heading);

  const layerLine = document.createElement("p");
  layerLine.className = "popup-layer";
  layerLine.textContent = `${t(`layer.${properties.layer}`)} · ${t(
    `status.${properties.status}`,
  )}`;
  container.append(layerLine);

  // Rule 5: an announcement is a claim about the future. Say so before the
  // reader reads the rest as established fact.
  if (isClaim(properties.status)) {
    container.append(caveat(t("popup.claimCaveat")));
  }

  const details = document.createElement("div");
  details.className = "popup-details";

  if (properties.address !== null) {
    details.append(row(t("popup.address"), properties.address));
  }

  details.append(row(t("popup.municipality"), properties.municipality));

  if (properties.operator !== null) {
    details.append(row(t("popup.operator"), properties.operator));
  }

  if (properties.capacity_mw !== null) {
    details.append(
      row(
        t("popup.capacity"),
        `${properties.capacity_mw} ${t("popup.capacityUnit")}`,
      ),
    );
  }

  details.append(
    row(
      t("popup.precision"),
      t(`precision.${properties.location_precision}`),
    ),
  );

  container.append(details);

  // Rule 2: a centroid must never be mistaken for an address, in the popup as
  // well as in the rendering.
  if (!isPrecise(properties.location_precision)) {
    container.append(caveat(t("popup.approximateCaveat")));
  }

  if (properties.notes !== null) {
    const notes = document.createElement("p");
    notes.className = "popup-notes";
    notes.textContent = properties.notes;
    container.append(notes);
  }

  const provenance = document.createElement("div");
  provenance.className = "popup-provenance";

  const sourceRow = document.createElement("div");
  sourceRow.className = "popup-row";

  const sourceLabel = document.createElement("span");
  sourceLabel.className = "popup-label";
  sourceLabel.textContent = t("popup.source");

  const link = document.createElement("a");
  link.className = "popup-value";
  link.href = properties.source_url;
  link.textContent = properties.source_name;
  // The embed sits in someone else's page; never hand the opener over with it.
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  sourceRow.append(sourceLabel, link);
  provenance.append(sourceRow);
  provenance.append(row(t("popup.retrieved"), properties.retrieved));
  provenance.append(row(t("popup.licence"), properties.licence));

  container.append(provenance);
  return container;
};
