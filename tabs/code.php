<div id="code_tab" class="tab">
	<ul class="navi_list">
		<li><a href="#python_tab" id="python_tab_label">Python</a></li>
		<li><a href="#python_expert_tab" id="python_expert_tab_label">Python (expert)</a></li>
		<li><a href="#html_tab" id="html_tab_label">HTML</a></li>
	</ul>

	<div id="html_tab" class="tab">
		<br>
		<span class="user_select_none">
			<button onclick="copy_id_to_clipboard('html')"><span class="TRANSLATEME_copy_to_clipboard"></span></button>
			<button onclick="save_model()">
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
				<span class="TRANSLATEME_copy_to_clipboard">
				</span>
			</button>
			<button onclick="save_model()">
				<span class="TRANSLATEME_download_model_data"></span>
			</button>
			<button id="download_with_data" onclick="download_model_for_training()">
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
				<span class="TRANSLATEME_copy_to_clipboard">
				</span>
			</button>
		</span>
		<br>
		<pre><code class="language-python" id="python_expert" style="width: 99%"></code></pre>
	</div>
</div>
