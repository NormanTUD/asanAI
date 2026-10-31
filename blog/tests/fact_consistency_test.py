# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Cross-lesson fact consistency regression test.

This is deliberately dependency-free: it guards the factual and structural
invariants that the textbook-wide audit settled, so they cannot silently drift
back. It checks metadata ordering, citation-key resolution, a set of
bibliographic identities, and prose strings whose old, wrong wording is known.

Run from the repository root:

    uv run blog/tests/fact_consistency_test.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

BLOG = Path(__file__).resolve().parent.parent
FAILS: list[str] = []


def fail(msg: str) -> None:
    FAILS.append(msg)


def read(name: str) -> str:
    return (BLOG / name).read_text(encoding="utf-8")


def must_contain(name: str, needles: list[str]) -> None:
    text = read(name)
    for needle in needles:
        if needle not in text:
            fail(f"{name}: missing expected text: {needle!r}")


def must_not_contain(name: str, needles: list[str]) -> None:
    text = read(name)
    for needle in needles:
        if needle in text:
            fail(f"{name}: forbidden stale text still present: {needle!r}")


# ---------------------------------------------------------------------------
# 1. Metadata: one unique (part, order) pair, and the settled Part 6 order.
# ---------------------------------------------------------------------------

SKIP = {"index", "index_full", "functions", "asanai_blog_proxy", "graph", "intro"}
metadata: dict[str, dict[str, str]] = {}
pattern = re.compile(r"<!--\s*\n?\s*COURSE_METADATA:\s*\n((?:.*\n)*?)\s*-->")
for path in BLOG.glob("*.php"):
    if path.stem in SKIP:
        continue
    match = pattern.search(path.read_text(encoding="utf-8"))
    if not match:
        continue
    meta: dict[str, str] = {}
    for line in match.group(1).splitlines():
        line = line.strip()
        if re.match(r"^\w+:\s*.+$", line):
            key, value = line.split(":", 1)
            meta[key.strip()] = value.strip()
    if "title" in meta and "part" in meta:
        metadata[path.stem] = meta

seen: dict[tuple[int, int], str] = {}
for slug, meta in metadata.items():
    pair = (int(meta["part"]), int(meta.get("order", 999)))
    if pair in seen:
        fail(f"duplicate course position {pair}: {seen[pair]} and {slug}")
    seen[pair] = slug

expected_part6 = {"software": 18, "people_of_ai": 19, "atlas": 20}
for slug, order in expected_part6.items():
    got = int(metadata.get(slug, {}).get("order", -1))
    if got != order:
        fail(f"{slug}: expected order {order}, got {got}")

# ---------------------------------------------------------------------------
# 2. Every citation key resolves to a literature.js entry.
# ---------------------------------------------------------------------------

# The bibliography is a JavaScript object: a stray comma there is invisible to
# the PHP validators but breaks every citation on every page at runtime.
import shutil
import subprocess

if shutil.which("node"):
    check = subprocess.run(
        ["node", "--check", str(BLOG / "literature.js")],
        capture_output=True,
        text=True,
    )
    if check.returncode != 0:
        fail("literature.js does not parse: " + check.stderr.strip().splitlines()[-1])

literature = (BLOG / "literature.js").read_text(encoding="utf-8")
keys = set(re.findall(r'^\s*"?([A-Za-z0-9_\-]+)"?\s*:\s*\{', literature, re.M))
cite_re = re.compile(r"\\cite[a-zA-Z]*\s*(?:\[[^\]]*\])?\{([^}]*)\}")
for path in sorted(BLOG.glob("*.php")):
    text = path.read_text(encoding="utf-8")
    for match in cite_re.finditer(text):
        for key in (part.strip() for part in match.group(1).split(",")):
            if key and key not in keys:
                fail(f"{path.name}: citation key not in literature.js: {key}")
    for match in re.finditer(r'data-cite="([^"]+)"', text):
        if match.group(1) not in keys:
            fail(f"{path.name}: data-cite key not in literature.js: {match.group(1)}")

# ---------------------------------------------------------------------------
# 3. Bibliographic identities settled by the audit.
# ---------------------------------------------------------------------------

