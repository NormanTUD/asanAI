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

	// contact = the local (u,v) point of this manifold that carries "en".
	// It always maps to the same world point (0,0,0), but sits in the middle
	// of one surface and near an edge of another.
	var LANGS = [
		{ label: 'English', color: '#3b82f6', rot: 0.00, shear: 0.00, contact: [0.0, 0.0],
			words: ['open', 'meaning', 'sentence'] },
		{ label: 'Deutsch', color: '#63a44b', rot: 0.85, shear: 0.26, contact: [0.0, 1.35],
			words: ['lernen', 'denken', 'Menge'] },
		{ label: 'Français', color: '#9185be', rot: 1.55, shear: -0.22, contact: [0.0, -1.35],
			words: ['ensemble', 'entrer', 'prendre'] },
		{ label: 'Python', color: '#9f9700', rot: 2.25, shear: 0.36, contact: [1.75, 0.0],
			words: ['len', 'open', 'append'] }
	];

	function basePoint(u, v) { return [u, v, 0.42 * Math.sin(u * 1.05) * Math.cos(v * 1.05)]; }

	function transformPoint(p, lang) {
		var c = basePoint(lang.contact[0], lang.contact[1]);
		var x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2];
		x += lang.shear * y;
		y += lang.shear * 0.35 * z;
		var cy = Math.cos(lang.rot), sy = Math.sin(lang.rot);
		var x1 = cy * x - sy * y, y1 = sy * x + cy * y;
		var cp = Math.cos(lang.rot * 0.55), sp = Math.sin(lang.rot * 0.55);
		var y2 = cp * y1 - sp * z, z2 = sp * y1 + cp * z;
		return [x1, y2, z2];
	}

	window.ManifoldScenes = {
		renderLanguages: function (containerId) {
			var div = document.getElementById(containerId);
			if (!div) return;
			var r = makeCanvas(div);
			var TOKENS = {
				English: ['op', 'en', 'mean', 'ing', 'sent', 'ence'],
				Deutsch: ['lern', 'en', 'denk', 'en', 'Meng', 'e'],
				'Français': ['ens', 'emble', 'ent', 'rer', 'prend', 're'],
				Python: ['l', 'en', 'op', 'en', 'app', 'end']
			};
			function draw() {
				var ctx = r.ctx, d = r.dims(), W = d[0], H = d[1];
				ctx.clearRect(0, 0, W, H);
				var P = r.project;
				var items = [];
				var n = 7;

				LANGS.forEach(function (lang) {
					var grid = [];
					for (var i = 0; i < n; i++) {
						grid.push([]);
						for (var j = 0; j < n; j++) {
							var u = -1.8 + 3.6 * i / (n - 1);
							var v = -1.35 + 2.7 * j / (n - 1);
							grid[i].push(transformPoint(basePoint(u, v), lang));
						}
					}
					// A Vietoris-Rips-like triangulated complex: vertices, edges
					// and 2-simplices, with no filled surface boundary.
					for (var a = 0; a < n - 1; a++) {
						for (var b = 0; b < n - 1; b++) {
							var p0 = P(grid[a][b]), p1 = P(grid[a + 1][b]);
							var p2 = P(grid[a + 1][b + 1]), p3 = P(grid[a][b + 1]);
							items.push({ z: (p0[2] + p1[2] + p2[2] + p3[2]) / 4, kind: 'tri', ps: [p0, p1, p2, p3], color: mix(lang.color, 0.07) });
							items.push({ z: (p0[2] + p1[2]) / 2, kind: 'line', a: p0, b: p1, color: mix(lang.color, 0.38) });
							items.push({ z: (p0[2] + p3[2]) / 2, kind: 'line', a: p0, b: p3, color: mix(lang.color, 0.38) });
						}
					}
					for (var x = 0; x < n; x++) {
						for (var y = 0; y < n; y++) {
							var pv = P(grid[x][y]);
							items.push({ z: pv[2], kind: 'dot', p: pv, color: mix(lang.color, 0.85), rr: 1.8 });
						}
					}
				});

				// Tokens: every word is a chain of pieces; "en" is one shared
				// vertex at the origin, so all four complexes meet there.
				var tokenItems = [];
				LANGS.forEach(function (lang) {
					var list = TOKENS[lang.label] || lang.words;
					list.forEach(function (tok, k) {
						if (tok === 'en') return;
						var ang = k * 1.9 + lang.rot;
						var rad = 0.55 + (k % 3) * 0.22;
						var pos = transformPoint(basePoint(lang.contact[0] + Math.cos(ang) * rad, lang.contact[1] + Math.sin(ang) * rad), lang);
						tokenItems.push({ pos: pos, text: tok, color: lang.color });
						items.push({ z: pos[2], kind: 'link', a: P(pos), b: P([0, 0, 0]), color: mix(lang.color, 0.22) });
					});
				});
				items.sort(function (a, b) { return b.z - a.z; });
				items.forEach(function (it) {
					if (it.kind === 'tri') {
						quad(ctx, it.ps, it.color, null);
					} else if (it.kind === 'line' || it.kind === 'link') {
						ctx.beginPath(); ctx.moveTo(it.a[0], it.a[1]); ctx.lineTo(it.b[0], it.b[1]);
						ctx.strokeStyle = it.color; ctx.lineWidth = it.kind === 'link' ? 1 : 1.1; ctx.stroke();
					} else if (it.kind === 'dot') {
						ctx.beginPath(); ctx.arc(it.p[0], it.p[1], it.rr, 0, Math.PI * 2);
						ctx.fillStyle = it.color; ctx.fill();
					}
				});

				tokenItems.forEach(function (t) {
					var p = P(t.pos);
					ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, Math.PI * 2);
					ctx.fillStyle = t.color; ctx.fill();
					label(ctx, p[0], p[1] - 8, t.text, t.color, 9.5);
				});
				var en = P([0, 0, 0]);
				ctx.beginPath(); ctx.arc(en[0], en[1], 6, 0, Math.PI * 2);
				ctx.fillStyle = ink(); ctx.fill();
				ctx.lineWidth = 2; ctx.strokeStyle = paper(); ctx.stroke();
				label(ctx, en[0], en[1] - 13, 'en', ink(), 15);
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
						var k = Math.min(1, (now - t0) / 5000), e = 1 - Math.pow(1 - k, 3);
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
		},

		/* The original, prettier Plotly dual-manifold animation from the
		   main embeddinglab. Used by tenminutes/intuition. */
		renderDualPlotly: function (containerId, controlsId) {
			var div = document.getElementById(containerId);
			if (!div || typeof Plotly === 'undefined') return;
			var de = !!(window.TM && TM.lang && TM.lang() === 'de');
			var T = de ? {
				rotation: 'Drehung', separation: 'Abstand', corr: 'Korrespondenzlinien',
				paths: 'Übersetzungspfade', align: 'Angleichen', reset: 'Zurücksetzen'
			} : {
				rotation: 'Rotation', separation: 'Separation', corr: 'Correspondence lines',
				paths: 'Translation paths', align: 'Align', reset: 'Reset'
			};
			var state = { rot: 55, sep: 5, corr: true, paths: true };

			function zAt(u, v) { return 0.3 * (u * u - v * v) + 0.15 * Math.sin(2 * u) * Math.cos(2 * v); }
			function enPos(u, v) { return [u, v, zAt(u, v)]; }
			function jpPos(u, v) {
				var x = u, y = v, z = zAt(u, v);
				var rad = state.rot * Math.PI / 180;
				return [x * Math.cos(rad) - y * Math.sin(rad), x * Math.sin(rad) + y * Math.cos(rad), z + state.sep];
			}
			var words = [
				{ en: 'king', jp: '王様', u: 1.2, v: -0.6, c: '#f59e0b' },
				{ en: 'queen', jp: '女王', u: 1.2, v: 0.6, c: '#f59e0b' },
				{ en: 'man', jp: '男', u: -0.5, v: -0.6, c: '#3b82f6' },
				{ en: 'woman', jp: '女', u: -0.5, v: 0.6, c: '#3b82f6' },
				{ en: 'prince', jp: '王子', u: 0.4, v: -0.6, c: '#10b981' },
				{ en: 'princess', jp: '王女', u: 0.4, v: 0.6, c: '#10b981' }
			];
			function surface(posFn) {
				var n = 20, x = [], y = [], z = [];
				for (var i = 0; i < n; i++) {
					var u = -2 + 4 * i / (n - 1), rx = [], ry = [], rz = [];
					for (var j = 0; j < n; j++) {
						var v = -1.5 + 3 * j / (n - 1), p = posFn(u, v);
						rx.push(p[0]); ry.push(p[1]); rz.push(p[2]);
					}
					x.push(rx); y.push(ry); z.push(rz);
				}
				return { x: x, y: y, z: z };
			}
			var idx = { jp: -1, enWords: -1, jpWords: -1, corr: [], jpPath: -1 };

			function pathData(posFn) {
				var pathWords = ['man', 'king', 'queen'], steps = 25, px = [], py = [], pz = [];
				for (var seg = 0; seg < pathWords.length - 1; seg++) {
					var from = words.find(function (w) { return w.en === pathWords[seg]; });
					var to = words.find(function (w) { return w.en === pathWords[seg + 1]; });
					for (var s = 0; s <= steps; s++) {
						var t = s / steps, iu = from.u + t * (to.u - from.u), iv = from.v + t * (to.v - from.v);
						var p = posFn(iu, iv); px.push(p[0]); py.push(p[1]); pz.push(p[2]);
					}
				}
				return { x: px, y: py, z: pz };
			}

			function build() {
				var traces = [];
				traces.push(Object.assign({ type: 'surface', opacity: 0.4, showscale: false, hoverinfo: 'skip', name: 'English', showlegend: false,
					colorscale: [[0, 'rgba(191,219,254,0.7)'], [1, 'rgba(96,165,250,0.7)']],
					contours: { x: { show: true, color: 'rgba(59,130,246,0.15)' }, y: { show: true, color: 'rgba(59,130,246,0.15)' }, z: { show: false } } }, surface(enPos)));
				idx.jp = traces.length;
				traces.push(Object.assign({ type: 'surface', opacity: 0.4, showscale: false, hoverinfo: 'skip', name: '日本語', showlegend: false,
					colorscale: [[0, 'rgba(187,247,208,0.7)'], [1, 'rgba(74,222,128,0.7)']],
					contours: { x: { show: true, color: 'rgba(16,185,129,0.15)' }, y: { show: true, color: 'rgba(16,185,129,0.15)' }, z: { show: false } } }, surface(jpPos)));
				idx.corr = [];
				if (state.corr) {
					words.forEach(function (w) {
						var a = enPos(w.u, w.v), b = jpPos(w.u, w.v);
						idx.corr.push(traces.length);
						traces.push({ type: 'scatter3d', x: [a[0], b[0]], y: [a[1], b[1]], z: [a[2], b[2]],
							mode: 'lines', line: { color: 'rgba(139,92,246,0.5)', width: 3, dash: 'dash' }, hoverinfo: 'skip', showlegend: false });
					});
				}
				var enX = [], enY = [], enZ = [], enT = [], jpX = [], jpY = [], jpZ = [], jpT = [], cs = [];
				words.forEach(function (w) {
					var a = enPos(w.u, w.v), b = jpPos(w.u, w.v);
					enX.push(a[0]); enY.push(a[1]); enZ.push(a[2]); enT.push(w.en);
					jpX.push(b[0]); jpY.push(b[1]); jpZ.push(b[2]); jpT.push(w.jp); cs.push(w.c);
				});
				idx.enWords = traces.length;
				traces.push({ type: 'scatter3d', x: enX, y: enY, z: enZ, mode: 'markers+text', text: enT, textposition: 'top center',
					textfont: { size: 11, color: '#1e40af' }, marker: { size: 7, color: cs, line: { width: 1, color: paper() } },
					name: 'English words', showlegend: false, hovertemplate: '<b>%{text}</b> (English)<extra></extra>' });
				idx.jpWords = traces.length;
				traces.push({ type: 'scatter3d', x: jpX, y: jpY, z: jpZ, mode: 'markers+text', text: jpT, textposition: 'bottom center',
					textfont: { size: 11, color: '#065f46' }, marker: { size: 7, symbol: 'diamond', color: cs, line: { width: 1, color: paper() } },
					name: 'Japanese words (日本語)', showlegend: false, hovertemplate: '<b>%{text}</b> (日本語)<extra></extra>' });

				idx.jpPath = -1;
				if (state.paths) {
					var ep = pathData(enPos), jpp = pathData(jpPos);
					traces.push({ type: 'scatter3d', x: ep.x, y: ep.y, z: ep.z, mode: 'lines', line: { width: 7, color: '#3b82f6' }, hoverinfo: 'skip', showlegend: false });
					idx.jpPath = traces.length;
					traces.push({ type: 'scatter3d', x: jpp.x, y: jpp.y, z: jpp.z, mode: 'lines', line: { width: 7, color: '#10b981' }, hoverinfo: 'skip', showlegend: false });
				}

				var layout = {
					margin: { l: 0, r: 0, b: 0, t: 0 }, showlegend: false,
					paper_bgcolor: 'rgba(0,0,0,0)',
					scene: {
						xaxis: { showgrid: true, gridcolor: isDark() ? '#1e293b' : '#f1f5f9', zeroline: false, showticklabels: false, title: '' },
						yaxis: { showgrid: true, gridcolor: isDark() ? '#1e293b' : '#f1f5f9', zeroline: false, showticklabels: false, title: '' },
						zaxis: { showgrid: true, gridcolor: isDark() ? '#1e293b' : '#f1f5f9', zeroline: false, showticklabels: false, title: '' },
						camera: { eye: { x: 1.5, y: 1.8, z: 1.2 } },
						aspectmode: 'data', bgcolor: isDark() ? '#0f172a' : '#ffffff'
					}
				};
				var done = Plotly.react(div, traces, layout, { displayModeBar: false, responsive: true });
				function clearLoader() { var l = div.querySelector('.tm-manifold-loading'); if (l) l.remove(); }
				if (done && done.then) done.then(clearLoader); else clearLoader();
			}

			/* Update only the Japanese-dependent traces, so dragging a slider
			   and the Align animation stay smooth instead of rebuilding the
			   whole 3D scene every frame. */
			function update() {
				var xs = [], ys = [], zs = [], inds = [];
				var js = surface(jpPos);
				xs.push(js.x); ys.push(js.y); zs.push(js.z); inds.push(idx.jp);
				var jx = [], jy = [], jz = [];
				words.forEach(function (w) { var p = jpPos(w.u, w.v); jx.push(p[0]); jy.push(p[1]); jz.push(p[2]); });
				xs.push(jx); ys.push(jy); zs.push(jz); inds.push(idx.jpWords);
				if (state.corr) {
					words.forEach(function (w, k) {
						var a = enPos(w.u, w.v), b = jpPos(w.u, w.v);
						xs.push([a[0], b[0]]); ys.push([a[1], b[1]]); zs.push([a[2], b[2]]); inds.push(idx.corr[k]);
					});
				}
				if (state.paths && idx.jpPath >= 0) {
					var jpp = pathData(jpPos);
					xs.push(jpp.x); ys.push(jpp.y); zs.push(jpp.z); inds.push(idx.jpPath);
				}
				Plotly.restyle(div, { x: xs, y: ys, z: zs }, inds);
			}

			var controls = controlsId ? document.getElementById(controlsId) : null;
			if (controls && !controls._built) {
				controls._built = true;
				controls.innerHTML =
					'<div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;font-size:.82rem;color:var(--tm-muted,#64748b);">' +
					'<label>' + T.rotation + ' <input type="range" id="ms-rot" min="0" max="180" step="1" value="55" style="width:120px;vertical-align:middle"><output id="ms-rot-out">55°</output></label>' +
					'<label>' + T.separation + ' <input type="range" id="ms-sep" min="0" max="8" step="0.1" value="5" style="width:120px;vertical-align:middle"><output id="ms-sep-out">5.0</output></label>' +
					'</div>' +
					'<div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-top:8px;font-size:.82rem;color:var(--tm-muted,#64748b);">' +
					'<label><input type="checkbox" id="ms-corr" checked> ' + T.corr + '</label>' +
					'<label><input type="checkbox" id="ms-paths" checked> ' + T.paths + '</label>' +
					'<button type="button" class="btn-demo btn-demo--green" id="ms-align">' + T.align + ' ▶</button>' +
					'<button type="button" class="btn-demo" id="ms-reset">' + T.reset + '</button></div>';
				var rot = controls.querySelector('#ms-rot'), sep = controls.querySelector('#ms-sep');
				rot.addEventListener('input', function () { state.rot = parseFloat(this.value); controls.querySelector('#ms-rot-out').textContent = Math.round(state.rot) + '°'; update(); });
				sep.addEventListener('input', function () { state.sep = parseFloat(this.value); controls.querySelector('#ms-sep-out').textContent = state.sep.toFixed(1); update(); });
				controls.querySelector('#ms-corr').addEventListener('change', function () { state.corr = this.checked; build(); });
				controls.querySelector('#ms-paths').addEventListener('change', function () { state.paths = this.checked; build(); });
				controls.querySelector('#ms-reset').addEventListener('click', function () {
					state.rot = 55; state.sep = 5; rot.value = 55; sep.value = 5;
					controls.querySelector('#ms-rot-out').textContent = '55°'; controls.querySelector('#ms-sep-out').textContent = '5.0'; update();
				});
				controls.querySelector('#ms-align').addEventListener('click', function () {
					var t0 = performance.now(), r0 = state.rot, s0 = state.sep;
					function step(now) {
						var k = Math.min(1, (now - t0) / 5000), e = 1 - Math.pow(1 - k, 3);
						state.rot = r0 * (1 - e); state.sep = s0 * (1 - e);
						rot.value = state.rot; sep.value = state.sep;
						controls.querySelector('#ms-rot-out').textContent = Math.round(state.rot) + '°';
						controls.querySelector('#ms-sep-out').textContent = state.sep.toFixed(1);
						update();
						if (k < 1) requestAnimationFrame(step);
					}
					requestAnimationFrame(step);
				});
			}
			build();
			window.addEventListener('tm:theme', build);
			if (window.__MN_DARK && __MN_DARK.onChange) __MN_DARK.onChange(build);
		}
	};
})();
