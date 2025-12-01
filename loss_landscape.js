"use strict";

/* -------------------- BASIC VALIDATION HELPERS -------------------- */

function ensure_model_has_layers(m) {
	if(!m) {
		throw new Error("Failed: model m is null or undefined");
	}

	if(!Object.keys(m).includes("layers")) {
		throw new Error("Failed: model m does not include layers");
	}

	if(!m.layers || m.layers.length === 0) {
		throw new Error("Failed: model m does has no layers");
	}

	return true;
}

function ensure_tensor(value, name) {
	if(!is_tensor(value)) {
		throw new Error("Failed: " + name + " is not a tensor");
	}
	return true;
}

function get_selected_loss_function() {
	let selected_loss = $("#loss").val();

	if(!Object.keys(tf.metrics).includes(selected_loss)) {
		throw new Error("Failed: " + selected_loss + " not in tf.metrics");
	}

	return tf.metrics[selected_loss];
}

/* -------------------- LOSS CALCULATION -------------------- */

function get_model_prediction(m, input) {
	try {
		return m.predict(input);
	} catch(err) {
		console.error(err);
		console.trace();
		throw new Error("Failed: could not run model.predict");
	}
}

function calculate_loss(loss_fn, wanted, got) {
	try {
		let loss = loss_fn(wanted, got);
		let arr = array_sync_if_tensor(loss);
		return arr[0];
	} catch(err) {
		console.error(err);
		console.trace();
		throw new Error("Failed: could not calculate loss");
	}
}

function get_loss_from_data(m, input, wanted) {
	ensure_model_has_layers(m);
	ensure_tensor(input, "input");
	ensure_tensor(wanted, "wanted");

	let loss_fn = get_selected_loss_function();
	let got = get_model_prediction(m, input);

	return calculate_loss(loss_fn, wanted, got);
}

/* -------------------- WEIGHT EXTRACTION -------------------- */

function extract_flat_weights_from_model(m) {
	let flat = [];
	let shapes = [];
	let sizes = [];
	let total_weight_norm_sq = 0;

	for(let layer of m.layers) {
		if(!layer.weights) {
			continue;
		}

		for(let w of layer.weights) {
			let arr = array_sync_if_tensor(w.val);
			let f = arr.flat(Infinity);

			shapes.push(w.shape);
			sizes.push(f.length);

			for(let v of f) {
				flat.push(v);
				total_weight_norm_sq += v * v;
			}
		}
	}

	if(flat.length < 2) {
		info("Landscape reduction requires at least 2 parameters");
		return null;
	}

	return {
		flat : flat,
		shapes : shapes,
		sizes : sizes,
		total_weight_norm_sq : total_weight_norm_sq,
		dim : flat.length
	};
}

/* -------------------- PCA / RANDOM SUBSPACE -------------------- */

function compute_dot(a, b) {
	let sum = 0;
	for(let i = 0; i < a.length; i++) {
		sum += a[i] * b[i];
	}
	return sum;
}

function subtract_mul(a, b, scalar) {
	let out = new Array(a.length);
	for(let i = 0; i < a.length; i++) {
		out[i] = a[i] - b[i] * scalar;
	}
	return out;
}

function vector_norm(v) {
	return Math.sqrt(compute_dot(v, v));
}

function normalize_vector(v) {
	let n = vector_norm(v);

	if(n === 0) {
		return v;
	}

	let out = new Array(v.length);
	for(let i = 0; i < v.length; i++) {
		out[i] = v[i] / n;
	}

	return out;
}

function generate_random_vector(dim) {
	let arr = new Array(dim);

	for(let i = 0; i < dim; i++) {
		arr[i] = Math.random() * 2 - 1;
	}

	return arr;
}

