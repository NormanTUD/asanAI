#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["rich>=13.0"]
# ///
"""Run every blog check from one place, fastest and cheapest first.

The default local profile runs the static checks, then the fact ledger, then
rebuilds the semantic, RAG and Atlas indexes, and finally verifies freshness.
``--ci`` and ``--fast`` skip the builds and only run the smoke checks.
The runner stops at the first failing stage, so one failure fails everything.

Examples:
    uv run blog/tools/check_all.py
    python3 blog/tools/check_all.py --fast
    ./blog/tools/check_all.py --ci
    uv run blog/tools/check_all.py --full
    uv run blog/tools/check_all.py --list
    uv run blog/tools/check_all.py --render --render-mode changed
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path

_BOOTSTRAP_ENV = "ASANAI_CHECK_ALL_BOOTSTRAPPED"
if os.environ.get(_BOOTSTRAP_ENV) != "1":
    if os.environ.get("UV_RUN_RECURSION_DEPTH"):
        os.environ[_BOOTSTRAP_ENV] = "1"
    else:
        uv = shutil.which("uv")
        if uv is None:
            sys.stderr.write(
                "check_all.py needs uv to install its dependencies.\n"
                "Install it with: curl -LsSf https://astral.sh/uv/install.sh | sh\n"
            )
            raise SystemExit(127)
        env = dict(os.environ)
        env[_BOOTSTRAP_ENV] = "1"
        try:
            os.execvpe(
                uv,
                [uv, "run", "--script", str(Path(__file__).resolve()), *sys.argv[1:]],
                env,
            )
        except OSError as exc:
            sys.stderr.write(f"could not restart through uv: {exc}\n")
            raise SystemExit(127)

from rich.console import Console
from rich.panel import Panel
from rich.rule import Rule
from rich.table import Table
from rich.text import Text

ROOT = Path(__file__).resolve().parents[2]
BLOG = ROOT / "blog"


@dataclass(frozen=True)
class Command:
    argv: tuple[str, ...]
    cwd: Path = ROOT


@dataclass(frozen=True)
class Stage:
    name: str
    group: str
    commands: tuple[Command, ...]
    build_index: bool = False
    build_atlas: bool = False
    needs: tuple[str, ...] = ()


def uv(*args: str) -> Command:
    return Command(("uv", "run", *args))


def php(*args: str) -> Command:
    return Command(("php", *args))


def node(script: str) -> Command:
    return Command(("node", f"blog/tests/{script}"))


def atlas(*args: str) -> Command:
    return Command(("python3", *args), cwd=BLOG)


STAGES: tuple[Stage, ...] = (
    Stage(
        "php-validator",
        "static",
        (uv("blog/tests/php_validator.py", "blog/"),),
        needs=("uv",),
    ),
    Stage(
        "literature-duplicates",
        "static",
        (uv("blog/tests/literature_dup_keys.py", "blog/"),),
        needs=("uv",),
    ),
    Stage(
        "tenminutes-image-credits",
        "static",
        (uv("blog/tests/tenminutes_image_credits_test.py"),),
        needs=("uv",),
    ),
    Stage(
        "lesson-guards",
        "static",
        (uv("blog/tests/lesson_guard.py", "blog/"),),
        needs=("uv",),
    ),
    Stage(
        "course-order",
        "static",
        (uv("blog/tests/course_order_test.py", "blog/"),),
        needs=("uv",),
    ),
    Stage(
        "js-validator",
        "static",
        (uv("blog/tests/js_validator.py", "blog/"),),
        needs=("uv",),
    ),
    Stage(
        "fact-consistency",
        "static",
        (uv("blog/tests/fact_consistency_test.py"),),
        needs=("uv",),
    ),
    Stage(
        "fact-ledger-unit",
        "static",
        (uv("blog/tests/fact_ledger_test.py"),),
        needs=("uv",),
    ),
    Stage(
        "sentence-conflict-unit",
        "static",
        (uv("blog/tests/sentence_conflict_test.py"),),
        needs=("uv",),
    ),
    Stage(
        "analytics-test",
        "static",
        (php("blog/tests/analytics_test.php"),),
        needs=("php",),
    ),
    Stage(
        "search-test",
        "static",
        (php("blog/tests/search_test.php"),),
        needs=("php",),
    ),
    Stage(
        "node-topics",
        "unit",
        (node("topics_test.js"),),
        needs=("node",),
    ),
    Stage(
        "node-math-alt",
        "unit",
        (node("math_alt_test.js"),),
        needs=("node",),
    ),
    Stage(
        "node-keypoint",
        "unit",
        (node("keypoint_test.js"),),
        needs=("node",),
    ),
    Stage(
        "node-search",
        "unit",
        (node("search_js_test.js"),),
        needs=("node",),
    ),
    Stage(
        "node-semantic",
        "unit",
        (node("semantic_js_test.js"),),
        needs=("node",),
    ),
    Stage(
        "node-rag-chat",
        "unit",
        (node("rag_chat_test.js"),),
        needs=("node",),
    ),
    Stage(
        "node-math-integrity",
        "unit",
        (node("math_integrity_test.js"),),
        needs=("node",),
    ),
    Stage(
        "node-youtube",
        "unit",
        (node("youtube_test.js"),),
        needs=("node",),
    ),
    Stage(
        "statement-ledger",
        "ledger",
        (uv("blog/tools/factcheck/extract_statements.py", "blog/", "--check"),),
        needs=("uv",),
    ),
    Stage(
        "fact-ledger",
        "ledger",
        (
            uv(
                "blog/tools/factcheck/check_facts.py",
                "blog/",
                "--strict-relations",
                "--strict-quotes",
                "--require-claims",
            ),
        ),
        needs=("uv",),
    ),
    Stage(
        "content-claims",
        "ledger",
        (uv("blog/tests/content_claims_test.py"),),
        needs=("uv",),
    ),
    Stage(
        "sentence-conflicts",
        "ledger",
        (
            uv(
                "blog/tools/factcheck/check_sentence_conflicts.py",
                "blog/",
                "--strict",
            ),
        ),
        needs=("uv",),
    ),
    Stage(
        "deep-audit",
        "ledger",
        (uv("blog/tools/factcheck/deep_audit.py", "blog/", "--strict"),),
        needs=("uv",),
    ),
    Stage(
        "build-semantic-index",
        "build",
        (uv("blog/tools/build_semantic_index.py"),),
        build_index=True,
        needs=("uv",),
    ),
    Stage(
        "build-rag-index",
        "build",
        (uv("blog/tools/build_rag_index.py"),),
        build_index=True,
        needs=("uv",),
    ),
    Stage(
        "build-atlas",
        "build",
        (
            atlas("atlas_data/atlas_parse_bib.py", "literature.js"),
            atlas("atlas_data/atlas_merge.py", "--merge", "raw/"),
            atlas("atlas_data/atlas_threads.py", "--build", "entities.json"),
        ),
        build_atlas=True,
        needs=("python3",),
    ),
    Stage(
        "semantic-index-freshness",
        "verify",
        (uv("blog/tests/semantic_index_test.py"),),
        needs=("uv",),
    ),
    Stage(
        "rag-index-freshness",
        "verify",
        (uv("blog/tests/rag_index_test.py"),),
        needs=("uv",),
    ),
    Stage(
        "rag-incremental",
        "verify",
        (uv("blog/tests/rag_incremental_test.py"),),
        needs=("uv",),
    ),
    Stage(
        "rag-server",
        "verify",
        (uv("blog/tests/rag_server_test.py"),),
        needs=("uv",),
    ),
    Stage(
        "atlas-check",
        "verify",
        (atlas("atlas_data/atlas_check.py"),),
        needs=("python3",),
    ),
)


def changed_lessons() -> list[str]:
    """Return render-validator page arguments for lessons changed since HEAD."""
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", "HEAD", "--", "blog"],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
    except FileNotFoundError:
        return []
    pages: list[str] = []
    for line in result.stdout.splitlines():
        path = ROOT / line
        if path.suffix != ".php" or path.parent != BLOG:
            continue
        try:
            source = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        if "COURSE_METADATA:" in source:
            pages.append(f"/{path.stem}.php")
    return pages


def render_stage(mode: str) -> Stage | None:
    if mode == "off":
        return None
    if mode == "all":
        commands = (
            uv(
                "blog/tests/php_render_validator.py",
                "blog/",
                "--all-lessons",
                "--check-math",
            ),
        )
    elif mode == "index":
        commands = (
            uv(
                "blog/tests/php_render_validator.py",
                "blog/",
                "--pages",
                "/index.php",
                "--check-math",
            ),
        )
    else:
        pages = changed_lessons()
        if not pages:
            return None
        commands = (
            uv(
                "blog/tests/php_render_validator.py",
                "blog/",
                "--pages",
                *pages,
                "--check-math",
            ),
        )
    commands = commands + (
        uv("blog/tests/sideimage_layout_test.py"),
    )
    return Stage("render", "optional", commands, needs=("uv",))


def optional_stage(name: str, commands: tuple[Command, ...]) -> Stage:
    return Stage(name, "optional", commands, needs=("uv",))


def parse_patterns(value: str | None) -> tuple[str, ...]:
    if not value:
        return ()
    return tuple(item.strip().lower() for item in value.split(",") if item.strip())


def selected_stages(args: argparse.Namespace, console: Console) -> list[Stage]:
    only = parse_patterns(args.only)
    skip = parse_patterns(args.skip)

    if args.full and not (args.ci or args.fast):
        args.render = True
        args.typos = True

    if only:
        if any("render" in pattern for pattern in only):
            args.render = True
        if any("links" in pattern for pattern in only):
            args.links = True
        if any("typos" in pattern for pattern in only):
            args.typos = True

    smoke = args.ci or args.fast
    build_indexes = False if smoke else (args.build_indexes is not False)
    build_atlas = False if smoke else (args.build_atlas is not False)
    if args.build_indexes is not None:
        build_indexes = args.build_indexes
    if args.build_atlas is not None:
        build_atlas = args.build_atlas

    stages: list[Stage] = []
    for stage in STAGES:
        if stage.build_index and not build_indexes:
            continue
        if stage.build_atlas and not build_atlas:
            continue
        if stage.group == "unit" and args.no_node:
            continue
        stages.append(stage)

    if args.render:
        stage = render_stage(args.render_mode)
        if stage is not None:
            stages.append(stage)
        else:
            console.print(
                "[yellow]render: no changed lesson pages; use "
                "--render-mode index or --render-mode all[/]"
            )
    if args.links:
        stages.append(
            optional_stage(
                "links",
                (uv("blog/tests/link_checker.py", "blog/", "--no-color"),),
            )
        )
    if args.typos:
        stages.append(
            optional_stage(
                "typos",
                (uv("blog/tests/typo_checker.py", "blog/"),),
            )
        )

    groups = {stage.group for stage in stages}

    def matches(stage: Stage, pattern: str) -> bool:
        if pattern in groups:
            return stage.group == pattern
        return pattern in stage.name.lower()

    if only:
        stages = [stage for stage in stages if any(matches(stage, pattern) for pattern in only)]
    if skip:
        stages = [stage for stage in stages if not any(matches(stage, pattern) for pattern in skip)]
    return stages


def print_stage_list(console: Console) -> None:
    table = Table(title="blog check stages", header_style="bold")
    table.add_column("stage")
    table.add_column("group")
    table.add_column("build")
    table.add_column("needs")
    for stage in STAGES:
        build = "index" if stage.build_index else "atlas" if stage.build_atlas else ""
        table.add_row(stage.name, stage.group, build, ", ".join(stage.needs))
    console.print(table)
    console.print(
        "[dim]optional stages: render (--render), links (--links), typos (--typos)[/]"
    )


def run_command(
    command: Command,
    console: Console,
    verbose: bool,
    timeout: float,
) -> subprocess.CompletedProcess[str] | None:
    if verbose:
        return subprocess.run(
            command.argv,
            cwd=command.cwd,
            timeout=timeout,
            check=False,
        )
    try:
        return subprocess.run(
            command.argv,
            cwd=command.cwd,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=timeout,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        output = exc.stdout or ""
        if isinstance(output, bytes):
            output = output.decode("utf-8", errors="replace")
        console.print(
            Panel(
                Text(output),
                title=f"[red]timeout: {command.argv[0]}[/]",
                border_style="red",
            )
        )
        return None
    except FileNotFoundError:
        console.print(
            Panel(
                f"Command not found: {command.argv[0]}",
                title="[red]missing tool[/]",
                border_style="red",
            )
        )
        return None


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--ci",
        action="store_true",
        help="CI smoke mode: no index/atlas builds, no render/links/typos",
    )
    parser.add_argument(
        "--fast",
        action="store_true",
        help="skip builds but keep the freshness smoke tests",
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="local profile plus render and typo checks",
    )
    parser.add_argument(
        "--build-indexes",
        dest="build_indexes",
        action="store_true",
        default=None,
        help="force rebuilding the semantic and RAG indexes",
    )
    parser.add_argument(
        "--no-build-indexes",
        dest="build_indexes",
        action="store_false",
        help="skip the semantic and RAG index builds",
    )
    parser.add_argument(
        "--build-atlas",
        dest="build_atlas",
        action="store_true",
        default=None,
        help="force rebuilding the Atlas data",
    )
    parser.add_argument(
        "--no-build-atlas",
        dest="build_atlas",
        action="store_false",
        help="skip the Atlas data build",
    )
    parser.add_argument(
        "--render",
        action="store_true",
        help="run the PHP render validator (uses Chromium)",
    )
    parser.add_argument(
        "--render-mode",
        choices=("changed", "index", "all", "off"),
        default="changed",
        help="which pages to render (default: changed lesson pages)",
    )
    parser.add_argument(
        "--links",
        action="store_true",
        help="run the literature link checker (network, slow)",
    )
    parser.add_argument(
        "--typos",
        action="store_true",
        help="run the prose typo checker (local only)",
    )
    parser.add_argument(
        "--no-node",
        action="store_true",
        help="skip the Node unit tests",
    )
    parser.add_argument(
        "--only",
        metavar="STAGES",
        help="comma-separated stage names or groups to run",
    )
    parser.add_argument(
        "--skip",
        metavar="STAGES",
        help="comma-separated stage names or groups to skip",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=1800.0,
        help="per-command timeout in seconds (default: 1800)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="stream each command's output instead of capturing it",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="print commands without running them",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="list all stages and exit",
    )
    parser.add_argument(
        "--no-color",
        action="store_true",
        help="disable Rich colors",
    )
    args = parser.parse_args()

    console = Console(no_color=args.no_color, highlight=False)
    if args.list:
        print_stage_list(console)
        return 0

    if args.ci and args.full:
        console.print("[yellow]--ci wins over --full; running smoke checks only[/]")

    stages = selected_stages(args, console)
    if not stages:
        console.print(Panel("No stages selected.", border_style="yellow"))
        return 1

    missing = sorted(
        {tool for stage in stages for tool in stage.needs if shutil.which(tool) is None}
    )
    if missing:
        console.print(
            Panel(
                "Missing required tool(s): " + ", ".join(missing),
                title="[red]preflight failed[/]",
                border_style="red",
            )
        )
        return 1

    mode = "CI smoke" if args.ci else "fast" if args.fast else "local"
    console.print(
        Panel(
            f"{len(stages)} stage(s) · mode: {mode} · "
            f"{'build indexes' if any(s.build_index for s in stages) else 'no index build'}",
            title="[bold]blog check-all[/]",
            border_style="cyan",
        )
    )
    if args.dry_run:
        for stage in stages:
            console.print(f"[bold]{stage.name}[/]")
            for command in stage.commands:
                console.print(f"  [dim]{command.cwd}[/] $ {' '.join(command.argv)}")
        return 0

    table = Table(title="summary", header_style="bold")
    table.add_column("stage")
    table.add_column("group")
    table.add_column("result")
    table.add_column("time", justify="right")

    last_group = None
    for stage in stages:
        if stage.group != last_group:
            console.print(Rule(f"[bold]{stage.group.upper()}[/]"))
            last_group = stage.group

        started = time.monotonic()
        failed_output = ""
        failed_command = ""
        status = "PASS"
        if args.verbose:
            console.print(f"[bold]→[/] {stage.name}")
        with console.status(f"[bold]{stage.name}[/] ...", spinner="dots"):
            for command in stage.commands:
                result = run_command(command, console, args.verbose, args.timeout)
                if result is None:
                    status = "FAIL"
                    failed_command = " ".join(command.argv)
                    break
                if result.returncode != 0:
                    status = "FAIL"
                    failed_command = " ".join(command.argv)
                    failed_output = result.stdout or ""
                    break
        elapsed = time.monotonic() - started

        if status == "PASS":
            console.print(f"[green]✓[/] {stage.name} [dim]{elapsed:.1f}s[/]")
        else:
            console.print(f"[red]✗[/] {stage.name} [dim]{elapsed:.1f}s[/]")
            if failed_output:
                console.print(Text(failed_output), markup=False)
            table.add_row(stage.name, stage.group, status, f"{elapsed:.1f}s")
            console.print(
                Panel(
                    f"Failed command:\n{failed_command}",
                    title="[red]stopped at first failure[/]",
                    border_style="red",
                )
            )
            console.print(table)
            return 1
        table.add_row(stage.name, stage.group, status, f"{elapsed:.1f}s")

    console.print(table)
    console.print("[green]All selected stages passed.[/]")
    return 0


if __name__ == "__main__":
    sys.exit(main())
