"use strict";

// ============================================================
// EXPLAINABILITY LIB - shared helpers for the deep
// explainability tabs (Adversarial Examples, CKA / Separability).
//
// Provides: theme-aware colors, model/data access, sample
// batching, per-layer activation capture, linear CKA,
// class separability, colormaps, Plotly helpers and
// tensor-to-canvas rendering.
// ============================================================

var ExplainabilityLib = (function () {

	// ------------------------------------------------------------
	// THEME
	// ------------------------------------------------------------

	function isDark() {
		return typeof is_dark_mode !== "undefined" && is_dark_mode === true;
	}

	function themeColors() {
		var dark = isDark();
		return {
			dark: dark,
			text: dark ? "#e8e8e8" : "#333333",
			subtext: dark ? "#a0a0a0" : "#777777",
			grid: dark ? "rgba(140,140,160,0.25)" : "rgba(128,128,128,0.25)",
			axis: dark ? "#9a9aa5" : "#888888",
			canvasBg: dark ? "#14141f" : "#f5f4ef",
			panelBg: dark ? "rgba(22,22,34,0.55)" : "rgba(255,255,255,0.55)",
			panelBorder: dark ? "rgba(120,130,200,0.25)" : "rgba(90,110,180,0.25)"
		};
	}

	var _themeCallbacks = [];

	function onThemeChange(fn) {
		if (typeof fn === "function") {
			_themeCallbacks.push(fn);
		}
	}

	if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
		window.addEventListener("asanai_theme_change", function () {
			for (var i = 0; i < _themeCallbacks.length; i++) {
				try {
					_themeCallbacks[i]();
				} catch (e) {
					err("[ExplainabilityLib] theme callback failed: " + e);
				}
			}
		});
	}

	// ------------------------------------------------------------
	// MODEL / DATA ACCESS
	// ------------------------------------------------------------

	function getModel() {
		if (typeof model !== "undefined" && model && model.layers) {
			return model;
		}

		return null;
	}

	function hasModel() {
		return getModel() !== null;
	}

	function layerNames() {
		var m = getModel();
		if (!m) return [];

		var names = [];
		for (var i = 0; i < m.layers.length; i++) {
			names.push(m.layers[i].name || ("layer_" + i));
		}

		return names;
	}

	function isImageInput() {
		try {
			return typeof input_shape_is_image === "function" && input_shape_is_image();
		} catch (e) {
			return false;
		}
	}

	function lastLayerActivation() {
		try {
			return typeof get_last_layer_activation_function === "function"
				? (get_last_layer_activation_function() || "").toLowerCase()
				: "";
		} catch (e) {
			return "";
		}
	}

	function isClassification() {
		if (lastLayerActivation() === "softmax") {
			return true;
		}

		try {
			return typeof model_output_shape_looks_like_classification === "function"
				&& model_output_shape_looks_like_classification();
		} catch (e) {
			return false;
		}
	}

	function numClasses() {
		var m = getModel();

		return (m && m.outputShape && m.outputShape.length === 2) ? m.outputShape[1] : 1;
	}

	async function getXy() {
		if (typeof xy_data_global !== "undefined" && xy_data_global && xy_data_global.x) {
			return xy_data_global;
		}

		// silent load: never let the "Autotab?" checkbox yank the
		// user to the data tab while we load in the background
		var cb = null;
		var wasChecked = false;

		try {
			cb = window.jQuery("#jump_to_interesting_tab");
			wasChecked = cb.length > 0 && cb.is(":checked");

			if (wasChecked) {
				cb.prop("checked", false);
			}
		} catch (e) { /* no jquery */ }

		try {
			return await get_x_and_y();
		} finally {
			try {
				if (wasChecked && cb) {
					cb.prop("checked", true);
				}
			} catch (e) { /* gone */ }
		}
	}

	function inputRange(x) {
		var maxVal = tf.max(x).dataSync()[0];
		var minVal = tf.min(x).dataSync()[0];

		if (isFinite(maxVal) && maxVal <= 1.5 && minVal >= -0.01) {
			return { min: 0, max: 1 };
		}

		return { min: 0, max: 255 };
	}

	function seedImage(x) {
		return tf.tidy(function () {
			var t = x.slice([0], [1]);

			if (x.shape.length === 4) {
				t = t.squeeze([0]);
			}

			return t.clone();
		});
	}

	// ------------------------------------------------------------
	// SAMPLING
	// ------------------------------------------------------------

	function subsampleBatch(x, y, maxN) {
		var n = x.shape[0];

		if (n <= maxN) {
			return {
				x: tf.tidy(function () { return x.clone(); }),
				y: y ? tf.tidy(function () { return y.clone(); }) : null,
				indices: null
			};
		}

		var idx = [];
		var step = n / maxN;

		for (var i = 0; i < maxN; i++) {
			idx.push(Math.min(n - 1, Math.floor(i * step)));
		}

		return {
			x: tf.gather(x, tf.tensor1d(idx, "int32")),
			y: y ? tf.gather(y, tf.tensor1d(idx, "int32")) : null,
			indices: idx
		};
	}

	function toOneHotY(y, numCats) {
		if (!y) return null;
		if (y.shape.length === 2) return y;

		return tf.tidy(function () {
			return tf.oneHot(y.toInt(), numCats);
		});
	}

	// ------------------------------------------------------------
	// PER-LAYER ACTIVATION CAPTURE
	// ------------------------------------------------------------

	function applyLayer(layer, inputs, kwargs) {
		if (typeof layer.call === "function") {
			return layer.call(inputs, kwargs);
		}

		return layer.apply(inputs, kwargs);
	}

	function captureLayerActivations(x) {
		var m = getModel();
		if (!m) return null;

		var acts = [];
		var names = [];
		var cur = x;

		for (var i = 0; i < m.layers.length; i++) {
			try {
				cur = applyLayer(m.layers[i], cur, { training: false });
				acts.push(cur);
				names.push(m.layers[i].name || ("layer_" + i));
			} catch (e) {
				break;
			}
		}

		return { acts: acts, names: names };
	}

	// NOTE: for rank > 2 this returns a VIEW (reshape) that shares its
	// buffer with t. Dispose t (the owner), never the view, and only
	// after the view is no longer used.

	function flatten2d(t) {
		if (t.shape.length <= 2) {
			return t;
		}

		return t.reshape([t.shape[0], -1]);
	}

	// ------------------------------------------------------------
	// LINEAR CKA (Kornblith et al. 2019)
	// ------------------------------------------------------------

	function linearCKA(A, B) {
		var a = tf.cast(flatten2d(A), "float32");
		var b = tf.cast(flatten2d(B), "float32");

		var result = tf.tidy(function () {
			var ac = tf.sub(a, tf.mean(a, 0, true));
			var bc = tf.sub(b, tf.mean(b, 0, true));
			var kx = tf.matMul(ac, ac, false, true);
			var ky = tf.matMul(bc, bc, false, true);
			var xy = tf.sum(tf.mul(kx, ky));
			var nx = tf.sqrt(tf.sum(tf.square(kx)));
			var ny = tf.sqrt(tf.sum(tf.square(ky)));
			var denom = tf.mul(nx, ny);

			return tf.where(
				tf.greater(denom, 1e-12),
				tf.div(xy, denom),
				tf.scalar(0)
			);
		});

		var v = result.dataSync()[0];

		a.dispose();
		b.dispose();
		result.dispose();

		if (!isFinite(v)) {
			return 0;
		}

		return Math.max(0, Math.min(1, v));
	}

	function ckaMatrix(acts2d) {
		var n = acts2d.length;
		var out = [];

		for (var i = 0; i < n; i++) {
			out.push(new Array(n).fill(1));
		}

		for (i = 0; i < n; i++) {
			for (var j = i + 1; j < n; j++) {
				var v = linearCKA(acts2d[i], acts2d[j]);
				out[i][j] = v;
				out[j][i] = v;
			}
		}

		return out;
	}

	// ------------------------------------------------------------
	// CLASS SEPARABILITY (between/within class scatter ratio)
	// ------------------------------------------------------------

	function classSeparability(acts2d, yOneHot) {
		var aData = flatten2d(acts2d).dataSync();
		var yData = yOneHot.dataSync();

		var N = acts2d.shape[0];
		var D = acts2d.shape[1];
		var C = yOneHot.shape[1];

		var clsOf = new Array(N);
		var classCounts = new Array(C).fill(0);

		for (var i = 0; i < N; i++) {
			var best = 0;
			var bv = -1;

			for (var c = 0; c < C; c++) {
				var v = yData[i * C + c];
				if (v > bv) {
					bv = v;
					best = c;
				}
			}

			clsOf[i] = best;
			classCounts[best]++;
		}

		var globalMean = new Array(D).fill(0);

		for (i = 0; i < N; i++) {
			for (var d = 0; d < D; d++) {
				globalMean[d] += aData[i * D + d];
			}
		}

		for (d = 0; d < D; d++) {
			globalMean[d] /= N;
		}

		var centroids = [];

		for (c = 0; c < C; c++) {
			var sum = new Array(D).fill(0);
			var cnt = 0;

			for (i = 0; i < N; i++) {
				if (clsOf[i] !== c) continue;
				cnt++;

				for (d = 0; d < D; d++) {
					sum[d] += aData[i * D + d];
				}
			}

			var cent = new Array(D).fill(0);

			if (cnt > 0) {
				for (d = 0; d < D; d++) {
					cent[d] = sum[d] / cnt;
				}
			}

			centroids.push(cent);
		}

		function dist(u, v) {
			var s = 0;

			for (var k = 0; k < u.length; k++) {
				var diff = u[k] - v[k];
				s += diff * diff;
			}

			return Math.sqrt(s);
		}

		var perClass = new Array(C).fill(0);

		for (c = 0; c < C; c++) {
			if (classCounts[c] === 0) continue;

			var inter = dist(centroids[c], globalMean);
			var sqSum = 0;

			for (i = 0; i < N; i++) {
				if (clsOf[i] !== c) continue;
				var dd2 = 0;

				for (d = 0; d < D; d++) {
					var dv = aData[i * D + d] - centroids[c][d];
					dd2 += dv * dv;
				}

				sqSum += dd2;
			}

			var intra = Math.sqrt(sqSum / classCounts[c]);

			perClass[c] = inter / (intra + 1e-6);
		}

		var valid = perClass.filter(function (v) { return v > 0; });
		var score = valid.length ? valid.reduce(function (a, b) { return a + b; }, 0) / valid.length : 0;

		return {
			perClass: perClass,
			score: score,
			numClasses: C,
			classCounts: classCounts,
			classNames: null
		};
	}

	// ------------------------------------------------------------
	// COLORMAPS
	// ------------------------------------------------------------

	var VIRIDIS_STOPS = [
		[68, 1, 84],
		[72, 40, 120],
		[62, 74, 137],
		[49, 104, 142],
		[38, 130, 142],
		[31, 158, 137],
		[53, 183, 121],
		[109, 205, 89],
		[180, 222, 44],
		[253, 231, 37]
	];

	function viridis(t) {
		if (!isFinite(t)) t = 0;
		if (t < 0) t = 0;
		if (t > 1) t = 1;

		var pos = t * (VIRIDIS_STOPS.length - 1);
		var lo = Math.floor(pos);
		var hi = Math.min(VIRIDIS_STOPS.length - 1, lo + 1);
		var f = pos - lo;
		var a = VIRIDIS_STOPS[lo];
		var b = VIRIDIS_STOPS[hi];

		return [
			Math.round(a[0] + (b[0] - a[0]) * f),
			Math.round(a[1] + (b[1] - a[1]) * f),
			Math.round(a[2] + (b[2] - a[2]) * f)
		];
	}

	function normalize01(matrix) {
		var min = Infinity;
		var max = -Infinity;

		for (var i = 0; i < matrix.length; i++) {
			for (var j = 0; j < matrix[i].length; j++) {
				if (matrix[i][j] < min) min = matrix[i][j];
				if (matrix[i][j] > max) max = matrix[i][j];
			}
		}

		var range = (max - min) || 1;
		var out = [];

		for (i = 0; i < matrix.length; i++) {
			out.push([]);

			for (j = 0; j < matrix[i].length; j++) {
				out[i].push((matrix[i][j] - min) / range);
			}
		}

		return out;
	}

	// ------------------------------------------------------------
	// TENSOR <-> CANVAS
	// ------------------------------------------------------------

	function tensorToCanvas(t, canvas, range) {
		var r = range || { min: 0, max: 255 };
		var data = tf.tidy(function () {
			var t3 = tf.cast(t, "float32");
			var mn = tf.min(t3);
			var mx = tf.max(t3);
			var span = tf.sub(mx, mn);

			var norm = tf.div(tf.sub(t3, mn), tf.add(span, tf.scalar(1e-8)));

			return norm.dataSync();
		});

		var shape = t.shape;
		var H = shape[0];
		var W = shape[1];
		var C = shape.length >= 3 ? shape[2] : 1;

		canvas.width = W;
		canvas.height = H;
		var ctx = canvas.getContext("2d");
		var img = ctx.createImageData(W, H);

		for (var y = 0; y < H; y++) {
			for (var x = 0; x < W; x++) {
				var p = (y * W + x) * 4;

				if (C >= 3) {
					img.data[p] = Math.round(data[(y * W + x) * C + 0] * 255);
					img.data[p + 1] = Math.round(data[(y * W + x) * C + 1] * 255);
					img.data[p + 2] = Math.round(data[(y * W + x) * C + 2] * 255);
				} else {
					var rgb = viridis(data[(y * W + x) * C]);
					img.data[p] = rgb[0];
					img.data[p + 1] = rgb[1];
					img.data[p + 2] = rgb[2];
				}

				img.data[p + 3] = 255;
			}
		}

		ctx.putImageData(img, 0, 0);
	}

	function attributionToCanvas(map2d, canvas) {
		canvas.width = map2d[0].length;
		canvas.height = map2d.length;
		var ctx = canvas.getContext("2d");
		var img = ctx.createImageData(canvas.width, canvas.height);

		var norm = normalize01(map2d);

		for (var y = 0; y < map2d.length; y++) {
			for (var x = 0; x < map2d[0].length; x++) {
				var p = (y * canvas.width + x) * 4;
				var rgb = viridis(norm[y][x]);

				img.data[p] = rgb[0];
				img.data[p + 1] = rgb[1];
				img.data[p + 2] = rgb[2];
				img.data[p + 3] = 255;
			}
		}

		ctx.putImageData(img, 0, 0);
	}

	// ------------------------------------------------------------
	// PLOTLY HELPERS (theme-neutral: transparent bg, gray axes)
	// ------------------------------------------------------------

	function baseLayout(extra) {
		var tc = themeColors();
		var layout = {
			paper_bgcolor: "rgba(0,0,0,0)",
			plot_bgcolor: "rgba(0,0,0,0)",
			font: { color: tc.axis, family: "Arial, Helvetica, sans-serif", size: 13 },
			margin: { t: 30, b: 55, l: 60, r: 30 },
			xaxis: { gridcolor: tc.grid, zerolinecolor: tc.grid, automargin: true },
			yaxis: { gridcolor: tc.grid, zerolinecolor: tc.grid, automargin: true },
			showlegend: false,
			responsive: true
		};

		if (extra) {
			for (var k in extra) {
				if (Object.prototype.hasOwnProperty.call(extra, k)) {
					if ((k === "xaxis" || k === "yaxis") &&
						typeof layout[k] === "object" && typeof extra[k] === "object") {
						for (var k2 in extra[k]) {
							if (Object.prototype.hasOwnProperty.call(extra[k], k2)) {
								layout[k][k2] = extra[k][k2];
							}
						}
					} else {
						layout[k] = extra[k];
					}
				}
			}
		}

		return layout;
	}

	function plotHeatmap(divId, z, xLabels, yLabels, opts) {
		var o = opts || {};
		var div = document.getElementById(divId);
		if (!div) return null;

		var trace = {
			z: z,
			x: xLabels || null,
			y: yLabels || null,
			type: "heatmap",
			colorscale: "Viridis",
			hovertemplate: o.hovertemplate || "%{x}<br>%{y}<br>%{z:.3f}<extra></extra>"
		};

		var layout = baseLayout({
			margin: { t: 10, b: 90, l: 90, r: 30 },
			xaxis: { gridcolor: themeColors().grid, automargin: true, tickangle: -45 },
			yaxis: { gridcolor: themeColors().grid, automargin: true, autorange: "reversed" },
			showscale: o.showscale !== false
		});

		drawLabeled(div, [trace], layout, o.xtitle || "", o.ytitle || "");

		return div;
	}

	function plotLines(divId, traces, extraLayout) {
		var div = document.getElementById(divId);
		if (!div) return null;

		Plotly.react(div, traces, baseLayout(extraLayout), { responsive: true });

		return div;
	}

	// ------------------------------------------------------------
	// AXIS LABELS - five independent mechanisms, five guardrails
	// each. If one mechanism fails in the browser, the others
	// still get the labels on screen:
	//
	//  A1  proper Plotly title objects (explicit theme font)
	//  A2  paper-space annotation fallback (independent of the
	//      axis-title rendering path)
	//  A3  zero-size container guard (never render into 0x0)
	//  A4  re-render/resize on visibility + theme change
	//  A5  delivery guards (cache buster, version stamp,
	//      console escape hatch, one shared code path)
	// ------------------------------------------------------------

	var _resizeObservers = [];

	function _axisTitleObj(text, tc) {
		return { text: text, font: { size: 13, color: tc.text } };
	}

	function _observeResize(div) {
		if (typeof ResizeObserver === "undefined" || !div || div.__mnResizeObserved) return;
		div.__mnResizeObserved = true;

		try {
			var ro = new ResizeObserver(function (entries) {
				try {
					for (var i = 0; i < entries.length; i++) {
						var r = entries[i].contentRect;

						if (r.width > 0 && r.height > 0 && div._fullLayout) {
							Plotly.Plots.resize(div);
						}
					}
				} catch (e) { /* gone */ }
			});
			ro.observe(div);
			_resizeObservers.push(ro);
		} catch (e) { /* old browser */ }
	}

	function _drawWhenVisible(div, fn, triesLeft) {
		if (div.clientWidth > 0 && div.clientHeight > 0) {
			fn();
			return;
		}

		if (triesLeft <= 0) {
			wrn("[ExplainabilityLib] plot container has no size: " + (div.id || "unnamed"));
			return;
		}

		requestAnimationFrame(function () {
			_drawWhenVisible(div, fn, triesLeft - 1);
		});
	}

	function _verifyAxisLabels(div, xLabel, yLabel, stage) {
		if (!div || !div._fullLayout) return;

		try {
			var missingX = xLabel ? !div.querySelector(".xtitle text") : false;
			var missingY = yLabel ? !div.querySelector(".ytitle text") : false;

			if (!missingX && !missingY) return;

			if (stage === 0) {
				var fix = {};

				if (missingX) fix["xaxis.title"] = _axisTitleObj(xLabel, themeColors());
				if (missingY) fix["yaxis.title"] = _axisTitleObj(yLabel, themeColors());

				Plotly.relayout(div, fix);
				setTimeout(function () { _verifyAxisLabels(div, xLabel, yLabel, 1); }, 250);
				return;
			}

			var anns = [];
			var tc = themeColors();

			if (missingX) {
				anns.push({
					x: 0.5, y: -0.16, xref: "paper", yref: "paper",
					text: xLabel, showarrow: false,
					font: { size: 13, color: tc.text }
				});
			}

			if (missingY) {
				anns.push({
					x: -0.16, y: 0.5, xref: "paper", yref: "paper",
					text: yLabel, showarrow: false,
					font: { size: 13, color: tc.text },
					textangle: -90
				});
			}

			if (anns.length) {
				Plotly.addAnnotations(div, anns);
			}
		} catch (e) {
			wrn("[ExplainabilityLib] axis label verify failed: " + e);
		}
	}

	function ensureAxisTitles(div, xLabel, yLabel) {
		if (!div) return;
		_verifyAxisLabels(div, xLabel, yLabel, 0);
	}

	function forceAxisLabels(divId, xLabel, yLabel) {
		var div = document.getElementById(divId);
		if (!div) return false;
		_verifyAxisLabels(div, xLabel, yLabel, 1);
		return true;
	}

	function drawLabeled(div, traces, layout, xLabel, yLabel) {
		if (!div) return null;

		var tc = themeColors();

		xLabel = xLabel || "";
		yLabel = yLabel || "";

		if (xLabel) {
			layout.xaxis = layout.xaxis || {};
			layout.xaxis.title = _axisTitleObj(xLabel, tc);
		}

		if (yLabel) {
			layout.yaxis = layout.yaxis || {};
			layout.yaxis.title = _axisTitleObj(yLabel, tc);
		}

		_observeResize(div);

		_drawWhenVisible(div, function () {
			Plotly.react(div, traces, layout, { responsive: true });

			try { div.dataset.axisFix = "5x5"; } catch (e) { /* n/a */ }

			requestAnimationFrame(function () {
				requestAnimationFrame(function () {
					_verifyAxisLabels(div, xLabel, yLabel, 0);
				});
			});
		}, 3);

		return div;
	}

	// ------------------------------------------------------------
	// MISC
	// ------------------------------------------------------------

	function classLabelColors(n) {
		var palette = [
			"#4e79a7", "#f28e2b", "#e15759", "#76b7b2",
			"#59a14f", "#edc948", "#b07aa1", "#ff9da7",
			"#9c755f", "#bab0ac"
		];

		var out = [];

		for (var i = 0; i < n; i++) {
			out.push(palette[i % palette.length]);
		}

		return out;
	}

	function clamp(v, lo, hi) {
		return Math.max(lo, Math.min(hi, v));
	}

	return {
		isDark: isDark,
		themeColors: themeColors,
		onThemeChange: onThemeChange,
		getModel: getModel,
		hasModel: hasModel,
		layerNames: layerNames,
		isImageInput: isImageInput,
		lastLayerActivation: lastLayerActivation,
		isClassification: isClassification,
		numClasses: numClasses,
		getXy: getXy,
		inputRange: inputRange,
		seedImage: seedImage,
		subsampleBatch: subsampleBatch,
		toOneHotY: toOneHotY,
		applyLayer: applyLayer,
		captureLayerActivations: captureLayerActivations,
		flatten2d: flatten2d,
		linearCKA: linearCKA,
		ckaMatrix: ckaMatrix,
		classSeparability: classSeparability,
		viridis: viridis,
		normalize01: normalize01,
		tensorToCanvas: tensorToCanvas,
		attributionToCanvas: attributionToCanvas,
		plotHeatmap: plotHeatmap,
		plotLines: plotLines,
		drawLabeled: drawLabeled,
		ensureAxisTitles: ensureAxisTitles,
		forceAxisLabels: forceAxisLabels,
		baseLayout: baseLayout,
		classLabelColors: classLabelColors,
		clamp: clamp
	};
})();
