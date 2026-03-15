"use strict";

// ============================================================
// LAZY LOADING INFRASTRUCTURE
// ============================================================

const _topologyLazyRegistry = [];
let _topologyLazyObserver = null;

function _topologyLazyRegister(elementId, initFn) {
    const el = document.getElementById(elementId);
    if (!el) return;
    _topologyLazyRegistry.push({ el, initFn, initialized: false });
}

function _topologyLazyCreateObserver() {
    if (_topologyLazyObserver) return;

    _topologyLazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const match = _topologyLazyRegistry.find(r => r.el === entry.target);
            if (match && !match.initialized) {
                match.initialized = true;
                _topologyLazyObserver.unobserve(match.el);
                match.initFn();
            }
        });
    }, { rootMargin: typeof rootMargin !== 'undefined' ? rootMargin : '200px' });

    _topologyLazyRegistry.forEach(r => {
        if (!r.initialized) _topologyLazyObserver.observe(r.el);
    });
}

// ============================================================
// AUDIO ENGINE — Pentatonic tones for Turing steps
// ============================================================

const _topoAudio = {
    ctx: null,
    frequencies: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
    enabled: true,

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { /* no audio support */ }
    },

    playTone(stateIndex, duration) {
        duration = duration || 0.15;
        if (!this.enabled || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        var freq = this.frequencies[stateIndex % this.frequencies.length];
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    playHalt() {
        if (!this.enabled || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        var self = this;
        [440, 330].forEach(function(freq, i) {
            var osc = self.ctx.createOscillator();
            var gain = self.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, self.ctx.currentTime + i * 0.12);
            gain.gain.setValueAtTime(0.15, self.ctx.currentTime + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, self.ctx.currentTime + i * 0.12 + 0.2);
            osc.connect(gain);
            gain.connect(self.ctx.destination);
            osc.start(self.ctx.currentTime + i * 0.12);
            osc.stop(self.ctx.currentTime + i * 0.12 + 0.2);
        });
    },

    playCorrect() {
        if (!this.enabled || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        var self = this;
        [523.25, 659.25, 783.99].forEach(function(freq, i) {
            var osc = self.ctx.createOscillator();
            var gain = self.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, self.ctx.currentTime + i * 0.1);
            gain.gain.setValueAtTime(0.12, self.ctx.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, self.ctx.currentTime + i * 0.1 + 0.18);
            osc.connect(gain);
            gain.connect(self.ctx.destination);
            osc.start(self.ctx.currentTime + i * 0.1);
            osc.stop(self.ctx.currentTime + i * 0.1 + 0.18);
        });
    },

    playWrong() {
        if (!this.enabled || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        var self = this;
        [311.13, 233.08].forEach(function(freq, i) {
            var osc = self.ctx.createOscillator();
            var gain = self.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, self.ctx.currentTime + i * 0.15);
            gain.gain.setValueAtTime(0.08, self.ctx.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, self.ctx.currentTime + i * 0.15 + 0.2);
            osc.connect(gain);
            gain.connect(self.ctx.destination);
            osc.start(self.ctx.currentTime + i * 0.15);
            osc.stop(self.ctx.currentTime + i * 0.15 + 0.2);
        });
    }
};

function _topoHaptic(pattern) {
    if (navigator.vibrate) {
        try { navigator.vibrate(pattern); } catch (e) { /* ignore */ }
    }
}

// ============================================================
// 1. LATENT SPACE MANIFOLD (Plotly surface)
// ============================================================

function initTopologyVisualization() {
    var warpSlider = document.getElementById('topo-warp');
    var warpVal = document.getElementById('topo-warp-val');
    var plotId = 'topology-plot';

    function render() {
        var warp = parseFloat(warpSlider.value);
        if (warpVal) warpVal.textContent = warp.toFixed(2);

        var size = 50;
        var zValues = [], xValues = [], yValues = [];

        for (var i = 0; i < size; i++) xValues.push(-2 + (4 * i / (size - 1)));
        for (var j = 0; j < size; j++) yValues.push(-2 + (4 * j / (size - 1)));

        for (var i = 0; i < size; i++) {
            var row = [];
            for (var j = 0; j < size; j++) {
                var x = xValues[i], y = yValues[j];
                var r = Math.sqrt(x * x + y * y);
                var z = Math.sin(r * (1 + warp * 3)) * (1 / (1 + r * 0.3));
                z += warp * 0.3 * (x * x - y * y) * 0.1;
                z += warp * 0.2 * Math.sin(x * 2) * Math.cos(y * 2) * 0.5;
                row.push(z);
            }
            zValues.push(row);
        }

        var data = [{
            z: zValues, x: xValues, y: yValues,
            type: 'surface',
            colorscale: [
                [0, 'rgba(99,102,241,0.85)'], [0.25, 'rgba(139,92,246,0.85)'],
                [0.5, 'rgba(236,72,153,0.85)'], [0.75, 'rgba(249,115,22,0.85)'],
                [1, 'rgba(245,158,11,0.85)']
            ],
            showscale: false,
            contours: { z: { show: true, usecolormap: true, project: { z: true }, highlightcolor: '#fff', highlightwidth: 1 } },
            lighting: { roughness: 0.6, fresnel: 0.2, specular: 0.8, diffuse: 0.8 },
            opacity: 0.92
        }];

        var layout = {
            title: { text: 'Topological Manifold — Latent Space', font: { size: 14, color: '#475569' } },
            scene: {
                camera: { eye: { x: 1.6, y: 1.6, z: 1.0 } },
                xaxis: { title: 'Feature A', showgrid: true, gridcolor: '#f1f5f9', zerolinecolor: '#e2e8f0' },
                yaxis: { title: 'Feature B', showgrid: true, gridcolor: '#f1f5f9', zerolinecolor: '#e2e8f0' },
                zaxis: { title: 'Activation', range: [-1.8, 1.8], showgrid: true, gridcolor: '#f1f5f9' },
                bgcolor: '#fff'
            },
            margin: { t: 50, b: 0, l: 0, r: 0 }
        };

        if (typeof lazyRender === 'function') {
            lazyRender(plotId, function() { Plotly.react(plotId, data, layout, { displayModeBar: false, responsive: true }); });
        } else {
            Plotly.react(plotId, data, layout, { displayModeBar: false, responsive: true });
        }

        renderPersistenceBarcode(warp);
    }

    if (warpSlider) {
        warpSlider.addEventListener('input', render);
        render();
    }
}

// ============================================================
// 2. PERSISTENCE BARCODE
// ============================================================

function renderPersistenceBarcode(warp) {
    var canvas = document.getElementById('canvas-persistence-barcode');
    if (!canvas) return;

    var rect = canvas.getBoundingClientRect();
    var W = rect.width;
    var H = rect.height;
    canvas.width = W * window.devicePixelRatio;
    canvas.height = H * window.devicePixelRatio;
    var ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    var b0Features = [
        { birth: 0.0, death: 0.95 + warp * 0.05 },
        { birth: 0.05, death: 0.3 + warp * 0.2 },
        { birth: 0.1, death: 0.15 + warp * 0.05 }
    ];

    var b1Features = [
        { birth: 0.1, death: 0.1 + Math.max(0, warp * 0.7) },
        { birth: 0.2, death: 0.2 + Math.max(0, (warp - 0.3) * 0.5) },
        { birth: 0.35, death: 0.35 + Math.max(0, (warp - 0.5) * 0.4) }
    ];

    var b2Features = [
        { birth: 0.3, death: 0.3 + Math.max(0, (warp - 0.6) * 0.35) },
        { birth: 0.5, death: 0.5 + Math.max(0, (warp - 0.8) * 0.2) }
    ];

    var allFeatures = [];
    b0Features.forEach(function(f) { allFeatures.push({ birth: f.birth, death: f.death, type: 0, color: '#3b82f6', label: 'β₀' }); });
    b1Features.forEach(function(f) { if (f.death > f.birth + 0.01) allFeatures.push({ birth: f.birth, death: f.death, type: 1, color: '#10b981', label: 'β₁' }); });
    b2Features.forEach(function(f) { if (f.death > f.birth + 0.01) allFeatures.push({ birth: f.birth, death: f.death, type: 2, color: '#f59e0b', label: 'β₂' }); });

    var margin = { left: 40, right: 20, top: 15, bottom: 25 };
    var plotW = W - margin.left - margin.right;
    var plotH = H - margin.top - margin.bottom;
    var barH = Math.min(14, plotH / (allFeatures.length + 1));
    var gap = 3;

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, H - margin.bottom);
    ctx.lineTo(W - margin.right, H - margin.bottom);
    ctx.stroke();

    ctx.font = '9px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    for (var t = 0; t <= 1; t += 0.25) {
        var tx = margin.left + t * plotW;
        ctx.beginPath();
        ctx.moveTo(tx, H - margin.bottom);
        ctx.lineTo(tx, H - margin.bottom + 4);
        ctx.stroke();
        ctx.fillText(t.toFixed(2), tx, H - margin.bottom + 15);
    }

    ctx.fillStyle = '#64748b';
    ctx.fillText('Scale (ε)', margin.left + plotW / 2, H - 2);

    allFeatures.forEach(function(f, i) {
        var x1 = margin.left + f.birth * plotW;
        var x2 = margin.left + f.death * plotW;
        var y = margin.top + i * (barH + gap);

        ctx.fillStyle = f.color;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(x1, y, Math.max(x2 - x1, 2), barH);
        ctx.globalAlpha = 1.0;

        ctx.strokeStyle = f.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x1, y, Math.max(x2 - x1, 2), barH);

        ctx.font = 'bold 8px system-ui, sans-serif';
        ctx.fillStyle = f.color;
        ctx.textAlign = 'right';
        ctx.fillText(f.label, margin.left - 5, y + barH - 2);

        var persistence = (f.death - f.birth).toFixed(2);
        if (x2 - x1 > 30) {
            ctx.font = '8px monospace';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(persistence, (x1 + x2) / 2, y + barH - 3);
        }
    });
}

