"use strict";

// ============================================================
// ACTIVATION ATLAS TAB INTEGRATION
// Provides start/stop buttons, progress bar with time estimate,
// and animated UI within the visualizations tab.
// Hooks into the ActivationAtlas module (activation_atlas.js).
// ============================================================

var _atlasTabState = {
	isRunning: false,
	startTime: null,
	progressInterval: null,
	completionCheck: null,
	lastProgress: 0
};

/**
 * Start the Activation Atlas generation
 */
function atlasTabStart() {
	if (_atlasTabState.isRunning) return;

	// Check if model exists
	if (typeof model === "undefined" || !model) {
		var msgEl = document.getElementById("atlas_tab_message");
		if (msgEl) {
			msgEl.classList.add("atlas_tab_message_error");
			msgEl.classList.remove("atlas_tab_message_active");
			var textEl = msgEl.querySelector(".atlas_tab_message_text");
			if (textEl) {
				textEl.innerHTML = "<span class='TRANSLATEME_atlas_tab_no_model'></span>";
				if (typeof update_translations === "function") update_translations();
			}
		}
		return;
	}

	_atlasTabState.isRunning = true;
	_atlasTabState.startTime = Date.now();
	_atlasTabState.lastProgress = 0;

	// Update button states
	var startBtn = document.getElementById("atlas_start_btn");
	var stopBtn = document.getElementById("atlas_stop_btn");
	if (startBtn) {
		startBtn.disabled = true;
		startBtn.classList.add("atlas_tab_btn_disabled");
	}
	if (stopBtn) {
		stopBtn.disabled = false;
		stopBtn.classList.remove("atlas_tab_btn_disabled");
	}

	// Show progress section with animation
	var progressSection = document.getElementById("atlas_tab_progress_section");
	if (progressSection) {
		progressSection.style.display = "block";
		// Force reflow before adding animation class
		void progressSection.offsetWidth;
		progressSection.classList.remove("atlas_tab_progress_animate_out");
		progressSection.classList.add("atlas_tab_progress_animate_in");
	}

	// Update message to active state
	var msgEl = document.getElementById("atlas_tab_message");
	if (msgEl) {
		msgEl.classList.add("atlas_tab_message_active");
		msgEl.classList.remove("atlas_tab_message_error");
		msgEl.classList.remove("atlas_tab_message_done");
	}

	// Reset progress bar
	_atlasTabUpdateProgress(0, "");

	// Remove the "complete" class from bar if present
	var bar = document.getElementById("atlas_tab_progress_bar");
	if (bar) {
		bar.classList.remove("atlas_tab_progress_complete");
	}

	// Clear the render target
	var renderTarget = document.getElementById("atlas_tab_render_target");
	if (renderTarget) {
		renderTarget.innerHTML = "";
		renderTarget.classList.add("atlas_tab_render_active");
	}

	// Start the atlas generation
	_atlasTabRunGeneration(renderTarget);
}

/**
 * Stop the Activation Atlas generation
 */
function atlasTabStop() {
	if (!_atlasTabState.isRunning) return;

	// Signal stop to the ActivationAtlas module via its internal stop button
	// The ActivationAtlas uses _state.stopRequested internally, triggered by its stop button
	var internalStopBtn = document.querySelector("#atlas_tab_inner_render .atlas_stop_btn");
	if (internalStopBtn && !internalStopBtn.disabled) {
		internalStopBtn.click();
	}

	// Give it a moment to process the stop, then finalize
	setTimeout(function () {
		_atlasTabFinish("stopped");
	}, 1500);
}

/**
 * Run the actual atlas generation with progress hooks
 */
