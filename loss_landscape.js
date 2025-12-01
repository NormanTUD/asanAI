"use strict";

/**
 * Loss Landscape Generation Library
 *
 * This module calculates and plots the 2D loss landscape of a TensorFlow.js model
 * by projecting the high-dimensional weight space onto two "interesting"
 * directions found via a loss-aware Principal Component Analysis (PCA) proxy.
 */

/* -------------------- BASIC VALIDATION HELPERS -------------------- */

function ensure_model_has_layers(m) {
	if (!m) {
		throw new Error("Failed: model m is null or undefined.");
	}

	if (!Object.keys(m).includes("layers")) {
		throw new Error("Failed: model m does not include layers property.");
	}

	if (!Array.isArray(m.layers) || m.layers.length === 0) {
		throw new Error("Failed: model m has no layers or layers is not an array.");
	}

	return true;
}

function ensure_tensor(value, name) {
	if (!is_tensor(value)) {
		throw new Error(`Failed: ${name} is not a valid TensorFlow.js tensor.`);
	}
	return true;
}

function get_selected_loss_function() {
	if (typeof $ === 'undefined' || typeof tf === 'undefined') {
		throw new Error("Failed to get loss function: jQuery ($) or TensorFlow (tf) is missing.");
	}

	let selected_loss = $("#loss").val();

	if (!selected_loss || !Object.keys(tf.metrics).includes(selected_loss)) {
		// Default to a common loss if selection or metric is missing
		error(`Selected loss "${selected_loss}" not in tf.metrics. Falling back to 'meanSquaredError'.`);
		return tf.metrics.meanSquaredError;
	}

	return tf.metrics[selected_loss];
}

/* -------------------- LOSS CALCULATION -------------------- */

function get_model_prediction(m, input) {
	if (typeof tf === 'undefined') {
		throw new Error("Failed: tf is not defined. Cannot run model.predict.");
	}
	try {
		// Ensure input is a tensor, although predict should check
		return m.predict(input);
	} catch (err) {
		console.error("Failed: could not run model.predict.", err);
		// Return a zero tensor if possible to prevent cascading failures
		return tf.zeros(m.output.shape);
	}
}

function calculate_loss(loss_fn, wanted, got) {
	if (typeof tf === 'undefined') {
		throw new Error("Failed: tf is not defined. Cannot calculate loss.");
	}
	try {
		let loss = loss_fn(wanted, got);
		// Use the robust stub
		let arr = array_sync_if_tensor(loss);
		dispose(loss); // await not possible here
		return arr[0] || 0; // Return 0 if the array is empty or value is null
	} catch (err) {
		console.error("Failed: could not calculate loss.", err);
		return Infinity; // Return high loss on calculation failure
	}
}

function get_loss_from_data(m, input, wanted) {
	try {
		ensure_model_has_layers(m);
		ensure_tensor(input, "input");
		ensure_tensor(wanted, "wanted");
	} catch (e) {
		error(e.message);
		return Infinity;
	}

	const loss_fn = get_selected_loss_function();
	// Wrap prediction in tidy to clean up intermediate tensors immediately
	let got = tf.tidy(() => get_model_prediction(m, input));

	if (!got) return Infinity; // Check if prediction failed

	let loss_value = calculate_loss(loss_fn, wanted, got);
	dispose(got); // await not possible here

	return loss_value;
}

/* -------------------- WEIGHT EXTRACTION -------------------- */