// ============================================================
// 3. DRAW YOUR OWN MANIFOLD — Live Betti Numbers
// ============================================================

var _drawManifold = {
    canvas: null, ctx: null, drawing: false,
    strokes: [], currentStroke: [],
    brushSize: 6, eraser: false, debounceTimer: null
};

function initDrawManifold() {
    var canvas = document.getElementById('canvas-draw-manifold');
    if (!canvas) return;

    var dm = _drawManifold;
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    dm.canvas = canvas;
    dm.ctx = canvas.getContext('2d');
    dm.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    var brushSlider = document.getElementById('draw-brush-size');
    var brushVal = document.getElementById('draw-brush-size-val');
    var eraserCheck = document.getElementById('draw-eraser-mode');

    if (brushSlider) {
        brushSlider.addEventListener('input', function() {
            dm.brushSize = parseInt(brushSlider.value);
            if (brushVal) brushVal.textContent = dm.brushSize;
        });
    }
    if (eraserCheck) {
        eraserCheck.addEventListener('change', function() { dm.eraser = eraserCheck.checked; });
    }

    function getPos(e) {
        var r = canvas.getBoundingClientRect();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - r.left, y: clientY - r.top };
    }

    function startDraw(e) {
        e.preventDefault();
        dm.drawing = true;
        dm.currentStroke = [getPos(e)];
    }

    function moveDraw(e) {
        e.preventDefault();
        if (!dm.drawing) return;
        var pos = getPos(e);
        dm.currentStroke.push(pos);
        var prev = dm.currentStroke.length >= 2 ? dm.currentStroke[dm.currentStroke.length - 2] : pos;
        drawStrokeSegment(prev, pos);
    }

    function endDraw(e) {
        if (!dm.drawing) return;
        dm.drawing = false;
        if (dm.currentStroke.length > 0) {
            dm.strokes.push({ points: dm.currentStroke.slice(), eraser: dm.eraser, size: dm.brushSize });
            dm.currentStroke = [];
        }
        scheduleBettiComputation();
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', moveDraw, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    redrawManifoldCanvas();
}

function drawStrokeSegment(from, to) {
    var dm = _drawManifold;
    if (!dm.ctx) return;
    dm.ctx.beginPath();
    dm.ctx.moveTo(from.x, from.y);
    dm.ctx.lineTo(to.x, to.y);
    dm.ctx.strokeStyle = dm.eraser ? '#ffffff' : '#1e293b';
    dm.ctx.lineWidth = dm.brushSize;
    dm.ctx.lineCap = 'round';
    dm.ctx.lineJoin = 'round';
    dm.ctx.globalCompositeOperation = dm.eraser ? 'destination-out' : 'source-over';
    dm.ctx.stroke();
    dm.ctx.globalCompositeOperation = 'source-over';
}

