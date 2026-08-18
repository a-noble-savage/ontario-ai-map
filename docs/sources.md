# Sources

One entry per source. A source may not be used for records until its **Standing**
is something other than `unverified` — `npm run validate` rejects any feature
whose `licence` is `unverified`, so this ledger and the data gate each other.

Record the finding, not the conclusion: quote the clause that decides it, so the
next person can re-evaluate without starting over.

## Status vocabulary

| Standing | Meaning |
| --- | --- |
| `cleared` | Terms read; records may be republished under the noted licence. |
| `cleared (project decision)` | **No licence grant exists.** The project owner has decided to use the source regardless. The risk is accepted, not resolved — the terms finding below is unchanged. |
| `link-out only` | Terms read; may link to it, may not reproduce records. |
| `cross-check only` | May confirm a fact already sourced elsewhere. Never the source of a record. |
| `unverified` | Terms not read. Cannot be used for anything that ships. |

A standing and a finding are different things, and this file keeps them apart on
purpose. A finding is what the source says. A standing is what we have decided
to do about it. Where the two diverge, the divergence is stated rather than
smoothed over, so nobody later mistakes a decision for a permission.

## A note on silence

Two of the sources below carry no licence grant at all. **Absence of a licence
is not permission** — copyright subsists by default, and a site that says
nothing about reuse has granted nothing. On the terms alone both would be
`link-out only`; they are listed as `cleared (project decision)` because that
call was made on 2026-08-14, not because anything in their terms changed.

One thing materially reduces the exposure, and it is worth preferring in every
case: copyright restricts republishing a source's **compilation**, not the
underlying **facts**. A data centre's location, operator, and capacity are
facts. Sourcing a record from the primary document a tracker cites — the
planning report, the IESO filing — needs no permission from the tracker at all,
and produces better provenance. Prefer it wherever the primary document can be
found, and reserve the decision below for cases where it genuinely cannot.

---

## wiki.gccollab.ca

- **Standing:** `cleared` — Creative Commons Attribution 4.0 International
- **Intended use:** any layer where GCwiki carries relevant Ontario material.
  **Start here** — it is the only source cleared by an actual licence grant.
- **Last checked:** 2026-08-14
- **Deciding clause:** footer — *"Content is available under Creative Commons
  Attribution 4.0 International License unless otherwise noted."*
- **`licence` value for features:** `CC BY 4.0 — attribution required`
- **Notes:** Two caveats. *"Unless otherwise noted"* makes the licence a default
  rather than a guarantee, so the individual page a record comes from still has
  to be checked; if that page notes something different, the page wins. And
  GCwiki is a federal public-service collaboration space, so Ontario-specific
  coverage may be thin — useful material is as likely to be a pointer to a
  primary document as a record in itself.

  Worth a human eyeball on that footer before the first record ships. The quote
  above came through an automated page summary, and it is the one clause in this
  file that actually grants permission.

## ontario.ca — Regional Innovation Centre locations

- **Standing:** `cleared` for facts, with a restriction worth reading
- **Intended use:** the accelerators layer.
- **Last checked:** 2026-08-14
- **Deciding clause:** ontario.ca/copyright — *"If credit is given and Crown
  copyright is acknowledged, the materials may be reproduced for
  non-commercial purposes if no changes are made to the original content."*
- **`licence` value for features:** `© King's Printer for Ontario — ontario.ca
  permits non-commercial reproduction with credit; names and addresses reused
  as facts`
- **Notes:** **Not** the Open Government Licence. That applies only to
  materials "clearly labelled on the page", and this page carries no such
  label, so the default Crown copyright terms govern: non-commercial only,
  and no changes to the content.

  We rely on the same distinction used elsewhere in this file: the name and
  address of a public body are facts, and copyright reaches the page's
  expression rather than the facts in it. The prose is not reproduced; the
  17 organisations and where they are, are.

  **The non-commercial restriction deserves a decision.** This map is built to
  be embedded in pages we do not control, and a commercial host embedding it
  is a use these terms do not obviously cover. The facts argument makes that
  moot in our reading, but if the project ever wants to be conservative about
  it, the King's Printer licenses commercial use on request.

  Why this source at all: it settles the definition problem. The province
  designates Regional Innovation Centres, so the question of what belongs on
  the accelerators layer is answered by Ontario rather than invented here —
  which is exactly what the previous keyword-based classification could not
  do. It also gives the layer real provincial reach, from Thunder Bay and
  Sault Ste. Marie to Windsor, rather than a Toronto cluster.

  A Regional Innovation Centre is general-purpose, not an AI accelerator.
  Every record says so, so the layer is not read as a survey of AI-specific
  programmes.

