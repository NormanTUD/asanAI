# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Unit tests for the deterministic fact ledger (no LLM, no network).

These tests cover the parts that are easy to break silently:
  * field/subject/predicate aliases,
  * numeric and unit normalisation,
  * conflict detection across two fact files,
  * coverage (one fact file per lesson),
  * unit conversion (GB/TB).

Run:
    uv run blog/tests/fact_ledger_test.py
"""

from __future__ import annotations

import contextlib
import io
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools" / "factcheck"))

import check_facts  # noqa: E402
import facts_lib  # noqa: E402
import trace_facts  # noqa: E402


def write_lesson(root: Path, slug: str, part: int = 1, order: int = 1) -> None:
    (root / f"{slug}.php").write_text(
        "<?php\n<!--\nCOURSE_METADATA:\n"
        f"title: {slug}\npart: {part}\norder: {order}\n"
        "-->\n<div class=\"md\">text</div>\n",
        encoding="utf-8",
    )


def write_facts(root: Path, slug: str, document) -> None:
    path = root / "facts" / f"{slug}.facts.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(document), encoding="utf-8")


def claim(subject="x", predicate="parameters", value=1, unit="count", **extra):
    data = {"subject": subject, "predicate": predicate, "value": value, "unit": unit}
    data.update(extra)
    return data


class NormalisationTests(unittest.TestCase):
    def test_scale_words(self):
        self.assertEqual(facts_lib.normalize_value("175 billion"), (1.75e11, "count"))
        self.assertEqual(facts_lib.normalize_value("1.4 trillion"), (1.4e12, "count"))
        self.assertEqual(facts_lib.normalize_value("1,4 Billionen")[0], 1.4e12)

    def test_exponent_and_alias(self):
        self.assertEqual(facts_lib.normalize_value("1.75e11"), (1.75e11, "count"))
        self.assertEqual(facts_lib.canon_subject("GPT3"), "gpt-3")
        self.assertEqual(facts_lib.canon_subject("Llama 2 70B"), "llama-2-70b")
        self.assertEqual(facts_lib.canon_predicate("parameter_count"), "parameters")
        self.assertEqual(facts_lib.canon_predicate("context_length"), "context_window")

    def test_dict_claim_shape(self):
        document = {"items": {"one": {"entity": "gpt-3", "property": "parameters",
                                      "val": "175 billion", "evidence": "quote"}}}
        claims = facts_lib.iter_claims(document)
        self.assertEqual(len(claims), 1)
        normal = facts_lib.claim_normalized(claims[0])
        self.assertEqual(normal["subject"], "gpt-3")
        self.assertEqual(normal["predicate"], "parameters")
        self.assertEqual(normal["value"], 1.75e11)


class CheckerTests(unittest.TestCase):
    def run_check(self, root: Path) -> int:
        with contextlib.redirect_stdout(io.StringIO()):
            return check_facts.check(root)

    def test_clean_pair_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_lesson(root, "a")
            write_lesson(root, "b", order=2)
            write_facts(root, "a", {"source": "a.php", "claims": [claim(value=1)]})
            write_facts(root, "b", {"source": "b.php", "claims": [claim(value=1)]})
            self.assertEqual(self.run_check(root), 0)

    def test_conflict_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_lesson(root, "a")
            write_lesson(root, "b", order=2)
            write_facts(root, "a", {"source": "a.php", "claims": [claim(value=1)]})
            write_facts(root, "b", {"source": "b.php", "claims": [claim(value=2)]})
            self.assertEqual(self.run_check(root), 1)

    def test_alias_schema_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_lesson(root, "a")
            write_lesson(root, "b", order=2)
            write_facts(root, "a", {"items": [{
                "entity": "gpt-3", "property": "parameter_count",
                "val": "175 billion", "context": {}, "evidence": "quote", "line": 1,
            }]})
            write_facts(root, "b", {"claims": [{
                "subject": "GPT3", "predicate": "parameters",
                "value": 175_000_000_000, "unit": "count",
            }]})
            self.assertEqual(self.run_check(root), 0)

    def test_units_convert(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_lesson(root, "a")
            write_lesson(root, "b", order=2)
            write_facts(root, "a", {"claims": [claim(predicate="memory", value=140, unit="GB")]})
            write_facts(root, "b", {"claims": [claim(predicate="memory", value=0.13671875, unit="TB")]})
            self.assertEqual(self.run_check(root), 0)

    def test_missing_fact_file_fails_coverage(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_lesson(root, "a")
            write_lesson(root, "b", order=2)
            write_facts(root, "a", {"claims": [claim()]})
            self.assertEqual(self.run_check(root), 1)

    def test_relation_cycle_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_lesson(root, "a")
            write_lesson(root, "b", order=2)
            write_facts(root, "a", {"source": "a.php", "claims": [claim(subject="a")],
                                    "relations": [{"from": "a", "to": "b", "kind": "before"}]})
            write_facts(root, "b", {"source": "b.php", "claims": [claim(subject="b")],
                                    "relations": [{"from": "b", "to": "a", "kind": "before"}]})
            self.assertEqual(self.run_check(root), 1)

    def test_relation_temporal_conflict_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_lesson(root, "a")
            write_lesson(root, "b", order=2)
            write_facts(root, "a", {"source": "a.php", "claims": [
                claim(subject="a", predicate="year", value=2000, unit="year")],
                "relations": [{"from": "a", "to": "b", "kind": "before"}]})
            write_facts(root, "b", {"source": "b.php", "claims": [
                claim(subject="b", predicate="year", value=1990, unit="year")]})
            self.assertEqual(self.run_check(root), 1)

    def test_same_as_merges_and_detects_value_conflict(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_lesson(root, "a")
            write_lesson(root, "b", order=2)
            write_facts(root, "a", {"source": "a.php", "claims": [claim(subject="a", value=1)],
                                    "relations": [{"from": "a", "to": "b", "kind": "same_as"}]})
            write_facts(root, "b", {"source": "b.php", "claims": [claim(subject="b", value=2)]})
            self.assertEqual(self.run_check(root), 1)

    def test_relation_missing_endpoint_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_lesson(root, "a")
            write_lesson(root, "b", order=2)
            write_facts(root, "a", {"source": "a.php", "claims": [claim(subject="a")],
                                    "relations": [{"from": "a", "to": "does-not-exist", "kind": "related_to"}]})
            write_facts(root, "b", {"source": "b.php", "claims": [claim(subject="b")]})
            self.assertEqual(self.run_check(root), 1)

    def test_trace_finds_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_lesson(root, "a")
            write_lesson(root, "b", order=2)
            write_facts(root, "a", {"source": "a.php", "claims": [claim(subject="a")],
                                    "relations": [{"from": "a", "to": "b", "kind": "related_to"}]})
            write_facts(root, "b", {"source": "b.php", "claims": [claim(subject="b")]})
            _, edges = trace_facts.load_graph(root)
            path = trace_facts.shortest_path(edges, "a", "b", 5, False)
            self.assertIsNotNone(path)
            self.assertEqual(path[0][0], "a")
            self.assertEqual(path[0][2], "b")

    def test_example_lessons_cross_check(self):
        """The two curated examples pass; a mutated claim in one is caught."""
        real = ROOT / "facts"
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_lesson(root, "backproplab", part=2, order=5)
            write_lesson(root, "security_inference", part=5, order=8)
            (root / "facts").mkdir()
            for slug in ("backproplab", "security_inference"):
                shutil.copy(real / f"{slug}.facts.json", root / "facts" / f"{slug}.facts.json")
            self.assertEqual(self.run_check(root), 0)

            path = root / "facts" / "security_inference.facts.json"
            document = json.loads(path.read_text(encoding="utf-8"))
            document["claims"].append({
                "id": "mutated-sigmoid-range",
                "subject": "sigmoid",
                "predicate": "range",
                "value": "(0,2)",
                "unit": "interval",
                "qualifiers": {},
                "quote": "mutated for the test",
            })
            path.write_text(json.dumps(document), encoding="utf-8")
            self.assertEqual(self.run_check(root), 1)

    def test_scope_separates_precisions(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_lesson(root, "a")
            write_lesson(root, "b", order=2)
            write_facts(root, "a", {"claims": [
                claim(subject="model", predicate="memory", value=28, unit="GB",
                      qualifiers={"precision": "32-bit"}),
            ]})
            write_facts(root, "b", {"claims": [
                claim(subject="model", predicate="memory", value=14, unit="GB",
                      qualifiers={"precision": "16-bit"}),
            ]})
            self.assertEqual(self.run_check(root), 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