function redrawManifoldCanvas() {
    var dm = _drawManifold;
    if (!dm.ctx) return;
    var rect = dm.canvas.getBoundingClientRect();
    var W = rect.width, H = rect.height;

    dm.ctx.clearRect(0, 0, W, H);
    dm.ctx.fillStyle = '#ffffff';
    dm.ctx.fillRect(0, 0, W, H);

    dm.strokes.forEach(function(stroke) {
        if (stroke.points.length < 2) return;
        dm.ctx.beginPath();
        dm.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (var i = 1; i < stroke.points.length; i++) {
            dm.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        dm.ctx.strokeStyle = stroke.eraser ? '#ffffff' : '#1e293b';
        dm.ctx.lineWidth = stroke.size;
        dm.ctx.lineCap = 'round';
        dm.ctx.lineJoin = 'round';
        dm.ctx.globalCompositeOperation = stroke.eraser ? 'destination-out' : 'source-over';
        dm.ctx.stroke();
        dm.ctx.globalCompositeOperation = 'source-over';
    });
}

window.clearDrawManifold = function() {
    _drawManifold.strokes = [];
    _drawManifold.currentStroke = [];
    redrawManifoldCanvas();
    updateBettiDisplay(0, 0);
};

window.undoDrawManifold = function() {
    if (_drawManifold.strokes.length > 0) {
        _drawManifold.strokes.pop();
        redrawManifoldCanvas();
        scheduleBettiComputation();
    }
};

function scheduleBettiComputation() {
    clearTimeout(_drawManifold.debounceTimer);
    _drawManifold.debounceTimer = setTimeout(computeBettiNumbers, 200);
}

function computeBettiNumbers() {
    var dm = _drawManifold;
    if (!dm.canvas) return;

    var rect = dm.canvas.getBoundingClientRect();
    var W = Math.floor(rect.width);
    var H = Math.floor(rect.height);
    var scale = 4;
    var sW = Math.floor(W / scale);
    var sH = Math.floor(H / scale);

    var tempCanvas = document.createElement('canvas');
    tempCanvas.width = sW;
    tempCanvas.height = sH;
    var tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(dm.canvas, 0, 0, dm.canvas.width, dm.canvas.height, 0, 0, sW, sH);
    var imageData = tempCtx.getImageData(0, 0, sW, sH);
    var pixels = imageData.data;

    var grid = [];
    for (var y = 0; y < sH; y++) {
        grid[y] = [];
        for (var x = 0; x < sW; x++) {
            var idx = (y * sW + x) * 4;
            grid[y][x] = (pixels[idx] < 200 && pixels[idx+1] < 200 && pixels[idx+2] < 200) ? 1 : 0;
        }
    }

    // β₀: connected components via flood fill
    var visited = [];
    for (var y = 0; y < sH; y++) visited[y] = new Uint8Array(sW);
    var beta0 = 0;

    for (var y = 0; y < sH; y++) {
        for (var x = 0; x < sW; x++) {
            if (grid[y][x] === 1 && !visited[y][x]) {
                beta0++;
                var queue = [{ x: x, y: y }];
                visited[y][x] = 1;
                while (queue.length > 0) {
                    var c = queue.shift();
                    var neighbors = [
                        { x: c.x-1, y: c.y }, { x: c.x+1, y: c.y },
                        { x: c.x, y: c.y-1 }, { x: c.x, y: c.y+1 }
                    ];
                    for (var n = 0; n < neighbors.length; n++) {
                        var nb = neighbors[n];
                        if (nb.x >= 0 && nb.x < sW && nb.y >= 0 && nb.y < sH &&
                            grid[nb.y][nb.x] === 1 && !visited[nb.y][nb.x]) {
                            visited[nb.y][nb.x] = 1;
                            queue.push(nb);
                        }
                    }
                }
            }
        }
    }

    // β₁: enclosed background regions (holes)
    var visitedBg = [];
    for (var y = 0; y < sH; y++) visitedBg[y] = new Uint8Array(sW);
    var beta1 = 0;

    for (var y = 0; y < sH; y++) {
        for (var x = 0; x < sW; x++) {
            if (grid[y][x] === 0 && !visitedBg[y][x]) {
                var touchesBorder = false;
                var queue = [{ x: x, y: y }];
                visitedBg[y][x] = 1;
                while (queue.length > 0) {
                    var c = queue.shift();
                    if (c.x === 0 || c.x === sW-1 || c.y === 0 || c.y === sH-1) touchesBorder = true;
                    var neighbors = [
                        { x: c.x-1, y: c.y }, { x: c.x+1, y: c.y },
                        { x: c.x, y: c.y-1 }, { x: c.x, y: c.y+1 }
                    ];
                    for (var n = 0; n < neighbors.length; n++) {
                        var nb = neighbors[n];
                        if (nb.x >= 0 && nb.x < sW && nb.y >= 0 && nb.y < sH &&
                            grid[nb.y][nb.x] === 0 && !visitedBg[nb.y][nb.x]) {
                            visitedBg[nb.y][nb.x] = 1;
                            queue.push(nb);
                        }
                    }
                }
                if (!touchesBorder) beta1++;
            }
        }
    }

    updateBettiDisplay(beta0, beta1);
}

function updateBettiDisplay(beta0, beta1) {
    var b0El = document.getElementById('betti-0');
    var b1El = document.getElementById('betti-1');
    var eulerEl = document.getElementById('euler-char');

    if (b0El) {
        b0El.textContent = beta0;
        b0El.style.transition = 'transform 0.2s';
        b0El.style.transform = 'scale(1.2)';
        setTimeout(function() { b0El.style.transform = 'scale(1)'; }, 200);
    }
    if (b1El) {
        b1El.textContent = beta1;
        b1El.style.transition = 'transform 0.2s';
        b1El.style.transform = 'scale(1.2)';
        setTimeout(function() { b1El.style.transform = 'scale(1)'; }, 200);
    }
    if (eulerEl) {
        eulerEl.textContent = beta0 - beta1;
        eulerEl.style.transition = 'transform 0.2s';
        eulerEl.style.transform = 'scale(1.2)';
        setTimeout(function() { eulerEl.style.transform = 'scale(1)'; }, 200);
    }
}

// ============================================================
// 4. TOPOLOGY QUIZ
// ============================================================

var _topoQuiz = {
    questions: [
        { shapeA: 'circle', shapeB: 'square', answer: true,
          explanation: 'Yes! A circle and a square are homeomorphic — you can continuously deform one into the other. Both are simple closed curves (β₀=1, β₁=1).' },
        { shapeA: 'sphere', shapeB: 'torus', answer: false,
          explanation: 'No! A sphere has no holes (β₁=0), but a torus has one (β₁=1). You\'d have to punch a hole — that\'s tearing.' },
        { shapeA: 'mug', shapeB: 'torus', answer: true,
          explanation: 'Yes! The classic example — a coffee mug and a donut are homeomorphic. Both have exactly one hole (the handle / the donut hole).' },
        { shapeA: 'line', shapeB: 'circle', answer: false,
          explanation: 'No! A line segment has two endpoints; a circle has none. You\'d have to glue the endpoints together.' },
        { shapeA: 'figure8', shapeB: 'circle', answer: false,
          explanation: 'No! A figure-8 has two loops (β₁=2), while a circle has one (β₁=1). You can\'t remove a loop without tearing.' },
        { shapeA: 'trefoil', shapeB: 'circle', answer: true,
          explanation: 'Yes! A trefoil knot is homeomorphic to a circle — both are simple closed curves. The knot is an embedding difference, not a topological one.' },
        { shapeA: 'disk', shapeB: 'square_filled', answer: true,
          explanation: 'Yes! A filled disk and a filled square are homeomorphic — both are simply connected regions with no holes.' },
        { shapeA: 'annulus', shapeB: 'cylinder', answer: true,
          explanation: 'Yes! An annulus (ring) and a cylinder are homeomorphic — both have one hole. You can stretch the flat ring into a tube.' },
        { shapeA: 'two_circles', shapeB: 'circle', answer: false,
          explanation: 'No! Two disjoint circles have β₀=2 (two components), while a single circle has β₀=1.' },
        { shapeA: 'mobius', shapeB: 'annulus', answer: false,
          explanation: 'No! A Möbius strip is non-orientable (one-sided), while an annulus is orientable (two-sided).' }
    ],
    currentIndex: 0, score: 0, total: 0, answered: false
};

function initTopologyQuiz() {
    _topoQuiz.currentIndex = 0;
    _topoQuiz.score = 0;
    _topoQuiz.total = 0;
    _topoQuiz.answered = false;
    renderQuizQuestion();
}

function renderQuizQuestion() {
    var q = _topoQuiz.questions[_topoQuiz.currentIndex];
    var canvas = document.getElementById('canvas-quiz');
    if (!canvas) return;

    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    var ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    var W = rect.width, H = rect.height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Divider
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 10);
    ctx.lineTo(W / 2, H - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('Shape A', W / 4, 20);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('Shape B', 3 * W / 4, 20);

    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('vs', W / 2, H / 2 + 4);

    drawQuizShape(ctx, q.shapeA, W / 4, H / 2 + 10, Math.min(W / 5, H / 3), '#3b82f6');
    drawQuizShape(ctx, q.shapeB, 3 * W / 4, H / 2 + 10, Math.min(W / 5, H / 3), '#ef4444');

    var questionEl = document.getElementById('quiz-question');
    if (questionEl) {
        var nameA = shapeDisplayName(q.shapeA);
        var nameB = shapeDisplayName(q.shapeB);
        questionEl.innerHTML = 'Is a <b style="color:#3b82f6;">' + nameA + '</b> homeomorphic to a <b style="color:#ef4444;">' + nameB + '</b>?';
    }

    var feedbackEl = document.getElementById('quiz-feedback');
    if (feedbackEl) feedbackEl.innerHTML = '';

    var yesBtn = document.getElementById('quiz-yes-btn');
    var noBtn = document.getElementById('quiz-no-btn');
    var nextBtn = document.getElementById('quiz-next-btn');
    if (yesBtn) yesBtn.disabled = false;
    if (noBtn) noBtn.disabled = false;
    if (nextBtn) nextBtn.style.display = 'none';
    _topoQuiz.answered = false;

    document.getElementById('quiz-score').textContent = _topoQuiz.score;
    document.getElementById('quiz-total').textContent = _topoQuiz.total;
}

function shapeDisplayName(shape) {
    var names = {
        'circle': 'Circle', 'square': 'Square', 'sphere': 'Sphere', 'torus': 'Torus (Donut)',
        'mug': 'Coffee Mug', 'line': 'Line Segment', 'figure8': 'Figure-8',
        'trefoil': 'Trefoil Knot', 'disk': 'Filled Disk', 'square_filled': 'Filled Square',
        'annulus': 'Annulus (Ring)', 'cylinder': 'Cylinder', 'two_circles': 'Two Disjoint Circles',
        'mobius': 'Möbius Strip'
    };
    return names[shape] || shape;
}

function drawQuizShape(ctx, shape, cx, cy, size, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color + '20';
    ctx.lineWidth = 2.5;
    var r = size * 0.4;

    switch (shape) {
        case 'circle':
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
            break;

        case 'square':
            ctx.beginPath();
            ctx.rect(cx - r, cy - r, r * 2, r * 2);
            ctx.stroke();
            break;

        case 'sphere':
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(cx, cy, r, r * 0.3, 0, 0, Math.PI * 2);
            ctx.strokeStyle = color + '60';
            ctx.stroke();
            ctx.strokeStyle = color;
            break;

        case 'torus':
            ctx.beginPath();
            ctx.ellipse(cx, cy, r * 1.1, r * 0.6, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(cx, cy, r * 0.35, r * 0.18, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.stroke();
            ctx.fillStyle = color + '20';
            break;

        case 'mug':
            ctx.beginPath();
            ctx.rect(cx - r * 0.6, cy - r * 0.5, r * 1.0, r * 1.0);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx + r * 0.5, cy, r * 0.35, -Math.PI / 2, Math.PI / 2);
            ctx.stroke();
            break;

        case 'line':
            ctx.beginPath();
            ctx.moveTo(cx - r, cy);
            ctx.lineTo(cx + r, cy);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx - r, cy, 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + r, cy, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = color + '20';
            break;

        case 'figure8':
            ctx.beginPath();
            ctx.arc(cx - r * 0.4, cy, r * 0.4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx + r * 0.4, cy, r * 0.4, 0, Math.PI * 2);
            ctx.stroke();
            break;

        case 'trefoil':
            ctx.beginPath();
            for (var t = 0; t <= Math.PI * 2; t += 0.02) {
                var tx = cx + r * 0.7 * (Math.sin(t) + 2 * Math.sin(2 * t)) * 0.3;
                var ty = cy + r * 0.7 * (Math.cos(t) - 2 * Math.cos(2 * t)) * 0.3;
                if (t === 0) ctx.moveTo(tx, ty);
                else ctx.lineTo(tx, ty);
            }
            ctx.closePath();
            ctx.stroke();
            break;

        case 'disk':
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;

        case 'square_filled':
            ctx.beginPath();
            ctx.rect(cx - r, cy - r, r * 2, r * 2);
            ctx.fill();
            ctx.stroke();
            break;

        case 'annulus':
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2, true);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
            ctx.stroke();
            break;

        case 'cylinder':
            ctx.beginPath();
            ctx.rect(cx - r * 0.5, cy - r * 0.6, r * 1.0, r * 1.2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(cx, cy - r * 0.6, r * 0.5, r * 0.2, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(cx, cy + r * 0.6, r * 0.5, r * 0.2, 0, 0, Math.PI * 2);
            ctx.stroke();
            break;

        case 'two_circles':
            ctx.beginPath();
            ctx.arc(cx - r * 0.5, cy, r * 0.35, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx + r * 0.5, cy, r * 0.35, 0, Math.PI * 2);
            ctx.stroke();
            break;

        case 'mobius':
            ctx.beginPath();
            for (var t = 0; t <= Math.PI * 2; t += 0.03) {
                var w = r * 0.15 * Math.cos(t / 2);
                var mx = cx + (r * 0.7 + w) * Math.cos(t);
                var my = cy + (r * 0.4 + w * 0.5) * Math.sin(t);
                if (t === 0) ctx.moveTo(mx, my);
                else ctx.lineTo(mx, my);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.font = '9px system-ui, sans-serif';
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.fillText('½ twist', cx, cy + r * 0.7);
            ctx.fillStyle = color + '20';
            break;
    }
}

window.answerQuiz = function(userAnswer) {
    if (_topoQuiz.answered) return;
    _topoQuiz.answered = true;

    _topoAudio.init();

    var q = _topoQuiz.questions[_topoQuiz.currentIndex];
    var correct = (userAnswer === q.answer);

    _topoQuiz.total++;
    if (correct) _topoQuiz.score++;

    if (correct) {
        _topoAudio.playCorrect();
        _topoHaptic([50]);
    } else {
        _topoAudio.playWrong();
        _topoHaptic([50, 50, 50]);
    }

    var feedbackEl = document.getElementById('quiz-feedback');
    if (feedbackEl) {
        var bgColor = correct ? '#f0fdf4' : '#fef2f2';
        var borderColor = correct ? '#bbf7d0' : '#fecaca';
        var textColor = correct ? '#16a34a' : '#dc2626';
        var icon = correct ? '✅ Correct!' : '❌ Not quite!';
        feedbackEl.innerHTML = '<div style="padding: 10px; border-radius: 8px; background: ' + bgColor + '; border: 1px solid ' + borderColor + ';">' +
            '<div style="font-weight: bold; color: ' + textColor + '; margin-bottom: 6px;">' + icon + '</div>' +
            '<div style="color: #475569; font-size: 0.9em; line-height: 1.5;">' + q.explanation + '</div>' +
            '</div>';
    }

    var yesBtn = document.getElementById('quiz-yes-btn');
    var noBtn = document.getElementById('quiz-no-btn');
    var nextBtn = document.getElementById('quiz-next-btn');
    if (yesBtn) yesBtn.disabled = true;
    if (noBtn) noBtn.disabled = true;
    if (nextBtn) nextBtn.style.display = 'inline-block';

    document.getElementById('quiz-score').textContent = _topoQuiz.score;
    document.getElementById('quiz-total').textContent = _topoQuiz.total;
};

window.nextQuizQuestion = function() {
    _topoQuiz.currentIndex = (_topoQuiz.currentIndex + 1) % _topoQuiz.questions.length;
    renderQuizQuestion();
};

// ============================================================
// 5. HELIX-TURING MACHINE — Complete self-contained implementation
// ============================================================

var helixTuringState = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    numStates: 3,
    helixRadius: 0.6,
    tape: [0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0],
    tapeSize: 11,
    headPos: 5,
    currentState: 0,
    stepCount: 0,
    halted: false,
    running: false,
    transitions: {},
    rotX: 0.4,
    rotY: 0.0,
    dragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    animFrame: null
};

var _helixAnim = {
    active: false,
    fromState: 0,
    toState: 0,
    fromPos: 0,
    toPos: 0,
    progress: 0,
    duration: 300,
    startTime: 0,
    rafId: null,
    easedProgress: 0
};

var stateColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

function generateTuringTransitions(numStates) {
    var transitions = {};
    var symbols = [0, 1];
    var haltState = numStates - 1;

    for (var q = 0; q < numStates; q++) {
        for (var si = 0; si < symbols.length; si++) {
            var s = symbols[si];
            var key = q + ',' + s;
            if (q === haltState) {
                transitions[key] = { newState: q, write: s, dir: 0, halt: true };
            } else {
                var newState = (q + s + 1) % numStates;
                var writeSymbol = 1 - s;
                var dir = (q % 2 === 0) ? 1 : -1;
                transitions[key] = { newState: newState, write: writeSymbol, dir: dir, halt: false };
            }
        }
    }
    return transitions;
}

function helixProject3D(x, y, z, rotX, rotY, W, H) {
    // Rotate around X axis
    var cosRX = Math.cos(rotX), sinRX = Math.sin(rotX);
    var y1 = y * cosRX - z * sinRX;
    var z1 = y * sinRX + z * cosRX;

    // Rotate around Y axis
    var cosRY = Math.cos(rotY), sinRY = Math.sin(rotY);
    var x2 = x * cosRY + z1 * sinRY;
    var z2 = -x * sinRY + z1 * cosRY;

    // Perspective projection
    var fov = 2.5;
    var dist = fov + z2;
    if (dist < 0.1) dist = 0.1;
    var scale = fov / dist;

    var sx = W / 2 + x2 * scale * W * 0.25;
    var sy = H / 2 - y1 * scale * H * 0.25;

    return { sx: sx, sy: sy, depth: z2, scale: scale };
}

function initHelixTuring() {
    var canvas = document.getElementById('canvas-helix-turing');
    if (!canvas) return;

    var st = helixTuringState;
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    st.canvas = canvas;
    st.ctx = canvas.getContext('2d');
    st.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    st.width = rect.width;
    st.height = rect.height;

    // Generate default transitions
    st.transitions = generateTuringTransitions(st.numStates);

    // Slider: number of states
    var statesSlider = document.getElementById('helix-num-states');
    var statesVal = document.getElementById('helix-num-states-val');
    if (statesSlider) {
        statesSlider.addEventListener('input', function() {
            st.numStates = parseInt(statesSlider.value);
            if (statesVal) statesVal.textContent = st.numStates;
            st.transitions = generateTuringTransitions(st.numStates);
            resetHelixTuringState();
            renderHelixTuring();
        });
    }

    // Slider: helix radius
    var radiusSlider = document.getElementById('helix-tm-radius');
    var radiusVal = document.getElementById('helix-tm-radius-val');
    if (radiusSlider) {
        radiusSlider.addEventListener('input', function() {
            st.helixRadius = parseFloat(radiusSlider.value);
            if (radiusVal) radiusVal.textContent = st.helixRadius.toFixed(2);
            renderHelixTuring();
        });
    }

    // Mouse drag for rotation
    canvas.addEventListener('mousedown', function(e) {
        st.dragging = true;
        st.lastMouseX = e.clientX;
        st.lastMouseY = e.clientY;
        canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', function(e) {
        if (!st.dragging) return;
        var dx = e.clientX - st.lastMouseX;
        var dy = e.clientY - st.lastMouseY;
        st.rotY += dx * 0.008;
        st.rotX += dy * 0.008;
        st.rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, st.rotX));
        st.lastMouseX = e.clientX;
        st.lastMouseY = e.clientY;
        if (!_helixAnim.active) renderHelixTuring();
    });

    window.addEventListener('mouseup', function() {
        st.dragging = false;
        canvas.style.cursor = 'grab';
    });

    // Touch support
    canvas.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
            st.dragging = true;
            st.lastMouseX = e.touches[0].clientX;
            st.lastMouseY = e.touches[0].clientY;
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', function(e) {
        if (!st.dragging || e.touches.length !== 1) return;
        var dx = e.touches[0].clientX - st.lastMouseX;
        var dy = e.touches[0].clientY - st.lastMouseY;
        st.rotY += dx * 0.008;
        st.rotX += dy * 0.008;
        st.rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, st.rotX));
        st.lastMouseX = e.touches[0].clientX;
        st.lastMouseY = e.touches[0].clientY;
        if (!_helixAnim.active) renderHelixTuring();
    }, { passive: true });

    canvas.addEventListener('touchend', function() {
        st.dragging = false;
    });

    renderHelixTuring();
}

