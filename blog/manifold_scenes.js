/* Shared 3D manifold scenes for the embedding/intuition lessons.
   Used by embeddinglab, tenminutes/intuition, tenminutes/embeddinglab and
   the lndw presentation. Requires Plotly to be loaded first. */
(function () {
	'use strict';

	var PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#ec4899', '#6366f1', '#84cc16', '#0ea5e9'];

	function isDark() {
		if (window.isDarkMode) return !!window.isDarkMode();
		if (document.documentElement.classList.contains('dark')) return true;
		try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
	}
	function ink() { return isDark() ? '#e2e8f0' : '#1e293b'; }
	function muted() { return isDark() ? '#94a3b8' : '#64748b'; }
	function grid() { return isDark() ? '#1e293b' : '#f1f5f9'; }
	function paper() { return isDark() ? '#0f172a' : '#ffffff'; }
	function rgba(hex, a) {
		var h = hex.replace('#', '');
		if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
		var n = parseInt(h, 16);
		return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
	}

	function baseLayout(title) {
		return {
			title: title ? { text: title, font: { size: 13, color: ink() } } : undefined,
			margin: { l: 0, r: 0, b: 0, t: title ? 34 : 0 },
			showlegend: false,
			paper_bgcolor: 'rgba(0,0,0,0)',
			scene: {
				xaxis: { showgrid: true, gridcolor: grid(), zeroline: false, showticklabels: false, title: '' },
				yaxis: { showgrid: true, gridcolor: grid(), zeroline: false, showticklabels: false, title: '' },
				zaxis: { showgrid: true, gridcolor: grid(), zeroline: false, showticklabels: false, title: '' },
				camera: { eye: { x: 1.55, y: 1.75, z: 1.25 } },
				aspectmode: 'data',
				bgcolor: paper()
			},
			font: { color: muted() }
		};
	}

	var LANGS = [
		{ label: 'English',    color: PALETTE[0], words: ['king', 'queen'],       rot: 0.00, shear: 0.00, amp: 1.00, freq: 1.00 },
		{ label: 'Deutsch',    color: PALETTE[1], words: ['König', 'Königin'],    rot: 0.42, shear: 0.14, amp: 1.15, freq: 1.15 },
		{ label: 'Français',   color: PALETTE[2], words: ['roi', 'reine'],        rot: 0.85, shear: 0.22, amp: 0.88, freq: 0.90 },
		{ label: 'Español',    color: PALETTE[3], words: ['rey', 'reina'],        rot: 1.22, shear: 0.31, amp: 1.08, freq: 1.08 },
		{ label: 'Italiano',   color: PALETTE[4], words: ['re', 'regina'],        rot: 1.60, shear: 0.10, amp: 0.94, freq: 1.25 },
		{ label: 'Português',  color: PALETTE[5], words: ['rei', 'rainha'],       rot: 1.98, shear: 0.26, amp: 1.12, freq: 0.96 },
		{ label: 'Nederlands', color: PALETTE[6], words: ['koning', 'koningin'],  rot: 2.34, shear: 0.18, amp: 0.90, freq: 1.12 },
		{ label: 'Svenska',    color: PALETTE[7], words: ['kung', 'drottning'],   rot: 2.72, shear: 0.34, amp: 1.05, freq: 0.88 },
		{ label: 'Dansk',      color: PALETTE[8], words: ['konge', 'dronning'],   rot: 3.08, shear: 0.20, amp: 0.98, freq: 1.20 },
		{ label: 'Norsk',      color: PALETTE[9], words: ['konge', 'dronning'],   rot: 3.46, shear: 0.28, amp: 1.10, freq: 0.94 }
	];

	function surfacePoint(lang, u, v) {
		// A saddle-ish sheet. amp/freq change the shape; shear and rotation
		// make the structure lie obliquely in space, not only rotate.
		var z = 0.32 * lang.amp * Math.sin(u * lang.freq) * Math.cos(v * lang.freq);
		var x = u + lang.shear * v;
		var y = v + lang.shear * 0.45 * z;
		var c = Math.cos(lang.rot), s = Math.sin(lang.rot);
		return [c * x - s * y, s * x + c * y, z];
	}

	function surfaceGrid(lang, n) {
		var xs = [], ys = [], zs = [], U = [], V = [];
		for (var i = 0; i < n; i++) {
			var u = -2 + (4 * i / (n - 1));
			U.push(u);
		}
		for (var j = 0; j < n; j++) V.push(-1.5 + (3 * j / (n - 1)));
		for (var a = 0; a < n; a++) {
			var rx = [], ry = [], rz = [];
			for (var b = 0; b < n; b++) {
				var p = surfacePoint(lang, U[a], V[b]);
				rx.push(p[0]); ry.push(p[1]); rz.push(p[2]);
			}
			xs.push(rx); ys.push(ry); zs.push(rz);
		}
		return { x: xs, y: ys, z: zs };
	}

	window.ManifoldScenes = {
		renderLanguages: function (containerId) {
			var div = document.getElementById(containerId);
			if (!div || typeof Plotly === 'undefined') return;
			var n = 23;
			var traces = [];
			LANGS.forEach(function (lang) {
				var g = surfaceGrid(lang, n);
				traces.push({
					type: 'surface', x: g.x, y: g.y, z: g.z,
					opacity: 0.34, showscale: false, hoverinfo: 'skip',
					name: lang.label,
					colorscale: [[0, rgba(lang.color, 0.12)], [1, rgba(lang.color, 0.5)]],
					contours: {
						x: { show: true, color: rgba(lang.color, 0.16), width: 1 },
						y: { show: true, color: rgba(lang.color, 0.16), width: 1 },
						z: { show: false }
					}
				});

				// Language-specific words on this manifold; they differ, but
				// every manifold passes through the shared token "en" at 0,0,0.
				var offsets = [[0.9, 0.45], [-0.85, -0.4]];
				lang.words.forEach(function (word, k) {
					var p = surfacePoint(lang, offsets[k][0], offsets[k][1]);
					traces.push({
						type: 'scatter3d', x: [p[0]], y: [p[1]], z: [p[2]],
						mode: 'markers+text', text: [word], textposition: k ? 'bottom center' : 'top center',
						textfont: { size: 10, color: lang.color },
						marker: { size: 4, color: lang.color, line: { width: 1, color: paper() } },
						showlegend: false, hovertemplate: '<b>' + word + '</b> · ' + lang.label + '<extra></extra>'
					});
				});

				// Surface name tag at a corner.
				var lp = surfacePoint(lang, -2, -1.5);
				traces.push({
					type: 'scatter3d', x: [lp[0]], y: [lp[1]], z: [lp[2]],
					mode: 'text', text: [lang.label],
					textfont: { size: 11, color: lang.color },
					showlegend: false, hoverinfo: 'skip'
				});
			});

			// The shared token: all ten surfaces meet here.
			traces.push({
				type: 'scatter3d', x: [0], y: [0], z: [0],
				mode: 'markers+text', text: ['en'], textposition: 'top center',
				textfont: { size: 15, color: ink() },
				marker: { size: 9, color: isDark() ? '#f8fafc' : '#0f172a', line: { width: 2, color: paper() } },
				showlegend: false, hovertemplate: '<b>en</b> · shared token<extra></extra>'
			});

			var layout = baseLayout('Ten language manifolds, one shared token "en"');
			layout.scene.camera = { eye: { x: 1.7, y: 1.9, z: 1.35 } };
			Plotly.react(div, traces, layout, { displayModeBar: false, responsive: true });
		},

		renderDual: function (containerId, controlsId) {
			var div = document.getElementById(containerId);
			if (!div || typeof Plotly === 'undefined') return;
			var controls = controlsId ? document.getElementById(controlsId) : null;
			var state = { rot: 55, skew: 0.35, aligned: false };

			function zAt(u, v) { return 0.3 * (u * u - v * v) + 0.15 * Math.sin(2 * u) * Math.cos(2 * v); }
			function enPos(u, v) { return [u, v, zAt(u, v)]; }
			function jpPos(u, v) {
				var x = u + state.skew * v;
				var y = v + state.skew * 0.4 * zAt(u, v);
				var r = state.rot * Math.PI / 180;
				return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r), zAt(u, v) + 0.8];
			}

			function surface(posFn) {
				var n = 25, x = [], y = [], z = [];
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

			var words = [
				{ en: 'king', jp: '王様', u: 1.2, v: -0.6, c: '#f59e0b' },
				{ en: 'queen', jp: '女王', u: 1.2, v: 0.6, c: '#f59e0b' },
				{ en: 'man', jp: '男', u: -0.5, v: -0.6, c: '#3b82f6' },
				{ en: 'woman', jp: '女', u: -0.5, v: 0.6, c: '#3b82f6' }
			];

			function draw() {
				var traces = [
					Object.assign({ type: 'surface', opacity: 0.4, showscale: false, hoverinfo: 'skip', name: 'English',
						colorscale: [[0, 'rgba(191,219,254,0.2)'], [1, 'rgba(96,165,250,0.55)']] }, surface(enPos)),
					Object.assign({ type: 'surface', opacity: 0.4, showscale: false, hoverinfo: 'skip', name: 'Japanese',
						colorscale: [[0, 'rgba(187,247,208,0.2)'], [1, 'rgba(74,222,128,0.55)']] }, surface(jpPos))
				];
				var enX = [], enY = [], enZ = [], jpX = [], jpY = [], jpZ = [], enT = [], jpT = [], colors = [];
				words.forEach(function (w) {
					var a = enPos(w.u, w.v), b = jpPos(w.u, w.v);
					enX.push(a[0]); enY.push(a[1]); enZ.push(a[2]); enT.push(w.en);
					jpX.push(b[0]); jpY.push(b[1]); jpZ.push(b[2]); jpT.push(w.jp); colors.push(w.c);
					traces.push({ type: 'scatter3d', x: [a[0], b[0]], y: [a[1], b[1]], z: [a[2], b[2]],
						mode: 'lines', line: { color: 'rgba(139,92,246,0.5)', width: 3, dash: 'dash' }, hoverinfo: 'skip' });
				});
				traces.push({ type: 'scatter3d', x: enX, y: enY, z: enZ, mode: 'markers+text', text: enT,
					textposition: 'top center', textfont: { size: 10, color: '#1e40af' },
					marker: { size: 6, color: colors, line: { width: 1, color: paper() } }, hoverinfo: 'skip' });
				traces.push({ type: 'scatter3d', x: jpX, y: jpY, z: jpZ, mode: 'markers+text', text: jpT,
					textposition: 'bottom center', textfont: { size: 10, color: '#065f46' },
					marker: { size: 6, symbol: 'diamond', color: colors, line: { width: 1, color: paper() } }, hoverinfo: 'skip' });

				var layout = baseLayout('Translation as a rotation and skew of two manifolds');
				Plotly.react(div, traces, layout, { displayModeBar: false, responsive: true });
			}

			if (controls && !controls._built) {
				controls._built = true;
				controls.innerHTML =
					'<label style="display:flex;align-items:center;gap:8px;font-size:.82rem;color:var(--tm-muted,#64748b);margin:4px 0;">' +
					'Rotation <input type="range" id="ms-rot" min="0" max="180" step="1" value="55" style="flex:1;min-width:120px">' +
					'<output id="ms-rot-out">55°</output></label>' +
					'<label style="display:flex;align-items:center;gap:8px;font-size:.82rem;color:var(--tm-muted,#64748b);margin:4px 0;">' +
					'Skew <input type="range" id="ms-skew" min="0" max="0.8" step="0.01" value="0.35" style="flex:1;min-width:120px">' +
					'<output id="ms-skew-out">0.35</output></label>' +
					'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">' +
					'<button type="button" class="btn-demo btn-demo--green" id="ms-align">Align ▶</button>' +
					'<button type="button" class="btn-demo" id="ms-reset">Reset</button></div>';
				controls.querySelector('#ms-rot').addEventListener('input', function () {
					state.rot = parseFloat(this.value);
					controls.querySelector('#ms-rot-out').textContent = Math.round(state.rot) + '°';
					draw();
				});
				controls.querySelector('#ms-skew').addEventListener('input', function () {
					state.skew = parseFloat(this.value);
					controls.querySelector('#ms-skew-out').textContent = state.skew.toFixed(2);
					draw();
				});
				controls.querySelector('#ms-reset').addEventListener('click', function () {
					state.rot = 55; state.skew = 0.35;
					controls.querySelector('#ms-rot').value = 55;
					controls.querySelector('#ms-skew').value = 0.35;
					controls.querySelector('#ms-rot-out').textContent = '55°';
					controls.querySelector('#ms-skew-out').textContent = '0.35';
					draw();
				});
				controls.querySelector('#ms-align').addEventListener('click', function () {
					var t0 = performance.now(), r0 = state.rot, s0 = state.skew;
					function step(now) {
						var k = Math.min(1, (now - t0) / 900);
						var e = 1 - Math.pow(1 - k, 3);
						state.rot = r0 * (1 - e);
						state.skew = s0 * (1 - e);
						controls.querySelector('#ms-rot').value = state.rot;
						controls.querySelector('#ms-skew').value = state.skew;
						controls.querySelector('#ms-rot-out').textContent = Math.round(state.rot) + '°';
						controls.querySelector('#ms-skew-out').textContent = state.skew.toFixed(2);
						draw();
						if (k < 1) requestAnimationFrame(step);
					}
					requestAnimationFrame(step);
				});
			}
			draw();
		}
	};
})();
