# Garben, Kohomologie und konsistente Weltbilder
## Ein formales Framework für epistemische Konsistenz

---

## 1. Philosophische Grundposition

### 1.1 Kernthese

Die Wirklichkeit ist (lokal) konsistent. Verschiedene Messungen, Wahrnehmungen und
Modelle müssen – wo sie sich überlappen – übereinstimmen. Wenn sie es nicht tun,
ist definitiv etwas falsch (Falsifikation). Wenn sie es tun, ist das notwendig,
aber nicht hinreichend für Wahrheit (keine Verifikation).

### 1.2 Epistemische Position

- **Kohärentismus:** Konsistenz als Qualitätskriterium für Modelle
- **Kantischer Grundton:** Das "Ding an sich" (die Site) ist unzugänglich; wir sehen nur die Garbe (unsere Messungen)
- **Pragmatisch:** Es geht um Handlungsfähigkeit und Vorhersagekraft, nicht um metaphysische Wahrheit
- **Fallibilistisch (Popper):** Verklebung ist kein Beweis, aber Nicht-Verklebbarkeit schon

### 1.3 Die Site – das Ding an sich

In der Garbentheorie ist die **Site** (Situs) die zugrundeliegende Struktur, auf der die
Garbe lebt. Philosophisch: das "Ding an sich" (Kant).

- Wir haben keinen direkten Zugang zur Site
- Wir sehen nur die Garbe (unsere Messungen, Wahrnehmungen, Modelle)
- Die Site ist ein Postulat, kein Beobachtungsergebnis
- Auch Axiome bauen auf Evidenz auf ("wenn A dann B; jetzt A; also B" – nicht beweisbar, nur akzeptierbar)

---

## 2. Mathematische Grundlagen

### 2.1 Kategorien

Eine **Kategorie** C besteht aus:
- **Objekten:** Ob(C)
- **Morphismen:** Für je zwei Objekte A, B eine Menge Hom(A, B)
- **Komposition:** Wenn f: A → B und g: B → C, dann g∘f: A → C
- **Identität:** Für jedes A existiert id_A: A → A

**Beispiele:**

| Kategorie | Objekte | Morphismen |
|-----------|---------|------------|
| Set | Mengen | Funktionen |
| Top | Topologische Räume | Stetige Abbildungen |
| Vect | Vektorräume | Lineare Abbildungen |
| Open(X) | Offene Mengen von X | Inklusionen |

### 2.2 Topologie

Eine **Topologie** auf einer Menge X ist eine Kollektion τ ⊆ P(X) von "offenen Mengen" mit:
1. ∅ ∈ τ und X ∈ τ
2. Beliebige Vereinigungen offener Mengen sind offen
3. Endliche Schnitte offener Mengen sind offen

**Intuition:** Geometrie minus Abstände. Man behält nur die Information "was ist nah"
(welche Punkte haben Umgebungen), vergisst aber die konkreten Zahlenwerte.

**Was erhalten bleibt:** Löcher, Zusammenhang, Orientierbarkeit, Dimension.

**Was verloren geht:** Konkrete Abstände, Winkel, Krümmungswerte.

**Homotopie:** Zwei stetige Abbildungen f, g: X → Y sind homotop (f ≃ g), wenn es
eine stetige Abbildung H: X × [0,1] → Y gibt mit H(x,0) = f(x) und H(x,1) = g(x).

### 2.3 Topologie und flächenlose Räumlichkeit (Schmitz)

Hermann Schmitz unterscheidet:
- **Flächenhafte Räumlichkeit:** Strecken, Punkte, Flächen (kartesisches Modell)
- **Flächenlose Räumlichkeit:** Dynamische Volumina, Richtungen, Weitung/Engung (z.B. Schall)

Auch in der flächenlosen Räumlichkeit gilt eine topologische Unterscheidbarkeit:

    r(x, y) ≠ 0  ⟹  x ≠ y

Das ist konsistent mit Topologie: Eine Topologie braucht keine Metrik, nur
Unterscheidbarkeit von Punkten durch offene Mengen.

Die **offenen Mengen des Erfahrungsraumes** sind die Kontexte/Regionen der
flächenlosen Räumlichkeit – dynamische Volumina, Richtungsfelder, leibliche Situationen.

