# Sources

One entry per source. A source may not be used for records until its **Standing**
is something other than `unverified` — `npm run validate` rejects any feature
whose `licence` is `unverified`, so this ledger and the data gate each other.

**Nothing below has been independently checked yet.** The standings are carried
over from `CLAUDE.md` as the starting position. Every `Last checked` reads
`not yet` because no one has opened the terms page and read it. Fill in a real
date when they have, and record what the terms actually said rather than a
summary of the impression they gave.

## Status vocabulary

| Standing | Meaning |
| --- | --- |
| `cleared` | Terms read; records may be republished under the noted licence. |
| `link-out only` | Terms read; may link to it, may not reproduce records. |
| `cross-check only` | May confirm a fact already sourced elsewhere. Never the source of a record. |
| `unverified` | Terms not read. Cannot be used for anything that ships. |

---

## ontariodatacentres.ca

- **Standing:** `unverified`
- **Intended use:** preferred source for the data centres layer.
- **Last checked:** not yet
- **Terms URL:** not yet located
- **Contact:** none attempted
- **Notes:** `CLAUDE.md` names this the preferred data centre source, but terms
  need confirming before any record is copied. This is the highest-value
  licence question in the project — the data centres layer is the one most
  likely to be looked at, and it is currently blocked on this.

## canada.ai/directory

- **Standing:** `link-out only`
- **Intended use:** companies layer.
- **Last checked:** not yet
- **Terms URL:** not yet located
- **Contact:** none attempted
- **Notes:** ToS unverified. Until that changes, treat as link-out only — do
  not republish records. Listed as an open decision in `CLAUDE.md`; resolving
  it either unblocks the companies layer or forces a different source for it.

## wiki.gccollab.ca

- **Standing:** `unverified`
- **Intended use:** undecided.
- **Last checked:** not yet
- **Terms URL:** not yet located
- **Contact:** none attempted
- **Notes:** Wikis usually carry an explicit content licence, often Creative
  Commons. If it does, this may be the easiest of the four to clear. Find the
  licence statement rather than assuming the usual one applies.

## datacentermap.com, baxtel.com, datacenters.com

- **Standing:** `cross-check only`
- **Intended use:** confirming a capacity, operator, or status already sourced
  elsewhere.
- **Last checked:** not yet
- **Contact:** none attempted
- **Notes:** Commercial products. `CLAUDE.md` is explicit that these are never
  a source of records. Recorded here so the decision is visible rather than
  remembered — and so a future contributor does not have to rediscover why
  these three are absent from the data.

---

## Adding a source

1. Read the terms. Actually open them.
2. Add an entry here with a real `Last checked` date, before adding records.
3. If the terms are ambiguous, the standing is `unverified` and the question
   goes to a human. Ambiguity is not permission.
4. Record the finding, not the conclusion — quote or link the clause that
   decides it, so the next person can re-evaluate without starting over.
