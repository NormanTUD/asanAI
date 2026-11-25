<div id="upload_dialog" class="popup" style="display: none;">
	<div class="popup_body less_transparent_glass_box">
		<div> 
			<table>
				<tr>
					<td>1. <span class="TRANSLATEME_upload_model_label"></span> (<span class='tt'>model.json</span>)</td>
					<td><input accept="application/json" type="file" id="upload_model"></td>
				</tr>
				<tr>
					<td>2. <span class="TRANSLATEME_upload_labels"></span> (<span class='tt'>labels.json</span>)</td>
					<td><input accept="application/json" type="file" id="upload_labels"></td>
				</tr>
				<tr class="hide_when_no_conv_visualizations">
					<td>3. <span class="TRANSLATEME_upload_custom_image_data"></span> (<span class='tt'>custom_images.zip</span>)</td>
					<td><input accept="zip,application/octet-stream,application/zip,application/x-zip,application/x-zip-compressed" type="file" id="upload_custom_images"></td>
				</tr>
				<tr>
					<td><span class="hide_when_no_conv_visualizations">4</span><span class="hide_when_conv_visualizations">3</span>. <span class="TRANSLATEME_upload_model_weights"></span> (<span class='tt'>weights.json</span>)</td>
					<td><input accept="application/json" type="file" id="upload_tfjs_weights"></td>
				</tr>

			</table>

			<button class="close_button" onclick="close_popup('upload_dialog')"><span class="TRANSLATEME_close"></span></button>
		</div>
	</div>
</div>
