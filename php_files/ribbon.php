<div id="ribbon" style="overflow: hidden;">
	<ul id="tablist">
		<li><span class="symbol_button" title="Hide Ribbon" onclick="hide_ribbon()" style='cursor: pointer; color: gray'>&#9776;</span></li>
		<li><span class="symbol_button" title="Download model" style="cursor: pointer" onclick="download_model_and_weights_and_labels()"><img class="ribbon_icon" src="_gui/icons/floppy.svg" /></span></li>
		<li><span class="symbol_button" title="Upload model" id="upload_file_dialog" onclick="open_upload_dialog()" style="cursor: pointer"><img class="ribbon_icon" src="_gui/icons/folder.svg" /></span></li>
		<li><span id="custom_webcam_training_data_small" title="Start webcam for acquiring custom images" style="display: none" class="enabled_symbol only_when_webcam input_shape_is_image symbol_button" onclick="set_custom_webcam_training_data()"><img class="ribbon_icon" src="_gui/icons/webcam.svg" /></span></li>
		<li><span id="custom_image_training_data_small" title="Set custom images for training" style="display: none" class="only_when_webcam enabled_symbol input_shape_is_image symbol_button" onclick="set_custom_image_training()"><img class="ribbon_icon" src="_gui/icons/photos.svg" /></span></li>
		<li><span class="symbol_button" title="Help" style="cursor: help" id="manual_page_link" onclick="window.open('manual.html', '_blank').focus();"><img class="ribbon_icon" src="_gui/icons/help.svg" /></span></li>
		<li><span id="tiny_graph" style="display:none"></span></li>
	</ul>


	<div id="home_ribbon" class="ribbon_tab_content" title="start">
		<div id="logo_ribbon" class="ribbon_tab_content" title="Logo">
			<div class="ribbon-group">
				<div class="ribbon-toolbar">
					<img width=135 height=135 alt="asanAI Logo" onclick="easter_egg_fireworks()" id="asanai_main_logo" src="_gui/logo_small.png">
				</div>
			</div>
		</div>

		<div class="ribbon-group">
			<div class="ribbon-toolbar">
				<table>
					<tr>
						<td><span class="TRANSLATEME_examples"></span></td>
						<td>
							<select id="dataset" onchange="chose_dataset();$('#prediction').html('');" style="width: 190px">
							</select>
							<button id="reset_model" style="width: 46px;" onclick="init_page_contents($('#dataset').val())"><span class="TRANSLATEME_reset"></span></button>
						</td>
					</tr>
					<tr>
						<td>
							<span class="TRANSLATEME_dataset"></span>
						</td>
						<td>
							<select id="model_dataset" onchange="xy_data=null;change_data_origin();" style="width: 238px">
							</select>
						</td>
					</tr>

					<tr>
						<td style="white-space: nowrap;"><span class='TRANSLATEME_own_data' /></td>
						<td>
							<select id="data_origin" onchange="change_data_origin(1)" style="width: 239px;">
								<option class="TRANSLATEME_no_default_data" value="default"></option>
								<option value="tensordata" class="TRANSLATEME_yes_own_tensor"></option>
								<option class="TRANSLATEME_yes_own_images" value="image"></option>
								<option value="csv" class="TRANSLATEME_yes_own_csv"></option>
							</select>
						</td>
					</tr>
				</table>

			</div>
			<div class="ribbon-group-title"><span class='TRANSLATEME_dataset_and_network'></span></div>
		</div>

		<div class="ribbon-group-sep expert_mode_only"></div>
		<div class="ribbon-group-sep-hr"><hr></div>
		<div class="ribbon-group expert_mode_only">
			<div class="ribbon-toolbar">
				<table>
					<tr>
						<td><span class="TRANSLATEME_loss"></span><sup onclick="losses_popup()">?</sup></td>
						<td style="width: 200px">
							<select id="loss" onchange="updated_page()" style="width: 200px">
							</select>
						</td>
					</tr>
					<tr>
						<td><span class="TRANSLATEME_metric"></span></td>
						<td style="width: 110px">
							<select id="metric" onchange="change_metrics()" style="width: 200px">
							</select>
						</td>
					</tr>
					<tr>
						<td>Shapes</td>
						<td>
							<input type="text" value="" style="width: 84px;" onchange="update_input_shape()" readonly id="inputShape"></input>
							&rarr;
							<input type="text" value="" style="width: 84px;" readonly id="outputShape"></input>
						</td>
					</tr>
					<tr>
						<td colspan=2>
							Auto-Input-Shape?
							<input type="checkbox" value=1 <?php print array_key_exists("no_auto_input_shape", $_GET) ? "" : "checked"; ?> onchange="allow_edit_input_shape()" id="auto_input_shape" />
						</td>
					</tr>
				</table>
			</div>
			<div class="ribbon-group-title"><span class="TRANSLATEME_loss_metric_data_and_shape" /></div>
		</div>

		<div class="ribbon-group-sep"></div>
		<div class="ribbon-group-sep-hr"><hr></div>
		<div class="ribbon-group" style="display:none">
			<div class="ribbon-toolbar" style="width:100px">
				<input type="number" id="number_of_layers" value="2" min="1" step="1" style="width: 85%">
			</div>
			<div class="ribbon-group-title">Layers</div>
		</div>

		<div class="ribbon-group">
			<div class="ribbon-toolbar" style="width: 135px">
				<table>
					<tr><td><span class="TRANSLATEME_epochs"></span></td><td><input type="number" id="epochs" value="30" min="1" step="10" style="width: 40px;"></td></tr>
					<tr><td><span class="TRANSLATEME_batch_size"></span></td><td><input type="number" id="batchSize" value="10" min="1" step="5" style="width: 40px;"></td></tr>
					<tr><td><span class="TRANSLATEME_valsplit"></span>&nbsp;%</td><td><input type="number" min="0" max="99" step="5" value="20" style="width: 40px;" id="validationSplit"></td></tr>
				</table>
				<div class="ribbon-group-title"><span class="TRANSLATEME_hyperparameters"></span></div>
			</div>
		</div>
		<div class="ribbon-group-sep"></div>
		<div class="ribbon-group-sep-hr"><hr></div>


		<div id="image_resize_dimensions" class="hide_when_no_image">
			<div class="ribbon-group">
				<div class="ribbon-toolbar" style="width:150px">
					<table>
						<tr>
							<td><span class='TRANSLATEME_height'></span></td>
							<td><input type="number" min="1" value="" onchange="change_height()" onkeyup="change_height()" id="height" style="width: 40px;"></td>
						</tr>
						<tr>
							<td><span class='TRANSLATEME_width'></span></td>
							<td><input type="number" min="1" value="" onchange="change_width()" onkeyup="change_width()" id="width" style="width: 40px;"></td>
						</tr>
						<tr id="max_number_of_files_per_category_tr" class="hide_when_custom_data" style="display: none">
							<td><span class="TRANSLATEME_img_per_cat"></span></td>
							<td><input type="number" step=5 min="0" value="100" id="max_number_of_files_per_category" style="width: 40px"></td>
						</tr>
						<tr class="expert_mode_only">
							<td><span class="TRANSLATEME_augment"></span>?</td>
							<td><input type="checkbox" onclick="show_hide_augment_tab()" id="auto_augment"></td>
						</tr>
					</table>
				</div>
				<div class="ribbon-group-title"><span class="TRANSLATEME_image_options"></span></div>
			</div>
			<div class="ribbon-group-sep"></div>
			<div class="ribbon-group-sep-hr"><hr></div>
		</div>

		<div class="ribbon-group">
			<div class="ribbon-toolbar">
				<table>
					<tr>
						<td colspan=2>
							<button class="train_neural_network_button start_training" style="min-width: 100%" onclick="train_neural_network()"><span class="TRANSLATEME_start_training"></span></button>
						</td>
					</tr>
					<tr>
						<td>
							<span class="symbol_button"><img height=16 src="_gui/icons/graph.svg" /></span> Autotab?
						</td>
						<td>
							<input class="show_data" type="checkbox" value="1" id="jump_to_interesting_tab" checked>
						</td>
					</tr>
					<tr class="expert_mode_only">
						<td>
							<span class="TRANSLATEME_divide_x_by"></span>:
						</td>
						<td>
							<input style="width: 50px;" value="1" type="number" id="divide_by" onchange="repredict()">
						</td>
					</tr>
				</table>
			</div>
			<div class="ribbon-group-title"><span class="TRANSLATEME_training"></span></div>
		</div>
	</div>

	<div id="tf_ribbon_settings" class="ribbon_tab_content" title="general">
		<div class="ribbon-group">
			<div class="ribbon-toolbar">
				<fieldset style="border-width: 0px" id="backend_chooser"> 
					<input type="radio" onchange="set_backend()" name="backend_chooser" value="cpu" id="cpu_backend" checked>
					<label for="cpu_backend">CPU</label>

					<input type="radio" onchange="set_backend()" name="backend_chooser" value="webgl" id="webgl_backend">
					<label for="webgl_backend">WebGL</label>
				</fieldset>
				<hr>
				<fieldset style="border-width: 0px" id="mode_chooser"> 
				<input type="radio" onchange="set_mode()" name="mode_chooser" value="beginner" id="beginner" <?php
	$checked = 1;
	if(array_key_exists("mode", $_COOKIE) && $_COOKIE["mode"] == "expert") {
		$checked = 0;
	}

	if($checked) {
		print "checked";
	}

