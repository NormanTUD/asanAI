"""JavaScript coverage collection for the in-browser Toolkit test suite.

Coverage is collected through the Chrome DevTools Protocol
(``Profiler.startPreciseCoverage``), so the numbers describe exactly what the
browser executed while ``tests.js`` ran.  Only project-owned scripts are
reported; vendored trees (``libs/``, ``tf/``, ``blog/``, ...) are filtered out.

The public entry point is :class:`JsCoverage`, which ``_run_tests.py`` starts
before navigating and flushes in its ``finally`` block after the run.
"""

import bisect
import html
import json
import logging
import os
import posixpath
import time
import urllib.parse

DEFAULT_EXCLUDED_DIRS = frozenset({
    "blog",
    "class_test_images",
    "cosmo",
    "cosmo_examples",
    "cosmo_ok",
    "css",
    "documentation",
    "failed_tests",
    "feedback_data",
    "icons",
    "images",
    "lang",
    "libs",
    "manual",
    "matomo",
    "node_modules",
    "presentation",
    "praesentation",
    "tests",
    "tf",
    "todo",
    "traindata",
})

DEFAULT_EXCLUDED_FILES = frozenset({"tests.js"})

HTML_STYLE = """
:root { color-scheme: light dark; }
body { font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
       margin: 0; padding: 24px; background: #faf8f1; color: #1f2933; }
html.dark body { background: #0f172a; color: #e2e8f0; }
h1 { font-size: 20px; margin: 0 0 4px; }
h2 { font-size: 16px; margin: 24px 0 8px; }
.muted { color: #64748b; }
.bar { display: inline-block; width: 120px; height: 8px; border-radius: 4px;
       background: #e2e8f0; overflow: hidden; vertical-align: middle; }
.bar > span { display: block; height: 100%; background: #16a34a; }
.bar.low > span { background: #dc2626; }
.bar.mid > span { background: #d97706; }
table { border-collapse: collapse; width: 100%; max-width: 1100px; }
th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #d8dde4; }
html.dark th, html.dark td { border-color: #263449; }
a { color: #2563eb; } html.dark a { color: #7dd3fc; }
pre.source { font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
             margin: 0; padding: 12px 0; max-width: 100%; overflow-x: auto; }
.line { display: block; white-space: pre; }
.line .ln { display: inline-block; width: 64px; padding-right: 12px; text-align: right;
            color: #94a3b8; user-select: none; }
.line.uncovered { background: rgba(220, 38, 38, 0.18); }
.line.partial { background: rgba(217, 119, 6, 0.18); }
.line.covered { background: rgba(22, 163, 74, 0.10); }
.legend span { display: inline-block; margin-right: 16px; padding: 2px 6px; border-radius: 3px; }
"""


def _line_starts(source):
    """Return UTF-16 line start offsets and the total UTF-16 length.

    V8 reports coverage offsets in UTF-16 code units, so Python string indices
    are not interchangeable for sources that contain astral characters.
    """
    starts = [0]
    offset = 0
    for char in source:
        offset += 2 if ord(char) > 0xFFFF else 1
        if char == "\n":
            starts.append(offset)
    return starts, offset


def _line_of(starts, offset):
    return max(0, bisect.bisect_right(starts, offset) - 1)