function resetHelixTuringState() {
    var st = helixTuringState;
    st.tape = [0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0];
    st.tapeSize = 11;
    st.headPos = 5;
    st.currentState = 0;
    st.stepCount = 0;
    st.halted = false;
    st.running = false;
    if (st.animFrame) {
        cancelAnimationFrame(st.animFrame);
        st.animFrame = null;
    }
}

window.resetHelixTuring = function() {
    var st = helixTuringState;
    st.transitions = generateTuringTransitions(st.numStates);
    resetHelixTuringState();

    var statusEl = document.getElementById('helix-turing-status');
    if (statusEl) {
        statusEl.textContent = 'Ready — click Step or Run.';
        statusEl.style.color = '#64748b';
    }

    var runBtn = document.getElementById('helix-run-btn');
    if (runBtn) { runBtn.textContent = '▶ Run'; runBtn.style.background = '#10b981'; }

    renderHelixTuring();
};

// Core step logic — returns true if step succeeded, false if halted
function stepHelixTuringInternal() {
    var st = helixTuringState;
    if (st.halted) return false;

    var key = st.currentState + ',' + (st.tape[st.headPos] || 0);
    var transition = st.transitions[key];

    if (!transition || transition.halt) {
        st.halted = true;
        return false;
    }

    st.tape[st.headPos] = transition.write;
    st.currentState = transition.newState;
    st.headPos += transition.dir;
    st.stepCount++;

    // Extend tape if needed
    if (st.headPos < 0) {
        st.tape.unshift(0);
        st.headPos = 0;
        st.tapeSize++;
    }
    if (st.headPos >= st.tapeSize) {
        st.tape.push(0);
        st.tapeSize++;
    }

    // Safety: stop after 500 steps
    if (st.stepCount >= 500) {
        st.halted = true;
        return false;
    }

    return true;
}

