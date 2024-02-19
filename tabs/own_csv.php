<div id="own_csv_tab" class="tab">
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
						<td><input type="checkbox" value="1" onchange="show_csv_file(1)" id="auto_one_hot_y"></td>
					</tr>
					<tr>
						<td>Auto loss/metric?</td>
						<td><input type="checkbox" value="1" id="auto_loss_metric" checked></td>
					</tr>
					<tr>
						<td>Separator</td>
						<td><input onkeyup="show_csv_file()" type="text" value="," style="width: 30px" id="seperator"></td>
					</tr>
					<tr>
						<td colspan="2"><button onclick='load_shoe_example()'><span class="TRANSLATEME_example_csv_shoe_size"></span></button></td>
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