function extract_flat_weights_from_model(m) {
	if (typeof tf === 'undefined') {
		error("Failed: tf is not defined. Cannot extract weights.");
		return null;
	}

	try {
		ensure_model_has_layers(m);
	} catch (e) {
		error(e.message);
		return null;
	}

	let flat = [];
	let shapes = [];
	let sizes = [];
	let total_weight_norm_sq = 0;

	for (let layer of m.layers) {
		if (!layer.weights) {
			continue;
		}

		for (let w of layer.weights) {
			// Check if w.val is a tensor before calling sync helper
			if (!w.val || !is_tensor(w.val)) {
				console.warn("Weight value is not a tensor, skipping.");
				continue;
			}

			// Use the robust stub
			let arr = array_sync_if_tensor(w.val);
			let f = Array.isArray(arr) ? arr.flat(Infinity) : [arr];

			if (f.length === 0) continue;

			shapes.push(w.shape);
			sizes.push(f.length);

			for (let v of f) {
				// Ensure v is a number before pushing
				let val = typeof v === 'number' ? v : 0;
				flat.push(val);
				total_weight_norm_sq += val * val;
			}
		}
	}

	if (flat.length < 2) {
		info("Landscape reduction requires at least 2 parameters.");
		return null;
	}

	return {
		flat: flat,
		shapes: shapes,
		sizes: sizes,
		total_weight_norm_sq: total_weight_norm_sq,
		dim: flat.length
	};
}

/* -------------------- WEIGHT REBUILD -------------------- */

function rebuild_weights_from_flat(m, arr, sizes, shapes) {
	if (typeof tf === 'undefined') {
		error("Failed: tf is not defined. Cannot rebuild weights.");
		return;
	}

	if (!m || !Array.isArray(arr) || !Array.isArray(sizes) || !Array.isArray(shapes)) {
		error("Invalid inputs for rebuild_weights_from_flat.");
		return;
	}

	let offset = 0;
	let li = 0;

	for (let layer of m.layers) {
		if (!layer.weights) {
			continue;
		}

		let tensors = [];

		for (let w of layer.weights) {
			if (li >= sizes.length || li >= shapes.length) {
				error("Rebuild failed: metadata mismatch (sizes/shapes).");
				return;
			}

			let size = sizes[li];
			let shape = shapes[li];

			let chunk = arr.slice(offset, offset + size);

			offset += size;
			li++;

			// Ensure chunk size matches expected size
			if (chunk.length !== size) {
				error(`Rebuild failed: chunk size mismatch for weight ${w.name}. Expected ${size}, got ${chunk.length}.`);
				return;
			}

			let t = null;
			try {
				// Create the tensor using tf.tensor
				t = tf.tensor(chunk, shape);
				tensors.push(t);
			} catch (err) {
				error(`Failed to create tensor for weight ${w.name}: ${err.message}`);
				tensors.forEach(t => dispose(t)); // Clean up on failure, await not possible here
				return;
			}
		}

		try {
			layer.setWeights(tensors);
		} catch (err) {
			error(`Failed: layer.setWeights failed for layer ${layer.name}. ${err.message}`);
			// Clean up the newly created tensors
			tensors.forEach(t => dispose(t)); // await not possible here
			return;
		}

		// Dispose of the newly created tensors immediately after setting weights
		tensors.forEach(t => dispose(t)); // await not possible here
	}
}

/* -------------------- VECTOR MATH HELPERS -------------------- */

function compute_dot(a, b) {
	if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
	let sum = 0;
	for (let i = 0; i < a.length; i++) {
		sum += (a[i] || 0) * (b[i] || 0); // Defensive access
	}
	return sum;
}

function subtract_mul(a, b, scalar) {
	if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return a.slice();
	let out = new Array(a.length);
	for (let i = 0; i < a.length; i++) {
		out[i] = (a[i] || 0) - (b[i] || 0) * (scalar || 0);
	}
	return out;
}

function vector_norm(v) {
	return Math.sqrt(compute_dot(v, v));
}

function normalize_vector(v) {
	if (!Array.isArray(v)) return [];
	let n = vector_norm(v);
	let out = new Array(v.length);

	if (n === 0) {
		// Return a copy of the zero vector if norm is zero
		return v.slice();
	}

	for (let i = 0; i < v.length; i++) {
		out[i] = (v[i] || 0) / n;
	}

	return out;
}