// Step with smooth animation + sound + haptic
window.stepHelixTuring = function() {
    var st = helixTuringState;
    if (st.running || _helixAnim.active) return;
    if (st.halted) return;

    _topoAudio.init();

    var prevState = st.currentState;
    var prevPos = st.headPos;

    var ok = stepHelixTuringInternal();

    if (!ok) {
        _topoAudio.playHalt();
        _topoHaptic([100, 50, 100]);
        renderHelixTuring();

        var statusEl = document.getElementById('helix-turing-status');
        if (statusEl) {
            statusEl.innerHTML = '⏹ <b>Halted</b> after ' + st.stepCount + ' steps in state q' + st.currentState + '.';
            statusEl.style.color = '#f59e0b';
        }
        return;
    }

    var soundEnabled = document.getElementById('helix-sound-enabled');
    _topoAudio.enabled = soundEnabled ? soundEnabled.checked : true;
    _topoAudio.playTone(st.currentState, 0.18);
    _topoHaptic([30]);

    // Start smooth animation
    _helixAnim.active = true;
    _helixAnim.fromState = prevState;
    _helixAnim.toState = st.currentState;
    _helixAnim.fromPos = prevPos;
    _helixAnim.toPos = st.headPos;
    _helixAnim.progress = 0;
    _helixAnim.duration = parseInt((document.getElementById('helix-anim-speed') || {}).value || '300');
    _helixAnim.startTime = performance.now();

    function animateStep(now) {
        var elapsed = now - _helixAnim.startTime;
        _helixAnim.progress = Math.min(1, elapsed / _helixAnim.duration);

        // Ease out cubic
        var t = 1 - Math.pow(1 - _helixAnim.progress, 3);
        _helixAnim.easedProgress = t;

        renderHelixTuringAnimated(t);

        if (_helixAnim.progress < 1) {
            _helixAnim.rafId = requestAnimationFrame(animateStep);
        } else {
            _helixAnim.active = false;
            renderHelixTuring();

            var statusEl = document.getElementById('helix-turing-status');
            if (statusEl) {
                statusEl.textContent = 'Step ' + st.stepCount + ': state q' + st.currentState + ', head at position ' + st.headPos + '.';
                statusEl.style.color = '#3b82f6';
            }
        }
    }

    _helixAnim.rafId = requestAnimationFrame(animateStep);
};

// Run with sound + haptic + speed slider
window.runHelixTuring = function() {
    var st = helixTuringState;
    var runBtn = document.getElementById('helix-run-btn');

    if (st.running) {
        st.running = false;
        if (st.animFrame) cancelAnimationFrame(st.animFrame);
        if (runBtn) { runBtn.textContent = '▶ Run'; runBtn.style.background = '#10b981'; }
        return;
    }

    if (st.halted) return;

    _topoAudio.init();
    st.running = true;
    if (runBtn) { runBtn.textContent = '⏸ Pause'; runBtn.style.background = '#f59e0b'; }

    var lastTime = 0;

    function animate(now) {
        if (!st.running) return;

        var stepInterval = parseInt((document.getElementById('helix-anim-speed') || {}).value || '300');
        var soundEnabled = document.getElementById('helix-sound-enabled');
        _topoAudio.enabled = soundEnabled ? soundEnabled.checked : true;

        if (now - lastTime >= stepInterval) {
            lastTime = now;
            var ok = stepHelixTuringInternal();

            if (ok) {
                _topoAudio.playTone(st.currentState, 0.12);
                _topoHaptic([20]);
            }

            renderHelixTuring();

            var statusEl = document.getElementById('helix-turing-status');
            if (st.halted) {
                st.running = false;
                _topoAudio.playHalt();
                _topoHaptic([100, 50, 100]);
                if (runBtn) { runBtn.textContent = '▶ Run'; runBtn.style.background = '#10b981'; }
                if (statusEl) {
                    statusEl.innerHTML = '⏹ <b>Halted</b> after ' + st.stepCount + ' steps in state q' + st.currentState + '.';
                    statusEl.style.color = '#f59e0b';
                }
                return;
            } else if (statusEl) {
                statusEl.textContent = 'Running… Step ' + st.stepCount + ': state q' + st.currentState + ', head at ' + st.headPos + '.';
                statusEl.style.color = '#10b981';
            }
        }

        st.animFrame = requestAnimationFrame(animate);
    }

    st.animFrame = requestAnimationFrame(animate);
};

// ============================================================
// HELIX RENDERING — Static (non-animated) frame
// ============================================================

