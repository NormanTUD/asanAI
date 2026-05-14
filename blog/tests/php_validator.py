#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "rich",
# ]
# ///

import os
import sys
import re
import subprocess
import glob
from pathlib import Path
from datetime import datetime, timedelta

try:
    from datetime import UTC
except ImportError:
    from datetime import timezone
    UTC = timezone.utc


def compute_exclude_newer_date(days_back=8):
    return (datetime.now(UTC) - timedelta(days=days_back)).strftime("%Y-%m-%dT%H:%M:%SZ")


def should_set_exclude_newer():
    return not os.environ.get("UV_EXCLUDE_NEWER")


def restart_with_uv(script_path, args, env):
    try:
        os.execvpe("uv", ["uv", "run", "--quiet", script_path] + args, env)
    except FileNotFoundError:
        print("uv is not installed. Try:")
        print("curl -LsSf https://astral.sh/uv/install.sh | sh")
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

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich import box
from rich.rule import Rule
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, MofNCompleteColumn
from rich.tree import Tree

console = Console()

# Directories to skip when recursing
SKIP_DIRS = {
    ".git", "node_modules", "vendor", ".svn", "__pycache__",
    ".idea", ".vscode", "storage", "cache",
}


# ============================================================
# INPUT RESOLUTION — files, folders, globs, mixed
# ============================================================

def resolve_inputs(args: list[str]) -> list[Path]:
    """
    Accept any mix of:
      - single .php files
      - directories (recursed for .php)
      - glob patterns (e.g. 'src/**/*.php', '*.php')
      - multiple of the above
      - nothing → defaults to current directory
    Returns a deduplicated, sorted list of .php file paths.
    """
    if not args:
        args = ["."]

    php_files: set[Path] = set()

    for arg in args:
        p = Path(arg)

        # 1) It's an existing file
        if p.is_file():
            if p.suffix == ".php":
                php_files.add(p.resolve())
            else:
                console.print(f"[bold yellow]Skipping non-PHP file:[/] {p}")
            continue

        # 2) It's an existing directory
        if p.is_dir():
            for root, dirs, files in os.walk(p):
                dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
                for f in files:
                    if f.endswith(".php"):
                        php_files.add((Path(root) / f).resolve())
            continue

        # 3) Try as a glob pattern
        matches = glob.glob(arg, recursive=True)
        if matches:
            for m in matches:
                mp = Path(m)
                if mp.is_file() and mp.suffix == ".php":
                    php_files.add(mp.resolve())
                elif mp.is_dir():
                    for root, dirs, files in os.walk(mp):
                        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
                        for f in files:
                            if f.endswith(".php"):
                                php_files.add((Path(root) / f).resolve())
            continue

        # 4) Nothing matched
        console.print(f"[bold red]Not found:[/] '{arg}' is not a file, directory, or matching glob pattern.")

    return sorted(php_files)


# ============================================================
# PHP SYNTAX CHECK (using php -l)
# ============================================================

def check_php_syntax(filepath: Path) -> tuple[bool, str]:
    """
    Check PHP syntax using `php -l`.
    Returns (is_valid, message).
    """
    try:
        result = subprocess.run(
            ["php", "-l", str(filepath)],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0:
            return True, "No syntax errors detected"
        else:
            error_msg = result.stdout.strip() or result.stderr.strip()
            error_msg = error_msg.replace("Errors parsing " + str(filepath), "").strip()
            if not error_msg:
                error_msg = "Unknown syntax error"
            return False, error_msg
    except FileNotFoundError:
        return False, "PHP CLI not found — install PHP to enable syntax checking"
    except subprocess.TimeoutExpired:
        return False, "Timeout while checking syntax"
    except Exception as e:
        return False, f"Error running php -l: {e}"


# ============================================================
# HTML TAG BALANCE CHECK
# ============================================================

VOID_ELEMENTS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}

TRACKED_TAGS = {
    "div", "span", "p", "a", "ul", "ol", "li", "table", "tr", "td", "th",
    "thead", "tbody", "tfoot", "form", "section", "article", "header",
    "footer", "nav", "main", "aside", "details", "summary", "figure",
    "figcaption", "blockquote", "pre", "code", "h1", "h2", "h3", "h4",
    "h5", "h6", "button", "select", "option", "textarea", "label",
    "fieldset", "legend", "dl", "dt", "dd",
}


