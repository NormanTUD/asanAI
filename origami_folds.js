"use strict";

/**
 * origami_folds.js — Live-Visualisierung der Datenmannigfaltigkeits-Faltung
 *
 * Basiert auf: Keup & Helias, "Origami in N dimensions: How feed-forward
 * networks manufacture linear separability" (arXiv:2203.11355).
 *
 * Zeigt Layer-Paare (unten Input, oben Output) mit Raumgitter, das die
 * Krümmung/Faltung der Mannigfaltigkeit sichtbar macht.
 *
 * ============================================================
 * PUBLIC API (window.OrigamiFolds)
 * ============================================================
 *
 *   OrigamiFolds.init()                 // hängt sich ans Ende des <body>
 *   OrigamiFolds.init("meineDivId")     // in ein Div per ID
 *   OrigamiFolds.init(domElement)       // in ein DOM-Element
 *   OrigamiFolds.init($("#meinDiv"))    // in ein jQuery-Objekt
 *
 *   OrigamiFolds.update()               // Singleton-Update
 *   OrigamiFolds.forceUpdate()          // ignoriert Change-Detection
 *   OrigamiFolds.destroy()              // vollständiges Aufräumen
 *   OrigamiFolds.getConfig() / setConfig({...})
 *
 * ============================================================
 * GLOBALS, DIE GELESEN WERDEN (alle optional / mit Guards)
 * ============================================================
 *   model, model._allLayers, xy_data_global, labels, is_classification,
 *   is_dark_mode, started_training, lang/language, tf, Plotly,
 *   cnn3d_data_revision
 */

