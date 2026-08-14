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
| `link-out only` | Terms read; may link to it, may not reproduce records. |
| `cross-check only` | May confirm a fact already sourced elsewhere. Never the source of a record. |
| `unverified` | Terms not read. Cannot be used for anything that ships. |

## A note on silence

Two of the sources below carry no licence at all. **Absence of a licence is not
permission.** Copyright subsists by default; a site that says nothing about
reuse has granted nothing. Both are therefore `link-out only`, not `cleared`.

Note also that this constrains republishing *their compilation*, not the
underlying facts — a data centre's location, operator, and capacity are facts,
and facts are not copyrightable. The lawful and better route is to take the
primary document each site cites and source the record from that.

---

## wiki.gccollab.ca

- **Standing:** `cleared` — Creative Commons Attribution 4.0 International
- **Intended use:** any layer where GCwiki carries relevant Ontario material.
- **Last checked:** 2026-08-14
- **Deciding clause:** footer — *"Content is available under Creative Commons
  Attribution 4.0 International License unless otherwise noted."*
- **`licence` value for features:** `CC BY 4.0 — attribution required`
- **Notes:** The first source that can actually supply records. Two caveats
  before leaning on it. *"Unless otherwise noted"* means the licence is a
  default, not a guarantee — check the individual page a record comes from, and
  if that page notes something different, the page wins. And GCwiki is a federal
  public-service collaboration space, so Ontario-specific coverage may be thin;
  useful material is as likely to be a pointer to a primary document as a record
  in itself.

## ontariodatacentres.ca

- **Standing:** `link-out only`
- **Intended use:** was the preferred source for the data centres layer.
- **Last checked:** 2026-08-14
- **Deciding clause:** `/resources.html` — *"© 2026 Ontario Data Centre Tracker
  — Compiled by an Ontario resident for informational purposes only. Not
  affiliated with any government body."* No terms of use, licence, or reuse
  provision appears anywhere on the site, including `/about.html`.
- **Contact:** ontariodatacentres@gmail.com
- **Notes:** An explicit copyright assertion with no accompanying grant, so its
  records cannot be republished. **This does not block the data centres layer**,
  because the site publishes its own methodology: *"Primary sources are always
  preferred: municipal planning documents, city council records, IESO filings,
  government announcements, and official corporate press releases."* Those are
  the sources to use. Treat this tracker as a finding aid — it tells us which
  municipalities and projects are worth looking at — and then source each record
  from the primary document itself. That is both legally clean and better data,
  and it is what data rule 5 already asks for.

  Worth an email regardless. It is run by one Ontario resident ("Katie"), it is
  a non-commercial public-interest project with aims close to this one, and a
  request to reuse with attribution has a fair chance of a yes. If permission is
  given, record it here with the date and the wording of the grant.

## canada.ai/directory

- **Standing:** `link-out only`
- **Intended use:** companies layer.
- **Last checked:** 2026-08-14
- **Deciding clause:** none exists. No terms of service, terms of use, copyright
  notice, licence statement, or reuse provision appears on the directory page or
  in its footer, and there is no link to a legal or terms page.
- **Notes:** This resolves the open question in `CLAUDE.md` as *link-out only*,
  and for a firmer reason than before: it is no longer "ToS unverified" but
  "checked, and there is nothing there." Nothing further will resolve it except
  asking the operator directly. The companies layer needs a different source of
  records, or a definition of "AI company" applied to an openly licensed
  register.

## datacentermap.com, baxtel.com, datacenters.com

- **Standing:** `cross-check only`
- **Intended use:** confirming a capacity, operator, or status already sourced
  elsewhere.
- **Last checked:** not applicable — excluded by policy, not by their terms.
- **Notes:** Commercial products. `CLAUDE.md` is explicit that these are never a
  source of records, so their terms have deliberately not been assessed; the
  exclusion does not depend on what they say. Recorded here so the decision is
  visible rather than remembered, and so nobody has to rediscover why these
  three are absent from the data.

---

## Adding a source

1. Read the terms. Actually open them.
2. Add an entry here with a real `Last checked` date, before adding records.
3. If the terms are ambiguous, the standing is `unverified` and the question
   goes to a human. Ambiguity is not permission — and neither is silence.
4. Record the finding, not the conclusion — quote or link the clause that
   decides it, so the next person can re-evaluate without starting over.
