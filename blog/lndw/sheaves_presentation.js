// ============================================================
// SHEAVES PRESENTATION v2 – Complete Rewrite
// ============================================================

// ─── ASSET LOADER (robust against missing files) ───────────
const Assets = {
    images: {},
    audio: null,
    warnings: [],

    async loadImage(name, path) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => { this.images[name] = img; resolve(img); };
            img.onerror = () => {
                this.warnings.push(`⚠️ Bild nicht gefunden: ${path} – Fallback wird verwendet.`);
                console.warn(`[Assets] Bild nicht gefunden: ${path}`);
                resolve(null);
            };
            img.src = path;
        });
    },

    async loadAudio(path) {
        return new Promise(resolve => {
            const audio = new Audio();
            audio.oncanplay = () => { this.audio = audio; resolve(audio); };
            audio.onerror = () => {
                this.warnings.push(`⚠️ Audio nicht gefunden: ${path} – kein Sound.`);
                console.warn(`[Assets] Audio nicht gefunden: ${path}`);
                resolve(null);
            };
            audio.src = path;
        });
    },

    async init() {
        await Promise.all([
            this.loadImage('panorama', 'panorama.jpg'),
            this.loadImage('vogel', 'vogel.png'),
            this.loadImage('manhattan', 'manhattan.png'),
        ]);
        await this.loadAudio('birdsound.mp3');
        if (this.warnings.length > 0) {
            console.group('[Assets] Warnungen:');
            this.warnings.forEach(w => console.warn(w));
            console.groupEnd();
        }
    }
};

