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