?>>
					<label for="beginner">&#129466; <span class='TRANSLATEME_beginner'></span></label>

					<input type="radio" onchange="set_mode()" name="mode_chooser" value="expert" id="expert" <?php
	$checked = 0;
	if(array_key_exists("mode", $_COOKIE) && $_COOKIE["mode"] == "expert") {
		$checked = 1;
	}
	if($checked) { print "checked"; }
?>>
					<label for="expert">&#9760;&#65039; <span class="TRANSLATEME_expert"></span></label>
				</fieldset>
				Theme: <select id="theme_choser" class="show_data" onchange="theme_choser()">
					<option value="lightmode">Light Mode</option>
					<option value="darkmode">Dark Mode</option>
					<option value="naturalmode">Natural</option>
				</select>
			</div>
			<div class="ribbon-group-title">TF-Backend/GUI-Mode/Style</div>
		</div>

		<div class="only_when_multiple_webcams" style="display: none">
			<div class="ribbon-group-sep"></div>
			<div class="ribbon-group-sep-hr"><hr></div>
			<div class="ribbon-group">
				<div class="ribbon-toolbar">
					<select id="which_webcam" onchange="restart_webcams()">
					</select>

					<br>
				</div>
				<div class="ribbon-group-title">Webcam options</div>
			</div>
		</div>

		<div class="expert_mode_only">
			<div class="ribbon-group-sep"></div>
			<div class="ribbon-group-sep-hr"><hr></div>
			<div class="ribbon-group">
				<div class="ribbon-toolbar">
					<table>
						<tr>
							<td><span class="TRANSLATEME_shuffle_before_each_epoch"></span>?</td>
							<td><input type="checkbox" value=1 checked id="shuffle_before_each_epoch"></td>
						</tr>
						<tr>
							<td><span class="TRANSLATEME_enable_tf_debug"></span></td>
							<td><input type="checkbox" value="1" onchange="tf_debug();" id="enable_tf_debug"></td>
						</tr>
						<tr>
							<td>asanAI debug?</td>
							<td><input type="checkbox" value="1" onchange="debug = $(this).is(':checked');" id="enable_asanai_debug"></td>
						</tr>
						<tr>
							<td>Resize method?</td>
							<td>
								<select id="default_resize_method">
									<option value="nearestNeighbor" selected>nearestNeighbor</option>
									<option value="bilinear">bilinear</option>
								</select>
							</td>
						</tr>
					</table>
				</div>
				<div class="ribbon-group-title">Weights/Shuffle/Resize</div>
			</div>

			<div class="ribbon-group-sep"></div>
			<div class="ribbon-group-sep-hr"><hr></div>
			<div class="ribbon-group">
				<div class="ribbon-toolbar">
					<table>
						<tr>
							<td>
								<table>
									<tr>
										<td><span class='TRANSLATEME_kernel_initializer'></span></td>
										<td>
											<select id="set_all_kernel_initializers" onchange="set_all_kernel_initializers()" style="width: 120px">
												<option value="none">&mdash;</option>
											</select>
										</td>
									</tr>
									<tr>
										<td><span class='TRANSLATEME_bias_initializer'></span></td>
										<td>
											<select id="set_all_bias_initializers" onchange="set_all_bias_initializers()" style="width: 120px">
												<option value="none">&mdash;</option>
											</select>
										</td>
									</tr>
									<tr>
										<td><span class="TRANSLATEME_activation_functions"></span></td>
										<td>
											<select id="set_all_activation_functions" onchange="set_all_activation_functions()" style="width: 120px">
												<option value="none">&mdash;</option>
											</select>
										</td>
									</tr>
									<tr>
										<td>&rdca; <span class='TRANSLATEME_except_last_layer'></span></td>
										<td>
											<select id="set_all_activation_functions_except_last_layer" onchange="set_all_activation_functions_except_last_layer()" style="width: 120px">
												<option value="none">&mdash;</option>
											</select>
										</td>
									</tr>
								</table>
							</td>
							<td>
								<table>
									<tr>
										<td colspan=2>
											<select class="set_all_initializers_input" id="change_initializers_selector" onchange="change_all_initializers()" style="width: 120px">
												<option value="glorotUniform">glorotUniform</option>
												<option value="constant">constant</option>
												<option value="glorotNormal">glorotNormal</option>
												<option value="heNormal">heNormal</option>
												<option value="heUniform">heUniform</option>
												<option value="leCunNormal">leCunNormal</option>
												<option value="leCunUniform">leCunUniform</option>
												<option value="ones">ones</option>
												<option value="randomNormal">randomNormal</option>
												<option value="randomUniform">randomUniform</option>
												<option value="truncatedNormal">truncatedNormal</option>
												<option value="varianceScaling">varianceScaling</option>
												<option value="zeros">zeros</option>
											</select>
										</td>
									</tr>
									<tr class="set_all_initializers_tr set_all_initializers_mean" style="display: none">
										<td>
											Mean:
										</td>
										<td>
											<input class="set_all_initializers_input" id="set_all_initializers_value_mean" onchange="change_all_initializers()" value="1" />
										</td>
									</tr>
									<tr class="set_all_initializers_tr set_all_initializers_value" style="display: none">
										<td>
											Value:
										</td>
										<td>
											<input type="number" step="1" class="set_all_initializers_input" id="set_all_initializers_value_value" onchange="change_all_initializers()" value="1" />
										</td>
									</tr>
									<tr class="set_all_initializers_tr set_all_initializers_distribution" style="display: none">
										<td>
											Distribution:
										</td>
										<td>
											<select class="set_all_initializers_input" id="set_all_initializers_value_distribution" onchange="change_all_initializers()">
												<option value="normal">normal</option>
												<option value="uniform">uniform</option>
												<option value="truncatedNormal">truncatedNormal</option>
											</select>
										</td>
									</tr>
									<tr class="set_all_initializers_tr set_all_initializers_mode" style="display: none">
										<td>
											Mode:
										</td>
										<td>
											<select class="set_all_initializers_input" id="set_all_initializers_value_mode" onchange="change_all_initializers()">
												<option value="fanIn">fanIn</option>
												<option value="fanOut">fanOut</option>
												<option value="fanAvg">fanAvg</option>
											</select>
										</td>
									</tr>
									<tr class="set_all_initializers_tr set_all_initializers_scale" style="display: none">
										<td>
											Scale:
										</td>
										<td>
											<input class="set_all_initializers_input" id="set_all_initializers_value_scale" onchange="change_all_initializers()" value="1" type="number" step="1" />
										</td>
									</tr>
									<tr class="set_all_initializers_tr set_all_initializers_maxval" style="display: none">
										<td>
											Maxval:
										</td>
										<td>
											<input class="set_all_initializers_input" id="set_all_initializers_value_maxval" onchange="change_all_initializers()" value="1" type="number" step="1" />
										</td>
									</tr>
									<tr class="set_all_initializers_tr set_all_initializers_minval" style="display: none">
										<td>
											Minval:
										</td>
										<td>
											<input class="set_all_initializers_input" id="set_all_initializers_value_minval" onchange="change_all_initializers()" value="-1" type="number" step="1" />
										</td>
									</tr>
									<tr class="set_all_initializers_tr set_all_initializers_stddev" style="display: none">
										<td>
											Stddev:
										</td>
										<td>
											<input class="set_all_initializers_input" id="set_all_initializers_value_stddev" onchange="change_all_initializers()" value="1" type="number" step="1" />
										</td>
									</tr>
									<tr class="set_all_initializers_tr set_all_initializers_seed" style="display: none">
										<td>
											Seed:
										</td>
										<td>
											<input class="set_all_initializers_input" id="set_all_initializers_value_seed" onchange="change_all_initializers()" value="1" type="number" step="1" />
										</td>
									</tr>
								</table>
							</td>
						</tr>
					</table>
				</div>
				<div class="ribbon-group-title"><span class="TRANSLATEME_set_all_initializers"></span></div>
			</div>
		</div>

		<div class="ribbon-group-sep"></div>
		<div class="ribbon-group-sep-hr"><hr></div>
		<div class="ribbon-group">
