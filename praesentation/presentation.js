// ============================================================
// PRESENTATION ENGINE – Fully Refactored
// ============================================================

// ────────────────────────────────────────────────────────────
// DEMO REGISTRY (deklarativ, keine Duplikation)
// ────────────────────────────────────────────────────────────
const DemoRegistry = (() => {
    /**
     * Jeder Eintrag beschreibt eine Demo mit:
     *   ref:        () => Referenz auf das globale Objekt (oder null)
     *   guard:      (d) => zusätzliche Vorbedingung (default: true)
     *   nextMethod: string – Methodenname für "vorwärts" (default: 'next')
     *   prevMethod: string – Methodenname für "rückwärts" (default: 'prev')
     *   canNext:    string – Methodenname für "kann vorwärts?" (default: 'canGoNext')
     *   canPrev:    string – Methodenname für "kann rückwärts?" (default: 'canGoPrev')
     *   slideTest:  (slide) => true wenn diese Demo auf dem Slide aktiv sein soll
     *   onEnter:    (d) => wird aufgerufen wenn Slide betreten wird
     *   onLeave:    (d) => wird aufgerufen wenn Slide verlassen wird
     */
    const DEFAULTS = {
        guard: () => true,
        nextMethod: 'next',
        prevMethod: 'prev',
        canNext: 'canGoNext',
        canPrev: 'canGoPrev',
    };

        const registry = [
                // NNStepDemo lebt auf der Stückelungs-Folie — dort erst
                // resetten (sonst re-rendert der Approx-Plot bei jedem
                // Folienwechsel mit).
                { ref: () => typeof NNStepDemo !== 'undefined' ? NNStepDemo : null,
                        slideTest: s => s && s.id === 'slide-stueckelung',
                        onLeave: d => d.reset() },

                { ref: () => typeof SpaceMorph !== 'undefined' ? SpaceMorph : null,
                        block: d => d.isAnimating(),
                        slideTest: s => s.id === 'slide-layer-als-raumkruemmung',
                        onEnter: d => setTimeout(() => d.init(), 80),
                        onLeave: d => d.reset() },

                // "Was sind Convolutions?" (convolution.js) — das 3x3-Fenster
                // wandert per Pfeiltasten ueber das Eingabebild.
                { ref: () => typeof ConvDemo !== 'undefined' ? ConvDemo : null,
                        slideTest: s => s.id === 'slide-convolution',
                        onEnter: d => setTimeout(() => d.init(), 80),
                        onLeave: d => d.reset() },

                // "Was macht Flatten?" (flatten.js) — die Zahlen wandern
                // einzeln aus den Feature Maps in den Vektor.
                { ref: () => typeof FlattenDemo !== 'undefined' ? FlattenDemo : null,
                        slideTest: s => s.id === 'slide-flatten',
                        onEnter: d => setTimeout(() => d.init(), 80),
                        onLeave: d => d.reset() },

                // "Vom Foto zum Stoppschild" (hierarchy.js) — echte Convolution
                // auf stop_sign.jpg: Filterpaar -> Kanten -> Ecken -> extrahiert
                // -> vereinfacht.
                { ref: () => typeof HierarchyDemo !== 'undefined' ? HierarchyDemo : null,
                        slideTest: s => s.id === 'slide-hierarchie',
                        onEnter: d => setTimeout(() => d.init(), 80),
                        onLeave: d => d.reset() },

                // "Der Loss" (loss.js) — eine Zahl fuer "wie falsch"; Pfeiltasten
                // wechseln die Ausgabe des Katze-Hund-Detektors.
                { ref: () => typeof LossDemo !== 'undefined' ? LossDemo : null,
                        slideTest: s => s.id === 'slide-loss',
                        onEnter: d => setTimeout(() => d.init(), 80),
                        onLeave: d => d.reset() },

                { ref: () => typeof NeuronIntroViz !== 'undefined' ? NeuronIntroViz : null,
                        guard: d => d.isOnIntroSlide(),
                        slideTest: s => s.getAttribute('data-title') === 'Neuronales Netz Intro',
                        onEnter: d => d.reset() },

                { ref: () => typeof TypewriterViz !== 'undefined' ? TypewriterViz : null,
                        guard: d => d.isOnClassicSlide(),
                        slideTest: s => s.getAttribute('data-title') === 'Klassisch vs. KI',
                        canNext: 'isTypewriting',
                        nextMethod: 'nop',
                        onEnter: d => d.activate(),
                        onLeave: d => d.stop() },

        ];

    // Normalisiere: Defaults einsetzen
    const demos = registry.map(entry => ({ ...DEFAULTS, ...entry }));

    /**
     * Versuche Navigation in einer Richtung.
     * Rückgabe:
     *   true  = konsumiert (Demo hat reagiert)
     *   'block' = blockiert (Demo will NICHT zur nächsten Folie durchreichen)
     *   false = nicht behandelt → Fallthrough auf Presentation.next/prev
     */
    function tryNavigate(direction, currentSlideEl) {
        const canKey = direction === 'next' ? 'canNext' : 'canPrev';
        const methodKey = direction === 'next' ? 'nextMethod' : 'prevMethod';

        for (const demo of demos) {
            const instance = demo.ref();
            if (!instance) continue;

            // Nur Demos betrachten, die per slideTest auf der aktuellen Folie sind.
            // Damit verhindern wir, dass eine blockierende Demo auf einer anderen
            // Folie die Pfeiltaste frisst.
            const onThisSlide = !demo.slideTest || (currentSlideEl && demo.slideTest(currentSlideEl));
            if (!onThisSlide) continue;

            // Wenn diese Demo explizit blocken will (mid-Animation), signalisiere
            // 'block' — navigate() fällt dann NICHT auf Presentation.next/prev zurück.
            if (typeof demo.block === 'function' && demo.block(instance)) {
                return 'block';
            }

            if (!demo.guard(instance)) continue;
            if (typeof instance[demo[canKey]] === 'function' && instance[demo[canKey]]()) {
                instance[demo[methodKey]]();
                return true;
            }
        }
        return false;
    }

    /**
     * Lifecycle: Slide-Wechsel oldSlide → newSlide.
     *
     * Demos mit slideTest reagieren NUR, wenn die Transition ihre Folie
     * betrifft (Eintritt oder Austritt). Sonst würde jeder Folienwechsel
     * alle anderen Demos resetten — inkl. schwerer Plotly-Re-Render (z.B.
     * 370 ms bei den Dual-Manifolds) — und den Wechsel verlangsamen.
     *
     * Demos ohne slideTest (global) behalten das Legacy-Verhalten:
     * onLeave bei jedem Wechsel.
     *
     * deferMs: onLeave erst N ms verzögert ausführen (nach dem
     * Crossfade-Lock) — für teure Resets, die den Wechsel nicht
     * verlangsamen dürfen. leaveGuard: darf den (verzögerten) Leave
     * bei Bedarf absagen, z.B. wenn die Folie inzwischen wieder aktiv
     * ist (dann wird der Reset beim nächsten Verlassen neu geplant).
     */
    function notifyEnter(oldSlide, newSlide) {
        for (const demo of demos) {
            const instance = demo.ref();
            if (!instance) continue;

            let fire;
            if (demo.slideTest) {
                if (demo.slideTest(newSlide)) {
                    fire = 'enter';
                } else if (oldSlide && demo.slideTest(oldSlide)) {
                    fire = 'leave';
                } else {
                    continue; // Transition auf fremden Folien: ignorieren
                }
            } else {
                fire = 'leave';
            }

            if (fire === 'enter') {
                if (demo.onEnter) demo.onEnter(instance);
            } else if (demo.onLeave) {
                if (demo.deferMs) {
                    setTimeout(() => {
                        if (demo.leaveGuard && !demo.leaveGuard(instance)) return;
                        demo.onLeave(instance);
                    }, demo.deferMs);
                } else {
                    demo.onLeave(instance);
                }
            }
        }
    }

    return { tryNavigate, notifyEnter };
})();