---

## 3. Garbentheorie

### 3.1 Prägarbe

Sei (X, τ) ein topologischer Raum. Eine **Prägarbe** F auf X mit Werten in einer
Kategorie C ist ein kontravarianter Funktor:

    F: Open(X)^op → C

Das heißt:
- Jeder offenen Menge U ⊆ X wird ein Objekt F(U) zugeordnet (die "Schnitte über U")
- Jeder Inklusion V ⊆ U wird eine Restriktionsabbildung res_{U,V}: F(U) → F(V) zugeordnet
- Kompatibilität: res_{V,W} ∘ res_{U,V} = res_{U,W}

### 3.2 Garbe (Sheaf)

Eine Prägarbe wird zur **Garbe**, wenn zwei Axiome erfüllt sind:

**Lokalität (Separation):**
Wenn {U_i} eine offene Überdeckung von U ist und s, t ∈ F(U) mit
s|_{U_i} = t|_{U_i} für alle i, dann s = t.

**Verklebung (Gluing):**
Wenn s_i ∈ F(U_i) für alle i gegeben sind und auf allen Überlappungen
s_i|_{U_i ∩ U_j} = s_j|_{U_i ∩ U_j} gilt, dann existiert ein
s ∈ F(⋃ U_i) mit s|_{U_i} = s_i für alle i.

### 3.3 Schnitte (Sections)

Ein **Schnitt** über einer offenen Menge U ist ein Element s ∈ F(U).

**Intuition:** Ein konkretes Datum auf einem Ausschnitt der Welt.
- Ein Foto im Panorama
- "Ich sehe die Vase fallen"
- Eine Temperaturmessung

### 3.4 Halme (Stalks)

Der **Halm** F_x an einem Punkt x ∈ X ist der direkte Limes (Colimit):

    F_x = lim_{→, U ∋ x} F(U)

**Intuition:** Alle lokale Information an einem Punkt – der "Keim" aller Schnitte,
die diesen Punkt enthalten. Zwei Schnitte sind im Halm äquivalent, wenn sie auf
einer Umgebung von x übereinstimmen.

**Beispiel (Vase):** Der Halm am Raum-Zeit-Punkt "Vase trifft Boden" enthält:
- Visuell: "Vase fällt"
- Auditiv: "Klirren"
- Taktil: "Splitter im Fuß"
Alle diese Schnitte verschiedener Garben konvergieren an diesem Punkt.

### 3.5 Verschiedene Garben auf demselben Raum

Verschiedene Sinne = verschiedene Garben auf demselben Raum (der Raumzeit):
- F_vis: visuelle Garbe
- F_aud: auditive Garbe
- F_tac: taktile Garbe

Sie sind durch gemeinsame Ereignisse korreliert. Am Halm eines realen Ereignisses
müssen alle konsistent sein.

---

## 4. Kohomologie

### 4.1 Etymologie und Grundidee

- **Homologie** (homo = gleich): Misst "Löcher" in einem Raum direkt (über Zyklen und Ränder)
- **Kohomologie** (co- = dual): Misst dasselbe, aber über Funktionen statt Ketten
- **Vorteil der Kohomologie:** Funktionen kann man multiplizieren (Ring-Struktur)

**Was Kohomologie misst:** Die Obstruktion gegen globale Lösungen.
Wenn lokale Daten sich nicht zu einem globalen Schnitt verkleben lassen,
sagt die Kohomologie warum.

### 4.2 Čech-Kohomologie

Gegeben eine Überdeckung {U_i} und eine Garbe F:

**Čech-Koketten:**

    C⁰ = ∏_i F(U_i)                     (Daten auf jeder offenen Menge)
    C¹ = ∏_{i,j} F(U_i ∩ U_j)          (Daten auf Überlappungen)
    C² = ∏_{i,j,k} F(U_i ∩ U_j ∩ U_k)  (Daten auf Dreifach-Überlappungen)

**Korand-Operator:**

    (δs)_{ij} = s_j|_{U_i ∩ U_j} - s_i|_{U_i ∩ U_j}

Lies: "Nimm den Schnitt s_j, schränke ihn auf die Überlappung ein.
Nimm s_i, schränke auch ein. Ziehe ab. Wenn Null: sie stimmen überein."