### The companies layer is a sample, not a survey

Worth stating plainly, because a layer called "Companies" invites the opposite
reading. Its records are the residue of a filter: of canada.ai's 571
organisations, these are the ones whose own website happened to publish a
machine-readable Ontario postal address. Publishing an address in a parseable
form has nothing to do with being an important AI company, so the selection is
close to arbitrary — a company with a contact form instead of a footer address
is simply absent.

The other layers differ in kind. Regional innovation centres are the province's
designated list; academic programs are a published table; data centres are one
tracker's compilation. Each has a boundary someone else drew. This layer has
none, which is the open question in `CLAUDE.md` about whether "AI company" has a
definition tight enough to defend.

Vector Institute's sponsor list was considered as a defined set and rejected:
its sponsors are banks and telcos that fund Vector, not Ontario AI companies,
so inheriting that definition would have made the layer less accurate rather
than more.

**Liveness checked 2026-08-17.** All 27 sites resolved, but six had redirected
to a different brand — Aiva Labs to bevycommerce.com, Arvizio to averian.io,
Blue J Legal to bluej.com, Naborly to singlekey.com, DocPod Corp to a personal
Wix page, and Komand Consulting to a cannabis subdomain. Those six were removed
rather than renamed: the record's name no longer matched what a reader would
find, and confirming each successor is still an Ontario AI company at a known
address is fresh research, not a rename. They are named here so that work can
start from a list rather than from scratch.

## Organisation websites (addresses)

- **Standing:** `cleared` — a business's own published address is a fact, and
  facts are not copyrightable
- **Intended use:** the address and municipality for companies, accelerators
  and research institutes.
- **Last checked:** 2026-08-14
- **Notes:** canada.ai names organisations without locating them, so the
  address is read from each organisation's own website — the authoritative
  statement of where it is, and the page a reader can open to check. Records
  therefore carry two sources: `source_url` is the organisation's site,
  because that is where the address came from, and the notes say canada.ai is
  where the organisation was found.

  Deliberately **not** a corporate registry. A registry's "registered office"
  is frequently the company's law or accounting firm, so those addresses would
  produce confident, checkable, wrong pins.

  Read in two ways, in order: schema.org JSON-LD, then a Canadian postal code
  with its surrounding text anchored on a street number and street type.
  Ontario postal codes start with K, L, M, N or P, which is what keeps a
  national directory in scope. 567 sites yielded 52 Ontario addresses.

  Only the home page and one contact page are fetched per organisation, once.

## OpenStreetMap (Nominatim, Overpass)

- **Standing:** `cleared` — ODbL 1.0, attribution required
- **Intended use:** coordinates for every feature, via `npm run geocode`, and
  addresses for named organisations, via `npm run osm-match`.
- **Last checked:** 2026-08-14
- **Deciding clause:** each geocoder response carries its own licence string,
  recorded verbatim in `scripts/geocode-cache.json`: *"Data © OpenStreetMap
  contributors, ODbL 1.0."*
- **Notes:** Already the basis of the basemap, so this adds no new licensing
  relationship. Nominatim resolves place names and street addresses well and
  is the workhorse behind data rule 3.

  **As a cross-reference for organisation addresses it does not work at
  scale.** Tried on 2026-08-14 against the 563 organisations named in the
  canada.ai directory, matching by name within Ontario through Overpass: about
  one usable match per forty names. Vector Institute, Borealis AI, Creative
  Destruction Lab and Cologix are all absent from OSM as addressed features;
  Communitech is present with a full address, MaRS only as a street with no
  number.

  The reason matters more than the number. OSM's coverage of offices reflects
  whoever happened to map them, which has nothing to do with whether an
  organisation belongs on this map, so a layer assembled this way would be an
  arbitrary sample wearing the clothes of a survey. Wide name regexes over a
  whole province are also expensive for Overpass, which returned 504s
  consistently at batches of forty.

  `scripts/osm-match.ts` is kept: it is the right tool for looking up a modest
  list of named institutions, and it records what answered. It is the wrong
  tool for enumerating an industry.

## ontariodatacentres.ca

- **Standing:** `cleared (project decision)` — 2026-08-14. Was `link-out only`
  on the terms.
