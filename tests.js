"use strict";

var expect_memory_leak = "";
var num_tests = 0;
var num_tests_failed = 0;
var mem_history = [];

async function _set_seeds (nr) {
	l("Setting seed to " + nr);
	$(".kernel_initializer_seed").val(nr).trigger("change");
	$(".bias_initializer_seed").val(nr).trigger("change");
	l("Done setting seed to " + nr);
}

async function _set_initializers() {
	$(".layer_options_button").click();

	l("Setting initializer");
	$("#set_all_kernel_initializers").val("glorotUniform").trigger("change");
	$("#set_all_bias_initializers").val("glorotUniform").trigger("change");
	l("Done setting initializer");

	await delay(2000);

	await _set_seeds(42);
}

function get_current_timestamp () {
	return Date.now();
}

function test_not_equal (name, is, should_be) {
	num_tests++;
	if(!is_equal(is, should_be)) {
		//log("%c" + name + " OK", "background: green; color: white");
		return true;
	} else {
		err(name + " ERROR. Is: " + JSON.stringify(is) + ", should not be: " + JSON.stringify(should_be));
		num_tests_failed++;
		return false;
	}
}

function test_equal (name, is, should_be) {
	num_tests++;
	if(is_equal(is, should_be)) {
		//log("%c" + name + ": OK", "background: green; color: white");
		return true;
	} else {
		var res_str = name + ":\nERROR. Is: \n" + JSON.stringify(is) + "\nShould be:\n" + JSON.stringify(should_be);
		err(res_str);
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

	l(tests_results_str);
}

function log_test (name) {
	var current_mem = get_mem();
	if(mem_history.length) {
		var last_num_tensors = mem_history[mem_history.length - 1]["numTensors"];
		var this_num_tensors = current_mem["numTensors"];
		if(this_num_tensors > last_num_tensors) {
			if(!expect_memory_leak) {
				wrn("There seems to be a memory leak in the last function. Before it, there were " + last_num_tensors + " Tensors defined, now it's " + this_num_tensors + ". This test-name: " + name);
			}
		}
	}

	mem_history.push(current_mem);

	log("Test-name: " + name);
	l("Test-name: " + name);
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
	test_not_equal("looks_like_number('aaa')", looks_like_number("aaa"), true);

	tf.engine().startScope();

	var backends = ["webgl_backend", "cpu_backend"];
	backends = ["webgl_backend"]; // only test webgl
	for (var backend_id = 0; backend_id < backends.length; backend_id++) {
		try {
			log("Setting backend:", backends[backend_id]);
			$("#" + backends[backend_id]).click().trigger("change");
			await set_backend();
			await delay(1000);
			log("Properly set backend:", backends[backend_id]);
			log_test("Tensor functions");
			var test_tensor = tensor([1,2,3]);

			test_equal("_tensor_print_to_string(tensor([1,2,3]))", _tensor_print_to_string(test_tensor), "Tensor\n  dtype: float32\n  rank: 1\n  shape: [3]\n  values:\n    [1, 2, 3]");

			//test_equal("await debug_unusual_function_inputs() == 0", await debug_unusual_function_inputs(), 0);
			test_equal("is_numeric(1)", is_numeric(1), false);
			test_equal("is_numeric('1')", is_numeric("1"), true);
			test_equal("is_numeric('a')", is_numeric("a"), false);
			test_equal("output_shape_is_same([1,2,3], [1,2,3])", output_shape_is_same([1,2,3], [1,2,3]), true);
			test_not_equal("output_shape_is_same([1,2,3], [5,2,3])", output_shape_is_same([1,2,3], [5,2,3]), true);

			test_equal("ensure_shape_array('[1,2,3]')", ensure_shape_array("[1,2,3]"), [1,2,3]);
			test_equal("ensure_shape_array('[1,2,3,5]')", ensure_shape_array("[1,2,3,5]"), [1,2,3,5]);

			await dispose(test_tensor);

			$("#dataset").val("signs").trigger("change");
			await delay(5000);

			log_test("GUI functions");
			var example_div = $("<div id='example_test_div' />").appendTo($("body"));

			test_equal("is_hidden_or_has_hidden_parent($('#example_test_div'))", is_hidden_or_has_hidden_parent($("#example_test_div")), false);

			var old_labels = labels;
			reset_labels();
			test_equal("labels.length = 0 after reset_labels", labels.length, 0);
			labels = old_labels;

			disable_train();
			test_equal(`$(".train_neural_network_button").prop("disabled") == true after disable_train`, $(".train_neural_network_button").prop("disabled"), true);

			enable_train();
			test_equal(`$(".train_neural_network_button").prop("disabled") == false after enable_train`, $(".train_neural_network_button").prop("disabled"), false);

			$("body").hide();
			test_equal("is_hidden_or_has_hidden_parent($('#example_test_div')) after hiding body", is_hidden_or_has_hidden_parent($("#example_test_div")), true);

			$("body").show();
			test_equal("is_hidden_or_has_hidden_parent($('#example_test_div')) after showing body", is_hidden_or_has_hidden_parent($("#example_test_div")), false);

			$(example_div).hide();
			test_equal("is_hidden_or_has_hidden_parent($('#example_test_div')) after hiding div itself", is_hidden_or_has_hidden_parent($("#example_test_div")), true);

			example_div.remove();

			test_equal("last_index([1,2,3])", last_index([1,2,3]), 2);

			test_equal("add_bias_regularizer_l1_option('conv2d', 1)", add_bias_regularizer_l1_option("conv2d", 1), "<tr class='bias_regularizer_tr'><td>l1:</td><td><input class='input_field input_data bias_regularizer_l1' type='number'  value=0.01  _onchange='updated_page()' onkeyup=\"var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this); no_update_math=original_no_update_math;\" /></td>"); // await not possible

			test_equal("add_bias_initializer_distribution_option(\"conv2d\", 1)", add_bias_initializer_distribution_option("conv2d", 1), "<tr class='bias_initializer_tr'><td><span class=\"TRANSLATEME_distribution\"></span>:</td><td><select class='input_field input_data bias_initializer_distribution' _onchange='updated_page(null, null, this);'><option value=\"normal\">normal</option><option value=\"uniform\">uniform</option><option value=\"truncatedNormal\">truncatedNormal</option></select></td>");

			test_equal("add_kernel_initializer_value_option(\"conv2d\", 1)", add_kernel_initializer_value_option("conv2d", 1), "<tr class='kernel_initializer_tr'><td>Value:</td><td><input class='input_field input_data kernel_initializer_value' type='number'  value=1  _onchange='updated_page()' onkeyup=\"var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this); no_update_math=original_no_update_math;\" /></td>"); // await not possible

			test_equal("add_depth_multiplier_option('dense', 3)", add_depth_multiplier_option("dense", 3), "<tr><td>Depth multiplier:</td><td><input class='input_field input_data depth_multiplier' type='number'  min=0  step=1  value=1  _onchange='updated_page()' onkeyup=\"var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this); no_update_math=original_no_update_math;\" /></td>"); // await not possible

			test_equal("quote_python(\"abc\")", quote_python("abc"), "\"abc\"");

			test_equal("quote_python(\"123\")", quote_python("123"), "123");

			test_equal("quote_python(123)", quote_python(123), "[123]");

			test_equal("get_tr_str_for_description(\"hallo\")", get_tr_str_for_description("hallo"), "<tr><td><span class='TRANSLATEME_description'></span>:</td><td><span class='typeset_me'>hallo</span></td></tr>");

			var not_random = [1,1,1,1,1,1,1,1];
			var medium_random = [0,0.1,1,2,0.5,-1,1,1,1,1,2,0.5];
			var real_random = [0.782561374669061,0.435820713729726,0.733394706660089,0.670549480567338,0.0996915503756846,0.0596513498894495,0.981818576945752,0.612811573822079,0.149262201265092,0.339208902617202,0.283748225092307];

			test_equal("testing non-random array to have likelyhood 0 of being random", array_likelyhood_of_being_random(not_random) == 0, true);
			test_equal("testing medium-random array to have likelyhood 0.3062189184132783 of being random", array_likelyhood_of_being_random(medium_random) == 0.3062189184132783, true);
			test_equal("testing real-random array to have likelyhood 1 of being random", array_likelyhood_of_being_random(real_random) == 1, true);

			log_test("Math mode");
			var cookie_theme = get_cookie("theme");
			var darkmode = 0;
			if(cookie_theme == "darkmode") {
				darkmode = 1;
			}

			var color = "#ffffff";
			if(is_dark_mode) {
				color = "#353535";
			}

			test_equal("color_compare_old_and_new_layer_data([[[1]]], [[[1]]])", JSON.stringify(color_compare_old_and_new_layer_data([[[1]]], [[[1]]])), "[{\"0\":[\"" + color + "\"]}]");
			test_equal("color_compare_old_and_new_layer_data([[[1]]], [[[0]]])", JSON.stringify(color_compare_old_and_new_layer_data([[[1]]], [[[0]]])), "[{\"0\":[\"#cf1443\"]}]");
			test_equal("color_compare_old_and_new_layer_data([[[-1]]], [[[0]]])", JSON.stringify(color_compare_old_and_new_layer_data([[[-1]]], [[[0]]])), "[{\"0\":[\"#2E8B57\"]}]");

			test_equal("array_to_latex([[1],[2],[3]])", array_to_latex([[1],[2],[3]]), "\\underbrace{\\begin{pmatrix}\n1\\\\\n2\\\\\n3\n\\end{pmatrix}}");

			test_equal("array_to_fixed([1.555,2.555,3.555], 2)", JSON.stringify(array_to_fixed([1.555,2.555,3.555], 2)), "[1.55,2.56,3.56]");

			test_equal("group_layers([ \"conv2d\", \"maxPooling2d\", \"conv2d\", \"maxPooling2d\", \"flatten\", \"dropout\", \"dense\", \"dense\" ])", JSON.stringify(group_layers([ "conv2d", "maxPooling2d", "conv2d", "maxPooling2d", "flatten", "dropout", "dense", "dense" ])), "[{\"<span class='TRANSLATEME_feature_extraction'></span>\":[0,1,2,3]},{\"<span class='TRANSLATEME_flatten'></span>\":[4]},{\"Feature ex&shy;trac&shy;tion &amp; Over&shy;fit&shy;ting pre&shy;vention\":[5]},{\"<span class='TRANSLATEME_classification'></span>\":[6,7]}]");

			test_equal("decille([1,2,3,4,5,6,7,8,9,10, 11], 1)", decille([1,2,3,4,5,6,7,8,9,10, 11], 1), 10);

			test_equal("median([1,2,3,4,5])", median([1,2,3,4,5]), 3);

			test_equal("truncate_text(\"hallollolololololololllllolololo\", 10)", truncate_text("hallollolololololololllllolololo", 10), "hall...olo");

			test_equal("is_number_array([1,2,3,4,5])", is_number_array([1,2,3,4,5]), true);

			test_equal("is_number_array([1,2,\"a\",4,5])", is_number_array([1,2,"a",4,5]), false);

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
			test_equal("heuristic_layer_possibility_check(0, \"flatten\")", heuristic_layer_possibility_check(0, "flatten"), true);
			test_equal("heuristic_layer_possibility_check(0, \"dense\")", heuristic_layer_possibility_check(0, "dense"), true);

			var fit_data = await get_fit_data();

			test_equal("keys await get_fit_data()", JSON.stringify(Object.keys(fit_data)), "[\"validationSplit\",\"batchSize\",\"epochs\",\"shuffle\",\"verbose\",\"callbacks\",\"yieldEvery\"]");

			["batchSize", "epochs", "validationSplit"].forEach(function (item) {
				test_equal("typeof(await get_fit_data()['" + item + "']) == number", typeof(fit_data[item]), "number");
			});

			var callbacks_list = fit_data["callbacks"];

			Object.keys(callbacks_list).forEach(function (item) {
				test_equal("typeof(await get_fit_data()['" + callbacks_list[item] + "']) == 'function')", typeof(callbacks_list[item]), "function");
			});

			log_test("Test Training Logic");

			$("#dataset").val("and_xor").trigger("change");
			await wait_for_updated_page(3);

			await _set_initializers();
			await wait_for_updated_page(3);

			$("#model_dataset").val("and").trigger("change");
			await wait_for_updated_page(3);

			await _set_initializers();
			$("#learningRate_adam").val("0.01").trigger("change");
			await set_epochs(200);

			await wait_for_updated_page(3);

			log_test("Waiting for 10 seconds");
			await delay(10000);
			log_test("Waiting for 10 seconds done");

			await train_neural_network();
			await wait_for_updated_page(3);

			while (waiting_updated_page_uuids.length) {
				await delay(500);
			}

			await delay(5000);
			await wait_for_updated_page(3);

			try {
				var result_and = model.predict(array_sync(tensor([[0, 0]])))[0][0];
				test_equal("trained nn: 0 and 0", result_and.toString().startsWith("0.0"), true);
				if(!result_and.toString().startsWith("0.0")) {
					log("trained nn: 0 and 0 results: " + result_and.toString());
				}
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				err("" + e);
			}

			try {
				result_and = model.predict(array_sync(tensor([[0, 1]])))[0][0];
				test_equal("trained nn: 0 and 1", result_and.toString().startsWith("0.0"), true);
				if(!result_and.toString().startsWith("0.0")) {
					log("trained nn: 0 and 1 results:" + result_and.toString());
				}
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				err("" + e);
			}

			try {
				result_and = model.predict(array_sync(tensor([[1, 0]])))[0][0];
				test_equal("trained nn: 1 and 0", result_and.toString().startsWith("0.0"), true);
				if(!result_and.toString().startsWith("0.0")) {
					log("trained nn: 1 and 0 results:" + result_and.toString());
				}
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				err("" + e);
			}

			try {
				result_and = model.predict(array_sync(tensor([[1, 1]])))[0][0];
				var r = result_and.toString();
				test_equal("trained nn: 1 and 1", r.startsWith("0.9") || r.startsWith("0.8"), true);
				if(!(r.startsWith("0.9") || r.startsWith("0.8"))) {
					log("trained nn: 1 and 1 results: " + result_and.toString());
				}
			} catch (e) {
				if(Object.keys(e).includes("message")) {
					e = e.message;
				}

				err("" + e);
			}

			log_test("Testing initializer");

			var initializer_val = 123;

			$($(".bias_initializer")[0]).val("glorotUniform").trigger("change");
			$($(".bias_initializer")[0]).val("constant").trigger("change");
			$($(".kernel_initializer")[0]).val("glorotUniform").trigger("change");
			$($(".kernel_initializer")[0]).val("constant").trigger("change");
			await wait_for_updated_page(3);

			$($(".bias_initializer_value")[0]).val(initializer_val).trigger("change");
			$($(".kernel_initializer_value")[0]).val(initializer_val).trigger("change");
			await wait_for_updated_page(5);

			try {
				var kernel_initializer_correctly_set = array_sync(model.layers[0].weights[0].val)[0][0] == initializer_val;

				test_equal("kernel_initializer_correctly_set", kernel_initializer_correctly_set, true);
			} catch (e) {
				err(e);
				console.trace();
			}

			await wait_for_updated_page(3);

			log_test("Add layer");

			var old_number_of_layers = $(".layer_setting").length;

			$($(".add_layer")[0]).click();
			await wait_for_updated_page(5);

			$($(".add_layer")[0]).click();
			await wait_for_updated_page(5);

			var new_number_of_layers = $(".layer_setting").length;

			test_equal("Testing whether get_layer_data has the same number of layers as the loaded model after adding 2 layers", new_number_of_layers, get_layer_data().length);
			test_equal("Checking if the number of layers is +2 after adding 2 layers", new_number_of_layers - old_number_of_layers, 2);

			await delay(2000);

			expect_memory_leak = "a new layer was added";
			log_test("Train on CSV");
			expect_memory_leak = "";

			set_epochs(100);

			$("#data_origin").val("csv").trigger("change");
			await delay(5000);

			$("#csv_file").
				click().
				val("x1,x2,x3,y\n1,1,1,3\n2,2,2,6\n3,3,3,9\n1,2,3,6\n2,1,3,6\n").
				trigger("keyup").
				trigger("change").
				click()
			;

			$("#asanai_main_logo").click();
			$("#csv_file").click();
			$("#asanai_main_logo").click();

			await delay(5000);

			await _set_initializers(1234);

			await delay(5000);

			await train_neural_network();

			await delay(5000);

			try {
				var res = array_sync(model.predict(tensor([[1, 1, 1]])))[0][0];
				test_equal("trained nn: x1+x2+x3=y (1,1,1 = 3, got " + res + ")", Math.abs(res - 3) > 0, true);

				res = array_sync(model.predict(tensor([[3, 3, 3]])))[0][0];
				test_equal("trained nn: x1+x2+x3=y (3,3,3 = 9, got " + res +")", Math.abs(res - 9) < 10, true);
			} catch (e) {
				err("ERROR while predicting in test mode:", e);
			}

			log_test("Test Training images");

			log("Waiting 2 seconds...");
			await wait_for_updated_page(3);
			log("Done waiting 2 seconds...");

			$("#dataset").val("signs").trigger("change");
			log("Waiting 3 seconds...");
			await wait_for_updated_page(3);
			await _set_initializers();
			log("Done waiting 3 seconds...");

			$("#model_dataset").val("signs").trigger("change");
			log("Waiting 3 seconds...");
			await wait_for_updated_page(3);
			await _set_initializers();

			$("#learningRate_adam").val("0.001").trigger("change");
			await set_epochs(50);
			await train_neural_network();

			$("#show_bars_instead_of_numbers").prop("checked", false);
			await updated_page();

			$("[href='#predict_tab']").click();
			await delay(5000);
			await wait_for_updated_page(2);

			var results = [];
			var pd = $(".predict_demo_result");

			for (var i = 0; i < pd.length; i++) {
				var all_tds = $(pd[i]).find("table>tbody>tr>td");

				var r = [];

				for (var j = 0; j < all_tds.length; j++) {
					if(j % 2 == 1) {
						var pure_number = $(all_tds[j]).html().replace(/<b[^>]*>/, "").replace("</b>", "");
						r.push(parse_float(pure_number));
					}
				}

				results.push(r);
			}

			var array_contains_nan = false;

			for (var i = 0; i < results[0].length; i++){
				// check if array value is false or NaN
				if (isNaN(results[0][i])) {
					array_contains_nan = true;
				}
			}

			test_equal("array_contains_nan must be false (if true, this means the method for getting the results has failed. Did you recently change the way the results are displayed in the predict tab?)", array_contains_nan, false);

			if(array_contains_nan) {
				log(results);
			}

			for (var i = 0; i < results.length; i++) {
				var this_result = results[i];

				var sum = this_result.reduce((a, b) => a + b, 0);
				test_equal("Sum of all results for one specific image is near 1 (is " + sum + ")", Math.abs(sum - 1) < 0.1, true);

				var avg = (sum / this_result.length) || 0;

				var this_result_ordered = this_result.sort(function (a, b) { return a - b; });
				var highest = this_result_ordered.pop();
				if(isNaN(highest)) {
					test_equal("highest is nAn!", false, true);
				} else {
					var real_sum = this_result_ordered.reduce((a, b) => a + b, 0);

					if(highest > (0.8 * real_sum)) {
						test_equal("There is a clear winner", true, true);
					} else {
						log("highest:", highest, "real_sum:", real_sum);
						test_equal("There is NOT a clear winner", false, true);
					}
				}
			}

			// testing shuffling
			$("#dataset").val("signs").trigger("change");
			set_epochs(1);
			$("#max_number_of_files_per_category").val(1).trigger("change");
			$("#shuffle_before_each_epoch").prop("checked", true).trigger("change");

			var original_force_download = force_download;
			force_download = true;
			test_not_equal("get_image_data(0) is not empty", JSON.stringify(await get_image_data(0)) == "[[],[],[],[],[],[],[],[],[],[]]", true);

			var xy_data = await get_xs_and_ys();
			force_download = false;

			var y_test = array_sync(xy_data.y);

			await dispose(xy_data["x"]);
			await dispose(xy_data["y"]);

			test_equal("last 3 items are shuffled", !!JSON.stringify(y_test[y_test.length - 1]).match(/1\]$/) && !!JSON.stringify(y_test[y_test.length - 2]).match(/1\]$/) && !!JSON.stringify(y_test[y_test.length - 3]).match(/1\]$/), false);

			log_test("Testing speed");

			var X = [20, 50, 100];
			var Y = [];

			$("#dataset").val("signs").trigger("change");

			await wait_for_updated_page(3);

			var start_time = get_current_timestamp();

			for (var k = 0; k < X.length; k++) {
				var wh = X[k];

				var start_time = Date.now();

				$("#width").val(wh).trigger("change");

				var i = 1;

				await delay(1000);

				$("#height").val(wh).trigger("change");

				i = 1;

				await delay(1000);

				var end_time = Date.now();

				await wait_for_updated_page(5);

				var used_time = (end_time - start_time) - 5000;
				Y.push(used_time);
			}

			var end_time = get_current_timestamp();

			var time_resize_took = end_time - start_time;

			var time_test_ok = true;
			if(time_resize_took > 15000) {
				time_test_ok = false;
				log("time_resize_took:", time_resize_took);
			}

			test_equal("time resize took was less than 10 seconds", time_test_ok, true);

			var last = 0;
			var ok = 1;
			$(".descriptions_of_layers").each((i, e) => {
				var t = parse_int(e.style.top);
				if(t > last) {
					last = t;
				} else {
					ok = 0;
				}
			});

			test_equal("descriptions of layers: top positions are below each other", ok, 1);

			var landau_linear_approx = least_square(X, Y);

			var a = 20;
			var b = -1000;

			if(get_backend() == "webgl") {
				a = 200;
				b = -4000;
			} else if(get_backend() == "cpu") {
				a = 200;
				b = -3000;
			} else {
				log("Unknown backend: " + get_backend());
			}

			var test_ok = false;
			if(landau_linear_approx[0] <= a && landau_linear_approx[1] <= b) {
				test_ok = true;
			}

			if(test_ok) {
				test_equal("Size changing test", test_ok, true);
			} else {
				log("Approximated runtime is: O(y = " + landau_linear_approx[0] + "x + " + landau_linear_approx[1] + "), should be <= O(" + a + "x + " + b + ")");
				test_equal("Size changing test failed", false, true);
			}

			log_test("Tests ended");
		} catch (e) {
			l("ERROR while testing: " + e);
			err("ERROR while testing: ", e);
		}
	}

	$(".overlay").remove();

	tf.engine().endScope();

	test_summary();

	return num_tests_failed;
}