**Kohomologiegruppen:**

    H⁰ = ker δ⁰          = globale Schnitte (konsistente Verklebung existiert)
    H¹ = ker δ¹ / im δ⁰  = echte Obstruktionen (nicht durch lokale Anpassung behebbar)

### 4.3 Konkretes Beispiel: H¹(S¹, ℤ) = ℤ

- S¹ = der Kreis
- ℤ = die ganzen Zahlen
- H¹(S¹, ℤ) = ℤ

**Aussage:** Der Kreis hat genau ein "Loch". Die Obstruktion wird durch die
**Windungszahl** parametrisiert (eine ganze Zahl).

**Intuition:** Man kann auf dem Kreis lokal immer eine Winkelfunktion definieren,
aber global gibt es immer einen Sprung. Die Windungszahl zählt, wie oft man
"drumherum" geht.

### 4.4 Verbindung zur Falsifikation (Popper)

    H⁰ ≠ 0  (globaler Schnitt existiert)
        → Weltbild ist konsistent
        → notwendig, aber nicht hinreichend für Wahrheit

    H¹ ≠ 0  (Obstruktion existiert)
        → Weltbild ist inkonsistent
        → definitiv falsch (Falsifikation)

Das ist exakt Poppers Logik:
- Konsistenz = notwendig, nicht hinreichend
- Inkonsistenz = hinreichend für Falsifikation

---

## 5. Faserbündel und Eichtheorie

### 5.1 Faserbündel

Ein **Faserbündel** (E, B, π, F) besteht aus:
- Totalraum E
- Basisraum B
- Projektion π: E → B
- Typische Faser F
- **Lokale Trivialität:** Für jeden Punkt b ∈ B existiert eine Umgebung U mit
  π⁻¹(U) ≅ U × F

**Intuition:** "Lokal wie ein Produkt" heißt: Wenn man nur einen kleinen Ausschnitt
anschaut, sieht es aus wie Basis × Faser. Aber global kann es verdreht sein.

**Beispiele:**
- Trivial: Zylinder = S¹ × ℝ (keine Verdrehung)
- Nicht-trivial: Möbiusband (nach einer Umrundung: oben/unten vertauscht)

### 5.2 Garbe der Schnitte eines Faserbündels

Jedes Faserbündel π: E → B induziert eine Garbe Γ:

    Γ(U) = {s: U → E | π ∘ s = id_U}

Das sind die Schnitte des Bündels über U.

### 5.3 Eichtheorie

Ein **Faserbündel mit Zusammenhang** (Connection). Der Zusammenhang sagt:
"Wenn du dich auf der Basis von Punkt A nach Punkt B bewegst, wie transportierst
du die Information aus der Faser über A in die Faser über B?"

**Paralleltransport:** Transport eines Vektors entlang eines Pfades auf der Basis.

**Holonomie:** Nach einer geschlossenen Schleife zeigt der Vektor in eine andere
Richtung. Die Differenz = Holonomie = Integral der Krümmung über die eingeschlossene Fläche.

**Krümmung:** F = dA + A ∧ A (Krümmung 2-Form des Zusammenhangs A)

**Eichinvarianz:** Die Physik ändert sich nicht unter Eichtransformationen
(= Wechsel der lokalen Trivialisierung).

**Physik:**
- Elektromagnetismus: U(1)-Eichtheorie. A_μ = Zusammenhang, F_μν = Feld.
- Starke Kraft: SU(3)-Eichtheorie
- Schwache Kraft: SU(2)-Eichtheorie

### 5.4 Eichtheorie und das kaputte Thermometer

Zwei Thermometer messen dasselbe, eines zeigt +10° zu viel.
Die Eichtransformation (-10°) verbindet sie.

- **Eichtheoretisch:** Die "+10°"-Transformation ist eine Eichtransformation.
  Die physikalische Temperatur ist eichinvariant.
- **In HoTT:** Wenn eichäquivalente Messungen als gleich gelten, dann IST die
  Eichtransformation ein Pfad (Beweis der Gleichheit). Das ist Univalenz.

