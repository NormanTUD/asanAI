#!/usr/bin/env python3
"""Parse literature.js + lesson citations into raw/bib_parsed.json.

Step 1 of the Atlas data pipeline. Run this whenever literature.js or any
lesson's \\cite macros change, then re-run atlas_merge.py --merge.

Usage:
  python3 atlas_parse_bib.py

Output (next to this file, in raw/):
  bib_parsed.json  {"entries": {key: {title, author, year, url}},
                    "cites":   {key: [slugs citing it]},
                    "authors": {name: {count, minyear, maxyear, keys}}}
"""

import collections
import glob
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
BLOG = os.path.dirname(HERE)
OUT = os.path.join(HERE, "raw", "bib_parsed.json")

SKIP_SLUGS = {"functions", "index", "index_full", "search_lib",
              "asanai_blog_proxy", "mobile-loader", "mobile-prepend", "image"}


def parse_entries(content):
    """Top-level keys of bibData: lines of the form  \t"key": {"""
    starts = [(m.group(1), m.start()) for m in
              re.finditer(r'\n\t"([^"]+)"\s*:\s*\{', content)]
    parsed = {}
    for n, (key, pos) in enumerate(starts):
        end = starts[n + 1][1] if n + 1 < len(starts) else len(content)
        body = content[pos:end]

        def grab(field):
            m = re.search(field + r'\s*:\s*"([^"]*)"', body)
            return m.group(1) if m else None

        title, author, year, url = grab("title"), grab("author"), grab("year"), grab("url")
        if title is None and author is None:
            continue
        parsed[key] = {"title": title or "", "author": author or "",
                       "year": year or "", "url": url or ""}
    return parsed


def parse_cites():
    """Map each bib key to the lesson slugs that cite it."""
    cites = collections.defaultdict(set)
    cite_re = re.compile(
        r'\\(?:cite|footcite|citet|citeauthor|citetitle|citeyear|citeurl'
        r'|citeauthorlastnameand|citealternativetitle|citeauthorlastname)\b'
        r'(?:\[[^\]]*\])?\{([^}]+)\}')
    for f in glob.glob(os.path.join(BLOG, "*.php")):
        slug = os.path.basename(f)[:-4]
        if slug in SKIP_SLUGS:
            continue
        txt = open(f, encoding="utf-8", errors="replace").read()
        for m in cite_re.finditer(txt):
            for k in m.group(1).split(","):
                cites[k.strip()].add(slug)
    return {k: sorted(v) for k, v in cites.items()}


def parse_authors(parsed):
    authors = {}
    for key, e in parsed.items():
        for part in e["author"].split(","):
            part = part.strip()
            if not part:
                continue
            a = authors.setdefault(part, {"keys": [], "years": []})
            a["keys"].append(key)
            if e["year"] and e["year"].isdigit():
                a["years"].append(int(e["year"]))
    out = {}
    for name, a in authors.items():
        a["years"] = sorted(set(a["years"]))
        out[name] = {
            "count": len(a["keys"]),
            "minyear": a["years"][0] if a["years"] else None,
            "maxyear": a["years"][-1] if a["years"] else None,
            "keys": a["keys"],
        }
    return out


def main():
    content = open(os.path.join(BLOG, "literature.js"), encoding="utf-8").read()
    entries = parse_entries(content)
    out = {
        "entries": entries,
        "cites": parse_cites(),
        "authors": parse_authors(entries),
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print("bib_parsed.json written: %d entries, %d unique author names, "
          "%d cited keys" % (len(entries), len(out["authors"]), len(out["cites"])))


if __name__ == "__main__":
    main()
