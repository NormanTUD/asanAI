# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""
Lesson Guard — static regression guards for the blog.

Unlike the browser validators (php_render_validator.py), this runs with no
browser and no PHP server: it asserts source-level invariants on a lesson's
.php template and its matching .js module. Each invariant is cheap to check
and has a concrete bug it was added to keep out.

Per-lesson guards (LESSONS list — Math IV · Affine Maps & the Fold):

  G1 headings-in-md    every ##/###/#### markdown heading sits inside a
                        <div class="…md…"> block — outside one it neither
                        renders nor appears in the table of contents.
  G2 citation-keys     every \\cite/\\footcite key used in the lesson exists
                        in literature.js (window.bibData). A missing key logs
                        an error and renders broken.
  G3 no-auto-rotate    no *-auto checkbox is `checked` by default (the 3D
                        labs must start still, not spinning on load).
  G4 3d-nav-wired      each of the four 3D canvases is wired to bind3DNav
                        (wheel/pinch zoom + touch rotate).
  G5 3d-axes           each of the four 3D canvases is wired to drawAxes3D.
  G6 symbolic-pieces   the fold's two piece matrices are rendered as symbolic
                        LaTeX bmatrix entries (λ, cos²θ, sinθ) into #fd2d-m1 /
                        #fd2d-m2 (not flat number cells).
  G7 fold-quad-map     the fold 3-D quad loop maps `bend` with destructured
                        (u, v) — a bare `cs.map(bend)` passes a point array as
                        `u`, NaNs every quad, and the paper vanishes from the
                        canvas.

Blog-wide citation-integration guards (every top-level lesson .php, see
AGENTS.md "Citation integration"): \\cite[display]{key} renders `display`
verbatim WITHOUT brackets, so a self-contained reference must sit inside
(...) or be woven into the prose — plain \\cite{key} already renders
bracketed [Author, Year] and is exempt.

  C1 cite-no-empty      \\cite[]{key} (renders an empty link) and
                        \\cite[disp]{} (renders literal garbage) are bugs.
  C2 cite-not-in-headings no cite-family macro on a ##/### heading line —
                        the citation goes into the first sentence.
  C3 cite-not-floating   a reference-shaped display (trailing ", Year",
                        book locator Ch./§/p./Equation/Figure:, "Section N")
                        must be preceded by "(" — otherwise it floats
                        between words. Narrative subjects use the year in
                        parens: \\cite[Zhou et al. (2022)]{…} is fine.

Usage:
    uv run blog/tests/lesson_guard.py [blog/]