### 5.5 Raumzeit als Faserbündel

    ℝ³ ↪ M⁴ →^π ℝ (Zeit)

- Basis = Zeitachse
- Faser = der 3D-Raum zu jedem Zeitpunkt t
- Totalraum = die 4D-Raumzeit
- Jeder Zeitpunkt t_{n+1} hängt stetig von t_n ab

### 5.6 Hopf-Faserung

    S¹ ↪ S³ →^π S²

- Die 3-Sphäre S³ ist ein Faserbündel über der 2-Sphäre S² mit Faser S¹ (Kreis)
- Jedes Paar von Fasern ist einmal miteinander verlinkt (Verschlingungszahl = 1)
- Das zeigt: Das Bündel ist NICHT trivial (nicht S² × S¹)
- Die Verschlingung ist eine topologische Invariante: π₃(S²) = ℤ

---

## 6. ∞-Garben und Homotopie

### 6.1 Motivation

In einer gewöhnlichen Garbe muss auf der Überlappung gelten:

    s_i|_{U_i ∩ U_j} = s_j|_{U_i ∩ U_j}    (exakte Gleichheit)

In einer **∞-Garbe** genügt:

    ∃ p_{ij}: s_i|_{U_i ∩ U_j} ≃ s_j|_{U_i ∩ U_j}    (Pfad/Homotopie)

Und auf Dreifach-Überlappungen müssen die Pfade konsistent sein:

    ∃ α_{ijk}: p_{ik} ≃ p_{jk} ∘ p_{ij}    (2-Homotopie)

Und so weiter, auf allen Ebenen.

### 6.2 Beispiel: Zeitliche Entwicklung

Manhattan vor 400 Jahren und Manhattan heute:
- Nicht gleich (s_i ≠ s_j)
- Aber durch einen stetigen Pfad verbunden (die zeitliche Entwicklung)
- Jeder Moment überlappt mit dem vorherigen → Homotopie

### 6.3 Beispiel: Wissenschaftliche Paradigmen

Newtonsche Mechanik und Relativitätstheorie:
- Lokal konsistent (bei niedrigen Geschwindigkeiten stimmen sie überein)
- Der Grenzübergang v/c → 0 ist der Pfad (die Homotopie)
- QM und GR: Noch kein Pfad gefunden → offenes Problem der Quantengravitation

### 6.4 Approximative Verklebung

Statt exakter Gleichheit:

    ‖s_i|_{U_i ∩ U_j} - s_j|_{U_i ∩ U_j}‖ < ε

Das ist eine **approximative Garbe**. Die "Kohomologie" misst dann, ob die Fehler
sich aufschaukeln oder im Mittel ausgleichen. → Maximum-Likelihood-Schätzungen.

---

## 7. Topoi

### 7.1 Definition

Ein **Grothendieck-Topos** ist eine Kategorie E, die äquivalent ist zur Kategorie
der Garben auf einer Site (einer Kategorie mit Grothendieck-Topologie).

Technisch hat ein Topos:
- Alle endlichen Limites
- Exponentiale (Funktionenräume)
- Einen Unterobjektklassifizierer Ω

### 7.2 Der Unterobjektklassifizierer Ω

Ω bestimmt die "Palette der Wahrheitswerte":
- In **Set** (klassisch): Ω = {0, 1} (wahr/falsch)
- In **Sh(X)** (Garben auf X): Ω = Garbe der offenen Mengen
  → Eine Aussage kann "wahr auf U" sein, ohne global wahr zu sein

### 7.3 Interne Logik

Verschiedene Topoi haben verschiedene interne Logiken:
- Klassisch: A ∨ ¬A gilt immer (tertium non datur)
- Intuitionistisch: ¬¬A ≠ A (doppelte Negation eliminiert nicht)
- Garben-Topos: Wahrheit ist lokal

### 7.4 Philosophische Interpretation

Verschiedene Topoi = verschiedene "Universen" mit verschiedenen Logiken.
Unser Universum lebt in einem bestimmten Topos. Die interne Logik bestimmt,
was "wahr" und "falsch" bedeutet.

---

## 8. Homotopietypentheorie (HoTT)

### 8.1 Grundidee

