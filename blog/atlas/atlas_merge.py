#!/usr/bin/env python3
"""Atlas data merge — turns raw subworker outputs into clean, deduplicated JSON.

Pipeline (run in this order from blog/):
  python3 atlas/atlas_parse_bib.py          literature.js -> raw/bib_parsed.json
  python3 atlas/atlas_merge.py --merge      raw/ -> entities.json, authors.json,
                                            bibliography.json, world.json
  python3 atlas/atlas_threads.py --build    entities.json -> threads.json
  python3 atlas/atlas_check.py             independent audit (must pass)

Usage:
  python3 atlas_merge.py --test    run the self-test suite (fixtures + asserts)
  python3 atlas_merge.py --merge   read raw/ (or /tmp/opencode/atlas), merge,
                                   validate, and write entities.json, authors.json,
                                   bibliography.json and world.json next to this file.

The raw inputs are worker outputs:
  out_part*.json      entity lists (people/places/institutions/events/artifacts);
                      any file matching out_part*.json is picked up (out_part1.json,
                      out_part7_polar.json, ...) — add new parts freely
  placed_*.json       author placement rows  [name, lat, lng, city, year, conf];
                      any file matching placed_*.json is picked up
  authors_chunk_1..6.json  the 3,403 unique bibliography author names (coverage check)
  bib_parsed.json     parsed literature.js (entries + cite map); regenerate with
                      atlas_parse_bib.py whenever literature.js changes

Rules enforced (and tested):
  - entities: schema-normalized (accepts flat lat/lng AND nested location.lat/lon),
    valid coordinate ranges, unique ids, cited_in slugs must exist, bibkeys must
    exist in literature.js; duplicates (same type + name) are merged with a
    confidence priority stated > known > inferred.
  - authors: every one of the 3,403 bibliography names must be covered exactly
    once after normalization; broken fragments (e.g. "2017)") are repaired or
    dropped with a report; conf-1 rows win over conf-0 rows.
"""

import glob
import json
import os
import re
import shutil
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
RAW_LOCAL = os.path.join(HERE, "raw")
RAW_FALLBACK = "/tmp/opencode/atlas"

# lesson slugs that exist in blog/ (computed at merge time, see valid_slugs())

CONF_ORDER = {"stated": 3, "known": 2, "inferred": 1}
ENTITY_TYPES = {"person", "place", "institution", "event", "artifact"}


# ---------------------------------------------------------------------------
# normalizers
# ---------------------------------------------------------------------------

def slugify(text):
    text = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE)
    text = re.sub(r"[\s_-]+", "-", text.strip())
    return re.sub(r"-{2,}", "-", text).lower().strip("-")


def canonical_author_name(name):
    """Reduce a bibliography name string to its canonical person/organization form.

    - 'Ibn al-Haytham (Alhazen)'      -> 'Ibn al-Haytham'   (alias kept separately)
    - 'Wim Vogelsang et al.'          -> 'Wim Vogelsang'
    - ' and Xiaoqiang Zheng'          -> 'Xiaoqiang Zheng'
    - 'Thomas Etter)'                 -> 'Thomas Etter'
    - 'B. P. Abbott et al. (LIGO...)' -> 'B. P. Abbott'
    """
    s = name.strip()
    s = re.sub(r"^\s*and\s+", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\s+et\s+al\.?\s*$", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\s*et\s+al\.?\s*", " ", s)
    s = s.strip()
    # strip a trailing parenthetical (alias / qualifier / broken fragment)
    alias = None
    m = re.search(r"^(.*?)\s*\(([^()]*)\)\s*$", s)
    if m and m.group(1).strip():
        alias = m.group(2).strip()
        s = m.group(1).strip()
    # repair broken fragments: 'Name (ed.' + '2017)'  -> keep 'Name (ed.'? no:
    # a name ending in a dangling open paren is a broken credit string; keep it
    # only if it still contains a plausible name, else drop (see is_plausible_name)
    s = s.rstrip(")").strip()
    s = re.sub(r"\s{2,}", " ", s)
    return s, (alias or None)


