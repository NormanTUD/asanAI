"use strict";

// ============================================================
// REPRESENTATION ANALYSIS
//  1) CKA heatmap - how similar are the internal
//     representations of all layers (linear CKA)?
//  2) Separability curves - how linearly separable are
//     the classes at each layer?
// ============================================================

var RepresentationAnalysis = (function () {

	var _inited = false;
	var _running = false;
	var _lastZ = null;
	var _lastNames = null;
	var _lastSep = null;

	function _L(key) {
		try {
			return language[lang][key] || key;
		} catch (e) {
			return key;
		}
	}

	function _injectStyles() {
		if (document.getElementById("rep_styles")) return;

		var style = document.createElement("style");
		style.id = "rep_styles";
		style.textContent =
			".rep_wrapper { padding: 16px 20px; max-width: 980px; margin: 0 auto; }" +
			".rep_header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }" +
			".rep_icon { font-size: 1.5em; }" +
			".rep_title { font-size: 1.25em; font-weight: 700; }" +
			".rep_desc { font-size: 0.85em; opacity: 0.75; margin-bottom: 14px; line-height: 1.45; }" +
			".rep_panel { border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; border: 1px solid var(--rep-border, rgba(90,110,180,0.25)); }" +
			".rep_row { display: flex; flex-wrap: wrap; gap: 14px 22px; align-items: center; margin-bottom: 10px; }" +
			".rep_row label { font-size: 0.85em; opacity: 0.85; }" +
			".rep_btn { cursor: pointer; padding: 6px 16px; border-radius: 8px; border: 1px solid var(--rep-border, rgba(90,110,180,0.35)); font-size: 0.95em; }" +
			".rep_btn:disabled { opacity: 0.45; cursor: default; }" +
			".rep_status { font-size: 0.85em; opacity: 0.8; margin-top: 6px; min-height: 1.2em; }" +
			".rep_section_title { font-size: 1em; font-weight: 700; margin: 4px 0 2px 0; }" +
			".rep_section_hint { font-size: 0.8em; opacity: 0.7; margin-bottom: 8px; line-height: 1.4; }" +
			".rep_plot { width: 100%; min-height: 380px; }" +
			".rep_plot_tall { width: 100%; min-height: 340px; }" +
			".rep_empty { padding: 30px; text-align: center; opacity: 0.7; font-size: 0.95em; line-height: 1.6; }" +
			".rep_spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(128,128,128,0.3); border-top-color: #7c8cf8; border-radius: 50%; animation: rep_spin 0.8s linear infinite; vertical-align: -2px; margin-right: 8px; }" +
			"@keyframes rep_spin { to { transform: rotate(360deg); } }";

		document.head.appendChild(style);
	}

	function _applyThemeVars() {
		var tc = ExplainabilityLib.themeColors();
		document.documentElement.style.setProperty("--rep-border", tc.panelBorder);
	}

	function _buildUI(containerId) {
		var container = document.getElementById(containerId);
		if (!container) return;

		_inited = true;
		container.innerHTML =
			'<div class="rep_wrapper">' +
			'	<div class="rep_header">' +
			'		<span class="rep_icon">🧬</span>' +
			'		<span class="rep_title"><span class="TRANSLATEME_representation"></span></span>' +
			'	</div>' +
			'	<div class="rep_desc"><span class="TRANSLATEME_representation_desc"></span></div>' +
			'	<div class="rep_panel" id="rep_controls_panel">' +
			'		<div class="rep_row">' +
			'			<label><span class="TRANSLATEME_rep_sample_size"></span></label>' +
			'			<input type="number" id="rep_sample_size" value="64" min="8" max="512" style="width:70px">' +
			'			<button class="rep_btn" id="rep_analyze_btn" onclick="RepresentationAnalysis.runFromUI()"><span class="TRANSLATEME_rep_analyze"></span></button>' +
			'		</div>' +
			'		<div class="rep_status" id="rep_status"></div>' +
			'	</div>' +
			'	<div class="rep_panel">' +
			'		<div class="rep_section_title"><span class="TRANSLATEME_rep_cka_title"></span></div>' +
			'		<div class="rep_section_hint"><span class="TRANSLATEME_rep_cka_hint"></span></div>' +
			'		<div class="rep_plot" id="rep_cka_plot"></div>' +
			'	</div>' +
			'	<div class="rep_panel" id="rep_sep_panel" style="display:none">' +
			'		<div class="rep_section_title"><span class="TRANSLATEME_rep_sep_title"></span></div>' +
			'		<div class="rep_section_hint"><span class="TRANSLATEME_rep_sep_hint"></span></div>' +
			'		<div class="rep_plot_tall" id="rep_sep_plot"></div>' +
			'	</div>' +
			'	<div class="rep_empty" id="rep_empty" style="display:none"><span class="TRANSLATEME_rep_needs_model"></span></div>' +
			'</div>';

		_applyThemeVars();
		_updateGating();

		ExplainabilityLib.onThemeChange(function () {
			_applyThemeVars();
			_redraw();
		});
	}

	function _updateGating() {
		var empty = document.getElementById("rep_empty");
		var controls = document.getElementById("rep_controls_panel");
		var sepPanel = document.getElementById("rep_sep_panel");
		var m = ExplainabilityLib.getModel();

		if (!m) {
			if (empty) empty.style.display = "block";
			if (controls) controls.style.display = "none";
			return;
		}

		if (empty) empty.style.display = "none";
		if (controls) controls.style.display = "block";

		if (sepPanel) {
			sepPanel.style.display = ExplainabilityLib.isClassification() ? "block" : "none";
		}
	}

	async function _analyze() {
		var m = ExplainabilityLib.getModel();
		if (!m) return null;

		var sampleSize = 64;

		try {
			var el = document.getElementById("rep_sample_size");
			if (el) sampleSize = Math.max(8, Math.min(512, parseInt(el.value, 10) || 64));
		} catch (e) { /* default */ }

		var xy = await ExplainabilityLib.getXy();
		if (!xy || !xy.x) return null;

		var batch = ExplainabilityLib.subsampleBatch(xy.x, xy.y, sampleSize);
		var captured = ExplainabilityLib.captureLayerActivations(batch.x);

		if (!captured || captured.acts.length === 0) {
			batch.x.dispose();
			if (batch.y) batch.y.dispose();
			return null;
		}

		var acts2d = [];
		var owned = [];

		for (var i = 0; i < captured.acts.length; i++) {
			owned.push(captured.acts[i]);
			acts2d.push(ExplainabilityLib.flatten2d(captured.acts[i]));
		}

		var z = ExplainabilityLib.ckaMatrix(acts2d);

		var sep = null;

		if (ExplainabilityLib.isClassification() && xy.y) {
			var yoh = ExplainabilityLib.toOneHotY(xy.y, ExplainabilityLib.numClasses());
			var perLayer = [];

			for (i = 0; i < acts2d.length; i++) {
				var s = ExplainabilityLib.classSeparability(acts2d[i], yoh);
				perLayer.push({ score: s.score, perClass: s.perClass });
			}

			sep = perLayer;

			if (yoh !== xy.y) {
				try { yoh.dispose(); } catch (e) { /* gone */ }
			}
		}

		var names = captured.names.slice(0, captured.acts.length);

		for (i = 0; i < owned.length; i++) {
			try { owned[i].dispose(); } catch (e) { /* gone */ }
		}

		batch.x.dispose();
		if (batch.y) batch.y.dispose();

		return { z: z, names: names, sep: sep };
	}

	function _redraw() {
		if (!_lastZ || !_lastNames) return;

		ExplainabilityLib.plotHeatmap(
			"rep_cka_plot",
			_lastZ,
			_lastNames,
			_lastNames.slice().reverse(),
			{
				hovertemplate: "%{x}<br>%{y}<br>CKA: %{z:.3f}<extra></extra>",
				xtitle: _L("rep_layer_axis"),
				ytitle: _L("rep_layer_axis")
			}
		);

		if (_lastSep) {
			_redrawSeparability();
		}
	}

	function _redrawSeparability() {
		if (!_lastSep || !_lastNames) return;

		var div = document.getElementById("rep_sep_plot");
		if (!div) return;

		var tc = ExplainabilityLib.themeColors();
		var nC = _lastSep[0].perClass.length;
		var colors = ExplainabilityLib.classLabelColors(Math.max(nC, 1));
		var traces = [];
		var avg = [];

		for (var i = 0; i < _lastSep.length; i++) {
			avg.push(_lastSep[i].score);
		}

		for (var c = 0; c < nC; c++) {
			var ys = [];

			for (i = 0; i < _lastSep.length; i++) {
				ys.push(_lastSep[i].perClass[c]);
			}

			traces.push({
				x: _lastNames,
				y: ys,
				mode: "lines+markers",
				name: _L("adv_class") + " " + c,
				line: { color: colors[c % colors.length], width: 1.5, dash: "dot" },
				opacity: 0.75
			});
		}

		traces.push({
			x: _lastNames,
			y: avg,
			mode: "lines+markers",
			name: _L("rep_avg"),
			line: { color: "#7c8cf8", width: 3 },
			marker: { size: 7 }
		});

		Plotly.react(div, traces, ExplainabilityLib.baseLayout({
			margin: { t: 10, b: 90, l: 60, r: 20 },
			xaxis: { gridcolor: tc.grid, tickangle: -45, automargin: true, title: _L("rep_layer_axis") },
			yaxis: { gridcolor: tc.grid, title: _L("rep_sep_axis"), automargin: true },
			showlegend: true,
			legend: { orientation: "h", y: -0.25 }
		}), { responsive: true });
	}

	async function runFromUI() {
		if (_running) return;

		_running = true;
		var status = document.getElementById("rep_status");
		var btn = document.getElementById("rep_analyze_btn");

		if (btn) btn.disabled = true;
		if (status) status.innerHTML = '<span class="rep_spinner"></span>' + _L("rep_running");

		try {
			var res = await _analyze();

			if (res) {
				_lastZ = res.z;
				_lastNames = res.names;
				_lastSep = res.sep;

				_updateGating();
				_redraw();

				if (status) {
					status.textContent = _L("rep_done") +
						" (" + res.names.length + " " + _L("rep_layers") + ")";
				}
			} else if (status) {
				status.textContent = _L("rep_failed");
			}
		} catch (e) {
			err("[RepresentationAnalysis] analyze failed: " + e);

			if (status) status.textContent = _L("rep_failed");
		}

		_running = false;

		if (btn) btn.disabled = false;
	}

	function init(containerId) {
		if (!_inited) {
			_injectStyles();
			_buildUI(containerId);
		}

		_updateGating();

		return true;
	}

	function isRunning() {
		return _running;
	}

	function getInternalState() {
		return {
			z: _lastZ,
			names: _lastNames,
			sep: _lastSep,
			running: _running
		};
	}

	return {
		init: init,
		runFromUI: runFromUI,
		isRunning: isRunning,
		getInternalState: getInternalState
	};
})();