In HoTT sind die Grundobjekte nicht Mengen, sondern **Typen** (= Räume):
- Terme = Punkte im Raum
- Gleichheit = Pfade zwischen Punkten
- Gleichheit zwischen Gleichheiten = Pfade zwischen Pfaden (Homotopien)

### 8.2 Typen als Räume

| Mengenlehre | HoTT |
|-------------|------|
| Menge | Typ (= Raum) |
| Element | Term (= Punkt) |
| Gleichheit (ja/nein) | Pfad (Struktur!) |
| — | Pfad zwischen Pfaden |

### 8.3 Typenfamilien = Garben = Faserbündel

Eine **Typenfamilie** P: X → U ordnet jedem Punkt x ∈ X einen Typ P(x) zu.

    Π(x:X) P(x)    = Typ aller Schnitte (für jeden x ein Element aus P(x) wählen)
    Σ(x:X) P(x)    = Typ aller Paare (x, p) mit p ∈ P(x) (Existenz)

### 8.4 Univalenz

    (A ≃ B) ≃ (A =_U B)

"Äquivalenz ist Gleichheit." Isomorphe Dinge sind gleich.

**Für die Eichtheorie:** Wenn eichäquivalente Messungen als gleich gelten,
dann IST die Eichtransformation ein Pfad.

### 8.5 ∞-Garben in HoTT

In HoTT muss die Verklebung nur "bis auf einen Pfad" gelten.
Und die Pfade müssen selbst konsistent sein (bis auf Pfade zwischen Pfaden, usw.).
Das ergibt automatisch eine ∞-Garbe.

---

## 9. Das Gesamtbild – verklebt

### 9.1 Schichtenmodell

    Ebene 1: Site (Ding an sich) – unzugänglich
    Ebene 2: Erfahrungsraum (topologischer Raum) – offene Mengen = Kontexte
    Ebene 3: Garben (Messungen/Wahrnehmungen) – verschiedene pro Sinnesmodalität
    Ebene 4: Schnitte (konkrete Daten) – lokale Information
    Ebene 5: Verklebungsbedingung – Konsistenz auf Überlappungen
    Ebene 6: Kohomologie – misst Obstruktionen gegen globale Konsistenz
    Ebene 7: Eichtheorie – Vergleichsmechanismus zwischen verschiedenen Punkten
    Ebene 8: ∞-Garben – Verklebung bis auf Homotopie (verschiedene Perspektiven)
    Ebene 9: Topoi – verschiedene mögliche Logiken

### 9.2 Konsistenzprinzip

    Lokale Konsistenz:    s_i|_{U_i ∩ U_j} = s_j|_{U_i ∩ U_j}
    Globale Konsistenz:   ∃ s ∈ F(X) mit s|_{U_i} = s_i für alle i
    Falsifikation:        (δs)_{ij} ≠ 0 ⟹ Modell ist falsch
    Verifikation:         (δs)_{ij} = 0 ⟹ notwendig, nicht hinreichend

### 9.3 Wo die Analogie hält

- Die Struktur (lokal → global, Konsistenz auf Überlappungen, Obstruktionen) ist
  in Mathematik, Physik und Kognition dieselbe.
- "Verklebung ist kein Beweis, aber Nicht-Verklebbarkeit schon" gilt überall.

### 9.4 Wo die Analogie bricht

- Mathematische Garben sind exakt; menschliche Kognition arbeitet mit Approximationen.
- Die "offenen Mengen" des Erfahrungsraumes sind nicht wohldefiniert.
- ∞-Garben helfen (Verklebung bis auf Homotopie ≈ approximative Konsistenz),
  aber es bleibt eine Analogie, kein Theorem.

---

## 10. Anwendung: KI und LLMs

### 10.1 These

Ein LLM baut ein internes Modell auf – einen approximativen globalen Schnitt
über dem "Raum der Texte". Konsistenz = gutes Modell. Halluzinationen = lokale
Schnitte, die sich nicht global verkleben lassen.

### 10.2 Formalisierung

**Raum:** Der Embedding-Raum des LLM (hochdimensional, metrisch).

**Offene Mengen:** ε-Kugeln im Embedding-Raum (metrische Topologie).
Alle Fragen/Prompts, die "thematisch nah" beieinander liegen.

