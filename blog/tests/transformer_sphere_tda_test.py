#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["selenium", "webdriver-manager"]
# ///
"""Whole-sphere TDA optional block on the transformer lesson.

The block pools the normalized token states of every layer, computes H0/H1
persistence, draws the coverage map and the epsilon-cluster list, and exposes
`window.__tdaSphereState()` for the assertions.

Run from the repository root:
    uv run blog/tests/transformer_sphere_tda_test.py
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
BENIGN = ("WebGL", "Error creating WebGL Context", "favicon", "net::ERR_ABORTED")

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


def wait_until(driver: webdriver.Chrome, script: str, timeout: float = 90) -> bool:
    end = time.time() + timeout
    while time.time() < end:
        try:
            if driver.execute_script(script):
                return True
        except Exception:
            pass
        time.sleep(0.25)
    return False


def sphere_state(driver: webdriver.Chrome) -> dict:
    return driver.execute_script("return window.__tdaSphereState ? window.__tdaSphereState() : null;") or {}


def load_lesson(driver: webdriver.Chrome, base: str) -> None:
    driver.get(base + "/transformer.php")
    time.sleep(2)
    driver.execute_script(
        "const el=document.getElementById('transformer-step-visuals'); if(el) el.scrollIntoView({block:'center'});"
    )
    check(wait_until(driver, "return !!window.__tmStepDepsReady", 120), "step dependencies load")
    check(wait_until(driver, "return (window.__tmLayerTrace || []).length > 1", 60),
          "layer traces are available")


def open_block(driver: webdriver.Chrome) -> None:
    driver.execute_script(
        "const block=document.getElementById('tda-sphere-optional');"
        "if (!block) return;"
        "block.scrollIntoView({block:'center'});"
        "const header=block.querySelector('.optional-header');"
        "if (header && header.getAttribute('aria-expanded') === 'false') header.click();"
    )
    time.sleep(0.4)
    check(wait_until(
        driver,
        "const block=document.getElementById('tda-sphere-optional');"
        "const content=block && block.querySelector('.optional-content');"
        "return !!content && content.style.display !== 'none';",
        10,
    ), "optional block expands")


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
        load_lesson(driver, base)
        check(wait_until(
            driver,
            "return !!(window.__tdaSphereState && window.__tdaSphereState().wired);",
            20,
        ), "sphere module wires while the block is still closed")
        driver.execute_script(
            "window.dispatchEvent(new CustomEvent('tm:training-tick',{detail:{epoch:0}}));"
        )
        time.sleep(0.3)
        check(bool(sphere_state(driver).get("dirty")),
              "training before opening marks the sphere dirty", str(sphere_state(driver)))
        open_block(driver)

        check(wait_until(driver, "return !!(window.__tdaSphereState && window.__tdaSphereState().points > 1);", 90),
              "sphere TDA computes")
        state = sphere_state(driver)
        check(not state.get("dirty"), "first open clears the off-screen dirty flag", str(state))
        check(bool(state.get("live")), "first open builds a live trace", str(state))
        check(state.get("points", 0) == state.get("tokens", 0) * (state.get("layers", 0) + 1),
              "default view pools h0 plus every layer output",
              str(state))
        check(state.get("h0", 0) > 0, "H0 barcode has bars", str(state))
        check(state.get("groups", 0) > 0, "epsilon clusters are computed", str(state))

        check(driver.execute_script(
            "const el=document.getElementById('tda-sphere-3d'); return !!(el && el.data && el.data.length > 1);"
        ), "sphere scatter is rendered")
        check(driver.execute_script(
            "const el=document.getElementById('tda-sphere-coverage'); return !!(el && el.data && el.data.length);"
        ), "coverage heatmap is rendered")
        stats = driver.execute_script(
            "return (document.getElementById('tda-sphere-coverage-stats') || {}).textContent || '';"
        )
        check("bins occupied" in stats, "coverage stats are filled", stats[:120])
        clusters = driver.execute_script(
            "return (document.getElementById('tda-sphere-clusters') || {}).textContent || '';"
        )
        check("Cluster" in clusters, "cluster list is filled", clusters[:120])
        barcode_pixels = driver.execute_script(
            """
            const c=document.getElementById('tda-sphere-barcode');
            if (!c || !c.width || !c.height) return 0;
            const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
            let n=0; for (let i=3;i<data.length;i+=4) if (data[i]) n++;
            return n;
            """
        )
        check(barcode_pixels > 1000, "barcode canvas is drawn", str(barcode_pixels))

        computes_before = sphere_state(driver).get("computes", 0)
        driver.execute_script(
            "window.dispatchEvent(new CustomEvent('tm:training-tick',{detail:{epoch:1}}));"
        )
        check(wait_until(
            driver,
            "const s=window.__tdaSphereState && window.__tdaSphereState();"
            f"return !!s && s.computes > {computes_before};",
            20,
        ), "training tick recomputes the sphere while it is in view")
        live = sphere_state(driver)
        check(bool(live.get("live")), "training tick builds a live layer trace", str(live))

        driver.execute_script("window.scrollTo({top: 0});")
        time.sleep(0.5)
        driver.execute_script(
            "window.dispatchEvent(new CustomEvent('tm:training-tick',{detail:{epoch:2}}));"
        )
        time.sleep(0.3)
        offscreen = sphere_state(driver)
        check(bool(offscreen.get("dirty")), "off-screen training marks the sphere dirty", str(offscreen))
        stale_computes = offscreen.get("computes", 0)
        driver.execute_script(
            "document.getElementById('tda-sphere-optional').scrollIntoView({block:'center'});"
        )
        check(wait_until(
            driver,
            "const s=window.__tdaSphereState && window.__tdaSphereState();"
            f"return !!s && !s.dirty && s.computes > {stale_computes};",
            25,
        ), "returning to view recomputes after off-screen training")

        driver.execute_script(
            "const s=document.getElementById('tda-sphere-states'); s.value='sublayers';"
            "s.dispatchEvent(new Event('change',{bubbles:true}));"
        )
        ok = wait_until(
            driver,
            "const s=window.__tdaSphereState && window.__tdaSphereState();"
            "return !!s && s.points === s.tokens * (1 + 2 * s.layers);",
            90,
        )
        sub = sphere_state(driver)
        check(ok, "sublayer view adds attention and FFN states", str(sub))

        driver.execute_script(
            "const s=document.getElementById('tda-sphere-color'); s.value='cluster';"
            "s.dispatchEvent(new Event('change',{bubbles:true}));"
        )
        time.sleep(0.5)
        check(driver.execute_script(
            "const el=document.getElementById('tda-sphere-3d'); return !!(el && el.data && el.data.length > 1);"
        ), "cluster coloring keeps the sphere rendered")

        driver.execute_script(
            "const e=document.getElementById('tda-sphere-eps'); e.value='70';"
            "e.dispatchEvent(new Event('input',{bubbles:true}));"
        )
        time.sleep(0.4)
        check(driver.execute_script(
            "const e=document.getElementById('tda-sphere-eps-val'); return !!e && e.textContent.indexOf('0.70') !== -1;"
        ), "epsilon slider updates the label")

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
