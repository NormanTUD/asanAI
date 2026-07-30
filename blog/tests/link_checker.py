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

To reduce false positives from sites that work in a real browser but
block scripted access, each URL is checked with multiple strategies:

  1. Standard request with full Chrome-like headers, HTTP/2, strict SSL.
  2. If a TLS error occurred, retry with SSL verification disabled.
  3. If a 401/403 looks like bot protection (Cloudflare challenge,
     Varnish/PerimeterX, Akamai, etc.), the URL is reported as a
     "soft pass" — the resource likely exists, we just can't verify
     programmatically.
  4. Transient 5xx / 429 responses are retried once after a short delay.

All URLs are tested; ONLY failing and soft-passing entries are printed.
Exit code 1 if any *real* failures, 0 otherwise.

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
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
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

# Server header / cookie fragments that strongly indicate bot protection.
_BOT_PROTECTION_MARKERS = (
    "cf-mitigated",
    "challenge",
    "_pxhd",
    "x-pxhd",
    "perimeterx",
    "human-security",
    "akamai",
    "x-akamai",
    "imperva",
    "incapsula",
    "distil",
    "kasada",
    "datadome",
    "shape security",
)

_BOT_PROTECTION_BODY_MARKERS = (
    "captcha",
    "checking your browser",
    "attention required",
    "access denied",
    "please verify you are a human",
    "please enable javascript",
    "ddos protection",
    "bot detection",
    "just a moment",
    "ray id",
)

# HTTP status codes that are transient and worth retrying once.
RETRY_STATUSES = {408, 425, 429, 500, 502, 503, 504, 507}


# ============================================================
# literature.js parser
# ============================================================

ENTRY_START_RE = re.compile(r'^\s*"([^"]+)"\s*:\s*\{\s*$')
TITLE_RE = re.compile(r'^\s*title\s*:\s*"(.*?)"\s*,?\s*$')
ALT_TITLE_RE = re.compile(r'^\s*alternativetitle\s*:\s*"(.*?)"\s*,?\s*$')
URL_RE = re.compile(r'^\s*url\s*:\s*"([^"]+)"\s*,?\s*$')


def parse_literature_file(path: Path):
    """
    Two-pass parser. First collects every entry's title, then yields
    (key, title, url) for each url line it encounters. This way the order
    of `title:` vs `url:` inside an entry doesn't matter.
    """
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()

    titles_by_key: dict[str, str] = {}
    current_key = None
    saw_open_brace = False

    for line in lines:
        m = ENTRY_START_RE.match(line)
        if m:
            current_key = m.group(1)
            saw_open_brace = True
            continue

        if not saw_open_brace:
            continue

        tm = TITLE_RE.match(line)
        if tm:
            titles_by_key[current_key] = tm.group(1)
            continue

        am = ALT_TITLE_RE.match(line)
        if am and current_key is not None and current_key not in titles_by_key:
            titles_by_key[current_key] = am.group(1)
            continue

        if line.strip() == "}":
            current_key = None
            saw_open_brace = False

    current_key = None
    saw_open_brace = False

    for line in lines:
        m = ENTRY_START_RE.match(line)
        if m:
            current_key = m.group(1)
            saw_open_brace = True
            continue

        if not saw_open_brace:
            continue

        um = URL_RE.match(line)
        if um:
            url = um.group(1)
            title = titles_by_key.get(current_key, "") if current_key else ""
            yield (
                current_key or "<unknown>",
                title or current_key or "<no title>",
                url,
            )
            continue

        if line.strip() == "}":
            current_key = None
            saw_open_brace = False


# ============================================================
# URL check outcome + classifier
# ============================================================

@dataclass
class Outcome:
    """Result of checking a single URL."""
    category: str = "fail"        # "ok" | "soft_pass" | "fail"
    reason: str = ""              # human-readable
    status: int | None = None     # HTTP status code, if any
    note: str = ""                # extra detail (e.g. "ssl-bypass")
    server: str = ""              # value of the `server` header
    via: str = ""                 # value of the `via` header (proxies)
    set_cookies: tuple[str, ...] = field(default_factory=tuple)
    body_snippet: str = ""        # first ~200 chars of body for diagnosis

    @property
    def ok(self) -> bool:
        return self.category in ("ok", "soft_pass")

    @property
    def is_real_fail(self) -> bool:
        return self.category == "fail"

    def is_ssl_error(self) -> bool:
        r = self.reason.lower()
        return any(k in r for k in (
            "ssl", "certificate", "cert", "tls",
            "hostname mismatch", "unable to get local issuer",
        ))

    def shorten_reason(self, max_len: int = 200) -> str:
        r = self.reason.replace("\n", " ").strip()
        if len(r) > max_len:
            r = r[: max_len - 1] + "…"
        return r


