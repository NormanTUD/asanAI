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


ensure_safe_env()

# ============================================================
# Now safe to import everything
# ============================================================

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box
from rich.rule import Rule
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, MofNCompleteColumn
from rich.tree import Tree

console = Console()

# ============================================================
# CONFIGURATION
# ============================================================

SKIP_DIRS = {
    ".git", "node_modules", "vendor", ".svn", "__pycache__",
    ".idea", ".vscode", "storage", "cache", "dist", "build",
    "bower_components",
}

# Files to completely ignore — vendored / minified third-party libraries
IGNORE_FILENAMES = {
    "tf.min.js",
    "tf.js",
    "echarts-gl.min.js",
    "jquery.js",
    "jquery-3.7.1.min.js",
    "plotly-2.24.1.min.js",
    "prism.min.js",
    "prism-python.min.js",
    "temml.min.js",
}


# ============================================================
# INPUT RESOLUTION — files, folders, globs, mixed
# ============================================================

def resolve_inputs(args: list[str]) -> list[Path]:
    if not args:
        args = ["."]

    js_files: set[Path] = set()

    for arg in args:
        p = Path(arg)

        if p.is_file():
            if p.suffix == ".js":
                if p.name not in IGNORE_FILENAMES:
                    js_files.add(p.resolve())
                else:
                    console.print(f"[dim]Skipping ignored file:[/] {p.name}")
            else:
                console.print(f"[bold yellow]Skipping non-JS file:[/] {p}")
            continue

        if p.is_dir():
            for root, dirs, files in os.walk(p):
                dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
                for f in files:
                    if f.endswith(".js") and f not in IGNORE_FILENAMES:
                        js_files.add((Path(root) / f).resolve())
            continue

        matches = glob.glob(arg, recursive=True)
        if matches:
            for m in matches:
                mp = Path(m)
                if mp.is_file() and mp.suffix == ".js" and mp.name not in IGNORE_FILENAMES:
                    js_files.add(mp.resolve())
                elif mp.is_dir():
                    for root, dirs, files in os.walk(mp):
                        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
                        for f in files:
                            if f.endswith(".js") and f not in IGNORE_FILENAMES:
                                js_files.add((Path(root) / f).resolve())
            continue

        console.print(f"[bold red]Not found:[/] '{arg}' is not a file, directory, or matching glob pattern.")

    return sorted(js_files)


# ============================================================
# JS TOKENIZER — skip strings, comments, regex literals
# ============================================================

def tokenize_js(content: str):
    """
    Yields (type, value, line_num) for meaningful tokens.
    Types: 'code', 'string', 'template', 'comment', 'regex'
    This is used by multiple checkers to avoid false positives inside
    strings, comments, and regex literals.
    """
    i = 0
    length = len(content)
    line_num = 1
    code_buf = []

    def flush_code():
        nonlocal code_buf
        if code_buf:
            text = "".join(code_buf)
            code_buf = []
            return text
        return None

    while i < length:
        ch = content[i]

        # Track newlines
        if ch == "\n":
            line_num += 1
            code_buf.append(ch)
            i += 1
            continue

        # Single-line comment
        if ch == "/" and i + 1 < length and content[i + 1] == "/":
            flushed = flush_code()
            if flushed:
                yield ("code", flushed, line_num)
            end = content.find("\n", i)
            if end == -1:
                end = length
            yield ("comment", content[i:end], line_num)
            i = end
            continue

        # Block comment
        if ch == "/" and i + 1 < length and content[i + 1] == "*":
            flushed = flush_code()
            if flushed:
                yield ("code", flushed, line_num)
            start_line = line_num
            end = content.find("*/", i + 2)
            if end == -1:
                end = length
            else:
                end += 2
            comment_text = content[i:end]
            line_num += comment_text.count("\n")
            yield ("comment", comment_text, start_line)
            i = end
            continue

        # Template literal
        if ch == "`":
            flushed = flush_code()
            if flushed:
                yield ("code", flushed, line_num)
            start_line = line_num
            i += 1
            buf = ["`"]
            depth = 0
            while i < length:
                c = content[i]
                buf.append(c)
                if c == "\n":
                    line_num += 1
                elif c == "\\" and i + 1 < length:
                    i += 1
                    buf.append(content[i])
                elif c == "$" and i + 1 < length and content[i + 1] == "{":
                    depth += 1
                    buf.append("{")
                    i += 1
                elif c == "{" and depth > 0:
                    depth += 1
                elif c == "}" and depth > 0:
                    depth -= 1
                elif c == "`" and depth == 0:
                    break
                i += 1
            i += 1
            yield ("template", "".join(buf), start_line)
            continue

        # Strings
        if ch in ('"', "'"):
            flushed = flush_code()
            if flushed:
                yield ("code", flushed, line_num)
            quote = ch
            start_line = line_num
            i += 1
            buf = [quote]
            while i < length:
                c = content[i]
                buf.append(c)
                if c == "\n":
                    line_num += 1
                    break  # unterminated string
                if c == "\\" and i + 1 < length:
                    i += 1
                    buf.append(content[i])
                elif c == quote:
                    break
                i += 1
            i += 1
            yield ("string", "".join(buf), start_line)
            continue

        # Regex literal (heuristic: / after certain tokens is regex)
        if ch == "/":
            # Look back at last non-whitespace code character
            prev_code = "".join(code_buf).rstrip()
            is_regex = False
            if not prev_code:
                is_regex = True
            elif prev_code[-1] in "=(:,;[!&|?{}>+\n^~%*/":
                is_regex = True
            elif prev_code.endswith("return") or prev_code.endswith("typeof") or prev_code.endswith("void") or prev_code.endswith("delete") or prev_code.endswith("throw") or prev_code.endswith("new") or prev_code.endswith("in") or prev_code.endswith("case"):
                is_regex = True

            if is_regex:
                flushed = flush_code()
                if flushed:
                    yield ("code", flushed, line_num)
                start_line = line_num
                i += 1
                buf = ["/"]
                in_class = False
                while i < length:
                    c = content[i]
                    buf.append(c)
                    if c == "\\" and i + 1 < length:
                        i += 1
                        buf.append(content[i])
                    elif c == "[":
                        in_class = True
                    elif c == "]":
                        in_class = False
                    elif c == "/" and not in_class:
                        break
                    elif c == "\n":
                        line_num += 1
                        break  # unterminated regex
                    i += 1
                i += 1
                # consume flags
                while i < length and content[i].isalpha():
                    buf.append(content[i])
                    i += 1
                yield ("regex", "".join(buf), start_line)
                continue

        code_buf.append(ch)
        i += 1

    flushed = flush_code()
    if flushed:
        yield ("code", flushed, line_num)


