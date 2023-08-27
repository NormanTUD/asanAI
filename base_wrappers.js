var _custom_tensors = {};

var getStackTrace = function() {
	try { var a = {}; a.debug(); } catch(ex) { return (ex.stack) }
};


async function dispose (item) { // start_tensors
	//console.trace();
	//log(item);
	if(item) {
		var tensor_id = item.id;
		tf.dispose(item);

		await tf.nextFrame();
	} else {
		/*
		console.warn("item was empty in dispose():"); // not a real async
		console.trace();
		*/
	}

	_clean_custom_tensors();
}

function tensor1d (...args) {
	var res = tf.tensor1d(...args);

	_custom_tensors["" + res.dataId.id] = [getStackTrace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function tensor2d (...args) {
	var res = tf.tensor2d(...args);

	_custom_tensors["" + res.dataId.id] = [getStackTrace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function tensor (...args) {
	var res = tf.tensor(...args);

	_custom_tensors["" + res.dataId.id] = [getStackTrace(), res, tensor_print_to_string(res)];

	_clean_custom_tensors();

	return res;
}

function oneHot (...args) {
	var res = tf.oneHot(...args);

	_custom_tensors[res.dataId.id] = [getStackTrace(), res, tensor_print_to_string(res)];

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
				console.warn(e);
			}
		}
	}

	for (var i in disposed_keys) {
		delete _custom_tensors[disposed_keys[i]];
	}
}
