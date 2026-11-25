/* =========================================================================
 * Topology and the Geometry of Thought — interactive demos
 * Visual companion to Olah (2014) "Neural Networks, Manifolds, and Topology"
 * and Karpathy's ConvNetJS 2-D classification demo.
 * Live TF.js networks; theme-aware via isDarkMode / __MN_DARK.onChange.
 * ========================================================================= */
const TOP = {
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
			muted: dark ? '#8fa1c4' : '#64748b',
			inner: '#ff6b9d',
			outer: '#4ecdc4',
			axis:  dark ? '#4a5b86' : '#9aa7c0',
			text:  dark ? '#cbd5e1' : '#334155'
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
					try { r.fn(); } catch (err) { console.error('topology demo failed:', err); }
				}
			});
		}, { rootMargin: margin });
		this.registry.forEach((r) => { if (!r.done) this.observer.observe(r.el); });
	}
};

function tpSet(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }
const TAU = Math.PI * 2;

function buildNet(units, act, inDim, lr) {
	const m = tf.sequential();
	m.add(tf.layers.dense({ units: units, activation: act, inputShape: [inDim] }));
	m.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
	m.compile({ optimizer: tf.train.adam(lr || 0.05), loss: 'binaryCrossentropy' });
	return m;
}

function disposeNet(m) { if (m && m.dispose) { try { m.dispose(); } catch (e) { /* ignore */ } } }

function computeAcc(model, pts, dim) {
	return tf.tidy(() => {
		const xs = tf.tensor2d(pts.map((p) => (dim === 1 ? [p.x] : [p.x, p.y])));
		const pred = model.predict(xs).dataSync();
		let c = 0;
		for (let i = 0; i < pred.length; i++) if ((pred[i] > 0.5 ? 1 : 0) === pts[i].cls) c++;
		return c / pred.length;
	});
}

function paintDecisionGrid(S) {
	const c = S.canvas, ctx = S.ctx, W = c.width, H = c.height;
	const cx = W / 2, cy = H / 2, SC = S.sc;
	const p = TOP.pal();
	const block = S.gridBlock || 4;
	const cols = Math.ceil(W / block), rows = Math.ceil(H / block);
	const coords = [];
	for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++)
		coords.push([(col * block + block / 2 - cx) / SC, -(r * block + block / 2 - cy) / SC]);
	ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);
	if (S.model) {
		const input = tf.tensor2d(coords);
		const pred = S.model.predict(input).dataSync();
		input.dispose();
		let k = 0;
		for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
			const prob = pred[k++];
			ctx.globalAlpha = 0.28;
			ctx.fillStyle = prob > 0.5 ? p.outer : p.inner;
			ctx.fillRect(col * block, r * block, block, block);
		}
		ctx.globalAlpha = 1;
	}
	for (const q of S.pts) {
		const px = cx + q.x * SC, py = cy - q.y * SC;
		ctx.fillStyle = q.cls ? p.outer : p.inner;
		ctx.beginPath(); ctx.arc(px, py, 3.2, 0, TAU); ctx.fill();
	}
}

function tpScatter(ctx, W, H, pts, p) {
	ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);
	if (!pts.length) return;
	let xmin = 1e9, xmax = -1e9, ymin = 1e9, ymax = -1e9;
	for (const q of pts) { xmin = Math.min(xmin, q.x); xmax = Math.max(xmax, q.x); ymin = Math.min(ymin, q.y); ymax = Math.max(ymax, q.y); }
	if (xmax - xmin < 1e-6) { xmin -= 0.5; xmax += 0.5; }
	if (ymax - ymin < 1e-6) { ymin -= 0.5; ymax += 0.5; }
	const pad = 34;
	const sc = Math.min((W - 2 * pad) / (xmax - xmin), (H - 2 * pad) / (ymax - ymin));
	const cx = (xmin + xmax) / 2, cy = (ymin + ymax) / 2;
	const X = (x) => W / 2 + (x - cx) * sc;
	const Y = (y) => H / 2 - (y - cy) * sc;
	ctx.strokeStyle = p.grid; ctx.lineWidth = 1;
	if (xmin < 0 && xmax > 0) { ctx.beginPath(); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); ctx.stroke(); }
	if (ymin < 0 && ymax > 0) { ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); ctx.stroke(); }
	for (const q of pts) {
		ctx.fillStyle = q.cls ? p.outer : p.inner;
		ctx.beginPath(); ctx.arc(X(q.x), Y(q.y), 3.2, 0, TAU); ctx.fill();
	}
}