def _has_two_consecutive_letters(s):
    """Two letter (L) characters with only letters/marks (M) between them.

    Combining marks (Devanagari ु ्, Arabic harakat, …) do not break the run,
    but digits and punctuation do (so 'J3n6' and '2017)' are rejected).
    """
    count = 0
    for c in s:
        cat = unicodedata.category(c)
        if cat.startswith("M"):
            continue
        if cat.startswith("L"):
            count += 1
            if count >= 2:
                return True
        else:
            count = 0
    return False


def is_plausible_name(name):
    """True if the string looks like a person/organization name (any script),
    not a date fragment or initials-only garbage."""
    s = name.strip()
    if not s:
        return False
    if not _has_two_consecutive_letters(s):
        return False
    if re.search(r"^\d{3,4}\)", s):
        return False
    return True


def _num(v):
    if v is None:
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        t = v.strip()
        if t in ("", "-", "null", "None", "n/a", "N/A"):
            return None
        try:
            return float(t)
        except ValueError:
            return None
    return None


def valid_lat(v):
    x = _num(v)
    return x if x is not None and -90.0 <= x <= 90.0 else None


def valid_lng(v):
    x = _num(v)
    return x if x is not None and -180.0 <= x <= 180.0 else None


def norm_entity(e, source):
    """Normalize one entity dict from any worker schema variant.

    Returns (entity, repairs) or (None, reason) if unfixable.
    """
    repairs = []
    if not isinstance(e, dict):
        return None, "not-a-dict"
    name = (e.get("name") or "").strip()
    etype = (e.get("type") or "").strip().lower()
    if not name:
        return None, "no-name"
    if etype not in ENTITY_TYPES:
        return None, "bad-type:%s" % etype

    lat, lng = None, None
    if isinstance(e.get("location"), dict):
        lat = valid_lat(e["location"].get("lat"))
        lng = valid_lng(e["location"].get("lon", e["location"].get("lng")))
        repairs.append("nested-location")
    else:
        lat = valid_lat(e.get("lat"))
        lng = valid_lng(e.get("lng", e.get("lon")))
        if e.get("lon") is not None and e.get("lng") is None:
            repairs.append("lon->lng")

    active = e.get("active")
    if not isinstance(active, list) or len(active) != 2:
        active = [None, None]
        if e.get("year") is not None:
            year = _num(e.get("year"))
            active = [year, year]
            repairs.append("year->active")
        elif "active" not in e:
            repairs.append("active-missing")
    active = [_num(active[0]), _num(active[1])]

    years = e.get("years")
    if years in (None, ""):
        if active[0] is not None and active[1] is not None:
            years = "%g-%g" % (active[0], active[1])
            repairs.append("years-from-active")
        elif active[0] is not None:
            years = str(int(active[0]))
            repairs.append("years-from-active")
        else:
            years = ""

    loc = e.get("loc")
    if not loc:
        loc = e.get("name") if etype in ("place", "institution") else ""
        if loc:
            repairs.append("loc-from-name")

    conf = (e.get("conf") or "").strip().lower()
    if conf not in CONF_ORDER:
        conf = "inferred"
        repairs.append("conf-defaulted")

    bibkeys = e.get("bibkeys") or []
    if isinstance(bibkeys, str):
        bibkeys = [bibkeys]
        repairs.append("bibkeys-str")

    cited_in = e.get("cited_in") or []
    if isinstance(cited_in, str):
        cited_in = [cited_in]
        repairs.append("cited_in-str")
    # workers sometimes use dash slugs (statistics-i); files use underscores
    raw_cited = [c.strip() for c in cited_in if isinstance(c, str) and c.strip()]
    norm_cited = []
    for c in raw_cited:
        c2 = c.replace("-", "_")
        if c2 not in norm_cited:
            norm_cited.append(c2)
    if norm_cited != raw_cited:
        repairs.append("slugs-normalized")
    cited_in = norm_cited

    eid = e.get("id") or ("%s-%s" % (etype, slugify(name)))
    if not e.get("id"):
        repairs.append("id-generated")

    out = {
        "id": eid,
        "name": name,
        "type": etype,
        "loc": loc,
        "lat": lat,
        "lng": lng,
        "years": years,
        "active": active,
        "blurb": (e.get("blurb") or "").strip(),
        "cited_in": list(dict.fromkeys([c.strip() for c in cited_in if c and c.strip()])),
        "bibkeys": list(dict.fromkeys([b.strip() for b in bibkeys if b and b.strip()])),
        "conf": conf,
        "source": source,
    }
    return out, repairs


