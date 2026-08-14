/**
 * The table view. Not a fallback — a first-class representation of the same
 * data, always in the DOM, and the keyboard route to every feature.
 *
 * The map canvas handles pan and zoom from the keyboard; feature traversal
 * happens here, where each record is a real focusable element with a real
 * accessible name instead of a coloured circle on a canvas.
 */

import type { Lang } from "../config.ts";
import type { Translate } from "../i18n/index.ts";
import { localiseName } from "../i18n/index.ts";
import type { MapFeature } from "../types.ts";

export type ListOptions = {
  features: readonly MapFeature[];
  t: Translate;
  lang: Lang;
  /** Invoked when a row's button is activated. Null when there is no map to
   *  show the feature on, in which case the button is omitted rather than
   *  rendered inert. */
  onShowOnMap: ((feature: MapFeature) => void) | null;
};

const cell = (
  tag: "td" | "th",
  text: string,
  className?: string,
): HTMLTableCellElement => {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className !== undefined) element.className = className;
  if (tag === "th") element.setAttribute("scope", "row");
  return element;
};

const emptyState = (t: Translate): HTMLElement => {
  const wrapper = document.createElement("div");
  wrapper.className = "empty-state";

  const heading = document.createElement("h2");
  heading.textContent = t("empty.title");

  const body = document.createElement("p");
  body.textContent = t("empty.body");

  wrapper.append(heading, body);
  return wrapper;
};

export const renderList = (options: ListOptions): HTMLElement => {
  const { features, t, lang, onShowOnMap } = options;

  if (features.length === 0) return emptyState(t);

  const table = document.createElement("table");
  table.className = "data-table";

  const caption = document.createElement("caption");
  caption.textContent = t("table.caption");
  table.append(caption);

  const headings = [
    t("table.name"),
    t("table.layer"),
    t("table.status"),
    t("table.municipality"),
    t("table.capacity"),
    t("table.source"),
  ];

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const heading of headings) {
    const th = document.createElement("th");
    th.setAttribute("scope", "col");
    th.textContent = heading;
    headRow.append(th);
  }
  if (onShowOnMap !== null) {
    const th = document.createElement("th");
    th.setAttribute("scope", "col");
    // The column of buttons needs a programmatic name but no visible header.
    th.className = "visually-hidden";
    th.textContent = t("table.showOnMap");
    headRow.append(th);
  }
  thead.append(headRow);
  table.append(thead);

  const tbody = document.createElement("tbody");

  for (const feature of features) {
    const p = feature.properties;
    const name = localiseName(p.name, p.name_fr, lang);

    const tr = document.createElement("tr");
    tr.dataset["featureId"] = p.id;

    tr.append(cell("th", name));
    tr.append(cell("td", t(`layer.${p.layer}`)));
    tr.append(cell("td", t(`status.${p.status}`)));
    tr.append(cell("td", p.municipality));
    // Tabular figures come from the stylesheet; an em dash reads better than a
    // blank cell for a value that is genuinely not applicable.
    tr.append(
      cell("td", p.capacity_mw === null ? "—" : String(p.capacity_mw), "numeric"),
    );

    const sourceCell = document.createElement("td");
    const link = document.createElement("a");
    link.href = p.source_url;
    link.textContent = p.source_name;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    sourceCell.append(link);
    tr.append(sourceCell);

    if (onShowOnMap !== null) {
      const actionCell = document.createElement("td");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "row-action";
      button.textContent = t("table.showOnMap");
      // Repeated button text is ambiguous out of context for a screen reader,
      // so name each one after the record it acts on.
      button.setAttribute("aria-label", `${t("table.showOnMap")}: ${name}`);
      button.addEventListener("click", () => onShowOnMap(feature));
      actionCell.append(button);
      tr.append(actionCell);
    }

    tbody.append(tr);
  }

  table.append(tbody);
  return table;
};
