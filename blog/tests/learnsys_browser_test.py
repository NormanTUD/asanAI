#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "selenium",
#     "webdriver-manager",
# ]
# ///
"""
Browser regression tests for the Ten Minutes LearnSys prototype.

Run from the repository root:
    uv run blog/tests/learnsys_browser_test.py
    uv run blog/tests/learnsys_browser_test.py --mobile-only

The test serves the blog directory locally and drives learnsystest.html with
headless Chromium. It covers the parts that only exist in the browser:
font-size persistence and clamping, the scrollable day rail, element-level step
transitions, day transitions, focus mode, inline glossary, and mobile overflow.
"""

import argparse
import http.server
import socket
import socketserver
import threading
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"
PAGE = "/tenminutes/learnsystest.html"

BENIGN = ("favicon", "Failed to load resource: net::ERR_ABORTED", "WebGL")


class Results:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.failures = []

    def check(self, name, ok, detail=""):
        if ok:
            self.passed += 1
        else:
            self.failed += 1
            self.failures.append((name, detail))
            print(f"  FAIL  {name}" + (f" — {detail}" if detail else ""))


def free_port():
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def start_server():
    port = free_port()

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(BLOG), **kwargs)

        def log_message(self, *args):
            pass

    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", port), Handler)
    httpd.daemon_threads = True
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    for _ in range(60):
        try:
            sock = socket.create_connection(("127.0.0.1", port), timeout=0.1)
            sock.close()
            break
        except OSError:
            time.sleep(0.05)
    return httpd, f"http://127.0.0.1:{port}"


def make_driver(width=1440, height=900):
    opts = Options()
    for arg in ("--headless=new", "--no-sandbox", "--disable-gpu", f"--window-size={width},{height}"):
        opts.add_argument(arg)
    opts.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    try:
        return webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)
    except Exception:
        return webdriver.Chrome(options=opts)


def wait_ready(driver, timeout=30):
    end = time.time() + timeout
    while time.time() < end:
        try:
            if driver.execute_script("return document.readyState") == "complete":
                time.sleep(0.8)
                return True
        except Exception:
            pass
        time.sleep(0.2)
    return False


def console_errors(driver):
    out = []
    try:
        for entry in driver.get_log("browser"):
            if entry.get("level") != "SEVERE":
                continue
            msg = entry.get("message", "")
            if any(b in msg for b in BENIGN):
                continue
            out.append(msg)
    except Exception:
        pass
    return out


def js(driver, script, *args):
    if not script.lstrip().startswith("return"):
        script = "return " + script
    return driver.execute_script(script, *args)


def reset_prefs(driver, base):
    driver.get(base + PAGE)
    wait_ready(driver)
    driver.execute_script("try{localStorage.clear();}catch(e){}")
    driver.get(base + PAGE)
    wait_ready(driver)


def check_font(driver, results):
    size0 = js(driver, "parseFloat(getComputedStyle(document.querySelector('.ls-body')).fontSize)")
    js(driver, "document.querySelector('#ls-font-plus').click()")
    time.sleep(0.2)
    size1 = js(driver, "parseFloat(getComputedStyle(document.querySelector('.ls-body')).fontSize)")
    results.check("font plus increases size", size1 > size0, f"{size0} -> {size1}")

    for _ in range(8):
        js(driver, "document.querySelector('#ls-font-plus').click()")
        time.sleep(0.05)
    size_max = js(driver, "parseFloat(getComputedStyle(document.querySelector('.ls-body')).fontSize)")
    results.check("font is clamped at maximum", size_max <= 24.0, str(size_max))
    results.check("font max button disabled", js(driver, "document.querySelector('#ls-font-plus').disabled"))

    driver.refresh()
    wait_ready(driver)
    size_reload = js(driver, "parseFloat(getComputedStyle(document.querySelector('.ls-body')).fontSize)")
    results.check("font persists after reload", abs(size_reload - size_max) < 0.5, f"{size_max} -> {size_reload}")

    for _ in range(10):
        js(driver, "document.querySelector('#ls-font-minus').click()")
        time.sleep(0.03)
    size_min = js(driver, "parseFloat(getComputedStyle(document.querySelector('.ls-body')).fontSize)")
    results.check("font is clamped at minimum", size_min >= 14.0, str(size_min))
    results.check("font min button disabled", js(driver, "document.querySelector('#ls-font-minus').disabled"))


