// ============================================================
// SPACE MORPH – "Layer als Raumkrümmung" (7-Schritte-Animation)
// Port von test/space_morph.html in das Folien-Format:
// Pfeiltasten (Präsentation) steuern die Schritte, Drag rotiert.
// ============================================================
const SpaceMorph = (() => {
    const SLIDE_ID = 'slide-layer-als-raumkruemmung';
    const DUR = 1000;

    // Die Homotopie (Schlingen zurückziehen) läuft bewusst langsamer,
    // damit man sieht, dass nichts durchdringt.
    const HOMOTOPY_DUR = 4200;

    // ---------- Zustand ----------
    let ctx = null;
    let W = 0, H = 0, DPR = 1;
    let inited = false;
    let active = false;
    let raf = null;
    let dragBound = false;

    // Kamera: Blick von OBEN
    let camA = 0, camB = 1.5708, dragA = 0, dragB = 0, pers = 1, FIT = 1, YOFF = 0;
    let md = false, mx = 0, my = 0;
    let cur = 0, prevIdx = 0, t0 = 0, dA0 = 0, dB0 = 0;

    // Schritt 8: 1× Pfeil-rechts startet eine ~5-Sekunden-Drehung um die Tori.
    // Danach (oder wenn der User nochmal drückt) → Schritt 9.
    const ORBIT_AUTO_DUR = 5000;
    let autoOrbitActive = false;
    let autoOrbitStart = 0;
    let autoOrbitFromAngle = 0;
    let autoOrbitDone = false;

    // ---------- Daten ----------
    let rng = 42;
    const rnd = () => (rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const PTS = [];
    for (let i = 0; i < 140; i++) { const a = rnd() * 6.2832, r = Math.sqrt(rnd()) * 0.40;
        PTS.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, c: 0, r: r }); }
    for (let i = 0; i < 220; i++) { const a = rnd() * 6.2832, r = 0.82 + Math.sqrt(rnd()) * 0.26;
        PTS.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, c: 1, r: r }); }

    const KZ = 1.15, KB = 0.40, PLANE_Z = 0.18;
    const SCORE = (x, y) => ((x * x + y * y) * KZ - KB) - PLANE_Z;
    const SMIN = -0.62, SMAX = 1.05;
    PTS.forEach(p => p.s = SCORE(p.x, p.y));
    const LIFT = (x, y, t) => { const r2 = x * x + y * y;
        return { x: x * (1 - 0.12 * t * r2), y: y * (1 - 0.12 * t * r2), z: (r2 * KZ - KB) * t }; };

    // ---------- Zwei verhakte Volltori (Datensatz D-II) ----------
    // A (grün):  flacher Donut in der xy-Ebene (Loch entlang z), Radius M.
    // B (rot):   stehender Donut, dessen Ring durch das Loch von A greift.
    //
    // A UND B haben einen Formparameter k ∈ [0,1]:
    //   k = 1 → komplex verschlungene Variante (viele Schlingen, wie im Bild)
    //   k = 0 → der schlichte Hopf-Link
    // Alle Deformationsterme sind linear in k ⇒ k: 1→0 ist eine Isotopie
    // (Homotopie ohne Selbstdurchdringung): jede Schlinge schwingt nur dort
    // aus, wo sie WEIT WEG vom anderen Torus ist (Fenster), d. h. die
    // Durchstoßpunkte bleiben die ganze Zeit unberührt.
    // Verschlingungszahl bleibt +1, die Rohre dringen nie ineinander.
    const M = 0.72, RHO = 0.16;

    // ── Formparameter von B (rot) ──
    const LOBES = 8;                 // Anzahl der Zusatzschlingen bei k=1 (sehr windig)
    // radiale Ausschlagweite — bewusst klein, damit die Schlingen A's Rohr
    // nicht erreichen (selbsttest: min. Mittellinienabstand > rA+rB ≈ 0.38;
    // mit 8 Schlingen → ≈0.43, kein Durchdringen).
    const LOBE_R = 0.25;
    const LOBE_Y = 0.62;             // Ausschlag quer zur A-Ebene (groß → wild)
    const LOBE_TW = 0.30;            // Verdrillung der Schlingen

    // ── Formparameter von A (grün) ── analog, damit beide verschlungen sind.
    // Das Schutzfenster (GATE_A) ist 0 nahe A's Durchstoßpunkt (t=0, dort
    // sitzt das Zentrum von B's Ring), damit der Link nicht aufgelöst wird.
    const LOBES_A = 8;               // Anzahl der Zusatzschlingen von A bei k=1
    const LOBE_R_A = 0.18;           // radiale Ausschlagweite (xy-Ebene)
    const LOBE_Z_A = 0.62;           // senkrechter Ausschlag (aus der A-Ebene)
    const LOBE_TW_A = 0.25;          // Verdrillung der A-Schlingen
    const PHASE_A = 1.0471;          // Phasenversatz (π/3)
    const GATE_A = 0.40;             // Breite der Schutzzone bei t=0

    // Fenster: 0 in den beiden Winkelbereichen, in denen B durch A's Loch
    // greift (t ≈ 0 und t ≈ π), 1 dazwischen. Damit können die Schlingen
    // A niemals schneiden. Glatt (C¹) per sin²-Rampe.
    function lobeWindow(t) {
        // Abstand zum nächsten Durchstoßwinkel (0 oder π)
        let d = Math.abs(Math.sin(t));          // 0 bei t=0,π ; 1 bei t=π/2
        const GATE = 0.42;                      // Breite der Schutzzone
        if (d <= GATE) {
            const u = d / GATE;
            return u * u * (3 - 2 * u) * 0;     // harte 0 in der Schutzzone
        }
        const u = (d - GATE) / (1 - GATE);
        return u * u * (3 - 2 * u);
    }

    // Mittellinie von Torus B als Funktion von (t, k).
    // k=0 reproduziert exakt den alten Kreis { M + M·cos t, 0, M·sin t }.
    function centerlineB(t, k) {
        const base = {
            x: M + M * Math.cos(t),
            y: 0,
            z: M * Math.sin(t)
        };
        if (k < 1e-6) return base;
        const w = lobeWindow(t) * k;
        if (w < 1e-6) return base;
        const ph = LOBES * t;
        // radialer Ausschlag in der xz-Ebene (entlang der Ringnormale von B)
        const ur = { x: Math.cos(t), z: Math.sin(t) };
        const rad = LOBE_R * Math.sin(ph) * w;
        // Querausschlag entlang y (senkrecht zu B's Ringebene)
        const lat = LOBE_Y * Math.sin(ph + 1.0471) * w;   // +π/3 Phasenversatz
        // leichte Verdrillung, damit die Schlingen sich "umeinander" legen
        const tw = LOBE_TW * Math.sin(2 * ph) * w;
        return {
            x: base.x + ur.x * rad + ur.z * tw,
            y: base.y + lat,
            z: base.z + ur.z * rad - ur.x * tw
        };
    }

    // Mittellinie von Torus A als Funktion von (t, k).
    // k=0 reproduziert exakt den alten Kreis { M·cos t, M·sin t, 0 }.
    // Das Schutzfenster ist bei t=0 null — dort sitzt das Zentrum von B's
    // Ring; dort bleibt A starr, damit der Link nicht aufgelöst wird.
    function windowA(t) {
        const d = (1 - Math.cos(t)) / 2;      // 0 bei t=0, 1 bei t=π
        if (d <= GATE_A) {
            const u = d / GATE_A;
            return u * u * (3 - 2 * u) * 0;   // harte 0 in der Schutzzone
        }
        const u = (d - GATE_A) / (1 - GATE_A);
        return u * u * (3 - 2 * u);
    }
    function centerlineA(t, k) {
        const base = {
            x: M * Math.cos(t),
            y: M * Math.sin(t),
            z: 0
        };
        if (k < 1e-6) return base;
        const w = windowA(t) * k;
        if (w < 1e-6) return base;
        const ph = LOBES_A * t;
        // radialer Ausschlag in der xy-Ebene (entlang der Ringnormale von A)
        const ur = { x: Math.cos(t), y: Math.sin(t) };
        const rad = LOBE_R_A * Math.sin(ph) * w;
        // senkrechter Ausschlag (senkrecht zur A-Ebene, entlang z)
        const vert = LOBE_Z_A * Math.sin(ph + PHASE_A) * w;
        // leichte Verdrillung, damit die Schlingen sich "umeinander" legen
        const tw = LOBE_TW_A * Math.sin(2 * ph) * w;
        return {
            x: base.x + ur.x * rad - ur.y * tw,
            y: base.y + ur.y * rad + ur.x * tw,
            z: base.z + vert
        };
    }

    // Tangente numerisch (für ein saubereres Rohr-Frame der Punktwolke)
    function tangentB(t, k) {
        const h = 1e-3;
        const a = centerlineB(t - h, k), b = centerlineB(t + h, k);
        let vx = b.x - a.x, vy = b.y - a.y, vz = b.z - a.z;
        const L = Math.hypot(vx, vy, vz) || 1;
        return { x: vx / L, y: vy / L, z: vz / L };
    }
    function tangentA(t, k) {
        const h = 1e-3;
        const a = centerlineA(t - h, k), b = centerlineA(t + h, k);
        let vx = b.x - a.x, vy = b.y - a.y, vz = b.z - a.z;
        const L = Math.hypot(vx, vy, vz) || 1;
        return { x: vx / L, y: vy / L, z: vz / L };
    }

    // Gemeinsames Rohr: Punkt = Mittellinie + Querschnittskreis im
    // Normalframe der Tangente. (cl, tan) = Mittellinie-/Tangentenfunktion.
    function tubePoint(cl, tan, t, s, rho, k) {
        const c = cl(t, k);
        const T = tan(t, k);
        // Hilfsvektor, der nie parallel zu T ist
        let up = { x: 0, y: 1, z: 0 };
        if (Math.abs(T.y) > 0.9) up = { x: 1, y: 0, z: 0 };
        // N = normalize(up × T), Bn = T × N
        let nx = up.y * T.z - up.z * T.y,
            ny = up.z * T.x - up.x * T.z,
            nz = up.x * T.y - up.y * T.x;
        const Ln = Math.hypot(nx, ny, nz) || 1;
        nx /= Ln; ny /= Ln; nz /= Ln;
        const bx = T.y * nz - T.z * ny,
              by = T.z * nx - T.x * nz,
              bz = T.x * ny - T.y * nx;
        const cs = Math.cos(s), sn = Math.sin(s);
        return {
            x: c.x + rho * (nx * cs + bx * sn),
            y: c.y + rho * (ny * cs + by * sn),
            z: c.z + rho * (nz * cs + bz * sn)
        };
    }
    // Punkt auf dem Volltorus B bzw. A
    function toriBPoint(t, s, rho, k) { return tubePoint(centerlineB, tangentB, t, s, rho, k); }
    function toriAPoint(t, s, rho, k) { return tubePoint(centerlineA, tangentA, t, s, rho, k); }

    // Punktwolke: A fest, B als (t, s, rho) gespeichert und pro Frame
    // mit dem aktuellen k ausgewertet.
    const TORI_A = [];
    const TORI_B = [];
    (function () {
        let s2 = 1234;
        const rnd2 = () => (s2 = (s2 * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
        const NA = 640, NB = 760;   // A wird jetzt auch verschlungen → mehr Punkte
        for (let i = 0; i < NA; i++) {
            TORI_A.push({
                t: rnd2() * 6.2832,
                s: rnd2() * 6.2832,
                rho: 0.16 + 0.04 * rnd2(),
                c: 0
            });
        }
        for (let i = 0; i < NB; i++) {
            TORI_B.push({
                t: rnd2() * 6.2832,
                s: rnd2() * 6.2832,
                rho: 0.14 + 0.035 * rnd2(),
                c: 1
            });
        }
    })();

    // Aktuelle Weltpunkte für gegebenes k (wird im Renderer aufgerufen).
    // A UND B werden pro Frame mit dem aktuellen k ausgewertet.
    function toriPoints(k) {
        const out = [];
        for (let i = 0; i < TORI_A.length; i++) {
            const a = TORI_A[i];
            const p = toriAPoint(a.t, a.s, a.rho, k);
            p.c = 0;
            out.push(p);
        }
        for (let i = 0; i < TORI_B.length; i++) {
            const b = TORI_B[i];
            const p = toriBPoint(b.t, b.s, b.rho, k);
            p.c = 1;
            out.push(p);
        }
        return out;
    }

    // Entwirrung über eine 4. Dimension (w): die Tori dehnen sich (Schwellung),
    // ziehen gegeneinander HINDURCH und enden getrennt. Das Hindurchziehen ist
    // der 4D-Bogen – in 3D unmöglich, in ℝ⁴ ein gerader Weg.
    function untangle(p, pt) {
        const e = p * p * (3 - 2 * p);
        const swell = 1 + 0.22 * Math.sin(p * Math.PI);
        const sep = 0.95 * e;
        const dir = pt.c === 0 ? -1 : 1;      // grün -x, rot +x
        const wobble = Math.sin(p * Math.PI) * 0.18; // sanfte 4D-Andeutung in y
        return { x: pt.x * swell + dir * sep, y: pt.y * swell + dir * wobble, z: pt.z * swell };
    }

    // ---------- Szenen ----------
    const S = [
        { t: "Zwei Klassen, keine Gerade",
            b: "Innen eine Punktwolke, außen ein Ring. Keine Gerade trennt Rot von Blau.",
            L: 0, A: 0, B: 1.5708, P: 0, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 0 },
        { t: "Jeder Versuch scheitert",
            b: "Eine lineare Trennung ist eine Gerade — sie schneidet den Ring immer. Der Ring umschließt die Wolke: eine topologische Anordnung, die eine Gerade nicht aufbrechen kann.",
            L: 0, A: 0, B: 1.5708, P: 0, pl: 0, sq: 0, fail: 1, lab: 0, pr: 0, box: 0 },
        { t: "Eine Dimension mehr Platz",
            b: "Das alte Bild liegt als Boden unter uns, senkrecht dazu die neue Achse z. Über den Daten ist Raum entstanden. Das ist die Kernidee von Keup & Helias: falten in unbenutzte, höhere Dimensionen — das wirkt nur, wenn die Schicht breiter ist als die Daten.",
            L: 0, A: 0.38, B: 1.02, P: 1, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 1 },
        { t: "Der Layer krümmt den Raum",
            b: "Das Gitter hebt sich zu einer Schale (z = r²): innen sinkt, außen steigt. Es ist eine glatte, injektive Verbiegung (Homöomorphismus auf ihr Bild) — sie reißt nicht, identifiziert keine Punkte und erhält die topologische Struktur. Die Extra-Dimension hebt den Ring an, eine Ebene passt dazwischen.",
            L: 1, A: 0, B: 0, P: 1, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 0 },
        { t: "Eine Ebene passt dazwischen",
            b: "Gleicher Blickwinkel, nur ein neues Objekt: eine flache Ebene schiebt sich sauber zwischen die Klassen.",
            L: 1, A: 0, B: 0, P: 1, pl: 1, sq: 0, fail: 0, lab: 0, pr: 0, box: 0 },
        { t: "Die Ebene wird zur Linie",
            b: "Wir stauchen die Ebene entlang der Blickrichtung, bis nur noch eine Linie übrig ist.",
            L: 1, A: 0, B: 0, P: 1, pl: 1, sq: 1, fail: 0, lab: 1, pr: 0, box: 0 },
        { t: "Der Raum wird zu einer Linie",
            b: "Punkte und Gitter bewegen sich gemeinsam: dieselbe Projektion trifft beide. Ringe schrumpfen zu Punkten, Strahlen strecken sich — eine 1D-Achse, auf der s = 0 trennt.",
            L: 1, A: 0, B: 0, P: 1, pl: 0, sq: 1, fail: 0, lab: 0, pr: 1, box: 0 },

        // ── Bonusphase: verschlungene Volltori ──
        // Schritt 8: komplex verschlungen (k = 1), Auto-Orbit zum Anschauen.
        { t: "Neues Beispiel: zwei verschlungene Tori",
            b: "Andere Daten, anderes Problem: zwei Volltori im ℝ³, jeder Punkt ein Wort-Vektor — ineinander verschlungen. Keine Ebene trennt sie.",
            L: 0, A: 0.4, B: 1.0, P: 1, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 0,
            tori: 1, ut: 0, kx: 1 },
        // Schritt 9: Homotopie k: 1 → 0 — kein Schnitt, kein Kleben.
        { t: "Ohne ReLU: entwirren, nicht trennen",
            b: "Affin (x → Wx + b) — und auch die glatte Egg-Schale — ist injektiv und umkehrbar auf ihrem Bild (eine glatte Einbettung): die Topologie bleibt erhalten. Die Homotopie zeigt es: die Schlingen glätten sich, aber die Verschlingungszahl +1 bleibt erhalten, die Ringe bleiben verhakt. Nur eine Projektion (det W = 0) würde sie scheinbar lösen — sie wirft aber eine Dimension weg (Informationsverlust).",
            L: 0, A: 0.4, B: 1.0, P: 1, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 0,
            tori: 1, ut: 0, kx: 0 },
        // Schritt 10: der schlichte Hopf-Link — Ausgangspunkt des 4D-Tricks.
        { t: "Maximum ohne ReLU: der Hopf-Link",
            b: "Übrig bleibt ein sauberer Hopf-Link — erkennbar, aber topologisch unverändert verhakt. Die Verschlingungszahl +1 ist eine Topologie-Invariante: noch immer trennt keine Ebene im ℝ³ die beiden Ringe.",
            L: 0, A: 0.4, B: 1.0, P: 1, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 0,
            tori: 1, ut: 0, kx: 0 },
        { t: "ReLU knickt den Raum (4. Dimension)",
            b: "Anders als die glatte Egg-Schale ist die ReLU-Falte nicht injektiv: sie bildet alle Punkte mit x ≤ 0 auf denselben Wert 0 ab (identifiziert sie). Genau deshalb ändert sich die topologische Struktur — die Ringe ziehen sich durch die 4. Dimension, wo in ℝ³ kein Weg frei ist, und lassen sich in zwei getrennte Klumpen auflösen.",
            L: 0, A: 0.4, B: 1.0, P: 1, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 0,
            tori: 1, ut: 1, kx: 0 },
        { t: "Jetzt reicht eine flache Ebene",
            b: "Zurück im ℝ³: zwei Klumpen. Die Ebene bleibt flach (lineares Klassifizieren) — ReLU hat nur den Raum geknickt, jetzt trennt sie sauber. Genau dieses Muster steckt hinter dem Origami-Bild: erst falten, dann ein einziger gerader Schnitt (Fold-and-Cut-Theorem). Für echte Netze ist es eine Analogie, kein Beweis.",
            L: 0, A: 0.4, B: 1.0, P: 1, pl: 1, sq: 0, fail: 0, lab: 0, pr: 0, box: 0,
            tori: 1, ut: 1, kx: 0 },
        { t: "Auf die 1D-Achse projiziert",
            b: "Wie am Anfang der Egg-Phase: die beiden Tori werden auf die 1D-Achse projiziert. Grüne und rote Punkte liegen jetzt auf beiden Seiten von s = 0.",
            L: 0, A: 0.4, B: 1.0, P: 1, pl: 0, sq: 0, fail: 0, lab: 0, pr: 1, box: 0,
            tori: 1, ut: 1, kx: 0 },
        // Fun-Fact (abschließende Aside): Raumkrümmung der Aktivierung —
        // Sigmoid krümmt glatt (Welle), ReLU knickt hart (Falte). Eigener
        // Schritt mit vollem 2D-Canvas-3D-Plot, kein 3D-Szenario (ff: 1).
        { t: "Sigmoid krümmt, ReLU knickt",
            b: "Die zwei Arten, Raum zu krümmen. Sigmoid ist glatt, streng monoton und injektiv — umkehrbar auf seinem Wertebereich (Homöomorphismus): es biegt, identifiziert nichts und reicht für das Egg. ReLU ist stetig, aber nicht injektiv — sie bildet alle Punkte mit x ≤ 0 auf 0 ab (identifiziert sie, 2 → 1). Diese vielen-nach-eins-Abbildung ändert die topologische Struktur und ermöglicht es, die Verschlingung der Tori aufzulösen.",
            L: 0, A: 0.2, B: 0.5, P: 1, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 0,
            tori: 0, ut: 0, kx: 0, ff: 1 },
        // Ausklang: die Frage, die alles begründet — wozu falten, wenn man
        // am Ende nur noch eine lineare Schicht hat?
        // Achtung: #sm-body ist eine 320px-Spalte → Text kurz halten!
        { t: "Wozu falten? Die letzte Schicht ist linear",
            b: "Am Ende steht nur noch eine lineare Schicht: eine Ebene, die entlang einer einzigen Richtung liest. Nach \"Der Hund\" muss sie zwischen vielen Kandidaten entscheiden — das kann sie nur, wenn die passenden Wörter schon oben liegen.",
            L: 0, A: 0.2, B: 0.5, P: 1, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 0,
            tori: 0, ut: 0, kx: 0, ff: 0, nw: 1, nwF: 0 },
        { t: "Ein Falten, und die Antwort stimmt",
            b: "Die ReLU-Falte knickt den Raum: alles auf einer Seite wird über die Kante gespiegelt. Danach liegen die fünf passenden Wörter über allen anderen — dieselbe Ebene liest nun das richtige Wort. So bereitet das Falten die letzte Schicht vor.",
            L: 0, A: 0.2, B: 0.5, P: 1, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 0,
            tori: 0, ut: 0, kx: 0, ff: 0, nw: 1, nwF: 1 }
    ];

    // Benannte Indizes, damit Logik nicht auf Magic Numbers läuft
    const IDX_COMPLEX  = 7;   // komplex verschlungen, Auto-Orbit
    const IDX_HOMOTOPY = 8;   // k: 1 → 0
    const IDX_HOPF     = 9;   // schlichter Hopf-Link
    const IDX_LIFT     = 10;  // 4D-Lift
    const IDX_PLANE    = 11;  // Trennebene
    const IDX_AXIS     = 12;  // Tori auf die 1D-Achse projiziert (wie die Egg-Phase)
    const IDX_FUNFACT  = 13;  // Fun-Fact: Präzision bricht Topologie (2D-Plot, kein 3D)
    const IDX_LLM      = 14;  // Wozu falten: Kandidatenraum + Scores (2D-Plot)
    const IDX_LLM2     = 15;  // nach der Falte: richtiges Wort

    // "Jeder Punkt = ein Wort": zwei Beispielwörter (ein random Punkt pro Torus),
    // die als Label über dem Punkt erscheinen, sobald der verwirrte Torus gezeigt
    // wird. (t, s, rho) → Weltpunkt, pro Frame wie die Punktwolke umgerechnet.
    const WORD_PTS = [
        { word: 'König',   c: 0, t: 2.2, s: 0.6, rho: 0.18 },
        { word: 'Königin', c: 1, t: 2.6, s: 0.4, rho: 0.16 }
    ];

    // ---------- Ablauf ----------
    function ease(u) { return u * u * u * (u * (u * 6 - 15) + 10); }
    function lerp(a, b, u) { return a + (b - a) * u; }
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const sub = (t, a, b) => ease(clamp((t - a) / (b - a), 0, 1));

    function updateText() {
        const s = S[cur];
        const elTitle = document.getElementById('sm-title');
        const elBody = document.getElementById('sm-body');
        if (elTitle) elTitle.textContent = s.t;
        if (elBody) elBody.textContent = s.b;
        updateTables();
    }

    // Beispielpunkte für die Begleit-Tabellen
    const EGG_PTS = [
        { id: 'I1', x: 0.20, y: 0.00, cls: 0 },   // innen₁
        { id: 'I2', x: 0.00, y: 0.25, cls: 0 },   // innen₂
        { id: 'O1', x: 0.90, y: 0.00, cls: 1 },   // außen₁
        { id: 'O2', x: 0.00, y: 0.95, cls: 1 }    // außen₂
    ];
    // Beispielpunkte für die Tori: 2 von Klasse A (grün) + 2 von Klasse B (rot).
    // A- und B-Punkte werden mit demselben centerlineA/centerlineB(t, k)
    // berechnet wie die Punktwolke → die Tabelle zeigt die Homotopie live mit.
    const TORI_EX = [
        { id: 'A1', c: 0, t: 0,           s: Math.PI / 2 },
        { id: 'A2', c: 0, t: Math.PI / 2, s: Math.PI / 2 },
        { id: 'B1', c: 1, t: Math.PI / 2, s: Math.PI / 2 },
        { id: 'B2', c: 1, t: Math.PI,     s: Math.PI / 2 }
    ];
    // Hinweis: M und RHO sind oben beim TORI-Datensatz definiert.
    function buildToriPoint(ex, k) {
        if (ex.c === 0) {
            return toriAPoint(ex.t, ex.s, RHO, k || 0);
        }
        return toriBPoint(ex.t, ex.s, RHO, k || 0);
    }

    const fmt2 = v => (Math.abs(v) < 0.005 ? '0' : (v.toFixed(2).replace(/^-0\.00$/, '0.00')));
    function setCell(tableId, rowClass, colClass, value, idx) {
        const rows = document.querySelectorAll(`#${tableId} tr.${rowClass}`);
        const cell = rows[idx] ? rows[idx].querySelector(`.${colClass}`) : null;
        if (cell) cell.textContent = value;
    }
    function setCellByPid(tableId, pid, colClass, value) {
        const cell = document.querySelector(`#${tableId} tr[data-pid="${pid}"] .${colClass}`);
        if (cell) cell.textContent = value;
    }
    function setCellEmpty(tableId, pid, colClass, empty) {
        const cell = document.querySelector(`#${tableId} tr[data-pid="${pid}"] .${colClass}`);
        if (cell) cell.classList.toggle('empty', empty);
    }

    function updateTables(raw = 1) {
        const egg = document.getElementById('egg-table');
        const tori = document.getElementById('tori-table');
        // Fun-Fact-/LLM-Schritt: Tabellen überlagern den 2D-Plot → komplett ausblenden.
        const cont = document.getElementById('sm-table-container');
        if (cont) cont.style.display = (cur === IDX_FUNFACT || cur === IDX_LLM || cur === IDX_LLM2) ? 'none' : '';
        if (!egg || !tori) return;

        // Ei-Tabelle für Schritte 1-7, Tori-Tabelle ab Schritt 8
        if (cur < IDX_COMPLEX) {
            egg.removeAttribute('style');
            tori.setAttribute('style', 'display:none');
        } else {
            egg.setAttribute('style', 'display:none');
            tori.removeAttribute('style');
            tori.classList.add('show-y', 'show-z');
        }

        egg.classList.toggle('show-y', cur < 6);
        egg.classList.toggle('show-z', cur >= 2 && cur < 6);

        // Tori: w-Spalte + Extra-Zeile ab dem 4D-Lift
        tori.classList.toggle('show-w', cur >= IDX_LIFT);
        tori.classList.toggle('show-extra', cur >= IDX_COMPLEX);
        // Formparameter-Spalte k: sichtbar in der Verschlingungs-/Homotopiephase
        tori.classList.toggle('show-k', cur >= IDX_COMPLEX && cur <= IDX_HOPF);

        const L = S[cur].L || 0;
        const is1D = (cur === 6);
        let innerIdx = 0, outerIdx = 0;
        EGG_PTS.forEach((pt) => {
            const row = pt.cls === 0 ? 'inner-row' : 'outer-row';
            const idx = pt.cls === 0 ? innerIdx++ : outerIdx++;
            const s = pt.x * pt.x + pt.y * pt.y;
            const xv = is1D ? s : pt.x;
            const z = s * L;
            setCell('egg-table', row, 'xv', fmt2(xv), idx);
            setCell('egg-table', row, 'yv', fmt2(pt.y), idx);
            setCell('egg-table', row, 'zv', fmt2(z), idx);
        });

        // Tori-Werte: ut (4D-Lift) UND kx (Verschlingungsgrad) smooth mitziehen
        if (cur >= IDX_COMPLEX) {
            const utPrev = S[prevIdx].ut || 0;
            const utCur = S[cur].ut || 0;
            const utStart = (prevIdx < IDX_COMPLEX) ? 0 : utPrev;
            const ut = lerp(utStart, utCur, raw);

            const kPrev = (prevIdx >= IDX_COMPLEX && S[prevIdx].kx !== undefined)
                ? S[prevIdx].kx : (S[cur].kx || 0);
            const kCur = S[cur].kx || 0;
            const k = clamp(lerp(kPrev, kCur, ease(raw)), 0, 1);

            const e = ut * ut * (3 - 2 * ut);
            const swell = 1 + 0.22 * Math.sin(ut * Math.PI);
            const sep = 0.95 * e;
            const wobble = Math.sin(ut * Math.PI) * 0.18;
            TORI_EX.forEach((ex) => {
                const base = buildToriPoint(ex, k);
                const dir = ex.c === 0 ? -1 : 1;
                const x = base.x * swell + dir * sep;
                const y = base.y * swell + dir * wobble;
                const z = base.z * swell;
                const w = dir * e;
                setCellByPid('tori-table', ex.id, 'xv', fmt2(x));
                setCellByPid('tori-table', ex.id, 'yv', fmt2(y));
                setCellByPid('tori-table', ex.id, 'zv', fmt2(z));
                setCellByPid('tori-table', ex.id, 'kv', fmt2(k));
                setCellByPid('tori-table', ex.id, 'wv', fmt2(w));
                setCellEmpty('tori-table', ex.id, 'wv', false);
            });
        }
    }

    function go(d) {
        const n = clamp(cur + d, 0, S.length - 1);
        if (n === cur) return;
        dA0 = dragA; dB0 = dragB;
        prevIdx = cur; cur = n; t0 = performance.now();
        // Orbit-Zustand nur zurücksetzen, wenn wir NEU auf den Komplex-Schritt
        // kommen (z. B. per Rücksprung aus Schritt 9).
        if (n === IDX_COMPLEX) {
            autoOrbitActive = false;
            autoOrbitDone = false;
            autoOrbitStart = 0;
        }
        updateText();
    }

    // ---------- Kamera: Blick von OBEN ----------
    const BASE = () => Math.min(W, H) * 0.30;
    function proj(p) {
        const A = camA + dragA, B = camB + dragB, S0 = BASE() * FIT;
        const x = p.x * Math.cos(A) - p.y * Math.sin(A);
        const y = p.x * Math.sin(A) + p.y * Math.cos(A);
        const y2 = -y * Math.sin(B) + p.z * Math.cos(B);
        const z2 = y * Math.cos(B) + p.z * Math.sin(B);
        const d = 4.6, k = pers < 0.02 ? 1 : d / (d + z2 * 0.80 * pers);
        return { X: W / 2 + x * S0 * k + 170, Y: H / 2 - y2 * S0 * k + YOFF, d: z2, k: k };
    }
    let AX_Y, AX_L, AX_R;
    function axisGeom() { AX_Y = H * 0.80; const S0 = BASE();
        AX_L = W / 2 - S0 * 1.05 + 170; AX_R = W / 2 + S0 * 1.05 + 170; }
    const sx = s => AX_L + (AX_R - AX_L) * Math.max(0, Math.min(1, (s - SMIN) / (SMAX - SMIN)));

    // ---------- gemeinsame Raumabbildung ----------
    function warp(x, y, L, t) {
        const P = proj(LIFT(x, y, L));
        if (t < 0.0005) return { X: P.X, Y: P.Y, k: P.k };
        const tx = sx(SCORE(x, y)), ty = AX_Y - 46 * (1 - t);
        const lift = Math.sin(t * Math.PI) * 34;
        return { X: lerp(P.X, tx, t), Y: lerp(P.Y, ty, t) - lift, k: lerp(P.k, 1, t) };
    }
    // 1D-Projektion der Tori (wie die Egg-Punkte): gleitet von der 3D-Position
    // q zur Score-Achse. Nach dem Lift liegt A (grün) links, B (rot) rechts.
    // Eigene symmetrische Achse — die Egg-Achse (asymmetrisch) würde s=0 zu
    // weit links legen. Die Lücke zwischen den Klumpen liegt bei x = GAP.
    const TORI_GAP = 0.375;   // x-Mitte der Lücke zwischen grünem/rotem Klumpen
    const TORI_SPAN = 2.2;    // halbweite der symmetrischen Score-Mappe
    const toriScore = qx => qx - TORI_GAP;
    const sxTori = sc => AX_L + (AX_R - AX_L) * clamp((sc + TORI_SPAN) / (2 * TORI_SPAN), 0, 1);
    function warpTori(q, t) {
        const P = proj(q);
        if (t < 0.0005) return { X: P.X, Y: P.Y, k: P.k };
        const tx = sxTori(toriScore(q.x)), ty = AX_Y - 46 * (1 - t);
        const lift = Math.sin(t * Math.PI) * 34;
        return { X: lerp(P.X, tx, t), Y: lerp(P.Y, ty, t) - lift, k: lerp(P.k, 1, t) };
    }

    // ---------- Gitter ----------
    const N = 14, EXT = 1.12, RES = 64;
    function gridSegs(L, t) {
        const out = [];
        for (let i = 0; i <= N; i++) { const v = -EXT + 2 * EXT * i / N;
            for (const sw of [0, 1]) { const pts = [];
                for (let j = 0; j <= RES; j++) { const u = -EXT + 2 * EXT * j / RES;
                    pts.push(warp(sw ? v : u, sw ? u : v, L, t)); }
                out.push(pts); } }
        return out;
    }

    // ---------- Boden + z-Achse ----------
    function drawBox(al) {
        if (al < 0.01) return;
        const E = EXT, ZT = 1.35, G = 10;
        ctx.globalAlpha = al * 0.40; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 0.9;
        for (let i = 0; i <= G; i++) { const v = -E + 2 * E * i / G;
            let p = proj({ x: -E, y: v, z: 0 }), q = proj({ x: E, y: v, z: 0 });
            ctx.beginPath(); ctx.moveTo(p.X, p.Y); ctx.lineTo(q.X, q.Y); ctx.stroke();
            p = proj({ x: v, y: -E, z: 0 }); q = proj({ x: v, y: E, z: 0 });
            ctx.beginPath(); ctx.moveTo(p.X, p.Y); ctx.lineTo(q.X, q.Y); ctx.stroke(); }

        ctx.globalAlpha = al * 0.35; ctx.strokeStyle = '#94a3b8'; ctx.setLineDash([2, 6]);
        [0.45, 0.90].forEach(zv => { const s = 0.42;
            const r = [proj({ x: -s, y: -s, z: zv }), proj({ x: s, y: -s, z: zv }),
                proj({ x: s, y: s, z: zv }), proj({ x: -s, y: s, z: zv })];
            ctx.beginPath(); ctx.moveTo(r[0].X, r[0].Y);
            for (let i = 1; i < 4; i++) ctx.lineTo(r[i].X, r[i].Y);
            ctx.closePath(); ctx.stroke(); });
        ctx.setLineDash([]);

        ctx.globalAlpha = al * 0.85; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.6;
        const o = proj({ x: 0, y: 0, z: 0 }), tp = proj({ x: 0, y: 0, z: ZT });
        ctx.beginPath(); ctx.moveTo(o.X, o.Y); ctx.lineTo(tp.X, tp.Y); ctx.stroke();
        ctx.fillStyle = '#64748b'; ctx.beginPath();
        ctx.moveTo(tp.X, tp.Y - 1); ctx.lineTo(tp.X - 4.5, tp.Y + 11); ctx.lineTo(tp.X + 4.5, tp.Y + 11);
        ctx.closePath(); ctx.fill();
        ctx.lineWidth = 1.2;
        [0.45, 0.90].forEach(zv => { const m = proj({ x: 0, y: 0, z: zv });
            ctx.beginPath(); ctx.moveTo(m.X - 5, m.Y); ctx.lineTo(m.X + 5, m.Y); ctx.stroke(); });
        ctx.font = 'italic 16px Georgia'; ctx.fillText('z', tp.X + 12, tp.Y + 5);
        ctx.font = '12px system-ui,sans-serif'; ctx.fillStyle = '#475569';
        //ctx.fillText('alte 2D-Ebene', c[3].X + 12, c[3].Y - 8);
        ctx.globalAlpha = 1;
    }

    // ---------- "Jeder Punkt = ein Wort" (Labels) ----------
    // Ein Beispielwort als Label über einem Torus-Punkt: Highlight-Ring +
    // Wort-Text oben (mit weißem Untergrund für Lesbarkeit auf der Wolke).
    function drawWordLabel(x, y, word, color, fade) {
        ctx.globalAlpha = fade;
        ctx.lineWidth = 1.6; ctx.strokeStyle = color;
        ctx.beginPath(); ctx.arc(x, y, 8, 0, 6.2832); ctx.stroke();
        ctx.globalAlpha = fade * 0.9; ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 6.2832); ctx.fill();

        ctx.font = '600 15px system-ui,sans-serif';
        const tw = ctx.measureText(word).width;
        ctx.globalAlpha = fade * 0.8; ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - tw / 2 - 5, y - 30, tw + 10, 20);
        ctx.globalAlpha = fade; ctx.fillStyle = color;
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(word, x, y - 14);
        ctx.textAlign = 'left';
    }

    // ---------- Fun-Fact-Schritt: Sigmoid krümmt, ReLU knickt ----------
    // Zwei 3D-Blätter nebeneinander. Sigmoid biegt die Fläche glatt (Welle),
    // ReLU knickt sie hart (scharfe Falte bei x=0, wie Origami). Inspiriert von
    // origami_live.js, aber ohne three.js/tfjs — nur 2D-Canvas-3D-Projektion.
    const FF_SIG = x => (1 / (1 + Math.exp(-1.6 * x))) - 0.5;   // S-Kurve, zentriert
    const FF_RELU = x => Math.max(0, x);                        // harte Falte bei x=0
    function ffProj(xw, y, z) {
        const A = 0.2, B = 0.5, S0 = Math.min(W, H) * 0.12;
        const X = xw * Math.cos(A) - y * Math.sin(A);
        const Y = xw * Math.sin(A) + y * Math.cos(A);
        const y2 = -Y * Math.sin(B) + z * Math.cos(B);
        const z2 = Y * Math.cos(B) + z * Math.sin(B);
        const d = 5.0, k = d / (d + z2 * 0.70);
        return { X: W / 2 + X * S0 * k, Y: H * 0.47 - y2 * S0 * k };
    }
    function drawSheet(cx, act, color, alpha, crest) {
        const NX = 28, NY = 16, X0 = -1.3, X1 = 1.3, Y0 = -0.8, Y1 = 0.8, ZS = 0.85;
        // Höhenlinien (konstante lx) — die "Tiefe" des Blatts
        for (let i = 0; i <= NX; i++) { const lx = X0 + (X1 - X0) * i / NX, z = act(lx) * ZS;
            ctx.strokeStyle = color; ctx.globalAlpha = alpha * 0.40; ctx.lineWidth = 0.9;
            ctx.beginPath();
            for (let j = 0; j <= NY; j++) { const ly = Y0 + (Y1 - Y0) * j / NY;
                const p = ffProj(cx + lx, ly, z); j ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y); }
            ctx.stroke(); }
        // Querschnitte (konstante ly) — zeigen das Profil (Welle / Keil)
        for (let j = 0; j <= NY; j++) { const ly = Y0 + (Y1 - Y0) * j / NY;
            const edge = (j === 0 || j === NY);
            ctx.strokeStyle = color; ctx.globalAlpha = alpha * (edge ? 0.95 : 0.60);
            ctx.lineWidth = edge ? 1.7 : 1.0;
            ctx.beginPath();
            for (let i = 0; i <= NX; i++) { const lx = X0 + (X1 - X0) * i / NX, z = act(lx) * ZS;
                const p = ffProj(cx + lx, ly, z); i ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y); }
            ctx.stroke(); }
        // Falzkante (ReLU): lx = 0 als helle Linie
        if (crest) { const z = act(0) * ZS;
            ctx.strokeStyle = '#fbbf24'; ctx.globalAlpha = alpha * 0.95; ctx.lineWidth = 2.4;
            ctx.beginPath();
            for (let j = 0; j <= NY; j++) { const ly = Y0 + (Y1 - Y0) * j / NY;
                const p = ffProj(cx + 0, ly, z); j ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y); }
            ctx.stroke(); }
        ctx.globalAlpha = alpha;
    }
    // Sample-Punkte auf den Blättern: zeigen, wie die Krümmung Topologie
    // bricht. Sigmoid (glatt, umkehrbar = Homöomorphismus): bleiben getrennt.
    // ReLU (Falte, nicht umkehrbar): Punkte links der Falte klappen auf x=0
    // und kollidieren (2 → 1).
    const FF_SX = [-1.0, -0.35, 0.35, 1.0];
    function drawSamplePoints(cx, act, color, alpha, isFold) {
        const ZS = 0.85;
        FF_SX.forEach(x => {
            const z = act(x) * ZS;
            const p = ffProj(cx + x, 0, z);
            if (isFold && x < 0) {   // klappen auf die Falzkante (x = 0)
                const c = ffProj(cx + 0, 0, 0);
                ctx.strokeStyle = color; ctx.lineWidth = 1.3; ctx.setLineDash([3, 3]); ctx.globalAlpha = alpha * 0.65;
                ctx.beginPath(); ctx.moveTo(p.X, p.Y); ctx.lineTo(c.X, c.Y); ctx.stroke(); ctx.setLineDash([]);
            }
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.X, p.Y, 4.2, 0, 6.2832); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.X, p.Y, 4.2, 0, 6.2832); ctx.stroke();
        });
        if (isFold) {   // Kollisionsmarker an der Falzkante
            const c = ffProj(cx + 0, 0, 0);
            ctx.globalAlpha = alpha; ctx.strokeStyle = '#e11d48'; ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.arc(c.X, c.Y, 9.5, 0, 6.2832); ctx.stroke();
            ctx.fillStyle = '#e11d48'; ctx.font = '600 11px system-ui,sans-serif'; ctx.textAlign = 'left';
            ctx.fillText('2 → 1', c.X + 13, c.Y - 2);
        }
        ctx.globalAlpha = alpha;
    }
    function drawFunFact(alpha) {
        if (alpha < 0.01) return;
        ctx.save();
        // Titel
        ctx.globalAlpha = alpha; ctx.textAlign = 'center';
        ctx.fillStyle = '#0f172a'; ctx.font = '600 21px system-ui,sans-serif';
        ctx.fillText('Sigmoid krümmt, ReLU knickt', W / 2, H * 0.10);
        ctx.fillStyle = '#64748b'; ctx.font = '13px system-ui,sans-serif';
        ctx.fillText('zwei Aktivierungen, zwei Raumkrümmungen', W / 2, H * 0.10 + 22);
        // Blätter nebeneinander
        const GAP = 2.15;
        drawSheet(-GAP, FF_SIG, '#0284c7', alpha, false);
        drawSheet(+GAP, FF_RELU, '#d97706', alpha, true);
        drawSamplePoints(-GAP, FF_SIG, '#0284c7', alpha, false);
        drawSamplePoints(+GAP, FF_RELU, '#d97706', alpha, true);
        // Beschriftung über jedem Blatt
        ctx.globalAlpha = alpha; ctx.textAlign = 'center'; ctx.font = '600 14px system-ui,sans-serif';
        const lL = ffProj(-GAP, 0, 0), lR = ffProj(GAP, 0, 0);
        ctx.fillStyle = '#0284c7';         ctx.fillText('sigmoid: glatt, injektiv → getrennt', lL.X, H * 0.31);
        ctx.fillStyle = '#d97706'; ctx.fillText('ReLU: Falte, nicht injektiv → 2 → 1', lR.X, H * 0.31);
        // Caption
        ctx.fillStyle = '#475569'; ctx.font = '13.5px system-ui,sans-serif';
        ctx.fillText('Glatte Krümmung (Sigmoid) ist injektiv/umkehrbar auf ihrem Bild — erhält die Topologie (reicht für das Egg).', W / 2, H * 0.68);
        ctx.fillStyle = '#d97706'; ctx.font = '600 13.5px system-ui,sans-serif';
        ctx.fillText('Die ReLU-Falte ist nicht injektiv — sie identifiziert Punkte mit x ≤ 0 und löst die Verschlingung der Tori auf.', W / 2, H * 0.68 + 22);
        ctx.restore();
    }

