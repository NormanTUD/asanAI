"use strict";

// ============================================================
// MATH VALUE TOOLTIPS
//
// In static math mode every number written by math_mode.js is
// wrapped in \class{mv-...}{value} (see mv_wrap_value). Temml
// renders those classes onto MathML elements. This file:
//
// 1. decodes "mv-<kind>-L<layer>-<indices...>[-<weight_name>]"
// 2. attaches a hover tooltip to every tagged number
// 3. computes on demand:
//    - pooled analytic gradient dL/dvalue via tf.variableGrads
//      over the current batch (cached, TTL)
//    - FULL per-sample decomposition: for a dense kernel cell
//      W[i][j] every per-sample gradient IS delta_i * h_j, so
//      the per-sample breakdown is the exact decomposition of
//      where the gradient came from
//    - finite differences for values that are no tf variables
//      (alpha, epsilon, theta, max_value): perturb, forward,
//      measure dL/dvalue
//    - for the symbolic h tokens: numeric activations of the
//      current batch + dL/dh (exact for dense successors)
// ============================================================

var _mvt_tooltip = null;
var _mvt_hover_el = null;
var _mvt_hover_id = 0;
var _mvt_pooled_cache = null;
var _mvt_per_sample_cache = {};
var _mvt_activations_cache = {};
var _mvt_submodel_cache = {};
var _mvt_cache_ttl_ms = 1500;
var _mvt_batch_size = 32;
var _mvt_style_added = false;

// ============================================================
// CLASS DECODING
// ============================================================

function _mvt_decode_class(cls) {
	if (!cls || cls.indexOf("mv-") !== 0) {
		return null;
	}

	var parts = cls.split("-");
	if (parts.length < 3 || parts[0] !== "mv") {
		return null;
	}

	var kind = parts[1];

	var layer_str = parts[2];
	if (layer_str.charAt(0) !== "L" || !/^\d+$/.test(layer_str.substring(1))) {
		return null;
	}

	var tag = {
		kind: kind,
		layer: parse_int(layer_str.substring(1)),
		indices: [],
		weight_name: null
	};

	for (var i = 3; i < parts.length; i++) {
		if (/^-?\d+$/.test(parts[i])) {
			tag.indices.push(parse_int(parts[i]));
		} else {
			tag.weight_name = parts.slice(i).join("-");
			break;
		}
	}

	return tag;
}

function _mvt_find_mv_element(target) {
	var el = target;
	while (el && el !== document) {
		var cls = el.getAttribute ? el.getAttribute("class") : null;
		if (cls && cls.indexOf("mv-") === 0) {
			return el;
		}
		el = el.parentNode;
	}
	return null;
}

// ============================================================
// LAYER / WEIGHT RESOLUTION
// ============================================================

// Maps GUI layer idx -> real tf layer, skipping internal
// skip-connection layers (same rule as get_layer_data()).
function _mvt_tf_layer(gui_idx) {
	if (typeof model === "undefined" || !model || !model.layers) {
		return null;
	}

	var seen = 0;
	for (var i = 0; i < model.layers.length; i++) {
		var lname = model.layers[i].name || "";
		if (lname.includes("skip_proj_") || lname.includes("skip_add_") || lname.includes("skip_scale_")) {
			continue;
		}
		if (seen === gui_idx) {
			return model.layers[i];
		}
		seen++;
	}

	// Fallback: direct index
	if (model.layers[gui_idx]) {
		return model.layers[gui_idx];
	}

	return null;
}

function _mvt_layer_variables(gui_idx) {
	var layer = _mvt_tf_layer(gui_idx);
	if (!layer || !layer.weights) {
		return [];
	}

	var merged = [];
	var seen = {};
	for (var i = 0; i < layer.trainableWeights.length; i++) {
		var w = layer.trainableWeights[i];
		if (w && w.val && !w.val.isDisposed) {
			merged.push(w);
			seen[w.name] = true;
		}
	}
	for (var k = 0; k < layer.weights.length; k++) {
		var w2 = layer.weights[k];
		if (!w2 || !w2.val || w2.val.isDisposed || seen[w2.name]) {
			continue;
		}
		merged.push(w2);
	}

	var vars = [];
	for (var j = 0; j < merged.length; j++) {
		var ww = merged[j];
		if (!ww || !ww.val || ww.val.isDisposed) {
			continue;
		}
		vars.push({ variable: ww.val, name: ww.name || "", original: ww });
	}

	return vars;
}

function _mvt_pick_variable(gui_idx, tag) {
	var candidates = _mvt_layer_variables(gui_idx);
	if (!candidates.length) {
		return null;
	}

	var kind = tag.kind;
	var wanted = null;

	if (kind === "ma") {
		wanted = tag.weight_name;
	} else if (kind === "snake") {
		wanted = "alpha";
	} else if (kind === "kernel") {
		if (tag.weight_name) {
			wanted = tag.weight_name;
		} else {
			wanted = "kernel";
		}
	} else if (kind === "bias") {
		wanted = "bias";
	} else if (kind === "gamma") {
		wanted = "gamma";
	} else if (kind === "beta") {
		wanted = "beta";
	}

	if (wanted === null) {
		return null;
	}

	for (var i = 0; i < candidates.length; i++) {
		var n = candidates[i].name || "";
		if (n.indexOf(wanted) !== -1) {
			return candidates[i];
		}
	}

	// Snake stores its alpha as a scalar weight with an arbitrary name:
	if (kind === "snake" && candidates.length) {
		return candidates[0];
	}

	return null;
}

function _mvt_find_skip_variable(tag) {
	if (typeof model === "undefined" || !model || !model.layers) {
		return null;
	}

	var target_name = tag.weight_name || "";

	for (var i = 0; i < model.layers.length; i++) {
		var layer = model.layers[i];
		var lname = layer.name || "";
		if (lname !== target_name) {
			continue;
		}
		if (layer.trainableWeights && layer.trainableWeights.length) {
			for (var k = 0; k < layer.trainableWeights.length; k++) {
				var w = layer.trainableWeights[k];
				if (w && w.val && !w.val.isDisposed && (w.name || "").includes("kernel")) {
					return { variable: w.val, name: w.name, original: w };
				}
			}
		}
	}

	return null;
}

// The tagged indices are a SUFFIX of the layer's weight shape.
// E.g. a bias cell displayed as "row, cell" tags [0, c] against a
// 1D shape [units]: the leading display-row must be 0 and is skipped.
function _mvt_flat_index(tag) {
	var shape = _mvt_weight_shape(tag);
	if (!shape || !shape.length) {
		return 0;
	}

	var total = shape.reduce(function(a, b) { return a * b; }, 1);
	var n = tag.indices.length;
	var start = shape.length - n;
	var flat = 0;

	for (var k = 0; k < n; k++) {
		var dim_idx = start + k;
		var idx = tag.indices[k];
		if (dim_idx < 0) {
			if (idx !== 0) {
				return -1;
			}
			continue;
		}
		var rem = 1;
		for (var d = dim_idx + 1; d < shape.length; d++) {
			rem *= shape[d];
		}
		flat += idx * rem;
	}

	if (flat < 0 || flat >= total) {
		return -1;
	}

	return flat;
}

