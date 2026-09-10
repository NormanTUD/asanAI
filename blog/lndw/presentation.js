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
                { ref: () => typeof NNStepDemo !== 'undefined' ? NNStepDemo : null,
                        onLeave: d => d.reset() },

                { ref: () => typeof TrainingViz !== 'undefined' ? TrainingViz : null },

                { ref: () => typeof AttentionDemo !== 'undefined' ? AttentionDemo : null,
                        onLeave: d => d.reset() },

                { ref: () => typeof JSpaceViz !== 'undefined' ? JSpaceViz : null,
                        slideTest: s => s.getAttribute('data-title') === 'J-Space',
                        onEnter: d => setTimeout(() => d.init(), 80),
                        onLeave: d => d.reset() },

                { ref: () => typeof PEOrbitViz !== 'undefined' ? PEOrbitViz : null,
                        guard: d => d.isOnPEOrbitSlide() },

                { ref: () => typeof ResidualNotebook !== 'undefined' ? ResidualNotebook : null,
                        guard: d => d.isOnNotebookSlide(),
                        nextMethod: 'nextLayer',
                        prevMethod: 'prevLayer',
                        onLeave: d => d.reset() },

                { ref: () => typeof EmbeddingAutoDemo !== 'undefined' ? EmbeddingAutoDemo : null,
                        slideTest: s => typeof EmbeddingAutoDemo !== 'undefined' && EmbeddingAutoDemo.isOnEmbeddingSlide(),
                        onEnter: d => d.activate(),
                        onLeave: d => d.reset() },

                { ref: () => typeof PredictionViz !== 'undefined' ? PredictionViz : null,
                        onLeave: d => d.reset() },

                { ref: () => typeof CRSim !== 'undefined' ? CRSim : null,
                        slideTest: s => !!s.querySelector('#chinese-room-sim'),
                        onEnter: d => d.start(),
                        onLeave: d => d.deactivate() },

                { ref: () => typeof AttractorViz !== 'undefined' ? AttractorViz : null,
                        slideTest: s => s.getAttribute('data-title') === 'Attraktoren',
                        onEnter: d => setTimeout(() => d.init(), 80),
                        onLeave: d => d.reset() },
                { ref: () => typeof IsosurfaceDemo !== 'undefined' ? IsosurfaceDemo : null,
                        slideTest: s => s.getAttribute('data-title') === 'Wahrscheinlichkeits-Tunnel',
                        onEnter: d => setTimeout(() => d.init(), 100),
                        onLeave: d => d.reset() },

                { ref: () => typeof TrainingDemo !== 'undefined' ? TrainingDemo : null,
                        guard: d => d.isOnTrainingSlide(),
                        slideTest: s => s.getAttribute('data-title') === 'Training',
                        nextMethod: 'nextImage',
                        prevMethod: 'prevImage',
                        onEnter: d => { d.init(); setTimeout(() => d.start(), 200); },
                        onLeave: d => d.stop() },

                { ref: () => typeof ZipfViz !== 'undefined' ? ZipfViz : null,
                        slideTest: s => s.getAttribute('data-title') === 'Muster in der Wirklichkeit',
                        onEnter: d => {
                            d.renderGermanZipf();
                            setTimeout(() => d.resize(), 100);
                        } },

        ];

    // Normalisiere: Defaults einsetzen
    const demos = registry.map(entry => ({ ...DEFAULTS, ...entry }));

    /** Versuche Navigation in einer Richtung. Gibt true zurück wenn konsumiert. */
    function tryNavigate(direction) {
        const canKey = direction === 'next' ? 'canNext' : 'canPrev';
        const methodKey = direction === 'next' ? 'nextMethod' : 'prevMethod';

        for (const demo of demos) {
            const instance = demo.ref();
            if (!instance) continue;
            if (!demo.guard(instance)) continue;
            if (typeof instance[demo[canKey]] === 'function' && instance[demo[canKey]]()) {
                instance[demo[methodKey]]();
                return true;
            }
        }
        return false;
    }

    /** Lifecycle: Slide wird betreten */
    function notifyEnter(slide) {
        for (const demo of demos) {
            const instance = demo.ref();
            if (!instance) continue;
            if (demo.slideTest && demo.slideTest(slide)) {
                if (demo.onEnter) demo.onEnter(instance);
            } else {
                if (demo.onLeave) demo.onLeave(instance);
            }
        }
    }

    return { tryNavigate, notifyEnter };
})();

// ────────────────────────────────────────────────────────────
// FRAGMENT ACTION MAP (statt if/if/if-Ketten)
// ────────────────────────────────────────────────────────────
const FragmentActions = {
    'show-sinus': {
        forward: () => SunrisePlot.showSinus(),
        backward: () => SunrisePlot.hideSinus(),
    },
    'knowledge-step': {
        forward: (frag) => {
            const step = parseInt(frag.getAttribute('data-knowledge-step'));
            KnowledgeViz.setStep(step);
        },
        backward: (frag) => {
            const step = parseInt(frag.getAttribute('data-knowledge-step'));
            if (step > 0) KnowledgeViz.setStep(step - 1);
        },
    },
    'manifold-align': {
        forward: () => {
            if (typeof animateDualManifoldAlignment === 'function') animateDualManifoldAlignment();
        },
        backward: () => {
            if (typeof resetDualManifold === 'function') resetDualManifold();
        },
    },

	// In FragmentActions hinzufügen:
	'show-halluc-bubbles': {
	    forward: () => {
		document.querySelectorAll('.halluc-word').forEach((word, i) => {
		    setTimeout(() => {
			word.classList.add('active');
			// Bubble erstellen falls noch nicht vorhanden
			if (!word.querySelector('.halluc-bubble')) {
			    const candidates = word.getAttribute('data-candidates').split('|');
			    const bubble = document.createElement('div');
			    bubble.className = 'halluc-bubble';
			    candidates.forEach(c => {
				const [name, prob] = c.trim().split(/\s+(?=[\d.]+$)/);
				const row = document.createElement('div');
				row.className = 'candidate';
				row.innerHTML = `<span class="candidate-name">${name}</span><span class="candidate-prob">${prob}</span>`;
				bubble.appendChild(row);
			    });
			    word.appendChild(bubble);
			}
		    }, i * 200); // Gestaffelt einblenden
		});
	    },
	    backward: () => {
		document.querySelectorAll('.halluc-word').forEach(word => {
		    word.classList.remove('active');
		    const bubble = word.querySelector('.halluc-bubble');
		    if (bubble) bubble.remove();
		});
	    },
	},

};