def get_code_only(content: str) -> str:
    """Return only the 'code' portions with strings/comments/regex replaced by placeholders."""
    parts = []
    for tok_type, tok_val, tok_line in tokenize_js(content):
        if tok_type == "code":
            parts.append(tok_val)
        elif tok_type == "comment":
            # Preserve newlines for line counting
            parts.append("\n" * tok_val.count("\n"))
        elif tok_type in ("string", "template", "regex"):
            # Replace with a placeholder that won't trigger checks
            parts.append('"__STR__"' + "\n" * tok_val.count("\n"))
    return "".join(parts)


# ============================================================
# CHECK: Bracket / Brace / Paren Balance
# ============================================================

def check_bracket_balance(content: str) -> list[dict]:
    issues = []
    stack = []
    line_num = 1

    code = get_code_only(content)

    for ch in code:
        if ch == "\n":
            line_num += 1
            continue
        if ch in "({[":
            stack.append((ch, line_num))
        elif ch in ")}]":
            matching = {")": "(", "}": "{", "]": "["}
            if not stack:
                issues.append({
                    "type": "unexpected_bracket",
                    "line": line_num,
                    "message": f"Unexpected closing '{ch}' on line {line_num} with no matching opener",
                })
            elif stack[-1][0] != matching[ch]:
                issues.append({
                    "type": "mismatched_bracket",
                    "line": line_num,
                    "message": f"Mismatched '{ch}' on line {line_num} — expected closing for '{stack[-1][0]}' from line {stack[-1][1]}",
                })
                stack.pop()
            else:
                stack.pop()

    for ch, ln in stack:
        closing = {"(": ")", "{": "}", "[": "]"}
        issues.append({
            "type": "unclosed_bracket",
            "line": ln,
            "message": f"Unclosed '{ch}' opened on line {ln} — missing '{closing[ch]}'",
        })

    return issues


# ============================================================
# CHECK: Unclosed Strings & Template Literals
# ============================================================

def check_unclosed_strings(content: str) -> list[dict]:
    issues = []
    for tok_type, tok_val, tok_line in tokenize_js(content):
        if tok_type == "string":
            quote = tok_val[0]
            if not tok_val.endswith(quote) or len(tok_val) < 2:
                issues.append({
                    "type": "unclosed_string",
                    "line": tok_line,
                    "message": f"Unterminated string literal starting on line {tok_line}",
                })
            elif "\n" in tok_val[1:-1]:
                issues.append({
                    "type": "multiline_string",
                    "line": tok_line,
                    "message": f"String literal contains unescaped newline on line {tok_line} (use template literal `` instead?)",
                })
        elif tok_type == "template":
            if not tok_val.endswith("`"):
                issues.append({
                    "type": "unclosed_template",
                    "line": tok_line,
                    "message": f"Unterminated template literal starting on line {tok_line}",
                })
    return issues


# ============================================================
# CHECK: Unclosed Block Comments
# ============================================================

def check_unclosed_comments(content: str) -> list[dict]:
    issues = []
    # Find all /* that don't have a matching */
    i = 0
    line_num = 1
    in_single = False
    in_double = False
    in_template = False
    in_line_comment = False

    while i < len(content):
        ch = content[i]
        if ch == "\n":
            line_num += 1
            in_line_comment = False
            i += 1
            continue

        if in_line_comment:
            i += 1
            continue

        if in_single:
            if ch == "\\" and i + 1 < len(content):
                i += 2
            elif ch == "'":
                in_single = False
                i += 1
            else:
                i += 1
            continue

        if in_double:
            if ch == "\\" and i + 1 < len(content):
                i += 2
            elif ch == '"':
                in_double = False
                i += 1
            else:
                i += 1
            continue

        if in_template:
            if ch == "\\" and i + 1 < len(content):
                i += 2
            elif ch == "`":
                in_template = False
                i += 1
            else:
                i += 1
            continue

        if ch == "'":
            in_single = True
            i += 1
        elif ch == '"':
            in_double = True
            i += 1
        elif ch == "`":
            in_template = True
            i += 1
        elif ch == "/" and i + 1 < len(content) and content[i + 1] == "/":
            in_line_comment = True
            i += 2
        elif ch == "/" and i + 1 < len(content) and content[i + 1] == "*":
            start_line = line_num
            end = content.find("*/", i + 2)
            if end == -1:
                issues.append({
                    "type": "unclosed_comment",
                    "line": start_line,
                    "message": f"Block comment /* opened on line {start_line} is never closed",
                })
                break
            else:
                line_num += content[i:end+2].count("\n")
                i = end + 2
        else:
            i += 1

    return issues


# ============================================================
# CHECK: console.log left in code
# ============================================================

def check_console_logs(content: str) -> list[dict]:
    issues = []
    code = get_code_only(content)
    for i, line in enumerate(code.split("\n"), 1):
        stripped = line.strip()
        if re.search(r"\bconsole\.(log|debug|info|warn|error|trace|table|dir|assert)\s*\(", stripped):
            # Heuristic: skip if it looks intentional (e.g. error handling)
            # Report as info, not error
            issues.append({
                "type": "console_log",
                "line": i,
                "message": f"console statement found on line {i} — remove before production?",
            })
    return issues


