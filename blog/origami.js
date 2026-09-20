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

	isDark() { return (typeof isDarkMode === 'function') ? isDarkMode() : false; },

	pal() {
		const dark = this.isDark();
		return {
			dark,
			bg:    dark ? '#0b1020' : '#f4f7fc',
			grid:  dark ? '#22304f' : '#dbe2ef',
			grid2: dark ? '#33436b' : '#c2ccdf',
			muted: dark ? '#8fa1c4' : '#64748b',
			inner: '#ff6b9d',
			outer: '#4ecdc4',
			fold:  '#ffe66d',
			axis:  dark ? '#4a5b86' : '#9aa7c0'
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

/* ------------------------------------------------------------------ Demo 1 */
function ogInitNonsep() {
	const c = document.getElementById('og-nonsep'); if (!c) return;
	const ctx = c.getContext('2d');
	const W = c.width, H = c.height, cx = W / 2, cy = H / 2, SC = 105;
	let pts = [];
	function gen(kind) {
		pts = [];
		if (kind === 'egg') {
			for (let i = 0; i < 80; i++) { const a = Math.random() * OGT, r = 0.25 + Math.random() * 0.18; pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, cls: 0 }); }
			for (let i = 0; i < 130; i++) { const a = Math.random() * OGT, r = 0.9 + Math.random() * 0.4; pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, cls: 1 }); }
		} else if (kind === 'xor') {
			for (let i = 0; i < 60; i++) { pts.push({ x: 0.5 + Math.random() * 0.6, y: 0.5 + Math.random() * 0.6, cls: 0 }); pts.push({ x: -0.5 - Math.random() * 0.6, y: -0.5 - Math.random() * 0.6, cls: 0 }); pts.push({ x: -0.5 - Math.random() * 0.6, y: 0.5 + Math.random() * 0.6, cls: 1 }); pts.push({ x: 0.5 + Math.random() * 0.6, y: -0.5 - Math.random() * 0.6, cls: 1 }); }
		} else {
			for (let i = 0; i < 130; i++) { const t = i / 34, r = 0.12 + t * 0.32; pts.push({ x: Math.cos(t) * r, y: Math.sin(t) * r, cls: 0 }); pts.push({ x: -Math.cos(t) * r, y: -Math.sin(t) * r, cls: 1 }); }
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
			if (pred === q.cls) correct++;
			ctx.fillStyle = q.cls === 0 ? p.inner : p.outer;
			ctx.beginPath(); ctx.arc(cx + q.x * SC, cy - q.y * SC, 3, 0, OGT); ctx.fill();
		}
		ctx.strokeStyle = p.fold; ctx.lineWidth = 2.5;
		const tx = -ny, ty = nx;
		ctx.beginPath();
		ctx.moveTo(cx + (shift * nx - tx * 3) * SC, cy - (shift * ny - ty * 3) * SC);
		ctx.lineTo(cx + (shift * nx + tx * 3) * SC, cy - (shift * ny + ty * 3) * SC);
		ctx.stroke();
		const acc = 100 * Math.max(correct, pts.length - correct) / pts.length;
		document.getElementById('og-nonsep-out').textContent = 'Best accuracy of a single straight line: ' + acc.toFixed(1) + '% (chance ~50-60%) — the entanglement resists it.';
	}
	document.getElementById('og-angle').oninput = drawNonsep;
	document.getElementById('og-shift').oninput = drawNonsep;
	document.getElementById('og-setup').onchange = (e) => { gen(e.target.value); drawNonsep(); };
	gen('egg'); drawNonsep();
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

/* ------------------------------------------------------------------ module */
async function loadOrigamiModule() {
	updateLoadingStatus('Loading section about origami & linear separability...');

	OG.register('og-nonsep', ogInitNonsep);
	OG.register('og-before', ogInitRelu);
	OG.register('og-fold1d', ogInitFold1d);
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
