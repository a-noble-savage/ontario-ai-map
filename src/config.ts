/**
 * The URL is the API. Everything in here is a published interface — once the
 * embed is live on a page nobody maintains, these parameter names cannot
 * change without breaking it.
 *
 * Parsing is deliberately forgiving. A host page will typo a layer name or
 * pass a stale feature id, and the right response is to render the rest of
 * the map rather than fail closed on someone else's page.
 */

export const LAYERS = [
  "datacentres",
  "companies",
  "accelerators",
  "research",
  "programs",
  "innovationcentres",
] as const;

export type LayerId = (typeof LAYERS)[number];

export const LANGS = ["en", "fr"] as const;
export type Lang = (typeof LANGS)[number];

export type Config = {
  layers: LayerId[];
  focus: string | null;
  lang: Lang;
};

const isLayerId = (value: string): value is LayerId =>
  (LAYERS as readonly string[]).includes(value);

const isLang = (value: string): value is Lang =>
  (LANGS as readonly string[]).includes(value);

/** `?layers=datacentres,research` — unknown names are dropped. An empty or
 *  entirely unrecognised list falls back to every layer, because showing
 *  everything is a better failure than showing nothing. */
const readLayers = (raw: string | null): LayerId[] => {
  if (raw === null) return [...LAYERS];

  const requested = raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(isLayerId);

  // Deduplicate while keeping the canonical layer order, so draw order and
  // legend order do not depend on how the host wrote the parameter.
  const wanted = new Set(requested);
  const resolved = LAYERS.filter((layer) => wanted.has(layer));

  return resolved.length > 0 ? resolved : [...LAYERS];
};

/** `?focus=<feature id>` — validated for shape only. Whether the id exists is
 *  not knowable until the data loads, and a stale id must not break the map. */
const readFocus = (raw: string | null): string | null => {
  if (raw === null) return null;
  const trimmed = raw.trim();
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmed) ? trimmed : null;
};

const readLang = (raw: string | null): Lang => {
  if (raw !== null) {
    const requested = raw.trim().toLowerCase();
    if (isLang(requested)) return requested;
  }
  // No explicit parameter: follow the host page, which in a bilingual Ontario
  // context is usually right, and default to English otherwise.
  const documentLang = document.documentElement.lang.slice(0, 2).toLowerCase();
  return isLang(documentLang) ? documentLang : "en";
};

export const readConfig = (search: string): Config => {
  const params = new URLSearchParams(search);
  return {
    layers: readLayers(params.get("layers")),
    focus: readFocus(params.get("focus")),
    lang: readLang(params.get("lang")),
  };
};