# ============================================================
# CHECK: Debugger statements
# ============================================================

def check_debugger_statements(content: str) -> list[dict]:
    issues = []
    code = get_code_only(content)
    for i, line in enumerate(code.split("\n"), 1):
        if re.search(r"\bdebugger\b", line.strip()):
            issues.append({
                "type": "debugger",
                "line": i,
                "message": f"'debugger' statement found on line {i} — must be removed",
            })
    return issues


# ============================================================
# CHECK: Duplicate function/variable declarations
# ============================================================

def check_duplicate_declarations(content: str) -> list[dict]:
    issues = []
    code = get_code_only(content)

    # Track function declarations: function name(
    func_pattern = re.compile(r"\bfunction\s+(\w+)\s*\(")
    # Track const/let/var declarations
    var_pattern = re.compile(r"\b(const|let|var)\s+(\w+)\b")

    func_decls: dict[str, list[int]] = {}
    # Only check top-level-ish duplicates (same scope is hard without AST)
    # We check for exact duplicate function names

    for i, line in enumerate(code.split("\n"), 1):
        for m in func_pattern.finditer(line):
            name = m.group(1)
            func_decls.setdefault(name, []).append(i)

    for name, lines in func_decls.items():
        if len(lines) > 1:
            issues.append({
                "type": "duplicate_function",
                "line": lines[1],
                "message": f"Function '{name}' declared multiple times: lines {', '.join(str(l) for l in lines)}",
            })

    return issues


# ============================================================
# CHECK: Suspicious equality (== instead of ===)
# ============================================================

def check_loose_equality(content: str) -> list[dict]:
    issues = []
    code = get_code_only(content)

    # Match == or != but NOT === or !==
    pattern = re.compile(r"(?<!=)(?<!!)(==|!=)(?!=)")

    for i, line in enumerate(code.split("\n"), 1):
        for m in pattern.finditer(line):
            op = m.group(1)
            strict = "===" if op == "==" else "!=="
            # Skip if comparing to null (common pattern: x == null checks both null and undefined)
            context = line[max(0, m.start()-20):m.end()+20]
            if "null" in context:
                continue
            issues.append({
                "type": "loose_equality",
                "line": i,
                "message": f"Loose '{op}' on line {i} — consider using strict '{strict}'",
            })

    return issues


# ============================================================
# CHECK: var usage (prefer let/const)
# ============================================================

def check_var_usage(content: str) -> list[dict]:
    issues = []
    code = get_code_only(content)

    for i, line in enumerate(code.split("\n"), 1):
        if re.search(r"\bvar\s+\w+", line.strip()):
            issues.append({
                "type": "var_usage",
                "line": i,
                "message": f"'var' used on line {i} — prefer 'let' or 'const' for block scoping",
            })

    return issues


# ============================================================
# CHECK: Unreachable code after return/throw/break/continue
# ============================================================

def check_unreachable_code(content: str) -> list[dict]:
    issues = []
    code = get_code_only(content)
    lines = code.split("\n")

    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        # Check if line is a return/throw/break/continue statement
        if re.match(r"^(return|throw|break|continue)\b", stripped):
            # Check if next non-empty, non-comment line is code (not } or case or else)
            for j in range(i, min(i + 5, len(lines))):
                next_line = lines[j].strip()
                if not next_line:
                    continue
                if next_line.startswith("}") or next_line.startswith("case ") or next_line.startswith("default:") or next_line.startswith("//") or next_line.startswith("/*"):
                    break
                # Found code after return/throw/break/continue
                issues.append({
                    "type": "unreachable_code",
                    "line": j + 1,
                    "message": f"Potentially unreachable code on line {j + 1} after '{stripped.split()[0]}' on line {i}",
                })
                break

    return issues


# ============================================================
# CHECK: Trailing commas in function calls (IE compat)
# ============================================================

def check_trailing_commas(content: str) -> list[dict]:
    issues = []
    code = get_code_only(content)

    # ,) or ,] patterns (trailing comma before closing bracket)
    pattern = re.compile(r",\s*[\)\]]")

    for i, line in enumerate(code.split("\n"), 1):
        for m in pattern.finditer(line):
            issues.append({
                "type": "trailing_comma",
                "line": i,
                "message": f"Trailing comma before closing bracket on line {i}",
            })

    return issues


# ============================================================
# CHECK: Empty catch blocks
# ============================================================

def check_empty_catch(content: str) -> list[dict]:
    issues = []
    code = get_code_only(content)

    # catch (...) { } with nothing inside
    pattern = re.compile(r"\bcatch\s*\([^)]*\)\s*\{\s*\}", re.DOTALL)

    for m in pattern.finditer(code):
        line = code[:m.start()].count("\n") + 1
        issues.append({
            "type": "empty_catch",
            "line": line,
            "message": f"Empty catch block on line {line} — errors are silently swallowed",
        })

    return issues


# ============================================================
# CHECK: Unused variables (heuristic)
# ============================================================

def check_unused_variables(content: str) -> list[dict]:
    issues = []
    code = get_code_only(content)

    # Find const/let declarations
    decl_pattern = re.compile(r"\b(?:const|let)\s+(\w+)\s*=")

    for m in decl_pattern.finditer(code):
        var_name = m.group(1)
        decl_pos = m.end()

        # Skip common patterns: destructuring, exports, etc.
        if var_name in ("_", "__", "exports", "module"):
            continue

        # Count occurrences of the variable name in code after declaration
        rest = code[decl_pos:]
        # Use word boundary to avoid partial matches
        occurrences = len(re.findall(r"\b" + re.escape(var_name) + r"\b", rest))

        if occurrences == 0:
            line = code[:m.start()].count("\n") + 1
            issues.append({
                "type": "unused_variable",
                "line": line,
                "message": f"Variable '{var_name}' declared on line {line} appears unused",
            })

    return issues


