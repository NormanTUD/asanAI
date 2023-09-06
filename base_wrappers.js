var _custom_tensors = {};

function removeTimestampAndLines(inputString) {
	// Remove the "t=\d" pattern
	const cleanedString = inputString.replace(/\?t=\d+/g, '');

	// Split the string into lines
	const lines = cleanedString.split('\n');

	// Remove the first two lines
	lines.splice(0, 2);

	// Join the remaining lines back into a single string
	const resultString = lines.join('\n');

	return resultString;
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
	return tf.util.shuffleCombo(...args);
}

async function dispose (item) { // start_tensors
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
}

function tf_model (...args) {
	var res = tf.model(...args);

	return res;
}

function tidy (...args) {
	var res = tf.tidy(...args);

	return res;
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
	var res = tf.buffer(...args);

	//_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function fromPixels (...args) {
	var res = tf.browser.fromPixels(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function input(...args) {
	var res = tf.input(...args);

	_custom_tensors["" + res.id] = [get_stack_trace(), res, "[input]"];

	_clean_custom_tensors();

	return res;
}

function ones(...args) {
	var res = tf.ones(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function reshape(...args) {
	var res = tf.reshape(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function min(...args) {
	var res = tf.min(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function max(...args) {
	var res = tf.max(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function add(...args) {
	var res = tf.add(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function abs(...args) {
	var res = tf.abs(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

async function tf_data_webcam (...args) {
	var res = await tf.data.webcam(...args);

	_clean_custom_tensors();

	return res;
}

function resizeNearestNeighbor(...args) {
	var res = tf.image.resizeNearestNeighbor(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, "[resizeNearestNeighbor]"];

	_clean_custom_tensors();

	return res;
}

function resizeBilinear(...args) {
	var res = tf.image.resizeBilinear(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, "[resizeBilinear]"];

	_clean_custom_tensors();

	return res;
}

function rotateWithOffset (...args) {
	var res = tf.image.rotateWithOffset(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function flipLeftRight (...args) {
	var res = tf.image.flipLeftRight(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function clipByValue (...args) {
	var res = tf.clipByValue(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function randomUniform (...args) {
	var res = tf.randomUniform(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function tf_square (...args) {
	var res = tf.square(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function tf_mean (...args) {
	var res = tf.mean(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function sqrt (...args) {
	var res = tf.sqrt(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function tensor1d (...args) {
	var res = tf.tensor1d(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function tensor2d (...args) {
	var res = tf.tensor2d(...args);

	_custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function tensor (...args) {
	var res = tf.tensor(...args);

	_custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function grad (...args) {
	var res = tf.grad(...args);

	return res;
}

function divNoNan (...args) {
	var res = tf.divNoNan(...args);

	_custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function oneHot (...args) {
	var res = tf.oneHot(...args);

	_custom_tensors[res.id] = [get_stack_trace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
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
	return parseInt(...args);
}

function parse_float (...args) {
	return parseFloat(...args);
}

async function loadLayersModel (...args) {
	var res = await tf.loadLayersModel(...args);

	return res;
}

async function toPixels (...args) {
	var res = await tf.browser.toPixels(...args);

	return res;
}
