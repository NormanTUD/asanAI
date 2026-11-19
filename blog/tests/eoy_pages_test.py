#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "selenium",
#     "webdriver-manager",
# ]
# ///
"""Walk every eoy page and every slide/substep in both languages.

The eoy split is a set of static LearnSys pages. This test boots a PHP server,
opens eoy/index.php plus eoy/1.php … eoy/31.php, and drives every reachable
slide: the index through all 31 steps and their substeps, each single page
through its own substeps with the real next/back buttons.

Failures include any console error or warning (apart from a small environment
allowlist), unrendered math, horizontal overflow, missing prose, a wrong
next/back state at the boundaries, and wrong button placement (back left,
forward right).

Run from the repository root:
    uv run blog/tests/eoy_pages_test.py
    uv run blog/tests/eoy_pages_test.py --langs en
    uv run blog/tests/eoy_pages_test.py --pages 2.php 24.php
"""

import argparse
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
EOY = BLOG / "eoy"

BENIGN = (
    "Error creating WebGL Context",
    "clearColor",
    "WebGL",
    "favicon",
    "net::ERR_ABORTED",
)


def free_port():
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def discovered_pages(only=None):
    pages = ["index.php"]
    numbered = {p.name: p for p in EOY.glob("[0-9]*.php")}
    for i in range(1, 32):
        name = f"{i}.php"
        if name in numbered:
            pages.append(name)
    if only:
        wanted = set(only)
        pages = [p for p in pages if p in wanted]
    return pages


def make_driver():
    opts = Options()
    for arg in ("--headless=new", "--no-sandbox", "--disable-gpu", "--window-size=1200,900"):
        opts.add_argument(arg)
    opts.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    try:
        return webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)
    except Exception:
        return webdriver.Chrome(options=opts)


def wait_app(driver, timeout=20):
    end = time.time() + timeout
    while time.time() < end:
        try:
            if driver.execute_script("return !!(window.LearnSys && document.querySelector('#ls-title'))"):
                return True
        except Exception:
            pass
        time.sleep(0.15)
    return False


def state(driver):
    return driver.execute_script(
        """
return {
  title: ((document.getElementById('ls-title') || {}).textContent || '').trim(),
  kicker: ((document.getElementById('ls-kicker') || {}).textContent || '').trim(),
  text: ((document.getElementById('ls-body') || {}).innerText || '').trim().length,
  math: document.querySelectorAll('[data-tex]:not([data-tex-rendered="1"])').length,
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  dots: document.querySelectorAll('#ls-steps .ls-dot').length,
  prev: (function () {
    var n = document.getElementById('ls-prev');
    if (!n || n.hidden || getComputedStyle(n).display === 'none') return null;
    var r = n.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right) };
  })(),
  next: (function () {
    var n = document.getElementById('ls-next');
    if (!n || n.hidden || getComputedStyle(n).display === 'none') return null;
    var r = n.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right) };
  })(),
  vw: window.innerWidth
};
"""
    )


def signature(driver):
    return driver.execute_script(
        "return ['ls-kicker','ls-title','ls-body'].map(function (id) {"
        " var el = document.getElementById(id); return el ? el.textContent : ''; }).join('|');"
    )


def console_issues(driver):
    issues = []
    try:
        entries = driver.get_log("browser")
    except Exception:
        return issues
    for entry in entries:
        level = entry.get("level")
        if level not in ("SEVERE", "WARNING"):
            continue
        message = entry.get("message", "")
        if any(token in message for token in BENIGN):
            continue
        issues.append(f"{level}: {message[:260]}")
    return issues


