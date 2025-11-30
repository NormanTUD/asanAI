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
	}

	if(model?.input?.shape[1] != 1) {
		info("Input shape must have exactly one element");
	}

	if(!wanted) {
		info("wanted is empty");
		return null;
	}

	if(!input) {
		info("input is empty");
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

	const bias = original_bias[1];

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

	const min_weight = weight - weight_distance;
	const max_weight = weight + weight_distance;
	const min_bias = bias - bias_distance;
	const max_bias = bias + bias_distance;

	dbg(`Weight range: ${min_weight} to ${max_weight}`);
	dbg(`Bias range:   ${min_bias} to ${max_bias}`);

	const weight_stepsize = Math.abs(min_weight - max_weight) / steps;
	const bias_stepsize = Math.abs(min_bias - max_bias) / steps;
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