var OrigamiFolds = (function (global) {

	// ============================================================
	// KONSTANTEN
	// ============================================================

	var SINGLETON_ID = "origami_folds_singleton";
	var PLOT_ID      = SINGLETON_ID + "_plot";
	var INFO_ID      = SINGLETON_ID + "_info";
	var CTRL_ID      = SINGLETON_ID + "_controls";
	var TITLE_ID     = SINGLETON_ID + "_title";
	var BTNROW_ID    = SINGLETON_ID + "_btnrow";
	var FOOT_ID      = SINGLETON_ID + "_foot";
	var LOG_PREFIX   = "[origami_folds]";

	var RELU_LIKE = ["relu", "relu6", "leakyrelu", "elu", "selu", "thresholdedrelu"];
	var SOFT_FOLD = ["sigmoid", "hardsigmoid", "tanh", "softsign", "softplus", "swish", "mish"];

	// ============================================================
	// STATE
	// ============================================================

	var _state = {
		container:        null,
		plotDiv:          null,
		infoDiv:          null,
		controlsDiv:      null,
		parentId:         null,
		parentElement:    null,

		initialized:      false,
		active:           false,
		deactivated:      false,
		deactivationMsg:  "",

		plotlyInitialized: false,
		plotlyLoading:     false,

		lastFingerprint:  null,
		lastViewHash:     null,
		lastDataRevision: -1,
		dataDirty:        false,
		pendingRender:    false,

		isVisible:        false,
		observer:         null,
		resizeObserver:   null,

		lastCameras:      {},
		userInteracting:  false,
		interactionTimer: null,
		rafId:            null,

		cachedX:          null,
		cachedColors:     null,
		cachedClassIdx:   null,
		cachedClassNames: null,
		cachedIsRegression: false,
		cachedSampleCount: 0,
		cachedXHash:      null,

		lastChainSignature: null,
		modelRef:           null,

		lastDarkMode:     null,
		darkModeTimer:    null,
		lastLang:         null,
		deactivationKey:  "",

		consecutiveErrors: 0,
		lastErrorMsg:      "",

		config: {
			maxPoints:          2500,
			pointSize:          2.6,
			pointOpacity:       0.72,
			showReluCuts:       true,
			reluCutLimit:       12,
			showBoundingBox:    true,
			showSoftFolds:      true,
			boxPadding:         0.12,
			maxLayersShown:     4,
			subplotHeight:      460,
			minSubplotWidth:    300,
			throttleMs:         450,
			legendMaxClasses:   24,
			smoothUpdates:      true,
			includeInputSpace:  true,

			showGrid:           true,
			gridResolution:     21,
			gridExtend:         1.5,
			gridLineWidth:      2.2,
			gridOpacity:        0.9,
			colorByCurvature:   true,
			showGridSurface:    true,
			gridSurfaceOpacity: 0.28,
			gridClampRange:     50,
			showDataPoints:     true,
			pairedLayout:       true
		}
	};

	var _lastRebuildTime = 0;

	// ============================================================
	// LOGGING
	// ============================================================

	function _log(msg) {
		try {
			if (typeof dbg === "function") { dbg(LOG_PREFIX + " " + msg); return; }
		} catch (e) { /* fall through */ }
		if (global.console && console.debug) console.debug(LOG_PREFIX, msg);
	}

	function _warn(msg) {
		try {
			if (typeof wrn === "function") { wrn(LOG_PREFIX + " " + msg); return; }
		} catch (e) { /* fall through */ }
		if (global.console && console.warn) console.warn(LOG_PREFIX, msg);
	}

	function _error(msg) {
		try {
			if (typeof err === "function") { err(LOG_PREFIX + " " + msg); return; }
		} catch (e) { /* fall through */ }
		if (global.console && console.error) console.error(LOG_PREFIX, msg);
	}

	function _tr(key, fallback) {
		try {
			if (typeof language !== "undefined" && language &&
			    typeof lang !== "undefined" && language[lang] &&
			    language[lang][key] != null) {
				return language[lang][key];
			}
		} catch (e) { /* fall through */ }
		return (fallback != null ? fallback : key);
	}

	// ============================================================
	// GUARDRAIL-HELPER
	// ============================================================

	function _hasTF() {
		return (typeof global.tf !== "undefined" && global.tf &&
		        typeof global.tf.tidy === "function" &&
		        typeof global.tf.model === "function");
	}

	function _hasPlotly() {
		return (typeof global.Plotly !== "undefined" && global.Plotly &&
		        typeof global.Plotly.react === "function");
	}

	function _hasModel() {
		try {
			if (!global.model || !global.model.layers) return false;
			if (!Array.isArray(global.model.layers)) return false;
			try { if (global.model.isDisposed === true) return false; }
			catch (e) { /* ignore */ }
			return true;
		} catch (e) { return false; }
	}

	function _layerAlive(layer) {
		if (!layer) return false;
		try {
			if (layer.isDisposed === true) return false;
			if (layer.isDisposedInternal === true) return false;
			return true;
		} catch (e) { return true; }
	}

	function _chainAlive(pairs) {
		if (!pairs || !pairs.length) return false;
		for (var i = 0; i < pairs.length; i++) {
			if (!_layerAlive(pairs[i].layer)) return false;
		}
		return true;
	}

	function _isDisposedError(e) {
		var msg = "";
		try { msg = (e && e.message) ? e.message : String(e); } catch (e2) { msg = ""; }
		return msg.indexOf("already disposed") >= 0 ||
		       msg.indexOf("isDisposed") >= 0;
	}

	function _isFiniteNum(v) {
		return (typeof v === "number" && isFinite(v));
	}

	function _safeDispose(t) {
		try {
			if (t && typeof t.dispose === "function" && !t.isDisposed) {
				t.dispose();
			}
		} catch (e) { /* ignore */ }
	}

	function _safeDisposeAll(arr) {
		if (!Array.isArray(arr)) return;
		for (var i = 0; i < arr.length; i++) _safeDispose(arr[i]);
	}

	function _isDisposedTensor(t) {
		try {
			if (!t) return true;
			if (t.isDisposed === true) return true;
			if (typeof t.dataSync !== "function") return true;
			return false;
		} catch (e) { return true; }
	}

	// ============================================================
	// THEME
	// ============================================================

	function _theme() {
		var dark = false;
		try { dark = !!global.is_dark_mode; } catch (e) { dark = false; }

		if (dark) {
			return {
				dark: true,
				paper:      "#0b0e1a",
				plotBg:     "#0b0e1a",
				sceneBg:    "rgba(13,17,32,0.92)",
				axisPane:   "rgba(24,30,52,0.35)",
				text:       "#dfe4f2",
				axisText:   "#7d88a8",
				grid:       "rgba(255,255,255,0.045)",
				zeroline:   "rgba(140,165,235,0.22)",
				boxColor:   "rgba(150,175,255,0.42)",
				cutColor:   "rgba(255,168,46,1)",
				cutGlow:    "rgba(255,150,20,0.20)",
				softCut:    "rgba(255,205,120,0.45)",
				softGlow:   "rgba(255,200,110,0.13)",
				panelBg:    "linear-gradient(140deg, rgba(26,30,50,0.95), rgba(16,19,34,0.96))",
				panelBorder:"rgba(140,160,230,0.26)",
				panelShadow:"0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
				btnBg:      "linear-gradient(135deg,#4a67b8,#6b7fd8)",
				btnText:    "#ffffff",
				infoText:   "#9aa4c0",
				gridColor:    "rgba(160,182,235,0.5)",
				gridGlow:     "rgba(120,150,225,0.10)",
				surfaceColor: "rgba(110,145,225,0.55)",
				textAccent:   "#e3e9fb",
				arrowColor:   "rgba(150,170,235,0.55)",
				legendBg:     "rgba(16,20,36,0.72)",
				legendBorder: "rgba(140,160,230,0.20)",
				markerEdge:   "rgba(10,13,24,0.85)"
			};
		}
		return {
			dark: false,
			paper:      "#ffffff",
			plotBg:     "#ffffff",
			sceneBg:    "rgba(248,250,255,0.94)",
			axisPane:   "rgba(232,238,251,0.45)",
			text:       "#1a1f30",
			axisText:   "#7b849f",
			grid:       "rgba(30,50,110,0.055)",
			zeroline:   "rgba(60,85,160,0.22)",
			boxColor:   "rgba(70,95,170,0.40)",
			cutColor:   "rgba(226,104,16,1)",
			cutGlow:    "rgba(230,120,30,0.18)",
			softCut:    "rgba(214,132,52,0.5)",
			softGlow:   "rgba(220,150,70,0.12)",
			panelBg:    "linear-gradient(140deg, rgba(253,254,255,0.98), rgba(233,238,250,0.98))",
			panelBorder:"rgba(60,80,140,0.2)",
			panelShadow:"0 8px 26px rgba(60,80,140,0.14), inset 0 1px 0 rgba(255,255,255,0.9)",
			btnBg:      "linear-gradient(135deg,#4a67b8,#5f7cc8)",
			btnText:    "#ffffff",
			infoText:   "#465072",
			gridColor:    "rgba(58,80,155,0.42)",
			gridGlow:     "rgba(90,120,200,0.09)",
			surfaceColor: "rgba(95,125,205,0.5)",
			textAccent:   "#1f2942",
			arrowColor:   "rgba(80,105,175,0.45)",
			legendBg:     "rgba(255,255,255,0.78)",
			legendBorder: "rgba(60,80,140,0.14)",
			markerEdge:   "rgba(255,255,255,0.9)"
		};
	}

	// ============================================================
	// FARBPALETTEN
	// ============================================================

	var CLASS_PALETTE = [
		"#159c72", "#e2661a", "#3b6fd4", "#c2299b", "#8a56d6",
		"#0f9dbd", "#d4b019", "#d43b3b", "#5aa832", "#7a4ec9",
		"#1f7a8c", "#bf5b04", "#2b5ea8", "#a01f7a", "#6a3fb0",
		"#0c7f96", "#a88a12", "#a82f2f", "#46862a", "#5f3ea4",
		"#2fa88a", "#ef8543", "#5e8ee0", "#d857b6"
	];

	function _classColor(idx) {
		if (!_isFiniteNum(idx) || idx < 0) return "#8a8a8a";
		return CLASS_PALETTE[idx % CLASS_PALETTE.length];
	}

	var VIRIDIS = [
		[0.267, 0.005, 0.329],
		[0.283, 0.141, 0.458],
		[0.254, 0.265, 0.530],
		[0.207, 0.372, 0.553],
		[0.164, 0.471, 0.558],
		[0.128, 0.567, 0.551],
		[0.135, 0.659, 0.518],
		[0.267, 0.749, 0.441],
		[0.478, 0.821, 0.318],
		[0.741, 0.873, 0.150],
		[0.993, 0.906, 0.144]
	];

	function _viridis(t) {
		if (!_isFiniteNum(t)) return "#808080";
		if (t < 0) t = 0;
		if (t > 1) t = 1;
		var scaled = t * (VIRIDIS.length - 1);
		var i = Math.floor(scaled);
		if (i >= VIRIDIS.length - 1) i = VIRIDIS.length - 2;
		var f = scaled - i;
		var a = VIRIDIS[i], b = VIRIDIS[i + 1];
		var r = Math.round((a[0] + (b[0] - a[0]) * f) * 255);
		var g = Math.round((a[1] + (b[1] - a[1]) * f) * 255);
		var bl = Math.round((a[2] + (b[2] - a[2]) * f) * 255);
		return "rgb(" + r + "," + g + "," + bl + ")";
	}

	// ============================================================
	// VERZERRUNGS-FARBSKALA (divergierend, perzeptuell balanciert)
	// ============================================================

	// Cool → Neutral → Warm, an CIELAB-Helligkeit angenähert
	var DIST_RAMP_LIGHT = [
		[0.00, [ 31,  66, 145]],
		[0.14, [ 44, 106, 190]],
		[0.29, [ 88, 156, 219]],
		[0.42, [139, 184, 222]],
		[0.50, [196, 205, 219]],
		[0.58, [228, 189, 162]],
		[0.71, [238, 158, 116]],
		[0.86, [217,  99,  63]],
		[1.00, [166,  36,  33]]
	];

	var DIST_RAMP_DARK = [
		[0.00, [ 46,  95, 196]],
		[0.14, [ 64, 130, 219]],
		[0.29, [102, 165, 232]],
		[0.42, [146, 186, 226]],
		[0.50, [116, 124, 148]],
		[0.58, [232, 174, 136]],
		[0.71, [242, 138,  88]],
		[0.86, [233,  92,  55]],
		[1.00, [200,  48,  40]]
	];

	function _rampLookup(ramp, t) {
		if (!_isFiniteNum(t)) t = 0.5;
		if (t < 0) t = 0;
		if (t > 1) t = 1;
		for (var i = 0; i + 1 < ramp.length; i++) {
			var a = ramp[i], b = ramp[i + 1];
			if (t >= a[0] && t <= b[0]) {
				var span = b[0] - a[0];
				var f = (span > 1e-9) ? (t - a[0]) / span : 0;
				// Smoothstep für weichere Übergänge
				f = f * f * (3 - 2 * f);
				return [
					Math.round(a[1][0] + (b[1][0] - a[1][0]) * f),
					Math.round(a[1][1] + (b[1][1] - a[1][1]) * f),
					Math.round(a[1][2] + (b[1][2] - a[1][2]) * f)
				];
			}
		}
		var last = ramp[ramp.length - 1][1];
		return [last[0], last[1], last[2]];
	}

	// Gamma: verstärkt kleine Verzerrungen, ohne Extreme zu sättigen
	function _distortionT(v, lo, hi) {
		if (!_isFiniteNum(v)) return 0.5;
		var t;
		if (v < 0) {
			var dn = (lo < 0) ? -lo : 1;
			t = 0.5 - 0.5 * Math.min(1, (-v) / dn);
		} else {
			var dp = (hi > 0) ? hi : 1;
			t = 0.5 + 0.5 * Math.min(1, v / dp);
		}
		if (!_isFiniteNum(t)) t = 0.5;
		// Kontrastkurve um 0.5 herum
		var d = (t - 0.5) * 2;
		var s = (d < 0 ? -1 : 1) * Math.pow(Math.abs(d), 0.78);
		return 0.5 + s * 0.5;
	}

	function _distortionColor(v, lo, hi, dark) {
		var ramp = dark ? DIST_RAMP_DARK : DIST_RAMP_LIGHT;
		var c = _rampLookup(ramp, _distortionT(v, lo, hi));
		return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
	}

	function _distortionColorA(v, lo, hi, dark, alpha) {
		var ramp = dark ? DIST_RAMP_DARK : DIST_RAMP_LIGHT;
		var c = _rampLookup(ramp, _distortionT(v, lo, hi));
		return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + alpha + ")";
	}

	function _distortionScale(dark) {
		var ramp = dark ? DIST_RAMP_DARK : DIST_RAMP_LIGHT;
		var out = [];
		for (var i = 0; i < ramp.length; i++) {
			var c = ramp[i][1];
			out.push([ramp[i][0], "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"]);
		}
		return out;
	}

	// ============================================================
	// FINGERPRINT / CHANGE DETECTION
	// ============================================================

	function _fnvFeed(h, s) {
		for (var i = 0; i < s.length; i++) {
			h ^= s.charCodeAt(i);
			h = Math.imul(h, 0x01000193) >>> 0;
		}
		return h >>> 0;
	}

	function _hashNumbers(arr, h, stride) {
		h = (h === undefined) ? 0x811c9dc5 : (h >>> 0);
		stride = stride || 1;
		if (!arr) return _fnvFeed(h, "~null~");
		for (var i = 0; i < arr.length; i += stride) {
			var v = arr[i];
			if (!_isFiniteNum(v)) { h = _fnvFeed(h, "~"); continue; }
			h = _fnvFeed(h, v.toFixed(6) + ";");
		}
		return h >>> 0;
	}

	function _currentDataRevision() {
		try {
			var r = global.cnn3d_data_revision;
			return _isFiniteNum(r) ? r : -1;
		} catch (e) { return -1; }
	}

	function _modelFingerprint(pairs) {
		var h = 0x811c9dc5;
		h = _fnvFeed(h, "pairs:" + (pairs ? pairs.length : 0) + ":");
		if (!pairs) return h >>> 0;

		for (var i = 0; i < pairs.length; i++) {
			var p = pairs[i];
			h = _fnvFeed(h, "p" + p.layerIdx + ":" + p.dimIn + ">" + p.dimOut +
			                 ":" + (p.activation || "-") + ":");
			var layer = p.layer;
			if (!layer) continue;
			try {
				var ws = layer.getWeights ? layer.getWeights() : null;
				if (!ws || !ws.length) { h = _fnvFeed(h, "nw:"); continue; }
				for (var w = 0; w < ws.length; w++) {
					if (_isDisposedTensor(ws[w])) { h = _fnvFeed(h, "disp:"); continue; }
					var d = ws[w].dataSync();
					var stride = d.length > 4000 ? Math.ceil(d.length / 4000) : 1;
					h = _hashNumbers(d, h, stride);
					h = _fnvFeed(h, "|" + d.length + ";");
				}
			} catch (e) { h = _fnvFeed(h, "werr:"); }
		}

		try {
			var all = _getVisibleLayers();
			var firstIdx = pairs[0].layerIdx;
			for (var a = 0; a < all.length && a < firstIdx; a++) {
				if (!_layerAlive(all[a])) continue;
				var ws2 = all[a].getWeights ? all[a].getWeights() : null;
				if (!ws2 || !ws2.length) continue;
				for (var w2 = 0; w2 < ws2.length; w2++) {
					if (_isDisposedTensor(ws2[w2])) continue;
					var d2 = ws2[w2].dataSync();
					var st2 = d2.length > 2000 ? Math.ceil(d2.length / 2000) : 1;
					h = _hashNumbers(d2, h, st2);
				}
			}
		} catch (e) { h = _fnvFeed(h, "preerr:"); }

		return h >>> 0;
	}

	function _viewHash() {
		var c = _state.config;
		var parts = [
			"dark=" + (_theme().dark ? 1 : 0),
			"mp=" + c.maxPoints, "ps=" + c.pointSize, "po=" + c.pointOpacity,
			"rc=" + (c.showReluCuts ? 1 : 0), "rl=" + c.reluCutLimit,
			"bb=" + (c.showBoundingBox ? 1 : 0), "sf=" + (c.showSoftFolds ? 1 : 0),
			"bp=" + c.boxPadding, "ml=" + c.maxLayersShown,
			"sh=" + c.subplotHeight, "is=" + (c.includeInputSpace ? 1 : 0),
			"sg=" + (c.showGrid ? 1 : 0), "gr=" + c.gridResolution,
			"ge=" + c.gridExtend, "glw=" + c.gridLineWidth,
			"go=" + c.gridOpacity, "cbc=" + (c.colorByCurvature ? 1 : 0),
			"sgs=" + (c.showGridSurface ? 1 : 0), "gso=" + c.gridSurfaceOpacity,
			"sdp=" + (c.showDataPoints ? 1 : 0), "pl=" + (c.pairedLayout ? 1 : 0)
		];
		return _fnvFeed(0x811c9dc5, parts.join(";"));
	}


	// ============================================================
	// LAYER-CHAIN / PAARE
	// ============================================================

	function _getVisibleLayers() {
		if (!_hasModel()) return [];
		try {
			var ls = global.model.layers;
			if (Array.isArray(ls) && ls.length) return ls;
		} catch (e) { /* fall through */ }
		try {
			var all = global.model._allLayers;
			if (Array.isArray(all) && all.length) {
				return all.filter(function (l) {
					var cn = "";
					try { cn = l.getClassName ? l.getClassName() : ""; } catch (e2) { cn = ""; }
					if (cn === "InputLayer") return false;
					var n = l.name || "";
					if (n.indexOf("skip_proj_") >= 0) return false;
					if (n.indexOf("skip_add_") >= 0) return false;
					if (n.indexOf("skip_scale_") >= 0) return false;
					return true;
				});
			}
		} catch (e) { /* fall through */ }
		return [];
	}

	function _activationNameOfLayer(layer) {
		if (!layer) return null;
		try {
			var cfg = layer.getConfig ? layer.getConfig() : null;
			if (cfg && cfg.activation) {
				if (typeof cfg.activation === "string") {
					return cfg.activation.toLowerCase();
				}
				if (cfg.activation && cfg.activation.className) {
					return String(cfg.activation.className).toLowerCase();
				}
			}
		} catch (e) { /* fall through */ }
		try {
			var cn = layer.getClassName ? layer.getClassName().toLowerCase() : "";
			if (cn === "relu" || cn === "leakyrelu" || cn === "elu" ||
			    cn === "thresholdedrelu" || cn === "softmax") {
				return cn;
			}
		} catch (e) { /* fall through */ }
		return null;
	}

	function _featureDim(shape) {
		if (!Array.isArray(shape) || shape.length < 2) return null;
		var prod = 1;
		for (var i = 1; i < shape.length; i++) {
			var v = shape[i];
			if (v === null || v === undefined) return null;
			if (!_isFiniteNum(v) || v <= 0) return null;
			prod *= v;
		}
		if (!_isFiniteNum(prod) || prod <= 0) return null;
		return prod;
	}

	function _layerOutputShape(layer) {
		try {
			var s = layer.outputShape;
			if (Array.isArray(s) && s.length && Array.isArray(s[0])) return null;
			return s || null;
		} catch (e) { return null; }
	}

	function _layerInputShape(layer) {
		try {
			var s = layer.inputShape;
			if (Array.isArray(s) && s.length && Array.isArray(s[0])) return null;
			return s || null;
		} catch (e) { return null; }
	}

	function _buildChain() {
		var layers = _getVisibleLayers();
		if (!layers.length) return { pairs: [], reason: "no_layers" };

		var cfg = _state.config;
		var spaces = [];

		var inShape = null;
		try {
			if (global.model.inputs && global.model.inputs.length) {
				inShape = global.model.inputs[0].shape;
			}
		} catch (e) { inShape = null; }
		if (!inShape) inShape = _layerInputShape(layers[0]);

		spaces.push({
			isInput:    true,
			layerIdx:   -1,
			layer:      null,
			dim:        _featureDim(inShape),
			shape:      inShape,
			name:       _tr("origami_input_space", "Input"),
			className:  "Input",
			activation: null
		});

		for (var i = 0; i < layers.length; i++) {
			var layer = layers[i];
			if (!layer || !_layerAlive(layer)) continue;
			var outShape = _layerOutputShape(layer);
			var cls = "";
			try { cls = layer.getClassName ? layer.getClassName() : ""; }
			catch (e) { cls = ""; }

			spaces.push({
				isInput:     false,
				layerIdx:    i,
				layer:       layer,
				dim:         _featureDim(outShape),
				shape:       outShape,
				name:        (layer.name || (cls + "_" + i)),
				className:   cls,
				activation:  _activationNameOfLayer(layer)
			});
		}

		var pairs = [];
		for (var s = 0; s + 1 < spaces.length; s++) {
			var a = spaces[s], b = spaces[s + 1];
			var dA = a.dim, dB = b.dim;
			if (dA === null || dB === null) continue;
			if (dA < 1 || dA > 3) continue;
			if (dB < 1 || dB > 3) continue;
			if (!b.layer) continue;

			pairs.push({
				inNode:     a,
				outNode:    b,
				layer:      b.layer,
				layerIdx:   b.layerIdx,
				dimIn:      dA,
				dimOut:     dB,
				activation: b.activation,
				className:  b.className,
				name:       b.name
			});

			if (pairs.length >= cfg.maxLayersShown) break;
		}

		if (!pairs.length) {
			var anyLow = false;
			for (var q = 0; q < spaces.length; q++) {
				if (spaces[q].dim !== null && spaces[q].dim >= 1 && spaces[q].dim <= 3) {
					anyLow = true; break;
				}
			}
			return {
				pairs:  [],
				reason: anyLow ? "no_adjacent_low_dim" : "no_low_dim_layers"
			};
		}

		return { pairs: pairs, reason: null };
	}

	function _chainSignature(pairs) {
		if (!pairs || !pairs.length) return "empty";
		var parts = [];
		for (var i = 0; i < pairs.length; i++) {
			var p = pairs[i];
			parts.push(p.layerIdx + ":" + p.dimIn + ">" + p.dimOut +
			           ":" + (p.className || "-"));
		}
		return parts.join("|");
	}

	// ============================================================
	// DATEN + LABELS HOLEN
	// ============================================================

	function _xyGlobal() {
		try {
			var g = global.xy_data_global;
			if (!g || typeof g !== "object") return null;
			if (!g.x || !g.y) return null;
			if (_isDisposedTensor(g.x)) return null;
			return g;
		} catch (e) { return null; }
	}

	function _isClassificationNow() {
		try {
			if (typeof global.is_classification === "boolean") {
				return global.is_classification;
			}
		} catch (e) { /* fall through */ }
		try {
			var g = _xyGlobal();
			if (g && g.y && !_isDisposedTensor(g.y)) {
				if (g.y.shape && g.y.shape.length === 2 && g.y.shape[1] > 1) return true;
			}
		} catch (e) { /* ignore */ }
		return false;
	}

	function _getLabelsArray() {
		try {
			var l = global.labels;
			if (Array.isArray(l) && l.length) return l;
		} catch (e) { /* ignore */ }
		return null;
	}

	function _prepareData() {
		var g = _xyGlobal();
		if (!g) {
			_log("keine xy_data_global vorhanden");
			return false;
		}

		var maxPoints = _state.config.maxPoints;
		if (!_isFiniteNum(maxPoints) || maxPoints < 8) maxPoints = 500;

		var xT = g.x;
		if (_isDisposedTensor(xT)) {
			_warn("xy_data_global.x ist disposed");
			return false;
		}

		var total = 0;
		try { total = (xT.shape && xT.shape[0]) ? xT.shape[0] : 0; }
		catch (e) { total = 0; }

		if (!_isFiniteNum(total) || total < 1) {
			_log("xy_data_global.x hat 0 Samples");
			return false;
		}

		var xHash = null;
		try {
			xHash = (xT.id !== undefined ? "id" + xT.id : "noid") +
			        ":" + (xT.shape ? xT.shape.join("x") : "?") +
			        ":" + total + ":" + maxPoints;
		} catch (e) { xHash = null; }

		if (xHash && xHash === _state.cachedXHash &&
		    _state.cachedX && !_isDisposedTensor(_state.cachedX)) {
			return true;
		}

		var stride = (total > maxPoints) ? Math.ceil(total / maxPoints) : 1;
		var idxs = [];
		for (var i = 0; i < total; i += stride) {
			idxs.push(i);
			if (idxs.length >= maxPoints) break;
		}
		if (!idxs.length) {
			_warn("Subsampling ergab 0 Indizes");
			return false;
		}

		var newX = null;
		try {
			newX = global.tf.tidy(function () {
				var idxT = global.tf.tensor1d(idxs, "int32");
				var g2 = global.tf.gather(xT, idxT);
				return global.tf.keep(g2);
			});
		} catch (e) {
			_error("Konnte X nicht subsamplen: " + e);
			newX = null;
		}

		if (!newX || _isDisposedTensor(newX)) {
			_safeDispose(newX);
			return false;
		}

		var classIdx     = null;
		var classNames   = null;
		var colors       = null;
		var isRegression = false;

		var isCls = _isClassificationNow();
		var labelsArr = _getLabelsArray();

		try {
			var yT = g.y;
			if (yT && !_isDisposedTensor(yT)) {
				var yShape = yT.shape || [];
				var yArr = null;

				if (yShape.length === 2 && yShape[1] > 1) {
					yArr = global.tf.tidy(function () {
						var idxT = global.tf.tensor1d(idxs, "int32");
						var sub  = global.tf.gather(yT, idxT);
						var am   = global.tf.argMax(sub, 1);
						return Array.from(am.dataSync());
					});
					classIdx = yArr;
				} else if (yShape.length === 2 && yShape[1] === 1) {
					yArr = global.tf.tidy(function () {
						var idxT = global.tf.tensor1d(idxs, "int32");
						var sub  = global.tf.gather(yT, idxT);
						return Array.from(sub.reshape([-1]).dataSync());
					});
					if (isCls) {
						classIdx = yArr.map(function (v) { return Math.round(v); });
					} else {
						isRegression = true;
						classIdx = yArr;
					}
				} else if (yShape.length === 1) {
					yArr = global.tf.tidy(function () {
						var idxT = global.tf.tensor1d(idxs, "int32");
						var sub  = global.tf.gather(yT, idxT);
						return Array.from(sub.dataSync());
					});
					if (isCls) {
						classIdx = yArr.map(function (v) { return Math.round(v); });
					} else {
						isRegression = true;
						classIdx = yArr;
					}
				} else {
					_log("y-Shape nicht interpretierbar: " + JSON.stringify(yShape));
				}
			}
		} catch (e) {
			_warn("Konnte Klassen aus y nicht ableiten: " + e);
			classIdx = null;
		}

		if (classIdx && classIdx.length === idxs.length) {
			if (isRegression) {
				var mn = Infinity, mx = -Infinity;
				for (var r = 0; r < classIdx.length; r++) {
					var v = classIdx[r];
					if (!_isFiniteNum(v)) continue;
					if (v < mn) mn = v;
					if (v > mx) mx = v;
				}
				if (!_isFiniteNum(mn) || !_isFiniteNum(mx) || mx === mn) { mn = 0; mx = 1; }
				colors = classIdx.map(function (v) {
					if (!_isFiniteNum(v)) return "#808080";
					return _viridis((v - mn) / (mx - mn));
				});
				classNames = null;
			} else {
				var maxC = 0;
				for (var c = 0; c < classIdx.length; c++) {
					if (_isFiniteNum(classIdx[c]) && classIdx[c] > maxC) maxC = classIdx[c];
				}
				classNames = [];
				for (var ci = 0; ci <= maxC; ci++) {
					if (labelsArr && labelsArr[ci] != null) {
						classNames.push(String(labelsArr[ci]));
					} else {
						classNames.push(_tr("origami_class", "Klasse") + " " + ci);
					}
				}
				colors = classIdx.map(function (ci2) { return _classColor(ci2); });
			}
		} else {
			colors = new Array(idxs.length);
			for (var k = 0; k < idxs.length; k++) colors[k] = "#159c72";
			classIdx = null;
			classNames = null;
		}

		_safeDispose(_state.cachedX);
		_state.cachedX            = newX;
		_state.cachedColors       = colors;
		_state.cachedClassIdx     = classIdx;
		_state.cachedClassNames   = classNames;
		_state.cachedIsRegression = isRegression;
		_state.cachedSampleCount  = idxs.length;
		_state.cachedXHash        = xHash;

		_log("Daten vorbereitet: " + idxs.length + " von " + total + " Punkten, " +
		     (classNames ? classNames.length + " Klassen" :
		      (isRegression ? "Regression" : "keine Klassen")));

		return true;
	}

	// ============================================================
	// TENSOR-HELPER
	// ============================================================

	function _flattenTensorTo2D(t) {
		if (!t || !t.shape) return t;
		if (t.shape.length > 2) {
			var dimProd = 1;
			for (var d = 1; d < t.shape.length; d++) dimProd *= t.shape[d];
			return t.reshape([t.shape[0], dimProd]);
		}
		if (t.shape.length === 1) {
			return t.reshape([t.shape[0], 1]);
		}
		return t;
	}

	function _captureLayerOutput(t, dim) {
		try {
			return global.tf.tidy(function () {
				var flat2d = _flattenTensorTo2D(t);
				return _unpack({
					data: flat2d.dataSync(),
					dim:  flat2d.shape[1],
					n:    flat2d.shape[0]
				}, dim);
			});
		} catch (e) {
			return null;
		}
	}

	function _readSingleInput(dim) {
		try {
			return global.tf.tidy(function () {
				var t = _state.cachedX;
				var flat2d = t;
				if (t.shape.length > 2) {
					var dimProd = 1;
					for (var d = 1; d < t.shape.length; d++) dimProd *= t.shape[d];
					flat2d = t.reshape([t.shape[0], dimProd]);
				} else if (t.shape.length === 1) {
					flat2d = t.reshape([t.shape[0], 1]);
				}
				return _unpack({
					data: flat2d.dataSync(),
					dim:  flat2d.shape[1],
					n:    flat2d.shape[0]
				}, dim);
			});
		} catch (e) {
			_warn("Konnte Input-Raum nicht lesen: " + e);
			return null;
		}
	}

	function _unpack(res, expectedDim) {
		if (!res || !res.data) return null;
		var n = res.n, d = res.dim;
		if (!_isFiniteNum(n) || n < 1) return null;
		if (!_isFiniteNum(d) || d < 1) return null;

		var useDim = Math.min(d, 3);
		if (_isFiniteNum(expectedDim) && expectedDim >= 1 && expectedDim <= 3) {
			useDim = Math.min(useDim, expectedDim);
		}

		var xs = new Float64Array(n);
		var ys = (useDim >= 2) ? new Float64Array(n) : null;
		var zs = (useDim >= 3) ? new Float64Array(n) : null;

		var bad = 0;
		for (var i = 0; i < n; i++) {
			var base = i * d;
			var vx = res.data[base];
			xs[i] = _isFiniteNum(vx) ? vx : 0;
			if (!_isFiniteNum(vx)) bad++;
			if (ys) {
				var vy = res.data[base + 1];
				ys[i] = _isFiniteNum(vy) ? vy : 0;
			}
			if (zs) {
				var vz = res.data[base + 2];
				zs[i] = _isFiniteNum(vz) ? vz : 0;
			}
		}

		if (bad > 0) {
			_warn("Aktivierungen enthielten " + bad + " nicht-finite Werte (auf 0 gesetzt)");
		}

		return { xs: xs, ys: ys, zs: zs, dim: useDim, n: n };
	}


	// ============================================================
	// GITTER-GENERIERUNG
	// ============================================================

	function _makeGrid(bounds, dim) {
		if (!bounds) return null;
		if (!_isFiniteNum(dim) || dim < 1 || dim > 3) return null;

		var res = _state.config.gridResolution;
		if (!_isFiniteNum(res) || res < 3) res = 9;
		if (res > 31) res = 31;
		if (dim === 3 && res > 11) res = 11;

		var ext = _state.config.gridExtend;
		if (!_isFiniteNum(ext) || ext < 1) ext = 1.0;

		function axis(b) {
			var mid = (b.lo + b.hi) / 2;
			var half = (b.hi - b.lo) / 2 * ext;
			if (!_isFiniteNum(half) || half <= 0) half = 0.5;
			var arr = new Float64Array(res);
			for (var i = 0; i < res; i++) {
				arr[i] = mid - half + (2 * half) * (i / (res - 1));
			}
			return arr;
		}

		var ax = axis(bounds.x);
		var ay = (dim >= 2) ? axis(bounds.y) : null;
		var az = (dim >= 3) ? axis(bounds.z) : null;

		var n, coords, lines = [], quads = [];

		if (dim === 1) {
			n = res;
			coords = new Float64Array(n);
			for (var i1 = 0; i1 < res; i1++) coords[i1] = ax[i1];
			var chain1 = [];
			for (var c1 = 0; c1 < res; c1++) chain1.push(c1);
			lines.push(chain1);
		} else if (dim === 2) {
			n = res * res;
			coords = new Float64Array(n * 2);
			for (var iy = 0; iy < res; iy++) {
				for (var ix = 0; ix < res; ix++) {
					var k2 = iy * res + ix;
					coords[k2 * 2]     = ax[ix];
					coords[k2 * 2 + 1] = ay[iy];
				}
			}
			for (var ry = 0; ry < res; ry++) {
				var row = [];
				for (var rx = 0; rx < res; rx++) row.push(ry * res + rx);
				lines.push(row);
			}
			for (var cx = 0; cx < res; cx++) {
				var col = [];
				for (var cy = 0; cy < res; cy++) col.push(cy * res + cx);
				lines.push(col);
			}
			for (var qy = 0; qy + 1 < res; qy++) {
				for (var qx = 0; qx + 1 < res; qx++) {
					var a2 = qy * res + qx;
					var b2 = qy * res + qx + 1;
					var c2 = (qy + 1) * res + qx + 1;
					var d2 = (qy + 1) * res + qx;
					quads.push([a2, b2, c2, d2]);
				}
			}
		} else {
			n = res * res * res;
			coords = new Float64Array(n * 3);
			for (var jz = 0; jz < res; jz++) {
				for (var jy = 0; jy < res; jy++) {
					for (var jx = 0; jx < res; jx++) {
						var k3 = (jz * res + jy) * res + jx;
						coords[k3 * 3]     = ax[jx];
						coords[k3 * 3 + 1] = ay[jy];
						coords[k3 * 3 + 2] = az[jz];
					}
				}
			}
			function idx3(x, y, z) { return (z * res + y) * res + x; }
			for (var sz = 0; sz < res; sz++) {
				for (var sy = 0; sy < res; sy++) {
					if (!(sy === 0 || sy === res - 1 || sz === 0 || sz === res - 1)) continue;
					var lx = [];
					for (var sx = 0; sx < res; sx++) lx.push(idx3(sx, sy, sz));
					lines.push(lx);
				}
			}
			for (var tz = 0; tz < res; tz++) {
				for (var tx = 0; tx < res; tx++) {
					if (!(tx === 0 || tx === res - 1 || tz === 0 || tz === res - 1)) continue;
					var ly = [];
					for (var ty = 0; ty < res; ty++) ly.push(idx3(tx, ty, tz));
					lines.push(ly);
				}
			}
			for (var uy = 0; uy < res; uy++) {
				for (var ux = 0; ux < res; ux++) {
					if (!(ux === 0 || ux === res - 1 || uy === 0 || uy === res - 1)) continue;
					var lz = [];
					for (var uz = 0; uz < res; uz++) lz.push(idx3(ux, uy, uz));
					lines.push(lz);
				}
			}
		}

		return {
			coords: coords, n: n, dim: dim, res: res,
			topo: dim,
			lines: lines, quads: quads, bounds: bounds
		};
	}

	function _pushGridThroughLayer(grid, layer, outDim) {
		if (!grid || !layer) return null;
		if (!_layerAlive(layer)) return null;
		if (!_hasTF()) return null;

		try {
			var cls = "";
			try { cls = layer.getClassName ? layer.getClassName() : ""; }
			catch (e) { cls = ""; }

			if (String(cls).toLowerCase() !== "dense") {
				_log("Gitter: nur Dense-Layer unterstützt (" + cls + ")");
				return null;
			}

			var ws = null;
			try { ws = layer.getWeights ? layer.getWeights() : null; }
			catch (e) { ws = null; }
			if (!ws || !ws.length) return null;
			if (_isDisposedTensor(ws[0])) return null;

			var kernel = ws[0].dataSync();
			var bias = (ws.length > 1 && !_isDisposedTensor(ws[1]))
				? ws[1].dataSync() : null;
			var kShape = ws[0].shape;
			if (!Array.isArray(kShape) || kShape.length !== 2) return null;
			var inDim = kShape[0];
			var units = kShape[1];
			if (inDim !== grid.dim) return null;

			var act = _activationNameOfLayer(layer);
			var n = grid.n;
			var outData = new Float64Array(n * units);

			for (var i = 0; i < n; i++) {
				var rowBase = i * grid.dim;
				for (var u = 0; u < units; u++) {
					var sum = 0;
					for (var d = 0; d < inDim; d++) {
						sum += grid.coords[rowBase + d] * kernel[d * units + u];
					}
					if (bias) sum += bias[u];

					if (act === "relu" || act === "relu6") {
						sum = Math.max(0, sum);
						if (act === "relu6") sum = Math.min(6, sum);
					} else if (act === "leakyrelu") {
						if (sum < 0) sum *= 0.3;
					} else if (act === "elu") {
						if (sum < 0) sum = Math.exp(sum) - 1;
					} else if (act === "selu") {
						sum = (sum > 0) ? 1.0507 * sum : 1.0507 * (Math.exp(sum) - 1);
					} else if (act === "sigmoid" || act === "hardsigmoid") {
						sum = 1 / (1 + Math.exp(-sum));
					} else if (act === "tanh") {
						sum = Math.tanh(sum);
					} else if (act === "softplus") {
						sum = Math.log(1 + Math.exp(Math.max(sum, -100)));
					} else if (act === "softsign") {
						sum = sum / (1 + Math.abs(sum));
					}

					outData[i * units + u] = _isFiniteNum(sum) ? sum : 0;
				}
			}

			return _unpack({
				data: outData,
				dim:  units,
				n:    n
			}, outDim);
		} catch (e) {
			if (_isDisposedError(e)) {
				_log("Gitter-Forward: Layer disposed, übersprungen");
			} else {
				_log("Gitter-Forward: " + e);
			}
			return null;
		}
	}

	function _gridDistortion(grid, actIn, actOut) {
		if (!grid || !actIn || !actOut) return null;
		var n = grid.n;
		if (actIn.n !== n || actOut.n !== n) return null;

		// Topologie-Dimension für die Kanten-Traversal: ein 2D-Blatt
		// im 3D-Raum hat 2D-Gitterkanten, keine Kubus-Kanten.
		var res = grid.res;
		var dim = (typeof grid.topo === "number" && _isFiniteNum(grid.topo))
			? grid.topo : grid.dim;
		var dist = new Float64Array(n);
		var cnt  = new Float64Array(n);

		function pIn(i, comp) {
			if (comp === 0) return actIn.xs[i];
			if (comp === 1) return actIn.ys ? actIn.ys[i] : 0;
			return actIn.zs ? actIn.zs[i] : 0;
		}
		function pOut(i, comp) {
			if (comp === 0) return actOut.xs[i];
			if (comp === 1) return actOut.ys ? actOut.ys[i] : 0;
			return actOut.zs ? actOut.zs[i] : 0;
		}

		function edge(i, j) {
			var di = 0, dj = 0;
			for (var c = 0; c < 3; c++) {
				var a = pIn(i, c) - pIn(j, c);
				di += a * a;
				var b = pOut(i, c) - pOut(j, c);
				dj += b * b;
			}
			di = Math.sqrt(di); dj = Math.sqrt(dj);
			if (!(di > 1e-12)) return;
			var ratio = dj / di;
			if (!_isFiniteNum(ratio)) return;
			var lg = Math.log(Math.max(ratio, 1e-6)) / Math.LN2;
			dist[i] += lg; cnt[i] += 1;
			dist[j] += lg; cnt[j] += 1;
		}

		if (dim === 1) {
			for (var i1 = 0; i1 + 1 < res; i1++) edge(i1, i1 + 1);
		} else if (dim === 2) {
			for (var y2 = 0; y2 < res; y2++) {
				for (var x2 = 0; x2 < res; x2++) {
					var k2 = y2 * res + x2;
					if (x2 + 1 < res) edge(k2, k2 + 1);
					if (y2 + 1 < res) edge(k2, k2 + res);
				}
			}
		} else {
			var rr = res * res;
			for (var z3 = 0; z3 < res; z3++) {
				for (var y3 = 0; y3 < res; y3++) {
					for (var x3 = 0; x3 < res; x3++) {
						var k3 = (z3 * res + y3) * res + x3;
						if (x3 + 1 < res) edge(k3, k3 + 1);
						if (y3 + 1 < res) edge(k3, k3 + res);
						if (z3 + 1 < res) edge(k3, k3 + rr);
					}
				}
			}
		}

		var out = new Float64Array(n);
		for (var i = 0; i < n; i++) {
			out[i] = (cnt[i] > 0) ? (dist[i] / cnt[i]) : 0;
			if (!_isFiniteNum(out[i])) out[i] = 0;
		}

		var sorted = Array.prototype.slice.call(out);
		sorted.sort(function (a, b) { return a - b; });
		var loP = sorted[Math.floor(sorted.length * 0.03)];
		var hiP = sorted[Math.floor(sorted.length * 0.97)];
		if (!_isFiniteNum(loP)) loP = 0;
		if (!_isFiniteNum(hiP)) hiP = 0;
		if (hiP - loP < 1e-6) { loP -= 0.5; hiP += 0.5; }

		return { values: out, lo: loP, hi: hiP };
	}

	function _gridAsAct(grid) {
		if (!grid) return null;
		var n = grid.n, d = grid.dim;
		var xs = new Float64Array(n);
		var ys = (d >= 2) ? new Float64Array(n) : null;
		var zs = (d >= 3) ? new Float64Array(n) : null;

		for (var i = 0; i < n; i++) {
			xs[i] = grid.coords[i * d];
			if (ys) ys[i] = grid.coords[i * d + 1];
			if (zs) zs[i] = grid.coords[i * d + 2];
		}

		return { xs: xs, ys: ys, zs: zs, dim: d, n: n };
	}

	function _mergeBounds(a, b) {
		if (!a) return b;
		if (!b) return a;
		function m(p, q) {
			return { lo: Math.min(p.lo, q.lo), hi: Math.max(p.hi, q.hi) };
		}
		return {
			x: m(a.x, b.x),
			y: m(a.y, b.y),
			z: m(a.z, b.z),
			dim: Math.max(a.dim || 0, b.dim || 0)
		};
	}

	// ============================================================
	// AKTIVIERUNGEN PRO PAAR
	// ============================================================

	function _spaceKey(node) {
		return node.isInput ? "input" : ("L" + node.layerIdx);
	}

	function _computePairs(pairs) {
		if (!pairs || !pairs.length) return null;
		if (!_state.cachedX || _isDisposedTensor(_state.cachedX)) return null;
		if (!_hasTF() || !_hasModel()) return null;
		if (!_chainAlive(pairs)) return null;

		var spaceActs = _collectSpaceActivations(pairs);
		if (!spaceActs) return null;

		var results = [];
		var prevGridOut = null;

		for (var i = 0; i < pairs.length; i++) {
			var p = pairs[i];
			var actIn  = spaceActs[_spaceKey(p.inNode)];
			var actOut = spaceActs[_spaceKey(p.outNode)];

			if (!actIn || !actOut) {
				_log("Paar " + i + ": Aktivierungen fehlen, übersprungen");
				results.push(null);
				prevGridOut = null;
				continue;
			}

			var bIn  = _computeBounds(actIn);
			var bOut = _computeBounds(actOut);

			var grid = null, gridIn = null, gridOut = null, dist = null;

			if (_state.config.showGrid) {
				if (prevGridOut && prevGridOut.dim === p.dimIn) {
					// Gitter aus dem vorherigen Layer übernehmen (Topologie bleibt)
					grid = {
						coords: prevGridOut.coords,
						n: prevGridOut.n,
						dim: prevGridOut.dim,
						res: prevGridOut.res,
						topo: (typeof prevGridOut.topo === "number")
							? prevGridOut.topo : prevGridOut.dim,
						lines: prevGridOut.lines,
						quads: prevGridOut.quads || [],
						bounds: bIn
					};
					gridIn = prevGridOut;
					// Guardrail: Bounds müssen das Gitter umfassen
					var gInB = _computeBounds(gridIn);
					if (gInB) bIn = _mergeBounds(bIn, gInB);
				} else if (bIn) {
					// Erstes Paar: Gitter aus den Input-Bounds bauen
					grid = _makeGrid(bIn, p.dimIn);
					if (grid) {
						gridIn = _gridAsAct(grid);
						// Guardrail: Bounds müssen das Gitter umfassen
						var gInB0 = _computeBounds(gridIn);
						if (gInB0) bIn = _mergeBounds(bIn, gInB0);
					}
				}

				if (grid && gridIn) {
					gridOut = _pushGridThroughLayer(grid, p.layer, p.dimOut);
					if (gridOut) {
						dist = _gridDistortion(grid, gridIn, gridOut);
						bOut = _mergeBounds(bOut, _computeBounds(gridOut));
						// Topologie für das nächste Paar vorbereiten
						if (gridOut) {
							var outCoords = new Float64Array(gridOut.n * gridOut.dim);
							for (var q = 0; q < gridOut.n; q++) {
								outCoords[q * gridOut.dim] = gridOut.xs[q];
								if (gridOut.dim >= 2 && gridOut.ys)
									outCoords[q * gridOut.dim + 1] = gridOut.ys[q];
								if (gridOut.dim >= 3 && gridOut.zs)
									outCoords[q * gridOut.dim + 2] = gridOut.zs[q];
							}
							var outQuads = [];
							if (grid.quads) {
								outQuads = grid.quads;
							}
							prevGridOut = {
								coords: outCoords,
								n: gridOut.n,
								dim: gridOut.dim,
								res: grid.res,
								topo: (typeof grid.topo === "number")
									? grid.topo : grid.dim,
								lines: grid.lines,
								quads: outQuads,
								xs: gridOut.xs,
								ys: gridOut.ys,
								zs: gridOut.zs
							};
						}
					} else {
						prevGridOut = null;
						grid = null;
						gridIn = null;
					}
				} else {
					prevGridOut = null;
				}
			}

			results.push({
				pair:       p,
				actIn:      actIn,
				actOut:     actOut,
				boundsIn:   bIn,
				boundsOut:  bOut,
				grid:       grid,
				gridIn:     gridIn,
				gridOut:    gridOut,
				distortion: dist
			});
		}

		var any = false;
		for (var r = 0; r < results.length; r++) if (results[r]) { any = true; break; }
		return any ? results : null;
	}

	function _predictSubModel(symOut) {
		var subModel = null;
		try {
			subModel = global.tf.model({
				inputs:  global.model.inputs,
				outputs: symOut
			});
		} catch (e) {
			_log("tf.model() für Paare fehlgeschlagen: " + e);
			return null;
		}
		if (!subModel) return null;

		try {
			return global.tf.tidy(function () {
				var preds = subModel.predict(_state.cachedX, { batchSize: 512 });
				if (!Array.isArray(preds)) preds = [preds];
				var arr = [];
				for (var p = 0; p < preds.length; p++) {
					var f = _flattenTensorTo2D(preds[p]);
					arr.push({
						data: f.dataSync(),
						dim:  f.shape[1],
						n:    f.shape[0]
					});
				}
				return arr;
			});
		} catch (e) {
			if (_isDisposedError(e)) {
				_log("Paar-Sub-Model: disposed, Fallback");
			} else {
				_warn("Paar-Sub-Model predict fehlgeschlagen: " + e);
			}
			return null;
		}
	}

	function _collectSpaceActivations(pairs) {
		var needInput = false;
		var layerNodes = {};

		for (var i = 0; i < pairs.length; i++) {
			var a = pairs[i].inNode, b = pairs[i].outNode;
			if (a.isInput) needInput = true; else layerNodes[_spaceKey(a)] = a;
			if (b.isInput) needInput = true; else layerNodes[_spaceKey(b)] = b;
		}

		var out = {};
		if (needInput) {
			var inAct = _readSingleInput(pairs[0].inNode.dim);
			if (!inAct) return null;
			out["input"] = inAct;
		}

		var keys = Object.keys(layerNodes);
		if (!keys.length) return out;

		var symOut = [], order = [];
		var ok = true;
		for (var k = 0; k < keys.length; k++) {
			var node = layerNodes[keys[k]];
			if (!_layerAlive(node.layer)) { ok = false; break; }
			var o = null;
			try { o = node.layer.output; } catch (e) { o = null; }
			if (!o || Array.isArray(o)) { ok = false; break; }
			symOut.push(o);
			order.push(keys[k]);
		}

		if (ok && symOut.length) {
			var res = _predictSubModel(symOut);
			if (res && res.length === order.length) {
				for (var q = 0; q < order.length; q++) {
					out[order[q]] = _unpack(res[q], layerNodes[order[q]].dim);
				}
				return out;
			}
		}

		_log("Paare: Fallback auf schrittweisen Forward-Pass");
		return _collectSpaceActivationsStepwise(pairs, layerNodes, out);
	}

	function _collectSpaceActivationsStepwise(pairs, layerNodes, out) {
		var layers = _getVisibleLayers();
		if (!layers.length) return null;

		var byIdx = {};
		var keys = Object.keys(layerNodes);
		for (var k = 0; k < keys.length; k++) {
			byIdx[layerNodes[keys[k]].layerIdx] = keys[k];
		}

		var cur = null;
		try {
			cur = global.tf.keep(global.tf.clone(_state.cachedX));
		} catch (e) {
			_error("Konnte X nicht klonen: " + e);
			return null;
		}

		for (var li = 0; li < layers.length; li++) {
			if (!_layerAlive(layers[li])) {
				_log("Layer " + li + " disposed, Forward-Pass abgebrochen");
				break;
			}
			var nxt = null;
			try {
				nxt = global.tf.tidy(function () {
					var r = layers[li].apply(cur);
					if (Array.isArray(r)) r = r[0];
					return global.tf.keep(r);
				});
			} catch (e) {
				if (_isDisposedError(e)) {
					_log("Layer " + li + " apply(): disposed");
				} else {
					_warn("Layer " + li + " apply() fehlgeschlagen: " + e);
				}
				nxt = null;
			}

			_safeDispose(cur);
			cur = nxt;
			if (!cur || _isDisposedTensor(cur)) break;

			if (byIdx[li] !== undefined) {
				var key = byIdx[li];
				out[key] = _captureLayerOutput(cur, layerNodes[key].dim);
			}
		}

		_safeDispose(cur);

		var any = Object.keys(out).length > 0;
		return any ? out : null;
	}


	// ============================================================
	// BOUNDING BOX
	// ============================================================

	function _computeBounds(act) {
		if (!act || !act.n) return null;

		function mm(arr) {
			if (!arr) return { lo: -1, hi: 1 };
			var lo = Infinity, hi = -Infinity;
			for (var i = 0; i < arr.length; i++) {
				var v = arr[i];
				if (!_isFiniteNum(v)) continue;
				if (v < lo) lo = v;
				if (v > hi) hi = v;
			}
			if (!_isFiniteNum(lo) || !_isFiniteNum(hi)) return { lo: -1, hi: 1 };
			if (hi - lo < 1e-9) { lo -= 0.5; hi += 0.5; }
			return { lo: lo, hi: hi };
		}

		var bx = mm(act.xs);
		var by = act.ys ? mm(act.ys) : { lo: -0.5, hi: 0.5 };
		var bz = act.zs ? mm(act.zs) : { lo: -0.5, hi: 0.5 };

		var pad = _state.config.boxPadding;
		if (!_isFiniteNum(pad) || pad < 0) pad = 0.1;

		function expand(b) {
			var span = b.hi - b.lo;
			var d = span * pad;
			if (!_isFiniteNum(d) || d <= 0) d = 0.05;
			return { lo: b.lo - d, hi: b.hi + d };
		}

		return {
			x: expand(bx),
			y: expand(by),
			z: expand(bz),
			dim: act.dim
		};
	}

	function _boxWireframe(bounds, dim) {
		if (!bounds) return null;

		var xs = [], ys = [], zs = [];

		function seg(p, q) {
			xs.push(p[0], q[0], null);
			ys.push(p[1], q[1], null);
			zs.push(p[2], q[2], null);
		}

		var x0 = bounds.x.lo, x1 = bounds.x.hi;
		var y0 = bounds.y.lo, y1 = bounds.y.hi;
		var z0 = bounds.z.lo, z1 = bounds.z.hi;

		// Anteil der Kantenlänge, der als "Ecke" gezeichnet wird
		var F = 0.17;
		var lx = (x1 - x0) * F;
		var ly = (y1 - y0) * F;
		var lz = (z1 - z0) * F;
		if (!_isFiniteNum(lx) || lx <= 0) lx = 0.05;
		if (!_isFiniteNum(ly) || ly <= 0) ly = 0.05;
		if (!_isFiniteNum(lz) || lz <= 0) lz = 0.05;

		if (dim === 1) {
			seg([x0, 0, 0], [x0 + lx * 2, 0, 0]);
			seg([x1 - lx * 2, 0, 0], [x1, 0, 0]);
			var tick = (x1 - x0) * 0.025;
			if (!_isFiniteNum(tick) || tick <= 0) tick = 0.02;
			seg([x0, -tick, 0], [x0, tick, 0]);
			seg([x1, -tick, 0], [x1, tick, 0]);
			return { xs: xs, ys: ys, zs: zs };
		}

		if (dim === 2) {
			// 4 Ecken, je 2 Schenkel
			var c2 = [
				[x0, y0,  1,  1],
				[x1, y0, -1,  1],
				[x1, y1, -1, -1],
				[x0, y1,  1, -1]
			];
			for (var i = 0; i < c2.length; i++) {
				var p = c2[i];
				seg([p[0], p[1], 0], [p[0] + p[2] * lx, p[1], 0]);
				seg([p[0], p[1], 0], [p[0], p[1] + p[3] * ly, 0]);
			}
			return { xs: xs, ys: ys, zs: zs };
		}

		// 3D: 8 Ecken, je 3 Schenkel
		var c3 = [
			[x0, y0, z0,  1,  1,  1],
			[x1, y0, z0, -1,  1,  1],
			[x1, y1, z0, -1, -1,  1],
			[x0, y1, z0,  1, -1,  1],
			[x0, y0, z1,  1,  1, -1],
			[x1, y0, z1, -1,  1, -1],
			[x1, y1, z1, -1, -1, -1],
			[x0, y1, z1,  1, -1, -1]
		];
		for (var k = 0; k < c3.length; k++) {
			var q = c3[k];
			seg([q[0], q[1], q[2]], [q[0] + q[3] * lx, q[1], q[2]]);
			seg([q[0], q[1], q[2]], [q[0], q[1] + q[4] * ly, q[2]]);
			seg([q[0], q[1], q[2]], [q[0], q[1], q[2] + q[5] * lz]);
		}

		return { xs: xs, ys: ys, zs: zs };
	}

	// ============================================================
	// RELU-SCHNITTLINIEN
	// ============================================================

	function _isReluLike(act) {
		if (!act) return false;
		return RELU_LIKE.indexOf(String(act).toLowerCase()) >= 0;
	}

	function _isSoftFold(act) {
		if (!act) return false;
		return SOFT_FOLD.indexOf(String(act).toLowerCase()) >= 0;
	}

	function _extractHyperplanes(layer, inputDim) {
		if (!layer) return null;
		if (!_isFiniteNum(inputDim) || inputDim < 1 || inputDim > 3) return null;

		var cls = "";
		try { cls = layer.getClassName ? layer.getClassName() : ""; }
		catch (e) { cls = ""; }

		if (String(cls).toLowerCase() !== "dense") return null;

		var ws = null;
		try { ws = layer.getWeights ? layer.getWeights() : null; }
		catch (e) { ws = null; }

		if (!ws || !ws.length) return null;
		if (_isDisposedTensor(ws[0])) return null;

		var kernel = null, bias = null;
		try {
			var kShape = ws[0].shape;
			if (!Array.isArray(kShape) || kShape.length !== 2) return null;
			if (kShape[0] !== inputDim) return null;
			kernel = ws[0].dataSync();
			if (ws.length > 1 && !_isDisposedTensor(ws[1])) {
				bias = ws[1].dataSync();
			}
			var units = kShape[1];
			var planes = [];
			var limit = _state.config.reluCutLimit;
			if (!_isFiniteNum(limit) || limit < 1) limit = 8;

			for (var u = 0; u < units && planes.length < limit; u++) {
				var w = [];
				var norm2 = 0;
				var ok = true;
				for (var d = 0; d < inputDim; d++) {
					var v = kernel[d * units + u];
					if (!_isFiniteNum(v)) { ok = false; break; }
					w.push(v);
					norm2 += v * v;
				}
				if (!ok) continue;
				if (norm2 < 1e-12) continue;

				var b = 0;
				if (bias && _isFiniteNum(bias[u])) b = bias[u];

				planes.push({ w: w, b: b, unit: u, norm: Math.sqrt(norm2) });
			}

			return planes.length ? planes : null;
		} catch (e) {
			_warn("Konnte Hyperplanes nicht extrahieren: " + e);
			return null;
		}
	}

	function _clipHyperplane(plane, bounds, dim) {
		if (!plane || !bounds) return null;

		var w = plane.w, b = plane.b;

		if (dim === 1) {
			if (Math.abs(w[0]) < 1e-12) return null;
			var xc = -b / w[0];
			if (!_isFiniteNum(xc)) return null;
			if (xc < bounds.x.lo || xc > bounds.x.hi) return null;
			var tick = (bounds.x.hi - bounds.x.lo) * 0.05;
			if (!_isFiniteNum(tick) || tick <= 0) tick = 0.05;
			return {
				xs: [xc, xc, null],
				ys: [-tick, tick, null],
				zs: [0, 0, null],
				poly: null
			};
		}

		if (dim === 2) {
			var pts = [];
			var eps = 1e-12;

			if (Math.abs(w[1]) > eps) {
				var yAtX0 = -(w[0] * bounds.x.lo + b) / w[1];
				var yAtX1 = -(w[0] * bounds.x.hi + b) / w[1];
				if (_isFiniteNum(yAtX0) && yAtX0 >= bounds.y.lo && yAtX0 <= bounds.y.hi) {
					pts.push([bounds.x.lo, yAtX0]);
				}
				if (_isFiniteNum(yAtX1) && yAtX1 >= bounds.y.lo && yAtX1 <= bounds.y.hi) {
					pts.push([bounds.x.hi, yAtX1]);
				}
			}
			if (Math.abs(w[0]) > eps) {
				var xAtY0 = -(w[1] * bounds.y.lo + b) / w[0];
				var xAtY1 = -(w[1] * bounds.y.hi + b) / w[0];
				if (_isFiniteNum(xAtY0) && xAtY0 >= bounds.x.lo && xAtY0 <= bounds.x.hi) {
					pts.push([xAtY0, bounds.y.lo]);
				}
				if (_isFiniteNum(xAtY1) && xAtY1 >= bounds.x.lo && xAtY1 <= bounds.x.hi) {
					pts.push([xAtY1, bounds.y.hi]);
				}
			}

			if (pts.length < 2) return null;

			var best = [pts[0], pts[1]];
			var bestD = -1;
			for (var i = 0; i < pts.length; i++) {
				for (var j = i + 1; j < pts.length; j++) {
					var dx = pts[i][0] - pts[j][0];
					var dy = pts[i][1] - pts[j][1];
					var dd = dx * dx + dy * dy;
					if (dd > bestD) { bestD = dd; best = [pts[i], pts[j]]; }
				}
			}
			if (bestD <= 1e-14) return null;

			// Die Trennlinie zu einem vertikalen Band extrudieren, damit
			// daraus eine sichtbare Trennflaeche wird. Hoehe orientiert
			// sich an der z-Ausdehnung der Szene.
			var zLo = bounds.z.lo, zHi = bounds.z.hi;
			if (!_isFiniteNum(zLo) || !_isFiniteNum(zHi) || zHi - zLo < 1e-9) {
				var sp = Math.max(
					Math.abs(bounds.x.hi - bounds.x.lo),
					Math.abs(bounds.y.hi - bounds.y.lo)
				);
				if (!_isFiniteNum(sp) || sp <= 0) sp = 1;
				zLo = -sp * 0.28;
				zHi =  sp * 0.28;
			}

			var quadPoly = [
				[best[0][0], best[0][1], zLo],
				[best[1][0], best[1][1], zLo],
				[best[1][0], best[1][1], zHi],
				[best[0][0], best[0][1], zHi]
			];

			return {
				xs: [best[0][0], best[1][0], null],
				ys: [best[0][1], best[1][1], null],
				zs: [0, 0, null],
				poly: quadPoly
			};
		}

		var corners = [
			[bounds.x.lo, bounds.y.lo, bounds.z.lo],
			[bounds.x.hi, bounds.y.lo, bounds.z.lo],
			[bounds.x.hi, bounds.y.hi, bounds.z.lo],
			[bounds.x.lo, bounds.y.hi, bounds.z.lo],
			[bounds.x.lo, bounds.y.lo, bounds.z.hi],
			[bounds.x.hi, bounds.y.lo, bounds.z.hi],
			[bounds.x.hi, bounds.y.hi, bounds.z.hi],
			[bounds.x.lo, bounds.y.hi, bounds.z.hi]
		];
		var edges = [
			[0,1],[1,2],[2,3],[3,0],
			[4,5],[5,6],[6,7],[7,4],
			[0,4],[1,5],[2,6],[3,7]
		];

		function f(p) { return w[0]*p[0] + w[1]*p[1] + w[2]*p[2] + b; }

		var poly = [];
		for (var e = 0; e < edges.length; e++) {
			var pA = corners[edges[e][0]];
			var pB = corners[edges[e][1]];
			var fA = f(pA), fB = f(pB);
			if (!_isFiniteNum(fA) || !_isFiniteNum(fB)) continue;
			if ((fA > 0 && fB > 0) || (fA < 0 && fB < 0)) continue;
			var denom = fA - fB;
			if (Math.abs(denom) < 1e-14) continue;
			var t = fA / denom;
			if (t < 0 || t > 1) continue;
			poly.push([
				pA[0] + (pB[0] - pA[0]) * t,
				pA[1] + (pB[1] - pA[1]) * t,
				pA[2] + (pB[2] - pA[2]) * t
			]);
		}

		if (poly.length < 3) return null;

		var cx = 0, cy = 0, cz = 0;
		for (var p = 0; p < poly.length; p++) {
			cx += poly[p][0]; cy += poly[p][1]; cz += poly[p][2];
		}
		cx /= poly.length; cy /= poly.length; cz /= poly.length;

		var n = [w[0], w[1], w[2]];
		var nl = Math.sqrt(n[0]*n[0] + n[1]*n[1] + n[2]*n[2]) || 1;
		n = [n[0]/nl, n[1]/nl, n[2]/nl];

		var helper = (Math.abs(n[0]) < 0.9) ? [1,0,0] : [0,1,0];
		var u1 = [
			helper[1]*n[2] - helper[2]*n[1],
			helper[2]*n[0] - helper[0]*n[2],
			helper[0]*n[1] - helper[1]*n[0]
		];
		var u1l = Math.sqrt(u1[0]*u1[0] + u1[1]*u1[1] + u1[2]*u1[2]) || 1;
		u1 = [u1[0]/u1l, u1[1]/u1l, u1[2]/u1l];
		var u2 = [
			n[1]*u1[2] - n[2]*u1[1],
			n[2]*u1[0] - n[0]*u1[2],
			n[0]*u1[1] - n[1]*u1[0]
		];

		for (var q = 0; q < poly.length; q++) {
			var dxq = poly[q][0] - cx;
			var dyq = poly[q][1] - cy;
			var dzq = poly[q][2] - cz;
			var a1 = dxq*u1[0] + dyq*u1[1] + dzq*u1[2];
			var a2 = dxq*u2[0] + dyq*u2[1] + dzq*u2[2];
			poly[q].push(Math.atan2(a2, a1));
		}
		poly.sort(function (a, b2) { return a[3] - b2[3]; });

		var polyOut = [];
		var xs = [], ys = [], zs = [];
		for (var r = 0; r < poly.length; r++) {
			xs.push(poly[r][0]); ys.push(poly[r][1]); zs.push(poly[r][2]);
			polyOut.push([poly[r][0], poly[r][1], poly[r][2]]);
		}
		xs.push(poly[0][0]); ys.push(poly[0][1]); zs.push(poly[0][2]);
		xs.push(null); ys.push(null); zs.push(null);

		return { xs: xs, ys: ys, zs: zs, poly: polyOut };
	}

	function _buildCutTracesFor(cutLayer, dim, bounds, sceneName, theme, showLegend) {
		if (!_state.config.showReluCuts) return [];
		if (!cutLayer || !bounds) return [];
		if (!_layerAlive(cutLayer)) return [];

		var act = _activationNameOfLayer(cutLayer);
		var isHard = _isReluLike(act);
		var isSoft = _isSoftFold(act);

		if (!isHard && !(isSoft && _state.config.showSoftFolds)) return [];

		var planes = _extractHyperplanes(cutLayer, dim);
		if (!planes || !planes.length) return [];

		var traces = [];
		var allXs = [], allYs = [], allZs = [];
		var drawn = 0;

		// Sammel-Mesh fuer alle Trennflaechen eines Layers. Ein einziger
		// Trace statt N Stueck haelt die Trace-Zahl klein und sorgt fuer
		// konsistentes Alpha-Blending.
		var mx = [], my = [], mz = [];
		var mi = [], mj = [], mk = [];
		var vBase = 0;
		var meshCount = 0;

		for (var i = 0; i < planes.length; i++) {
			var clipped = _clipHyperplane(planes[i], bounds, dim);
			if (!clipped) continue;

			allXs = allXs.concat(clipped.xs);
			allYs = allYs.concat(clipped.ys);
			allZs = allZs.concat(clipped.zs);
			drawn++;

			var poly = clipped.poly;
			if (!poly || poly.length < 3) continue;

			// Guardrail: nur finite Vertices uebernehmen, sonst
			// verwirft Plotly das gesamte Mesh kommentarlos.
			var ok = true;
			for (var v = 0; v < poly.length; v++) {
				if (!_isFiniteNum(poly[v][0]) ||
				    !_isFiniteNum(poly[v][1]) ||
				    !_isFiniteNum(poly[v][2])) { ok = false; break; }
			}
			if (!ok) continue;

			for (var v2 = 0; v2 < poly.length; v2++) {
				mx.push(poly[v2][0]);
				my.push(poly[v2][1]);
				mz.push(poly[v2][2]);
			}
			// Triangle-Fan: das Polygon ist bereits winkelsortiert,
			// also konvex genug fuer einen simplen Faecher.
			for (var t = 1; t + 1 < poly.length; t++) {
				mi.push(vBase);
				mj.push(vBase + t);
				mk.push(vBase + t + 1);
			}
			vBase += poly.length;
			meshCount++;
		}

		if (!drawn) return [];

		var isHardC = isHard;
		var label = (isHardC ? _tr("origami_relu_cut", "Faltkante (ReLU)")
		                     : _tr("origami_soft_fold", "weiche Biegung")) +
		            " \u00B7 " + drawn;

		// --- Trennflaeche als halbtransparentes Mesh ---
		if (meshCount > 0 && mi.length > 0) {
			var faceCol = isHardC
				? (theme.dark ? "rgb(255,198,70)"  : "rgb(232,168,30)")
				: (theme.dark ? "rgb(255,222,150)" : "rgb(228,192,110)");
			traces.push({
				type: "mesh3d",
				x: mx, y: my, z: mz,
				i: mi, j: mj, k: mk,
				color: faceCol,
				opacity: isHardC ? 0.30 : 0.18,
				flatshading: true,
				name: label,
				legendgroup: "cuts",
				showlegend: false,
				hoverinfo: "skip",
				scene: sceneName,
				lighting: {
					ambient: 0.98, diffuse: 0.05, specular: 0.0,
					roughness: 1.0, fresnel: 0.0,
					vertexnormalsepsilon: 1e-12,
					facenormalsepsilon: 1e-6
				},
				lightposition: { x: 0, y: 0, z: 1000 }
			});
		}

		// --- Scharfe Kante als duenne Linie obendrauf ---
		// Der frühere 22px-Halo wurde entfernt: ueber der blauen Flaeche
		// erzeugte er genau jene breiten weissen Baender.
		traces.push({
			type: "scatter3d",
			mode: "lines",
			x: allXs, y: allYs, z: allZs,
			line: { color: isHardC ? theme.cutColor : theme.softCut,
			        width: isHardC ? 3.5 : 2 },
			opacity: isHardC ? 0.95 : 0.7,
			name: label,
			legendgroup: "cuts",
			showlegend: showLegend,
			hoverinfo: "name",
			scene: sceneName
		});

		return traces;
	}

	// ============================================================
	// GITTER-TRACES
	// ============================================================

	var DISTORTION_BUCKETS = 17;

	function _buildGridTraces(grid, act, distortion, sceneName, theme,
	                          showLegend, tagLabel, isInput) {
		var traces = [];
		if (!grid || !act) return traces;
		if (!_state.config.showGrid) return traces;
		if (act.n !== grid.n) {
			_log("Gitter-Größe passt nicht (" + grid.n + " vs " + act.n + ")");
			return traces;
		}

		var lw = _state.config.gridLineWidth;
		if (!_isFiniteNum(lw) || lw <= 0) lw = 2;
		var op = _state.config.gridOpacity;
		if (!_isFiniteNum(op) || op < 0 || op > 1) op = 0.9;

		// Liegt eine Fläche darunter, müssen die Linien zurücktreten,
		// sonst überdecken sie bei dichtem Gitter die gesamte Füllung.
		var hasSurface = !!_state.config.showGridSurface;
		if (hasSurface) {
			lw = Math.max(1.4, lw * 0.75);
			op = Math.min(op, 0.8);
		}
		if (isInput) { op = 0.42; lw = Math.max(lw * 0.7, 1.0); }

		function gx(i) { return act.xs[i]; }
		function gy(i) { return act.ys ? act.ys[i] : 0; }
		function gz(i) { return act.zs ? act.zs[i] : 0; }

		var useColor = (_state.config.colorByCurvature && distortion);

		if (!useColor) {
			var xs = [], ys = [], zs = [];
			for (var l = 0; l < grid.lines.length; l++) {
				var ln = grid.lines[l];
				for (var p = 0; p < ln.length; p++) {
					xs.push(gx(ln[p])); ys.push(gy(ln[p])); zs.push(gz(ln[p]));
				}
				xs.push(null); ys.push(null); zs.push(null);
			}
			// Halo NUR ohne Fläche darunter
			if (!hasSurface) {
				traces.push({
					type: "scatter3d",
					mode: "lines",
					x: xs, y: ys, z: zs,
					line: { color: theme.gridGlow, width: lw * 3.5 },
					opacity: 1,
					hoverinfo: "skip",
					showlegend: false,
					legendgroup: "grid",
					scene: sceneName
				});
			}
			traces.push({
				type: "scatter3d",
				mode: "lines",
				x: xs, y: ys, z: zs,
				line: { color: theme.gridColor, width: lw },
				opacity: op,
				name: _tr("origami_grid", "Raumgitter") +
				      (tagLabel ? (" \u00B7 " + tagLabel) : ""),
				legendgroup: "grid",
				showlegend: showLegend,
				hoverinfo: "skip",
				scene: sceneName
			});
			return traces;
		}

		var vals = distortion.values;
		var lo = distortion.lo, hi = distortion.hi;

		var buckets = [];
		for (var b = 0; b < DISTORTION_BUCKETS; b++) {
			buckets.push({ x: [], y: [], z: [] });
		}

		function bucketOf(v) {
			var t = _distortionT(v, lo, hi);
			var bi = Math.round(t * (DISTORTION_BUCKETS - 1));
			if (!_isFiniteNum(bi) || bi < 0) bi = 0;
			if (bi >= DISTORTION_BUCKETS) bi = DISTORTION_BUCKETS - 1;
			return bi;
		}

		var allX = [], allY = [], allZ = [];
		var segCount = 0;
		for (var li = 0; li < grid.lines.length; li++) {
			var line = grid.lines[li];
			for (var s = 0; s + 1 < line.length; s++) {
				var iA = line[s], iB = line[s + 1];
				var vAvg = (vals[iA] + vals[iB]) / 2;
				var bk = buckets[bucketOf(vAvg)];
				bk.x.push(gx(iA), gx(iB), null);
				bk.y.push(gy(iA), gy(iB), null);
				bk.z.push(gz(iA), gz(iB), null);
				if (!hasSurface) {
					allX.push(gx(iA), gx(iB), null);
					allY.push(gy(iA), gy(iB), null);
					allZ.push(gz(iA), gz(iB), null);
				}
				segCount++;
			}
		}

		if (segCount > 60000) {
			_log("Gitter hätte " + segCount + " Segmente – Auflösung reduziert.");
			return traces;
		}

		// Sammel-Halo NUR ohne Fläche
		if (!hasSurface && allX.length) {
			traces.push({
				type: "scatter3d",
				mode: "lines",
				x: allX, y: allY, z: allZ,
				line: { color: theme.gridGlow, width: lw * 4 },
				opacity: 1,
				hoverinfo: "skip",
				showlegend: false,
				legendgroup: "grid_dist",
				scene: sceneName
			});
		}

		for (var bi2 = 0; bi2 < DISTORTION_BUCKETS; bi2++) {
			var bkt = buckets[bi2];
			if (!bkt.x.length) continue;
			var frac = (DISTORTION_BUCKETS > 1)
				? (bi2 / (DISTORTION_BUCKETS - 1)) : 0.5;
			var repVal = lo + (hi - lo) * frac;
			var col = _distortionColor(repVal, lo, hi, theme.dark);

			var edgeness = Math.abs(frac - 0.5) * 2;
			var wHere = lw * (0.82 + 0.55 * edgeness);

			var inLegend = false;
			var legName = "";
			if (showLegend && bi2 === 0) {
				inLegend = true;
				legName = "\u25C0 " + _tr("origami_compressed", "gestaucht") +
				          "  2^" + lo.toFixed(1);
			} else if (showLegend && bi2 === DISTORTION_BUCKETS - 1) {
				inLegend = true;
				legName = _tr("origami_stretched", "gestreckt") +
				          "  2^" + hi.toFixed(1) + " \u25B6";
			}

			traces.push({
				type: "scatter3d",
				mode: "lines",
				x: bkt.x, y: bkt.y, z: bkt.z,
				line: { color: col, width: wHere },
				opacity: op,
				name: inLegend ? legName : "",
				legendgroup: "grid_dist",
				showlegend: inLegend,
				hoverinfo: "skip",
				scene: sceneName
			});
		}

		return traces;
	}

	function _rebuildQuads(grid) {
		if (!grid) return [];
		var res = grid.res;
		// Topologie-Dimension (Bauform des Gitters), nicht die
		// Koordinaten-Dimension: ein 2D-Blatt, das in den 3D-Raum
		// geschoben wurde, hat 2D-Quads.
		var dim = (typeof grid.topo === "number" && _isFiniteNum(grid.topo))
			? grid.topo : grid.dim;
		if (!_isFiniteNum(res) || res < 2) return [];
		if (!_isFiniteNum(dim) || dim < 1 || dim > 3) return [];

		var quads = [];

		if (dim === 2) {
			for (var qy = 0; qy + 1 < res; qy++) {
				for (var qx = 0; qx + 1 < res; qx++) {
					quads.push([
						qy * res + qx,
						qy * res + qx + 1,
						(qy + 1) * res + qx + 1,
						(qy + 1) * res + qx
					]);
				}
			}
			return quads;
		}

		if (dim === 3) {
			var idx3 = function (x, y, z) { return (z * res + y) * res + x; };
			var last = res - 1;
			var face = function (get) {
				for (var a = 0; a + 1 < res; a++) {
					for (var b = 0; b + 1 < res; b++) {
						quads.push([
							get(a, b), get(a + 1, b),
							get(a + 1, b + 1), get(a, b + 1)
						]);
					}
				}
			};
			face(function (a, b) { return idx3(a, b, 0); });
			face(function (a, b) { return idx3(a, b, last); });
			face(function (a, b) { return idx3(a, 0, b); });
			face(function (a, b) { return idx3(a, last, b); });
			face(function (a, b) { return idx3(0, a, b); });
			face(function (a, b) { return idx3(last, a, b); });
			return quads;
		}

		return [];
	}

	// --- GUARDRAIL D: Soll-Anzahl der Quads berechnen ---
	// Nur so lässt sich erkennen, ob eine weitergereichte Quad-Liste
	// noch zur aktuellen Auflösung passt.
	function _expectedQuadCount(res, dim) {
		if (!_isFiniteNum(res) || res < 2) return 0;
		if (dim === 2) return (res - 1) * (res - 1);
		if (dim === 3) return 6 * (res - 1) * (res - 1);
		return 0;
	}

	// --- GUARDRAIL E: Index-Validität ---
	function _validIdx(v, nMax) {
		return (typeof v === "number") && isFinite(v) &&
		       v >= 0 && v < nMax && Math.floor(v) === v;
	}

	// --- GUARDRAIL B: entartete Dreiecke erkennen ---
	// Zwei zusammenfallende Ecken -> Fläche 0 -> WebGL verwirft das
	// Dreieck und es entsteht ein sichtbares Loch im Mesh.
	function _triAreaSq(xs, ys, zs, a, b, c) {
		var ax = xs[b] - xs[a], ay = ys[b] - ys[a], az = zs[b] - zs[a];
		var bx = xs[c] - xs[a], by = ys[c] - ys[a], bz = zs[c] - zs[a];
		var cx = ay * bz - az * by;
		var cy = az * bx - ax * bz;
		var cz = ax * by - ay * bx;
		var s = cx * cx + cy * cy + cz * cz;
		return _isFiniteNum(s) ? s : 0;
	}

	function _buildGridSurface(grid, act, distortion, sceneName, theme, showLegend, isInput) {
		if (!_state.config.showGridSurface) return [];
		if (!grid || !act) return [];
		if (act.n !== grid.n) return [];
		if (!_isFiniteNum(grid.n) || grid.n < 3) return [];

		// --- GUARDRAIL D: Quad-Liste auf Konsistenz prüfen ---
		// Eine von prevGridOut übernommene Liste kann zu einer anderen
		// Auflösung gehören. Dann zeigen Indizes ins Leere und ganze
		// Streifen der Fläche fallen weg.
		var topo = (typeof grid.topo === "number" && _isFiniteNum(grid.topo))
			? grid.topo : grid.dim;
		var quads = grid.quads;
		var want  = _expectedQuadCount(grid.res, topo);
		var needRebuild = false;

		if (!quads || !quads.length) {
			needRebuild = true;
		} else if (want > 0 && quads.length !== want) {
			_log("Quad-Anzahl inkonsistent (" + quads.length + " statt " +
			     want + "), Topologie wird neu gebaut");
			needRebuild = true;
		}

		if (needRebuild) {
			quads = _rebuildQuads(grid);
			if (!quads || !quads.length) {
				_log("Keine Quads rekonstruierbar (dim " + grid.dim +
				     ", res " + grid.res + ")");
				return [];
			}
		}

		var op = _state.config.gridSurfaceOpacity;
		if (!_isFiniteNum(op) || op < 0 || op > 1) op = 0.28;
		if (isInput) op = Math.min(0.9, op * 0.7);
		else         op = Math.min(0.9, op * 1.9);

		var n = grid.n;
		var xs = new Array(n);
		var ys = new Array(n);
		var zs = new Array(n);
		for (var i = 0; i < n; i++) {
			xs[i] = _isFiniteNum(act.xs[i]) ? act.xs[i] : 0;
			ys[i] = (act.ys && _isFiniteNum(act.ys[i])) ? act.ys[i] : 0;
			zs[i] = (act.zs && _isFiniteNum(act.zs[i])) ? act.zs[i] : 0;
		}

		function _span(arr) {
			var mn = Infinity, mx = -Infinity;
			for (var s = 0; s < arr.length; s++) {
				var v = arr[s];
				if (!_isFiniteNum(v)) continue;
				if (v < mn) mn = v;
				if (v > mx) mx = v;
			}
			if (!_isFiniteNum(mn) || !_isFiniteNum(mx)) return 0;
			return mx - mn;
		}
		var spanMax = Math.max(_span(xs), _span(ys), _span(zs));
		if (!(spanMax > 1e-9)) {
			_log("Gitterfläche degeneriert (Ausdehnung " + spanMax + ")");
			return [];
		}

		// Toleranz relativ zur Szenengröße: absolute Schwellen funktionieren
		// nicht, wenn Aktivierungen mal im 0.01- und mal im 100er-Bereich liegen.
		var areaEps = Math.pow(spanMax * 1e-7, 2);
		if (!_isFiniteNum(areaEps) || areaEps <= 0) areaEps = 1e-24;

		var ii = [], jj = [], kk = [];
		var badIdx = 0, degenerate = 0;

		for (var q = 0; q < quads.length; q++) {
			var Q = quads[q];
			if (!Q || Q.length < 4) { badIdx++; continue; }

			// --- GUARDRAIL E: jeden Index einzeln prüfen ---
			// Plotly verwirft fehlerhafte Dreiecke lautlos; ohne diese
			// Prüfung sieht man nur das Loch, nie die Ursache.
			if (!_validIdx(Q[0], n) || !_validIdx(Q[1], n) ||
			    !_validIdx(Q[2], n) || !_validIdx(Q[3], n)) {
				badIdx++;
				continue;
			}

			// --- GUARDRAIL B: Nulldreiecke aussortieren ---
			// Beide Dreiecke getrennt bewerten: oft ist nur eine Hälfte
			// des Quads kollabiert (typisch an ReLU-Faltkanten).
			var t1 = _triAreaSq(xs, ys, zs, Q[0], Q[1], Q[2]);
			var t2 = _triAreaSq(xs, ys, zs, Q[0], Q[2], Q[3]);

			if (t1 > areaEps) {
				ii.push(Q[0]); jj.push(Q[1]); kk.push(Q[2]);
			} else { degenerate++; }

			if (t2 > areaEps) {
				ii.push(Q[0]); jj.push(Q[2]); kk.push(Q[3]);
			} else { degenerate++; }
		}

		if (badIdx > 0) {
			_log("Gitterfläche: " + badIdx + " Quads mit ungültigen Indizes " +
			      "verworfen (n=" + n + ")");
		}

		/*
		if (degenerate > 0) {
			_log("Gitterfläche: " + degenerate + " entartete Dreiecke " +
			     "übersprungen (von " + (quads.length * 2) + ")");
		}
		*/

		if (!ii.length) {
			dbg("Gitterfläche: kein einziges gültiges Dreieck übrig");
			return [];
		}

		var trace = {
			type: "mesh3d",
			x: xs, y: ys, z: zs,
			i: ii, j: jj, k: kk,
			opacity: op,
			flatshading: true,
			name: _tr("origami_surface", "gefaltete Fläche") +
			      (isInput ? (" \u00B7 " + _tr("origami_before", "vorher")) : ""),
			legendgroup: "surface",
			showlegend: showLegend,
			hoverinfo: "skip",
			scene: sceneName,
			lighting: {
				ambient:   0.95,
				diffuse:   0.12,
				specular:  0.02,
				roughness: 0.9,
				fresnel:   0.05,
				vertexnormalsepsilon: 1e-12,
				facenormalsepsilon:   1e-6
			},
			lightposition: { x: 0, y: 0, z: 1000 }
		};

		if (_state.config.colorByCurvature && distortion && distortion.values) {
			var raw = distortion.values;
			var inten = new Array(n);
			var iMin = 1, iMax = 0;
			var nanCount = 0;
			for (var vi = 0; vi < n; vi++) {
				var tt = _distortionT(raw[vi], distortion.lo, distortion.hi);
				if (!_isFiniteNum(tt)) { tt = 0.5; nanCount++; }
				inten[vi] = tt;
				if (tt < iMin) iMin = tt;
				if (tt > iMax) iMax = tt;
			}
			// Ein einziger NaN im intensity-Array lässt Plotly das
			// komplette Mesh verwerfen – deshalb hier hart absichern.
			if (nanCount > n * 0.5) {
				_log("Verzerrungswerte überwiegend ungültig (" + nanCount +
				      "/" + n + "), Fläche wird einfarbig gezeichnet");
				trace.color = theme.surfaceColor;
			} else {
				trace.intensity     = inten;
				trace.intensitymode = "vertex";
				trace.colorscale    = _distortionScale(theme.dark);
				if (iMax - iMin < 0.12) {
					trace.cmin = Math.max(0, iMin - 0.06);
					trace.cmax = Math.min(1, iMax + 0.06);
				} else {
					trace.cmin = 0;
					trace.cmax = 1;
				}
				trace.showscale = false;
			}
		} else {
			trace.color = theme.surfaceColor;
		}

		return [trace];
	}

	// ============================================================
	// TRACES FÜR EINEN RAUM
	// ============================================================

	function _offsetAct(act, dim, amount) {
		if (!act || !act.n) return act;
		var n = act.n;
		var xs = act.xs.slice();
		var ys = act.ys ? act.ys.slice() : null;
		var zs = act.zs ? act.zs.slice() : null;

		if (dim <= 1) {
			if (!ys) ys = new Float64Array(n);
			for (var i = 0; i < n; i++) ys[i] += amount;
		} else {
			if (!zs) zs = new Float64Array(n);
			for (var i = 0; i < n; i++) zs[i] += amount;
		}

		return { xs: xs, ys: ys, zs: zs, dim: act.dim, n: n };
	}

	function _offsetBounds(bounds, dim, amount) {
		if (!bounds) return bounds;
		var b = {
			x: { lo: bounds.x.lo, hi: bounds.x.hi },
			y: { lo: bounds.y.lo, hi: bounds.y.hi },
			z: { lo: bounds.z.lo, hi: bounds.z.hi }
		};
		if (dim <= 1) {
			b.y.lo += amount;
			b.y.hi += amount;
		} else {
			b.z.lo += amount;
			b.z.hi += amount;
		}
		// Guardrail: sanitize bounds
		var axes = ["x", "y", "z"];
		for (var a = 0; a < axes.length; a++) {
			var ax = b[axes[a]];
			if (!_isFiniteNum(ax.lo) || !_isFiniteNum(ax.hi)) {
				ax.lo = 0; ax.hi = 1;
			}
			if (ax.hi <= ax.lo) ax.hi = ax.lo + 0.1;
		}
		return b;
	}

	function _sanitizeAct(act, inPlace) {
		if (!act || !act.n) return act;
		var n = act.n;

		// --- GUARDRAIL A: Defensive Copy ---
		// Ohne Kopie mutieren wir Arrays, die anderswo (prevGridOut,
		// results[i].gridOut) noch referenziert werden. Mehrfaches
		// Clamping legt dann Gitterpunkte übereinander -> Nulldreiecke.
		var target;
		if (inPlace === true) {
			target = act;
		} else {
			target = {
				xs:  act.xs ? Float64Array.from(act.xs) : null,
				ys:  act.ys ? Float64Array.from(act.ys) : null,
				zs:  act.zs ? Float64Array.from(act.zs) : null,
				dim: act.dim,
				n:   n
			};
		}

		// --- GUARDRAIL C: adaptives Clamping ---
		// Ein fixer absoluter Grenzwert passt nie zu allen Netzen.
		// Basis ist die robuste Spannweite (5./95. Perzentil) der Daten,
		// der Config-Wert dient nur noch als untere Schranke.
		function robustSpan(arr) {
			if (!arr || !arr.length) return 0;
			var vals = [];
			for (var i = 0; i < arr.length; i++) {
				if (_isFiniteNum(arr[i])) vals.push(arr[i]);
			}
			if (vals.length < 4) return 0;
			vals.sort(function (a, b) { return a - b; });
			var lo = vals[Math.floor(vals.length * 0.05)];
			var hi = vals[Math.floor(vals.length * 0.95)];
			if (!_isFiniteNum(lo) || !_isFiniteNum(hi)) return 0;
			return Math.abs(hi - lo);
		}

		var cfgLim = _state.config.gridClampRange;
		if (!_isFiniteNum(cfgLim) || cfgLim <= 0) cfgLim = 100;

		var spanAll = Math.max(
			robustSpan(target.xs),
			robustSpan(target.ys),
			robustSpan(target.zs)
		);
		// Grenze großzügig über der echten Ausdehnung ansetzen, damit
		// legitime Ausreißer die Fläche nicht zerreißen.
		var lim = cfgLim;
		if (spanAll > 1e-9) {
			lim = Math.max(cfgLim, spanAll * 6);
		}
		if (!_isFiniteNum(lim) || lim <= 0) lim = 100;

		var nonFinite = 0, clamped = 0;

		function fix(arr) {
			if (!arr) return arr;
			for (var i = 0; i < arr.length; i++) {
				var v = arr[i];
				if (!_isFiniteNum(v)) { arr[i] = 0; nonFinite++; }
				else if (v >  lim)    { arr[i] =  lim; clamped++; }
				else if (v < -lim)    { arr[i] = -lim; clamped++; }
			}
			return arr;
		}

		target.xs = fix(target.xs);
		target.ys = fix(target.ys);
		target.zs = fix(target.zs);

		if (nonFinite > 0 || clamped > 0) {
			_log("OrigamiFolds: " + nonFinite + " nicht-finite, " +
			     clamped + " gesättigt (Limit " + lim.toFixed(2) + ")");
		}
		return target;
	}

	function _sanitizeTraces(traces) {
		if (!traces || !traces.length) return traces;
		var bad = 0;
		for (var t = 0; t < traces.length; t++) {
			var tr = traces[t];
			var keys = ["x", "y", "z"];
			for (var k = 0; k < keys.length; k++) {
				var arr = tr[keys[k]];
				if (!arr || !arr.length) continue;
				for (var i = 0; i < arr.length; i++) {
					if (arr[i] === null || arr[i] === undefined) continue;
					if (!_isFiniteNum(arr[i])) { arr[i] = 0; bad++; }
				}
			}
			var mk = tr.marker;
			if (mk && mk.color && mk.color.length) {
				for (var c = 0; c < mk.color.length; c++) {
					if (typeof mk.color[c] === "number" && !_isFiniteNum(mk.color[c])) {
						mk.color[c] = 0; bad++;
					}
				}
			}
		}
		if (bad > 0) _log("OrigamiFolds: " + bad + " Trace-Werte gesäubert (NaN/Inf)");
		return traces;
	}

	function _buildSpaceTraces(o) {
		var traces = [];
		if (!o || !o.act || !o.act.n) return traces;

		var theme      = o.theme;
		var sceneName  = o.sceneName;
		var showLegend = !!o.showLegend;
		var dim        = o.dim;
		var isOut      = !!o.isOutput;

		// --- GUARDRAIL A: immer auf Kopien arbeiten ---
		// o.act und o.gridAct werden vom Aufrufer weiterverwendet
		// (prevGridOut, results[]). Jede In-Place-Änderung hier würde
		// beim nächsten Paar erneut angewandt.
		var act = _sanitizeAct(o.act, false);
		var n   = act.n;

		var bounds = o.bounds || _computeBounds(act);

		var ext = 0;
		if (bounds) {
			var bx = Math.abs(bounds.x.hi - bounds.x.lo);
			var by = Math.abs(bounds.y.hi - bounds.y.lo);
			var bz = Math.abs(bounds.z.hi - bounds.z.lo);
			ext = Math.max(bx, by, bz);
		}
		if (!_isFiniteNum(ext) || ext < 1e-6) ext = 1;
		var sepAmt = ext * 0.15;
		var dir = isOut ? 0 : -1;

		if (dir !== 0) {
			act = _offsetAct(act, dim, dir * sepAmt);
			act = _sanitizeAct(act, true);   // schon eine Kopie
		}
		var offBounds = (dir !== 0)
			? _offsetBounds(bounds, dim, dir * sepAmt)
			: bounds;

		var xs = act.xs;
		var ys = act.ys ? act.ys : new Float64Array(n);
		var zs = act.zs ? act.zs : new Float64Array(n);

		var gridActForBuild = null;
		if (o.gridAct) {
			gridActForBuild = _sanitizeAct(o.gridAct, false);
			if (dir !== 0) {
				gridActForBuild = _offsetAct(gridActForBuild, dim, dir * sepAmt);
				gridActForBuild = _sanitizeAct(gridActForBuild, true);
			}
		}

		var drawGrid = !!(o.grid && gridActForBuild);

		// Zusätzliche Konsistenzprüfung: passt die Punktzahl überhaupt?
		if (drawGrid && gridActForBuild.n !== o.grid.n) {
			_log("Gitter-Punktzahl passt nicht (" + gridActForBuild.n +
				      " vs " + o.grid.n + ") in Szene " + sceneName);
			drawGrid = false;
		}
		if (!drawGrid && o.gridAct) {
			_log("OrigamiFolds: Gitter nicht zeichenbar für Szene " + sceneName +
			     " (dim " + dim + ")");
		}

		// --- 1. Gefaltete Fläche (Mesh) zuerst, liegt hinten ---
		if (drawGrid) {
			var surf = _buildGridSurface(
				o.grid, gridActForBuild,
				o.distortion,
				sceneName, theme,
				showLegend && isOut,
				!isOut
			);
			for (var sI = 0; sI < surf.length; sI++) traces.push(surf[sI]);
		}

		// --- 2. Gitterlinien darüber ---
		// Dieser Block fehlte: _buildGridTraces() wurde nie aufgerufen,
		// deshalb war nur das Mesh sichtbar, aber kein Liniennetz.
		if (drawGrid) {
			var gt = _buildGridTraces(
				o.grid, gridActForBuild,
				o.distortion,
				sceneName, theme,
				showLegend && isOut,
				isOut ? _tr("origami_after", "nachher")
				      : _tr("origami_before", "vorher"),
				!isOut
			);
			for (var g = 0; g < gt.length; g++) traces.push(gt[g]);
		}

		// --- 3. Bounding Box ---
		if (_state.config.showBoundingBox && offBounds) {
			var wf = _boxWireframe(offBounds, dim);
			if (wf) {
				traces.push({
					type: "scatter3d",
					mode: "lines",
					x: wf.xs, y: wf.ys, z: wf.zs,
					line: { color: theme.boxColor, width: isOut ? 2.5 : 1.2 },
					opacity: isOut ? 0.75 : 0.35,
					name: _tr("origami_subspace", "Unterraum") + " (" + dim + "D)",
					legendgroup: "box",
					showlegend: showLegend && isOut,
					hoverinfo: "skip",
					scene: sceneName
				});
			}
		}

		// --- 4. Faltkanten / Trennflächen ---
		if (o.cutLayer && offBounds) {
			var cuts = _buildCutTracesFor(
				o.cutLayer, dim, offBounds, sceneName, theme, showLegend);
			for (var c = 0; c < cuts.length; c++) {
				var ct = cuts[c];
				if (dir !== 0) {
					if (dim <= 1) {
						for (var cy = 0; cy < ct.y.length; cy++) {
							if (ct.y[cy] !== null) ct.y[cy] += dir * sepAmt;
						}
					} else {
						for (var cz = 0; cz < ct.z.length; cz++) {
							if (ct.z[cz] !== null) ct.z[cz] += dir * sepAmt;
						}
					}
				}
				traces.push(ct);
			}
		}

		// --- 5. Datenpunkte zuletzt (immer oben sichtbar) ---
		if (_state.config.showDataPoints) {
			var dpt = _buildDataPointTraces(
				act, xs, ys, zs, n, dim, o.node, sceneName, theme,
				showLegend && isOut, !isOut);
			for (var d = 0; d < dpt.length; d++) traces.push(dpt[d]);
		}

		return traces;
	}

	function _buildDataPointTraces(act, xs, ys, zs, n, dim, node,
	                                sceneName, theme, showLegend, isInput) {
		var traces = [];
		var classIdx   = _state.cachedClassIdx;
		var classNames = _state.cachedClassNames;
		var isReg      = _state.cachedIsRegression;
		var colors     = _state.cachedColors;
		var ptOp       = isInput ? _state.config.pointOpacity * 0.28
		                         : Math.min(1, _state.config.pointOpacity * 1.1);

		var nodeName = (node && node.name) ? node.name : "";

		if (classNames && classIdx && !isReg) {
			var buckets = {};
			for (var i = 0; i < n; i++) {
				var c = classIdx[i];
				if (!_isFiniteNum(c) || c < 0) c = 0;
				if (!buckets[c]) buckets[c] = { x: [], y: [], z: [] };
				buckets[c].x.push(xs[i]);
				buckets[c].y.push(ys[i]);
				buckets[c].z.push(zs[i]);
			}
			var keys = Object.keys(buckets).sort(function (a, b) {
				return parseInt(a, 10) - parseInt(b, 10);
			});
			for (var k = 0; k < keys.length; k++) {
				var ci = parseInt(keys[k], 10);
				var bk = buckets[keys[k]];
				traces.push({
					type: "scatter3d",
					mode: "markers",
					x: bk.x, y: bk.y, z: bk.z,
					marker: {
						size: isInput ? _state.config.pointSize * 0.8
						              : _state.config.pointSize * 1.45,
						color: _classColor(ci),
						opacity: ptOp,
						line: {
							width: isInput ? 0 : 0.6,
							color: theme.markerEdge
						}
					},
					name: classNames[ci] ||
					      (_tr("origami_class", "Klasse") + " " + ci),
					legendgroup: "cls" + ci,
					showlegend: showLegend,
					hovertemplate:
						"x: %{x:.4f}" +
						(dim >= 2 ? "<br>y: %{y:.4f}" : "") +
						(dim >= 3 ? "<br>z: %{z:.4f}" : "") +
						"<extra>" + nodeName + "</extra>",
					scene: sceneName
				});
			}
		} else {
			traces.push({
				type: "scatter3d",
				mode: "markers",
				x: Array.prototype.slice.call(xs),
				y: Array.prototype.slice.call(ys),
				z: Array.prototype.slice.call(zs),
				marker: {
					size: isInput ? _state.config.pointSize * 0.8
					              : _state.config.pointSize * 1.45,
					color: colors || "#159c72",
					opacity: ptOp,
					line: {
						width: isInput ? 0 : 0.5,
						color: theme.markerEdge
					}
				},
				name: isReg ? _tr("origami_target", "Zielwert")
				            : _tr("origami_data", "Daten"),
				legendgroup: "data",
				showlegend: showLegend,
				hovertemplate:
					"x: %{x:.4f}" +
					(dim >= 2 ? "<br>y: %{y:.4f}" : "") +
					(dim >= 3 ? "<br>z: %{z:.4f}" : "") +
					"<extra>" + nodeName + "</extra>",
				scene: sceneName
			});
		}

		return traces;
	}

	// ============================================================
	// PAIR-LAYOUT
	// ============================================================

	function _sceneNameFor(i) {
		return (i === 0) ? "scene" : ("scene" + (i + 1));
	}

	function _defaultCamera(dim) {
		if (dim === 1) {
			return { eye: { x: 0.1, y: -2.2, z: 0.9 }, up: { x: 0, y: 0, z: 1 } };
		}
		if (dim === 2) {
			return { eye: { x: 1.35, y: -1.55, z: 1.05 }, up: { x: 0, y: 0, z: 1 } };
		}
		return { eye: { x: 1.5, y: 1.4, z: 1.2 }, up: { x: 0, y: 0, z: 1 } };
	}

	function _layerOpLabel(p) {
		var parts = [];
		parts.push(p.className || "Layer");
		parts.push(p.dimIn + "\u2192" + p.dimOut);
		if (p.activation && p.activation !== "linear") {
			parts.push(p.activation);
			if (_isReluLike(p.activation)) {
				parts.push("\u2702");
			} else if (_isSoftFold(p.activation)) {
				parts.push("\u223C");
			}
		} else {
			parts.push(_tr("origami_affine", "affin"));
		}
		return parts.join(" \u00B7 ");
	}

	function _buildLayout(results, theme) {
		var nPairs = results.length;
		var h = _state.config.subplotHeight;
		if (!_isFiniteNum(h) || h < 300) h = 500;

		// Guardrail: ensure minimum 400px per plot; stack vertically if needed
		var containerW = 800;
		if (_state.plotDiv && _state.plotDiv.clientWidth) {
			containerW = _state.plotDiv.clientWidth;
		} else if (_state.container && _state.container.clientWidth) {
			containerW = _state.container.clientWidth;
		}
		var minW = 400;
		var maxPerRow = Math.max(1, Math.floor((containerW - 20) / minW));
		var rows = Math.ceil(nPairs / maxPerRow);
		var perRow = rows > 1 ? Math.ceil(nPairs / rows) : nPairs;
		var totalH = h * rows;

		var layout = {
			paper_bgcolor: theme.paper,
			plot_bgcolor:  theme.plotBg,
			font: { color: theme.text, size: 11 },
			margin: { l: 4, r: 4, t: 74, b: 6 },
			height: totalH,
			autosize: true,
			showlegend: true,
			legend: {
				orientation: "h",
				x: 0.5, xanchor: "center",
				y: 1.035, yanchor: "bottom",
				font: { size: 10, color: theme.text },
				bgcolor: theme.legendBg,
				bordercolor: theme.legendBorder,
				borderwidth: 1,
				itemsizing: "constant",
				itemwidth: 30,
				tracegroupgap: 6
			},
			hovermode: "closest",
			annotations: [],
			transition: _state.config.smoothUpdates
				? { duration: 250, easing: "cubic-in-out" }
				: { duration: 0 }
		};

		var axisCommon = {
			showgrid:        true,
			gridcolor:       theme.grid,
			gridwidth:       1,
			zeroline:        true,
			zerolinecolor:   theme.zeroline,
			zerolinewidth:   1.5,
			showline:        false,
			color:           theme.axisText,
			tickfont:        { size: 8, color: theme.axisText },
			showspikes:      false,
			nticks:          5,
			showticklabels:  true
		};

		for (var i = 0; i < nPairs; i++) {
			var r = results[i];
			if (!r) continue;

			var p = r.pair;
			var sceneName = _sceneNameFor(i);

			var row = Math.floor(i / perRow);
			var col = i % perRow;
			var inRow = (row === rows - 1)
				? (nPairs - row * perRow)
				: perRow;

			var gap = (inRow > 1) ? 0.02 : 0;
			var wEach = (1 - gap * (inRow - 1)) / inRow;
			var x0 = col * (wEach + gap);
			var x1 = x0 + wEach;
			if (x1 > 1) x1 = 1;
			var xMid = (x0 + x1) / 2;

			var y0 = 1 - ((row + 1) / rows);
			var y1 = 1 - (row / rows);

			var dim = Math.max(p.dimIn, p.dimOut);
			var cam = _state.lastCameras[sceneName] || _defaultCamera(dim);

			layout[sceneName] = {
				domain: { x: [x0, x1], y: [y0, y1] },
				aspectmode: "auto",
				camera: cam,
				bgcolor: theme.sceneBg,
				dragmode: "orbit",
				hovermode: "closest",
				xaxis: Object.assign({}, axisCommon, {
					title: { text: "d\u2080", font: { size: 9, color: theme.axisText } }
				}),
				yaxis: Object.assign({}, axisCommon, {
					title: {
						text: (dim >= 2 ? "d\u2081" : ""),
						font: { size: 9, color: theme.axisText }
					},
					showticklabels: (dim >= 2)
				}),
				zaxis: Object.assign({}, axisCommon, {
					title: {
						text: (dim >= 3 ? "d\u2082" : ""),
						font: { size: 9, color: theme.axisText }
					},
					showticklabels: (dim >= 3)
				})
			};

			var titleTxt = "L" + p.layerIdx + " " + p.className +
				"  [" + p.dimIn + "\u2192" + p.dimOut + "D]";
			var actName = p.activation && p.activation !== "linear"
				? (" \u00B7 " + p.activation) : "";
			layout.annotations.push({
				text: titleTxt + actName,
				x: xMid, y: y1,
				xanchor: "center", yanchor: "bottom",
				font: { size: 11, color: theme.textAccent },
				showarrow: false
			});

			if (col < inRow - 1) {
				layout.annotations.push({
					text: "\u276F",
					x: x1 + gap * 0.5, y: (y0 + y1) / 2,
					xanchor: "center", yanchor: "middle",
					font: { size: 15, color: theme.arrowColor },
					showarrow: false
				});
			}
		}

		return layout;
	}


	function _buildLayoutFromStates(states, theme) {
		var nStates = 0;
		for (var i = 0; i < states.length; i++) if (states[i]) nStates++;
		var h = _state.config.subplotHeight;
		if (!_isFiniteNum(h) || h < 300) h = 500;

		var containerW = 800;
		if (_state.plotDiv && _state.plotDiv.clientWidth) {
			containerW = _state.plotDiv.clientWidth;
		} else if (_state.container && _state.container.clientWidth) {
			containerW = _state.container.clientWidth;
		}
		var minW = 400;
		var maxPerRow = Math.max(1, Math.floor((containerW - 20) / minW));
		var rows = Math.ceil(nStates / maxPerRow);
		var perRow = rows > 1 ? Math.ceil(nStates / rows) : nStates;
		var totalH = h * rows;

		var layout = {
			paper_bgcolor: theme.paper,
			plot_bgcolor:  theme.plotBg,
			font: { color: theme.text, size: 11 },
			margin: { l: 4, r: 4, t: 74, b: 6 },
			height: totalH,
			autosize: true,
			showlegend: true,
			legend: {
				orientation: "h",
				x: 0.5, xanchor: "center",
				y: 1.035, yanchor: "bottom",
				font: { size: 10, color: theme.text },
				bgcolor: theme.legendBg,
				bordercolor: theme.legendBorder,
				borderwidth: 1,
				itemsizing: "constant",
				itemwidth: 30,
				tracegroupgap: 6
			},
			hovermode: "closest",
			annotations: [],
			transition: _state.config.smoothUpdates
				? { duration: 250, easing: "cubic-in-out" }
				: { duration: 0 }
		};

		var axisCommon = {
			showgrid:        true,
			gridcolor:       theme.grid,
			gridwidth:       1,
			zeroline:        true,
			zerolinecolor:   theme.zeroline,
			zerolinewidth:   1.5,
			showline:        false,
			color:           theme.axisText,
			tickfont:        { size: 8, color: theme.axisText },
			showspikes:      false,
			nticks:          5,
			showticklabels:  true
		};

		var stateIdx = 0;
		for (var s = 0; s < states.length; s++) {
			var st = states[s];
			if (!st) continue;
			stateIdx++;

			var row = Math.floor(stateIdx / perRow) - (stateIdx % perRow === 0 && stateIdx < nStates ? 1 : 0);
			row = Math.min(row, rows - 1);
			row = Math.floor((stateIdx - 1) / perRow);
			var col = (stateIdx - 1) % perRow;
			var inRow = (row === rows - 1)
				? (nStates - row * perRow)
				: perRow;

			var gap = (inRow > 1) ? 0.02 : 0;
			var wEach = (1 - gap * (inRow - 1)) / inRow;
			var x0 = col * (wEach + gap);
			var x1 = x0 + wEach;
			if (x1 > 1) x1 = 1;
			var xMid = (x0 + x1) / 2;

			var y0 = 1 - ((row + 1) / rows);
			var y1 = 1 - (row / rows);

			var sceneName = _sceneNameFor(s);
			var dim = st.dim;
			var cam = _state.lastCameras[sceneName] || _defaultCamera(dim);

			layout[sceneName] = {
				domain: { x: [x0, x1], y: [y0, y1] },
				aspectmode: "auto",
				camera: cam,
				bgcolor: theme.sceneBg,
				dragmode: "orbit",
				hovermode: "closest",
				xaxis: Object.assign({}, axisCommon, {
					title: { text: "d\u2080", font: { size: 9, color: theme.axisText } }
				}),
				yaxis: Object.assign({}, axisCommon, {
					title: {
						text: (dim >= 2 ? "d\u2081" : ""),
						font: { size: 9, color: theme.axisText }
					},
					showticklabels: (dim >= 2)
				}),
				zaxis: Object.assign({}, axisCommon, {
					title: {
						text: (dim >= 3 ? "d\u2082" : ""),
						font: { size: 9, color: theme.axisText }
					},
					showticklabels: (dim >= 3)
				})
			};

			layout.annotations.push({
				text: "<b>" + st.name + "</b>",
				x: xMid, y: y1 - 0.004,
				xanchor: "center", yanchor: "bottom",
				font: { size: 11.5, color: theme.textAccent },
				showarrow: false
			});
			layout.annotations.push({
				text: dim + "D",
				x: xMid, y: y1 - 0.030,
				xanchor: "center", yanchor: "bottom",
				font: { size: 9, color: theme.axisText },
				showarrow: false
			});

			if (col < inRow - 1) {
				layout.annotations.push({
					text: "\u276F",
					x: x1 + gap * 0.5, y: (y0 + y1) / 2,
					xanchor: "center", yanchor: "middle",
					font: { size: 15, color: theme.arrowColor },
					showarrow: false
				});
			}
		}

		return layout;
	}

	// ============================================================
	// KAMERA / INTERAKTION
	// ============================================================

	function _saveCameras() {
		if (!_state.plotDiv || !_state.plotDiv._fullLayout) return;
		try {
			var fl = _state.plotDiv._fullLayout;
			var keys = Object.keys(fl);
			for (var i = 0; i < keys.length; i++) {
				var k = keys[i];
				if (k !== "scene" && k.indexOf("scene") !== 0) continue;
				var sc = fl[k];
				if (!sc) continue;
				var cam = null;
				try {
					if (sc._scene && typeof sc._scene.getCamera === "function") {
						cam = sc._scene.getCamera();
					} else if (sc.camera) {
						cam = JSON.parse(JSON.stringify(sc.camera));
					}
				} catch (e) { cam = null; }
				if (cam) _state.lastCameras[k] = cam;
			}
		} catch (e) {
			_log("Kameras konnten nicht gesichert werden: " + e);
		}
	}

	function _clearInteractionTimer() {
		if (_state.interactionTimer) {
			clearTimeout(_state.interactionTimer);
			_state.interactionTimer = null;
		}
	}

	function _onInteractionStart() {
		_state.userInteracting = true;
		_clearInteractionTimer();
		_saveCameras();
		_state.interactionTimer = setTimeout(_onInteractionEnd, 420);
	}

	function _onInteractionEnd() {
		_state.userInteracting = false;
		_saveCameras();
		if (_state.pendingRender) {
			_state.pendingRender = false;
			_scheduleRender();
		}
	}

	function _updateCamerasFromRelayout(ev) {
		if (!ev) return;
		var ks = Object.keys(ev);
		for (var i = 0; i < ks.length; i++) {
			var m = ks[i].match(/^(scene\d*)\.camera$/);
			if (m) _state.lastCameras[m[1]] = ev[ks[i]];
		}
	}

	function _attachInteractionListeners() {
		var div = _state.plotDiv;
		if (!div) return;

		try {
			div.addEventListener("mousedown",  _onInteractionStart, { passive: true });
			div.addEventListener("touchstart", _onInteractionStart, { passive: true });
			div.addEventListener("wheel",      _onInteractionStart, { passive: true });
			div.addEventListener("wheel", function (e) { e.stopPropagation(); },
				{ passive: true });
			div.addEventListener("touchmove", function (e) { e.stopPropagation(); },
				{ passive: false });
		} catch (e) {
			_warn("Konnte Interaktions-Listener nicht anhängen: " + e);
		}

		try {
			if (typeof div.on === "function") {
				div.on("plotly_relayouting", function (ev) {
					_state.userInteracting = true;
					_clearInteractionTimer();
					_state.interactionTimer = setTimeout(_onInteractionEnd, 320);
					_updateCamerasFromRelayout(ev);
				});
				div.on("plotly_relayout", function () { _saveCameras(); });
			}
		} catch (e) { /* ignore */ }
	}

	// ============================================================
	// SICHTBARKEIT
	// ============================================================

	function _isVisibleNow() {
		if (!_state.container) return false;
		try {
			if (_state.container.offsetWidth <= 0) return false;
			if (_state.container.offsetHeight <= 0) return false;
			var r = _state.container.getBoundingClientRect();
			var vh = window.innerHeight || document.documentElement.clientHeight;
			var vw = window.innerWidth  || document.documentElement.clientWidth;
			return (r.top < vh && r.bottom > 0 && r.left < vw && r.right > 0);
		} catch (e) { return false; }
	}

	function _setupObserver() {
		if (_state.observer || !_state.container) return;
		if (typeof IntersectionObserver === "undefined") {
			_state.isVisible = true;
			return;
		}
		try {
			_state.observer = new IntersectionObserver(function (entries) {
				for (var i = 0; i < entries.length; i++) {
					var wasVisible = _state.isVisible;
					_state.isVisible = entries[i].isIntersecting;
					if (!_state.isVisible) continue;
					if (!wasVisible) _state.pendingRender = true;
					if (_state.pendingRender || _state.dataDirty) {
						_state.pendingRender = false;
						_scheduleRender();
					}
				}
			}, { threshold: 0.03 });
			_state.observer.observe(_state.container);
		} catch (e) {
			_warn("IntersectionObserver fehlgeschlagen: " + e);
			_state.isVisible = true;
		}
	}

	function _setupResizeObserver() {
		if (_state.resizeObserver || !_state.container) return;
		if (typeof ResizeObserver === "undefined") return;
		try {
			_state.resizeObserver = new ResizeObserver(function () {
				if (!_hasPlotly() || !_state.plotDiv) return;
				if (!_state.plotlyInitialized) return;
				if (!_isVisibleNow()) return;
				try { global.Plotly.Plots.resize(_state.plotDiv); }
				catch (e) { /* ignore */ }
			});
			_state.resizeObserver.observe(_state.container);
		} catch (e) { /* ignore */ }
	}

	// ============================================================
	// PLOTLY LADEN
	// ============================================================

	function _ensurePlotly(cb) {
		if (_hasPlotly()) { cb(); return; }
		if (_state.plotlyLoading) {
			var tries = 0;
			var iv = setInterval(function () {
				tries++;
				if (_hasPlotly()) { clearInterval(iv); cb(); }
				else if (tries > 200) { clearInterval(iv); _error("Plotly-Ladezeit überschritten"); }
			}, 50);
			return;
		}
		_state.plotlyLoading = true;
		var tries2 = 0;
		var iv2 = setInterval(function () {
			tries2++;
			if (_hasPlotly()) { clearInterval(iv2); _state.plotlyLoading = false; cb(); }
			else if (tries2 > 200) { clearInterval(iv2); _state.plotlyLoading = false; _error("Plotly-Ladezeit überschritten"); }
		}, 50);
	}

	// ============================================================
	// DEAKTIVIERUNG
	// ============================================================

	function _deactivate(reasonKey, fallbackMsg) {
		_state.deactivated = true;
		_state.deactivationKey = reasonKey;
		_state.deactivationMsg = _tr(reasonKey, fallbackMsg);

		if (_state.plotDiv) {
			_state.plotDiv.style.display = "none";
		}
		if (_state.infoDiv) {
			var theme = _theme();
			_state.infoDiv.style.display = "block";
			_state.infoDiv.style.color = theme.infoText;
			_state.infoDiv.innerHTML =
				"<b>" + _tr("origami_title", "Origami-Visualizer") + "</b><br>" +
				_state.deactivationMsg;
		}
		_log("deaktiviert: " + _state.deactivationMsg);
	}

	function _reactivate() {
		if (!_state.deactivated) return;
		_state.deactivated = false;
		_state.deactivationMsg = "";
		if (_state.plotDiv) _state.plotDiv.style.display = "";
		if (_state.infoDiv)  _state.infoDiv.style.display = "none";
		_state.lastFingerprint = null;
		_state.lastViewHash = null;
	}

	// ============================================================
	// RENDER
	// ============================================================

	function _scheduleRender() {
		if (_state.rafId) return;
		if (typeof requestAnimationFrame !== "function") {
			_ofRender();
			return;
		}
		_state.rafId = requestAnimationFrame(function () {
			_state.rafId = null;
			_ofRender();
		});
	}

	function _ofRender() {
		if (!_state.initialized || !_state.plotDiv) return;
		if (!_state.plotDiv.parentNode) {
			_log("plotDiv nicht im DOM, Render abgebrochen");
			return;
		}
		if (!_hasPlotly()) {
			_ensurePlotly(_scheduleRender);
			return;
		}
		if (_state.userInteracting) {
			_state.pendingRender = true;
			return;
		}
		if (!_isVisibleNow()) {
			_state.pendingRender = true;
			return;
		}

		var now = (typeof performance !== "undefined" && performance.now)
			? performance.now() : Date.now();
		var training = false;
		try { training = !!global.started_training; } catch (e) { training = false; }
		if (training && (now - _lastRebuildTime) < _state.config.throttleMs) {
			_state.pendingRender = true;
			setTimeout(_scheduleRender, _state.config.throttleMs);
			return;
		}

		if (!_hasTF()) {
			_deactivate("origami_no_tf", "TensorFlow.js ist nicht verfügbar.");
			return;
		}
		if (!_hasModel()) {
			_deactivate("origami_no_model", "Kein Modell vorhanden.");
			return;
		}

		if (_state.modelRef !== global.model) {
			_state.modelRef = global.model;
			_state.lastFingerprint = null;
			_state.lastChainSignature = null;
			_state.dataDirty = true;
			if (_state.cachedX) { _safeDispose(_state.cachedX); _state.cachedX = null; _state.cachedXHash = null; }
		}

		var built = _buildChain();
		var pairs = built.pairs;

		if (pairs.length && !_chainAlive(pairs)) {
			_log("Paar-Kette enthält disposed Layer, übersprungen");
			return;
		}

		if (!pairs.length) {
			if (built.reason === "no_adjacent_low_dim") {
				_deactivate("origami_no_adjacent",
					"Keine zwei BENACHBARTEN Layer mit \u2264 3 Dimensionen.");
			} else if (built.reason === "no_low_dim_layers") {
				_deactivate("origami_no_low_dim",
					"Kein Layer hat 1\u20133 Ausgabedimensionen. " +
					"Baue ein Dense(2) oder Dense(3) ein.");
			} else {
				_deactivate("origami_no_layers", "Keine plotbaren Layer gefunden.");
			}
			return;
		}

		var sig = _chainSignature(pairs);
		if (sig !== _state.lastChainSignature) {
			_log("Paar-Kette geändert: " + sig);
			_state.lastChainSignature = sig;
			_state.lastFingerprint = null;
			if (_state.deactivated) _reactivate();
			if (_state.plotlyInitialized) {
				try { global.Plotly.purge(_state.plotDiv); } catch (e) { /* ignore */ }
				_state.plotlyInitialized = false;
			}
		} else if (_state.deactivated) {
			_reactivate();
		}

		if (!_prepareData()) {
			_deactivate("origami_no_data",
				"Keine Trainingsdaten verfügbar.");
			return;
		}

		var fp = _modelFingerprint(pairs);
		var vh = _viewHash();
		var rev = _currentDataRevision();

		var changed = _state.dataDirty
			|| (fp !== _state.lastFingerprint)
			|| (vh !== _state.lastViewHash)
			|| (rev !== _state.lastDataRevision);

		if (!changed) {
			_log("keine Änderung, Render übersprungen");
			return;
		}

		var results = _computePairs(pairs);
		if (!results) {
			_state.consecutiveErrors++;
			if (_state.consecutiveErrors > 4) {
				_deactivate("origami_activation_failed",
					"Aktivierungen konnten mehrfach nicht berechnet werden.");
			} else {
				_warn("Aktivierungen fehlgeschlagen (Versuch " +
				      _state.consecutiveErrors + "/4)");
			}
			return;
		}
		_state.consecutiveErrors = 0;

		var theme = _theme();
		var traces = [];
		var legendDone = false;

		var states = [];

		for (var i = 0; i < results.length; i++) {
			var r = results[i];
			if (!r) { states.push(null); continue; }

			if (i === 0) {
				states.push({
					node: r.pair.inNode,
					act: r.actIn,
					bounds: r.boundsIn,
					grid: r.grid,
					gridAct: r.gridIn,
					distortion: r.distortion,
					cutLayer: r.pair.layer,
					dim: r.pair.dimIn,
					name: r.pair.inNode.name || ("In " + r.pair.dimIn + "D")
				});
			}

			var nextCut = (i + 1 < results.length && results[i + 1])
				? results[i + 1].pair.layer : null;
			states.push({
				node: r.pair.outNode,
				act: r.actOut,
				bounds: r.boundsOut,
				grid: r.grid,
				gridAct: r.gridOut,
				distortion: r.distortion,
				cutLayer: nextCut,
				dim: r.pair.dimOut,
				name: r.pair.outNode.name || ("Out " + r.pair.dimOut + "D")
			});
		}

		for (var s = 0; s < states.length; s++) {
			var st = states[s];
			if (!st) continue;

			var showLegend = !legendDone;
			var sceneName = _sceneNameFor(s);

			var tr = _buildSpaceTraces({
				node:       st.node,
				act:        st.act,
				bounds:     st.bounds,
				grid:       st.grid,
				gridAct:    st.gridAct,
				distortion: st.distortion,
				cutLayer:   st.cutLayer,
				dim:        st.dim,
				sceneName:  sceneName,
				theme:      theme,
				showLegend: showLegend,
				isOutput:   true
			});

			if (tr.length) legendDone = true;
			for (var t = 0; t < tr.length; t++) traces.push(tr[t]);
		}

		if (!traces.length) {
			_deactivate("origami_no_traces", "Keine darstellbaren Daten erzeugt.");
			return;
		}

		var layout = _buildLayoutFromStates(states, theme);

		var plotConfig = {
			responsive: true,
			displaylogo: false,
			displayModeBar: true,
			modeBarButtonsToRemove: ["sendDataToCloud", "toImage"],
			scrollZoom: true
		};

		_saveCameras();

		traces = _sanitizeTraces(traces);

		if (_state.plotDiv) _state.plotDiv.style.display = "";
		if (_state.infoDiv)  _state.infoDiv.style.display = "none";

		try {
			if (!_state.plotlyInitialized) {
				global.Plotly.newPlot(_state.plotDiv, traces, layout, plotConfig)
					.then(function () {
						_state.plotlyInitialized = true;
						_state.lastFingerprint   = fp;
						_state.lastViewHash      = vh;
						_state.lastDataRevision  = rev;
						_state.dataDirty         = false;
						_lastRebuildTime         = now;
						_attachInteractionListeners();
						_saveCameras();
						_log("Plot neu erstellt (" + results.length + " Paare, " +
						     _state.cachedSampleCount + " Punkte)");
					})
					.catch(function (e) {
						_error("Plotly.newPlot fehlgeschlagen: " + e);
						_state.plotlyInitialized = false;
					});
			} else {
				global.Plotly.react(_state.plotDiv, traces, layout, plotConfig)
					.then(function () {
						_state.lastFingerprint  = fp;
						_state.lastViewHash     = vh;
						_state.lastDataRevision = rev;
						_state.dataDirty        = false;
						_lastRebuildTime        = now;
						_saveCameras();
					})
					.catch(function (e) {
						_error("Plotly.react fehlgeschlagen: " + e);
						_state.plotlyInitialized = false;
					});
			}
		} catch (e) {
			_error("Rendern fehlgeschlagen: " + e);
			_state.plotlyInitialized = false;
		}
	}


	// ============================================================
	// DOM-AUFBAU
	// ============================================================

	function _resolveParent(divOrId) {
		if (typeof divOrId === "string" && divOrId !== "") {
			var byId = document.getElementById(divOrId);
			if (byId) {
				_state.parentId = divOrId;
				return byId;
			}
			_warn("Div mit ID '" + divOrId + "' nicht gefunden, hänge an <body>");
			return null;
		}

		if (divOrId && typeof HTMLElement !== "undefined" &&
		    divOrId instanceof HTMLElement) {
			_state.parentElement = divOrId;
			return divOrId;
		}

		try {
			if (divOrId && typeof divOrId === "object" &&
			    typeof divOrId.length === "number" && divOrId.length > 0 &&
			    divOrId[0] && divOrId[0].nodeType === 1) {
				_state.parentElement = divOrId[0];
				return divOrId[0];
			}
		} catch (e) { /* ignore */ }

		try {
			if (typeof divOrId === "string" && typeof global.$ === "function") {
				var $el = global.$(divOrId);
				if ($el && $el.length && $el[0] && $el[0].nodeType === 1) {
					_state.parentElement = $el[0];
					return $el[0];
				}
			}
		} catch (e) { /* ignore */ }

		return null;
	}

	function _buttonDefs() {
		return [
			["\u21BA " + _tr("origami_reset_view", "Ansicht"),
			 _tr("origami_reset_view_tip",
			  "Setzt alle Kameras auf die Standardansicht zurück.")],
			["\u27F3 " + _tr("origami_force", "Neu zeichnen"),
			 _tr("origami_force_tip", "Erzwingt eine Neuberechnung.")],
			["\u2702 " + _tr("origami_toggle_cuts", "Schnitte"),
			 _tr("origami_toggle_cuts_tip",
			  "Zeigt/versteckt die ReLU-Hyperplanes.")],
			["\u25A3 " + _tr("origami_toggle_box", "Rahmen"),
			 _tr("origami_toggle_box_tip",
			  "Zeigt/versteckt die Begrenzung des Unterraums.")],
			["\u229E " + _tr("origami_toggle_grid", "Gitter"),
			 _tr("origami_toggle_grid_tip", "Zeigt/versteckt das Raumgitter.")],
			["\u25E7 " + _tr("origami_toggle_surface", "Fläche"),
			 _tr("origami_toggle_surface_tip",
			  "Zeigt die gefaltete Fläche als Körper (2D).")]
		];
	}

	function _applyStaticTexts() {
		if (!_state.container) return;
		var theme = _theme();

		var title = document.getElementById(TITLE_ID);
		if (title) {
			title.style.color = theme.textAccent;
			title.innerHTML = "\u2726 " +
				_tr("origami_title_paired",
					"Origami: Faltung der Datenmannigfaltigkeit");
		}

		var btnRow = document.getElementById(BTNROW_ID);
		if (btnRow) {
			var defs = _buttonDefs();
			var btns = btnRow.querySelectorAll("button");
			for (var i = 0; i < btns.length && i < defs.length; i++) {
				btns[i].textContent = defs[i][0];
				btns[i].title = defs[i][1];
				btns[i].style.background = theme.btnBg;
				btns[i].style.color = theme.btnText;
			}
		}

		var foot = document.getElementById(FOOT_ID);
		if (foot) {
			foot.style.color = theme.infoText;
			foot.innerHTML =
				"<b>" + _tr("origami_legend", "Lesehilfe") + ":</b> " +
				_tr("origami_legend_text",
					"Unten: Raum VOR dem Layer. Oben: NACH dem Layer. " +
					"Das Gitter zeigt die Faltung. Blau=gestaucht, Rot=gestreckt. " +
					"Orangene Linien unten = Faltkanten.");
		}

		if (_state.infoDiv) {
			_state.infoDiv.style.color = theme.infoText;
			if (_state.deactivated &&
			    _state.infoDiv.style.display !== "none") {
				_state.infoDiv.innerHTML =
					"<b>" + _tr("origami_title", "Origami-Visualizer") + "</b><br>" +
					_tr(_state.deactivationKey, _state.deactivationMsg);
			}
		}
	}

	function _buildDOM(divOrId) {
		var existing = document.getElementById(SINGLETON_ID);
		if (existing && existing.parentNode) {
			_state.container   = existing;
			_state.plotDiv     = document.getElementById(PLOT_ID);
			_state.infoDiv     = document.getElementById(INFO_ID);
			_state.controlsDiv = document.getElementById(CTRL_ID);
			_styleContainer();
			return existing;
		}

		var parent = _resolveParent(divOrId);
		var theme  = _theme();

		var container = document.createElement("div");
		container.id = SINGLETON_ID;
		_state.container = container;
		_styleContainer();

		var head = document.createElement("div");
		head.style.cssText =
			"display:flex;align-items:center;justify-content:space-between;" +
			"gap:10px;flex-wrap:wrap;margin-bottom:8px;";

		var title = document.createElement("div");
		title.id = TITLE_ID;
		title.style.cssText =
			"font-weight:700;font-size:13px;letter-spacing:0.3px;color:" +
			theme.textAccent + ";";
		title.innerHTML = "\u2726 " +
			_tr("origami_title_paired",
				"Origami: Faltung der Datenmannigfaltigkeit");
		head.appendChild(title);

		var btnRow = document.createElement("div");
		btnRow.id = BTNROW_ID;
		btnRow.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;";

		function _ofMkBtn(def, onClick) {
			var b = document.createElement("button");
			b.type = "button";
			b.textContent = def[0];
			b.title = def[1];
			b.style.cssText =
				"padding:6px 11px;border:none;border-radius:6px;cursor:pointer;" +
				"font-weight:600;font-size:11px;background:" + theme.btnBg +
				";color:" + theme.btnText + ";";
			b.addEventListener("click", function (e) {
				e.preventDefault();
				try { onClick(); } catch (err) { _error("Button-Handler: " + err); }
			});
			btnRow.appendChild(b);
			return b;
		}

		var _btnDefs = _buttonDefs();
		_ofMkBtn(_btnDefs[0], function () {
			_state.lastCameras = {};
			_state.lastFingerprint = null;
			_state.lastViewHash = null;
			if (_state.plotlyInitialized && _hasPlotly() && _state.plotDiv) {
				try { global.Plotly.purge(_state.plotDiv); } catch (e) { /* ignore */ }
				_state.plotlyInitialized = false;
			}
			_scheduleRender();
		});

		_ofMkBtn(_btnDefs[1], function () { forceUpdate(); });

		_ofMkBtn(_btnDefs[2], function () {
			_state.config.showReluCuts = !_state.config.showReluCuts;
			_scheduleRender();
		});

		_ofMkBtn(_btnDefs[3], function () {
			_state.config.showBoundingBox = !_state.config.showBoundingBox;
			_scheduleRender();
		});

		_ofMkBtn(_btnDefs[4], function () {
			_state.config.showGrid = !_state.config.showGrid;
			_scheduleRender();
		});

		_ofMkBtn(_btnDefs[5], function () {
			_state.config.showGridSurface = !_state.config.showGridSurface;
			_scheduleRender();
		});

		head.appendChild(btnRow);
		container.appendChild(head);

		var info = document.createElement("div");
		info.id = INFO_ID;
		info.style.cssText =
			"display:none;padding:18px 14px;text-align:center;font-size:12px;" +
			"line-height:1.6;color:" + theme.infoText + ";";
		container.appendChild(info);
		_state.infoDiv = info;

		var plot = document.createElement("div");
		plot.id = PLOT_ID;
		plot.style.cssText =
			"width:100%;min-height:500px;" +
			"border-radius:8px;overflow:hidden;";
		container.appendChild(plot);
		_state.plotDiv = plot;

		var foot = document.createElement("div");
		foot.id = FOOT_ID;
		foot.style.cssText =
			"margin-top:8px;font-size:10.5px;line-height:1.6;opacity:0.75;color:" +
			theme.infoText + ";";
		foot.innerHTML =
			"<b>" + _tr("origami_legend", "Lesehilfe") + ":</b> " +
			_tr("origami_legend_text",
				"Unten: Raum VOR dem Layer. Oben: NACH dem Layer. " +
				"Das Gitter zeigt die Faltung. Blau=gestaucht, Rot=gestreckt. " +
				"Orangene Linien unten = Faltkanten.");
		container.appendChild(foot);

		try {
			if (parent) {
				parent.appendChild(container);
			} else {
				document.body.appendChild(container);
			}
		} catch (e) {
			_error("Konnte Container nicht in den DOM einhängen: " + e);
			try { document.body.appendChild(container); } catch (e2) { /* give up */ }
		}

		return container;
	}

	function _styleContainer() {
		if (!_state.container) return;
		var theme = _theme();
		_state.container.style.cssText = [
			"margin:20px 0",
			"padding:14px 16px",
			"border-radius:12px",
			"background:" + theme.panelBg,
			"border:1px solid " + theme.panelBorder,
			"box-shadow:" + theme.panelShadow,
			"font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif",
			"font-size:12px",
			"color:" + theme.text,
			"box-sizing:border-box",
			"contain:layout style"
		].join(";");
	}

	// ============================================================
	// DARK-MODE-WATCHER
	// ============================================================

	function _startDarkModeWatcher() {
		if (_state.darkModeTimer) return;
		_state.lastDarkMode = _theme().dark;
		try { _state.lastLang = (typeof lang !== "undefined") ? (lang || "") : ""; }
		catch (e) { _state.lastLang = ""; }
		_state.darkModeTimer = setInterval(function () {
			if (!_state.initialized) return;

			var cur = _theme().dark;
			var curLang = "";
			try { curLang = (typeof lang !== "undefined") ? (lang || "") : ""; }
			catch (e) { curLang = ""; }
			if (cur !== _state.lastDarkMode || curLang !== _state.lastLang) {
				_state.lastDarkMode = cur;
				_state.lastLang = curLang;
				_styleContainer();
				_applyStaticTexts();
				_state.lastViewHash = null;
				if (_state.plotlyInitialized && _hasPlotly() && _state.plotDiv) {
					_scheduleRender();
				}
				return;
			}

			if (_state.pendingRender && _isVisibleNow() && !_state.userInteracting) {
				_state.pendingRender = false;
				_scheduleRender();
			}
		}, 350);
	}

	// ============================================================
	// PUBLIC: init
	// ============================================================

	function init(divOrId) {
		try {
			_buildDOM(divOrId);
		} catch (e) {
			_error("init() fehlgeschlagen: " + e);
			return OrigamiFolds;
		}

		if (!_state.container) {
			_error("Kein Container vorhanden, Abbruch.");
			return OrigamiFolds;
		}

		_state.initialized = true;
		_state.active = true;

		_setupObserver();
		_setupResizeObserver();
		_startDarkModeWatcher();

		if (_isVisibleNow()) _state.isVisible = true;

		_ensurePlotly(function () {
			_state.pendingRender = true;
			_scheduleRender();
		});

		_log("initialisiert (Container: " + SINGLETON_ID + ")");
		return OrigamiFolds;
	}

	// ============================================================
	// PUBLIC: update
	// ============================================================

	function update() {
		if (!_state.initialized) {
			_log("update() vor init() – initialisiere automatisch");
			var tabPlot = document.getElementById("origami_folds_plot");
			init(tabPlot || undefined);
			return OrigamiFolds;
		}

		if (!_state.container || !_state.container.parentNode) {
			_log("Container nicht mehr im DOM, baue neu auf");
			_state.initialized = false;
			_state.plotlyInitialized = false;
			_state.observer = null;
			_state.resizeObserver = null;
			var target = _state.parentId || _state.parentElement || null;
			init(target);
			return OrigamiFolds;
		}

		_state.dataDirty = true;

		if (!_isVisibleNow()) {
			_state.pendingRender = true;
			return OrigamiFolds;
		}

		_scheduleRender();
		return OrigamiFolds;
	}

	function forceUpdate() {
		if (!_state.initialized) return init();
		_state.dataDirty        = true;
		_state.lastFingerprint  = null;
		_state.lastViewHash     = null;
		_state.lastDataRevision = -1;
		_state.cachedXHash      = null;
		_state.consecutiveErrors = 0;
		if (_state.deactivated) _reactivate();
		_state.pendingRender = true;
		_scheduleRender();
		return OrigamiFolds;
	}

	// ============================================================
	// PUBLIC: destroy / config
	// ============================================================

	function destroy() {
		try { if (_state.rafId) cancelAnimationFrame(_state.rafId); } catch (e) { /* ignore */ }
		_state.rafId = null;

		_clearInteractionTimer();

		if (_state.darkModeTimer) { clearInterval(_state.darkModeTimer); _state.darkModeTimer = null; }
		if (_state.observer)      { try { _state.observer.disconnect(); } catch (e) {} _state.observer = null; }
		if (_state.resizeObserver){ try { _state.resizeObserver.disconnect(); } catch (e) {} _state.resizeObserver = null; }

		if (_state.plotDiv && _hasPlotly()) {
			try { global.Plotly.purge(_state.plotDiv); } catch (e) { /* ignore */ }
		}

		_safeDispose(_state.cachedX);
		_state.cachedX = null;

		if (_state.container && _state.container.parentNode) {
			try { _state.container.parentNode.removeChild(_state.container); }
			catch (e) { /* ignore */ }
		}

		_state.container   = null;
		_state.plotDiv     = null;
		_state.infoDiv     = null;
		_state.controlsDiv = null;
		_state.initialized = false;
		_state.active      = false;
		_state.plotlyInitialized = false;
		_state.lastCameras = {};
		_state.lastChainSignature = null;
		_state.modelRef = null;

		_log("zerstört");
		return OrigamiFolds;
	}

	function getConfig() {
		try { return JSON.parse(JSON.stringify(_state.config)); }
		catch (e) { return {}; }
	}

	function setConfig(cfg) {
		if (!cfg || typeof cfg !== "object") return OrigamiFolds;
		var keys = Object.keys(cfg);
		var touchedData = false;
		for (var i = 0; i < keys.length; i++) {
			var k = keys[i];
			if (!Object.prototype.hasOwnProperty.call(_state.config, k)) {
				_warn("Unbekannte Config-Option ignoriert: " + k);
				continue;
			}
			var v = cfg[k];
			var expected = typeof _state.config[k];
			if (typeof v !== expected) {
				_warn("Config '" + k + "' erwartet " + expected + ", bekam " +
				      typeof v + " – ignoriert");
				continue;
			}
			if (expected === "number" && !_isFiniteNum(v)) {
				_warn("Config '" + k + "' ist keine finite Zahl – ignoriert");
				continue;
			}
			if (_state.config[k] !== v) {
				_state.config[k] = v;
				if (k === "maxPoints") touchedData = true;
			}
		}
		if (touchedData) _state.cachedXHash = null;
		_state.pendingRender = true;
		_scheduleRender();
		return OrigamiFolds;
	}

	// ============================================================
	// EXPORT
	// ============================================================

	var OrigamiFolds = {
		init:        init,
		update:      update,
		forceUpdate: forceUpdate,
		destroy:     destroy,
		getConfig:   getConfig,
		setConfig:   setConfig,
		_state:               _state,
		_buildChain:          _buildChain,
		_extractHyperplanes:  _extractHyperplanes,
		_computePairs:        _computePairs,
		_makeGrid:            _makeGrid,
		_gridDistortion:      _gridDistortion
	};

	if (typeof global !== "undefined") {
		global.OrigamiFolds = OrigamiFolds;
	}

	return OrigamiFolds;

})(typeof window !== "undefined" ? window : this);

