<?php
# create_graphviz_function_call_graph();
# echo "digraph a {" > cleaned.dot; cat test.dot | grep -v alert | grep -v '"log"' | grep -v 'Error' | grep -v 'md5' | grep -v Interval | grep -v assert | grep -v '"abs"' | grep -v 'get_stack_trace' | grep -v swal | grep -v '"Array"' | egrep -v '"min|max|height|width|isNaN"' | grep -v sweet | grep -v run_tests | grep -v jscolor | grep -v eval | grep -v Promise | grep -v AlexNet | grep -v LeNet | grep -v FCNN | grep -v Fireworks | grep -v FilterUtils | grep -v EventListener | grep -v restart_alexnet | grep -v restart_lenet | grep -v restart_fcnn | grep -vi sparkle | grep -v parseInt | grep -v parseFloat | grep -v toString | grep -v parseFloat | grep -v matchMedia | grep -v parseInt | grep -v parseFloat | egrep -vi "blur|dither|smear|filter" | grep -v '"html"' | grep -v '"debug"' | grep -v "^}" | grep -v digraph | sort | uniq >> cleaned.dot; echo "}" >> cleaned.dot; wc -l cleaned.dot; dot -Tsvg cleaned.dot > cleaned.svg && firefox cleaned.svg
# find unused global vars:
# for i in $(ack "^var " variables.js | sed -e 's#^var\s*##' | sed -e 's#;\s*$##' | sed -e 's#\s*=\s*.*##' | sort | uniq); do RESULT=$(ack "$i" *.js | grep -v variables.js | wc -l); if [[ $RESULT -eq 0 ]]; then echo "$i was found 0 times outside of variables.js"; fi; done
	include("functions.php");

	include("translations.php");
	
	show_admin_register();

	include("log_users.php");
	
	$cookie_data = [
		'secure' => true,
		'samesite' => 'None'
	];
?>
<!DOCTYPE html>
<html lang="en" style="font-size: 0.75em;">
	<head>
		<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
		<title>asanAI</title>
		<meta charset="utf-8">
		<link rel="manifest" href="manifest.json">
		<style id="manicule_animation_css"></style>
<?php
		_js("tf/tf.min.js");
		_js("base_wrappers.js");
		_js("libs/jstat.min.js");
		_js("custom_layers.js");
		_js("libs/jsmanipulate.js", 1, 1);

		_js("libs/zip.js");
		_js("libs/md5.umd.min.js");
		_js("libs/jquery.js");
		_js("libs/jquery-ui.js");
		_js("debug.js");
		_js("variables.js");

		include("initializing.php");
		$theme_base = "light";

		if(isset($_COOKIE["theme"])) {
			if($_COOKIE["theme"] == "darkmode") {
				$theme_base = "dark";
			} else if($_COOKIE["theme"] == "lightmode") {
				$theme_base = "light";
			} else if($_COOKIE["theme"] == "natural") {
				$theme_base = "natural";
			}
		}

		if(!isset($_GET["start_cosmo"])) {
			$theme_base = "light";
		}

		_css("libs/jquery-ui.css");
		_css("css/style.css");
		_css("css/ribbon.css");

		if(!isset($_GET["start_cosmo"])) {
			_css("css/ribbon_media.css");
		} else {
			_css("css/cosmo.css");
		}
		_css("css/".$theme_base."mode.css", "css_mode");
		_css("css/ribbon".$theme_base."mode.css", "css_ribbon");
		_css("libs/prism/prism.min.css");
		_css("libs/sweetalert2.min.css");

		_js("libs/canvas-to-blob.min.js");

		_js("libs/sweetalert2.all.js");

		_js("libs/fireworks.js", 1, 1);
		_js("libs/confetti.browser.min.js", 1, 1);

		_js("safety.js");
		_js("translations.js", 1, 1);
		_js("tests.js");
		_js("model.js");
		_js("explain.js");
		_js("data.js");
		_js("gui.js");
		_js("easter_eggs.js");
		_js("present.js");
		_js("cosmo.js");
		_js("train.js");
		_js("predict.js");

		_js("libs/d3.v5.min.js");
		_js("libs/three.min.js");
		_js("visualizations/OrbitControls.js");
		_js("visualizations/SVGRenderer.js");
		_js("visualizations/Projector.js");
		_js("visualizations/util.js");
		_js("visualizations/AlexNet.js");
		_js("visualizations/LeNet.js");
		_js("visualizations/FCNN.js");

		_css("libs/classic.min.css");
		_js("libs/atrament.js", 1, 1);
		_js("main.js");


		_js("libs/plotly-latest.min.js", 1, 1);