// ────────────────────────────────────────────────────────────
// FRAGMENT ACTION MAP (statt if/if/if-Ketten)
// ────────────────────────────────────────────────────────────
const FragmentActions = {

	// "Code-reingetippt"-Effekt: Fragment zeigt beim Einblenden den Code
	// in einem [data-typewriter]-Element, Buchstabe für Buchstabe (schnell).
	'typewriter': {
	    forward: (frag) => startTypewriter(frag),
	    backward: (frag) => resetTypewriter(frag),
	},

	// "Was sind Neuronale Netzwerke?" – 2 Szenen manuell (Pfeiltaste weiter/rückwärts)
	'neuron-intro-anim': {
	    forward: () => { if (typeof NeuronIntroViz !== 'undefined') NeuronIntroViz.start(); },
	    backward: () => { if (typeof NeuronIntroViz !== 'undefined') NeuronIntroViz.hideFragment(); },
	},

};

// ────────────────────────────────────────────────────────────
// TYPEWRITER – Code "wird getippt" (Buchstabe für Buchstabe)
// Vorbereitung: beim Booten wird der vollständige HTML-Inhalt eines
// [data-typewriter]-Elements gesichert und der Inhalt geleert, damit
// beim Einblenden kein kurzer Flacker-Effekt entsteht.
// ────────────────────────────────────────────────────────────
const _twTimers = {};

