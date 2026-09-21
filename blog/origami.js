/* =========================================================================
 * Origami in N Dimensions — interactive demos
 * Visual companion to Keup & Helias (2022), arXiv:2203.11355.
 * Every demo is theme-aware (isDarkMode / themeColor) and redraws on a
 * dark/light toggle via __MN_DARK.onChange.
 * ========================================================================= */
const OG = {
	registry: [],
	observer: null,
	redos: [],
	regen: [],

	isDark() { return (typeof isDarkMode === 'function') ? isDarkMode() : false; },

	pal() {
		const dark = this.isDark();
		return {
			dark,
			bg:    dark ? '#0b1020' : '#f4f7fc',
			grid:  dark ? '#22304f' : '#dbe2ef',
			grid2: dark ? '#33436b' : '#c2ccdf',
			muted: dark ? '#8fa1c4' : '#64748b',
			ink:   dark ? '#e8eefc' : '#1f2937',
			faint: dark ? '#5b6b95' : '#9aa7c0',
			inner: '#ff6b9d',
			outer: '#4ecdc4',
			fold:  '#ffe66d',
			axis:  dark ? '#4a5b86' : '#9aa7c0',
			accent:  dark ? '#7cf9d0' : '#059669',
			accent2: dark ? '#ff9ec7' : '#e11d48',
			good:  dark ? '#7cf9d0' : '#059669',
			bad:   dark ? '#ff6b6b' : '#e11d48'
		};
	},

	plotPal() {
		const dark = this.isDark();
		return {
			paper: dark ? '#0b1020' : '#ffffff',
			plot:  dark ? '#0b1020' : '#ffffff',
			font:  dark ? '#cbd5e1' : '#334155',
			grid:  dark ? '#22304f' : '#e2e8f0',
			axis:  dark ? '#8fa1c4' : '#94a3b8'
		};
	},

	register(elId, initFn) {
		const el = document.getElementById(elId);
		if (!el) return;
		this.registry.push({ el, fn: initFn, done: false });
	},

	start() {
		if (this.observer) return;
		const margin = (typeof rootMargin !== 'undefined') ? rootMargin : '500px';
		this.observer = new IntersectionObserver((entries) => {
			entries.forEach((e) => {
				if (!e.isIntersecting) return;
				const r = this.registry.find((x) => x.el === e.target);
				if (r && !r.done) {
					r.done = true;
					this.observer.unobserve(r.el);
					try { r.fn(); } catch (err) { console.error('origami demo failed:', err); }
				}
			});
		}, { rootMargin: margin });
		this.registry.forEach((r) => { if (!r.done) this.observer.observe(r.el); });
	}
};

function ogSet(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }
const OGT = Math.PI * 2;

/* ---- live temml math + Plotly camera persistence (ported from space_warps) ---- */
function ogTex(id, tex, display) {
	const el = document.getElementById(id); if (!el) return;
	if (typeof temml !== 'undefined' && temml.renderToString) {
		try { el.innerHTML = temml.renderToString(tex, { displayMode: !!display, annotate: true }); return; }
		catch (e) { /* fall back to plain text */ }
	}
	el.textContent = tex;
}
function ogKeepCam(id) {
	const gd = document.getElementById(id);
	const cam = gd && gd._fullLayout && gd._fullLayout.scene && gd._fullLayout.scene.camera;
	return cam ? { eye: cam.eye, up: cam.up } : null;
}
/* ---- number formatting + small linear-algebra helpers ---- */
const ogf1 = n => (Math.round(n * 100) / 100).toFixed(2);
const ogf0 = n => (Math.round(n * 10) / 10).toFixed(1);
function ogRotMat(deg) { const t = deg * Math.PI / 180; return [[Math.cos(t), -Math.sin(t)], [Math.sin(t), Math.cos(t)]]; }
function ogMulMatVec(M, x) { return [M[0][0] * x[0] + M[0][1] * x[1], M[1][0] * x[0] + M[1][1] * x[1]]; }
function ogRelu(v) { return Math.max(0, v); }
function ogWmatrix(th, sx, sy, sh) { const cs = Math.cos(th), sn = Math.sin(th); return [[cs * sx, cs * sx * sh - sn * sy], [sn * sx, sn * sx * sh + cs * sy]]; }
/* ---- data generators (cl: 0 = inner/core, 1 = outer/ring) ---- */
function ogMakeEgg(nIn, nOut, rIn0, rIn1, rOut0, rOut1) {
	const pts = [];
	for (let i = 0; i < nIn; i++) { const r = rIn0 + Math.random() * (rIn1 - rIn0), a = Math.random() * OGT; pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, cl: 0 }); }
	for (let i = 0; i < nOut; i++) { const r = rOut0 + Math.random() * (rOut1 - rOut0), a = Math.random() * OGT; pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, cl: 1 }); }
	return pts;
}
function ogMakeBlobs() {
	const pts = []; const c = [{ cx: -0.45, cy: -0.30, cl: 0 }, { cx: 0.48, cy: 0.34, cl: 1 }];
	for (const k of c) for (let i = 0; i < 260; i++) { const r = Math.sqrt(Math.random()) * 0.32, a = Math.random() * OGT; pts.push({ x: k.cx + Math.cos(a) * r, y: k.cy + Math.sin(a) * r, cl: k.cl }); }
	return pts;
}
function ogLineStats(pts, nx, ny, c) {
	let aMis = 0, bMis = 0;
	for (const p of pts) { const f = nx * p.x + ny * p.y - c; if (p.cl === 1) { if (f < 0) aMis++; } else { if (f > 0) aMis++; } }
	for (const p of pts) { const f = nx * p.x + ny * p.y - c; if (p.cl === 1) { if (f > 0) bMis++; } else { if (f < 0) bMis++; } }
	const mis = Math.min(aMis, bMis); return { mis, sep: mis === 0 };
}

/* ------------------------------------------------------------------ Demo 1 */
function ogInitNonsep() {
	const c = document.getElementById('og-nonsep'); if (!c) return;
	const ctx = c.getContext('2d');
	const W = c.width, H = c.height, cx = W / 2, cy = H / 2, SC = 105;
	let pts = [];
	function gen(kind) {
		if (kind === 'blobs') { pts = ogMakeBlobs(); return; }
		if (kind === 'egg') { pts = ogMakeEgg(80, 130, 0, 0.45, 0.9, 1.3); return; }
		pts = [];
		if (kind === 'xor') {
			for (let i = 0; i < 60; i++) { pts.push({ x: 0.5 + Math.random() * 0.6, y: 0.5 + Math.random() * 0.6, cl: 0 }); pts.push({ x: -0.5 - Math.random() * 0.6, y: -0.5 - Math.random() * 0.6, cl: 0 }); pts.push({ x: -0.5 - Math.random() * 0.6, y: 0.5 + Math.random() * 0.6, cl: 1 }); pts.push({ x: 0.5 + Math.random() * 0.6, y: -0.5 - Math.random() * 0.6, cl: 1 }); }
		} else {
			for (let i = 0; i < 130; i++) { const t = i / 34, r = 0.12 + t * 0.32; pts.push({ x: Math.cos(t) * r, y: Math.sin(t) * r, cl: 0 }); pts.push({ x: -Math.cos(t) * r, y: -Math.sin(t) * r, cl: 1 }); }
		}
	}
	function drawNonsep() {
		const p = OG.pal();
		const ang = (+document.getElementById('og-angle').value) * Math.PI / 180;
		const shift = +document.getElementById('og-shift').value;
		ogSet('og-angle-v', (ang * 180 / Math.PI).toFixed(0) + '°');
		ogSet('og-shift-v', shift.toFixed(2));
		const nx = Math.cos(ang), ny = Math.sin(ang);
		ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);
		ctx.strokeStyle = p.grid; ctx.lineWidth = 1;
		for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(cx + i * SC / 2, 0); ctx.lineTo(cx + i * SC / 2, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, cy + i * SC / 2); ctx.lineTo(W, cy + i * SC / 2); ctx.stroke(); }
		let correct = 0;
		for (const q of pts) {
			const side = nx * q.x + ny * q.y - shift;
			const pred = side > 0 ? 0 : 1;
			if (pred === q.cl) correct++;
			ctx.fillStyle = q.cl === 0 ? p.inner : p.outer;
			ctx.beginPath(); ctx.arc(cx + q.x * SC, cy - q.y * SC, 3, 0, OGT); ctx.fill();
		}
		ctx.strokeStyle = p.fold; ctx.lineWidth = 2.5;
		const tx = -ny, ty = nx;
		ctx.beginPath();
		ctx.moveTo(cx + (shift * nx - tx * 3) * SC, cy - (shift * ny - ty * 3) * SC);
		ctx.lineTo(cx + (shift * nx + tx * 3) * SC, cy - (shift * ny + ty * 3) * SC);
		ctx.stroke();
		const st = ogLineStats(pts, nx, ny, shift);
		const acc = 100 * Math.max(correct, pts.length - correct) / pts.length;
		const out = document.getElementById('og-nonsep-out');
		if (out) out.textContent = 'This line classifies ' + acc.toFixed(1) + '% correctly · best single straight line misclassifies ' + st.mis + ' point(s)';
		const v = document.getElementById('og-nonsep-verdict');
		if (v) { v.textContent = st.sep ? 'separated ✓' : 'not separable ✗'; v.className = 'og-verdict ' + (st.sep ? 'ok' : 'no'); }
	}
	document.getElementById('og-angle').oninput = drawNonsep;
	document.getElementById('og-shift').oninput = drawNonsep;
	document.getElementById('og-setup').onchange = (e) => { gen(e.target.value); drawNonsep(); };
	const setupSel = document.getElementById('og-setup');
	gen(setupSel ? setupSel.value : 'egg'); drawNonsep();
	OG.redos.push(drawNonsep);
}