def strip_php_blocks(content: str) -> str:
    """
    Remove PHP code blocks but preserve line structure (replace with
    equivalent newlines) so line numbers stay accurate.
    """
    result = []
    i = 0
    in_php = False
    while i < len(content):
        if not in_php:
            if content[i:i+5] == "<?php":
                in_php = True
                i += 5
            elif content[i:i+2] == "<?":
                in_php = True
                i += 2
            else:
                result.append(content[i])
                i += 1
        else:
            if content[i:i+2] == "?>":
                in_php = False
                i += 2
            else:
                # Preserve newlines so line numbers stay correct
                if content[i] == "\n":
                    result.append("\n")
                i += 1
    return "".join(result)


def _line_number_at(text: str, pos: int) -> int:
    """Return 1-based line number for a character position in text."""
    return text.count("\n", 0, pos) + 1


def check_tag_balance(content: str, filepath: Path) -> list[dict]:
    """
    Check that opened HTML tags are properly closed.
    Works on the FULL content (not line-by-line) so multi-line tags are handled.
    """
    issues = []

    html_content = strip_php_blocks(content)

    # Remove HTML comments (preserve newlines for line counting)
    def _replace_keep_newlines(m):
        return "\n" * m.group(0).count("\n")

    html_content = re.sub(r"<!--.*?-->", _replace_keep_newlines, html_content, flags=re.DOTALL)
    html_content = re.sub(r"<script[^>]*>.*?</script>", _replace_keep_newlines, html_content, flags=re.DOTALL | re.IGNORECASE)
    html_content = re.sub(r"<style[^>]*>.*?</style>", _replace_keep_newlines, html_content, flags=re.DOTALL | re.IGNORECASE)

    # Match tags across multiple lines — the key fix:
    # [^>]* is greedy across newlines by default, but we need re.DOTALL
    # for . to match \n inside attribute values. Using [^>]* is fine since
    # > terminates the tag.
    tag_pattern = re.compile(r"<(/?)(\w+)([^>]*?)(/?)>", re.IGNORECASE | re.DOTALL)

    stack = []  # (tag_name, line_number)

    for match in tag_pattern.finditer(html_content):
        is_closing = match.group(1) == "/"
        tag_name = match.group(2).lower()
        attrs = match.group(3)
        is_self_closing = match.group(4) == "/"

        if tag_name in VOID_ELEMENTS:
            continue
        if tag_name not in TRACKED_TAGS:
            continue
        if is_self_closing:
            continue

        line_num = _line_number_at(html_content, match.start())

        if not is_closing:
            stack.append((tag_name, line_num))
        else:
            if not stack:
                issues.append({
                    "type": "unexpected_close",
                    "tag": tag_name,
                    "line": line_num,
                    "message": f"Closing </{tag_name}> without matching opening tag",
                })
            elif stack[-1][0] == tag_name:
                stack.pop()
            else:
                # Search stack for a matching opener
                found = False
                for idx in range(len(stack) - 1, -1, -1):
                    if stack[idx][0] == tag_name:
                        unclosed = stack[idx + 1:]
                        for utag, uline in unclosed:
                            issues.append({
                                "type": "unclosed",
                                "tag": utag,
                                "line": uline,
                                "message": f"<{utag}> opened on line {uline} is never closed (or misnested)",
                            })
                        stack = stack[:idx]
                        found = True
                        break
                if not found:
                    issues.append({
                        "type": "unexpected_close",
                        "tag": tag_name,
                        "line": line_num,
                        "message": f"Closing </{tag_name}> without matching opening tag",
                    })

    for tag_name, line_num in stack:
        issues.append({
            "type": "unclosed",
            "tag": tag_name,
            "line": line_num,
            "message": f"<{tag_name}> opened on line {line_num} is never closed",
        })

    return issues


# ============================================================
# BRACKET / BRACE BALANCE CHECK
# ============================================================

