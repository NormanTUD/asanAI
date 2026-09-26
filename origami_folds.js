"use strict";

/**
 * origami_folds.js — Live-Visualisierung der Datenmannigfaltigkeits-Faltung
 *
 * Basiert auf: Keup & Helias, "Origami in N dimensions: How feed-forward
 * networks manufacture linear separability" (arXiv:2203.11355).
 *
 * Zeigt die Kette aller aufeinanderfolgenden Layer mit Aktivierungs-
 * Dimensionalität <= 3 als abgegrenzte Sub-Räume (Linie / Fläche / Würfel)
 * innerhalb eines gemeinsamen 3D-Raums. Datenpunkte werden nach Klasse
 * eingefärbt, sodass das progressive Falten und "Schneiden" der Daten
 * sichtbar wird. Zusätzlich werden die ReLU-Hyperplanes ("Schnittlinien")
 * im Eingangsraum jedes Layers eingezeichnet.
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
 *   OrigamiFolds.update()               // Singleton-Update: prüft selbst, ob
 *                                       // ein Update nötig ist. Aus dem
 *                                       // Trainings-Hook aufrufen.
 *   OrigamiFolds.forceUpdate()          // ignoriert Change-Detection
 *   OrigamiFolds.destroy()              // vollständiges Aufräumen
 *   OrigamiFolds.getConfig() / setConfig({...})
 *
 * ============================================================
 * GLOBALS, DIE GELESEN WERDEN (alle optional / mit Guards)
 * ============================================================
 *   model                 tf.LayersModel  (mit überschriebenem .layers-Getter)
 *   model._allLayers      echte Layer-Liste inkl. Skip-Connections
 *   xy_data_global        {x: tf.Tensor, y: tf.Tensor}
 *   labels                Array<string>
 *   is_classification     boolean
 *   is_dark_mode          boolean
 *   started_training      boolean
 *   lang / language       i18n
 *   tf                    TensorFlow.js
 *   Plotly                Plotly.js (wird bei Bedarf nachgeladen)
 *   cnn3d_data_revision   monotoner Predict-Counter (nur gelesen)
 */

