/* Fast canvas manifold scenes (no Plotly). Shared by embeddinglab,
   tenminutes/intuition, tenminutes/embeddinglab and the lndw presentation. */
(function () {
	'use strict';

	function isDark() {
		if (window.isDarkMode) return !!window.isDarkMode();
		if (document.documentElement.classList.contains('dark')) return true;
		return document.documentElement.getAttribute('data-theme') === 'dark';
	}
	function ink() { return isDark() ? '#e2e8f0' : '#1e293b'; }
	function muted() { return isDark() ? '#94a3b8' : '#64748b'; }
	function paper() { return isDark() ? '#0f172a' : '#ffffff'; }
	function mix(hex, a) {
		var h = hex.replace('#', '');
		var n = parseInt(h, 16);
		return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
	}

	function makeCanvas(div) {
		div.innerHTML = '';
		var canvas = document.createElement('canvas');
		canvas.style.cssText = 'display:block;width:100%;height:100%;cursor:grab;touch-action:none;';
		div.appendChild(canvas);
		var ctx = canvas.getContext('2d');
		var state = { yaw: -0.65, pitch: 0.38, zoom: 1, dist: 1.4 };
		var W = 1, H = 1, raf = 0;
		function resize() {
			var r = div.getBoundingClientRect();
			var dpr = Math.min(2, window.devicePixelRatio || 1);
			W = Math.max(1, Math.round(r.width));
			H = Math.max(1, Math.round(r.height));
			canvas.width = Math.round(W * dpr);
			canvas.height = Math.round(H * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		}
		function project(p) {
			var x = p[0], y = p[1], z = p[2];
			var cy = Math.cos(state.yaw), sy = Math.sin(state.yaw);
			var x1 = cy * x + sy * z, z1 = -sy * x + cy * z;
			var cp = Math.cos(state.pitch), sp = Math.sin(state.pitch);
			var y1 = cp * y - sp * z1, z2 = sp * y + cp * z1;
			var f = 4.2, s = f / Math.max(0.6, f + z2 + state.dist) * state.zoom;
			var m = Math.min(W, H) * 0.5;
			return [W / 2 + x1 * s * m, H / 2 - y1 * s * m, z2];
		}
		var drawFn = null;
		function request() {
			if (raf) return;
			raf = requestAnimationFrame(function () { raf = 0; resize(); if (drawFn) drawFn(); });
		}
		var drag = null;
		canvas.addEventListener('pointerdown', function (e) {
			drag = { x: e.clientX, y: e.clientY, yaw: state.yaw, pitch: state.pitch };
			canvas.setPointerCapture(e.pointerId);
			canvas.style.cursor = 'grabbing';
		});
		canvas.addEventListener('pointermove', function (e) {
			if (!drag) return;
			state.yaw = drag.yaw + (e.clientX - drag.x) * 0.008;
			state.pitch = Math.max(-1.3, Math.min(1.3, drag.pitch + (e.clientY - drag.y) * 0.008));
			request();
		});
		canvas.addEventListener('pointerup', function () { drag = null; canvas.style.cursor = 'grab'; });
		canvas.addEventListener('pointercancel', function () { drag = null; canvas.style.cursor = 'grab'; });
		canvas.addEventListener('wheel', function (e) {
			e.preventDefault();
			state.zoom = Math.max(0.45, Math.min(2.4, state.zoom * (e.deltaY > 0 ? 0.93 : 1.07)));
			request();
		}, { passive: false });
		if (typeof ResizeObserver !== 'undefined') new ResizeObserver(request).observe(div);
		window.addEventListener('resize', request);
		return { ctx: ctx, state: state, request: request, project: project, canvas: canvas,
			setDraw: function (fn) { drawFn = fn; request(); }, dims: function () { return [W, H]; } };
	}

	function quad(ctx, pts, fill, stroke) {
		ctx.beginPath();
		ctx.moveTo(pts[0][0], pts[0][1]);
		for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
		ctx.closePath();
		ctx.fillStyle = fill;
		ctx.fill();
		if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 0.7; ctx.stroke(); }
	}

	function label(ctx, x, y, text, color, size) {
		ctx.font = '600 ' + (size || 11) + 'px system-ui, sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.lineWidth = 3;
		ctx.strokeStyle = paper();
		ctx.strokeText(text, x, y);
		ctx.fillStyle = color;
		ctx.fillText(text, x, y);
	}

	function drawSurfaces(renderer, specs) {
		var P = renderer.project, ctx = renderer.ctx, n = 13, quads = [];
		specs.forEach(function (s) {
			var grid = [];
			for (var i = 0; i < n; i++) {
				grid.push([]);
				for (var j = 0; j < n; j++) {
					var u = -2 + 4 * i / (n - 1), v = -1.5 + 3 * j / (n - 1);
					grid[i].push(s.point(u, v));
				}
			}
			for (var a = 0; a < n - 1; a++) {
				for (var b = 0; b < n - 1; b++) {
					var ps = [P(grid[a][b]), P(grid[a + 1][b]), P(grid[a + 1][b + 1]), P(grid[a][b + 1])];
					var z = (ps[0][2] + ps[1][2] + ps[2][2] + ps[3][2]) / 4;
					quads.push({ z: z, ps: ps, color: s.color, alpha: s.alpha });
				}
			}
		});
		quads.sort(function (a, b) { return b.z - a.z; });
		quads.forEach(function (q) { quad(ctx, q.ps, mix(q.color, q.alpha), mix(q.color, q.alpha * 1.8)); });
		return P;
	}

	function drawWords(ctx, P, items) {
		items.forEach(function (w) {
			var p = P(w.pos);
			ctx.beginPath();
			ctx.arc(p[0], p[1], w.r || 4, 0, Math.PI * 2);
			ctx.fillStyle = w.color || ink();
			ctx.fill();
			ctx.lineWidth = 1.5;
			ctx.strokeStyle = paper();
			ctx.stroke();
			label(ctx, p[0], p[1] - 10, w.text, w.color || ink(), w.size || 11);
		});
	}

	var LANGS = [
		{ label: 'English', color: '#3b82f6', rot: 0.00, shear: 0.00, t: [-1.15, -0.55, 0.15],
			words: ['open', 'meaning', 'sentence'] },
		{ label: 'Deutsch', color: '#63a44b', rot: 0.85, shear: 0.26, t: [1.25, 0.62, -0.10],
			words: ['lernen', 'denken', 'Menge'] },
		{ label: 'Français', color: '#9185be', rot: 1.55, shear: -0.22, t: [0.10, -1.25, 0.55],
			words: ['ensemble', 'entrer', 'prendre'] },
		{ label: 'Python', color: '#9f9700', rot: 2.25, shear: 0.36, t: [0.35, 1.20, -0.45],
			words: ['len', 'open', 'append'] }
	];

	function basePoint(u, v) { return [u, v, 0.42 * Math.sin(u * 1.05) * Math.cos(v * 1.05)]; }

	function transformPoint(p, lang) {
		var x = p[0], y = p[1], z = p[2];
		x += lang.shear * y;
		y += lang.shear * 0.35 * z;
		var cy = Math.cos(lang.rot), sy = Math.sin(lang.rot);
		var x1 = cy * x - sy * y, y1 = sy * x + cy * y;
		var cp = Math.cos(lang.rot * 0.55), sp = Math.sin(lang.rot * 0.55);
		var y2 = cp * y1 - sp * z, z2 = sp * y1 + cp * z;
		return [x1 + lang.t[0], y2 + lang.t[1], z2 + lang.t[2]];
	}

	window.ManifoldScenes = {
		renderLanguages: function (containerId) {
			var div = document.getElementById(containerId);
			if (!div) return;
			var r = makeCanvas(div);
			var specs = LANGS.map(function (lang) {
				return {
					color: lang.color, alpha: 0.30,
					point: function (u, v) { return transformPoint(basePoint(u, v), lang); }
				};
			});
			function draw() {
				var ctx = r.ctx, d = r.dims(), W = d[0], H = d[1];
				ctx.clearRect(0, 0, W, H);
				var P = drawSurfaces(r, specs);
				var words = [];
				LANGS.forEach(function (lang) {
					// The shared token "en" touches each manifold at a different
					// point; the surfaces cross, only the token is common.
					var contact = transformPoint([0, 0, 0], lang);
					words.push({ pos: contact, text: 'en', color: ink(), r: 7, size: 15 });
					lang.words.forEach(function (word, k) {
						var uv = [[0.9, 0.45], [-0.9, -0.35], [0.15, -0.9]][k];
						words.push({ pos: transformPoint(basePoint(uv[0], uv[1]), lang), text: word, color: lang.color, size: 10 });
					});
					var tag = transformPoint([-2, -1.5, 0], lang);
					words.push({ pos: tag, text: lang.label, color: lang.color, r: 2, size: 12 });
				});
				drawWords(ctx, P, words);
			}
			r.setDraw(draw);
			if (window.__MN_DARK && __MN_DARK.onChange) __MN_DARK.onChange(draw);
			window.addEventListener('tm:theme', draw);
		},

		renderDual: function (containerId, controlsId) {
			var div = document.getElementById(containerId);
			if (!div) return;
			var r = makeCanvas(div);
			var state = { rot: 55, skew: 0.35 };
			var words = [
				{ en: 'king', jp: '王様', u: 1.2, v: -0.6, c: '#f59e0b' },
				{ en: 'queen', jp: '女王', u: 1.2, v: 0.6, c: '#f59e0b' },
				{ en: 'man', jp: '男', u: -0.5, v: -0.6, c: '#3b82f6' },
				{ en: 'woman', jp: '女', u: -0.5, v: 0.6, c: '#3b82f6' }
			];
			function enPoint(u, v) { return basePoint(u, v); }
			function jpPoint(u, v) {
				var x = u + state.skew * v;
				var y = v + state.skew * 0.35 * basePoint(u, v)[2];
				var rad = state.rot * Math.PI / 180;
				var p = basePoint(u, v);
				return [x * Math.cos(rad) - y * Math.sin(rad), x * Math.sin(rad) + y * Math.cos(rad), p[2] + 0.75];
			}
			var specs = [
				{ color: '#3b82f6', alpha: 0.30, point: enPoint },
				{ color: '#63a44b', alpha: 0.30, point: jpPoint }
			];
			function draw() {
				var ctx = r.ctx, d = r.dims(), W = d[0], H = d[1];
				ctx.clearRect(0, 0, W, H);
				var P = drawSurfaces(r, specs);
				var items = [];
				words.forEach(function (w) {
					var a = enPoint(w.u, w.v), b = jpPoint(w.u, w.v);
					var pa = P(a), pb = P(b);
					ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]);
					ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(139,92,246,0.55)'; ctx.lineWidth = 1.4; ctx.stroke();
					ctx.setLineDash([]);
					items.push({ pos: a, text: w.en, color: '#1e40af', r: 4, size: 10 });
					items.push({ pos: b, text: w.jp, color: '#065f46', r: 4, size: 10 });
				});
				drawWords(ctx, P, items);
			}
			r.setDraw(draw);
			var controls = controlsId ? document.getElementById(controlsId) : null;
			if (controls && !controls._built) {
				controls._built = true;
				controls.innerHTML =
					'<label style="display:flex;align-items:center;gap:8px;font-size:.82rem;color:var(--tm-muted,#64748b);margin:4px 0;">Rotation ' +
					'<input type="range" id="ms-rot" min="0" max="180" step="1" value="55" style="flex:1;min-width:110px"><output id="ms-rot-out">55°</output></label>' +
					'<label style="display:flex;align-items:center;gap:8px;font-size:.82rem;color:var(--tm-muted,#64748b);margin:4px 0;">Skew ' +
					'<input type="range" id="ms-skew" min="0" max="0.8" step="0.01" value="0.35" style="flex:1;min-width:110px"><output id="ms-skew-out">0.35</output></label>' +
					'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">' +
					'<button type="button" class="btn-demo btn-demo--green" id="ms-align">Align ▶</button>' +
					'<button type="button" class="btn-demo" id="ms-reset">Reset</button></div>';
				var rot = controls.querySelector('#ms-rot'), skew = controls.querySelector('#ms-skew');
				rot.addEventListener('input', function () { state.rot = parseFloat(this.value); controls.querySelector('#ms-rot-out').textContent = Math.round(state.rot) + '°'; r.request(); });
				skew.addEventListener('input', function () { state.skew = parseFloat(this.value); controls.querySelector('#ms-skew-out').textContent = state.skew.toFixed(2); r.request(); });
				controls.querySelector('#ms-reset').addEventListener('click', function () {
					state.rot = 55; state.skew = 0.35; rot.value = 55; skew.value = 0.35;
					controls.querySelector('#ms-rot-out').textContent = '55°'; controls.querySelector('#ms-skew-out').textContent = '0.35'; r.request();
				});
				controls.querySelector('#ms-align').addEventListener('click', function () {
					var t0 = performance.now(), r0 = state.rot, s0 = state.skew;
					function step(now) {
						var k = Math.min(1, (now - t0) / 800), e = 1 - Math.pow(1 - k, 3);
						state.rot = r0 * (1 - e); state.skew = s0 * (1 - e);
						rot.value = state.rot; skew.value = state.skew;
						controls.querySelector('#ms-rot-out').textContent = Math.round(state.rot) + '°';
						controls.querySelector('#ms-skew-out').textContent = state.skew.toFixed(2);
						r.request();
						if (k < 1) requestAnimationFrame(step);
					}
					requestAnimationFrame(step);
				});
			}
			window.addEventListener('tm:theme', function () { r.request(); });
		}
	};
})();
