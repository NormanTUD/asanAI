#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "playwright>=1.40",
# ]
# ///
"""Detect layout jumps on every eoy day page.

A layout jump is what happens when a demo changes its own content (a label
appears, a dataset is revealed, a panel switches) and that reflow moves other
elements or resizes the slide. The check walks every day and every substep,
programmatically presses each demo-local control, and records Chromium's
layout-shift entries plus the demo's own height. A finding means the demo
should reserve its final size or keep the changed part out of the layout.

Run from the repository root:

    uv run blog/tests/eoy_layout_shift_test.py
    uv run blog/tests/eoy_layout_shift_test.py --only 2 --verbose
    uv run blog/tests/eoy_layout_shift_test.py --lang both --max-controls 4
    uv run blog/tests/eoy_layout_shift_test.py --threshold 0.005 --no-fail
"""

from __future__ import annotations

import argparse
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"

INIT_SCRIPT = r"""
try {
  window.__eoyLayout = { total: 0, entries: [] };
  new PerformanceObserver(function (list) {
    list.getEntries().forEach(function (entry) {
      if (entry.hadRecentInput || !entry.value) return;
      window.__eoyLayout.total += entry.value;
      window.__eoyLayout.entries.push({
        value: entry.value,
        sources: (entry.sources || []).map(function (source) {
          var node = source.node;
          var rect = node ? node.getBoundingClientRect() : null;
          var cls = node && node.className ? String(node.className) : "";
          return {
            tag: node ? node.tagName : "",
            id: node ? node.id : "",
            cls: cls.trim().split(/\s+/).slice(0, 3).join("."),
            y: rect ? Math.round(rect.y) : null,
            h: rect ? Math.round(rect.height) : null
          };
        })
      });
    });
  }).observe({ type: "layout-shift", buffered: true });
} catch (e) {}
"""

RESET = "() => { if (window.__eoyLayout) { window.__eoyLayout.total = 0; window.__eoyLayout.entries = []; } }"

READ = """() => {
  const demo = document.querySelector('#ls-demo');
  const stage = document.querySelector('#ls-stage');
  const root = demo && (demo.querySelector('.ls-scene-layer:not([hidden])') || demo);
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y), x: Math.round(r.x) };
  };
  const out = {
    cls: window.__eoyLayout ? window.__eoyLayout.total : 0,
    entries: window.__eoyLayout ? window.__eoyLayout.entries.slice(-8) : [],
    demo: box(demo),
    stage: box(stage),
    root: box(root),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  };
  if (root) {
    out.children = Array.prototype.slice.call(root.children).slice(0, 24).map(function (el) {
      const r = el.getBoundingClientRect();
      const cls = el.className ? String(el.className).trim().split(/\\s+/).slice(0, 3).join(".") : "";
      return { tag: el.tagName, cls: cls, id: el.id || "", y: Math.round(r.y), h: Math.round(r.height), w: Math.round(r.width) };
    });
  }
  return out;
}"""

# Controls that only influence inside the demo. Global navigation lives outside
# #ls-demo and anchors navigate away, so both are excluded.
CONTROLS = """() => {
  const demo = document.querySelector('#ls-demo');
  if (!demo) return [];
  const root = demo.querySelector('.ls-scene-layer:not([hidden])') || demo;
  const nodes = Array.prototype.slice.call(root.querySelectorAll(
    'button, [role="button"], summary, input[type="checkbox"], input[type="radio"], .ls-chip, .ls-term, [data-fx-input]'
  ));
  return nodes.map(function (el, index) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const visible = r.width > 3 && r.height > 3 && cs.display !== 'none' &&
      cs.visibility !== 'hidden' && parseFloat(cs.opacity || '1') > 0.05;
    const disabled = el.disabled || el.getAttribute('aria-disabled') === 'true';
    const label = (el.getAttribute('aria-label') || el.textContent || el.value || el.id || '').trim().replace(/\\s+/g, ' ').slice(0, 70);
    const cls = el.className ? String(el.className).trim().split(/\\s+/).slice(0, 3).join('.') : '';
    return { index: index, visible: visible && !disabled, label: label, tag: el.tagName, cls: cls, id: el.id || '' };
  }).filter(function (c) { return c.visible; });
}"""

