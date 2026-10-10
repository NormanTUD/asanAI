#!/usr/bin/env python3
"""Compute a seeded, size-balanced pairing for one knockout round.

Big files (>= --big KB) never pair with another big file: each big takes the
smallest available partner. Remaining smalls pair among themselves. If the pool
is odd, one file is a "bye" and advances unchanged to the next round.

Usage:
  python3 pair_round.py --pool pool.json --round 1 --seed 20261010 \
      --outdir combined --prefix r1 --big 250
Writes: <outdir>/manifest-r<round>.json

pool.json = array of {"path": ..., "size_kb": ...}
"""
import json, os, random, argparse

ap = argparse.ArgumentParser()
ap.add_argument("--pool", required=True)
ap.add_argument("--round", type=int, required=True)
ap.add_argument("--seed", type=int, required=True)
ap.add_argument("--outdir", required=True)
ap.add_argument("--prefix", required=True)      # e.g. r1
ap.add_argument("--big", type=float, default=250.0)
a = ap.parse_args()

pool = json.load(open(a.pool))
rnd = random.Random(a.seed + a.round * 7919)
rnd.shuffle(pool)

big = sorted([x for x in pool if x["size_kb"] >= a.big], key=lambda x: -x["size_kb"])
small = sorted([x for x in pool if x["size_kb"] < a.big], key=lambda x: x["size_kb"])

pairs, byes = [], []
for i, b in enumerate(big):
    if i < len(small):
        pairs.append([b, small[i]])
# leftover bigs (only if more bigs than smalls)
for i in range(len(small), len(big), 2):
    if i + 1 < len(big):
        pairs.append([big[i], big[i + 1]])
    else:
        byes.append(big[i])
# remaining smalls among themselves
rem = small[len(big):] if len(big) <= len(small) else []
rem = small[len(big):]
for i in range(0, len(rem), 2):
    if i + 1 < len(rem):
        pairs.append([rem[i], rem[i + 1]])
    else:
        byes.append(rem[i])

out_pairs = []
for i, (x, y) in enumerate(pairs, start=1):
    n = f"{i:03d}"
    out_pairs.append({
        "id": i, "no": n,
        "out": f"{a.outdir}/{a.prefix}-{n}.html",
        "meta": f"{a.outdir}/{a.prefix}-{n}.meta.json",
        "a": x["path"], "b": y["path"],
        "size_a": x["size_kb"], "size_b": y["size_kb"],
        "total_kb": round(x["size_kb"] + y["size_kb"], 1),
    })
manifest = {
    "round": a.round, "seed": a.seed, "big_threshold_kb": a.big,
    "method": "seeded-random, size-balanced (big>=threshold always paired with smallest available partner); bye advances unchanged",
    "pool_size": len(pool), "num_pairs": len(out_pairs), "num_byes": len(byes),
    "max_pair_total_kb": max([p["total_kb"] for p in out_pairs], default=0),
    "pairs": out_pairs,
    "byes": [{"path": x["path"], "size_kb": x["size_kb"]} for x in byes],
}
os.makedirs(a.outdir, exist_ok=True)
with open(os.path.join(a.outdir, f"manifest-r{a.round}.json"), "w") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)
print(f"round={a.round} seed={a.seed} pool={len(pool)} pairs={len(out_pairs)} byes={len(byes)} max_pair={manifest['max_pair_total_kb']}kb")
print("big files:", len(big), "small files:", len(small))
for p in out_pairs[:8]:
    print(f"  r{a.round}-{p['no']}: {p['a']} ({p['size_a']})  x  {p['b']} ({p['size_b']})  = {p['total_kb']}kb")
if byes:
    print("byes:", [x['path'] for x in byes])