function _atlasTabRunGeneration(container) {
	var originalAtlas = null;

	// Get reference to the ActivationAtlas function
	if (typeof ActivationAtlas !== "undefined" && ActivationAtlas) {
		originalAtlas = ActivationAtlas;
	} else if (typeof window !== "undefined" && window.activationAtlas) {
		originalAtlas = window.activationAtlas;
	}

	if (!originalAtlas) {
		console.error("[AtlasTab] ActivationAtlas module not found.");
		_atlasTabFinish("error");
		return;
	}

	// Create a wrapper div inside the render target
	var atlasDiv = document.createElement("div");
	atlasDiv.id = "atlas_tab_inner_render";
	atlasDiv.className = "atlas_tab_inner_render";
	container.appendChild(atlasDiv);

	// Hook into progress by observing the internal progress bar DOM
	_atlasTabState.progressInterval = setInterval(function () {
		if (!_atlasTabState.isRunning) return;

		// Try to read progress from the internal progress bar created by ActivationAtlas
		var innerBar = atlasDiv.querySelector(".atlas_progress_inner");
		var innerLabel = atlasDiv.querySelector(".atlas_progress_label");

		if (innerBar) {
			var widthStr = innerBar.style.width;
			var pct = parseFloat(widthStr) || 0;
			_atlasTabUpdateProgress(pct / 100, innerLabel ? innerLabel.textContent : "");
		}
	}, 400);

	// Call the ActivationAtlas module — it renders into atlasDiv
	originalAtlas(atlasDiv);

	// Watch for completion by polling the DOM state
	_atlasTabState.completionCheck = setInterval(function () {
		if (!_atlasTabState.isRunning) {
			clearInterval(_atlasTabState.completionCheck);
			_atlasTabState.completionCheck = null;
			return;
		}

		// Check for error state
		var atlasError = atlasDiv.querySelector(".atlas_error");
		if (atlasError) {
			clearInterval(_atlasTabState.completionCheck);
			_atlasTabState.completionCheck = null;
			_atlasTabFinish("error");
			return;
		}

		// Check if atlas finished: the ActivationAtlas module removes the progress container
		// and shows the .atlas_info element when done
		var atlasInfo = atlasDiv.querySelector(".atlas_info");
		var progressContainer = atlasDiv.querySelector(".atlas_progress_container");

		if (atlasInfo && !progressContainer) {
			// Atlas has finished (progress removed, info shown)
			clearInterval(_atlasTabState.completionCheck);
			_atlasTabState.completionCheck = null;
			_atlasTabFinish("done");
			return;
		}

		// Check if the internal stop button was triggered and disabled
		var internalStopBtn = atlasDiv.querySelector(".atlas_stop_btn");
		if (internalStopBtn && internalStopBtn.disabled) {
			// The atlas stopped internally
			// Wait a bit for it to fully render the final state
			setTimeout(function () {
				if (_atlasTabState.isRunning) {
					clearInterval(_atlasTabState.completionCheck);
					_atlasTabState.completionCheck = null;
					// Check if it completed or was stopped
					var infoAfter = atlasDiv.querySelector(".atlas_info");
					if (infoAfter) {
						_atlasTabFinish("done");
					} else {
						_atlasTabFinish("stopped");
					}
				}
			}, 2000);
		}
	}, 800);
}

/**
 * Update the progress bar and time estimate
 */
function _atlasTabUpdateProgress(fraction, labelText) {
	if (fraction < _atlasTabState.lastProgress && fraction < 0.01) return; // ignore resets
	_atlasTabState.lastProgress = fraction;

	var bar = document.getElementById("atlas_tab_progress_bar");
	var label = document.getElementById("atlas_tab_progress_label");
	var eta = document.getElementById("atlas_tab_eta");

	if (bar) {
		var pctStr = (fraction * 100).toFixed(1) + "%";
		bar.style.width = pctStr;
	}

	if (label) {
		var displayText = Math.round(fraction * 100) + "%";
		if (labelText && labelText.length > 0) {
			displayText += " — " + labelText;
		}
		label.textContent = displayText;
	}

	if (eta && _atlasTabState.startTime && fraction > 0.02) {
		var elapsed = (Date.now() - _atlasTabState.startTime) / 1000; // seconds
		var totalEstimate = elapsed / fraction;
		var remaining = totalEstimate - elapsed;
		eta.textContent = _atlasTabFormatTime(remaining);
	} else if (eta && fraction <= 0.02) {
		eta.textContent = "--";
	}
}

/**
 * Format seconds into a human-readable time string
 */
