#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["selenium", "webdriver-manager"]
# ///
"""Regression test: the MLP demo must really compute linear separability.

The demo writes its verdict to #ism-canvas[data-separation]. A configurable
separator preset and a custom 8/3/-0.6 ReLU network must report "ok"; a default
bowl must report "fail". The status text must name the threshold.

Run from the repository root:
    uv run blog/tests/tenminutes_mlp_separability_test.py
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


def driver() -> webdriver.Chrome:
    options = Options()
    for arg in ("--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--window-size=1280,1000"):
        options.add_argument(arg)
    options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    binary = shutil.which("chromium-browser") or shutil.which("chromium") or shutil.which("google-chrome")
    if binary:
        options.binary_location = binary
    try:
        return webdriver.Chrome(service=Service(ChromeDriverManager(chrome_type=ChromeType.CHROMIUM).install()), options=options)
    except Exception:
        return webdriver.Chrome(options=options)


def state(drv: webdriver.Chrome) -> tuple[str | None, str | None]:
    value = drv.execute_script(
        "const c=document.getElementById('ism-canvas');"
        "return c ? {sep:c.getAttribute('data-separation'),msg:c.getAttribute('data-separation-message')} : null;"
    )
    return (value.get("sep"), value.get("msg")) if value else (None, None)


def main() -> int:
    port = free_port()
    server = subprocess.Popen(
        ["php", "-S", f"127.0.0.1:{port}", "-t", str(BLOG)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    drv = None
    try:
        time.sleep(1)
        drv = driver()
        drv.get(f"http://127.0.0.1:{port}/tenminutes/intuition.php?lang=de")
        time.sleep(4)
        drv.execute_script("document.getElementById('ism-canvas').scrollIntoView({block:'center'});")
        time.sleep(2)
        for _ in range(7):
            drv.execute_script("document.getElementById('ism-next').click()")
            time.sleep(0.2)
        time.sleep(1)

        sep, msg = state(drv)
        check(sep == "fail", "the default bowl is reported as not separable", str(sep))
        check("trennbar" in (msg or "").lower(), "the status text names linear separability", str(msg))

        drv.execute_script("const p=document.getElementById('ism-dense-preset');p.value='separator';p.dispatchEvent(new Event('change'));")
        time.sleep(0.8)
        sep, msg = state(drv)
        check(sep == "ok", "the separator preset is reported as separable", str(sep))
        check("s =" in (msg or ""), "the separable status shows a threshold", str(msg))

        drv.execute_script(
            "for (const [id,v] of [['ism-dense-neurons','8'],['ism-dense-scale','3'],['ism-dense-bias','-0.6']]){"
            "const el=document.getElementById(id);el.value=v;el.dispatchEvent(new Event('input'));}"
        )
        time.sleep(0.8)
        sep, msg = state(drv)
        check(sep == "ok", "the 8/3/-0.6 ReLU network is reported as separable", str(sep))

        severe = [
            entry for entry in drv.get_log("browser")
            if entry.get("level") == "SEVERE" and "WebGL" not in entry.get("message", "")
        ]
        check(not severe, "no severe console errors", str(severe[:3]))
    finally:
        if drv:
            drv.quit()
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()

    print(f"\n{checks} checks, {failures} failure(s)")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
