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
			</table>

			<button class="close_button" onclick="close_popup('save_dialog')"><span class="TRANSLATEME_close"></span></button>
		</div>
	</div>
</div>
