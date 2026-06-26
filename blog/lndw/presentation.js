// ============================================================
// PRESENTATION ENGINE
// ============================================================
const Presentation = (() => {
    let currentSlide = 0;
    let slides = [];
    let fragmentIndex = {};

    function init() {
        slides = Array.from(document.querySelectorAll('.slide'));
        slides.forEach((slide, i) => {
            fragmentIndex[i] = 0;
        });
        updateUI();
        buildOverview();
    }

	function getFragments(slideIdx) {
		if (!slides[slideIdx]) return [];
		return Array.from(slides[slideIdx].querySelectorAll('.fragment'));
	}

    function next() {
        const fragments = getFragments(currentSlide);
        const visibleCount = fragmentIndex[currentSlide];
        if (visibleCount < fragments.length) {
            const frag = fragments[visibleCount];
            frag.classList.add('visible');
            fragmentIndex[currentSlide]++;

            if (frag.getAttribute('data-fragment-action') === 'show-sinus') {
                SunrisePlot.showSinus();
            }
            if (frag.getAttribute('data-fragment-action') === 'knowledge-step') {
                const step = parseInt(frag.getAttribute('data-knowledge-step'));
                KnowledgeViz.setStep(step);
            }
            if (frag.getAttribute('data-fragment-action') === 'manifold-align') {
                if (typeof animateDualManifoldAlignment === 'function') {
                    animateDualManifoldAlignment();
                }
            }
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

            if (frag.getAttribute('data-fragment-action') === 'show-sinus') {
                SunrisePlot.hideSinus();
            }
            if (frag.getAttribute('data-fragment-action') === 'knowledge-step') {
                const step = parseInt(frag.getAttribute('data-knowledge-step'));
                if (step > 0) {
                    KnowledgeViz.setStep(step - 1);
                }
            }
            if (frag.getAttribute('data-fragment-action') === 'manifold-align') {
                if (typeof resetDualManifold === 'function') {
                    resetDualManifold();
                }
            }
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

        if (showAllFragments) {
            const fragments = getFragments(currentSlide);
            fragments.forEach(f => f.classList.add('visible'));
            fragmentIndex[currentSlide] = fragments.length;
        } else {
            const fragments = getFragments(currentSlide);
            fragments.forEach(f => f.classList.remove('visible'));
            fragmentIndex[currentSlide] = 0;
        }

        if (typeof ResidualNotebook !== 'undefined') {
            ResidualNotebook.reset();
        }
        if (typeof AttentionDemo !== 'undefined') {
            AttentionDemo.reset();
        }
        // *** NEU: Embedding Auto-Demo ***
        if (typeof EmbeddingAutoDemo !== 'undefined') {
            if (EmbeddingAutoDemo.isOnEmbeddingSlide()) {
                EmbeddingAutoDemo.activate();
            } else {
                EmbeddingAutoDemo.reset();
            }
        }
        // *** NEU: NN Step Demo reset ***
        if (typeof NNStepDemo !== 'undefined') {
            NNStepDemo.reset();
        }
        // *** NEU: PredictionViz reset ***
        if (typeof PredictionViz !== 'undefined') {
            PredictionViz.reset();
        }

        updateUI();
        closeOverview();
        triggerSlideInit(currentSlide);
        setTimeout(fitSlides, 50);
    }

    function updateUI() {
        document.getElementById('slide-counter').textContent = `${currentSlide + 1} / ${slides.length}`;
        document.getElementById('btn-prev').disabled = (currentSlide === 0 && fragmentIndex[0] === 0);
        document.getElementById('btn-next').disabled = (currentSlide === slides.length - 1 && fragmentIndex[currentSlide] >= getFragments(currentSlide).length);
        const progress = ((currentSlide) / (slides.length - 1)) * 100;
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
        const ov = document.getElementById('slide-overview');
        ov.classList.toggle('visible');
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

// ============================================================
// KEYBOARD & TOUCH CONTROLS (mit Notebook-Integration + PredictionViz)
// ============================================================
document.addEventListener('keydown', (e) => {
	if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

	switch(e.key) {
		case 'ArrowRight':
		case ' ':
		case 'Enter':
		case 'PageDown':  // ← Presenter vorwärts-Taste
			e.preventDefault();
			if (typeof NNStepDemo !== 'undefined' && NNStepDemo.canGoNext()) {
				NNStepDemo.next();
			}
			else if (typeof TrainingViz !== 'undefined' && TrainingViz.canGoNext()) {
				TrainingViz.next();
			}
			else if (typeof AttentionDemo !== 'undefined' && AttentionDemo.canGoNext()) {
				AttentionDemo.next();
			}
			else if (typeof PEOrbitViz !== 'undefined' && PEOrbitViz.isOnPEOrbitSlide() && PEOrbitViz.canGoNext()) {
				PEOrbitViz.next();
			}
			else if (typeof ResidualNotebook !== 'undefined' && ResidualNotebook.isOnNotebookSlide() && ResidualNotebook.canGoNext()) {
				ResidualNotebook.nextLayer();
			}
			else if (typeof EmbeddingAutoDemo !== 'undefined' && EmbeddingAutoDemo.canGoNext()) {
				EmbeddingAutoDemo.next();
			}
			else if (typeof PredictionViz !== 'undefined' && PredictionViz.canGoNext()) {
				PredictionViz.next();
			}
			else {
				Presentation.next();
			}
			break;
		case 'ArrowLeft':
		case 'Backspace':
		case 'PageUp':    // ← Presenter rückwärts-Taste
			e.preventDefault();
			if (typeof NNStepDemo !== 'undefined' && NNStepDemo.canGoPrev()) {
				NNStepDemo.prev();
			}
			else if (typeof TrainingViz !== 'undefined' && TrainingViz.canGoPrev()) {
				TrainingViz.prev();
			}
			else if (typeof AttentionDemo !== 'undefined' && AttentionDemo.canGoPrev()) {
				AttentionDemo.prev();
			}
			else if (typeof PEOrbitViz !== 'undefined' && PEOrbitViz.isOnPEOrbitSlide() && PEOrbitViz.canGoPrev()) {
				PEOrbitViz.prev();
			}
			else if (typeof ResidualNotebook !== 'undefined' && ResidualNotebook.isOnNotebookSlide() && ResidualNotebook.canGoPrev()) {
				ResidualNotebook.prevLayer();
			}
			else if (typeof EmbeddingAutoDemo !== 'undefined' && EmbeddingAutoDemo.canGoPrev()) {
				EmbeddingAutoDemo.prev();
			}
			else if (typeof PredictionViz !== 'undefined' && PredictionViz.canGoPrev()) {
				PredictionViz.prev();
			}
			else {
				Presentation.prev();
			}
			break;
		case 'ArrowUp':
			e.preventDefault();
			if (typeof NNStepDemo !== 'undefined' && NNStepDemo.canGoPrev()) {
				NNStepDemo.prev();
			}
			else if (typeof TrainingViz !== 'undefined' && TrainingViz.canGoPrev()) {
				TrainingViz.prev();
			}
			else if (typeof AttentionDemo !== 'undefined' && AttentionDemo.canGoPrev()) {
				AttentionDemo.prev();
			}
			else if (typeof PEOrbitViz !== 'undefined' && PEOrbitViz.isOnPEOrbitSlide() && PEOrbitViz.canGoPrev()) {
				PEOrbitViz.prev();
			}
			else if (typeof ResidualNotebook !== 'undefined' && ResidualNotebook.isOnNotebookSlide() && ResidualNotebook.canGoPrev()) {
				ResidualNotebook.prevLayer();
			}
			else if (typeof EmbeddingAutoDemo !== 'undefined' && EmbeddingAutoDemo.canGoPrev()) {
				EmbeddingAutoDemo.prev();
			}
			else if (typeof PredictionViz !== 'undefined' && PredictionViz.canGoPrev()) {
				PredictionViz.prev();
			}
			else {
				Presentation.prev();
			}
			break;
		case 'ArrowDown':
			e.preventDefault();
			if (typeof NNStepDemo !== 'undefined' && NNStepDemo.canGoNext()) {
				NNStepDemo.next();
			}
			else if (typeof TrainingViz !== 'undefined' && TrainingViz.canGoNext()) {
				TrainingViz.next();
			}
			else if (typeof AttentionDemo !== 'undefined' && AttentionDemo.canGoNext()) {
				AttentionDemo.next();
			}
			else if (typeof PEOrbitViz !== 'undefined' && PEOrbitViz.isOnPEOrbitSlide() && PEOrbitViz.canGoNext()) {
				PEOrbitViz.next();
			}
			else if (typeof ResidualNotebook !== 'undefined' && ResidualNotebook.isOnNotebookSlide() && ResidualNotebook.canGoNext()) {
				ResidualNotebook.nextLayer();
			}
			else if (typeof EmbeddingAutoDemo !== 'undefined' && EmbeddingAutoDemo.canGoNext()) {
				EmbeddingAutoDemo.next();
			}
			else if (typeof PredictionViz !== 'undefined' && PredictionViz.canGoNext()) {
				PredictionViz.next();
			}
			else {
				Presentation.next();
			}
			break;
		case 'f':
		case 'F':
			e.preventDefault();
			Presentation.toggleFullscreen();
			break;
		case 'o':
		case 'O':
			e.preventDefault();
			Presentation.toggleOverview();
			break;
		case 'Escape':
			Presentation.closeOverview();
			break;
		case 'Home':
			e.preventDefault();
			Presentation.goTo(0);
			break;
		case 'End':
			e.preventDefault();
			Presentation.goTo(document.querySelectorAll('.slide').length - 1);
			break;
	}
});

// Touch/swipe support
let touchStartX = 0;
let touchStartY = 0;
document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) {
            // Swipe left = next
            if (typeof NNStepDemo !== 'undefined' && NNStepDemo.canGoNext()) {
                NNStepDemo.next();
            } else if (typeof ResidualNotebook !== 'undefined' && ResidualNotebook.isOnNotebookSlide() && ResidualNotebook.canGoNext()) {
                ResidualNotebook.nextLayer();
            } else if (typeof EmbeddingAutoDemo !== 'undefined' && EmbeddingAutoDemo.canGoNext()) {
                EmbeddingAutoDemo.next();
            } else if (typeof PredictionViz !== 'undefined' && PredictionViz.canGoNext()) {
                PredictionViz.next();
            } else {
                Presentation.next();
            }
        } else {
            // Swipe right = prev
            if (typeof NNStepDemo !== 'undefined' && NNStepDemo.canGoPrev()) {
                NNStepDemo.prev();
            } else if (typeof ResidualNotebook !== 'undefined' && ResidualNotebook.isOnNotebookSlide() && ResidualNotebook.canGoPrev()) {
                ResidualNotebook.prevLayer();
            } else if (typeof EmbeddingAutoDemo !== 'undefined' && EmbeddingAutoDemo.canGoPrev()) {
                EmbeddingAutoDemo.prev();
            } else if (typeof PredictionViz !== 'undefined' && PredictionViz.canGoPrev()) {
                PredictionViz.prev();
            } else {
                Presentation.prev();
            }
        }
    }
}, { passive: true });

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    Presentation.init();

    document.querySelectorAll('.math-display').forEach(function(el) {
        let tex = el.textContent.trim();
        if (tex.startsWith('$$') && tex.endsWith('$$')) {
            tex = tex.slice(2, -2);
        }
        try {
            el.innerHTML = temml.renderToString(tex, { displayMode: true });
        } catch(e) {
            console.warn('Temml render error:', e);
        }
    });

    document.querySelectorAll('.math-inline').forEach(function(el) {
        let tex = el.textContent.trim();
        if (tex.startsWith('$') && tex.endsWith('$')) {
            tex = tex.slice(1, -1);
        }
        try {
            el.innerHTML = temml.renderToString(tex, { displayMode: false });
        } catch(e) {
            console.warn('Temml inline render error:', e);
        }
    });

    if (typeof loadIntuitionModule === 'function') loadIntuitionModule();
    if (typeof runAttention === 'function') runAttention();
    $("#dim-btn-1").click();
});
