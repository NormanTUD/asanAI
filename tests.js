"use strict";

var num_tests = 0;
var num_tests_failed = 0;

function layer_types_that_dont_have_default_options () {
	var no_options = [];

	var all_options = [];

	var keys = Object.keys(layer_options);

	for (var i = 0; i < keys.length; i++) {
		var layer_name = keys[i];
		for (var j = 0; j < layer_options[layer_name]["options"].length; j++) {
			var this_option = layer_options[layer_name]["options"][j];
			if(!all_options.includes(this_option)) {
				all_options.push(this_option);
			}
		}
	}

	for (var i = 0; i < all_options.length; i++) {
		var key = all_options[i];
		if(!key in layer_options_defaults) {
			no_options.push(key);
		}
	}

	return no_options;
}

function test_not_equal (name, is, should_be) {
	num_tests++;
	if(!is_equal(is, should_be)) {
		//console.log("%c" + name + " OK", "background: green; color: white");
		return true;
	} else {
		console.log("%c" + name + " ERROR. Is: " + JSON.stringify(is) + ", should be: " + JSON.stringify(should_be), "background: red; color: white");
		num_tests_failed++;
		return false;
	}
}

function test_equal (name, is, should_be) {
	num_tests++;
	if(is_equal(is, should_be)) {
		//console.log("%c" + name + ": OK", "background: green; color: white");
		return true;
	} else {
		console.log("%c" + name + ":\nERROR. Is: \n" + JSON.stringify(is) + "\nShould be:\n" + JSON.stringify(should_be), "background: red; color: white");
		num_tests_failed++;
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
	if(num_tests_failed) {
		console.log("%c" + tests_results_str, "background: red; color: white");
	} else {
		console.log("%c" + tests_results_str, "background: green; color: white");
	}
}

async function run_tests () {
	num_tests = num_tests_failed = 0;
	test_equal("test ok", 1, 1);
	test_not_equal("test not equal", 1, 2);

	test_equal("looks_like_number(1)", looks_like_number(1), true);
	test_equal("looks_like_number(100)", looks_like_number(100), true);
	test_equal("looks_like_number(-100)", looks_like_number(-100), true);
	test_not_equal("looks_like_number('aaa')", looks_like_number('aaa'), true);

	tf.engine().startScope();

	var test_tensor = tf.tensor([1,2,3]);

	test_equal("tensor_print_to_string(tf.tensor([1,2,3]))", tensor_print_to_string(test_tensor), "Tensor\n  dtype: float32\n  rank: 1\n  shape: [3]\n  values:\n    [1, 2, 3]")

	test_equal("output_shape_is_same([1,2,3], [1,2,3])", output_shape_is_same([1,2,3], [1,2,3]), true);
	test_not_equal("output_shape_is_same([1,2,3], [5,2,3])", output_shape_is_same([1,2,3], [5,2,3]), true);

	test_equal("ensure_shape_array('[1,2,3]')", ensure_shape_array('[1,2,3]'), [1,2,3]);
	test_equal("ensure_shape_array('[1,2,3,5]')", ensure_shape_array('[1,2,3,5]'), [1,2,3,5]);


	var example_div = $("<div id='example_test_div' />").appendTo($("body"));

	test_equal("is_hidden_or_has_hidden_parent($('#example_test_div'))", is_hidden_or_has_hidden_parent($('#example_test_div')), false);

	$("body").hide();
	test_equal("is_hidden_or_has_hidden_parent($('#example_test_div')) after hiding body", is_hidden_or_has_hidden_parent($('#example_test_div')), true);

	$("body").show();
	test_equal("is_hidden_or_has_hidden_parent($('#example_test_div')) after showing body", is_hidden_or_has_hidden_parent($('#example_test_div')), false);

	$(example_div).hide();
	test_equal("is_hidden_or_has_hidden_parent($('#example_test_div')) after hiding div itself", is_hidden_or_has_hidden_parent($('#example_test_div')), true);

	example_div.remove();

	test_equal("last_index([1,2,3])", last_index([1,2,3]), 2);

	test_equal("add_bias_regularizer_l1_option('conv2d', 1)", add_bias_regularizer_l1_option("conv2d", 1), "<tr class='bias_regularizer_tr'><td>l1:</td><td><input class='input_field input_data bias_regularizer_l1' type='number'  value=0.01  _onchange='updated_page()' onkeyup='updated_page(null, null, this)' /></td>");

	test_equal('add_bias_initializer_distribution_option("conv2d", 1)', add_bias_initializer_distribution_option("conv2d", 1), "<tr class='bias_initializer_tr'><td>Distribution:</td><td><select class='input_field input_data bias_initializer_distribution' _onchange='updated_page(null, null, this);'><option value=\"normal\">normal</option><option value=\"uniform\">uniform</option><option value=\"truncatedNormal\">truncatedNormal</option></select></td>");

	test_equal('add_kernel_initializer_value_option("conv2d", 1)', add_kernel_initializer_value_option("conv2d", 1), "<tr class='kernel_initializer_tr'><td>Value:</td><td><input class='input_field input_data kernel_initializer_value' type='number'  value=1  _onchange='updated_page()' onkeyup='updated_page(null, null, this)' /></td>");

	test_equal("add_depth_multiplier_option('dense', 3)", add_depth_multiplier_option('dense', 3), "<tr><td>Depth multiplier:</td><td><input class='input_field input_data depth_multiplier' type='number'  min=0  max=1  step=0.1  value=1  _onchange='updated_page()' onkeyup='updated_page(null, null, this)' /></td>");

	test_equal('quote_python("abc")', quote_python("abc"), "\"abc\"");

	test_equal('quote_python("123")', quote_python("123"), "123");

	test_equal('quote_python(123)', quote_python(123), "[123]");

	test_equal('get_tr_str_for_description("hallo")', get_tr_str_for_description("hallo"), "<tr><td>Description:</td><td><i class='typeset_me'>hallo</i></td></tr>");


	var cookie_theme = getCookie("theme");
	var darkmode = 0;
	if(cookie_theme == "darkmode") {
		darkmode = 1;
	}

	var color = "black";
	if(darkmode) {
		color = "white";
	}
	test_equal('color_compare_old_and_new_layer_data([[[1]]], [[[1]]])', JSON.stringify(color_compare_old_and_new_layer_data([[[1]]], [[[1]]])), "[{\"0\":[\"" + color + "\"]}]");
	test_equal('color_compare_old_and_new_layer_data([[[1]]], [[[0]]])', JSON.stringify(color_compare_old_and_new_layer_data([[[1]]], [[[0]]])), "[{\"0\":[\"OrangeRed\"]}]");
	test_equal('color_compare_old_and_new_layer_data([[[-1]]], [[[0]]])', JSON.stringify(color_compare_old_and_new_layer_data([[[-1]]], [[[0]]])), "[{\"0\":[\"SeaGreen\"]}]");

	test_equal('array_to_latex([[1],[2],[3]])', array_to_latex([[1],[2],[3]]), "\\underbrace{\\begin{pmatrix}\n1\\\\\n2\\\\\n3\n\\end{pmatrix}}_{\\mathrm{undefined}}\n");

	test_equal("array_to_fixed([1.555,2.555,3.555], 2)", JSON.stringify(array_to_fixed([1.555,2.555,3.555], 2)), "[1.55,2.56,3.56]");

	test_equal('group_layers([ "conv2d", "maxPooling2d", "conv2d", "maxPooling2d", "flatten", "dropout", "dense", "dense" ])', JSON.stringify(group_layers([ "conv2d", "maxPooling2d", "conv2d", "maxPooling2d", "flatten", "dropout", "dense", "dense" ])), "[{\"Feature ex&shy;traction\":[0,1,2,3]},{\"Flatten\":[4]},{\"Feature ex&shy;traction&amp;Over&shy;fitting pre&shy;vention\":[5]},{\"Classi&shy;fication\":[6,7]}]");

	test_equal('decille([1,2,3,4,5,6,7,8,9,10, 11], 1)', decille([1,2,3,4,5,6,7,8,9,10, 11], 1), 10);

	test_equal('median([1,2,3,4,5])', median([1,2,3,4,5]), 3);

	test_equal('truncate_text("hallollolololololololllllolololo", 10)', truncate_text("hallollolololololololllllolololo", 10), "hall...olo");

	test_equal('is_number_array([1,2,3,4,5])', is_number_array([1,2,3,4,5]), true);

	test_equal('is_number_array([1,2,"a",4,5])', is_number_array([1,2,"a",4,5]), false);

	var keys_valid_layer_options = Object.keys(valid_layer_options);

	for (var i = 0; i < keys_valid_layer_options.length; i++) {
		var layer_name = keys_valid_layer_options[i];
		var valid_options = valid_layer_options[layer_name];

		for (var j = 0; j < valid_options.length; j++) {
			var valid_option = valid_options[j];
			var py_name = python_names_to_js_names[valid_option];

			if(Object.keys(layer_options_defaults).includes(py_name) && !(layer_options_defaults[py_name] === null)) {
				if(!["size", "strides"].includes(py_name)) {
					// For some strange reason these 2 do not work... TODO
					test_equal("is_valid_parameter('" + py_name + "', " + layer_options_defaults[py_name] + ", 1)", is_valid_parameter(py_name, layer_options_defaults[py_name], 1), true);
				}
			} else {
				//log(py_name + " not in layer_options_defaults");
			}
		}
	}

	test_equal('heuristic_layer_possibility_check(0, "flatten")', heuristic_layer_possibility_check(0, "flatten"), false);
	test_equal('heuristic_layer_possibility_check(0, "dense")', heuristic_layer_possibility_check(0, "dense"), true);

	var fit_data = get_fit_data();

	test_equal("keys get_fit_data()", JSON.stringify(Object.keys(fit_data)), "[\"validationSplit\",\"batchSize\",\"epochs\",\"shuffle\",\"verbose\",\"callbacks\"]");

	["batchSize", "epochs", "validationSplit"].forEach(function (item) {
		test_equal("typeof(get_fit_data()['" + item + "']) == number", typeof(fit_data[item]), "number");
	});

	var callbacks_list = fit_data["callbacks"];

	Object.keys(callbacks_list).forEach(function (item) {
		test_equal("typeof(get_fit_data()['" + callbacks_list[item] + "']) == 'function')", typeof(callbacks_list[item]), "function");
	});

	tf.engine().endScope();


	/* Test Training */

	$("#dataset_category").val("image").trigger("change");
	await delay(2000);
	$("#dataset").val("signs").trigger("change");
	await delay(2000);

	await set_epochs(1);

	await train_neural_network();	

	var pd = $(".predict_demo_result");
	var results = [];
	for (var i = 0; i < pd.length; i++) {
		var this_demo = $(pd[i]);
		var h = this_demo.html();
		var s = h.split("\n");
		var r = [];

		for (var j = 0; j < s.length; j++) {
			var line = s[j];
			if(line && line != "" && line !== null) {
				var m = line.match(/.*: ([+-]{0,1}\d+(?:\.\d+)?).*?/);
				if(m) {
					var v = parseFloat(m[1]);
					r.push(v);
				}
			}
		}

		results.push(r);
	}

	for (var i = 0; i < results.length; i++) {
		var this_result = results[i];

		var sum = this_result.reduce((a, b) => a + b, 0);
		test_equal("Sum of all results for one specific image is near 1", Math.abs(sum - 1) < 0.05, true);

		var avg = (sum / this_result.length) || 0;

		var this_result_ordered = this_result.sort(function (a, b) { return a - b; });
		var highest = this_result_ordered.pop();

		if(highest > this_result_ordered.reduce((a, b) => a + b, 0)) {
			test_equal("There is a clear winner", true, true);
		} else {
			test_equal("There is NOT a clear winner", false, true);
		}
	}

	test_summary();
}
