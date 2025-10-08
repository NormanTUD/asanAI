async function draw_maximally_activated_neuron (layer_idx, neuron) {
	var current_input_shape = get_input_shape();

	var canvasses = [];

	var original_disable_layer_debuggers = disable_layer_debuggers;
	disable_layer_debuggers = 1;

	try {
		var start_image = undefined;
		var iterations = parse_int($("#max_activation_iterations").val());
		if(!iterations) {
			log(`Iterations was set to ${iterations} in the GUI, using 30 instead`);
			iterations = 30;
		}

		var full_data = await input_gradient_ascent(layer_idx, neuron, iterations, start_image);

		disable_layer_debuggers = original_disable_layer_debuggers;

		if(full_data["worked"]) {
			if(Object.keys(full_data).includes("data")) {
				var _tensor = tensor(full_data["data"]);
				var t_str = _tensor_print_to_string(_tensor);
				log(language[lang]["maximally_activated_tensor"] + ":", t_str);
				$("#maximally_activated_content").prepend(`<input style='width: 100%' value='Maximally activated tensors for Layer ${layer_idx}, Neuron ${neuron}:' /><pre>${t_str}</pre>`);
				show_tab_label("maximally_activated_label", 1);
				await dispose(_tensor);
			} else if (Object.keys(full_data).includes("image")) {
				var data = full_data["image"][0];
				var to_class = "maximally_activated_class";
				var canvas = get_canvas_in_class(layer_idx, to_class, 0, 1);
				var _uuid = canvas.id;

				canvasses.push(canvas);

				var data_hash = {
					layer: layer_idx,
					neuron: neuron,
					model_hash: await get_model_config_hash()
				};

				scaleNestedArray(data);
				var res = draw_grid(canvas, 1, data, 1, 0, "predict_maximally_activated(this, 'image')", null, data_hash, "layer_image");

				if(res) {
					$("#maximally_activated_content").prepend(canvas);
					show_tab_label("maximally_activated_label", 1);
				} else {
					void(0); log("Res: ", res);
				}
			}
		}
	} catch (e) {
		await write_error(e, null, null);
		show_tab_label("visualization_tab", 1);
		show_tab_label("fcnn_tab_label", 1);
		return false;
	}

	await nextFrame();

	return canvasses;
}

async function draw_single_maximally_activated_neuron (layer_idx, neurons, is_recursive, type) {
	var canvasses = [];

	for (var neuron_idx = 0; neuron_idx < neurons; neuron_idx++) {
		$("#generate_images_msg_wrapper").hide();
		$("#generate_images_msg").html("");

		if(stop_generating_images) {
			info(language[lang]["stopped_generating_images_because_button_was_clicked"]);
			continue;
		}

		var currentURL = window.location.href;
		var urlParams = new URLSearchParams(window.location.search);

		var base_msg = `${language[lang]["generating_image_for_neuron"]} ${neuron_idx + 1} ${language[lang]["of"]} ${neurons}`;

		await draw_maximally_activated_neuron_with_retries(base_msg, layer_idx, neurons, neuron_idx, is_recursive, type, canvasses)
	}

	return canvasses;
}

async function draw_maximally_activated_neuron_with_retries (base_msg, layer_idx, neurons, neuron_idx, is_recursive, type, canvasses) {
	var tries_left = 3;
	try {
		l(base_msg);
		const canvas = await draw_maximally_activated_neuron(layer_idx, neurons - neuron_idx - 1);
		canvasses.push(canvas);
	} catch (e) {
		tries_left = await handle_draw_maximally_activated_neuron_multiple_times_error(e, is_recursive, tries_left, canvasses);
	}
}

async function handle_draw_maximally_activated_neuron_multiple_times_error(e, is_recursive, tries_left, canvasses) {
	currently_generating_images = false;

	if(("" + e).includes("already disposed") || ("" + e).includes("Tensor or TensorLike, but got 'null'")) {
		if(!is_recursive) {
			while (tries_left) {
				await delay(200);
				try {
					l(`${base_msg} ${language[lang]["failed_try_again"]}...`);
					canvasses.push(await draw_maximally_activated_layer(layer_idx, type, 1));
				} catch (e) {
					if(("" + e).includes("already disposed")) {
						err("" + e);
					} else {
						throw new Error(e);
					}
				}
				tries_left--;
			}
		} else {
			log(language[lang]["already_disposed_in_draw_maximally_activated_neuron_recursive_ignore"]);
		}
	} else {
		throw new Error(e);
	}

	return tries_left;
}

