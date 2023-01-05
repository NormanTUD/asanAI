"use strict";

var expect_memory_leak = "";
var num_tests = 0;
var num_tests_failed = 0;
var mem_history = [];

function test_not_equal (name, is, should_be) {
	num_tests++;
	if(!is_equal(is, should_be)) {
		//console.log("%c" + name + " OK", "background: green; color: white");
		return true;
	} else {
		console.log("%c" + name + " ERROR. Is: " + JSON.stringify(is) + ", should not be: " + JSON.stringify(should_be), "background: red; color: white");
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

function log_test (name) {
	var current_mem = get_mem();
	if(mem_history.length) {
		var last_num_tensors = mem_history[mem_history.length - 1]["numTensors"];
		var this_num_tensors = current_mem["numTensors"];
		if(this_num_tensors > last_num_tensors) {
			if(!expect_memory_leak) {
				console.warn("There seems to be a memory leak in the last function. Before it, there were " + last_num_tensors + " Tensors defined, now it's " + this_num_tensors);
			}
		}
	}

	mem_history.push(current_mem);

	log("Test-name: " + name)
}

async function run_tests () {
	mem_history = [];
	log_test("Tests started");
	num_tests = num_tests_failed = 0;
	test_equal("test ok", 1, 1);
	test_not_equal("test not equal", 1, 2);

	test_equal("looks_like_number(1)", looks_like_number(1), true);
	test_equal("looks_like_number(100)", looks_like_number(100), true);
	test_equal("looks_like_number(-100)", looks_like_number(-100), true);
	test_not_equal("looks_like_number('aaa')", looks_like_number('aaa'), true);

	tf.engine().startScope();

	log_test("Tensor functions");
	var test_tensor = tf.tensor([1,2,3]);

	test_equal("tensor_print_to_string(tf.tensor([1,2,3]))", tensor_print_to_string(test_tensor), "Tensor\n  dtype: float32\n  rank: 1\n  shape: [3]\n  values:\n    [1, 2, 3]")

	test_equal("output_shape_is_same([1,2,3], [1,2,3])", output_shape_is_same([1,2,3], [1,2,3]), true);
	test_not_equal("output_shape_is_same([1,2,3], [5,2,3])", output_shape_is_same([1,2,3], [5,2,3]), true);

	test_equal("ensure_shape_array('[1,2,3]')", ensure_shape_array('[1,2,3]'), [1,2,3]);
	test_equal("ensure_shape_array('[1,2,3,5]')", ensure_shape_array('[1,2,3,5]'), [1,2,3,5]);

	dispose(test_tensor);

	log_test("GUI functions");
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

	test_equal("add_bias_regularizer_l1_option('conv2d', 1)", add_bias_regularizer_l1_option("conv2d", 1), "<tr class='bias_regularizer_tr'><td>l1:</td><td><input class='input_field input_data bias_regularizer_l1' type='number'  value=0.01  _onchange='updated_page()' onkeyup=\"var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this); no_update_math=original_no_update_math;\" /></td>");

	test_equal('add_bias_initializer_distribution_option("conv2d", 1)', add_bias_initializer_distribution_option("conv2d", 1), "<tr class='bias_initializer_tr'><td>Distribution:</td><td><select class='input_field input_data bias_initializer_distribution' _onchange='updated_page(null, null, this);'><option value=\"normal\">normal</option><option value=\"uniform\">uniform</option><option value=\"truncatedNormal\">truncatedNormal</option></select></td>");

	test_equal('add_kernel_initializer_value_option("conv2d", 1)', add_kernel_initializer_value_option("conv2d", 1), "<tr class='kernel_initializer_tr'><td>Value:</td><td><input class='input_field input_data kernel_initializer_value' type='number'  value=1  _onchange='updated_page()' onkeyup=\"var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this); no_update_math=original_no_update_math;\" /></td>");

	test_equal("add_depth_multiplier_option('dense', 3)", add_depth_multiplier_option('dense', 3), "<tr><td>Depth multiplier:</td><td><input class='input_field input_data depth_multiplier' type='number'  min=0  max=1  step=0.1  value=1  _onchange='updated_page()' onkeyup=\"var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this); no_update_math=original_no_update_math;\" /></td>");

	test_equal('quote_python("abc")', quote_python("abc"), "\"abc\"");

	test_equal('quote_python("123")', quote_python("123"), "123");

	test_equal('quote_python(123)', quote_python(123), "[123]");

	test_equal('get_tr_str_for_description("hallo")', get_tr_str_for_description("hallo"), "<tr><td>Description:</td><td><i class='typeset_me'>hallo</i></td></tr>");


	log_test("Math mode");
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

	test_equal('group_layers([ "conv2d", "maxPooling2d", "conv2d", "maxPooling2d", "flatten", "dropout", "dense", "dense" ])', JSON.stringify(group_layers([ "conv2d", "maxPooling2d", "conv2d", "maxPooling2d", "flatten", "dropout", "dense", "dense" ])), "[{\"Feature ex&shy;traction\":[0,1,2,3]},{\"Flatten\":[4]},{\"Feature ex&shy;trac&shy;tion &amp; Over&shy;fit&shy;ting pre&shy;vention\":[5]},{\"Classi&shy;fication\":[6,7]}]");

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

	log_test("Layer checks");
	test_equal('heuristic_layer_possibility_check(0, "flatten")', heuristic_layer_possibility_check(0, "flatten"), false);
	test_equal('heuristic_layer_possibility_check(0, "dense")', heuristic_layer_possibility_check(0, "dense"), true);

	var fit_data = get_fit_data();

	test_equal("keys get_fit_data()", JSON.stringify(Object.keys(fit_data)), "[\"validationSplit\",\"batchSize\",\"epochs\",\"shuffle\",\"verbose\",\"callbacks\",\"yieldEvery\"]");

	["batchSize", "epochs", "validationSplit"].forEach(function (item) {
		test_equal("typeof(get_fit_data()['" + item + "']) == number", typeof(fit_data[item]), "number");
	});

	var callbacks_list = fit_data["callbacks"];

	Object.keys(callbacks_list).forEach(function (item) {
		test_equal("typeof(get_fit_data()['" + callbacks_list[item] + "']) == 'function')", typeof(callbacks_list[item]), "function");
	});

	tf.engine().endScope();

	log_test("Test Training Logic");

	await delay(2000);
	$("#dataset").val("and_xor").trigger("change");
	await delay(2000);
	$("#model_dataset").val("and").trigger("change");
	await delay(2000);

	await set_epochs(3);

	await train_neural_network();	

	var result_and = await model.predict(tf.tensor([[0, 0]])).arraySync()[0][0];
	test_equal("trained nn: 0 and 0", result_and.toString().startsWith("0.0"), true)

	result_and = await model.predict(tf.tensor([[0, 1]])).arraySync()[0][0];
	test_equal("trained nn: 0 and 1", result_and.toString().startsWith("0.0"), true)

	result_and = await model.predict(tf.tensor([[0, 0]])).arraySync()[0][0];
	test_equal("trained nn: 0 and 0", result_and.toString().startsWith("0.0"), true)

	result_and = await model.predict(tf.tensor([[1, 1]])).arraySync()[0][0];
	test_equal("trained nn: 1 and 1", result_and.toString().startsWith("0.9"), true)
	
	log_test("Add layer");

	var old_number_of_layers = $(".layer_setting").length;
	$($(".add_layer")[0]).click();
	$($(".add_layer")[1]).click();
	var new_number_of_layers = $(".layer_setting").length;
	await delay(1000);

	test_equal("Checking if the number of layers is +2 after adding 2 layers", new_number_of_layers - old_number_of_layers, 2);

	delay(2000);

	expect_memory_leak = "a new layer was added";
	log_test("Train on CSV")
	expect_memory_leak = "";

	set_epochs(50);

	$("#data_origin").val("csv").trigger("change")
	delay(1000);

	$("#csv_file").val("x1,x2,x3,y\n1,1,1,3\n2,2,2,6\n3,3,3,9\n1,2,3,6\n2,1,3,6\n").trigger("keyup");
	delay(5000);
	await train_neural_network();	

	var res = await model.predict(tf.tensor([[1, 1, 1]])).arraySync()[0][0];
	test_equal("trained nn: x1+x2+x3=y (1,1,1 = 3, got " + res + ")", Math.abs(res - 3) < 2, true)

	res = await model.predict(tf.tensor([[3, 3, 3]])).arraySync()[0][0];
	test_equal("trained nn: x1+x2+x3=y (3,3,3 = 9, got " + res +")", Math.abs(res - 9) < 5, true)

	log_test("Test Training images");

	await delay(2000);
	$("#dataset").val("signs").trigger("change");
	await delay(2000);
	$("#model_dataset").val("signs").trigger("change");
	await delay(2000);

	await set_epochs(3);

	await train_neural_network();	

	$("[href='#predict_tab']").click()
	await delay(5000);

	var results = [];
	var pd = $(".predict_demo_result");

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
		test_equal("Sum of all results for one specific image is near 1 (is " + sum + ")", Math.abs(sum - 1) < 0.1, true);

		var avg = (sum / this_result.length) || 0;

		var this_result_ordered = this_result.sort(function (a, b) { return a - b; });
		var highest = this_result_ordered.pop();

		if(highest > (0.8 * this_result_ordered.reduce((a, b) => a + b, 0))) {
			test_equal("There is a clear winner", true, true);
		} else {
			test_equal("There is NOT a clear winner", false, true);
		}
	}


	// testing shuffling
	$("#dataset").val("mnist").trigger("change");
	$("#epochs").val(1).trigger("change");
	$("#max_number_of_files_per_category").val(1).trigger("change");
	$("#shuffle_before_each_epoch").prop("checked", true).trigger("change")

	var original_force_download = force_download;
	force_download = true;
	test_not_equal("get_image_data(0) is not empty", JSON.stringify(await get_image_data(0)) == "[[],[],[],[],[],[],[],[],[],[]]", true)

	var xy_data = await get_xs_and_ys();
	force_download = false;

	var y_test = await xy_data.y.arraySync();
	test_equal("last 3 items are shuffled", !!JSON.stringify(y_test[y_test.length - 1]).match(/1\]$/) && !!JSON.stringify(y_test[y_test.length - 2]).match(/1\]$/) && !!JSON.stringify(y_test[y_test.length - 3]).match(/1\]$/), false);

	log_test("Testing speed");

	show_swal_when_changing_size = true;
	var X = [20, 50, 100];
	var Y = [];

	$("#dataset").val("signs").trigger("change");

	while (!swal.isVisible()) {
		log("Is waiting for SWAL...");
		await delay(10);
	}

	while (swal.isVisible()) {
		log("Is still setting config...");
		await delay(10);
	}

	await delay(1000)

	for (var k = 0; k < X.length; k++) {
		var wh = X[k];

		log(wh);
		var start_time = Date.now();

		$("#width").val(wh).trigger("change");

		while (swal.isVisible()) {
			log("Is still setting width...");
			await delay(10);
		}

		await delay(1000)

		$("#height").val(wh).trigger("change");

		while (swal.isVisible()) {
			log("Is still setting height...");
			await delay(10);
		}

		await delay(1000)

		var end_time = Date.now();

		var used_time = (end_time - start_time) - 3000;
		Y.push(used_time);
	}

	show_swal_when_changing_size = false;

	var landau_linear_approx = least_square(X, Y);

	var a = 300;
	var b = -4000;

	/*
	if(get_backend() == "webgl") {
		a = 200;
		b = -4000;
	} else if(get_backend() == "cpu") {
		a = 200;
		b = -4000;
	} else {
		log("Unknown backend: " + get_backend());
	}
	*/

	var test_ok = false;
	if(landau_linear_approx[0] <= a && landau_linear_approx[1] <= b) {
		test_ok = true;
	}

	log("Approximated O(" + least_square_equation(X, Y) + ")")

	test_equal("Size changing test", test_ok, true);



	log_test("Tests ended");

	test_summary();

	return num_tests_failed;
}