// ---------- Solide: Wie das Falten das nächste Wort findet ----------
    // Die Frage, die diese Solide beantwortet:
    //   "Wie hilft das Falten des Raumes einem LLM, das richtige nächste Wort zu finden?"
    //
    // Kernbild (Keup & Helias, arXiv:2203.11355): Die letzte Schicht ist linear —
    // sie liest die Representation entlang EINER Richtung aus. Damit das gelingt,
    // muss die Representation so gefaltet sein, dass diese eine Richtung die
    // passenden Kandidaten über die unpassenden legt. Das Falten ist also die
    // Vorbereitung darauf, dass die letzte Schicht überhaupt arbeiten kann.
    //
    // Aufbau: links der Kandidatenraum ("Der Hund ___" → 10 Wörter), rechts die
    // Scores der letzten Schicht. Vor dem Falten gewinnt das falsche Wort,
    // nach dem Falten das richtige. Alle Koordinaten unten sind so gerechnet,
    // dass genau das passiert (Start/Ende/Ranking wurden verifiziert).
    //
    // WICHTIG: Canvas max 1340x640, oben links ein HTML-Overlay (#sm-title/#sm-body,
    // x 32..352, ab y 20) und unten rechts die Quellenzeile (ab y ~606).
    // Deshalb: kein Canvas-Titel, alles zwischen y 150 und y 540.
    const NW = {
        // [Wort, passt es danach?, u, v] — Startlage (ungefaltet)
        start: [
            ['bellt', 1, 0.093, 0.435], ['schläft', 1, 0.307, 0.613], ['springt', 1, 0.326, 0.840],
            ['friert', 1, 0.379, 0.459], ['jagt', 1, 0.498, 0.671],
            ['blaut', 0, 0.573, 0.175], ['Tabelle', 0, 0.712, 0.380], ['Häuser', 0, 0.679, 0.584],
            ['langsam', 0, 0.873, 0.705], ['gestern', 0, 0.922, 0.432],
        ],
        // Endlage (nach der Falte): alle passenden Wörter liegen über allen anderen
        end: [
            ['bellt', 1, 0.300, 0.140], ['schläft', 1, 0.540, 0.280], ['springt', 1, 0.760, 0.220],
            ['friert', 1, 0.420, 0.400], ['jagt', 1, 0.660, 0.440],
            ['blaut', 0, 0.220, 0.680], ['Tabelle', 0, 0.460, 0.740], ['Häuser', 0, 0.640, 0.640],
            ['langsam', 0, 0.820, 0.780], ['gestern', 0, 0.580, 0.920],
        ],
        fold: [-0.574, 0.819, 0.123],   // Faltkante: n·p = c
        temp: 0.18,                       // Temperatur der Softmax (nur für die Balkenlänge)
    };
    const NW_GOOD = '#16a34a', NW_BAD = '#94a3b8', NW_BADP = '#cbd5e1';

    // Ein Wort wandert mit der Falte mit: die Faltkante fährt von außen herein,
    // und jeder Punkt kippt über sie, sobald sie ihn erreicht hat.
    function nwPoint(i, t) {
        const a = NW.start[i], b = NW.end[i], [nx, ny, c] = NW.fold;
        const u0 = a[2], v0 = a[3];
        const dEnd = c - (nx * u0 + ny * v0);              // Weg, den dieser Punkt gefaltet wird
        const uEnd = u0 + 2 * dEnd * nx, vEnd = v0 + 2 * dEnd * ny;
        if (dEnd <= 0) return { u: lerp(u0, uEnd, t), v: lerp(v0, vEnd, t), flip: 0 };
        // Versatz: der Punkt kippt erst, wenn die Kante an ihm vorbeigefahren ist
        const lead = clamp(1 - Math.abs(dEnd) * 0.55, 0.12, 0.55);   // je weiter weg, desto später
        const q = ease(clamp((t - (1 - lead)) / lead, 0, 1));
        return { u: lerp(u0, uEnd, q), v: lerp(v0, vEnd, q), flip: q };
    }
    // Scores der letzten Schicht: eine feste Richtung, softmax nur für die Länge
    function nwScores(P) {
        const raw = P.map(p => 1 - p.v);
        const mx = Math.max.apply(null, raw);
        const ex = raw.map(s => Math.exp((s - mx) / NW.temp));
        const z = ex.reduce((a, b) => a + b, 0);
        return { raw: raw, prob: ex.map(e => e / z) };
    }

    function drawNextWord(t, alpha) {
        const W = cv.width / dpr, H = cv.height / dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);
        if (alpha < 0.01) return;

        const bx = 392, by = 158, bw = 452, bh = 352;      // Kandidatenraum
        const X = u => bx + u * bw, Y = v => by + v * bh;
        const P = [];
        for (let i = 0; i < NW.start.length; i++) P.push(nwPoint(i, t));

        // ---------- Kandidatenraum ----------
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.4;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = '#94a3b8'; ctx.font = '11.5px system-ui,sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('Kandidatenraum des Netzes', bx + 2, by - 8);

        // Leserichtung der letzten Schicht: nach oben = besserer Score
        const ax = bx + 26;
        const aGrad = clamp((t - 0.25) / 0.35, 0, 1);
        if (aGrad > 0.01) {
            ctx.globalAlpha = alpha * aGrad;
            ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.lineCap = 'round';
            const a0 = by + bh - 26, a1 = by + 40;
            ctx.beginPath(); ctx.moveTo(ax, a0); ctx.lineTo(ax, a1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ax - 5, a1 + 7); ctx.lineTo(ax, a1); ctx.lineTo(ax + 5, a1 + 7); ctx.stroke();
            ctx.fillStyle = '#475569'; ctx.font = '600 11px system-ui,sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('besser', ax, a1 - 10);
            ctx.font = '10px system-ui,sans-serif'; ctx.fillStyle = '#94a3b8';
            ctx.fillText('eine Richtung', ax, a0 + 14);
        }

        // Faltkante (die ReLU-Falte)
        const [nx, ny, c] = NW.fold;
        const cx = -ny, cyv = nx;                            // Richtung entlang der Kante
        const mid = [X(0.5), Y(0.5)];
        const kAt = (u, v) => nx * u + ny * v - c;
        const ext = Math.max(bw, bh);
        // Kante fährt von außerhalb herein → erst am Ende steht sie auf der Falte
        const slide = ease(clamp((t - 0.12) / 0.5, 0, 1));
        const cNow = c + (1 - slide) * 0.95;
        ctx.globalAlpha = alpha * (0.35 + 0.65 * slide);
        ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2.6;
        ctx.setLineDash([9, 6]); ctx.lineDashOffset = -t * 26;
        ctx.beginPath();
        ctx.moveTo(mid[0] + cx * ext + nx * (c - cNow), mid[1] + cyv * ext + ny * (c - cNow));
        ctx.lineTo(mid[0] - cx * ext + nx * (c - cNow), mid[1] - cyv * ext + ny * (c - cNow));
        ctx.stroke(); ctx.setLineDash([]);

        // Punkte
        const { prob } = nwScores(P);
        let win = 0;
        for (let i = 1; i < prob.length; i++) if (prob[i] > prob[win]) win = i;
        for (let i = 0; i < P.length; i++) {
            const good = NW.start[i][1] === 1, p = P[i];
            const x = X(p.u), y = Y(p.v);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = good ? NW_GOOD : NW_BAD;
            ctx.beginPath(); ctx.arc(x, y, 7.5, 0, 6.2832); ctx.fill();
            ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(x, y, 7.5, 0, 6.2832); ctx.stroke();
            // Spiegel-Spur: der Weg, den der Punkt beim Kippen zurücklegt
            if (p.flip > 0.02 && p.flip < 0.99) {
                ctx.globalAlpha = alpha * 0.4 * (1 - Math.abs(p.flip - 0.5) * 2);
                ctx.strokeStyle = good ? NW_GOOD : NW_BAD; ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(X(NW.start[i][2]), Y(NW.start[i][3])); ctx.lineTo(x, y);
                ctx.stroke();
            }
            ctx.globalAlpha = alpha;
            ctx.fillStyle = good ? '#14532d' : '#64748b';
            ctx.font = (i === win ? '700 ' : '') + '12px system-ui,sans-serif';
            ctx.textAlign = x > bx + bw * 0.68 ? 'right' : 'left';
            ctx.fillText(NW.start[i][0], x + (x > bx + bw * 0.68 ? -12 : 12), y + 4);
        }

        // ---------- Scores der letzten Schicht ----------
        const sx = 906, sw = 410;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#0f172a'; ctx.font = '600 13px system-ui,sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('Was die letzte Schicht daraus liest', sx, by + 2);
        ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui,sans-serif';
        ctx.fillText('Softmax über alle Kandidaten', sx, by + 18);

        const rowH = 27, rowY = by + 42;
        for (let i = 0; i < P.length; i++) {
            const good = NW.start[i][1] === 1, y = rowY + i * rowH;
            const isWin = i === win;
            ctx.globalAlpha = alpha * (good ? 1 : 0.8);
            ctx.fillStyle = isWin ? '#0f172a' : (good ? '#334155' : '#94a3b8');
            ctx.font = (isWin ? '700 ' : '') + '12px system-ui,sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(NW.start[i][0], sx + 84, y);
            const barX = sx + 92, barMax = 210;
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(barX, y - 9, barMax, 12);
            const bwv = Math.max(2, barMax * prob[i]);
            ctx.fillStyle = good ? NW_GOOD : NW_BADP;
            ctx.fillRect(barX, y - 9, bwv, 12);
            ctx.fillStyle = isWin ? '#0f172a' : '#64748b';
            ctx.font = (isWin ? '700 ' : '') + '11px system-ui,sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText((prob[i] * 100).toFixed(0) + '%', barX + barMax + 8, y);
            if (isWin) {
                ctx.fillStyle = NW_GOOD;
                ctx.font = '700 12px system-ui,sans-serif'; ctx.textAlign = 'right';
                ctx.fillText('▶', sx - 6, y);
            }
        }

        // Sieger
        const outY = rowY + P.length * rowH + 16;
        const right = win === 0;                              // passt das Gewinnerwort?
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = right ? NW_GOOD : '#ef4444'; ctx.lineWidth = 2;
        ctx.strokeRect(sx - 4, outY - 20, sw - 8, 46);
        ctx.fillStyle = right ? '#15803d' : '#b91c1c';
        ctx.font = '600 13px system-ui,sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(right ? 'Ausgegeben: „' + NW.start[win][0] + '"' : 'Ausgegeben: „' + NW.start[win][0] + '"  — falsch',
            sx + 8, outY + 2);
        ctx.fillStyle = '#64748b'; ctx.font = '11.5px system-ui,sans-serif';
        ctx.fillText(right ? 'die Falte hat die richtige Antwort nach oben sortiert'
            : 'die Richtung der letzten Schicht zeigt noch auf das falsche Wort', sx + 8, outY + 18);
    }

    // ---------- Render ----------
    function draw(now) {
        if (!active) return;
        resizeCanvas();
        if (!ctx) { raf = requestAnimationFrame(draw); return; }

        axisGeom();
        const stepDur = (cur === IDX_HOMOTOPY) ? HOMOTOPY_DUR : DUR;
        const raw = clamp((now - t0) / stepDur, 0, 1), u = ease(raw);
        // Tabellen-Werte smooth mitziehen (w erscheint leer, füllt sich dann)
        updateTables(raw);
        const a = S[prevIdx], b = S[cur];
        const L = lerp(a.L, b.L, u); pers = lerp(a.P, b.P, u);
        const prRaw = lerp(a.pr, b.pr, raw);
        camA = lerp(a.A, b.A, u); camB = lerp(a.B, b.B, u);
        if (!md) { dragA = lerp(dA0, 0, u); dragB = lerp(dB0, 0, u); }
        const flat = 1 - clamp((camB + dragB) / 1.5708, 0, 1);
        FIT = lerp(1.0, 0.34, flat); YOFF = lerp(0, H * 0.10, flat);
        const tor = lerp(a.tori || 0, b.tori || 0, u);
        const ut = lerp(a.ut || 0, b.ut || 0, u);
        // Formparameter k: komplex (1) → schlicht (0). Beim Eintritt in die
        // Toriphase startet k bei 1, damit nichts "aufpoppt".
        const kFrom = (prevIdx >= IDX_COMPLEX && a.kx !== undefined) ? a.kx : (b.kx !== undefined ? b.kx : 0);
        const kTo = (b.kx !== undefined) ? b.kx : 0;
        const kNow = clamp(lerp(kFrom, kTo, u), 0, 1);
        const pl = lerp(a.pl, b.pl, u), sq = lerp(a.sq, b.sq, u),
            fl = lerp(a.fail, b.fail, u) * (1 - tor),
            lb = lerp(a.lab, b.lab, u) * (1 - tor),
            bx = lerp(a.box, b.box, u),
            ff = lerp(a.ff || 0, b.ff || 0, u);
        const nw = lerp(a.nw || 0, b.nw || 0, u);
        const nwF = lerp(a.nwF || 0, b.nwF || 0, u);
        // Schritt-8-Auto-Orbit: 1× Pfeil-rechts → ~5 s sanfter 360°-Kamera-Umlauf.
        if (autoOrbitActive && tor > 0.01) {
            const elapsed = now - autoOrbitStart;
            if (elapsed >= ORBIT_AUTO_DUR) {
                autoOrbitActive = false;
                autoOrbitDone = true;
            } else {
                const tt = elapsed / ORBIT_AUTO_DUR;
                const e = ease(tt);
                camA = autoOrbitFromAngle + e * Math.PI * 2;
            }
        }
        const lesson = 1 - tor;
        const fwd = b.pr > a.pr;
        const tCol = fwd ? sub(prRaw, 0, 1) : 1 - sub(1 - prRaw, 0, 1);
        const axA = (fwd ? sub(prRaw, 0.05, 0.5) : 1 - sub(1 - prRaw, 0.05, 0.5)) * lesson;

        ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);

        // Fun-Fact-/LLM-Schritt: ganzes 3D-Szenario überspringen, nur den 2D-Plot
        // zeichnen (Hard-Cut wie bei den Egg↔Tori-Übergängen, Plot blendet ein).
        // Der Übergang Fun-Fact → LLM ist ein Fade-Through-White in der Mitte.
        if (ff > 0.01 || nw > 0.01) {
            if (nw > 0.01) drawNextWord(nwF, nw);
            else drawFunFact(ff);
            raf = requestAnimationFrame(draw);
            return;
        }

        drawBox(bx * lesson);

        if (axA > 0.01) { ctx.globalAlpha = axA; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(AX_L, AX_Y); ctx.lineTo(AX_R, AX_Y); ctx.stroke();
            for (let i = 0; i <= 10; i++) { const X = lerp(AX_L, AX_R, i / 10);
                ctx.beginPath(); ctx.moveTo(X, AX_Y - 4); ctx.lineTo(X, AX_Y + 4); ctx.stroke(); }
            const TX = sx(0); ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2.6;
            ctx.beginPath(); ctx.moveTo(TX, AX_Y - 36); ctx.lineTo(TX, AX_Y + 36); ctx.stroke();
            ctx.textAlign = 'center'; ctx.fillStyle = '#b45309'; ctx.font = '13px Georgia';
            ctx.fillText('s = 0', TX, AX_Y + 58);
            ctx.font = '600 13px system-ui,sans-serif';
            ctx.fillStyle = '#be123c'; ctx.fillText('s < 0   innerer Kern', lerp(AX_L, TX, 0.40), AX_Y + 58);
            ctx.fillStyle = '#0369a1'; ctx.fillText('s > 0   äußerer Ring', lerp(TX, AX_R, 0.55), AX_Y + 58);
            ctx.textAlign = 'left'; ctx.globalAlpha = 1; }

        ctx.lineWidth = 1;
        const gA = (0.22 + 0.24 * L) * (1 - tCol * 0.35) * lesson;
        gridSegs(L, tCol).forEach(sg => { ctx.beginPath();
            sg.forEach((p, i) => { i ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y); });
            ctx.strokeStyle = 'rgba(100,116,139,' + gA + ')'; ctx.stroke(); });

        if (fl > 0.01) { ctx.globalAlpha = fl * 0.7; ctx.lineWidth = 1.6; ctx.strokeStyle = '#94a3b8';
            ctx.setLineDash([5, 5]);
            for (let k = 0; k < 5; k++) { const t = k * 0.63 + 0.2;
                const p = proj({ x: Math.cos(t) * -1.2, y: Math.sin(t) * -1.2, z: 0 });
                const q = proj({ x: Math.cos(t) * 1.2, y: Math.sin(t) * 1.2, z: 0 });
                ctx.beginPath(); ctx.moveTo(p.X, p.Y); ctx.lineTo(q.X, q.Y); ctx.stroke(); }
            ctx.setLineDash([]); ctx.globalAlpha = 1; }

        if (bx > 0.01 && L < 0.5) {
            ctx.globalAlpha = bx * 0.30; ctx.fillStyle = '#000';
            PTS.forEach(p => { const s = proj({ x: p.x, y: p.y, z: 0 });
                ctx.beginPath(); ctx.ellipse(s.X, s.Y, 3.2 * s.k, 1.5 * s.k, 0, 0, 6.2832); ctx.fill(); });
            ctx.globalAlpha = 1; }

        const items = [];
        if (lesson > 0.01) PTS.forEach(p => {
            const P = warp(p.x, p.y, L, tCol);
            const dep = proj(LIFT(p.x, p.y, L)).d;
            items.push({ d: dep, type: 'pt', s: P, c: p.c }); });

        if (pl > 0.01 && lesson > 0.01) {
            const E = 0.92, M = 7, rows = [];
            for (let i = 0; i <= M; i++) {
                const yv = (-E + 2 * E * i / M) * (1 - sq), row = [];
                for (let j = 0; j <= M; j++) row.push(proj({ x: -E + 2 * E * j / M, y: yv, z: PLANE_Z }));
                rows.push(row); }
            items.push({ d: PLANE_Z, type: 'plane', rows: rows, a: pl, sq: sq }); }

        items.sort((p, q) => p.d - q.d);

        items.forEach(it => {
            if (it.type === 'plane') {
                const R = it.rows, M = R.length - 1;
                ctx.globalAlpha = it.a * 0.17 * (1 - it.sq);
                ctx.fillStyle = '#f59e0b'; ctx.beginPath();
                ctx.moveTo(R[0][0].X, R[0][0].Y);
                for (let j = 1; j <= M; j++) ctx.lineTo(R[0][j].X, R[0][j].Y);
                for (let j = M; j >= 0; j--) ctx.lineTo(R[M][j].X, R[M][j].Y);
                ctx.closePath();
                ctx.fill();

                ctx.globalAlpha = it.a * 0.42 * (1 - it.sq); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1;
                for (let i = 0; i <= M; i++) { ctx.beginPath();
                    R[i].forEach((p, j) => j ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y)); ctx.stroke(); }
                for (let j = 0; j <= M; j++) { ctx.beginPath();
                    for (let i = 0; i <= M; i++) { const p = R[i][j]; i ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y); }
                    ctx.stroke(); }

                const mid = R[Math.floor(M / 2)];
                ctx.globalAlpha = it.a * (0.45 + 0.55 * it.sq); ctx.lineWidth = 1.4 + 2.4 * it.sq;
                ctx.strokeStyle = '#d97706'; ctx.beginPath();
                mid.forEach((p, j) => j ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y));
                ctx.stroke(); ctx.globalAlpha = 1;
            } else {
                const r = (2.8 + 0.7 * it.s.k) * it.s.k;
                ctx.beginPath(); ctx.arc(it.s.X, it.s.Y, r, 0, 6.2832);
                ctx.fillStyle = it.c ? '#0284c7' : '#e11d48';
                ctx.globalAlpha = (0.55 + 0.45 * it.s.k) * lesson; ctx.fill(); ctx.globalAlpha = 1;
            } });

        if (lb > 0.01) { ctx.globalAlpha = lb; ctx.font = '600 14px system-ui,sans-serif';
            const c0 = proj({ x: 0, y: 0, z: PLANE_Z }), LX = W / 2 + BASE() * FIT * 1.12 + 170;
            ctx.fillStyle = '#0284c7'; ctx.fillText('Klasse B — äußerer Ring', LX, c0.Y - 58);
            ctx.fillStyle = '#e11d48'; ctx.fillText('Klasse A — innerer Kern', LX, c0.Y + 66);
            ctx.fillStyle = '#d97706'; ctx.font = '13px Georgia';
            ctx.fillText('Trennebene, von der Kante', LX, c0.Y + 4); ctx.globalAlpha = 1; }

        // ---------- Zwei verschlungene Tori (Bonusphase) ----------
        if (tor > 0.01) {
            // 1D-Projektion (wie am Anfang der Egg-Phase): auf dem letzten
            // Schritt gleiten die Tori-Punkte auf die 1D-Score-Achse ab.
            const tColTori = (prevIdx >= IDX_COMPLEX) ? clamp(lerp(a.pr || 0, b.pr || 0, u), 0, 1) : 0;

            if (tColTori > 0.01) {
                ctx.globalAlpha = tColTori; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.moveTo(AX_L, AX_Y); ctx.lineTo(AX_R, AX_Y); ctx.stroke();
                for (let i = 0; i <= 10; i++) { const X = lerp(AX_L, AX_R, i / 10);
                    ctx.beginPath(); ctx.moveTo(X, AX_Y - 4); ctx.lineTo(X, AX_Y + 4); ctx.stroke(); }
                const TX = sxTori(0); ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2.6;
                ctx.beginPath(); ctx.moveTo(TX, AX_Y - 36); ctx.lineTo(TX, AX_Y + 36); ctx.stroke();
                ctx.textAlign = 'center'; ctx.fillStyle = '#b45309'; ctx.font = '13px Georgia';
                ctx.fillText('s = 0', TX, AX_Y + 58);
                ctx.font = '600 13px system-ui,sans-serif';
                ctx.fillStyle = '#15803d'; ctx.fillText('Klasse A', lerp(AX_L, TX, 0.45), AX_Y + 58);
                ctx.fillStyle = '#e11d48'; ctx.fillText('Klasse B', lerp(TX, AX_R, 0.5), AX_Y + 58);
                ctx.textAlign = 'left'; ctx.globalAlpha = 1;
            }

            const pts = toriPoints(kNow);
            const titems = [];
            for (let i = 0; i < pts.length; i++) {
                const p = pts[i];
                const q = untangle(ut, p);
                const P3 = proj(q);
                const P = warpTori(q, tColTori);
                titems.push({ d: P3.d, s: P, c: p.c });
            }
            titems.sort((p, q) => p.d - q.d);
            titems.forEach(it => {
                const r = (2.4 + 0.6 * it.s.k) * it.s.k;
                ctx.beginPath(); ctx.arc(it.s.X, it.s.Y, r, 0, 6.2832);
                ctx.fillStyle = it.c ? '#e11d48' : '#15803d';
                ctx.globalAlpha = 0.4 + 0.6 * it.s.k; ctx.fill(); ctx.globalAlpha = 1;
            });

            // Hinweistext während der Homotopie: Verschlingungszahl bleibt +1
            if (cur === IDX_HOMOTOPY || (cur === IDX_COMPLEX && kNow > 0.02)) {
                const a0 = clamp(1 - Math.abs(kNow - 0.5) * 1.6, 0, 1);
                if (a0 > 0.02) {
                    ctx.globalAlpha = a0 * 0.9;
                    ctx.font = '600 13px system-ui,sans-serif';
                    ctx.fillStyle = '#7c3aed';
                    const LX = W / 2 + BASE() * FIT * 1.05 + 170;
                    ctx.fillText('Verschlingungszahl = +1  (unverändert)', LX, H * 0.22);
                    ctx.font = '12px system-ui,sans-serif';
                    ctx.fillStyle = '#64748b';
                    ctx.fillText('kein Schnitt · kein Kleben · keine Durchdringung', LX, H * 0.22 + 18);
                    ctx.globalAlpha = 1;
                }
            }

            // Trennebene am Ende: senkrechte Ebene x = const zwischen den Klumpen
            if (pl > 0.01) {
                const PX = 0.36, E = 0.95, MM = 7;
                for (let i = 0; i <= MM; i++) { const yv = -E + 2 * E * i / MM;
                    const p0 = proj({ x: PX, y: yv, z: -E }), p1 = proj({ x: PX, y: yv, z: E });
                    ctx.globalAlpha = pl * 0.22; ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(p0.X, p0.Y); ctx.lineTo(p1.X, p1.Y); ctx.stroke(); }
                for (let i = 0; i <= MM; i++) { const zv = -E + 2 * E * i / MM;
                    const p0 = proj({ x: PX, y: -E, z: zv }), p1 = proj({ x: PX, y: E, z: zv });
                    ctx.globalAlpha = pl * 0.22; ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(p0.X, p0.Y); ctx.lineTo(p1.X, p1.Y); ctx.stroke(); }
                const tl = proj({ x: PX, y: 0, z: E }), bl = proj({ x: PX, y: 0, z: -E });
                ctx.globalAlpha = pl * 0.9; ctx.lineWidth = 2.2; ctx.strokeStyle = '#d97706';
                ctx.beginPath(); ctx.moveTo(tl.X, tl.Y); ctx.lineTo(bl.X, bl.Y); ctx.stroke(); ctx.globalAlpha = 1;
                ctx.font = '13px Georgia'; ctx.fillStyle = '#b45309';
                ctx.fillText('Trennebene', tl.X + 8, tl.Y);
            }

            // ---------- "Jeder Punkt = ein Wort" (Labels) ----------
            // Sobald der verwirrte Torus erscheint, benennen zwei Beispielwörter
            // je einen Punkt (eines pro Torus) — nur Labels, kein Mauszeiger.
            if (cur === IDX_COMPLEX) {
                const fade = sub(now - t0, 500, 1200);
                if (fade > 0.01) {
                    WORD_PTS.forEach(w => {
                        const p = w.c === 0 ? toriAPoint(w.t, w.s, w.rho, kNow)
                                            : toriBPoint(w.t, w.s, w.rho, kNow);
                        const pr = proj(untangle(ut, p));
                        drawWordLabel(pr.X, pr.Y, w.word, w.c === 0 ? '#15803d' : '#e11d48', fade);
                    });
                }
            }
        }

        raf = requestAnimationFrame(draw);
    }

    // ---------- Canvas-Setup ----------
    function resizeCanvas() {
        const wrap = document.getElementById('space-morph-wrap');
        const cv = document.getElementById('space-morph-canvas');
        if (!wrap || !cv) return;
        const rect = wrap.getBoundingClientRect();
        if (rect.width < 50 || rect.height < 50) return;
        if (Math.abs(rect.width - W) < 0.5 && Math.abs(rect.height - H) < 0.5) return;
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        W = rect.width; H = rect.height;
        cv.width = Math.round(W * DPR);
        cv.height = Math.round(H * DPR);
        ctx = cv.getContext('2d');
        if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function bindDrag() {
        if (dragBound) return;
        const cv = document.getElementById('space-morph-canvas');
        if (!cv) return;
        dragBound = true;
        cv.addEventListener('mousedown', e => { md = true; mx = e.clientX; my = e.clientY; });
        window.addEventListener('mouseup', () => { md = false; });
        window.addEventListener('mousemove', e => { if (!md) return;
            dragA += (e.clientX - mx) * 0.006; dragB += (e.clientY - my) * 0.005;
            dA0 = dragA; dB0 = dragB; mx = e.clientX; my = e.clientY; });
    }

    // ---------- Demo-API (DemoRegistry-Vertrag) ----------
    function isOnSlide() {
        const s = document.querySelector('.slide.active');
        return !!s && s.id === SLIDE_ID;
    }

    // Blockiere Pfeiltasten, solange eine Animation läuft (Step-Übergang
    // oder Auto-Orbit), damit der User sich nicht verhaspelt. Schritt 8 →
    // Orbit ist die einzige Stelle, an der der User aktiv einsteuert; sobald
    // der Orbit startet, wird er automatisch zu Schritt 9 weitergeführt,
    // sobald er durch ist.
    let animating = false;
    function isAnimating() { return animating; }
    function canGoNext() { return active && !animating && cur < S.length - 1; }
    function canGoPrev() { return active && !animating && cur > 0; }
    function next() {
        if (!active || animating || cur >= S.length - 1) return;
        if (cur === IDX_COMPLEX) {
            if (!autoOrbitActive && !autoOrbitDone) {
                // 1. Pfeil-Druck: Auto-Orbit um das komplexe Geflecht starten
                // und danach automatisch zur Homotopie weiterlaufen.
                animating = true;
                autoOrbitActive = true;
                autoOrbitDone = false;
                autoOrbitStart = performance.now();
                autoOrbitFromAngle = camA;
                updateText();
                setTimeout(() => {
                    autoOrbitDone = true;
                    if (cur === IDX_COMPLEX) go(1);
                    setTimeout(() => { animating = false; updateText(); }, DUR + 80);
                }, ORBIT_AUTO_DUR + 80);
                return;
            }
            return;
        }
        // Homotopie-Schritt braucht mehr Zeit als ein normaler Übergang
        animating = true;
        go(1);
        const d = (cur === IDX_HOMOTOPY) ? HOMOTOPY_DUR : DUR;
        setTimeout(() => { animating = false; updateText(); }, d + 80);
    }
    function prev() {
        if (!active || animating || cur <= 0) return;
        animating = true;
        go(-1);
        setTimeout(() => { animating = false; updateText(); }, DUR + 80);
    }

    function init() {
        const cv = document.getElementById('space-morph-canvas');
        if (!cv) return;
        active = true;
        bindDrag();
        if (!inited) { inited = true; cur = 0; prevIdx = 0; }
        t0 = performance.now();
        updateText();
        if (!raf) raf = requestAnimationFrame(draw);
    }

    function reset() {
        active = false;
        animating = false;
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        cur = 0; prevIdx = 0;
        dragA = 0; dragB = 0; dA0 = 0; dB0 = 0;
        pers = 1; FIT = 1; YOFF = 0;
        autoOrbitActive = false;
        autoOrbitDone = false;
        autoOrbitStart = 0;
        autoOrbitFromAngle = 0;
        if (inited) updateText();
        updateTables();
    }

    return { init, reset, next, prev, canGoNext, canGoPrev, isOnSlide, isAnimating };
})();
