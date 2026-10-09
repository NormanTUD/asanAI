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
    (T37) Persistentes Skelett f( [x] ) = [o] in EINE Schrift: die
    Glyphen f( / ) / = sind in beiden Modi dieselben DOM-Knoten und
    bleiben damit exakt gleich — ausgetauscht werden nur die
    Slot-Inhalte. Modus 1 (Formel): die Slots zeigen statisch x und
    x². Auf manuelles Weiter (advance) faden die statischen Werte aus
    und ein endloser Zahlen-Stream (Werte rollen von OBEN durch die
    Auslese-Zeile, oben per CSS-Maske geblendet) + die Fenster-Box
    faden ein. Nahtloser Loop (Periode 10, x = 0..9, o = x²).
    ================================================================ */
const FlipClockViz = (() => {
    const EX = [];
    for (let i = 0; i < 10; i++) EX.push({ x: i, o: i * i });
    const PERIOD = EX.length;
    const STEP_S = 1.2;         // 1 Wert alle ~1,2 s (Stream fließt klar)
    const MORPH_DUR = 850;      // Cross-Morph Dauer (ab advance)

    let odo = null, win = null, tracks = [], statics = [];
    let VH = 56, COLH = 340;
    let offset = 0, lastT = 0, switchT = 0, raf = 0, running = false, inited = false;
    let switched = false, pendingSwitch = false;
    let unswitching = false, unswitchT = 0;

    function build() {
        if (inited) return;
        inited = true;
        odo = document.getElementById('ko-odo');
        win = document.getElementById('ko-window');
        if (!odo) return;
        const tx = odo.querySelector('#ko-track-x');
        const to = odo.querySelector('#ko-track-o');
        [[tx, 'x'], [to, 'o']].forEach(pair => {
            const tr = pair[0], field = pair[1];
            for (let p = 0; p < 2 * PERIOD; p++) {
                const v = document.createElement('div'); v.className = 'ko-val';
                v.textContent = String(EX[p % PERIOD][field]);
                tr.appendChild(v);
            }
        });
        tracks = [tx, to];
        statics = Array.prototype.slice.call(odo.querySelectorAll('.ko-static'));
        measure();
    }

    function measure() {
        const stage = document.getElementById('klassik-stage');
        if (!stage || !odo) return;
        const H = stage.clientHeight;
        if (H <= 0) return;
        VH = Math.max(44, Math.min(56, H * 0.12));
        COLH = Math.min(H * 0.86, 380);   // hohe Spalte → langer Stream
        const slots = odo.querySelectorAll('.ko-slot');
        for (const s of slots) s.style.height = COLH + 'px';
        tracks.forEach(track => {
            const kids = track.children;
            for (let i = 0; i < kids.length; i++) kids[i].style.height = VH + 'px';
        });
    }

    function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

    // Bei offset=0 sitzt Wert 0 exakt in der Spalten-Mitte — dieselbe
    // Position wie der statische Wert → der Wechsel ist ein In-Place-Swap.
    function tyNow() { return COLH / 2 - VH / 2 - offset * VH; }

    function frame(t) {
        if (!running) return;
        const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
        lastT = t;
        if (pendingSwitch && !switched && !unswitching) { switched = true; switchT = t; pendingSwitch = false; }

        let sOp = 1, cOp = 0, wOp = 0;
        if (unswitching) {
            const el = t - unswitchT;
            const p = el >= MORPH_DUR ? 1 : ease(el / MORPH_DUR);
            sOp = p; cOp = 1 - p; wOp = 1 - p;
            if (p >= 1) { unswitching = false; offset = 0; }
        } else if (switched) {
            const el = t - switchT;
            const p = el >= MORPH_DUR ? 1 : ease(el / MORPH_DUR);
            sOp = 1 - p; cOp = p; wOp = p;
            offset = (offset + dt / STEP_S) % PERIOD;
        }
        statics.forEach(s => { s.style.opacity = sOp.toFixed(3); });
        const ty = tyNow();
        tracks.forEach(track => {
            track.parentElement.style.opacity = cOp.toFixed(3);
            track.style.transform = 'translateY(' + ty + 'px)';
        });
        if (win) win.style.opacity = wOp.toFixed(3);
        raf = requestAnimationFrame(frame);
    }

    function canSwitch() {
        if (switched || unswitching) return false;
        const a = document.querySelector('.slide.active');
        return !!(a && a.id === 'slide-klassisch-vs-ki');
    }
    function advance() {
        if (switched || unswitching) return;
        const a = document.querySelector('.slide.active');
        if (!a || a.id !== 'slide-klassisch-vs-ki') return;
        pendingSwitch = true;
    }
    function canGoPrev() {
        if (!switched || unswitching) return false;
        const a = document.querySelector('.slide.active');
        if (!a || a.id !== 'slide-klassisch-vs-ki') return false;
        const frags = a.querySelectorAll('.fragment.visible');
        return frags.length === 0;
    }
    function prev() {
        if (!switched || unswitching) return;
        const a = document.querySelector('.slide.active');
        if (!a || a.id !== 'slide-klassisch-vs-ki') return;
        unswitching = true;
        unswitchT = performance.now();
        switched = false;
    }

    function start() {
        // Erst im nächsten Frame: dann ist das Layout fixiert. Läuft nur,
        // wenn die Folie aktiv ist. Zeigt das Skelett (Modus 1) und
        // wartet auf advance().
        requestAnimationFrame(() => {
            const a = document.querySelector('.slide.active');
            if (!a || a.id !== 'slide-klassisch-vs-ki') return;
            build();
            if (!odo) return;
            if (!running) { running = true; lastT = 0; raf = requestAnimationFrame(frame); }
        });
    }
    function stop() {
        running = false;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        switched = false; pendingSwitch = false; unswitching = false; offset = 0;
        statics.forEach(s => { s.style.opacity = ''; });
        tracks.forEach(track => { track.parentElement.style.opacity = ''; track.style.transform = ''; });
        if (win) win.style.opacity = '';
    }

    window.addEventListener('resize', () => { if (inited) measure(); });

    return { start, stop, advance, canSwitch, canGoPrev, prev };
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