/* ------------------------------------------------------------------ Demo 2 */
function ogInitRelu() {
	const cb = document.getElementById('og-before'), ca = document.getElementById('og-after');
	if (!cb || !ca) return;
	const bx = cb.getContext('2d'), ax = ca.getContext('2d');
	const W = 360, H = 320, cx = 190, cy = 160, SC = 62;
	const pts = [];
	for (let i = 0; i < 220; i++) { const a = Math.random() * OGT, r = 0.4 + Math.random() * 0.9; pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r }); }
	function drawGrid(g) {
		const p = OG.pal();
		g.fillStyle = p.bg; g.fillRect(0, 0, W, H);
		g.strokeStyle = p.grid; g.lineWidth = 1;
		for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(cx + i * SC / 2, 0); g.lineTo(cx + i * SC / 2, H); g.stroke(); g.beginPath(); g.moveTo(0, cy + i * SC / 2); g.lineTo(W, cy + i * SC / 2); g.stroke(); }
		g.strokeStyle = p.grid2; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, H); g.moveTo(0, cy); g.lineTo(W, cy); g.stroke();
	}
	function drawRelu() {
		const p = OG.pal();
		const ang = (+document.getElementById('og-hp-a').value) * Math.PI / 180;
		const bias = +document.getElementById('og-hp-b').value;
		ogSet('og-hp-a-v', (ang * 180 / Math.PI).toFixed(0) + '°');
		ogSet('og-hp-b-v', bias.toFixed(2));
		const nx = Math.cos(ang), ny = Math.sin(ang);
		drawGrid(bx); drawGrid(ax);
		for (const g of [bx, ax]) {
			g.strokeStyle = p.fold; g.lineWidth = 2;
			const tx = -ny, ty = nx, x0 = bias * nx, y0 = bias * ny;
			g.beginPath(); g.moveTo(cx + (x0 - tx * 5) * SC, cy - (y0 - ty * 5) * SC); g.lineTo(cx + (x0 + tx * 5) * SC, cy - (y0 + ty * 5) * SC); g.stroke();
		}
		for (const q of pts) {
			bx.fillStyle = p.outer; bx.beginPath(); bx.arc(cx + q.x * SC, cy - q.y * SC, 2.5, 0, OGT); bx.fill();
			const s = nx * q.x + ny * q.y - bias;
			let x = q.x, y = q.y;
			if (s < 0) { x -= s * nx; y -= s * ny; }
			ax.fillStyle = s < 0 ? p.inner : p.outer;
			ax.beginPath(); ax.arc(cx + x * SC, cy - y * SC, 2.5, 0, OGT); ax.fill();
		}
	}
	document.getElementById('og-hp-a').oninput = drawRelu;
	document.getElementById('og-hp-b').oninput = drawRelu;
	drawRelu();
	OG.redos.push(drawRelu);
}

/* ------------------------------------------------------------------ Demo 3 */
function ogInitFold1d() {
	const c = document.getElementById('og-fold1d'); if (!c) return;
	const ctx = c.getContext('2d');
	const W = c.width, H = c.height, cx = W / 2, cy = H * 0.68, SC = 82;
	const pts = [];
	for (let i = -26; i <= 26; i++) { const x = i * 0.06; pts.push({ x, cls: (Math.abs(x) < 0.6) ? 0 : 1 }); }
	function foldY(x, biases, slope) { let y = 0; for (const b of biases) y += Math.max(0, slope * (x - b)); return y; }
	function drawFold1d() {
		const p = OG.pal();
		const bias = +document.getElementById('og-fold-b').value;
		const ang = (+document.getElementById('og-fold-a').value) * Math.PI / 180;
		const n = +document.getElementById('og-fold-n').value;
		ogSet('og-fold-b-v', bias.toFixed(2)); ogSet('og-fold-a-v', (ang * 180 / Math.PI).toFixed(0) + '°'); ogSet('og-fold-n-v', n);
		const slope = Math.tan(ang - Math.PI / 2);
		const biases = []; for (let k = 0; k < n; k++) biases.push(bias + k * 0.7);
		ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);
		ctx.strokeStyle = p.axis; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
		ctx.strokeStyle = p.muted; ctx.lineWidth = 1.5; ctx.beginPath();
		let first = true;
		for (let i = -42; i <= 42; i++) { const x = i * 0.05, y = foldY(x, biases, slope), X = cx + x * SC, Y = cy - y * SC * 0.5; if (first) { ctx.moveTo(X, Y); first = false; } else ctx.lineTo(X, Y); }
		ctx.stroke();
		ctx.strokeStyle = p.fold; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
		for (const b of biases) { let y = 0; for (const bb of biases) y += Math.max(0, slope * (b - bb)); ctx.beginPath(); ctx.moveTo(cx + b * SC, cy); ctx.lineTo(cx + b * SC, cy - y * SC * 0.5 - 10); ctx.stroke(); }
		ctx.setLineDash([]);
		const yByCls = [[], []];
		for (const q of pts) { const y = foldY(q.x, biases, slope), X = cx + q.x * SC, Y = cy - y * SC * 0.5; ctx.fillStyle = q.cls === 0 ? p.inner : p.outer; ctx.beginPath(); ctx.arc(X, Y, 4, 0, OGT); ctx.fill(); yByCls[q.cls].push(y); }
		const all = [...yByCls[0].map((y) => ({ y, c: 0 })), ...yByCls[1].map((y) => ({ y, c: 1 }))].sort((a, b) => a.y - b.y);
		let best = 0;
		for (let i = 0; i < all.length; i++) { let corr = 0; for (const q of all) if ((q.y <= all[i].y ? 0 : 1) === q.c) corr++; best = Math.max(best, corr, all.length - corr); }
		ctx.fillStyle = p.muted; ctx.font = '11px monospace';
		ctx.fillText('original 1-D data (X-axis)', 10, cy + 18);
		ctx.fillText('ReLU output  (Y = new dimension)', 10, 20);
		document.getElementById('og-fold1d-out').textContent = 'Best horizontal separation after folding: ' + (100 * best / all.length).toFixed(1) + '% — the fold lifted the inner class into the new dimension.';
	}
	['og-fold-b', 'og-fold-a', 'og-fold-n'].forEach((id) => document.getElementById(id).oninput = drawFold1d);
	drawFold1d();
	OG.redos.push(drawFold1d);
}

