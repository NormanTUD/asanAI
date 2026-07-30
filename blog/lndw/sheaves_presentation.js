// ============================================================
// SHEAVES PRESENTATION ENGINE + VISUALIZATIONS
// ============================================================

// ─── PRESENTATION ENGINE ───────────────────────────────────
const Presentation = (() => {
    let currentSlide = 0;
    let slides = [];
    let fragmentIndex = {};

    function init() {
        slides = Array.from(document.querySelectorAll('.slide'));
        slides.forEach((_, i) => { fragmentIndex[i] = 0; });
        updateUI();
        renderMath();
        // Initialize first visualization
        setTimeout(() => initVisualizations(), 300);
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
        if (currentSlide < slides.length - 1) goTo(currentSlide + 1);
    }

    function prev() {
        const fragments = getFragments(currentSlide);
        const visibleCount = fragmentIndex[currentSlide];
        if (visibleCount > 0) {
            fragments[visibleCount - 1].classList.remove('visible');
            fragmentIndex[currentSlide]--;
            return;
        }
        if (currentSlide > 0) goTo(currentSlide - 1, true);
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
        updateUI();
        initSlideViz(currentSlide);
    }

    function updateUI() {
        document.getElementById('slide-counter').textContent = `${currentSlide + 1} / ${slides.length}`;
        document.getElementById('btn-prev').disabled = (currentSlide === 0 && fragmentIndex[0] === 0);
        document.getElementById('btn-next').disabled = (currentSlide === slides.length - 1 && fragmentIndex[currentSlide] >= getFragments(currentSlide).length);
        const progress = (currentSlide / (slides.length - 1)) * 100;
        document.getElementById('progress-bar').style.width = progress + '%';
    }

    function renderMath() {
        document.querySelectorAll('.math-display').forEach(el => {
            let tex = el.textContent.trim();
            if (tex.startsWith('$$') && tex.endsWith('$$')) tex = tex.slice(2, -2);
            try { el.innerHTML = temml.renderToString(tex, { displayMode: true }); } catch (e) { console.warn('Temml error:', e); }
        });
        document.querySelectorAll('.math-inline').forEach(el => {
            let tex = el.textContent.trim();
            if (tex.startsWith('$') && tex.endsWith('$')) tex = tex.slice(1, -1);
            try { el.innerHTML = temml.renderToString(tex, { displayMode: false }); } catch (e) {}
        });
    }

    return { init, next, prev, goTo };
})();

// ─── INPUT HANDLING ────────────────────────────────────────
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (['ArrowRight', ' ', 'Enter', 'PageDown'].includes(e.key)) { e.preventDefault(); Presentation.next(); }
    else if (['ArrowLeft', 'Backspace', 'PageUp'].includes(e.key)) { e.preventDefault(); Presentation.prev(); }
});
document.addEventListener('DOMContentLoaded', () => Presentation.init());

// ─── VISUALIZATION REGISTRY ───────────────────────────────
const vizRegistry = {};
let activeVizAnimations = {};

function initVisualizations() {
    initSlideViz(0);
}

function initSlideViz(slideIdx) {
    // Stop all running animations
    Object.keys(activeVizAnimations).forEach(key => {
        if (activeVizAnimations[key]) cancelAnimationFrame(activeVizAnimations[key]);
    });
    activeVizAnimations = {};

    const slide = document.querySelectorAll('.slide')[slideIdx];
    if (!slide) return;
    const vizContainers = slide.querySelectorAll('.viz-container');
    vizContainers.forEach(container => {
        const id = container.id;
        if (vizRegistry[id]) vizRegistry[id](container);
    });
}

// ─── HELPER: Canvas Setup ──────────────────────────────────
function setupCanvas(container) {
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { canvas, ctx, W: rect.width, H: rect.height };
}