?>
		
		<script>

			var tf_exists = 1;
			
			try {
				tf;
			} catch (e) {
				tf_exists = 0
			}

			if(!tf_exists) {
				alert("The tensorflow library could not be loaded. This is a serious bug. The site will not work without. Try reloading with CTRL F5.");
			}

			var force_cpu_backend = 0;

			function get_backend() {
				var backend = $("#backend_chooser > input[type=radio]:checked").val();

				return backend;
			}


			tf.env().set("WEBGL_DELETE_TEXTURE_THRESHOLD", 0);

			tf.setBackend('cpu');
			force_cpu_backend = 1;

			<?php
				print "user_id = ";
				if(array_key_exists("session_id", $_COOKIE)) {
					print get_js_user_id_from_session_id($_COOKIE["session_id"]);
				} else {
					print " null";
				}
			?>;

			var load_time = "";

			tf.env().set('WEBGL_PACK_DEPTHWISECONV', false);
		</script>

		<link rel="stylesheet" href="./libs/temml/Temml-Local.css">
		<script src="./libs/temml/temml.min.js"></script>

		<link rel="apple-touch-icon" href="_gui/apple-touch-icon-180x180.png">
		<meta name="theme-color" content="#7299d2">
		<meta name="description" content="A tool for creating Neural Networks with TensorFlow.JS without writing a single line of code.">
		<link rel="shortcut icon" type="image/x-icon" href="favicon.ico">

<?php
		if(isset($_GET["start_cosmo"])) {
			if(isset($_GET["epochs"]) && intval($_GET["epochs"])) {
?>
				<script>
					$(document).ready(async function() {
						while (!finished_loading) {
							await delay(200);
						}
						await set_epochs(<?php print intval($_GET["epochs"]); ?>);
					});
				</script>
<?php
			}

			if(isset($_GET["max_iter"]) && intval($_GET["max_iter"])) {
?>
				<script>
					$(document).ready(async function() {
						while (!finished_loading) {
							await delay(200);
						}
						log("Setting max_activation_iterations to <?php print intval($_GET["max_iter"]); ?>");
						$("#max_activation_iterations").val(<?php print intval($_GET["max_iter"]); ?>);
					});
				</script>
<?php
			}

			if(isset($_GET["max_number_of_files_per_category"]) && intval($_GET["max_number_of_files_per_category"])) {
?>
				<script>
					$(document).ready(async function() {
						while (!finished_loading) {
							await delay(200);
						}
						$("#max_number_of_files_per_category").val(<?php print intval($_GET["max_number_of_files_per_category"]); ?>);
					});
				</script>
<?php
			}

?>
			<script>
				$("#theme_choser").val("light").trigger("change");
			</script>
<?php
		}
?>
	</head>
	<body id='body'>
		<span style="display: none"><input value="dieses leere feld ist dafür da, damit der erste wert immer als referenzwert für die check_number_values gilt, damit es einen default-wert gibt, von dem aus die farbe aus dem theme gewählt werden kann. ziemlich hacky..."></input></span>
		<noscript>
			<span style="font-size: 50px; color: red">You must enable JavaScript for this site to work. Please add an exception to NoScript if you have it installed.</span>
		</noscript>
		<div id="webcam_data" style="display: none"></div>
		<div class="fireworks-container"></div>
		<div id="mainsite" style="display: none">
			<span id='cosmo_mode_header_line' style="display: none" class="show_in_cosmo_mode">
				<img id="scads_logo_cosmo_mode" src="_gui/scads_logo.svg" />
				<img src="_gui/logo_small.png" id="asanai_logo_cosmo" />
				<img id="set_german_language" onclick='set_lang("de")' src='lang/_de.svg' />
				<img id="set_english_language" onclick='set_lang("en")' src='lang/_en.svg' />
				<a><img onclick='emergency_button()' id="emergency_button" src="lang/__de__notaus.png" /></a><br>
			</span>
			<div id="ribbon_shower" class="user_select_none">
				<span class="symbol_button" id="show_hide_ribbon_button" onclick="show_ribbon()">&#9776;</span>
				<span id="custom_webcam_training_data" style="display: none" class="hide_in_cosmo_mode only_when_webcam input_shape_is_image symbol_button" onclick="set_custom_webcam_training_data();$('#custom_webcam_training_data').attr('data-clicked', '1')">&#128248;</span>
				<span id="start_stop_training" class="symbol_button" onclick="train_neural_network();">&#127947;</span>
			</div>