/* ------------------------------------------------------------------ Demo 4 */
function ogInitFold3d() {
	const c = document.getElementById('og-fold3d'); if (!c) return;
	const ctx = c.getContext('2d');
	const W = c.width, H = c.height, scale = 100;
	let yaw = 0.7, pitch = 0.42;
	const inner = [], outer = [];
	for (let i = 0; i < 320; i++) { const a = Math.random() * OGT, r = 0.15 + Math.random() * 0.25; inner.push([Math.cos(a) * r, Math.sin(a) * r]); }
	for (let i = 0; i < 620; i++) { const a = Math.random() * OGT, r = 0.9 + Math.random() * 0.4; outer.push([Math.cos(a) * r, Math.sin(a) * r]); }
	const normals = [0, 1, 2].map((k) => { const a = k * OGT / 3; return [Math.cos(a), Math.sin(a)]; });
	const C = 0.6, PLANE = 0.3;
	function foldHeight(x, y, t) { let z = 0; for (const [nx, ny] of normals) z += Math.max(0, nx * x + ny * y - C); return z * t; }
	function rot(px, py, pz) {
		const cy2 = Math.cos(yaw), sx = Math.sin(yaw);
		const x1 = cy2 * px - sx * pz, z1 = sx * px + cy2 * pz, y1 = py;
		const cx2 = Math.cos(pitch), sy = Math.sin(pitch);
		return [x1, cx2 * y1 - sy * z1, sy * y1 + cx2 * z1];
	}
	function proj(wx, wy, wz) { const [x, y, z] = rot(wx, wy, wz); return [W / 2 + x * scale, H * 0.54 - y * scale, z]; }
	function baseRing(r, color) {
		ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath();
		for (let i = 0; i <= 48; i++) { const a = i / 48 * OGT, [sx, sy] = proj(Math.cos(a) * r, 0, Math.sin(a) * r); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); }
		ctx.stroke();
	}
	function drawFold3d() {
		const p = OG.pal();
		const t = parseFloat(document.getElementById('og-3d-t').value) / 100;
		ogSet('og-3d-tval', (t * 100).toFixed(0) + '%');
		ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);
		ctx.strokeStyle = p.axis; ctx.lineWidth = 1;
		for (const [ex, ey, ez] of [[1.6, 0, 0], [0, 1.3, 0], [0, 0, 1.6]]) { const [x0, y0] = proj(0, 0, 0), [x1, y1] = proj(ex, ey, ez); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
		baseRing(0.3, p.grid2); baseRing(1.1, p.grid2);
		const corners = [[-1.5, PLANE, 1.5], [1.5, PLANE, 1.5], [1.5, PLANE, -1.5], [-1.5, PLANE, -1.5]];
		ctx.beginPath();
		corners.forEach((cc, i) => { const [sx, sy] = proj(cc[0], cc[1], cc[2]); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); });
		ctx.closePath(); ctx.fillStyle = 'rgba(255,230,109,0.09)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,230,109,0.5)'; ctx.lineWidth = 1; ctx.stroke();
		let inC = 0, outC = 0;
		for (const [x, y] of outer) { const z = foldHeight(x, y, t), [sx, sy, d] = proj(x, z, y); ctx.globalAlpha = 0.5 + 0.5 * Math.max(0, Math.min(1, (d + 2) / 4)); ctx.fillStyle = p.outer; ctx.beginPath(); ctx.arc(sx, sy, 2.2, 0, OGT); ctx.fill(); if (z > PLANE) outC++; }
		for (const [x, y] of inner) { const z = foldHeight(x, y, t), [sx, sy, d] = proj(x, z, y); ctx.globalAlpha = 0.55 + 0.45 * Math.max(0, Math.min(1, (d + 2) / 4)); ctx.fillStyle = p.inner; ctx.beginPath(); ctx.arc(sx, sy, 3, 0, OGT); ctx.fill(); if (z <= PLANE) inC++; }
		ctx.globalAlpha = 1;
		const inR = (100 * inC / inner.length), outR = (100 * outC / outer.length);
		ctx.fillStyle = p.muted; ctx.font = '12px monospace';
		ctx.fillText('flat readout plane = the "single straight cut"', 12, 22);
		ctx.fillText('linear recall  inner ' + inR.toFixed(0) + '%   outer ' + outR.toFixed(0) + '%', 12, 40);
	}
	let dragging = false, lx = 0, ly = 0;
	c.style.touchAction = 'none';
	c.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; c.setPointerCapture(e.pointerId); });
	c.addEventListener('pointermove', (e) => { if (!dragging) return; yaw += (e.clientX - lx) * 0.01; pitch += (e.clientY - ly) * 0.01; pitch = Math.max(-1.35, Math.min(1.35, pitch)); lx = e.clientX; ly = e.clientY; drawFold3d(); });
	c.addEventListener('pointerup', () => { dragging = false; });
	c.addEventListener('pointercancel', () => { dragging = false; });
	document.getElementById('og-3d-t').oninput = drawFold3d;
	document.getElementById('og-reset-3d').onclick = () => { yaw = 0.7; pitch = 0.42; drawFold3d(); };
	let anim = null;
	document.getElementById('og-fold-anim').onclick = () => {
		if (anim) cancelAnimationFrame(anim);
		let start = null;
		document.getElementById('og-3d-t').value = 0;
		function step3d(ts) { if (!start) start = ts; const t = Math.min(1, (ts - start) / 2600); document.getElementById('og-3d-t').value = t * 100; drawFold3d(); if (t < 1) anim = requestAnimationFrame(step3d); }
		anim = requestAnimationFrame(step3d);
	};
	drawFold3d();
	OG.redos.push(drawFold3d);
}

/* ------------------------------------------------------------------ Demo 5 */
function ogInitCascade() {
	const c = document.getElementById('og-cascade'); if (!c) return;
	const ctx = c.getContext('2d');
	const W = c.width, H = c.height;
	function hsv2rgb(h, s, v) { const i = Math.floor(h * 6), f = h * 6 - i, pp = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s); let r, g, b; switch (i % 6) { case 0: r = v; g = t; b = pp; break; case 1: r = q; g = v; b = pp; break; case 2: r = pp; g = v; b = t; break; case 3: r = pp; g = q; b = v; break; case 4: r = t; g = pp; b = v; break; case 5: r = v; g = pp; b = q; break; } return [r * 255 | 0, g * 255 | 0, b * 255 | 0]; }
	function drawCascade() {
		const L = +document.getElementById('og-cas-l').value, N = +document.getElementById('og-cas-n').value;
		ogSet('og-cas-l-v', L); ogSet('og-cas-n-v', N);
		let seed = 12345; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 - 0.5; }
		const layers = [];
		for (let l = 0; l < L; l++) { const inS = l === 0 ? 2 : N, Wt = [], b = []; for (let i = 0; i < N; i++) { const row = []; for (let j = 0; j < inS; j++) row.push(rnd() * 2); Wt.push(row); b.push(rnd() * 0.8); } layers.push({ W: Wt, b }); }
		const wOut = []; for (let i = 0; i < N; i++) wOut.push(rnd() * 2);
		function forward(x, y) { let a = [x, y]; for (const { W, b } of layers) { const na = []; for (let i = 0; i < W.length; i++) { let s = b[i]; for (let j = 0; j < W[i].length; j++) s += W[i][j] * a[j]; na.push(Math.max(0, s)); } a = na; } let s = 0; for (let i = 0; i < a.length; i++) s += wOut[i] * a[i]; return s; }
		const p = OG.pal();
		const img = ctx.createImageData(W, H);
		const cx = W / 2, cy = H / 2, SC = 120;
		for (let py = 0; py < H; py += 2) for (let px = 0; px < W; px += 2) {
			const x = (px - cx) / SC, y = (cy - py) / SC, v = forward(x, y);
			const hue = ((Math.floor(v * 3) * 47) % 360 + 360) % 360;
			const rgb = hsv2rgb(hue / 360, p.dark ? 0.5 : 0.4, v > 0 ? (p.dark ? 0.55 : 0.7) : (p.dark ? 0.16 : 0.9));
			for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const idx = ((py + dy) * W + (px + dx)) * 4; img.data[idx] = rgb[0]; img.data[idx + 1] = rgb[1]; img.data[idx + 2] = rgb[2]; img.data[idx + 3] = 255; }
		}
		ctx.putImageData(img, 0, 0);
		const regions = Math.pow(N, L);
		document.getElementById('og-cas-out').innerHTML = 'Upper bound on linear regions ≈ N<sup>L</sup> = ' + N + '<sup>' + L + '</sup> = <b>' + regions + '</b> — depth multiplies boundaries exponentially, not additively.';
	}
	document.getElementById('og-cas-l').oninput = drawCascade;
	document.getElementById('og-cas-n').oninput = drawCascade;
	drawCascade();
	OG.redos.push(drawCascade);
}

/* ------------------------------------------------------------------ Demo 6 */
function ogInitShear() {
	const c = document.getElementById('og-shear'); if (!c) return;
	const ctx = c.getContext('2d');
	const W = c.width, H = c.height, cx = W / 2, cy = H / 2, SC = 95;
	const inner = [], outer = [];
	for (let i = 0; i < 80; i++) { const a = Math.random() * OGT, r = 0.15 + Math.random() * 0.15; inner.push({ x: Math.cos(a) * r, y: Math.sin(a) * r }); }
	for (let i = 0; i < 210; i++) { const a = Math.random() * OGT, r = 0.65 + Math.random() * 0.32; outer.push({ x: Math.cos(a) * r, y: Math.sin(a) * r }); }
	let step = 0;
	function peel(pt, L) {
		let x = pt.x, y = pt.y;
		for (let k = 0; k < L; k++) { const a = k * OGT / Math.max(6, L + 2), nx = Math.cos(a), ny = Math.sin(a), bias = 0.32, pre = nx * x + ny * y - bias; if (pre > 0) { const tx = -ny, ty = nx; x -= pre * nx * 0.9; y -= pre * ny * 0.9; x += pre * tx * 0.6; y += pre * ty * 0.6; } }
		return { x, y };
	}
	function drawShear() {
		const p = OG.pal();
		const L = +document.getElementById('og-shear-l').value;
		ogSet('og-shear-l-v', L);
		ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);
		ctx.strokeStyle = p.grid; ctx.lineWidth = 1;
		for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(cx + i * SC / 2, 0); ctx.lineTo(cx + i * SC / 2, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, cy + i * SC / 2); ctx.lineTo(W, cy + i * SC / 2); ctx.stroke(); }
		ctx.strokeStyle = 'rgba(255,230,109,0.35)'; ctx.lineWidth = 1;
		for (let k = 0; k < L; k++) { const a = k * OGT / Math.max(6, L + 2), nx = Math.cos(a), ny = Math.sin(a), bias = 0.32, tx = -ny, ty = nx; ctx.beginPath(); ctx.moveTo(cx + (bias * nx - tx * 3) * SC, cy - (bias * ny - ty * 3) * SC); ctx.lineTo(cx + (bias * nx + tx * 3) * SC, cy - (bias * ny + ty * 3) * SC); ctx.stroke(); }
		for (const q of inner) { const q2 = peel(q, L); ctx.fillStyle = p.inner; ctx.beginPath(); ctx.arc(cx + q2.x * SC, cy - q2.y * SC, 3, 0, OGT); ctx.fill(); }
		for (const q of outer) { const q2 = peel(q, L); ctx.fillStyle = p.outer; ctx.beginPath(); ctx.arc(cx + q2.x * SC, cy - q2.y * SC, 2.5, 0, OGT); ctx.fill(); }
		ctx.strokeStyle = p.fold; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(cx - 1.5 * SC, cy - 0.4 * SC); ctx.lineTo(cx + 1.5 * SC, cy - 0.4 * SC); ctx.stroke(); ctx.setLineDash([]);
		ctx.fillStyle = p.muted; ctx.font = '11px monospace';
		ctx.fillText('after ' + L + ' peeling layer(s).  Folding solves the same egg in ONE layer (3 neurons).', 10, 20);
		document.getElementById('og-shear-out').textContent = 'Only one slice per layer → ' + L + ' layers needed. Without spare dimensions, separability is painfully deep.';
	}
	document.getElementById('og-shear-l').oninput = drawShear;
	document.getElementById('og-shear-step').onclick = () => { step = (step % 12) + 1; document.getElementById('og-shear-l').value = step; drawShear(); };
	drawShear();
	OG.redos.push(drawShear);
}