/* ------------------------------------------------------------------ Demo A */
function tpInitEgg() {
	const cv = document.getElementById('tp-egg'); if (!cv) return;
	if (typeof tf === 'undefined') { tpSet('tp-egg-out', 'TensorFlow.js is not loaded.'); return; }
	const ctx = cv.getContext('2d');
	const S = {
		canvas: cv, ctx, sc: Math.min(cv.width, cv.height) / 3.2, gridBlock: 4,
		pts: [], model: null, training: false
	};
	function genEgg() {
		const pts = [];
		for (let i = 0; i < 150; i++) { const a = Math.random() * TAU, r = 0.12 + Math.random() * 0.2; pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, cls: 0 }); }
		for (let i = 0; i < 170; i++) { const a = Math.random() * TAU, r = 0.85 + Math.random() * 0.35; pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, cls: 1 }); }
		return pts;
	}
	function eggUnits() { return parseInt(document.getElementById('tp-egg-units').value, 10); }
	function eggRebuild(keepData) {
		disposeNet(S.model);
		S.model = buildNet(eggUnits(), 'tanh', 2, 0.05);
		if (!keepData) S.pts = genEgg();
		paintDecisionGrid(S);
		tpSet('tp-egg-out', 'Ready. Width = ' + eggUnits() + ' units. Press Train.');
	}
	async function eggTrain() {
		if (S.training) return;
		S.training = true;
		const trainModel = S.model;
		const btn = document.getElementById('tp-egg-train'); if (btn) btn.disabled = true;
		const epochs = 320;
		const xs = tf.tensor2d(S.pts.map((p) => [p.x, p.y]));
		const ys = tf.tensor2d(S.pts.map((p) => [p.cls]));
		let aborted = false;
		for (let e = 0; e < epochs; e++) {
			if (S.model !== trainModel) { aborted = true; break; }
			try { await trainModel.fit(xs, ys, { epochs: 1, verbose: 0 }); }
			catch (err) { aborted = true; break; }
			if (e % 8 === 0 || e === epochs - 1) {
				const acc = computeAcc(trainModel, S.pts, 2);
				paintDecisionGrid(S);
				const w = eggUnits();
				const tag = acc > 0.95 ? '— the third dimension freed the disk.' : (w === 2 && acc < 0.93 ? '— topology forbids it at width 2.' : '');
				tpSet('tp-egg-out', 'epoch ' + (e + 1) + '/' + epochs + '  ·  accuracy ' + (100 * acc).toFixed(1) + '%' + tag);
			}
			await tf.nextFrame();
		}
		xs.dispose(); ys.dispose();
		S.training = false;
		if (btn) btn.disabled = false;
		if (aborted) { tpSet('tp-egg-out', 'Rebuilt — press Train to continue with the new network.'); return; }
		const acc = computeAcc(S.model, S.pts, 2);
		const w = eggUnits();
		const tag = acc > 0.95 ? '— the disk escaped the ring.' : (w === 2 ? '— it plateaus: no depth rescues width 2.' : '');
		tpSet('tp-egg-out', 'Done. accuracy ' + (100 * acc).toFixed(1) + '%' + tag);
		paintDecisionGrid(S);
	}
	document.getElementById('tp-egg-units').onchange = () => eggRebuild(true);
	document.getElementById('tp-egg-train').onclick = eggTrain;
	document.getElementById('tp-egg-reset').onclick = () => eggRebuild(false);
	S.pts = genEgg(); S.model = buildNet(eggUnits(), 'tanh', 2, 0.05);
	paintDecisionGrid(S);
	tpSet('tp-egg-out', 'Ready. Width = ' + eggUnits() + ' units. Press Train.');
	TOP.redos.push(() => paintDecisionGrid(S));
}