<?php
			if(isset($_GET["start_cosmo"])) {
?>
				<div class="cosmo" id="cosmo_presentation" data-required_skills='loaded_page[1]' data-no_manicule="1" style='display: none'>
<?php
					$files = scandir('presentation/de/');
					$i = 0;
					foreach($files as $file) {
						if((preg_match("/\.png$/i", $file) || preg_match("/\.svg$/i", $file)) && (!isset($_GET["max_presentation"]) || $i <= $_GET["max_presentation"])) {
							$path = "presentation/de/$file";
							print "<div class='slide'><img style='margin-left: auto; margin-right: auto; display: block; max-width: 95%; max-height: 95%; height: 90%; object-fit: contain;' alt='Presentation, page filename: $file' src='$path?t=".get_file_state_identifier($path)."'></div>";
							$i++;
						}
					}
?>
				</div>
<?php
			}

			include("ribbon.php");
?>

			<div id="maindiv">
				<div id="losses_popup" style="display: none">
					<div class="popup_body less_transparent_glass_box">
						<div id="table_div"></div>

						<div class="loss_explanation" id="explanation"></div>
						<button onclick="close_losses()"><span class="TRANSLATEME_close"></span></button>
					</div>
				</div>

				<div id="sources_popup" class="popup" style="display: none;">
					<div class="popup_body less_transparent_glass_box">
						<div> 
<?php
							$file = file_get_contents("README.md");
							print(parse_markdown_links(get_string_between($file, "[comment]: <> (BeginSources)", "[comment]: <> (EndSources)")));
