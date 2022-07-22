<?php
	include("functions.php");
	
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
		<link rel="manifest" href="manifest.json" />

		<script>
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

			var original_title = document.title;

			var traindata_struct =
<?php
				include("traindata.php");
?>

			var show_layer_trial_error = <?php print array_key_exists("show_layer_trial_error", $_GET) ? 1 : 0; ?>;
		</script>

		<link rel="stylesheet" href="./wizard_style.css">
<?php
		$GLOBALS['minify'] = 1;
		if(array_key_exists("no_minify", $_GET)) {
			$GLOBALS['minify'] = 0;
		}
$GLOBALS['minify'] = 0;
?>
		<?php minify_css("wand.css"); ?>
		<?php minify_css("jquery-ui.css"); ?>
		<?php minify_css("style.css"); ?>
		<?php minify_css("ribbon.css"); ?>
		<?php minify_css("lightmode.css", "css_mode"); ?>
		<?php minify_css("ribbonlightmode.css", "css_ribbon"); ?>
		<?php minify_css("prism/prism.min.css"); ?>
		<?php minify_css("external/sweetalert2.min.css"); ?>


		<!-- jquery -->
		<?php minify_js("md5.umd.min.js"); ?>
		<?php minify_js("jquery.js"); ?>
		<?php minify_js("jquery-ui.js"); ?>

		<!-- sweetalert -->
		<?php minify_js("external/sweetalert2.all.js"); ?>

		<!-- tensorflow.js -->
		<?php minify_js("tf/tf.min.js"); ?>
		<script>
			var force_cpu_backend = 0;

			function get_backend() {
				var backend = $("#backend_chooser > input[type=radio]:checked").val();

				return backend;
			}

			function set_backend() {
				var backend = get_backend();
				tf.setBackend(backend);
			}

			tf.env().set("WEBGL_DELETE_TEXTURE_THRESHOLD", 0);

			if(!hasWebGL()) {
				tf.setBackend('cpu');
				force_cpu_backend = 1;
			}
		</script>

		<!-- Easter Egg -->
		<?php minify_js("fireworks.js"); ?>
		<!-- my own js stuff -->
		<?php minify_js("safety.js"); ?>
		<?php minify_js("variables.js"); ?>
		<?php minify_js("tests.js"); ?>
		<?php minify_js("model.js"); ?>
		<?php minify_js("explain.js"); ?>
		<?php minify_js("data.js"); ?>
		<?php minify_js("debug.js"); ?>
		<?php minify_js("gui.js"); ?>
			<script>
				/*
				(function(){
				    var oldLog = console.log;
				    console.log = function (message) {
					    l(message);
					oldLog.apply(console, arguments);
				    };
				})();

				(function(){
				    var oldWarn = console.warn;
				    console.warn = function (message) {
					    l("WARNING: " + message);
					oldWarn.apply(console, arguments);
				    };
				})();
				 */
			</script>
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
		<?php minify_js("atrament.min.js"); ?>
		
		<script>
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

		<?php minify_js("plotly-latest.min.js"); ?>

		<script type="text/javascript" src="mathjax/es5/tex-chtml-full.js?config=TeX-AMS-MML_HTMLorMML"></script>

		<link rel="apple-touch-icon" href="apple-touch-icon-180x180.png">
		<meta name="theme-color" content="#7299d2">
		<meta name="description" content="A tool for learning how to use TensorFlow without writing a single line of code">
	</head>
	<body data-chardin-sequenced="true">
		<div class="fireworks-container"></div>
		<div id="mainsite">
			<div id="ribbon_shower">
				<span class="symbol_button" onclick="show_ribbon()">&#9776;</span>
				<span class="symbol_button" title="Show wizard" onclick="$('#wizard').toggle();write_descriptions()">&#129497;</span>
				<span id="custom_webcam_training_data" style="display: none" class="only_when_webcam input_shape_is_image symbol_button" onclick="set_custom_webcam_training_data()">&#128248;</span>
				<span id="start_stop_training" class="symbol_button" onclick="train_neural_network()">&#127947;</span>
			</div>
			<div id="ribbon" style="overflow: hidden;">
				<ul id="tablist">
					<li><span class="symbol_button" data-intro="Hide Ribbon" title="Hide Ribbon" onclick="hide_ribbon()" style='cursor: pointer; color: gray'>&#9776;</span></li>
					<li><span class="symbol_button" title="Download model" style="cursor: pointer" onclick="manage_download()">&#128190;</span></li>
					<li><span class="symbol_button disabled_symbol" title="Upload model" onclick="open_save_dialog()" style="cursor: pointer">&#128194;</span></li>
					<li><span class="symbol_button disabled_symbol" title="Undo last action" id="undo_button" onclick="undo()">&#8630;</span></li>
					<li><span class="symbol_button disabled_symbol" title="Redo last undone action" id="redo_button" onclick="redo()">&#8631;</span></li>
					<li><span class="symbol_button" title="Show wizard" onclick="$('#wizard').toggle();write_descriptions()">&#129497;</span></li>
					<li><span class="symbol_button disabled_symbol" title="Delete model" id="delete_model" onclick="delete_model()" style="cursor: pointer">&#10006;</span></li>
					<li><span id="custom_webcam_training_data_small" style="display: none" class="only_when_webcam input_shape_is_image symbol_button" onclick="set_custom_webcam_training_data()">&#128248;</span></li>
					<li><span class="symbol_button disabled_symbol" data-intro="Shows help. Click anywhere on the page to go to the next help, or press escape to exit help mode." title="Help" style="cursor: help" id="chardinjs_help_icon" onclick="start_chardin_tour()">&#10067;</span></li>
<?php
					if($GLOBALS["use_db"]) {
?>
						<span id="register" onclick="open_register_dialog()">Register/Login</span>
						<span id="logout" onclick="logout()" style="display: none; user-select: none;">Logout</span>
<?php
					}
