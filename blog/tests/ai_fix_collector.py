# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "selenium",
#     "webdriver-manager",
# ]
# ///
"""
AI-Fix Collector

Opens every blog lesson in headless Chromium and runs the layout guardrail
(layout_guardrail.js) on each page. When an element overflows the reading
column, the guardrail shows the "Copy AI-fix" banner AND prints the same
ready-made fix prompt to the console (a single console.warn line prefixed
"[layout-guardrail] AI-fix prompt:"). This script captures that exact message
from the console and saves it, one file per offending lesson:

    blog/tests/ai_fixes/<slug>.txt

Run each saved message through an AI editor to fix the lesson, then re-run
this script — it must report every lesson clean (exit 0) when done.

Usage:
    uv run blog/tests/ai_fix_collector.py blog/
    uv run blog/tests/ai_fix_collector.py blog/ --pages /transformer /map
    uv run blog/tests/ai_fix_collector.py blog/ --port 0 --timeout 60
"""

import sys
import os
import shutil
import subprocess

# =============================================================================
# Auto-restart under `uv run` if invoked directly with python3
# =============================================================================

def _ensure_uv_run():
    if os.environ.get("_UV_RUN_ACTIVE") == "1":
        return

    uv_path = shutil.which("uv")

    if uv_path is None:
        print("=" * 60)
        print("ERROR: This script must be run with `uv run` but `uv` was")
        print("not found on your system.")
        print("=" * 60)
        print()
        print("To install uv, run one of the following:")
        print()
        print("  # On macOS/Linux:")
        print("  curl -LsSf https://astral.sh/uv/install.sh | sh")
        print()
        print("  # On Windows:")
        print('  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"')
        print()
        print("Once installed, run this script with:")
        print(f"  uv run {os.path.basename(__file__)}")
        print()
        print("=" * 60)
        sys.exit(1)

    script_path = os.path.abspath(__file__)
    extra_args = sys.argv[1:]
    cmd = [uv_path, "run", script_path] + extra_args

    print(f"[auto-restart] Detected direct invocation (python3 {os.path.basename(__file__)})")
    print(f"[auto-restart] Re-launching with: {' '.join(cmd)}")
    print()

    env = os.environ.copy()
    env["_UV_RUN_ACTIVE"] = "1"

    if sys.platform == "win32":
        result = subprocess.run(cmd, env=env)
        sys.exit(result.returncode)
    else:
        os.execvpe(uv_path, cmd, env)


_ensure_uv_run()

# =============================================================================
# Main script (runs under uv with dependencies available)
# =============================================================================

import argparse
import socket
import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.core.os_manager import ChromeType

AI_FIX_MARKER = "[layout-guardrail] AI-fix prompt:"
OUT_DIR = Path(__file__).resolve().parent / "ai_fixes"


