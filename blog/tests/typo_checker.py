#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "rich",
#   "pyspellchecker",
# ]
# ///

"""
typo_checker.py — Spell-check prose inside PHP files

Extracts human-readable text from PHP/HTML/Markdown content,
splits it into words, and checks them against a dictionary.
Supports a whitelist file (typo_whitelist.txt) in the same
directory as this script for false-positive suppression.

Usage:
  uv run typo_checker.py                        # current directory
  uv run typo_checker.py src/                   # single folder
  uv run typo_checker.py index.php lib/         # file + folder
  uv run typo_checker.py "src/**/*.php"         # glob pattern
"""

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


# ============================================================
# UV BOOTSTRAPPING (same pattern as your other validators)
# ============================================================

def compute_exclude_newer_date(days_back=8):
    return (datetime.now(UTC) - timedelta(days=days_back)).strftime("%Y-%m-%dT%H:%M:%SZ")


def should_set_exclude_newer():
    return not os.environ.get("UV_EXCLUDE_NEWER")


def restart_with_uv(script_path, args, env):
    try:
        os.execvpe("uv", ["uv", "run", "--quiet", script_path] + args, env)
    except FileNotFoundError:
        print("uv is not installed. Try:")
        print("  curl -LsSf https://astral.sh/uv/install.sh | sh")
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
from rich.progress import (
    Progress, SpinnerColumn, TextColumn, BarColumn, MofNCompleteColumn,
)
from rich.tree import Tree
from rich.columns import Columns
from rich.text import Text

from spellchecker import SpellChecker

console = Console()

# ============================================================
# CONFIGURATION
# ============================================================

SKIP_DIRS = {
    ".git", "node_modules", "vendor", ".svn", "__pycache__",
    ".idea", ".vscode", "storage", "cache", "dist", "build",
}

WHITELIST_FILENAME = "typo_whitelist.txt"

# Minimum word length to check (skip 1-2 char words)
MIN_WORD_LENGTH = 3

# Maximum typos to report per file (avoid flooding)
MAX_TYPOS_PER_FILE = 60


# ============================================================
# MODULE: WHITELIST MANAGEMENT
# ============================================================

def get_whitelist_path() -> Path:
    """Whitelist lives next to this script."""
    return Path(__file__).resolve().parent / WHITELIST_FILENAME


def load_whitelist() -> set[str]:
    """
    Load whitelist from typo_whitelist.txt.
    One word per line. Lines starting with # are comments. Blank lines ignored.
    """
    wl_path = get_whitelist_path()
    if not wl_path.exists():
        return set()

    words = set()
    try:
        for line in wl_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # Support multiple words per line separated by spaces
            for w in line.split():
                words.add(w.lower())
    except Exception as e:
        console.print(f"[bold yellow]Warning: Could not read whitelist {wl_path}: {e}[/]")
    return words


def create_whitelist_template():
    """Create a template whitelist file if it doesn't exist."""
    wl_path = get_whitelist_path()
    if wl_path.exists():
        return

    template = """# ============================================================
# Typo Checker Whitelist
# ============================================================
# Add one word per line (case-insensitive).
# Lines starting with # are comments.
# This file suppresses false-positive typo detections.
#
# Examples:
#   autoregressive
#   softmax
#   embeddings
#   tokenizer
#
# You can also put multiple words on one line separated by spaces:
#   pytorch tensorflow numpy
# ============================================================
"""
    try:
        wl_path.write_text(template, encoding="utf-8")
        console.print(f"[bold green]✓ Created whitelist template:[/] {wl_path}")
    except Exception as e:
        console.print(f"[bold yellow]Could not create whitelist template: {e}[/]")


# ============================================================
# MODULE: INPUT RESOLUTION (files, folders, globs)
# ============================================================

