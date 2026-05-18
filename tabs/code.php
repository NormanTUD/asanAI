<div id="code_tab" class="tab">
	<ul class="navi_list">
		<li><a href="#python_tab" id="python_tab_label">Python</a></li>
		<li><a href="#python_expert_tab" id="python_expert_tab_label">Python (expert)</a></li>
		<li><a href="#html_tab" id="html_tab_label">HTML</a></li>
		<li><a href="#pyodide_editor_tab" id="pyodide_editor_tab_label">⚡ Run Python</a></li>
	</ul>

	<div id="python_tab" class="tab">
		<br>
		<span class="user_select_none">
			<button onclick="copy_id_to_clipboard('python')">
				<img src="_gui/icons/paste.svg" class="icon_small" />
				<span class="TRANSLATEME_copy_to_clipboard"></span>
			</button>
			<button onclick="save_model()">
				<img src="_gui/icons/download.svg" class="icon_small" />
				<span class="TRANSLATEME_download_model_data"></span>
			</button>
			<button id="download_with_data" onclick="download_model_for_training()">
				<img src="_gui/icons/download.svg" class="icon_small" />
				<span class="TRANSLATEME_download_for_local_taurus"></span>
			</button>
		</span>
		<br>
		<pre><code class="language-python" id="python" style="width: 99%"></code></pre>
	</div>

	<div id="python_expert_tab" class="tab">
		<br>
		<span class="user_select_none">
			<button onclick="copy_id_to_clipboard('python_expert')">
				<img src="_gui/icons/paste.svg" class="icon_small" />
				<span class="TRANSLATEME_copy_to_clipboard"></span>
			</button>
		</span>
		<br>
		<pre><code class="language-python" id="python_expert" style="width: 99%"></code></pre>
	</div>

	<div id="html_tab" class="tab">
		<br>
		<span class="user_select_none">
			<button onclick="copy_id_to_clipboard('html')">
				<img src="_gui/icons/paste.svg" class="icon_small" />
				<span class="TRANSLATEME_copy_to_clipboard"></span>
			</button>
			<button onclick="save_model()">
				<img src="_gui/icons/download.svg" class="icon_small" />
				<span class="TRANSLATEME_download_model_data"></span>
			</button>
		</span>
		<br>
		<pre><code class="language-html" id="html" style="width: 99%"></code></pre>
	</div>

	<div id="pyodide_editor_tab" class="tab">
		<br>
		<style>
			/* ===== PYODIDE EDITOR THEME (v3 — Fixed & Enhanced) ===== */
			#pyodide_editor_wrapper {
				--pe-bg: #0f0f1a;
				--pe-surface: #1a1a2e;
				--pe-surface2: #16213e;
				--pe-border: #2a2a4a;
				--pe-accent: #6c63ff;
				--pe-accent2: #00d4aa;
				--pe-text: #e0e0e0;
				--pe-muted: #888;
				--pe-success: #00d4aa;
				--pe-error: #ff6b6b;
				--pe-warning: #ffd93d;
				--pe-radius: 8px;
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
				position: relative;
			}

			#pyodide_editor_wrapper button {
				transition: all 0.15s ease;
				font-family: inherit;
			}
			#pyodide_editor_wrapper button:hover {
				transform: translateY(-1px);
				box-shadow: 0 4px 12px rgba(108, 99, 255, 0.3);
			}
			#pyodide_editor_wrapper button:active {
				transform: translateY(0);
			}

			/* Fullscreen mode */
			#pyodide_editor_wrapper.pe-fullscreen {
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				z-index: 99999;
				background: var(--pe-bg);
				padding: 16px;
				overflow-y: auto;
				border-radius: 0;
			}
			#pyodide_editor_wrapper.pe-fullscreen .pe-editor-container {
				flex: 1;
			}
			#pyodide_editor_wrapper.pe-fullscreen #pyodide_editor_textarea {
				min-height: 50vh;
				max-height: 70vh;
			}

			.pe-toolbar {
				display: flex;
				align-items: center;
				gap: 6px;
				flex-wrap: wrap;
				padding: 8px 12px;
				background: var(--pe-surface);
				border: 1px solid var(--pe-border);
				border-radius: var(--pe-radius);
				margin-bottom: 8px;
			}

			.pe-btn {
				border: none;
				padding: 6px 12px;
				border-radius: 6px;
				cursor: pointer;
				font-weight: 600;
				font-size: 12px;
				display: inline-flex;
				align-items: center;
				gap: 4px;
				white-space: nowrap;
			}
			.pe-btn-run {
				background: linear-gradient(135deg, #00d4aa, #00b894);
				color: #000;
				font-size: 13px;
			}
			.pe-btn-run:hover {
				background: linear-gradient(135deg, #00e6b8, #00d4aa);
				box-shadow: 0 4px 15px rgba(0, 212, 170, 0.4) !important;
			}
			.pe-btn-stop {
				background: linear-gradient(135deg, #ff6b6b, #ee5a24);
				color: #fff;
			}
			.pe-btn-stop:hover {
				box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4) !important;
			}
			.pe-btn-clear {
				background: var(--pe-surface2);
				color: var(--pe-text);
				border: 1px solid var(--pe-border);
			}
			.pe-btn-reset {
				background: var(--pe-surface2);
				color: var(--pe-warning);
				border: 1px solid var(--pe-border);
			}
			.pe-btn-mode {
				background: linear-gradient(135deg, #6c63ff, #5a52d5);
				color: #fff;
			}

			.pe-separator {
				width: 1px;
				height: 24px;
				background: var(--pe-border);
				margin: 0 2px;
			}

			/* Editor container */
			.pe-editor-container {
				position: relative;
				border: 1px solid var(--pe-border);
				border-radius: var(--pe-radius);
				overflow: hidden;
				box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
			}
			.pe-editor-header {
				background: var(--pe-surface);
				padding: 6px 14px;
				font-size: 12px;
				color: var(--pe-muted);
				border-bottom: 1px solid var(--pe-border);
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 8px;
			}

			.pe-editor-body {
				position: relative;
				background: #1e1e2e;
			}

			#pyodide_editor_highlight {
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				padding: 12px;
				padding-left: 52px;
				font-family: 'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
				font-size: 13px;
				line-height: 1.6;
				white-space: pre-wrap;
				word-wrap: break-word;
				overflow: hidden;
				pointer-events: none;
				color: transparent;
				tab-size: 4;
				border: none;
				margin: 0;
			}

			#pyodide_editor_textarea {
				position: relative;
				z-index: 2;
				width: 100%;
				min-height: 320px;
				max-height: 60vh;
				font-family: 'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
				font-size: 13px;
				line-height: 1.6;
				padding: 12px;
				padding-left: 52px;
				border: none;
				outline: none;
				resize: vertical;
				tab-size: 4;
				white-space: pre-wrap;
				word-wrap: break-word;
				overflow-y: auto;
				overflow-x: hidden;
				background: transparent;
				color: transparent;
				caret-color: #fff;
				box-sizing: border-box;
				display: block;
			}

			#pyodide_editor_line_numbers {
				position: absolute;
				top: 0;
				left: 0;
				width: 40px;
				padding: 12px 6px 12px 0;
				text-align: right;
				font-family: 'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
				font-size: 13px;
				line-height: 1.6;
				color: #555;
				background: #181825;
				border-right: 1px solid var(--pe-border);
				user-select: none;
				pointer-events: none;
				z-index: 3;
				overflow: hidden;
				white-space: pre;
				display: block;
				margin: 0;
			}

			/* Syntax colors (Catppuccin-inspired) */
			.pe-hl .kw { color: #cba6f7; font-weight: 500; }
			.pe-hl .bi { color: #89dceb; }
			.pe-hl .fn { color: #89b4fa; }
			.pe-hl .st { color: #a6e3a1; }
			.pe-hl .cm { color: #6c7086; font-style: italic; }
			.pe-hl .nu { color: #fab387; }
			.pe-hl .op { color: #89dceb; }
			.pe-hl .dc { color: #f9e2af; }
			.pe-hl .sf { color: #f38ba8; }
			.pe-hl .cn { color: #fab387; font-weight: 500; }
			.pe-hl .tx { color: #cdd6f4; }

			/* Console styling */
			.pe-console-container {
				margin-top: 10px;
				border: 1px solid var(--pe-border);
				border-radius: var(--pe-radius);
				overflow: hidden;
				box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
			}
			.pe-console-header {
				background: var(--pe-surface);
				padding: 6px 14px;
				display: flex;
				align-items: center;
				justify-content: space-between;
				border-bottom: 1px solid var(--pe-border);
			}
			.pe-console-header strong {
				font-size: 12px;
				color: var(--pe-muted);
				display: flex;
				align-items: center;
				gap: 6px;
			}

			#pyodide_console_output {
				width: 100%;
				min-height: 140px;
				max-height: 400px;
				overflow: auto;
				background: #0b0b14;
				color: #00ff88;
				font-family: 'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
				font-size: 12px;
				line-height: 1.5;
				padding: 12px;
				margin: 0;
				white-space: pre-wrap;
				word-wrap: break-word;
				box-sizing: border-box;
			}

			/* Rich output cells */
			.pe-output-cell {
				margin: 8px 0;
				padding: 8px;
				border: 1px solid var(--pe-border);
				border-radius: 6px;
				background: #12121f;
			}
			.pe-output-cell canvas,
			.pe-output-cell img {
				display: block;
				margin: 4px auto;
				border-radius: 4px;
				max-width: 100%;
			}
			.pe-output-cell .pe-html-output {
				color: var(--pe-text);
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
				font-size: 13px;
			}
			.pe-output-cell .pe-html-output table {
				border-collapse: collapse;
				margin: 4px 0;
				width: 100%;
			}
			.pe-output-cell .pe-html-output th,
			.pe-output-cell .pe-html-output td {
				border: 1px solid var(--pe-border);
				padding: 4px 8px;
				font-size: 12px;
			}
			.pe-output-cell .pe-html-output th {
				background: var(--pe-surface);
				color: var(--pe-accent2);
			}

			/* Input source bar */
			.pe-input-bar {
				display: flex;
				align-items: center;
				gap: 8px;
				flex-wrap: wrap;
				padding: 8px 14px;
				background: linear-gradient(135deg, var(--pe-surface), var(--pe-surface2));
				border: 1px solid var(--pe-border);
				border-radius: var(--pe-radius);
				margin-bottom: 8px;
			}
			.pe-input-bar label,
			.pe-input-bar button {
				font-size: 12px;
			}

			.pe-badge {
				display: inline-flex;
				align-items: center;
				gap: 4px;
				padding: 3px 8px;
				border-radius: 12px;
				font-size: 10px;
				font-weight: 600;
				text-transform: uppercase;
				letter-spacing: 0.5px;
			}
			.pe-badge-ready {
				background: rgba(0, 212, 170, 0.15);
				color: var(--pe-success);
				border: 1px solid rgba(0, 212, 170, 0.3);
			}
			.pe-badge-loading {
				background: rgba(108, 99, 255, 0.15);
				color: var(--pe-accent);
				border: 1px solid rgba(108, 99, 255, 0.3);
				animation: pe-pulse 1.5s infinite;
			}
			.pe-badge-error {
				background: rgba(255, 107, 107, 0.15);
				color: var(--pe-error);
				border: 1px solid rgba(255, 107, 107, 0.3);
			}

			@keyframes pe-pulse {
				0%, 100% { opacity: 1; }
				50% { opacity: 0.5; }
			}

			/* Webcam & prediction */
			.pe-media-container {
				display: none;
				margin-bottom: 8px;
				padding: 12px;
				background: var(--pe-bg);
				border-radius: var(--pe-radius);
				border: 1px solid var(--pe-border);
				text-align: center;
			}

			/* FIX: Prediction output wider to prevent bar overflow */
			#pyodide_prediction_output {
				min-width: 200px;
				max-width: 480px;
				min-height: 50px;
				max-height: 220px;
				overflow: auto;
				background: #0a1628;
				color: #61dafb;
				font-family: 'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
				font-size: 11px;
				line-height: 1.4;
				padding: 10px;
				border: 1px solid #1a3a5c;
				border-radius: 6px;
				margin: 4px 0 0 0;
				white-space: pre;
				word-wrap: normal;
				overflow-x: auto;
				box-sizing: border-box;
			}

			/* Tooltip */
			.pe-tooltip {
				position: relative;
			}
			.pe-tooltip::after {
				content: attr(data-tip);
				position: absolute;
				bottom: 120%;
				left: 50%;
				transform: translateX(-50%);
				background: #333;
				color: #fff;
				padding: 4px 8px;
				border-radius: 4px;
				font-size: 10px;
				white-space: nowrap;
				opacity: 0;
				pointer-events: none;
				transition: opacity 0.2s;
				z-index: 100;
			}
			.pe-tooltip:hover::after {
				opacity: 1;
			}

			/* Simple mode hides advanced stuff */
			#pyodide_editor_wrapper.pe-simple-mode .pe-advanced-only {
				display: none !important;
			}
			#pyodide_editor_wrapper.pe-simple-mode .pe-editor-container {
				min-height: 200px;
			}
			#pyodide_editor_wrapper.pe-simple-mode #pyodide_editor_textarea {
				min-height: 200px;
			}

			/* Examples panel */
			.pe-examples-panel {
				display: none;
				margin-bottom: 8px;
				padding: 12px;
				background: var(--pe-surface);
				border: 1px solid var(--pe-border);
				border-radius: var(--pe-radius);
				max-height: 300px;
				overflow-y: auto;
			}
			.pe-examples-panel.pe-visible {
				display: block;
			}
			.pe-example-card {
				padding: 10px 12px;
				margin: 6px 0;
				background: var(--pe-surface2);
				border: 1px solid var(--pe-border);
				border-radius: 6px;
				cursor: pointer;
				transition: all 0.15s ease;
			}
			.pe-example-card:hover {
				border-color: var(--pe-accent);
				background: rgba(108, 99, 255, 0.1);
				transform: translateX(4px);
			}
			.pe-example-card h4 {
				margin: 0 0 4px 0;
				font-size: 13px;
				color: var(--pe-accent2);
			}
			.pe-example-card p {
				margin: 0;
				font-size: 11px;
				color: var(--pe-muted);
			}

			/* Fullscreen mode */
			#pyodide_editor_wrapper.pe-fullscreen {
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				z-index: 99999;
				background: var(--pe-bg);
				padding: 16px;
				overflow-y: auto;
				border-radius: 0;
			}
			#pyodide_editor_wrapper.pe-fullscreen #pyodide_editor_textarea {
				min-height: 50vh;
				max-height: 70vh;
			}

			/* Autosave indicator */
			#pyodide_autosave_indicator {
				font-size: 10px;
				color: var(--pe-success);
				opacity: 0;
				transition: opacity 0.3s ease;
				margin-left: 8px;
			}

			/* FPS counter */
			#pyodide_fps_label {
				font-size: 11px;
				color: var(--pe-accent2);
				min-width: 55px;
				font-weight: 600;
				font-variant-numeric: tabular-nums;
			}

			/* Keyboard shortcuts help */
			.pe-shortcuts-hint {
				font-size: 10px;
				color: var(--pe-muted);
				opacity: 0.7;
			}
			.pe-shortcuts-hint kbd {
				background: var(--pe-surface2);
				border: 1px solid var(--pe-border);
				border-radius: 3px;
				padding: 1px 4px;
				font-size: 9px;
				font-family: inherit;
			}
		</style>

		<div id="pyodide_editor_wrapper">
			<!-- Toolbar Row 1: Run controls -->
			<div class="pe-toolbar">
				<button id="pyodide_run_btn" onclick="pyodideEditorRun()" class="pe-btn pe-btn-run pe-tooltip" data-tip="Ctrl+Enter">
					▶ Run
				</button>
				<button id="pyodide_stop_btn" onclick="pyodideEditorStop()" class="pe-btn pe-btn-stop" disabled>
					⏹ Stop
				</button>
				<div class="pe-separator"></div>
				<button onclick="pyodideEditorClear()" class="pe-btn pe-btn-clear pe-tooltip" data-tip="Clear output">
					🧹 Clear
				</button>
				<button onclick="pyodideEditorReset()" class="pe-btn pe-btn-reset pe-tooltip pe-advanced-only" data-tip="Reset Python runtime">
					🔄 Reset
				</button>
				<div class="pe-separator"></div>
				<button onclick="pyodideToggleExamples()" class="pe-btn pe-btn-clear pe-tooltip" data-tip="Show examples">
					📚 Examples
				</button>
				<button id="pyodide_webcam_btn_simple" onclick="pyodideStartWebcam()" class="pe-btn pe-btn-clear pe-tooltip" data-tip="Ctrl+Shift+W">
					📷 Webcam
				</button>
				<button id="pyodide_snapshot_btn" onclick="pyodideSnapshot()" class="pe-btn pe-btn-clear pe-tooltip" data-tip="Take a single photo">
				    📸 Snap
				</button>
				<button id="pyodide_snapshot_btn_adv" onclick="pyodideSnapshot()" class="pe-btn pe-btn-clear" style="font-size:12px;">
				    📸 Snapshot
				</button>
				<button onclick="pyodideToggleMode()" class="pe-btn pe-btn-mode pe-tooltip" data-tip="Toggle Simple/Advanced">
					🔀 Mode
				</button>
				<div class="pe-separator pe-advanced-only"></div>
				<button onclick="pyodideToggleFullscreen()" class="pe-btn pe-btn-clear pe-advanced-only pe-tooltip" data-tip="Ctrl+Shift+F">
					⛶ Fullscreen
				</button>
				<button onclick="pyodideCopyOutput()" class="pe-btn pe-btn-clear pe-advanced-only pe-tooltip" data-tip="Copy console output">
					📋 Copy
				</button>
				<button onclick="pyodideDownloadOutput()" class="pe-btn pe-btn-clear pe-advanced-only pe-tooltip" data-tip="Download output as .txt">
					📥 Save
				</button>
				<div class="pe-separator pe-advanced-only"></div>
				<label class="pe-advanced-only" style="font-size:12px;cursor:pointer;color:var(--pe-text);display:flex;align-items:center;gap:4px;">
					<input type="checkbox" id="pyodide_live_predict" checked onchange="pyodideLivePredictChanged()" style="accent-color:var(--pe-accent);">
					Live
				</label>
				<span id="pyodide_status" class="pe-badge pe-badge-loading" style="margin-left:auto;">⏳ Not loaded</span>
				<span id="pyodide_error_indicator" style="display:none;" class="pe-badge pe-badge-error">⚠ Error</span>
				<span id="pyodide_autosave_indicator"></span>
			</div>

			<!-- Examples Panel (hidden by default) -->
			<div id="pyodide_examples_panel" class="pe-examples-panel">
				<div style="font-size:12px;color:var(--pe-muted);margin-bottom:8px;font-weight:600;">📚 Click an example to load it:</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('hello_world')">
					<h4>👋 Hello World</h4>
					<p>The simplest example — print and explore available functions</p>
				</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('random_input')">
					<h4>🎲 Random Input</h4>
					<p>Generate random data matching your model's input shape and predict</p>
				</div>
				<div class="pe-example-card" data-requires="image" onclick="pyodideLoadTemplate('image_webcam')">
				    <h4>📷 Webcam Prediction</h4>
				    <p>Use your webcam as live input — auto-starts camera</p>
				</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('image_upload')">
					<h4>🖼️ Image Upload</h4>
					<p>Upload an image and run prediction on it</p>
				</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('custom_data')">
					<h4>✏️ Custom Data</h4>
					<p>Enter your own data manually and predict</p>
				</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('weights_inspect')">
					<h4>🔍 Inspect Weights</h4>
					<p>View model architecture and weight shapes in detail</p>
				</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('draw_chart')">
					<h4>📊 Draw a Chart</h4>
					<p>Draw a bar chart in the console using canvas</p>
				</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('draw_canvas')">
					<h4>🎨 Custom Canvas</h4>
					<p>Draw shapes, gradients, and patterns on a canvas</p>
				</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('html_table')">
					<h4>📋 HTML Table</h4>
					<p>Render a styled HTML table in the console</p>
				</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('pixel_art')">
					<h4>🕹️ Pixel Art</h4>
					<p>Draw pixel art on a tiny canvas, scaled up</p>
				</div>
				<div class="pe-example-card" data-requires="image" onclick="pyodideLoadTemplate('image_snapshot_rps')">
				    <h4>✊✋✌️ RPS — 2 Players (Snapshots)</h4>
				    <p>Take turns! Each player snaps a photo. Compare predictions to find the winner.</p>
				</div>
			</div>

			<!-- Toolbar Row 2: Input sources (advanced only) -->
			<div class="pe-input-bar pe-advanced-only">
				<span style="font-size:11px;color:var(--pe-muted);font-weight:600;">INPUT:</span>
				<button id="pyodide_webcam_btn" onclick="pyodideStartWebcam()" class="pe-btn pe-btn-clear" style="font-size:12px;">
					📷 Webcam
				</button>
				<label class="pe-btn pe-btn-clear" style="font-size:12px;cursor:pointer;">
					📁 Upload Image
					<input type="file" accept="image/*" onchange="pyodideHandleImageUpload(event)" style="display:none;">
				</label>
				<div class="pe-separator"></div>
				<span style="font-size:11px;color:var(--pe-muted);font-weight:600;">TEMPLATE:</span>
				<select onchange="if(this.value)pyodideLoadTemplate(this.value);this.value='';" style="padding:4px 8px;border-radius:6px;font-size:11px;background:var(--pe-surface2);color:var(--pe-text);border:1px solid var(--pe-border);cursor:pointer;">
					<option value="">Select...</option>
					<option value="hello_world">👋 Hello World</option>
					<option value="random_input">🎲 Random Input</option>
					<option value="image_webcam" data-requires="image">📷 Webcam</option>
					<option value="image_upload">🖼️ Image Upload</option>
					<option value="custom_data">✏️ Custom Data</option>
					<option value="weights_inspect">🔍 Inspect Weights</option>
					<option value="draw_chart">📊 Draw Chart</option>
					<option value="draw_canvas">🎨 Canvas Art</option>
					<option value="html_table">📋 HTML Table</option>
					<option value="pixel_art">🕹️ Pixel Art</option>
				</select>
				<span style="margin-left:auto;display:flex;align-items:center;gap:6px;">
					<label style="font-size:11px;color:var(--pe-muted);">FPS:</label>
					<input type="range" min="1" max="15" value="5" oninput="pyodideSetWebcamFPS(this.value)" style="width:60px;cursor:pointer;accent-color:var(--pe-accent);">
					<span id="pyodide_fps_label">5 FPS</span>
				</span>
			</div>

			<!-- Webcam container (hidden by default) -->
			<div id="pyodide_webcam_container" class="pe-media-container">
				<div style="display:flex; align-items:flex-start; gap:16px; justify-content:center; flex-wrap:wrap;">
					<div>
						<div style="font-size:11px;color:var(--pe-muted);margin-bottom:6px;font-weight:600;">📹 Camera Feed</div>
						<video id="pyodide_webcam_video" autoplay playsinline muted style="max-width:200px;border-radius:8px;border:2px solid var(--pe-border);background:#000;"></video>
					</div>
					<div>
						<div style="font-size:11px;color:var(--pe-muted);margin-bottom:6px;font-weight:600;">🤖 Model Input</div>
						<canvas id="pyodide_webcam_canvas" style="border-radius:8px;border:2px solid var(--pe-border);background:#000;image-rendering:pixelated;width:100px;height:100px;"></canvas>
					</div>
					<div id="pyodide_prediction_results" style="display:none; text-align:left;">
						<strong style="font-size:12px;color:var(--pe-accent2);">🎯 Live Prediction</strong>
						<pre id="pyodide_prediction_output"></pre>
					</div>
				</div>
			</div>

			<!-- Image preview (hidden by default) -->
			<div id="pyodide_image_preview" class="pe-media-container">
				<div style="font-size:11px;color:var(--pe-muted);margin-bottom:6px;font-weight:600;">🖼️ Uploaded Image (resized to model input)</div>
				<canvas id="pyodide_image_canvas" style="border-radius:8px;border:2px solid var(--pe-border);background:#000;max-width:200px;"></canvas>
			</div>

			<!-- Editor with syntax highlighting -->
			<div class="pe-editor-container">
				<div class="pe-editor-header">
					<span>🐍 Python Editor</span>
					<span class="pe-shortcuts-hint pe-advanced-only">
						<kbd>Ctrl</kbd>+<kbd>Enter</kbd> Run &nbsp;
						<kbd>Ctrl</kbd>+<kbd>S</kbd> Save &nbsp;
						<kbd>Ctrl</kbd>+<kbd>/</kbd> Comment &nbsp;
						<kbd>Esc</kbd> Stop
					</span>
					<span style="display:flex;align-items:center;gap:4px;" class="pe-advanced-only">
						<button onclick="pyodideChangeFontSize(-1)" class="pe-btn pe-btn-clear" style="padding:2px 6px;font-size:10px;" title="Decrease font">A-</button>
						<span id="pyodide_fontsize_label" style="font-size:10px;color:var(--pe-muted);min-width:28px;text-align:center;">13px</span>
						<button onclick="pyodideChangeFontSize(1)" class="pe-btn pe-btn-clear" style="padding:2px 6px;font-size:10px;" title="Increase font">A+</button>
						<button onclick="pyodideToggleWordWrap()" class="pe-btn pe-btn-clear" style="padding:2px 6px;font-size:10px;" title="Toggle word wrap">↩</button>
					</span>
				</div>
				<div class="pe-editor-body">
					<div id="pyodide_editor_line_numbers" aria-hidden="true">1
</div>
					<pre id="pyodide_editor_highlight" class="pe-hl" aria-hidden="true"></pre>
					<textarea id="pyodide_editor_textarea" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>
				</div>
			</div>

			<!-- Console Output -->
			<div class="pe-console-container">
				<div class="pe-console-header">
					<strong>
						<span style="color:var(--pe-success);">▸</span> Console
					</strong>
					<span style="display:flex;align-items:center;gap:6px;">
						<button onclick="pyodideCopyOutput()" class="pe-btn pe-btn-clear" style="padding:3px 8px;font-size:11px;" title="Copy output">
							📋
						</button>
						<button onclick="pyodideDownloadOutput()" class="pe-btn pe-btn-clear" style="padding:3px 8px;font-size:11px;" title="Download output">
							📥
						</button>
						<button onclick="pyodideEditorClear()" class="pe-btn pe-btn-clear" style="padding:3px 10px;font-size:11px;">
							🧹 Clear
						</button>
					</span>
				</div>
				<div id="pyodide_console_output"></div>
			</div>
		</div>
	</div>
</div>