?>
							<button class="close_button" onclick="close_popup('sources_popup')"><span class="TRANSLATEME_close"></span></button>
						</div>
					</div>
				</div>


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

					<div id="register_dialog" class="popup" style="display: none">
						<div class="popup_body less_transparent_glass_box">
							<div id="register_content"> 
								<h1><span class="TRANSLATEME_register"></span></h1>

								<form id="register_form">
									<table>
										<tr>
											<td><span class="TRANSLATEME_email"></span></td>
											<td><input type="email" id="register_email" required></td>
										</tr>

										<tr>
											<td><span class="TRANSLATEME_username"></span></td>
											<td><input id="register_username" minlength="2" required></td>
										</tr>

										<tr>
											<td><span class="TRANSLATEME_password"></span></td>
											<td><input type="password" id="register_password" minlength="8" required></td>
										</tr>

										<tr>
											<td colspan=2>Do you agree with our terms of <a target="_blank" href="license.php">license</a>? <input id="license" type="checkbox" onclick="show_register_button(this)"></td>
										</tr>

										<tr>
											<td><button id="register_button" onclick="register()" style="display: none"><span class="TRANSLATEME_register"></span></button></td>
											<td></td>
										</tr>

										<tr>
											<td><span style="display: none" id="register_error_msg"></span></td>
											<td></td>
										</tr>
									</table>
								</form>

								<h1><span class="TRANSLATEME_login"></span></h1>

								<table>
									<tr>
										<td><span class="TRANSLATEME_username"></span></td>
										<td><input id="login_username"></td>
									</tr>
									<tr>
										<td><span class="TRANSLATEME_password"></span></td>
										<td><input type="password" id="login_password"></td>
									</tr>
									<tr>
										<td><button class="save_button" onclick="login()"><span class="TRANSLATEME_login"></span></button></td>
										<td></td>
									</tr>
									<tr>
										<td><span style="display: none; background-color: green" id="login_error_msg"></span></td>
										<td></td>
									</tr>
								</table>
							</div>
							<br>
						<button class="close_button" onclick="close_popup('register_dialog')"><span class="TRANSLATEME_close"></span></button>
					</div>
				</div>

				<div id="save_model_dialog" class="popup" style="display: none">
					<div class="popup_body less_transparent_glass_box">
						<div id="save_model_content"> 
							<h1><span class="TRANSLATEME_download"></span></h1>
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

				<div class="container" id="errorcontainer" style="display: none">
					<div class="left"></div>
					<div id="error"></div>
				</div>


				<div id="help" style="display: none"></div>
				<div id="toggle_layers_button" ><button style="width: 100%" onclick="toggle_layers()"><span id="robot_layer" class="large_button">&#9881;&#129302;</span></button></div>

				<div class="side_by_side_container">
					<div id="layers_container_left" class="left_side user_select_none">
						<ul id="layers_container" class="ui-sortable"><li></li></ul>
					</div>
					<div class="right_side" id="graphs_here">
						<div id="right_side" class="glass_box" style="float: right; width: 99%; overflow-y: hidden; padding: 2px;">
							<div id="navbar1" class="user_select_none" style="display: flex">
								<ul class="navi_list">
									<li><a id="training_data_tab_label" href="#training_data_tab"><span class='TRANSLATEME_data'></span></a></li>
									<li><a href="#visualization_tab" id="visualization_tab_label"><span class='TRANSLATEME_model_visualization'></span></a></li>
									<li><a href="#summary_tab" onclick="write_model_summary_wait()"><span class="TRANSLATEME_summary"></span></a></li>
									<li><a id="own_image_data_label" href="#own_image_data"><span class="TRANSLATEME_own_images"></span></a></li>
									<li><a id="own_tensor_data_label" href="#own_tensor_data"><span class="TRANSLATEME_own_tensors"></span></a></li>
									<li><a id="own_csv_data_label" href="#own_csv_data"><span class="TRANSLATEME_own_csv"></span></a></li>
									<li><a id="tfvis_tab_label" href="#tfvis_tab"><span class="TRANSLATEME_training"></span></a></li>
									<li><a id="predict_tab_label" href="#predict_tab"><span class="TRANSLATEME_predict"></span></a></li>
									<li><a id="code_tab_label" href="#code_tab"><span class="TRANSLATEME_code"></span></a></li>
								</ul>
								<span id="toggle_layer_view_button" style="" onclick="toggle_layer_view()">&#128470;</span>
							</div>
							<hr id="hr_nav">

							<div id="own_csv_data" class="tab">
								<br>
								<table class="table_border_1px">
									<tr>
										<td>
											
											<table>
												<tr>
													<td>Auto-adjust last layer's number of neurons?</td>
													<td><input type="checkbox" value="1" onchange="show_csv_file(1)" id="csv_auto_adjust_number_of_neurons" checked></td>
												</tr>
												<tr>
													<td>Auto-set last layer's activation to linear when any Y-values are smaller than 0 or greater than 1?</td>
													<td><input type="checkbox" value="1" onchange="show_csv_file(1)" id="auto_set_last_layer_activation" checked></td>
												</tr>
												<tr>
													<td>Shuffle data before doing validation split (recommended)?</td>
													<td><input type="checkbox" value="1" onchange="show_csv_file(1)" id="shuffle_data" checked></td>
												</tr>
												<tr>
													<td>Auto One-Hot-encode Y (disables "divide by")?</td>
													<td><input type="checkbox" value="1" onchange="show_csv_file(1)" id="auto_one_hot_y" checked></td>
												</tr>
												<tr>
													<td>Auto loss/metric?</td>
													<td><input type="checkbox" value="1" id="auto_loss_metric" checked></td>
												</tr>
												<tr>
													<td>Separator</td>
													<td><input onkeyup="show_csv_file()" type="text" value="," style="width: 30px" id="seperator"></td>
												</tr>
											</table>

											<br>
											<br>

											<textarea id="csv_file" style="width: 98%; height: 300px" spellcheck="false" onkeyup="show_csv_file()"></textarea>
										</td>
										<td class="hide_when_no_csv" style="display: none">
											<div id="csv_header_overview"></div>
										</td>
										<td class="hide_when_no_csv" style="display: none">
											<div id="x_y_shape_preview"></div>
										</td>
									</tr>
								</table>
							</div>

							<div id="own_tensor_data" class="tab">
									<div id="prepare_data">
										<span class="TRANSLATEME_pretext_prepare_data"></span><br>
										<pre><code class="language-python" id="convert_data_python">def write_file_for_tfjs (name, data):
	with open(name + '.txt', 'w') as outfile:
	outfile.write('# shape: {0}\n'.format(data.shape))
	for data_slice in data:
		np.savetxt(outfile, data_slice)
		outfile.write('# New slice\n')

	write_file_for_tfjs("x", x_train)	# Writes x.txt with x-data
	write_file_for_tfjs("y", y_train)	# Writes y.txt with y-data