**Garbe:** F(U) = die Menge aller Antworten des Modells auf Fragen in U.

**Schnitte:** Konkrete Antworten auf konkrete Fragen.

**Verklebungsbedingung:** Antworten auf thematisch verwandte Fragen müssen
logisch konsistent sein.

**Kohomologie:** Misst, wo es systematische Inkonsistenzen gibt, die sich
nicht durch lokale Korrekturen beheben lassen.

### 10.3 Vorhersagen

1. Halluzinationen clustern sich (sind nicht zufällig verteilt)
2. Die Cluster korrespondieren mit "Löchern" im Trainingskorpus
3. H¹ ≠ 0 korreliert mit Halluzinationsrate
4. Verschiedene Modelle haben verschiedene "Loch-Topologien"

---

## 11. Experimentelles Design

### 11.1 Experiment 1: Konsistenz-Graph (Sheaf Laplacian)

**Setup:**
1. Wähle ein Themengebiet (z.B. Geschichte des 20. Jahrhunderts)
2. Generiere N Fragen mit thematischen Überlappungen (z.B. 500)
3. Stelle jede Frage dem LLM mehrfach (verschiedene Formulierungen)
4. Baue einen Graphen: Knoten = Fragen, Kanten = logische Abhängigkeiten

**Messung:**
- Für jede Kante: Stimmen die Antworten überein? → δ
- Berechne den Sheaf Laplacian (nach Jakob Hansen)
- Eigenwerte nahe Null = konsistente Cluster
- Große Eigenwerte = Inkonsistenzen

**Testbare Vorhersage:**
- Der Sheaf Laplacian sagt Halluzinationen besser voraus als ein einfacher Konsistenz-Score
- Die Eigenvektoren zeigen die "Richtung" der Inkonsistenz (welche Themen betroffen sind)

### 11.2 Experiment 2: Čech-Kohomologie auf Embedding-Kugeln

**Setup:**
1. Nimm den Embedding-Raum eines LLM
2. Wähle Punkte (Prompts) und definiere offene Mengen als ε-Kugeln
3. Für jede Kugel: Stelle alle Fragen darin, sammle Antworten = lokaler Schnitt
4. Für jede Überlappung: Prüfe Konsistenz

**Messung:**
- Berechne Čech-Kohomologie H⁰, H¹ für verschiedene ε
- H⁰ = Anzahl konsistenter "Wissensinseln"
- H¹ = Anzahl "Löcher" (systematische Widersprüche)

**Testbare Vorhersage:**
- Es gibt ein kritisches ε, bei dem H¹ maximal wird
- Dieses ε ist die Skala, auf der Inkonsistenzen leben
- H¹ korreliert mit Halluzinationsrate besser als naive Metriken

### 11.3 Experiment 3: Bifurkationspunkte (∞-Garben-Test)

**Setup:**
1. Stelle dem Modell dieselben Fragen in leicht verschiedenen Kontexten
2. Miss semantische Ähnlichkeit der Antworten

**Messung:**
- Gibt es Fragen, bei denen kleine Kontextänderungen zu großen Antwortänderungen führen?
- Das sind "Bifurkationspunkte" – Stellen, wo die ∞-Garbe nicht verklebbar ist

**Testbare Vorhersage:**
- Halluzinationsanfällige Themen haben mehr Bifurkationspunkte
- Robuste Themen haben glatte Schnitte (kleine Änderung → kleine Antwortänderung)

### 11.4 Mehrwert gegenüber einfacheren Methoden

Der Mehrwert der Garbentheorie gegenüber einem einfachen "Konsistenz-Score" wäre:
1. **Strukturelle Information:** Nicht nur "wie viel", sondern "wo" und "warum"
2. **Skalenabhängigkeit:** Kohomologie ändert sich mit ε – zeigt die Auflösung der Probleme
3. **Theoretische Vorhersagen:** Wenn H¹ besser korreliert als ein Score, ist das Framework validiert

**Nullhypothese:** Die Garben-Perspektive liefert nichts, was ein einfacher
Konsistenz-Score nicht auch gibt. Wenn Experiment 1 zeigt, dass der Sheaf Laplacian
Halluzinationen besser vorhersagt als ein Score → Nullhypothese verworfen.