def check_days(driver, results):
    count = js(driver, "document.querySelectorAll('.ls-day').length")
    results.check("seven prototype days", count == 7, str(count))
    active_bg = js(
        driver,
        "getComputedStyle(document.querySelector('.ls-day.is-on')).backgroundColor",
    )
    results.check("active day is green", "99, 164, 75" in active_bg, active_bg)
    results.check(
        "active day has aria-current",
        js(driver, "document.querySelector('.ls-day.is-on').getAttribute('aria-current')") == "step",
    )

    # A selected track is a lens: every day stays visible, the others dim.
    js(driver, "(function(){var s=document.querySelector('#ls-track'); s.value='idea'; s.dispatchEvent(new Event('change',{bubbles:true})); return true;})()")
    time.sleep(0.6)
    results.check(
        "all days stay visible while a track is selected",
        js(driver, "document.querySelectorAll('.ls-day').length") == 7,
    )
    results.check(
        "off-track days dim instead of disappearing",
        js(driver, "document.querySelectorAll('.ls-day.is-dim').length") == 6,
    )
    results.check(
        "track lens selects its first day",
        js(driver, "document.querySelector('.ls-day.is-on').getAttribute('data-day')") == "0",
    )

    # A dimmed day remains a shortcut: click it and its track becomes the lens.
    js(driver, "document.querySelectorAll('.ls-day')[6].click()")
    time.sleep(0.7)
    results.check(
        "dimmed day is still clickable",
        js(driver, "document.querySelector('.ls-day.is-on').getAttribute('data-day')") == "6",
    )
    results.check(
        "cross-track click follows the day's track",
        js(driver, "document.querySelector('#ls-track').value") == js(driver, "document.querySelectorAll('.ls-day')[6].getAttribute('data-track')"),
    )
    results.check(
        "all days remain after a cross-track jump",
        js(driver, "document.querySelectorAll('.ls-day').length") == 7,
    )

    # Home / End are linear jumps over the whole rail.
    js(driver, "document.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}))")
    time.sleep(0.6)
    results.check(
        "Home jumps to the first day",
        js(driver, "document.querySelector('.ls-day.is-on').getAttribute('data-day')") == "0",
    )
    js(driver, "document.dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}))")
    time.sleep(0.6)
    results.check(
        "End jumps to the last day",
        js(driver, "document.querySelector('.ls-day.is-on').getAttribute('data-day')") == "6",
    )
    js(driver, "document.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}))")
    time.sleep(0.6)

    js(driver, "document.querySelectorAll('[data-day-nav=\"1\"]')[0].click()")
    time.sleep(0.7)
    label = js(driver, "document.querySelector('.ls-day.is-on .ls-day-num').textContent")
    results.check("day next changes active day", label not in ("", None), str(label))

    for _ in range(5):
        js(driver, "document.querySelectorAll('[data-day-nav=\"1\"]')[0].click()")
        time.sleep(0.15)
    time.sleep(0.8)
    scroll_left = js(driver, "document.querySelector('#ls-days').scrollLeft")
    scrollable = js(driver, "document.querySelector('#ls-days').scrollWidth > document.querySelector('#ls-days').clientWidth + 1")
    results.check("day rail scrolls to active day", (not scrollable) or scroll_left > 0, f"{scroll_left} scrollable={scrollable}")
    results.check(
        "day rail snaps smoothly",
        "x" in js(driver, "getComputedStyle(document.querySelector('#ls-days')).scrollSnapType"),
    )
    results.check(
        "day rail fully on screen",
        js(driver, "(function(){var r=document.querySelector('.ls-bottom').getBoundingClientRect();return r.top>=0 && r.bottom<=window.innerHeight+1;})()"),
    )
    results.check(
        "day chip fully on screen",
        js(driver, "(function(){var r=document.querySelector('.ls-day.is-on').getBoundingClientRect();return r.top>=0 && r.bottom<=window.innerHeight+1;})()"),
    )

    prevented = js(
        driver,
        "(function(){var el=document.querySelector('#ls-days');var e=new WheelEvent('wheel',{deltaY:-200,bubbles:true,cancelable:true});el.dispatchEvent(e);return e.defaultPrevented;})()",
    )
    results.check("day rail captures the wheel", prevented)


def check_spacemorph(driver, results):
    js(driver, "document.querySelectorAll('.ls-day')[1].click()")
    time.sleep(1.2)
    results.check("space morph iframe mounted", js(driver, "!!document.querySelector('.ls-iframe')"))
    results.check("space morph title", js(driver, "document.querySelector('#ls-stage-title').textContent") == "Zwei Klassen, keine gerade Linie")
    results.check(
        "space morph demo initialised",
        js(driver, "document.querySelector('.ls-iframe').contentDocument.querySelector('#ism-counter').textContent") == "1 / 9",
    )
    results.check(
        "space morph canvas present",
        js(driver, "!!document.querySelector('.ls-iframe').contentDocument.querySelector('#ism-canvas')"),
    )