def merge_entities(entries, valid_slugs, bib_keys, report):
    """Merge a list of normalized entities; dedupe by (type, name.casefold())."""
    report.setdefault("entity_merges", 0)
    report.setdefault("entity_rejects", [])
    report.setdefault("entity_dropped_refs", [])
    groups = {}
    order = []
    for e in entries:
        key = (e["type"], e["name"].casefold())
        if key not in groups:
            groups[key] = e
            order.append(key)
        else:
            cur = groups[key]
            report["entity_merges"] += 1
            # confidence wins for coordinates
            if CONF_ORDER[e["conf"]] > CONF_ORDER[cur["conf"]]:
                cur["lat"], cur["lng"], cur["loc"], cur["conf"] = e["lat"], e["lng"], e["loc"], e["conf"]
            elif e["conf"] == cur["conf"] and cur["lat"] is None and e["lat"] is not None:
                cur["lat"], cur["lng"] = e["lat"], e["lng"]
            for f in ("cited_in", "bibkeys"):
                merged = list(dict.fromkeys(cur[f] + e[f]))
                cur[f] = merged
            if not cur["blurb"] and e["blurb"]:
                cur["blurb"] = e["blurb"]
            if not cur["years"] and e["years"]:
                cur["years"] = e["years"]
            if cur["active"] == [None, None] and e["active"] != [None, None]:
                cur["active"] = e["active"]

    merged = [groups[k] for k in order]
    # unique ids
    seen = set()
    for e in merged:
        base = e["id"]
        i = 2
        while e["id"] in seen:
            e["id"] = "%s-%d" % (base, i)
            i += 1
        seen.add(e["id"])

    # validation: bad slugs / bibkeys are DROPPED (the entity stays);
    # only missing coordinates reject the whole entity.
    kept = []
    for e in merged:
        bad = []
        good_slugs = []
        for s in e["cited_in"]:
            if s in valid_slugs:
                if s not in good_slugs:
                    good_slugs.append(s)
            else:
                bad.append("slug:%s" % s)
        good_keys = []
        for k in e["bibkeys"]:
            if not bib_keys or k in bib_keys:
                if k not in good_keys:
                    good_keys.append(k)
            else:
                bad.append("bibkey:%s" % k)
        e["cited_in"] = good_slugs
        e["bibkeys"] = good_keys
        if e["lat"] is None or e["lng"] is None:
            report["entity_rejects"].append({"name": e["name"], "type": e["type"], "problems": ["no-coords"]})
            continue
        if bad:
            report["entity_dropped_refs"].append({"name": e["name"], "type": e["type"], "dropped": bad})
        kept.append(e)
    for e in kept:
        e["bg"] = is_background_place(e)
    return kept


def is_background_place(e):
    """A place dot that is a bare list-mention — no blurb, no works, and
    cited only from the Global AI Ecosystem roundup (country names that
    appear as section headings, e.g. 'Canada') — is background context:
    the UI hides it by default behind its own checkbox."""
    return (
        e["type"] == "place"
        and not e["blurb"]
        and not e["bibkeys"]
        and e["cited_in"] == ["global_ai_ecosystem"]
    )


# ---------------------------------------------------------------------------
# authors
# ---------------------------------------------------------------------------

def norm_author_row(row):
    """Validate/repair one placement row. Returns (record, repairs) or (None, reason)."""
    repairs = []
    if not isinstance(row, list) or len(row) != 6:
        return None, "row-shape"
    name, lat, lng, city, year, conf = row
    if not isinstance(name, str):
        return None, "name-not-str"
    canon, alias = canonical_author_name(name)
    if not is_plausible_name(canon):
        return None, "implausible-name:%r" % name
    if canon != name.strip():
        repairs.append("name-normalized")
    lat = valid_lat(lat)
    lng = valid_lng(lng)
    if lat is None or lng is None:
        conf = 0
    year = _num(year)
    if conf not in (0, 1):
        conf = 0 if conf is None else int(bool(conf))
        repairs.append("conf-coerced")
    if city and not isinstance(city, str):
        city = str(city)
    rec = {
        "name": name.strip(),
        "canon": canon,
        "alias": alias,
        "lat": lat,
        "lng": lng,
        "city": (city or "").strip(),
        "year": year,
        "conf": conf,
    }
    return rec, repairs