---

## 12. Verwandte Arbeiten

| Autor/Gruppe | Arbeit | Bezug |
|---|---|---|
| Michael Robinson | "Topological Signal Processing" (2014) | Garben für Sensor-Fusion |
| David Spivak / Topos Institute | "Sheaves on databases" | Kategorientheorie für Datenintegration |
| Jakob Hansen | Sheaf Laplacians auf Graphen | Konsistenzmaß auf Netzwerken |
| Elazar et al. (2021) | "Measuring Consistency in PLMs" | Konsistenz-Probing in LLMs |
| Li et al. (2023) | "Belief graphs in LLMs" | Interne Weltmodelle in LLMs |

**Was NICHT existiert (Stand Juli 2026):**
Niemand hat explizit eine Garbe auf dem Embedding-Raum eines LLM definiert,
die Čech-Kohomologie berechnet, und gezeigt, dass H¹ ≠ 0 mit Halluzinationen korreliert.

---

## 13. Kritik und Grenzen

### 13.1 Interne Kritik

1. Die Analogie "Weltbild = Garbe" ist fruchtbar, aber es ist eine Analogie, kein Theorem
2. Die "offenen Mengen" des Erfahrungsraumes sind nicht kanonisch definiert
3. Approximative Verklebung (ε-Garben) ist mathematisch weniger sau
ber als exakte Garbentheorie
4. Der Mehrwert gegenüber einfacheren Methoden (z.B. Konsistenz-Scores) muss empirisch gezeigt werden

### 13.2 Externe Kritik

**Wittgenstein (Spätwerk):**
Die Forderung nach einem einheitlichen, konsistenten Weltbild ist selbst ein
Sprachspiel – nicht das einzig mögliche. Verschiedene Lebensformen haben
verschiedene "Grammatiken", die sich nicht verkleben lassen *müssen*.

**Kuhn / Feyerabend:**
Wissenschaftliche Paradigmen könnten *inkommensurabel* sein – nicht durch einen
stetigen Pfad verbunden, nicht einmal bis auf Homotopie. Der Grenzübergang v/c → 0
könnte eine nachträgliche Rationalisierung sein, kein echter Pfad.

**Paraconsistente Logik (Priest, da Costa):**
Die Wirklichkeit selbst könnte widersprüchlich sein. H¹ ≠ 0 wäre dann kein Fehler,
sondern ein Feature. Es gibt Logiken, in denen Widersprüche nicht zum Kollaps führen.

**Heidegger:**
Die mathematisch-technische Weltauffassung ist das "Gestell" – eine bestimmte Art,
Seiendes verfügbar zu machen, die andere Weisen des Seins verdeckt. Die Garben-
Formalisierung macht die Wirklichkeit berechenbar, verliert aber möglicherweise das,
was Heidegger "Sein" nennt.

**Schmitz (den wir selbst zitieren):**
Würde die Formalisierung seiner flächenlosen Räumlichkeit wahrscheinlich ablehnen –
nicht weil es technisch unmöglich wäre, sondern weil die Formalisierung das Phänomen
verfälschen könnte.

**Rorty (Pragmatismus):**
Die Frage "Was ist die Site wirklich?" ist sinnlos. Es gibt nur: "Welches Vokabular
ist nützlicher?" Das Garben-Vokabular ist eines unter vielen.

**Dreyfus / Nagel:**
Menschliches Verstehen ist nicht auf Modellbildung reduzierbar. Die Garbe erfasst
die *Struktur* der Erfahrung, aber möglicherweise nicht den *Inhalt* (Qualia).

### 13.3 Antworten auf die Kritik

**Zu Wittgenstein/Kuhn:** Die ∞-Garben-Perspektive erlaubt, dass verschiedene
Perspektiven *nicht identisch* sind, sondern nur *durch einen Pfad verbunden*.
Das ist schwächer als "alles muss in ein System passen". Aber: Ob ein solcher
Pfad immer existiert, ist eine empirische Frage, kein Axiom.

**Zu Priest:** Paraconsistente Logik kann als ein anderer *Topos* formalisiert
werden – mit einem Ω, das "wahr und falsch zugleich" als Wahrheitswert erlaubt.
Das Framework ist kompatibel mit paraconsistenter Logik, es setzt sie nur nicht voraus.

