"use strict";

/**
 * Loss Landscape Generation Library
 *
 * This module calculates and plots the 2D loss landscape of a TensorFlow.js model
 * by projecting the high-dimensional weight space onto two "interesting"
 * directions based on a user-selected dimension reduction method.
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

/**
 * Checks if an array is a valid TensorFlow.js shape array (contains only numbers or null).
 * @param {Array<number|null>} shape - The array to check.
 * @returns {boolean}
 */
function isShapeArray(shape) {
	if (!Array.isArray(shape)) return false;
	// Check if every element is either null or a non-negative integer number
	return shape.every(dim => dim === null || (typeof dim === 'number' && Number.isInteger(dim) && dim >= 0));
}

function get_selected_loss_function() {
	if (typeof $ === 'undefined' || typeof tf === 'undefined') {
		throw new Error("Failed to get loss function: jQuery ($) or TensorFlow (tf) is missing.");
	}

	let selected_loss = $("#loss").val();

	if (!selected_loss || !Object.keys(tf.metrics).includes(selected_loss)) {
		// Default to a common loss if selection or metric is missing
		err(`Selected loss "${selected_loss}" not in tf.metrics. Falling back to 'meanSquaredError'.`);
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
		err("Failed: could not run model.predict.", err);
		// Return a zero tensor if possible to prevent cascading failures
		// The shape is derived from the model output shape
		const outputShape = m.output?.shape || [1, 1];
		const batchSize = outputShape[0] === null ? input.shape[0] : outputShape[0];
		return tf.zeros([batchSize, ...outputShape.slice(1)]);
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
		err("Failed: could not calculate loss.", err);
		return Infinity; // Return high loss on calculation failure
	}
}

