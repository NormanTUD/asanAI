"use strict";

/**
 * origami_live.js — Live-3D-Visualisierung der Mannigfaltigkeits-Faltung
 * ======================================================================
 *
 * Theorie: Keup & Helias, "Origami in N dimensions: How feed-forward
 * networks manufacture linear separability" (arXiv:2203.11355).
 *
 * Kernidee des Papers, die hier visuell umgesetzt wird:
 *   - Die affine Transformation positioniert die Mannigfaltigkeit ("Anvil")
 *   - Die ReLU-Nichtlinearität schlägt wie ein Hammer eine Delle hinein
 *   - Trifft der Hammer aus einer UNBENUTZTEN Dimension, wird nichts
 *     gestaucht, sondern GEFALTET — injektiv, aber nichtlinear
 *   - Entlang der Faltkante wird das Innere der Verteilung nach außen
 *     exponiert und dadurch linear abtrennbar
 *
 * ----------------------------------------------------------------------
 * PUBLIC API (window.OrigamiLive)
 * ----------------------------------------------------------------------
 *   OrigamiLive.init()              // appendet an <body> (Singleton)
 *   OrigamiLive.init("divId")       // in ein Div per ID
 *   OrigamiLive.init(domElement)    // in ein DOM-Element
 *   OrigamiLive.init($("#div"))     // jQuery-Objekt
 *
 *   OrigamiLive.update()            // Update, nur wenn sichtbar
 *   OrigamiLive.forceUpdate()       // ignoriert Change-Detection
 *   OrigamiLive.destroy()
 *   OrigamiLive.getConfig() / setConfig({...})
 *   OrigamiLive.setMode("fold"|"boundary"|"stack")
 *
 * ----------------------------------------------------------------------
 * GELESENE GLOBALS (alle optional, alle mit Guards)
 * ----------------------------------------------------------------------
 *   THREE, tf, model, xy_data_global, labels, is_classification,
 *   is_dark_mode, started_training, lang/language, cnn3d_data_revision,
 *   dbg/wrn/err (Logging)
 *
 * ----------------------------------------------------------------------
 * ARCHITEKTUR
 * ----------------------------------------------------------------------
 *   init()            -> DOM + Renderer + Observer, KEIN Render
 *   IntersectionObs   -> setzt _state.visible, konsumiert pendingRender
 *   update()          -> markiert dirty; rendert nur bei Sichtbarkeit
 *   _scheduleRender() -> rAF-gedrosselt
 *   _rebuild()        -> Change-Detection -> Geometrie neu bauen
 *   _animate()        -> 60fps Loop, nur wenn sichtbar UND dirty
 */

