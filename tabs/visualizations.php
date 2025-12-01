<div id="visualization_tab" class="tab">
	<ul class="navi_list">
		<li><a id="fcnn_tab_label" href="#fcnn_tab"><span class="TRANSLATEME_network_visualization"></span></a></li>
		<li><a href="#math_tab" onclick="onclick_math_mode(this, event)" id="math_tab_label"><span class="TRANSLATEME_math"></span></a></li>
		<li style="display: none"><a href="#maximally_activated" id="maximally_activated_label" style="display: none">Maximally activated</a></li>
		<li style="display: none"><a href="#activation_plot_tab" id="activation_plot_tab_label" style="display: none">Activation function</a></li>
		<li><a href="#weight_surfaces" onclick="create_weight_surfaces(true)" id="weight_surfaces_tab_label"><span class="TRANSLATEME_weightsurfaces"></span></a></li>
		<li><a href="#loss_landscape_tab" id="loss_landscape_tab_label"><span class="TRANSLATEME_loss_landscape"></span></a></li>
		<li style="display: none"><a href="#layer_input_groups" id="layer_input_groups_label"><span class="TRANSLATEME_layer_input_groups"></span></a></li>
	</ul>

	<div id="fcnn_tab" class="tab">
		<div id="fcnn"><canvas style='width: 100%' id="fcnn_canvas" /></div>
	</div>

	<div id="activation_plot_tab" class="tab">
		<span id="activation_plot_name" style="display: none"></span>
		<div id="activation_plot" style="display: none"></div>
	</div>

	<div id="maximally_activated" class="tab maximally_activated_class">
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
				<td class="TRANSLATEME_no_decimal_points_math_mode"></td>
				<td><input class="show_data" type="number" style="width: 50px" value="8" min="0" max="16" onchange="write_model_to_latex_to_page(1)" id="decimal_points_math_mode"></td>
			</tr>
			<tr>
				<td class="TRANSLATEME_max_nr_vals"></td>
				<td><input class="show_data" type="number" style="width: 50px" value="32" value=32 min="2" max="1024" onchange="write_model_to_latex_to_page(1)" id="max_nr_vals"></td>
			</tr>
			<tr>
				<td><span class="TRANSLATEME_save_math_history"></span>?</td>
				<td><input type='checkbox' id="save_math_history"></td>
			</tr>
		</table>
		<div class="typeset_me" id="math_history_slider"></div>
		<div class="typeset_me" id="math_tab_code"></div>
	</div>

	<div id="weight_surfaces" class="tab" class="tab">
		<div id="weight_surfaces_content"></div>
	</div>

	<div id="loss_landscape_tab" class="tab" class="tab">
			<table>
				<tbody>

					<tr>
						<td>
							<span class="TRANSLATEME_steps"></span>
						</td>
						<td>
							<input
								class="show_data"
								type="number"
								id="loss_landscape_steps"
								value="10"
								min="2"
								max="1000"
								style="width: 80px; background-color: rgb(60, 60, 60);"
							>
						</td>
					</tr>

					<tr>
						<td>
							<span class="TRANSLATEME_mult"></span>
						</td>
						<td>
							<input
								class="show_data"
								type="number"
								id="loss_landscape_mult"
								value="50"
								min="1"
								max="1000"
								style="width: 80px; background-color: rgb(60, 60, 60);"
							>
						</td>
					</tr>

					<tr>
						<td>
							<span class="TRANSLATEME_loss_landscape_method"></span>
						</td>
						<td>
							<select
								class="show_data"
								id="loss_landscape_method"
							>
								<option value="loss_aware_pca">loss_aware_pca</option>
								<option value="random_directions">random_directions</option>
								<option value="standard_basis">standard_basis</option>
								<option value="filter_normalized_random">filter_normalized_random</option>
								<option value="sharpness_aware_proxy">sharpness_aware_proxy</option>
							</select>
						</td>
					</tr>

					<tr>
						<td colspan="2" style="text-align: right; padding-top: 6px;">
							<button
								type="button"
								style="background-color: rgb(80,80,80); padding: 4px 10px; cursor: pointer;"
								onclick="run_loss_landscape_from_ui();"
							>
								<span class="TRANSLATEME_plot_loss_landscape"></span>
							</button>
						</td>
					</tr>

				</tbody>
			</table>
		</div>


		<div id="loss_landscape"></div>
	</div>

	<div id="layer_input_groups" class="tab" class="tab">
	</div>
</div>