/* ------------------------------------------------------------------ Demo 7 */
function ogInitTuning() {
	const el = document.getElementById('og-tuning'); if (!el) return;
	const N = 900, data = [];
	for (let i = 0; i < N; i++) { const a = Math.random() * OGT; let r, cls; const u = Math.random(); if (u < 0.25) { r = 0.15 + Math.random() * 0.15; cls = 0; } else if (u < 0.55) { r = 0.45 + Math.random() * 0.15; cls = 1; } else { r = 0.8 + Math.random() * 0.3; cls = 2; } data.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, cls }); }
	const colors = ['#ff6b9d', '#ffe66d', '#4ecdc4'], names = ['inner', 'middle', 'outer'];
	function drawTuning() {
		const p = OG.pal(), pp = OG.plotPal();
		const ang = (+document.getElementById('og-tune-a').value) * Math.PI / 180;
		const bias = +document.getElementById('og-tune-b').value;
		ogSet('og-tune-a-v', (ang * 180 / Math.PI).toFixed(0) + '°'); ogSet('og-tune-b-v', bias.toFixed(2));
		const nx = Math.cos(ang), ny = Math.sin(ang);
		const byCls = [[], [], []];
		for (const q of data) byCls[q.cls].push(nx * q.x + ny * q.y - bias);
		function dipScore(arr) { const w = 0.15; let inside = 0, near = 0; for (const z of arr) { if (Math.abs(z) < w) inside++; if (Math.abs(z) < 3 * w) near++; } const d0 = inside / arr.length / (2 * w), dN = near / arr.length / (6 * w); return dN > 0 ? (dN - d0) / dN : 0; }
		const traces = byCls.map((arr, i) => ({ x: arr, type: 'histogram', name: 'class: ' + names[i], opacity: 0.6, marker: { color: colors[i] }, nbinsx: 40, xbins: { start: -2.5, end: 2.5, size: 0.1 } }));
		Plotly.react(el, traces, {
			barmode: 'overlay', paper_bgcolor: pp.paper, plot_bgcolor: pp.plot,
			font: { color: pp.font, size: 11 },
			xaxis: { title: 'preactivation z', gridcolor: pp.grid, zerolinecolor: pp.axis, zerolinewidth: 2 },
			yaxis: { title: 'frequency', gridcolor: pp.grid },
			margin: { l: 52, r: 16, t: 16, b: 42 }, legend: { orientation: 'h', y: 1.12 },
			shapes: [{ type: 'line', x0: 0, x1: 0, y0: 0, y1: 1, yref: 'paper', line: { color: p.fold, width: 2, dash: 'dash' } }]
		}, { displayModeBar: false });
		const dips = byCls.map(dipScore);
		document.getElementById('og-dip-out').innerHTML = 'Bimodality score (positive = a dip at 0 = the fold separates that class): ' + dips.map((d, i) => '<span style="color:' + colors[i] + '">' + names[i] + ': ' + d.toFixed(2) + '</span>').join(' &nbsp; ');
	}
	document.getElementById('og-tune-a').oninput = drawTuning;
	document.getElementById('og-tune-b').oninput = drawTuning;
	drawTuning();
	OG.redos.push(drawTuning);
}

/* ------------------------------------------------------------------ Demo 8 */
function ogInitPoker() {
	const dEl = document.getElementById('og-dim'), dipEl = document.getElementById('og-dip'), silEl = document.getElementById('og-silence');
	if (!dEl || !dipEl || !silEl) return;
	function drawPoker() {
		const pp = OG.plotPal();
		const epochs = []; for (let i = 0; i <= 100; i += 2) epochs.push(i);
		const dimIn = epochs.map(() => 10);
		const dimL1 = epochs.map((e) => 4 + 8 * (1 - Math.exp(-e / 25)) + Math.random() * 0.4);
		const dimL2 = epochs.map((e) => 4 + 14 * (1 - Math.exp(-e / 30)) + Math.random() * 0.4);
		Plotly.react(dEl, [
			{ x: epochs, y: dimIn, name: 'input (10-D)', line: { color: pp.axis, dash: 'dot' } },
			{ x: epochs, y: dimL1, name: 'layer 1', line: { color: '#ff6b9d', width: 3 } },
			{ x: epochs, y: dimL2, name: 'layer 2', line: { color: '#4ecdc4', width: 3 } }
		], {
			title: { text: 'Representation dimensionality rises (folds open new axes)', font: { color: pp.font, size: 12 } },
			paper_bgcolor: pp.paper, plot_bgcolor: pp.plot, font: { color: pp.font, size: 11 },
			xaxis: { title: 'epoch', gridcolor: pp.grid }, yaxis: { title: 'effective dim.', gridcolor: pp.grid },
			margin: { l: 48, r: 16, t: 44, b: 40 }, legend: { orientation: 'h', y: -0.22 }
		}, { displayModeBar: false });
		const un = []; for (let i = 0; i < 120; i++) un.push(Math.max(0, 0.02 + Math.random() * 0.03));
		const tr = []; for (let i = 0; i < 120; i++) tr.push(Math.random() < 0.35 ? 0.05 + Math.random() * 0.12 : Math.max(0, 0.02 + Math.random() * 0.03));
		Plotly.react(dipEl, [
			{ x: un, type: 'histogram', name: 'untrained', opacity: 0.6, marker: { color: pp.axis }, nbinsx: 25 },
			{ x: tr, type: 'histogram', name: 'trained', opacity: 0.8, marker: { color: '#ff6b9d' }, nbinsx: 25 }
		], {
			title: { text: 'Hartigan dip (bimodality) grows during training', font: { color: pp.font, size: 12 } },
			barmode: 'overlay', paper_bgcolor: pp.paper, plot_bgcolor: pp.plot, font: { color: pp.font, size: 11 },
			xaxis: { title: 'dip value (larger = more bimodal)', gridcolor: pp.grid }, yaxis: { title: '# neurons', gridcolor: pp.grid },
			margin: { l: 48, r: 16, t: 44, b: 40 }, legend: { orientation: 'h', y: -0.22 }
		}, { displayModeBar: false });
		Plotly.react(silEl, [{
			x: ['intact', 'silence 10 random', 'silence 10 unimodal', 'silence 10 BIMODAL'],
			y: [0.97, 0.91, 0.94, 0.58], type: 'bar',
			marker: { color: ['#4ecdc4', pp.axis, '#8a8a8a', '#ff6b9d'] },
			text: ['97%', '91%', '94%', '58%'], textposition: 'auto'
		}], {
			title: { text: 'Causality: which neurons carry the work? (illustrative)', font: { color: pp.font, size: 12 } },
			paper_bgcolor: pp.paper, plot_bgcolor: pp.plot, font: { color: pp.font, size: 11 },
			yaxis: { title: 'macro-F1', gridcolor: pp.grid, range: [0, 1.05] }, xaxis: { gridcolor: pp.grid },
			margin: { l: 48, r: 16, t: 44, b: 70 }
		}, { displayModeBar: false });
	}
	drawPoker();
	OG.redos.push(drawPoker);
}

