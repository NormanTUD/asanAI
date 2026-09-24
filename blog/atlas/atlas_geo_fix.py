#!/usr/bin/env python3
"""Atlas coordinate re-geocoding.

The Atlas dots were placed by hand by workers, so many are only "vaguely"
right (a Göttingen dot in Schleswig-Holstein, a Cambridge dot in the wrong
Cambridge, ...). This script re-geocodes every distinct location string
(`loc`) with a real geocoder (OpenStreetMap Nominatim) and writes the result
back into the raw entity files, which are the pipeline's source of truth.

Pipeline role: run this *before* atlas_merge.py --merge. It edits the raw
out_part*.json coordinates in place; the merge then carries the corrected
coordinates through unchanged.

Usage (from blog/):
    python3 atlas/atlas_geo_fix.py geocode   # geocode every distinct loc (cached)
    python3 atlas/atlas_geo_fix.py apply     # patch raw out_part*.json from the cache
    python3 atlas/atlas_geo_fix.py report    # summarise how many dots moved

The geocoder is a polite Nominatim client: 1 request/second, a descriptive
User-Agent, per-request timeout, and retries with backoff on 429/5xx.
Every successful lookup is cached to raw/geo_cache.json so a re-run is
instant and a network interruption never loses progress.
"""

import collections
import glob
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
CACHE = os.path.join(RAW, "geo_cache.json")
ENTITIES = os.path.join(HERE, "entities.json")

UA = "asanai-atlas-geo-fix/1.0 (one-off coordinate correction; contact: norman@scads.ai)"
NOMINATIM = "https://nominatim.openstreetmap.org/search"
REQ_DELAY = 1.05          # Nominatim usage policy: <= 1 request/second
REQ_TIMEOUT = 12
RETRIES = 4


# ---------------------------------------------------------------------------
# normalisation
# ---------------------------------------------------------------------------

def norm_query(s):
    """Canonical form of a loc string, used as the cache/apply key."""
    s = (s or "").strip()
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"\s+", " ", s).lower()
    return s


# ---------------------------------------------------------------------------
# geocoder
# ---------------------------------------------------------------------------

def nominatim(q):
    """Return (lat, lng, label) for a query, or None if it cannot be resolved."""
    url = NOMINATIM + "?" + urllib.parse.urlencode(
        {"q": q, "format": "jsonv2", "limit": 1, "addressdetails": 0})
    for attempt in range(RETRIES):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            data = json.load(urllib.request.urlopen(req, timeout=REQ_TIMEOUT))
            if data and data[0].get("lat") and data[0].get("lon"):
                return (float(data[0]["lat"]), float(data[0]["lon"]),
                        data[0].get("display_name", "")[:80])
            return None
        except Exception as ex:
            code = getattr(ex, "code", None)
            if code in (429, 503):                       # rate limit / overload
                time.sleep(3 * (attempt + 1))
                continue
            if code is None:                              # network blip
                time.sleep(2 * (attempt + 1))
                continue
            return None
    return None


def load_cache():
    if os.path.exists(CACHE):
        with open(CACHE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache):
    tmp = CACHE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write("\n")
    os.replace(tmp, CACHE)


def distinct_queries():
    """All distinct non-empty loc strings in the merged entities (the work unit)."""
    if not os.path.exists(ENTITIES):
        print("FATAL: entities.json missing — run atlas_merge.py --merge first")
        sys.exit(1)
    ents = json.load(open(ENTITIES, encoding="utf-8"))
    q = {}
    for e in ents:
        loc = (e.get("loc") or "").strip()
        if not loc:
            continue
        k = norm_query(loc)
        q.setdefault(k, {"query": loc, "count": 0,
                         "cur": [e.get("lat"), e.get("lng")]})
        q[k]["count"] += 1
    return q


