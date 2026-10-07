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
    // Wichtig: erst NACH der Folien-Transition (~850 ms) anfangen — sonst
    // tippt der Code schon während die Folie noch einfadet und der User
    // sieht nur das fertige Ergebnis.
    // Der Effekt wird AB SOFORT blockiert (setActive(true)), damit erst der
    // Code gezeigt wird und erst DANN „KI / Lernen" erscheinen darf.
    function activate() {
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
