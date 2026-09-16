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

                { ref: () => typeof NNStepDemo !== 'undefined' ? NNStepDemo : null,
                        slideTest: s => NNStepDemo && NNStepDemo.isSonnenbahnSlide(s),
                        onEnter: d => d.markSonnenbahnSeen() },

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

                { ref: () => typeof NeuronIntroViz !== 'undefined' ? NeuronIntroViz : null,
                        guard: d => d.isOnIntroSlide(),
                        canNext: 'canGoNext',
                        nextMethod: 'next',
                        canPrev: 'canGoPrev',
                        prevMethod: 'prev',
                        slideTest: s => s.getAttribute('data-title') === 'Neuronales Netz Intro',
                        onEnter: d => d.reset() },

                { ref: () => typeof TypewriterViz !== 'undefined' ? TypewriterViz : null,
                        guard: d => d.isOnClassicSlide(),
                        canNext: 'isTypewriting',
                        nextMethod: 'nop' },

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

	// "Code-reingetippt"-Effekt: Fragment zeigt beim Einblenden den Code
	// in einem [data-typewriter]-Element, Buchstabe für Buchstabe (schnell).
	'typewriter': {
	    forward: (frag) => startTypewriter(frag),
	    backward: (frag) => resetTypewriter(frag),
	},

	// "Was sind Neuronale Netzwerk?" – 3-Szene manuell (Pfeiltaste weiter/rückwärts)
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
function initTypewriters() {
    document.querySelectorAll('[data-typewriter]').forEach(el => {
        if (el.dataset.typeHtml === undefined) el.dataset.typeHtml = el.innerHTML;
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

        // ?short=1 + ?fast=1: Abschluss-Folie "Und wieder von vorn" direkt
        // nach "Die Vorhersage" in die Navigation einfügen.
        fastMode = new URLSearchParams(window.location.search).get('fast') === '1';
        shortMode = new URLSearchParams(window.location.search).get('short') === '1';
        if (fastMode && shortMode) {
            // Kurzversion: „Die autoregressive Schleife" wird aus ihrer
            // Originalposition herausgenommen und direkt nach „Die Vorhersage"
            // geschoben (Ende der Kurzversion → Kreislauf beginnt wieder).
            // Nur das slides-Array wird verändert, der DOM bleibt unangetastet,
            // damit die ?slides=-Indizes der Ursprungsfolge gültig bleiben.
            const titleOf = s => s.getAttribute('data-title');
            const vorhersageIdx = slides.findIndex(s => titleOf(s) === 'Die Vorhersage');
            const arIdx = slides.findIndex(s => titleOf(s) === 'Autoregressive Schleife');
            if (arIdx >= 0) {
                const [arSlide] = slides.splice(arIdx, 1);
                if (vorhersageIdx < 0) {
                    slides.push(arSlide);
                } else {
                    let insertAt = vorhersageIdx;
                    if (arIdx < vorhersageIdx) insertAt--; // Vorhersage rückt eine Position vor
                    slides.splice(insertAt + 1, 0, arSlide);
                }
            }
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

        // ?fast=1: einfache Fragmente direkt anzeigen
        if (fastMode) revealFastFragments(currentSlide);

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

    function goTo(idx, showAllFragments = false) {
        if (idx < 0 || idx >= slides.length) return;
        slides[currentSlide].classList.remove('active');
        currentSlide = idx;
        slides[currentSlide].classList.add('active');

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
        isFastMode: () => fastMode,
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
        const target = e.target;
        const tag = target.tagName;
        const isCheckbox = tag === 'INPUT' && target.type === 'checkbox';
        // Text-Inputs/Textarea: Browser übernimmt die Tasten.
        if ((tag === 'INPUT' && !isCheckbox) || tag === 'TEXTAREA') return;
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
