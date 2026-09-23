#!/usr/bin/env python3
"""Independent check of the merged Atlas JSON (separate from atlas_merge.py).

Usage: python3 atlas_check.py
Exit 0 = all checks pass.
"""

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BLOG = os.path.dirname(HERE)
FAILS = []


def check(label, cond, detail=""):
    print(("  ok  " if cond else " FAIL ") + label + (("  [%s]" % detail) if detail and not cond else ""))
    if not cond:
        FAILS.append(label)


def load(name):
    p = os.path.join(HERE, name)
    if not os.path.exists(p):
        check("%s exists" % name, False)
        return None
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def main():
    ents = load("entities.json")
    authors = load("authors.json")
    bib = load("bibliography.json")
    world = load("world.json")
    threads = load("threads.json")
    if ents is None or authors is None or bib is None or world is None:
        print("cannot continue, missing files")
        return 1

    slugs = {f[:-4] for f in os.listdir(BLOG) if f.endswith(".php")}
    todo_dir = os.path.join(BLOG, "todo")
    if os.path.isdir(todo_dir):
        slugs |= {f[:-4] for f in os.listdir(todo_dir) if f.endswith(".php")}
    bib_keys = set(bib["entries"].keys())

    print("== entities.json (%d) ==" % len(ents))
    ids = set()
    pairs = set()
    ok_fields = ok_coords = ok_conf = ok_slug = ok_key = 0
    for e in ents:
        if all(k in e for k in ("id", "name", "type", "loc", "lat", "lng", "years",
                                "active", "blurb", "cited_in", "bibkeys", "conf")):
            ok_fields += 1
        if (-90 <= e["lat"] <= 90) and (-180 <= e["lng"] <= 180):
            ok_coords += 1
        if e["conf"] in ("stated", "known", "inferred"):
            ok_conf += 1
        if all(s in slugs for s in e["cited_in"]):
            ok_slug += 1
        if all(k in bib_keys for k in e["bibkeys"]):
            ok_key += 1
        ids.add(e["id"])
        pairs.add((e["type"], e["name"].casefold()))
    n = len(ents)
    check("all fields present", ok_fields == n, "%d/%d" % (ok_fields, n))
    check("coords in range", ok_coords == n, "%d/%d" % (ok_coords, n))
    check("conf values", ok_conf == n, "%d/%d" % (ok_conf, n))
    check("cited_in slugs exist", ok_slug == n, "%d/%d" % (ok_slug, n))
    check("bibkeys exist", ok_key == n, "%d/%d" % (ok_key, n))
    check("ids unique", len(ids) == n, "%d/%d" % (len(ids), n))
    check("no dup (type,name)", len(pairs) == n, "%d/%d" % (len(pairs), n))
    check("all types valid", all(e["type"] in ("person", "place", "institution", "event", "artifact") for e in ents))

    print("== authors.json (%d) ==" % len(authors))
    canons = set()
    ok_shape = ok_conf1 = ok_conf0 = ok_year = ok_bib = 0
    for a in authors:
        if all(k in a for k in ("name", "canon", "lat", "lng", "city", "year", "conf", "works", "keys", "cited_in")):
            ok_shape += 1
        if a["conf"] == 1 and a["lat"] is not None and a["lng"] is not None and a["city"]:
            ok_conf1 += 1
        if a["conf"] == 0 and a["lat"] is None and a["lng"] is None:
            ok_conf0 += 1
        if a["year"] is None or (isinstance(a["year"], (int, float)) and -5000 <= a["year"] <= 2030):
            ok_year += 1
        if all(k in bib_keys for k in a["keys"]):
            ok_bib += 1
        canons.add(a["canon"].casefold())
    n = len(authors)
    check("all fields present", ok_shape == n, "%d/%d" % (ok_shape, n))
    check("conf=1 => placed + city", ok_conf1 == sum(1 for a in authors if a["conf"] == 1),
          "%d/%d" % (ok_conf1, sum(1 for a in authors if a["conf"] == 1)))
    check("conf=0 => unplaced", ok_conf0 == sum(1 for a in authors if a["conf"] == 0),
          "%d/%d" % (ok_conf0, sum(1 for a in authors if a["conf"] == 0)))
    check("years sane", ok_year == n, "%d/%d" % (ok_year, n))
    check("keys exist in bib", ok_bib == n, "%d/%d" % (ok_bib, n))
    check("canon unique", len(canons) == n, "%d/%d" % (len(canons), n))

    print("== coverage vs bibliography ==")
    sys.path.insert(0, HERE)
    from atlas_merge import canonical_author_name, is_plausible_name
    bib_names = list(bib["authors"].keys())
    raw_names = set(a["name"].casefold() for a in authors)
    raw_names |= set(a["canon"].casefold() for a in authors)
    for a in authors:
        for v in (a.get("variants") or []):
            if not v.startswith("aka:"):
                raw_names.add(v.casefold())
    uncovered = []
    for b in bib_names:
        canon, _ = canonical_author_name(b)
        if not is_plausible_name(canon):
            continue  # broken credit fragments, not real names
        if b.casefold() not in raw_names and canon.casefold() not in raw_names:
            uncovered.append(b)
    check("every bib author name covered", len(uncovered) == 0, str(uncovered[:10]))
    total_keys = set()
    for a in authors:
        total_keys |= set(a["keys"])
    # keys owned only by implausible names (image-credit usernames, empty
    # authors) can never be author rows — exclude them from the expectation.
    expected_keys = set()
    for name, a in bib["authors"].items():
        canon, _ = canonical_author_name(name)
        if is_plausible_name(canon):
            expected_keys |= set(a["keys"])
    missing = expected_keys - total_keys
    check("all plausible bib keys reachable via authors", len(missing) == 0,
          str(sorted(missing)[:10]))

    print("== bibliography.json ==")
    check("entries == 2068", len(bib["entries"]) == 2068, str(len(bib["entries"])))
    cites_ok = all(all(s in slugs for s in v) for v in bib["cites"].values())
    check("cites slugs exist", cites_ok)

    print("== world.json ==")
    land, borders = world["land"], world["borders"]
    def in_range(rings):
        for ring in rings:
            for pt in ring:
                if not (-180 <= pt[0] <= 180 and -90 <= pt[1] <= 90):
                    return False
        return True
    check("land polys in range", all(in_range(p) for p in land), "%d polys" % len(land))
    check("borders in range", all(in_range([b]) for b in borders), "%d lines" % len(borders))

    print("== threads.json ==")
    if threads is not None:
        eid = {e["id"] for e in ents}
        n = len(threads)
        bad_refs = 0
        ok_shape = 0
        for t in threads:
            refs = [t.get("from"), t.get("to"), t.get("person")]
            refs += t.get("path", [])
            if all(r in eid for r in refs if r is not None) and "kind" in t:
                ok_shape += 1
            else:
                bad_refs += 1
        check("threads present", n >= 100, str(n))
        check("thread refs resolve to entities", bad_refs == 0, "%d bad" % bad_refs)
        check("thread shape valid", ok_shape == n, "%d/%d" % (ok_shape, n))
        kinds = {}
        for t in threads:
            kinds[t.get("kind")] = kinds.get(t.get("kind"), 0) + 1
        print("   kinds:", kinds)
    else:
        check("threads present", False)

    print("== provenance ==")
    raw = os.path.join(HERE, "raw")
    for f in ("out_part1.json", "out_part2.json", "out_part3.json", "out_part4.json",
              "out_part5.json", "out_part6.json", "out_part7_polar.json",
              "out_part8.json", "placed_1.json", "placed_2.json",
              "placed_3.json", "placed_4.json", "placed_5.json", "placed_6.json",
              "placed_7.json", "placed_8.json",
              "authors_chunk_1.json", "authors_chunk_2.json", "authors_chunk_3.json",
              "authors_chunk_4.json", "authors_chunk_5.json", "authors_chunk_6.json",
              "bib_parsed.json", "ne110_land.geojson", "ne110_borders.geojson"):
        check("raw/%s" % f, os.path.exists(os.path.join(raw, f)))

    print()
    if FAILS:
        print("CHECK FAILED: %d problem(s)" % len(FAILS))
        return 1
    print("ALL CHECKS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
