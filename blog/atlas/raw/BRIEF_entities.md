# Atlas Entity Extraction — Worker Brief

You are extracting **named real-world entities** from lessons of the course
"From Big Bang to ChatGPT" (a textbook about the history of AI). These entities
will be placed as dots on an interactive world map (the "Atlas").

## Your job
Read your assigned lesson files COMPLETELY (they live in
/home/norman/websites/asanai/blog/). Extract every:
- **person** — any named human (scientist, engineer, inventor, mathematician,
  philosopher, company founder, politician, author, artist…) who is named in the text.
- **place** — any named city, town, country, region, island, mountain, river,
  cave, lab site, street, park, building that has a real-world location
  (e.g. Cueva de las Manos, Bletchley Park, Silicon Valley, the Rhine, Timbuktu).
- **institution** — university, lab, company, research center, organization,
  agency, foundation, journal (only if it is named and real, e.g. Bell Labs,
  MIT, IAS Princeton, DARPA, IEEE, CERN, TSMC, DeepMind).
- **event** — a dated, locatable event relevant to the AI/tech narrative
  (Dartmouth Workshop 1956, Apollo 11, ENIAC unveiling 1946, first
  transatlantic telegraph cable 1858, WMAP launch…). Include its year.
- **artifact** — only iconic physical objects with a definite home location
  (Antikythera mechanism → Antikythera, Ishango bone → (Lake Tanganyika region,
  now Vienna), Leibniz's calculating machine → Hanover…). Keep this list short.

## Rules (important)
1. **Exhaustive but honest.** Every named entity in the text gets an entry, even
   one-line mentions. But NEVER invent a location.
2. `conf` field:
   - `"stated"` — the lesson text itself states the location/affiliation.
   - `"known"` — you know it from well-established common knowledge (birthplace
     of a famous person, HQ of a company, location of a country). Must be a fact
     you are highly confident in.
   - `"inferred"` — your best single guess (e.g. a person worked "at a
     university" in the text and you infer which). Use sparingly.
   - If you truly cannot place a person, SKIP the entry (do not guess).
3. **Location choice for persons**: prefer the place where they did the work
   discussed in the course (birthplace or early home if that is the only
   sensible single point). One location per person (the most important one).
4. **Coordinates**: decimal degrees, 2 decimals, must be a real place.
   City centers for cities; country centroids for countries.
5. `active`: [startYear, endYear] used by a time slider (BC years negative,
   e.g. -300). person → career/active life span; institution → founding year to
   end (2026 if still active); place → [null, null] (always visible);
   event → [year, year]; artifact → [creationYear, null].
6. `cited_in`: list of lesson slugs (file names without .php) where you found
   the entity. You only read your assigned lessons, so list those.
7. `bibkeys`: for persons, the citation keys in /home/norman/websites/asanai/blog/literature.js
   for works this person authored (check the "author" field). Grep literature.js
   to verify each key exists. Empty list [] if none.
8. `id`: kebab-case, type-prefixed: `person-alan-turing`, `place-bletchley-park`,
   `institution-bell-labs`, `event-dartmouth-1956`, `artifact-antikythera`.
9. `blurb`: one sentence (max ~25 words): what/who it is and why it matters for
   the AI story, in English.
10. Output: a STRICT JSON array (no comments, no markdown, no trailing
    commas) written to the exact output path given to you. One entry per
    entity; deduplicate (one entry per name, union of cited_in).

## Schema (one object per entity)
{
  "id": "person-alan-turing",
  "name": "Alan Turing",
  "type": "person",
  "loc": "Manchester, England, UK",
  "lat": 53.48,
  "lng": -2.24,
  "years": "1912-1954",
  "active": [1936, 1954],
  "blurb": "Mathematician who formalized computation and laid the foundation of AI.",
  "cited_in": ["history", "untold_history"],
  "bibkeys": ["turing1936computers"],
  "conf": "known"
}

## Definition of done
- You read every assigned file fully.
- Output file exists, is valid JSON, and every entry has all schema fields.
- No fabricated locations; unsure persons skipped.
