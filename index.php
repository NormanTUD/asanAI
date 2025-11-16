<?php
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

		_css("css/ribbon_media.css");
		_css("css/".$theme_base."mode.css", "css_mode");
		_css("css/ribbon".$theme_base."mode.css", "css_ribbon");
		_css("libs/prism/prism.min.css");
		_css("libs/sweetalert2.min.css");

		_js("tf/tf.min.js");
		_js("base_wrappers.js");
		_js("libs/jstat.min.js");
		_js("custom_layers.js");
		_js("snake_activation_layer.js");
		_js("multi_activation.js");
		_js("libs/jsmanipulate.js", 1, 1);

		_js("libs/zip.js");
		_js("libs/md5.umd.min.js");
		_js("libs/jquery.js");
		_js("libs/jquery-ui.js");

		_js("translations.js", 1, 1);
		_js("debug.js");
		_js("variables.js");

		_js("libs/canvas-to-blob.min.js");

		_js("libs/sweetalert2.all.js");

		_js("libs/fireworks.js", 1, 1);
		_js("libs/confetti.browser.min.js", 1, 1);

		_js("safety.js");
		_js("tests.js");
		_js("model.js");
		_js("explain.js");
		_js("math_mode.js");
		_js("feature_maps.js");
		_js("grad_cam.js");
		_js("data.js");
		_js("webcam.js");
		_js("gui.js");
		_js("faster_canvas_functions.js");
		_js("fcnn.js");
		_js("easter_eggs.js");
		_js("train.js");
		_js("predict.js");
		_js("plot_predict.js");
		_js("my_temml.js");
		_js("weight_surfaces.js");

		_js("libs/d3.v5.min.js");
		_js("libs/three.min.js");
		_js("visualizations/Projector.js");
		_js("visualizations/util.js");

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
		if($_SERVER["HTTP_HOST"] != "localhost") {
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
