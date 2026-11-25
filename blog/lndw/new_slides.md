# Neue Folien: Klassisch vs. KI, Attention-Matrix, Viele Köpfe

Anfang September 2026 für die LNDW-Folien in `index.html` ergänzt:
drei neue Folien rund um Funktion-Lernen und Attention. Dieser Prozess-Ordner
dokumentiert, **was** gebaut wurde, **wo** und **woher die Zahlen stammen**.

## 1. Übersicht der neuen Folien

| Folie (`data-title`) | `id` | Position | Inhalt |
|---|---|---|---|
| `Klassisch vs. KI` | `slide-klassisch-vs-ki` | direkt **vor** „Neuronales Netz Intro" | Klassisches Programmieren (`f: X → Y`, von Hand geschriebene Regeln, AND-Wahrheitstabelle) vs. Lernen (`(x,y)`-Beispiele → `f̂`) mit OR-Tabelle; Kernaussage: „Regeln → Programm" vs. „Beispiele → Regeln". |
| `Attention-Matrix` | `slide-attention-matrix` | direkt **nach** „Attention" | Zwei berechnete 6×6-Attention-Matrizen eines Mini-Modells („the cat sat on the mat"), Kausalmaske als schraffiertes oberes Dreieck (0), eine Zelle durchgerechnet. |
| `Viele Köpfe` | `slide-viele-koepfe` | direkt **nach** „Attention-Matrix" | Tabelle mit 5 Köpfen (Artikel↔Nomen, Subjekt→Verb, Vorheriges-Token, Induktion, Pronomen→Bezug), `\underbrace`-Beschriftung, Messzahlen aus Mini-Modell **und** echtem GPT-2, Literatur-Quellen, Alien-Muster-Warnung. |

Aufgerufene Reihenfolge im Vortrag (`?slides=`):

```
slide-muster-in-der-wirklichkeit, slide-klassisch-vs-ki, slide-neuronales-netz-intro,
slide-neuronales-netz-geschichte, …, slide-attention, slide-attention-matrix,
slide-viele-koepfe, slide-wahrscheinlichkeits-tunnel, …
```

## 2. Platzierung im Quelltext

- „Klassisch vs. KI": `index.html`, Markerkommentar `SLIDE: Klassisch vs. KI`
  (vor `SLIDE: Neural Net Intro`).
- „Attention-Matrix" + „Viele Köpfe": im Markerkommentar `SLIDE: Attention-Matrix`
  bzw. `SLIDE: Viele Köpfe`, beide nach `SLIDE: Attention` und vor
  `SLIDE: Wahrscheinlichkeits-Tunnel`.

Layout-/CSS-Ergänzungen in `index.css`:
`.attn-matrix`, `.attn-z`, `.attn-v`, `.attn-chip`, `.chip-xrow`, `.chip-x`,
`table.heads-table`.

## 3. Wie die Matrizen der Seite entstehen

Beide neuen Attention-Folien rendern ihre Tabellen mit einem kleinen
Inline-`<script>` aus den **hier in `index.html` eingebetteten** Werten.
Diese Werte kommen 1:1 aus den Skripten in `attention_scripts/`
(→ `attention_scripts/outputs/*.json`) und wurden **einmal von Hand
nachgerechnet** (siehe Abschnitt 5).

## 4. Mini-Modell (Folie „Attention-Matrix")

Satz **"the cat sat on the mat"**, 6 Token, `d_model = 4`.

