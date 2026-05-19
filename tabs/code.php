<div id="code_tab" class="tab">
	<ul class="navi_list">
		<li><a href="#python_tab" id="python_tab_label"><span class="TRANSLATEME_python_tab"></span></a></li>
		<li><a href="#python_expert_tab" id="python_expert_tab_label"><span class="TRANSLATEME_python_expert_tab"></span></a></li>
		<li><a href="#html_tab" id="html_tab_label"><span class="TRANSLATEME_html_tab"></span></a></li>
		<li><a href="#pyodide_editor_tab" id="pyodide_editor_tab_label"><span class="TRANSLATEME_run_python_tab"></span></a></li>
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
			<div class="pe-toolbar">
				<button id="pyodide_run_btn" onclick="pyodideEditorRun()" class="pe-btn pe-btn-run pe-tooltip" data-tip="Ctrl+Enter">
					▶ <span class="TRANSLATEME_pe_run"></span>
				</button>
				<button id="pyodide_stop_btn" onclick="pyodideEditorStop()" class="pe-btn pe-btn-stop" disabled>
					⏹ <span class="TRANSLATEME_pe_stop"></span>
				</button>
				<div class="pe-separator"></div>
				<button onclick="pyodideEditorClear()" class="pe-btn pe-btn-clear pe-tooltip" data-tip="Clear output">
					🧹 <span class="TRANSLATEME_pe_clear"></span>
				</button>
				<button onclick="pyodideEditorReset()" class="pe-btn pe-btn-reset pe-tooltip pe-advanced-only" data-tip="Reset Python runtime">
					🔄 <span class="TRANSLATEME_pe_reset"></span>
				</button>
				<div class="pe-separator"></div>
				<button onclick="pyodideToggleExamples()" class="pe-btn pe-btn-clear pe-tooltip" data-tip="Show examples">
					📚 <span class="TRANSLATEME_pe_examples"></span>
				</button>
				<button id="pyodide_webcam_btn_simple" onclick="pyodideStartWebcam()" class="pe-btn pe-btn-clear pe-tooltip" data-tip="Ctrl+Shift+W">
					📷 <span class="TRANSLATEME_pe_webcam"></span>
				</button>
				<button id="pyodide_snapshot_btn" onclick="pyodideSnapshot()" class="pe-btn pe-btn-clear pe-tooltip" data-tip="Take a single photo">
				    📸 <span class="TRANSLATEME_pe_snap_single_photo"></span>
				</button>
				<button id="pyodide_photos_btn" onclick="pyodideTogglePhotos()" class="pe-btn pe-btn-clear pe-tooltip" data-tip="Capture a group of photos">
				    📸 <span class="TRANSLATEME_pe_multi_snap"></span>
				</button>
				<!--
				<button onclick="pyodideToggleMode()" class="pe-btn pe-btn-mode pe-tooltip" data-tip="Toggle Simple/Advanced">
					🔀 <span class="TRANSLATEME_pe_mode"></span>
				</button>
				-->
				<div class="pe-separator pe-advanced-only"></div>
				<button onclick="pyodideCopyOutput()" class="pe-btn pe-btn-clear pe-advanced-only pe-tooltip" data-tip="Copy console output">
					📋 <span class="TRANSLATEME_pe_copy"></span>
				</button>
				<button onclick="pyodideDownloadOutput()" class="pe-btn pe-btn-clear pe-advanced-only pe-tooltip" data-tip="Download output as .txt">
					📥 <span class="TRANSLATEME_pe_save"></span>
				</button>
				<div class="pe-separator pe-advanced-only"></div>
				<label class="pe-advanced-only" style="font-size:12px;cursor:pointer;color:var(--pe-text);display:flex;align-items:center;gap:4px;">
					<input type="checkbox" id="pyodide_live_predict" checked onchange="pyodideLivePredictChanged()" style="accent-color:var(--pe-accent);">
					<span class="TRANSLATEME_pe_live"></span>
				</label>
				<span id="pyodide_status" class="pe-badge pe-badge-loading" style="margin-left:auto;">⏳ <span class="TRANSLATEME_pe_not_loaded"></span></span>
				<span id="pyodide_error_indicator" style="display:none;" class="pe-badge pe-badge-error">⚠ <span class="TRANSLATEME_pe_error_indicator"></span></span>
				<span id="pyodide_autosave_indicator"></span>
			</div>

			<!-- Examples Panel (hidden by default) -->
			<div id="pyodide_examples_panel" class="pe-examples-panel">
				<div class="pe-example-card" onclick="pyodideLoadTemplate('hello_world')">
					<h4>👋 <span class="TRANSLATEME_pe_example_hello_world"></span></h4>
					<p><span class="TRANSLATEME_pe_example_hello_world_desc"></span></p>
				</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('random_input')">
					<h4>🎲 <span class="TRANSLATEME_pe_example_random_input"></span></h4>
					<p><span class="TRANSLATEME_pe_example_random_input_desc"></span></p>
				</div>
				<div class="pe-example-card" data-requires="image" onclick="pyodideLoadTemplate('image_webcam')">
				    <h4>📷 <span class="TRANSLATEME_pe_example_webcam_prediction"></span></h4>
				    <p><span class="TRANSLATEME_pe_example_webcam_prediction_desc"></span></p>
				</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('image_upload')">
					<h4>🖼️ <span class="TRANSLATEME_pe_example_image_upload"></span></h4>
					<p><span class="TRANSLATEME_pe_example_image_upload_desc"></span></p>
				</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('custom_data')">
					<h4>✏️ <span class="TRANSLATEME_pe_example_custom_data"></span></h4>
					<p><span class="TRANSLATEME_pe_example_custom_data_desc"></span></p>
				</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('weights_inspect')">
					<h4>🔍 <span class="TRANSLATEME_pe_example_inspect_weights"></span></h4>
					<p><span class="TRANSLATEME_pe_example_inspect_weights_desc"></span></p>
				</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('draw_chart')">
					<h4>📊 <span class="TRANSLATEME_pe_example_draw_chart"></span></h4>
					<p><span class="TRANSLATEME_pe_example_draw_chart_desc"></span></p>
				</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('draw_canvas')">
					<h4>🎨 <span class="TRANSLATEME_pe_example_custom_canvas"></span></h4>
					<p><span class="TRANSLATEME_pe_example_custom_canvas_desc"></span></p>
				</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('html_table')">
					<h4>📋 <span class="TRANSLATEME_pe_example_html_table"></span></h4>
					<p><span class="TRANSLATEME_pe_example_html_table_desc"></span></p>
				</div>
				<div class="pe-example-card" onclick="pyodideLoadTemplate('pixel_art')">
					<h4>🕹️ <span class="TRANSLATEME_pe_example_pixel_art"></span></h4>
					<p><span class="TRANSLATEME_pe_example_pixel_art_desc"></span></p>
				</div>
				<div class="pe-example-card" data-requires="image" onclick="pyodideLoadTemplate('image_snapshot_rps')">
				    <h4>✊✋✌️ <span class="TRANSLATEME_pe_example_rps"></span></h4>
				    <p><span class="TRANSLATEME_pe_example_rps_desc"></span></p>
				</div>
				<div class="pe-example-card" data-requires="image" onclick="pyodideLoadTemplate('image_group_battle')">
				    <h4>⚔️ <span class="TRANSLATEME_pe_example_group_battle"></span></h4>
				    <p><span class="TRANSLATEME_pe_example_group_battle_desc"></span></p>
				</div>
			</div>

			<!-- Toolbar Row 2: Input sources (advanced only) -->
			<div class="pe-input-bar pe-advanced-only">
				<span style="font-size:11px;color:var(--pe-muted);font-weight:600;"><span class="TRANSLATEME_pe_input_label"></span></span>
				<button id="pyodide_webcam_btn" onclick="pyodideStartWebcam()" class="pe-btn pe-btn-clear" style="font-size:12px;">
					📷 <span class="TRANSLATEME_pe_webcam"></span>
				</button>
				<label class="pe-btn pe-btn-clear" style="font-size:12px;cursor:pointer;">
					📁 <span class="TRANSLATEME_pe_upload_image"></span>
					<input type="file" accept="image/*" onchange="pyodideHandleImageUpload(event)" style="display:none;">
				</label>
				<div class="pe-separator"></div>
				<span style="font-size:11px;color:var(--pe-muted);font-weight:600;"><span class="TRANSLATEME_pe_template_label"></span></span>
				<select onchange="if(this.value)pyodideLoadTemplate(this.value);this.value='';" style="padding:4px 8px;border-radius:6px;font-size:11px;background:var(--pe-surface2);color:var(--pe-text);border:1px solid var(--pe-border);cursor:pointer;">
					<option value=""><span class="TRANSLATEME_pe_select"></span></option>
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
						<div style="font-size:11px;color:var(--pe-muted);margin-bottom:6px;font-weight:600;">📹 <span class="TRANSLATEME_pe_camera_feed"></span></div>
						<video id="pyodide_webcam_video" autoplay playsinline muted style="max-width:200px;border-radius:8px;border:2px solid var(--pe-border);background:#000;"></video>
					</div>
					<div>
						<div style="font-size:11px;color:var(--pe-muted);margin-bottom:6px;font-weight:600;">🤖 <span class="TRANSLATEME_pe_model_input"></span></div>
						<canvas id="pyodide_webcam_canvas" style="border-radius:8px;border:2px solid var(--pe-border);background:#000;image-rendering:pixelated;width:100px;height:100px;"></canvas>
					</div>
					<div id="pyodide_prediction_results" style="display:none; text-align:left;">
						<strong style="font-size:12px;color:var(--pe-accent2);">🎯 <span class="TRANSLATEME_pe_live_prediction"></span></strong>
						<pre id="pyodide_prediction_output"></pre>
					</div>
				</div>
			</div>

			<!-- Image preview (hidden by default) -->
			<div id="pyodide_image_preview" class="pe-media-container">
				<div style="font-size:11px;color:var(--pe-muted);margin-bottom:6px;font-weight:600;">🖼️ <span class="TRANSLATEME_pe_uploaded_image_resized"></span></div>
				<canvas id="pyodide_image_canvas" style="border-radius:8px;border:2px solid var(--pe-border);background:#000;max-width:200px;"></canvas>
			</div>

			<!-- Multi-photo capture area (hidden by default) -->
			<div id="pyodide_photos_container" class="pe-media-container">
			    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
				<div style="font-size:11px;color:var(--pe-muted);font-weight:600;">📸 <span class="TRANSLATEME_pe_photo_group"></span></div>
				<div style="display:flex;align-items:center;gap:6px;">
				    <label style="font-size:11px;color:var(--pe-muted);"><span class="TRANSLATEME_pe_need"></span></label>
				    <input type="number" id="pyodide_photos_needed" min="2" max="20" value="4"
					style="width:45px;padding:2px 6px;border-radius:4px;font-size:11px;background:var(--pe-surface2);color:var(--pe-text);border:1px solid var(--pe-border);text-align:center;">
				    <button onclick="pyodidePhotosSnap()" class="pe-btn pe-btn-run" style="font-size:11px;padding:4px 10px;">
					📸 <span class="TRANSLATEME_pe_snap"></span>
				    </button>
				    <button onclick="pyodidePhotosClear()" class="pe-btn pe-btn-clear" style="font-size:11px;padding:4px 10px;">
					🗑️ <span class="TRANSLATEME_pe_clear"></span>
				    </button>
				    <button onclick="pyodidePhotosRun()" class="pe-btn pe-btn-run" style="font-size:11px;padding:4px 10px;background:linear-gradient(135deg,#6c63ff,#5a52d5);color:#fff;">
					▶ <span class="TRANSLATEME_pe_run_with_photos"></span>
				    </button>
				</div>
			    </div>
			    <div style="font-size:11px;color:var(--pe-accent2);margin-bottom:6px;">
				<span id="pyodide_photos_status"><span class="TRANSLATEME_pe_photos_captured_status"></span></span>
			    </div>
			    <div id="pyodide_photos_strip" style="display:flex;gap:6px;flex-wrap:wrap;min-height:60px;padding:8px;background:var(--pe-bg);border-radius:6px;border:1px solid var(--pe-border);align-items:center;">
				<span style="color:var(--pe-muted);font-size:11px;font-style:italic;"><span class="TRANSLATEME_pe_no_photos_yet"></span></span>
			    </div>
			</div>

			<!-- === SIDE-BY-SIDE LAYOUT: Editor (left) + Console (right) === -->
			<div class="pe-main-layout">
				<!-- Editor with syntax highlighting -->
				<div class="pe-editor-container">
					<div class="pe-editor-header">
						<span>🐍 <span class="TRANSLATEME_pe_python_editor"></span></span>
						<span class="pe-shortcuts-hint pe-advanced-only">
							<kbd>Ctrl</kbd>+<kbd>Enter</kbd> <span class="TRANSLATEME_pe_run"></span> &nbsp;
							<kbd>Ctrl</kbd>+<kbd>S</kbd> <span class="TRANSLATEME_pe_save"></span> &nbsp;
							<kbd>Ctrl</kbd>+<kbd>/</kbd> <span class="TRANSLATEME_pe_comment"></span> &nbsp;
							<kbd>Esc</kbd> <span class="TRANSLATEME_pe_stop"></span>
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

				<!-- Console Output (now on the RIGHT) -->
				<div class="pe-console-container">
					<div class="pe-console-header">
						<strong>
							<span style="color:var(--pe-success);">▸</span> <span class="TRANSLATEME_pe_console"></span>
						</strong>
						<span style="display:flex;align-items:center;gap:6px;">
							<button onclick="pyodideCopyOutput()" class="pe-btn pe-btn-clear" style="padding:3px 8px;font-size:11px;" title="Copy output">
								📋
							</button>
							<button onclick="pyodideDownloadOutput()" class="pe-btn pe-btn-clear" style="padding:3px 8px;font-size:11px;" title="Download output">
								📥
							</button>
							<button onclick="pyodideEditorClear()" class="pe-btn pe-btn-clear" style="padding:3px 10px;font-size:11px;">
								🧹 <span class="TRANSLATEME_pe_clear"></span>
							</button>
						</span>
					</div>
					<div id="pyodide_console_output"></div>
				</div>
			</div><!-- end .pe-main-layout -->
		</div><!-- end #pyodide_editor_wrapper -->

		<script>
		// ===== DARK/LIGHT MODE: Monitor global `is_dark_mode` =====
		(function() {
			function applyPyodideTheme() {
				var wrapper = document.getElementById('pyodide_editor_wrapper');
				if (!wrapper) return;
				if (typeof is_dark_mode !== 'undefined' && !is_dark_mode) {
					wrapper.classList.add('pe-light-mode');
				} else {
					wrapper.classList.remove('pe-light-mode');
				}
			}

			// Apply on load
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', applyPyodideTheme);
			} else {
				applyPyodideTheme();
			}

			// Monitor `is_dark_mode` for changes using a polling interval
			var _lastDarkMode = (typeof is_dark_mode !== 'undefined') ? is_dark_mode : true;
			setInterval(function() {
				var current = (typeof is_dark_mode !== 'undefined') ? is_dark_mode : true;
				if (current !== _lastDarkMode) {
					_lastDarkMode = current;
					applyPyodideTheme();
				}
			}, 300);

			// Also listen for a custom event if the app dispatches one
			document.addEventListener('darkModeChanged', applyPyodideTheme);
			window.addEventListener('darkModeChanged', applyPyodideTheme);

			// Expose for manual calls
			window.applyPyodideTheme = applyPyodideTheme;
		})();
		</script>
	</div>
</div>
