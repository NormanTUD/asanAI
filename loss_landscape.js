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

	return array_sync_if_tensor(loss);
}