function generate_random_vector(dim) {
	let arr = new Array(dim);
	for (let i = 0; i < dim; i++) {
		arr[i] = Math.random() * 2 - 1;
	}
	return arr;
}

/* -------------------- PCA / RANDOM SUBSPACE -------------------- */

// Sub-functions for Power Iteration are encapsulated for clarity and robustness
// as they are only used within computePCA and have built-in checks.

function computePCA(dim, m, original_flat, sizes, shapes, input, wanted, sample_count = 48, enableDiagnostics = false) {
	if (typeof tf === 'undefined') {
		error("Failed: tf is not defined. Cannot compute PCA.");
		return fallback_axes(dim);
	}

	function fallback_axes(d) {
		let f1 = new Array(d).fill(0);
		let f2 = new Array(d).fill(0);
		if (d > 0) f1[0] = 1;
		if (d > 1) f2[1] = 1;
		else if (d === 1) f2[0] = 0;
		return [f1, f2];
	}

	try {
		if (!m || !original_flat || dim < 2) {
			throw new Error("computePCA: invalid model, weights, or dimension (< 2).");
		}

		// Sensible bounds on sample_count
		let N = Math.min(Math.max(8, sample_count || 48), 200);
		N = Math.min(N, dim);

		// compute small epsilon relative to weight magnitude and dimension
		let norm_w = vector_norm(original_flat);
		let eps = 1e-4;
		if (norm_w > 0) {
			// Adjusted: 1e-3 * (norm_w / sqrt(max(1, dim))) -> More stable scaling
			eps = 1e-3 * (norm_w / Math.sqrt(Math.max(1, dim)));
		}

		// Arrays to collect sample rows and derivative magnitudes
		let samples = []; // each is length dim
		let derivs = []; // signed directional derivative per sample (scalar)

		for (let i = 0; i < N; i++) {
			// create a random direction and normalize it
			let v = generate_random_vector(dim);
			let vnorm = vector_norm(v);
			if (vnorm === 0) {
				// Ensure a non-zero vector if Math.random failed
				v = new Array(dim).fill(0);
				v[i % dim] = 1;
				vnorm = 1;
			}
			v = normalize_vector(v);

			// build perturbed weights: original +/- eps * v
			let pert_plus = new Array(dim);
			let pert_minus = new Array(dim);
			for (let k = 0; k < dim; k++) {
				let step = eps * v[k];
				pert_plus[k] = (original_flat[k] || 0) + step;
				pert_minus[k] = (original_flat[k] || 0) - step;
			}

			// set model weights to pert_plus and measure loss
			rebuild_weights_from_flat(m, pert_plus, sizes, shapes);
			let loss_plus = tf.tidy(() => get_loss_from_data(m, input, wanted));

			// set model weights to pert_minus and measure loss
			rebuild_weights_from_flat(m, pert_minus, sizes, shapes);
			let loss_minus = tf.tidy(() => get_loss_from_data(m, input, wanted));

			// Central finite difference: directional derivative estimate (signed)
			let delta_signed = (loss_plus - loss_minus) / (2 * eps);

			// If derivative is NaN or non-finite, set tiny value to avoid degenerate rows
			if (!isFinite(delta_signed) || Number.isNaN(delta_signed)) {
				delta_signed = 0;
			}

			// push a signed sample row (v * derivative)
			let row = new Array(dim);
			let anyNonZero = false;
			for (let k = 0; k < dim; k++) {
				row[k] = v[k] * delta_signed;
				if (Math.abs(row[k]) > 1e-24) anyNonZero = true; // Use a small threshold
			}

			// If row degenerated, keep a tiny random perturbation
			if (!anyNonZero) {
				let tiny = 1e-12; // Smaller than original 1e-18
				for (let k = 0; k < dim; k++) {
					row[k] = (v[k] || 0) * tiny;
				}
			}

			samples.push(row);
			derivs.push(delta_signed);
		}

		// restore original weights
		rebuild_weights_from_flat(m, original_flat, sizes, shapes);

		// diagnostics removed for brevity/resilience (can be re-added)

		// Refined fallback check
		if (samples.length < 2) {
			return fallback_axes(dim);
		}

		// Build Gram matrix K = samples * samples^T (N x N)
		let K = new Array(N);
		for (let i = 0; i < N; i++) {
			K[i] = new Array(N);
			for (let j = 0; j < N; j++) {
				K[i][j] = compute_dot(samples[i], samples[j]);
			}
		}

		// --- Encapsulated Power Iteration Functions ---

		function matVecMul(mat, vec) {
			let out = new Array(mat.length);
			for (let i = 0; i < mat.length; i++) {
				let s = 0;
				let row = mat[i];
				for (let j = 0; j < row.length; j++) {
					s += (row[j] || 0) * (vec[j] || 0);
				}
				out[i] = s;
			}
			return out;
		}

		function vecDot(a, b) {
			let s = 0;
			for (let i = 0; i < a.length; i++) {
				s += (a[i] || 0) * (b[i] || 0);
			}
			return s;
		}

		function scalarMulVec(scalar, v) {
			let out = new Array(v.length);
			for (let i = 0; i < v.length; i++) {
				out[i] = (v[i] || 0) * (scalar || 0);
			}
			return out;
		}

		function normalizeVec(v) {
			let n = Math.sqrt(vecDot(v, v));
			if (n === 0) return v.slice();
			let out = new Array(v.length);
			for (let i = 0; i < v.length; i++) {
				out[i] = (v[i] || 0) / n;
			}
			return out;
		}

		function powerIterationMatrix(mat, iterations = 300, tol = 1e-8) {
			let n = mat.length;
			let b = generate_random_vector(n); // Start with a random vector
			b = normalizeVec(b);
			let lambda_old = 0;
			let final_b = b;
			let final_eigenvalue = 0;

			for (let it = 0; it < iterations; it++) {
				let Mb = matVecMul(mat, b);
				let norm_Mb = Math.sqrt(Math.max(1e-24, vecDot(Mb, Mb))); // Robust norm
				if (norm_Mb === 0) break;

				let b_next = scalarMulVec(1.0 / norm_Mb, Mb);
				let ray = vecDot(b_next, matVecMul(mat, b_next));

				if (Math.abs(ray - lambda_old) < tol) {
					final_b = b_next;
					final_eigenvalue = ray;
					break;
				}
				b = b_next;
				lambda_old = ray;
				final_b = b;
				final_eigenvalue = ray;
			}
			return { eigenvector: final_b, eigenvalue: final_eigenvalue };
		}
		// --- End of Power Iteration Functions ---


		// first eigenpair
		let p1 = powerIterationMatrix(K);
		let u1 = p1.eigenvector;
		let lambda1 = p1.eigenvalue;

		// deflate K to get second eigenvector
		let K2 = new Array(N);
		for (let i = 0; i < N; i++) {
			K2[i] = new Array(N);
			for (let j = 0; j < N; j++) {
				K2[i][j] = K[i][j] - lambda1 * (u1[i] || 0) * (u1[j] || 0);
			}
		}

		let p2 = powerIterationMatrix(K2);
		let u2 = p2.eigenvector;

		// map eigenvectors from sample-space back to full parameter space:
		function mapToParameterSpace(u) {
			let pc = new Array(dim).fill(0);
			for (let k = 0; k < dim; k++) {
				for (let i = 0; i < N; i++) {
					pc[k] += (u[i] || 0) * (samples[i] && samples[i][k] ? samples[i][k] : 0);
				}
			}

			let norm_pc = vector_norm(pc);
			if (norm_pc === 0) {
				// Highly defensive fallback to random vector
				return normalize_vector(generate_random_vector(dim));
			}
			return normalize_vector(pc);
		}

		let PC1 = mapToParameterSpace(u1);
		let PC2 = mapToParameterSpace(u2);

		// orthogonalize PC2 w.r.t PC1 and normalize
		if (vector_norm(PC1) === 0 || vector_norm(PC2) === 0) {
			// Orthogonalize random vectors if mapping failed
			let f1 = generate_random_vector(dim);
			let f2 = generate_random_vector(dim);
			PC1 = normalize_vector(f1);
			PC2 = normalize_vector(subtract_mul(f2, PC1, compute_dot(f2, PC1)));
		} else {
			let proj = compute_dot(PC2, PC1);
			PC2 = subtract_mul(PC2, PC1, proj);
			if (vector_norm(PC2) === 0) {
				// If the subtraction resulted in a zero vector, pick a random, orthogonal one
				let fallback = generate_random_vector(dim);
				PC2 = normalize_vector(subtract_mul(fallback, PC1, compute_dot(fallback, PC1)));
			} else {
				PC2 = normalize_vector(PC2);
			}
			PC1 = normalize_vector(PC1); // Re-normalize PC1 just in case
		}

		// Final check: PC1 and PC2 must be non-zero and same dimension
		if (vector_norm(PC1) === 0 || vector_norm(PC2) === 0 || PC1.length !== dim || PC2.length !== dim) {
			return fallback_axes(dim);
		}

		return [PC1, PC2];

	} catch (err) {
		error(`computePCA failed: ${err.message}`);
		console.error(err);
		return fallback_axes(dim);
	}
}

