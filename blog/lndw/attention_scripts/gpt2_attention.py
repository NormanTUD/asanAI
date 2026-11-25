#!/usr/bin/env python3
"""
Echte GPT-2 small Attention messen – für die Folie "Viele Koepfe".

Braucht: pip install torch transformers
Modell wird beim ersten Lauf heruntergeladen (~600 MB) und danach gecacht.

Untersucht zwei Saetze:
  1. "the cat sat on the mat"   ->  Artikel/Satz-Kopf L0H0, Subjekt-Kopf L4H3,
                                    Vorheriges-Token-Kopf L4H11
  2. "cat dog cat"              ->  Duplikat-/Induktions-Kopf L7H2
                                    (Muster [A][B]...[A] -> blickt auf A)

Schreibt: outputs/gpt2_attention.json
"""

import json
import os
import sys

MAT_SENTENCES = {
    "the cat sat on the mat": [
        {"layer": 0, "head": 0, "note": "breiter Artikel/Satz-Kopf (cat->the 0.73)"},
        {"layer": 4, "head": 3, "note": "Subjekt-Kopf (sat->cat 0.96, on->cat 0.90)"},
        {"layer": 4, "head": 11, "note": "Vorheriges-Token-Kopf (Kette, je ~1.00)"},
    ],
    "cat dog cat": [
        {"layer": 7, "head": 2, "note": "Duplikat-Kopf / Induktions-Vorlaeufer (2. cat -> 1. cat 0.99)"},
    ],
}


def main():
    try:
        import numpy as np
        import torch
        from transformers import GPT2LMHeadModel, GPT2Tokenizer
    except ImportError as exc:  # pragma: no cover
        sys.exit(
            "Fehlende Abhaengigkeit: " + str(exc)
            + "\n  pip install torch transformers\n"
              "Hinweis: das Mini-Modell (mini_attention.py) kommt ohne diese Pakete aus."
        )

    tok = GPT2Tokenizer.from_pretrained("gpt2")
    model = GPT2LMHeadModel.from_pretrained("gpt2", output_attentions=True)
    model.eval()

    os.makedirs("outputs", exist_ok=True)
    data = {}

    with torch.no_grad():
        for sentence, heads in MAT_SENTENCES.items():
            ids = tok(sentence, return_tensors="pt")
            tokens = [tok.decode([t]) for t in ids["input_ids"][0].flatten().tolist()]
            out = model(**ids, output_attentions=True)
            A = torch.stack(out.attentions)[:, 0].numpy()  # (12,12,n,n)

            data[sentence] = {"tokens": tokens, "heads": []}
            for spec in heads:
                l, h = spec["layer"], spec["head"]
                matrix = np.round(A[l, h], 3).tolist()
                argmax = [int(A[l, h, i].argmax()) for i in range(len(tokens))]
                entry = {
                    "layer": l,
                    "head": h,
                    "note": spec["note"],
                    "argmax_index": argmax,
                    "argmax_token": [tokens[i] for i in argmax],
                    "matrix": matrix,
                }
                data[sentence]["heads"].append(entry)

                print("=" * 70)
                print(f'Satz: {sentence!r}  |  L{l}H{h}  ({spec["note"]})')
                print("Token:", tokens)
                print("argmax pro Zeile:", entry["argmax_token"])
                for i, t in enumerate(tokens):
                    row = "  ".join(f"{v:5.2f}" for v in matrix[i])
                    print(f"  {t:>8} | {row}")
                print()

    path = os.path.join("outputs", "gpt2_attention.json")
    with open(path, "w") as fh:
        json.dump(data, fh, indent=2)
    print("-> geschrieben:", path)


if __name__ == "__main__":
    main()