# ============================================================
# CHECK: Suspicious assignments in conditions
# ============================================================

def check_assignment_in_condition(content: str) -> list[dict]:
    issues = []
    code = get_code_only(content)

    # if (...=...) or while (...=...) — single = inside condition
    pattern = re.compile(r"\b(if|while)\s*\(")

    for i, line in enumerate(code.split("\n"), 1):
        for m in pattern.finditer(line):
            # Extract the condition part (simplified — just the rest of the line)
            rest = line[m.end():]
            # Look for single = that's not ==, ===, !=, !==, <=, >=, =>
            if re.search(r"(?<!=)(?<!!)(?<!<)(?<!>)=(?!=)(?!>)", rest):
                # Skip if it's clearly intentional (e.g. while (line = reader.read()))
                issues.append({
                    "type": "assignment_in_condition",
                    "line": i,
                    "message": f"Possible accidental assignment '=' in '{m.group(1)}' condition on line {i} (use '===' ?)",
                })

    return issues


# ============================================================
# CHECK: Missing semicolons (heuristic)
# ============================================================

def check_missing_semicolons(content: str) -> list[dict]:
    issues = []
    code = get_code_only(content)
    lines = code.split("\n")

    # Patterns that should end with semicolons
    needs_semi = re.compile(
        r"^\s*("
        r"(const|let|var)\s+\w+.*[^;{,]\s*$|"       # variable declarations
        r"return\s+.+[^;{,]\s*$|"                     # return statements
        r"throw\s+.+[^;{,]\s*$|"                      # throw statements
        r"\w+\s*\(.*\)\s*$"                            # function calls
        r")"
    )

    # Lines that legitimately don't need semicolons
    no_semi_needed = re.compile(
        r"^\s*("
        r"(if|else|for|while|do|switch|try|catch|finally|class|function)\b|"
        r"[{}]|"
        r"//|/\*|"
        r"$"
        r")"
    )

    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if not stripped:
            continue
        if no_semi_needed.match(stripped):
            continue
        # Only flag obvious cases: lines ending with ) that aren't control flow
        if stripped.endswith(")") and not re.match(r"^\s*(if|for|while|switch|catch|function)\b", stripped):
            # Check next line — if it starts with . or ? it's a chain
            if i < len(lines):
                next_stripped = lines[i].strip() if i < len(lines) else ""
                if next_stripped.startswith(".") or next_stripped.startswith("?"):
                    continue
            issues.append({
                "type": "missing_semicolon",
                "line": i,
                "message": f"Possibly missing semicolon at end of line {i}",
            })

    return issues


# ============================================================
# CHECK: TODO/FIXME/HACK/XXX comments
# ============================================================

def check_todo_comments(content: str) -> list[dict]:
    issues = []
    for tok_type, tok_val, tok_line in tokenize_js(content):
        if tok_type == "comment":
            for keyword in ("TODO", "FIXME", "HACK", "XXX", "BUG"):
                if keyword in tok_val.upper():
                    # Extract the comment text
                    clean = tok_val.replace("//", "").replace("/*", "").replace("*/", "").strip()
                    if len(clean) > 80:
                        clean = clean[:77] + "..."
                    issues.append({
                        "type": "todo_comment",
                        "line": tok_line,
                        "message": f"{keyword} comment on line {tok_line}: {clean}",
                    })
                    break  # one issue per comment
    return issues


# ============================================================
# CHECK: Very long lines
# ============================================================

def check_long_lines(content: str, max_length: int = 300) -> list[dict]:
    issues = []
    for i, line in enumerate(content.split("\n"), 1):
        if len(line) > max_length:
            issues.append({
                "type": "long_line",
                "line": i,
                "message": f"Line {i} is {len(line)} chars (>{max_length}) — possibly minified or needs wrapping",
            })
    return issues


# ============================================================
# CHECK: Common typos and mistakes
# ============================================================