/* -------------------- RANGE AND STEP CALC -------------------- */

function compute_fixed_radius(mult, total_weight_norm_sq) {
	if (typeof mult !== 'number' || mult <= 0) mult = 2;
	if (typeof total_weight_norm_sq !== 'number' || total_weight_norm_sq < 0) return 0.1; // Default radius

	let total_weight_norm = Math.sqrt(total_weight_norm_sq);
	// Use Math.max to ensure a minimum sensible radius if norm is tiny
	return Math.max(0.01, mult * total_weight_norm * 0.05);
}

function projection_center(axis, original_flat) {
	if (!Array.isArray(axis) || !Array.isArray(original_flat) || axis.length !== original_flat.length) return 0;
	let proj_center = 0;

	for (let i = 0; i < axis.length; i++) {
		proj_center += (axis[i] || 0) * (original_flat[i] || 0);
	}

	return proj_center;
}

function get_projection_range(axis, original_flat, fixed_range_radius) {
	if (typeof fixed_range_radius !== 'number' || fixed_range_radius <= 0) fixed_range_radius = 0.1;

	let center = projection_center(axis, original_flat);

	return {
		min: center - fixed_range_radius,
		max: center + fixed_range_radius
	};
}

function get_step(min, max, steps) {
	if (typeof min !== 'number' || typeof max !== 'number') {
		throw new Error("Failed: min or max is not a number.");
	}

	if (typeof steps !== 'number' || steps < 2) {
		// Fallback to minimal steps if invalid
		steps = 2;
	}

	return (max - min) / (steps - 1);
}

