#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["selenium", "webdriver-manager"]
# ///
"""Real browser regression test: the transformer plots must change during training.

The test opens the lesson, makes one plot visible, trains for 20 epochs, and
hashes the plot's real data at epochs 10, 11 and 20. A plot that never updates
produces the same hash and fails; successive sampled epochs 10/12 check the refresh.

Covered plots:
  * embedding space (Plotly data)
  * positional shift (Plotly data)
  * feature migration layer 2 (ECharts option data)

Run from the repository root:
    uv run blog/tests/transformer_training_live_test.py
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
        "--window-size=1280,1000",
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
        time.sleep(0.25)
    return False


def wait_ready(driver: webdriver.Chrome, base: str) -> None:
    driver.get(base + "/transformer.php")
    time.sleep(2)
    scroll_to(driver, "transformer-step-visuals")
    check(wait_until(driver, "return !!window.__tmStepDepsReady", 90),
          "transformer step dependencies load")


def scroll_to(driver: webdriver.Chrome, element_id: str) -> None:
    driver.execute_script(
        "const el=document.getElementById(arguments[0]); if(el) el.scrollIntoView({block:'center'});",
        element_id,
    )
    time.sleep(1.2)


def open_step_visuals(driver: webdriver.Chrome) -> None:
    scroll_to(driver, "transformer-step-visuals")
    check(wait_until(driver, "return document.querySelectorAll('.tm-layer-card').length > 1", 30),
          "layer cards are generated")


def hash_json(value) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode("utf-8")).hexdigest()


def capture_plot(driver: webdriver.Chrome, script: str) -> str:
    value = driver.execute_script(script)
    return hash_json(value) if value else ""


def run_capture(driver: webdriver.Chrome, setup_script: str, capture_script: str, label: str, consecutive: bool = True) -> None:
    driver.execute_script(setup_script)
    wait_until(driver, "return true;", 0.1)
    end = time.time() + 30
    while time.time() < end:
        if capture_plot(driver, capture_script):
            break
        time.sleep(0.4)
    initial = capture_plot(driver, capture_script)
    check(bool(initial), label + " plot has data before training")

    driver.execute_script("document.getElementById('train-epochs').value = 20;")
    driver.execute_script("document.querySelector('.train-btn').click();")

    hashes = {}
    for epoch in (10, 12, 20):
        if not wait_until(driver, f"return (window.lossHistory||[]).length >= {epoch};", 180):
            check(False, label + f" reaches epoch {epoch}")
            return
        time.sleep(0.4)
        hashes[epoch] = capture_plot(driver, capture_script)
        check(bool(hashes[epoch]), label + f" plot has data at epoch {epoch}")

    if consecutive:
        check(hashes[10] != hashes[12],
              label + " plot changes between sampled epochs (10 -> 12)",
              hashes[10][:12] + " / " + hashes[12][:12])
    check(hashes[10] != hashes[20],
          label + " plot changes between epochs 10 and 20",
          hashes[10][:12] + " / " + hashes[20][:12])


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

        wait_ready(driver, base)
        scroll_to(driver, "transformer-plotly-space")
        run_capture(
            driver,
            "window.ensureFullTransformerVisualization && window.ensureFullTransformerVisualization(true);",
            """
            const p = document.getElementById('transformer-plotly-space');
            if (!p || !p.data) return null;
            return p.data.map(t => ({name: t.name, x: (t.x||[]).slice(0,6), y: (t.y||[]).slice(0,6), z: (t.z||[]).slice(0,6)}));
            """,
            "embedding",
        )

        wait_ready(driver, base)
        open_step_visuals(driver)
        driver.execute_script("const d=document.getElementById('tm-detail-position'); if(d) d.open=true;")
        scroll_to(driver, "transformer-pe-shift-plot")
        wait_until(driver, "const p=document.getElementById('transformer-pe-shift-plot'); return !!(p && p.data);", 30)
        run_capture(
            driver,
            "1;",
            """
            const p = document.getElementById('transformer-pe-shift-plot');
            if (!p || !p.data) return null;
            return p.data.map(t => ({name: t.name, x: (t.x||[]).slice(0,6), y: (t.y||[]).slice(0,6), z: (t.z||[]).slice(0,6)}));
            """,
            "positional shift",
        )

        wait_ready(driver, base)
        open_step_visuals(driver)
        driver.execute_script("""
        const card = document.querySelector('.tm-layer-card[data-layer-idx="1"]');
        if (card) {
          const head = card.querySelector('.tm-layer-head');
          if (head && head.getAttribute('aria-expanded') === 'false') head.click();
          const mig = card.querySelector('.tm-layer-subbox[data-sub="migration"]');
          if (mig) mig.open = true;
        }
        """)
        scroll_to(driver, "migration-layer-2")
        wait_until(
            driver,
            "const p=document.getElementById('migration-layer-2'); return !!(p && window.echarts && echarts.getInstanceByDom(p));",
            30,
        )
        run_capture(
            driver,
            "1;",
            """
            const p = document.getElementById('migration-layer-2');
            const c = p && window.echarts ? echarts.getInstanceByDom(p) : null;
            if (!c) return null;
            const o = c.getOption();
            return (o.series||[]).map(s => ({type:s.type, name:s.name, data:(s.data||[]).slice(0,8)}));
            """,
            "feature migration",
            consecutive=False,
        )

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