// ============================================================
// KOMFORT-WRAPPER
// ============================================================

function create_origami_folds(divOrId) {
	try {
		return OrigamiFolds.init(divOrId);
	} catch (e) {
		if (typeof err === "function") {
			err("[origami_folds] create_origami_folds fehlgeschlagen: " + e);
		} else {
			console.error("[origami_folds] create_origami_folds fehlgeschlagen:", e);
		}
	}
}

function _origamiDirectShapeCheck() {
	try {
		var m = (typeof model !== "undefined") ? model : null;
		if (!m || !m.layers || !m.layers.length) return false;
		var layers = m.layers;
		var anyDense = false;
		for (var i = 0; i < layers.length; i++) {
			var l = layers[i];
			var cls = "";
			try { cls = l.getClassName ? l.getClassName() : ""; } catch (e) { cls = ""; }
			var lc = String(cls).toLowerCase();
			if (lc === "dense") {
				anyDense = true;
				var outS = null;
				try { outS = l.outputShape; } catch (e) { outS = null; }
				if (!outS || !outS.length) return false;
				var outD = outS[outS.length - 1];
				if (typeof outD !== "number" || !isFinite(outD) || outD < 1 || outD > 3) return false;
			} else if (lc === "inputlayer" || lc === "input") {
				var inS = null;
				try { inS = l.outputShape; } catch (e) { inS = null; }
				if (!inS || !inS.length) {
					try { inS = l.batchInputShape; } catch (e) { inS = null; }
				}
				if (!inS || !inS.length) return false;
				var inD = inS[inS.length - 1];
				if (typeof inD !== "number" || !isFinite(inD) || inD < 1 || inD > 3) return false;
			} else if (lc === "flatten" || lc === "reshape" || lc === "dropout") {
				continue;
			} else {
				return false;
			}
		}
		if (!anyDense) return false;
		if (m.inputs && m.inputs.length) {
			var is = m.inputs[0].shape;
			if (is && is.length >= 2) {
				var fd = is[is.length - 1];
				if (typeof fd === "number" && isFinite(fd) && (fd < 1 || fd > 3)) return false;
			}
		}
		return true;
	} catch (e) {
		return false;
	}
}

