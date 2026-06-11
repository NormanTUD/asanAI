# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "selenium",
#     "webdriver-manager",
# ]
# ///
"""
PHP Render Validator

Spins up a local PHP development server on a free port, opens the site in
headless Chromium/Chrome, waits up to 60 seconds for the page to finish loading,
then checks for:
  - JavaScript errors in the console → exit code 1
  - Unrendered LaTeX strings (raw LaTeX source instead of rendered equations) → exit code 2

Usage:
    uv run blog/tests/php_render_validator.py blog/
    uv run blog/tests/php_render_validator.py blog/ --timeout 90 --port 0
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
import signal
import time
import re
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.core.os_manager import ChromeType


# LaTeX patterns that indicate unrendered equations (raw source visible on page)
UNRENDERED_LATEX_PATTERNS = [
    # Common LaTeX math commands that should never appear as visible text
    r'\\frac\s*\{',
    r'\\sqrt\s*[\{\[]',
    r'\\sum\s*[_\{]',
    r'\\int\s*[_\{]',
    r'\\prod\s*[_\{]',
    r'\\lim\s*[_\{]',
    r'\\begin\s*\{(equation|align|gather|matrix|pmatrix|bmatrix)',
    r'\\end\s*\{(equation|align|gather|matrix|pmatrix|bmatrix)',
    r'\\left\s*[\(\[\{\\]',
    r'\\right\s*[\)\]\}\\]',
    r'\\mathbb\s*\{',
    r'\\mathbf\s*\{',
    r'\\mathrm\s*\{',
    r'\\text\s*\{',
    r'\\hat\s*\{',
    r'\\bar\s*\{',
    r'\\vec\s*\{',
    r'\\overline\s*\{',
    r'\\underline\s*\{',
    r'\\overbrace\s*\{',
    r'\\underbrace\s*\{',
    r'\\alpha\b',
    r'\\beta\b',
    r'\\gamma\b',
    r'\\delta\b',
    r'\\sigma\b',
    r'\\mu\b',
    r'\\pi\b',
    r'\\theta\b',
    r'\\lambda\b',
    r'\\omega\b',
    r'\\infty\b',
    r'\\partial\b',
    r'\\nabla\b',
    r'\\cdot\b',
    r'\\times\b',
    r'\\approx\b',
    r'\\neq\b',
    r'\\leq\b',
    r'\\geq\b',
    r'\\rightarrow\b',
    r'\\leftarrow\b',
    r'\\Rightarrow\b',
    r'\\Leftarrow\b',
    # Specific pattern from the issue description
    r'\\frac\{x_i\s*-\s*\\mu',
    r'\\sigma_\{\\text\{batch\}\}',
]


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
    # Give the server a moment to start
    time.sleep(2)

    if proc.poll() is not None:
        stderr = proc.stderr.read().decode() if proc.stderr else ""
        raise RuntimeError(f"PHP server failed to start: {stderr}")

    print(f"[php-server] Running on http://localhost:{port}")
    return proc


def get_chrome_driver(headless: bool = True) -> webdriver.Chrome:
    """Create a Chrome/Chromium WebDriver instance."""
    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")

    # Enable browser logging to capture JS errors
    options.set_capability("goog:loggingPrefs", {"browser": "ALL"})

    # Try to find chromium or chrome
    chrome_binary = shutil.which("chromium-browser") or shutil.which("chromium") or shutil.which("google-chrome")
    if chrome_binary:
        options.binary_location = chrome_binary

    try:
        # Try using webdriver-manager to get the right chromedriver
        service = Service(ChromeDriverManager(chrome_type=ChromeType.CHROMIUM).install())
        driver = webdriver.Chrome(service=service, options=options)
    except Exception:
        try:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
        except Exception:
            # Last resort: try system chromedriver
            driver = webdriver.Chrome(options=options)

    return driver


def wait_for_page_load(driver: webdriver.Chrome, timeout: int) -> bool:
    """
    Wait for the page to finish loading. Returns True if loaded within timeout.
    Checks document.readyState and waits for any pending network requests.
    """
    start_time = time.time()

    try:
        # Wait for document.readyState == 'complete'
        WebDriverWait(driver, timeout).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
    except Exception:
        elapsed = time.time() - start_time
        print(f"[warning] Page did not reach readyState='complete' within {elapsed:.1f}s")
        return False

    # Additional wait for MathJax/KaTeX rendering if present
    remaining = timeout - (time.time() - start_time)
    if remaining > 0:
        try:
            # Check if MathJax is present and wait for it to finish
            has_mathjax = driver.execute_script(
                "return typeof MathJax !== 'undefined'"
            )
            if has_mathjax:
                print("[info] MathJax detected, waiting for typesetting to complete...")
                WebDriverWait(driver, min(remaining, 30)).until(
                    lambda d: d.execute_script("""
                        if (typeof MathJax !== 'undefined') {
                            if (MathJax.startup && MathJax.startup.promise) {
                                return MathJax.startup.promise.then(function() { return true; });
                            }
                            if (MathJax.Hub && MathJax.Hub.queue) {
                                return MathJax.Hub.queue.running === 0 && MathJax.Hub.queue.pending === 0;
                            }
                        }
                        return true;
                    """)
                )
                # Give a bit more time for rendering to visually complete
                time.sleep(2)
        except Exception:
            pass

        # Check for KaTeX
        try:
            has_katex = driver.execute_script(
                "return typeof katex !== 'undefined' || document.querySelector('.katex') !== null"
            )
            if has_katex:
                print("[info] KaTeX detected, giving extra time for rendering...")
                time.sleep(2)
        except Exception:
            pass

    elapsed = time.time() - start_time
    print(f"[info] Page loaded in {elapsed:.1f}s")
    return True


def check_js_errors(driver: webdriver.Chrome) -> list[str]:
    """Check browser console for JavaScript errors."""
    errors = []
    try:
        logs = driver.get_log("browser")
        for entry in logs:
            if entry["level"] == "SEVERE":
                errors.append(entry["message"])
    except Exception as e:
        print(f"[warning] Could not retrieve browser logs: {e}")
    return errors


def check_unrendered_latex(driver: webdriver.Chrome) -> list[str]:
    """
    Check the visible page text for unrendered LaTeX strings.
    Returns a list of found raw LaTeX snippets.
    """
    found = []

    # Get the visible text content of the page body
    try:
        body_text = driver.execute_script("""
            // Get text content, but exclude script and style elements
            var body = document.body;
            if (!body) return '';

            var clone = body.cloneNode(true);
            var scripts = clone.querySelectorAll('script, style, noscript');
            scripts.forEach(function(el) { el.remove(); });

            // Also exclude hidden elements and MathJax/KaTeX internal elements
            var hidden = clone.querySelectorAll('[style*="display: none"], [style*="display:none"], .MathJax_Preview, .MathJax_Processing');
            hidden.forEach(function(el) { el.remove(); });

            return clone.innerText || clone.textContent || '';
        """)
    except Exception as e:
        print(f"[warning] Could not get page text: {e}")
        return found

    if not body_text:
        return found

    for pattern in UNRENDERED_LATEX_PATTERNS:
        matches = re.findall(pattern, body_text)
        if matches:
            # Get some context around the match
            for match in re.finditer(pattern, body_text):
                start = max(0, match.start() - 20)
                end = min(len(body_text), match.end() + 40)
                context = body_text[start:end].replace('\n', ' ').strip()
                found.append(f"Pattern '{pattern}' matched: ...{context}...")
                break  # One example per pattern is enough

    return found


def find_php_pages(document_root: str) -> list[str]:
    """Find all PHP files that could be entry points (index.php, etc.)."""
    root = Path(document_root)
    pages = []

    # Look for index.php first
    index = root / "index.php"
    if index.exists():
        pages.append("/index.php")

    # Find all .php files
    for php_file in root.rglob("*.php"):
        rel_path = "/" + str(php_file.relative_to(root))
        if rel_path not in pages:
            pages.append(rel_path)

    # If no PHP files found, try just "/"
    if not pages:
        pages.append("/")

    return pages


def main():
    parser = argparse.ArgumentParser(
        description="Validate PHP blog rendering: checks for JS errors and unrendered LaTeX"
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
        help="Maximum seconds to wait for page load (default: 60)",
    )
    parser.add_argument(
        "--pages",
        nargs="*",
        default=None,
        help="Specific pages to check (e.g., /index.php /about.php). Default: auto-discover.",
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        default=True,
        help="Run browser in headless mode (default: True)",
    )
    parser.add_argument(
        "--no-headless",
        action="store_true",
        default=False,
        help="Run browser with visible window (for debugging)",
    )
    parser.add_argument(
        "--fail-on-js-errors",
        action="store_true",
        default=True,
        help="Exit with code 1 if JS errors are found (default: True)",
    )
    parser.add_argument(
        "--fail-on-latex",
        action="store_true",
        default=True,
        help="Exit with code 2 if unrendered LaTeX is found (default: True)",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        default=False,
        help="Verbose output",
    )

    args = parser.parse_args()

    # Resolve document root
    document_root = os.path.abspath(args.document_root)
    if not os.path.isdir(document_root):
        print(f"[error] Document root does not exist: {document_root}")
        sys.exit(1)

    # Check PHP is available
    if not shutil.which("php"):
        print("[error] PHP CLI not found. Install with: sudo apt-get install php-cli")
        sys.exit(1)

    headless = not args.no_headless

    # Find a free port
    port = args.port if args.port != 0 else find_free_port()

    # Discover pages to check
    pages = args.pages if args.pages else find_php_pages(document_root)
    print(f"[info] Document root: {document_root}")
    print(f"[info] Pages to check: {pages}")
    print(f"[info] Timeout: {args.timeout}s")
    print(f"[info] Headless: {headless}")

    # Start PHP server
    php_proc = None
    driver = None
    exit_code = 0

    try:
        php_proc = start_php_server(document_root, port)

        # Start browser
        print("[browser] Starting Chrome/Chromium...")
        driver = get_chrome_driver(headless=headless)
        print("[browser] Ready")

        all_js_errors = []
        all_latex_issues = []

        for page in pages:
            url = f"http://localhost:{port}{page}"
            print(f"\n{'='*60}")
            print(f"[checking] {url}")
            print(f"{'='*60}")

            try:
                driver.get(url)
            except Exception as e:
                print(f"[error] Failed to load {url}: {e}")
                continue

            # Wait for page to load
            loaded = wait_for_page_load(driver, args.timeout)
            if not loaded:
                print(f"[warning] Page {page} did not fully load within {args.timeout}s")

            # Check for JS errors
            js_errors = check_js_errors(driver)
            if js_errors:
                print(f"\n[JS ERRORS] Found {len(js_errors)} JavaScript error(s) on {page}:")
                for err in js_errors:
                    print(f"  ✗ {err}")
                all_js_errors.extend([(page, err) for err in js_errors])

            # Check for unrendered LaTeX
            latex_issues = check_unrendered_latex(driver)
            if latex_issues:
                print(f"\n[LATEX ISSUES] Found {len(latex_issues)} unrendered LaTeX string(s) on {page}:")
                for issue in latex_issues:
                    print(f"  ✗ {issue}")
                all_latex_issues.extend([(page, issue) for issue in latex_issues])

            if not js_errors and not latex_issues:
                print(f"[✓] {page} - OK")

        # Summary
        print(f"\n{'='*60}")
        print("[SUMMARY]")
        print(f"{'='*60}")
        print(f"  Pages checked: {len(pages)}")
        print(f"  JS errors: {len(all_js_errors)}")
        print(f"  Unrendered LaTeX: {len(all_latex_issues)}")

        # Determine exit code
        if all_js_errors and args.fail_on_js_errors:
            print(f"\n[FAIL] JavaScript errors detected → exit code 1")
            exit_code = 1
        elif all_latex_issues and args.fail_on_latex:
            print(f"\n[FAIL] Unrendered LaTeX detected → exit code 2")
            exit_code = 2
        else:
            print(f"\n[PASS] All checks passed!")
            exit_code = 0

    except KeyboardInterrupt:
        print("\n[interrupted] Shutting down...")
        exit_code = 130
    except Exception as e:
        print(f"\n[error] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        exit_code = 1
    finally:
        # Cleanup
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

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