class Results:
    def __init__(self):
        self.checks = 0
        self.failures = []

    def check(self, page, lang, name, ok, detail=""):
        self.checks += 1
        if ok:
            return True
        self.failures.append((page, lang, name, detail))
        print(f"  FAIL {page} [{lang}] {name}" + (f" — {detail}" if detail else ""))
        return False

    def page_state(self, driver, page, lang, name, min_text=40):
        s = state(driver)
        issues = console_issues(driver)
        ok = self.check(page, lang, f"{name}: title", bool(s["title"]), s["title"][:80])
        ok = self.check(page, lang, f"{name}: prose", s["text"] > min_text, str(s["text"])) and ok
        ok = self.check(page, lang, f"{name}: math", s["math"] == 0, str(s["math"])) and ok
        ok = self.check(page, lang, f"{name}: overflow", s["overflow"] <= 2, f"+{s['overflow']}px") and ok
        ok = self.check(page, lang, f"{name}: console", not issues, " | ".join(issues)[:300]) and ok
        return ok, s


def check_layout(results, page, lang, name, s):
    if s["prev"] and s["prev"]["left"] > s["vw"] * 0.35:
        results.check(page, lang, f"{name}: back left", False, str(s["prev"]))
    if s["next"] and s["next"]["right"] < s["vw"] * 0.65:
        results.check(page, lang, f"{name}: forward right", False, str(s["next"]))


def walk_index(driver, results, page, lang):
    ok, s = results.page_state(driver, page, lang, "load")
    results.check(page, lang, "index has 31 steps", s["dots"] == 31, str(s["dots"]))
    if not ok:
        return
    for step in range(31):
        try:
            driver.execute_script("LearnSys.go(0, arguments[0], 0)", step)
        except Exception as exc:
            results.check(page, lang, f"step {step + 1}", False, str(exc)[:160])
            continue
        time.sleep(0.32)
        ok, s = results.page_state(driver, page, lang, f"step {step + 1}", 20)
        if not ok:
            return
        previous = signature(driver)
        for sub in range(1, 8):
            try:
                driver.execute_script("LearnSys.go(0, arguments[0], arguments[1])", step, sub)
            except Exception as exc:
                results.check(page, lang, f"step {step + 1} sub {sub + 1}", False, str(exc)[:160])
                break
            time.sleep(0.32)
            current = signature(driver)
            if current == previous:
                break
            ok, s = results.page_state(driver, page, lang, f"step {step + 1} sub {sub + 1}", 20)
            if not ok:
                return
            previous = current
    try:
        driver.execute_script("LearnSys.go(0, 30, 10)")
    except Exception:
        pass
    time.sleep(0.4)
    _, s = results.page_state(driver, page, lang, "end", 20)
    results.check(page, lang, "end: forward hidden", s["next"] is None, str(s["next"]))
    results.check(page, lang, "end: back visible", s["prev"] is not None, str(s["prev"]))
    check_layout(results, page, lang, "end", s)
    try:
        driver.execute_script("LearnSys.go(0, 1, 0)")
    except Exception:
        pass
    time.sleep(0.4)
    _, s = results.page_state(driver, page, lang, "middle", 20)
    results.check(page, lang, "middle: both buttons", s["prev"] is not None and s["next"] is not None, str(s))
    check_layout(results, page, lang, "middle", s)


def page_number(page):
    try:
        return int(page.split(".")[0])
    except ValueError:
        return 0


