# Ontario AI Map

An embeddable map of AI-related activity in Ontario: data centres, companies,
accelerators, research institutes, and academic programs. Ships as a static
site designed to be dropped into a third-party page via `<iframe>`.

## Scope

**v1 is the map only.** A chart panel (Vector Institute time series, StatCan
adoption rates, AI Index indicators) is planned but explicitly out of scope.
Keep the data layer and the render layer separable so charts can be added
without a rewrite.

**Non-goals for v1:**

- No charts, no time series, no year slider.
- No backend, no database, no runtime API calls. The built site is files.
- No accounts, no analytics, no cookies, no `localStorage`.
- Not a national map. Ontario is the frame; national or global figures are
  future context for the chart panel, not map features.

## Stack

- Vite + TypeScript. No UI framework — this is one screen and a bundle budget.
- MapLibre GL JS for rendering.
- Basemap: keyless vector style (see Open decisions). **Never** a service that
  requires an API key or a billing account — the embed has to survive being
  copied onto a page nobody maintains.
- npm. Deployed as static files to Cloudflare Pages.

Budget: ≤300KB gzipped JS, counting every chunk the map needs to run. Ask
before adding any dependency.

The number is mostly MapLibre: 276KB gzipped on its own. The original 250KB
budget was unreachable with the renderer this document mandates, and was
raised once that was measured rather than assumed. MapLibre is behind a
dynamic import, so the initial payload is ~5KB and the map chunk is fetched
only after the WebGL check passes — a browser that gets the table view never
downloads the renderer. Headroom against the ceiling is roughly 9KB, so the
next dependency is very likely the one that breaks it.

## Repo layout

```
data/            one GeoJSON FeatureCollection per layer, hand-maintained
  datacentres.geojson
  companies.geojson
  accelerators.geojson
  research.geojson
  programs.geojson
schema/          JSON Schema for a feature; validated in CI
scripts/         geocoding, validation, source-diff helpers
  geocode-cache.json
src/
  layers/        per-layer style + popup config
  i18n/          en.json, fr.json
  list/          accessible table view of the same data
public/
docs/sources.md  one entry per source: licence, terms, last check, contact
```

## Data model

Every feature carries these properties. The schema is enforced by
`npm run validate`, which runs in CI and must pass before commit.

| Field | Notes |
| --- | --- |
| `id` | stable slug, never reused after deletion |
| `name` | as the source writes it |
| `name_fr` | optional |
| `layer` | one of the five layer names |
| `status` | data centres: `operating` / `under_construction` / `announced` / `proposed` / `cancelled`. Others: `active` / `closed` |
| `operator` | nullable |
| `address` | nullable; **must be non-null** when `location_precision` is `rooftop` or `street` |
| `municipality` | |
| `capacity_mw` | nullable number; data centres only |
| `location_precision` | `rooftop` / `street` / `municipality` / `region` |
| `source_name` | |
| `source_url` | |
| `retrieved` | ISO date |
| `licence` | how this record may be republished |
| `notes` | nullable, shown in the popup |

## Data rules

These are the rules that matter most. A wrong pin on a public map is worse
than a missing one.

1. **Provenance is mandatory.** No feature ships without `source_url` and
   `retrieved`. The popup displays both.
2. **Never invent coordinates.** If only a municipality is known, use the
   municipal centroid and set `location_precision: municipality`. The map
   renders imprecise points differently (see Visual direction) so a
   centroid is never mistaken for an address.
3. **Never geocode from model knowledge.** Geocoding runs through
   `scripts/geocode.ts` and writes to `geocode-cache.json` with the geocoder
   name and date. If a lookup fails, leave the feature out and flag it —
   don't guess. `npm run validate` enforces this: every feature's coordinates
   must match a value some recorded lookup returned, at *every* precision, so
   a hand-typed municipal centroid fails the build like anything else.
