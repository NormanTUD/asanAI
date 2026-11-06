#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "selenium",
#     "webdriver-manager",
# ]
# ///
"""
Smoke tests for every Ten Minutes subpage.

The checks are deliberately content-agnostic so they do not break when a
lesson is edited:

  * the page loads and has visible text;
  * no severe console errors;
  * no horizontal page overflow;
  * every [data-tex] element has been typeset.

Both language variants are checked. Pages are discovered from the directory,
not hardcoded.

Run from the repository root:
    uv run blog/tests/tenminutes_pages_test.py
    uv run blog/tests/tenminutes_pages_test.py --langs en
    uv run blog/tests/tenminutes_pages_test.py --pages transformer.php tokenizerlab.php

CI: `.github/workflows/blog_php_validator.yml` (php-render-validation job).
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
TM = BLOG / "tenminutes"

INTERNAL = {"bootstrap.php", "globals.php"}

# Console noise that is environmental, not a page bug.
BENIGN = (
    "Error creating WebGL Context",
    "clearColor",
    "WebGL",
    "Failed to load resource: net::ERR_ABORTED",
    "favicon",
)


def free_port():
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def discover_pages(only=None):
    pages = sorted(p.name for p in TM.glob("*.php") if p.name not in INTERNAL)
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


def wait_complete(driver, timeout=40):
    end = time.time() + timeout
    while time.time() < end:
        try:
            if driver.execute_script("return document.readyState") == "complete":
                return True
        except Exception:
            pass
        time.sleep(0.2)
    return False


def wait_math(driver, timeout=6):
    end = time.time() + timeout
    last = -1
    while time.time() < end:
        try:
            last = driver.execute_script(
                "return document.querySelectorAll('[data-tex]:not([data-tex-rendered=\"1\"])').length"
            )
            if last == 0:
                return 0
        except Exception:
            pass
        time.sleep(0.25)
    return last


class Results:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.failures = []

    def check(self, page, lang, name, ok, detail=""):
        if ok:
            self.passed += 1
        else:
            self.failed += 1
            self.failures.append((page, lang, name, detail))
            print(f"  FAIL  {page} [{lang}] {name}" + (f" — {detail}" if detail else ""))


def check_page(driver, base, page, lang, results, settle):
    url = f"{base}/{page}?lang={lang}"
    try:
        driver.get(url)
    except Exception as exc:
        results.check(page, lang, "load", False, str(exc)[:120])
        return
    if not wait_complete(driver):
        results.check(page, lang, "load", False, "document.readyState did not reach complete")
        return
    time.sleep(settle)

    state = driver.execute_script(
        """
return {
  text: (document.body.innerText || '').trim().length,
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  title: document.title || '',
  math: document.querySelectorAll('[data-tex]:not([data-tex-rendered="1"])').length
};
"""
    )
    results.check(page, lang, "has content", state["text"] > 40, f"text length {state['text']}")
    results.check(page, lang, "has title", bool(state["title"].strip()), state["title"][:60])
    results.check(page, lang, "no horizontal overflow", state["overflow"] <= 2, f"+{state['overflow']}px")

    remaining = wait_math(driver)
    results.check(page, lang, "math rendered", remaining == 0, f"{remaining} unrendered [data-tex]")

    errors = []
    try:
        for entry in driver.get_log("browser"):
            if entry.get("level") != "SEVERE":
                continue
            msg = entry.get("message", "")
            if any(token in msg for token in BENIGN):
                continue
            errors.append(msg[:180])
    except Exception:
        pass
    results.check(page, lang, "no console errors", not errors, " | ".join(errors)[:240])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--langs", default="en,de", help="comma-separated language variants")
    parser.add_argument("--pages", nargs="*", default=None, help="only these page filenames")
    parser.add_argument("--settle", type=float, default=0.8, help="seconds to wait after load")
    args = parser.parse_args()

    pages = discover_pages(args.pages)
    langs = [lang.strip() for lang in args.langs.split(",") if lang.strip()]
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
    results = Results()
    try:
        driver = make_driver()
        print(f"[tenminutes] {len(pages)} page(s) × {len(langs)} language(s)")
        for page in pages:
            for lang in langs:
                check_page(driver, base, page, lang, results, args.settle)
    finally:
        if driver:
            driver.quit()
        server.terminate()
        try:
            server.wait(timeout=5)
        except Exception:
            server.kill()

    total = results.passed + results.failed
    print(f"\n{results.passed}/{total} checks passed, {results.failed} failed")
    if results.failures:
        print("\nFailures:")
        for page, lang, name, detail in results.failures:
            print(f"  {page} [{lang}] {name}: {detail}")
    return 1 if results.failed else 0


if __name__ == "__main__":
    sys.exit(main())