/* ------------------------------------------------------------------ Demo: fold-and-cut (opener) */
function ogInitFC() {
	const c = document.getElementById('og-fc'); if (!c) return;
	const ctx = c.getContext('2d');
	const W = c.width, H = c.height;
	const film = document.getElementById('og-fc-film');
	const fctx = film ? film.getContext('2d') : null;
	function regPoly(n, R) { const v = []; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * OGT / n; v.push([Math.cos(a) * R, Math.sin(a) * R]); } return v; }
	function star(R) { const v = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const r = i % 2 === 0 ? R : R * 0.45; v.push([Math.cos(a) * r, Math.sin(a) * r]); } return v; }
	const SHAPES = { tri: () => regPoly(3, 0.72), square: () => regPoly(4, 0.6), pent: () => regPoly(5, 0.66), star: () => star(0.78) };
	const AXES = { tri: [30, 90, 150], square: [0, 45, 90, 135], pent: [18, 54, 90, 126], star: [18, 54, 90, 126] };
	let shape = SHAPES.tri(), axisList = AXES.tri.slice();
	let step = 0, animScale = 1, animRot = 0, targetScale = 1, targetRot = 0, cutState = 'idle', cutProg = 0, rafId = null;

	function clipHP(poly, n, cc) {
		const out = [];
		for (let i = 0; i < poly.length; i++) {
			const A = poly[i], B = poly[(i + 1) % poly.length];
			const da = n[0] * A[0] + n[1] * A[1] - cc, db = n[0] * B[0] + n[1] * B[1] - cc;
			if (da <= 0) out.push(A);
			if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const t = da / (da - db); out.push([A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])]); }
		}
		return out;
	}
	function polyArea(p) { let a = 0; for (let i = 0; i < p.length; i++) { const j = (i + 1) % p.length; a += p[i][0] * p[j][1] - p[j][0] * p[i][1]; } return Math.abs(a) / 2; }
	function clipToPoly(poly, region) {
		let out = poly;
		let cxr = 0, cyr = 0; for (const p of region) { cxr += p[0]; cyr += p[1]; } cxr /= region.length; cyr /= region.length;
		for (let i = 0; i < region.length; i++) {
			const A = region[i], B = region[(i + 1) % region.length];
			let nx = cxr - (A[0] + B[0]) / 2, ny = cyr - (A[1] + B[1]) / 2; const len = Math.hypot(nx, ny);
			if (len < 1e-12) continue;
			nx /= len; ny /= len;
			out = clipHP(out, [-nx, -ny], -(nx * A[0] + ny * A[1]));
			if (out.length < 3) return out;
		}
		return out;
	}
	const mVec = (m, p) => [m[0][0] * p[0] + m[0][1] * p[1], m[1][0] * p[0] + m[1][1] * p[1]];
	const mMul = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
	const refM = a => { const t = 2 * a; return [[Math.cos(t), Math.sin(t)], [Math.sin(t), -Math.cos(t)]]; };
	let FRAGS = [];
	function rebuildFrags() {
		FRAGS = [[{ poly: [[-1, -1], [1, -1], [1, 1], [-1, 1]], g: [[1, 0], [0, 1]] }]];
		for (const ax of axisList) {
			const a = ax * Math.PI / 180, M = refM(a), n = [-Math.sin(a), Math.cos(a)];
			const next = [];
			for (const f of FRAGS[FRAGS.length - 1]) {
				const keep = clipHP(f.poly, n, 0), flap = clipHP(f.poly, [-n[0], -n[1]], 0);
				const big = polyArea(keep) >= polyArea(flap) ? [keep, f.g] : [flap, f.g];
				const small = polyArea(keep) >= polyArea(flap) ? [flap, f.g] : [keep, f.g];
				if (small[0].length >= 3 && polyArea(small[0]) > 1e-9) next.push({ poly: small[0], g: small[1] });
				if (big[0].length >= 3 && polyArea(big[0]) > 1e-9) next.push({ poly: big[0].map(p => mVec(M, p)), g: mMul(M, big[1]) });
			}
			FRAGS.push(next);
		}
	}
	function polyPath(g2, poly, s) { g2.beginPath(); poly.forEach((p, i) => { const x = p[0] * s, y = p[1] * s; i === 0 ? g2.moveTo(x, y) : g2.lineTo(x, y); }); g2.closePath(); }
	function paperColors() { const p = OG.pal(); return { fill: p.dark ? '#f4efe3' : '#ffffff', stroke: p.dark ? '#b8ad94' : '#c9bd9c' }; }
	function drawFrags(g2, s, k) {
		const pc = paperColors();
		const frags = FRAGS[k] || FRAGS[0];
		for (const f of frags) { polyPath(g2, f.poly, s); g2.fillStyle = pc.fill; g2.fill(); g2.strokeStyle = pc.stroke; g2.lineWidth = 1.5; g2.stroke(); }
		for (const f of frags) {
			const cl = clipToPoly(shape, f.poly);
			if (cl.length >= 3) { polyPath(g2, cl, s); g2.strokeStyle = k === 0 ? 'rgba(78,205,196,0.9)' : '#ffe66d'; g2.lineWidth = k === 0 ? 2 : 2.5; g2.stroke(); }
		}
	}
	function drawFilmstrip() {
		if (!fctx) return;
		const maxF = Math.min(4, axisList.length);
		const rows = Math.ceil((maxF + 1) / 2);
		if (film.height !== rows * 220) film.height = rows * 220;
		const Wf = film.width, Hf = film.height;
		const p = OG.pal();
		fctx.fillStyle = p.bg; fctx.fillRect(0, 0, Wf, Hf);
		const pw = Wf / 2, ph = Hf / rows;
		for (let k = 0; k <= maxF; k++) {
			const col = k % 2, row = Math.floor(k / 2);
			const cx = col * pw + pw / 2, cy = row * ph + ph / 2 + 12, s = 72;
			fctx.textAlign = 'center'; fctx.fillStyle = p.muted; fctx.font = '13px sans-serif';
			fctx.fillText(k === 0 ? '0 · flat sheet (1 layer)' : ('fold ' + k + ' · ' + FRAGS[k].length + ' paper pieces'), cx, row * ph + 24);
			fctx.save(); fctx.translate(cx, cy);
			drawFrags(fctx, s, k);
			if (k >= 1) { const a = axisList[k - 1] * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a);
				fctx.strokeStyle = p.bad; fctx.setLineDash([5, 4]); fctx.lineWidth = 1.2;
				fctx.beginPath(); fctx.moveTo(-dx * 105, -dy * 105); fctx.lineTo(dx * 105, dy * 105); fctx.stroke(); fctx.setLineDash([]); }
			fctx.restore();
			if (k === step) { fctx.strokeStyle = p.accent; fctx.lineWidth = 2; fctx.strokeRect(col * pw + 3, row * ph + 3, pw - 6, ph - 6); }
		}
		fctx.textAlign = 'left';
	}
	function statusText() {
		const st = document.getElementById('og-fc-status'); if (!st) return;
		if (cutState === 'cutting') { st.textContent = '✂ Cutting…'; return; }
		if (cutState === 'done') { st.textContent = '✂ Unfolded: the shape is isolated (dashed line = the cut)'; return; }
		st.textContent = step === 0 ? 'Step 0: shape drawn — any polygon works' : ('Step ' + step + ': ' + step + ' fold(s) → ' + FRAGS[step].length + ' paper layers, edges stack up');
	}
	function drawShapePath(layer, s, close) {
		ctx.beginPath();
		layer.forEach((p, i) => { const x = p[0] * s, y = p[1] * s; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
		if (close) ctx.closePath();
	}
	function drawFC() {
		const p = OG.pal();
		animScale += (targetScale - animScale) * 0.15; animRot += (targetRot - animRot) * 0.15;
		if (cutState === 'cutting') { cutProg += 0.035; if (cutProg >= 1) { cutProg = 1; cutState = 'done'; } }
		ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);
		const cx = W / 2, cy = H / 2 + 24, s = 130 * animScale, P = 160 * animScale;
		const pc = paperColors();
		if (cutState === 'done') {
			ctx.save(); ctx.translate(cx, cy);
			ctx.globalAlpha = 0.25; ctx.fillStyle = pc.fill; ctx.fillRect(-P, -P, P * 2, P * 2); ctx.globalAlpha = 1;
			ctx.fillStyle = 'rgba(124,249,208,0.18)'; drawShapePath(shape, s, true); ctx.fill();
			ctx.strokeStyle = p.accent; ctx.lineWidth = 3.5; ctx.setLineDash([10, 7]); drawShapePath(shape, s, true); ctx.stroke(); ctx.setLineDash([]);
			ctx.fillStyle = p.accent; ctx.font = 'bold 14px sans-serif'; ctx.fillText('✂ Shape cut out', -P * 0.9, -P - 6);
			ctx.restore();
		} else {
			ctx.save(); ctx.translate(cx, cy); ctx.rotate(animRot * Math.PI / 180);
			drawFrags(ctx, s, step);
			ctx.strokeStyle = p.bad; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5;
			for (let i = 0; i < step; i++) { const ax = axisList[i] * Math.PI / 180; const nx = Math.cos(ax), ny = Math.sin(ax); ctx.beginPath(); ctx.moveTo(nx * 300, ny * 300); ctx.lineTo(-nx * 300, -ny * 300); ctx.stroke(); }
			ctx.setLineDash([]);
			if (step >= 1) {
				const a0 = shape[0], a1 = shape[1], dx = a1[0] - a0[0], dy = a1[1] - a0[1];
				const len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, L = 1.2, prog = cutState === 'cutting' ? cutProg : 1;
				const px = a0[0] * s, py = a0[1] * s;
				ctx.strokeStyle = p.bad; ctx.lineWidth = 3.5; ctx.setLineDash([10, 7]);
				ctx.beginPath(); ctx.moveTo(px - ux * L * s, py - uy * L * s); ctx.lineTo(px - ux * L * s * (1 - prog) + ux * L * s * prog * 2, py - uy * L * s * (1 - prog) + uy * L * s * prog * 2); ctx.stroke(); ctx.setLineDash([]);
				ctx.fillStyle = p.bad; ctx.font = 'bold 13px sans-serif'; ctx.fillText('✂ ONE straight cut', -P * 0.9, -P - 6);
			}
			ctx.restore();
		}
		statusText();
	}
	function settled() { return Math.abs(targetScale - animScale) < 0.001 && Math.abs(targetRot - animRot) < 0.01 && cutState !== 'cutting'; }
	function frame() { drawFC(); rafId = settled() ? null : requestAnimationFrame(frame); }
	function ensureLoop() { if (rafId === null) rafId = requestAnimationFrame(frame); }
	function setStep(k) { step = Math.max(0, Math.min(FRAGS.length - 1, k)); const sl = document.getElementById('og-fc-step'); if (sl) sl.value = step; ogSet('og-fc-step-v', step);
		targetScale = Math.pow(0.86, step); targetRot = step * 14; cutState = 'idle'; cutProg = 0; drawFilmstrip(); ensureLoop(); }
	function setShape(name) { shape = SHAPES[name](); axisList = AXES[name].slice(); const maxF = Math.min(4, axisList.length); step = 0; targetScale = 1; targetRot = 0; cutState = 'idle'; cutProg = 0;
		const sl = document.getElementById('og-fc-step'); if (sl) { sl.max = maxF; sl.value = 0; } ogSet('og-fc-step-v', '0'); rebuildFrags(); drawFilmstrip(); ensureLoop(); }
	const shapeSel = document.getElementById('og-fc-shape'); if (shapeSel) shapeSel.onchange = e => setShape(e.target.value);
	const stepSl = document.getElementById('og-fc-step'); if (stepSl) stepSl.oninput = e => setStep(+e.target.value);
	const cutBtn = document.getElementById('og-fc-cut'); if (cutBtn) cutBtn.onclick = () => { if (step < 1) return; cutState = 'cutting'; cutProg = 0; ensureLoop(); };
	const printBtn = document.getElementById('og-fc-print'); if (printBtn) printBtn.onclick = () => window.print();
	setShape(shapeSel ? shapeSel.value : 'tri');
	ensureLoop();
	ogTex('og-fc-formula', String.raw`\underbrace{\text{fold}}_{\text{layers }1\ldots L-1} \;+\; \underbrace{\text{one straight cut}}_{\text{last layer} = \text{hyperplane}} \;=\; \text{any shape (class boundary)}`);
	OG.redos.push(ensureLoop);
}

