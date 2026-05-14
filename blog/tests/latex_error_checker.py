#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "rich",
#   "requests",
# ]
# ///

"""
latex_error_checker.py — Self-bootstrapping uv script

Starts a real PHP built-in web server, fetches every .php page through it,
and scans the rendered HTML output for LaTeX / KaTeX / Temml ParseError
patterns such as:

  ParseError: Can't use function '...'
  ParseError: Expected 'EOF', got '#' at position ...
  ParseError: Expected 'EOF', got '̲' at position ...
  Can't use function '...' in math mode at position ...

Usage:
  uv run latex_error_checker.py                    # serve current dir on port 8089
  uv run latex_error_checker.py --port 9000        # custom port
  uv run latex_error_checker.py --docroot ./site   # custom document root
  uv run latex_error_checker.py --no-serve         # skip server, scan .php source files directly
"""

import os
import sys
import re
import glob
import time
import signal
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

import requests
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box
from rich.rule import Rule
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, MofNCompleteColumn
from rich.tree import Tree
from rich.syntax import Syntax

console = Console()

# ============================================================
# CONFIGURATION
# ============================================================

SKIP_DIRS = {
    ".git", "node_modules", "vendor", ".svn", "__pycache__",
    ".idea", ".vscode", "storage", "cache", "dist", "build",
}

# JS files to ignore (vendored / minified)
IGNORE_JS_FILENAMES = {
    "tf.min.js", "three.min.js", "echarts.min.js", "tf.js",
    "echarts-gl.min.js", "jquery.js", "jquery-3.7.1.min.js",
    "plotly-2.24.1.min.js", "prism.min.js", "prism-python.min.js",
    "temml.min.js",
}

# ============================================================
# LATEX PARSE ERROR PATTERNS
# ============================================================

# These patterns match the exact errors shown in the issue:
#   ParseError: Can't use function '...'
#   ParseError: Expected 'EOF', got '#' at position 292: …
#   Can't use function '...' in math mode at position 9: ...
#   ParseError: Expected 'EOF', got '̲' at position 1: ...
#   KaTeX parse error / Temml parse error variants

LATEX_ERROR_PATTERNS = [
    # Core ParseError patterns (KaTeX / Temml)
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
    # "Can't use function '...' in math mode at position ..."
    re.compile(
        r"Can(?:&#x27;|'|')t\s+use\s+function\s+(?:&#x27;|'|')([^'\"<>]+?)(?:&#x27;|'|')\s+in\s+math\s+mode\s+at\s+position\s+(\d+)",
        re.IGNORECASE,
    ),
    # Generic "ParseError:" catch-all for any remaining variants
    re.compile(
        r"ParseError:\s*(.{10,120})",
        re.IGNORECASE,
    ),
    # KaTeX specific error class in rendered HTML
    re.compile(
        r'class="katex-error"[^>]*title="([^"]+)"',
        re.IGNORECASE,
    ),
    # Temml error span
    re.compile(
        r'class="temml-error"[^>]*>([^<]+)<',
        re.IGNORECASE,
    ),
    # MathJax error
    re.compile(
        r'class="[^"]*mjx-error[^"]*"[^>]*>([^<]+)<',
        re.IGNORECASE,
    ),
    # Bare "Expected 'EOF'" without ParseError prefix (truncated renders)
    re.compile(
        r"Expected\s+(?:&#x27;|')EOF(?:&#x27;|'),\s*got\s+(?:&#x27;|')(.+?)(?:&#x27;|')\s+at\s+position\s+(\d+)",
        re.IGNORECASE,
    ),
    # The set {M_k ... pattern — unescaped LaTeX leaking into text
    re.compile(
        r"(?:The\s+set\s+)?\{[A-Z]_[a-z]\s*:\s*[a-z]\s*\\in\s*\\",
        re.IGNORECASE,
    ),
    # Raw \text{...} or \frac{...} appearing in rendered output (LaTeX not parsed)
    re.compile(
        r"\\(?:text|frac|sum|prod|int|lim|cos|sin|tan|log|ln|exp|sqrt|vec|hat|bar|dot|ddot|mathbb|mathcal|mathrm|operatorname)\s*\{[^}]+\}",
    ),
    # Raw \left( or \right) appearing in rendered output
    re.compile(
        r"\\(?:left|right)\s*[(\[{|)\]}|\\]",
    ),
    # Raw \approx, \cdot, \in, \phi, etc. appearing as text
    re.compile(
        r"\\(?:approx|cdot|in|phi|theta|alpha|beta|gamma|delta|epsilon|lambda|mu|sigma|omega|pi|infty|partial|nabla|forall|exists|rightarrow|leftarrow|Rightarrow|Leftarrow|xrightarrow|xleftarrow|geq|leq|neq|sim|equiv|subset|supset|cup|cap|times|otimes|oplus|circ)\b",
    ),
]