function _get_neurons_last_layer (layer_idx, type) {
	typeassert(layer_idx, int, "layer_idx");
	typeassert(type, string, "type");

	var neurons = 1;

	if(!Object.keys(model).includes("layers")) {
		wrn(language[lang]["cannot_get_model_layers"]);
		return false;
	}

	if(!Object.keys(model.layers).includes("" + layer_idx)) {
		wrn(`${language[lang]["cannot_get_model_layers"]}[${layer_idx}]`);
		return false;
	}

	if(type == "conv2d") {
		neurons = model.layers[layer_idx].filters;
	} else if (type == "dense") {
		neurons = model.layers[layer_idx].units;
	} else if (type == "flatten") {
		neurons = 1;
	} else {
		dbg(language[lang]["unknown_layer"] + " " + layer_idx);
		return false;
	}

	return neurons;
}

async function draw_maximally_activated_layer (layer_idx, type, is_recursive = 0) {
	show_tab_label("maximally_activated_label", 1);
	window.scrollTo(0,0);

	await nextFrame();

	$("body").css("cursor", "wait");

	await gui_in_training(0);

	await wait_for_images_to_be_generated();

	currently_generating_images = true;

	var neurons = _get_neurons_last_layer(layer_idx, type);

	if(typeof(neurons) == "boolean" && !neurons) {
		currently_generating_images = false;
		err(language[lang]["cannot_determine_number_of_neurons_in_last_layer"]);
		return;
	}

	favicon_spinner();

	show_stop_generating_button();
	
	var canvasses = await draw_single_maximally_activated_neuron(layer_idx, neurons, is_recursive, type);

	hide_stuff_after_generating_maximally_activated_neurons()

	add_header_to_maximally_activated_content(layer_idx);

	l(language[lang]["done_generating_images"]);

	stop_generating_images = false;

	favicon_default();

	set_document_title(original_title);

	await allow_editable_labels();

	reset_cursor();

	currently_generating_images = false;

	if(!(started_training || model.isTraining)) {
		await gui_not_in_training(0);
	}

	return canvasses;
}

function add_header_to_maximally_activated_content (layer_idx) {
	$("#maximally_activated_content").prepend(`<h2 class='h2_maximally_activated_layer_contents'><input id='max_activated_input_text_${uuidv4()}' style='width: 100%' value='Layer ${layer_idx + get_types_in_order(layer_idx)}' /></h2>`);
}

function show_stop_generating_button () {
	$("#stop_generating_images_button").show();
}

function hide_stuff_after_generating_maximally_activated_neurons () {
	$("#stop_generating_images_button").hide();
	$("#generate_images_msg_wrapper").hide();
	$("#generate_images_msg").html("");
}

function reset_cursor () {
	$("body").css("cursor", "default");
}

function get_types_in_order(layer_idx) {
	var types_in_order = "";
	if(get_number_of_layers() - 1 == layer_idx && labels && labels.length) {
		types_in_order = " (" + labels.join(", ") + ")";
	}
	
	return types_in_order;
}

async function predict_maximally_activated (item, force_category) {
	assert(typeof(item) == "object", "item is not an object");

	var results;
	try {
		results = await predict(item);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);
	}

	if(!results) {
		err(language[lang]["results_is_empty_in"] + " predict_maximally_activated");
		return;
	}

	var $item = $(item);
	var next_item = $item.next().next();

	if(next_item.length && next_item[0].tagName.toLowerCase() == "pre") {
		next_item.remove();
	}

	$item.after("<pre class='maximally_activated_predictions'>" + results + "</pre>");
}

async function wait_for_images_to_be_generated() {
	if(currently_generating_images) {
		l(language[lang]["cannot_predict_two_layers_at_the_same_time"] + "...");

		while (currently_generating_images) {
			await delay(500);
		}
	}

	await wait_for_updated_page(3);
}

function handle_scaled_grads_error (e) {
	if(Object.keys(e).includes("message")) {
		e = e.message;
	}

	err(`${language[lang]["inside_scaled_grads_creation_error"]}: ${e}`);
}