def cmd_geocode(limit=None):
    cache = load_cache()
    queries = distinct_queries()
    items = list(queries.items())
    if limit:
        items = items[:limit]
    todo = [k for (k, _v) in items if k not in cache]
    print("distinct locs: %d | already cached: %d | to fetch: %d" %
          (len(items), len(items) - len(todo), len(todo)))
    for i, k in enumerate(todo, 1):
        q = queries[k]["query"]
        res = nominatim(q)
        cache[k] = {"query": q, "lat": res[0], "lng": res[1],
                    "label": res[2]} if res else {"query": q, "lat": None, "lng": None,
                                                   "label": None, "failed": True}
        mark = "ok   " if res else "FAIL "
        print("[%3d/%3d] %s %s -> %s" %
              (i, len(todo), mark, q, ("%.4f,%.4f" % (res[0], res[1])) if res else "-"))
        if i % 10 == 0:
            save_cache(cache)
        time.sleep(REQ_DELAY)
    save_cache(cache)
    failed = [v["query"] for v in cache.values() if v.get("failed")]
    print("\nDONE. cached=%d failed=%d" % (len(cache), len(failed)))
    if failed:
        print("failed queries:", failed)


# ---------------------------------------------------------------------------
# plausibility gate
#
# A raw Nominatim answer is only trusted when the location string names a
# concrete region and the returned point actually falls inside it. Bare names
# ("Syracuse", "Miletus"), organisations ("CERN", "Alibaba") and region strings
# ("Central Europe") are NOT disambiguated by Nominatim and frequently resolve
# to a wrong-country namesake — for those we keep the worker's original
# coordinates rather than risk a gross error.
#
# BBOX[tail] = (min_lat, max_lat, min_lng, max_lng)  [degrees]
# ---------------------------------------------------------------------------

BBOX = {
    # sovereign countries
    "afghanistan": (29.3, 38.5, 59.5, 75.1), "alabama": (30.1, 35.0, -88.5, -84.9),
    "antarctica": (-90.0, -60.0, -180.0, 180.0), "argentina": (-55.6, -21.8, -73.6, -53.6),
    "arizona": (31.2, 37.1, -114.3, -108.9), "australia": (-44.0, -9.0, 112.5, 154.0),
    "austria": (46.3, 49.0, 9.5, 17.1), "azerbaijan": (38.3, 42.1, 44.4, 51.7),
    "belarus": (51.2, 56.2, 23.0, 32.8), "belgium": (49.4, 51.6, 2.4, 6.5),
    "bulgaria": (41.1, 44.3, 22.3, 28.7), "california": (32.5, 42.1, -124.5, -114.0),
    "canada": (41.5, 83.0, -141.0, -52.0), "china": (18.0, 53.6, 73.5, 135.1),
    "colombia": (-4.3, 12.6, -81.7, -66.9), "connecticut": (40.98, 42.1, -73.75, -71.75),
    "czech republic": (48.5, 51.1, 12.0, 18.9), "denmark": (54.5, 58.0, 7.5, 13.0),
    "dr congo": (-14.0, 5.0, 12.0, 32.0), "egypt": (21.8, 31.8, 24.7, 36.9),
    "england": (49.8, 55.2, -5.2, 2.0), "eswatini": (-27.3, -25.4, 30.4, 32.2),
    "finland": (59.8, 70.0, 19.5, 31.6), "florida": (24.5, 31.0, -87.7, -80.0),
    "france": (41.0, 51.2, -5.0, 9.5), "french guiana": (2.0, 6.0, -55.0, -51.0),
    "germany": (47.0, 55.5, 5.5, 15.5), "greece": (34.7, 41.8, 19.2, 26.7),
    "greenland": (59.8, 83.7, -74.0, -11.0), "hungary": (45.7, 48.7, 15.9, 22.9),
    "illinois": (36.9, 42.5, -91.6, -87.5), "india": (6.5, 37.0, 68.0, 97.5),
    "indonesia": (-11.0, 6.0, 94.6, 141.0), "iran": (25.0, 40.0, 44.0, 63.4),
    "iraq": (28.9, 37.4, 38.8, 48.9), "ireland": (51.2, 55.6, -10.5, -5.0),
    "israel": (29.4, 33.4, 34.2, 35.6), "italy": (36.5, 47.2, 6.0, 18.7),
    "japan": (30.9, 45.6, 128.8, 146.0), "kazakhstan": (40.0, 55.6, 46.0, 88.0),
    "kenya": (-4.7, 5.0, 33.8, 42.0), "maryland": (37.9, 39.75, -79.5, -75.0),
    "massachusetts": (41.2, 42.9, -73.55, -69.7), "michigan": (41.6, 48.4, -90.5, -82.1),
    "missouri": (35.9, 40.7, -94.7, -89.1), "morocco": (27.5, 35.9, -13.2, -1.0),
    "namibia": (-28.9, -16.9, 11.4, 25.3), "nepal": (26.3, 30.5, 80.0, 88.2),
    "netherlands": (50.7, 53.6, 3.3, 7.3), "new hampshire": (42.7, 45.3, -72.55, -70.7),
    "new hawaii": (18.9, 22.3, -160.6, -154.8), "new haven": (41.2, 41.45, -73.0, -72.8),
    "new jersey": (38.9, 41.5, -75.65, -73.9), "new mexico": (31.7, 37.1, -109.1, -102.9),
    "new york": (40.4, 45.1, -79.95, -71.75), "norway": (57.8, 71.2, 4.5, 31.0),
    "ohio": (38.3, 41.95, -84.9, -80.5), "oregon": (41.8, 46.3, -124.7, -116.4),
    "pennsylvania": (39.7, 42.85, -80.6, -74.6), "poland": (48.9, 54.9, 14.0, 24.2),
    "rhode island": (41.05, 42.1, -71.95, -71.1), "romania": (43.5, 48.4, 20.0, 29.9),
    "russia": (41.0, 82.0, 19.0, 180.0), "russia)": (41.0, 82.0, 19.0, 180.0),
    "scotland": (54.5, 60.8, -8.6, -1.8), "sicily": (36.6, 38.3, 12.3, 15.7),
    "singapore": (1.15, 1.50, 103.55, 104.15), "south africa": (-34.9, -22.1, 16.4, 32.9),
    "south korea": (33.0, 39.0, 125.0, 131.0), "spain": (36.0, 43.8, -9.5, 3.3),
    "sweden": (55.2, 69.0, 11.0, 24.2), "switzerland": (45.8, 47.9, 5.9, 10.5),
    "tanzania": (-11.7, 1.8, 29.3, 40.6), "tennessee": (34.9, 36.7, -90.3, -81.6),
    "texas": (25.8, 36.6, -106.7, -93.5), "turkey": (35.8, 42.1, 25.5, 45.0),
    "uganda": (-1.4, 4.2, 29.5, 35.0), "uk": (49.8, 60.8, -8.6, 2.0),
    "ukraine": (44.0, 52.4, 22.0, 40.4), "united arab emirates": (22.5, 26.5, 51.5, 56.6),
    "united kingdom": (49.8, 60.8, -8.6, 2.0),
    "western australia": (-39.5, -11.0, 112.5, 129.5), "washington": (45.5, 49.0, -124.9, -116.9),
    "wisconsin": (42.5, 47.3, -92.9, -86.2), "virginia": (36.5, 39.5, -83.7, -75.2),
    # cities used as the region tail
    "athens": (37.88, 38.15, 23.55, 24.00), "brno": (48.95, 49.50, 16.40, 17.10),
    "cairo": (29.78, 30.15, 31.05, 31.65), "istanbul": (40.90, 41.35, 28.65, 29.40),
    "london": (51.25, 51.80, -0.60, 0.35), "munich": (47.95, 48.45, 11.25, 11.80),
    "paris": (48.78, 49.00, 2.15, 2.55), "d.c.": (38.75, 39.0, -77.25, -76.85),
}

