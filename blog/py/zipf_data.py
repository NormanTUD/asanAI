#!/usr/bin/env python3
"""
Berechnet Wortfrequenz-Verteilungen für Finnegans Wake und King James Bible
und exportiert sie als JSON für die lndw/index.html Zipf-Visualisierung.
"""
import json
import re
from collections import Counter

FILES = {
    "finwake": "/home/norman/websites/asanai/blog/finwake.txt",
    "kjv":     "/home/norman/websites/asanai/blog/kjv.txt",
}

# Wörter, die wir ignorieren (Bibel-Versmarker etc.)
KJV_VERSE_RE = re.compile(r'^[A-Z0-9]+ ?[0-9]+:[0-9]+\s*$')
KJV_BOOK_LINE = "King James Bible"

WORD_RE = re.compile(r"[A-Za-z']+")


def load_words(path, is_kjv):
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        text = f.read()
    if is_kjv:
        # Nur Inhalt nach der Header-Zeile
        idx = text.find(KJV_BOOK_LINE)
        if idx >= 0:
            text = text[idx + len(KJV_BOOK_LINE):]
    words = []
    for w in WORD_RE.findall(text):
        if not is_kjv and KJV_VERSE_RE.match(w):
            continue
        wl = w.lower()
        if len(wl) < 1:
            continue
        words.append(wl)
    return words


def zipf_data(words, max_ranks=20000):
    counts = Counter(words)
    # Sortiert nach Häufigkeit, dann lexikographisch (deterministisch)
    items = sorted(counts.items(), key=lambda x: (-x[1], x[0]))
    # Top-Wörter und Top-Frequenzen
    top_words = [w for w, _ in items[:max_ranks]]
    top_freqs = [c for _, c in items[:max_ranks]]
    return top_words, top_freqs


def main():
    out = {}
    for key, path in FILES.items():
        is_kjv = (key == "kjv")
        words = load_words(path, is_kjv)
        total_words = len(words)
        unique_words = len(set(words))
        top_words, top_freqs = zipf_data(words)
        out[key] = {
            "total_words": total_words,
            "unique_words": unique_words,
            "top_words": top_words[:200],  # für Annotation reichen 200
            "top_freqs": top_freqs[:200],
        }
        print(f"\n=== {key.upper()} ===")
        print(f"Total tokens:    {total_words:>10,}")
        print(f"Unique tokens:   {unique_words:>10,}")
        print(f"\nTop 10 words (rank, word, count):")
        for i, (w, c) in enumerate(zip(top_words[:10], top_freqs[:10]), 1):
            print(f"  #{i:>2}  {w:<12} {c:>8,}")

        # Zeige Wort #200 und ein paar dazwischen
        print(f"\nWort #1: '{top_words[0]}' = {top_freqs[0]:,}")
        for i in [4, 9, 19, 49, 99, 199]:
            if i < len(top_words):
                print(f"Wort #{i+1}: '{top_words[i]}' = {top_freqs[i]:,}")
        print(f"... (insgesamt {unique_words:,} verschiedene Wörter)")

    out_path = "/home/norman/websites/asanai/blog/lndw/zipf_data.json"
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"\nSaved to {out_path}")


if __name__ == "__main__":
    main()