/* ------------------------------------------------------------------ Demo: affine layer (live W matrix) */
function ogInitAffine() {
	const c = document.getElementById('og-affine'); if (!c) return;
	const ctx = c.getContext('2d');
	let pts = ogMakeEgg(220, 380, 0, 0.30, 0.55, 0.9);
	const sample = { x: 0.35, y: 0.2 };
	function drawAff() {
		const p = OG.pal();
		const thd = +document.getElementById('og-aff-rot').value, th = thd * Math.PI / 180, sx = +document.getElementById('og-aff-sx').value, sy = +document.getElementById('og-aff-sy').value, sh = +document.getElementById('og-aff-sh').value, bx = +document.getElementById('og-aff-bx').value, by = +document.getElementById('og-aff-by').value, useR = document.getElementById('og-aff-relu').checked;
		ogSet('og-aff-rot-v', thd + '°'); ogSet('og-aff-sx-v', ogf1(sx)); ogSet('og-aff-sy-v', ogf1(sy)); ogSet('og-aff-sh-v', ogf1(sh)); ogSet('og-aff-bx-v', ogf1(bx)); ogSet('og-aff-by-v', ogf1(by)); ogSet('og-aff-relu-v', useR ? 'on' : 'off');
		const Wm = ogWmatrix(th, sx, sy, sh);
		const Wx = q => { const a = ogMulMatVec(Wm, [q.x, q.y]); return [a[0] + bx, a[1] + by]; };
		const Wxr = q => { const a = Wx(q); return useR ? [ogRelu(a[0]), ogRelu(a[1])] : a; };
		const Wc = c.width / 2, Hc = c.height / 2, s = 120;
		ctx.fillStyle = p.bg; ctx.fillRect(0, 0, c.width, c.height);
		ctx.strokeStyle = p.grid; ctx.beginPath(); ctx.moveTo(0, Hc); ctx.lineTo(c.width, Hc); ctx.moveTo(Wc, 0); ctx.lineTo(Wc, c.height); ctx.stroke();
		for (const q of pts) { ctx.fillStyle = 'rgba(140,150,180,0.5)'; ctx.beginPath(); ctx.arc(Wc + q.x * s, Hc - q.y * s, 1.5, 0, OGT); ctx.fill(); }
		for (const q of pts) { const r = Wx(q); ctx.fillStyle = p.outer; ctx.beginPath(); ctx.arc(Wc + r[0] * s, Hc - r[1] * s, 1.8, 0, OGT); ctx.fill(); }
		for (const q of pts) { const r = Wxr(q); ctx.fillStyle = p.accent2; ctx.beginPath(); ctx.arc(Wc + r[0] * s, Hc - r[1] * s, 1.8, 0, OGT); ctx.fill(); }
		const spr = Wxr(sample);
		ctx.fillStyle = p.faint; ctx.beginPath(); ctx.arc(Wc + sample.x * s, Hc - sample.y * s, 5, 0, OGT); ctx.fill();
		ctx.strokeStyle = p.fold; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(Wc + sample.x * s, Hc - sample.y * s); ctx.lineTo(Wc + spr[0] * s, Hc - spr[1] * s); ctx.stroke(); ctx.setLineDash([]);
		ctx.fillStyle = p.fold; ctx.beginPath(); ctx.arc(Wc + spr[0] * s, Hc - spr[1] * s, 5, 0, OGT); ctx.fill();
		const smpA = ogMulMatVec(Wm, [sample.x, sample.y]);
		const smpAff = [ogf1(smpA[0] + bx), ogf1(smpA[1] + by)];
		const smpR = useR ? [ogf1(ogRelu(smpA[0] + bx)), ogf1(ogRelu(smpA[1] + by))] : smpAff;
		ogTex('og-aff-live',
			String.raw`\mathbf{W}=\begin{bmatrix} ${ogf1(Wm[0][0])} & ${ogf1(Wm[0][1])}\\ ${ogf1(Wm[1][0])} & ${ogf1(Wm[1][1])}\end{bmatrix}\;\; \mathbf{b}=\begin{bmatrix} ${ogf1(bx)}\\ ${ogf1(by)}\end{bmatrix}\;\;\Rightarrow\; \mathbf{x}'=\mathbf{W}\mathbf{x}+\mathbf{b}\;\;\underset{\mathrm{ReLU}}{\xrightarrow{\;}}\; \mathbf{z}` +
			(useR ? String.raw`\;\;\;\text{e.g. }\mathbf{x}=(0.35,0.2):\ \mathbf{x}'=(${smpAff[0]},\,${smpAff[1]})\to\mathbf{z}=(${smpR[0]},\,${smpR[1]})` : String.raw`\;\;\;\text{e.g. }\mathbf{x}=(0.35,0.2):\ \mathbf{x}'=(${smpAff[0]},\,${smpAff[1]})`)
		);
	}
	['og-aff-rot', 'og-aff-sx', 'og-aff-sy', 'og-aff-sh', 'og-aff-bx', 'og-aff-by', 'og-aff-relu'].forEach(id => { const e = document.getElementById(id); if (e) e.oninput = draw; });
	OG.redos.push(draw);
	OG.regen.push(() => { pts = ogMakeEgg(220, 380, 0, 0.30, 0.55, 0.9); drawFC(); });
	drawFC();
}

/* ------------------------------------------------------------------ Demo: 1-D ReLU (one value, one corner) */
function ogInitRelu1d() {
	const c = document.getElementById('og-relu1d'); if (!c) return;
	const ctx = c.getContext('2d');
	function drawR1d() {
		const p = OG.pal();
		const v = +document.getElementById('og-relu-x').value, y = ogRelu(v);
		ogSet('og-relu-xv', ogf1(v));
		const W = c.width, H = c.height, cx = W / 2, cy = H * 0.78, s = 110;
		ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);
		ctx.strokeStyle = p.grid; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.moveTo(cx, 20); ctx.lineTo(cx, H); ctx.stroke();
		ctx.strokeStyle = p.accent; ctx.lineWidth = 2.5; ctx.beginPath();
		for (let px = 0; px < W; px++) { const x = (px - cx) / s, yy = ogRelu(x); if (px === 0) ctx.moveTo(px, cy - yy * s); else ctx.lineTo(px, cy - yy * s); } ctx.stroke();
		ctx.fillStyle = p.accent2; ctx.beginPath(); ctx.arc(cx + v * s, cy - y * s, 6, 0, OGT); ctx.fill();
		ctx.strokeStyle = p.accent2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(cx + v * s, cy); ctx.lineTo(cx + v * s, cy - y * s); ctx.stroke(); ctx.setLineDash([]);
		ctx.fillStyle = p.ink; ctx.font = '13px sans-serif'; ctx.fillText('x̃ = ' + ogf1(v) + '  →  ReLU(x̃) = ' + ogf1(y), 14, 22);
		ctx.fillStyle = p.muted; ctx.font = '12px sans-serif'; ctx.fillText(v < 0 ? 'Negative is projected to 0 ("hammered")' : 'Positive passes through unchanged', 14, 42);
		ogTex('og-relu-live', String.raw`\tilde x=${ogf1(v)} \;\Rightarrow\; \mathrm{ReLU}(\tilde x)=\max(0,${ogf1(v)})=${ogf1(y)}${v < 0 ? String.raw`\;\;(\text{hammered})` : String.raw`\;\;(\text{unchanged})`}`);
	}
	const sl = document.getElementById('og-relu-x'); if (sl) sl.oninput = draw;
	OG.redos.push(draw);
	drawAff();
}

