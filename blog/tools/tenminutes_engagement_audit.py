#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Advisory engagement audit for the Ten Minutes pages.

This is a text-quality tool, not a renderer and not a gate. It reads the
English lesson pages and the German dictionaries and reports signals that
usually precede a page a reader abandons: a recap opening, no questions, no
reader address, long paragraphs, no concrete anchor, no closing callback.

Usage:
    python3 blog/tools/tenminutes_engagement_audit.py
    python3 blog/tools/tenminutes_engagement_audit.py --only language history
    python3 blog/tools/tenminutes_engagement_audit.py --json
    python3 blog/tools/tenminutes_engagement_audit.py --strict
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEN = ROOT / "blog" / "tenminutes"
DE = TEN / "lang" / "de"

SKIP = {
    "index.php",
    "advent.php",
    "library.php",
    "bootstrap.php",
    "globals.php",
    "fact_lookup.php",
}

RECAP_MARKERS = (
    "the next-token loop",
    "tokenization",
    "embedding",
    "attention",
    "sampling",
    "fine-tuning",
    "prompting",
    "multimodal",
    "computer vision",
    "learning",
    "local inference",
    "the tiny learner",
    "the technical stack",
    "the first half",
    "the transformer ended",
    "the model",
    "the same",
    "this chapter",
    "this page",
    "in this",
)

SCENE_MARKERS = (
    "imagine",
    "ask",
    "start",
    "look",
    "take",
    "consider",
    "suppose",
    "picture",
    "think of",
    "when ",
    "if ",
    "in ",
    "on ",
    "at ",
)

EN_IMPERATIVES = (
    "ask",
    "start",
    "look",
    "imagine",
    "take",
    "consider",
    "pick",
    "choose",
    "try",
    "think",
    "notice",
    "remember",
    "use",
    "give",
    "watch",
    "follow",
    "compare",
    "change",
    "run",
    "type",
    "click",
    "open",
    "read",
    "suppose",
    "picture",
    "see",
    "check",
    "measure",
    "feed",
    "put",
    "set",
    "treat",
    "separate",
    "verify",
    "keep",
    "let",
)

DE_IMPERATIVES = (
    "klicke",
    "starte",
    "nimm",
    "schau",
    "stell",
    "vergleich",
    "ändere",
    "wähle",
    "probiere",
    "frag",
    "nutze",
    "gib",
    "beachte",
    "denk",
    "lies",
    "öffne",
    "prüfe",
    "verifiziere",
    "halte",
    "mach",
    "setze",
    "füge",
    "zeige",
    "betrachte",
    "folge",
    "miss",
    "trenne",
    "verwende",
)

STOPWORDS = {
    "about", "after", "again", "against", "almost", "along", "also", "although",
    "always", "among", "another", "around", "because", "before", "behind",
    "being", "between", "both", "cannot", "could", "does", "doing", "down",
    "during", "each", "either", "else", "even", "ever", "every", "from",
    "further", "have", "having", "here", "herself", "himself", "itself",
    "just", "like", "many", "might", "more", "most", "much", "must", "never",
    "only", "other", "over", "same", "should", "since", "some", "still",
    "such", "than", "that", "their", "them", "then", "there", "these", "they",
    "this", "those", "through", "under", "until", "very", "were", "what",
    "when", "where", "which", "while", "with", "would", "your", "yours",
}


@dataclass
class Section:
    kicker: str = ""
    title: str = ""
    paragraphs: list[str] = field(default_factory=list)
    aha: str = ""


@dataclass
class Page:
    slug: str
    title: str = ""
    hero: str = ""
    sections: list[Section] = field(default_factory=list)