def check_common_mistakes(content: str) -> list[dict]:
    issues = []
    code = get_code_only(content)

    checks = [
        (r"\btypeof\s+\w+\s*===?\s*['\"]undefined['\"]", None),  # valid
        (r"\btypeof\s+\w+\s*===?\s*['\"]undefine['\"]", "Typo: 'undefine' should be 'undefined'"),
        (r"\btypeof\s+\w+\s*===?\s*['\"]sting['\"]", "Typo: 'sting' should be 'string'"),
        (r"\btypeof\s+\w+\s*===?\s*['\"]boolen['\"]", "Typo: 'boolen' should be 'boolean'"),
        (r"\btypeof\s+\w+\s*===?\s*['\"]nubmer['\"]", "Typo: 'nubmer' should be 'number'"),
        (r"\btypeof\s+\w+\s*===?\s*['\"]fucntion['\"]", "Typo: 'fucntion' should be 'function'"),
        (r"\btypeof\s+\w+\s*===?\s*['\"]obejct['\"]", "Typo: 'obejct' should be 'object'"),
        (r"\b(document\.getElementByID)\b", "Typo: 'getElementByID' should be 'getElementById'"),
        (r"\b(document\.getElementByClassName)\b", "Typo: should be 'getElementsByClassName' (plural)"),
        (r"\b(document\.getElementByTagName)\b", "Typo: should be 'getElementsByTagName' (plural)"),
        (r"\b(\.addEventListner)\b", "Typo: 'addEventListner' should be 'addEventListener'"),
        (r"\b(\.removeEventListner)\b", "Typo: 'removeEventListner' should be 'removeEventListener'"),
        (r"\b(\.getElementByid)\b", "Typo: 'getElementByid' should be 'getElementById'"),
        (r"\b(\.innerHtml)\b", "Typo: 'innerHtml' should be 'innerHTML' (capital HTML)"),
        (r"\b(\.outerHtml)\b", "Typo: 'outerHtml' should be 'outerHTML' (capital HTML)"),
        (r"\b(\.classlist)\b", "Typo: 'classlist' should be 'classList' (capital L)"),
        (r"\b(\.parentnode)\b", "Typo: 'parentnode' should be 'parentNode' (capital N)"),
        (r"\b(\.childnodes)\b", "Typo: 'childnodes' should be 'childNodes' (capital N)"),
        (r"\b(\.firstchild)\b", "Typo: 'firstchild' should be 'firstChild' (capital C)"),
        (r"\b(\.lastchild)\b", "Typo: 'lastchild' should be 'lastChild' (capital C)"),
        (r"\b(\.nextsibling)\b", "Typo: 'nextsibling' should be 'nextSibling' (capital S)"),
        (r"\b(\.previoussibling)\b", "Typo: 'previoussibling' should be 'previousSibling' (capital S)"),
        (r"\b(\.textcontent)\b", "Typo: 'textcontent' should be 'textContent' (capital C)"),
        (r"\b(\.setattribute)\b", "Typo: 'setattribute' should be 'setAttribute' (capital A)"),
        (r"\b(\.getattribute)\b", "Typo: 'getattribute' should be 'getAttribute' (capital A)"),
        (r"\b(\.removeattribute)\b", "Typo: 'removeattribute' should be 'removeAttribute' (capital A)"),
        (r"\b(\.createelement)\b", "Typo: 'createelement' should be 'createElement' (capital E)"),
        (r"\b(\.appendchild)\b", "Typo: 'appendchild' should be 'appendChild' (capital C)"),
        (r"\b(\.removechild)\b", "Typo: 'removechild' should be 'removeChild' (capital C)"),
        (r"\b(\.queryselector)\b", "Typo: 'queryselector' should be 'querySelector' (capital S)"),
        (r"\b(\.queryselectorall)\b", "Typo: 'queryselectorall' should be 'querySelectorAll' (capital S, A)"),
        (r"\b(\.stoppropagation)\b", "Typo: 'stoppropagation' should be 'stopPropagation' (capital P)"),
        (r"\b(\.preventdefault)\b", "Typo: 'preventdefault' should be 'preventDefault' (capital D)"),
        (r"\b(JSON\.Stringify)\b", "Typo: 'JSON.Stringify' should be 'JSON.stringify' (lowercase s)"),
        (r"\b(JSON\.Parse)\b", "Typo: 'JSON.Parse' should be 'JSON.parse' (lowercase p)"),
        (r"\b(math\.random)\b", "Typo: 'math.random' should be 'Math.random' (capital M)"),
        (r"\b(math\.floor)\b", "Typo: 'math.floor' should be 'Math.floor' (capital M)"),
        (r"\b(math\.ceil)\b", "Typo: 'math.ceil' should be 'Math.ceil' (capital M)"),
        (r"\b(math\.round)\b", "Typo: 'math.round' should be 'Math.round' (capital M)"),
        (r"\b(math\.max)\b", "Typo: 'math.max' should be 'Math.max' (capital M)"),
        (r"\b(math\.min)\b", "Typo: 'math.min' should be 'Math.min' (capital M)"),
        (r"\b(math\.abs)\b", "Typo: 'math.abs' should be 'Math.abs' (capital M)"),
        (r"\b(math\.PI)\b", "Typo: 'math.PI' should be 'Math.PI' (capital M)"),
        (r"\b(\.touppercase)\b", "Typo: 'touppercase' should be 'toUpperCase' (camelCase)"),
        (r"\b(\.tolowercase)\b", "Typo: 'tolowercase' should be 'toLowerCase' (camelCase)"),
        (r"\b(\.indexof)\b", "Typo: 'indexof' should be 'indexOf' (capital O)"),
        (r"\b(\.lastindexof)\b", "Typo: 'lastindexof' should be 'lastIndexOf' (capital I, O)"),
        (r"\b(\.isnan)\b", "Typo: 'isnan' should be 'isNaN' (capital N)"),
        (r"\b(\.parseint)\b", "Typo: 'parseint' should be 'parseInt' (capital I)"),
        (r"\b(\.parsefloat)\b", "Typo: 'parsefloat' should be 'parseFloat' (capital F)"),
        (r"\b(\.addeventlistener)\b", "Typo: 'addeventlistener' should be 'addEventListener' (camelCase)"),
        (r"\b(\.removeeventlistener)\b", "Typo: 'removeeventlistener' should be 'removeEventListener' (camelCase)"),
        (r"\bsetTimout\b", "Typo: 'setTimout' should be 'setTimeout'"),
        (r"\bsetInteval\b", "Typo: 'setInteval' should be 'setInterval'"),
        (r"\bclearTimout\b", "Typo: 'clearTimout' should be 'clearTimeout'"),
        (r"\bclearInteval\b", "Typo: 'clearInteval' should be 'clearInterval'"),
        (r"\bdocuemnt\b", "Typo: 'docuemnt' should be 'document'"),
        (r"\bwidnow\b", "Typo: 'widnow' should be 'window'"),
        (r"\bfunciton\b", "Typo: 'funciton' should be 'function'"),
        (r"\bretrun\b", "Typo: 'retrun' should be 'return'"),
        (r"\blenght\b", "Typo: 'lenght' should be 'length'"),
        (r"\b\.lenght\b", "Typo: '.lenght' should be '.length'"),
        (r"\bfalse\s*=[^=]", "Possible mistake: assigning to 'false'"),
        (r"\btrue\s*=[^=]", "Possible mistake: assigning to 'true'"),
        (r"\bnull\s*=[^=]", "Possible mistake: assigning to 'null'"),
        (r"\bundefined\s*=[^=]", "Possible mistake: assigning to 'undefined'"),
    ]

    for i, line in enumerate(code.split("\n"), 1):
        for pattern, msg in checks:
            if msg is None:
                continue
            if re.search(pattern, line):
                issues.append({
                    "type": "common_mistake",
                    "line": i,
                    "message": f"Line {i}: {msg}",
                })

    return issues


