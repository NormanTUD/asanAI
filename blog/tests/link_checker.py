#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "rich",
#   "httpx[http2]",
# ]
# ///

"""
link_checker.py — Validate every URL in blog/literature.js.

For each entry with a `url:` field:
  * Fetch the URL (GET, follows redirects, browser-like User-Agent).
  * Pass only if HTTP status is 2xx.
  * For URLs ending in .pdf, also verify the body starts with %PDF.

All URLs are tested; ONLY the failing ones are printed.
Exit code 1 if any failures, 0 otherwise.

Usage:
  uv run link_checker.py blog/literature.js
  uv run link_checker.py blog/                 # auto-resolves to blog/literature.js
  uv run link_checker.py --file blog/literature.js
  uv run link_checker.py --limit 5 blog/literature.js   # smoke test
"""

import argparse
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse

try:
    from datetime import UTC
except ImportError:
    from datetime import timezone
    UTC = timezone.utc


# ============================================================
# UV BOOTSTRAPPING (same pattern as the other blog validators)
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


ensure_safe_env()

# ============================================================
# Now safe to import everything
# ============================================================

import httpx
from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.progress import (
    BarColumn,
    MofNCompleteColumn,
    Progress,
    SpinnerColumn,
    TextColumn,
    TimeElapsedColumn,
)
from rich.rule import Rule
from rich.table import Table
from rich.tree import Tree


console = Console()

PDF_MAGIC = b"%PDF"
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
)

# Per-request sniff budget for PDFs — small enough not to slurp 30MB papers,
# large enough to span any leading whitespace the server prepends.
PDF_SNIFF_BYTES = 4096


# ============================================================
# literature.js parser
# ============================================================

ENTRY_START_RE = re.compile(r'^\s*"([^"]+)"\s*:\s*\{\s*$')
TITLE_RE = re.compile(r'^\s*title\s*:\s*"(.*?)"\s*,?\s*$')
URL_RE = re.compile(r'^\s*url\s*:\s*"([^"]+)"\s*,?\s*$')


def parse_literature_file(path: Path):
    """
    Walk a literature.js-style file and yield (key, title, url) for each
    entry that has a `url:` field. Robust against field order, whitespace,
    and quoted/unquoted keys.
    """
    text = path.read_text(encoding="utf-8", errors="replace")
    current_key = None
    current_title = None
    saw_open_brace = False

    for raw_line in text.splitlines():
        line = raw_line

        m = ENTRY_START_RE.match(line)
        if m:
            current_key = m.group(1)
            current_title = None
            saw_open_brace = True
            continue

        if not saw_open_brace:
            continue

        tm = TITLE_RE.match(line)
        if tm:
            current_title = tm.group(1)
            continue

        um = URL_RE.match(line)
        if um:
            url = um.group(1)
            yield (
                current_key or "<unknown>",
                current_title or current_key or "<no title>",
                url,
            )
            continue

        if line.strip() == "}":
            current_key = None
            current_title = None
            saw_open_brace = False


# ============================================================
# URL checker
# ============================================================

def looks_like_pdf(url: str) -> bool:
    path = urlparse(url).path.lower()
    return path.endswith(".pdf")


def check_url(client: "httpx.Client", url: str) -> tuple[bool, str]:
    """
    Returns (ok, reason). reason is empty when ok=True.
    """
    is_pdf = looks_like_pdf(url)

    try:
        req = client.build_request("GET", url)
        resp = client.send(req, stream=True)
    except httpx.HTTPError as e:
        return False, f"{type(e).__name__}: {e}"
    except Exception as e:
        return False, f"{type(e).__name__}: {e}"

    try:
        status = resp.status_code
        if status < 200 or status >= 300:
            return False, f"HTTP {status}"

        if not is_pdf:
            return True, ""

        # PDF: sniff first few KB for the %PDF magic header
        try:
            buf = bytearray()
            for chunk in resp.iter_bytes(chunk_size=PDF_SNIFF_BYTES):
                buf.extend(chunk)
                if len(buf) >= PDF_SNIFF_BYTES:
                    break
            head = bytes(buf)
        except httpx.HTTPError as e:
            return False, f"body read failed: {type(e).__name__}: {e}"

        if not head.lstrip().startswith(PDF_MAGIC):
            ctype = resp.headers.get("content-type", "?")
            preview = head[:32].decode("latin-1", errors="replace")
            return False, (
                f"HTTP {status} but body is not a PDF "
                f"(content-type={ctype!r}, head={preview!r})"
            )

        return True, ""
    finally:
        resp.close()


# ============================================================
# Main
# ============================================================

def resolve_lit_path(args) -> Path:
    if args.file:
        p = Path(args.file)
    else:
        raw = Path(args.input)
        if raw.is_dir():
            p = raw / "literature.js"
        else:
            p = raw
    return p.resolve()


