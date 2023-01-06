"use strict";

function colorlog (color, msg) {
	console.log("%c" + msg, "background: " + color + "; color: white");
}

function logt(...msg) {
	log(msg);
	console.trace();
}

function log (...args) {
	args.forEach(arg => console.log(arg))
	//console.trace();
}

function header_error (msg) {
	console.log("%c" + msg, "background: red; color: white");
}

function header (msg) {
	console.log("%c" + msg, "background: #222; color: #bada55");
}

function datadebug (msg) {
	if (window.location.href.indexOf("datadebug") > -1) {
		console.log(msg);
	}
}

function traindebug (msg) {
	if (window.location.href.indexOf("traindebug") > -1) {
		console.log(msg);
	}
}

function headerdatadebug (msg) {
	if (window.location.href.indexOf("datadebug") > -1) {
		console.log("%c" + msg, "background: #222; color: #bada55");
	}
}
function headerguidebug (msg) {
	if (window.location.href.indexOf("guidebug") > -1) {
		console.log("%c" + msg, "background: #222; color: #bada55");
	}
}

function get_current_model_weights_identifier () {
	tf.sum(model.layers[0].getWeights()[0]).print();
}

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;
function getParamNames(func) {
	var fnStr = func.toString().replace(STRIP_COMMENTS, '');
	var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
	if(result === null)
		result = [];
	return result;
}


function add_memory_debugger () {
	var ORIGINAL_FUNCTION_PREFIX = "___original___";
	var current_functions = Object.keys(window);

	for (var i in window) {
	    if(
		    i != "assert" &&							// Disable assert output
		    ![
			    "delay", 
			    "Swal", 
			    "add_function_debugger", 
			    "getParamNames", 
			    "memory_debugger", 
			    "_allow_training", 
			    "fix_viz_width", 
			    "allow_training", 
			    "allow_training", 
			    "get_chosen_dataset", 
			    "show_load_weights", 
			    "_show_load_weights", 
			    "get_current_chosen_object_default_weights_string", 
			    "get_chosen_dataset", 
			    "dispose", 
			    "get_weights_shape", 
			    "get_weights_as_string", 
		    ].includes(i) &&		// exclude these functions
		    typeof(window[i]) == "function" &&					// use only functions
		    i.indexOf(ORIGINAL_FUNCTION_PREFIX) === -1 &&			// do not re-do functions
		    !current_functions.includes(ORIGINAL_FUNCTION_PREFIX + i) &&	// do not re-do functions
		    window[i].toString().indexOf("native code") === -1 &&		// Ignore native functions
		    i != "$"								// Do not debug jquery
	    ) {
		    var param_names = getParamNames(window[i]);

		    var args_string = param_names.join(", "); 

		    try {
			    var execute_this = `
			    window["${ORIGINAL_FUNCTION_PREFIX}${i}"] = window[i];
			    window["${i}"] = function (${args_string}) {
					var start_tensors = tf.memory()["numTensors"];

					var result = window["${ORIGINAL_FUNCTION_PREFIX}${i}"](${args_string});

					var end_tensors = tf.memory()["numTensors"];
					if((end_tensors - start_tensors) != 0) {
						log((end_tensors - start_tensors) + " new tensors in ${i}");
					}
					return result;
			    }
			    `;

			    eval(execute_this);
		    } catch (e) {
			    console.warn(e);
			    log(i);
			    log(param_names);
			    window[i] = original_function;
		    }
	    }
	}
}

