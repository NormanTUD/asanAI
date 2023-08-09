<?php
#Command for finding non awaited JS functions:
#for i in $(grep "^async\s*function " variables.js cosmo.js present.js main.js gui.js model.js train.js tests.js debug.js data.js explain.js safety.js predict.js | sed -e 's#.*async\s*function\s*##' | sed -e 's#\s*(.*##'); do egrep "\s$i\s*\(" variables.js cosmo.js present.js main.js gui.js model.js train.js tests.js debug.js data.js explain.js safety.js predict.js; done | grep -v async | grep -v await | sort | grep -v tests.js | grep -v "+=" | grep -v ':\s*//\s*'
	include("functions.php");

	include("translations.php");
	
	show_admin_register();
	
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
		<script>
			var language = <?php print json_encode($GLOBALS["translations"]); ?>;

			var enable_cosmo_debug = false;
<?php
			if(file_exists("/etc/cosmo_debug")) {
?>
				enable_cosmo_debug = true;
<?php
			}
?>

			function hasWebGL() {
				var supported;

				try {
					var canvas = document.createElement('canvas');
					supported = !!window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
				} catch(e) {
					supported = false;
				}

				try {
					// let is by no means required, but will help us rule out some old browsers/devices with potentially buggy implementations: http://caniuse.com/#feat=let
					eval('let foo = 123;');
				} catch (e) {
					supported = false;
				}

				if (supported === false) {
					l("WebGL is not supported");
				}

				canvas = undefined;

				return supported;
			}

			var has_webgl = hasWebGL();

			var git_hash = "<?php print get_git_hash(); ?>";

			var original_title = document.title;

			var traindata_struct =
<?php
				include("traindata.php");
?>

			var show_layer_trial_error = <?php print array_key_exists("show_layer_trial_error", $_GET) ? 1 : 0; ?>;
		</script>
<?php
		$GLOBALS['minify'] = 1;
		if(array_key_exists("no_minify", $_GET)) {
			$GLOBALS['minify'] = 0;
		}
		$GLOBALS['minify'] = 0;

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

?>
		<?php minify_css("jquery-ui.css"); ?>
		<?php minify_css("style.css"); ?>
		<?php minify_css("ribbon.css"); ?>
		<?php minify_css("${theme_base}mode.css", "css_mode"); ?>
		<?php minify_css("ribbon${theme_base}mode.css", "css_ribbon"); ?>
		<?php minify_css("prism/prism.min.css"); ?>
		<?php minify_css("external/sweetalert2.min.css"); ?>

		<!-- jquery -->
		<?php minify_js("zip.js"); ?>
		<?php minify_js("md5.umd.min.js"); ?>
		<?php minify_js("jquery.js"); ?>
		<?php minify_js("jquery-ui.js"); ?>

		<!-- sweetalert -->
		<?php minify_js("external/sweetalert2.all.js"); ?>

		<!-- tensorflow.js -->
		<?php minify_js("tf/tf.min.js"); ?>
		<?php minify_js("jstat.min.js"); ?>
		<?php minify_js("custom.js"); ?>
		<?php minify_js("jsmanipulate.js", 1, 1); ?>

		<!-- Easter Egg -->
		<?php minify_js("fireworks.js", 1, 1); ?>

		<!-- my own js stuff -->
		<?php minify_js("safety.js"); ?>
		<?php minify_js("variables.js"); ?>
		<?php minify_js("tests.js"); ?>
		<?php minify_js("model.js"); ?>
		<?php minify_js("explain.js"); ?>
		<?php minify_js("data.js"); ?>
		<?php minify_js("debug.js"); ?>
		<?php minify_js("gui.js"); ?>
		<?php minify_js("present.js"); ?>
		<?php minify_js("cosmo.js"); ?>
		<?php minify_js("train.js"); ?>
		<?php minify_js("predict.js"); ?>
		
		<!-- visualizations -->
		<?php minify_js("visualizations/d3.v5.min.js"); ?>
		<?php minify_js("visualizations/three.min.js"); ?>
		<?php minify_js("visualizations/OrbitControls.js"); ?>
		<?php minify_js("visualizations/SVGRenderer.js"); ?>
		<?php minify_js("visualizations/Projector.js"); ?>
		<?php minify_js("visualizations/util.js"); ?>
		<?php minify_js("visualizations/AlexNet.js"); ?>
		<?php minify_js("visualizations/LeNet.js"); ?>
		<?php minify_js("visualizations/FCNN.js"); ?>
		
		<!-- ChardinJS -->
		<?php minify_js("chardinjs.js"); ?>
		
		<?php minify_css("chardinjs.css"); ?>

		<?php minify_css("classic.min.css"); ?>
		<?php minify_js("atrament.js", 1, 1); ?>
		<?php minify_js("main.js"); ?>
		
		<script>
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
			var chardinJs = $("body").chardinJs($("body"));

			var load_time = "";

			tf.env().set('WEBGL_PACK_DEPTHWISECONV', false);
		</script>

		<?php minify_js("plotly-latest.min.js", 1, 1); ?>
		<?php minify_js("translations.js", 1, 1); ?>

		<script src="mathjax/es5/tex-chtml-full.js?config=TeX-AMS-MML_HTMLorMML"></script>
		<script type="text/x-mathjax-config">
			MathJax.Hub.Config({
				tex2jax: {
					inlineMath: [['$','$']]
				},
				jax: ["input/TeX","output/CommonHTML"],
				"showMathMenu": true
			});
		</script>

		<link rel="apple-touch-icon" href="apple-touch-icon-180x180.png">
		<meta name="theme-color" content="#7299d2">
		<meta name="description" content="A tool for creating Neural Networks with TensorFlow.JS without writing a single line of code.">
		<link rel="shortcut icon" type="image/x-icon" href="favicon.ico">

<?php
		if(isset($_GET["start_cosmo"])) {
?>
			<style>
				html {
					font-size: 20px !important;
				}

				.layer_image {
					width: 80px;
				}

				#own_files {
					display: none;
				}
			</style>
