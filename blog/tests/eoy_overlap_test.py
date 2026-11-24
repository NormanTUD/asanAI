#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "selenium",
#     "webdriver-manager",
# ]
# ///
"""Walk EOY slides at several viewport sizes and flag overlapping layout blocks.

A scroll container may overflow vertically, but its visible direct children
must not sit on top of each other. This catches the status/title collision on
the consciousness theory screen and similar regressions.

Run from the repository root:
    uv run blog/tests/eoy_overlap_test.py
    uv run blog/tests/eoy_overlap_test.py --pages 31.php
"""

import argparse
import json
import subprocess
import time
from pathlib import Path

from eoy_pages_test import free_port, make_driver, wait_app
from selenium.common.exceptions import WebDriverException

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"
DEFAULT_SIZES = ((1200, 900), (768, 900), (390, 844))

OVERLAP_JS = r"""
return (function () {
  function visible(el) {
    var cs = getComputedStyle(el);
    var r = el.getBoundingClientRect();
    return cs.display !== "none" && cs.visibility !== "hidden" &&
      parseFloat(cs.opacity || "1") > 0.05 &&
      r.width > 2 && r.height > 2 &&
      cs.position !== "absolute" && cs.position !== "fixed";
  }
  function name(el) {
    return (el.className && String(el.className).trim()) || el.tagName.toLowerCase();
  }
  function text(el) {
    return (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 60);
  }
  var issues = [];
  var containers = Array.prototype.slice.call(document.querySelectorAll("*")).filter(function (el) {
    var cs = getComputedStyle(el);
    return visible(el) && (cs.overflowY === "auto" || cs.overflowY === "scroll");
  });
  containers.forEach(function (c) {
    var kids = Array.prototype.slice.call(c.children).filter(visible);
    for (var i = 0; i < kids.length; i++) {
      for (var j = i + 1; j < kids.length; j++) {
        var a = kids[i].getBoundingClientRect();
        var b = kids[j].getBoundingClientRect();
        var ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        var iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ix > 2 && iy > 2) {
          issues.push({
            container: name(c),
            a: name(kids[i]),
            b: name(kids[j]),
            ix: Math.round(ix),
            iy: Math.round(iy),
            text: [text(kids[i]), text(kids[j])]
          });
        }
      }
    }
  });
  var ov = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
  if (!isFinite(ov)) ov = 0;
  return JSON.stringify({ issues: issues, overflow: ov });
})()
"""


def load(driver, base, page, lang):
    driver.get(f"{base}/eoy/{page}?lang={lang}")
    if not wait_app(driver):
        raise RuntimeError(f"{page} [{lang}] did not mount")
    time.sleep(0.5)


def check_state(driver, page, lang, size, step, failures):
    for attempt in range(2):
        try:
            result = json.loads(driver.execute_script(OVERLAP_JS) or "{}")
            break
        except WebDriverException:
            if attempt:
                raise
            time.sleep(0.25)
    if result["overflow"] > 2:
        failures.append((page, lang, size, step, "horizontal overflow", result))
    for issue in result["issues"]:
        failures.append((page, lang, size, step, "overlap", issue))


def walk(driver, base, page, lang, size, failures):
    load(driver, base, page, lang)
    check_state(driver, page, lang, size, 0, failures)
    steps = 0
    while steps < 60:
        can_next = driver.execute_script("return !!(window.LearnSys && LearnSys.canNext && LearnSys.canNext())")
        if not can_next:
            break
        driver.execute_script(
            "var b=document.getElementById('ls-quick-next');"
            "if(!b || b.hidden || getComputedStyle(b).display==='none') b=document.getElementById('ls-next');"
            "if(b) b.click();"
        )
        steps += 1
        time.sleep(0.4)
        check_state(driver, page, lang, size, steps, failures)
    return steps


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pages", nargs="*", default=["31.php"], help="page files, default 31.php")
    parser.add_argument("--langs", default="de,en")
    parser.add_argument("--sizes", default=",".join(f"{w}x{h}" for w, h in DEFAULT_SIZES), help="comma-separated WxH viewports")
    args = parser.parse_args()
    langs = [x.strip() for x in args.langs.split(",") if x.strip() in ("de", "en")]
    sizes = []
    for item in args.sizes.split(","):
        try:
            w, h = item.lower().split("x")
            sizes.append((int(w), int(h)))
        except ValueError:
            parser.error(f"invalid size: {item}")
    port = free_port()
    server = subprocess.Popen(
        ["php", "-S", f"127.0.0.1:{port}", "-t", str(BLOG)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(1.0)
    failures = []
    checked = 0
    try:
        for page in args.pages:
            # A fresh browser per page avoids cross-page DevTools serialization glitches.
            driver = make_driver()
            try:
                for lang in langs:
                    for width, height in sizes:
                        driver.set_window_size(width, height)
                        steps = walk(driver, f"http://127.0.0.1:{port}", page, lang, (width, height), failures)
                        checked += steps + 1
                        print(f"{page} [{lang}] {width}x{height}: {steps + 1} states")
            finally:
                driver.quit()
    finally:
        server.terminate()
    print(f"\n{checked} states checked, {len(failures)} overlap/overflow failure(s)")
    for failure in failures[:40]:
        print("FAIL", failure)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
