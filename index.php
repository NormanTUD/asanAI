<?php
	include("functions.php");
	
	$darkmode = 0;

	if(array_key_exists("darkmode", $_COOKIE) && $_COOKIE["darkmode"]) {
		$darkmode = !!$_COOKIE["darkmode"];
	}

	if(array_key_exists("darkmode", $_GET)) {
		setcookie("darkmode", 1);
		$darkmode = 1;
	} else if(array_key_exists("lightmode", $_GET)) {
		setcookie("darkmode", 0);
		$darkmode = 0;
	}
?>
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
		<title>Neural Network Editor</title>
		<meta charset="utf-8">


		<script>
			var traindata_struct =
<?php
				include("traindata.php");
?>

			var darkmode = <?php print $darkmode; ?>;

			var show_layer_trial_error = <?php print array_key_exists("show_layer_trial_error", $_GET) ? 1 : 0; ?>;
		</script>


<?php
		$tablist_color = "254c87";

		$minify = 1;
		if(array_key_exists("no_minify", $_GET)) {
			$minify = 0;
		}
?>
		<link href="<?php print $minify ? "minify.php?file=" : ""; ?>jquery-ui.css" rel="stylesheet">
		<link href="<?php print $minify ? "minify.php?file=" : ""; ?>style.css" rel="stylesheet">
		<link rel="stylesheet" type="text/css" href="<?php print $minify ? "minify.php?file=" : ""; ?>ribbon.css">
<?php
		if($darkmode) {
			$tablist_color = "000000";
?>
			<link href="<?php print $minify ? "minify.php?file=" : ""; ?>darkmode.css" rel="stylesheet">
			<link rel="stylesheet" type="text/css" href="<?php print $minify ? "minify.php?file=" : ""; ?>ribbondarkmode.css">
<?php
		} else {
?>

			<link href="<?php print $minify ? "minify.php?file=" : ""; ?>lightmode.css" rel="stylesheet">
			<link rel="stylesheet" type="text/css" href="<?php print $minify ? "minify.php?file=" : ""; ?>ribbonlightmode.css">
<?php
		}
