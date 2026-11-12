#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["selenium", "webdriver-manager"]
# ///
"""Loop landscape on the live Ten Minutes intuition lesson.

The step "The distribution is not the answer" must show a stable whole-token
map, the bars and the landscape at the same time, and the actual chosen path.
The test drives the lesson with Selenium and reads the demo's debug snapshot.

Run from the repository root:
    uv run blog/tests/learnsys_loop_landscape_test.py
"""

from __future__ import annotations

import hashlib
import json
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

failures = 0
checks = 0


def check(condition: bool, label: str, detail: str = "") -> None:
    global failures, checks
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


def loop_state(driver: webdriver.Chrome) -> dict:
    return driver.execute_script(
        "const el=document.querySelector('.ls-loop-scene');"
        "return el && el.__lsLoopDebug ? el.__lsLoopDebug() : null;"
    ) or {}


def canvas_hash(driver: webdriver.Chrome) -> str:
    value = driver.execute_script(
        """
        const c = document.querySelector('.ls-loop-landscape canvas');
        if (!c || !c.width || !c.height) return null;
        const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let h = 0;
        for (let i = 0; i < data.length; i += 97) h = (h * 31 + data[i]) >>> 0;
        return String(h);
        """
    )
    return hashlib.sha256((value or "").encode("utf-8")).hexdigest()


def go_to_distribution_step(driver: webdriver.Chrome) -> bool:
    for _ in range(40):
        title = driver.execute_script(
            "return (document.getElementById('ls-stage-title') || {}).textContent || '';"
        ) or ""
        if "Verteilung" in title or "distribution" in title.lower():
            return True
        clicked = driver.execute_script(
            "const b=document.getElementById('ls-nav-next'); if (b) { b.click(); return true; } return false;"
        )
        if not clicked:
            return False
        time.sleep(0.25)
    return False


def main() -> int:
    port = free_port()
    base = f"http://127.0.0.1:{port}"
    server = subprocess.Popen(
        ["php", "-S", f"127.0.0.1:{port}", "-t", str(BLOG)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    driver = None
    try:
        time.sleep(1)
        driver = make_driver()
        driver.get(base + "/tenminutes/intuition_learnsys.php")
        check(wait_until(driver, "return !!window.LearnSys;", 120), "lesson boots")
        check(go_to_distribution_step(driver), "reach the distribution step")
        check(wait_until(driver,
                         "return !!document.querySelector('.ls-loop-scene.is-landscape');", 30),
              "loop landscape is active")
        time.sleep(0.4)

        state = loop_state(driver)
        lang = driver.execute_script("return window.LearnSys.lang();")
        expected = ["Später", "Niemand", "Ein"] if lang == "de" else ["Later", "Nobody", "A"]
        names = {item["t"] for item in state.get("catalog", [])}
        check(all(token in names for token in expected),
              "the whole catalog contains the end-of-sentence tokens", str(expected))
        check(len(state.get("catalog", [])) >= 30,
              "the map contains the full token catalog", str(len(state.get("catalog", []))))

        both = driver.execute_script(
            """
            const bars=document.querySelector('.ls-loop-bars');
            const land=document.querySelector('.ls-loop-landscape');
            const b=bars&&bars.getBoundingClientRect();
            const l=land&&land.getBoundingClientRect();
            const bg=bars&&getComputedStyle(bars).display;
            return {
              barsVisible: !!b && b.width > 50 && b.height > 20 && bg !== 'none',
              landVisible: !!l && !land.hidden && l.width > 80 && l.height > 80,
              canvas: !!(land && land.querySelector('canvas') && land.querySelector('canvas').width > 80)
            };
            """
        )
        check(both["barsVisible"], "bars stay visible next to the landscape", json.dumps(both))
        check(both["landVisible"] and both["canvas"], "landscape is rendered", json.dumps(both))

        before = loop_state(driver)
        before_hash = canvas_hash(driver)
        driver.execute_script("document.querySelector('.ls-loop-next').click();")
        time.sleep(0.5)
        after = loop_state(driver)
        after_hash = canvas_hash(driver)
        check(after.get("generated", 0) == before.get("generated", 0) + 1,
              "the demo advances one token", str(after.get("generated")))
        check(len(after.get("path", [])) == after.get("generated", 0),
              "the drawn path follows every chosen token", str(after.get("path")))
        check(json.dumps(before.get("catalog")) == json.dumps(after.get("catalog")),
              "token positions stay fixed between steps")
        check(before_hash != after_hash, "the landscape redraws for the new step")

        top = driver.execute_script(
            """
            const label=document.querySelector('.ls-loop-bar.is-on .ls-loop-bar-label');
            const value=document.querySelector('.ls-loop-bar.is-on .ls-loop-bar-val');
            return label ? {label:label.textContent, value:value?value.textContent:''} : null;
            """
        )
        check(bool(top), "a top bar is marked", str(top))
        if top:
            check(top["label"] == after.get("top"), "bar and landscape agree on the top token",
                  str(top) + " vs " + str(after.get("top")))
            try:
                pct = float(top["value"].replace("%", ""))
                check(abs(pct - float(after.get("topP", 0)) * 100) <= 1.0,
                      "bar height matches the landscape height", str(top) + " vs " + str(after.get("topP")))
            except ValueError:
                check(False, "bar percentage is readable", str(top))

        severe = [
            entry for entry in driver.get_log("browser")
            if entry.get("level") == "SEVERE"
            and not any(word in entry.get("message", "") for word in BENIGN)
        ]
        check(not severe, "no severe console errors", str(severe[:3]))
    finally:
        if driver:
            driver.quit()
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()

    print(f"\n{checks} checks, {failures} failure(s)")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
