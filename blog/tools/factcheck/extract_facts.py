# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Generate/refresh one fact-ledger file per lesson.

Default behaviour is non-destructive: existing ``blog/facts/<slug>.facts.json``
files are left alone.  Use ``--force`` to regenerate them.

The automatic extraction is deliberately conservative: it only emits a claim
when a line mentions exactly one known entity and contains an explicit
number/date pattern.  Everything else belongs in a curated fact file.

Usage:
    uv run blog/tools/factcheck/extract_facts.py [blog/] [--force] [--dry-run]
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from facts_lib import lesson_files, save_json  # noqa: E402

META_RE = re.compile(r"<!--\s*\n?\s*COURSE_METADATA:\s*\n((?:.*\n)*?)\s*-->")
CITE_RE = re.compile(r"\\cite[a-zA-Z]*\s*(?:\[[^\]]*\])?\{([^}]*)\}")

ENTITY_PATTERNS: dict[str, list[str]] = {
    "gpt-2": [r"\bGPT-?2(?!\.\d)\b", r"\bGPT‑2\b"],
    "gpt-3": [r"\bGPT-?3(?!\.\d)\b", r"\bGPT‑3\b"],
    "gpt-4": [r"\bGPT-?4(?!\.\d)\b", r"\bGPT‑4\b"],
    "gpt-4o": [r"\bGPT-?4o\b"],
    "llama-2-70b": [r"\bLlama[ -]?2[ -]?70B\b", r"\bLLaMA[ -]?2[ -]?70B\b"],
    "llama-3-405b": [r"\bLlama[ -]?3[ -]?405B\b"],
    "llama-2": [r"\bLlama[ -]?2\b"],
    "llama-3": [r"\bLlama[ -]?3\b"],
    "transformer": [r"\bTransformer\b", r"\bVaswani\b"],
    "chinchilla": [r"\bChinchilla\b"],
    "alexnet": [r"\bAlexNet\b"],
    "resnet-152": [r"\bResNet-?152\b"],
    "resnet": [r"\bResNet\b"],
    "vgg": [r"\bVGG(?:-?\d+)?\b"],
    "bert": [r"\bBERT\b"],
    "vit": [r"\bViT\b"],
    "clip": [r"\bCLIP\b"],
    "whisper": [r"\bWhisper\b"],
    "alphafold": [r"\bAlphaFold\b"],
    "imagenet": [r"\bImageNet\b"],
    "mnist": [r"\bMNIST\b"],
    "cifar-10": [r"\bCIFAR-?10\b"],
    "word2vec": [r"\bword2vec\b", r"\bWord2Vec\b"],
    "bpe": [r"\bBPE\b"],
    "mamba": [r"\bMamba\b"],
    "mixtral-8x7b": [r"\bMixtral[ -]?8x7B\b"],
    "deepseek-v3": [r"\bDeepSeek-?V3\b"],
    "stable-diffusion": [r"\bStable Diffusion\b"],
    "h100": [r"\bH100\b"],
    "a100": [r"\bA100\b"],
    "v100": [r"\bV100\b"],
    "tpu": [r"\bTPU\b"],
    "relu": [r"\bReLU\b", r"\brectified linear unit\b"],
    "sigmoid": [r"\bsigmoid\b"],
    "softmax": [r"\bsoftmax\b"],
    "tanh": [r"\btanh\b"],
    "gelu": [r"\bGELU\b"],
    "cnn": [r"\bCNN\b", r"\bconvolutional neural network\b"],
    "rnn": [r"\bRNN\b", r"\brecurrent neural network\b"],
    "lstm": [r"\bLSTM\b"],
    "gru": [r"\bGRU\b"],
    "gan": [r"\bGAN\b", r"\bgenerative adversarial network\b"],
    "vae": [r"\bVAE\b", r"\bvariational autoencoder\b"],
    "autoencoder": [r"\bautoencoder\b"],
    "mlp": [r"\bMLP\b", r"\bmultilayer perceptron\b"],
    "perceptron": [r"\bperceptron\b"],
    "adam": [r"\bAdam\b"],
    "sgd": [r"\bSGD\b", r"\bstochastic gradient descent\b"],
    "dropout": [r"\bdropout\b"],
    "batchnorm": [r"\bBatchNorm\b", r"\bbatch normalization\b"],
    "layernorm": [r"\bLayerNorm\b", r"\blayer normalization\b"],
    "attention": [r"\battention\b"],
    "self-attention": [r"\bself-attention\b"],
    "glove": [r"\bGloVe\b"],
    "fasttext": [r"\bfastText\b"],
    "t5": [r"\bT5\b"],
    "roberta": [r"\bRoBERTa\b"],
    "mistral": [r"\bMistral\b"],
    "mixtral": [r"\bMixtral\b"],
    "claude": [r"\bClaude\b"],
    "gemini": [r"\bGemini\b"],
    "vgg": [r"\bVGG\b"],
    "inception": [r"\bInception\b"],
    "mobilenet": [r"\bMobileNet\b"],
    "efficientnet": [r"\bEfficientNet\b"],
    "sam": [r"\bSAM\b"],
    "pytorch": [r"\bPyTorch\b"],
    "tensorflow": [r"\bTensorFlow\b"],
    "rag": [r"\bRAG\b"],
    "lora": [r"\bLoRA\b"],
    "qlora": [r"\bQLoRA\b"],
    "dpo": [r"\bDPO\b"],
    "ppo": [r"\bPPO\b"],
    "grpo": [r"\bGRPO\b"],
    "rlhf": [r"\bRLHF\b"],
    "flash-attention": [r"\bFlashAttention\b"],
    "paged-attention": [r"\bPagedAttention\b"],
    "quantization": [r"\bquantization\b"],
    "moe": [r"\bMoE\b", r"\bmixture[- ]of[- ]experts\b"],
    "ddpm": [r"\bDDPM\b"],
    "sora": [r"\bSora\b"],
}

