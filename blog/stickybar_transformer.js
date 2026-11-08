// ============================================================
// Unified Sticky Bottom Bar
// Replaces the old training progress bar. Always visible when
// #transformer_site is in the viewport. Shows "Start Training"
// when idle, becomes the full training bar when training.
// ============================================================

(function () {
	window.__tmMetricInStickyBar = true;
	let barEl = null;
	let siteIsVisible = false;
	let miniChartInited = false;

	/** Create the bar once and append to <body> */
	/** Create the bar once and append to <body> */
	function createStickyBar() {
		if (barEl) return barEl;

		barEl = buildStickyBarElement();
		document.body.appendChild(barEl);

		wireTrainButton();
		wireStopButton();
		wireButtonHoverEffects();
		wireMetricControls();

		return barEl;
	}

	/** Builds the root bar element with all inner HTML. */
	function buildStickyBarElement() {
		const el = document.createElement('div');
		el.id = 'training-progress-bar-container';
		el.style.cssText = buildBarRootStyles();
		el.innerHTML = buildMetricControlHtml() + buildIdlePanelHtml() + buildTrainingPanelHtml();
		return el;
	}

	/** Metric switch + sphere toggle, kept at the left of the sticky bar. */
	function buildMetricControlHtml() {
		return `
	<div id="sticky-metric-control" style="display:flex; align-items:center; flex-wrap:wrap; row-gap:4px; gap:6px; padding-right:8px; border-right:1px solid #374151; margin-right:2px; flex-shrink:1; min-width:0; max-width:100%;">
	    <label style="display:inline-flex; align-items:center; gap:6px; color:#94a3b8; font-size:0.78rem; white-space:nowrap;">
		Metric
		<select id="sticky-metric-select" style="padding:3px 6px; border-radius:6px; border:1px solid #475569; background:#1f2937; color:#f8fafc; font-size:0.74rem; max-width:190px;"></select>
	    </label>
	    <label id="sticky-sphere-label" style="display:none; align-items:center; gap:5px; color:#94a3b8; font-size:0.78rem; white-space:nowrap;">
		<input type="checkbox" id="sticky-metric-sphere" checked> Sphere
	    </label>
	    <label id="sticky-highdim-label" style="display:none; align-items:center; gap:5px; color:#94a3b8; font-size:0.78rem; white-space:nowrap;">
		High-dim
		<select id="sticky-highdim-select" style="padding:3px 6px; border-radius:6px; border:1px solid #475569; background:#1f2937; color:#f8fafc; font-size:0.74rem;">
			<option value="pca">PCA</option>
			<option value="parallel">Parallel</option>
		</select>
	    </label>
	</div>
    `;
	}

	/** Wire the metric select and the sphere toggle to the shared metric API. */
	function wireMetricControls() {
		const select = document.getElementById('sticky-metric-select');
		const sphere = document.getElementById('sticky-metric-sphere');
		const highdim = document.getElementById('sticky-highdim-select');
		if (!select || !sphere) return;
		const sphereLabel = sphere.closest('label');
		const highdimLabel = highdim ? highdim.closest('label') : null;
		const api = window.tmMetric;
		const fallback = {
			euclidean: { en: 'Euclidean (L2)' },
			angular: { en: 'Great-circle / angular (cosine, 0–1)' }
		};
		const options = (api && api.options) ? api.options : fallback;
		select.innerHTML = Object.keys(options).map(function (key) {
			return `<option value="${key}">${options[key].en || key}</option>`;
		}).join('');
		select.value = (api && api.get) ? api.get() : (window.tmFeatureMetric || 'euclidean');

		const sync = () => {
			const angular = select.value === 'angular';
			sphereLabel.style.display = angular ? 'inline-flex' : 'none';
			sphere.disabled = !angular;
			sphere.checked = (api && api.sphereEnabled) ? api.sphereEnabled() : (window.tmMetricSphere !== false);
			if (highdimLabel && highdim) {
				const dim = (typeof getTransformerConfig === 'function') ? getTransformerConfig().d_model : 3;
				highdimLabel.style.display = dim > 3 ? 'inline-flex' : 'none';
				highdim.value = window.tmHighDimMode || 'pca';
			}
		};
		sync();

		select.addEventListener('change', function () {
			if (api && api.set) api.set(select.value);
			else window.tmFeatureMetric = select.value;
			sync();
			window.dispatchEvent(new CustomEvent('tm:metricchange', { detail: { metric: select.value } }));
		});
		sphere.addEventListener('change', function () {
			if (api && api.setSphere) api.setSphere(sphere.checked);
			else window.tmMetricSphere = sphere.checked;
			window.dispatchEvent(new CustomEvent('tm:metricchange', { detail: { metric: select.value } }));
		});
		if (highdim) {
			highdim.addEventListener('change', function () {
				window.tmHighDimMode = highdim.value;
				window.dispatchEvent(new CustomEvent('tm:highdimmode', { detail: { mode: highdim.value } }));
			});
		}
		const dimSlider = document.getElementById('transformer-dimension-model');
		if (dimSlider) dimSlider.addEventListener('input', sync);
		window.addEventListener('tm:metricchange', sync);
	}

	/** Returns the CSS for the root sticky bar container. */
	function buildBarRootStyles() {
		return `
	position: fixed; bottom: 0; left: 0; width: 100%; box-sizing: border-box; max-width: 100vw;
	background: #1e293b; color: #f8fafc;
	padding: 8px 12px; display: none; align-items: center; flex-wrap: wrap;
	row-gap: 6px; align-content: center;
	gap: 10px; z-index: 999;
	font-family: 'Inter', sans-serif; font-size: 0.85rem;
	box-shadow: 0 -2px 12px rgba(0,0,0,0.3);
	transition: opacity 0.25s ease, transform 0.25s ease;
	opacity: 0; transform: translateY(100%);
    `;
	}

	/** Returns the HTML for the idle-state sub-panel. */
	function buildIdlePanelHtml() {
		return `
	<div id="data-view-toggle" style="border: 1px solid #374151; border-radius: 8px; display: flex; align-items: center; gap: 0px; background: #1f2937; overflow: hidden; width: 220px; min-width: 160px; flex-shrink: 0;">
	    <button id="view-toggle-train" 
		onclick="setVisualizationMode('train')" 
		style="padding: 8px 18px; border: 1px solid #3b82f6; border-radius: 6px 0 0 6px; background: #3b82f6; color: white; font-weight: bold; cursor: pointer; transition: all 0.15s; flex: 1;">
		Training
	    </button>
	    
	    <button id="view-toggle-inference" 
		onclick="setVisualizationMode('inference')" 
		style="padding: 8px 18px; border: 1px solid #374151; border-radius: 0 6px 6px 0; background: #1f2937; color: #9ca3af; font-weight: bold; cursor: pointer; transition: all 0.15s; flex: 1;">
		Inference
	    </button>
	</div>

	<div id="tlab-bar-idle" style="display:flex; align-items:center; gap:10px; flex:1 1 auto; min-width:0;">
	    <span style="flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#94a3b8; font-size:0.82rem;">
		Ready to train
	    </span>
	    <button id="tlab-bar-train-btn" style="${buildTrainButtonStyles()}">▶ Start Training</button>
	</div>
    `;
	}

	/** Returns inline styles for the idle-panel train button. */
	function buildTrainButtonStyles() {
		return `
	margin-right: 8px;
	background: linear-gradient(135deg, #3b82f6, #6366f1);
	color: white; border: none; padding: 8px 22px;
	border-radius: 8px; cursor: pointer; font-weight: 700;
	font-size: 0.85rem; white-space: nowrap;
	transition: background 0.15s, transform 0.1s;
	box-shadow: 0 2px 8px rgba(99,102,241,0.4);
    `;
	}

	/** Returns the HTML for the training-state sub-panel. */
	function buildTrainingPanelHtml() {
		return `
	<div id="tlab-bar-training" style="display:none; align-items:center; gap:10px; flex:1 1 auto; min-width:0;">
	    ${buildMiniChartHtml()}
	    ${buildEpochLabelHtml()}
	    ${buildProgressTrackHtml()}
	    ${buildLossLabelHtml()}
	    ${buildEtaLabelHtml()}
	    ${buildStopButtonHtml()}
	</div>
    `;
	}

	/** Returns the HTML for the mini loss sparkline container. */
	function buildMiniChartHtml() {
		return `
	<div id="tlab-bar-mini-chart" style="
	    width: 100px; height: 36px; flex-shrink: 0;
	    background: #334155; border-radius: 6px; overflow: hidden;
	    position: relative;
	">
	    <canvas id="tlab-bar-mini-canvas" width="120" height="36"
		style="width:120px;height:36px;display:block;"></canvas>
	</div>
    `;
	}

	/** Returns the HTML for the epoch label span. */
	function buildEpochLabelHtml() {
		return `
	<span id="training-progress-label" style="white-space:nowrap; min-width:110px; overflow:hidden; text-overflow:ellipsis;">
	    Starting training...
	</span>
    `;
	}

	/** Returns the HTML for the progress bar track + fill + percent overlay. */
	function buildProgressTrackHtml() {
		return `
	<div style="flex-grow:1; background:#334155; border-radius:6px; height:18px; overflow:hidden; position:relative;">
	    <div id="training-progress-fill" style="
		width:0%; height:100%;
		background: linear-gradient(90deg, #3b82f6, #10b981);
		border-radius:6px; transition: width 0.15s ease;
	    "></div>
	    <span id="training-progress-percent" style="
		position:absolute; top:0; left:0; width:100%; height:100%;
		display:flex; align-items:center; justify-content:center;
		font-size:0.75rem; font-weight:600; color:#fff;
		text-shadow:0 1px 2px rgba(0,0,0,0.5); pointer-events:none;
	    ">0%</span>
	</div>
    `;
	}

	/** Returns the HTML for the loss display label. */
	function buildLossLabelHtml() {
		return `
	<span id="training-progress-loss" style="
	    white-space:nowrap; min-width:90px; text-align:right; color:#94a3b8;
	">Loss: —</span>
    `;
	}

	/** Returns the HTML for the ETA display label. */
	function buildEtaLabelHtml() {
		return `
	<span id="tlab-bar-eta" style="
	    white-space:nowrap; min-width:70px; text-align:right; color:#64748b;
	    font-size:0.78rem;
	">ETA: —</span>
    `;
	}

	/** Returns the HTML for the stop training button. */
	function buildStopButtonHtml() {
		return `
	<button id="tlab-bar-stop-btn" style="
	    background: #ef4444; color: white; border: none;
	    padding: 6px 16px; border-radius: 6px; cursor: pointer;
	    font-weight: 600; font-size: 0.82rem; white-space: nowrap;
	    margin-right: 8px; transition: background 0.15s;
	">⏹ Stop</button>
    `;
	}

	/** Wires the click handler on the idle-panel train button. */
	function wireTrainButton() {
		document.getElementById('tlab-bar-train-btn').addEventListener('click', () => {
			train_transformer();
		});
	}

	/** Wires the click handler on the training-panel stop button. */
	function wireStopButton() {
		document.getElementById('tlab-bar-stop-btn').addEventListener('click', () => {
			window.isTraining = false;
		});
	}

	/** Attaches hover scale/color effects to both action buttons. */
	function wireButtonHoverEffects() {
		const trainBtn = document.getElementById('tlab-bar-train-btn');
		trainBtn.addEventListener('mouseover', () => { trainBtn.style.transform = 'scale(1.04)'; });
		trainBtn.addEventListener('mouseout',  () => { trainBtn.style.transform = 'scale(1)'; });

		const stopBtn = document.getElementById('tlab-bar-stop-btn');
		stopBtn.addEventListener('mouseover', () => { stopBtn.style.background = '#dc2626'; });
		stopBtn.addEventListener('mouseout',  () => { stopBtn.style.background = '#ef4444'; });
	}


	/** Keep the site-wide "↑ top" button clear of the sticky bar. */
	function positionTopButton() {
		const topBtn = document.getElementById('cl-top');
		if (!topBtn) return;
		topBtn.style.bottom = (barEl && barEl.style.display !== 'none') ? '60px' : '';
	}

	/** Keep the RAG chat launcher and its panel clear of the sticky bar. */
	function positionChatWidgets() {
		const height = (barEl && barEl.style.display !== 'none') ? barEl.offsetHeight : 0;
		document.documentElement.style.setProperty('--tlab-sticky-bar-height', height + 'px');
	}

	/** Slide the bar into view */
	function showBar() {
		if (!barEl) createStickyBar();
		barEl.style.display = 'flex';
		void barEl.offsetHeight; // force reflow
		barEl.style.opacity = '1';
		barEl.style.transform = 'translateY(0)';
		positionTopButton();
		positionChatWidgets();
	}

	/** Slide the bar out of view */
	function hideBar() {
		if (!barEl) return;
		barEl.style.opacity = '0';
		barEl.style.transform = 'translateY(100%)';
		setTimeout(() => {
			if (barEl && barEl.style.opacity === '0') {
				barEl.style.display = 'none';
				positionTopButton();
				positionChatWidgets();
			}
		}, 260);
	}

	/** Switch between idle / training sub-panels */
	function syncBarMode() {
		if (!barEl) return;

		const idlePanel     = document.getElementById('tlab-bar-idle');
		const trainingPanel = document.getElementById('tlab-bar-training');
		const trainBtn      = document.getElementById('tlab-bar-train-btn');

		if (window.isTraining) {
			idlePanel.style.display     = 'none';
			trainingPanel.style.display = 'flex';
		} else {
			idlePanel.style.display     = 'flex';
			trainingPanel.style.display = 'none';

			// Sync disabled state with the main train button
			const mainBtn = document.querySelector('.train-btn');
			if (mainBtn && trainBtn) {
				trainBtn.disabled       = mainBtn.disabled;
				trainBtn.style.opacity  = mainBtn.disabled ? '0.45' : '1';
				trainBtn.style.cursor   = mainBtn.disabled ? 'not-allowed' : 'pointer';
			}
		}

		positionChatWidgets();
	}

	/** Draw a tiny sparkline of the loss history */
	function drawMiniLossChart() {
		const canvas = document.getElementById('tlab-bar-mini-canvas');
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		const w = canvas.width;
		const h = canvas.height;
		const history = window.lossHistory;

		ctx.clearRect(0, 0, w, h);
		if (!history || history.length < 2) return;

		const maxLoss = Math.max(...history);
		const minLoss = Math.min(...history);
		const range = maxLoss - minLoss || 1;

		// Filled area
		ctx.beginPath();
		ctx.moveTo(0, h);
		for (let i = 0; i < history.length; i++) {
			const x = (i / (history.length - 1)) * w;
			const y = h - ((history[i] - minLoss) / range) * (h - 4) - 2;
			ctx.lineTo(x, y);
		}
		ctx.lineTo(w, h);
		ctx.closePath();
		ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
		ctx.fill();

		// Line
		ctx.beginPath();
		for (let i = 0; i < history.length; i++) {
			const x = (i / (history.length - 1)) * w;
			const y = h - ((history[i] - minLoss) / range) * (h - 4) - 2;
			if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
		}
		ctx.strokeStyle = '#10b981';
		ctx.lineWidth = 1.5;
		ctx.stroke();
	}

	// ---- Observe #transformer_site visibility ----

	function initSiteObserver() {
		const site = document.getElementById('transformer_site');
		if (!site) return;

		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				siteIsVisible = entry.isIntersecting;
				if (siteIsVisible) {
					showBar();
					syncBarMode();
				} else {
					hideBar();
				}
			});
		}, { threshold: 0 });

		observer.observe(site);
	}

	// ---- Public API (replaces old functions) ----

	window.showTrainingProgressBar = function () {
		if (!barEl) createStickyBar();
		window._trainingBarStartTime = performance.now();
		syncBarMode();
		if (siteIsVisible) showBar();
	};

	window.updateTrainingProgressBar = function (currentEpoch, totalEpochs, loss) {
		if (!barEl) createStickyBar();

		// Ensure training panel is showing
		syncBarMode();

		const fill    = document.getElementById('training-progress-fill');
		const label   = document.getElementById('training-progress-label');
		const percent = document.getElementById('training-progress-percent');
		const lossLbl = document.getElementById('training-progress-loss');
		const etaLbl  = document.getElementById('tlab-bar-eta');

		if (!fill || !label || !percent || !lossLbl) return;

		const pct = Math.min(100, (currentEpoch / totalEpochs) * 100);

		fill.style.width    = pct.toFixed(1) + '%';
		percent.textContent = pct.toFixed(1) + '%';
		label.textContent   = `Epoch ${currentEpoch} / ${totalEpochs}`;
		lossLbl.textContent = `Loss: ${loss.toFixed(6)}`;

		// ETA guesstimate
		if (etaLbl) {
			if (!window._trainingBarStartTime) {
				window._trainingBarStartTime = performance.now();
			}
			const elapsed = performance.now() - window._trainingBarStartTime;
			const avgPerEpoch = elapsed / currentEpoch;
			const remaining = (totalEpochs - currentEpoch) * avgPerEpoch;
			etaLbl.textContent = `ETA: ${formatETA(remaining)}`;
		}

		drawMiniLossChart();
	};

	window.hideTrainingProgressBar = function () {
		window._trainingBarStartTime = null;
		const etaLbl = document.getElementById('tlab-bar-eta');
		if (etaLbl) etaLbl.textContent = 'ETA: —';
		syncBarMode();
	};

	// Also patch updateTrainButtonState to keep the bar's button in sync
	const _origUpdateTrainButtonState = window.updateTrainButtonState;
	window.updateTrainButtonState = function () {
		if (typeof _origUpdateTrainButtonState === 'function') {
			_origUpdateTrainButtonState();
		}
		syncBarMode();
	};

	// ---- Initialize ----
	window.addEventListener('resize', positionChatWidgets);

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initSiteObserver);
	} else {
		initSiteObserver();
	}
})();
