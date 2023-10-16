<div id="save_model_dialog" class="popup" style="display: none">
	<div class="popup_body less_transparent_glass_box">
		<div id="save_model_content"> 
			<button class="save_button" onclick="save_model();download_weights_json();"><span class="TRANSLATEME_download"></span></button>

			<div style="display: none" class="show_when_logged_in">
				<h1>Save to DB</h1>
				<span id="save_model_msg" style="display: none"></span><br>
				<input id="network_name" onkeyup="has_network_name(this)" placeholder="Network name"><br>
				<span class="TRANSLATEME_public"></span>: <input id="is_public" type="checkbox"><br>
				<button class="save_button" id="save_to_db" onclick="save_to_db_wrapper()" disabled><span class="TRANSLATEME_save"></span></button>
			</div>
		</div>
		<br>
		<button class="close_button" onclick="close_popup('save_model_dialog')"><span class="TRANSLATEME_close"></span></button>
	</div>
</div>