def main():
    ap = argparse.ArgumentParser(
        description="Validate every URL in blog/literature.js.",
    )
    ap.add_argument(
        "input",
        nargs="?",
        default="blog",
        help="Path to literature.js, or a directory that contains it "
             "(default: ./blog)",
    )
    ap.add_argument("--file", help="Explicit path to literature.js")
    ap.add_argument("--timeout", type=float, default=20.0,
                    help="Per-request timeout in seconds (default: 20)")
    ap.add_argument("--workers", type=int, default=10,
                    help="Number of concurrent HTTP workers (default: 10)")
    ap.add_argument("--limit", type=int, default=0,
                    help="Only check the first N unique URLs (debug aid)")
    args = ap.parse_args()

    lit_path = resolve_lit_path(args)
    if not lit_path.exists():
        console.print(f"[bold red]File not found:[/] {lit_path}")
        sys.exit(2)

    console.print(f"[bold]Source:[/]  {lit_path}")
    entries = list(parse_literature_file(lit_path))
    if args.limit:
        entries = entries[: args.limit]
    console.print(f"[bold]Entries:[/] {len(entries)}  [bold]File size:[/] "
                  f"{lit_path.stat().st_size / 1024:.1f} KB")
    console.print()

    if not entries:
        console.print("[bold yellow]No URLs found — nothing to check.[/]")
        sys.exit(0)

    # Group entries by URL — many keys can reference the same URL.
    by_url: dict[str, list[tuple[str, str]]] = {}
    malformed = []
    for key, title, url in entries:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            malformed.append((key, title, url, f"bad scheme {parsed.scheme!r}"))
            continue
        by_url.setdefault(url, []).append((key, title))

    unique_urls = list(by_url.keys())

    console.print(f"[bold]Unique URLs:[/]  {len(unique_urls)}")
    console.print(f"[bold]Workers:[/]     {args.workers}")
    console.print(f"[bold]Timeout:[/]     {args.timeout}s per request")
    console.print()

    limits = httpx.Limits(
        max_connections=args.workers,
        max_keepalive_connections=args.workers,
    )
    timeout = httpx.Timeout(args.timeout, connect=args.timeout)
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
    }

    failures: list[tuple[str, str, list[tuple[str, str]]]] = []
    passed = 0

    with httpx.Client(
        follow_redirects=True,
        timeout=timeout,
        limits=limits,
        headers=headers,
        http2=True,
    ) as client:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            MofNCompleteColumn(),
            TimeElapsedColumn(),
            TextColumn("{task.fields[status]}"),
            console=console,
            transient=False,
        ) as progress:
            task = progress.add_task(
                "Checking URLs…",
                total=len(unique_urls),
                status="",
            )

            with ThreadPoolExecutor(max_workers=args.workers) as pool:
                futures = {
                    pool.submit(check_url, client, url): url
                    for url in unique_urls
                }

                done = 0
                for fut in as_completed(futures):
                    url = futures[fut]
                    done += 1
                    try:
                        ok, reason = fut.result()
                    except Exception as e:  # noqa: BLE001
                        ok, reason = False, f"{type(e).__name__}: {e}"

                    progress.update(
                        task,
                        advance=1,
                        status=f"({done}/{len(unique_urls)}) "
                               f"{'OK' if ok else 'FAIL'}",
                    )
                    if ok:
                        passed += 1
                    else:
                        failures.append((url, reason, by_url[url]))

    # ── Results ───────────────────────────────────────────────
    console.print()
    console.print(Rule(title="[bold bright_cyan]Results[/]", style="bright_blue"))
    console.print()

    if failures or malformed:
        for url, reason, occurrences in failures:
            _print_failure(console, url, reason, occurrences)

        for key, title, url, reason in malformed:
            _print_malformed(console, key, title, url, reason)

        _print_summary(
            total_unique=len(unique_urls),
            passed=passed,
            failures=len(failures),
            malformed=len(malformed),
            total_entries=len(entries),
        )
        sys.exit(1)
    else:
        console.print(Panel(
            f"[bold bright_green]"
            f"All {len(unique_urls)} unique URLs ({len(entries)} entries) are valid! 🎉"
            f"[/]",
            border_style="green",
            padding=(0, 2),
        ))
        sys.exit(0)


def _print_failure(console, url, reason, occurrences):
    keys = ", ".join(k for k, _ in occurrences)
    first_title = next((t for _, t in occurrences if t and t != "<no title>"), "")
    pdf_marker = " [yellow]\u26a0 pdf[/]" if looks_like_pdf(url) else ""
    tree = Tree(f"[bold red]\u2717 {url}[/]  [dim]({len(occurrences)} entr"
                f"{'y' if len(occurrences) == 1 else 'ies'}){pdf_marker}[/]")
    tree.add(f"[red]{reason}[/]")
    if first_title:
        tree.add(f"[dim]title:[/] {first_title}")
    tree.add(f"[dim]key(s):[/] {keys}")
    console.print(tree)
    console.print()


def _print_malformed(console, key, title, url, reason):
    tree = Tree(f"[bold red]\u2717 {url}[/]  [dim](malformed)[/]")
    tree.add(f"[red]{reason}[/]")
    if title and title != "<no title>":
        tree.add(f"[dim]title:[/] {title}")
    tree.add(f"[dim]key:[/] {key}")
    console.print(tree)
    console.print()


def _print_summary(total_unique, passed, failures, malformed, total_entries):
    console.print(Rule(title="[bold bright_cyan]Summary[/]", style="bright_blue"))
    console.print()
    table = Table(
        box=box.ROUNDED,
        border_style="bright_red",
        header_style="bold white",
        padding=(0, 2),
    )
    table.add_column("Metric", style="bold")
    table.add_column("Count", justify="right")
    table.add_column("Status", justify="center")

    table.add_row("Total entries", str(total_entries), "📄")
    table.add_row("Unique URLs", str(total_unique), "🔗")
    table.add_row("Passed", str(passed), "[bold green]✓[/]")
    table.add_row("Failed (HTTP/PDF)",
                  f"[bold red]{failures}[/]",
                  "[bold red]fix[/]" if failures else "[green]✓[/]")
    table.add_row("Malformed URLs",
                  f"[bold red]{malformed}[/]",
                  "[bold red]fix[/]" if malformed else "[green]✓[/]")
    table.add_row("", "", "")
    table.add_row(
        "[bold]Total problems[/]",
        f"[bold red]{failures + malformed}[/]",
        "[bold red]🚨 FAIL[/]" if (failures + malformed) else "[bold green]🎉 PASS[/]",
    )

    console.print(table)
    console.print()


if __name__ == "__main__":
    main()