def check_bracket_balance(content: str) -> list[dict]:
    """
    Check that brackets (), {}, [] are balanced in the file.
    Skips content inside strings and comments.
    """
    issues = []
    i = 0
    length = len(content)
    stack = []
    line_num = 1

    in_single_quote = False
    in_double_quote = False
    in_line_comment = False
    in_block_comment = False
    in_heredoc = False
    heredoc_tag = ""

    while i < length:
        ch = content[i]

        if ch == "\n":
            line_num += 1
            if in_line_comment:
                in_line_comment = False
            if in_heredoc and i + 1 < length:
                rest = content[i+1:]
                if rest.startswith(heredoc_tag + ";") or rest.startswith(heredoc_tag + "\n"):
                    in_heredoc = False
                    i += len(heredoc_tag) + 1
                    continue
            i += 1
            continue

        if in_block_comment:
            if ch == "*" and i + 1 < length and content[i + 1] == "/":
                in_block_comment = False
                i += 2
            else:
                i += 1
            continue

        if in_line_comment:
            i += 1
            continue

        if in_single_quote:
            if ch == "\\" and i + 1 < length:
                i += 2
            elif ch == "'":
                in_single_quote = False
                i += 1
            else:
                i += 1
            continue

        if in_double_quote:
            if ch == "\\" and i + 1 < length:
                i += 2
            elif ch == '"':
                in_double_quote = False
                i += 1
            else:
                i += 1
            continue

        if in_heredoc:
            i += 1
            continue

        if ch == "/" and i + 1 < length:
            if content[i + 1] == "/":
                in_line_comment = True
                i += 2
                continue
            elif content[i + 1] == "*":
                in_block_comment = True
                i += 2
                continue

        if ch == "#":
            in_line_comment = True
            i += 1
            continue

        if ch == "'":
            in_single_quote = True
            i += 1
            continue
        if ch == '"':
            in_double_quote = True
            i += 1
            continue

        if ch == "<" and content[i:i+3] == "<<<":
            nl_pos = content.find("\n", i)
            if nl_pos == -1:
                nl_pos = length
            rest_of_line = content[i+3:nl_pos]
            heredoc_match = re.match(r"\s*['\"]?(\w+)['\"]?", rest_of_line)
            if heredoc_match:
                heredoc_tag = heredoc_match.group(1)
                in_heredoc = True
                i = nl_pos
                continue

        if ch in "({[":
            stack.append((ch, line_num))
        elif ch in ")}]":
            matching = {")": "(", "}": "{", "]": "["}
            if not stack:
                issues.append({
                    "type": "unexpected_bracket",
                    "char": ch,
                    "line": line_num,
                    "message": f"Unexpected closing '{ch}' on line {line_num} with no matching opener",
                })
            elif stack[-1][0] != matching[ch]:
                issues.append({
                    "type": "mismatched_bracket",
                    "char": ch,
                    "line": line_num,
                    "message": f"Mismatched '{ch}' on line {line_num} — expected closing for '{stack[-1][0]}' from line {stack[-1][1]}",
                })
                stack.pop()
            else:
                stack.pop()

        i += 1

    for ch, ln in stack:
        closing = {"(": ")", "{": "}", "[": "]"}
        issues.append({
            "type": "unclosed_bracket",
            "char": ch,
            "line": ln,
            "message": f"Unclosed '{ch}' opened on line {ln} — missing '{closing[ch]}'",
        })

    return issues


# ============================================================
# ADDITIONAL CHECKS
# ============================================================

def check_common_issues(content: str, filepath: Path) -> list[dict]:
    issues = []

    if content.startswith("\ufeff") or content.encode("utf-8").startswith(b"\xef\xbb\xbf"):
        issues.append({
            "type": "bom",
            "line": 1,
            "message": "File contains a UTF-8 BOM marker (can cause 'headers already sent' errors)",
        })

    stripped = content.strip()
    if not stripped:
        issues.append({
            "type": "empty",
            "line": 1,
            "message": "File is empty",
        })
        return issues

    if "<?php" not in content and "<?" not in content:
        issues.append({
            "type": "no_php_tag",
            "line": 1,
            "message": "File does not contain a PHP opening tag (<?php)",
        })

    open_tags = len(re.findall(r"<\?php|<\?(?!=)", content))
    close_tags = len(re.findall(r"\?>", content))
    if close_tags > open_tags:
        issues.append({
            "type": "extra_close_tag",
            "line": 0,
            "message": f"More PHP closing tags (?>) [{close_tags}] than opening tags (<?php) [{open_tags}]",
        })

    if content.rstrip().endswith("?>"):
        after_close = content[content.rindex("?>") + 2:]
        if after_close.strip():
            issues.append({
                "type": "content_after_close",
                "line": content[:content.rindex("?>")].count("\n") + 1,
                "message": "Content found after final ?> closing tag",
            })

    return issues


