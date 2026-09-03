<?php
	header("Cross-Origin-Opener-Policy: same-origin");
	header("Cross-Origin-Embedder-Policy: require-corp");

	include("functions.php");

	_include("translations.php");
	
	_include("php_files/log_users.php");
	
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
		<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
		<meta http-equiv="Pragma" content="no-cache">
		<meta http-equiv="Expires" content="0">
<?php
		_include("initializing.php");
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

		_css("libs/classic.min.css");
		_css("libs/jquery-ui.css");
		_css("css/style.css");
		_css("css/auto_animations.css");
		_css("css/ribbon.css");
		_css("css/code_tab.css");
		_css("css/auto_complete.css");

		_css("css/ribbon_media.css");
		_css("css/mobile.css");
		_css("css/".$theme_base."mode.css", "css_mode");
		_css("css/ribbon".$theme_base."mode.css", "css_ribbon");
		_css("libs/prism/prism.min.css");
		_css("libs/sweetalert2.min.css");

		_js("tf/tf.min.js");
		_js("base_wrappers.js");
		_js("libs/jstat.min.js");
		_js("debug_layer.js");
		_js("snake_activation_layer.js");
		_js("multi_activation.js");
		_js("libs/jsmanipulate.js", 1, 1);

		_js("libs/zip.js");
		_js("libs/xlsx.full.min.js");
		_js("libs/md5.umd.min.js");
		_js("libs/jquery.js");
		_js("libs/jquery-ui.js");

		_js("translations.js", 1, 1);
		_js("debug.js");
		_js("variables.js");
		_js("valsplitwatcher.js");

		_js("libs/canvas-to-blob.min.js");

		_js("libs/sweetalert2.all.js");

		_js("libs/fireworks.js", 1, 1);
		_js("libs/confetti.browser.min.js", 1, 1);

		foreach (glob("visualizer/*.js") as $full_path) {
			_js($full_path);
		}

		_js("safety.js");
		_js("tests.js");
		_js("model.js");
		_js("online_python.js");
		_js("neural_organism.js");
		_js("online_python_code_completion.js");
		_js("explain.js");
		_js("explain_losses.js");
		_js("math_editable.js");
		_js("math_mode.js");
		_js("feature_maps.js");
		_js("grad_cam.js");
		_js("data.js");
		_js("webcam.js");
		_js("config_loader.js");
		_js("layers_gui.js");
		_js("python_code.js");
		_js("csv.js");
		_js("data_origin.js");
		_js("theme.js");
		_js("popups.js");
		_js("overlay.js");
		_js("health_status.js");
		_js("health_status_popups.js");
		_js("weight_analysis.js");
		_js("tda.js");
		_js("dimensionality_river.js");
		_js("activation_atlas.js");
		_js("activation_atlas_tab.js");
		_js("gradient_flow_heatmap.js");
		_js("skip_connection.js");
		_js("optimizer.js");
		_js("loss_metric.js");
		_js("labels.js");
		_js("validation.js");
		_js("cookies_and_url.js");
		_js("initializers.js");
		_js("input_shape.js");
		_js("clipboard_and_download.js");
		_js("drawing.js");
		_js("updated_page.js");
		_js("trace_through_loss_landscape.js");
		_js("optimizer_info.js");
		_js("initializer_info.js");
		_js("explain_activations.js");
		_js("explain_constraints.js");
		_js("topological_analyzer.js");
		_js("gui.js");
		_js("summary.js");
		_js("custom_images.js");
		_js("segmentation.js");
		_js("faster_canvas_functions.js");
		_js("fcnn.js");
		_js("fcnn_editable.js");
		_js("easter_eggs.js");
		_js("train.js");
		_js("predict.js");
		_js("plot_predict.js");
		_js("my_temml.js");
		_js("weight_surfaces.js");

		_js("layer_descriptions.js");
		_js("loss_landscape.js");

		_js("libs/atrament.js", 1, 1);
		_js("main.js");

		_js("libs/plotly-latest.min.js");

		_js("libs/pyodide.js");

		_js("selftests.js", 1, 1);