CLICK = """(index) => {
  const demo = document.querySelector('#ls-demo');
  if (!demo) return false;
  const root = demo.querySelector('.ls-scene-layer:not([hidden])') || demo;
  const nodes = Array.prototype.slice.call(root.querySelectorAll(
    'button, [role="button"], summary, input[type="checkbox"], input[type="radio"], .ls-chip, .ls-term, [data-fx-input]'
  ));
  const el = nodes.filter(function (n) {
    const r = n.getBoundingClientRect();
    const cs = getComputedStyle(n);
    return r.width > 3 && r.height > 3 && cs.display !== 'none' && cs.visibility !== 'hidden' &&
      parseFloat(cs.opacity || '1') > 0.05 && !n.disabled && n.getAttribute('aria-disabled') !== 'true';
  })[index];
  if (!el) return false;
  el.click();
  return true;
}"""


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def serve(port: int) -> subprocess.Popen:
    php = shutil.which("php")
    if not php:
        raise SystemExit("php is not on PATH")
    return subprocess.Popen(
        [php, "-S", f"127.0.0.1:{port}", "-t", str(BLOG)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def wait_server(port: int, timeout: float = 10.0) -> None:
    end = time.time() + timeout
    while time.time() < end:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.2):
                return
        except OSError:
            time.sleep(0.05)
    raise SystemExit("php -S did not start")


def launch(playwright):
    attempts = [
        {"channel": "chrome"},
        {"executable_path": shutil.which("chromium")},
        {"executable_path": shutil.which("chromium-browser")},
        {},
    ]
    for attempt in attempts:
        if attempt.get("executable_path") is None and "executable_path" in attempt:
            continue
        try:
            return playwright.chromium.launch(headless=True, args=["--no-sandbox"], **attempt)
        except Exception:
            continue
    raise SystemExit("Could not launch Chromium; run `python3 -m playwright install chromium`")


def wait_ready(page) -> None:
    page.wait_for_function(
        "() => window.LearnSys && document.querySelector('#ls-title')", timeout=40000
    )
    page.wait_for_timeout(1400)


def goto_substep(page, substep: int) -> bool:
    """Switch to a substep; return False when the index is past the last one."""
    before = page.evaluate("() => window.LearnSys.state().substep")
    page.evaluate("(n) => window.LearnSys.goView(0, 0, n)", substep)
    deadline = time.time() + 3
    while time.time() < deadline:
        state = page.evaluate("() => window.LearnSys.state()")
        if state["substep"] == substep:
            break
        time.sleep(0.05)
    page.wait_for_timeout(900)
    after = page.evaluate("() => window.LearnSys.state().substep")
    return substep == 0 or after != before


def describe(entry) -> str:
    sources = entry.get("sources") or []
    parts = []
    for source in sources[:4]:
        name = source.get("tag", "").lower()
        if source.get("id"):
            name += "#" + source["id"]
        elif source.get("cls"):
            name += "." + source["cls"]
        if source.get("y") is not None:
            name += "@" + str(source["y"])
        parts.append(name)
    return ", ".join(parts)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", action="append", default=[], help="day number(s), e.g. --only 2")
    parser.add_argument("--lang", choices=["de", "en", "both"], default="de")
    parser.add_argument("--max-controls", type=int, default=10)
    parser.add_argument("--threshold", type=float, default=0.004, help="layout-shift score that counts as a jump")
    parser.add_argument("--height-delta", type=int, default=8, help="demo height change in px that counts as a jump")
    parser.add_argument("--settle", type=int, default=500, help="ms to wait after a control click")
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument("--no-fail", action="store_true", help="report findings but exit 0")
    args = parser.parse_args()

    days = [int(d) for d in args.only] if args.only else sorted(
        int(path.stem) for path in (BLOG / "eoy").glob("[0-9]*.php") if path.stem.isdigit()
    )
    langs = ["de", "en"] if args.lang == "both" else [args.lang]
    port = free_port()
    server = serve(port)
    wait_server(port)
    findings: list[dict] = []
    checked = 0
    try:
        with sync_playwright() as playwright:
            browser = launch(playwright)
            context = browser.new_context(viewport={"width": 1440, "height": 1000})
            context.add_init_script(INIT_SCRIPT)
            page = context.new_page()
            page.set_default_timeout(8000)
            page.on("dialog", lambda dialog: dialog.dismiss())
            for lang in langs:
                for day in days:
                    url = f"http://127.0.0.1:{port}/eoy/{day}.php?lang={lang}"
                    if args.verbose:
                        print(f"\n[day {day} / {lang}] {url}")
                    page.goto(url, wait_until="load", timeout=60000)
                    wait_ready(page)
                    substep = 0
                    while True:
                        if not goto_substep(page, substep):
                            break
                        title = page.evaluate("() => (document.querySelector('#ls-title') || {}).textContent || ''")
                        controls = page.evaluate(CONTROLS)
                        if args.verbose:
                            print(f"  substep {substep}: {title} ({len(controls)} controls)")
                        page.evaluate(RESET)
                        for position, control in enumerate(controls[: args.max_controls]):
                            page.evaluate(RESET)
                            before = page.evaluate(READ)
                            try:
                                clicked = page.evaluate(CLICK, position)
                            except PlaywrightError:
                                clicked = False
                            if not clicked:
                                continue
                            page.wait_for_timeout(args.settle)
                            after = page.evaluate(READ)
                            checked += 1
                            score = after["cls"]
                            height_delta = abs((after["root"] or {}).get("h", 0) - (before["root"] or {}).get("h", 0))
                            moved = []
                            old = {c.get("tag", "") + "#" + c.get("id", "") + "." + c.get("cls", ""): c for c in before.get("children", [])}
                            for child in after.get("children", []):
                                key = child.get("tag", "") + "#" + child.get("id", "") + "." + child.get("cls", "")
                                if key in old and abs(child["y"] - old[key]["y"]) > 4:
                                    moved.append(f"{key} y {old[key]['y']}→{child['y']}")
                            jump = score >= args.threshold or height_delta >= args.height_delta or moved or after["overflow"] > 2
                            if jump:
                                finding = {
                                    "day": day,
                                    "lang": lang,
                                    "substep": substep,
                                    "title": title,
                                    "control": f"{control['tag']}.{control['cls']}#{control['id']} «{control['label']}»",
                                    "cls": round(score, 4),
                                    "height": height_delta,
                                    "moved": moved[:4],
                                    "overflow": after["overflow"],
                                    "sources": [describe(e) for e in after.get("entries", []) if e.get("value", 0) >= args.threshold][:4],
                                }
                                findings.append(finding)
                                print(
                                    f"  JUMP day {day}.{substep} [{lang}] «{title}» → {finding['control']}: "
                                    f"cls={finding['cls']} Δh={height_delta}px overflow={after['overflow']} "
                                    f"{'; '.join(finding['sources'])}"
                                )
                            elif args.verbose:
                                print(
                                    f"    ok {control['tag']}.{control['cls']} «{control['label'][:32]}» "
                                    f"cls={score:.4f} Δh={height_delta}px"
                                )
                        substep += 1
                        if substep > 12:
                            break
            browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except Exception:
            server.kill()

    print(f"\n{checked} control clicks checked, {len(findings)} jump finding(s).")
    if findings:
        print("Reserve the final size of the changing block, or keep the change out of layout (visibility/absolute), then re-run.")
        if not args.no_fail:
            raise SystemExit(1)


if __name__ == "__main__":
    main()