def check_transitions(driver, results):
    # Step change: element animation, no full-canvas overlay.
    js(driver, "document.querySelectorAll('.ls-day')[2].click()")
    time.sleep(0.9)
    js(driver, "document.querySelector('#ls-next').click()")
    time.sleep(0.1)
    results.check("step change has no overlay", not js(driver, "!!document.querySelector('.ls-morph-overlay')"))
    time.sleep(0.5)
    results.check(
        "dynamic canvas visible after step",
        js(driver, "getComputedStyle(document.querySelector('.ls-canvas--dynamic') || document.querySelector('.ls-canvas')).opacity") == "1",
    )

    # Day change: one morph overlay, then gone; no stuck opacity.
    js(driver, "document.querySelectorAll('.ls-day')[5].click()")
    time.sleep(0.1)
    results.check("day change has morph overlay", js(driver, "!!document.querySelector('.ls-morph-overlay')"))
    time.sleep(0.8)
    results.check("day morph finishes", not js(driver, "!!document.querySelector('.ls-morph-overlay')"))
    results.check(
        "canvas visible after day change",
        js(driver, "getComputedStyle(document.querySelector('.ls-canvas')).opacity") == "1",
    )


def check_focus_and_inline(driver, results):
    js(driver, "document.querySelectorAll('.ls-day')[0].click()")
    time.sleep(0.8)
    js(driver, "document.querySelector('#ls-focus').click()")
    time.sleep(0.3)
    results.check("focus mode hides text", js(driver, "getComputedStyle(document.querySelector('.ls-text')).display") == "none")
    js(driver, "document.querySelector('#ls-focus').click()")
    time.sleep(0.3)
    results.check("focus mode restores text", js(driver, "getComputedStyle(document.querySelector('.ls-text')).display") != "none")

    js(driver, "document.querySelector('[data-depth=\"short\"]').click()")
    time.sleep(0.2)
    results.check("depth root is compact in short mode", not js(driver, "document.querySelector('.ls-deepbox--root').open"))
    js(driver, "document.querySelector('#ls-depth-btn').click()")
    time.sleep(0.3)
    results.check("depth button opens root", js(driver, "document.querySelector('.ls-deepbox--root').open"))

    js(driver, "document.querySelector('.ls-term').click()")
    time.sleep(0.2)
    results.check("glossary opens inline", not js(driver, "document.querySelector('.ls-term-note').hidden"))
    results.check("no right glossary panel", not js(driver, "!!document.querySelector('#ls-panel')"))


def check_mobile(driver, results):
    driver.set_window_size(390, 844)
    time.sleep(0.6)
    overflow = js(driver, "document.documentElement.scrollWidth - document.documentElement.clientWidth")
    results.check("mobile has no horizontal overflow", overflow <= 1, str(overflow))
    results.check("mobile font controls visible", js(driver, "!!document.querySelector('#ls-font-plus')"))
    results.check("mobile day rail present", js(driver, "!!document.querySelector('#ls-days')"))
    results.check(
        "mobile day rail fully on screen",
        js(driver, "(function(){var r=document.querySelector('.ls-bottom').getBoundingClientRect();return r.top>=0 && r.bottom<=window.innerHeight+1;})()"),
    )
    js(driver, "document.querySelectorAll('.ls-day')[0].click()")
    time.sleep(0.6)
    before = js(driver, "document.querySelector('#ls-days').scrollLeft")
    js(driver, "document.querySelector('#ls-days').dispatchEvent(new WheelEvent('wheel',{deltaY:240,bubbles:true,cancelable:true}))")
    time.sleep(0.7)
    after = js(driver, "document.querySelector('#ls-days').scrollLeft")
    results.check("mobile wheel moves the day rail", after > before, f"{before} -> {after}")
    js(driver, "document.querySelector('#ls-focus').click()")
    time.sleep(0.3)
    results.check("mobile focus mode hides text", js(driver, "getComputedStyle(document.querySelector('.ls-text')).display") == "none")
    js(driver, "document.querySelector('#ls-focus').click()")
    time.sleep(0.2)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mobile-only", action="store_true")
    args = ap.parse_args()

    httpd, base = start_server()
    driver = make_driver()
    results = Results()
    try:
        reset_prefs(driver, base)
        time.sleep(1.0)
        if not args.mobile_only:
            results.check("page has LearnSys app", js(driver, "!!document.querySelector('.ls-app')"),
                           driver.current_url + " | " + driver.title + " | " + " || ".join(console_errors(driver)))
            check_font(driver, results)
            reset_prefs(driver, base)
            check_days(driver, results)
            reset_prefs(driver, base)
            check_spacemorph(driver, results)
            reset_prefs(driver, base)
            check_transitions(driver, results)
            check_focus_and_inline(driver, results)
        check_mobile(driver, results)
        errors = console_errors(driver)
        results.check("no severe console errors", not errors, " | ".join(errors[:3]))
    finally:
        driver.quit()
        httpd.shutdown()

    print("")
    print(f"{results.passed} passed, {results.failed} failed")
    if results.failures:
        print("FAILURES:")
        for name, detail in results.failures:
            print(f"  - {name}" + (f" ({detail})" if detail else ""))
    raise SystemExit(1 if results.failed else 0)


if __name__ == "__main__":
    main()