def merge_authors(rows, bib, report):
    """Merge placement rows; join with bibliography data. rows: list of (row, source)."""
    groups = {}
    order = []
    for row, _src in rows:
        rec, reason = norm_author_row(row)
        if rec is None:
            report["author_row_rejects"].append({"row": row, "reason": reason})
            continue
        key = rec["canon"].casefold()
        if key not in groups:
            groups[key] = rec
            order.append(key)
        else:
            cur = groups[key]
            report["author_merges"] += 1
            if rec["conf"] == 1 and cur["conf"] == 0:
                groups[key] = rec
                if cur["name"] != rec["name"] and cur["name"] not in rec.get("variants", []):
                    rec.setdefault("variants", []).append(cur["name"])
            if rec["alias"] and rec["alias"] not in cur.get("variants", []):
                cur.setdefault("variants", []).append(rec["alias"])
            if cur["alias"] and cur["alias"] != rec["alias"] and cur["alias"] not in rec.get("variants", []):
                rec.setdefault("variants", []).append(cur["alias"])
            if cur["city"] and rec["city"] and cur["city"] != rec["city"]:
                cur.setdefault("variants", []).append("aka:" + rec["city"])

    # precompute bib lookups (raw name and canonical name) — O(1) per variant
    bib_by_raw = {}
    bib_by_canon = {}
    for bib_name, bdata in bib.get("authors", {}).items():
        bib_by_raw.setdefault(bib_name.casefold(), []).append(bdata)
        bc, _ = canonical_author_name(bib_name)
        bib_by_canon.setdefault(bc.casefold(), []).append(bdata)

    out = []
    for key in order:
        rec = groups[key]
        # join bib data by original name strings (case-insensitive)
        variants = set()
        variants.add(rec["name"].casefold())
        for v in rec.get("variants", []):
            if not v.startswith("aka:"):
                variants.add(v.casefold())
        if rec["alias"]:
            variants.add(rec["alias"].casefold())
        variants.add(key)

        # a person may appear under several bib name spellings
        # ('Robert Hooke (engraving...)', 'Hooke'); match raw and canonical.
        matched = []
        seen = set()
        for v in variants:
            for bdata in bib_by_raw.get(v, []) + bib_by_canon.get(v, []):
                if id(bdata) not in seen:
                    seen.add(id(bdata))
                    matched.append(bdata)
        if matched:
            keys = []
            for m in matched:
                keys.extend(m.get("keys", []))
            keys = list(dict.fromkeys(keys))
            rec["works"] = len(keys)
            rec["keys"] = keys
            rec["cited_in"] = sorted({s for k in keys for s in bib.get("cites", {}).get(k, [])})
        else:
            rec["works"] = 0
            rec["keys"] = []
            rec["cited_in"] = []
        out.append(rec)
    return out


# ---------------------------------------------------------------------------
# self tests
# ---------------------------------------------------------------------------

