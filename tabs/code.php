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
			/* ===== PYODIDE EDITOR THEME ===== */
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

			.pe-toolbar {
				display: flex;
				align-items: center;
				gap: 8px;
				flex-wrap: wrap;
				padding: 10px 14px;
				background: var(--pe-surface);
				border: 1px solid var(--pe-border);
				border-radius: var(--pe-radius);
				margin-bottom: 8px;
			}

			.pe-btn {
				border: none;
				padding: 6px 14px;
				border-radius: 6px;
				cursor: pointer;
				font-weight: 600;
				font-size: 12px;
				display: inline-flex;
				align-items: center;
				gap: 5px;
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
				margin: 0 4px;
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
				padding: 8px 14px;
				font-size: 12px;
				color: var(--pe-muted);
				border-bottom: 1px solid var(--pe-border);
				display: flex;
				align-items: center;
				justify-content: space-between;
			}
			.pe-editor-header .pe-dots {
				display: flex;
				gap: 6px;
			}
			.pe-editor-header .pe-dots span {
				width: 10px;
				height: 10px;
				border-radius: 50%;
			}
			.pe-editor-header .pe-dot-red { background: #ff5f57; }
			.pe-editor-header .pe-dot-yellow { background: #ffbd2e; }
			.pe-editor-header .pe-dot-green { background: #28c840; }

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

			/* LINE NUMBERS - FIXED: use pre with white-space:pre and display:block */
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

			/* Console styling - now supports rich output */
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

			/* Rich output cells (like Jupyter) */
			.pe-output-cell {
				margin: 8px 0;
				padding: 8px;
				border: 1px solid var(--pe-border);
				border-radius: 6px;
				background: #12121f;
			}
			.pe-output-cell canvas {
				display: block;
				margin: 4px auto;
				border-radius: 4px;
				max-width: 100%;
			}
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

			#pyodide_prediction_output {
				min-width: 200px;
				max-width: 320px;
				min-height: 50px;
				max-height: 180px;
				overflow: auto;
				background: #0a1628;
				color: #61dafb;
				font-family: 'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
				font-size: 12px;
				line-height: 1.4;
				padding: 10px;
				border: 1px solid #1a3a5c;
				border-radius: 6px;
				margin: 4px 0 0 0;
				white-space: pre-wrap;
				word-wrap: break-word;
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
				<button onclick="pyodideEditorReset()" class="pe-btn pe-btn-reset pe-tooltip" data-tip="Reset Python runtime" class="pe-advanced-only">
					🔄 Reset
				</button>
				<div class="pe-separator"></div>
				<button onclick="pyodideToggleExamples()" class="pe-btn pe-btn-clear pe-tooltip" data-tip="Show examples">
					📚 Examples
				</button>
				<button id="pyodide_webcam_btn_simple" onclick="pyodideStartWebcam()" class="pe-btn pe-btn-clear pe-tooltip" data-tip="Start webcam">
					📷 Webcam
				</button>
				<button onclick="pyodideToggleMode()" class="pe-btn pe-btn-mode pe-tooltip" data-tip="Toggle Simple/Advanced">
					🔀 Mode
				</button>
				<div class="pe-separator pe-advanced-only"></div>
				<label class="pe-advanced-only" style="font-size:12px;cursor:pointer;color:var(--pe-text);display:flex;align-items:center;gap:4px;">
					<input type="checkbox" id="pyodide_live_predict" checked onchange="pyodideLivePredictChanged()" style="accent-color:var(--pe-accent);">
					Live
				</label>
				<span id="pyodide_status" class="pe-badge pe-badge-loading" style="margin-left:auto;">⏳ Not loaded</span>
				<span id="pyodide_error_indicator" style="display:none;" class="pe-badge pe-badge-error">⚠ Error</span>
			</div>

			<!-- Examples Panel (hidden by default) -->
			<div id="pyodide_examples_panel" class="pe-examples-panel">
				<div style="font-size:12px;color:var(--pe-muted);margin-bottom:8px;font-weight:600;">📚 Click an example to load it:</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('random_input')">
					<h4>🎲 Random Input</h4>
					<p>Generate random data matching your model's input shape and predict</p>
				</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('image_webcam')">
					<h4>📷 Webcam Prediction</h4>
					<p>Use your webcam as live input to the model</p>
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
					<p>View model architecture and weight shapes</p>
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
					<option value="random_input">🎲 Random Input</option>
					<option value="image_webcam">📷 Webcam</option>
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
					<span id="pyodide_fps_label" style="font-size:11px;color:var(--pe-accent2);min-width:35px;font-weight:600;">5 FPS</span>
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
						<div style="font-size:11px;color:var(--pe-muted);margin-bottom:6px;font-weight:600;">🧠 Model Input</div>
						<canvas id="pyodide_webcam_canvas" style="border-radius:8px;border:2px solid var(--pe-border);background:#000;image-rendering:pixelated;width:100px;height:100px;"></canvas>
					</div>
					<div id="pyodide_prediction_results" style="display:none; text-align:left;">
						<strong style="font-size:12px;color:var(--pe-accent2);">🎯 Prediction Results</strong>
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
					<div class="pe-dots">
						<span class="pe-dot-red"></span>
						<span class="pe-dot-yellow"></span>
						<span class="pe-dot-green"></span>
					</div>
					<span>🐍 Python Editor</span>
					<span class="pe-advanced-only" style="font-size:10px;opacity:0.7;">Ctrl+Enter: Run | Ctrl+S: Save | Tab: Indent | Ctrl+D: Duplicate</span>
				</div>
				<div class="pe-editor-body">
					<div id="pyodide_editor_line_numbers" aria-hidden="true">1
</div>
					<pre id="pyodide_editor_highlight" class="pe-hl" aria-hidden="true"></pre>
					<textarea id="pyodide_editor_textarea" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>
				</div>
			</div>

			<!-- Console Output (Rich - supports canvases, HTML, images) -->
			<div class="pe-console-container">
				<div class="pe-console-header">
					<strong>
						<span style="color:var(--pe-success);">▸</span> Console
					</strong>
					<button onclick="pyodideEditorClear()" class="pe-btn pe-btn-clear" style="padding:3px 10px;font-size:11px;">
						🧹 Clear Console
					</button>
				</div>
				<div id="pyodide_console_output"></div>
			</div>
		</div>
	</div>
</div>