?>
		<link href="<?php print $minify ? "minify.php?file=" : ""; ?>prism/prism.min.css" rel="stylesheet">
		<link href="<?php print $minify ? "minify.php?file=" : ""; ?>external/sweetalert2.min.css" rel="stylesheet">


		<!-- jquery -->
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>jquery.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>jquery-ui.js"></script>

		<!-- sweetalert -->
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>external/sweetalert2.all.js"></script>

		<!-- tensorflow.js -->
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>tf/tf.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>tf/tfjs-vis.js"></script>

		<!-- my own js stuff -->
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>safety.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>variables.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>tests.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>model.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>explain.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>data.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>debug.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>gui.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>train.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>predict.js"></script>

		<!-- visualizations -->
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>visualizations/d3.v5.min.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>visualizations/three.min.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>visualizations/OrbitControls.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>visualizations/SVGRenderer.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>visualizations/Projector.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>visualizations/util.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>visualizations/AlexNet.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>visualizations/LeNet.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>visualizations/FCNN.js"></script>

		<!-- ChardinJS -->
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>chardinjs.js"></script>
		<link rel="stylesheet" type="text/css" href="<?php print $minify ? "minify.php?file=" : ""; ?>chardinjs.css">

		<script>
			var chardinJs = $("body").chardinJs($("body"));
		</script>

		<!-- mathjax -->
		<!--<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>-->
		<!--<script type="text/javascript" src="MathJax-2.7.7/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>-->
		<script type="text/javascript" src="mathjax/es5/tex-chtml-full.js?config=TeX-AMS-MML_HTMLorMML"></script>
		

		<script type="text/x-mathjax-config">
			var font = "Neo-Euler";
			MathJax.Hub.Config({
				tex2jax: {
					inlineMath: [['$','$']],
					"preview": "none"
				},
				"SVG":{
					font:font
				},
				"showMathMenu": true,
				"HTML-CSS": {
					"EqnChunk": 50,
					"EqnChunkDelay": 10
				},
				"fast-preview": {
					"disabled": true
				}
			});
		</script>

		<!--
		<script src="clippy/build/clippy.js"></script>
		<script type="text/javascript">
			var this_agent = null;
			clippy.load('Merlin', function(agent) {
				this_agent = agent;
			});
		</script>
		-->

		<link rel="apple-touch-icon" href="apple-touch-icon-180x180.png">
		<meta name="theme-color" content="#7299d2">
		<meta name="description" content="A tool for learning how to use TensorFlow without writing a single line of code">
	</head>
	<body data-chardin-sequenced="true">
		<div id="mainsite">
			<div id="ribbon">
				<ul id="tablist" style="background: #<?php print $tablist_color; ?>">
					<li><span class="symbol_button" title="Download model" style="cursor: pointer" onclick="save_model()">&#128190;</span></li>
					<li><span class="symbol_button disabled_symbol" title="Upload model" onclick="open_save_dialog()" style="cursor: pointer">&#128194;</span></li>
					<li><span class="symbol_button enabled_symbol" title="Download current weights as json-file" onclick="download_weights_json()">⇓</span></li>
					<li><span class="symbol_button disabled_symbol" title="Undo last action" id="undo_button" onclick="undo()">&#8630;</span></li>
					<li><span class="symbol_button disabled_symbol" title="Redo last undone action" id="redo_button" onclick="redo()">&#8631;</span></li>
					<li><span class="symbol_button disabled_symbol" data-intro="Shows help. Click anywhere on the page to go to the next help, or press escape to exit help mode." title="Help" style="cursor: help" id="chardinjs_help_icon" onclick="start_chardin_tour()">&#10067;</span></li>
					<!--<li><span class="symbol_button enabled_symbol" title="Start Clippy-Tour" onclick="clippy_tour()">&#129497;&#8205;&#9794;&#65039;</span></li>-->
					<span id="tensor_number_debugger" style="display: none"></span>
				</ul>

				<div id="home_ribbon" class="ribbon_tab_content" title="Home">
					<div class="ribbon-group">
						<div class="ribbon-toolbar" style="width:370px">
							<table width=360>
								<tr>
									<td>
										<span class="symbol_button">Problem type:</span>
									</td>
									<td colspan=2">
										<select data-position="right" data-intro="Choose a category here (images, classification, your own data)" id="dataset_category" onchange="init_dataset_category();show_or_hide_load_weights();model_is_trained=false;set_config();" style="width: 100%">
										</select>
									</td>
								</tr>
								<tr>
									<td>
										<span class="symbol_button">Architecture:</span>
									</td>
									<td colspan=2">
										<select id="dataset" onchange="chose_dataset();" style="width: 141px">
										</select>
										<button id="reset_model" onclick="init_page_contents($('#dataset').val())">Reset Network</button>
									</td>
								</tr>
								<div id="pretrained_weights">
									<tr>
										<td>
											<span class="symbol_button">Dataset:</span>
										</td>
										<td colspan=2>
											<select id="model_dataset" onchange="change_model_dataset();" style="width: 205px">
											</select>
											<button id="load_weights_button" style="display: none" onclick="load_weights(1)" position="right" data-intro="Click here to load pretrained weights for the chosen model">Load</button>
										</td>
									</tr>
								</div>
								<tr>
									<td>Shapes: </td>
									<td><input type="text" value="" style="width: 105px;" onchange="update_input_shape()" readonly id="inputShape" />&nbsp;&rarr;&nbsp;<input type="text" value="" style="width: 105px;" readonly id="outputShape" /></td>
								</tr>
							</table>

						</div>
						<div class="ribbon-group-title">Dataset and Network</div>
					</div>

					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group" data-intro="The loss specifies how the quality of the model should be evaluated while training. The metric is just for you, so you have a basic idea of how good the trained model is.">
						<div class="ribbon-toolbar" style="width: 290px">
							<table>
								<tr>
									<td>Loss:</td>
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
									<tr>
										<td style="white-space: nowrap;"><i>X</i>&amp;<i>Y</i>-Source:</td>
										<td>
											<select id="data_origin" onchange="change_data_origin(1)" style="width: 140px">
												<option value="default">Default</option>
												<option value="own">Own</option>
											</select>
										</td>
									</tr>
								</tr>
								<tr>
									<td>Auto-Input-Shape?</td>
									<td><input type="checkbox" value=1 checked onchange="toggle_allow_edit_inputShape()" id="auto_input_shape" /></td>
								</tr>
							</table>
						</div>
						<div class="ribbon-group-title">Loss/Metric/Data</div>
					</div>

					<div id="custom_training_data_settings" style="display: none">
						<div class="ribbon-group-sep"></div>
						<div class="ribbon-group" data-intro="You can set where your training data should come from here">
							<div class="ribbon-toolbar" style="width:220px">
								<table>
									<tr id="data_type_row" style="display: none">
										<td>Data Type:</td>
										<td>
											<select id="data_type" onchange="change_data_origin(1)">
												<option value="csv">&#128290; CSV</option>
												<option value="image">&#128444; Image</option>
												<option value="tensordata">&#x2318; Tensor-Data</option>
											</select>
										</td>
									</tr>

								</table>
							</div>
							<div class="ribbon-group-title">Training data</div>
						</div>
					</div>

					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group" style="display:none">
						<div class="ribbon-toolbar" style="width:100px">
							<input type="number" id="numberoflayers" value="2" min="1" step="1" style="width: 85%" />
						</div>
						<div class="ribbon-group-title">Layers</div>
					</div>
					<!--<div class="ribbon-group-sep"></div>-->

					<div class="ribbon-group" data-intro="You can set basic hyperparameters here">
						<div class="ribbon-toolbar" style="width:170px">
							<table>
								<tr><td>Epochs:</td><td><input type="number" id="epochs" value="2" min="1" step="1" style="width: 50px;" /></td></tr>
								<tr><td>Batch-Size:</td><td><input type="number" id="batchSize" value="10" min="1" step="1" style="width: 50px;" /></td></tr>
								<tr><td colspan="2"><button id="reset_data" style="display: none" onclick="reset_data()">Reset training data</button></td></tr>
								<tr><td>Val.-Split %:</td><td><input type="number" min="0" max="100" step="5" value="20" style="width: 50px;" id="validationSplit" /></td></tr>
							</table>
						</div>
						<div class="ribbon-group-title">Hyperparameters</div>
					</div>
					<div class="ribbon-group-sep"></div>

					<div id="image_resize_dimensions">
						<div class="ribbon-group" data-intro="Special settings for image-networks. Allows resizing and limiting the number of images per category.">
							<div class="ribbon-toolbar" style="width:180px">
								<table>
									<tr>
										<td>Width:</td>
										<td><input type="number" min="1" max="255" value="" onchange="change_width()" onkeyup="change_width()" id="width" style="width: 50px;" /></td>
									</tr>
									<tr>
										<td>Height:</td>
										<td><input type="number" min="1" max="255" value="" onchange="change_height()" onkeyup="change_height()" id="height" style="width: 50px;" /></td>
									</tr>
									<tr id="max_number_of_files_per_category_tr" style="display: none">
										<td>Img/category:</td>
										<td><input type="number" min="0" value="100" id="max_number_of_files_per_category" style="width: 50px" /></td>
									</tr>
								</table>
							</div>
							<div class="ribbon-group-title">Image Options</div>
						</div>
						<div class="ribbon-group-sep"></div>
					</div>

					<div class="ribbon-group" data-intro="Basic training settings are here. You can also start training here.">
						<div class="ribbon-toolbar">
							<button id="train_neural_network_button" data-intro="Starts training. Shortcut: CTRL ," style="min-width: 150px; width: 100%" onclick="train_neural_network()">Start training</button>
							<div class="small_vskip"></div>
							<span class="symbol_button">&#x1F4C9;</span> Auto-jump to training tab? <input type="checkbox" value="1" id="jump_to_training_tab" checked /><br>
							<div class="small_vskip"></div>
							<span class="symbol_button">&#127937;</span> Auto-jump to predict tab? <input type="checkbox" value="1" id="jump_to_predict_tab" checked /><br>
							<div class="small_vskip"></div>
							Divide <i>X</i>-Tensor by: <input style="width: 50px;" type="text" value="1" id="divide_by" />
						</div>
						<div class="ribbon-group-title">Training</div>
					</div>
				</div>

				<div id="tf_ribbon" class="ribbon_tab_content" title="Settings">
					<div class="ribbon-group">
						<div class="ribbon-toolbar">
							<fieldset style="border-width: 0px" id="backend_chooser" data-intro="CPU is faster for small datasets while WebGL is faster for larger datasets if you have a GPU"> 
								<input type="radio" onchange="set_backend()" name="backend_chooser" value="cpu" id="svg_renderer">
								<label for="svg_renderer">CPU</label>

								<input type="radio" onchange="set_backend()" name="backend_chooser" value="webgl" id="webgl_renderer" checked>
								<label for="webgl_renderer">WebGL</label>
							</fieldset>
							<hr>
							<fieldset style="border-width: 0px" id="mode_chooser" data-intro="The amateur settings check model configuration for plausibility (only from a technical point of view, not for plausibility of the data analysis methods). If you chose 'expert', no checks on the model plausibility are made."> 
								<input type="radio" onchange="set_mode()" name="mode_chooser" value="amateur" id="amateur" checked>
								<label for="amateur">&#129466; Amateur</label>

								<input type="radio" onchange="set_mode()" name="mode_chooser" value="expert" id="expert">
								<label for="expert">&#9760;&#65039; Expert</label>
							</fieldset>
							Dark mode (reloads page)? <input value=1 type="checkbox" id="darkmode_choser" <?php print $darkmode ? "checked" : ""; ?> onclick="darkmode_choser()" />
						</div>
						<div class="ribbon-group-title">TF-Backend/GUI-Mode</div>
					</div>

					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group" data-intro="Here you can set specific options that are then applied to all layers.">
						<div class="ribbon-toolbar">
							<table>
								<tr>
									<td>Kernel initializer</td>
									<td>
										<select id="set_all_kernel_initializers" onchange="set_all_kernel_initializers()">
											<option value="none">&mdash;</option>
										</select>
									</td>
								</tr>
								<tr>
									<td>Bias initializer</td>
									<td>
										<select id="set_all_bias_initializers" onchange="set_all_bias_initializers()">
											<option value="none">&mdash;</option>
										</select>
									</td>
								</tr>
								<tr>
									<td>Activation functions</td>
									<td>
										<select id="set_all_activation_functions" onchange="set_all_activation_functions()">
											<option value="none">&mdash;</option>
										</select>
									</td>
								</tr>
							</table>
						</div>
						<div class="ribbon-group-title">Set options for all</div>
					</div>

					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group" data-intro="The optimizer tries to minimize the loss. Here you can set the optimizer's settings.">
						<div class="ribbon-toolbar" style="width:200px">
							<select id="optimizer" onchange='change_optimizer()' style="width: 100%">
								<option value="adam">adam</option>
								<option value="adadelta">adadelta</option>
								<option value="adagrad">adagrad</option>
								<option value="adamax">adamax</option>
								<option value="rmsprop">rmsprop</option>
								<option value="sgd">sgd</option>
							</select>
							<!--<a href="#" onclick="show_optimizer_help()">What does this mean?</a>-->
						</div>

						<div class="ribbon-toolbar" style="max-width: 1000px; width: auto">
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

										<td>Learning rate:</td>
										<td><input class="optimizer_metadata_input" type="number" min="0.000001" max="1" step="0.000001" value="0.1" id="initialAccumulatorValue_adagrad" /></td>
									</tr>
								</table>
							</div>

							<div class="container optimizer_metadata" style="display: none;" id="adam_metadata">
								<table style="width: 80%">
									<tr>
										<td>Learning rate:</td>
										<td><input class="optimizer_metadata_input" type="number" min="0.000001" max="1" step="0.000001" value="0.001" id="learningRate_adam" /></td>

										<td>beta1:</td>
										<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0.9" id="beta1_adam" /></td>
									</tr>

									<tr>
										<td>beta2:</td>
										<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0.999" id="beta2_adam" /></td>

										<td>Epsilon:</td>
										<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0.0001" id="epsilon_adam" /></td>
									</tr>
								</table>
							</div>

							<div class="container optimizer_metadata" style="display: none;" id="adadelta_metadata">
								<table style="width: 80%">
									<tr>
										<td>Learning rate:</td>
										<td><input class="optimizer_metadata_input" type="number" min="0.00000000000001" max="1" step="0.000001" value="0.001" id="learningRate_adadelta" /></td>

										<td>Rho:</td>
										<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0.95" id="rho_adadelta" /></td>

										<td>Epsilon:</td>
										<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0.0001" id="epsilon_adadelta" /></td>
									</tr>
								</table>
							</div>

							<div class="container optimizer_metadata" style="display: none;" id="adamax_metadata">
								<table style="width: 80%">
									<tr>
										<td>Learning rate:</td>
										<td><input class="optimizer_metadata_input" type="number" min="0.00000000000001" max="1" step="0.000001" value="0.002" id="learningRate_adamax" /></td>

										<td>beta1:</td>
										<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0.9" id="beta1_adamax" /></td>

										<td>beta2:</td>
										<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0.999" id="beta2_adamax" /></td>
									</tr>
									<tr>

										<td>Decay:</td>
										<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0" id="decay_adamax" /></td>

										<td>Epsilon:</td>
										<td><input class="optimizer_metadata_input" type="number" min="0.0000000000001" max="1" step="0.000001" value="0.0001" id="epsilon_adamax" /></td>

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

										<td>Epsilon:</td>
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
						<div class="ribbon-group-title">Optimizer</div>
					</div>

				</div>

				<div id="visualization_ribbon" class="ribbon_tab_content" title="Visualization">
					<div class="ribbon-group" style="width: auto;">
						<div class="ribbon-toolbar">
							<table>
								<tr data-intro="Show the current layer live in the FCNN-style-view">
									<td>Highlight layer?</td>
									<td><input type='checkbox' value="1" id="show_progress_through_layers" /></td>
								</tr>
								<tr class="hide_when_no_alexnet">
									<td>AlexNet-Renderer</td>
									<td>
										<fieldset style="border-width: 0px" id="alexnet_renderer"> 
											<!--<legend>AlexNet-renderer:</legend> -->
											<input type="radio" onchange="restart_alexnet()" name="alexnet_renderer" value="webgl" id="webgl_renderer" checked>
											<label for="webgl_renderer">WebGL</label>
											<input type="radio" onchange="restart_alexnet()" name="alexnet_renderer" value="svg" id="svg_renderer">
											<label for="svg_renderer">SVG</label>
										</fieldset>
									</td>
								</tr>
								<tr data-intro="Show a counter on the layers that increases every time that layer gets called.">
									<td>Call counter?</td>
									<td><input type='checkbox' value="1" onclick="$('.call_counter_container').toggle()" id="show_call_counter" /></td>
								</tr>
								<tr data-intro="Show the input layers">
									<td>Input&nbsp;Layer?</td>
									<td><input type='checkbox' value="1" onclick="toggle_show_input_layer()" id="show_input_layer" checked /></td>
								</tr>
							</table>
						</div>
						<div class="ribbon-group-title">Visualizations</div>
					</div>

					<div class="hide_when_no_conv_visualiations">
						<div class="ribbon-group-sep"></div>
						<div class="ribbon-group">
							<div class="ribbon-group">
								<div class="ribbon-toolbar" style="width: auto; max-width: 500px;">
									<table>
										<tr data-intro="The pixel-size for the 'maximally activated'-neuron-patterns (doable in the FCNN views by clicking on a single neuron)">
											<td>Pixel size:</td>
											<td><input type="number" min="1" max="100" value="10" onchange="change_max_activation_pixel_size()" onkeyup="change_max_activation_pixel_size()" id="max_activation_pixel_size" style="width: 80px;" /></td>
										</tr>
										<tr data-intro="Number of iterations to create the maximally-activated-neuron-patterns">
											<td>Iterations:</td>
											<td><input type="number" min="1" value="80" id="max_activation_iterations" style="width: 80px;" /></td>
										</tr>
										<tr data-intro="If this is checked, it starts with a single example image (if available)">
											<td>Use example imgs as base?</td>
											<td><input type="checkbox" value="1" id="use_example_image_as_base" /></td>
										</tr>
									</table>
								</div>
							</div>
							<div class="ribbon-group-title">Max. activated neurons</div>
						</div>
					</div>


					<div class="ribbon-group-sep"></div>
					<div class="ribbon-group">
						<div class="ribbon-toolbar" style="width:190px">
							<table data-intro="Show the input and output (and kernel) images when possible. See 'Visualizations' -> 'Layer Visualizations' after training or predicting.">
								<tr class="hide_when_no_conv_visualiations">
									<td>Show layer data flow:</td>
									<td><input type="checkbox" value="1" onclick="enable_disable_kernel_images();add_layer_debuggers()" id="show_layer_data" /></td>
								</tr>
								<tr class="hide_when_no_conv_visualiations">
									<td>Show kernel images:</td>
									<td><input type="checkbox" value="1" onclick="add_layer_debuggers();" id="show_kernel_images" /></td>
								</tr>
								<tr>
									<td>Enable TF-Debug:</td>
									<td><input type="checkbox" value="1" onclick="tf_debug();" id="enable_tf_debug" /></td>
								</tr>
								<tr>
									<td>Memory Debugger:</td>
									<td><input type="checkbox" value="1" onclick="toggle_memory_debug();" id="memory_debugger" /></td>
								</tr>
							</table>
						</div>
						<div class="ribbon-group-title">Debug</div>
					</div>

					<div id="math_mode_settings" style="display: none">
						<div class="ribbon-group-sep"></div>
						<div class="ribbon-group">
							<div class="ribbon-toolbar">
								<table data-intro="Options for the math mode.">
									<tr>
										<td>No. decimal points (0 = no limit):</td>
										<td><input type="number" style="width: 30px" value="0" min="0" onchange="write_model_to_latex_to_page(1)" id="decimal_points_math_mode" /></td>
									</tr>
								</table>
							</div>
							<div class="ribbon-group-title">Math-Mode</div>
						</div>
					</div>

					<div id="data_plotter" style="display: none">
						<div class="ribbon-group-sep"></div>
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
			</div>

			<div id="maindiv">
				<div id="save_dialog" style="display: none;">
					<div class="popup_body less_transparent_glass_box">
						<div style="position: relative; width: 100%; height: 100%; filter: blur(20px)">
						</div>
						<div> 
							<h1>Trained in Keras</h1>
							<p>Use this command to convert TensorFlow to TFJS-models:</p>
							<p><tt>tensorflowjs_converter --input_format=keras_saved_model --output_format=tfjs_layers_model model jsmodel</tt></p>

							<p>Notice: You need to upload JSON <i>and</i> BIN-files from the trained models to have specified weights. Only one is not sufficient!</p>

							<table>
								<tr>
									<td>Upload Model (<tt>.json</tt>):</td>
									<td><input accept="application/json" type="file" id="upload_model" onclick="set_config()" value="Upload Model"></td>
								</tr>
								<tr>
									<td>Upload Model weights (<tt>.bin</tt>):</td>
									<td><input accept="application/octet-stream" type="file" id="upload_weights" onclick="set_config()" value="Upload Weights"></td>
								</tr>
							</table>

							<h1>Trained in the browser with this demonstrator</h1>

							<p>Upload the weights.json here.</p>

							<table>
								<tr>
									<td>Upload Model weights (<tt>.json</tt>):</td>
									<td><input accept="application/octet-stream" type="file" id="upload_tfjs_weights" value="Upload Weights"></td>
								</tr>
							</table>
							<button class="close_button" onclick="closePopup('save_dialog')">Close</button>
						</div>
					</div>
				</div>

				<div class="container" id="errorcontainer" style="display: none">
					<div class="left"></div>
					<div class="right reset_before_train_network" id="error"></div>
				</div>


				<div id="help" style="display: none"></div>

				<div class="side_by_side_container">
					<div id="layers_container_left" class="left_side">
						<ul id="layers_container" class="ui-sortable"><li></li></ul>
					</div>
					<div class="right_side" id="graphs_here" style="padding-left: 10px">
						<div id="right_side" class="glass_box" style="float: right; width: 99%; overflow-y: hidden;">
							<div style="display: flex">
								<ul>
									<li><a href="#visualization_tab" id="visualization_tab_label" data-intro="Show different kind of visualizations to help you design the network you want.">Visualizations</a></li>
									<li><a id="code_tab_label" href="#code_tab" data-intro="Shows Python/NodeJS/TensorFlow.js-HTML-Code of the currently configured neural network.">Code</a></li>
									<li><a href="#summary_tab" data-intro="Shows the model.summary of the currently configured model">Summary</a></li>
										<li><a id="training_data_tab_label" href="#training_data_tab">Data</a></li>
										<li><a id="own_image_data_label" href="#own_image_data">Own image data</a></li>
										<li><a id="own_tensor_data_label" href="#own_tensor_data">Own tensor data</a></li>
										<li><a id="own_csv_data_label" href="#own_csv_data">Own CSV data</a></li>
									<li><a href="#tfvis_tab" id="tfvis_tab_label" data-intro="Shows the training data (if possible) and the training progress.">Training</a></li>
									<li id="predict_tab_label"><a href="#predict_tab" data-intro="Allows you to predict data from the trained model.">Predict</a></li>
								</ul>
								<span id="toggle_layer_view_button" style="position: relative; top: 6px" onclick="toggle_layer_view()">&#128470;</span>
							</div>

							<div id="own_csv_data">
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
													<td>Auto-set last layer's activation to linear when any $Y$-values are smaller than 0 or greater than 1?</td>
													<td><input type="checkbox" value="1" onchange="show_csv_file(1)" id="auto_set_last_layer_activation" checked /></td>
												</tr>
												<tr>
													<td>Seperator:</td>
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
									<button class="btn">Provide X-data file</button>
									<input id="upload_x_file" type="file" name="x_data">
								</div>
								<div class="upload-btn-wrapper">
									<button class="btn">Provide Y-data file</button>
									<input id="upload_y_file" type="file" name="y_data">
								</div>
								<br>
								Max number of values (0 = no limit): <input type="number" min="1" value="0" id="max_number_values" style="width: 50px;" />
							</div>

							<div id="own_image_data">
								<br>
								Auto-adjust last layer's number of neurons (if Dense)? <input type="checkbox" value="1" id="auto_adjust_number_of_neurons" checked />
								<br>
								<div id="last_layer_shape_warning"></div>
								<button onclick="add_new_category();">Add new category</button>
								<div id="own_image_data_categories">
								</div>
								<div class="container" id="own_images_container">
								</div>
							</div>

							<div id="training_data_tab">
								<div id="percentage" class="reset_before_train_network"></div>
								<div id="photos" style="display: none; height: 400px; max-height: 400px; overflow-y: auto" class="reset_before_train_network"><br>Click 'Start training' to start downloading the training data and then train on them.</div>
								<div id="xy_display_data" style="display: none; height: 400px; max-height: 400px; overflow-y: auto" class="reset_before_train_network"><br>Click 'Start training' to start downloading the training data and then train on them.</div>
								<div class="container" id="download_data" style="display: none"></div>
							</div>

							<div id="code_tab">
								<ul>
									<li><a href="#python_tab" id="python_tab_label">Python</a></li>
									<li><a href="#node_tab" id="node_tab_label">NodeJS</a></li>
									<li><a href="#html_tab" id="html_tab_label">HTML</a></li>
								</ul>

								<div id="node_tab">
									<pre><code class="language-javascript" id="node" style="width: 99%"></code></pre>
									<button onclick="copy_id_to_clipboard('node')">Copy to clipboard</button>
								</div>

								<div id="html_tab">
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
									<li style="display: none"><a href="#visual_help_tab" id="visual_help_tab_label" style="display: none">Visual Help</a></li>
									<li style="display: none"><a href="#layer_visualizations_tab" id="layer_visualizations_tab_label" style="display: none">Layer Visualizations</a></li>
									<li style="display: none"><a href="#activation_plot_tab" id="activation_plot_tab_label" style="display: none">Activation function</a></li>
									<li style="display: none"><a href="#help_tab" id="help_tab_label" style="display: none">Help</a></li>
								</ul>

								<div id="alexnet_tab">
									<div id="alexnet"></div>
									<!-- <button id="download_alexnet" onclick="download_visualization('alexnet')">Download AlexNet SVG (but without dimension labels)</button> -->
								</div>

								<div id="lenet_tab">
									<div id="lenet"></div>
									<button onclick='reset_view()'>Reset view</button>
									<button id="download_lenet" onclick="download_visualization('lenet')">Download LeNet SVG</button>
								</div>

								<div id="layer_visualizations_tab" "display: none">
								</div>

								<div id="fcnn_tab">
									<div id="fcnn"></div>
									<button onclick='reset_view()'>Reset view</button>
									<button id="download_fcnn" onclick="download_visualization('fcnn')">Download FCNN SVG</button>
								</div>

								<div id="activation_plot_tab">
									<span id="activation_plot_name" style="display: none"></span>
									<div id="activation_plot" style="display: none"></div>
								</div>

								<div id="maximally_activated" class="maximally_activated_class">
								</div>

								<div id="visual_help_tab">
								</div>

								<?php
									$bgcolor = "fff";
									$textcolor = "000";
									if($darkmode) {
										$bgcolor = "363636";
										$textcolor = "fff";
									}
								?>
								<div id="math_tab" style="overflow: scroll; width: 99%; max-height: 100%; background-color: #<?php print $bgcolor; ?>; color: <?php $textcolor; ?>;">
								</div>

								<!--
								<div id="conv_explanations" style="width: 99%; max-height: 100%; background-color: #ffffff">
									Blue maps are inputs, and cyan maps are outputs<br>

									<center>
										<h4>No padding, no strides:</h4>
										<img width=244 src="conv_animations/no_padding_no_strides.gif"><br>
										<h4>Arbitrary padding, no strides:</h4>
										<img width=244 src="conv_animations/arbitrary_padding_no_strides.gif"><br>
										<h4>Half padding, no strides:</h4>
										<img width=244 src="conv_animations/same_padding_no_strides.gif"><br>
										<h4>Full padding, no strides:</h4>
										<img width=244 src="conv_animations/full_padding_no_strides.gif"><br>
										<h4>No padding, strides:</h4>
										<img width=244 src="conv_animations/no_padding_strides.gif"><br>
										<h4>Padding, strides:</h4>
										<img width=244 src="conv_animations/padding_strides.gif"><br>
										<h4>Padding, strides (odd):</h4>
										<img width=244 src="conv_animations/padding_strides_odd.gif"><br>

										<h2>Transposed convolution animations</h2><br>
										<h4>No padding, no strides, transposed:</h4>
										<img width=244 src="conv_animations/no_padding_no_strides_transposed.gif"><br>
										<h4>Arbitrary padding, no strides, transposed:</h4>
										<img width=244 src="conv_animations/arbitrary_padding_no_strides_transposed.gif"><br>
										<h4>Half padding, no strides, transposed:</h4>
										<img width=244 src="conv_animations/same_padding_no_strides_transposed.gif"><br>
										<h4>Full padding, no strides, transposed:</h4>
										<img width=244 src="conv_animations/full_padding_no_strides_transposed.gif"><br>
										<h4>No padding, strides, transposed:</h4>
										<img width=244 src="conv_animations/no_padding_strides_transposed.gif"><br>
										<h4>Padding, strides, transposed:</h4>
										<img width=244 src="conv_animations/padding_strides_transposed.gif"><br>
										<h4>Padding, strides, transposed (odd):</h4>
										<img width=244 src="conv_animations/padding_strides_odd_transposed.gif"><br>
										<h2>Dilated convolution animations:</h2><br>
										<img width=244 src="conv_animations/dilation.gif"><br>
										<h4>No padding, no stride, dilation:</h4>

										<h2>Pooling</h2><br>
										<h4>MaxPooling, Kernel-Size 3x3:</h4>
										<img width=600 src="conv_animations/numerical_max_pooling.gif"><br>
										<h4>AveragePooling, Kernel-Size 3x3:</h4>
										<img width=600 src="conv_animations/numerical_average_pooling.gif"><br>
									</center>

									These graphics are from <a href="https://github.com/vdumoulin/conv_arithmetic">Convolution arithmetic</a> by
									<a href="https://github.com/vdumoulin">vdumoulin</a>.
								</div>
								-->

								<div id="help_tab">
								</div>
							</div>

							<div id="tfvis_tab" style="float: right; width: 100%">
								<ul>

									<li id="tfvis_tab_training_performance_label" class="training_performance_tabs" style="display:none" id="training_performance_tab_label"><a href="#tfvis_tab_training_performance">Training performance</a></li>
									<li style="display: none" class="show_after_training"><a href="#history_tab">History</a></li>
								</ul>


								<div id="tfvis_tab_training_performance">
									<div id="tfvis_tab_training_performance_graph"></div>
									<div id="tfvis_tab_history_graphs"></div>
								</div>
								<div id="history_tab">
									<div class="reset_before_train_network" id="history"></div>
									<div class="reset_before_train_network" id="memory"></div>
								</div>
							</div>

							<div id="summary_tab">
								<div class="right reset_before_train_network" id="summary"></div>
							</div>

							<div id="predict_tab">
								<div class="container" id="predictcontainer">
									<div class="right">
										<div id="own_files">
											<h2>Own files</h2>

											<button id="show_webcam_button" onclick="show_webcam();">Show webcam</button><br>

											<div id="webcam" style="display: none">
											</div>

											<pre id="webcam_prediction" style="display: none; overflow: scroll;"></pre>

											<br>
											
											<div id="upload_file" style="display: none"><input type="file" accept="image/*" onchange="loadFile(event)"></div>
											<div id="predict_own"><textarea id="predict_own_data" style="width: 100%; height: 200px"></textarea><br><button onclick="predict($('#predict_own_data').val())">Predict</button></div>
											<img id="output"/><br><br>
											<pre id="prediction" style="display: none"></pre>
											<div id="predict_error" style="overflow: scroll; display: none"></div>

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

		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>main.js"></script>
		<script>
			var local_store = window.localStorage;
			local_store.clear();

			function get_mode() {
				var backend = $("#mode_chooser > input[type=radio]:checked").val();

				return backend;
			}

			function get_backend() {
				var backend = $("#backend_chooser > input[type=radio]:checked").val();

				return backend;
			}

			function set_mode () {
				mode = get_mode();
				if(mode == "amateur") {
					throw_compile_exception = false;
					$(".layer_type").children().children().each(function (t, l) {
						if(!$(l).is(":checked")) {
							$(l).attr("disabled", true);
						}
					});
				} else {
					throw_compile_exception = true;
				}
			}

			function set_backend() {
				var backend = get_backend();
				tf.setBackend(backend);
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
			async function restart_fcnn() {
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

				if(architecture.length + real_architecture.length) {
					fcnn.redraw({'architecture_': architecture, 'real_architecture_': real_architecture, 'layerTypes_': layer_types, 'currentLayer_': currentLayer});
					fcnn.redistribute({'betweenNodesInLayer_': betweenNodesInLayer});
				}
				reset_view();
			}

			var alexnet = AlexNet();
                        async function restart_alexnet(dont_click) {
				seed = 1;
				var architecture = [];
				var architecture2 = [];

				for (var i = 0; i < get_numberoflayers(); i++) {
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
								this_layer_arch["depth"] = input_layer_shape[3];
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

				var disable_alexnet = 0;
				try {
					if(architecture.length && architecture2.length) {
						try {
							if(show_input_layer) {
								var shown_input_layer = {};
								var input_shape = get_input_shape();
								shown_input_layer["height"] = input_shape[0];
								shown_input_layer["width"] = input_shape[1];
								shown_input_layer["depth"] = input_shape[2];
								shown_input_layer["filterWidth"] = 1;
								shown_input_layer["filterHeight"] = 1;
								shown_input_layer["rel_x"] = random(-0.1,0.1);
								shown_input_layer["rel_y"] = random(-0.1,0.1);

								architecture.unshift(shown_input_layer);
							}

							alexnet.restartRenderer(1);
							alexnet.redraw({'architecture_': architecture, 'architecture2_': architecture2});
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

				if(disable_alexnet) {
					$("#alexnet_tab_label").parent().hide();
					if(!dont_click) {
						if(clicked_on_tab == 0) { $('a[href="#fcnn_tab"]').click(); clicked_on_tab = 1; }
					}
				} else {
					$("#alexnet_tab_label").parent().show();
					if(!dont_click) {
						if(clicked_on_tab == 0) { $('#alexnet_tab_label').click(); clicked_on_tab = 1; }
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
								var output_size_this_layer = output_size_at_layer(get_input_shape(), i);
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
							lenet.redraw({'architecture_': architecture, 'architecture2_': architecture2});
							lenet.redistribute({'betweenLayers_': []});
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
					$("#lenet_tab_label").parent().hide();
					if(clicked_on_tab == 0) {
						if(!dont_click) {
							$('a[href="#fcnn_tab"]').click(); 
							clicked_on_tab = 1;
						}
					}
				} else {
					$("#lenet_tab_label").parent().show();
					if(clicked_on_tab == 0) {
						$('#lenet_tab_label').show();
						if(!dont_click) {
							$('#lenet_tab_label').click();
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

			$(window).resize(function() {
				write_descriptions();
			});

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
						var html = '<img height=90 src="' + e.target.result + '">';
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

		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>prism/prism.js"></script>
		<script src="<?php print $minify ? "minify.php?file=" : ""; ?>prism/prism-python.min.js"></script>
	</body>
</html>
