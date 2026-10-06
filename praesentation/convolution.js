// ============================================================
// convolution.js — Folie "Was sind Convolutions?"
//
// Animation (aus convolution.html): ein kleines Muster (Kernel)
// fährt pixelweise über ein 5×5-Bild und vergleicht jedes Pixel
// mit seinen Nachbarn. Sie läuft automatisch und schleift —
// Pfeiltasten gehören der Folien-Navigation, daher keine eigenen
// Tastatur-Shortcuts. DemoRegistry ruft init() beim Betreten
// und reset() beim Verlassen der Folie auf.
// ============================================================

const ConvDemo = (() => {
	'use strict';

	const cv = document.getElementById('conv-anim'), ctx = cv.getContext('2d');

	/* ══════════ 1) GEOMETRIE ══════════ */
	const GRID = 5, CELL = 76, S = CELL * GRID, N = GRID * GRID;
	const IMG = { x: 290, y: 34, s: S }, KER = { x: 48, y: 34, s: CELL }, OUT = { x: 762, y: 34, s: S };
	const OCELL = S / GRID;

	const EYE_CELLS = [{ c: 1, r: 1 }, { c: 3, r: 1 }];
	const EYE_IDX = EYE_CELLS.map(e => e.r * GRID + e.c);
	const ec = e => ({ x: (e.c + 0.5) * CELL, y: (e.r + 0.5) * CELL });
	const L = ec(EYE_CELLS[0]), R = ec(EYE_CELLS[1]);

	const INK = '#4a4f57', LW = 1.7, EYE_W = CELL * 0.74;

	/* ══════════ 2) ZEICHNEN ══════════ */
	function drawEye(g, cx, cy, w) {
		const rx = w * 0.5, ry = w * 0.27;
		g.save(); g.lineJoin = g.lineCap = 'round';
		g.strokeStyle = INK; g.lineWidth = Math.max(1.3, w * 0.048);
		g.beginPath();
		g.moveTo(cx - rx, cy);
		g.quadraticCurveTo(cx, cy - ry * 1.8, cx + rx, cy);
		g.quadraticCurveTo(cx, cy + ry * 1.8, cx - rx, cy);
		g.closePath(); g.fillStyle = '#fff'; g.fill(); g.stroke();
		g.beginPath(); g.arc(cx, cy, ry * 0.88, 0, Math.PI * 2); g.stroke();
		g.beginPath(); g.arc(cx, cy, ry * 0.36, 0, Math.PI * 2); g.stroke();
		g.beginPath(); g.lineWidth = Math.max(1.8, w * 0.072);
		g.arc(cx, cy + ry * 0.70, rx * 1.12, Math.PI * 1.10, Math.PI * 1.90); g.stroke();
		g.restore();
	}

	const FCX = (L.x + R.x) / 2, FCY = L.y + CELL * 0.78, FR = CELL * 1.72;
	const NOSE_W = CELL * 0.46, NOSE_T = L.y + CELL * 0.30, NOSE_B = L.y + CELL * 1.26;
	const MOUTH_W = NOSE_W * 2.3, MOUTH_Y = NOSE_B + CELL * 0.14;

	function drawFace(g) {
		g.save(); g.lineJoin = g.lineCap = 'round';
		g.strokeStyle = INK; g.lineWidth = LW;
		g.beginPath(); g.arc(FCX, FCY, FR, 0, Math.PI * 2);
		g.fillStyle = '#fff'; g.fill(); g.stroke();
		drawEye(g, L.x, L.y, EYE_W);
		drawEye(g, R.x, R.y, EYE_W);
		g.beginPath();
		g.moveTo(FCX, NOSE_T);
		g.lineTo(FCX - NOSE_W / 2, NOSE_B);
		g.lineTo(FCX + NOSE_W / 2, NOSE_B);
		g.closePath(); g.stroke();
		const hw = MOUTH_W / 2, dip = CELL * 0.42;
		g.beginPath(); g.lineWidth = LW * 1.45;
		g.moveTo(FCX - hw, MOUTH_Y);
		g.bezierCurveTo(FCX - hw * 0.42, MOUTH_Y + dip, FCX + hw * 0.42, MOUTH_Y + dip, FCX + hw, MOUTH_Y);
		g.stroke();
		g.restore();
	}

	const face = document.createElement('canvas');
	face.width = face.height = S;
	const fctx = face.getContext('2d');
	fctx.fillStyle = '#fff'; fctx.fillRect(0, 0, S, S);
	drawFace(fctx);

	const ker = document.createElement('canvas');
	ker.width = ker.height = CELL;
	{
		const k = ker.getContext('2d');
		k.fillStyle = '#fff'; k.fillRect(0, 0, CELL, CELL);
		drawEye(k, CELL * 0.5, CELL * 0.5, EYE_W);
	}

	/* ══════════ 3) WERTE — deterministische Tabelle ══════════ */
	const VALUES = Array.from({ length: N }, (_, i) => EYE_IDX.includes(i) ? 100 : 0);

	/* ══════════ 4) ZUSTAND ══════════ */
	let cur = 0, prev = 0, t = 1;
	let filled = new Array(N).fill(null);
	let playing = false, speed = 78, last = performance.now();
	let rafId = null;

	const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
	const wpos = i => ({ x: IMG.x + (i % GRID) * CELL, y: IMG.y + ((i / GRID) | 0) * CELL });
	const shownIdx = () => t < 0.5 ? prev : cur;

	function commitUpTo(i) {
		i = Math.max(0, Math.min(N - 1, i));
		for (let k = 0; k < N; k++) filled[k] = (k <= i) ? VALUES[k] : null;
	}
	commitUpTo(0);

	function goTo(i, animate = true) {
		i = Math.max(0, Math.min(N - 1, i));
		prev = cur; cur = i; t = animate ? 0 : 1;
		commitUpTo(i);
	}

	function resetAnim() {
		cur = 0; prev = 0; t = 1;
		filled = new Array(N).fill(null);
		commitUpTo(0);
		playing = true;
	}

	/* ══════════ 5) RENDER ══════════ */
	function txt(s, x, y, col = '#5a6070', sz = 12.5, w = 500) {
		ctx.save(); ctx.fillStyle = col;
		ctx.font = `${w} ${sz}px Inter, system-ui, sans-serif`;
		ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
		ctx.fillText(s, x, y); ctx.restore();
	}

	function render() {
		ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);

		ctx.drawImage(ker, KER.x, KER.y, KER.s, KER.s);
		ctx.fillStyle = 'rgba(150,190,240,.30)'; ctx.fillRect(KER.x, KER.y, KER.s, KER.s);
		ctx.strokeStyle = '#7aa8e0'; ctx.lineWidth = 1.3;
		ctx.strokeRect(KER.x + .5, KER.y + .5, KER.s - 1, KER.s - 1);

		ctx.drawImage(face, IMG.x, IMG.y);
		ctx.strokeStyle = '#1b1f24'; ctx.lineWidth = 1.5;
		ctx.strokeRect(IMG.x + .5, IMG.y + .5, IMG.s - 1, IMG.s - 1);

		const a = wpos(prev), b = wpos(cur), e = ease(t);
		const wx = a.x + (b.x - a.x) * e, wy = a.y + (b.y - a.y) * e;
		const si = shownIdx(), live = VALUES[si], hot = live > 50;

		ctx.save();
		ctx.setLineDash([5, 5]); ctx.strokeStyle = '#5a6070'; ctx.lineWidth = 1.2;
		const sx = KER.x + KER.s + 10, sy = KER.y + KER.s / 2, ex = wx - 6, ey = wy + CELL / 2;
		ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
		ctx.setLineDash([]);
		ctx.translate(ex, ey); ctx.rotate(Math.atan2(ey - sy, ex - sx));
		ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, -4); ctx.lineTo(-8, 4);
		ctx.closePath(); ctx.fillStyle = '#5a6070'; ctx.fill();
		ctx.restore();
		txt('', (sx + ex) / 2, Math.min(sy, ey) - 20, '#1b1f24', 20, 700);

		ctx.fillStyle = hot ? 'rgba(76,175,80,.30)' : 'rgba(150,190,240,.30)';
		ctx.fillRect(wx, wy, CELL, CELL);
		ctx.strokeStyle = hot ? '#4caf50' : '#7aa8e0'; ctx.lineWidth = 1.7;
		ctx.strokeRect(wx + .5, wy + .5, CELL - 1, CELL - 1);

		const bw = 50, bh = 20, bx = wx + CELL / 2 - bw / 2, by = wy - bh - 5;
		ctx.fillStyle = '#fff'; ctx.fillRect(bx, by, bw, bh);
		ctx.strokeStyle = hot ? '#4caf50' : '#7aa8e0'; ctx.lineWidth = 1.1;
		ctx.strokeRect(bx + .5, by + .5, bw - 1, bh - 1);
		txt(live + '%', wx + CELL / 2, by + bh / 2, hot ? '#2e7d32' : '#4a7fc0', 11.5, 600);

		for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
			const i = r * GRID + c, x = OUT.x + c * OCELL, y = OUT.y + r * OCELL;
			const v = filled[i], done = v !== null, isCur = (i === si);
			ctx.fillStyle = done ? (v > 50 ? 'rgba(76,175,80,.18)' : '#f6f7f9')
				: isCur ? 'rgba(150,190,240,.16)' : '#fff';
			ctx.fillRect(x, y, OCELL, OCELL);
			ctx.strokeStyle = isCur ? '#7aa8e0' : '#1b1f24';
			ctx.lineWidth = isCur ? 2.2 : 1.2;
			ctx.strokeRect(x + .5, y + .5, OCELL - 1, OCELL - 1);
			if (done) txt(v + '', x + OCELL / 2, y + OCELL / 2,
				v > 50 ? '#2e7d32' : '#1b1f24', v > 50 ? 20 : 16, v > 50 ? 700 : 600);
		}
	}

	/* ══════════ 6) LOOP ══════════ */
	function loop(now) {
		const dt = Math.min(.05, (now - last) / 1000); last = now;

		if (playing) {
			if (t < 1) {
				t = Math.min(1, t + dt * (speed / 100) * 1.9);
			} else if (cur < N - 1) {
				goTo(cur + 1, true);
			} else {
				resetAnim();
			}
		} else if (t < 1) {
			t = 1;
		}

		render();
		rafId = requestAnimationFrame(loop);
	}

	function startLoop() {
		if (rafId == null) { last = performance.now(); rafId = requestAnimationFrame(loop); }
	}
	function stopLoop() {
		if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
	}

	/* ══════════ 7) MODULE-API (DemoRegistry) ══════════ */
	function isOnSlide() {
		const a = document.querySelector('.slide.active');
		return a && a.id === 'slide-convolution';
	}

	function init() {
		resetAnim();
		playing = true;
		startLoop();
	}

	function reset() {
		stopLoop();
		playing = false;
	}

	// Pfeiltasten/Leertaste steuern die Folien-Navigation — die Animation
	// läuft automatisch weiter und blockt daher nichts ab (next/prev werden
	// nie aufgerufen, weil canGo* false liefert).
	function canGoNext() { return false; }
	function canGoPrev() { return false; }

	return { init, reset, isOnSlide, canGoNext, canGoPrev };
})();