</code></pre>
									<button class="TRANSLATEME_copy_to_clipboard" onclick="copy_id_to_clipboard('convert_data_python')"></button>
								</div>
								<br>
								<div class="upload-btn-wrapper">
									<button class=""><span class="TRANSLATEME_provide_x_data"></span></button>
									<input id="upload_x_file" type="file" name="x_data">
								</div>
								<div class="upload-btn-wrapper">
									<button class="TRANSLATEME_provide_y_data"></button>
									<input id="upload_y_file" type="file" name="y_data">
								</div>
								<br>
								<span class="TRANSLATEME_max_number_of_values"></span>: <input type="number" min="1" value="0" id="max_number_values" style="width: 50px;">
							</div>

							<div id="own_image_data" class="tab">
								<span class="hide_in_cosmo_mode">
									<button onclick="create_and_download_zip()"><span class="TRANSLATEME_download_custom_zip_file"></span></button>
									<br>
									<span class="TRANSLATEME_auto_adjust_last_layer_if_dense"></span>? <input type="checkbox" value="1" id="auto_adjust_number_of_neurons" checked>
									<br>
									<button class="only_when_webcam" id="webcam_start_stop" onclick="get_data_from_webcam()"><span class="TRANSLATEME_enable_webcam"></span></button>
								</span>
								<button style="display: none" class="only_when_front_and_back_camera" onclick="switch_to_next_camera()"><img alt="Switch camera" src="_gui/rotate_camera.svg" width=32 height=32><span class="TRANSLATEME_switch_to_other_cam"></span></button>
								<div id="last_layer_shape_warning"></div>
								<div class='webcam_data only_when_webcam hide_in_cosmo_mode'>
								<span class="TRANSLATEME_number_of_images_in_series"></span>: <input type='number' min=1 value='<?php print preg_match("/^\d+$/", isset($_GET["number_of_series_images"])) ? intval($_GET["number_of_series_images"]) : 40?>' id='number_of_series_images' onchange="alter_text_webcam_series()"><br>
								<span class="TRANSLATEME_delay_between_images"></span>: <input type='number' value='0.5' id='delay_between_images_in_series' min=0 onchange="alter_text_webcam_series()"><br>
								</div>
								<button class='add_category' onclick="add_new_category();">+ <span class="TRANSLATEME_add_category"></span></button>
								<div id="own_image_data_categories"></div>
								<div class="container" id="own_images_container"></div>
							</div>

							<div id="training_data_tab" class="tab">
								<div id="lenet_example_cosmo" class="tab" style="display: none">

									<span class="TRANSLATEME_we_want_to_train_this_model_5_categories" style="display: block"></span>
									<br>
									<center>
										<table border=0>
											<tr>
												<td class='cosmo_example_table'><span class="TRANSLATEME_fire"></span></td>
												<td class='cosmo_example_table'><span class="TRANSLATEME_mandatory"></span></td>
												<td class='cosmo_example_table'><span class="TRANSLATEME_prohibition"></span></td>
												<td class='cosmo_example_table'><span class="TRANSLATEME_rescue"></span></td>
												<td class='cosmo_example_table'><span class="TRANSLATEME_warning"></span></td>
											</tr>
											<tr>
												<td class='cosmo_example_table'><img class='example_imgs_cosmo_mode' src='traindata/signs/fire/116px-Fire_Class_B.svg.png'></td>
												<td class='cosmo_example_table'><img class='example_imgs_cosmo_mode' src='traindata/signs/mandatory/120px-DIN_4844-2_D-M001.svg.png'></td>
												<td class='cosmo_example_table'><img class='example_imgs_cosmo_mode' src='traindata/signs/prohibition/120px-DIN_4844-2_D-P001.svg.png'></td>
												<td class='cosmo_example_table'><img class='example_imgs_cosmo_mode' src='traindata/signs/rescue/120px-DIN_4844-2_WSE001.svg.png'></td>
												<td class='cosmo_example_table'><img class='example_imgs_cosmo_mode' src='traindata/signs/warning/120px-D-W002_Warning_orange.svg.png'></td>
											</tr>
										</table>
									</center>
									<hr class="cosmo_hr">
									<br>
									<img style='width: 90%; max-height: 600px; max-width: 800px;' src="lang/__de__signs_network_cosmo.svg"><br>
								</div>
								<div id="beschreibung_cosmo_laden" style="display: none">
									<hr class="cosmo_hr">
									<span class="TRANSLATEME_the_more_variations_the_model_sees"></span>
								</div>
								<span class="user_select_none">
									<div id="percentage" class="user_select_none reset_before_train_network"></div>
									<button id="stop_downloading" onclick="stop_downloading_data=true" style="display: none">Stop downloading and start training</button>
								</span>
								<div id="photos" style="display: none; height: 95%; min-height: 400px; overflow-y: auto" class="tab reset_before_train_network"><br>Click 'Start training' to start downloading the training data and then train on them.</div>
								<div id="cosmo_mode_visualization" class="tab"></div>
								<div id="xy_display_data" style="display: none; height: 400px; max-height: 400px; overflow-y: auto" class="tab reset_before_train_network"><br>Click 'Start training' to start downloading the training data and then train on them.</div>
								<div class="" id="download_data" style="display: none"></div>
							</div>

							<div id="code_tab" class="tab">
								<ul class="navi_list">
									<li><a href="#python_tab" id="python_tab_label">Python</a></li>
									<li><a href="#python_expert_tab" id="python_expert_tab_label">Python (expert)</a></li>
									<li><a href="#html_tab" id="html_tab_label">HTML</a></li>
								</ul>

								<div id="html_tab" class="tab">
									<br>
									<span class="user_select_none">
										<button onclick="save_model()">
											<span class="TRANSLATEME_download_model_data"></span>
										</button>
									</span>
									<br>
									<pre><code class="language-html" id="html" style="width: 99%"></code></pre>
									<button onclick="copy_id_to_clipboard('html')"><span class="TRANSLATEME_copy_to_clipboard"></span></button>
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
										<button onclick="download_model_for_training(model)">
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


							<div id="visualization_tab" class="tab">
								<ul class="navi_list">
									<li><a id="fcnn_tab_label" href="#fcnn_tab">FCNN</a></li>
									<li><a href="#lenet_tab" id="lenet_tab_label" style="display: none">LeNet</a></li>
									<li><a href="#alexnet_tab" id="alexnet_tab_label">AlexNet</a></li>
									<li><a href="#math_tab" onclick="onclick_math_mode(this, event)" id="math_tab_label"><span class="TRANSLATEME_math"></span></a></li>
									<li style="display: none"><a href="#maximally_activated" id="maximally_activated_label" style="display: none">Maximally activated</a></li>
									<li style="display: none"><a href="#activation_plot_tab" id="activation_plot_tab_label" style="display: none">Activation function</a></li>
								</ul>

								<div id="alexnet_tab" class="tab">
									<div id="alexnet"></div>
									<button class="vis_button" onclick="restart_alexnet(1)"><span class="TRANSLATEME_restart_alexnet"></span></button>
								</div>

								<div id="lenet_tab" class="tab">
									<div id="lenet"></div>
									<button class="vis_button" onclick='reset_view()'><span class="TRANSLATEME_reset_view"></span></button>
									<button class="vis_button" id="download_lenet" onclick="download_visualization('lenet')">Download LeNet SVG</button>
									<button class="vis_button" onclick="restart_lenet(1)"><span class="TRANSLATEME_restart_lenet"></span></button>
								</div>

								<div id="fcnn_tab" class="tab">
									<div id="fcnn"></div>
									<button class="vis_button" onclick='reset_view()'><span class="TRANSLATEME_reset_view"></span></button>
									<button class="vis_button" id="download_fcnn" onclick="download_visualization('fcnn')">Download FCNN SVG</button>
									<button class="vis_button" onclick="restart_fcnn(1)"><span class="TRANSLATEME_restart_fcnn"></span></button>
								</div>

								<div id="activation_plot_tab" class="tab">
									<span id="activation_plot_name" style="display: none"></span>
									<div id="activation_plot" style="display: none"></div>
								</div>

								<div id="maximally_activated" class="tab maximally_activated_class">
									<button id="stop_generating_images_button" style="display: none" onclick="stop_generating_images=1"><span class="TRANSLATEME_stop_generating_images"></span></button>
									<div class="hide_in_cosmo_mode">
										<div class="temml_me">x = \textrm{Input Image}</div>
										<div class="temml_me">x* = \textrm{Generated image}</div>
										<div class="temml_me">W = \textrm{Weights}</div>
										<div class="temml_me">b = \textrm{Bias}</div>
										<div class="temml_me">f(\textbf{x}; \textbf{W}, b) = \textrm{Activation function of neuron}</div>
										<div class="temml_me">\textbf{x}* = \mathrm{argmax}_xf(\textbf{x}; \textbf{W}, b)</div>
									</div>
									<br>
									<button onclick="smaller_maximally_activated_neurons()"><span class="TRANSLATEME_smaller"></span></button>
									<button onclick="larger_maximally_activated_neurons()"><span class="TRANSLATEME_larger"></span></button>
									<button onclick="reset_maximally_activated_neurons()"><span class="TRANSLATEME_reset"></span></button>
									<button onclick="delete_maximally_activated_predictions()"><span class="TRANSLATEME_delete_predictions"></span></button>
									<div id="maximally_activated_content"></div>
								</div>

								<div id="math_tab" class="tab" class="tab">
									<table>
										<tr>
											<td>Number of decimal points (0 = no limit)</td>
											<td><input class="show_data" type="number" style="width: 50px" value="3" min="0" max="16" onchange="write_model_to_latex_to_page(1)" id="decimal_points_math_mode"></td>
										</tr>
									</table>
									<div class="typeset_me" id="math_tab_code"></div>
								</div>
							</div>

							<div id="tfvis_tab" class="tab" style="float: right; width: 100%">
								<br>
								<button class="train_neural_network_button hide_in_cosmo_mode" style="width: 150px;" onclick="train_neural_network()"><span class="TRANSLATEME_start_training"></span></button>
								<br>
								<div class="overlay_each_other">
									<div class="show_only_in_cosmo_mode" style="display: none">
										<span id="program_looks_at_data_span">
											<span class="TRANSLATEME_program_looks_at_data"></span><br>
											<hr class="cosmo_hr">
										</span>

										<span id="cosmo_training_predictions_explanation" style="display:none">
											<span class="TRANSLATEME_predictions_explanation_while_training"></span><br>
										</span>

										<span id="cosmo_training_grid_stage_explanation" style="display: none">
											<span class="TRANSLATEME_the_further_on_top_the_better"></span><br>
										</span>

										<span id="show_current_accuracy" style="display: none"></span><br>

										<span id="cosmo_training_plotly_explanation" style="display:none">
											<span class="TRANSLATEME_graph_explanation"></span><br>
										</span>
									</div>
									<div id='show_cosmo_epoch_status' class="show_only_in_cosmo_mode" style="display: none">
										<hr class="cosmo_hr">
										<span id="network_has_seen_msg" style="display: none">
											<span class="TRANSLATEME_currently_the_network_has_seen"></span>
											<span id="time_estimate_cosmo">00:00</span>.
										</span>
									</div>
									<span id="show_after_training" style="display: none" class="TRANSLATEME_training_done_text"></span>
									<span id="canvas_grid_visualization"></span>
									<span id="show_visualization_here_in_cosmo"></span>
									<br>
									<div id="training_content">
										<div id="simplest_training_data_visualization" style="display: none"></div>
										<div id="plotly_epoch_history_div" style="display: none">
											<div id="plotly_epoch_history"></div>
										</div>

										<div style="display: none" class="hide_in_cosmo_mode">
											<div id="plotly_batch_history"></div>
										</div>

										<div style="display: none" class="hide_in_cosmo_mode">
											<div id="plotly_time_per_batch"></div>
										</div>

										<div style="display: none" class="hide_in_cosmo_mode">
											<div id="plotly_memory_history"></div>
										</div>
									</div>
								</div>
								<div id="confusion_matrix_training"></div>
							</div>

							<div id="summary_tab" class="tab user_select_none">
								<div class="reset_before_train_network" id="summary"></div>
							</div>

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

								<canvas id="grad_cam_heatmap" style="position: fixed; right: 50px; bottom: 50px; display: none"></canvas>

								<div class="container" id="predictcontainer">
									<div class="show_only_in_cosmo_mode">
										
									</div>
									<span id="predict_error" style="overflow: scroll; display: none"></span><br>
									<span id="own_files" class="no_autochoose_next_on_click">
										<div id="generate_images_msg_wrapper" style="display:none">
											<div id="generate_images_msg"></div>
											<img src="_gui/loading_icon.gif" alt="Loading..." style="max-width: 20vw;" />
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
												<input id="upload_file_non_styleable" type="file" accept="image/*" onchange="load_file(event)" value='&#128444;&#128229;'>
											</span>
											<br>
											<span class="full_example_image_prediction display_inline_block only_show_when_predicting_image_file custom_image_data">
												<img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" style="display:none" alt="Output Image" id="output">

												<br>
												<span id="prediction" style="display: none"></span>
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
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="cosmo_next_button_span" style="display: none; position: absolute; right: 10em; font-size: 1em; width: 150px;">
			<span 
				class="green_bg cosmo_button" 
				id="next_button_span"
				data-keep_cosmo="1"
				data-required_skills="loaded_page[1],watched_presentation[1],toggled_webcam[0,1]"
				data-show_again_when_new_skill_acquired="finished_training[1],eigene_webcam[1]"
				data-position="fixed"
				data-dont_hide_after_show="1"
				data-no_scroll="1" 
				style="min-height: 50px; width: 200px;"
				onclick="click_next_button()" 
			>
				<span id="train_train_further"><span class="TRANSLATEME_train_the_neural_network"></span>
			</span>
		</div>

		<div id="demomode" class="glass_box" style="display: none"></div>

		<div id="status_bar" style="display: none">
			<span id="model_is_ok_icon"></span>
			<span id="label_debugger_icon" style="display:none"></span>
			<span id="status_bar_log"></span>

			<span id="data_loading_progress_bar" style="display: none">
				| Loading data:
				<span id="data_progressbar">
					<div></div>
				</span>
			</span>

			<span id="training_progress_bar" style="display: none">
				| Training:
				<span id="training_progressbar">
					<div></div>
				</span>
			</span>

			<span style="left: 50%; right: 50%; position: absolute;">
				<a style="color: inherit; text-decoration: underline;" target="_blank" href="https://scads.ai/imprint/"><span class="TRANSLATEME_imprint"></span></a>
			</span>
			<span id="memory_debugger_div"></span>
		</div>

		<div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; pointer-events: none; background-color: white; user-select: none;" id="loading_icon_wrapper">
			<img src="_gui/scads_logo.svg" alt="Loading..." style="position: absolute; left: 10px; top: 10px; height: 8vw">
			<img src="_gui/logo.svg" alt="Loading..." style="position: absolute; right: 10px; top: 10px; height: 8vw">
			<img src="_gui/loading_icon.gif" alt="Loading..." style="max-width: 20vw;">
			<br>
			<div id="load_msg"></div>
		</div>
<?php
		_js("libs/prism/prism.js");
		_js("libs/prism/prism-python.min.js");
		_js("libs/jscolor.js", 1, 1);
		_js("bottom.js");
		_js("libs/html2canvas.min.js");
?>
	</body>
</html>
