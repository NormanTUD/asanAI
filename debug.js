"use strict";

function log (msg) {
	console.log(msg);
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

function add_function_debugger () {
	var ORIGINAL_FUNCTION_PREFIX = "___original___";
	var current_functions = Object.keys(window);

	for (var i in window) {
	    if(
		    i != "assert" &&							// Disable assert output
		    !["add_function_debugger", "getParamNames"].includes(i) &&		// exclude debug functions
		    typeof(window[i]) == "function" &&					// use only functions
		    i.indexOf(ORIGINAL_FUNCTION_PREFIX) === -1 &&			// do not re-do functions
		    !current_functions.includes(ORIGINAL_FUNCTION_PREFIX + i) &&	// do not re-do functions
		    window[i].toString().indexOf("native code") === -1 &&		// Ignore native functions
		    i != "$"								// Do not debug jquery
	    ) {
		    var param_names = getParamNames(window[i]);

		    var args_string = param_names.join(", "); 

		    var args_string_str = "";
		    if(param_names.length)  {
			    args_string_str = param_names.join(" + ', ' + ");
		    }

		    try {
			    var execute_this = `
			    window["${ORIGINAL_FUNCTION_PREFIX}${i}"] = window[i];
			    window["${i}"] = function (${args_string}) {
					call_depth = call_depth + 1;
					console.log("    ".repeat(call_depth) + "${i}(" + ${args_string_str} + ")");
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
	} else {
		console.warn("Disabled debug mode");
		tf.enableProdMode();
	}
}
