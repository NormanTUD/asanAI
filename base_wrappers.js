var _custom_tensors = [];

function tensor1d (...args) {
	var res = tf.tensor1d(...args);

	_custom_tensors[res.dataId.id] = res;

	_clean_custom_tensors();

	return res;
}

function tensor2d (...args) {
	var res = tf.tensor2d(...args);

	_custom_tensors[res.dataId.id] = res;

	_clean_custom_tensors();

	return res;
}

function tensor (...args) {
	var res = tf.tensor(...args);

	_custom_tensors[res.dataId.id] = res;

	_clean_custom_tensors();

	return res;
}

function oneHot (...args) {
	var res = tf.oneHot(...args);

	_custom_tensors[res.dataId.id] = res;

	_clean_custom_tensors();

	return res;
}

function _clean_custom_tensors () {
	var keys = Object.keys(_custom_tensors);
	var disposed_keys = [];

	for (var i in keys) {
		var key = keys[i];

		if(!Object.keys(_custom_tensors).includes(key) || _custom_tensors[key].isDisposedInternal || _custom_tensors[key].isDisposed) {
			disposed_keys.push(key);
		}
	}

	for (var i in disposed_keys) {
		delete _custom_tensors[disposed_keys[i]];
	}

	_custom_tensors = _custom_tensors.filter(n=>n);
}
