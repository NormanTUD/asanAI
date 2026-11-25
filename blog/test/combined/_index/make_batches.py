#!/usr/bin/env python3
"""Bin-pack all *.html files (recursive, this dir) into balanced read-batches.
Target ~1MB total per batch, max 14 files/batch. Sort desc, first-fit-decreasing.
Outputs: all_files.json  +  batches.json  (both in this _index dir).
"""
import os, json, glob

HERE = os.path.dirname(os.path.abspath(__file__))       # .../blog/test/combined/_index
COMBINED = os.path.dirname(HERE)                          # .../blog/test/combined
ROOT = os.path.dirname(COMBINED)                          # .../blog/test

TARGET = 1_000_000
MAXFILES = 14

files = []
for p in glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True):
    rel = os.path.relpath(p, ROOT)
    if os.path.abspath(os.path.dirname(HERE)) in p:
        continue  # skip our own generated tree (none yet, but be safe)
    files.append((rel, os.path.getsize(p)))

files.sort(key=lambda x: (-x[1], x[0]))

batches = []
for rel, sz in files:
    placed = False
    for b in batches:
        if b["size"] + sz <= TARGET and len(b["files"]) < MAXFILES:
            b["files"].append({"path": rel, "size_kb": round(sz/1024,1)})
            b["size"] += sz
            placed = True
            break
    if not placed:
        batches.append({"size": sz, "files": [{"path": rel, "size_kb": round(sz/1024,1)}]})

for i, b in enumerate(batches):
    b["id"] = i
    b["total_kb"] = round(b["size"]/1024,1)
    # order: id, total_kb, files
    batches[i] = {"id": i, "total_kb": b["total_kb"], "files": b["files"]}

all_files = [{"path": r, "size_kb": round(s/1024,1)} for r, s in files]

with open(os.path.join(HERE, "all_files.json"), "w") as f:
    json.dump({"count": len(all_files), "total_kb": round(sum(s for _,s in files)/1024,1),
               "files": all_files}, f, indent=2)
with open(os.path.join(HERE, "batches.json"), "w") as f:
    json.dump({"count": len(batches), "target_kb": TARGET//1024, "max_files": MAXFILES,
               "batches": batches}, f, indent=2)

print(f"files={len(all_files)} total_kb={round(sum(s for _,s in files)/1024)} batches={len(batches)}")
sizes = [b["total_kb"] for b in batches]
print(f"batch sizes kb: min={min(sizes)} max={max(sizes)} avg={round(sum(sizes)/len(sizes))}")
bigfiles = [f for f in all_files if f["size_kb"] > 200]
print(f"files >200kb: {len(bigfiles)}")