var OrigamiLive = (function (global) {

	// ==================================================================
	// 0. KONSTANTEN
	// ==================================================================

	var SID        = "origami_live_singleton";
	var LOG_PREFIX = "[origami_live]";

	var MODE_FOLD     = "fold";      // A: Vorwärts-Faltung
	var MODE_BOUNDARY = "boundary";  // B: Rückwärts-Entscheidungsgrenze
	var MODE_STACK    = "stack";     // C: Gestapelte Halbräume

	// Aktivierungen, die eine HARTE Faltkante erzeugen (Knick)
	var HARD_FOLD = [
		"relu", "relu6", "leakyrelu", "elu", "selu",
		"thresholdedrelu", "hardsigmoid"
	];
	// Aktivierungen, die eine WEICHE Biegung erzeugen
	var SOFT_FOLD = [
		"sigmoid", "tanh", "softsign", "softplus", "swish", "mish",
		"gelu", "silu"
	];

	// Layer, die den Raum nicht verändern (durchgereicht)
	var PASSTHROUGH = ["dropout", "flatten", "reshape", "activation",
	                   "batchnormalization", "layernormalization",
	                   "gaussiannoise", "spatialdropout1d",
	                   "spatialdropout2d", "alphadropout"];

	// ==================================================================
	// 1. PALETTE (an die Video-Ästhetik angelehnt)
	// ==================================================================

	var PALETTE = {
		// Halbräume: cyan = positive Seite, ocker = negative Seite
		halfPos:    0x2ba3b8,
		halfNeg:    0xb8860b,
		halfPosLit: 0x4fd4e8,
		halfNegLit: 0xe8b43c,

		// Faltkanten
		foldHard:   0xffffff,
		foldSoft:   0xffe9a8,

		// Entscheidungsgrenze
		boundary:   0xff2dd4,
		boundaryGlow: 0xff7ae8,

		// Datenpunkte
		classes: [
			0x19c48c, 0xff8c3a, 0x4d8cff, 0xe845b8, 0xa86cff,
			0x1fc4e0, 0xf0cf2a, 0xff4d4d, 0x72cc3d, 0x8f5fe8,
			0x26a0ad, 0xd96a05, 0x3570c9, 0xbd2691, 0x7a4dcc,
			0x0f96b0, 0xc9a515, 0xc93737, 0x55a033, 0x7349c4
		],

		// Netz-Diagramm
		netNode:    0xf0ead8,
		netNodeHot: 0xe8b43c,
		netEdge:    0x8a8578,

		// Gitter / Hilfslinien
		gridLine:   0xb8c4e0,
		axis:       0x6a7590
	};

	// ==================================================================
	// 2. STATE
	// ==================================================================

	var _state = {
		// DOM
		container:  null,
		canvasWrap: null,
		overlayEl:  null,
		hudEl:      null,
		ctrlEl:     null,
		netEl:      null,
		tipEl:      null,
		parentRef:  null,

		// three.js
		THREE:      null,
		scene:      null,
		camera:     null,
		renderer:   null,
		rootGroup:  null,
		sheetGroup: null,
		foldGroup:  null,
		dataGroup:  null,
		boundGroup: null,
		stackGroup: null,
		helperGroup: null,

		// Kamera-Orbit
		orbit:      { radius: 420, theta: 0.62, phi: 1.05,
		              target: null, vTheta: 0, vPhi: 0, down: false,
		              lastX: 0, lastY: 0, button: 0 },

		// Lifecycle
		initialized:  false,
		destroyed:    false,
		visible:      false,
		pendingRender: false,
		dirty:        true,
		rafId:        null,
		animId:       null,
		observer:     null,
		resizeObs:    null,
		watchTimer:   null,

		// Change-Detection
		lastFingerprint: null,
		lastViewHash:    null,
		lastRevision:    -1,
		lastChainSig:    null,
		modelRef:        null,
		errorStreak:     0,
		lastRebuild:     0,
		hasFramed:       false,
		lastFramedHash:  null,
		lastFitLayer:    -1,

		// Deaktivierung
		off:     false,
		offKey:  "",
		offMsg:  "",

		// Daten-Cache
		cache: {
			xTensor:    null,
			xHash:      null,
			sampleCount: 0,
			classIdx:   null,
			classNames: null,
			colors:     null,
			isRegression: false,
			yMin: 0, yMax: 1
		},

		// Berechnete Faltungs-Pipeline
		pipeline: null,

		// Animation
		clock:      null,
		scrub:      1.0,      // 0..1 — wie weit die Faltung "aufgeklappt" ist
		scrubTarget: 1.0,
		scrubPlaying: false,
		activeNeuron: -1,
		activeLayer:  -1,
		timeAccum:    0,

		// Theme
		lastDark: null,
		lastLang: null,

		// Qualitäts-Autoregelung
		frameTimes:   [],
		autoQuality:  true,
		qualityLevel: 2,      // 0=niedrig, 1=mittel, 2=hoch, 3=ultra

		// Config
		cfg: {
			mode:            MODE_FOLD,

			// Qualität (sane defaults)
			gridRes:         25,       // Gitterauflösung pro Achse
			maxPoints:       1800,     // Datenpunkte
			maxNeurons:      24,       // Halbräume pro Layer im Stack-Modus
			maxLayers:       6,        // sichtbare Layer
			boundaryRes:     90,       // Auflösung der Grenz-Rekonstruktion

			// Darstellung
			showData:        true,
			showFolds:       true,
			showSheet:       true,
			showBoundary:    true,
			showGrid:        true,
			showAxes:        false,
			showNetDiagram:  true,
			showHud:         true,

			sheetOpacity:    0.62,
			stackOpacity:    0.34,
			stackSpread:     1.5,      // Explosions-Abstand
			pointSize:       3.4,
			foldWidth:       2.2,

			// Animation
			animate:         false,
			autoRotate:      false,
			rotateSpeed:     0.12,
			scrubSpeed:      0.55,

			// Achsen (bei >3D)
			axisMode:        "auto",   // "auto" | "manual"
			axisX:           0,
			axisY:           1,
			axisZ:           2,

			// Conv
			convPatchMode:   true,     // Conv2D über Filter-Patches
			convMaxFilters:  16,

			// Technik
			throttleMs:      420,
			dpr:             -1        // -1 = auto
		}
	};

	// ==================================================================
	// 3. LOGGING + I18N
	// ==================================================================

	function _log(m) {
		try { if (typeof dbg === "function") { dbg(LOG_PREFIX + " " + m); return; } } catch (e) {}
		if (global.console && console.debug) console.debug(LOG_PREFIX, m);
	}
	function _warn(m) {
		try { if (typeof wrn === "function") { wrn(LOG_PREFIX + " " + m); return; } } catch (e) {}
		if (global.console && console.warn) console.warn(LOG_PREFIX, m);
	}
	function _err(m) {
		try { if (typeof err === "function") { err(LOG_PREFIX + " " + m); return; } } catch (e) {}
		if (global.console && console.error) console.error(LOG_PREFIX, m);
	}

	function _tr(key, fb) {
		try {
			if (typeof language !== "undefined" && language &&
			    typeof lang !== "undefined" && language[lang] &&
			    language[lang][key] != null) {
				return language[lang][key];
			}
		} catch (e) {}
		return (fb != null ? fb : key);
	}

	function _refreshUIText() {
		if (!_state.uiText) return;
		for (var i = 0; i < _state.uiText.length; i++) {
			var e = _state.uiText[i];
			if (!e || !e.el) continue;
			var v = _tr(e.key, e.fb);
			if (e.kind === "text") {
				e.el.textContent = (e.prefix || "") + v;
			} else if (e.kind === "tip") {
				e.el.title = v;
			} else if (e.kind === "label") {
				e.el.textContent = v + " —";
			}
		}
		// HUD- und Diagnose-Texte hängen an _updateHud/_updateDiag
		if (_state.pipeline) {
			_updateHud(_state.pipeline);
			_updateNetDiagram(_state.pipeline);
		}
	}

	function _toggleFullscreen() {
		var el = _state.container;
		if (!el) return;
		try {
			var fsEl = document.fullscreenElement ||
			           document.webkitFullscreenElement || null;
			if (fsEl === el) {
				if (document.exitFullscreen) document.exitFullscreen();
				else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
			} else {
				var req = el.requestFullscreen || el.webkitRequestFullscreen;
				if (req) req.call(el);
			}
		} catch (e) {
			_wrn("Vollbild nicht möglich: " + e);
		}
	}

	// ==================================================================
	// 4. GUARDS
	// ==================================================================

	function _hasTHREE() {
		try {
			return (typeof global.THREE !== "undefined" && global.THREE &&
			        typeof global.THREE.Scene === "function" &&
			        typeof global.THREE.WebGLRenderer === "function");
		} catch (e) { return false; }
	}

	function _hasTF() {
		try {
			return (typeof global.tf !== "undefined" && global.tf &&
			        typeof global.tf.tidy === "function");
		} catch (e) { return false; }
	}

	function _hasModel() {
		try {
			if (!global.model) return false;
			if (!global.model.layers || !Array.isArray(global.model.layers)) return false;
			if (global.model.isDisposed === true) return false;
			return true;
		} catch (e) { return false; }
	}

	function _fin(v) { return (typeof v === "number" && isFinite(v)); }

	function _alive(layer) {
		if (!layer) return false;
		try {
			if (layer.isDisposed === true) return false;
			if (layer.isDisposedInternal === true) return false;
			return true;
		} catch (e) { return true; }
	}

	function _tDead(t) {
		try {
			if (!t) return true;
			if (t.isDisposed === true) return true;
			if (typeof t.dataSync !== "function") return true;
			return false;
		} catch (e) { return true; }
	}

	function _tFree(t) {
		try { if (t && typeof t.dispose === "function" && !t.isDisposed) t.dispose(); }
		catch (e) {}
	}

	function _isDisposedErr(e) {
		var m = "";
		try { m = (e && e.message) ? e.message : String(e); } catch (e2) {}
		return m.indexOf("already disposed") >= 0 || m.indexOf("isDisposed") >= 0;
	}

	// ==================================================================
	// 5. THEME
	// ==================================================================

	function _dark() {
		try { return !!global.is_dark_mode; } catch (e) { return false; }
	}

	function _theme() {
		var d = _dark();
		if (d) {
			return {
				dark: true,
				bg:         0x05070e,
				bgCss:      "radial-gradient(ellipse at 50% 35%, #101628 0%, #04060c 75%)",
				fog:        0x04060c,
				fogNear:    520,
				fogFar:     1900,
				text:       "#e4e9fb",
				textDim:    "#8e9ab8",
				accent:     "#9fb4ff",
				panelBg:    "linear-gradient(145deg, rgba(22,27,46,0.94), rgba(12,16,30,0.96))",
				panelBorder:"rgba(140,164,235,0.24)",
				panelShadow:"0 10px 38px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.055)",
				btnBg:      "linear-gradient(135deg,#3f5aa8,#6378cf)",
				btnBgOn:    "linear-gradient(135deg,#e8b43c,#ffd36b)",
				btnFg:      "#ffffff",
				btnFgOn:    "#1a1206",
				inputBg:    "#141929",
				inputBorder:"#38415e",
				hudBg:      "rgba(8,11,20,0.74)",
				tipBg:      "linear-gradient(145deg, rgba(26,31,52,0.97), rgba(16,20,36,0.98))",
				tipBorder:  "rgba(160,180,255,0.32)",
				netBg:      "rgba(14,18,32,0.82)",
				netBorder:  "rgba(160,180,255,0.22)",
				ambient:    0.58,
				hemi1:      0x8fa4e8,
				hemi2:      0x0e1324
			};
		}
		return {
			dark: false,
			bg:         0xf2f5fc,
			bgCss:      "radial-gradient(ellipse at 50% 35%, #ffffff 0%, #dde5f4 78%)",
			fog:        0xdfe6f4,
			fogNear:    520,
			fogFar:     1900,
			text:       "#171c2b",
			textDim:    "#5d6680",
			accent:     "#2f4a9e",
			panelBg:    "linear-gradient(145deg, rgba(253,254,255,0.98), rgba(231,237,250,0.98))",
			panelBorder:"rgba(60,82,142,0.2)",
			panelShadow:"0 10px 30px rgba(58,78,138,0.15), inset 0 1px 0 rgba(255,255,255,0.92)",
			btnBg:      "linear-gradient(135deg,#4463ae,#5d7bc6)",
			btnBgOn:    "linear-gradient(135deg,#d99a16,#f0b843)",
			btnFg:      "#ffffff",
			btnFgOn:    "#241a04",
			inputBg:    "#ffffff",
			inputBorder:"#c2cce0",
			hudBg:      "rgba(246,249,255,0.86)",
			tipBg:      "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(239,244,253,0.98))",
			tipBorder:  "rgba(60,82,142,0.24)",
			netBg:      "rgba(255,255,255,0.86)",
			netBorder:  "rgba(60,82,142,0.2)",
			ambient:    0.82,
			hemi1:      0xffffff,
			hemi2:      0x97a2bd
		};
	}

	function _classColor(i) {
		if (!_fin(i) || i < 0) return 0x8a8a8a;
		return PALETTE.classes[i % PALETTE.classes.length];
	}

	function _classColorCss(i) {
		var c = _classColor(i);
		return "#" + ("000000" + c.toString(16)).slice(-6);
	}

	// ==================================================================
	// 6. HASHING / CHANGE DETECTION
	// ==================================================================

	function _fnv(h, s) {
		for (var i = 0; i < s.length; i++) {
			h ^= s.charCodeAt(i);
			h = Math.imul(h, 0x01000193) >>> 0;
		}
		return h >>> 0;
	}

	function _hashNums(arr, h, stride) {
		h = (h === undefined) ? 0x811c9dc5 : (h >>> 0);
		stride = stride || 1;
		if (!arr) return _fnv(h, "~n~");
		for (var i = 0; i < arr.length; i += stride) {
			var v = arr[i];
			if (!_fin(v)) { h = _fnv(h, "~"); continue; }
			h = _fnv(h, v.toFixed(5) + ";");
		}
		return h >>> 0;
	}

	function _revision() {
		try {
			var r = global.cnn3d_data_revision;
			return _fin(r) ? r : -1;
		} catch (e) { return -1; }
	}

	function _fingerprint(chain) {
		var h = 0x811c9dc5;
		h = _fnv(h, "n=" + (chain ? chain.length : 0) + ":");
		if (!chain) return h >>> 0;

		for (var i = 0; i < chain.length; i++) {
			var st = chain[i];
			h = _fnv(h, "s" + st.layerIdx + ":" + st.dim + ":" +
			             (st.activation || "-") + ":" + (st.className || "-") + ";");
			if (!st.layer) continue;
			try {
				var ws = st.layer.getWeights ? st.layer.getWeights() : null;
				if (!ws || !ws.length) { h = _fnv(h, "nw;"); continue; }
				for (var w = 0; w < ws.length; w++) {
					if (_tDead(ws[w])) { h = _fnv(h, "dp;"); continue; }
					var d = ws[w].dataSync();
					var sd = d.length > 3000 ? Math.ceil(d.length / 3000) : 1;
					h = _hashNums(d, h, sd);
					h = _fnv(h, "|" + d.length + ";");
				}
			} catch (e) { h = _fnv(h, "we;"); }
		}
		return h >>> 0;
	}

	function _viewHash() {
		var c = _state.cfg;
		var p = [
			"dk=" + (_dark() ? 1 : 0),
			"md=" + c.mode,
			"gr=" + c.gridRes, "mp=" + c.maxPoints,
			"mn=" + c.maxNeurons, "ml=" + c.maxLayers,
			"br=" + c.boundaryRes,
			"sd=" + (c.showData ? 1 : 0), "sf=" + (c.showFolds ? 1 : 0),
			"ss=" + (c.showSheet ? 1 : 0), "sb=" + (c.showBoundary ? 1 : 0),
			"sg=" + (c.showGrid ? 1 : 0), "sa=" + (c.showAxes ? 1 : 0),
			"so=" + c.sheetOpacity, "ko=" + c.stackOpacity,
			"sp=" + c.stackSpread, "ps=" + c.pointSize, "fw=" + c.foldWidth,
			"am=" + c.axisMode, "ax=" + c.axisX + "," + c.axisY + "," + c.axisZ,
			"cp=" + (c.convPatchMode ? 1 : 0), "cf=" + c.convMaxFilters,
			"ql=" + _state.qualityLevel
		];
		return _fnv(0x811c9dc5, p.join(";"));
	}

	// ==================================================================
	// 7. MODELL-KETTE AUFBAUEN
	// ==================================================================

	function _visibleLayers() {
		if (!_hasModel()) return [];
		try {
			var ls = global.model.layers;
			if (Array.isArray(ls) && ls.length) return ls;
		} catch (e) {}
		try {
			var all = global.model._allLayers;
			if (Array.isArray(all) && all.length) {
				return all.filter(function (l) {
					var cn = "";
					try { cn = l.getClassName ? l.getClassName() : ""; } catch (e2) {}
					if (cn === "InputLayer") return false;
					var n = l.name || "";
					if (n.indexOf("skip_proj_") >= 0) return false;
					if (n.indexOf("skip_add_") >= 0) return false;
					if (n.indexOf("skip_scale_") >= 0) return false;
					return true;
				});
			}
		} catch (e) {}
		return [];
	}

	function _actNameOf(layer) {
		if (!layer) return null;
		try {
			var cfg = layer.getConfig ? layer.getConfig() : null;
			if (cfg && cfg.activation) {
				if (typeof cfg.activation === "string") return cfg.activation.toLowerCase();
				if (cfg.activation.className) return String(cfg.activation.className).toLowerCase();
			}
		} catch (e) {}
		try {
			var cn = layer.getClassName ? layer.getClassName().toLowerCase() : "";
			if (["relu", "leakyrelu", "elu", "thresholdedrelu", "softmax", "prelu"].indexOf(cn) >= 0) {
				return cn;
			}
		} catch (e) {}
		return null;
	}

	function _isHardFold(a) {
		if (!a) return false;
		return HARD_FOLD.indexOf(String(a).toLowerCase()) >= 0;
	}
	function _isSoftFold(a) {
		if (!a) return false;
		return SOFT_FOLD.indexOf(String(a).toLowerCase()) >= 0;
	}
	function _isPassthrough(cls) {
		if (!cls) return false;
		return PASSTHROUGH.indexOf(String(cls).toLowerCase()) >= 0;
	}

	function _featDim(shape) {
		if (!Array.isArray(shape) || shape.length < 2) return null;
		var p = 1;
		for (var i = 1; i < shape.length; i++) {
			var v = shape[i];
			if (v === null || v === undefined || !_fin(v) || v <= 0) return null;
			p *= v;
		}
		return (_fin(p) && p > 0) ? p : null;
	}

	function _outShape(layer) {
		try {
			var s = layer.outputShape;
			if (Array.isArray(s) && s.length && Array.isArray(s[0])) return null;
			return s || null;
		} catch (e) { return null; }
	}

	function _inShape(layer) {
		try {
			var s = layer.inputShape;
			if (Array.isArray(s) && s.length && Array.isArray(s[0])) return null;
			return s || null;
		} catch (e) { return null; }
	}

	/**
	 * Baut die Faltungskette: jeder Eintrag beschreibt EINEN Raum
	 * (Eingaberaum oder Ausgaberaum einer Schicht).
	 *
	 * Conv2D wird im "Patch-Modus" behandelt: Das Paper schlägt vor, jeden
	 * Filter-Patch als kleines fully-connected Netz zu betrachten. Ein 3×3-Conv
	 * spannt damit einen 9D-Unterraum auf, in dem Faltung analysierbar ist.
	 */
	function _buildChain() {
		var layers = _visibleLayers();
		if (!layers.length) return { chain: [], reason: "no_layers" };

		var chain = [];

		var inShape = null;
		try {
			if (global.model.inputs && global.model.inputs.length) {
				inShape = global.model.inputs[0].shape;
			}
		} catch (e) { inShape = null; }
		if (!inShape) inShape = _inShape(layers[0]);

		chain.push({
			isInput:    true,
			layerIdx:   -1,
			layer:      null,
			dim:        _featDim(inShape),
			shape:      inShape,
			name:       _tr("origami_live_input", "Eingaberaum"),
			className:  "Input",
			activation: null,
			foldKind:   "none",
			convPatch:  null
		});

		var cfg = _state.cfg;
		var skipped = [];

		for (var i = 0; i < layers.length; i++) {
			var layer = layers[i];
			if (!layer || !_alive(layer)) continue;

			var cls = "";
			try { cls = layer.getClassName ? layer.getClassName() : ""; } catch (e) { cls = ""; }
			var clsLc = String(cls).toLowerCase();

			// Passthrough-Layer verändern den Raum nicht sichtbar –
			// Aktivierung aber übernehmen (z.B. Activation-Layer)
			if (_isPassthrough(clsLc)) {
				var paAct = _actNameOf(layer);
				if (paAct && (clsLc === "activation")) {
					var prev = chain[chain.length - 1];
					prev.activation = paAct;
					prev.foldKind = _isHardFold(paAct) ? "hard"
					              : (_isSoftFold(paAct) ? "soft" : "none");
				}
				continue;
			}

			var oShape = _outShape(layer);
			var dim = _featDim(oShape);
			var act = _actNameOf(layer);

			var convPatch = null;
			if (clsLc === "conv2d" || clsLc === "conv1d" || clsLc === "depthwiseconv2d") {
				convPatch = _convPatchInfo(layer, clsLc);
				if (convPatch && cfg.convPatchMode) {
					// Im Patch-Modus ist die relevante Dimension die Filteranzahl
					dim = Math.min(convPatch.filters, 3);
				}
			}

			if (dim === null) {
				skipped.push(cls + " (Dimension unbekannt)");
				continue;
			}

			chain.push({
				isInput:    false,
				layerIdx:   i,
				layer:      layer,
				dim:        dim,
				rawDim:     _featDim(oShape),
				shape:      oShape,
				name:       (layer.name || (cls + "_" + i)),
				className:  cls,
				activation: act,
				foldKind:   _isHardFold(act) ? "hard" : (_isSoftFold(act) ? "soft" : "none"),
				convPatch:  convPatch
			});

			if (chain.length >= cfg.maxLayers + 1) break;
		}

		if (skipped.length) {
			_log("Übersprungene Layer: " + skipped.join(", "));
		}

		if (chain.length < 2) {
			return { chain: [], reason: "too_short" };
		}

		return { chain: chain, reason: null, skipped: skipped };
	}

	/**
	 * Conv-Patch-Analyse nach dem Paper:
	 * "for convolutional layers, it should be possible to think of each filter
	 *  patch as a small fully connected network"
	 * Ein k×k-Conv mit c Eingangskanälen spannt einen (k·k·c)-dimensionalen
	 * Unterraum auf. Darin lassen sich die Faltungen genauso analysieren
	 * wie bei Dense – nur dass alle Patches das gleiche Gewicht teilen.
	 */
	function _convPatchInfo(layer, clsLc) {
		try {
			var cfgL = layer.getConfig ? layer.getConfig() : null;
			if (!cfgL) return null;

			var ks = cfgL.kernelSize;
			if (!Array.isArray(ks)) ks = [ks, ks];
			var kh = _fin(ks[0]) ? ks[0] : 3;
			var kw = _fin(ks[1]) ? ks[1] : kh;

			var filters = _fin(cfgL.filters) ? cfgL.filters : null;

			var iShape = _inShape(layer);
			var chIn = 1;
			if (Array.isArray(iShape) && iShape.length >= 2) {
				var last = iShape[iShape.length - 1];
				if (_fin(last) && last > 0) chIn = last;
			}

			if (filters === null) {
				// DepthwiseConv: Filter = Eingangskanäle × multiplier
				var mult = _fin(cfgL.depthMultiplier) ? cfgL.depthMultiplier : 1;
				filters = chIn * mult;
			}

			var patchDim = kh * kw * chIn;

			return {
				kh: kh, kw: kw,
				channelsIn: chIn,
				filters: filters,
				patchDim: patchDim,
				is1d: (clsLc === "conv1d")
			};
		} catch (e) {
			return null;
		}
	}

	function _chainSig(chain) {
		if (!chain || !chain.length) return "empty";
		var p = [];
		for (var i = 0; i < chain.length; i++) {
			var s = chain[i];
			p.push(s.layerIdx + ":" + s.dim + ":" + (s.className || "-") +
			       ":" + (s.foldKind || "-"));
		}
		return p.join("|");
	}

	// ==================================================================
	// 8. DATEN HOLEN
	// ==================================================================

	function _xyGlobal() {
		try {
			var g = global.xy_data_global;
			if (!g || typeof g !== "object") return null;
			if (!g.x) return null;
			if (_tDead(g.x)) return null;
			return g;
		} catch (e) { return null; }
	}

	function _isClassification() {
		try {
			if (typeof global.is_classification === "boolean") return global.is_classification;
		} catch (e) {}
		try {
			var g = _xyGlobal();
			if (g && g.y && !_tDead(g.y)) {
				if (g.y.shape && g.y.shape.length === 2 && g.y.shape[1] > 1) return true;
			}
		} catch (e) {}
		return false;
	}

	function _labelsArr() {
		try {
			var l = global.labels;
			if (Array.isArray(l) && l.length) return l;
		} catch (e) {}
		return null;
	}

	function _prepareData() {
		var g = _xyGlobal();
		if (!g) return false;

		var maxP = _state.cfg.maxPoints;
		if (!_fin(maxP) || maxP < 8) maxP = 600;

		var xT = g.x;
		if (_tDead(xT)) { _warn("x ist disposed"); return false; }

		var total = 0;
		try { total = (xT.shape && xT.shape[0]) ? xT.shape[0] : 0; } catch (e) { total = 0; }
		if (!_fin(total) || total < 1) { _log("0 Samples"); return false; }

		var hash = null;
		try {
			hash = (xT.id !== undefined ? "id" + xT.id : "noid") + ":" +
			       (xT.shape ? xT.shape.join("x") : "?") + ":" + total + ":" + maxP;
		} catch (e) { hash = null; }

		if (hash && hash === _state.cache.xHash &&
		    _state.cache.xTensor && !_tDead(_state.cache.xTensor)) {
			return true;
		}

		var stride = (total > maxP) ? Math.ceil(total / maxP) : 1;
		var idxs = [];
		for (var i = 0; i < total; i += stride) {
			idxs.push(i);
			if (idxs.length >= maxP) break;
		}
		if (!idxs.length) return false;

		var newX = null;
		try {
			newX = global.tf.tidy(function () {
				var it = global.tf.tensor1d(idxs, "int32");
				return global.tf.keep(global.tf.gather(xT, it));
			});
		} catch (e) {
			_err("Subsampling fehlgeschlagen: " + e);
			return false;
		}
		if (!newX || _tDead(newX)) { _tFree(newX); return false; }

		// --- Labels / Klassen ---
		var classIdx = null, classNames = null, colors = null, isReg = false;
		var yMin = 0, yMax = 1;
		var isCls = _isClassification();
		var labs = _labelsArr();

		try {
			var yT = g.y;
			if (yT && !_tDead(yT)) {
				var ys = yT.shape || [];
				var yArr = null;

				if (ys.length === 2 && ys[1] > 1) {
					yArr = global.tf.tidy(function () {
						var it = global.tf.tensor1d(idxs, "int32");
						return Array.from(global.tf.argMax(global.tf.gather(yT, it), 1).dataSync());
					});
					classIdx = yArr;
				} else if (ys.length === 2 && ys[1] === 1) {
					yArr = global.tf.tidy(function () {
						var it = global.tf.tensor1d(idxs, "int32");
						return Array.from(global.tf.gather(yT, it).reshape([-1]).dataSync());
					});
					if (isCls) classIdx = yArr.map(function (v) { return Math.round(v); });
					else { isReg = true; classIdx = yArr; }
				} else if (ys.length === 1) {
					yArr = global.tf.tidy(function () {
						var it = global.tf.tensor1d(idxs, "int32");
						return Array.from(global.tf.gather(yT, it).dataSync());
					});
					if (isCls) classIdx = yArr.map(function (v) { return Math.round(v); });
					else { isReg = true; classIdx = yArr; }
				}
			}
		} catch (e) {
			_warn("Klassen nicht ableitbar: " + e);
			classIdx = null;
		}

		if (classIdx && classIdx.length === idxs.length) {
			if (isReg) {
				var mn = Infinity, mx = -Infinity;
				for (var r = 0; r < classIdx.length; r++) {
					var v = classIdx[r];
					if (!_fin(v)) continue;
					if (v < mn) mn = v;
					if (v > mx) mx = v;
				}
				if (!_fin(mn) || !_fin(mx) || mx === mn) { mn = 0; mx = 1; }
				yMin = mn; yMax = mx;
				colors = classIdx.map(function (v) {
					return _regColor(_fin(v) ? (v - mn) / (mx - mn) : 0.5);
				});
			} else {
				var maxC = 0;
				for (var c = 0; c < classIdx.length; c++) {
					if (_fin(classIdx[c]) && classIdx[c] > maxC) maxC = classIdx[c];
				}
				classNames = [];
				for (var ci = 0; ci <= maxC; ci++) {
					classNames.push(labs && labs[ci] != null ? String(labs[ci])
					              : (_tr("origami_live_class", "Klasse") + " " + ci));
				}
				colors = classIdx.map(function (c2) { return _classColor(c2); });
			}
		} else {
			colors = new Array(idxs.length);
			for (var k = 0; k < idxs.length; k++) colors[k] = PALETTE.classes[0];
			classIdx = null;
		}

		_tFree(_state.cache.xTensor);
		_state.cache.xTensor     = newX;
		_state.cache.xHash       = hash;
		_state.cache.sampleCount = idxs.length;
		_state.cache.classIdx    = classIdx;
		_state.cache.classNames  = classNames;
		_state.cache.colors      = colors;
		_state.cache.isRegression = isReg;
		_state.cache.yMin = yMin;
		_state.cache.yMax = yMax;

		_log("Daten bereit: " + idxs.length + "/" + total + " Punkte" +
		     (classNames ? (", " + classNames.length + " Klassen") :
		      (isReg ? ", Regression" : "")));
		return true;
	}

	// Regressions-Farbrampe: tiefblau → türkis → gelb → orange
	var REG_RAMP = [
		[0.00, [ 38,  70, 160]],
		[0.25, [ 26, 160, 184]],
		[0.50, [ 90, 200, 140]],
		[0.75, [230, 190,  60]],
		[1.00, [232, 110,  40]]
	];

	function _regColor(t) {
		if (!_fin(t)) t = 0.5;
		t = Math.max(0, Math.min(1, t));
		for (var i = 0; i + 1 < REG_RAMP.length; i++) {
			var a = REG_RAMP[i], b = REG_RAMP[i + 1];
			if (t >= a[0] && t <= b[0]) {
				var sp = b[0] - a[0];
				var f = sp > 1e-9 ? (t - a[0]) / sp : 0;
				f = f * f * (3 - 2 * f);
				var r = Math.round(a[1][0] + (b[1][0] - a[1][0]) * f);
				var gg = Math.round(a[1][1] + (b[1][1] - a[1][1]) * f);
				var bb = Math.round(a[1][2] + (b[1][2] - a[1][2]) * f);
				return (r << 16) | (gg << 8) | bb;
			}
		}
		var L = REG_RAMP[REG_RAMP.length - 1][1];
		return (L[0] << 16) | (L[1] << 8) | L[2];
	}

	// ==================================================================
	// 9. ACHSENWAHL OHNE PCA
	// ==================================================================

	/**
	 * Bei >3 Dimensionen: Wähle die 3 Neuronen mit der größten
	 * Aktivierungsvarianz. Das ist kein PCA, sondern reine Achsenauswahl –
	 * die Faltkanten bleiben dadurch exakte Hyperebenen im gezeigten Raum.
	 */
	function _pickAxes(flatData, nSamples, dim) {
		var cfg = _state.cfg;

		if (dim <= 3) {
			var ax = [];
			for (var d = 0; d < dim; d++) ax.push(d);
			while (ax.length < 3) ax.push(-1);
			return { axes: ax, auto: false, variances: null };
		}

		if (cfg.axisMode === "manual") {
			var mx = function (v) {
				return (_fin(v) && v >= 0 && v < dim) ? Math.floor(v) : 0;
			};
			return {
				axes: [mx(cfg.axisX), mx(cfg.axisY), mx(cfg.axisZ)],
				auto: false, variances: null
			};
		}

		// Varianz pro Neuron
		var mean = new Float64Array(dim);
		var m2   = new Float64Array(dim);
		var n = 0;

		for (var s = 0; s < nSamples; s++) {
			n++;
			var base = s * dim;
			for (var k = 0; k < dim; k++) {
				var v = flatData[base + k];
				if (!_fin(v)) v = 0;
				var delta = v - mean[k];
				mean[k] += delta / n;
				m2[k]   += delta * (v - mean[k]);
			}
		}

		var vars = new Array(dim);
		for (var q = 0; q < dim; q++) {
			vars[q] = { idx: q, v: (n > 1 ? m2[q] / (n - 1) : 0) };
			if (!_fin(vars[q].v)) vars[q].v = 0;
		}
		var sorted = vars.slice().sort(function (a, b) { return b.v - a.v; });

		return {
			axes: [
				sorted[0] ? sorted[0].idx : 0,
				sorted[1] ? sorted[1].idx : 0,
				sorted[2] ? sorted[2].idx : 0
			],
			auto: true,
			variances: vars
		};
	}

	// ==================================================================
	// 10. FORWARD-PASS DURCH DIE KETTE
	// ==================================================================

	function _flat2D(t) {
		if (!t || !t.shape) return t;
		if (t.shape.length > 2) {
			var p = 1;
			for (var d = 1; d < t.shape.length; d++) p *= t.shape[d];
			return t.reshape([t.shape[0], p]);
		}
		if (t.shape.length === 1) return t.reshape([t.shape[0], 1]);
		return t;
	}

	/**
	 * Projiziert flache Daten (n × dim) auf die 3 gewählten Achsen
	 * und erzeugt Float32Array-Positionen für three.js.
	 */
	function _project(flat, n, dim, axes, scale) {
		var pos = new Float32Array(n * 3);
		var ax = axes[0], ay = axes[1], az = axes[2];
		var s = _fin(scale) ? scale : 1;

		for (var i = 0; i < n; i++) {
			var b = i * dim;
			var vx = (ax >= 0 && ax < dim) ? flat[b + ax] : 0;
			var vy = (ay >= 0 && ay < dim) ? flat[b + ay] : 0;
			var vz = (az >= 0 && az < dim) ? flat[b + az] : 0;
			pos[i * 3]     = _fin(vx) ? vx * s : 0;
			pos[i * 3 + 1] = _fin(vy) ? vy * s : 0;
			pos[i * 3 + 2] = _fin(vz) ? vz * s : 0;
		}
		return pos;
	}

	/**
	 * Robuste Normalisierung: skaliere so, dass das 2.–98.-Perzentil
	 * in eine Weltkugel von Radius ~100 passt. Verhindert, dass ein
	 * einziges Ausreißerneuron die gesamte Szene kollabiert.
	 */
	function _robustScale(flat, n, dim, axes, targetRadius) {
		var vals = [];
		var step = Math.max(1, Math.floor(n / 400));
		for (var i = 0; i < n; i += step) {
			var b = i * dim;
			for (var a = 0; a < 3; a++) {
				var ai = axes[a];
				if (ai < 0 || ai >= dim) continue;
				var v = flat[b + ai];
				if (_fin(v)) vals.push(Math.abs(v));
			}
		}
		if (!vals.length) return 1;
		vals.sort(function (p, q) { return p - q; });
		var hi = vals[Math.floor(vals.length * 0.98)];
		if (!_fin(hi) || hi < 1e-9) hi = vals[vals.length - 1];
		if (!_fin(hi) || hi < 1e-9) return 1;
		var tr = _fin(targetRadius) ? targetRadius : 100;
		return tr / hi;
	}

	/**
	 * Einen Layer per Hand durch die Faltung schieben (CPU, Dense).
	 * Gibt zusätzlich die Preaktivierung zurück – nur daraus lassen
	 * sich die Faltkanten (x̃ = 0) exakt bestimmen.
	 */
	function _denseForward(flat, n, inDim, layer) {
		if (!layer || !_alive(layer)) return null;

		var ws = null;
		try { ws = layer.getWeights ? layer.getWeights() : null; } catch (e) { ws = null; }
		if (!ws || !ws.length || _tDead(ws[0])) return null;

		var kShape = ws[0].shape;
		if (!Array.isArray(kShape) || kShape.length !== 2) return null;
		if (kShape[0] !== inDim) {
			_log("Dense-Forward: Dimension passt nicht (" + kShape[0] + " vs " + inDim + ")");
			return null;
		}

		var kernel = ws[0].dataSync();
		var bias = (ws.length > 1 && !_tDead(ws[1])) ? ws[1].dataSync() : null;
		var units = kShape[1];
		if (!_fin(units) || units < 1) return null;

		var act = _actNameOf(layer);
		var pre  = new Float32Array(n * units);
		var post = new Float32Array(n * units);

		for (var i = 0; i < n; i++) {
			var rowIn  = i * inDim;
			var rowOut = i * units;
			for (var u = 0; u < units; u++) {
				var s = 0;
				for (var d = 0; d < inDim; d++) {
					var xv = flat[rowIn + d];
					if (!_fin(xv)) xv = 0;
					s += xv * kernel[d * units + u];
				}
				if (bias && _fin(bias[u])) s += bias[u];
				if (!_fin(s)) s = 0;

				pre[rowOut + u]  = s;
				post[rowOut + u] = _applyAct(s, act);
			}
		}

		_tFree(null); // Gewichte gehören dem Layer, nicht freigeben

		return {
			pre:   pre,
			post:  post,
			dim:   units,
			n:     n,
			act:   act,
			kernel: kernel,
			bias:   bias,
			inDim:  inDim
		};
	}

	/**
	 * Die Aktivierungsfunktion als Skalaroperation.
	 * "hard" = echter Knick (Faltkante), "soft" = weiche Biegung.
	 */
	function _applyAct(s, act) {
		if (!act || act === "linear") return s;
		switch (String(act).toLowerCase()) {
			case "relu":            return s > 0 ? s : 0;
			case "relu6":           return s > 0 ? (s < 6 ? s : 6) : 0;
			case "leakyrelu":       return s > 0 ? s : s * 0.3;
			case "elu":             return s > 0 ? s : (Math.exp(Math.max(s, -60)) - 1);
			case "selu":            return s > 0 ? 1.0507 * s
			                                     : 1.0507 * 1.6733 * (Math.exp(Math.max(s, -60)) - 1);
			case "thresholdedrelu": return s > 1 ? s : 0;
			case "sigmoid":         return 1 / (1 + Math.exp(-_clampExp(s)));
			case "hardsigmoid":     return Math.max(0, Math.min(1, 0.2 * s + 0.5));
			case "tanh":            return Math.tanh(s);
			case "softsign":        return s / (1 + Math.abs(s));
			case "softplus":        return Math.log(1 + Math.exp(_clampExp(s)));
			case "swish":
			case "silu":            return s / (1 + Math.exp(-_clampExp(s)));
			case "gelu":            return 0.5 * s * (1 + Math.tanh(
			                               0.7978845608 * (s + 0.044715 * s * s * s)));
			case "mish":            return s * Math.tanh(Math.log(1 + Math.exp(_clampExp(s))));
			default:                return s;
		}
	}

	function _clampExp(s) {
		if (!_fin(s)) return 0;
		if (s > 60) return 60;
		if (s < -60) return -60;
		return s;
	}

	/**
	 * Conv-Patch-Forward: Jeder Filter wird als kleines Dense-Netz über
	 * dem Patch-Unterraum behandelt (siehe Paper, Abschnitt "Related work":
	 * "it should be possible to think of each filter patch as a small
	 *  fully connected network"). Wir falten den Patch-Raum, nicht das Bild.
	 */
	function _convPatchForward(flat, n, inDim, layer, info) {
		if (!layer || !_alive(layer) || !info) return null;

		var ws = null;
		try { ws = layer.getWeights ? layer.getWeights() : null; } catch (e) { ws = null; }
		if (!ws || !ws.length || _tDead(ws[0])) return null;

		var kShape = ws[0].shape;        // [kh, kw, chIn, filters]
		if (!Array.isArray(kShape) || kShape.length !== 4) return null;

		var kh = kShape[0], kw = kShape[1], chIn = kShape[2], filters = kShape[3];
		var patchDim = kh * kw * chIn;
		if (patchDim !== inDim) {
			// Eingangsdaten sind nicht im Patch-Raum — wir bauen Patches
			// kuenstlich, indem wir den Eingaberaum zyklisch auffuellen.
			// Das ist eine Projektion, keine echte Konvolution: fuer die
			// Faltungs-Geometrie reicht das, weil nur die Hyperebenen zaehlen.
			_log("Conv-Patch: Dimension " + inDim + " != Patch " + patchDim +
			     " — zyklische Projektion");
		}

		var kernel = ws[0].dataSync();
		var bias = (ws.length > 1 && !_tDead(ws[1])) ? ws[1].dataSync() : null;

		var limit = Math.min(filters, _state.cfg.convMaxFilters);
		var act = _actNameOf(layer);

		var pre  = new Float32Array(n * limit);
		var post = new Float32Array(n * limit);

		// Flaches Kernel-Layout: [kh][kw][chIn][f] -> Index
		// ((y*kw + x)*chIn + c)*filters + f
		for (var i = 0; i < n; i++) {
			var rowIn  = i * inDim;
			var rowOut = i * limit;
			for (var f = 0; f < limit; f++) {
				var s = 0;
				for (var p = 0; p < patchDim; p++) {
					var src = flat[rowIn + (p % inDim)];
					if (!_fin(src)) src = 0;
					s += src * kernel[p * filters + f];
				}
				if (bias && _fin(bias[f])) s += bias[f];
				if (!_fin(s)) s = 0;
				pre[rowOut + f]  = s;
				post[rowOut + f] = _applyAct(s, act);
			}
		}

		return {
			pre:    pre,
			post:   post,
			dim:    limit,
			n:      n,
			act:    act,
			kernel: kernel,
			bias:   bias,
			inDim:  inDim,
			isConv: true,
			filters: filters,
			shown:   limit
		};
	}

	// ==================================================================
	// 11. GITTER (das "Blatt Papier")
	// ==================================================================

	/**
	 * Erzeugt das Eingabegitter — das "Blatt", das gefaltet wird.
	 * 1D -> Linie, 2D -> Fläche, 3D -> Würfel-Hülle (innen leer, sonst
	 * verdeckt die Aussenflaeche alles).
	 */
	function _makeSheet(bounds, dim, res) {
		if (!bounds) return null;
		if (!_fin(dim) || dim < 1) return null;
		if (!_fin(res) || res < 3) res = 15;

		// Auflösungs-Deckel je Topologie, damit die Vertexzahl nicht explodiert
		if (dim === 1 && res > 400) res = 400;
		if (dim === 2 && res > 81)  res = 81;
		if (dim >= 3 && res > 21)   res = 21;

		function axisVals(b) {
			var mid  = (b.lo + b.hi) * 0.5;
			var half = (b.hi - b.lo) * 0.5 * 1.12;
			if (!_fin(half) || half <= 1e-9) half = 0.5;
			var a = new Float64Array(res);
			for (var i = 0; i < res; i++) {
				a[i] = mid - half + 2 * half * (i / (res - 1));
			}
			return a;
		}

		var ax = axisVals(bounds.x);
		var ay = (dim >= 2) ? axisVals(bounds.y) : null;
		var az = (dim >= 3) ? axisVals(bounds.z) : null;

		var coords, n, lines = [], tris = [], uvs = null;

		if (dim === 1) {
			n = res;
			coords = new Float64Array(n * 1);
			for (var i1 = 0; i1 < res; i1++) coords[i1] = ax[i1];
			var ch = [];
			for (var c1 = 0; c1 < res; c1++) ch.push(c1);
			lines.push(ch);

		} else if (dim === 2) {
			n = res * res;
			coords = new Float64Array(n * 2);
			uvs = new Float32Array(n * 2);
			for (var y2 = 0; y2 < res; y2++) {
				for (var x2 = 0; x2 < res; x2++) {
					var k2 = y2 * res + x2;
					coords[k2 * 2]     = ax[x2];
					coords[k2 * 2 + 1] = ay[y2];
					uvs[k2 * 2]     = x2 / (res - 1);
					uvs[k2 * 2 + 1] = y2 / (res - 1);
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
					var b2 = a2 + 1;
					var c2 = (qy + 1) * res + qx + 1;
					var d2 = (qy + 1) * res + qx;
					tris.push(a2, b2, c2);
					tris.push(a2, c2, d2);
				}
			}

		} else {
			// 3D: nur die 6 Außenflächen des Würfels (Hülle)
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
			var I3 = function (x, y, z) { return (z * res + y) * res + x; };
			var last = res - 1;

			function addFaceQuads(get) {
				for (var a = 0; a + 1 < res; a++) {
					for (var b = 0; b + 1 < res; b++) {
						var p0 = get(a, b);
						var p1 = get(a + 1, b);
						var p2 = get(a + 1, b + 1);
						var p3 = get(a, b + 1);
						tris.push(p0, p1, p2);
						tris.push(p0, p2, p3);
					}
				}
			}
			addFaceQuads(function (a, b) { return I3(a, b, 0); });
			addFaceQuads(function (a, b) { return I3(a, b, last); });
			addFaceQuads(function (a, b) { return I3(a, 0, b); });
			addFaceQuads(function (a, b) { return I3(a, last, b); });
			addFaceQuads(function (a, b) { return I3(0, a, b); });
			addFaceQuads(function (a, b) { return I3(last, a, b); });

			// Kantenlinien nur auf den Würfelkanten (sonst zu dicht)
			function addEdgeLine(get) {
				var L = [];
				for (var t = 0; t < res; t++) L.push(get(t));
				lines.push(L);
			}
			addEdgeLine(function (t) { return I3(t, 0, 0); });
			addEdgeLine(function (t) { return I3(t, last, 0); });
			addEdgeLine(function (t) { return I3(t, 0, last); });
			addEdgeLine(function (t) { return I3(t, last, last); });
			addEdgeLine(function (t) { return I3(0, t, 0); });
			addEdgeLine(function (t) { return I3(last, t, 0); });
			addEdgeLine(function (t) { return I3(0, t, last); });
			addEdgeLine(function (t) { return I3(last, t, last); });
			addEdgeLine(function (t) { return I3(0, 0, t); });
			addEdgeLine(function (t) { return I3(last, 0, t); });
			addEdgeLine(function (t) { return I3(0, last, t); });
			addEdgeLine(function (t) { return I3(last, last, t); });
		}

		return {
			coords: coords,
			n:      n,
			dim:    dim,
			topo:   dim,
			res:    res,
			lines:  lines,
			tris:   tris,
			uvs:    uvs,
			bounds: bounds
		};
	}

	function _boundsOf(flat, n, dim, axes, pad) {
		if (!flat || !n) return null;
		var p = _fin(pad) ? pad : 0.1;

		function mm(ai) {
			if (ai < 0 || ai >= dim) return { lo: -0.5, hi: 0.5 };
			var lo = Infinity, hi = -Infinity;
			for (var i = 0; i < n; i++) {
				var v = flat[i * dim + ai];
				if (!_fin(v)) continue;
				if (v < lo) lo = v;
				if (v > hi) hi = v;
			}
			if (!_fin(lo) || !_fin(hi)) return { lo: -0.5, hi: 0.5 };
			if (hi - lo < 1e-9) { lo -= 0.5; hi += 0.5; }
			var sp = (hi - lo) * p;
			return { lo: lo - sp, hi: hi + sp };
		}

		return {
			x: mm(axes[0]),
			y: mm(axes[1]),
			z: mm(axes[2]),
			dim: dim
		};
	}

	// ==================================================================
	// 12. PIPELINE: DIE KOMPLETTE FALTUNGSKETTE
	// ==================================================================

	/**
	 * Hauptberechnung. Schiebt Daten UND Gitter Layer für Layer durch,
	 * sammelt pro Stufe:
	 *   - Datenpunkte (projiziert)
	 *   - Gitter-Positionen (das gefaltete Blatt)
	 *   - Faltkanten (Hyperebenen x̃ = 0 im EINGANGSRAUM der Stufe)
	 *   - Halbraum-Zuordnung pro Neuron (für Stack-Modus)
	 *   - Rückprojizierte Entscheidungsgrenze (für Boundary-Modus)
	 */
	function _computePipeline(chain) {
		if (!chain || chain.length < 2) return null;
		if (!_hasTF()) return null;
		if (!_state.cache.xTensor || _tDead(_state.cache.xTensor)) return null;

		var cfg = _state.cfg;
		var nSamples = _state.cache.sampleCount;

		// --- Eingabedaten flach lesen ---
		var inFlat = null, inDim = 0;
		try {
			var pack = global.tf.tidy(function () {
				var t = _flat2D(_state.cache.xTensor);
				return { d: t.dataSync(), dim: t.shape[1], n: t.shape[0] };
			});
			inFlat = pack.d;
			inDim  = pack.dim;
			nSamples = pack.n;
		} catch (e) {
			_err("Eingabedaten nicht lesbar: " + e);
			return null;
		}
		if (!inFlat || !_fin(inDim) || inDim < 1) return null;

		var stages = [];
		var curFlat = inFlat;
		var curDim  = inDim;

		// --- Stufe 0: Eingaberaum ---
		var axes0 = _pickAxes(curFlat, nSamples, curDim);
		var scale0 = _robustScale(curFlat, nSamples, curDim, axes0.axes, 100);
		var b0 = _boundsOf(curFlat, nSamples, curDim, axes0.axes, 0.12);

		var sheetDim = Math.min(curDim, 3);
		var sheet = _makeSheet(b0, sheetDim, cfg.gridRes);

		// Gitter in den vollen Eingaberaum einbetten (restliche Achsen = Mittelwert)
		var sheetFlat = null, sheetN = 0;
		if (sheet) {
			sheetN = sheet.n;
			sheetFlat = new Float64Array(sheetN * curDim);

			// Mittelwerte der nicht gezeigten Achsen
			var means = new Float64Array(curDim);
			for (var s0 = 0; s0 < nSamples; s0++) {
				for (var d0 = 0; d0 < curDim; d0++) {
					var vv = curFlat[s0 * curDim + d0];
					if (_fin(vv)) means[d0] += vv;
				}
			}
			for (var dm = 0; dm < curDim; dm++) means[dm] /= Math.max(1, nSamples);

			for (var gi = 0; gi < sheetN; gi++) {
				for (var dd = 0; dd < curDim; dd++) {
					sheetFlat[gi * curDim + dd] = means[dd];
				}
				for (var aa = 0; aa < sheetDim; aa++) {
					var ai = axes0.axes[aa];
					if (ai >= 0 && ai < curDim) {
						sheetFlat[gi * curDim + ai] = sheet.coords[gi * sheetDim + aa];
					}
				}
			}
		}

		stages.push({
			index:      0,
			isInput:    true,
			name:       chain[0].name,
			className:  "Input",
			activation: null,
			foldKind:   "none",
			dim:        curDim,
			axes:       axes0.axes,
			axesAuto:   axes0.auto,
			variances:  axes0.variances,
			scale:      scale0,
			bounds:     b0,
			dataPos:    _project(curFlat, nSamples, curDim, axes0.axes, scale0),
			dataFlat:   curFlat,
			sheet:      sheet,
			sheetPos:   sheet ? _project(sheetFlat, sheetN, curDim, axes0.axes, scale0) : null,
			sheetFlat:  sheetFlat,
			sheetN:     sheetN,
			folds:      null,
			halfspaces: null,
			preact:     null
		});

		// --- Weitere Stufen ---
		for (var li = 1; li < chain.length; li++) {
			var st = chain[li];
			var fw = null;

			var clsLc = String(st.className || "").toLowerCase();

			if (clsLc === "dense") {
				fw = _denseForward(curFlat, nSamples, curDim, st.layer);
			} else if (st.convPatch && cfg.convPatchMode) {
				fw = _convPatchForward(curFlat, nSamples, curDim, st.layer, st.convPatch);
			} else {
				_log("Stufe " + li + " (" + st.className + ") nicht faltbar — Kette endet");
				break;
			}

			if (!fw) {
				_log("Forward für Stufe " + li + " fehlgeschlagen — Kette endet");
				break;
			}

			// --- Faltkanten: Hyperebenen im EINGANGSRAUM dieser Stufe ---
			var folds = _extractFolds(fw, curDim, stages[stages.length - 1], st.foldKind);

			// --- Gitter mitfalten ---
			var sFw = null;
			if (sheetFlat && sheetN) {
				if (clsLc === "dense") {
					sFw = _denseForward(sheetFlat, sheetN, curDim, st.layer);
				} else if (st.convPatch && cfg.convPatchMode) {
					sFw = _convPatchForward(sheetFlat, sheetN, curDim, st.layer, st.convPatch);
				}
			}

			// --- Achsenwahl im neuen Raum ---
			var axesN = _pickAxes(fw.post, nSamples, fw.dim);
			var scaleN = _robustScale(fw.post, nSamples, fw.dim, axesN.axes, 100);
			var bN = _boundsOf(fw.post, nSamples, fw.dim, axesN.axes, 0.12);

			// --- Halbräume (Stack-Modus) ---
			var halfs = _buildHalfspaces(fw, curDim, stages[stages.length - 1], st.foldKind);

			stages.push({
				index:      li,
				isInput:    false,
				name:       st.name,
				className:  st.className,
				activation: st.activation,
				foldKind:   st.foldKind,
				dim:        fw.dim,
				rawDim:     st.rawDim,
				axes:       axesN.axes,
				axesAuto:   axesN.auto,
				variances:  axesN.variances,
				scale:      scaleN,
				bounds:     bN,
				dataPos:    _project(fw.post, nSamples, fw.dim, axesN.axes, scaleN),
				dataFlat:   fw.post,
				preact:     fw.pre,
				sheet:      sheet,
				sheetPos:   (sFw && sheet)
				            ? _project(sFw.post, sheetN, sFw.dim, axesN.axes, scaleN)
				            : null,
				sheetFlat:  sFw ? sFw.post : null,
				sheetN:     sheetN,
				folds:      folds,
				halfspaces: halfs,
				kernel:     fw.kernel,
				bias:       fw.bias,
				inDim:      fw.inDim,
				isConv:     !!fw.isConv,
				filters:    fw.filters || null,
				shown:      fw.shown || fw.dim
			});

			curFlat = fw.post;
			curDim  = fw.dim;
			sheetFlat = sFw ? sFw.post : null;

			if (stages.length > cfg.maxLayers + 1) break;
		}

		if (stages.length < 2) return null;

		// --- Entscheidungsgrenze rückprojizieren ---
		var boundary = _backprojectBoundary(stages, nSamples);

		return {
			stages:   stages,
			nSamples: nSamples,
			boundary: boundary,
			built:    Date.now()
		};
	}

	/**
	 * Faltkanten extrahieren. Jedes Neuron u definiert die Hyperebene
	 * w_u · x + b_u = 0 im Eingangsraum. Diese wird auf die 3 gezeigten
	 * Achsen projiziert und am Bounding-Box geclippt — das ergibt die
	 * weissen gestrichelten Linien aus dem Video.
	 */
	function _extractFolds(fw, inDim, prevStage, foldKind) {
		if (!fw || !fw.kernel || !prevStage) return null;
		if (foldKind === "none") return null;

		var cfg = _state.cfg;
		var axes = prevStage.axes;
		var bounds = prevStage.bounds;
		var scale = prevStage.scale;
		if (!bounds) return null;

		var units = fw.dim;
		var limit = cfg.maxNeurons;
		if (!_fin(limit) || limit < 1) limit = 16;
		if (limit > units) limit = units;

		var axesIdx = [axes[0], axes[1], axes[2]];
		var planes = [];

		for (var u = 0; u < units && planes.length < limit; u++) {
			// Gewichtsvektor des Neurons u, auf die 3 gezeigten Achsen projiziert
			var w3 = [0, 0, 0];
			var normFull = 0;
			var okPlane = true;

			for (var d = 0; d < inDim; d++) {
				var kv = fw.kernel[d * units + u];
				if (!_fin(kv)) { okPlane = false; break; }
				normFull += kv * kv;
			}
			if (!okPlane) continue;
			if (normFull < 1e-14) continue;

			for (var a = 0; a < 3; a++) {
				var ai = axesIdx[a];
				if (ai < 0 || ai >= inDim) { w3[a] = 0; continue; }
				var kv2 = fw.kernel[ai * units + u];
				w3[a] = _fin(kv2) ? kv2 : 0;
			}

			var b = (fw.bias && _fin(fw.bias[u])) ? fw.bias[u] : 0;

			// Der nicht gezeigte Teil des Skalarprodukts wird durch den
			// Mittelwert der verborgenen Achsen ersetzt -> effektiver Bias.
			// Nur so liegt die Faltkante dort, wo sie die Daten wirklich trifft.
			var bEff = b;
			if (inDim > 3 && prevStage.dataFlat) {
				var meanDot = 0;
				var nS = prevStage.dataPos ? (prevStage.dataPos.length / 3) : 0;
				if (nS > 0) {
					var sumDot = 0;
					var step = Math.max(1, Math.floor(nS / 200));
					var cnt = 0;
					for (var s = 0; s < nS; s += step) {
						var base = s * inDim;
						var acc = 0;
						for (var dd = 0; dd < inDim; dd++) {
							if (dd === axesIdx[0] || dd === axesIdx[1] ||
							    dd === axesIdx[2]) continue;
							var xv = prevStage.dataFlat[base + dd];
							if (!_fin(xv)) continue;
							acc += xv * fw.kernel[dd * units + u];
						}
						sumDot += acc;
						cnt++;
					}
					if (cnt > 0) meanDot = sumDot / cnt;
				}
				bEff = b + meanDot;
			}

			var n3 = Math.sqrt(w3[0] * w3[0] + w3[1] * w3[1] + w3[2] * w3[2]);
			if (n3 < 1e-12) continue;   // Hyperebene liegt senkrecht zur Ansicht

			// Anteil des Gewichts, der in den gezeigten Raum zeigt.
			// Nahe 1 = echte Faltkante im Bild; nahe 0 = Faltung geschieht
			// in einer verborgenen Richtung (laut Paper genau der interessante
			// Fall – der "Hammer aus einer unbenutzten Dimension").
			var visible = n3 / Math.sqrt(normFull);

			// Anteil negativer Preaktivierungen = wie viele Punkte die Falte trifft
			var negFrac = 0;
			if (fw.pre) {
				var nN = fw.n, neg = 0;
				var stepN = Math.max(1, Math.floor(nN / 400));
				var cN = 0;
				for (var q = 0; q < nN; q += stepN) {
					if (fw.pre[q * units + u] < 0) neg++;
					cN++;
				}
				negFrac = cN > 0 ? neg / cN : 0;
			}

			// Ein Neuron, das ALLE oder KEINE Punkte abschneidet, faltet nichts
			var active = (negFrac > 0.02 && negFrac < 0.98);

			var geo = _clipPlane(w3, bEff, bounds, prevStage.dim, scale);
			if (!geo) continue;

			planes.push({
				unit:     u,
				w:        w3,
				b:        bEff,
				bRaw:     b,
				norm:     n3,
				normFull: Math.sqrt(normFull),
				visible:  visible,
				negFrac:  negFrac,
				active:   active,
				kind:     foldKind,
				segs:     geo.segs,
				poly:     geo.poly,
				centroid: geo.centroid,
				normal:   geo.normal
			});
		}

		if (!planes.length) return null;

		// Nach "Faltwirkung" sortieren: aktive Falten zuerst
		planes.sort(function (p, q) {
			var sp = (p.active ? 1 : 0) * 2 + p.visible;
			var sq = (q.active ? 1 : 0) * 2 + q.visible;
			return sq - sp;
		});

		return {
			planes:  planes,
			units:   units,
			shown:   planes.length,
			kind:    foldKind
		};
	}

	/**
	 * Hyperebene w·x + b = 0 am Bounding-Box clippen.
	 * Liefert sowohl Liniensegmente (die weissen Faltkanten) als auch
	 * das Polygon (die eingefärbten Halbraum-Flächen).
	 */
	function _clipPlane(w, b, bounds, dim, scale) {
		if (!bounds) return null;
		var s = _fin(scale) ? scale : 1;

		var x0 = bounds.x.lo, x1 = bounds.x.hi;
		var y0 = bounds.y.lo, y1 = bounds.y.hi;
		var z0 = bounds.z.lo, z1 = bounds.z.hi;

		if (dim === 1) {
			if (Math.abs(w[0]) < 1e-12) return null;
			var xc = -b / w[0];
			if (!_fin(xc) || xc < x0 || xc > x1) return null;
			var tick = (x1 - x0) * 0.08;
			if (!_fin(tick) || tick <= 0) tick = 0.1;
			return {
				segs: [[xc * s, -tick * s, 0], [xc * s, tick * s, 0]],
				poly: null,
				centroid: [xc * s, 0, 0],
				normal: [1, 0, 0]
			};
		}

		if (dim === 2) {
			var pts = [];
			var eps = 1e-12;

			if (Math.abs(w[1]) > eps) {
				var yA = -(w[0] * x0 + b) / w[1];
				var yB = -(w[0] * x1 + b) / w[1];
				if (_fin(yA) && yA >= y0 && yA <= y1) pts.push([x0, yA]);
				if (_fin(yB) && yB >= y0 && yB <= y1) pts.push([x1, yB]);
			}
			if (Math.abs(w[0]) > eps) {
				var xA = -(w[1] * y0 + b) / w[0];
				var xB = -(w[1] * y1 + b) / w[0];
				if (_fin(xA) && xA >= x0 && xA <= x1) pts.push([xA, y0]);
				if (_fin(xB) && xB >= x0 && xB <= x1) pts.push([xB, y1]);
			}
			if (pts.length < 2) return null;

			// Die zwei weitest entfernten Schnittpunkte wählen
			var best = [pts[0], pts[1]], bestD = -1;
			for (var i = 0; i < pts.length; i++) {
				for (var j = i + 1; j < pts.length; j++) {
					var dx = pts[i][0] - pts[j][0];
					var dy = pts[i][1] - pts[j][1];
					var dd = dx * dx + dy * dy;
					if (dd > bestD) { bestD = dd; best = [pts[i], pts[j]]; }
				}
			}
			if (bestD <= 1e-14) return null;

			// Halbraum-Polygon: die Seite, auf der w·x + b < 0 gilt
			// (das ist die Seite, die von ReLU plattgedrückt wird)
			var corners = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
			var negCorners = [];
			for (var c = 0; c < corners.length; c++) {
				var f = w[0] * corners[c][0] + w[1] * corners[c][1] + b;
				if (f < 0) negCorners.push(corners[c]);
			}

			var poly = null;
			if (negCorners.length >= 1) {
				var ring = negCorners.concat([best[0], best[1]]);
				poly = _sortRing2D(ring);
			}

			return {
				segs: [
					[best[0][0] * s, best[0][1] * s, 0],
					[best[1][0] * s, best[1][1] * s, 0]
				],
				poly: poly ? poly.map(function (p) {
					return [p[0] * s, p[1] * s, 0];
				}) : null,
				centroid: [
					(best[0][0] + best[1][0]) * 0.5 * s,
					(best[0][1] + best[1][1]) * 0.5 * s,
					0
				],
				normal: [w[0], w[1], 0]
			};
		}

		// --- 3D: Schnittpolygon mit dem Würfel ---
		var C = [
			[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
			[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]
		];
		var E = [
			[0,1],[1,2],[2,3],[3,0],
			[4,5],[5,6],[6,7],[7,4],
			[0,4],[1,5],[2,6],[3,7]
		];

		function fv(p) { return w[0]*p[0] + w[1]*p[1] + w[2]*p[2] + b; }

		var ring3 = [];
		for (var e = 0; e < E.length; e++) {
			var pA = C[E[e][0]], pB = C[E[e][1]];
			var fA = fv(pA), fB = fv(pB);
			if (!_fin(fA) || !_fin(fB)) continue;
			if ((fA > 0 && fB > 0) || (fA < 0 && fB < 0)) continue;
			var den = fA - fB;
			if (Math.abs(den) < 1e-14) continue;
			var t = fA / den;
			if (t < 0 || t > 1) continue;
			ring3.push([
				pA[0] + (pB[0] - pA[0]) * t,
				pA[1] + (pB[1] - pA[1]) * t,
				pA[2] + (pB[2] - pA[2]) * t
			]);
		}
		if (ring3.length < 3) return null;

		var sorted3 = _sortRing3D(ring3, w);
		if (!sorted3 || sorted3.length < 3) return null;

		var segs = [];
		for (var k = 0; k < sorted3.length; k++) {
			var a1 = sorted3[k];
			var b1 = sorted3[(k + 1) % sorted3.length];
			segs.push([a1[0]*s, a1[1]*s, a1[2]*s]);
			segs.push([b1[0]*s, b1[1]*s, b1[2]*s]);
		}

		var cx = 0, cy = 0, cz = 0;
		for (var m = 0; m < sorted3.length; m++) {
			cx += sorted3[m][0]; cy += sorted3[m][1]; cz += sorted3[m][2];
		}
		cx /= sorted3.length; cy /= sorted3.length; cz /= sorted3.length;

		return {
			segs: segs,
			poly: sorted3.map(function (p) { return [p[0]*s, p[1]*s, p[2]*s]; }),
			centroid: [cx*s, cy*s, cz*s],
			normal: [w[0], w[1], w[2]]
		};
	}

	function _sortRing2D(pts) {
		if (!pts || pts.length < 3) return null;
		var cx = 0, cy = 0;
		for (var i = 0; i < pts.length; i++) { cx += pts[i][0]; cy += pts[i][1]; }
		cx /= pts.length; cy /= pts.length;
		var withAng = pts.map(function (p) {
			return { p: p, a: Math.atan2(p[1] - cy, p[0] - cx) };
		});
		withAng.sort(function (u, v) { return u.a - v.a; });
		return withAng.map(function (o) { return o.p; });
	}

	function _sortRing3D(pts, w) {
		if (!pts || pts.length < 3) return null;

		var cx = 0, cy = 0, cz = 0;
		for (var i = 0; i < pts.length; i++) {
			cx += pts[i][0]; cy += pts[i][1]; cz += pts[i][2];
		}
		cx /= pts.length; cy /= pts.length; cz /= pts.length;

		var nl = Math.sqrt(w[0]*w[0] + w[1]*w[1] + w[2]*w[2]) || 1;
		var n = [w[0]/nl, w[1]/nl, w[2]/nl];

		var help = (Math.abs(n[0]) < 0.9) ? [1,0,0] : [0,1,0];
		var u1 = [
			help[1]*n[2] - help[2]*n[1],
			help[2]*n[0] - help[0]*n[2],
			help[0]*n[1] - help[1]*n[0]
		];
		var u1l = Math.sqrt(u1[0]*u1[0] + u1[1]*u1[1] + u1[2]*u1[2]) || 1;
		u1 = [u1[0]/u1l, u1[1]/u1l, u1[2]/u1l];
		var u2 = [
			n[1]*u1[2] - n[2]*u1[1],
			n[2]*u1[0] - n[0]*u1[2],
			n[0]*u1[1] - n[1]*u1[0]
		];

		var withAng = pts.map(function (p) {
			var dx = p[0]-cx, dy = p[1]-cy, dz = p[2]-cz;
			var a1 = dx*u1[0] + dy*u1[1] + dz*u1[2];
			var a2 = dx*u2[0] + dy*u2[1] + dz*u2[2];
			return { p: p, a: Math.atan2(a2, a1) };
		});
		withAng.sort(function (a, b) { return a.a - b.a; });

		// Doppelte Punkte entfernen (passiert, wenn die Ebene exakt durch eine
		// Würfelkante läuft – ohne das entstehen Nulldreiecke)
		var out = [];
		for (var k = 0; k < withAng.length; k++) {
			var p = withAng[k].p;
			var dup = false;
			for (var q = 0; q < out.length; q++) {
				var ddx = out[q][0]-p[0], ddy = out[q][1]-p[1], ddz = out[q][2]-p[2];
				if (ddx*ddx + ddy*ddy + ddz*ddz < 1e-18) { dup = true; break; }
			}
			if (!dup) out.push(p);
		}
		return out.length >= 3 ? out : null;
	}

	/**
	 * Halbräume für den Stack-Modus: pro Neuron EIN eingefärbtes Blatt,
	 * cyan für die positive, ocker für die negative Seite.
	 * Genau die Darstellung aus Screenshot 1/5/6.
	 */
	function _buildHalfspaces(fw, inDim, prevStage, foldKind) {
		if (!fw || !prevStage || !prevStage.bounds) return null;

		var cfg = _state.cfg;
		var limit = cfg.maxNeurons;
		if (!_fin(limit) || limit < 1) limit = 16;
		if (limit > fw.dim) limit = fw.dim;

		var folds = _extractFolds(fw, inDim, prevStage, foldKind || "hard");
		if (!folds || !folds.planes) return null;

		var b = prevStage.bounds;
		var s = prevStage.scale;
		var dim = prevStage.dim;

		var out = [];
		for (var i = 0; i < folds.planes.length && i < limit; i++) {
			var pl = folds.planes[i];

			// Das Blatt = komplette Bounding-Fläche, aber zweifarbig entlang
			// der Faltkante aufgeteilt
			var sheets = _splitBoundsByPlane(pl.w, pl.b, b, dim, s);
			if (!sheets) continue;

			out.push({
				unit:     pl.unit,
				posPoly:  sheets.pos,
				negPoly:  sheets.neg,
				edge:     pl.segs,
				visible:  pl.visible,
				negFrac:  pl.negFrac,
				active:   pl.active,
				kind:     pl.kind,
				centroid: pl.centroid
			});
		}

		return out.length ? out : null;
	}

	/**
	 * Die Bounding-Fläche in zwei Polygone teilen:
	 * positive Seite (w·x+b > 0) und negative Seite.
	 * Sutherland-Hodgman-Clipping gegen die Halbebene.
	 */
	function _splitBoundsByPlane(w, bb, bounds, dim, scale) {
		var s = _fin(scale) ? scale : 1;
		var x0 = bounds.x.lo, x1 = bounds.x.hi;
		var y0 = bounds.y.lo, y1 = bounds.y.hi;

		if (dim === 1) {
			// 1D: zwei Strecken statt Flächen
			if (Math.abs(w[0]) < 1e-12) return null;
			var xc = -bb / w[0];
			if (!_fin(xc)) return null;
			if (xc < x0) xc = x0;
			if (xc > x1) xc = x1;
			var h = (x1 - x0) * 0.04;
			var negFirst = (w[0] > 0);
			var segA = [[x0*s, -h*s, 0], [xc*s, -h*s, 0],
			            [xc*s,  h*s, 0], [x0*s,  h*s, 0]];
			var segB = [[xc*s, -h*s, 0], [x1*s, -h*s, 0],
			            [x1*s,  h*s, 0], [xc*s,  h*s, 0]];
			return negFirst ? { neg: segA, pos: segB }
			                : { pos: segA, neg: segB };
		}

		// 2D-Rechteck (auch für 3D benutzen wir die XY-Projektion als Blatt,
		// damit die Darstellung wie im Video gestapelte Blätter bleibt)
		var quad = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

		function clip(poly, keepPositive) {
			var res = [];
			var n = poly.length;
			for (var i = 0; i < n; i++) {
				var A = poly[i];
				var B = poly[(i + 1) % n];
				var fA = w[0]*A[0] + w[1]*A[1] + bb;
				var fB = w[0]*B[0] + w[1]*B[1] + bb;
				var inA = keepPositive ? (fA >= 0) : (fA <= 0);
				var inB = keepPositive ? (fB >= 0) : (fB <= 0);

				if (inA) res.push(A);
				if (inA !== inB) {
					var den = fA - fB;
					if (Math.abs(den) > 1e-14) {
						var t = fA / den;
						if (t >= 0 && t <= 1) {
							res.push([
								A[0] + (B[0] - A[0]) * t,
								A[1] + (B[1] - A[1]) * t
							]);
						}
					}
				}
			}
			return res.length >= 3 ? res : null;
		}

		var posP = clip(quad, true);
		var negP = clip(quad, false);

		function lift(p) {
			if (!p) return null;
			return p.map(function (q) { return [q[0]*s, q[1]*s, 0]; });
		}

		if (!posP && !negP) return null;
		return { pos: lift(posP), neg: lift(negP) };
	}

	/**
	 * Entscheidungsgrenze rückwärts durch alle Falten projizieren.
	 *
	 * Idee: Im Eingaberaum ein feines Gitter auslegen, jeden Punkt vorwärts
	 * durch das ganze Netz schieben und das Vorzeichen der Ausgabe ablesen.
	 * Die Null-Konturlinie dieses Skalarfelds IST die Entscheidungsgrenze —
	 * genau das magenta Polygon aus dem Video. Marching Squares liefert sie
	 * exakt, ohne dass wir die Falten analytisch invertieren müssten.
	 */
	function _backprojectBoundary(stages, nSamples) {
		if (!stages || stages.length < 2) return null;
		var cfg = _state.cfg;

		var st0 = stages[0];
		if (!st0 || !st0.bounds) return null;
		if (st0.dim < 2) return _backprojectBoundary1D(stages);

		var res = cfg.boundaryRes;
		if (!_fin(res) || res < 20) res = 60;
		if (res > 160) res = 160;

		var axes = st0.axes;
		var b = st0.bounds;
		var dim0 = st0.dim;

		// Mittelwerte für die nicht gezeigten Achsen
		var means = new Float64Array(dim0);
		if (st0.dataFlat) {
			for (var s0 = 0; s0 < nSamples; s0++) {
				for (var d0 = 0; d0 < dim0; d0++) {
					var v = st0.dataFlat[s0 * dim0 + d0];
					if (_fin(v)) means[d0] += v;
				}
			}
			for (var dm = 0; dm < dim0; dm++) means[dm] /= Math.max(1, nSamples);
		}

		// Gitter im Eingaberaum
		var N = res * res;
		var gx = new Float64Array(res);
		var gy = new Float64Array(res);
		for (var i = 0; i < res; i++) {
			gx[i] = b.x.lo + (b.x.hi - b.x.lo) * (i / (res - 1));
			gy[i] = b.y.lo + (b.y.hi - b.y.lo) * (i / (res - 1));
		}

		var flat = new Float64Array(N * dim0);
		for (var yy = 0; yy < res; yy++) {
			for (var xx = 0; xx < res; xx++) {
				var k = yy * res + xx;
				for (var dd = 0; dd < dim0; dd++) {
					flat[k * dim0 + dd] = means[dd];
				}
				if (axes[0] >= 0 && axes[0] < dim0) flat[k * dim0 + axes[0]] = gx[xx];
				if (axes[1] >= 0 && axes[1] < dim0) flat[k * dim0 + axes[1]] = gy[yy];
			}
		}

		// Vorwärts durch ALLE Stufen schieben
		var cur = flat, curDim = dim0;
		for (var li = 1; li < stages.length; li++) {
			var st = stages[li];
			var kernel = st.kernel;
			var bias   = st.bias;
			var inD    = st.inDim;
			var outD   = st.dim;

			if (!kernel || !_fin(inD) || !_fin(outD)) {
				_log("Grenz-Rückprojektion: Stufe " + li + " ohne Gewichte");
				return null;
			}
			if (inD !== curDim) {
				_log("Grenz-Rückprojektion: Dimension bricht bei Stufe " + li);
				return null;
			}

			var nxt = new Float64Array(N * outD);
			var act = st.activation;

			for (var p = 0; p < N; p++) {
				var rowIn  = p * inD;
				var rowOut = p * outD;
				for (var u = 0; u < outD; u++) {
					var s = 0;
					for (var d = 0; d < inD; d++) {
						var xv = cur[rowIn + d];
						if (!_fin(xv)) xv = 0;
						s += xv * kernel[d * outD + u];
					}
					if (bias && _fin(bias[u])) s += bias[u];
					nxt[rowOut + u] = _applyAct(_fin(s) ? s : 0, act);
				}
			}

			cur = nxt;
			curDim = outD;
		}

		// --- Skalarfeld: Entscheidungswert pro Gitterpunkt ---
		// Bei 1 Ausgabeneuron: f = y - 0.5 (bzw. y bei tanh/linear)
		// Bei mehreren: f = max_logit - second_logit (Margin)
		var field = new Float64Array(N);
		var lastStage = stages[stages.length - 1];
		var lastAct = lastStage.activation || "linear";

		if (curDim === 1) {
			var mid = 0;
			if (lastAct === "sigmoid" || lastAct === "hardsigmoid") mid = 0.5;
			else if (lastAct === "softmax") mid = 0.5;
			for (var q = 0; q < N; q++) {
				var v = cur[q];
				field[q] = _fin(v) ? (v - mid) : 0;
			}
		} else {
			for (var r = 0; r < N; r++) {
				var base = r * curDim;
				var best = -Infinity, second = -Infinity;
				for (var c2 = 0; c2 < curDim; c2++) {
					var vv = cur[base + c2];
					if (!_fin(vv)) continue;
					if (vv > best) { second = best; best = vv; }
					else if (vv > second) { second = vv; }
				}
				if (!_fin(best))   best = 0;
				if (!_fin(second)) second = best;
				field[r] = best - second;
				// Margin ist immer >= 0 — daher brauchen wir die
				// Klassenzugehörigkeit als Vorzeichen (siehe unten)
			}

			// Bei Multi-Klassen zeichnen wir die Grenzen ZWISCHEN den Klassen:
			// dort wo sich argmax ändert. Dazu speichern wir argmax pro Zelle.
			var argmaxGrid = new Int16Array(N);
			for (var a2 = 0; a2 < N; a2++) {
				var b2 = a2 * curDim;
				var bi = 0, bv = -Infinity;
				for (var c3 = 0; c3 < curDim; c3++) {
					var v3 = cur[b2 + c3];
					if (_fin(v3) && v3 > bv) { bv = v3; bi = c3; }
				}
				argmaxGrid[a2] = bi;
			}

			var segsMulti = _argmaxBoundaries(argmaxGrid, res, gx, gy, st0.scale);
			return {
				segs:     segsMulti,
				res:      res,
				multi:    true,
				classes:  curDim,
				field:    null,
				argmax:   argmaxGrid,
				gx:       gx,
				gy:       gy,
				scale:    st0.scale
			};
		}

		// --- Marching Squares auf dem Skalarfeld ---
		var segs = _marchingSquares(field, res, gx, gy, st0.scale);

		return {
			segs:   segs,
			res:    res,
			multi:  false,
			field:  field,
			gx:     gx,
			gy:     gy,
			scale:  st0.scale
		};
	}

	/**
	 * Marching Squares: Null-Konturlinie eines Skalarfelds.
	 * Das ergibt die magenta Entscheidungsgrenze aus dem Video —
	 * exakt dort, wo die flache Trennebene des letzten Layers
	 * durch alle Falten hindurch im Eingaberaum landet.
	 */
	function _marchingSquares(field, res, gx, gy, scale) {
		var out = [];
		var s = _fin(scale) ? scale : 1;

		function P(ix, iy) { return field[iy * res + ix]; }

		function interp(x0, y0, v0, x1, y1, v1) {
			var den = v0 - v1;
			if (Math.abs(den) < 1e-14) return [x0 * s, y0 * s, 0];
			var t = v0 / den;
			if (t < 0) t = 0;
			if (t > 1) t = 1;
			return [
				(x0 + (x1 - x0) * t) * s,
				(y0 + (y1 - y0) * t) * s,
				0
			];
		}

		for (var iy = 0; iy + 1 < res; iy++) {
			for (var ix = 0; ix + 1 < res; ix++) {
				var v00 = P(ix,     iy);
				var v10 = P(ix + 1, iy);
				var v11 = P(ix + 1, iy + 1);
				var v01 = P(ix,     iy + 1);

				if (!_fin(v00) || !_fin(v10) || !_fin(v11) || !_fin(v01)) continue;

				var code = 0;
				if (v00 > 0) code |= 1;
				if (v10 > 0) code |= 2;
				if (v11 > 0) code |= 4;
				if (v01 > 0) code |= 8;

				if (code === 0 || code === 15) continue;

				var x0 = gx[ix],     x1 = gx[ix + 1];
				var y0 = gy[iy],     y1 = gy[iy + 1];

				// Kantenschnittpunkte
				var eB = null, eR = null, eT = null, eL = null;
				if ((v00 > 0) !== (v10 > 0)) eB = interp(x0, y0, v00, x1, y0, v10);
				if ((v10 > 0) !== (v11 > 0)) eR = interp(x1, y0, v10, x1, y1, v11);
				if ((v01 > 0) !== (v11 > 0)) eT = interp(x0, y1, v01, x1, y1, v11);
				if ((v00 > 0) !== (v01 > 0)) eL = interp(x0, y0, v00, x0, y1, v01);

				function push2(a, b) {
					if (!a || !b) return;
					out.push(a[0], a[1], a[2]);
					out.push(b[0], b[1], b[2]);
				}

				switch (code) {
					case 1:  case 14: push2(eL, eB); break;
					case 2:  case 13: push2(eB, eR); break;
					case 3:  case 12: push2(eL, eR); break;
					case 4:  case 11: push2(eR, eT); break;
					case 6:  case  9: push2(eB, eT); break;
					case 7:  case  8: push2(eL, eT); break;
					case 5:  // ambivalent (Sattel)
						push2(eL, eB);
						push2(eR, eT);
						break;
					case 10:
						push2(eL, eT);
						push2(eB, eR);
						break;
				}
			}
		}

		return out.length ? new Float32Array(out) : null;
	}

	/**
	 * Multi-Klassen-Grenzen: Linien dort, wo sich argmax zwischen
	 * benachbarten Gitterzellen ändert. Das sind die Voronoi-artigen
	 * Grenzen, die im Video als magenta Polygone erscheinen.
	 */
	function _argmaxBoundaries(argmax, res, gx, gy, scale) {
		var out = [];
		var s = _fin(scale) ? scale : 1;

		for (var iy = 0; iy < res; iy++) {
			for (var ix = 0; ix < res; ix++) {
				var k = iy * res + ix;
				var a = argmax[k];

				// Rechter Nachbar
				if (ix + 1 < res && argmax[k + 1] !== a) {
					var mx = (gx[ix] + gx[ix + 1]) * 0.5 * s;
					var y0 = (iy > 0 ? (gy[iy] + gy[iy - 1]) * 0.5 : gy[iy]) * s;
					var y1 = (iy + 1 < res ? (gy[iy] + gy[iy + 1]) * 0.5 : gy[iy]) * s;
					out.push(mx, y0, 0, mx, y1, 0);
				}
				// Oberer Nachbar
				if (iy + 1 < res && argmax[k + res] !== a) {
					var my = (gy[iy] + gy[iy + 1]) * 0.5 * s;
					var xa = (ix > 0 ? (gx[ix] + gx[ix - 1]) * 0.5 : gx[ix]) * s;
					var xb = (ix + 1 < res ? (gx[ix] + gx[ix + 1]) * 0.5 : gx[ix]) * s;
					out.push(xa, my, 0, xb, my, 0);
				}
			}
		}

		return out.length ? new Float32Array(out) : null;
	}

	/**
	 * 1D-Fall: Die Grenze ist ein Punkt (bzw. mehrere Punkte) auf der Linie.
	 */
	function _backprojectBoundary1D(stages) {
		var st0 = stages[0];
		if (!st0 || !st0.bounds) return null;

		var res = 400;
		var b = st0.bounds;
		var dim0 = st0.dim;
		var gx = new Float64Array(res);
		for (var i = 0; i < res; i++) {
			gx[i] = b.x.lo + (b.x.hi - b.x.lo) * (i / (res - 1));
		}

		var flat = new Float64Array(res * dim0);
		for (var k = 0; k < res; k++) {
			flat[k * dim0] = gx[k];
		}

		var cur = flat, curDim = dim0;
		for (var li = 1; li < stages.length; li++) {
			var st = stages[li];
			if (!st.kernel) return null;
			var outD = st.dim;
			var nxt = new Float64Array(res * outD);
			for (var p = 0; p < res; p++) {
				for (var u = 0; u < outD; u++) {
					var s = 0;
					for (var d = 0; d < curDim; d++) {
						s += cur[p * curDim + d] * st.kernel[d * outD + u];
					}
					if (st.bias && _fin(st.bias[u])) s += st.bias[u];
					nxt[p * outD + u] = _applyAct(_fin(s) ? s : 0, st.activation);
				}
			}
			cur = nxt;
			curDim = outD;
		}

		// Nulldurchgänge finden
		var pts = [];
		var scale = st0.scale;
		var mid = 0.5;
		var lastAct = stages[stages.length - 1].activation;
		if (lastAct !== "sigmoid" && lastAct !== "hardsigmoid" &&
		    lastAct !== "softmax") mid = 0;

		for (var q = 0; q + 1 < res; q++) {
			var vA, vB;
			if (curDim === 1) {
				vA = cur[q] - mid;
				vB = cur[q + 1] - mid;
			} else {
				var ia = 0, va = -Infinity;
				var ib = 0, vb = -Infinity;
				for (var c = 0; c < curDim; c++) {
					if (cur[q * curDim + c] > va) { va = cur[q * curDim + c]; ia = c; }
					if (cur[(q + 1) * curDim + c] > vb) { vb = cur[(q + 1) * curDim + c]; ib = c; }
				}
				if (ia === ib) continue;
				pts.push((gx[q] + gx[q + 1]) * 0.5 * scale);
				continue;
			}
			if (!_fin(vA) || !_fin(vB)) continue;
			if ((vA > 0) === (vB > 0)) continue;
			var den = vA - vB;
			var t = Math.abs(den) > 1e-14 ? vA / den : 0.5;
			pts.push((gx[q] + (gx[q + 1] - gx[q]) * t) * scale);
		}

		if (!pts.length) return null;

		var segs = [];
		var tick = Math.abs(b.x.hi - b.x.lo) * 0.09 * scale;
		if (!_fin(tick) || tick <= 0) tick = 6;
		for (var r = 0; r < pts.length; r++) {
			segs.push(pts[r], -tick, 0, pts[r], tick, 0);
		}

		return {
			segs:  new Float32Array(segs),
			res:   res,
			multi: (curDim > 1),
			is1d:  true,
			points: pts
		};
	}

	// ==================================================================
	// 13. THREE.JS — SHADER
	// ==================================================================

	// --- Faltkanten: pulsierender Glow entlang der Linie ---
	var FOLD_VS = [
		"attribute float aT;",
		"attribute float aStrength;",
		"varying float vT;",
		"varying float vS;",
		"void main() {",
		"  vT = aT;",
		"  vS = aStrength;",
		"  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
		"}"
	].join("\n");

	var FOLD_FS = [
		"uniform vec3  uColor;",
		"uniform float uOpacity;",
		"varying float vT;",
		"varying float vS;",
		"void main() {",
		"  vec3 col = uColor;",
		"  float a = uOpacity * (0.35 + 0.65 * vS);",
		"  gl_FragColor = vec4(col, a);",
		"}"
	].join("\n");

	// --- Halbraum-Blätter: weiche Verlaufsflächen mit Fresnel-Rand ---
	var SHEET_VS = [
		"varying vec3 vWorld;",
		"varying vec3 vNormal;",
		"varying vec2 vUv;",
		"varying float vSide;",
		"attribute float aSide;",
		"void main() {",
		"  vUv = uv;",
		"  vSide = aSide;",
		"  vec4 wp = modelMatrix * vec4(position, 1.0);",
		"  vWorld = wp.xyz;",
		"  vNormal = normalize(normalMatrix * normal);",
		"  gl_Position = projectionMatrix * viewMatrix * wp;",
		"}"
	].join("\n");

	var SHEET_FS = [
		"uniform vec3  uColorPos;",
		"uniform vec3  uColorNeg;",
		"uniform float uOpacity;",
		"uniform float uTime;",
		"uniform vec3  uCamPos;",
		"uniform float uFresnel;",
		"varying vec3 vWorld;",
		"varying vec3 vNormal;",
		"varying vec2 vUv;",
		"varying float vSide;",
		"void main() {",
		"  vec3 col = mix(uColorNeg, uColorPos, vSide);",
		"  vec3 V = normalize(uCamPos - vWorld);",
		"  float fres = pow(1.0 - abs(dot(normalize(vNormal), V)), 2.4);",
		"  col += fres * uFresnel * 0.55;",
		"  float shimmer = 0.04 * sin(vWorld.x * 0.05 + vWorld.z * 0.04 + uTime * 0.6);",
		"  col += shimmer;",
		"  float a = uOpacity * (0.62 + 0.38 * fres);",
		"  gl_FragColor = vec4(col, a);",
		"}"
	].join("\n");

	// --- Entscheidungsgrenze: leuchtendes Magenta mit Lauflicht ---
	var BOUND_VS = [
		"attribute float aT;",
		"varying float vT;",
		"void main() {",
		"  vT = aT;",
		"  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
		"}"
	].join("\n");

	var BOUND_FS = [
		"uniform vec3  uColor;",
		"uniform float uOpacity;",
		"varying float vT;",
		"void main() {",
		"  vec3 col = uColor;",
		"  float a = uOpacity;",
		"  gl_FragColor = vec4(col, a);",
		"}"
	].join("\n");

	// --- Datenpunkte: runde Soft-Sprites mit Glow ---
	var POINT_VS = [
		"attribute vec3 aColor;",
		"attribute float aSize;",
		"varying vec3 vColor;",
		"void main() {",
		"  vColor = aColor;",
		"  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
		"  gl_PointSize = aSize * (320.0 / max(1.0, -mv.z));",
		"  gl_Position = projectionMatrix * mv;",
		"}"
	].join("\n");

	var POINT_FS = [
		"uniform float uOpacity;",
		"varying vec3 vColor;",
		"void main() {",
		"  vec2 d = gl_PointCoord - vec2(0.5);",
		"  float r = length(d) * 2.0;",
		"  if (r > 1.0) discard;",
		"  float core = smoothstep(1.0, 0.25, r);",
		"  float glow = smoothstep(1.0, 0.0, r) * 0.42;",
		"  vec3 col = vColor * (0.88 + 0.6 * core);",
		"  gl_FragColor = vec4(col, (core * 0.92 + glow) * uOpacity);",
		"}"
	].join("\n");

	// --- Gitterlinien: Verzerrungsgefärbt + Tiefenfade ---
	var GRID_VS = [
		"attribute vec3 aColor;",
		"attribute float aFold;",
		"varying vec3 vColor;",
		"varying float vFold;",
		"varying float vDepth;",
		"void main() {",
		"  vColor = aColor;",
		"  vFold = aFold;",
		"  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
		"  vDepth = -mv.z;",
		"  gl_Position = projectionMatrix * mv;",
		"}"
	].join("\n");

	var GRID_FS = [
		"uniform float uOpacity;",
		"uniform float uTime;",
		"varying vec3 vColor;",
		"varying float vFold;",
		"varying float vDepth;",
		"void main() {",
		"  float fade = clamp(1.0 - (vDepth - 160.0) / 1400.0, 0.22, 1.0);",
		"  float hot = smoothstep(0.55, 1.0, vFold);",
		"  vec3 col = vColor + hot * 0.45;",
		"  gl_FragColor = vec4(col, uOpacity * fade * (0.55 + 0.45 * vFold));",
		"}"
	].join("\n");

	// ==================================================================
	// 14. SZENE AUFBAUEN
	// ==================================================================

	function _clearGroup(g) {
		if (!g) return;
		while (g.children.length) {
			var c = g.children[0];
			g.remove(c);
			_disposeObj(c);
		}
	}

	function _disposeObj(o) {
		if (!o) return;
		try {
			o.traverse(function (n) {
				if (n.geometry) { try { n.geometry.dispose(); } catch (e) {} }
				if (n.material) {
					var ms = Array.isArray(n.material) ? n.material : [n.material];
					for (var i = 0; i < ms.length; i++) {
						try {
							if (ms[i].map) ms[i].map.dispose();
							ms[i].dispose();
						} catch (e) {}
					}
				}
				if (n.element && n.element.parentNode) {
					n.element.parentNode.removeChild(n.element);
				}
			});
		} catch (e) {}
	}

	function _buildScene() {
		var T = _state.THREE;
		var th = _theme();
		var cfg = _state.cfg;
		var pipe = _state.pipeline;

		_clearGroup(_state.sheetGroup);
		_clearGroup(_state.foldGroup);
		_clearGroup(_state.dataGroup);
		_clearGroup(_state.boundGroup);
		_clearGroup(_state.stackGroup);
		_clearGroup(_state.helperGroup);

		if (!pipe || !pipe.stages || pipe.stages.length < 2) return;

		_state.scene.background = new T.Color(th.bg);
		_state.scene.fog = new T.Fog(th.fog, th.fogNear, th.fogFar);

		var mode = cfg.mode;

		if (mode === MODE_STACK) {
			_buildStackMode(pipe, th);
		} else if (mode === MODE_BOUNDARY) {
			_buildBoundaryMode(pipe, th);
		} else {
			_buildFoldMode(pipe, th);
		}

		// Kamera-Radius an die neue aktive Schicht anpassen — nur wenn
		// der Abstand deutlich daneben liegt, sonst bleibt der vom
		// Nutzer eingestellte Blick erhalten.
		if (_state.lastFitLayer !== _state.activeLayer) {
			_fitRadius();
			_state.lastFitLayer = _state.activeLayer;
		}

		if (cfg.showAxes) _buildAxes(pipe, th);
		_updateNetDiagram(pipe);
		_updateHud(pipe);
	}

	// ------------------------------------------------------------------
	// Modus A: Vorwärts-Faltung
	// ------------------------------------------------------------------

	function _buildFoldMode(pipe, th) {
		var T = _state.THREE;
		var cfg = _state.cfg;
		var stages = pipe.stages;

		// Scrubber bestimmt, bis zu welcher Stufe gefaltet wird.
		// Zwischen zwei Stufen wird interpoliert → fließendes Falten.
		var sc = _state.scrub;
		if (!_fin(sc)) sc = 1;
		sc = Math.max(0, Math.min(1, sc));

		var nSteps = stages.length - 1;
		var f
		var nSteps = stages.length - 1;
		var fPos = sc * nSteps;              // kontinuierliche Position in der Kette
		var iLo = Math.floor(fPos);
		if (iLo < 0) iLo = 0;
		if (iLo > nSteps) iLo = nSteps;
		var iHi = Math.min(iLo + 1, nSteps);
		var fMix = fPos - iLo;
		if (!_fin(fMix)) fMix = 0;
		fMix = Math.max(0, Math.min(1, fMix));
		// Smoothstep: das Falten wirkt dadurch wie echtes Papier, nicht linear
		var fSm = fMix * fMix * (3 - 2 * fMix);

		_state.activeLayer = iHi;

		var stLo = stages[iLo];
		var stHi = stages[iHi];
		if (!stLo) return;

		// --- Das gefaltete Blatt: zwischen zwei Stufen interpolieren ---
		var sheet = stLo.sheet;
		if (cfg.showSheet && sheet && stLo.sheetPos) {
			var posA = stLo.sheetPos;
			var posB = (stHi && stHi.sheetPos) ? stHi.sheetPos : posA;

			var n = Math.min(posA.length, posB.length) / 3;
			n = Math.floor(n);
			if (n > 0) {
				var verts = new Float32Array(n * 3);
				var side   = new Float32Array(n);

				// Seitenzuordnung aus den Preaktivierungen der ZIELstufe:
				// positiv = cyan, negativ = ocker (wie im Video)
				var pre = (stHi && stHi.sheetFlat && stHi.preact) ? null : null;

				for (var i = 0; i < n; i++) {
					var i3 = i * 3;
					verts[i3]     = posA[i3]     + (posB[i3]     - posA[i3])     * fSm;
					verts[i3 + 1] = posA[i3 + 1] + (posB[i3 + 1] - posA[i3 + 1]) * fSm;
					verts[i3 + 2] = posA[i3 + 2] + (posB[i3 + 2] - posA[i3 + 2]) * fSm;
					if (!_fin(verts[i3]))     verts[i3] = 0;
					if (!_fin(verts[i3 + 1])) verts[i3 + 1] = 0;
					if (!_fin(verts[i3 + 2])) verts[i3 + 2] = 0;
				}

				// Seite bestimmen: dominantes Neuron der Zielstufe
				var domUnit = 0;
				if (stHi && stHi.folds && stHi.folds.planes && stHi.folds.planes.length) {
					domUnit = stHi.folds.planes[0].unit;
				}
				var sheetFlatSrc = stLo.sheetFlat;
				var srcDim = stLo.dim;
				if (stHi && stHi.kernel && sheetFlatSrc && _fin(srcDim)) {
					var kern = stHi.kernel;
					var bArr = stHi.bias;
					var units = stHi.dim;
					for (var s2 = 0; s2 < n; s2++) {
						var acc = 0;
						var base = s2 * srcDim;
						for (var d2 = 0; d2 < srcDim; d2++) {
							var xv2 = sheetFlatSrc[base + d2];
							if (!_fin(xv2)) continue;
							acc += xv2 * kern[d2 * units + domUnit];
						}
						if (bArr && _fin(bArr[domUnit])) acc += bArr[domUnit];
						side[s2] = (acc >= 0) ? 1 : 0;
					}
				} else {
					for (var s3 = 0; s3 < n; s3++) side[s3] = 1;
				}

				// --- Mesh (gefüllte Fläche) ---
				if (sheet.tris && sheet.tris.length) {
					var idx = _validateTris(sheet.tris, n, verts);
					if (idx && idx.length) {
						var g = new T.BufferGeometry();
						g.setAttribute("position", new T.BufferAttribute(verts, 3));
						g.setAttribute("aSide",    new T.BufferAttribute(side, 1));
						if (sheet.uvs && sheet.uvs.length >= n * 2) {
							g.setAttribute("uv", new T.BufferAttribute(
								sheet.uvs.subarray(0, n * 2), 2));
						} else {
							g.setAttribute("uv", new T.BufferAttribute(new Float32Array(n * 2), 2));
						}
						g.setIndex(idx);
						g.computeVertexNormals();

						var mat = _sheetMaterial(th, cfg.sheetOpacity);
						var mesh = new T.Mesh(g, mat);
						mesh.renderOrder = 1;
						_state.sheetGroup.add(mesh);
					}
				}

				// --- Gitterlinien auf dem Blatt ---
				if (cfg.showGrid && sheet.lines && sheet.lines.length) {
					var lp = [], lc = [], lf = [];
					var cPos = new T.Color(PALETTE.halfPosLit);
					var cNeg = new T.Color(PALETTE.halfNegLit);

					for (var L = 0; L < sheet.lines.length; L++) {
						var ln = sheet.lines[L];
						for (var p = 0; p + 1 < ln.length; p++) {
							var a = ln[p], b = ln[p + 1];
							if (a >= n || b >= n) continue;
							lp.push(verts[a*3], verts[a*3+1], verts[a*3+2]);
							lp.push(verts[b*3], verts[b*3+1], verts[b*3+2]);
							var cA = side[a] > 0.5 ? cPos : cNeg;
							var cB = side[b] > 0.5 ? cPos : cNeg;
							lc.push(cA.r, cA.g, cA.b);
							lc.push(cB.r, cB.g, cB.b);
							// "Faltwert": je weiter die Punkte auseinander gerissen
							// wurden, desto heißer die Linie
							var fv = _foldHeat(stLo.sheetPos, stHi ? stHi.sheetPos : null, a, b);
							lf.push(fv, fv);
						}
					}

					if (lp.length) {
						var gl = new T.BufferGeometry();
						gl.setAttribute("position", new T.Float32BufferAttribute(lp, 3));
						gl.setAttribute("aColor",   new T.Float32BufferAttribute(lc, 3));
						gl.setAttribute("aFold",    new T.Float32BufferAttribute(lf, 1));
						var ml = _gridMaterial(th);
						var lines = new T.LineSegments(gl, ml);
						lines.renderOrder = 2;
						_state.sheetGroup.add(lines);
					}
				}
			}
		}

		// --- Faltkanten der nächsten Stufe (weiß gestrichelt, wie im Video) ---
		if (cfg.showFolds && stHi && stHi.folds && stHi.folds.planes) {
			_addFolds(stHi.folds, stLo, fSm, th);
		}

		// --- Datenpunkte mitfalten ---
		if (cfg.showData && stLo.dataPos) {
			var dA = stLo.dataPos;
			var dB = (stHi && stHi.dataPos) ? stHi.dataPos : dA;
			var nd = Math.floor(Math.min(dA.length, dB.length) / 3);
			if (nd > 0) {
				var dp = new Float32Array(nd * 3);
				for (var q = 0; q < nd; q++) {
					var q3 = q * 3;
					dp[q3]     = dA[q3]     + (dB[q3]     - dA[q3])     * fSm;
					dp[q3 + 1] = dA[q3 + 1] + (dB[q3 + 1] - dA[q3 + 1]) * fSm;
					dp[q3 + 2] = dA[q3 + 2] + (dB[q3 + 2] - dA[q3 + 2]) * fSm;
					if (!_fin(dp[q3]))     dp[q3] = 0;
					if (!_fin(dp[q3 + 1])) dp[q3 + 1] = 0;
					if (!_fin(dp[q3 + 2])) dp[q3 + 2] = 0;
				}
				_addPoints(dp, nd, th);
			}
		}

		// --- Entscheidungsgrenze (nur im Eingaberaum sinnvoll) ---
		if (cfg.showBoundary && pipe.boundary && iLo === 0 && fSm < 0.15) {
			_addBoundary(pipe.boundary, th, 1 - fSm / 0.15);
		}
	}

	/**
	 * "Faltwärme": Verhältnis der Kantenlänge vor/nach der Transformation.
	 * Genau dort, wo das Blatt knickt, wird eine Kante stark gestaucht oder
	 * gestreckt — das macht die Faltkante auch ohne Hyperebene sichtbar.
	 */
	function _foldHeat(posA, posB, a, b) {
		if (!posA || !posB) return 0.3;
		var a3 = a * 3, b3 = b * 3;

		var dxA = posA[a3]   - posA[b3];
		var dyA = posA[a3+1] - posA[b3+1];
		var dzA = posA[a3+2] - posA[b3+2];
		var lA = Math.sqrt(dxA*dxA + dyA*dyA + dzA*dzA);

		var dxB = posB[a3]   - posB[b3];
		var dyB = posB[a3+1] - posB[b3+1];
		var dzB = posB[a3+2] - posB[b3+2];
		var lB = Math.sqrt(dxB*dxB + dyB*dyB + dzB*dzB);

		if (!(lA > 1e-9) || !_fin(lB)) return 0.3;
		var r = lB / lA;
		if (!_fin(r)) return 0.3;
		// log2-Verhältnis auf 0..1 mappen; 0.5 = unverändert
		var lg = Math.log(Math.max(r, 1e-6)) / Math.LN2;
		var t = 0.5 + Math.max(-1, Math.min(1, lg / 3)) * 0.5;
		// Abweichung von "unverändert" ist das Interessante
		return Math.min(1, Math.abs(t - 0.5) * 2.2);
	}

	/**
	 * Dreiecksindizes prüfen: Nulldreiecke und ungültige Indizes aussortieren.
	 * Ohne das reißt das Mesh genau an den Faltkanten Löcher — dort fallen
	 * nämlich Vertices zusammen, weil ReLU sie auf dieselbe Stelle projiziert.
	 */
	function _validateTris(tris, n, verts) {
		var out = [];
		var eps = 1e-14;
		for (var i = 0; i + 2 < tris.length; i += 3) {
			var a = tris[i], b = tris[i + 1], c = tris[i + 2];
			if (a < 0 || b < 0 || c < 0) continue;
			if (a >= n || b >= n || c >= n) continue;
			if (a === b || b === c || a === c) continue;

			var ax = verts[b*3] - verts[a*3];
			var ay = verts[b*3+1] - verts[a*3+1];
			var az = verts[b*3+2] - verts[a*3+2];
			var bx = verts[c*3] - verts[a*3];
			var by = verts[c*3+1] - verts[a*3+1];
			var bz = verts[c*3+2] - verts[a*3+2];
			var cx = ay*bz - az*by;
			var cy = az*bx - ax*bz;
			var cz = ax*by - ay*bx;
			var area2 = cx*cx + cy*cy + cz*cz;
			if (!_fin(area2) || area2 < eps) continue;

			out.push(a, b, c);
		}
		return out;
	}

	function _sheetMaterial(th, opacity) {
		var T = _state.THREE;
		var cp = new T.Color(PALETTE.halfPos);
		var cn = new T.Color(PALETTE.halfNeg);
		return new T.ShaderMaterial({
			uniforms: {
				uColorPos: { value: new T.Vector3(cp.r, cp.g, cp.b) },
				uColorNeg: { value: new T.Vector3(cn.r, cn.g, cn.b) },
				uOpacity:  { value: _fin(opacity) ? opacity : 0.6 },
				uTime:     { value: 0 },
				uCamPos:   { value: new T.Vector3() },
				uFresnel:  { value: th.dark ? 0.55 : 0.3 }
			},
			vertexShader:   SHEET_VS,
			fragmentShader: SHEET_FS,
			transparent:    true,
			depthWrite:     false,
			side:           T.DoubleSide,
			blending:       T.NormalBlending
		});
	}

	function _gridMaterial(th) {
		var T = _state.THREE;
		return new T.ShaderMaterial({
			uniforms: {
				uOpacity: { value: th.dark ? 0.82 : 0.68 },
				uTime:    { value: 0 }
			},
			vertexShader:   GRID_VS,
			fragmentShader: GRID_FS,
			transparent:    true,
			depthWrite:     false
		});
	}

	function _foldMaterial(th, kind, opacity) {
		var T = _state.THREE;
		var col = new T.Color(kind === "soft" ? PALETTE.foldSoft : PALETTE.foldHard);
		return new T.ShaderMaterial({
			uniforms: {
				uColor:   { value: new T.Vector3(col.r, col.g, col.b) },
				uOpacity: { value: _fin(opacity) ? opacity : 0.95 }
			},
			vertexShader:   FOLD_VS,
			fragmentShader: FOLD_FS,
			transparent:    true,
			depthWrite:     false,
			blending:       T.AdditiveBlending
		});
	}

	function _boundMaterial(th, opacity) {
		var T = _state.THREE;
		var col = new T.Color(PALETTE.boundary);
		return new T.ShaderMaterial({
			uniforms: {
				uColor:   { value: new T.Vector3(col.r, col.g, col.b) },
				uOpacity: { value: _fin(opacity) ? opacity : 1.0 }
			},
			vertexShader:   BOUND_VS,
			fragmentShader: BOUND_FS,
			transparent:    true,
			depthWrite:     false,
			blending:       T.AdditiveBlending
		});
	}

	function _pointMaterial(th) {
		var T = _state.THREE;
		return new T.ShaderMaterial({
			uniforms: {
				uOpacity: { value: th.dark ? 0.95 : 0.88 }
			},
			vertexShader:   POINT_VS,
			fragmentShader: POINT_FS,
			transparent:    true,
			depthWrite:     false,
			blending:       T.NormalBlending
		});
	}

	function _addFolds(folds, prevStage, fSm, th) {
		var T = _state.THREE;
		var cfg = _state.cfg;
		if (!folds || !folds.planes || !folds.planes.length) return;

		var pts = [], ts = [], st = [];
		var shown = 0;

		for (var i = 0; i < folds.planes.length; i++) {
			var pl = folds.planes[i];
			if (!pl.segs || pl.segs.length < 2) continue;
			// Nur Falten zeigen, die wirklich Daten treffen
			if (!pl.active && i > 2) continue;

			var strength = pl.active ? (0.45 + 0.55 * pl.visible) : 0.2;

			for (var s = 0; s + 1 < pl.segs.length; s += 2) {
				var A = pl.segs[s], B = pl.segs[s + 1];
				if (!A || !B) continue;
				if (!_fin(A[0]) || !_fin(B[0])) continue;
				pts.push(A[0], A[1], A[2]);
				pts.push(B[0], B[1], B[2]);
				ts.push(0, 1);
				st.push(strength, strength);
			}
			shown++;
			if (shown >= cfg.maxNeurons) break;
		}

		if (!pts.length) return;

		var g = new T.BufferGeometry();
		g.setAttribute("position",  new T.Float32BufferAttribute(pts, 3));
		g.setAttribute("aT",        new T.Float32BufferAttribute(ts, 1));
		g.setAttribute("aStrength", new T.Float32BufferAttribute(st, 1));

		// Die Faltkanten "verblassen", je weiter die Faltung fortgeschritten ist
		var op = 0.95 * (1 - fSm * 0.55);
		var m = _foldMaterial(th, folds.kind, op);
		var lines = new T.LineSegments(g, m);
		lines.renderOrder = 4;
		_state.foldGroup.add(lines);

		// Leuchtender Unterbau (breiter, schwächer) für den Glow-Effekt
		var m2 = _foldMaterial(th, folds.kind, op * 0.3);
		var lines2 = new T.LineSegments(g.clone(), m2);
		lines2.renderOrder = 3;
		lines2.scale.set(1.004, 1.004, 1.004);
		_state.foldGroup.add(lines2);
	}

	function _addPoints(positions, n, th) {
		var T = _state.THREE;
		var cfg = _state.cfg;
		if (!positions || !n) return;

		var colors = _state.cache.colors;
		var cArr = new Float32Array(n * 3);
		var sArr = new Float32Array(n);
		var tmp = new T.Color();

		for (var i = 0; i < n; i++) {
			var col = (colors && colors[i] != null) ? colors[i] : PALETTE.classes[0];
			tmp.setHex(col);
			cArr[i * 3]     = tmp.r;
			cArr[i * 3 + 1] = tmp.g;
			cArr[i * 3 + 2] = tmp.b;
			sArr[i] = cfg.pointSize;
		}

		var g = new T.BufferGeometry();
		g.setAttribute("position", new T.BufferAttribute(positions, 3));
		g.setAttribute("aColor",   new T.BufferAttribute(cArr, 3));
		g.setAttribute("aSize",    new T.BufferAttribute(sArr, 1));

		var m = _pointMaterial(th);
		var pts = new T.Points(g, m);
		pts.renderOrder = 6;
		pts.frustumCulled = false;
		_state.dataGroup.add(pts);
	}

	function _addBoundary(boundary, th, opacity) {
		var T = _state.THREE;
		if (!boundary || !boundary.segs || !boundary.segs.length) return;

		var segs = boundary.segs;
		var nSeg = Math.floor(segs.length / 6);
		if (nSeg < 1) return;

		var ts = new Float32Array(nSeg * 2);
		for (var i = 0; i < nSeg; i++) {
			var t = nSeg > 1 ? (i / (nSeg - 1)) : 0;
			ts[i * 2]     = t;
			ts[i * 2 + 1] = t + (1 / Math.max(1, nSeg));
		}

		var g = new T.BufferGeometry();
		g.setAttribute("position", new T.BufferAttribute(segs, 3));
		g.setAttribute("aT",       new T.BufferAttribute(ts, 1));

		var op = _fin(opacity) ? Math.max(0, Math.min(1, opacity)) : 1;

		var m = _boundMaterial(th, op);
		var lines = new T.LineSegments(g, m);
		lines.renderOrder = 7;
		_state.boundGroup.add(lines);

		// Breiterer Glow darunter
		var m2 = _boundMaterial(th, op * 0.28);
		var lines2 = new T.LineSegments(g.clone(), m2);
		lines2.renderOrder = 5;
		lines2.scale.set(1.008, 1.008, 1.008);
		_state.boundGroup.add(lines2);
	}

	// ------------------------------------------------------------------
	// Modus B: Rückwärts-Entscheidungsgrenze
	// ------------------------------------------------------------------

	function _buildBoundaryMode(pipe, th) {
		var T = _state.THREE;
		var cfg = _state.cfg;
		var st0 = pipe.stages[0];
		if (!st0) return;

		// Das flache Eingabeblatt
		if (cfg.showSheet && st0.sheet && st0.sheetPos) {
			var sheet = st0.sheet;
			var n = Math.floor(st0.sheetPos.length / 3);
			if (n > 0 && sheet.tris && sheet.tris.length) {
				var side = new Float32Array(n);
				for (var s = 0; s < n; s++) side[s] = 0.5;

				var idx = _validateTris(sheet.tris, n, st0.sheetPos);
				if (idx && idx.length) {
					var g = new T.BufferGeometry();
					g.setAttribute("position", new T.BufferAttribute(st0.sheetPos, 3));
					g.setAttribute("aSide",    new T.BufferAttribute(side, 1));
					if (sheet.uvs && sheet.uvs.length >= n * 2) {
						g.setAttribute("uv", new T.BufferAttribute(sheet.uvs.subarray(0, n*2), 2));
					} else {
						g.setAttribute("uv", new T.BufferAttribute(new Float32Array(n*2), 2));
					}
					g.setIndex(idx);
					g.computeVertexNormals();

					var mat = _sheetMaterial(th, cfg.sheetOpacity * 0.45);
					var mesh = new T.Mesh(g, mat);
					mesh.renderOrder = 1;
					_state.sheetGroup.add(mesh);
				}
			}

			// Feines Gitter als Orientierung
			if (cfg.showGrid && sheet.lines) {
				var lp = [], lc = [], lf = [];
				var base = new T.Color(PALETTE.gridLine);
				for (var L = 0; L < sheet.lines.length; L++) {
					var ln = sheet.lines[L];
					for (var p = 0; p + 1 < ln.length; p++) {
						var a = ln[p], b = ln[p + 1];
						if (a * 3 + 2 >= st0.sheetPos.length) continue;
						if (b * 3 + 2 >= st0.sheetPos.length) continue;
						lp.push(st0.sheetPos[a*3], st0.sheetPos[a*3+1], st0.sheetPos[a*3+2]);
						lp.push(st0.sheetPos[b*3], st0.sheetPos[b*3+1], st0.sheetPos[b*3+2]);
						lc.push(base.r, base.g, base.b);
						lc.push(base.r, base.g, base.b);
						lf.push(0.25, 0.25);
					}
				}
				if (lp.length) {
					var gl = new T.BufferGeometry();
					gl.setAttribute("position", new T.Float32BufferAttribute(lp, 3));
					gl.setAttribute("aColor",   new T.Float32BufferAttribute(lc, 3));
					gl.setAttribute("aFold",    new T.Float32BufferAttribute(lf, 1));
					var lines = new T.LineSegments(gl, _gridMaterial(th));
					lines.renderOrder = 2;
					_state.sheetGroup.add(lines);
				}
			}
		}

		// --- Die rückprojizierte Entscheidungsgrenze: das magenta Polygon ---
		if (cfg.showBoundary && pipe.boundary) {
			_addBoundary(pipe.boundary, th, 1.0);
		}

		// --- Alle Faltkanten ALLER Stufen in den Eingaberaum zurückholen ---
		// Das ist der eigentliche Erkenntnisgewinn: Man sieht, wie viele
		// Knicke im Eingaberaum landen, obwohl das Netz nur wenige Neuronen hat.
		if (cfg.showFolds) {
			_addPreimageFolds(pipe, th);
		}

		// --- Datenpunkte im Eingaberaum ---
		if (cfg.showData && st0.dataPos) {
			_addPoints(st0.dataPos, Math.floor(st0.dataPos.length / 3), th);
		}
	}

	/**
	 * Urbild aller Faltkanten im Eingaberaum.
	 *
	 * Jedes Neuron jeder Schicht definiert eine Hyperebene in SEINEM
	 * Eingangsraum. Zieht man diese durch alle vorherigen Falten zurück,
	 * entsteht im Eingaberaum eine stückweise lineare Kurve — genau die
	 * weißen Linien, die im Video das gefaltete Blatt durchziehen.
	 *
	 * Wir finden sie per Marching Squares auf dem Preaktivierungsfeld,
	 * statt die Falten analytisch zu invertieren (was nicht eindeutig ist).
	 */
	function _addPreimageFolds(pipe, th) {
		var T = _state.THREE;
		var cfg = _state.cfg;
		var stages = pipe.stages;
		var st0 = stages[0];
		if (!st0 || !st0.bounds || st0.dim < 2) return;

		var res = Math.min(cfg.boundaryRes, 80);
		if (res < 20) res = 20;

		var axes = st0.axes;
		var b = st0.bounds;
		var dim0 = st0.dim;

		// Mittelwerte der verborgenen Achsen
		var means = new Float64Array(dim0);
		if (st0.dataFlat) {
			var nS = pipe.nSamples;
			for (var s = 0; s < nS; s++) {
				for (var d = 0; d < dim0; d++) {
					var v = st0.dataFlat[s * dim0 + d];
					if (_fin(v)) means[d] += v;
				}
			}
			for (var dm = 0; dm < dim0; dm++) means[dm] /= Math.max(1, nS);
		}

		var N = res * res;
		var gx = new Float64Array(res);
		var gy = new Float64Array(res);
		for (var i = 0; i < res; i++) {
			gx[i] = b.x.lo + (b.x.hi - b.x.lo) * (i / (res - 1));
			gy[i] = b.y.lo + (b.y.hi - b.y.lo) * (i / (res - 1));
		}

		var cur = new Float64Array(N * dim0);
		for (var yy = 0; yy < res; yy++) {
			for (var xx = 0; xx < res; xx++) {
				var k = yy * res + xx;
				for (var dd = 0; dd < dim0; dd++) cur[k * dim0 + dd] = means[dd];
				if (axes[0] >= 0 && axes[0] < dim0) cur[k * dim0 + axes[0]] = gx[xx];
				if (axes[1] >= 0 && axes[1] < dim0) cur[k * dim0 + axes[1]] = gy[yy];
			}
		}
		var curDim = dim0;

		var allPts = [];
		var allTs  = [];
		var allStr = [];
		var totalFolds = 0;

		for (var li = 1; li < stages.length; li++) {
			var st = stages[li];
			if (!st.kernel || st.foldKind === "none") {
				// Trotzdem vorwärts schieben, damit die Kette intakt bleibt
				var fwd = _pushGrid(cur, N, curDim, st);
				if (!fwd) break;
				cur = fwd.post; curDim = fwd.dim;
				continue;
			}

			var fwd2 = _pushGrid(cur, N, curDim, st);
			if (!fwd2) break;

			// Für jedes (begrenzt viele) Neuron die Nullkontur der
			// Preaktivierung suchen — das ist die Faltkante im Urbild
			var limit = Math.min(st.dim, cfg.maxNeurons);
			var shownHere = 0;

			// Nach Aktivitätsanteil sortieren: Neuronen, die wirklich falten
			var order = [];
			for (var u = 0; u < st.dim; u++) {
				var neg = 0, cnt = 0;
				var step = Math.max(1, Math.floor(N / 300));
				for (var q = 0; q < N; q += step) {
					if (fwd2.pre[q * st.dim + u] < 0) neg++;
					cnt++;
				}
				var frac = cnt > 0 ? neg / cnt : 0;
				// Score: maximal bei 50% — dort teilt die Falte das Blatt
				order.push({ u: u, score: 1 - Math.abs(frac - 0.5) * 2, frac: frac });
			}
			order.sort(function (p, q) { return q.score - p.score; });

			for (var oi = 0; oi < order.length && shownHere < limit; oi++) {
				var uu = order[oi].u;
				if (order[oi].frac < 0.015 || order[oi].frac > 0.985) continue;

				var field = new Float64Array(N);
				for (var f = 0; f < N; f++) {
					var pv = fwd2.pre[f * st.dim + uu];
					field[f] = _fin(pv) ? pv : 0;
				}

				var segs = _marchingSquares(field, res, gx, gy, st0.scale);
				if (!segs || !segs.length) continue;

				// Tiefere Schichten etwas schwächer zeichnen —
				// so bleibt die Hierarchie der Falten lesbar
				var depthFade = 1 / (1 + (li - 1) * 0.35);
				var strength = Math.max(0.18, order[oi].score) * depthFade;

				var nSeg = Math.floor(segs.length / 6);
				for (var sgi = 0; sgi < nSeg; sgi++) {
					var o6 = sgi * 6;
					allPts.push(segs[o6],   segs[o6+1], segs[o6+2]);
					allPts.push(segs[o6+3], segs[o6+4], segs[o6+5]);
					var t = nSeg > 1 ? sgi / (nSeg - 1) : 0;
					allTs.push(t, t + 1 / Math.max(1, nSeg));
					allStr.push(strength, strength);
				}
				shownHere++;
				totalFolds++;
			}

			cur = fwd2.post;
			curDim = fwd2.dim;
		}

		if (!allPts.length) return;

		var g = new T.BufferGeometry();
		g.setAttribute("position",  new T.Float32BufferAttribute(allPts, 3));
		g.setAttribute("aT",        new T.Float32BufferAttribute(allTs, 1));
		g.setAttribute("aStrength", new T.Float32BufferAttribute(allStr, 1));

		var m = _foldMaterial(th, "hard", 0.9);
		var lines = new T.LineSegments(g, m);
		lines.renderOrder = 4;
		_state.foldGroup.add(lines);

		_log("Urbild-Falten: " + totalFolds + " Kanten im Eingaberaum");
	}

	/**
	 * Hilfsfunktion: beliebiges flaches Gitter durch eine Stufe schieben.
	 * Gibt Pre- und Postaktivierung zurück.
	 */
	function _pushGrid(flat, n, inDim, stage) {
		if (!stage || !stage.kernel) return null;
		if (stage.inDim !== inDim) {
			_log("_pushGrid: Dimension passt nicht (" + inDim + " vs " + stage.inDim + ")");
			return null;
		}
		var outD = stage.dim;
		var kern = stage.kernel;
		var bias = stage.bias;
		var act  = stage.activation;

		var pre  = new Float64Array(n * outD);
		var post = new Float64Array(n * outD);

		for (var i = 0; i < n; i++) {
			var rI = i * inDim, rO = i * outD;
			for (var u = 0; u < outD; u++) {
				var s = 0;
				for (var d = 0; d < inDim; d++) {
					var xv = flat[rI + d];
					if (!_fin(xv)) xv = 0;
					s += xv * kern[d * outD + u];
				}
				if (bias && _fin(bias[u])) s += bias[u];
				if (!_fin(s)) s = 0;
				pre[rO + u]  = s;
				post[rO + u] = _applyAct(s, act);
			}
		}
		return { pre: pre, post: post, dim: outD, n: n };
	}

	// ------------------------------------------------------------------
	// Modus C: Gestapelte Halbräume
	// ------------------------------------------------------------------

	/**
	 * Der Look aus Screenshot 1/5/6: pro Neuron ein durchscheinendes Blatt,
	 * cyan für die positive, ocker für die negative Seite, mit weißer
	 * Faltkante dazwischen. Die Blätter werden gestapelt bzw. explodiert.
	 */
	function _buildStackMode(pipe, th) {
		var T = _state.THREE;
		var cfg = _state.cfg;
		var stages = pipe.stages;

		// Scrubber wählt die Schicht
		var sc = _state.scrub;
		if (!_fin(sc)) sc = 1;
		sc = Math.max(0, Math.min(1, sc));
		var nSteps = stages.length - 1;
		var layerSel = Math.max(1, Math.min(nSteps, Math.round(sc * nSteps)));
		_state.activeLayer = layerSel;

		var st = stages[layerSel];
		var prev = stages[layerSel - 1];
		if (!st || !prev) return;

		var halfs = st.halfspaces;
		if (!halfs || !halfs.length) {
			// Keine Halbräume: Fallback auf die Faltkanten
			if (st.folds) _addFolds(st.folds, prev, 0, th);
			if (cfg.showData && prev.dataPos) {
				_addPoints(prev.dataPos, Math.floor(prev.dataPos.length / 3), th);
			}
			return;
		}

		// Stapelabstand: normiert auf die Szenengröße
		var ext = 1;
		if (prev.bounds) {
			ext = Math.max(
				Math.abs(prev.bounds.x.hi - prev.bounds.x.lo),
				Math.abs(prev.bounds.y.hi - prev.bounds.y.lo)
			) * prev.scale;
		}
		if (!_fin(ext) || ext < 1e-6) ext = 100;

		var nShow = Math.min(halfs.length, cfg.maxNeurons);
		var spread = cfg.stackSpread;
		if (!_fin(spread)) spread = 1;
		var gap = ext * 0.14 * spread;

		var totalH = (nShow - 1) * gap;

		for (var i = 0; i < nShow; i++) {
			var hsp = halfs[i];
			var zOff = -totalH / 2 + i * gap;

			// --- Positive Seite (cyan) ---
			if (hsp.posPoly && hsp.posPoly.length >= 3) {
				var meshP = _polyMesh(hsp.posPoly, zOff, PALETTE.halfPos,
				                      cfg.stackOpacity * (hsp.active ? 1 : 0.4), th, 1);
				if (meshP) _state.stackGroup.add(meshP);
			}

			// --- Negative Seite (ocker) ---
			if (hsp.negPoly && hsp.negPoly.length >= 3) {
				var meshN = _polyMesh(hsp.negPoly, zOff, PALETTE.halfNeg,
				                      cfg.stackOpacity * (hsp.active ? 1 : 0.4), th, 0);
				if (meshN) _state.stackGroup.add(meshN);
			}

			// --- Faltkante (weiß, leuchtend) ---
			if (cfg.showFolds && hsp.edge && hsp.edge.length >= 2) {
				var ep = [], et = [], es = [];
				for (var e = 0; e + 1 < hsp.edge.length; e += 2) {
					var A = hsp.edge[e], B = hsp.edge[e + 1];
					if (!A || !B) continue;
					ep.push(A[0], A[1], A[2] + zOff);
					ep.push(B[0], B[1], B[2] + zOff);
					et.push(0, 1);
					var str = hsp.active ? (0.55 + 0.45 * hsp.visible) : 0.22;
					es.push(str, str);
				}
				if (ep.length) {
					var ge = new T.BufferGeometry();
					ge.setAttribute("position",  new T.Float32BufferAttribute(ep, 3));
					ge.setAttribute("aT",        new T.Float32BufferAttribute(et, 1));
					ge.setAttribute("aStrength", new T.Float32BufferAttribute(es, 1));
					var le = new T.LineSegments(ge, _foldMaterial(th, st.foldKind, 1.0));
					le.renderOrder = 5;
					_state.stackGroup.add(le);
				}
			}

			// --- Datenpunkte auf das jeweilige Blatt projizieren ---
			// Nur auf dem obersten Blatt, sonst wird es unlesbar
			if (cfg.showData && i === nShow - 1 && prev.dataPos) {
				var nd = Math.floor(prev.dataPos.length / 3);
				var dp = new Float32Array(nd * 3);
				for (var q = 0; q < nd; q++) {
					dp[q * 3]     = prev.dataPos[q * 3];
					dp[q * 3 + 1] = prev.dataPos[q * 3 + 1];
					dp[q * 3 + 2] = zOff + 0.6;
				}
				_addPoints(dp, nd, th);
			}
		}

		// --- Grenze unten als Referenz ---
		if (cfg.showBoundary && pipe.boundary && layerSel === 1) {
			var bg = pipe.boundary;
			if (bg.segs && bg.segs.length) {
				var shifted = new Float32Array(bg.segs.length);
				for (var k = 0; k < bg.segs.length; k += 3) {
					shifted[k]     = bg.segs[k];
					shifted[k + 1] = bg.segs[k + 1];
					shifted[k + 2] = bg.segs[k + 2] - totalH / 2 - gap;
				}
				_addBoundary({ segs: shifted }, th, 0.8);
			}
		}
	}

	/**
	 * Polygon → Mesh mit Triangle-Fan. Winkelsortiert, also konvex genug.
	 * Nulldreiecke werden aussortiert, sonst reißt das Blatt an der Faltkante.
	 */
	function _polyMesh(poly, zOff, color, opacity, th, sideVal) {
		var T = _state.THREE;
		if (!poly || poly.length < 3) return null;

		var n = poly.length;
		var verts = new Float32Array(n * 3);
		var side  = new Float32Array(n);
		var uvs   = new Float32Array(n * 2);

		var ok = true;
		for (var i = 0; i < n; i++) {
			var p = poly[i];
			if (!p || !_fin(p[0]) || !_fin(p[1])) { ok = false; break; }
			verts[i * 3]     = p[0];
			verts[i * 3 + 1] = p[1];
			verts[i * 3 + 2] = (_fin(p[2]) ? p[2] : 0) + zOff;
			side[i] = _fin(sideVal) ? sideVal : 1;
			uvs[i * 2]     = i / Math.max(1, n - 1);
			uvs[i * 2 + 1] = 0.5;
		}
		if (!ok) return null;

		var idx = [];
		for (var t = 1; t + 1 < n; t++) {
			// Fläche prüfen
			var ax = verts[t*3]     - verts[0];
			var ay = verts[t*3+1]   - verts[1];
			var bx = verts[(t+1)*3]   - verts[0];
			var by = verts[(t+1)*3+1] - verts[1];
			var cr = ax * by - ay * bx;
			if (!_fin(cr) || Math.abs(cr) < 1e-10) continue;
			idx.push(0, t, t + 1);
		}
		if (!idx.length) return null;

		var g = new T.BufferGeometry();
		g.setAttribute("position", new T.BufferAttribute(verts, 3));
		g.setAttribute("aSide",    new T.BufferAttribute(side, 1));
		g.setAttribute("uv",       new T.BufferAttribute(uvs, 2));
		g.setIndex(idx);
		g.computeVertexNormals();

		var c = new T.Color(color);
		var mat = new T.ShaderMaterial({
			uniforms: {
				uColorPos: { value: new T.Vector3(c.r, c.g, c.b) },
				uColorNeg: { value: new T.Vector3(c.r, c.g, c.b) },
				uOpacity:  { value: _fin(opacity) ? opacity : 0.3 },
				uTime:     { value: 0 },
				uCamPos:   { value: new T.Vector3() },
				uFresnel:  { value: th.dark ? 0.6 : 0.32 }
			},
			vertexShader:   SHEET_VS,
			fragmentShader: SHEET_FS,
			transparent:    true,
			depthWrite:     false,
			side:           T.DoubleSide,
			blending:       T.NormalBlending
		});

		var mesh = new T.Mesh(g, mat);
		mesh.renderOrder = 2;
		return mesh;
	}

	// ------------------------------------------------------------------
	// Achsenkreuz
	// ------------------------------------------------------------------

	function _buildAxes(pipe, th) {
		var T = _state.THREE;
		var st = pipe.stages[Math.max(0, Math.min(_state.activeLayer, pipe.stages.length - 1))];
		if (!st || !st.bounds) return;

		var L = 1;
		try {
			L = Math.max(
				Math.abs(st.bounds.x.hi - st.bounds.x.lo),
				Math.abs(st.bounds.y.hi - st.bounds.y.lo),
				Math.abs(st.bounds.z.hi - st.bounds.z.lo)
			) * st.scale * 0.62;
		} catch (e) { L = 100; }
		if (!_fin(L) || L < 1e-6) L = 100;

		var pts = [
			0, 0, 0,  L, 0, 0,
			0, 0, 0,  0, L, 0,
			0, 0, 0,  0, 0, L
		];
		var g = new T.BufferGeometry();
		g.setAttribute("position", new T.Float32BufferAttribute(pts, 3));
		var m = new T.LineBasicMaterial({
			color: PALETTE.axis, transparent: true, opacity: 0.55
		});
		var ax = new T.LineSegments(g, m);
		ax.renderOrder = 0;
		_state.helperGroup.add(ax);
	}

	// ==================================================================
	// 15. DOM
	// ==================================================================

	function _resolveParent(divOrId) {
		if (typeof divOrId === "string" && divOrId !== "") {
			var byId = document.getElementById(divOrId);
			if (byId) { _state.parentRef = divOrId; return byId; }
			_warn("Div '" + divOrId + "' nicht gefunden — hänge an <body>");
			return null;
		}
		if (divOrId && typeof HTMLElement !== "undefined" && divOrId instanceof HTMLElement) {
			_state.parentRef = divOrId;
			return divOrId;
		}
		try {
			if (divOrId && typeof divOrId === "object" &&
			    typeof divOrId.length === "number" && divOrId.length > 0 &&
			    divOrId[0] && divOrId[0].nodeType === 1) {
				_state.parentRef = divOrId[0];
				return divOrId[0];
			}
		} catch (e) {}
		try {
			if (typeof divOrId === "string" && typeof global.$ === "function") {
				var $el = global.$(divOrId);
				if ($el && $el.length && $el[0] && $el[0].nodeType === 1) {
					_state.parentRef = $el[0];
					return $el[0];
				}
			}
		} catch (e) {}
		return null;
	}

	function _styleContainer() {
		if (!_state.container) return;
		var th = _theme();
		_state.container.style.cssText = [
			"position:relative",
			"margin:18px 0",
			"padding:0",
			"border-radius:14px",
			"overflow:hidden",
			"background:" + th.panelBg,
			"border:1px solid " + th.panelBorder,
			"box-shadow:" + th.panelShadow,
			"font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif",
			"font-size:12px",
			"color:" + th.text,
			"box-sizing:border-box",
			"user-select:none",
			"contain:layout style"
		].join(";");
	}

	function _buildDOM(divOrId) {
		var existing = document.getElementById(SID);
		if (existing && existing.parentNode) {
			_state.container  = existing;
			_state.canvasWrap = document.getElementById(SID + "_canvas");
			_state.ctrlEl     = document.getElementById(SID + "_ctrl");
			_state.hudEl      = document.getElementById(SID + "_hud");
			_state.netEl      = document.getElementById(SID + "_net");
			_styleContainer();
			return existing;
		}

		var parent = _resolveParent(divOrId);
		var th = _theme();

		var c = document.createElement("div");
		c.id = SID;
		_state.container = c;
		_styleContainer();

		// --- Canvas-Bereich ---
		var wrap = document.createElement("div");
		wrap.id = SID + "_canvas";
		wrap.style.cssText = [
			"position:relative",
			"width:100%",
			"height:620px",
			"min-height:360px",
			"overflow:hidden",
			"background:" + th.bgCss,
			"cursor:grab"
		].join(";");
		c.appendChild(wrap);
		_state.canvasWrap = wrap;

		// --- Kopfzeile mit Modus-Umschaltern ---
		var head = document.createElement("div");
		head.style.cssText = [
			"position:absolute", "top:0", "left:0", "right:0",
			"display:flex", "align-items:center", "gap:10px",
			"padding:10px 14px", "flex-wrap:wrap",
			"pointer-events:none", "z-index:8"
		].join(";");

		var title = document.createElement("div");
		title.id = SID + "_title";
		title.style.cssText = [
			"font-weight:800", "font-size:13.5px", "letter-spacing:0.4px",
			"color:" + th.text,
			"text-shadow:0 1px 10px rgba(0,0,0,0.45)",
			"pointer-events:none"
		].join(";");
		title.innerHTML = "\u2726 " + _tr("origami_live_title",
			"Origami: Wie das Netz den Raum faltet");
		head.appendChild(title);

		var modeRow = document.createElement("div");
		modeRow.style.cssText = "display:flex;gap:6px;pointer-events:auto;";

		var MODES = [
			[MODE_FOLD,     "\u25F0", "origami_live_mode_fold",     "Faltung",
			 "origami_live_mode_fold_tip",
			  "Das Eingabeblatt wird Schicht für Schicht geknickt. " +
			  "Cyan = positive Seite, Ocker = plattgedrückte Seite."],
			[MODE_BOUNDARY, "\u25C8", "origami_live_mode_boundary", "Grenze",
			 "origami_live_mode_boundary_tip",
			  "Die flache Trennebene der letzten Schicht, zurück durch alle " +
			  "Falten in den Eingaberaum projiziert."],
			[MODE_STACK,    "\u2338", "origami_live_mode_stack",    "Stapel",
			 "origami_live_mode_stack_tip",
			  "Pro Neuron ein Halbraum-Blatt, gestapelt. Weiße Kante = " +
			  "die Hyperebene, an der ReLU knickt."]
		];

		_state.modeBtns = {};
		_state.uiText = [];   // [{el, kind: "text"|"tip", key, fb, prefix}, ...]
		for (var mi = 0; mi < MODES.length; mi++) {
			(function (def) {
				var b = document.createElement("button");
				b.type = "button";
				b.setAttribute("data-mode", def[0]);
				b.style.cssText = _btnCss(th, _state.cfg.mode === def[0]);
				b.addEventListener("click", function (e) {
					e.preventDefault();
					setMode(def[0]);
				});
				modeRow.appendChild(b);
				_state.modeBtns[def[0]] = b;
				_state.uiText.push({ el: b, kind: "text", prefix: def[1],
				                     key: def[2], fb: def[3] });
				_state.uiText.push({ el: b, kind: "tip", key: def[4], fb: def[5] });
			})(MODES[mi]);
		}
		head.appendChild(modeRow);

		var spacer = document.createElement("div");
		spacer.style.cssText = "flex:1 1 auto;";
		head.appendChild(spacer);

		var toolRow = document.createElement("div");
		toolRow.style.cssText = "display:flex;gap:6px;pointer-events:auto;";

		function tool(label, tip, fn) {
			var b = document.createElement("button");
			b.type = "button";
			b.textContent = label;
			b.title = tip;
			b.style.cssText = _btnCss(th, false);
			b.addEventListener("click", function (e) {
				e.preventDefault();
				try { fn(); } catch (ex) { _err("Button: " + ex); }
			});
			toolRow.appendChild(b);
			return b;
		}

		_state.playBtn = tool("\u25B6",
			_tr("origami_live_play_tip",
				"Zeitlupe: faltet das Blatt Schicht für Schicht auf und zu."),
			function () { _togglePlay(); });
		_state.uiText.push({ el: _state.playBtn, kind: "tip",
		                     key: "origami_live_play_tip",
		                     fb: "Zeitlupe: faltet das Blatt Schicht für Schicht auf und zu." });

		tool("\u21BA",
			_tr("origami_live_reset_tip", "Kamera zurücksetzen."),
			function () { _resetCamera(); });

		_state.fsBtn = tool("\u26F6",
			_tr("origami_live_fullscreen_tip", "Vollbild."),
			function () { _toggleFullscreen(); });
		_state.uiText.push({ el: _state.fsBtn, kind: "tip",
		                     key: "origami_live_fullscreen_tip", fb: "Vollbild." });

		_state.gearBtn = tool("\u2699",
			_tr("origami_live_settings_tip", "Einstellungen und Qualität."),
			function () { _togglePanel(); });

		head.appendChild(toolRow);
		wrap.appendChild(head);

		// --- Scrubber (unten) ---
		var scrubWrap = document.createElement("div");
		scrubWrap.style.cssText = [
			"position:absolute", "bottom:0", "left:0", "right:0",
			"padding:10px 16px 12px 16px",
			"display:flex", "align-items:center", "gap:12px",
			"z-index:8", "pointer-events:auto"
		].join(";");

		var scrubLbl = document.createElement("div");
		scrubLbl.id = SID + "_scrublbl";
		scrubLbl.style.cssText = [
			"font-size:11px", "font-weight:700", "min-width:150px",
			"color:" + th.text,
			"text-shadow:0 1px 8px rgba(0,0,0,0.5)"
		].join(";");
		scrubLbl.textContent = _tr("origami_live_layer", "Schicht") + " —";
		scrubWrap.appendChild(scrubLbl);
		_state.scrubLblEl = scrubLbl;
		_state.uiText.push({ el: scrubLbl, kind: "label",
		                     key: "origami_live_layer", fb: "Schicht" });

		var scrub = document.createElement("input");
		scrub.type = "range";
		scrub.min = "0";
		scrub.max = "1000";
		scrub.step = "1";
		scrub.value = "1000";
		scrub.title = _tr("origami_live_scrub_tip",
			"Zieht das Blatt durch die Schichten. Links = Eingaberaum, " +
			"rechts = letzte Faltung.");
		_state.uiText.push({ el: scrub, kind: "tip",
		                     key: "origami_live_scrub_tip",
		                     fb: "Zieht das Blatt durch die Schichten. " +
		                         "Links = Eingaberaum, rechts = letzte Faltung." });
		scrub.style.cssText = [
			"flex:1 1 auto", "cursor:pointer",
			"accent-color:" + (th.dark ? "#e8b43c" : "#d99a16")
		].join(";");
		scrub.addEventListener("input", function () {
			_state.scrubPlaying = false;
			if (_state.playBtn) _state.playBtn.textContent = "\u25B6";
			var v = parseFloat(scrub.value) / 1000;
			_state.scrub = _fin(v) ? v : 1;
			_state.scrubTarget = _state.scrub;
			_state.dirty = true;
			_rebuildGeometryOnly();
		});
		scrubWrap.appendChild(scrub);
		_state.scrubEl = scrub;

		wrap.appendChild(scrubWrap);

		// --- HUD (Erklärtext-Box) ---
		// Liegt UNTER dem Canvas (im Container, nicht im Wrap mit overflow:hidden),
		// damit es das Faltbild nicht überdeckt.
		var hud = document.createElement("div");
		hud.id = SID + "_hud";
		hud.style.cssText = [
			"position:relative",
			"margin:12px 14px 6px 14px",
			"max-width:760px", "padding:10px 12px",
			"border-radius:9px", "font-size:11.5px", "line-height:1.55",
			"color:" + th.text, "background:" + th.hudBg,
			"border:1px solid " + th.panelBorder,
			"backdrop-filter:blur(9px)", "-webkit-backdrop-filter:blur(9px)",
			"box-sizing:border-box",
			"box-shadow:0 6px 24px rgba(0,0,0,0.3)"
		].join(";");
		c.appendChild(hud);
		_state.hudEl = hud;

		// --- Mini-Netz rechts unten ---
		var net = document.createElement("div");
		net.id = SID + "_net";
		net.style.cssText = [
			"position:absolute", "right:14px", "bottom:52px",
			"width:148px", "height:132px",
			"border-radius:10px", "padding:6px",
			"background:" + th.netBg,
			"border:1px solid " + th.netBorder,
			"backdrop-filter:blur(8px)", "-webkit-backdrop-filter:blur(8px)",
			"pointer-events:none", "z-index:7"
		].join(";");
		wrap.appendChild(net);
		_state.netEl = net;

		// --- Einstellungs-Panel ---
		var ctrl = document.createElement("div");
		ctrl.id = SID + "_ctrl";
		ctrl.style.cssText = [
			"position:absolute", "top:50px", "right:14px",
			"width:252px", "max-height:calc(100% - 110px)",
			"overflow-y:auto",
			"padding:12px 14px", "border-radius:11px",
			"font-size:11.5px", "color:" + th.text,
			"background:" + th.panelBg,
			"border:1px solid " + th.panelBorder,
			"box-shadow:" + th.panelShadow,
			"backdrop-filter:blur(12px)", "-webkit-backdrop-filter:blur(12px)",
			"display:none", "z-index:9", "pointer-events:auto"
		].join(";");
		wrap.appendChild(ctrl);
		_state.ctrlEl = ctrl;
		_buildPanel();

		// --- Tooltip ---
		var tip = document.createElement("div");
		tip.style.cssText = [
			"position:fixed", "pointer-events:none", "z-index:99999",
			"display:none", "max-width:320px", "padding:9px 11px",
			"font-size:11.5px", "line-height:1.5", "border-radius:8px",
			"color:" + th.text, "background:" + th.tipBg,
			"border:1px solid " + th.tipBorder,
			"box-shadow:0 10px 36px rgba(0,0,0,0.45)",
			"backdrop-filter:blur(12px)", "-webkit-backdrop-filter:blur(12px)",
			"opacity:0", "transition:opacity .12s ease"
		].join(";");
		document.body.appendChild(tip);
		_state.tipEl = tip;

		// --- Hinweis-Overlay ---
		var ov = document.createElement("div");
		ov.style.cssText = [
			"position:absolute", "inset:0",
			"display:none", "align-items:center", "justify-content:center",
			"text-align:center", "padding:28px",
			"font-size:13.5px", "font-weight:600", "line-height:1.6",
			"color:" + th.text, "background:" + th.hudBg,
			"backdrop-filter:blur(5px)", "-webkit-backdrop-filter:blur(5px)",
			"pointer-events:none", "z-index:6"
		].join(";");
		wrap.appendChild(ov);
		_state.overlayEl = ov;

		try {
			if (parent) parent.appendChild(c);
			else document.body.appendChild(c);
		} catch (e) {
			_err("Container konnte nicht eingehängt werden: " + e);
			try { document.body.appendChild(c); } catch (e2) {}
		}

		return c;
	}

	function _btnCss(th, active) {
		return [
			"padding:6px 11px", "border:none", "border-radius:7px",
			"cursor:pointer", "font-weight:700", "font-size:11px",
			"letter-spacing:0.2px",
			"background:" + (active ? th.btnBgOn : th.btnBg),
			"color:" + (active ? th.btnFgOn : th.btnFg),
			"box-shadow:0 3px 12px rgba(0,0,0,0.26)",
			"transition:transform .13s ease, box-shadow .13s ease",
			"white-space:nowrap"
		].join(";");
	}

	// ==================================================================
	// 16. EINSTELLUNGS-PANEL
	// ==================================================================

	function _buildPanel() {
		var el = _state.ctrlEl;
		if (!el) return;
		var th = _theme();
		var cfg = _state.cfg;
		el.innerHTML = "";

		function section(titleTxt) {
			var h = document.createElement("div");
			h.style.cssText = [
				"font-weight:800", "font-size:10.5px",
				"text-transform:uppercase", "letter-spacing:0.8px",
				"margin:12px 0 6px 0", "color:" + th.accent
			].join(";");
			h.textContent = titleTxt;
			el.appendChild(h);
		}

		function slider(key, label, min, max, step, tip, fmt) {
			var w = document.createElement("label");
			w.title = tip || "";
			w.style.cssText = "display:block;margin:7px 0;cursor:pointer;";

			var row = document.createElement("div");
			row.style.cssText =
				"display:flex;justify-content:space-between;" +
				"font-size:11px;margin-bottom:3px;";
			var ln = document.createElement("span");
			ln.textContent = label;
			ln.style.opacity = "0.85";
			var lv = document.createElement("span");
			lv.style.cssText = "font-variant-numeric:tabular-nums;font-weight:700;";
			lv.textContent = fmt ? fmt(cfg[key]) : cfg[key];
			row.appendChild(ln);
			row.appendChild(lv);
			w.appendChild(row);

			var inp = document.createElement("input");
			inp.type = "range";
			inp.min = String(min);
			inp.max = String(max);
			inp.step = String(step);
			inp.value = String(cfg[key]);
			inp.style.cssText =
				"width:100%;cursor:pointer;accent-color:" +
				(th.dark ? "#8fa4e8" : "#4463ae") + ";";
			inp.addEventListener("input", function () {
				var v = parseFloat(inp.value);
				if (!_fin(v)) return;
				cfg[key] = v;
				lv.textContent = fmt ? fmt(v) : v;
				_state.autoQuality = false;
				_markDirty(true);
			});
			w.appendChild(inp);
			el.appendChild(w);
		}

		function check(key, label, tip) {
			var w = document.createElement("label");
			w.title = tip || "";
			w.style.cssText =
				"display:flex;align-items:center;gap:7px;" +
				"margin:6px 0;cursor:pointer;font-size:11px;";
			var cb = document.createElement("input");
			cb.type = "checkbox";
			cb.checked = !!cfg[key];
			cb.style.cssText = "cursor:pointer;accent-color:" +
				(th.dark ? "#e8b43c" : "#d99a16") + ";";
			cb.addEventListener("change", function () {
				cfg[key] = cb.checked;
				_markDirty(true);
			});
			var sp = document.createElement("span");
			sp.textContent = label;
			sp.style.opacity = "0.9";
			w.appendChild(cb);
			w.appendChild(sp);
			el.appendChild(w);
		}

		// ---- Qualität ----
		section(_tr("origami_live_sec_quality", "Qualität"));

		var qRow = document.createElement("div");
		qRow.style.cssText = "display:flex;gap:4px;margin:4px 0 8px 0;";
		var QL = [
			[0, _tr("origami_live_q_low", "Spar")],
			[1, _tr("origami_live_q_mid", "Mittel")],
			[2, _tr("origami_live_q_high", "Hoch")],
			[3, _tr("origami_live_q_ultra", "Ultra")]
		];
		_state.qBtns = [];
		for (var qi = 0; qi < QL.length; qi++) {
			(function (lvl, lbl) {
				var b = document.createElement("button");
				b.type = "button";
				b.textContent = lbl;
				b.title = _tr("origami_live_q_tip",
					"Höhere Qualität = feineres Gitter und mehr Halbräume, " +
					"aber langsamer. 'Auto' passt das selbst an.");
				b.style.cssText = _btnCss(th, _state.qualityLevel === lvl)
				                  .replace("padding:6px 11px", "padding:5px 7px") +
				                  ";flex:1;font-size:10px;";
				b.addEventListener("click", function (e) {
					e.preventDefault();
					_state.autoQuality = false;
					_applyQuality(lvl);
					_refreshQBtns();
					_markDirty(true);
					_buildPanel();
				});
				qRow.appendChild(b);
				_state.qBtns.push({ lvl: lvl, btn: b });
			})(QL[qi][0], QL[qi][1]);
		}
		el.appendChild(qRow);

		var autoW = document.createElement("label");
		autoW.title = _tr("origami_live_auto_tip",
			"Regelt Gitterauflösung und Neuronenzahl automatisch so, " +
			"dass 60 Bilder pro Sekunde gehalten werden.");
		autoW.style.cssText =
			"display:flex;align-items:center;gap:7px;margin:4px 0 8px 0;" +
			"cursor:pointer;font-size:11px;";
		var autoCb = document.createElement("input");
		autoCb.type = "checkbox";
		autoCb.checked = _state.autoQuality;
		autoCb.style.cssText = "cursor:pointer;";
		autoCb.addEventListener("change", function () {
			_state.autoQuality = autoCb.checked;
			_state.frameTimes = [];
		});
		autoW.appendChild(autoCb);
		var autoSp = document.createElement("span");
		autoSp.textContent = _tr("origami_live_auto", "Automatisch anpassen");
		autoW.appendChild(autoSp);
		el.appendChild(autoW);

		slider("gridRes", _tr("origami_live_gridres", "Gitterauflösung"),
			7, 81, 2,
			_tr("origami_live_gridres_tip",
				"Wie fein das gefaltete Blatt vernetzt ist."),
			function (v) { return v.toFixed(0); });

		slider("maxNeurons", _tr("origami_live_maxneurons", "Falten pro Schicht"),
			1, 64, 1,
			_tr("origami_live_maxneurons_tip",
				"Jedes Neuron erzeugt eine Faltkante. Hier wird begrenzt, " +
				"wie viele davon gezeichnet werden — sortiert nach Wirkung."),
			function (v) { return v.toFixed(0); });

		slider("maxLayers", _tr("origami_live_maxlayers", "Sichtbare Schichten"),
			1, 12, 1,
			_tr("origami_live_maxlayers_tip",
				"Tiefe der dargestellten Faltungskette."),
			function (v) { return v.toFixed(0); });

		slider("boundaryRes", _tr("origami_live_boundres", "Grenz-Auflösung"),
			30, 160, 10,
			_tr("origami_live_boundres_tip",
				"Feinheit der magenta Entscheidungsgrenze. Höher = glatter, " +
				"aber rechenintensiver."),
			function (v) { return v.toFixed(0); });

		slider("maxPoints", _tr("origami_live_maxpoints", "Datenpunkte"),
			100, 6000, 100,
			_tr("origami_live_maxpoints_tip",
				"Anzahl der dargestellten Trainingsbeispiele."),
			function (v) { return v.toFixed(0); });

		// ---- Darstellung ----
		section(_tr("origami_live_sec_look", "Darstellung"));

		check("showSheet", _tr("origami_live_show_sheet", "Gefaltetes Blatt"),
			_tr("origami_live_show_sheet_tip",
				"Die Fläche, die das Netz knickt."));
		check("showGrid", _tr("origami_live_show_grid", "Gitterlinien"),
			_tr("origami_live_show_grid_tip",
				"Zeigt, wie stark einzelne Kanten gestaucht oder gestreckt " +
				"werden — hell = starke Verformung."));
		check("showFolds", _tr("origami_live_show_folds", "Faltkanten"),
			_tr("origami_live_show_folds_tip",
				"Die weißen Linien: dort gilt w·x + b = 0, dort knickt ReLU."));
		check("showData", _tr("origami_live_show_data", "Datenpunkte"),
			_tr("origami_live_show_data_tip",
				"Die Trainingsbeispiele, nach Klasse gefärbt."));
		check("showBoundary", _tr("origami_live_show_bound", "Entscheidungsgrenze"),
			_tr("origami_live_show_bound_tip",
				"Die magenta Linie: hier wechselt die Vorhersage."));
		check("showAxes", _tr("origami_live_show_axes", "Achsenkreuz"),
			_tr("origami_live_show_axes_tip",
				"Koordinatenachsen des aktuellen Raums."));
		check("showNetDiagram", _tr("origami_live_show_net", "Mini-Netz"),
			_tr("origami_live_show_net_tip",
				"Kleines Diagramm rechts unten mit der aktiven Schicht."));
		check("showHud", _tr("origami_live_show_hud", "Erklärtext"),
			_tr("origami_live_show_hud_tip",
				"Die Infobox links unten."));

		slider("sheetOpacity", _tr("origami_live_sheetop", "Blatt-Deckkraft"),
			0.05, 1, 0.01, "", function (v) { return v.toFixed(2); });
		slider("stackOpacity", _tr("origami_live_stackop", "Stapel-Deckkraft"),
			0.05, 1, 0.01, "", function (v) { return v.toFixed(2); });
		slider("stackSpread", _tr("origami_live_spread", "Stapel-Abstand"),
			0, 8, 0.05,
			_tr("origami_live_spread_tip",
				"Zieht die gestapelten Halbräume auseinander."),
			function (v) { return v.toFixed(2); });
		slider("pointSize", _tr("origami_live_ptsize", "Punktgröße"),
			0.8, 12, 0.2, "", function (v) { return v.toFixed(1); });

		// ---- Bewegung ----
		section(_tr("origami_live_sec_motion", "Bewegung"));

		check("autoRotate", _tr("origami_live_rotate", "Automatisch drehen"),
			_tr("origami_live_rotate_tip",
				"Dreht die Szene langsam, damit die Faltung räumlich lesbar wird."));

		slider("rotateSpeed", _tr("origami_live_rotspeed", "Drehgeschwindigkeit"),
			0.02, 0.8, 0.02, "", function (v) { return v.toFixed(2); });
		slider("scrubSpeed", _tr("origami_live_scrubspeed", "Zeitlupen-Tempo"),
			0.1, 2, 0.05,
			_tr("origami_live_scrubspeed_tip",
				"Wie schnell das Blatt beim Abspielen gefaltet wird."),
			function (v) { return v.toFixed(2); });

		// ---- Achsen ----
		var pipe = _state.pipeline;
		var needAxes = false;
		if (pipe && pipe.stages) {
			for (var p = 0; p < pipe.stages.length; p++) {
				if (pipe.stages[p].dim > 3) { needAxes = true; break; }
			}
		}

		if (needAxes) {
			section(_tr("origami_live_sec_axes", "Achsen"));

			var note = document.createElement("div");
			note.style.cssText = [
				"font-size:10.5px", "line-height:1.5", "opacity:0.8",
				"margin:2px 0 8px 0", "padding:7px 9px", "border-radius:6px",
				"background:" + (th.dark ? "rgba(232,180,60,0.12)"
				                         : "rgba(217,154,22,0.12)"),
				"border-left:3px solid " + (th.dark ? "#e8b43c" : "#d99a16")
			].join(";");
			note.textContent = _tr("origami_live_axes_note",
				"Dieser Raum hat mehr als 3 Dimensionen. Es werden die drei " +
				"Neuronen mit der stärksten Aktivierungsschwankung gezeigt — " +
				"keine Projektion, sondern echte Achsen. Die Faltkanten bleiben " +
				"dadurch exakte Hyperebenen.");
			el.appendChild(note);

			var modeRow2 = document.createElement("div");
			modeRow2.style.cssText = "display:flex;gap:4px;margin:4px 0 8px 0;";
			var AM = [
				["auto",   _tr("origami_live_axes_auto", "Automatisch")],
				["manual", _tr("origami_live_axes_manual", "Manuell")]
			];
			for (var ai = 0; ai < AM.length; ai++) {
				(function (val, lbl) {
					var b = document.createElement("button");
					b.type = "button";
					b.textContent = lbl;
					b.style.cssText = _btnCss(th, cfg.axisMode === val)
					                  .replace("padding:6px 11px", "padding:5px 8px") +
					                  ";flex:1;font-size:10px;";
					b.addEventListener("click", function (e) {
						e.preventDefault();
						cfg.axisMode = val;
						_markDirty(true);
						_buildPanel();
					});
					modeRow2.appendChild(b);
				})(AM[ai][0], AM[ai][1]);
			}
			el.appendChild(modeRow2);

			if (cfg.axisMode === "manual") {
				_axisSelects(el, th, pipe);
			} else {
				_axisInfo(el, th, pipe);
			}
		}

		// ---- Conv ----
		var hasConv = false;
		if (pipe && pipe.stages) {
			for (var q = 0; q < pipe.stages.length; q++) {
				if (pipe.stages[q].isConv) { hasConv = true; break; }
			}
		}
		if (hasConv) {
			section(_tr("origami_live_sec_conv", "Faltungsschichten"));

			var convNote = document.createElement("div");
			convNote.style.cssText = [
				"font-size:10.5px", "line-height:1.5", "opacity:0.8",
				"margin:2px 0 8px 0", "padding:7px 9px", "border-radius:6px",
				"background:" + (th.dark ? "rgba(43,163,184,0.12)"
				                         : "rgba(43,163,184,0.1)"),
				"border-left:3px solid " + (th.dark ? "#4fd4e8" : "#2ba3b8")
			].join(";");
			convNote.textContent = _tr("origami_live_conv_note",
				"Jeder Filter wird als kleines Netz über seinem Patch " +
				"betrachtet. Ein 3×3-Filter spannt damit einen 9-dimensionalen " +
				"Unterraum auf — in dem lässt sich die Faltung genauso " +
				"analysieren wie bei dichten Schichten.");
			el.appendChild(convNote);

			check("convPatchMode", _tr("origami_live_conv_patch", "Patch-Modus"),
				_tr("origami_live_conv_patch_tip",
					"Behandelt jeden Filter als kleines dichtes Netz über " +
					"seinem Bildausschnitt."));
			slider("convMaxFilters", _tr("origami_live_conv_filters", "Filter zeigen"),
				1, 64, 1,
				_tr("origami_live_conv_filters_tip",
					"Wie viele Filter pro Faltungsschicht dargestellt werden."),
				function (v) { return v.toFixed(0); });
		}

		// ---- Diagnose ----
		section(_tr("origami_live_sec_diag", "Diagnose"));
		var diag = document.createElement("div");
		diag.id = SID + "_diag";
		diag.style.cssText = [
			"font-size:10px", "line-height:1.6", "opacity:0.78",
			"font-family:ui-monospace,SFMono-Regular,Menlo,monospace",
			"white-space:pre-wrap", "word-break:break-word"
		].join(";");
		el.appendChild(diag);
		_state.diagEl = diag;
		_updateDiag();

		// ---- Legende ----
		section(_tr("origami_live_sec_legend", "Lesehilfe"));
		var leg = document.createElement("div");
		leg.style.cssText = "font-size:10.5px;line-height:1.75;";
		leg.innerHTML = _legendHtml(th);
		el.appendChild(leg);
	}

	function _legendHtml(th) {
		function sw(color, label, desc) {
			return "<div style='display:flex;gap:7px;align-items:flex-start;" +
			       "margin:5px 0;'>" +
			       "<span style='flex:0 0 11px;height:11px;margin-top:3px;" +
			       "border-radius:3px;background:" + color + ";" +
			       "box-shadow:0 0 6px " + color + "80;'></span>" +
			       "<span><b>" + label + "</b><br>" +
			       "<span style='opacity:0.75;'>" + desc + "</span></span></div>";
		}
		var out = "";
		out += sw("#2ba3b8",
			_tr("origami_live_leg_pos", "Positive Seite"),
			_tr("origami_live_leg_pos_d",
				"Hier ist w·x + b > 0 — ReLU lässt die Punkte unverändert."));
		out += sw("#b8860b",
			_tr("origami_live_leg_neg", "Negative Seite"),
			_tr("origami_live_leg_neg_d",
				"Hier ist w·x + b < 0 — ReLU drückt alles auf die Ebene. " +
				"Genau das ist der Knick."));
		out += sw("#ffffff",
			_tr("origami_live_leg_fold", "Faltkante"),
			_tr("origami_live_leg_fold_d",
				"Die Hyperebene w·x + b = 0. Entlang dieser Kante wird das " +
				"Innere der Verteilung nach außen gekehrt."));
		out += sw("#ff2dd4",
			_tr("origami_live_leg_bound", "Entscheidungsgrenze"),
			_tr("origami_live_leg_bound_d",
				"Die flache Trennebene der letzten Schicht — zurückgefaltet " +
				"in den Eingaberaum."));
		out += "<div style='margin-top:9px;padding-top:8px;border-top:1px solid " +
		       th.panelBorder + ";opacity:0.82;'>" +
		       _tr("origami_live_leg_theory",
		           "Kernaussage des Papers: Die affine Transformation legt die " +
		           "Daten auf den Amboss, die Nichtlinearität schlägt zu. Kommt " +
		           "der Hammer aus einer Richtung, in die sich die Daten noch " +
		           "nicht ausdehnen, wird nichts gestaucht — es wird gefaltet. " +
		           "Nur so werden innere Klassenregionen von außen erreichbar.") +
		       "</div>";
		return out;
	}

	function _axisSelects(el, th, pipe) {
		if (!pipe || !pipe.stages) return;
		var cfg = _state.cfg;

		// Referenzstufe: die mit der größten Dimension
		var ref = null;
		for (var i = 0; i < pipe.stages.length; i++) {
			if (!ref || pipe.stages[i].dim > ref.dim) ref = pipe.stages[i];
		}
		if (!ref || ref.dim <= 3) return;

		var names = ["X", "Y", "Z"];
		var keys  = ["axisX", "axisY", "axisZ"];

		for (var a = 0; a < 3; a++) {
			(function (key, nm) {
				var w = document.createElement("label");
				w.style.cssText = "display:block;margin:6px 0;font-size:11px;";
				var t = document.createElement("div");
				t.textContent = _tr("origami_live_axis", "Achse") + " " + nm;
				t.style.cssText = "opacity:0.85;margin-bottom:3px;";
				w.appendChild(t);

				var sel = document.createElement("select");
				sel.style.cssText = [
					"width:100%", "padding:4px 6px", "border-radius:5px",
					"font-size:11px", "cursor:pointer",
					"background:" + th.inputBg, "color:" + th.text,
					"border:1px solid " + th.inputBorder
				].join(";");

				var lim = Math.min(ref.dim, 256);
				for (var u = 0; u < lim; u++) {
					var o = document.createElement("option");
					o.value = String(u);
					var vlabel = _tr("origami_live_neuron", "Neuron") + " " + u;
					if (ref.variances && ref.variances[u]) {
						vlabel += "  (σ² " + ref.variances[u].v.toFixed(3) + ")";
					}
					o.textContent = vlabel;
					if (cfg[key] === u) o.selected = true;
					sel.appendChild(o);
				}
				if (ref.dim > 256) {
					var o2 = document.createElement("option");
					o2.disabled = true;
					o2.textContent = "… " + (ref.dim - 256) + " " +
					                 _tr("origami_live_more", "weitere");
					sel.appendChild(o2);
				}

				sel.addEventListener("change", function () {
					var v = parseInt(sel.value, 10);
					if (_fin(v)) { cfg[key] = v; _markDirty(true); }
				});
				w.appendChild(sel);
				el.appendChild(w);
			})(keys[a], names[a]);
		}
	}

	function _axisInfo(el, th, pipe) {
		if (!pipe || !pipe.stages) return;
		var box = document.createElement("div");
		box.style.cssText = [
			"font-size:10px", "line-height:1.6", "opacity:0.8",
			"font-family:ui-monospace,SFMono-Regular,Menlo,monospace"
		].join(";");

		var lines = [];
		for (var i = 0; i < pipe.stages.length; i++) {
			var st = pipe.stages[i];
			if (st.dim <= 3) continue;
			lines.push(st.name + " (" + st.dim + "D) → " +
			           "[" + st.axes.join(", ") + "]");
		}
		box.textContent = lines.length ? lines.join("\n")
		                              : _tr("origami_live_no_axes",
		                                    "Alle Räume ≤ 3D");
		el.appendChild(box);
	}

	function _refreshQBtns() {
		if (!_state.qBtns) return;
		var th = _theme();
		for (var i = 0; i < _state.qBtns.length; i++) {
			var o = _state.qBtns[i];
			o.btn.style.cssText = _btnCss(th, _state.qualityLevel === o.lvl)
			                      .replace("padding:6px 11px", "padding:5px 7px") +
			                      ";flex:1;font-size:10px;";
		}
	}

	function _togglePanel() {
		if (!_state.ctrlEl) return;
		var vis = _state.ctrlEl.style.display !== "none";
		_state.ctrlEl.style.display = vis ? "none" : "block";
		if (!vis) _buildPanel();
	}

	// ==================================================================
	// 17. QUALITÄTSSTUFEN
	// ==================================================================

	var QUALITY = [
		// 0 = Spar
		{ gridRes: 13, maxPoints: 500,  maxNeurons: 8,  maxLayers: 4,
		  boundaryRes: 45,  dpr: 1 },
		// 1 = Mittel
		{ gridRes: 19, maxPoints: 1000, maxNeurons: 16, maxLayers: 5,
		  boundaryRes: 65,  dpr: -1 },
		// 2 = Hoch (Default)
		{ gridRes: 25, maxPoints: 1800, maxNeurons: 24, maxLayers: 6,
		  boundaryRes: 90,  dpr: -1 },
		// 3 = Ultra
		{ gridRes: 37, maxPoints: 3500, maxNeurons: 40, maxLayers: 8,
		  boundaryRes: 130, dpr: -1 }
	];

	function _applyQuality(lvl) {
		if (!_fin(lvl)) lvl = 2;
		lvl = Math.max(0, Math.min(QUALITY.length - 1, Math.round(lvl)));
		_state.qualityLevel = lvl;
		var q = QUALITY[lvl];
		var cfg = _state.cfg;
		cfg.gridRes     = q.gridRes;
		cfg.maxPoints   = q.maxPoints;
		cfg.maxNeurons  = q.maxNeurons;
		cfg.maxLayers   = q.maxLayers;
		cfg.boundaryRes = q.boundaryRes;
		cfg.dpr         = q.dpr;
		_state.cache.xHash = null;   // Punktzahl hat sich geändert
		_applyDpr();
		_log("Qualität: Stufe " + lvl);
	}

	function _applyDpr() {
		if (!_state.renderer) return;
		var d = _state.cfg.dpr;
		if (!_fin(d) || d <= 0) {
			d = Math.min(2, global.devicePixelRatio || 1);
		}
		try { _state.renderer.setPixelRatio(d); } catch (e) {}
	}

	/**
	 * Automatische Qualitätsregelung: misst die Frametime und senkt
	 * die Stufe, wenn es ruckelt — hebt sie, wenn Luft ist.
	 */
	function _autoQualityTick(frameMs) {
		if (!_state.autoQuality) return;
		if (!_fin(frameMs)) return;

		var ft = _state.frameTimes;
		ft.push(frameMs);
		if (ft.length < 45) return;
		if (ft.length > 90) ft.shift();

		var sum = 0;
		for (var i = 0; i < ft.length; i++) sum += ft[i];
		var avg = sum / ft.length;

		var changed = false;
		if (avg > 26 && _state.qualityLevel > 0) {
			_applyQuality(_state.qualityLevel - 1);
			_log("Auto-Qualität ↓ (" + avg.toFixed(1) + " ms/Frame)");
			changed = true;
		} else if (avg < 9 && _state.qualityLevel < QUALITY.length - 1) {
			_applyQuality(_state.qualityLevel + 1);
			_log("Auto-Qualität ↑ (" + avg.toFixed(1) + " ms/Frame)");
			changed = true;
		}

		if (changed) {
			_state.frameTimes = [];
			_refreshQBtns();
			_markDirty(true);
			if (_state.ctrlEl && _state.ctrlEl.style.display !== "none") {
				_buildPanel();
			}
		}
	}

	// ==================================================================
	// 18. HUD + MINI-NETZ
	// ==================================================================

	function _updateHud(pipe) {
		var el = _state.hudEl;
		if (!el) return;
		var cfg = _state.cfg;

		if (!cfg.showHud) { el.style.display = "none"; return; }
		el.style.display = "block";

		var th = _theme();
		el.style.color = th.text;
		el.style.background = th.hudBg;
		el.style.borderColor = th.panelBorder;

		if (!pipe || !pipe.stages || pipe.stages.length < 2) {
			el.innerHTML = "<b>" + _tr("origami_live_hud_wait", "Warte auf Daten…") +
			               "</b>";
			return;
		}

		var li = Math.max(0, Math.min(_state.activeLayer, pipe.stages.length - 1));
		var st = pipe.stages[li];
		var prev = pipe.stages[Math.max(0, li - 1)];

		var h = "";

		// Kopf
		h += "<div style='font-weight:800;font-size:12px;margin-bottom:4px;'>";
		if (cfg.mode === MODE_BOUNDARY) {
			h += "\u25C8 " + _tr("origami_live_hud_bound", "Entscheidungsgrenze");
		} else if (cfg.mode === MODE_STACK) {
			h += "\u2338 " + _tr("origami_live_hud_stack", "Halbräume") +
			     " \u00B7 " + st.name;
		} else {
			h += "\u25F0 " + st.name;
		}
		h += "</div>";

		// Dimension
		h += "<div style='opacity:0.85;margin-bottom:5px;'>";
		h += _tr("origami_live_hud_space", "Raum") + ": <b>" + st.dim + "D</b>";
		if (st.rawDim && st.rawDim !== st.dim) {
			h += " <span style='opacity:0.65;'>(von " + st.rawDim + ")</span>";
		}
		if (st.dim > 3) {
			h += " \u00B7 " + _tr("origami_live_hud_axes", "Achsen") +
			     " [" + st.axes.join(",") + "]";
		}
		h += "</div>";

		// Aktivierung / Faltart
		if (!st.isInput) {
			var kindTxt, kindCol;
			if (st.foldKind === "hard") {
				kindTxt = _tr("origami_live_hud_hard", "harte Faltung (Knick)");
				kindCol = "#ffffff";
			} else if (st.foldKind === "soft") {
				kindTxt = _tr("origami_live_hud_soft", "weiche Biegung");
				kindCol = "#ffe9a8";
			} else {
				kindTxt = _tr("origami_live_hud_affine",
					"nur affin — keine Faltung");
				kindCol = th.textDim;
			}
			h += "<div style='margin-bottom:5px;'>";
			h += "<span style='color:" + kindCol + ";font-weight:700;'>" +
			     kindTxt + "</span>";
			if (st.activation && st.activation !== "linear") {
				h += " <code style='opacity:0.8;'>" + st.activation + "</code>";
			}
			h += "</div>";
		}

		// Faltstatistik
		if (st.folds && st.folds.planes) {
			var act = 0, hidden = 0;
			for (var f = 0; f < st.folds.planes.length; f++) {
				if (st.folds.planes[f].active) act++;
				if (st.folds.planes[f].visible < 0.25) hidden++;
			}
			h += "<div style='margin-bottom:5px;'>";
			h += _tr("origami_live_hud_folds", "Faltkanten") + ": <b>" + act +
			     "</b> " + _tr("origami_live_hud_of", "von") + " " +
			     st.folds.units;
			if (hidden > 0) {
				h += "<br><span style='opacity:0.72;font-size:10.5px;'>" +
				     hidden + " " + _tr("origami_live_hud_hidden",
				         "falten in einer verborgenen Richtung — genau der " +
				         "Fall, den das Paper als wirksam beschreibt") +
				     "</span>";
			}
			h += "</div>";
		}

		// Conv-Hinweis
		if (st.isConv) {
			h += "<div style='margin-bottom:5px;font-size:10.5px;opacity:0.85;'>";
			h += "\u25A6 " + _tr("origami_live_hud_conv", "Filter-Patches") +
			     ": " + st.shown + "/" + st.filters;
			h += "</div>";
		}

		// Grenz-Info
		if (cfg.mode === MODE_BOUNDARY && pipe.boundary) {
			var nseg = pipe.boundary.segs
				? Math.floor(pipe.boundary.segs.length / 6) : 0;
			h += "<div style='margin-bottom:5px;'>";
			h += _tr("origami_live_hud_segs", "Grenzsegmente") + ": <b>" +
			     nseg + "</b>";
			if (pipe.boundary.multi) {
				h += "<br><span style='opacity:0.72;font-size:10.5px;'>" +
				     _tr("origami_live_hud_multi",
				         "mehrere Klassen — gezeigt wird, wo das Maximum wechselt") +
				     "</span>";
			}
			h += "</div>";
		}

		// Erklärtext je Modus
		h += "<div style='margin-top:7px;padding-top:6px;border-top:1px solid " +
		     th.panelBorder + ";font-size:10.5px;line-height:1.6;opacity:0.88;'>";
		if (cfg.mode === MODE_FOLD) {
			h += _tr("origami_live_hud_exp_fold",
				"Das Blatt wird Schicht für Schicht geknickt. Cyan = positive " +
				"Seite, Ocker = die Seite, die ReLU plattdrückt. Die weiße Linie " +
				"ist die Faltkante — dort wird das Innere der Verteilung nach " +
				"außen gekehrt und dadurch von einer flachen Ebene erreichbar.");
		} else if (cfg.mode === MODE_BOUNDARY) {
			h += _tr("origami_live_hud_exp_bound",
				"Die letzte Schicht trennt nur mit einer flachen Ebene. " +
				"Faltet man diese Ebene durch alle Knicke zurück in den " +
				"Eingaberaum, entsteht die magenta Grenze — beliebig " +
				"verwinkelt, obwohl das Netz nur gerade Schnitte kennt.");
		} else {
			h += _tr("origami_live_hud_exp_stack",
				"Jedes Neuron teilt den Raum in zwei Halbräume. Gestapelt " +
				"sieht man, wie viele unabhängige Schnitte eine Schicht " +
				"liefert — und welche davon die Daten überhaupt treffen.");
		}
		h += "</div>";

		// Steuerungs-Hinweise
		h += "<div style='margin-top:6px;font-size:10px;opacity:0.58;'>";
		h += _tr("origami_live_hud_keys",
			"Ziehen = drehen · Rad = zoomen · Rechts ziehen = verschieben · " +
			"Leertaste = abspielen · R = zurücksetzen");
		h += "</div>";

		el.innerHTML = h;
	}

	/**
	 * Mini-Netz unten rechts — wie im Video: die aktive Schicht und das
	 * gerade betrachtete Neuron werden hervorgehoben.
	 */
	function _updateNetDiagram(pipe) {
		var el = _state.netEl;
		if (!el) return;
		var cfg = _state.cfg;

		if (!cfg.showNetDiagram) { el.style.display = "none"; return; }
		el.style.display = "block";

		var th = _theme();
		el.style.background = th.netBg;
		el.style.borderColor = th.netBorder;

		if (!pipe || !pipe.stages || pipe.stages.length < 2) {
			el.innerHTML = "";
			return;
		}

		var stages = pipe.stages;
		var W = 136, H = 120;
		var pad = 12;

		// Spaltenpositionen
		var nCols = stages.length;
		var colX = [];
		for (var c = 0; c < nCols; c++) {
			colX.push(pad + (W - 2 * pad) * (nCols > 1 ? c / (nCols - 1) : 0.5));
		}

		// Knoten pro Spalte (begrenzt auf 8, sonst mit "…")
		var MAXN = 8;
		var nodes = [];
		for (var s = 0; s < nCols; s++) {
			var dim = stages[s].dim;
			var shown = Math.min(dim, MAXN);
			var ys = [];
			for (var k = 0; k < shown; k++) {
				var t = (shown > 1) ? (k / (shown - 1)) : 0.5;
				ys.push(pad + (H - 2 * pad) * t);
			}
			nodes.push({ ys: ys, dim: dim, truncated: dim > MAXN });
		}

		var active = Math.max(0, Math.min(_state.activeLayer, nCols - 1));

		var svg = "<svg width='" + W + "' height='" + H + "' " +
		          "viewBox='0 0 " + W + " " + H + "' " +
		          "style='display:block;overflow:visible;'>";

		// Kanten
		for (var e = 0; e + 1 < nCols; e++) {
			var isActive = (e + 1 === active);
			var col = isActive ? "#e8b43c" : (th.dark ? "#4a5270" : "#9aa6c4");
			var ow = isActive ? 1.5 : 0.7;
			var op = isActive ? 0.9 : 0.35;
			for (var a = 0; a < nodes[e].ys.length; a++) {
				for (var b = 0; b < nodes[e + 1].ys.length; b++) {
					svg += "<line x1='" + colX[e].toFixed(1) +
					       "' y1='" + nodes[e].ys[a].toFixed(1) +
					       "' x2='" + colX[e + 1].toFixed(1) +
					       "' y2='" + nodes[e + 1].ys[b].toFixed(1) +
					       "' stroke='" + col + "' stroke-width='" + ow +
					       "' opacity='" + op + "'/>";
				}
			}
		}

		// Knoten
		for (var n = 0; n < nCols; n++) {
			var isAct = (n === active);
			for (var q = 0; q < nodes[n].ys.length; q++) {
				var hot = isAct && (q === (_state.activeNeuron % nodes[n].ys.length));
				var r = hot ? 5.2 : (isAct ? 4.2 : 3.4);
				var fill = hot ? "#e8b43c"
				         : (isAct ? (th.dark ? "#f0ead8" : "#2f3a56")
				                  : (th.dark ? "#5a6party" : "#aab4cc"));
				// Fallback für Tippfehler-Sicherheit
				if (fill.indexOf("party") >= 0) {
					fill = th.dark ? "#5a6480" : "#aab4cc";
				}
				var stroke = hot ? "#fff6e0" : "none";
				svg += "<circle cx='" + colX[n].toFixed(1) +
				       "' cy='" + nodes[n].ys[q].toFixed(1) +
				       "' r='" + r + "' fill='" + fill + "'" +
				       (stroke !== "none"
				        ? (" stroke='" + stroke + "' stroke-width='1.1'")
				        : "") +
				       "/>";
			}
			if (nodes[n].truncated) {
				svg += "<text x='" + colX[n].toFixed(1) +
				       "' y='" + (H - 2) +
				       "' text-anchor='middle' font-size='7.5' " +
				       "fill='" + th.textDim + "'>" + nodes[n].dim + "</text>";
			}
		}

		svg += "</svg>";

		var label = stages[active] ? stages[active].name : "";
		if (label.length > 18) label = label.slice(0, 17) + "…";

		el.innerHTML =
			"<div style='font-size:9px;font-weight:700;letter-spacing:0.4px;" +
			"text-align:center;margin-bottom:2px;color:" + th.textDim + ";" +
			"text-transform:uppercase;'>" +
			_tr("origami_live_net", "Netz") + "</div>" +
			svg +
			"<div style='font-size:8.5px;text-align:center;margin-top:1px;" +
			"color:" + th.text + ";font-weight:600;'>" + label + "</div>";
	}

	function _updateDiag() {
		var el = _state.diagEl;
		if (!el) return;
		var pipe = _state.pipeline;
		var lines = [];

		lines.push("Modus: " + _state.cfg.mode);
		lines.push("Qualität: " + _state.qualityLevel +
		           (_state.autoQuality ? " (auto)" : ""));

		if (_state.frameTimes.length) {
			var sum = 0;
			for (var f = 0; f < _state.frameTimes.length; f++) sum += _state.frameTimes[f];
			lines.push("Frametime: " + (sum / _state.frameTimes.length).toFixed(1) + " ms");
		}

		if (pipe && pipe.stages) {
			lines.push("Stufen: " + pipe.stages.length);
			lines.push("Punkte: " + pipe.nSamples);
			for (var s = 0; s < pipe.stages.length; s++) {
				var st = pipe.stages[s];
				var txt = "  [" + s + "] " + st.dim + "D " +
				          (st.className || "-");
				if (st.foldKind === "hard") txt += " ✂";
				else if (st.foldKind === "soft") txt += " ∼";
				if (st.folds && st.folds.planes) {
					txt += " (" + st.folds.planes.length + "/" + st.folds.units + ")";
				}
				lines.push(txt);
			}
			if (pipe.boundary) {
				var nb = pipe.boundary.segs
					? Math.floor(pipe.boundary.segs.length / 6) : 0;
				lines.push("Grenze: " + nb + " Segmente" +
				           (pipe.boundary.multi ? " (multi)" : ""));
			}
		} else {
			lines.push("Keine Pipeline");
		}

		if (_state.off) lines.push("DEAKTIVIERT: " + _state.offMsg);

		el.textContent = lines.join("\n");
	}

	// ==================================================================
	// 19. ORBIT-STEUERUNG
	// ==================================================================

	function _setupOrbit() {
		var T = _state.THREE;
		var dom = _state.renderer.domElement;
		var o = _state.orbit;

		o.target = new T.Vector3(0, 0, 0);

		function apply() {
			var sp = Math.sin(o.phi);
			_state.camera.position.set(
				o.target.x + o.radius * sp * Math.sin(o.theta),
				o.target.y + o.radius * Math.cos(o.phi),
				o.target.z + o.radius * sp * Math.cos(o.theta)
			);
			_state.camera.lookAt(o.target);
			_state.dirty = true;
		}
		_state.applyOrbit = apply;
		apply();

		dom.addEventListener("mousedown", function (e) {
			o.down = true;
			o.button = e.button;
			o.lastX = e.clientX;
			o.lastY = e.clientY;
			o.vTheta = 0;
			o.vPhi = 0;
			dom.style.cursor = "grabbing";
			e.preventDefault();
		});

		var onUp = function () {
			o.down = false;
			dom.style.cursor = "grab";
		};
		global.addEventListener("mouseup", onUp);
		_state.onMouseUp = onUp;

		var onMove = function (e) {
			if (!o.down) return;
			var dx = e.clientX - o.lastX;
			var dy = e.clientY - o.lastY;
			o.lastX = e.clientX;
			o.lastY = e.clientY;

			if (o.button === 0) {
				var dt = -dx * 0.0052;
				var dp = -dy * 0.0052;
				o.theta += dt;
				o.phi += dp;
				o.phi = Math.max(0.06, Math.min(Math.PI - 0.06, o.phi));
				o.vTheta = dt;
				o.vPhi = dp;
			} else {
				var sp2 = o.radius * 0.0016;
				var right = new T.Vector3();
				var up = new T.Vector3();
				_state.camera.matrix.extractBasis(right, up, new T.Vector3());
				o.target.addScaledVector(right, -dx * sp2);
				o.target.addScaledVector(up, dy * sp2);
			}
			apply();
		};
		global.addEventListener("mousemove", onMove);
		_state.onMouseMove = onMove;

		dom.addEventListener("wheel", function (e) {
			e.preventDefault();
			var f = Math.pow(0.94, -e.deltaY * 0.01);
			o.radius *= f;
			o.radius = Math.max(20, Math.min(6000, o.radius));
			apply();
		}, { passive: false });

		dom.addEventListener("contextmenu", function (e) { e.preventDefault(); });

		// Touch
		var touchDist = 0;
		dom.addEventListener("touchstart", function (e) {
			if (e.touches.length === 1) {
				o.down = true;
				o.button = 0;
				o.lastX = e.touches[0].clientX;
				o.lastY = e.touches[0].clientY;
			} else if (e.touches.length === 2) {
				var dx = e.touches[0].clientX - e.touches[1].clientX;
				var dy = e.touches[0].clientY - e.touches[1].clientY;
				touchDist = Math.sqrt(dx * dx + dy * dy);
			}
		}, { passive: true });

		dom.addEventListener("touchmove", function (e) {
			if (e.touches.length === 1 && o.down) {
				var dx = e.touches[0].clientX - o.lastX;
				var dy = e.touches[0].clientY - o.lastY;
				o.lastX = e.touches[0].clientX;
				o.lastY = e.touches[0].clientY;
				o.theta -= dx * 0.0055;
				o.phi -= dy * 0.0055;
				o.phi = Math.max(0.06, Math.min(Math.PI - 0.06, o.phi));
				apply();
				e.preventDefault();
			} else if (e.touches.length === 2) {
				var dx2 = e.touches[0].clientX - e.touches[1].clientX;
				var dy2 = e.touches[0].clientY - e.touches[1].clientY;
				var d = Math.sqrt(dx2 * dx2 + dy2 * dy2);
				if (touchDist > 1 && d > 1) {
					o.radius *= touchDist / d;
					o.radius = Math.max(20, Math.min(6000, o.radius));
					apply();
				}
				touchDist = d;
				e.preventDefault();
			}
		}, { passive: false });

		dom.addEventListener("touchend", function () { o.down = false; },
			{ passive: true });

		dom.style.cursor = "grab";
	}

	function _computeFitRadius() {
		var pipe = _state.pipeline;
		var cfg = _state.cfg;
		var R = 420;
		if (pipe && pipe.stages) {
			var li = Math.max(0, Math.min(_state.activeLayer, pipe.stages.length - 1));
			var st = pipe.stages[li];
			if (st && st.bounds) {
				var ext = Math.max(
					Math.abs(st.bounds.x.hi - st.bounds.x.lo),
					Math.abs(st.bounds.y.hi - st.bounds.y.lo),
					Math.abs(st.bounds.z.hi - st.bounds.z.lo)
				) * st.scale;

				if (cfg.mode === MODE_STACK && li > 0) {
					var prev = pipe.stages[li - 1];
					if (prev && prev.bounds) {
						var xyExt = Math.max(
							Math.abs(prev.bounds.x.hi - prev.bounds.x.lo),
							Math.abs(prev.bounds.y.hi - prev.bounds.y.lo)
						) * prev.scale;
						var nShow = Math.max(1, cfg.maxNeurons | 0);
						var spread = _fin(cfg.stackSpread) ? cfg.stackSpread : 1;
						var stackH = (nShow - 1) * xyExt * 0.18 * spread;
						if (_fin(stackH) && stackH > 0) ext = Math.max(ext, stackH);
					}
				}

				if (_fin(ext) && ext > 1e-6) R = ext * 1.9;
			}
		}
		if (!_fin(R) || R < 20) R = 420;
		return R;
	}

	function _fitRadius() {
		if (!_state.orbit) return;
		var R = _computeFitRadius();
		var o = _state.orbit;
		var ratio = R / o.radius;
		if (ratio < 0.55 || ratio > 1.85) {
			o.radius = R;
			if (_state.applyOrbit) _state.applyOrbit();
			_state.dirty = true;
		}
	}

	function _resetCamera() {
		var o = _state.orbit;
		var R = _computeFitRadius();

		o.radius = R;
		o.theta = 0.62;
		o.phi = 1.05;
		if (o.target) o.target.set(0, 0, 0);
		if (_state.applyOrbit) _state.applyOrbit();
		_state.dirty = true;
	}

	function _setupKeyboard() {
		var h = function (e) {
			if (!_state.visible) return;
			var tag = (e.target && e.target.tagName) || "";
			if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

			var k = String(e.key || "").toLowerCase();
			if (k === " ") { _togglePlay(); e.preventDefault(); }
			else if (k === "r") { _resetCamera(); e.preventDefault(); }
			else if (k === "1") { setMode(MODE_FOLD); e.preventDefault(); }
			else if (k === "2") { setMode(MODE_BOUNDARY); e.preventDefault(); }
			else if (k === "3") { setMode(MODE_STACK); e.preventDefault(); }
			else if (k === "g") {
				_state.cfg.showGrid = !_state.cfg.showGrid;
				_markDirty(true); e.preventDefault();
			}
			else if (k === "f") {
				_state.cfg.showFolds = !_state.cfg.showFolds;
				_markDirty(true); e.preventDefault();
			}
			else if (k === "d") {
				_state.cfg.showData = !_state.cfg.showData;
				_markDirty(true); e.preventDefault();
			}
			else if (k === "e") {
				_togglePanel(); e.preventDefault();
			}
			else if (k === "arrowright") {
				_state.scrubPlaying = false;
				_state.scrub = Math.min(1, _state.scrub + 0.05);
				_state.scrubTarget = _state.scrub;
				_syncScrub();
				_rebuildGeometryOnly();
				e.preventDefault();
			}
			else if (k === "arrowleft") {
				_state.scrubPlaying = false;
				_state.scrub = Math.max(0, _state.scrub - 0.05);
				_state.scrubTarget = _state.scrub;
				_syncScrub();
				_rebuildGeometryOnly();
				e.preventDefault();
			}
		};
		global.addEventListener("keydown", h);
		_state.onKeyDown = h;
	}

	function _togglePlay() {
		_state.scrubPlaying = !_state.scrubPlaying;
		if (_state.playBtn) {
			_state.playBtn.textContent = _state.scrubPlaying ? "\u23F8" : "\u25B6";
		}
		if (_state.scrubPlaying && _state.scrub >= 0.999) {
			_state.scrub = 0;
			_state.scrubTarget = 0;
			_syncScrub();
		}
		_state.dirty = true;
	}

	function _syncScrub() {
		if (_state.scrubEl) {
			_state.scrubEl.value = String(Math.round(_state.scrub * 1000));
		}
		_updateScrubLabel();
	}

	function _updateScrubLabel() {
		var el = _state.scrubLblEl;
		if (!el) return;
		var pipe = _state.pipeline;
		if (!pipe || !pipe.stages || pipe.stages.length < 2) {
			el.textContent = _tr("origami_live_layer", "Schicht") + " —";
			return;
		}

		var nSteps = pipe.stages.length - 1;
		var fPos = _state.scrub * nSteps;
		var iLo = Math.max(0, Math.min(nSteps, Math.floor(fPos)));
		var iHi = Math.min(iLo + 1, nSteps);
		var mix = fPos - iLo;

		var nameLo = pipe.stages[iLo] ? pipe.stages[iLo].name : "?";
		var nameHi = pipe.stages[iHi] ? pipe.stages[iHi].name : "?";

		function shorten(s) {
			s = String(s || "");
			return s.length > 14 ? s.slice(0, 13) + "…" : s;
		}

		if (_state.cfg.mode === MODE_STACK) {
			el.textContent = _tr("origami_live_layer", "Schicht") + " " +
			                 shorten(nameHi);
		} else if (mix < 0.03) {
			el.textContent = shorten(nameLo);
		} else if (mix > 0.97) {
			el.textContent = shorten(nameHi);
		} else {
			el.textContent = shorten(nameLo) + " \u2192 " + shorten(nameHi) +
			                 "  " + Math.round(mix * 100) + "%";
		}
	}

	// ==================================================================
	// 20. RENDER-LOOP
	// ==================================================================

	function _startLoop() {
		if (_state.animId) return;
		var T = _state.THREE;
		_state.clock = new T.Clock();

		function loop() {
			_state.animId = requestAnimationFrame(loop);
			if (_state.destroyed) return;
			if (!_state.visible) return;
			if (!_state.renderer || !_state.scene || !_state.camera) return;

			// gui.js → disable_everything() macht beim Training alle
			// <input>s zu — auch unseren Schicht-Scrubber. Hier wieder
			// flott machen, damit der Nutzer mitten im Training
			// durch die Schichten scrollen kann.
			if (_state.scrubEl && _state.scrubEl.disabled) {
				_state.scrubEl.disabled = false;
			}

			var t0 = (global.performance && performance.now)
			         ? performance.now() : Date.now();

			var dt = 0;
			try { dt = _state.clock.getDelta(); } catch (e) { dt = 0.016; }
			if (!_fin(dt) || dt < 0) dt = 0.016;
			if (dt > 0.2) dt = 0.2;

			_state.timeAccum += dt;
			var cfg = _state.cfg;
			var o = _state.orbit;

			// --- Trägheit beim Drehen ---
			if (!o.down && (Math.abs(o.vTheta) > 1e-4 || Math.abs(o.vPhi) > 1e-4)) {
				o.theta += o.vTheta;
				o.phi += o.vPhi;
				o.phi = Math.max(0.06, Math.min(Math.PI - 0.06, o.phi));
				o.vTheta *= 0.90;
				o.vPhi *= 0.90;
				if (_state.applyOrbit) _state.applyOrbit();
				_state.dirty = true;
			}

			// --- Automatisches Drehen ---
			if (cfg.autoRotate && !o.down) {
				o.theta += dt * cfg.rotateSpeed;
				if (_state.applyOrbit) _state.applyOrbit();
				_state.dirty = true;
			}

			// --- Scrubber abspielen ---
			if (_state.scrubPlaying) {
				_state.scrub += dt * cfg.scrubSpeed * 0.42;
				if (_state.scrub >= 1) {
					_state.scrub = 1;
					_state.scrubPlaying = false;
					if (_state.playBtn) _state.playBtn.textContent = "\u25B6";
				}
				_state.scrubTarget = _state.scrub;
				_syncScrub();
				_rebuildGeometryOnly();
				_state.dirty = true;
			}

			// --- Kamera-Position in die Shader schieben ---
			// (Pulsierende Kanten sind entfernt — uTime wird nicht mehr
			// animiert, also reicht das hier für die Sheet-Beleuchtung.)
			_updateCamUniforms();

			if (!_state.dirty) {
				_autoQualityTick((global.performance && performance.now
				                  ? performance.now() : Date.now()) - t0);
				return;
			}
			_state.dirty = false;

			try {
				_state.renderer.render(_state.scene, _state.camera);
			} catch (e) {
				_err("Render-Fehler: " + e);
				_state.errorStreak++;
				if (_state.errorStreak > 12) {
					_warn("Zu viele Render-Fehler, Loop gestoppt");
					if (_state.animId) cancelAnimationFrame(_state.animId);
					_state.animId = null;
				}
				return;
			}
			_state.errorStreak = 0;

			var t1 = (global.performance && performance.now)
			         ? performance.now() : Date.now();
			_autoQualityTick(t1 - t0);
		}

		_state.animId = requestAnimationFrame(loop);
	}

	function _updateUniforms(t) {
		var groups = [
			_state.sheetGroup, _state.foldGroup, _state.boundGroup,
			_state.stackGroup, _state.dataGroup
		];
		var camPos = _state.camera ? _state.camera.position : null;

		for (var g = 0; g < groups.length; g++) {
			var grp = groups[g];
			if (!grp) continue;
			for (var i = 0; i < grp.children.length; i++) {
				var o = grp.children[i];
				if (!o.material || !o.material.uniforms) continue;
				var u = o.material.uniforms;
				if (u.uTime)   u.uTime.value = t;
				if (u.uCamPos && camPos) u.uCamPos.value.copy(camPos);
			}
		}
	}

	function _updateCamUniforms() {
		var camPos = _state.camera ? _state.camera.position : null;
		if (!camPos) return;
		var groups = [_state.sheetGroup, _state.stackGroup];
		for (var g = 0; g < groups.length; g++) {
			var grp = groups[g];
			if (!grp) continue;
			for (var i = 0; i < grp.children.length; i++) {
				var o = grp.children[i];
				if (o.material && o.material.uniforms && o.material.uniforms.uCamPos) {
					o.material.uniforms.uCamPos.value.copy(camPos);
					_state.dirty = true;
				}
			}
		}
	}

	// ==================================================================
	// 21. SICHTBARKEIT + LAZY RENDER
	// ==================================================================

	function _visibleNow() {
		if (!_state.container) return false;
		try {
			if (_state.container.offsetWidth <= 0) return false;
			if (_state.container.offsetHeight <= 0) return false;
			var r = _state.container.getBoundingClientRect();
			var vh = global.innerHeight || document.documentElement.clientHeight;
			var vw = global.innerWidth || document.documentElement.clientWidth;
			return (r.top < vh && r.bottom > 0 && r.left < vw && r.right > 0);
		} catch (e) { return false; }
	}

	/**
	 * Der Kern der Lazy-Render-Logik:
	 * Wird das Panel nicht gesehen, merken wir uns nur, dass ein Update
	 * aussteht. Erst beim Wiedereintritt ins Sichtfeld wird die aktuelle
	 * Version gebaut — nie eine veraltete nachgeholt.
	 */
	function _setupObserver() {
		if (_state.observer || !_state.container) return;

		if (typeof IntersectionObserver === "undefined") {
			_state.visible = true;
			return;
		}

		try {
			_state.observer = new IntersectionObserver(function (entries) {
				for (var i = 0; i < entries.length; i++) {
					var was = _state.visible;
					_state.visible = entries[i].isIntersecting;

					if (!_state.visible) continue;

					// Frisch sichtbar → immer neu gegen die aktuellen Daten prüfen
					if (!was) _state.pendingRender = true;

					if (_state.pendingRender) {
						_state.pendingRender = false;
						_rebuild();
					}
					_state.dirty = true;
					_resizeToContainer();
				}
			}, { threshold: 0.02 });
			_state.observer.observe(_state.container);
		} catch (e) {
			_warn("IntersectionObserver fehlgeschlagen: " + e);
			_state.visible = true;
		}
	}

	function _setupResizeObserver() {
		if (_state.resizeObs || !_state.canvasWrap) return;
		if (typeof ResizeObserver === "undefined") return;
		try {
			_state.resizeObs = new ResizeObserver(function () {
				if (!_state.visible) return;
				_resizeToContainer();
			});
			_state.resizeObs.observe(_state.canvasWrap);
		} catch (e) { /* ignore */ }
	}

	function _resizeToContainer() {
		if (!_state.renderer || !_state.canvasWrap || !_state.camera) return;
		var w = _state.canvasWrap.clientWidth;
		var h = _state.canvasWrap.clientHeight;
		if (!_fin(w) || !_fin(h) || w < 2 || h < 2) return;
		try {
			_state.renderer.setSize(w, h, false);
			_state.camera.aspect = w / h;
			_state.camera.updateProjectionMatrix();
			_state.dirty = true;
		} catch (e) { /* ignore */ }
	}

	/**
	 * Zusätzliches Sicherheitsnetz: Falls ein Update durch eine verpasste
	 * Observer-Flanke verloren geht, heilt sich das hier innerhalb 350 ms.
	 */
	function _startWatchdog() {
		if (_state.watchTimer) return;
		_state.lastDark = _dark();
		try { _state.lastLang = (typeof lang !== "undefined") ? (lang || "") : ""; }
		catch (e) { _state.lastLang = ""; }

		_state.watchTimer = setInterval(function () {
			if (!_state.initialized || _state.destroyed) return;

			// Theme-Wechsel
			var d = _dark();
			var lg = "";
			try { lg = (typeof lang !== "undefined") ? (lang || "") : ""; }
			catch (e) { lg = ""; }

			if (d !== _state.lastDark || lg !== _state.lastLang) {
				_state.lastDark = d;
				_state.lastLang = lg;
				_applyTheme();
				_refreshUIText();
				_state.lastViewHash = null;
				_markDirty(true);
				return;
			}

			// Nachgeholtes Update
			if (_state.visible && _state.pendingRender) {
				_state.pendingRender = false;
				_rebuild();
			}

			// Revision-Check (neue Vorhersage / neue Daten)
			if (_state.visible && _revision() !== _state.lastRevision) {
				_rebuild();
			}
		}, 350);
	}

	function _applyTheme() {
		var th = _theme();
		_styleContainer();

		if (_state.canvasWrap) {
			_state.canvasWrap.style.background = th.bgCss;
		}
		if (_state.scene) {
			try {
				_state.scene.background = new _state.THREE.Color(th.bg);
				_state.scene.fog = new _state.THREE.Fog(th.fog, th.fogNear, th.fogFar);
			} catch (e) {}
		}
		if (_state.hudEl) {
			_state.hudEl.style.color = th.text;
			_state.hudEl.style.background = th.hudBg;
			_state.hudEl.style.borderColor = th.panelBorder;
		}
		if (_state.netEl) {
			_state.netEl.style.background = th.netBg;
			_state.netEl.style.borderColor = th.netBorder;
		}
		if (_state.tipEl) {
			_state.tipEl.style.color = th.text;
			_state.tipEl.style.background = th.tipBg;
			_state.tipEl.style.borderColor = th.tipBorder;
		}
		if (_state.overlayEl) {
			_state.overlayEl.style.color = th.text;
			_state.overlayEl.style.background = th.hudBg;
		}
		if (_state.ctrlEl) {
			_state.ctrlEl.style.background = th.panelBg;
			_state.ctrlEl.style.color = th.text;
			_state.ctrlEl.style.borderColor = th.panelBorder;
			if (_state.ctrlEl.style.display !== "none") _buildPanel();
		}

		// Buttons neu einfärben
		if (_state.modeBtns) {
			var keys = Object.keys(_state.modeBtns);
			for (var i = 0; i < keys.length; i++) {
				var b = _state.modeBtns[keys[i]];
				var labelTxt = b.textContent;
				b.style.cssText = _btnCss(th, _state.cfg.mode === keys[i]);
				b.textContent = labelTxt;
			}
		}
		if (_state.scrubLblEl) _state.scrubLblEl.style.color = th.text;
		if (_state.scrubEl) {
			_state.scrubEl.style.accentColor = th.dark ? "#e8b43c" : "#d99a16";
		}
	}

	// ==================================================================
	// 22. REBUILD / CHANGE DETECTION
	// ==================================================================

	function _markDirty(force) {
		if (force) {
			_state.lastFingerprint = null;
			_state.lastViewHash = null;
		}
		if (!_state.visible) {
			_state.pendingRender = true;
			return;
		}
		_scheduleRebuild();
	}

	function _scheduleRebuild() {
		_state.pendingRender = true;
		if (!_state.visible) return;
		if (_state.rafId) return;
		_state.rafId = requestAnimationFrame(function () {
			_state.rafId = null;
			_state.pendingRender = false;
			_rebuild();
		});
	}

	/**
	 * Nur die Geometrie neu bauen (Scrubber-Bewegung), ohne die
	 * teure Pipeline-Neuberechnung. Hält das Falten bei 60 fps.
	 */
	function _rebuildGeometryOnly() {
		if (!_state.pipeline || !_state.scene) return;
		if (!_state.visible) { _state.pendingRender = true; return; }
		try {
			_buildScene();
			_updateScrubLabel();
			_state.dirty = true;
		} catch (e) {
			_err("Geometrie-Update fehlgeschlagen: " + e);
		}
	}

	function _setOff(key, msg) {
		var isTransition = !_state.off || _state.offKey !== key;
		_state.off = true;
		_state.offKey = key;
		_state.offMsg = _tr(key, msg);
		if (_state.overlayEl) {
			_state.overlayEl.style.display = "flex";
			_state.overlayEl.innerHTML =
				"<div><div style='font-size:22px;margin-bottom:10px;opacity:0.55;'>" +
				"\u25F0</div><div>" + _state.offMsg + "</div></div>";
		}
		_clearGroup(_state.sheetGroup);
		_clearGroup(_state.foldGroup);
		_clearGroup(_state.dataGroup);
		_clearGroup(_state.boundGroup);
		_clearGroup(_state.stackGroup);
		_state.dirty = true;
		_updateDiag();
		if (isTransition) _log("deaktiviert: " + _state.offMsg);
	}

	function _setOn() {
		if (!_state.off) return;
		_state.off = false;
		_state.offKey = "";
		_state.offMsg = "";
		if (_state.overlayEl) _state.overlayEl.style.display = "none";
		_state.lastFingerprint = null;
		_state.lastViewHash = null;
	}

	function _rebuild() {
		if (!_state.initialized || _state.destroyed) return;
		if (!_state.container || !_state.container.parentNode) {
			_log("Container nicht im DOM");
			return;
		}
		if (!_state.visible) { _state.pendingRender = true; return; }

		// --- Throttling während des Trainings ---
		var now = (global.performance && performance.now)
		          ? performance.now() : Date.now();
		var training = false;
		try { training = !!global.started_training; } catch (e) {}
		if (training && (now - _state.lastRebuild) < _state.cfg.throttleMs) {
			_state.pendingRender = true;
			setTimeout(_scheduleRebuild, _state.cfg.throttleMs);
			return;
		}

		// --- Voraussetzungen ---
		if (!_hasTF()) {
			_setOff("origami_live_no_tf", "TensorFlow.js ist nicht verfügbar.");
			return;
		}
		if (!_hasModel()) {
			_setOff("origami_live_no_model",
				"Kein Modell vorhanden. Baue ein Netz und starte das Training.");
			return;
		}

		// --- Modellwechsel erkennen ---
		if (_state.modelRef !== global.model) {
			_state.modelRef = global.model;
			_state.lastFingerprint = null;
			_state.lastChainSig = null;
			_state.lastFitLayer = -1;
			_tFree(_state.cache.xTensor);
			_state.cache.xTensor = null;
			_state.cache.xHash = null;
			_state.errorStreak = 0;
		}

		// --- Kette bauen ---
		var built = _buildChain();
		if (!built.chain.length) {
			if (built.reason === "too_short") {
				_setOff("origami_live_too_short",
					"Es wird mindestens eine faltbare Schicht benötigt " +
					"(Dense oder Conv2D).");
			} else {
				_setOff("origami_live_no_layers",
					"Keine darstellbaren Schichten gefunden.");
			}
			return;
		}

		var sig = _chainSig(built.chain);
		var chainChanged = (sig !== _state.lastChainSig);
		if (chainChanged) {
			_log("Kette geändert: " + sig);
			_state.lastChainSig = sig;
			_state.lastFingerprint = null;
			_state.lastFitLayer = -1;
			_setOn();
			// KEIN Scrub-Reset mehr — der Nutzer hat die Position bewusst
			// gewählt, die überlebt jetzt auch einen Architektur-Wechsel.
			// Kamera wird unten neu eingestellt, sobald die Pipeline steht.
		} else {
			_setOn();
		}

		// --- Daten ---
		if (!_prepareData()) {
			_setOff("origami_live_no_data",
				"Keine Trainingsdaten vorhanden. Lade Daten, dann erscheint " +
				"hier die Faltung.");
			return;
		}

		// --- Change-Detection ---
		var fp = _fingerprint(built.chain);
		var vh = _viewHash();
		var rev = _revision();

		var changed = (fp !== _state.lastFingerprint) ||
		              (vh !== _state.lastViewHash) ||
		              (rev !== _state.lastRevision);

		if (!changed) {
			// Nichts Neues — aber Netz-Diagramm/HUD aktualisieren
			if (_state.pipeline) {
				_updateHud(_state.pipeline);
				_updateNetDiagram(_state.pipeline);
			}
			return;
		}

		// --- Pipeline berechnen ---
		var pipe = null;
		try {
			pipe = _computePipeline(built.chain);
		} catch (e) {
			if (_isDisposedErr(e)) {
				_log("Pipeline: Tensor disposed, nächster Versuch");
			} else {
				_err("Pipeline fehlgeschlagen: " + e);
			}
			pipe = null;
		}

		if (!pipe) {
			_state.errorStreak++;
			if (_state.errorStreak > 5) {
				_setOff("origami_live_compute_failed",
					"Die Faltung konnte mehrfach nicht berechnet werden. " +
					"Prüfe die Netzarchitektur.");
			} else {
				_log("Pipeline leer (Versuch " + _state.errorStreak + "/5)");
			}
			return;
		}
		_state.errorStreak = 0;
		_state.pipeline = pipe;

		// --- Szene bauen ---
		try {
			_buildScene();
		} catch (e) {
			_err("Szene konnte nicht gebaut werden: " + e);
			return;
		}

		_state.lastFingerprint = fp;
		_state.lastViewHash = vh;
		_state.lastRevision = rev;
		_state.lastRebuild = now;
		_state.dirty = true;

		// Kamera an den neuen Raum anpassen — beim allerersten Build, wenn
		// sich die Netzarchitektur geändert hat, oder wenn ein neuer
		// Datensatz geladen wurde (andere Skala/Ausdehnung). Bei reinem
		// Trainingsfortschritt (gleiche Kette, gleiche Daten, neue Gewichte)
		// bleibt der vom Nutzer eingestellte Blick unangetastet.
		var dataChanged = (_state.cache.xHash !== _state.lastFramedHash);
		if (!_state.hasFramed || chainChanged || dataChanged) {
			_resetCamera();
			_state.hasFramed = true;
			_state.lastFramedHash = _state.cache.xHash;
		}

		_updateScrubLabel();
		_updateDiag();

		_log("Faltung aktualisiert: " + pipe.stages.length + " Stufen, " +
		     pipe.nSamples + " Punkte, Modus " + _state.cfg.mode);
	}

	// ==================================================================
	// 23. THREE.JS SETUP
	// ==================================================================

	function _setupThree() {
		var T = global.THREE;
		_state.THREE = T;
		var th = _theme();

		var w = _state.canvasWrap.clientWidth || 800;
		var h = _state.canvasWrap.clientHeight || 620;

		_state.scene = new T.Scene();
		_state.scene.background = new T.Color(th.bg);
		_state.scene.fog = new T.Fog(th.fog, th.fogNear, th.fogFar);

		_state.camera = new T.PerspectiveCamera(48, w / h, 0.5, 12000);
		_state.camera.position.set(260, 220, 320);

		try {
			_state.renderer = new T.WebGLRenderer({
				antialias: true,
				alpha: false,
				powerPreference: "high-performance"
			});
		} catch (e) {
			_err("WebGLRenderer konnte nicht erstellt werden: " + e);
			return false;
		}

		_applyDpr();
		_state.renderer.setSize(w, h, false);
		try {
			_state.renderer.sortObjects = true;
			if (_state.renderer.outputColorSpace !== undefined &&
			    T.SRGBColorSpace !== undefined) {
				_state.renderer.outputColorSpace = T.SRGBColorSpace;
			}
		} catch (e) {}

		_state.canvasWrap.appendChild(_state.renderer.domElement);
		try {
			_state.renderer.domElement.style.display = "block";
			_state.renderer.domElement.style.width = "100%";
			_state.renderer.domElement.style.height = "100%";
		} catch (e) {}

		// --- Licht (für die Fresnel-Shader relevant) ---
		var hemi = new T.HemisphereLight(th.hemi1, th.hemi2, th.ambient);
		_state.scene.add(hemi);

		var dir = new T.DirectionalLight(
			th.dark ? 0xaabaff : 0xffffff, th.dark ? 0.45 : 0.6);
		dir.position.set(220, 380, 260);
		_state.scene.add(dir);

		var fill = new T.DirectionalLight(
			th.dark ? 0x2a3560 : 0xccd8ff, 0.22);
		fill.position.set(-220, -140, -300);
		_state.scene.add(fill);

		// --- Gruppen (Renderreihenfolge: hinten → vorne) ---
		_state.rootGroup = new T.Group();
		_state.scene.add(_state.rootGroup);

		_state.helperGroup = new T.Group();
		_state.sheetGroup  = new T.Group();
		_state.stackGroup  = new T.Group();
		_state.foldGroup   = new T.Group();
		_state.boundGroup  = new T.Group();
		_state.dataGroup   = new T.Group();

		_state.rootGroup.add(_state.helperGroup);
		_state.rootGroup.add(_state.sheetGroup);
		_state.rootGroup.add(_state.stackGroup);
		_state.rootGroup.add(_state.foldGroup);
		_state.rootGroup.add(_state.boundGroup);
		_state.rootGroup.add(_state.dataGroup);

		_setupOrbit();
		_setupKeyboard();
		_startLoop();

		return true;
	}

	// ==================================================================
	// 24. PUBLIC API
	// ==================================================================

	function init(divOrId) {
		if (_state.initialized && !_state.destroyed) {
			// Singleton: erneuter Aufruf = Update
			_log("init() erneut aufgerufen → Update");
			update();
			return API;
		}

		if (!_hasTHREE()) {
			_err("three.js ist nicht geladen. Lade three.min.js VOR origami_live.js.");
			return API;
		}

		_state.destroyed = false;

		try {
			_buildDOM(divOrId);
		} catch (e) {
			_err("DOM-Aufbau fehlgeschlagen: " + e);
			return API;
		}

		if (!_state.container || !_state.canvasWrap) {
			_err("Container konnte nicht erstellt werden.");
			return API;
		}

		// Qualität initial setzen (sane default = Stufe 2 "Hoch")
		_applyQuality(_state.qualityLevel);

		if (!_setupThree()) {
			_err("three.js-Setup fehlgeschlagen.");
			return API;
		}

		_state.initialized = true;

		_setupObserver();
		_setupResizeObserver();
		_startWatchdog();
		_refreshUIText();

		if (_visibleNow()) _state.visible = true;

		_state.pendingRender = true;
		if (_state.visible) _scheduleRebuild();

		_log("initialisiert (" + SID + ")");
		return API;
	}

	function update() {
		if (!_state.initialized || _state.destroyed) {
			_log("update() vor init() → initialisiere automatisch");
			return init();
		}

		if (!_state.container || !_state.container.parentNode) {
			_log("Container nicht mehr im DOM → Neuaufbau");
			var ref = _state.parentRef;
			_softReset();
			return init(ref);
		}

		// Kern der Anforderung: nur bei Sichtbarkeit rendern,
		// sonst nur vormerken.
		if (!_state.visible) {
			_state.pendingRender = true;
			return API;
		}

		_scheduleRebuild();
		return API;
	}

	function forceUpdate() {
		if (!_state.initialized || _state.destroyed) return init();
		_state.lastFingerprint = null;
		_state.lastViewHash = null;
		_state.lastRevision = -1;
		_state.cache.xHash = null;
		_state.errorStreak = 0;
		_setOn();
		_state.pendingRender = true;
		if (_state.visible) _scheduleRebuild();
		return API;
	}

	function setMode(mode) {
		if ([MODE_FOLD, MODE_BOUNDARY, MODE_STACK].indexOf(mode) < 0) {
			_warn("Unbekannter Modus: " + mode);
			return API;
		}
		if (_state.cfg.mode === mode) return API;
		_state.cfg.mode = mode;

		var th = _theme();
		if (_state.modeBtns) {
			var keys = Object.keys(_state.modeBtns);
			for (var i = 0; i < keys.length; i++) {
				var b = _state.modeBtns[keys[i]];
				var txt = b.textContent;
				b.style.cssText = _btnCss(th, keys[i] === mode);
				b.textContent = txt;
			}
		}

		// Im Stack-Modus ist der Scrubber ein Schichtwähler → auf 1 setzen
		if (mode === MODE_STACK && _state.pipeline) {
			var n = _state.pipeline.stages.length - 1;
			if (n >= 1) {
				_state.scrub = 1 / n;
				_state.scrubTarget = _state.scrub;
				_syncScrub();
			}
		}

		_state.lastViewHash = null;
		_state.dirty = true;

		if (!_state.visible) {
			_state.pendingRender = true;
			return API;
		}

		// Modus-Wechsel braucht keine neue Pipeline — nur neue Geometrie
		if (_state.pipeline) {
			_rebuildGeometryOnly();
			_updateHud(_state.pipeline);
			_updateNetDiagram(_state.pipeline);
			_updateDiag();
			if (_state.ctrlEl && _state.ctrlEl.style.display !== "none") {
				_buildPanel();
			}
			_resetCamera();
		} else {
			_scheduleRebuild();
		}

		_log("Modus: " + mode);
		return API;
	}

	function getConfig() {
		try { return JSON.parse(JSON.stringify(_state.cfg)); }
		catch (e) { return {}; }
	}

	function setConfig(cfg) {
		if (!cfg || typeof cfg !== "object") return API;
		var keys = Object.keys(cfg);
		var touchedData = false;
		var touchedMode = false;

		for (var i = 0; i < keys.length; i++) {
			var k = keys[i];
			if (!Object.prototype.hasOwnProperty.call(_state.cfg, k)) {
				_warn("Unbekannte Option ignoriert: " + k);
				continue;
			}
			var v = cfg[k];
			var want = typeof _state.cfg[k];

			if (k === "mode") {
				if ([MODE_FOLD, MODE_BOUNDARY, MODE_STACK].indexOf(v) < 0) {
					_warn("Ungültiger Modus: " + v);
					continue;
				}
				if (_state.cfg.mode !== v) { touchedMode = true; }
				_state.cfg.mode = v;
				continue;
			}

			if (typeof v !== want) {
				_warn("Option '" + k + "' erwartet " + want + ", bekam " + typeof v);
				continue;
			}
			if (want === "number" && !_fin(v)) {
				_warn("Option '" + k + "' ist keine finite Zahl");
				continue;
			}
			if (_state.cfg[k] !== v) {
				_state.cfg[k] = v;
				if (k === "maxPoints") touchedData = true;
				if (k === "dpr") _applyDpr();
			}
		}

		if (touchedData) _state.cache.xHash = null;
		_state.autoQuality = false;

		if (touchedMode) {
			setMode(_state.cfg.mode);
		} else {
			_markDirty(true);
		}

		if (_state.ctrlEl && _state.ctrlEl.style.display !== "none") _buildPanel();
		return API;
	}

	function setQuality(level) {
		_state.autoQuality = false;
		_applyQuality(level);
		_refreshQBtns();
		_markDirty(true);
		return API;
	}

	function setScrub(t) {
		if (!_fin(t)) return API;
		_state.scrub = Math.max(0, Math.min(1, t));
		_state.scrubTarget = _state.scrub;
		_state.scrubPlaying = false;
		if (_state.playBtn) _state.playBtn.textContent = "\u25B6";
		_syncScrub();
		_rebuildGeometryOnly();
		return API;
	}

	function play() {
		if (!_state.scrubPlaying) _togglePlay();
		return API;
	}

	function pause() {
		if (_state.scrubPlaying) _togglePlay();
		return API;
	}

	function resetCamera() {
		_resetCamera();
		return API;
	}

	function _softReset() {
		try { if (_state.rafId) cancelAnimationFrame(_state.rafId); } catch (e) {}
		_state.rafId = null;

		try { if (_state.animId) cancelAnimationFrame(_state.animId); } catch (e) {}
		_state.animId = null;

		if (_state.watchTimer) { clearInterval(_state.watchTimer); _state.watchTimer = null; }
		if (_state.observer)  { try { _state.observer.disconnect(); } catch (e) {} _state.observer = null; }
		if (_state.resizeObs) { try { _state.resizeObs.disconnect(); } catch (e) {} _state.resizeObs = null; }

		_clearGroup(_state.sheetGroup);
		_clearGroup(_state.foldGroup);
		_clearGroup(_state.dataGroup);
		_clearGroup(_state.boundGroup);
		_clearGroup(_state.stackGroup);
		_clearGroup(_state.helperGroup);

		try {
			if (_state.renderer) {
				_state.renderer.dispose();
				var dom = _state.renderer.domElement;
				if (dom && dom.parentNode) dom.parentNode.removeChild(dom);
			}
		} catch (e) {}

		_state.renderer = null;
		_state.scene = null;
		_state.camera = null;
		_state.initialized = false;
		_state.hasFramed = false;
		_state.pipeline = null;
		_state.lastFingerprint = null;
		_state.lastViewHash = null;
		_state.lastChainSig = null;
		_state.lastFramedHash = null;
		_state.lastFitLayer = -1;
	}

	function destroy() {
		_state.destroyed = true;

		try { if (_state.onMouseMove) global.removeEventListener("mousemove", _state.onMouseMove); } catch (e) {}
		try { if (_state.onMouseUp)   global.removeEventListener("mouseup", _state.onMouseUp); } catch (e) {}
		try { if (_state.onKeyDown)   global.removeEventListener("keydown", _state.onKeyDown); } catch (e) {}

		_softReset();

		_tFree(_state.cache.xTensor);
		_state.cache.xTensor = null;
		_state.cache.xHash = null;

		if (_state.tipEl && _state.tipEl.parentNode) {
			try { _state.tipEl.parentNode.removeChild(_state.tipEl); } catch (e) {}
		}
		if (_state.container && _state.container.parentNode) {
			try { _state.container.parentNode.removeChild(_state.container); } catch (e) {}
		}

		_state.container  = null;
		_state.canvasWrap = null;
		_state.hudEl      = null;
		_state.ctrlEl     = null;
		_state.netEl      = null;
		_state.tipEl      = null;
		_state.overlayEl  = null;
		_state.modelRef   = null;

		_log("zerstört");
		return API;
	}

	// ==================================================================
	// 25. EXPORT
	// ==================================================================

	var API = {
		init:        init,
		update:      update,
		forceUpdate: forceUpdate,
		destroy:     destroy,
		getConfig:   getConfig,
		setConfig:   setConfig,
		setMode:     setMode,
		setQuality:  setQuality,
		setScrub:    setScrub,
		play:        play,
		pause:       pause,
		resetCamera: resetCamera,

		MODE_FOLD:     MODE_FOLD,
		MODE_BOUNDARY: MODE_BOUNDARY,
		MODE_STACK:    MODE_STACK,

		// Debug-Zugriff
		_state:            _state,
		_buildChain:       _buildChain,
		_computePipeline:  _computePipeline,
		_extractFolds:     _extractFolds,
		_marchingSquares:  _marchingSquares,
		classColor:        _classColor,
		classColorCss:     _classColorCss,
		palette:           PALETTE
	};

	if (typeof global !== "undefined") {
		global.OrigamiLive = API;
	}

	return API;

})(typeof window !== "undefined" ? window : this);

// ======================================================================
// KOMFORT-WRAPPER (analog zu origami_folds.js)
// ======================================================================

/**
 * Erstellt bzw. aktualisiert die Live-Faltung.
 * Ohne Argument hängt sie sich als Singleton an <body>.
 */
function create_origami_live(divOrId) {
	try {
		return OrigamiLive.init(divOrId);
	} catch (e) {
		if (typeof err === "function") {
			err("[origami_live] create_origami_live fehlgeschlagen: " + e);
		} else if (typeof console !== "undefined") {
			console.error("[origami_live] create_origami_live fehlgeschlagen:", e);
		}
	}
}

var _origami_live_initialised = false;

/**
 * Pro Trainings-Epoche aufrufen. Initialisiert beim ersten Mal selbst,
 * danach nur noch Update — und das nur, wenn der Tab sichtbar ist.
 */
function update_origami_live(divOrId) {
	try {
		if (!_origami_live_initialised) {
			var target = divOrId;
			if (!target) {
				var byId = document.getElementById("origami_live_plot");
				if (byId) target = byId;
			}
			OrigamiLive.init(target);
			_origami_live_initialised = true;
			return OrigamiLive;
		}
		return OrigamiLive.update();
	} catch (e) {
		if (typeof wrn === "function") {
			wrn("[origami_live] update_origami_live fehlgeschlagen: " + e);
		} else if (typeof console !== "undefined") {
			console.warn("[origami_live] update_origami_live fehlgeschlagen:", e);
		}
	}
}

/**
 * Prüft, ob das Modell faltbar ist — exakt dieselben Constraints wie
 * origami_folds.js: nur Dense (1–3D), InputLayer (1–3D), und die harmlosen
 * flatten/reshape/dropout. Conv/Conv2D/DepthwiseConv2D → inkompatibel.
 */
function _origami_live_compatible() {
	try {
		if (typeof model === "undefined" || !model || !model.layers) return false;
		if (!model.layers.length) return false;

		var anyDense = false;
		for (var i = 0; i < model.layers.length; i++) {
			var l = model.layers[i];
			var cls = "";
			try { cls = l.getClassName ? l.getClassName() : ""; } catch (e) { cls = ""; }
			var lc = String(cls).toLowerCase();

			if (lc === "dense") {
				anyDense = true;
				var outS = null;
				try { outS = l.outputShape; } catch (e) { outS = null; }
				if (!outS || !outS.length) return false;
				var outD = outS[outS.length - 1];
				if (typeof outD !== "number" || !isFinite(outD) ||
				    outD < 1 || outD > 3) return false;
			} else if (lc === "inputlayer" || lc === "input") {
				var inS = null;
				try { inS = l.outputShape; } catch (e) { inS = null; }
				if (!inS || !inS.length) {
					try { inS = l.batchInputShape; } catch (e) { inS = null; }
				}
				if (!inS || !inS.length) return false;
				var inD = inS[inS.length - 1];
				if (typeof inD !== "number" || !isFinite(inD) ||
				    inD < 1 || inD > 3) return false;
			} else if (lc === "flatten" || lc === "reshape" || lc === "dropout") {
				continue;
			} else {
				return false;
			}
		}
		if (!anyDense) return false;

		if (model.inputs && model.inputs.length) {
			var is = model.inputs[0].shape;
			if (is && is.length >= 2) {
				var fd = is[is.length - 1];
				if (typeof fd === "number" && isFinite(fd) &&
				    (fd < 1 || fd > 3)) return false;
			}
		}
		return true;
	} catch (e) {
		return false;
	}
}

var _origami_live_tab_state = {
	visible:    false,
	retryCount: 0,
	maxRetries: 20,
	retryTimer: null
};

function _origamiLiveApplyTabVisibility(ok) {
	var li = null;
	var label = document.getElementById("origami_live_tab_label");
	if (label) {
		li = label.parentElement;
		if (!li || li.tagName !== "LI") li = label.parentNode;
	}
	if (!li) li = document.querySelector("li[data-origami-live-tab]");
	if (!li) return;   // fail-open: Tab bleibt sichtbar

	if (ok) {
		li.style.removeProperty("display");
	} else {
		li.style.setProperty("display", "none", "important");
	}

	setTimeout(function () {
		try {
			if (ok && li.style.display === "none") li.style.removeProperty("display");
		} catch (e) {}
	}, 200);
}

function check_origami_live_tab() {
	try {
		var ok = _origami_live_compatible();
		_origamiLiveApplyTabVisibility(ok);

		if (ok && !_origami_live_tab_state.visible) {
			_origami_live_tab_state.visible = true;
			_origami_live_tab_state.retryCount = 0;
			if (_origami_live_tab_state.retryTimer) {
				clearInterval(_origami_live_tab_state.retryTimer);
				_origami_live_tab_state.retryTimer = null;
			}
		}

		if (!ok && _origami_live_tab_state.visible) {
			_origami_live_tab_state.visible = false;
			try {
				OrigamiLive.destroy();
				_origami_live_initialised = false;
			} catch (e) {}
		}

		if (!ok && _origami_live_tab_state.retryCount < _origami_live_tab_state.maxRetries) {
			if (!_origami_live_tab_state.retryTimer) {
				_origami_live_tab_state.retryTimer = setInterval(function () {
					_origami_live_tab_state.retryCount++;
					if (_origami_live_compatible()) {
						_origamiLiveApplyTabVisibility(true);
						_origami_live_tab_state.visible = true;
						_origami_live_tab_state.retryCount = 0;
						clearInterval(_origami_live_tab_state.retryTimer);
						_origami_live_tab_state.retryTimer = null;
					} else if (_origami_live_tab_state.retryCount >=
					           _origami_live_tab_state.maxRetries) {
						clearInterval(_origami_live_tab_state.retryTimer);
						_origami_live_tab_state.retryTimer = null;
					}
				}, 500);
			}
		}
	} catch (e) { /* niemals die App brechen */ }
}

if (typeof window !== "undefined") {
	window.addEventListener("load", function () {
		try { check_origami_live_tab(); } catch (e) {}
	});
	document.addEventListener("DOMContentLoaded", function () {
		try { check_origami_live_tab(); } catch (e) {}
	});
	window.check_origami_live_tab = check_origami_live_tab;
	window.create_origami_live    = create_origami_live;
	window.update_origami_live    = update_origami_live;
}

// Kein Auto-Init: update_origami_live() initialisiert beim ersten Aufruf.
// OrigamiLive.init();                          // an <body>
// OrigamiLive.init("origami_live_plot");       // in ein Div
// OrigamiLive.init($("#meinDiv"));             // jQuery
//<script src="three.min.js"></script>
//<script src="origami_live.js"></script>
//<div id="origami_live_plot"></div>
//update_origami_live();   // initialisiert beim ersten Mal selbst
