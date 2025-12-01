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

function computePCA(dim, m, original_flat, sizes, shapes, input, wanted, sample_count, enableDiagnostics = false) {
    try {
        if(!m) {
            throw new Error("computePCA: model m is required");
        }

        // defaults
        if(typeof sample_count === "undefined" || sample_count === null) {
            sample_count = 48;
        }

        // sensible bounds on sample_count
        if(sample_count <= 4) {
            sample_count = 8;
        }
        if(sample_count > 200) {
            sample_count = 200;
        }
        if(sample_count > dim) {
            sample_count = Math.min(sample_count, dim);
        }

        // compute small epsilon relative to weight magnitude and dimension
        let norm_w = vector_norm(original_flat);
        let eps = 1e-3;
        if(norm_w > 0) {
            eps = 1e-3 * (norm_w / Math.sqrt(Math.max(1, dim)));
        } else {
            eps = 1e-4;
        }

        // helper: baseline loss as number
        let baseline_loss = tf.tidy(function() {
            return get_loss_from_data(m, input, wanted);
        });

        // arrays to collect sample rows and derivative magnitudes
        let samples = []; // each is length dim
        let derivs = [];  // signed directional derivative per sample (scalar)

        for(let i = 0; i < sample_count; i++) {
            // create a random direction and normalize it
            let v = generate_random_vector(dim);
            let vnorm = vector_norm(v);
            if(vnorm === 0) {
                v = new Array(dim).fill(0);
                v[i % dim] = 1;
                vnorm = 1;
            }
            for(let k = 0; k < dim; k++) {
                v[k] = v[k] / vnorm;
            }

            // build perturbed weights: original +/- eps * v
            let pert_plus = new Array(dim);
            let pert_minus = new Array(dim);
            for(let k = 0; k < dim; k++) {
                let step = eps * v[k];
                pert_plus[k] = original_flat[k] + step;
                pert_minus[k] = original_flat[k] - step;
            }

            // set model weights to pert_plus and measure loss
            rebuild_weights_from_flat(m, pert_plus, sizes, shapes);
            let loss_plus = tf.tidy(function() {
                return get_loss_from_data(m, input, wanted);
            });

            // set model weights to pert_minus and measure loss
            rebuild_weights_from_flat(m, pert_minus, sizes, shapes);
            let loss_minus = tf.tidy(function() {
                return get_loss_from_data(m, input, wanted);
            });

            // central finite difference: directional derivative estimate (signed)
            // derivative ~= (loss_plus - loss_minus) / (2 * eps)
            // Use (loss_plus - loss_minus) directly as coefficient — scaling by (1/(2*eps)) only rescales Gram matrix uniformly.
            let delta_signed = (loss_plus - loss_minus) / (2 * eps);

            // If derivative is NaN or non-finite, set tiny value to avoid degenerate rows
            if(!isFinite(delta_signed) || Number.isNaN(delta_signed)) {
                delta_signed = 0;
            }

            // push a signed sample row (v * derivative)
            let row = new Array(dim);
            let anyNonZero = false;
            for(let k = 0; k < dim; k++) {
                row[k] = v[k] * delta_signed;
                if(row[k] !== 0) anyNonZero = true;
            }

            // if row degenerated to all zeros (derivative tiny), keep a tiny random perturbation to avoid losing rank
            if(!anyNonZero) {
                let tiny = 1e-18;
                for(let k = 0; k < dim; k++) {
                    row[k] = v[k] * tiny;
                }
            }

            samples.push(row);
            derivs.push(delta_signed);
        }

        // restore original weights
        rebuild_weights_from_flat(m, original_flat, sizes, shapes);

        // diagnostics: print derivative statistics if requested
        if(enableDiagnostics) {
            // compute min/max/mean/std
            let sum = 0;
            let sumsq = 0;
            let minv = Number.POSITIVE_INFINITY;
            let maxv = Number.NEGATIVE_INFINITY;
            for(let d of derivs) {
                sum += d;
                sumsq += d * d;
                if(d < minv) minv = d;
                if(d > maxv) maxv = d;
            }
            let mean = sum / derivs.length;
            let variance = Math.max(0, (sumsq / derivs.length) - mean * mean);
            let std = Math.sqrt(variance);
            console.log("computePCA diagnostics:",
                        "samples=", derivs.length,
                        "eps=", eps,
                        "deriv_min=", minv,
                        "deriv_max=", maxv,
                        "deriv_mean=", mean,
                        "deriv_std=", std);
        }

        // fallback if too few effective samples
        let N = samples.length;
        if(N < 2) {
            // fallback: simple orthonormal pair
            let fallback1 = generate_random_vector(dim);
            let fallback2 = generate_random_vector(dim);
            return [normalize_vector(fallback1), normalize_vector(fallback2)];
        }

        // Build Gram matrix K = samples * samples^T (N x N)
        // Note: samples rows are v * derivative, so K reflects directional covariance
        let K = new Array(N);
        for(let i = 0; i < N; i++) {
            K[i] = new Array(N);
            for(let j = 0; j < N; j++) {
                K[i][j] = compute_dot(samples[i], samples[j]);
            }
        }

        // matrix-vector multiply
        function matVecMul(mat, vec) {
            let out = new Array(mat.length);
            for(let i = 0; i < mat.length; i++) {
                let s = 0;
                let row = mat[i];
                for(let j = 0; j < row.length; j++) {
                    s += row[j] * vec[j];
                }
                out[i] = s;
            }
            return out;
        }

        function vecDot(a, b) {
            let s = 0;
            for(let i = 0; i < a.length; i++) {
                s += a[i] * b[i];
            }
            return s;
        }

        function scalarMulVec(scalar, v) {
            let out = new Array(v.length);
            for(let i = 0; i < v.length; i++) {
                out[i] = v[i] * scalar;
            }
            return out;
        }

        function normalizeVec(v) {
            let n = Math.sqrt(vecDot(v, v));
            if(n === 0) return v.slice();
            let out = new Array(v.length);
            for(let i = 0; i < v.length; i++) {
                out[i] = v[i] / n;
            }
            return out;
        }

        // power iteration for top eigenvector of small matrix
        function powerIterationMatrix(mat, iterations = 300, tol = 1e-8) {
            let n = mat.length;
            let b = new Array(n);
            for(let i = 0; i < n; i++) {
                b[i] = Math.random() * 2 - 1;
            }
            b = normalizeVec(b);
            let lambda_old = 0;

            for(let it = 0; it < iterations; it++) {
                let Mb = matVecMul(mat, b);
                let lambda = Math.sqrt(Math.max(1e-24, vecDot(Mb, Mb)));
                if(lambda === 0) {
                    break;
                }
                let b_next = scalarMulVec(1.0 / lambda, Mb);
                let ray = vecDot(b_next, matVecMul(mat, b_next));
                if(Math.abs(ray - lambda_old) < tol) {
                    b = b_next;
                    lambda_old = ray;
                    break;
                }
                b = b_next;
                lambda_old = ray;
            }
            let Mb_final = matVecMul(mat, b);
            let eigenvalue = vecDot(b, Mb_final);
            return { eigenvector: b, eigenvalue: eigenvalue };
        }

        // first eigenpair
        let p1 = powerIterationMatrix(K);
        let u1 = p1.eigenvector;
        let lambda1 = p1.eigenvalue;

        // deflate K to get second eigenvector
        let K2 = new Array(N);
        for(let i = 0; i < N; i++) {
            K2[i] = new Array(N);
            for(let j = 0; j < N; j++) {
                K2[i][j] = K[i][j] - lambda1 * u1[i] * u1[j];
            }
        }

        let p2 = powerIterationMatrix(K2);
        let u2 = p2.eigenvector;

        // map eigenvectors from sample-space back to full parameter space:
        function mapToParameterSpace(u) {
            let pc = new Array(dim);
            for(let k = 0; k < dim; k++) { pc[k] = 0; }
            for(let i = 0; i < N; i++) {
                let coeff = u[i];
                let row = samples[i];
                for(let k = 0; k < dim; k++) {
                    pc[k] += coeff * row[k];
                }
            }
            let norm_pc = vector_norm(pc);
            if(norm_pc === 0) {
                let fallback = generate_random_vector(dim);
                return normalize_vector(fallback);
            }
            return normalize_vector(pc);
        }

        let PC1 = mapToParameterSpace(u1);
        let PC2 = mapToParameterSpace(u2);

        // orthogonalize PC2 w.r.t PC1 and normalize
        if(vector_norm(PC1) === 0 || vector_norm(PC2) === 0) {
            let f1 = generate_random_vector(dim);
            let f2 = generate_random_vector(dim);
            PC1 = normalize_vector(f1);
            PC2 = normalize_vector(f2);
        } else {
            let proj = compute_dot(PC2, PC1);
            PC2 = subtract_mul(PC2, PC1, proj);
            if(vector_norm(PC2) === 0) {
                let fallback = generate_random_vector(dim);
                PC2 = normalize_vector(fallback);
            } else {
                PC2 = normalize_vector(PC2);
            }
            PC1 = normalize_vector(PC1);
        }

        return [PC1, PC2];
    } catch(err) {
        console.error(err);
        console.trace();
        // fallback: two coordinate axes
        let f1 = new Array(dim).fill(0);
        let f2 = new Array(dim).fill(0);
        f1[0] = 1;
        if(dim > 1) {
            f2[1] = 1;
        } else {
            f2[0] = 0;
        }
        return [f1, f2];
    }
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

/* -------------------- MAIN LANDSCAPE DATA FUNCTION (REPLACED TO CALL LOSS-AWARE PCA) -------------------- */

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

	// Use the loss-aware PCA that samples perturbations and finds directions
	// the loss is most sensitive to. This usually gives a more "interesting"
	// landscape than two purely random orthonormal vectors.
	let pcs = computePCA(dim, m, original_flat, sizes, shapes, input, wanted, 48);
	let PC1 = pcs[0];
	let PC2 = pcs[1];

	let r1 = get_projection_range(PC1, original_flat, fixed_range_radius);
	let r2 = get_projection_range(PC2, original_flat, fixed_range_radius);

	let step1 = get_step(r1.min, r1.max, steps);
	let step2 = get_step(r2.min, r2.max, steps);

	let data = evaluate_loss_grid(m, original_flat, PC1, PC2, r1, r2, step1, step2, steps, sizes, shapes, input, wanted);

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
	container.style.height = "800px";
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

function plot_loss_landscape_from_model_and_data(m, input, wanted, steps, mult, div_id) {
	if(typeof div_id === "undefined" || div_id === null) {
		div_id = "";
	}
	let data = get_loss_landscape_plot_data(m, input, wanted, steps, mult);

	if(data !== null) {
		plot_loss_landscape_surface(data, div_id);
	}
}

function model_shape_is_compatible(modelShape, dataShape) {
    if (!Array.isArray(modelShape)) {
        console.error("modelShape must be an array");
        return false;
    }

    if (!Array.isArray(dataShape)) {
        console.error("dataShape must be an array");
        return false;
    }

    if (modelShape.length !== dataShape.length) {
        console.error(
            "Shape rank mismatch: model has " +
            modelShape.length +
            " dimensions, data has " +
            dataShape.length +
            " dimensions"
        );
        return false;
    }

    for (let i = 0; i < modelShape.length; i++) {
        let modelDim = modelShape[i];
        let dataDim = dataShape[i];

        if (modelDim !== null) {
            if (typeof modelDim !== "number") {
                console.error("Invalid model dimension type at index " + i);
                return false;
            }

            if (!Number.isInteger(modelDim)) {
                console.error("Model dimension at index " + i + " is not an integer");
                return false;
            }

            if (modelDim <= 0) {
                console.error("Model dimension at index " + i + " must be greater than 0");
                return false;
            }
        }

        if (typeof dataDim !== "number") {
            console.error("Invalid data dimension type at index " + i);
            return false;
        }

        if (!Number.isInteger(dataDim)) {
            console.error("Data dimension at index " + i + " is not an integer");
            return false;
        }

        if (dataDim <= 0) {
            console.error("Data dimension at index " + i + " must be greater than 0");
            return false;
        }

        if (modelDim === null) {
            continue;
        }

        if (modelDim !== dataDim) {
            console.error(
                "Dimension mismatch at index " +
                i +
                ": model expects " +
                modelDim +
                " but data has " +
                dataDim
            );
            return false;
        }
    }

    return true;
}

async function plot_loss_landscape_from_model(steps, mult, div_id = null) {
	if(typeof mult === "undefined" || mult === null) {
		mult = 2;
	}
	let xy = await get_x_and_y();

	let x = xy["x"];
	let y = xy["y"];
	
	if (!model_shape_is_compatible(model.input.shape, xy["x"].shape)) {
		await dispose(x);
		await dispose(y);
		return false;
	}

	if (!model_shape_is_compatible(model.output.shape, xy["y"].shape)) {
		await dispose(x);
		await dispose(y);
		return false;
	}

	plot_loss_landscape_from_model_and_data(model, x, y, steps, mult, div_id);
	
	await dispose(x);
	await dispose(y);
	
	return true;
}
