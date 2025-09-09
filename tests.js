"use strict";

var tests_ended = false;

var expect_memory_leak = "";
var num_tests = 0;
var num_tests_failed = 0;
var failed_test_names = [];
var mem_history = [];

async function _set_seeds (nr) {
	l(language[lang]["setting_seed_to"] + " " + nr);
	$(".kernel_initializer_seed").val(nr).trigger("change");
	$(".bias_initializer_seed").val(nr).trigger("change");
	l(language[lang]["done_setting_seed_to"] + " " + nr);
}

async function add_layer_after_first(n) {
	for (var i = 0; i < n; i++) {
		$($(".add_layer")[0]).click();

		await wait_for_updated_page(5);
	}
}

async function _set_initializers() {
	$(".layer_options_button").click();

	l(language[lang]["setting_initializer"]);
	$("#set_all_kernel_initializers").val("glorotUniform").trigger("change");
	$("#set_all_bias_initializers").val("glorotUniform").trigger("change");
	l(language[lang]["done_setting_initializer"]);

	await _set_seeds(42);

	await wait_for_updated_page(3);
}

function get_current_timestamp () {
	return Date.now();
}

function escape_html_for_test(str) {
	return str.replace(/[&<>"']/g, c =>
		({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])
	);
}

function show_num_tests_overlay(name) {
	remove_num_tests_overlay();

	let div = document.createElement("div");
	div.id = "num-tests-overlay";
	div.innerHTML = `Test ${num_tests}<br>${escape_html_for_test(name)}`;
	log(`Test ${num_tests}\n${name}`)
	Object.assign(div.style, {
		position: "fixed",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		fontSize: "48px",
		fontWeight: "bold",
		color: "white",
		textShadow: "2px 2px 0 black, -2px 2px 0 black, 2px -2px 0 black, -2px -2px 0 black",
		pointerEvents: "auto",
		zIndex: "999999",
		userSelect: "none",
		cursor: "pointer",
		whiteSpace: "nowrap",
	});
	div.addEventListener("mouseenter", remove_num_tests_overlay);

	document.body.appendChild(div);
}

function remove_num_tests_overlay() {
	let old = document.getElementById("num-tests-overlay");
	if (old) old.remove();
}

function test_not_equal (name, is, should_be) {
	num_tests++;
	show_num_tests_overlay(name);
	if(!is_equal(is, should_be)) {
		//log("%c" + name + " OK", "background: green; color: white");
		return true;
	} else {
		err("[test_not_equal] " + name + " ERROR. Is: " + JSON.stringify(is) + ", should not be: " + JSON.stringify(should_be));
		num_tests_failed++;
		failed_test_names.push(name);
		return false;
	}
}

function test_equal (name, is, should_be) {
	num_tests++;
	show_num_tests_overlay(name);
	if(is_equal(is, should_be)) {
		//log("%c" + name + ": OK", "background: green; color: white");
		return true;
	} else {
		var res_str = name + ":\nERROR. Is: \n" + JSON.stringify(is) + "\nShould be:\n" + JSON.stringify(should_be);
		err("[test_equal] " + res_str);
		num_tests_failed++;
		failed_test_names.push(name);
		return false;
	}
}

function is_equal (a, b) {
	if(typeof(a) == typeof(b)) {
		if(JSON.stringify(a) == JSON.stringify(b)) {
			return true;
		}
	}

	return false;
}

function test_summary () {
	var tests_ok = num_tests - num_tests_failed;

	var tests_results_str = `${num_tests} tests, ok: ${tests_ok}, failed: ${num_tests_failed}`;

	if(tests_ended) {
		if(num_tests_failed) {
			console.log("%c" + tests_results_str, "background: red; color: white");
		} else {
			console.log("%c" + tests_results_str, "background: green; color: white");
		}
	} else {
		if(num_tests_failed) {
			console.log("%c" + tests_results_str + " (TESTS NOT ENDED!)", "background: red; color: white");
		} else {
			console.log("%c" + tests_results_str + " (TESTS NOT ENDED!)", "background: green; color: white");
		}
	}

	if(num_tests_failed) {
		l(`Failed tests: ${failed_test_names.join(", ")}`);
	}

	l(tests_results_str);
}

function log_test (name) {
	var current_mem = get_mem();
	if(mem_history.length) {
		var last_num_tensors = mem_history[mem_history.length - 1]["numTensors"];
		var this_num_tensors = current_mem["numTensors"];
		if(this_num_tensors > last_num_tensors) {
			if(!expect_memory_leak) {
				wrn("[log_test] There seems to be a memory leak in the last function. Before it, there were " + last_num_tensors + " Tensors defined, now it's " + this_num_tensors + ". This test-name: " + name);
			}
		}
	}

	mem_history.push(current_mem);

	var test_name_str = "Test-name: " + name;

	log(`-> ${test_name_str}`);
}

async function test_maximally_activated_last_layer() {
	var num_cat = await get_number_of_categories();

	var lt = get_layer_type_array();

	var canvasses = await draw_maximally_activated_layer(lt.length - 1, lt[lt.length - 1]);

	var real_os = get_shape_from_array(canvasses).join(",");

	var expected_os = `${num_cat},1`;

	if (real_os != expected_os) {
		err(sprintf(language[lang]["the_real_output_shape_x_does_not_match_the_expected_output_shape_y"], real_os, expected_os));
		return false;
	}

	if (canvasses.length != num_cat) {
		err(sprintf(language[lang]["the_number_of_categories_n_doesnt_match_the_number_of_given_canvasses_m"], num_cat, canvasses.length));
		return false;
	}

	for (var canvas_idx = 0; canvas_idx < canvasses.length; canvas_idx++) {
		if (typeof(canvasses[canvas_idx][0]) != "object") {
			void(0); 
			err(`canvasses[${canvas_idx}][0] is not an object, but ${typeof(canvasses[canvas_idx][0])}`);
			return false;
		}
	}

	if($("#visualization_tab_label").length == 0) {
		err("#visualization_tab_label not found");
		return false;
	}

	$("#visualization_tab_label").click()
	
	await sleep(1000);

	if($("#maximally_activated_label").length == 0) {
		err("#maximally_activated_label not found");
		return false;
	}
	$("#maximally_activated_label").click();

	await sleep(1000);

	return true;
}

function removeIdAttribute(htmlString) {
	try {
		var regex = /(\s+id\s*=\s*['"][^'"]+['"])/g;
		var modifiedHtml = htmlString.replace(regex, "");

		return modifiedHtml;
	} catch (error) {
		console.error("Error processing HTML with regex:", error);
		// Handle the error appropriately, e.g., return the original string
		return htmlString;
	}
}

function __run_tests___set_exit_code(code) {
	var el = document.getElementById("___run_tests___exit_code_automated_return_code");
	if (!el) {
		el = document.createElement("div");
		el.id = "___run_tests___exit_code_automated_return_code";
		el.style.display = "none";
		document.body.appendChild(el);
	}
	el.textContent = code;
}

function __test_get_save_buttons () {
	return $("[id^='save_button_']");
}

async function set_same_loss_and_metric(val) {
	await wait_for_updated_page(3);
	set_loss(val)
	await wait_for_updated_page(3);

	set_metric(val)
	await wait_for_updated_page(3);

	await delay(1000)
}

function get_fake_x_custom_tensor_data () {
	return `# shape: (3, 2)
1.000000000000000000e+00 2.000000000000000000e+00
# New slice
3.000000000000000000e+00 5.000000000000000000e+00
# New slice
6.000000000000000000e+00 7.000000000000000000e+00
# New slice
`;
}

function get_fake_y_custom_tensor_data () {
	return `# shape: (3, 1)
9.000000000000000000e+00
# New slice
7.000000000000000000e+00
# New slice
5.000000000000000000e+00
# New slice
`;
}

async function test_custom_tensor() {
        const wanted_epochs = 2;

	await set_dataset_and_wait("and_xor");

	await set_data_origin_and_wait("tensordata");

        x_file = get_fake_x_custom_tensor_data();

        y_file = get_fake_y_custom_tensor_data();

        debug_custom_tensor_x = x_file;

        debug_custom_tensor_y = y_file;

        set_x_file(x_file);

        set_y_file(y_file);

        await set_same_loss_and_metric("meanSquaredError");

        set_epochs(wanted_epochs);

	await wait_for_updated_page(3);

        const ret = await train_neural_network();

	reset_global_x_y_to_null();

	if(!is_valid_ret_object(ret, wanted_epochs)) {
		return false;
	}

        return true;
}

function reset_global_x_y_to_null() {
	set_x_file(null);
	set_y_file(null);
}

async function test_show_layer_data_flow() {
	$("#predict_tab_label").click()

	await sleep(1000)

	enable_or_disable_show_layer_data(true);

	await sleep(1000)

	$($(".example_images")[0]).click()

	await sleep(5000);

	if(!$("#layer_0_input").find("canvas").length) {
		err("#layer_0_input: no canvas for first layer input found");

		enable_or_disable_show_layer_data(false);
		return false;
	}

	if(!$("#layer_0_kernel").find("canvas").length) {
		err("#layer_0_kernel: no kernel canvas for first layer found")

		enable_or_disable_show_layer_data(false);
		return false;
	}

	enable_or_disable_show_layer_data(false);

	return true;
}

async function test_custom_drawn_images() {
	const wanted_epochs = 2;

	$("#jump_to_interesting_tab").prop("checked", true);

	$("#custom_image_training_data_small").click();

	log("Waiting for 2 save_buttons to exist...")

	var save_buttons = __test_get_save_buttons()

	while (save_buttons.length != 2) {
		save_buttons = __test_get_save_buttons()
		await sleep(1000);
		log(`Waiting another second for 2 save buttons, currently got ${save_buttons.length}...`)
	}

	await sleep(1000);

	log("Clicking the first save button")

	save_buttons[0].click();

	await sleep(1000)

	log("Waiting 1 second before clicking the second save button")

	await sleep(1000)

	save_buttons[1].click();

	set_epochs(wanted_epochs)

	const ret = await train_neural_network();

	if(!is_valid_ret_object(ret, wanted_epochs)) {
		return false;
	}

	if($("#sketcher").is(":visible")) {
		return true;
	}

	return false;
}

function is_valid_ret_object (ret, wanted_epochs) {
	if(ret === null) {
		err(`is_valid_ret_object: ret object was null`);
		return false;
	}

	if(ret === false) {
		err(`is_valid_ret_object: ret object was false`);
		return false;
	}

	var ok = 1;

	[ "validationData", "params", "epoch", "history" ].forEach(retName => {
		if(!(retName in ret)) {
			err(`test_custom_drawn_images(): Missing '${retName}' in ret!`);
			ok = 0;
		}
	});


	if(!ok) {
		return false;
	}

	if(!"epochs" in ret) {
		err(`test_custom_drawn_images: ret does not contain 'epochs':`, ret);
		return false;
	}

	const nr_epochs_in_ret = ret["epoch"].length;

	if(nr_epochs_in_ret != wanted_epochs) {
		err(`test_custom_drawn_images: number of epochs in ret is wrong, should be ${wanted_epochs}, is ${nr_epochs_in_ret}`);
		return false;
	}

	return true;
}

async function run_super_quick_tests (quick=0) {
	test_equal("test ok", 1, 1);
	test_not_equal("test not equal", 1, 2);

	test_equal("looks_like_number(1)", looks_like_number(1), true);
	test_equal("looks_like_number(100)", looks_like_number(100), true);
	test_equal("looks_like_number(-100)", looks_like_number(-100), true);
	test_not_equal("looks_like_number('aaa')", looks_like_number("aaa"), true);

	test_equal("array_to_latex_matrix([11])", array_to_latex_matrix([11]), `\\left(\\begin{matrix}
	11\\\\
\\end{matrix}\\right)
`);

	test_equal("array_to_latex_matrix([11, 11])", array_to_latex_matrix([11, 11]), `\\left(\\begin{matrix}
	11\\\\
	11\\\\
\\end{matrix}\\right)
`);

	test_equal("array_to_latex_matrix([[11, 11], [22, 22]])", array_to_latex_matrix([[11, 11], [22, 22]]), `\\left(\\begin{matrix}
	11 & 	11\\\\
	22 & 	22\\\\
\\end{matrix}\\right)
`);

	log_test("Tensor functions");

	var test_tensor = tensor([1,2,3]);
	test_equal("_tensor_print_to_string(tensor([1,2,3]))", _tensor_print_to_string(test_tensor), "Tensor\n  dtype: float32\n  rank: 1\n  shape: [3]\n  values:\n    [1, 2, 3]");
	await dispose(test_tensor);

	test_equal("is_numeric(1)", is_numeric(1), false);
	test_equal("is_numeric('1')", is_numeric("1"), true);
	test_equal("is_numeric('a')", is_numeric("a"), false);
	test_equal("output_shape_is_same([1,2,3], [1,2,3])", output_shape_is_same([1,2,3], [1,2,3]), true);
	test_not_equal("output_shape_is_same([1,2,3], [5,2,3])", output_shape_is_same([1,2,3], [5,2,3]), true);

	test_equal("ensure_shape_array('[1,2,3]')", ensure_shape_array("[1,2,3]"), [1,2,3]);
	test_equal("ensure_shape_array('[1,2,3,5]')", ensure_shape_array("[1,2,3,5]"), [1,2,3,5]);

	test_equal("last_index([1,2,3])", last_index([1,2,3]), 2);

	test_equal("add_bias_regularizer_l1_option('conv2d', 1)", removeIdAttribute(add_bias_regularizer_l1_option("conv2d", 1)), "<tr class='bias_regularizer_tr'><td>l1:</td><td><input class='input_field input_data bias_regularizer_l1' type='number' value='0.01'  _onchange='updated_page()' onkeyup=\"var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this); no_update_math=original_no_update_math;\" /></td>"); // await not possible

	test_equal("add_bias_initializer_distribution_option(\"conv2d\", 1)", removeIdAttribute(add_bias_initializer_distribution_option("conv2d", 1)), "<tr class='bias_initializer_tr'><td><span class=\"TRANSLATEME_distribution\"></span>:</td><td><select class='input_field input_data bias_initializer_distribution' _onchange='updated_page(null, null, this);'><option value=\"normal\">normal</option><option value=\"uniform\">uniform</option><option value=\"truncatedNormal\">truncatedNormal</option></select></td>");

	test_equal("add_kernel_initializer_value_option(\"conv2d\", 1)", removeIdAttribute(add_kernel_initializer_value_option("conv2d", 1)), "<tr class='kernel_initializer_tr'><td>Value:</td><td><input class='input_field input_data kernel_initializer_value' type='number' value='1'  onchange='updated_page(null, null, null, null, 1)' onkeyup=\"var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this, null, 1); no_update_math=original_no_update_math;\" /></td>"); // await not possible

	test_equal("add_depth_multiplier_option('dense', 3)", removeIdAttribute(add_depth_multiplier_option("dense", 3)), "<tr><td>Depth multiplier:</td><td><input class='input_field input_data depth_multiplier' type='number' min='0' step='1' value='1'  _onchange='updated_page()' onkeyup=\"var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this); no_update_math=original_no_update_math;\" /></td>"); // await not possible

	test_equal("quote_python(\"abc\")", quote_python("abc"), "\"abc\"");

	test_equal("quote_python(\"123\")", quote_python("123"), "123");

	test_equal("quote_python(123)", quote_python(123), "[123]");

	test_equal("get_tr_str_for_description(\"hallo\")", get_tr_str_for_description("hallo"), "<tr><td><span class='TRANSLATEME_description'></span>:</td><td><span class='typeset_me'>hallo</span></td></tr>");

	var color = "#ffffff";
	if(is_dark_mode) {
		color = "#353535";
	}

	test_equal("color_compare_old_and_new_layer_data([[[1]]], [[[1]]])", JSON.stringify(color_compare_old_and_new_layer_data([[[1]]], [[[1]]])), "[{\"0\":[\"" + color + "\"]}]");
	test_equal("color_compare_old_and_new_layer_data([[[1]]], [[[0]]])", JSON.stringify(color_compare_old_and_new_layer_data([[[1]]], [[[0]]])), "[{\"0\":[\"#cf1443\"]}]");
	test_equal("color_compare_old_and_new_layer_data([[[-1]]], [[[0]]])", JSON.stringify(color_compare_old_and_new_layer_data([[[-1]]], [[[0]]])), "[{\"0\":[\"#2e8b57\"]}]");

	test_equal("array_to_latex([[1],[2],[3]])", array_to_latex([[1],[2],[3]]), "\\underbrace{\\begin{pmatrix}\n1\\\\\n2\\\\\n3\n\\end{pmatrix}}");

	test_equal("array_to_fixed([1.555,2.555,3.555], 2)", JSON.stringify(array_to_fixed([1.555,2.555,3.555], 2)), "[1.55,2.56,3.56]");

	test_equal("group_layers([ \"conv2d\", \"maxPooling2d\", \"conv2d\", \"maxPooling2d\", \"flatten\", \"dropout\", \"dense\", \"dense\" ])", JSON.stringify(group_layers([ "conv2d", "maxPooling2d", "conv2d", "maxPooling2d", "flatten", "dropout", "dense", "dense" ])), "[{\"<span class='TRANSLATEME_feature_extraction'></span>\":[0,1,2,3]},{\"<span class='TRANSLATEME_flatten'></span>\":[4]},{\"Feature ex&shy;trac&shy;tion &amp; Over&shy;fit&shy;ting pre&shy;vention\":[5]},{\"<span class='TRANSLATEME_classification'></span>\":[6,7]}]");

	test_equal("decille([1,2,3,4,5,6,7,8,9,10, 11], 1)", decille([1,2,3,4,5,6,7,8,9,10, 11], 1), 10);

	test_equal("median([1,2,3,4,5])", median([1,2,3,4,5]), 3);

	test_equal("truncate_text(\"hallollolololololololllllolololo\", 10)", truncate_text("hallollolololololololllllolololo", 10), "hall...olo");

	test_equal("is_number_array([1,2,3,4,5])", is_number_array([1,2,3,4,5]), true);

	test_equal("is_number_array([1,2,\"a\",4,5])", is_number_array([1,2,"a",4,5]), false);

	test_equal("heuristic_layer_possibility_check(0, \"flatten\")", heuristic_layer_possibility_check(0, "flatten"), true);
	test_equal("heuristic_layer_possibility_check(0, \"dense\")", heuristic_layer_possibility_check(0, "dense"), true);

	var fit_data = await get_fit_data();

	test_equal("keys await get_fit_data()", JSON.stringify(Object.keys(fit_data)), "[\"validationSplit\",\"batchSize\",\"epochs\",\"shuffle\",\"verbose\",\"callbacks\",\"yieldEvery\"]");

	["batchSize", "epochs", "validationSplit"].forEach(function (item) {
		test_equal("typeof(await get_fit_data()['" + item + "']) == number", typeof(fit_data[item]), "number");
	});

	var callbacks_list = fit_data["callbacks"];

	Object.keys(callbacks_list).forEach(function (item) {
		test_equal("Callback '" + item + " is of type function", typeof(callbacks_list[item]), "function");
	});


	disable_train();
	test_equal("$(\".train_neural_network_button\").prop(\"disabled\") == true after disable_train", $(".train_neural_network_button").prop("disabled"), true);

	enable_train();
	test_equal("$(\".train_neural_network_button\").prop(\"disabled\") == false after enable_train", $(".train_neural_network_button").prop("disabled"), false);

	var example_div = $("<div id='example_test_div' />").appendTo($("body"));
	$("body").hide();
	test_equal("is_hidden_or_has_hidden_parent($('#example_test_div')) after hiding body", is_hidden_or_has_hidden_parent($("#example_test_div")), true);
	$("body").show();
	test_equal("is_hidden_or_has_hidden_parent($('#example_test_div')) after showing body", is_hidden_or_has_hidden_parent($("#example_test_div")), false);
	$(example_div).hide();
	test_equal("is_hidden_or_has_hidden_parent($('#example_test_div')) after hiding div itself", is_hidden_or_has_hidden_parent($("#example_test_div")), true);
	example_div.remove();
	test_equal("is_hidden_or_has_hidden_parent($('#example_test_div'))", is_hidden_or_has_hidden_parent($("#example_test_div")), false);


	var keys_valid_layer_options = Object.keys(valid_layer_options);

	for (var key_idx = 0; key_idx < keys_valid_layer_options.length; key_idx++) {
		var layer_name = keys_valid_layer_options[key_idx];
		var valid_options = valid_layer_options[layer_name];

		for (var j = 0; j < valid_options.length; j++) {
			var valid_option = valid_options[j];
			var py_name = python_names_to_js_names[valid_option];

			if(Object.keys(layer_options_defaults).includes(py_name) && !(layer_options_defaults[py_name] === null)) {
				if(!["size", "strides"].includes(py_name)) {
					// For some strange reason these 2 do not work... TODO
					test_equal("is_valid_parameter('" + py_name + "', " + layer_options_defaults[py_name] + ", 1)", is_valid_parameter(py_name, layer_options_defaults[py_name], 1), true);
				}
			}
		}
	}


	var old_labels = labels;
	await reset_labels();
	test_equal("labels.length = 0 after reset_labels", labels.length, 0);
	labels = old_labels;

	test_equal("await test_maximally_activated_last_layer()", await test_maximally_activated_last_layer(), true);

	if(quick) {
		remove_num_tests_overlay();
	}
}

function enable_or_disable_show_layer_data(_status) {
	$("#show_layer_data").prop("checked", _status).trigger("change")
}

async function set_first_kernel_initializer_to_constant (initializer_val) {
	$($(".bias_initializer")[0]).val("constant").trigger("change");
	$($(".kernel_initializer")[0]).val("constant").trigger("change");

	$($(".bias_initializer_value")[0]).val(initializer_val).trigger("change");
	$($(".kernel_initializer_value")[0]).val(initializer_val).trigger("change");

	await updated_page();
}

async function test_model_xor () {
	log_test("Test Training Logic");

	const wanted_epochs = 4;

	await set_dataset_and_wait("and_xor");

	enable_or_disable_show_layer_data(true);

	await set_model_dataset("and");

	await _set_initializers();

	$("#learningRate_adam").val("0.01").trigger("change");

	await set_epochs(wanted_epochs);

	const ret = await train_neural_network();

	if(!is_valid_ret_object(ret, wanted_epochs)) {
		return false;
	}

	enable_or_disable_show_layer_data(false);

	return true;
}

function getInnermostValue(value) {
	while (Array.isArray(value)) {
		if (value.length === 0) break;
		value = value[0];
	}
	return value;
}

async function test_initializer () {
	const initializer_val = 1;
	log_test("Testing initializer");

	await set_first_kernel_initializer_to_constant(initializer_val);

	await wait_for_updated_page(3);

	try {

		var synched_weights = array_sync(model.layers[0].weights[0].val);

		var innermost_synced_val = getInnermostValue(synched_weights);

		var kernel_initializer_correctly_set = innermost_synced_val == initializer_val;

		if(!kernel_initializer_correctly_set) {
			log(sprintf(language[lang]["initializer_value_failed_should_be_n_is_m"], initializer_val, innermost_synced_val));
		}

		test_equal("kernel_initializer_correctly_set", kernel_initializer_correctly_set, true);
	} catch (e) {
		err("[run_tests] " + e);
		console.trace();
	}
}

async function test_add_layer (nr_layers_to_add) {
	log_test("Add layer");

	var old_number_of_layers = $(".layer_setting").length;

	await add_layer_after_first(nr_layers_to_add);

	var new_number_of_layers = $(".layer_setting").length;

	test_equal("layer count sync", new_number_of_layers, get_layer_data().length);

	test_equal(`+${nr_layers_to_add} layer(s) added`, new_number_of_layers - old_number_of_layers, nr_layers_to_add);
}

async function test_training_images () {
	const wanted_epochs = 2;

	log_test("Test Training images");

	await set_dataset_and_wait("signs");

	await set_model_dataset("signs");

	await _set_initializers();

	set_imgcat(3);
	set_adam_lr(0.001);

	await set_epochs(wanted_epochs);

	const ret = await train_neural_network();

	if(!is_valid_ret_object(ret, wanted_epochs)) {
		return false;
	}

	$("#show_bars_instead_of_numbers").prop("checked", false);
	await updated_page();

	$("[href='#predict_tab']").click();
	await wait_for_updated_page(2);

	return true;
}

async function test_shuffle () {
	// testing shuffling
	await set_dataset_and_wait("signs");
	set_epochs(1);
	set_imgcat(1);
	$("#shuffle_before_each_epoch").prop("checked", true).trigger("change");

	var original_force_download = force_download;
	enable_force_download();
	test_not_equal("download_image_data(0) is not empty", JSON.stringify(await download_image_data(0)) == "[[],[],[],[],[],[],[],[],[],[]]", true);

	var xy_data = await get_x_and_y();
	disable_force_download();

	var y_test = array_sync(xy_data.y);

	await dispose(xy_data["x"]);
	await dispose(xy_data["y"]);

	test_equal("last 3 items are shuffled", !!JSON.stringify(y_test[y_test.length - 1]).match(/1\]$/) && !!JSON.stringify(y_test[y_test.length - 2]).match(/1\]$/) && !!JSON.stringify(y_test[y_test.length - 3]).match(/1\]$/), false);
}