?>
		<script>
			var start_loading_time = Date.now();

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
<?php
		if(isset($_SERVER["HTTP_HOST"]) && $_SERVER["HTTP_HOST"] != "localhost") {
?>
			<script>
				if (window.location.host == "localhost") {
					var _paq = window._paq = window._paq || [];
					/* tracker methods like "setCustomDimension" should be called before "trackPageView" */
					_paq.push(['trackPageView']);
					_paq.push(['enableLinkTracking']);
					(function() {
						var u="//asanai.scads.ai/matomo/";
						_paq.push(['setTrackerUrl', u+'matomo.php']);
						_paq.push(['setSiteId', '1']);
						var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
						g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
					})();

					var _mtm = window._mtm = window._mtm || [];
					_mtm.push({'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start'});
					(function() {
						var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
						g.async=true; g.src='https://asanai.scads.ai/matomo/js/container_3UHSZzXd.js'; s.parentNode.insertBefore(g,s);
					})();
				}
			</script>
<?php
		}
?>

		<link rel="stylesheet" href="./libs/temml/Temml-Local.css">
		<script src="./libs/temml/temml.min.js"></script>

		<link rel="apple-touch-icon" href="_gui/apple-touch-icon-180x180.png">
		<meta name="theme-color" content="#7299d2">
		<meta name="description" content="A tool for creating Neural Networks with TensorFlow.JS without writing a single line of code.">
		<link rel="shortcut icon" type="image/x-icon" href="favicon.ico">
	</head>
	<body id='body'>
		<span style="display: none">
			<input name="hacky_field" value="dieses leere feld ist dafür da, damit der erste wert immer als referenzwert für die check_number_values gilt, damit es einen default-wert gibt, von dem aus die farbe aus dem theme gewählt werden kann. ziemlich hacky..."></input>
		</span>
		<noscript>
			<span style="font-size: 50px; color: red">You must enable JavaScript for this site to work. Please add an exception to NoScript if you have it installed.</span>
		</noscript>
		<div class="fireworks-container"></div>
		<div id="mainsite" style="display: none">
			<div id="ribbon_shower" class="user_select_none">
				<span class="symbol_button" style="font-size: 70px" id="show_hide_ribbon_button" onclick="show_ribbon()">&#9776;</span>
				<span id="large_help_icon" class="symbol_button" onclick="open_help();"><img class="ribbon_icon_large" src="_gui/icons/help.svg" /></span>
				<span id="custom_webcam_training_data" style="display: none" class="only_when_webcam input_shape_is_image symbol_button" onclick="set_custom_webcam_training_data();$('#custom_webcam_training_data').attr('data-clicked', '1')"><img class="ribbon_icon_large" src="_gui/camera.svg" /></span>
				<span onclick='update_lang("de")'><img src="_gui/icons/german.svg" class="ribbon_icon_large" /></span>
				<span onclick='update_lang("en")'><img src="_gui/icons/english.svg" class="ribbon_icon_large" /></span>
				<span id="start_stop_training" class="symbol_button" onclick="train_neural_network();"><img class="ribbon_icon_large" src="_gui/icons/train.svg" /></span>
			</div>
<?php
			_include("php_files/ribbon.php");
?>

			<div id="maindiv">
<?php
				_include("php_files/losses_popup.php");
				_include("php_files/sources_popup.php");
				_include("php_files/upload_model_dialog.php");
				_include("php_files/save_model_dialog.php");
				_include("php_files/errorcontainer.php");
?>
				<div id="help" style="display: none"></div>
			<div id="toggle_layers_button"><button style="width: 100%" onclick="toggle_layers()"><span id="robot_layer" class="robot_large_button">&#9881;&#129302;</span></button></div>

			<!-- Mobile language switcher -->
			<div id="mobile_lang_switcher" style="display:none">
				<span onclick='update_lang("de")'><img src="_gui/icons/german.svg" height=28 /></span>
				<span onclick='update_lang("en")'><img src="_gui/icons/english.svg" height=28 /></span>
			</div>

			<div class="side_by_side_container">
					<div id="layers_container_left" class="left_side user_select_none">
						<ul id="layers_container" class="ui-sortable"><li></li></ul>
					</div>
					<div class="right_side" id="graphs_here">
						<div id="right_side" class="glass_box" style="float: right; width: 99%; overflow-y: hidden; padding: 2px;">