function _twEscape(s) {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Zerlegt den gespeicherten HTML-Quelltext in [Tag, Text, Tag, …]-Stücke.
function _twParts(el) {
    if (el._twParts) return el._twParts;
    const html = el.dataset.typeHtml;
    el._twParts = (html || '').split(/(<[^>]*>)/).filter(p => p !== '');
    return el._twParts;
}

function _twTotal(parts) {
    let t = 0;
    for (const p of parts) if (p[0] !== '<') t += p.length;
    return t;
}

// HTML-Präfix, der die ersten n Zeichen repräsentiert (Tags bleiben intakt).
function _twPrefix(parts, n) {
    let out = '';
    let acc = 0;
    for (const p of parts) {
        if (acc >= n) break;
        if (p[0] === '<') { out += p; continue; }
        const need = n - acc;
        if (p.length <= need) { out += _twEscape(p); acc += p.length; }
        else { out += _twEscape(p.slice(0, need)); acc = n; }
    }
    return out;
}

function startTypewriter(frag) {
    const el = frag.querySelector('[data-typewriter]');
    if (!el) return;
    const parts = _twParts(el);
    const total = _twTotal(parts);
    const speed = parseInt(el.getAttribute('data-type-speed') || '6', 10);
    _twStop(el);
    let n = 0;
    el.innerHTML = '<span class="type-caret">▍</span>';
    if (typeof TypewriterViz !== 'undefined') TypewriterViz.setActive(true);
    el._twTimer = setInterval(() => {
        n++;
        el.innerHTML = _twPrefix(parts, n) + '<span class="type-caret">▍</span>';
        if (n >= total) {
            el.innerHTML = el.dataset.typeHtml;
            _twStop(el);
        }
    }, speed);
}

function resetTypewriter(frag) {
    const el = frag.querySelector('[data-typewriter]');
    if (!el) return;
    _twStop(el);
    if (el.dataset.typeHtml !== undefined) el.innerHTML = '';
}

function _twStop(el) {
    if (el._twTimer) {
        clearInterval(el._twTimer);
        el._twTimer = null;
        if (typeof TypewriterViz !== 'undefined') TypewriterViz.setActive(false);
    }
}

// Boot: vollständigen Inhalt sichern und leeren (kein Flackern beim Einblenden).
// Der Block bekommt sofort seine finale Höhe (gemessen am vollen Inhalt),
// damit er beim Tippen nicht nachwächst.
function initTypewriters() {
    document.querySelectorAll('[data-typewriter]').forEach(el => {
        if (el.dataset.typeHtml === undefined) el.dataset.typeHtml = el.innerHTML;
        const fullHeight = el.offsetHeight;
        if (fullHeight > 0) el.style.minHeight = fullHeight + 'px';
        el.innerHTML = '';
    });
}

// ────────────────────────────────────────────────────────────
// PRESENTATION CORE
// ────────────────────────────────────────────────────────────
const Presentation = (() => {
    let currentSlide = 0;
    let slides = [];
    let fragmentIndex = {};
    let searchQuery = '';
    let fastMode = false;        // ?fast=1 → einfache Fragmente direkt anzeigen
let shortMode = false;       // ?short=1 → optionale Inhalte entfernt

    // ────────────────────────────────────────────────────────────
    // SLIDE-AUSWAHL via URL:  ?slides=0,1,2,3,10-16,17,19-30
    // 0-basierte Indexe der Ursprungsfolge, Bereiche inkl. der Enden.
    // Ohne Parameter (oder leer) → alle Folien.
    // ────────────────────────────────────────────────────────────
    function parseSlideSelection(total) {
        const raw = new URLSearchParams(window.location.search).get('slides');
        if (!raw) return null;
        const all = Array.from(document.querySelectorAll('.slide'));
        const selected = new Set();
        raw.split(',').forEach(part => {
            part = part.trim();
            if (!part) return;
            const rangeMatch = part.match(/^(\d+)-(\d+)$/);
            if (rangeMatch) {
                const a = parseInt(rangeMatch[1], 10);
                const b = parseInt(rangeMatch[2], 10);
                const [lo, hi] = a <= b ? [a, b] : [b, a];
                for (let i = lo; i <= hi; i++) {
                    if (i >= 0 && i < total) selected.add(i);
                }
                return;
            }
            const num = parseInt(part, 10);
            if (!isNaN(num)) {
                if (num >= 0 && num < total) selected.add(num);
                return;
            }
            // Slide-ID (z. B. slide-attention-matrix) → zu ihrem Index auflösen.
            const idx = all.findIndex(s => s.id === part);
            if (idx !== -1) selected.add(idx);
        });
        return selected;
    }

    function init() {
        const allSlides = Array.from(document.querySelectorAll('.slide'));
        const selection = parseSlideSelection(allSlides.length);
        slides = selection ? allSlides.filter((_, i) => selection.has(i)) : allSlides;
        if (slides.length === 0) {
            console.warn('slides= hat keine Folie ausgewaehlt – zeige alle Folien.');
            slides = allSlides;
        }

// ?fast=1: Stückelungs-Demo ohne Wellenform (nur Sinus-Schritte).
        // ?short=1: optionale Inhalte entfernt (data-short), siehe DOMContentLoaded.
        fastMode = new URLSearchParams(window.location.search).get('fast') === '1';
        shortMode = new URLSearchParams(window.location.search).get('short') === '1';

        slides.forEach((_, i) => { fragmentIndex[i] = 0; });

        // Startfolie: ?start=N (1-basiert, wie im Zähler / wie #N) → die N-te Folie,
        // geclampt auf [1..Anzahl].
        const startParam = new URLSearchParams(window.location.search).get('start');
        if (startParam !== null && startParam.trim() !== '' && !isNaN(parseInt(startParam, 10))) {
            const pos = parseInt(startParam, 10);
            currentSlide = Math.max(0, Math.min(pos - 1, slides.length - 1));
        }

        // Nur die Startfolie aktivieren (Folie 0 hat "active" hartkodiert).
        allSlides.forEach(s => s.classList.remove('active'));
        if (slides.length) slides[currentSlide].classList.add('active');

        // ?fast=1: einfache Fragmente direkt anzeigen
        if (fastMode) revealFastFragments(currentSlide);

        // Sicherstellen, dass benachrichtigt wird (auch bei direktem ?start=/ ?slide),
        // damit Demos (z. B. SpaceMorph) korrekt initialisiert werden.
        try {
            if (typeof DemoRegistry !== 'undefined') {
                DemoRegistry.notifyEnter(null, slides[currentSlide]);
            }
        } catch (e) {}
        try {
            triggerSlideInit(currentSlide);
        } catch (e) {}

        // Klassisch-vs-KI-Startfolie: Schreibmaschinen-Effekt sofort starten.
        if (typeof TypewriterViz !== 'undefined' && TypewriterViz.isOnClassicSlide()) {
            TypewriterViz.activate();
        }

        updateUI();
        buildOverview();
    }

    function getFragments(slideIdx) {
        if (!slides[slideIdx]) return [];
        return Array.from(slides[slideIdx].querySelectorAll('.fragment'));
    }

    function executeFragmentAction(frag, direction) {
        const action = frag.getAttribute('data-fragment-action');
        if (action && FragmentActions[action]) {
            FragmentActions[action][direction](frag);
        }
    }

// „Einfachste" Fragmente = statischer Inhalt ohne Aktionen/Demos
// (weder data-fragment-action, noch demo-box). Verschachtelte
// Fragmente (z.B. die LLM-Schritte in „Die autoregressive Schleife")
// bleiben Schritt für Schritt – so auch komplexe Demos.
function isSimpleFragment(frag) {
    if (frag.getAttribute('data-fragment-action')) return false;
    if (frag.classList.contains('demo-box')) return false;
    if (frag.querySelector('.demo-box')) return false;
    return true;
}

// Nur TOP-LEVEL-Fragmente: kein Elternteil ist selbst ein Fragment.
function isTopLevelFragment(frag) {
    if (!frag.parentElement) return true;
    return !frag.parentElement.closest('.fragment');
}

function isFastRevealable(frag) {
    // data-fast-reveal="1" erzwingt Anzeige in ?fast=1 (auch für demo-box).
    if (frag.getAttribute('data-fast-reveal') === '1') return true;
    // data-nofast: bleibt auch in ?fast=1 schrittweise (Lehr-Schritte).
    if (frag.hasAttribute('data-nofast')) return false;
    return isSimpleFragment(frag) && isTopLevelFragment(frag);
}

// ?fast=1: alle einfachen Top-Level-Fragmente direkt anzeigen.
// fragmentIndex bleibt bei 0 – next() überspringt die bereits
// sichtbaren und zeigt nur noch die verschachtelten/Demo-Schritte
// einzeln an; prev() faltet in umgekehrter Reihenfolge zusammen.
function revealFastFragments(idx) {
    const fragments = getFragments(idx);
    fragments.forEach(f => f.classList.remove('visible'));
    fragments.forEach(f => { if (isFastRevealable(f)) f.classList.add('visible'); });
    fragmentIndex[idx] = 0;
}

function next() {
    const fragments = getFragments(currentSlide);
    let i = fragmentIndex[currentSlide];
    while (i < fragments.length && fragments[i].classList.contains('visible')) i++;
    if (i < fragments.length) {
        const frag = fragments[i];
        frag.classList.add('visible');
        executeFragmentAction(frag, 'forward');
        fragmentIndex[currentSlide] = i + 1;
        return;
    }
    goTo((currentSlide + 1) % slides.length);
}

function prev() {
    const fragments = getFragments(currentSlide);
    let i = fragmentIndex[currentSlide] - 1;
    while (i >= 0 && !fragments[i].classList.contains('visible')) i--;
    if (i >= 0) {
        fragments[i].classList.remove('visible');
        executeFragmentAction(fragments[i], 'backward');
        fragmentIndex[currentSlide] = i;
        return;
    }
    if (currentSlide > 0) {
        goTo(currentSlide - 1, true);
    } else {
        // Loop: von der ersten Folie zurück zur letzten
        goTo(slides.length - 1, true);
    }
}

    // Lock für den gesamten Crossfade (WAAPI: ~0.48s). Solange der
    // Lock hält, werden Pfeiltasten in navigate() geblockt — die neue Folie
    // muss erst sichtbar sein, bevor der nächste Klick zählt. Auch dasselbe
    // gilt für Sub-Folien-Übergänge (siehe DemoRegistry-Einträge, die auf
    // isSlideTransitioning blocken können).
    //
    // Wir speichern den Endzeitpunkt statt eines setTimeout-Tokens: Plotly
    // räumt beim Re-Render mit clearTimeout() alle Timer auf, was einen
    // setTimeout-basierten Lock sofort killt. Ein Timestamp-basiertes Lock
    // ist immun dagegen.
    const SLIDE_TRANSITION_MS = 520;
    const SLIDE_DUR = 440;
    const SLIDE_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
    const SLIDE_DIST = 60;
    let slideTransitionUntil = 0;
    function lockSlideTransition() {
        slideTransitionUntil = Date.now() + SLIDE_TRANSITION_MS;
    }
    function isSlideTransitioning() { return Date.now() < slideTransitionUntil; }
    function cancelSlideTransition() { slideTransitionUntil = 0; }

    // Crossfade über die Web Animations API (statt CSS-Transition +
    // getComputedStyle-Flush). Warum:
    //  - WAAPI garantiert, dass die Animation läuft. Der alte Flush-Trick
    //    ("opacity 0 setzen → reflow → opacity freigeben") kann die
    //    CSS-Transition bei einem beladenen Main-Thread verschlucken, weil
    //    Start- und Endzustand im selben Style-Batch coalescen → neue Folie
    //    bleibt bei opacity 0 → weißer Bildschirm. Genau der "manchmal"-Bug.
    //  - Die eingehende Folie trägt SOFORT .active (CSS opacity:1). Schlägt
    //    die Animation fehl oder wird sie unterbrochen, fällt sie auf den
    //    CSS-Wert (sichtbar) zurück — weißer Bildschirm ist strukturell
    //    ausgeschlossen.
    //  - Schnelle Navigation re-targetiert vom aktuellen Zustand; alte
    //    Animationen werden pro Folie gecancelt, daher kein Pop/Stacking.
    function _cancelSlideAnim(el) {
        if (el._slideAnim) { try { el._slideAnim.cancel(); } catch (e) {} el._slideAnim = null; }
    }
    // Animiert `el` von `from` nach `to`; setzt eine evtl. laufende
    // Animation derselben Folie ab (keine Überlagerung).
    function _playSlide(el, from, to) {
        _cancelSlideAnim(el);
        // fill:'both' (nicht 'forwards'): füllt den Start-Keyframe RÜCKWÄRTS
        // aus, falls die Animation im ersten Frame noch nicht tickt (z.B.
        // bei beladenem Main-Thread). Ohne Rückwärtsfüllung wäre die alte
        // Folie (ohne .active → CSS opacity 0) für ein paar Frames komplett
        // unsichtbar, während die neue noch bei 0 hängt → weißer Bildschirm.
        // Mit 'both' hält die alte Folie bei 1 und die neue bei 0, bis die
        // Animation tatsächlich vorankommt.
        const anim = el.animate([from, to], { duration: SLIDE_DUR, easing: SLIDE_EASE, fill: 'both' });
        el._slideAnim = anim;
        anim.finished.then(() => {
            // Ruhe-Zustand übernehmen: Animation ablösen, CSS-Werte gelten.
            // End- und CSS-Werte sind identisch (aktiv: op1/0,0 · inaktiv: op0)
            // → kein Pop. Guard: nicht antasten, wenn die Folie schon neu
            // animiert wurde.
            if (el._slideAnim === anim) { try { anim.cancel(); } catch (e) {} el._slideAnim = null; }
        }).catch(() => {
            if (el._slideAnim === anim) el._slideAnim = null;
        });
        return anim;
    }

    function activateSlide(newSlide, oldSlide, forward) {
        const dir = forward ? 1 : -1;
        // OPAKER PUSH: Beide Folien bleiben opak (opacity 1) — die eintretende
        // deckt die auslaufende ab, während sie von der Einfahrseite ins
        // Zentrum fährt. Da in jedem Frame mindestens eine Folie die Szene
        // abdeckt, kann nie Weiß durchscheinen. (Der frühere Crossfade war die
        // Fehlerquelle: inkomposite Frames ohne deckende Folie. Opacity zu
        // 0→0/0→1 zu faden lässt genau dann Weiß zeigen, wenn eine Folie noch
        // nicht gemappt ist.) Nur der Transform wird animiert.
        newSlide.classList.remove('entering', 'leaving', 'leaving-back');
        oldSlide.classList.remove('active', 'entering', 'leaving', 'leaving-back');
        newSlide.classList.add('active');
        oldSlide.classList.add('hold');

        _playSlide(
            newSlide,
            { transform: `translate(${dir * SLIDE_DIST}px, 0px) scale(0.985)` },
            { transform: 'translate(0px, 0px) scale(1)' });
        _playSlide(
            oldSlide,
            { transform: 'translate(0px, 0px) scale(1)' },
            { transform: `translate(${-dir * SLIDE_DIST}px, 0px) scale(0.985)` });

        // .hold räumen, sobald die Folie vollständig abgedeckt ist.
        // Guard: nicht antasten, wenn sie inzwischen wieder aktiv ist.
        setTimeout(() => {
            if (!oldSlide.classList.contains('active')) oldSlide.classList.remove('hold');
        }, SLIDE_DUR + 80);
    }

    function goTo(idx, showAllFragments = false) {
        if (idx < 0 || idx >= slides.length) return;
        // Focus aus Inputs/Textareas rausnehmen, damit Pfeiltasten wieder
        // navigieren statt z.B. Slider-Werte zu ändern. Sonst bleibt der
        // Focus auf einem Range/Select hängen und die nächste Folie ist
        // nicht mehr erreichbar.
        const ae = document.activeElement;
        if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT')) ae.blur();

        // Gleiche Folie (z.B. Klick auf eigenes Overview-Thumbnail):
        // kein Crossfade, nur UI synchron halten.
        if (idx === currentSlide) {
            updateUI();
            closeOverview();
            return;
        }

        const oldSlide = slides[currentSlide];
        const oldIdx = currentSlide;
        currentSlide = idx;
        const newSlide = slides[currentSlide];
        const forward = idx > oldIdx;

        activateSlide(newSlide, oldSlide, forward);

        // Lifecycle NACH .active setzen — Demos prüfen oft
        // `document.querySelector('.slide.active')` und würden sonst
        // fälschlich reset() statt activate() aufrufen.
        DemoRegistry.notifyEnter(oldSlide, newSlide);

        // Crossfade-Lock setzen: Pfeiltasten werden erst wieder angenommen,
        // wenn die neue Folie sichtbar ist.
        lockSlideTransition();

        const fragments = getFragments(currentSlide);
        if (fastMode) {
            revealFastFragments(currentSlide);
        } else if (showAllFragments) {
            fragments.forEach(f => f.classList.add('visible'));
            fragmentIndex[currentSlide] = fragments.length;
        } else {
            fragments.forEach(f => f.classList.remove('visible'));
            fragmentIndex[currentSlide] = 0;
        }

        updateUI();
        closeOverview();
        triggerSlideInit(currentSlide);
        requestAnimationFrame(fitSlides);
    }

    function updateUI() {
        document.getElementById('slide-counter').textContent =
            `${currentSlide + 1} / ${slides.length}`;
        document.getElementById('btn-prev').disabled = false;
        document.getElementById('btn-next').disabled = false;
        const progress = (currentSlide / (slides.length - 1)) * 100;
        document.getElementById('progress-bar').style.width = progress + '%';
        document.querySelectorAll('.overview-thumb').forEach((thumb, i) => {
            thumb.classList.toggle('current', i === currentSlide);
        });
    }

    function slideTitle(slide, i) {
        return slide.getAttribute('data-title') || `Folie ${i + 1}`;
    }

    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function overviewVisible() {
        const el = document.getElementById('slide-overview');
        return !!(el && el.classList.contains('visible'));
    }

    function buildOverview() {
        const grid = document.getElementById('overview-grid');
        grid.innerHTML = '';
        const q = searchQuery.trim().toLowerCase();
        let shown = 0;
        slides.forEach((slide, i) => {
            const title = slideTitle(slide, i);
            if (q && !title.toLowerCase().includes(q)) return;
            const thumb = document.createElement('div');
            thumb.className = 'overview-thumb' + (i === currentSlide ? ' current' : '');
            thumb.innerHTML = `<div class="thumb-number">Folie ${i + 1}</div><div class="thumb-title">${title}</div>`;
            thumb.onclick = () => goTo(i);
            grid.appendChild(thumb);
            shown++;
        });
        renderSearchBar(shown);
    }

    // Suchleiste – dynamisch erzeugt, damit sie in allen Decks funktioniert
    function renderSearchBar(shown) {
        const ov = document.getElementById('slide-overview');
        if (!ov) return;
        let bar = document.getElementById('overview-searchbar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'overview-searchbar';
            bar.style.cssText =
                'position:sticky;top:-40px;z-index:10;max-width:1400px;margin:0 auto 20px auto;' +
                'display:flex;align-items:center;gap:12px;min-height:34px;' +
                'padding:8px 12px;background:rgba(15,23,42,0.98);border:1px solid #334155;border-radius:10px;';
            ov.insertBefore(bar, ov.firstChild);
        }
        bar.innerHTML = '';
        const label = document.createElement('span');
        if (!searchQuery) {
            label.style.cssText = 'color:#94a3b8;font-size:0.9em;';
            label.innerHTML = '🔍 Tippe, um nach Titel zu filtern <span style="color:#64748b;">· Esc schließt</span>';
        } else {
            label.style.cssText = 'color:#e2e8f0;font-size:0.95em;';
            label.innerHTML = `🔍 “${escapeHtml(searchQuery)}” <span style="color:#64748b;font-size:0.85em;">· ${shown} von ${slides.length}</span>`;
            bar.appendChild(label);
            const btn = document.createElement('button');
            btn.textContent = '✕ löschen';
            btn.style.cssText = 'margin-left:auto;background:#334155;border:none;color:#e2e8f0;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:0.85em;';
            btn.onclick = () => clearOverviewSearch();
            bar.appendChild(btn);
            return;
        }
        bar.appendChild(label);
    }

    function toggleOverview() {
        const el = document.getElementById('slide-overview');
        if (el.classList.contains('visible')) {
            closeOverview();
        } else {
            el.classList.add('visible');
            buildOverview();
        }
    }

    function closeOverview() {
        searchQuery = '';
        document.getElementById('slide-overview').classList.remove('visible');
    }

    // ── Typ-zum-Filtern in der Übersicht ──
    function searchAppend(ch) {
        if (!overviewVisible()) return;
        searchQuery += ch;
        buildOverview();
    }

    function searchBackspace() {
        if (!overviewVisible() || !searchQuery) return;
        searchQuery = searchQuery.slice(0, -1);
        buildOverview();
    }

    function clearOverviewSearch() {
        searchQuery = '';
        buildOverview();
    }

    function overviewEscape() {
        if (searchQuery) clearOverviewSearch();
        else closeOverview();
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    }

    function triggerSlideInit(idx) {
        const plotDivs = slides[idx].querySelectorAll('[id*="plot"], [id*="viz"]');
        plotDivs.forEach(div => {
            if (div.data && div.layout) {
                Plotly.relayout(div, { autosize: true });
            }
        });
    }

    return {
        init, next, prev, goTo, count: () => slides.length,
        slides: () => slides,
        slideTitleAt: (i) => (slides[i] ? slideTitle(slides[i], i) : ''),
        getActiveSlide: () => slides[currentSlide] || null,
        isFastMode: () => fastMode,
        isSlideTransitioning,
        toggleOverview, toggleFullscreen, closeOverview,
        searchAppend, searchBackspace, clearOverviewSearch, overviewEscape,
    };
})();

// ════════════════════════════════════════════════════════════
// FOLIEN-AUSWAHL (Checkbox je Folie + 3× Esc)
// Jede Folie hat oben rechts eine ab Werk deaktivierte Checkbox.
// Ein Klick nimmt die Folie in die URL-Auswahl auf (?slides=…),
// die URL wird live aktualisiert – geschrieben als Slide-IDs wie
// ?slides=slide-attention-matrix,slide-viele-koepfe.
// 3× Esc (schnell hintereinander) öffnet/schließt das Panel oben rechts
// zum Ablesen der URL.
// ════════════════════════════════════════════════════════════
const Selection = (() => {
    let chosen = new Set();      // Ursprungs-Indexes der gewählten Folien
    let escTimes = [];           // Zeitstempel der letzten Escape-Tasten
    const ESC_WINDOW_MS = 500;   // Fenster, in dem 3× Esc zählt
    const TRIPLE = 3;
    const checks = [];           // { el, cb, orig } je Folien-Checkbox

    const byId = id => document.getElementById(id);

    // ── Ursprungs-Indexe aus dem aktuellen ?slides=-Parameter ──
    // Akzeptiert Zahlen, Bereiche (0,1,10-16) und Slide-IDs
    // (slide-attention-matrix) – alle werden auf Ursprungs-Indexe gemappt.
    function paramOrder() {
        const raw = new URLSearchParams(window.location.search).get('slides');
        if (!raw) return [];
        const all = Array.from(document.querySelectorAll('.slide'));
        const out = [];
        raw.split(',').forEach(part => {
            part = part.trim();
            if (!part) return;
            const r = part.split('-');
            if (r.length === 2) {
                const a = parseInt(r[0], 10), b = parseInt(r[1], 10);
                if (!isNaN(a) && !isNaN(b)) {
                    for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.push(i);
                } else {
                    const idx = all.findIndex(s => s.id === part);
                    if (idx !== -1) out.push(idx);
                }
            } else if (!isNaN(parseInt(part, 10))) {
                out.push(parseInt(part, 10));
            } else {
                const idx = all.findIndex(s => s.id === part);
                if (idx !== -1) out.push(idx);
            }
        });
        return out;
    }

    // ── Auswahl als Slide-IDs schreiben (statt Zahlen) ──
    function selectedParam() {
        const all = document.querySelectorAll('.slide');
        return Array.from(chosen).sort((a, b) => a - b).map(i => {
            const el = all[i];
            return (el && el.id) ? el.id : String(i);
        }).join(',');
    }

    // URL OHNE %2C-Enkodierung aufbauen: ?slides=0,1,2 (rohe Kommas).
    // Nur der slides-Parameter wird ersetzt, andere (?fast=… etc.) bleiben.
    function buildURL() {
        const qs = window.location.search.replace(/^\?/, '');
        const parts = qs ? qs.split('&').filter(p => p && !p.startsWith('slides=')) : [];
        if (chosen.size) parts.push('slides=' + selectedParam());
        const q = parts.join('&');
        return window.location.pathname + (q ? '?' + q : '') + window.location.hash;
    }

    function fullURL() { return window.location.origin + buildURL(); }

    function updateURL() {
        try { history.replaceState(null, '', buildURL()); } catch (e) {}
    }

    // ── Panel ──
    function panelEl() { return byId('sel-panel'); }

    function isPanelVisible() {
        return !!panelEl() && panelEl().style.display !== 'none';
    }

    function syncPanel() {
        const count = chosen.size;
        byId('sel-count').textContent =
            count === 1 ? '1 Folie' : (count + ' Folien');
        byId('sel-url').textContent = buildURL();
    }

    // ── Checkboxen: eine je Folie, oben rechts ──
    function syncChecks() {
        checks.forEach(({ el, cb, orig }) => {
            const on = chosen.has(orig);
            cb.checked = on;
            el.classList.toggle('checked', on);
        });
    }

    function buildChecks() {
        // Die .slide-Elemente liegen im DOM stets in Ursprungs-Reihenfolge
        // (Filterung ändert nur die Navigation, nicht die Reihenfolge).
        // Also ist der DOM-Index (= pos) bereits der Ursprungs-Index.
        document.querySelectorAll('.slide').forEach((slide, pos) => {
            // Dynamisch erzeugte Folien (z.B. Kurz-Abschluss) haben keinen
            // Original-Index und gehören nicht in die ?slides=-Auswahl.
            if (slide.getAttribute('data-non-original')) return;
            const orig = pos;
            const label = document.createElement('label');
            label.className = 'sel-check';
            label.title = slide.id || slide.getAttribute('data-title') || ('Folie ' + orig);
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            const span = document.createElement('span');
            const title = slide.getAttribute('data-title');
            span.textContent = orig + ' · ' + (title || slide.id || '');
            label.appendChild(cb);
            label.appendChild(span);
            slide.appendChild(label);
            const rec = { el: label, cb, orig };
            cb.addEventListener('change', () => {
                if (cb.checked) chosen.add(orig); else chosen.delete(orig);
                syncChecks();
                syncPanel();
                updateURL();
            });
            checks.push(rec);
        });
        syncChecks();
    }

    function clearAll() {
        chosen = new Set();
        syncChecks();
        syncPanel();
        updateURL();
    }

    // ── Panel öffnen/schließen ──
    function openPanel() {
        if (panelEl()) panelEl().style.display = 'block';
        document.body.classList.add('sel-mode');
        syncPanel();
    }

    function closePanel() {
        if (panelEl()) panelEl().style.display = 'none';
        document.body.classList.remove('sel-mode');
    }

    // 3× Esc (schnell nacheinander) → Panel öffnen/schließen.
    // Einzelnes Esc mit offenem Panel → Panel schließen.
    function handleEscape() {
        const now = Date.now();
        escTimes = escTimes.filter(t => now - t <= ESC_WINDOW_MS);
        escTimes.push(now);
        if (escTimes.length >= TRIPLE) {
            escTimes = [];
            if (!isPanelVisible()) openPanel(); else closePanel();
            return true;
        }
        if (isPanelVisible()) {
            closePanel();
            return true;
        }
        return false;
    }

    // ── Initialisierung & Listener ──
    function init() {
        chosen = new Set(paramOrder());
        buildChecks();
        if (byId('sel-copy')) byId('sel-copy').addEventListener('click', () => copyURL());
        if (byId('sel-preview')) byId('sel-preview').addEventListener('click', () => { window.location.href = fullURL(); });
        if (byId('sel-clear')) byId('sel-clear').addEventListener('click', () => clearAll());
        if (byId('sel-close')) byId('sel-close').addEventListener('click', () => closePanel());
        if (panelEl()) panelEl().style.display = 'none';
        syncPanel();
        // Numerische ?slides=0,10-16 sofort auf Slide-IDs normalisieren,
        // damit die Adresszeile immer sprechende Namen zeigt.
        updateURL();
    }

    function copyURL() {
        const url = fullURL();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => flash('✓ kopiert'));
        } else {
            window.prompt('URL kopieren:', url);
        }
    }

    function flash(text) {
        const btn = byId('sel-copy');
        if (!btn) return;
        const orig = btn.textContent;
        btn.textContent = text;
        setTimeout(() => { btn.textContent = orig; }, 1200);
    }

    return {
        init, handleEscape,
        isPanelVisible, openPanel, closePanel,
    };
})();

