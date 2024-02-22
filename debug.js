"use strict";

var _full_debug_log = [];

var printed_msgs = [];

function get_latest_caller(full_stacktrace) {
	var isChrome = navigator. userAgent. includes("Chrome") && navigator

	if(isChrome) {
		return "";
	}

	if(!full_stacktrace) {
		return "";
	}

	try {
		full_stacktrace = full_stacktrace.split('@')[2].split(/\n/).pop()
		return full_stacktrace
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("" + e);
	}
}

function log_once (...args) {
	var md5 = JSON.stringify(args);

	if(printed_msgs.includes(md5)) {
		return;
	}

	printed_msgs.push(md5);

	log(...args);
}

function logt(...msg) {
	log(msg);
	console.trace();
}

function _clean_func_name(arg) {
	if(!arg) {
		return "";
	}
	
	try {
		arg = "" + arg;
		arg = arg.replace(/^\[[^\]]*\]\s*/, "");
		arg = arg.replace(/^\[\]\s*/, "");
	} catch (e) {
		console.error(`Error in _clean_func_name: ${e.message}`);
	}

	return arg;
}

function info (...args) {
	var function_name = get_latest_caller(get_stack_trace(1))
	if(function_name) {
		function_name = `[${function_name}] `;
	}

	args.forEach(arg => console.info(`${function_name}${_clean_func_name(arg)}`));
	args.forEach((arg) => {
		if(arg) {
			l("[INFO] " + arg);
		}
	});

	if(enable_log_trace) {
		console.trace();
	}

	var struct = {
		"type": "info",
		"stacktrace": get_stack_trace(1),
		"log": args,
		"time": parse_int(Date.now() / 1000)
	};

	_full_debug_log.push(struct);
}

function err (...args) {
	var function_name = get_latest_caller(get_stack_trace(1))
	if(function_name) {
		function_name = `[${function_name}] `;
	}

	args.forEach(arg => console.error(`${function_name}${_clean_func_name(arg)}`));
	args.forEach((arg) => {
		if(arg) {
			l("[&#128721; ERROR] " + arg);
		}
	});

	if(enable_log_trace) {
		console.trace();
	}

	var struct = {
		"type": "err",
		"stacktrace": get_stack_trace(1),
		"log": args,
		"time": parse_int(Date.now() / 1000)
	};

	_full_debug_log.push(struct);
}

function wrn (...args) {
	var function_name = get_latest_caller(get_stack_trace(1))
	if(function_name) {
		function_name = `[${function_name}] `;
	}

	args.forEach(arg => console.warn(`${function_name}${_clean_func_name(arg)}`));
	args.forEach((arg) => {
		if(arg) {
			l("[&#9888; WARN] " + arg);
		}
	});

	if(enable_log_trace) {
		console.trace();
	}

	var struct = {
		"type": "warn",
		"stacktrace": get_stack_trace(1),
		"log": args,
		"time": parse_int(Date.now() / 1000)
	};

	_full_debug_log.push(struct);
}

function dbg (...args) {
	var function_name = get_latest_caller(get_stack_trace(1))
	if(function_name) {
		function_name = `[${function_name}] `;
	}

	args.forEach(arg => console.debug(`${function_name}${_clean_func_name(arg)}`));

	if(enable_log_trace) {
		console.trace();
	}

	var struct = {
		"type": "debug",
		"stacktrace": get_stack_trace(1),
		"log": args,
		"time": parse_int(Date.now() / 1000)
	};

	_full_debug_log.push(struct);
}

function log_less (...args) {
	args.forEach(arg => console.log(arg));

	if(enable_log_trace) {
		console.trace();
	}

	var struct = {
		"type": "log",
		"stacktrace": get_stack_trace(1),
		"log": args,
		"time": parse_int(Date.now() / 1000)
	};

	_full_debug_log.push(struct);
}

function log (...args) {
	args.forEach(arg => console.log(arg));
	args.forEach((arg) => {
		if(arg) {
			if(typeof arg == "string") {
				l(arg);
			} else {
				console.log(arg);
			}	
		}
	});

	if(enable_log_trace) {
		console.trace();
	}

	var struct = {
		"type": "log",
		"stacktrace": get_stack_trace(1),
		"log": args,
		"time": parse_int(Date.now() / 1000)
	};

	_full_debug_log.push(struct);
}

function header_error (msg) {
	console.log("%c" + msg, "background: red; color: white");
}

function header (msg) {
	console.log("%c" + msg, "background: #222; color: #bada55");
}

function traindebug (msg) {
	if (window.location.href.indexOf("traindebug") > -1) {
		log(msg);
	}
}

