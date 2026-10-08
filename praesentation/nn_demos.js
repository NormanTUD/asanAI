// ============================================================
// nn_demos.js – Interaktive Demos fuer die Folien
//   * NeuronIntroViz : zwei Szenen auf "Was sind Neuronale Netzwerke?"
//   * TypewriterViz: Schreibmaschinen-Effekt auf "Klassisch vs. KI"
//
// Diese Datei enthaelt NUR Code fuer die vorhandenen Folien.
// ============================================================

const rootMargin = "800px";

/* ================================================================
   TypewriterViz – Schreibmaschinen-Effekt für [data-typewriter]
   Äußere Pfeile werden blockiert, bis der Code komplett geschrieben
   ist; danach wird der nächste Klick/Pfeil wieder normal verarbeitet.
   ================================================================ */
const TypewriterViz = (() => {
    let active = false;

    function isTypewriting() { return active; }
    function setActive(v) { active = v; }

    function isOnClassicSlide() {
        const a = document.querySelector('.slide.active');
        return a && a.getAttribute('data-title') === 'Klassisch vs. KI';
    }

    // Auf Folie betreten automatisch den Schreibmaschinen-Effekt starten.
    // Wichtig: erst NACH der Folien-Transition (~850 ms) anfangen, sonst
    // tippt der Code schon während die Folie noch einfadet und der User
    // sieht nur das fertige Ergebnis.
    // Der Effekt wird AB SOFORT blockiert (setActive(true)), damit erst der
    // Code gezeigt wird und erst DANN „KI / Lernen" erscheinen darf.
    function activate() {
        // Ohne ein [data-typewriter]-Element gar nichts anstoßen — sonst
        // bliebe active=true hängen und die Typewriter-Demo würde die
        // Pfeiltasten auf dieser Folie blockieren.
        if (!document.querySelector('[data-typewriter]')) return;
        setActive(true);
        setTimeout(() => {
            const slide = document.querySelector('.slide.active');
            if (!slide || !isOnClassicSlide()) { setActive(false); return; }
            if (typeof startTypewriter === 'function') startTypewriter(slide);
        }, 850);
    }

    // Schreibmaschine stoppen (Folie verlassen).
    function stop() {
        setActive(false);
        const el = document.querySelector('[data-typewriter]');
        if (el && typeof _twStop === 'function') _twStop(el);
    }

    return { isTypewriting, setActive, isOnClassicSlide, activate, stop, nop() {} };
})();
/* ================================================================
    FlipClockViz – "Klassisch vs. KI" (Folie 2)
    Cross-Morph, gleiche Mitte: die Formel (Klassisch: die Regel,
    hier f(x)=x²) steht zentriert (volle Höhe). Auf manuelles Weiter
    (advance) MORPHED sie flüssig in den Flip-Clock: das f(...) bleibt
    stehen, nur die ZAHLEN (x) und das ERGEBNIS (o) rollen von OBEN in
    die Auslese-Zeile (Spalten, sync, nahtloser Loop, Vorwärts).
    Datengetrieben: LAYOUT (Glyphen+Spalten), FIELDS, EX (Beispiele).
    ================================================================ */
