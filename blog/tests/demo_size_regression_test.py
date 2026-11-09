#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "playwright>=1.40",
#     "rich>=13.0",
# ]
# ///
"""Exercise every lesson page and its demos; fail on size/layout escapes.

The check is deliberately about the annoying failure mode: a demo opens or a
control changes a value, and a plot/canvas/content box grows past the reading
column or changes its width unexpectedly. Height changes are allowed for
collapsible content; width escapes and horizontal scrollers wider than their
container are not.

Run from the repository root:
    uv run blog/tests/demo_size_regression_test.py
    uv run blog/tests/demo_size_regression_test.py --quick
    uv run blog/tests/demo_size_regression_test.py --only transformer.php
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import socket
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright
from rich.console import Console, Group
from rich.live import Live
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"
SKIP = {"index", "index_full", "functions", "asanai_blog_proxy", "graph", "intro"}
DEMO_SELECTOR = (
    ".plot-container, .js-plotly-plot, canvas, .demo, .viz-container, "
    ".mtl-panel, .tm-step, .tm-layer-card, .tm-triple-math, .tm-feature-arrows, "
    ".tm-residual-triple, .tm-layer-subbox, .mn-quiz"
)
EXCEPTIONS_FILE = Path(__file__).with_name("demo_size_exceptions.json")
CASES: list[tuple[str, bool, str]] = []
CONSOLE = Console()
UI: "RunnerUI | None" = None


class RunnerUI:
    """A Rich live table of pages, current action and failures."""

    def __init__(self, pages: list[Path]) -> None:
        self.state: dict[str, dict] = {
            p.name: {"status": "queued", "checks": 0, "action": "", "color": "dim"}
            for p in pages
        }
        self.failures: list[tuple[str, str, str]] = []
        self.done = 0
        self.total = len(pages)
        self.live: Live | None = None
        self.table = self.render_table()

    def render_table(self) -> Table:
        table = Table(title=f"Demo size regression · {self.done}/{self.total} pages", expand=True)
        table.add_column("Page", style="cyan", no_wrap=True)
        table.add_column("Status", no_wrap=True)
        table.add_column("Checks", justify="right", no_wrap=True)
        table.add_column("Current action / last failure", overflow="fold")
        for page, st in self.state.items():
            table.add_row(
                page,
                Text(st["status"], style=st["color"]),
                str(st["checks"]),
                Text(st["action"][:180])
            )
        return table

    def update(self) -> None:
        self.table = self.render_table()
        if self.live:
            self.live.update(self.table)

    def start(self, page: str) -> None:
        st = self.state[page]
        st.update(status="running", checks=0, action="loading page…", color="bold yellow")
        self.update()

    def action(self, page: str, text: str) -> None:
        self.state[page]["action"] = text
        self.update()

    def record(self, name: str, ok: bool, detail: str) -> None:
        page = name.split(":", 1)[0]
        if page not in self.state:
            page = next((p for p in self.state if name.startswith(p)), page)
        if page not in self.state:
            return
        st = self.state[page]
        st["checks"] += 1
        if ok:
            st.update(status="ok", action="check passed", color="green")
        else:
            self.failures.append((page, name, detail))
            st.update(status="FAIL", action=f"{name}: {detail}", color="bold red")
        self.update()

    def finish(self, page: str, failed: bool) -> None:
        self.done += 1
        st = self.state[page]
        st.update(
            status="FAIL" if failed else "done",
            color="bold red" if failed else "green",
            action=f"finished ({self.done}/{self.total})"
        )
        self.update()


def check(name: str, ok: bool, detail: str = "") -> None:
    CASES.append((name, bool(ok), detail))
    if UI:
        UI.record(name, bool(ok), detail)
    else:
        print(("  PASS  " if ok else "  FAIL  ") + name + (f" — {detail}" if detail and not ok else ""))


def lessons() -> list[Path]:
    out = []
    for path in sorted(BLOG.glob("*.php")):
        if path.stem in SKIP:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        if "COURSE_METADATA:" in text:
            out.append(path)
    return out


def changed_lessons() -> list[Path]:
    """Changed lesson pages. Shared assets mean every page is a candidate."""
    root = ROOT
    try:
        changed = subprocess.check_output(
            ["git", "diff", "--name-only", "--diff-filter=ACMRT", "HEAD", "--", "blog"],
            cwd=root, text=True, stderr=subprocess.DEVNULL
        ).splitlines()
        changed += subprocess.check_output(
            ["git", "ls-files", "--others", "--exclude-standard", "--", "blog"],
            cwd=root, text=True, stderr=subprocess.DEVNULL
        ).splitlines()
    except Exception:
        return lessons()
    changed = [c for c in changed if c]
    page_names = {p.name for p in lessons()}
    selected = {Path(c).name for c in changed if Path(c).name in page_names}
    shared = any(
        Path(c).suffix in {".js", ".css", ".php"} and Path(c).name not in page_names
        for c in changed
    )
    if shared:
        return lessons()
    if selected:
        return [p for p in lessons() if p.name in selected]
    return lessons()


def load_exceptions() -> tuple[list[str], dict[str, list[str]]]:
    try:
        data = json.loads(EXCEPTIONS_FILE.read_text())
    except Exception:
        return [], {}
    glob = [e["selector"] for e in data.get("global", []) if e.get("selector")]
    pages = {
        name: [e["selector"] for e in entries if e.get("selector")]
        for name, entries in data.get("pages", {}).items()
    }
    return glob, pages


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def ensure_chromium() -> None:
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            browser.close()
            return
    except Exception:
        pass
    subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"],
                   stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)


def serve(port: int) -> subprocess.Popen:
    php = shutil.which("php")
    if php is None:
        print("ERROR: php is not on PATH", file=sys.stderr)
        raise SystemExit(1)
    return subprocess.Popen([php, "-S", f"127.0.0.1:{port}", "-t", str(BLOG)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def scroll_through(page) -> None:
    page.evaluate("""async () => {
        const step = Math.max(400, innerHeight * 0.7);
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
            scrollTo(0, y);
            await new Promise(r => setTimeout(r, 45));
        }
        scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 150));
    }""")


def open_details(page, limit: int) -> None:
    page.evaluate("""async (limit) => {
        const opts = [...document.querySelectorAll('.optional-header')].slice(0, limit);
        for (const h of opts) {
            h.click();
            await new Promise(r => setTimeout(r, 55));
        }
        const details = [...document.querySelectorAll('details')].filter(d => d.offsetParent !== null).slice(0, limit);
        for (const d of details) {
            d.open = true;
            d.dispatchEvent(new Event('toggle', {bubbles: true}));
            await new Promise(r => setTimeout(r, 45));
        }
        await new Promise(r => setTimeout(r, 250));
    }""", limit)


def demo_widths(page, exceptions: list[str]) -> list[dict]:
    return page.evaluate("""(args) => [...document.querySelectorAll(args.sel)].filter(e => {
        const r=e.getBoundingClientRect(); const cs=getComputedStyle(e);
        if (!(r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden')) return false;
        if (e.tagName === 'CANVAS' && (r.width < 80 || r.height < 40)) return false;
        return true;
    }).slice(0, 160).map((e, i) => {
        const r=e.getBoundingClientRect(); const p=e.parentElement;
        let path = e.tagName.toLowerCase();
        if (e.id) path += '#' + e.id;
        else if (e.className && typeof e.className === 'string') path += '.' + e.className.trim().split(/\\s+/).join('.');
        const exempt = args.exceptions.some(sel => { try { return e.matches(sel) || !!e.closest(sel); } catch (_) { return false; } }) || !!e.closest('[data-allow-resize]');
        return {i, tag:e.tagName, id:e.id||'', cls:(e.className||'').toString().slice(0,80),
                path, exempt, insideOpen: !!e.closest('details[open], .optional-content'),
                w:Math.round(r.width), h:Math.round(r.height), sw:e.scrollWidth, cw:e.clientWidth,
                parent:p?(p.tagName+'.'+(p.className||'')).slice(0,100):''};
    })""", {"sel": DEMO_SELECTOR, "exceptions": exceptions})


def exercise_controls(page, limit: int) -> list[str]:
    problems = []
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    controls = page.evaluate("""(limit) => {
        const out=[];
        for (const e of document.querySelectorAll('input[type=range], select')) {
            const r=e.getBoundingClientRect(); if (r.width<=0 || r.height<=0) continue;
            if (e.closest('.optional-content') && e.closest('.optional-content').offsetParent === null) continue;
            out.push({id:e.id||'', tag:e.tagName, kind:e.type||'select', min:e.min||'', max:e.max||'', value:e.value});
            if (out.length >= limit) break;
        }
        return out;
    }""", limit)
    for c in controls:
        try:
            if c["tag"] == "INPUT":
                vals = [c["min"], c["max"], c["value"]]
            else:
                vals = page.evaluate("""(id) => {
                    const e=document.getElementById(id); if(!e)return [];
                    return [...e.options].slice(0,5).map(o=>o.value);
                }""", c["id"])
            for v in vals:
                if v == "": continue
                page.evaluate("""(args) => {
                    const e=document.getElementById(args.id); if(!e)return;
                    e.value=args.v;
                    e.dispatchEvent(new Event('input',{bubbles:true}));
                    e.dispatchEvent(new Event('change',{bubbles:true}));
                }""", {"id": c["id"], "v": v})
                page.wait_for_timeout(55)
                overflow = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
                if overflow > 2:
                    problems.append(f"{c['tag']}#{c['id']} value {v}: page horizontal overflow {overflow}px")
        except Exception as e:
            problems.append(f"{c['tag']}#{c['id']}: {e}")
    if errors:
        problems.extend("console: " + e for e in errors[:3])
    return problems


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", action="append", default=[], help="page filename(s), e.g. transformer.php")
    ap.add_argument("--changed", action="store_true", help="only pages touched by the working tree (shared assets = all)")
    ap.add_argument("--all", action="store_true", help="all lesson pages (default unless --changed)")
    ap.add_argument("--quick", action="store_true", help="fewer details/controls per page")
    ap.add_argument("--timeout", type=int, default=45)
    args = ap.parse_args()
    source = lessons() if not args.changed else changed_lessons()
    pages = [p for p in source if not args.only or p.name in args.only]
    if not pages:
        print("No lesson pages found", file=sys.stderr)
        raise SystemExit(1)
    ensure_chromium()
    port = free_port()
    server = serve(port)
    detail_limit = 3 if args.quick else 8
    control_limit = 4 if args.quick else 14
    global_exceptions, page_exceptions = load_exceptions()
    global UI
    UI = RunnerUI(pages)
    live = Live(UI.table, console=CONSOLE, refresh_per_second=8, transient=False)
    live.start()
    UI.live = live
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=["--enable-precise-memory-info"])
            for path in pages:
                UI.start(path.name)
                page = browser.new_page(viewport={"width": 1400, "height": 1000})
                errors: list[str] = []
                page.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
                page.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
                try:
                    UI.action(path.name, "loading page…")
                    page.goto(f"http://127.0.0.1:{port}/{path.name}", wait_until="load", timeout=args.timeout * 1000)
                    try:
                        page.wait_for_function("() => document.documentElement.classList.contains('is-ready')", timeout=8000)
                    except Exception:
                        pass
                    UI.action(path.name, "scrolling through lazy sections…")
                    scroll_through(page)
                    page.wait_for_timeout(300)
                    UI.action(path.name, "measuring demo boxes…")
                    before = demo_widths(page, global_exceptions + page_exceptions.get(path.name, []))
                    UI.action(path.name, "opening optional boxes and details…")
                    open_details(page, detail_limit)
                    UI.action(path.name, "re-measuring after opening…")
                    after = demo_widths(page, global_exceptions + page_exceptions.get(path.name, []))
                    width_changes = []
                    height_changes = []
                    old = {d["i"]: d for d in before}
                    for d in after:
                        if d["i"] not in old:
                            continue
                        o = old[d["i"]]
                        if abs(d["w"] - o["w"]) > 3:
                            width_changes.append(f"{d['path']} {o['w']}→{d['w']}px")
                        if abs(d["h"] - o["h"]) > 8 and not d["exempt"] and not d["insideOpen"]:
                            height_changes.append(f"{d['path']} {o['h']}→{d['h']}px")
                    page_overflow = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
                    check(f"{path.name}: page has no horizontal overflow", page_overflow <= 2, f"{page_overflow}px")
                    guard = page.evaluate("() => window.__layoutGuardrailCheck ? window.__layoutGuardrailCheck() : null")
                    check(f"{path.name}: layout guardrail", guard is None or guard.get("ok", True),
                          str(guard)[:300] if guard else "")
                    bad = [d for d in after if d["sw"] > d["cw"] + 2 and d["cw"] > 0]
                    check(f"{path.name}: demos fit their boxes", not bad,
                          "; ".join(f"{d['path']} scrollWidth={d['sw']} clientWidth={d['cw']}" for d in bad[:3]) +
                          " — widen the container or add .lg-scroll; do not let the demo escape the reading column")
                    check(f"{path.name}: opening details keeps demo widths", not width_changes,
                          "; ".join(width_changes[:4]))
                    check(f"{path.name}: opening details only resizes known containers", not height_changes,
                          "; ".join(height_changes[:4]) +
                          " — add the selector to blog/tests/demo_size_exceptions.json or set data-allow-resize")
                    UI.action(path.name, "exercising controls…")
                    control_problems = exercise_controls(page, control_limit)
                    check(f"{path.name}: controls keep layout", not control_problems,
                          "; ".join(control_problems[:4]))
                    check(f"{path.name}: no page/console errors", not errors, "; ".join(errors[:4]))
                finally:
                    page.close()
                    failed = any(n.startswith(path.name + ":") and not ok for n, ok, _ in CASES)
                    UI.finish(path.name, failed)
            browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except Exception:
            server.kill()
    live.stop()
    failed = [c for c in CASES if not c[1]]
    CONSOLE.print(f"\n[bold]{len(CASES) - len(failed)}/{len(CASES)} checks passed[/bold]")
    if failed:
        CONSOLE.print("[bold red]FAILURES — actionable[/bold red]")
        for name, _, detail in failed:
            CONSOLE.print(Panel(
                Text(f"{detail}\n\nFix the selector/layout or add it to blog/tests/demo_size_exceptions.json with a reason; use data-allow-resize only when the resize is intentional.", style="white"),
                title=f"✗ {name}",
                border_style="red",
                expand=True
            ))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