<?php
							_include("navbar.php");
							_include("tabs/own_csv.php");
							_include("tabs/own_tensor.php");
							_include("tabs/own_images.php");
							_include("tabs/data.php");
							_include("tabs/code.php");
							_include("tabs/visualizations.php");
							_include("tabs/training.php");
							_include("tabs/summary.php");
							_include("tabs/predict.php");
?>
						</div>
					</div>
				</div>
			</div>
		</div>
		<!-- Mobile bottom navigation bar — inline display:none ensures it never flashes during load -->
		<div id="mobile_bottom_nav" style="display:none">
			<button class="mobile-nav-item" id="mobile_nav_dataset" onclick="mobile_open_panel('dataset')">
				<span class="mobile-nav-icon">&#128218;</span>
				<span class="mobile-nav-label" data-tr-text="dataset_mobile_label">Dataset</span>
			</button>
			<button class="mobile-nav-item" id="mobile_nav_layers" onclick="mobile_toggle_drawer()">
				<span class="mobile-nav-icon">&#129302;</span>
				<span class="mobile-nav-label" data-tr-text="layers_mobile_label">Layers</span>
			</button>
			<button class="mobile-nav-item" id="mobile_nav_train" onclick="mobile_train_action()">
				<span class="mobile-nav-icon">&#9654;</span>
				<span class="mobile-nav-label" data-tr-text="train_mobile_label">Train</span>
			</button>
			<button class="mobile-nav-item" id="mobile_nav_settings" onclick="mobile_open_panel('settings')">
				<span class="mobile-nav-icon">&#9881;</span>
				<span class="mobile-nav-label" data-tr-text="settings_mobile_label">Settings</span>
			</button>
			<button class="mobile-nav-item" id="mobile_nav_help" onclick="mobile_open_panel('help')">
				<span class="mobile-nav-icon">&#63;</span>
				<span class="mobile-nav-label" data-tr-text="help_mobile_label">Help</span>
			</button>
		</div>

		<!-- Mobile overlay -->
		<div id="mobile_overlay" class="mobile-overlay" onclick="mobile_close_all()"></div>

		<!-- Layers drawer overlay -->
		<div id="mobile_drawer_overlay" class="mobile-drawer-overlay" onclick="mobile_close_drawer()"></div>

		<!-- Dataset Panel -->
		<div id="mobile_panel_dataset" class="mobile-panel">
			<div class="mobile-panel-header">
				<span class="mobile-panel-title" data-tr-text="dataset_and_network_title">Dataset &amp; Network</span>
				<button class="mobile-panel-close" onclick="mobile_close_all()">&times;</button>
			</div>
			<div class="mobile-panel-body">
				<div class="mobile-panel-section">
					<div class="mobile-panel-section-title" data-tr-text="examples_label">Examples</div>
					<div class="mobile-panel-row-stack">
						<div class="mobile-panel-label"><span class="TRANSLATEME_examples"></span></div>
						<div class="mobile-panel-control">
							<select id="mobile_dataset" class="mobile-dataset-select" onchange="$('#dataset').val(this.value).trigger('change'); mobile_close_all();">
							</select>
						</div>
					</div>
					<div class="mobile-panel-row-stack">
						<div class="mobile-panel-label"><span class="TRANSLATEME_dataset"></span></div>
						<div class="mobile-panel-control">
							<select id="mobile_model_dataset" class="mobile-data-origin-select" onchange="$('#model_dataset').val(this.value).trigger('change');">
							</select>
						</div>
					</div>
					<div class="mobile-panel-row-stack">
						<div class="mobile-panel-label"><span class="TRANSLATEME_own_data"></span></div>
						<div class="mobile-panel-control">
							<select id="mobile_data_origin" class="mobile-data-origin-select" onchange="$('#data_origin').val(this.value).trigger('change');">
							</select>
						</div>
					</div>
					<button class="mobile-panel-row" onclick="init_page_contents($('#dataset').val()); mobile_close_all();" style="width:100%; cursor:pointer; text-align:left; font-size:15px; background:none; border:0;">
						<span class="mobile-panel-label"><span class="TRANSLATEME_reset"></span></span>
						<span>&rarr;</span>
					</button>
				</div>

				<div class="mobile-panel-section">
					<div class="mobile-panel-section-title" data-tr-text="hyperparameters_label">Hyperparameters</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_epochs"></span></span>
						<div class="mobile-panel-control">
							<input type="number" id="mobile_epochs" value="30" min="1" step="10" onchange="$('#epochs').val(this.value).trigger('change');">
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_batch_size"></span></span>
						<div class="mobile-panel-control">
							<input type="number" id="mobile_batchSize" value="10" min="1" step="5" onchange="$('#batchSize').val(this.value).trigger('change');">
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_valsplit"></span> %</span>
						<div class="mobile-panel-control">
							<input type="number" id="mobile_validationSplit" value="20" min="0" max="99" step="5" onchange="$('#validationSplit').val(this.value).trigger('change');">
						</div>
					</div>
					<div class="mobile-panel-row expert_mode_only">
						<span class="mobile-panel-label"><span class="TRANSLATEME_number_of_runs"></span></span>
						<div class="mobile-panel-control">
							<input type="number" id="mobile_number_of_runs" value="1" min="1" max="50" step="1" onchange="$('#number_of_runs').val(this.value).trigger('change');">
						</div>
					</div>
				</div>

				<div class="mobile-panel-section hide_when_no_image">
					<div class="mobile-panel-section-title" data-tr-text="image_options">Image Options</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_height"></span></span>
						<div class="mobile-panel-control">
							<input type="number" id="mobile_height" value="" min="1" onchange="$('#height').val(this.value).trigger('change');">
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_width"></span></span>
						<div class="mobile-panel-control">
							<input type="number" id="mobile_width" value="" min="1" onchange="$('#width').val(this.value).trigger('change');">
						</div>
					</div>
					<div class="mobile-panel-row hide_when_custom_data">
						<span class="mobile-panel-label"><span class="TRANSLATEME_img_per_cat"></span></span>
						<div class="mobile-panel-control">
							<input type="number" id="mobile_max_number_of_files_per_category" value="100" min="0" step="5" class="no_red_bg_when_empty" onchange="$('#max_number_of_files_per_category').val(this.value).trigger('change');">
						</div>
					</div>
					<div class="mobile-panel-row expert_mode_only">
						<span class="mobile-panel-label"><span class="TRANSLATEME_augment"></span>?</span>
						<div class="mobile-panel-control">
							<input type="checkbox" id="mobile_auto_augment" onchange="$('#auto_augment').prop('checked', this.checked); show_hide_augment_tab();">
						</div>
					</div>
				</div>

				<div class="mobile-panel-section expert_mode_only" id="mobile_augmentation_section" style="display:none">
					<div class="mobile-panel-section-title" data-tr-text="augmentation">Augmentation</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_auto_rotate_images"></span>?</span>
						<div class="mobile-panel-control">
							<input type="checkbox" id="mobile_augment_rotate_images" onchange="$('#augment_rotate_images').prop('checked', this.checked).trigger('change');">
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_number_of_rotations"></span>?</span>
						<div class="mobile-panel-control">
							<input type="number" id="mobile_number_of_rotations" value="4" min="1" onchange="$('#number_of_rotations').val(this.value).trigger('change');">
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_invert_images"></span>?</span>
						<div class="mobile-panel-control">
							<input type="checkbox" id="mobile_augment_invert_images" onchange="$('#augment_invert_images').prop('checked', this.checked).trigger('change');">
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_flip_left_right"></span></span>
						<div class="mobile-panel-control">
							<input type="checkbox" id="mobile_augment_flip_left_right" onchange="$('#augment_flip_left_right').prop('checked', this.checked).trigger('change');">
						</div>
					</div>
				</div>

				<div class="mobile-panel-section">
					<div class="mobile-panel-section-title" data-tr-text="training_label">Training</div>
					<button class="mobile-train-btn start_training" onclick="train_neural_network(); mobile_close_all();">
						<span class="TRANSLATEME_start_training"></span>
					</button>
					<button class="mobile-retrain-btn restart_training" onclick="retrain_neural_network(); mobile_close_all();">
						<span class="TRANSLATEME_start_training_from_scratch"></span>
					</button>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_autotab"></span></span>
						<div class="mobile-panel-control">
							<input type="checkbox" id="mobile_jump_to_interesting_tab" onchange="$('#jump_to_interesting_tab').prop('checked', this.checked);">
						</div>
					</div>
					<div class="mobile-panel-row expert_mode_only">
						<span class="mobile-panel-label"><span class="TRANSLATEME_divide_x_by"></span>:</span>
						<div class="mobile-panel-control">
							<input type="number" id="mobile_divide_by" value="1" onchange="$('#divide_by').val(this.value); repredict();">
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Settings Panel -->
		<div id="mobile_panel_settings" class="mobile-panel">
			<div class="mobile-panel-header">
				<span class="mobile-panel-title" data-tr-text="settings_title">Settings</span>
				<button class="mobile-panel-close" onclick="mobile_close_all()">&times;</button>
			</div>
			<div class="mobile-panel-body">
				<div class="mobile-panel-section">
					<div class="mobile-panel-section-title" data-tr-text="mode_label">Mode</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label" data-tr-text="gui_mode_label">Mode</span>
						<div class="mobile-panel-control">
							<select id="mobile_mode" onchange="$('#beginner').prop('checked', this.value==='beginner'); $('#expert').prop('checked', this.value==='expert'); set_mode();">
								<option value="beginner" data-tr-text="beginner">&#129466; Beginner</option>
								<option value="expert" data-tr-text="expert">&#9760;&#65039; Expert</option>
							</select>
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_theme_label"></span></span>
						<div class="mobile-panel-control">
							<select id="mobile_theme" onchange="$('#theme_choser').val(this.value); theme_choser();">
								<option value="lightmode">Light Mode</option>
								<option value="darkmode">Dark Mode</option>
								<option value="naturalmode">Natural Mode</option>
							</select>
						</div>
					</div>
					<div class="mobile-panel-row expert_mode_only">
						<span class="mobile-panel-label" data-tr-text="tf_backend_label">Backend</span>
						<div class="mobile-panel-control">
							<select id="mobile_backend" onchange="$('#backend_chooser input[value='+this.value+']').prop('checked', true); set_backend();">
								<option value="cpu">CPU</option>
								<option value="webgl">WebGL</option>
							</select>
						</div>
					</div>
				</div>

				<div class="mobile-panel-section expert_mode_only">
					<div class="mobile-panel-section-title" data-tr-text="loss_metric_label">Loss &amp; Metric</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_loss"></span></span>
						<div class="mobile-panel-control">
							<select id="mobile_loss" onchange="$('#loss').val(this.value).trigger('change');" style="min-width:160px"></select>
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_metric"></span></span>
						<div class="mobile-panel-control">
							<select id="mobile_metric" onchange="$('#metric').val(this.value).trigger('change');" style="min-width:160px"></select>
						</div>
					</div>
				</div>

				<div class="mobile-panel-section expert_mode_only">
					<div class="mobile-panel-section-title" data-tr-text="optimizer_label">Optimizer</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label" data-tr-text="optimizer_label">Optimizer</span>
						<div class="mobile-panel-control">
							<select id="mobile_optimizer" onchange="$('#optimizer').val(this.value).trigger('change');" style="min-width:160px"></select>
						</div>
					</div>
					<div id="mobile_optimizer_params"></div>
				</div>

				<div class="mobile-panel-section expert_mode_only">
					<div class="mobile-panel-section-title" data-tr-text="weights_shuffle_resize">Weights, Shuffle &amp; Resize</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_shuffle_before_each_epoch"></span>?</span>
						<div class="mobile-panel-control">
							<input type="checkbox" id="mobile_shuffle_before_each_epoch" onchange="$('#shuffle_before_each_epoch').prop('checked', this.checked);">
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_enable_tf_debug"></span></span>
						<div class="mobile-panel-control">
							<input type="checkbox" id="mobile_enable_tf_debug" onchange="$('#enable_tf_debug').prop('checked', this.checked); if(this.checked){tf_debug();} else {$('#enable_tf_debug').prop('disabled', false);}">
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_resize_method"></span></span>
						<div class="mobile-panel-control">
							<select id="mobile_default_resize_method" onchange="$('#default_resize_method').val(this.value).trigger('change');">
								<option value="nearestNeighbor">nearestNeighbor</option>
								<option value="bilinear">bilinear</option>
							</select>
						</div>
					</div>
				</div>

				<div class="mobile-panel-section expert_mode_only">
					<div class="mobile-panel-section-title" data-tr-text="set_all_initializers">Set all Initializers</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_kernel_initializer"></span></span>
						<div class="mobile-panel-control">
							<select id="mobile_set_all_kernel_initializers" onchange="$('#set_all_kernel_initializers').val(this.value).trigger('change');" style="min-width:160px"></select>
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_bias_initializer"></span></span>
						<div class="mobile-panel-control">
							<select id="mobile_set_all_bias_initializers" onchange="$('#set_all_bias_initializers').val(this.value).trigger('change');" style="min-width:160px"></select>
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_activation_functions"></span></span>
						<div class="mobile-panel-control">
							<select id="mobile_set_all_activation_functions" onchange="$('#set_all_activation_functions').val(this.value).trigger('change');" style="min-width:160px"></select>
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label">&rdca; <span class="TRANSLATEME_except_last_layer"></span></span>
						<div class="mobile-panel-control">
							<select id="mobile_set_all_activation_functions_except_last_layer" onchange="$('#set_all_activation_functions_except_last_layer').val(this.value).trigger('change');" style="min-width:160px"></select>
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label">Initializer type</span>
						<div class="mobile-panel-control">
							<select id="mobile_change_initializers_selector" onchange="$('#change_initializers_selector').val(this.value).trigger('change');">
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
						</div>
					</div>
					<div class="mobile-panel-row mobile_set_all_initializers_tr set_all_initializers_mean" style="display:none">
						<span class="mobile-panel-label"><span class="TRANSLATEME_mean_label"></span></span>
						<div class="mobile-panel-control">
							<input class="mobile_set_all_initializers_input" id="mobile_set_all_initializers_value_mean" onchange="$('#set_all_initializers_value_mean').val(this.value).trigger('change');" value="1">
						</div>
					</div>
					<div class="mobile-panel-row mobile_set_all_initializers_tr set_all_initializers_value" style="display:none">
						<span class="mobile-panel-label"><span class="TRANSLATEME_value_label"></span></span>
						<div class="mobile-panel-control">
							<input type="number" step="1" class="mobile_set_all_initializers_input" id="mobile_set_all_initializers_value_value" onchange="$('#set_all_initializers_value_value').val(this.value).trigger('change');" value="1">
						</div>
					</div>
					<div class="mobile-panel-row mobile_set_all_initializers_tr set_all_initializers_distribution" style="display:none">
						<span class="mobile-panel-label"><span class="TRANSLATEME_distribution_label"></span></span>
						<div class="mobile-panel-control">
							<select class="mobile_set_all_initializers_input" id="mobile_set_all_initializers_value_distribution" onchange="$('#set_all_initializers_value_distribution').val(this.value).trigger('change');">
								<option value="normal">normal</option>
								<option value="uniform">uniform</option>
								<option value="truncatedNormal">truncatedNormal</option>
							</select>
						</div>
					</div>
					<div class="mobile-panel-row mobile_set_all_initializers_tr set_all_initializers_mode" style="display:none">
						<span class="mobile-panel-label"><span class="TRANSLATEME_mode_label"></span></span>
						<div class="mobile-panel-control">
							<select class="mobile_set_all_initializers_input" id="mobile_set_all_initializers_value_mode" onchange="$('#set_all_initializers_value_mode').val(this.value).trigger('change');">
								<option value="fanIn">fanIn</option>
								<option value="fanOut">fanOut</option>
								<option value="fanAvg">fanAvg</option>
							</select>
						</div>
					</div>
					<div class="mobile-panel-row mobile_set_all_initializers_tr set_all_initializers_scale" style="display:none">
						<span class="mobile-panel-label"><span class="TRANSLATEME_scale_label"></span></span>
						<div class="mobile-panel-control">
							<input class="mobile_set_all_initializers_input" id="mobile_set_all_initializers_value_scale" onchange="$('#set_all_initializers_value_scale').val(this.value).trigger('change');" value="1" type="number" step="1">
						</div>
					</div>
					<div class="mobile-panel-row mobile_set_all_initializers_tr set_all_initializers_maxval" style="display:none">
						<span class="mobile-panel-label"><span class="TRANSLATEME_maxval_label"></span></span>
						<div class="mobile-panel-control">
							<input class="mobile_set_all_initializers_input" id="mobile_set_all_initializers_value_maxval" onchange="$('#set_all_initializers_value_maxval').val(this.value).trigger('change');" value="1" type="number" step="1">
						</div>
					</div>
					<div class="mobile-panel-row mobile_set_all_initializers_tr set_all_initializers_minval" style="display:none">
						<span class="mobile-panel-label"><span class="TRANSLATEME_minval_label"></span></span>
						<div class="mobile-panel-control">
							<input class="mobile_set_all_initializers_input" id="mobile_set_all_initializers_value_minval" onchange="$('#set_all_initializers_value_minval').val(this.value).trigger('change');" value="-1" type="number" step="1">
						</div>
					</div>
					<div class="mobile-panel-row mobile_set_all_initializers_tr set_all_initializers_stddev" style="display:none">
						<span class="mobile-panel-label"><span class="TRANSLATEME_stddev_label"></span></span>
						<div class="mobile-panel-control">
							<input class="mobile_set_all_initializers_input" id="mobile_set_all_initializers_value_stddev" onchange="$('#set_all_initializers_value_stddev').val(this.value).trigger('change');" value="1" type="number" step="1">
						</div>
					</div>
					<div class="mobile-panel-row mobile_set_all_initializers_tr set_all_initializers_seed" style="display:none">
						<span class="mobile-panel-label"><span class="TRANSLATEME_seed_label"></span></span>
						<div class="mobile-panel-control">
							<input class="mobile_set_all_initializers_input" id="mobile_set_all_initializers_value_seed" onchange="$('#set_all_initializers_value_seed').val(this.value).trigger('change');" value="1" type="number" step="1">
						</div>
					</div>
				</div>

				<div class="mobile-panel-section">
					<div class="mobile-panel-section-title" data-tr-text="max_activated_neurons">Visualization</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_iterations"></span></span>
						<div class="mobile-panel-control">
							<input type="number" id="mobile_max_activation_iterations" value="200" min="1" onchange="$('#max_activation_iterations').val(this.value).trigger('change');">
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_learning_rate"></span></span>
						<div class="mobile-panel-control">
							<input type="number" id="mobile_max_activation_lr" value="0.01" min="0.00001" max="10" step="0.001" onchange="$('#max_activation_lr').val(this.value).trigger('change');">
						</div>
					</div>
					<div class="mobile-panel-row hide_when_no_conv_visualizations" style="display:none">
						<span class="mobile-panel-label"><span class="TRANSLATEME_width_amp_height"></span>:</span>
						<div class="mobile-panel-control">
							<input type="number" id="mobile_max_activated_neuron_image_size" value="0" min="0" max="1000" step="1" onchange="$('#max_activated_neuron_image_size').val(this.value).trigger('change');">
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_max_neurons_fcnn"></span>?</span>
						<div class="mobile-panel-control">
							<input type="number" id="mobile_max_neurons_fcnn" value="32" min="0" onchange="$('#max_neurons_fcnn').val(this.value).trigger('change');">
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_batch_plot_minimum_time"></span> (s)</span>
						<div class="mobile-panel-control">
							<input type="number" id="mobile_min_time_between_batch_plots" value="5" min="0" onchange="$('#min_time_between_batch_plots').val(this.value).trigger('change');">
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_show_bars_instead_of_numbers"></span>?</span>
						<div class="mobile-panel-control">
							<input type="checkbox" id="mobile_show_bars_instead_of_numbers" onchange="$('#show_bars_instead_of_numbers').prop('checked', this.checked); updated_page_restart_webcam_if_applicable();">
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_visualize_images_in_grid"></span>?</span>
						<div class="mobile-panel-control">
							<input type="checkbox" id="mobile_visualize_images_in_grid" onchange="$('#visualize_images_in_grid').prop('checked', this.checked); updated_page();">
						</div>
					</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label"><span class="TRANSLATEME_number_of_grid_images"></span>?</span>
						<div class="mobile-panel-control">
							<input type="number" id="mobile_max_number_of_images_in_grid" value="50" min="0" max="1000" onchange="$('#max_number_of_images_in_grid').val(this.value).trigger('change');">
						</div>
					</div>
					<div class="mobile-panel-row" id="mobile_data_plotter_row" style="display:none">
						<span class="mobile-panel-label"><span class="TRANSLATEME_show_raw_data"></span>?</span>
						<div class="mobile-panel-control">
							<input type="checkbox" id="mobile_show_raw_data" onchange="$('#show_raw_data').prop('checked', this.checked);">
						</div>
					</div>
					<div class="mobile-panel-row" id="mobile_pixel_size_row" style="display:none">
						<span class="mobile-panel-label"><span class="TRANSLATEME_pixel_size"></span></span>
						<div class="mobile-panel-control">
							<input type="number" id="mobile_pixel_size" value="1" min="1" max="100" onchange="$('#pixel_size').val(this.value); change_pixel_size();">
						</div>
					</div>
					<div class="mobile-panel-row" id="mobile_kernel_pixel_size_row" style="display:none">
						<span class="mobile-panel-label"><span class="TRANSLATEME_kernel_pixel_size"></span></span>
						<div class="mobile-panel-control">
							<input type="number" id="mobile_kernel_pixel_size" value="10" min="1" max="100" onchange="$('#kernel_pixel_size').val(this.value); change_kernel_pixel_size();">
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Help Panel -->
		<div id="mobile_panel_help" class="mobile-panel">
			<div class="mobile-panel-header">
				<span class="mobile-panel-title" data-tr-text="help_label">Help</span>
				<button class="mobile-panel-close" onclick="mobile_close_all()">&times;</button>
			</div>
			<div class="mobile-panel-body">
				<div class="mobile-panel-section">
					<button class="mobile-panel-row" onclick="window.open('manual.html', '_blank'); mobile_close_all();" style="width:100%; cursor:pointer; text-align:left; font-size:15px;">
						<span class="mobile-panel-label" data-tr-text="open_help_page">Open Help Page</span>
						<span>&rarr;</span>
					</button>
				</div>
				<div class="mobile-panel-section">
					<div class="mobile-panel-section-title" data-tr-text="language_label">Language</div>
					<div class="mobile-panel-row">
						<span class="mobile-panel-label">Language</span>
						<div class="mobile-panel-control" style="display:flex; gap:12px;">
							<span onclick='update_lang("de")' style="cursor:pointer; font-size:24px;"><img src="_gui/icons/german.svg" height=24 /></span>
							<span onclick='update_lang("en")' style="cursor:pointer; font-size:24px;"><img src="_gui/icons/english.svg" height=24 /></span>
						</div>
					</div>
				</div>
				<div class="mobile-panel-section">
					<div class="mobile-panel-section-title" data-tr-text="code_and_paper_label">Code &amp; Paper</div>
					<button class="mobile-panel-row" onclick='window.open("https://arxiv.org/abs/2501.06226", "_blank"); mobile_close_all();' style="width:100%; cursor:pointer; text-align:left; font-size:15px;">
						<span class="mobile-panel-label"><span class="TRANSLATEME_paper"></span></span>
						<span>&rarr;</span>
					</button>
					<button class="mobile-panel-row" onclick='window.open("https://github.com/NormanTUD/asanAI/", "_blank"); mobile_close_all();' style="width:100%; cursor:pointer; text-align:left; font-size:15px;">
						<span class="mobile-panel-label"><span class="TRANSLATEME_code_label"></span></span>
						<span>&rarr;</span>
					</button>
					<button class="mobile-panel-row" onclick="sources_popup(); mobile_close_all();" style="width:100%; cursor:pointer; text-align:left; font-size:15px;">
						<span class="mobile-panel-label"><span class="TRANSLATEME_sources_and_used_programs"></span></span>
						<span>&rarr;</span>
					</button>
					<button class="mobile-panel-row" onclick="location.href='mailto:norman.koch@tu-dresden.de'; mobile_close_all();" style="width:100%; cursor:pointer; text-align:left; font-size:15px;">
						<span class="mobile-panel-label">norman.koch@tu-dresden.de</span>
						<span>&rarr;</span>
					</button>
				</div>
			</div>
		</div>

<?php
		_include("php_files/status_bar.php");
		_include("php_files/load_msg.php");
		_js("libs/prism/prism.js");
		_js("libs/prism/prism-python.min.js");
		_js("libs/jscolor.js", 1, 1);
		_js("bottom.js");
		_js("libs/html2canvas.min.js");
		_js("libs/jszip.min.js");
?>
	</body>
</html>
