<div id="code_tab" class="tab">
	<ul class="navi_list">
		<li><a href="#python_tab" id="python_tab_label">Python</a></li>
		<li><a href="#python_expert_tab" id="python_expert_tab_label">Python (expert)</a></li>
		<li><a href="#html_tab" id="html_tab_label">HTML</a></li>
		<li><a href="#pyodide_editor_tab" id="pyodide_editor_tab_label">Run Python</a></li>
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
		<div id="pyodide_editor_wrapper">
			<!-- Toolbar Row 1: Run controls -->
			<div class="user_select_none" style="margin-bottom: 6px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
				<button id="pyodide_run_btn" onclick="pyodideEditorRun()" title="Run code (Ctrl+Enter)" style="background:#2a7a2a;color:#fff;border:none;padding:5px 12px;border-radius:4px;cursor:pointer;font-weight:bold;">
					&#9654; Run
				</button>
				<button id="pyodide_stop_btn" onclick="pyodideEditorStop()" title="Stop execution" disabled style="background:#7a2a2a;color:#fff;border:none;padding:5px 12px;border-radius:4px;cursor:pointer;">
					&#9632; Stop
				</button>
				<button onclick="pyodideEditorClear()" title="Clear console" style="padding:5px 10px;border-radius:4px;cursor:pointer;">
					&#128465; Clear
				</button>
				<button onclick="pyodideEditorReset()" title="Reset runtime" style="padding:5px 10px;border-radius:4px;cursor:pointer;">
					&#128260; Reset
				</button>
				<span style="margin-left:8px;border-left:1px solid #555;padding-left:8px;">
					<label style="font-size:12px;cursor:pointer;">
						<input type="checkbox" id="pyodide_live_predict" checked onchange="pyodideLivePredictChanged()">
						Live
					</label>
				</span>
				<span id="pyodide_status" style="margin-left:auto;font-size:11px;color:#888;">Pyodide: not loaded</span>
			</div>

			<!-- Toolbar Row 2: Input sources -->
			<div class="user_select_none" style="margin-bottom: 8px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 6px; background: #1a1a2e; border-radius: 4px; border: 1px solid #333;">
				<span style="font-size:11px;color:#aaa;margin-right:4px;">Input:</span>
				<button id="pyodide_webcam_btn" onclick="pyodideStartWebcam()" title="Start webcam for live predictions" style="padding:4px 10px;border-radius:4px;cursor:pointer;font-size:12px;">
					&#128247; Webcam
				</button>
				<label style="padding:4px 10px;border-radius:4px;cursor:pointer;font-size:12px;background:#333;border:1px solid #555;color:#ddd;">
					&#128193; Upload Image
					<input type="file" accept="image/*" onchange="pyodideHandleImageUpload(event)" style="display:none;">
				</label>
				<span style="margin-left:8px;border-left:1px solid #444;padding-left:8px;font-size:11px;color:#aaa;">Template:</span>
				<select onchange="if(this.value)pyodideLoadTemplate(this.value);this.value='';" style="padding:3px 6px;border-radius:4px;font-size:11px;background:#222;color:#ddd;border:1px solid #555;cursor:pointer;">
					<option value="">Select...</option>
					<option value="random_input">Random Input</option>
					<option value="image_webcam">Webcam</option>
					<option value="image_upload">Image Upload</option>
					<option value="custom_data">Custom Data</option>
					<option value="weights_inspect">Inspect Weights</option>
				</select>
				<span style="margin-left:auto;display:flex;align-items:center;gap:4px;">
					<label style="font-size:11px;color:#aaa;">FPS:</label>
					<input type="range" min="1" max="15" value="5" oninput="pyodideSetWebcamFPS(this.value)" style="width:60px;cursor:pointer;">
					<span id="pyodide_fps_label" style="font-size:11px;color:#aaa;min-width:35px;">5 FPS</span>
				</span>
			</div>

			<!-- Webcam container (hidden by default) — now includes Prediction Results -->
			<div id="pyodide_webcam_container" style="display:none; margin-bottom:8px; padding:8px; background:#0a0a0a; border-radius:4px; border:1px solid #333; text-align:center;">
				<div style="display:flex; align-items:flex-start; gap:12px; justify-content:center; flex-wrap:wrap;">
					<div>
						<div style="font-size:11px;color:#888;margin-bottom:4px;">Camera Feed</div>
						<video id="pyodide_webcam_video" autoplay playsinline muted style="max-width:200px;border-radius:4px;border:1px solid #444;background:#000;"></video>
					</div>
					<div>
						<div style="font-size:11px;color:#888;margin-bottom:4px;">Model Input</div>
						<canvas id="pyodide_webcam_canvas" style="border-radius:4px;border:1px solid #444;background:#000;image-rendering:pixelated;width:100px;height:100px;"></canvas>
					</div>
					<div id="pyodide_prediction_results" style="display:none; text-align:left;">
						<strong style="font-size:12px;color:#aaa;">Prediction Results</strong>
						<pre id="pyodide_prediction_output" style="
							min-width: 200px;
							max-width: 300px;
							min-height: 50px;
							max-height: 180px;
							overflow: auto;
							background: #0a1628;
							color: #61dafb;
							font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
							font-size: 12px;
							line-height: 1.4;
							padding: 10px;
							border: 1px solid #1a3a5c;
							border-radius: 4px;
							margin: 4px 0 0 0;
							white-space: pre-wrap;
							word-wrap: break-word;
							box-sizing: border-box;
						"></pre>
					</div>
				</div>
			</div>

			<!-- Image preview (hidden by default) -->
			<div id="pyodide_image_preview" style="display:none; margin-bottom:8px; padding:8px; background:#0a0a0a; border-radius:4px; border:1px solid #333; text-align:center;">
				<div style="font-size:11px;color:#888;margin-bottom:4px;">Uploaded Image (resized to model input)</div>
				<canvas id="pyodide_image_canvas" style="border-radius:4px;border:1px solid #444;background:#000;max-width:200px;"></canvas>
			</div>

			<!-- Editor -->
			<div style="position:relative; border:1px solid #444; border-radius:4px; overflow:hidden;">
				<div style="background:#252526;padding:4px 10px;font-size:11px;color:#888;border-bottom:1px solid #333;display:flex;align-items:center;justify-content:space-between;">
					<span>Python Editor</span>
					<span style="font-size:10px;">Ctrl+Enter: Run | Ctrl+S: Save | Tab: Indent | Ctrl+D: Duplicate</span>
				</div>
				<textarea id="pyodide_editor_textarea" spellcheck="false" style="
					width: 100%;
					min-height: 300px;
					max-height: 60vh;
					font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
					font-size: 13px;
					line-height: 1.5;
					padding: 12px;
					border: none;
					outline: none;
					resize: vertical;
					tab-size: 4;
					white-space: pre;
					overflow: auto;
					background: #1e1e1e;
					color: #d4d4d4;
					box-sizing: border-box;
					display: block;
				"></textarea>
			</div>

			<!-- Console Output -->
			<div style="margin-top:8px;">
				<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
					<strong style="font-size:12px;color:#aaa;">Console</strong>
					<span id="pyodide_error_indicator" style="display:none;color:#ff5555;font-size:11px;font-weight:bold;">&#9888; Error</span>
				</div>
				<pre id="pyodide_console_output" style="
					width: 100%;
					min-height: 100px;
					max-height: 250px;
					overflow: auto;
					background: #0d0d0d;
					color: #00ff00;
					font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
					font-size: 12px;
					line-height: 1.4;
					padding: 10px;
					border: 1px solid #333;
					border-radius: 4px;
					margin: 0;
					white-space: pre-wrap;
					word-wrap: break-word;
					box-sizing: border-box;
				"></pre>
			</div>
		</div>
	</div>
</div>