?>
					<span id="tensor_number_debugger" style="display: none"></span>
				</ul>


				<div id="home_ribbon" class="ribbon_tab_content" title="Home">
					<div id="logo_ribbon" class="ribbon_tab_content" title="Logo">
						<div class="ribbon-group">
							<div class="ribbon-toolbar" style="width:110px">
								<img height=110 alt="asanAI Logo" onclick="easter_egg_fireworks()" src="favico_tb.png" />
							</div>
						</div>
					</div>

					<div class="ribbon-group-sep"></div>

					<div class="ribbon-group">
						<div class="ribbon-toolbar" style="width:350px">
							<table width=360>
								<tr>
									<td>
										Problem type:
									</td>
									<td colspan="2">
										<select data-position="right" data-intro="Choose a category here (images, classification, your own data)" id="dataset_category" onchange="init_dataset_category();show_or_hide_load_weights();model_is_trained=false;set_config();$('#prediction').html('');setCookie('dataset_category',$(this).val());" style="width: 244px">
										</select>
									</td>
								</tr>
								<tr>
									<td>
										Architecture:
									</td>
									<td colspan="2">
										<select id="dataset" onchange="chose_dataset();$('#prediction').html('');display_delete_button();" style="width: 144px">
										</select>
										<button id="reset_model" onclick="init_page_contents($('#dataset').val())">Reset Network</button>
									</td>
								</tr>
								<div>
									<tr>
										<td>
											Dataset:
										</td>
										<td colspan=2>
											<select id="model_dataset" onchange="xy_data=null;change_model_dataset();" style="width: 204px">
											</select>
											<button id="load_weights_button" disabled="true" onclick="load_weights(1)" position="right" data-intro="Click here to load pretrained weights for the chosen model">Load</button>
										</td>
									</tr>
								</div>
								<tr>
									<td>Shapes: </td>
									<td><input type="text" value="" style="width: 105px;" onchange="update_input_shape()" readonly id="inputShape" />&nbsp;&rarr;&nbsp;<input type="text" value="" style="width: 102px;" readonly id="outputShape" /></td>
								</tr>
							</table>

						</div>
						<div class="ribbon-group-title">Dataset and Network</div>
					</div>

					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group-sep-hr"><hr></div>
					<div class="ribbon-group" data-intro="The loss specifies how the quality of the model should be evaluated while training. The metric is just for you, so you have a basic idea of how good the trained model is.">
						<div class="ribbon-toolbar" style="width: 220px">
							<table>
								<tr>
									<td>Loss<sup onclick="losses_popup()">?</sup>:</td>
									<td style="width: 140px">
										<select id="loss" onchange="updated_page()" style="width: 100%">
											<option value="meanSquaredError">MeanSquaredError</option>
											<option value="binaryCrossentropy">BinaryCrossentropy</option>
											<option value="categoricalCrossentropy">CategoricalCrossentropy</option>
											<option value="categoricalHinge">CategoricalHinge</option>
											<option value="hinge">Hinge</option>
											<option value="meanAbsoluteError">MeanAbsoluteError</option>
											<option value="meanAbsolutePercentageError">MeanAbsolutePercentageError</option>
											<option value="meanSquaredLogarithmicError">MeanSquaredLogarithmicError</option>
											<option value="poisson">Poisson</option>
											<option value="sparseCategoricalCrossentropy">SparseCategoricalCrossentropy</option>
											<option value="squaredHinge">SquaredHinge</option>
											<option value="kullbackLeiblerDivergence">kullbackLeiblerDivergence</option>
											<option value="logcosh">logcosh</option>
										</select>
									</td>
								</tr>
								<tr>
									<td>Metric:</td>
									<td style="width: 140px">
										<select id="metric" onchange="change_metrics()" style="width: 100%">
											<option value="binaryAccuracy">binaryAccuracy</option>
											<option value="categoricalAccuracy">categoricalAccuracy</option>
											<option value="precision">precision</option>
											<option value="categoricalCrossentropy">categoricalCrossentropy</option>
											<option value="sparseCategoricalCrossentropy">sparseCategoricalCrossentropy</option>
											<option value="mse">MeanSquaredError</option>
											<option value="mae">MeanAbsoluteError</option>
											<option value="mape">MeanAbsolutePercentageError</option>
											<option value="cosine">Cosine</option>
										</select>
									</td>
								</tr>
								<tr>
									<td style="white-space: nowrap;"><i>X</i>&amp;<i>Y</i>-Source:</td>
									<td>
										<select id="data_origin" onchange="change_data_origin(1)" style="width: 140px">
											<option value="default">Default</option>
											<option value="own">Own</option>
										</select>
									</td>
								</tr>
								<div id="custom_training_data_settings">
									<tr id="data_type_row" style="display: none">
										<td>Data Type:</td>
										<td>
											<select id="data_type" style="width: 140px" onchange="change_data_origin(1)">
												<option class="input_shape_is_image" value="image">&#128444; Image</option>
												<option value="tensordata">&#x2318; Tensor-Data</option>
												<option value="csv">&#128290; CSV</option>
											</select>
										</td>
									</tr>
								</div>
							</table>
						</div>
						<div class="ribbon-group-title">Loss/Metric/Data</div>
					</div>

					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group-sep-hr"><hr></div>
					<div class="ribbon-group" style="display:none">
						<div class="ribbon-toolbar" style="width:100px">
							<input type="number" id="numberoflayers" value="2" min="1" step="1" style="width: 85%" />
						</div>
						<div class="ribbon-group-title">Layers</div>
					</div>



					<div class="ribbon-group" data-intro="You can set basic hyperparameters here">
						<div class="ribbon-toolbar" style="width: 180px">
							<table>
								<tr><td>Epochs:</td><td><input type="number" id="epochs" value="2" min="1" step="1" style="width: 80px;" /></td></tr>
								<tr><td>Batch-Size:</td><td><input type="number" id="batchSize" value="10" min="1" step="1" style="width: 80px;" /></td></tr>
								<tr><td>Val.-Split %:</td><td><input type="number" min="0" max="100" step="5" value="20" style="width: 80px;" id="validationSplit" /></td></tr>
								<tr class="expert_mode_only">
									<td colspan=2>
										Auto-Input-Shape?
										<input type="checkbox" value=1 <?php print array_key_exists("no_auto_input_shape", $_GET) ? "" : "checked"; ?> onchange="allow_edit_inputShape()" id="auto_input_shape" />
									</td>
								</tr>

							</table>
							<div class="ribbon-group-title">Hyperparameters, Data</div>
						</div>
					</div>
					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group-sep-hr"><hr></div>


					<div id="image_resize_dimensions" class="hide_when_no_image">
						<div class="ribbon-group" data-intro="Special settings for image-networks. Allows resizing and limiting the number of images per category.">
							<div class="ribbon-toolbar" style="width:170px">
								<table>
									<tr>
										<td>Width:</td>
										<td><input type="number" min="1" value="" onchange="change_width()" onkeyup="change_width()" id="width" style="width: 50px;" /></td>
									</tr>
									<tr>
										<td>Height:</td>
										<td><input type="number" min="1" value="" onchange="change_height()" onkeyup="change_height()" id="height" style="width: 50px;" /></td>
									</tr>
									<tr id="max_number_of_files_per_category_tr" style="display: none">
										<td>Img/cat:</td>
										<td><input type="number" min="0" value="100" id="max_number_of_files_per_category" style="width: 50px" /></td>
									</tr>
									<tr>
										<td>Auto-Augment?</td>
										<td><input type="checkbox" id="auto_augment" /></td>
									</tr>
								</table>
							</div>
							<div class="ribbon-group-title">Image Options</div>
						</div>
						<div class="ribbon-group-sep"></div>
						<div class="ribbon-group-sep-hr"><hr></div>
					</div>

					<div class="ribbon-group" data-intro="Basic training settings are here. You can also start training here.">
						<div class="ribbon-toolbar">
							<button class="train_neural_network_button" data-intro="Starts training. Shortcut: CTRL ," style="min-width: 150px;" onclick="train_neural_network()">Start training</button>
							<div class="small_vskip"></div>
							<span class="symbol_button">&#x1F4C9;</span> Auto-jump to training tab? <input class="show_data" type="checkbox" value="1" id="jump_to_training_tab" checked /><br>
							<div class="small_vskip"></div>
							<span class="symbol_button">&#127937;</span> Auto-jump to predict tab? <input class="show_data" type="checkbox" value="1" id="jump_to_predict_tab" checked /><br>
							<div class="small_vskip"></div>
							Divide <i>X</i>-Tensor by: <input style="width: 50px;" value="1" type="number" id="divide_by" onchange="updated_page()" />
						</div>
						<div class="ribbon-group-title">Training</div>
					</div>
				</div>

				<div id="tf_ribbon" class="ribbon_tab_content" title="Settings">
					<div class="ribbon-group">
						<div class="ribbon-toolbar">
							<fieldset style="border-width: 0px" id="backend_chooser" data-intro="CPU is faster for small datasets while WebGL is faster for larger datasets if you have a GPU"> 
								<input type="radio" onchange="set_backend()" name="backend_chooser" value="cpu" id="cpu_backend">
								<label for="svg_renderer">CPU</label>

								<input type="radio" onchange="set_backend()" name="backend_chooser" value="webgl" id="webgl_backend" checked>
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
								<label for="beginner">&#129466; Beginner</label>

								<input type="radio" onchange="set_mode()" name="mode_chooser" value="expert" id="expert"<?php
									$checked = 0;
									if(array_key_exists("mode", $_COOKIE) && $_COOKIE["mode"] == "expert") {
										$checked = 1;
									}
									if($checked) { print "checked"; }
