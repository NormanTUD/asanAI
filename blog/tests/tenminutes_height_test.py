#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "selenium",
#     "webdriver-manager",
# ]
# ///
"""Monkey-test the Ten Minutes pages for height jumps.

The rule: a demo container must not change height when the reader clicks a
button, a chip, a slider or a select. The only exceptions are the transformer
pages and elements the reader actively expands (details / .optional).

Run from the repository root:

    uv run blog/tests/tenminutes_height_test.py
    uv run blog/tests/tenminutes_height_test.py --pages intuition.php --langs en
    uv run blog/tests/tenminutes_height_test.py --viewports desktop --monkey 10

CI runs it as the last job in blog_php_validator.yml.
"""

from __future__ import annotations

import argparse
import random
import socket
import subprocess
import sys
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"
TM = BLOG / "tenminutes"
INTERNAL = {"bootstrap.php", "globals.php"}
SKIP_PAGES = {"transformer.php"}  # deliberate exception from the user

VIEWPORTS = {
    "desktop": (1280, 900),
    "mobile": (390, 844),
}

MEASURE_JS = r"""
window.__tmMeasureHeights = function () {
	var selectors = [
		'.demo', '.demo-body', '.demo-head', '.demo-readout', '.vec-readout',
		'.step-pane', '.step-out', '.tm-step', '.aha', '.keypoints',
		'.myth-grid', '.fieldnotes', '.tl-panel', '.demo-insight', '.demo-foot',
		'.demo-hint', '.conv-formula', '.att-heads', '.att-budget-note',
		'figure', 'canvas', '.em-controls', '.em-readout', '.em-hint',
		'.tm-step-modes', '.tm-step-formula', '.tm-step-more'
	];
	var out = {};
	selectors.forEach(function (sel) {
		document.querySelectorAll(sel).forEach(function (el, i) {
			var cs = getComputedStyle(el);
			if (cs.display === 'none' || cs.visibility === 'hidden') return;
			var rect = el.getBoundingClientRect();
			if (rect.width < 1 || rect.height < 1) return;
			var key = sel + '[' + i + ']' + (el.id ? '#' + el.id : '');
			out[key] = Math.round(rect.height);
		});
	});
	return out;
};

window.__tmMarkHeightControls = function () {
	var all = document.querySelectorAll('button, input[type=range], input[type=checkbox], input[type=radio], select, [role=button], .chip, .tl-node');
	var out = [];
	var n = 0;
	function excluded(el) {
		if (!el || el.disabled) return true;
		if (el.closest('a[href], details, .optional, [data-headline], #tm-lang-switch, [data-no-height-test], .unified-layer-card, .tm-layer-card')) return true;
		if (el.offsetParent === null) return true;
		var tag = el.tagName.toLowerCase();
		if (tag === 'input' && (el.type === 'file' || el.type === 'hidden')) return true;
		var text = (el.innerText || el.value || '').trim().toLowerCase();
		if (/^(train model|modell trainieren|share run|download|export|print|drucken)$/i.test(text)) return true;
		return false;
	}
	all.forEach(function (el) {
		if (excluded(el)) return;
		var id = 'tm-ht-' + (n++);
		el.setAttribute('data-tm-height-test', id);
		out.push({
			id: id,
			tag: el.tagName.toLowerCase(),
			type: el.type || '',
			text: (el.innerText || el.value || '').trim().slice(0, 70)
		});
	});
	return out;
};

window.__tmHeightClick = function (id) {
	var el = document.querySelector('[data-tm-height-test="' + id + '"]');
	if (!el) return false;
	el.scrollIntoView({ block: 'center', inline: 'nearest' });
	var tag = el.tagName.toLowerCase();
	if (tag === 'input' && (el.type === 'range' || el.type === 'number')) {
		var min = el.min !== '' ? parseFloat(el.min) : 0;
		var max = el.max !== '' ? parseFloat(el.max) : 100;
		var next = String(el.value) === String(el.max) ? min : max;
		el.value = String(next);
		el.dispatchEvent(new Event('input', { bubbles: true }));
		el.dispatchEvent(new Event('change', { bubbles: true }));
	} else if (tag === 'select') {
		if (el.options.length > 1) {
			el.selectedIndex = (el.selectedIndex + 1) % el.options.length;
			el.dispatchEvent(new Event('change', { bubbles: true }));
			el.dispatchEvent(new Event('input', { bubbles: true }));
		}
	} else if (tag === 'input' && (el.type === 'checkbox' || el.type === 'radio')) {
		el.click();
	} else {
		el.click();
	}
	return true;
};
"""


def free_port() -> int:
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def discover_pages(only: list[str] | None) -> list[str]:
    pages = sorted(p.name for p in TM.glob("*.php") if p.name not in INTERNAL)
    pages = [p for p in pages if p not in SKIP_PAGES]
    if only:
        wanted = set(only)
        pages = [p for p in pages if p in wanted]
    return pages


def make_driver() -> webdriver.Chrome:
    opts = Options()
    for arg in ("--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars"):
        opts.add_argument(arg)
    opts.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    try:
        return webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)
    except Exception:
        return webdriver.Chrome(options=opts)


def wait_complete(driver, timeout: int = 40) -> None:
    end = time.time() + timeout
    while time.time() < end:
        try:
            if driver.execute_script("return document.readyState") == "complete":
                return
        except Exception:
            pass
        time.sleep(0.2)
    raise AssertionError("document.readyState did not reach complete")