# ============================================================
# RESULT DISPLAY
# ============================================================

def severity_style(issue_type: str) -> str:
    critical = {"syntax_error", "unclosed_bracket", "mismatched_bracket", "unexpected_bracket"}
    warning = {"unclosed", "unexpected_close", "bom", "extra_close_tag", "content_after_close"}
    if issue_type in critical:
        return "bold red"
    elif issue_type in warning:
        return "bold yellow"
    else:
        return "bold blue"


def severity_icon(issue_type: str) -> str:
    critical = {"syntax_error", "unclosed_bracket", "mismatched_bracket", "unexpected_bracket"}
    warning = {"unclosed", "unexpected_close", "bom", "extra_close_tag", "content_after_close"}
    if issue_type in critical:
        return "❌"
    elif issue_type in warning:
        return "⚠️"
    else:
        return "ℹ️"


# ============================================================
# MAIN
# ============================================================

def main():
    console.print()
    console.print(Panel(
        "[bold bright_cyan]🐘 PHP File Validator[/]\n\n"
        "[dim]Checks PHP files for:[/]\n"
        "  [bold green]✓[/] PHP syntax errors (via php -l)\n"
        "  [bold green]✓[/] Unclosed/mismatched HTML tags (div, span, etc.)\n"
        "  [bold green]✓[/] Unbalanced brackets (), {}, []\n"
        "  [bold green]✓[/] Common issues (BOM, missing tags, etc.)\n\n"
        "[dim]Usage:[/]\n"
        "  [bold]php_validator.py[/]                          [dim]# current directory[/]\n"
        "  [bold]php_validator.py src/[/]                     [dim]# single folder[/]\n"
        "  [bold]php_validator.py index.php lib/[/]           [dim]# file + folder[/]\n"
        "  [bold]php_validator.py src/ templates/ *.php[/]    [dim]# multiple mixed[/]\n"
        '  [bold]php_validator.py "src/**/*.php"[/]           [dim]# glob pattern[/]',
        title="[bold bright_white]PHP Validator[/]",
        border_style="bright_cyan",
        padding=(1, 3),
    ))
    console.print()

    # Resolve all inputs — files, folders, globs, or default to cwd
    targets = sys.argv[1:]
    php_files = resolve_inputs(targets)

    if not targets:
        console.print(f"[bold]Scanning:[/] {Path('.').resolve()} [dim](no arguments — using current directory)[/]")
    else:
        console.print(f"[bold]Targets:[/] {', '.join(targets)}")
    console.print()

    if not php_files:
        console.print("[bold yellow]No PHP files found for the given input(s).[/]")
        sys.exit(0)

    console.print(f"[bold]Found:[/] {len(php_files)} PHP file(s)\n")

    # Find a common base for relative path display
    try:
        common_base = Path(os.path.commonpath(php_files))
        if common_base.is_file():
            common_base = common_base.parent
    except ValueError:
        common_base = Path(".")

    # Process files
    results = []

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        MofNCompleteColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("Checking PHP files...", total=len(php_files))

        for filepath in php_files:
            progress.update(task, description=f"Checking {filepath.name}...")

            try:
                content = filepath.read_text(encoding="utf-8", errors="replace")
            except Exception as e:
                results.append((filepath, False, f"Cannot read file: {e}", [], [], []))
                progress.advance(task)
                continue

            syntax_ok, syntax_msg = check_php_syntax(filepath)
            tag_issues = check_tag_balance(content, filepath)
            bracket_issues = check_bracket_balance(content)
            common_issues = check_common_issues(content, filepath)

            results.append((filepath, syntax_ok, syntax_msg, tag_issues, bracket_issues, common_issues))
            progress.advance(task)

    # Display results
    console.print()
    console.print(Rule(title="[bold bright_cyan]Results[/]", style="bright_blue"))
    console.print()

    total_files = len(results)
    files_with_errors = 0
    total_issues = 0
    syntax_errors = 0
    tag_issues_count = 0
    bracket_issues_count = 0
    common_issues_count = 0

    for filepath, syntax_ok, syntax_msg, tag_issues, bracket_issues, common_issues in results:
        all_issues = []

        if not syntax_ok and "not found" not in syntax_msg.lower():
            all_issues.append(("syntax_error", 0, syntax_msg))
            syntax_errors += 1

        for issue in tag_issues:
            all_issues.append((issue["type"], issue["line"], issue["message"]))
            tag_issues_count += 1

        for issue in bracket_issues:
            all_issues.append((issue["type"], issue["line"], issue["message"]))
            bracket_issues_count += 1

        for issue in common_issues:
            all_issues.append((issue["type"], issue["line"], issue["message"]))
            common_issues_count += 1

        total_issues += len(all_issues)

        if all_issues:
            files_with_errors += 1

            try:
                rel_path = filepath.relative_to(common_base)
            except ValueError:
                rel_path = filepath

            tree = Tree(f"[bold bright_white]📄 {rel_path}[/]")

            for issue_type, line, message in all_issues:
                icon = severity_icon(issue_type)
                style = severity_style(issue_type)
                line_info = f"[dim]line {line}:[/] " if line > 0 else ""
                tree.add(f"{icon} {line_info}[{style}]{message}[/]")

            console.print(tree)
            console.print()

    # Summary table
    console.print(Rule(title="[bold bright_cyan]Summary[/]", style="bright_blue"))
    console.print()

    summary_table = Table(
        box=box.ROUNDED,
        border_style="bright_blue",
        header_style="bold white",
        show_lines=False,
        padding=(0, 2),
    )
    summary_table.add_column("Metric", style="bold")
    summary_table.add_column("Count", justify="right")
    summary_table.add_column("Status", justify="center")

    summary_table.add_row("Files scanned", str(total_files), "📁")

    if files_with_errors == 0:
        summary_table.add_row("Files with issues", "0", "[bold green]✅ All clean![/]")
    else:
        summary_table.add_row(
            "Files with issues",
            f"[bold red]{files_with_errors}[/]",
            f"[bold red]⚠️  {files_with_errors}/{total_files}[/]",
        )

    if syntax_errors > 0:
        summary_table.add_row("PHP syntax errors", f"[bold red]{syntax_errors}[/]", "❌")
    else:
        summary_table.add_row("PHP syntax errors", "0", "[green]✓[/]")

    if tag_issues_count > 0:
        summary_table.add_row("HTML tag issues", f"[bold yellow]{tag_issues_count}[/]", "⚠️")
    else:
        summary_table.add_row("HTML tag issues", "0", "[green]✓[/]")

    if bracket_issues_count > 0:
        summary_table.add_row("Bracket issues", f"[bold red]{bracket_issues_count}[/]", "❌")
    else:
        summary_table.add_row("Bracket issues", "0", "[green]✓[/]")

    if common_issues_count > 0:
        summary_table.add_row("Other issues", f"[bold blue]{common_issues_count}[/]", "ℹ️")
    else:
        summary_table.add_row("Other issues", "0", "[green]✓[/]")

    summary_table.add_row("", "", "")
    summary_table.add_row(
        "[bold]Total issues[/]",
        f"[bold]{total_issues}[/]",
        "[bold green]🎉 PASS[/]" if total_issues == 0 else f"[bold red]🚨 {total_issues} issue(s)[/]",
    )

    console.print(summary_table)
    console.print()

    clean_files = total_files - files_with_errors
    if clean_files > 0 and files_with_errors > 0:
        console.print(f"  [dim]{clean_files} file(s) passed all checks without issues.[/]")
        console.print()

    if total_issues > 0:
        sys.exit(1)
    else:
        console.print(Panel(
            "[bold bright_green]All PHP files passed validation! 🎉[/]",
            border_style="green",
            padding=(0, 2),
        ))
        sys.exit(0)


if __name__ == "__main__":
    main()