/* ------------------------------------------------------------------ Demo C */
function tpInit1d() {
	const cv = document.getElementById('tp-1d'); if (!cv) return;
	if (typeof tf === 'undefined') { tpSet('tp-1d-out', 'TensorFlow.js is not loaded.'); return; }
	const c1 = cv.getContext('2d');
	const cvR = document.getElementById('tp-1d-rep');
	const c1R = cvR ? cvR.getContext('2d') : null;
	const S = { cv, ctx: c1, cvR, ctxR: c1R, pts: [], model: null, training: false };
	function gen1d() {
		const pts = [];
		for (let i = 0; i < 70; i++) pts.push({ x: -0.32 + Math.random() * 0.64, cls: 0 });
		for (let i = 0; i < 70; i++) { const s = Math.random() < 0.5 ? -1 : 1; pts.push({ x: s * (0.68 + Math.random() * 0.32), cls: 1 }); }
		return pts;
	}
	function d1Units() { return parseInt(document.getElementById('tp-1d-units').value, 10); }
	function d1PaintLine() {
		const W = S.cv.width, H = S.cv.height, p = TOP.pal(), midY = H / 2;
		S.ctx.fillStyle = p.bg; S.ctx.fillRect(0, 0, W, H);
		const N = 180; const xs = [];
		for (let i = 0; i <= N; i++) xs.push([-1.3 + i * (2.6 / N)]);
		if (S.model) {
			const input = tf.tensor2d(xs);
			const probs = S.model.predict(input).dataSync();
			input.dispose();
			for (let i = 0; i < N; i++) {
				const x0 = d1XToPx(xs[i], W), x1 = d1XToPx(xs[i + 1], W);
				S.ctx.globalAlpha = 0.22; S.ctx.fillStyle = probs[i] > 0.5 ? p.outer : p.inner;
				S.ctx.fillRect(x0, 0, x1 - x0 + 1, H);
			}
			S.ctx.globalAlpha = 1;
		}
		S.ctx.strokeStyle = p.axis; S.ctx.lineWidth = 1.5;
		S.ctx.beginPath(); S.ctx.moveTo(20, midY); S.ctx.lineTo(W - 20, midY); S.ctx.stroke();
		for (let t = -1; t <= 1; t += 0.5) {
			const px = d1XToPx(t, W);
			S.ctx.strokeStyle = p.grid; S.ctx.beginPath(); S.ctx.moveTo(px, midY - 6); S.ctx.lineTo(px, midY + 6); S.ctx.stroke();
		}
		for (const q of S.pts) {
			const px = d1XToPx(q.x, W);
			S.ctx.fillStyle = q.cls ? p.outer : p.inner;
			S.ctx.beginPath(); S.ctx.arc(px, midY, 4, 0, TAU); S.ctx.fill();
		}
	}
	function d1XToPx(x, W) { const pad = 42; return pad + (x + 1.3) / 2.6 * (W - 2 * pad); }
	function d1PaintRep() {
		if (!S.ctxR || !S.model) return;
		const p = TOP.pal();
		const xs = tf.tensor2d(S.pts.map((q) => [q.x]));
		const h = S.model.layers[0].apply(xs).dataSync();
		xs.dispose();
		const Hn = d1Units();
		const rep = S.pts.map((q, i) => (Hn >= 2 ? { x: h[i * Hn + 0], y: h[i * Hn + 1], cls: q.cls } : { x: q.x, y: h[i], cls: q.cls }));
		tpScatter(S.ctxR, S.cvR.width, S.cvR.height, rep, p);
	}
	function d1Rebuild(keepData) {
		disposeNet(S.model);
		S.model = buildNet(d1Units(), 'tanh', 1, 0.06);
		if (!keepData) S.pts = gen1d();
		d1PaintLine(); d1PaintRep();
		tpSet('tp-1d-out', 'Ready. Width = ' + d1Units() + ' unit(s). Press Train.');
	}
	async function d1Train() {
		if (S.training) return;
		S.training = true;
		const trainModel = S.model;
		const btn = document.getElementById('tp-1d-train'); if (btn) btn.disabled = true;
		const epochs = 340;
		const xs = tf.tensor2d(S.pts.map((q) => [q.x]));
		const ys = tf.tensor2d(S.pts.map((q) => [q.cls]));
		let aborted = false;
		for (let e = 0; e < epochs; e++) {
			if (S.model !== trainModel) { aborted = true; break; }
			try { await trainModel.fit(xs, ys, { epochs: 1, verbose: 0 }); }
			catch (err) { aborted = true; break; }
			if (e % 10 === 0 || e === epochs - 1) {
				const acc = computeAcc(trainModel, S.pts, 1);
				d1PaintLine(); d1PaintRep();
				const tag = acc > 0.95 ? '— the middle lifted off the line.' : (d1Units() === 1 ? '— one unit cannot carve the middle.' : '');
				tpSet('tp-1d-out', 'epoch ' + (e + 1) + '/' + epochs + '  ·  accuracy ' + (100 * acc).toFixed(1) + '%' + tag);
			}
			await tf.nextFrame();
		}
		xs.dispose(); ys.dispose();
		S.training = false;
		if (btn) btn.disabled = false;
		if (aborted) { tpSet('tp-1d-out', 'Rebuilt — press Train to continue with the new network.'); return; }
		const acc = computeAcc(S.model, S.pts, 1);
		const tag = acc > 0.95 ? '— a flat line now separates the arch.' : (d1Units() === 1 ? '— still a single inseparable bump.' : '');
		tpSet('tp-1d-out', 'Done. accuracy ' + (100 * acc).toFixed(1) + '%' + tag);
		d1PaintLine(); d1PaintRep();
	}
	document.getElementById('tp-1d-units').onchange = () => d1Rebuild(true);
	document.getElementById('tp-1d-train').onclick = d1Train;
	document.getElementById('tp-1d-reset').onclick = () => d1Rebuild(false);
	S.pts = gen1d(); S.model = buildNet(d1Units(), 'tanh', 1, 0.06);
	d1PaintLine(); d1PaintRep();
	tpSet('tp-1d-out', 'Ready. Width = ' + d1Units() + ' unit(s). Press Train.');
	TOP.redos.push(() => { d1PaintLine(); d1PaintRep(); });
}

