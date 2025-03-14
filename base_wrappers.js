var _custom_tensors = {};

function is_tf_tensor (arg) {
	if(typeof(arg) != "object") {
		return false;
	}

	if(!Object.keys(arg).includes("isDisposedInternal")) {
		return false;
	}

	if(!Object.keys(arg).includes("kept")) {
		return false;
	}

	return true;
}

function _register_tensors (...args) {
	if(debug) {
		for (var i = 0; i < args.length; i++) {
			if(is_tf_tensor(args[i])) {
				(() => { _custom_tensors["" + args[i].id] = [get_stack_trace(), args[i], tensor_print_to_string(args[i])] })();
				_clean_custom_tensors();
			}
		}

		_clean_custom_tensors();
	}
}

function array_sync (...args) {
	_register_tensors(...args);
	var first_tensor = args.shift();
	var res = first_tensor.arraySync();

	return res;
}

function tf_to_float (...args) {
	_register_tensors(...args);
	var first_tensor = args.shift();
	var res = first_tensor.toFloat();

	(() => { _custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();
	_clean_custom_tensors();

	return res;
}

function tf_to_tensor (...args) {
	_register_tensors(...args);
	var first_tensor = args.shift();
	var res = first_tensor.toTensor(...args);

	(() => { _custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();
	_clean_custom_tensors();

	return res;
}

function tf_mean (...args) {
	_register_tensors(...args);
	var res = tf.mean(...args);

	(() => { _custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();
	_clean_custom_tensors();

	return res;
}

function tf_relu (...args) {
	_register_tensors(...args);
	var res = tf.relu(...args);

	(() => { _custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();
	_clean_custom_tensors();

	return res;
}

function tf_concat (...args) {
	_register_tensors(...args);
	var first_tensor = args.shift();
	var res = first_tensor.concat(...args);

	(() => { _custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();
	_clean_custom_tensors();

	return res;
}

function expand_dims (...args) {
	_register_tensors(...args);
	var res = tf.expandDims(...args);

	(() => { _custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();
	_clean_custom_tensors();

	return res;
}

function tf_transpose (...args) {
	_register_tensors(...args);
	var res = tf.transpose(...args);

	(() => { _custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();
	_clean_custom_tensors();

	return res;
}


function tf_sub (...args) {
	_register_tensors(...args);
	var res = tf.sub(...args);

	(() => { _custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();
	_clean_custom_tensors();

	return res;
}

function tf_min (...args) {
	_register_tensors(...args);
	var res = tf.min(...args);

	(() => { _custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();
	_clean_custom_tensors();

	return res;
}

function tf_max (...args) {
	_register_tensors(...args);
	var res = tf.max(...args);

	(() => { _custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();
	_clean_custom_tensors();

	return res;
}

function tf_add (...args) {
	_register_tensors(...args);
	var first_tensor = args[0];
	var second_arg = args[1];
	var res = first_tensor.add(second_arg, ...args);

	(() => { _custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

	_clean_custom_tensors();

	return res;
}

function tf_mul (...args) {
	_register_tensors(...args);
	var res = tf.mul(...args);

	(() => { _custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();
	_clean_custom_tensors();

	return res;
}

function tf_div (...args) {
	_register_tensors(...args);
	var res = tf.div(...args);

	(() => { _custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();
	_clean_custom_tensors();

	return res;
}

function tf_moments (...args) {
	_register_tensors(...args);
	var res = tf.moments(...args);

	return res;
}

function tf_reshape (...args) {
	_register_tensors(...args);
	var res = tf.reshape(...args);

	(() => { _custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();
	_clean_custom_tensors();

	return res;
}

function tf_unique (...args) {
	_register_tensors(...args);
	var res = tf.unique(...args);

	(() => { _custom_tensors["" + res.values.id] = [get_stack_trace(), res.values, tensor_print_to_string(res.values)] })();
	(() => { _custom_tensors["" + res.indices.id] = [get_stack_trace(), res.indices, tensor_print_to_string(res.indices)] })();
	_clean_custom_tensors();

	return res;
}

function removeTimestampAndLines(inputString) {
	if(!debug) {
		return inputString;
	}
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

		err("[removeTimestampAndLines] " + e);

		return "";
	}
}

var get_stack_trace = function(force=0) {
	var s = "";
	if(!debug && force == 0) {
		return "Use debug to enable tensor debugging.";
	}

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
	_register_tensors(...args);
	await tf.nextFrame(...args);
}

function shuffleCombo (...args) {
	_register_tensors(...args);
	try {
		return tf.util.shuffleCombo(...args);
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("[shuffleCombo] " + e);
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
			wrn("[dispose] item was empty in dispose():"); // not a real async
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
	_register_tensors(...args);
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
		var original_e = e;
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		if(Object.keys(e).includes("stack")) {
			void(0); err("TIDY Error stack:", original_e.stack);
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
				(() => { _custom_tensors["" + k.id] = ["UUID:" + model_uuid, k, "[kernel in tf_sequential]"] })();
			}
		} catch (e) {
			wrn(e);
		}

		try {
			var b = res.layers[res.layers.length - 1].bias;

			if(b) {
				(() => { _custom_tensors["" + b.id] = ["UUID:" + model_uuid, b, "[bias in tf_sequential]"] })();
			}
		} catch (e) {
			wrn(e);
		}

		_clean_custom_tensors();

		return r;
	};

	(() => { _custom_tensors["" + res.id] = ["UUID:" + model_uuid, res, "[model in tf_sequential]"] })();

	_clean_custom_tensors();

	res["uuid"] = model_uuid;

	return res;
}

function buffer(...args) {
	_register_tensors(...args);
	try {
		var res = tf.buffer(...args);

		//(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
	try {
		var res = tf.browser.fromPixels(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
	try {
		var res = tf.input(...args);

		(() => { _custom_tensors["" + res.id] = [get_stack_trace(), res, "[input]"] })();

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
	_register_tensors(...args);
	try {
		var res = tf.ones(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
	try {
		var res = tf.reshape(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
	try {
		var res = tf.min(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
	try {
		var res = tf.max(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
	try {
		var res = tf.add(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
	try {
		var res = tf.abs(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
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

function resize_image (...args) {
	var $default_resize_method = $("#default_resize_method");

	if($default_resize_method.length != 1) {
		err(language[lang]["there_was_an_error_getting_default_resize_method"]);
		return;
	}
	
	var val = $default_resize_method.val();

	if(enable_resize_trace) {
		dbg(language[lang]["using_resize_type"] + " " + val);
		console.trace();
	}

	if(val == "nearestNeighbor") {
		return resizeNearestNeighbor(...args);
	} else if (val == "bilinear") {
		return resizeBilinear(...args);
	} else {
		err(`${language[lang]["unknown_value"]}: ${val} (type: ${typeof(val)}`);
	}
}

function resizeNearestNeighbor(...args) {
	_register_tensors(...args);
	try {
		var res = tf.image.resizeNearestNeighbor(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, "[resizeNearestNeighbor]"] })();

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
	_register_tensors(...args);
	try {
		var res = tf.image.resizeBilinear(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, "[resizeBilinear]"] })();

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
	_register_tensors(...args);
	try {
		var res = tf.image.rotateWithOffset(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
	try {
		var res = tf.image.flipLeftRight(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
	try {
		var res = tf.clipByValue(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
	try {
		var res = tf.randomUniform(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
	try {
		var res = tf.square(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
	try {
		var res = tf.mean(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
	try {
		var res = tf.sqrt(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
	try {
		var res = tf.tensor1d(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
	try {
		var res = tf.tensor2d(...args);

		(() => { _custom_tensors["" + res.dataId.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
	try {
		var res = tf.tensor(...args);

		(() => { _custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)] });

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
	_register_tensors(...args);
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
	_register_tensors(...args);
	try {
		var res = tf.divNoNan(...args);

		(() => { _custom_tensors["" + res.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	_register_tensors(...args);
	try {
		var res = tf.oneHot(...args);

		(() => { _custom_tensors[res.id] = [get_stack_trace(), res, tensor_print_to_string(res)] })();

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
	if(!debug) {
		return;
	}

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
				wrn("[_clean_custom_tensors] " + e);
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
		wrn("[parse_int] NaN detected in parse_int, args: " + JSON.stringify(args));
		console.trace();
	}

	return res;
}

function parse_float (...args) {
	var res = parseFloat(...args);

	if(isNaN(res)) {
		wrn("[parse_float] NaN detected in parse_int, args: " + JSON.stringify(args));
		console.trace();
	}

	return res;
}

async function loadLayersModel (...args) {
	_register_tensors(...args);
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

function toPixels (...args) {
	_register_tensors(...args);
	try {
		var res = tf.browser.toPixels(...args);

		return res;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err(e);

		return null;
	}
}
