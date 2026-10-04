// ============================================================
// SPACE MORPH – "Layer als Raumkrümmung" (7-Schritte-Animation)
// Port von test/space_morph.html in das Folien-Format:
// Pfeiltasten (Präsentation) steuern die Schritte, Drag rotiert.
// ============================================================
const SpaceMorph = (() => {
    const SLIDE_ID = 'slide-layer-als-raumkruemmung';
    const DUR = 1900;

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
            b: "Eine lineare Trennung ist eine Gerade. Sie schneidet den Ring immer — die Topologie lässt es nicht zu.",
            L: 0, A: 0, B: 1.5708, P: 0, pl: 0, sq: 0, fail: 1, lab: 0, pr: 0, box: 0 },
        { t: "Eine Dimension mehr Platz",
            b: "Das alte Bild liegt als Boden unter uns, senkrecht dazu die neue Achse z. Über den Daten ist Raum entstanden.",
            L: 0, A: 0.38, B: 1.02, P: 1, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 1 },
        { t: "Der Layer krümmt den Raum",
            b: "Das Gitter hebt sich zu einer Schale: innere Punkte sinken, äußere steigen. Es zerreißt nicht, es biegt sich.",
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
        { t: "Neues Beispiel: komplex verschlungene Tori",
            b: "Andere Daten, anderes Problem: zwei Volltori im ℝ³ — ineinander verschlungen, mit vielen Schlingen. Keine Ebene trennt sie. Pfeiltaste → einmal herumdrehen und sehen, wie wild das Ding ist.",
            L: 0, A: 0.4, B: 1.0, P: 1, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 0,
            tori: 1, ut: 0, kx: 1 },
        // Schritt 9: Homotopie k: 1 → 0 — kein Schnitt, kein Kleben.
        { t: "Homotopie: entwirren ohne Schnitt",
            b: "Die Schlingen werden glatt zurückgezogen — ohne Schnitt, ohne Kleben, ohne dass sich die Ringe durchdringen. Die Verschlingungszahl bleibt +1: topologisch ist das dieselbe Konfiguration.",
            L: 0, A: 0.4, B: 1.0, P: 1, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 0,
            tori: 1, ut: 0, kx: 0 },
        // Schritt 10: der schlichte Hopf-Link — Ausgangspunkt des 4D-Tricks.
        { t: "Gleiche Topologie: der Hopf-Link",
            b: "Übrig bleibt der schlichte Hopf-Link. Jeder Torus hat β₁ = 1, beide sind unverändert verhakt — und noch immer trennt sie keine Ebene im ℝ³.",
            L: 0, A: 0.4, B: 1.0, P: 1, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 0,
            tori: 1, ut: 0, kx: 0 },
        { t: "4. Dimension macht es möglich",
            b: "Was vorher unlösbar war (keine Ebene trennt die Tori im ℝ³), wird durch den Lift in w lösbar. Die beiden Ringe sind jetzt zwei getrennte Klumpen im erweiterten Raum.",
            L: 0, A: 0.4, B: 1.0, P: 1, pl: 0, sq: 0, fail: 0, lab: 0, pr: 0, box: 0,
            tori: 1, ut: 1, kx: 0 },
        { t: "Jetzt reicht eine Ebene",
            b: "Zurück im ℝ³: zwei Klumpen. Eine Ebene trennt sie sauber.",
            L: 0, A: 0.4, B: 1.0, P: 1, pl: 1, sq: 0, fail: 0, lab: 0, pr: 0, box: 0,
            tori: 1, ut: 1, kx: 0 }
    ];

    // Schritt-Labels automatisch erzeugen — nie mehr von Hand nachzählen.
    S.forEach((s, i) => { s.n = `Schritt ${i + 1} / ${S.length}`; });

    // Benannte Indizes, damit Logik nicht auf Magic Numbers läuft
    const IDX_COMPLEX  = 7;   // komplex verschlungen, Auto-Orbit
    const IDX_HOMOTOPY = 8;   // k: 1 → 0
    const IDX_HOPF     = 9;   // schlichter Hopf-Link
    const IDX_LIFT     = 10;  // 4D-Lift
    const IDX_PLANE    = 11;  // Trennebene

    // "Jeder Punkt entspricht einem Wort": die simulierte Maus fährt zwei
    // Beispielwörter an (eines auf grünem A, eines auf rotem B). (t, s, rho)
    // wird pro Frame wie die Punktwolke in einen Weltpunkt umgerechnet
    // (kNow + ut + Kamera), dadurch bleiben Cursor & Label am Punkt hängen.
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
        const elStep = document.getElementById('sm-step');
        const elTitle = document.getElementById('sm-title');
        const elBody = document.getElementById('sm-body');
        if (elStep) elStep.textContent = s.n;
        if (elTitle) elTitle.textContent = s.t;
        if (elBody) elBody.textContent = s.b;
        updateTables();
        const bar = document.getElementById('sm-bar');
        if (bar) {
            bar.innerHTML = '';
            S.forEach((_, i) => {
                const e = document.createElement('div');
                let bg = '#cbd5e1';
                if (i < cur) bg = '#d97706';
                else if (i === cur && cur === IDX_COMPLEX) {
                    bg = autoOrbitActive ? '#7c3aed' : (autoOrbitDone ? '#d97706' : '#94a3b8');
                } else if (i === cur) {
                    bg = '#d97706';
                }
                // Balken etwas schmaler, weil es jetzt 12 Schritte sind
                e.style.cssText = 'width:20px;height:3px;transition:background .5s;background:' + bg + ';';
                bar.appendChild(e);
            });
        }
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
        ctx.globalAlpha = al * 0.12; ctx.fillStyle = '#64748b';
        const c = [proj({ x: -E, y: -E, z: 0 }), proj({ x: E, y: -E, z: 0 }),
            proj({ x: E, y: E, z: 0 }), proj({ x: -E, y: E, z: 0 })];
        ctx.beginPath(); ctx.moveTo(c[0].X, c[0].Y);
        for (let i = 1; i < 4; i++) ctx.lineTo(c[i].X, c[i].Y);
        ctx.closePath(); ctx.fill();

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

    // ---------- "Jeder Punkt = ein Wort" (simulierte Maus) ----------
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
    function drawSimCursor(x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(0, 16); ctx.lineTo(3.8, 12.4);
        ctx.lineTo(6.6, 18.4); ctx.lineTo(9.2, 17.2); ctx.lineTo(6.4, 11.4);
        ctx.lineTo(11.6, 11); ctx.closePath();
        ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
        ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(30,41,59,.75)'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.restore();
    }
    function drawWordLabel(x, y, word, color, fade) {
        ctx.globalAlpha = fade;
        ctx.lineWidth = 1.6; ctx.strokeStyle = color;
        ctx.beginPath(); ctx.arc(x, y, 8, 0, 6.2832); ctx.stroke();
        ctx.globalAlpha = fade * 0.9; ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 6.2832); ctx.fill();

        ctx.font = '600 14px system-ui,sans-serif';
        const tw = ctx.measureText(word).width;
        const bw = tw + 18, bh = 24, bx = x + 14, by = y - 14 - bh;
        ctx.globalAlpha = fade * 0.7; ctx.lineWidth = 1; ctx.strokeStyle = color;
        ctx.beginPath(); ctx.moveTo(x + 5, y - 5); ctx.lineTo(bx, by + bh); ctx.stroke();
        ctx.globalAlpha = fade;
        roundRect(bx, by, bw, bh, 6);
        ctx.fillStyle = 'rgba(255,255,255,.94)'; ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(word, bx + 9, by + bh / 2 + 1);
        ctx.textBaseline = 'alphabetic';
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
            bx = lerp(a.box, b.box, u);
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
            const pts = toriPoints(kNow);
            const titems = [];
            for (let i = 0; i < pts.length; i++) {
                const p = pts[i];
                const q = untangle(ut, p);
                const pr = proj(q);
                titems.push({ d: pr.d, s: pr, c: p.c });
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

            // ---------- "Jeder Punkt entspricht einem Wort" ----------
            // Auf dem komplexen + Homotopie-Schritt fährt eine simulierte
            // Maus zwei Beispielwörter an (eines pro Torus) und benennt sie.
            if (cur === IDX_COMPLEX || cur === IDX_HOMOTOPY) {
                const elapsed = now - t0;
                const fade = sub(elapsed, 250, 750);
                if (fade > 0.01) {
                    const wp = WORD_PTS.map(w => {
                        const p = w.c === 0 ? toriAPoint(w.t, w.s, w.rho, kNow)
                                            : toriBPoint(w.t, w.s, w.rho, kNow);
                        const pr = proj(untangle(ut, p));
                        return { x: pr.X, y: pr.Y, word: w.word,
                                 color: w.c === 0 ? '#15803d' : '#e11d48' };
                    });
                    ctx.globalAlpha = fade;
                    ctx.font = '600 15px system-ui,sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#334155';
                    ctx.fillText('Jeder Punkt entspricht einem Wort', W / 2 + 170, 34);
                    ctx.textAlign = 'left';
                    wp.forEach(w => drawWordLabel(w.x, w.y, w.word, w.color, fade));
                    const cp = sub(elapsed, 1600, 2700);
                    drawSimCursor(wp[0].x + (wp[1].x - wp[0].x) * cp,
                                  wp[0].y + (wp[1].y - wp[0].y) * cp);
                    ctx.globalAlpha = 1;
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