def run_tests():
    failures = []

    def check(label, cond):
        if not cond:
            failures.append(label)
        print(("  ok  " if cond else " FAIL ") + label)

    print("== slugify ==")
    check("basic", slugify("Bell Labs") == "bell-labs")
    check("unicode", slugify("Al-Kindi") == "al-kindi")
    check("dashes", slugify("a  b--c") == "a-b-c")

    print("== canonical_author_name ==")
    check("alias", canonical_author_name("Ibn al-Haytham (Alhazen)")[0] == "Ibn al-Haytham")
    check("alias-kept", canonical_author_name("Ibn al-Haytham (Alhazen)")[1] == "Alhazen")
    check("et-al", canonical_author_name("Wim Vogelsang et al.")[0] == "Wim Vogelsang")
    check("leading-and", canonical_author_name(" and Xiaoqiang Zheng")[0] == "Xiaoqiang Zheng")
    check("dangling-paren", canonical_author_name("Thomas Etter)")[0] == "Thomas Etter")
    check("et-al-paren", canonical_author_name("B. P. Abbott et al. (LIGO Scientific Collaboration and the Virgo Collaboration)")[0] == "B. P. Abbott")
    check("plain", canonical_author_name("Ada Lovelace")[0] == "Ada Lovelace")
    check("org", canonical_author_name("3M Company")[0] == "3M Company")

    print("== is_plausible_name ==")
    check("date-frag-drop", not is_plausible_name("2017)"))
    check("date-frag2", not is_plausible_name("2024)"))
    check("j3n6", not is_plausible_name("J3n6"))
    check("org-keep", is_plausible_name("3M Company"))
    check("normal", is_plausible_name("Ada Lovelace"))
    check("unicode-name", is_plausible_name("ज्येष्ठदेव (Jyeṣṭhadeva)"))
    check("devanagari-only", is_plausible_name("आर्यभट"))
    check("arabic-only", is_plausible_name("محمد بن موسى الخوارزمي"))
    check("cjk", is_plausible_name("刘徽"))
    check("digits-only", not is_plausible_name("2017"))
    check("empty", not is_plausible_name(""))

    print("== norm_entity ==")
    e, r = norm_entity({
        "type": "person", "name": "Gottfried Wilhelm Leibniz",
        "location": {"lat": 52.37, "lon": 9.73}, "conf": "known",
        "cited_in": ["untold_history"], "active": [1670, 1716],
        "bibkeys": ["leibniz1686calculus"],
    }, "test")
    check("nested-loc", e and e["lat"] == 52.37 and e["lng"] == 9.73)
    check("id-generated", e and e["id"] == "person-gottfried-wilhelm-leibniz")
    check("years-from-active", e and e["years"] == "1670-1716")
    check("repairs", "nested-location" in r and "id-generated" in r)

    e2, _ = norm_entity({"type": "event", "name": "X", "location": {"lat": 1, "lon": 2}, "year": 1956}, "test")
    check("event-year-active", e2 and e2["active"] == [1956.0, 1956.0])

    e3, r3 = norm_entity({"type": "person", "name": "NoCoords", "lat": 95.0, "lng": 0, "conf": "weird"}, "test")
    check("bad-lat-dropped", e3 and e3["lat"] is None)
    check("conf-defaulted", e3 and e3["conf"] == "inferred" and "conf-defaulted" in r3)

    e4, _ = norm_entity({"type": "bogus", "name": "X", "lat": 1, "lng": 2}, "test")
    check("bad-type-rejected", e4 is None)

    print("== merge_entities ==")
    rep = {"entity_merges": 0, "entity_rejects": []}
    a, _ = norm_entity({"type": "person", "name": "Ada Lovelace", "id": "person-ada-lovelace",
                        "lat": 51.5, "lng": -0.12, "loc": "London, UK", "conf": "known",
                        "cited_in": ["history"], "bibkeys": [], "years": "1815-1852",
                        "active": [1835, 1852], "blurb": "Pioneer of computing."}, "t1")
    b, _ = norm_entity({"type": "person", "name": "ada lovelace", "id": "person-ada-lovelace",
                        "lat": 51.51, "lng": -0.13, "loc": "London", "conf": "stated",
                        "cited_in": ["language", "history"], "bibkeys": ["lovelace1843"],
                        "years": "", "active": [None, None], "blurb": ""}, "t2")
    c, _ = norm_entity({"type": "place", "name": "Paris", "id": "place-paris",
                        "lat": 48.85, "lng": 2.35, "loc": "Paris, France", "conf": "known",
                        "cited_in": ["history"], "bibkeys": [], "years": "", "active": [None, None], "blurb": ""}, "t3")
    d, _ = norm_entity({"type": "place", "name": "Xylos", "id": "place-xylos",
                        "lat": 10.0, "lng": 20.0, "loc": "Xylos", "conf": "known",
                        "cited_in": ["nonexistent-slug"], "bibkeys": [], "years": "",
                        "active": [None, None], "blurb": ""}, "t4")
    merged = merge_entities([a, b, c, d], {"history", "language"}, set(), rep)
    check("merge-count", len(merged) == 3)
    check("merge-union-cited", merged[0]["cited_in"] == ["history", "language"])
    check("merge-conf-wins", merged[0]["conf"] == "stated" and merged[0]["lat"] == 51.51)
    check("merge-bibkeys", merged[0]["bibkeys"] == ["lovelace1843"])
    check("merge-blurb-kept", merged[0]["blurb"] == "Pioneer of computing.")
    xylos = [e for e in merged if e["name"] == "Xylos"][0]
    check("merge-drops-bad-slug", xylos["cited_in"] == [] and
          any(x["name"] == "Xylos" and "slug:nonexistent_slug" in x["dropped"]
              for x in rep["entity_dropped_refs"]))
    rep5 = {}
    m5 = merge_entities([norm_entity({"type": "person", "name": "Z", "id": "p-z", "lat": 1, "lng": 2,
                                      "loc": "Z", "conf": "known", "cited_in": ["history"],
                                      "bibkeys": ["no-such-key", "real-key"], "years": "",
                                      "active": [None, None], "blurb": ""}, "t5")[0]],
                       {"history"}, {"real-key"}, rep5)
    check("bad-bibkey-dropped-not-entity", len(m5) == 1 and m5[0]["bibkeys"] == ["real-key"])
    check("dropped-ref-reported", any("bibkey:no-such-key" in d["dropped"] for d in rep5["entity_dropped_refs"]))
    rep6 = {}
    m6 = merge_entities([norm_entity({"type": "person", "name": "N", "id": "p-n", "lat": None, "lng": None,
                                      "loc": "N", "conf": "known", "cited_in": ["history"],
                                      "bibkeys": [], "years": "", "active": [None, None],
                                      "blurb": ""}, "t6")[0]],
                       {"history"}, set(), rep6)
    check("no-coords-rejected", len(m6) == 0 and len(rep6["entity_rejects"]) == 1)

    print("== is_background_place ==")
    bg_yes = norm_entity({"type": "place", "name": "Canada", "id": "place-canada",
                          "lat": 56.0, "lng": -106.0, "loc": "Canada", "conf": "known",
                          "cited_in": ["global_ai_ecosystem"], "bibkeys": [],
                          "years": "", "active": [None, None], "blurb": ""}, "t7")[0]
    check("bg-list-mention", is_background_place(bg_yes))
    bg_no = norm_entity({"type": "place", "name": "China", "id": "place-china",
                         "lat": 35.0, "lng": 103.0, "loc": "China", "conf": "known",
                         "cited_in": ["global_ai_ecosystem"], "bibkeys": [],
                         "years": "", "active": [None, None],
                         "blurb": "Han-dynasty mathematics."}, "t8")[0]
    check("bg-blurb-exempts", not is_background_place(bg_no))
    bg_no2 = norm_entity({"type": "place", "name": "Zurich", "id": "place-zurich",
                          "lat": 47.4, "lng": 8.5, "loc": "Zurich", "conf": "known",
                          "cited_in": ["global_ai_ecosystem", "history"], "bibkeys": [],
                          "years": "", "active": [None, None], "blurb": ""}, "t9")[0]
    check("bg-second-cite-exempts", not is_background_place(bg_no2))
    bg_no3 = norm_entity({"type": "person", "name": "C", "id": "p-c",
                          "lat": 1.0, "lng": 2.0, "loc": "C", "conf": "known",
                          "cited_in": ["global_ai_ecosystem"], "bibkeys": [],
                          "years": "", "active": [None, None], "blurb": ""}, "t10")[0]
    check("bg-places-only", not is_background_place(bg_no3))

    print("== authors ==")
    rep2 = {"author_row_rejects": [], "author_merges": 0}
    bib = {"authors": {"Ada Lovelace": {"count": 2, "keys": ["lovelace1843", "lovelace1843b"]},
                       "Lovelace, Ada": {"count": 1, "keys": ["lovelace1843c"]}},
           "cites": {"lovelace1843": ["history"], "lovelace1843b": ["language"], "lovelace1843c": ["history"]}}
    rows = [
        (["Ada Lovelace", 51.5, -0.12, "London, UK", 1843, 1], "s"),
        (["ada lovelace", None, None, "", 1843, 0], "s"),
        (["2017)", None, None, "", 1969, 0], "s"),
        (["Thomas Etter)", 48.8, 2.4, "Paris, France", 1900, 1], "s"),
    ]
    auth = merge_authors(rows, bib, rep2)
    by_canon = {x["canon"].casefold(): x for x in auth}
    check("author-dedup", len(auth) == 2)
    check("author-conf1-wins", by_canon["ada lovelace"]["conf"] == 1 and by_canon["ada lovelace"]["lat"] == 51.5)
    check("author-bib-join", by_canon["ada lovelace"]["keys"] == ["lovelace1843", "lovelace1843b"])
    check("author-cited-union", by_canon["ada lovelace"]["cited_in"] == ["history", "language"])
    check("author-garbage-rejected", len(rep2["author_row_rejects"]) == 1)
    check("author-paren-repaired", "thomas etter" in by_canon)

    print("== authors multi-spelling bib join ==")
    bib3 = {"authors": {
        "Robert Hooke (engraving after his own drawing)": {"count": 1, "keys": ["hooke1665"]},
        "Robert Hooke": {"count": 1, "keys": ["hooke1703"]},
    }, "cites": {"hooke1665": ["history"], "hooke1703": ["language"]}}
    rep3 = {"author_row_rejects": [], "author_merges": 0}
    auth3 = merge_authors([(["Robert Hooke", 51.5, -0.1, "London, UK", 1665, 1], "s")], bib3, rep3)
    check("hooke-keys-union", len(auth3) == 1 and
          sorted(auth3[0]["keys"]) == ["hooke1665", "hooke1703"])
    check("hooke-cited-union", auth3[0]["cited_in"] == ["history", "language"])

    print()
    if failures:
        print("TESTS FAILED: %d" % len(failures))
        for f in failures:
            print("  - " + f)
        return 1
    print("ALL TESTS PASSED")
    return 0