def wait_ready(driver, timeout: int = 10) -> None:
    end = time.time() + timeout
    while time.time() < end:
        try:
            state = driver.execute_script(
                """
var demos = Array.from(document.querySelectorAll('[data-demo]'));
var unready = demos.filter(function (d) { return d.getAttribute('data-demo-ready') !== '1'; });
var tex = document.querySelectorAll('[data-tex]:not([data-tex-rendered="1"])').length;
var reserved = window.__tmHeightsReserved !== false;
return { unready: unready.length, tex: tex, reserved: reserved };
"""
            )
            if state["unready"] == 0 and state["tex"] == 0 and state.get("reserved", True):
                return
        except Exception:
            pass
        time.sleep(0.25)


def wait_stable(driver, timeout: float = 5.0) -> dict:
    end = time.time() + timeout
    last = None
    stable = 0
    while time.time() < end:
        try:
            current = driver.execute_script("return window.__tmMeasureHeights();")
        except Exception:
            time.sleep(0.2)
            continue
        if current == last:
            stable += 1
            if stable >= 2:
                return current
        else:
            stable = 0
            last = current
        time.sleep(0.25)
    return last or {}


def compare(before: dict, after: dict, context: str, failures: list[str]) -> None:
    common = set(before) & set(after)
    for key in sorted(common):
        delta = after[key] - before[key]
        if abs(delta) > 1:
            failures.append(f"{context} :: {key} changed {before[key]} -> {after[key]} ({delta:+d}px)")


def run_page(
    driver,
    base: str,
    page: str,
    lang: str,
    viewport_name: str,
    width: int,
    height: int,
    settle: float,
    monkey: int,
    seed: int,
    failures: list[str],
) -> int:
    driver.set_window_size(width, height)
    url = f"{base}/{page}?lang={lang}"
    driver.get(url)
    wait_complete(driver)
    wait_ready(driver)
    time.sleep(settle)
    driver.execute_script(MEASURE_JS)
    before = wait_stable(driver)
    controls = driver.execute_script("return window.__tmMarkHeightControls();") or []
    checked = 0
    for control in controls:
        cid = control["id"]
        desc = f"{control['tag']}"
        if control["type"]:
            desc += f"[{control['type']}]"
        if control["text"]:
            desc += f" '{control['text']}'"
        context = f"{page} [{lang}/{viewport_name}] {desc}"
        current = driver.execute_script("return window.__tmMeasureHeights();")
        clicked = driver.execute_script("return window.__tmHeightClick(arguments[0]);", cid)
        if not clicked:
            continue
        time.sleep(0.35)
        after = driver.execute_script("return window.__tmMeasureHeights();")
        compare(current, after, context, failures)
        checked += 1

    rng = random.Random(seed)
    for _ in range(monkey):
        if not controls:
            break
        control = rng.choice(controls)
        cid = control["id"]
        desc = f"{control['tag']} '{control['text']}'"
        context = f"{page} [{lang}/{viewport_name}] monkey {desc}"
        current = driver.execute_script("return window.__tmMeasureHeights();")
        clicked = driver.execute_script("return window.__tmHeightClick(arguments[0]);", cid)
        if not clicked:
            continue
        time.sleep(0.3)
        after = driver.execute_script("return window.__tmMeasureHeights();")
        compare(current, after, context, failures)
        checked += 1
    return checked


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--langs", default="en,de")
    parser.add_argument("--pages", nargs="*", default=None)
    parser.add_argument("--viewports", default="desktop,mobile")
    parser.add_argument("--settle", type=float, default=0.8)
    parser.add_argument("--monkey", type=int, default=12)
    parser.add_argument("--seed", type=int, default=1234)
    parser.add_argument("--max-failures", type=int, default=120)
    parser.add_argument("--fail-fast", action="store_true")
    args = parser.parse_args()

    pages = discover_pages(args.pages)
    langs = [lang.strip() for lang in args.langs.split(",") if lang.strip()]
    viewports = [v.strip() for v in args.viewports.split(",") if v.strip()]
    if not pages:
        print("No pages found.")
        return 1

    port = free_port()
    server = subprocess.Popen(
        [
            "php",
            "-d", f"auto_prepend_file={TM / 'bootstrap.php'}",
            "-S", f"127.0.0.1:{port}",
            "-t", str(BLOG),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    base = f"http://127.0.0.1:{port}/tenminutes"
    driver = None
    failures: list[str] = []
    checks = 0
    try:
        driver = make_driver()
        print(f"[height] {len(pages)} page(s) × {len(langs)} language(s) × {len(viewports)} viewport(s)")
        for page in pages:
            for lang in langs:
                for viewport_name in viewports:
                    width, height = VIEWPORTS[viewport_name]
                    try:
                        checks += run_page(
                            driver, base, page, lang, viewport_name,
                            width, height, args.settle, args.monkey, args.seed,
                            failures,
                        )
                    except Exception as exc:
                        failures.append(f"{page} [{lang}/{viewport_name}] crashed: {exc}")
                    if failures:
                        print(f"  {page} [{lang}/{viewport_name}]: {len(failures)} height change(s)")
                    if args.fail_fast and failures:
                        raise SystemExit(1)
                    if len(failures) >= args.max_failures:
                        raise SystemExit(1)
    finally:
        if driver:
            driver.quit()
        server.terminate()
        try:
            server.wait(timeout=5)
        except Exception:
            server.kill()

    print(f"\n{checks} interaction(s) checked, {len(failures)} height change(s)")
    if failures:
        print("\nFailures:")
        for failure in failures:
            print("  " + failure)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
