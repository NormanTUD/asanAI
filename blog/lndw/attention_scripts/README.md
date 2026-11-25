# Attention – nachrechenbare Beispiele

Dieses Verzeichnis enthält die Skripte, mit denen die Attention-Matrizen
der neuen Präsentationsfolien berechnet wurden. Alles soll **per Hand
nachrechenbar** sein.

## Dateien

| Datei                                  | Inhalt |
|----------------------------------------|--------|
| `mini_attention.py`                    | Konstruiertes Mini-Modell (4 Dimensionen, 2 Köpfe), nur `numpy`. Rechnet `Q·Kᵀ`, Kausalmaske, Softmax **Schritt für Schritt** vor. |
| `gpt2_attention.py`                    | Lädt das **echte GPT-2 small** und misst echte Attention-Köpfe auf denselben Sätzen (benötigt `torch` + `transformers`). |
| `outputs/mini_h1.json`, `outputs/mini_h2.json` | Die fertigen Matrizen des Mini-Modells. |
| `outputs/gpt2_attention.json`          | Die gemessenen Matrizen aus GPT-2. |

## Ausführen

```bash
# Mini-Modell (keine Abhängigkeiten außer numpy)
python3 mini_attention.py

# echtes GPT-2 (einmalig ~600 MB Download)
pip install torch transformers
python3 gpt2_attention.py
```

## Die Rechnung (Formel)

Ein Attention-Kopf rechnet:

```
Q = X · W_Q            # Query   („Was frage ich?")
K = X · W_K            # Key     („Was biete ich an?")

Score_ij = Q_i · K_j   # alle Token-Paare

# Kausalmaske (Autoregression): Token i sieht nur Token 0…i
Score_ij = -∞          # für j > i

# Softmax pro Zeile → Zeilensumme = 1
A_ij = exp(Score_ij) / Σ_k exp(Score_ik)
```

Im Mini-Modell ist `d_k = 1`, daher entfällt die Skalierung `1/√d_k`
(für `d_k = 1` ist sie `1`). In echten Modellen ist `d_k` meist 64–128
und man teilt durch `√d_k`, damit die Softmax-Werte nicht wegbrennen.

## Das Mini-Modell

Satz: **"the cat sat on the mat"** · 6 Token · Embeddings 4-dimensional:

| dim0              | dim1           | dim2     | dim3                  |
|-------------------|----------------|----------|-----------------------|
| „ist ein Artikel" | „ist ein Nomen/Ding" | „ist ein Verb" | „gleiche Kongruenz-Gruppe" |

| Token | e0 | e1 | e2 | e3 |
|-------|----|----|----|----|
| the₁  | 0.9 | 0.1 | 0.0 | 1.0 |
| cat   | 0.1 | 0.9 | 0.1 | 1.0 |
| sat   | 0.0 | 0.3 | 1.0 | 0.0 |
| on    | 0.5 | 0.4 | 0.3 | 0.2 |
| the₂  | 0.9 | 0.1 | 0.0 | 1.0 |
| mat   | 0.1 | 0.9 | 0.2 | 1.0 |

Kopf 1 – „Artikel↔Nomen": `W_Q = W_K = [1, 0, 0, 1]` (schaut auf
„Artikel-Dim" e0 und „Kongruenz-Dim" e3). Muster: Nomen blicken stark
auf ihren Artikel (`cat → the₁` ≈ 0.71).

Kopf 2 – „Subjekt↔Verb": `W_Q = [0, 1, 1, 0]`, `W_K = [0, 1, 0, 0]`
(Verb fragt nach „Nomen-haftigkeit"). Muster: `sat → cat` ≈ 0.55.

**Wichtig:** Die Embeddings/Weight-Gewichte sind *konstruiert*, damit
jemand sie ohne Computer durchrechnen kann. In Wirklichkeit lernt das
Modell diese Projektionen selbst aus Daten (siehe Seite „Viele Köpfe").

## Echtes GPT-2 (gemessen)

Auf "the cat sat on the mat" findet man u.a.:

| Kopf            | Muster                                  | Deutung |
|-----------------|-----------------------------------------|---------|
| `L4H11`         | the→the, cat→the, sat→cat, on→sat, the→on, mat→the (≈1.0) | **Vorheriges-Token-Kopf** (Sequenzkette) |
| `L4H3`          | sat→cat 0.96, on→cat 0.90, the₂→cat 0.63 | Verb/Objekte blicken aufs **Subjekt** |
| `L0H0`          | cat→the 0.73 …                          | breiter **Artikel/Satz-Kopf** |

Auf "cat dog cat" (wiederholtes Muster `[A][B]…[A]→[B]`):

| Kopf            | Muster                                  | Deutung |
|-----------------|-----------------------------------------|---------|
| `L7H2`          | 2. "cat" → 1. "cat" 0.99                 | **Duplikat-Kopf** (Induktions-Vorläufer) |

Diese Köpfe sind in der Interpretierbarkeits-Literatur gut dokumentiert
(Vorheriges-Token: Zhou et al./Elhage; Induktion: Olsson et al. 2022).
```