#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["selenium", "webdriver-manager"]
# ///
"""Plot views must survive training redraws on the transformer lesson.

The old redraw path purged and rebuilt the Plotly scenes on every epoch and
rebuilt the ECharts 3D scenes with `setOption(..., true)`. A reader who
rotated a plot during training lost that view on the next epoch. This test
covers the three view families:

  * a Plotly 3D camera set during training survives later epochs;
  * a Plotly 2D axis zoom set during training survives later epochs;
  * an ECharts grid3D viewControl set during training survives later epochs;
  * a pointer drag on an ECharts plot pauses training like a Plotly drag.

Run from the repository root:
    uv run blog/tests/transformer_plot_view_state_test.py
"""

from __future__ import annotations

import hashlib
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
EMBEDDING_ID = "transformer-plotly-space"
WAVE_ID = "transformer-pe-wave-plot"
MIGRATION_ID = "migration-layer-1"
CAMERA_EYE = {"x": 2.4, "y": 0.9, "z": 0.6}
ECHARTS_VIEW = {"alpha": 63, "beta": 18, "distance": 140}

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


def scroll_to(driver: webdriver.Chrome, element_id: str) -> None:
    driver.execute_script(
        "const el=document.getElementById(arguments[0]); if(el) el.scrollIntoView({block:'center'});",
        element_id,
    )
    time.sleep(0.8)


def load_page(driver: webdriver.Chrome, base: str) -> None:
    driver.get(base + "/transformer.php")
    time.sleep(2)
    scroll_to(driver, "transformer-step-visuals")
    check(wait_until(driver, "return !!window.__tmStepDepsReady", 120), "step dependencies load")
    check(wait_until(driver, "return document.querySelectorAll('.tm-layer-card').length > 1", 60),
          "layer cards are generated")
    wait_until(driver, "return !!window.__tmFullVizLoaded;", 60)
    driver.execute_script("if (typeof window.run_transformer_demo === 'function') window.run_transformer_demo();")
    time.sleep(0.6)


def start_training(driver: webdriver.Chrome, epochs: int = 4000) -> bool:
    driver.execute_script("document.getElementById('train-epochs').value = arguments[0];", epochs)
    driver.execute_script("document.querySelector('.train-btn').click();")
    return wait_until(driver, "return (window.lossHistory || []).length >= 2;", 120)


def stop_training(driver: webdriver.Chrome) -> None:
    driver.execute_script("window.isTraining = false;")


def loss_count(driver: webdriver.Chrome) -> int:
    return int(driver.execute_script("return (window.lossHistory || []).length;") or 0)


def get_plotly_camera(driver: webdriver.Chrome, plot_id: str) -> dict | None:
    return driver.execute_script(
        """
        const el = document.getElementById(arguments[0]);
        const scene = el && el._fullLayout && el._fullLayout.scene;
        if (!scene || !scene.camera || !scene.camera.eye) return null;
        return {x: scene.camera.eye.x, y: scene.camera.eye.y, z: scene.camera.eye.z};
        """,
        plot_id,
    )


def camera_close(camera: dict | None, target: dict, tolerance: float = 0.08) -> bool:
    if not camera:
        return False
    return all(abs(camera.get(axis, 0) - target[axis]) <= tolerance for axis in ("x", "y", "z"))


def get_echarts_view(driver: webdriver.Chrome, plot_id: str) -> dict | None:
    return driver.execute_script(
        """
        const el = document.getElementById(arguments[0]);
        const chart = el && window.echarts && echarts.getInstanceByDom(el);
        if (!chart || !chart.getOption) return null;
        const options = chart.getOption();
        const grids = options && options.grid3D;
        const grid = grids && (Array.isArray(grids) ? grids[0] : grids);
        const view = grid && grid.viewControl;
        return view ? {alpha: view.alpha, beta: view.beta, distance: view.distance} : null;
        """,
        plot_id,
    )


def view_close(view: dict | None, target: dict, tolerance: float = 1.5) -> bool:
    if not view:
        return False
    return all(abs(float(view.get(key, 0)) - target[key]) <= tolerance for key in target)


def echarts_signature(driver: webdriver.Chrome, plot_id: str) -> str:
    return driver.execute_script(
        """
        const el = document.getElementById(arguments[0]);
        const chart = el && window.echarts && echarts.getInstanceByDom(el);
        if (!chart || !chart.getOption) return "";
        const options = chart.getOption();
        const sample = (options.series || []).slice(0, 6).map(function (s) {
            return s && s.data ? s.data.slice(0, 6) : null;
        });
        return JSON.stringify(sample);
        """,
        plot_id,
    ) or ""