def find_free_port() -> int:
    """Find a free TCP port on localhost."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        return s.getsockname()[1]


def start_php_server(document_root: str, port: int) -> subprocess.Popen:
    """Start a PHP built-in development server."""
    cmd = [
        "php", "-S", f"localhost:{port}",
        "-t", document_root,
    ]
    print(f"[php-server] Starting: {' '.join(cmd)}")
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    time.sleep(2)

    if proc.poll() is not None:
        stderr = proc.stderr.read().decode() if proc.stderr else ""
        raise RuntimeError(f"PHP server failed to start: {stderr}")

    print(f"[php-server] Running on http://localhost:{port}")
    return proc


def get_chrome_driver(headless: bool = True) -> webdriver.Chrome:
    """Create a Chrome/Chromium WebDriver instance with browser logging."""
    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--remote-debugging-pipe")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-background-networking")
    options.add_argument("--disable-software-rasterizer")

    # Enable browser logging to capture the guardrail's console.warn
    options.set_capability("goog:loggingPrefs", {"browser": "ALL"})

    # Lab pages run continuous animation/WebGL loops that keep the browser's
    # `load` event pending, so a normal `driver.get()` blocks until the
    # 120 s WebDriver read-timeout and the page is wrongly abandoned.
    # "none" returns as soon as navigation is accepted; the explicit
    # readyState + guardrail waits below do the real work.
    options.set_capability("pageLoadStrategy", "none")

    chrome_binary = (
        shutil.which("chromium-browser")
        or shutil.which("chromium")
        or shutil.which("google-chrome")
    )
    if chrome_binary:
        options.binary_location = chrome_binary

    try:
        service = Service(
            ChromeDriverManager(chrome_type=ChromeType.CHROMIUM).install()
        )
        driver = webdriver.Chrome(service=service, options=options)
    except Exception:
        try:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
        except Exception:
            driver = webdriver.Chrome(options=options)

    return driver


def set_viewport(driver: webdriver.Chrome, width: int, height: int = 1000) -> None:
    """Force an exact viewport width so the guardrail measures the reading
    column at that width. The column is `min(92vw, var(--mn-col-width))`, so
    it is narrow on phones and capped by the ch-unit token on wide screens —
    sweeping widths exercises both regimes.

    Driven via the real window size (set_window_size): unlike CDP's
    setDeviceMetricsOverride, the window size PERSISTS across navigation and
    fires a genuine resize event, so responsive charts (ECharts/Plotly)
    re-render at the new width — matching a real device. CDP is the fallback
    for environments where window sizing is unavailable.
    """
    try:
        driver.set_window_size(width, height)
    except Exception:
        try:
            driver.execute_cdp_cmd("Emulation.setDeviceMetricsOverride", {
                "width": width, "height": height,
                "deviceScaleFactor": 1, "mobile": False,
            })
        except Exception:
            pass
    time.sleep(0.4)
    try:
        driver.execute_script("window.dispatchEvent(new Event('resize'));")
        time.sleep(0.7)
    except Exception:
        pass


def scroll_page(driver: webdriver.Chrome) -> None:
    """Scroll to the bottom and back so IntersectionObserver-gated lazy
    charts/plots initialise before the guardrail measures. A chart that only
    renders when scrolled into view would otherwise be invisible to a check
    taken at the top of the page.
    """
    try:
        driver.execute_script(
            "window.scrollTo(0, document.body.scrollHeight);"
        )
        time.sleep(1.2)
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(0.8)
    except Exception:
        pass


def wait_for_guardrail(driver: webdriver.Chrome, timeout: int) -> dict:
    """Poll window.__layoutGuardrailCheck() until the reading column is
    measurable. Returns the guardrail state object (ready/ok/offenders).

    Each call re-runs the full check; when offenders exist it prints the
    AI-fix prompt to the console, which we read afterwards.

    A final 1.5 s settle is built in: the guardrail's MutationObserver
    schedules a debounced (~220 ms) auto-check after our synchronous call,
    so we let it fire and adopt its (possibly newer) result.
    """
    deadline = time.time() + timeout
    state = None
    while time.time() < deadline:
        try:
            state = driver.execute_script(r"""
                if (typeof window.__layoutGuardrailCheck === 'function') {
                    return window.__layoutGuardrailCheck();
                }
                return null;
            """)
        except Exception:
            # Animation-heavy pages can starve the JS thread long enough for
            # the WebDriver script call to time out. Treat it as "not ready
            # yet" and retry until the deadline rather than crashing the run.
            time.sleep(1.0)
            continue
        if state and state.get("ready"):
            break
        time.sleep(0.5)

    if state and state.get("ready"):
        time.sleep(1.5)  # let the debounced MutationObserver re-check settle
        later = driver.execute_script(r"""
            return (typeof window.__layoutGuardrail === 'object'
                && window.__layoutGuardrail) ? window.__layoutGuardrail : null;
        """)
        if later and later.get("ready"):
            state = later
    return state or {"ready": False, "ok": None, "offenders": [], "mode": "?"}


def capture_ai_fix(driver: webdriver.Chrome) -> str:
    """Pull the AI-fix prompt out of the browser console.

    The guardrail emits it as a single console.warn entry:
        [layout-guardrail] AI-fix prompt:\n<verbatim fix prompt>
    Returns the prompt text (everything after the marker) or "" if absent.
    """
    try:
        logs = driver.get_log("browser")
    except Exception:
        return ""
    best = ""
    for entry in logs:
        msg = entry.get("message", "")
        idx = msg.find(AI_FIX_MARKER)
        if idx != -1:
            # keep the latest occurrence (last check wins); the browser log
            # serialises newlines as literal "\n" — restore them
            best = msg[idx + len(AI_FIX_MARKER):].replace("\\n", "\n").lstrip("\n")
    return best


def discover_lessons(document_root: str) -> list[str]:
    """Lesson pages = .php files that carry a COURSE_METADATA block
    (same discovery rule as php_render_validator.py)."""
    pages = []
    for name in sorted(os.listdir(document_root)):
        if not name.endswith(".php"):
            continue
        path = os.path.join(document_root, name)
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                head = f.read(4096)
        except OSError:
            continue
        if "COURSE_METADATA" in head:
            pages.append("/" + name)
    return pages


def main():
    parser = argparse.ArgumentParser(
        description="Collect the layout-guardrail AI-fix prompt for every "
                    "lesson that overflows the reading column"
    )
    parser.add_argument(
        "document_root",
        help="Path to the PHP document root (e.g., blog/)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=0,
        help="Port to use for PHP server (0 = auto-find free port)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=60,
        help="Maximum seconds to wait per page for the guardrail to become ready",
    )
    parser.add_argument(
        "--pages",
        nargs="*",
        default=None,
        help="Specific pages to check (e.g., /transformer.php /atlas.php). "
             "Default: all lessons with COURSE_METADATA.",
    )
    parser.add_argument(
        "--widths",
        default="390,768,1280,1920",
        help="Comma-separated viewport widths (px) to check per page, mobile "
             "through desktop (default: 390,768,1280,1920). A page only "
             "passes if the column is clean at every width.",
    )
    parser.add_argument(
        "--no-headless",
        action="store_true",
        default=False,
        help="Run browser with visible window (for debugging)",
    )
    parser.add_argument(
        "--out-dir",
        default=str(OUT_DIR),
        help="Directory to write <slug>.txt fix files into (default: blog/tests/ai_fixes)",
    )
    args = parser.parse_args()

    document_root = os.path.abspath(args.document_root)
    if not os.path.isdir(document_root):
        print(f"[error] Document root does not exist: {document_root}")
        sys.exit(1)

    if not shutil.which("php"):
        print("[error] PHP CLI not found. Install with: sudo apt-get install php-cli")
        sys.exit(1)

    port = args.port if args.port != 0 else find_free_port()

    try:
        widths = [int(w) for w in args.widths.split(",") if w.strip()]
    except ValueError:
        print(f"[error] --widths must be comma-separated integers: {args.widths}")
        sys.exit(1)
    if not widths:
        widths = [1920]

    if args.pages:
        pages = args.pages
    else:
        pages = discover_lessons(document_root)
        if not pages:
            print("[error] no lesson pages (COURSE_METADATA .php) found")
            sys.exit(1)

    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    # NOTE: captured AI-fix messages are kept (overwritten per page on each run)
    # rather than wiped, so the directory stays a record of every prompt that
    # was collected. A file that remains after a clean re-run was fixed since.

    print(f"[info] Document root: {document_root}")
    print(f"[info] Lessons to check: {len(pages)}")
    print(f"[info] Viewport widths: {widths}px (a page passes only if clean at all)")
    print(f"[info] Fix files go to: {out_dir}")

    php_proc = None
    driver = None
    clean = []
    fixed = []
    not_ready = []

    try:
        php_proc = start_php_server(document_root, port)
        print("[browser] Starting Chrome/Chromium...")
        driver = get_chrome_driver(headless=not args.no_headless)
        print("[browser] Ready")

        for page in pages:
            slug = page.rsplit("/", 1)[-1]
            if slug.endswith(".php"):
                slug = slug[:-4]
            url = f"http://localhost:{port}{page}"
            print(f"[checking] {page}")

            page_overflows = False
            overflow_widths = []
            for w in widths:
                # Load FRESH at each width so responsive charts size to this
                # viewport from the start (what a phone/desktop does on load).
                # Note: driver.get() (navigation) RESETS the CDP device-metrics
                # override to the window size, so it must be re-asserted after
                # load, or charts would size to the wide window and
                # false-positive as overflows.
                set_viewport(driver, w)
                try:
                    driver.get(url)
                except Exception as e:
                    print(f"[error] failed to load {url} @ {w}px: {e}")
                    not_ready.append(page)
                    break

                # Only a short grace period: animation/WebGL lab pages never
                # reach readyState='complete' (their rAF loops keep the page
                # busy), so a long wait here is pure dead time. The real
                # readiness gate is wait_for_guardrail() below, which polls
                # until the reading column is actually measurable.
                try:
                    WebDriverWait(driver, 8).until(
                        lambda d: d.execute_script("return document.readyState") == "complete"
                    )
                except Exception:
                    print(f"[warning] {page} @ {w}px did not reach readyState='complete' in 8s "
                          f"(normal for animation-heavy labs) — proceeding")

                set_viewport(driver, w)  # re-assert: navigation cleared the override
                scroll_page(driver)
                state = wait_for_guardrail(driver, args.timeout)

                if not state.get("ready"):
                    print(f"[warn]   {page} @ {w}px: column not measurable in "
                          f"{args.timeout}s — skipped")
                    not_ready.append(page)
                    break

                if state.get("ok"):
                    print(f"[ok {w:>4}px] {page} — clean "
                          f"({state.get('mode')}, ≈{state.get('allowedPx', 0)}px)")
                    continue

                page_overflows = True
                overflow_widths.append(w)
                offenders = state.get("offenders") or []
                print(f"[OVERFLOW {w}px] {page} — {len(offenders)} element(s) wider "
                      f"than the {state.get('mode')} column (≈{state.get('allowedPx', 0)}px):")
                for sel in offenders[:12]:
                    print(f"    ✗ {sel}")
                if len(offenders) > 12:
                    print(f"    … and {len(offenders) - 12} more")

            if not page_overflows:
                clean.append(page)
                continue

            fix = capture_ai_fix(driver)
            where = ", ".join(f"{w}px" for w in overflow_widths)
            print(f"[overflows at] {where}")
            if not fix:
                print(f"[warn]   overflows found but no AI-fix prompt in the console "
                      f"— is layout_guardrail.js the current version?")
                fixed.append((page, None))
                continue

            out_file = out_dir / f"{slug}.txt"
            header = (f"# page: {page}\n# overflow at width(s): {where}\n\n")
            out_file.write_text(header + fix.rstrip() + "\n", encoding="utf-8")
            print(f"[saved]  {out_file}")
            fixed.append((page, out_file))

        print(f"\n{'='*60}")
        print("[SUMMARY]")
        print(f"{'='*60}")
        print(f"  Lessons checked : {len(pages)}")
        print(f"  Clean           : {len(clean)}")
        print(f"  Overflows       : {len(fixed)} (fix prompts in {out_dir})")
        print(f"  Not measurable  : {len(not_ready)}")

        if fixed:
            print(f"\n[FAIL] {len(fixed)} lesson(s) overflow the reading column → exit code 3")
            sys.exit(3)
        print("\n[PASS] Every lesson fits the reading column.")
        sys.exit(0)

    except KeyboardInterrupt:
        print("\n[interrupted] Shutting down...")
        sys.exit(130)
    except Exception as e:
        print(f"\n[error] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass
        if php_proc:
            try:
                php_proc.terminate()
                php_proc.wait(timeout=5)
            except Exception:
                php_proc.kill()


if __name__ == "__main__":
    main()