function _origamiShapesCompatible() {
	try {
		if (typeof OrigamiFolds === "undefined" || !OrigamiFolds._buildChain) return _origamiDirectShapeCheck();
		var chain = OrigamiFolds._buildChain();
		if (chain && chain.pairs && chain.pairs.length) return true;
		// Guardrail: _buildChain might fail due to missing TF/model guards;
		// fall back to direct shape check
		return _origamiDirectShapeCheck();
	} catch (e) {
		return _origamiDirectShapeCheck();
	}
}

var _origami_tab_state = {
	visible: false,
	retryCount: 0,
	maxRetries: 20,
	retryTimer: null
};

function _origamiApplyTabVisibility(ok) {
	// Guardrail R4-1: try multiple DOM lookup strategies
	var li = null;
	var label = document.getElementById("origami_folds_tab_label");
	if (label) {
		li = label.parentElement;
		if (!li || li.tagName !== "LI") {
			li = label.parentNode;
		}
	}
	if (!li) {
		li = document.querySelector("li[data-origami-tab]");
	}
	if (!li) {
		// Guardrail R4-3: fail-open — show the tab
		return;
	}
	// Guardrail R5-1: use !important to beat jQuery UI
	li.style.setProperty("display", ok ? "" : "none", ok ? "" : "important");
	if (ok) {
		li.style.removeProperty("display");
	}
	// Guardrail R5-4: re-apply after jQuery UI tabs might re-init
	setTimeout(function () {
		try {
			if (ok && li.style.display === "none") {
				li.style.removeProperty("display");
			}
		} catch (e) { /* silent */ }
	}, 200);
}