PARAM_RE = re.compile(
    r"(?<![A-Za-z0-9])(\d[\d.,]*)\s*(thousand|million|billion|trillion|k|m|b|bn|t)?\s*"
    r"(?:trainable\s+|total\s+|active\s+)?parameters?\b",
    re.I,
)
LAYER_RE = re.compile(r"(?<![A-Za-z0-9])(\d+)\s*(?:transformer\s+|hidden\s+)?layers?\b", re.I)
CONTEXT_RE = re.compile(
    r"(?:(?<![A-Za-z0-9])(\d[\d,]*)[\s-]*(?:token\s+)?context(?:\s+window)?|"
    r"context(?:\s+window)?\s*(?:of|is|:)?\s*(\d[\d,]*))",
    re.I,
)
TOKENS_RE = re.compile(
    r"(?<![A-Za-z0-9])(\d[\d.,]*)\s*(thousand|million|billion|trillion)?\s*(?:training\s+)?tokens?\b",
    re.I,
)
MEMORY_RE = re.compile(r"(?<![A-Za-z0-9])(\d[\d.,]*)\s*(GB|TB|GiB|MiB)\b")
TFLOPS_RE = re.compile(r"(?<![A-Za-z0-9])(\d[\d.,]*)\s*(TFLOPS|TFLOP/s|TFLOP)\b", re.I)
DMODEL_RE = re.compile(r"d_model\s*[=:]\s*(\d+)", re.I)
HEADS_RE = re.compile(r"(?<![A-Za-z0-9])(\d+)\s*(?:attention\s+)?heads?\b", re.I)


def metadata(text: str) -> dict[str, str]:
    match = META_RE.search(text)
    if not match:
        return {}
    out = {}
    for line in match.group(1).splitlines():
        line = line.strip()
        if re.match(r"^\w+:\s*.+$", line):
            key, value = line.split(":", 1)
            out[key.strip()] = value.strip()
    return out


def strip_line(line: str) -> str:
    line = re.sub(r"<\?php.*?\?>", " ", line, flags=re.S)
    line = re.sub(r"<[^>]+>", " ", line)
    return re.sub(r"\s+", " ", html.unescape(line)).strip()


def entities_in(line: str) -> list[str]:
    found = []
    for subject, patterns in ENTITY_PATTERNS.items():
        if any(re.search(pattern, line) for pattern in patterns):
            found.append(subject)
    return found


def infer_precision(line: str) -> str | None:
    match = re.search(r"\b(BF16|FP16|FP8|TF32|INT8|INT4|32-bit|16-bit|8-bit|4-bit)\b", line, re.I)
    return match.group(1).lower() if match else None


def add_claim(claims, seen, subject, predicate, value, unit, line_no, quote, qualifiers=None):
    key = (subject, predicate, json_key(qualifiers or {}), str(value), str(unit))
    if key in seen:
        return
    seen.add(key)
    claims.append({
        "id": f"auto-{subject}-{predicate}-{len(claims) + 1}",
        "subject": subject,
        "predicate": predicate,
        "value": value,
        "unit": unit,
        "qualifiers": qualifiers or {},
        "quote": quote[:300],
        "citation_keys": [],
        "confidence": "extracted",
    })