?>>
								<label for="expert">&#9760;&#65039; Expert</label>
							</fieldset>
							Theme: <select id="theme_choser" class="show_data" onchange="theme_choser()">
								<option value="lightmode">Light Mode</option>
								<option value="darkmode">Dark Mode</option>
								<option value="natural">Natural</option>
							</select>
						</div>
						<div class="ribbon-group-title">TF-Backend/GUI-Mode/Style</div>
					</div>

					<div class="only_when_multiple_webcams">
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
					<div class="ribbon-group" data-intro="Here you can set specific options that are then applied to all layers.">
						<div class="ribbon-toolbar">
							<table>
								<tr>
									<td>Kernel initializer</td>
									<td>
										<select id="set_all_kernel_initializers" onchange="set_all_kernel_initializers()" style="width: 150px">
											<option value="none">&mdash;</option>
										</select>
									</td>
								</tr>
								<tr>
									<td>Bias initializer</td>
									<td>
										<select id="set_all_bias_initializers" onchange="set_all_bias_initializers()" style="width: 150px">
											<option value="none">&mdash;</option>
										</select>
									</td>
								</tr>
								<tr>
									<td>Activation functions</td>
									<td>
										<select id="set_all_activation_functions" onchange="set_all_activation_functions()" style="width: 150px">
											<option value="none">&mdash;</option>
										</select>
									</td>
								</tr>
							</table>
						</div>
						<div class="ribbon-group-title">Set options for all</div>
					</div>

					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group-sep-hr"><hr></div>
					<div class="ribbon-group" data-intro="Set options regarding the weights here.">
						<div class="ribbon-toolbar">
							<table>
                                                                <tr>
								       <td>Keep weights when possible?</td>
								       <td><input type="checkbox" value=1 checked id="keep_weights" /></td>
								</tr>

								<tr>
									<td>Reinit weights on data source change</td>
									<td>
										<input type="checkbox" value="1" checked id="reinit_weights_on_data_source_change" />
									</td>
								</tr>
								<tr>
									<td colspan=2><button onclick="force_reinit()">Reinitialize network's weight</button></td>
								</tr>
							</table>
						</div>
						<div class="ribbon-group-title">Weights</div>
					</div>

					<!--
					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group-sep-hr"><hr></div>
					<div class="ribbon-group" data-intro="Options regarding Early Stopping.">
						<div class="ribbon-toolbar">
							<table>
								<tr>
									<td>Enable Early Stopping?</td>
									<td>
										<input type="checkbox" value=1 id="enable_early_stopping" />
									</td>
								</tr>
								<tr>
									<td>What to monitor?</td>
									<td>
										<select id="what_to_monitor_early_stopping">
											<option value="val_loss">val_loss</option>
											<option value="val_acc">val_acc</option>
										</select>
									</td>
								</tr>
								<tr>
									<td>minDelta</td>
									<td>
										<input style="width: 60px" type="number" value=0.1 min=0 id="min_delta_early_stopping" />
									</td>
								</tr>
								<tr>
									<td>Patience?</td>
									<td>
										<input style="width: 60px" type="number" value=1 min=0 step=1 id="patience_early_stopping" />
									</td>
								</tr>
							</table>
						</div>
						<div class="ribbon-group-title">Early Stopping</div>
					</div>
					-->

					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group-sep-hr"><hr></div>
					<div class="ribbon-group" data-intro="The optimizer tries to minimize the loss. Here you can set the optimizer's settings.">
						<div class="ribbon-toolbar">
							<table style="width: 80%">
								<tr>
									<td>Optimizer:</td>
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
							<hr>

							<div id="optimizer_table">
								<div class="container optimizer_metadata" style="display: none;" id="sgd_metadata">
									<table style="width: 80%">
										<tr>
											<td>Learning rate:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0.000001" max="1" step="0.000001" value="0.01" id="learningRate_sgd" /></td>
										</tr>
									</table>
								</div>

								<div class="container optimizer_metadata" style="display: none;" id="adagrad_metadata">
									<table style="width: 80%">
										<tr>
											<td>Learning rate:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0.000001" max="1" step="0.000001" value="0.01" id="learningRate_adagrad" /></td>

											<td>Initial accumulator value:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0.000001" max="1" step="0.000001" value="0.1" id="initialAccumulatorValue_adagrad" /></td>
										</tr>
									</table>
								</div>

								<div class="container optimizer_metadata" style="display: none;" id="adam_metadata">
									<table style="width: 80%">
										<tr>
											<td>Learning rate:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0.000001" max="1" step="0.000001" value="0.001" id="learningRate_adam" /></td>

											<td>&beta;<sub>1</sub>:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0.9" id="beta1_adam" /></td>
										</tr>

										<tr>
											<td>&beta;<sub>2</sub>:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0.999" id="beta2_adam" /></td>

											<td>&epsilon;:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0.0001" id="epsilon_adam" /></td>
										</tr>
									</table>
								</div>

								<div class="container optimizer_metadata" style="display: none;" id="adadelta_metadata">
									<table style="width: 80%">
										<tr>
											<td>Learning rate:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0.00000000000001" max="1" step="0.000001" value="0.001" id="learningRate_adadelta" /></td>

											<td>&rho;:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0.95" id="rho_adadelta" /></td>
										</tr>

										<tr>

											<td>&epsilon;:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0.0001" id="epsilon_adadelta" /></td>
										</tr>
									</table>
								</div>

								<div class="container optimizer_metadata" style="display: none;" id="adamax_metadata">
									<table style="width: 80%">
										<tr>
											<td>Learning rate:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0.00000000000001" max="1" step="0.000001" value="0.002" id="learningRate_adamax" /></td>

											<td>&beta;<sub>1</sub>:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0.9" id="beta1_adamax" /></td>

											<td>&epsilon;:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0.0001" id="epsilon_adamax" /></td>



										</tr>
										<tr>

											<td>&beta;<sub>2</sub>:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0.999" id="beta2_adamax" /></td>

											<td>Decay:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0" id="decay_adamax" /></td>
																				</tr>
											<td></td>
											<td></td>
										</tr>
									</table>
								</div>

								<div class="container optimizer_metadata" style="display: none;" id="rmsprop_metadata">
									<table style="width: 80%">
										<tr>
											<td>Learning rate:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0" max="1" step="0.00000000001" value="0.01" id="learningRate_rmsprop" /></td>

											<td>Decay:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0" max="1" step="0.000001" value="0.9" id="decay_rmsprop" /></td>
										</tr>
										<tr>
											<td>Momentum:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0" max="1" step="0.01" value="0" id="momentum_rmsprop" /></td>

											<td>&epsilon;:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0.0001" id="epsilon_rmsprop" /></td>
										</tr>
									</table>
								</div>

								<div class="container optimizer_metadata" style="display: none;" id="momentum_metadata">
									<table style="width: 80%">
										<tr>
											<td>Learning rate:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0.000001" max="1" step="0.000001" value="0.01" id="learningRate_momentum" /></td>

											<td>Momentum:</td>
											<td><input class="optimizer_metadata_input" type="number" min="0" max="1" step="0.01" value="0.9" id="momentum_momentum" /></td>
										</tr>
									</table>
								</div>
							</div>
						</div>
						<div class="ribbon-group-title">Optimizer</div>
					</div>

				</div>

				<div id="visualization_ribbon" class="ribbon_tab_content" title="Visualization">
					<div class="ribbon-group" style="width: auto;">
						<div class="ribbon-toolbar">
							<table>
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
								<tr data-intro="Show the input layers">
									<td>Input&nbsp;Layer?</td>
									<td><input class="show_data" type='checkbox' value="1" onclick="toggle_show_input_layer()" id="show_input_layer" checked /></td>
								</tr>

							</table>
						</div>
						<div class="ribbon-group-title">Visualizations</div>
					</div>

					<div class="hide_when_no_conv_visualizations">
						<div class="ribbon-group-sep"></div>
						<div class="ribbon-group-sep-hr"><hr></div>
						<div class="ribbon-group">
							<div class="ribbon-group">
								<div class="ribbon-toolbar" style="width: auto; max-width: 500px;">
									<table>
										<tr data-intro="Number of iterations to create the maximally-activated-neuron-patterns">
											<td>Iterations:</td>
											<td><input type="number" min="1" value="100" id="max_activation_iterations" style="width: 80px;" /></td>
										</tr>
										<tr>
											<td>Randomizer limits:</td>
											<td><input type="number" min="0" max="1000" step="0.00001" value="0.001" id="randomizer_limits" style="width: 80px;" checked /></td>
										</tr>
										<tr>
											<td>Image-Size (w&amp;h, 0 = auto):</td>
											<td><input type="number" min="0" max="1000" step="1" value="0" id="max_activated_neuron_image_size" style="width: 80px;" /></td>
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
						<div class="ribbon-toolbar" style="width:190px">
							<table data-intro="Show the input and output (and kernel) images when possible. See 'Visualizations' -> 'Layer Visualizations' after training or predicting.">
								<tr class="hide_when_no_image">
									<td>Show layer data flow:</td>
									<td><input type="checkbox" value="1" onclick="enable_disable_kernel_images();add_layer_debuggers()" id="show_layer_data" /></td>
								</tr>
								<!--
								<tr class="hide_when_no_conv_visualizations">
									<td>Show kernel images:</td>
									<td><input type="checkbox" value="1" onclick="add_layer_debuggers();" id="show_kernel_images" /></td>
								</tr>
								-->
								<tr>
									<td>Enable TF-Debug:</td>
									<td><input type="checkbox" value="1" onchange="tf_debug();" id="enable_tf_debug" /></td>
								</tr>
								<tr>
									<td>Memory Debugger:</td>
									<td><input type="checkbox" value="1" onclick="toggle_memory_debug();" class="show_data" id="memory_debugger" /></td>
								</tr>
							</table>
						</div>
						<div class="ribbon-group-title">Debug</div>
					</div>

					<div id="data_plotter" style="display: none">
						<div class="ribbon-group-sep"></div>
						<div class="ribbon-group-sep-hr"><hr></div>
						<div class="ribbon-group">
							<div class="ribbon-group">
								<div class="ribbon-toolbar" style="width: auto; max-width: 300px;">
									<table>
										<tr>
											<td>Pixel size:</td>
											<td><input type="number" min="1" max="100" value="2" onchange="change_pixel_size()" onkeyup="change_pixel_size()" id="pixel_size" style="width: 80px;" /></td>
										</tr>
										<tr>
											<td>Kernel Pixel size:</td>
											<td><input type="number" min="1" max="100" value="10" onchange="change_kernel_pixel_size()" onkeyup="change_kernel_pixel_size()" id="kernel_pixel_size" style="width: 80px;" /></td>
										</tr>

										<tr>
											<td>Max. nr. of images (0 = no limit):</td>
											<td><input type="number" min="0" value="0" onchange="change_number_of_images()" onkeyup="change_number_of_images()" id="max_images_per_layer" style="width: 80px"/></td>
										</tr>
									</table>
								</div>
							</div>
							<div class="ribbon-group-title">Data plotter</div>
						</div>
					</div>
				</div>

				<div id="log_ribbon" class="ribbon_tab_content" title="Log">
					<div class="ribbon-group" style="width: auto;">
						<div class="ribbon-toolbar">
							<textarea style="width: 1400px; height: 90px; font-size: 14px" readonly id="log"></textarea>
						</div>
						<button onclick="copy_to_clipboard($('#log').val());">Copy to clipboard</button>
						<div class="ribbon-group-title">Log</div>
					</div>

				</div>


				<div id="imprint_ribbon" class="ribbon_tab_content" title="Imprint&Contact">
					<div class="ribbon-group" style="width: auto;">
						<div class="ribbon-toolbar">
							<a href='https://scads.ai/imprint' target='_blank'><input type="button" value="Imprint" style="width: 200px" /></a><br><br>
							<button style="width: 200px" onclick="location.href='mailto:norman.koch@tu-dresden.de'">norman.koch@tu-dresden.de</button><br><br>
							<button style="width: 200px" onclick="sources_popup()">Sources and used programs</button>
						</div>
						<div class="ribbon-group-title">Imprint</div>
					</div>

				</div>
			</div>

			<div id="maindiv">
				<div id="wizard" style="height: 250px; display: none">
					<div class="content">
						<div class="content__inner">
							<div class="container overflow-hidden">
								<div class="multisteps-form">
									<div class="row">
										<div class="col-12 col-lg-8 ml-auto mr-auto mb-4">
											<div class="multisteps-form__progress">
												<button class="multisteps-form__progress-btn js-active" type="button" title="Network">Network</button>
												<button class="multisteps-form__progress-btn" type="button" title="Comments">Hyperparameters</button>
												<button class="multisteps-form__progress-btn" type="button" title="Comments">Train</button>
											</div>
										</div>
									</div>
									<div class="row">
										<div class="col-12 col-lg-8 m-auto">
											<div class="multisteps-form__form">
												<div class="multisteps-form__panel shadow p-4 rounded bg-white js-active" data-animation="scaleIn">
													<h3 class="multisteps-form__title">Network Type</h3>
													<div class="multisteps-form__content">
														<table>
															<tr>
																<td>Problem type:</td><td><select class="copy_options" data-from_and_to="dataset_category" id="dataset_category_wizard"></select></td>
															</tr>
															<tr>
																<td>Architecture:</td><td><select class="copy_options" data-from_and_to="dataset" id="dataset_wizard"></select></td>
															</tr>
															<tr>
																<td>Dataset:</td><td><select class="copy_options" data-from_and_to="model_dataset" id="model_dataset_wizard"></select></td>
															</tr>
															<tr>
																<td>Data-Source:</td><td><select class="copy_options" data-from_and_to="data_origin" id="data_origin_wizard"></select></td>
															</tr>
															<!--
															<tr>
																<td>Data-Type:</td><td><select class="copy_options" data-from_and_to="data_type" id="data_type_wizard"></select></td>
															</tr>
															-->
														</table>

														<div id="wizard_lr">
															<div>&nbsp;</div>
															<div></div>
															<div><button class="btn-primary ml-auto js-btn-next" type="button" title="Next">Next</button></div>
														</div>

													</div>
												</div>

												<div class="multisteps-form__panel shadow p-4 rounded bg-white" data-animation="scaleIn">
													<h3 class="multisteps-form__title">Hyperparameters</h3>
													<div class="multisteps-form__content">
														<table>
															<tr>
																<td>Epochs:</td><td><input type="number" class="copy_values" data-from_and_to="epochs" id="epochs_wizard"></input></td>
															</tr>
															<tr>
																<td>Batch-Size:</td><td><input type="number" class="copy_values" data-from_and_to="batchSize" id="batchSize_wizard"></input></td>
															</tr>
															<tr>
																<td>Validation-Split (in %):</td><td><input type="number" class="copy_values" data-from_and_to="validationSplit" id="validationSplit_wizard"></input></td>
															</tr>
														</table>

														<div id="wizard_lr">
															<div><button class="btn-primary js-btn-prev" type="button" title="Prev">Previous</button></div>
															<div></div>
															<div><button class="btn-primary ml-auto js-btn-next" type="button" title="Next">Next</button></div>
														</div>
													</div>
												</div>

												<div class="multisteps-form__panel shadow p-4 rounded bg-white" data-animation="scaleIn">
													<h3 class="multisteps-form__title">Train</h3>
													<div class="multisteps-form__content">
														<button class="train_neural_network_button" data-intro="Starts training. Shortcut: CTRL ," style="min-width: 150px; width: 100%" onclick="train_neural_network()">Start training</button>

														<div id="wizard_lr">
															<div><button class="btn-primary js-btn-prev" type="button" title="Prev">Previous</button></div>
															<div></div>
															<div>&nbsp;</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div id="losses_popup" style="display: none">
					<div class="popup_body less_transparent_glass_box">
						<div id="table_div"></div>

						<div class="loss_explanation" id="explanation"></div>
						<button onclick="close_losses()">Close</button>
					</div>
				</div>

				<div id="sources_popup" class="popup" style="display: none;">
					<div class="popup_body less_transparent_glass_box">
						<div> 
