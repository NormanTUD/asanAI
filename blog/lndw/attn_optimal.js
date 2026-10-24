// Attention als Entscheidung im Simplex + Lernschritt als Policy-Gradient.
// Bewusst klein gehalten: keine Plotly-Abhängigkeit, alles 2-D-Canvas.

(function () {
	'use strict';

	var BLUE = '#2563eb';
	var GREEN = '#10b981';
	var AMBER = '#f59e0b';
	var RED = '#ef4444';
	var INK = '#1e293b';
	var MUTED = '#64748b';
	var GRID = '#e2e8f0';
	var KEY_COLORS = [BLUE, GREEN, AMBER];

	function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

	function softmax(scores, tau) {
		tau = tau || 1;
		var mx = Math.max.apply(null, scores);
		var ex = scores.map(function (v) { return Math.exp((v - mx) / tau); });
		var z = ex.reduce(function (a, b) { return a + b; }, 0);
		return ex.map(function (v) { return v / z; });
	}

	function dot(a, b) {
		var s = 0;
		for (var i = 0; i < a.length; i++) s += a[i] * b[i];
		return s;
	}

	function fontSize(ctx, size, weight) {
		ctx.font = (weight || 500) + ' ' + size + 'px system-ui, -apple-system, sans-serif';
	}

	function canvasCtx(canvas) {
		var dpr = Math.min(window.devicePixelRatio || 1, 2);
		var w = Math.max(1, Math.round(canvas.clientWidth || 0));
		var h = Math.max(1, Math.round(canvas.clientHeight || 0));
		if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
			canvas.width = Math.round(w * dpr);
			canvas.height = Math.round(h * dpr);
		}
		var ctx = canvas.getContext('2d');
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		return { ctx: ctx, w: w, h: h };
	}

	function setText(id, text) {
		var el = document.getElementById(id);
		if (el) el.textContent = text;
	}

	function triangleVertices(w, h) {
		var R = Math.min(w * 0.40, h * 0.38);
		var cx = w * 0.5;
		var cy = h * 0.45;
		return [
			[cx, cy - R],
			[cx - R * 0.866, cy + R * 0.5],
			[cx + R * 0.866, cy + R * 0.5]
		];
	}

	function barycentric(p, V) {
		return [
			p[0] * V[0][0] + p[1] * V[1][0] + p[2] * V[2][0],
			p[0] * V[0][1] + p[1] * V[1][1] + p[2] * V[2][1]
		];
	}

	function inverseBarycentric(x, y, V) {
		var det = (V[1][1] - V[2][1]) * (V[0][0] - V[2][0]) +
			(V[2][0] - V[1][0]) * (V[0][1] - V[2][1]);
		var l1 = ((V[1][1] - V[2][1]) * (x - V[2][0]) +
			(V[2][0] - V[1][0]) * (y - V[2][1])) / det;
		var l2 = ((V[2][1] - V[0][1]) * (x - V[2][0]) +
			(V[0][0] - V[2][0]) * (y - V[2][1])) / det;
		return [l1, l2, 1 - l1 - l2];
	}

	function drawStar(ctx, x, y, outer, inner, fill, stroke) {
		ctx.beginPath();
		for (var k = 0; k < 10; k++) {
			var r = k % 2 === 0 ? outer : inner;
			var a = -Math.PI / 2 + k * Math.PI / 5;
			var px = x + Math.cos(a) * r;
			var py = y + Math.sin(a) * r;
			if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
		}
		ctx.closePath();
		ctx.fillStyle = fill;
		ctx.fill();
		if (stroke) {
			ctx.strokeStyle = stroke;
			ctx.lineWidth = 1.2;
			ctx.stroke();
		}
	}

	// ────────────────────────────────────────────────────────────
	// SIMPLEX: viele Startpunkte rollen ins selbe Tal
	// ────────────────────────────────────────────────────────────
	var AttentionSimplex = (function () {
		var SCORES = [1.4, 0.3, -0.6];
		var TAU = 1.0;
		var PSTAR = softmax(SCORES, TAU);
		var N_WALKERS = 18;
		var CHUNK = 6;
		var MAX_CHUNKS = 18;
		var walkers = [];
		var mainIdx = 0;
		var chunkCount = 0;
		var finished = false;
		var history = [];
		var field = null;
		var fieldKey = '';

		function energy(p) {
			var v = 0;
			for (var i = 0; i < 3; i++) {
				v -= p[i] * SCORES[i];
				if (p[i] > 1e-12) v += TAU * p[i] * Math.log(p[i]);
			}
			return v;
		}

		function descend(p) {
			var g = [];
			for (var i = 0; i < 3; i++) {
				g.push(-SCORES[i] + TAU * (Math.log(Math.max(p[i], 1e-12)) + 1));
			}
			var np = [];
			for (var j = 0; j < 3; j++) {
				np.push(p[j] * Math.exp(-0.10 * g[j] / Math.max(TAU, 0.05)));
			}
			var z = np.reduce(function (a, b) { return a + b; }, 0) || 1;
			return np.map(function (x) { return clamp(x / z, 1e-9, 1); });
		}

		function gapToStar(p) {
			var g = 0;
			for (var i = 0; i < 3; i++) g += (p[i] - PSTAR[i]) * (p[i] - PSTAR[i]);
			return Math.sqrt(g);
		}

		function makeWalkers() {
			var starts = [
				[1 / 3, 1 / 3, 1 / 3],
				[0.95, 0.025, 0.025],
				[0.025, 0.95, 0.025],
				[0.025, 0.025, 0.95]
			];
			while (starts.length < N_WALKERS) {
				var a = Math.random();
				var b = Math.random();
				if (a + b > 1) { a = 1 - a; b = 1 - b; }
				starts.push([a, b, 1 - a - b]);
			}
			return starts.map(function (p) {
				return { p: p.slice(), trail: [p.slice()] };
			});
		}

		function buildField(w, h, V) {
			var key = w + 'x' + h;
			if (field && fieldKey === key) return field;

			var off = document.createElement('canvas');
			off.width = w;
			off.height = h;
			var octx = off.getContext('2d');
			var img = octx.createImageData(w, h);
			var data = img.data;
			var vals = new Float32Array(w * h);
			vals.fill(NaN);
			var mn = Infinity;
			var mx = -Infinity;

			for (var y = 0; y < h; y++) {
				for (var x = 0; x < w; x++) {
					var l = inverseBarycentric(x, y, V);
					if (l[0] < -1e-7 || l[1] < -1e-7 || l[2] < -1e-7) continue;
					var p = [Math.max(l[0], 1e-7), Math.max(l[1], 1e-7), Math.max(l[2], 1e-7)];
					var z = p[0] + p[1] + p[2];
					p = [p[0] / z, p[1] / z, p[2] / z];
					var v = energy(p);
					vals[y * w + x] = v;
					if (v < mn) mn = v;
					if (v > mx) mx = v;
				}
			}

			var span = Math.max(mx - mn, 1e-9);
			for (var yy = 0; yy < h; yy++) {
				for (var xx = 0; xx < w; xx++) {
					var value = vals[yy * w + xx];
					if (isNaN(value)) continue;
					var t = (value - mn) / span;
					var strength = Math.pow(1 - t, 0.8);
					var band = Math.floor(strength * 7) / 7;
					var idx = (yy * w + xx) * 4;
					data[idx] = 37;
					data[idx + 1] = 99;
					data[idx + 2] = 235;
					data[idx + 3] = Math.round(255 * (0.03 + 0.28 * band));
				}
			}
			octx.putImageData(img, 0, 0);
			field = off;
			fieldKey = key;
			return field;
		}

		function draw() {
			var canvas = document.getElementById('attn-simplex-canvas');
			if (!canvas) return;
			var c = canvasCtx(canvas);
			var ctx = c.ctx;
			var w = c.w;
			var h = c.h;
			var V = triangleVertices(w, h);
			var fieldCanvas = buildField(w, h, V);

			ctx.clearRect(0, 0, w, h);

			ctx.save();
			ctx.beginPath();
			ctx.moveTo(V[0][0], V[0][1]);
			ctx.lineTo(V[1][0], V[1][1]);
			ctx.lineTo(V[2][0], V[2][1]);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(fieldCanvas, 0, 0, w, h);
			ctx.restore();

			ctx.beginPath();
			ctx.moveTo(V[0][0], V[0][1]);
			ctx.lineTo(V[1][0], V[1][1]);
			ctx.lineTo(V[2][0], V[2][1]);
			ctx.closePath();
			ctx.strokeStyle = '#94a3b8';
			ctx.lineWidth = 1.5;
			ctx.stroke();

			fontSize(ctx, 10.5, 650);
			ctx.fillStyle = BLUE;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'bottom';
			ctx.fillText('nur key 1', V[0][0], V[0][1] - 7);

			ctx.fillStyle = GREEN;
			ctx.textAlign = 'right';
			ctx.textBaseline = 'top';
			ctx.fillText('nur key 2', V[1][0] - 5, V[1][1] + 7);

			ctx.fillStyle = AMBER;
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';
			ctx.fillText('nur key 3', V[2][0] + 5, V[2][1] + 7);

			fontSize(ctx, 9.5, 500);
			ctx.fillStyle = '#94a3b8';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			ctx.fillText('Mitte = unentschlossen', V[0][0], V[1][1] - 24);

			var starP = barycentric(PSTAR, V);
			if (finished) {
				drawStar(ctx, starP[0], starP[1], 12, 5, AMBER, '#b45309');
				fontSize(ctx, 10.5, 700);
				ctx.fillStyle = '#b45309';
				ctx.textAlign = 'left';
				ctx.textBaseline = 'bottom';
				ctx.fillText('p* = Softmax', starP[0] + 15, starP[1] - 8);
			} else {
				drawStar(ctx, starP[0], starP[1], 9, 3.8, 'rgba(245,158,11,0.18)', 'rgba(245,158,11,0.7)');
			}

			for (var i = 0; i < walkers.length; i++) {
				if (i === mainIdx) continue;
				var wk = walkers[i];
				var P = barycentric(wk.p, V);
				if (wk.trail.length > 1) {
					ctx.beginPath();
					for (var t = 0; t < wk.trail.length; t++) {
						var TP = barycentric(wk.trail[t], V);
						if (t === 0) ctx.moveTo(TP[0], TP[1]); else ctx.lineTo(TP[0], TP[1]);
					}
					ctx.strokeStyle = 'rgba(100,116,139,0.20)';
					ctx.lineWidth = 1;
					ctx.stroke();
				}
				ctx.beginPath();
				ctx.arc(P[0], P[1], 2.6, 0, Math.PI * 2);
				ctx.fillStyle = 'rgba(71,85,105,0.45)';
				ctx.fill();
			}

			var main = walkers[mainIdx];
			var MP = barycentric(main.p, V);
			if (main.trail.length > 1) {
				ctx.beginPath();
				for (var k = 0; k < main.trail.length; k++) {
					var TP2 = barycentric(main.trail[k], V);
					if (k === 0) ctx.moveTo(TP2[0], TP2[1]); else ctx.lineTo(TP2[0], TP2[1]);
				}
				ctx.strokeStyle = 'rgba(245,158,11,0.55)';
				ctx.lineWidth = 2;
				ctx.stroke();
			}
			ctx.beginPath();
			ctx.arc(MP[0], MP[1], 6.5, 0, Math.PI * 2);
			ctx.fillStyle = BLUE;
			ctx.fill();
			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = 2;
			ctx.stroke();

			var mainP = main.p;
			setText('attn-simplex-J', energy(mainP).toFixed(3));
			setText('attn-simplex-gap', gapToStar(mainP).toFixed(4));
			for (var j = 0; j < 3; j++) {
				var pct = Math.round(mainP[j] * 100);
				setText('attn-simplex-p' + j, pct + ' %');
				var fill = document.getElementById('attn-simplex-fill' + j);
				if (fill) fill.style.width = (mainP[j] * 100).toFixed(2) + '%';
			}
		}

		function snapshot() {
			return {
				walkers: walkers.map(function (w) {
					return {
						p: w.p.slice(),
						trail: w.trail.map(function (t) { return t.slice(); })
					};
				}),
				chunkCount: chunkCount,
				finished: finished
			};
		}

		function advanceChunk() {
			var maxGap = 0;
			for (var k = 0; k < CHUNK; k++) {
				maxGap = 0;
				for (var i = 0; i < walkers.length; i++) {
					var wk = walkers[i];
					wk.p = descend(wk.p);
					wk.trail.push(wk.p.slice());
					if (wk.trail.length > 18) wk.trail.shift();
					var g = gapToStar(wk.p);
					if (g > maxGap) maxGap = g;
				}
			}
			chunkCount++;
			finished = maxGap < 0.0035 || chunkCount >= MAX_CHUNKS;
		}

		function canGoNext() {
			return isActive() && !finished && chunkCount < MAX_CHUNKS;
		}

		function next() {
			if (!canGoNext()) return;
			history.push(snapshot());
			advanceChunk();
			draw();
		}

		function canGoPrev() {
			return isActive() && history.length > 0;
		}

		function prev() {
			if (!canGoPrev()) return;
			var snap = history.pop();
			walkers = snap.walkers;
			chunkCount = snap.chunkCount;
			finished = snap.finished;
			draw();
		}

		function reset() {
			history = [];
			walkers = makeWalkers();
			chunkCount = 0;
			finished = false;
			draw();
		}

		function isActive() {
			var s = document.getElementById('slide-attn-simplex');
			return !!(s && s.classList.contains('active'));
		}

		function invalidate() {
			field = null;
			fieldKey = '';
		}

		return {
			enter: reset,
			leave: function () {},
			replay: reset,
			reset: reset,
			canGoNext: canGoNext,
			next: next,
			canGoPrev: canGoPrev,
			prev: prev,
			draw: draw,
			isActive: isActive,
			invalidate: invalidate
		};
	})();

	window.AttentionSimplex = AttentionSimplex;

	// ────────────────────────────────────────────────────────────
	// BANDIT: Policy-Gradient mit automatischer Baseline
	// ────────────────────────────────────────────────────────────
	var AttentionBandit = (function () {
		var UTIL = [1.2, -0.6, 0.4];
		var NAMES = ['key 1', 'key 2', 'key 3'];
		var ETA = 0.6;
		var SAMPLES_PER_STEP = 4;
		var MAX_STEPS = 12;
		var STEP_MS = 430;
		var s = [0, 0, 0];
		var prevP = [1 / 3, 1 / 3, 1 / 3];
		var step = 0;
		var lastSample = -1;
		var lastAdvantage = 0;
		var timer = null;
		var running = false;

		function policy() { return softmax(s, 1); }

		function sample(p) {
			var r = Math.random();
			var acc = 0;
			for (var i = 0; i < p.length; i++) {
				acc += p[i];
				if (r <= acc) return i;
			}
			return p.length - 1;
		}

		function status(html) {
			var el = document.getElementById('attn-rl-status');
			if (el) el.innerHTML = html;
		}

		function drawRows(ctx, w, h) {
			var p = policy();
			var baseline = dot(p, UTIL);
			var adv = UTIL.map(function (u) { return u - baseline; });
			var zero = dot(p, adv);

			var padL = 64;
			var padR = 24;
			var padT = 20;
			var colW = (w - padL - padR) / 3;
			var uZero = 100;
			var uScale = 38;
			var pZero = 210;
			var pMaxH = 74;
			var aZero = 288;
			var aScale = 34;

			ctx.clearRect(0, 0, w, h);

			if (lastSample >= 0) {
				var hx = padL + (lastSample + 0.5) * colW;
				ctx.fillStyle = 'rgba(245,158,11,0.10)';
				ctx.fillRect(hx - colW / 2 + 5, padT - 2, colW - 10, h - padT - 26);
				fontSize(ctx, 9.5, 650);
				ctx.fillStyle = '#b45309';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'top';
				ctx.fillText('gezogen: ' + NAMES[lastSample], hx, padT + 1);
			}

			fontSize(ctx, 10, 650);
			ctx.fillStyle = MUTED;
			ctx.textAlign = 'left';
			ctx.textBaseline = 'middle';
			ctx.fillText('Nutzen u', 6, uZero - 52);
			ctx.fillText('Policy p', 6, pZero - pMaxH / 2);
			ctx.fillText('Vorteil A', 6, aZero - 52);

			ctx.strokeStyle = GRID;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(padL - 6, uZero);
			ctx.lineTo(w - padR + 6, uZero);
			ctx.moveTo(padL - 6, pZero);
			ctx.lineTo(w - padR + 6, pZero);
			ctx.moveTo(padL - 6, aZero);
			ctx.lineTo(w - padR + 6, aZero);
			ctx.stroke();

			var yBase = uZero - baseline * uScale;
			ctx.save();
			ctx.setLineDash([5, 4]);
			ctx.strokeStyle = '#94a3b8';
			ctx.beginPath();
			ctx.moveTo(padL - 6, yBase);
			ctx.lineTo(w - padR + 6, yBase);
			ctx.stroke();
			ctx.restore();
			fontSize(ctx, 9, 600);
			ctx.fillStyle = '#64748b';
			ctx.textAlign = 'right';
			ctx.textBaseline = 'bottom';
			ctx.fillText('Baseline E_p[u]', w - padR, yBase - 3);

			for (var i = 0; i < 3; i++) {
				var x = padL + (i + 0.5) * colW;
				var bw = Math.min(46, colW * 0.52);

				var uy = uZero - UTIL[i] * uScale;
				ctx.fillStyle = KEY_COLORS[i];
				ctx.globalAlpha = 0.88;
				ctx.fillRect(x - bw / 2, Math.min(uZero, uy), bw, Math.abs(uy - uZero));
				ctx.globalAlpha = 1;
				fontSize(ctx, 10, 700);
				ctx.fillStyle = KEY_COLORS[i];
				ctx.textAlign = 'center';
				ctx.textBaseline = UTIL[i] >= 0 ? 'bottom' : 'top';
				ctx.fillText((UTIL[i] > 0 ? '+' : '') + UTIL[i].toFixed(1), x, uy + (UTIL[i] >= 0 ? -3 : 3));

				var ph = p[i] * pMaxH;
				ctx.fillStyle = KEY_COLORS[i];
				ctx.fillRect(x - bw / 2, pZero - ph, bw, ph);
				if (step > 0) {
					var prevY = pZero - prevP[i] * pMaxH;
					ctx.strokeStyle = '#0f172a';
					ctx.lineWidth = 1.4;
					ctx.beginPath();
					ctx.moveTo(x - bw / 2 - 3, prevY);
					ctx.lineTo(x + bw / 2 + 3, prevY);
					ctx.stroke();
				}
				fontSize(ctx, 10, 700);
				ctx.fillStyle = INK;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'bottom';
				ctx.fillText(Math.round(p[i] * 100) + ' %', x, pZero - ph - 3);

				var ay = aZero - adv[i] * aScale;
				ctx.fillStyle = adv[i] >= 0 ? '#10b981' : '#ef4444';
				ctx.globalAlpha = 0.85;
				ctx.fillRect(x - bw / 2, Math.min(aZero, ay), bw, Math.abs(ay - aZero));
				ctx.globalAlpha = 1;
				fontSize(ctx, 10, 700);
				ctx.fillStyle = adv[i] >= 0 ? '#047857' : '#b91c1c';
				ctx.textBaseline = adv[i] >= 0 ? 'bottom' : 'top';
				ctx.fillText((adv[i] > 0 ? '+' : '') + adv[i].toFixed(2), x, ay + (adv[i] >= 0 ? -3 : 3));

				fontSize(ctx, 9.5, 600);
				ctx.fillStyle = MUTED;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'top';
				ctx.fillText(NAMES[i], x, aZero + 43);
			}

			fontSize(ctx, 9.5, 500);
			ctx.fillStyle = '#94a3b8';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'bottom';
			ctx.fillText('dunkle Linie = Policy vor diesem Schritt', padL, h - 7);

			setText('attn-rl-base', baseline.toFixed(3));
			setText('attn-rl-zero', (Math.abs(zero) < 0.0005 ? 0 : zero).toFixed(3));
		}

		function draw() {
			var canvas = document.getElementById('attn-rl-canvas');
			if (!canvas) return;
			var c = canvasCtx(canvas);
			drawRows(c.ctx, c.w, c.h);
		}

		function doStep() {
			var p = policy();
			var baseline = dot(p, UTIL);
			var ds = [0, 0, 0];
			for (var k = 0; k < SAMPLES_PER_STEP; k++) {
				var j = sample(p);
				lastSample = j;
				lastAdvantage = UTIL[j] - baseline;
				for (var i = 0; i < 3; i++) {
					ds[i] += (UTIL[j] - baseline) * ((i === j ? 1 : 0) - p[i]);
				}
			}
			prevP = p.slice();
			s = s.map(function (v, i) { return v + (ETA / SAMPLES_PER_STEP) * ds[i]; });
			step++;

			var dir = lastAdvantage >= 0 ? 'steigt' : 'sinkt';
			status('Zug ' + step + ': <b>' + NAMES[lastSample] + '</b> gezogen · Vorteil ' +
				(lastAdvantage > 0 ? '+' : '') + lastAdvantage.toFixed(2) +
				' → p<sub>' + (lastSample + 1) + '</sub> ' + dir + '.');
			draw();
		}

		function tick() {
			if (!running) return;
			doStep();
			if (step >= MAX_STEPS) {
				running = false;
				draw();
				status('Fertig: Der Vorteil hat die Policy geformt. <b>' + NAMES[0] + '</b> wird fast immer gezogen.');
				return;
			}
			timer = setTimeout(tick, STEP_MS);
		}

		function stop() {
			running = false;
			if (timer) { clearTimeout(timer); timer = null; }
		}

		function reset() {
			stop();
			s = [0, 0, 0];
			prevP = [1 / 3, 1 / 3, 1 / 3];
			step = 0;
			lastSample = -1;
			lastAdvantage = 0;
			status('Ziehen → Vorteil → Update. Beobachte, wie die Policy wandert.');
			draw();
		}

		function start() {
			reset();
			running = true;
			timer = setTimeout(tick, 800);
		}

		function isActive() {
			var sl = document.getElementById('slide-attn-rl');
			return !!(sl && sl.classList.contains('active'));
		}

		return {
			enter: start,
			leave: stop,
			replay: start,
			reset: reset,
			draw: draw,
			isActive: isActive
		};
	})();

	window.AttentionBandit = AttentionBandit;

	// ────────────────────────────────────────────────────────────
	// ZEILENSUMMEN: die Σ-Spalte baut sich Zeile für Zeile auf
	// ────────────────────────────────────────────────────────────
	var AttentionRowSums = (function () {
		var token = 0;

		function dataRows() {
			var out = [];
			document.querySelectorAll('#attn-h1-wrap .attn-matrix, #attn-h2-wrap .attn-matrix').forEach(function (tbl) {
				tbl.querySelectorAll('tr').forEach(function (tr) {
					if (tr.querySelector('.attn-rowhead')) out.push(tr);
				});
			});
			return out;
		}

		function reset() {
			token++;
			document.querySelectorAll('.attn-matrix').forEach(function (tbl) {
				tbl.classList.remove('sums-visible');
			});
			dataRows().forEach(function (tr) {
				tr.classList.remove('attn-sum-active', 'attn-sum-done');
				var v = tr.querySelector('.attn-sum-v');
				var pc = tr.querySelector('.attn-sum-pct');
				if (v) v.textContent = '0.00';
				if (pc) pc.textContent = '0%';
				tr.querySelectorAll('td.attn-v').forEach(function (td) {
					td.classList.remove('attn-add');
				});
			});
		}

		function show() {
			reset();
			var run = token;
			document.querySelectorAll('.attn-matrix').forEach(function (tbl) {
				tbl.classList.add('sums-visible');
			});
			dataRows().forEach(function (tr, ri) {
				setTimeout(function () {
					if (run !== token) return;
					tr.classList.add('attn-sum-active');
					var cells = Array.prototype.slice.call(tr.querySelectorAll('td.attn-v'));
					var sumEl = tr.querySelector('.attn-sum-v');
					var pctEl = tr.querySelector('.attn-sum-pct');
					var cents = 0;
					cells.forEach(function (td, ci) {
						setTimeout(function () {
							if (run !== token) return;
							var v = Math.round(parseFloat(td.textContent) * 100) || 0;
							cents += v;
							td.classList.add('attn-add');
							setTimeout(function () {
								if (run === token) td.classList.remove('attn-add');
							}, 130);
							if (sumEl) sumEl.textContent = (cents / 100).toFixed(2);
							if (pctEl) pctEl.textContent = cents + '%';
						}, ci * 40);
					});
					setTimeout(function () {
						if (run !== token) return;
						tr.classList.remove('attn-sum-active');
						tr.classList.add('attn-sum-done');
					}, cells.length * 40 + 100);
				}, ri * 230);
			});
		}

		return { show: show, reset: reset };
	})();

	window.AttentionRowSums = AttentionRowSums;

	window.addEventListener('resize', function () {
		if (AttentionSimplex.isActive()) {
			AttentionSimplex.invalidate();
			AttentionSimplex.draw();
		}
		if (AttentionBandit.isActive()) AttentionBandit.draw();
	});
})();