// ─── PRESENTATION ENGINE ───────────────────────────────────
const Presentation = (() => {
    let currentSlide = 0;
    let slides = [];
    let fragmentIndex = {};

    function init() {
        slides = Array.from(document.querySelectorAll('.slide'));
        slides.forEach((_, i) => { fragmentIndex[i] = 0; });
        renderMath();
        updateUI();
        Assets.init().then(() => {
            setTimeout(() => initSlideViz(0), 200);
        });
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
            updateUI();
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
            updateUI();
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
        document.getElementById('btn-next').disabled = false;
        const progress = slides.length > 1 ? (currentSlide / (slides.length - 1)) * 100 : 0;
        document.getElementById('progress-bar').style.width = progress + '%';
    }

    function renderMath() {
        // Render data-tex spans
        document.querySelectorAll('.math[data-tex]').forEach(el => {
            const tex = el.getAttribute('data-tex');
            try { el.innerHTML = temml.renderToString(tex, { displayMode: false }); }
            catch (e) { el.textContent = tex; console.warn('Temml inline error:', e); }
        });
        // Render $...$ in text nodes (for key-insight, info-card, etc.)
        document.querySelectorAll('.key-insight, .info-card p, .formula-box p').forEach(el => {
            el.innerHTML = el.innerHTML.replace(/\$([^$]+)\$/g, (match, tex) => {
                try { return temml.renderToString(tex, { displayMode: false }); }
                catch (e) { return match; }
            });
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

// ─── VISUALIZATION INFRASTRUCTURE ─────────────────────────
const vizRegistry = {};
let activeVizAnimations = {};

function initSlideViz(slideIdx) {
    Object.keys(activeVizAnimations).forEach(key => {
        if (activeVizAnimations[key]) cancelAnimationFrame(activeVizAnimations[key]);
    });
    activeVizAnimations = {};
    const slide = document.querySelectorAll('.slide')[slideIdx];
    if (!slide) return;
    slide.querySelectorAll('.viz-container').forEach(container => {
        const id = container.id;
        if (vizRegistry[id]) vizRegistry[id](container);
    });
}

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

// Helper: draw arrow
function drawArrow(ctx, x1, y1, x2, y2, color, width = 2) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 10;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - 0.35), y2 - headLen * Math.sin(angle - 0.35));
    ctx.lineTo(x2 - headLen * Math.cos(angle + 0.35), y2 - headLen * Math.sin(angle + 0.35));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

// ============================================================
// VIZ: PANORAMA (Slide 2) – kept, works well
// ============================================================
vizRegistry['viz-panorama'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;
    const photos = [
        { color: '#3b82f6', label: 'Foto 1' },
        { color: '#10b981', label: 'Foto 2' },
        { color: '#f59e0b', label: 'Foto 3' },
        { color: '#8b5cf6', label: 'Foto 4' },
    ];

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        const photoW = W * 0.22;
        const photoH = H * 0.55;
        const overlapW = photoW * 0.18;
        const totalW = photos.length * photoW - (photos.length - 1) * overlapW;
        const startX = (W - totalW) / 2;
        const startY = (H - photoH) / 2 - 10;

        photos.forEach((photo, i) => {
            const x = startX + i * (photoW - overlapW);
            const y = startY;

            // Photo body with noise pattern
            ctx.fillStyle = photo.color + '30';
            ctx.fillRect(x, y, photoW, photoH);
            ctx.strokeStyle = photo.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, photoW, photoH);

            // Landscape pattern
            ctx.fillStyle = photo.color + '50';
            const hillY = y + photoH * 0.6;
            ctx.beginPath();
            ctx.moveTo(x, hillY);
            for (let px = 0; px <= photoW; px += 5) {
                const hy = hillY + Math.sin((px + i * 50) * 0.05) * 20 - 10;
                ctx.lineTo(x + px, hy);
            }
            ctx.lineTo(x + photoW, y + photoH);
            ctx.lineTo(x, y + photoH);
            ctx.closePath();
            ctx.fill();

            // Label
            ctx.font = 'bold 11px system-ui';
            ctx.fillStyle = photo.color;
            ctx.textAlign = 'center';
            ctx.fillText(photo.label, x + photoW / 2, y + photoH + 16);

            // Overlap highlight
            if (i < photos.length - 1) {
                const ox = x + photoW - overlapW;
                const pulse = 0.25 + 0.2 * Math.sin(t * 0.04 + i);
                ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
                ctx.fillRect(ox, y, overlapW, photoH);
                ctx.font = '9px system-ui';
                ctx.fillStyle = `rgba(255, 255, 255, ${pulse + 0.4})`;
                ctx.textAlign = 'center';
                ctx.fillText('Überlappung', ox + overlapW / 2, y - 6);
                ctx.font = '13px system-ui';
                ctx.fillText('✓', ox + overlapW / 2, y + photoH / 2);
            }
        });

        // Global section arrow
        const arrowY = startY + photoH + 35;
        ctx.beginPath();
        ctx.moveTo(startX, arrowY);
        ctx.lineTo(startX + totalW, arrowY);
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
// VIZ: SHEAF 3D (Slide 3) – NEW: shows visual (x,y) + audio (z)
// ============================================================
vizRegistry['viz-sheaf-3d'] = function(container) {
    container.innerHTML = '';
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    container.appendChild(div);

    // Create a 3D scene: XY plane = visual, Z axis = audio
    const N = 30;
    // Visual "landscape" on XY plane
    const xVis = [], yVis = [], zVis = [];
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            xVis.push(i / N * 4 - 2);
            yVis.push(j / N * 4 - 2);
            zVis.push(0);
        }
    }

    // Audio "wave" along Z axis
    const xAud = [], yAud = [], zAud = [];
    for (let i = 0; i < 100; i++) {
        const t = i / 100 * Math.PI * 4;
        xAud.push(Math.sin(t) * 0.5);
        yAud.push(0);
        zAud.push(i / 100 * 4 - 2);
    }

    // Overlap region (where both have data)
    const xOv = [0], yOv = [0], zOv = [0];

    const traces = [
        {
            type: 'scatter3d', mode: 'markers', x: xVis, y: yVis, z: zVis,
            marker: { size: 2, color: '#3b82f6', opacity: 0.4 },
            name: 'Visuell (XY-Ebene)'
        },
        {
            type: 'scatter3d', mode: 'lines', x: xAud, y: yAud, z: zAud,
            line: { width: 5, color: '#f59e0b' },
            name: 'Auditiv (Z-Achse)'
        },
        {
            type: 'scatter3d', mode: 'markers', x: xOv, y: yOv, z: zOv,
            marker: { size: 12, color: '#ef4444', symbol: 'diamond' },
            name: 'Überlappung (Halm)'
        }
    ];

    const layout = {
        margin: { l: 0, r: 0, b: 0, t: 30 },
        title: { text: 'Garbe: Verschiedene Datentypen auf verschiedenen "Achsen"', font: { size: 12, color: '#e2e8f0' } },
        showlegend: true,
        legend: { font: { color: '#94a3b8', size: 10 }, x: 0, y: 1 },
        scene: {
            xaxis: { title: 'Bild X', color: '#94a3b8', gridcolor: '#334155' },
            yaxis: { title: 'Bild Y', color: '#94a3b8', gridcolor: '#334155' },
            zaxis: { title: 'Sound', color: '#94a3b8', gridcolor: '#334155' },
            camera: { eye: { x: 1.8, y: 1.2, z: 1.0 } },
            bgcolor: '#1e293b'
        },
        paper_bgcolor: '#1e293b',
        font: { color: '#e2e8f0' }
    };

    if (typeof Plotly !== 'undefined') {
        Plotly.newPlot(div, traces, layout, { displayModeBar: false, responsive: true });
    }
};

// ============================================================
// VIZ: STALKS (Slide 4) – NEW: Vase example, concrete
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
        const cy = H / 2 + 10;

        // The event point (vase hits ground)
        const pulse = 1 + 0.12 * Math.sin(t * 0.05);
        ctx.beginPath();
        ctx.arc(cx, cy, 18 * pulse, 0, Math.PI * 2);
        const eventGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
        eventGlow.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
        eventGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = eventGlow;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 13px system-ui';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText('Ereignis: Vase trifft Boden', cx, cy + 35);
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('(Halm = alle Information an diesem Punkt)', cx, cy + 50);

        // Three different "measurements" of the same event
        const measurements = [
            { angle: -Math.PI * 0.75, label: '👁️ Sehen', desc: '"Vase fällt"', color: '#3b82f6', icon: '👁️' },
            { angle: -Math.PI * 0.15, label: '👂 Hören', desc: '"Klirren"', color: '#f59e0b', icon: '👂' },
            { angle: Math.PI * 0.55, label: '🦶 Spüren', desc: '"Splitter im Fuß"', color: '#10b981', icon: '🦶' },
        ];

        const radius = Math.min(W, H) * 0.32;

        measurements.forEach((m, i) => {
            const mx = cx + Math.cos(m.angle) * radius;
            const my = cy + Math.sin(m.angle) * radius;

            // Animated flow particles
            const numParticles = 3;
            for (let p = 0; p < numParticles; p++) {
                const progress = ((t * 0.008 + i * 0.3 + p * 0.33) % 1);
                const px = mx + (cx - mx) * progress;
                const py = my + (cy - my) * progress;
                const size = 4 * (1 - progress * 0.5);
                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fillStyle = m.color + Math.round((1 - progress) * 200 + 55).toString(16).padStart(2, '0');
                ctx.fill();
            }

            // Connection line
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(cx, cy);
            ctx.strokeStyle = m.color + '30';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Measurement bubble
            ctx.beginPath();
            ctx.arc(mx, my, 35, 0, Math.PI * 2);
            ctx.fillStyle = m.color + '15';
            ctx.fill();
            ctx.strokeStyle = m.color + '80';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Icon and text
            ctx.font = '20px system-ui';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(m.icon, mx, my - 8);
            ctx.textBaseline = 'alphabetic';
            ctx.font = 'bold 10px system-ui';
            ctx.fillStyle = m.color;
            ctx.fillText(m.label, mx, my + 15);
            ctx.font = '9px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(m.desc, mx, my + 28);
        });

        // Title
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Halm: Drei verschiedene Messungen, ein Punkt', W / 2, 20);

        activeVizAnimations['viz-stalks'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: BIRD (Slide 5) – NEW: panorama image + bird + sound
// ============================================================
vizRegistry['viz-bird'] = function(container) {
    const { ctx, W, H, canvas } = setupCanvas(container);
    let t = 0;
    let soundPlayed = false;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        // Draw panorama background (or gradient fallback)
        if (Assets.images.panorama) {
            ctx.globalAlpha = 0.6;
            ctx.drawImage(Assets.images.panorama, 0, 0, W, H * 0.5);
            ctx.globalAlpha = 1;
        } else {
            // Gradient sky fallback
            const sky = ctx.createLinearGradient(0, 0, 0, H * 0.5);
            sky.addColorStop(0, '#1e3a5f');
            sky.addColorStop(1, '#2d4a3e');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, W, H * 0.5);
        }

        // Bird flying across
        const birdX = ((t * 1.5) % (W + 100)) - 50;
        const birdY = H * 0.2 + Math.sin(t * 0.03) * 20;

        if (Assets.images.vogel) {
            ctx.drawImage(Assets.images.vogel, birdX - 25, birdY - 15, 50, 30);
        } else {
            // Simple bird shape fallback
            ctx.font = '28px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('🐦', birdX, birdY + 10);
        }

        // Sound waveform (bottom half)
        const waveY = H * 0.7;
        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'left';
        ctx.fillText('Auditiv: Vogelgesang', 20, waveY - 30);

        ctx.beginPath();
        for (let x = 0; x < W; x += 2) {
            // Amplitude peaks near bird position
            const distToBird = Math.abs(x - birdX);
            const amp = Math.max(0, 1 - distToBird / 200) * 25;
            const y = waveY + Math.sin(x * 0.08 + t * 0.05) * amp;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Visual label
        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = '#3b82f6';
        ctx.textAlign = 'left';
        ctx.fillText('Visuell: Vogel im Panorama', 20, 20);

        // Meeting point indicator
        const meetX = birdX;
        const meetY = H * 0.5;
        const meetPulse = 0.5 + 0.3 * Math.sin(t * 0.06);
        ctx.beginPath();
        ctx.moveTo(meetX, birdY + 15);
        ctx.lineTo(meetX, waveY - 25);
        ctx.strokeStyle = `rgba(239, 68, 68, ${meetPulse})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(meetX, meetY, 8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239, 68, 68, ${meetPulse + 0.2})`;
        ctx.fill();
        ctx.font = '9px system-ui';
        ctx.fillStyle = `rgba(239, 68, 68, ${meetPulse + 0.3})`;
        ctx.textAlign = 'center';
        ctx.fillText('Halm', meetX, meetY + 18);

        // Play sound once when bird is in center
        if (!soundPlayed && birdX > W * 0.4 && birdX < W * 0.6 && Assets.audio) {
            Assets.audio.volume = 0.3;
            Assets.audio.play().catch(() => {});
            soundPlayed = true;
        }
        if (birdX > W + 50) soundPlayed = false;

        activeVizAnimations['viz-bird'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: TOPOLOGY (Slide 6) – simplified, no self-drawn cup
// ============================================================
vizRegistry['viz-topology'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        // Left: Metric space (with distances shown)
        const leftX = W * 0.25;
        const cy = H * 0.45;

        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#3b82f6';
        ctx.textAlign = 'center';
        ctx.fillText('Geometrie (mit Abständen)', leftX, 30);

        // Points with distances
        const pts = [
            { x: leftX - 40, y: cy - 20 },
            { x: leftX + 30, y: cy - 30 },
            { x: leftX + 10, y: cy + 25 },
        ];
        pts.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();
        });
        // Distance labels
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.strokeStyle = '#3b82f680';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.font = '9px system-ui';
        ctx.fillStyle = '#3b82f6';
        ctx.fillText('d = 3.7', (pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2 - 8);

        ctx.beginPath();
        ctx.moveTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.strokeStyle = '#3b82f680';
        ctx.stroke();
        ctx.fillText('d = 2.1', (pts[1].x + pts[2].x) / 2 + 15, (pts[1].y + pts[2].y) / 2);

        // Arrow
        const arrowCx = W * 0.5;
        ctx.font = 'bold 20px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('→', arrowCx, cy);
        ctx.font = '9px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Abstände vergessen', arrowCx, cy + 18);

        // Right: Topological space (only neighborhoods)
        const rightX = W * 0.75;
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'center';
        ctx.fillText('Topologie (nur Nachbarschaft)', rightX, 30);

        // Open sets as blobs
        ctx.beginPath();
        ctx.ellipse(rightX - 15, cy, 45, 35, 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#10b98115';
        ctx.fill();
        ctx.strokeStyle = '#10b98160';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(rightX + 20, cy + 5, 40, 30, -0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#10b98115';
        ctx.fill();
        ctx.strokeStyle = '#10b98160';
        ctx.stroke();

        const rpts = [
            { x: rightX - 25, y: cy - 5 },
            { x: rightX + 10, y: cy - 10 },
            { x: rightX + 5, y: cy + 15 },
        ];
        rpts.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.fill();
        });

        ctx.font = '9px system-ui';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('Keine Abstände, nur "Nachbarschaft"', rightX, cy + 55);

        // Bottom: What's preserved
        const preservedY = H * 0.82;
        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Was bleibt erhalten:', W / 2, preservedY);

        const preserved = ['Löcher', 'Zusammenhang', 'Orientierbarkeit', 'Dimension'];
        preserved.forEach((item, i) => {
            const ix = W * 0.2 + (i / (preserved.length - 1)) * W * 0.6;
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#a5b4fc';
            ctx.fillText(item, ix, preservedY + 20);
        });

        // Tasse ≃ Donut note
        ctx.font = '11px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('Tasse ≃ Donut (beide: 1 Loch) — homöomorph', W / 2, H - 12);

        activeVizAnimations['viz-topology'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: COHOMOLOGY (Slide 7) – Arrow rotating along circle
// ============================================================
vizRegistry['viz-cohomology'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        const cx = W * 0.4;
        const cy = H / 2;
        const radius = Math.min(W * 0.3, H * 0.35);

        // Draw the circle S¹
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#60a5fa40';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Moving point on circle
        const angle = (t * 0.01) % (Math.PI * 2);
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;

        // Trail showing path traveled
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, angle);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Point on circle
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Tangent arrow at the point (rotates with the point)
        // The arrow always points tangentially but we show it accumulating rotation
        const tangentAngle = angle + Math.PI / 2; // tangent direction
        const arrowLen = 30;
        const ax = px + Math.cos(tangentAngle) * arrowLen;
        const ay = py + Math.sin(tangentAngle) * arrowLen;

        // Arrow shaft
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(ax, ay);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Arrowhead
        const headAngle = tangentAngle;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - 10 * Math.cos(headAngle - 0.4), ay - 10 * Math.sin(headAngle - 0.4));
        ctx.lineTo(ax - 10 * Math.cos(headAngle + 0.4), ay - 10 * Math.sin(headAngle + 0.4));
        ctx.closePath();
        ctx.fillStyle = '#f59e0b';
        ctx.fill();

        // Show "initial" arrow at start position (ghost)
        const startX = cx + radius;
        const startY = cy;
        const ghostAx = startX + Math.cos(Math.PI / 2) * arrowLen;
        const ghostAy = startY + Math.sin(Math.PI / 2) * arrowLen;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(ghostAx, ghostAy);
        ctx.strokeStyle = '#f59e0b40';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Right side: "angle value" graph showing discontinuity
        const graphX = W * 0.68;
        const graphY = 60;
        const graphW = W * 0.25;
        const graphH = H - 120;

        // Graph axes
        ctx.beginPath();
        ctx.moveTo(graphX, graphY);
        ctx.lineTo(graphX, graphY + graphH);
        ctx.lineTo(graphX + graphW, graphY + graphH);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Labels
        ctx.font = '9px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('Position auf S¹', graphX + graphW / 2, graphY + graphH + 16);
        ctx.save();
        ctx.translate(graphX - 14, graphY + graphH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Winkelwert', 0, 0);
        ctx.restore();

        ctx.fillText('0', graphX - 5, graphY + graphH + 4);
        ctx.fillText('2π', graphX + graphW + 5, graphY + graphH + 4);
        ctx.fillText('0', graphX - 10, graphY + graphH);
        ctx.fillText('2π', graphX - 12, graphY + 4);

        // Draw the "angle function" – linear rise with jump
        const normalizedProgress = angle / (Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(graphX, graphY + graphH);
        const lineEndX = graphX + normalizedProgress * graphW;
        const lineEndY = graphY + graphH - normalizedProgress * graphH;
        ctx.lineTo(lineEndX, lineEndY);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Current value dot
        ctx.beginPath();
        ctx.arc(lineEndX, lineEndY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        // Show jump when wrapping around
        if (normalizedProgress > 0.92) {
            const jumpPulse = 0.5 + 0.5 * Math.sin(t * 0.15);
            ctx.font = 'bold 12px system-ui';
            ctx.fillStyle = `rgba(239, 68, 68, ${jumpPulse})`;
            ctx.textAlign = 'center';
            ctx.fillText('⚡ SPRUNG!', graphX + graphW / 2, graphY - 10);
            ctx.font = '9px system-ui';
            ctx.fillStyle = `rgba(239, 68, 68, ${jumpPulse * 0.7})`;
            ctx.fillText('Globale Winkelfunktion unmöglich!', graphX + graphW / 2, graphY + 8);
        }

        // Title
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Pfeil entlang des Kreises: lokal definierbar, global nicht', W / 2, 20);

        activeVizAnimations['viz-cohomology'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: ČECH with noise (Slide 8)
// ============================================================
vizRegistry['viz-cech'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    // Generate "photo strips" with noise
    const strips = [];
    const numStrips = 4;
    const stripW = W * 0.2;
    const overlapFrac = 0.25;

    for (let i = 0; i < numStrips; i++) {
        const pixels = [];
        for (let y = 0; y < 40; y++) {
            const row = [];
            for (let x = 0; x < 30; x++) {
                // Base "landscape" value
                const base = Math.sin((x + i * 20) * 0.2) * 0.3 + 0.5 + Math.sin(y * 0.15) * 0.2;
                row.push(base);
            }
            pixels.push(row);
        }
        strips.push(pixels);
    }

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        const totalW = numStrips * stripW - (numStrips - 1) * stripW * overlapFrac;
        const startX = (W - totalW) / 2;
        const startY = H * 0.15;
        const pixH = H * 0.5;

        // Draw strips with pixel noise
        strips.forEach((pixels, si) => {
            const sx = startX + si * stripW * (1 - overlapFrac);
            const cellW = stripW / 30;
            const cellH = pixH / 40;

            for (let y = 0; y < 40; y++) {
                for (let x = 0; x < 30; x++) {
                    // Add animated noise
                    const noise = (Math.sin(t * 0.05 + x * 3.7 + y * 2.3 + si * 10) * 0.5 + 0.5) * 0.08;
                    const val = Math.max(0, Math.min(1, pixels[y][x] + noise));

                    const hue = si * 80 + 200;
                    ctx.fillStyle = `hsla(${hue}, 50%, ${val * 60 + 20}%, 0.9)`;
                    ctx.fillRect(sx + x * cellW, startY + y * cellH, cellW + 0.5, cellH + 0.5);
                }
            }

            // Strip border
            ctx.strokeStyle = `hsl(${si * 80 + 200}, 60%, 50%)`;
            ctx.lineWidth = 2;
            ctx.strokeRect(sx, startY, stripW, pixH);

            // Label
            ctx.font = '10px system-ui';
            ctx.fillStyle = `hsl(${si * 80 + 200}, 60%, 60%)`;
            ctx.textAlign = 'center';
            ctx.fillText(`s${si + 1}`, sx + stripW / 2, startY + pixH + 14);
        });

        // Highlight overlaps with comparison
        for (let i = 0; i < numStrips - 1; i++) {
            const ox = startX + (i + 1) * stripW * (1 - overlapFrac) - stripW * overlapFrac * 0.5;
            const ow = stripW * overlapFrac;

            // Noise difference indicator
            const diff = Math.sin(t * 0.02 + i) * 0.5 + 0.5; // 0 to 1
            const isGood = diff < 0.7;

            const pulse = 0.3 + 0.2 * Math.sin(t * 0.04 + i);
            ctx.fillStyle = isGood
                ? `rgba(74, 222, 128, ${pulse})`
                : `rgba(248, 113, 113, ${pulse})`;
            ctx.fillRect(ox, startY - 5, ow, pixH + 10);

            ctx.font = 'bold 10px system-ui';
            ctx.fillStyle = isGood ? '#4ade80' : '#f87171';
            ctx.textAlign = 'center';
            ctx.fillText(isGood ? 'δ ≈ 0 ✓' : 'δ ≠ 0 ✗', ox + ow / 2, startY - 12);
        }

        // Bottom: explanation
        ctx.font = '11px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('Rauschen = Messfehler. Wenn δ ≈ 0 (Fehler klein): verklebbar.', W / 2, H - 40);
        ctx.fillText('Wenn δ ≠ 0 (Fehler systematisch): Obstruktion → H¹ ≠ 0.', W / 2, H - 22);

        // Title
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Čech-Kohomologie: Messfehler in Überlappungen', W / 2, 18);

        activeVizAnimations['viz-cech'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: LASER (Slide 9) – kept from original, works well
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

        ctx.font = '40px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☕', targetX, targetY);

        ctx.font = '11px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Objekt (reale Temperatur: 82°C)', targetX, targetY + 35);

        const t1x = W * 0.2, t1y = H * 0.3;
        const t2x = W * 0.8, t2y = H * 0.3;

        // Laser beams
        const beamPulse1 = 0.5 + 0.3 * Math.sin(t * 0.08);
        ctx.beginPath();
        ctx.moveTo(t1x + 20, t1y + 10);
        ctx.lineTo(targetX - 25, targetY - 10);
        ctx.strokeStyle = `rgba(239, 68, 68, ${beamPulse1})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        const beamPulse2 = 0.5 + 0.3 * Math.sin(t * 0.08 + 1);
        ctx.beginPath();
        ctx.moveTo(t2x - 20, t2y + 10);
        ctx.lineTo(targetX + 25, targetY - 10);
        ctx.strokeStyle = `rgba(239, 68, 68, ${beamPulse2})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Readings
        ctx.font = 'bold 14px system-ui';
        ctx.fillStyle = '#4ade80';
        ctx.textAlign = 'center';
        ctx.fillText('82°C ✓', t1x, t1y + 35);
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Messgerät A', t1x, t1y + 50);

        const phase = Math.sin(t * 0.015);
        ctx.font = 'bold 14px system-ui';
        ctx.fillStyle = phase > 0 ? '#4ade80' : '#f87171';
        ctx.textAlign = 'center';
        ctx.fillText(phase > 0 ? '82°C ✓' : '92°C ✗', t2x, t2y + 35);
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Messgerät B', t2x, t2y + 50);

        // Overlap indicator
        ctx.beginPath();
        ctx.arc(targetX, targetY - 50, 30, 0, Math.PI * 2);
        ctx.fillStyle = phase > 0 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.3)';
        ctx.fill();
        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = phase > 0 ? '#4ade80' : '#f87171';
        ctx.textAlign = 'center';
        ctx.fillText(phase > 0 ? 'Verklebbar ✓' : 'NICHT verklebbar ✗', targetX, targetY - 48);

        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('Konsistenz ≠ Beweis | Inkonsistenz = Falsifikation', W / 2, H - 12);

        activeVizAnimations['viz-laser'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: FIBER BUNDLE (Slide 10) – shows "locally = product"
// ============================================================
vizRegistry['viz-fiber'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        // Left: Show "local = product" explicitly
        const leftX = W * 0.25;
        const baseY = H * 0.7;

        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = '#60a5fa';
        ctx.textAlign = 'center';
        ctx.fillText('"Lokal wie ein Produkt" U × F', leftX, 25);

        // Base segment (U)
        ctx.beginPath();
        ctx.moveTo(leftX - 60, baseY);
        ctx.lineTo(leftX + 60, baseY);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#60a5fa';
        ctx.fillText('U (Basis)', leftX, baseY + 16);

        // Fibers (vertical lines = F at each point)
        const numF = 8;
        for (let i = 0; i < numF; i++) {
            const fx = leftX - 55 + (i / (numF - 1)) * 110;
            ctx.beginPath();
            ctx.moveTo(fx, baseY);
            ctx.lineTo(fx, baseY - 120);
            ctx.strokeStyle = '#8b5cf660';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Highlight one fiber
        const highlightIdx = Math.floor((Math.sin(t * 0.02) + 1) / 2 * (numF - 1));
        const hx = leftX - 55 + (highlightIdx / (numF - 1)) * 110;
        ctx.beginPath();
        ctx.moveTo(hx, baseY);
        ctx.lineTo(hx, baseY - 120);
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.font = '9px system-ui';
        ctx.fillStyle = '#8b5cf6';
        ctx.fillText('F (Faser)', hx + 20, baseY - 60);

        // Bracket showing "U × F"
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(leftX - 60, baseY - 120, 120, 120);
        ctx.setLineDash([]);
        ctx.font = '9px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('= U × F (Produkt)', leftX, baseY - 128);

        // Right: Möbius vs Cylinder
        const rightX = W * 0.7;

        // Cylinder (top)
        const cylY = H * 0.3;
        ctx.font = 'bold 10px system-ui';
        ctx.fillStyle = '#4ade80';
        ctx.textAlign = 'center';
        ctx.fillText('Zylinder (trivial)', rightX, cylY - 50);

        // Draw cylinder cross-section
        const cylR = 50;
        for (let i = 0; i < 20; i++) {
            const a = (i / 20) * Math.PI * 2 + t * 0.005;
            const x = rightX + Math.cos(a) * cylR;
            const depth = Math.sin(a);
            const alpha = 0.3 + 0.4 * (depth + 1) / 2;
            ctx.beginPath();
            ctx.moveTo(x, cylY - 30);
            ctx.lineTo(x, cylY + 30);
            ctx.strokeStyle = `rgba(74, 222, 128, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.ellipse(rightX, cylY + 30, cylR, 15, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Möbius (bottom)
        const mobY = H * 0.7;
        ctx.font = 'bold 10px system-ui';
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.fillText('Möbiusband (nicht-trivial)', rightX, mobY - 50);

        const mobR = 50;
        for (let i = 0; i < 40; i++) {
            const a = (i / 40) * Math.PI * 2;
            const twist = a / 2;
            const x = rightX + Math.cos(a) * mobR;
            const y = mobY + Math.sin(a) * mobR * 0.3;
            const depth = Math.sin(a);
            const fiberLen = 20;

            const topX = x + Math.cos(twist) * fiberLen * 0.3 * depth;
            const topY = y - Math.sin(twist) * fiberLen;
            const botX = x - Math.cos(twist) * fiberLen * 0.3 * depth;
            const botY = y + Math.sin(twist) * fiberLen;

            const alpha = 0.3 + 0.4 * (depth + 1) / 2;
            ctx.beginPath();
            ctx.moveTo(topX, topY);
            ctx.lineTo(botX, botY);
            ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Twist indicator
        const twistA = (t * 0.01) % (Math.PI * 2);
        const twistPx = rightX + Math.cos(twistA) * mobR;
        const twistPy = mobY + Math.sin(twistA) * mobR * 0.3;
        ctx.beginPath();
        ctx.arc(twistPx, twistPy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        ctx.font = '9px system-ui';
        ctx.fillStyle = '#f87171';
        ctx.textAlign = 'center';
        ctx.fillText('Nach 1 Umrundung: oben↔unten!', rightX, mobY + 45);

        activeVizAnimations['viz-fiber'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: GAUGE / PARALLEL TRANSPORT (Slide 11) – animated properly
// ============================================================
vizRegistry['viz-gauge'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        const cx = W * 0.45;
        const cy = H * 0.5;
        const R = Math.min(W * 0.3, H * 0.35);

        // Draw sphere wireframe
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.15)';
        ctx.lineWidth = 1;
        for (let lat = -3; lat <= 3; lat++) {
            const yFrac = lat / 4;
            const r = Math.sqrt(1 - yFrac * yFrac) * R;
            const yPos = cy + yFrac * R * 0.7;
            ctx.beginPath();
            ctx.ellipse(cx, yPos, r, r * 0.25, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        for (let lon = 0; lon < 6; lon++) {
            const a = (lon / 6) * Math.PI;
            ctx.beginPath();
            ctx.ellipse(cx, cy, R * Math.abs(Math.cos(a)), R * 0.85, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Triangular path on sphere
        const pathProgress = (t * 0.004) % 1;
        const pathPts = [];
        const N = 90;

        for (let i = 0; i <= N; i++) {
            const frac = i / N;
            let theta, phi;
            if (frac < 0.33) {
                const lf = frac / 0.33;
                theta = Math.PI / 2;
                phi = lf * Math.PI / 2;
            } else if (frac < 0.66) {
                const lf = (frac - 0.33) / 0.33;
                theta = Math.PI / 2 - lf * Math.PI / 3;
                phi = Math.PI / 2;
            } else {
                const lf = (frac - 0.66) / 0.34;
                theta = Math.PI / 2 - (1 - lf) * Math.PI / 3;
                phi = Math.PI / 2 * (1 - lf);
            }
            const x = cx + Math.sin(theta) * Math.cos(phi) * R;
            const y = cy - Math.cos(theta) * R * 0.85;
            pathPts.push({ x, y, theta, phi });
        }

        // Draw path
        ctx.beginPath();
        pathPts.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
        ctx.closePath();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Current position
        const idx = Math.floor(pathProgress * N);
        const cur = pathPts[idx] || pathPts[0];

        // Vector that rotates due to holonomy
        // After full loop, it should be rotated by the solid angle
        const holonomyAngle = pathProgress * Math.PI / 4; // ~45° for this triangle
        const baseAngle = Math.PI * 0.3; // initial direction
        const vecAngle = baseAngle + holonomyAngle;
        const vecLen = 28;

        const vx = cur.x + Math.cos(vecAngle) * vecLen;
        const vy = cur.y + Math.sin(vecAngle) * vecLen;

        // Draw vector
        ctx.beginPath();
        ctx.moveTo(cur.x, cur.y);
        ctx.lineTo(vx, vy);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Arrowhead
        const ha = Math.atan2(vy - cur.y, vx - cur.x);
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(vx - 12 * Math.cos(ha - 0.35), vy - 12 * Math.sin(ha - 0.35));
        ctx.lineTo(vx - 12 * Math.cos(ha + 0.35), vy - 12 * Math.sin(ha + 0.35));
        ctx.closePath();
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        // Position dot
        ctx.beginPath();
        ctx.arc(cur.x, cur.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Ghost of initial vector
        const ghostVx = pathPts[0].x + Math.cos(baseAngle) * vecLen;
        const ghostVy = pathPts[0].y + Math.sin(baseAngle) * vecLen;
        const ghostAy = pathPts[0].y + Math.sin(baseAngle) * vecLen;
        ctx.beginPath();
        ctx.moveTo(pathPts[0].x, pathPts[0].y);
        ctx.lineTo(ghostVx, ghostAy);
        ctx.strokeStyle = '#f59e0b40';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label for ghost
        ctx.font = '9px system-ui';
        ctx.fillStyle = '#f59e0b80';
        ctx.textAlign = 'left';
        ctx.fillText('Start-Richtung', ghostVx + 5, ghostAy - 5);

        // Holonomy indicator
        if (pathProgress > 0.9) {
            const holPulse = 0.5 + 0.5 * Math.sin(t * 0.12);
            ctx.font = 'bold 12px system-ui';
            ctx.fillStyle = `rgba(239, 68, 68, ${holPulse})`;
            ctx.textAlign = 'center';
            ctx.fillText('⟳ Holonomie: Vektor hat sich gedreht!', cx, H - 40);
            ctx.font = '10px system-ui';
            ctx.fillStyle = `rgba(239, 68, 68, ${holPulse * 0.7})`;
            ctx.fillText('Differenz = Krümmung = Feldstärke', cx, H - 22);
        }

        // Right side: explanation
        const infoX = W * 0.78;
        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Paralleltransport', infoX, 60);

        ctx.font = '9px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'left';
        const lines = [
            '1. Vektor startet an einem Punkt',
            '2. Wird entlang Pfad transportiert',
            '3. Bleibt lokal "parallel"',
            '4. Nach Schleife: andere Richtung!',
            '',
            'Die Drehung = Holonomie',
            '= Integral der Krümmung',
            '= Feldstärke (Physik)',
        ];
        lines.forEach((line, i) => {
            ctx.fillText(line, infoX - 60, 85 + i * 16);
        });

        // Title
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Eichtheorie: Paralleltransport auf gekrümmter Fläche', W / 2, 20);

        activeVizAnimations['viz-gauge'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: CALIBRATION / HOMOTOPY PATH (Slide 12)
// ============================================================
vizRegistry['viz-calibration'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        const t1x = W * 0.2;
        const t2x = W * 0.8;
        const ty = H * 0.35;

        // Title
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Eichtransformation als Pfad (Homotopie)', W / 2, 22);

        // Thermometer A
        ctx.font = 'bold 28px monospace';
        ctx.fillStyle = '#4ade80';
        ctx.textAlign = 'center';
        ctx.fillText('25°C', t1x, ty);
        ctx.font = '11px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Messgerät A (korrekt)', t1x, ty + 22);

        // Thermometer B
        ctx.font = 'bold 28px monospace';
        ctx.fillStyle = '#f87171';
        ctx.textAlign = 'center';
        ctx.fillText('35°C', t2x, ty);
        ctx.font = '11px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Messgerät B (+10° Offset)', t2x, ty + 22);

        // The PATH between them (animated)
        const pathY = H * 0.58;
        const pathStartX = t1x + 30;
        const pathEndX = t2x - 30;

        // Draw the path as a curve
        ctx.beginPath();
        ctx.moveTo(pathStartX, pathY);
        ctx.bezierCurveTo(
            pathStartX + 80, pathY + 50,
            pathEndX - 80, pathY + 50,
            pathEndX, pathY
        );
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Animated dot traveling along the path
        const pathProgress = (t * 0.005) % 1;
        // Bezier interpolation
        const bp = pathProgress;
        const bx = (1-bp)**3 * pathStartX + 3*(1-bp)**2*bp*(pathStartX+80) + 3*(1-bp)*bp**2*(pathEndX-80) + bp**3*pathEndX;
        const by = (1-bp)**3 * pathY + 3*(1-bp)**2*bp*(pathY+50) + 3*(1-bp)*bp**2*(pathY+50) + bp**3*pathY;

        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#a78bfa';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Value at current point
        const currentVal = 25 + pathProgress * 10;
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#a78bfa';
        ctx.textAlign = 'center';
        ctx.fillText(`${currentVal.toFixed(1)}°C`, bx, by - 14);

        // Path label
        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = '#a78bfa';
        ctx.textAlign = 'center';
        ctx.fillText('Pfad p: 25°C → 35°C', W / 2, pathY + 70);
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('(stetige Transformation = Eichtransformation = Homotopie)', W / 2, pathY + 86);

        // Bottom: HoTT interpretation
        const bottomY = H * 0.85;
        ctx.font = '11px system-ui';
        ctx.fillStyle = '#c7d2fe';
        ctx.textAlign = 'center';
        ctx.fillText('In HoTT: p : 25°C =_Temp 35°C', W / 2, bottomY);
        ctx.font = '9px system-ui';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Der Pfad IST der Beweis, dass beide "dasselbe messen" (Univalenz)', W / 2, bottomY + 16);

        // Endpoints
        ctx.beginPath();
        ctx.arc(pathStartX, pathY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#4ade80';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pathEndX, pathY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#f87171';
        ctx.fill();

        activeVizAnimations['viz-calibration'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: ∞-GARBEN / MANHATTAN (Slide 13)
// ============================================================
vizRegistry['viz-infinity'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    // Try to load manhattan image
    const manhattanImg = new Image();
    let imgLoaded = false;
    manhattanImg.onload = () => { imgLoaded = true; };
    manhattanImg.onerror = () => { console.warn('[viz-infinity] manhattan.png nicht gefunden – Fallback.'); };
    manhattanImg.src = 'manhattan.png';

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        // Title
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('∞-Garbe: Nicht gleich, aber durch stetigen Pfad verbunden', W / 2, 20);

        // Two images side by side (or fallback)
        const imgW = W * 0.35;
        const imgH = H * 0.45;
        const img1X = W * 0.08;
        const img2X = W * 0.57;
        const imgY = H * 0.12;

        if (imgLoaded) {
            // Left half of image = "before", right half = "after"
            ctx.drawImage(manhattanImg, 0, 0, manhattanImg.width / 2, manhattanImg.height, img1X, imgY, imgW, imgH);
            ctx.drawImage(manhattanImg, manhattanImg.width / 2, 0, manhattanImg.width / 2, manhattanImg.height, img2X, imgY, imgW, imgH);
        } else {
            // Fallback: colored rectangles
            ctx.fillStyle = '#2d4a3e';
            ctx.fillRect(img1X, imgY, imgW, imgH);
            ctx.fillStyle = '#3b4a6b';
            ctx.fillRect(img2X, imgY, imgW, imgH);

            ctx.font = '11px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            ctx.fillText('Manhattan ~1600', img1X + imgW / 2, imgY + imgH / 2);
            ctx.fillText('Manhattan heute', img2X + imgW / 2, imgY + imgH / 2);
        }

        // Labels
        ctx.font = 'bold 10px system-ui';
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'center';
        ctx.fillText('Manhattan ~400 Jahre zuvor', img1X + imgW / 2, imgY + imgH + 14);
        ctx.fillStyle = '#6366f1';
        ctx.fillText('Manhattan heute', img2X + imgW / 2, imgY + imgH + 14);

        // ≠ between them
        ctx.font = 'bold 20px system-ui';
        ctx.fillStyle = '#f87171';
        ctx.textAlign = 'center';
        ctx.fillText('≠', W / 2, imgY + imgH / 2);

        // But: connected by a path (below)
        const pathY = imgY + imgH + 45;
        const pathStartX = img1X + imgW / 2;
        const pathEndX = img2X + imgW / 2;

        // Timeline path
        ctx.beginPath();
        ctx.moveTo(pathStartX, pathY);
        ctx.lineTo(pathEndX, pathY);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Time ticks
        const numTicks = 8;
        for (let i = 0; i <= numTicks; i++) {
            const tx = pathStartX + (i / numTicks) * (pathEndX - pathStartX);
            ctx.beginPath();
            ctx.moveTo(tx, pathY - 5);
            ctx.lineTo(tx, pathY + 5);
            ctx.strokeStyle = '#6366f180';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Animated dot
        const dotProgress = (t * 0.003) % 1;
        const dotX = pathStartX + dotProgress * (pathEndX - pathStartX);
        ctx.beginPath();
        ctx.arc(dotX, pathY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#6366f1';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Labels on path
        ctx.font = '9px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('t₀', pathStartX, pathY + 18);
        ctx.fillText('t_n', pathEndX, pathY + 18);
        ctx.fillText('Stetiger Pfad: jeder Moment überlappt mit dem vorherigen', W / 2, pathY + 32);

        // Bottom: Spacetime as fiber bundle
        const bundleY = H * 0.82;
        ctx.font = 'bold 10px system-ui';
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.fillText('Raumzeit als Faserbündel:', W / 2, bundleY);

        // Mini fiber bundle diagram
        const bStartX = W * 0.25;
        const bEndX = W * 0.75;
        const bBaseY = bundleY + 30;

        // Base (time axis)
        ctx.beginPath();
        ctx.moveTo(bStartX, bBaseY);
        ctx.lineTo(bEndX, bBaseY);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = '8px system-ui';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('Basis = Zeit', W / 2, bBaseY + 12);

        // Fibers (3D space at each time)
        for (let i = 0; i < 6; i++) {
            const fx = bStartX + (i / 5) * (bEndX - bStartX);
            const fh = 20 + 5 * Math.sin(t * 0.02 + i);
            ctx.beginPath();
            ctx.moveTo(fx, bBaseY);
            ctx.lineTo(fx, bBaseY - fh);
            ctx.strokeStyle = '#8b5cf680';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(fx, bBaseY - fh, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#8b5cf6';
            ctx.fill();
        }
        ctx.font = '8px system-ui';
        ctx.fillStyle = '#8b5cf6';
        ctx.textAlign = 'center';
        ctx.fillText('Faser = ℝ³ (3D-Raum)', W / 2, bBaseY - 35);

        activeVizAnimations['viz-infinity'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: FIBRATION INTRO (Slide 14)
// ============================================================
vizRegistry['viz-fibration-intro'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Faserung: F → E → B (Faser → Totalraum → Basis)', W / 2, 22);

        // Draw a clear fiber bundle diagram
        const baseY = H * 0.75;
        const baseStartX = W * 0.15;
        const baseEndX = W * 0.85;

        // Base space B (thick line)
        ctx.beginPath();
        ctx.moveTo(baseStartX, baseY);
        ctx.lineTo(baseEndX, baseY);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'center';
        ctx.fillText('Basis B (z.B. Zeitachse)', W / 2, baseY + 20);

        // Fibers over each point
        const numFibers = 10;
        const fiberHeight = H * 0.4;

        for (let i = 0; i < numFibers; i++) {
            const fx = baseStartX + (i / (numFibers - 1)) * (baseEndX - baseStartX);
            const wobble = Math.sin(t * 0.015 + i * 0.8) * 5;

            // Fiber line
            ctx.beginPath();
            ctx.moveTo(fx, baseY);
            ctx.lineTo(fx + wobble, baseY - fiberHeight);
            ctx.strokeStyle = '#8b5cf650';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Points on fiber (representing the "space" at that time)
            const numPts = 3;
            for (let p = 0; p < numPts; p++) {
                const py = baseY - (p + 1) / (numPts + 1) * fiberHeight;
                const px = fx + wobble * (p + 1) / (numPts + 1);
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#8b5cf6';
                ctx.fill();
            }

            // Base point
            ctx.beginPath();
            ctx.arc(fx, baseY, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.fill();
        }

        // Label for fiber
        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = '#8b5cf6';
        ctx.textAlign = 'left';
        ctx.fillText('Faser F', baseEndX + 10, baseY - fiberHeight / 2);
        ctx.font = '9px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('(z.B. ℝ³ = 3D-Raum', baseEndX + 10, baseY - fiberHeight / 2 + 14);
        ctx.fillText(' zu jedem Zeitpunkt)', baseEndX + 10, baseY - fiberHeight / 2 + 26);

        // Projection arrow π
        const arrowX = baseStartX - 20;
        ctx.beginPath();
        ctx.moveTo(arrowX, baseY - fiberHeight * 0.7);
        ctx.lineTo(arrowX, baseY - 10);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(arrowX, baseY - 10);
        ctx.lineTo(arrowX - 5, baseY - 20);
        ctx.lineTo(arrowX + 5, baseY - 20);
        ctx.closePath();
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.fillText('π', arrowX, baseY - fiberHeight * 0.7 - 8);
        ctx.font = '9px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Projektion', arrowX, baseY - fiberHeight * 0.35);

        // Totalraum E bracket
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = '#e2e8f040';
        ctx.lineWidth = 1;
        ctx.strokeRect(baseStartX - 5, baseY - fiberHeight - 10, baseEndX - baseStartX + 10, fiberHeight + 15);
        ctx.setLineDash([]);
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Totalraum E (z.B. 4D-Raumzeit)', W / 2, baseY - fiberHeight - 15);

        // Animated "section" (a curve through the fibers)
        ctx.beginPath();
        for (let i = 0; i < numFibers; i++) {
            const fx = baseStartX + (i / (numFibers - 1)) * (baseEndX - baseStartX);
            const sectionY = baseY - fiberHeight * (0.4 + 0.15 * Math.sin(t * 0.01 + i * 0.5));
            const wobble = Math.sin(t * 0.015 + i * 0.8) * 5 * (0.4 + 0.15 * Math.sin(t * 0.01 + i * 0.5));
            if (i === 0) ctx.moveTo(fx + wobble, sectionY);
            else ctx.lineTo(fx + wobble, sectionY);
        }
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'right';
        ctx.fillText('Schnitt (Section)', baseStartX - 30, baseY - fiberHeight * 0.4);

        activeVizAnimations['viz-fibration-intro'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: HOPF FIBRATION (Slide 15) – rebuilt from scratch
// ============================================================
vizRegistry['viz-hopf'] = function(container) {
    container.innerHTML = '';
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    container.appendChild(div);

    // Build Hopf fibers step by step
    // Each fiber is a circle in S³ projected stereographically to R³
    const traces = [];
    const numFibers = 16;
    const pointsPerFiber = 100;

    for (let f = 0; f < numFibers; f++) {
        // Choose base points on S² spread evenly
        const golden = (1 + Math.sqrt(5)) / 2;
        const theta = Math.acos(1 - 2 * (f + 0.5) / numFibers);
        const phi = 2 * Math.PI * f / golden;

        const xs = [], ys = [], zs = [];
        for (let i = 0; i <= pointsPerFiber; i++) {
            const s = (i / pointsPerFiber) * Math.PI * 2;

            // Hopf map: for base point (theta, phi) on S², the fiber is:
            const cosH = Math.cos(theta / 2);
            const sinH = Math.sin(theta / 2);

            // Point on S³
            const w = cosH * Math.cos(s);
            const x = cosH * Math.sin(s);
            const y = sinH * Math.cos(s + phi);
            const z = sinH * Math.sin(s + phi);

            // Stereographic projection from (1,0,0,0)
            const denom = 1.0 - w + 0.01;
            xs.push(x / denom);
            ys.push(y / denom);
            zs.push(z / denom);
        }

        // Clip to reasonable range
        const maxR = 4;
        const clippedXs = xs.map(v => Math.max(-maxR, Math.min(maxR, v)));
        const clippedYs = ys.map(v => Math.max(-maxR, Math.min(maxR, v)));
        const clippedZs = zs.map(v => Math.max(-maxR, Math.min(maxR, v)));

        const hue = (f / numFibers) * 360;
        traces.push({
            type: 'scatter3d',
            mode: 'lines',
            x: clippedXs, y: clippedYs, z: clippedZs,
            line: { width: 3.5, color: `hsl(${hue}, 75%, 55%)` },
            name: `Faser ${f + 1}`,
            showlegend: false,
            hoverinfo: 'name'
        });
    }

    // Add annotation trace: two linked fibers highlighted
    const highlight1 = traces[0];
    const highlight2 = traces[Math.floor(numFibers / 2)];
    if (highlight1) highlight1.line.width = 6;
    if (highlight2) highlight2.line.width = 6;

    const layout = {
        margin: { l: 0, r: 0, b: 30, t: 30 },
        title: { text: 'Hopf-Fasern: Jedes Paar ist einmal verlinkt', font: { size: 11, color: '#e2e8f0' } },
        showlegend: false,
        scene: {
            xaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '', range: [-4, 4] },
            yaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '', range: [-4, 4] },
            zaxis: { showgrid: false, zeroline: false, showticklabels: false, title: '', range: [-4, 4] },
            camera: { eye: { x: 1.6, y: 1.2, z: 0.8 } },
            bgcolor: '#1e293b'
        },
        paper_bgcolor: '#1e293b',
        annotations: [{
            text: 'Stereographische Projektion S³ → ℝ³',
            font: { size: 9, color: '#94a3b8' },
            showarrow: false, x: 0.5, y: 0, xref: 'paper', yref: 'paper'
        }]
    };

    if (typeof Plotly !== 'undefined') {
        Plotly.newPlot(div, traces, layout, { displayModeBar: false, responsive: true });
    } else {
        div.innerHTML = '<p style="color:#94a3b8;text-align:center;padding-top:40%;">Plotly.js nicht geladen – Hopf-Faserung benötigt Plotly.</p>';
    }
};

// ============================================================
// VIZ: TOPOS (Slide 16)
// ============================================================
vizRegistry['viz-topos'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    const topoi = [
        {
            x: W * 0.2, y: H * 0.5, r: 85, label: 'Set (Klassisch)',
            color: '#3b82f6',
            rules: ['A ∨ ¬A ✓', '¬¬A → A ✓', 'Ω = {0,1}'],
            truthColors: ['#1e293b', '#ffffff']
        },
        {
            x: W * 0.5, y: H * 0.45, r: 95, label: 'Sh(X) (Garben)',
            color: '#10b981',
            rules: ['A ∨ ¬A ✗', '¬¬A → A ✗', 'Ω = O(X)'],
            truthColors: ['#1e293b', '#134e4a', '#065f46', '#10b981', '#ffffff']
        },
        {
            x: W * 0.8, y: H * 0.5, r: 80, label: 'Intuitionistisch',
            color: '#8b5cf6',
            rules: ['A ∨ ¬A ✗', '¬¬A ≠ A', 'Konstruktiv'],
            truthColors: ['#1e293b', '#4c1d95', '#8b5cf6']
        },
    ];

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Topoi: Verschiedene Universen, verschiedene Logiken', W / 2, 18);

        topoi.forEach((tp, i) => {
            const pulse = 1 + 0.02 * Math.sin(t * 0.02 + i);

            // Glow
            const glow = ctx.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, tp.r * 1.4);
            glow.addColorStop(0, tp.color + '18');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(tp.x, tp.y, tp.r * 1.4, 0, Math.PI * 2);
            ctx.fill();

            // Border
            ctx.beginPath();
            ctx.arc(tp.x, tp.y, tp.r * pulse, 0, Math.PI * 2);
            ctx.strokeStyle = tp.color + '80';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            ctx.font = 'bold 12px system-ui';
            ctx.fillStyle = tp.color;
            ctx.textAlign = 'center';
            ctx.fillText(tp.label, tp.x, tp.y - 25);

            // Rules inside the bubble
            tp.rules.forEach((rule, ri) => {
                ctx.font = '10px system-ui';
                ctx.fillStyle = '#e2e8f0';
                ctx.fillText(rule, tp.x, tp.y + ri * 16);
            });

            // Truth value palette at bottom
            const paletteY = tp.y + tp.rules.length * 16 + 12;
            const paletteW = tp.truthColors.length * 16;
            const startPX = tp.x - paletteW / 2;

            tp.truthColors.forEach((tc, ci) => {
                ctx.beginPath();
                ctx.arc(startPX + ci * 16 + 8, paletteY, 6, 0, Math.PI * 2);
                ctx.fillStyle = tc;
                ctx.fill();
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        });

        activeVizAnimations['viz-topos'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: HoTT 1 (Slide 17) – Types as spaces
// ============================================================
vizRegistry['viz-hott1'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('HoTT: Typen sind Räume, Terme sind Punkte, Gleichheit ist ein Pfad', W / 2, 22);

        // Left: A type with points and paths
        const typeX = W * 0.3;
        const typeY = H * 0.5;
        const typeR = 90;

        // Type blob
        ctx.beginPath();
        ctx.ellipse(typeX, typeY, typeR, typeR * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
        ctx.fill();
        ctx.strokeStyle = '#6366f160';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = '#6366f1';
        ctx.textAlign = 'center';
        ctx.fillText('Typ A', typeX, typeY - typeR - 8);

        // Points
        const pts = [
            { x: typeX - 35, y: typeY - 20, label: 'a' },
            { x: typeX + 30, y: typeY - 10, label: 'b' },
            { x: typeX - 5, y: typeY + 30, label: 'c' },
        ];

        pts.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#6366f1';
            ctx.fill();
            ctx.font = 'bold 10px system-ui';
            ctx.fillStyle = '#e2e8f0';
            ctx.textAlign = 'center';
            ctx.fillText(p.label, p.x, p.y - 13);
        });

        // Animated path a → b
        const pathT = (Math.sin(t * 0.025) + 1) / 2;
        const cpx = (pts[0].x + pts[1].x) / 2;
        const cpy = (pts[0].y + pts[1].y) / 2 - 30;

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.quadraticCurveTo(cpx, cpy, pts[1].x, pts[1].y);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Moving dot on path
        const px = (1-pathT)**2 * pts[0].x + 2*(1-pathT)*pathT*cpx + pathT**2 * pts[1].x;
        const py = (1-pathT)**2 * pts[0].y + 2*(1-pathT)*pathT*cpy + pathT**2 * pts[1].y;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();

        ctx.font = '10px system-ui';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('p : a =_A b', cpx, cpy - 12);
        ctx.font = '8px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('(Pfad = Beweis der Gleichheit)', cpx, cpy + 4);

        // Right: Comparison with Set theory
        const rightX = W * 0.72;
        const compY = H * 0.3;

        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Vergleich:', rightX, compY - 20);

        const comparisons = [
            { set: 'Menge', hott: 'Typ (= Raum)', y: 0 },
            { set: 'Element', hott: 'Term (= Punkt)', y: 25 },
            { set: 'Gleichheit (ja/nein)', hott: 'Pfad (Struktur!)', y: 50 },
            { set: '—', hott: 'Pfad zw. Pfaden', y: 75 },
        ];

        comparisons.forEach(c => {
            ctx.font = '10px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'right';
            ctx.fillText(c.set, rightX - 10, compY + c.y);
            ctx.fillStyle = '#a5b4fc';
            ctx.textAlign = 'left';
            ctx.fillText(c.hott, rightX + 10, compY + c.y);
        });

        // Divider
        ctx.beginPath();
        ctx.moveTo(rightX, compY - 10);
        ctx.lineTo(rightX, compY + 85);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Bottom: "Schach" analogy
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('HoTT erzwingt: Man darf nur strukturerhaltende Aussagen machen.', W / 2, H - 30);
        ctx.fillText('Wie Schach: Nur regelkonforme Züge sind erlaubt.', W / 2, H - 14);

        activeVizAnimations['viz-hott1'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: HoTT 2 (Slide 18) – Type families, Σ, Π, Univalence
// ============================================================
vizRegistry['viz-hott2'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Typenfamilien = Faserbündel = Garben', W / 2, 22);

        // Draw a type family as fiber bundle
        const baseY = H * 0.7;
        const baseStartX = W * 0.1;
        const baseEndX = W * 0.6;

        // Base
        ctx.beginPath();
        ctx.moveTo(baseStartX, baseY);
        ctx.lineTo(baseEndX, baseY);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'center';
        ctx.fillText('X (Basistyp)', (baseStartX + baseEndX) / 2, baseY + 16);

        // Fibers of varying height (different types P(x))
        const numF = 7;
        for (let i = 0; i < numF; i++) {
            const fx = baseStartX + (i / (numF - 1)) * (baseEndX - baseStartX);
            const fh = 50 + 30 * Math.sin(i * 1.2 + 0.5);
            const wobble = Math.sin(t * 0.015 + i) * 3;

            ctx.beginPath();
            ctx.moveTo(fx, baseY);
            ctx.lineTo(fx + wobble, baseY - fh);
            ctx.strokeStyle = '#8b5cf660';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Multiple points on fiber
            const numPts = 2 + Math.floor(Math.sin(i) + 2);
            for (let p = 0; p < numPts; p++) {
                const py = baseY - (p + 1) / (numPts + 1) * fh;
                ctx.beginPath();
                ctx.arc(fx + wobble * (p + 1) / (numPts + 1), py, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#8b5cf6';
                ctx.fill();
            }

            // Base point
            ctx.beginPath();
            ctx.arc(fx, baseY, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.fill();

            // Label first and last
            if (i === 0) {
                ctx.font = '9px system-ui';
                ctx.fillStyle = '#8b5cf6';
                ctx.textAlign = 'center';
                ctx.fillText('P(x₁)', fx, baseY - fh - 10);
            }
            if (i === numF - 1) {
                ctx.font = '9px system-ui';
                ctx.fillStyle = '#8b5cf6';
                ctx.fillText('P(xₙ)', fx, baseY - fh - 10);
            }
        }

        // Section (Π) – a curve choosing one point from each fiber
        ctx.beginPath();
        for (let i = 0; i < numF; i++) {
            const fx = baseStartX + (i / (numF - 1)) * (baseEndX - baseStartX);
            const fh = 50 + 30 * Math.sin(i * 1.2 + 0.5);
            const sectionY = baseY - fh * (0.5 + 0.2 * Math.sin(t * 0.01 + i));
            if (i === 0) ctx.moveTo(fx, sectionY);
            else ctx.lineTo(fx, sectionY);
        }
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'left';
        ctx.fillText('Schnitt = Π(x:X) P(x)', baseEndX + 10, baseY - 60);

        // Right side: Formulas explained visually
        const formX = W * 0.78;
        const formStartY = H * 0.15;

        const formulas = [
            { symbol: 'Π(x:X) P(x)', meaning: 'Für jeden x, wähle ein Element aus P(x)', color: '#ef4444' },
            { symbol: 'Σ(x:X) P(x)', meaning: 'Es gibt ein x mit Element in P(x)', color: '#f59e0b' },
            { symbol: '(A ≃ B) ≃ (A = B)', meaning: 'Äquivalenz IST Gleichheit', color: '#a78bfa' },
        ];

        formulas.forEach((f, i) => {
            const fy = formStartY + i * 70;
            ctx.font = 'bold 11px monospace';
            ctx.fillStyle = f.color;
            ctx.textAlign = 'center';
            ctx.fillText(f.symbol, formX, fy);
            ctx.font = '9px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(f.meaning, formX, fy + 16);
        });

        activeVizAnimations['viz-hott2'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: SITE (Slide 19) – with colored different senses
// ============================================================
vizRegistry['viz-site'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    const senses = [
        { x: W * 0.15, y: H * 0.2, label: 'Sehen', color: '#3b82f6', icon: '👁️' },
        { x: W * 0.85, y: H * 0.2, label: 'Hören', color: '#f59e0b', icon: '👂' },
        { x: W * 0.1, y: H * 0.75, label: 'Denken', color: '#8b5cf6', icon: '💭' },
        { x: W * 0.9, y: H * 0.75, label: 'Messen', color: '#10b981', icon: '📐' },
        { x: W * 0.5, y: H * 0.12, label: 'Fühlen', color: '#ec4899', icon: '✋' },
    ];

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        const cx = W / 2;
        const cy = H / 2 + 10;

        // The Site (hidden center)
        const siteR = 60;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, siteR * 2);
        glow.addColorStop(0, 'rgba(100, 100, 130, 0.12)');
        glow.addColorStop(0.5, 'rgba(80, 80, 110, 0.05)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, siteR * 2, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing question mark
        const pulse = 0.25 + 0.12 * Math.sin(t * 0.02);
        ctx.font = 'bold 50px system-ui';
        ctx.fillStyle = `rgba(100, 100, 140, ${pulse})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', cx, cy);

        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = `rgba(148, 163, 184, ${pulse + 0.4})`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Site (Ding an sich)', cx, cy + 40);

        // Each sense with its own color, pointing toward center
        senses.forEach((s, i) => {
            const midX = (s.x + cx) / 2;
            const midY = (s.y + cy) / 2;

            // Colored beam toward center
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(midX, midY);
            ctx.strokeStyle = s.color + '50';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);

            // X mark (no direct access)
            ctx.font = 'bold 16px system-ui';
            ctx.fillStyle = '#ef4444';
            ctx.textAlign = 'center';
            ctx.fillText('✗', midX, midY);

            // Sense bubble
            ctx.beginPath();
            ctx.arc(s.x, s.y, 25, 0, Math.PI * 2);
            ctx.fillStyle = s.color + '20';
            ctx.fill();
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Icon
            ctx.font = '18px system-ui';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(s.icon, s.x, s.y - 2);
            ctx.textBaseline = 'alphabetic';

            // Label
            ctx.font = 'bold 10px system-ui';
            ctx.fillStyle = s.color;
            ctx.fillText(s.label, s.x, s.y + 30);

            // Animated particles flowing outward (we see the garbe, not the site)
            const particleProgress = (t * 0.006 + i * 0.2) % 1;
            const px = midX + (s.x - midX) * particleProgress * 0.6;
            const py = midY + (s.y - midY) * particleProgress * 0.6;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.fill();
        });

        // Bottom text
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('Grundlegend verschiedene Datentypen – aber alle verweisen auf dieselbe Wirklichkeit', cx, H - 15);

        activeVizAnimations['viz-site'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: WORLDVIEW (Slide 20) – different types of data converging
// ============================================================
vizRegistry['viz-worldview'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    // Different types of "measurements" with distinct visual styles
    const dataTypes = [
        { color: '#3b82f6', shape: 'circle', label: 'visuell' },
        { color: '#f59e0b', shape: 'wave', label: 'auditiv' },
        { color: '#10b981', shape: 'diamond', label: 'taktil' },
        { color: '#8b5cf6', shape: 'square', label: 'logisch' },
        { color: '#ec4899', shape: 'triangle', label: 'emotional' },
    ];

    // Generate particles of different types
    const particles = [];
    for (let i = 0; i < 30; i++) {
        const type = dataTypes[i % dataTypes.length];
        const angle = (i / 30) * Math.PI * 2 + Math.random() * 0.3;
        const dist = 120 + Math.random() * 80;
        particles.push({
            x: W / 2 + Math.cos(angle) * dist,
            y: H / 2 + Math.sin(angle) * dist,
            targetX: W / 2 + Math.cos(angle) * dist * 0.25,
            targetY: H / 2 + Math.sin(angle) * dist * 0.25,
            type: type,
            size: 6 + Math.random() * 4,
            phase: Math.random() * Math.PI * 2
        });
    }

    function drawShape(x, y, size, shape, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        switch (shape) {
            case 'circle':
                ctx.arc(x, y, size, 0, Math.PI * 2);
                break;
            case 'square':
                ctx.rect(x - size, y - size, size * 2, size * 2);
                break;
            case 'diamond':
                ctx.moveTo(x, y - size);
                ctx.lineTo(x + size, y);
                ctx.lineTo(x, y + size);
                ctx.lineTo(x - size, y);
                break;
            case 'triangle':
                ctx.moveTo(x, y - size);
                ctx.lineTo(x + size, y + size * 0.7);
                ctx.lineTo(x - size, y + size * 0.7);
                break;
            case 'wave':
                ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
                break;
        }
        ctx.closePath();
        ctx.fill();
    }

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Konsistentes Weltbild: Verschiedene Datentypen, ein globaler Schnitt', W / 2, 20);

        const progress = Math.min(1, t * 0.0015);
        const eased = 1 - Math.pow(1 - progress, 3);

        // Draw particles converging
        particles.forEach((p, i) => {
            const px = p.x + (p.targetX - p.x) * eased;
            const py = p.y + (p.targetY - p.y) * eased;

            drawShape(px, py, p.size, p.type.shape, p.type.color + 'cc');

            // Connection lines when close
            if (eased > 0.4) {
                particles.forEach((other, j) => {
                    if (j <= i) return;
                    const ox = other.x + (other.targetX - other.x) * eased;
                    const oy = other.y + (other.targetY - other.y) * eased;
                    const dist = Math.sqrt((px - ox) ** 2 + (py - oy) ** 2);
                    if (dist < 60) {
                        const alpha = (1 - dist / 60) * 0.25 * eased;
                        ctx.beginPath();
                        ctx.moveTo(px, py);
                        ctx.lineTo(ox, oy);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                });
            }
        });

        // Center label when assembled
        if (eased > 0.6) {
            const alpha = Math.min(1, (eased - 0.6) * 2.5);
            ctx.font = 'bold 13px system-ui';
            ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.textAlign = 'center';
            ctx.fillText('Globaler Schnitt', W / 2, H / 2 - 5);
            ctx.font = '10px system-ui';
            ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
            ctx.fillText('∃ s ∈ F(X)', W / 2, H / 2 + 12);
        }

        // Legend at bottom
        const legendY = H - 25;
        const legendStartX = W * 0.15;
        const legendSpacing = W * 0.7 / (dataTypes.length - 1);
        dataTypes.forEach((dt, i) => {
            const lx = legendStartX + i * legendSpacing;
            drawShape(lx, legendY, 5, dt.shape, dt.color);
            ctx.font = '8px system-ui';
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            ctx.fillText(dt.label, lx, legendY + 14);
        });

        activeVizAnimations['viz-worldview'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: LLM SHEAF (Slide 21) – kept from before
// ============================================================
vizRegistry['viz-llm-sheaf'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    const nodes = [];
    const numNodes = 22;
    for (let i = 0; i < numNodes; i++) {
        const angle = (i / numNodes) * Math.PI * 2;
        const r = 80 + Math.random() * 70;
        nodes.push({
            x: W / 2 + Math.cos(angle) * r,
            y: H / 2 + Math.sin(angle) * r,
            size: 5 + Math.random() * 4,
            consistent: Math.random() > 0.15,
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

        nodes.forEach((node, i) => {
            nodes.forEach((other, j) => {
                if (j <= i) return;
                const dist = Math.sqrt((node.x - other.x) ** 2 + (node.y - other.y) ** 2);
                if (dist < 110) {
                    const both = node.consistent && other.consistent;
                    const alpha = (1 - dist / 110) * 0.35;
                    ctx.beginPath();
                    ctx.moveTo(node.x, node.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.strokeStyle = both ? `rgba(74, 222, 128, ${alpha})` : `rgba(248, 113, 113, ${alpha})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            });
        });

        nodes.forEach((node, i) => {
            const pulse = 1 + 0.1 * Math.sin(t * 0.03 + i);
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.size * pulse, 0, Math.PI * 2);
            ctx.fillStyle = node.consistent ? `hsla(${node.hue}, 50%, 55%, 0.8)` : 'rgba(248, 113, 113, 0.9)';
            ctx.fill();
            if (!node.consistent) {
                ctx.font = '9px system-ui';
                ctx.fillStyle = '#f87171';
                ctx.textAlign = 'center';
                ctx.fillText('✗', node.x, node.y - node.size - 4);
            }
        });

        ctx.font = '9px system-ui';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(15, H - 35, 8, 8);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Konsistent (verklebbar)', 28, H - 27);
        ctx.fillStyle = '#f87171';
        ctx.fillRect(15, H - 18, 8, 8);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Halluzination (H¹ ≠ 0)', 28, H - 10);

        activeVizAnimations['viz-llm-sheaf'] = requestAnimationFrame(draw);
    }
    draw();
};

// ============================================================
// VIZ: SUMMARY (Slide 22)
// ============================================================
vizRegistry['viz-summary'] = function(container) {
    const { ctx, W, H } = setupCanvas(container);
    let t = 0;

    const boxes = [
        { x: W * 0.1, y: H * 0.45, label: 'Site', sub: '(Ding an sich)', color: '#64748b' },
        { x: W * 0.26, y: H * 0.45, label: 'Garbe', sub: '(Messungen)', color: '#6366f1' },
        { x: W * 0.42, y: H * 0.45, label: 'Schnitte', sub: '(Daten)', color: '#3b82f6' },
        { x: W * 0.58, y: H * 0.45, label: 'Kohomologie', sub: '(Obstruktion)', color: '#f59e0b' },
        { x: W * 0.76, y: H * 0.45, label: 'Konsistenz?', sub: '', color: '#10b981' },
        { x: W * 0.92, y: H * 0.45, label: 'Weltbild', sub: '', color: '#ef4444' },
    ];

    function draw() {
        t++;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Das verklebte Gesamtbild', W / 2, 18);

        boxes.forEach((box, i) => {
            const bw = 80;
            const bh = 48;
            ctx.fillStyle = box.color + '18';
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
            { x: W * 0.12, y: H * 0.78, label: 'Eichtheorie', color: '#8b5cf6' },
            { x: W * 0.3, y: H * 0.78, label: '∞-Garben', color: '#ec4899' },
            { x: W * 0.48, y: H * 0.78, label: 'Topoi', color: '#14b8a6' },
            { x: W * 0.66, y: H * 0.78, label: 'HoTT', color: '#f59e0b' },
            { x: W * 0.84, y: H * 0.78, label: 'Falsifikation', color: '#ef4444' },
        ];

        extras.forEach((ex, i) => {
            const pulse = 0.6 + 0.2 * Math.sin(t * 0.02 + i);
            ctx.font = '10px system-ui';
            ctx.fillStyle = ex.color + Math.round(pulse * 255).toString(16).padStart(2, '0');
            ctx.textAlign = 'center';
            ctx.fillText(ex.label, ex.x, ex.y);

            // Dashed line up to main flow
            const targetBox = boxes[Math.min(i, boxes.length - 1)];
            ctx.beginPath();
            ctx.moveTo(ex.x, ex.y - 10);
            ctx.lineTo(ex.x, H * 0.45 + 28);
            ctx.strokeStyle = ex.color + '30';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // Title
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('Das verklebte Gesamtbild', W / 2, 18);

        // Bottom summary line
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('Site → Garbe → Schnitte → Kohomologie → Konsistenz / Inkonsistenz', W / 2, H - 12);

        activeVizAnimations['viz-summary'] = requestAnimationFrame(draw);
    }
    draw();
};
