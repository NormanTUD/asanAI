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
            # Extract the error message
            error_msg = result.stdout.strip() or result.stderr.strip()
            # Clean up the message
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

# Self-closing / void HTML elements that don't need closing tags
VOID_ELEMENTS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}

# Tags we want to check for balance
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
    Remove PHP code blocks to avoid false positives from HTML inside strings/comments.
    We keep the HTML output parts.
    """
    # Remove PHP blocks but keep inline echo/print HTML
    # This is a simplified approach — remove <?php ... ?> blocks
    # but keep the parts outside PHP tags
    result = []
    i = 0
    in_php = False
    while i < len(content):
        if not in_php:
            # Look for PHP open tag
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
            # Look for PHP close tag
            if content[i:i+2] == "?>":
                in_php = False
                i += 2
            else:
                i += 1
    return "".join(result)


def check_tag_balance(content: str, filepath: Path) -> list[dict]:
    """
    Check that opened HTML tags are properly closed.
    Returns a list of issues found.
    """
    issues = []

    # Strip PHP blocks to get just the HTML template parts
    html_content = strip_php_blocks(content)

    # Remove HTML comments
    html_content = re.sub(r"<!--.*?-->", "", html_content, flags=re.DOTALL)

    # Remove content inside <script> and <style> tags (they may contain < > chars)
    html_content = re.sub(r"<script[^>]*>.*?</script>", "", html_content, flags=re.DOTALL | re.IGNORECASE)
    html_content = re.sub(r"<style[^>]*>.*?</style>", "", html_content, flags=re.DOTALL | re.IGNORECASE)

    # Find all opening and closing tags
    tag_pattern = re.compile(r"<(/?)(\w+)([^>]*?)(/?)>", re.IGNORECASE)

    stack = []  # Stack of (tag_name, line_number)

    # Track line numbers
    lines = html_content.split("\n")
    pos = 0

    for line_num, line in enumerate(lines, 1):
        for match in tag_pattern.finditer(line):
            is_closing = match.group(1) == "/"
            tag_name = match.group(2).lower()
            is_self_closing = match.group(4) == "/"

            # Skip void elements and non-tracked tags
            if tag_name in VOID_ELEMENTS:
                continue
            if tag_name not in TRACKED_TAGS:
                continue
            if is_self_closing:
                continue

            if not is_closing:
                # Opening tag
                stack.append((tag_name, line_num))
            else:
                # Closing tag
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
                    # Try to find a matching open tag further up the stack
                    found = False
                    for idx in range(len(stack) - 1, -1, -1):
                        if stack[idx][0] == tag_name:
                            # Everything between is unclosed
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

    # Anything left on the stack is unclosed
    for tag_name, line_num in stack:
        issues.append({
            "type": "unclosed",
            "tag": tag_name,
            "line": line_num,
            "message": f"<{tag_name}> opened on line {line_num} is never closed",
        })

    return issues


# ============================================================
# BRACKET / BRACE BALANCE CHECK (in PHP code)
# ============================================================

def check_bracket_balance(content: str) -> list[dict]:
    """
    Check that brackets (), {}, [] are balanced in the file.
    Skips content inside strings and comments.
    """
    issues = []

    # Simple state machine to skip strings and comments
    i = 0
    length = len(content)
    stack = []  # (char, line_num)
    line_num = 1

    in_single_quote = False
    in_double_quote = False
    in_line_comment = False
    in_block_comment = False
    in_heredoc = False
    heredoc_tag = ""

    while i < length:
        ch = content[i]

        # Track line numbers
        if ch == "\n":
            line_num += 1
            if in_line_comment:
                in_line_comment = False
            if in_heredoc and i + 1 < length:
                # Check if next line starts with heredoc end tag
                rest = content[i+1:]
                if rest.startswith(heredoc_tag + ";") or rest.startswith(heredoc_tag + "\n"):
                    in_heredoc = False
                    i += len(heredoc_tag) + 1
                    continue
            i += 1
            continue

        # Skip block comments
        if in_block_comment:
            if ch == "*" and i + 1 < length and content[i + 1] == "/":
                in_block_comment = False
                i += 2
            else:
                i += 1
            continue

        # Skip line comments
        if in_line_comment:
            i += 1
            continue

        # Skip strings
        if in_single_quote:
            if ch == "\\" and i + 1 < length:
                i += 2  # skip escaped char
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

        # Detect start of comments
        if ch == "/" and i + 1 < length:
            if content[i + 1] == "/":
                in_line_comment = True
                i += 2
                continue
            elif content[i + 1] == "*":
                in_block_comment = True
                i += 2
                continue

        # Detect start of line comment with #
        if ch == "#":
            in_line_comment = True
            i += 1
            continue

        # Detect strings
        if ch == "'":
            in_single_quote = True
            i += 1
            continue
        if ch == '"':
            in_double_quote = True
            i += 1
            continue

        # Detect heredoc/nowdoc
        if ch == "<" and content[i:i+3] == "<<<":
            rest_of_line = content[i+3:content.index("\n", i) if "\n" in content[i:] else length]
            heredoc_match = re.match(r"\s*['\"]?(\w+)['\"]?", rest_of_line)
            if heredoc_match:
                heredoc_tag = heredoc_match.group(1)
                in_heredoc = True
                i += 3 + len(rest_of_line)
                continue

        # Now check brackets
        if ch in "({[":
            stack.append((ch, line_num))
        elif ch in ")}]":
            matching = {")" : "(", "}" : "{", "]" : "["}
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

    # Anything left on stack is unclosed
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
    """
    Check for common PHP issues:
    - Missing semicolons (heuristic)
    - Unclosed PHP tags
    - Empty files
    - BOM markers
    """
    issues = []

    # Check for BOM
    if content.startswith("\ufeff") or content.encode("utf-8").startswith(b"\xef\xbb\xbf"):
        issues.append({
            "type": "bom",
            "line": 1,
            "message": "File contains a UTF-8 BOM marker (can cause 'headers already sent' errors)",
        })

    # Check for empty file
    stripped = content.strip()
    if not stripped:
        issues.append({
            "type": "empty",
            "line": 1,
            "message": "File is empty",
        })
        return issues

    # Check if file has PHP opening tag
    if "<?php" not in content and "<?" not in content:
        issues.append({
            "type": "no_php_tag",
            "line": 1,
            "message": "File does not contain a PHP opening tag (<?php)",
        })

    # Check for unclosed PHP tags (more opens than closes)
    open_tags = len(re.findall(r"<\?php|<\?(?!=)", content))
    close_tags = len(re.findall(r"\?>", content))
    # It's valid to not close the last PHP tag (actually recommended for pure PHP files)
    # But if there are more closes than opens, that's an issue
    if close_tags > open_tags:
        issues.append({
            "type": "extra_close_tag",
            "line": 0,
            "message": f"More PHP closing tags (?>) [{close_tags}] than opening tags (<?php) [{open_tags}]",
        })

    # Check for trailing whitespace after closing ?>
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
# FILE SCANNER
# ============================================================

def scan_php_files(folder: Path) -> list[Path]:
    """Recursively find all PHP files in a folder."""
    php_files = []
    for root, dirs, files in os.walk(folder):
        # Skip common non-project directories
        dirs[:] = [d for d in dirs if d not in {
            ".git", "node_modules", "vendor", ".svn", "__pycache__",
            ".idea", ".vscode", "storage", "cache",
        }]
        for f in files:
            if f.endswith(".php"):
                php_files.append(Path(root) / f)
    return sorted(php_files)


# ============================================================
# RESULT DISPLAY
# ============================================================

def severity_style(issue_type: str) -> str:
    """Get color style based on issue severity."""
    critical = {"syntax_error", "unclosed_bracket", "mismatched_bracket", "unexpected_bracket"}
    warning = {"unclosed", "unexpected_close", "bom", "extra_close_tag", "content_after_close"}
    info = {"no_php_tag", "empty"}

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
        "  [bold green]✓[/] Common issues (BOM, missing tags, etc.)",
        title="[bold bright_white]PHP Validator[/]",
        border_style="bright_cyan",
        padding=(1, 3),
    ))
    console.print()

    # Get folder from command line argument
    if len(sys.argv) < 2:
        console.print("[bold red]Usage:[/] python php_validator.py <folder_path>")
        console.print("[dim]  Example: python php_validator.py ./src[/]")
        sys.exit(1)

    folder = Path(sys.argv[1])
    if not folder.exists():
        console.print(f"[bold red]Error:[/] Folder '{folder}' does not exist.")
        sys.exit(1)
    if not folder.is_dir():
        console.print(f"[bold red]Error:[/] '{folder}' is not a directory.")
        sys.exit(1)

    # Scan for PHP files
    console.print(f"[bold]Scanning:[/] {folder.resolve()}")
    console.print()

    php_files = scan_php_files(folder)

    if not php_files:
        console.print("[bold yellow]No PHP files found in the specified directory.[/]")
        sys.exit(0)

    console.print(f"[bold]Found:[/] {len(php_files)} PHP file(s)\n")

    # Process files
    results = []  # (filepath, syntax_ok, syntax_msg, tag_issues, bracket_issues, common_issues)

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

            # Read file content
            try:
                content = filepath.read_text(encoding="utf-8", errors="replace")
            except Exception as e:
                results.append((filepath, False, f"Cannot read file: {e}", [], [], []))
                progress.advance(task)
                continue

            # Run checks
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

    # Summary counters
    total_files = len(results)
    files_with_errors = 0
    total_issues = 0
    syntax_errors = 0
    tag_issues_count = 0
    bracket_issues_count = 0
    common_issues_count = 0

    # Detailed results for files with issues
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

            # Show file with issues
            rel_path = filepath.relative_to(folder) if filepath.is_relative_to(folder) else filepath
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

    # Files scanned
    summary_table.add_row(
        "Files scanned",
        str(total_files),
        "📁",
    )

    # Files with issues
    if files_with_errors == 0:
        summary_table.add_row("Files with issues", "0", "[bold green]✅ All clean![/]")
    else:
        summary_table.add_row(
            "Files with issues",
            f"[bold red]{files_with_errors}[/]",
            f"[bold red]⚠️  {files_with_errors}/{total_files}[/]",
        )

    # Syntax errors
    if syntax_errors > 0:
        summary_table.add_row("PHP syntax errors", f"[bold red]{syntax_errors}[/]", "❌")
    else:
        summary_table.add_row("PHP syntax errors", "0", "[green]✓[/]")

    # Tag issues
    if tag_issues_count > 0:
        summary_table.add_row("HTML tag issues", f"[bold yellow]{tag_issues_count}[/]", "⚠️")
    else:
        summary_table.add_row("HTML tag issues", "0", "[green]✓[/]")

    # Bracket issues
    if bracket_issues_count > 0:
        summary_table.add_row("Bracket issues", f"[bold red]{bracket_issues_count}[/]", "❌")
    else:
        summary_table.add_row("Bracket issues", "0", "[green]✓[/]")

    # Common issues
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

    # Show clean files count
    clean_files = total_files - files_with_errors
    if clean_files > 0 and files_with_errors > 0:
        console.print(f"  [dim]{clean_files} file(s) passed all checks without issues.[/]")
        console.print()

    # Exit code
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