function check_origami_folds_tab() {
	try {
		var ok = _origamiShapesCompatible();
		_origamiApplyTabVisibility(ok);

		if (ok && !_origami_tab_state.visible) {
			_origami_tab_state.visible = true;
			_origami_tab_state.retryCount = 0;
			if (_origami_tab_state.retryTimer) {
				clearInterval(_origami_tab_state.retryTimer);
				_origami_tab_state.retryTimer = null;
			}
		}
		if (!ok && _origami_tab_state.visible) {
			_origami_tab_state.visible = false;
			try { OrigamiFolds.destroy(); } catch (e) { /* silent */ }
		}
		// Guardrail R1-1: if not compatible yet, retry a few times
		// (model might still be compiling)
		if (!ok && _origami_tab_state.retryCount < _origami_tab_state.maxRetries) {
			if (!_origami_tab_state.retryTimer) {
				_origami_tab_state.retryTimer = setInterval(function () {
					_origami_tab_state.retryCount++;
					var retryOk = _origamiShapesCompatible();
					if (retryOk) {
						_origamiApplyTabVisibility(true);
						_origami_tab_state.visible = true;
						_origami_tab_state.retryCount = 0;
						clearInterval(_origami_tab_state.retryTimer);
						_origami_tab_state.retryTimer = null;
					} else if (_origami_tab_state.retryCount >= _origami_tab_state.maxRetries) {
						clearInterval(_origami_tab_state.retryTimer);
						_origami_tab_state.retryTimer = null;
					}
				}, 500);
			}
		}
	} catch (e) { /* silent — never break the app */ }
}