// Signature of the currently live model: all trainable weight names.
// Gradients are only valid for the model that produced them — if the
// model is rebuilt/recompiled the names change and we must recompute.
function _mvt_model_generation() {
	var names = [];
	try {
		if (typeof model === "undefined" || !model || !model.layers) {
			return "";
		}
		for (var i = 0; i < model.layers.length; i++) {
			var layer = model.layers[i];
			if (!layer || !layer.trainableWeights) {
				continue;
			}
			for (var k = 0; k < layer.trainableWeights.length; k++) {
				var w = layer.trainableWeights[k];
				if (w && w.val && !w.val.isDisposed) {
					names.push(w.name + ":" + w.val.shape.join("x"));
				}
			}
		}
	} catch (e) {}
	return names.join("|");
}

// ============================================================
// HISTORY SAMPLER
//
// While training runs, every tagged value is sampled every few
// hundred ms into a capped ring buffer. Tooltips show a small
// sparkline of the training history of that exact value. Buffers
// are cleared whenever the model is rebuilt (weight names change).
// ============================================================

var _mvt_hist = {};
var _mvt_hist_gen = null;
var _mvt_hist_timer = null;
var _mvt_hist_interval_ms = 300;
var _mvt_hist_max_points = 240;
var _mvt_hist_max_cells = 4096;

function _mvt_hist_key(kind, layer, name, flat) {
	return kind + "|L" + layer + "|" + (name || "") + "|f" + flat;
}

function _mvt_hist_record(key, value, ts) {
	if (typeof value !== "number" || !isFinite(value)) {
		return;
	}
	var e = _mvt_hist[key];
	if (!e) {
		e = { t: [], v: [] };
		_mvt_hist[key] = e;
	}
	e.t.push(ts);
	e.v.push(value);
	if (e.v.length > _mvt_hist_max_points) {
		var keep = e.v.length - 1;
		e.v = e.v.filter(function(_, i) { return (i % 2 === 1) || i === keep; });
		e.t = e.t.filter(function(_, i) { return (i % 2 === 1) || i === keep; });
	}
}

function _mvt_hist_get(key) {
	var e = _mvt_hist[key];
	return e && e.v.length >= 2 ? e : null;
}

function _mvt_gui_index_for_raw(raw_idx) {
	var seen = 0;
	for (var i = 0; i <= raw_idx; i++) {
		var lname = model.layers[i].name || "";
		if (lname.includes("skip_proj_") || lname.includes("skip_add_") || lname.includes("skip_scale_")) {
			continue;
		}
		seen++;
	}
	return seen - 1;
}

// Mirrors the tag tokens produced in math_mode.js so that sampler keys
// match tooltip keys exactly.
function _mvt_weight_key_info(name) {
	if (name.indexOf("depthwise") !== -1) {
		return { kind: "kernel", name: "depthwise" };
	}
	if (name.indexOf("pointwise") !== -1) {
		return { kind: "kernel", name: "pointwise" };
	}
	if (name.indexOf("kernel") !== -1) {
		return { kind: "kernel", name: "" };
	}
	if (name.indexOf("bias") !== -1) {
		return { kind: "bias", name: "" };
	}
	if (name.indexOf("gamma") !== -1) {
		return { kind: "gamma", name: "" };
	}
	if (name.indexOf("beta") !== -1) {
		return { kind: "beta", name: "" };
	}
	if (name.indexOf("moving") !== -1) {
		return null;
	}
	var tokens = ["aRelu", "aSnake", "aElu", "aSin", "snakeAlpha"];
	for (var i = 0; i < tokens.length; i++) {
		if (name.indexOf(tokens[i]) !== -1) {
			return { kind: "ma", name: tokens[i] };
		}
	}
	if (name.indexOf("alpha") !== -1) {
		return { kind: "snake", name: "alpha" };
	}
	return null;
}

function _mvt_hist_tick() {
	try {
		var gen = _mvt_model_generation();
		if (gen !== _mvt_hist_gen) {
			_mvt_hist_gen = gen;
			_mvt_hist = {};
		}
		if (typeof started_training === "undefined" || !started_training) {
			return;
		}
		if (typeof model === "undefined" || !model || !model.layers) {
			return;
		}

		var ts = Date.now();
		var gui_seen = {};
		for (var li = 0; li < model.layers.length; li++) {
			var layer = model.layers[li];
			if (!layer || !layer.weights) {
				continue;
			}
			var lname = layer.name || "";
			if (lname.includes("skip_proj_") || lname.includes("skip_add_") || lname.includes("skip_scale_")) {
				continue;
			}
			var gui_idx = _mvt_gui_index_for_raw(li);
			if (gui_seen[gui_idx]) {
				continue;
			}
			gui_seen[gui_idx] = true;

			for (var wi = 0; wi < layer.weights.length; wi++) {
				var w = layer.weights[wi];
				if (!w || !w.val || w.val.isDisposed) {
					continue;
				}
				var info = _mvt_weight_key_info(w.name || "");
				if (!info) {
					continue;
				}
				var shp = w.val.shape || [];
				var flat_total = 1;
				for (var s = 0; s < shp.length; s++) {
					flat_total *= (shp[s] || 1);
				}
				if (flat_total > _mvt_hist_max_cells) {
					continue;
				}
				var data = w.val.dataSync();
				for (var f = 0; f < data.length; f++) {
					_mvt_hist_record(_mvt_hist_key(info.kind, gui_idx, info.name, f), data[f], ts);
				}
			}

			var props = [
				{ prop: "epsilon", kind: "epsilon", name: "" },
				{ prop: "alpha", kind: "param", name: "alpha" },
				{ prop: "maxValue", kind: "param", name: "max_value" },
				{ prop: "theta", kind: "param", name: "theta" }
			];
			for (var pi = 0; pi < props.length; pi++) {
				var pv = layer[props[pi].prop];
				if (typeof pv === "number" && isFinite(pv)) {
					_mvt_hist_record(_mvt_hist_key(props[pi].kind, gui_idx, props[pi].name, 0), pv, ts);
				}
			}
		}
	} catch (e) {
		dbg("[math tooltips] history sampling failed: " + e);
	}
}

function _mvt_weight_shape(tag) {
	var w = _mvt_resolve_weight(tag);
	if (!w) {
		return null;
	}

	try {
		var shape = w.variable.shape;
		if (shape && shape.length) {
			return shape.slice();
		}
	} catch (e) {}

	return null;
}

function _mvt_resolve_weight(tag) {
	if (tag.kind === "skip") {
		return _mvt_find_skip_variable(tag);
	}

	return _mvt_pick_variable(tag.layer, tag);
}

// ============================================================
// BATCH (mirrors gradient_flow_heatmap._getBatch)
// ============================================================

function _mvt_get_batch() {
	if (typeof xy_data_global === "undefined" || !xy_data_global || !xy_data_global.x || !xy_data_global.y) {
		return null;
	}

	var x = xy_data_global.x;
	var y = xy_data_global.y;

	if (x.isDisposed || y.isDisposed) {
		return null;
	}

	var num_samples = x.shape[0];
	if (!num_samples) {
		return null;
	}

	var max_samples = Math.min(_mvt_batch_size, num_samples);

	if (max_samples < num_samples) {
		var indices = [];
		var step = num_samples / max_samples;
		for (var i = 0; i < max_samples; i++) {
			indices.push(Math.min(Math.floor(i * step), num_samples - 1));
		}
		return { x: tf.gather(x, indices), y: tf.gather(y, indices), owned: true };
	}

	return { x: x, y: y, owned: false };
}

