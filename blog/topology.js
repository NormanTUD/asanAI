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
// TORUS VISUALIZATION — Two independent cycles on a donut
// ============================================================
function visualize_torus() {
    const container = document.getElementById('torus-viz');
    if (!container) return;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 500;
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.borderRadius = '12px';
    canvas.style.background = '#0a0a2e';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // Controls
    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = 'text-align:center; margin:15px 0; font-family: "Inter", sans-serif;';
    controlsDiv.innerHTML = `
        <div style="margin-bottom:10px;">
            <label style="color:#ccc; margin-right:10px;">Cycle A (Day of Week): </label>
            <input type="range" id="torus-theta" min="0" max="628" value="0" style="width:200px; vertical-align:middle;">
            <span id="torus-theta-val" style="color:#4fc3f7; margin-left:8px;">Sunday</span>
        </div>
        <div style="margin-bottom:10px;">
            <label style="color:#ccc; margin-right:10px;">Cycle B (Time of Day): </label>
            <input type="range" id="torus-phi" min="0" max="628" value="0" style="width:200px; vertical-align:middle;">
            <span id="torus-phi-val" style="color:#ff8a65; margin-left:8px;">00:00</span>
        </div>
        <div style="margin-bottom:10px;">
            <label style="color:#ccc; margin-right:10px;">View Angle: </label>
            <input type="range" id="torus-view" min="0" max="628" value="80" style="width:150px; vertical-align:middle;">
            <button id="torus-trace-btn" style="margin-left:20px; padding:6px 16px; background:#4fc3f7; border:none; border-radius:6px; cursor:pointer; font-weight:600;">Trace Diagonal Path</button>
            <button id="torus-clear-btn" style="margin-left:8px; padding:6px 16px; background:#ff5252; border:none; border-radius:6px; cursor:pointer; font-weight:600; color:#fff;">Clear</button>
        </div>
        <div style="color:#888; font-size:13px;">The <span style="color:#4fc3f7;">blue loop</span> and <span style="color:#ff8a65;">orange loop</span> are the two generators of $\\pi_1(T^2) = \\mathbb{Z} \\times \\mathbb{Z}$</div>
    `;
    container.appendChild(controlsDiv);

    // Flat torus canvas
    const flatCanvas = document.createElement('canvas');
    flatCanvas.width = 300;
    flatCanvas.height = 300;
    flatCanvas.style.display = 'inline-block';
    flatCanvas.style.borderRadius = '8px';
    flatCanvas.style.background = '#111133';
    flatCanvas.style.border = '1px solid #333';
    flatCanvas.style.margin = '0 10px';

    const flatLabel = document.createElement('div');
    flatLabel.style.cssText = 'text-align:center; margin:10px 0; font-family:"Inter",sans-serif;';
    flatLabel.innerHTML = `
        <div style="display:inline-flex; align-items:flex-start; gap:30px;">
            <div>
                <div style="color:#aaa; font-size:13px; margin-bottom:5px;">3D Torus (above) ↔ Flat Torus (below)</div>
            </div>
        </div>
    `;
    container.appendChild(flatLabel);

    const flatWrap = document.createElement('div');
    flatWrap.style.textAlign = 'center';
    flatWrap.appendChild(flatCanvas);
    container.appendChild(flatWrap);

    const flatCtx = flatCanvas.getContext('2d');

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Torus parameters
    const R = 130; // major radius
    const r = 55;  // minor radius
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 - 10;

    let tracePoints = [];
    let isTracing = false;
    let traceT = 0;

    function torusPoint(theta, phi, viewAngle) {
        const x3 = (R + r * Math.cos(phi)) * Math.cos(theta);
        const y3 = (R + r * Math.cos(phi)) * Math.sin(theta);
        const z3 = r * Math.sin(phi);

        // Rotate around X axis for view
        const cosV = Math.cos(viewAngle);
        const sinV = Math.sin(viewAngle);
        const y3r = y3 * cosV - z3 * sinV;
        const z3r = y3 * sinV + z3 * cosV;

        return { x: x3 + cx, y: y3r + cy, z: z3r };
    }

    function drawTorus(theta, phi, viewAngle) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background grid on torus
        const steps = 40;
        const lineSteps = 80;

        // Collect all line segments with depth for sorting
        let segments = [];

        // Draw theta lines (around the donut)
        for (let i = 0; i <= 16; i++) {
            const th = (i / 16) * Math.PI * 2;
            for (let j = 0; j < lineSteps; j++) {
                const ph1 = (j / lineSteps) * Math.PI * 2;
                const ph2 = ((j + 1) / lineSteps) * Math.PI * 2;
                const p1 = torusPoint(th, ph1, viewAngle);
                const p2 = torusPoint(th, ph2, viewAngle);
                segments.push({
                    x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
                    z: (p1.z + p2.z) / 2,
                    color: 'grid'
                });
            }
        }

        // Draw phi lines (through the hole)
        for (let j = 0; j <= 16; j++) {
            const ph = (j / 16) * Math.PI * 2;
            for (let i = 0; i < lineSteps; i++) {
                const th1 = (i / lineSteps) * Math.PI * 2;
                const th2 = ((i + 1) / lineSteps) * Math.PI * 2;
                const p1 = torusPoint(th1, ph, viewAngle);
                const p2 = torusPoint(th2, ph, viewAngle);
                segments.push({
                    x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
                    z: (p1.z + p2.z) / 2,
                    color: 'grid'
                });
            }
        }

        // Blue loop (theta varies, phi = 0) — "around the donut"
        for (let i = 0; i < lineSteps; i++) {
            const th1 = (i / lineSteps) * Math.PI * 2;
            const th2 = ((i + 1) / lineSteps) * Math.PI * 2;
            const p1 = torusPoint(th1, 0, viewAngle);
            const p2 = torusPoint(th2, 0, viewAngle);
            segments.push({
                x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
                z: (p1.z + p2.z) / 2,
                color: 'blue', width: 3
            });
        }

        // Orange loop (theta = 0, phi varies) — "through the hole"
        for (let j = 0; j < lineSteps; j++) {
            const ph1 = (j / lineSteps) * Math.PI * 2;
            const ph2 = ((j + 1) / lineSteps) * Math.PI * 2;
            const p1 = torusPoint(0, ph1, viewAngle);
            const p2 = torusPoint(0, ph2, viewAngle);
            segments.push({
                x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
                z: (p1.z + p2.z) / 2,
                color: 'orange', width: 3
            });
        }

        // Trace path
        for (let i = 1; i < tracePoints.length; i++) {
            const p1 = torusPoint(tracePoints[i - 1].theta, tracePoints[i - 1].phi, viewAngle);
            const p2 = torusPoint(tracePoints[i].theta, tracePoints[i].phi, viewAngle);
            segments.push({
                x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
                z: (p1.z + p2.z) / 2,
                color: 'trace', width: 2.5
            });
        }

        // Current point
        const currentP = torusPoint(theta, phi, viewAngle);
        segments.push({
            x1: currentP.x, y1: currentP.y, x2: currentP.x, y2: currentP.y,
            z: currentP.z,
            color: 'point'
        });

        // Sort by depth
        segments.sort((a, b) => a.z - b.z);

        // Draw
	    segments.forEach(seg => {
		    if (seg.color === 'grid') {
			    const alpha = 0.08 + 0.12 * ((seg.z + r + R) / (2 * (r + R)));
			    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
			    ctx.lineWidth = 0.5;
			    ctx.beginPath();
			    ctx.moveTo(seg.x1, seg.y1);
			    ctx.lineTo(seg.x2, seg.y2);
			    ctx.stroke();
		    } else if (seg.color === 'blue') {
			    const alpha = 0.3 + 0.7 * ((seg.z + r + R) / (2 * (r + R)));
			    ctx.strokeStyle = `rgba(79, 195, 247, ${alpha})`;
			    ctx.lineWidth = seg.width;
			    ctx.beginPath();
			    ctx.moveTo(seg.x1, seg.y1);
			    ctx.lineTo(seg.x2, seg.y2);
			    ctx.stroke();
		    } else if (seg.color === 'orange') {
			    const alpha = 0.3 + 0.7 * ((seg.z + r + R) / (2 * (r + R)));
			    ctx.strokeStyle = `rgba(255, 138, 101, ${alpha})`;
			    ctx.lineWidth = seg.width;
			    ctx.beginPath();
			    ctx.moveTo(seg.x1, seg.y1);
			    ctx.lineTo(seg.x2, seg.y2);
			    ctx.stroke();
		    } else if (seg.color === 'trace') {
			    const alpha = 0.4 + 0.6 * ((seg.z + r + R) / (2 * (r + R)));
			    ctx.strokeStyle = `rgba(76, 175, 80, ${alpha})`;
			    ctx.lineWidth = seg.width;
			    ctx.beginPath();
			    ctx.moveTo(seg.x1, seg.y1);
			    ctx.lineTo(seg.x2, seg.y2);
			    ctx.stroke();
		    } else if (seg.color === 'point') {
			    ctx.fillStyle = '#fff';
			    ctx.shadowColor = '#fff';
			    ctx.shadowBlur = 15;
			    ctx.beginPath();
			    ctx.arc(seg.x1, seg.y1, 6, 0, Math.PI * 2);
			    ctx.fill();
			    ctx.shadowBlur = 0;
		    }
	    });

        // Labels
        ctx.fillStyle = '#4fc3f7';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillText('β₀=1  β₁=2  β₂=1  χ=0', 15, 25);

        ctx.fillStyle = '#aaa';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('π₁(T²) = ℤ × ℤ', 15, 45);
    }

    function drawFlatTorus(theta, phi) {
        flatCtx.clearRect(0, 0, 300, 300);

        const pad = 20;
        const w = 300 - 2 * pad;
        const h = 300 - 2 * pad;

        // Background
        flatCtx.fillStyle = '#111133';
        flatCtx.fillRect(0, 0, 300, 300);

        // Grid
        flatCtx.strokeStyle = 'rgba(100,140,255,0.15)';
        flatCtx.lineWidth = 0.5;
        for (let i = 0; i <= 8; i++) {
            flatCtx.beginPath();
            flatCtx.moveTo(pad + (i / 8) * w, pad);
            flatCtx.lineTo(pad + (i / 8) * w, pad + h);
            flatCtx.stroke();
            flatCtx.beginPath();
            flatCtx.moveTo(pad, pad + (i / 8) * h);
            flatCtx.lineTo(pad + w, pad + (i / 8) * h);
            flatCtx.stroke();
        }

        // Boundary with identification arrows
        // Left/Right edges (identified) — blue
        flatCtx.strokeStyle = '#4fc3f7';
        flatCtx.lineWidth = 3;
        flatCtx.setLineDash([]);
        // Left edge
        flatCtx.beginPath();
        flatCtx.moveTo(pad, pad);
        flatCtx.lineTo(pad, pad + h);
        flatCtx.stroke();
        // Arrow on left
        flatCtx.fillStyle = '#4fc3f7';
        flatCtx.beginPath();
        flatCtx.moveTo(pad, pad + h / 2 - 8);
        flatCtx.lineTo(pad - 5, pad + h / 2);
        flatCtx.lineTo(pad + 5, pad + h / 2);
        flatCtx.fill();
        // Right edge
        flatCtx.beginPath();
        flatCtx.moveTo(pad + w, pad);
        flatCtx.lineTo(pad + w, pad + h);
        flatCtx.stroke();
        // Arrow on right
        flatCtx.beginPath();
        flatCtx.moveTo(pad + w, pad + h / 2 - 8);
        flatCtx.lineTo(pad + w - 5, pad + h / 2);
        flatCtx.lineTo(pad + w + 5, pad + h / 2);
        flatCtx.fill();

        // Top/Bottom edges (identified) — orange
        flatCtx.strokeStyle = '#ff8a65';
        flatCtx.lineWidth = 3;
        // Top
        flatCtx.beginPath();
        flatCtx.moveTo(pad, pad);
        flatCtx.lineTo(pad + w, pad);
        flatCtx.stroke();
        // Arrow on top
        flatCtx.fillStyle = '#ff8a65';
        flatCtx.beginPath();
        flatCtx.moveTo(pad + w / 2 + 8, pad);
        flatCtx.lineTo(pad + w / 2, pad - 5);
        flatCtx.lineTo(pad + w / 2, pad + 5);
        flatCtx.fill();
        // Bottom
        flatCtx.beginPath();
        flatCtx.moveTo(pad, pad + h);
        flatCtx.lineTo(pad + w, pad + h);
        flatCtx.stroke();
        // Arrow on bottom
        flatCtx.beginPath();
        flatCtx.moveTo(pad + w / 2 + 8, pad + h);
        flatCtx.lineTo(pad + w / 2, pad + h - 5);
        flatCtx.lineTo(pad + w / 2, pad + h + 5);
        flatCtx.fill();

        // Trace on flat torus
        if (tracePoints.length > 1) {
            flatCtx.strokeStyle = 'rgba(76,175,80,0.8)';
            flatCtx.lineWidth = 2;
            for (let i = 1; i < tracePoints.length; i++) {
                const x1 = pad + (tracePoints[i - 1].theta / (Math.PI * 2)) * w;
                const y1 = pad + (tracePoints[i - 1].phi / (Math.PI * 2)) * h;
                const x2 = pad + (tracePoints[i].theta / (Math.PI * 2)) * w;
                const y2 = pad + (tracePoints[i].phi / (Math.PI * 2)) * h;

                // Check for wrapping
                const dth = Math.abs(tracePoints[i].theta - tracePoints[i - 1].theta);
                const dph = Math.abs(tracePoints[i].phi - tracePoints[i - 1].phi);
                if (dth < 0.5 && dph < 0.5) {
                    flatCtx.beginPath();
                    flatCtx.moveTo(x1, y1);
                    flatCtx.lineTo(x2, y2);
                    flatCtx.stroke();
                }
            }
        }

        // Current point on flat torus
        const fx = pad + (theta / (Math.PI * 2)) * w;
        const fy = pad + (phi / (Math.PI * 2)) * h;
        flatCtx.fillStyle = '#fff';
        flatCtx.shadowColor = '#fff';
        flatCtx.shadowBlur = 10;
        flatCtx.beginPath();
        flatCtx.arc(fx, fy, 5, 0, Math.PI * 2);
        flatCtx.fill();
        flatCtx.shadowBlur = 0;

        // Labels
        flatCtx.fillStyle = '#4fc3f7';
        flatCtx.font = '11px Inter, sans-serif';
        flatCtx.fillText('θ (Day of Week) →', pad + w / 2 - 50, pad + h + 17);
        flatCtx.save();
        flatCtx.translate(pad - 8, pad + h / 2 + 40);
        flatCtx.rotate(-Math.PI / 2);
        flatCtx.fillStyle = '#ff8a65';
        flatCtx.fillText('φ (Time of Day) →', 0, 0);
        flatCtx.restore();

        flatCtx.fillStyle = '#aaa';
        flatCtx.font = '11px Inter, sans-serif';
        flatCtx.fillText('Flat Torus [0,1]² / ~', pad + w / 2 - 50, 14);
    }

    const thetaSlider = document.getElementById('torus-theta');
    const phiSlider = document.getElementById('torus-phi');
    const viewSlider = document.getElementById('torus-view');
    const thetaVal = document.getElementById('torus-theta-val');
    const phiVal = document.getElementById('torus-phi-val');
    const traceBtn = document.getElementById('torus-trace-btn');
    const clearBtn = document.getElementById('torus-clear-btn');

    function update() {
        const theta = parseFloat(thetaSlider.value) / 100;
        const phi = parseFloat(phiSlider.value) / 100;
        const view = parseFloat(viewSlider.value) / 100;

        const dayIndex = Math.floor((theta / (Math.PI * 2)) * 7) % 7;
        thetaVal.textContent = days[dayIndex];

        const hour = Math.floor((phi / (Math.PI * 2)) * 24) % 24;
        const min = Math.floor(((phi / (Math.PI * 2)) * 24 - hour) * 60);
        phiVal.textContent = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

        drawTorus(theta, phi, view);
        drawFlatTorus(theta, phi);
    }

    thetaSlider.addEventListener('input', update);
    phiSlider.addEventListener('input', update);
    viewSlider.addEventListener('input', update);

    traceBtn.addEventListener('click', function() {
        if (isTracing) return;
        isTracing = true;
        tracePoints = [];
        traceT = 0;

        function traceStep() {
            if (traceT > Math.PI * 6) {
                isTracing = false;
                return;
            }
            const theta = (traceT * 1.0) % (Math.PI * 2);
            const phi = (traceT * 1.618) % (Math.PI * 2); // golden ratio for nice diagonal
            tracePoints.push({ theta, phi });

            thetaSlider.value = Math.round(theta * 100);
            phiSlider.value = Math.round(phi * 100);
            update();

            traceT += 0.05;
            requestAnimationFrame(traceStep);
        }
        traceStep();
    });

    clearBtn.addEventListener('click', function() {
        tracePoints = [];
        isTracing = false;
        update();
    });

    update();
}