BIB = {
    "ramsauer2021hopfield": ["Hubert Ramsauer", "2008.02217"],
    "brooks2024sora": ["openai.com/index/video-generation-models-as-world-simulators", "Tim Brooks"],
    "hornik": ["year: 1991"],
    "watkins1989qlearning": ["cs.rhul.ac.uk/~chrisw/new_thesis.pdf"],
    "nyquist_sampling": ["10.1109/T-AIEE.1928.5055024", "Harry Nyquist"],
    "cowan2001magical4": ["Nelson Cowan"],
    "diekelmann2010sleep": ["Susanne Diekelmann", "nrn2762"],
    "anthropic2023mapping": ["year: 2024"],
    "deepseek2024v3": ["2412.19437", "DeepSeek-V3 Technical Report"],
    "brouwer1911invariance": ["BF01456846"],
    "sparrow2011google": ["10.1126/science.1207745"],
    "price2024gencast": ["s41586-024-08252-9"],
}
for key, needles in BIB.items():
    marker = f'"{key}"'
    pos = literature.find(marker)
    if pos == -1:
        fail(f"literature.js: missing key {key}")
        continue
    block = literature[pos : pos + 2500]
    for needle in needles:
        if needle not in block:
            fail(f"literature.js[{key}]: missing {needle!r}")

# ---------------------------------------------------------------------------
# 4. Prose regressions: settled wrong wording must not return.
# ---------------------------------------------------------------------------

must_not_contain(
    "ai_economics.php",
    ["495 TFLOP/s BF16", "989 TFLOP/s FP8", "small over-trained models", "roughly half of one training step's forward"],
)
must_contain("ai_economics.php", ["large under-trained models", "one training step's forward pass"])

must_contain("trainingdynamics.php", ["alpha \\approx 0.34", "large under-trained models such as GPT-3"])
must_not_contain("trainingdynamics.php", ["small over-trained models"])

must_contain("training_infrastructure.php", ["1120", "16 bytes per parameter", "1.2 TB"])
must_contain("production_serving.php", ["two H100s"])
must_not_contain("production_serving.php", ["on a single H100, each generated token"])

must_contain("hallucinations.php", ["cumulative probability reaches $P$"])
must_not_contain("hallucinations.php", ["top $P$ percentage", "App` and `le"])

must_contain("inceptionism.php", ["feedback loop: if a cloud looks a little bit like a bird"])
must_not_contain(
    "inceptionism.php",
    ["A child's mind sees objects in clouds", "petri dishes", "fractal-like feedback", "~22,000 classes", "duck-billed platypus"],
)

must_not_contain("untold_history_i.php", ["preceded the GOE"])
must_not_contain("untold_history_iii.php", ["it was the first electronic spreadsheet"])
must_not_contain("global_ai_ecosystem.php", ["OpenHathi** (Krutrim)", "Vula Vulapha", "Bengio (Mila), "])
must_not_contain("ai_and_society.php", ["88 of 97", "7× phishing", "100× ransomware", "$10^{47}$ in chess", "less than 5%", "in force **August 2, 2026**"])
must_not_contain("ai_for_science.php", ["~800,000 of them", "~216 million possible human missense"])
must_not_contain("frontier.php", ["Redman et al., 2024", "A 2025 benchmark (GAIA", "Skrr"])
must_not_contain("alignment.php", ["stronger models did so more often"])
must_not_contain("ai_existential_risk.php", ["October 2025, a broader letter", "majority expected AGI by 2040"])
must_not_contain("philosophy.php", ["under every major scientific theory", "nothing it is like to be them", "surpass the Turing Test regularly"])
must_not_contain("myths.php", ["lawsuit that became a settlement"])
must_not_contain("atlas.php", ["that appears anywhere in this course is a dot"])
must_not_contain("reinforcement_learning.php", ["the first open-weight model to exhibit"])
must_not_contain("normalizationlab.php", ["empirically wins on every high-resolution image benchmark"])
must_not_contain("reasoning.php", ["(used in o1,"])
must_not_contain("finetuninglab.php", ["A 70B QLoRA fine-tune fits on a single 48 GB GPU"])
must_not_contain("running_locally.php", ["Fits a 70B fine-tune on a single 48 GB GPU"])
must_not_contain("production_serving.php", ["trained on Phi-3-medium's outputs"])
must_not_contain("training_data.php", ["model quality scales linearly with the **quality-adjusted token count**"])
must_not_contain("resnetlab.php", ["special case of a Highway Network"])

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

if FAILS:
    print(f"FAIL: {len(FAILS)} fact-consistency problem(s)")
    for item in FAILS:
        print(f"  - {item}")
    sys.exit(1)

print(f"PASS: {len(metadata)} lessons, {len(keys)} bibliography keys, all fact guards green")