def resolve_inputs(args: list[str]) -> list[Path]:
    """
    Accept any mix of .php files, directories, glob patterns.
    Returns deduplicated, sorted list of .php file paths.
    """
    if not args:
        args = ["."]

    php_files: set[Path] = set()

    for arg in args:
        p = Path(arg)

        if p.is_file():
            if p.suffix == ".php":
                php_files.add(p.resolve())
            else:
                console.print(f"[bold yellow]Skipping non-PHP file:[/] {p}")
            continue

        if p.is_dir():
            for root, dirs, files in os.walk(p):
                dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
                for f in files:
                    if f.endswith(".php"):
                        php_files.add((Path(root) / f).resolve())
            continue

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

        console.print(
            f"[bold red]Not found:[/] '{arg}' is not a file, directory, or matching glob pattern."
        )

    return sorted(php_files)


# ============================================================
# MODULE: TEXT EXTRACTION (strip PHP, HTML, LaTeX, code, etc.)
# ============================================================

def strip_php_blocks(content: str) -> str:
    """Remove <?php ... ?> blocks, preserving newlines for line counting."""
    result = []
    i = 0
    in_php = False
    while i < len(content):
        if not in_php:
            if content[i:i + 5] == "<?php":
                in_php = True
                i += 5
            elif content[i:i + 2] == "<?":
                in_php = True
                i += 2
            else:
                result.append(content[i])
                i += 1
        else:
            if content[i:i + 2] == "?>":
                in_php = False
                i += 2
            else:
                if content[i] == "\n":
                    result.append("\n")
                i += 1
    return "".join(result)