<?php
							$file = file_get_contents("README.md");
							print(parse_markdown_links(get_string_between($file, "[comment]: <> (BeginSources)", "[comment]: <> (EndSources)")));
?>
							<button class="close_button" onclick="closePopup('sources_popup')">Close</button>
						</div>
					</div>
				</div>


				<div id="save_dialog" class="popup" style="display: none;">
					<div class="popup_body less_transparent_glass_box">
						<div> 
							<table>
								<tr>
									<td>Upload Model (<tt>.json</tt>):</td>
									<td><input accept="application/json" type="file" id="upload_model" value="Upload Model"></td>
								</tr>
								<tr>
									<td>Upload Model weights from TFD trained model (<tt>.json</tt>):</td>
									<td><input accept="application/octet-stream" type="file" id="upload_tfjs_weights" value="Upload Weights"></td>
								</tr>
								<tr class="expert_mode_only">
									<td colspan=2>
										<p>Use this command to convert TensorFlow to TFJS-models:</p>
										<p><tt>tensorflowjs_converter --input_format=keras_saved_model --output_format=tfjs_layers_model model jsmodel</tt></p>

										<p>Notice: You need to upload JSON <i>and</i> BIN-files from the trained models to have specified weights. Only one is not sufficient!</p>
									</td>
								</tr>
								<tr class="expert_mode_only">
									<td>Upload Model weights from Keras (<tt>.bin</tt>):</td>
									<td><input accept="application/octet-stream" type="file" id="upload_weights" value="Upload Weights"></td>
								</tr>
							</table>

								<button class="close_button" onclick="closePopup('save_dialog')">Close</button>
							</div>
						</div>
					</div>

					<div id="register_dialog" class="popup" style="display: none">
						<div class="popup_body less_transparent_glass_box">
							<div id="register_content"> 
								<h1>Register</h1>

								<table>
									<form id="register_form">
									<tr>
										<td>E-Mail</td>
										<td><input type="email" id="register_email" required></td>
									</tr>
									<tr>
										<td>Username</td>
										<td><input id="register_username" minlength="2" required></td>
									</tr>
									<tr>
									<td>Password</td>
									<td><input type="password" id="register_password" minlength="8" required></td>
								</tr>
								</form>
								<tr>
									<td colspan=2>Do you agree with our terms of <a target="_blank" href="license.php">license</a>? <input id="license" type="checkbox" onclick="show_register_button(this)"></td>
								</tr>
								<tr>
									<td><button id="register_button" onclick="register()" style="display: none">Register</button></td>
								</tr>
								<tr>
									<span style="display: none" id="register_error_msg"></span>
								</tr>
							</table>

							<h1>Login</h1>

							<table>
								<tr>
									<td>Username</td>
									<td><input id="login_username"></td>
								</tr>
								<tr>
									<td>Password</td>
									<td><input type="password" id="login_password"></td>
								</tr>
								<tr>
									<td><button class="save_button" onclick="login()">Login</button></td>
								</tr>
								<tr>
									<span style="display: none" id="login_error_msg" style="background-color: green"></span>
								</tr>
							</table>
						</div><br/>
						<button class="close_button" onclick="closePopup('register_dialog')">Close</button>
					</div>
				</div>

				<div id="save_model_dialog" class="popup" style="display: none">
					<div class="popup_body less_transparent_glass_box">
						<div id="save_model_content"> 
							<h1>Download</h1>
							<button class="save_button" onclick="save_model();download_weights_json();">Download</button>

							<div style="display: none" class="show_when_logged_in">
								<h1>Save to DB</h1>
								<span id="save_model_msg" style="display: none"></span><br/>
								<input id="network_name" onkeyup="has_network_name(this)" placeholder="Network name" /><br/>
								Public: <input id="is_public" type="checkbox"><br/>
								<button class="save_button" id="save_to_db" onclick="save_to_db_wrapper()" disabled>Save</button>
							</div>
						</div>
						<br/>
						<button class="close_button" onclick="closePopup('save_model_dialog')">Close</button>
					</div>
				</div>

				<div class="container" id="errorcontainer" style="display: none">
					<div class="left"></div>
					<div id="error"></div>
				</div>


				<div id="help" style="display: none"></div>
				<div id="toggle_layers_button"><button style="width: 100%" onclick="toggle_layers()">Show layers</button></div>

				<div class="side_by_side_container">
					<div id="layers_container_left" class="left_side">
						<ul id="layers_container" class="ui-sortable"><li></li></ul>
					</div>
					<div class="right_side" id="graphs_here">
						<div id="right_side" class="glass_box" style="float: right; width: 99%; overflow-y: hidden; padding: 2px;">
							<div style="display: flex">
								<ul>
									<li><a href="#visualization_tab" id="visualization_tab_label" data-intro="Show different kind of visualizations to help you design the network you want.">Visualizations</a></li>
									<li><a id="code_tab_label" href="#code_tab" data-intro="Shows Python/NodeJS/TensorFlow.js-HTML-Code of the currently configured neural network.">Code</a></li>
									<li><a href="#summary_tab" data-intro="Shows the model.summary of the currently configured model">Summary</a></li>
									<li><a id="training_data_tab_label" href="#training_data_tab">Data</a></li>
									<li><a id="own_image_data_label" href="#own_image_data">Own images</a></li>
									<li><a id="own_tensor_data_label" href="#own_tensor_data">Own tensors</a></li>
									<li><a id="own_csv_data_label" href="#own_csv_data">Own CSV</a></li>
									<li><a id="tfvis_tab_label" href="#tfvis_tab" data-intro="Shows the training data (if possible) and the training progress.">Training</a></li>
									<li id="predict_tab_label"><a href="#predict_tab" data-intro="Allows you to predict data from the trained model.">Predict</a></li>
								</ul>
								<span id="toggle_layer_view_button" style="user-select: none; position: relative; top: 6px" onclick="toggle_layer_view()">&#128470;</span>
							</div>
							<hr>

							<div id="own_csv_data">
								<br>
								Shuffle data before training? <input type="checkbox" value="1" checked class="shuffle_data_before_training" />
								<br>
								<table border=1>
									<tr>
										<td>
											
											<table>
												<tr>
													<td>Auto-adjust last layer's number of neurons?</td>
													<td><input type="checkbox" value="1" onchange="show_csv_file(1)" id="csv_auto_adjust_number_of_neurons" checked /></td>
												<tr>
												</tr>
													<td>Auto-set last layer's activation to linear when any Y-values are smaller than 0 or greater than 1?</td>
													<td><input type="checkbox" value="1" onchange="show_csv_file(1)" id="auto_set_last_layer_activation" checked /></td>
												</tr>
												<tr>
													<td>Separator:</td>
													<td><input onkeyup="show_csv_file()" type="text" value="," style="width: 30px" id="seperator" /></td>
												</tr>
											</table>

											<br>
											<br>

											<textarea id="csv_file" style="width: 98%; height: 300px" onkeyup="show_csv_file()"></textarea>
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

							<div id="own_tensor_data">

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
									<button onclick="copy_id_to_clipboard('convert_data_python')">Copy to clipboard</button>
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
								Max number of values (0 = no limit): <input type="number" min="1" value="0" id="max_number_values" style="width: 50px;" />
							</div>

							<div id="own_image_data">
								<br>
								Auto-adjust last layer's number of neurons (if Dense)? <input type="checkbox" value="1" id="auto_adjust_number_of_neurons" checked />
								<br>
								Shuffle data before training? <input type="checkbox" value="1" class="shuffle_data_before_training" />
								<br>
								<button class="only_when_webcam" id="webcam_start_stop" onclick="get_data_from_webcam()">Enable webcam</button>
								<button style="display: none" class="only_when_front_and_back_camera" onclick="switch_to_next_camera()"><img src="rotate_camera.svg" width=32 height=32 />Switch to other cam</button>
								<div id="webcam_data" style="display: none"></div>
								<br>
								<div id="last_layer_shape_warning"></div>
								<button onclick="add_new_category();">Add new category</button>
								<div id="own_image_data_categories"></div>
								<div class="container" id="own_images_container"></div>
							</div>

							<div id="training_data_tab">
								<div id="percentage" class="reset_before_train_network"></div>
								<div id="photos" style="display: none; height: 400px; max-height: 400px; overflow-y: auto" class="reset_before_train_network"><br>Click 'Start training' to start downloading the training data and then train on them.</div>
								<button id="stop_downloading" onclick="stop_downloading_data=true" style="display: none">Stop downloading and start training</button>
								<div id="xy_display_data" style="display: none; height: 400px; max-height: 400px; overflow-y: auto" class="reset_before_train_network"><br>Click 'Start training' to start downloading the training data and then train on them.</div>
								<div class="" id="download_data" style="display: none"></div>
							</div>

							<div id="code_tab">
								<ul>
									<li><a href="#python_tab" id="python_tab_label">Python</a></li>
									<li><a href="#html_tab" id="html_tab_label">HTML</a></li>
									<li><a href="#node_tab" id="node_tab_label">NodeJS</a></li>
								</ul>

								<div id="node_tab">
									<pre><code class="language-javascript" id="node" style="width: 99%"></code></pre>
									<button onclick="copy_id_to_clipboard('node')">Copy to clipboard</button>
								</div>

								<div id="html_tab">
									<br>
									<button onclick="save_model()">Download model data</button>
									<br>
									<pre><code class="language-html" id="html" style="width: 99%"></code></pre>
									<button onclick="copy_id_to_clipboard('html')">Copy to clipboard</button>
								</div>


								<div id="python_tab">
									<br>
									<button onclick="save_model()">Download model data</button>
									<br>
									<pre><code class="language-python" id="python" style="width: 99%"></code></pre>
									<button onclick="copy_id_to_clipboard('python')">Copy to clipboard</button>
								</div>
							</div>

							<div id="visualization_tab">
								<ul>
									<li><a id="fcnn_tab_label" href="#fcnn_tab">FCNN</a></li>
									<li><a href="#lenet_tab" id="lenet_tab_label" style="display: none">LeNet</a></li>
									<li><a href="#alexnet_tab" id="alexnet_tab_label">AlexNet</a></li>
									<li><a href="#math_tab" onclick="write_model_to_latex_to_page(0, 1);" id="math_tab_label">Math</a></li>
									<!--<li><a href="#conv_explanations" id="conv_explanations_label">Convolutional explanations</a></li>-->
									<li style="display: none"><a href="#maximally_activated" id="maximally_activated_label" style="display: none">Maximally activated filter/neuron</a></li>
									<li style="display: none"><a href="#layer_visualizations_tab" id="layer_visualizations_tab_label" style="display: none">Layer Visualizations</a></li>
									<li style="display: none"><a href="#activation_plot_tab" id="activation_plot_tab_label" style="display: none">Activation function</a></li>
									<li style="display: none"><a href="#help_tab" id="help_tab_label" style="display: none">Help</a></li>
								</ul>

								<div id="alexnet_tab">
									<div id="alexnet"></div>
									<!-- <button id="download_alexnet" onclick="download_visualization('alexnet')">Download AlexNet SVG (but without dimension labels)</button> -->
									<button onclick="restart_alexnet(1)">Restart AlexNet</button>
								</div>

								<div id="lenet_tab">
									<div id="lenet"></div>
									<button onclick='reset_view()'>Reset view</button>
									<button id="download_lenet" onclick="download_visualization('lenet')">Download LeNet SVG</button>
									<button onclick="restart_lenet(1)">Restart LeNet</button>
								</div>

								<div id="layer_visualizations_tab">
								</div>

								<div id="fcnn_tab">
									<div id="fcnn"></div>
									<button onclick='reset_view()'>Reset view</button>
									<button id="download_fcnn" onclick="download_visualization('fcnn')">Download FCNN SVG</button>
									<button onclick="restart_fcnn(1)">Restart FCNN</button>
								</div>

								<div id="activation_plot_tab">
									<span id="activation_plot_name" style="display: none"></span>
									<div id="activation_plot" style="display: none"></div>
								</div>

								<div id="maximally_activated" class="maximally_activated_class">
									<br>
									<button onclick="smaller_maximally_activated_neurons()">Smaller</button>
									<button onclick="larger_maximally_activated_neurons()">Larger</button>
									<button onclick="reset_maximally_activated_neurons()">Reset</button>
									<!--<button onclick="predict_all_maximally_activated_neurons()">Predict all visible images</button>-->
									<button onclick="delete_maximally_activated_predictions()">Delete predictions</button>
									<div id="maximally_activated_content"></div>
								</div>

								<div id="math_tab">
									<table data-intro="Options for the math mode.">
										<tr>
											<td>Number of decimal points (0 = no limit):</td>
											<td><input class="show_data" type="number" style="width: 50px" value="0" min="0" max="16" onchange="write_model_to_latex_to_page(1)" id="decimal_points_math_mode" /></td>
										</tr>
									</table>
									<div class="typeset_me" id="math_tab_code"></div>
								</div>

								<div id="help_tab">
								</div>
							</div>

							<div id="tfvis_tab" style="float: right; width: 100%">
								<ul>

									<li id="tfvis_tab_training_performance_label" class="training_performance_tabs" style="display:none" id="training_performance_tab_label"><a href="#tfvis_tab_training_performance">Training performance</a></li>
									<li style="display: none" class="show_after_training"><a href="#history_tab">History</a></li>
								</ul>


								<div id="tfvis_tab_training_performance">
									<h1>Epoches</h1>
									<div id="plotly_epoch_history"></div>
									<h1>Batches</h1>
									<div id="plotly_batch_history"></div>
									<div id="tfvis_tab_training_performance_graph"></div>
									<div id="tfvis_tab_history_graphs"></div>
								</div>
								<div id="history_tab">
									<div class="reset_before_train_network" id="history"></div>
									<div class="reset_before_train_network" id="memory"></div>
								</div>
							</div>

							<div id="summary_tab">
								<div class="reset_before_train_network" id="summary"></div>
							</div>

							<div id="predict_tab">
								Live update example predictions while training?
								<input class="show_data" type='checkbox' value="1" id="auto_update_predictions" />

								<div class="container" id="predictcontainer">
									<div>
										<div id="own_files">
											<h2>Own files</h2>

											<button class="only_when_webcam" id="show_webcam_button" onclick="show_webcam();">Show webcam</button><br>
											<button style="display: none" class="only_when_front_and_back_camera" onclick="switch_to_next_camera_predict()"><img src="rotate_camera.svg" width=32 height=32 />Switch to other cam</button>

											<div id="webcam" style="display: none">
											</div>

											<pre id="webcam_prediction" style="display: none; overflow: scroll;"></pre>
											<br>
											
											<div class="hide_when_image">
												<div id="predict_own">
													<textarea id="predict_own_data" style="width: 100%; height: 200px"></textarea>
													<br>
													<br>
													<button onclick="predict($('#predict_own_data').val())">Predict</button>
												</div>
											</div>

											<br>

											<div class="hide_when_no_image">
												<div id="upload_file" class="show_data"><input type="file" accept="image/*" onchange="loadFile(event)"></div>
												<img style="display:none" id="output"/>
											</div>

											<br>

											<div id="prediction" style="display: none"></div>
											<div id="predict_error" style="overflow: scroll; display: none"></div>

											<hr>
										</div>

										<div class="handdrawn hide_when_no_image">
											<form>
												<label>Thickness</label><br />
												<input
													class="show_data"
													type="range"
													min="1"
													oninput="atrament.weight = parseFloat(event.target.value);"
													value="2"
													step="0.1"
													autocomplete="off"
												/><br />
												<label>Mode</label>
												<select onchange="atrament.mode = event.target.value;" autocomplete="off">
													<option value="draw" default>Draw</option>
													<option value="fill" default>Fill</option>
													<option value="erase" default>Erase</option>
												</select><br />
												<div id="color_grid" style="display: block ruby">
