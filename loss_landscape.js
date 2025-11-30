"use strict";

function get_loss_from_data(m, input, wanted) {
	if(!Object.keys(m).includes("layers")) {
		throw new Error("Failed: model m does not include layers");
	}

	if(model?.layers?.length == 0) {
		throw new Error("Failed: model m does has no layers");
	}

	if(!is_tensor(input)) {
		throw new Error("Failed: input is not a tensor");
	}

	if(!is_tensor(wanted)) {
		throw new Error("Failed: wanted is not a tensor");
	}

	const selected_loss = $("#loss").val();

	if(!Object.keys(tf.metrics).includes(selected_loss)) {
		throw new Error(`Failed: ${selected_loss} not in tf.metrics`);
	}

	const loss_fn = tf.metrics[selected_loss];

	const got = model.predict(input);

	const loss = loss_fn(wanted, got);

	return array_sync_if_tensor(loss)[0];
}

function get_loss_landscape_plot_data(m, input, wanted, steps) {
	if(!m) {
		info("Model is empty")
		return null;
	}

	if (!Object.keys(m).includes("layers")) {
		info("Model has no layers")
		return null;
	}

	if(m.layers.length != 1) {
		info("Can currently only plot one layer");
		return null;
	}

	if(!model?.layers[0]?.weights?.length == 2) {
		info("First and only layer must have 2 weights (weight/bias)")
		return null;
	}

	if(model?.input?.shape?.length != 2) {
		info("Input shape must be 2 elements wide, first one being batch");
		return null;
	}

	if(model?.input?.shape[1] != 1) {
		info("Input shape must have exactly one element");
		return null;
	}

	if(!wanted) {
		info("wanted is empty");
		return null;
	}

	if(!input) {
		info("input is empty");
		return null;
	}

	if(steps <= 1) {
		info("steps must be larger than 1");
		return null;
	}

	if(!steps < 0) {
		info("steps is smaller than 0");
		return null;
	}

	if(!steps) {
		info("steps is empty or 0");
		return null;
	}

	dbg("Getting original weights");

	const original_weights = array_sync_if_tensor(model.layers[0].weights[0].val);
	if(get_shape_from_array_or_tensor(original_weights).length != 2) {
		info("Can only plot weight shape of length 2");
		return null;
	}

	if(get_shape_from_array_or_tensor(original_weights)[0] != 1 && get_shape_from_array_or_tensor(original_weights)[1] != 1) {
		info("Can only plot weight when bias and weight each have shape [1]");
		return null;
	}

	dbg("Getting original weight");
	const weight = original_weights[0];

	if(weight === undefined) {
		err(`Could not get weight, original_bias: ${original_weights}`);
		return null;
	}

	dbg("Getting original bias");
	const original_bias = array_sync_if_tensor(model.layers[0].weights[1].val);
	if(get_shape_from_array_or_tensor(original_bias).length != 1) {
		info("Can only plot bias shape of length 1");
		return null;
	}

	const bias = original_bias;

	if(bias === undefined) {
		err(`Could not get bias, original_bias: ${original_bias}`);
		return null;
	}

	dbg(`Initial weight: ${weight}`);
	dbg(`Initial bias: ${bias}`);

	const weight_distance = weight == 0 ? 1 : weight;
	const bias_distance = bias == 0 ? 1 : bias;
	dbg(`Weight distance: ${weight_distance}`);
	dbg(`Bias distance: ${bias_distance}`);

	const min_weight = parse_float(weight) - parse_float(weight_distance);
	const max_weight = parse_float(weight) + parse_float(weight_distance);
	const min_bias = parse_float(bias) - parse_float(bias_distance);
	const max_bias = parse_float(bias) + parse_float(bias_distance);

	dbg(`Weight range: ${min_weight} to ${max_weight}`);
	dbg(`Bias range:   ${min_bias} to ${max_bias}`);

	const weight_stepsize = Math.abs(min_weight - max_weight) / (steps - 1);
	const bias_stepsize = Math.abs(min_bias - max_bias) / (steps - 1);

	dbg(`Weight stepsize: ${weight_stepsize}`);
	dbg(`Bias stepsize:   ${bias_stepsize}`);

	var x = [];
	var y = [];
	var z = [];

	dbg("Entering nested loop");

	for (var step_bias = 0; step_bias < steps; step_bias++) {
		dbg(`Bias loop step ${step_bias}/${steps}`);
		for (var step_weight = 0; step_weight < steps; step_weight++) {
			dbg(`  Weight loop step ${step_weight}/${steps}`);

			const this_weight = min_weight + (step_weight * weight_stepsize);
			const this_bias = min_bias + (step_bias * bias_stepsize);
			dbg(`  Testing weight=${this_weight}, bias=${this_bias}`);

			m.layers[0].setWeights([
				tf.tensor2d([[this_weight]], [1, 1]),
				tf.tensor1d([this_bias])
			]);

			dbg("  Weights set on model, computing loss...");

			const this_loss = get_loss_from_data(m, input, wanted);

			dbg(`  Loss computed: ${this_loss}`);

			x.push(this_weight);
			y.push(this_bias);
			z.push(this_loss);
		}
	}

	dbg("Finished computing grid");
	dbg(`Collected ${x.length} samples`);

	return [x, y, z];
}

function plot_loss_landscape_surface(data, div_id) {
	if (!data || data.length !== 3) return;
	const [x_flat, y_flat, z_flat] = data;

	const n = Math.sqrt(x_flat.length);
	if (!Number.isInteger(n)) return;

	const x = [];
	const y = [];
	const z = [];

	for (let i = 0; i < n; i++) {
		const row_x = [];
		const row_y = [];
		const row_z = [];
		for (let j = 0; j < n; j++) {
			const idx = i * n + j;
			row_x.push(x_flat[idx]);
			row_y.push(y_flat[idx]);
			row_z.push(z_flat[idx]);
		}
		x.push(row_x);
		y.push(row_y);
		z.push(row_z);
	}

	let container = null;

	if (div_id) {
		container = document.getElementById(div_id);
	}

	if (!container) {
		container = document.createElement("div");
		container.style.width = "600px";
		container.style.height = "500px";
		document.body.appendChild(container);
	}

	const trace = {
		x: x,
		y: y,
		z: z,
		type: "surface",
		colorscale: "Viridis"
	};

	Plotly.newPlot(container, [trace], {
		scene: {
			xaxis: { title: { text: "Weight" } },
			yaxis: { title: { text: "Bias" } },
			zaxis: { title: { text: "Loss" } }
		},
		margin: { t: 0 }
	});
}

function plot_loss_landscape_from_model_and_data (m, input, wanted, steps) {
	const data = get_loss_landscape_plot_data(model, input, wanted, steps)

	if(data !== null) {
		plot_loss_landscape_surface(data);
	}
}

async function plot_loss_landscape_from_model(m, steps) {
	const xy = await get_x_and_y();

	const x = xy["x"];
	const y = xy["y"];

	plot_loss_landscape_from_model_and_data(m, x, y, steps);
}
