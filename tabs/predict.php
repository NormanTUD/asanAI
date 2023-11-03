<div id="predict_tab" class="tab user_select_none">
	<span>
		<span class="TRANSLATEME_show_layer_data_flow"></span>?
		<input class="show_data" type="checkbox" value="1" onclick="enable_disable_kernel_images();add_layer_debuggers()" id="show_layer_data"><br>
	</span>

	
	<span class="hide_when_no_conv_visualizations hide_in_cosmo_mode">
		<span class="TRANSLATEME_show_grad_cam"></span>?
		<input class="show_data" type="checkbox" value="1" onclick="enable_disable_grad_cam();add_layer_debuggers()" id="show_grad_cam"><br>
	</span>

	<span id="cosmo_visualize_last_layer" class="show_only_in_cosmo_mode" style="display: none"></span>

	<canvas id="grad_cam_heatmap" style="position: fixed; right: 50px; display: none"></canvas>

	<div class="container" id="predictcontainer">
		<div class="show_only_in_cosmo_mode">
			
		</div>
		<span id="predict_error" style="overflow: scroll; display: none"></span><br>
		<span id="own_files" class="no_autochoose_next_on_click">
			<div id="generate_images_msg_wrapper" style="display:none">
				<div id="generate_images_msg"></div>
				<img src="_gui/loading_favicon.gif" alt="Loading..." style="max-width: 20vw;" />
			</div>
			<div class="hide_when_image">
				<div id="predict_own">
					<textarea id="predict_own_data" style="width: 100%; height: 200px"></textarea>
					<br>
					<button onclick="predict($('#predict_own_data').val());repredict()"><span class="TRANSLATEME_predict"></span></button>
				</div>
			</div>
			<div id="prediction_non_image" class="temml_me" style="display: none"></div>

			<span id='webcam_tab' class="hide_when_no_image custom_image_data" style="padding-right: 50px; border-right: thin double rgb(0, 0, 0);">
				<button class="only_when_webcam hide_in_cosmo_mode large_button no_border_button" id="show_webcam_button" onclick="show_webcam();">&#128247;</button><br>
				<button style="display: none" class="only_when_front_and_back_camera" onclick="switch_to_next_camera_predict()"><img alt="Switch camera" src="_gui/rotate_camera.svg" width=32 height=32><span class="TRANSLATEME_switch_to_other_cam"></span></button>
				<span style='display: block' class="full_example_image_prediction display_contents">
					<span id="webcam"></span>
					<span id="webcam_prediction" style="overflow: scroll;"></span>
				</span>
				<br>
			</span>

			<span class="hide_when_no_image custom_image_data">
				<span id="upload_file" class="show_data no_box_shadow">
					<input id="upload_file_non_styleable" multiple type="file" accept="image/png, image/jpeg, image/png, image/jpg" onchange="load_file(event)" value='&#128444;&#128229;'>
				</span>
				<br>
				<span id='uploaded_file_predictions' class="full_example_image_prediction display_inline_block only_show_when_predicting_image_file custom_image_data">
					
				</span>
			</span>

			<span id="handdrawn_img" class="handdrawn hide_when_no_image" style='text-align: justify'>
				<span class="full_example_image_prediction display_inline_block cosmo_display_contents">
					<span id='predict_handdrawn_canvas'></span><br>
					<span id="handdrawn_predictions"></span>
				</span>
			</span>
		</span>

		<br>

		<div class="hide_when_custom_data" id="example_predictions_parent">
			<div id="example_predictions">
			</div>
		</div>
	</div>

	<div id="confusion_matrix"></div>

	<div id="layer_visualizations_tab" style="display: none" class="tab">
	</div>
</div>

