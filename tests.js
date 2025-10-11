"use strict";

var tests_ended = false;

var expect_memory_leak = "";
var num_tests = 0;
var num_tests_failed = 0;
var failed_test_names = [];
var mem_history = [];

function load_script(src) {
	return new Promise((resolve, reject) => {
		const s = document.createElement("script");
		s.src = src;
		s.onload = () => resolve();
		s.onerror = () => reject(new Error("Failed to load script: " + src));
		document.head.appendChild(s);
	});
}

async function check_python(code) {
	if (!Object.keys(window).includes("pyodide")) {
		await load_script("libs/pyodide.js");

		window.pyodide = await loadPyodide();
	}

	const safe_code = code.replace(/"""/g, '\\"\\"\\"').replaceAll(/\\/g, "\\\\");

	try {
		const execute_this_code = `
import ast
try:
    ast.parse("""${safe_code}""")
    syntax_ok = True
except SyntaxError as e:
    syntax_ok = False
    print(str(e))
`;

		await pyodide.runPythonAsync(execute_this_code);

		const syntax_ok = pyodide.globals.get("syntax_ok");
		if (!syntax_ok) {
			const msg = pyodide.globals.get("msg");
			dbg(execute_this_code);
			console.error("SyntaxError: " + msg);
			return false;
		}

		return true;
	} catch (e) {
		console.error("Unexpected error: " + e.message);
		return false;
	}
}

async function _set_seeds (nr) {
	l(language[lang]["setting_seed_to"] + " " + nr);
	$(".kernel_initializer_seed").val(nr).trigger("change");
	$(".bias_initializer_seed").val(nr).trigger("change");
	l(language[lang]["done_setting_seed_to"] + " " + nr);
}

async function add_layer_after_first(nr_layers_to_add) {
	for (var i = 0; i < nr_layers_to_add; i++) {
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

function escape_html_for_test(name) {
	return name.replace(/[&<>"']/g, c =>
		({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])
	);
}

function show_num_tests_overlay(name) {
	name = "Test-name: " + name;
	log(`-> ${name}`);

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
		console.error("[test_not_equal] " + name + " ERROR. Is: " + JSON.stringify(is) + ", should not be: " + JSON.stringify(should_be));
		num_tests_failed++;
		failed_test_names.push(name);
		throw new Error(`Test >${name}< failed`);
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
		console.error("[test_equal] " + res_str);
		num_tests_failed++;
		failed_test_names.push(name);
		throw new Error(`Test >${name}< failed`);
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

	if (start_test_time) {
		const diff = get_current_timestamp() - start_test_time;

		log(`Test suite took ${human_readable_time(diff / 1000)}`);
	}

	if(num_tests_failed) {
		l(`Failed tests: ${failed_test_names.join(", ")}`);
	}

	l(tests_results_str);
}

function log_test (name) {
	var current_mem = get_mem();
	if(mem_history.length && name != "Test if python code is valid") {
		var last_num_tensors = mem_history[mem_history.length - 1]["numTensors"];
		var this_num_tensors = current_mem["numTensors"];
		if(this_num_tensors > last_num_tensors) {
			if(!expect_memory_leak) {
				console.warn("[log_test] There seems to be a memory leak in the last function. Before it, there were " + last_num_tensors + " Tensors defined, now it's " + this_num_tensors + ". This test-name: " + name);
			}
		}
	}

	mem_history.push(current_mem);

	show_num_tests_overlay(name);

	test_no_new_errors_or_warnings();
}

async function test_maximally_activated_last_layer() {
	var num_cat = await get_number_of_categories();

	var lt = get_layer_type_array();

	var canvasses = await draw_maximally_activated_layer(lt.length - 1, lt[lt.length - 1]);

	var real_os = get_shape_from_array(canvasses).join(",");

	var expected_os = `${num_cat},1`;

	if (real_os != expected_os) {
		console.error(sprintf(language[lang]["the_real_output_shape_x_does_not_match_the_expected_output_shape_y"], real_os, expected_os));
		return false;
	}

	if (canvasses.length != num_cat) {
		console.error(sprintf(language[lang]["the_number_of_categories_n_doesnt_match_the_number_of_given_canvasses_m"], num_cat, canvasses.length));
		return false;
	}

	for (var canvas_idx = 0; canvas_idx < canvasses.length; canvas_idx++) {
		if (typeof(canvasses[canvas_idx][0]) != "object") {
			void(0);
			console.error(`canvasses[${canvas_idx}][0] is not an object, but ${typeof(canvasses[canvas_idx][0])}`);
			return false;
		}
	}

	if($("#visualization_tab_label").length == 0) {
		console.error("#visualization_tab_label not found");
		return false;
	}

	$("#visualization_tab_label").click()
	
	await sleep(1000);

	if($("#maximally_activated_label").length == 0) {
		console.error("#maximally_activated_label not found");
		return false;
	}
	$("#maximally_activated_label").click();

	await sleep(1000);

	if(!$("#maximally_activated_content").find("canvas").length) {
		console.error(`#maximally_activated_content: could not find any canvasses in it`);
		return false;
	}

	const previously_max_activated_predictions = $(".maximally_activated_predictions").length;

	$($("#maximally_activated_content").find("canvas"))[0].click();

	await delay(2000);

	const now_max_activated_predictions = $(".maximally_activated_predictions").length;

	if(Math.abs(now_max_activated_predictions - previously_max_activated_predictions) != 1) {
		err(`test_maximally_activated_last_layer: Previously, ${previously_max_activated_predictions} max activated canvasses were predicted. Now, it should be, ${previously_max_activated_predictions + 1}, but is ${now_max_activated_predictions}`);
		return false;
	}

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
	return $("[id^='save_button_']:visible");
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

async function test_if_and_xor_examples_are_shown_after_switching_from_signs() {
	log_test("Testing if and/xor examples are shown after switching from signs");
	await set_dataset_and_wait("signs");

	await delay(3000);

	$("#predict_tab_label").click()

	await delay(3000);

	await set_dataset_and_wait("and_xor");

	await delay(3000);

	$("#predict_tab_label").click()

	await delay(3000);

	if($(".full_example_image_prediction").is(":visible")) {
		err("Error: .full_example_image_prediction are shown after switching to xor");
		return false;
	}

	return true;
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
	await set_dataset_and_wait("signs");

	$("#predict_tab_label").click()

	await sleep(1000)

	enable_or_disable_show_layer_data(true);

	await sleep(1000)

	$($(".example_images")[0]).click()

	await sleep(5000);

	if(!$("#layer_0_input").find("canvas").length) {
		console.error("#layer_0_input: no canvas for first layer input found");

		enable_or_disable_show_layer_data(false);
		return false;
	}

	if(!$("#layer_0_kernel").find("canvas").length) {
		console.error("#layer_0_kernel: no kernel canvas for first layer found")

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

	await wait_for_two_save_buttons_and_click_them();

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

async function wait_for_two_save_buttons_and_click_them() {
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

	await sleep(1000)
}

function is_valid_ret_object (ret, wanted_epochs) {
	if(ret === null) {
		console.error(`is_valid_ret_object: ret object was null. This happens when the training has failed.`);
		return false;
	}

	if(ret === false) {
		console.error(`is_valid_ret_object: ret object was false`);
		return false;
	}

	var ok = 1;

	[ "validationData", "params", "epoch", "history" ].forEach(retName => {
		if(!(retName in ret)) {
			console.error(`is_valid_ret_object: Missing '${retName}' in ret!`);
			ok = 0;
		}
	});


	if(!ok) {
		return false;
	}

	if(!"epochs" in ret) {
		console.error(`is_valid_ret_object: ret does not contain 'epochs':`, ret);
		return false;
	}

	const nr_epochs_in_ret = ret["epoch"].length;

	if(nr_epochs_in_ret != wanted_epochs) {
		console.error(`is_valid_ret_object: number of epochs in ret is wrong, should be ${wanted_epochs}, is ${nr_epochs_in_ret}`);
		return false;
	}

	return true;
}

function test_math_box () {
	const wanted_text = "hello";

	create_centered_window_with_text(wanted_text)

	if(!$(".math_copier").length) {
		console.error(".math_copier could not be found");
		return false;
	}

	const $textarea = $(".math_copier").find("textarea");

	if(!$textarea.length) {
		console.error(".math_copier does not contain textarea")
		return false;
	}

	const text = $textarea.val();

	if(text != wanted_text) {
		console.error(`.math_copier does not contain wanted text: '${wanted_text}', but contains '${text}'`);
		return false;
	}

	const $x_button = $($(".math_copier").children()[0]);

	if($x_button.text() != "x") {
		console.error(`.math_copier: first child does not contain 'x' button`);
		return false;
	}

	$x_button.click();

	return true;
}

function test_transform_array_whd_dwh() {
	log("Test transform_array_whd_dwh");
	test_equal("transform_array_whd_dwh simple 1x1x1", transform_array_whd_dwh([[[42]]]), [[[42]]]);
	test_equal("transform_array_whd_dwh 2x1x1", transform_array_whd_dwh([[[1]], [[2]]]), [[[1],[2]]]);
	test_equal("transform_array_whd_dwh 1x2x1", transform_array_whd_dwh([[[1, 2]]]), [[[1]], [[2]]]);
	test_equal("transform_array_whd_dwh 2x2x1", transform_array_whd_dwh([[[1], [2]], [[3], [4]]]), [[[1,2],[3,4]]]);
	test_equal("transform_array_whd_dwh 2x2x2", transform_array_whd_dwh([[[11, 12], [13, 14]], [[21, 22], [23, 24]]]), [[[11,13], [21,23]], [[12,14], [22,24]]]);
}

function test_get_shape_from_array() {
	log("Test get_shape_from_array");
	test_equal("get_shape_from_array []", get_shape_from_array([]), [0]);
	test_equal("get_shape_from_array [1]", get_shape_from_array([1]), [1]);
	test_equal("get_shape_from_array [1,2]", get_shape_from_array([1,2]), [2]);
	test_equal("get_shape_from_array [[1,2]]", get_shape_from_array([[1,2]]), [1,2]);
	test_equal("get_shape_from_array [[[1,2],[1,3]]]", get_shape_from_array([[[1,2],[1,3]]]), [1,2,2]);
	test_equal("get_shape_from_array [[[11,12],[13,14]],[[21,22],[23,24]]]", get_shape_from_array([[[11,12],[13,14]],[[21,22],[23,24]]]), [2,2,2]);
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

	test_transform_array_whd_dwh();

	test_get_shape_from_array();

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

	test_equal("add_bias_initializer_distribution_option(\"conv2d\", 1)", removeIdAttribute(add_bias_initializer_distribution_option("conv2d", 1)), `<tr class='bias_initializer_tr'><td><span class="TRANSLATEME_distribution"></span>:</td><td><select class='input_field input_data  bias_initializer_distribution' data-createdfrom="create_select_for_layer_panel_str" _onchange='updated_page(null, null, this);'><option value="normal">normal</option><option value="uniform">uniform</option><option value="truncatedNormal">truncatedNormal</option></select></td>` );

	test_equal("add_kernel_initializer_value_option(\"conv2d\", 1)", removeIdAttribute(add_kernel_initializer_value_option("conv2d", 1)), `<tr class='kernel_initializer_tr'><td>Value:</td><td><input class='input_field input_data kernel_initializer_value' type='number' value='1'  onchange='updated_page(null, null, null, null, 1)' onkeyup="var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this, null, 1); no_update_math=original_no_update_math;" /></td>` ); // await not possible

	test_equal("add_depth_multiplier_option('dense', 3)", removeIdAttribute(add_depth_multiplier_option("dense", 3)), `<tr><td>Depth multiplier:</td><td><input class='input_field input_data depth_multiplier' type='number' min='0' step='1' value='1'  _onchange='updated_page()' onkeyup="var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this); no_update_math=original_no_update_math;" /></td>`); // await not possible

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

	test_equal('computeCRC32("")', computeCRC32(""), 0);
	test_equal('computeCRC32("asasd")', computeCRC32("asasd"), 3324180253);
	test_equal("uint32le(1)", JSON.stringify(uint32le(1)), '[1,0,0,0]');
	test_equal("JSON.stringify(uint16le(1))", JSON.stringify(uint16le(1)), '[1,0]')
	test_equal("Array.isArray(get_fcnn_data())", Array.isArray(get_fcnn_data()), true);

	test_equal('fill_get_data_between(0, 10, 2, "x")', fill_get_data_between(0, 10, 2, "x"), 'x,y\n0,0\n2,2\n4,4\n6,6\n8,8\n10,10\n')
	test_equal('fill_get_data_between(0, 10, 2, "x + 4")', fill_get_data_between(0, 10, 2, "x + 4"), 'x,y\n0,4\n2,6\n4,8\n6,10\n8,12\n10,14\n');

	test_equal('normalizeArray([1,2,3])', JSON.stringify(normalizeArray([1,2,3])), '[0,127.5,255]');

	test_equal("test_math_box()", test_math_box(), true);

	test_equal("can_reload_js('xxx')", can_reload_js('xxx'), true);
	test_equal("can_reload_js('tf')", can_reload_js('tf'), false);

	test_equal("Test Upload Popup", await test_if_click_on_upload_button_opens_upload_menu(), true);

	test_equal("Test generateOnesString for asdf", generateOnesString("asdf"), "");
	test_equal("Test generateOnesString for conv1d", generateOnesString("conv1d"), "1");
	test_equal("Test generateOnesString for conv2d", generateOnesString("conv2d"), "1,1");
	test_equal("Test generateOnesString for conv3d", generateOnesString("conv3d"), "1,1,1");
	test_equal("Test generateOnesString for maxPooling2D", generateOnesString("maxPooling2D"), "1,1");

	//test_equal("test_math_mode_color_generator()", test_math_mode_color_generator(), true);

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

async function test_image_map_dense () {
	log_test("Test Image Map Dense");

	const wanted_epochs = 2;

	await set_dataset_and_wait("and_xor");

	enable_or_disable_show_layer_data(true);

	await set_model_dataset("and");

	await delay(5000)

	await _set_initializers();

	$("#learningRate_adam").val("0.01").trigger("change");

	await set_epochs(wanted_epochs);

	await set_data_origin_and_wait("image");

	await wait_for_two_save_buttons_and_click_them();

	const ret = await train_neural_network();

	if(!is_valid_ret_object(ret, wanted_epochs)) {
		return false;
	}

	enable_or_disable_show_layer_data(false);

	return true;
}

async function test_model_xor () {
	log_test("Test Training Logic");

	const wanted_epochs = 4;

	await set_dataset_and_wait("and_xor");

	enable_or_disable_show_layer_data(true);

	await set_model_dataset("and");

	await delay(5000)

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
		console.error("[run_tests] " + e);
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

function set_expert_and_auto_augment_and_activate_all_augmentations () {
	set_mode_to_expert();

	set_auto_augment();

	["augment_rotate_images", "augment_invert_images", "augment_flip_left_right"].forEach(augment_val => {
		$("#" + augment_val).prop("checked", true);
	});

	$("#home_ribbon").click();
}

function set_auto_augment() {
	$("#auto_augment").prop("checked", false).trigger("change").click();

	$("#tf_ribbon_augmentation").click();
}

function set_mode_to_expert() {
	$("#expert").click();
}

async function test_augmented_training_images () {
	const wanted_epochs = 2;

	log_test("Test Augmented Training images");

	await set_dataset_and_wait("signs");

	await set_model_dataset("signs");

	await _set_initializers();

	set_imgcat(1);
	set_adam_lr(0.001);

	await set_epochs(wanted_epochs);

	set_expert_and_auto_augment_and_activate_all_augmentations();

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

	$("#training_tab_label").click();

	if(!$("#canvas_grid_visualization").is(":visible")) {
		err(`test_training_images: #canvas_grid_visualization was not visible`);
		return false;
	}

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

async function set_width_and_height_and_wait (size_to_test) {
	await set_width(size_to_test);
	await set_height(size_to_test);

	await wait_for_updated_page(1);
}

async function test_resize_time () {
	const max_resize_seconds = 30;

	log_test("Testing speed");

	await set_dataset_and_wait("signs");

	var start_time = get_current_timestamp();

	for (let size_to_test of [100, 50, 20]) {
		await set_width_and_height_and_wait(size_to_test);
	}

	var time_resize_took = get_current_timestamp() - start_time;

	var time_test_ok = true;

	if(time_resize_took > (max_resize_seconds * 1000)) {
		time_test_ok = false;
		void(0); log("time_resize_took:", time_resize_took);
	}

	test_equal(`time resize took was less than ${max_resize_seconds} seconds`, time_test_ok, true);
}

async function test_custom_csv_x_squared() {
	const wanted_epochs = 3;

	set_mode_to_expert();

	log_test("Train on CSV X Squared");

	await set_dataset_and_wait("and_xor");

	expect_memory_leak = "";

	set_epochs(wanted_epochs);

	await set_data_origin_and_wait("csv");

	$("#csv_custom_fn").val("x**2");

	load_csv_custom_function();

	await _set_initializers();
	await wait_for_updated_page(3);

	await delay(1000);

	const ret = await train_neural_network();

	if(!is_valid_ret_object(ret, wanted_epochs)) {
		return false;
	}

	try {
		const predicted_data = await get_model_predict(tensor([[0]]));
		var res = array_sync(predicted_data)[0][0];
		test_equal("x**2=y (0 = 0, got " + res + ")", res >= -5 && res <= 5, true);
	} catch (e) {
		console.error("[run_tests] ERROR while predicting in test mode:", e);
		return false;
	}

	await delay(1000);

	if(!$("#predictcontainer").is(":visible")) {
		err("#predictcontainer is not visible after training a CSV file");
		return false;
	}

	if(!$("#predict_own_data").is(":visible")) {
		err("#predict_own_datais not visible after training a CSV file");
		return false;
	}

	return true;
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
		console.error("[run_tests] ERROR while predicting in test mode:", e);
	}

	await delay(1000);

	if(!$("#predictcontainer").is(":visible")) {
		err("#predictcontainer is not visible after training a CSV file");
		return false;
	}

	if(!$("#predict_own_data").is(":visible")) {
		err("#predict_own_datais not visible after training a CSV file");
		return false;
	}

	return true;
}

async function set_predict_own_data_and_predict (input) {
	if(!$("#predict_own_data").is(":visible")) {
		console.error(`#predict_own_data is not visible`);
		return false;
	}

	$("#predict_own_data").val(input).trigger("keyup");

	if(!$("#predict_own_data").is(":visible")) {
		console.error(`#predict_own_datais not visible`);
		return false;
	}

	await delay(1000);

	return true;
}

async function test_check_categorical_predictions () {
	log_test("Test predictions for CSV Results");

	if(!$("#show_bars_instead_of_numbers").is(":checked")) {
		$("#show_bars_instead_of_numbers").click();
	}

	await set_dataset_and_wait("signs");
	$("#predict_tab_label").click();
	await delay(1000);

	if(!$(".predict_table").length) {
		console.error(`test_check_categorical_predictions: no predict tables found`);
		return false;
	}

	const $trs_first_predict_table = $($(".predict_table")[0]).children().children();
	const nr_of_labels_first_predict_table = $trs_first_predict_table.length;

	if(nr_of_labels_first_predict_table != labels.length) {
		console.error(`test_check_categorical_predictions: expected ${labels.length} children of the first predict table, but got ${nr_of_labels_first_predict_table}`);
		return false;
	}

	var bar_and_label_ok = 1;

	$trs_first_predict_table.each((i, this_tr) => {
		if($(this_tr).find(".label_element").length != 1) {
			console.error(`test_check_categorical_predictions: .label_element not found`);
			bar_and_label_ok = 0
		}


		if($(this_tr).find(".bar").length != 1) {
			console.error(`test_check_categorical_predictions: .bar not found`);
			bar_and_label_ok = 0
		}
	})

	if(!bar_and_label_ok) {
		console.error(`test_check_categorical_predictions: either .label_element or .bar was missing!`);
		return false;
	}

	$("#show_bars_instead_of_numbers").click();

	await updated_page()

	await delay(10000);

	var all_predictions_are_floats_ok = 1;
	$(".predict_table td").not(".label_element").each((i, e) => {
		const got_text = ($(e).text());
		if(!looks_like_number(got_text)) {
			console.error(`test_check_categorical_predictions: got text '${got_text}', which didn't look like a number`);
			all_predictions_are_floats_ok = 0;
		}
	});

	if(!all_predictions_are_floats_ok) {
		console.error(`test_check_categorical_predictions: At least one result in the generated prediction tables was seemingly not a float`);
		return false;
	}

	return true;
}

function get_enabled_layer_types($layer_type, possible_layer_types) {
	return $layer_type.find("option:not(:disabled)").map(function() {
		let v = $(this).val();
		return possible_layer_types.includes(v) ? v : null;
	}).get();
}

async function test_different_layer_types() {
	enable_debug_layer = false;
	const datasets_to_check = ["and_xor", "signs"];

	$("#beginner").click()

	await delay(1000);

	for (var d = 0; d < datasets_to_check.length; d++) {
		const ds = datasets_to_check[d];

		log_test(`Test different layer types (${ds})`);

		await set_dataset_and_wait(ds);

		if($("#height").is(":visible")) {
			await set_width_and_height_and_wait(10);
		}

		const layer_types = $(".layer_type");

		for (var k = 0; k < layer_types.length; k++) {
			if ($(layer_types[k]).val() == "flatten") {
				dbg("Skipping changing flatten layer...");
				continue;
			}

			if (k == layer_types.length - 1) {
				dbg("Skipping last layer...");
				continue;
			}

			const $layer_type = $(layer_types[k]);

			if($layer_type.length == 0) {
				console.error(`test_different_layer_types: .layer_type not found`);
				enable_debug_layer = true;
				return false;
			}

			special_disable_invalid_layers_event_uuid = uuidv4();

			$layer_type.trigger("focus")

			while (last_disable_invalid_layers_event_uuid != special_disable_invalid_layers_event_uuid) {
				log("Waiting for finishing disabling invalid layers...");
				await delay(200);
			}

			special_disable_invalid_layers_event_uuid = null;

			const possible_layer_types = Object.keys(layer_options);

			if(!possible_layer_types.length) {
				console.error(`test_different_layer_types: possible_layer_types is empty!`);
				enable_debug_layer = true;
				return false;
			}

			const enabled_layer_types = get_enabled_layer_types($layer_type, possible_layer_types);

			for (var i = 0; i < enabled_layer_types.length; i++) {
				const this_layer_type = enabled_layer_types[i];
				if(!["flatten", "conv2d"].includes(this_layer_type)) {
					var old_num_errs = num_errs;
					var old_num_wrns = num_wrns;

					log(`Setting layer to ${this_layer_type}`);

					$layer_type.val(this_layer_type).trigger("change");

					await wait_for_updated_page(3);

					await test_if_python_code_is_valid()

					if(old_num_wrns != num_wrns) {
						console.error(`New warning detected`);
						enable_debug_layer = true;
						return false;
					}

					if(old_num_errs != num_errs) {
						console.error(`New error detected`);
						enable_debug_layer = true;
						return false;
					}
				}
			}
		}

		await test_if_python_code_is_valid()
	}

	enable_debug_layer = true;
	return true;
}

async function test_prediction_for_csv_results () {
	log_test("Test predictions for CSV Results");

	await set_dataset_and_wait("and_xor");
	$("#predict_tab_label").click();
	await delay(1000);

	if (!await check_exists_and_visible("#predict_own_data", "test_prediction_for_csv_results: #predict_own_data")) {
		return false;
	}

	if (!await expect_predict_error("1", "1201")) {
		return false;
	}

	if (!await expect_predict_success("1,1")) {
		return false;
	}

	if (!await check_exists_and_visible("#prediction_non_image", "test_prediction_for_csv_results: #prediction_non_image")) {
		return false;
	}

	if (!await expect_predict_error("asdf", language[lang]["no_valid_numbers_found"])) {
		return false;
	}

	await test_if_python_code_is_valid()

	return true;
}

async function check_exists_and_visible(selector, context) {
	if (!$(selector).length) {
		console.error(`${context} not found`);
		return false;
	}
	if (!$(selector).is(":visible")) {
		console.error(`${context} is not visible`);
		return false;
	}
	return true;
}

async function expect_predict_error(input, error_code) {
	if (!await set_predict_own_data_and_predict(input)) {
		return false;
	}
	if (!$("#predict_error").is(":visible")) {
		console.error(`Predict error was not visible after predicting invalid entry "${input}"`);
		return false;
	}
	if (error_code && !$("#predict_error").html().includes(error_code)) {
		console.error(`Predict error does not contain expected error code "${error_code}"`);
		return false;
	}
	return true;
}

async function expect_predict_success(input) {
	if (!await set_predict_own_data_and_predict(input)) {
		return false;
	}
	if ($("#predict_error").is(":visible")) {
		console.error(`Predict error was visible after predicting valid entry "${input}"`);
		return false;
	}
	return true;
}

async function confirmAndRunTests() {
	try {
		if (typeof run_tests !== "function") {
			throw new Error("run_tests() is not defined.");
		}

		let proceed = window.confirm(
			"Warning: Running tests may disrupt the site.\n" +
			"Do you want to continue?"
		);

		if (!proceed) {
			console.log("Test execution canceled by user.");
			return { success: false, message: "Canceled by user" };
		}

		let quick = window.confirm(
			"Do you want to run the QUICK tests?\n" +
			"Click OK for quick tests, Cancel for full tests."
		);

		let result;
		if (quick) {
			console.log("Running quick tests...");
			result = await run_tests(1);
		} else {
			console.log("Running full tests...");
			result = await run_tests();
		}

		return { success: true, result: result };
	} catch (error) {
		console.error("Error while running tests:", error);
		return { success: false, error: error.message };
	}
}

async function test_all_optimizers_on_xor() {
	log_test("Test all optimizers");

	const wanted_epochs = 2;

	await set_dataset_and_wait("and_xor");
	await delay(1000);

	$('[aria-controls="tf_ribbon_settings"]').children().click();

	set_epochs(wanted_epochs);

	await delay(1000);

	const all_available_optimizers = [...document.querySelectorAll('#optimizer option')].map(o=>o.value)

	for (var i = 0; i < all_available_optimizers.length; i++) {
		const this_optimizer = all_available_optimizers[i];

		log(`Setting optimizer ${this_optimizer}`);

		if(all_available_optimizers.length < 6) {
			console.error(`test_all_optimizers_on_xor: Less than 6 optimizers available`);
			$('[aria-controls="home_ribbon"]').children().click()
			return false;
		}

		$("#optimizer").val(this_optimizer).trigger("change");

		await wait_for_updated_page(3);
		
		const ret = await train_neural_network();

		if(!is_valid_ret_object(ret, wanted_epochs)) {
			$('[aria-controls="home_ribbon"]').children().click()
			return false;
		}
	}

	$('[aria-controls="home_ribbon"]').children().click()

	await test_if_python_code_is_valid()

	return true;
}

async function check_python_code_tab (tab_name) {
	dbg(`Checking python code from ${tab_name}`);
	const is_valid_code = await check_python($("#" + tab_name).find("pre").text())

	if(!is_valid_code) {
		return false;
	}

	return true;
}

async function test_if_python_code_is_valid() {
	const ret = await test_if_python_code_is_valid_internal();

	test_equal("test_if_python_code_is_valid", ret, true)

	return ret;
}

async function test_if_python_code_is_valid_internal() {
	log_test("Test if python code is valid");

	const python_tab = await check_python_code_tab("python_tab")

	if (!python_tab) {
		err(`test_if_python_code_is_valid_internal: python_tab was not valid python code`);
		return false;
	}

	const python_expert_tab = await check_python_code_tab("python_expert_tab")

	if (!python_expert_tab) {
		err(`test_if_python_code_is_valid_internal: python_expert_tab was not valid python code`);
		return false;
	}

	return true;
}

async function test_if_click_on_upload_button_opens_upload_menu() {
	log_test("Testing clicking upload buttons");

	$("#upload_file_dialog").click()

	await delay(1000);

	if(!$("#upload_dialog").is(":visible")) {
		log(`test_if_click_on_upload_button_opens_upload_menu: #upload_dialog is not visible`);
		return false;
	}

	$("#upload_dialog").find(".close_button").click();

	return true;
}

async function wait_for_webcam_images(category_id, timeout_ms, required) {
	const start_time = Date.now();
	const selector = `.webcam_series_image_category_${category_id}`;

	return new Promise(resolve => {
		const interval = setInterval(() => {
			const count = $($(".own_images")[category_id]).find("canvas").length;
			if (count >= required) {
				log(`✅ ${count} images for category ${category_id} loaded in ${(Date.now() - start_time) / 1000}s`);
				clearInterval(interval);
				resolve(true);
			} else if (Date.now() - start_time > timeout_ms) {
				wrn(`⏰ Timeout: Only ${count} images for category ${category_id} after ${timeout_ms / 1000}s`);
				clearInterval(interval);
				resolve(false);
			}
		}, 500);
	});
}

async function test_webcam() {
	log_test("Testing webcam");

	const wanted_epochs = 2;

	await set_dataset_and_wait("signs");
	await delay(1000);

	$("#custom_webcam_training_data_small").click();
	await delay(1000);

	while (!$(".own_image_label").length) {
		dbg("test_webcam: Waiting until .own_image_label is visible");
		await delay(1000);
	}

	$($(".add_category")[0]).click();

	$("#number_of_series_images").val(5);

	const buttons = $(".webcam_series_button");
	for (let i = 0; i < 3; i++) {
		if (!buttons[i]) {
			wrn(`⚠️ webcam_series_button[${i}] not found`);
			return false;
		}
		$(buttons[i]).click();
		const ok = await wait_for_webcam_images(i, 15000, 5);
		if (!ok) return false;
	}

	set_epochs(wanted_epochs);

	const ret = await train_neural_network();
	if(!is_valid_ret_object(ret, wanted_epochs)) {
		err("Invalid return object for test webcam");
		return false;
	}

	await delay(3000);

	if(!$("#webcam_prediction").is(":visible")) {
		err("#webcam_prediction is not visible after training from webcam images");
		return false;
	}

	return true;
}

async function test_math_history() {
	log_test("Test Math History");

	const wanted_epochs = 2;

	await set_dataset_and_wait("and_xor");
	await delay(1000);

	$("#jump_to_interesting_tab").prop("checked", false);
	$("#save_math_history").prop("checked", true);

	set_epochs(wanted_epochs);

	$("#visualization_tab_label").click();
	await delay(1000);

	$("#math_tab_label").click();
	await delay(1000);

	const ret = await train_neural_network();

	if(!is_valid_ret_object(ret, wanted_epochs)) {
		$('[aria-controls="home_ribbon"]').children().click()
		$("#jump_to_interesting_tab").prop("checked", true);
		$("#save_math_history").prop("checked", false);
		return false;
	}

	if(math_history.length != 2) {
		err(`math_history.length was not 2 but ${math_history.length}`);
		$("#jump_to_interesting_tab").prop("checked", true);
		$("#save_math_history").prop("checked", false);
		return false;
	}

	if(math_history.length != 2) {
		err(`math_history.length was not 2 but ${math_history.length}`);
		$("#jump_to_interesting_tab").prop("checked", true);
		$("#save_math_history").prop("checked", false);
		return false;
	}

	if($("#math_history_slider").length != 1) {
		err(`'$("#math_history_slider").length' was not 1`);
		$("#jump_to_interesting_tab").prop("checked", true);
		$("#save_math_history").prop("checked", false);
		return false;
	}

	const el_text = $(".epoch-label").text();

	if(el_text != "Epoch: 2 / 2") {
		err(`$(".epoch-label").text() != "Epoch: 2 / 2", but ${el_text}`)
		$("#jump_to_interesting_tab").prop("checked", true);
		$("#save_math_history").prop("checked", false);
		return false;
	}

	$('[aria-controls="home_ribbon"]').children().click()

	await test_if_python_code_is_valid()

	$("#jump_to_interesting_tab").prop("checked", true);
	$("#save_math_history").prop("checked", false);
	return true;
}

function test_math_mode_color_generator() {
	if(!test_math_mode_color_generator_smaller_kernel()) {
		return false;
	}

	if(!test_math_mode_color_generator_larger_kernel()) {
		return false;
	}

	if(!test_math_mode_color_generator_kernel_actual_color_larger()) {
		return false;
	}

	if(!test_math_mode_color_generator_kernel_and_bias_changed()) {
		return false;
	}

	return true;
}

function test_math_mode_color_generator_smaller_kernel() {
	var old_layer_data = JSON.parse('[{"kernel":[[0.1]],"bias":[0],"beta":[],"gamma":[],"moving_mean":[],"moving_variance":[],"depthwise_kernel":[],"pointwise_kernel":[]}]');
	var new_layer_data = JSON.parse('[{"kernel":[[0.01]],"bias":[0],"beta":[],"gamma":[],"moving_mean":[],"moving_variance":[],"depthwise_kernel":[],"pointwise_kernel":[]}]')

	var wanted_result =  '[{"kernel":[["#cf1443"]],"bias":["#353535"],"beta":[],"gamma":[],"moving_mean":[],"moving_variance":[],"depthwise_kernel":[],"pointwise_kernel":[]}]';

	var got_result = JSON.stringify(get_colors_from_old_and_new_layer_data(old_layer_data, new_layer_data))

	if (wanted_result != got_result) {
		log(`test_math_mode_color_generator_smaller_kernel: Comparing old_layer_data with new_layer_data:\n${old_layer_data}\n${new_layer_data}\nWanted: ${wanted_result}\nGot: ${got_result}`);
		return false;
	}

	return true;
}

function test_math_mode_color_generator_larger_kernel() {
	var old_layer_data = JSON.parse('[{"kernel":[[0.09022978693246841]],"bias":[0],"beta":[],"gamma":[],"moving_mean":[],"moving_variance":[],"depthwise_kernel":[],"pointwise_kernel":[]}]');
	var new_layer_data = JSON.parse('[{"kernel":[[0.1]],"bias":[0],"beta":[],"gamma":[],"moving_mean":[],"moving_variance":[],"depthwise_kernel":[],"pointwise_kernel":[]}]')

	var wanted_result = '[{"kernel":[["#2e8b57"]],"bias":["#353535"],"beta":[],"gamma":[],"moving_mean":[],"moving_variance":[],"depthwise_kernel":[],"pointwise_kernel":[]}]';

	var got_result = JSON.stringify(get_colors_from_old_and_new_layer_data(old_layer_data, new_layer_data))

	if (wanted_result != got_result) {
		log(`test_math_mode_color_generator_larger_kernel: Comparing old_layer_data with new_layer_data:\n${old_layer_data}\n${new_layer_data}\nWanted: ${wanted_result}\nGot: ${got_result}`);
		return false;
	}

	return true;
}

function test_math_mode_color_generator_kernel_actual_color_larger() {
        var old_layer_data = JSON.parse('[{"kernel":[[0.5]],"bias":[0],"beta":[],"gamma":[],"moving_mean":[],"moving_variance":[],"depthwise_kernel":[],"pointwise_kernel":[]}]');
        var new_layer_data = JSON.parse('[{"kernel":[[0.6]],"bias":[0],"beta":[],"gamma":[],"moving_mean":[],"moving_variance":[],"depthwise_kernel":[],"pointwise_kernel":[]}]');

        var wanted_result = '[{"kernel":[["#2e8b57"]],"bias":["#353535"],"beta":[],"gamma":[],"moving_mean":[],"moving_variance":[],"depthwise_kernel":[],"pointwise_kernel":[]}]';

        var got_result = JSON.stringify(get_colors_from_old_and_new_layer_data(old_layer_data, new_layer_data));

        if (wanted_result != got_result) {
                log(`test_math_mode_color_generator_kernel_actual_color_larger: Comparing old_layer_data with new_layer_data:\n${JSON.stringify(old_layer_data)}\n${JSON.stringify(new_layer_data)}\nWanted: ${wanted_result}\nGot: ${got_result}`);
                return false;
        }

        return true;
}

function test_math_mode_color_generator_kernel_and_bias_changed () {
	var old_layer_data = JSON.parse('[{"kernel":[[0.5]],"bias":[-1],"beta":[],"gamma":[],"moving_mean":[],"moving_variance":[],"depthwise_kernel":[],"pointwise_kernel":[]}]');
	var new_layer_data = JSON.parse('[{"kernel":[[0.6]],"bias":[1],"beta":[],"gamma":[],"moving_mean":[],"moving_variance":[],"depthwise_kernel":[],"pointwise_kernel":[]}]');

	var wanted_result =  '[{"kernel":[["#2e8b57"]],"bias":["#2e8b57"],"beta":[],"gamma":[],"moving_mean":[],"moving_variance":[],"depthwise_kernel":[],"pointwise_kernel":[]}]';

	var got_result = JSON.stringify(get_colors_from_old_and_new_layer_data(old_layer_data, new_layer_data));

        if (wanted_result != got_result) {
                log(`test_math_mode_color_generator_kernel_and_bias_changed: Comparing old_layer_data with new_layer_data:\n${JSON.stringify(old_layer_data)}\n${JSON.stringify(new_layer_data)}\nWanted: ${wanted_result}\nGot: ${got_result}`);
                return false;
        }

        return true;
}

function test_no_new_errors_or_warnings () {
	test_equal("no new errors", num_errs, original_num_errs);
	test_equal("no new warnings", num_wrns, original_num_wrns);
}

async function run_tests (quick=0) {
	var original_num_errs = num_errs;
	var original_num_wrns = num_wrns;

	start_test_time = get_current_timestamp();
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

		test_equal("await test_show_layer_data_flow()", await test_show_layer_data_flow(), true);

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
		test_equal("test_image_map_dense()", await test_image_map_dense(), true);
		test_equal("test_augmented_training_images()", await test_augmented_training_images(), true);
		test_equal("test_prediction_for_csv_results()", await test_prediction_for_csv_results(), true);
		test_equal("test_check_categorical_predictions()", await test_check_categorical_predictions(), true);
		test_equal("test_different_layer_types()", await test_different_layer_types(), true);
		test_equal("test_all_optimizers_on_xor()", await test_all_optimizers_on_xor(), true);
		test_equal("test_if_python_code_is_valid()", await test_if_python_code_is_valid(), true);

		test_equal("test_math_history()", await test_math_history(), true);

		test_equal("test_webcam()", await test_webcam(), true);

		test_equal("await test_if_and_xor_examples_are_shown_after_switching_from_signs()", await test_if_and_xor_examples_are_shown_after_switching_from_signs(), true);

		test_equal("await test_custom_csv_x_squared()", await test_custom_csv_x_squared(), true);

		test_no_new_errors_or_warnings();

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
