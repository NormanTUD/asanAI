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

    function init() {
        slides = Array.from(document.querySelectorAll('.slide'));
        slides.forEach((_, i) => { fragmentIndex[i] = 0; });
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
        if (currentSlide < slides.length - 1) {
            goTo(currentSlide + 1);
        }
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
        }
    }

    function goTo(idx, showAllFragments = false) {
        if (idx < 0 || idx >= slides.length) return;
        slides[currentSlide].classList.remove('active');
        currentSlide = idx;
        slides[currentSlide].classList.remove('slide-entering');
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
        setTimeout(fitSlides, 50);
    }

    function updateUI() {
        document.getElementById('slide-counter').textContent =
            `${currentSlide + 1} / ${slides.length}`;
        document.getElementById('btn-prev').disabled =
            (currentSlide === 0 && fragmentIndex[0] === 0);
        document.getElementById('btn-next').disabled =
            (currentSlide === slides.length - 1 &&
             fragmentIndex[currentSlide] >= getFragments(currentSlide).length);
        const progress = (currentSlide / (slides.length - 1)) * 100;
        document.getElementById('progress-bar').style.width = progress + '%';
        document.querySelectorAll('.overview-thumb').forEach((thumb, i) => {
            thumb.classList.toggle('current', i === currentSlide);
        });
    }

    function buildOverview() {
        const grid = document.getElementById('overview-grid');
        grid.innerHTML = '';
        slides.forEach((slide, i) => {
            const title = slide.getAttribute('data-title') || `Folie ${i + 1}`;
            const thumb = document.createElement('div');
            thumb.className = 'overview-thumb' + (i === currentSlide ? ' current' : '');
            thumb.innerHTML = `<div class="thumb-number">Folie ${i + 1}</div><div class="thumb-title">${title}</div>`;
            thumb.onclick = () => goTo(i);
            grid.appendChild(thumb);
        });
    }

    function toggleOverview() {
        document.getElementById('slide-overview').classList.toggle('visible');
    }

    function closeOverview() {
        document.getElementById('slide-overview').classList.remove('visible');
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

    return { init, next, prev, goTo, toggleOverview, toggleFullscreen, closeOverview };
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
        'End': () => Presentation.goTo(document.querySelectorAll('.slide').length - 1),
    };

    function navigate(direction) {
        if (!DemoRegistry.tryNavigate(direction)) {
            direction === 'next' ? Presentation.next() : Presentation.prev();
        }
    }

    function handleKeydown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (KEY_ACTIONS.next.includes(e.key)) {
            e.preventDefault();
            navigate('next');
        } else if (KEY_ACTIONS.prev.includes(e.key)) {
            e.preventDefault();
            navigate('prev');
        } else if (SPECIAL_KEYS[e.key]) {
            e.preventDefault();
            SPECIAL_KEYS[e.key]();
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
// BOOTSTRAP
// ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    Presentation.init();
    InputHandler.init();

    // Temml Math Rendering
    const renderMath = (selector, displayMode, sliceStart, sliceEnd) => {
        document.querySelectorAll(selector).forEach(el => {
            let tex = el.textContent.trim();
            if (tex.startsWith(sliceStart) && tex.endsWith(sliceEnd)) {
                tex = tex.slice(sliceStart.length, -sliceEnd.length);
            }
            try {
                el.innerHTML = temml.renderToString(tex, { displayMode });
            } catch (e) {
                console.warn('Temml render error:', e);
            }
        });
    };

    renderMath('.math-display', true, '$$', '$$');
    renderMath('.math-inline', false, '$', '$');

    if (typeof loadIntuitionModule === 'function') loadIntuitionModule();
    if (typeof runAttention === 'function') runAttention();
    $("#dim-btn-1").click();
});
