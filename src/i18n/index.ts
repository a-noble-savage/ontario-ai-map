/**
 * No hardcoded strings in components — every visible string resolves through
 * `t()`, from the first commit, whether or not French has shipped.
 *
 * Both dictionaries are bundled. They are a few kilobytes, and the embed has
 * no backend to fetch a second one from.
 */

import en from "./en.json";
import fr from "./fr.json";
import type { Lang } from "../config.ts";

const DICTIONARIES: Record<Lang, Record<string, string>> = { en, fr };

export type Translate = (key: string) => string;

export const createTranslator = (lang: Lang): Translate => {
  const dictionary = DICTIONARIES[lang];
  const fallback = DICTIONARIES.en;

  return (key: string): string =>
    // Falling back to the key itself makes a missing string obvious in the UI
    // rather than rendering an empty element that looks like a layout bug.
    dictionary[key] ?? fallback[key] ?? key;
};

/** Feature names carry their own optional French. Everything else is UI copy. */
export const localiseName = (
  name: string,
  nameFr: string | null,
  lang: Lang,
): string => (lang === "fr" && nameFr !== null ? nameFr : name);