def walk_single(driver, results, page, lang):
    total_pages = 31
    number = page_number(page)
    original_url = driver.current_url
    ok, _ = results.page_state(driver, page, lang, "load")
    if not ok:
        return

    driver.execute_script("LearnSys.go(0, 0, 0)")
    time.sleep(0.25)
    previous = signature(driver)
    max_sub = 0
    for sub in range(1, 8):
        driver.execute_script("LearnSys.go(0, 0, arguments[0])", sub)
        time.sleep(0.25)
        current = signature(driver)
        if current == previous:
            break
        ok, _ = results.page_state(driver, page, lang, f"sub {sub + 1}", 20)
        if not ok:
            return
        max_sub = sub
        previous = current

    driver.execute_script("LearnSys.go(0, 0, 0)")
    time.sleep(0.25)
    _, s = results.page_state(driver, page, lang, "start", 20)
    results.check(
        page, lang,
        "start: back visible" if number > 1 else "start: back hidden",
        (s["prev"] is not None) == (number > 1),
        str(s["prev"]),
    )
    results.check(page, lang, "start: forward visible", s["next"] is not None, str(s["next"]))
    check_layout(results, page, lang, "start", s)

    driver.execute_script("LearnSys.go(0, 0, arguments[0])", max_sub)
    time.sleep(0.25)
    _, s = results.page_state(driver, page, lang, "end", 20)
    results.check(page, lang, "end: back visible", s["prev"] is not None, str(s["prev"]))
    results.check(
        page, lang,
        "end: forward visible" if number < total_pages else "end: forward hidden",
        (s["next"] is not None) == (number < total_pages),
        str(s["next"]),
    )
    check_layout(results, page, lang, "end", s)

    if number < total_pages:
        driver.execute_script("LearnSys.go(0, 0, arguments[0])", max_sub)
        time.sleep(0.2)
        try:
            driver.find_element("id", "ls-next").click()
            wait_app(driver, 12)
            time.sleep(0.4)
            issues = console_issues(driver)
            results.check(page, lang, "forward: console", not issues, " | ".join(issues)[:300])
            path = driver.execute_script("return location.pathname")
            expected = f"/{number + 1}.php"
            results.check(
                page, lang, "forward -> next page",
                path.endswith(expected) or path.endswith(f"/{number + 1}"),
                path,
            )
        except Exception as exc:
            results.check(page, lang, "forward -> next page", False, str(exc)[:160])
        driver.get(original_url)
        wait_app(driver, 12)
        time.sleep(0.4)

    if number > 1:
        driver.execute_script("LearnSys.go(0, 0, 0)")
        time.sleep(0.2)
        try:
            driver.find_element("id", "ls-prev").click()
            wait_app(driver, 12)
            time.sleep(0.4)
            issues = console_issues(driver)
            results.check(page, lang, "back: console", not issues, " | ".join(issues)[:300])
            path = driver.execute_script("return location.pathname")
            expected = f"/{number - 1}.php"
            results.check(
                page, lang, "back -> previous page",
                path.endswith(expected) or path.endswith(f"/{number - 1}"),
                path,
            )
        except Exception as exc:
            results.check(page, lang, "back -> previous page", False, str(exc)[:160])
        driver.get(original_url)
        wait_app(driver, 12)
        time.sleep(0.4)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--langs", default="en,de", help="comma-separated en,de")
    parser.add_argument("--pages", nargs="*", help="only these page files, e.g. 2.php 24.php")
    parser.add_argument("--settle", type=float, default=1.6, help="seconds after each page load")
    args = parser.parse_args()

    langs = [x.strip() for x in args.langs.split(",") if x.strip() in ("en", "de")]
    pages = discovered_pages(args.pages)
    if not pages:
        print("No eoy pages found")
        return 1

    port = free_port()
    server = subprocess.Popen(
        ["php", "-S", f"127.0.0.1:{port}", "-t", str(BLOG)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(1.0)
    driver = make_driver()
    results = Results()
    base = f"http://127.0.0.1:{port}"
    try:
        for page in pages:
            for lang in langs:
                print(f"→ {page} [{lang}]")
                try:
                    driver.get(f"{base}/eoy/{page}?lang={lang}")
                except Exception as exc:
                    results.check(page, lang, "load", False, str(exc)[:160])
                    continue
                if not wait_app(driver):
                    results.check(page, lang, "app ready", False, "LearnSys did not mount")
                    continue
                time.sleep(args.settle)
                if page == "index.php":
                    walk_index(driver, results, page, lang)
                else:
                    walk_single(driver, results, page, lang)
    finally:
        driver.quit()
        server.terminate()

    print(f"\n{results.checks} checks, {len(results.failures)} failure(s)")
    if results.failures:
        for failure in results.failures[:25]:
            print("FAILURE", failure)
        return 1
    print("eoy pages: all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