def strip_code_and_markup(text: str) -> str:
    """
    Remove HTML tags, LaTeX math, code blocks, URLs, and other
    non-prose content. Preserve newlines for line counting.
    """
    # Remove <pre>...</pre> and <code>...</code> blocks
    text = re.sub(r"<pre[^>]*>.*?</pre>", _nl_replace, text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<code[^>]*>.*?</code>", _nl_replace, text, flags=re.DOTALL | re.IGNORECASE)

    # Remove <script> and <style>
    text = re.sub(r"<script[^>]*>.*?</script>", _nl_replace, text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<style[^>]*>.*?</style>", _nl_replace, text, flags=re.DOTALL | re.IGNORECASE)

    # Remove HTML comments
    text = re.sub(r"<!--.*?-->", _nl_replace, text, flags=re.DOTALL)

    # Remove display LaTeX: $$ ... $$
    text = re.sub(r"\$\$.*?\$\$", _nl_replace, text, flags=re.DOTALL)

    # Remove inline LaTeX: $ ... $ (single line)
    text = re.sub(r"\$[^$\n]+\$", " ", text)

    # Remove \( ... \) and \[ ... \]
    text = re.sub(r"\\\(.*?\\\)", " ", text, flags=re.DOTALL)
    text = re.sub(r"\\\[.*?\\\]", _nl_replace, text, flags=re.DOTALL)

    # Remove LaTeX \cite, \ref, etc.
    text = re.sub(r"\\(?:cite|ref|label|eqref|textbf|textit|text|mathrm|mathbb|mathcal|operatorname|frac|sqrt|vec|hat|bar|dot|ddot)\b(?:\[[^\]]*\])?\{[^}]*\}", " ", text)

    # Remove remaining LaTeX commands
    text = re.sub(r"\\[a-zA-Z]+(?:\{[^}]*\})*", " ", text)

    # Remove HTML tags (but keep inner text)
    text = re.sub(r"<[^>]+>", " ", text)

    # Remove URLs
    text = re.sub(r"https?://\S+", " ", text)

    # Remove markdown image/link syntax
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", text)
    text = re.sub(r"\[[^\]]*\]\([^)]*\)", " ", text)

    # Remove markdown formatting
    text = re.sub(r"\*{1,3}([^*]+)\*{1,3}", r"\1", text)  # bold/italic
    text = re.sub(r"`[^`]+`", " ", text)  # inline code

    # Remove markdown headers (keep text)
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)

    # Remove markdown table separators
    text = re.sub(r"^\|?[-:| ]+\|?$", "", text, flags=re.MULTILINE)

    # Remove pipe characters from table rows but keep cell text
    text = re.sub(r"\|", " ", text)

    # Remove HTML entities
    text = re.sub(r"&[a-zA-Z]+;", " ", text)
    text = re.sub(r"&#x?[0-9a-fA-F]+;", " ", text)

    # Remove standalone numbers, hex values, dimensions
    text = re.sub(r"\b\d[\d,.]*\b", " ", text)
    text = re.sub(r"\b0x[0-9a-fA-F]+\b", " ", text)

    # Remove common units and abbreviations that aren't words
    text = re.sub(r"\b\d+[KMGTkmgt][Bb]?\b", " ", text)

    # Remove file extensions
    text = re.sub(r"\.\w{1,4}\b", " ", text)

    return text


def _nl_replace(m: re.Match) -> str:
    """Replace match with equivalent newlines to preserve line numbering."""
    return "\n" * m.group(0).count("\n")


# ============================================================
# MODULE: WORD EXTRACTION
# ============================================================

# Pattern to match words (including hyphenated and apostrophe'd)
WORD_PATTERN = re.compile(r"[a-zA-Z]+(?:['-][a-zA-Z]+)*")

# Common patterns that look like words but aren't (camelCase, ALLCAPS identifiers, etc.)
IDENTIFIER_PATTERNS = [
    re.compile(r"^[a-z]+[A-Z]"),          # camelCase
    re.compile(r"^[A-Z][a-z]+[A-Z]"),     # PascalCase with multiple humps
    re.compile(r"^[A-Z]{2,}$"),            # ALL_CAPS (2+ letters)
    re.compile(r"^[a-z]+_[a-z]+"),         # snake_case
]


def is_likely_identifier(word: str) -> bool:
    """Check if a word looks like a code identifier rather than prose."""
    for pat in IDENTIFIER_PATTERNS:
        if pat.match(word):
            return True
    return False


def extract_words_with_lines(text: str) -> list[tuple[str, int]]:
    """
    Extract (word, line_number) pairs from text.
    Splits camelCase/PascalCase into sub-words for checking.
    """
    results = []
    for line_num, line in enumerate(text.split("\n"), 1):
        for match in WORD_PATTERN.finditer(line):
            raw_word = match.group(0)

            # Skip very short words
            if len(raw_word) < MIN_WORD_LENGTH:
                continue

            # If it looks like camelCase/PascalCase, split into sub-words
            if is_likely_identifier(raw_word):
                sub_words = re.findall(r"[A-Z]?[a-z]+|[A-Z]+(?=[A-Z][a-z]|\b)", raw_word)
                for sw in sub_words:
                    if len(sw) >= MIN_WORD_LENGTH:
                        results.append((sw.lower(), line_num))
            else:
                # Handle hyphenated words: check each part
                parts = raw_word.split("-")
                for part in parts:
                    # Also split on apostrophes for possessives
                    sub_parts = part.split("'")
                    for sp in sub_parts:
                        if len(sp) >= MIN_WORD_LENGTH:
                            results.append((sp.lower(), line_num))

    return results


# ============================================================
# MODULE: SPELL CHECKING
# ============================================================

def build_spell_checker(whitelist: set[str]) -> SpellChecker:
    """
    Build a SpellChecker instance with the whitelist loaded.
    Uses pyspellchecker's built-in English dictionary (no manual word lists).
    """
    spell = SpellChecker(language="en", distance=1)

    # Add whitelist words as known
    if whitelist:
        spell.word_frequency.load_words(list(whitelist))

    return spell


# Built-in domain words that are always valid in technical PHP/ML content.
# These supplement the dictionary — NOT a manual typo list.
TECH_DOMAIN_WORDS = {
    # ML/AI terms
    "llm", "llms", "gpt", "bert", "rag", "embeddings", "tokenizer", "tokenizers",
    "tokenization", "autoregressive", "softmax", "logits", "logit", "backpropagation",
    "backprop", "feedforward", "relu", "gelu", "sigmoid", "tanh", "lstm", "gru",
    "transformer", "transformers", "pretrained", "pretraining", "finetuning",
    "finetuned", "finetune", "distillation", "quantization", "quantize", "quantized",
    "dequantize", "int8", "int4", "fp16", "fp32", "bf16", "bfloat16",
    "multihead", "multimodal", "unimodal", "crossmodal",
    "encoder", "decoder", "encoders", "decoders",
    "hyperparameter", "hyperparameters", "overfitting", "underfitting",
    "regularization", "dropout", "batchnorm", "layernorm",
    "conv", "convolution", "convolutional", "pooling",
    "dataset", "datasets", "dataloader", "dataloaders",
    "gpu", "gpus", "cpu", "cpus", "tpu", "tpus", "cuda", "vram",
    "flop", "flops", "tflop", "tflops",
    "pytorch", "tensorflow", "numpy", "scipy", "pandas",
    "huggingface", "openai", "anthropic", "gemini", "claude", "chatgpt",
    "perplexity", "bleu", "rouge",
    "cosine", "euclidean", "manhattan",
    "centroid", "centroids", "voronoi",
    "hnsw", "faiss", "annoy", "ivf",
    "chunking", "chunked", "rechunk",
    "reranker", "reranking", "rerank", "reranked",
    "deduplication", "deduplicate", "deduplicated",
    "vectordb", "pinecone", "weaviate", "qdrant", "chroma", "milvus", "pgvector",
    "elasticsearch", "opensearch",

    # Web/dev terms
    "html", "css", "javascript", "php", "sql", "json", "xml", "yaml", "toml",
    "api", "apis", "url", "urls", "uri", "uris", "http", "https", "tcp", "udp",
    "dom", "svg", "png", "jpg", "jpeg", "gif", "webp", "avif",
    "cdn", "dns", "ssl", "tls", "cors", "csrf", "xss",
    "nginx", "apache", "redis", "mysql", "postgres", "postgresql", "sqlite",
    "mongodb", "dynamodb", "graphql", "restful", "websocket", "websockets",
    "frontend", "backend", "fullstack", "devops", "cicd", "kubernetes", "docker",
    "localhost", "webhook", "webhooks", "middleware",
    "async", "await", "callback", "callbacks", "promise", "promises",
    "serialization", "deserialization", "serialize", "deserialize",
    "refactor", "refactored", "refactoring",
    "codebase", "repo", "repos", "github", "gitlab", "bitbucket",
    "npm", "pip", "conda", "homebrew", "ubuntu", "debian", "macos", "linux", "windows",
    "iframe", "href", "src", "div", "img", "btn",

    # Math/science
    "eigenvalue", "eigenvalues", "eigenvector", "eigenvectors",
    "hessian", "jacobian", "laplacian", "gaussian", "bayesian",
    "stochastic", "deterministic", "probabilistic",
    "argmax", "argmin", "supremum", "infimum",
    "bijection", "surjection", "injection",
    "isomorphism", "homeomorphism", "diffeomorphism",
    "manifold", "manifolds", "subspace", "subspaces",
    "orthogonal", "orthonormal",

    # Common abbreviations / short forms
    "config", "configs", "init", "utils", "util", "misc", "tmp", "temp",
    "auth", "admin", "env", "args", "kwargs", "params", "param",
    "src", "dst", "idx", "num", "len", "val", "vals", "str", "int", "bool",
    "approx", "avg", "max", "min", "std", "var",
    "pre", "post", "multi", "sub", "super",
    "ok", "etc", "vs", "ie", "eg",

    # Names commonly appearing in citations/references
    "vaswani", "hinton", "bengio", "lecun", "goodfellow", "schmidhuber",
    "sutskever", "kaplan", "dao", "dettmers", "leviathan",
    "arxiv",
}


def check_file_typos(
    content: str,
    filepath: Path,
    spell: SpellChecker,
    whitelist: set[str],
) -> list[dict]:
    """
    Extract prose from a PHP file, spell-check it, return typo issues.
    """
    # Step 1: Strip PHP code
    text = strip_php_blocks(content)

    # Step 2: Strip code/markup, keep prose
    text = strip_code_and_markup(text)

    # Step 3: Extract words with line numbers
    words_with_lines = extract_words_with_lines(text)

    if not words_with_lines:
        return []

    # Step 4: Batch spell check — get unique words first
    unique_words = {w for w, _ in words_with_lines}

    # Filter out whitelisted and tech domain words before checking
    words_to_check = {
        w for w in unique_words
        if w not in whitelist and w not in TECH_DOMAIN_WORDS
    }

    # Find unknown words
    unknown = spell.unknown(words_to_check)

    if not unknown:
        return []

    # Step 5: Build issues with line numbers and suggestions
    issues = []
    seen_words: dict[str, int] = {}  # word -> first line seen
    word_counts: dict[str, int] = {}  # word -> occurrence count

    for word, line_num in words_with_lines:
        if word in unknown:
            if word not in seen_words:
                seen_words[word] = line_num
                word_counts[word] = 1
            else:
                word_counts[word] += 1

    # Generate issues (one per unique misspelled word)
    for word, first_line in sorted(seen_words.items(), key=lambda x: x[1]):
        if len(issues) >= MAX_TYPOS_PER_FILE:
            issues.append({
                "type": "typo_overflow",
                "line": 0,
                "word": "",
                "message": f"... and more (capped at {MAX_TYPOS_PER_FILE} per file)",
                "suggestions": [],
                "count": 0,
            })
            break

        suggestions = spell.candidates(word)
        if suggestions:
            # Remove the word itself from suggestions
            suggestions = sorted(suggestions - {word})[:5]

        count = word_counts[word]
        count_str = f" (×{count})" if count > 1 else ""

        suggestion_str = ""
        if suggestions:
            suggestion_str = f" → maybe: {', '.join(suggestions)}"

        issues.append({
            "type": "typo",
            "line": first_line,
            "word": word,
            "message": f'"{word}"{count_str}{suggestion_str}',
            "suggestions": suggestions or [],
            "count": count,
        })

    return issues


# ============================================================
# MODULE: DISPLAY HELPERS
# ============================================================

def severity_style(issue_type: str) -> str:
    if issue_type == "typo":
        return "bold yellow"
    elif issue_type == "typo_overflow":
        return "dim"
    return "bold blue"


def severity_icon(issue_type: str) -> str:
    if issue_type == "typo":
        return "📝"
    elif issue_type == "typo_overflow":
        return "…"
    return "ℹ️"


# ============================================================
# MAIN
# ============================================================

def main():
    console.print()
    console.print(Panel(
        "[bold bright_cyan]📝 PHP Typo Checker[/]\n\n"
        "[dim]Extracts prose from PHP files and spell-checks it.[/]\n\n"
        "  [bold green]✓[/] Strips PHP code, HTML tags, LaTeX math, code blocks\n"
        "  [bold green]✓[/] Splits camelCase/PascalCase identifiers into sub-words\n"
        "  [bold green]✓[/] Uses a real English dictionary (pyspellchecker)\n"
        "  [bold green]✓[/] Supports a whitelist file for false positives\n"
        "  [bold green]✓[/] Shows suggestions for misspelled words\n\n"
        "[dim]Usage:[/]\n"
        "  [bold]typo_checker.py[/]                          [dim]# current directory[/]\n"
        "  [bold]typo_checker.py src/[/]                     [dim]# single folder[/]\n"
        "  [bold]typo_checker.py index.php lib/[/]           [dim]# file + folder[/]\n"
        '  [bold]typo_checker.py "src/**/*.php"[/]           [dim]# glob pattern[/]\n\n'
        f"[dim]Whitelist file:[/] [bold bright_white]{WHITELIST_FILENAME}[/] [dim](same folder as this script)[/]\n"
        f"[dim]Min word length:[/] [bold]{MIN_WORD_LENGTH}[/]  "
        f"[dim]Max typos/file:[/] [bold]{MAX_TYPOS_PER_FILE}[/]",
        title="[bold bright_white]Typo Checker[/]",
        border_style="bright_cyan",
        padding=(1, 3),
    ))
    console.print()

    # ── Whitelist ───────────────────────────────────────────
    create_whitelist_template()
    whitelist = load_whitelist()

    wl_path = get_whitelist_path()
    if whitelist:
        console.print(
            f"[bold green]✓ Whitelist loaded:[/] {len(whitelist)} word(s) from {wl_path}"
        )
    else:
        console.print(
            f"[dim]ℹ️  Whitelist is empty or not found:[/] {wl_path}\n"
            f"[dim]   Add words to suppress false positives.[/]"
        )
    console.print()

    # ── Build spell checker ─────────────────────────────────
    console.print("[dim]Loading dictionary...[/]")
    spell = build_spell_checker(whitelist)
    # Also load tech domain words into the checker
    spell.word_frequency.load_words(list(TECH_DOMAIN_WORDS))
    console.print("[bold green]✓ Dictionary ready[/] (English + tech domain + whitelist)")
    console.print()

    # ── Resolve inputs ──────────────────────────────────────
    targets = sys.argv[1:]
    php_files = resolve_inputs(targets)

    if not targets:
        console.print(
            f"[bold]Scanning:[/] {Path('.').resolve()} "
            f"[dim](no arguments — using current directory)[/]"
        )
    else:
        console.print(f"[bold]Targets:[/] {', '.join(targets)}")
    console.print()

    if not php_files:
        console.print("[bold yellow]No PHP files found for the given input(s).[/]")
        sys.exit(0)

    console.print(f"[bold]Found:[/] {len(php_files)} PHP file(s)\n")

    # Common base for relative paths
    try:
        common_base = Path(os.path.commonpath(php_files))
        if common_base.is_file():
            common_base = common_base.parent
    except ValueError:
        common_base = Path(".")

    # ── Check files ─────────────────────────────────────────
    results: list[tuple[Path, list[dict]]] = []

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        MofNCompleteColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("Checking for typos...", total=len(php_files))

        for filepath in php_files:
            progress.update(task, description=f"Checking {filepath.name}...")

            try:
                content = filepath.read_text(encoding="utf-8", errors="replace")
            except Exception as e:
                results.append((filepath, [{
                    "type": "error",
                    "line": 0,
                    "word": "",
                    "message": f"Cannot read file: {e}",
                    "suggestions": [],
                    "count": 0,
                }]))
                progress.advance(task)
                continue

            issues = check_file_typos(content, filepath, spell, whitelist)
            results.append((filepath, issues))
            progress.advance(task)

    # ── Display results ─────────────────────────────────────
    console.print()
    console.print(Rule(title="[bold bright_cyan]Results[/]", style="bright_blue"))
    console.print()

    total_files = len(results)
    files_with_typos = 0
    total_typos = 0
    all_misspelled: dict[str, list[str]] = {}  # word -> [filenames]

    for filepath, issues in results:
        if not issues:
            continue

        files_with_typos += 1
        total_typos += sum(1 for i in issues if i["type"] == "typo")

        try:
            rel_path = filepath.relative_to(common_base)
        except ValueError:
            rel_path = filepath

        tree = Tree(f"[bold bright_white]📄 {rel_path}[/]")

        for issue in issues:
            icon = severity_icon(issue["type"])
            style = severity_style(issue["type"])
            line_info = f"[dim]line {issue['line']}:[/] " if issue.get("line", 0) > 0 else ""
            tree.add(f"{icon} {line_info}[{style}]{issue['message']}[/]")

            # Track for global summary
            if issue["type"] == "typo" and issue["word"]:
                fname = filepath.name
                all_misspelled.setdefault(issue["word"], []).append(fname)

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

    if files_with_typos == 0:
        summary_table.add_row("Files with typos", "0", "[bold green]✅ All clean![/]")
    else:
        summary_table.add_row(
            "Files with typos",
            f"[bold yellow]{files_with_typos}[/]",
            f"[bold yellow]⚠️  {files_with_typos}/{total_files}[/]",
        )

    summary_table.add_row(
        "Unique misspelled words",
        f"[bold yellow]{len(all_misspelled)}[/]" if all_misspelled else "0",
        "[green]✓[/]" if not all_misspelled else "📝",
    )

    summary_table.add_row(
        "Total typo occurrences",
        f"[bold yellow]{total_typos}[/]" if total_typos else "0",
        "[green]✓[/]" if not total_typos else "📝",
    )

    summary_table.add_row(
        "Whitelist words loaded",
        str(len(whitelist)),
        "📋" if whitelist else "[dim]—[/]",
    )

    summary_table.add_row("", "", "")
    summary_table.add_row(
        "[bold]Verdict[/]",
        f"[bold]{total_typos}[/]",
        "[bold green]🎉 CLEAN[/]" if total_typos == 0 else f"[bold yellow]📝 {total_typos} typo(s)[/]",
    )

    console.print(summary_table)
    console.print()

    # ── Most common misspelled words ────────────────────────
    if all_misspelled:
        console.print(Rule(title="[bold bright_cyan]Most Common Misspelled Words[/]", style="bright_blue"))
        console.print()

        top_words = sorted(all_misspelled.items(), key=lambda x: len(x[1]), reverse=True)[:20]

        word_table = Table(
            box=box.SIMPLE_HEAVY,
            border_style="bright_blue",
            header_style="bold white",
            show_lines=False,
            padding=(0, 2),
        )
        word_table.add_column("Word", style="bold yellow")
        word_table.add_column("Occurrences", justify="right")
        word_table.add_column("Files", style="dim")

        for word, files in top_words:
            unique_files = sorted(set(files))
            files_str = ", ".join(unique_files[:5])
            if len(unique_files) > 5:
                files_str += f" (+{len(unique_files) - 5} more)"
            word_table.add_row(word, str(len(files)), files_str)

        console.print(word_table)
        console.print()

        # ── Whitelist hint ──────────────────────────────────
        console.print(Panel(
            "[bold bright_cyan]💡 Whitelist Tip[/]\n\n"
            f"To suppress false positives, add words to:\n"
            f"  [bold bright_white]{get_whitelist_path()}[/]\n\n"
            "One word per line. Example:\n"
            "  [dim]# Technical terms[/]\n"
            "  [dim]autoregressive[/]\n"
            "  [dim]softmax[/]\n"
            "  [dim]embeddings[/]\n\n"
            f"[dim]Currently whitelisted:[/] {len(whitelist)} word(s)",
            border_style="cyan",
            padding=(1, 3),
        ))
        console.print()

    # ── Clean files note ────────────────────────────────────
    clean_files = total_files - files_with_typos
    if clean_files > 0 and files_with_typos > 0:
        console.print(f"  [dim]{clean_files} file(s) had no typos detected.[/]")
        console.print()

    # ── Final panel ─────────────────────────────────────────
    if total_typos == 0:
        console.print(Panel(
            "[bold bright_green]No typos detected in any PHP files! 🎉[/]",
            border_style="green",
            padding=(0, 2),
        ))
    else:
        console.print(Panel(
            f"[bold bright_yellow]📝 {total_typos} potential typo(s) found in {files_with_typos} file(s).[/]\n"
            f"[dim]Review the results above. Add false positives to the whitelist file.[/]",
            border_style="yellow",
            padding=(0, 2),
        ))

    # Exit code: 0 always (typos are advisory, not blocking)
    sys.exit(0)


if __name__ == "__main__":
    main()
