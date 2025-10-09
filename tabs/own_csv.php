<div id="own_csv_tab" class="tab">
	<br>
	<table class="table_border_1px">
		<tr>
			<td class="custom_csv_table_td">
				<table id="custom_csv_settings_table">
					<tr>
						<td><span class='TRANSLATEME_auto_adjust_last_layer_neurons'></span></td>
						<td><input type="checkbox" value="1" onchange="show_csv_file(1)" id="csv_auto_adjust_number_of_neurons" checked></td>
					</tr>
					<tr>
						<td><span class="TRANSLATEME_auto_set_last_layer_to_linear"></span></td>
						<td><input type="checkbox" value="1" onchange="show_csv_file(1)" id="auto_set_last_layer_activation" checked></td>
					</tr>
					<tr>
						<td><span class="TRANSLATEME_shuffle_data_before_validation_split"></span></td>
						<td><input type="checkbox" value="1" onchange="show_csv_file(1)" id="shuffle_data" checked></td>
					</tr>
					<tr>
						<td><span class='TRANSLATEME_auto_one_hot_encoding'></span></td>
						<td><input type="checkbox" value="1" onchange="show_csv_file(1)" id="auto_one_hot_y"></td>
					</tr>
					<tr>
						<td><span class="TRANSLATEME_auto_loss_metric"></span></td>
						<td><input type="checkbox" value="1" id="auto_loss_metric" checked></td>
					</tr>
					<tr>
						<td><span class="TRANSLATEME_separator"></span></td>
						<td><input onkeyup="show_csv_file()" type="text" value="," style="width: 30px" id="seperator"></td>
					</tr>
					<tr>
						<td colspan="2"><button onclick='load_shoe_example()'><span class="TRANSLATEME_example_csv_shoe_size"></span></button></td>
					</tr>
					<tr class="expert_mode_only">
						<td>
							<span class="TRANSLATEME_start"></span>
						</td>
						<td>
							<input type="number" id="csv_custom_start" value="-10" placeholder="Start" />
						</td>
					</tr>
					<tr class="expert_mode_only">
						<td>
							<span class="TRANSLATEME_end"></span>
						</td>
						<td>
							<input type="number" id="csv_custom_end" value="10" placeholder="End" />
						</td>
					</tr>
					<tr class="expert_mode_only">
						<td>
							<span class="TRANSLATEME_stepsize"></span>
						</td>
						<td>
							<input type="number" id="csv_custom_stepsize" value="1" placeholder="Stepsize" />
						</td>
					</tr>
					<tr class="expert_mode_only">
						<td>
							<span class="TRANSLATEME_function_with_explanation"></span>
						</td>
						<td>
							<input type="text" id="csv_custom_fn" value="2*(x + 1)" placeholder="Function (only x and y variables allowed)" />
						</td>
					</tr>
					<tr class="expert_mode_only">
						<td colspan=2>
							<button onclick='load_csv_custom_function()'><span class="TRANSLATEME_load_custom_function_csv"></span></button>
						</td>
					</tr>
					<tr class="expert_mode_only">
						<td colspan=2>
							<div id="custom_function_error"></div>
						</td>
					</tr>
				</table>

				<br>
				<br>

				<span id="csv_parse_errors"></span>
				<textarea id="csv_file" style="width: 98%; height: 300px" spellcheck="false" onkeyup="show_csv_file()"></textarea>
			</td>
			<td class="hide_when_no_csv custom_csv_table_td" style="display: none">
				<div id="csv_header_overview"></div>
			</td>
			<td class="hide_when_no_csv custom_csv_table_td" style="display: none">
				<div id="x_y_shape_preview"></div>
			</td>
		</tr>
	</table>
</div>