function _mvt_loss_value(prediction, y) {
	var loss_fn = model.loss;
	if (typeof loss_fn === "string") {
		loss_fn = tf.losses[loss_fn] || tf.losses.meanSquaredError;
	} else if (typeof loss_fn !== "function") {
		loss_fn = tf.losses.meanSquaredError;
	}
	return loss_fn(y, prediction).mean();
}

// ============================================================
// POOLED GRADIENTS (one variableGrads pass over the batch)
// ============================================================

function _mvt_compute_pooled() {
	if (typeof model === "undefined" || !model || typeof tf === "undefined") {
		return null;
	}

	var batch = _mvt_get_batch();
	if (!batch) {
		return null;
	}

	var result = { ts: Date.now(), grads: {}, names: {}, generation: _mvt_model_generation() };

	try {
		var all_vars = [];
		for (var li = 0; li < model.layers.length; li++) {
			var lvars = _mvt_layer_variables(li);
			for (var vi = 0; vi < lvars.length; vi++) {
				all_vars.push(lvars[vi]);
			}
		}

		if (!all_vars.length) {
			return result;
		}

		var tf_vars = all_vars.map(function(v) { return v.variable; });

		var loss_fn = function() {
			var predictions;
			try {
				predictions = model.apply(batch.x, { training: true });
			} catch (e) {
				return tf.scalar(0);
			}
			if (!predictions) {
				return tf.scalar(0);
			}
			try {
				return _mvt_loss_value(predictions, batch.y);
			} catch (e) {
				return tf.scalar(0);
			}
		};

		var grads_result = tf.variableGrads(loss_fn, tf_vars);
		if (!grads_result || !grads_result.grads) {
			return result;
		}

		for (var i = 0; i < all_vars.length; i++) {
			var vname = all_vars[i].variable.name;
			var gt = grads_result.grads[vname];
			if (!gt) {
				var alt = vname.replace(/:0$/, "");
				gt = grads_result.grads[alt] || grads_result.grads[alt + ":0"];
			}
			if (gt) {
				result.grads[vname] = gt.dataSync().slice();
			}
		}

		if (grads_result.value && !grads_result.value.isDisposed) {
			grads_result.value.dispose();
		}
	} catch (e) {
		dbg("[math tooltips] pooled grads failed: " + e);
	} finally {
		if (batch.owned) {
			try {
				batch.x.dispose();
				batch.y.dispose();
			} catch (e) {}
		}
	}

	return result;
}

function _mvt_ensure_pooled(cb) {
	if (
		_mvt_pooled_cache &&
		_mvt_pooled_cache.generation === _mvt_model_generation() &&
		Date.now() - _mvt_pooled_cache.ts < _mvt_cache_ttl_ms
	) {
		cb(_mvt_pooled_cache);
		return;
	}

	setTimeout(function() {
		_mvt_pooled_cache = _mvt_compute_pooled();
		cb(_mvt_pooled_cache);
	}, 0);
}

// ============================================================
// PER-SAMPLE GRADIENTS (the full delta_i*h_j decomposition)
// ============================================================

function _mvt_per_sample_fresh(gui_idx) {
	var c = _mvt_per_sample_cache[gui_idx];
	return c && c.generation === _mvt_model_generation() && (Date.now() - c.ts < _mvt_cache_ttl_ms) ? c : null;
}

function _mvt_single_sample_grads(xs, ys, tf_vars, layer_vars) {
	var entry = { grads: {} };

	var loss_fn = function() {
		var predictions;
		try {
			predictions = model.apply(xs, { training: true });
		} catch (e) {
			return tf.scalar(0);
		}
		if (!predictions) {
			return tf.scalar(0);
		}
		try {
			return _mvt_loss_value(predictions, ys);
		} catch (e) {
			return tf.scalar(0);
		}
	};

	var grads_result = tf.variableGrads(loss_fn, tf_vars);
	if (grads_result && grads_result.grads) {
		for (var vi = 0; vi < layer_vars.length; vi++) {
			var vname = layer_vars[vi].variable.name;
			var gt = grads_result.grads[vname];
			if (gt) {
				entry.grads[vname] = gt.dataSync().slice();
			}
		}
		if (grads_result.value && !grads_result.value.isDisposed) {
			grads_result.value.dispose();
		}
	}

	return entry;
}

function _mvt_compute_per_sample(gui_idx) {
	if (typeof model === "undefined" || !model || typeof tf === "undefined") {
		return null;
	}

	var layer_vars = _mvt_layer_variables(gui_idx);
	if (!layer_vars.length) {
		return null;
	}

	var tf_vars = layer_vars.map(function(v) { return v.variable; });
	var batch = _mvt_get_batch();
	if (!batch) {
		return null;
	}

	var samples = [];

	try {
		var n = batch.x.shape[0];
		var feature_shape = batch.x.shape.slice(1);
		var y_feature_shape = batch.y.shape.slice(1);

		for (var s = 0; s < n; s++) {
			var entry = { grads: {} };
			try {
				var xs = tf.tidy(function() {
					return batch.x.slice([s].concat(Array(feature_shape.length).fill(0)), [1].concat(feature_shape));
				});
				var ys = tf.tidy(function() {
					return batch.y.slice([s].concat(Array(y_feature_shape.length).fill(0)), [1].concat(y_feature_shape));
				});

				entry = _mvt_single_sample_grads(xs, ys, tf_vars, layer_vars);
			} catch (e) {
				dbg("[math tooltips] per-sample grad failed (sample " + s + "): " + e);
			}

			samples.push(entry);
		}
	} finally {
		if (batch.owned) {
			try {
				batch.x.dispose();
				batch.y.dispose();
			} catch (e) {}
		}
	}

	return { ts: Date.now(), samples: samples, names: layer_vars.map(function(v) { return v.variable.name; }), generation: _mvt_model_generation() };
}

function _mvt_ensure_per_sample(gui_idx, cb) {
	var cached = _mvt_per_sample_fresh(gui_idx);
	if (cached) {
		cb(cached);
		return;
	}

	setTimeout(function() {
		_mvt_per_sample_cache[gui_idx] = _mvt_compute_per_sample(gui_idx);
		cb(_mvt_per_sample_cache[gui_idx]);
	}, 0);
}

// ============================================================
// FINITE DIFFERENCES (for values without a tf variable)
// ============================================================