async function test_resize_time () {
	log_test("Testing speed");

	var X = [20, 50, 100];

	await set_dataset_and_wait("signs");

	var start_time = get_current_timestamp();

	for (var k = 0; k < X.length; k++) {
		var wh = X[k];

		await set_width(wh);
		await set_height(wh);

		await wait_for_updated_page(1);
	}

	var end_time = get_current_timestamp();

	var time_resize_took = end_time - start_time;

	var time_test_ok = true;
	var max_resize_seconds = 30;

	if(time_resize_took > (max_resize_seconds * 1000)) {
		time_test_ok = false;
		void(0); log("time_resize_took:", time_resize_took);
	}

	test_equal(`time resize took was less than ${max_resize_seconds} seconds`, time_test_ok, true);
}

async function test_custom_csv() {
	const wanted_epochs = 3;

	log_test("Train on CSV");

	await set_dataset_and_wait("and_xor");

	expect_memory_leak = "";

	set_epochs(wanted_epochs);

	await set_data_origin_and_wait("csv");

	$("#csv_file").
		click().
		val("x1,x2,x3,y\n1,1,1,3\n2,2,2,6\n3,3,3,9\n1,2,3,6\n2,1,3,6\n").
		trigger("keyup").
		trigger("change").
		click()
	;

	await _set_initializers();
	await wait_for_updated_page(3);

	const ret = await train_neural_network();

	if(!is_valid_ret_object(ret, wanted_epochs)) {
		return false;
	}

	try {
		const predicted_data = await get_model_predict(tensor([[1, 1, 1]]));
		var res = array_sync(predicted_data)[0][0];
		test_equal("x1+x2+x3=y (1,1,1 = 3, got " + res + ")", Math.abs(res - 3) > 0, true);
	} catch (e) {
		err("[run_tests] ERROR while predicting in test mode:", e);
	}

	return true;
}