def _looks_like_bot_protection(outcome: Outcome) -> bool:
    """Inspect headers + body snippet for bot-protection fingerprints."""
    if outcome.status not in (401, 403):
        return False

    blob_parts = [
        (outcome.server or "").lower(),
        (outcome.via or "").lower(),
        " ".join(outcome.set_cookies).lower(),
        (outcome.body_snippet or "").lower(),
    ]
    blob = "\n".join(blob_parts)

    if any(m in blob for m in _BOT_PROTECTION_MARKERS):
        return True
    if any(m in blob for m in _BOT_PROTECTION_BODY_MARKERS):
        return True
    # Cloudflare challenge pages usually set cf-mitigated but some
    # edge cases only emit cf-ray. Treat 403 behind cloudflare as bot-protected.
    if "server: cloudflare" in blob or "cloudflare" in (outcome.server or "").lower():
        return True
    return False


# ============================================================
# URL checker
# ============================================================

def looks_like_pdf(url: str) -> bool:
    return urlparse(url).path.lower().endswith(".pdf")


def _record_response(outcome: Outcome, resp: "httpx.Response") -> None:
    outcome.status = resp.status_code
    outcome.server = resp.headers.get("server", "")
    outcome.via = resp.headers.get("via", "")
    # raw headers list for set-cookie (which can repeat)
    set_cookies = resp.headers.get_list("set-cookie")
    outcome.set_cookies = tuple(c.split(";", 1)[0] for c in set_cookies)


def _fetch(client: "httpx.Client", url: str, sniff_pdf: bool) -> Outcome:
    """
    Single GET attempt. Returns an Outcome with status, headers, body
    snippet (or %PDF magic check for PDFs).
    """
    out = Outcome()
    try:
        req = client.build_request("GET", url)
        resp = client.send(req, stream=True)
    except httpx.HTTPError as e:
        out.reason = f"{type(e).__name__}: {e}"
        return out
    except Exception as e:  # noqa: BLE001
        out.reason = f"{type(e).__name__}: {e}"
        return out

    try:
        _record_response(out, resp)
        status = resp.status_code

        if status < 200 or status >= 300:
            out.reason = f"HTTP {status}"
            # Capture a small body snippet so the classifier can detect
            # bot challenge pages instead of real 4xx bodies.
            try:
                buf = bytearray()
                for chunk in resp.iter_bytes(chunk_size=2048):
                    buf.extend(chunk)
                    if len(buf) >= 2048:
                        break
                peek = bytes(buf)
            except httpx.HTTPError:
                peek = b""
            if peek:
                out.body_snippet = peek[:200].decode("utf-8", errors="replace")
            return out

        if not sniff_pdf:
            out.category = "ok"
            return out

        # PDF: sniff first few KB for the %PDF magic header
        try:
            buf = bytearray()
            for chunk in resp.iter_bytes(chunk_size=PDF_SNIFF_BYTES):
                buf.extend(chunk)
                if len(buf) >= PDF_SNIFF_BYTES:
                    break
            head = bytes(buf)
        except httpx.HTTPError as e:
            out.reason = f"body read failed: {type(e).__name__}: {e}"
            return out

        if not head.lstrip().startswith(PDF_MAGIC):
            ctype = resp.headers.get("content-type", "?")
            preview = head[:32].decode("latin-1", errors="replace")
            out.reason = (
                f"HTTP {status} but body is not a PDF "
                f"(content-type={ctype!r}, head={preview!r})"
            )
            return out

        out.category = "ok"
        return out
    finally:
        resp.close()


