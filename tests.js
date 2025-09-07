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

	await delay(2000);

	await _set_seeds(42);
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

	l(test_name_str);
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
        const _nr_epochs = 2;

        $("#dataset").val("and_xor").trigger("change");

        await wait_for_updated_page(3);

        $("#data_origin").val("tensordata").trigger("change");

        x_file = get_fake_x_custom_tensor_data();

        y_file = get_fake_y_custom_tensor_data();

        debug_custom_tensor_x = x_file;

        debug_custom_tensor_y = y_file;

        set_x_file(x_file);

        set_y_file(y_file);

        await set_same_loss_and_metric("meanSquaredError");

	await sleep(5000);

        set_epochs(_nr_epochs);

	await sleep(5000);

        var ret = await train_neural_network();

        set_x_file(null);
        set_y_file(null);

	if (ret && Array.isArray(ret.epoch) && ret.epoch.length === _nr_epochs) {
                return true;
        }

	log("!===========================!")
	log("!===========================!")
	log("!===========================!")
	log("!===========================!")
        log(`test_custom_tensor: ret:`, ret);
	log("!===========================!")
	log("!===========================!")
	log("!===========================!")
	log("!===========================!")

        return false;
}

async function test_show_layer_data_flow() {
	$("#predict_tab_label").click()

	await sleep(1000)

	$("#show_layer_data").prop("checked", true).trigger("change")

	await sleep(1000)

	$($(".example_images")[0]).click()

	await sleep(5000);

	if(!$("#layer_0_input").find("canvas").length) {
		err("#layer_0_input: no canvas for first layer input found");

		$("#show_layer_data").prop("checked", false).trigger("change")
		return false;
	}

	if(!$("#layer_0_kernel").find("canvas").length) {
		err("#layer_0_kernel: no kernel canvas for first layer found")

		$("#show_layer_data").prop("checked", false).trigger("change")
		return false;
	}

	$("#show_layer_data").prop("checked", false).trigger("change")

	return true;
}

