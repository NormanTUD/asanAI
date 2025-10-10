<div id="own_images_tab" class="tab">
	<div id="webcam_data" style="display: none"></div>
	<span>
		<button id="webcam_start_stop" onclick="get_data_from_webcam()"><img src='_gui/icons/webcam.svg' height=15 /> <span class="TRANSLATEME_enable_webcam"></span></button>
		<button onclick="create_and_download_zip()"><img src='_gui/icons/zip.svg' height=15 /> <span class="TRANSLATEME_download_custom_zip_file"></span></button>
		<br>
		<span class="TRANSLATEME_auto_adjust_last_layer_if_dense"></span>? <input type="checkbox" value="1" id="auto_adjust_number_of_neurons" checked>
		<br>
	</span>
	<button style="display: none" class="only_when_front_and_back_camera" onclick="switch_to_next_camera()"><img alt="Switch camera" src="_gui/rotate_camera.svg" width=32 height=32><span class="TRANSLATEME_switch_to_other_cam"></span></button>
	<div id="last_layer_shape_warning"></div>
	<div class='webcam_data only_when_webcam'>
	<span class="TRANSLATEME_number_of_images_in_series"></span>: <input type='number' min=1 value='<?php print preg_match("/^\d+$/", isset($_GET["number_of_series_images"])) ? intval($_GET["number_of_series_images"]) : 20?>' id='number_of_series_images' onchange="alter_text_webcam_series()"><br>
	<span class="TRANSLATEME_delay_between_images"></span>: <input type='number' value='1' id='delay_between_images_in_series' min=0 onchange="alter_text_webcam_series()"><br>
	</div>
	<button class='add_category' onclick="add_new_category();">+ <span class="TRANSLATEME_add_category"></span></button>
	<div id="own_image_data_categories"></div>
	<div class="container" id="own_images_container"></div>
</div>

