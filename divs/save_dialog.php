<div id="save_dialog" class="popup" style="display: none;">
	<div class="popup_body less_transparent_glass_box">
		<div> 
			<table>
				<tr>
					<td>Upload Model (<span class='tt'>.json</span>)</td>
					<td><input accept="application/json" type="file" id="upload_model"></td>
				</tr>
				<tr>
					<td>Upload Model weights from TFD trained model (<span class='tt'>.json</span>)</td>
					<td><input accept="application/octet-stream" type="file" id="upload_tfjs_weights"></td>
				</tr>
				<tr class="expert_mode_only">
					<td colspan=2>
						<p>Use this command to convert TensorFlow to TFJS-models:</p>
						<p><span class='tt'>tensorflowjs_converter --input_format=keras_saved_model --output_format=tfjs_layers_model model jsmodel</span></p>

						<p>Notice: You need to upload JSON <i>and</i> BIN-files from the trained models to have specified weights. Only one is not sufficient!</p>
					</td>
				</tr>
				<tr class="expert_mode_only">
					<td>Upload Model weights from Keras (<span class='tt'>.bin</span>)</td>
					<td><input accept="application/octet-stream" type="file" id="upload_weights"></td>
				</tr>
			</table>

			<button class="close_button" onclick="close_popup('save_dialog')"><span class="TRANSLATEME_close"></span></button>
		</div>
	</div>
</div>