/* -------------------- MODIFIED VECTOR GENERATION -------------------- */

function generate_modified_flat(original_flat, axis1, axis2, a, b) {
	if (!Array.isArray(original_flat) || original_flat.length === 0) {
		return [];
	}
	let dim = original_flat.length;
	let mod = new Array(dim);
	a = a || 0;
	b = b || 0;

	for (let k = 0; k < dim; k++) {
		// Use axis2 for 'a' and axis1 for 'b' as per the original code's variable naming in evaluate_loss_grid
		mod[k] = (original_flat[k] || 0) + a * (axis2[k] || 0) + b * (axis1[k] || 0);
	}

	return mod;
}

/* -------------------- GRID EVALUATION -------------------- */

function evaluate_loss_grid(m, original_flat, PC1, PC2, r1, r2, step1, step2, steps, sizes, shapes, input, wanted) {
	if (typeof tf === 'undefined') {
		error("Failed: tf is not defined. Cannot evaluate loss grid.");
		return [[], [], []];
	}
	if (steps < 2) {
		error("Steps must be >= 2 for grid evaluation.");
		return [[], [], []];
	}

	let x = [];
	let y = [];
	let z = [];

	const total = steps * steps;
	let count = 0;

	// Check for valid range objects and step values
	if (!r1 || !r2 || typeof step1 !== 'number' || typeof step2 !== 'number') {
		error("Invalid range or step values.");
		return [[], [], []];
	}

	for (let i = 0; i < steps; i++) {
		let a = r2.min + i * step2;

		for (let j = 0; j < steps; j++) {
			let b = r1.min + j * step1;

			let loss_val = Infinity;

			// Use tf.tidy to manage memory within the loop, which is critical
			tf.tidy(() => {
				let mod = generate_modified_flat(original_flat, PC1, PC2, a, b);

				try {
					rebuild_weights_from_flat(m, mod, sizes, shapes);
					loss_val = get_loss_from_data(m, input, wanted);
				} catch (e) {
					// Log error and keep loss_val at Infinity
					console.error("Grid point evaluation failed:", e.message);
				}
			});

			x.push(b); // Corresponds to PC1 (b)
			y.push(a); // Corresponds to PC2 (a)
			z.push(loss_val);

			count++;
			// log(`Created a/b/z ${count} from ${total}`); // Keep logging minimal or conditional
		}
	}

	return [x, y, z];
}