<?php
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

			if(0 && isset($_GET["max_iter"]) && intval($_GET["max_iter"])) {
?>
				<script>
					$(document).ready(async function() {
						while (!finished_loading) {
							await delay(200);
						}
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

		}
?>
	</head>
	<body id='body' data-chardin-sequenced="true">
		<noscript>
			<span style="font-size: 50px; color: red">You must enable JavaScript for this site to work. Please add an exception to NoScript if you have it installed.</span>
		</noscript>
		<div id="webcam_data" style="display: none"></div>
		<div class="fireworks-container"></div>
		<div id="mainsite" style="display: none">
			<span>
				<img id="scads_logo_cosmo_mode" src="scads_logo.svg" />
				<img style="display: none; z-index: 999999999999; width: 64px; height: 64px; position: absolute; margin: auto; left: 0px; right: 0px; text-align: center;" src="logo_small.png" id="asanai_logo_cosmo" />
				<a><img onclick='emergency_button()' style="display: none; z-index: 999999999999; width: 80px; height: 80px; position: absolute; top: 10px; right: 10px;" id="emergency_button" src="notaus.png" /></a>
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
					$files = scandir('presentation/');
					$i = 0;
					foreach($files as $file) {
						if(preg_match("/\.svg$/i", $file) && (!isset($_GET["max_presentation"]) || $i <= $_GET["max_presentation"])) {
							print "<div class='slide'><img style='margin-left: auto; margin-right: auto; display: block; max-width: 95%; max-height: 95%; height: 90%; object-fit: contain;' alt='Presentation, page filename: $file' src='presentation/$file'></div>";
							$i++;
						}
					}
?>
				</div>
<?php
			}
?>
			<div id="ribbon" style="overflow: hidden;">
				<ul id="tablist">
					<li><span class="symbol_button" data-intro="Hide Ribbon" title="Hide Ribbon" onclick="hide_ribbon()" style='cursor: pointer; color: gray'>&#9776;</span></li>
					<li><span class="symbol_button" title="Download model" style="cursor: pointer" onclick="manage_download()">&#128190;</span></li>
					<li><span class="symbol_button disabled_symbol" title="Upload model" onclick="open_save_dialog()" style="cursor: pointer">&#128194;</span></li>
					<li><span class="symbol_button disabled_symbol" title="Undo last action" id="undo_button" onclick="undo()">&#8630;</span></li>
					<li><span class="symbol_button disabled_symbol" title="Redo last undone action" id="redo_button" onclick="redo()">&#8631;</span></li>
					<li><span class="symbol_button disabled_symbol" title="Delete model" id="delete_model" onclick="delete_model()" style="cursor: pointer">&#10006;</span></li>
					<li><span id="custom_webcam_training_data_small" style="display: none" class="only_when_webcam hide_in_cosmo_mode input_shape_is_image symbol_button" onclick="set_custom_webcam_training_data()">&#128248;</span></li>
					<li><span id="custom_image_training_data_small" style="display: none" class="only_when_webcam input_shape_is_image symbol_button" onclick="set_custom_image_training()">&#128444;</span></li>
					<li><span class="symbol_button disabled_symbol" data-intro="Shows help. Click anywhere on the page to go to the next help, or press escape to exit help mode." title="Help" style="cursor: help" id="chardinjs_help_icon" onclick="start_chardin_tour()">&#10067;</span></li>
<?php
				if($GLOBALS["use_db"]) {
?>
						<span id="register" onclick="open_register_dialog()">Register/Login</span>
						<span id="logout" onclick="logout()" style="display: none; user-select: none;"><span class="TRANSLATEME_logout" /></span>
<?php
				}
?>
					<li><span class="symbol_button" data-intro="Shows the manual page." title="Help" style="cursor: help" id="manual_page_link" onclick="window.open('manual.html', '_blank').focus();">&#128218;</span></li>
				</ul>


				<div id="home_ribbon" class="ribbon_tab_content" title="Home">
					<div id="logo_ribbon" class="ribbon_tab_content" title="Logo">
						<div class="ribbon-group">
							<div class="ribbon-toolbar" style="width:110px">
								<img width=110 height=110 alt="asanAI Logo" onclick="easter_egg_fireworks()" src="logo_small.png">
							</div>
						</div>
					</div>

					<div class="ribbon-group">
						<div class="ribbon-toolbar" style="width:250px">
							<table class="width_250">
								<tr>
									<td><span class="TRANSLATEME_examples"></span></td>
									<td>
										<select id="dataset" onchange="chose_dataset();$('#prediction').html('');display_delete_button();" style="width: 105px">
										</select>
										<button id="reset_model" style="width: 46px;" onclick="init_page_contents($('#dataset').val())"><span class="TRANSLATEME_reset" /></button>
									</td>
								</tr>
								<tr>
									<td>
										<span class="TRANSLATEME_dataset"></span>
									</td>
									<td>
										<select id="model_dataset" onchange="xy_data=null;change_model_dataset();" style="width: 105px">
										</select>
										<button id="load_weights_button" style="width: 46px;" disabled onclick="load_weights(1)" data-position="right" data-intro="Click here to load pretrained weights for the chosen model"><span class="TRANSLATEME_load" /></button>
									</td>
								</tr>

								<tr>
									<td style="white-space: nowrap;"><span class='TRANSLATEME_own_data'></span>?</td>
									<td>
										<select id="data_origin" onchange="change_data_origin(1)" style="width: 155px;">
											<option value="default">No, default data</option>
											<option value="tensordata">&#x2318; Yes, own tensor-data</option>
											<option class="input_shape_is_image" value="image">&#128444; Yes, own images/webcam</option>
											<option value="csv">&#128290; Yes, own CSV</option>
										</select>
									</td>
								</tr>
							</table>

						</div>
						<div class="ribbon-group-title"><span class='TRANSLATEME_dataset_and_network'></span></div>
					</div>

					<div class="ribbon-group-sep expert_mode_only"></div>
					<div class="ribbon-group-sep-hr"><hr></div>
					<div class="ribbon-group expert_mode_only" data-intro="The loss specifies how the quality of the model should be evaluated while training. The metric is just for you, so you have a basic idea of how good the trained model is.">
						<div class="ribbon-toolbar" style="width: 210px">
							<table>
								<tr>
									<td><span class="TRANSLATEME_loss" /><sup onclick="losses_popup()">?</sup></td>
									<td style="width: 200px">
										<select id="loss" onchange="updated_page()" style="width: 150px">
										</select>
									</td>
								</tr>
								<tr>
									<td><span class="TRANSLATEME_metric" /></td>
									<td style="width: 110px">
										<select id="metric" onchange="change_metrics()" style="width: 150px">
										</select>
									</td>
								</tr>
								<tr>
									<td>Shapes</td>
									<td>
										<input type="text" value="" style="width: 60px;" onchange="update_input_shape()" readonly id="inputShape">
										&rarr;
										<input type="text" value="" style="width: 60px;" readonly id="outputShape">
									</td>
								</tr>
								<tr>
									<td colspan=2>
										Auto-Input-Shape?
										<input type="checkbox" value=1 <?php print array_key_exists("no_auto_input_shape", $_GET) ? "" : "checked"; ?> onchange="allow_edit_inputShape()" id="auto_input_shape">
									</td>
								</tr>
							</table>
						</div>
						<div class="ribbon-group-title">Loss, Metric, Data and Shapes</div>
					</div>

					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group-sep-hr"><hr></div>
					<div class="ribbon-group" style="display:none">
						<div class="ribbon-toolbar" style="width:100px">
							<input type="number" id="number_of_layers" value="2" min="1" step="1" style="width: 85%">
						</div>
						<div class="ribbon-group-title">Layers</div>
					</div>

					<div class="ribbon-group" data-intro="You can set basic hyperparameters here">
						<div class="ribbon-toolbar" style="width: 135px">
							<table>
								<tr><td><span class="TRANSLATEME_epochs"></span></td><td><input type="number" id="epochs" value="2" min="1" step="1" style="width: 40px;"></td></tr>
								<tr><td><span class="TRANSLATEME_batch_size"></span></td><td><input type="number" id="batchSize" value="10" min="1" step="1" style="width: 40px;"></td></tr>
								<tr><td><span class="TRANSLATEME_valsplit" />&nbsp;%</td><td><input type="number" min="0" max="99" step="5" value="20" style="width: 40px;" id="validationSplit"></td></tr>
							</table>
							<div class="ribbon-group-title"><span class="TRANSLATEME_hyperparameters" /></div>
						</div>
					</div>
					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group-sep-hr"><hr></div>


					<div id="image_resize_dimensions" class="hide_when_no_image">
						<div class="ribbon-group" data-intro="Special settings for image-networks. Allows resizing and limiting the number of images per category.">
							<div class="ribbon-toolbar" style="width:115px">
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
										<td><span class="TRANSLATEME_img_per_cat" /></td>
										<td><input type="number" min="0" value="100" id="max_number_of_files_per_category" style="width: 40px"></td>
									</tr>
									<tr class="expert_mode_only">
										<td><span class="TRANSLATEME_augment" />?</td>
										<td><input type="checkbox" onclick="show_hide_augment_tab()" id="auto_augment"></td>
									</tr>
								</table>
							</div>
							<div class="ribbon-group-title"><span class="TRANSLATEME_image_options"></span></div>
						</div>
						<div class="ribbon-group-sep"></div>
						<div class="ribbon-group-sep-hr"><hr></div>
					</div>

					<div class="ribbon-group" data-intro="Basic training settings are here. You can also start training here.">
						<div class="ribbon-toolbar">
							<table>
								<tr>
									<td colspan=2>
										<button class="train_neural_network_button start_training" data-intro="Starts training. Shortcut: CTRL ," style="min-width: 100%" onclick="train_neural_network()"><span class="TRANSLATEME_start_training"></span></button>
									</td>
								</tr>
								<tr class="expert_mode_only">
									<td>
										<span class="symbol_button">&#x1F4C9;</span> Autotab?
									</td>
									<td>
										<input class="show_data" type="checkbox" value="1" id="jump_to_interesting_tab" checked>
									</td>
								</tr>
								<tr class="expert_mode_only">
									<td>
										<span class="TRANSLATEME_divide_x_by" />:
									</td>
									<td>
										<input style="width: 50px;" value="1" type="number" id="divide_by" onchange="repredict()">
									</td>
								</tr>
								<tr>
									<td colspan=2>
										<button class="expert_mode_only" style="width:100%" onclick="force_reinit()">Reinitialize weights</button>
									</td>
								</tr>
							</table>
						</div>
						<div class="ribbon-group-title"><span class="TRANSLATEME_training" /></div>
					</div>
				</div>

				<div id="tf_ribbon_settings" class="ribbon_tab_content" title="General">
					<div class="ribbon-group">
						<div class="ribbon-toolbar">
							<fieldset style="border-width: 0px" id="backend_chooser" data-intro="CPU is faster for small datasets while WebGL is faster for larger datasets if you have a GPU"> 
								<input type="radio" onchange="set_backend()" name="backend_chooser" value="cpu" id="cpu_backend" checked>
								<label for="svg_renderer">CPU</label>

								<input type="radio" onchange="set_backend()" name="backend_chooser" value="webgl" id="webgl_backend">
								<label for="webgl_renderer">WebGL</label>
							</fieldset>
				<script>
				if(force_cpu_backend) {
					$($("input[name='backend_chooser']")[0]).click().trigger("change")
				}
				</script>
							<hr>
							<fieldset style="border-width: 0px" id="mode_chooser" data-intro="The beginner settings check model configuration for plausibility (only from a technical point of view, not for plausibility of the data analysis methods). If you chose 'expert', no checks on the model plausibility are made."> 
							<input type="radio" onchange="set_mode()" name="mode_chooser" value="beginner" id="beginner" <?php
				$checked = 1;
				if(array_key_exists("mode", $_COOKIE) && $_COOKIE["mode"] == "expert") {
					$checked = 0;
				}

				if($checked) { print "checked"; }

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
						<div class="ribbon-group" data-intro="Here you can set the webcam">
							<div class="ribbon-toolbar">
								<select id="which_webcam" onchange="restart_webcams()">
								</select>
							</div>
							<div class="ribbon-group-title">Webcam options</div>
						</div>
					</div>

					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group-sep-hr"><hr></div>
					<div class="ribbon-group" data-intro="Set options regarding the weights here.">
						<div class="ribbon-toolbar">
							<table>
								<tr>
								       <td><span class="TRANSLATEME_shuffle_before_each_epoch"></span>?</td>
								       <td><input type="checkbox" value=1 checked id="shuffle_before_each_epoch"></td>
								</tr>
								<tr>
									<td><span class="TRANSLATEME_enable_tf_debug" /></td>
									<td><input type="checkbox" value="1" onchange="tf_debug();" id="enable_tf_debug"></td>
								</tr>
								<tr class="hide_when_no_alexnet">
									<td>AlexNet-Renderer</td>
									<td>
										<fieldset style="border-width: 0px" id="alexnet_renderer"> 
											<!--<legend>AlexNet-renderer:</legend> -->
											<input type="radio" onchange="restart_alexnet()" name="alexnet_renderer" value="webgl" id="webgl_renderer">
											<label for="webgl_renderer">WebGL</label>
											<input type="radio" onchange="restart_alexnet()" name="alexnet_renderer" value="svg" id="svg_renderer" checked>
											<label for="svg_renderer">SVG</label>
										</fieldset>
									</td>
								</tr>

							</table>

						</div>
						<div class="ribbon-group-title">Weights/Shuffle/Renderer/Debug</div>
					</div>

					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group-sep-hr"><hr></div>
					<div class="ribbon-group" data-intro="Here you can set specific options that are then applied to all layers.">
						<div class="ribbon-toolbar">
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
						</div>
						<div class="ribbon-group-title"><span class=''></span></div>
					</div>

					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group-sep-hr"><hr></div>
					<div class="ribbon-group" data-intro="Here you can set specific options that are then applied to all layers.">
						<div class="ribbon-toolbar">
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
										<input class="set_all_initializers_input" id="set_all_initializers_value_value" onchange="change_all_initializers()" value="1" />
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
										<input class="set_all_initializers_input" id="set_all_initializers_value_scale" onchange="change_all_initializers()" value="1" />
									</td>
								</tr>
								<tr class="set_all_initializers_tr set_all_initializers_maxval" style="display: none">
									<td>
										Maxval:
									</td>
									<td>
										<input class="set_all_initializers_input" id="set_all_initializers_value_maxval" onchange="change_all_initializers()" value="1" />
									</td>
								</tr>
								<tr class="set_all_initializers_tr set_all_initializers_minval" style="display: none">
									<td>
										Minval:
									</td>
									<td>
										<input class="set_all_initializers_input" id="set_all_initializers_value_minval" onchange="change_all_initializers()" value="-1" />
									</td>
								</tr>
								<tr class="set_all_initializers_tr set_all_initializers_stddev" style="display: none">
									<td>
										Stddev:
									</td>
									<td>
										<input class="set_all_initializers_input" id="set_all_initializers_value_stddev" onchange="change_all_initializers()" value="1" />
									</td>
								</tr>
								<tr class="set_all_initializers_tr set_all_initializers_seed" style="display: none">
									<td>
										Seed:
									</td>
									<td>
										<input class="set_all_initializers_input" id="set_all_initializers_value_seed" onchange="change_all_initializers()" value="1" />
									</td>
								</tr>
							</table>
						</div>
						<div class="ribbon-group-title"><span class="TRANSLATEME_set_all_initializers" /></div>
					</div>

					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group-sep-hr"><hr></div>
					<div class="ribbon-group" data-intro="The optimizer tries to minimize the loss. Here you can set the optimizer's settings.">
						<div class="ribbon-toolbar">
							<table>
								<tr>
									<td><span class="TRANSLATEME_optimizer" /></td>
									<td>
										<select id="optimizer" onchange='change_optimizer()' style="width: 100px">
											<option value="adam">adam</option>
											<option value="adadelta">adadelta</option>
											<option value="adagrad">adagrad</option>
											<option value="adamax">adamax</option>
											<option value="rmsprop">rmsprop</option>
											<option value="sgd">sgd</option>
										</select>
									</td>
								</tr>
							</table>

							<br><br>

							<div id="optimizer_table">
								<div class="optimizer_metadata" style="display: none;" id="sgd_metadata">
									<table>
										<tr>
											<td><span class='TRANSLATEME_learning_rate' /></td>
											<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.01" id="learningRate_sgd"></td>
										</tr>
									</table>
								</div>

								<div class="optimizer_metadata" style="display: none;" id="adagrad_metadata">
									<table>
										<tr>
											<td><span class='TRANSLATEME_learning_rate' /></td>
											<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.01" id="learningRate_adagrad"></td>

											<td>Initial accumulator value</td>
											<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.1" id="initialAccumulatorValue_adagrad"></td>
										</tr>
									</table>
								</div>

								<div class="optimizer_metadata" style="display: none;" id="adam_metadata">
									<table>
										<tr>
											<td><span class='TRANSLATEME_learning_rate' /></td>
											<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.001" id="learningRate_adam"></td>

											<td>&beta;<sub>1</sub></td>
											<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.9" id="beta1_adam"></td>
										</tr>

										<tr>
											<td>&beta;<sub>2</sub></td>
											<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.999" id="beta2_adam"></td>

											<td>&epsilon;</td>
											<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.0001" id="epsilon_adam"></td>
										</tr>
									</table>
								</div>

								<div class="optimizer_metadata" style="display: none;" id="adadelta_metadata">
									<table>
										<tr>
											<td><span class='TRANSLATEME_learning_rate' /></td>
											<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.001" id="learningRate_adadelta"></td>

											<td>&rho;</td>
											<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.95" id="rho_adadelta"></td>
										</tr>

										<tr>

											<td>&epsilon;</td>
											<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.0001" id="epsilon_adadelta"></td>
											<td></td>
											<td></td>
										</tr>
									</table>
								</div>

								<div class="optimizer_metadata" style="display: none;" id="adamax_metadata">
									<table>
										<tr>
											<td><span class='TRANSLATEME_learning_rate' /></td>
											<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.002" id="learningRate_adamax"></td>

											<td>&beta;<sub>1</sub></td>
											<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.9" id="beta1_adamax"></td>

											<td>&epsilon;</td>
											<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.0001" id="epsilon_adamax"></td>
										</tr>
										<tr>

											<td>&beta;<sub>2</sub></td>
											<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.999" id="beta2_adamax"></td>

											<td>Decay</td>
											<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0" id="decay_adamax"></td>
											<td></td>
											<td></td>
										</tr>
									</table>
								</div>

								<div class="optimizer_metadata" style="display: none;" id="rmsprop_metadata">
									<table>
										<tr>
											<td><span class='TRANSLATEME_learning_rate' /></td>
											<td><input class="optimizer_metadata_input" type="number" min="0" max="1" step="0.00000000001" value="0.01" id="learningRate_rmsprop"></td>

											<td>Decay</td>
											<td><input class="optimizer_metadata_input" type="number" min="0" max="1" step="0.000001" value="0.9" id="decay_rmsprop"></td>
										</tr>
										<tr>
											<td>Momentum</td>
											<td><input class="optimizer_metadata_input" type="number" min="0" max="1" step="0.01" value="0" id="momentum_rmsprop"></td>

											<td>&epsilon;</td>
											<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.0001" id="epsilon_rmsprop"></td>
										</tr>
									</table>
								</div>

								<div class="optimizer_metadata" style="display: none;" id="momentum_metadata">
									<table>
										<tr>
											<td><span class='TRANSLATEME_learning_rate' /></td>
											<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.01" id="learningRate_momentum"></td>

											<td>Momentum</td>
											<td><input class="optimizer_metadata_input" type="number" min="0" max="1" step="0.01" value="0.9" id="momentum_momentum"></td>
										</tr>
									</table>
								</div>
							</div>
						</div>
						<div class="ribbon-group-title"><span class="TRANSLATEME_optimizer" /></div>
					</div>
				</div>

				<div id="tf_ribbon_augmentation" class="ribbon_tab_content" title="Augmentation" style="display: none">
					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group-sep-hr"><hr></div>
					<div class="ribbon-group" data-intro="Set options regarding automatic data augmentation here.">
						<div class="ribbon-toolbar">
							<table>
								<tr>
									<td>Auto rotate images?</td>
									<td><input type="checkbox" value=1 id="augment_rotate_images"></td>
									<td>Sine-Ripple?</td>
									<td><input type="checkbox" value=1 id="augment_sine_ripple"></td>
								</tr>
								<tr>
									<td>Number of rotations?</td>
									<td><input type="number" min=1 value=4 id="number_of_rotations"></td>
									<td></td>
									<td></td>
								</tr>
								<tr>
									<td>Invert images?</td>
									<td><input type="checkbox" value=1 id="augment_invert_images"></td>
									<td></td>
									<td></td>
								</tr>
								<tr>
									<td>Flip left/right?</td>
									<td><input type="checkbox" value=1 id="augment_flip_left_right"></td>
									<td></td>
									<td></td>
								</tr>
							</table>
						</div>
						<div class="ribbon-group-title"><span class="TRANSLATEME_augmentation" /></div>
					</div>
				</div>

				<div id="visualization_ribbon" class="ribbon_tab_content" title="Visualization">
					<div class="hide_when_no_conv_visualizations">
						<div class="ribbon-group-sep"></div>
						<div class="ribbon-group-sep-hr"><hr></div>
						<div class="ribbon-group">
							<div class="ribbon-group">
								<div class="ribbon-toolbar" style="width: auto; max-width: 500px;">
									<table>
										<tr data-intro="Number of iterations to create the maximally-activated-neuron-patterns">
											<td><span class="TRANSLATEME_iterations" /></td>
											<td><input type="number" min="1" value="30" id="max_activation_iterations" style="width: 80px;"></td>
										</tr>
										<tr>
											<td>Randomizer limits</td>
											<td><input type="number" min="0" max="1000" step="0.00001" value="0.001" id="randomizer_limits" style="width: 80px;"></td>
										</tr>
										<tr>
											<td>Width&amp;height (0 = auto):</td>
											<td><input type="number" min="0" max="1000" step="1" value="0" id="max_activated_neuron_image_size" style="width: 80px;"></td>
										</tr>
									</table>
								</div>
							</div>
							<div class="ribbon-group-title">Max. activated neurons</div>
						</div>
					</div>

					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group-sep-hr"><hr></div>
					<div class="ribbon-group">
						<div class="ribbon-group">
							<div class="ribbon-toolbar" style="width: auto; max-width: 500px;">
								<table>
									<tr data-intro="Max. Number of Neurons/Filters in FCNN">
										<td>Max. neurons FCNN?</td>
										<td><input class="show_data" type='number' value="32" min=0 id="max_neurons_fcnn" style="width: 55px"></td>
									</tr>
									<tr data-intro="Show the input layer in the visualizations?">
										<td>Show Input-Layer?</td>
										<td><input class="show_data" type='checkbox' value="1" checked onclick="toggle_show_input_layer()" id="show_input_layer"></td>
									</tr>
									<tr data-intro="How many seconds before re-plotting the batch-graph?">
										<td>Batch-Plot-Minimum-Time (s)</td>
										<td><input class="show_data" type='number' value="5" min=0 id="min_time_between_batch_plots" style="width: 55px"></td>
									</tr>
								</table>
							</div>
						</div>
						<div class="ribbon-group-title">FCNN/LeNet/AlexNet, Batch-Plot</div>
					</div>

					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group-sep-hr"><hr></div>
					<div class="ribbon-group">
						<div class="ribbon-group">
							<div class="ribbon-toolbar" style="width: auto; max-width: 500px;">
								<table>
									<tr data-intro="In the predict page, show visual bars instead of numbers">
										<td>Show bars instead of numbers?</td>
										<td><input class="show_data" type='checkbox' checked id="show_bars_instead_of_numbers" onclick="updated_page()"></td>
									</tr>
									<tr data-intro="Visualize images by grouping visually">
										<td>Visualize images in grid?</td>
										<td><input class="show_data" type='checkbox' checked id="visualize_images_in_grid"></td>
									</tr>
									<tr data-intro="Visualize images by grouping visually">
										<td>Number of grid images?</td>
										<td><input class="show_data" type='text' value='50' id="max_number_of_images_in_grid" style='width: 50px;'></td>
									</tr>
								</table>
							</div>
						</div>
						<div class="ribbon-group-title">Various Plots</div>
					</div>

					<div id="data_plotter" style="display: none">
						<div class="ribbon-group-sep"></div>
						<div class="ribbon-group-sep-hr"><hr></div>
						<div class="ribbon-group">
							<div class="ribbon-group">
								<div class="ribbon-toolbar" style="width: auto; max-width: 300px;">
									<table>
										<tr data-intro="Show raw data in layer data flow?">
											<td>Show raw data?</td>
											<td><input class="show_data" type='checkbox' id="show_raw_data"></td>
										</tr>
										<tr>
											<td>Pixel size</td>
											<td><input type="number" min="1" max="100" value="1" onchange="change_pixel_size()" onkeyup="change_pixel_size()" id="pixel_size" style="width: 80px;"></td>
										</tr>
										<tr>
											<td>Kernel Pixel size</td>
											<td><input type="number" min="1" max="100" value="10" onchange="change_kernel_pixel_size()" onkeyup="change_kernel_pixel_size()" id="kernel_pixel_size" style="width: 80px;"></td>
										</tr>
									</table>
								</div>
							</div>
							<div class="ribbon-group-title">Layer data flow</div>
						</div>
					</div>
				</div>

				<div id="log_ribbon" class="ribbon_tab_content" title="Log">
					<div class="ribbon-group" style="width: auto;">
						<div class="ribbon-toolbar">
							<textarea style="width: 1400px; height: 90px; font-size: 14px" readonly id="log"></textarea>
						</div>
						<button onclick="copy_to_clipboard($('#log').val());"><span class="TRANSLATEME_copy_to_clipboard" /></button>
						<div class="ribbon-group-title">Log</div>
					</div>

				</div>


				<div id="imprint_ribbon" class="ribbon_tab_content" title="Imprint&Contact">
					<div class="ribbon-group" style="width: auto;">
						<div class="ribbon-toolbar">
							<button onclick='window.open("https://scads.ai/imprint", "_blank");' style="width: 200px"><span class="TRANSLATEME_imprint" /></button><br><br>
							<button style="width: 200px" onclick="location.href='mailto:norman.koch@tu-dresden.de'">norman.koch@tu-dresden.de</button><br><br>
							<button style="width: 200px" onclick="sources_popup()">Sources and used programs</button>
						</div>
						<div class="ribbon-group-title"><span class="TRANSLATEME_imprint" /></div>
					</div>

				</div>
			</div>

			<div id="maindiv">
				<div id="losses_popup" style="display: none">
					<div class="popup_body less_transparent_glass_box">
						<div id="table_div"></div>

						<div class="loss_explanation" id="explanation"></div>
						<button onclick="close_losses()"><span class="TRANSLATEME_close" /></button>
					</div>
				</div>

				<div id="sources_popup" class="popup" style="display: none;">
					<div class="popup_body less_transparent_glass_box">
						<div> 
<?php
				$file = file_get_contents("README.md");
				print(parse_markdown_links(get_string_between($file, "[comment]: <> (BeginSources)", "[comment]: <> (EndSources)")));
?>
							<button class="close_button" onclick="closePopup('sources_popup')"><span class="TRANSLATEME_close" /></button>
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

								<button class="close_button" onclick="closePopup('save_dialog')"><span class="TRANSLATEME_close" /></button>
							</div>
						</div>
					</div>

					<div id="register_dialog" class="popup" style="display: none">
						<div class="popup_body less_transparent_glass_box">
							<div id="register_content"> 
								<h1><span class="TRANSLATEME_register" /></h1>

								<form id="register_form">
									<table>
										<tr>
											<td><span class="TRANSLATEME_email" /></td>
											<td><input type="email" id="register_email" required></td>
										</tr>

										<tr>
											<td><span class="TRANSLATEME_username" /></td>
											<td><input id="register_username" minlength="2" required></td>
										</tr>

										<tr>
											<td><span class="TRANSLATEME_password" /></td>
											<td><input type="password" id="register_password" minlength="8" required></td>
										</tr>

										<tr>
											<td colspan=2>Do you agree with our terms of <a target="_blank" href="license.php">license</a>? <input id="license" type="checkbox" onclick="show_register_button(this)"></td>
										</tr>

										<tr>
											<td><button id="register_button" onclick="register()" style="display: none"><span class="TRANSLATEME_register" /></button></td>
											<td></td>
										</tr>

										<tr>
											<td><span style="display: none" id="register_error_msg"></span></td>
											<td></td>
										</tr>
									</table>
								</form>

								<h1><span class="TRANSLATEME_login" /></h1>

								<table>
									<tr>
										<td><span class="TRANSLATEME_username" /></td>
										<td><input id="login_username"></td>
									</tr>
									<tr>
										<td><span class="TRANSLATEME_password" /></td>
										<td><input type="password" id="login_password"></td>
									</tr>
									<tr>
										<td><button class="save_button" onclick="login()"><span class="TRANSLATEME_login" /></button></td>
										<td></td>
									</tr>
									<tr>
										<td><span style="display: none; background-color: green" id="login_error_msg"></span></td>
										<td></td>
									</tr>
								</table>
							</div>
							<br>
						<button class="close_button" onclick="closePopup('register_dialog')"><span class="TRANSLATEME_close" /></button>
					</div>
				</div>

				<div id="save_model_dialog" class="popup" style="display: none">
					<div class="popup_body less_transparent_glass_box">
						<div id="save_model_content"> 
							<h1><span class="TRANSLATEME_download" /></h1>
							<button class="save_button" onclick="save_model();download_weights_json();"><span class="TRANSLATEME_download" /></button>

							<div style="display: none" class="show_when_logged_in">
								<h1>Save to DB</h1>
								<span id="save_model_msg" style="display: none"></span><br>
								<input id="network_name" onkeyup="has_network_name(this)" placeholder="Network name"><br>
								<span class="TRANSLATEME_public" />: <input id="is_public" type="checkbox"><br>
								<button class="save_button" id="save_to_db" onclick="save_to_db_wrapper()" disabled><span class="TRANSLATEME_save" /></button>
							</div>
						</div>
						<br>
						<button class="close_button" onclick="closePopup('save_model_dialog')"><span class="TRANSLATEME_close" /></button>
					</div>
				</div>

				<div class="container" id="errorcontainer" style="display: none">
					<div class="left"></div>
					<div id="error"></div>
				</div>


				<div id="help" style="display: none"></div>
				<!--<div id="toggle_layers_button"  data-required_skills="finished_training[2],added_custom_category[2]" class="cosmo" data-dont_hide_after_show="1"><button style="width: 100%" onclick="toggle_layers()"><span id="robot_layer" class="large_button">&#9881;&#129302;</span></button></div>-->
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
									<li><a href="#visualization_tab" id="visualization_tab_label" data-intro="Show different kind of visualizations to help you design the network you want."><span class='TRANSLATEME_model_visualization'></span></a></li>
									<li><a href="#summary_tab" onclick="write_model_summary_wait()" data-intro="Shows the model.summary of the currently configured model"><span class="TRANSLATEME_summary"></span></a></li>
									<li><a id="own_image_data_label" href="#own_image_data"><span class="TRANSLATEME_own_images"></span></a></li>
									<li><a id="own_tensor_data_label" href="#own_tensor_data"><span class="TRANSLATEME_own_tensors"></span></a></li>
									<li><a id="own_csv_data_label" href="#own_csv_data"><span class="TRANSLATEME_own_csv" /><span class="TRANSLATEME_csv" /></a></li>
									<li><a id="tfvis_tab_label" href="#tfvis_tab" data-intro="Shows the training data (if possible) and the training progress."><span class="TRANSLATEME_training" /></a></li>
									<li id="predict_tab_label"><a href="#predict_tab" data-intro="Allows you to predict data from the trained model."><span class="TRANSLATEME_predict" /></a></li>
									<li><a id="code_tab_label" href="#code_tab" data-intro="Shows Python/NodeJS/TensorFlow.js-HTML-Code of the currently configured neural network."><span class="TRANSLATEME_code" /></a></li>
								</ul>
								<span id="toggle_layer_view_button" style="user-select: none; position: relative; top: 6px" onclick="toggle_layer_view()">&#128470;</span>
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
									You must prepare your dataset yourself! You can use this piece of code to generate
									the data file in the correct format after you pre-processed them.
									<pre><code class="language-python" id="convert_data_python">def write_file_for_tfjs (name, data):
	with open(name + '.txt', 'w') as outfile:
	outfile.write('# shape: {0}\n'.format(data.shape))
	for data_slice in data:
	    np.savetxt(outfile, data_slice)
	    outfile.write('# New slice\n')

	write_file_for_tfjs("x", x_train)	# Writes x.txt with x-data
	write_file_for_tfjs("y", y_train)	# Writes y.txt with y-data</code></pre>
									<button onclick="copy_id_to_clipboard('convert_data_python')"><span class="TRANSLATEME_copy_to_clipboard" /></button>
								</div>
								<br>
								<div class="upload-btn-wrapper">
									<button class="">Provide X-data file</button>
									<input id="upload_x_file" type="file" name="x_data">
								</div>
								<div class="upload-btn-wrapper">
									<button class="">Provide Y-data file</button>
									<input id="upload_y_file" type="file" name="y_data">
								</div>
								<br>
								Max number of values (0 = no limit): <input type="number" min="1" value="0" id="max_number_values" style="width: 50px;">
							</div>

							<div id="own_image_data" class="tab">
								<span class="hide_in_cosmo_mode">
									<button onclick="create_and_download_zip()">Download custom data in a .zip file</button>
									<br>
									Auto-adjust last layer's number of neurons (if Dense)? <input type="checkbox" value="1" id="auto_adjust_number_of_neurons" checked>
									<br>
									<button class="only_when_webcam" id="webcam_start_stop" onclick="get_data_from_webcam()"><span class="TRANSLATEME_enable_webcam" /></button>
								</span>
								<button style="display: none" class="only_when_front_and_back_camera" onclick="switch_to_next_camera()"><img alt="Switch camera" src="rotate_camera.svg" width=32 height=32><span class="TRANSLATEME_switch_to_other_cam" /></button>
								<div id="last_layer_shape_warning"></div>
								<div class='webcam_data only_when_webcam hide_in_cosmo_mode'>
								Number of images in a series: <input type='number' min=1 value='<?php print preg_match("/^\d+$/", isset($_GET["number_of_series_images"])) ? intval($_GET["number_of_series_images"]) : 40?>' id='number_of_series_images' onchange="alter_text_webcam_series()"><br>
								Delay in seconds between images in a series: <input type='number' value='0.5' id='delay_between_images_in_series' min=0 onchange="alter_text_webcam_series()"><br>
								</div>
								<button class='add_category' onclick="add_new_category();">+ <span class="TRANSLATEME_add_category"></span></button>
								<div id="own_image_data_categories"></div>
								<div class="container" id="own_images_container"></div>
							</div>

							<div id="training_data_tab" class="tab">
								<div id="lenet_example_cosmo" class="tab" style="display: none">
									<span class="TRANSLATEME_lets_suppose_we_have_this_simple_network" style="display: block"></span>
									<img style='width: 90%; max-height: 400px; max-width: 500px;' src="signs_network.svg"><br>
									<hr class="cosmo_hr">
									<span class="TRANSLATEME_we_want_to_train_this_model_5_categories" style="display: block"></span>
									<br>
									<center>
										<table border=0>
											<tr>
												<td class='cosmo_example_table'><span class="TRANSLATEME_fire"></span>:</td>
												<td class='cosmo_example_table'><span class="TRANSLATEME_mandatory"></span>:</td>
												<td class='cosmo_example_table'><span class="TRANSLATEME_forbidden"></span>:</td>
												<td class='cosmo_example_table'><span class="TRANSLATEME_rescue"></span>:</td>
												<td class='cosmo_example_table'><span class="TRANSLATEME_warning"></span>:</td>
											</tr>
											<tr>
												<td class='cosmo_example_table'><img class='example_imgs_cosmo_mode' src='traindata/signs//fire/116px-Fire_Class_B.svg.png'></td>
												<td class='cosmo_example_table'><img class='example_imgs_cosmo_mode' src='traindata/signs//mandatory/120px-DIN_4844-2_D-M001.svg.png'></td>
												<td class='cosmo_example_table'><img class='example_imgs_cosmo_mode' src='traindata/signs//prohibition/120px-DIN_4844-2_D-P001.svg.png'></td>
												<td class='cosmo_example_table'><img class='example_imgs_cosmo_mode' src='traindata/signs//rescue/120px-DIN_4844-2_WSE001.svg.png'></td>
												<td class='cosmo_example_table'><img class='example_imgs_cosmo_mode' src='traindata/signs//warning/120px-D-W002_Warning_orange.svg.png'></td>
											</tr>
										</table>
									</center>
								</div>
								<div id="beschreibung_cosmo_laden" style="display: none">
									Jetzt werden <span id="number_of_images_per_category">5</span> Bilder aus jeder Kategorie geladen.
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
									<li><a href="#html_tab" id="html_tab_label">HTML</a></li>
								</ul>

								<div id="html_tab" class="tab">
									<br>
									<button onclick="save_model()"><span class="TRANSLATEME_download_model_data" /></button>
									<br>
									<pre><code class="language-html" id="html" style="width: 99%"></code></pre>
									<button onclick="copy_id_to_clipboard('html')"><span class="TRANSLATEME_copy_to_clipboard" /></button>
								</div>


								<div id="python_tab" class="tab">
									<br>
									<span class="user_select_none">
										<button onclick="copy_id_to_clipboard('python')"><span class="TRANSLATEME_copy_to_clipboard" /></button>
										<button onclick="save_model()"><span class="TRANSLATEME_download_model_data" /></button>
										<button onclick="download_model_for_training(model)"><span class="TRANSLATEME_download_for_local_taurus" /></button>
									</span>
									<br>
									<pre><code class="language-python" id="python" style="width: 99%"></code></pre>
								</div>
							</div>


							<div id="visualization_tab" class="tab">
								<ul class="navi_list">
									<li><a id="fcnn_tab_label" href="#fcnn_tab">FCNN</a></li>
									<li><a href="#lenet_tab" id="lenet_tab_label" style="display: none">LeNet</a></li>
									<li><a href="#alexnet_tab" id="alexnet_tab_label">AlexNet</a></li>
									<li><a href="#math_tab" onclick="onclick_math_mode(this, event)" id="math_tab_label"><span class="TRANSLATEME_math" /></a></li>
									<!--<li><a href="#conv_explanations" id="conv_explanations_label">Convolutional explanations</a></li>-->
									<li style="display: none"><a href="#maximally_activated" id="maximally_activated_label" style="display: none">Maximally activated</a></li>
									<li style="display: none"><a href="#activation_plot_tab" id="activation_plot_tab_label" style="display: none">Activation function</a></li>
								</ul>

								<div id="alexnet_tab" class="tab">
									<div id="alexnet"></div>
									<!-- <button id="download_alexnet" onclick="download_visualization('alexnet')">Download AlexNet SVG (but without dimension labels)</button> -->
									<button class="vis_button" onclick="restart_alexnet(1)">Restart AlexNet</button>
								</div>

								<div id="lenet_tab" class="tab">
									<div id="lenet"></div>
									<button class="vis_button" onclick='reset_view()'>Reset view</button>
									<button class="vis_button" id="download_lenet" onclick="download_visualization('lenet')">Download LeNet SVG</button>
									<button class="vis_button" onclick="restart_lenet(1)">Restart LeNet</button>
								</div>

								<div id="fcnn_tab" class="tab">
									<div id="fcnn"></div>
									<button class="vis_button" onclick='reset_view()'>Reset view</button>
									<button class="vis_button" id="download_fcnn" onclick="download_visualization('fcnn')">Download FCNN SVG</button>
									<button class="vis_button" onclick="restart_fcnn(1)">Restart FCNN</button>
								</div>

								<div id="activation_plot_tab" class="tab">
									<span id="activation_plot_name" style="display: none"></span>
									<div id="activation_plot" style="display: none"></div>
								</div>

								<div id="maximally_activated" class="tab maximally_activated_class">
									<br>
									<button onclick="smaller_maximally_activated_neurons()"><span class="TRANSLATEME_smaller" /></button>
									<button onclick="larger_maximally_activated_neurons()"><span class="TRANSLATEME_larger" /></button>
									<button onclick="reset_maximally_activated_neurons()"><span class="TRANSLATEME_reset" /></button>
									<button onclick="delete_maximally_activated_predictions()"><span class="TRANSLATEME_delete_predictions" /></button>
									<div id="maximally_activated_content"></div>
								</div>

								<div id="math_tab" class="tab" class="tab">
									<table data-intro="Options for the math mode.">
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
								<button class="train_neural_network_button hide_in_cosmo_mode" data-intro="Starts training. Shortcut: CTRL ," style="width: 150px;" onclick="train_neural_network()"><span class="TRANSLATEME_start_training" /></button>
								<br>
								<div class="overlay_each_other">
									<div class="show_only_in_cosmo_mode" style="display: none">
										<span class="TRANSLATEME_program_looks_at_data"></span><br>
										<span class="TRANSLATEME_the_further_on_top_the_better"></span><br>
										<hr class="cosmo_hr">
										<span class="TRANSLATEME_quality_depends_on_random"></span>
									</div>
									<div id='show_cosmo_epoch_status' class="show_only_in_cosmo_mode" style="display: none">
										<hr class="cosmo_hr">
										<span class="TRANSLATEME_currently_the_network_has_seen"></span> <span id='current_epoch_cosmo_display'>0</span> <span class="TRANSLATEME_of"></span> <span id="max_epoch_cosmo_display"></span> <span class="TRANSLATEME_times_seen"></span> <span class="TRANSLATEME_it_will_take_about"></span> <span id="time_estimate_cosmo">00:00</span> <span class="TRANSLATEME_remain_left"></span>.
									</div>
									<span id="canvas_grid_visualization"></span>
									<span id="show_visualization_here_in_cosmo"></span>
									<br>
									<div id="training_content">
										<div id="simplest_training_data_visualization" style="display: none"></div>
										<div style="display: none">
											<h3 class="hide_in_cosmo_mode"><span class="TRANSLATEME_epochs" />:</h3>
											<div id="plotly_epoch_history"></div>
										</div>

										<div style="display: none" class="hide_in_cosmo_mode">
											<h3><span class="TRANSLATEME_batches" />:</h3>
											<div id="plotly_batch_history"></div>
										</div>

										<div style="display: none" class="hide_in_cosmo_mode">
											<h3>Time per batch (in seconds):</h3>
											<div id="plotly_time_per_batch"></div>
										</div>

										<div style="display: none" class="hide_in_cosmo_mode">
											<h1><span class="TRANSLATEME_memory_usage_while_training" />:</h1>
											<div id="plotly_memory_history"></div>
										</div>
									</div>
								</div>
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

								<canvas id="grad_cam_heatmap" style="position: fixed; left: 50px; bottom: 50px; display: none"></canvas>

								<div class="container" id="predictcontainer">
									<div class="show_only_in_cosmo_mode">
										
									</div>
									<span id="own_files" class="no_autochoose_next_on_click">
										<span class="hide_when_image">
											<span id="predict_own">
												<textarea id="predict_own_data" style="width: 100%; height: 200px"></textarea>
												<br>
												<button onclick="predict($('#predict_own_data').val());repredict()"><span class="TRANSLATEME_predict" /></button>
											</span>
										</span>

										<span id='webcam_tab' class="hide_when_no_image custom_image_data">
											<button class="only_when_webcam hide_in_cosmo_mode large_button no_border_button" id="show_webcam_button" onclick="show_webcam();">&#128247;</button><br>
											<button style="display: none" class="only_when_front_and_back_camera" onclick="switch_to_next_camera_predict()"><img alt="Switch camera" src="rotate_camera.svg" width=32 height=32><span class="TRANSLATEME_switch_to_other_cam"></span></button>
											<span style='display: block' class="full_example_image_prediction ">
												<span id="webcam"></span>
												<span id="webcam_prediction" style="overflow: scroll;"></span>
											</span>
											<br>
										</span>

										<span class="hide_when_no_image custom_image_data">
											<span id="upload_file" class="show_data no_box_shadow ">
												<span id="upload_file_styleable"  onclick="document.getElementById('upload_file_non_styleable').click();" class='large_button'>&#128444;&#128229;</span>
												<input id="upload_file_non_styleable" type="file" accept="image/*" onchange="loadFile(event)" style="display:none;">
											</span>
											<br>
											<span class="full_example_image_prediction only_show_when_predicting_image_file custom_image_data">
												<img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" style="display:none" alt="Output Image" id="output">

												<br>

												<span id="predict_error" style="overflow: scroll; display: none"></span><br>
												<span id="prediction" style="display: none"></span>
											</span>
										</span>

										<span id="prediction_non_image" style="display: none"></span>

										<span id="handdrawn_img" class="handdrawn hide_when_no_image" style='text-align: justify'>
											<span class="full_example_image_prediction">
												<span id='predict_handdrawn_canvas'></span><br>
												<span id="handdrawn_predictions"></span>
											</span>
										</span>
									</span>

									<br>

									<div class="hide_when_custom_data">
										<div id="example_predictions">
										</div>
									</div>
								</div>

								<div id="layer_visualizations_tab" style="display: none" class="tab">
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div id="demomode" class="glass_box" style="display: none"></div>

		<div id="status_bar" style="display: none">
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
				<!--
				<span style="display: none">
					| Approximation: <span id="approximation_equation"></span>
				</span>
				-->
			</span>

			<span style="left: 50%; right: 50%; position: absolute;">
				<a style="color: inherit; text-decoration: underline;" target="_blank" href="https://scads.ai/imprint/"><span class="TRANSLATEME_imprint"></span></a>
			</span>
			<span id="memory_debugger_div"></span>
		</div>

		<div class="cosmo_next_button_span" style="display: none; position: absolute; bottom: 50px; right: 10px; font-size: 0.7em; width: 200px;">
			<span class="symbol_button" id="next_button_span"><button id="next_button" data-dont_hide_after_show="1" data-no_scroll="1" data-cosmo_level_text="finished_training[1]='Weiter trainieren'" class="cosmo cosmo_autoset_text cosmo_button green_bg" onclick="remove_manicule(1);train_neural_network();$('#next_button').attr('data-clicked', '1');remove_manicule(1);" style="min-height: 50px; width: 200px; " id="cosmo_next_button" data-keep_cosmo="1" data-required_skills="loaded_page[1],watched_presentation[1],toggled_webcam[0,1]" data-show_again_when_new_skill_acquired="finished_training[1],eigene_webcam[1]" data-position="fixed" >Das Netzwerk trainieren</button></span>
		</div>

		<div style="display: flex; justify-content: center; align-items: center; height: 100vh; pointer-events: none; background-color: white; user-select: none;" id="loading_icon_wrapper">
			<img src="scads_logo.svg" alt="Loading..." style="position: absolute; left: 10px; top: 10px; height: 67px">
			<img src="logo.svg" alt="Loading..." style="position: absolute; right: 10px; top: 10px; height: 67px">
			<img src="Loading_icon.gif" alt="Loading..." style="max-width: 100%;">
			<br>
			<div id="load_msg"></div>
		</div>

		<script>
			function get_color_coded_neurons (number_of_layers) {
				var colors = [
					{ "number": 1000, "color": "red" },
					{ "number": 100, "color": "yellow" },
					{ "number": 10, "color": "blue" }
				];

				var left = number_of_layers;

				var results = [];

				for (var i = 0; i < colors.length; i++) {
					var number = colors[i]["number"];
					var color = colors[i]["color"];

					while (left > number) {
						results.push(color);
						left = left - number;
					}
				}

				for (var i = 0; i < left; i++) {
					results.push("white");
				}

				return results;
			}

			var get_methods = (obj) => Object.getOwnPropertyNames(obj).filter(item => typeof obj[item] === 'function')
			var local_store = window.localStorage;
			local_store.clear();

			var old_mode = "beginner";

			function get_mode() {
				var mode = $("#mode_chooser > input[type=radio]:checked").val();
				if(mode != old_mode && (state_stack.length > 1 || future_state_stack.length)) {
					state_stack = [];
					future_state_stack = [];

					show_hide_undo_buttons();
					Swal.fire(
						'Undo/redo stack lost!',
						"Changing the mode deletes the undo/redo stack.",
						'warning'
					);
					l("Changed mode " + old_mode + " to " + mode + ", lost undo/redo stack");
				} else {
					if(mode != old_mode) {
						l("Changed mode " + old_mode + " to " + mode);
					}
				}

				if(old_mode != mode) {
					setCookie("mode", mode);
				}

				return mode;
			}


			function set_mode () {
				mode = get_mode();
				setCookie("mode", mode);
				if(mode == "beginner") {
					throw_compile_exception = false;
					$(".layer_type").children().children().each(function (t, l) {
						if(!$(l).is(":checked")) {
							$(l).attr("disabled", true);
						}
					});
					$("#auto_input_shape").prop('checked', true);
					$(".expert_mode_only").hide();
					l("Auto input shape is only available on Expert Mode");
				} else {
					throw_compile_exception = true;
					$(".expert_mode_only").show();
				}

				disable_everything_in_last_layer_enable_everyone_else_in_beginner_mode();
			}
			
			var clicked_on_tab = 0;

			var currentLayer = 0;

			var seed_two = 1;
			function random_two(min, max) { // Seeded PRNG
				var x = Math.sin(seed_two++) * 10000;
				result = x - Math.floor(x);
				result = ((max - min) * result) + min;
				return result;
			}



			var seed = 1;
			function random(min, max) { // Seeded PRNG
				var x = Math.sin(seed++) * 10000;
				result = x - Math.floor(x);
				result = ((max - min) * result) + min;
				return result;
			}

			function get_units_at_layer(i, use_max_layer_size) {
				var units = undefined;
				try {
					var units = get_item_value(i, "units");
					if(units) {
						units = parseInt(units);
					} else {
						if(model === null) {
							units = 0;
						} else {
							var filters = $($(".layer_setting")[i]).find(".filters");
							if(filters.length) {
								units = parseInt($(filters).val());
							} else {
								try {
									units = Math.max(0, model.layers[i].countParams());
								} catch (e) {
									console.warn("Something went wrong when trying to determine get_units_at_layer");
								}
							}
						}
					}
				} catch (e) {
					log(e);
				}

				var max_neurons_fcnn = parseInt($("#max_neurons_fcnn").val());

				if(units > max_neurons_fcnn && use_max_layer_size) {
					l("FCNN-Visualization: Units is " + units + ", which is bigger than " + max_neurons_fcnn + ". " + max_neurons_fcnn + " is the maximum, it will get set to this for layer " + i);
					units = max_neurons_fcnn;
				}

				return units;
			}

			function scale_down (max_value, architecture) {
				var relations = [];
				var new_architecture = [];
				for (var i = 0; i < architecture.length; i++) {
					var item = architecture[i];
					if(item <= max_value) {
						relations.push(0);
					} else {
						relations.push(item / max_value);
					}
				}

				for (var i = 0; i < architecture.length; i++) {
					var item = architecture[i];
					var relation = relations[i];

					if(relation) {
						new_architecture.push(max_value + Math.ceil(relation));
					} else {
						new_architecture.push(item);
					}

				}

				return new_architecture;
			}

			var fcnn = FCNN();

			async function restart_fcnn(force) {
				if(!model) {
					log("FCNN: No model");
					return;
				}

				if(force) {
					graph_hashes["fcnn"] = "";
				}

				var architecture = [];
				var real_architecture = [];
				var betweenNodesInLayer = [];
				var layer_types = [];

				if(show_input_layer) {
					layer_types.push("Input layer");
					try {
						var input_layer = Object.values(remove_empty(model.layers[0].input.shape));
						architecture.push(input_layer[0]);
						real_architecture.push(input_layer[0]);
						betweenNodesInLayer.push(10);
					} catch (e) {
						console.error(e);
						return;
					}
				}

				for (var i = 0; i < get_number_of_layers(); i++) {
					var number_of_units = get_units_at_layer(i, 1);
					var layer_type = $($(".layer_type")[i]).val();
					if(parseInt(number_of_units) > 0) {
						real_architecture.push(number_of_units);
						if(number_of_units > 100) {
							number_of_units = 100;
						}
						architecture.push(number_of_units);
						betweenNodesInLayer.push(10);
						layer_types.push(layer_type);
					}
				}

				var redraw_data = {
					'architecture_': architecture, 
					'real_architecture_': real_architecture, 
					'layerTypes_': layer_types,
					'colors_': []
				};

				var redistribute_data = {
					'betweenNodesInLayer_': betweenNodesInLayer
				};
				var new_hash = await md5(JSON.stringify(redraw_data) + JSON.stringify(redistribute_data));

				if(graph_hashes["fcnn"] != new_hash) {
					if(architecture.length + real_architecture.length) {
						fcnn.redraw(redraw_data);
						fcnn.redistribute(redistribute_data);
						graph_hashes["fcnn"] = new_hash;
					} else {
						log("invalid architecture lengths");
					}
				}
				reset_view();
			}

			var disable_alexnet = 0;

			var alexnet = AlexNet();
                        async function restart_alexnet(dont_click) {
				seed = 1;
				var architecture = [];
				var architecture2 = [];
				var colors = [];

				disable_alexnet = 0;

				for (var i = 0; i < get_number_of_layers(); i++) {
					if(disable_alexnet) { continue; }
					var layer_type = $($(".layer_type")[i]).val();
					if(typeof(layer_type) === 'undefined') {
						return;
					}
					if(layer_type in layer_options && Object.keys(layer_options[layer_type]).includes("category")) {
						var category = layer_options[layer_type].category;

						if(category == "Convolutional") {
							var this_layer_arch = {};
							try {
								var input_layer_shape = model.layers[i].getOutputAt(0).shape;

								var push = 0;

								try {
									this_layer_arch["height"] = input_layer_shape[1];
									this_layer_arch["width"] = input_layer_shape[2];
									if(input_layer_shape.length >= 2) {
										this_layer_arch["depth"] = input_layer_shape[3];
									} else {
										disable_alexnet = 1;
									}
									this_layer_arch["filterWidth"] = parseInt(get_item_value(i, "kernel_size_x"));
									this_layer_arch["filterHeight"] = parseInt(get_item_value(i, "kernel_size_y"));
									this_layer_arch["rel_x"] = random(0, 0.1);
									this_layer_arch["rel_y"] = random(0, 0.1);

									if(this_layer_arch["filterWidth"] && this_layer_arch["filterHeight"] && this_layer_arch["depth"]) {
										push = 1;
									}
								} catch (e) {
									console.warn("ERROR: ", e);
								}
							} catch (e) {
								console.log(e);
								return;
							}

							if(push) {
								architecture.push(this_layer_arch);
							}
						} else if (category == "Basic") {
							try {
								var units_at_layer = get_units_at_layer(i, 0);
								if(units_at_layer) {
									architecture2.push(units_at_layer);
								}
							} catch (e) {
								log(e);
								return;
							}
						}
					} else {
						log("Cannot get category of layer type of layer " + i);
						return;
					}
				}

				if(!disable_alexnet) {
					try {
						if(architecture.length && architecture2.length) {
							try {
								if(show_input_layer) {
									var shown_input_layer = {};
									var input_shape = get_input_shape();
									shown_input_layer["height"] = input_shape[0];
									shown_input_layer["width"] = input_shape[1];
									if(input_shape.length >= 3) {
										shown_input_layer["depth"] = input_shape[2];
									} else {
										disable_alexnet = 1;
									}
									shown_input_layer["filterWidth"] = 1;
									shown_input_layer["filterHeight"] = 1;
									shown_input_layer["rel_x"] = random(-0.1,0.1);
									shown_input_layer["rel_y"] = random(-0.1,0.1);

									architecture.unshift(shown_input_layer);
								}

								var redraw_data = {'architecture_': architecture, 'architecture2_': architecture2, "showDims": true};

								var new_hash = await md5(JSON.stringify(redraw_data));

								if(graph_hashes["alexnet"] != new_hash) {
									alexnet.restartRenderer(1);
									alexnet.redraw(redraw_data);
									graph_hashes["alexnet"] = new_hash;
								}
							} catch (e) {
								console.warn(e);
								disable_alexnet = 1;
							}
						} else {
							disable_alexnet = 1;
						}
					} catch (e) {
						console.warn(e);
						disable_alexnet = 1;
					}
				}

				if(disable_alexnet) {
					if(!is_cosmo_mode) {
						hide_tab_label("alexnet_tab_label");
						if(!dont_click) {
							if(clicked_on_tab == 0) {
								show_tab_label("fcnn_tab_label", click_on_graphs);
								clicked_on_tab = 1
							}
						}
					}
				} else {
					if(!is_cosmo_mode) {
						show_tab_label("alexnet_tab_label", 0);
						if(!dont_click) {
							if(clicked_on_tab == 0) {
								show_tab_label('alexnet_tab_label', click_on_graphs);
								clicked_on_tab = 1;
							}
						}
					}
				}
				reset_view();

				conv_visualizations["alexnet"] = !disable_alexnet;
                        }

			var lenet = LeNet();

                        async function restart_lenet(dont_click) {
				var layer_to_lenet_arch = {};
				architecture = [];
				architecture2 = [];
				colors = [];

				var j = 0;
				if(!show_input_layer) {
					j--;
				}

				for (var i = 0; i < get_number_of_layers(); i++) {
					var layer_type = $($(".layer_type")[i]).val();
					if(typeof(layer_type) === 'undefined') {
						return;
					}

					if(layer_type in layer_options && Object.keys(layer_options[layer_type]).includes("category")) {
						var category = layer_options[layer_type]["category"];

						if((category == "Convolutional" || category == "Pooling") && layer_type.endsWith("2d") && layer_type.startsWith("conv")) {
							try {
								var this_layer_arch = {};
								this_layer_arch["op"] = layer_type;
								this_layer_arch["layer"] = ++j;

								var layer_config = model.layers[i].getConfig();
								var push = 0;
								if("filters" in layer_config) {
									this_layer_arch["filterWidth"] = get_item_value(i, "kernel_size_x");
									this_layer_arch["filterHeight"] = get_item_value(i, "kernel_size_y");
									this_layer_arch["numberOfSquares"] = layer_config["filters"];
									push = 1;
								} else if("poolSize" in layer_config) {
									var output_size_this_layer = await output_size_at_layer(get_input_shape(), i);
									this_layer_arch["filterWidth"] = get_item_value(i, "pool_size_x");
									this_layer_arch["filterHeight"] = get_item_value(i, "pool_size_y");
									this_layer_arch["numberOfSquares"] = output_size_this_layer[3];
									push = 1;
								}

								var input_layer = model.layers[i].getInputAt(0);
								this_layer_arch["squareWidth"] = input_layer["shape"][1];
								this_layer_arch["squareHeight"] = input_layer["shape"][2];

								if(push) {
									architecture.push(this_layer_arch);
									layer_to_lenet_arch[i] = {arch: "architecture", "id": architecture.length - 1};
									colors.push("#ffffff");
								}
							} catch (e) {
								console.error(e);
							}
						} else if (category == "Basic") {
							try {
								var units_at_layer = get_units_at_layer(i, 0);
								if(units_at_layer) {
									architecture2.push(units_at_layer);
									layer_to_lenet_arch[i] = {"arch": "architecture2", "id": architecture.length - 1};
								}
							} catch (e) {
								return;
							}
						}

					} else {
						log("Cannot get category of layer type of layer " + i);
						return;
					}
				}

				var disable_lenet = 0;

				try {
					if(architecture.length >= 1 && architecture2.length) {
						if(show_input_layer) {
							var shown_input_layer = {}
							shown_input_layer["op"] = "Input Layer";
							shown_input_layer["layer"] = 0;
							shown_input_layer["filterWidth"] = get_input_shape()[0];
							shown_input_layer["filterHeight"] = get_input_shape()[1];
							shown_input_layer["numberOfSquares"] = 1;
							shown_input_layer["squareWidth"] = get_input_shape()[0];
							shown_input_layer["squareHeight"] = get_input_shape()[1];
							architecture.unshift(shown_input_layer);
						}

						try {
							var redraw_data = {'architecture_': architecture, 'architecture2_': architecture2, 'colors': colors};
							var new_hash = await md5(JSON.stringify(redraw_data));
							if(graph_hashes["lenet"] != new_hash) {
								lenet.redraw(redraw_data);
								lenet.redistribute({'betweenLayers_': []});
								graph_hashes["lenet"] = new_hash;
							}
						} catch (e) {
							log(e);
						}
					} else {
						disable_lenet = 1;
					}
				} catch (e) {
					log("ERROR: ");
					log(e);
					disable_lenet = 2;
				}

				if(disable_lenet) {
					if(!is_cosmo_mode) {
						hide_tab_label("lenet_tab_label");
						if(clicked_on_tab == 0) {
							if(!dont_click) {
								show_tab_label("fcnn_tab_label", click_on_graphs);
								clicked_on_tab = 1;
							}
						}
					}
				} else {
					if(!is_cosmo_mode) {
						show_tab_label("lenet_tab_label", 0);
						if(clicked_on_tab == 0) {
							if(!dont_click) {
								show_tab_label("lenet_tab_label", click_on_graphs);
								clicked_on_tab = 1;
							}
						}
					}
				}

				reset_view();
				conv_visualizations["lenet"] = !disable_lenet;
			}

			

			function unset_alexnet_renderer () {
				var renderers = $("#alexnet_renderer > input[type=radio]");
				for (var i = 0; i < renderers.length; i++) {
					$(renderers[i]).prop("checked", false)
				}
			}

			function set_specific_alexnet_renderer(var_type) {
				unset_alexnet_renderer();
				var renderers = $("#alexnet_renderer > input[type=radio]");
				for (var i = 0; i < renderers.length; i++) {
					if($(renderers[i]).val() == var_type) {
						$(renderers[i]).prop("checked", true);
					}else {
						$(renderers[i]).prop("checked", false);
					}
				}
				restart_alexnet()
			}

			function download_visualization (layer_id) {
				var old_alexnet_renderer = $("#alexnet_renderer > input[type=radio]:checked").val();
				if(layer_id == "alexnet") {
					set_specific_alexnet_renderer("svg");
					restart_alexnet()
				}
				var content = $('<div>').append($($("#" + layer_id).html()).attr("xmlns", "http://www.w3.org/2000/svg") ).html();
				if(layer_id == "alexnet") {
					var canvas = $($("#alexnet")[0]).children()[0];
					content = canvas.toDataURL();
				}
							

				var data_url = 'data:application/octet-stream;base64,' + btoa(unescape(encodeURIComponent(content)))
				var a = document.createElement("a");
				a.href = data_url;
				a.download = layer_id + ".svg";
				a.click();
				if(layer_id == "alexnet") {
					set_specific_alexnet_renderer(old_alexnet_renderer);
					restart_alexnet()
				}
			}

			$(".show_after_training").hide();

			favicon_default();

			enable_disable_kernel_images();
			enable_disable_grad_cam();

			$(document).keyup(function(e) {
				if (e.key === "Escape") { // escape key maps to keycode `27`
					chardinJs.stop();
				}
			});

			if(window.location.href.indexOf("function_debugger") > -1) {
				add_function_debugger();
			}

			document.addEventListener("DOMContentLoaded", init_own_image_files, false);

			function init_own_image_files() {
				$(".own_image_files").unbind("change");
				$(".own_image_files").change(handleFileSelect);
				rename_labels();
			}

			function get_nr_from_own_image_files (e) {
				var currentTarget = e.currentTarget;

				var nr = null;

				$(".own_image_files").each(function (x, y) {
					if (get_element_xpath(y) == get_element_xpath(currentTarget)) { nr = x };
				});

				return nr;
			}

			function handleFileSelect(e) {
				if(!e.target.files || !window.FileReader) return;

				var upload_nr = get_nr_from_own_image_files(e);

				var imgDiv = $($(".own_images")[upload_nr]);

				var filesArr = Array.prototype.slice.call(e.target.files);
				filesArr.forEach(function(f) {
					if(!f.type.match("image.*")) {
						return;
					}
					var reader = new FileReader();
					reader.onload = function (e) {
						var html = '<span class="own_image_span"><img height="90" id="' + uuidv4() + '_image" src="' + e.target.result + '"><span onclick="delete_own_image(this)">&#10060;&nbsp;&nbsp;&nbsp;</span></span>';
						imgDiv.append(html);
						disable_start_training_button_custom_images();
					}
					reader.readAsDataURL(f);
				});

				disable_start_training_button_custom_images();
			}

			if(window.location.href.indexOf("run_tests") > -1) {
				run_tests();
			}

			install_memory_debugger();

			load_time = Date().toLocaleString();
			set_mode();
		</script>
		<?php minify_js("prism/prism.js"); ?>
		<?php minify_js("prism/prism-python.min.js"); ?>
		<?php minify_js("jscolor.js", 1, 1); ?>
	</body>
</html>
