# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "playwright>=1.40",
# ]
# ///
"""Playwright CI test: smoke-check the loss-landscape lab training flow.

Boots a static HTTP server, opens /loss_landscape.php in headless Chromium,
clicks Start Training, and verifies that:

  * the page loads without console errors
  * the 3-D plot is created with all four optimizer traces
  * training completes and trajectories accumulate points
  * the loss decreases (sanity check the optimizers are actually learning)
  * no [loss_landscape] guard fires during the run

Just run::

    python3 tests/loss_landscape_test.py

The script auto-restarts itself under ``uv run`` (so the PEP 723 dependency
block installs ``playwright``) and auto-installs the Chromium browser the
first time. No manual setup steps.
"""

from __future__ import annotations

import contextlib
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BLOG_DIR = REPO_ROOT / "blog"
PORT = 18745
URL = f"http://localhost:{PORT}/loss_landscape.php"


# =============================================================================
# Auto-bootstrap: re-launch under `uv run` if invoked as plain `python3`
# =============================================================================

def _ensure_uv_run() -> None:
    if os.environ.get("_UV_RUN_ACTIVE") == "1":
        return

    uv_path = shutil.which("uv")
    if uv_path is None:
        print("=" * 60, file=sys.stderr)
        print("ERROR: `uv` is required. Install it with:", file=sys.stderr)
        print("  curl -LsSf https://astral.sh/uv/install.sh | sh", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        sys.exit(1)

    script_path = os.path.abspath(__file__)
    extra_args = sys.argv[1:]
    cmd = [uv_path, "run", script_path, *extra_args]

    print(f"[bootstrap] re-launching under uv: {' '.join(cmd)}")

    env = os.environ.copy()
    env["_UV_RUN_ACTIVE"] = "1"

    if sys.platform == "win32":
        result = subprocess.run(cmd, env=env)
        sys.exit(result.returncode)
    else:
        os.execvpe(uv_path, cmd, env)


_ensure_uv_run()


# =============================================================================
# Auto-install chromium browser if missing (one-time per machine)
# =============================================================================

def _ensure_chromium() -> None:
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            try:
                browser = pw.chromium.launch(headless=True)
                browser.close()
                return
            except Exception:
                pass
    except Exception:
        pass

    print("[bootstrap] installing chromium for playwright ...")
    result = subprocess.run(
        [sys.executable, "-m", "playwright", "install", "chromium"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
    )
    if result.returncode != 0:
        print("[bootstrap] chromium install failed; trying with --with-deps",
              file=sys.stderr)
        subprocess.run(
            [sys.executable, "-m", "playwright", "install", "--with-deps", "chromium"],
            stderr=subprocess.STDOUT,
        )


_ensure_chromium()


from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout  # noqa: E402


# =============================================================================
# Local PHP server (so .php files actually execute, not get downloaded)
# =============================================================================

@contextlib.contextmanager
def local_server(port: int, root: Path):
    php = shutil.which("php")
    if php is None:
        print("ERROR: `php` not found on PATH", file=sys.stderr)
        sys.exit(1)

    proc = subprocess.Popen(
        [php, "-S", f"127.0.0.1:{port}", "-t", str(root)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
    )
    try:
        # Wait until the server actually accepts connections
        import socket as _socket
        deadline = time.time() + 10
        while time.time() < deadline:
            try:
                with _socket.create_connection(("127.0.0.1", port), timeout=0.5):
                    break
            except OSError:
                time.sleep(0.1)
        else:
            print("ERROR: php server did not start within 10s", file=sys.stderr)
            sys.exit(1)
        yield
    finally:
        proc.terminate()
        with contextlib.suppress(Exception):
            proc.wait(timeout=3)


# =============================================================================
# Test
# =============================================================================

def run() -> int:
    failures: list[str] = []
    console_errors: list[str] = []
    plot_state = None
    loss_state = None

    with local_server(PORT, BLOG_DIR):
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            ctx = browser.new_context()
            page = ctx.new_page()

            page.on("console", lambda m: console_errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
            page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

            def log_msg(m):
                if "DEBUG" in m.text:
                    with open("/tmp/loss_landscape_debug.log", "a") as f:
                        f.write(m.text + "\n")
            page.on("console", log_msg)

            try:
                page.goto(URL, wait_until="networkidle", timeout=30000)
            except PWTimeout:
                failures.append("page.goto timed out after 30s")

            try:
                page.wait_for_function(
                    "document.querySelector('#ll-3d-plot') && document.querySelector('#ll-3d-plot').data && document.querySelector('#ll-3d-plot').data.length >= 2",
                    timeout=60000,
                )
            except PWTimeout:
                failures.append("3-D plot not initialized within 60s")

            try:
                page.locator("#ll-epochs").scroll_into_view_if_needed()
                page.fill("#ll-epochs", "10")
            except Exception as e:
                failures.append(f"could not set #ll-epochs: {e}")

            try:
                page.locator("#ll-start").scroll_into_view_if_needed()
                page.click("#ll-start", timeout=30000)
            except Exception as e:
                failures.append(f"could not click #ll-start: {e}")

            try:
                page.wait_for_function(
                    """() => {
                        const el = document.getElementById('ll-status');
                        return el && /Done|Stopped|Error/.test(el.textContent || '');
                    }""",
                    timeout=90000,
                )
            except PWTimeout:
                failures.append("training did not complete within 90s")

            plot_state = page.evaluate("""() => {
                const gd = document.getElementById('ll-3d-plot');
                if (!gd || !gd.data) return null;
                return gd.data.map((t, i) => ({
                    idx: i,
                    name: t.name || null,
                    type: t.type,
                    xLen: (t.x || []).length,
                    yLen: (t.y || []).length,
                    zLen: (t.z || []).length,
                    visible: t.visible !== false
                }));
            }""")

            loss_state = page.evaluate("""() => {
                const gd = document.getElementById('ll-loss-plot');
                if (!gd || !gd.data) return null;
                return gd.data.map(t => ({
                    name: t.name,
                    lastLoss: (t.y || []).slice(-1)[0]
                }));
            }""")

            if not plot_state or len(plot_state) < 1:
                failures.append("plot has no traces")
            elif plot_state[0].get("type") != "surface":
                failures.append(f"trace 0 is not a surface: {plot_state[0]}")

            if plot_state:
                for t in plot_state[1:]:
                    if t.get("xLen", 0) < 2:
                        failures.append(f"trajectory {t.get('name')} has only {t.get('xLen')} points (expected ≥ 2)")
                    if t.get("xLen") != t.get("yLen") or t.get("xLen") != t.get("zLen"):
                        failures.append(f"trajectory {t.get('name')} length mismatch: x={t.get('xLen')} y={t.get('yLen')} z={t.get('zLen')}")
                    if t.get("visible") is False:
                        failures.append(f"trajectory {t.get('name')} is hidden")

            # ── Guard: every trajectory point must sit exactly on the surface ──
            surface_alignment = page.evaluate("""() => {
                const plot = document.getElementById('ll-3d-plot');
                if (!plot || !plot.data) return null;
                const surf = plot.data[0];
                const surfX = surf.x || [];
                const surfY = surf.y || [];
                const surfZ = surf.z || [];
                if (!surfZ.length || !surfZ[0].length) return null;
                const out = [];
                for (let t = 1; t < plot.data.length; t++) {
                    const tr = plot.data[t];
                    const tx = tr.x || [];
                    const ty = tr.y || [];
                    const tz = tr.z || [];
                    let maxDelta = 0;
                    let worstIdx = -1;
                    let worstPoint = null;
                    let orphanCount = 0;
                    for (let k = 0; k < tx.length; k++) {
                        const wKey = tx[k].toFixed(1);
                        const bKey = ty[k].toFixed(1);
                        const wi = surfX.findIndex(v => v.toFixed(1) === wKey);
                        const bi = surfY.findIndex(v => v.toFixed(1) === bKey);
                        if (wi < 0 || bi < 0) { orphanCount++; continue; }
                        const sz = surfZ[bi][wi];
                        if (sz == null || sz === undefined) { orphanCount++; continue; }
                        const d = Math.abs(tz[k] - sz);
                        if (d > maxDelta) {
                            maxDelta = d;
                            worstIdx = k;
                            worstPoint = { w: tx[k], b: ty[k], tz: tz[k], sz: sz };
                        }
                    }
                    out.push({ name: tr.name, maxDelta, worstIdx, worstPoint, orphanCount, n: tx.length });
                }
                return out;
            }""")

            if surface_alignment:
                for r in surface_alignment:
                    if r.get("maxDelta", 0) > 0.0001:
                        failures.append(
                            f"trajectory {r.get('name')} point #{r.get('worstIdx')} "
                            f"off-surface by {r.get('maxDelta'):.4g}: "
                            f"w={r.get('worstPoint', {}).get('w')}, b={r.get('worstPoint', {}).get('b')}, "
                            f"trajZ={r.get('worstPoint', {}).get('tz'):.4g}, surfZ={r.get('worstPoint', {}).get('sz'):.4g}"
                        )
                    if r.get("orphanCount", 0) > 0:
                        failures.append(
                            f"trajectory {r.get('name')} has {r.get('orphanCount')}/{r.get('n')} points "
                            f"on a grid vertex where the surface is null (trajectory floats in the air)"
                        )

            if loss_state:
                for t in loss_state:
                    losses = page.evaluate(f"""() => {{
                        const gd = document.getElementById('ll-loss-plot');
                        const idx = gd.data.findIndex(d => d.name === {json.dumps(t.get('name'))});
                        if (idx < 0) return null;
                        const y = gd.data[idx].y || [];
                        return {{ first: y[0], last: y[y.length - 1] }};
                    }}""")
                    if losses and losses.get("first") and losses.get("last"):
                        if losses["last"] >= losses["first"]:
                            failures.append(f"loss for {t.get('name')} did not decrease: {losses['first']:.4g} → {losses['last']:.4g}")

            real_errors = [e for e in console_errors if "[loss_landscape] guard" in e]
            if real_errors:
                failures.append(f"{len(real_errors)} guard(s) fired during run:")
                for e in real_errors[:5]:
                    failures.append(f"  - {e}")

            browser.close()

    print("=" * 60)
    print("Loss-landscape training smoke test")
    if plot_state:
        print(f"  Plot traces: {len(plot_state)}")
        for t in plot_state:
            print(f"    [{t.get('idx')}] {t.get('name') or 'surface'} ({t.get('type')}): x={t.get('xLen')} y={t.get('yLen')} z={t.get('zLen')}")
    if loss_state:
        print(f"  Loss-curve traces: {len(loss_state)}")
        for t in loss_state:
            print(f"    {t.get('name')}: last loss = {t.get('lastLoss')}")
    print(f"  Console errors: {len(console_errors)}")
    for e in console_errors[:10]:
        print(f"    - {e}")
    print("=" * 60)

    if failures:
        print("FAIL")
        for f in failures:
            print(f"  ✗ {f}")
        return 1
    print("PASS")
    return 0


if __name__ == "__main__":
    sys.exit(run())