- **Intended use:** data centres layer.
- **Last checked:** 2026-08-14
- **Deciding clause:** `/resources.html` — *"© 2026 Ontario Data Centre Tracker
  — Compiled by an Ontario resident for informational purposes only. Not
  affiliated with any government body."* No terms of use, licence, or reuse
  provision appears anywhere on the site, including `/about.html`.
- **Contact:** ontariodatacentres@gmail.com
- **`licence` value for features:** `ontariodatacentres.ca — used by project
  decision, no licence granted; attribute and link out`
- **Notes:** An explicit copyright assertion with no accompanying grant. The
  standing is a decision to proceed anyway, not a change in what the site says.

  Prefer the primary document in every case where one exists. The site publishes
  its own methodology — *"Primary sources are always preferred: municipal
  planning documents, city council records, IESO filings, government
  announcements, and official corporate press releases"* — so the tracker
  doubles as a finding aid pointing at exactly those documents. Using it that
  way needs no permission and yields better provenance.

  **Still worth an email.** It is run by one Ontario resident ("Katie"), it is
  non-commercial and public-interest, its aims are close to this project's, and
  she publishes a contact address. A request to reuse with attribution has a
  fair chance of a yes, and a yes would move this to `cleared` outright. If
  permission is given, record it here with the date and the wording of the
  grant.

## canada.ai/directory

- **Standing:** `cleared (project decision)` — 2026-08-14. Was `link-out only`
  on the terms.
- **Intended use:** companies layer.
- **Last checked:** 2026-08-14
- **Deciding clause:** none exists. No terms of service, terms of use, copyright
  notice, licence statement, or reuse provision appears on the directory page or
  in its footer, and there is no link to a legal or terms page.
- **`licence` value for features:** `canada.ai — used by project decision, no
  terms published; attribute and link out`
- **Notes:** Nothing is granted here and nothing is forbidden in writing either;
  the site is simply silent.

  **Surveyed 2026-08-14 and it cannot supply mappable records.** The directory
  holds 571 entries. Every one has a subtitle, but the subtitles are
  descriptive prose rather than addresses, and no entry carries a location
  field of any kind. Seven of the 571 mention an Ontario place anywhere at all,
  and those are incidental phrases inside descriptions — "Launched at the
  University of Toronto's Rotman School of Management" — not a statement of
  where the organisation is. `/directory` is the site's only listing; the other
  navigation entries are industry news categories.

  Several of these organisations have locations that are common knowledge.
  That is precisely why they cannot be used: taking a position from anywhere
  other than the source and the geocoder is what data rule 3 exists to
  prevent, and a layer assembled that way would have provenance that reads as
  sourced when it is not.

  The directory is also not a companies list. It mixes companies with
  accelerators (Creative Destruction Lab, Next AI) and research institutes
  (Vector, CIFAR, MILA, Amii), with no type field to separate them.

  This is a dead end for the companies layer regardless of the licence
  standing, so that layer needs a different source. The open decision in
  `CLAUDE.md` about defining "AI company" is untouched by this, except that
  the option of inheriting *this* directory's definition is no longer
  available.

## datacentermap.com, baxtel.com, datacenters.com

- **Standing:** `cross-check only` — unchanged
- **Intended use:** confirming a capacity, operator, or status already sourced
  elsewhere.
- **Last checked:** not applicable — excluded by editorial policy, not by terms.
- **Notes:** These three are excluded by `CLAUDE.md` data rule 4, which says
  they are *"commercial products. Use for cross-checking a fact, never as a
  source of records."* That is an editorial judgement about source quality and
  commercial scraping, not a licence standing, so the 2026-08-14 clearing
  decision does not reach them — a licence decision cannot resolve a rule that
  was never about licensing.

  If they should become record sources, that is an edit to data rule 4 in
  `CLAUDE.md` rather than a change here. Say so and it is a one-line change.

---

## Adding a source

1. Read the terms. Actually open them.
2. Add an entry here with a real `Last checked` date, before adding records.
3. If the terms are ambiguous, the standing is `unverified` and the question
   goes to a human. Ambiguity is not permission — and neither is silence.
4. Record the finding, not the conclusion — quote or link the clause that
   decides it, so the next person can re-evaluate without starting over.
5. If a source is used without a licence grant, say so in the standing. A
   decision to accept risk is a legitimate call; recording it as though it were
   a permission is not.