async function input_gradient_ascent(layer_idx, neuron, iterations, start_image, recursion = 0) {
	typeassert(layer_idx, int, "layer_idx");
	typeassert(neuron, int, "neuron");
	typeassert(iterations, int, "iterations");
	typeassert(recursion, int, "recursion");

	var worked = 0;
	var full_data = {};

	try {
		var generated_data = tidy(() => {
			// Create an auxiliary model of which input is the same as the original
			// model but the output is the output of the convolutional layer of
			// interest.
			const layer_output = model.getLayer(null, layer_idx).getOutputAt(0);

			const aux_model = tf_model({inputs: model.inputs, outputs: layer_output});

			// This function calculates the value of the convolutional layer's
			// output at the designated filter index.
			const lossFunction = (input) => aux_model.apply(input, {training: true}).gather([neuron], -1);

			// This returned function (`grad_function`) calculates the gradient of the
			// convolutional filter's output with respect to the input image.
			const grad_function = grad(lossFunction);

			// Form a random image as the starting point of the gradient ascent.

			var new_input_shape = get_input_shape_with_batch_size();
			new_input_shape.shift();
			var data = randomUniform([1, ...new_input_shape], 0, 1);
			if(typeof(start_image) != "undefined") {
				data = start_image;
			}

			for (var iteration_idx = 0; iteration_idx < iterations; iteration_idx++) {
				log(`Iteration ${iteration_idx + 1}/${iterations}`);
				if(stop_generating_images) {
					continue;
				}

				const scaledGrads = tidy(() => {
					try {
						const grads = grad_function(data);

						const grads_sq = tf_square(grads);

						const grads_sq_mean = tf_mean(grads_sq);

						const _is = sqrt(grads_sq_mean);

						const _epsilon = get_epsilon();

						const _constant_shape = tf_constant_shape(_epsilon, _is);

						const norm = tf_add(_is, _constant_shape);

						const r = tf_div(grads, norm);

						return r;
					} catch (e) {
						handle_scaled_grads_error(e)
					}
				});

				data = tf_add(data, scaledGrads);
				worked = 1;
			}

			return data;
		});
	} catch (e) {
		return await handle_input_gradient_descent_error(e, recursion, layer_idx);
	}

	if(model.input.shape.length == 4 && model.input.shape[3] == 3) {
		try {
			full_data["image"] = tidy(() => {
				return array_sync(tidy(() => {
					var dp = deprocess_image(generated_data);

					if(!dp) {
						err(language[lang]["deprocess_image_returned_empty_image"]);
						full_data["worked"] = 0;
					}

					return dp;
				}));
			});
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			console.log("generated_data: ", generated_data);

			err("" + e);

			full_data["worked"] = 0;
		}
	} else {
		full_data["data"] = array_sync(generated_data);
	}

	await dispose(generated_data);

	full_data["worked"] = worked;

	return full_data;
}

async function handle_input_gradient_descent_error (e, recursion, layer_idx) {
	if(("" + e).includes("is already disposed")) {
		await compile_model();
		if(recursion > 20) {
			await delay(recursion * 1000);
			return await input_gradient_ascent(layer_idx, neuron, iterations, start_image, recursion + 1);
		} else {
			throw new Error("Too many retries for input_gradient_ascent");
		}
	} else {
		throw new Error("Error 12: " + e);
	}
}

function deprocess_image(x) {
	assert(Object.keys("isDisposedInternal"), "x for deprocess image is not a tensor but " + typeof(x));

	var res = tidy(() => {
		try {
			const {mean, variance} = tf_moments(x);
			x = tf_sub(x, mean);
			// Add a small positive number (EPSILON) to the denominator to prevent
			// division-by-zero.
			x = tf_add(tf_div(x, sqrt(variance), tf_constant_shape(get_epsilon(), x)), x);
			// Clip to [0, 1].
			x = tf_add(x, tf_constant_shape(0.5, x));
			x = clipByValue(x, 0, 1);
			x = tf_mul(x, tf_constant_shape(255, x));
			return tidy(() => {
				return clipByValue(x, 0, 255).asType("int32");
			});
		} catch (e) {
			if(Object.keys(e).includes("message")) {
				e = e.message;
			}

			err("" + e);

			return null;
		}
	});

	return res;
}
