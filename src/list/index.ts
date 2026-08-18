/**
 * The table view. Not a fallback — a first-class representation of the same
 * data, always in the DOM, and the keyboard route to every feature.
 *
 * Filterable and sortable, and both are built for the keyboard first. Sorting
 * lives in a real <button> inside each <th>, with aria-sort on the header so
 * the current order is announced rather than merely drawn as an arrow. The
 * filter has a real <label>, and the result count sits in a live region so a
 * screen reader hears "12 of 122" change as the reader types, instead of the
 * table silently shrinking underneath them.
 */

import type { Lang, LayerId } from "../config.ts";
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

type SortKey = "name" | "layer" | "status" | "municipality" | "capacity_mw";
type Direction = "asc" | "desc";

type Column = {
  key: SortKey;
  labelKey: string;
  numeric?: boolean;
};

const COLUMNS: Column[] = [
  { key: "name", labelKey: "table.name" },
  { key: "layer", labelKey: "table.layer" },
  { key: "status", labelKey: "table.status" },
  { key: "municipality", labelKey: "table.municipality" },
  { key: "capacity_mw", labelKey: "table.capacity", numeric: true },
];

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

  /** The text a row sorts and filters on, localised so that what the reader
   *  sees is what they are searching and ordering. */
  const displayed = (feature: MapFeature, key: SortKey): string => {
    const p = feature.properties;
    if (key === "name") return localiseName(p.name, p.name_fr, lang);
    if (key === "layer") return t(`layer.${p.layer as LayerId}`);
    if (key === "status") return t(`status.${p.status}`);
    if (key === "municipality") return p.municipality;
    return p.capacity_mw === null ? "" : String(p.capacity_mw);
  };

  /** Filtering reaches past the visible columns, because a reader looking for
   *  "Bloor" or "Cologix" is searching for the record, not for a column. */
  const haystack = (feature: MapFeature): string => {
    const p = feature.properties;
    return [
      localiseName(p.name, p.name_fr, lang),
      t(`layer.${p.layer as LayerId}`),
      t(`status.${p.status}`),
      p.municipality,
      p.address ?? "",
      p.operator ?? "",
      p.source_name,
    ]
      .join(" ")
      .toLowerCase();
  };

  let query = "";
  let sortKey: SortKey = "name";
  let direction: Direction = "asc";

  const wrapper = document.createElement("div");
  wrapper.className = "table-view";

  // --- toolbar ------------------------------------------------------------

  const toolbar = document.createElement("div");
  toolbar.className = "table-toolbar";

  const field = document.createElement("div");
  field.className = "table-filter";

  const label = document.createElement("label");
  label.className = "visually-hidden";
  label.htmlFor = "table-filter-input";
  label.textContent = t("table.filterLabel");

  const input = document.createElement("input");
  input.type = "search";
  input.id = "table-filter-input";
  input.className = "table-filter-input";
  input.placeholder = t("table.filterPlaceholder");
  input.autocomplete = "off";

  field.append(label, input);

  const count = document.createElement("p");
  count.className = "table-count";
  // Polite, not assertive: the count should follow the reader rather than
  // interrupt them mid-keystroke.
  count.setAttribute("aria-live", "polite");
  count.setAttribute("role", "status");

  toolbar.append(field, count);
  wrapper.append(toolbar);

  // --- table --------------------------------------------------------------

  const table = document.createElement("table");
  table.className = "data-table";

  const caption = document.createElement("caption");
  caption.className = "visually-hidden";
  caption.textContent = t("table.caption");
  table.append(caption);

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  const headerCells = new Map<SortKey, HTMLTableCellElement>();

  for (const column of COLUMNS) {
    const th = document.createElement("th");
    th.setAttribute("scope", "col");
    if (column.numeric) th.className = "numeric";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "sort-button";
    button.textContent = t(column.labelKey);
    button.setAttribute(
      "aria-label",
      `${t("table.sortBy")} ${t(column.labelKey)}`,
    );
    button.addEventListener("click", () => {
      // Same column toggles direction; a new column starts ascending, which is
      // what a reader expects from a first click.
      if (sortKey === column.key) {
        direction = direction === "asc" ? "desc" : "asc";
      } else {
        sortKey = column.key;
        direction = "asc";
      }
      render();
    });

    th.append(button);
    headerCells.set(column.key, th);
    headRow.append(th);
  }

  const sourceTh = document.createElement("th");
  sourceTh.setAttribute("scope", "col");
  sourceTh.textContent = t("table.source");
  headRow.append(sourceTh);

  if (onShowOnMap !== null) {
    const actionTh = document.createElement("th");
    actionTh.setAttribute("scope", "col");
    actionTh.className = "visually-hidden";
    actionTh.textContent = t("table.showOnMap");
    headRow.append(actionTh);
  }

  thead.append(headRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  table.append(tbody);

  // The table scrolls inside its own box rather than the region as a whole,
  // so the filter and its result count stay visible while the reader scrolls
  // the rows they are filtering.
  const scroller = document.createElement("div");
  scroller.className = "table-scroll";
  scroller.append(table);
  wrapper.append(scroller);

  const noMatches = document.createElement("p");
  noMatches.className = "table-no-matches";
  noMatches.textContent = t("table.noMatches");
  noMatches.hidden = true;
  wrapper.append(noMatches);

  // --- rendering ----------------------------------------------------------

  const compare = (a: MapFeature, b: MapFeature): number => {
    const column = COLUMNS.find((c) => c.key === sortKey);
    const factor = direction === "asc" ? 1 : -1;

    if (column?.numeric) {
      const left = a.properties.capacity_mw;
      const right = b.properties.capacity_mw;
      // Records without a value sort last in both directions: an absent
      // capacity is not a small one.
      if (left === null && right === null) return 0;
      if (left === null) return 1;
      if (right === null) return -1;
      return (left - right) * factor;
    }

    return (
      displayed(a, sortKey).localeCompare(displayed(b, sortKey), lang) * factor
    );
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

  const render = (): void => {
    const needle = query.trim().toLowerCase();
    const shown = features
      .filter((f) => needle === "" || haystack(f).includes(needle))
      .sort(compare);

    for (const [key, th] of headerCells) {
      th.setAttribute(
        "aria-sort",
        key !== sortKey ? "none" : direction === "asc" ? "ascending" : "descending",
      );
      th.dataset["sorted"] = key === sortKey ? direction : "";
    }

    count.textContent = t("table.showingCount")
      .replace("{shown}", String(shown.length))
      .replace("{total}", String(features.length));

    noMatches.hidden = shown.length > 0;
    tbody.replaceChildren();

    for (const feature of shown) {
      const p = feature.properties;
      const name = localiseName(p.name, p.name_fr, lang);

      const tr = document.createElement("tr");
      tr.dataset["featureId"] = p.id;

      tr.append(cell("th", name));
      tr.append(cell("td", t(`layer.${p.layer as LayerId}`)));
      tr.append(cell("td", t(`status.${p.status}`)));
      tr.append(cell("td", p.municipality));
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
        // Repeated button text is ambiguous out of context for a screen
        // reader, so name each one after the record it acts on.
        button.setAttribute("aria-label", `${t("table.showOnMap")}: ${name}`);
        button.addEventListener("click", () => onShowOnMap(feature));
        actionCell.append(button);
        tr.append(actionCell);
      }

      tbody.append(tr);
    }
  };

  input.addEventListener("input", () => {
    query = input.value;
    render();
  });

  render();
  return wrapper;
};