// ────────────────────────────────────────────────────────────
// PRESENTATION CORE
// ────────────────────────────────────────────────────────────
const Presentation = (() => {
    let currentSlide = 0;
    let slides = [];
    let fragmentIndex = {};
    let searchQuery = '';

    // ────────────────────────────────────────────────────────────
    // SLIDE-AUSWAHL via URL:  ?slides=0,1,2,3,10-16,17,19-30
    // 0-basierte Indexe der Ursprungsfolge, Bereiche inkl. der Enden.
    // Ohne Parameter (oder leer) → alle Folien.
    // ────────────────────────────────────────────────────────────
    function parseSlideSelection(total) {
        const raw = new URLSearchParams(window.location.search).get('slides');
        if (!raw) return null;
        const selected = new Set();
        raw.split(',').forEach(part => {
            part = part.trim();
            if (!part) return;
            const range = part.split('-');
            let a, b;
            if (range.length === 2) {
                a = parseInt(range[0].trim(), 10);
                b = parseInt(range[1].trim(), 10);
            } else {
                a = b = parseInt(part, 10);
            }
            if (isNaN(a) || isNaN(b)) return;
            const [lo, hi] = a <= b ? [a, b] : [b, a];
            for (let i = lo; i <= hi; i++) {
                if (i >= 0 && i < total) selected.add(i);
            }
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

    function next() {
        const fragments = getFragments(currentSlide);
        const visibleCount = fragmentIndex[currentSlide];
        if (visibleCount < fragments.length) {
            const frag = fragments[visibleCount];
            frag.classList.add('visible');
            fragmentIndex[currentSlide]++;
            executeFragmentAction(frag, 'forward');
            return;
        }
        goTo((currentSlide + 1) % slides.length);
    }

    function prev() {
        const fragments = getFragments(currentSlide);
        const visibleCount = fragmentIndex[currentSlide];
        if (visibleCount > 0) {
            const frag = fragments[visibleCount - 1];
            frag.classList.remove('visible');
            fragmentIndex[currentSlide]--;
            executeFragmentAction(frag, 'backward');
            return;
        }
        if (currentSlide > 0) {
            goTo(currentSlide - 1, true);
        } else {
            // Loop: von der ersten Folie zurück zur letzten
            goTo(slides.length - 1, true);
        }
    }

    function goTo(idx, showAllFragments = false) {
        if (idx < 0 || idx >= slides.length) return;
        slides[currentSlide].classList.remove('active');
        currentSlide = idx;
        slides[currentSlide].classList.add('active');

        const fragments = getFragments(currentSlide);
        if (showAllFragments) {
            fragments.forEach(f => f.classList.add('visible'));
            fragmentIndex[currentSlide] = fragments.length;
        } else {
            fragments.forEach(f => f.classList.remove('visible'));
            fragmentIndex[currentSlide] = 0;
        }

        // Zentrale Lifecycle-Benachrichtigung
        DemoRegistry.notifyEnter(slides[currentSlide]);

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
        toggleOverview, toggleFullscreen, closeOverview,
        searchAppend, searchBackspace, clearOverviewSearch, overviewEscape,
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
        if (!DemoRegistry.tryNavigate(direction)) {
            if (direction === 'next') Presentation.next();
            else Presentation.prev();
        }
    }

    function isOverviewOpen() {
        const el = document.getElementById('slide-overview');
        return !!(el && el.classList.contains('visible'));
    }

    function handleKeydown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

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

    function init() {
        document.addEventListener('keydown', handleKeydown);
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
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
    function textEl() {
        const s = spinnerEl();
        return s ? s.querySelector('.spinner-text') : null;
    }
    function active() {
        const s = spinnerEl();
        return !!(s && !s.classList.contains('hidden'));
    }
    function set(text) {
        const e = textEl();
        if (e) e.textContent = text;
    }
    function done() {
        const s = spinnerEl();
        if (s) s.classList.add('hidden');
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
    Presentation.init();
    InputHandler.init();

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
            LoadingStatus.set('Rendere Folie ' + (i + 1) + '/' + allSlides.length + ' · ' + Presentation.slideTitleAt(i) + ' …');
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
        for (const t of tasks) {
            LoadingStatus.set(t.label);
            await yieldFrame();
            try { t.fn(); } catch (err) { console.warn('Lade-Schritt fehlgeschlagen:', err); }
            await yieldFrame();
        }

        if (typeof loadIntuitionModule === 'function') {
            LoadingStatus.set('Initialisiere Intuition-Demos …');
            await yieldFrame();
            loadIntuitionModule();
        }
        if (typeof runAttention === 'function') {
            LoadingStatus.set('Zeichne Attention-Beispiel …');
            await yieldFrame();
            runAttention();
        }
    } finally {
        LoadingStatus.set('Fast fertig …');
        await yieldFrame();
        if (typeof fitSlides === 'function') fitSlides();
        LoadingStatus.done();
    }
}