// ────────────────────────────────────────────────────────────
// INPUT HANDLING (Keyboard + Touch, keine Duplikation)
// ────────────────────────────────────────────────────────────
const InputHandler = (() => {
    const KEY_ACTIONS = {
        next: ['ArrowRight', ' ', 'Enter', 'PageDown', 'ArrowDown'],
        prev: ['ArrowLeft', 'Backspace', 'PageUp', 'ArrowUp'],
    };

    const SPECIAL_KEYS = {
        'f': () => Presentation.toggleFullscreen(),
        'F': () => Presentation.toggleFullscreen(),
        'o': () => Presentation.toggleOverview(),
        'O': () => Presentation.toggleOverview(),
        'Escape': () => Presentation.closeOverview(),
        'Home': () => Presentation.goTo(0),
        'End': () => Presentation.goTo(Presentation.count() - 1),
    };

    let digitBuffer = '';
    let digitTimer = null;

    function navigate(direction) {
        // Solange der Crossfade der vorherigen Folie noch läuft, keine weitere
        // Navigation annehmen — die neue Folie muss erst vollständig sichtbar
        // sein, bevor der nächste Klick zählt. Sub-Folien blocken sich
        // zusätzlich selbst (siehe DemoRegistry.block).
        if (Presentation.isSlideTransitioning()) return;
        const result = DemoRegistry.tryNavigate(direction, Presentation.getActiveSlide());
        if (result === 'block') return; // Demo hat blockiert — kein Fallthrough
        if (!result) {
            if (direction === 'next') Presentation.next();
            else Presentation.prev();
        }
    }

    function isOverviewOpen() {
        const el = document.getElementById('slide-overview');
        return !!(el && el.classList.contains('visible'));
    }

    function handleKeydown(e) {
        const target = e.target;
        const tag = target.tagName;
        const isCheckbox = tag === 'INPUT' && target.type === 'checkbox';
        // Pfeiltasten auf Inputs/Selects: normalerweise würde der Browser
        // den Wert ändern (z.B. Slider). Stattdessen wollen wir
        // navigieren — also Input bluren und weiterreichen.
        const isNavKey = KEY_ACTIONS.next.includes(e.key) || KEY_ACTIONS.prev.includes(e.key);
		if ((tag === 'INPUT' && !isCheckbox) || tag === 'TEXTAREA' || tag === 'SELECT') {
			// Freitext-Feld (z. B. das Token-Feld): Tasten tippen statt
			// navigieren — sonst würde ein Leerzeichen die Folie blättern.
			if (target.hasAttribute('data-free-text')) return;
			if (isNavKey) { target.blur(); }
			else { return; }
		}
        // Fokussierte Auswahl-Checkbox: Space toggelt sie (Standard);
        // alle anderen Tasten (Pfeile, Home/End, Buchstaben, Ziffern)
        // navigieren normal und geben den Fokus an die Folie zurück.
        if (isCheckbox && e.key === ' ') return;
        if (isCheckbox) target.blur();

        // Übersicht offen → Tippen filtert die Folien nach Titel
        if (isOverviewOpen()) {
            if (e.key === 'Escape') {
                e.preventDefault();
                Presentation.overviewEscape();
                return;
            }
            if (e.key === 'Backspace') {
                e.preventDefault();
                Presentation.searchBackspace();
                return;
            }
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                Presentation.searchAppend(e.key);
                return;
            }
            // Pfeile / Home / End / Enter etc. → unten (normale Navigation)
        }

        // Folien-Auswahl: 3× Esc (schnell) öffnet das Panel, einfaches Esc schließt es.
        if (e.key === 'Escape' && Selection.handleEscape()) {
            e.preventDefault();
            return;
        }

        if (KEY_ACTIONS.next.includes(e.key)) {
            e.preventDefault();
            navigate('next');
        } else if (KEY_ACTIONS.prev.includes(e.key)) {
            e.preventDefault();
            navigate('prev');
        } else if (SPECIAL_KEYS[e.key]) {
            e.preventDefault();
            SPECIAL_KEYS[e.key]();
        } else if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            digitBuffer += e.key;
            if (digitTimer) clearTimeout(digitTimer);
            digitTimer = setTimeout(() => {
                const num = parseInt(digitBuffer, 10);
                if (num >= 1) {
                    Presentation.goTo(num - 1);
                }
                digitBuffer = '';
                digitTimer = null;
            }, 600);
        }
    }

    // Touch/Swipe
    let touchStartX = 0;
    let touchStartY = 0;

    function handleTouchStart(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }

    function handleTouchEnd(e) {
        const dx = e.changedTouches[0].screenX - touchStartX;
        const dy = e.changedTouches[0].screenY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
            navigate(dx < 0 ? 'next' : 'prev');
        }
    }

    // Mouse-Wheel: jede deutliche Scrollbewegung = ein Folienwechsel.
    // 500 ms Cooldown verhindert, dass ein einziges Scroll-Event mehrere
    // Folien überspringt (Trackpad-/Mausrad-Artefakte).
    let wheelCooldown = false;
    function handleWheel(e) {
        if (wheelCooldown) return;
        if (isOverviewOpen()) return;
        e.preventDefault();
        wheelCooldown = true;
        setTimeout(() => { wheelCooldown = false; }, 500);
        navigate(e.deltaY > 0 ? 'next' : 'prev');
    }

    function init() {
        document.addEventListener('keydown', handleKeydown);
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        document.addEventListener('wheel', handleWheel, { passive: false });
    }

    return { init };
})();