function computePCA(dim) {
	let randVec1 = generate_random_vector(dim);
	let randVec2 = generate_random_vector(dim);

	let PC1 = normalize_vector(randVec1);

	let proj_scalar = compute_dot(randVec2, PC1);

	let u2 = subtract_mul(randVec2, PC1, proj_scalar);
	let PC2 = normalize_vector(u2);

	if(vector_norm(PC1) === 0 || vector_norm(PC2) === 0) {
		let fallbackPC1 = new Array(dim).fill(0);
		let fallbackPC2 = new Array(dim).fill(0);

		fallbackPC1[0] = 1;
		fallbackPC2[1] = 1;

		return [fallbackPC1, fallbackPC2];
	}

	return [PC1, PC2];
}

/* -------------------- RANGE AND STEP CALC -------------------- */

function compute_fixed_radius(mult, total_weight_norm_sq) {
	let total_weight_norm = Math.sqrt(total_weight_norm_sq);
	return mult * total_weight_norm * 0.05;
}

function projection_center(axis, original_flat) {
	let proj_center = 0;

	for(let i = 0; i < axis.length; i++) {
		proj_center += axis[i] * original_flat[i];
	}

	return proj_center;
}

function get_projection_range(axis, original_flat, fixed_range_radius) {
	let center = projection_center(axis, original_flat);

	return {
		min : center - fixed_range_radius,
		max : center + fixed_range_radius
	};
}

function get_step(min, max, steps) {
	if(steps <= 1) {
		throw new Error("Failed: steps must be > 1");
	}

	return (max - min) / (steps - 1);
}

/* -------------------- WEIGHT REBUILD -------------------- */

function rebuild_weights_from_flat(m, arr, sizes, shapes) {
	let offset = 0;
	let li = 0;

	for(let layer of m.layers) {
		if(!layer.weights) {
			continue;
		}

		let tensors = [];

		for(let w of layer.weights) {
			let size = sizes[li];
			let shape = shapes[li];

			let chunk = arr.slice(offset, offset + size);

			offset += size;
			li++;

			let t = tf.tensor(chunk, shape);
			tensors.push(t);
		}

		try {
			layer.setWeights(tensors);
		} catch(err) {
			console.error(err);
			console.trace();
			throw new Error("Failed: layer.setWeights failed");
		}
	}
}

/* -------------------- MODIFIED VECTOR GENERATION -------------------- */

function generate_modified_flat(original_flat, axis1, axis2, a, b) {
	let dim = original_flat.length;
	let mod = new Array(dim);

	for(let k = 0; k < dim; k++) {
		mod[k] = original_flat[k] + a * axis2[k] + b * axis1[k];
	}

	return mod;
}

/* -------------------- GRID EVALUATION -------------------- */

function evaluate_loss_grid(m, original_flat, PC1, PC2, r1, r2, step1, step2, steps, sizes, shapes, input, wanted) {
	let x = [];
	let y = [];
	let z = [];

	for(let i = 0; i < steps; i++) {
		let a = r2.min + i * step2;

		for(let j = 0; j < steps; j++) {
			let b = r1.min + j * step1;

			let mod = generate_modified_flat(original_flat, PC1, PC2, a, b);

			rebuild_weights_from_flat(m, mod, sizes, shapes);

			let loss_val = tf.tidy(function() {
				return get_loss_from_data(m, input, wanted);
			});

			x.push(b);
			y.push(a);
			z.push(loss_val);

			log("Created a/b/z");
		}
	}

	return [x, y, z];
}

/* -------------------- MAIN LANDSCAPE DATA FUNCTION -------------------- */

function get_loss_landscape_plot_data(m, input, wanted, steps, mult) {
	if(!m) {
		info("Model is empty");
		return null;
	}

	if(steps < 0) {
		info("steps < 0");
		return null;
	}

	ensure_model_has_layers(m);

	let extracted = extract_flat_weights_from_model(m);

	if(!extracted) {
		return null;
	}

	let flat = extracted.flat;
	let shapes = extracted.shapes;
	let sizes = extracted.sizes;
	let total_weight_norm_sq = extracted.total_weight_norm_sq;
	let dim = extracted.dim;

	let original_flat = flat.slice();

	let fixed_range_radius = compute_fixed_radius(mult, total_weight_norm_sq);

	let pcs = computePCA(dim);
	let PC1 = pcs[0];
	let PC2 = pcs[1];

	let r1 = get_projection_range(PC1, original_flat, fixed_range_radius);
	let r2 = get_projection_range(PC2, original_flat, fixed_range_radius);

	let step1 = get_step(r1.min, r1.max, steps);
	let step2 = get_step(r2.min, r2.max, steps);

	let data = evaluate_loss_grid(
		m,
		original_flat,
		PC1,
		PC2,
		r1,
		r2,
		step1,
		step2,
		steps,
		sizes,
		shapes,
		input,
		wanted
	);

	rebuild_weights_from_flat(m, original_flat, sizes, shapes);

	log("Done creating loss landscape");

	return data;
}

