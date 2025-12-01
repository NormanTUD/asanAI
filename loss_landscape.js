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

function get_loss_landscape_plot_data(m, input, wanted, steps, mult) {
	if(!m) { info("Model is empty"); return null }
	if(steps < 0) { info("steps < 0"); return null }

	// ------------------------
	// Extract & flatten weights
	// ------------------------
	const flat = [];
	const shapes = [];
	const sizes = [];
	let total_weight_norm_sq = 0; // New: To estimate a good scale

	for(const layer of m.layers) {
		if(!layer.weights) continue;
		for(const w of layer.weights) {
			const arr = array_sync_if_tensor(w.val);
			const f = arr.flat(Infinity);
			shapes.push(w.shape);
			sizes.push(f.length);
			for(const v of f) {
				flat.push(v);
				total_weight_norm_sq += v * v; // Accumulate squared norms
			}
		}
	}

	const dim = flat.length;
	if(dim < 2) {
		info("Landscape reduction requires at least 2 parameters");
		return null;
	}

	const original_flat = flat.slice();

	// Estimate a reasonable local radius based on the overall weight norm
	const total_weight_norm = Math.sqrt(total_weight_norm_sq);
	const fixed_range_radius = mult * total_weight_norm * 0.05;
	// This scales the search radius relative to the model size, typically 1%-5% of the norm

	// ------------------------------------
	// Random Orthonormal Subspace (Keep this)
	// ------------------------------------
	function computePCA(dim) {
		// ... (The random orthogonal vector generation logic from the previous answer)
		// Helper function for dot product
		const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
		// Helper function for vector subtraction (a - b * scalar)
		const subMul = (a, b, scalar) => a.map((v, i) => v - b[i] * scalar);
		// Helper function for L2-norm
		const norm = (v) => Math.sqrt(dot(v, v));
		// Helper function for normalization
		const normalize = (v) => {
			const n = norm(v);
			return n === 0 ? v : v.map(val => val / n);
		};

		const randVec1 = Array.from({length: dim}, () => Math.random() * 2 - 1);
		const randVec2 = Array.from({length: dim}, () => Math.random() * 2 - 1);

		const PC1 = normalize(randVec1);
		const proj_scalar = dot(randVec2, PC1);
		const u2 = subMul(randVec2, PC1, proj_scalar);
		const PC2 = normalize(u2);

		if(norm(PC1) === 0 || norm(PC2) === 0) {
			const fallbackPC1 = Array(dim).fill(0); fallbackPC1[0] = 1;
			const fallbackPC2 = Array(dim).fill(0); fallbackPC2[1] = 1;
			return [fallbackPC1, fallbackPC2];
		}

		return [PC1, PC2];
	}

	const [PC1, PC2] = computePCA(dim);

	// ------------------------------------------
	// UPDATED: Weight ranges along PCA axes
	// Use fixed radius centered on the current weights (projection point)
	// ------------------------------------------
	function pRange(axis) {
		// Calculate where the current weight vector 'flat' projects onto the 'axis'
		let proj_center = 0;
		for(let i=0;i<dim;i++) proj_center += axis[i] * original_flat[i];

		// Use the fixed radius determined by the model's total norm
		return {
			min: proj_center - fixed_range_radius,
			max: proj_center + fixed_range_radius
		};
	}

	const r1 = pRange(PC1);
	const r2 = pRange(PC2);

	const step1 = (r1.max - r1.min) / (steps - 1);
	const step2 = (r2.max - r2.min) / (steps - 1);

	// ... (Rest of the function: rebuild_weights_from_flat and Grid evaluation are unchanged)

	// ------------------------
	// Rebuild function (unchanged)
	// ------------------------
	function rebuild_weights_from_flat(arr) {
		let offset = 0;
		let li = 0;
		for(const layer of m.layers) {
			if(!layer.weights) continue;
			const tensors = [];
			for(const w of layer.weights) {
				const size = sizes[li];
				const shape = shapes[li];
				const chunk = arr.slice(offset, offset + size);
				offset += size;
				li++;
				let t = tf.tensor(chunk, shape);
				tensors.push(t);
			}
			layer.setWeights(tensors);
		}
	}

	// ------------------------
	// Grid evaluation (unchanged)
	// ------------------------
	const x=[], y=[], z=[];
	for(let i=0;i<steps;i++){
		const a = r2.min + i*step2; // Axis 2
		for(let j=0;j<steps;j++){
			const b = r1.min + j*step1; // Axis 1
			const mod = new Array(dim);
			for(let k=0;k<dim;k++) mod[k] = original_flat[k] + a*PC2[k] + b*PC1[k];

			rebuild_weights_from_flat(mod);
			const loss_val = tf.tidy(()=> get_loss_from_data(m, input, wanted));
			x.push(b); y.push(a); z.push(loss_val);
			log("Created a/b/z");
		}
	}

	rebuild_weights_from_flat(original_flat);
	log("Done creating loss landscape")
	return [x,y,z];
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

function plot_loss_landscape_from_model_and_data (m, input, wanted, steps, mult, div_id = "") {
	const data = get_loss_landscape_plot_data(model, input, wanted, steps, mult)

	if(data !== null) {
		plot_loss_landscape_surface(data, div_id);
	}
}

async function plot_loss_landscape_from_model(steps, mult = 2) {
	const xy = await get_x_and_y();

	const x = xy["x"];
	const y = xy["y"];

	plot_loss_landscape_from_model_and_data(model, x, y, steps, mult);
}