// ────────────────────────────────────────────────────────────
// LOADING STATUS – dynamischer Lade-Text
// Zeigt konkret, was gerade geladen wird: jede Folie beim
// Formel-Rendering, jeder Plot beim Zeichnen. Seiten hängen
// schwere Init-Schritte (Plots, Demos) über LoadingTasks ein.
// ────────────────────────────────────────────────────────────
const LoadingStatus = (() => {
    function spinnerEl() { return document.getElementById('loading-spinner'); }
    function statusEl() { return document.getElementById('intro-status'); }
    function barEl() { return document.getElementById('intro-bar-fill'); }
    function active() {
        const s = spinnerEl();
        return !!(s && !s.classList.contains('hidden'));
    }
    function set(text, pct) {
        const e = statusEl();
        if (e) e.textContent = text;
        if (typeof pct === 'number') {
            const b = barEl();
            if (b) b.style.width = Math.max(0, Math.min(100, pct)) + '%';
        }
    }
    function done() {
        const s = spinnerEl();
        if (s) {
            const b = barEl();
            if (b) b.style.width = '100%';
            s.classList.add('hidden');
        }
    }
    return { set, done, active };
})();

// Warteschlange für schwere, seiten-spezifische Lade-Schritte (Plots, Demos).
const LoadingTasks = {
    _q: [],
    add(label, fn) { this._q.push({ label, fn }); },
    drain() { const q = this._q; this._q = []; return q; }
};

