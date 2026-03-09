// ============================================================
// Unified Sticky Bottom Bar
// Replaces the old training progress bar. Always visible when
// #transformer_site is in the viewport. Shows "Start Training"
// when idle, becomes the full training bar when training.
// ============================================================

(function () {
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

		return barEl;
	}

	/** Builds the root bar element with all inner HTML. */
	function buildStickyBarElement() {
		const el = document.createElement('div');
		el.id = 'training-progress-bar-container';
		el.style.cssText = buildBarRootStyles();
		el.innerHTML = buildIdlePanelHtml() + buildTrainingPanelHtml();
		return el;
	}

	/** Returns the CSS for the root sticky bar container. */
	function buildBarRootStyles() {
		return `
	position: fixed; bottom: 0; left: 0; width: 100%;
	background: #1e293b; color: #f8fafc;
	padding: 10px 20px; display: none; align-items: center;
	gap: 14px; z-index: 999;
	font-family: 'Inter', sans-serif; font-size: 0.85rem;
	box-shadow: 0 -2px 12px rgba(0,0,0,0.3);
	transition: opacity 0.25s ease, transform 0.25s ease;
	opacity: 0; transform: translateY(100%);
    `;
	}

	/** Returns the HTML for the idle-state sub-panel. */
	function buildIdlePanelHtml() {
		return `
	<div id="tlab-bar-idle" style="display:flex; align-items:center; gap:14px; width:100%;">
	    <span style="flex-grow:1; color:#94a3b8; font-size:0.82rem;">
		Transformer Lab — ready to train
	    </span>
	    <button id="tlab-bar-train-btn" style="${buildTrainButtonStyles()}">▶ Start Training</button>
	</div>
    `;
	}

	/** Returns inline styles for the idle-panel train button. */
	function buildTrainButtonStyles() {
		return `
	margin-right: 35px;
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
	<div id="tlab-bar-training" style="display:none; align-items:center; gap:14px; width:100%;">
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
	    width: 120px; height: 36px; flex-shrink: 0;
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
	<span id="training-progress-label" style="white-space:nowrap; min-width:140px;">
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
	    white-space:nowrap; min-width:120px; text-align:right; color:#94a3b8;
	">Loss: —</span>
    `;
	}

	/** Returns the HTML for the ETA display label. */
	function buildEtaLabelHtml() {
		return `
	<span id="tlab-bar-eta" style="
	    white-space:nowrap; min-width:100px; text-align:right; color:#64748b;
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
	    margin-right: 50px; transition: background 0.15s;
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


	/** Slide the bar into view */
	function showBar() {
		if (!barEl) createStickyBar();
		barEl.style.display = 'flex';
		void barEl.offsetHeight; // force reflow
		barEl.style.opacity = '1';
		barEl.style.transform = 'translateY(0)';
	}

	/** Slide the bar out of view */
	function hideBar() {
		if (!barEl) return;
		barEl.style.opacity = '0';
		barEl.style.transform = 'translateY(100%)';
		setTimeout(() => {
			if (barEl && barEl.style.opacity === '0') {
				barEl.style.display = 'none';
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
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initSiteObserver);
	} else {
		initSiteObserver();
	}
})();