def _effective_segments(ranges, source_length):
    """Flatten nested V8 ranges into disjoint ``(start, end, count)`` pieces.

    A range's count only applies where no child range overrides it.  Treating
    every range as an independent hit would mark the bodies of never-called
    functions as covered because their enclosing script range has count 1.
    """
    clean = set()
    for item in ranges:
        start = int(item.get("startOffset", 0))
        end = int(item.get("endOffset", 0))
        count = int(item.get("count", 0))
        if end <= start:
            continue
        start = max(0, start)
        end = min(source_length, end)
        if end <= start:
            continue
        clean.add((start, end, count))

    if not clean:
        return []

    ordered = sorted(clean, key=lambda r: (r[0], -r[1]))
    root = {"start": 0, "end": source_length, "count": 0, "children": []}
    stack = [root]

    for start, end, count in ordered:
        while len(stack) > 1 and stack[-1]["end"] <= start:
            stack.pop()
        node = {"start": start, "end": end, "count": count, "children": []}
        stack[-1]["children"].append(node)
        stack.append(node)

    segments = []

    def visit(node, emit_gaps):
        cursor = node["start"]
        for child in sorted(node["children"], key=lambda n: (n["start"], -n["end"])):
            child_start = max(child["start"], cursor)
            if emit_gaps and cursor < child_start:
                segments.append((cursor, child_start, node["count"]))
            visit(child, True)
            cursor = max(cursor, child["end"])
        if emit_gaps and cursor < node["end"]:
            segments.append((cursor, node["end"], node["count"]))

    visit(root, False)
    return segments


def _uncovered_ranges(line_numbers):
    ranges = []
    for line in line_numbers:
        if ranges and ranges[-1][1] + 1 == line:
            ranges[-1][1] = line
        else:
            ranges.append([line, line])
    return ranges


def _format_ranges(ranges):
    return ", ".join(str(a) if a == b else f"{a}-{b}" for a, b in ranges)


def _percent(covered, total):
    return 100.0 if total == 0 else round(100.0 * covered / total, 2)


def _analyze_script(source, functions):
    starts, source_length = _line_starts(source)
    line_count = len(starts)
    executable = [False] * line_count
    hits = [0] * line_count
    positive = [False] * line_count
    zero = [False] * line_count

    all_ranges = []
    for function in functions:
        all_ranges.extend(function.get("ranges") or [])

    for start, end, count in _effective_segments(all_ranges, source_length):
        first_line = _line_of(starts, start)
        last_line = _line_of(starts, end - 1)
        for line in range(first_line, last_line + 1):
            executable[line] = True
            if count > hits[line]:
                hits[line] = count
            if count > 0:
                positive[line] = True
            else:
                zero[line] = True

    executable_lines = [i for i in range(line_count) if executable[i]]
    covered_lines = [i for i in executable_lines if hits[i] > 0]
    uncovered = [i + 1 for i in executable_lines if hits[i] == 0]
    partial = [i + 1 for i in executable_lines if positive[i] and zero[i]]

    seen_functions = set()
    total_functions = 0
    covered_functions = 0
    untested_functions = []
    for function in functions:
        ranges = function.get("ranges") or []
        if not ranges:
            continue
        first_range = ranges[0]
        key = (function.get("functionName", ""), int(first_range.get("startOffset", 0)))
        if key in seen_functions:
            continue
        seen_functions.add(key)
        total_functions += 1
        name = function.get("functionName") or ""
        count = int(first_range.get("count", 0))
        if count > 0:
            covered_functions += 1
        elif name:
            start_offset = int(first_range.get("startOffset", 0))
            end_offset = int(first_range.get("endOffset", start_offset))
            start_line = _line_of(starts, start_offset) + 1
            end_line = _line_of(starts, max(start_offset, end_offset - 1)) + 1
            untested_functions.append({
                "name": name,
                "start_line": start_line,
                "end_line": end_line,
                "lines": end_line - start_line + 1,
                "start_offset": start_offset,
                "end_offset": end_offset,
            })

    # A nested function inside an untested parent adds no information to the
    # priority list; keep only the outermost untested ranges.
    outermost = []
    for function in sorted(
        untested_functions, key=lambda item: (item["start_offset"], -item["end_offset"])
    ):
        if any(
            kept["start_offset"] <= function["start_offset"]
            and function["end_offset"] <= kept["end_offset"]
            for kept in outermost
        ):
            continue
        outermost.append(function)
    for function in outermost:
        function.pop("start_offset", None)
        function.pop("end_offset", None)

    return {
        "source": source,
        "line_count": line_count,
        "executable_lines": len(executable_lines),
        "covered_lines": len(covered_lines),
        "line_percent": _percent(len(covered_lines), len(executable_lines)),
        "uncovered_lines": _uncovered_ranges(uncovered),
        "partial_lines": _uncovered_ranges(partial),
        "line_hits": {str(i + 1): hits[i] for i in executable_lines},
        "functions_total": total_functions,
        "functions_covered": covered_functions,
        "function_percent": _percent(covered_functions, total_functions),
        "untested_functions": outermost,
        "executable_mask": executable,
        "hits": hits,
        "positive": positive,
        "zero": zero,
        "starts": starts,
    }


