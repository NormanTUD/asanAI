#!/usr/bin/env python3
"""Consolidate per-batch records into index.json + classification.json.
Dedupe by path. Normalize 'theme' (strip any comma-list to first token).
Write: index.json (all records), classification.json (ki/nicht-ki pools).
Print: counts + thin-file report.
"""
import json, glob, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))  # blog/test

recs = []
for f in sorted(glob.glob(os.path.join(HERE, "records", "batch*.json"))):
    recs += json.load(open(f))

seen = {}
for r in recs:
    seen[r["path"]] = r
recs = list(seen.values())

def norm_theme(t):
    if not t:
        return ""
    t = t.split(",")[0].strip()
    t = t.replace(" ", "-").replace("_", "-")
    return t.lower()

for r in recs:
    r["theme"] = norm_theme(r.get("theme", ""))
    if "themes" in r:
        r["themes"] = [norm_theme(x) for x in r["themes"] if x]
    # ensure size_kb present
    r.setdefault("size_kb", 0)

index = sorted(recs, key=lambda r: (r["category"] != "ki", r["path"]))
with open(os.path.join(HERE, "index.json"), "w") as f:
    json.dump(index, f, indent=2, ensure_ascii=False)

ki = [r for r in recs if r["category"] == "ki"]
nk = [r for r in recs if r["category"] == "nicht-ki"]
classification = {
    "counts": {"total": len(recs), "ki": len(ki), "nicht-ki": len(nk)},
    "ki": [r["path"] for r in sorted(ki, key=lambda r: r["path"])],
    "nicht-ki": [r["path"] for r in sorted(nk, key=lambda r: r["path"])],
}
with open(os.path.join(HERE, "classification.json"), "w") as f:
    json.dump(classification, f, indent=2, ensure_ascii=False)

THIN = 15.0  # KB
print(f"total={len(recs)}  ki={len(ki)}  nicht-ki={len(nk)}")
ki_thin = [r for r in ki if r.get("size_kb", 0) < THIN]
print(f"\nKI files < {THIN}KB (candidates to exclude from knockout as stubs): {len(ki_thin)}")
for r in sorted(ki_thin, key=lambda r: r.get("size_kb", 0)):
    print(f"  {r.get('size_kb',0):6.1f}  {r['path']}   :: {r.get('thesis','')[:70]}")
print(f"\nKI files >= {THIN}KB (knockout pool): {len(ki)-len(ki_thin)}")
nk_thin = [r for r in nk if r.get("size_kb", 0) < THIN]
print(f"nicht-KI files < {THIN}KB: {len(nk_thin)}")