function renderHelixTuring() {
    var st = helixTuringState;
    if (!st.ctx) return;

    var ctx = st.ctx;
    var W = st.width;
    var H = st.height;
    var numStates = st.numStates;
    var radius = st.helixRadius;

    var showTransitions = document.getElementById('helix-show-transitions');
    showTransitions = showTransitions ? showTransitions.checked : true;
    var showHelixThread = document.getElementById('helix-show-helix-thread');
    showHelixThread = showHelixThread ? showHelixThread.checked : true;
    var showShadow = document.getElementById('helix-show-shadow');
    showShadow = showShadow ? showShadow.checked : true;

    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.12)';
    ctx.lineWidth = 0.5;
    for (var gx = 0; gx < W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (var gy = 0; gy < H; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    var tapeLen = st.tapeSize;

    // Generate helix points for each tape position
    var helixPoints = [];
    for (var i = 0; i < tapeLen; i++) {
        var tNorm = (i - tapeLen / 2) / (tapeLen / 2);
        var z = tNorm;
        var angularOffset = (0 / numStates) * 2 * Math.PI;
        var x = radius * Math.cos(angularOffset + tNorm * Math.PI * 2);
        var y = radius * Math.sin(angularOffset + tNorm * Math.PI * 2);

        var isCurrent = (i === st.headPos);

        helixPoints.push({
            tapePos: i, symbol: st.tape[i] || 0,
            x: x, y: y, z: z, isCurrent: isCurrent
        });
    }

    // Current state point (on the helix at the head position, rotated to current state angle)
    var currentTNorm = (st.headPos - tapeLen / 2) / (tapeLen / 2);
    var currentAngular = (st.currentState / numStates) * 2 * Math.PI + currentTNorm * Math.PI * 2;
    var currentX = radius * Math.cos(currentAngular);
    var currentY = radius * Math.sin(currentAngular);
    var currentZ = currentTNorm;

    // Project all points
    var projected = [];
    for (var i = 0; i < helixPoints.length; i++) {
        var p = helixPoints[i];
        var proj = helixProject3D(p.x, p.y, p.z, st.rotX, st.rotY, W, H);
        projected.push({
            tapePos: p.tapePos, symbol: p.symbol, isCurrent: p.isCurrent,
            x: p.x, y: p.y, z: p.z,
            sx: proj.sx, sy: proj.sy, depth: proj.depth, scale: proj.scale
        });
    }

    // Project current state dot
    var currentProj = helixProject3D(currentX, currentY, currentZ, st.rotX, st.rotY, W, H);

    // Shadow projection
    if (showShadow) {
        ctx.beginPath();
        for (var i = 0; i < helixPoints.length; i++) {
            var p = helixPoints[i];
            var sp = helixProject3D(p.x * 0.3, -0.9, p.z, st.rotX, st.rotY, W, H);
            if (i === 0) ctx.moveTo(sp.sx, sp.sy);
            else ctx.lineTo(sp.sx, sp.sy);
        }
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // Helix thread
    if (showHelixThread && projected.length > 1) {
        for (var i = 0; i < projected.length - 1; i++) {
            var p1 = projected[i];
            var p2 = projected[i + 1];
            var alpha = 0.2 + p1.scale * 0.3;
            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.strokeStyle = 'rgba(96, 165, 250, ' + alpha + ')';
            ctx.lineWidth = 1.5 * p1.scale * 2;
            ctx.stroke();
        }
    }

    // Transition arrows
    if (showTransitions) {
        var transKeys = Object.keys(st.transitions);
        for (var ti = 0; ti < transKeys.length; ti++) {
            var key = transKeys[ti];
            var parts = key.split(',');
            var fromQ = parseInt(parts[0]);
            var fromS = parseInt(parts[1]);
            var trans = st.transitions[key];
            if (trans.halt) continue;

            // Find a representative tape position for this transition
            for (var tp = 0; tp < tapeLen; tp++) {
                if (st.tape[tp] === fromS && tp < tapeLen - 1 && tp > 0) {
                    var fromTNorm = (tp - tapeLen / 2) / (tapeLen / 2);
                    var toTNorm = ((tp + trans.dir) - tapeLen / 2) / (tapeLen / 2);

                    var fromAng = (fromQ / numStates) * 2 * Math.PI + fromTNorm * Math.PI * 2;
                    var toAng = (trans.newState / numStates) * 2 * Math.PI + toTNorm * Math.PI * 2;

                    var fx = radius * Math.cos(fromAng);
                    var fy = radius * Math.sin(fromAng);
                    var fz = fromTNorm;

                    var tx = radius * Math.cos(toAng);
                    var ty = radius * Math.sin(toAng);
                    var tz = toTNorm;

                    var fp = helixProject3D(fx, fy, fz, st.rotX, st.rotY, W, H);
                    var tpProj = helixProject3D(tx, ty, tz, st.rotX, st.rotY, W, H);

                    var arrowAlpha = 0.15 + fp.scale * 0.15;
                    ctx.beginPath();
                    ctx.moveTo(fp.sx, fp.sy);
                    ctx.lineTo(tpProj.sx, tpProj.sy);
                    ctx.strokeStyle = 'rgba(239, 68, 68, ' + arrowAlpha + ')';
                    ctx.lineWidth = 1.2;
                    ctx.stroke();

                    // Arrowhead
                    var angle = Math.atan2(tpProj.sy - fp.sy, tpProj.sx - fp.sx);
                    var headLen = 6 * fp.scale;
                    ctx.beginPath();
                    ctx.moveTo(tpProj.sx, tpProj.sy);
                    ctx.lineTo(tpProj.sx - headLen * Math.cos(angle - 0.4), tpProj.sy - headLen * Math.sin(angle - 0.4));
                    ctx.lineTo(tpProj.sx - headLen * Math.cos(angle + 0.4), tpProj.sy - headLen * Math.sin(angle + 0.4));
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(239, 68, 68, ' + arrowAlpha + ')';
                    ctx.fill();

                    // Transition label
                    var midX = (fp.sx + tpProj.sx) / 2;
                    var midY = (fp.sy + tpProj.sy) / 2;
                    ctx.font = (8 * fp.scale * 1.5) + 'px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = 'rgba(239, 68, 68, ' + (arrowAlpha + 0.2) + ')';
                    var dirLabel = trans.dir > 0 ? 'R' : 'L';
                    ctx.fillText('q' + fromQ + ',' + fromS + '→q' + trans.newState + ',' + trans.write + ',' + dirLabel, midX, midY - 5);

                    break; // Only draw one arrow per transition
                }
            }
        }
    }

    // Sort by depth for painter's algorithm
    var sorted = projected.slice().sort(function(a, b) { return a.depth - b.depth; });

    // Draw tape position dots
    for (var i = 0; i < sorted.length; i++) {
        var p = sorted[i];
        var dotR = 4 * p.scale * 2;

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = p.symbol === 1 ? '#f59e0b' : 'rgba(148, 163, 184, 0.4)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Symbol label
        if (p.scale > 0.4) {
            ctx.font = Math.round(9 * p.scale * 1.5) + 'px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = p.symbol === 1 ? 'rgba(245, 158, 11, 0.8)' : 'rgba(148, 163, 184, 0.5)';
            ctx.fillText(p.symbol.toString(), p.sx, p.sy + 3);
        }
    }

    // Draw current state dot (green, on top)
    var dotR = 8 * currentProj.scale * 2;

    // Glow
    ctx.beginPath();
    ctx.arc(currentProj.sx, currentProj.sy, dotR + 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(currentProj.sx, currentProj.sy, dotR + 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Main dot
    ctx.beginPath();
    ctx.arc(currentProj.sx, currentProj.sy, dotR, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // State label
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#10b981';
    ctx.fillText('q' + st.currentState, currentProj.sx, currentProj.sy - dotR - 10);

    // Axis labels
    var leftProj = helixProject3D(0, 0, -1, st.rotX, st.rotY, W, H);
    var rightProj = helixProject3D(0, 0, 1, st.rotX, st.rotY, W, H);
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.fillText('← Tape', leftProj.sx, leftProj.sy + 20);
    ctx.fillText('Tape →', rightProj.sx, rightProj.sy + 20);

    // Update side panels
    updateHelixTapeDisplay();
    updateHelixStateInfo();
    updateHelixTuringStats();
}

// ============================================================
// HELIX RENDERING — Animated frame (smooth transition)
// ============================================================

function renderHelixTuringAnimated(t) {
    var st = helixTuringState;
    if (!st.ctx) return;

    var ctx = st.ctx;
    var W = st.width;
    var H = st.height;
    var numStates = st.numStates;
    var radius = st.helixRadius;
    var anim = _helixAnim;

    var showHelixThread = document.getElementById('helix-show-helix-thread');
    showHelixThread = showHelixThread ? showHelixThread.checked : true;
    var showShadow = document.getElementById('helix-show-shadow');
    showShadow = showShadow ? showShadow.checked : true;

    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.12)';
    ctx.lineWidth = 0.5;
    for (var gx = 0; gx < W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (var gy = 0; gy < H; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    var tapeLen = st.tapeSize;

    // Generate helix points
    var helixPoints = [];
    for (var i = 0; i < tapeLen; i++) {
        var tNorm = (i - tapeLen / 2) / (tapeLen / 2);
        var z = tNorm;
        var angularOffset = (0 / numStates) * 2 * Math.PI;
        var x = radius * Math.cos(angularOffset + tNorm * Math.PI * 2);
        var y = radius * Math.sin(angularOffset + tNorm * Math.PI * 2);
        helixPoints.push({ tapePos: i, symbol: st.tape[i] || 0, x: x, y: y, z: z });
    }

    // Compute interpolated current position
    var fromTNorm = (anim.fromPos - tapeLen / 2) / (tapeLen / 2);
    var toTNorm = (anim.toPos - tapeLen / 2) / (tapeLen / 2);
    var interpTNorm = fromTNorm + (toTNorm - fromTNorm) * t;

    var fromAngular = (anim.fromState / numStates) * 2 * Math.PI + fromTNorm * Math.PI * 2;
    var toAngular = (anim.toState / numStates) * 2 * Math.PI + toTNorm * Math.PI * 2;

    // Shortest angular path
    var angleDiff = toAngular - fromAngular;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    var interpAngular = fromAngular + angleDiff * t;

    var interpX = radius * Math.cos(interpAngular);
    var interpY = radius * Math.sin(interpAngular);
    var interpZ = interpTNorm;

    // Project all points
    var projected = [];
    for (var i = 0; i < helixPoints.length; i++) {
        var p = helixPoints[i];
        var proj = helixProject3D(p.x, p.y, p.z, st.rotX, st.rotY, W, H);
        projected.push({
            tapePos: p.tapePos, symbol: p.symbol,
            sx: proj.sx, sy: proj.sy, depth: proj.depth, scale: proj.scale
        });
    }

    var animProj = helixProject3D(interpX, interpY, interpZ, st.rotX, st.rotY, W, H);

    // Shadow
    if (showShadow) {
        ctx.beginPath();
        for (var i = 0; i < helixPoints.length; i++) {
            var sp = helixProject3D(helixPoints[i].x * 0.3, -0.9, helixPoints[i].z, st.rotX, st.rotY, W, H);
            if (i === 0) ctx.moveTo(sp.sx, sp.sy);
            else ctx.lineTo(sp.sx, sp.sy);
        }
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // Helix thread
    if (showHelixThread && projected.length > 1) {
        for (var i = 0; i < projected.length - 1; i++) {
            var p1 = projected[i];
            var p2 = projected[i + 1];
            var alpha = 0.2 + p1.scale * 0.3;
            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.strokeStyle = 'rgba(96, 165, 250, ' + alpha + ')';
            ctx.lineWidth = 1.5 * p1.scale * 2;
            ctx.stroke();
        }
    }

    // Sort by depth
    var sorted = projected.slice().sort(function(a, b) { return a.depth - b.depth; });

    // Draw static dots
    for (var i = 0; i < sorted.length; i++) {
        var p = sorted[i];
        var dotR = 4 * p.scale * 2;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = p.symbol === 1 ? '#f59e0b' : 'rgba(148, 163, 184, 0.4)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Trail effect
    var dotR = 8 * animProj.scale * 2;
    var trailSteps = 8;
    for (var s = 0; s < trailSteps; s++) {
        var trailT = Math.max(0, t - (s * 0.08));
        var trailTNorm = fromTNorm + (toTNorm - fromTNorm) * trailT;
        var trailAngular = fromAngular + angleDiff * trailT;
        var trailX = radius * Math.cos(trailAngular);
        var trailY = radius * Math.sin(trailAngular);
        var trailZ = trailTNorm;
        var trailProj = helixProject3D(trailX, trailY, trailZ, st.rotX, st.rotY, W, H);

        var trailAlpha = 0.15 * (1 - s / trailSteps);
        var trailR = dotR * (0.5 + 0.5 * (1 - s / trailSteps));

        ctx.beginPath();
        ctx.arc(trailProj.sx, trailProj.sy, trailR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, ' + trailAlpha + ')';
        ctx.fill();
    }

    // Glow
    ctx.beginPath();
    ctx.arc(animProj.sx, animProj.sy, dotR + 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16, 185, 129, ' + (0.1 + 0.1 * Math.sin(t * Math.PI)) + ')';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(animProj.sx, animProj.sy, dotR + 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(16, 185, 129, ' + (0.4 + 0.2 * Math.sin(t * Math.PI)) + ')';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Main animated dot
    ctx.beginPath();
    ctx.arc(animProj.sx, animProj.sy, dotR, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // State label
    var interpState = t < 0.5 ? anim.fromState : anim.toState;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#10b981';
    ctx.fillText('q' + interpState, animProj.sx, animProj.sy - dotR - 10);

    // Axis labels
    var leftProj = helixProject3D(0, 0, -1, st.rotX, st.rotY, W, H);
    var rightProj = helixProject3D(0, 0, 1, st.rotX, st.rotY, W, H);
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.fillText('← Tape', leftProj.sx, leftProj.sy + 20);
    ctx.fillText('Tape →', rightProj.sx, rightProj.sy + 20);

    updateHelixTapeDisplay();
    updateHelixStateInfo();
    updateHelixTuringStats();
}

// ============================================================
// SIDE PANEL UPDATES
// ============================================================

function updateHelixTapeDisplay() {
    var st = helixTuringState;
    var el = document.getElementById('helix-tape-display');
    if (!el) return;

    var html = '';
    var viewStart = Math.max(0, st.headPos - 6);
    var viewEnd = Math.min(st.tapeSize, st.headPos + 7);

    if (viewStart > 0) html += '<span style="color:#94a3b8;">…</span> ';

    for (var i = viewStart; i < viewEnd; i++) {
        var sym = st.tape[i] || 0;
        if (i === st.headPos) {
            html += '<span style="background: #10b981; color: white; padding: 2px 5px; border-radius: 4px; font-weight: bold;">' + sym + '</span> ';
        } else {
            var symColor = sym === 1 ? '#f59e0b' : '#94a3b8';
            html += '<span style="color:' + symColor + ';">' + sym + '</span> ';
        }
    }

    if (viewEnd < st.tapeSize) html += '<span style="color:#94a3b8;">…</span>';

    el.innerHTML = html;
}

function updateHelixStateInfo() {
    var st = helixTuringState;
    var el = document.getElementById('helix-state-info');
    if (!el) return;

    var currentSymbol = st.tape[st.headPos] || 0;
    var key = st.currentState + ',' + currentSymbol;
    var trans = st.transitions[key];

    var html = '<div style="margin-bottom: 6px;">';
    html += '<span style="font-size: 0.8em; color: #94a3b8;">Current State:</span><br>';
    html += '<span style="font-size: 1.4em; font-weight: bold; color: ' + stateColors[st.currentState % stateColors.length] + ';">q' + st.currentState + '</span>';
    html += '</div>';

    html += '<div style="margin-bottom: 6px;">';
    html += '<span style="font-size: 0.8em; color: #94a3b8;">Reading Symbol:</span><br>';
    html += '<span style="font-size: 1.2em; font-weight: bold; color: ' + (currentSymbol === 1 ? '#f59e0b' : '#94a3b8') + ';">' + currentSymbol + '</span>';
    html += '</div>';

    html += '<div style="margin-bottom: 6px;">';
    html += '<span style="font-size: 0.8em; color: #94a3b8;">Head Position:</span><br>';
    html += '<span style="font-size: 1.2em; font-weight: bold; color: #3b82f6;">' + st.headPos + '</span>';
    html += '</div>';

    if (trans && !st.halted) {
        var dirLabel = trans.dir > 0 ? 'Right →' : '← Left';
        html += '<div style="margin-top: 8px; padding: 8px; background: #f1f5f9; border-radius: 6px;">';
        html += '<span style="font-size: 0.75em; color: #64748b;">Next Transition:</span><br>';
        html += '<span style="font-size: 0.85em; font-family: monospace; color: #334155;">';
        html += 'δ(q' + st.currentState + ', ' + currentSymbol + ') = (q' + trans.newState + ', ' + trans.write + ', ' + dirLabel + ')';
        html += '</span></div>';
    } else if (st.halted) {
        html += '<div style="margin-top: 8px; padding: 8px; background: #fef3c7; border-radius: 6px; text-align: center;">';
        html += '<span style="font-weight: bold; color: #f59e0b;">⏹ HALTED</span>';
        html += '</div>';
    }

    el.innerHTML = html;
}

function updateHelixTuringStats() {
    var st = helixTuringState;
    var el = document.getElementById('helix-turing-stats');
    if (!el) return;

    var onesCount = 0;
    for (var i = 0; i < st.tape.length; i++) {
        if (st.tape[i] === 1) onesCount++;
    }

    var stats = [
        { label: 'Steps', value: st.stepCount, color: '#3b82f6', icon: '🔢' },
        { label: 'State', value: 'q' + st.currentState, color: stateColors[st.currentState % stateColors.length], icon: '🔵' },
        { label: 'Head Pos', value: st.headPos, color: '#10b981', icon: '📍' },
        { label: '1s on Tape', value: onesCount, color: '#f59e0b', icon: '✏️' }
    ];

    var html = '';
    for (var i = 0; i < stats.length; i++) {
        var s = stats[i];
        html += '<div style="background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 10px; text-align: center;">';
        html += '<div style="font-size: 0.7em; color: #94a3b8;">' + s.icon + ' ' + s.label + '</div>';
        html += '<div style="font-size: 1.3em; font-weight: bold; color: ' + s.color + ';">' + s.value + '</div>';
        html += '</div>';
    }

    el.innerHTML = html;
}

// ============================================================
// 6. CUSTOM TURING MACHINE DESIGNER
// ============================================================

var _customTMPresets = {
    'binary-increment': {
        numStates: 3,
        tape: [0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0],
        transitions: {
            '0,0': { newState: 0, write: 0, dir: 1, halt: false },
            '0,1': { newState: 0, write: 1, dir: 1, halt: false },
            '1,0': { newState: 2, write: 1, dir: -1, halt: false },
            '1,1': { newState: 1, write: 0, dir: 1, halt: false },
            '2,0': { newState: 2, write: 0, dir: 0, halt: true },
            '2,1': { newState: 2, write: 1, dir: 0, halt: true }
        },
        description: 'Scans right to find the end, then increments the binary number by 1.'
    },
    'busy-beaver-3': {
        numStates: 4,
        tape: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        transitions: {
            '0,0': { newState: 1, write: 1, dir: 1, halt: false },
            '0,1': { newState: 2, write: 1, dir: -1, halt: false },
            '1,0': { newState: 0, write: 1, dir: -1, halt: false },
            '1,1': { newState: 1, write: 1, dir: 1, halt: false },
            '2,0': { newState: 1, write: 1, dir: -1, halt: false },
            '2,1': { newState: 3, write: 1, dir: 1, halt: false },
            '3,0': { newState: 3, write: 0, dir: 0, halt: true },
            '3,1': { newState: 3, write: 1, dir: 0, halt: true }
        },
        description: '3-state Busy Beaver — writes the maximum number of 1s before halting (6 ones in 14 steps).'
    },
    'oscillator': {
        numStates: 3,
        tape: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        transitions: {
            '0,0': { newState: 1, write: 1, dir: 1, halt: false },
            '0,1': { newState: 1, write: 0, dir: -1, halt: false },
            '1,0': { newState: 0, write: 1, dir: -1, halt: false },
            '1,1': { newState: 0, write: 0, dir: 1, halt: false },
            '2,0': { newState: 2, write: 0, dir: 0, halt: true },
            '2,1': { newState: 2, write: 1, dir: 0, halt: true }
        },
        description: 'Oscillates back and forth, flipping bits — never halts! (Uses only states 0 and 1.)'
    }
};

function buildCustomTMTable() {
    var container = document.getElementById('custom-tm-table');
    if (!container) return;

    var numStates = parseInt((document.getElementById('custom-tm-num-states') || {}).value || '3');
    var symbols = [0, 1];
    var st = helixTuringState;

    var html = '<table style="width:100%; border-collapse: collapse; font-size: 0.85em;">';
    html += '<tr style="background: #f1f5f9;">';
    html += '<th style="padding: 6px; border: 1px solid #e2e8f0;">δ(q, s)</th>';
    html += '<th style="padding: 6px; border: 1px solid #e2e8f0;">New State</th>';
    html += '<th style="padding: 6px; border: 1px solid #e2e8f0;">Write</th>';
    html += '<th style="padding: 6px; border: 1px solid #e2e8f0;">Dir</th>';
    html += '</tr>';

    for (var q = 0; q < numStates; q++) {
        for (var si = 0; si < symbols.length; si++) {
            var s = symbols[si];
            var key = q + ',' + s;
            var existing = st.transitions[key];
            var isHaltState = (q === numStates - 1);

            html += '<tr style="' + (isHaltState ? 'background: #fef3c7;' : '') + '">';
            html += '<td style="padding: 4px 6px; border: 1px solid #e2e8f0; font-weight: bold;">δ(q' + q + ', ' + s + ')</td>';

            if (isHaltState) {
                html += '<td colspan="3" style="padding: 4px 6px; border: 1px solid #e2e8f0; text-align: center; color: #f59e0b; font-weight: bold;">HALT</td>';
            } else {
                var ns = existing ? existing.newState : ((q + s + 1) % numStates);
                var ws = existing ? existing.write : (1 - s);
                var dr = existing ? (existing.dir > 0 ? 'R' : 'L') : (q % 2 === 0 ? 'R' : 'L');

                html += '<td style="padding: 4px; border: 1px solid #e2e8f0;">';
                html += '<select id="ctm-ns-' + q + '-' + s + '" style="width: 100%; padding: 2px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.9em;">';
                for (var i = 0; i < numStates; i++) {
                    html += '<option value="' + i + '"' + (i === ns ? ' selected' : '') + '>q' + i + (i === numStates - 1 ? ' (halt)' : '') + '</option>';
                }
                html += '</select></td>';

                html += '<td style="padding: 4px; border: 1px solid #e2e8f0;">';
                html += '<select id="ctm-ws-' + q + '-' + s + '" style="width: 100%; padding: 2px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.9em;">';
                html += '<option value="0"' + (ws === 0 ? ' selected' : '') + '>0</option>';
                html += '<option value="1"' + (ws === 1 ? ' selected' : '') + '>1</option>';
                html += '</select></td>';

                html += '<td style="padding: 4px; border: 1px solid #e2e8f0;">';
                html += '<select id="ctm-dr-' + q + '-' + s + '" style="width: 100%; padding: 2px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.9em;">';
                html += '<option value="R"' + (dr === 'R' ? ' selected' : '') + '>R →</option>';
                html += '<option value="L"' + (dr === 'L' ? ' selected' : '') + '>← L</option>';
                html += '</select></td>';
            }
            html += '</tr>';
        }
    }
    html += '</table>';
    container.innerHTML = html;
}

window.applyCustomTM = function() {
    var st = helixTuringState;
    var numStates = parseInt((document.getElementById('custom-tm-num-states') || {}).value || '3');
    var tapeInput = (document.getElementById('custom-tm-tape') || {}).value || '0,0,1,1,0,1,0,0,0,0,0';

    var tape = tapeInput.split(',').map(function(s) { return parseInt(s.trim()) || 0; });

    var transitions = {};
    var symbols = [0, 1];

    for (var q = 0; q < numStates; q++) {
        for (var si = 0; si < symbols.length; si++) {
            var s = symbols[si];
            var key = q + ',' + s;

            if (q === numStates - 1) {
                transitions[key] = { newState: q, write: s, dir: 0, halt: true };
                continue;
            }

            var nsEl = document.getElementById('ctm-ns-' + q + '-' + s);
            var wsEl = document.getElementById('ctm-ws-' + q + '-' + s);
            var drEl = document.getElementById('ctm-dr-' + q + '-' + s);

            if (nsEl && wsEl && drEl) {
                transitions[key] = {
                    newState: parseInt(nsEl.value),
                    write: parseInt(wsEl.value),
                    dir: drEl.value === 'R' ? 1 : -1,
                    halt: false
                };
            } else {
                transitions[key] = generateTuringTransitions(numStates)[key];
            }
        }
    }

    st.numStates = numStates;
    st.transitions = transitions;
    st.tape = tape.slice();
    st.tapeSize = tape.length;
    st.headPos = Math.floor(tape.length / 2);
    st.currentState = 0;
    st.stepCount = 0;
    st.halted = false;
    st.running = false;

    if (st.animFrame) {
        cancelAnimationFrame(st.animFrame);
        st.animFrame = null;
    }

    var statesSlider = document.getElementById('helix-num-states');
    if (statesSlider) {
        statesSlider.value = numStates;
        var statesVal = document.getElementById('helix-num-states-val');
        if (statesVal) statesVal.textContent = numStates;
    }

    var statusEl = document.getElementById('helix-turing-status');
    if (statusEl) {
        statusEl.textContent = 'Custom machine loaded — click Step or Run.';
        statusEl.style.color = '#8b5cf6';
    }

    var runBtn = document.getElementById('helix-run-btn');
    if (runBtn) { runBtn.textContent = '▶ Run'; runBtn.style.background = '#10b981'; }

    var feedbackEl = document.getElementById('custom-tm-feedback');
    if (feedbackEl) {
        feedbackEl.innerHTML = '<span style="color: #10b981; font-weight: bold;">✅ Custom machine loaded!</span> ' + numStates + ' states, tape length ' + tape.length + '.';
    }

    renderHelixTuring();
};

window.loadPresetTM = function(presetName) {
    var preset = _customTMPresets[presetName];
    if (!preset) return;

    _topoAudio.init();

    var st = helixTuringState;
    st.numStates = preset.numStates;

    // Deep copy transitions
    st.transitions = {};
    var keys = Object.keys(preset.transitions);
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var t = preset.transitions[k];
        st.transitions[k] = { newState: t.newState, write: t.write, dir: t.dir, halt: t.halt };
    }

    st.tape = preset.tape.slice();
    st.tapeSize = preset.tape.length;
    st.headPos = Math.floor(preset.tape.length / 2);
    st.currentState = 0;
    st.stepCount = 0;
    st.halted = false;
    st.running = false;

    if (st.animFrame) {
        cancelAnimationFrame(st.animFrame);
        st.animFrame = null;
    }

    var numStatesSelect = document.getElementById('custom-tm-num-states');
    if (numStatesSelect) numStatesSelect.value = preset.numStates;

    var tapeInput = document.getElementById('custom-tm-tape');
    if (tapeInput) tapeInput.value = preset.tape.join(',');

    var statesSlider = document.getElementById('helix-num-states');
    if (statesSlider) {
        statesSlider.value = preset.numStates;
        var statesVal = document.getElementById('helix-num-states-val');
        if (statesVal) statesVal.textContent = preset.numStates;
    }

    buildCustomTMTable();

    var statusEl = document.getElementById('helix-turing-status');
    if (statusEl) {
        statusEl.textContent = 'Preset "' + presetName + '" loaded — click Step or Run.';
        statusEl.style.color = '#8b5cf6';
    }

    var runBtn = document.getElementById('helix-run-btn');
    if (runBtn) { runBtn.textContent = '▶ Run'; runBtn.style.background = '#10b981'; }

    var feedbackEl = document.getElementById('custom-tm-feedback');
    if (feedbackEl) {
        feedbackEl.innerHTML = '<span style="color: #8b5cf6; font-weight: bold;">📦 Preset "' + presetName + '" loaded!</span> ' + preset.description;
    }

    renderHelixTuring();
};

// ============================================================
// 7. SPEED SLIDER + CUSTOM TM CONTROLS INIT
// ============================================================

function initSpeedSlider() {
    var speedSlider = document.getElementById('helix-anim-speed');
    var speedVal = document.getElementById('helix-anim-speed-val');
    if (speedSlider && speedVal) {
        speedSlider.addEventListener('input', function() {
            speedVal.textContent = speedSlider.value;
        });
    }
}

function initCustomTMControls() {
    var numStatesSelect = document.getElementById('custom-tm-num-states');
    if (numStatesSelect) {
        numStatesSelect.addEventListener('change', function() {
            buildCustomTMTable();
        });
    }

    var statesSlider = document.getElementById('helix-num-states');
    if (statesSlider) {
        statesSlider.addEventListener('input', function() {
            var val = parseInt(statesSlider.value);
            var select = document.getElementById('custom-tm-num-states');
            if (select && val >= 2 && val <= 5) {
                select.value = val;
            }
            buildCustomTMTable();
        });
    }

    buildCustomTMTable();
}

// ============================================================
// 8. SOUND CHECKBOX BINDING
// ============================================================

function initSoundCheckbox() {
    var checkbox = document.getElementById('helix-sound-enabled');
    if (checkbox) {
        checkbox.addEventListener('change', function() {
            _topoAudio.enabled = checkbox.checked;
        });
    }
}

// ============================================================
// MODULE LOADER
// ============================================================

async function loadTopologyModule() {
    // 1. Latent space manifold (Plotly surface + persistence barcode)
    initTopologyVisualization();

    // 2. Draw Your Own Manifold
    _topologyLazyRegister('canvas-draw-manifold', function() {
        initDrawManifold();
    });

    // 3. Topology Quiz
    _topologyLazyRegister('canvas-quiz', function() {
        initTopologyQuiz();
    });

    // 4. Helix–Turing Machine (Canvas)
    _topologyLazyRegister('canvas-helix-turing', function() {
        initHelixTuring();
        initSpeedSlider();
        initCustomTMControls();
        initSoundCheckbox();
    });

    // Start observing
    _topologyLazyCreateObserver();
}
