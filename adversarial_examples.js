"use strict";

// ============================================================
// ADVERSARIAL EXAMPLES - FGSM / PGD perturbations that fool
// the network. Shows original, perturbation and result.
// ============================================================

var AdversarialExamples = (function () {

	var _inited = false;
	var _running = false;
	var _lastAdv = null;
	var _lastPert = null;
	var _lastOrig = null;
	var _lastMargins = null;

	function _L(key) {
		try {
			return language[lang][key] || key;
		} catch (e) {
			return key;
		}
	}

	function _injectStyles() {
		if (document.getElementById("adv_styles")) return;

		var style = document.createElement("style");
		style.id = "adv_styles";
		style.textContent =
			".adv_wrapper { padding: 16px 20px; max-width: 980px; margin: 0 auto; }" +
			".adv_header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }" +
			".adv_icon { font-size: 1.5em; }" +
			".adv_title { font-size: 1.25em; font-weight: 700; }" +
			".adv_desc { font-size: 0.85em; opacity: 0.75; margin-bottom: 14px; line-height: 1.45; }" +
			".adv_panel { border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; border: 1px solid var(--adv-border, rgba(90,110,180,0.25)); }" +
			".adv_row { display: flex; flex-wrap: wrap; gap: 14px 22px; align-items: center; margin-bottom: 10px; }" +
			".adv_row label { font-size: 0.85em; opacity: 0.85; }" +
			".adv_row select, .adv_row input[type=number] { min-width: 70px; }" +
			".adv_btn { cursor: pointer; padding: 6px 16px; border-radius: 8px; border: 1px solid var(--adv-border, rgba(90,110,180,0.35)); font-size: 0.95em; }" +
			".adv_btn:disabled { opacity: 0.45; cursor: default; }" +
			".adv_images { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-start; }" +
			".adv_img_box { text-align: center; }" +
			".adv_img_box canvas { max-width: 220px; max-height: 220px; width: auto; height: auto; border-radius: 8px; border: 1px solid var(--adv-border, rgba(90,110,180,0.3)); }" +
			".adv_img_label { font-size: 0.8em; opacity: 0.7; margin-top: 5px; }" +
			".adv_badge { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 0.8em; margin-top: 4px; }" +
			".adv_badge.ok { background: rgba(80, 200, 120, 0.18); }" +
			".adv_badge.fooled { background: rgba(230, 90, 90, 0.2); }" +
			".adv_status { font-size: 0.9em; margin-top: 8px; min-height: 1.3em; }" +
			".adv_status.fooled { font-weight: 700; }" +
			".adv_empty { padding: 30px; text-align: center; opacity: 0.7; font-size: 0.95em; line-height: 1.6; }" +
			"#adv_margin_plot { width: 100%; height: 220px; }";

		document.head.appendChild(style);
	}

	function _applyThemeVars() {
		var tc = ExplainabilityLib.themeColors();
		document.documentElement.style.setProperty("--adv-border", tc.panelBorder);
	}

	function _buildUI(containerId) {
		var container = document.getElementById(containerId);
		if (!container) return;

		_inited = true;
		container.innerHTML =
			'<div class="adv_wrapper">' +
			'	<div class="adv_header">' +
			'		<span class="adv_icon" id="adv_icon">🎭</span>' +
			'		<span class="adv_title"><span class="TRANSLATEME_adversarial"></span></span>' +
			'	</div>' +
			'	<div class="adv_desc"><span class="TRANSLATEME_adversarial_desc"></span></div>' +
			'	<div class="adv_panel" id="adv_controls_panel">' +
			'		<div class="adv_row">' +
			'			<label><span class="TRANSLATEME_adv_method"></span></label>' +
			'			<select id="adv_method">' +
			'				<option value="fgsm">FGSM</option>' +
			'				<option value="pgd">PGD</option>' +
			'			</select>' +
			'			<label><span class="TRANSLATEME_adv_target"></span></label>' +
			'			<select id="adv_target">' +
			'				<option value="predicted"><span class="TRANSLATEME_adv_target_predicted"></span></option>' +
			'				<option value="other"><span class="TRANSLATEME_adv_target_other"></span></option>' +
			'			</select>' +
			'		</div>' +
			'		<div class="adv_row">' +
			'			<label><span class="TRANSLATEME_adv_eps"></span></label>' +
			'			<input type="number" id="adv_eps" value="0.05" min="0.005" max="0.5" step="0.005" style="width:70px">' +
			'			<label><span class="TRANSLATEME_adv_iters"></span></label>' +
			'			<input type="number" id="adv_iters" value="10" min="1" max="100" style="width:60px">' +
			'			<label><span class="TRANSLATEME_adv_amp"></span></label>' +
			'			<input type="number" id="adv_amp" value="20" min="2" max="200" style="width:60px">' +
			'		</div>' +
			'		<div class="adv_row">' +
			'			<button class="adv_btn" id="adv_run_btn" onclick="AdversarialExamples.runFromUI()"><span class="TRANSLATEME_adv_run"></span></button>' +
			'		</div>' +
			'		<div class="adv_status" id="adv_status"></div>' +
			'	</div>' +
			'	<div class="adv_images" id="adv_images">' +
			'		<div class="adv_img_box">' +
			'			<canvas id="adv_orig_canvas"></canvas>' +
			'			<div class="adv_img_label"><span class="TRANSLATEME_adv_orig"></span></div>' +
			'			<div id="adv_orig_badge"></div>' +
			'		</div>' +
			'		<div class="adv_img_box">' +
			'			<canvas id="adv_pert_canvas"></canvas>' +
			'			<div class="adv_img_label"><span class="TRANSLATEME_adv_pert"></span></div>' +
			'		</div>' +
			'		<div class="adv_img_box">' +
			'			<canvas id="adv_result_canvas"></canvas>' +
			'			<div class="adv_img_label"><span class="TRANSLATEME_adv_result"></span></div>' +
			'			<div id="adv_result_badge"></div>' +
			'		</div>' +
			'	</div>' +
			'	<div id="adv_margin_plot"></div>' +
			'	<div class="adv_empty" id="adv_empty" style="display:none"><span class="TRANSLATEME_adv_needs_model"></span></div>' +
			'</div>';

		_applyThemeVars();
		_showSeed();

		ExplainabilityLib.onThemeChange(function () {
			_applyThemeVars();
			_showSeed();
			_redrawResults();
			_redrawMarginPlot();
		});
	}

	function _showSeed() {
		var canvas = document.getElementById("adv_orig_canvas");
		var empty = document.getElementById("adv_empty");
		var controls = document.getElementById("adv_controls_panel");
		var images = document.getElementById("adv_images");
		var m = ExplainabilityLib.getModel();

		if (!canvas) return;

		if (!m || !ExplainabilityLib.isImageInput() || !ExplainabilityLib.isClassification()) {
			if (empty) empty.style.display = "block";
			if (controls) controls.style.display = "none";
			if (images) images.style.display = "none";
			if (document.getElementById("adv_margin_plot")) document.getElementById("adv_margin_plot").style.display = "none";
			return;
		}

		if (empty) empty.style.display = "none";
		if (controls) controls.style.display = "block";
		if (images) images.style.display = "flex";
		if (document.getElementById("adv_margin_plot")) document.getElementById("adv_margin_plot").style.display = "block";

		if (_lastOrig) {
			ExplainabilityLib.tensorToCanvas(_lastOrig, canvas);
		}
	}

	function _redrawResults() {
		if (_lastPert) {
			ExplainabilityLib.tensorToCanvas(_lastPert, document.getElementById("adv_pert_canvas"));
		}

		if (_lastAdv) {
			ExplainabilityLib.tensorToCanvas(_lastAdv, document.getElementById("adv_result_canvas"));
		}
	}

	function _predictLogits(x1) {
		return tf.tidy(function () {
			var m = ExplainabilityLib.getModel();
			var pred = m.apply(x1, { training: false });
			return pred.reshape([1, -1]).clone();
		});
	}

	async function _seed() {
		var xy = await ExplainabilityLib.getXy();
		if (!xy || !xy.x) return null;

		var seed = ExplainabilityLib.seedImage(xy.x);

		return { seed: seed, range: ExplainabilityLib.inputRange(xy.x) };
	}

	async function run(opts) {
		var o = opts || {};
		var m = ExplainabilityLib.getModel();

		if (!m) {
			err("[AdversarialExamples] No model available");
			return null;
		}

		if (!ExplainabilityLib.isClassification()) {
			err("[AdversarialExamples] Requires a classification (softmax) model");
			return null;
		}

		var method = o.method || "fgsm";
		var eps = typeof o.eps === "number" ? o.eps : 0.05;
		var iters = o.iters || 10;
		var targetMode = o.target || "predicted";

		var prepared = await _seed();
		if (!prepared) {
			err("[AdversarialExamples] No data");
			return null;
		}

		var seed = prepared.seed;
		var range = prepared.range;
		var span = range.max - range.min;

		eps = Math.min(eps, span / 4);

		var seed4d = tf.tidy(function () {
			return seed.reshape([1].concat(seed.shape)).clone();
		});

		var xAdv = seed4d.clone();

		var origLogits = _predictLogits(xAdv);
		var origTop = tf.tidy(function () {
			return origLogits.argMax(1).dataSync()[0];
		});
		origLogits.dispose();
		var target = origTop;

		if (targetMode === "other") {
			var nC = ExplainabilityLib.numClasses();
			target = (origTop + 1) % Math.max(2, nC);
		}

		function _targetLogit(img) {
			return tf.tidy(function () {
				var pred = m.apply(img, { training: false });
				return pred.gather([target], 1).sum();
			});
		}

		var tlBefore = _targetLogit(xAdv);
		var targetLogitBefore = tlBefore.dataSync()[0];
		tlBefore.dispose();

		var lossOf = function (img) {
			return tf.tidy(function () {
				var lt = _targetLogit(img);

				// targeted: ascend on the target logit (raise it)
				// untargeted: ascend on the negation (lower it)
				return targetMode === "other" ? lt : lt.neg();
			});
		};

		var gradFn = tf.grad(lossOf);
		var marginHistory = [];

		function _margin(img) {
			return tf.tidy(function () {
				var logits = m.apply(img, { training: false });
				var sorted = tf.topk(logits, 2).values;

				return tf.sub(sorted.gather([0]), sorted.gather([1])).dataSync()[0];
			});
		}

		marginHistory.push(_margin(xAdv));

		if (method === "fgsm") {
			xAdv = await tf.tidy(function () {
				var g = gradFn(xAdv);
				var step = tf.sign(g);
				return xAdv.add(step.mul(eps)).clipByValue(range.min, range.max);
			});
		} else {
			var stepSize = eps / 2;

			for (var it = 0; it < iters; it++) {
				xAdv = await tf.tidy(function () {
					var g = gradFn(xAdv);
					var step = tf.sign(g);
					return xAdv.add(step.mul(stepSize)).clipByValue(range.min, range.max);
				});

				marginHistory.push(_margin(xAdv));

				await new Promise(function (r) { setTimeout(r, 0); });
			}
		}

		var finalLogits = _predictLogits(xAdv);
		var advTop = tf.tidy(function () {
			return finalLogits.argMax(1).dataSync()[0];
		});
		finalLogits.dispose();

		if (method === "fgsm") {
			marginHistory.push(_margin(xAdv));
		}

		var pert = tf.tidy(function () {
			return xAdv.sub(seed4d).abs().mul(_pertAmp());
		});

		var tlAfter = _targetLogit(xAdv);
		var targetLogitAfter = tlAfter.dataSync()[0];
		tlAfter.dispose();

		if (_lastAdv) { try { _lastAdv.dispose(); } catch (e) { /* gone */ } }
		if (_lastPert) { try { _lastPert.dispose(); } catch (e) { /* gone */ } }
		if (_lastOrig) { try { _lastOrig.dispose(); } catch (e) { /* gone */ } }

		_lastAdv = tf.tidy(function () {
			return xAdv.squeeze([0]).clone();
		});
		xAdv.dispose();
		seed4d.dispose();
		_lastPert = pert;
		_lastOrig = seed;
		_lastMargins = marginHistory;

		return {
			origTop: origTop,
			advTop: advTop,
			fooled: origTop !== advTop,
			target: target,
			marginHistory: marginHistory,
			method: method,
			targetLogitBefore: targetLogitBefore,
			targetLogitAfter: targetLogitAfter,
			adv: _lastAdv,
			pert: _lastPert,
			orig: _lastOrig
		};
	}

	function _pertAmp() {
		try {
			var el = document.getElementById("adv_amp");
			return el ? parseFloat(el.value) || 20 : 20;
		} catch (e) {
			return 20;
		}
	}

	async function runFromUI() {
		if (_running) return;

		_running = true;
		var status = document.getElementById("adv_status");
		var runBtn = document.getElementById("adv_run_btn");

		if (runBtn) runBtn.disabled = true;
		if (status) status.textContent = _L("adv_running");

		try {
			var method = document.getElementById("adv_method").value;
			var eps = parseFloat(document.getElementById("adv_eps").value);
			var iters = parseInt(document.getElementById("adv_iters").value, 10);
			var target = document.getElementById("adv_target").value;

			var res = await run({ method: method, eps: eps, iters: iters, target: target });

			if (res) {
				_showSeed();
				_redrawResults();
				_showBadges(res);
				_redrawMarginPlot();

				if (status) {
					status.textContent = res.fooled ? _L("adv_fooled") : _L("adv_not_fooled");
					status.classList.toggle("fooled", res.fooled);
				}
			} else if (status) {
				status.textContent = _L("adv_failed");
			}
		} catch (e) {
			err("[AdversarialExamples] run failed: " + e);

			if (status) status.textContent = _L("adv_failed");
		}

		_running = false;

		if (runBtn) runBtn.disabled = false;
	}

	function _showBadges(res) {
		var origBadge = document.getElementById("adv_orig_badge");
		var resBadge = document.getElementById("adv_result_badge");
		var nC = ExplainabilityLib.numClasses();
		var colors = ExplainabilityLib.classLabelColors(Math.max(nC, 1));

		if (origBadge) {
			origBadge.innerHTML =
				'<span class="adv_badge ok" style="border:1px solid ' + colors[res.origTop % colors.length] + '">' +
				_L("adv_class") + " " + res.origTop + "</span>";
		}

		if (resBadge) {
			var cls = res.fooled ? "fooled" : "ok";

			resBadge.innerHTML =
				'<span class="adv_badge ' + cls + '" style="border:1px solid ' + colors[res.advTop % colors.length] + '">' +
				_L("adv_class") + " " + res.advTop + "</span>";
		}
	}

	function _redrawMarginPlot() {
		if (!_lastAdv || !_lastMargins) return;

		var div = document.getElementById("adv_margin_plot");
		if (!div) return;

		var tc = ExplainabilityLib.themeColors();
		var xs = [];

		for (var i = 0; i < _lastMargins.length; i++) {
			xs.push(i);
		}

		Plotly.react(div, [{
			x: xs,
			y: _lastMargins,
			mode: "lines+markers",
			name: _L("adv_margin"),
			line: { color: "#e15759", width: 2 }
		}], ExplainabilityLib.baseLayout({
			margin: { t: 20, b: 60, l: 70, r: 20 },
			xaxis: { gridcolor: tc.grid, title: _L("adv_iter"), showgrid: false },
			yaxis: { gridcolor: tc.grid, title: _L("adv_margin") },
			showlegend: false
		}), { responsive: true });
	}

	function init(containerId) {
		if (!_inited) {
			_injectStyles();
			_buildUI(containerId);
		}

		_showSeed();

		return true;
	}

	function isRunning() {
		return _running;
	}

	function getInternalState() {
		return {
			adv: _lastAdv,
			pert: _lastPert,
			orig: _lastOrig,
			margins: _lastMargins,
			running: _running
		};
	}

	return {
		init: init,
		run: run,
		runFromUI: runFromUI,
		isRunning: isRunning,
		getInternalState: getInternalState
	};
})();