function headerdatadebug (msg) {
	if (window.location.href.indexOf("datadebug") > -1) {
		console.log("%c" + msg, "background: #222; color: #bada55");
	}
}

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;
function get_param_names(func) {
	var fnStr = func.toString().replace(STRIP_COMMENTS, "");
	var result = fnStr.slice(fnStr.indexOf("(")+1, fnStr.indexOf(")")).match(ARGUMENT_NAMES);
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
			![
				"delay",
				"Swal",
				"get_python_name",
				"quote_python",
				"add_function_debugger",
				"write_model_summary",
				"Atrament",
				"check_number_values",
				"atrament_data",
				"get_model_config_hash",
				"grad_class_activation_map",
				"enable_train",
				"is_numeric",
				"colorize",
				"md5",
				"is_hidden_or_has_hidden_parent",
				"get_cookie",
				"decille",
				"headerdatadebug",
				"get_param_names",
				"predict_webcam",
				"memory_debugger",
				"data_debug",
				"debug_unusual_function_inputs",
				"loadLayersModel",
				"_allow_training",
				"fix_viz_width",
				"allow_training",
				"allow_training",
				"get_chosen_dataset",
				"show_load_weights",
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
			var param_names = get_param_names(window[i]);

			var args_string = param_names.join(", ");

			var original_function = window[i];

			try {
				var execute_this = `
					window["${ORIGINAL_FUNCTION_PREFIX}${i}"] = window[i];
					window["${i}"] = function (${args_string}) {
						call_depth = call_depth + 1;
						log("    ".repeat(call_depth) + "${i}");
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
				wrn(e);
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

function colorize (text, color) {
	if(color) {
		return "<span style='color: " + color + "'>" + text + "</span>";
	}
	return text;
}

function memory_debugger () {
	var memory;
	try {
		memory = tf.memory();
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		if(("" + e).includes("tf is null")) {
			err("[memory_debugger] tf is null");
		} else {
			throw new Error(e);
		}

		return;
	}


	var bytes = memory["numBytes"];
	var gpu_bytes = memory["numBytesInGPU"];

	var num_tensors =  memory["numTensors"]; // Object.keys(tensors).length;
	var ram_mb = bytes / 1024 / 1024;
	ram_mb = ram_mb.toFixed(2);
	var gpu_mb = gpu_bytes / 1024 / 1024;
	if(gpu_mb) {
		gpu_mb = gpu_mb.toFixed(2);
	}

	var tensor_color = "";
	var gpu_color = "";
	var cpu_color = "";

	if(last_num_global_tensors > num_tensors) {
		tensor_color = "#00ff00";
	} else if (last_num_global_tensors < num_tensors) {
		tensor_color = "#ff0000";
	}

	if(last_tensor_size_cpu > ram_mb) {
		cpu_color = "#00ff00";
	} else if (last_tensor_size_cpu < ram_mb) {
		cpu_color = "#ff0000";
	}

	if(last_tensor_size_gpu > gpu_mb) {
		gpu_color = "#00ff00";
	} else if (last_tensor_size_gpu < gpu_mb) {
		gpu_color = "#ff0000";
	}

	if(!lang) {
		err(`lang is not defined! Something is seriously wrong here...`);
		return;
	}

	if(!Object.keys(language).includes(lang)) {
		err(`${lang} is not in languages!`);
		return;
	}

	var debug_string = `${language[lang]["tensors"]}: ` + colorize(num_tensors, tensor_color) + ", RAM: " + colorize(ram_mb, cpu_color) + "MB";

	if(gpu_mb.toString().match(/^\d+(?:\.\d+)?$/)) {
		debug_string = debug_string + ", GPU: " + colorize(gpu_mb, gpu_color) + "MB";
	}

	if(Object.keys(_custom_tensors).length && debug) {
		debug_string += ", asanAI: " + Object.keys(_custom_tensors).length;
	}

	var memdeb = document.querySelector("#memory_debugger_div");

	if(memdeb) {
		if(memdeb.innerHTML != debug_string) {
			memdeb.innerHTML = debug_string;
		}
	} else {
		wrn("[memory_debugger] memory_debugger_div not found. Did you, by any chance, manually remove it?");
	}

	last_num_global_tensors = num_tensors;
	last_tensor_size_cpu = ram_mb;
	last_tensor_size_gpu = gpu_mb;
}

function install_memory_debugger () {
	$(function(){
		memory_debugger();
		memory_debug_interval = setInterval(memory_debugger, 400);
	});

}

function get_mem () {
	return tf.memory();
}

function add_optimizer_debugger () {
	tf.train.sgd = function (e) { log("SGD. Learning rate:", e); var res = original_sgd(e); log("Result:", res); return res; };
	tf.train.rmsprop = function (e, t, n, r, a) { log("RMSProp. learningRate, decay, momentum, epsilon, centered:", e, t, n, r, a); var res = original_rmsprop(e, t, n, r, a); log("Result:", res); return res; };
	tf.train.adamax = function (e, t, n, r, a) { log("adamax. learningRate, beta1, beta2, epsilon, decay:", e, t, n, r, a); var res = original_adamax(e, t, n, r, a); log("Result:", res); return res; };
	tf.train.adam = function (e, t, n, r) { log("adam. learningRate, beta1, beta2, epsilon", e, t, n, r); var res = original_adam(e, t, n, r); log("Result:", res); return res; };
	tf.train.adadelta = function (e, t, n) { log("adadelta. learningRate, rho, epsilon", e, t, n); var res = original_adadelta(e, t, n); log("Result:", res); return res; };
	tf.train.adagrad = function (e, t) { log("adagrad. learningRate, rho, epsilon", e, t); var res = original_adagrad(e, t); log("Result:", res); return res; };
	tf.train.momentum = function (e, t, n) { log("momentum. learningRate, momentum, useNesterov", e, t, n); var res = original_momentum(e, t, n); log("Result:", res); return res; };

}

function data_debug (...data) {
	log(">>>>>>>>>>>>>>>>>>");
	for (var i = 0; i < data.length; i++) {
		if(typeof(data[i]) == "object" && Object.keys(data[i]).includes("isDisposedInternal")) {
			log("[data_debug] Tensor", data[i]);
			try {
				data[i].print();
			} catch (e) {
				log("[data_debug] Error while printing: ", e);
			}
		} else {
			log(typeof(data[i]), data[i]);
		}
	}

	console.trace();
	log("<<<<<<<<<<<<<<<<<<");
}

function highlight_element(xpath) {
	try {
		const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
		if (element) {
			element.style.backgroundColor = "yellow";
			element.style.margin = "20px";
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("[highlight_element] Unhandled exception: " + e);
		return;
	}
}

function unhighlight_element(xpath) {
	try {
		const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
		if (element) {
			element.style.backgroundColor = "";
			element.style.margin = "0px";
		}
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("[unhighlight_element] Unhandled exception: " + e);
		return;
	}
}

function cosmo_debugger () {
	if(!is_cosmo_mode) {
		$("#cosmo_debugger").remove();
		return;
	}

	if(!enable_cosmo_debugger) {
		$("#cosmo_debugger").remove();
		return;
	}

	var cosmo_wave_debug_str = "current_skills: [" + JSON.stringify(current_skills) + "]";
	$("#cosmo_debugger").length ? $("#cosmo_debugger").html(cosmo_wave_debug_str) : $("body").append($(`<div id='cosmo_debugger' style='position: fixed; left: 700px; top: 10px; background-color: green; color: white; word-wrap: anywhere;'>Cosmo-Wave: ${cosmo_wave_debug_str}</div>`));

	$(".manicule_debugger").remove();

	var dbgf = (i, x) => {
		if(!is_hidden_or_has_hidden_parent(x)) {
			var xpath = get_element_xpath(x);
			var left = $(x).offset().left + $(x).width();
			var t = $(x).offset()["top"] + Math.random() * 20;

			var cosmo_debug_arr = [];

			var r = $(x).data("required_skills");

			if(typeof(r) == "string") {
				r = r.split(/,/);
				if(r.length) {
					for (var k = 0; k < r.length; k++) {
						var s = parse_required_skills(r[k]);
						var name = s[0];
						var val = s[1];

						if(Object.keys(current_skills).includes(name) && name && Object.keys(current_skills).includes(name) && val == current_skills[name]) {
							r[k] += "&#9989;";
						} else {
							r[k] += "&#10060;";
						}
					}
				}
				cosmo_debug_arr.push("required_skills: [" + r.join(", ") + "]");
			} else {
				cosmo_debug_arr.push("required_skills empty");
			}

			var s = $(x).data("show_again_when_new_skill_acquired");

			if(typeof(s) == "string") {
				s = s.split(/,/);
				if(s.length) {
					for (var k = 0; k < s.length; k++) {
						if(s[k]) {
							if(Object.keys(current_skills).includes(s[k])) {
								s[k] += "&#9989;";
							} else {
								s[k] += "&#10060;";
							}
						}
					}
				}
				cosmo_debug_arr.push("show_again_when_new_skill_acquired: [" + s.join(", ") + "]");
			} else {
				//cosmo_debug_arr.push("show_again_when_new_skill_acquired empty");
			}

			var cosmo_debug_str = cosmo_debug_arr.join(", ");

			$("body").append(`<div onmouseover='highlight_element("${xpath.replace(/"/g, "\\\"")}")' onmouseout='unhighlight_element("${xpath.replace(/"/g, "\\\"")}")' style='position: absolute; top: ${t}px; left: ${left}px; background-color: rgba(255, 150, 150, 128); text-shadow: #fff 1px 1px 1px;' class='manicule_debugger'>${cosmo_debug_str}</div>`);
		}
	};

	$(".cosmo").each(dbgf);
}

async function profile (func, ...args) {
	const profile = await tf.profile(await func(...args));

	log(`newBytes: ${profile.newBytes}`);
	log(`newTensors: ${profile.newTensors}`);
	log(`byte usage over all kernels: ${profile.kernels.map(k => k.totalBytesSnapshot)}`);
}

function label_debug (...args) {
	if(!set_label_debug) {
		return;
	}

	log(...args);
	console.trace();
}

function debug (...args) {
	console.debug(...args);
}

function create_graphviz_function_call_graph () {
	const dependencies = {};

	for (const functionName in window) {
		if (typeof window[functionName] === "function" && functionName !== "tf") {
			dependencies[functionName] = [];

			// Extract function body and search for function calls within it
			const fnBody = window[functionName].toString();
			const fnCalls = fnBody.match(/\w+\(/g);

			if (fnCalls) {
				fnCalls.forEach(fnCall => {
					const calledFunctionName = fnCall.replace("(", "");

					// Ensure it's not referring to itself
					if (calledFunctionName !== functionName && window[calledFunctionName]) {
						dependencies[functionName].push(calledFunctionName);
					}
				});
			}
		}
	}

	let dotFileContent = "digraph FunctionCalls {\n";
	for (const functionName in dependencies) {
		const calledFunctions = dependencies[functionName];
		calledFunctions.forEach(calledFunction => {
			dotFileContent += `  "${functionName}" -> "${calledFunction}";\n`;
		});
	}
	dotFileContent += "}\n";

	// You can log the dotFileContent or use other methods to save it as needed.
	log(dotFileContent); // Example: Logging the content to the console
}

// Execute the analysis
// create_graphviz_function_call_graph();
function detect_and_color_stacktrace(input_string) {
	try {
		var pattern = /([\w$]+)@((?:https?|ftp):\/\/[^\s/$.?#].[^\s]*)/g;
		var coloredString = input_string.replace(pattern, function(match, funcName, url) {
			return "<span style='color: #af0f0f;'>" + funcName + "</span>@<span style='color: #0f0faf;'>" + url + "</span>";
		});

		return coloredString;
	} catch (e) {
		if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("[detect_and_color_stacktrace] Unhandled exception: " + e);
		return;
	}
}

function create_html_table_from_json(data) {
	try {
		// Parse the input string into a JavaScript object

		// Check if data is an array with at least one element
		if (Array.isArray(data) && data.length > 0) {
			// Create an HTML table element
			var table = document.createElement("table");

			// Create the table header row
			var headerRow = document.createElement("tr");

			// Extract and store the keys from the first element
			var keys = Object.keys(data[0]);

			// Iterate through the keys to create header cells
			keys.forEach(function (key) {
				var headerCell = document.createElement("th");
				headerCell.textContent = key;
				headerRow.appendChild(headerCell);
			});

			// Append the header row to the table
			table.appendChild(headerRow);

			var last_row = "";

			// Create table rows for each data element
			data.forEach(function (item) {
				var row = document.createElement("tr");

				// Iterate through the keys and create table cells
				keys.forEach(function (key) {
					var cell = document.createElement("td");
					cell.innerHTML = "<pre>" + detect_and_color_stacktrace("" + item[key]) + "</pre>";
					row.appendChild(cell);
				});

				// Append the row to the table
				if(last_row != row.innerHTML) {
					table.appendChild(row);
					last_row = row.innerHTML;
				}
			});

			// Add the table to the HTML document
			return table.outerHTML;
		} else {
			// Handle the case when data is empty
			wrn("[create_html_table_from_json] Data is empty or not in the expected format.");
		}
	} catch (error) {
		// Log and handle any errors
		err("[create_html_table_from_json] An error occurred:", error);
	}
}

function send_post_request(url, htmlCode) {
	try {
		const xhr = new XMLHttpRequest();
		xhr.open("POST", url, true);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					// Request was successful
					log("[send_post_request] Anonymized bug report was sent.");
				} else {
					// Request failed
					wrn("[send_post_request] Anonymized bug report could not be sent:", xhr.status);
				}
			}
		};
		const data = "html_code=" + encodeURIComponent(htmlCode); // Encode the data
		xhr.send(data);
	} catch (error) {
		// Handle any exceptions
		err("[send_post_request] An error occurred:", error);
	}
}

async function _take_screenshot () {
	const screenshotTarget = document.body;

	var base_64 = "";

	await html2canvas(screenshotTarget).then((canvas) => {
		base_64 = canvas.toDataURL("image/png");
	});

	while (!base_64) {
		l("Waiting for screenshot...");
		await delay(1000);
	}

	return base_64;
}

async function send_bug_report () {
	var html = "<html><head><meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\"/></head><body>";

	html += "Runtime: " + Math.abs(parse_float((call_time - Date.now()) / 1000)) + " seconds<br>";

	if(privacy_is_tainted) {
		l("Privacy was tainted. Not taking a screenshot");
	} else {
		html += "<h1>Screenshot</h1>";

		html += "<img src=\"" + await _take_screenshot() + "\" />";
	}

	html += "<h1>URL</h1>";
	html += window.location.toString();

	var _env_dump = _dump_env_to_html();
	if (_env_dump) {
		html += "<h1>Environment</h1>";
		html += _env_dump;
	}

	html += "<h1>Browser-Information</h1>";
	html += "User-Agent: " + navigator.userAgent;

	html += "<h1>Model-Structure</h1>";
	html += "<pre>" + JSON.stringify(await get_model_structure(), null, 2) + "</pre>";

	html += "<h1>Model-Data</h1>";
	html += "<pre>" + JSON.stringify(await get_model_data(), null, 2) + "</pre>";

	html += "<h1>Logs</h1>";
	html += create_html_table_from_json(_full_debug_log);

	try {
		var pfj = JSON.stringify(performance.toJSON(), null, 2);

		if(pfj) {
			html += "<h1>performance.toJSON</h1>";
			html += pfj;
		}
	} catch (e) {
		wrn("" + e);
	}

	html += "</table></html>";

	send_post_request("save_error_log.php", html);
}

function taint_privacy () {
	if(privacy_is_tainted) {
		return;
	}

	info("Privacy is tainted. Bug reports will no longer contain screenshots");
	privacy_is_tainted = true;
}

function _dump_env_to_html () {
	var keys = Object.getOwnPropertyNames( window );
	var value;

	var all_vars = {};

	for( var i = 0; i < keys.length; ++i ) {
		value = window[ keys[ i ] ];
		if(!["function", "object"].includes(typeof(value))) {
			all_vars[keys[i]] = value;
		}
	}

	var html = "";
	var _keys = Object.keys(all_vars);
	for (var i = 0; i <= _keys.length; i++) {
		if("" + _keys[i] !== "undefined" && !["last_weights_as_string", "layer_structure_cache"].includes(_keys[i])) {
			html += `<tr><td>${_keys[i]}</td><td><pre>${all_vars[_keys[i]]}</pre></td></tr>`;
		}
	}

	if (html) {
		html = "<table>" + html + "</table>";
	}

	return html;
}

function generateRandomArray(minElements, maxElements) {
	// Generate a random number of elements within the specified range
	const numElements = Math.floor(Math.random() * (maxElements - minElements + 1)) + minElements;

	// Initialize the result array
	const randomArray = [];

	// Define the possible data types
	const dataTypes = ["string", "boolean", "number"];

	for (let i = 0; i < numElements; i++) {
		// Randomly select a data type
		const randomType = dataTypes[Math.floor(Math.random() * dataTypes.length)];

		// Generate a random value based on the selected data type
		let randomValue;

		if (randomType === "string") {
			// Generate a random string of random length
			const stringLength = Math.floor(Math.random() * 10) + 1; // Max length of 10
			const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
			let randomString = "";
			for (let j = 0; j < stringLength; j++) {
				randomString += characters.charAt(Math.floor(Math.random() * characters.length));
			}
			randomValue = randomString;
		} else if (randomType === "boolean") {
			// Generate a random boolean value
			randomValue = Math.random() < 0.5;
		} else {
			// Generate a random number (integer or float)
			randomValue = Math.random() * 100; // Adjust the range as needed
		}

		// Push the generated value to the array
		randomArray.push(randomValue);
	}

	return randomArray;
}

function countParametersByFunctionName(functionName) {
	// Finde die Funktion im globalen Bereich anhand des Namens
	const func = window[functionName];

	// Überprüfe, ob die Funktion existiert
	if (typeof func === 'function') {
		// Erhalte den Funktionscode als String
		const funcString = func.toString();

		// Benutze eine reguläre Expression, um die Parameterliste zu extrahieren
		const params = funcString.match(/\((.*?)\)/);

		if (params && params[1]) {
			// Zähle die Anzahl der Parameter, indem du die Parameterliste nach "," aufteilst
			const paramCount = params[1].split(',').length;
			return paramCount;
		} else {
			// Wenn keine Parameter gefunden wurden, gebe 0 zurück
			return 0;
		}
	} else {
		// Wenn die Funktion nicht gefunden wurde, gebe -1 zurück
		return -1;
	}
}

async function debug_unusual_function_inputs () {
	is_testing_unusual_inputs = true;
	for (var i in window) {
		if(
			[
				"adjust_number_of_neurons",
				"take_image_from_webcam_n_times",
				"get_own_tensor",
				"get_headers",
				"handle_y_file",
				"confusion_matrix",
				"updated_page_internal",
				"get_key_from_path",
				"get_tr_str_for_description",
				"insert_activation_option_trs",
				"get_cached_json",
				"set_momentum",
				"set_metric",
				"set_metric_to",
				"set_optimizer",
				"set_rho",
				"set_decay",
				"set_loss",
				"update_python_code",
				"is_numeric",
				"enable_symbol",
				"disable_symbol",
				"set_xyz_values",
				"wait_for_updated_page",
				"enable_symbol",
				"last_index",
				"detect_kernel_initializer",
				"change_favicon",
				"set_input_shape",
				"chose_dataset",
				"set_config",
				"show_layers",
				"get_python_name",
				"sortable_layers_container",
				"add_layer",
				"get_or_insert_label",
				"get_js_name",
				"copy_to_clipboard",
				"or_none",
				"get_element_xpath",
				"remove_layer",
				"option_for_layer",
				"set_batch_size",
				"init_epochs",
				"python_boilerplate",
				"convert_to_python_string",
				"get_new_number_of_neurons_according_to_visualization_randomness",
				"md5",
				"get_current_status_hash",
				"change_width_or_height",
				"copy_id_to_clipboard",
				"create_python_code",
				"disable_all_invalid_layers_from",
				"enable_valid_layer_types",
				"disable_invalid_layers_event",
				"toggle_options",
				"get_option_for_layer_by_type",
				"set_option_for_layer_by_layer_nr",
				"initializer_layer_options",
				"init_number_of_layers",
				"set_number_of_layers",
				"set_epochs",
				"get_shape_from_array",
				"set_epsilon",
				"set_learning_rate",
				"set_validation_split",
				"updated_page",
				"model_add_python_structure",
				"python_data_to_string",
				"_get_configuration",
				"get_json",
				"insert_initializer_trs",
				"insert_initializer_options",
				"findInitializerElement",
				"chi_squared_test",
				"insert_regularizer_options",
				"quote_python",
				"set_last_layer_activation_function",
				"insert_activation_options",
				"insert_initializer_option_trs",
				"insert_regularizer_option_trs",
				"insert_activation_option_trs",
				"get_tr_str_for_layer_table",
				"set_item_value",
				"array_likelyhood_of_being_random",
				"get_item_value",
				"get_dimensionality_from_layer_name",
				"get_shape_from_file",
				"get_full_shape_without_batch",
				"get_data_from_webcam",
				"set_loss_and_metric",
				"handle_x_file",
				"image_element_looks_random",
				"take_image_from_webcam",
				"get_image_data",
				"_get_urls_and_keys",
				"force_download_image_preview_data",
				"arbitrary_array_to_latex",
				"_arbitrary_array_to_latex",
				"force_download_image_preview_data",
				"headerdatadebug",
				"dispose",
				"hasWebGL",
				"is_tf_tensor",
				"lowercase_first_letter",
				"get_plotly_type",
				"get_plotly_layout",
				"_set_seeds",
				"_create_model",
				"compile_model",
				"_get_recreate_model",
				"get_html_from_model",
				"dispose_old_model_tensors",
				"get_canvas_in_class",
				"array_size",
				"_register_tensors",
				"nextFrame",
				"hide_unused_layer_visualization_headers",
				"rotateWithOffset",
				"augment_rotate_images_function",
				"get_current_chosen_object_default_weights_string",
				"get_initializer_name",
				"draw_image_if_possible",
				"trm",
				"array_to_fixed",
				"truncate_text",
				"_set_initializers",
				"add_tensor_as_image_to_photos",
				"_get_set_percentage_text",
				"write_layer_identification",
				"draw_internal_states",
				"input_gradient_ascent",
				"a_times_b",
				"write_descriptions",
				"_array_to_ellipsis_latex",
				"array_to_ellipsis_latex",
				"load_image",
				"shuffle",
				"degrees_to_radians",
				"_get_training_data_from_filename",
				"numpy_str_to_tf_tensor",
				"grad_class_activation_map",
				"toggle_previous_current_generated_images",
				"cosmo_maximally_activate_last_layer",
				"_create_table_cosmo",
				"get_layer_type_array",
				"add_layer_debuggers",
				"get_layer_data",
				"can_be_shown_in_latex",
				"array_to_html",
				"apply_color_map",
				"_show_eta",
				"download",
				"_get_neurons_last_layer",
				"draw_maximally_activated_layer",
				"get_weight_name_by_layer_and_weight_index",
				"get_layer_output_shape_as_string",
				"_get_h",
				"get_name_case_independent",
				"set_lang",
				"predict_maximally_activated",
				"download_weights_json",
				"download_model_and_weights_and_labels",
				"hide_layer_visualization_header_if_unused",
				"augment_invert_images",
				"augment_rotate_images",
				"augment_flip_left_right",
				"get_xs_and_ys",
				"_xs_xy_warning",
				"find_key_by_value",
				"identify_layers",
				"_get_training_data",
				"reset_data",
				"determine_input_shape",
				"shape_looks_like_image_data",
				"get_dim",
				"layer_has_multiple_nodes",
				"model_output_shape_looks_like_classification",
				"_check_data",
				"_heuristic_layer_possibility_check",
				"get_weights_as_string",
				"countParametersByFunctionName",
				"get_data_struct_by_header",
				"input_shape_is_image",
				"parse_csv_file",
				"parse_line",
				"parse_dtype",
				"decille",
				"median",
				"looks_like_image_data",
				"url_to_tf",
				"add_photo_to_gallery",
				"_temml",
				"array_to_color",
				"typeassert",
				"deprocess_image",
				"removeIdAttribute",
				"array_to_latex_color",
				"cosmo_stage_one",
				"array_to_latex",
				"cosmo_stage_two",
				"cosmo_stage_three",
				"set_augment_for_cosmo",
				"assertation_failed",
				"set_retrain_button",
				"find_tensors_with_is_disposed_internal",
				"get_weight_type_name_from_option_name",
				"get_weights_as_json",
				"draw_maximally_activated_neuron",
				"array_to_latex_matrix",
				"model_to_latex",
				"write_model_to_latex_to_page",
				"get_live_tracking_on_batch_end",
				"least_square",
				"color_compare_old_and_new_layer_data",
				"shuffleCombo",
				"buffer",
				"input",
				"ones",
				"reshape",
				"min",
				"max",
				"add",
				"abs",
				"resize_image",
				"resizeNearestNeighbor",
				"resizeBilinear",
				"rotateWithOffset",
				"flipLeftRight",
				"clipByValue",
				"randomUniform",
				"sqrt",
				"tensor1d",
				"tensor2d",
				"tensor",
				"grad",
				"divNoNan",
				"oneHot",
				"_clean_custom_tensors",
				"parse_int",
				"parse_float",
				"get_latest_caller",
				"_clean_func_name",
				"header_error",
				"header",
				"traindebug",
				"colorize",
				"memory_debugger",
				"install_memory_debugger",
				"get_mem",
				"data_debug",
				"unhighlight_element",
				"cosmo_debugger",
				"label_debug",
				"create_html_table_from_json",
				"send_post_request",
				"taint_privacy",
				"_dump_env_to_html",
				"generateRandomArray",
				"original_sgd",
				"original_adadelta",
				"original_adam",
				"original_adagrad",
				"original_adamax",
				"get_input_shape_as_string",
				"get_last_good_input_shape_as_string",
				"get_scatter_type",
				"uuidv4",
				"set_weights_from_string",
				"visualizeNumbersOnCanvas",
				"set_weights_from_json_object",
				"draw_grid_grayscale",
				"normalize_to_rgb_min_max",
				"_force_reinit",
				"save_model",
				"check_maximally_activated_last_layer",
				"force_reinit",
				"group_layers",
				"get_layer_identification",
				"explain_error_msg",
				"layer_is_red",
				"draw_grid",
				"draw_kernel",
				"detect_and_color_stacktrace",
				"start_gremlins",
				"array_sync",
				"calculate_default_target_shape",
				"test_summary",
				"test_equal",
				"test_not_equal",
				"log_test",
				"is_equal",
				"assert",
				"write_error",
				"except",
				"get_data_for_layer",
				"is_valid_parameter",
				"check_initializers",
				"get_key_name_camel_case",
				"create_model",
				"highlight_element",
				"_add_layers_to_model",
				"remove_empty",
				"_set_layer_gui",
				"get_fake_data_for_layertype",
				"get_default_option",
				"create_fake_model_structure",
				"layer_type_always_works",
				"heuristic_layer_possibility_check",
				"get_valid_layer_types",
				"compile_fake_model",
				"_add_layer_to_model",
				"tidy",
				"debug_unusual_function_inputs",
				"draw_rect",
				"loadLayersModel",
				"getComputedStyle",
				"postMessage",
				"close",
				"alert",
				"confirm",
				"prompt",
				"print",
				"add_optimizer_debugger",
				"l",
				"wrn",
				"err",
				"log",
				"dbg",
				"focus",
				"blur",
				"open",
				"stop",
				"captureEvents",
				"releaseEvents",
				"getSelection",
				"matchMedia",
				"moveTo",
				"moveBy",
				"resizeTo",
				"scroll",
				"scrollTo",
				"getDefaultComputedStyle",
				"resizeBy",
				"scrollBy",
				"scrollByLines",
				"scrollByPages",
				"updateCommands",
				"sizeToContent",
				"find",
				"dump",
				"setResizable",
				"requestIdleCallback",
				"cancelIdleCallback",
				"requestAnimationFrame",
				"cancelAnimationFrame",
				"reportError",
				"clearInterval",
				"queueMicrotask",
				"btoa",
				"atob",
				"setTimeout",
				"clearTimeout",
				"setInterval",
				"createImageBitmap",
				"structuredClone",
				"clearImmediate",
				"setImmediate",
				"onresize",
				"get_stack_trace",
				"log_once",
				"add_function_debugger",
				"create_graphviz_function_call_graph",
				"profile",
				"jStat",
				"$",
				"jQuery",
				"_take_screenshot",
				"send_bug_report",
				"_cosmo_set_environment",
				"get_param_names",
				"logt",
				"info",
				"log_less",
				"fetch",
				"Document.evaluate",
				"tf_sequential",
				"original_rmsprop",
				"add_kernel_initializer_value_option",
				"add_kernel_initializer_seed_option",
				"original_momentum",
				"add_function_debugger",
				"dataURLtoBlob",
				"swal",
				"SweetAlert",
				"Swal",
				"sweetAlert",
				"run_tests",
				"write_error",
				"Sweetalert2",
				"fromPixels",
				"toPixels",
				"get_tfjs_model",
				"get_weights_shape",
				"expand_dims"
			].includes(i) || 
			i.startsWith("tf_") ||
			countParametersByFunctionName(i) <= 0
		) {
			continue;
		}

		if(typeof(window[i]) == "function") {
			if(i.includes("reload") || (i.startsWith("add_") && i.endsWith("_option"))) {
				continue;
			}

			var params = generateRandomArray(0, 10);

			var params_quoted = [];

			for (var j = 0; j < params.length; j++) {
				if(typeof(params[j]) == "boolean" || typeof(params[j]) == "number") {
					params_quoted.push(params[j]);
				} else {
					params_quoted.push('"' + params[j].replace(/"/g, '\\"') + '"');
				}
			}

			var params_str = params_quoted.join(", ");

			console.log(`${i}(${params_str})`);
			//await delay(3000);

			try {
				await window[i](...params);
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				is_testing_unusual_inputs = false;

				err("[debug_unusual_function_inputs] Unhandled exception: " + e);
				return 1;
			}
		}
	}

	is_testing_unusual_inputs = false;

	return 0;
}

//debug_unusual_function_inputs();

function start_gremlins () {
	try {
		javascript: (function() {
			function callback() {
				gremlins.createHorde({
					species: [
						gremlins.species.clicker(),
						gremlins.species.toucher(),
						//gremlins.species.formFiller(),
						gremlins.species.scroller(),
						gremlins.species.typer()
					],
					mogwais: [
						gremlins.mogwais.alert(),
						gremlins.mogwais.gizmo()
					],
					strategies: [
						gremlins.strategies.distribution()
					]
				}).unleash();
			}
			var s = document.createElement("script");
			s.src = "https://unpkg.com/gremlins.js";
			if (s.addEventListener) {
				s.addEventListener("load", callback, false);
			} else if (s.readyState) {
				s.onreadystatechange = callback;
			}
			document.body.appendChild(s);
		})()
	} catch (e) {
			if(Object.keys(e).includes("message")) {
			e = e.message;
		}

		err("[start_gremlins] Unhandled exception: " + e);
		return 1;	
	}
}