function get_loss_from_data(m, input, wanted) {
	try {
		ensure_model_has_layers(m);
		ensure_tensor(input, "input");
		ensure_tensor(wanted, "wanted");
	} catch (e) {
		err(e.message);
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
		err("Failed: tf is not defined. Cannot extract weights.");
		return null;
	}

	try {
		ensure_model_has_layers(m);
	} catch (e) {
		err(e.message);
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
		err("Failed: tf is not defined. Cannot rebuild weights.");
		return;
	}

	if (!m || !Array.isArray(arr) || !Array.isArray(sizes) || !Array.isArray(shapes)) {
		err("Invalid inputs for rebuild_weights_from_flat.");
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
				err("Rebuild failed: metadata mismatch (sizes/shapes).");
				return;
			}

			let size = sizes[li];
			let shape = shapes[li];

			let chunk = arr.slice(offset, offset + size);

			offset += size;
			li++;

			// Ensure chunk size matches expected size
			if (chunk.length !== size) {
				err(`Rebuild failed: chunk size mismatch for weight ${w.name}. Expected ${size}, got ${chunk.length}.`);
				return;
			}

			let t = null;
			try {
				// Create the tensor using tf.tensor
				t = tf.tensor(chunk, shape);
				tensors.push(t);
			} catch (err) {
				err(`Failed to create tensor for weight ${w.name}: ${err.message}`);
				tensors.forEach(t => dispose(t)); // Clean up on failure, await not possible here
				return;
			}
		}

		try {
			layer.setWeights(tensors);
		} catch (err) {
			err(`Failed: layer.setWeights failed for layer ${layer.name}. ${err.message}`);
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

function generate_orthogonal_vector(v1) {
	const dim = v1.length;
	let v2 = generate_random_vector(dim);
	let proj = compute_dot(v2, v1);
	let orthogonal_v2 = subtract_mul(v2, v1, proj);

	// Fallback if subtraction resulted in a zero vector (highly unlikely)
	if (vector_norm(orthogonal_v2) === 0) {
		orthogonal_v2 = generate_random_vector(dim); // just return a new random one
	}

	return normalize_vector(orthogonal_v2);
}


function fallback_axes(d) {
	let f1 = new Array(d).fill(0);
	let f2 = new Array(d).fill(0);
	if (d > 0) f1[0] = 1;
	if (d > 1) f2[1] = 1;
	else if (d === 1) f2[0] = 0;
	return [f1, f2];
}

/* -------------------- DIMENSION REDUCTION METHODS -------------------- */

// Method 1: Loss-Aware PCA (Original Implementation)
function computeLossAwarePCA(dim, m, original_flat, sizes, shapes, input, wanted, sample_count = 48) {
	if (typeof tf === 'undefined') {
		err("Failed: tf is not defined. Cannot compute Loss-Aware PCA.");
		return fallback_axes(dim);
	}

	try {
		if (!m || !original_flat || dim < 2) {
			throw new Error("computeLossAwarePCA: invalid model, weights, or dimension (< 2).");
		}

		let N = Math.min(Math.max(8, sample_count || 48), 200);
		N = Math.min(N, dim);

		let norm_w = vector_norm(original_flat);
		let eps = 1e-4;
		if (norm_w > 0) {
			eps = 1e-3 * (norm_w / Math.sqrt(Math.max(1, dim)));
		}

		let samples = [];
		let derivs = [];

		for (let i = 0; i < N; i++) {
			let v = normalize_vector(generate_random_vector(dim));
			if (vector_norm(v) === 0) continue; // Skip zero vector

			let pert_plus = new Array(dim);
			let pert_minus = new Array(dim);
			for (let k = 0; k < dim; k++) {
				let step = eps * v[k];
				pert_plus[k] = (original_flat[k] || 0) + step;
				pert_minus[k] = (original_flat[k] || 0) - step;
			}

			rebuild_weights_from_flat(m, pert_plus, sizes, shapes);
			let loss_plus = tf.tidy(() => get_loss_from_data(m, input, wanted));

			rebuild_weights_from_flat(m, pert_minus, sizes, shapes);
			let loss_minus = tf.tidy(() => get_loss_from_data(m, input, wanted));

			let delta_signed = (loss_plus - loss_minus) / (2 * eps);

			if (!isFinite(delta_signed) || Number.isNaN(delta_signed)) {
				delta_signed = 0;
			}

			let row = new Array(dim);
			let anyNonZero = false;
			for (let k = 0; k < dim; k++) {
				row[k] = v[k] * delta_signed;
				if (Math.abs(row[k]) > 1e-24) anyNonZero = true;
			}

			if (!anyNonZero) {
				let tiny = 1e-12;
				for (let k = 0; k < dim; k++) {
					row[k] = (v[k] || 0) * tiny;
				}
			}

			samples.push(row);
			derivs.push(delta_signed);
		}

		rebuild_weights_from_flat(m, original_flat, sizes, shapes);

		if (samples.length < 2) {
			return fallback_axes(dim);
		}

		// --- Encapsulated Power Iteration Functions (Moved here for self-containment) ---

		function compute_dot_local(a, b) {
			let s = 0;
			for (let i = 0; i < a.length; i++) {
				s += (a[i] || 0) * (b[i] || 0);
			}
			return s;
		}

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

		function normalizeVec(v) {
			let n = Math.sqrt(compute_dot_local(v, v));
			if (n === 0) return v.slice();
			let out = new Array(v.length);
			for (let i = 0; i < v.length; i++) {
				out[i] = (v[i] || 0) / n;
			}
			return out;
		}

		function scalarMulVec(scalar, v) {
			let out = new Array(v.length);
			for (let i = 0; i < v.length; i++) {
				out[i] = (v[i] || 0) * (scalar || 0);
			}
			return out;
		}

		function powerIterationMatrix(mat, iterations = 300, tol = 1e-8) {
			let n = mat.length;
			let b = normalizeVec(generate_random_vector(n));
			let lambda_old = 0;
			let final_b = b;
			let final_eigenvalue = 0;

			for (let it = 0; it < iterations; it++) {
				let Mb = matVecMul(mat, b);
				let norm_Mb = Math.sqrt(Math.max(1e-24, compute_dot_local(Mb, Mb)));
				if (norm_Mb === 0) break;

				let b_next = scalarMulVec(1.0 / norm_Mb, Mb);
				let ray = compute_dot_local(b_next, matVecMul(mat, b_next));

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


		// Build Gram matrix K = samples * samples^T (N x N)
		let K = new Array(N);
		for (let i = 0; i < N; i++) {
			K[i] = new Array(N);
			for (let j = 0; j < N; j++) {
				K[i][j] = compute_dot(samples[i], samples[j]);
			}
		}

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

		function mapToParameterSpace(u) {
			let pc = new Array(dim).fill(0);
			for (let k = 0; k < dim; k++) {
				for (let i = 0; i < N; i++) {
					pc[k] += (u[i] || 0) * (samples[i] && samples[i][k] ? samples[i][k] : 0);
				}
			}

			let norm_pc = vector_norm(pc);
			if (norm_pc === 0) {
				return normalize_vector(generate_random_vector(dim));
			}
			return normalize_vector(pc);
		}

		let PC1 = mapToParameterSpace(u1);
		let PC2 = mapToParameterSpace(u2);

		// orthogonalize PC2 w.r.t PC1 and normalize
		if (vector_norm(PC1) !== 0 && vector_norm(PC2) !== 0) {
			let proj = compute_dot(PC2, PC1);
			PC2 = subtract_mul(PC2, PC1, proj);
			if (vector_norm(PC2) === 0) {
				PC2 = generate_orthogonal_vector(PC1);
			} else {
				PC2 = normalize_vector(PC2);
			}
			PC1 = normalize_vector(PC1);
		} else {
			return fallback_axes(dim);
		}


		if (PC1.length !== dim || PC2.length !== dim) {
			return fallback_axes(dim);
		}

		return [PC1, PC2];

	} catch (err) {
		err(`computeLossAwarePCA failed: ${err.message}`);
		err(err);
		return fallback_axes(dim);
	}
}


// Method 2: Random Directions (Standard)
function computeRandom(dim, m, original_flat, sizes, shapes, input, wanted) {
	if (dim < 2) return fallback_axes(dim);

	let PC1 = normalize_vector(generate_random_vector(dim));
	let PC2 = generate_orthogonal_vector(PC1);

	// Check for zero vectors after normalization/orthogonalization
	if (vector_norm(PC1) === 0 || vector_norm(PC2) === 0) {
		return fallback_axes(dim);
	}

	return [PC1, PC2];
}

// Method 3: Weight-Space Standard Basis (First two parameters)
function computeStandardBasis(dim, m, original_flat, sizes, shapes, input, wanted) {
	if (dim < 2) return fallback_axes(dim);

	let PC1 = new Array(dim).fill(0);
	let PC2 = new Array(dim).fill(0);

	PC1[0] = 1.0;
	PC2[1] = 1.0;

	return [PC1, PC2];
}

// Method 4: Filter-Normalized Random Directions (A variant of random directions)
function computeFilterNormalizedRandom(dim, m, original_flat, sizes, shapes, input, wanted) {
	if (dim < 2) return fallback_axes(dim);

	// This method requires structural knowledge (layer/weight info) which is not readily available
	// to the dimension reduction function here. As a proxy, we use simple random directions
	// but scale them by the inverse of the L2 norm of the original weights to introduce
	// a form of "normalization" relative to the weight magnitudes. (A simplification)
	let PC1 = normalize_vector(generate_random_vector(dim));
	let PC2 = generate_orthogonal_vector(PC1);

	// A very simple normalization proxy: scale axes by 1/sqrt(norm of original weights)
	// This helps explore scales relative to the current weights.
	let norm_w = vector_norm(original_flat);
	let scale = (norm_w > 1e-6) ? 1.0 / Math.sqrt(norm_w) : 1.0;

	PC1 = scalarMulVec(scale, PC1);
	PC2 = scalarMulVec(scale, PC2);

	PC1 = normalize_vector(PC1);
	PC2 = normalize_vector(PC2);

	if (vector_norm(PC1) === 0 || vector_norm(PC2) === 0) {
		return fallback_axes(dim);
	}

	return [PC1, PC2];
}

// Method 5: Sharpness-Aware Directions (A highly simplified proxy for second derivative)
function computeSharpnessAware(dim, m, original_flat, sizes, shapes, input, wanted, sample_count = 12) {
	if (dim < 2) return fallback_axes(dim);

	// Instead of a full Hessian calculation, this proxy focuses on the highest
	// loss point in a small random neighborhood (Maximum loss direction).

	let best_direction = generate_random_vector(dim); // Default fallback
	let max_loss = tf.tidy(() => get_loss_from_data(m, input, wanted));
	let norm_w = vector_norm(original_flat);
	let radius = (norm_w > 0) ? 0.001 * norm_w : 0.01;

	// Search for direction that maximizes loss in a tiny sphere
	for (let i = 0; i < sample_count; i++) {
		let v = normalize_vector(generate_random_vector(dim));
		if (vector_norm(v) === 0) continue;

		let pert = new Array(dim);
		for (let k = 0; k < dim; k++) {
			pert[k] = (original_flat[k] || 0) + radius * v[k];
		}

		rebuild_weights_from_flat(m, pert, sizes, shapes);
		let current_loss = tf.tidy(() => get_loss_from_data(m, input, wanted));

		if (current_loss > max_loss) {
			max_loss = current_loss;
			best_direction = v;
		}
	}

	// Restore original weights
	rebuild_weights_from_flat(m, original_flat, sizes, shapes);

	// PC1 is the max loss direction, PC2 is orthogonal to it
	let PC1 = normalize_vector(best_direction);
	let PC2 = generate_orthogonal_vector(PC1);

	if (vector_norm(PC1) === 0 || vector_norm(PC2) === 0) {
		return fallback_axes(dim);
	}

	return [PC1, PC2];
}

/**
 * Public function to get the principal directions based on the chosen method.
 * @param {string} method - The dimension reduction method name.
 * @returns {Array<Array<number>>} - [PC1, PC2] normalized direction vectors.
 */
function get_directions_for_method(method, dim, m, original_flat, sizes, shapes, input, wanted) {
	log(`Using dimension reduction method: ${method}`);

	const methods = {
		'loss_aware_pca': computeLossAwarePCA,
		'random_directions': computeRandom,
		'standard_basis': computeStandardBasis,
		'filter_normalized_random': computeFilterNormalizedRandom,
		'sharpness_aware_proxy': computeSharpnessAware
	};

	let fn = methods[method];

	if (!fn) {
		err(`Unknown dimension reduction method: ${method}. Falling back to 'loss_aware_pca'.`);
		fn = computeLossAwarePCA;
	}

	// Ensure we only pass necessary arguments to the function
	let axes = fn(dim, m, original_flat, sizes, shapes, input, wanted);

	// Final validation and normalization (doubly safe)
	if (!Array.isArray(axes) || axes.length !== 2 || axes[0].length !== dim || axes[1].length !== dim) {
		err(`Direction generation failed for ${method}. Returning fallback axes.`);
		return fallback_axes(dim);
	}

	return [normalize_vector(axes[0]), normalize_vector(axes[1])];
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
		// NOTE: The original code used axis2 for 'a' and axis1 for 'b' when generating the grid.
		// We maintain this mapping (PC1 maps to b/x-axis, PC2 maps to a/y-axis) for consistency.
		mod[k] = (original_flat[k] || 0) + a * (axis2[k] || 0) + b * (axis1[k] || 0);
	}

	return mod;
}

/* -------------------- GRID EVALUATION -------------------- */

function evaluate_loss_grid(m, original_flat, PC1, PC2, r1, r2, step1, step2, steps, sizes, shapes, input, wanted, progress_callback) {
	if (steps < 2) {
		err("Steps must be >= 2 for grid evaluation.");
		return [[], [], []];
	}

	let x = [];
	let y = [];
	let z = [];

	const total = steps * steps;
	let count = 0;

	// Check for valid range objects and step values
	if (!r1 || !r2 || typeof step1 !== 'number' || typeof step2 !== 'number') {
		err("Invalid range or step values.");
		return [[], [], []];
	}

	// Range 2 (PC2) corresponds to the 'y' dimension (outer loop, variable 'a')
	// Range 1 (PC1) corresponds to the 'x' dimension (inner loop, variable 'b')
	for (let i = 0; i < steps; i++) {
		let a = r2.min + i * step2;

		for (let j = 0; j < steps; j++) {
			let b = r1.min + j * step1;

			let loss_val = Infinity;

			// ... (tf.tidy block for loss calculation) ...
			tf.tidy(() => {
				let mod = generate_modified_flat(original_flat, PC1, PC2, a, b);

				try {
					rebuild_weights_from_flat(m, mod, sizes, shapes);
					loss_val = get_loss_from_data(m, input, wanted);
				} catch (e) {
					// Log error and keep loss_val at Infinity
					err("Grid point evaluation failed:", e.message);
				}
			});


			x.push(b); // Corresponds to PC1 (b)
			y.push(a); // Corresponds to PC2 (a)
			z.push(loss_val);

			count++;
			// NEW: Call the callback function to update progress
			if (progress_callback) {
				progress_callback(count, total);
			}
		}
	}

	return [x, y, z];
}

/* -------------------- MAIN LANDSCAPE DATA FUNCTION -------------------- */

function get_loss_landscape_plot_data(m, input, wanted, steps, mult, method, progress_callback) {
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
	if (typeof method !== 'string' || method === '') {
		method = 'loss_aware_pca'; // Default method
	}

	try {
		ensure_model_has_layers(m);
		ensure_tensor(input, "input");
		ensure_tensor(wanted, "wanted");
	} catch (e) {
		err(e.message);
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

	// Get principal components using the chosen method
	let pcs = get_directions_for_method(method, dim, m, original_flat, sizes, shapes, input, wanted);
	let PC1 = pcs[0];
	let PC2 = pcs[1];

	if (!PC1 || !PC2) {
		err(`Direction calculation failed for method ${method}.`);
		rebuild_weights_from_flat(m, original_flat, sizes, shapes); // Restore weights
		return null;
	}

	// Get range and step, robust to potential axis length/data issues
	let r1, r2, step1, step2;
	try {
		r1 = get_projection_range(PC1, original_flat, fixed_range_radius); // PC1 maps to x-axis
		r2 = get_projection_range(PC2, original_flat, fixed_range_radius); // PC2 maps to y-axis
		step1 = get_step(r1.min, r1.max, steps);
		step2 = get_step(r2.min, r2.max, steps);
	} catch (e) {
		err("Range or step calculation failed: " + e.message);
		rebuild_weights_from_flat(m, original_flat, sizes, shapes); // Restore weights
		return null;
	}

	let data = evaluate_loss_grid(m, original_flat, PC1, PC2, r1, r2, step1, step2, steps, sizes, shapes, input, wanted, progress_callback);

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
		err("Failed: Grid is not square. Length: " + x_flat.length);
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

function plot_loss_landscape_surface(data, div_id, method) {
	if (typeof Plotly === 'undefined') {
		err("Plotly is not defined. Cannot plot loss landscape.");
		return;
	}
	if (!data || data.length !== 3 || data[0].length === 0) {
		err("No data or invalid data format for plotting.");
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

		const titleMap = {
			'loss_aware_pca': 'Loss-Aware PCA Directions',
			'random_directions': 'Random Orthogonal Directions',
			'standard_basis': 'Standard Basis (1st & 2nd parameter)',
			'filter_normalized_random': 'Filter-Normalized Random Directions Proxy',
			'sharpness_aware_proxy': 'Sharpness-Aware Direction Proxy'
		};

		const methodTitle = titleMap[method] || method;

		let trace = {
			x: x,
			y: y,
			z: z,
			type: "surface",
			colorscale: "Viridis",
			name: `Loss Landscape (${methodTitle})`
		};

		let layout = {
			title: `Loss Landscape Visualization: ${methodTitle}`,
			paper_bgcolor: "rgba(0,0,0,0)",
			plot_bgcolor: "rgba(0,0,0,0)",
			scene: {
				xaxis: { title: { text: "Direction 1" }, backgroundcolor: "rgba(0,0,0,0)" },
				yaxis: { title: { text: "Direction 2" }, backgroundcolor: "rgba(0,0,0,0)" },
				zaxis: { title: { text: "Loss" }, backgroundcolor: "rgba(0,0,0,0)" }
			},
			margin: { t: 40 },
			autosize: true
		};

		let config = {
			responsive: true
		};

		$(container).html("");

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
				err("ResizeObserver failed to initialize:", err);
			}
		}
	} catch (err) {
		err(`Plotly plotting failed: ${err.message}`);
		err(err);
	}
}

/* -------------------- PUBLIC WRAPPERS (ROBUST API) -------------------- */

function plot_loss_landscape_from_model_and_data(m, input, wanted, steps, mult, div_id, method, progress_callback) {
	// Basic checks for external dependencies
	if (typeof tf === 'undefined') {
		err("TensorFlow.js (tf) is not defined. Cannot proceed.");
		return;
	}

	if (!m || !input || !wanted) {
		err("Model, input, or wanted data is missing.");
		return;
	}

	// Default parameters for robustness
	if (typeof steps !== 'number') steps = 20;
	if (typeof mult !== 'number') mult = 2;
	if (typeof div_id === "undefined" || div_id === null) div_id = "";
	if (typeof method !== 'string') method = 'loss_aware_pca';

	let data = null;
	try {
		// MODIFIED CALL: Pass the callback
		data = get_loss_landscape_plot_data(m, input, wanted, steps, mult, method, progress_callback);
	} catch (e) {
		err("Error in generating loss landscape data: " + e.message);
		err(e);
	}

	if (data !== null) {
		plot_loss_landscape_surface(data, div_id, method);
	}
}

function model_shape_is_compatible(modelShape, dataShape) {
	// Use the new helper function to validate both shapes
	if (!isShapeArray(modelShape) || !isShapeArray(dataShape) || modelShape.length !== dataShape.length) {
		err("Shape rank mismatch or invalid shape arguments.");
		return false;
	}

	for (let i = 0; i < modelShape.length; i++) {
		const modelDim = modelShape[i];
		const dataDim = dataShape[i];

		// Ensure dataDim is a valid positive integer
		if (typeof dataDim !== "number" || !Number.isInteger(dataDim) || dataDim <= 0) {
			err(`Invalid data dimension at index ${i}: ${dataDim}.`);
			return false;
		}

		// Handle null (batch size) or a fixed dimension in the model shape
		if (modelDim !== null) {
			if (typeof modelDim !== "number" || !Number.isInteger(modelDim) || modelDim <= 0) {
				err(`Invalid model dimension at index ${i}: ${modelDim}.`);
				return false;
			}

			if (modelDim !== dataDim) {
				err(`Dimension mismatch at index ${i}: model expects ${modelDim} but data has ${dataDim}.`);
				return false;
			}
		}
	}
	return true;
}

async function plot_loss_landscape_from_model(progress_callback, steps = 20, mult = 50, div_id = null, method = 'loss_aware_pca') {
	if (typeof tf === 'undefined') {
		err("TensorFlow.js (tf) is not defined. Cannot proceed.");
		return false;
	}

	// Check for global model and required external functions
	if (typeof model === 'undefined' || typeof get_x_and_y !== 'function' || typeof dispose !== 'function') {
		err("External dependencies (global 'model', 'get_x_and_y', or 'dispose') are missing.");
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
			err("Failed to get valid x and y tensors from get_x_and_y.");
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
		plot_loss_landscape_from_model_and_data(model, x, y, steps, mult, div_id, method, progress_callback);
		success = true;

	} catch (e) {
		err(`Failed to plot loss landscape: ${e.message}`);
		err(e);
	} finally {
		// CRITICAL: Always dispose of tensors and end the scope
		if (x) await dispose(x);
		if (y) await dispose(y);
		tf.engine().endScope();
		log("TensorFlow engine scope ended and temporary tensors disposed.");
	}

	return success;
}

async function run_loss_landscape_from_ui() {
	const original_jump_to_interesting = $("#jump_to_interesting_tab").is(":checked");

	$("#jump_to_interesting_tab").attr('checked', false);

	await gui_in_training(0);

	var steps_input       = document.getElementById("loss_landscape_steps");
	var mult_input        = document.getElementById("loss_landscape_mult");
	var method_select     = document.getElementById("loss_landscape_method");

	// ... (Existing validation) ...

	var steps_value = parseInt(steps_input.value, 10);
	var mult_value  = parseFloat(mult_input.value);                                 
	var div_id_value = "loss_landscape";
	var method_value = method_select.value;

	// ... (Existing validation) ...

	// Spinner und Meldung inline im Div
	var target_div = document.getElementById(div_id_value);
	var spinner = null; // Declare for later use
	var msg = null;     // Declare for later use

	if (target_div) {
		target_div.innerHTML = "";
		target_div.style.display = "flex";
		target_div.style.flexDirection = "column";
		target_div.style.alignItems = "center";
		target_div.style.justifyContent = "center";
		target_div.style.minHeight = "100px";

		// Spinner erstellen
		spinner = document.createElement("div"); // Assign to variable
		spinner.style.border = "8px solid #f3f3f3";
		spinner.style.borderTop = "8px solid #3498db";
		spinner.style.borderRadius = "50%";
		spinner.style.width = "60px";
		spinner.style.height = "60px";
		spinner.style.animation = "spin 1s linear infinite";
		spinner.style.marginBottom = "10px";

		// Keyframes für Spin-Animation
		var style = document.createElement("style");
		style.type = "text/css";
		style.innerHTML = `
	    @keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	    }
	`;
		document.getElementsByTagName("head")[0].appendChild(style);

		// Textmeldung
		msg = document.createElement("div"); // Assign to variable
		msg.innerText = "Calculating loss landscape, this may take some time, depending on your parameters...";

		target_div.appendChild(spinner);
		target_div.appendChild(msg);
	}

	// NEW: Define the progress callback
	const progress_callback = (current, total) => {
		if (msg) {
			window.requestAnimationFrame(() => {
				msg.innerText = `Evaluating grid point ${current} of ${total} (${Math.round((current / total) * 100)}%).`;
			});
		}
	};

	let plot_success = false;

	try {                                          
		// MODIFIED CALL: Pass the progress callback
		plot_success = await plot_loss_landscape_from_model(progress_callback, steps_value, mult_value, div_id_value, method_value);
	}
	catch (err) {
		err("Error while calling plot_loss_landscape_from_model:", err);
		if (target_div) {
			target_div.innerHTML = "<p style='color:red;'>Error calculating loss landscape. Check console for details.</p>";
		}
	} finally {
		// NEW: Remove the spinner and message on completion (success or failure)
		if (target_div && !plot_success) {
			// If it failed and the inner part didn't set a failure message, clear the spinner
			if (spinner && target_div.contains(spinner)) target_div.removeChild(spinner);
			if (msg && target_div.contains(msg)) target_div.removeChild(msg);
		} else if (target_div && plot_success) {
			// If it succeeded, the Plotly plot replaces the spinner content.
			// We only need to ensure the container's temporary style is gone.
			target_div.style.display = "block";
			target_div.style.minHeight = "auto";
			// Plotly.newPlot will automatically replace the children (spinner/msg)
		}

		$("#jump_to_interesting_tab").attr('checked', original_jump_to_interesting);
		await gui_not_in_training();
	}

	return plot_success;
}