def open_migration_plot(driver: webdriver.Chrome) -> bool:
    driver.execute_script(
        """
        const card = document.querySelector('.tm-layer-card[data-layer-idx="0"]');
        if (!card) return false;
        const head = card.querySelector('.tm-layer-head');
        if (head && head.getAttribute('aria-expanded') === 'false') head.click();
        const mig = card.querySelector('.tm-layer-subbox[data-sub="migration"]');
        if (mig) mig.open = true;
        return !!mig;
        """
    )
    scroll_to(driver, MIGRATION_ID)
    return wait_until(
        driver,
        "const el=document.getElementById('%s'); return !!(el && window.echarts && echarts.getInstanceByDom(el));"
        % MIGRATION_ID,
        60,
    )


def run_start_label_case(driver: webdriver.Chrome, base: str) -> None:
    load_page(driver, base)
    driver.execute_script(
        "if (window.ensureFullTransformerVisualization) window.ensureFullTransformerVisualization(true);"
        "if (window.run_transformer_demo) window.run_transformer_demo();"
    )
    time.sleep(0.5)
    scroll_to(driver, "transformer-pe-shift-plot")
    check(wait_until(driver,
                     "const el=document.getElementById('transformer-pe-shift-plot'); return !!(el && el.data && el.data.length);",
                     60),
          "positional shift plot has data")
    labels = driver.execute_script(
        """
        const el = document.getElementById('transformer-pe-shift-plot');
        const out = [];
        ((el && el.data) || []).forEach(function (trace) {
            if (trace && trace.mode && trace.mode.indexOf('text') !== -1 && Array.isArray(trace.text)) {
                trace.text.forEach(function (value) { if (value) out.push(value); });
            }
        });
        return out;
        """
    )
    check(bool(labels), "positional-shift start nodes carry visible token labels", str(labels[:5]))

    scroll_to(driver, "transformer-trajectory-full-path-wrapper")
    check(wait_until(driver,
                     "const el=document.getElementById('transformer-trajectory-full-path'); return !!(el && el.data && el.data.length);",
                     60),
          "trajectory plot has data")
    trajectory_labels = driver.execute_script(
        """
        const el = document.getElementById('transformer-trajectory-full-path');
        const out = [];
        ((el && el.data) || []).forEach(function (trace) {
            if (trace && trace.mode === 'text' && Array.isArray(trace.text)) {
                trace.text.forEach(function (value) { if (value) out.push(value); });
            }
        });
        return out;
        """
    )
    check(bool(trajectory_labels), "trajectory start nodes carry visible token labels",
          str(trajectory_labels[:5]))


def run_plotly_3d_case(driver: webdriver.Chrome, base: str) -> None:
    load_page(driver, base)
    scroll_to(driver, EMBEDDING_ID)
    check(wait_until(driver, "const el=document.getElementById('%s'); return !!(el && el.data);" % EMBEDDING_ID, 60),
          "embedding plot has data")
    check(start_training(driver), "training starts for the 3D camera case")
    driver.execute_script(
        "const el=document.getElementById(arguments[0]);"
        "if (el) Plotly.relayout(el, {'scene.camera.eye': arguments[1]});",
        EMBEDDING_ID,
        CAMERA_EYE,
    )
    time.sleep(0.4)
    before = get_plotly_camera(driver, EMBEDDING_ID)
    check(camera_close(before, CAMERA_EYE), "embedding camera set during training", str(before))
    epochs_before = loss_count(driver)
    check(wait_until(driver, "return (window.lossHistory || []).length >= %d;" % (epochs_before + 3), 60),
          "training reaches later epochs after the camera move")
    after = get_plotly_camera(driver, EMBEDDING_ID)
    check(camera_close(after, CAMERA_EYE), "embedding camera survives later epochs", str(after))
    stop_training(driver)