Exit code 0 = all guards pass, 1 = at least one guard failed.
"""

import os
import re
import sys
from pathlib import Path


# Lesson under guard: (php template, js module). Extend the list to add more.
LESSONS = [
    ("math_iv.php", "math_iv_affine.js"),
]

THREE_3D = 4  # math_iv has four 3-D canvases: af3d, fd3d, act3d, u3d


def _read(path: Path) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


# ---------------------------------------------------------------------------
# G1 — headings must be inside a <div class="…md…"> block
# ---------------------------------------------------------------------------
def guard_headings_in_md(php: str) -> list[str]:
    issues = []
    open_divs: list[bool] = []  # stack of is_md flags for currently-open <div>
    div_open = re.compile(r"<div\b[^>]*>", re.IGNORECASE)
    div_close = re.compile(r"</div\s*>", re.IGNORECASE)
    class_attr = re.compile(r"""class\s*=\s*["']([^"']*)["']""", re.IGNORECASE)
    heading = re.compile(r"^(#{1,6})\s")

    def is_md_div(tag: str) -> bool:
        m = class_attr.search(tag)
        if not m:
            return False
        return "md" in m.group(1).split()

    for lineno, line in enumerate(php.splitlines(), start=1):
        stripped = line.strip()

        # Evaluate any markdown heading using the stack state before this
        # line's own div tags are applied (the enclosing <div class="md">
        # opens on an earlier line).
        if heading.match(stripped):
            if not open_divs or not open_divs[-1]:
                issues.append(
                    f"line {lineno}: heading {stripped[:60]!r} is not inside a "
                    f"<div class=\"…md…\"> block (will not render / not in TOC)"
                )

        # Then update the div stack with this line's opens/closes.
        opens = div_open.findall(line)
        closes = len(div_close.findall(line))
        for tag in opens:
            open_divs.append(is_md_div(tag))
        for _ in range(closes):
            if open_divs:
                open_divs.pop()

    return issues


# ---------------------------------------------------------------------------
# G2 — every cited key must exist in literature.js
# ---------------------------------------------------------------------------
def guard_citation_keys(php: str, literature: str) -> list[str]:
    used = set(re.findall(
        r"\\(?:foot)?cite[a-z]*(?:\[[^\]]*\])?\{([A-Za-z0-9_]+)\}", php
    ))
    defined = set(re.findall(
        r'^\s*"([A-Za-z0-9_]+)"\s*:\s*\{', literature, re.MULTILINE
    ))
    missing = sorted(used - defined)
    return [f"cited key {k!r} is not defined in literature.js" for k in missing]


# ---------------------------------------------------------------------------
# G3 — no *-auto checkbox checked by default
# ---------------------------------------------------------------------------
def guard_no_auto_rotate(php: str) -> list[str]:
    issues = []
    for m in re.finditer(r"<input\b[^>]*id=\"([^\"]*-auto)\"[^>]*>", php, re.IGNORECASE):
        tag = m.group(0)
        if re.search(r"\bchecked\b", tag, re.IGNORECASE):
            issues.append(f"checkbox #{m.group(1)} is checked by default "
                          f"(3-D labs must start still)")
    return issues


# ---------------------------------------------------------------------------
# G4/G5 — every 3-D canvas wired to bind3DNav + drawAxes3D
# ---------------------------------------------------------------------------
def _count_calls(js: str, name: str) -> int:
    # Call sites only: `name(`. The definition `const name = (…) =>` has no
    # `(` directly after the identifier, so it is not counted.
    return len(re.findall(rf"\b{name}\s*\(", js))


def guard_3d_nav(js: str) -> list[str]:
    issues = []
    n = _count_calls(js, "bind3DNav")
    if n < THREE_3D:
        issues.append(f"bind3DNav is called {n}×, expected ≥ {THREE_3D} "
                      f"(one per 3-D canvas)")
    return issues


def guard_3d_axes(js: str) -> list[str]:
    issues = []
    n = _count_calls(js, "drawAxes3D")
    if n < THREE_3D:
        issues.append(f"drawAxes3D is called {n}×, expected ≥ {THREE_3D} "
                      f"(one per 3-D canvas)")
    return issues


# ---------------------------------------------------------------------------
# G6 — fold piece matrices rendered as symbolic LaTeX bmatrix
# ---------------------------------------------------------------------------
def guard_symbolic_pieces(js: str) -> list[str]:
    issues = []
    if "fd2d-m1" not in js:
        issues.append("fold piece matrix host #fd2d-m1 missing from the lab JS")
    if "begin{bmatrix}" not in js:
        issues.append("fold piece matrices are no longer rendered as LaTeX bmatrix")
    if "cos^{2}" not in js:
        issues.append("fold piece matrices should be symbolic (λ, cos²θ, sinθ), not flat numbers")
    return issues


# ---------------------------------------------------------------------------
# G7 — fold 3-D quad loop must not use a bare `cs.map(bend)`
# ---------------------------------------------------------------------------
def guard_fold_quad_map(js: str) -> list[str]:
    issues = []
    for m in re.finditer(r"\.map\(\s*bend\s*\)", js):
        line_no = js.count("\n", 0, m.start()) + 1
        issues.append(
            f"line {line_no}: bare `.map(bend)` passes a point array as `u` "
            f"and the index as `v` (NaNs every quad, paper vanishes) — "
            f"destructure with `cs.map(([u, v]) => bend(u, v))`"
        )
    return issues


# ---------------------------------------------------------------------------
# C1-C3 — citation integration, blog-wide (AGENTS.md "Citation integration")
# ---------------------------------------------------------------------------
# Top-level .php files that are not prose lessons.
CITE_SKIP = {
    "functions.php", "index.php", "index_full.php", "asanai_blog_proxy.php",
    "graph.php", "image.php", "mobile-prepend.php", "mobile-loader.php",
    "search_lib.php", "search.php",
}

CITE_MACRO = re.compile(
    r"\\(?:footcite|citeauthorlastnameand|citeauthor|citealternativetitle|"
    r"citetitle|citeyear|citeurl|cite)\b"
)

# Display shapes that are self-contained references (must sit in (…) or be
# woven in). Only reference shapes AT THE START of the display count, so a
# woven fragment like "as Morris shows in Topology Without Tears (Ch. 4,
# p. 75)" is fine. Narrative subjects exempt by shape: "Zhou et al. (2022)"
# ends in ")" not ", 2022".
FLOATING_REF = re.compile(
    r"^Section \d"
    r"|^§"
    r"|^Figure:"
    r"|^[^,()]{1,80}(?:, [^,()]{1,80}){0,2}, (?:Ch\.|§|p\. \d|Equation|Figure:)"
    r"|^[^,()]{1,80}(?:, [^,()]{1,80})*, (1[5-9]|20)\d{2}$"
    r"|^[^,()]{1,80} et al\. (1[5-9]|20)\d{2}$"
)


def _line_of(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def _preceded_by_paren(text: str, pos: int) -> bool:
    return text[:pos].rstrip().endswith("(")


def guard_cite_no_empty(php: str) -> list[str]:
    issues = []
    # \cite[]{key} (empty display → empty link) and \cite[disp][]{key}
    # (extra empty brackets → renders garbage like "disp][]").
    for m in re.finditer(r"\\cite(?:\[[^\]]*\])?\[\s*\]\{", php):
        issues.append(
            f"line {_line_of(php, m.start())}: empty [] in cite "
            f"{php[m.start():m.start() + 40]!r} — renders an empty link or "
            f"literal garbage"
        )
    for m in re.finditer(r"\\cite(?:\[[^\]]*\])?\{\s*\}", php):
        issues.append(
            f"line {_line_of(php, m.start())}: empty {{}} in cite "
            f"{php[m.start():m.start() + 40]!r} — macro is never processed"
        )
    return issues


def guard_cite_not_in_headings(php: str) -> list[str]:
    issues = []
    for lineno, line in enumerate(php.splitlines(), start=1):
        s = line.strip()
        if re.match(r"^#{1,6}\s", s) and CITE_MACRO.search(s):
            issues.append(
                f"line {lineno}: cite in heading {s[:60]!r} — move it to the "
                f"first sentence of the section"
            )
    return issues


def guard_cite_not_floating(php: str) -> list[str]:
    issues = []
    for m in re.finditer(r"\\cite\[([^\]]*)\]\{([A-Za-z0-9_]+)\}", php):
        display = m.group(1).strip()
        if not display or not FLOATING_REF.search(display):
            continue
        if _preceded_by_paren(php, m.start()):
            continue
        issues.append(
            f"line {_line_of(php, m.start())}: floating reference "
            f"\\cite[{display[:50]}]{{…}} is not inside parentheses — wrap it "
            f"in (…) or weave it into the prose"
        )
    return issues


CITE_GUARDS = [
    ("C1 cite-no-empty", guard_cite_no_empty),
    ("C2 cite-not-in-headings", guard_cite_not_in_headings),
    ("C3 cite-not-floating", guard_cite_not_floating),
]


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------
GUARDS_PHP = [
    ("G1 headings-in-md", guard_headings_in_md),
    ("G3 no-auto-rotate", guard_no_auto_rotate),
]
GUARDS_JS = [
    ("G4 3d-nav-wired", guard_3d_nav),
    ("G5 3d-axes", guard_3d_axes),
    ("G6 symbolic-pieces", guard_symbolic_pieces),
    ("G7 fold-quad-map", guard_fold_quad_map),
]


def main() -> None:
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("blog")
    if not root.is_dir():
        print(f"[error] not a directory: {root}")
        sys.exit(1)

    literature = _read(root / "literature.js") if (root / "literature.js").exists() else ""
    if not literature:
        print(f"[error] literature.js not found under {root}")
        sys.exit(1)

    total_fail = 0
    cite_fail = 0
    cite_checked = 0
    for path in sorted(root.glob("*.php")):
        if path.name in CITE_SKIP:
            continue
        cite_checked += 1
        php = _read(path)
        issues = []
        for name, fn in CITE_GUARDS:
            issues.extend(f"[{name}] {i}" for i in fn(php))
        if issues:
            cite_fail += len(issues)
            print("=" * 64)
            print(f"Cites: {path.name}")
            print("=" * 64)
            for i in issues:
                print(f"  ✗ {i}")

    for php_name, js_name in LESSONS:
        php_path, js_path = root / php_name, root / js_name
        if not php_path.exists() or not js_path.exists():
            print(f"[error] missing {php_name} or {js_name} under {root}")
            sys.exit(1)
        php, js = _read(php_path), _read(js_path)

        print("=" * 64)
        print(f"Lesson: {php_name}")
        print("=" * 64)

        results = []
        for name, fn in GUARDS_PHP:
            results.append((name, fn(php)))
        for name, fn in [("G2 citation-keys", lambda p: guard_citation_keys(p, literature))]:
            results.append((name, fn(php)))
        for name, fn in GUARDS_JS:
            results.append((name, fn(js)))

        lesson_fail = 0
        for name, issues in results:
            if issues:
                lesson_fail += len(issues)
                print(f"  ✗ {name}")
                for i in issues:
                    print(f"      - {i}")
            else:
                print(f"  ✓ {name}")

        total_fail += lesson_fail
        print(f"  → {php_name}: {'FAIL (' + str(lesson_fail) + ')' if lesson_fail else 'PASS'}")
        print()

    print("=" * 64)
    print(f"Citation guards: {cite_checked} file(s) checked, "
          f"{cite_fail} issue(s)")
    total_fail += cite_fail
    if total_fail:
        print(f"[FAIL] {total_fail} guard violation(s) found → exit code 1")
        sys.exit(1)
    print("[PASS] All lesson guards passed")
    sys.exit(0)


if __name__ == "__main__":
    main()