class JsCoverage:
    def __init__(self, page, base_url, coverage_dir, extra_excluded=(), project_root=None):
        self.page = page
        self.base_url = base_url
        self.coverage_dir = coverage_dir
        self.project_root = project_root
        self.extra_excluded = []
        for item in extra_excluded:
            cleaned = item.strip().replace("\\", "/").lstrip("./").strip("/")
            if cleaned:
                self.extra_excluded.append(cleaned)
        self._session = None
        self._base = urllib.parse.urlsplit(base_url)
        self._source_cache = {}

    async def start(self):
        self._session = await self.page.context.new_cdp_session(self.page)
        await self._session.send("Debugger.enable")
        await self._session.send("Profiler.enable")
        await self._session.send(
            "Profiler.startPreciseCoverage",
            {"callCount": True, "detailed": True},
        )

    async def stop_and_report(self, browser_name):
        result = await self._session.send("Profiler.takePreciseCoverage")
        try:
            await self._session.send("Profiler.stopPreciseCoverage")
        except Exception:
            logging.debug("[coverage] Profiler.stopPreciseCoverage failed", exc_info=True)

        entries = result.get("result") or []
        report = await self._build_report(entries, browser_name)
        output_dir = os.path.join(self.coverage_dir, browser_name)
        write_reports(report, output_dir)
        _log_summary(report, output_dir)
        return report

    def _project_path(self, url):
        parts = urllib.parse.urlsplit(url)
        if parts.scheme not in ("http", "https"):
            return None
        if (parts.scheme, parts.netloc) != (self._base.scheme, self._base.netloc):
            return None

        path = urllib.parse.unquote(parts.path)
        lower = path.lower()
        if not lower.endswith(".js") or lower.endswith(".min.js"):
            return None

        base_dir = posixpath.dirname(self._base.path or "")
        if not base_dir.endswith("/"):
            base_dir += "/"
        if not path.startswith(base_dir):
            return None

        relative = path[len(base_dir):].lstrip("/")
        if not relative:
            return None
        if any(part in ("", ".", "..") for part in relative.split("/")):
            return None

        first = relative.split("/", 1)[0].lower()
        if first in DEFAULT_EXCLUDED_DIRS:
            return None
        if relative in DEFAULT_EXCLUDED_FILES:
            return None
        for prefix in self.extra_excluded:
            if relative == prefix or relative.startswith(prefix + "/"):
                return None
        return relative

    def _discover_project_files(self):
        if not self.project_root or not os.path.isdir(self.project_root):
            return []
        found = []
        for dirpath, dirnames, filenames in os.walk(self.project_root):
            dirnames[:] = sorted(
                name
                for name in dirnames
                if not name.startswith(".")
                and name.lower() not in DEFAULT_EXCLUDED_DIRS
            )
            relative_dir = os.path.relpath(dirpath, self.project_root)
            relative_dir = "" if relative_dir == "." else relative_dir.replace(os.sep, "/")
            for name in sorted(filenames):
                lower = name.lower()
                if not lower.endswith(".js") or lower.endswith(".min.js") or name.startswith("."):
                    continue
                relative = f"{relative_dir}/{name}" if relative_dir else name
                if relative in DEFAULT_EXCLUDED_FILES:
                    continue
                if any(
                    relative == prefix or relative.startswith(prefix + "/")
                    for prefix in self.extra_excluded
                ):
                    continue
                found.append(relative)
        return found

    async def _source_for(self, script_id):
        if script_id in self._source_cache:
            return self._source_cache[script_id]
        try:
            response = await self._session.send(
                "Debugger.getScriptSource", {"scriptId": script_id}
            )
            source = response.get("scriptSource")
        except Exception:
            logging.debug(
                "[coverage] Could not read source for script %s", script_id, exc_info=True
            )
            source = None
        self._source_cache[script_id] = source
        return source

    async def _build_report(self, entries, browser_name):
        scripts = {}
        for entry in entries:
            relative = self._project_path(entry.get("url", ""))
            if relative is None:
                continue
            script = scripts.setdefault(
                relative,
                {"relative": relative, "url": entry.get("url", ""), "functions": []},
            )
            script["functions"].extend(entry.get("functions") or [])

        files = []
        loaded_paths = set()
        total_executable = 0
        total_covered = 0
        total_functions = 0
        total_functions_covered = 0

        for relative in sorted(scripts):
            script = scripts[relative]
            sources = []
            for entry in entries:
                if self._project_path(entry.get("url", "")) == relative:
                    source = await self._source_for(entry.get("scriptId"))
                    if source is not None:
                        sources.append(source)
            if not sources:
                continue
            source = max(sources, key=len)

            analysis = _analyze_script(source, script["functions"])
            file_info = {
                "path": relative,
                "url": script["url"],
                "line_count": analysis["line_count"],
                "lines_total": analysis["executable_lines"],
                "lines_covered": analysis["covered_lines"],
                "line_percent": analysis["line_percent"],
                "functions_total": analysis["functions_total"],
                "functions_covered": analysis["functions_covered"],
                "function_percent": analysis["function_percent"],
                "uncovered_lines": analysis["uncovered_lines"],
                "partial_lines": analysis["partial_lines"],
                "line_hits": analysis["line_hits"],
                "untested_functions": analysis["untested_functions"],
                "not_loaded": False,
            }
            files.append((file_info, analysis, source, script["functions"]))
            loaded_paths.add(relative)

            total_executable += analysis["executable_lines"]
            total_covered += analysis["covered_lines"]
            total_functions += analysis["functions_total"]
            total_functions_covered += analysis["functions_covered"]

        not_loaded = []
        for relative in self._discover_project_files():
            if relative in loaded_paths:
                continue
            full_path = os.path.join(self.project_root, relative)
            try:
                with open(full_path, "r", encoding="utf-8", errors="replace") as handle:
                    line_count = handle.read().count("\n") + 1
            except OSError:
                continue
            not_loaded.append({"path": relative, "line_count": line_count})

        summary = {
            "files": len(files),
            "lines": {
                "covered": total_covered,
                "total": total_executable,
                "percent": _percent(total_covered, total_executable),
            },
            "functions": {
                "covered": total_functions_covered,
                "total": total_functions,
                "percent": _percent(total_functions_covered, total_functions),
            },
        }
        return {
            "meta": {
                "generated": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                "browser": browser_name,
                "url": self.base_url,
                "excluded_dirs": sorted(DEFAULT_EXCLUDED_DIRS),
                "extra_excluded": list(self.extra_excluded),
            },
            "summary": summary,
            "files": files,
            "not_loaded": not_loaded,
            "raw": {
                "browser": browser_name,
                "url": self.base_url,
                "scripts": [
                    {
                        "path": relative,
                        "url": script["url"],
                        "functions": script["functions"],
                    }
                    for relative, script in sorted(scripts.items())
                ],
            },
        }


