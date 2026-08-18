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
| Academic programs | 21 | GCwiki, Canadian academic A.I. programs |
| Companies | 21 | organisation websites, listed via canada.ai |
| Regional innovation centres | 17 | Ontario's own list of designated centres |
| Accelerators | 6 | organisation websites |
| Research institutes | 3 | GCwiki, plus organisation websites |

Counts are what is *sourced*, not what exists. An empty or thin layer means
nobody has surveyed it yet, never that Ontario has nothing there. The companies
layer in particular is a sample rather than a survey — see `docs/sources.md`.

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

Drop this into the host page, replacing the URL with your deployment:

```html
<iframe
  src="https://YOUR-PROJECT.pages.dev/"
  title="AI activity in Ontario"
  width="100%"
  height="600"
  style="border: 0; display: block;"
  loading="lazy"
  referrerpolicy="no-referrer"
></iframe>
```

That alone works, at a fixed height. To let the frame grow with its content,
add the listener below — the page posts its height on load and whenever the
layout changes, and nothing resizes without it:

```html
<script>
  window.addEventListener("message", (event) => {
    // Check the origin: any page can post to your window.
    if (event.origin !== "https://YOUR-PROJECT.pages.dev") return;
    if (event.data?.type !== "ontario-ai-map:height") return;

    const frame = document.querySelector('iframe[src^="https://YOUR-PROJECT.pages.dev"]');
    if (frame) frame.style.height = `${event.data.height}px`;
  });
</script>
```

### URL parameters

The URL is the API, and these are stable once published:

- `?layers=datacentres,research` — comma-separated, defaults to all
- `?focus=<feature id>` — opens that feature's popup on load
- `?lang=en|fr` — defaults to the host page's `lang`, then English

Unknown layer names are ignored rather than failing, and a `?focus=` id that
no longer exists leaves the map working. A host page should not break because
this project renamed something.

### What it does and does not do

- Sets no cookies and uses no storage, so it triggers no consent requirement
- Falls back to a keyboard-accessible table when WebGL is unavailable
- Works from 320px to 1600px wide
- Sends no `X-Frame-Options`, and sets `frame-ancestors` so it can be framed

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

Embed the **project** URL, `https://<project>.pages.dev/`, not the
per-deployment one Cloudflare shows after a build. The latter is prefixed with
a build hash, carries `x-robots-tag: noindex`, and stops being current the next
time you push.

## Licence

Code and data are separate questions. Every feature carries a `licence` field
describing how that record may be republished, and `docs/sources.md` records
the finding behind it. Some records are used under a project decision rather
than a licence grant, and say so.