def check_url(strict_client: "httpx.Client",
              relaxed_client: "httpx.Client",
              url: str) -> Outcome:
    """
    Multi-strategy check. Returns an Outcome; never raises.
    """
    is_pdf = looks_like_pdf(url)

    # ── Strategy 1: strict SSL, full browser headers ──────────
    out = _fetch(strict_client, url, is_pdf)

    if out.category == "ok":
        return out

    # ── Strategy 2: SSL bypass if we hit a TLS error ──────────
    if out.is_ssl_error():
        relaxed = _fetch(relaxed_client, url, is_pdf)
        if relaxed.category == "ok":
            relaxed.category = "soft_pass"
            relaxed.reason = "ssl-bypass"
            relaxed.note = out.shorten_reason(160)
            return relaxed
        # Relaxed also failed — return that (it usually has a clearer reason)
        return relaxed

    # ── Strategy 3: detect bot protection on 401/403 ──────────
    if _looks_like_bot_protection(out):
        out.category = "soft_pass"
        out.reason = "bot-protection"
        out.note = (
            f"server={out.server or '?'}, status={out.status}"
        )
        return out

    # ── Strategy 4: transient errors → one retry ──────────────
    if out.status in RETRY_STATUSES:
        time.sleep(2.0)
        retry = _fetch(strict_client, url, is_pdf)
        if retry.category == "ok":
            return retry
        # If retry still 4xx/5xx we want to keep the original "transient"
        # framing so the report makes sense.
        if retry.status in RETRY_STATUSES:
            retry.note = f"after-retry: {retry.reason}"
            return retry
        return retry

    return out


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
    ap.add_argument("--no-color", action="store_true",
                    help="Disable ANSI colors in output (useful for CI logs)")
    args = ap.parse_args()

    if args.no_color:
        # Standard "no color" env vars; respected by rich and most libraries.
        os.environ.setdefault("NO_COLOR", "1")
        os.environ.setdefault("FORCE_COLOR", "0")
        # Rebuild the global console without ANSI escapes so subsequent
        # Progress / Tree / Table objects also render plain.
        global console
        console = Console(no_color=True, force_terminal=False, highlight=False)

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
    base_headers = {
        "User-Agent": USER_AGENT,
        # Chrome-like Accept so anti-bot middleware doesn't downgrade us
        "Accept": ("text/html,application/xhtml+xml,application/xml;q=0.9,"
                   "image/avif,image/webp,image/apng,*/*;q=0.8,"
                   "application/signed-exchange;v=b3;q=0.7"),
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "sec-ch-ua": '"Chromium";v="127", "Not(A:Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Linux"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
    }

    outcomes: dict[str, Outcome] = {}
    passed = 0
    soft_passed = 0

    def make_client(verify_ssl: bool) -> "httpx.Client":
        return httpx.Client(
            follow_redirects=True,
            timeout=timeout,
            limits=limits,
            headers=base_headers,
            http2=True,
            verify=verify_ssl,
        )

    with make_client(verify_ssl=True) as strict_client, \
         make_client(verify_ssl=False) as relaxed_client:
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
                    pool.submit(check_url, strict_client, relaxed_client, url): url
                    for url in unique_urls
                }

                done = 0
                for fut in as_completed(futures):
                    url = futures[fut]
                    done += 1
                    try:
                        out = fut.result()
                    except Exception as e:  # noqa: BLE001
                        out = Outcome(category="fail",
                                      reason=f"{type(e).__name__}: {e}")

                    outcomes[url] = out
                    tag = {"ok": "OK", "soft_pass": "SOFT",
                           "fail": "FAIL"}.get(out.category, "?")
                    progress.update(
                        task,
                        advance=1,
                        status=f"({done}/{len(unique_urls)}) {tag}",
                    )

    # Tally results
    for out in outcomes.values():
        if out.category == "ok":
            passed += 1
        elif out.category == "soft_pass":
            soft_passed += 1

    failures = [(u, outcomes[u], by_url[u])
                for u in unique_urls
                if outcomes[u].category == "fail"]
    soft_passes = [(u, outcomes[u], by_url[u])
                   for u in unique_urls
                   if outcomes[u].category == "soft_pass"]

    # ── Results ───────────────────────────────────────────────
    console.print()
    console.print(Rule(title="[bold bright_cyan]Results[/]", style="bright_blue"))
    console.print()

    real_failures_present = bool(failures) or bool(malformed)

    if soft_passes:
        console.print(Rule(title="[bold yellow]Soft passes "
                              "(worked around bot protection / SSL quirks)",
                              style="yellow"))
        console.print()
        for url, outcome, occurrences in soft_passes:
            _print_soft_pass(console, url, outcome, occurrences)
        console.print()

    if failures:
        console.print(Rule(title="[bold red]Failures "
                                 "(real broken URLs)",
                              style="red"))
        console.print()
        for url, outcome, occurrences in failures:
            _print_failure(console, url, outcome, occurrences)
        console.print()

    if malformed:
        console.print(Rule(title="[bold red]Malformed URLs",
                              style="red"))
        console.print()
        for key, title, url, reason in malformed:
            _print_malformed(console, key, title, url, reason)
        console.print()

    _print_summary(
        total_unique=len(unique_urls),
        passed=passed,
        soft=soft_passed,
        failures=len(failures),
        malformed=len(malformed),
        total_entries=len(entries),
    )

    if real_failures_present:
        sys.exit(1)

    if not failures and not malformed and not soft_passes:
        console.print(Panel(
            f"[bold bright_green]"
            f"All {len(unique_urls)} unique URLs ({len(entries)} entries) are valid! 🎉"
            f"[/]",
            border_style="green",
            padding=(0, 2),
        ))
    sys.exit(0)