def json_key(data: dict) -> str:
    return repr(sorted(data.items()))


def extract(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    meta = metadata(text)
    slug = path.stem
    claims: list[dict] = []
    seen: set = set()
    citations: list[str] = []

    for key, value in (("title", meta.get("title", "")), ("part", meta.get("part", "")), ("order", meta.get("order", ""))):
        if value == "":
            continue
        try:
            numeric = int(value) if key in {"part", "order"} else value
        except ValueError:
            numeric = value
        add_claim(claims, seen, slug, key, numeric, "count", 0, f"{key}: {value}", {"lesson": slug})

    for line_no, raw_line in enumerate(text.splitlines(), 1):
        line = strip_line(raw_line)
        if not line:
            continue
        if any(marker in line for marker in ('"questions"', '"options"', '"answer"', '"title"', '"explain"')):
            continue
        for match in CITE_RE.finditer(line):
            for citation in (part.strip() for part in match.group(1).split(",")):
                if citation and citation not in citations:
                    citations.append(citation)

        found = entities_in(line)
        if len(set(found)) != 1:
            continue
        subject = found[0]
        precision = infer_precision(line)

        def one(pattern):
            matches = list(pattern.finditer(line))
            return matches[0] if len(matches) == 1 else None

        match = one(PARAM_RE)
        if match:
            qualifiers = {}
            if precision:
                qualifiers["precision"] = precision
            window = line[max(0, match.start() - 30):match.start()].lower()
            if "active" in window:
                qualifiers["parameter_kind"] = "active"
            elif "total" in window:
                qualifiers["parameter_kind"] = "total"
            add_claim(claims, seen, subject, "parameters", match.group(1), match.group(2) or "count", line_no, line, qualifiers)

        match = one(LAYER_RE)
        if match:
            add_claim(claims, seen, subject, "layers", int(match.group(1)), "count", line_no, line, {})

        match = one(CONTEXT_RE)
        if match:
            value = match.group(1) or match.group(2)
            if value:
                add_claim(claims, seen, subject, "context_window", value.replace(",", ""), "token", line_no, line, {})

        if "training" in line.lower() or "trained" in line.lower():
            match = one(TOKENS_RE)
            if match:
                add_claim(claims, seen, subject, "training_tokens", match.group(1), match.group(2) or "count", line_no, line, {})

        match = one(MEMORY_RE)
        if match:
            qualifiers = {"precision": precision} if precision else {}
            add_claim(claims, seen, subject, "memory", match.group(1), match.group(2), line_no, line, qualifiers)

        match = one(TFLOPS_RE)
        if match:
            qualifiers = {"precision": precision} if precision else {}
            add_claim(claims, seen, subject, "tflops", match.group(1), "TFLOPS", line_no, line, qualifiers)

        match = one(DMODEL_RE)
        if match:
            add_claim(claims, seen, subject, "d_model", int(match.group(1)), "count", line_no, line, {})

        match = one(HEADS_RE)
        if match:
            add_claim(claims, seen, subject, "heads", int(match.group(1)), "count", line_no, line, {})

    return {
        "schema_version": 1,
        "source": f"{slug}.php",
        "lesson": slug,
        "title": meta.get("title", ""),
        "part": int(meta["part"]) if meta.get("part", "").isdigit() else meta.get("part", ""),
        "order": int(meta["order"]) if meta.get("order", "").isdigit() else meta.get("order", ""),
        "curated": False,
        "generated_by": "extract_facts.py",
        "citations": citations,
        "claims": claims,
        "relations": [],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("blog", nargs="?", default="blog")
    parser.add_argument("--force", action="store_true", help="overwrite existing fact files")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    blog = Path(args.blog)
    lessons = lesson_files(blog)
    written = skipped = 0
    for slug, path in sorted(lessons.items()):
        target = blog / "facts" / f"{slug}.facts.json"
        if target.exists():
            try:
                existing = json.loads(target.read_text(encoding="utf-8"))
            except Exception:
                existing = {}
            if existing.get("curated") or not args.force:
                skipped += 1
                continue
        data = extract(path)
        if args.dry_run:
            print(f"[dry-run] {target}: {len(data['claims'])} claims")
        else:
            save_json(target, data)
            written += 1
    print(f"[OK] {written} fact file(s) written, {skipped} existing file(s) kept")
    if args.dry_run:
        print("(dry run: nothing written)")


if __name__ == "__main__":
    main()