function _mvt_compute_fd(tag) {
	if (typeof model === "undefined" || !model || typeof tf === "undefined") {
		return null;
	}

	var prop = _mvt_param_property(tag);
	if (!prop) {
		return null;
	}

	var layer = _mvt_tf_layer(tag.layer);
	if (!layer) {
		return null;
	}

	var batch = _mvt_get_batch();
	if (!batch) {
		return null;
	}

	var result = null;

	try {
		var original = layer[prop];
		if (original === undefined || original === null || typeof original !== "number") {
			return null;
		}

		var h = Math.max(Math.abs(original) * 1e-3, 1e-5);

		var loss_at = function() {
			var loss_val = null;
			tf.tidy(function() {
				try {
					var predictions = model.apply(batch.x, { training: true });
					if (predictions) {
						loss_val = _mvt_loss_value(predictions, batch.y).dataSync()[0];
					}
				} catch (e) {}
			});
			return loss_val;
		};

		var l0 = loss_at();

		layer[prop] = original + h;
		var l_plus = loss_at();

		layer[prop] = original - h;
		var l_minus = loss_at();

		layer[prop] = original;

		if (l0 !== null && l_plus !== null && l_minus !== null) {
			result = {
				gradient: (l_plus - l_minus) / (2 * h),
				delta_loss: l_plus - l0,
				value: original,
				note: "+/-" + h
			};
		}
	} catch (e) {
		dbg("[math tooltips] fd failed: " + e);
		try {
			layer[prop] = original;
		} catch (e2) {}
	} finally {
		if (batch.owned) {
			try {
				batch.x.dispose();
				batch.y.dispose();
			} catch (e) {}
		}
	}

	return result;
}

function _mvt_param_property(tag) {
	if (tag.kind === "epsilon") {
		return "epsilon";
	}
	if (tag.kind === "param") {
		if (tag.weight_name === "max_value") {
			return "maxValue";
		}
		if (tag.weight_name === "alpha") {
			return "alpha";
		}
		if (tag.weight_name === "theta") {
			return "theta";
		}
	}
	return null;
}

// ============================================================
// ACTIVATIONS (h tokens)
// ============================================================

function _mvt_submodel(gui_idx) {
	var gen = _mvt_model_generation();
	var cached = _mvt_submodel_cache[gui_idx];
	if (cached && cached.generation === gen) {
		return cached.sub;
	}

	var tf_layer = _mvt_tf_layer(gui_idx);
	if (!tf_layer || !tf_layer.output) {
		return null;
	}

	try {
		var sub = tf.model({ inputs: model.inputs, outputs: tf_layer.output });
		_mvt_submodel_cache[gui_idx] = { generation: gen, sub: sub };
		return sub;
	} catch (e) {
		dbg("[math tooltips] could not build submodel for layer " + gui_idx + ": " + e);
		return null;
	}
}

function _mvt_compute_activations(gui_idx) {
	if (typeof model === "undefined" || !model || typeof tf === "undefined") {
		return null;
	}

	var sub = _mvt_submodel(gui_idx);
	if (!sub) {
		return null;
	}

	var batch = _mvt_get_batch();
	if (!batch) {
		return null;
	}

	var values = null;
	var all = null;

	try {
		var out = sub.predict(batch.x);
		var data = out.dataSync();
		var per_sample = out.shape.length > 1 ? out.shape[out.shape.length - 1] : data.length;
		values = Array.prototype.slice.call(data.slice(0, per_sample));
		var cap = data.length > 4096 ? 4096 : data.length;
		all = Array.prototype.slice.call(data.slice(0, cap));
		out.dispose();
	} catch (e) {
		dbg("[math tooltips] activations failed: " + e);
	} finally {
		if (batch.owned) {
			try {
				batch.x.dispose();
				batch.y.dispose();
			} catch (e) {}
		}
	}

	return { ts: Date.now(), values: values, all: all, generation: _mvt_model_generation() };
}

function _mvt_ensure_activations(gui_idx, cb) {
	var c = _mvt_activations_cache[gui_idx];
	if (c && c.generation === _mvt_model_generation() && Date.now() - c.ts < _mvt_cache_ttl_ms) {
		cb(c);
		return;
	}

	setTimeout(function() {
		_mvt_activations_cache[gui_idx] = _mvt_compute_activations(gui_idx);
		cb(_mvt_activations_cache[gui_idx]);
	}, 0);
}

// dL/dh for layer L, exact when the successor is dense:
// dL/dh_{L,j} = sum_i delta_{L+1,i} * W_{L+1,ij}
// delta per sample is exactly the per-sample bias gradient of L+1.
function _mvt_compute_dl_dh(gui_idx, cb) {
	var next_idx = gui_idx + 1;
	var next_layer = _mvt_tf_layer(next_idx);
	if (!next_layer) {
		cb(null);
		return;
	}

	var kernel_var = null;
	var bias_var = null;
	var lvars = _mvt_layer_variables(next_idx);
	for (var i = 0; i < lvars.length; i++) {
		var n = lvars[i].name || "";
		if (!kernel_var && n.indexOf("kernel") !== -1) {
			kernel_var = lvars[i];
		}
		if (!bias_var && n.indexOf("bias") !== -1) {
			bias_var = lvars[i];
		}
	}

	if (!kernel_var || !bias_var) {
		cb(null);
		return;
	}

	_mvt_ensure_per_sample(next_idx, function(per_sample) {
		try {
			if (!per_sample || !per_sample.samples.length) {
				cb(null);
				return;
			}

			var kernel_data = kernel_var.variable.dataSync();
			var kernel_shape = kernel_var.variable.shape;
			if (!kernel_shape || kernel_shape.length !== 2) {
				cb(null);
				return;
			}
			var in_dim = kernel_shape[0];
			var out_dim = kernel_shape[1];

			var dl_dh = new Array(in_dim).fill(0);

			for (var s = 0; s < per_sample.samples.length; s++) {
				var bg = per_sample.samples[s].grads[bias_var.variable.name];
				if (!bg) {
					continue;
				}
				for (var j = 0; j < in_dim; j++) {
					for (var ii = 0; ii < out_dim; ii++) {
						dl_dh[j] += bg[ii] * kernel_data[j * out_dim + ii];
					}
				}
			}

			var n = per_sample.samples.length;
			for (var j2 = 0; j2 < in_dim; j2++) {
				dl_dh[j2] /= n;
			}

			cb({ values: dl_dh, note: "dense successor" });
		} catch (e) {
			dbg("[math tooltips] dl/dh failed: " + e);
			cb(null);
		}
	});
}

// ============================================================
// TOOLTIP UI
// ============================================================

function _mvt_ensure_tooltip() {
	if (_mvt_tooltip) {
		return _mvt_tooltip;
	}

	var div = document.createElement("div");
	div.id = "mv_tooltip";
	div.style.display = "none";
	document.body.appendChild(div);
	_mvt_tooltip = div;

	_mvt_add_styles();

	return div;
}

function _mvt_add_styles() {
	if (_mvt_style_added) {
		return;
	}
	_mvt_style_added = true;

	var css = ""
		+ "#mv_tooltip{"
		+ "position:fixed;"
		+ "z-index:100001;"
		+ "max-width:420px;"
		+ "padding:8px 10px;"
		+ "background:var(--bg-color,#2b2b2b);"
		+ "color:var(--font-color,#eee);"
		+ "border:1px solid var(--border-color,#666);"
		+ "border-radius:6px;"
		+ "font-family:monospace;"
		+ "font-size:12px;"
		+ "line-height:1.45;"
		+ "pointer-events:none;"
		+ "box-shadow:0 4px 14px rgba(0,0,0,.4);"
		+ "white-space:pre-wrap;"
		+ "}"
		+ "#mv_tooltip .mvt_title{font-weight:bold;margin-bottom:4px}"
		+ "#mv_tooltip .mvt_dim{opacity:.65}"
		+ "#mv_tooltip .mvt_val{color:#7ec8ff}"
		+ "#mv_tooltip .mvt_grad_pos{color:#7ddd7d}"
		+ "#mv_tooltip .mvt_grad_neg{color:#ff8888}"
		+ "#mv_tooltip .mvt_muted{opacity:.6}"
		+ "#mv_tooltip .mvt_decomp{margin-top:6px;padding-top:5px;border-top:1px solid var(--border-color,rgba(128,128,128,.4))}"
		+ "#mv_tooltip svg{display:inline-block;vertical-align:middle}"
		+ "#math_tab_code [class^='mv-']:hover,#math_tab_code [class*=' mv-']:hover{"
		+ "cursor:help;"
		+ "outline:1px dotted currentColor;"
		+ "}";

	var style = document.createElement("style");
	style.id = "mv_tooltip_styles";
	style.textContent = css;
	document.head.appendChild(style);
}