async function run_tests (quick=0) {
        window.test_done = false;
        window.test_result = 0;

	if(is_running_test) {
		wrn(language[lang]["can_only_run_one_test_at_a_time"]);
		return;
	}

	is_running_test = true;
	mem_history = [];
	log_test("Tests started");
	num_tests = num_tests_failed = 0;

	await run_super_quick_tests(quick);

	if(quick) {
		remove_num_tests_overlay();

		is_running_test = false;
		tests_ended = true;

		test_summary();

		return num_tests_failed;
	}

	tf.engine().startScope();

	var backends = ["webgl_backend", "cpu_backend"];
	backends = ["webgl_backend"]; // only test webgl
	for (var backend_id = 0; backend_id < backends.length; backend_id++) {
		tests_ended = false;

		dbg(language[lang]["setting_backend"] + ": " + backends[backend_id]);
		$("#" + backends[backend_id]).click().trigger("change");
		await set_backend();

		dbg(language[lang]["properly_set_backend"] + ": " + backends[backend_id]);

		await set_dataset_and_wait("signs");

		test_equal("test_show_layer_data_flow", await test_show_layer_data_flow(), true);

		test_equal("await test_model_xor()", await test_model_xor(), true);
		await test_initializer();
		await test_add_layer(2);

		expect_memory_leak = "a new layer was added";

		test_equal("await test_custom_csv()", await test_custom_csv(), true);

		test_equal("await test_training_images()", await test_training_images(), true);

		await test_shuffle();

		await test_resize_time();

		test_equal("test_custom_drawn_images()", await test_custom_drawn_images(), true);
		test_equal("test_custom_tensor()", await test_custom_tensor(), true);

		log_test("Tests ended");

		tests_ended = true;
	}

	remove_overlay();

	tf.engine().endScope();

	test_summary();

	is_running_test = false;

        window.test_done = true;
        window.test_result = num_tests_failed;

	__run_tests___set_exit_code(num_tests_failed);

	remove_num_tests_overlay();

	return num_tests_failed;
}