function _atlasTabFormatTime(seconds) {
	if (!isFinite(seconds) || seconds < 0) return "--";

	seconds = Math.max(0, Math.round(seconds));

	if (seconds < 60) {
		return "~" + seconds + "s";
	} else if (seconds < 3600) {
		var mins = Math.floor(seconds / 60);
		var secs = Math.round(seconds % 60);
		return "~" + mins + "m " + secs + "s";
	} else {
		var hours = Math.floor(seconds / 3600);
		var mins2 = Math.floor((seconds % 3600) / 60);
		return "~" + hours + "h " + mins2 + "m";
	}
}

/**
 * Finish the atlas generation (done, stopped, or error)
 */
function _atlasTabFinish(reason) {
	if (!_atlasTabState.isRunning && reason !== "error") return;

	_atlasTabState.isRunning = false;

	// Clear intervals
	if (_atlasTabState.progressInterval) {
		clearInterval(_atlasTabState.progressInterval);
		_atlasTabState.progressInterval = null;
	}
	if (_atlasTabState.completionCheck) {
		clearInterval(_atlasTabState.completionCheck);
		_atlasTabState.completionCheck = null;
	}

	// Update button states
	var startBtn = document.getElementById("atlas_start_btn");
	var stopBtn = document.getElementById("atlas_stop_btn");
	if (startBtn) {
		startBtn.disabled = false;
		startBtn.classList.remove("atlas_tab_btn_disabled");
	}
	if (stopBtn) {
		stopBtn.disabled = true;
		stopBtn.classList.add("atlas_tab_btn_disabled");
	}

	// Update progress bar
	var bar = document.getElementById("atlas_tab_progress_bar");
	if (reason === "done") {
		_atlasTabUpdateProgress(1.0, "");
		if (bar) bar.classList.add("atlas_tab_progress_complete");
	} else if (reason === "stopped") {
		if (bar) bar.classList.add("atlas_tab_progress_stopped");
	}

	// Update message state
	var msgEl = document.getElementById("atlas_tab_message");
	if (msgEl) {
		msgEl.classList.remove("atlas_tab_message_active");
		if (reason === "error") {
			msgEl.classList.add("atlas_tab_message_error");
		} else if (reason === "done") {
			msgEl.classList.add("atlas_tab_message_done");
		}
	}

	// Remove active class from render target
	var renderTarget = document.getElementById("atlas_tab_render_target");
	if (renderTarget) {
		renderTarget.classList.remove("atlas_tab_render_active");
	}

	// Hide progress section after a delay if done
	if (reason === "done") {
		setTimeout(function () {
			var progressSection = document.getElementById("atlas_tab_progress_section");
			if (progressSection) {
				progressSection.classList.remove("atlas_tab_progress_animate_in");
				progressSection.classList.add("atlas_tab_progress_animate_out");
				setTimeout(function () {
					progressSection.style.display = "none";
					progressSection.classList.remove("atlas_tab_progress_animate_out");
				}, 600);
			}
		}, 3000);
	}

	// Update translations if available
	if (typeof update_translations === "function") {
		update_translations();
	}
}

// ============================================================
// INJECT STYLES FOR THE TAB UI
// ============================================================

