# Ontario AI Map

An embeddable map of AI-related activity in Ontario: data centres, companies,
accelerators, research institutes, and academic programs. A static site, built
to be dropped into a third-party page via `<iframe>`.

`CLAUDE.md` is the specification and the authority on how this is built.
`docs/sources.md` records where every record came from and what its licence
permits.

## Layers

| Layer | Records | Source |
| --- | --- | --- |
| Data centres | 48 | Ontario Data Centre Tracker |
| Companies | 27 | organisation websites, listed via canada.ai |
| Academic programs | 21 | GCwiki, Canadian academic A.I. programs |
| Accelerators | 18 | Ontario's Regional Innovation Centres |
| Research institutes | 3 | GCwiki, Canadian AI Institutes |

Counts are what is *sourced*, not what exists. An empty or thin layer means
nobody has surveyed it yet, never that Ontario has nothing there.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run validate   # must pass before any commit
npm run build      # type-check, then build to dist/
```

`npm run validate` checks every feature against `schema/feature.schema.json`,
re-runs the schema's own fixtures, and enforces the rules a per-feature schema
cannot see: identifier uniqueness, layer and filename agreement, the licence
gate, and that every coordinate came from a recorded geocoder lookup.

## Adding data

Coordinates never come from memory. They come from the geocoder and are
recorded, which `npm run validate` enforces:

```bash
npm run geocode -- "Clarington" "1 Example Road, Toronto"
npm run geocode -- --file addresses.txt
```

Read `docs/sources.md` before adding a source, and `CLAUDE.md`'s data rules
before adding a record. A wrong pin on a public map is worse than a missing
one.

## Embedding

The URL is the API:

- `?layers=datacentres,research` — comma-separated, defaults to all
- `?focus=<feature id>` — opens that feature's popup on load
- `?lang=en|fr`

The page reports its height to the parent via `postMessage`, sets no cookies
and uses no storage, and falls back to a table when WebGL is unavailable.

## Deploying

Cloudflare Pages, connected to this repository:

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | from `.node-version` (22) |

`public/_headers` sets `Content-Security-Policy: frame-ancestors` so the site
can be framed, and deliberately sends no `X-Frame-Options`, which would
override it in older browsers and break the embed.

## Licence

Code and data are separate questions. Every feature carries a `licence` field
describing how that record may be republished, and `docs/sources.md` records
the finding behind it. Some records are used under a project decision rather
than a licence grant, and say so.