def _public_file(file_info, analysis, include_source=False):
    data = dict(file_info)
    if include_source:
        data["source"] = analysis["source"]
        data["executable_mask"] = analysis["executable_mask"]
        data["hits"] = analysis["hits"]
        data["positive"] = analysis["positive"]
        data["zero"] = analysis["zero"]
    return data


def _write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def _file_class(percent):
    if percent < 50:
        return "low"
    if percent < 80:
        return "mid"
    return ""


def _write_file_page(path, file_info, analysis, source, index_href):
    lines = source.split("\n")
    mask = analysis["executable_mask"]
    hits = analysis["hits"]
    positive = analysis["positive"]
    zero = analysis["zero"]
    width = max(4, len(str(len(lines))))

    rows = []
    for index, line in enumerate(lines):
        if not mask[index]:
            css = ""
        elif hits[index] > 0 and positive[index] and zero[index]:
            css = "partial"
        elif hits[index] > 0:
            css = "covered"
        else:
            css = "uncovered"
        number = str(index + 1).rjust(width)
        rows.append(
            f'<span class="line {css}"><span class="ln">{number}</span>'
            f'<span class="code">{html.escape(line)}</span></span>'
        )

    body = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Coverage · {html.escape(file_info["path"])}</title>
<style>{HTML_STYLE}</style></head><body>
<p><a href="{html.escape(index_href)}">← all files</a></p>
<h1>{html.escape(file_info["path"])}</h1>
<p class="muted">
Lines {file_info["lines_covered"]}/{file_info["lines_total"]}
({file_info["line_percent"]:.2f}%) ·
Functions {file_info["functions_covered"]}/{file_info["functions_total"]}
({file_info["function_percent"]:.2f}%)
</p>
<p class="legend">
<span class="line covered">covered</span>
<span class="line partial">partially covered</span>
<span class="line uncovered">not covered</span>
</p>
<pre class="source">
{chr(10).join(rows)}
</pre>
</body></html>
"""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(body)


def _table(headers, rows, empty="<p>None.</p>"):
    if not rows:
        return empty
    head = "".join(f"<th>{html.escape(header)}</th>" for header in headers)
    return (
        f"<table><thead><tr>{head}</tr></thead><tbody>"
        f"{''.join(rows)}</tbody></table>"
    )


def _write_priority(path, report, index_href):
    summary = report["summary"]
    files = report["files"]
    completely_untested = [
        file_info
        for file_info, _, _, _ in files
        if file_info["lines_total"] > 0 and file_info["lines_covered"] == 0
    ]
    completely_untested.sort(key=lambda item: (-item["lines_total"], item["path"]))
    not_loaded = sorted(
        report.get("not_loaded", []), key=lambda item: (-item["line_count"], item["path"])
    )

    untested_functions = []
    for file_info, _, _, _ in files:
        if file_info["lines_covered"] == 0:
            continue
        for function in file_info["untested_functions"]:
            untested_functions.append((file_info, function))
    untested_functions.sort(key=lambda item: (-item[1]["lines"], item[0]["path"]))
    untested_functions = untested_functions[:200]

    low_coverage = [
        file_info
        for file_info, _, _, _ in files
        if 0 < file_info["lines_covered"] < file_info["lines_total"]
    ]
    low_coverage.sort(key=lambda item: (item["line_percent"], item["path"]))

    untested_rows = []
    for file_info in completely_untested:
        href = urllib.parse.quote(file_info["path"] + ".html")
        untested_rows.append(
            "<tr>"
            f'<td><a href="{html.escape(href)}">{html.escape(file_info["path"])}</a></td>'
            f'<td>{file_info["lines_total"]}</td>'
            f'<td>{file_info["functions_total"] - file_info["functions_covered"]}'
            f'/{file_info["functions_total"]}</td>'
            "</tr>"
        )

    not_loaded_rows = [
        "<tr>"
        f'<td>{html.escape(item["path"])}</td>'
        f'<td>{item["line_count"]}</td>'
        "</tr>"
        for item in not_loaded
    ]

    function_rows = []
    for file_info, function in untested_functions:
        href = urllib.parse.quote(file_info["path"] + ".html")
        line_span = (
            str(function["start_line"])
            if function["start_line"] == function["end_line"]
            else f'{function["start_line"]}-{function["end_line"]}'
        )
        function_rows.append(
            "<tr>"
            f'<td><a href="{html.escape(href)}">{html.escape(file_info["path"])}</a></td>'
            f'<td><code>{html.escape(function["name"])}</code></td>'
            f'<td>{line_span}</td>'
            f'<td>{function["lines"]}</td>'
            "</tr>"
        )

    low_rows = []
    for file_info in low_coverage[:25]:
        percent = file_info["line_percent"]
        css = _file_class(percent)
        href = urllib.parse.quote(file_info["path"] + ".html")
        low_rows.append(
            "<tr>"
            f'<td><a href="{html.escape(href)}">{html.escape(file_info["path"])}</a></td>'
            f'<td><span class="bar {css}"><span style="width:{percent:.1f}%"></span></span> '
            f'{percent:.2f}%</td>'
            f'<td>{file_info["lines_total"] - file_info["lines_covered"]}</td>'
            "</tr>"
        )

    untested_table = _table(
        ["File", "Executable lines", "Untested functions"], untested_rows
    )
    not_loaded_table = _table(["File", "Lines"], not_loaded_rows)
    function_table = _table(["File", "Function", "Lines", "Size"], function_rows)
    low_table = _table(
        ["File", "Line coverage", "Uncovered lines"], low_rows, empty=""
    )

    body = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>What to test next · Toolkit JS coverage</title>
<style>{HTML_STYLE}
.priority {{ border: 2px solid #dc2626; border-radius: 8px; padding: 16px;
            margin: 16px 0; max-width: 1100px; }}
html.dark .priority {{ border-color: #f87171; }}
.priority h2 {{ margin-top: 0; }}
</style></head><body>
<p><a href="{html.escape(index_href)}">← all files</a></p>
<h1>What to test next</h1>
<p class="muted">
{report["meta"]["generated"]} · {html.escape(report["meta"]["browser"])} ·
{html.escape(report["meta"]["url"])}
</p>
<p>
Lines <strong>{summary["lines"]["percent"]:.2f}%</strong>
({summary["lines"]["covered"]}/{summary["lines"]["total"]}) ·
Functions <strong>{summary["functions"]["percent"]:.2f}%</strong>
({summary["functions"]["covered"]}/{summary["functions"]["total"]}) ·
{summary["files"]} loaded project files · {len(report.get("not_loaded", []))} never loaded
</p>

<div class="priority">
<h2>Completely untested files ({len(completely_untested)})</h2>
<p class="muted">These files were loaded by the page, but no executable line ran.
Largest files first.</p>
{untested_table}
</div>

<div class="priority">
<h2>Project files never loaded by the page ({len(not_loaded)})</h2>
<p class="muted">These files exist in the project but the test run never requested them.
They may be orphaned, reachable only from another page, or simply missing from the test URL.</p>
{not_loaded_table}
</div>

<h2>Untested functions in partially tested files ({len(untested_functions)})</h2>
<p class="muted">The 200 largest named functions whose body never ran, even though the rest
of the file did. Open the file page to see the exact uncovered lines.</p>
{function_table}

<h2>Lowest coverage among partially tested files (top 25)</h2>
{low_table}
</body></html>
"""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(body)