/* ------------------------------------------------------------------ Demo: circle-in-circle 3-D lift (S4a) */
function ogInitEgg() {
	const c = document.getElementById('og-egg2d'); if (!c) return;
	const ctx = c.getContext('2d');
	let pts = ogMakeEgg(360, 640, 0, 0.34, 0.55, 0.9);
	function draw2d() { const p = OG.pal(); const cx = c.width / 2, cy = c.height / 2, s = 150; ctx.fillStyle = p.bg; ctx.fillRect(0, 0, c.width, c.height);
		for (const q of pts) { ctx.fillStyle = q.cl === 0 ? p.inner : p.outer; ctx.beginPath(); ctx.arc(cx + q.x * s, cy - q.y * s, 1.8, 0, OGT); ctx.fill(); }
		ctx.fillStyle = p.muted; ctx.font = '12px sans-serif'; ctx.fillText('No straight line separates the core from the ring', 14, 22); }
	function zEgg(q, lift, mode) {
		if (mode === 'radial') return lift * Math.max(0, 1 - 2 * Math.hypot(q.x, q.y));
		const N = +mode; let z = Infinity;
		for (let k = 0; k < N; k++) { const a = k * OGT / N; z = Math.min(z, Math.max(0, lift * (1 - 2 * (Math.cos(a) * q.x + Math.sin(a) * q.y)))); }
		return z;
	}
	function drawEgg3d() {
		const p = OG.pal(), pp = OG.plotPal();
		const lift = +document.getElementById('og-egg-lift').value, cPl = +document.getElementById('og-egg-plane').value, mode = document.getElementById('og-egg-mode').value;
		ogSet('og-egg-lift-v', ogf1(lift)); ogSet('og-egg-plane-v', ogf1(cPl));
		const x0 = [], y0 = [], z0 = [], x1 = [], y1 = [], z1 = []; let zInMin = 1e9, zInMax = -1e9, zOutMax = -1e9;
		for (const q of pts) { const z = zEgg(q, lift, mode);
			if (q.cl === 0) { x0.push(q.x); y0.push(q.y); z0.push(z); zInMin = Math.min(zInMin, z); zInMax = Math.max(zInMax, z); } else { x1.push(q.x); y1.push(q.y); z1.push(z); zOutMax = Math.max(zOutMax, z); } }
		const gx = [], gy = [], gz = []; for (let i = -1; i <= 1; i += 0.2) for (let j = -1; j <= 1; j += 0.2) { gx.push(i); gy.push(j); gz.push(cPl); }
		const layout = { paper_bgcolor: pp.paper, plot_bgcolor: pp.plot, font: { color: pp.font }, margin: { l: 0, r: 0, t: 10, b: 0 }, scene: { xaxis: { color: pp.axis, range: [-1, 1] }, yaxis: { color: pp.axis, range: [-1, 1] }, zaxis: { color: pp.axis, range: [-0.1, 1.65] } }, showlegend: false };
		const cam = ogKeepCam('og-egg3d'); if (cam) layout.scene.camera = cam;
		Plotly.react('og-egg3d', [
			{ x: x1, y: y1, z: z1, mode: 'markers', type: 'scatter3d', marker: { size: 2.2, color: p.outer }, name: 'outer' },
			{ x: x0, y: y0, z: z0, mode: 'markers', type: 'scatter3d', marker: { size: 2.4, color: p.inner }, name: 'inner' },
			{ x: gx, y: gy, z: gz, mode: 'markers', type: 'scatter3d', marker: { size: 1.6, color: p.fold, opacity: 0.3 }, name: 'plane' }
		], layout, { displayModeBar: false });
		const sep = cPl > zOutMax && cPl < zInMin;
		const v = document.getElementById('og-egg-verdict'); if (v) { v.textContent = sep ? 'plane separates ✓' : 'plane does not separate ✗'; v.className = 'og-verdict ' + (sep ? 'ok' : 'no'); }
		ogTex('og-egg-f1', String.raw`z(x,y) = ${ogf1(lift)}\cdot\max\bigl(0,\,1-2\lVert(x,y)\rVert\bigr) \;\;(\text{apex } z=L=${ogf1(lift)}),\;\; \text{separable if } c\in\bigl(${ogf1(zOutMax)},\,${ogf1(zInMin)}\bigr)`);
		ogTex('og-egg-f2', String.raw`z = \mathrm{ReLU}(W\cdot x + B),\quad W = -2L\,\hat{u} = \bigl(${ogf1(-2 * lift)},\,0\bigr),\; B = L = ${ogf1(lift)} \;\;\Rightarrow\; \text{for } \hat{u}=(1,0):\; z = \mathrm{ReLU}\bigl(${ogf1(-2 * lift)}\,x + ${ogf1(lift)}\bigr)`);
		if (mode === 'radial') {
			ogTex('og-egg-f3', String.raw`z = \min_{k=1}^{N} \mathrm{ReLU}\bigl(L - 2L\,(\hat{u}_k \cdot x)\bigr),\;\; \hat{u}_k = N \text{ circle directions} \;\;\Rightarrow\; N\text{-gon dome (exactly radial as } N\to\infty)`);
		} else {
			ogTex('og-egg-f3', String.raw`z = \min_{k=1}^{${mode}} \mathrm{ReLU}\bigl(${ogf1(lift)} - ${ogf1(2 * lift)}\,(\hat{u}_k \cdot x)\bigr) \;\;\leftarrow \text{this plot: ${mode} neurons, computed live`);
		}
	}
	['og-egg-lift', 'og-egg-plane'].forEach(id => { const e = document.getElementById(id); if (e) e.oninput = drawEgg3d; });
	const modeEl = document.getElementById('og-egg-mode'); if (modeEl) modeEl.onchange = drawEgg3d;
	OG.redos.push(() => { draw2d(); draw3d(); });
	OG.regen.push(() => { pts = ogMakeEgg(360, 640, 0, 0.34, 0.55, 0.9); draw2d(); draw3d(); });
	draw2d(); draw3d();
}

/* ------------------------------------------------------------------ Demo: learned rotation + hammer (S4b) */
function ogInitRot() {
	const c = document.getElementById('og-rot2d'); if (!c) return;
	const ctx = c.getContext('2d');
	const PHI = 90 * Math.PI / 180;
	let pts = [];
	function genPts() { pts = [];
		for (let i = 0; i < 240; i++) { const a = PHI + (Math.random() - 0.5) * (76 * Math.PI / 180), r = 0.3 + Math.random() * 0.7; pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, cl: 1 }); }
		for (let i = 0; i < 240; i++) { const a = PHI + Math.PI + (Math.random() - 0.5) * (76 * Math.PI / 180), r = 0.3 + Math.random() * 0.7; pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, cl: 0 }); } }
	genPts();
	function drawRot() {
		const p = OG.pal(), pp = OG.plotPal();
		const thd = +document.getElementById('og-rot-th').value, th = thd * Math.PI / 180;
		const cs = Math.cos(th), sn = Math.sin(th);
		const rot = q => [q.x * cs - q.y * sn, q.x * sn + q.y * cs];
		ogSet('og-rot-th-v', thd + '°');
		const W = c.width, H = c.height, cx = W / 2, cy = H / 2, s = 170;
		ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);
		ctx.strokeStyle = p.grid; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
		ctx.strokeStyle = p.ink; ctx.lineWidth = 2; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(cx, 10); ctx.lineTo(cx, H - 10); ctx.stroke(); ctx.setLineDash([]);
		for (const q of pts) { const r = rot(q); ctx.fillStyle = q.cl === 0 ? p.inner : p.outer; ctx.beginPath(); ctx.arc(cx + r[0] * s, cy - r[1] * s, 2, 0, OGT); ctx.fill(); }
		const mx = Math.cos(PHI), my = Math.sin(PHI); const nrm = [mx * cs - my * sn, mx * sn + my * cs];
		const tx = -nrm[1], ty = nrm[0];
		ctx.strokeStyle = p.fold; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - tx * 300, cy + ty * 300); ctx.lineTo(cx + tx * 300, cy - ty * 300); ctx.stroke();
		let min1 = 1e9, max1 = -1e9, min0 = 1e9, max0 = -1e9;
		for (const q of pts) { const r = rot(q); if (q.cl === 1) { min1 = Math.min(min1, r[0]); max1 = Math.max(max1, r[0]); } else { min0 = Math.min(min0, r[0]); max0 = Math.max(max0, r[0]); } }
		const sep = (min1 > 0 && max0 < 0) || (max1 < 0 && min0 > 0);
		const v = document.getElementById('og-rot-verdict'); if (v) { v.textContent = sep ? 'ReLU separates ✓' : 'not yet ✗'; v.className = 'og-verdict ' + (sep ? 'ok' : 'no'); }
		ogTex('og-rot-f1', String.raw`z = \mathrm{ReLU}(x'),\quad x' = R(\theta)\,\mathbf{x} \;\;(\text{fold line } x'=0 \text{ fixed; data rotated by } \theta=${ogf0(thd)}^\circ)`);
		const t = x => Math.abs(x) < 0.005 ? '' : (x < 0 ? '\\,-\\,' : '\\,+\\,') + ogf1(Math.abs(x));
		ogTex('og-rot-f2', String.raw`z = \mathrm{ReLU}(\mathbf{W}\,\mathbf{x}+c),\quad \mathbf{W} = \begin{bmatrix}1&0\end{bmatrix}\,R(\theta) = (\cos\theta,\,-\sin\theta) = \bigl(${ogf1(cs)},\,${ogf1(-sn)}\bigr),\; c=0 \;\Rightarrow\; z=\mathrm{ReLU}\bigl(${ogf1(cs)}\,x${t(-sn)}y\bigr)`);
		const x0 = [], y0 = [], z0 = [], x1 = [], y1 = [], z1 = [];
		for (const q of pts) { const xr = q.x * cs - q.y * sn, yr = q.x * sn + q.y * cs, z = ogRelu(xr);
			if (q.cl === 0) { x0.push(xr); y0.push(yr); z0.push(z); } else { x1.push(xr); y1.push(yr); z1.push(z); } }
		const gx = [], gy = [], gz = []; for (let i = -1; i <= 1; i += 0.2) for (let j = -1; j <= 1; j += 0.2) { gx.push(i); gy.push(j); gz.push(0); }
		const layout = { paper_bgcolor: pp.paper, plot_bgcolor: pp.plot, font: { color: pp.font }, margin: { l: 0, r: 0, t: 10, b: 0 }, scene: { xaxis: { color: pp.axis, range: [-1.05, 1.05] }, yaxis: { color: pp.axis, range: [-1.05, 1.05] }, zaxis: { color: pp.axis, range: [-0.1, 1.15] } }, showlegend: false };
		const cam = ogKeepCam('og-rot3d'); if (cam) layout.scene.camera = cam;
		Plotly.react('og-rot3d', [
			{ x: x1, y: y1, z: z1, mode: 'markers', type: 'scatter3d', marker: { size: 2.2, color: p.outer }, name: 'B' },
			{ x: x0, y: y0, z: z0, mode: 'markers', type: 'scatter3d', marker: { size: 2.2, color: p.inner }, name: 'A' },
			{ x: gx, y: gy, z: gz, mode: 'markers', type: 'scatter3d', marker: { size: 1.5, color: p.fold, opacity: 0.3 }, name: 'fold z=0' }
		], layout, { displayModeBar: false });
	}
	const sl = document.getElementById('og-rot-th'); if (sl) sl.oninput = draw;
	OG.redos.push(draw);
	OG.regen.push(() => { genPts(); drawRot(); });
	drawRot();
}