def _print_failure(console, url, outcome: Outcome, occurrences):
    keys = ", ".join(k for k, _ in occurrences)
    first_title = next((t for _, t in occurrences if t and t != "<no title>"), "")
    pdf_marker = " [yellow]\u26a0 pdf[/]" if looks_like_pdf(url) else ""
    tree = Tree(f"[bold red]\u2717 {url}[/]  [dim]({len(occurrences)} entr"
                f"{'y' if len(occurrences) == 1 else 'ies'}){pdf_marker}[/]")
    tree.add(f"[red]{outcome.shorten_reason()}[/]")
    if outcome.note:
        tree.add(f"[dim]{outcome.note}[/]")
    if outcome.server:
        tree.add(f"[dim]server:[/] {outcome.server}")
    if first_title:
        tree.add(f"[dim]title:[/] {first_title}")
    tree.add(f"[dim]key(s):[/] {keys}")
    console.print(tree)
    console.print()


def _print_soft_pass(console, url, outcome: Outcome, occurrences):
    keys = ", ".join(k for k, _ in occurrences)
    first_title = next((t for _, t in occurrences if t and t != "<no title>"), "")
    pdf_marker = " [yellow]\u26a0 pdf[/]" if looks_like_pdf(url) else ""
    tree = Tree(f"[bold yellow]\u26a0 {url}[/]  [dim]({len(occurrences)} entr"
                f"{'y' if len(occurrences) == 1 else 'ies'}, "
                f"soft pass{pdf_marker})[/]")
    tree.add(f"[yellow]worked around:[/] {outcome.shorten_reason()}")
    if outcome.note:
        tree.add(f"[dim]{outcome.note}[/]")
    if outcome.server:
        tree.add(f"[dim]server:[/] {outcome.server}")
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


def _print_summary(total_unique, passed, soft, failures, malformed, total_entries):
    console.print(Rule(title="[bold bright_cyan]Summary[/]", style="bright_blue"))
    console.print()
    table = Table(
        box=box.ROUNDED,
        border_style="bright_blue",
        header_style="bold white",
        padding=(0, 2),
    )
    table.add_column("Metric", style="bold")
    table.add_column("Count", justify="right")
    table.add_column("Status", justify="center")

    table.add_row("Total entries", str(total_entries), "📄")
    table.add_row("Unique URLs", str(total_unique), "🔗")
    table.add_row("Passed", str(passed), "[bold green]✓[/]")
    table.add_row("Soft passes (bot protection / SSL)",
                  f"[bold yellow]{soft}[/]",
                  "[yellow]warn[/]" if soft else "[green]✓[/]")
    table.add_row("Real failures (HTTP / PDF)",
                  f"[bold red]{failures}[/]",
                  "[bold red]fix[/]" if failures else "[green]✓[/]")
    table.add_row("Malformed URLs",
                  f"[bold red]{malformed}[/]",
                  "[bold red]fix[/]" if malformed else "[green]✓[/]")
    table.add_row("", "", "")
    table.add_row(
        "[bold]Total real problems[/]",
        f"[bold red]{failures + malformed}[/]",
        "[bold red]🚨 FAIL[/]" if (failures + malformed) else "[bold green]🎉 PASS[/]",
    )

    console.print(table)
    console.print()


if __name__ == "__main__":
    main()
