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
		<div id="fcnn"><canvas style='width: 100%' id="new_fcnn_canvas" /></div>
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
