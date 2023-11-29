<?php
# create_graphviz_function_call_graph();
# echo "digraph a {" > cleaned.dot; cat test.dot | grep -v alert | grep -v '"log"' | grep -v 'Error' | grep -v 'md5' | grep -v Interval | grep -v assert | grep -v '"abs"' | grep -v 'get_stack_trace' | grep -v swal | grep -v '"Array"' | egrep -v '"min|max|height|width|isNaN"' | grep -v sweet | grep -v run_tests | grep -v jscolor | grep -v eval | grep -v Promise | grep -v LeNet | grep -v FCNN | grep -v Fireworks | grep -v FilterUtils | grep -v EventListener | grep -v restart_lenet | grep -v restart_fcnn | grep -vi sparkle | grep -v parseInt | grep -v parseFloat | grep -v toString | grep -v parseFloat | grep -v matchMedia | grep -v parseInt | grep -v parseFloat | egrep -vi "blur|dither|smear|filter" | grep -v '"html"' | grep -v '"debug"' | grep -v "^}" | grep -v digraph | sort | uniq >> cleaned.dot; echo "}" >> cleaned.dot; wc -l cleaned.dot; dot -Tsvg cleaned.dot > cleaned.svg && firefox cleaned.svg
# find unused global vars:
# for i in $(ack "^var " variables.js | sed -e 's#^var\s*##' | sed -e 's#;\s*$##' | sed -e 's#\s*=\s*.*##' | sort | uniq); do RESULT=$(ack "$i" *.js | grep -v variables.js | wc -l); if [[ $RESULT -eq 0 ]]; then echo "$i was found 0 times outside of variables.js"; fi; done
	include("functions.php");

	_include("translations.php");
	
	show_admin_register();

	_include("log_users.php");
	
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

		if(!isset($_GET["start_cosmo"])) {
			$theme_base = "light";
		}

		_css("libs/classic.min.css");
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

		_js("tf/tf.min.js");
		_js("base_wrappers.js");
		_js("libs/jstat.min.js");
		_js("custom_layers.js");
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
		_js("data.js");
		_js("gui.js");
		_js("easter_eggs.js");
		_js("present.js");
		_js("cosmo.js");
		_js("train.js");
		_js("predict.js");

		_js("libs/d3.v5.min.js");
		_js("libs/three.min.js");
		_js("visualizations/Projector.js");
		_js("visualizations/util.js");
		_js("visualizations/LeNet.js");

		_js("libs/atrament.js", 1, 1);
		_js("main.js");

		_js("libs/plotly-latest.min.js");
		_js("selftests.js", 1, 1);

		_js("carminigame.js", 1, 1);
?>
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
		_include("cosmo_header.php");
?>
	</head>
	<body id='body'>
		<span style="display: none">
			<input name="hacky_field" value="dieses leere feld ist dafür da, damit der erste wert immer als referenzwert für die check_number_values gilt, damit es einen default-wert gibt, von dem aus die farbe aus dem theme gewählt werden kann. ziemlich hacky..."></input>
		</span>
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
						if(
							(preg_match("/\.png$/i", $file) || preg_match("/\.svg$/i", $file)) && 
							(!isset($_GET["max_presentation"]) || $i <= $_GET["max_presentation"])
						) {
							$path = "presentation/de/$file";
							print "<div class='slide'><img style='margin-left: auto; margin-right: auto; display: block; max-width: 95%; max-height: 95%; height: 90%; object-fit: contain;' alt='Presentation, page filename: $file' src='$path?t=".get_file_state_identifier($path)."'></div>";
							$i++;
						}
					}
?>
				</div>
<?php
			}

			_include("ribbon.php");
?>

			<div id="maindiv">
<?php
				_include("divs/losses_popup.php");
				_include("divs/sources_popup.php");
				_include("divs/upload_model_dialog.php");
				_include("divs/register_dialog.php");
				_include("divs/save_model_dialog.php");
				_include("divs/errorcontainer.php");
?>
				<div id="help" style="display: none"></div>
				<div id="toggle_layers_button" ><button style="width: 100%" onclick="toggle_layers()"><span id="robot_layer" class="large_button">&#9881;&#129302;</span></button></div>

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
		_include("cosmo_next_button.php");
		_include("status_bar.php");
		_include("load_msg.php");
		_js("libs/prism/prism.js");
		_js("libs/prism/prism-python.min.js");
		_js("libs/jscolor.js", 1, 1);
		_js("bottom.js");
		_js("libs/html2canvas.min.js");
		_js("libs/jszip.min.js");
?>
	</body>
</html>