# ============================================================
# CHECK: Duplicate object keys
# ============================================================

def check_duplicate_object_keys(content: str) -> list[dict]:
    issues = []
    code = get_code_only(content)

    # Simple heuristic: find object literals and check for duplicate keys
    # Look for patterns like { key: ..., key: ... }
    # This is simplified — a full AST would be needed for perfect accuracy

    # Find key: value patterns inside what looks like object literals
    key_pattern = re.compile(r"(?:^|[{,])\s*(\w+)\s*:", re.MULTILINE)

    # Track brace depth to group keys by object
    lines = code.split("\n")
    brace_depth = 0
    keys_at_depth: dict[int, dict[str, list[int]]] = {}

    for i, line in enumerate(lines, 1):
        for ch in line:
            if ch == "{":
                brace_depth += 1
                keys_at_depth[brace_depth] = {}
            elif ch == "}":
                # Check for duplicates at this depth before leaving
                if brace_depth in keys_at_depth:
                    for key, key_lines in keys_at_depth[brace_depth].items():
                        if len(key_lines) > 1:
                            issues.append({
                                "type": "duplicate_key",
                                "line": key_lines[1],
                                "message": f"Duplicate object key '{key}' on lines {', '.join(str(l) for l in key_lines)}",
                            })
                    del keys_at_depth[brace_depth]
                brace_depth = max(0, brace_depth - 1)

        # Find keys on this line
        for m in key_pattern.finditer(line):
            key = m.group(1)
            if brace_depth > 0 and brace_depth in keys_at_depth:
                keys_at_depth[brace_depth].setdefault(key, []).append(i)

    return issues


# ============================================================
# CHECK: File-level issues
# ============================================================

def check_file_issues(content: str, filepath: Path) -> list[dict]:
    issues = []

    # Empty file
    if not content.strip():
        issues.append({
            "type": "empty_file",
            "line": 1,
            "message": "File is empty",
        })
        return issues

    # BOM marker
    if content.startswith("\ufeff") or content.encode("utf-8").startswith(b"\xef\xbb\xbf"):
        issues.append({
            "type": "bom",
            "line": 1,
            "message": "File contains a UTF-8 BOM marker — can cause issues with module imports",
        })

    # Mixed line endings
    has_crlf = "\r\n" in content
    has_lf = "\n" in content.replace("\r\n", "")
    if has_crlf and has_lf:
        issues.append({
            "type": "mixed_line_endings",
            "line": 1,
            "message": "File has mixed line endings (CRLF and LF) — normalize to LF",
        })

    # Trailing whitespace on lines (just count, don't report each line)
    trailing_count = sum(1 for line in content.split("\n") if line != line.rstrip() and line.strip())
    if trailing_count > 10:
        issues.append({
            "type": "trailing_whitespace",
            "line": 0,
            "message": f"{trailing_count} lines have trailing whitespace",
        })

    # Tab/space mixing for indentation
    has_tab_indent = False
    has_space_indent = False
    for line in content.split("\n")[:200]:  # check first 200 lines
        if line.startswith("\t"):
            has_tab_indent = True
        elif line.startswith("  "):
            has_space_indent = True
    if has_tab_indent and has_space_indent:
        issues.append({
            "type": "mixed_indentation",
            "line": 1,
            "message": "File mixes tabs and spaces for indentation — pick one",
        })

    return issues


# ============================================================
# CHECK: alert() calls
# ============================================================

def check_alert_calls(content: str) -> list[dict]:
    issues = []
    code = get_code_only(content)

    for i, line in enumerate(code.split("\n"), 1):
        if re.search(r"\balert\s*\(", line.strip()):
            issues.append({
                "type": "alert_call",
                "line": i,
                "message": f"alert() call on line {i} — remove before production",
            })

    return issues


# ============================================================
# CHECK: eval() usage
# ============================================================

def check_eval_usage(content: str) -> list[dict]:
    issues = []
    code = get_code_only(content)

    for i, line in enumerate(code.split("\n"), 1):
        if re.search(r"\beval\s*\(", line.strip()):
            issues.append({
                "type": "eval_usage",
                "line": i,
                "message": f"eval() used on line {i} — security risk, avoid if possible",
            })

    return issues


# ============================================================
# CHECK: Implied globals (function-level heuristic)
# ============================================================