# ---------------------------------------------------------------------------
# merge pipeline
# ---------------------------------------------------------------------------

def load_json(path, report, what):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception as ex:
        report["load_errors"].append("%s: %s" % (what, ex))
        return None


def main(argv):
    if "--test" in argv:
        return run_tests()
    if "--merge" not in argv:
        print(__doc__)
        return 2

    raw_dir = RAW_LOCAL if os.path.isdir(RAW_LOCAL) and os.listdir(RAW_LOCAL) else RAW_FALLBACK
    print("raw dir:", raw_dir)

    report = {
        "entity_merges": 0, "entity_rejects": [], "entity_repairs": {},
        "author_merges": 0, "author_row_rejects": [], "author_repairs": {},
        "load_errors": [], "missing_files": [], "coverage_missing": [],
    }

    # --- bibliography ---
    bib = load_json(os.path.join(raw_dir, "bib_parsed.json"), report, "bib_parsed.json")
    if bib is None:
        print("FATAL: bib_parsed.json missing or invalid")
        return 1
    bib_keys = set(bib["entries"].keys())
    print("bib entries: %d, unique author names: %d" % (len(bib["entries"]), len(bib["authors"])))

    # --- valid lesson slugs (published + staged in todo/) ---
    blog_dir = os.path.dirname(HERE)
    slugs = set()
    for d in (blog_dir, os.path.join(blog_dir, "todo")):
        if os.path.isdir(d):
            for f in os.listdir(d):
                if f.endswith(".php"):
                    slugs.add(f[:-4])
    valid_slugs = slugs

    # --- entities --- (any out_part*.json: out_part1.json, out_part7_polar.json, ...)
    entries = []
    entity_files = sorted(glob.glob(os.path.join(raw_dir, "out_part*.json")))
    if not entity_files:
        report["missing_files"].append(os.path.join(raw_dir, "out_part*.json"))
    for p in entity_files:
        fname = os.path.basename(p)
        data = load_json(p, report, fname)
        if data is None:
            continue
        for e in data:
            ne, repairs = norm_entity(e, fname)
            if ne is None:
                report["entity_rejects"].append({"name": e.get("name") if isinstance(e, dict) else None,
                                                 "reason": repairs, "source": fname})
            else:
                for r in repairs:
                    report["entity_repairs"][r] = report["entity_repairs"].get(r, 0) + 1
                entries.append(ne)
    print("entities raw: %d" % len(entries))
    entities = merge_entities(entries, valid_slugs, bib_keys, report)
    print("entities merged: %d (rejected: %d, merges: %d)" %
          (len(entities), len(report["entity_rejects"]), report["entity_merges"]))

    # --- authors --- (any placed_*.json)
    rows = []
    placed_files = sorted(glob.glob(os.path.join(raw_dir, "placed_*.json")))
    if not placed_files:
        report["missing_files"].append(os.path.join(raw_dir, "placed_*.json"))
    for p in placed_files:
        fname = os.path.basename(p)
        data = load_json(p, report, fname)
        if data is None:
            continue
        for row in data:
            rows.append((row, fname))
    print("author rows raw: %d" % len(rows))
    authors = merge_authors(rows, bib, report)
    print("authors merged: %d (rejected rows: %d, merges: %d)" %
          (len(authors), len(report["author_row_rejects"]), report["author_merges"]))

    # coverage: every bib author name must be covered by some placed row (after canon)
    covered = set(x["canon"].casefold() for x in authors)
    covered |= set(x["name"].casefold() for x in authors)
    for v in (x.get("variants") or [] for x in authors):
        for vv in v:
            if not vv.startswith("aka:"):
                covered.add(vv.casefold())
    missing = []
    for bib_name in bib["authors"].keys():
        canon, _ = canonical_author_name(bib_name)
        if not is_plausible_name(canon):
            continue  # broken credit fragments ('et al.', '2017)'…) are not real names
        if bib_name.casefold() not in covered and canon.casefold() not in covered:
            missing.append(bib_name)
    report["coverage_missing"] = missing
    print("author coverage: %d / %d bibliography names covered" %
          (len(bib["authors"]) - len(missing), len(bib["authors"])))

    # --- write outputs ---
    def dump(name, obj):
        path = os.path.join(HERE, name)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, indent=1)
            f.write("\n")
        print("wrote %s (%d bytes)" % (name, os.path.getsize(path)))

    dump("entities.json", entities)
    dump("authors.json", authors)
    dump("bibliography.json", {
        "entries": bib["entries"],
        "cites": bib["cites"],
        "authors": bib["authors"],
    })

    # world geometry (110m Natural Earth) — prefer the source geojson files,
    # fall back to the compact JS asset (keys quoted so the body is JSON).
    world = None
    land_p, bord_p = os.path.join(raw_dir, "ne110_land.geojson"), os.path.join(raw_dir, "ne110_borders.geojson")
    if os.path.exists(land_p) and os.path.exists(bord_p):
        def polys(path, line=False):
            gj = json.load(open(path, encoding="utf-8"))
            r = []
            for f in gj["features"]:
                g = f["geometry"]
                if line:
                    if g["type"] == "LineString":
                        r.append(g["coordinates"])
                    elif g["type"] == "MultiLineString":
                        r.extend(g["coordinates"])
                else:
                    if g["type"] == "Polygon":
                        r.append(g["coordinates"])
                    elif g["type"] == "MultiPolygon":
                        r.extend(g["coordinates"])
            return r
        world = {"land": polys(land_p), "borders": polys(bord_p, line=True)}
    else:
        src = os.path.join(raw_dir, "mapdata_world.js")
        if os.path.exists(src):
            txt = open(src, encoding="utf-8").read()
            body = txt[txt.index("{"):txt.rindex("}") + 1]
            body = re.sub(r"([{,]\s*)([A-Za-z_]\w*)\s*:", r'\1"\2":', body)
            world = json.loads(body)
    if world is None:
        report["missing_files"].append("world geometry (ne110_*.geojson or mapdata_world.js)")
    else:
        dump("world.json", world)

    # report
    dump("merge_report.json", report)

    # copy raw inputs into the repo for provenance
    raw_dst = os.path.join(HERE, "raw")
    if not os.path.isdir(raw_dst):
        os.makedirs(raw_dst)
    copied = 0
    for f in os.listdir(raw_dir):
        if f.endswith(".json") or f.endswith(".md"):
            src = os.path.join(raw_dir, f)
            dst = os.path.join(raw_dst, f)
            if not os.path.exists(dst):
                shutil.copy2(src, dst)
                copied += 1
    print("raw files copied into repo: %d (in %s)" % (copied, raw_dst))

    print()
    print("== REPAIRS ==")
    for k, v in sorted(report["entity_repairs"].items()):
        print("  entity: %-20s %d" % (k, v))
    print("== REJECTED ==")
    for r in report["entity_rejects"][:20]:
        print("  entity-reject:", r)
    for r in report["author_row_rejects"][:20]:
        print("  author-reject:", r)
    if report["missing_files"]:
        print("  missing:", report["missing_files"])
    if report["load_errors"]:
        print("  load-errors:", report["load_errors"])
    if missing:
        print("  coverage missing (%d): %s" % (len(missing), missing[:25]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