/* -------------------- MAIN LANDSCAPE DATA FUNCTION -------------------- */

function get_loss_landscape_plot_data(m, input, wanted, steps, mult) {
	if (!m) {
		info("Model is null or undefined.");
		return null;
	}
	if (typeof steps !== 'number' || steps < 2) {
		info("steps must be a number >= 2.");
		steps = 20; // Default to a sensible step count
	}
	if (typeof mult !== 'number' || mult <= 0) {
		mult = 2; // Default multiplier
	}

	try {
		ensure_model_has_layers(m);
		ensure_tensor(input, "input");
		ensure_tensor(wanted, "wanted");
	} catch (e) {
		error(e.message);
		return null;
	}

	let extracted = extract_flat_weights_from_model(m);

	if (!extracted) {
		return null;
	}

	let flat = extracted.flat;
	let shapes = extracted.shapes;
	let sizes = extracted.sizes;
	let total_weight_norm_sq = extracted.total_weight_norm_sq;
	let dim = extracted.dim;

	let original_flat = flat.slice();

	let fixed_range_radius = compute_fixed_radius(mult, total_weight_norm_sq);

	// Use the loss-aware PCA
	let pcs = computePCA(dim, m, original_flat, sizes, shapes, input, wanted, 48);
	let PC1 = pcs[0];
	let PC2 = pcs[1];

	if (!PC1 || !PC2) {
		error("PCA failed to return valid principal components.");
		rebuild_weights_from_flat(m, original_flat, sizes, shapes); // Restore weights
		return null;
	}

	// Get range and step, robust to potential axis length/data issues
	let r1, r2, step1, step2;
	try {
		r1 = get_projection_range(PC1, original_flat, fixed_range_radius);
		r2 = get_projection_range(PC2, original_flat, fixed_range_radius);
		step1 = get_step(r1.min, r1.max, steps);
		step2 = get_step(r2.min, r2.max, steps);
	} catch (e) {
		error("Range or step calculation failed: " + e.message);
		rebuild_weights_from_flat(m, original_flat, sizes, shapes); // Restore weights
		return null;
	}

	let data = evaluate_loss_grid(m, original_flat, PC1, PC2, r1, r2, step1, step2, steps, sizes, shapes, input, wanted);

	// CRITICAL: Always restore original weights before returning
	rebuild_weights_from_flat(m, original_flat, sizes, shapes);

	log("Done creating loss landscape data.");

	return data;
}