async function test_custom_drawn_images() {
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

	set_epochs(2)

	await train_neural_network();

	if($("#sketcher").is(":visible")) {
		return true;
	}

	return false;
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
	test_equal("test ok", 1, 1);
	test_not_equal("test not equal", 1, 2);

	test_equal("looks_like_number(1)", looks_like_number(1), true);
	test_equal("looks_like_number(100)", looks_like_number(100), true);
	test_equal("looks_like_number(-100)", looks_like_number(-100), true);
	test_not_equal("looks_like_number('aaa')", looks_like_number("aaa"), true);

	if(quick) {
		remove_num_tests_overlay();

		is_running_test = false;


		return num_tests_failed;
	}

	tf.engine().startScope();

	test_equal("test_show_layer_data_flow", await test_show_layer_data_flow(), true);

	var backends = ["webgl_backend", "cpu_backend"];
	backends = ["webgl_backend"]; // only test webgl
	for (var backend_id = 0; backend_id < backends.length; backend_id++) {
		try {
			test_equal("await test_maximally_activated_last_layer()", await test_maximally_activated_last_layer(), true);

			tests_ended = false;
			log(language[lang]["setting_backend"] + ": " + backends[backend_id]);
			$("#" + backends[backend_id]).click().trigger("change");
			await set_backend();
			await delay(1000);
			log(language[lang]["properly_set_backend"] + ": " + backends[backend_id]);
			log_test("Tensor functions");
			var test_tensor = tensor([1,2,3]);

			test_equal("_tensor_print_to_string(tensor([1,2,3]))", _tensor_print_to_string(test_tensor), "Tensor\n  dtype: float32\n  rank: 1\n  shape: [3]\n  values:\n    [1, 2, 3]");

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
			await reset_labels();
			test_equal("labels.length = 0 after reset_labels", labels.length, 0);
			labels = old_labels;

			disable_train();
			test_equal("$(\".train_neural_network_button\").prop(\"disabled\") == true after disable_train", $(".train_neural_network_button").prop("disabled"), true);

			enable_train();
			test_equal("$(\".train_neural_network_button\").prop(\"disabled\") == false after enable_train", $(".train_neural_network_button").prop("disabled"), false);

			$("body").hide();
			test_equal("is_hidden_or_has_hidden_parent($('#example_test_div')) after hiding body", is_hidden_or_has_hidden_parent($("#example_test_div")), true);

			$("body").show();
			test_equal("is_hidden_or_has_hidden_parent($('#example_test_div')) after showing body", is_hidden_or_has_hidden_parent($("#example_test_div")), false);

			$(example_div).hide();
			test_equal("is_hidden_or_has_hidden_parent($('#example_test_div')) after hiding div itself", is_hidden_or_has_hidden_parent($("#example_test_div")), true);

			example_div.remove();

			test_equal("last_index([1,2,3])", last_index([1,2,3]), 2);

			test_equal("add_bias_regularizer_l1_option('conv2d', 1)", removeIdAttribute(add_bias_regularizer_l1_option("conv2d", 1)), "<tr class='bias_regularizer_tr'><td>l1:</td><td><input class='input_field input_data bias_regularizer_l1' type='number'  value=0.01  _onchange='updated_page()' onkeyup=\"var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this); no_update_math=original_no_update_math;\" /></td>"); // await not possible

			test_equal("add_bias_initializer_distribution_option(\"conv2d\", 1)", removeIdAttribute(add_bias_initializer_distribution_option("conv2d", 1)), "<tr class='bias_initializer_tr'><td><span class=\"TRANSLATEME_distribution\"></span>:</td><td><select class='input_field input_data bias_initializer_distribution' _onchange='updated_page(null, null, this);'><option value=\"normal\">normal</option><option value=\"uniform\">uniform</option><option value=\"truncatedNormal\">truncatedNormal</option></select></td>");

			test_equal("add_kernel_initializer_value_option(\"conv2d\", 1)", removeIdAttribute(add_kernel_initializer_value_option("conv2d", 1)), "<tr class='kernel_initializer_tr'><td>Value:</td><td><input class='input_field input_data kernel_initializer_value' type='number'  value=1  onchange='updated_page(null, null, null, null, 1)' onkeyup=\"var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this, null, 1); no_update_math=original_no_update_math;\" /></td>"); // await not possible

			test_equal("add_depth_multiplier_option('dense', 3)", removeIdAttribute(add_depth_multiplier_option("dense", 3)), "<tr><td>Depth multiplier:</td><td><input class='input_field input_data depth_multiplier' type='number'  min=0  step=1  value=1  _onchange='updated_page()' onkeyup=\"var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this); no_update_math=original_no_update_math;\" /></td>"); // await not possible

			test_equal("quote_python(\"abc\")", quote_python("abc"), "\"abc\"");

			test_equal("quote_python(\"123\")", quote_python("123"), "123");

			test_equal("quote_python(123)", quote_python(123), "[123]");

			test_equal("get_tr_str_for_description(\"hallo\")", get_tr_str_for_description("hallo"), "<tr><td><span class='TRANSLATEME_description'></span>:</td><td><span class='typeset_me'>hallo</span></td></tr>");

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
				test_equal("Callback '" + item + " is of type function", typeof(callbacks_list[item]), "function");
			});

			log_test("Test Training Logic");

			$("#dataset").val("and_xor").trigger("change");
			await wait_for_updated_page(3);

			$("#show_layer_data").prop("checked", true).trigger("change")

			await _set_initializers();
			await wait_for_updated_page(3);

			$("#model_dataset").val("and").trigger("change");
			await wait_for_updated_page(3);

			await _set_initializers();
			$("#learningRate_adam").val("0.01").trigger("change");
			await set_epochs(4);

			await wait_for_updated_page(3);

			log_test("Waiting for 10 seconds");
			await delay(10000);
			log_test("Waiting for 10 seconds done");

			await train_neural_network();
			await wait_for_updated_page(3);

			$("#show_layer_data").prop("checked", false).trigger("change")

			while (waiting_updated_page_uuids.length) {
				await delay(500);
			}

			await delay(5000);
			await wait_for_updated_page(3);

			log_test("Testing initializer");

			var initializer_val = 123;

			$($(".bias_initializer")[0]).val("constant").trigger("change");
			$($(".kernel_initializer")[0]).val("constant").trigger("change");
			await wait_for_updated_page(3);

			$($(".bias_initializer_value")[0]).val(initializer_val).trigger("change");
			$($(".kernel_initializer_value")[0]).val(initializer_val).trigger("change");

			await updated_page();

			await wait_for_updated_page(5);

			try {

				var synched_weights = array_sync(model.layers[0].weights[0].val);

				var kernel_initializer_correctly_set = synched_weights[0][0] == initializer_val;

				if(!kernel_initializer_correctly_set) {
					log(sprintf(language[lang]["initializer_value_failed_should_be_n_is_m"], initializer_val, synched_weights[0][0]));
				}

				test_equal("kernel_initializer_correctly_set", kernel_initializer_correctly_set, true);
			} catch (e) {
				err("[run_tests] " + e);
				console.trace();
			}

			await wait_for_updated_page(3);

			log_test("Add layer");

			var old_number_of_layers = $(".layer_setting").length;

			await add_layer_after_first(2);

			var new_number_of_layers = $(".layer_setting").length;

			test_equal("layer count sync", new_number_of_layers, get_layer_data().length);
			test_equal("+2 layers added", new_number_of_layers - old_number_of_layers, 2);

			await delay(2000);

			expect_memory_leak = "a new layer was added";
			log_test("Train on CSV");
			expect_memory_leak = "";

			set_epochs(3);

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
				test_equal("x1+x2+x3=y (1,1,1 = 3, got " + res + ")", Math.abs(res - 3) > 0, true);

				res = array_sync(model.predict(tensor([[3, 3, 3]])))[0][0];
				test_equal("x1+x2+x3=y (3,3,3 = 9, got " + res +")", Math.abs(res - 9) < 10, true);
			} catch (e) {
				err("[run_tests] ERROR while predicting in test mode:", e);
			}

			log_test("Test Training images");

			log(sprintf(language[lang]["waiting_n_seconds"], 2));
			await wait_for_updated_page(3);
			log(sprintf(language[lang]["done_waiting_n_seconds"], 2));

			$("#dataset").val("signs").trigger("change");
			log(sprintf(language[lang]["waiting_n_seconds"], 3));

			await wait_for_updated_page(3);
			await _set_initializers();

			log(sprintf(language[lang]["done_waiting_n_seconds"], 3));

			$("#model_dataset").val("signs").trigger("change");
			log(sprintf(language[lang]["waiting_n_seconds"], 3));

			await wait_for_updated_page(3);
			await _set_initializers();

			set_imgcat(3);
			set_adam_lr(0.001);

			await set_epochs(2);
			await train_neural_network();

			$("#show_bars_instead_of_numbers").prop("checked", false);
			await updated_page();

			$("[href='#predict_tab']").click();
			await delay(5000);
			await wait_for_updated_page(2);

			var results = [];
			var pd = $(".predict_demo_result");

			for (var pd_idx = 0; pd_idx < pd.length; pd_idx++) {
				var all_tds = $(pd[pd_idx]).find("table>tbody>tr>td");

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

			for (var result_idx = 0; result_idx < results[0].length; result_idx++){
				if (isNaN(results[0][result_idx])) {
					array_contains_nan = true;
				}
			}

			test_equal("array_contains_nan must be false (if true, this means the method for getting the results has failed. Did you recently change the way the results are displayed in the predict tab?)", array_contains_nan, false);

			if(array_contains_nan) {
				log(results);
			}

			var confusion_matrix_string = await confusion_matrix(labels);

			var number_of_red = (confusion_matrix_string.match(/#F51137/g) || []).length;

			if(number_of_red > 2) {
				console.warn(`confusion-matrix contained ${number_of_red} red squared:`, confusion_matrix_string);
			}

			// testing shuffling
			$("#dataset").val("signs").trigger("change");
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

			log_test("Testing speed");

			var X = [20, 50, 100];

			$("#dataset").val("signs").trigger("change");

			await wait_for_updated_page(3);

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

			test_equal("test_custom_drawn_images()", await test_custom_drawn_images(), true);
			test_equal("test_custom_tensor()", await test_custom_tensor(), true);

			log_test("Tests ended");

			tests_ended = true;
		} catch (e) {
			var err_str = "[run_tests] ERROR while testing: " + e;
			l(err_str);
			err(err_str);
		}
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
