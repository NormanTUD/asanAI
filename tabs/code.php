<div id="code_tab" class="tab">
	<ul class="navi_list">
		<li><a href="#python_tab" id="python_tab_label">Python</a></li>
		<li><a href="#python_expert_tab" id="python_expert_tab_label">Python (expert)</a></li>
		<li><a href="#html_tab" id="html_tab_label">HTML</a></li>
		<li><a href="#pyodide_editor_tab" id="pyodide_editor_tab_label">Run Python</a></li>
	</ul>

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

	<div id="python_tab" class="tab">
		<br>
		<span class="user_select_none">
			<button onclick="copy_id_to_clipboard('python')">
				<img src="_gui/icons/paste.svg" class="icon_small" />
				<span class="TRANSLATEME_copy_to_clipboard">
				</span>
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
				<span class="TRANSLATEME_copy_to_clipboard">
				</span>
			</button>
		</span>
		<br>
		<pre><code class="language-python" id="python_expert" style="width: 99%"></code></pre>
	</div>

	<div id="pyodide_editor_tab" class="tab">
		<br>
		<div id="pyodide_editor_wrapper">
			<!-- Toolbar -->
			<div id="pyodide_toolbar" class="user_select_none" style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
				<button id="pyodide_run_btn" onclick="pyodideEditorRun()" title="Run code (Ctrl+Enter)">
					&#9654; Run
				</button>
				<button id="pyodide_stop_btn" onclick="pyodideEditorStop()" title="Stop execution" disabled>
					&#9632; Stop
				</button>
				<button onclick="pyodideEditorClear()" title="Clear console output">
					&#128465; Clear Output
				</button>
				<button onclick="pyodideEditorReset()" title="Reset Pyodide runtime">
					&#128260; Reset Runtime
				</button>
				<label style="margin-left: 12px; font-size: 13px;">
					<input type="checkbox" id="pyodide_live_predict" checked onchange="pyodideLivePredictChanged()">
					Live Predictions
				</label>
				<span id="pyodide_status" style="margin-left: auto; font-size: 12px; color: #888;">Pyodide: not loaded</span>
			</div>

			<!-- Editor area with tab support -->
			<div id="pyodide_editor_container" style="position: relative; border: 1px solid #555; border-radius: 4px;">
				<textarea id="pyodide_editor_textarea" spellcheck="false" style="
					width: 100%;
					min-height: 350px;
					max-height: 70vh;
					font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
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
				"></textarea>
			</div>

			<!-- Console / Output area -->
			<div id="pyodide_console_wrapper" style="margin-top: 10px;">
				<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
					<strong style="font-size: 13px;">Console Output:</strong>
					<span id="pyodide_error_indicator" style="display:none; color: #ff5555; font-size: 12px; font-weight: bold;">&#9888; Error</span>
				</div>
				<pre id="pyodide_console_output" style="
					width: 100%;
					min-height: 120px;
					max-height: 300px;
					overflow: auto;
					background: #0d0d0d;
					color: #00ff00;
					font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
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

			<!-- Prediction results area -->
			<div id="pyodide_prediction_results" style="margin-top: 10px; display: none;">
				<strong style="font-size: 13px;">Prediction Results:</strong>
				<pre id="pyodide_prediction_output" style="
					width: 100%;
					min-height: 60px;
					max-height: 200px;
					overflow: auto;
					background: #0a1628;
					color: #61dafb;
					font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
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
</div>
