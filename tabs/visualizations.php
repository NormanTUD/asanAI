<div id="visualization_tab" class="tab">
	<ul class="navi_list">
		<li><a id="fcnn_tab_label" href="#fcnn_tab">FCNN</a></li>
		<li><a href="#lenet_tab" id="lenet_tab_label" style="display: none">LeNet</a></li>
		<li><a href="#math_tab" onclick="onclick_math_mode(this, event)" id="math_tab_label"><span class="TRANSLATEME_math"></span></a></li>
		<li style="display: none"><a href="#maximally_activated" id="maximally_activated_label" style="display: none">Maximally activated</a></li>
		<li style="display: none"><a href="#activation_plot_tab" id="activation_plot_tab_label" style="display: none">Activation function</a></li>
	</ul>

	<div id="lenet_tab" class="tab">
		<div id="lenet"></div>
		<button class="vis_button" onclick='reset_view()'><span class="TRANSLATEME_reset_view"></span></button>
		<button class="vis_button" id="download_lenet" onclick="download_visualization('lenet')">Download LeNet SVG</button>
	</div>

	<div id="fcnn_tab" class="tab">
		<div id="fcnn"><canvas style='width: 100%' id="fcnn_canvas" /></div>
	</div>

	<div id="activation_plot_tab" class="tab">
		<span id="activation_plot_name" style="display: none"></span>
		<div id="activation_plot" style="display: none"></div>
	</div>

	<div id="maximally_activated" class="tab maximally_activated_class">
		<button id="stop_generating_images_button" style="display: none" onclick="stop_generating_images=1"><span class="TRANSLATEME_stop_generating_images"></span></button>
		<div>
			<span class="temml_me">x = </span> <span class="TRANSLATEME_input_image"></span><br>
			<span class="temml_me">x* = </span> <span class="TRANSLATEME_generated_image"></span><br>
			<span class="temml_me">W = </span> <span class="TRANSLATEME_weights"></span><br>
			<span class="temml_me">b = </span> <span class="TRANSLATEME_bias"></span><br>
			<span class="temml_me">f(\textbf{x}; \textbf{W}, b) = </span> <span class="TRANSLATEME_activation_function_of_neuron"><br>
			<span class="temml_me">\textbf{x}* = \mathrm{argmax}_xf(\textbf{x}; \textbf{W}, b)</span> <br>
		</div>
		<span class="TRANSLATEME_maximally_activated_explanation"></span>
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
