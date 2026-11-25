// ============================================================
// HISTORY PRESENTATION ENGINE
// Basiert auf presentation.js, vereinfacht für die History-Präsentation
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

        // Visualisierungen initialisieren
        if (typeof HistoryViz !== 'undefined') {
            HistoryViz.init();
        }
    }

    function getFragments(slideIdx) {
        if (!slides[slideIdx]) return [];
        return Array.from(slides[slideIdx].querySelectorAll('.fragment'));
    }

    function next() {
        const fragments = getFragments(currentSlide);
        const visibleCount = fragmentIndex[currentSlide];
        if (visibleCount < fragments.length) {
            fragments[visibleCount].classList.add('visible');
            fragmentIndex[currentSlide]++;
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
            fragments[visibleCount - 1].classList.remove('visible');
            fragmentIndex[currentSlide]--;
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

        updateUI();
        closeOverview();
        triggerSlideInit(currentSlide);
        setTimeout(fitSlides, 50);
    }

    function updateUI() {
        const counter = document.getElementById('slide-counter');
        if (counter) counter.textContent = `${currentSlide + 1} / ${slides.length}`;

        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');
        if (btnPrev) btnPrev.disabled = (currentSlide === 0 && fragmentIndex[0] === 0);
        if (btnNext) btnNext.disabled = (currentSlide === slides.length - 1 && fragmentIndex[currentSlide] >= getFragments(currentSlide).length);

        const progress = ((currentSlide) / (slides.length - 1)) * 100;
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) progressBar.style.width = progress + '%';

        document.querySelectorAll('.overview-thumb').forEach((thumb, i) => {
            thumb.classList.toggle('current', i === currentSlide);
        });
    }

    function buildOverview() {
        const grid = document.getElementById('overview-grid');
        if (!grid) return;
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
        if (ov) ov.classList.toggle('visible');
    }

    function closeOverview() {
        const ov = document.getElementById('slide-overview');
        if (ov) ov.classList.remove('visible');
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    }

    function triggerSlideInit(idx) {
        // Re-render Plotly plots on slide change
        const plotDivs = slides[idx].querySelectorAll('[id*="plot"]');
        plotDivs.forEach(div => {
            if (div.data && div.layout) {
                Plotly.relayout(div, { autosize: true });
            }
        });

        // Render gate plots and timeline when their slides become active
        if (typeof HistoryViz !== 'undefined') {
            HistoryViz.init();
        }
    }

    return { init, next, prev, goTo, toggleOverview, toggleFullscreen, closeOverview };
})();

// ============================================================
// KEYBOARD CONTROLS – nur Pfeiltasten
// ============================================================
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch(e.key) {
        case 'ArrowRight':
        case ' ':
        case 'Enter':
        case 'PageDown':
        case 'ArrowDown':
            e.preventDefault();
            Presentation.next();
            break;
        case 'ArrowLeft':
        case 'Backspace':
        case 'PageUp':
        case 'ArrowUp':
            e.preventDefault();
            Presentation.prev();
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
document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(dx) > 50) {
        if (dx < 0) Presentation.next();
        else Presentation.prev();
    }
}, { passive: true });

// ============================================================
// FIT SLIDES & INIT
// ============================================================
function fitSlides() {
    const slides = document.querySelectorAll('.slide');
    const viewportHeight = window.innerHeight;

    slides.forEach(slide => {
        const content = slide.querySelector('.slide-content');
        if (!content) return;

        content.style.transform = 'scale(1)';
        const naturalHeight = content.scrollHeight;
        const available = viewportHeight - 52;
        const scale = Math.min(available / naturalHeight, 1);
        content.style.transform = `scale(${scale})`;
        content.style.transformOrigin = 'center center';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    Presentation.init();
    setTimeout(fitSlides, 300);
});

window.addEventListener('resize', fitSlides);
