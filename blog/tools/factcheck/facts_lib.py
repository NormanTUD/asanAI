"""Shared, dependency-free helpers for the blog fact ledger.

The ledger lives in ``blog/facts/<slug>.facts.json``.  One file per lesson.
The format is deliberately forgiving: different authors (or generators) may
use different key names.  Everything that reaches the checker is normalised
here, so the comparison logic never depends on a particular spelling.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Iterable

# ---------------------------------------------------------------------------
# Field aliases.  Add new spellings here rather than in every checker.
# ---------------------------------------------------------------------------

TOP_LEVEL_ALIASES = ("claims", "facts", "items", "entries", "data", "statements")

FIELD_ALIASES: dict[str, tuple[str, ...]] = {
    "id": ("id", "claim_id", "fact_id", "slug", "key"),
    "subject": ("subject", "entity", "topic", "about", "thing", "name"),
    "predicate": ("predicate", "property", "attribute", "relation", "type", "fact"),
    "value": ("value", "val", "amount", "number", "reading", "data"),
    "unit": ("unit", "units", "dimension", "measure"),
    "qualifiers": ("qualifiers", "qualifier", "scope", "context", "version", "conditions", "condition"),
    "quote": ("quote", "evidence", "text", "source_text", "excerpt", "sentence"),
    "line": ("line", "lineno", "line_number", "line_no"),
    "citation_keys": ("citation_keys", "citations", "cites", "bibkeys", "keys", "references"),
    "source_url": ("source_url", "url", "source", "link"),
    "confidence": ("confidence", "status", "certainty"),
}

SUBJECT_ALIASES = {
    "gpt3": "gpt-3",
    "gpt-3": "gpt-3",
    "gpt 3": "gpt-3",
    "gpt4": "gpt-4",
    "gpt-4": "gpt-4",
    "gpt 4": "gpt-4",
    "gpt4o": "gpt-4o",
    "gpt-4o": "gpt-4o",
    "gpt2": "gpt-2",
    "gpt-2": "gpt-2",
    "gpt 2": "gpt-2",
    "llama": "llama",
    "llama2": "llama-2",
    "llama-2": "llama-2",
    "llama 2": "llama-2",
    "llama3": "llama-3",
    "llama-3": "llama-3",
    "llama 3": "llama-3",
    "llama-2-70b": "llama-2-70b",
    "llama2-70b": "llama-2-70b",
    "llama 2 70b": "llama-2-70b",
    "llama-3-405b": "llama-3-405b",
    "llama3-405b": "llama-3-405b",
    "llama 3 405b": "llama-3-405b",
    "h100": "h100",
    "nvidia h100": "h100",
    "a100": "a100",
    "nvidia a100": "a100",
    "alexnet": "alexnet",
    "resnet": "resnet",
    "resnet-152": "resnet-152",
    "resnet152": "resnet-152",
    "transformer": "transformer",
    "chinchilla": "chinchilla",
    "bert": "bert",
    "vit": "vit",
    "clip": "clip",
    "whisper": "whisper",
    "alphafold": "alphafold",
    "imagenet": "imagenet",
    "mnist": "mnist",
    "cifar-10": "cifar-10",
    "cifar10": "cifar-10",
    "word2vec": "word2vec",
    "bpe": "bpe",
    "mamba": "mamba",
    "mixtral": "mixtral",
    "mixtral-8x7b": "mixtral-8x7b",
    "deepseek-v3": "deepseek-v3",
    "deepseek v3": "deepseek-v3",
    "stable diffusion": "stable-diffusion",
    "stable-diffusion": "stable-diffusion",
}

PREDICATE_ALIASES = {
    "params": "parameters",
    "parameter": "parameters",
    "parameter_count": "parameters",
    "parameter count": "parameters",
    "number_of_parameters": "parameters",
    "parameters": "parameters",
    "layers": "layers",
    "layer": "layers",
    "layer_count": "layers",
    "num_layers": "layers",
    "n_layers": "layers",
    "context": "context_window",
    "context_length": "context_window",
    "context_window": "context_window",
    "n_ctx": "context_window",
    "tokens": "tokens",
    "token": "tokens",
    "train_tokens": "training_tokens",
    "training_tokens": "training_tokens",
    "trained_tokens": "training_tokens",
    "year": "year",
    "published": "year",
    "publication_year": "year",
    "introduced": "year",
    "released": "year",
    "founded": "year",
    "created": "year",
    "invented": "year",
    "born": "year",
    "died": "year",
    "launched": "year",
    "memory": "memory",
    "memory_gb": "memory",
    "ram": "memory",
    "vram": "memory",
    "tflops": "tflops",
    "flops": "tflops",
    "throughput": "tflops",
    "d_model": "d_model",
    "hidden_size": "d_model",
    "heads": "heads",
    "attention_heads": "heads",
    "accuracy": "accuracy",
    "top1": "accuracy",
    "top5": "accuracy",
    "price": "price",
    "cost": "price",
    "title": "title",
    "part": "part",
    "order": "order",
    "cites": "cites",
    "citation": "cites",
}

# Bookkeeping keys never participate in the scope of a claim.
NON_SCOPE_KEYS = {
    "id", "claim_id", "fact_id", "slug", "key", "quote", "evidence", "text",
    "source_text", "excerpt", "sentence", "line", "lineno", "line_number",
    "line_no", "citation_keys", "citations", "cites", "bibkeys", "keys",
    "references", "source_url", "url", "source", "link", "confidence",
    "status", "certainty", "note", "comment",
}

UNIT_ALIASES = {
    "count": "count", "": "count", "unit": "count",
    "thousand": "1e3", "k": "1e3",
    "million": "1e6", "m": "1e6", "mio": "1e6", "millionen": "1e6",
    "billion": "1e9", "b": "1e9", "bn": "1e9", "milliarde": "1e9", "milliarden": "1e9",
    "trillion": "1e12", "t": "1e12", "billionen": "1e12",
    "year": "year", "years": "year", "y": "year",
    "years_before_present": "years_before_present", "kya": "years_before_present",
    "token": "token", "tokens": "token",
    "gb": "GB", "gib": "GiB", "tb": "TB", "tib": "TiB", "mb": "MB",
    "tflops": "TFLOPS", "tflop/s": "TFLOPS", "tflop": "TFLOPS",
    "flops": "FLOPs", "flop/s": "FLOPs",
    "percent": "%", "%": "%",
    "usd": "USD", "$": "USD",
}

_NUM_RE = re.compile(r"^\s*([0-9]+(?:[.,][0-9]+)?(?:[eE][+-]?[0-9]+)?)\s*([A-Za-z%/]+)?\s*$")


def normalize_key(key: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", key.strip().lower()).strip("_")


def canon_subject(raw: Any) -> str:
    if isinstance(raw, dict):
        for key in ("id", "name", "slug", "label", "subject", "entity"):
            if key in raw:
                return canon_subject(raw[key])
        return ""
    text = str(raw).strip().lower().replace("_", "-")
    text = re.sub(r"\s+", " ", text)
    text = text.strip(" .,:;!?\"'`")
    if text in SUBJECT_ALIASES:
        return SUBJECT_ALIASES[text]
    # Normalise punctuation without destroying model suffixes (70b, v3, ...).
    text = re.sub(r"[^a-z0-9.+\-/ ]+", "", text)
    text = re.sub(r"\s+", "-", text)
    return SUBJECT_ALIASES.get(text, text)


def canon_predicate(raw: Any) -> str:
    text = normalize_key(str(raw))
    return PREDICATE_ALIASES.get(text, text)


def _parse_scalar_number(text: str) -> tuple[float | None, str | None]:
    match = _NUM_RE.match(text)
    if not match:
        return None, None
    number_text, suffix = match.group(1), match.group(2)
    # 1,4 -> 1.4; 1,000 -> 1000; 1.5 -> 1.5
    if "," in number_text and "." in number_text:
        number_text = number_text.replace(",", "")
    elif "," in number_text:
        left, right = number_text.rsplit(",", 1)
        number_text = left.replace(",", "") + ("." + right if len(right) != 3 else right)
    try:
        number = float(number_text)
    except ValueError:
        return None, None
    return number, suffix.lower() if suffix else None


def normalize_value(value: Any, unit: str | None = None) -> tuple[Any, str]:
    """Return (comparable value, canonical unit)."""
    if isinstance(value, dict):
        inner_unit = value.get("unit") or value.get("units") or unit
        for key in ("amount", "value", "number", "val"):
            if key in value:
                return normalize_value(value[key], inner_unit)
        return json.dumps(value, sort_keys=True, ensure_ascii=False), "json"
    if isinstance(value, bool):
        return value, "bool"
    if isinstance(value, (int, float)):
        unit_c = canon_unit(unit)
        # A scale unit ("1e9") normally means the number is in billions
        # (175 + 1e9).  But generators sometimes write 175e9 + 1e9.  Treat a
        # number that is already at/above the scale as already scaled.
        if unit_c in UNIT_SCALE and abs(float(value)) >= UNIT_SCALE[unit_c]:
            return float(value), "count"
        return float(value), unit_c
    if isinstance(value, list):
        return json.dumps(value, sort_keys=True, ensure_ascii=False), "json"

    text = str(value).strip()
    number, suffix = _parse_scalar_number(text)
    if number is not None:
        chosen = suffix or unit
        scale_unit = canon_unit(chosen)
        scale = UNIT_SCALE.get(scale_unit)
        if scale is not None and scale_unit in {"1e3", "1e6", "1e9", "1e12"}:
            # Already-scaled generators sometimes write 175e9 + "1e9".
            if abs(number) >= scale:
                return number, "count"
            return number * scale, "count"
        return number, canon_unit(chosen or unit)
    return re.sub(r"\s+", " ", text.lower()).strip(), canon_unit(unit)


UNIT_SCALE = {"1e3": 1e3, "1e6": 1e6, "1e9": 1e9, "1e12": 1e12, "k": 1e3, "m": 1e6, "b": 1e9, "t": 1e12}


def canon_unit(raw: Any) -> str:
    if raw is None:
        return "count"
    text = str(raw).strip().lower()
    return UNIT_ALIASES.get(text, str(raw).strip())


def pick(mapping: dict[str, Any], aliases: Iterable[str], default: Any = None) -> Any:
    if not isinstance(mapping, dict):
        return default
    normalised = {normalize_key(str(k)): v for k, v in mapping.items()}
    for alias in aliases:
        if alias in mapping:
            return mapping[alias]
        key = normalize_key(alias)
        if key in normalised:
            return normalised[key]
    return default


def iter_claims(document: Any) -> list[dict[str, Any]]:
    """Accept a list, a dict of claims, or a document with a claims-like key."""
    if isinstance(document, list):
        raw = document
    elif isinstance(document, dict):
        raw = None
        for alias in TOP_LEVEL_ALIASES:
            if alias in document:
                raw = document[alias]
                break
        if raw is None:
            normalised = {normalize_key(str(k)): v for k, v in document.items()}
            for alias in TOP_LEVEL_ALIASES:
                if normalize_key(alias) in normalised:
                    raw = normalised[normalize_key(alias)]
                    break
        if raw is None:
            # A single claim object.
            raw = [document]
    else:
        return []

    if isinstance(raw, dict):
        claims = []
        for key, value in raw.items():
            if isinstance(value, dict):
                value = dict(value)
                value.setdefault("id", key)
                claims.append(value)
        return claims
    if isinstance(raw, list):
        return [item for item in raw if isinstance(item, dict)]
    return []


def claim_normalized(claim: dict[str, Any]) -> dict[str, Any] | None:
    subject = canon_subject(pick(claim, FIELD_ALIASES["subject"]))
    predicate = canon_predicate(pick(claim, FIELD_ALIASES["predicate"]))
    raw_value = pick(claim, FIELD_ALIASES["value"])
    if not subject or not predicate or raw_value is None:
        return None
    unit = pick(claim, FIELD_ALIASES["unit"])
    value, unit = normalize_value(raw_value, unit)
    qualifiers = pick(claim, FIELD_ALIASES["qualifiers"], {}) or {}
    if not isinstance(qualifiers, dict):
        qualifiers = {"scope": qualifiers}
    clean_qualifiers = {}
    for key, val in qualifiers.items():
        nkey = normalize_key(str(key))
        if nkey in NON_SCOPE_KEYS:
            continue
        clean_qualifiers[nkey] = str(val).strip().lower()
    return {
        "id": pick(claim, FIELD_ALIASES["id"], ""),
        "subject": subject,
        "predicate": predicate,
        "value": value,
        "unit": unit,
        "qualifiers": clean_qualifiers,
        "quote": pick(claim, FIELD_ALIASES["quote"], ""),
        "citation_keys": pick(claim, FIELD_ALIASES["citation_keys"], []),
        "source_url": pick(claim, FIELD_ALIASES["source_url"], ""),
        "confidence": pick(claim, FIELD_ALIASES["confidence"], "stated"),
    }


def scope_key(claim: dict[str, Any]) -> str:
    return json.dumps(claim["qualifiers"], sort_keys=True, ensure_ascii=False)


def load_fact_file(path: Path) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    document = json.loads(path.read_text(encoding="utf-8"))
    return document, [c for c in (claim_normalized(x) for x in iter_claims(document)) if c]


def lesson_files(blog: Path) -> dict[str, Path]:
    """Top-level lesson PHP files (the ones with COURSE_METADATA)."""
    skip = {"index", "index_full", "functions", "asanai_blog_proxy", "graph"}
    result = {}
    pattern = re.compile(r"COURSE_METADATA:")
    for path in sorted(blog.glob("*.php")):
        if path.stem in skip:
            continue
        if pattern.search(path.read_text(encoding="utf-8", errors="replace")):
            result[path.stem] = path
    return result


def fact_files(blog: Path) -> dict[str, Path]:
    return {p.name[: -len(".facts.json")]: p for p in sorted((blog / "facts").glob("*.facts.json"))}


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False, sort_keys=False) + "\n", encoding="utf-8")

# ---------------------------------------------------------------------------
# Relations between facts / entities.  A relation is a typed edge in the
# fact graph; the checker validates endpoints, cycles and temporal
# compatibility, and trace_facts.py renders paths.
# ---------------------------------------------------------------------------

RELATION_ALIASES = {
    "from": ("from", "source", "subject", "a", "start", "parent", "left"),
    "to": ("to", "target", "object", "b", "end", "child", "right"),
    "kind": ("kind", "type", "relation", "predicate", "label", "edge"),
}

RELATION_KIND_ALIASES = {
    "influenced_by": "influenced_by",
    "influenced": "influenced",
    "followed_by": "followed_by",
    "preceded_by": "preceded_by",
    "after": "after",
    "before": "before",
    "caused_by": "caused_by",
    "caused": "caused",
    "authored_by": "authored_by",
    "wrote": "wrote",
    "alias_of": "same_as",
    "same_as": "same_as",
    "part_of": "part_of",
    "instance_of": "instance_of",
    "located_in": "located_in",
    "derived_from": "derived_from",
    "related_to": "related_to",
    "supports": "supports",
    "contradicts": "contradicts",
    "cites": "cites",
    "uses": "uses",
    "used_by": "used_by",
    "discovered": "discovered",
    "invented": "invented",
    "founded": "founded",
}

# Reverse an edge so that all ordering/influence/authorship edges point in a
# canonical direction.
REVERSE_KINDS = {
    "influenced_by": "influenced",
    "followed_by": "preceded_by",
    "after": "before",
    "caused_by": "caused",
    "authored_by": "wrote",
    "used_by": "uses",
}

# Kinds that must form a DAG.  Mutual influence is allowed (people influence
# each other); causation, part-of and temporal order are not.
ACYCLIC_KINDS = {"before", "part_of", "caused"}


def canon_ref(raw: Any) -> str:
    if isinstance(raw, dict):
        for key in ("id", "fact_id", "subject", "entity", "name"):
            if key in raw:
                return canon_ref(raw[key])
        return ""
    text = str(raw).strip().replace("_", "-")
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"[^A-Za-z0-9_.+\-/]+", "", text).lower()
    return text.strip("-")


def iter_relations(document: Any) -> list[dict[str, Any]]:
    if not isinstance(document, dict):
        return []
    raw = None
    for key in ("relations", "links", "edges", "connections", "graph"):
        if key in document:
            raw = document[key]
            break
    if raw is None:
        normalised = {normalize_key(str(k)): v for k, v in document.items()}
        for key in ("relations", "links", "edges", "connections", "graph"):
            if key in normalised:
                raw = normalised[key]
                break
    if isinstance(raw, dict):
        out = []
        for key, value in raw.items():
            if isinstance(value, dict):
                value = dict(value)
                value.setdefault("id", key)
                out.append(value)
        return out
    if isinstance(raw, list):
        return [item for item in raw if isinstance(item, dict)]
    return []


def relation_normalized(relation: dict[str, Any]) -> dict[str, Any] | None:
    src = canon_ref(pick(relation, RELATION_ALIASES["from"]))
    dst = canon_ref(pick(relation, RELATION_ALIASES["to"]))
    kind = normalize_key(str(pick(relation, RELATION_ALIASES["kind"], "")))
    kind = RELATION_KIND_ALIASES.get(kind, kind)
    if not src or not dst or not kind:
        return None
    if kind == "preceded_by":
        # A preceded_by B  =>  B before A
        src, dst = dst, src
        kind = "before"
    elif kind == "followed_by":
        # A followed_by B  =>  A before B
        kind = "before"
    elif kind == "after":
        # A after B  =>  B before A
        src, dst = dst, src
        kind = "before"
    elif kind in REVERSE_KINDS:
        src, dst = dst, src
        kind = REVERSE_KINDS[kind]
    elif kind == "alias_of":
        kind = "same_as"
    qualifiers = pick(relation, FIELD_ALIASES["qualifiers"], {}) or {}
    if not isinstance(qualifiers, dict):
        qualifiers = {"scope": qualifiers}
    clean_qualifiers = {
        normalize_key(str(k)): str(v).strip().lower()
        for k, v in qualifiers.items()
        if normalize_key(str(k)) not in NON_SCOPE_KEYS
    }
    return {
        "id": pick(relation, FIELD_ALIASES["id"], ""),
        "from": src,
        "to": dst,
        "kind": kind,
        "qualifiers": clean_qualifiers,
        "quote": pick(relation, FIELD_ALIASES["quote"], ""),
        "citation_keys": pick(relation, FIELD_ALIASES["citation_keys"], []),
    }

# Predicates that are single-valued for a given (subject, qualifiers).  All
# other predicates are associative/multi-valued: an entity may have many
# works, statements, assumptions or quotes without those being contradictions.
FUNCTIONAL_PREDICATES = {
    "parameters", "layers", "context_window", "training_tokens", "year",
    "memory", "tflops", "d_model", "heads", "accuracy", "price", "range",
    "title", "part", "order",
}


def is_functional(claim: dict[str, Any]) -> bool:
    predicate = claim.get("predicate")
    if predicate not in FUNCTIONAL_PREDICATES:
        return False
    value = claim.get("value")
    # Count-like predicates are only single-valued when they actually carry a
    # number.  A string under `layers` is a description, not a layer count.
    if predicate in {
        "parameters", "layers", "context_window", "training_tokens", "year",
        "memory", "tflops", "d_model", "heads", "accuracy", "price",
    } and not isinstance(value, (int, float)):
        return False
    # A bare `year` is ambiguous (born/died/founded/published).  Only treat it
    # as single-valued when an event/definition qualifier makes it specific.
    if predicate == "year":
        qualifiers = claim.get("qualifiers") or {}
        return bool({"event", "definition"} & set(qualifiers))
    return True

KNOWN_RELATION_KINDS = {
    "influenced", "before", "caused", "wrote", "part_of", "same_as",
    "derived_from", "located_in", "uses", "supports", "contradicts",
    "cites", "related_to", "instance_of", "discovered", "invented",
    "founded", "mentioned_in",
}

def normalize_source(text: str) -> str:
    """Plain prose view used for quote/statement matching."""
    import html as _html
    text = re.sub(r"<\?php.*?\?>", " ", text, flags=re.S)
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.S)
    text = re.sub(r"<script.*?</script>|<style.*?</style>|<pre.*?</pre>|<code.*?</code>", " ", text, flags=re.S | re.I)
    text = re.sub(r"\$\$.*?\$\$", " ", text, flags=re.S)
    text = _html.unescape(text)
    text = strip_html_tags(text)
    return re.sub(r"\s+", " ", text).strip()

_HTML_TAG_RE = re.compile(
    r"</?(?:a|abbr|article|aside|audio|b|blockquote|br|button|caption|code|col|colgroup|"
    r"dd|del|details|div|dl|dt|em|figcaption|figure|font|footer|form|h[1-6]|header|hr|i|"
    r"iframe|img|input|ins|kbd|label|li|main|mark|nav|ol|option|p|path|pre|q|s|samp|"
    r"section|select|small|source|span|strong|sub|summary|sup|svg|table|tbody|td|tfoot|"
    r"th|thead|time|tr|u|ul|var|video)\b[^>]*>",
    re.I,
)


def strip_html_tags(text: str) -> str:
    """Strip real HTML tags only; leave LaTeX like ``< \varepsilon`` alone."""
    return _HTML_TAG_RE.sub(" ", text)