class PageParser(HTMLParser):
    """Small, dependency-free extractor for the Ten Minutes lesson skeleton."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.page = Page("")
        self.stack: list[dict[str, object]] = []
        self.section: Section | None = None
        self.skip = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style"}:
            self.skip += 1
            return
        if self.skip:
            return
        classes = (dict(attrs).get("class") or "").split()
        if tag == "section" and "section-block" in classes:
            self.section = Section()
            self.page.sections.append(self.section)
        if tag == "h1":
            self.stack.append({"tag": tag, "kind": "title", "buf": []})
        elif tag == "p" and "hero-deck" in classes:
            self.stack.append({"tag": tag, "kind": "hero", "buf": []})
        elif tag in {"div", "span"} and "section-kicker" in classes:
            self.stack.append({"tag": tag, "kind": "kicker", "buf": []})
        elif tag == "h2" and "section-title" in classes:
            self.stack.append({"tag": tag, "kind": "section-title", "buf": []})
        elif tag == "p" and self.section is not None and self._in_prose():
            self.stack.append({"tag": tag, "kind": "para", "buf": []})
        elif tag == "div" and "aha" in classes:
            self.stack.append({"tag": tag, "kind": "aha", "buf": []})
        elif tag == "div" and "prose" in classes:
            self.stack.append({"tag": tag, "kind": "prose", "buf": []})

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"}:
            self.skip = max(0, self.skip - 1)
            return
        if self.skip:
            return
        if not self.stack or self.stack[-1]["tag"] != tag:
            return
        item = self.stack.pop()
        text = normalise(" ".join(item["buf"]))
        kind = item["kind"]
        if kind == "title":
            self.page.title = text
        elif kind == "hero":
            self.page.hero = text
        elif kind == "kicker" and self.section is not None:
            self.section.kicker = text
        elif kind == "section-title" and self.section is not None:
            self.section.title = text
        elif kind == "para" and self.section is not None:
            self.section.paragraphs.append(text)
        elif kind == "aha" and self.section is not None:
            self.section.aha = text

    def handle_data(self, data: str) -> None:
        if self.skip or not self.stack:
            return
        self.stack[-1]["buf"].append(data)

    def _in_prose(self) -> bool:
        return any(item["kind"] == "prose" for item in self.stack)


def normalise(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def words(text: str) -> int:
    return len(re.findall(r"[A-Za-zÄÖÜäöüß0-9’'-]+", text))


def sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


def reader_address(text: str) -> int:
    you = len(re.findall(r"\byou\b|\byour\b|\byou're\b", text, re.I))
    imperative = 0
    for sentence in sentences(text):
        first = sentence.split(" ", 1)[0].lower().strip("\"'(")
        if first in EN_IMPERATIVES:
            imperative += 1
    return you + imperative


def german_address(text: str) -> int:
    du = len(re.findall(r"\bdu\b|\bdein\w*\b|\bdich\b|\bdir\b", text, re.I))
    imperative = 0
    for sentence in sentences(text):
        first = sentence.split(" ", 1)[0].lower().strip("\"'(")
        if first in DE_IMPERATIVES:
            imperative += 1
    return du + imperative


def concrete_anchors(text: str) -> int:
    numbers = len(re.findall(r"\b\d[\d.,]*\b", text))
    examples = len(
        re.findall(
            r"\b(imagine|for example|consider|suppose|take|think of|picture|e\.g\.)\b",
            text,
            re.I,
        )
    )
    return numbers + examples


def first_sentence_type(text: str) -> str:
    parts = sentences(text)
    if not parts:
        return "empty"
    first = parts[0]
    low = first.lower()
    if first.endswith("?"):
        return "question"
    if any(low.startswith(marker) for marker in RECAP_MARKERS):
        return "recap"
    if re.search(r"\b(is|are|was|were)\s+(a|an|the)\b", first, re.I):
        return "definition"
    if any(low.startswith(marker) for marker in SCENE_MARKERS):
        return "scene"
    return "claim"


def callback(first: str, last: str) -> bool:
    def content(text: str) -> set[str]:
        return {
            w.lower()
            for w in re.findall(r"[A-Za-zÄÖÜäöüß]{5,}", text)
            if w.lower() not in STOPWORDS
        }

    return bool(content(first) & content(last))


def load_german(slug: str) -> str:
    path = DE / f"{slug}.php"
    if not path.is_file():
        return ""
    try:
        out = subprocess.check_output(
            [
                "php",
                "-r",
                f'$a=include "{path}"; echo json_encode($a, JSON_UNESCAPED_UNICODE);',
            ],
            stderr=subprocess.DEVNULL,
            timeout=10,
        )
        data = json.loads(out)
    except Exception:
        return ""
    texts = data.get("texts") or {}
    chunks = [
        value
        for value in texts.values()
        if isinstance(value, str) and len(value) >= 40 and " " in value
    ]
    return normalise(" ".join(chunks))


def audit_page(path: Path) -> dict[str, object]:
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8", errors="replace"))
    page = parser.page
    slug = path.stem
    paragraphs = [p for section in page.sections for p in section.paragraphs]
    prose = normalise(" ".join(paragraphs))
    first = paragraphs[0] if paragraphs else ""
    last = paragraphs[-1] if paragraphs else ""
    long_paragraphs = [words(p) for p in paragraphs if words(p) > 120]
    long_sentences = [
        (words(s), s[:120])
        for s in sentences(prose)
        if words(s) > 35
    ]
    sections_without_anchor = [
        section.title or section.kicker
        for section in page.sections
        if section.paragraphs and concrete_anchors(" ".join(section.paragraphs)) == 0
    ]
    german = load_german(slug)
    return {
        "slug": slug,
        "title": page.title,
        "words": words(prose),
        "first": first,
        "first_type": first_sentence_type(first),
        "questions": prose.count("?"),
        "address": reader_address(prose),
        "anchors": concrete_anchors(prose),
        "long_paragraphs": long_paragraphs,
        "long_sentences": long_sentences,
        "sections": len(page.sections),
        "sections_without_anchor": sections_without_anchor,
        "callback": callback(f"{page.hero} {first}", last),
        "german_words": words(german),
        "german_questions": german.count("?"),
        "german_address": german_address(german),
        "flags": [],
    }


def build_flags(row: dict[str, object]) -> list[str]:
    flags: list[str] = []
    if row["first_type"] in {"recap", "definition"}:
        flags.append(f"opening:{row['first_type']}")
    if row["questions"] == 0:
        flags.append("no-question")
    elif row["questions"] < 2 and row["sections"] >= 3:
        flags.append("few-questions")
    if row["address"] < 3:
        flags.append("low-reader-address")
    if row["long_paragraphs"]:
        flags.append(f"long-paragraphs:{len(row['long_paragraphs'])}")
    if row["long_sentences"]:
        flags.append(f"long-sentences:{len(row['long_sentences'])}")
    if not row["callback"]:
        flags.append("no-callback")
    if row["sections_without_anchor"]:
        flags.append(f"unanchored-sections:{len(row['sections_without_anchor'])}")
    if row["words"] > 1200:
        flags.append("long-page")
    if row["words"] < 400:
        flags.append("short-page")
    if row["german_words"]:
        if row["questions"] >= 2 and row["german_questions"] == 0:
            flags.append("de-no-question")
        if row["address"] >= 3 and row["german_address"] == 0:
            flags.append("de-low-reader-address")
    return flags


def suggestions(row: dict[str, object]) -> list[str]:
    out: list[str] = []
    if row["first_type"] in {"recap", "definition"}:
        out.append("rewrite the first sentence as a scene, a surprising fact, or a question")
    if row["questions"] == 0:
        out.append("add a page question and one question per major section")
    elif row["questions"] < 2:
        out.append("add at least one more section question")
    if row["address"] < 3:
        out.append("add direct address (you/du or an imperative), at least once in the first 100 words")
    if row["long_paragraphs"]:
        out.append(f"split {len(row['long_paragraphs'])} paragraph(s) over 120 words")
    if row["long_sentences"]:
        out.append(f"split {len(row['long_sentences'])} sentence(s) over 35 words")
    if not row["callback"]:
        out.append("return to the opening image or question in the final section")
    if row["sections_without_anchor"]:
        names = ", ".join(row["sections_without_anchor"][:3])
        out.append(f"add a concrete anchor to: {names}")
    if row["words"] > 1200:
        out.append("page is long; add section payoffs or treat it as deliberate long-form")
    if row["words"] < 400:
        out.append("page is short; add one concrete scene and one payoff, not filler")
    if "de-no-question" in row["flags"]:
        out.append("German has no questions; mirror the English questions")
    if "de-low-reader-address" in row["flags"]:
        out.append("German has little du/imperative address; mirror the English voice")
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", nargs="*", help="limit to these slugs")
    parser.add_argument("--json", action="store_true", help="emit JSON")
    parser.add_argument("--strict", action="store_true", help="exit 1 on high-severity flags")
    args = parser.parse_args()

    rows: list[dict[str, object]] = []
    for path in sorted(TEN.glob("*.php")):
        if path.name in SKIP or path.stem in {"index", "advent", "library"}:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        if 'data-page="lesson"' not in text and "hero--lesson" not in text:
            continue
        if args.only and path.stem not in args.only:
            continue
        row = audit_page(path)
        row["flags"] = build_flags(row)
        rows.append(row)

    if args.json:
        print(json.dumps(rows, ensure_ascii=False, indent=2))
    else:
        print("Ten Minutes engagement audit (advisory)")
        print()
        header = f"{'page':24} {'words':>5} {'first':>10} {'?':>3} {'addr':>4} {'longP':>5} {'longS':>5} {'cb':>3} flags"
        print(header)
        print("-" * len(header))
        for row in rows:
            flags = ",".join(row["flags"]) or "-"
            print(
                f"{row['slug']:24} {row['words']:5} {row['first_type']:>10} "
                f"{row['questions']:3} {row['address']:4} "
                f"{len(row['long_paragraphs']):5} {len(row['long_sentences']):5} "
                f"{'yes' if row['callback'] else 'no':>3} {flags}"
            )
        print()
        print("Top fixes")
        print("---------")
        for row in rows:
            fixes = suggestions(row)
            if not fixes:
                continue
            print(f"\n{row['slug']} ({row['words']} words, {row['sections']} sections)")
            print(f"  opening: {row['first'][:160]}")
            for fix in fixes:
                print(f"  - {fix}")

    if args.strict:
        severe = {
            "opening:recap",
            "opening:definition",
            "no-question",
            "low-reader-address",
            "no-callback",
        }
        failed = [row["slug"] for row in rows if severe & set(row["flags"])]
        if failed:
            print("\nSTRICT: engagement findings in: " + ", ".join(failed), file=sys.stderr)
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
