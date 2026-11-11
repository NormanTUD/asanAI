#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["selenium", "webdriver-manager"]
# ///
"""Camera interaction during transformer training.

The feature-migration plot must keep the camera the reader rotated to while
training redraws it. This test checks both lesson copies (the full lesson and
the Ten Minutes page) and both metric views:

  * a real pointer drag changes the camera before training;
  * a camera change made during training survives later epoch redraws;
  * an active drag pauses the training loop so the browser can paint;
  * the feature plot keeps receiving new data after the drag.

Run from the repository root:
    uv run blog/tests/transformer_camera_training_test.py
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
from selenium.webdriver import ActionChains
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.core.os_manager import ChromeType

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"
BENIGN = ("WebGL", "Error creating WebGL Context", "favicon", "net::ERR_ABORTED")
PLOT_ID = "unified-layer-1-feature-arrows"
TARGET_EYE = {"x": 2.4, "y": 0.9, "z": 0.6}
PAGES = (("/transformer.php", "full lesson"), ("/tenminutes/transformer.php", "ten minutes"))

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


def get_camera(driver: webdriver.Chrome) -> dict | None:
    return driver.execute_script(
        """
        const el = document.getElementById(arguments[0]);
        const c = el && el._fullLayout && el._fullLayout.scene && el._fullLayout.scene.camera;
        return c && c.eye ? {x: c.eye.x, y: c.eye.y, z: c.eye.z} : null;
        """,
        PLOT_ID,
    )


def camera_close(camera: dict | None, target: dict, tolerance: float = 0.06) -> bool:
    if not camera:
        return False
    return all(abs(camera.get(axis, 0) - target[axis]) <= tolerance for axis in ("x", "y", "z"))


def plot_hash(driver: webdriver.Chrome) -> str:
    value = driver.execute_script(
        """
        const el = document.getElementById(arguments[0]);
        if (!el || !el.data) return null;
        return JSON.stringify(el.data);
        """,
        PLOT_ID,
    )
    return hashlib.sha256(value.encode("utf-8")).hexdigest() if value else ""


def plot_title(driver: webdriver.Chrome) -> str:
    return driver.execute_script(
        "const e=document.getElementById(arguments[0]); return e && e.layout && e.layout.title ? e.layout.title.text : '';",
        PLOT_ID,
    )


def loss_count(driver: webdriver.Chrome) -> int:
    return int(driver.execute_script("return (window.lossHistory || []).length;") or 0)


def load_plot(driver: webdriver.Chrome, base: str, path: str) -> None:
    driver.get(base + path)
    time.sleep(2)
    driver.execute_script("const el=document.getElementById('transformer-step-visuals'); if(el) el.scrollIntoView({block:'center'});")
    check(wait_until(driver, "return !!window.__tmStepDepsReady", 120), "step dependencies load")
    check(wait_until(driver, "return document.querySelectorAll('.tm-layer-card').length > 1", 60), "layer cards are generated")
    wait_until(driver, "return !!window.__tmFullVizLoaded;", 60)
    if not driver.execute_script("return !!document.getElementById('unified-layer-1-feature-arrows');"):
        driver.execute_script("if (typeof window.run_transformer_demo === 'function') window.run_transformer_demo();")
    wait_until(
        driver,
        "return !!document.getElementById('unified-layer-1-feature-arrows');",
        60,
    )
    driver.execute_script("const el=document.getElementById(arguments[0]); if(el) el.scrollIntoView({block:'center'});", PLOT_ID)
    check(
        wait_until(
            driver,
            "const el=document.getElementById('unified-layer-1-feature-arrows'); return !!(el && el.data);",
            60,
        ),
        "feature plot is rendered",
    )


def set_metric(driver: webdriver.Chrome, metric: str) -> None:
    driver.execute_script(
        "window.tmFeatureMetric=arguments[0]; window.dispatchEvent(new CustomEvent('tm:metricchange'));",
        metric,
    )
    time.sleep(1.4)


def drag_plot(driver: webdriver.Chrome) -> None:
    element = driver.find_element(By.ID, PLOT_ID)
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", element)
    time.sleep(0.4)
    ActionChains(driver).move_to_element(element).click_and_hold().pause(0.2)\
        .move_by_offset(70, 35).pause(0.2).move_by_offset(-25, 15).pause(0.2)\
        .release().perform()
    time.sleep(0.8)


def stop_training(driver: webdriver.Chrome) -> None:
    driver.execute_script("window.isTraining = false;")


def run_case(driver: webdriver.Chrome, base: str, path: str, page_label: str, metric: str) -> None:
    label = f"{page_label} · {metric}"
    load_plot(driver, base, path)
    set_metric(driver, metric)
    expected_title = "Great-circle" if metric == "angular" else "Euclidean"
    active = wait_until(
        driver,
        "const t=(document.getElementById('unified-layer-1-feature-arrows')||{}).layout; return !!(t && t.title && t.title.text && t.title.text.indexOf(arguments[0]) !== -1);".replace("arguments[0]", repr(expected_title)),
        30,
    )
    check(active, label + ": metric view is active", plot_title(driver))

    if metric == "euclidean":
        before = get_camera(driver)
        drag_plot(driver)
        after_drag = get_camera(driver)
        check(
            bool(after_drag) and not camera_close(after_drag, before or {}),
            label + ": pointer drag rotates the camera",
            str(after_drag),
        )

    driver.execute_script("document.getElementById('train-epochs').value = 400;")
    driver.execute_script("document.querySelector('.train-btn').click();")
    check(wait_until(driver, "return (window.lossHistory || []).length >= 2;", 90), label + ": training starts")

    driver.execute_script(
        "const el=document.getElementById(arguments[0]); Plotly.relayout(el, {'scene.camera.eye': arguments[1]});",
        PLOT_ID,
        TARGET_EYE,
    )
    moved = None
    end = time.time() + 10
    while time.time() < end:
        moved = get_camera(driver)
        if camera_close(moved, TARGET_EYE):
            break
        time.sleep(0.2)
    check(camera_close(moved, TARGET_EYE), label + ": camera moved during training", str(moved))

    hash_before = plot_hash(driver)
    loss_before_pause = loss_count(driver)
    driver.execute_script("window.__tmPlotDragging = true;")
    time.sleep(1.4)
    paused_gain = loss_count(driver) - loss_before_pause
    driver.execute_script("window.__tmPlotDragging = false;")
    check(paused_gain <= 1, label + ": active drag pauses the training loop", f"epochs gained: {paused_gain}")

    check(
        wait_until(driver, f"return (window.lossHistory || []).length >= {loss_before_pause + 3};", 90),
        label + ": training resumes after the drag",
    )
    check(
        wait_until(
            driver,
            "const el=document.getElementById(arguments[0]); return !!el && JSON.stringify(el.data).length > 0;",
            30,
        ),
        label + ": plot still has data",
    )
    time.sleep(0.6)
    persistent = get_camera(driver)
    check(camera_close(persistent, TARGET_EYE), label + ": camera survives later epoch redraws", str(persistent))
    check(plot_hash(driver) != hash_before, label + ": feature plot keeps updating")

    stop_training(driver)
    time.sleep(0.5)


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
        for path, page_label in PAGES:
            for metric in ("euclidean", "angular"):
                run_case(driver, base, path, page_label, metric)

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
