var _custom_tensors = {};

function tf_sub (...args) {
	var res = tf.sub(...args);

	return res;
}

function tf_min (...args) {
	var res = tf.min(...args);

	return res;
}

function tf_max (...args) {
	var res = tf.max(...args);

	return res;
}

function tf_add (...args) {
	var res = tf.add(...args);

	return res;
}

function tf_mul (...args) {
	var res = tf.mul(...args);

	return res;
}

function tf_div (...args) {
	var res = tf.div(...args);

	return res;
}

function tf_moments (...args) {
	var res = tf.moments(...args);

	return res;
}

function tf_reshape (...args) {
	return tf.reshape(...args);
}

function tf_unique (...args) {
	return tf.unique(...args);
}

function removeTimestampAndLines(inputString) {
	try {
		// Remove the "t=\d" pattern
		const cleanedString = inputString.replace(/\?t=\d+/g, "");

		// Split the string into lines
		const lines = cleanedString.split("\n");

		// Remove the first two lines
		lines.splice(0, 2);

		// Join the remaining lines back into a single string
		const resultString = lines.join("\n");

		return resultString;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("" + e);

		return "";
	}
}

var get_stack_trace = function() {
	var s = "";
	try {
		var a = {}; 
		a.debug();
	} catch(ex) {
		s = "" + ex.stack;
	}

	s = removeTimestampAndLines(s);

	return s;
};


async function nextFrame(...args) {
	await tf.nextFrame(...args);
}

function shuffleCombo (...args) {
	try {
		return tf.util.shuffleCombo(...args);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("" + e);
		return args;
	}
}

async function dispose (item) { // start_tensors
	try {
		//console.trace();
		//log(item);
		if(item) {
			var tensor_id = item.id;
			tf.dispose(item);

			if(_custom_tensors[tensor_id]) {
				delete _custom_tensors[tensor_id];
			}

			await nextFrame();
		} else {
			/*
			wrn("item was empty in dispose():"); // not a real async
			console.trace();
			*/
		}

		_clean_custom_tensors();
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function tf_model (...args) {
	try {
		var res = tf.model(...args);

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function tidy (...args) {
	try {
		var res = tf.tidy(...args);

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		throw new Error(e);
	}
}

function tf_sequential(model_uuid) {
	assert(model_uuid, "model_uuid is not defined");
	assert(typeof(model_uuid) == "string", "model_uuid must be a string");

	var res = tf.sequential();

	res.originalAdd = res.add;

	res.add = function (...args) {
		var r = res.originalAdd(...args);

		try {
			var k = res.layers[res.layers.length - 1].kernel;
			if(k) {
				_custom_tensors["" + k.id] = ["UUID:" + model_uuid, k, "[kernel in tf_sequential]"];
			}
		} catch (e) {
			wrn(e);
		}

		try {
			var b = res.layers[res.layers.length - 1].bias;

			if(b) {
				_custom_tensors["" + b.id] = ["UUID:" + model_uuid, b, "[bias in tf_sequential]"];
			}
		} catch (e) {
			wrn(e);
		}

		_clean_custom_tensors();

		return r;
	};

	_custom_tensors["" + res.id] = ["UUID:" + model_uuid, res, "[model in tf_sequential]"];

	_clean_custom_tensors();

	return res;
}

function buffer(...args) {
	try {
		var res = tf.buffer(...args);

		//_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function fromPixels (...args) {
	try {
		var res = tf.browser.fromPixels(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function input(...args) {
	try {
		var res = tf.input(...args);

		_custom_tensors["" + res.id] = [get_stack_trace(), res, "[input]"];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function ones(...args) {
	try {
		var res = tf.ones(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function reshape(...args) {
	try {
		var res = tf.reshape(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function min(...args) {
	try {
		var res = tf.min(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function max(...args) {
	try {
		var res = tf.max(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function add(...args) {
	try {
		var res = tf.add(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function abs(...args) {
	try {
		var res = tf.abs(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

async function tf_data_webcam (...args) {
	try {
		var res = await tf.data.webcam(...args);

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function resizeNearestNeighbor(...args) {
	try {
		var res = tf.image.resizeNearestNeighbor(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, "[resizeNearestNeighbor]"];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function resizeBilinear(...args) {
	try {
		var res = tf.image.resizeBilinear(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, "[resizeBilinear]"];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function rotateWithOffset (...args) {
	try {
		var res = tf.image.rotateWithOffset(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function flipLeftRight (...args) {
	try {
		var res = tf.image.flipLeftRight(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function clipByValue (...args) {
	try {
		var res = tf.clipByValue(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function randomUniform (...args) {
	try {
		var res = tf.randomUniform(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function tf_square (...args) {
	try {
		var res = tf.square(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res; 
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function tf_mean (...args) {
	try {
		var res = tf.mean(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function sqrt (...args) {
	try {
		var res = tf.sqrt(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function tensor1d (...args) {
	try {
		var res = tf.tensor1d(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function tensor2d (...args) {
	try {
		var res = tf.tensor2d(...args);

		_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function tensor (...args) {
	try {
		var res = tf.tensor(...args);

		_custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function grad (...args) {
	try {
		var res = tf.grad(...args);

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function divNoNan (...args) {
	try {
		var res = tf.divNoNan(...args);

		_custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function oneHot (...args) {
	try {
		var res = tf.oneHot(...args);

		_custom_tensors[res.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

		_clean_custom_tensors();

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

function _clean_custom_tensors () {
	var keys = Object.keys(_custom_tensors);

	if(!keys.length) {
		return;
	}
	var disposed_keys = [];

	for (var i in keys) {
		var key = keys[i];

		try {
			if(!Object.keys(_custom_tensors).includes(key) || _custom_tensors[key][1].isDisposedInternal || _custom_tensors[key][1].isDisposed) {
				disposed_keys.push(key);
			}
		} catch (e) {
			if(("" + e).includes("_custom_tensors[key] is undefined")) {
				//
			} else {
				wrn(e);
			}
		}
	}

	for (var i in disposed_keys) {
		delete _custom_tensors[disposed_keys[i]];
	}
}

function parse_int (...args) {
	var res = parseInt(...args);

	if(isNaN(res)) {
		wrn("NaN detected in parse_int, args: " + JSON.stringify(args));
		console.trace();
	}

	return res;
}

function parse_float (...args) {
	var res = parseFloat(...args);

	if(isNaN(res)) {
		wrn("NaN detected in parse_int, args: " + JSON.stringify(args));
		console.trace();
	}

	return res;
}

async function loadLayersModel (...args) {
	try {
		var res = await tf.loadLayersModel(...args);

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}

async function toPixels (...args) {
	try {
		var res = await tf.browser.toPixels(...args);

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}