/* ------------------------------------------------------------------ Demo B */
function tpInitPlay() {
	const cv = document.getElementById('tp-play'); if (!cv) return;
	if (typeof tf === 'undefined') { tpSet('tp-play-out', 'TensorFlow.js is not loaded.'); return; }
	const ctx = cv.getContext('2d');
	const cvR = document.getElementById('tp-play-rep');
	const ctxR = cvR ? cvR.getContext('2d') : null;
	const S = {
		canvas: cv, ctx, sc: (cv.width / 2) / 1.6, gridBlock: 6,
		cvR, ctxR, pts: [], model: null,
		units: 4, act: 'tanh', pair: 0, tick: 0, busy: false, paused: false,
		timer: null, cycleTimer: null
	};
	function genSpiral() {
		const pts = []; const n = 100; const twist = 1.6 + Math.random() * 1.2;
		for (let i = 0; i < n; i++) {
			const arm = i % 2, t = i / n, r = 0.15 + t * 1.15, a = twist * t + arm * Math.PI;
			pts.push({ x: Math.cos(a) * r * 1.1, y: Math.sin(a) * r, cls: arm });
		}
		return pts;
	}
	function playPairs() {
		const out = [];
		for (let i = 0; i < S.units; i++) for (let j = i + 1; j < S.units; j++) out.push([i, j]);
		if (!out.length) out.push([0, 0]);
		return out;
	}
	function playRebuild(keepData) {
		disposeNet(S.model);
		S.model = buildNet(S.units, S.act, 2, 0.05);
		if (!keepData) S.pts = genSpiral();
		paintDecisionGrid(S);
		if (S.ctxR) playPaintRep();
	}
	function playPaintRep() {
		if (!S.ctxR || !S.model || !S.pts.length) return;
		const p = TOP.pal();
		const pr = playPairs();
		const i = pr[S.pair % pr.length][0], j = pr[S.pair % pr.length][1];
		tpSet('tp-play-rep-label', 'neurons ' + i + ', ' + j);
		const xs = tf.tensor2d(S.pts.map((q) => [q.x, q.y]));
		const h = S.model.layers[0].apply(xs).dataSync();
		xs.dispose();
		const rep = S.pts.map((q, k) => ({ x: h[k * S.units + i], y: h[k * S.units + j], cls: q.cls }));
		tpScatter(S.ctxR, S.cvR.width, S.cvR.height, rep, p);
	}
	function playToData(ev) {
		const rect = cv.getBoundingClientRect();
		const sx = cv.width / rect.width, sy = cv.height / rect.height;
		const px = (ev.clientX - rect.left) * sx, py = (ev.clientY - rect.top) * sy;
		return { x: (px - cv.width / 2) / S.sc, y: -(py - cv.height / 2) / S.sc };
	}
	function playRemoveNearest(ev) {
		const d = playToData(ev); let best = -1, bd = 1e9;
		S.pts.forEach((q, idx) => { const dd = (q.x - d.x) ** 2 + (q.y - d.y) ** 2; if (dd < bd) { bd = dd; best = idx; } });
		if (best >= 0 && bd < 0.15) S.pts.splice(best, 1);
	}
	cv.addEventListener('contextmenu', (ev) => { ev.preventDefault(); playRemoveNearest(ev); });
	cv.addEventListener('click', (ev) => {
		if (ev.ctrlKey || ev.metaKey) { playRemoveNearest(ev); return; }
		const d = playToData(ev);
		S.pts.push({ x: d.x, y: d.y, cls: ev.shiftKey ? 1 : 0 });
	});
	function playStartLoop() {
		if (S.timer) clearInterval(S.timer);
		S.timer = setInterval(async () => {
			if (S.paused || S.busy) return;
			if (S.pts.length < 3) { paintDecisionGrid(S); return; }
			S.busy = true;
			try {
				const xs = tf.tensor2d(S.pts.map((q) => [q.x, q.y]));
				const ys = tf.tensor2d(S.pts.map((q) => [q.cls]));
				await S.model.fit(xs, ys, { epochs: 2, verbose: 0 });
				xs.dispose(); ys.dispose();
				S.tick++;
				paintDecisionGrid(S);
				playPaintRep();
				if (S.tick % 20 === 0) {
					const acc = computeAcc(S.model, S.pts, 2);
					tpSet('tp-play-out', 'accuracy ' + (100 * acc).toFixed(1) + '%  ·  ' + S.pts.length + ' points  ·  ' + S.act + ' × ' + S.units);
				}
			} catch (e) { /* ignore transient */ }
			finally { S.busy = false; }
		}, 40);
		if (S.cycleTimer) clearInterval(S.cycleTimer);
		S.cycleTimer = setInterval(() => {
			const pr = playPairs();
			S.pair = (S.pair + 1) % pr.length;
			playPaintRep();
		}, 2200);
	}
	document.getElementById('tp-play-units').onchange = (e) => { S.units = parseInt(e.target.value, 10); S.pair = 0; playRebuild(true); };
	document.getElementById('tp-play-act').onchange = (e) => { S.act = e.target.value; playRebuild(true); };
	document.getElementById('tp-play-reset').onclick = () => { S.pair = 0; playRebuild(false); tpSet('tp-play-out', 'New data. Watching it untangle…'); };
	const pauseBtn = document.getElementById('tp-play-pause');
	pauseBtn.onclick = () => { S.paused = !S.paused; pauseBtn.textContent = S.paused ? '▶ Play' : '⏸ Pause'; };
	document.getElementById('tp-play-cycle').onclick = () => { const pr = playPairs(); S.pair = (S.pair + 1) % pr.length; playPaintRep(); };

	S.pts = genSpiral();
	S.model = buildNet(S.units, S.act, 2, 0.05);
	paintDecisionGrid(S); playPaintRep();
	tpSet('tp-play-out', 'Watching it untangle… (click to add, Shift+click green, Ctrl/right-click remove)');
	playStartLoop();
	TOP.redos.push(() => { paintDecisionGrid(S); playPaintRep(); });
}

/* ------------------------------------------------------------------ module */
async function loadTopologyModule() {
	updateLoadingStatus('Loading section about topology & the geometry of thought...');

	TOP.register('tp-egg', tpInitEgg);
	TOP.register('tp-1d', tpInit1d);
	TOP.register('tp-play', tpInitPlay);
	TOP.start();

	if (window.__MN_DARK) {
		window.__MN_DARK.onChange(() => { TOP.redos.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } }); });
	}

	return Promise.resolve();
}