def check_implied_globals(content: str) -> list[dict]:
    """
    Detect assignments to undeclared variables (no var/let/const/window. prefix).
    Very heuristic — only flags obvious cases.
    """
    issues = []
    code = get_code_only(content)

    # Known browser/node globals
    known_globals = {
        "window", "document", "console", "navigator", "location", "history",
        "localStorage", "sessionStorage", "fetch", "XMLHttpRequest",
        "setTimeout", "setInterval", "clearTimeout", "clearInterval",
        "requestAnimationFrame", "cancelAnimationFrame",
        "alert", "confirm", "prompt", "performance", "crypto",
        "module", "exports", "require", "global", "process", "__dirname", "__filename",
        "Map", "Set", "WeakMap", "WeakSet", "Promise", "Proxy", "Reflect",
        "Symbol", "BigInt", "Array", "Object", "String", "Number", "Boolean",
        "RegExp", "Date", "Error", "TypeError", "RangeError", "JSON", "Math",
        "Intl", "URL", "URLSearchParams", "FormData", "Blob", "File",
        "Event", "CustomEvent", "MutationObserver", "IntersectionObserver",
        "ResizeObserver", "AbortController", "TextEncoder", "TextDecoder",
        "self", "this", "arguments", "undefined", "NaN", "Infinity",
        "true", "false", "null", "void", "new", "delete", "typeof", "instanceof",
        "tf", "Plotly", "jQuery", "$", "Prism", "temml", "MathJax", "katex",
        "hljs", "d3", "Chart", "google", "gtag", "ga", "fbq",
    }

    # Find all declared variables in the file
    declared = set()
    decl_pattern = re.compile(r"\b(?:const|let|var|function)\s+(\w+)")
    param_pattern = re.compile(r"\bfunction\s*\w*\s*\(([^)]*)\)")
    arrow_pattern = re.compile(r"\(([^)]*)\)\s*=>")

    for m in decl_pattern.finditer(code):
        declared.add(m.group(1))
    for m in param_pattern.finditer(code):
        for param in m.group(1).split(","):
            p = param.strip().split("=")[0].strip().lstrip(".")
            if p:
                declared.add(p)
    for m in arrow_pattern.finditer(code):
        for param in m.group(1).split(","):
            p = param.strip().split("=")[0].strip().lstrip(".")
            if p:
                declared.add(p)

    # Also pick up for...in / for...of loop variables
    for m in re.finditer(r"\bfor\s*\(\s*(?:const|let|var)\s+(\w+)", code):
        declared.add(m.group(1))

    # Also pick up destructuring (simplified)
    for m in re.finditer(r"\b(?:const|let|var)\s*\{([^}]+)\}", code):
        for name in re.findall(r"\b(\w+)\b", m.group(1)):
            declared.add(name)
    for m in re.finditer(r"\b(?:const|let|var)\s*\[([^\]]+)\]", code):
        for name in re.findall(r"\b(\w+)\b", m.group(1)):
            declared.add(name)

    return issues


# ============================================================
# SEVERITY HELPERS
# ============================================================

CRITICAL_TYPES = {
    "unclosed_bracket", "mismatched_bracket", "unexpected_bracket",
    "unclosed_string", "unclosed_template", "unclosed_comment",
    "debugger",
}

WARNING_TYPES = {
    "empty_catch", "eval_usage", "assignment_in_condition",
    "unreachable_code", "duplicate_function", "duplicate_key",
    "alert_call", "common_mistake", "multiline_string",
    "bom", "mixed_line_endings", "mixed_indentation",
}

INFO_TYPES = {
    "console_log", "todo_comment", "loose_equality", "var_usage",
    "trailing_comma", "missing_semicolon", "long_line",
    "trailing_whitespace", "unused_variable", "empty_file",
}


def severity_style(issue_type: str) -> str:
    if issue_type in CRITICAL_TYPES:
        return "bold red"
    elif issue_type in WARNING_TYPES:
        return "bold yellow"
    else:
        return "bold blue"


def severity_icon(issue_type: str) -> str:
    if issue_type in CRITICAL_TYPES:
        return "❌"
    elif issue_type in WARNING_TYPES:
        return "⚠️"
    else:
        return "ℹ️"


def severity_label(issue_type: str) -> str:
    if issue_type in CRITICAL_TYPES:
        return "error"
    elif issue_type in WARNING_TYPES:
        return "warning"
    else:
        return "info"


# ============================================================
# MAIN
# ============================================================