**Zu Heidegger/Schmitz:** Die Formalisierung beansprucht nicht, das Phänomen zu
*ersetzen*, sondern seine *Struktur* zu beschreiben. Die Landkarte ist nicht das
Territorium – aber Landkarten sind nützlich.

**Zu Rorty:** Einverstanden. Die Frage ist nicht "ist das wahr?", sondern "ist das
nützlich?". Der experimentelle Teil (Abschnitt 11) testet genau das.

### 13.4 Offene Fragen

1. Gibt es echte Inkommensurabilität (Kuhn), oder ist sie immer durch einen
   hinreichend langen Pfad überbrückbar?
2. Ist die Konsistenzforderung ein universelles epistemisches Prinzip oder ein
   kulturell bedingtes Sprachspiel?
3. Kann die Garben-Perspektive auf LLMs etwas liefern, was einfachere Methoden
   nicht können? (Empirisch zu klären)
4. Wie definiert man die "offenen Mengen" des Erfahrungsraumes kanonisch?
5. Ist die Approximation (ε-Garben) mathematisch sauber genug für ein formales
   Framework, oder braucht man eine andere Grundlage?

---

## 14. Glossar

| Begriff | Definition | Intuition |
|---------|-----------|-----------|
| Garbe (Sheaf) | Funktor Open(X)^op → C mit Verklebung | Konsistente lokale Daten |
| Schnitt (Section) | Element s ∈ F(U) | Ein Datum auf einem Ausschnitt |
| Halm (Stalk) | F_x = colim_{U∋x} F(U) | Alle Info an einem Punkt |
| Kohomologie | H^n = ker δ^n / im δ^{n-1} | Obstruktion gegen Verklebung |
| Faserbündel | E →^π B mit Faser F, lokal trivial | Raum über Raum, möglicherweise verdreht |
| Zusammenhang | Vorschrift für Paralleltransport | Wie man Daten zwischen Punkten vergleicht |
| Holonomie | Drehung nach geschlossener Schleife | Pfadabhängigkeit des Transports |
| Eichtransformation | Wechsel der lokalen Trivialisierung | Andere Kalibrierung, gleiche Physik |
| ∞-Garbe | Verklebung bis auf Homotopie | Nicht gleich, aber durch Pfad verbunden |
| Topos | Kategorie ≅ Garben auf einer Site | Universum mit eigener Logik |
| Site | Kategorie + Grothendieck-Topologie | Das "Ding an sich" |
| HoTT | Typentheorie mit Univalenz | Typen = Räume, Gleichheit = Pfade |
| Univalenz | (A ≃ B) ≃ (A =_U B) | Äquivalenz ist Gleichheit |
| Sheaf Laplacian | Operator auf Graphen mit Garbenstruktur | Misst Inkonsistenz auf Netzwerken |

---

## 15. Literatur (zum Weiterarbeiten)

### Garbentheorie
- Hartshorne, "Algebraic Geometry" (Kapitel II) – klassische Einführung
- Bredon, "Sheaf Theory" – umfassend
- Tennison, "Sheaf Theory" – zugänglicher

### Anwendungen
- Michael Robinson, "Topological Signal Processing" (2014) – Garben für Sensordaten
- David Spivak, "Category Theory for the Sciences" (2014) – Brücke zur Anwendung
- Jakob Hansen, "Sheaf Laplacians" – Konsistenz auf Graphen

### Philosophie
- Kant, "Kritik der reinen Vernunft" – das Ding an sich
- Popper, "Logik der Forschung" – Falsifikation
- Kuhn, "Die Struktur wissenschaftlicher Revolutionen" – Inkommensurabilität
- Schmitz, "Der Leib" – flächenlose Räumlichkeit

### HoTT
- Univalent Foundations Program, "Homotopy Type Theory" (2013) – das HoTT-Buch
- Shulman, "Homotopy type theory: a synthetic approach to higher equalities"

### KI/Konsistenz
- Elazar et al., "Measuring and Improving Consistency in PLMs" (2021)
- Li et al., "Inference-Time Intervention" (2023) – interne Weltmodelle in LLMs
