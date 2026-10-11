# Sprache als Fenster: Eine garbentheoretische Perspektive

> **Kernthese:** Sprachen sind nicht konkurrierende Beschreibungen *derselben* Welt,
> sondern verschiedene **Schnitte** über demselben **Situs**. Übersetzbarkeit ist
> Funktorialität, nicht Isomorphie. Inkommensurabilität ist eine *messbare*
> Obstruktion — ein Kozykel, der nicht schließt.

---

## 1. Die Grundidee

Die Welt ist der **Basisraum** $B$: der Zustandsraum aller Sachverhalte und
Situationen. Die Raumzeit $(x,y,z,t)$ ist einer seiner Unterräume, eine mögliche
Faserung unter vielen.

Über jedem Punkt (**Keim**) liegt ein **Halm**: die Gesamtheit aller Messungen,
die dort stattfinden können — Temperatur, Druck, Energie, aber auch leiblich
wahrgenommene Atmosphäre, Regelmäßigkeit, Gemütlichkeit.

Eine **Messung** ist ein Schnitt über einer Region. Zwei Messungen am selben Punkt
widersprechen sich nicht — sie sind kompatibel, weil die Welt zusammenhängt.
Wo sie es nicht sind, ist entweder das Modell falsch oder der Basisraum
falsch gewählt.

## 2. Was die Garbentheorie beiträgt

| Begriff | Bedeutung hier |
|---|---|
| **Keim** | Ein Punkt möglicher Messung |
| **Halm** | Alle Messungen an diesem Punkt |
| **Schnitt** | Eine konkrete Messung über einer Region |
| **Restriktion** | Spezialisierung des Kontexts |
| **Überlappung** | Gemeinsam abgedeckter Sachverhalt |
| **Kompatibilität** | Nicht $x = y$, sondern $\exists f: f(x) = y$ |
| **Verklebung** | Lokale Daten → globaler Schnitt |
| **Kohomologie** | Die Obstruktion gegen Verklebung |

## 3. Die drei präzisierten Thesen

### These 1 — Faserungsabhängigkeit
> Ob ein Phänomen strikte oder homotopische Verklebung braucht,
> hängt nicht vom Phänomen ab, sondern von der **Wahl der Faserung**.

Donner/Blitz über Minkowski-Basis: strikt verklebbar.
Über räumlicher Basis mit $t$ in der Faser: braucht Übergangsabbildung,
die die Laufzeitdifferenz kodiert — plus Kozykelbedingung auf
Dreifachüberlappungen (Blitz, Donner, Echo).

### These 2 — Übersetzung ist Funktorialität
> Verlustfreie Übersetzung = voller **und** treuer Funktor.
> Arabisch → Englisch ist voll, aber nicht treu.
> `ʿamm`, `khāl` → `uncle`: surjektiv, nicht injektiv.
> Der Funktor hat keinen Rechtsinversen.

Das ist die exakte Form von *"man kann es erklären, aber nicht übersetzen"*.

### These 3 — Inkommensurabilität als Kohomologie
> Der **Garbifizierungsdefekt** $\mathcal{F}_L^+ / \mathcal{F}_L$ misst,
> was eine Sprache *sagen müsste, aber nicht sagt*.
> $H^1 \neq 0$ heißt: lokal konsistent, global nicht verklebbar.

## 4. Die ausgearbeitete Instanz

**Feld:** Verwandtschaftsterminologie
**Basisraum:** $B = \{(g, l, s, a)\}$ — Generation, Linealität, Geschlecht, Ego
**Daten:** Murdock's Ethnographic Atlas, Kinbank (1200+ Sprachen)

**Das Dreieck:**

```
   Hawaiianisch ──φ_AB──▶ Englisch
        │                     │
        │                     │ (nicht funktional)
      φ_AC                  φ_BC
        │                     │
        ▼                     ▼
      Arabisch ◀──────────────┘
```


Rundreise: `ʿamm` → `uncle` → $\{ʿamm, khāl\}$.
**Der Kozykel schließt nicht.** Messbare Inkommensurabilität.

## 5. Was offen bleibt

- [ ] Woher kommt der Basisraum bei strittigen Feldern (`Gemütlichkeit`, `mind`)?
- [ ] Welche Faserung *wählt* eine Sprache, und warum?
- [ ] Evidentialität (Quechua): Schnitt oder Unterobjektklassifizierer?
- [ ] Verhältnis Gärdenfors-Konvexität (affin) zu Garbentopologie

## 6. Verwandte Arbeiten

- `coherent_difference.php` — die Kette Distinktion → Invarianz
- `coherent_world_models.php` — Deszendenz, Tarski, admissible transitions
- `foam_of_meaning.php` — Cluster, Filamente, Voids im Bedeutungsraum

## 7. Literatur

- Robinson, *Topological Signal Processing* — Garben-Sensorfusion
- Abramsky & Brandenburger — Kontextualität als Deszendenz-Versagen
- Gärdenfors, *Conceptual Spaces* — Kriterium P, Konvexität
- Bradley, *At the Interface of Algebra and Statistics* — kategorielle Sprachmodelle
- Murdock, *Ethnographic Atlas* — typologische Verwandtschaftsdaten

---

**Status:** Gerüst gebaut, eine Instanz ausgeführt. Der Rest ist Arbeit.
