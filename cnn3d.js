"use strict";

/**
 * cnn3d.js - 3D CNN visualizer using three.js  (overhauled + tooltips + threshold fix + glam)
 *
 * Public API (all on window.CNN3D):
 *   CNN3D.render(divOrId, options?)
 *   CNN3D.destroy(divOrId)
 *   CNN3D.forceRender(divOrId)
 */
(function (global) {

	if (typeof THREE === "undefined") {
		console.error("[cnn3d.js] THREE is not loaded. Include three.min.js BEFORE cnn3d.js.");
		return;
	}

	// ------------------------------------------------------------------
	// Registry & defaults
	// ------------------------------------------------------------------
	var INSTANCES = new Map();

	var DEFAULTS = {
		threshold: 0.0,
		perLayerThresholds: {},
		sliceGap: 4,
		layerGap: 40,
		pixelSize: 1,
		colormap: 'viridis',
		opacity: 1.0,
		showConnections: true,
		showInputImage: true,
		autoUpdateHash: true
	};

	function getTheme() {
		var dark = !!global.is_dark_mode;
		if (dark) {
			return {
				dark: true,
				background: 0x0a0d18,
				gridEdge: 0xbbccdd,
				denseEdge: 0xffddaa,
				text: '#e8ecff',
				textAccent: '#b8c8ff',
				guiBg: 'linear-gradient(140deg, rgba(28,32,52,0.92), rgba(18,20,38,0.94))',
				guiBorder: 'rgba(140,160,230,0.28)',
				guiShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
				rowBg: 'linear-gradient(90deg, rgba(80,100,180,0.18), rgba(60,80,150,0.08))',
				rowHoverBg: 'linear-gradient(90deg, rgba(100,130,220,0.28), rgba(80,110,190,0.14))',
				selectBg: '#1a1f30',
				selectFg: '#e8ecff',
				selectBorder: '#3a4568',
				btnBg: 'linear-gradient(135deg, #4a67b8, #6b7fd8)',
				btnFg: '#fff',
				btnShadow: '0 4px 12px rgba(74,103,184,0.4)',
				overlayFg: '#e8ecff',
				overlayBg: 'rgba(10,13,24,0.7)',
				tooltipBg: 'linear-gradient(140deg, rgba(30,35,58,0.96), rgba(20,24,42,0.98))',
				tooltipBorder: 'rgba(160,180,255,0.35)',
				tooltipFg: '#e8ecff',
				tooltipAccent: '#a8c0ff',
				tooltipShadow: '0 10px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(160,180,255,0.15)'
			};
		}
		return {
			dark: false,
			background: 0xeef1f9,
			gridEdge: 0x556680,
			denseEdge: 0x8a5a20,
			text: '#1a1f30',
			textAccent: '#334a99',
			guiBg: 'linear-gradient(140deg, rgba(252,253,255,0.98), rgba(230,236,248,0.98))',
			guiBorder: 'rgba(60,80,140,0.22)',
			guiShadow: '0 8px 28px rgba(60,80,140,0.15), inset 0 1px 0 rgba(255,255,255,0.9)',
			rowBg: 'linear-gradient(90deg, rgba(80,110,180,0.10), rgba(120,140,200,0.04))',
			rowHoverBg: 'linear-gradient(90deg, rgba(80,110,180,0.20), rgba(120,140,200,0.10))',
			selectBg: '#fff',
			selectFg: '#1a1f30',
			selectBorder: '#c4cee0',
			btnBg: 'linear-gradient(135deg, #4a67b8, #5f7cc8)',
			btnFg: '#fff',
			btnShadow: '0 3px 10px rgba(74,103,184,0.3)',
			overlayFg: '#1a1f30',
			overlayBg: 'rgba(238,241,249,0.85)',
			tooltipBg: 'linear-gradient(140deg, rgba(255,255,255,0.98), rgba(240,244,252,0.98))',
			tooltipBorder: 'rgba(60,80,140,0.25)',
			tooltipFg: '#1a1f30',
			tooltipAccent: '#334a99',
			tooltipShadow: '0 10px 30px rgba(60,80,140,0.25), 0 0 0 1px rgba(60,80,140,0.08)'
		};
	}

	// ------------------------------------------------------------------
	// Colormaps
	// ------------------------------------------------------------------
	var VIRIDIS_STOPS = [
		[0.267, 0.005, 0.329],
		[0.229, 0.322, 0.545],
		[0.127, 0.567, 0.550],
		[0.369, 0.788, 0.383],
		[0.993, 0.906, 0.144]
	];
	function colormapViridis(t) {
		if (t <= 0) return VIRIDIS_STOPS[0];
		if (t >= 1) return VIRIDIS_STOPS[VIRIDIS_STOPS.length - 1];
		var scaled = t * (VIRIDIS_STOPS.length - 1);
		var i = Math.floor(scaled), f = scaled - i;
		var a = VIRIDIS_STOPS[i], b = VIRIDIS_STOPS[i + 1];
		return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
	}
	function colormapGrayscale(t) { var v = Math.max(0, Math.min(1, t)); return [v, v, v]; }
	function colormapSigned(t) {
		if (t >= 0) return [0, 0, Math.min(1, t)];
		return [Math.min(1, -t), 0, 0];
	}
	function getColormapFunc(name) {
		if (name === 'grayscale') return colormapGrayscale;
		if (name === 'signed') return colormapSigned;
		return colormapViridis;
	}

	// ------------------------------------------------------------------
	// Helpers
	// ------------------------------------------------------------------
	function safeShape(arr) {
		var s = [], cur = arr;
		while (Array.isArray(cur)) { s.push(cur.length); cur = cur[0]; }
		return s;
	}
	function flattenDeep(a, out) {
		out = out || [];
		for (var i = 0; i < a.length; i++) {
			if (Array.isArray(a[i])) flattenDeep(a[i], out);
			else out.push(a[i]);
		}
		return out;
	}
	function minMaxAbs(arr) {
		var mn = Infinity, mx = -Infinity, mxAbs = 0;
		for (var i = 0; i < arr.length; i++) {
			var v = arr[i];
			if (typeof v !== "number" || !isFinite(v)) continue;
			if (v < mn) mn = v;
			if (v > mx) mx = v;
			var a = Math.abs(v);
			if (a > mxAbs) mxAbs = a;
		}
		if (!isFinite(mn)) mn = 0;
		if (!isFinite(mx)) mx = 0;
		return { min: mn, max: mx, maxAbs: mxAbs };
	}
	function meanStd(arr) {
		var n = 0, sum = 0;
		for (var i = 0; i < arr.length; i++) {
			var v = arr[i];
			if (typeof v !== "number" || !isFinite(v)) continue;
			sum += v; n++;
		}
		var mean = n > 0 ? sum / n : 0;
		var sq = 0;
		for (var j = 0; j < arr.length; j++) {
			var v2 = arr[j];
			if (typeof v2 !== "number" || !isFinite(v2)) continue;
			var d = v2 - mean; sq += d * d;
		}
		var std = n > 0 ? Math.sqrt(sq / n) : 0;
		return { mean: mean, std: std, count: n };
	}
	function fracAbove(arr, thr) {
		var n = 0, above = 0;
		for (var i = 0; i < arr.length; i++) {
			var v = arr[i];
			if (typeof v !== "number" || !isFinite(v)) continue;
			n++;
			if (Math.abs(v) >= thr) above++;
		}
		return n > 0 ? above / n : 0;
	}
	function hashString(str) {
		var h = 5381, i = str.length;
		while (i) h = (h * 33) ^ str.charCodeAt(--i);
		return h >>> 0;
	}

	// ------------------------------------------------------------------
	// Read model / layer_states_saved
	// ------------------------------------------------------------------
	function classifyLayer(cls) {
		var lc = (cls || "").toLowerCase();
		if (lc.indexOf("conv2d") >= 0) return "conv2d";
		if (lc === "dense") return "dense";
		if (lc === "flatten") return "flatten";
		if (lc.indexOf("pool") >= 0) return "conv2d";
		return "other";
	}

	function readModelState() {
		var res = { layers: [], inputImage: null, hasAnyActivation: false, modelPresent: false };
		if (typeof model === "undefined" || !model || !model.layers) return res;
		res.modelPresent = true;

		var states = (typeof layer_states_saved !== "undefined" && layer_states_saved) ? layer_states_saved : null;

		if (states) {
			try {
				var l0 = states["0"];
				if (l0 && l0.input && Array.isArray(l0.input) && Array.isArray(l0.input[0])) {
					var inpCandidate = l0.input[0];
					var sc = safeShape(inpCandidate);
					if (sc.length === 4 && sc[0] === 1 && sc[3] === 3) {
						inpCandidate = inpCandidate[0];
						sc = safeShape(inpCandidate);
					}
					if (sc.length === 3 && sc[2] === 3) {
						res.inputImage = { data: inpCandidate, shape: sc };
					}
				}
			} catch (e) { /* ignore */ }
		}

		var visibleLayers = model.layers;
		for (var i = 0; i < visibleLayers.length; i++) {
			var layer = visibleLayers[i];
			var name = layer.name || "";
			if (name.indexOf("skip_proj_") >= 0 ||
				name.indexOf("skip_add_") >= 0 ||
				name.indexOf("skip_scale_") >= 0) continue;

			var cls = "";
			try { cls = layer.getClassName ? layer.getClassName() : (layer.constructor && layer.constructor.name) || ""; }
			catch (e) { cls = ""; }

			var kind = classifyLayer(cls);
			if (kind !== "conv2d" && kind !== "dense" && kind !== "flatten") continue;

			var outShape = null;
			try { outShape = layer.outputShape; } catch (e) { outShape = null; }

			var activation = null;
			if (states) {
				try {
					var s2 = states[i];
					if (s2 && s2.output && Array.isArray(s2.output) && s2.output.length > 0) {
						activation = s2.output[0];
					}
				} catch (e) { /* ignore */ }
			}
			if (activation) res.hasAnyActivation = true;

			res.layers.push({
				idx: i,
				name: name,
				className: cls,
				kind: kind,
				outputShape: outShape,
				activation: activation
			});
		}
		return res;
	}

	// ------------------------------------------------------------------
	// Hash for change detection
	// ------------------------------------------------------------------
	function buildStateHash(state, opts, theme) {
		var parts = [];
		parts.push("dark=" + theme.dark);
		parts.push("th=" + opts.threshold);
		parts.push("sg=" + opts.sliceGap);
		parts.push("lg=" + opts.layerGap);
		parts.push("px=" + opts.pixelSize);
		parts.push("cm=" + opts.colormap);
		parts.push("op=" + opts.opacity);
		parts.push("sc=" + opts.showConnections);
		parts.push("si=" + opts.showInputImage);
		var keys = Object.keys(opts.perLayerThresholds).sort();
		for (var k = 0; k < keys.length; k++) parts.push("pt" + keys[k] + "=" + opts.perLayerThresholds[keys[k]]);

		for (var i = 0; i < state.layers.length; i++) {
			var L = state.layers[i];
			parts.push("L" + i + ":" + L.kind + ":" + (L.outputShape ? L.outputShape.join(",") : "?"));
			if (L.activation) {
				var flat = flattenDeep(L.activation);
				var stride = Math.max(1, Math.floor(flat.length / 50));
				var mm = minMaxAbs(flat);
				var s = mm.min.toFixed(4) + "|" + mm.max.toFixed(4) + "|" + mm.maxAbs.toFixed(4) + "|" + flat.length + "|";
				for (var j = 0; j < flat.length; j += stride) s += flat[j].toFixed(3) + ",";
				parts.push(s);
			} else {
				parts.push("noact");
			}
		}
		if (state.inputImage) {
			var mm2 = minMaxAbs(flattenDeep(state.inputImage.data));
			parts.push("img=" + state.inputImage.shape.join(",") + "|" + mm2.min.toFixed(3) + "|" + mm2.max.toFixed(3));
		}
		return hashString(parts.join(";"));
	}

	// ==================================================================
	// Instance
	// ==================================================================
	function createInstance(container) {
		return {
			container: container,
			opts: Object.assign({}, DEFAULTS),
			scene: null, camera: null, renderer: null,
			modelGroup: null, connectionsGroup: null,
			animationHandle: null, cameraTarget: null,
			isVisible: false, observer: null, resizeObserver: null,
			guiEl: null, overlayEl: null, canvasWrapper: null,
			tooltipEl: null, raycaster: null, mouseNDC: null,
			hoverables: [], // { mesh, meta }
			lastHover: null,
			lastHash: null, lastDarkMode: null,
			sphericalTarget: null,
			_hasFramed: false,
			_lastLayerCount: 0,
			_darkModeInterval: null,
			_pointerMoveHandler: null,
			_pointerLeaveHandler: null
		};
	}

	// ------------------------------------------------------------------
	// GUI
	// ------------------------------------------------------------------
	function ensureGUI(inst) {
		if (inst.guiEl && inst.guiEl.parentNode) { styleGUI(inst); return; }

		var gui = document.createElement("div");
		gui.className = "cnn3d-gui";
		gui.innerHTML = ''
			+ '<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start;">'
			+ '  <div class="cnn3d-gui-globals" style="min-width:240px;flex:1;">'
			+ '    <div data-role="hdr-globals" style="font-weight:700;margin-bottom:8px;font-size:13px;letter-spacing:0.3px;">✦ Global Controls</div>'
			+ '    <label data-tip="Global activation threshold. Pixels with |normalized value| below this get hidden. Per-layer sliders override this." style="display:block;margin:6px 0;">Threshold (fallback): <span data-role="th-label">0.00</span>'
			+ '      <input type="range" data-role="th" min="0" max="1" step="0.001" value="0" style="width:100%;">'
			+ '    </label>'
			+ '    <label data-tip="Spacing between channel slices within a Conv2D layer." style="display:block;margin:6px 0;">Slice gap: <span data-role="sg-label">4</span>'
			+ '      <input type="range" data-role="sg" min="0" max="30" step="0.5" value="4" style="width:100%;">'
			+ '    </label>'
			+ '    <label data-tip="Distance between successive layers along the X axis." style="display:block;margin:6px 0;">Layer gap: <span data-role="lg-label">40</span>'
			+ '      <input type="range" data-role="lg" min="10" max="200" step="1" value="40" style="width:100%;">'
			+ '    </label>'
			+ '    <label data-tip="Size of each activation pixel in world units." style="display:block;margin:6px 0;">Pixel size: <span data-role="px-label">1</span>'
			+ '      <input type="range" data-role="px" min="0.3" max="4" step="0.1" value="1" style="width:100%;">'
			+ '    </label>'
			+ '    <label data-tip="Overall opacity of activation textures." style="display:block;margin:6px 0;">Opacity: <span data-role="op-label">1.00</span>'
			+ '      <input type="range" data-role="op" min="0.05" max="1" step="0.01" value="1" style="width:100%;">'
			+ '    </label>'
			+ '    <label data-tip="Color scheme used to map activation magnitude to color." style="display:block;margin:8px 0;">Colormap:'
			+ '      <select data-role="cm" style="width:100%;padding:4px;">'
			+ '        <option value="viridis">Viridis</option>'
			+ '        <option value="grayscale">Grayscale</option>'
			+ '        <option value="signed">Signed (red/blue)</option>'
			+ '      </select>'
			+ '    </label>'
			+ '    <label data-tip="Toggle the drawing of lines between consecutive layers." style="display:block;margin:6px 0;"><input type="checkbox" data-role="sc" checked> Show weighted connections</label>'
			+ '    <label data-tip="Show the original RGB input image before the first layer." style="display:block;margin:6px 0;"><input type="checkbox" data-role="si" checked> Show input image</label>'
			+ '    <button data-role="reset-cam" data-tip="Reset the camera to frame the entire network." style="margin-top:8px;padding:7px 14px;border:none;border-radius:6px;cursor:pointer;font-weight:600;">↺ Reset camera</button>'
			+ '  </div>'
			+ '  <div class="cnn3d-gui-perlayer" style="min-width:280px;flex:2;">'
			+ '    <div data-role="hdr-perlayer" style="font-weight:700;margin-bottom:8px;font-size:13px;letter-spacing:0.3px;">✦ Per-layer thresholds</div>'
			+ '    <div data-role="perlayer-list" style="max-height:280px;overflow-y:auto;padding-right:6px;"></div>'
			+ '  </div>'
			+ '</div>';

		inst.container.appendChild(gui);
		inst.guiEl = gui;
		styleGUI(inst);
		attachGUITooltips(inst);

		function bindRange(role, prop, fmt) {
			var input = gui.querySelector('[data-role="' + role + '"]');
			var label = gui.querySelector('[data-role="' + role + '-label"]');
			input.value = inst.opts[prop];
			if (label) label.textContent = fmt ? fmt(inst.opts[prop]) : inst.opts[prop];
			input.addEventListener('input', function () {
				inst.opts[prop] = parseFloat(input.value);
				if (label) label.textContent = fmt ? fmt(inst.opts[prop]) : inst.opts[prop];
				scheduleRebuild(inst);
			});
		}
		bindRange('th', 'threshold', function (v) { return v.toFixed(3); });
		bindRange('sg', 'sliceGap',  function (v) { return v.toFixed(1); });
		bindRange('lg', 'layerGap',  function (v) { return v.toFixed(0); });
		bindRange('px', 'pixelSize', function (v) { return v.toFixed(1); });
		bindRange('op', 'opacity',   function (v) { return v.toFixed(2); });

		var cmSel = gui.querySelector('[data-role="cm"]');
		cmSel.value = inst.opts.colormap;
		cmSel.addEventListener('change', function () { inst.opts.colormap = cmSel.value; scheduleRebuild(inst); });

		var scCb = gui.querySelector('[data-role="sc"]');
		scCb.checked = !!inst.opts.showConnections;
		scCb.addEventListener('change', function () { inst.opts.showConnections = scCb.checked; scheduleRebuild(inst); });

		var siCb = gui.querySelector('[data-role="si"]');
		siCb.checked = !!inst.opts.showInputImage;
		siCb.addEventListener('change', function () { inst.opts.showInputImage = siCb.checked; scheduleRebuild(inst); });

		gui.querySelector('[data-role="reset-cam"]').addEventListener('click', function () { resetCamera(inst); });
	}

	function styleGUI(inst) {
		if (!inst.guiEl) return;
		var theme = getTheme();
		inst.guiEl.style.cssText = [
			"margin-top:10px",
			"padding:14px 16px",
			"font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif",
			"font-size:12px",
			"color:" + theme.text,
			"background:" + theme.guiBg,
			"border:1px solid " + theme.guiBorder,
			"border-radius:12px",
			"box-shadow:" + theme.guiShadow,
			"backdrop-filter:blur(10px)",
			"-webkit-backdrop-filter:blur(10px)",
			"user-select:none"
		].join(";");

		var hdr1 = inst.guiEl.querySelector('[data-role="hdr-globals"]');
		var hdr2 = inst.guiEl.querySelector('[data-role="hdr-perlayer"]');
		if (hdr1) hdr1.style.color = theme.textAccent;
		if (hdr2) hdr2.style.color = theme.textAccent;

		var sel = inst.guiEl.querySelector('[data-role="cm"]');
		if (sel) sel.style.cssText = "width:100%;padding:6px 8px;background:" + theme.selectBg + ";color:" + theme.selectFg + ";border:1px solid " + theme.selectBorder + ";border-radius:6px;font-size:12px;cursor:pointer;";

		var btn = inst.guiEl.querySelector('[data-role="reset-cam"]');
		if (btn) btn.style.cssText = "margin-top:8px;padding:7px 14px;background:" + theme.btnBg + ";color:" + theme.btnFg + ";border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;box-shadow:" + theme.btnShadow + ";transition:transform 0.15s ease,box-shadow 0.15s ease;";

		// Style all range inputs for a modern look
		var rangeInputs = inst.guiEl.querySelectorAll('input[type="range"]');
		rangeInputs.forEach(function (r) {
			r.style.cssText = "width:100%;accent-color:" + (theme.dark ? "#8ba0e8" : "#4a67b8") + ";cursor:pointer;";
		});

		// re-color per-layer rows
		var rows = inst.guiEl.querySelectorAll('[data-role^="pl-row-"]');
		rows.forEach(function (r) {
			r.style.background = theme.rowBg;
			r.style.border = "1px solid " + theme.guiBorder;
			var label = r.querySelector('[data-role^="pl-name-"]');
			var val = r.querySelector('[data-role^="pl-val-"]');
			if (label) label.style.color = theme.textAccent;
			if (val) val.style.color = theme.text;
		});
	}

	function rebuildPerLayerControls(inst, state) {
		if (!inst.guiEl) return;
		var theme = getTheme();
		var list = inst.guiEl.querySelector('[data-role="perlayer-list"]');
		list.innerHTML = '';
		for (var i = 0; i < state.layers.length; i++) {
			var L = state.layers[i];
			var val = (inst.opts.perLayerThresholds[L.idx] !== undefined)
				? inst.opts.perLayerThresholds[L.idx]
				: inst.opts.threshold;

			var shapeStr = L.outputShape ? L.outputShape.filter(function (v) { return v !== null; }).join("×") : "?";
			var tip = "Layer index " + L.idx + " • " + L.className + " • output shape [" + shapeStr + "]. Values below this threshold get hidden (per-layer override).";

			var row = document.createElement('div');
			row.setAttribute('data-role', 'pl-row-' + L.idx);
			row.setAttribute('data-tip', tip);
			row.style.cssText = "margin:6px 0;padding:7px 9px;background:" + theme.rowBg + ";border:1px solid " + theme.guiBorder + ";border-radius:7px;transition:background 0.15s ease;";
			row.innerHTML =
				  '<div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:3px;">'
				+ '<span data-role="pl-name-' + L.idx + '" style="color:' + theme.textAccent + ';font-weight:600;">L' + L.idx + ' · ' + L.kind + ' <span style="opacity:0.6;font-weight:400;">[' + shapeStr + ']</span></span>'
				+ '<span data-role="pl-val-' + L.idx + '" style="color:' + theme.text + ';font-variant-numeric:tabular-nums;">' + val.toFixed(3) + '</span>'
				+ '</div>'
				+ '<input type="range" data-role="pl-' + L.idx + '" min="0" max="1" step="0.001" value="' + val + '" style="width:100%;">';
			list.appendChild(row);
			(function (idx, rowEl) {
				var inp = rowEl.querySelector('[data-role="pl-' + idx + '"]');
				var lab = rowEl.querySelector('[data-role="pl-val-' + idx + '"]');
				inp.addEventListener('input', function () {
					inst.opts.perLayerThresholds[idx] = parseFloat(inp.value);
					lab.textContent = inst.opts.perLayerThresholds[idx].toFixed(3);
					scheduleRebuild(inst);
				});
				rowEl.addEventListener('mouseenter', function () { rowEl.style.background = theme.rowHoverBg; });
				rowEl.addEventListener('mouseleave', function () { rowEl.style.background = theme.rowBg; });
			})(L.idx, row);
		}
		// re-apply range styling for the newly added inputs
		styleGUI(inst);
	}

	// ------------------------------------------------------------------
	// GUI tooltip attachment (delegated hover on data-tip elements)
	// ------------------------------------------------------------------
	function attachGUITooltips(inst) {
		if (!inst.guiEl) return;
		var currentTip = null;
		inst.guiEl.addEventListener('mouseover', function (e) {
			var el = e.target;
			while (el && el !== inst.guiEl && !el.getAttribute('data-tip')) el = el.parentElement;
			if (!el || el === inst.guiEl) return;
			var text = el.getAttribute('data-tip');
			if (!text) return;
			showTooltip(inst, text, e.clientX, e.clientY);
			currentTip = el;
		});
		inst.guiEl.addEventListener('mousemove', function (e) {
			if (!currentTip) return;
			positionTooltip(inst, e.clientX, e.clientY);
		});
		inst.guiEl.addEventListener('mouseout', function (e) {
			var el = e.target;
			while (el && el !== inst.guiEl && !el.getAttribute('data-tip')) el = el.parentElement;
			if (el && el === currentTip) { hideTooltip(inst); currentTip = null; }
		});
	}

	// ------------------------------------------------------------------
	// Tooltip element (shared between GUI hover and 3D raycast hover)
	// ------------------------------------------------------------------
	function ensureTooltip(inst) {
		if (inst.tooltipEl && inst.tooltipEl.parentNode) return inst.tooltipEl;
		var theme = getTheme();
		var t = document.createElement('div');
		t.className = 'cnn3d-tooltip';
		t.style.cssText = [
			"position:fixed",
			"pointer-events:none",
			"z-index:9999",
			"display:none",
			"max-width:340px",
			"padding:10px 12px",
			"font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif",
			"font-size:12px",
			"line-height:1.5",
			"color:" + theme.tooltipFg,
			"background:" + theme.tooltipBg,
			"border:1px solid " + theme.tooltipBorder,
			"border-radius:8px",
			"box-shadow:" + theme.tooltipShadow,
			"backdrop-filter:blur(12px)",
			"-webkit-backdrop-filter:blur(12px)",
			"opacity:0",
			"transform:translateY(4px)",
			"transition:opacity 0.12s ease,transform 0.12s ease"
		].join(";");
		document.body.appendChild(t);
		inst.tooltipEl = t;
		return t;
	}

	function showTooltip(inst, html, x, y) {
		var t = ensureTooltip(inst);
		var theme = getTheme();
		t.style.color = theme.tooltipFg;
		t.style.background = theme.tooltipBg;
		t.style.border = "1px solid " + theme.tooltipBorder;
		t.style.boxShadow = theme.tooltipShadow;
		t.innerHTML = html;
		t.style.display = 'block';
		positionTooltip(inst, x, y);
		requestAnimationFrame(function () {
			t.style.opacity = '1';
			t.style.transform = 'translateY(0)';
		});
	}
	function positionTooltip(inst, x, y) {
		var t = inst.tooltipEl;
		if (!t) return;
		var pad = 14;
		var w = t.offsetWidth || 200;
		var h = t.offsetHeight || 80;
		var vw = window.innerWidth;
		var vh = window.innerHeight;
		var left = x + pad;
		var top = y + pad;
		if (left + w > vw - 8) left = x - w - pad;
		if (top + h > vh - 8) top = y - h - pad;
		if (left < 8) left = 8;
		if (top < 8) top = 8;
		t.style.left = left + 'px';
		t.style.top = top + 'px';
	}
	function hideTooltip(inst) {
		var t = inst.tooltipEl;
		if (!t) return;
		t.style.opacity = '0';
		t.style.transform = 'translateY(4px)';
		setTimeout(function () {
			if (t && t.style.opacity === '0') t.style.display = 'none';
		}, 140);
	}

	// ------------------------------------------------------------------
	// Three.js setup
	// ------------------------------------------------------------------
	function setupThree(inst) {
		var container = inst.container;
		var theme = getTheme();

		var wrapper = document.createElement('div');
		wrapper.className = 'cnn3d-canvas-wrapper';
		wrapper.style.cssText = [
			"position:relative",
			"width:100%",
			"height:600px",
			"border-radius:12px",
			"overflow:hidden",
			"background:" + (theme.dark ? "radial-gradient(ellipse at center, #14192e 0%, #05070f 80%)" : "radial-gradient(ellipse at center, #f8faff 0%, #dde4f2 80%)"),
			"box-shadow:" + (theme.dark ? "0 10px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(160,180,255,0.08)" : "0 10px 30px rgba(60,80,140,0.15), inset 0 0 0 1px rgba(60,80,140,0.08)")
		].join(";");
		container.appendChild(wrapper);
		inst.canvasWrapper = wrapper;

		// Overlay message element
		var overlay = document.createElement('div');
		overlay.className = 'cnn3d-overlay';
		overlay.style.cssText = [
			"position:absolute",
			"inset:0",
			"display:none",
			"align-items:center",
			"justify-content:center",
			"text-align:center",
			"padding:20px",
			"font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif",
			"font-size:15px",
			"font-weight:600",
			"pointer-events:none",
			"z-index:5",
			"color:" + theme.overlayFg,
			"background:" + theme.overlayBg,
			"backdrop-filter:blur(6px)",
			"-webkit-backdrop-filter:blur(6px)"
		].join(";");
		wrapper.appendChild(overlay);
		inst.overlayEl = overlay;

		var w = wrapper.clientWidth || 800;
		var h = wrapper.clientHeight || 600;

		inst.scene = new THREE.Scene();
		inst.scene.background = new THREE.Color(theme.background);

		inst.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 10000);
		inst.camera.position.set(150, 100, 300);

		inst.cameraTarget = new THREE.Vector3(0, 0, 0);

		inst.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		inst.renderer.setPixelRatio(window.devicePixelRatio || 1);
		inst.renderer.setSize(w, h);
		wrapper.appendChild(inst.renderer.domElement);

		var amb = new THREE.AmbientLight(0xffffff, 0.65);
		inst.scene.add(amb);
		var dir = new THREE.DirectionalLight(0xffffff, 0.75);
		dir.position.set(100, 200, 300);
		inst.scene.add(dir);
		var dir2 = new THREE.DirectionalLight(theme.dark ? 0x6688ff : 0xffddaa, 0.25);
		dir2.position.set(-150, -80, -200);
		inst.scene.add(dir2);

		inst.modelGroup = new THREE.Group();
		inst.scene.add(inst.modelGroup);

		inst.connectionsGroup = new THREE.Group();
		inst.scene.add(inst.connectionsGroup);

		// Raycaster for 3D hover
		inst.raycaster = new THREE.Raycaster();
		inst.mouseNDC = new THREE.Vector2();
		inst.hoverables = [];

		setupOrbitControls(inst);
		setup3DHover(inst);

		inst.resizeObserver = new ResizeObserver(function () {
			var W = wrapper.clientWidth, H = wrapper.clientHeight;
			if (W > 0 && H > 0) {
				inst.renderer.setSize(W, H);
				inst.camera.aspect = W / H;
				inst.camera.updateProjectionMatrix();
				scheduleRender(inst);
			}
		});
		inst.resizeObserver.observe(wrapper);

		inst.observer = new IntersectionObserver(function (entries) {
			for (var i = 0; i < entries.length; i++) {
				var wasVisible = inst.isVisible;
				inst.isVisible = entries[i].isIntersecting;
				if (inst.isVisible && !wasVisible) {
					if (inst.lastDarkMode !== !!global.is_dark_mode) {
						inst.lastHash = null;
						doRebuild(inst);
					} else if (inst.pendingRender) {
						inst.pendingRender = false;
						doRebuild(inst);
					}
					scheduleRender(inst);
				}
			}
		}, { threshold: 0.01 });
		inst.observer.observe(wrapper);

		startAnimationLoop(inst);
		startDarkModeWatcher(inst);
	}

	// ------------------------------------------------------------------
	// 3D hover (raycasting on hoverable meshes)
	// ------------------------------------------------------------------
	function setup3DHover(inst) {
		var dom = inst.renderer.domElement;
		inst._pointerMoveHandler = function (e) {
			var rect = dom.getBoundingClientRect();
			var x = e.clientX - rect.left;
			var y = e.clientY - rect.top;
			inst.mouseNDC.x = (x / rect.width) * 2 - 1;
			inst.mouseNDC.y = -(y / rect.height) * 2 + 1;

			if (!inst.hoverables || inst.hoverables.length === 0) {
				if (inst.lastHover) { inst.lastHover = null; hideTooltip(inst); }
				return;
			}
			inst.raycaster.setFromCamera(inst.mouseNDC, inst.camera);
			var meshes = inst.hoverables.map(function (h) { return h.mesh; });
			var hits = inst.raycaster.intersectObjects(meshes, false);
			if (hits.length > 0) {
				var hit = hits[0];
				var entry = inst.hoverables.find(function (h) { return h.mesh === hit.object; });
				if (entry) {
					if (inst.lastHover !== entry) {
						inst.lastHover = entry;
						showTooltip(inst, entry.html, e.clientX, e.clientY);
					} else {
						positionTooltip(inst, e.clientX, e.clientY);
					}
					dom.style.cursor = 'pointer';
					return;
				}
			}
			if (inst.lastHover) {
				inst.lastHover = null;
				hideTooltip(inst);
				dom.style.cursor = 'grab';
			}
		};
		inst._pointerLeaveHandler = function () {
			if (inst.lastHover) { inst.lastHover = null; hideTooltip(inst); }
			dom.style.cursor = 'grab';
		};
		dom.style.cursor = 'grab';
		dom.addEventListener('pointermove', inst._pointerMoveHandler);
		dom.addEventListener('pointerleave', inst._pointerLeaveHandler);
	}

	// ------------------------------------------------------------------
	// Dark mode watcher
	// ------------------------------------------------------------------
	function startDarkModeWatcher(inst) {
		inst.lastDarkMode = !!global.is_dark_mode;
		inst._darkModeInterval = setInterval(function () {
			var cur = !!global.is_dark_mode;
			if (cur !== inst.lastDarkMode) {
				inst.lastDarkMode = cur;
				var theme = getTheme();
				if (inst.canvasWrapper) {
					inst.canvasWrapper.style.background = theme.dark
						? "radial-gradient(ellipse at center, #14192e 0%, #05070f 80%)"
						: "radial-gradient(ellipse at center, #f8faff 0%, #dde4f2 80%)";
					inst.canvasWrapper.style.boxShadow = theme.dark
						? "0 10px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(160,180,255,0.08)"
						: "0 10px 30px rgba(60,80,140,0.15), inset 0 0 0 1px rgba(60,80,140,0.08)";
				}
				if (inst.scene) inst.scene.background = new THREE.Color(theme.background);
				if (inst.overlayEl) {
					inst.overlayEl.style.color = theme.overlayFg;
					inst.overlayEl.style.background = theme.overlayBg;
				}
				styleGUI(inst);
				inst.lastHash = null;
				if (inst.isVisible) {
					doRebuild(inst);
					scheduleRender(inst);
				} else {
					inst.pendingRender = true;
				}
			}
		}, 300);
	}

	// ------------------------------------------------------------------
	// Minimal orbit controls
	// ------------------------------------------------------------------
	function setupOrbitControls(inst) {
		var dom = inst.renderer.domElement;
		var state = { isDown: false, button: 0, lastX: 0, lastY: 0 };

		function updateSphericalFromCamera() {
			var offset = new THREE.Vector3().subVectors(inst.camera.position, inst.cameraTarget);
			var radius = offset.length();
			var theta = Math.atan2(offset.x, offset.z);
			var phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius)));
			inst.sphericalTarget = { radius: radius, theta: theta, phi: phi };
		}
		updateSphericalFromCamera();

		function applySpherical() {
			var s = inst.sphericalTarget;
			var sinPhi = Math.sin(s.phi);
			inst.camera.position.set(
				inst.cameraTarget.x + s.radius * sinPhi * Math.sin(s.theta),
				inst.cameraTarget.y + s.radius * Math.cos(s.phi),
				inst.cameraTarget.z + s.radius * sinPhi * Math.cos(s.theta)
			);
			inst.camera.lookAt(inst.cameraTarget);
			scheduleRender(inst);
		}

		dom.addEventListener('mousedown', function (e) {
			state.isDown = true; state.button = e.button;
			state.lastX = e.clientX; state.lastY = e.clientY;
			dom.style.cursor = 'grabbing';
			e.preventDefault();
		});
		window.addEventListener('mouseup', function () {
			state.isDown = false;
			if (dom) dom.style.cursor = inst.lastHover ? 'pointer' : 'grab';
		});
		window.addEventListener('mousemove', function (e) {
			if (!state.isDown) return;
			var dx = e.clientX - state.lastX;
			var dy = e.clientY - state.lastY;
			state.lastX = e.clientX; state.lastY = e.clientY;
			if (state.button === 0) {
				inst.sphericalTarget.theta -= dx * 0.005;
				inst.sphericalTarget.phi -= dy * 0.005;
				inst.sphericalTarget.phi = Math.max(0.05, Math.min(Math.PI - 0.05, inst.sphericalTarget.phi));
			} else if (state.button === 2 || state.button === 1) {
				var panSpeed = inst.sphericalTarget.radius * 0.0015;
				var right = new THREE.Vector3();
				var up = new THREE.Vector3();
				inst.camera.matrix.extractBasis(right, up, new THREE.Vector3());
				var panOffset = new THREE.Vector3()
					.addScaledVector(right, -dx * panSpeed)
					.addScaledVector(up, dy * panSpeed);
				inst.cameraTarget.add(panOffset);
			}
			applySpherical();
		});
		dom.addEventListener('wheel', function (e) {
			e.preventDefault();
			var factor = Math.pow(0.95, -e.deltaY * 0.01);
			inst.sphericalTarget.radius *= factor;
			inst.sphericalTarget.radius = Math.max(5, Math.min(5000, inst.sphericalTarget.radius));
			applySpherical();
		}, { passive: false });
		dom.addEventListener('contextmenu', function (e) { e.preventDefault(); });

		inst._applySpherical = applySpherical;
		inst._updateSphericalFromCamera = updateSphericalFromCamera;
	}

	function resetCamera(inst) {
		var box = new THREE.Box3().setFromObject(inst.modelGroup);
		if (box.isEmpty()) {
			inst.cameraTarget.set(0, 0, 0);
			inst.camera.position.set(150, 100, 300);
		} else {
			var center = box.getCenter(new THREE.Vector3());
			var size = box.getSize(new THREE.Vector3());
			var maxDim = Math.max(size.x, size.y, size.z);
			var dist = maxDim * 1.8;
			inst.cameraTarget.copy(center);
			inst.camera.position.set(center.x + dist * 0.6, center.y + dist * 0.4, center.z + dist);
		}
		inst.camera.lookAt(inst.cameraTarget);
		inst._updateSphericalFromCamera();
		inst._applySpherical();
	}

	// ------------------------------------------------------------------
	// Render loop
	// ------------------------------------------------------------------
	function startAnimationLoop(inst) {
		var dirty = true;
		inst._markDirty = function () { dirty = true; };
		function loop() {
			inst.animationHandle = requestAnimationFrame(loop);
			if (!inst.isVisible) return;
			if (!dirty) return;
			dirty = false;
			try { inst.renderer.render(inst.scene, inst.camera); }
			catch (e) { console.warn("[cnn3d.js] render error:", e); }
		}
		loop();
	}
	function scheduleRender(inst) { if (inst && inst._markDirty) inst._markDirty(); }

	// ------------------------------------------------------------------
	// Overlay message
	// ------------------------------------------------------------------
	function showOverlay(inst, msg) {
		if (!inst.overlayEl) return;
		inst.overlayEl.textContent = msg;
		inst.overlayEl.style.display = 'flex';
	}
	function hideOverlay(inst) {
		if (!inst.overlayEl) return;
		inst.overlayEl.style.display = 'none';
	}

	// ------------------------------------------------------------------
	// Clear / dispose
	// ------------------------------------------------------------------
	function clearModelGroup(inst) {
		// Also clear hoverables since meshes will be disposed
		inst.hoverables = [];
		inst.lastHover = null;
		hideTooltip(inst);

		var group = inst.modelGroup;
		while (group.children.length) {
			var child = group.children[0];
			group.remove(child);
			disposeObject(child);
		}
		var cg = inst.connectionsGroup;
		while (cg.children.length) {
			var c = cg.children[0];
			cg.remove(c);
			disposeObject(c);
		}
	}
	function disposeObject(obj) {
		var seenMats = new Set();
		var seenGeoms = new Set();
		obj.traverse(function (o) {
			if (o.geometry && !seenGeoms.has(o.geometry)) {
				seenGeoms.add(o.geometry);
				o.geometry.dispose();
			}
			if (o.material) {
				var mats = Array.isArray(o.material) ? o.material : [o.material];
				mats.forEach(function (m) {
					if (m && !seenMats.has(m)) {
						seenMats.add(m);
						disposeMaterial(m);
					}
				});
			}
		});
	}
	function disposeMaterial(m) {
		if (m.map) { try { m.map.dispose(); } catch (e) {} m.map = null; }
		try { m.dispose(); } catch (e) {}
	}

	// ------------------------------------------------------------------
	// Texture builders
	// ------------------------------------------------------------------
	// FIX for the "images disappear after moving threshold" bug:
	// Previously we relied on `alphaTest: 0.01`. When threshold hid many
	// pixels the texture memory was fine, but on some drivers the material
	// state (alphaTest + transparent + depthWrite:false combo) plus texture
	// re-uploads could result in the whole plane never re-appearing.
	// We now write full opaque alpha for kept pixels, drop alphaTest, and
	// force `texture.needsUpdate = true` on every rebuild path.
	function activationToRGBA(value, normVal, signedVal, threshold, opacity, cmap) {
		if (threshold > 0 && Math.abs(normVal) < threshold) return [0, 0, 0, 0];
		var rgb = (cmap === colormapSigned) ? cmap(signedVal) : cmap(normVal);
		return [
			Math.round(rgb[0] * 255),
			Math.round(rgb[1] * 255),
			Math.round(rgb[2] * 255),
			Math.round(opacity * 255)
		];
	}

	function buildChannelTexture(channelData, H, W, threshold, opacity, cmap, maxAbs) {
		var canvas = document.createElement('canvas');
		canvas.width = W; canvas.height = H;
		var ctx = canvas.getContext('2d');
		var imageData = ctx.createImageData(W, H);
		var data = imageData.data;
		var idx = 0;
		for (var y = 0; y < H; y++) {
			for (var x = 0; x < W; x++) {
				var v = channelData[y][x];
				var normVal = maxAbs > 0 ? Math.abs(v) / maxAbs : 0;
				var signedVal = maxAbs > 0 ? v / maxAbs : 0;
				var rgba = activationToRGBA(v, normVal, signedVal, threshold, opacity, cmap);
				data[idx++] = rgba[0]; data[idx++] = rgba[1];
				data[idx++] = rgba[2]; data[idx++] = rgba[3];
			}
		}
		ctx.putImageData(imageData, 0, 0);
		var tex = new THREE.CanvasTexture(canvas);
		tex.magFilter = THREE.NearestFilter;
		tex.minFilter = THREE.NearestFilter;
		tex.generateMipmaps = false;
		tex.needsUpdate = true;
		return tex;
	}

	function buildRGBImageTexture(imgData, H, W) {
		var canvas = document.createElement('canvas');
		canvas.width = W; canvas.height = H;
		var ctx = canvas.getContext('2d');
		var imageData = ctx.createImageData(W, H);
		var data = imageData.data;

		var maxV = -Infinity, minV = Infinity;
		for (var y = 0; y < H; y++) {
			for (var x = 0; x < W; x++) {
				for (var c = 0; c < 3; c++) {
					var v = imgData[y][x][c];
					if (typeof v !== "number" || !isFinite(v)) continue;
					if (v > maxV) maxV = v;
					if (v < minV) minV = v;
				}
			}
		}
		if (!isFinite(maxV) || !isFinite(minV)) { minV = 0; maxV = 1; }

		var scale, offset;
		if (maxV <= 1.5 && minV >= -1.5) {
			var range = (maxV - minV) || 1;
			scale = 255 / range;
			offset = -minV;
		} else {
			scale = 1;
			offset = 0;
		}

		var idx = 0;
		for (var y2 = 0; y2 < H; y2++) {
			for (var x2 = 0; x2 < W; x2++) {
				var r = (imgData[y2][x2][0] + offset) * scale;
				var g = (imgData[y2][x2][1] + offset) * scale;
				var b = (imgData[y2][x2][2] + offset) * scale;
				data[idx++] = Math.max(0, Math.min(255, Math.round(r)));
				data[idx++] = Math.max(0, Math.min(255, Math.round(g)));
				data[idx++] = Math.max(0, Math.min(255, Math.round(b)));
				data[idx++] = 255;
			}
		}
		ctx.putImageData(imageData, 0, 0);
		var tex = new THREE.CanvasTexture(canvas);
		tex.magFilter = THREE.NearestFilter;
		tex.minFilter = THREE.NearestFilter;
		tex.generateMipmaps = false;
		tex.needsUpdate = true;
		return tex;
	}

	// ------------------------------------------------------------------
	// Tooltip HTML helpers
	// ------------------------------------------------------------------
	function fmtNum(v, digits) {
		if (typeof v !== "number" || !isFinite(v)) return "—";
		digits = digits == null ? 4 : digits;
		if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.001 && v !== 0)) return v.toExponential(2);
		return v.toFixed(digits);
	}
	function tooltipHeader(title, subtitle) {
		var theme = getTheme();
		return ''
			+ '<div style="font-weight:700;font-size:13px;color:' + theme.tooltipAccent + ';margin-bottom:4px;letter-spacing:0.3px;">' + title + '</div>'
			+ (subtitle ? '<div style="font-size:11px;opacity:0.75;margin-bottom:6px;">' + subtitle + '</div>' : '');
	}
	function tooltipRow(label, value) {
		return ''
			+ '<div style="display:flex;justify-content:space-between;gap:12px;font-size:11.5px;line-height:1.5;">'
			+ '<span style="opacity:0.7;">' + label + '</span>'
			+ '<span style="font-variant-numeric:tabular-nums;font-weight:600;">' + value + '</span>'
			+ '</div>';
	}

	function makeLayerTooltipHTML(layer, extraStats) {
		var shapeStr = layer.outputShape ? layer.outputShape.filter(function (v) { return v !== null; }).join("×") : "?";
		var html = tooltipHeader(
			"L" + layer.idx + " · " + (layer.className || layer.kind),
			(layer.name || "") + " · shape [" + shapeStr + "]"
		);
		if (extraStats) {
			html += tooltipRow("Elements", extraStats.count);
			html += tooltipRow("Min", fmtNum(extraStats.min));
			html += tooltipRow("Max", fmtNum(extraStats.max));
			html += tooltipRow("|Max|", fmtNum(extraStats.maxAbs));
			html += tooltipRow("Mean", fmtNum(extraStats.mean));
			html += tooltipRow("Std", fmtNum(extraStats.std));
			if (extraStats.aboveFrac != null) {
				html += tooltipRow("Above threshold", (extraStats.aboveFrac * 100).toFixed(1) + "%");
			}
		}
		return html;
	}

	function makeChannelTooltipHTML(layer, channelIdx, channelData, maxAbs, threshold) {
		var flat = flattenDeep(channelData);
		var mm = minMaxAbs(flat);
		var ms = meanStd(flat);
		var af = fracAbove(flat, threshold * maxAbs);
		var html = tooltipHeader(
			"L" + layer.idx + " · channel " + channelIdx,
			(layer.className || layer.kind) + " · slice " + channelIdx
		);
		html += tooltipRow("Size", channelData.length + "×" + channelData[0].length);
		html += tooltipRow("Min", fmtNum(mm.min));
		html += tooltipRow("Max", fmtNum(mm.max));
		html += tooltipRow("|Max|", fmtNum(mm.maxAbs));
		html += tooltipRow("Mean", fmtNum(ms.mean));
		html += tooltipRow("Std", fmtNum(ms.std));
		html += tooltipRow("Active pixels", (af * 100).toFixed(1) + "%");
		return html;
	}

	function makeInputImageTooltipHTML(imgShape, stats) {
		var html = tooltipHeader("Input image", imgShape[0] + "×" + imgShape[1] + " · RGB");
		html += tooltipRow("Pixels", imgShape[0] * imgShape[1]);
		html += tooltipRow("Min", fmtNum(stats.min));
		html += tooltipRow("Max", fmtNum(stats.max));
		html += tooltipRow("Mean", fmtNum(stats.mean));
		return html;
	}

	// ------------------------------------------------------------------
	// Layer block builders
	// ------------------------------------------------------------------
	function buildConv2DBlock(layer, opts, theme, hoverables) {
		var group = new THREE.Group();
		group.name = "conv2d_layer_" + layer.idx;

		var act = layer.activation;
		if (!act) return null;
		var shape = safeShape(act);
		if (shape.length !== 3) return null;
		var H = shape[0], W = shape[1], C = shape[2];

		var flat = flattenDeep(act);
		var mm = minMaxAbs(flat);
		var ms = meanStd(flat);
		var maxAbs = mm.maxAbs;
		if (!maxAbs || !isFinite(maxAbs) || maxAbs < 1e-8) maxAbs = 1;

		var threshold = (opts.perLayerThresholds[layer.idx] !== undefined)
			? opts.perLayerThresholds[layer.idx] : opts.threshold;
		var cmap = getColormapFunc(opts.colormap);

		var pxSize = opts.pixelSize;
		var planeW = W * pxSize;
		var planeH = H * pxSize;
		var sliceGap = opts.sliceGap;
		var totalDepth = Math.max(0.1, (C - 1) * sliceGap);

		for (var c = 0; c < C; c++) {
			var channelData = new Array(H);
			for (var y = 0; y < H; y++) {
				channelData[y] = new Array(W);
				for (var x = 0; x < W; x++) channelData[y][x] = act[y][x][c];
			}
			var texture = buildChannelTexture(channelData, H, W, threshold, opts.opacity, cmap, maxAbs);
			var geometry = new THREE.PlaneGeometry(planeW, planeH);
			// FIX: dropped alphaTest so slider recoveries always show pixels again.
			// Kept transparent+depthWrite:false for correct blending, but with
			// full-opacity alpha for kept pixels the image is always visible.
			var material = new THREE.MeshBasicMaterial({
				map: texture,
				transparent: true,
				side: THREE.DoubleSide,
				depthWrite: false
			});
			var mesh = new THREE.Mesh(geometry, material);
			mesh.position.z = -totalDepth / 2 + c * sliceGap;
			group.add(mesh);

			if (hoverables) {
				hoverables.push({
					mesh: mesh,
					html: makeChannelTooltipHTML(layer, c, channelData, maxAbs, threshold)
				});
			}
		}

		var boxGeom = new THREE.BoxGeometry(planeW, planeH, totalDepth);
		var edges = new THREE.EdgesGeometry(boxGeom);
		var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
			color: theme.gridEdge, transparent: true, opacity: 0.5
		}));
		group.add(line);
		boxGeom.dispose();

		// Layer-wide invisible hover proxy (bounding box) — so that hovering on
		// the wireframe or between slices still yields useful info.
		var proxyGeom = new THREE.BoxGeometry(planeW, planeH, Math.max(totalDepth, 1));
		var proxyMat = new THREE.MeshBasicMaterial({ visible: false, transparent: true, opacity: 0 });
		var proxy = new THREE.Mesh(proxyGeom, proxyMat);
		proxy.renderOrder = -1;
		group.add(proxy);
		if (hoverables) {
			hoverables.push({
				mesh: proxy,
				html: makeLayerTooltipHTML(layer, {
					count: flat.length,
					min: mm.min, max: mm.max, maxAbs: mm.maxAbs,
					mean: ms.mean, std: ms.std,
					aboveFrac: fracAbove(flat, threshold * maxAbs)
				})
			});
		}

		return { group: group, size: new THREE.Vector3(planeW, planeH, totalDepth), kind: 'conv2d' };
	}

	function buildDenseBlock(layer, opts, theme, hoverables) {
		var group = new THREE.Group();
		group.name = "dense_layer_" + layer.idx;

		var act = layer.activation;
		if (!act) return null;

		var vec = Array.isArray(act[0]) ? flattenDeep(act) : act;
		var N = vec.length;
		if (N === 0) return null;

		var mm = minMaxAbs(vec);
		var ms = meanStd(vec);
		var maxAbs = mm.maxAbs;
		if (!maxAbs || !isFinite(maxAbs) || maxAbs < 1e-8) maxAbs = 1;

		var threshold = (opts.perLayerThresholds[layer.idx] !== undefined)
			? opts.perLayerThresholds[layer.idx] : opts.threshold;
		var cmap = getColormapFunc(opts.colormap);

		var pxSize = opts.pixelSize;
		var colWidth = Math.max(2, 4 * pxSize);
		var colDepth = Math.max(2, 4 * pxSize);
		var desiredHeight = N * pxSize;
		var MAX_H = 200, MIN_H = 20;
		var colHeight = Math.max(MIN_H, Math.min(desiredHeight, MAX_H));

		var texW = 4;
		var canvas = document.createElement('canvas');
		canvas.width = texW; canvas.height = N;
		var ctx = canvas.getContext('2d');
		var imageData = ctx.createImageData(texW, N);
		var data = imageData.data;
		for (var i = 0; i < N; i++) {
			var v = vec[i];
			var normVal = maxAbs > 0 ? Math.abs(v) / maxAbs : 0;
			var signedVal = maxAbs > 0 ? v / maxAbs : 0;
			var rgba = activationToRGBA(v, normVal, signedVal, threshold, opts.opacity, cmap);
			for (var xx = 0; xx < texW; xx++) {
				var p = (i * texW + xx) * 4;
				data[p] = rgba[0]; data[p+1] = rgba[1]; data[p+2] = rgba[2]; data[p+3] = rgba[3];
			}
		}
		ctx.putImageData(imageData, 0, 0);
		var texture = new THREE.CanvasTexture(canvas);
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.NearestFilter;
		texture.generateMipmaps = false;
		texture.needsUpdate = true;

		// FIX: dropped alphaTest (same rationale as conv2d planes).
		var mat = new THREE.MeshBasicMaterial({
			map: texture,
			transparent: true,
			side: THREE.DoubleSide,
			depthWrite: false
		});

		var geomFB = new THREE.PlaneGeometry(colWidth, colHeight);
		var front = new THREE.Mesh(geomFB, mat);
		front.position.z = colDepth / 2;
		group.add(front);
		var back = new THREE.Mesh(geomFB, mat);
		back.position.z = -colDepth / 2;
		back.rotation.y = Math.PI;
		group.add(back);

		var geomLR = new THREE.PlaneGeometry(colDepth, colHeight);
		var left = new THREE.Mesh(geomLR, mat);
		left.position.x = -colWidth / 2;
		left.rotation.y = -Math.PI / 2;
		group.add(left);
		var right = new THREE.Mesh(geomLR, mat);
		right.position.x = colWidth / 2;
		right.rotation.y = Math.PI / 2;
		group.add(right);

		var boxGeom = new THREE.BoxGeometry(colWidth, colHeight, colDepth);
		var edges = new THREE.EdgesGeometry(boxGeom);
		var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
			color: theme.denseEdge, transparent: true, opacity: 0.6
		}));
		group.add(line);
		boxGeom.dispose();

		// Hover proxy over the whole dense column
		if (hoverables) {
			var proxyGeom = new THREE.BoxGeometry(colWidth * 1.01, colHeight * 1.01, colDepth * 1.01);
			var proxyMat = new THREE.MeshBasicMaterial({ visible: false, transparent: true, opacity: 0 });
			var proxy = new THREE.Mesh(proxyGeom, proxyMat);
			group.add(proxy);
			hoverables.push({
				mesh: proxy,
				html: makeLayerTooltipHTML(layer, {
					count: N,
					min: mm.min, max: mm.max, maxAbs: mm.maxAbs,
					mean: ms.mean, std: ms.std,
					aboveFrac: fracAbove(vec, threshold * maxAbs)
				})
			});
		}

		return {
			group: group,
			size: new THREE.Vector3(colWidth, colHeight, colDepth),
			unitCount: N,
			kind: 'dense'
		};
	}

	function buildInputImageMesh(state, opts, hoverables) {
		if (!state.inputImage) return null;
		var img = state.inputImage;
		var H = img.shape[0], W = img.shape[1];
		var tex = buildRGBImageTexture(img.data, H, W);
		var pxSize = opts.pixelSize;
		var pw = W * pxSize;
		var ph = H * pxSize;
		var geom = new THREE.PlaneGeometry(pw, ph);
		var mat = new THREE.MeshBasicMaterial({
			map: tex, side: THREE.DoubleSide, transparent: false
		});
		var mesh = new THREE.Mesh(geom, mat);
		mesh.name = "input_image";

		// Add hover proxy for the input image
		if (hoverables) {
			var flatImg = flattenDeep(state.inputImage.data);
			var ms = meanStd(flatImg);
			var mmImg = minMaxAbs(flatImg);
			hoverables.push({
				mesh: mesh,
				html: makeInputImageTooltipHTML(img.shape, {
					min: mmImg.min, max: mmImg.max, mean: ms.mean
				})
			});
		}

		return { mesh: mesh, size: new THREE.Vector3(pw, ph, 0.1) };
	}

	// ------------------------------------------------------------------
	// Connections — draw between EVERY consecutive pair of visualized blocks,
	// attaching to correct face centers along X.
	// ------------------------------------------------------------------
	function buildConnectionLines(blockA, blockB, opts) {
		if (!opts.showConnections) return null;

		var nA, nB;
		if (blockA.kind === 'dense') nA = blockA.unitCount;
		else nA = null;
		if (blockB.kind === 'dense') nB = blockB.unitCount;
		else nB = null;

		var MAX_SAMPLES_PER_SIDE = 64;

		function sampleCountForBlock(block) {
			if (block.kind === 'dense') {
				return Math.min(block.unitCount, MAX_SAMPLES_PER_SIDE);
			}
			return Math.min(16, MAX_SAMPLES_PER_SIDE);
		}
		var sA = sampleCountForBlock(blockA);
		var sB = sampleCountForBlock(blockB);
		if (sA <= 0 || sB <= 0) return null;

		var aWorld = new THREE.Vector3();
		var bWorld = new THREE.Vector3();
		blockA.group.getWorldPosition(aWorld);
		blockB.group.getWorldPosition(bWorld);

		function faceExtentsForBlock(block) {
			var sz = block.size;
			if (block.kind === 'conv2d') {
				return { halfX: sz.z / 2, halfY: sz.y / 2, halfZ: sz.x / 2 };
			}
			return { halfX: sz.x / 2, halfY: sz.y / 2, halfZ: sz.z / 2 };
		}
		var faA = faceExtentsForBlock(blockA);
		var faB = faceExtentsForBlock(blockB);

		var aX = aWorld.x + faA.halfX;
		var bX = bWorld.x - faB.halfX;

		function makeFaceSamples(block, count, worldPos, fe) {
			var pts = [];
			if (block.kind === 'dense') {
				var top = worldPos.y - fe.halfY;
				var step = (fe.halfY * 2) / Math.max(1, count - 1);
				for (var i = 0; i < count; i++) {
					pts.push(new THREE.Vector3(0, top + i * step, worldPos.z));
				}
			} else {
				var g = Math.max(1, Math.round(Math.sqrt(count)));
				var stepY = (fe.halfY * 2) / Math.max(1, g - 1);
				var stepZ = (fe.halfZ * 2) / Math.max(1, g - 1);
				for (var iy = 0; iy < g; iy++) {
					for (var iz = 0; iz < g; iz++) {
						var yy = worldPos.y - fe.halfY + iy * stepY;
						var zz = worldPos.z - fe.halfZ + iz * stepZ;
						pts.push(new THREE.Vector3(0, yy, zz));
					}
				}
			}
			return pts;
		}

		var ptsA = makeFaceSamples(blockA, sA, aWorld, faA);
		var ptsB = makeFaceSamples(blockB, sB, bWorld, faB);

		var weights = null;
		if (blockB.kind === 'dense') {
			try {
				var layerB_idx = null;
				var mName = blockB.group.name || "";
				var m = mName.match(/_layer_(\d+)$/);
				if (m) layerB_idx = parseInt(m[1], 10);
				if (layerB_idx !== null && typeof model !== "undefined" && model && model.layers && model.layers[layerB_idx]) {
					var w = model.layers[layerB_idx].weights;
					if (w && w.length > 0 && w[0].val) {
						weights = w[0].val.dataSync();
					}
				}
			} catch (e) { weights = null; }
		}

		var wMin = 0, wMax = 1;
		if (weights) {
			wMin = Infinity; wMax = -Infinity;
			for (var wi = 0; wi < weights.length; wi++) {
				if (weights[wi] < wMin) wMin = weights[wi];
				if (weights[wi] > wMax) wMax = weights[wi];
			}
			if (wMin === wMax) { wMin -= 0.001; wMax += 0.001; }
		}

		var MAX_LINES = 2000;
		var totalLines = ptsA.length * ptsB.length;
		var strideA = 1, strideB = 1;
		if (totalLines > MAX_LINES) {
			var ratio = Math.sqrt(totalLines / MAX_LINES);
			strideA = Math.max(1, Math.ceil(ratio));
			strideB = Math.max(1, Math.ceil(ratio));
		}

		var positions = [];
		var colors = [];

		var theme = getTheme();
		var baseCol = theme.dark ? [0.75, 0.78, 0.85] : [0.30, 0.35, 0.55];

		for (var i2 = 0; i2 < ptsA.length; i2 += strideA) {
			var a = ptsA[i2];
			for (var j2 = 0; j2 < ptsB.length; j2 += strideB) {
				var b = ptsB[j2];
				positions.push(aX, a.y, a.z);
				positions.push(bX, b.y, b.z);

				var col = baseCol;
				if (weights && blockA.kind === 'dense' && blockB.kind === 'dense') {
					var nB_full = blockB.unitCount;
					var idx = i2 * nB_full + j2;
					if (idx >= 0 && idx < weights.length) {
						var wv = weights[idx];
						if (wv >= 0) {
							var t = (wv - Math.max(0, wMin)) / (wMax - Math.max(0, wMin) || 1);
							col = [0.25, 0.4 + Math.min(1, t) * 0.55, 1.0];
						} else {
							var tn = (-wv) / (Math.abs(wMin) || 1);
							col = [1.0, 0.4 + Math.min(1, tn) * 0.5, 0.3];
						}
					}
				}
				colors.push(col[0], col[1], col[2]);
				colors.push(col[0], col[1], col[2]);
			}
		}

		if (positions.length === 0) return null;

		var geom = new THREE.BufferGeometry();
		geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
		geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
		var mat = new THREE.LineBasicMaterial({
			vertexColors: true,
			transparent: true,
			opacity: theme.dark ? 0.5 : 0.35,
			depthWrite: false
		});
		var lines = new THREE.LineSegments(geom, mat);
		lines.name = "connections_" + blockA.group.name + "_to_" + blockB.group.name;
		return lines;
	}

	// ------------------------------------------------------------------
	// Assemble the full visualization
	// ------------------------------------------------------------------
	function doRebuild(inst) {
		var state = readModelState();
		var theme = getTheme();
		inst.lastDarkMode = theme.dark;

		if (!inst._lastLayerCount || inst._lastLayerCount !== state.layers.length) {
			inst._lastLayerCount = state.layers.length;
			rebuildPerLayerControls(inst, state);
		}

		if (!state.modelPresent) {
			clearModelGroup(inst);
			showOverlay(inst, "No model loaded.");
			scheduleRender(inst);
			return;
		}
		if (state.layers.length === 0) {
			clearModelGroup(inst);
			showOverlay(inst, "No visualizable layers (need Conv2D or Dense).");
			scheduleRender(inst);
			return;
		}
		if (!state.hasAnyActivation) {
			clearModelGroup(inst);
			showOverlay(inst, "Predict an image first — nothing to visualize yet.");
			scheduleRender(inst);
			return;
		}
		hideOverlay(inst);

		// Hash-based no-op skip
		if (inst.opts.autoUpdateHash) {
			var newHash = buildStateHash(state, inst.opts, theme);
			if (newHash === inst.lastHash) return;
			inst.lastHash = newHash;
		}

		// Clear old meshes (this also clears hoverables)
		clearModelGroup(inst);
		inst.scene.background = new THREE.Color(theme.background);

		var blocks = [];
		var currentX = 0;
		var hoverables = inst.hoverables; // was reset to [] inside clearModelGroup

		// Input image plane
		if (inst.opts.showInputImage && state.inputImage) {
			var imgInfo = buildInputImageMesh(state, inst.opts, hoverables);
			if (imgInfo) {
				imgInfo.mesh.position.set(currentX, 0, 0);
				imgInfo.mesh.rotation.y = Math.PI / 2;
				inst.modelGroup.add(imgInfo.mesh);
				currentX += Math.max(20, inst.opts.layerGap * 0.6);
			}
		}

		for (var i = 0; i < state.layers.length; i++) {
			var L = state.layers[i];
			var built = null;

			if (L.kind === "conv2d") {
				built = buildConv2DBlock(L, inst.opts, theme, hoverables);
			} else if (L.kind === "dense" || L.kind === "flatten") {
				built = buildDenseBlock(L, inst.opts, theme, hoverables);
			}
			if (!built) continue;

			built.group.position.set(currentX, 0, 0);
			if (built.kind === "conv2d") {
				built.group.rotation.y = Math.PI / 2;
			}
			inst.modelGroup.add(built.group);

			blocks.push({
				layer: L,
				group: built.group,
				size: built.size,
				kind: built.kind,
				unitCount: built.unitCount || null
			});

			var advance;
			if (built.kind === "conv2d") advance = built.size.z;
			else advance = built.size.x;
			currentX += Math.max(advance, 10) + inst.opts.layerGap;
		}

		inst.modelGroup.updateMatrixWorld(true);

		if (inst.opts.showConnections) {
			for (var k = 0; k < blocks.length - 1; k++) {
				var connLines = buildConnectionLines(blocks[k], blocks[k + 1], inst.opts);
				if (connLines) inst.connectionsGroup.add(connLines);
			}
		}

		// Center on origin
		var box = new THREE.Box3().setFromObject(inst.modelGroup);
		if (!box.isEmpty()) {
			var center = box.getCenter(new THREE.Vector3());
			inst.modelGroup.position.x -= center.x;
			inst.modelGroup.position.y -= center.y;
			inst.modelGroup.position.z -= center.z;
			inst.connectionsGroup.position.copy(inst.modelGroup.position);
		}

		if (!inst._hasFramed) {
			resetCamera(inst);
			inst._hasFramed = true;
		}

		scheduleRender(inst);
	}

	// ------------------------------------------------------------------
	// Debounced rebuild scheduling
	// ------------------------------------------------------------------
	function scheduleRebuild(inst) {
		if (!inst.isVisible) {
			inst.pendingRender = true;
			return;
		}
		if (inst._rebuildTimer) return;
		inst._rebuildTimer = requestAnimationFrame(function () {
			inst._rebuildTimer = null;
			doRebuild(inst);
		});
	}

	// ------------------------------------------------------------------
	// Public API
	// ------------------------------------------------------------------
	function resolveContainer(divOrId) {
		if (!divOrId) return null;
		if (typeof divOrId === "string") {
			var el = document.getElementById(divOrId);
			return el || null;
		}
		if (divOrId instanceof HTMLElement) return divOrId;
		return null;
	}

	function render(divOrId, options) {
		var container = resolveContainer(divOrId);
		if (!container) {
			console.error("[cnn3d.js] render(): could not resolve container:", divOrId);
			return null;
		}

		var inst = INSTANCES.get(container);
		if (!inst) {
			inst = createInstance(container);
			INSTANCES.set(container, inst);
			if (options) Object.assign(inst.opts, options);
			setupThree(inst);
			ensureGUI(inst);
			requestAnimationFrame(function () {
				inst.isVisible = true;
				doRebuild(inst);
				scheduleRender(inst);
			});
		} else {
			if (options) {
				Object.assign(inst.opts, options);
				syncGUIFromOpts(inst);
			}
			scheduleRebuild(inst);
		}
		return inst;
	}

	function syncGUIFromOpts(inst) {
		if (!inst.guiEl) return;
		var g = inst.guiEl;
		var setRange = function (role, val, formatFn) {
			var input = g.querySelector('[data-role="' + role + '"]');
			var lab = g.querySelector('[data-role="' + role + '-label"]');
			if (input) input.value = val;
			if (lab && formatFn) lab.textContent = formatFn(val);
		};
		setRange('th', inst.opts.threshold, function (v) { return v.toFixed(3); });
		setRange('sg', inst.opts.sliceGap,  function (v) { return v.toFixed(1); });
		setRange('lg', inst.opts.layerGap,  function (v) { return v.toFixed(0); });
		setRange('px', inst.opts.pixelSize, function (v) { return v.toFixed(1); });
		setRange('op', inst.opts.opacity,   function (v) { return v.toFixed(2); });
		var cm = g.querySelector('[data-role="cm"]'); if (cm) cm.value = inst.opts.colormap;
		var sc = g.querySelector('[data-role="sc"]'); if (sc) sc.checked = !!inst.opts.showConnections;
		var si = g.querySelector('[data-role="si"]'); if (si) si.checked = !!inst.opts.showInputImage;
	}

	function destroy(divOrId) {
		var container = resolveContainer(divOrId);
		if (!container) return;
		var inst = INSTANCES.get(container);
		if (!inst) return;

		if (inst.animationHandle) cancelAnimationFrame(inst.animationHandle);
		if (inst._rebuildTimer) cancelAnimationFrame(inst._rebuildTimer);
		if (inst._darkModeInterval) clearInterval(inst._darkModeInterval);
		if (inst.observer) inst.observer.disconnect();
		if (inst.resizeObserver) inst.resizeObserver.disconnect();

		// Remove pointer listeners
		if (inst.renderer && inst.renderer.domElement) {
			if (inst._pointerMoveHandler) inst.renderer.domElement.removeEventListener('pointermove', inst._pointerMoveHandler);
			if (inst._pointerLeaveHandler) inst.renderer.domElement.removeEventListener('pointerleave', inst._pointerLeaveHandler);
		}

		clearModelGroup(inst);
		if (inst.renderer) {
			inst.renderer.dispose();
			if (inst.renderer.domElement && inst.renderer.domElement.parentNode) {
				inst.renderer.domElement.parentNode.removeChild(inst.renderer.domElement);
			}
		}
		if (inst.canvasWrapper && inst.canvasWrapper.parentNode) {
			inst.canvasWrapper.parentNode.removeChild(inst.canvasWrapper);
		}
		if (inst.guiEl && inst.guiEl.parentNode) {
			inst.guiEl.parentNode.removeChild(inst.guiEl);
		}
		if (inst.tooltipEl && inst.tooltipEl.parentNode) {
			inst.tooltipEl.parentNode.removeChild(inst.tooltipEl);
		}
		INSTANCES.delete(container);
	}

	function forceRender(divOrId) {
		var container = resolveContainer(divOrId);
		if (!container) return;
		var inst = INSTANCES.get(container);
		if (!inst) return;
		inst.lastHash = null;
		scheduleRebuild(inst);
	}

	// ------------------------------------------------------------------
	// Expose
	// ------------------------------------------------------------------
	global.CNN3D = {
		render: render,
		destroy: destroy,
		forceRender: forceRender,
		_instances: INSTANCES
	};

})(window);