// ============================================================
// MÖBIUS STRIP VISUALIZATION — Non-orientability & meaning reversal
// ============================================================
function draw_moebius() {
    const container = document.getElementById('mobius-viz');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 480;
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.borderRadius = '12px';
    canvas.style.background = '#0a0a2e';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = 'text-align:center; margin:15px 0; font-family:"Inter",sans-serif;';
    controlsDiv.innerHTML = `
        <div style="margin-bottom:10px;">
            <label style="color:#ccc;">Walk along the strip: </label>
            <input type="range" id="mobius-walk" min="0" max="1000" value="0" style="width:300px; vertical-align:middle;">
            <span id="mobius-walk-val" style="color:#4fc3f7; margin-left:8px; font-weight:600;">0%</span>
        </div>
        <div style="margin-bottom:10px;">
            <label style="color:#ccc;">View tilt: </label>
            <input type="range" id="mobius-tilt" min="20" max="120" value="65" style="width:150px; vertical-align:middle;">
            <label style="color:#ccc; margin-left:20px;">Rotation: </label>
            <input type="range" id="mobius-rot" min="0" max="628" value="0" style="width:150px; vertical-align:middle;">
        </div>
        <div id="mobius-meaning" style="font-size:22px; margin:10px 0; min-height:40px; color:#fff; font-weight:700; transition: color 0.3s;"></div>
        <div style="color:#888; font-size:13px;">Walk 100% around — the arrow <span style="color:#ff5252;">flips direction</span>. Walk 200% to return to original orientation.</div>
    `;
    container.appendChild(controlsDiv);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const R = 140; // radius of central circle
    const halfW = 45; // half-width of strip

    function mobiusPoint(u, v, tilt, rot) {
        // u in [0, 2π], v in [-1, 1]
        const halfTwist = u / 2; // half twist
        const x3 = (R + v * halfW * Math.cos(halfTwist)) * Math.cos(u);
        const y3 = (R + v * halfW * Math.cos(halfTwist)) * Math.sin(u);
        const z3 = v * halfW * Math.sin(halfTwist);

        // Rotate for view
        const cosT = Math.cos(tilt);
        const sinT = Math.sin(tilt);
        const cosR = Math.cos(rot);
        const sinR = Math.sin(rot);

        // Tilt around X
        const y3t = y3 * cosT - z3 * sinT;
        const z3t = y3 * sinT + z3 * cosT;

        // Rotate around Y
        const x3r = x3 * cosR - z3t * sinR;
        const z3r = x3 * sinR + z3t * cosR;

        return { x: x3r + cx, y: y3t + cy, z: z3r };
    }

    // Semantic meaning along the strip
    function getMeaning(t) {
        // t in [0, 2]: 0..1 is first pass, 1..2 is second pass (flipped)
        const phrases = [
            { pos: 0.0, text: '"That\'s great!"', sincere: true },
            { pos: 0.15, text: '"Really great."', sincere: true },
            { pos: 0.3, text: '"Great. Sure."', sincere: null },
            { pos: 0.45, text: '"Oh, great..."', sincere: false },
            { pos: 0.6, text: '"How great."', sincere: false },
            { pos: 0.75, text: '"Truly great." 🙄', sincere: false },
            { pos: 0.9, text: '"That\'s just great."', sincere: false },
        ];

        const norm = t % 1;
        const flipped = t >= 1;

        let closest = phrases[0];
        let minDist = 999;
        for (const p of phrases) {
            const d = Math.abs(p.pos - norm);
            if (d < minDist) { minDist = d; closest = p; }
        }

        let sincere = closest.sincere;
        if (flipped && sincere !== null) sincere = !sincere;

        return {
            text: closest.text,
            sincere: sincere,
            flipped: flipped
        };
    }

    function draw() {
        const walkVal = parseFloat(document.getElementById('mobius-walk').value) / 1000;
        const tilt = parseFloat(document.getElementById('mobius-tilt').value) / 100 * Math.PI;
        const rot = parseFloat(document.getElementById('mobius-rot').value) / 100;

        document.getElementById('mobius-walk-val').textContent = Math.round(walkVal * 200) + '%';

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const uSteps = 120;
        const vSteps = 12;

        // Collect quads for depth sorting
        let quads = [];

        for (let i = 0; i < uSteps; i++) {
            for (let j = -vSteps; j < vSteps; j++) {
                const u1 = (i / uSteps) * Math.PI * 2;
                const u2 = ((i + 1) / uSteps) * Math.PI * 2;
                const v1 = j / vSteps;
                const v2 = (j + 1) / vSteps;

                const p1 = mobiusPoint(u1, v1, tilt, rot);
                const p2 = mobiusPoint(u2, v1, tilt, rot);
                const p3 = mobiusPoint(u2, v2, tilt, rot);
                const p4 = mobiusPoint(u1, v2, tilt, rot);

                const avgZ = (p1.z + p2.z + p3.z + p4.z) / 4;

                // Color based on "side" — but there's only one side!
                // Use v * cos(u/2) sign to show the twist
                const sideVal = v1 * Math.cos(u1 / 2);
                let r, g, b;
                if (sideVal >= 0) {
                    r = 60; g = 100; b = 200;
                } else {
                    r = 200; g = 80; b = 60;
                }

                // Highlight the walker's position
                const walkerU = walkVal * Math.PI * 2 * 2; // 200% = full double loop
                const uMid = (u1 + u2) / 2;
                const uDist = Math.min(
                    Math.abs(uMid - (walkerU % (Math.PI * 2))),
                    Math.abs(uMid - (walkerU % (Math.PI * 2)) + Math.PI * 2),
                    Math.abs(uMid - (walkerU % (Math.PI * 2)) - Math.PI * 2)
                );
                if (uDist < 0.3) {
                    r = Math.min(255, r + 100);
                    g = Math.min(255, g + 100);
                    b = Math.min(255, b + 100);
                }

                const brightness = 0.4 + 0.6 * ((avgZ + R + halfW) / (2 * (R + halfW)));

                quads.push({
                    points: [p1, p2, p3, p4],
                    z: avgZ,
                    r: Math.round(r * brightness),
                    g: Math.round(g * brightness),
                    b: Math.round(b * brightness)
                });
            }
        }

        // Sort by depth
        quads.sort((a, b) => a.z - b.z);

        // Draw quads
        quads.forEach(q => {
            ctx.fillStyle = `rgb(${q.r},${q.g},${q.b})`;
            ctx.strokeStyle = `rgba(${q.r + 30},${q.g + 30},${q.b + 30},0.3)`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(q.points[0].x, q.points[0].y);
            ctx.lineTo(q.points[1].x, q.points[1].y);
            ctx.lineTo(q.points[2].x, q.points[2].y);
            ctx.lineTo(q.points[3].x, q.points[3].y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });

        // Draw walker arrow on the strip
        const walkerU = walkVal * Math.PI * 2 * 2;
        const walkerP = mobiusPoint(walkerU % (Math.PI * 2), 0, tilt, rot);

        // Arrow direction (normal to strip at walker position)
        const walkerSide = mobiusPoint(walkerU % (Math.PI * 2), 0.5, tilt, rot);
        const arrowDx = walkerSide.x - walkerP.x;
        const arrowDy = walkerSide.y - walkerP.y;
        const arrowLen = Math.sqrt(arrowDx * arrowDx + arrowDy * arrowDy);
        const nx = (arrowDx / arrowLen) * 25;
        const ny = (arrowDy / arrowLen) * 25;

        // Arrow color: green if original orientation, red if flipped
        const isFlipped = walkVal > 0.5;
        const arrowColor = isFlipped ? '#ff5252' : '#4caf50';

        ctx.strokeStyle = arrowColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(walkerP.x - nx * 0.5, walkerP.y - ny * 0.5);
        ctx.lineTo(walkerP.x + nx, walkerP.y + ny);
        ctx.stroke();

        // Arrowhead
        ctx.fillStyle = arrowColor;
        const angle = Math.atan2(ny, nx);
        ctx.beginPath();
        ctx.moveTo(walkerP.x + nx, walkerP.y + ny);
        ctx.lineTo(walkerP.x + nx - 10 * Math.cos(angle - 0.4), walkerP.y + ny - 10 * Math.sin(angle - 0.4));
        ctx.lineTo(walkerP.x + nx - 10 * Math.cos(angle + 0.4), walkerP.y + ny - 10 * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();

        // Walker dot
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(walkerP.x, walkerP.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Update meaning display
        const meaning = getMeaning(walkVal * 2);
        const meaningDiv = document.getElementById('mobius-meaning');
        if (meaning.sincere === true) {
            meaningDiv.style.color = '#4caf50';
            meaningDiv.textContent = meaning.text + '  → Sincere ✓';
        } else if (meaning.sincere === false) {
            meaningDiv.style.color = '#ff5252';
            meaningDiv.textContent = meaning.text + '  → Sarcastic ✗';
        } else {
            meaningDiv.style.color = '#ffd54f';
            meaningDiv.textContent = meaning.text + '  → Ambiguous ?';
        }

        if (meaning.flipped) {
            meaningDiv.textContent += '  [ORIENTATION FLIPPED]';
        }

        // Labels
        ctx.fillStyle = '#4fc3f7';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillText('β₀=1  β₁=1  (same as cylinder!)', 15, 25);
        ctx.fillStyle = '#ff8a65';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('But non-orientable: w₁ ≠ 0', 15, 45);

        ctx.fillStyle = '#aaa';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText('Blue/Red coloring shows the twist — colors swap after one loop', 15, canvas.height - 15);
    }

    document.getElementById('mobius-walk').addEventListener('input', draw);
    document.getElementById('mobius-tilt').addEventListener('input', draw);
    document.getElementById('mobius-rot').addEventListener('input', draw);

    draw();
}

// ============================================================
// COVERING SPACE VISUALIZATION — Unwinding polysemy
// ============================================================
function covering_vis() {
    const container = document.getElementById('covering-viz');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 520;
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.borderRadius = '12px';
    canvas.style.background = '#0a0a2e';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = 'text-align:center; margin:15px 0; font-family:"Inter",sans-serif;';
    controlsDiv.innerHTML = `
        <div style="margin-bottom:10px;">
            <label style="color:#ccc;">Transformer Depth (Layer): </label>
            <input type="range" id="cover-depth" min="0" max="100" value="0" style="width:280px; vertical-align:middle;">
            <span id="cover-depth-val" style="color:#4fc3f7; margin-left:8px; font-weight:600;">Layer 0 (Input)</span>
        </div>
        <div style="margin-bottom:10px;">
            <label style="color:#ccc;">Context sentence: </label>
            <select id="cover-context" style="padding:5px 12px; border-radius:6px; background:#1a1a3e; color:#fff; border:1px solid #444; font-size:14px;">
                <option value="0">I went to the bank to deposit money 🏦</option>
                <option value="1">I sat on the bank of the river 🌊</option>
                <option value="2">The pilot banked the aircraft sharply ✈️</option>
                <option value="3">Don't bank on it happening 🎲</option>
            </select>
        </div>
        <div style="color:#888; font-size:13px;">Increase depth to watch the circle <strong>unwind</strong> into separated meaning sheets</div>
    `;
    container.appendChild(controlsDiv);

    const meanings = [
        { label: '🏦 Financial', color: '#4fc3f7', angle: 0 },
        { label: '🌊 River', color: '#66bb6a', angle: Math.PI / 2 },
        { label: '✈️ Aircraft', color: '#ffa726', angle: Math.PI },
        { label: '🎲 Rely on', color: '#ef5350', angle: 3 * Math.PI / 2 }
    ];

    function draw() {
        const depth = parseFloat(document.getElementById('cover-depth').value) / 100;
        const contextIdx = parseInt(document.getElementById('cover-context').value);

        const layerNum = Math.round(depth * 12);
        const depthLabel = document.getElementById('cover-depth-val');
        if (layerNum === 0) depthLabel.textContent = 'Layer 0 (Input)';
        else if (layerNum === 12) depthLabel.textContent = 'Layer 12 (Output)';
        else depthLabel.textContent = `Layer ${layerNum}`;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Layout: left side = circle/unwound, right side = sheets diagram
        const leftCx = 200;
        const leftCy = 260;
        const rightX = 450;

        // === LEFT SIDE: Circle unwinding into line ===

        // The circle radius shrinks as depth increases, and it unwinds
        const circleR = 120 * (1 - depth * 0.85);
        const unwindFactor = depth;

        // Draw the base circle (faded)
        ctx.strokeStyle = 'rgba(100,140,255,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(leftCx, leftCy, 120, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw the unwinding path
        const pathSteps = 200;
        ctx.lineWidth = 3;

        for (let i = 0; i < pathSteps - 1; i++) {
            const t1 = (i / pathSteps) * Math.PI * 2;
            const t2 = ((i + 1) / pathSteps) * Math.PI * 2;

            // Interpolate between circle and vertical line
            // Circle position
            const cx1 = leftCx + circleR * Math.cos(t1);
            const cy1 = leftCy + circleR * Math.sin(t1);
            const cx2 = leftCx + circleR * Math.cos(t2);
            const cy2 = leftCy + circleR * Math.sin(t2);

            // Unwound (vertical line) position
            const lx1 = leftCx;
            const ly1 = leftCy - 150 + (t1 / (Math.PI * 2)) * 300;
            const lx2 = leftCx;
            const ly2 = leftCy - 150 + (t2 / (Math.PI * 2)) * 300;

            // Interpolate
            const x1 = cx1 * (1 - unwindFactor) + lx1 * unwindFactor;
            const y1 = cy1 * (1 - unwindFactor) + ly1 * unwindFactor;
            const x2 = cx2 * (1 - unwindFactor) + lx2 * unwindFactor;
            const y2 = cy2 * (1 - unwindFactor) + ly2 * unwindFactor;

            // Color gradient
            const hue = (t1 / (Math.PI * 2)) * 360;
            ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // Draw meaning points on the path
        meanings.forEach((m, idx) => {
            const t = m.angle;
            const cx1 = leftCx + circleR * Math.cos(t);
            const cy1 = leftCy + circleR * Math.sin(t);
            const lx1 = leftCx;
            const ly1 = leftCy - 150 + (t / (Math.PI * 2)) * 300;

            const x = cx1 * (1 - unwindFactor) + lx1 * unwindFactor;
            const y = cy1 * (1 - unwindFactor) + ly1 * unwindFactor;

            // Separate horizontally as depth increases
            const separation = unwindFactor * 60 * (idx % 2 === 0 ? 1 : -1) * (1 + idx * 0.3);
            const finalX = x + separation;

            // Glow for selected context
            if (idx === contextIdx) {
                ctx.shadowColor = m.color;
                ctx.shadowBlur = 20 + depth * 20;
            }

            ctx.fillStyle = m.color;
            ctx.beginPath();
            ctx.arc(finalX, y, 8 + depth * 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Label
            ctx.fillStyle = m.color;
            ctx.font = `${11 + depth * 3}px Inter, sans-serif`;
            const labelX = finalX + (separation >= 0 ? 15 : -ctx.measureText(m.label).width - 15);
            ctx.globalAlpha = 0.3 + depth * 0.7;
            ctx.fillText(m.label, labelX, y + 4);
            ctx.globalAlpha = 1;
        });

        // "bank" label at center
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.textAlign = 'center';
        if (depth < 0.3) {
            ctx.fillText('"bank"', leftCx, leftCy - circleR - 20);
            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = '#aaa';
            ctx.fillText('(all meanings overlapping)', leftCx, leftCy - circleR - 5);
        } else {
            ctx.fillText('"bank"', leftCx, leftCy - 170);
            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = '#aaa';
            ctx.fillText('(meanings separating...)', leftCx, leftCy - 155);
        }
        ctx.textAlign = 'left';

        // === RIGHT SIDE: Covering space diagram ===
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText('Covering Space Sheets', rightX, 30);

        // Draw sheets as horizontal lines
        const sheetY = [120, 210, 300, 390];
        const sheetWidth = 180;

        meanings.forEach((m, idx) => {
            const y = sheetY[idx];
            const alpha = 0.2 + depth * 0.8;

            ctx.globalAlpha = alpha;
            ctx.strokeStyle = m.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(rightX, y);
            ctx.lineTo(rightX + sheetWidth, y);
            ctx.stroke();

            ctx.fillStyle = m.color;
            ctx.font = '13px Inter, sans-serif';
            ctx.fillText(m.label, rightX + sheetWidth + 8, y + 4);

            // Show projection lines down to base
            if (depth > 0.3) {
                ctx.strokeStyle = `rgba(255,255,255,${0.1 * depth})`;
                ctx.lineWidth = 0.5;
                ctx.setLineDash([3, 5]);
                ctx.beginPath();
                ctx.moveTo(rightX + sheetWidth / 2, y + 5);
                ctx.lineTo(rightX + sheetWidth / 2, 460);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Highlight selected sheet
            if (idx === contextIdx) {
                ctx.fillStyle = m.color;
                ctx.shadowColor = m.color;
                ctx.shadowBlur = 15;
                const dotX = rightX + 20 + depth * (sheetWidth - 40);
                ctx.beginPath();
                ctx.arc(dotX, y, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Arrow pointing to this sheet
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Inter, sans-serif';
                ctx.fillText('← context selects this sheet', dotX + 12, y - 12);
            }

            ctx.globalAlpha = 1;
        });

        // Base space (circle) at bottom right
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rightX + sheetWidth / 2, 470, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#aaa';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Base S¹', rightX + sheetWidth / 2, 500);
        ctx.fillText('p: ℝ → S¹', rightX + sheetWidth / 2, 514);
        ctx.textAlign = 'left';

        // Formula
        ctx.fillStyle = '#4fc3f7';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('|sheets| = |π₁(S¹) / p*(π₁(ℝ))| = |ℤ / 0| = 4 meanings', 15, canvas.height - 15);
    }

    document.getElementById('cover-depth').addEventListener('input', draw);
    document.getElementById('cover-context').addEventListener('change', draw);

    draw();
}

// ============================================================
// PROJECTIVE PLANE VISUALIZATION — Unsigned concepts
// ============================================================
function projective_plane() {
    const container = document.getElementById('projective-viz');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 500;
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.borderRadius = '12px';
    canvas.style.background = '#0a0a2e';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = 'text-align:center; margin:15px 0; font-family:"Inter",sans-serif;';
    controlsDiv.innerHTML = `
        <div style="margin-bottom:10px;">
            <label style="color:#ccc;">Rotate view: </label>
            <input type="range" id="proj-rotX" min="0" max="314" value="50" style="width:150px; vertical-align:middle;">
            <input type="range" id="proj-rotY" min="0" max="628" value="0" style="width:150px; vertical-align:middle;">
        </div>
        <div style="margin-bottom:10px;">
            <label style="color:#ccc;">Concept mode: </label>
            <select id="proj-mode" style="padding:5px 12px; border-radius:6px; background:#1a1a3e; color:#fff; border:1px solid #444; font-size:14px;">
                <option value="emotions">Emotions (intensity is projective)</option>
                <option value="formality">Formality axis</option>
                <option value="tense">Tense axis</option>
            </select>
            <label style="color:#ccc; margin-left:15px;">Show antipodal ID: </label>
            <input type="checkbox" id="proj-antipodal" checked style="vertical-align:middle;">
        </div>
        <div style="color:#888; font-size:13px;">Antipodal points (connected by <span style="color:#ff8a65;">orange lines</span>) are <strong>identified</strong> — they represent the same projective point. Intensity has no sign.</div>
    `;
    container.appendChild(controlsDiv);

    const cx = 250;
    const cy = 250;
    const radius = 170;

    // Concept data
    const conceptSets = {
        emotions: [
            { label: 'Ecstatic 😄', theta: 0.3, phi: 0.3, color: '#4caf50' },
            { label: 'Devastated 😢', theta: Math.PI + 0.3, phi: Math.PI - 0.3, color: '#4caf50' },
            { label: 'Furious 😡', theta: 1.2, phi: 0.8, color: '#f44336' },
            { label: 'Terrified 😨', theta: Math.PI + 1.2, phi: Math.PI - 0.8, color: '#f44336' },
            { label: 'Serene 😌', theta: 2.5, phi: 0.5, color: '#2196f3' },
            { label: 'Numb 😶', theta: Math.PI + 2.5, phi: Math.PI - 0.5, color: '#2196f3' },
            { label: 'VERY (intensity)', theta: 0, phi: 0, color: '#ffd54f', isAxis: true },
            { label: 'mild', theta: Math.PI, phi: Math.PI, color: '#ffd54f', isAxis: true },
        ],
        formality: [
            { label: 'Exceedingly', theta: 0.4, phi: 0.4, color: '#9c27b0' },
            { label: 'Super', theta: Math.PI + 0.4, phi: Math.PI - 0.4, color: '#9c27b0' },
            { label: 'Perchance', theta: 1.5, phi: 0.6, color: '#e91e63' },
            { label: 'Maybe', theta: Math.PI + 1.5, phi: Math.PI - 0.6, color: '#e91e63' },
            { label: 'Commence', theta: 2.8, phi: 0.3, color: '#00bcd4' },
            { label: 'Start', theta: Math.PI + 2.8, phi: Math.PI - 0.3, color: '#00bcd4' },
            { label: 'FORMAL axis', theta: 0, phi: 0, color: '#ffd54f', isAxis: true },
            { label: 'casual axis', theta: Math.PI, phi: Math.PI, color: '#ffd54f', isAxis: true },
        ],
        tense: [
            { label: 'Walked', theta: 0.5, phi: 0.5, color: '#ff9800' },
            { label: 'Will walk', theta: Math.PI + 0.5, phi: Math.PI - 0.5, color: '#ff9800' },
            { label: 'Had eaten', theta: 1.8, phi: 0.7, color: '#8bc34a' },
            { label: 'Will have eaten', theta: Math.PI + 1.8, phi: Math.PI - 0.7, color: '#8bc34a' },
            { label: 'Was running', theta: 2.6, phi: 0.4, color: '#03a9f4' },
            { label: 'Will be running', theta: Math.PI + 2.6, phi: Math.PI - 0.4, color: '#03a9f4' },
            { label: 'PAST axis', theta: 0, phi: 0, color: '#ffd54f', isAxis: true },
            { label: 'FUTURE axis', theta: Math.PI, phi: Math.PI, color: '#ffd54f', isAxis: true },
        ]
    };

    function project3D(theta, phi, rotX, rotY) {
        // Spherical to Cartesian
        let x = radius * Math.sin(phi) * Math.cos(theta);
        let y = radius * Math.sin(phi) * Math.sin(theta);
        let z = radius * Math.cos(phi);

        // Rotate around X
        let y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
        let z1 = y * Math.sin(rotX) + z * Math.cos(rotX);

        // Rotate around Y
        let x1 = x * Math.cos(rotY) - z1 * Math.sin(rotY);
        let z2 = x * Math.sin(rotY) + z1 * Math.cos(rotY);

        return { x: x1 + cx, y: y1 + cy, z: z2 };
    }

    function draw() {
        const rotX = parseFloat(document.getElementById('proj-rotX').value) / 100;
        const rotY = parseFloat(document.getElementById('proj-rotY').value) / 100;
        const mode = document.getElementById('proj-mode').value;
        const showAntipodal = document.getElementById('proj-antipodal').checked;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw hemisphere wireframe
        ctx.strokeStyle = 'rgba(100,140,255,0.12)';
        ctx.lineWidth = 0.5;

        // Latitude lines
        for (let lat = 1; lat <= 6; lat++) {
            const phi = (lat / 7) * Math.PI / 2;
            ctx.beginPath();
            for (let i = 0; i <= 80; i++) {
                const theta = (i / 80) * Math.PI * 2;
                const p = project3D(theta, phi, rotX, rotY);
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
        }

        // Longitude lines
        for (let lon = 0; lon < 12; lon++) {
            const theta = (lon / 12) * Math.PI * 2;
            ctx.beginPath();
            for (let i = 0; i <= 40; i++) {
                const phi = (i / 40) * Math.PI / 2;
                const p = project3D(theta, phi, rotX, rotY);
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
        }

        // Equator (thicker — this is where identification happens)
        ctx.strokeStyle = 'rgba(255,138,101,0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
            const theta = (i / 80) * Math.PI * 2;
            const p = project3D(theta, Math.PI / 2, rotX, rotY);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw concept points
        const concepts = conceptSets[mode];

        // Collect for depth sorting
        let points = [];
        for (let i = 0; i < concepts.length; i++) {
            const c = concepts[i];
            const p = project3D(c.theta, c.phi, rotX, rotY);
            points.push({ ...c, px: p.x, py: p.y, pz: p.z, idx: i });
        }

        // Draw antipodal connections first
        if (showAntipodal) {
            for (let i = 0; i < concepts.length; i += 2) {
                if (i + 1 >= concepts.length) break;
                const p1 = project3D(concepts[i].theta, concepts[i].phi, rotX, rotY);
                const p2 = project3D(concepts[i + 1].theta, concepts[i + 1].phi, rotX, rotY);

                // Dashed line through center
                ctx.strokeStyle = 'rgba(255,138,101,0.4)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
                ctx.setLineDash([]);

                // "≡" symbol at midpoint
                const mx = (p1.x + p2.x) / 2;
                const my = (p1.y + p2.y) / 2;
                ctx.fillStyle = 'rgba(255,138,101,0.6)';
                ctx.font = 'bold 14px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('≡', mx, my + 5);
                ctx.textAlign = 'left';
            }
        }

        // Sort by depth
        points.sort((a, b) => a.pz - b.pz);

        // Draw points
        points.forEach(p => {
            const alpha = 0.4 + 0.6 * ((p.pz + radius) / (2 * radius));
            const size = p.isAxis ? 10 : 7;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = p.isAxis ? 15 : 8;
            ctx.beginPath();
            ctx.arc(p.px, p.py, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Label
            ctx.font = `${p.isAxis ? 'bold 13' : '12'}px Inter, sans-serif`;
            ctx.fillStyle = p.color;
            ctx.fillText(p.label, p.px + size + 5, p.py + 4);
            ctx.globalAlpha = 1;
        });

        // === RIGHT SIDE: Explanation panel ===
        const panelX = 470;
        const panelY = 40;

        ctx.fillStyle = 'rgba(20,20,60,0.85)';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, 215, 200, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(100,140,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, 215, 200, 10);
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillText('ℝP² = S² / (x ~ -x)', panelX + 15, panelY + 25);

        ctx.fillStyle = '#aaa';
        ctx.font = '11px Inter, sans-serif';
        const lines = [
            'Antipodal points are the',
            'SAME point in projective space.',
            '',
            '"Very happy" and "very sad"',
            'share the same INTENSITY.',
            '',
            'The direction v and -v',
            'represent the same axis.',
            '',
            'Betti (ℤ₂): β₀=1 β₁=1 β₂=1',
            'Betti (ℤ):  β₀=1 β₁=0 β₂=0',
            'χ(ℝP²) = 1'
        ];
        lines.forEach((line, i) => {
            if (line.includes('β') || line.includes('χ')) {
                ctx.fillStyle = '#4fc3f7';
                ctx.font = '11px "Courier New", monospace';
            } else if (line.includes('SAME') || line.includes('INTENSITY')) {
                ctx.fillStyle = '#ffd54f';
                ctx.font = 'bold 11px Inter, sans-serif';
            } else {
                ctx.fillStyle = '#aaa';
                ctx.font = '11px Inter, sans-serif';
            }
            ctx.fillText(line, panelX + 15, panelY + 45 + i * 14);
        });

        // Bottom label
        ctx.fillStyle = '#ff8a65';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('Dashed equator: antipodal points identified here', 15, canvas.height - 15);
    }

    document.getElementById('proj-rotX').addEventListener('input', draw);
    document.getElementById('proj-rotY').addEventListener('input', draw);
    document.getElementById('proj-mode').addEventListener('change', draw);
    document.getElementById('proj-antipodal').addEventListener('change', draw);

    draw();
}

// ============================================================
// FIBER BUNDLE VISUALIZATION — Context twists meaning
// ============================================================
function fiber_bundles() {
    const container = document.getElementById('fiber-viz');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 520;
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.borderRadius = '12px';
    canvas.style.background = '#0a0a2e';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = 'text-align:center; margin:15px 0; font-family:"Inter",sans-serif;';
    controlsDiv.innerHTML = `
        <div style="margin-bottom:10px;">
            <label style="color:#ccc;">Context position (base S¹): </label>
            <input type="range" id="fiber-context" min="0" max="628" value="0" style="width:250px; vertical-align:middle;">
            <span id="fiber-context-val" style="color:#4fc3f7; margin-left:8px; font-weight:600;"></span>
        </div>
        <div style="margin-bottom:10px;">
            <label style="color:#ccc;">Twist amount: </label>
            <input type="range" id="fiber-twist" min="0" max="100" value="0" style="width:180px; vertical-align:middle;">
            <span id="fiber-twist-label" style="color:#ff8a65; margin-left:8px;">Trivial (Cylinder)</span>
            <label style="color:#ccc; margin-left:20px;">Meaning position on fiber: </label>
            <input type="range" id="fiber-meaning" min="0" max="100" value="50" style="width:120px; vertical-align:middle;">
        </div>
        <div style="margin-bottom:10px;">
            <button id="fiber-transport-btn" style="padding:6px 16px; background:#4fc3f7; border:none; border-radius:6px; cursor:pointer; font-weight:600;">▶ Parallel Transport</button>
            <button id="fiber-reset-btn" style="margin-left:8px; padding:6px 16px; background:#ff5252; border:none; border-radius:6px; cursor:pointer; font-weight:600; color:#fff;">Reset</button>
        </div>
        <div style="color:#888; font-size:13px;">Twist the bundle from <span style="color:#4fc3f7;">cylinder</span> (trivial) to <span style="color:#ff8a65;">Möbius strip</span> (non-trivial). Watch meaning <strong>flip</strong> after parallel transport around the loop.</div>
    `;
    container.appendChild(controlsDiv);

    const cxBase = 200;
    const cyBase = 280;
    const baseR = 120;
    const fiberLen = 70;

    const contexts = [
        { angle: 0, label: '🏃 Sports', color: '#4caf50' },
        { angle: Math.PI / 2, label: '💻 Computing', color: '#2196f3' },
        { angle: Math.PI, label: '🧵 Fabric', color: '#e91e63' },
        { angle: 3 * Math.PI / 2, label: '🎭 Theater', color: '#ff9800' },
    ];

    let transportPath = [];
    let isTransporting = false;
    let transportT = 0;

    function fiberEndpoints(angle, twist, viewTilt) {
        // Base point on circle
        const bx = cxBase + baseR * Math.cos(angle);
        const by = cyBase + baseR * Math.sin(angle) * Math.cos(viewTilt);

        // Fiber direction (perpendicular to base circle, twisted)
        const twistAngle = angle * twist / 2; // 0 = no twist, 1 = half twist (Möbius)
        const fiberDx = -Math.sin(angle) * Math.sin(twistAngle) * fiberLen;
        const fiberDy = Math.cos(twistAngle) * fiberLen;

        // Apply view tilt to fiber
        const fiberDyTilted = fiberDy * 0.7;

        return {
            baseX: bx,
            baseY: by,
            topX: bx + fiberDx * 0.3,
            topY: by - fiberDyTilted,
            botX: bx - fiberDx * 0.3,
            botY: by + fiberDyTilted,
            twistAngle: twistAngle
        };
    }

    function draw() {
        const contextAngle = parseFloat(document.getElementById('fiber-context').value) / 100;
        const twist = parseFloat(document.getElementById('fiber-twist').value) / 100;
        const meaningPos = parseFloat(document.getElementById('fiber-meaning').value) / 100;
        const viewTilt = 0.35;

        // Update labels
        let closestCtx = contexts[0];
        let minDist = 999;
        contexts.forEach(c => {
            const d = Math.min(
                Math.abs(contextAngle - c.angle),
                Math.abs(contextAngle - c.angle + Math.PI * 2),
                Math.abs(contextAngle - c.angle - Math.PI * 2)
            );
            if (d < minDist) { minDist = d; closestCtx = c; }
        });
        document.getElementById('fiber-context-val').textContent = closestCtx.label;
        document.getElementById('fiber-context-val').style.color = closestCtx.color;

        const twistLabel = document.getElementById('fiber-twist-label');
        if (twist < 0.1) twistLabel.textContent = 'Trivial (Cylinder)';
        else if (twist > 0.9) twistLabel.textContent = 'Möbius (Half-twist)';
        else twistLabel.textContent = `Twist: ${Math.round(twist * 180)}°`;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the fiber bundle as a strip around the circle
        const steps = 80;

        // Collect strip quads
        let quads = [];
        for (let i = 0; i < steps; i++) {
            const a1 = (i / steps) * Math.PI * 2;
            const a2 = ((i + 1) / steps) * Math.PI * 2;

            const f1 = fiberEndpoints(a1, twist, viewTilt);
            const f2 = fiberEndpoints(a2, twist, viewTilt);

            const midZ = Math.sin(a1) + Math.sin(a2);

            quads.push({
                points: [
                    { x: f1.topX, y: f1.topY },
                    { x: f2.topX, y: f2.topY },
                    { x: f2.botX, y: f2.botY },
                    { x: f1.botX, y: f1.botY }
                ],
                z: midZ,
                angle: a1,
                twistAngle: f1.twistAngle
            });
        }

        // Sort by depth
        quads.sort((a, b) => a.z - b.z);

        // Draw quads
        quads.forEach(q => {
            const brightness = 0.25 + 0.35 * ((q.z + 2) / 4);
            const hue = (q.angle / (Math.PI * 2)) * 360;

            // Color based on twist — show the "side" via color
            const sideVal = Math.cos(q.twistAngle);
            let r, g, b;
            if (sideVal >= 0) {
                r = 40 + 60 * brightness;
                g = 80 + 100 * brightness;
                b = 180 + 60 * brightness;
            } else {
                r = 180 + 60 * brightness;
                g = 60 + 60 * brightness;
                b = 40 + 60 * brightness;
            }

            ctx.fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
            ctx.strokeStyle = `rgba(255,255,255,${0.05 + brightness * 0.1})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(q.points[0].x, q.points[0].y);
            ctx.lineTo(q.points[1].x, q.points[1].y);
            ctx.lineTo(q.points[2].x, q.points[2].y);
            ctx.lineTo(q.points[3].x, q.points[3].y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });

        // Draw base circle
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
            const a = (i / 80) * Math.PI * 2;
            const bx = cxBase + baseR * Math.cos(a);
            const by = cyBase + baseR * Math.sin(a) * Math.cos(viewTilt);
            if (i === 0) ctx.moveTo(bx, by);
            else ctx.lineTo(bx, by);
        }
        ctx.stroke();

        // Draw context labels
        contexts.forEach(c => {
            const bx = cxBase + (baseR + 25) * Math.cos(c.angle);
            const by = cyBase + (baseR + 25) * Math.sin(c.angle) * Math.cos(viewTilt);
            ctx.fillStyle = c.color;
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(c.label, bx, by);
        });
        ctx.textAlign = 'left';

        // Draw current fiber (highlighted)
        const cf = fiberEndpoints(contextAngle, twist, viewTilt);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cf.topX, cf.topY);
        ctx.lineTo(cf.botX, cf.botY);
        ctx.stroke();

        // Meaning dot on fiber
        const mx = cf.topX + (cf.botX - cf.topX) * meaningPos;
        const my = cf.topY + (cf.botY - cf.topY) * meaningPos;
        ctx.fillStyle = '#ffd54f';
        ctx.shadowColor = '#ffd54f';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(mx, my, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Fiber labels
        ctx.fillStyle = '#aaa';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('meaning +', cf.topX, cf.topY - 8);
        ctx.fillText('meaning −', cf.botX, cf.botY + 14);
        ctx.textAlign = 'left';

        // Draw transport path
        if (transportPath.length > 1) {
            ctx.strokeStyle = 'rgba(76,175,80,0.8)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(transportPath[0].x, transportPath[0].y);
            for (let i = 1; i < transportPath.length; i++) {
                ctx.lineTo(transportPath[i].x, transportPath[i].y);
            }
            ctx.stroke();

            // Start and end dots
            const start = transportPath[0];
            const end = transportPath[transportPath.length - 1];

            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(start.x, start.y, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = twist > 0.5 ? '#ff5252' : '#4caf50';
            ctx.beginPath();
            ctx.arc(end.x, end.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // === RIGHT PANEL ===
        const panelX = 430;
        ctx.fillStyle = 'rgba(20,20,60,0.85)';
        ctx.beginPath();
        ctx.roundRect(panelX, 30, 250, 240, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(100,140,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(panelX, 30, 250, 240, 10);
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillText('Fiber Bundle E → B', panelX + 15, 55);

        ctx.fillStyle = '#aaa';
        ctx.font = '11px Inter, sans-serif';
        const panelLines = [
            { text: 'Base B = S¹ (context space)', color: '#aaa' },
            { text: 'Fiber F = [−1,1] (meaning)', color: '#aaa' },
            { text: '', color: '#aaa' },
            { text: `Twist = ${Math.round(twist * 180)}°`, color: '#ff8a65' },
            { text: twist < 0.1 ? 'Bundle: TRIVIAL (cylinder)' : twist > 0.9 ? 'Bundle: NON-TRIVIAL (Möbius)' : 'Bundle: partially twisted', color: twist < 0.1 ? '#4caf50' : '#ff8a65' },
            { text: '', color: '#aaa' },
            { text: 'Structure group:', color: '#aaa' },
            { text: twist < 0.1 ? '  G = {e} (trivial)' : '  G = ℤ₂ = {+1, −1}', color: '#4fc3f7' },
            { text: '', color: '#aaa' },
            { text: 'Parallel transport around S¹:', color: '#aaa' },
            { text: twist > 0.5 ? '  Holonomy = −1 (FLIP!)' : '  Holonomy = +1 (no flip)', color: twist > 0.5 ? '#ff5252' : '#4caf50' },
            { text: '', color: '#aaa' },
            { text: 'Meaning depends on path', color: '#ffd54f' },
            { text: 'through context, not just', color: '#ffd54f' },
            { text: 'the endpoint.', color: '#ffd54f' },
        ];
        panelLines.forEach((line, i) => {
            ctx.fillStyle = line.color;
            ctx.font = line.text.includes('TRIVIAL') || line.text.includes('NON-TRIVIAL') || line.text.includes('FLIP') ? 'bold 11px Inter, sans-serif' : '11px Inter, sans-serif';
            ctx.fillText(line.text, panelX + 15, 75 + i * 14);
        });

        // Bottom info
        ctx.fillStyle = '#4fc3f7';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('π: E → B    |    Transition functions g_ij: U_i ∩ U_j → G', 15, canvas.height - 15);
    }

    // Parallel transport animation
    document.getElementById('fiber-transport-btn').addEventListener('click', function() {
        if (isTransporting) return;
        isTransporting = true;
        transportPath = [];
        transportT = 0;

        const twist = parseFloat(document.getElementById('fiber-twist').value) / 100;
        const startMeaning = parseFloat(document.getElementById('fiber-meaning').value) / 100;
        const viewTilt = 0.35;

        function transportStep() {
            if (transportT > Math.PI * 2 + 0.05) {
                isTransporting = false;

                // Show result: if twisted, meaning flipped
                if (twist > 0.5) {
                    document.getElementById('fiber-meaning').value = Math.round((1 - startMeaning) * 100);
                }
                draw();
                return;
            }

            const angle = transportT;
            const cf = fiberEndpoints(angle, twist, viewTilt);

            // Parallel transport: meaning position evolves with twist
            const transportedMeaning = startMeaning;
            // The visual position on the fiber accounts for the twist
            const effectiveMeaning = transportedMeaning;
            const mx = cf.topX + (cf.botX - cf.topX) * effectiveMeaning;
            const my = cf.topY + (cf.botY - cf.topY) * effectiveMeaning;

            transportPath.push({ x: mx, y: my });

            document.getElementById('fiber-context').value = Math.round(angle * 100);
            draw();

            transportT += 0.04;
            requestAnimationFrame(transportStep);
        }
        transportStep();
    });

    document.getElementById('fiber-reset-btn').addEventListener('click', function() {
        transportPath = [];
        isTransporting = false;
        document.getElementById('fiber-context').value = 0;
        document.getElementById('fiber-meaning').value = 50;
        draw();
    });

    document.getElementById('fiber-context').addEventListener('input', draw);
    document.getElementById('fiber-twist').addEventListener('input', draw);
    document.getElementById('fiber-meaning').addEventListener('input', draw);

    draw();
}

// ============================================================
// WINDING NUMBER VISUALIZATION — Circular reasoning detection
// ============================================================
function winding_number () {
    const container = document.getElementById('winding-viz');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 520;
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.borderRadius = '12px';
    canvas.style.background = '#0a0a2e';
    canvas.style.cursor = 'crosshair';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = 'text-align:center; margin:15px 0; font-family:"Inter",sans-serif;';
    controlsDiv.innerHTML = `
        <div style="margin-bottom:10px;">
            <label style="color:#ccc;">Mode: </label>
            <select id="winding-mode" style="padding:5px 12px; border-radius:6px; background:#1a1a3e; color:#fff; border:1px solid #444; font-size:14px;">
                <option value="draw">✏️ Draw your own path</option>
                <option value="preset-0">Preset: Non sequitur (n=0)</option>
                <option value="preset-1">Preset: Sound argument (n=1)</option>
                <option value="preset-2">Preset: Circular reasoning (n=2)</option>
                <option value="preset-neg">Preset: Self-defeating (n=−1)</option>
            </select>
            <button id="winding-clear" style="margin-left:15px; padding:6px 16px; background:#ff5252; border:none; border-radius:6px; cursor:pointer; font-weight:600; color:#fff;">Clear</button>
        </div>
        <div style="margin-bottom:8px;">
            <span style="color:#aaa;">Click and drag on the canvas to draw a closed curve around the </span>
            <span style="color:#ffd54f; font-weight:700;">★ thesis</span>
            <span style="color:#aaa;">. Release to close the path.</span>
        </div>
        <div id="winding-result" style="font-size:20px; min-height:35px; color:#fff; font-weight:700;"></div>
        <div id="winding-interpretation" style="font-size:14px; min-height:20px; color:#aaa;"></div>
    `;
    container.appendChild(controlsDiv);

    // State
    let path = [];
    let isDrawing = false;
    let closedPath = [];
    const centerX = 300;
    const centerY = 260;

    // Preset paths
    const presets = {
        'preset-0': function() {
            // Winding number 0: path that doesn't encircle center
            const pts = [];
            for (let i = 0; i <= 100; i++) {
                const t = (i / 100) * Math.PI * 2;
                pts.push({
                    x: centerX + 200 + 80 * Math.cos(t),
                    y: centerY + 60 * Math.sin(t)
                });
            }
            return pts;
        },
        'preset-1': function() {
            // Winding number 1: single loop around center
            const pts = [];
            for (let i = 0; i <= 100; i++) {
                const t = (i / 100) * Math.PI * 2;
                const r = 120 + 30 * Math.sin(3 * t);
                pts.push({
                    x: centerX + r * Math.cos(t),
                    y: centerY + r * Math.sin(t)
                });
            }
            return pts;
        },
        'preset-2': function() {
            // Winding number 2: double loop
            const pts = [];
            for (let i = 0; i <= 200; i++) {
                const t = (i / 100) * Math.PI * 2;
                const r = 110 + 25 * Math.sin(5 * t);
                pts.push({
                    x: centerX + r * Math.cos(t),
                    y: centerY + r * Math.sin(t)
                });
            }
            return pts;
        },
        'preset-neg': function() {
            // Winding number -1: clockwise loop
            const pts = [];
            for (let i = 0; i <= 100; i++) {
                const t = -(i / 100) * Math.PI * 2;
                const r = 120 + 20 * Math.cos(4 * t);
                pts.push({
                    x: centerX + r * Math.cos(t),
                    y: centerY + r * Math.sin(t)
                });
            }
            return pts;
        }
    };

    function computeWindingNumber(pts, px, py) {
        if (pts.length < 3) return 0;

        let totalAngle = 0;
        for (let i = 0; i < pts.length - 1; i++) {
            const ax = pts[i].x - px;
            const ay = pts[i].y - py;
            const bx = pts[i + 1].x - px;
            const by = pts[i + 1].y - py;

            // Angle between consecutive vectors
            const cross = ax * by - ay * bx;
            const dot = ax * bx + ay * by;
            let angle = Math.atan2(cross, dot);
            totalAngle += angle;
        }

        return totalAngle / (2 * Math.PI);
    }

    function getInterpretation(n) {
        const rounded = Math.round(n);
        if (Math.abs(n) < 0.3) {
            return {
                text: `Winding number ≈ 0`,
                interp: 'NON SEQUITUR — The argument never engages with the thesis. It wanders without addressing the central claim.',
                color: '#888'
            };
        } else if (Math.abs(rounded) === 1 && rounded > 0) {
            return {
                text: `Winding number ≈ +1`,
                interp: 'SOUND ARGUMENT — One complete, coherent circuit around the thesis. Engages from all angles.',
                color: '#4caf50'
            };
        } else if (Math.abs(rounded) === 1 && rounded < 0) {
            return {
                text: `Winding number ≈ −1`,
                interp: 'SELF-DEFEATING — The argument circles the thesis in reverse, undermining its own conclusion.',
                color: '#ff9800'
            };
        } else if (Math.abs(rounded) >= 2) {
            return {
                text: `Winding number ≈ ${rounded}`,
                interp: `CIRCULAR REASONING — The argument passes through the same premises ${Math.abs(rounded)} times, assuming what it tries to prove.`,
                color: '#ff5252'
            };
        } else {
            return {
                text: `Winding number ≈ ${n.toFixed(2)}`,
                interp: 'Path not yet closed. Keep drawing to complete the argument.',
                color: '#4fc3f7'
            };
        }
    }

    function drawAngleVisualization(pts) {
        // Draw angle accumulation arc near center
        if (pts.length < 3) return;

        const wn = computeWindingNumber(pts, centerX, centerY);
        const totalAngle = wn * Math.PI * 2;

        // Draw accumulated angle as a spiral arc
        ctx.strokeStyle = 'rgba(255,213,79,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const arcR = 25;
        const arcSteps = Math.abs(Math.round(totalAngle / 0.05));
        for (let i = 0; i <= arcSteps; i++) {
            const a = (i / arcSteps) * totalAngle;
            const r = arcR + (i / arcSteps) * 8;
            const ax = centerX + r * Math.cos(a - Math.PI / 2);
            const ay = centerY + r * Math.sin(a - Math.PI / 2);
            if (i === 0) ctx.moveTo(ax, ay);
            else ctx.lineTo(ax, ay);
        }
        ctx.stroke();

        // Angle label
        ctx.fillStyle = '#ffd54f';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Σθ = ${(wn * 360).toFixed(0)}°`, centerX, centerY + 45);
        ctx.fillText(`= ${wn.toFixed(2)} × 2π`, centerX, centerY + 60);
        ctx.textAlign = 'left';
    }

    function drawScene() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background grid
        ctx.strokeStyle = 'rgba(100,140,255,0.06)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < canvas.width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 40) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }

        // Concentric guide circles
        [60, 120, 180].forEach(r => {
            ctx.strokeStyle = 'rgba(100,140,255,0.08)';
            ctx.lineWidth = 0.5;
            ctx.setLineDash([4, 8]);
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // Central thesis point
        ctx.fillStyle = '#ffd54f';
        ctx.shadowColor = '#ffd54f';
        ctx.shadowBlur = 20;
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', centerX, centerY + 8);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffd54f';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText('THESIS', centerX, centerY - 18);
        ctx.textAlign = 'left';

        // Draw the path
        const activePath = closedPath.length > 0 ? closedPath : path;

        if (activePath.length > 1) {
            // Draw path with gradient coloring
            for (let i = 0; i < activePath.length - 1; i++) {
                const progress = i / activePath.length;
                const hue = progress * 280; // purple to red

                ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.85)`;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                ctx.moveTo(activePath[i].x, activePath[i].y);
                ctx.lineTo(activePath[i + 1].x, activePath[i + 1].y);
                ctx.stroke();
            }

            // Start point
            ctx.fillStyle = '#4caf50';
            ctx.shadowColor = '#4caf50';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(activePath[0].x, activePath[0].y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.font = '10px Inter, sans-serif';
            ctx.fillText('START', activePath[0].x + 10, activePath[0].y - 8);

            // End point
            const last = activePath[activePath.length - 1];
            ctx.fillStyle = '#ff5252';
            ctx.shadowColor = '#ff5252';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw connecting lines from path to center (angle visualization)
            if (activePath.length > 5) {
                const step = Math.max(1, Math.floor(activePath.length / 30));
                for (let i = 0; i < activePath.length; i += step) {
                    ctx.strokeStyle = 'rgba(255,213,79,0.08)';
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(activePath[i].x, activePath[i].y);
                    ctx.stroke();
                }
            }

            // Angle accumulation visualization
            drawAngleVisualization(activePath);

            // Compute and display winding number
            const wn = computeWindingNumber(activePath, centerX, centerY);
            const result = getInterpretation(wn);

            document.getElementById('winding-result').style.color = result.color;
            document.getElementById('winding-result').textContent = result.text;
            document.getElementById('winding-interpretation').textContent = result.interp;
        } else {
            document.getElementById('winding-result').textContent = '';
            document.getElementById('winding-interpretation').textContent = 'Draw a closed curve or select a preset.';
        }

        // === RIGHT PANEL: Formula ===
        const panelX = 480;
        ctx.fillStyle = 'rgba(20,20,60,0.9)';
        ctx.beginPath();
        ctx.roundRect(panelX, 30, 205, 200, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(100,140,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(panelX, 30, 205, 200, 10);
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillText('Winding Number', panelX + 15, 55);

        const formulaLines = [
            { text: 'n(γ,p) = (1/2π) ∮ dθ', color: '#4fc3f7' },
            { text: '', color: '#aaa' },
            { text: 'n = 0  → Non sequitur', color: '#888' },
            { text: 'n = 1  → Sound argument', color: '#4caf50' },
            { text: 'n = −1 → Self-defeating', color: '#ff9800' },
            { text: 'n ≥ 2  → Circular reasoning', color: '#ff5252' },
            { text: '', color: '#aaa' },
            { text: 'π₁(ℝ²\\{p}) ≅ ℤ', color: '#aaa' },
            { text: 'Winding # is the complete', color: '#aaa' },
            { text: 'invariant of this group.', color: '#aaa' },
        ];
        formulaLines.forEach((line, i) => {
            ctx.fillStyle = line.color;
            ctx.font = line.text.includes('π₁') || line.text.includes('∮') ? '12px "Courier New", monospace' : '11px Inter, sans-serif';
            ctx.fillText(line.text, panelX + 15, 75 + i * 15);
        });
    }

    // Mouse drawing
    canvas.addEventListener('mousedown', function(e) {
        const mode = document.getElementById('winding-mode').value;
        if (mode !== 'draw') return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        isDrawing = true;
        path = [{ x, y }];
        closedPath = [];
        drawScene();
    });

    canvas.addEventListener('mousemove', function(e) {
        if (!isDrawing) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Only add point if moved enough
        const last = path[path.length - 1];
        const dx = x - last.x;
        const dy = y - last.y;
        if (dx * dx + dy * dy > 16) {
            path.push({ x, y });
            drawScene();
        }
    });

    canvas.addEventListener('mouseup', function() {
        if (!isDrawing) return;
        isDrawing = false;

        // Close the path
        if (path.length > 5) {
            closedPath = [...path, path[0]];
        }
        drawScene();
    });

    canvas.addEventListener('mouseleave', function() {
        if (isDrawing) {
            isDrawing = false;
            if (path.length > 5) {
                closedPath = [...path, path[0]];
            }
            drawScene();
        }
    });

    // Touch support
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        const mode = document.getElementById('winding-mode').value;
        if (mode !== 'draw') return;

        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        isDrawing = true;
        path = [{ x, y }];
        closedPath = [];
        drawScene();
    });

    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (!isDrawing) return;

        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const last = path[path.length - 1];
        const dx = x - last.x;
        const dy = y - last.y;
        if (dx * dx + dy * dy > 16) {
            path.push({ x, y });
            drawScene();
        }
    });

    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        if (!isDrawing) return;
        isDrawing = false;
        if (path.length > 5) {
            closedPath = [...path, path[0]];
        }
        drawScene();
    });

    // Mode change
    document.getElementById('winding-mode').addEventListener('change', function() {
        const mode = this.value;
        if (mode === 'draw') {
            path = [];
            closedPath = [];
            canvas.style.cursor = 'crosshair';
        } else if (presets[mode]) {
            closedPath = presets[mode]();
            path = [];
            canvas.style.cursor = 'default';
        }
        drawScene();
    });

    // Clear
    document.getElementById('winding-clear').addEventListener('click', function() {
        path = [];
        closedPath = [];
        document.getElementById('winding-mode').value = 'draw';
        canvas.style.cursor = 'crosshair';
        drawScene();
    });

    drawScene();
}

// ============================================================
// TOKEN EMBEDDING TOPOLOGY — Vietoris-Rips on simulated embeddings
// ============================================================
function embedding_topology() {
    const container = document.getElementById('token-topology-viz');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 520;
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.borderRadius = '12px';
    canvas.style.background = '#0a0a2e';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // Barcode canvas
    const barcodeCanvas = document.createElement('canvas');
    barcodeCanvas.width = 700;
    barcodeCanvas.height = 180;
    barcodeCanvas.style.display = 'block';
    barcodeCanvas.style.margin = '10px auto 0';
    barcodeCanvas.style.borderRadius = '8px';
    barcodeCanvas.style.background = '#0d0d30';
    container.appendChild(barcodeCanvas);

    const bctx = barcodeCanvas.getContext('2d');

    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = 'text-align:center; margin:15px 0; font-family:"Inter",sans-serif;';
    controlsDiv.innerHTML = `
        <div style="margin-bottom:10px;">
            <label style="color:#ccc;">Scale ε: </label>
            <input type="range" id="vr-epsilon" min="0" max="200" value="0" style="width:280px; vertical-align:middle;">
            <span id="vr-epsilon-val" style="color:#4fc3f7; margin-left:8px; font-weight:600;">ε = 0.00</span>
        </div>
        <div style="margin-bottom:10px;">
            <label style="color:#ccc;">Token set: </label>
            <select id="vr-dataset" style="padding:5px 12px; border-radius:6px; background:#1a1a3e; color:#fff; border:1px solid #444; font-size:14px;">
                <option value="days">Days of the week (cyclic → β₁=1)</option>
                <option value="numbers">Numbers 0-9 (line → β₁=0)</option>
                <option value="emotions">Emotion words (cluster structure)</option>
                <option value="code">Code tokens vs. English (two components)</option>
            </select>
            <button id="vr-animate-btn" style="margin-left:12px; padding:6px 16px; background:#4fc3f7; border:none; border-radius:6px; cursor:pointer; font-weight:600;">▶ Sweep ε</button>
        </div>
        <div style="display:flex; justify-content:center; gap:30px; margin-top:5px;">
            <span id="vr-b0" style="color:#4fc3f7; font-weight:700; font-size:16px;">β₀ = 0</span>
            <span id="vr-b1" style="color:#ff8a65; font-weight:700; font-size:16px;">β₁ = 0</span>
            <span id="vr-b2" style="color:#ce93d8; font-weight:700; font-size:16px;">β₂ = 0</span>
        </div>
    `;
    container.appendChild(controlsDiv);

    // Simulated 2D projections of token embeddings
    const datasets = {
        days: {
            points: (function() {
                const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
                const pts = [];
                for (let i = 0; i < 7; i++) {
                    const angle = (i / 7) * Math.PI * 2 - Math.PI / 2;
                    const r = 110 + (Math.random() - 0.5) * 15;
                    pts.push({
                        x: 280 + r * Math.cos(angle),
                        y: 250 + r * Math.sin(angle),
                        label: days[i],
                        color: `hsl(${(i/7)*360}, 70%, 60%)`
                    });
                }
                return pts;
            })(),
            description: 'Days form a cycle in embedding space'
        },
        numbers: {
            points: (function() {
                const pts = [];
                for (let i = 0; i <= 9; i++) {
                    pts.push({
                        x: 120 + i * 38 + (Math.random() - 0.5) * 10,
                        y: 250 + (Math.random() - 0.5) * 25 + Math.sin(i * 0.5) * 20,
                        label: String(i),
                        color: `hsl(${(i/10)*120 + 200}, 70%, 60%)`
                    });
                }
                return pts;
            })(),
            description: 'Numbers form a roughly linear manifold'
        },
        emotions: {
            points: (function() {
                const clusters = [
                    { words: ['happy','joyful','elated','cheerful'], cx: 150, cy: 160, color: '#4caf50' },
                    { words: ['sad','gloomy','depressed','melancholy'], cx: 380, cy: 160, color: '#2196f3' },
                    { words: ['angry','furious','enraged','irate'], cx: 150, cy: 350, color: '#f44336' },
                    { words: ['calm','serene','peaceful','tranquil'], cx: 380, cy: 350, color: '#9c27b0' },
                ];
                const pts = [];
                clusters.forEach(cl => {
                    cl.words.forEach((w, i) => {
                        const angle = (i / cl.words.length) * Math.PI * 2;
                        const r = 25 + Math.random() * 15;
                        pts.push({
                            x: cl.cx + r * Math.cos(angle),
                            y: cl.cy + r * Math.sin(angle),
                            label: w,
                            color: cl.color
                        });
                    });
                });
                return pts;
            })(),
            description: 'Emotions cluster by valence and arousal'
        },
        code: {
            points: (function() {
                const pts = [];
                // English cluster
                const eng = ['the','and','but','with','from','that','this','have'];
                eng.forEach((w, i) => {
                    const angle = (i / eng.length) * Math.PI * 2;
                    const r = 40 + Math.random() * 20;
                    pts.push({
                        x: 180 + r * Math.cos(angle),
                        y: 250 + r * Math.sin(angle),
                        label: w,
                        color: '#4fc3f7'
                    });
                });
                // Code cluster
                const code = ['def','class','import','return','if','for','while','print'];
                code.forEach((w, i) => {
                    const angle = (i / code.length) * Math.PI * 2;
                    const r = 40 + Math.random() * 20;
                    pts.push({
                        x: 420 + r * Math.cos(angle),
                        y: 250 + r * Math.sin(angle),
                        label: w,
                        color: '#ff8a65'
                    });
                });
                return pts;
            })(),
            description: 'Code and English tokens form separate components'
        }
    };

    let animating = false;
    let persistenceData = []; // { dim, birth, death }

    function dist(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    function computeTopology(points, epsilon) {
        const n = points.length;

        // Build adjacency (edges within epsilon)
        let edges = [];
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (dist(points[i], points[j]) <= epsilon) {
                    edges.push([i, j]);
                }
            }
        }

        // Build triangles (3-cliques)
        let triangles = [];
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (dist(points[i], points[j]) > epsilon) continue;
                for (let k = j + 1; k < n; k++) {
                    if (dist(points[i], points[k]) <= epsilon && dist(points[j], points[k]) <= epsilon) {
                        triangles.push([i, j, k]);
                    }
                }
            }
        }

        // β₀: connected components via union-find
        let parent = Array.from({ length: n }, (_, i) => i);
        function find(x) {
            while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
            return x;
        }
        function union(a, b) {
            const ra = find(a), rb = find(b);
            if (ra !== rb) parent[ra] = rb;
        }
        edges.forEach(([a, b]) => union(a, b));
        const components = new Set();
        for (let i = 0; i < n; i++) components.add(find(i));
        const beta0 = components.size;

        // β₁ ≈ E - V + C - T (Euler characteristic approximation)
        // For simplicial complex: χ = V - E + F, and χ = β₀ - β₁ + β₂
        // Approximate β₁ = edges.length - (n - beta0) - triangles.length
        // (n - beta0) = edges in spanning forest
        const beta1 = Math.max(0, edges.length - (n - beta0) - triangles.length);

        // β₂ approximation (very rough — count enclosed tetrahedra)
        let tetra = 0;
        for (let i = 0; i < n; i++) {
            for (let j = i+1; j < n; j++) {
                if (dist(points[i],points[j]) > epsilon) continue;
                for (let k = j+1; k < n; k++) {
                    if (dist(points[i],points[k]) > epsilon || dist(points[j],points[k]) > epsilon) continue;
                    for (let l = k+1; l < n; l++) {
                        if (dist(points[i],points[l]) <= epsilon && dist(points[j],points[l]) <= epsilon && dist(points[k],points[l]) <= epsilon) {
                            tetra++;
                        }
                    }
                }
            }
        }
        const beta2 = Math.max(0, triangles.length - 3 * tetra - edges.length + (n - beta0) + beta1);

        return { beta0, beta1, beta2: Math.max(0, Math.min(beta2, 3)), edges, triangles };
    }

    function computePersistence(points) {
        // Sweep epsilon and record birth/death of features
        const maxDist = 400;
        const steps = 100;
        const data = [];

        let prevBetti = { beta0: points.length, beta1: 0, beta2: 0 };

        // Track β₀ deaths (component merges)
        let b0Births = Array.from({ length: points.length }, () => 0);
        let b0Active = points.length;

        // Track β₁
        let b1Features = [];

        for (let s = 0; s <= steps; s++) {
            const eps = (s / steps) * maxDist;
            const topo = computeTopology(points, eps);

            // β₀ deaths
            if (topo.beta0 < prevBetti.beta0) {
                const deaths = prevBetti.beta0 - topo.beta0;
                for (let d = 0; d < deaths; d++) {
                    data.push({ dim: 0, birth: 0, death: eps });
                }
            }

            // β₁ births/deaths
            if (topo.beta1 > prevBetti.beta1) {
                const births = topo.beta1 - prevBetti.beta1;
                for (let b = 0; b < births; b++) {
                    b1Features.push({ birth: eps });
                }
            } else if (topo.beta1 < prevBetti.beta1) {
                const deaths = prevBetti.beta1 - topo.beta1;
                for (let d = 0; d < deaths && b1Features.length > 0; d++) {
                    const feat = b1Features.pop();
                    data.push({ dim: 1, birth: feat.birth, death: eps });
                }
            }

            prevBetti = topo;
        }

        // Add surviving features
        b1Features.forEach(f => {
            data.push({ dim: 1, birth: f.birth, death: maxDist });
        });

        // Add one β₀ feature that survives (the last component)
        data.push({ dim: 0, birth: 0, death: maxDist });

        return data;
    }

    function drawBarcode(epsilon, maxDist) {
        bctx.clearRect(0, 0, 700, 180);

        const pad = { left: 80, right: 20, top: 30, bottom: 20 };
        const w = 700 - pad.left - pad.right;
        const h = 180 - pad.top - pad.bottom;

        // Title
        bctx.fillStyle = '#fff';
        bctx.font = 'bold 12px Inter, sans-serif';
        bctx.fillText('Persistence Barcode', pad.left, 18);

        // Axis
        bctx.strokeStyle = 'rgba(255,255,255,0.3)';
        bctx.lineWidth = 1;
        bctx.beginPath();
        bctx.moveTo(pad.left, pad.top);
        bctx.lineTo(pad.left, pad.top + h);
        bctx.lineTo(pad.left + w, pad.top + h);
        bctx.stroke();

        // Epsilon marker
        const epsX = pad.left + (epsilon / maxDist) * w;
        bctx.strokeStyle = 'rgba(255,255,255,0.5)';
        bctx.setLineDash([4, 4]);
        bctx.beginPath();
        bctx.moveTo(epsX, pad.top);
        bctx.lineTo(epsX, pad.top + h);
        bctx.stroke();
        bctx.setLineDash([]);
        bctx.fillStyle = '#fff';
        bctx.font = '10px Inter, sans-serif';
        bctx.textAlign = 'center';
        bctx.fillText('current ε', epsX, pad.top - 5);
        bctx.textAlign = 'left';

        // Axis labels
        bctx.fillStyle = '#888';
        bctx.font = '10px Inter, sans-serif';
        for (let i = 0; i <= 5; i++) {
            const x = pad.left + (i / 5) * w;
            const val = (i / 5) * maxDist;
            bctx.textAlign = 'center';
            bctx.fillText(val.toFixed(0), x, pad.top + h + 14);
            bctx.textAlign = 'left';
        }
        bctx.fillStyle = '#aaa';
        bctx.font = '10px Inter, sans-serif';
        bctx.textAlign = 'center';
        bctx.fillText('ε (scale)', pad.left + w / 2, pad.top + h + 28);
        bctx.textAlign = 'left';

        // Draw bars
        const dim0 = persistenceData.filter(d => d.dim === 0);
        const dim1 = persistenceData.filter(d => d.dim === 1);

        const barH = 4;
        const gap = 2;
        let yOff = pad.top + 5;

        // Labels
        bctx.fillStyle = '#4fc3f7';
        bctx.font = '10px Inter, sans-serif';
        bctx.fillText('H₀', pad.left - 22, yOff + dim0.length * (barH + gap) / 2 + 3);

        dim0.forEach((bar, i) => {
            const x1 = pad.left + (bar.birth / maxDist) * w;
            const x2 = pad.left + (Math.min(bar.death, maxDist) / maxDist) * w;
            const y = yOff + i * (barH + gap);

            const alive = epsilon >= bar.birth && epsilon < bar.death;
            bctx.fillStyle = alive ? '#4fc3f7' : 'rgba(79,195,247,0.25)';
            bctx.fillRect(x1, y, Math.max(2, x2 - x1), barH);
        });

        yOff += dim0.length * (barH + gap) + 10;

        bctx.fillStyle = '#ff8a65';
        bctx.font = '10px Inter, sans-serif';
        bctx.fillText('H₁', pad.left - 22, yOff + dim1.length * (barH + gap) / 2 + 3);

        dim1.forEach((bar, i) => {
            const x1 = pad.left + (bar.birth / maxDist) * w;
            const x2 = pad.left + (Math.min(bar.death, maxDist) / maxDist) * w;
            const y = yOff + i * (barH + gap);

            const alive = epsilon >= bar.birth && epsilon < bar.death;
            bctx.fillStyle = alive ? '#ff8a65' : 'rgba(255,138,101,0.25)';
            bctx.fillRect(x1, y, Math.max(2, x2 - x1), barH);
        });
    }

    function draw() {
        const epsilon = parseFloat(document.getElementById('vr-epsilon').value) * 2;
        const datasetKey = document.getElementById('vr-dataset').value;
        const dataset = datasets[datasetKey];
        const points = dataset.points;

        document.getElementById('vr-epsilon-val').textContent = `ε = ${epsilon.toFixed(0)}`;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Compute topology
        const topo = computeTopology(points, epsilon);

        // Update Betti displays
        document.getElementById('vr-b0').textContent = `β₀ = ${topo.beta0}`;
        document.getElementById('vr-b1').textContent = `β₁ = ${topo.beta1}`;
        document.getElementById('vr-b2').textContent = `β₂ = ${topo.beta2}`;

        // Draw epsilon balls (faded)
        points.forEach(p => {
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, epsilon / 2);
            gradient.addColorStop(0, 'rgba(79,195,247,0.06)');
            gradient.addColorStop(1, 'rgba(79,195,247,0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, epsilon / 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw triangles (filled)
        topo.triangles.forEach(([i, j, k]) => {
            ctx.fillStyle = 'rgba(206,147,216,0.15)';
            ctx.strokeStyle = 'rgba(206,147,216,0.3)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.lineTo(points[k].x, points[k].y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });

        // Draw edges
        topo.edges.forEach(([i, j]) => {
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
        });

        // Draw points
        points.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#fff';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(p.label, p.x, p.y - 10);
        });
        ctx.textAlign = 'left';

        // Info panel
        ctx.fillStyle = 'rgba(20,20,60,0.9)';
        ctx.beginPath();
        ctx.roundRect(500, 20, 185, 160, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(100,140,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(500, 20, 185, 160, 10);
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText('Vietoris-Rips Complex', 515, 40);

        ctx.fillStyle = '#aaa';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(`Vertices: ${points.length}`, 515, 60);
        ctx.fillText(`Edges: ${topo.edges.length}`, 515, 76);
        ctx.fillText(`Triangles: ${topo.triangles.length}`, 515, 92);

        ctx.fillStyle = '#4fc3f7';
        ctx.fillText(`χ = ${points.length} − ${topo.edges.length} + ${topo.triangles.length}`, 515, 115);
        ctx.fillText(`  = ${points.length - topo.edges.length + topo.triangles.length}`, 515, 130);

        ctx.fillStyle = '#ffd54f';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(dataset.description, 515, 155);

        // Draw barcode
        drawBarcode(epsilon, 400);
    }

    // Recompute persistence when dataset changes
    function recomputePersistence() {
        const datasetKey = document.getElementById('vr-dataset').value;
        persistenceData = computePersistence(datasets[datasetKey].points);
        draw();
    }

    document.getElementById('vr-epsilon').addEventListener('input', draw);
    document.getElementById('vr-dataset').addEventListener('change', recomputePersistence);

    // Animate sweep
    document.getElementById('vr-animate-btn').addEventListener('click', function() {
        if (animating) { animating = false; this.textContent = '▶ Sweep ε'; return; }
        animating = true;
        this.textContent = '⏸ Pause';
        let val = 0;

        function step() {
            if (!animating || val > 200) {
                animating = false;
                document.getElementById('vr-animate-btn').textContent = '▶ Sweep ε';
                return;
            }
            document.getElementById('vr-epsilon').value = val;
            draw();
            val += 1;
            requestAnimationFrame(step);
        }
        step();
    });

    recomputePersistence();
}

// ============================================================
// LLM FIBER BUNDLE VISUALIZATION — The Bristle Brush of Meaning
// ============================================================

var _llmFB = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    tokens: [],
    processed: false,
    attentionWeights: [],  // [i][j] = weight from j to i
    layer: 0,
    featureMode: 'none',
    sliceHeight: 0.5,
    hoveredToken: -1,
    rotY: 0,
    dragging: false,
    lastMouseX: 0,
    // Simulated per-token data
    tokenData: [],
    // Animation state
    processAnim: { active: false, progress: 0, startTime: 0 }
};

// Simulated feature values for common words
var _llmFBFeatures = {
    sentiment: {
        'the': 0.0, 'a': 0.0, 'an': 0.0, 'is': 0.0, 'was': -0.05, 'by': 0.0,
        'bank': 0.1, 'river': 0.3, 'money': 0.2, 'closed': -0.4, 'happy': 0.9,
        'sad': -0.8, 'good': 0.7, 'bad': -0.7, 'love': 0.85, 'hate': -0.85,
        'beautiful': 0.8, 'ugly': -0.7, 'great': 0.75, 'terrible': -0.8,
        'deposit': 0.15, 'run': 0.1, 'program': 0.05, 'sat': 0.0,
        'i': 0.0, 'he': 0.0, 'she': 0.0, 'it': 0.0, 'they': 0.0,
        'went': 0.0, 'to': 0.0, 'on': 0.0, 'in': 0.0, 'at': 0.0,
        'morning': 0.2, 'night': -0.1, 'sun': 0.4, 'rain': -0.2,
        'cat': 0.3, 'dog': 0.3, 'fish': 0.1, 'tree': 0.2
    },
    tense: {
        'the': 0.0, 'a': 0.0, 'an': 0.0, 'is': 0.5, 'was': -0.7, 'by': 0.0,
        'bank': 0.0, 'river': 0.0, 'money': 0.0, 'closed': -0.6, 'happy': 0.0,
        'sad': 0.0, 'will': 0.8, 'would': 0.3, 'had': -0.8, 'has': 0.4,
        'went': -0.7, 'go': 0.5, 'going': 0.6, 'gone': -0.5,
        'sat': -0.7, 'sit': 0.5, 'sitting': 0.6, 'run': 0.5, 'ran': -0.7,
        'deposit': 0.3, 'deposited': -0.6, 'program': 0.0,
        'i': 0.0, 'he': 0.0, 'she': 0.0, 'it': 0.0, 'they': 0.0,
        'to': 0.0, 'on': 0.0, 'in': 0.0, 'at': 0.0,
        'morning': 0.0, 'night': 0.0, 'today': 0.5, 'yesterday': -0.7
    },
    concreteness: {
        'the': 0.0, 'a': 0.0, 'an': 0.0, 'is': -0.3, 'was': -0.3, 'by': -0.1,
        'bank': 0.7, 'river': 0.9, 'money': 0.8, 'closed': 0.3, 'happy': -0.5,
        'sad': -0.5, 'cat': 0.95, 'dog': 0.95, 'tree': 0.9, 'rock': 0.95,
        'love': -0.6, 'hate': -0.6, 'idea': -0.8, 'thought': -0.7,
        'table': 0.95, 'chair': 0.95, 'sun': 0.85, 'rain': 0.7,
        'run': 0.4, 'program': 0.3, 'deposit': 0.5, 'sat': 0.4,
        'i': 0.2, 'he': 0.2, 'she': 0.2, 'it': 0.1, 'they': 0.1,
        'went': 0.3, 'to': -0.1, 'on': 0.0, 'in': 0.0, 'at': 0.0
    },
    animacy: {
        'the': 0.0, 'a': 0.0, 'an': 0.0, 'is': 0.0, 'was': 0.0, 'by': 0.0,
        'bank': -0.8, 'river': -0.3, 'money': -0.9, 'closed': 0.0,
        'cat': 0.9, 'dog': 0.9, 'fish': 0.7, 'bird': 0.85, 'tree': -0.5,
        'person': 0.95, 'man': 0.95, 'woman': 0.95, 'child': 0.95,
        'i': 0.95, 'he': 0.95, 'she': 0.95, 'it': -0.2, 'they': 0.7,
        'rock': -0.95, 'table': -0.9, 'chair': -0.9, 'sun': -0.6,
        'happy': 0.0, 'sad': 0.0, 'run': 0.0, 'program': -0.7,
        'went': 0.0, 'to': 0.0, 'on': 0.0, 'sat': 0.0, 'deposit': 0.0
    }
};

// Semantic similarity groups for attention simulation
var _llmFBSemanticGroups = {
    'financial': ['bank', 'money', 'deposit', 'closed', 'account', 'loan', 'credit', 'savings'],
    'nature': ['river', 'bank', 'tree', 'sun', 'rain', 'fish', 'bird', 'water', 'lake', 'mountain'],
    'person': ['i', 'he', 'she', 'they', 'person', 'man', 'woman', 'child', 'we', 'you'],
    'action': ['went', 'sat', 'run', 'go', 'walk', 'deposit', 'closed', 'open'],
    'animal': ['cat', 'dog', 'fish', 'bird'],
    'emotion': ['happy', 'sad', 'love', 'hate', 'great', 'terrible', 'beautiful', 'good', 'bad'],
    'time': ['morning', 'night', 'today', 'yesterday', 'was', 'is', 'will'],
    'spatial': ['by', 'on', 'in', 'at', 'to', 'from', 'near']
};

function getSemanticSimilarity(wordA, wordB) {
    wordA = wordA.toLowerCase();
    wordB = wordB.toLowerCase();
    if (wordA === wordB) return 1.0;

    var sharedGroups = 0;
    var totalGroups = 0;
    var keys = Object.keys(_llmFBSemanticGroups);
    for (var k = 0; k < keys.length; k++) {
        var group = _llmFBSemanticGroups[keys[k]];
        var hasA = group.indexOf(wordA) >= 0;
        var hasB = group.indexOf(wordB) >= 0;
        if (hasA || hasB) totalGroups++;
        if (hasA && hasB) sharedGroups++;
    }
    if (totalGroups === 0) return 0.05;
    return 0.1 + 0.6 * (sharedGroups / totalGroups);
}

function getFeatureValue(word, feature) {
    word = word.toLowerCase();
    var featureMap = _llmFBFeatures[feature];
    if (!featureMap) return 0;
    if (featureMap[word] !== undefined) return featureMap[word];
    return (Math.sin(word.charCodeAt(0) * 0.7 + word.length * 1.3) * 0.3);
}

function generateSimulatedEmbedding(word, layer) {
    // Generate a pseudo-random but deterministic embedding vector (8 visible dims)
    var dims = 8;
    var vec = [];
    var seed = 0;
    for (var c = 0; c < word.length; c++) seed += word.charCodeAt(c) * (c + 1);

    for (var d = 0; d < dims; d++) {
        var val = Math.sin(seed * 0.127 + d * 2.367) * 0.5 +
                  Math.cos(seed * 0.089 + d * 1.789) * 0.3;
        // Layer evolution: vectors become more structured at deeper layers
        val += layer * 0.02 * Math.sin(d * 0.5 + seed * 0.03);
        vec.push(val);
    }
    return vec;
}

function initLLMFiberBundle() {
    var canvas = document.getElementById('canvas-llm-fiber-bundle');
    if (!canvas) return;

    var fb = _llmFB;
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    fb.canvas = canvas;
    fb.ctx = canvas.getContext('2d');
    fb.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    fb.width = rect.width;
    fb.height = rect.height;

    // Parse initial sentence
    parseLLMFBSentence();

    // Mouse interaction for hover + drag
    canvas.addEventListener('mousemove', function(e) {
        var rect = canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        if (fb.dragging) {
            var dx = e.clientX - fb.lastMouseX;
            fb.rotY += dx * 0.005;
            fb.lastMouseX = e.clientX;
            renderLLMFiberBundle();
            return;
        }

        // Check hover over tokens
        var hoverDetail = document.getElementById('llm-fb-hover-detail');
        if (hoverDetail && !hoverDetail.checked) { fb.hoveredToken = -1; renderLLMFiberBundle(); return; }

        var oldHover = fb.hoveredToken;
        fb.hoveredToken = -1;
        for (var i = 0; i < fb.tokenData.length; i++) {
            var td = fb.tokenData[i];
            if (td && td.pillarX !== undefined) {
                var dx2 = mx - td.pillarX;
                var dy2 = my - td.baseY;
                if (Math.abs(dx2) < td.pillarWidth / 2 + 10 && dy2 < 10 && dy2 > -(td.pillarHeight + 20)) {
                    fb.hoveredToken = i;
                    break;
                }
            }
        }
        if (fb.hoveredToken !== oldHover) renderLLMFiberBundle();
    });

    canvas.addEventListener('mousedown', function(e) {
        fb.dragging = true;
        fb.lastMouseX = e.clientX;
        canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mouseup', function() {
        fb.dragging = false;
        if (fb.canvas) fb.canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mouseleave', function() {
        if (fb.hoveredToken !== -1) {
            fb.hoveredToken = -1;
            renderLLMFiberBundle();
        }
    });

    // Slider: layer
    var layerSlider = document.getElementById('llm-fb-layer');
    var layerVal = document.getElementById('llm-fb-layer-val');
    if (layerSlider) {
        layerSlider.addEventListener('input', function() {
            fb.layer = parseInt(layerSlider.value);
            var labels = ['Layer 0 (Embedding)', 'Layer 1', 'Layer 2', 'Layer 3', 'Layer 4',
                          'Layer 5', 'Layer 6 (Mid)', 'Layer 7', 'Layer 8', 'Layer 9',
                          'Layer 10', 'Layer 11', 'Layer 12 (Output)'];
            if (layerVal) layerVal.textContent = labels[fb.layer] || ('Layer ' + fb.layer);
            updateLLMFBTokenData();
            renderLLMFiberBundle();
        });
    }

    // Feature selector
    var featureSelect = document.getElementById('llm-fb-feature');
    if (featureSelect) {
        featureSelect.addEventListener('change', function() {
            fb.featureMode = featureSelect.value;
            renderLLMFiberBundle();
        });
    }

    // Slice height
    var sliceSlider = document.getElementById('llm-fb-slice-height');
    var sliceVal = document.getElementById('llm-fb-slice-height-val');
    if (sliceSlider) {
        sliceSlider.addEventListener('input', function() {
            fb.sliceHeight = parseInt(sliceSlider.value) / 100;
            if (sliceVal) sliceVal.textContent = sliceSlider.value + '%';
            renderLLMFiberBundle();
        });
    }

    // Show attention checkbox
    var showAttn = document.getElementById('llm-fb-show-attention');
    if (showAttn) {
        showAttn.addEventListener('change', function() { renderLLMFiberBundle(); });
    }

    // Enter key on input
    var input = document.getElementById('llm-fb-sentence');
    if (input) {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') processLLMFiberBundle();
        });
        input.addEventListener('input', function() {
            fb.processed = false;
            parseLLMFBSentence();
            renderLLMFiberBundle();
        });
    }

    renderLLMFiberBundle();
}

function parseLLMFBSentence() {
    var fb = _llmFB;
    var input = document.getElementById('llm-fb-sentence');
    if (!input) return;

    var text = input.value.trim();
    fb.tokens = text.split(/\s+/).filter(function(t) { return t.length > 0; });
    fb.processed = false;
    fb.attentionWeights = [];
    updateLLMFBTokenData();
}

function updateLLMFBTokenData() {
    var fb = _llmFB;
    fb.tokenData = [];
    for (var i = 0; i < fb.tokens.length; i++) {
        var word = fb.tokens[i];
        fb.tokenData.push({
            word: word,
            embedding: generateSimulatedEmbedding(word, fb.layer),
            features: {
                sentiment: getFeatureValue(word, 'sentiment'),
                tense: getFeatureValue(word, 'tense'),
                concreteness: getFeatureValue(word, 'concreteness'),
                animacy: getFeatureValue(word, 'animacy')
            },
            // Layout positions (computed during render)
            pillarX: 0,
            baseY: 0,
            pillarWidth: 0,
            pillarHeight: 0
        });
    }
}

function processLLMFiberBundle() {
    var fb = _llmFB;
    if (fb.tokens.length < 2) return;

    parseLLMFBSentence();

    // Generate simulated attention weights
    var n = fb.tokens.length;
    fb.attentionWeights = [];
    for (var i = 0; i < n; i++) {
        fb.attentionWeights[i] = [];
        var totalWeight = 0;
        for (var j = 0; j < n; j++) {
            var sim = getSemanticSimilarity(fb.tokens[i], fb.tokens[j]);
            // Distance penalty — nearby tokens attend more
            var distPenalty = Math.exp(-Math.abs(i - j) * 0.15);
            var raw = sim * distPenalty;
            // Layer effect: deeper layers have sharper attention
            raw = Math.pow(raw, 1 + fb.layer * 0.15);
            fb.attentionWeights[i][j] = raw;
            totalWeight += raw;
        }
        // Normalize (softmax-like)
        for (var j = 0; j < n; j++) {
            fb.attentionWeights[i][j] /= (totalWeight || 1);
        }
    }

    // Simulate the effect of attention on embeddings at this layer
    if (fb.layer > 0) {
        for (var i = 0; i < n; i++) {
            var newEmb = fb.tokenData[i].embedding.slice();
            for (var j = 0; j < n; j++) {
                if (i === j) continue;
                var w = fb.attentionWeights[i][j];
                if (w < 0.02) continue;
                var srcEmb = generateSimulatedEmbedding(fb.tokens[j], fb.layer);
                for (var d = 0; d < newEmb.length; d++) {
                    newEmb[d] += w * srcEmb[d] * 0.3 * (fb.layer / 12);
                }
            }
            fb.tokenData[i].embedding = newEmb;
        }
    }

    fb.processed = true;

    // Animate the processing
    fb.processAnim.active = true;
    fb.processAnim.progress = 0;
    fb.processAnim.startTime = performance.now();

    function animateProcess(now) {
        var elapsed = now - fb.processAnim.startTime;
        fb.processAnim.progress = Math.min(1, elapsed / 1200);
        renderLLMFiberBundle();
        if (fb.processAnim.progress < 1) {
            requestAnimationFrame(animateProcess);
        } else {
            fb.processAnim.active = false;
            renderLLMFiberBundle();
        }
    }
    requestAnimationFrame(animateProcess);

    // Update info panel
    updateLLMFBInfoPanel();
}

window.processLLMFiberBundle = processLLMFiberBundle;

function resetLLMFiberBundle() {
    var fb = _llmFB;
    fb.processed = false;
    fb.attentionWeights = [];
    fb.hoveredToken = -1;
    fb.layer = 0;
    fb.featureMode = 'none';
    fb.sliceHeight = 0.5;
    fb.rotY = 0;
    fb.processAnim.active = false;

    var layerSlider = document.getElementById('llm-fb-layer');
    if (layerSlider) layerSlider.value = 0;
    var layerVal = document.getElementById('llm-fb-layer-val');
    if (layerVal) layerVal.textContent = 'Layer 0 (Embedding)';
    var featureSelect = document.getElementById('llm-fb-feature');
    if (featureSelect) featureSelect.value = 'none';
    var sliceSlider = document.getElementById('llm-fb-slice-height');
    if (sliceSlider) sliceSlider.value = 50;
    var sliceVal = document.getElementById('llm-fb-slice-height-val');
    if (sliceVal) sliceVal.textContent = '50%';

    parseLLMFBSentence();
    renderLLMFiberBundle();

    var infoContent = document.getElementById('llm-fb-info-content');
    if (infoContent) {
        infoContent.innerHTML = 'Type a sentence and click <b>Process Attention</b> to see the fiber bundle come to life.';
    }
}

window.resetLLMFiberBundle = resetLLMFiberBundle;

function updateLLMFBInfoPanel() {
    var fb = _llmFB;
    var el = document.getElementById('llm-fb-info-content');
    if (!el) return;

    var html = '';
    html += '<div style="margin-bottom:8px;">';
    html += '<span style="font-size:0.8em; color:#94a3b8;">Base Space B:</span><br>';
    html += '<b style="color:#3b82f6;">{1, 2, …, ' + fb.tokens.length + '}</b>';
    html += ' <span style="font-size:0.75em; color:#94a3b8;">(' + fb.tokens.length + ' positions)</span>';
    html += '</div>';

    html += '<div style="margin-bottom:8px;">';
    html += '<span style="font-size:0.8em; color:#94a3b8;">Fiber F:</span><br>';
    html += '<b style="color:#8b5cf6;">ℝ<sup>8</sup></b>';
    html += ' <span style="font-size:0.75em; color:#94a3b8;">(simulated 8-dim)</span>';
    html += '</div>';

    html += '<div style="margin-bottom:8px;">';
    html += '<span style="font-size:0.8em; color:#94a3b8;">Total Space E:</span><br>';
    html += '<b style="color:#10b981;">⊔<sub>i=1</sub><sup>' + fb.tokens.length + '</sup> F<sub>i</sub></b>';
    html += '</div>';

    if (fb.processed) {
        html += '<div style="margin-bottom:8px;">';
        html += '<span style="font-size:0.8em; color:#94a3b8;">Connection ω (Attention):</span><br>';
        html += '<b style="color:#f59e0b;">Active</b>';
        html += ' <span style="font-size:0.75em; color:#94a3b8;">(Layer ' + fb.layer + ')</span>';
        html += '</div>';

        // Show strongest attention pairs
        html += '<div style="margin-bottom:8px;">';
        html += '<span style="font-size:0.8em; color:#94a3b8;">Strongest Connections:</span><br>';
        var pairs = [];
        for (var i = 0; i < fb.tokens.length; i++) {
            for (var j = 0; j < fb.tokens.length; j++) {
                if (i === j) continue;
                pairs.push({ from: j, to: i, weight: fb.attentionWeights[i][j] });
            }
        }
        pairs.sort(function(a, b) { return b.weight - a.weight; });
        for (var p = 0; p < Math.min(4, pairs.length); p++) {
            var pair = pairs[p];
            html += '<div style="font-size:0.75em; font-family:monospace; color:#f59e0b;">';
            html += '"' + fb.tokens[pair.from] + '" → "' + fb.tokens[pair.to] + '"';
            html += ' <span style="color:#94a3b8;">(' + (pair.weight * 100).toFixed(1) + '%)</span>';
            html += '</div>';
        }
        html += '</div>';
    }

    if (fb.hoveredToken >= 0 && fb.hoveredToken < fb.tokenData.length) {
        var td = fb.tokenData[fb.hoveredToken];
        html += '<hr style="border:none; border-top:1px solid #e2e8f0; margin:8px 0;">';
        html += '<div style="font-weight:bold; color:#ef4444; margin-bottom:4px;">🔍 "' + td.word + '" (pos ' + (fb.hoveredToken + 1) + ')</div>';
        html += '<div style="font-size:0.75em; color:#94a3b8; margin-bottom:4px;">Embedding (8-dim):</div>';
        html += '<div style="font-family:monospace; font-size:0.7em; color:#8b5cf6; word-break:break-all;">[';
        for (var d = 0; d < td.embedding.length; d++) {
            html += td.embedding[d].toFixed(2);
            if (d < td.embedding.length - 1) html += ', ';
        }
        html += ']</div>';
        html += '<div style="font-size:0.75em; color:#94a3b8; margin-top:4px;">Features:</div>';
        var featureKeys = ['sentiment', 'tense', 'concreteness', 'animacy'];
        for (var fi = 0; fi < featureKeys.length; fi++) {
            var fk = featureKeys[fi];
            var fv = td.features[fk];
            var barColor = fv >= 0 ? '#10b981' : '#ef4444';
            html += '<div style="font-size:0.7em; display:flex; align-items:center; gap:4px; margin:2px 0;">';
            html += '<span style="width:70px; color:#94a3b8;">' + fk + ':</span>';
            html += '<div style="flex:1; height:6px; background:#1e293b; border-radius:3px; overflow:hidden;">';
            html += '<div style="width:' + (Math.abs(fv) * 50 + 50) + '%; height:100%; background:' + barColor + '; margin-left:' + (fv < 0 ? (50 + fv * 50) : 50) + '%; border-radius:3px;"></div>';
            html += '</div>';
            html += '<span style="width:35px; text-align:right; color:' + barColor + ';">' + fv.toFixed(2) + '</span>';
            html += '</div>';
        }
    }

    el.innerHTML = html;
}

// ============================================================
// LLM FIBER BUNDLE — Main Render Function
// ============================================================

function renderLLMFiberBundle() {
    var fb = _llmFB;
    if (!fb.ctx) return;

    var ctx = fb.ctx;
    var W = fb.width;
    var H = fb.height;

    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.15)';
    ctx.lineWidth = 0.5;
    for (var gx = 0; gx < W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (var gy = 0; gy < H; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    var n = fb.tokens.length;
    if (n === 0) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.font = '16px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Type a sentence above to visualize the fiber bundle', W / 2, H / 2);
        ctx.textAlign = 'left';
        return;
    }

    // Layout parameters
    var margin = 60;
    var baseY = H - 80;
    var pillarMaxH = H - 180;
    var totalWidth = W - margin * 2 - 200; // leave room for info panel overlap
    var tokenSpacing = Math.min(100, totalWidth / n);
    var startX = margin + (totalWidth - tokenSpacing * (n - 1)) / 2;
    var pillarW = Math.min(40, tokenSpacing * 0.6);

    // Apply slight 3D rotation
    var rotOffset = Math.sin(fb.rotY) * 15;

    // Feature slice settings
    var featureMode = fb.featureMode;
    var sliceH = fb.sliceHeight;
    var showAttention = true;
    var showAttnEl = document.getElementById('llm-fb-show-attention');
    if (showAttnEl) showAttention = showAttnEl.checked;

    // ---- Draw Base Space (ground plane) ----
    ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
    ctx.fillRect(margin - 10, baseY - 5, totalWidth + 20, 30);

    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin - 10, baseY);
    ctx.lineTo(margin + totalWidth + 10, baseY);
    ctx.stroke();

    // Base space label
    ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Base Space B = {1, 2, …, ' + n + '}', margin + totalWidth / 2, baseY + 22);

    // ---- Compute pillar positions ----
    for (var i = 0; i < n; i++) {
        var td = fb.tokenData[i];
        td.pillarX = startX + i * tokenSpacing + rotOffset * (i - n / 2) * 0.02;
        td.baseY = baseY;
        td.pillarWidth = pillarW;
        td.pillarHeight = pillarMaxH;
    }

    // ---- Draw Attention Arcs (Connection ω) ----
    if (fb.processed && showAttention) {
        var animProgress = fb.processAnim.active ? fb.processAnim.progress : 1;

        for (var i = 0; i < n; i++) {
            for (var j = 0; j < n; j++) {
                if (i === j) continue;
                var w = fb.attentionWeights[i][j];
                if (w < 0.04) continue; // threshold for visibility

                var fromTD = fb.tokenData[j];
                var toTD = fb.tokenData[i];

                var fromX = fromTD.pillarX;
                var toX = toTD.pillarX;
                var fromY = baseY - pillarMaxH * 0.5;
                var toY = baseY - pillarMaxH * 0.5;

                // Arc height based on distance
                var dist = Math.abs(i - j);
                var arcH = 30 + dist * 15 + w * 40;

                // Animate: arcs grow in
                var arcAlpha = w * 2.5 * animProgress;
                arcAlpha = Math.min(0.7, arcAlpha);

                // Highlight arcs involving hovered token
                if (fb.hoveredToken >= 0 && (i === fb.hoveredToken || j === fb.hoveredToken)) {
                    arcAlpha = Math.min(0.9, arcAlpha * 2.5);
                } else if (fb.hoveredToken >= 0) {
                    arcAlpha *= 0.15;
                }

                var arcWidth = 1 + w * 4;

                ctx.strokeStyle = 'rgba(245, 158, 11, ' + arcAlpha + ')';
                ctx.lineWidth = arcWidth;
                ctx.beginPath();
                var cpX = (fromX + toX) / 2;
                var cpY = fromY - arcH;
                ctx.moveTo(fromX, fromY);
                ctx.quadraticCurveTo(cpX, cpY, toX, toY);
                ctx.stroke();

                // Arrowhead at destination
                if (arcAlpha > 0.15) {
                    var t = 0.95;
                    var ax = (1 - t) * (1 - t) * fromX + 2 * (1 - t) * t * cpX + t * t * toX;
                    var ay = (1 - t) * (1 - t) * fromY + 2 * (1 - t) * t * cpY + t * t * toY;
                    var angle = Math.atan2(toY - ay, toX - ax);
                    var headLen = 5 + w * 6;
                    ctx.fillStyle = 'rgba(245, 158, 11, ' + arcAlpha + ')';
                    ctx.beginPath();
                    ctx.moveTo(toX, toY);
                    ctx.lineTo(toX - headLen * Math.cos(angle - 0.4), toY - headLen * Math.sin(angle - 0.4));
                    ctx.lineTo(toX - headLen * Math.cos(angle + 0.4), toY - headLen * Math.sin(angle + 0.4));
                    ctx.closePath();
                    ctx.fill();
                }

                // Weight label on strong connections
                if (w > 0.12 && arcAlpha > 0.3) {
                    ctx.font = (8 + w * 4) + 'px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = 'rgba(245, 158, 11, ' + (arcAlpha * 0.8) + ')';
                    ctx.fillText((w * 100).toFixed(0) + '%', cpX, cpY - 4);
                }
            }
        }
    }

    // ---- Draw Feature Slice (Section σ) ----
    if (featureMode !== 'none') {
        var sliceY = baseY - pillarMaxH * sliceH;

        // Ribbon background
        ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
        ctx.fillRect(margin - 10, sliceY - 8, totalWidth + 20, 16);

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(margin - 10, sliceY);
        ctx.lineTo(margin + totalWidth + 10, sliceY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Section label
        ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Section σ_' + featureMode, margin - 8, sliceY - 12);

        // Draw feature values at each pillar intersection
        for (var i = 0; i < n; i++) {
            var td = fb.tokenData[i];
            var fv = td.features[featureMode];
            var dotR = 4 + Math.abs(fv) * 8;
            var dotColor = fv >= 0 ? '#10b981' : '#ef4444';
            var dotAlpha = 0.4 + Math.abs(fv) * 0.6;

            // Glow
            ctx.beginPath();
            ctx.arc(td.pillarX, sliceY, dotR + 6, 0, Math.PI * 2);
            ctx.fillStyle = dotColor.replace(')', ', 0.15)').replace('rgb', 'rgba');
            ctx.fill();

            // Dot
            ctx.beginPath();
            ctx.arc(td.pillarX, sliceY, dotR, 0, Math.PI * 2);
            ctx.fillStyle = dotColor;
            ctx.globalAlpha = dotAlpha;
            ctx.fill();
            ctx.globalAlpha = 1;

            // Value label
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = dotColor;
            ctx.fillText(fv.toFixed(2), td.pillarX, sliceY + dotR + 10);
        }

        // Connect section dots with a line
        if (n > 1) {
            ctx.beginPath();
            for (var i = 0; i < n; i++) {
                var td = fb.tokenData[i];
                if (i === 0) ctx.moveTo(td.pillarX, sliceY);
                else ctx.lineTo(td.pillarX, sliceY);
            }
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    // ---- Draw Fiber Pillars ----
    for (var i = 0; i < n; i++) {
        var td = fb.tokenData[i];
        var isHovered = (i === fb.hoveredToken);
        var pw = isHovered ? pillarW * 1.8 : pillarW;
        var ph = td.pillarHeight;
        var px = td.pillarX;
        var py = td.baseY;

        // Pillar glow
        var glowAlpha = isHovered ? 0.15 : 0.04;
        var gradient = ctx.createLinearGradient(px, py, px, py - ph);
        gradient.addColorStop(0, 'rgba(139, 92, 246, ' + (glowAlpha * 2) + ')');
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, ' + glowAlpha + ')');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(px - pw / 2, py - ph, pw, ph);

        // Pillar border
        ctx.strokeStyle = isHovered ? 'rgba(239, 68, 68, 0.7)' : 'rgba(139, 92, 246, 0.3)';
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.strokeRect(px - pw / 2, py - ph, pw, ph);

        // Embedding dimension dots inside pillar
        var emb = td.embedding;
        var dimCount = emb.length;
        var dotSpacing = (ph - 20) / dimCount;

        for (var d = 0; d < dimCount; d++) {
            var dotY = py - 10 - d * dotSpacing;
            var dotX = px + emb[d] * (pw / 2 - 4);
            var dotR = isHovered ? 3.5 : 2;

            // Color by dimension value
            var hue = 260 + emb[d] * 60;
            var sat = 70 + Math.abs(emb[d]) * 30;
            var light = 50 + Math.abs(emb[d]) * 20;

            ctx.beginPath();
            ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
            ctx.fillStyle = 'hsl(' + hue + ', ' + sat + '%, ' + light + '%)';
            ctx.fill();

            // Dimension label on hover
            if (isHovered && d < dimCount) {
                ctx.font = '7px monospace';
                ctx.textAlign = 'left';
                ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
                ctx.fillText('d' + d + ':' + emb[d].toFixed(1), px + pw / 2 + 4, dotY + 2);
            }
        }

        // Token label at base
        ctx.font = isHovered ? 'bold 12px system-ui, sans-serif' : '11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = isHovered ? '#ef4444' : '#e2e8f0';
        ctx.fillText(td.word, px, py + 14);

        // Position number
        ctx.font = '8px monospace';
        ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.fillText('pos ' + (i + 1), px, py + 24);

        // Fiber label at top
        if (isHovered) {
            ctx.font = 'bold 9px system-ui, sans-serif';
            ctx.fillStyle = 'rgba(139, 92, 246, 0.8)';
            ctx.fillText('F_' + (i + 1) + ' = ℝ⁸', px, py - ph - 8);
        }
    }

    // ---- Layer indicator ----
    ctx.fillStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    var layerLabels = ['Layer 0 (Embedding)', 'Layer 1', 'Layer 2', 'Layer 3', 'Layer 4',
                       'Layer 5', 'Layer 6 (Mid)', 'Layer 7', 'Layer 8', 'Layer 9',
                       'Layer 10', 'Layer 11', 'Layer 12 (Output)'];
    ctx.fillText('🏗️ ' + (layerLabels[fb.layer] || 'Layer ' + fb.layer), 10, 20);

    // Processing status
    if (fb.processed) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
        ctx.fillText('⚡ Attention Active', 10, 36);
    } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.fillText('💤 Click "Process Attention" to activate connection', 10, 36);
    }

    // Title
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('🪥 LLM Fiber Bundle (π, E, B, F)', W - 10, 20);

    ctx.textAlign = 'left';

    // Update info panel on hover change
    updateLLMFBInfoPanel();
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

	_topologyLazyRegister('canvas-llm-fiber-bundle', function() {
		initLLMFiberBundle();
	});

	// Start observing
	_topologyLazyCreateObserver();

	visualize_torus();

	draw_moebius();

	covering_vis();

	projective_plane();

	fiber_bundles();

	winding_number();

	embedding_topology();
}