function add_function_debugger () {
	var ORIGINAL_FUNCTION_PREFIX = "___original___";
	var current_functions = Object.keys(window);

	for (var i in window) {
	    if(
		    i != "assert" &&							// Disable assert output
		    ![
			    "delay", 
			    "Swal", 
			    "add_function_debugger", 
			    "getParamNames", 
			    "memory_debugger", 
			    "_allow_training", 
			    "fix_viz_width", 
			    "allow_training", 
			    "allow_training", 
			    "get_chosen_dataset", 
			    "show_load_weights", 
			    "_show_load_weights", 
			    "get_current_chosen_object_default_weights_string", 
			    "get_chosen_dataset", 
			    "dispose", 
			    "get_weights_shape", 
			    "get_weights_as_string", 
		    ].includes(i) &&		// exclude these functions
		    typeof(window[i]) == "function" &&					// use only functions
		    i.indexOf(ORIGINAL_FUNCTION_PREFIX) === -1 &&			// do not re-do functions
		    !current_functions.includes(ORIGINAL_FUNCTION_PREFIX + i) &&	// do not re-do functions
		    window[i].toString().indexOf("native code") === -1 &&		// Ignore native functions
		    i != "$"								// Do not debug jquery
	    ) {
		    var param_names = getParamNames(window[i]);

		    var args_string = param_names.join(", "); 

		    try {
			    var execute_this = `
			    window["${ORIGINAL_FUNCTION_PREFIX}${i}"] = window[i];
			    window["${i}"] = function (${args_string}) {
					call_depth = call_depth + 1;
					console.log("    ".repeat(call_depth) + "${i}");
					var _start_time = + new Date();
					if(!Object.keys(function_times).includes("${i}")) {
						function_times["${i}"] = {};
						function_times["${i}"]["whole_time"] = 0;
						function_times["${i}"]["call_count"] = 0;
					}
					var result = window["${ORIGINAL_FUNCTION_PREFIX}${i}"](${args_string});
					var _end_time = + new Date();
					function_times["${i}"]["whole_time"] = function_times["${i}"]["whole_time"] + (_end_time - _start_time);
					function_times["${i}"]["call_count"] = function_times["${i}"]["call_count"] + 1;

					call_depth = call_depth - 1;
					return result;
			    }
			    `;

			    eval(execute_this);
		    } catch (e) {
			    console.warn(e);
			    log(i);
			    log(param_names);
			    window[i] = original_function;
		    }
	    }
	}
}

function tf_debug () {
	if($("#enable_tf_debug").is(":checked")) {
		tf.enableDebugMode();
		$("#enable_tf_debug").prop("disabled", true);
	}
}

function memory_debugger () {
	var memory = tf.memory();

	var bytes = memory["numBytes"];
	var gpu_bytes = memory["numBytesInGPU"];

	var num_tensors = memory["numTensors"];
	var ram_mb = bytes / 1024 / 1024;
	ram_mb = ram_mb.toFixed(2);
	var gpu_mb = gpu_bytes / 1024 / 1024;
	if(gpu_mb) {
		gpu_mb = gpu_mb.toFixed(2);
	}

	var debug_string = "Tensors: " + num_tensors + ", RAM: " + ram_mb + "MB";
	if(gpu_mb.toString().match(/^\d+(?:\.\d+)?$/)) {
		debug_string = debug_string + ", GPU: " + gpu_mb + "MB"
	}

	document.querySelector('#memory_debugger_div').innerHTML = debug_string;
	//$("#memory_debugger_div").html(debug_string);
}

function install_memory_debugger () {
	l("Installing Memory debugger");
	$(function(){
		memory_debugger();
		memory_debug_interval = setInterval(memory_debugger, 100);
	});

}

function log_mem () {
	log("=====================");
	log("Number of tensors: " + tf.memory()["numTensors"]);
	log("MB in RAM:" + (tf.memory().numBytes / (1024*1024)) + "MB");
}

function get_mem () {
	return tf.memory();
}

function add_optimizer_debugger () {
	tf.train.sgd = function (e) { log("SGD. Learning rate:", e); var res = original_sgd(e); log("Result:", res); return res; }
	tf.train.rmsprop = function (e, t, n, r, a) { log("RMSProp. learningRate, decay, momentum, epsilon, centered:", e, t, n, r, a); var res = original_rmsprop(e, t, n, r, a); log("Result:", res); return res; }
	tf.train.adamax = function (e, t, n, r, a) { log("adamax. learningRate, beta1, beta2, epsilon, decay:", e, t, n, r, a); var res = original_adamax(e, t, n, r, a); log("Result:", res); return res; }
	tf.train.adam = function (e, t, n, r) { log("adam. learningRate, beta1, beta2, epsilon", e, t, n, r); var res = original_adam(e, t, n, r); log("Result:", res); return res; }
	tf.train.adadelta = function (e, t, n) { log("adadelta. learningRate, rho, epsilon", e, t, n); var res = original_adadelta(e, t, n); log("Result:", res); return res; }
	tf.train.adagrad = function (e, t) { log("adagrad. learningRate, rho, epsilon", e, t); var res = original_adagrad(e, t); log("Result:", res); return res; }
	tf.train.momentum = function (e, t, n) { log("momentum. learningRate, momentum, useNesterov", e, t, n); var res = original_momentum(e, t, n); log("Result:", res); return res; }

}
