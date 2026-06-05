<div id="own_images_tab" class="tab">
	<div id="webcam_data" style="display: none"></div>
	<span>
		<button class="buttons_in_custom_images" id="webcam_start_stop" onclick="get_data_from_webcam()"><img src="_gui/icons/webcam.svg" height="15">  <span class="TRANSLATEME_enable_webcam"></span></button>
		<button class="buttons_in_custom_images" onclick="create_and_download_zip()"><img src='_gui/icons/zip.svg' height=15 /> <span class="TRANSLATEME_download_custom_zip_file"></span></button>

		<button class="buttons_in_custom_images" id="zip_upload_label" type="button" onclick="document.getElementById('zip_upload_input').click()"><img src="_gui/icons/upload.svg" height="15"> <span class="TRANSLATEME_upload_custom_zip_file" data-lang="en">Upload custom data from a .zip file</span></button>
		<input type="file" id="zip_upload_input" accept=".zip" style="display:none !important; width:0; height:0; overflow:hidden; position:absolute; visibility:hidden; pointer-events:none;" onchange="import_zip_and_replace_categories(this)" aria-hidden="true">

		<br>
		<span class="TRANSLATEME_auto_adjust_last_layer_if_dense buttons_in_custom_images"></span>? <input type="checkbox" value="1" id="auto_adjust_number_of_neurons" checked>
		<br>
	</span>
	<button style="display: none" class="buttons_in_custom_images only_when_front_and_back_camera" onclick="switch_to_next_camera()"><img alt="Switch camera" src="_gui/rotate_camera.svg" width=32 height=32><span class="TRANSLATEME_switch_to_other_cam"></span></button>
	<div id="last_layer_shape_warning"></div>
	<div class='webcam_data only_when_webcam'>
	<span class="TRANSLATEME_number_of_images_in_series"></span>: <input type='number' min=1 value='<?php print preg_match("/^\d+$/", isset($_GET["number_of_series_images"])) ? intval($_GET["number_of_series_images"]) : 20?>' id='number_of_series_images' onchange="alter_text_webcam_series()"><br>
	<span class="TRANSLATEME_delay_between_images"></span>: <input type='number' value='2' id='nr_of_imgs_per_second' min=0 onchange="alter_text_webcam_series()"><br>
	</div>
	<button class='add_category buttons_in_custom_images' onclick="add_new_category();">+ <span class="TRANSLATEME_add_category"></span></button>
	<div id="own_image_data_categories"></div>
	<div class="container" id="own_images_container"></div>
</div>