def run_plotly_2d_case(driver: webdriver.Chrome, base: str) -> None:
    load_page(driver, base)
    scroll_to(driver, WAVE_ID)
    check(wait_until(driver, "const el=document.getElementById('%s'); return !!(el && el.data && el._fullLayout && el._fullLayout.xaxis);" % WAVE_ID, 60),
          "positional wave plot has data")
    driver.execute_script(
        """
        window.__waveReacts = 0;
        if (window.Plotly && !window.__waveReactHooked) {
            window.__waveReactHooked = true;
            const original = Plotly.react;
            Plotly.react = function (target) {
                const id = typeof target === 'string' ? target : (target && target.id);
                if (id === 'transformer-pe-wave-plot') window.__waveReacts += 1;
                return original.apply(this, arguments);
            };
        }
        """
    )
    check(start_training(driver), "training starts for the 2D axis case")
    driver.execute_script(
        "const el=document.getElementById(arguments[0]);"
        "if (el) Plotly.relayout(el, {'xaxis.range[0]': 0.5, 'xaxis.range[1]': 3.5,"
        "'yaxis.range[0]': -0.75, 'yaxis.range[1]': 0.75});",
        WAVE_ID,
    )
    time.sleep(0.4)
    epochs_before = loss_count(driver)
    check(wait_until(driver, "return (window.lossHistory || []).length >= %d;" % (epochs_before + 3), 60),
          "training reaches later epochs after the 2D zoom")
    ranges = driver.execute_script(
        "const el=document.getElementById(arguments[0]);"
        "if (!el || !el._fullLayout || !el._fullLayout.xaxis) return null;"
        "return {x: el._fullLayout.xaxis.range.slice(), y: el._fullLayout.yaxis.range.slice()};",
        WAVE_ID,
    )
    ok = bool(ranges) and abs(ranges["x"][0] - 0.5) < 0.05 and abs(ranges["x"][1] - 3.5) < 0.05
    check(ok, "2D axis zoom survives later epochs", str(ranges))
    reacts = int(driver.execute_script("return window.__waveReacts || 0;") or 0)
    check(reacts >= 2, "wave plot was redrawn during training", f"{reacts} redraw(s)")
    stop_training(driver)


def run_echarts_case(driver: webdriver.Chrome, base: str) -> None:
    load_page(driver, base)
    check(open_migration_plot(driver), "ECharts migration plot is ready")
    check(start_training(driver), "training starts for the ECharts case")
    driver.execute_script(
        "const el=document.getElementById(arguments[0]);"
        "const chart=window.echarts && echarts.getInstanceByDom(el);"
        "if (chart) chart.setOption({grid3D:{viewControl:arguments[1]}});",
        MIGRATION_ID,
        ECHARTS_VIEW,
    )
    time.sleep(0.5)
    before = get_echarts_view(driver, MIGRATION_ID)
    check(view_close(before, ECHARTS_VIEW), "ECharts camera set during training", str(before))
    signature_before = hashlib.sha256(echarts_signature(driver, MIGRATION_ID).encode("utf-8")).hexdigest()

    epochs_before = loss_count(driver)
    driver.execute_script(
        "const el=document.getElementById(arguments[0]);"
        "if (el) el.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, cancelable:true,"
        "button:0, buttons:1, pointerId:7, pointerType:'mouse', isPrimary:true}));",
        MIGRATION_ID,
    )
    time.sleep(0.1)
    check(bool(driver.execute_script("return !!window.__tmPlotDragging;")),
          "ECharts pointer-down registers as a plot drag")
    time.sleep(1.5)
    paused_gain = loss_count(driver) - epochs_before
    check(paused_gain <= 2, "ECharts drag pauses the training loop", f"epochs gained: {paused_gain}")
    driver.execute_script(
        "window.dispatchEvent(new PointerEvent('pointerup', {bubbles:true, cancelable:true,"
        "button:0, buttons:0, pointerId:7, pointerType:'mouse', isPrimary:true}));"
    )
    check(wait_until(driver, "return (window.lossHistory || []).length >= %d;" % (epochs_before + 3), 60),
          "training resumes after the ECharts drag")
    after = get_echarts_view(driver, MIGRATION_ID)
    check(view_close(after, ECHARTS_VIEW), "ECharts camera survives later epochs", str(after))
    signature_after = hashlib.sha256(echarts_signature(driver, MIGRATION_ID).encode("utf-8")).hexdigest()
    check(signature_before != signature_after, "ECharts migration data changed during training",
          signature_before[:12] + " / " + signature_after[:12])
    stop_training(driver)


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
        run_start_label_case(driver, base)
        run_plotly_3d_case(driver, base)
        run_plotly_2d_case(driver, base)
        run_echarts_case(driver, base)

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
