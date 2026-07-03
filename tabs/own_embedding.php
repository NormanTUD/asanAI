<div id="own_embedding_tab" class="tab">
	<br>
	<table class="table_border_1px">
		<tr>
			<td class="custom_csv_table_td">
				<table id="embedding_data_settings_table">
					<tr>
						<td><span class="TRANSLATEME_embedding_vocab_size">Vocabulary Size</span></td>
						<td><input type="number" id="embedding_vocab_size" min="1" max="100000" value="100" onchange="update_embedding_data_preview()"></td>
					</tr>
					<tr>
						<td><span class="TRANSLATEME_embedding_seq_length">Sequence Length</span></td>
						<td><input type="number" id="embedding_seq_length" min="1" max="2048" value="10" onchange="update_embedding_data_preview()"></td>
					</tr>
					<tr>
						<td><span class="TRANSLATEME_embedding_separator">Token Separator</span></td>
						<td><input type="text" id="embedding_token_separator" value=" " style="width: 30px" onkeyup="update_embedding_data_preview()"></td>
					</tr>
					<tr>
						<td><span class="TRANSLATEME_embedding_input_mode">Input Mode</span></td>
						<td>
							<select id="embedding_input_mode" onchange="toggle_embedding_input_mode()">
								<option value="token_ids">Token IDs (integers)</option>
								<option value="text">Text (auto-tokenize)</option>
							</select>
						</td>
					</tr>
					<tr>
						<td><span class="TRANSLATEME_auto_adjust_embedding_layer">Auto-adjust Embedding inputDim</span></td>
						<td><input type="checkbox" id="embedding_auto_adjust_input_dim" value="1" checked></td>
					</tr>
					<tr>
						<td><span class="TRANSLATEME_auto_adjust_seq_length">Auto-adjust inputLength from data</span></td>
						<td><input type="checkbox" id="embedding_auto_adjust_seq_length" value="1" checked></td>
					</tr>
					<tr>
						<td colspan="2">
							<button onclick="load_embedding_example_data()"><span class="TRANSLATEME_load_example_embedding_data">Load example data</span></button>
							<button onclick="parse_embedding_data()"><span class="TRANSLATEME_parse_embedding_data">Parse &amp; Preview</span></button>
						</td>
					</tr>
				</table>

				<br>

				<div id="embedding_token_mode_text" style="display:none">
					<b><span class="TRANSLATEME_embedding_text_input_label">Text Input (one sample per line):</span></b><br>
					<textarea id="embedding_text_input" style="width: 98%; height: 200px" spellcheck="false" placeholder="hello world&#10;this is a test&#10;neural networks are cool" onkeyup="update_embedding_data_preview()"></textarea>
					<br>
					<b><span class="TRANSLATEME_embedding_labels_input_label">Labels (one per line, matching samples):</span></b><br>
					<textarea id="embedding_text_labels" style="width: 98%; height: 100px" spellcheck="false" placeholder="greeting&#10;statement&#10;fact" onkeyup="update_embedding_data_preview()"></textarea>
				</div>

				<div id="embedding_token_mode_ids">
					<b><span class="TRANSLATEME_embedding_token_input_label">Token ID Input (X data, one sequence per line, space-separated):</span></b><br>
					<textarea id="embedding_token_input" style="width: 98%; height: 200px" spellcheck="false" placeholder="1 5 23 7 0 0 0 0 0 0&#10;3 12 8 45 67 2 0 0 0 0&#10;9 4 33 21 6 78 11 0 0 0" onkeyup="update_embedding_data_preview()"></textarea>
					<br>
					<b><span class="TRANSLATEME_embedding_y_input_label">Y data (labels/targets, one per line):</span></b><br>
					<textarea id="embedding_y_input" style="width: 98%; height: 100px" spellcheck="false" placeholder="0&#10;1&#10;2" onkeyup="update_embedding_data_preview()"></textarea>
				</div>

				<br>
				<span id="embedding_parse_errors" style="color:red"></span>
			</td>
			<td class="hide_when_no_embedding custom_csv_table_td" style="display: none">
				<div id="embedding_data_preview">
					<b><span class="TRANSLATEME_embedding_data_preview_title">Data Preview</span></b>
					<div id="embedding_x_preview"></div>
					<div id="embedding_y_preview"></div>
					<div id="embedding_vocab_info"></div>
				</div>
			</td>
			<td class="hide_when_no_embedding custom_csv_table_td" style="display: none">
				<div id="embedding_shape_preview">
					<b><span class="TRANSLATEME_embedding_shape_info">Shape Info</span></b>
					<div id="embedding_x_shape"></div>
					<div id="embedding_y_shape"></div>
				</div>
			</td>
		</tr>
	</table>

	<br>
	<div id="embedding_inspection_panel" style="display:none; border: 1px solid #ccc; padding: 10px; margin-top: 10px;">
		<h3><span class="TRANSLATEME_embedding_inspection_title">Embedding Inspection</span></h3>
		<table>
			<tr>
				<td><span class="TRANSLATEME_inspect_token_id">Token ID to inspect:</span></td>
				<td><input type="number" id="embedding_inspect_token_id" min="0" value="0" style="width:80px"></td>
				<td><button onclick="inspect_embedding_token()"><span class="TRANSLATEME_inspect">Inspect</span></button></td>
			</tr>
			<tr>
				<td><span class="TRANSLATEME_inspect_layer_idx">Embedding Layer Index:</span></td>
				<td><input type="number" id="embedding_inspect_layer_idx" min="0" value="0" style="width:80px"></td>
				<td></td>
			</tr>
		</table>
		<div id="embedding_inspect_result" style="margin-top:10px; font-family: monospace; white-space: pre-wrap; max-height: 300px; overflow-y: auto;"></div>

		<hr>
		<h4><span class="TRANSLATEME_attention_inspection_title">Attention Weights Inspection</span></h4>
		<table>
			<tr>
				<td><span class="TRANSLATEME_attention_layer_idx">Attention Layer Index:</span></td>
				<td><input type="number" id="attention_inspect_layer_idx" min="0" value="1" style="width:80px"></td>
				<td><button onclick="inspect_attention_weights()"><span class="TRANSLATEME_inspect_attention">Inspect Q/K/V</span></button></td>
			</tr>
		</table>
		<div id="attention_inspect_result" style="margin-top:10px; font-family: monospace; white-space: pre-wrap; max-height: 400px; overflow-y: auto;"></div>
	</div>
</div>