<?php
														$colors = ["#FFFFFF", "#C0C0C0", "#808080", "#000000", "#FF0000", "#800000", "#FFFF00", "#808000", "#00FF00", "#008000", "#00FFFF", "#008080", "#0000FF", "#000080", "#FF00FF", "#800080"];
														foreach ($colors as $color) {
															print "<button type='button' onclick='atrament.color=\"$color\"' style='width: 30px; height: 30px; background-color: $color;'>&nbsp;</button>";
														}
?>
												</div>
												<button id="clear" onclick="event.preventDefault();atrament.clear();predict_handdrawn();">Clear</button>
											</form>
											<canvas style="z-index: 2; margin: 5px; position: relative; outline: solid 1px black; width: 200px; height: 200px" id="sketcher"></canvas>

											<div id="handdrawn_predictions"></div>

											<hr>
										</div>


										<div class="hide_when_custom_data">
											<button onclick="show_prediction(1);">Re-predict examples</button>
											<div class="medium_vskip"></div>
											<h2 class="show_when_predicting" style="display: none">Examples</h2>

											<div id="example_predictions">
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div id="demomode" class="glass_box" style="display: none"></div>

		<div id="status_bar">
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
		</div>

		<?php minify_js("main.js"); ?>
		<script>
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
					setCookie("mode", mode)
				}

				return mode;
			}


			function set_mode () {
				mode = get_mode();
				if(old_mode != mode) {
					setCookie("mode", mode)
				}
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
			}

			set_backend();
			
			var clicked_on_tab = 0;

			var currentLayer = 0;

			var seed = 1;
			function random(min, max) { // Seeded PRNG
				var x = Math.sin(seed++) * 10000;
				result = x - Math.floor(x);
				result = ((max - min) * result) + min;
				return result;
			}

			function get_units_at_layer(i) {
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
								units = Math.max(0, model.layers[i].countParams());
							}
						}
					}
				} catch (e) {
					log(e);
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
					logt("Forcing redo");
					graph_hashes["fcnn"] = "";
				}

				var architecture = [];
				var real_architecture = [];
				var betweenNodesInLayer = [];
				var layer_types = [];

				if(show_input_layer) {
					layer_types.push("Input layer");
					var input_layer = Object.values(remove_empty(model.layers[0].input.shape));
					architecture.push(input_layer[0]);
					real_architecture.push(input_layer[0]);
					betweenNodesInLayer.push(10);
				}

				for (var i = 0; i < get_numberoflayers(); i++) {
					var number_of_units = get_units_at_layer(i);
					var layer_type = $($(".layer_type")[i]).val();
					if(parseInt(number_of_units) > 0) {
						real_architecture.push(number_of_units);
						architecture.push(number_of_units);
						betweenNodesInLayer.push(10);
						layer_types.push(layer_type);
					}
				}

				var redraw_data = {
					'architecture_': architecture, 
					'real_architecture_': real_architecture, 
					'layerTypes_': layer_types
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

			var alexnet = AlexNet();
                        async function restart_alexnet(dont_click) {
				if(!hasWebGL()) {
					return;
				}

				if(force_cpu_backend) {
					return;
				}

				seed = 1;
				var architecture = [];
				var architecture2 = [];
				var colors = [];

				var disable_alexnet = 0;

				for (var i = 0; i < get_numberoflayers(); i++) {
					if(disable_alexnet) { continue; }
					var layer_type = $($(".layer_type")[i]).val();
					if(typeof(layer_type) === 'undefined') {
						return;
					}
					if(layer_type in layer_options && Object.keys(layer_options[layer_type]).includes("category")) {
						var category = layer_options[layer_type].category;

						if(category == "Convolutional") {
							var this_layer_arch = {};
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
								this_layer_arch["rel_x"] = random(-0.1, 0.1);
								this_layer_arch["rel_y"] = random(-0.1, 0.1);

								if(this_layer_arch["filterWidth"] && this_layer_arch["filterHeight"] && this_layer_arch["depth"]) {
									push = 1;
								}
							} catch (e) {
								console.warn("ERROR: ", e);
							}

							if(push) {
								architecture.push(this_layer_arch);
							}
						} else if (category == "Basic") {
							try {
								var units_at_layer = get_units_at_layer(i);
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
					hide_tab_label("alexnet_tab_label");
					if(!dont_click) {
						if(clicked_on_tab == 0) {
							show_tab_label("fcnn_tab_label", 1);
							clicked_on_tab = 1
						}
					}
				} else {
					show_tab_label("alexnet_tab_label");
					if(!dont_click) {
						if(clicked_on_tab == 0) {
							show_tab_label('alexnet_tab_label', 1);
							clicked_on_tab = 1;
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

				for (var i = 0; i < get_numberoflayers(); i++) {
					var layer_type = $($(".layer_type")[i]).val();
					if(typeof(layer_type) === 'undefined') {
						return;
					}

					if(layer_type in layer_options && Object.keys(layer_options[layer_type]).includes("category")) {
						var category = layer_options[layer_type]["category"];

						if((category == "Convolutional" || category == "Pooling") && layer_type.endsWith("2d") && layer_type.startsWith("conv")) {
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
						} else if (category == "Basic") {
							try {
								var units_at_layer = get_units_at_layer(i);
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
					hide_tab_label("lenet_tab_label");
					if(clicked_on_tab == 0) {
						if(!dont_click) {
							show_tab_label("fcnn_tab_label", 1);
							clicked_on_tab = 1;
						}
					}
				} else {
					show_tab_label("lenet_tab_label");
					if(clicked_on_tab == 0) {
						if(!dont_click) {
							show_tab_label("lenet_tab_label", 1);
							clicked_on_tab = 1;
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

			change_number_of_images();
			enable_disable_kernel_images();

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

				$(".own_image_files").each(function (x, y) { if (get_element_xpath(y) == get_element_xpath(currentTarget)) { nr = x } } )

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
						var html = '<span class="own_image_span"><img height="90" src="' + e.target.result + '" /><span onclick="delete_own_image(this)">&#10060;&nbsp;&nbsp;&nbsp;</span></span>';
						imgDiv.prepend(html);
						disable_start_training_button_custom_images();
					}
					reader.readAsDataURL(f);
				});

				disable_start_training_button_custom_images();
			}

			toggle_memory_debug();

			if(window.location.href.indexOf("run_tests") > -1) {
				run_tests();
			}

		</script>

		<?php minify_js("prism/prism.js"); ?>
		<?php minify_js("prism/prism-python.min.js"); ?>
		
		<script type="text/x-mathjax-config">
			MathJax.Hub.Config({
				tex2jax: {
					inlineMath: [['$','$']]
				},
				"showMathMenu": true
			});

			set_mode();
		</script>
		<script src="./wizard_script.js"></script>
		<?php minify_js("draw.js"); ?>
		<script>
			atrament.adaptiveStroke = true;

			var cookie_theme = getCookie("theme");
			if(cookie_theme) {
				$("#theme_choser").val(cookie_theme).trigger("change")
			}

			load_time = Date().toLocaleString();

			set_mode();
		</script>
	</body>
</html>