4. **Licence gate before a source is added.** Check terms, record the finding
   in `docs/sources.md`, and ask before scraping anything. **`docs/sources.md`
   is the authority**; the summary below goes stale. Standing as of 2026-08-14:
   - `wiki.gccollab.ca` — **cleared** by an actual licence grant, CC BY 4.0,
     attribution required. Start here.
   - `ontariodatacentres.ca` — *cleared by project decision, 2026-08-14*. It
     asserts copyright and grants no licence; the decision accepts that risk
     rather than resolving it. Still prefer the primary document it cites
     (municipal planning records, IESO filings) wherever one exists.
   - `canada.ai/directory` — *cleared by project decision, 2026-08-14*, but
     **unusable in practice**: surveyed the same day and none of its 571
     entries carries a location, so it cannot place a pin. The companies
     layer needs a different source. See `docs/sources.md`.
   - `datacentermap.com`, `baxtel.com`, `datacenters.com` — commercial
     products. Use for cross-checking a fact, never as a source of records.

   Absence of a licence is never permission, so record a decision to proceed
   without one *as a decision* — `docs/sources.md` keeps standings and findings
   apart precisely so nobody later mistakes one for the other. Note this
   restricts republishing a source's *compilation*, not the underlying facts,
   so the primary document behind a record remains both the safer route and the
   better one.
5. **Proposed sites are claims, not facts.** Announced and proposed data
   centres get a visually distinct treatment and a plain-language caveat in
   the popup. Prefer municipal planning documents or IESO filings over press
   releases.
6. **Conflicts get surfaced, not resolved silently.** If two sources disagree
   on capacity, operator, or status, say so in the response and put it in
   `notes` — don't pick one and move on.
7. **Data changes are their own commits.** Format:
   `data(datacentres): add Bowmanville site (ontariodatacentres.ca, 2026-08-10)`

## Embedding contract

The URL is the API. Treat these as a stable interface once published.

- `?layers=datacentres,research` — comma-separated, defaults to all.
- `?focus=<feature id>` — opens that feature's popup on load.
- `?lang=en|fr`.

Requirements:

- Works at 320px wide and at 1600px.
- Default 4:3, responsive; posts height changes to the parent via
  `postMessage` so the host page can resize the frame.
- `Content-Security-Policy: frame-ancestors` set in the Pages headers file.
  Do **not** send `X-Frame-Options: DENY`.
- No cookies or storage of any kind — third-party context makes them
  unreliable and they'd trigger a privacy review on the host site.
- Degrades to the list view if WebGL is unavailable.

## Accessibility

Ontario public-facing, so AODA applies: WCAG 2.1 AA is the floor, not a
stretch goal.

- The map is never the only representation. A keyboard-reachable list/table
  view of the same data is a first-class feature, not a fallback.
- Full keyboard pan, zoom, and feature traversal. Visible focus ring.
  `Esc` closes the popup and returns focus to the trigger.
- Status is never encoded by colour alone — pair it with shape or fill
  pattern.
- 4.5:1 contrast for all text, including labels over the basemap.
- `prefers-reduced-motion` respected on fly-to and popup transitions.

## Bilingual

All UI strings live in `src/i18n/` from the first commit, even if French
ships later. No hardcoded strings in components. Feature `name_fr` is
optional and falls back to `name`.

## Visual direction

The subject is infrastructure and institutions, so the register is
survey-like and factual rather than promotional.

- Basemap desaturated to near-grey so the data carries all the colour.
- Layer identity by hue; status by shape and fill. Operating sites are solid,
  proposed sites are outlined — legible in greyscale.
- Imprecise points (municipality centroids) render as a soft area, not a pin.
  A pin asserts an address the data doesn't have.
- One type family across the UI. Data values in tabular figures.
- Motion only where it aids orientation: fly-to on `?focus`, nothing ambient.

## Working conventions

- Ask first: new dependencies, schema changes, new data sources, changes to
  the URL parameter contract.
- `npm run validate` and `npm run build` must both pass before commit.
- Don't reformat data files wholesale — it destroys review diffs.
- Small commits, one concern each.
- When unsure whether a data point is publishable, leave it out and ask.

## Open decisions

- [ ] Basemap: CARTO's keyless styles vs. self-hosted Protomaps (a Canada
      extract exceeds GitHub's 100MB file limit — matters if hosting moves).
- [x] Whether `canada.ai` records can be republished or must be link-out only.
      **Resolved 2026-08-14: link-out only.** It publishes no terms of any
      kind, so nothing has been granted. The companies layer needs a different
      source of records.
- [ ] Precision policy for data centre locations: street-level, or municipality
      only regardless of what's known.
- [ ] Clustering thresholds — Toronto will otherwise be one illegible blob.
- [ ] Whether "AI company" has a definition tight enough to defend, or whether
      the layer inherits the source's definition and says so. Still open, but
      narrowed: `canada.ai` was the directory whose definition would have been
      inherited, and it carries no locations, so a source has to be chosen
      before the definition question can be answered — the answer will
      probably come with whatever source is picked.