def _write_index(path, report):
    summary = report["summary"]
    files = sorted(report["files"], key=lambda item: item[0]["line_percent"])
    rows = []
    for file_info, _, _, _ in files:
        percent = file_info["line_percent"]
        css = _file_class(percent)
        href = urllib.parse.quote(file_info["path"] + ".html")
        rows.append(
            "<tr>"
            f'<td><a href="{html.escape(href)}">{html.escape(file_info["path"])}</a></td>'
            f'<td><span class="bar {css}"><span style="width:{percent:.1f}%"></span></span> '
            f'{percent:.2f}%</td>'
            f'<td>{file_info["lines_covered"]}/{file_info["lines_total"]}</td>'
            f'<td>{file_info["functions_covered"]}/{file_info["functions_total"]}</td>'
            f'<td class="muted">{_format_ranges(file_info["uncovered_lines"]) or "—"}</td>'
            "</tr>"
        )

    body = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Toolkit JS coverage</title>
<style>{HTML_STYLE}</style></head><body>
<h1>Toolkit JavaScript coverage</h1>
<p><a href="priority.html">→ What to test next: completely untested files and functions</a></p>
<p class="muted">
{report["meta"]["generated"]} · {html.escape(report["meta"]["browser"])} ·
{html.escape(report["meta"]["url"])}
</p>
<h2>Total</h2>
<p>
Lines <strong>{summary["lines"]["percent"]:.2f}%</strong>
({summary["lines"]["covered"]}/{summary["lines"]["total"]}) ·
Functions <strong>{summary["functions"]["percent"]:.2f}%</strong>
({summary["functions"]["covered"]}/{summary["functions"]["total"]}) ·
{summary["files"]} files
</p>
<p class="legend">
<span class="line covered">covered</span>
<span class="line partial">partially covered</span>
<span class="line uncovered">not covered</span>
</p>
<h2>Files (lowest coverage first)</h2>
<table>
<thead><tr><th>File</th><th>Lines</th><th>Covered</th><th>Functions</th>
<th>Uncovered lines</th></tr></thead>
<tbody>
{chr(10).join(rows)}
</tbody></table>
</body></html>
"""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(body)


def _write_lcov(path, report):
    chunks = []
    for file_info, analysis, _, functions_raw in sorted(
        report["files"], key=lambda item: item[0]["path"]
    ):
        line_hits = file_info["line_hits"]
        functions = []
        for function in functions_raw:
            ranges = function.get("ranges") or []
            if not ranges:
                continue
            name = (function.get("functionName") or "(anonymous)").replace(",", "_").replace("\n", " ")
            start_line = int(ranges[0].get("startOffset", 0))
            line = _line_of(analysis["starts"], start_line) + 1
            functions.append((line, name, int(ranges[0].get("count", 0))))

        chunks.append("TN:\n")
        chunks.append(f"SF:{file_info['path']}\n")
        for line, name, count in functions:
            chunks.append(f"FN:{line},{name}\n")
        for line, name, count in functions:
            chunks.append(f"FNDA:{count},{name}\n")
        chunks.append(f"FNF:{file_info['functions_total']}\n")
        chunks.append(f"FNH:{file_info['functions_covered']}\n")
        for line in sorted(line_hits, key=int):
            chunks.append(f"DA:{line},{line_hits[line]}\n")
        chunks.append(f"LF:{file_info['lines_total']}\n")
        chunks.append(f"LH:{file_info['lines_covered']}\n")
        chunks.append("end_of_record\n")

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write("".join(chunks))


def _write_uncovered(path, report):
    lines = []
    for file_info, _, _, _ in sorted(report["files"], key=lambda item: item[0]["path"]):
        if not file_info["uncovered_lines"]:
            continue
        lines.append(file_info["path"])
        lines.append(f"  {_format_ranges(file_info['uncovered_lines'])}")
        lines.append("")
    if report.get("not_loaded"):
        lines.append("Not loaded by the page (entire file untested):")
        for item in sorted(report["not_loaded"], key=lambda value: value["path"]):
            lines.append(f"  {item['path']}")
        lines.append("")
    text = "\n".join(lines) if lines else "No uncovered executable lines.\n"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(text)


def write_reports(report, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    index_path = os.path.join(output_dir, "html", "index.html")
    _write_index(index_path, report)
    _write_priority(
        os.path.join(output_dir, "html", "priority.html"),
        report,
        os.path.relpath(index_path, os.path.join(output_dir, "html")),
    )
    for file_info, analysis, source, _ in report["files"]:
        page_path = os.path.join(output_dir, "html", file_info["path"] + ".html")
        _write_file_page(
            page_path,
            file_info,
            analysis,
            source,
            os.path.relpath(index_path, os.path.dirname(page_path)),
        )

    summary = {
        "meta": report["meta"],
        "summary": report["summary"],
        "files": [
            _public_file(file_info, analysis)
            for file_info, analysis, _, _ in report["files"]
        ],
        "not_loaded": report.get("not_loaded", []),
    }
    _write_json(os.path.join(output_dir, "summary.json"), summary)
    _write_json(os.path.join(output_dir, "coverage-raw.json"), report["raw"])
    _write_lcov(os.path.join(output_dir, "lcov.info"), report)
    _write_uncovered(os.path.join(output_dir, "uncovered.txt"), report)
    _write_github_summary(report, output_dir)


def _md_cell(value):
    return str(value).replace("|", "\\|").replace("\n", " ")


def _write_github_summary(report, output_dir):
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not path:
        return

    marker = "<!-- asanai-js-coverage -->"
    existing = ""
    try:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8", errors="replace") as handle:
                existing = handle.read()
    except OSError:
        existing = ""
    if marker in existing:
        logging.info("[coverage] GitHub step summary already contains a coverage section; skipping")
        return

    summary = report["summary"]
    lines = [
        marker,
        "## JavaScript test coverage (Chromium)",
        "",
        f"**Overall:** lines **{summary['lines']['percent']:.2f}%** "
        f"({summary['lines']['covered']:,}/{summary['lines']['total']:,}) · "
        f"functions **{summary['functions']['percent']:.2f}%** "
        f"({summary['functions']['covered']:,}/{summary['functions']['total']:,}) · "
        f"{summary['files']} loaded project files",
        "",
        "Only project-owned JavaScript is measured; `blog/`, `libs/`, `tf/` and other "
        "vendored trees are excluded. The detailed report is in the `js-coverage` artifact.",
        "",
        "| File | Line coverage | Lines | Function coverage | Functions | Uncovered lines |",
        "|---|---:|---:|---:|---:|---:|",
    ]

    files = sorted(report["files"], key=lambda item: (item[0]["line_percent"], item[0]["path"]))
    for file_info, _, _, _ in files:
        lines.append(
            f"| `{_md_cell(file_info['path'])}` "
            f"| {file_info['line_percent']:.2f}% "
            f"| {file_info['lines_covered']}/{file_info['lines_total']} "
            f"| {file_info['function_percent']:.2f}% "
            f"| {file_info['functions_covered']}/{file_info['functions_total']} "
            f"| {file_info['lines_total'] - file_info['lines_covered']} |"
        )

    not_loaded = report.get("not_loaded", [])
    if not_loaded:
        lines.extend([
            "",
            f"**Never loaded by the page:** {len(not_loaded)} project files "
            "(entirely untested, possibly orphaned; see `priority.html`).",
        ])

    lines.extend([
        "",
        f"Full per-file HTML report and the `What to test next` overview are in the "
        f"`js-coverage` artifact (`html/index.html`, `html/priority.html`).",
        "",
    ])

    try:
        prefix = "\n" if existing and not existing.endswith("\n") else ""
        with open(path, "a", encoding="utf-8") as handle:
            handle.write(prefix + "\n".join(lines))
    except OSError:
        logging.warning("[coverage] Could not append to GITHUB_STEP_SUMMARY", exc_info=True)


def _log_summary(report, output_dir):
    summary = report["summary"]
    logging.info(
        "[coverage] %d project files; lines %d/%d (%.2f%%); functions %d/%d (%.2f%%)",
        summary["files"],
        summary["lines"]["covered"],
        summary["lines"]["total"],
        summary["lines"]["percent"],
        summary["functions"]["covered"],
        summary["functions"]["total"],
        summary["functions"]["percent"],
    )
    logging.info("[coverage] HTML report: %s", os.path.join(output_dir, "html", "index.html"))
    logging.info(
        "[coverage] What to test next: %s",
        os.path.join(output_dir, "html", "priority.html"),
    )
    logging.info("[coverage] LCOV: %s", os.path.join(output_dir, "lcov.info"))
    logging.info(
        "[coverage] Uncovered lines: %s", os.path.join(output_dir, "uncovered.txt")
    )
    if report.get("not_loaded"):
        logging.info(
            "[coverage] %d project files were never loaded by the page",
            len(report["not_loaded"]),
        )
    worst = sorted(report["files"], key=lambda item: item[0]["line_percent"])[:10]
    for file_info, _, _, _ in worst:
        logging.info(
            "[coverage]   %6.2f%% %s (%d/%d lines)",
            file_info["line_percent"],
            file_info["path"],
            file_info["lines_covered"],
            file_info["lines_total"],
        )