def main():
    console.print()
    console.print(Panel(
        "[bold bright_cyan]📜 JavaScript File Validator[/]\n\n"
        "[dim]Checks JS files for:[/]\n"
        "  [bold green]✓[/] Bracket / brace / paren balance\n"
        "  [bold green]✓[/] Unclosed strings, template literals, block comments\n"
        "  [bold green]✓[/] console.log / debugger / alert / eval statements\n"
        "  [bold green]✓[/] Loose equality (== vs ===)\n"
        "  [bold green]✓[/] var usage (prefer let/const)\n"
        "  [bold green]✓[/] Empty catch blocks\n"
        "  [bold green]✓[/] Unreachable code after return/throw\n"
        "  [bold green]✓[/] Duplicate function names & object keys\n"
        "  [bold green]✓[/] Assignment in conditions (if/while)\n"
        "  [bold green]✓[/] Common DOM API typos & case errors\n"
        "  [bold green]✓[/] TODO/FIXME/HACK comments\n"
        "  [bold green]✓[/] Unused variables (heuristic)\n"
        "  [bold green]✓[/] File issues (BOM, mixed endings, indentation)\n"
        "  [bold green]✓[/] Very long lines (>300 chars)\n\n"
        "[dim]Usage:[/]\n"
        "  [bold]js_validator.py[/]                          [dim]# current directory[/]\n"
        "  [bold]js_validator.py src/[/]                     [dim]# single folder[/]\n"
        "  [bold]js_validator.py app.js lib/[/]              [dim]# file + folder[/]\n"
        "  [bold]js_validator.py src/ scripts/ *.js[/]       [dim]# multiple mixed[/]\n"
        '  [bold]js_validator.py "src/**/*.js"[/]            [dim]# glob pattern[/]\n\n'
        f"[dim]Ignored files:[/] [bold yellow]{', '.join(sorted(IGNORE_FILENAMES))}[/]",
        title="[bold bright_white]JS Validator[/]",
        border_style="bright_cyan",
        padding=(1, 3),
    ))
    console.print()

    # Resolve all inputs
    targets = sys.argv[1:]
    js_files = resolve_inputs(targets)

    if not targets:
        console.print(f"[bold]Scanning:[/] {Path('.').resolve()} [dim](no arguments — using current directory)[/]")
    else:
        console.print(f"[bold]Targets:[/] {', '.join(targets)}")
    console.print()

    if not js_files:
        console.print("[bold yellow]No JS files found for the given input(s).[/]")
        sys.exit(0)

    console.print(f"[bold]Found:[/] {len(js_files)} JS file(s)\n")

    # Common base for relative paths
    try:
        common_base = Path(os.path.commonpath(js_files))
        if common_base.is_file():
            common_base = common_base.parent
    except ValueError:
        common_base = Path(".")

    # ── Run all checks ──────────────────────────────────────
    all_checkers = [
        ("Brackets",        lambda c, f: check_bracket_balance(c)),
        ("Strings",         lambda c, f: check_unclosed_strings(c)),
        ("Comments",        lambda c, f: check_unclosed_comments(c)),
        ("console.*",       lambda c, f: check_console_logs(c)),
        ("debugger",        lambda c, f: check_debugger_statements(c)),
        ("alert()",         lambda c, f: check_alert_calls(c)),
        ("eval()",          lambda c, f: check_eval_usage(c)),
        ("Loose ==",        lambda c, f: check_loose_equality(c)),
        ("var usage",       lambda c, f: check_var_usage(c)),
        ("Empty catch",     lambda c, f: check_empty_catch(c)),
        ("Unreachable",     lambda c, f: check_unreachable_code(c)),
        ("Duplicates",      lambda c, f: check_duplicate_declarations(c)),
        ("Dup keys",        lambda c, f: check_duplicate_object_keys(c)),
        ("Assign in cond",  lambda c, f: check_assignment_in_condition(c)),
        ("Typos",           lambda c, f: check_common_mistakes(c)),
        ("TODOs",           lambda c, f: check_todo_comments(c)),
        ("Unused vars",     lambda c, f: check_unused_variables(c)),
        ("Long lines",      lambda c, f: check_long_lines(c)),
        ("File issues",     lambda c, f: check_file_issues(c, f)),
    ]

    results = []  # (filepath, all_issues_list)

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        MofNCompleteColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("Checking JS files...", total=len(js_files))

        for filepath in js_files:
            progress.update(task, description=f"Checking {filepath.name}...")

            try:
                content = filepath.read_text(encoding="utf-8", errors="replace")
            except Exception as e:
                results.append((filepath, [("read_error", 0, f"Cannot read file: {e}")]))
                progress.advance(task)
                continue

            file_issues = []
            for checker_name, checker_fn in all_checkers:
                try:
                    issues = checker_fn(content, filepath)
                    for issue in issues:
                        file_issues.append((issue["type"], issue["line"], issue["message"]))
                except Exception as e:
                    file_issues.append(("checker_error", 0, f"Checker '{checker_name}' crashed: {e}"))

            results.append((filepath, file_issues))
            progress.advance(task)

    # ── Display results ─────────────────────────────────────
    console.print()
    console.print(Rule(title="[bold bright_cyan]Results[/]", style="bright_blue"))
    console.print()

    total_files = len(results)
    files_with_issues = 0
    total_issues = 0
    error_count = 0
    warning_count = 0
    info_count = 0

    for filepath, file_issues in results:
        if not file_issues:
            continue

        files_with_issues += 1
        total_issues += len(file_issues)

        try:
            rel_path = filepath.relative_to(common_base)
        except ValueError:
            rel_path = filepath

        tree = Tree(f"[bold bright_white]📄 {rel_path}[/]")

        for issue_type, line, message in file_issues:
            icon = severity_icon(issue_type)
            style = severity_style(issue_type)
            line_info = f"[dim]line {line}:[/] " if line > 0 else ""
            tree.add(f"{icon} {line_info}[{style}]{message}[/]")

            if issue_type in CRITICAL_TYPES:
                error_count += 1
            elif issue_type in WARNING_TYPES:
                warning_count += 1
            else:
                info_count += 1

        console.print(tree)
        console.print()

    # ── Summary table ───────────────────────────────────────
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
    summary_table.add_row(
        "Ignored (vendored)",
        str(len(IGNORE_FILENAMES)),
        "[dim]⏭️[/]",
    )

    if files_with_issues == 0:
        summary_table.add_row("Files with issues", "0", "[bold green]✅ All clean![/]")
    else:
        summary_table.add_row(
            "Files with issues",
            f"[bold red]{files_with_issues}[/]",
            f"[bold red]⚠️  {files_with_issues}/{total_files}[/]",
        )

    summary_table.add_row("", "", "")

    if error_count > 0:
        summary_table.add_row("❌ Errors", f"[bold red]{error_count}[/]", "[bold red]must fix[/]")
    else:
        summary_table.add_row("❌ Errors", "0", "[green]✓[/]")

    if warning_count > 0:
        summary_table.add_row("⚠️  Warnings", f"[bold yellow]{warning_count}[/]", "[bold yellow]should fix[/]")
    else:
        summary_table.add_row("⚠️  Warnings", "0", "[green]✓[/]")

    if info_count > 0:
        summary_table.add_row("ℹ️  Info", f"[bold blue]{info_count}[/]", "[bold blue]consider[/]")
    else:
        summary_table.add_row("ℹ️  Info", "0", "[green]✓[/]")

    summary_table.add_row("", "", "")
    summary_table.add_row(
        "[bold]Total issues[/]",
        f"[bold]{total_issues}[/]",
        "[bold green]🎉 PASS[/]" if total_issues == 0 else f"[bold red]🚨 {total_issues} issue(s)[/]",
    )

    console.print(summary_table)
    console.print()

    clean_files = total_files - files_with_issues
    if clean_files > 0 and files_with_issues > 0:
        console.print(f"  [dim]{clean_files} file(s) passed all checks without issues.[/]")
        console.print()

    # Exit code: fail only on errors, not on info/warnings
    if error_count > 0:
        sys.exit(1)
    else:
        if total_issues == 0:
            console.print(Panel(
                "[bold bright_green]All JS files passed validation! 🎉[/]",
                border_style="green",
                padding=(0, 2),
            ))
        else:
            console.print(Panel(
                f"[bold bright_yellow]No critical errors — {warning_count} warning(s), {info_count} info(s)[/]",
                border_style="yellow",
                padding=(0, 2),
            ))
        sys.exit(0)


if __name__ == "__main__":
    main()
