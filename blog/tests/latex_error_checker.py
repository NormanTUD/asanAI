#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "rich",
#   "playwright",
# ]
# ///

"""
latex_error_checker.py — Playwright-based LaTeX & rendering error scanner

Starts a real PHP built-in web server, opens every .php page in a headless
Chromium browser (via Playwright), waits for client-side rendering (KaTeX,
Temml, MathJax), and captures:

  ❌ Console errors (console.error)
  ❌ Console warnings (console.warn)
  ❌ Uncaught JS exceptions (pageerror)
  ❌ Failed network requests (404s, timeouts, etc.)
  ❌ LaTeX/KaTeX/Temml/MathJax error elements in the rendered DOM
  ❌ Raw LaTeX commands leaking into rendered output
  ⚠️  Source patterns likely to cause parse errors

ALL of the above are treated as failures (exit code 1), not just LaTeX errors.

Usage:
  uv run latex_error_checker.py                    # serve current dir on port 8089
  uv run latex_error_checker.py --port 9000        # custom port
  uv run latex_error_checker.py --docroot ./site   # custom document root
  uv run latex_error_checker.py --no-serve         # skip server, scan .php source files directly
  uv run latex_error_checker.py --headed           # run browser visibly for debugging
  uv run latex_error_checker.py --trace            # save Playwright traces for failed pages
"""

import os
import sys
import re
import time
import socket
import subprocess
import argparse
from pathlib import Path
from datetime import datetime, timedelta

try:
    from datetime import UTC
except ImportError:
    from datetime import timezone
    UTC = timezone.utc


# ============================================================
# UV BOOTSTRAPPING
# ============================================================

def compute_exclude_newer_date(days_back=8):
    return (datetime.now(UTC) - timedelta(days=days_back)).strftime("%Y-%m-%dT%H:%M:%SZ")


def should_set_exclude_newer():
    return not os.environ.get("UV_EXCLUDE_NEWER")


def restart_with_uv(script_path, args, env):
    try:
        os.execvpe("uv", ["uv", "run", "--quiet", script_path] + args, env)
    except FileNotFoundError:
        print("uv is not installed. Try:")
        print("  curl -LsSf https://astral.sh/uv/install.sh | sh")
        sys.exit(1)


def ensure_safe_env():
    if not should_set_exclude_newer():
        return
    past_date = compute_exclude_newer_date(8)
    os.environ["UV_EXCLUDE_NEWER"] = past_date
    restart_with_uv(sys.argv[0], sys.argv[1:], os.environ)


# Must run BEFORE heavy imports
ensure_safe_env()

# ============================================================
# Now safe to import everything
# ============================================================

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box
from rich.rule import Rule
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, MofNCompleteColumn
from rich.tree import Tree

console = Console()


# ============================================================
# PLAYWRIGHT BROWSER AUTO-INSTALL
# ============================================================