// ============================================================
// VIZ: PANORAMA (Slide 2)
// ============================================================
vizRegistry['viz-panorama'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    // Four "photos" as colored rectangles with patterns
    const photos = [
        { color: '#3b82f6', label: 'Foto 1', pattern: 'hills' },
        { color: '#10b981', label: 'Foto 2', pattern: 'trees' },
        { color: '#f59e0b', label: 'Foto 3', pattern: 'house' },
        { color: '#8b5cf6', label: 'Foto 4', pattern: 'sky' },
    ];

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        const photoW = W * 0.22;
        const photoH = H * 0.6;
        const overlapW = photoW * 0.15;
        const startX = (W - (photos.length * photoW - (photos.length - 1) * overlapW)) / 2;
        const startY = (H - photoH) / 2;

        // Draw photos
        photos.forEach((photo, i) => {
            const x = startX + i * (photoW - overlapW);
            const y = startY;

            // Photo body
            ctx.fillStyle = photo.color + '40';
            ctx.fillRect(x, y, photoW, photoH);
            ctx.strokeStyle = photo.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, photoW, photoH);

            // Simple pattern inside
            ctx.fillStyle = photo.color + '60';
            for (let py = 0; py < 5; py++) {
                for (let px = 0; px < 3; px++) {
                    const dotX = x + 15 + px * (photoW - 30) / 2;
                    const dotY = y + 20 + py * (photoH - 40) / 4;
                    ctx.beginPath();
                    ctx.arc(dotX, dotY, 3 + Math.sin(t * 0.02 + i + py) * 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Label
            ctx.font = 'bold 11px system-ui';
            ctx.fillStyle = photo.color;
            ctx.textAlign = 'center';
            ctx.fillText(photo.label, x + photoW / 2, y + photoH + 18);

            // Overlap zone highlight
            if (i < photos.length - 1) {
                const overlapX = x + photoW - overlapW;
                const pulse = 0.3 + 0.2 * Math.sin(t * 0.04 + i);
                ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
                ctx.fillRect(overlapX, y, overlapW, photoH);

                // Overlap label
                ctx.font = '9px system-ui';
                ctx.fillStyle = `rgba(255, 255, 255, ${pulse + 0.3})`;
                ctx.textAlign = 'center';
                ctx.fillText('Überlappung', overlapX + overlapW / 2, y - 8);

                // Check mark
                ctx.font = '14px system-ui';
                ctx.fillText('✓', overlapX + overlapW / 2, y + photoH / 2);
            }
        });

        // Title
        ctx.font = 'bold 13px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Panorama: Lokale Bilder müssen in der Überlappung übereinstimmen', W / 2, 20);

        // Arrow showing "global section"
        const arrowY = startY + photoH + 40;
        ctx.beginPath();
        ctx.moveTo(startX, arrowY);
        ctx.lineTo(startX + photos.length * (photoW - overlapW) + overlapW, arrowY);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '10px system-ui';
        ctx.fillStyle = '#a5b4fc';
        ctx.textAlign = 'center';
        ctx.fillText('→ Globaler Schnitt (das fertige Panorama)', W / 2, arrowY + 14);

        activeVizAnimations['viz-panorama'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: SHEAF VENN DIAGRAM (Slide 3)
// ============================================================
vizRegistry['viz-sheaf-venn'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    const circles = [
        { x: W * 0.35, y: H * 0.45, r: W * 0.18, color: '#3b82f6', label: 'U₁' },
        { x: W * 0.55, y: H * 0.35, r: W * 0.16, color: '#10b981', label: 'U₂' },
        { x: W * 0.50, y: H * 0.60, r: W * 0.15, color: '#f59e0b', label: 'U₃' },
    ];

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        // Draw circles
        circles.forEach((c, i) => {
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            ctx.fillStyle = c.color + '15';
            ctx.fill();
            ctx.strokeStyle = c.color + '80';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            ctx.font = 'bold 14px system-ui';
            ctx.fillStyle = c.color;
            ctx.textAlign = 'center';
            ctx.fillText(c.label, c.x, c.y - c.r - 10);

            // Data points inside
            for (let d = 0; d < 5; d++) {
                const angle = (d / 5) * Math.PI * 2 + t * 0.005;
                const dist = c.r * 0.5;
                const dx = c.x + Math.cos(angle) * dist;
                const dy = c.y + Math.sin(angle) * dist;
                ctx.beginPath();
                ctx.arc(dx, dy, 3, 0, Math.PI * 2);
                ctx.fillStyle = c.color + '80';
                ctx.fill();
            }
        });

        // Highlight overlaps
        const pulse = 0.4 + 0.3 * Math.sin(t * 0.03);

        // U1 ∩ U2
        ctx.font = '10px system-ui';
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.textAlign = 'center';
        ctx.fillText('U₁ ∩ U₂', W * 0.45, H * 0.35);
        ctx.fillText('Daten stimmen', W * 0.45, H * 0.35 + 12);
        ctx.fillText('überein ✓', W * 0.45, H * 0.35 + 24);

        // Legend
        ctx.font = '11px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText('Jeder Kreis = eine offene Menge mit lokalen Daten', 20, H - 20);

        activeVizAnimations['viz-sheaf-venn'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: STALKS (Slide 4)
// ============================================================
vizRegistry['viz-stalks'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        const cx = W / 2;
        const cy = H / 2;

        // Central point (the stalk point)
        const pulse = 1 + 0.15 * Math.sin(t * 0.05);
        ctx.beginPath();
        ctx.arc(cx, cy, 12 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText('Punkt x', cx, cy + 28);
        ctx.fillText('(Halm)', cx, cy + 42);

        // Incoming information from different open sets
        const sources = [
            { angle: -Math.PI * 0.7, label: 'F(U₁)', color: '#3b82f6', desc: 'Schnitt auf U₁' },
            { angle: -Math.PI * 0.3, label: 'F(U₂)', color: '#10b981', desc: 'Schnitt auf U₂' },
            { angle: Math.PI * 0.1, label: 'F(U₃)', color: '#f59e0b', desc: 'Schnitt auf U₃' },
            { angle: Math.PI * 0.5, label: 'F(U₄)', color: '#8b5cf6', desc: 'Schnitt auf U₄' },
            { angle: Math.PI * 0.85, label: 'F(U₅)', color: '#ec4899', desc: 'Schnitt auf U₅' },
        ];

        const radius = Math.min(W, H) * 0.35;

        sources.forEach((src, i) => {
            const sx = cx + Math.cos(src.angle) * radius;
            const sy = cy + Math.sin(src.angle) * radius;

            // Animated flow line
            const flowProgress = (t * 0.01 + i * 0.2) % 1;
            const fx = sx + (cx - sx) * flowProgress;
            const fy = sy + (cy - sy) * flowProgress;

            // Connection line
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(cx, cy);
            ctx.strokeStyle = src.color + '40';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Flow dot
            ctx.beginPath();
            ctx.arc(fx, fy, 4, 0, Math.PI * 2);
            ctx.fillStyle = src.color;
            ctx.fill();

            // Source circle
            ctx.beginPath();
            ctx.arc(sx, sy, 20, 0, Math.PI * 2);
            ctx.fillStyle = src.color + '30';
            ctx.fill();
            ctx.strokeStyle = src.color;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Labels
            ctx.font = 'bold 11px system-ui';
            ctx.fillStyle = src.color;
            ctx.textAlign = 'center';
            ctx.fillText(src.label, sx, sy + 4);

            ctx.font = '9px system-ui';
            ctx.fillStyle = src.color + 'aa';
            ctx.fillText(src.desc, sx, sy + 32);
        });

        // Title
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Der Halm: Alle lokale Information fließt an einem Punkt zusammen', W / 2, 20);

        activeVizAnimations['viz-stalks'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: BIRD (Slide 5) - Two senses meeting at one event
// ============================================================
vizRegistry['viz-bird'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        const cx = W / 2;
        const cy = H / 2;

        // Visual layer (top)
        const vizY = H * 0.25;
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#60a5fa';
        ctx.textAlign = 'center';
        ctx.fillText('Visuell: Vogel fliegt durchs Bild', cx, vizY - 30);

        // Draw "visual" wave
        ctx.beginPath();
        for (let x = 0; x < W; x += 2) {
            const y = vizY + Math.sin(x * 0.03 + t * 0.02) * 15;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Audio layer (bottom)
        const audY = H * 0.75;
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.fillText('Auditiv: Vogelgesang', cx, audY - 30);

        // Draw "audio" wave
        ctx.beginPath();
        for (let x = 0; x < W; x += 2) {
            const y = audY + Math.sin(x * 0.05 + t * 0.03) * 10 * Math.sin(x * 0.01);
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Meeting point (the real event)
        const meetPulse = 1 + 0.2 * Math.sin(t * 0.05);
        ctx.beginPath();
        ctx.arc(cx, cy, 20 * meetPulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = 'bold 13px system-ui';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText('Reales Ereignis', cx, cy + 5);
        ctx.font = '10px system-ui';
        ctx.fillText('(Halm)', cx, cy + 20);

        // Connection lines
        ctx.beginPath();
        ctx.moveTo(cx, vizY + 15);
        ctx.lineTo(cx, cy - 20);
        ctx.strokeStyle = '#3b82f680';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, audY - 15);
        ctx.lineTo(cx, cy + 25);
        ctx.strokeStyle = '#f59e0b80';
        ctx.stroke();
        ctx.setLineDash([]);

        activeVizAnimations['viz-bird'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: TOPOLOGY (Slide 6) - Cup to Donut
// ============================================================
vizRegistry['viz-topology'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        // Morphing parameter
        const morph = (Math.sin(t * 0.01) + 1) / 2; // 0 to 1

        const cx = W / 2;
        const cy = H / 2;

        // Draw a simplified cup-to-donut morph
        // Cup: rectangle with handle
        // Donut: torus shape (ellipse with hole)

        const cupAlpha = 1 - morph;
        const donutAlpha = morph;

        // Cup (left side emphasis when morph is low)
        if (cupAlpha > 0.01) {
            ctx.globalAlpha = cupAlpha;
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 3;

            // Cup body
            ctx.beginPath();
            ctx.ellipse(cx - 80, cy, 40, 50, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Handle
            ctx.beginPath();
            ctx.ellipse(cx - 30, cy, 15, 25, 0, -Math.PI * 0.5, Math.PI * 0.5);
            ctx.stroke();

            ctx.font = '11px system-ui';
            ctx.fillStyle = '#60a5fa';
            ctx.textAlign = 'center';
            ctx.fillText('Tasse', cx - 80, cy + 70);
            ctx.globalAlpha = 1;
        }

        // Donut (right side emphasis when morph is high)
        if (donutAlpha > 0.01) {
            ctx.globalAlpha = donutAlpha;
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;

            // Outer ellipse
            ctx.beginPath();
            ctx.ellipse(cx + 80, cy, 50, 35, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Inner hole
            ctx.beginPath();
            ctx.ellipse(cx + 80, cy, 20, 12, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.font = '11px system-ui';
            ctx.fillStyle = '#10b981';
            ctx.textAlign = 'center';
            ctx.fillText('Donut (Torus)', cx + 80, cy + 55);
            ctx.globalAlpha = 1;
        }

        // Equivalence symbol
        ctx.font = 'bold 20px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('≃', cx, cy);

        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('homotopieäquivalent', cx, cy + 18);
        ctx.fillText('(1 Loch = 1 Loch)', cx, cy + 32);

        // Title
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Topologie: Gleiche Struktur, verschiedene Form', W / 2, 25);

        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Stetige Verformung ohne Schneiden oder Kleben', W / 2, H - 15);

        activeVizAnimations['viz-topology'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: COHOMOLOGY (Slide 7) - Winding number on circle
// ============================================================
vizRegistry['viz-cohomology'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        const cx = W / 2;
        const cy = H / 2;
        const radius = Math.min(W, H) * 0.28;

        // Draw the circle S¹
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Three covering arcs U₁, U₂, U₃
        const arcs = [
            { start: -0.3, end: 2.4, color: '#3b82f6', label: 'U₁' },
            { start: 1.8, end: 4.5, color: '#10b981', label: 'U₂' },
            { start: 4.0, end: 6.6, color: '#f59e0b', label: 'U₃' },
        ];

        arcs.forEach((arc, i) => {
            const pulse = 0.6 + 0.2 * Math.sin(t * 0.03 + i);
            ctx.beginPath();
            ctx.arc(cx, cy, radius + 8, arc.start, arc.end);
            ctx.strokeStyle = arc.color;
            ctx.lineWidth = 12;
            ctx.globalAlpha = pulse;
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Label
            const midAngle = (arc.start + arc.end) / 2;
            const lx = cx + Math.cos(midAngle) * (radius + 30);
            const ly = cy + Math.sin(midAngle) * (radius + 30);
            ctx.font = 'bold 12px system-ui';
            ctx.fillStyle = arc.color;
            ctx.textAlign = 'center';
            ctx.fillText(arc.label, lx, ly);
        });

        // Attempt to define an angle function – show the "jump"
        const jumpAngle = -0.3 + ((t * 0.005) % (Math.PI * 2));
        const jumpX = cx + Math.cos(jumpAngle) * radius;
        const jumpY = cy + Math.sin(jumpAngle) * radius;

        // Moving "angle value" indicator
        ctx.beginPath();
        ctx.arc(jumpX, jumpY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        // Show the angle value as a bar
        const barX = W * 0.75;
        const barY = 50;
        const barH = H - 100;
        const normalizedAngle = ((jumpAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const barFill = normalizedAngle / (Math.PI * 2);

        ctx.fillStyle = '#334155';
        ctx.fillRect(barX, barY, 20, barH);

        // The "value" – shows discontinuity
        const valueY = barY + barFill * barH;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(barX, barY, 20, barFill * barH);

        // Jump indicator
        if (barFill > 0.95 || barFill < 0.05) {
            const jumpPulse = 0.5 + 0.5 * Math.sin(t * 0.1);
            ctx.font = 'bold 14px system-ui';
            ctx.fillStyle = `rgba(239, 68, 68, ${jumpPulse})`;
            ctx.textAlign = 'left';
            ctx.fillText('⚡ SPRUNG!', barX + 30, barY + barH / 2);
        }

        // Labels
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('0', barX + 10, barY - 5);
        ctx.fillText('2π', barX + 10, barY + barH + 14);

        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Winkelfunktion auf dem Kreis: global unmöglich!', cx, 20);

        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('H¹(S¹, ℤ) = ℤ — die Windungszahl misst die Obstruktion', cx, H - 12);

        activeVizAnimations['viz-cohomology'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: ČECH COHOMOLOGY (Slide 8)
// ============================================================
vizRegistry['viz-cech'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    const circles = [
        { x: W * 0.3, y: H * 0.5, r: W * 0.17, color: '#3b82f6', label: 'U₁', data: 's₁' },
        { x: W * 0.5, y: H * 0.35, r: W * 0.16, color: '#10b981', label: 'U₂', data: 's₂' },
        { x: W * 0.55, y: H * 0.6, r: W * 0.15, color: '#f59e0b', label: 'U₃', data: 's₃' },
    ];

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        // Draw circles
        circles.forEach((c, i) => {
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            ctx.fillStyle = c.color + '12';
            ctx.fill();
            ctx.strokeStyle = c.color + '70';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = c.color;
            ctx.textAlign = 'center';
            ctx.fillText(c.label, c.x, c.y - c.r - 8);

            // Data label
            ctx.font = '11px system-ui';
            ctx.fillStyle = c.color + 'cc';
            ctx.fillText(c.data, c.x, c.y);
        });

        // Overlaps with animated check marks
        const overlaps = [
            { x: W * 0.4, y: H * 0.4, label: 'U₁∩U₂' },
            { x: W * 0.44, y: H * 0.55, label: 'U₁∩U₃' },
            { x: W * 0.54, y: H * 0.48, label: 'U₂∩U₃' },
        ];

        overlaps.forEach((ov, i) => {
            const pulse = 0.5 + 0.3 * Math.sin(t * 0.04 + i * 1.5);
            ctx.font = '9px system-ui';
            ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
            ctx.textAlign = 'center';
            ctx.fillText(ov.label, ov.x, ov.y - 8);

            // Check or X based on animation phase
            const phase = (t * 0.01 + i * 0.5) % 4;
            if (phase < 3) {
                ctx.font = '14px system-ui';
                ctx.fillStyle = `rgba(74, 222, 128, ${pulse})`;
                ctx.fillText('✓', ov.x, ov.y + 10);
            } else {
                ctx.font = '14px system-ui';
                ctx.fillStyle = `rgba(248, 113, 113, ${pulse})`;
                ctx.fillText('✗', ov.x, ov.y + 10);
            }
        });

        // Right side: C⁰ → C¹ diagram
        const diagramX = W * 0.75;
        const diagramY = H * 0.3;

        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('C⁰', diagramX - 40, diagramY);
        ctx.fillText('→', diagramX, diagramY);
        ctx.fillText('C¹', diagramX + 40, diagramY);

        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('δ', diagramX, diagramY - 12);
        ctx.fillText('(s₁,s₂,s₃)', diagramX - 40, diagramY + 18);
        ctx.fillText('Fehler?', diagramX + 40, diagramY + 18);

        // H⁰ and H¹ boxes
        const boxY = diagramY + 50;
        ctx.fillStyle = 'rgba(74, 222, 128, 0.15)';
        ctx.fillRect(diagramX - 70, boxY, 60, 40);
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 1;
        ctx.strokeRect(diagramX - 70, boxY, 60, 40);
        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = '#4ade80';
        ctx.textAlign = 'center';
        ctx.fillText('H⁰', diagramX - 40, boxY + 16);
        ctx.font = '9px system-ui';
        ctx.fillText('= globale', diagramX - 40, boxY + 30);
        ctx.fillText('Schnitte', diagramX - 40, boxY + 40);

        ctx.fillStyle = 'rgba(248, 113, 113, 0.15)';
        ctx.fillRect(diagramX + 10, boxY, 60, 40);
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 1;
        ctx.strokeRect(diagramX + 10, boxY, 60, 40);
        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = '#f87171';
        ctx.fillText('H¹', diagramX + 40, boxY + 16);
        ctx.font = '9px system-ui';
        ctx.fillText('= echte', diagramX + 40, boxY + 30);
        ctx.fillText('Obstruktion', diagramX + 40, boxY + 40);

        // Title
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Čech-Kohomologie: Fehler in Überlappungen messen', W / 2, 18);

        activeVizAnimations['viz-cech'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: LASER THERMOMETER / FALSIFICATION (Slide 9)
// ============================================================
vizRegistry['viz-laser'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        const targetX = W / 2;
        const targetY = H / 2;

        // Target object (a cup)
        ctx.font = '40px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☕', targetX, targetY);

        ctx.font = '11px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Objekt (reale Temperatur: 82°C)', targetX, targetY + 35);

        // Thermometer 1 (left)
        const t1x = W * 0.2;
        const t1y = H * 0.3;
        ctx.font = '24px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌡️', t1x, t1y);

        // Laser beam 1
        const beamPulse1 = 0.5 + 0.3 * Math.sin(t * 0.08);
        ctx.beginPath();
        ctx.moveTo(t1x + 20, t1y + 10);
        ctx.lineTo(targetX - 25, targetY - 10);
        ctx.strokeStyle = `rgba(239, 68, 68, ${beamPulse1})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Reading 1
        ctx.font = 'bold 14px system-ui';
        ctx.fillStyle = '#4ade80';
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'center';
        ctx.fillText('82°C ✓', t1x, t1y + 35);
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Messgerät A', t1x, t1y + 50);

        // Thermometer 2 (right)
        const t2x = W * 0.8;
        const t2y = H * 0.3;
        ctx.font = '24px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌡️', t2x, t2y);

        // Laser beam 2
        const beamPulse2 = 0.5 + 0.3 * Math.sin(t * 0.08 + 1);
        ctx.beginPath();
        ctx.moveTo(t2x - 20, t2y + 10);
        ctx.lineTo(targetX + 25, targetY - 10);
        ctx.strokeStyle = `rgba(239, 68, 68, ${beamPulse2})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Reading 2 – oscillates between correct and wrong
        const phase = Math.sin(t * 0.015);
        const reading2 = phase > 0 ? '82°C ✓' : '92°C ✗';
        const color2 = phase > 0 ? '#4ade80' : '#f87171';

        ctx.font = 'bold 14px system-ui';
        ctx.fillStyle = color2;
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'center';
        ctx.fillText(reading2, t2x, t2y + 35);
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Messgerät B', t2x, t2y + 50);

        // Overlap zone
        const overlapPulse = phase > 0 ? 0.3 : 0.6;
        const overlapColor = phase > 0 ? 'rgba(74, 222, 128,' : 'rgba(248, 113, 113,';
        ctx.beginPath();
        ctx.arc(targetX, targetY - 50, 30, 0, Math.PI * 2);
        ctx.fillStyle = overlapColor + overlapPulse + ')';
        ctx.fill();

        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = phase > 0 ? '#4ade80' : '#f87171';
        ctx.textAlign = 'center';
        ctx.fillText(phase > 0 ? 'Verklebbar ✓' : 'NICHT verklebbar ✗', targetX, targetY - 48);

        // Bottom text
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Zwei Messungen auf denselben Punkt: stimmen sie überein?', W / 2, H - 30);

        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Konsistenz ≠ Beweis | Inkonsistenz = Falsifikation (Popper)', W / 2, H - 12);

        activeVizAnimations['viz-laser'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: FIBER BUNDLE (Slide 10)
// ============================================================
vizRegistry['viz-fiber'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        // Left: Cylinder (trivial bundle)
        const leftCx = W * 0.28;
        const leftCy = H * 0.55;
        const cylW = W * 0.18;
        const cylH = H * 0.5;

        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#60a5fa';
        ctx.textAlign = 'center';
        ctx.fillText('Trivial: Zylinder (S¹ × ℝ)', leftCx, 30);

        // Draw cylinder as parallel vertical lines on a circle
        const numFibers = 16;
        for (let i = 0; i < numFibers; i++) {
            const angle = (i / numFibers) * Math.PI * 2 + t * 0.005;
            const x = leftCx + Math.cos(angle) * cylW * 0.5;
            const depth = Math.sin(angle);
            const alpha = 0.3 + 0.4 * (depth + 1) / 2;

            ctx.beginPath();
            ctx.moveTo(x, leftCy - cylH * 0.4);
            ctx.lineTo(x, leftCy + cylH * 0.4);
            ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Base circle (bottom)
        ctx.beginPath();
        ctx.ellipse(leftCx, leftCy + cylH * 0.4, cylW * 0.5, cylW * 0.15, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Base circle (top)
        ctx.beginPath();
        ctx.ellipse(leftCx, leftCy - cylH * 0.4, cylW * 0.5, cylW * 0.15, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#60a5fa80';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Basis: S¹', leftCx, leftCy + cylH * 0.4 + 25);
        ctx.fillText('Faser: ℝ', leftCx + cylW * 0.5 + 20, leftCy);

        // Right: Möbius band (non-trivial bundle)
        const rightCx = W * 0.72;
        const rightCy = H * 0.55;

        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.fillText('Nicht-trivial: Möbiusband', rightCx, 30);

        // Draw Möbius strip approximation
        const mR = W * 0.14;
        const mW = H * 0.12;
        const numStrips = 60;

        for (let i = 0; i < numStrips; i++) {
            const angle = (i / numStrips) * Math.PI * 2;
            const nextAngle = ((i + 1) / numStrips) * Math.PI * 2;

            // Möbius twist: the fiber rotates by π over one full loop
            const twist = angle / 2;
            const nextTwist = nextAngle / 2;

            const x1 = rightCx + Math.cos(angle) * mR;
            const y1 = rightCy + Math.sin(angle) * mR * 0.4;
            const depth1 = Math.sin(angle);

            // Top and bottom of fiber at this angle
            const fiberTop1 = { x: x1 + Math.cos(twist) * mW * 0.3 * depth1, y: y1 - Math.sin(twist) * mW * 0.5 };
            const fiberBot1 = { x: x1 - Math.cos(twist) * mW * 0.3 * depth1, y: y1 + Math.sin(twist) * mW * 0.5 };

            const alpha = 0.3 + 0.4 * (depth1 + 1) / 2;
            ctx.beginPath();
            ctx.moveTo(fiberTop1.x, fiberTop1.y);
            ctx.lineTo(fiberBot1.x, fiberBot1.y);
            ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Highlight the twist
        const twistAngle = (t * 0.01) % (Math.PI * 2);
        const twistX = rightCx + Math.cos(twistAngle) * mR;
        const twistY = rightCy + Math.sin(twistAngle) * mR * 0.4;
        ctx.beginPath();
        ctx.arc(twistX, twistY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('Basis: S¹', rightCx, rightCy + mR * 0.4 + 40);
        ctx.fillText('Nach einer Umrundung:', rightCx, H - 40);
        ctx.fillStyle = '#f87171';
        ctx.fillText('oben/unten vertauscht!', rightCx, H - 25);

        // Title
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Faserbündel: lokal gleich, global verschieden', W / 2, H - 8);

        activeVizAnimations['viz-fiber'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: GAUGE THEORY / PARALLEL TRANSPORT (Slide 11)
// ============================================================
vizRegistry['viz-gauge'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        const cx = W / 2;
        const cy = H / 2;
        const sphereR = Math.min(W, H) * 0.3;

        // Draw sphere (wireframe)
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.2)';
        ctx.lineWidth = 1;

        // Latitude lines
        for (let lat = -3; lat <= 3; lat++) {
            const y = lat / 4;
            const r = Math.sqrt(1 - y * y) * sphereR;
            const yPos = cy + y * sphereR * 0.6;
            ctx.beginPath();
            ctx.ellipse(cx, yPos, r, r * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Longitude lines
        for (let lon = 0; lon < 8; lon++) {
            const angle = (lon / 8) * Math.PI;
            ctx.beginPath();
            ctx.ellipse(cx, cy, sphereR * Math.cos(angle), sphereR * 0.9, angle * 0.3, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Transport path (a triangle on the sphere)
        const pathProgress = (t * 0.003) % 1;
        const pathPoints = [];
        const numPathPoints = 60;

        for (let i = 0; i <= numPathPoints; i++) {
            const frac = i / numPathPoints;
            let angle, lat;

            if (frac < 0.33) {
                // Segment 1: along equator
                const localFrac = frac / 0.33;
                angle = localFrac * Math.PI / 2;
                lat = 0;
            } else if (frac < 0.66) {
                // Segment 2: up to pole
                const localFrac = (frac - 0.33) / 0.33;
                angle = Math.PI / 2;
                lat = localFrac * Math.PI / 2 * 0.7;
            } else {
                // Segment 3: back to start
                const localFrac = (frac - 0.66) / 0.34;
                angle = Math.PI / 2 * (1 - localFrac);
                lat = Math.PI / 2 * 0.7 * (1 - localFrac);
            }

            const x = cx + Math.cos(angle) * Math.cos(lat) * sphereR;
            const y = cy - Math.sin(lat) * sphereR * 0.9;
            pathPoints.push({ x, y, angle, lat });
        }

        // Draw path
        ctx.beginPath();
        pathPoints.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Current position on path
        const currentIdx = Math.floor(pathProgress * numPathPoints);
        const currentPoint = pathPoints[currentIdx] || pathPoints[0];

        // Draw vector at current position (rotates due to holonomy)
        const vectorAngle = pathProgress * Math.PI * 0.25; // Holonomy rotation
        const vecLen = 25;
        const vecEndX = currentPoint.x + Math.cos(vectorAngle) * vecLen;
        const vecEndY = currentPoint.y - Math.sin(vectorAngle) * vecLen;

        ctx.beginPath();
        ctx.moveTo(currentPoint.x, currentPoint.y);
        ctx.lineTo(vecEndX, vecEndY);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Arrowhead
        const arrowAngle = Math.atan2(vecEndY - currentPoint.y, vecEndX - currentPoint.x);
        ctx.beginPath();
        ctx.moveTo(vecEndX, vecEndY);
        ctx.lineTo(vecEndX - 10 * Math.cos(arrowAngle - 0.4), vecEndY - 10 * Math.sin(arrowAngle - 0.4));
        ctx.lineTo(vecEndX - 10 * Math.cos(arrowAngle + 0.4), vecEndY - 10 * Math.sin(arrowAngle + 0.4));
        ctx.closePath();
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        // Current position dot
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Show initial vs final vector direction
        if (pathProgress > 0.95) {
            const holonomyPulse = 0.5 + 0.5 * Math.sin(t * 0.1);
            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = `rgba(239, 68, 68, ${holonomyPulse})`;
            ctx.textAlign = 'center';
            ctx.fillText('Holonomie! Vektor hat sich gedreht!', cx, H - 50);
        }

        // Title
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Paralleltransport auf der Kugel: der Vektor dreht sich', W / 2, 20);

        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Die Drehung nach einer Schleife = Holonomie = Krümmung', W / 2, 38);

        activeVizAnimations['viz-gauge'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: CALIBRATION / GAUGE TRANSFORMATION (Slide 12)
// ============================================================
vizRegistry['viz-calibration'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        // Two thermometers
        const t1x = W * 0.25;
        const t2x = W * 0.75;
        const ty = H * 0.4;

        // Draw thermometer bodies
        function drawThermometer(x, y, reading, label, isCorrect) {
            // Thermometer body
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.roundRect(x - 20, y - 60, 40, 120, 8);
            ctx.fill();
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Mercury level
            const mercuryHeight = (reading / 100) * 80;
            ctx.fillStyle = isCorrect ? '#ef4444' : '#f97316';
            ctx.fillRect(x - 8, y + 40 - mercuryHeight, 16, mercuryHeight);

            // Bulb
            ctx.beginPath();
            ctx.arc(x, y + 50, 14, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.fill();

            // Reading display
            ctx.font = 'bold 16px monospace';
            ctx.fillStyle = isCorrect ? '#4ade80' : '#f87171';
            ctx.textAlign = 'center';
            ctx.fillText(`${reading}°C`, x, y - 75);

            // Label
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(label, x, y + 80);
        }

        // Real temperature
        const realTemp = 25;
        const offset = 10;

        // Animate: oscillate between showing correct and offset reading
        let t = 0;
        animationRunning = true;

        function draw() {
            if (!animationRunning) return;
            t++;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, W, H);

            // Title
            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = '#e2e8f0';
            ctx.textAlign = 'center';
            ctx.fillText('Eichtheorie: Zwei Thermometer, eine Realität', W / 2, 25);

            // Target object
            ctx.font = '30px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('☕', W / 2, ty + 20);
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(`Reale Temperatur: ${realTemp}°C`, W / 2, ty + 45);

            // Thermometer A (correct)
            drawThermometer(t1x, ty, realTemp, 'Messgerät A (korrekt)', true);

            // Thermometer B (offset by +10°)
            drawThermometer(t2x, ty, realTemp + offset, 'Messgerät B (+10° Offset)', false);

            // Gauge transformation arrow
            const arrowY = H * 0.72;
            const arrowStartX = t1x + 40;
            const arrowEndX = t2x - 40;
            const arrowMidX = (arrowStartX + arrowEndX) / 2;

            // Curved arrow
            ctx.beginPath();
            ctx.moveTo(arrowStartX, arrowY);
            ctx.quadraticCurveTo(arrowMidX, arrowY + 40, arrowEndX, arrowY);
            ctx.strokeStyle = '#a78bfa';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Arrowhead
            ctx.beginPath();
            ctx.moveTo(arrowEndX, arrowY);
            ctx.lineTo(arrowEndX - 10, arrowY - 6);
            ctx.lineTo(arrowEndX - 10, arrowY + 6);
            ctx.closePath();
            ctx.fillStyle = '#a78bfa';
            ctx.fill();

            // Label on arrow
            ctx.font = 'bold 12px system-ui';
            ctx.fillStyle = '#a78bfa';
            ctx.textAlign = 'center';
            ctx.fillText('Eichtransformation: −10°', arrowMidX, arrowY + 55);

            // In HoTT: path label
            const pulse = 0.6 + 0.3 * Math.sin(t * 0.04);
            ctx.font = '10px system-ui';
            ctx.fillStyle = `rgba(167, 139, 250, ${pulse})`;
            ctx.fillText('In HoTT: ein Pfad (Beweis der Gleichheit)', arrowMidX, arrowY + 72);

            // Equality statement
            ctx.font = 'bold 14px system-ui';
            ctx.fillStyle = '#e2e8f0';
            ctx.textAlign = 'center';
            ctx.fillText('25°C  ≡  35°C − 10°C', W / 2, H - 40);
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#64748b';
            ctx.fillText('Gleiche physikalische Realität, verschiedene Eichung', W / 2, H - 22);

            activeVizAnimations['viz-calibration'] = requestAnimationFrame(draw);
        }
        draw();
};

// ============================================================
// VIZ: ∞-GARBEN / HOMOTOPY (Slide 13)
// ============================================================
vizRegistry['viz-infinity'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    // Timeline: 10000 BC to today
    const timelineY = H / 2;
    const timelineStartX = 60;
    const timelineEndX = W - 60;

    const epochs = [
        { x: 0.0, label: '10.000 BC', desc: 'Wildnis' },
        { x: 0.2, label: '5.000 BC', desc: 'Dorf' },
        { x: 0.4, label: '1.000 BC', desc: 'Siedlung' },
        { x: 0.6, label: '500 AD', desc: 'Stadt' },
        { x: 0.8, label: '1800', desc: 'Industrie' },
        { x: 1.0, label: 'Heute', desc: 'Metropole' },
    ];

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        // Title
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('∞-Garbe: Verklebung bis auf Homotopie (stetiger Pfad)', W / 2, 22);

        // Timeline line
        ctx.beginPath();
        ctx.moveTo(timelineStartX, timelineY);
        ctx.lineTo(timelineEndX, timelineY);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Animated progress
        const progress = (Math.sin(t * 0.008) + 1) / 2; // 0 to 1

        // Draw epochs
        epochs.forEach((epoch, i) => {
            const x = timelineStartX + epoch.x * (timelineEndX - timelineStartX);

            // Dot
            const isActive = Math.abs(epoch.x - progress) < 0.12;
            const dotSize = isActive ? 8 : 5;
            ctx.beginPath();
            ctx.arc(x, timelineY, dotSize, 0, Math.PI * 2);
            ctx.fillStyle = isActive ? '#6366f1' : '#64748b';
            ctx.fill();

            // Label
            ctx.font = isActive ? 'bold 11px system-ui' : '10px system-ui';
            ctx.fillStyle = isActive ? '#e2e8f0' : '#94a3b8';
            ctx.textAlign = 'center';
            ctx.fillText(epoch.label, x, timelineY + 25);
            ctx.font = '9px system-ui';
            ctx.fillStyle = isActive ? '#a5b4fc' : '#64748b';
            ctx.fillText(epoch.desc, x, timelineY + 38);
        });

        // Moving "current view" indicator
        const currentX = timelineStartX + progress * (timelineEndX - timelineStartX);
        ctx.beginPath();
        ctx.arc(currentX, timelineY, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.fill();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Overlap zones between adjacent epochs
        for (let i = 0; i < epochs.length - 1; i++) {
            const x1 = timelineStartX + epochs[i].x * (timelineEndX - timelineStartX);
            const x2 = timelineStartX + epochs[i + 1].x * (timelineEndX - timelineStartX);
            const overlapX = (x1 + x2) / 2;
            const overlapW = (x2 - x1) * 0.4;

            const pulse = 0.2 + 0.15 * Math.sin(t * 0.03 + i);
            ctx.fillStyle = `rgba(74, 222, 128, ${pulse})`;
            ctx.fillRect(overlapX - overlapW / 2, timelineY - 15, overlapW, 30);

            ctx.font = '8px system-ui';
            ctx.fillStyle = `rgba(74, 222, 128, ${pulse + 0.3})`;
            ctx.textAlign = 'center';
            ctx.fillText('≃', overlapX, timelineY + 4);
        }

        // Top: "not equal, but connected by a path"
        ctx.font = '11px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('Nicht gleich, aber durch einen stetigen Pfad verbunden', W / 2, timelineY - 50);
        ctx.fillText('Jeder Moment überlappt mit dem vorherigen → Homotopie', W / 2, timelineY - 35);

        // Bottom: formula hint
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('s_i ≃ s_j (nicht s_i = s_j) — Verklebung bis auf einen Pfad', W / 2, H - 15);

        activeVizAnimations['viz-infinity'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: HOPF FIBRATION (Slide 14)
// ============================================================
vizRegistry['viz-hopf'] = function(container) {
    container.innerHTML = '';
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    container.appendChild(div);

    // Generate Hopf fibers via stereographic projection
    const traces = [];
    const numFibers = 12;
    const pointsPerFiber = 80;

    for (let f = 0; f < numFibers; f++) {
        const theta = (f / numFibers) * Math.PI; // point on S²
        const phi = (f / numFibers) * Math.PI * 2 * 0.618; // golden angle spread

        // Base point on S² (in spherical coords)
        const bx = Math.sin(theta) * Math.cos(phi);
        const by = Math.sin(theta) * Math.sin(phi);
        const bz = Math.cos(theta);

        // Generate the fiber (circle in S³, projected to R³)
        const xs = [], ys = [], zs = [];
        for (let i = 0; i <= pointsPerFiber; i++) {
            const t = (i / pointsPerFiber) * Math.PI * 2;

            // Hopf fiber parametrization
            const cosHalf = Math.cos(theta / 2);
            const sinHalf = Math.sin(theta / 2);

            // Point on S³
            const w = cosHalf * Math.cos(t);
            const x = cosHalf * Math.sin(t);
            const y = sinHalf * Math.cos(t + phi);
            const z = sinHalf * Math.sin(t + phi);

            // Stereographic projection S³ → R³ (from north pole)
            const denom = 1 - w + 0.001;
            xs.push(x / denom);
            ys.push(y / denom);
            zs.push(z / denom);
        }

        const hue = (f / numFibers) * 360;
        traces.push({
            type: 'scatter3d',
            mode: 'lines',
            x: xs, y: ys, z: zs,
            line: { width: 4, color: `hsl(${hue}, 70%, 55%)` },
            name: `Faser ${f + 1}`,
            hovertemplate: `Faser ${f + 1}<extra></extra>`
        });
    }

    const layout = {
        margin: { l: 0, r: 0, b: 0, t: 0 },
        showlegend: false,
        scene: {
            xaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '' },
            yaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '' },
            zaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '' },
            camera: { eye: { x: 1.5, y: 1.5, z: 1.0 } },
            bgcolor: '#1e293b'
        },
        paper_bgcolor: '#1e293b'
    };

    Plotly.newPlot(div, traces, layout, { displayModeBar: false, responsive: true });
};

// ============================================================
// VIZ: TOPOS (Slide 15)
// ============================================================
vizRegistry['viz-topos'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    const bubbles = [
        { x: W * 0.25, y: H * 0.5, r: 90, label: 'Klassisch', logic: 'Wahr / Falsch', color: '#3b82f6', truthValues: 2 },
        { x: W * 0.55, y: H * 0.45, r: 100, label: 'Garben-Topos', logic: 'Wahr auf U₁, Falsch auf U₂', color: '#10b981', truthValues: 5 },
        { x: W * 0.82, y: H * 0.5, r: 80, label: 'Intuitionistisch', logic: '¬¬A ≠ A', color: '#8b5cf6', truthValues: 3 },
    ];

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Topoi: Verschiedene "Universen" mit verschiedenen Logiken', W / 2, 20);

        bubbles.forEach((b, i) => {
            const pulse = 1 + 0.03 * Math.sin(t * 0.02 + i);

            // Glow
            const glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * pulse * 1.3);
            glow.addColorStop(0, b.color + '20');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r * pulse * 1.3, 0, Math.PI * 2);
            ctx.fill();

            // Bubble border
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r * pulse, 0, Math.PI * 2);
            ctx.strokeStyle = b.color + '80';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = b.color;
            ctx.textAlign = 'center';
            ctx.fillText(b.label, b.x, b.y - 20);

            // Truth value palette
            const paletteY = b.y + 5;
            const paletteW = b.truthValues * 14;
            const startX = b.x - paletteW / 2;

            for (let tv = 0; tv < b.truthValues; tv++) {
                const tvX = startX + tv * 14 + 7;
                const brightness = tv / (b.truthValues - 1);
                ctx.beginPath();
                ctx.arc(tvX, paletteY, 5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + brightness * 0.8})`;
                ctx.fill();
            }

            // Logic description
            ctx.font = '9px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(b.logic, b.x, b.y + 30);

            // Ω label
            ctx.font = '10px system-ui';
            ctx.fillStyle = b.color + 'aa';
            ctx.fillText(`Ω hat ${b.truthValues} Werte`, b.x, b.y + 45);
        });

        activeVizAnimations['viz-topos'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: HoTT (Slide 16)
// ============================================================
vizRegistry['viz-hott'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        const cx = W / 2;
        const cy = H / 2;

        // A type as a space with points and paths
        // Draw a "type" as a blob with points
        const typeX = W * 0.3;
        const typeY = cy;
        const typeR = 80;

        // Type blob
        ctx.beginPath();
        ctx.ellipse(typeX, typeY, typeR, typeR * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
        ctx.fill();
        ctx.strokeStyle = '#6366f180';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#6366f1';
        ctx.textAlign = 'center';
        ctx.fillText('Typ A (= Raum)', typeX, typeY - typeR - 10);

        // Points (terms)
        const points = [
            { x: typeX - 30, y: typeY - 15, label: 'a' },
            { x: typeX + 25, y: typeY + 10, label: 'b' },
            { x: typeX - 10, y: typeY + 30, label: 'c' },
        ];

        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#6366f1';
            ctx.fill();
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#e2e8f0';
            ctx.textAlign = 'center';
            ctx.fillText(p.label, p.x, p.y - 12);
        });

        // Path between a and b (animated)
        const pathProgress = (Math.sin(t * 0.03) + 1) / 2;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        const cpx = (points[0].x + points[1].x) / 2;
        const cpy = (points[0].y + points[1].y) / 2 - 25;
        ctx.quadraticCurveTo(cpx, cpy, points[1].x, points[1].y);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Path label
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.fillText('p : a = b', cpx, cpy - 10);
        ctx.font = '8px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('(Pfad = Beweis der Gleichheit)', cpx, cpy + 5);

        // Right side: Type family as fiber bundle
        const bundleX = W * 0.72;
        const bundleY = cy;
        const baseW = 140;

        // Base space
        ctx.beginPath();
        ctx.moveTo(bundleX - baseW / 2, bundleY + 50);
        ctx.lineTo(bundleX + baseW / 2, bundleY + 50);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.font = '10px system-ui';
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'center';
        ctx.fillText('Basisraum X', bundleX, bundleY + 68);

        // Fibers
        const numFibers = 5;
        for (let i = 0; i < numFibers; i++) {
            const fx = bundleX - baseW / 2 + (i / (numFibers - 1)) * baseW;
            const fiberH = 40 + 15 * Math.sin(t * 0.02 + i);

            ctx.beginPath();
            ctx.moveTo(fx, bundleY + 50);
            ctx.lineTo(fx, bundleY + 50 - fiberH);
            ctx.strokeStyle = '#8b5cf680';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Fiber top dot
            ctx.beginPath();
            ctx.arc(fx, bundleY + 50 - fiberH, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#8b5cf6';
            ctx.fill();

            // Base point
            ctx.beginPath();
            ctx.arc(fx, bundleY + 50, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.fill();
        }

        ctx.font = '10px system-ui';
        ctx.fillStyle = '#8b5cf6';
        ctx.textAlign = 'center';
        ctx.fillText('P(x): Typenfamilie = Garbe', bundleX, bundleY - 20);

        // Section arrow
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Schnitt = Π(x:X) P(x)', bundleX, bundleY + 85);

        activeVizAnimations['viz-hott'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: SITE (Slide 17)
// ============================================================
vizRegistry['viz-site'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        const cx = W / 2;
        const cy = H / 2;

        // The "Site" (hidden, blurred)
        const siteR = 100;
        const siteGlow = ctx.createRadialGradient(cx, cy + 30, 0, cx, cy + 30, siteR * 1.5);
        siteGlow.addColorStop(0, 'rgba(100, 100, 120, 0.15)');
        siteGlow.addColorStop(0.5, 'rgba(80, 80, 100, 0.08)');
        siteGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = siteGlow;
        ctx.beginPath();
        ctx.arc(cx, cy + 30, siteR * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Blurred question mark
        const pulse = 0.3 + 0.15 * Math.sin(t * 0.02);
        ctx.font = 'bold 60px system-ui';
        ctx.fillStyle = `rgba(100, 100, 130, ${pulse})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', cx, cy + 30);

        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = `rgba(148, 163, 184, ${pulse + 0.3})`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Site (Ding an sich)', cx, cy + 80);

        // Crossed-out arrows (no direct access)
        const arrowSources = [
            { x: W * 0.2, y: H * 0.25, label: 'Sehen' },
            { x: W * 0.8, y: H * 0.25, label: 'Hören' },
            { x: W * 0.15, y: H * 0.7, label: 'Denken' },
            { x: W * 0.85, y: H * 0.7, label: 'Messen' },
        ];

        arrowSources.forEach((src, i) => {
            // Arrow toward site
            ctx.beginPath();
            ctx.moveTo(src.x, src.y);
            const midX = (src.x + cx) / 2;
            const midY = (src.y + cy + 30) / 2;
            ctx.lineTo(midX, midY);
            ctx.strokeStyle = '#6366f160';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // X mark (no access)
            ctx.font = 'bold 14px system-ui';
            ctx.fillStyle = '#ef4444';
            ctx.textAlign = 'center';
            ctx.fillText('✗', midX, midY);

            // Source label
            ctx.font = '11px system-ui';
            ctx.fillStyle = '#6366f1';
            ctx.textAlign = 'center';
            ctx.fillText(src.label, src.x, src.y - 10);

            // Source dot
            ctx.beginPath();
            ctx.arc(src.x, src.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#6366f130';
            ctx.fill();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });

        // "Garbe" label (what we CAN see)
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('Wir sehen nur die Garbe (Messungen, Wahrnehmungen)', cx, H - 30);
        ctx.fillText('Die Site selbst bleibt ein Grenzbegriff (Kant)', cx, H - 15);

        activeVizAnimations['viz-site'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: WORLDVIEW (Slide 18)
// ============================================================
vizRegistry['viz-worldview'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    // Puzzle pieces that come together
    const pieces = [];
    const numPieces = 12;
    for (let i = 0; i < numPieces; i++) {
        const angle = (i / numPieces) * Math.PI * 2;
        const dist = 80 + Math.random() * 60;
        pieces.push({
            x: W / 2 + Math.cos(angle) * dist * 2,
            y: H / 2 + Math.sin(angle) * dist * 2,
            targetX: W / 2 + Math.cos(angle) * dist * 0.5,
            targetY: H / 2 + Math.sin(angle) * dist * 0.5,
            size: 20 + Math.random() * 15,
            color: `hsl(${i * 30}, 60%, 55%)`,
            connected: false,
            speed: 0.005 + Math.random() * 0.005
        });
    }

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Konsistentes Weltbild = Globaler Schnitt', W / 2, 20);

        // Animate pieces coming together
        const assemblyProgress = Math.min(1, t * 0.002);

        pieces.forEach((p, i) => {
            const progress = Math.min(1, assemblyProgress * (1 + i * 0.1));
            const eased = 1 - Math.pow(1 - progress, 3);

            const currentX = p.x + (p.targetX - p.x) * eased;
            const currentY = p.y + (p.targetY - p.y) * eased;

            // Draw piece
            ctx.beginPath();
            ctx.arc(currentX, currentY, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color + Math.round(eased * 200 + 55).toString(16).padStart(2, '0');
            ctx.fill();

            // Connection lines to nearby pieces (showing "verklebung")
            if (eased > 0.5) {
                pieces.forEach((other, j) => {
                    if (j <= i) return;
                    const otherProgress = Math.min(1, assemblyProgress * (1 + j * 0.1));
                    const otherEased = 1 - Math.pow(1 - otherProgress, 3);
                    const ox = other.x + (other.targetX - other.x) * otherEased;
                    const oy = other.y + (other.targetY - other.y) * otherEased;
                    const dist = Math.sqrt((currentX - ox) ** 2 + (currentY - oy) ** 2);
                    if (dist < 80) {
                        const lineAlpha = (1 - dist / 80) * 0.3 * eased;
                        ctx.beginPath();
                        ctx.moveTo(currentX, currentY);
                        ctx.lineTo(ox, oy);
                        ctx.strokeStyle = `rgba(99, 102, 241, ${lineAlpha})`;
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    }
                });
            }
        });

        // Center label
        if (assemblyProgress > 0.5) {
            const labelAlpha = Math.min(1, (assemblyProgress - 0.5) * 2);
            ctx.font = 'bold 14px system-ui';
            ctx.fillStyle = `rgba(99, 102, 241, ${labelAlpha})`;
            ctx.textAlign = 'center';
            ctx.fillText('Globaler Schnitt', W / 2, H / 2 - 10);
            ctx.font = '11px system-ui';
            ctx.fillStyle = `rgba(148, 163, 184, ${labelAlpha})`;
            ctx.fillText('(konsistentes Weltbild)', W / 2, H / 2 + 10);
        }

        // Subtitle
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('Lokale Cluster → globale Konsistenz', W / 2, H - 12);

        activeVizAnimations['viz-worldview'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: LLM SHEAF (Slide 19)
// ============================================================
vizRegistry['viz-llm-sheaf'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    // Nodes representing "text regions"
    const nodes = [];
    const numNodes = 20;
    for (let i = 0; i < numNodes; i++) {
        const angle = (i / numNodes) * Math.PI * 2;
        const r = 100 + Math.random() * 60;
        nodes.push({
            x: W / 2 + Math.cos(angle) * r,
            y: H / 2 + Math.sin(angle) * r,
            size: 6 + Math.random() * 4,
            consistent: Math.random() > 0.15, // 85% consistent
            hue: Math.random() * 360
        });
    }

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('LLM als Garbe über dem "Raum der Texte"', W / 2, 20);

        // Draw connections
        nodes.forEach((node, i) => {
            nodes.forEach((other, j) => {
                if (j <= i) return;
                const dist = Math.sqrt((node.x - other.x) ** 2 + (node.y - other.y) ** 2);
                if (dist < 120) {
                    const bothConsistent = node.consistent && other.consistent;
                    const alpha = (1 - dist / 120) * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(node.x, node.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.strokeStyle = bothConsistent
                        ? `rgba(74, 222, 128, ${alpha})`
                        : `rgba(248, 113, 113, ${alpha})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            });
        });

        // Draw nodes
        nodes.forEach((node, i) => {
            const pulse = 1 + 0.1 * Math.sin(t * 0.03 + i);
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.size * pulse, 0, Math.PI * 2);
            ctx.fillStyle = node.consistent
                ? `hsla(${node.hue}, 50%, 55%, 0.8)`
                : 'rgba(248, 113, 113, 0.9)';
            ctx.fill();

            // Mark inconsistent nodes
            if (!node.consistent) {
                ctx.font = '10px system-ui';
                ctx.fillStyle = '#f87171';
                ctx.textAlign = 'center';
                ctx.fillText('✗', node.x, node.y - node.size - 5);
            }
        });

        // Legend
        ctx.font = '10px system-ui';
        ctx.textAlign = 'left';

        ctx.fillStyle = '#4ade80';
        ctx.fillRect(20, H - 40, 10, 10);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Konsistent (verklebbar)', 35, H - 31);

        ctx.fillStyle = '#f87171';
        ctx.fillRect(20, H - 22, 10, 10);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Halluzination (nicht verklebbar)', 35, H - 13);

        activeVizAnimations['viz-llm-sheaf'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: SUMMARY (Slide 20)
// ============================================================
vizRegistry['viz-summary'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    const boxes = [
        { x: W * 0.12, y: H * 0.5, label: 'Site', sub: '(Ding an sich)', color: '#64748b' },
        { x: W * 0.28, y: H * 0.5, label: 'Garbe', sub: '(Messungen)', color: '#6366f1' },
        { x: W * 0.44, y: H * 0.5, label: 'Schnitte', sub: '(Daten)', color: '#3b82f6' },
        { x: W * 0.60, y: H * 0.5, label: 'Kohomologie', sub: '(Obstruktionen)', color: '#f59e0b' },
        { x: W * 0.80, y: H * 0.5, label: 'Konsistenz?', sub: '', color: '#10b981' },
    ];

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        // Draw flow
        boxes.forEach((box, i) => {
            // Box
            const bw = 90;
            const bh = 55;
            ctx.fillStyle = box.color + '20';
            ctx.beginPath();
            ctx.roundRect(box.x - bw / 2, box.y - bh / 2, bw, bh, 8);
            ctx.fill();
            ctx.strokeStyle = box.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            ctx.font = 'bold 11px system-ui';
            ctx.fillStyle = box.color;
            ctx.textAlign = 'center';
            ctx.fillText(box.label, box.x, box.y - 3);
            if (box.sub) {
                ctx.font = '9px system-ui';
                ctx.fillStyle = '#94a3b8';
                ctx.fillText(box.sub, box.x, box.y + 12);
            }

            // Arrow to next
            if (i < boxes.length - 1) {
                const next = boxes[i + 1];
                const startX = box.x + bw / 2 + 4;
                const endX = next.x - bw / 2 - 4;
                const midX = (startX + endX) / 2;

                // Animated flow dot
                const flowProgress = (t * 0.005 + i * 0.2) % 1;
                const fx = startX + (endX - startX) * flowProgress;

                ctx.beginPath();
                ctx.moveTo(startX, box.y);
                ctx.lineTo(endX, box.y);
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([3, 3]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Arrow head
                ctx.beginPath();
                ctx.moveTo(endX, box.y);
                ctx.lineTo(endX - 6, box.y - 4);
                ctx.lineTo(endX - 6, box.y + 4);
                ctx.closePath();
                ctx.fillStyle = '#475569';
                ctx.fill();

                // Flow dot
                ctx.beginPath();
                ctx.arc(fx, box.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#6366f1';
                ctx.fill();
            }
        });

        // Additional concepts below
        const extras = [
            { x: W * 0.2, y: H * 0.82, label: 'Eichtheorie', color: '#8b5cf6' },
            { x: W * 0.4, y: H * 0.82, label: '∞-Garben', color: '#ec4899' },
            { x: W * 0.6, y: H * 0.82, label: 'Topoi', color: '#14b8a6' },
            { x: W * 0.8, y: H * 0.82, label: 'Falsifikation', color: '#ef4444' },
        ];

        extras.forEach((ex, i) => {
            const pulse = 0.6 + 0.2 * Math.sin(t * 0.02 + i);
            ctx.font = '10px system-ui';
            ctx.fillStyle = ex.color + Math.round(pulse * 255).toString(16).padStart(2, '0');
            ctx.textAlign = 'center';
            ctx.fillText(ex.label, ex.x, ex.y);
        });

        // Title
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Das verklebte Gesamtbild', W / 2, 20);

        activeVizAnimations['viz-summary'] = requestAnimationFrame(draw);
    }
    draw();
};
