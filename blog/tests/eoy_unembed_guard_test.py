#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Static guardrails for the merged EOY unembedding slide.

The slide intentionally merges directions, length, logit bars, unembedding and
the optional anisotropy note. These checks keep that contract from regressing:
one substep, no tab UI, a visible length tour, click-to-angle bars that never
change the green word, a Temml formula, and a layout where the sphere owns the
stage.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EOY = ROOT / "blog" / "eoy"
DATA = EOY / "data.js"
SCENE = EOY / "assets" / "learnsys-unembed-scene.js"
CSS = EOY / "learnsys.css"


def main() -> int:
    data = DATA.read_text(encoding="utf-8")
    scene = SCENE.read_text(encoding="utf-8")
    css = CSS.read_text(encoding="utf-8")
    failures: list[str] = []

    def check(name: str, condition: bool, detail: str = "") -> None:
        if not condition:
            failures.append(name + (f": {detail}" if detail else ""))

    check("one merged unembed substep", "substeps: [unembedSteps[0]]" in data)
    check("old scale substep not mounted", "substeps: [unembedSteps[0], unembedScaleStep]" not in data)
    check("merged title", 'title = DE ? "Länge vs. Richtung"' in data)
    check("length tour exists", "LENGTH_VALUES = [0.40, 1.00, 1.60, 1.00, 0.40]" in scene)
    check("slider can leave the sphere", 'class="ls-sim-scale" min="0.08" max="1.80"' in scene)
    check("no separate demo tabs", 'data-mode="scale"' not in scene and "ls-sim-tabs" not in scene)
    check("angle toggle exists", "ls-sim-angle-toggle" in scene)
    check("HTML bar cards exist", "ls-sim-bar-card" in scene and "renderBarPanel" in scene)
    check("bar click only focuses the angle", "barFocus = barFocus === i ? -1 : i" in scene)
    check("bar click never selects the green word", "if (bh) { choose" not in scene)
    check("bar cards are visually separated", "ls-sim-bar-card" in scene and "ls-sim-bars" in scene)
    check("Temml formula is present", "formulaTex" in scene and "api.typeset" in scene)
    check("Temml w_i in each bar row", 'data-tex="|w_i|"' in scene and 'data-tex-display="false"' in scene)
    check("directions caption is removed", 'caption.textContent = ""' in scene and "caption.hidden = true" in scene)
    check("default example is Fluss", 'w.w === "Fluss"' in scene and "defaultSelected" in scene)
    check("formula is mounted under the bars", 'class="ls-scene-formula ls-sim-formula"' in scene)
    check("LayerNorm and w_i are explained", "LayerNorm" in data and "lVert w_i" in data)
    check("underbrace equation is in the data", "underbrace" in data and "Logit" in data)
    check("anisotropy is an optional box", "un-aniso" in data and "Anisotrope Richtungen" in data)
    check("stage owns the scene height", "grid-template-rows:minmax(0,1fr) auto auto auto auto" in css)
    check("controls stay below the stage", ".ls-sim-scene>.ls-sim-stage{min-height:260px}" in css)
    check("bar cards are separated in CSS", ".ls-sim-bar-card" in css and ".ls-sim-bars" in css)
    check("old tab row no longer owns the page", "grid-template-rows:auto minmax(0,1fr) auto auto auto" not in css.split("/* Merged unembedding scene")[-1])

    if failures:
        print("eoy unembed guardrails FAILED")
        for item in failures:
            print(" -", item)
        return 1
    print("eoy unembed guardrails: all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