def ensure_playwright_browsers():
    """
    Automatically install Playwright Chromium browser if not already present.
    This prevents the 'Executable doesn't exist' error.
    """
    try:
        # Quick check: try to find the chromium executable
        from playwright._impl._driver import compute_driver_executable
        driver_executable = compute_driver_executable()
        # Run `playwright install chromium` via the driver
        result = subprocess.run(
            [str(driver_executable), "install", "chromium"],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode == 0:
            if "Downloading" in result.stdout or "downloading" in result.stderr:
                console.print("[bold green]✓ Playwright Chromium browser installed successfully.[/]")
            # If already installed, it exits quickly and silently
        else:
            # Fallback: try via python -m playwright
            console.print("[dim]Installing Playwright browsers via module...[/]")
            result2 = subprocess.run(
                [sys.executable, "-m", "playwright", "install", "chromium"],
                capture_output=True,
                text=True,
                timeout=120,
            )
            if result2.returncode != 0:
                console.print(f"[bold red]Failed to install Playwright browsers:[/]\n{result2.stderr}")
                sys.exit(1)
            else:
                console.print("[bold green]✓ Playwright Chromium browser installed.[/]")
    except ImportError:
        # If we can't import the driver path, fall back to subprocess
        console.print("[dim]Ensuring Playwright browsers are installed...[/]")
        result = subprocess.run(
            [sys.executable, "-m", "playwright", "install", "chromium"],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            console.print(f"[bold red]Failed to install Playwright browsers:[/]\n{result.stderr}")
            sys.exit(1)
        console.print("[bold green]✓ Playwright Chromium browser installed.[/]")
    except subprocess.TimeoutExpired:
        console.print("[bold red]Timed out installing Playwright browsers (120s). Check your network.[/]")
        sys.exit(1)
    except Exception as e:
        # Last resort fallback
        console.print(f"[dim]Browser install check: {e} — trying module fallback...[/]")
        result = subprocess.run(
            [sys.executable, "-m", "playwright", "install", "chromium"],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            console.print(f"[bold red]Failed to install Playwright browsers:[/]\n{result.stderr}")
            sys.exit(1)


# ============================================================
# CONFIGURATION
# ============================================================

SKIP_DIRS = {
    ".git", "node_modules", "vendor", ".svn", "__pycache__",
    ".idea", ".vscode", "storage", "cache", "dist", "build",
}

IGNORE_JS_FILENAMES = {
    "tf.min.js", "three.min.js", "echarts.min.js", "tf.js",
    "echarts-gl.min.js", "jquery.js", "jquery-3.7.1.min.js",
    "plotly-2.24.1.min.js", "prism.min.js", "prism-python.min.js",
    "temml.min.js",
}

# ============================================================
# LATEX PARSE ERROR PATTERNS (for rendered DOM scanning)
# ============================================================

LATEX_ERROR_PATTERNS = [
    re.compile(
        r"ParseError:\s*Can(?:&#x27;|'|')t\s+use\s+function\s+(?:&#x27;|'|')([^'\"<>]+?)(?:&#x27;|'|')",
        re.IGNORECASE,
    ),
    re.compile(
        r"ParseError:\s*Expected\s+(?:&#x27;|'|')([^'\"<>]+?)(?:&#x27;|'|'),\s*got\s+(?:&#x27;|'|')([^'\"<>]*?)(?:&#x27;|'|')",
        re.IGNORECASE,
    ),
    re.compile(
        r"ParseError:\s*(?:KaTeX|Temml)?\s*[Pp]arse\s*[Ee]rror:\s*(.*?)(?:<|$)",
        re.IGNORECASE,
    ),
    re.compile(
        r"Can(?:&#x27;|'|')t\s+use\s+function\s+(?:&#x27;|'|')([^'\"<>]+?)(?:&#x27;|'|')\s+in\s+math\s+mode\s+at\s+position\s+(\d+)",
        re.IGNORECASE,
    ),
    re.compile(
        r"ParseError:\s*(.{10,120})",
        re.IGNORECASE,
    ),
    re.compile(
        r'class="katex-error"[^>]*title="([^"]+)"',
        re.IGNORECASE,
    ),
    re.compile(
        r'class="temml-error"[^>]*>([^<]+)<',
        re.IGNORECASE,
    ),
    re.compile(
        r'class="[^"]*mjx-error[^"]*"[^>]*>([^<]+)<',
        re.IGNORECASE,
    ),
    re.compile(
        r"Expected\s+(?:&#x27;|')EOF(?:&#x27;|'),\s*got\s+(?:&#x27;|')(.+?)(?:&#x27;|')\s+at\s+position\s+(\d+)",
        re.IGNORECASE,
    ),
    re.compile(
        r"\\(?:text|frac|sum|prod|int|lim|cos|sin|tan|log|ln|exp|sqrt|vec|hat|bar|dot|ddot|mathbb|mathcal|mathrm|operatorname)\s*\{[^}]+\}",
    ),
    re.compile(
        r"\\(?:left|right)\s*[(\[{|)\]}|\\]",
    ),
    re.compile(
        r"\\(?:approx|cdot|in|phi|theta|alpha|beta|gamma|delta|epsilon|lambda|mu|sigma|omega|pi|infty|partial|nabla|forall|exists|rightarrow|leftarrow|Rightarrow|Leftarrow|xrightarrow|xleftarrow|geq|leq|neq|sim|equiv|subset|supset|cup|cap|times|otimes|oplus|circ)\b",
    ),
]

# Patterns to detect in SOURCE files that commonly cause parse errors
SOURCE_LATEX_RISK_PATTERNS = [
    re.compile(r"\$\$[^$]*#[^$]*\$\$", re.DOTALL),
    re.compile(r"\$\$[^$]*\n\s*##?\s+[^$]*\$\$", re.DOTALL),
    re.compile(r"\\text\{[^}]*[#_&%$][^}]*\}"),
    re.compile(r"\\text\{[^}]*\\(?:text|mathrm|mathbf)\{[^}]*\}[^}]*\}"),
]

# Console message patterns to IGNORE (noisy but harmless)
CONSOLE_IGNORE_PATTERNS = [
    re.compile(r"Download the React DevTools", re.IGNORECASE),
    re.compile(r"Third-party cookie will be blocked", re.IGNORECASE),
    re.compile(r"DevTools failed to load", re.IGNORECASE),
]


# ============================================================
# PHP SERVER MANAGEMENT
# ============================================================

def find_free_port(preferred: int = 8089) -> int:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(("127.0.0.1", preferred))
            return preferred
    except OSError:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(("127.0.0.1", 0))
            return s.getsockname()[1]


def check_php_available() -> bool:
    try:
        result = subprocess.run(
            ["php", "-v"], capture_output=True, text=True, timeout=10
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def start_php_server(docroot: Path, port: int) -> subprocess.Popen | None:
    try:
        proc = subprocess.Popen(
            ["php", "-S", f"127.0.0.1:{port}", "-t", str(docroot)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(docroot),
        )
        time.sleep(1.5)

        if proc.poll() is not None:
            stderr = proc.stderr.read().decode(errors="replace") if proc.stderr else ""
            console.print(f"[bold red]PHP server failed to start:[/] {stderr}")
            return None

        # Verify it's responding
        import urllib.request
        for attempt in range(5):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=3)
                return proc
            except Exception:
                time.sleep(0.5)

        console.print("[bold red]PHP server started but not responding.[/]")
        proc.terminate()
        return None

    except FileNotFoundError:
        console.print("[bold red]PHP CLI not found. Install PHP to use server mode.[/]")
        return None
    except Exception as e:
        console.print(f"[bold red]Error starting PHP server:[/] {e}")
        return None


def stop_php_server(proc: subprocess.Popen):
    if proc and proc.poll() is None:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()


# ============================================================
# FILE DISCOVERY
# ============================================================

def find_php_files(docroot: Path) -> list[Path]:
    php_files: set[Path] = set()
    for root, dirs, files in os.walk(docroot):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if f.endswith(".php"):
                php_files.add((Path(root) / f).resolve())
    return sorted(php_files)


def find_js_files(docroot: Path) -> list[Path]:
    js_files: set[Path] = set()
    for root, dirs, files in os.walk(docroot):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if f.endswith(".js") and f not in IGNORE_JS_FILENAMES:
                js_files.add((Path(root) / f).resolve())
    return sorted(js_files)


# ============================================================
# RENDERED HTML SCANNING (regex on fully-rendered DOM)
# ============================================================

def scan_html_for_latex_errors(html: str, source_label: str) -> list[dict]:
    """Scan rendered HTML for LaTeX ParseError patterns."""
    issues = []
    seen_messages = set()

    for pattern in LATEX_ERROR_PATTERNS:
        for match in pattern.finditer(html):
            full_match = match.group(0).strip()

            display_msg = full_match
            display_msg = display_msg.replace("&#x27;", "'")
            display_msg = display_msg.replace("&amp;", "&")
            display_msg = display_msg.replace("&lt;", "<")
            display_msg = display_msg.replace("&gt;", ">")
            display_msg = display_msg.replace("&quot;", '"')

            if len(display_msg) > 200:
                display_msg = display_msg[:197] + "..."

            dedup_key = display_msg[:80]
            if dedup_key in seen_messages:
                continue
            seen_messages.add(dedup_key)

            pos = match.start()
            line_num = html.count("\n", 0, pos) + 1

            issues.append({
                "type": "latex_parse_error",
                "line": line_num,
                "message": display_msg,
                "source": source_label,
                "position": pos,
            })

    return issues


# ============================================================
# PLAYWRIGHT BROWSER SCANNING
# ============================================================

def should_ignore_console_message(text: str) -> bool:
    """Check if a console message should be ignored (noisy/harmless)."""
    for pattern in CONSOLE_IGNORE_PATTERNS:
        if pattern.search(text):
            return True
    return False


def scan_page_with_browser(
    page,
    url: str,
    page_label: str,
    render_wait_ms: int = 3000,
    navigation_timeout: int = 30000,
) -> list[dict]:
    """
    Navigate to a URL in a real Chromium browser, wait for JS rendering,
    and capture ALL errors: console errors/warnings, JS exceptions,
    failed network requests, and LaTeX error elements in the DOM.
    """
    issues = []

    # Collectors
    console_messages = []
    page_errors = []
    failed_requests = []

    # Attach event listeners
    def on_console(msg):
        console_messages.append(msg)

    def on_pageerror(err):
        page_errors.append(err)

    def on_requestfailed(req):
        failed_requests.append(req)

    page.on("console", on_console)
    page.on("pageerror", on_pageerror)
    page.on("requestfailed", on_requestfailed)

    # Navigate
    try:
        page.goto(url, wait_until="networkidle", timeout=navigation_timeout)
    except PlaywrightTimeout:
        issues.append({
            "type": "navigation_timeout",
            "line": 0,
            "message": f"Page load timed out after {navigation_timeout}ms: {url}",
            "source": page_label,
        })
    except Exception as e:
        issues.append({
            "type": "navigation_error",
            "line": 0,
            "message": f"Navigation failed: {e}",
            "source": page_label,
        })
        return issues

    # Wait extra time for client-side rendering (KaTeX/Temml/MathJax)
    page.wait_for_timeout(render_wait_ms)

    # ── Collect console errors and warnings ──
    for msg in console_messages:
        text = msg.text
        if should_ignore_console_message(text):
            continue

        if msg.type == "error":
            issues.append({
                "type": "console_error",
                "line": 0,
                "message": f"[console.error] {text[:300]}",
                "source": page_label,
            })
        elif msg.type == "warning":
            issues.append({
                "type": "console_warning",
                "line": 0,
                "message": f"[console.warn] {text[:300]}",
                "source": page_label,
            })

    # ── Collect uncaught JS exceptions ──
    for err in page_errors:
        issues.append({
            "type": "js_exception",
            "line": 0,
            "message": f"[Uncaught Exception] {str(err)[:300]}",
            "source": page_label,
        })

    # ── Collect failed network requests ──
    for req in failed_requests:
        failure_text = req.failure or "unknown failure"
        issues.append({
            "type": "network_failure",
            "line": 0,
            "message": f"[Network Failure] {failure_text} — {req.url[:200]}",
            "source": page_label,
        })

    # ── Query the live DOM for error elements ──
    error_selectors = [
        (".katex-error", "KaTeX error"),
        (".temml-error", "Temml error"),
        (".mjx-error", "MathJax error"),
        (".MathJax_Error", "MathJax error (legacy)"),
    ]

    for selector, label in error_selectors:
        try:
            error_elements = page.query_selector_all(selector)
            for el in error_elements:
                text_content = el.text_content() or ""
                title_attr = el.get_attribute("title") or ""
                display = title_attr if title_attr else text_content
                if len(display) > 200:
                    display = display[:197] + "..."
                issues.append({
                    "type": "latex_dom_error",
                    "line": 0,
                    "message": f"[{label}] {display}",
                    "source": page_label,
                })
        except Exception:
            pass

    # ── Also scan the fully-rendered HTML with regex patterns ──
    try:
        rendered_html = page.content()
        regex_issues = scan_html_for_latex_errors(rendered_html, page_label)
        issues.extend(regex_issues)
    except Exception:
        pass

    # Remove event listeners to avoid leaks
    page.remove_listener("console", on_console)
    page.remove_listener("pageerror", on_pageerror)
    page.remove_listener("requestfailed", on_requestfailed)

    return issues


# ============================================================
# SOURCE FILE SCANNING (additional static analysis)
# ============================================================

def scan_source_for_latex_risks(content: str, filepath: Path) -> list[dict]:
    """Scan PHP/JS source for patterns known to cause LaTeX parse errors."""
    issues = []
    seen = set()

    for pattern in SOURCE_LATEX_RISK_PATTERNS:
        for match in pattern.finditer(content):
            snippet = match.group(0)
            if len(snippet) > 120:
                snippet = snippet[:117] + "..."

            dedup_key = snippet[:60]
            if dedup_key in seen:
                continue
            seen.add(dedup_key)

            pos = match.start()
            line_num = content.count("\n", 0, pos) + 1

            issues.append({
                "type": "latex_source_risk",
                "line": line_num,
                "message": f"Potential LaTeX parse error source: {snippet}",
                "source": str(filepath.name),
            })

    return issues


def scan_js_for_latex_strings(content: str, filepath: Path) -> list[dict]:
    """Scan JS files for LaTeX strings that may cause render errors."""
    issues = []
    seen = set()

    latex_in_js = re.compile(
        r'["`]([^"`]*(?:\\\\(?:text|frac|sum|cos|sin|approx|cdot|vec|left|right)\s*\{[^}]*\})[^"`]*)["`]'
    )

    for match in latex_in_js.finditer(content):
        snippet = match.group(1)
        if len(snippet) > 120:
            snippet = snippet[:117] + "..."

        dedup_key = snippet[:60]
        if dedup_key in seen:
            continue
        seen.add(dedup_key)

        pos = match.start()
        line_num = content.count("\n", 0, pos) + 1

        risky = False
        if "#" in snippet and ("$$" in snippet or "\\(" in snippet):
            risky = True
        if re.search(r"\\text\{[^}]*[#_&%$]", snippet):
            risky = True

        if risky:
            issues.append({
                "type": "latex_js_risk",
                "line": line_num,
                "message": f"JS LaTeX string may cause parse error: {snippet}",
                "source": str(filepath.name),
            })

    return issues


# ============================================================
# SEVERITY HELPERS
# ============================================================

# ALL of these are treated as FAILURES (exit code 1)
FAILURE_TYPES = {
    "latex_parse_error",
    "latex_dom_error",
    "console_error",
    "console_warning",
    "js_exception",
    "network_failure",
    "navigation_timeout",
    "navigation_error",
}

# These are warnings — still reported but don't fail the build
WARNING_TYPES = {"latex_source_risk", "latex_js_risk"}

INFO_TYPES = {"latex_info", "server_error"}


def severity_style(issue_type: str) -> str:
    if issue_type in FAILURE_TYPES:
        return "bold red"
    elif issue_type in WARNING_TYPES:
        return "bold yellow"
    return "bold blue"


def severity_icon(issue_type: str) -> str:
    if issue_type in FAILURE_TYPES:
        return "❌"
    elif issue_type in WARNING_TYPES:
        return "⚠️"
    return "ℹ️"


# ============================================================
# MAIN
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="Scan PHP-served pages in a real browser for LaTeX errors, console errors, JS exceptions, and network failures"
    )
    parser.add_argument(
        "--docroot", "-d", type=str, default=".",
        help="Document root for the PHP server (default: current directory)"
    )
    parser.add_argument(
        "--port", "-p", type=int, default=8089,
        help="Port for the PHP built-in server (default: 8089)"
    )
    parser.add_argument(
        "--no-serve", action="store_true",
        help="Skip starting a PHP server; only scan source files for risky patterns"
    )
    parser.add_argument(
        "--headed", action="store_true",
        help="Run browser in headed mode (visible window) for debugging"
    )
    parser.add_argument(
        "--trace", action="store_true",
        help="Save Playwright traces for pages with issues (saved to ./traces/)"
    )
    parser.add_argument(
        "--render-wait", type=int, default=3000,
        help="Extra milliseconds to wait for client-side rendering after networkidle (default: 3000)"
    )
    parser.add_argument(
        "--navigation-timeout", type=int, default=30000,
        help="Navigation timeout in milliseconds (default: 30000)"
    )
    parser.add_argument(
        "--keep-server", "-k", action="store_true",
        help="Keep the PHP server running after checks (for manual inspection)"
    )
    parser.add_argument(
        "paths", nargs="*", default=[],
        help="Additional files or directories to scan (source-level only)"
    )

    args = parser.parse_args()
    docroot = Path(args.docroot).resolve()

    console.print()
    console.print(Panel(
        "[bold bright_cyan]🔬 LaTeX & Rendering Error Scanner (Playwright)[/]\n\n"
        "[dim]Starts a PHP server, opens every page in a real Chromium browser,\n"
        "waits for client-side JS rendering, and captures ALL issues:[/]\n\n"
        "  [bold red]❌[/] Console errors (console.error)\n"
        "  [bold red]❌[/] Console warnings (console.warn)\n"
        "  [bold red]❌[/] Uncaught JS exceptions\n"
        "  [bold red]❌[/] Failed network requests (404s, timeouts)\n"
        "  [bold red]❌[/] LaTeX/KaTeX/Temml/MathJax error elements in DOM\n"
        "  [bold red]❌[/] Raw LaTeX commands leaking into rendered output\n"
        "  [bold yellow]⚠️[/]  Source patterns likely to cause parse errors\n\n"
        "[dim]Usage:[/]\n"
        "  [bold]uv run latex_error_checker.py[/]                     [dim]# serve . on :8089[/]\n"
        "  [bold]uv run latex_error_checker.py -d ./site -p 9000[/]   [dim]# custom root & port[/]\n"
        "  [bold]uv run latex_error_checker.py --headed[/]            [dim]# visible browser[/]\n"
        "  [bold]uv run latex_error_checker.py --trace[/]             [dim]# save traces[/]\n"
        "  [bold]uv run latex_error_checker.py --no-serve[/]          [dim]# source scan only[/]",
        title="[bold bright_white]LaTeX Error Checker v2.0 (Playwright)[/]",
        border_style="bright_cyan",
        padding=(1, 3),
    ))
    console.print()

    if not docroot.is_dir():
        console.print(f"[bold red]Document root not found:[/] {docroot}")
        sys.exit(1)

    # ── Ensure Playwright browsers are installed ────────────
    console.print("[dim]Checking Playwright browser installation...[/]")
    ensure_playwright_browsers()
    console.print()

    # ── Discover files ──────────────────────────────────────
    php_files = find_php_files(docroot)
    js_files = find_js_files(docroot)

    console.print(f"[bold]Document root:[/] {docroot}")
    console.print(f"[bold]PHP files found:[/] {len(php_files)}")
    console.print(f"[bold]JS  files found:[/] {len(js_files)}")
    console.print(f"[bold]Browser mode:[/]   {'Headed (visible)' if args.headed else 'Headless'}")
    console.print(f"[bold]Render wait:[/]    {args.render_wait}ms")
    console.print()

    if not php_files and not js_files:
        console.print("[bold yellow]No PHP or JS files found.[/]")
        sys.exit(0)

    all_issues: list[tuple[str, list[dict]]] = []
    php_server_proc = None
    server_started = False

    # ── Phase 1: Start PHP server and scan with Playwright ──
    if not args.no_serve and php_files:
        if not check_php_available():
            console.print("[bold yellow]⚠️  PHP CLI not found — skipping server mode, falling back to source scan.[/]")
            console.print()
        else:
            port = find_free_port(args.port)
            base_url = f"http://127.0.0.1:{port}"

            console.print(f"[bold bright_green]▶ Starting PHP server on {base_url} ...[/]")
            php_server_proc = start_php_server(docroot, port)

            if php_server_proc:
                server_started = True
                console.print(f"[bold green]✓ PHP server running[/] (PID {php_server_proc.pid})")
                console.print()

                # Build list of pages to fetch
                pages_to_check = []
                for pf in php_files:
                    try:
                        rel = pf.relative_to(docroot)
                        pages_to_check.append(str(rel))
                    except ValueError:
                        pass

                if "index.php" not in pages_to_check:
                    pages_to_check.insert(0, "index.php")

                console.print(Rule(
                    title="[bold bright_cyan]Phase 1: Browser Rendering & Error Capture[/]",
                    style="bright_blue"
                ))
                console.print()

                # Create trace directory if needed
                trace_dir = Path("./traces")
                if args.trace:
                    trace_dir.mkdir(exist_ok=True)

                # Launch Playwright browser
                with sync_playwright() as p:
                    browser = p.chromium.launch(headless=not args.headed)

                    with Progress(
                        SpinnerColumn(),
                        TextColumn("[progress.description]{task.description}"),
                        BarColumn(),
                        MofNCompleteColumn(),
                        console=console,
                    ) as progress:
                        task = progress.add_task("Scanning pages...", total=len(pages_to_check))

                        for page_path in pages_to_check:
                            if page_path == "/functions.php":
                                continue

                            progress.update(task, description=f"🌐 /{page_path}")

                            url = f"{base_url}/{page_path}"
                            page_label = f"/{page_path}"

                            # Create a fresh context for each page (clean state)
                            context = browser.new_context(
                                viewport={"width": 1280, "height": 900},
                                ignore_https_errors=True,
                            )

                            if args.trace:
                                context.tracing.start(
                                    screenshots=True,
                                    snapshots=True,
                                    sources=True,
                                )

                            page = context.new_page()

                            # Scan the page
                            page_issues = scan_page_with_browser(
                                page=page,
                                url=url,
                                page_label=page_label,
                                render_wait_ms=args.render_wait,
                                navigation_timeout=args.navigation_timeout,
                            )

                            if page_issues:
                                all_issues.append((f"🌐 {page_label} (rendered)", page_issues))

                                # Save trace if requested
                                if args.trace:
                                    safe_name = page_path.replace("/", "_").replace("\\", "_")
                                    trace_path = trace_dir / f"{safe_name}.zip"
                                    context.tracing.stop(path=str(trace_path))
                            else:
                                if args.trace:
                                    # Discard trace for clean pages
                                    context.tracing.stop(path=str(trace_dir / "_discard.zip"))
                                    (trace_dir / "_discard.zip").unlink(missing_ok=True)

                            page.close()
                            context.close()
                            progress.advance(task)

                    browser.close()

                console.print()

    # ── Phase 2: Source-level scanning ──────────────────────
    console.print(Rule(
        title="[bold bright_cyan]Phase 2: Scanning Source Files[/]",
        style="bright_blue"
    ))
    console.print()

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        MofNCompleteColumn(),
        console=console,
    ) as progress:
        total = len(php_files) + len(js_files)
        task = progress.add_task("Scanning sources...", total=total)

        for filepath in php_files:
            progress.update(task, description=f"Scanning {filepath.name}")
            try:
                content = filepath.read_text(encoding="utf-8", errors="replace")
                source_issues = scan_source_for_latex_risks(content, filepath)
                if source_issues:
                    try:
                        rel = filepath.relative_to(docroot)
                    except ValueError:
                        rel = filepath
                    all_issues.append((f"📄 {rel} (source)", source_issues))
            except Exception as e:
                all_issues.append((f"📄 {filepath.name}", [{
                    "type": "latex_info",
                    "line": 0,
                    "message": f"Cannot read file: {e}",
                    "source": str(filepath.name),
                }]))
            progress.advance(task)

        # Scan JS sources
        for filepath in js_files:
            progress.update(task, description=f"Scanning {filepath.name}")
            try:
                content = filepath.read_text(encoding="utf-8", errors="replace")
                js_issues = scan_js_for_latex_strings(content, filepath)
                if js_issues:
                    try:
                        rel = filepath.relative_to(docroot)
                    except ValueError:
                        rel = filepath
                    all_issues.append((f"📜 {rel} (JS source)", js_issues))
            except Exception:
                pass
            progress.advance(task)

    console.print()

    # ── Results ─────────────────────────────────────────────
    console.print(Rule(title="[bold bright_cyan]Results[/]", style="bright_blue"))
    console.print()

    total_errors = 0
    total_warnings = 0
    total_info = 0
    files_with_issues = 0

    if not all_issues:
        console.print(Panel(
            "[bold bright_green]No rendering errors or warnings found! 🎉[/]",
            border_style="green",
            padding=(0, 2),
        ))
    else:
        for label, issues in all_issues:
            if not issues:
                continue
            files_with_issues += 1

            tree = Tree(f"[bold bright_white]{label}[/]")

            for issue in issues:
                itype = issue["type"]
                icon = severity_icon(itype)
                style = severity_style(itype)
                line_info = f"[dim]~line {issue['line']}:[/] " if issue.get("line", 0) > 0 else ""
                tree.add(f"{icon} {line_info}[{style}]{issue['message']}[/]")

                if itype in FAILURE_TYPES:
                    total_errors += 1
                elif itype in WARNING_TYPES:
                    total_warnings += 1
                else:
                    total_info += 1

            console.print(tree)
            console.print()

    # ── Summary ─────────────────────────────────────────────
    console.print(Rule(title="[bold bright_cyan]Summary[/]", style="bright_blue"))
    console.print()

    total_all = total_errors + total_warnings + total_info

    summary = Table(
        box=box.ROUNDED,
        border_style="bright_blue",
        header_style="bold white",
        show_lines=False,
        padding=(0, 2),
    )
    summary.add_column("Metric", style="bold")
    summary.add_column("Count", justify="right")
    summary.add_column("Status", justify="center")

    summary.add_row("PHP files scanned", str(len(php_files)), "🐘")
    summary.add_row("JS  files scanned", str(len(js_files)), "📜")
    summary.add_row(
        "Server mode",
        "Yes (Playwright)" if server_started else "No",
        "[green]✓[/]" if server_started else "[dim]—[/]",
    )
    summary.add_row("", "", "")

    if total_errors > 0:
        summary.add_row(
            "❌ Failures (errors/warnings/exceptions)",
            f"[bold red]{total_errors}[/]",
            "[bold red]FAIL[/]",
        )
    else:
        summary.add_row(
            "❌ Failures (errors/warnings/exceptions)",
            "0",
            "[green]✓[/]",
        )

    if total_warnings > 0:
        summary.add_row(
            "⚠️  Risky source patterns",
            f"[bold yellow]{total_warnings}[/]",
            "[bold yellow]review[/]",
        )
    else:
        summary.add_row("⚠️  Risky source patterns", "0", "[green]✓[/]")

    if total_info > 0:
        summary.add_row("ℹ️  Info", f"[bold blue]{total_info}[/]", "[bold blue]note[/]")
    else:
        summary.add_row("ℹ️  Info", "0", "[green]✓[/]")

    summary.add_row("", "", "")
    summary.add_row(
        "[bold]Total issues[/]",
        f"[bold]{total_all}[/]",
        "[bold green]🎉 PASS[/]" if total_errors == 0 else f"[bold red]🚨 {total_errors} failure(s)[/]",
    )

    console.print(summary)
    console.print()

    clean_files = (len(php_files) + len(js_files)) - files_with_issues
    if clean_files > 0 and files_with_issues > 0:
        console.print(f"  [dim]{clean_files} file(s) passed all checks without issues.[/]")
        console.print()

    # ── Trace info ──────────────────────────────────────────
    if args.trace and total_errors > 0:
        trace_dir = Path("./traces")
        trace_files = list(trace_dir.glob("*.zip")) if trace_dir.exists() else []
        trace_files = [f for f in trace_files if f.name != "_discard.zip"]
        if trace_files:
            console.print(Panel(
                f"[bold bright_cyan]📁 Playwright traces saved to ./traces/[/]\n\n"
                f"[dim]View with:[/]  [bold]npx playwright show-trace ./traces/<file>.zip[/]\n"
                f"[dim]Traces saved:[/] {len(trace_files)}",
                border_style="cyan",
                padding=(0, 2),
            ))
            console.print()

    # ── Keep server or shut down ────────────────────────────
    if php_server_proc:
        if args.keep_server:
            console.print(Panel(
                f"[bold bright_green]PHP server still running[/]\n"
                f"[dim]PID {php_server_proc.pid} — press Ctrl+C to stop[/]",
                border_style="green",
                padding=(0, 2),
            ))
            try:
                php_server_proc.wait()
            except KeyboardInterrupt:
                console.print("\n[bold yellow]Shutting down PHP server...[/]")
                stop_php_server(php_server_proc)
                console.print("[bold green]✓ Server stopped.[/]")
        else:
            stop_php_server(php_server_proc)
            console.print("[dim]PHP server stopped.[/]")
            console.print()

    # ── Final verdict ───────────────────────────────────────
    if total_errors > 0:
        console.print(Panel(
            f"[bold red]🚨 {total_errors} failure(s) detected![/]\n"
            f"[dim]Console errors, warnings, JS exceptions, network failures,\n"
            f"and LaTeX parse errors are all treated as failures.[/]",
            border_style="red",
            padding=(0, 2),
        ))
        sys.exit(1)
    elif total_warnings > 0:
        console.print(Panel(
            f"[bold bright_yellow]⚠️  No rendered failures, but {total_warnings} risky source pattern(s) found.[/]",
            border_style="yellow",
            padding=(0, 2),
        ))
        sys.exit(0)
    else:
        if total_all == 0:
            console.print(Panel(
                "[bold bright_green]All pages passed rendering checks! 🎉[/]\n"
                "[dim]No console errors, no JS exceptions, no network failures,\n"
                "no LaTeX parse errors detected.[/]",
                border_style="green",
                padding=(0, 2),
            ))
        sys.exit(0)


if __name__ == "__main__":
    main()