(function _injectAtlasTabStyles() {
	if (document.getElementById("atlas_tab_styles")) return;

	var style = document.createElement("style");
	style.id = "atlas_tab_styles";
	style.textContent = [
		"/* ============================== */",
		"/* ACTIVATION ATLAS TAB STYLES    */",
		"/* ============================== */",
		"",
		"/* Wrapper */",
		".atlas_tab_wrapper {",
		"  padding: 20px;",
		"  font-family: inherit;",
		"  max-width: 960px;",
		"  margin: 0 auto;",
		"}",
		"",
		"/* Header */",
		".atlas_tab_header {",
		"  margin-bottom: 16px;",
		"}",
		"",
		".atlas_tab_title {",
		"  font-size: 1.4em;",
		"  font-weight: 700;",
		"  display: flex;",
		"  align-items: center;",
		"  gap: 10px;",
		"  margin: 0;",
		"}",
		"",
		".atlas_tab_icon {",
		"  font-size: 1.3em;",
		"  display: inline-block;",
		"  animation: atlas_icon_pulse 2s ease-in-out infinite;",
		"}",
		"",
		"@keyframes atlas_icon_pulse {",
		"  0%, 100% { transform: scale(1); opacity: 1; }",
		"  50% { transform: scale(1.15); opacity: 0.8; }",
		"}",
		"",
		"/* Message box */",
		".atlas_tab_message {",
		"  background: linear-gradient(135deg, rgba(52, 152, 219, 0.06) 0%, rgba(155, 89, 182, 0.06) 100%);",
		"  border: 1px solid rgba(52, 152, 219, 0.2);",
		"  border-radius: 12px;",
		"  padding: 20px 24px;",
		"  margin-bottom: 20px;",
		"  position: relative;",
		"  overflow: hidden;",
		"  transition: all 0.4s ease;",
		"}",
		"",
		".atlas_tab_message::before {",
		"  content: '';",
		"  position: absolute;",
		"  top: 0;",
		"  left: -100%;",
		"  width: 200%;",
		"  height: 100%;",
		"  background: linear-gradient(90deg, transparent, rgba(52, 152, 219, 0.04), transparent);",
		"  animation: atlas_shimmer 4s ease-in-out infinite;",
		"}",
		"",
		"@keyframes atlas_shimmer {",
		"  0% { transform: translateX(-50%); }",
		"  100% { transform: translateX(50%); }",
		"}",
		"",
		".atlas_tab_message_active {",
		"  border-color: rgba(46, 204, 113, 0.5);",
		"  background: linear-gradient(135deg, rgba(46, 204, 113, 0.08) 0%, rgba(52, 152, 219, 0.06) 100%);",
		"  box-shadow: 0 0 20px rgba(46, 204, 113, 0.08);",
		"}",
		"",
		".atlas_tab_message_active::before {",
		"  background: linear-gradient(90deg, transparent, rgba(46, 204, 113, 0.06), transparent);",
		"  animation-duration: 2.5s;",
		"}",
		"",
		".atlas_tab_message_done {",
		"  border-color: rgba(46, 204, 113, 0.4);",
		"  background: linear-gradient(135deg, rgba(46, 204, 113, 0.05) 0%, rgba(39, 174, 96, 0.05) 100%);",
		"}",
		"",
		".atlas_tab_message_error {",
		"  border-color: rgba(231, 76, 60, 0.4);",
		"  background: linear-gradient(135deg, rgba(231, 76, 60, 0.06) 0%, rgba(192, 57, 43, 0.06) 100%);",
		"}",
		"",
		".atlas_tab_message_icon {",
		"  position: relative;",
		"  display: inline-block;",
		"  margin-bottom: 10px;",
		"}",
		"",
		".atlas_message_emoji {",
		"  font-size: 1.8em;",
		"  position: relative;",
		"  z-index: 1;",
		"}",
		"",
		".atlas_pulse_ring {",
		"  position: absolute;",
		"  top: 50%;",
		"  left: 50%;",
		"  transform: translate(-50%, -50%);",
		"  width: 40px;",
		"  height: 40px;",
		"  border-radius: 50%;",
		"  border: 2px solid rgba(52, 152, 219, 0.4);",
		"  animation: atlas_pulse_expand 2s ease-out infinite;",
		"}",
		"",
		"@keyframes atlas_pulse_expand {",
		"  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }",
		"  100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }",
		"}",
		"",
		".atlas_tab_message_active .atlas_pulse_ring {",
		"  border-color: rgba(46, 204, 113, 0.5);",
		"  animation-duration: 1.5s;",
		"}",
		"",
		".atlas_tab_message_text {",
		"  font-size: 0.92em;",
		"  line-height: 1.6;",
		"  margin: 8px 0;",
		"  opacity: 0.85;",
		"}",
		"",
		".atlas_tab_message_time_hint {",
		"  font-size: 0.82em;",
		"  opacity: 0.55;",
		"  font-style: italic;",
		"  margin: 4px 0 0 0;",
		"}",
		"",
		"/* Controls: Start / Stop buttons */",
		".atlas_tab_controls {",
		"  display: flex;",
		"  gap: 12px;",
		"  margin-bottom: 20px;",
		"  flex-wrap: wrap;",
		"  align-items: center;",
		"}",
		"",
		".atlas_tab_start_btn,",
		".atlas_tab_stop_btn {",
		"  display: inline-flex;",
		"  align-items: center;",
		"  gap: 8px;",
		"  padding: 11px 24px;",
		"  border: none;",
		"  border-radius: 8px;",
		"  font-size: 0.95em;",
		"  font-weight: 600;",
		"  cursor: pointer;",
		"  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);",
		"  position: relative;",
		"  overflow: hidden;",
		"  letter-spacing: 0.02em;",
		"}",
		"",
		".atlas_tab_start_btn::after,",
		".atlas_tab_stop_btn::after {",
		"  content: '';",
		"  position: absolute;",
		"  top: 0;",
		"  left: -100%;",
		"  width: 100%;",
		"  height: 100%;",
		"  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);",
		"  transition: left 0.5s ease;",
		"}",
		"",
		".atlas_tab_start_btn:hover:not(:disabled)::after,",
		".atlas_tab_stop_btn:hover:not(:disabled)::after {",
		"  left: 100%;",
		"}",
		"",
		".atlas_tab_start_btn {",
		"  background: linear-gradient(135deg, #3498db, #2980b9);",
		"  color: #fff;",
		"  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);",
		"}",
		"",
		".atlas_tab_start_btn:hover:not(:disabled) {",
		"  transform: translateY(-2px);",
		"  box-shadow: 0 6px 22px rgba(52, 152, 219, 0.45);",
		"}",
		"",
		".atlas_tab_start_btn:active:not(:disabled) {",
		"  transform: translateY(0px);",
		"  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);",
		"}",
		"",
		".atlas_tab_start_btn:disabled,",
		".atlas_tab_start_btn.atlas_tab_btn_disabled {",
		"  opacity: 0.45;",
		"  cursor: not-allowed;",
		"  transform: none;",
		"  box-shadow: none;",
		"}",
		"",
		".atlas_tab_stop_btn {",
		"  background: linear-gradient(135deg, #e74c3c, #c0392b);",
		"  color: #fff;",
		"  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);",
		"}",
		"",
		".atlas_tab_stop_btn:hover:not(:disabled) {",
		"  transform: translateY(-2px);",
		"  box-shadow: 0 6px 22px rgba(231, 76, 60, 0.45);",
		"}",
		"",
		".atlas_tab_stop_btn:active:not(:disabled) {",
		"  transform: translateY(0px);",
		"  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);",
		"}",
		"",
		".atlas_tab_stop_btn:disabled,",
		".atlas_tab_stop_btn.atlas_tab_btn_disabled {",
		"  opacity: 0.35;",
		"  cursor: not-allowed;",
		"  transform: none;",
		"  box-shadow: none;",
		"}",
		"",
		".atlas_btn_icon {",
		"  font-size: 1.1em;",
		"  line-height: 1;",
		"}",
		"",
		"/* Progress section */",
		".atlas_tab_progress_section {",
		"  margin-bottom: 20px;",
		"  opacity: 0;",
		"  transform: translateY(-10px);",
		"  transition: opacity 0.4s ease, transform 0.4s ease;",
		"}",
		"",
		".atlas_tab_progress_animate_in {",
		"  opacity: 1;",
		"  transform: translateY(0);",
		"}",
		"",
		".atlas_tab_progress_animate_out {",
		"  opacity: 0;",
		"  transform: translateY(-10px);",
		"}",
		"",
		"/* Progress bar outer track */",
		".atlas_tab_progress_bar_outer {",
		"  width: 100%;",
		"  height: 14px;",
		"  background: rgba(128, 128, 128, 0.12);",
		"  border-radius: 7px;",
		"  overflow: hidden;",
		"  position: relative;",
		"  box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);",
		"}",
		"",
		"/* Progress bar inner fill */",
		".atlas_tab_progress_bar_inner {",
		"  height: 100%;",
		"  width: 0%;",
		"  background: linear-gradient(90deg, #3498db, #2ecc71, #3498db);",
		"  background-size: 200% 100%;",
		"  border-radius: 7px;",
		"  transition: width 0.4s ease;",
		"  position: relative;",
		"  animation: atlas_progress_gradient 3s linear infinite;",
		"}",
		"",
		"@keyframes atlas_progress_gradient {",
		"  0% { background-position: 0% 0%; }",
		"  100% { background-position: 200% 0%; }",
		"}",
		"",
		"/* Glow sweep on the progress bar */",
		".atlas_tab_progress_bar_glow {",
		"  position: absolute;",
		"  top: 0;",
		"  left: 0;",
		"  right: 0;",
		"  bottom: 0;",
		"  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);",
		"  animation: atlas_glow_sweep 2s ease-in-out infinite;",
		"  border-radius: 7px;",
		"}",
		"",
		"@keyframes atlas_glow_sweep {",
		"  0% { transform: translateX(-100%); }",
		"  100% { transform: translateX(100%); }",
		"}",
		"",
		"/* Completed state */",
		".atlas_tab_progress_complete {",
		"  background: linear-gradient(90deg, #2ecc71, #27ae60) !important;",
		"  animation: none !important;",
		"}",
		"",
		".atlas_tab_progress_complete .atlas_tab_progress_bar_glow {",
		"  animation: none;",
		"  opacity: 0;",
		"}",
		"",
		"/* Stopped state */",
		".atlas_tab_progress_stopped {",
		"  background: linear-gradient(90deg, #f39c12, #e67e22) !important;",
		"  animation: none !important;",
		"}",
		"",
		".atlas_tab_progress_stopped .atlas_tab_progress_bar_glow {",
		"  animation: none;",
		"  opacity: 0;",
		"}",
		"",
		"/* Progress info row */",
		".atlas_tab_progress_info {",
		"  display: flex;",
		"  justify-content: space-between;",
		"  align-items: center;",
		"  margin-top: 8px;",
		"  font-size: 0.85em;",
		"}",
		"",
		".atlas_tab_progress_label {",
		"  font-weight: 600;",
		"  opacity: 0.9;",
		"  transition: all 0.3s ease;",
		"}",
		"",
		".atlas_tab_time_estimate {",
		"  opacity: 0.55;",
		"  font-style: italic;",
		"  display: flex;",
		"  align-items: center;",
		"  gap: 4px;",
		"}",
		"",
		"/* Render target */",
		".atlas_tab_render_target {",
		"  min-height: 100px;",
		"  border-radius: 10px;",
		"  overflow: hidden;",
		"  transition: all 0.4s ease;",
		"}",
		"",
		".atlas_tab_render_target:empty {",
		"  min-height: 0;",
		"}",
		"",
		".atlas_tab_render_active {",
		"  box-shadow: 0 0 30px rgba(52, 152, 219, 0.08);",
		"}",
		"",
		".atlas_tab_inner_render {",
		"  width: 100%;",
		"}",
		"",
		"/* Dark mode adjustments */",
		"@media (prefers-color-scheme: dark) {",
		"  .atlas_tab_message {",
		"    background: linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(155, 89, 182, 0.1) 100%);",
		"    border-color: rgba(52, 152, 219, 0.3);",
		"  }",
		"  .atlas_tab_progress_bar_outer {",
		"    background: rgba(255, 255, 255, 0.06);",
		"  }",
		"}",
		"",
		"/* Responsive */",
		"@media (max-width: 600px) {",
		"  .atlas_tab_wrapper {",
		"    padding: 12px;",
		"  }",
		"  .atlas_tab_controls {",
		"    flex-direction: column;",
		"  }",
		"  .atlas_tab_start_btn,",
		"  .atlas_tab_stop_btn {",
		"    width: 100%;",
		"    justify-content: center;",
		"  }",
		"  .atlas_tab_progress_info {",
		"    flex-direction: column;",
		"    gap: 4px;",
		"    align-items: flex-start;",
		"  }",
		"  .atlas_tab_message {",
		"    padding: 14px 16px;",
		"  }",
		"}"
	].join("\n");

	document.head.appendChild(style);
})();

