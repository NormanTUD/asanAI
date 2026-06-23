// ============================================================
// PRESENTATION ENGINE
// ============================================================
const Presentation = (() => {
    let currentSlide = 0;
    let slides = [];
    let fragmentIndex = {}; // tracks which fragments are visible per slide

    function init() {
        slides = Array.from(document.querySelectorAll('.slide'));
        // Initialize fragment tracking
        slides.forEach((slide, i) => {
            fragmentIndex[i] = 0;
        });
        updateUI();
        buildOverview();
    }

    function getFragments(slideIdx) {
        return Array.from(slides[slideIdx].querySelectorAll('.fragment'));
    }

function next() {
    const fragments = getFragments(currentSlide);
    const visibleCount = fragmentIndex[currentSlide];
    if (visibleCount < fragments.length) {
        const frag = fragments[visibleCount];
        frag.classList.add('visible');
        fragmentIndex[currentSlide]++;

        // Trigger sunrise sinus overlay
        if (frag.getAttribute('data-fragment-action') === 'show-sinus') {
            SunrisePlot.showSinus();
        }

        // Knowledge step handling
        if (frag.getAttribute('data-fragment-action') === 'knowledge-step') {
            const step = parseInt(frag.getAttribute('data-knowledge-step'));
            KnowledgeViz.setStep(step);
        }

        // Manifold alignment animation
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

        // Knowledge step — go back to previous step
        if (frag.getAttribute('data-fragment-action') === 'knowledge-step') {
            const step = parseInt(frag.getAttribute('data-knowledge-step'));
            if (step > 0) {
                KnowledgeViz.setStep(step - 1);
            }
        }

        // Manifold alignment — reset on backward
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
			// When going back, show all fragments
			const fragments = getFragments(currentSlide);
			fragments.forEach(f => f.classList.add('visible'));
			fragmentIndex[currentSlide] = fragments.length;
		} else {
			// Reset fragments when going forward to a new slide
			const fragments = getFragments(currentSlide);
			fragments.forEach(f => f.classList.remove('visible'));
			fragmentIndex[currentSlide] = 0;
		}

		updateUI();
		closeOverview();

		// Trigger any lazy-loaded demos on this slide
		triggerSlideInit(currentSlide);

		setTimeout(fitSlides, 50);
	}

    function updateUI() {
        document.getElementById('slide-counter').textContent = `${currentSlide + 1} / ${slides.length}`;
        document.getElementById('btn-prev').disabled = (currentSlide === 0 && fragmentIndex[0] === 0);
        document.getElementById('btn-next').disabled = (currentSlide === slides.length - 1 && fragmentIndex[currentSlide] >= getFragments(currentSlide).length);
        // Progress bar
        const progress = ((currentSlide) / (slides.length - 1)) * 100;
        document.getElementById('progress-bar').style.width = progress + '%';
        // Update overview highlights
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
        // Re-trigger Plotly relayout for visible plots
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
// KEYBOARD & TOUCH CONTROLS
// ============================================================
document.addEventListener('keydown', (e) => {
    // Don't capture if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch(e.key) {
        case 'ArrowRight':
        case ' ':
        case 'Enter':
            e.preventDefault();
            Presentation.next();
            break;
        case 'ArrowLeft':
        case 'Backspace':
            e.preventDefault();
            Presentation.prev();
            break;
        case 'ArrowUp':
            e.preventDefault();
            Presentation.prev();
            break;
        case 'ArrowDown':
            e.preventDefault();
            Presentation.next();
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
    // Only trigger if horizontal swipe is dominant
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) Presentation.next();
        else Presentation.prev();
    }
}, { passive: true });

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
	Presentation.init();

	// Render all TeX formulas using Temml
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

	// Initialize demos
	if (typeof loadIntuitionModule === 'function') loadIntuitionModule();
	if (typeof runAttention === 'function') runAttention();
	$("#dim-btn-1").click()
});

