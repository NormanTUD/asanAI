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
import time
import re
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.core.os_manager import ChromeType


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
        service = Service(ChromeDriverManager(chrome_type=ChromeType.CHROMIUM).install())
        driver = webdriver.Chrome(service=service, options=options)
    except Exception:
        try:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
        except Exception:
            driver = webdriver.Chrome(options=options)

    return driver


def wait_for_page_load(driver: webdriver.Chrome, timeout: int) -> bool:
    """
    Wait for the page to finish loading. Returns True if loaded within timeout.
    """
    start_time = time.time()

    try:
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
                time.sleep(2)
        except Exception:
            pass

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
    Check for unrendered LaTeX by inspecting the DOM structure.

    The key insight: when LaTeX rendering partially fails, you get patterns like:
      <math>...</math><em>i = \frac{x_i - \mu</em>{\text{batch}}}...

    This means a <math> element is followed by sibling text/elements that contain
    raw LaTeX commands. We detect this by:

    1. Finding all text nodes and inline elements that are NOT inside <math>,
       <script>, <style>, <code>, <pre>, <annotation>, or .katex-mathml elements
       and checking if they contain LaTeX command sequences.

    2. Specifically looking for the "partial render" pattern: a <math> or .katex
       element whose next sibling(s) contain LaTeX backslash commands.

    3. Looking for <em> or <strong> tags that contain LaTeX (this happens when
       markdown italics/bold eat part of the formula, e.g. _i = \frac{...}_).

    Returns a list of found issues with context.
    """
    found = []

    # JavaScript that inspects the DOM intelligently
    issues = driver.execute_script(r"""
    var issues = [];

    // === Strategy 1: Find text nodes outside math contexts that contain LaTeX ===
    // These are elements that should NEVER contain raw LaTeX backslash commands
    // in their visible text (excluding code blocks, math internals, etc.)

    var LATEX_COMMAND_RE = /\\(?:frac|sqrt|sum|int|prod|lim|begin|end|left|right|mathbb|mathbf|mathrm|mathcal|text|hat|bar|vec|overline|underline|overbrace|underbrace|alpha|beta|gamma|delta|sigma|mu|pi|theta|lambda|omega|infty|partial|nabla|cdot|times|approx|neq|leq|geq|rightarrow|leftarrow|Rightarrow|Leftarrow|displaystyle|textstyle|binom|tbinom|dbinom|pmatrix|bmatrix|vmatrix|cases)\s*[\{_\[\(\\]/;

    // More aggressive: any backslash followed by a latin word of 3+ chars then { or _
    var LATEX_GENERIC_RE = /\\[a-zA-Z]{3,}\s*[\{_]/;

    // The "leaked formula" pattern: stuff like }{\sigma_{\text{batch}}}
    // which is clearly a LaTeX fragment that escaped the math environment
    var LATEX_FRAGMENT_RE = /[\}_]\s*\{\\[a-zA-Z]/;

    // Selector for elements that should NOT contain LaTeX in their text
    var EXCLUDE_SELECTOR = 'math, script, style, code, pre, .katex-mathml, ' +
                           'annotation, .MathJax_Preview, .MathJax_SVG, ' +
                           '.MathJax_Display, .MathJax, [class*="katex"]';

    // Get all text-bearing elements
    var walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Skip if inside excluded elements
                var parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                if (parent.closest(EXCLUDE_SELECTOR)) return NodeFilter.FILTER_REJECT;
                // Skip invisible text
                var style = window.getComputedStyle(parent);
                if (style.display === 'none' || style.visibility === 'hidden') {
                    return NodeFilter.FILTER_REJECT;
                }
                // Only care about text with some substance
                if (node.textContent.trim().length < 3) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    var textNode;
    while (textNode = walker.nextNode()) {
        var text = textNode.textContent;
        if (LATEX_COMMAND_RE.test(text) || LATEX_FRAGMENT_RE.test(text)) {
            var parent = textNode.parentElement;
            var tag = parent ? parent.tagName.toLowerCase() : '?';
            var context = text.substring(0, 120).replace(/\n/g, ' ');
            issues.push({
                type: 'latex_in_text',
                tag: tag,
                context: context,
                detail: 'Raw LaTeX command found in visible text node'
            });
        }
    }

    // === Strategy 2: Find <em>/<strong>/<i>/<b> containing LaTeX ===
    // This catches the pattern where markdown *...* or _..._ wraps part of a formula
    // e.g.: <em>i = \frac{x_i - \mu</em>

    var emphElements = document.querySelectorAll('em, strong, i, b');
    for (var i = 0; i < emphElements.length; i++) {
        var el = emphElements[i];
        if (el.closest(EXCLUDE_SELECTOR)) continue;
        var style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        var text = el.textContent;
        if (LATEX_COMMAND_RE.test(text) || LATEX_GENERIC_RE.test(text)) {
            var context = text.substring(0, 120).replace(/\n/g, ' ');
            issues.push({
                type: 'latex_in_emphasis',
                tag: el.tagName.toLowerCase(),
                context: context,
                detail: 'LaTeX commands inside <' + el.tagName.toLowerCase() + '> (likely broken formula)'
            });
        }
    }

    // === Strategy 3: Partial render detection ===
    // Find <math> or .katex elements whose NEXT SIBLING contains LaTeX
    // This is the exact pattern from the bug report:
    //   <math>...(rendered)...</math><em>i = \frac{...}</em>...

    var mathElements = document.querySelectorAll('math, .katex, .MathJax');
    for (var i = 0; i < mathElements.length; i++) {
        var mathEl = mathElements[i];

        // Check the parent container's text AFTER this math element
        var parent = mathEl.parentElement;
        if (!parent) continue;

        // Get all child nodes of parent
        var children = parent.childNodes;
        var foundMath = false;
        var afterMathText = '';

        for (var j = 0; j < children.length; j++) {
            if (children[j] === mathEl || children[j].contains && children[j].contains(mathEl)) {
                foundMath = true;
                continue;
            }
            if (foundMath) {
                // Collect text from siblings AFTER the math element
                var sibText = '';
                if (children[j].nodeType === 3) {
                    sibText = children[j].textContent;
                } else if (children[j].nodeType === 1) {
                    // Skip other math elements
                    if (children[j].matches && children[j].matches(EXCLUDE_SELECTOR)) continue;
                    sibText = children[j].textContent;
                }
                afterMathText += sibText;
                // Only check the immediate vicinity (first 200 chars after math)
                if (afterMathText.length > 200) break;
            }
        }

        if (afterMathText.trim().length > 0) {
            if (LATEX_COMMAND_RE.test(afterMathText) || LATEX_FRAGMENT_RE.test(afterMathText)) {
                var context = afterMathText.substring(0, 150).replace(/\n/g, ' ').trim();
                issues.push({
                    type: 'partial_render',
                    tag: mathEl.tagName ? mathEl.tagName.toLowerCase() : 'math',
                    context: context,
                    detail: 'LaTeX fragment found immediately after rendered math element (partial render failure)'
                });
            }
        }
    }

    // === Strategy 4: Look for the annotation leak pattern ===
    // Sometimes the <annotation encoding="application/x-tex"> content leaks
    // into visible rendering. Check if any <annotation> text appears as visible
    // text in a sibling/parent that's not inside the math element.

    var annotations = document.querySelectorAll('annotation[encoding="application/x-tex"]');
    for (var i = 0; i < annotations.length; i++) {
        var ann = annotations[i];
        var annText = ann.textContent.trim();
        if (annText.length < 5) continue;

        // Check if this annotation's text appears verbatim in visible page text
        // outside of math/katex containers
        var mathParent = ann.closest('math, .katex, .MathJax');
        if (!mathParent) continue;

        var container = mathParent.parentElement;
        if (!container) continue;

        // Get visible text of container excluding math internals
        var clone = container.cloneNode(true);
        var mathInClone = clone.querySelectorAll('math, .katex, .MathJax, .katex-mathml, script, style');
        mathInClone.forEach(function(el) { el.remove(); });
        var visibleText = clone.textContent || '';

        // Check if a significant chunk of the annotation appears in visible text
        // Use a substring (at least 15 chars) to avoid false positives
        var checkStr = annText.length > 20 ? annText.substring(0, 20) : annText;
        if (visibleText.indexOf(checkStr) !== -1 && LATEX_COMMAND_RE.test(checkStr)) {
            issues.push({
                type: 'annotation_leak',
                tag: 'annotation',
                context: annText.substring(0, 120),
                detail: 'LaTeX annotation content appears as visible text (rendering failed to hide source)'
            });
        }
    }

    // === Strategy 5: Detect bare $...$ or $$...$$ that weren't processed ===
    // If the page uses $ delimiters and the renderer didn't process them,
    // you'll see literal $ signs around LaTeX content

    var allText = document.body.innerText || '';
    var dollarMatches = allText.match(/\$\$[^$]+\\[a-zA-Z]+[^$]+\$\$/g) || [];
    var inlineMatches = allText.match(/\$[^$\n]+\\[a-zA-Z]+[^$\n]+\$/g) || [];

    for (var i = 0; i < Math.min(dollarMatches.length, 5); i++) {
        issues.push({
            type: 'unprocessed_dollars',
            tag: '$$',
            context: dollarMatches[i].substring(0, 120),
            detail: 'Unprocessed $$...$$ block with LaTeX commands (renderer did not run?)'
        });
    }
    for (var i = 0; i < Math.min(inlineMatches.length, 5); i++) {
        // Filter out things that look like shell/code (e.g., $HOME, $PATH)
        if (/^\$[A-Z_]+$/.test(inlineMatches[i])) continue;
        issues.push({
            type: 'unprocessed_inline_dollar',
            tag: '$',
            context: inlineMatches[i].substring(0, 120),
            detail: 'Unprocessed $...$ inline math with LaTeX commands'
        });
    }

    return issues;
    """)

    if issues:
        for issue in issues:
            desc = (
                f"[{issue['type']}] <{issue['tag']}> {issue['detail']}\n"
                f"    Context: {issue['context']}"
            )
            found.append(desc)

    return found


def find_php_pages(document_root: str) -> list[str]:
    """Find all PHP files that could be entry points."""
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
                print(f"\n[LATEX ISSUES] Found {len(latex_issues)} unrendered LaTeX issue(s) on {page}:")
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

        # Determine exit code (JS errors take priority)
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