var OrigamiFolds = (function (global) {

	// ============================================================
	// KONSTANTEN
	// ============================================================

	var SINGLETON_ID = "origami_folds_singleton";
	var PLOT_ID      = SINGLETON_ID + "_plot";
	var INFO_ID      = SINGLETON_ID + "_info";
	var CTRL_ID      = SINGLETON_ID + "_controls";
	var LOG_PREFIX   = "[origami_folds]";

	// Aktivierungsfunktionen, die eine echte ReLU-artige Hyperplane-Kante
	// erzeugen (harter Knick bei preactivation == 0).
	var RELU_LIKE = ["relu", "relu6", "leakyrelu", "elu", "selu", "thresholdedrelu"];

	// Aktivierungen mit weichem "Bending" statt scharfer Kante — laut Paper
	// qualitativ gleichwertig, aber die Schnittlinie ist nur approximativ.
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
		deactivated:      false,   // Shapes passen nicht -> Bild deaktiviert
		deactivationMsg:  "",

		plotlyInitialized: false,
		plotlyLoading:     false,

		// Change-Detection
		lastFingerprint:  null,
		lastViewHash:     null,
		lastDataRevision: -1,
		dataDirty:        false,
		pendingRender:    false,

		// Sichtbarkeit
		isVisible:        false,
		observer:         null,
		resizeObserver:   null,

		// Kamera / Interaktion
		lastCameras:      {},     // { "scene": {...}, "scene2": {...} }
		userInteracting:  false,
		interactionTimer: null,
		rafId:            null,

		// Daten-Cache
		cachedX:          null,   // tf.Tensor (Subsample), wir besitzen ihn
		cachedColors:     null,   // Array<string> pro Punkt
		cachedClassIdx:   null,   // Array<number>
		cachedClassNames: null,   // Array<string> (Legende)
		cachedIsRegression: false,
		cachedSampleCount: 0,
		cachedXHash:      null,

		// letzte Layer-Chain (für Shape-Change-Detection)
		lastChainSignature: null,

		lastDarkMode:     null,
		darkModeTimer:    null,

		// Fehler-Backoff
		consecutiveErrors: 0,
		lastErrorMsg:      "",

		config: {
			maxPoints:          2500,   // Subsample-Limit
			pointSize:          2.6,
			pointOpacity:       0.72,
			showReluCuts:       true,
			reluCutLimit:       12,     // max. Hyperplanes pro Layer
			showBoundingBox:    true,
			showSoftFolds:      true,   // auch Sigmoid/Tanh-Kanten zeichnen
			boxPadding:         0.12,   // relativer Rand um die Punktwolke
			maxLayersShown:     8,      // max. Subplots
			subplotHeight:      520,
			minSubplotWidth:    300,
			throttleMs:         450,    // min. Abstand zwischen Rebuilds
			legendMaxClasses:   24,
			smoothUpdates:      true,
			includeInputSpace:  true    // Raum VOR Layer 0 mitzeichnen
		}
	};

	var _lastRebuildTime = 0;

	// ============================================================
	// LOGGING (nutzt deine globalen Helfer, falls vorhanden)
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
			catch (e) { /* isDisposed-Getter fehlerhaft -> Modell trotzdem akzeptieren */ }
			return true;
		} catch (e) { return false; }
	}

	function _layerAlive(layer) {
		if (!layer) return false;
		try {
			if (layer.isDisposed === true) return false;
			return true;
		} catch (e) { return true; }
	}

	function _chainAlive(chain) {
		if (!chain || !chain.length) return false;
		for (var i = 0; i < chain.length; i++) {
			if (!chain[i].isInput && !_layerAlive(chain[i].layer)) return false;
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
				paper:      "#0c0f1c",
				plotBg:     "#0c0f1c",
				text:       "#d8dcea",
				axisText:   "#9aa4c0",
				grid:       "rgba(255,255,255,0.07)",
				zeroline:   "rgba(255,255,255,0.18)",
				boxColor:   "rgba(170,190,255,0.55)",
				cutColor:   "rgba(255,190,90,0.85)",
				softCut:    "rgba(255,190,90,0.35)",
				panelBg:    "linear-gradient(140deg, rgba(26,30,50,0.95), rgba(16,19,34,0.96))",
				panelBorder:"rgba(140,160,230,0.26)",
				panelShadow:"0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
				btnBg:      "linear-gradient(135deg,#4a67b8,#6b7fd8)",
				btnText:    "#ffffff",
				infoText:   "#9aa4c0"
			};
		}
		return {
			dark: false,
			paper:      "#ffffff",
			plotBg:     "#fbfcff",
			text:       "#1a1f30",
			axisText:   "#465072",
			grid:       "rgba(0,0,0,0.07)",
			zeroline:   "rgba(0,0,0,0.20)",
			boxColor:   "rgba(60,80,150,0.6)",
			cutColor:   "rgba(200,90,10,0.9)",
			softCut:    "rgba(200,90,10,0.35)",
			panelBg:    "linear-gradient(140deg, rgba(253,254,255,0.98), rgba(233,238,250,0.98))",
			panelBorder:"rgba(60,80,140,0.2)",
			panelShadow:"0 8px 26px rgba(60,80,140,0.14), inset 0 1px 0 rgba(255,255,255,0.9)",
			btnBg:      "linear-gradient(135deg,#4a67b8,#5f7cc8)",
			btnText:    "#ffffff",
			infoText:   "#465072"
		};
	}

	// ============================================================
	// FARBPALETTEN
	// ============================================================

	// Kräftige, gut unterscheidbare Palette. Die ersten zwei Farben sind
	// bewusst an origami.png angelehnt (Grün außen / Orange innen).
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

	// Viridis-Approximation für Regression
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

	/**
	 * Hasht die Gewichte aller relevanten Layer + die Shape-Kette.
	 * Bei großen Modellen wird mit Stride subsampled, damit das Hashen
	 * nicht selbst zum Bottleneck wird.
	 */
	function _modelFingerprint(chain) {
		var h = 0x811c9dc5;
		h = _fnvFeed(h, "chain:" + (chain ? chain.length : 0) + ":");

		if (!chain) return h >>> 0;

		for (var i = 0; i < chain.length; i++) {
			var node = chain[i];
			h = _fnvFeed(h, "n" + node.layerIdx + ":" + node.dim + ":" +
			                 (node.activation || "-") + ":");
			var layer = node.layer;
			if (!layer) continue;

			try {
				var ws = layer.getWeights ? layer.getWeights() : null;
				if (!ws || !ws.length) { h = _fnvFeed(h, "nw:"); continue; }
				for (var w = 0; w < ws.length; w++) {
					if (_isDisposedTensor(ws[w])) { h = _fnvFeed(h, "disp:"); continue; }
					var d = ws[w].dataSync();
					// Bei sehr großen Tensoren subsamplen, aber immer
					// deterministisch, damit der Hash stabil bleibt.
					var stride = d.length > 4000 ? Math.ceil(d.length / 4000) : 1;
					h = _hashNumbers(d, h, stride);
					h = _fnvFeed(h, "|" + d.length + ";");
				}
			} catch (e) {
				h = _fnvFeed(h, "werr:");
			}
		}
		return h >>> 0;
	}

	function _viewHash() {
		var c = _state.config;
		var parts = [
			"dark=" + (_theme().dark ? 1 : 0),
			"mp=" + c.maxPoints,
			"ps=" + c.pointSize,
			"po=" + c.pointOpacity,
			"rc=" + (c.showReluCuts ? 1 : 0),
			"rl=" + c.reluCutLimit,
			"bb=" + (c.showBoundingBox ? 1 : 0),
			"sf=" + (c.showSoftFolds ? 1 : 0),
			"bp=" + c.boxPadding,
			"ml=" + c.maxLayersShown,
			"sh=" + c.subplotHeight,
			"is=" + (c.includeInputSpace ? 1 : 0)
		];
		return _fnvFeed(0x811c9dc5, parts.join(";"));
	}

	// ============================================================
	// LAYER-CHAIN AUFBAUEN
	// ============================================================

	/**
	 * Liefert alle echten Layer (auch die von Skip-Connections gefilterten),
	 * bevorzugt aber model.layers, weil das die GUI-Reihenfolge ist.
	 */
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

		// Eigenständige Activation-Layer
		try {
			var cn = layer.getClassName ? layer.getClassName().toLowerCase() : "";
			if (cn === "relu" || cn === "leakyrelu" || cn === "elu" ||
			    cn === "thresholdedrelu" || cn === "softmax") {
				return cn;
			}
		} catch (e) { /* fall through */ }

		return null;
	}

	/**
	 * Zahl der Feature-Dimensionen eines Output-Shapes (ohne Batch-Dim).
	 * [null, 3]        -> 3
	 * [null, 4, 4, 8]  -> 128
	 * Rückgabe null bei unbekanntem/ungültigem Shape.
	 */
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
			if (Array.isArray(s) && s.length && Array.isArray(s[0])) {
				// Multi-Output-Layer -> nicht unterstützt
				return null;
			}
			return s || null;
		} catch (e) { return null; }
	}

	
	function _layerInputShape(layer) {
		try {
			var s = layer.inputShape;
			if (Array.isArray(s) && s.length && Array.isArray(s[0])) {
				return null;
			}
			return s || null;
		} catch (e) { return null; }
	}

	/**
	 * Baut die Kette der plotbaren Räume auf.
	 *
	 * Ein "Node" ist ein Aktivierungsraum mit dim ∈ {1,2,3}:
	 *   - Node 0 (optional): der Input-Raum VOR Layer 0
	 *   - Node i: der Output-Raum NACH Layer j
	 *
	 * Ein Node enthält zusätzlich Informationen über den Layer, der IN ihn
	 * hineinführt (fromLayer) und den Layer, der AUS ihm herausführt
	 * (layer / cutLayer) — letzterer liefert die ReLU-Hyperplanes, die in
	 * DIESEM Raum gezeichnet werden.
	 */
	function _buildChain() {
		var chain = [];
		var layers = _getVisibleLayers();

		if (!layers.length) {
			return { chain: [], reason: "no_layers" };
		}

		var cfg = _state.config;

		// ---- Node 0: Input-Raum -------------------------------------
		if (cfg.includeInputSpace) {
			var inShape = null;
			try {
				if (global.model.inputs && global.model.inputs.length) {
					inShape = global.model.inputs[0].shape;
				}
			} catch (e) { inShape = null; }
			if (!inShape) inShape = _layerInputShape(layers[0]);

			var inDim = _featureDim(inShape);
			if (inDim !== null && inDim >= 1 && inDim <= 3) {
				chain.push({
					isInput:    true,
					layerIdx:   -1,
					layer:      null,       // kein Layer erzeugt diesen Raum
					cutLayer:   layers[0],  // Layer 0 schneidet HIER hinein
					cutLayerIdx: 0,
					dim:        inDim,
					shape:      inShape,
					name:       _tr("origami_input_space", "Input"),
					className:  "Input",
					activation: null
				});
			}
		}

		// ---- Nodes für jeden Layer-Output ---------------------------
		for (var i = 0; i < layers.length; i++) {
			var layer = layers[i];
			if (!layer || !_layerAlive(layer)) continue;

			var outShape = _layerOutputShape(layer);
			var dim = _featureDim(outShape);

			if (dim === null) continue;          // unbekanntes Shape -> skip
			if (dim < 1 || dim > 3) continue;    // >3 Dims -> komplett skippen

			var act = _activationNameOfLayer(layer);
			var cls = "";
			try { cls = layer.getClassName ? layer.getClassName() : ""; }
			catch (e) { cls = ""; }

			chain.push({
				isInput:     false,
				layerIdx:    i,
				layer:       layer,
				cutLayer:    (i + 1 < layers.length) ? layers[i + 1] : null,
				cutLayerIdx: (i + 1 < layers.length) ? (i + 1) : -1,
				dim:         dim,
				shape:       outShape,
				name:        (layer.name || (cls + "_" + i)),
				className:   cls,
				activation:  act
			});

			if (chain.length >= cfg.maxLayersShown) break;
		}

		if (!chain.length) {
			return { chain: [], reason: "no_low_dim_layers" };
		}

		return { chain: chain, reason: null };
	}

	function _chainSignature(chain) {
		if (!chain || !chain.length) return "empty";
		var parts = [];
		for (var i = 0; i < chain.length; i++) {
			var n = chain[i];
			parts.push(n.layerIdx + ":" + n.dim + ":" + (n.className || "-"));
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
		// Fallback-Heuristik: Labels vorhanden + y hat 2 Dims
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

	/**
	 * Erzeugt (und cached) das Subsample von X sowie die Klassenzuordnung.
	 * Rückgabe: true bei Erfolg, false sonst.
	 */
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

		// ---- Cache-Check: gleiche Daten wie zuvor? -----------------
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

		// ---- Indizes gleichmäßig samplen (deterministisch) --------
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

		// ---- X subsamplen ----------------------------------------
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

		// ---- Klassen / Farben ableiten ----------------------------
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
					// One-Hot -> argmax
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

		// ---- Farben bauen ----------------------------------------
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
				var nCls = Math.min(maxC + 1, _state.config.legendMaxClasses);
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
			// Keine Klasseninfo -> einfarbig
			colors = new Array(idxs.length);
			for (var k = 0; k < idxs.length; k++) colors[k] = "#159c72";
			classIdx = null;
			classNames = null;
		}

		// ---- alten Cache freigeben, neuen setzen -------------------
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
	// AKTIVIERUNGEN DURCH DIE KETTE SCHICKEN
	// ============================================================

	/**
	 * Holt SymbolicTensor-Outputs für alle Nodes der Kette und macht
	 * einen einzigen Forward-Pass. Fallback: schrittweises layer.apply().
	 *
	 * Rückgabe: Array von Float32Array-artigen 2D-Arrays [[x,y,z], ...]
	 *           oder null bei Fehler.
	 */
	function _computeActivations(chain) {
		if (!chain || !chain.length) return null;
		if (!_state.cachedX || _isDisposedTensor(_state.cachedX)) return null;
		if (!_hasTF()) return null;
		if (!_hasModel()) return null;
		if (!_chainAlive(chain)) return null;

		var out = _computeViaSubModel(chain);
		if (out) return out;

		_log("Sub-Model fehlgeschlagen, versuche schrittweisen Forward-Pass");
		return _computeViaStepwise(chain);
	}

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

	function _computeViaSubModel(chain) {
		if (!_chainAlive(chain)) return null;
		if (!_hasModel()) return null;

		var symOutputs = [];
		var needsModel = false;

		try {
			for (var i = 0; i < chain.length; i++) {
				var n = chain[i];
				if (n.isInput) { symOutputs.push(null); continue; }
				if (!_layerAlive(n.layer)) return null;
				var o = null;
				try { o = n.layer.output; } catch (e) { o = null; }
				if (!o || Array.isArray(o)) {
					// Multi-Node / Multi-Output -> Sub-Model nicht möglich
					return null;
				}
				symOutputs.push(o);
				needsModel = true;
			}
		} catch (e) {
			return null;
		}

		if (!needsModel) {
			// Nur der Input-Raum ist plotbar -> direkt aus cachedX lesen
			return _readInputOnly(chain);
		}

		var realOutputs = symOutputs.filter(function (o) { return !!o; });
		if (!realOutputs.length) return null;

		var subModel = null;
		var results  = null;

		try {
			subModel = global.tf.model({
				inputs:  global.model.inputs,
				outputs: realOutputs
			});
		} catch (e) {
			_log("tf.model() fehlgeschlagen: " + e);
			return null;
		}

		try {
			results = global.tf.tidy(function () {
				var preds = subModel.predict(_state.cachedX, { batchSize: 512 });
				if (!Array.isArray(preds)) preds = [preds];

				var arrays = [];
				for (var p = 0; p < preds.length; p++) {
					var flat2d = _flattenTensorTo2D(preds[p]);
					arrays.push({
						data: flat2d.dataSync(),
						dim:  flat2d.shape[1],
						n:    flat2d.shape[0]
					});
				}
				return arrays;
			});
		} catch (e) {
			if (_isDisposedError(e)) {
				_log("Sub-Model: Layer bereits disposed (Modell-Rebuild), übersprungen");
			} else {
				_warn("Sub-Model predict fehlgeschlagen: " + e);
			}
			results = null;
		}

		if (!results) return null;

		// ---- Ergebnisse den Nodes zuordnen -----------------------
		var perNode = [];
		var ri = 0;
		var inputArr = null;

		for (var q = 0; q < chain.length; q++) {
			if (chain[q].isInput) {
				if (!inputArr) inputArr = _readSingleInput(chain[q].dim);
				perNode.push(inputArr);
			} else {
				if (ri >= results.length) { perNode.push(null); continue; }
				perNode.push(_unpack(results[ri], chain[q].dim));
				ri++;
			}
		}

		return perNode;
	}

	function _readInputOnly(chain) {
		var perNode = [];
		for (var i = 0; i < chain.length; i++) {
			perNode.push(chain[i].isInput ? _readSingleInput(chain[i].dim) : null);
		}
		return perNode;
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

	/**
	 * Wandelt {data, dim, n} in {xs, ys, zs} um (ys/zs nur wenn dim erlaubt).
	 */
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

	/**
	 * Fallback: schrittweise layer.apply() auf Tensoren. Robust gegen
	 * Multi-Node-Layer, aber langsamer und funktioniert nur für lineare
	 * Topologien (Skip-Connections werden dabei übersprungen).
	 */
	function _computeViaStepwise(chain) {
		if (!_hasModel()) return null;
		var layers = _getVisibleLayers();
		if (!layers.length) return null;

		var perNode = new Array(chain.length);
		for (var z = 0; z < perNode.length; z++) perNode[z] = null;

		// Map: layerIdx -> Position in chain
		var wanted = {};
		for (var c = 0; c < chain.length; c++) {
			if (chain[c].isInput) {
				perNode[c] = _readSingleInput(chain[c].dim);
			} else {
				wanted[chain[c].layerIdx] = c;
			}
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
				_log("Layer " + li + " bereits disposed (Modell-Rebuild), Forward-Pass abgebrochen");
				_safeDispose(cur);
				cur = null;
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
					_log("Layer " + li + " apply(): disposed (Modell-Rebuild), abgebrochen");
				} else {
					_warn("Layer " + li + " apply() fehlgeschlagen: " + e);
				}
				nxt = null;
			}

			_safeDispose(cur);
			cur = nxt;

			if (!cur || _isDisposedTensor(cur)) {
				_warn("Forward-Pass bei Layer " + li + " abgebrochen");
				break;
			}

			if (wanted[li] !== undefined) {
				var pos = wanted[li];
				perNode[pos] = _captureLayerOutput(cur, chain[pos].dim);
			}
		}

		_safeDispose(cur);

		var any = false;
		for (var a = 0; a < perNode.length; a++) if (perNode[a]) { any = true; break; }
		return any ? perNode : null;
	}

	// ============================================================
	// BOUNDING BOX / RAUM-ABGRENZUNG
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

	/**
	 * Erzeugt die Drahtgitter-Linien der Bounding-Box.
	 * dim 1 -> eine Linie entlang x
	 * dim 2 -> Rechteck in der xy-Ebene (z = 0)
	 * dim 3 -> Würfel
	 *
	 * Rückgabe: { xs, ys, zs } mit null-Trennern zwischen Kanten.
	 */
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

		if (dim === 1) {
			// Linie: der Unterraum ist eine 1D-Strecke, eingebettet bei y=0, z=0
			seg([x0, 0, 0], [x1, 0, 0]);
			// kleine Endmarkierungen, damit man die Grenzen sieht
			var tick = (x1 - x0) * 0.02;
			if (!_isFiniteNum(tick) || tick <= 0) tick = 0.02;
			seg([x0, -tick, 0], [x0, tick, 0]);
			seg([x1, -tick, 0], [x1, tick, 0]);
		} else if (dim === 2) {
			// Rechteck in der Ebene z = 0
			seg([x0, y0, 0], [x1, y0, 0]);
			seg([x1, y0, 0], [x1, y1, 0]);
			seg([x1, y1, 0], [x0, y1, 0]);
			seg([x0, y1, 0], [x0, y0, 0]);
		} else {
			// Würfel
			var c = [
				[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
				[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]
			];
			// Boden
			seg(c[0], c[1]); seg(c[1], c[2]); seg(c[2], c[3]); seg(c[3], c[0]);
			// Deckel
			seg(c[4], c[5]); seg(c[5], c[6]); seg(c[6], c[7]); seg(c[7], c[4]);
			// Pfosten
			seg(c[0], c[4]); seg(c[1], c[5]); seg(c[2], c[6]); seg(c[3], c[7]);
		}

		return { xs: xs, ys: ys, zs: zs };
	}

	// ============================================================
	// RELU-SCHNITTLINIEN (Hyperplanes)
	// ============================================================

	function _isReluLike(act) {
		if (!act) return false;
		return RELU_LIKE.indexOf(String(act).toLowerCase()) >= 0;
	}

	function _isSoftFold(act) {
		if (!act) return false;
		return SOFT_FOLD.indexOf(String(act).toLowerCase()) >= 0;
	}

	/**
	 * Liest die Gewichtsmatrix eines Dense-Layers und liefert die
	 * Hyperplanes w_i · x + b_i = 0, ausgedrückt im EINGANGSRAUM dieses
	 * Layers (also in dem Raum, den wir gerade plotten).
	 *
	 * Rückgabe: Array von { w: [w1..wd], b: number, unit: number }
	 */
	function _extractHyperplanes(layer, inputDim) {
		if (!layer) return null;
		if (!_isFiniteNum(inputDim) || inputDim < 1 || inputDim > 3) return null;

		var cls = "";
		try { cls = layer.getClassName ? layer.getClassName() : ""; }
		catch (e) { cls = ""; }

		// Nur Dense-Layer haben eine direkt interpretierbare Hyperplane
		// im Eingangsraum. Conv/Flatten etc. lassen wir weg.
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
			if (kShape[0] !== inputDim) {
				// Der Eingangsraum passt nicht (z.B. Flatten dazwischen)
				return null;
			}
			kernel = ws[0].dataSync();   // [inputDim * units]
			if (ws.length > 1 && !_isDisposedTensor(ws[1])) {
				bias = ws[1].dataSync(); // [units]
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
				if (norm2 < 1e-12) continue;   // degenerierte Hyperplane

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

	/**
	 * Schneidet eine Hyperplane mit der Bounding-Box und liefert
	 * Linien-/Flächensegmente zum Zeichnen.
	 *
	 * dim 1: w0*x + b = 0  -> ein Punkt
	 * dim 2: w0*x + w1*y + b = 0 -> eine Linie im Rechteck
	 * dim 3: Ebene im Würfel -> Polygon (als Drahtgitter-Rand gezeichnet)
	 */
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
				zs: [0, 0, null]
			};
		}

		if (dim === 2) {
			// Linie w0*x + w1*y + b = 0 im Rechteck clippen
			var pts = [];
			var eps = 1e-12;

			// Schnitt mit x = x0 / x1
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
			// Schnitt mit y = y0 / y1
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

			// Nur die zwei am weitesten entfernten Punkte behalten
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

			return {
				xs: [best[0][0], best[1][0], null],
				ys: [best[0][1], best[1][1], null],
				zs: [0, 0, null]
			};
		}

		// dim === 3: Ebene im Würfel -> Schnittpolygon über die 12 Kanten
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

		// Punkte um ihren Schwerpunkt sortieren, damit das Polygon
		// nicht zum Sternmuster degeneriert
		var cx = 0, cy = 0, cz = 0;
		for (var p = 0; p < poly.length; p++) {
			cx += poly[p][0]; cy += poly[p][1]; cz += poly[p][2];
		}
		cx /= poly.length; cy /= poly.length; cz /= poly.length;

		// Zwei orthogonale Basisvektoren in der Ebene bestimmen
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

		var xs = [], ys = [], zs = [];
		for (var r = 0; r < poly.length; r++) {
			xs.push(poly[r][0]); ys.push(poly[r][1]); zs.push(poly[r][2]);
		}
		// Polygon schließen
		xs.push(poly[0][0]); ys.push(poly[0][1]); zs.push(poly[0][2]);
		xs.push(null); ys.push(null); zs.push(null);

		return { xs: xs, ys: ys, zs: zs };
	}

	function _buildCutTraces(node, bounds, sceneName, theme) {
		if (!_state.config.showReluCuts) return [];
		if (!node || !bounds) return [];

		var cutLayer = node.cutLayer;
		if (!cutLayer) return [];

		var act = _activationNameOfLayer(cutLayer);
		var isHard = _isReluLike(act);
		var isSoft = _isSoftFold(act);

		if (!isHard && !(isSoft && _state.config.showSoftFolds)) return [];

		var planes = _extractHyperplanes(cutLayer, node.dim);
		if (!planes || !planes.length) return [];

		var allXs = [], allYs = [], allZs = [];
		var drawn = 0;

		for (var i = 0; i < planes.length; i++) {
			var clipped = _clipHyperplane(planes[i], bounds, node.dim);
			if (!clipped) continue;
			allXs = allXs.concat(clipped.xs);
			allYs = allYs.concat(clipped.ys);
			allZs = allZs.concat(clipped.zs);
			drawn++;
		}

		if (!drawn) return [];

		var color = isHard ? theme.cutColor : theme.softCut;
		var label = (isHard ? _tr("origami_relu_cut", "ReLU-Schnitt") :
		                      _tr("origami_soft_fold", "weiche Biegung")) +
		            " (" + drawn + ")";

		var tr = {
			type: "scatter3d",
			mode: "lines",
			x: allXs, y: allYs, z: allZs,
			line: { color: color, width: isHard ? 4 : 2 },
			name: label,
			legendgroup: "cuts",
			showlegend: (sceneName === "scene"),
			hoverinfo: "name",
			scene: sceneName
		};
		return [tr];
	}

	// ============================================================
	// TRACES BAUEN
	// ============================================================

	function _buildTracesForNode(node, act, sceneName, theme, showLegend) {
		var traces = [];
		if (!act || !act.n) return traces;

		var n = act.n;
		var xs = act.xs;
		var ys = act.ys ? act.ys : new Float64Array(n);       // 1D -> y = 0
		var zs = act.zs ? act.zs : new Float64Array(n);       // 1/2D -> z = 0

		var colors = _state.cachedColors;
		var classIdx = _state.cachedClassIdx;
		var classNames = _state.cachedClassNames;
		var isReg = _state.cachedIsRegression;

		var bounds = _computeBounds(act);

		// ---- Bounding-Box ----------------------------------------
		if (_state.config.showBoundingBox && bounds) {
			var wf = _boxWireframe(bounds, act.dim);
			if (wf) {
				traces.push({
					type: "scatter3d",
					mode: "lines",
					x: wf.xs, y: wf.ys, z: wf.zs,
					line: { color: theme.boxColor, width: 2 },
					name: _tr("origami_subspace", "Unterraum") + " (" + act.dim + "D)",
					legendgroup: "box",
					showlegend: showLegend,
					hoverinfo: "skip",
					scene: sceneName
				});
			}
		}

		// ---- Datenpunkte ------------------------------------------
		if (classNames && classIdx && !isReg) {
			// Pro Klasse ein eigener Trace -> echte Legende + Filterbarkeit
			var buckets = {};
			for (var i = 0; i < n; i++) {
				var c = classIdx[i];
				if (!_isFiniteNum(c) || c < 0) c = 0;
				if (!buckets[c]) buckets[c] = { x: [], y: [], z: [], t: [] };
				buckets[c].x.push(xs[i]);
				buckets[c].y.push(ys[i]);
				buckets[c].z.push(zs[i]);
				buckets[c].t.push(classNames[c] || ("#" + c));
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
						size: _state.config.pointSize,
						color: _classColor(ci),
						opacity: _state.config.pointOpacity,
						line: { width: 0 }
					},
					name: classNames[ci] || (_tr("origami_class", "Klasse") + " " + ci),
					legendgroup: "cls" + ci,
					showlegend: showLegend,
					hovertemplate:
						"<b>%{text}</b><br>" +
						"x: %{x:.4f}" +
						(act.dim >= 2 ? "<br>y: %{y:.4f}" : "") +
						(act.dim >= 3 ? "<br>z: %{z:.4f}" : "") +
						"<extra>" + node.name + "</extra>",
					text: bk.t,
					scene: sceneName
				});
			}
		} else {
			// Regression oder keine Klassen -> ein Trace mit Farbarray
			traces.push({
				type: "scatter3d",
				mode: "markers",
				x: Array.prototype.slice.call(xs),
				y: Array.prototype.slice.call(ys),
				z: Array.prototype.slice.call(zs),
				marker: {
					size: _state.config.pointSize,
					color: colors || "#159c72",
					opacity: _state.config.pointOpacity,
					line: { width: 0 }
				},
				name: isReg ? _tr("origami_target", "Zielwert")
				            : _tr("origami_data", "Daten"),
				legendgroup: "data",
				showlegend: showLegend,
				hovertemplate:
					"x: %{x:.4f}" +
					(act.dim >= 2 ? "<br>y: %{y:.4f}" : "") +
					(act.dim >= 3 ? "<br>z: %{z:.4f}" : "") +
					"<extra>" + node.name + "</extra>",
				scene: sceneName
			});
		}

		// ---- ReLU-Schnittlinien ----------------------------------
		var cuts = _buildCutTraces(node, bounds, sceneName, theme);
		for (var q = 0; q < cuts.length; q++) traces.push(cuts[q]);

		return traces;
	}

	// ============================================================
	// LAYOUT
	// ============================================================

	function _sceneNameFor(i) {
		return (i === 0) ? "scene" : ("scene" + (i + 1));
	}

	function _buildLayout(chain, perNode, theme) {
		var nPlots = chain.length;
		var layout = {
			paper_bgcolor: theme.paper,
			plot_bgcolor:  theme.plotBg,
			font: { color: theme.text, size: 11 },
			margin: { l: 8, r: 8, t: 54, b: 8 },
			height: _state.config.subplotHeight,
			showlegend: true,
			legend: {
				orientation: "h",
				x: 0, y: 1.06,
				font: { size: 10, color: theme.text },
				bgcolor: "rgba(0,0,0,0)"
			},
			title: {
				text: _tr("origami_title",
					"Origami: Faltung der Datenmannigfaltigkeit durch die Layer"),
				font: { size: 13, color: theme.text },
				x: 0.5, xanchor: "center"
			},
			hovermode: "closest",
			transition: _state.config.smoothUpdates
				? { duration: 250, easing: "cubic-in-out" }
				: { duration: 0 }
		};

		// ---- Domains für die Subplots berechnen ------------------
		// Wir legen alle Räume horizontal nebeneinander, jeder bekommt
		// eine eigene scene mit eigenem Domain-Bereich.
		var gap = (nPlots > 1) ? Math.min(0.02, 0.4 / nPlots) : 0;
		var wEach = (1 - gap * (nPlots - 1)) / nPlots;

		if (!_isFiniteNum(wEach) || wEach <= 0) wEach = 1;

		for (var i = 0; i < nPlots; i++) {
			var sceneName = _sceneNameFor(i);
			var x0 = i * (wEach + gap);
			var x1 = x0 + wEach;
			if (x1 > 1) x1 = 1;

			var node = chain[i];
			var act  = perNode[i];
			var dim  = act ? act.dim : node.dim;

			// Kamera pro Szene erhalten, falls schon vorhanden
			var cam = _state.lastCameras[sceneName];
			if (!cam) {
				// Standardblick: leicht schräg von oben, so dass man
				// den "Knick" gut erkennen kann
				cam = { eye: { x: 1.45, y: 1.35, z: 1.15 } };
			}

			var axisCommon = {
				gridcolor: theme.grid,
				zerolinecolor: theme.zeroline,
				color: theme.axisText,
				tickfont: { size: 9, color: theme.axisText },
				showspikes: false
			};

			layout[sceneName] = {
				domain: { x: [x0, x1], y: [0, 1] },
				aspectmode: "cube",
				camera: cam,
				bgcolor: theme.plotBg,
				xaxis: Object.assign({}, axisCommon, {
					title: { text: "d0", font: { size: 10, color: theme.axisText } }
				}),
				yaxis: Object.assign({}, axisCommon, {
					title: {
						text: (dim >= 2 ? "d1" : ""),
						font: { size: 10, color: theme.axisText }
					},
					showticklabels: (dim >= 2)
				}),
				zaxis: Object.assign({}, axisCommon, {
					title: {
						text: (dim >= 3 ? "d2" : ""),
						font: { size: 10, color: theme.axisText }
					},
					showticklabels: (dim >= 3)
				})
			};

			// ---- Titel-Annotation pro Subplot --------------------
			if (!layout.annotations) layout.annotations = [];

			var actName = node.activation ? (" · " + node.activation) : "";
			var titleTxt = (node.isInput
					? _tr("origami_input_space", "Input")
					: ("L" + node.layerIdx + " " + node.className))
				+ " [" + dim + "D]" + actName;

			layout.annotations.push({
				text: titleTxt,
				x: (x0 + x1) / 2,
				y: 1.0,
				xref: "paper",
				yref: "paper",
				xanchor: "center",
				yanchor: "bottom",
				showarrow: false,
				font: { size: 10, color: theme.axisText }
			});

			// ---- Pfeil zum nächsten Raum ("→" wie in origami.png) --
			if (i < nPlots - 1) {
				layout.annotations.push({
					text: "➜",
					x: x1 + gap / 2,
					y: 0.5,
					xref: "paper",
					yref: "paper",
					xanchor: "center",
					yanchor: "middle",
					showarrow: false,
					font: { size: 22, color: theme.axisText }
				});
			}
		}

		// Breite dynamisch: genug Platz pro Subplot
		var minW = _state.config.minSubplotWidth * nPlots;
		if (_isFiniteNum(minW) && minW > 0) {
			layout.width = undefined;   // responsive lassen
			layout.autosize = true;
		}

		return layout;
	}

	// ============================================================
	// KAMERA-ERHALTUNG
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

	// ============================================================
	// INTERAKTIONS-ERKENNUNG
	// ============================================================

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

	function _attachInteractionListeners() {
		var div = _state.plotDiv;
		if (!div) return;

		try {
			div.addEventListener("mousedown",  _onInteractionStart, { passive: true });
			div.addEventListener("touchstart", _onInteractionStart, { passive: true });
			div.addEventListener("wheel",      _onInteractionStart, { passive: true });

			// Scroll/Touch nicht an die Seite weitergeben
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
					if (ev) {
						var ks = Object.keys(ev);
						for (var i = 0; i < ks.length; i++) {
							var m = ks[i].match(/^(scene\d*)\.camera$/);
							if (m) _state.lastCameras[m[1]] = ev[ks[i]];
						}
					}
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
			// Fallback: kein Observer verfügbar -> immer als sichtbar behandeln
			_state.isVisible = true;
			return;
		}
		try {
			_state.observer = new IntersectionObserver(function (entries) {
				for (var i = 0; i < entries.length; i++) {
					var wasVisible = _state.isVisible;
					_state.isVisible = entries[i].isIntersecting;
					if (!_state.isVisible) continue;

					// Guardrail: bei jedem sichtbaren Callback nacharbeiten,
					// nicht nur an der Flanke (die kann verpasst werden).
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
			// warten bis geladen
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
	// DEAKTIVIERUNG / INFO
	// ============================================================

	function _deactivate(reasonKey, fallbackMsg) {
		_state.deactivated = true;
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
		// Kompletten Neuaufbau erzwingen
		_state.lastFingerprint = null;
		_state.lastViewHash = null;
	}

	// ============================================================
	// RENDER
	// ============================================================

	function _scheduleRender() {
		if (_state.rafId) return;
		if (typeof requestAnimationFrame !== "function") {
			_render();
			return;
		}
		_state.rafId = requestAnimationFrame(function () {
			_state.rafId = null;
			_render();
		});
	}

	function _render() {
		// ---- Guardrails vor dem Rendern --------------------------
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

		// Throttling während des Trainings
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

		// ---- Kette bauen ----------------------------------------
		var built = _buildChain();
		var chain = built.chain;

		if (chain.length && !_chainAlive(chain)) {
			_log("Layer-Kette enthält disposed Layer (Modell-Rebuild in Progress), übersprungen");
			return;
		}

		if (!chain.length) {
			if (built.reason === "no_low_dim_layers") {
				_deactivate("origami_no_low_dim",
					"Kein Layer hat 1–3 Ausgabedimensionen. " +
					"Der Origami-Plot benötigt mindestens einen Raum mit ≤ 3 Dimensionen.");
			} else {
				_deactivate("origami_no_layers", "Keine plotbaren Layer gefunden.");
			}
			return;
		}

		// ---- Shape-Änderung? -> ggf. reaktivieren ---------------
		var sig = _chainSignature(chain);
		if (sig !== _state.lastChainSignature) {
			_log("Layer-Kette geändert: " + sig);
			_state.lastChainSignature = sig;
			_state.lastFingerprint = null;     // Neuaufbau erzwingen
			if (_state.deactivated) _reactivate();
			// Plotly muss bei geänderter Subplot-Anzahl neu aufgebaut werden
			if (_state.plotlyInitialized) {
				try { global.Plotly.purge(_state.plotDiv); } catch (e) { /* ignore */ }
				_state.plotlyInitialized = false;
			}
		} else if (_state.deactivated) {
			_reactivate();
		}

		// ---- Daten vorbereiten ----------------------------------
		if (!_prepareData()) {
			_deactivate("origami_no_data",
				"Keine Trainingsdaten verfügbar (xy_data_global fehlt oder ist leer).");
			return;
		}

		// ---- Change-Detection -----------------------------------
		var fp = _modelFingerprint(chain);
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

		// ---- Aktivierungen berechnen ---------------------------
		var perNode = _computeActivations(chain);
		if (!perNode) {
			_state.consecutiveErrors++;
			if (_state.consecutiveErrors > 4) {
				_deactivate("origami_activation_failed",
					"Aktivierungen konnten mehrfach nicht berechnet werden. " +
					"Der Plot wurde deaktiviert, um Folgefehler zu vermeiden.");
			} else {
				_warn("Aktivierungen konnten nicht berechnet werden (Versuch " +
				      _state.consecutiveErrors + "/4)");
			}
			return;
		}
		_state.consecutiveErrors = 0;

		// Prüfen, ob überhaupt irgendwas Plotbares dabei ist
		var anyData = false;
		for (var a = 0; a < perNode.length; a++) {
			if (perNode[a] && perNode[a].n > 0) { anyData = true; break; }
		}
		if (!anyData) {
			_deactivate("origami_no_activations",
				"Es konnten keine Aktivierungen gelesen werden.");
			return;
		}

		// ---- Traces + Layout bauen -----------------------------
		var theme = _theme();
		var traces = [];
		var legendDone = false;

		for (var i = 0; i < chain.length; i++) {
			var act = perNode[i];
			if (!act) continue;
			var sceneName = _sceneNameFor(i);
			var showLegend = !legendDone;
			var t = _buildTracesForNode(chain[i], act, sceneName, theme, showLegend);
			if (t.length) {
				legendDone = true;
				for (var q = 0; q < t.length; q++) traces.push(t[q]);
			}
		}

		if (!traces.length) {
			_deactivate("origami_no_traces", "Keine darstellbaren Daten erzeugt.");
			return;
		}

		var layout = _buildLayout(chain, perNode, theme);

		var plotConfig = {
			responsive: true,
			displaylogo: false,
			displayModeBar: true,
			modeBarButtonsToRemove: ["sendDataToCloud", "toImage"],
			scrollZoom: true
		};

		// ---- Kameras sichern, dann rendern ---------------------
		_saveCameras();

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
						_log("Plot neu erstellt (" + chain.length + " Räume, " +
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
						_log("Plot aktualisiert");
					})
					.catch(function (e) {
						_error("Plotly.react fehlgeschlagen: " + e);
						// Beim nächsten Mal komplett neu aufbauen
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
		// String-ID
		if (typeof divOrId === "string" && divOrId !== "") {
			var byId = document.getElementById(divOrId);
			if (byId) {
				_state.parentId = divOrId;
				return byId;
			}
			_warn("Div mit ID '" + divOrId + "' nicht gefunden, hänge an <body>");
			return null;
		}

		// DOM-Element
		if (divOrId && typeof HTMLElement !== "undefined" &&
		    divOrId instanceof HTMLElement) {
			_state.parentElement = divOrId;
			return divOrId;
		}

		// jQuery-Objekt
		try {
			if (divOrId && typeof divOrId === "object" &&
			    typeof divOrId.length === "number" && divOrId.length > 0 &&
			    divOrId[0] && divOrId[0].nodeType === 1) {
				_state.parentElement = divOrId[0];
				return divOrId[0];
			}
		} catch (e) { /* ignore */ }

		// jQuery-Selektor-Funktion vorhanden und String übergeben, der keine ID war
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

	function _buildDOM(divOrId) {
		// Singleton: existierenden Container wiederverwenden
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

		// ---- Kopfzeile ------------------------------------------
		var head = document.createElement("div");
		head.style.cssText =
			"display:flex;align-items:center;justify-content:space-between;" +
			"gap:10px;flex-wrap:wrap;margin-bottom:8px;";

		var title = document.createElement("div");
		title.style.cssText =
			"font-weight:700;font-size:13px;letter-spacing:0.3px;color:" +
			theme.textAccent + ";";
		title.innerHTML = "✦ " +
			_tr("origami_title",
				"Origami: Faltung der Datenmannigfaltigkeit durch die Layer");
		head.appendChild(title);

		var btnRow = document.createElement("div");
		btnRow.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;";

		function mkBtn(label, tip, onClick) {
			var b = document.createElement("button");
			b.type = "button";
			b.textContent = label;
			b.title = tip;
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

		mkBtn("↺ " + _tr("origami_reset_view", "Ansicht"),
			_tr("origami_reset_view_tip",
				"Setzt alle Kameras auf die Standardansicht zurück."),
			function () {
				_state.lastCameras = {};
				_state.lastFingerprint = null;
				_state.lastViewHash = null;
				if (_state.plotlyInitialized && _hasPlotly() && _state.plotDiv) {
					try { global.Plotly.purge(_state.plotDiv); } catch (e) { /* ignore */ }
					_state.plotlyInitialized = false;
				}
				_scheduleRender();
			});

		mkBtn("⟳ " + _tr("origami_force", "Neu zeichnen"),
			_tr("origami_force_tip",
				"Erzwingt eine Neuberechnung, auch wenn sich nichts geändert hat."),
			function () { forceUpdate(); });

		mkBtn("✂ " + _tr("origami_toggle_cuts", "Schnitte"),
			_tr("origami_toggle_cuts_tip",
				"Zeigt/versteckt die ReLU-Hyperplanes (die 'Schnittlinien', an denen " +
				"der Knick entsteht)."),
			function () {
				_state.config.showReluCuts = !_state.config.showReluCuts;
				_scheduleRender();
			});

		mkBtn("▣ " + _tr("origami_toggle_box", "Rahmen"),
			_tr("origami_toggle_box_tip",
				"Zeigt/versteckt die Begrenzung des Unterraums (Linie/Rechteck/Würfel)."),
			function () {
				_state.config.showBoundingBox = !_state.config.showBoundingBox;
				_scheduleRender();
			});

		head.appendChild(btnRow);
		container.appendChild(head);

		// ---- Info-/Deaktivierungsmeldung ------------------------
		var info = document.createElement("div");
		info.id = INFO_ID;
		info.style.cssText =
			"display:none;padding:18px 14px;text-align:center;font-size:12px;" +
			"line-height:1.6;color:" + theme.infoText + ";";
		container.appendChild(info);
		_state.infoDiv = info;

		// ---- Plot-Div -------------------------------------------
		var plot = document.createElement("div");
		plot.id = PLOT_ID;
		plot.style.cssText =
			"width:100%;min-height:" + _state.config.subplotHeight + "px;" +
			"border-radius:8px;overflow:hidden;";
		container.appendChild(plot);
		_state.plotDiv = plot;

		// ---- Fußzeile (Legende der Semantik) --------------------
		var foot = document.createElement("div");
		foot.style.cssText =
			"margin-top:8px;font-size:10.5px;line-height:1.6;opacity:0.75;color:" +
			theme.infoText + ";";
		foot.innerHTML =
			"<b>" + _tr("origami_legend", "Lesehilfe") + ":</b> " +
			_tr("origami_legend_text",
				"Jeder Kasten ist ein Aktivierungsraum (1D = Linie, 2D = Fläche, " +
				"3D = Würfel), eingebettet in einen gemeinsamen 3D-Raum. Die orangen " +
				"Linien/Flächen sind die ReLU-Hyperplanes des <i>nächsten</i> Layers – " +
				"genau dort entsteht der Knick. Von links nach rechts siehst du, wie " +
				"das Netz die Daten Schritt für Schritt faltet, bis die Klassen linear " +
				"trennbar sind.");
		container.appendChild(foot);

		// ---- Einhängen -----------------------------------------
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
		_state.darkModeTimer = setInterval(function () {
			if (!_state.initialized) return;

			var cur = _theme().dark;
			if (cur !== _state.lastDarkMode) {
				_state.lastDarkMode = cur;
				_styleContainer();
				// Buttons/Info neu einfärben: einfachster Weg ist ein Rebuild
				_state.lastViewHash = null;
				if (_state.plotlyInitialized && _hasPlotly() && _state.plotDiv) {
					// Plotly.react reicht, Layout-Farben ändern sich mit
					_scheduleRender();
				}
				return;
			}

			// Selbstheilung: wenn ein Update ausstand und wir sichtbar sind,
			// aber der rAF/Observer es verschluckt hat
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

		// Sofort-Sichtbarkeitscheck (Observer feuert asynchron)
		if (_isVisibleNow()) _state.isVisible = true;

		_ensurePlotly(function () {
			_state.pendingRender = true;
			_scheduleRender();
		});

		_log("initialisiert (Container: " + SINGLETON_ID + ")");
		return OrigamiFolds;
	}

	// ============================================================
	// PUBLIC: update (Singleton, aus dem Trainings-Hook aufrufen)
	// ============================================================

	function update() {
		if (!_state.initialized) {
			// Automatisch initialisieren, damit ein versehentlicher
			// update()-Aufruf vor init() nicht ins Leere läuft
			_log("update() vor init() – initialisiere automatisch");
			init();
			return OrigamiFolds;
		}

		// Container aus dem DOM entfernt? -> neu aufbauen
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
			// Nicht im Bild: nur merken, dass etwas zu tun ist
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
		_state.cachedXHash      = null;   // Daten neu subsamplen
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
		_state.layerBlocksSig = null;
		_state.lastChainSignature = null;

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
			// Typprüfung gegen den Default
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
		// für Debugging / erweiterte Nutzung
		_state:               _state,
		_buildChain:          _buildChain,
		_extractHyperplanes:  _extractHyperplanes,
		_computeActivations:  _computeActivations
	};

	if (typeof global !== "undefined") {
		global.OrigamiFolds = OrigamiFolds;
	}

	return OrigamiFolds;

})(typeof window !== "undefined" ? window : this);

// ============================================================
// KOMFORT-WRAPPER (analog zu create_loss_landscape / create_topological_analyzer)
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

function update_origami_folds() {
	try {
		return OrigamiFolds.update();
	} catch (e) {
		if (typeof wrn === "function") {
			wrn("[origami_folds] update_origami_folds fehlgeschlagen: " + e);
		} else {
			console.warn("[origami_folds] update_origami_folds fehlgeschlagen:", e);
		}
	}
}

// Kein Auto-Init: update() initialisiert automatisch beim ersten
// Trainings-Epoch (document.body ist dann garantiert vorhanden).
//OrigamiFolds.init("origami_container");   // manuell in ein Div per ID
//OrigamiFolds.init($("#meinDiv"));         // jQuery
//OrigamiFolds.init(document.getElementById("x"));  // DOM-Element