// Guardrail R3-2: secondary hook on window load
if (typeof window !== "undefined") {
	window.addEventListener("load", function () {
		try { check_origami_folds_tab(); } catch (e) { /* silent */ }
	});
	// Guardrail R3-4: DOMContentLoaded fallback
	document.addEventListener("DOMContentLoaded", function () {
		try { check_origami_folds_tab(); } catch (e) { /* silent */ }
	});
	// Guardrail R3-5: explicit window export
	window.check_origami_folds_tab = check_origami_folds_tab;
}

function update_origami_folds() {
	try {
		check_origami_folds_tab();
		if (!_origamiShapesCompatible()) return;
		var plotDiv = document.getElementById("origami_folds_plot");
		if (plotDiv && !_state_initialised_in_tab) {
			OrigamiFolds.init(plotDiv);
			_state_initialised_in_tab = true;
		}
		return OrigamiFolds.update();
	} catch (e) {
		if (typeof wrn === "function") {
			wrn("[origami_folds] update_origami_folds fehlgeschlagen: " + e);
		} else {
			console.warn("[origami_folds] update_origami_folds fehlgeschlagen:", e);
		}
	}
}
var _state_initialised_in_tab = false;

// Kein Auto-Init: update() initialisiert automatisch beim ersten
// Trainings-Epoch (document.body ist dann garantiert vorhanden).
//OrigamiFolds.init("origami_container");
//OrigamiFolds.init($("#meinDiv"));
//OrigamiFolds.init(document.getElementById("x"));

