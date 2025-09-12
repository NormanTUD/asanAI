<?php
	$all_optimizers = array(
		"adam" => array(),
		"adadelta" => array(),
		"adagrad" => array(),
		"adamax" => array(),
		"rmsprop" => array(),
		"sgd" => array(),
	);
?>
<div class="ribbon-toolbar">
	<table>
		<tr>
			<td><span class="TRANSLATEME_optimizer"></span></td>
			<td>
				<select id="optimizer" onchange='change_optimizer()' style="width: 100px">
					<?php foreach ($all_optimizers as $name => $params): ?>
					<option value="<?php echo htmlspecialchars($name); ?>"><?php echo htmlspecialchars($name); ?></option>
					<?php endforeach; ?>
				</select>
			</td>
		</tr>
	</table>

	<br>

	<div id="optimizer_table">
		<div class="optimizer_metadata" style="display: none;" id="sgd_metadata">
			<table>
				<tr>
					<td><span class='TRANSLATEME_learning_rate' /></td>
					<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.01" id="learningRate_sgd"></td>

					<td class="TRANSLATEME_momentum"></td>
					<td><input class="optimizer_metadata_input" type="number" min="0" max="1" step="0.01" value="0.9" id="momentum_sgd"></td>
				</tr>
			</table>
		</div>

		<div class="optimizer_metadata" style="display: none;" id="adagrad_metadata">
			<table>
				<tr>
					<td><span class='TRANSLATEME_learning_rate' /></td>
					<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.01" id="learningRate_adagrad"></td>

					<td rowspan=2 class="TRANSLATEME_epsilon force_small_letters"></td>
					<td rowspan=2><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.0001" id="epsilon_adagrad"></td>
				<tr>
				</tr>
					<td class="TRANSLATEME_initial_accumulator_value"></td>
					<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.1" id="initialAccumulatorValue_adagrad"></td>
				</tr>
			</table>
		</div>

		<div class="optimizer_metadata" style="display: none;" id="adam_metadata">
			<table>
				<tr>
					<td><span class='TRANSLATEME_learning_rate' /></td>
					<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.001" id="learningRate_adam"></td>

					<td class="TRANSLATEME_beta1 force_small_letters"></td>
					<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.9" id="beta1_adam"></td>
				</tr>

				<tr>
					<td class="TRANSLATEME_beta2 force_small_letters"></td>
					<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.999" id="beta2_adam"></td>

					<td class="TRANSLATEME_epsilon force_small_letters"></td>
					<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.0001" id="epsilon_adam"></td>
				</tr>
			</table>
		</div>

		<div class="optimizer_metadata" style="display: none;" id="adadelta_metadata">
			<table>
				<tr>
					<td><span class='TRANSLATEME_learning_rate' /></td>
					<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.001" id="learningRate_adadelta"></td>

					<td class="TRANSLATEME_rho force_small_letters"></td>
					<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.95" id="rho_adadelta"></td>
				</tr>

				<tr>

					<td class="TRANSLATEME_epsilon force_small_letters"></td>
					<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.0001" id="epsilon_adadelta"></td>
					<td></td>
					<td></td>
				</tr>
			</table>
		</div>

		<div class="optimizer_metadata" style="display: none;" id="adamax_metadata">
			<table>
				<tr>
					<td><span class='TRANSLATEME_learning_rate' /></td>
					<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.002" id="learningRate_adamax"></td>

					<td class="TRANSLATEME_beta1 force_small_letters"></td>
					<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.9" id="beta1_adamax"></td>

					<td class="TRANSLATEME_epsilon force_small_letters"></td>
					<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.0001" id="epsilon_adamax"></td>
				</tr>
				<tr>

					<td class="TRANSLATEME_beta2 force_small_letters"></td>
					<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.999" id="beta2_adamax"></td>

					<td class="TRANSLATEME_decay"></td>
					<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0" id="decay_adamax"></td>
					<td></td>
					<td></td>
				</tr>
			</table>
		</div>

		<div class="optimizer_metadata" style="display: none;" id="rmsprop_metadata">
			<table>
				<tr>
					<td><span class='TRANSLATEME_learning_rate' /></td>
					<td><input class="optimizer_metadata_input" type="number" min="0" max="1" step="0.00000000001" value="0.01" id="learningRate_rmsprop"></td>

					<td class="TRANSLATEME_decay"></td>
					<td><input class="optimizer_metadata_input" type="number" min="0" max="1" step="0.000001" value="0.9" id="decay_rmsprop"></td>

					<td rowspan=2 class="TRANSLATEME_rho force_small_letters"></td>
					<td rowspan=2><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.95" id="rho_rmsprop"></td>
				</tr>
				<tr>
					<td class="TRANSLATEME_momentum"></td>
					<td><input class="optimizer_metadata_input" type="number" min="0" max="1" step="0.01" value="0" id="momentum_rmsprop"></td>

					<td class="TRANSLATEME_epsilon force_small_letters"></td>
					<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.0001" id="epsilon_rmsprop"></td>
				</tr>
			</table>
		</div>

		<div class="optimizer_metadata" style="display: none;" id="momentum_metadata">
			<table>
				<tr>
					<td><span class='TRANSLATEME_learning_rate' /></td>
					<td><input class="optimizer_metadata_input" type="number" step="0.000001" value="0.01" id="learningRate_momentum"></td>

					<td class="TRANSLATEME_momentum"></td>
					<td><input class="optimizer_metadata_input" type="number" min="0" max="1" step="0.01" value="0.9" id="momentum_momentum"></td>
				</tr>
			</table>
		</div>
	</div>
</div>