/* -------------------- PLOTTING -------------------- */

function reshape_flat_grid(x_flat, y_flat, z_flat) {
	if (!Array.isArray(x_flat) || x_flat.length === 0) {
		return [[], [], []];
	}

	let n = Math.sqrt(x_flat.length);

	if (!Number.isInteger(n)) {
		error("Failed: Grid is not square. Length: " + x_flat.length);
		return [[], [], []];
	}

	let x = [];
	let y = [];
	let z = [];

	for (let i = 0; i < n; i++) {
		let row_x = [];
		let row_y = [];
		let row_z = [];

		for (let j = 0; j < n; j++) {
			let idx = i * n + j;
			if (idx >= x_flat.length) break; // Defensive boundary check

			row_x.push(x_flat[idx] || 0);
			row_y.push(y_flat[idx] || 0);
			row_z.push(z_flat[idx] || 0);
		}

		x.push(row_x);
		y.push(row_y);
		z.push(row_z);
	}

	return [x, y, z];
}

function get_or_create_container(div_id) {
	let container = null;

	if (div_id) {
		container = document.getElementById(div_id);
	}

	if (!container) {
		// Fallback: create a container and append it to body
		container = document.createElement("div");
		container.id = `loss-landscape-container-${Math.random().toString(36).substring(7)}`;
		document.body.appendChild(container);
	}

	// Ensure container has appropriate styles for Plotly
	container.style.width = container.style.width || "90%";
	container.style.height = container.style.height || "800px";
	container.style.margin = container.style.margin || "0 auto";
	container.style.display = container.style.display || "block";
	container.style.position = container.style.position || "relative";

	return container;
}

function plot_loss_landscape_surface(data, div_id) {
	if (typeof Plotly === 'undefined') {
		error("Plotly is not defined. Cannot plot loss landscape.");
		return;
	}
	if (!data || data.length !== 3 || data[0].length === 0) {
		error("No data or invalid data format for plotting.");
		return;
	}

	try {
		let x_flat = data[0];
		let y_flat = data[1];
		let z_flat = data[2];

		let grid = reshape_flat_grid(x_flat, y_flat, z_flat);

		let x = grid[0];
		let y = grid[1];
		let z = grid[2];

		let container = get_or_create_container(div_id);

		let trace = {
			x: x,
			y: y,
			z: z,
			type: "surface",
			colorscale: "Viridis",
		};

		let layout = {
			paper_bgcolor: "rgba(0,0,0,0)",
			plot_bgcolor: "rgba(0,0,0,0)",
			scene: {
				xaxis: { title: { text: "PC 1 Direction" }, backgroundcolor: "rgba(0,0,0,0)" },
				yaxis: { title: { text: "PC 2 Direction" }, backgroundcolor: "rgba(0,0,0,0)" },
				zaxis: { title: { text: "Loss" }, backgroundcolor: "rgba(0,0,0,0)" }
			},
			margin: { t: 0 },
			autosize: true
		};

		let config = {
			responsive: true
		};

		Plotly.newPlot(container, [trace], layout, config);

		// Responsive handling for robustness
		const resize_handler = () => {
			if (container && container.offsetWidth > 0 && container.offsetHeight > 0) {
				Plotly.Plots.resize(container);
			}
		};

		window.removeEventListener("resize", resize_handler);
		window.addEventListener("resize", resize_handler);

		if (typeof ResizeObserver !== "undefined") {
			try {
				// Check if observer already exists to prevent duplicates
				if (!container.__resizeObserver) {
					const ro = new ResizeObserver(resize_handler);
					ro.observe(container);
					container.__resizeObserver = ro; // Store the observer
				}
			} catch (err) {
				console.error("ResizeObserver failed to initialize:", err);
			}
		}
	} catch (err) {
		error(`Plotly plotting failed: ${err.message}`);
		console.error(err);
	}
}