// Lesebarer Name für ein Plot-Container-Element:
// 1) explizites data-loading-label, sonst aus der ID abgeleitet.
function plotLabel(div) {
    if (typeof div === 'string') div = document.getElementById(div);
    if (!div || !div.nodeType) return 'Plot';
    const explicit = div.getAttribute('data-loading-label');
    if (explicit) return explicit;
    if (div.id) {
        const pretty = div.id.replace(/[-_]+/g, ' ').replace(/\bplot(s)?\b/i, '').trim();
        return pretty || 'Plot';
    }
    return 'Plot';
}

// Jedes Plotly-Rendering meldet sich im Lade-Text an ("Zeichne …").
(function wrapPlotly() {
    if (typeof Plotly === 'undefined') return;
    ['newPlot', 'react'].forEach(method => {
        const orig = Plotly[method];
        if (typeof orig !== 'function') return;
        Plotly[method] = function (div, ...args) {
            if (LoadingStatus.active()) LoadingStatus.set('Zeichne ' + plotLabel(div) + ' …');
            return orig.apply(this, [div, ...args]);
        };
    });
})();

// ────────────────────────────────────────────────────────────
// BOOTSTRAP + LADE-PIPELINE
// ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // ?short=1: optionale Inhalte entfernen (data-short). Das Element wird
    // aus dem DOM genommen, damit der darüberliegende Inhalt nachrückt und
    // der Platz wirklich nicht belegt wird – nicht nur unsichtbar ist.
    if (new URLSearchParams(window.location.search).get('short') === '1') {
        document.querySelectorAll('[data-short]').forEach(el => el.remove());
    }

    initTypewriters();

    Presentation.init();
    InputHandler.init();
    Selection.init();

    // URL-Hash-Navigation (#N → Folie N, 1-basiert) – nur ohne ?start=
    const hasStart = new URLSearchParams(window.location.search).has('start');
    const hash = window.location.hash;
    if (hash && !hasStart) {
        const match = hash.match(/^#(\d+)$/);
        if (match) {
            const slideNum = parseInt(match[1], 10);
            setTimeout(() => Presentation.goTo(slideNum - 1), 150);
        }
    }

    runBootSequence();
});

