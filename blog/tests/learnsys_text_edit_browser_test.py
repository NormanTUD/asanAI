#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["selenium", "webdriver-manager"]
# ///
"""Short-text, question-group and edit-mode regression test for LearnSys.

Run from the repository root:
    uv run blog/tests/learnsys_text_edit_browser_test.py
"""

from __future__ import annotations

import shutil
import socket
import subprocess
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.core.os_manager import ChromeType

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"
BENIGN = ("favicon", "net::ERR_ABORTED", "WebGL")

checks = 0
failures = 0


def check(condition: bool, label: str, detail: str = "") -> None:
    global checks, failures
    checks += 1
    if condition:
        print(f"ok   {label}")
        return
    failures += 1
    print(f"FAIL {label}" + (f" — {detail}" if detail else ""))


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def make_driver() -> webdriver.Chrome:
    options = Options()
    for arg in [
        "--headless=new",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1400,1000",
        "--disable-extensions",
    ]:
        options.add_argument(arg)
    options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    binary = shutil.which("chromium-browser") or shutil.which("chromium") or shutil.which("google-chrome")
    if binary:
        options.binary_location = binary
    try:
        return webdriver.Chrome(
            service=Service(ChromeDriverManager(chrome_type=ChromeType.CHROMIUM).install()),
            options=options,
        )
    except Exception:
        return webdriver.Chrome(options=options)


def wait_until(driver: webdriver.Chrome, script: str, timeout: float = 60) -> bool:
    end = time.time() + timeout
    while time.time() < end:
        try:
            if driver.execute_script(script):
                return True
        except Exception:
            pass
        time.sleep(0.2)
    return False


def js(driver: webdriver.Chrome, script: str):
    if not script.lstrip().startswith("return"):
        script = "return " + script
    return driver.execute_script(script)


def console_errors(driver: webdriver.Chrome) -> list[str]:
    out: list[str] = []
    try:
        for entry in driver.get_log("browser"):
            if entry.get("level") != "SEVERE":
                continue
            msg = entry.get("message", "")
            if any(token in msg for token in BENIGN):
                continue
            out.append(msg)
    except Exception:
        pass
    return out


def reset_page(driver: webdriver.Chrome, url: str) -> None:
    driver.get(url)
    wait_until(driver, "return !!(window.LearnSys && document.querySelector('#ls-body'));")
    driver.execute_script(
        "try{localStorage.removeItem('tm_learnsys_text_v1');localStorage.removeItem('tm_learnsys_pref_v1');}catch(e){}"
    )
    driver.refresh()
    wait_until(driver, "return !!(window.LearnSys && document.querySelector('#ls-body'));")
    time.sleep(0.6)


