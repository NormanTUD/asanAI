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
    Cross-Morph, gleiche Mitte: die Formel f(a,b)={cases} steht
    zentriert (volle Höhe) und MORPHED nach ~1,2 s flüssig in den
    vertikalen Flip-Clock. Die Beispielauswertungen f(a,b)=o rollen
    VON OBEN durch die mittlere Auslese-Zeile; das aktuelle Beispiel
    steht immer am Zeiger, die anderen rollen hindurch. Nahtloser
    Loop (rAF, Periode 4·spacing), Vorwärtsreihenfolge 0,1,2,3.
    ================================================================ */
const FlipClockViz = (() => {
    const EX = [
        { a: 0, b: 0, o: 0 },
        { a: 0, b: 1, o: 0 },
        { a: 1, b: 0, o: 0 },
        { a: 1, b: 1, o: 1 }
    ];
    const PERIOD = 4;
    const NTILE = 16;
    const MORPH_DELAY = 1200;
    const MORPH_DUR = 900;

    let root = null, formula = null, win = null, track = null, tiles = [];
    let H = 0, spacing = 0, wrap = 0, speed = 0;
    let offset = 0, enterT = 0, lastT = 0, raf = 0, running = false, inited = false;

    function exIndex(j) { return (((-j) % PERIOD) + PERIOD) % PERIOD; }
    function tex(j) {
        const e = EX[exIndex(j)];
        return 'f(' + e.a + ',' + e.b + ')=' + e.o;
    }

    function build() {
        if (inited) return;
        inited = true;
        root = document.getElementById('flip-clock');
        formula = document.getElementById('klassik-formula');
        if (!root) return;
        win = document.createElement('div');
        win.className = 'fc-window';
        const ptr = document.createElement('div'); ptr.className = 'fc-pointer';
        win.appendChild(ptr);
        track = document.createElement('div');
        track.className = 'fc-track';
        root.appendChild(win);
        root.appendChild(track);
        const hasTemml = typeof temml !== 'undefined';
        for (let j = 0; j < NTILE; j++) {
            const t = document.createElement('div');
            t.className = 'fc-tile';
            if (hasTemml) t.innerHTML = temml.renderToString(tex(j), { displayMode: false });
            else t.textContent = tex(j);
            track.appendChild(t);
        }
        tiles = Array.from(track.children);
        measure();
    }

    function measure() {
        if (!root) return;
        H = root.clientHeight;
        if (H <= 0) return;
        spacing = Math.max(44, Math.min(58, H / 8.5));
        wrap = PERIOD * spacing;
        speed = spacing / 3.0;
        for (let j = 0; j < tiles.length; j++) {
            tiles[j].style.top = (j * spacing) + 'px';
        }
    }

    function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

    function frame(t) {
        if (!running) return;
        const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
        lastT = t;
        offset = (offset + speed * dt) % wrap;

        // Cross-Morph: Formel (1) → Flip-Clock (0).
        const el = t - enterT;
        let fOp = 1, fSc = 1, cOp = 0;
        if (el >= MORPH_DELAY + MORPH_DUR) { fOp = 0; fSc = 0.9; cOp = 1; }
        else if (el >= MORPH_DELAY) {
            const p = ease((el - MORPH_DELAY) / MORPH_DUR);
            fOp = 1 - p; fSc = 1 - 0.10 * p; cOp = p;
        }
        if (formula) { formula.style.opacity = fOp.toFixed(3); formula.style.transform = 'scale(' + fSc.toFixed(3) + ')'; }
        root.style.opacity = cOp.toFixed(3);

        // Vertikales Scrollen: Track nach unten → Beispiele von oben rein.
        track.style.transform = 'translateY(' + (offset - wrap) + 'px)';
        const cy = H / 2;
        const reach = spacing * 2.4;
        for (let j = 0; j < tiles.length; j++) {
            const pos = j * spacing + offset - wrap;
            let p = 1 - Math.abs(pos - cy) / reach;
            if (p < 0) p = 0; else if (p > 1) p = 1;
            const pe = Math.pow(p, 1.6);
            tiles[j].style.opacity = (0.12 + 0.88 * pe).toFixed(3);
            tiles[j].style.transform = 'scale(' + (0.82 + 0.18 * pe).toFixed(3) + ')';
        }
        raf = requestAnimationFrame(frame);
    }

    function start() {
        // Erst im nächsten Frame: dann ist das Layout (clientHeight) der
        // aktivierten Folie fixiert. Läuft nur, wenn die Folie aktiv ist.
        requestAnimationFrame((t) => {
            const a = document.querySelector('.slide.active');
            if (!a || a.id !== 'slide-klassisch-vs-ki') return;
            build();
            if (!root) return;
            offset = 0; enterT = t; lastT = 0;
            if (!running) { running = true; raf = requestAnimationFrame(frame); }
        });
    }
    function stop() {
        running = false;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        // Zurücksetzen, damit beim nächsten Betreten die Formel wieder zuerst kommt.
        if (formula) { formula.style.opacity = ''; formula.style.transform = ''; }
        if (root) { root.style.opacity = ''; track.style.transform = ''; }
    }

    window.addEventListener('resize', () => { if (running) measure(); });

    return { start, stop };
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
        return active && active.getAttribute('data-title') === 'Was sind Dense Layer?';
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