/* -------------------- PUBLIC WRAPPERS (ROBUST API) -------------------- */

function plot_loss_landscape_from_model_and_data(m, input, wanted, steps, mult, div_id) {
	// Basic checks for external dependencies
	if (typeof tf === 'undefined') {
		error("TensorFlow.js (tf) is not defined. Cannot proceed.");
		return;
	}

	if (!m || !input || !wanted) {
		error("Model, input, or wanted data is missing.");
		return;
	}

	// Default parameters for robustness
	if (typeof steps !== 'number') steps = 20;
	if (typeof mult !== 'number') mult = 2;
	if (typeof div_id === "undefined" || div_id === null) div_id = "";

	let data = null;
	try {
		data = get_loss_landscape_plot_data(m, input, wanted, steps, mult);
	} catch (e) {
		error("Error in generating loss landscape data: " + e.message);
		console.error(e);
	}

	if (data !== null) {
		plot_loss_landscape_surface(data, div_id);
	}
}

function model_shape_is_compatible(modelShape, dataShape) {
	if (!Array.isArray(modelShape) || !Array.isArray(dataShape) || modelShape.length !== dataShape.length) {
		error("Shape rank mismatch or invalid shape arguments.");
		return false;
	}

	for (let i = 0; i < modelShape.length; i++) {
		const modelDim = modelShape[i];
		const dataDim = dataShape[i];

		// Ensure dataDim is a valid positive integer
		if (typeof dataDim !== "number" || !Number.isInteger(dataDim) || dataDim <= 0) {
			error(`Invalid data dimension at index ${i}: ${dataDim}.`);
			return false;
		}

		// Handle null (batch size) or a fixed dimension in the model shape
		if (modelDim !== null) {
			if (typeof modelDim !== "number" || !Number.isInteger(modelDim) || modelDim <= 0) {
				error(`Invalid model dimension at index ${i}: ${modelDim}.`);
				return false;
			}

			if (modelDim !== dataDim) {
				error(`Dimension mismatch at index ${i}: model expects ${modelDim} but data has ${dataDim}.`);
				return false;
			}
		}
	}
	return true;
}

async function plot_loss_landscape_from_model(steps = 20, mult = 2, div_id = null) {
	if (typeof tf === 'undefined') {
		error("TensorFlow.js (tf) is not defined. Cannot proceed.");
		return false;
	}

	// Check for global model and required external functions
	if (typeof model === 'undefined' || typeof get_x_and_y !== 'function' || typeof dispose !== 'function') {
		error("External dependencies (global 'model', 'get_x_and_y', or 'dispose') are missing.");
		return false;
	}

	// Use tf.engine().startScope() for robust memory management
	tf.engine().startScope();

	let x = null;
	let y = null;
	let success = false;

	try {
		log("Fetching input and output data (x, y)...");
		let xy = await get_x_and_y();

		x = xy?.x;
		y = xy?.y;

		if (!x || !y) {
			error("Failed to get valid x and y tensors from get_x_and_y.");
			return false;
		}

		if (!model.input || !model.output) {
			throw new Error("Model input or output property is missing (model not built).");
		}

		// Shape compatibility checks
		if (!model_shape_is_compatible(model.input.shape, x.shape)) {
			throw new Error("Input data shape is incompatible with model input shape.");
		}

		if (!model_shape_is_compatible(model.output.shape, y.shape)) {
			throw new Error("Output data shape is incompatible with model output shape.");
		}

		// Final plotting call
		plot_loss_landscape_from_model_and_data(model, x, y, steps, mult, div_id);
		success = true;

	} catch (e) {
		error(`Failed to plot loss landscape: ${e.message}`);
		console.error(e);
	} finally {
		// CRITICAL: Always dispose of tensors and end the scope
		if (x) await dispose(x);
		if (y) await dispose(y);
		tf.engine().endScope();
		log("TensorFlow engine scope ended and temporary tensors disposed.");
	}

	return success;
}