// ============================================================
// SVG VISUALS (sparkline, distribution strip, tensor map, histogram)
// All helpers return small inline SVG strings for the tooltip.
// ============================================================

function _mvt_stats(data) {
	var n = data.length;
	if (!n) {
		return null;
	}
	var min = Infinity, max = -Infinity, sum = 0;
	for (var i = 0; i < n; i++) {
		var v = data[i];
		if (v < min) min = v;
		if (v > max) max = v;
		sum += v;
	}
	var mean = sum / n;
	var ss = 0;
	for (var j = 0; j < n; j++) {
		var d = data[j] - mean;
		ss += d * d;
	}
	return { n: n, min: min, max: max, mean: mean, std: Math.sqrt(ss / n) };
}

function _mvt_percentile(data, value) {
	var less = 0, equal = 0;
	for (var i = 0; i < data.length; i++) {
		if (data[i] < value) less++;
		else if (data[i] === value) equal++;
	}
	return (less + 0.5 * equal) / data.length;
}

function _mvt_svg_sparkline(values, W, H) {
	W = W || 150;
	H = H || 34;
	if (!values || values.length < 2) {
		return "";
	}
	var pad = 3;
	var min = Infinity, max = -Infinity;
	for (var i = 0; i < values.length; i++) {
		if (values[i] < min) min = values[i];
		if (values[i] > max) max = values[i];
	}
	if (min === max) {
		min -= 1;
		max += 1;
	}
	var range = max - min;
	var pts = [];
	for (var k = 0; k < values.length; k++) {
		var x = pad + (k / (values.length - 1)) * (W - 2 * pad);
		var y = pad + (1 - (values[k] - min) / range) * (H - 2 * pad);
		pts.push([x, y]);
	}
	var sum = 0;
	for (var m = 0; m < values.length; m++) sum += values[m];
	var mean_y = pad + (1 - (sum / values.length - min) / range) * (H - 2 * pad);
	var last = pts[pts.length - 1];
	var poly = pts.map(function(p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
	return "<svg width='" + W + "' height='" + H + "' style='vertical-align:middle'>"
		+ "<line x1='" + pad + "' y1='" + mean_y.toFixed(1) + "' x2='" + (W - pad) + "' y2='" + mean_y.toFixed(1) + "' stroke='currentColor' stroke-width='0.5' stroke-dasharray='2,2' opacity='0.35'/>"
		+ "<polyline points='" + poly + "' fill='none' stroke='#7ec8ff' stroke-width='1.5'/>"
		+ "<circle cx='" + last[0].toFixed(1) + "' cy='" + last[1].toFixed(1) + "' r='2' fill='#7ec8ff'/>"
		+ "</svg>";
}

// A line from min to max with a tick at the mean and a dot at the value.
// The min/max endpoints are labeled, so the scale is readable.
function _mvt_svg_dist_strip(value, min, max, mean, W) {
	W = W || 150;
	var H = 22, cx = 4;
	if (max <= min) {
		min = value - 1;
		max = value + 1;
	}
	function pos(v) {
		if (v < min) v = min;
		if (v > max) v = max;
		return (cx + (v - min) / (max - min) * (W - 2 * cx)).toFixed(1);
	}
	var fs = 8;
	var ml = _mvt_fmt(min);
	var xl = _mvt_fmt(max);
	if (ml.length > 10) fs = 7;
	if (xl.length > 10) fs = 7;
	return "<svg width='" + W + "' height='" + H + "' style='vertical-align:middle'>"
		+ "<line x1='" + cx + "' y1='8' x2='" + (W - cx) + "' y2='8' stroke='currentColor' stroke-width='1' opacity='0.4'/>"
		+ "<line x1='" + pos(mean) + "' y1='3' x2='" + pos(mean) + "' y2='13' stroke='currentColor' stroke-width='1' stroke-dasharray='2,1' opacity='0.6'/>"
		+ "<circle cx='" + pos(value) + "' cy='8' r='3' fill='#7ec8ff'/>"
		+ "<text x='" + cx + "' y='" + (H - 2) + "' font-size='" + fs + "' fill='currentColor' opacity='0.6'>" + ml + "</text>"
		+ "<text x='" + (W - cx) + "' y='" + (H - 2) + "' font-size='" + fs + "' fill='currentColor' opacity='0.6' text-anchor='end'>" + xl + "</text>"
		+ "</svg>";
}

function _mvt_cell_color(v, maxAbs) {
	if (!maxAbs) {
		return "rgba(255,255,255,0.08)";
	}
	var t = v / maxAbs;
	if (t > 1) t = 1;
	if (t < -1) t = -1;
	var a = (0.15 + 0.85 * Math.abs(t)).toFixed(2);
	return t >= 0 ? "rgba(126,200,255," + a + ")" : "rgba(255,136,136," + a + ")";
}

// Mini heatmap of a tensor. 1D -> single row, 2D -> grid.
// Returns "" when the tensor is too large (> 64 cells).
function _mvt_svg_tensor_map(data, shape, hi) {
	if (!data || !data.length || !shape) {
		return "";
	}
	var rows, cols;
	if (shape.length === 1) {
		rows = 1;
		cols = data.length;
	} else if (shape.length === 2) {
		rows = shape[0];
		cols = shape[1];
	} else {
		return "";
	}
	if (rows * cols > 64 || data.length < rows * cols) {
		return "";
	}
	var cs = 10, gap = 1;
	var W = cols * (cs + gap) - gap + 4;
	var H = rows * (cs + gap) - gap + 4;
	var maxAbs = 0;
	for (var i = 0; i < data.length; i++) {
		var av = Math.abs(data[i]);
		if (av > maxAbs) maxAbs = av;
	}
	var out = "<svg width='" + W + "' height='" + H + "' style='vertical-align:middle'>";
	for (var r = 0; r < rows; r++) {
		for (var c = 0; c < cols; c++) {
			var f = r * cols + c;
			var x = 2 + c * (cs + gap);
			var y = 2 + r * (cs + gap);
			out += "<rect x='" + x + "' y='" + y + "' width='" + cs + "' height='" + cs + "' fill='" + _mvt_cell_color(data[f], maxAbs) + "'/>";
			if (f === hi) {
				out += "<rect x='" + (x - 1) + "' y='" + (y - 1) + "' width='" + (cs + 2) + "' height='" + (cs + 2) + "' fill='none' stroke='#fff' stroke-width='1'/>";
			}
		}
	}
	return out + "</svg>";
}

function _mvt_svg_histogram(values, W, H) {
	W = W || 150;
	H = H || 40;
	if (!values || values.length < 2) {
		return "";
	}
	var bins = 12;
	var min = Infinity, max = -Infinity, sum = 0;
	for (var i = 0; i < values.length; i++) {
		if (values[i] < min) min = values[i];
		if (values[i] > max) max = values[i];
		sum += values[i];
	}
	var mean = sum / values.length;
	if (min === max) {
		min -= 1;
		max += 1;
	}
	var counts = new Array(bins).fill(0);
	for (var j = 0; j < values.length; j++) {
		var b = Math.floor((values[j] - min) / (max - min) * bins);
		if (b >= bins) b = bins - 1;
		if (b < 0) b = 0;
		counts[b]++;
	}
	var mc = 0;
	for (var c2 = 0; c2 < bins; c2++) {
		if (counts[c2] > mc) mc = counts[c2];
	}
	var bw = W / bins;
	var chart_h = H - 14;
	var base = chart_h - 2;
	var mean_x = ((mean - min) / (max - min) * W).toFixed(1);
	var fs = 8;
	var ml = _mvt_fmt(min);
	var xl = _mvt_fmt(max);
	if (ml.length > 10) fs = 7;
	if (xl.length > 10) fs = 7;
	var out = "<svg width='" + W + "' height='" + H + "' style='vertical-align:middle'>";
	for (var k = 0; k < bins; k++) {
		var bh = mc ? (counts[k] / mc) * (chart_h - 4) : 0;
		out += "<rect x='" + (k * bw + 0.5).toFixed(1) + "' y='" + (base - bh).toFixed(1) + "' width='" + (bw - 1).toFixed(1) + "' height='" + bh.toFixed(1) + "' fill='#7ec8ff' opacity='0.75'/>";
	}
	out += "<line x1='" + mean_x + "' y1='2' x2='" + mean_x + "' y2='" + base + "' stroke='currentColor' stroke-width='1' stroke-dasharray='2,1' opacity='0.6'/>";
	out += "<text x='4' y='" + (H - 2) + "' font-size='" + fs + "' fill='currentColor' opacity='0.6'>" + ml + "</text>";
	out += "<text x='" + (W - 4) + "' y='" + (H - 2) + "' font-size='" + fs + "' fill='currentColor' opacity='0.6' text-anchor='end'>" + xl + "</text>";
	return out + "</svg>";
}

// Small horizontal bar: frac in [-1, 1] -> signed fill (pos/neg colors).
function _mvt_svg_bar(v, maxAbs, W) {
	W = W || 60;
	var H = 8;
	if (!maxAbs || v === null || v === undefined) {
		return "";
	}
	var frac = v / maxAbs;
	if (frac > 1) frac = 1;
	if (frac < -1) frac = -1;
	var half = W / 2;
	var fill_w = Math.abs(frac) * half;
	var x = frac >= 0 ? half : half - fill_w;
	var color = frac >= 0 ? "#7ddd7d" : "#ff8888";
	return "<svg width='" + W + "' height='" + H + "' style='vertical-align:middle'>"
		+ "<rect x='0' y='0' width='" + W + "' height='" + H + "' fill='rgba(255,255,255,0.07)'/>"
		+ "<line x1='" + half + "' y1='0' x2='" + half + "' y2='" + H + "' stroke='currentColor' stroke-width='1' opacity='0.4'/>"
		+ "<rect x='" + x.toFixed(1) + "' y='1' width='" + fill_w.toFixed(1) + "' height='" + (H - 2) + "' fill='" + color + "'/>"
		+ "</svg>";
}

function _mvt_fmt(v) {
	if (v === null || v === undefined || typeof v !== "number" || isNaN(v)) {
		return "" + v;
	}

	if (v !== 0 && (Math.abs(v) < 1e-4 || Math.abs(v) >= 1e6)) {
		return v.toExponential(3);
	}

	return parseFloat(v.toFixed(6)).toString();
}

function _mvt_grad_span(v) {
	if (v === null || v === undefined || isNaN(v)) {
		return "<span class='mvt_muted'>n/a</span>";
	}
	var cls = v >= 0 ? "mvt_grad_pos" : "mvt_grad_neg";
	return "<span class='" + cls + "'>" + _mvt_fmt(v) + "</span>";
}

function _mvt_describe_tag(tag) {
	var t = {
		"kernel": () => language[lang]["mv_tooltip_header_weight"],
		"bias": () => language[lang]["mv_tooltip_header_bias"],
		"gamma": () => language[lang]["mv_tooltip_header_gamma"],
		"beta": () => language[lang]["mv_tooltip_header_beta"],
		"epsilon": () => language[lang]["mv_tooltip_header_epsilon"],
		"param": () => language[lang]["mv_tooltip_header_param"] + " (" + (tag.weight_name || "?") + ")",
		"ma": () => language[lang]["mv_tooltip_header_ma"] + " (" + (tag.weight_name || "?") + ")",
		"snake": () => language[lang]["mv_tooltip_header_snake"],
		"skip": () => language[lang]["mv_tooltip_header_skip"],
		"h": () => language[lang]["mv_tooltip_header_h"] + " h<sub>" + tag.layer + "</sub>"
	};

	if (t[tag.kind]) {
		return t[tag.kind]();
	}

	return tag.kind;
}

function _mvt_position(ev) {
	if (!_mvt_tooltip) {
		return;
	}

	var pad = 16;
	var x = ev.clientX + pad;
	var y = ev.clientY + pad;

	var rect = _mvt_tooltip.getBoundingClientRect();
	if (x + rect.width > window.innerWidth - 8) {
		x = ev.clientX - rect.width - pad;
	}
	if (y + rect.height > window.innerHeight - 8) {
		y = ev.clientY - rect.height - pad;
	}
	if (x < 8) {
		x = 8;
	}
	if (y < 8) {
		y = 8;
	}

	_mvt_tooltip.style.left = x + "px";
	_mvt_tooltip.style.top = y + "px";
}

function _mvt_get_display_value(tag) {
	// Prefer the exact value from the model / layer over the
	// rounded one shown in the formula.
	try {
		if (tag.kind === "epsilon" || tag.kind === "param") {
			var prop = _mvt_param_property(tag);
			if (prop) {
				var layer = _mvt_tf_layer(tag.layer);
				if (layer && typeof layer[prop] === "number") {
					return layer[prop];
				}
			}
			return null;
		}

		if (tag.kind === "h") {
			return null;
		}

		var w = _mvt_resolve_weight(tag);
		if (!w) {
			return null;
		}

		var flat = _mvt_flat_index(tag);
		if (flat < 0) {
			return null;
		}

		var data = w.variable.dataSync();
		if (flat >= data.length) {
			return null;
		}

		return data[flat];
	} catch (e) {
		return null;
	}
}

function _mvt_build_base_html(tag) {
	var html = "<div class='mvt_title'>" + _mvt_describe_tag(tag) + "</div>";

	var pos = tag.indices.length ? " [" + tag.indices.join("][") + "]" : "";
	if (pos) {
		html += "<div class='mvt_dim'>" + language[lang]["mv_tooltip_position"] + pos + "</div>";
	}

	var v = _mvt_get_display_value(tag);
	if (v !== null) {
		html += "<div>" + language[lang]["mv_tooltip_value"] + ": <span class='mvt_val'>" + _mvt_fmt(v) + "</span></div>";
	}

	return html;
}

function _mvt_append_pooled_info(tag, hover_id) {
	// h, epsilon and activation parameters have their own data sources
	// and do not depend on the (possibly missing) pooled gradients.
	if (tag.kind === "h") {
		_mvt_append_h_info(tag, hover_id);
		return;
	}

	if (tag.kind === "epsilon" || tag.kind === "param") {
		_mvt_append_fd_info(tag, hover_id);
		return;
	}

	_mvt_ensure_pooled(function(pooled) {
		if (hover_id !== _mvt_hover_id || !_mvt_tooltip) {
			return;
		}
		_mvt_append_weight_info(tag, pooled, hover_id);
	});
}

function _mvt_history_block(key) {
	var hist = _mvt_hist_get(key);
	var html = "<div class='mvt_dim'>" + language[lang]["mv_tooltip_history"] + "</div>";
	if (!hist) {
		html += "<div class='mvt_muted'>" + language[lang]["mv_tooltip_history_none"] + "</div>";
		return html;
	}
	var span_s = Math.round((hist.t[hist.t.length - 1] - hist.t[0]) / 1000);
	var delta = hist.v[hist.v.length - 1] - hist.v[0];
	html += _mvt_svg_sparkline(hist.v) + " <span class='mvt_muted'>(last " + span_s + " s)</span>";
	html += "<div>" + language[lang]["mv_tooltip_history_delta"] + ": " + _mvt_grad_span(delta) + "</div>";
	return html;
}

function _mvt_append_fd_info(tag, hover_id) {
	var html = "";
	var fd = _mvt_compute_fd(tag);
	if (fd && hover_id === _mvt_hover_id && _mvt_tooltip) {
		html += "<div>" + language[lang]["mv_tooltip_fd_gradient"] + ": " + _mvt_grad_span(fd.gradient) + "</div>";
		html += "<div>" + language[lang]["mv_tooltip_fd_delta"] + ": " + _mvt_grad_span(fd.delta_loss) + " <span class='mvt_muted'>(" + fd.note + ")</span></div>";
		html += "<div class='mvt_muted'>" + language[lang]["mv_tooltip_fd_hint"] + "</div>";
	} else if (hover_id === _mvt_hover_id && _mvt_tooltip) {
		html += "<div class='mvt_muted'>" + language[lang]["mv_tooltip_no_grads"] + "</div>";
	}

	html += "<div class='mvt_decomp'>" + _mvt_history_block(_mvt_hist_key(tag.kind, tag.layer, tag.weight_name || "", 0)) + "</div>";

	if (hover_id === _mvt_hover_id && _mvt_tooltip) {
		_mvt_tooltip.innerHTML += "<div class='mvt_decomp'>" + html + "</div>";
	}
}

function _mvt_append_weight_info(tag, pooled, hover_id) {
	var w = _mvt_resolve_weight(tag);
	if (!w || hover_id !== _mvt_hover_id || !_mvt_tooltip) {
		return;
	}

	var vname = w.variable.name;
	var garr = pooled && pooled.grads ? pooled.grads[vname] : null;
	var flat = _mvt_flat_index(tag);
	var has_grad = !!(garr && flat >= 0 && flat < garr.length);

	var tensor_data = null;
	var value = null;
	try {
		tensor_data = Array.prototype.slice.call(w.variable.dataSync());
		if (flat >= 0 && flat < tensor_data.length) {
			value = tensor_data[flat];
		}
	} catch (e) {}

	// Everything is appended in ONE pass, after the (async) per-sample
	// data is available, so the block order is deterministic.
	var finish = function(ps_html) {
		if (hover_id !== _mvt_hover_id || !_mvt_tooltip) {
			return;
		}

		var html = "";

		if (has_grad) {
			var g = garr[flat];
			var max_abs = 0;
			for (var i = 0; i < garr.length; i++) {
				max_abs = Math.max(max_abs, Math.abs(garr[i]));
			}
			var share = max_abs > 0 ? Math.abs(g) / max_abs : 0;
			html += "<div>" + language[lang]["mv_tooltip_gradient"] + " dL/dv: " + _mvt_grad_span(g) + " " + _mvt_svg_bar(g, max_abs, 60) + "</div>";
			html += "<div class='mvt_dim'>" + language[lang]["mv_tooltip_grad_share"] + ": " + (100 * share).toFixed(1) + "%</div>";
			html += "<div class='mvt_dim'>" + language[lang]["mv_tooltip_pooled_hint"] + " (n=" + _mvt_batch_size + ")</div>";
		} else {
			html += "<div class='mvt_muted'>" + language[lang]["mv_tooltip_no_grads"] + "</div>";
		}

		if (ps_html) {
			html += ps_html;
		}

		// History of this exact value during training
		html += _mvt_history_block(_mvt_hist_key(tag.kind, tag.layer, tag.weight_name || "", flat < 0 ? 0 : flat));

		// Tensor statistics + distribution + mini map
		if (tensor_data && tensor_data.length) {
			var st = _mvt_stats(tensor_data);
			var shp = w.variable.shape || [];
			var s_html = "<div class='mvt_dim'>" + language[lang]["mv_tooltip_tensor_stats"] + " (n=" + st.n + ")</div>";

			if (st.min === st.max) {
				s_html += "<div>" + language[lang]["mv_tooltip_all_identical"] + ": " + _mvt_fmt(st.min) + "</div>";
			} else {
				s_html += "<div>" + language[lang]["mv_tooltip_mean"] + " " + _mvt_fmt(st.mean)
					+ " · " + language[lang]["mv_tooltip_typ_range"] + ": " + _mvt_fmt(st.mean - st.std) + " … " + _mvt_fmt(st.mean + st.std) + "</div>";

				if (value !== null) {
					var p = _mvt_percentile(tensor_data, value);
					s_html += "<div>" + _mvt_svg_dist_strip(value, st.min, st.max, st.mean) + "</div>";

					var less = 0, equal = 0, larger = 0;
					for (var ci = 0; ci < tensor_data.length; ci++) {
						if (tensor_data[ci] < value) less++;
						else if (tensor_data[ci] === value) equal++;
						else larger++;
					}
					s_html += "<div>" + less + " " + language[lang]["mv_tooltip_of"] + " " + st.n + " " + language[lang]["mv_tooltip_smaller"]
						+ ", " + larger + " " + language[lang]["mv_tooltip_larger"];
					if (equal > 0) {
						s_html += ", " + equal + " " + language[lang]["mv_tooltip_equal"];
					}
					s_html += " <span class='mvt_muted'>(= " + (100 * p).toFixed(1) + " " + language[lang]["mv_tooltip_percentile"] + ")</span></div>";

					var z = (value - st.mean) / st.std;
					s_html += "<div>" + language[lang]["mv_tooltip_z"]
						+ ": (" + _mvt_fmt(value) + " − (" + _mvt_fmt(st.mean) + ")) / " + _mvt_fmt(st.std) + " = " + _mvt_fmt(z) + "</div>";
				}
			}

			var map = "";
			if (shp.length === 1 || shp.length === 2) {
				map = _mvt_svg_tensor_map(tensor_data, shp, flat);
			}
			if (map) {
				s_html += "<div class='mvt_dim'>" + language[lang]["mv_tooltip_map"] + "</div>";
				s_html += "<div>" + map + "</div>";
			}
			html += s_html;
		}

		_mvt_tooltip.innerHTML += "<div class='mvt_decomp'>" + html + "</div>";
	};

	if (has_grad) {
		_mvt_ensure_per_sample(tag.layer, function(per_sample) {
			finish(_mvt_per_sample_html(tag, per_sample));
		});
	} else {
		finish("");
	}
}

function _mvt_per_sample_html(tag, per_sample) {
	if (!per_sample || !per_sample.samples) {
		return "";
	}

	var w = _mvt_resolve_weight(tag);
	if (!w) {
		return "";
	}

	var vname = w.variable.name;
	var flat = _mvt_flat_index(tag);

	var entries = [];
	for (var s = 0; s < per_sample.samples.length; s++) {
		var garr = per_sample.samples[s].grads[vname];
		if (garr && flat >= 0 && flat < garr.length) {
			entries.push({ sample: s, g: garr[flat] });
		}
	}

	if (!entries.length) {
		return "";
	}

	entries.sort(function(a, b) {
		return Math.abs(b.g) - Math.abs(a.g);
	});

	var html = "<div class='mvt_dim'>" + language[lang]["mv_tooltip_decomp"] + " (δ<sub>i</sub>·h<sub>j</sub>):</div>";
	var shown = Math.min(8, entries.length);
	for (var e = 0; e < shown; e++) {
		html += "<div>" + language[lang]["mv_tooltip_sample"] + " " + entries[e].sample + ": " + _mvt_grad_span(entries[e].g) + "</div>";
	}
	if (entries.length > shown) {
		html += "<div class='mvt_muted'>…</div>";
	}

	return html;
}

function _mvt_append_h_info(tag, hover_id) {
	_mvt_ensure_activations(tag.layer, function(acts) {
		if (hover_id !== _mvt_hover_id || !_mvt_tooltip || !acts || !acts.values) {
			return;
		}

		var vals = acts.values;
		var shown = Math.min(vals.length, 8);
		var list = [];
		for (var i = 0; i < shown; i++) {
			list.push("h[" + i + "] = " + _mvt_fmt(vals[i]));
		}
		if (acts.values.length > shown) {
			list.push("… (" + (acts.values.length - shown) + " " + language[lang]["mv_tooltip_more_units"] + ")");
		}

		var html = "<div class='mvt_dim'>" + language[lang]["mv_tooltip_activations_sample"] + ":</div>";
		html += "<div>" + list.join("<br>") + "</div>";

		_mvt_compute_dl_dh(tag.layer, function(dl_dh) {
			if (hover_id !== _mvt_hover_id || !_mvt_tooltip) {
				return;
			}

			if (dl_dh && dl_dh.values) {
				var dlist = [];
				var dshown = Math.min(8, dl_dh.values.length);
				for (var j = 0; j < dshown; j++) {
					dlist.push("dL/dh[" + j + "] = " + _mvt_grad_span(dl_dh.values[j]));
				}
				html += "<div class='mvt_dim' style='margin-top:4px'>" + language[lang]["mv_tooltip_dl_dh"] + ":</div>";
				html += "<div>" + dlist.join("<br>") + "</div>";
			}

			// Distribution over the whole batch
			if (acts.all && acts.all.length > 1) {
				var st = _mvt_stats(acts.all);
				html += "<div class='mvt_dim' style='margin-top:4px'>" + language[lang]["mv_tooltip_batch_hist"] + " (n=" + st.n + ")</div>";
				html += _mvt_svg_histogram(acts.all);
				if (st.min === st.max) {
					html += "<div>" + language[lang]["mv_tooltip_all_identical"] + ": " + _mvt_fmt(st.min) + "</div>";
				} else {
					html += "<div>" + language[lang]["mv_tooltip_mean"] + " " + _mvt_fmt(st.mean)
						+ " · " + language[lang]["mv_tooltip_typ_range"] + ": " + _mvt_fmt(st.mean - st.std) + " … " + _mvt_fmt(st.mean + st.std) + "</div>";
				}

				var zeros = 0;
				for (var z = 0; z < acts.all.length; z++) {
					if (Math.abs(acts.all[z]) < 1e-9) {
						zeros++;
					}
				}
				if (zeros > 0) {
					html += "<div>" + language[lang]["mv_tooltip_dead"] + ": " + (100 * zeros / acts.all.length).toFixed(1) + "%</div>";
				}
			}

			_mvt_tooltip.innerHTML += "<div class='mvt_decomp'>" + html + "</div>";
		});
	});
}

// ============================================================
// EVENT WIRING
// ============================================================

function _mvt_on_over(ev) {
	var el = _mvt_find_mv_element(ev.target);
	if (!el) {
		return;
	}

	var tag = _mvt_decode_class(el.getAttribute("class"));
	if (!tag) {
		return;
	}

	_mvt_hover_el = el;
	_mvt_hover_id++;
	var hover_id = _mvt_hover_id;

	var tooltip = _mvt_ensure_tooltip();
	tooltip.innerHTML = _mvt_build_base_html(tag);
	tooltip.style.display = "block";
	_mvt_position(ev);

	_mvt_append_pooled_info(tag, hover_id);
}

function _mvt_on_move(ev) {
	if (!_mvt_tooltip || _mvt_tooltip.style.display === "none") {
		return;
	}
	_mvt_position(ev);
}

function _mvt_init() {
	if (_mvt_wired) {
		return;
	}
	_mvt_wired = true;

	document.addEventListener("mouseover", _mvt_on_over, true);
	document.addEventListener("mousemove", _mvt_on_move, true);
	document.addEventListener("mouseout", function(ev) {
		if (_mvt_find_mv_element(ev.target) && !_mvt_find_mv_element(ev.relatedTarget)) {
			_mvt_hover_id++;
			_mvt_hover_el = null;
			if (_mvt_tooltip) {
				_mvt_tooltip.style.display = "none";
			}
		}
	}, true);

	// Re-renders replace the MathML nodes. Only hide the tooltip when the
	// element we are hovering over actually disappeared — a render that
	// keeps it must not flicker the tooltip away while the user reads it.
	var target = document.getElementById("math_tab_code");
	if (target) {
		new MutationObserver(function() {
			if (_mvt_hover_el && !_mvt_hover_el.isConnected) {
				_mvt_hover_id++;
				_mvt_hover_el = null;
				if (_mvt_tooltip) {
					_mvt_tooltip.style.display = "none";
				}
			}
		}).observe(target, { childList: true, subtree: true });
	}

	// Sample value history while training (guarded no-op otherwise).
	if (typeof setInterval === "function" && !_mvt_hist_timer) {
		_mvt_hist_timer = setInterval(_mvt_hist_tick, _mvt_hist_interval_ms);
	}
}

var _mvt_wired = false;

if (typeof document !== "undefined") {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", _mvt_init);
	} else {
		_mvt_init();
	}
}