/* -------------------- PLOTTING -------------------- */

function reshape_flat_grid(x_flat, y_flat, z_flat) {
	let n = Math.sqrt(x_flat.length);

	if(!Number.isInteger(n)) {
		throw new Error("Failed: Grid is not square");
	}

	let x = [];
	let y = [];
	let z = [];

	for(let i = 0; i < n; i++) {
		let row_x = [];
		let row_y = [];
		let row_z = [];

		for(let j = 0; j < n; j++) {
			let idx = i * n + j;
			row_x.push(x_flat[idx]);
			row_y.push(y_flat[idx]);
			row_z.push(z_flat[idx]);
		}

		x.push(row_x);
		y.push(row_y);
		z.push(row_z);
	}

	return [x, y, z];
}

function get_or_create_container(div_id) {
	let container = null;

	if(div_id) {
		container = document.getElementById(div_id);
	}

	if(!container) {
		container = document.createElement("div");
		document.body.appendChild(container);
	}

	container.style.width = "90%";
	container.style.height = "500px";
	container.style.background = "transparent";
	container.style.position = "relative";
	container.style.margin = "0 auto";
	container.style.display = "block";

	return container;
}

function plot_loss_landscape_surface(data, div_id) {
	if(!data || data.length !== 3) {
		return;
	}

	let x_flat = data[0];
	let y_flat = data[1];
	let z_flat = data[2];

	let grid = reshape_flat_grid(x_flat, y_flat, z_flat);

	let x = grid[0];
	let y = grid[1];
	let z = grid[2];

	let container = get_or_create_container(div_id);

	let trace = {
		x : x,
		y : y,
		z : z,
		type : "surface",
		colorscale : "Viridis",
	};

	let layout = {
		paper_bgcolor : "rgba(0,0,0,0)",
		plot_bgcolor : "rgba(0,0,0,0)",
		scene : {
			xaxis : { title : { text : "Weight" }, backgroundcolor : "rgba(0,0,0,0)" },
			yaxis : { title : { text : "Bias" }, backgroundcolor : "rgba(0,0,0,0)" },
			zaxis : { title : { text : "Loss" }, backgroundcolor : "rgba(0,0,0,0)" }
		},
		margin : { t : 0 },
		autosize : true
	};

	let config = {
		responsive : true
	};

	Plotly.newPlot(container, [trace], layout, config);

	let resize_handler = function() {
		if(container && container.offsetWidth > 0 && container.offsetHeight > 0) {
			Plotly.Plots.resize(container);
		}
	};

	window.addEventListener("resize", resize_handler);

	if(typeof ResizeObserver !== "undefined") {
		let ro = new ResizeObserver(function() {
			resize_handler();
		});

		try {
			ro.observe(container);
		} catch(err) {
			console.error(err);
			console.trace();
		}
	}
}

/* -------------------- PUBLIC WRAPPERS (UNCHANGED API) -------------------- */

function plot_loss_landscape_from_model_and_data(m, input, wanted, steps, mult, div_id = "") {
	let data = get_loss_landscape_plot_data(m, input, wanted, steps, mult);

	if(data !== null) {
		plot_loss_landscape_surface(data, div_id);
	}
}

async function plot_loss_landscape_from_model(steps, mult = 2) {
	let xy = await get_x_and_y();

	let x = xy["x"];
	let y = xy["y"];

	plot_loss_landscape_from_model_and_data(model, x, y, steps, mult);
}