# tails we deliberately do NOT re-geocode (Nominatim is unreliable for these):
KEEP_ORIGINAL = {"us", "usa", "united states", "europe", "southeast europe",
                 "southern europe", "atlantic ocean", "moon"}

BBOX_MARGIN = 1.0


# Historical place names that Nominatim resolves poorly (it returns a
# wrong-country namesake or the country capital). We re-geocode them through
# their well-established modern equivalent — a fact, not a guess — and store
# the result as an authoritative override.
HISTORICAL = {
    "konigsberg, germany": "Kaliningrad, Russia",
    "konigsberg, prussia (now kaliningrad, russia)": "Kaliningrad, Russia",
    "breslau, germany": "Wroclaw, Poland",
    "nicaea, turkey": "Iznik, Turkey",
    "pergamon, turkey": "Bergama, Turkey",
    "elea, italy": "Velia, Italy",
    "naumburg, germany": "Naumburg (Saale), Germany",
    "abdera, greece": "Abdara, Greece",
    "croton, italy": "Crotone, Italy",
    "croton (crotone), calabria, italy": "Crotone, Italy",
    "antikythera, greece": "Antikythera Island, Greece",
    "cueva de las manos, patagonia, argentina": "Cueva de las Manos, Argentina",
}

OVERRIDE = os.path.join(RAW, "geo_override.json")