/* ------------------------------------------------------------------ Demo: 2-D egg with 3 neurons (Fig. 2) */
function ogInitEgg3() {
	const top = document.getElementById('og-egg3top'); if (!top) return;
	const tctx = top.getContext('2d');
	const d = 0.25;
	let N = 3, fs = 1;
	let pts = ogMakeEgg(400, 700, 0, 0.22, 0.70, 0.92);
	function normals() { const arr = []; for (let k = 0; k < N; k++) { const ang = k * OGT / N; arr.push([Math.cos(ang), Math.sin(ang)]); } return arr; }
	function zEgg3(x, y) { let z = 0; for (const n of normals()) z += Math.max(0, n[0] * x + n[1] * y - d) * fs; return z; }
	function drawTop(p) {
		const W = top.width, H = top.height, cx = W / 2, cy = H / 2, s = 150;
		tctx.fillStyle = p.bg; tctx.fillRect(0, 0, W, H);
		tctx.strokeStyle = p.grid; tctx.beginPath(); tctx.moveTo(0, cy); tctx.lineTo(W, cy); tctx.moveTo(cx, 0); tctx.lineTo(cx, H); tctx.stroke();
		tctx.strokeStyle = p.fold; tctx.lineWidth = 2;
		for (const n of normals()) { const nx = n[0], ny = n[1], tx = -ny, ty = nx, x0 = nx * d * s, y0 = ny * d * s;
			tctx.beginPath(); tctx.moveTo(cx + x0 - tx * 220, cy - (y0 - ty * 220)); tctx.lineTo(cx + x0 + tx * 220, cy - (y0 + ty * 220)); tctx.stroke(); }
		for (const q of pts) { tctx.fillStyle = q.cl === 0 ? p.inner : p.outer; tctx.beginPath(); tctx.arc(cx + q.x * s, cy - q.y * s, 1.8, 0, OGT); tctx.fill(); }
		tctx.fillStyle = p.muted; tctx.font = '12px sans-serif'; tctx.fillText(N + ' fold lines (hyperplanes): core inside, ring outside', 14, 22);
	}
	function drawEgg3f() {
		const p = OG.pal(), pp = OG.plotPal();
		const cPl = +document.getElementById('og-egg3-plane').value;
		ogSet('og-egg3-n-v', N); ogSet('og-egg3-fs-v', ogf1(fs)); ogSet('og-egg3-plane-v', ogf1(cPl));
		const x0 = [], y0 = [], z0 = [], x1 = [], y1 = [], z1 = []; let zInMax = -1e9, zOutMin = 1e9;
		for (const q of pts) { const z = zEgg3(q.x, q.y);
			if (q.cl === 0) { x0.push(q.x); y0.push(q.y); z0.push(z); zInMax = Math.max(zInMax, z); } else { x1.push(q.x); y1.push(q.y); z1.push(z); zOutMin = Math.min(zOutMin, z); } }
		const gx = [], gy = [], gz = []; for (let i = -1; i <= 1; i += 0.2) for (let j = -1; j <= 1; j += 0.2) { gx.push(i); gy.push(j); gz.push(cPl); }
		const layout = { paper_bgcolor: pp.paper, plot_bgcolor: pp.plot, font: { color: pp.font }, margin: { l: 0, r: 0, t: 10, b: 0 }, scene: { xaxis: { color: pp.axis }, yaxis: { color: pp.axis }, zaxis: { color: pp.axis, title: 'Z (free dim.)' } }, showlegend: false };
		const cam = ogKeepCam('og-egg3fold'); if (cam) layout.scene.camera = cam;
		Plotly.react('og-egg3fold', [
			{ x: x1, y: y1, z: z1, mode: 'markers', type: 'scatter3d', marker: { size: 2, color: p.outer }, name: 'outer' },
			{ x: x0, y: y0, z: z0, mode: 'markers', type: 'scatter3d', marker: { size: 2.3, color: p.inner }, name: 'inner' },
			{ x: gx, y: gy, z: gz, mode: 'markers', type: 'scatter3d', marker: { size: 1.6, color: p.fold, opacity: 0.3 }, name: 'plane' }
		], layout, { displayModeBar: false });
		const sep = cPl > zInMax && cPl < zOutMin;
		const v = document.getElementById('og-egg3-verdict'); if (v) { v.textContent = sep ? 'plane separates ✓' : 'plane does not separate ✗'; v.className = 'og-verdict ' + (sep ? 'ok' : 'no'); }
		const ns = normals(); let rows = ''; const M = Math.min(N, 4);
		for (let k = 0; k < M; k++) { const n = ns[k]; rows += String.raw`\mathbf{w}_{${k + 1}}=\begin{bmatrix}${ogf1(n[0])} & ${ogf1(n[1])}\end{bmatrix},\ b_{${k + 1}}=-${ogf1(d)}\;\; z_{${k + 1}}=\mathrm{ReLU}(\mathbf{w}_{${k + 1}}^\top\mathbf{x}+b_{${k + 1}})\; `; }
		ogTex('og-egg3-dense', String.raw`\underbrace{\mathbf{z}}_{\text{Dense Layer, }${N}\text{ neurons}}=\mathrm{ReLU}(\underbrace{\mathbf{A}}_{${N}\times2}\,\mathbf{x}+\underbrace{\mathbf{b}}_{${N}\times1}) \;\;\text{with}\; ` + rows + (N > 4 ? String.raw`\text{… }${N - 4}\text{ more}` : ''));
		ogTex('og-egg3-sep', String.raw`Z(\mathbf{x})=\textstyle\sum_{k=1}^{N} z_k \;\Rightarrow\; \text{core: } Z\approx 0\ (\text{flat floor}),\ \text{ring: } Z\ge ${ogf1(zOutMin)}\ (\text{basin walls}). \;\; \text{Plane } Z=c \text{ separates if } c\in(${ogf1(zInMax)},\,${ogf1(zOutMin)}).`);
		drawTop(p);
	}
	const nSl = document.getElementById('og-egg3-n'); if (nSl) nSl.oninput = () => { N = +nSl.value; drawEgg3f(); };
	const fsSl = document.getElementById('og-egg3-fs'); if (fsSl) fsSl.oninput = () => { fs = +fsSl.value; drawEgg3f(); };
	const plSl = document.getElementById('og-egg3-plane'); if (plSl) plSl.oninput = drawEgg3f;
	OG.redos.push(drawEgg3f);
	OG.regen.push(() => { pts = ogMakeEgg(400, 700, 0, 0.22, 0.70, 0.92); drawEgg3f(); });
	drawEgg3f();
}

/* ------------------------------------------------------------------ module */
async function loadOrigamiModule() {
	updateLoadingStatus('Loading section about origami & linear separability...');

	OG.register('og-fc', ogInitFC);
	OG.register('og-nonsep', ogInitNonsep);
	OG.register('og-affine', ogInitAffine);
	OG.register('og-relu1d', ogInitRelu1d);
	OG.register('og-before', ogInitRelu);
	OG.register('og-fold1d', ogInitFold1d);
	OG.register('og-egg', ogInitEgg);
	OG.register('og-rot', ogInitRot);
	OG.register('og-egg3', ogInitEgg3);
	OG.register('og-fold3d', ogInitFold3d);
	OG.register('og-cascade', ogInitCascade);
	OG.register('og-shear', ogInitShear);
	OG.register('og-tuning', ogInitTuning);
	OG.register('og-dim', ogInitPoker);
	OG.start();

	if (window.__MN_DARK) {
		window.__MN_DARK.onChange(() => { OG.redos.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } }); });
	}

	return Promise.resolve();
}
