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
    FlipClockViz – "Klassisch vs. KI" (Folie)
    Beispielauswertungen f(a,b)=o fließen wie ein alter Zahlen-
    blende durch die fixierte Funktion f. Das aktuelle Beispiel
    steht immer in der Mitte (unter dem Zeiger), die anderen
    rotieren links durch. Durchgängig flüssig (rAF), nahtloser
    Loop (Musterlänge 4 → Periode 4·spacing).
    ================================================================ */
const FlipClockViz = (() => {
    // Richtiges UND-Tableau (formal korrekt).
    const EX = [
        { a: 0, b: 0, o: 0 },
        { a: 0, b: 1, o: 0 },
        { a: 1, b: 0, o: 0 },
        { a: 1, b: 1, o: 1 }
    ];
    const PERIOD = 4;
    let root = null, win = null, track = null, tiles = [];
    let TW = 0, spacing = 0, rootW = 0, speed = 0;
    let offset = 0, lastT = 0, raf = 0, running = false, inited = false;

    function tex(i) {
        const e = EX[((i % PERIOD) + PERIOD) % PERIOD];
        return 'f(' + e.a + ',' + e.b + ')=' + e.o;
    }

    function build() {
        if (inited) return;
        inited = true;
        root = document.getElementById('flip-clock');
        if (!root) return;
        win = document.createElement('div');
        win.className = 'fc-window';
        const f = document.createElement('div'); f.className = 'fc-f'; f.textContent = 'f';
        const ptr = document.createElement('div'); ptr.className = 'fc-pointer';
        win.appendChild(f); win.appendChild(ptr);
        track = document.createElement('div');
        track.className = 'fc-track';
        root.appendChild(win);
        root.appendChild(track);
        const hasTemml = typeof temml !== 'undefined';
        for (let i = 0; i < 22; i++) {
            const t = document.createElement('div');
            t.className = 'fc-tile';
            if (hasTemml) t.innerHTML = temml.renderToString(tex(i), { displayMode: false });
            else t.textContent = tex(i);
            track.appendChild(t);
        }
        tiles = Array.from(track.children);
        measure();
    }

    function measure() {
        if (!root) return;
        rootW = root.clientWidth;
        TW = Math.max(150, Math.min(210, rootW * 0.155));
        spacing = TW + 24;
        speed = spacing / 3.4;
        const winW = TW + 34;
        win.style.left = (rootW / 2 - winW / 2) + 'px';
        win.style.width = winW + 'px';
        for (let i = 0; i < tiles.length; i++) {
            tiles[i].style.width = TW + 'px';
            tiles[i].style.left = (i * spacing - TW / 2) + 'px';
        }
    }

    function frame(t) {
        if (!running) return;
        const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
        lastT = t;
        offset = (offset + speed * dt) % (PERIOD * spacing);
        track.style.transform = 'translateX(' + (-offset) + 'px)';
        const cx = rootW / 2;
        const reach = spacing * 1.7;
        for (let i = 0; i < tiles.length; i++) {
            const tileCX = i * spacing - offset;
            let p = 1 - Math.abs(tileCX - cx) / reach;
            if (p < 0) p = 0; else if (p > 1) p = 1;
            const pe = Math.pow(p, 1.7);
            tiles[i].style.opacity = (0.16 + 0.84 * pe).toFixed(3);
            tiles[i].style.transform = 'translateY(-50%) scale(' + (0.80 + 0.20 * pe).toFixed(3) + ')';
        }
        raf = requestAnimationFrame(frame);
    }

    function start() {
        // Erst im nächsten Frame bauen: dann ist das Layout (clientWidth)
        // der gerade aktivierten Folie fixiert. Läuft nur, wenn die Folie
        // tatsächlich aktiv ist (sonst würde der Loop im Verborgenen laufen).
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