# Patterns to detect in SOURCE files (before rendering) that commonly cause parse errors
SOURCE_LATEX_RISK_PATTERNS = [
    # $$ blocks containing # (common cause of "Expected 'EOF', got '#'")
    re.compile(r"\$\$[^$]*#[^$]*\$\$", re.DOTALL),
    # Markdown headers inside $$ blocks
    re.compile(r"\$\$[^$]*\n\s*##?\s+[^$]*\$\$", re.DOTALL),
    # \text{} containing unescaped special chars
    re.compile(r"\\text\{[^}]*[#_&%$][^}]*\}"),
    # Nested \text{} with function calls
    re.compile(r"\\text\{[^}]*\\(?:text|mathrm|mathbf)\{[^}]*\}[^}]*\}"),
]


# ============================================================
# PHP SERVER MANAGEMENT
# ============================================================

def find_free_port(preferred: int = 8089) -> int:
    """Try the preferred port, fall back to OS-assigned."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(("127.0.0.1", preferred))
            return preferred
    except OSError:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(("127.0.0.1", 0))
            return s.getsockname()[1]


def check_php_available() -> bool:
    """Check if PHP CLI is available."""
    try:
        result = subprocess.run(
            ["php", "-v"], capture_output=True, text=True, timeout=10
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def start_php_server(docroot: Path, port: int) -> subprocess.Popen | None:
    """Start PHP's built-in web server and return the Popen handle."""
    try:
        proc = subprocess.Popen(
            ["php", "-S", f"127.0.0.1:{port}", "-t", str(docroot)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(docroot),
        )
        # Give it a moment to start
        time.sleep(1.0)

        if proc.poll() is not None:
            stderr = proc.stderr.read().decode(errors="replace") if proc.stderr else ""
            console.print(f"[bold red]PHP server failed to start:[/] {stderr}")
            return None

        # Verify it's responding
        for attempt in range(5):
            try:
                resp = requests.get(f"http://127.0.0.1:{port}/", timeout=3)
                return proc
            except requests.ConnectionError:
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
    """Gracefully stop the PHP server."""
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
    """Find all .php files under docroot."""
    php_files: set[Path] = set()
    for root, dirs, files in os.walk(docroot):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if f.endswith(".php"):
                php_files.add((Path(root) / f).resolve())
    return sorted(php_files)


def find_js_files(docroot: Path) -> list[Path]:
    """Find all .js files under docroot (excluding vendored)."""
    js_files: set[Path] = set()
    for root, dirs, files in os.walk(docroot):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if f.endswith(".js") and f not in IGNORE_JS_FILENAMES:
                js_files.add((Path(root) / f).resolve())
    return sorted(js_files)


# ============================================================
# RENDERED HTML SCANNING (via PHP server)
# ============================================================

def fetch_rendered_page(base_url: str, rel_path: str, timeout: int = 15) -> tuple[int, str]:
    """Fetch a rendered page from the PHP server. Returns (status_code, body)."""
    url = f"{base_url}/{rel_path}"
    try:
        resp = requests.get(url, timeout=timeout)
        return resp.status_code, resp.text
    except requests.RequestException as e:
        return 0, f"CONNECTION_ERROR: {e}"


def scan_html_for_latex_errors(html: str, source_label: str) -> list[dict]:
    """Scan rendered HTML for LaTeX ParseError patterns."""
    issues = []
    seen_messages = set()

    for pattern in LATEX_ERROR_PATTERNS:
        for match in pattern.finditer(html):
            full_match = match.group(0).strip()

            # Clean up HTML entities for display
            display_msg = full_match
            display_msg = display_msg.replace("&#x27;", "'")
            display_msg = display_msg.replace("&amp;", "&")
            display_msg = display_msg.replace("&lt;", "<")
            display_msg = display_msg.replace("&gt;", ">")
            display_msg = display_msg.replace("&quot;", '"')

            # Truncate very long matches
            if len(display_msg) > 200:
                display_msg = display_msg[:197] + "..."

            # Deduplicate
            dedup_key = display_msg[:80]
            if dedup_key in seen_messages:
                continue
            seen_messages.add(dedup_key)

            # Try to find approximate line number in HTML
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
# SOURCE FILE SCANNING (fallback / additional)
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

    # Look for strings containing LaTeX that have risky patterns
    # e.g., template literals with $$ ... $$ or \\text{} etc.
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

        # Check if this LaTeX string has risky patterns
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

CRITICAL_TYPES = {"latex_parse_error"}
WARNING_TYPES = {"latex_source_risk", "latex_js_risk"}
INFO_TYPES = {"latex_info", "server_error"}


def severity_style(issue_type: str) -> str:
    if issue_type in CRITICAL_TYPES:
        return "bold red"
    elif issue_type in WARNING_TYPES:
        return "bold yellow"
    return "bold blue"


def severity_icon(issue_type: str) -> str:
    if issue_type in CRITICAL_TYPES:
        return "❌"
    elif issue_type in WARNING_TYPES:
        return "⚠️"
    return "ℹ️"


# ============================================================
# MAIN
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="Scan PHP-served pages for LaTeX/KaTeX/Temml ParseError patterns"
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
        "--timeout", "-t", type=int, default=15,
        help="HTTP request timeout in seconds (default: 15)"
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
        "[bold bright_cyan]🔬 LaTeX ParseError Scanner[/]\n\n"
        "[dim]Starts a real PHP built-in web server, fetches every .php page,\n"
        "and scans the rendered HTML for LaTeX/KaTeX/Temml parse errors.[/]\n\n"
        "[dim]Detects:[/]\n"
        "  [bold red]❌[/] ParseError: Can't use function '...' in math mode\n"
        "  [bold red]❌[/] ParseError: Expected 'EOF', got '#' at position ...\n"
        "  [bold red]❌[/] Raw LaTeX commands leaking into rendered output\n"
        "  [bold red]❌[/] KaTeX / Temml / MathJax error elements in HTML\n"
        "  [bold yellow]⚠️[/]  Source patterns likely to cause parse errors\n\n"
        "[dim]Usage:[/]\n"
        "  [bold]uv run latex_error_checker.py[/]                     [dim]# serve . on :8089[/]\n"
        "  [bold]uv run latex_error_checker.py -d ./site -p 9000[/]   [dim]# custom root & port[/]\n"
        "  [bold]uv run latex_error_checker.py --no-serve[/]          [dim]# source scan only[/]\n"
        "  [bold]uv run latex_error_checker.py --keep-server[/]       [dim]# leave server up[/]",
        title="[bold bright_white]LaTeX Error Checker[/]",
        border_style="bright_cyan",
        padding=(1, 3),
    ))
    console.print()

    if not docroot.is_dir():
        console.print(f"[bold red]Document root not found:[/] {docroot}")
        sys.exit(1)

    # ── Discover files ──────────────────────────────────────
    php_files = find_php_files(docroot)
    js_files = find_js_files(docroot)

    console.print(f"[bold]Document root:[/] {docroot}")
    console.print(f"[bold]PHP files found:[/] {len(php_files)}")
    console.print(f"[bold]JS  files found:[/] {len(js_files)}")
    console.print()

    if not php_files and not js_files:
        console.print("[bold yellow]No PHP or JS files found.[/]")
        sys.exit(0)

    all_issues: list[tuple[str, list[dict]]] = []
    php_server_proc = None
    server_started = False

    # ── Phase 1: Start PHP server and scan rendered output ──
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
                # We fetch each .php file relative to docroot
                pages_to_check = []
                for pf in php_files:
                    try:
                        rel = pf.relative_to(docroot)
                        pages_to_check.append(str(rel))
                    except ValueError:
                        pass

                # Always check index.php / root
                if "index.php" not in pages_to_check:
                    pages_to_check.insert(0, "index.php")

                console.print(Rule(
                    title="[bold bright_cyan]Phase 1: Scanning Rendered HTML[/]",
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
                    task = progress.add_task("Fetching pages...", total=len(pages_to_check))

                    for page_path in pages_to_check:
                        progress.update(task, description=f"GET /{page_path}")

                        status, body = fetch_rendered_page(base_url, page_path, args.timeout)

                        page_issues = []

                        if status == 0:
                            page_issues.append({
                                "type": "server_error",
                                "line": 0,
                                "message": f"Connection error: {body}",
                                "source": page_path,
                            })
                        elif status >= 400:
                            page_issues.append({
                                "type": "server_error",
                                "line": 0,
                                "message": f"HTTP {status} response",
                                "source": page_path,
                            })
                        else:
                            # Scan the rendered HTML for LaTeX errors
                            page_issues = scan_html_for_latex_errors(body, page_path)

                        if page_issues:
                            all_issues.append((f"🌐 /{page_path} (rendered)", page_issues))

                        progress.advance(task)

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
        # Scan PHP sources
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
                # Also check for raw LaTeX error patterns in JS (e.g., error messages)
                js_issues += scan_html_for_latex_errors(content, str(filepath.name))
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
            "[bold bright_green]No LaTeX ParseError patterns found! 🎉[/]",
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

                if itype in CRITICAL_TYPES:
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
        "Yes" if server_started else "No",
        "[green]✓[/]" if server_started else "[dim]—[/]",
    )
    summary.add_row("", "", "")

    if total_errors > 0:
        summary.add_row("❌ LaTeX ParseErrors", f"[bold red]{total_errors}[/]", "[bold red]must fix[/]")
    else:
        summary.add_row("❌ LaTeX ParseErrors", "0", "[green]✓[/]")

    if total_warnings > 0:
        summary.add_row("⚠️  Risky patterns", f"[bold yellow]{total_warnings}[/]", "[bold yellow]review[/]")
    else:
        summary.add_row("⚠️  Risky patterns", "0", "[green]✓[/]")

    if total_info > 0:
        summary.add_row("ℹ️  Info", f"[bold blue]{total_info}[/]", "[bold blue]note[/]")
    else:
        summary.add_row("ℹ️  Info", "0", "[green]✓[/]")

    summary.add_row("", "", "")
    summary.add_row(
        "[bold]Total issues[/]",
        f"[bold]{total_all}[/]",
        "[bold green]🎉 PASS[/]" if total_all == 0 else f"[bold red]🚨 {total_all} issue(s)[/]",
    )

    console.print(summary)
    console.print()

    clean_files = (len(php_files) + len(js_files)) - files_with_issues
    if clean_files > 0 and files_with_issues > 0:
        console.print(f"  [dim]{clean_files} file(s) passed all checks without issues.[/]")
        console.print()

    # ── Keep server or shut down ────────────────────────────
    if php_server_proc:
        if args.keep_server:
            port = find_free_port(args.port)
            # Port was already resolved above; re-derive base_url
            base_url = f"http://127.0.0.1:{port}"
            console.print(Panel(
                f"[bold bright_green]PHP server still running at {base_url}[/]\n"
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
            f"[bold red]🚨 {total_errors} LaTeX ParseError(s) found — these are visible to users![/]",
            border_style="red",
            padding=(0, 2),
        ))
        sys.exit(1)
    elif total_warnings > 0:
        console.print(Panel(
            f"[bold bright_yellow]⚠️  No rendered errors, but {total_warnings} risky source pattern(s) found.[/]",
            border_style="yellow",
            padding=(0, 2),
        ))
        sys.exit(0)
    else:
        if total_all == 0:
            console.print(Panel(
                "[bold bright_green]All files passed LaTeX error checks! 🎉[/]",
                border_style="green",
                padding=(0, 2),
            ))
        sys.exit(0)


if __name__ == "__main__":
    main()
