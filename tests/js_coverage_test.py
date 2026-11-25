#!/usr/bin/env python3

import json
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import js_coverage as coverage


def test_project_path_filtering():
    collector = coverage.JsCoverage(
        None, "http://localhost:1122/index.php", None, project_root=None
    )

    assert collector._project_path("http://localhost:1122/model.js?t=123") == "model.js"
    assert collector._project_path("http://localhost:1122/visualizer/dense_visualizer.js") == "visualizer/dense_visualizer.js"
    assert collector._project_path("http://localhost:1122/libs/jquery.js") is None
    assert collector._project_path("http://localhost:1122/tf/tf.min.js") is None
    assert collector._project_path("http://localhost:1122/blog/search.js") is None
    assert collector._project_path("http://localhost:1122/tests.js") is None
    assert collector._project_path("http://localhost:1122/vendor.min.js") is None
    assert collector._project_path("http://localhost:9999/model.js") is None
    assert collector._project_path("http://localhost:1122/../model.js") is None

    scoped = coverage.JsCoverage(
        None,
        "http://localhost:1122/asanai/index.php",
        None,
        extra_excluded=["model.js"],
        project_root=None,
    )
    assert scoped._project_path("http://localhost:1122/asanai/model.js") is None
    assert scoped._project_path("http://localhost:1122/asanai/train.js") == "train.js"
    assert scoped._project_path("http://localhost:1122/train.js") is None


def _synthetic_report():
    source = (
        "function called() {\n"
        "  return 1;\n"
        "}\n"
        "function notCalled() {\n"
        "  return 2;\n"
        "}\n"
        "called();\n"
    )
    starts, total = coverage._line_starts(source)
    called_start = source.index("function called")
    called_end = source.index("}\nfunction notCalled") + 2
    uncalled_start = source.index("function notCalled")
    uncalled_end = source.index("}\ncalled") + 2

    def node(start, end, count):
        return {"startOffset": start, "endOffset": end, "count": count}

    functions = [
        {"functionName": "", "ranges": [node(0, total, 1)]},
        {"functionName": "called", "ranges": [node(called_start, called_end, 1)]},
        {"functionName": "notCalled", "ranges": [node(uncalled_start, uncalled_end, 0)]},
    ]
    analysis = coverage._analyze_script(source, functions)

    assert analysis["covered_lines"] == 4
    assert analysis["executable_lines"] == 7
    assert analysis["uncovered_lines"] == [[4, 6]]
    assert [item["name"] for item in analysis["untested_functions"]] == ["notCalled"]
    assert starts[0] == 0 and total > 0

    file_info = {
        "path": "demo.js",
        "url": "http://localhost:1122/demo.js",
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
    summary = {
        "files": 1,
        "lines": {
            "covered": analysis["covered_lines"],
            "total": analysis["executable_lines"],
            "percent": analysis["line_percent"],
        },
        "functions": {
            "covered": analysis["functions_covered"],
            "total": analysis["functions_total"],
            "percent": analysis["function_percent"],
        },
    }
    return {
        "meta": {
            "generated": "test",
            "browser": "chromium",
            "url": "http://localhost:1122",
            "excluded_dirs": [],
            "extra_excluded": [],
        },
        "summary": summary,
        "files": [(file_info, analysis, source, functions)],
        "not_loaded": [{"path": "never_loaded.js", "line_count": 12}],
        "raw": {"scripts": []},
    }


def test_reports_and_github_summary():
    report = _synthetic_report()
    with tempfile.TemporaryDirectory() as output_dir:
        summary_path = os.path.join(output_dir, "github-summary.md")
        os.environ["GITHUB_STEP_SUMMARY"] = summary_path

        coverage.write_reports(report, output_dir)
        coverage.write_reports(report, output_dir)

        expected = [
            "html/index.html",
            "html/priority.html",
            "html/demo.js.html",
            "summary.json",
            "lcov.info",
            "uncovered.txt",
            "coverage-raw.json",
        ]
        for relative in expected:
            assert os.path.isfile(os.path.join(output_dir, relative)), relative

        summary = json.load(open(os.path.join(output_dir, "summary.json"), encoding="utf-8"))
        assert summary["summary"]["lines"]["percent"] == 57.14
        assert summary["not_loaded"] == [{"path": "never_loaded.js", "line_count": 12}]

        priority = open(os.path.join(output_dir, "html", "priority.html"), encoding="utf-8").read()
        assert "never_loaded.js" in priority
        assert "notCalled" in priority

        lcov = open(os.path.join(output_dir, "lcov.info"), encoding="utf-8").read()
        assert "SF:demo.js" in lcov
        assert "DA:4,0" in lcov
        assert "FNDA:0,notCalled" in lcov

        markdown = open(summary_path, encoding="utf-8").read()
        assert markdown.count("<!-- asanai-js-coverage -->") == 1
        assert "**Overall:** lines **57.14%**" in markdown
        assert "`demo.js`" in markdown
        assert "Never loaded by the page:** 1 project files" in markdown

    os.environ.pop("GITHUB_STEP_SUMMARY", None)


def test_project_discovery():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    collector = coverage.JsCoverage(
        None, "http://localhost:1122/index.php", None, project_root=project_root
    )
    discovered = collector._discover_project_files()

    assert "model.js" in discovered
    assert "visualizer/dense_visualizer.js" in discovered
    assert "tests.js" not in discovered
    assert not any(path.startswith(("blog/", "libs/", "tf/", "tests/")) for path in discovered)
    assert not any(path.endswith(".min.js") for path in discovered)


if __name__ == "__main__":
    test_project_path_filtering()
    test_reports_and_github_summary()
    test_project_discovery()
    print("js_coverage_test: OK")
