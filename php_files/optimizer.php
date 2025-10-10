<?php
	$all_optimizers = array(
		"adam" => array(
			"learning_rate" => array("default" => 0.001, "step" => 0.000001),
			"beta1"         => array("default" => 0.9,   "step" => 0.000001),
			"beta2"         => array("default" => 0.999, "step" => 0.000001),
			"epsilon"       => array("default" => 0.0001, "step" => 0.000001),
		),
		"adadelta" => array(
			"learning_rate" => array("default" => 0.001, "step" => 0.000001),
			"rho"           => array("default" => 0.95,  "step" => 0.000001),
			"epsilon"       => array("default" => 0.0001, "step" => 0.000001),
		),
		"adagrad" => array(
			"learning_rate"             => array("default" => 0.01, "step" => 0.000001),
			"epsilon"                   => array("default" => 0.0001, "step" => 0.000001),
			"initial_accumulator_value" => array("default" => 0.1, "step" => 0.000001),
		),
		"adamax" => array(
			"learning_rate" => array("default" => 0.002, "step" => 0.000001),
			"beta1"         => array("default" => 0.9,   "step" => 0.000001),
			"beta2"         => array("default" => 0.999, "step" => 0.000001),
			"epsilon"       => array("default" => 0.0001, "step" => 0.000001),
			"decay"         => array("default" => 0,     "step" => 0.000001),
		),
		"rmsprop" => array(
			"learning_rate" => array("default" => 0.01,  "min" => 0, "max" => 1, "step" => 0.00000000001),
			"decay"         => array("default" => 0.9,   "min" => 0, "max" => 1, "step" => 0.000001),
			"rho"           => array("default" => 0.95,  "step" => 0.000001),
			"momentum"      => array("default" => 0,     "min" => 0, "max" => 1, "step" => 0.01),
			"epsilon"       => array("default" => 0.0001, "step" => 0.000001),
		),
		"sgd" => array(
			"learning_rate" => array("default" => 0.01, "step" => 0.000001),
			"momentum"      => array("default" => 0.9, "min" => 0, "max" => 1, "step" => 0.01),
		),
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
	<?php
		function render_optimizer_metadata(array $optimizers): string {
			$html = '';
			foreach ($optimizers as $optimizer => $params) {
				$html .= "<div class=\"optimizer_metadata\" style=\"display: none;\" id=\"{$optimizer}_metadata\">\n";
				$html .= "\t<table>\n";

				$rows = build_table_rows($optimizer, $params);
				foreach ($rows as $row) {
					$html .= "\t\t<tr>\n";
					foreach ($row as $cell) {
						$html .= "\t\t\t{$cell}\n";
					}
					$html .= "\t\t</tr>\n";
				}

				$html .= "\t</table>\n";
				$html .= "</div>\n\n";
			}
			return $html;
		}

		function build_table_rows(string $optimizer, array $params): array {
			$rows = [];
			$cells = [];

			$i = 0;
			foreach ($params as $param => $meta) {
				$label_class = "TRANSLATEME_" . $param;
				if (in_array($param, ['beta1','beta2','epsilon','rho'])) {
					$label_class .= " force_small_letters";
				}

				$input_id = camelize($param) . "_{$optimizer}";
				$input_attrs = build_input_attrs($meta, $meta['default'], $input_id);

				$cells[] = "<td class=\"$label_class\"></td>";
				$cells[] = "<td>{$input_attrs}</td>";

				// pack two param-pairs per row → ähnlich wie in deinem HTML
				if (++$i % 2 === 0) {
					$rows[] = $cells;
					$cells = [];
				}
			}

			if (!empty($cells)) {
				// fill empty cells so visual spacing matches
				while (count($cells) < 4) {
					$cells[] = "<td></td>";
				}
				$rows[] = $cells;
			}

			return $rows;
		}

		function build_input_attrs(array $meta, $value, string $id): string {
			$attrs = [
				'class' => 'optimizer_metadata_input',
				'type' => 'number',
				'value' => $value,
				'id'    => $id,
			];
			foreach (['min','max','step'] as $k) {
				if (isset($meta[$k])) {
					$attrs[$k] = $meta[$k];
				}
			}
			$parts = [];
			foreach ($attrs as $k => $v) {
				$parts[] = $k.'="'.htmlspecialchars((string)$v).'"';
			}
			return "<input " . implode(' ', $parts) . ">";
		}

		function camelize(string $param): string {
			return lcfirst(str_replace(' ', '', ucwords(str_replace('_',' ', $param))));
		}

		echo render_optimizer_metadata($all_optimizers);
	?>
	</div>
</div>