// Einen Frame abgeben, damit der Lade-Text sichtbar aktualisiert wird.
const yieldFrame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));

function renderOneMath(el, displayMode, sliceStart, sliceEnd) {
    let tex = el.textContent.trim();
    if (tex.startsWith(sliceStart) && tex.endsWith(sliceEnd)) {
        tex = tex.slice(sliceStart.length, -sliceEnd.length);
    }
    try {
        el.innerHTML = temml.renderToString(tex, { displayMode });
    } catch (e) {
        console.warn('Temml render error:', e);
    }
}

// Lade-Sequenz: rendert die Formeln Folie für Folie (mit Status-Update pro
// Folie), arbeitet dann die schweren Plot-/Demo-Schritte ab und blendet den
// Lade-Screen erst dann aus, wenn alles fertig ist.
async function runBootSequence() {
    const allSlides = Presentation.slides();
    try {
        for (let i = 0; i < allSlides.length; i++) {
            LoadingStatus.set('Rendere Folie ' + (i + 1) + '/' + allSlides.length + ' · ' + Presentation.slideTitleAt(i) + ' …', (i / allSlides.length) * 50);
            await yieldFrame();
            allSlides[i].querySelectorAll('.math-display').forEach(el => renderOneMath(el, true, '$$', '$$'));
            allSlides[i].querySelectorAll('.math-inline').forEach(el => renderOneMath(el, false, '$', '$'));
        }

        // Sicherheitsnetz: Formeln, die nicht in einer Folie liegen (falls vorhanden),
        // werden ebenfalls gerendert – exakt wie im alten synchronen Durchlauf.
        document.querySelectorAll('.math-display, .math-inline').forEach(el => {
            if (el.closest('.slide')) return;
            const isDisplay = el.classList.contains('math-display');
            renderOneMath(el, isDisplay, isDisplay ? '$$' : '$', isDisplay ? '$$' : '$');
        });

        const tasks = LoadingTasks.drain();
        const totalSteps = allSlides.length + tasks.length + 2;
        let step = allSlides.length;
        for (const t of tasks) {
            step++;
            LoadingStatus.set(t.label, 50 + (step / totalSteps) * 45);
            await yieldFrame();
            try { t.fn(); } catch (err) { console.warn('Lade-Schritt fehlgeschlagen:', err); }
            await yieldFrame();
        }

        if (typeof loadIntuitionModule === 'function') {
            step++;
            LoadingStatus.set('Initialisiere Neuronen-Demos …', 50 + (step / totalSteps) * 45);
            await yieldFrame();
            loadIntuitionModule();
        }
    } finally {
        LoadingStatus.set('Fast fertig …', 100);
        await yieldFrame();
        if (typeof fitSlides === 'function') fitSlides();
        LoadingStatus.done();
    }
}