const FlipClockViz = (() => {
    // Haupt-Beispiel: f(x) = x² (erkennbar, etwas komplexer als AND).
    // Endloser Stream: x = 0..9 (o = x²) wiederholen sich nahtlos (Periode 10),
    // die Spalten steigen nach oben und werden oben per CSS-Maske ausgeblendet.
    const LAYOUT = ['f(', 'x', ')', '=', 'o'];   // f( [x] ) = [o]
    const FIELDS = ['x', 'o'];
    const EX = [];
    for (let i = 0; i < 10; i++) EX.push({ x: i, o: i * i });
    const PERIOD = EX.length;
    const STEP_S = 1.2;         // 1 Wert alle ~1,2 s (Stream fließt klar)
    const MORPH_DUR = 850;      // Cross-Morph Dauer (ab advance)

    let root = null, formula = null, odo = null, cols = [];
    let VH = 0;
    let offset = 0, lastT = 0, switchT = 0, raf = 0, running = false, inited = false;
    let switched = false, pendingSwitch = false;

    function valFor(col, p) {
        const idx = ((p % PERIOD) + PERIOD) % PERIOD;
        return EX[idx][col];
    }

    function build() {
        if (inited) return;
        inited = true;
        root = document.getElementById('flip-clock');
        formula = document.getElementById('klassik-formula');
        if (!root) return;
        root.innerHTML = '';
        const win = document.createElement('div'); win.className = 'fc-window';
        odo = document.createElement('div'); odo.className = 'fc-odo';
        root.appendChild(win);
        root.appendChild(odo);
        for (const s of LAYOUT) {
            if (FIELDS.indexOf(s) !== -1) {
                const col = document.createElement('div'); col.className = 'fc-col';
                const track = document.createElement('div'); track.className = 'fc-track';
                for (let p = 0; p < 2 * PERIOD; p++) {
                    const v = document.createElement('div'); v.className = 'fc-val';
                    v.textContent = String(valFor(s, p));
                    track.appendChild(v);
                }
                col.appendChild(track);
                odo.appendChild(col);
                cols.push(track);
            } else {
                const g = document.createElement('span'); g.className = 'fc-glyph';
                g.textContent = s;
                odo.appendChild(g);
            }
        }
        measure();
    }

    function measure() {
        if (!root) return;
        const H = root.clientHeight;
        if (H <= 0) return;
        VH = Math.max(44, Math.min(56, H * 0.12));
        const colH = Math.min(H * 0.86, 380);   // hohe Spalte → langer Stream
        cols.forEach(track => {
            track.parentElement.style.height = colH + 'px';
            const kids = track.children;
            for (let i = 0; i < kids.length; i++) kids[i].style.height = VH + 'px';
        });
    }

    function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

    function frame(t) {
        if (!running) return;
        const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
        lastT = t;
        if (pendingSwitch && !switched) { switched = true; switchT = t; pendingSwitch = false; }

        // Cross-Morph (Formel → Flip-Clock), gleiche Mitte — nur nach advance.
        let fOp = 1, fSc = 1, cOp = 0;
        if (switched) {
            const el = t - switchT;
            if (el >= MORPH_DUR) { fOp = 0; fSc = 0.9; cOp = 1; }
            else { const p = ease(el / MORPH_DUR); fOp = 1 - p; fSc = 1 - 0.10 * p; cOp = p; }
            offset = (offset + dt / STEP_S) % PERIOD;   // Werte rollen
        }
        if (formula) { formula.style.opacity = fOp.toFixed(3); formula.style.transform = 'scale(' + fSc.toFixed(3) + ')'; }
        root.style.opacity = cOp.toFixed(3);

        // Endloser Stream: Spalten steigen nach OBEN (ty negativ), oben per
        // CSS-Maske ausgeblendet. Nahtlos (Periode = PERIOD, Werte wiederholen).
        const ty = -offset * VH;
        cols.forEach(track => { track.style.transform = 'translateY(' + ty + 'px)'; });
        raf = requestAnimationFrame(frame);
    }

    function canSwitch() {
        if (switched) return false;
        const a = document.querySelector('.slide.active');
        return !!(a && a.id === 'slide-klassisch-vs-ki');
    }
    function advance() {
        if (switched) return;
        const a = document.querySelector('.slide.active');
        if (!a || a.id !== 'slide-klassisch-vs-ki') return;
        pendingSwitch = true;
    }

    function start() {
        // Erst im nächsten Frame: dann ist das Layout fixiert. Läuft nur,
        // wenn die Folie aktiv ist. Zeigt die Formel und wartet auf advance.
        requestAnimationFrame(() => {
            const a = document.querySelector('.slide.active');
            if (!a || a.id !== 'slide-klassisch-vs-ki') return;
            build();
            if (!root) return;
            if (!running) { running = true; lastT = 0; raf = requestAnimationFrame(frame); }
        });
    }
    function stop() {
        running = false;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        switched = false; pendingSwitch = false; offset = 0;
        if (formula) { formula.style.opacity = ''; formula.style.transform = ''; }
        if (root) root.style.opacity = '';
    }

    window.addEventListener('resize', () => { if (running) measure(); });

    return { start, stop, advance, canSwitch };
})();
/* ================================================================
    Neuron Intro Animation (Slide "Was sind Dense Layer?")
    Pfeilrechts zeigt die nächste Szene, Pfeillinks die vorherige.
     Szene 1: dense(x) = W·x + B      (Underbraces: Gewichte / Bias)
     Szene 2: Vektoren/Matrizen          (W und B unterlegt mit "lernbar")
   ================================================================ */
const NeuronIntroViz = (() => {
    let revealed = false;
    let cur = 0;

    function isOnIntroSlide() {
        const active = document.querySelector('.slide.active');
        if (!active || active.id !== 'slide-dense-layer') return false;
        // Nur Szene A (NeuronIntro) — in Szene B (SpaceMorph, .in-b) bleibt die
        // Sub-Animation (nn-intro-anim) aus, sonst frisst sie prev/next.
        const w = document.getElementById('dl-scene-wrap');
        return !(w && w.classList.contains('in-b'));
    }

    function getScenes() {
        const el = document.getElementById('nn-intro-anim');
        return el ? Array.from(el.querySelectorAll('.nn-anim-scene')) : [];
    }

    function _apply(idx) {
        getScenes().forEach((s, k) => s.classList.toggle('on', k === idx));
    }

    function start() {
        revealed = true;
        cur = 0;
        _apply(0);
    }

    function hideFragment() { revealed = false; }

    function canGoNext() {
        if (!revealed) return false;
        return cur < getScenes().length - 1;
    }

    function next() {
        if (!canGoNext()) return;
        cur++;
        _apply(cur);
    }

    function canGoPrev() {
        if (!revealed) return false;
        return cur > 0;
    }

    function prev() {
        if (!canGoPrev()) return;
        cur--;
        _apply(cur);
    }

    function reset() {
        revealed = false;
        cur = 0;
        _apply(0);
    }

    // Zustand merken/wiederherstellen (presentation.js slideMemory).
    // Wichtig: 'revealed' und 'cur' müssen beide zurückkommen, sonst landet
    // man beim Rückwärts-Navigieren auf Szene 0 statt auf der, die man
    // verlassen hat.
    function getState() { return { revealed, cur }; }
    function setState(st) {
        if (!st) return;
        revealed = !!st.revealed;
        cur = Math.min(Math.max(st.cur | 0, 0), Math.max(getScenes().length - 1, 0));
        _apply(cur);
    }

    return { start, hideFragment, canGoNext, next, canGoPrev, prev, reset, isOnIntroSlide, getState, setState };
})();