def load_override():
    if os.path.exists(OVERRIDE):
        with open(OVERRIDE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def cmd_regeo():
    """Fetch authoritative coords for HISTORICAL places via modern names."""
    ov = load_override()
    for hist, modern in HISTORICAL.items():
        key = norm_query(hist)
        if key in ov and ov[key].get("lat") is not None:
            print("  have %-40s -> %s" % (hist, ov[key]["label"][:40]))
            continue
        res = nominatim(modern)
        if res:
            ov[key] = {"query": modern, "lat": res[0], "lng": res[1], "label": res[2]}
            print("  ok   %-40s <- %s -> %.4f,%.4f" % (hist, modern, res[0], res[1]))
        else:
            ov[key] = {"query": modern, "lat": None, "lng": None, "label": None,
                       "failed": True}
            print("  FAIL %-40s <- %s" % (hist, modern))
        time.sleep(REQ_DELAY)
    tmp = OVERRIDE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(ov, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write("\n")
    os.replace(tmp, OVERRIDE)
    print("override entries: %d" % len(ov))


def should_apply(query, lat, lng):
    """Return (apply?, why) — a geocoded point is trusted only if the loc names
    a concrete region and the point actually falls inside it."""
    if lat is None or lng is None:
        return False, "no-result"
    q = query.strip()
    if "," not in q:
        return False, "bare-name"
    tail = q.split(",")[-1].strip().lower()
    if tail in KEEP_ORIGINAL:
        return False, "keep:" + tail
    bb = BBOX.get(tail)
    if bb is None:
        return False, "unknown-tail:" + tail
    ml, ML, mn, mx = bb
    if ml - BBOX_MARGIN <= lat <= ML + BBOX_MARGIN and \
       mn - BBOX_MARGIN <= lng <= mx + BBOX_MARGIN:
        return True, tail
    return False, "off-region(%s)" % tail


def entity_loc(e):
    loc = e.get("loc")
    if isinstance(loc, str) and loc.strip():
        return loc
    return None


def get_coords(e):
    if isinstance(e.get("location"), dict):
        return e["location"]["lat"], e["location"].get("lon", e["location"].get("lng"))
    return e.get("lat"), e.get("lng")


def set_coords(e, lat, lng):
    if isinstance(e.get("location"), dict):
        e["location"]["lat"] = lat
        if "lon" in e["location"]:
            e["location"]["lon"] = lng
        elif "lng" in e["location"]:
            e["location"]["lng"] = lng
        else:
            e["location"]["lon"] = lng
    else:
        e["lat"] = lat
        e["lng"] = lng


def dist_km(a, b, c, d):
    return ((a - c) ** 2 + ((b - d) * 0.65) ** 2) ** 0.5 * 111.0


def compute_modes(points_by_loc):
    """For each loc, find a dominant cluster (0.5 deg buckets) that is a clear
    majority; return {loc_norm: (mean_lat, mean_lng)} of that cluster.

    A loc is only treated as ONE place if its members are tightly clustered
    (<~150 km). A bare country/region loc shared by entities at many different
    cities (e.g. "United States") is scattered and must NOT be collapsed to a
    centroid.
    """
    modes = {}
    for ln, pts in points_by_loc.items():
        if len(pts) < 3:
            continue
        lats = [a for a, _ in pts]
        lngs = [b for _, b in pts]
        # single-place guard: the whole group must be compact
        if max(lats) - min(lats) > 1.5 or max(lngs) - min(lngs) > 2.0:
            continue
        bc = collections.Counter((round(a * 2) / 2, round(b * 2) / 2) for a, b in pts)
        (bk), cnt = bc.most_common(1)[0]
        if cnt < 2 or cnt * 2 <= len(pts):
            continue
        members = [p for p in pts if (round(p[0] * 2) / 2, round(p[1] * 2) / 2) == bk]
        ml = sum(a for a, _ in members) / len(members)
        mo = sum(b for _, b in members) / len(members)
        modes[ln] = (ml, mo)
    return modes


def resolve(cache, override, loc, exlat, exlng):
    """Return (lat,lng,why) to set, or None to keep the original coord.

    Priority: 1) curated historical override, 2) Nominatim small refinement
    (<25 km, a same-city centre nudge). Larger jumps are left to the
    consistency pass / kept as-is, because a big Nominatim jump usually means
    a region centroid or a wrong-country namesake.
    """
    if not loc:
        return None
    k = norm_query(loc)
    ov = override.get(k)
    if ov and ov.get("lat") is not None:
        ok, _why = should_apply(loc, ov["lat"], ov["lng"])
        if ok:
            return (ov["lat"], ov["lng"], "override")
        return None
    rec = cache.get(k)
    if rec and rec.get("lat") is not None:
        ok, _why = should_apply(loc, rec["lat"], rec["lng"])
        if not ok:
            return None
        if exlat is not None and dist_km(exlat, exlng, rec["lat"], rec["lng"]) < 25:
            return (rec["lat"], rec["lng"], "refine")
    return None


def _collect_points(data_list):
    pts = collections.defaultdict(list)
    for data in data_list:
        for e in data:
            loc = entity_loc(e)
            if not loc:
                continue
            la, lo = get_coords(e)
            if la is None or lo is None:
                continue
            pts[norm_query(loc)].append((la, lo))
    return pts


def decide(e, cache, override, modes):
    loc = entity_loc(e)
    if not loc:
        return None
    k = norm_query(loc)
    exlat, exlng = get_coords(e)
    res = resolve(cache, override, loc, exlat, exlng)
    if res is not None:
        return res
    if k in modes:
        ml, mo = modes[k]
        if exlat is not None and dist_km(exlat, exlng, ml, mo) > 15:
            return (ml, mo, "consistency")
    return None


def cmd_apply(dry=False):
    if not os.path.exists(CACHE):
        print("FATAL: geo_cache.json missing — run geocode first")
        sys.exit(1)
    cache = load_cache()
    override = load_override()
    files = sorted(glob.glob(os.path.join(RAW, "out_part*.json")))
    data_list = [json.load(open(p, encoding="utf-8")) for p in files]
    modes = compute_modes(_collect_points(data_list))
    changed = collections.Counter()
    touched = 0
    for p, data in zip(files, data_list):
        file_changed = False
        for e in data:
            res = decide(e, cache, override, modes)
            if res is None:
                continue
            lat, lng, why = res
            cur = get_coords(e)
            if cur[0] is not None and abs(cur[0] - lat) < 0.005 and \
               abs((cur[1] if cur[1] is not None else 0) - lng) < 0.005:
                continue
            set_coords(e, round(lat, 4), round(lng, 4))
            changed[why] += 1
            file_changed = True
        if file_changed:
            touched += 1
            if not dry:
                tmp = p + ".tmp"
                with open(tmp, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=1)
                    f.write("\n")
                os.replace(tmp, p)
    print("raw files: %d | changed: %d | by reason: %s" %
          (len(files), touched, dict(changed)))


def cmd_report():
    cache = load_cache()
    override = load_override()
    ents = json.load(open(ENTITIES, encoding="utf-8"))
    modes = compute_modes(_collect_points([[e for e in ents]]))
    bywhy = collections.Counter()
    big = []
    for e in ents:
        loc = (e.get("loc") or "").strip()
        res = decide(e, cache, override, modes)
        if res is None:
            continue
        lat, lng, why = res
        dlat = (e["lat"] or 0) - lat
        dlng = (e["lng"] or 0) - lng
        bywhy[why] += 1
        dist = dist_km(e["lat"], e["lng"], lat, lng)
        if abs(dlat) > 0.05 or abs(dlng) > 0.05:
            if dist > 80:
                big.append((round(dist), e["name"], e["loc"], why,
                            (e["lat"], e["lng"]), (lat, lng)))
    print("total changed: %d  by reason: %s" % (sum(bywhy.values()), dict(bywhy)))
    print("moves >80 km: %d" % len(big))
    big.sort(reverse=True)
    for dist, name, loc, why, old, new in big:
        print("  ~%5d km [%-11s] %-26s %-24s (%.2f,%.2f) -> (%.2f,%.2f)" %
              (dist, why, name[:26], loc[:24], old[0], old[1], new[0], new[1]))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "report"
    limit = None
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])
    if cmd == "geocode":
        cmd_geocode(limit)
    elif cmd == "regeo":
        cmd_regeo()
    elif cmd == "apply":
        cmd_apply(dry="--dry" in sys.argv)
    elif cmd == "report":
        cmd_report()
    else:
        print(__doc__)