<?php
			include("php_files/optimizer.php");
?>
			<div class="ribbon-group-title"><span class="TRANSLATEME_optimizer"></span></div>
		</div>
	</div>

	<div id="tf_ribbon_augmentation" class="ribbon_tab_content" title="augmentation" style="display: none">
		<div class="ribbon-group-sep"></div>
		<div class="ribbon-group-sep-hr"><hr></div>
		<div class="ribbon-group">
			<div class="ribbon-toolbar">
				<table>
					<tr>
						<td><span class="TRANSLATEME_auto_rotate_images"></span>?</td>
						<td><input type="checkbox" value=1 id="augment_rotate_images"></td>
					</tr>
					<tr>
						<td><span class="TRANSLATEME_number_of_rotations"></span>?</td>
						<td><input type="number" min=1 value=4 id="number_of_rotations"></td>
					</tr>
					<tr>
						<td><span class="TRANSLATEME_invert_images"></span>?</td>
						<td><input type="checkbox" value=1 id="augment_invert_images"></td>
					</tr>
					<tr>
						<td>Flip left/right?</td>
						<td><input type="checkbox" value=1 id="augment_flip_left_right"></td>
					</tr>
				</table>
			</div>
			<div class="ribbon-group-title"><span class="TRANSLATEME_augmentation"></span></div>
		</div>
	</div>

	<div id="visualization_ribbon" class="ribbon_tab_content" title="visualization_tab">
		<div>
			<div class="ribbon-group-sep"></div>
			<div class="ribbon-group-sep-hr"><hr></div>
			<div class="ribbon-group">
				<div class="ribbon-group">
					<div class="ribbon-toolbar">
						<table>
							<tr>
								<td><span style="min-width: 100px;display: inline-block;" class="TRANSLATEME_iterations"></span></td>
								<td><input type="number" min="1" value="2" id="max_activation_iterations" style="width: 55px;"></td>
							</tr>
							<tr class="hide_when_no_conv_visualizations">
								<td><span class="TRANSLATEME_width_amp_height"></span>:</td>
								<td><input type="number" min="0" max="1000" step="1" value="0" id="max_activated_neuron_image_size" style="width: 55px;"></td>
							</tr>
						</table>
					</div>
				</div>
				<div class="ribbon-group-title"><span class="TRANSLATEME_max_activated_neurons"></span></div>
			</div>
		</div>

		<div class="ribbon-group-sep"></div>
		<div class="ribbon-group-sep-hr"><hr></div>
		<div class="ribbon-group">
			<div class="ribbon-group">
				<div class="ribbon-toolbar" style="width: auto; max-width: 500px;">
					<table>
						<tr>
							<td><span class="TRANSLATEME_max_neurons_fcnn"></span>?</td>
							<td><input class="show_data" type='number' value="32" min=0 id="max_neurons_fcnn" style="width: 55px"></td>
						</tr>
						<tr>
							<td><span class="TRANSLATEME_batch_plot_minimum_time"></span> (s)</td>
							<td><input class="show_data" type='number' value="5" min=0 id="min_time_between_batch_plots" style="width: 55px"></td>
						</tr>
					</table>
				</div>
			</div>
			<div class="ribbon-group-title">FCNN/AlexNet, Batch-Plot</div>
		</div>

		<div class="ribbon-group-sep"></div>
		<div class="ribbon-group-sep-hr"><hr></div>
		<div class="ribbon-group">
			<div class="ribbon-group">
				<div class="ribbon-toolbar" style="width: auto; max-width: 500px;">
					<table>
						<tr>
							<td><span class="TRANSLATEME_show_bars_instead_of_numbers"></span>?</td>
							<td><input class="show_data" type='checkbox' checked id="show_bars_instead_of_numbers" onclick="updated_page()"></td>
						</tr>
						<tr>
							<td><span class="TRANSLATEME_visualize_images_in_grid"></span>?</td>
							<td><input class="show_data" type='checkbox' checked id="visualize_images_in_grid"></td>
						</tr>
						<tr>
							<td><span class="TRANSLATEME_number_of_grid_images"></span>?</td>
							<td><input class="show_data" type='number' value='50' id="max_number_of_images_in_grid" min=0 max=1000 style='width: 50px;'></td>
						</tr>
					</table>
				</div>
			</div>
			<div class="ribbon-group-title"><span class="TRANSLATEME_various_plots"></span></div>
		</div>

		<div id="data_plotter" style="display: none">
			<div class="ribbon-group-sep"></div>
			<div class="ribbon-group-sep-hr"><hr></div>
			<div class="ribbon-group">
				<div class="ribbon-group">
					<div class="ribbon-toolbar" style="width: auto; max-width: 300px;">
						<table>
							<tr>
								<td><span class="TRANSLATEME_show_raw_data"></span>?</td>
								<td><input class="show_data" type='checkbox' id="show_raw_data"></td>
							</tr>
							<tr>
								<td><span class="TRANSLATEME_pixel_size"></span></td>
								<td><input type="number" min="1" max="100" value="1" onchange="change_pixel_size()" onkeyup="change_pixel_size()" id="pixel_size" style="width: 80px;"></td>
							</tr>
							<tr>
								<td><span class="TRANSLATEME_kernel_pixel_size"></span></td>
								<td><input type="number" min="1" max="100" value="10" onchange="change_kernel_pixel_size()" onkeyup="change_kernel_pixel_size()" id="kernel_pixel_size" style="width: 80px;"></td>
							</tr>
						</table>
					</div>
				</div>
				<div class="ribbon-group-title"><span class="TRANSLATEME_layer_data_flow"></span></div>
			</div>
		</div>
	</div>

	<div id="log_ribbon" class="ribbon_tab_content" title="log">
		<div class="ribbon-group" style="width: auto;">
			<div class="ribbon-toolbar">
				<textarea style="width: 1400px; height: 90px; font-size: 14px" readonly id="log"></textarea>
			</div>
			<button onclick="copy_to_clipboard($('#log').val());"><span class="TRANSLATEME_copy_to_clipboard"></span></button>
			<button onclick="confirmAndRunTests();"><span class="TRANSLATEME_run_tests"></span></button>
			<div class="ribbon-group-title">Log</div>
		</div>

	</div>


	<div id="imprint_ribbon" class="ribbon_tab_content" title="code_and_contact">
		<div class="ribbon-group" style="width: auto;">
			<div class="ribbon-toolbar">
				<button style="width: 200px" onclick="location.href='mailto:norman.koch@tu-dresden.de'">norman.koch@tu-dresden.de</button><br><br>
				<button onclick='window.open("https://github.com/NormanTUD/asanAI/", "_blank");' style="width: 200px">Code</button><br><br>
				<button style="width: 200px" onclick="sources_popup()"><span class="TRANSLATEME_sources_and_used_programs"></span></button>
			</div>
			<div class="ribbon-group-title"><span class="TRANSLATEME_imprint"></span></div>
		</div>

	</div>

	<div style="position: absolute; top: 2px; right: 20px; user-select: none; font-size: 1.5vw">
		<span onclick='update_lang("de")'><img src="_gui/icons/german.svg" height=20 /></span>
		<span onclick='update_lang("en")'><img src="_gui/icons/english.svg" height=20 /></span>
	</div>
</div>