def main() -> int:
    port = free_port()
    server = subprocess.Popen(
        ["php", "-S", f"127.0.0.1:{port}", "-t", str(BLOG)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    driver = None
    try:
        time.sleep(1.0)
        base = f"http://127.0.0.1:{port}/tenminutes/intuition_learnsys.php"
        driver = make_driver()
        reset_page(driver, base + "?lang=de")

        body = js(driver, "document.querySelector('#ls-body').innerText")
        check("Lorem ipsum" in body, "draft body shows lorem ipsum", body[:80])
        check(len(body.strip()) > 40, "draft body is a short paragraph")
        check(bool(js(driver, "!!document.querySelector('#ls-body [data-tex-rendered=\"1\"]')")), "draft body renders an abstract formula")
        root = js(driver, "document.querySelector('#ls-extras .ls-deepbox--root')")
        check(bool(root), "more-knowledge root exists")
        check("Mehr erfahren" in js(driver, "document.querySelector('#ls-extras .ls-deepbox--root > summary').textContent"), "more-knowledge root names the door")
        check(js(driver, "document.querySelectorAll('.ls-question-index button').length") >= 2, "question index is visible")
        check(js(driver, "document.querySelector('.ls-more-kicker').textContent").strip() == "Weiterfragen", "question index invites follow-up")
        check(js(driver, "document.querySelectorAll('#ls-extras .ls-qgroup').length") >= 2, "question groups are present")
        check("Bisheriger Text" in js(driver, "document.querySelector('#ls-extras').textContent"), "original text is kept recoverable")

        js(driver, "document.querySelector('.ls-question-index button').click()")
        time.sleep(0.35)
        check(bool(js(driver, "document.querySelector('#ls-extras .ls-qgroup').open")), "index click opens the target group")
        check(bool(js(driver, "document.querySelector('#ls-extras .ls-deepbox--root').open")), "index click opens the root")

        js(driver, "document.querySelector('#ls-edit-btn').click()")
        time.sleep(0.25)
        check(bool(js(driver, "!!document.querySelector('#ls-edit-body')")), "edit mode shows the editor")
        check("Lorem ipsum" in js(driver, "document.querySelector('#ls-edit-body').value"), "editor starts with lorem")

        js(
            driver,
            "return (function(){var ta=document.querySelector('#ls-edit-body');"
            "ta.value='Erster Satz. Zweiter Satz. Dritter Satz. Vierter Satz.';"
            "ta.dispatchEvent(new Event('input',{bubbles:true}));return ta.value;})()",
        )
        time.sleep(0.5)
        check(
            "Erster Satz" in js(driver, "JSON.stringify(LearnSys.text.overlay('de'))"),
            "edit saves the short text to storage",
        )
        js(
            driver,
            "return (function(){var ta=document.querySelector('#ls-edit-body');"
            "ta.value='Eins. Zwei. Drei. Vier. Fünf. Sechs.';"
            "ta.dispatchEvent(new Event('input',{bubbles:true}));return true;})()",
        )
        time.sleep(0.1)
        check(bool(js(driver, "document.querySelector('#ls-edit-count').classList.contains('is-over')")), "editor warns above five sentences")
        js(
            driver,
            "return (function(){var ta=document.querySelector('#ls-edit-body');"
            "ta.value='Erster Satz. Zweiter Satz. Dritter Satz. Vierter Satz.';"
            "ta.dispatchEvent(new Event('input',{bubbles:true}));return true;})()",
        )
        js(driver, "document.querySelector('[data-edit-action=\"save\"]').click()")
        time.sleep(0.3)
        check("Gespeichert" in js(driver, "document.querySelector('#ls-edit-status').textContent"), "save reports success")
        js(driver, "document.querySelector('[data-edit-action=\"exit\"]').click()")
        time.sleep(0.4)
        check("Erster Satz." in js(driver, "document.querySelector('#ls-body').innerText"), "edited text replaces lorem")
        check("Lorem ipsum" not in js(driver, "document.querySelector('#ls-body').innerText"), "edited text no longer shows lorem")
        check(js(driver, "document.querySelectorAll('#ls-body p').length") == 1, "edited text has one short paragraph")

        driver.refresh()
        wait_until(driver, "return !!(window.LearnSys && document.querySelector('#ls-body'));")
        time.sleep(0.5)
        check("Erster Satz." in js(driver, "document.querySelector('#ls-body').innerText"), "edited text survives a reload")

        js(driver, "document.querySelector('#ls-edit-btn').click()")
        time.sleep(0.2)
        js(driver, "document.querySelector('[data-edit-action=\"reset\"]').click()")
        time.sleep(0.3)
        js(driver, "document.querySelector('[data-edit-action=\"exit\"]').click()")
        time.sleep(0.4)
        check("Lorem ipsum" in js(driver, "document.querySelector('#ls-body').innerText"), "reset restores the lorem placeholder")

        reset_page(driver, base + "?lang=en")
        check("Lorem ipsum" in js(driver, "document.querySelector('#ls-body').innerText"), "english draft shows lorem")
        check("Learn more" in js(driver, "document.querySelector('#ls-extras .ls-deepbox--root > summary').textContent"), "english door is translated")
        check(js(driver, "document.querySelector('#ls-edit-btn').textContent").strip() == "Edit text", "english edit button is translated")

        driver.set_window_size(390, 844)
        time.sleep(0.4)
        check(
            js(driver, "document.documentElement.scrollWidth - document.documentElement.clientWidth") <= 1,
            "mobile has no horizontal overflow",
        )
        js(driver, "document.querySelector('#ls-focus').click()")
        time.sleep(0.3)
        js(driver, "document.querySelector('#ls-focus').click()")
        time.sleep(0.2)
        js(driver, "document.querySelector('#ls-text-toggle').click()")
        time.sleep(0.3)
        js(driver, "document.querySelector('#ls-edit-btn').click()")
        time.sleep(0.3)
        check(
            js(driver, "document.documentElement.scrollWidth - document.documentElement.clientWidth") <= 1,
            "mobile editor has no horizontal overflow",
        )

        errors = console_errors(driver)
        check(not errors, "no severe console errors", " | ".join(errors[:2]))
    finally:
        if driver:
            driver.quit()
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()

    print("")
    print(f"{checks - failures} passed, {failures} failed")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