Embeddings (dim0 = „Artikel", dim1 = „Nomen/Sache", dim2 = „Verb",
dim3 = „gleiche Gruppe"):

| Token | e0 | e1 | e2 | e3 |
|---|---|---|---|---|
| the₁ | 0.9 | 0.1 | 0.0 | 1.0 |
| cat  | 0.1 | 0.9 | 0.1 | 1.0 |
| sat  | 0.0 | 0.3 | 1.0 | 0.0 |
| on   | 0.5 | 0.4 | 0.3 | 0.2 |
| the₂ | 0.9 | 0.1 | 0.0 | 1.0 |
| mat  | 0.1 | 0.9 | 0.2 | 1.0 |

Kopf 1 „Artikel↔Nomen": `W_Q = W_K = [1,0,0,1]`
→ `q_i = k_i = e0 + e3` (the₁/the₂ 1.9, cat/mat 1.1, on 0.7, sat 0).

Kopf 2 „Subjekt→Verb": `W_Q = [0,1,1,0]`, `W_K = [0,1,0,0]`.

Rechnung pro Kopf: `S = Q·Kᵀ`, Kausalmaske: oberes Dreieck `-∞`,
`A = softmax(S, Zeile)` (Euklid: mit `d_k=1` entfällt `1/√d_k`).

Ergebnisse (gerundet, exakt in `outputs/mini_h1.json` / `mini_h2.json`):

```
Kopf 1 A:
the₁  [1.00 0    0    0    0    0  ]
cat   [0.71 0.29 0    0    0    0  ]      cat → the₁ = 0.71
sat   [0.33 0.33 0.33 0    0    0  ]
on    [0.44 0.25 0.12 0.19 0    0  ]
the₂  [0.43 0.09 0.01 0.04 0.43 0  ]
mat   [0.31 0.13 0.04 0.08 0.31 0.13]

Kopf 2 A:
the₁  [1.00 0    0    0    0    0  ]
cat   [0.31 0.69 0    0    0    0  ]
sat   [0.20 0.55 0.25 0    0    0  ]      sat → cat = 0.55
on    [0.19 0.34 0.22 0.24 0    0  ]
the₂  [0.19 0.21 0.20 0.20 0.19 0  ]
mat   [0.11 0.25 0.13 0.15 0.11 0.25]
```

## 5. Hand-Nachrechnung einer Zelle (Folie „Attention-Matrix")

Zelle `cat → the₁` in Kopf 1:

```
q_cat  = e(cat) · W_Q = 0.1 + 1.0 = 1.1
k_the  = e(the₁) · W_K = 0.9 + 1.0 = 1.9
Score  = q_cat · k_the = 1.1 · 1.9 = 2.09
mit j<i   Score(cat,cat) = 1.1 · 1.1 = 1.21
softmax:  e^2.09 / (e^2.09 + e^1.21) = 8.0836 / (8.0836 + 3.3535) = 0.707
```

→ auf der Folie steht `0.71`. Analog für `sat → cat` (Kopf 2, 0.55).

## 6. Echtes GPT-2 (Folie „Viele Köpfe")

Messung mit `attention_scripts/gpt2_attention.py` (Umgebung: `torch 2.14.0+cpu`,
`transformers 5.17.0`, Modell `gpt2`, ~600 MB; Ergebnisse in
`outputs/gpt2_attention.json`).

**Satz "the cat sat on the mat" → Token `['the',' cat',' sat',' on',' the',' mat']`:**

| Kopf | Matrix (gerundet) | Deutung |
|---|---|---|
| L0H0 | cat→the 0.73, sat→the 0.48, on→the 0.40 | breiter Artikel-/Satz-Kopf |
| L4H3 | sat→cat 0.96, on→cat 0.90, the₂→cat 0.63 | Kopf sammelt das Subjekt („suject head") |
| **L4H11** | the→the, cat→the, sat→cat, on→sat, the→on, mat→the (je ≈ 1.00) | **Vorheriges-Token-Kopf** — perfekte Sequenzkette |

**Satz "cat dog cat" → Induktionsmuster `[A][B]…[A]→[B]`:**

| Kopf | Matrix | Deutung |
|---|---|---|
| **L7H2** | 2. cat → 1. cat 0.99 | **Duplikat-/Induktions-Vorläuferkopf** |

Diese vier (L0H0, L4H3, L4H11, L7H2) wurden für die Folie ausgesucht; viele
andere Köpfe sind breit/difus und taugen nicht als Illustration.

## 7. Literatur

- Clark, K. et al. (2019): *What Does BERT Look At? An Analysis of BERT's Attention*
  — arXiv:1906.04341. Determiner/Nomen-Köpfe, Objekt-von-Präposition,
  Koreferenz (Pronomen→Bezug).
- Elhage, N. et al. (2021): *A Mathematical Framework for Transformer Circuits*
  (Transformer Circuits Thread). Vorheriges-Token-Attention als Baustein.
- Olsson, C. et al. (2022): *In-context Learning and Induction Heads*
  — arXiv:2209.11895. Induktionsmuster `[A][B]…[A]→[B]`; Basis: Vorheriges-Token.
- Wang, K. et al. (2022): *Interpretability in the Wild: a Circuit for Indirect
  Object Identification in GPT-2 small* — arXiv:2211.00593. Subjekt-/Previous-Token-/Duplikat-Köpfe, IOI-Circuit.

## 8. slide-IDs + URL-Filter

- Jede Folie bekam eine stabile `id="slide-…"` (aus `data-title` abgeleitet,
  ASCII-transliteriert; Duplikate wie „Muster in der Wirklichkeit" → `-2`).
- `presentation.js`: `parseSlideSelection` akzeptiert jetzt **auch Slide-IDs**,
  z. B. `?slides=slide-attention-matrix,slide-viele-koepfe`,
  Zahlenbereiche wie `0,1,10-16` bleiben erlaubt. Numerische und ID-Formen
  sind mischbar.

## 9. Bauen / Testen

```bash
# Mini-Modell (nur numpy):
cd attention_scripts && python3 mini_attention.py

# Echtes GPT-2:
python3 -m venv .venv && .venv/bin/pip install torch transformers
.venv/bin/python gpt2_attention.py

# Folien lokal ansehen:
python3 -m http.server -d blog/lndw      # dann .. öffnen
# direkte Auswahl:  index.html?slides=slide-attention-matrix,slide-viele-koepfe
```

Hinweis: Die Werte in `index.html` sind eingefrorene Kopien der JSON-Ausgaben –
wer sie ändert, ändert nur die Folien-Demo, nicht die Rechnung.