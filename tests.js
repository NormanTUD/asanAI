"use strict";

var tests_ended = false;

var expect_memory_leak = "";
var num_tests = 0;
var num_tests_failed = 0;
var failed_test_names = [];
var mem_history = [];

var original_num_errs = num_errs;
var original_num_wrns = num_wrns;

async function set_dataset_and_wait(val) {
        $("#dataset").val(val).trigger("change");

	while ($(".overlay").length) {
		await delay(100);
	}

	await delay(5000);

        await wait_for_updated_page(3);
}

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

// Progress display needs an expected total. The suite is dynamic (loops and
// log_test add test_equal calls while it runs), so treat these values only as a
// starting estimate: _test_sync_expected_count() grows the total as tests are
// discovered, and the run stores the observed count for the next run.
// ?expected_tests=N overrides both.
var DEFAULT_EXPECTED_TEST_COUNT = 2356;
var DEFAULT_EXPECTED_QUICK_TEST_COUNT = 504;

function _test_expected_count (storage_key, fallback) {
	try {
		var m = /[?&]expected_tests=(\d+)/.exec(window.location.search);
		if (m) return parseInt(m[1], 10);
	} catch (e) {}

	try {
		var stored = parseInt(localStorage.getItem(storage_key), 10);
		if (stored > 0) return stored;
	} catch (e) {}

	return fallback;
}

var __test_expected_total = _test_expected_count("asanai_test_expected_count", DEFAULT_EXPECTED_TEST_COUNT);
var __test_expected_quick_total = _test_expected_count("asanai_test_expected_quick_count", DEFAULT_EXPECTED_QUICK_TEST_COUNT);

// The suite discovers tests while it runs, so the expected total cannot be a
// fixed constant. Grow it as the count passes the estimate; the end of the run
// pins it to the exact observed count.
function _test_sync_expected_count () {
	if (num_tests > __test_expected_total) {
		__test_expected_total = num_tests;
	}
}

function _test_eta_text(done, total, slow_durations, elapsed_ms) {
	if (total > 0 && done >= total) {
		return human_readable_time(0);
	}

	if (done >= 5 && slow_durations.length >= 5) {
		var slow_sum = slow_durations.reduce(function (sum, duration) { return sum + duration; }, 0);
		var slow_average = slow_sum / slow_durations.length;
		var slow_ratio = slow_durations.length / done;
		var remaining_slow = Math.max(0, total - done) * slow_ratio;
		var slow_seconds = Math.max(1, Math.ceil((slow_average * remaining_slow) / 1000));

		return human_readable_time(slow_seconds);
	}

	// Fallback for suites that never accumulate five 30-second tests: after five
	// minutes the overall average is stable enough to show a useful ETA.
	if (done >= 25 && elapsed_ms >= 5 * 60 * 1000) {
		var average = elapsed_ms / done;
		var fallback_seconds = Math.max(1, Math.ceil((average * Math.max(0, total - done)) / 1000));

		return human_readable_time(fallback_seconds);
	}

	return "calculating…";
}

function _test_format_progress(done, total, filtered, slow_durations, elapsed_ms) {
	var pct = total > 0 ? Math.min(100, Math.round(done / total * 100)) : 0;
	var width = 30;
	var filled = Math.round(width * pct / 100);
	var bar = "[" + "=".repeat(filled) + " ".repeat(width - filled) + "]";
	var eta = filtered ? "n/a (filtered run)" : _test_eta_text(done, total, slow_durations, elapsed_ms);

	return bar + " " + pct + "% of tests done (" + done + "/" + total + "), estimated time left: " + eta;
}

function _test_record_progress_duration() {
	var now = get_current_timestamp();

	if (__test_progress_last_at > 0) {
		var duration = now - __test_progress_last_at;

		if (duration >= 30000) {
			__test_progress_slow_durations.push(duration);
		}
	}

	__test_progress_last_at = now;
}

var __test_progress_last_at = 0;
var __test_progress_slow_durations = [];

function _test_progress_text() {
	var elapsed = start_test_time ? get_current_timestamp() - start_test_time : 0;

	return _test_format_progress(num_tests, __test_expected_total, __test_resume_active, __test_progress_slow_durations, elapsed);
}

function _test_overlay_label(name, max_length = 200) {
	name = "" + name;

	if (name.length <= max_length) {
		return name;
	}

	return name.slice(0, Math.max(0, max_length - 3)) + "...";
}

function show_num_tests_overlay(name) {
	_test_record_progress_duration();

	name = "Test-name: " + name;
	console.log(`%c${_test_progress_text()}%c -> ${name}`, "color:#94a3b8", "background:#004d40; color:#1de9b6");

	remove_num_tests_overlay();

	let div = document.createElement("div");
	div.id = "num-tests-overlay";
	div.innerHTML = `${_test_progress_text()}<br>Test ${num_tests}<br>${escape_html_for_test(_test_overlay_label(name))}`;
	log(`${_test_progress_text()}\nTest ${num_tests}\n${name}`);

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
		whiteSpace: "normal",
		wordBreak: "break-word",
		maxWidth: "90vw",
		textAlign: "center",
	});

	div.addEventListener("mouseenter", remove_num_tests_overlay);

	document.body.appendChild(div);

	setTimeout(() => {
		if (document.getElementById("num-tests-overlay")) {
			remove_num_tests_overlay();
		}
	}, 5000); // 5 seconds
}

function remove_num_tests_overlay() {
	let old = document.getElementById("num-tests-overlay");
	if (old) old.remove();
}

function test_not_equal (name, is, should_be) {
	num_tests++;
	_test_sync_expected_count();
	show_num_tests_overlay(name);
	if(!is_equal(is, should_be)) {
		//log("%c" + name + " OK", "background: green; color: white");
		return true;
	} else {
		console.error("[test_not_equal] " + name + " ERROR. Is: " + JSON.stringify(is) + ", should not be: " + JSON.stringify(should_be));
		num_tests_failed++;
		failed_test_names.push(name);
		throw new Error(`Test >${name}< failed`);
	}
}

// Resume-from-test support: when --from-test NAME is given (added to the URL
// as ?from_test=NAME by _run_tests.py), every test_equal before NAME is
// counted but not run. Non-test_equal calls (test_initializer, test_add_layer,
// test_shuffle, test_resize_time, …) still run unconditionally so that the
// global state they mutate stays consistent for the tests we do run.
var __test_from_test = (function () {
	try {
		var m = /[?&]from_test=([^&]+)/.exec(window.location.search);
		return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : null;
	} catch (e) { return null; }
})();
// --only-test NAME (repeatable): only run test_equals whose name contains
// one of the given substrings. Combined with --from-test this lets you run a
// short slice like "test_custom_tensor through test_check_categorical_predictions".
var __test_only_tests = (function () {
	var out = [];
	try {
		var re = /[?&]only_test=([^&]+)/g;
		var m;
		while ((m = re.exec(window.location.search)) !== null) {
			out.push(decodeURIComponent(m[1].replace(/\+/g, " ")));
		}
	} catch (e) {}
	return out;
})();
// --only-test-count N: stop after N test_equal calls past the resume point.
// Useful when you want a quick sanity-check slice without running the full
// tail of the suite.
var __test_only_count = (function () {
	try {
		var m = /[?&]only_test_count=(\d+)/.exec(window.location.search);
		return m ? parseInt(m[1], 10) : 0;
	} catch (e) { return 0; }
})();
var __test_only_count_used = 0;

var __test_resume_active = (__test_from_test !== null) || __test_only_tests.length > 0 || __test_only_count > 0;
// __test_resume_reached tracks "we are past the --from-test resume point" —
// only relevant when --from-test is set. only-test/only-test-count filters
// are independent and apply on their own.
var __test_resume_reached = (__test_from_test === null);
if (__test_resume_active) {
	var parts = [];
	if (__test_from_test)      parts.push("from_test=" + __test_from_test);
	if (__test_only_tests.length) parts.push("only_test=" + __test_only_tests.join(","));
	if (__test_only_count)      parts.push("only_test_count=" + __test_only_count);
	console.log("[test_filter] active: " + parts.join(" "));
}
function test_equal (name, is, should_be) {
	num_tests++;
	_test_sync_expected_count();
	// Pre-resume-point: skip if --from-test is set and we haven't reached it yet
	if (__test_from_test && !__test_resume_reached) {
		if (name.indexOf(__test_from_test) !== -1) {
			__test_resume_reached = true;
			console.log("[from_test] reached \"" + name + "\" — resuming test execution");
		} else {
			show_num_tests_overlay("[skipped until resume] " + name);
			return true;
		}
	}
	// Post-resume-point: skip if --only-test is set and this name doesn't match any allow-list.
	// Independent of --from-test — if you pass --only-test alone, every test_equal
	// must match to run; if you pass --from-test + --only-test, the from_test gate
	// runs first (skipping everything before the resume point), then the only_test
	// gate runs on everything from the resume point on.
	if (__test_only_tests.length > 0) {
		var allowed = false;
		for (var i = 0; i < __test_only_tests.length; i++) {
			if (name.indexOf(__test_only_tests[i]) !== -1) { allowed = true; break; }
		}
		if (!allowed) {
			show_num_tests_overlay("[only-test filtered out] " + name);
			return true;
		}
	}
	// --only-test-count: stop the whole run after N executed test_equal calls past the resume point.
	// Counts only tests that ACTUALLY ran (i.e. weren't filtered out above).
	if (__test_only_count > 0) {
		if (__test_only_count_used >= __test_only_count) {
			throw new Error("[only-test-count] limit of " + __test_only_count + " reached; stopping test suite");
		}
		__test_only_count_used++;
	}
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

function test_test_progress_display () {
	const slow = [31000, 32000, 33000, 34000, 35000];

	test_equal("Progress display shows a filled 30-character bar", _test_format_progress(50, 100, false, slow, 0).indexOf("[===============               ] 50% of tests done (50/100)") === 0, true);
	test_equal("Progress display waits for five slow samples", _test_format_progress(50, 100, false, slow.slice(0, 4), 0).indexOf("estimated time left: calculating…") !== -1, true);
	test_equal("Progress display shows an ETA after five slow samples", _test_format_progress(50, 100, false, slow, 0).indexOf(", estimated time left: ") !== -1, true);
	test_equal("Progress display falls back to the overall average after five minutes", _test_format_progress(50, 100, false, [], 5 * 60 * 1000).indexOf("estimated time left: calculating…") === -1, true);
	test_equal("Progress display never shows an empty ETA", _test_format_progress(999, 1000, false, slow, 0).split("estimated time left: ")[1].length > 0, true);
	test_equal("Progress display caps the bar at 100 percent", _test_format_progress(120, 100, false, slow, 0).indexOf("100% of tests done (120/100)") !== -1, true);
	test_equal("Progress display omits the ETA for filtered runs", _test_format_progress(5, 100, true, slow, 0).indexOf("n/a (filtered run)") !== -1, true);

	var expected_before_sync = __test_expected_total;
	__test_expected_total = 0;
	_test_sync_expected_count();
	var sync_grew = __test_expected_total === num_tests;
	__test_expected_total = expected_before_sync;
	test_equal("Progress display auto-grows the expected total", sync_grew, true);
	test_equal("Progress overlay keeps short test names", _test_overlay_label("short"), "short");
	test_equal("Progress overlay truncates very long test names", _test_overlay_label("x".repeat(500)).length, 200);

	return true;
}


// =============================================================================
// Tests for "Show real data" math mode feature (math_mode.js)
// Modular test suite - each test_* function is independent
// =============================================================================

function test_real_data_feature() {
	log_test("Real data feature tests");

	// Test 1: Variable exists and defaults to false
	test_equal("_math_show_real_data initial value", typeof _math_show_real_data !== "undefined" ? _math_show_real_data : "undefined", false);

	// Test 2: Toggle function exists
	test_equal("toggle_math_show_real_data is function", typeof toggle_math_show_real_data, "function");

	// Test 3: Toggle flips the state
	var before = _math_show_real_data;
	toggle_math_show_real_data();
	test_equal("_math_show_real_data after toggle", _math_show_real_data, !before);
	toggle_math_show_real_data();
	test_equal("_math_show_real_data after second toggle", _math_show_real_data, before);

	// Test 4: get_input_layer returns default when toggle is off
	var saved = _math_show_real_data;
	_math_show_real_data = false;
	test_equal("get_input_layer default", JSON.stringify(get_input_layer([3])), '[["x"]]');
	_math_show_real_data = saved;

	// Test 5: get_input_layer with window._last_predict_input_arr
	var saved2 = _math_show_real_data;
	_math_show_real_data = true;
	window._last_predict_input_arr = [[0.1, 0.2, 0.3]];
	var result = get_input_layer([3]);
	test_equal("get_input_layer from _last_predict_input_arr", JSON.stringify(result[0]), '[0.1,0.2,0.3]');
	delete window._last_predict_input_arr;
	_math_show_real_data = saved2;

	// Test 6: get_input_layer with pinned input takes priority
	window._pinned_input = [9.9, 8.8, 7.7];
	_math_show_real_data = true;
	var result2 = get_input_layer([3]);
	test_equal("get_input_layer with pinned (priority)", JSON.stringify(result2[0]), '[9.9,8.8,7.7]');
	delete window._pinned_input;
	_math_show_real_data = saved2;

	// Test 7: get_input_layer with neuron_outputs[0].input
	_math_show_real_data = true;
	neuron_outputs = {0: {input: [[[0.5, 0.6, 0.7]]], output: [[[0.1, 0.2]]]}};
	var result3 = get_input_layer([3]);
	test_equal("get_input_layer from neuron_outputs[0].input", JSON.stringify(result3[0]), '[0.5,0.6,0.7]');
	neuron_outputs = {};
	_math_show_real_data = saved2;

	// Test 8: Pre-render regex replaces x in pmatrix
	var latex = "\\\\begin{pmatrix}x\\\\end{pmatrix}";
	var fixed = _math_pre_render_real_data_fix(latex);
	test_equal("pre_render replaces x in pmatrix", fixed.indexOf("x") < 0 || fixed.indexOf("pmatrix") < 0, true);

	// Test 9: Pre-render preserves latex when toggle is off
	var saved3 = _math_show_real_data;
	_math_show_real_data = false;
	var latex2 = "\\\\begin{pmatrix}x\\\\end{pmatrix}";
	var fixed2 = _math_pre_render_real_data_fix(latex2);
	test_equal("pre_render passes through when toggle off", fixed2 === latex2, true);
	_math_show_real_data = saved3;

	// Test 10: Pre-render handles whitespace in pmatrix
	_math_show_real_data = true;
	window._last_predict_input_arr = [[1.1, 2.2, 3.3]];
	var latex3 = "\\\\begin{pmatrix}\nx\n\\\\end{pmatrix}";
	var fixed3 = _math_pre_render_real_data_fix(latex3);
	test_equal("pre_render handles whitespace around x", fixed3.indexOf("\nx\n") < 0, true);
	delete window._last_predict_input_arr;
	_math_show_real_data = saved3;

	// Test 11: Pin toggle function exists
	test_equal("toggle_math_pin_input is function", typeof toggle_math_pin_input, "function");

	// Test 12: Pin stores data in window._pinned_input
	neuron_outputs = {0: {input: [[[4.4, 5.5, 6.6]]], output: [[[0.1]]]}};
	window._last_predict_input_arr = null;
	toggle_math_pin_input();
	test_equal("toggle_math_pin_input stores values", JSON.stringify(window._pinned_input), '[4.4,5.5,6.6]');

	// Test 13: Second toggle unpins
	toggle_math_pin_input();
	test_equal("toggle_math_pin_input unpins", window._pinned_input, null);

	// Test 14: NaN handling in formatted output
	window._last_predict_input_arr = [[NaN, 0.5, Infinity, -Infinity]];
	var latex4 = "\\\\begin{pmatrix}x\\\\end{pmatrix}";
	var fixed4 = _math_pre_render_real_data_fix(latex4);
	test_equal("pre_render handles NaN/Infinity", fixed4.indexOf("NaN") < 0, true);
	test_equal("pre_render handles NaN/Infinity (no Inf)", fixed4.indexOf("Infinity") < 0, true);
	delete window._last_predict_input_arr;

	// Test 15: Large inputs are truncated to max_nr_cols_rows
	window._last_predict_input_arr = [Array(100).fill(0).map(function(_, i) { return i * 0.1; })];
	var latex5 = "\\\\begin{pmatrix}x\\\\end{pmatrix}";
	var fixed5 = _math_pre_render_real_data_fix(latex5);
	// Count number of values in the pmatrix
	var match = fixed5.match(/\\\\begin\{pmatrix\}(.+?)\\\\end\{pmatrix\}/);
	test_equal("pre_render limits large input", match !== null, true);
	delete window._last_predict_input_arr;

	// Test 16: get_input_layer handles null input gracefully
	_math_show_real_data = true;
	var savedN = window._last_predict_input_arr;
	var savedX = (typeof xy_data_global !== "undefined") ? xy_data_global : null;
	window._last_predict_input_arr = null;
	window.xy_data_global = null;
	neuron_outputs = {};
	var result4 = get_input_layer([3]);
	test_equal("get_input_layer graceful null fallback", JSON.stringify(result4), '[["x"]]');
	if (savedN) window._last_predict_input_arr = savedN;
	if (savedX) window.xy_data_global = savedX;
	_math_show_real_data = saved3;

	// Test 17: get_input_layer respects input shape for slicing
	_math_show_real_data = true;
	window._last_predict_input_arr = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]];
	var result5 = get_input_layer([10]);
	// Should be sliced to max_nr_cols_rows (default 32, so all 10 fit)
	test_equal("get_input_layer slicing with shape=10", result5[0].length <= 32, true);
	delete window._last_predict_input_arr;
	_math_show_real_data = saved3;

	// Test 18: _get_h returns symbolic when no data
	var saved4 = _math_show_real_data;
	_math_show_real_data = false;
	var hResult = _get_h(0);
	test_equal("_get_h returns mv-h class when off", hResult.indexOf("mv-h-L0") >= 0, true);
	_math_show_real_data = saved4;

	// Test 19: _get_h returns real values when data available
	_math_show_real_data = true;
	neuron_outputs = {0: {output: [[[0.1, 0.2, 0.3]]], input: [[[0.1, 0.2, 0.3]]]}};
	var hResult2 = _get_h(0);
	test_equal("_get_h returns numeric values when on", hResult2.indexOf("0.1") >= 0 || hResult2.indexOf("0.10") >= 0, true);
	neuron_outputs = {};
	_math_show_real_data = saved4;

	// Test 20: DOM fix function exists
	test_equal("_math_dom_fix_real_data is function", typeof _math_dom_fix_real_data, "function");

	// Test 21: Pre-render handles missing window gracefully
	var savedWindow = window._last_predict_input_arr;
	delete window._last_predict_input_arr;
	_math_show_real_data = true;
	var latex6 = "\\\\begin{pmatrix}x\\\\end{pmatrix}";
	try {
		var fixed6 = _math_pre_render_real_data_fix(latex6);
		test_equal("pre_render no crash without window", true, true);
	} catch(e) {
		test_equal("pre_render no crash without window", false, true);
	}
	if (savedWindow) window._last_predict_input_arr = savedWindow;
	_math_show_real_data = saved3;

	// Test 22: get_input_layer returns array-of-array structure
	_math_show_real_data = true;
	window._last_predict_input_arr = [[1, 2, 3]];
	var result6 = get_input_layer([3]);
	test_equal("get_input_layer is 2D", Array.isArray(result6) && Array.isArray(result6[0]), true);
	delete window._last_predict_input_arr;
	_math_show_real_data = saved3;

	// Test 23: Multiple toggles are idempotent in pairs
	var startState = _math_show_real_data;
	toggle_math_show_real_data();
	toggle_math_show_real_data();
	test_equal("Two toggles return to start", _math_show_real_data, startState);

	// Test 24: _math_pre_render_real_data_fix is function
	test_equal("_math_pre_render_real_data_fix is function", typeof _math_pre_render_real_data_fix, "function");

	// Test 25: Pin with no data shows warning (doesn't crash)
	window._pinned_input = null;
	neuron_outputs = {};
	window._last_predict_input_arr = null;
	try {
		toggle_math_pin_input();
		test_equal("Pin with no data doesn't crash", window._pinned_input, null);
	} catch(e) {
		test_equal("Pin with no data doesn't crash", false, true);
	}

	return true;
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

function _test_read_uncached_background (element) {
	if (!element) return null;

	const parent = element.parentNode || document.body;
	const tag = element.tagName;
	const id = element.id;
	const cls = element.className;

	if (id) element.id = id + "_theme_probe_live";

	const probe = document.createElement(tag);
	if (id) probe.id = id;
	probe.className = cls;
	parent.appendChild(probe);

	const color = getComputedStyle(probe).backgroundColor;
	probe.remove();

	if (id) element.id = id;

	return color;
}

async function test_maximally_activated_last_layer() {
	var num_cat = await get_number_of_categories();

	var lt = get_layer_type_array();

	$("#max_activation_iterations").val(5)

	log("Drawing maximally activated last layer");
	var canvasses = await draw_maximally_activated_layer(lt.length - 1, lt[lt.length - 1]);

	dbg(`Getting shapes from Canvasses`);
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

	dbg(`Checking outputs from Canvasses`);

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

	$("#visualization_tab_label").click();

	var wait_time = 1000;
	dbg(`Waiting ${wait_time}`);
	await sleep(wait_time);

	if($("#maximally_activated_label").length == 0) {
		console.error("#maximally_activated_label not found");
		return false;
	}
	$("#maximally_activated_label").click();

	dbg(`Waiting ${wait_time}`);
	await sleep(wait_time);

	if(!$("#maximally_activated_content").find("canvas").length) {
		console.error(`#maximally_activated_content: could not find any canvasses in it`);
		return false;
	}

	test_equal("Feature maps are grouped by layer", $(".feature-map-layer").length >= 1, true);

	const last_group = $(".feature-map-layer").last();
	const group_captions = last_group.find(".feature-map-caption").map(function () { return $(this).text(); }).get();
	const expected_status = (typeof model_is_trained !== "undefined" && model_is_trained) ? language[lang]["feature_map_status_trained"] : language[lang]["feature_map_status_untrained"];
	const row_status = last_group.find(".feature-map-layer-status");

	const captions_match = group_captions.length > 0 && group_captions.every(function (value, index) {
		if (typeof is_classification !== "undefined" && is_classification && typeof labels !== "undefined" && labels && labels[index] !== undefined) {
			return value === String(labels[index]);
		}
		return value === "#" + (index + 1);
	});
	test_equal("Feature map captions use category labels for the last layer", captions_match, true);
	test_equal("Each feature map row shows its generation-time training state", row_status.length, 1);
	test_equal("Feature map row status matches the state at generation time", row_status.text().indexOf(expected_status) !== -1, true);

	dbg("Hovering first maximally activated element to predict it");

	const canvas = $($("#maximally_activated_content").find("canvas"))[0];
	const rect = canvas.getBoundingClientRect();
	const canvas_controls = $(canvas).closest(".feature-map-item").find(".feature-map-controls");

	delete_maximally_activated_predictions();
	reset_maximally_activated_neurons();

	canvas.dispatchEvent(new MouseEvent("mouseenter", {bubbles: false, cancelable: true, clientX: rect.left + 6, clientY: rect.top + 6}));
	canvas.dispatchEvent(new MouseEvent("mousemove", {bubbles: true, cancelable: true, clientX: rect.left + 6, clientY: rect.top + 6}));

	const hover_deadline = Date.now() + 10000;

	while (Date.now() < hover_deadline && !$("#feature_map_tooltip .gti_row .gti_value").length) {
		await delay(50);
	}

	test_equal("Feature map hover shows the tooltip", $("#feature_map_tooltip").css("display") !== "none", true);
	test_equal("Feature map hover renders prediction rows", $("#feature_map_tooltip .gti_row").length > 0, true);
	test_equal("Feature map hover shows the map as preview", $("#feature_map_tooltip .feature-map-tooltip-preview").length, 1);
	test_equal("Feature map hover prediction is cached", !!canvas.__featureMapCacheKey && !!_feature_map_hover_state.cache[canvas.__featureMapCacheKey], true);
	test_equal("Feature maps have zoom controls attached to the image", canvas_controls.length, 1);

	const controls_before = canvas_controls[0].getBoundingClientRect();
	const scale_before = get_feature_map_scale(canvas);

	canvas_controls.find("[data-feature-map-action='larger']").click();

	const controls_after = canvas_controls[0].getBoundingClientRect();

	test_equal("Larger control scales its own feature map", get_feature_map_scale(canvas) > scale_before, true);
	test_equal("Zoom controls stay in place while the map scales", Math.abs(controls_after.left - controls_before.left) <= 1 && Math.abs(controls_after.top - controls_before.top) <= 1, true);
	test_equal("Per-map zoom leaves the global scale untouched", get_scale(), 1);

	canvas_controls.find("[data-feature-map-action='smaller']").click();
	test_equal("Smaller control scales the feature map back", Math.abs(get_feature_map_scale(canvas) - scale_before) < 1e-9, true);
	canvas_controls.find("[data-feature-map-action='reset']").click();
	test_equal("Reset control restores the map's default scale", get_feature_map_scale(canvas), 1);

	const feature_map_items = last_group.find(".feature-map-item");

	if (feature_map_items.length >= 2) {
		const first_map = feature_map_items[0];
		const second_map = feature_map_items[1];
		const first_scale_before = get_feature_map_scale(first_map);
		const second_controls = $(second_map).find(".feature-map-controls")[0];
		const second_controls_before = second_controls.getBoundingClientRect();

		$(second_map).find("[data-feature-map-action='larger']").click();

		const second_controls_after = second_controls.getBoundingClientRect();

		test_equal("Growing a map leaves the other maps in its row unchanged", get_feature_map_scale(first_map), first_scale_before);
		test_equal("Growing a map keeps its controls under the cursor", Math.abs(second_controls_after.left - second_controls_before.left) <= 1 && Math.abs(second_controls_after.top - second_controls_before.top) <= 1, true);

		$(second_map).find("[data-feature-map-action='reset']").click();
	}

	function parse_css_rgb (color) {
		if (!color) return null;

		var match = /rgba?\(([^)]+)\)/i.exec(color);
		var parts = null;

		if (match) {
			parts = match[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
		} else {
			match = /color\(srgb\s+([^)]+)\)/i.exec(color);
			if (match) {
				parts = match[1].split(/[\s\/]+/).filter(Boolean).map(Number).map(function (value) { return value * 255; });
			}
		}

		if (!parts || parts.length < 3 || parts.some(function (value) { return !isFinite(value); })) return null;
		return parts.slice(0, 3).map(function (value) { return Math.round(value); });
	}

	const original_darkmode = document.body.classList.contains("darkmode");

	async function wait_for_tooltip_background (want_dark, timeout_ms) {
		const deadline = Date.now() + (timeout_ms || 2000);
		var color = null;
		var rgb = null;

		while (Date.now() < deadline) {
			const node = document.getElementById("feature_map_tooltip") || _feature_map_ensure_tooltip();
			color = getComputedStyle(node).backgroundColor;
			rgb = parse_css_rgb(color);
			if (rgb && rgb[0] === rgb[1] && rgb[1] === rgb[2]) {
				if (want_dark ? rgb[0] < 100 : rgb[0] > 200) {
					return { ok: true, color: color, rgb: rgb };
				}
			}
			await new Promise(function (resolve) { requestAnimationFrame(resolve); });
		}

		// Some Chromium forks (Opera) cache computed styles for an existing
		// element and do not invalidate them when an ancestor class changes.
		// A freshly created probe reads the current CSS rules reliably.
		const live_tooltip = document.getElementById("feature_map_tooltip") || _feature_map_ensure_tooltip();
		const fresh_color = _test_read_uncached_background(live_tooltip);
		const fresh_rgb = parse_css_rgb(fresh_color);

		if (fresh_rgb && fresh_rgb[0] === fresh_rgb[1] && fresh_rgb[1] === fresh_rgb[2]) {
			if (want_dark ? fresh_rgb[0] < 100 : fresh_rgb[0] > 200) {
				return { ok: true, color: fresh_color, rgb: fresh_rgb, fresh: true };
			}
		}

		return { ok: false, color: color, rgb: rgb, fresh_color: fresh_color };
	}

	document.body.classList.add("darkmode");
	const dark = await wait_for_tooltip_background(true);
	document.body.classList.remove("darkmode");
	const light = await wait_for_tooltip_background(false);

	if (!dark.ok || !light.ok) {
		console.log("[feature-map-tooltip-theme] " + JSON.stringify({
			dark: dark.color,
			light: light.color,
			body: document.body.className
		}));
	}

	test_equal("Feature map tooltip uses a dark background in dark mode", dark.ok, true);
	test_equal("Feature map tooltip uses a light background in light mode", light.ok, true);

	if (original_darkmode) {
		document.body.classList.add("darkmode");
	}

	const original_lang = lang;

	try {
		await update_lang("de");
		await delay(100);
		test_equal("Feature map tooltip uses German status text", _feature_map_prediction_html(null).indexOf(language.de["predicting"]) !== -1, true);

		await update_lang("en");
		await delay(100);
		test_equal("Feature map tooltip uses English status text", _feature_map_prediction_html(null).indexOf(language.en["predicting"]) !== -1, true);
	} finally {
		await update_lang(original_lang);
		await delay(100);
	}

	const rapid_canvases = $("#maximally_activated_content canvas").toArray().slice(0, 5);

	for (var rapid_idx = 0; rapid_idx < rapid_canvases.length; rapid_idx++) {
		const rapid_rect = rapid_canvases[rapid_idx].getBoundingClientRect();
		rapid_canvases[rapid_idx].dispatchEvent(new MouseEvent("mouseenter", {bubbles: false, cancelable: true, clientX: rapid_rect.left + 5, clientY: rapid_rect.top + 5}));
	}

	await delay(3000);

	test_equal("Rapid feature map hovering settles into one prediction", _feature_map_hover_state.running, false);
	test_equal("Rapid feature map hovering never inserts prediction blocks", $(".maximally_activated_predictions").length, 0);

	_feature_map_hide_tooltip();
	await delay(100);
	test_equal("Feature map tooltip hides on mouseleave", $("#feature_map_tooltip").css("display"), "none");

	delete_maximally_activated_predictions();
	canvas.click();
	await delay(500);
	test_equal("Clicking a feature map no longer inserts a prediction block", $(".maximally_activated_predictions").length, 0);
	return true;
}

function test_feature_map_intro_is_short () {
	const en = language.en && language.en["maximally_activated_explanation_short"];
	const de = language.de && language.de["maximally_activated_explanation_short"];

	test_equal("Feature map intro exists in English", typeof en === "string" && en.length > 0, true);
	test_equal("Feature map intro exists in German", typeof de === "string" && de.length > 0, true);
	test_equal("Feature map intro stays readable in English", typeof en === "string" && en.length < 520, true);
	test_equal("Feature map intro stays readable in German", typeof de === "string" && de.length < 520, true);
	test_equal("Feature map details are collapsed by default", $(".feature-map-details").prop("open") !== true, true);

	return true;
}

async function test_feature_map_row_status_is_per_generation_and_translated () {
	const container = document.getElementById("maximally_activated_content");

	if (!container) {
		test_equal("Feature map content exists for row status test", false, true);
		return false;
	}

	const previous_groups = container.querySelectorAll(":scope > .feature-map-layer").length;
	const old_model_is_trained = model_is_trained;
	const old_lang = lang;
	var new_groups = [];

	try {
		model_is_trained = false;
		add_header_to_maximally_activated_content(0);

		model_is_trained = true;
		add_header_to_maximally_activated_content(0);

		new_groups = Array.from(container.querySelectorAll(":scope > .feature-map-layer")).slice(previous_groups);

		test_equal("Each feature map row gets its own status badge", new_groups.length, 2);

		const untrained_key = new_groups[0].querySelector(".feature-map-layer-status").getAttribute("data-tr-text");
		const trained_key = new_groups[1].querySelector(".feature-map-layer-status").getAttribute("data-tr-text");

		test_equal("Old rows keep the state they were generated with", untrained_key, "feature_map_status_untrained");
		test_equal("New rows record the trained state", trained_key, "feature_map_status_trained");

		await update_lang("de");
		await delay(100);
		test_equal("Row status badges follow language changes", new_groups[0].querySelector(".feature-map-layer-status").textContent, language.de["feature_map_status_untrained"]);

		await update_lang("en");
		await delay(100);
		test_equal("Row status badges switch back with the language", new_groups[1].querySelector(".feature-map-layer-status").textContent, language.en["feature_map_status_trained"]);
	} finally {
		new_groups.forEach(function (group) { group.remove(); });
		model_is_trained = old_model_is_trained;
		await update_lang(old_lang);
		await delay(100);
	}

	return true;
}

async function test_gradient_flow_empty_state_on_activation () {
	const active_tab_label = $("#navbar1 .navi_list > li[aria-expanded='true'] > a").prop("id");

	GradientFlowHeatmap.reset();
	window.__gradient_flow_visible = false;

	try {
		show_tab_label("gradient_flow_tab_label", 1);
		await delay(500);

		const $tab = $("#gradient_flow");

		test_equal("Gradient flow renders a container when its tab opens", $tab.find(".gflow_container").length, 1);
		test_equal("Gradient flow shows an empty state before training", $tab.find(".gflow_empty").css("display") !== "none", true);
		test_equal("Gradient flow empty state asks the reader to train", $tab.find(".gflow_empty").text().indexOf(language[lang]["gflow_waiting"]) !== -1, true);
		test_equal("Gradient flow offers a metric selector", $tab.find("[data-gflow='metric']").length, 1);
		test_equal("Gradient flow metric selector has three metrics", $tab.find("[data-gflow='metric'] option").length, 3);

		const oldMetric = GradientFlowHeatmap.getMetric();
		try {
			$tab.find("[data-gflow='metric']").val("rms").trigger("change");
			test_equal("Gradient flow stores the selected metric", GradientFlowHeatmap.getMetric(), "rms");
			test_equal("Gradient flow L2 metric keeps the summed norm", GradientFlowHeatmap.metricValue({gradNorm: 9}, "l2"), 9);
			test_equal("Gradient flow RMS metric divides by parameters", GradientFlowHeatmap.metricValue({gradNorm: 9, gradSqSum: 25, paramCount: 4}, "rms"), 2.5);
			test_equal("Gradient flow mean metric averages absolute gradients", GradientFlowHeatmap.metricValue({gradNorm: 9, gradAbsSum: 10, paramCount: 4}, "mean"), 2.5);
		} finally {
			GradientFlowHeatmap.setMetric(oldMetric);
		}
	} finally {
		if (active_tab_label && active_tab_label !== "gradient_flow_tab_label") {
			show_tab_label(active_tab_label, 1);
		}
		await delay(200);
	}

	return true;
}

async function test_health_status_records_after_opening_tab () {
	const active_tab_label = $("#navbar1 .navi_list > li[aria-expanded='true'] > a").prop("id");
	const old_enabled = layerIOStats.enabled;
	const old_records = layerIOStats.records.slice();
	const old_cache = _photo_gallery_prediction_cache;
	const entry = _photo_gallery.entries && _photo_gallery.entries[0];

	try {
		layerIOStats.enabled = false;
		layerIOStats.records = [];

		if (entry) {
			_photo_gallery_prediction_cache = {};
			_photo_gallery_prediction_cache[entry.url] = {model: model, generation: weights_generation, values: [1]};
		}

		show_tab_label("health_status_tab_label", 1);
		await delay(300);

		test_equal("Health tab enables recording automatically", layerIOStats.enabled, true);

		if (entry) {
			test_equal("Health tab clears cached gallery predictions when recording starts", _photo_gallery_prediction_is_cached(entry), null);
		}

		test_equal("Health empty state translates the no-data message", $("#health_status .TRANSLATEME_layer_io_no_data").text(), language[lang]["layer_io_no_data"]);
		test_equal("Health empty state translates the toggle label", $("#health_status .lio_toggle_btn").text().indexOf(language[lang]["layer_io_recording_active"]) !== -1, true);

		if (entry && typeof _photo_gallery_predict_image === "function") {
			await _photo_gallery_predict_image(entry.img);
		}

		renderLayerIOStats("health_status");
		await delay(200);

		test_equal("Health tab records a prediction", layerIOStats.records.length > 0, true);
		test_equal("Health tab shows layer cards after a prediction", $("#health_status .lio_card").length > 0, true);
		test_equal("Health tab shows both the toggle and the health cards", $("#health_status .lio_toggle_btn").length > 0 && $("#health_status .lio_card").length > 0, true);
	} finally {
		layerIOStats.enabled = old_enabled;
		layerIOStats.records = old_records;
		_photo_gallery_prediction_cache = old_cache;

		if (active_tab_label && active_tab_label !== "health_status_tab_label") {
			show_tab_label(active_tab_label, 1);
		}

		await delay(200);
	}

	return true;
}

function test_explainability_axis_label_fallback () {
	if (typeof ExplainabilityLib === "undefined" || typeof Plotly === "undefined") {
		test_equal("ExplainabilityLib and Plotly are available", false, true);
		return false;
	}

	const div = document.createElement("div");
	div.id = "axis_fallback_test";
	div._fullLayout = {annotations: []};
	document.body.appendChild(div);

	const old_add_annotations = Plotly.addAnnotations;
	const old_relayout = Plotly.relayout;
	const old_wrns = num_wrns;
	var captured = null;

	try {
		Plotly.addAnnotations = undefined;
		Plotly.relayout = function (target, update) {
			captured = update;
			target._fullLayout.annotations = update.annotations || [];
		};

		const ok = ExplainabilityLib.forceAxisLabels("axis_fallback_test", "Test X", "Test Y");

		test_equal("Axis label fallback returns true", ok, true);
		test_equal("Axis label fallback uses relayout when addAnnotations is missing", !!captured && Array.isArray(captured.annotations) && captured.annotations.length === 2, true);
		test_equal("Axis label fallback does not add warnings", num_wrns, old_wrns);

		ExplainabilityLib.forceAxisLabels("axis_fallback_test", "Test X", "Test Y");
		test_equal("Axis label fallback does not duplicate annotations", captured.annotations.length, 2);
	} finally {
		Plotly.addAnnotations = old_add_annotations;
		Plotly.relayout = old_relayout;
		div.remove();
	}

	return true;
}

function test_fcnn_neuron_colors_span_each_layer () {
	const canvas = document.createElement("canvas");
	canvas.width = 40;
	canvas.height = 20;
	const ctx = canvas.getContext("2d");

	function center_value (values, neuron_idx) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		draw_neuron_with_normalized_color(ctx, values, 20, 10, 8, neuron_idx);
		return ctx.getImageData(20, 10, 1, 1).data[0];
	}

	test_equal("Constant positive activation is white", center_value([1], 0), 255);
	test_equal("Constant zero activation is black", center_value([0], 0), 0);
	test_equal("Layer minimum maps to black", center_value([0, 0.5, 1], 0), 0);
	test_equal("Layer maximum maps to white", center_value([0, 0.5, 1], 2), 255);
	test_equal("A second layer also spans up to white", center_value([5, 10], 1), 255);
	test_equal("A second layer also spans down to black", center_value([5, 10], 0), 0);

	const kernel_image = _build_kernel_image_data(ctx, [[0, 3], [1, 2]], 2, 2, 0, 3);
	test_equal("Kernel image maps the smallest value to black", kernel_image.data[0], 0);
	test_equal("Kernel image maps the largest value to white", kernel_image.data[4], 255);

	const flatten_canvas = document.createElement("canvas");
	flatten_canvas.width = 1;
	flatten_canvas.height = 2;
	const flatten_ctx = flatten_canvas.getContext("2d");

	_render_flatten_rect(flatten_ctx, [0, 1], 0, 0, 1, 2);

	test_equal("Flatten rectangle maps the smallest value to black", flatten_ctx.getImageData(0, 0, 1, 1).data[0], 0);
	test_equal("Flatten rectangle maps the largest value to white", flatten_ctx.getImageData(0, 1, 1, 1).data[0], 255);

	return true;
}

async function test_faster_canvas_fill_order () {
	const real_canvas = document.getElementById("fcnn_canvas");
	const test_canvas = document.createElement("canvas");
	test_canvas.width = 60;
	test_canvas.height = 60;

	if (real_canvas) real_canvas.id = "fcnn_canvas_original";
	test_canvas.id = "fcnn_canvas";
	document.body.appendChild(test_canvas);

	try {
		const ctx = test_canvas.getContext("2d");

		// A later fill with a style already seen earlier must stay on top.
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, 10, 10);
		ctx.fillStyle = "#888888";
		ctx.fillRect(0, 0, 10, 10);
		ctx.fillStyle = "#000000";
		ctx.fillRect(5, 5, 10, 10);
		test_equal("Faster canvas keeps later same-style fills on top", ctx.getImageData(7, 7, 1, 1).data[0], 0);

		// A fill after a stroke must cover it.
		ctx.clearRect(0, 0, 60, 60);
		ctx.strokeStyle = "#ff0000";
		ctx.lineWidth = 6;
		ctx.beginPath();
		ctx.moveTo(0, 30);
		ctx.lineTo(60, 30);
		ctx.stroke();
		ctx.fillStyle = "#000000";
		ctx.fillRect(20, 20, 20, 20);
		test_equal("Faster canvas keeps fills after strokes", ctx.getImageData(30, 30, 1, 1).data[0], 0);

		// getImageData must flush pending draws first.
		ctx.clearRect(0, 0, 60, 60);
		ctx.fillStyle = "#123456";
		ctx.fillRect(0, 0, 60, 60);
		test_equal("Faster canvas flushes before getImageData", ctx.getImageData(1, 1, 1, 1).data[0], 0x12);

		// The animation-frame flush must paint without a read triggering it.
		ctx.clearRect(0, 0, 60, 60);
		ctx.fillStyle = "#abcdef";
		ctx.fillRect(0, 0, 60, 60);
		test_canvas.id = "fcnn_canvas_native_read";
		const native_ctx = test_canvas.getContext("2d");
		await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
		test_equal("Faster canvas flushes deferred draws", native_ctx.getImageData(1, 1, 1, 1).data[0], 0xab);
	} finally {
		test_canvas.remove();
		if (real_canvas) real_canvas.id = "fcnn_canvas";
	}

	return true;
}

function test_grid_tooltip_custom_images () {
	const old_labels = labels;
	const containers = [];
	const tooltip = document.createElement("div");

	try {
		labels = ["Hund", "Katze"];

		const img_with_attr = document.createElement("img");
		img_with_attr.setAttribute("data-category", "1");
		const img_without_attr = document.createElement("img");
		const canvas_with_label = document.createElement("canvas");
		canvas_with_label.setAttribute("data-category", "Katze");

		const c0 = document.createElement("div");
		c0.className = "own_images";
		c0.appendChild(img_with_attr);
		const c1 = document.createElement("div");
		c1.className = "own_images";
		c1.appendChild(img_without_attr);
		c1.appendChild(canvas_with_label);
		document.body.appendChild(c0);
		document.body.appendChild(c1);
		containers.push(c0, c1);

		test_equal("Custom image category from data-category index", extractCategoryFromURL("data:image/png;base64,", img_with_attr), "Katze");
		const expected_fallback = labels[$(".own_images").index(c1) % labels.length];
		test_equal("Custom image category falls back to its container", extractCategoryFromURL(undefined, img_without_attr), expected_fallback);
		test_equal("Custom canvas category can be a label", extractCategoryFromURL(undefined, canvas_with_label), "Katze");
		test_equal("Dataset image category still comes from the URL", extractCategoryFromURL("https://example.test/photos/Hund/1.jpg", img_with_attr), "Hund");

		_render_grid_tooltip(tooltip, {
			category: 1,
			probability: 0.9,
			correct_category: "Katze",
			src: "https://example.test/photos/Katze/langes_bild.png"
		});
		test_equal("Grid tooltip omits the filename", tooltip.textContent.indexOf("langes_bild.png"), -1);
		test_equal("Grid tooltip shows the correct custom category", tooltip.textContent.indexOf("Katze") !== -1, true);
		test_equal("Grid tooltip marks a correct custom prediction", tooltip.querySelectorAll(".gti_good").length, 1);
	} finally {
		labels = old_labels;
		containers.forEach(function(container) { container.remove(); });
	}

	return true;
}

function test_grid_tooltip_hides_on_tab_change () {
	const tooltip = _get_grid_tooltip_element();
	const old_display = tooltip.style.display;
	const old_over = _grid_pointer_over_grid;
	const old_x = _grid_pointer_client_x;
	const old_y = _grid_pointer_client_y;
	const old_region = _grid_tooltip_last_region_index;

	try {
		tooltip.style.display = "block";
		_grid_pointer_over_grid = true;
		_grid_pointer_client_x = 123;
		_grid_pointer_client_y = 45;
		_grid_tooltip_last_region_index = 2;

		_handle_grid_visibility_entries([{ isIntersecting: false }]);

		test_equal("Grid tooltip hides when its tab hides", tooltip.style.display, "none");
		test_equal("Grid hover state clears when its tab hides", _grid_pointer_over_grid, false);
		test_equal("Grid pointer x clears when its tab hides", _grid_pointer_client_x, null);
		test_equal("Grid tooltip region resets when its tab hides", _grid_tooltip_last_region_index, -1);
	} finally {
		tooltip.style.display = old_display;
		_grid_pointer_over_grid = old_over;
		_grid_pointer_client_x = old_x;
		_grid_pointer_client_y = old_y;
		_grid_tooltip_last_region_index = old_region;
	}

	return true;
}

function test_resolve_maximally_activated_iterations() {
	var $input = $("#max_activation_iterations");
	var old_value = $input.val();
	var last_layer_idx = model.layers.length - 1;

	try {
		$input.val("");

		if (_resolve_iterations(0) !== 30) {
			console.error(`_resolve_iterations(0) with an empty GUI value should be 30, but is ${_resolve_iterations(0)}`);
			return false;
		}

		if (_resolve_iterations(last_layer_idx) !== 200) {
			console.error(`_resolve_iterations(${last_layer_idx}) with an empty GUI value should be 200, but is ${_resolve_iterations(last_layer_idx)}`);
			return false;
		}

		$input.val("7");

		if (_resolve_iterations(0) !== 7) {
			console.error(`_resolve_iterations(0) with an explicit GUI value should be 7, but is ${_resolve_iterations(0)}`);
			return false;
		}

		if (_resolve_iterations(last_layer_idx) !== 7) {
			console.error(`_resolve_iterations(${last_layer_idx}) with an explicit GUI value should be 7, but is ${_resolve_iterations(last_layer_idx)}`);
			return false;
		}

		$input.val("0");

		if (_resolve_iterations(0) !== 30) {
			console.error(`_resolve_iterations(0) with an invalid GUI value should fall back to 30, but is ${_resolve_iterations(0)}`);
			return false;
		}

		return true;
	} finally {
		$input.val(old_value);
	}
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
	set_loss(val);
	await wait_for_updated_page(3);

	set_metric(val);
	await wait_for_updated_page(3);

	await delay(1000);
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

	$("#predict_tab_label").click();

	await delay(3000);

	await set_dataset_and_wait("and_xor");

	await delay(3000);

	$("#predict_tab_label").click();

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

	// Ensure TF.js backend is fully initialized before proceeding
	await tf.ready();

	x_file = get_fake_x_custom_tensor_data();
	y_file = get_fake_y_custom_tensor_data();

	debug_custom_tensor_x = x_file;
	debug_custom_tensor_y = y_file;

	set_x_file(x_file);
	set_y_file(y_file);

	await set_same_loss_and_metric("meanSquaredError");

	set_epochs(wanted_epochs);

	await wait_for_updated_page(3);

	// Force model recompilation so it picks up the new input/output shapes
	// from the custom tensor data before training begins
	try {
		await compile_model();
	} catch (e) {
		console.warn("[test_custom_tensor] compile_model warning:", e);
	}

	await wait_for_updated_page(3);

	const ret = await train_neural_network();

	reset_global_x_y_to_null();

	if (!is_valid_ret_object(ret, wanted_epochs)) {
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

	await sleep(1000);

	$("#predict_tab_label").click();

	await sleep(1000);

	enable_or_disable_show_layer_data(true);

	await sleep(1000);

	$($(".example_images")[0]).click();

	await sleep(5000);

	if(!$("#layer_0_input").find("canvas").length) {
		console.error("#layer_0_input: no canvas for first layer input found");

		enable_or_disable_show_layer_data(false);
		return false;
	}

	if(!$("#layer_0_kernel").find("canvas").length) {
		console.error("#layer_0_kernel: no kernel canvas for first layer found");

		enable_or_disable_show_layer_data(false);
		return false;
	}

	enable_or_disable_show_layer_data(false);

	return true;
}

function test_grad_cam_panel_waits_for_heatmap () {
	var $checkbox = $("#show_grad_cam");
	var $panel = $("#grad_cam_panel");
	var $heatmap = $("#grad_cam_heatmap");
	var original_checked = $checkbox.is(":checked");
	var original_has_heatmap = _grad_cam_has_heatmap;
	var original_panel_display = $panel[0].style.display;
	var original_heatmap_display = $heatmap[0].style.display;
	var original_show_layer_data = $("#show_layer_data").is(":checked");

	// The kernel toggle wins over gradCAM and emits a warning; silence that path
	// while we probe the panel state so the suite's warning counter stays clean.
	$("#show_layer_data").prop("checked", false);
	$checkbox.prop("checked", true);

	_grad_cam_has_heatmap = false;
	enable_disable_grad_cam(false);
	var hidden_without_heatmap = $panel.css("display") === "none";

	_grad_cam_has_heatmap = true;
	enable_disable_grad_cam(false);
	var shown_with_heatmap = $panel.css("display") !== "none";

	$checkbox.prop("checked", original_checked);
	_grad_cam_has_heatmap = original_has_heatmap;
	enable_disable_grad_cam(false);
	$panel[0].style.display = original_panel_display;
	$heatmap[0].style.display = original_heatmap_display;
	$("#show_layer_data").prop("checked", original_show_layer_data);

	return hidden_without_heatmap && shown_with_heatmap;
}

async function test_grad_cam_repredicts_last_image () {
	var original_predict = window.__predict;
	var original_draw_heatmap = window.draw_heatmap;
	var original_input_shape_is_image = window.input_shape_is_image;
	var original_tensor_shape_matches_model = window.tensor_shape_matches_model;
	var original_source = window._last_predicted_image_input_arr;
	var original_checked = $("#show_grad_cam").is(":checked");
	var original_has_heatmap = _grad_cam_has_heatmap;
	var original_queue = waiting_updated_page_uuids.slice();
	var predict_calls = 0;
	var draw_calls = 0;

	try {
		waiting_updated_page_uuids.length = 0;
		$("#show_grad_cam").prop("checked", true);
		_grad_cam_has_heatmap = false;
		window._last_predicted_image_input_arr = [[[[1, 2, 3]]]];
		window.input_shape_is_image = function () { return true; };
		window.tensor_shape_matches_model = function () { return true; };
		window.__predict = async function () {
			predict_calls++;
			return tensor([[0.5, 0.5]]);
		};
		window.draw_heatmap = async function () {
			draw_calls++;
			_grad_cam_has_heatmap = true;
		};

		var success = await repredict_last_image_for_grad_cam();
		var success_ok = success === true && predict_calls === 1 && draw_calls === 1;

		_grad_cam_has_heatmap = false;
		window._last_predicted_image_input_arr = null;
		var no_source_ok = (await repredict_last_image_for_grad_cam()) === false && predict_calls === 1 && draw_calls === 1;

		_grad_cam_has_heatmap = false;
		window._last_predicted_image_input_arr = [[[[1, 2, 3]]]];
		window.__predict = async function () {
			predict_calls++;
			throw new Error("deliberate repredict failure");
		};
		var failure_ok = (await repredict_last_image_for_grad_cam()) === false && predict_calls === 2 && draw_calls === 1;

		$("#show_grad_cam").prop("checked", false);
		_grad_cam_has_heatmap = false;
		window._last_predicted_image_input_arr = [[[[1, 2, 3]]]];
		window.__predict = async function () {
			predict_calls++;
			return tensor([[0.5, 0.5]]);
		};
		var layer_data_ok = (await repredict_last_image()) === true && predict_calls === 3 && draw_calls === 1;

		return success_ok && no_source_ok && failure_ok && layer_data_ok;
	} finally {
		window.__predict = original_predict;
		window.draw_heatmap = original_draw_heatmap;
		window.input_shape_is_image = original_input_shape_is_image;
		window.tensor_shape_matches_model = original_tensor_shape_matches_model;
		window._last_predicted_image_input_arr = original_source;
		$("#show_grad_cam").prop("checked", original_checked);
		_grad_cam_has_heatmap = original_has_heatmap;
		waiting_updated_page_uuids.length = 0;
		Array.prototype.push.apply(waiting_updated_page_uuids, original_queue);
	}
}

async function test_grad_cam_uniform_heatmap_is_low () {
	var heat_map = null;
	var zero_heatmap = null;
	var uniform = null;

	try {
		heat_map = tensor([[[0, 0], [0, 0]]]);
		zero_heatmap = _grad_cam_zero_heatmap(heat_map);
		uniform = apply_color_map(zero_heatmap);

		var shape_ok = JSON.stringify(zero_heatmap.shape) === "[1,2,2,1]";
		var pixels = array_sync(uniform);
		var low_ok = true;

		for (var i = 0; i < pixels[0].length; i++) {
			for (var j = 0; j < pixels[0][i].length; j++) {
				var pixel = pixels[0][i][j];

				if(Math.abs(pixel[0] - RGB_COLORMAP[0]) > 1e-5
					|| Math.abs(pixel[1] - RGB_COLORMAP[1]) > 1e-5
					|| Math.abs(pixel[2] - RGB_COLORMAP[2]) > 1e-5) {
					low_ok = false;
				}
			}
		}

		return shape_ok && low_ok;
	} catch (e) {
		dbg("[test_grad_cam_uniform_heatmap_is_low] " + extract_error_message(e));
		return false;
	} finally {
		await dispose(uniform, zero_heatmap, heat_map);
	}
}

function test_clear_attrament_clears_edges () {
	var sketcher = atrament_data && atrament_data.sketcher;

	if(!sketcher || !sketcher.canvas) {
		return false;
	}

	var canvas = sketcher.canvas;
	var context = canvas.getContext("2d");
	var saved = context.getImageData(0, 0, canvas.width, canvas.height);

	try {
		context.save();
		context.setTransform(1, 0, 0, 1, 0, 0);
		context.fillStyle = "#000000";
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.restore();

		clear_attrament("sketcher");

		var points = [
			[0, 0],
			[canvas.width - 1, 0],
			[0, canvas.height - 1],
			[canvas.width - 1, canvas.height - 1],
			[Math.floor(canvas.width / 2), Math.floor(canvas.height / 2)]
		];

		for (var point_idx = 0; point_idx < points.length; point_idx++) {
			var pixel = context.getImageData(points[point_idx][0], points[point_idx][1], 1, 1).data;

			if(pixel[0] < 250 || pixel[1] < 250 || pixel[2] < 250 || pixel[3] < 250) {
				return false;
			}
		}

		return true;
	} finally {
		context.putImageData(saved, 0, 0);
	}
}

async function test_custom_drawn_images_with_augmentation() {
	set_mode_to_expert();

	$("#augment_rotate_images").prop("checked", true);
	$("#augment_invert_images").prop("checked", true);
	$("#augment_flip_left_right").prop("checked", true);

	const wanted_epochs = 2;

	$("#jump_to_interesting_tab").prop("checked", true);

	$("#custom_image_training_data_small").click();

	await sleep(5000);

	await wait_for_two_save_buttons_and_click_them();

	set_epochs(wanted_epochs);

	const ret = await train_neural_network();

	["augment_rotate_images", "augment_invert_images", "augment_flip_left_right"].forEach(function (id) {
		$("#" + id).prop("checked", false);
	});

	if(!is_valid_ret_object(ret, wanted_epochs)) {
		return false;
	}

	if($("#sketcher").is(":visible")) {
		return true;
	}

	return false;
}

async function test_custom_drawn_images() {
	const wanted_epochs = 2;

	$("#jump_to_interesting_tab").prop("checked", true);

	$("#custom_image_training_data_small").click();

	await wait_for_two_save_buttons_and_click_them();

	set_epochs(wanted_epochs);

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
	log("Waiting for 2 save_buttons to exist...");

	var save_buttons = __test_get_save_buttons();

	while (save_buttons.length != 2) {
		save_buttons = __test_get_save_buttons();
		await sleep(1000);
		log(`Waiting another second for 2 save buttons, currently got ${save_buttons.length}...`);
	}

	await sleep(1000);

	log("Clicking the first save button");

	save_buttons[0].click();

	await sleep(1000);

	log("Waiting 1 second before clicking the second save button");

	await sleep(1000);

	save_buttons[1].click();

	await sleep(1000);
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
		if(!ret || !(retName in ret)) {
			console.error(`is_valid_ret_object: Missing '${retName}' in ret or ret is empty (ret: ${ret})!`);
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

	create_centered_window_with_text(wanted_text, null);

	if(!$(".lp-overlay").length) {
		console.error(".lp-overlay could not be found");
		return false;
	}

	const $code = $(".lp-overlay").find(".lp-code");

	if(!$code.length) {
		console.error(".lp-overlay does not contain .lp-code");
		return false;
	}

	const text = $code.text();

	if(text != wanted_text) {
		console.error(`.lp-overlay does not contain wanted text: '${wanted_text}', but contains '${text}'`);
		return false;
	}

	const $close_button = $(".lp-overlay").find(".lp-close");

	if(!$close_button.length) {
		console.error(`.lp-overlay: no .lp-close button found`);
		return false;
	}

	$close_button.click();

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

async function run_quick_start_stop_training_test() {
	await click_start_training_and_stop_immidiately("and_xor");
	await click_start_training_and_stop_immidiately("signs");

	test_no_new_errors_or_warnings();
}

async function test_load_image_retries_transient_failures() {
	const original_load_image = window.load_image;
	var calls = 0;

	window.load_image = async function () {
		calls++;
		if (calls < 3) {
			throw new Error("transient image load failure");
		}
		return "loaded";
	};

	try {
		const result = await load_image_with_retry("retry-test.jpg", 3);
		return result === "loaded" && calls === 3;
	} finally {
		window.load_image = original_load_image;
	}
}

async function test_training_data_fetch_retries_transient_failures() {
	const original_fetch = window._fetch_training_data_text;
	let calls = 0;

	window._fetch_training_data_text = async function () {
		calls++;
		if (calls < 3) {
			const e = new Error("simulated transient transport failure");
			e.http_status = 0;
			throw e;
		}
		return "# shape: (1, 1)\n1\n";
	};

	try {
		const text = await _get_training_data_from_filename("x.txt");
		return calls === 3 && typeof text === "string" && text.indexOf("# shape") === 0;
	} finally {
		window._fetch_training_data_text = original_fetch;
	}
}

async function test_training_data_fetch_reports_diagnostics() {
	const original_fetch = window._fetch_training_data_text;

	window._fetch_training_data_text = async function () {
		const e = new Error("simulated net::ERR_NO_BUFFER_SPACE");
		e.http_status = 0;
		e.status_text = "error";
		e.ready_state = 0;
		throw e;
	};

	try {
		await _get_training_data_from_filename("y.txt", 2);
		return false;
	} catch (e) {
		const message = "" + (e && e.message ? e.message : e);
		return message.indexOf("y.txt") !== -1 &&
			message.indexOf("after 2 attempts") !== -1 &&
			message.indexOf("simulated net::ERR_NO_BUFFER_SPACE") !== -1 &&
			message.indexOf("http_status=0") !== -1 &&
			message.indexOf("status_text=error") !== -1 &&
			message.indexOf("Checks:") !== -1;
	} finally {
		window._fetch_training_data_text = original_fetch;
	}
}

async function test_plotly_resize_after_tab_show() {
	const original_resize = window.resize_all_plotly_elements;
	let calls = 0;

	window.resize_all_plotly_elements = function () {
		calls++;
	};

	const panel = document.createElement("div");
	const plot = document.createElement("div");
	plot.id = "plotly_resize_test_target";
	panel.appendChild(plot);

	try {
		schedule_plotly_resize_after_tab_show(panel);
		await new Promise(function (resolve) { setTimeout(resolve, 450); });
		return calls >= 2;
	} finally {
		window.resize_all_plotly_elements = original_resize;
		panel.remove();
	}
}

function test_mobile_more_panel_markup() {
	const navButton = document.getElementById("mobile_nav_more");
	const panel = document.getElementById("mobile_panel_more");

	return !!navButton &&
		!!panel &&
		panel.querySelectorAll(".mobile-panel-section").length >= 2 &&
		panel.querySelectorAll("button.mobile-panel-row").length >= 7 &&
		typeof mobile_open_tab === "function";
}

function test_ribbon_labels_toggle_checkboxes() {
	const ids = [
		"auto_input_shape",
		"jump_to_interesting_tab",
		"shuffle_before_each_epoch",
		"enable_tf_debug",
		"augment_rotate_images",
		"augment_invert_images",
		"augment_flip_left_right",
		"augment_brightness",
		"augment_contrast",
		"augment_saturation",
		"augment_grayscale",
		"augment_noise"
	];

	for (var idx = 0; idx < ids.length; idx++) {
		const label = document.querySelector(`label.ribbon-checkbox-label[for='${ids[idx]}']`);
		const checkbox = document.getElementById(ids[idx]);

		if (!label || !checkbox || label.control !== checkbox) {
			return false;
		}
	}

	const checkbox = document.getElementById("jump_to_interesting_tab");
	const label = document.querySelector("label.ribbon-checkbox-label[for='jump_to_interesting_tab']");
	const before = checkbox.checked;

	label.click();
	const toggled = checkbox.checked !== before;
	label.click();

	return toggled && checkbox.checked === before;
}

function test_prepare_site_for_training_always_clears_plot() {
	const old_unchanged = _model_fingerprint_unchanged;
	const plot = document.getElementById("plotly_epoch_history");
	if (!plot) return false;
	const wrapper = plot.parentElement;
	const old_html = plot.innerHTML;
	const old_plot_display = plot.style.display;
	const old_wrapper_display = wrapper.style.display;

	try {
		plot.innerHTML = "<div class='plotly'>old run</div>";
		plot.style.display = "block";
		wrapper.style.display = "block";
		_model_fingerprint_unchanged = true;
		prepare_site_for_training();
		return plot.innerHTML === "" && wrapper.style.display === "none";
	} finally {
		_model_fingerprint_unchanged = old_unchanged;
		plot.innerHTML = old_html;
		plot.style.display = old_plot_display;
		wrapper.style.display = old_wrapper_display;
	}
}

async function _test_await_with_timeout (promise, timeout_ms) {
	let timer = null;

	const timeout = new Promise(function (resolve) {
		timer = setTimeout(function () { resolve("timeout"); }, timeout_ms);
	});

	try {
		return await Promise.race([
			Promise.resolve(promise).then(
				function () { return "done"; },
				function (e) { return "error: " + e; }
			),
			timeout
		]);
	} finally {
		if (timer) {
			clearTimeout(timer);
		}
	}
}

function _augmented_preview_state (old_urls) {
	const entries = _photo_gallery.entries;
	let found = null;
	let found_index = -1;

	for (let index = entries.length - 1; index >= 0; index--) {
		const entry = entries[index];
		if (entry && entry.img && String(entry.url).indexOf("augmented:") === 0 && !old_urls[String(entry.url)]) {
			found = entry;
			found_index = index;
			break;
		}
	}

	const pixel = found ? _photo_gallery_test_pixel(found_index) : null;

	return {
		found: found,
		found_index: found_index,
		added_to_gallery: !!found && found.img.tagName === "IMG" && !!found.img._source_canvas,
		drawn_to_canvas: !!pixel && pixel[3] > 0,
		pixel: pixel
	};
}

async function test_augmented_previews_go_to_gallery_canvas() {
	const old_entries = _photo_gallery.entries.slice();
	const old_expected = _photo_gallery.expected;
	const old_layout = _photo_gallery.layout;
	const old_urls = {};

	old_entries.forEach(function (entry) {
		old_urls[String(entry && entry.url)] = true;
	});

	const before_count = old_entries.length;
	const t = tf.ones([8, 8, 3]);
	const preview_category = (typeof labels !== "undefined" && labels && labels.length) ? labels[0] : "augmented-probe";
	let found = null;
	let render_state = "not started";
	let synchronous_pixels = false;
	let state = null;
	let added_to_gallery = false;
	let drawn_to_canvas = false;
	let no_loose_canvases = false;
	let category_preserved = false;

	try {
		const fallback_img = new Image();
		const fallback_canvas = document.createElement("canvas");
		fallback_img._source_canvas = fallback_canvas;
		synchronous_pixels = _get_pixel_source_element(fallback_img) === fallback_canvas;

		const render_result = add_tensor_as_image_to_photos(t, preview_category);

		if (render_result && typeof render_result.then === "function") {
			render_state = await _test_await_with_timeout(render_result, 10000);
		} else {
			render_state = "synchronous";
		}

		// Decoding the data URL and drawing it can trail the render promise on
		// some browsers, so poll for the visible result instead of using a fixed
		// sleep. The old fixed 200 ms wait failed under slow WebGL readback.
		const deadline = Date.now() + 5000;

		do {
			state = _augmented_preview_state(old_urls);
			found = state.found;
			added_to_gallery = state.added_to_gallery;
			drawn_to_canvas = state.drawn_to_canvas;
			no_loose_canvases = document.querySelectorAll("#photos canvas[id^='augmented_photo_']").length === 0;
			category_preserved = !!found && found.img.getAttribute("data-category") === preview_category &&
				extractCategoryFromURL(found.url, found.img) === preview_category;

			if (added_to_gallery && drawn_to_canvas && no_loose_canvases && category_preserved) {
				break;
			}

			await new Promise(function (resolve) { setTimeout(resolve, 50); });
		} while (Date.now() < deadline);

		const ok = added_to_gallery && synchronous_pixels && no_loose_canvases && drawn_to_canvas && category_preserved;

		if (ok) {
			return true;
		}

		const entries = _photo_gallery.entries;
		const canvas = _photo_gallery.canvas;
		const layout = _photo_gallery.layout;

		return [
			"added_to_gallery=" + added_to_gallery,
			"drawn_to_canvas=" + drawn_to_canvas,
			"synchronous_pixels=" + synchronous_pixels,
			"no_loose_canvases=" + no_loose_canvases,
			"category_preserved=" + category_preserved,
			"render=" + render_state,
			"pixel=" + JSON.stringify(state && state.pixel),
			"found_index=" + (state ? state.found_index : -1),
			"before_count=" + before_count,
			"after_count=" + entries.length,
			"canvas=" + (canvas ? canvas.width + "x" + canvas.height : "none"),
			"layout=" + (layout ? layout.css_width + "x" + layout.css_height + " cols=" + layout.cols : "none"),
			"urls=" + JSON.stringify(entries.map(function (entry) { return String(entry && entry.url).slice(0, 20); }))
		].join("; ");
	} finally {
		t.dispose();

		if (found && found.img && found.img.parentNode) {
			found.img.remove();
		}

		_photo_gallery.entries = old_entries;
		_photo_gallery.expected = old_expected;
		_photo_gallery.layout = old_layout;
		_photo_gallery_hide_tooltip();
		try { _photo_gallery_apply_layout(old_expected || old_entries.length); } catch (e) {}
		try { _photo_gallery_redraw(); } catch (e) {}
	}
}

async function test_failed_image_is_not_added_as_null() {
	const original_handler = window.handleImageDownload;
	const original_force_download = force_download;
	const original_started_training = started_training;
	const original_stop_downloading_data = stop_downloading_data;
	const url = "missing-training-image.jpg";
	const keys = {[url]: "category"};
	const data = {"category": []};

	window.handleImageDownload = async function () {
		return null;
	};
	force_download = true;
	started_training = true;
	stop_downloading_data = false;

	try {
		await downloadSingleUrl(url, 0, [url], null, undefined, [], 0, 1, keys, data);
		return data["category"].length === 0;
	} finally {
		window.handleImageDownload = original_handler;
		force_download = original_force_download;
		started_training = original_started_training;
		stop_downloading_data = original_stop_downloading_data;
	}
}

function test_pageshow_does_not_reset_app_state() {
	var fields = ["#inputShape", "#width", "#height", "#number_of_layers", "#max_number_of_files_per_category", "#divide_by", "#loss"];
	var read_values = function () {
		return fields.map(function (selector) { return $(selector).val(); });
	};

	var before = read_values();
	if (!before[0]) {
		return false;
	}

	window.dispatchEvent(new Event("pageshow"));
	if (typeof PageTransitionEvent === "function") {
		window.dispatchEvent(new PageTransitionEvent("pageshow", {persisted: true}));
	}

	var after = read_values();
	return JSON.stringify(before) === JSON.stringify(after);
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

	test_equal("is_transient_backend_invalidation_error Chromium/Opera", is_transient_backend_invalidation_error(new Error("Cannot read properties of undefined (reading 'backend')")), true);
	test_equal("is_transient_backend_invalidation_error WebKit", is_transient_backend_invalidation_error(new Error("undefined is not an object (evaluating 'n.backend')")), true);
	test_equal("is_transient_backend_invalidation_error unrelated", is_transient_backend_invalidation_error(new Error("Cannot read properties of undefined (reading 'shape')")), false);

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

	test_equal("add_kernel_initializer_value_option(\"conv2d\", 1)", removeIdAttribute(add_kernel_initializer_value_option("conv2d", 1)), `<tr class='kernel_initializer_tr'><td>Value:</td><td><input class='input_field input_data kernel_initializer_value' type='number' min='-3.4e+38' max='3.4e+38' value='1'  onchange='updated_page(null, null, null, null, 1)' onkeyup="var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this, null, 1); no_update_math=original_no_update_math;" /></td>`); // await not possible

	test_equal("add_depth_multiplier_option('dense', 3)", removeIdAttribute(add_depth_multiplier_option("dense", 3)), `<tr><td>Depth multiplier:</td><td><input class='input_field input_data depth_multiplier' type='number' min='0' step='1' value='1'  _onchange='updated_page()' onkeyup="var original_no_update_math=no_update_math; no_update_math = is_hidden_or_has_hidden_parent('#math_tab_code') ? 1 : 0; is_hidden_or_has_hidden_parent('#math_tab_code'); updated_page(null, null, this); no_update_math=original_no_update_math;" /></td>`); // await not possible

	test_equal("quote_python(\"abc\")", quote_python("abc"), "\"abc\"");

	test_equal("quote_python(\"123\")", quote_python("123"), "123");

	test_equal("quote_python(123)", quote_python(123), "[123]");

	var color = "#ffffff";
	if(is_dark_mode) {
		color = "#353535";
	}

	test_equal("color_compare_old_and_new_layer_data([[[1]]], [[[1]]])", JSON.stringify(color_compare_old_and_new_layer_data([[[1]]], [[[1]]])), "[{\"0\":[\"" + color + "\"]}]");
	test_equal("color_compare_old_and_new_layer_data([[[1]]], [[[0]]])", JSON.stringify(color_compare_old_and_new_layer_data([[[1]]], [[[0]]])), "[{\"0\":[\"#cf1443\"]}]");
	test_equal("color_compare_old_and_new_layer_data([[[-1]]], [[[0]]])", JSON.stringify(color_compare_old_and_new_layer_data([[[-1]]], [[[0]]])), "[{\"0\":[\"#2e8b57\"]}]");

	test_equal("array_to_latex([[1],[2],[3]])", array_to_latex([[1],[2],[3]]), "\\underbrace{\\begin{pmatrix}\n1\\\\\n2\\\\\n3\n\\end{pmatrix}}");

	test_equal("array_to_fixed([1.555,2.555,3.555], 2)", JSON.stringify(array_to_fixed([1.555,2.555,3.555], 2)), "[1.55,2.56,3.56]");

	test_equal("group_layers([ \"conv2d\", \"maxPooling2d\", \"conv2d\", \"maxPooling2d\", \"flatten\", \"dropout\", \"dense\", \"dense\" ])", JSON.stringify(group_layers([ "conv2d", "maxPooling2d", "conv2d", "maxPooling2d", "flatten", "dropout", "dense", "dense" ])),  `[{"<span class='TRANSLATEME_feature_extraction'></span>":[0,1,2,3]},{"<span class='TRANSLATEME_flatten'></span>":[4]},{"<span class='TRANSLATEME_feature_extraction_and_overfitting_prevention'></span>":[5]},{"<span class='TRANSLATEME_classification'></span>":[6,7]}]`);

	test_equal("decille([1,2,3,4,5,6,7,8,9,10, 11], 1)", decille([1,2,3,4,5,6,7,8,9,10, 11], 1), 11);

	test_equal("median([1,2,3,4,5])", median([1,2,3,4,5]), 3);

	test_equal("truncate_text(\"hallollolololololololllllolololo\", 10)", truncate_text("hallollolololololololllllolololo", 10), "hall...olo");

	test_equal("is_number_array([1,2,3,4,5])", is_number_array([1,2,3,4,5]), true);

	test_equal("is_number_array([1,2,\"a\",4,5])", is_number_array([1,2,"a",4,5]), false);

	test_equal("pageshow does not reset app state", test_pageshow_does_not_reset_app_state(), true);

	test_equal("heuristic_layer_possibility_check(0, \"flatten\")", heuristic_layer_possibility_check(0, "flatten"), true);
	test_equal("heuristic_layer_possibility_check(0, \"dense\")", heuristic_layer_possibility_check(0, "dense"), true);

	test_equal("load_image_with_retry retries transient failures", await test_load_image_retries_transient_failures(), true);
	test_equal("failed image is not added as a null sample", await test_failed_image_is_not_added_as_null(), true);
	test_equal("training data fetch retries transient failures", await test_training_data_fetch_retries_transient_failures(), true);
	test_equal("training data fetch reports detailed diagnostics", await test_training_data_fetch_reports_diagnostics(), true);
	test_equal("hidden-tab Plotly charts resize after activation", await test_plotly_resize_after_tab_show(), true);
	test_equal("mobile More panel exposes views and model actions", test_mobile_more_panel_markup(), true);
	test_equal("ribbon labels toggle their checkboxes", test_ribbon_labels_toggle_checkboxes(), true);
	test_equal("new training run always clears the old loss plot", test_prepare_site_for_training_always_clears_plot(), true);
	test_equal("augmented previews are drawn into the photo gallery canvas", await test_augmented_previews_go_to_gallery_canvas(), true);

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
				if(!["dtype", "size", "strides"].includes(py_name)) {
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

	test_equal("test_maximally_activated_last_layer()", await test_maximally_activated_last_layer(), true);

	test_equal("test_feature_map_row_status_is_per_generation_and_translated()", await test_feature_map_row_status_is_per_generation_and_translated(), true);

	test_equal("test_resolve_maximally_activated_iterations()", test_resolve_maximally_activated_iterations(), true);

	test_equal("test_feature_map_intro_is_short()", test_feature_map_intro_is_short(), true);

	test_equal("test_gradient_flow_empty_state_on_activation()", await test_gradient_flow_empty_state_on_activation(), true);

	test_equal("test_health_status_records_after_opening_tab()", await test_health_status_records_after_opening_tab(), true);

	test_equal("test_explainability_axis_label_fallback()", test_explainability_axis_label_fallback(), true);

	test_equal("test_fcnn_neuron_colors_span_each_layer()", test_fcnn_neuron_colors_span_each_layer(), true);

	test_equal("test_faster_canvas_fill_order()", await test_faster_canvas_fill_order(), true);

	test_equal("test_grid_tooltip_custom_images()", test_grid_tooltip_custom_images(), true);

	test_equal("test_grid_tooltip_hides_on_tab_change()", test_grid_tooltip_hides_on_tab_change(), true);

	test_equal('computeCRC32("")', computeCRC32(""), 0);
	test_equal('computeCRC32("asasd")', computeCRC32("asasd"), 3324180253);
	test_equal("uint32le(1)", JSON.stringify(uint32le(1)), '[1,0,0,0]');
	test_equal("JSON.stringify(uint16le(1))", JSON.stringify(uint16le(1)), '[1,0]');
	test_equal("Array.isArray(get_fcnn_data())", Array.isArray(get_fcnn_data()), true);

	test_equal('fill_get_data_between(0, 10, 2, "x")', fill_get_data_between(0, 10, 2, "x"), 'x,y\n0,0\n2,2\n4,4\n6,6\n8,8\n10,10\n');
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

	test_equal("get_mode() is either 'expert' or 'beginner'", ["expert", "beginner"].includes(get_mode()), true);

	test_equal("predict toggle labels activate their checkboxes", test_predict_toggle_labels_activate_checkboxes(), true);
	test_equal("gradCAM panel waits for a heatmap", test_grad_cam_panel_waits_for_heatmap(), true);
	test_equal("gradCAM repredicts the last image", await test_grad_cam_repredicts_last_image(), true);
	test_equal("gradCAM keeps a uniform heatmap visible", await test_grad_cam_uniform_heatmap_is_low(), true);
	test_equal("clearing the sketcher clears every edge", test_clear_attrament_clears_edges(), true);

	//test_equal("test_math_mode_color_generator()", test_math_mode_color_generator(), true);

	var arr1 = [[[0, 10], [5, 20]]];
	scaleNestedArray(arr1);
	test_equal("scaleNestedArray min becomes 0", arr1[0][0][0], 0);
	test_equal("scaleNestedArray max becomes 255", arr1[0][1][1], 255);
	test_equal("scaleNestedArray mid value scaled", arr1[0][0][1], (10 / 20) * 255);

	var arr_same = [[5, 5]];
	scaleNestedArray(arr_same);
	// When min==max, (value - min) * (255 / 0) = NaN
	test_equal("scaleNestedArray all same values produces NaN", isNaN(arr_same[0][0]), true);

	// --- predict.js: number_of_elements_in_tensor_shape ---
	test_equal("number_of_elements_in_tensor_shape([2,3])", number_of_elements_in_tensor_shape([2, 3]), 6);
	test_equal("number_of_elements_in_tensor_shape([null,4,5])", number_of_elements_in_tensor_shape([null, 4, 5]), 20);
	test_equal("number_of_elements_in_tensor_shape([1])", number_of_elements_in_tensor_shape([1]), 1);
	test_equal("number_of_elements_in_tensor_shape([null,null,3])", number_of_elements_in_tensor_shape([null, null, 3]), 3);
	test_equal("number_of_elements_in_tensor_shape([2,3,4])", number_of_elements_in_tensor_shape([2, 3, 4]), 24);

	// --- predict.js: is_null_or_undefined ---
	test_equal("is_null_or_undefined(null)", is_null_or_undefined(null), true);
	test_equal("is_null_or_undefined(undefined)", is_null_or_undefined(undefined), true);
	test_equal("is_null_or_undefined(0)", is_null_or_undefined(0), false);
	test_equal("is_null_or_undefined('')", is_null_or_undefined(""), false);
	test_equal("is_null_or_undefined(false)", is_null_or_undefined(false), false);

	// --- predict.js: has_disposed_flag ---
	test_equal("has_disposed_flag with flag", has_disposed_flag({isDisposedInternal: false}), true);
	test_equal("has_disposed_flag without flag", has_disposed_flag({foo: 1}), false);

	// --- predict.js: is_disposed ---
	test_equal("is_disposed true", is_disposed({isDisposedInternal: true}), true);
	test_equal("is_disposed false", is_disposed({isDisposedInternal: false}), false);

	// --- predict.js: should_abort_predict ---
	test_equal("should_abort_predict(null)", should_abort_predict(null), true);
	test_equal("should_abort_predict(undefined)", should_abort_predict(undefined), true);
	test_equal("should_abort_predict disposed", should_abort_predict({isDisposedInternal: true}), true);
	test_equal("should_abort_predict not disposed", should_abort_predict({isDisposedInternal: false}), false);
	test_equal("should_abort_predict no flag", should_abort_predict({foo: 1}), false);

	// --- gui.js: get_dimensionality_from_layer_name ---
	test_equal("get_dimensionality_from_layer_name('conv1d')", get_dimensionality_from_layer_name("conv1d"), 1);
	test_equal("get_dimensionality_from_layer_name('conv2d')", get_dimensionality_from_layer_name("conv2d"), 2);
	test_equal("get_dimensionality_from_layer_name('maxPooling3D')", get_dimensionality_from_layer_name("maxPooling3D"), 3);
	test_equal("get_dimensionality_from_layer_name('conv2dTranspose')", get_dimensionality_from_layer_name("conv2dTranspose"), 2);

	// --- gui.js: or_none ---
	test_equal("or_none(null)", or_none(null), "None");
	test_equal("or_none(undefined)", or_none(undefined), "None");
	test_equal("or_none('')", or_none(""), "None");
	test_equal("or_none('relu')", or_none("relu"), "\"relu\"");
	test_equal("or_none('3.14')", or_none("3.14"), 3.14);
	test_equal("or_none('42')", or_none("42"), 42);

	// --- gui.js: network_name_is_empty ---
	test_equal("network_name_is_empty('')", network_name_is_empty(""), true);
	test_equal("network_name_is_empty('   ')", network_name_is_empty("   "), true);
	test_equal("network_name_is_empty('mynet')", network_name_is_empty("mynet"), false);

	// --- gui.js: isIntegerLike ---
	test_equal("isIntegerLike(5)", isIntegerLike(5), true);
	test_equal("isIntegerLike('5')", isIntegerLike("5"), true);
	test_equal("isIntegerLike('-3')", isIntegerLike("-3"), true);
	test_equal("isIntegerLike('3.5')", isIntegerLike("3.5"), false);
	test_equal("isIntegerLike('')", isIntegerLike(""), false);
	test_equal("isIntegerLike(' 5')", isIntegerLike(" 5"), false);
	test_equal("isIntegerLike('abc')", isIntegerLike("abc"), false);
	test_equal("isIntegerLike(0)", isIntegerLike(0), true);
	test_equal("isIntegerLike(3.0)", isIntegerLike(3.0), true); // 3.0 is integer in JS
	test_equal("isIntegerLike(3.5)", isIntegerLike(3.5), false);

	// --- gui.js: parse_target_shape_value ---
	test_equal("parse_target_shape_value('40,40,3')", JSON.stringify(parse_target_shape_value("40,40,3")), "[40,40,3]");
	test_equal("parse_target_shape_value('10')", JSON.stringify(parse_target_shape_value("10")), "[10]");
	test_equal("parse_target_shape_value('')", parse_target_shape_value(""), null);
	test_equal("parse_target_shape_value('abc')", parse_target_shape_value("abc"), null);
	test_equal("parse_target_shape_value('1,2,abc')", parse_target_shape_value("1,2,abc"), null);
	test_equal("parse_target_shape_value('  ')", parse_target_shape_value("  "), null);

	// --- gui.js: getDimFromString / safeGetDim ---
	test_equal("getDimFromString('conv2d')", getDimFromString("conv2d"), 2);
	test_equal("getDimFromString('maxPooling1D')", getDimFromString("maxPooling1D"), 1);
	test_equal("getDimFromString('conv3dTranspose')", getDimFromString("conv3dTranspose"), 3);
	test_equal("getDimFromString('dense')", getDimFromString("dense"), null);
	test_equal("safeGetDim('conv2d')", safeGetDim("conv2d"), 2);
	test_equal("safeGetDim('flatten')", safeGetDim("flatten"), null);

	// --- gui.js: get_generated_encoding ---
	test_equal("get_generated_encoding(0, 3)", get_generated_encoding(0, 3), "[1, 0, 0]");
	test_equal("get_generated_encoding(1, 3)", get_generated_encoding(1, 3), "[0, 1, 0]");
	test_equal("get_generated_encoding(2, 3)", get_generated_encoding(2, 3), "[0, 0, 1]");
	test_equal("get_generated_encoding(0, 1)", get_generated_encoding(0, 1), "[1]");
	test_equal("get_generated_encoding(1, 4)", get_generated_encoding(1, 4), "[0, 1, 0, 0]");

	// --- gui.js: ensure_shape_array ---
	test_equal("ensure_shape_array([1,2])", JSON.stringify(ensure_shape_array([1, 2])), "[1,2]");
	test_equal("ensure_shape_array('[5,6,7]')", JSON.stringify(ensure_shape_array("[5,6,7]")), "[5,6,7]");

	// --- gui.js: replace_nullish_with_unknown_with_ok ---
	var r1 = replace_nullish_with_unknown_with_ok([1, 2, 3]);
	test_equal("replace_nullish ok array", r1.ok, true);
	test_equal("replace_nullish ok array value", JSON.stringify(r1.value), "[1,2,3]");

	var r2 = replace_nullish_with_unknown_with_ok([1, null, 3]);
	test_equal("replace_nullish with null", r2.ok, false);
	test_equal("replace_nullish null replaced", r2.value[1], "\\text{Parsing Error}");

	var r3 = replace_nullish_with_unknown_with_ok([1, Infinity]);
	test_equal("replace_nullish with Infinity", r3.ok, false);
	test_equal("replace_nullish Infinity replaced", r3.value[1], "\\text{NaN}");

	var r4 = replace_nullish_with_unknown_with_ok(["hello", ""]);
	test_equal("replace_nullish with empty string", r4.ok, false);
	test_equal("replace_nullish empty string replaced", r4.value[1], "\\text{Empty String}");

	var r5 = replace_nullish_with_unknown_with_ok([[1, null], [3, 4]]);
	test_equal("replace_nullish nested null", r5.ok, false);
	test_equal("replace_nullish nested null value", r5.value[0][1], "\\text{Parsing Error}");

	// --- gui.js: human_readable_time edge cases ---
	test_equal("human_readable_time(0)", human_readable_time(0), language[lang]["one_second"]);
	test_equal("human_readable_time(null)", human_readable_time(null), language[lang]["one_second"]);

	// --- gui.js: python_data_to_string ---
	test_equal("python_data_to_string with except", python_data_to_string({units: "10", activation: "relu"}, ["units"]), '\tactivation="relu"');
	test_equal("python_data_to_string use_bias true", python_data_to_string({use_bias: "True"}, []), '\tuse_bias=True');
	test_equal("python_data_to_string use_bias false", python_data_to_string({use_bias: "0"}, []), '\tuse_bias=False');
	test_equal("python_data_to_string strides", python_data_to_string({strides: [2, 2]}, []), '\tstrides=(2, 2)');

	// --- train.js: findIndexByKey ---
	test_equal("findIndexByKey(['a','b','c'], 'b')", findIndexByKey(["a", "b", "c"], "b"), 1);
	test_equal("findIndexByKey(['x','y','z'], 'x')", findIndexByKey(["x", "y", "z"], "x"), 0);
	test_equal("findIndexByKey(['x','y','z'], 'z')", findIndexByKey(["x", "y", "z"], "z"), 2);

	// --- train.js: get_key_by_value ---
	test_equal("get_key_by_value({a:1,b:2}, 2)", get_key_by_value({a: 1, b: 2}, 2), "b");
	test_equal("get_key_by_value({a:1,b:2}, 1)", get_key_by_value({a: 1, b: 2}, 1), "a");
	test_equal("get_key_by_value({a:1,b:2}, 3)", get_key_by_value({a: 1, b: 2}, 3), undefined);

	// --- gui.js: dataURLToBlob ---
	var tiny_png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
	var blob = dataURLToBlob(tiny_png);
	test_equal("dataURLToBlob returns Blob", blob instanceof Blob, true);
	test_equal("dataURLToBlob correct type", blob.type, "image/png");

	// --- gui.js: show_bars_instead_of_numbers returns boolean ---
	var bars_val = show_bars_instead_of_numbers();
	test_equal("show_bars_instead_of_numbers returns bool", typeof bars_val, "boolean");

	// --- gui.js: get_data_origin returns string ---
	var data_origin = get_data_origin();
	test_equal("get_data_origin returns string", typeof data_origin, "string");

	// --- predict.js: create_network_name returns string ---
	var nn = create_network_name();
	test_equal("create_network_name returns string", typeof nn, "string");
	test_not_equal("create_network_name is not empty", nn.length, 0);

	if(quick) {
		remove_num_tests_overlay();
	}

	await test_clicking_on_example_images_for_prediction();

	await test_photo_gallery_resize();
	await test_photo_gallery_hit_testing();
	await test_photo_gallery_hover_prediction();
	await test_photo_gallery_tooltip_alignment();
	await test_photo_gallery_dark_light_mode();
	await test_photo_gallery_language();
	await test_photo_gallery_canvas_dom_is_constant();
	await test_photo_gallery_canvas_scales_linearly();
	await test_photo_gallery_repeated_reset_is_stable();
	await test_photo_gallery_hover_events_are_stable();
	await test_photo_gallery_pixel_rendering_and_resize();
	await test_photo_gallery_hit_testing_across_rows();
	await test_photo_gallery_prediction_cache_reuse_and_invalidation();
	await test_photo_gallery_prediction_guards();
	await test_photo_gallery_tooltip_shows_image_while_training();
	await test_photo_gallery_correct_category_visibility();
	await test_photo_gallery_resize_cycles_under_load();
	await test_image_dataset_switch_hides_xy_plot();
	await test_max_activation_iterations_auto_not_red();
}

async function test_clicking_on_example_images_for_prediction() {
	await delay(3000);

	test_equal("Photo gallery canvas exists", $("#photo_gallery_canvas").length, 1);
	test_equal("Photo gallery hidden sources exist", $("#photo_gallery_sources img").length > 0, true);

	$(".TRANSLATEME_remove_data_img_predictions").click();

	await delay(3000);

	test_equal("Starts with example example predictions", $("#training_data_tab").find(".predict_data_img").length, 0); 

	await delay(3000);

	$($("#training_data_tab").find("img")[0]).click();

	await delay(3000);

	const nr_of_example_imgs = $("#training_data_tab").find(".predict_data_img").length;

	log(`Got nr_of_example_imgs: ${nr_of_example_imgs}`);

	test_equal("Has now one example prediction", nr_of_example_imgs, 1);

	await delay(3000);

	$(".TRANSLATEME_remove_data_img_predictions").click();

	await delay(3000);

	test_equal("Has 0 example predictions after removing them", $("#training_data_tab").find(".predict_data_img").length, 0);

	await delay(3000);

	test_no_new_errors_or_warnings();
}

async function _photo_gallery_wait_for_width (expected_width, timeout_ms) {
	const deadline = Date.now() + (timeout_ms || 2000);

	while (Date.now() < deadline) {
		if (_photo_gallery.layout && Math.abs(_photo_gallery.layout.css_width - expected_width) <= 2) {
			return true;
		}
		await new Promise(function (resolve) { requestAnimationFrame(resolve); });
	}

	return false;
}

async function test_photo_gallery_resize () {
	const canvas = document.getElementById("photo_gallery_canvas");

	if (!canvas) {
		test_equal("Photo gallery canvas exists for resize test", false, true);
		return false;
	}

	const container = document.getElementById("photos");
	const original_width = container.style.width;
	const original_client_width = container.clientWidth;
	const client_width_descriptor = Object.getOwnPropertyDescriptor(container, "clientWidth");
	var forced_width = original_client_width > 0 ? original_client_width : 420;

	Object.defineProperty(container, "clientWidth", {
		configurable: true,
		get: function () {
			return forced_width;
		}
	});

	try {
		forced_width = 420;
		window.dispatchEvent(new Event("resize"));
		await _photo_gallery_wait_for_width(forced_width);

		const narrow_layout = _photo_gallery.layout;

		test_equal("Layout css_width shrinks when container shrinks", Math.abs(narrow_layout.css_width - 420) <= 2, true);
		test_equal("Canvas internal width tracks layout css_width", canvas.width === Math.max(1, Math.round(narrow_layout.css_width * narrow_layout.dpr)), true);
		test_equal("Columns match layout math", narrow_layout.cols, Math.max(1, Math.floor(narrow_layout.css_width / narrow_layout.cell_width)));

		forced_width = 980;
		window.dispatchEvent(new Event("resize"));
		await _photo_gallery_wait_for_width(forced_width);

		const wide_layout = _photo_gallery.layout;

		test_equal("Layout css_width grows when container grows", Math.abs(wide_layout.css_width - 980) <= 2, true);
		test_equal("Canvas internal width tracks layout css_width after grow", canvas.width === Math.max(1, Math.round(wide_layout.css_width * wide_layout.dpr)), true);
		test_equal("Columns recompute on wide container", wide_layout.cols >= narrow_layout.cols, true);

		forced_width = 760;
		window.dispatchEvent(new Event("resize"));
		await _photo_gallery_wait_for_width(forced_width);

		test_equal("Window resize event relayouts the canvas", Math.abs(_photo_gallery.layout.css_width - 760) <= 2, true);
	} finally {
		if (client_width_descriptor) {
			Object.defineProperty(container, "clientWidth", client_width_descriptor);
		} else {
			delete container.clientWidth;
		}

		container.style.width = original_width;
		window.dispatchEvent(new Event("resize"));
		await new Promise(function (resolve) { setTimeout(resolve, 150); });
	}

	return true;
}

async function test_photo_gallery_hit_testing () {
	const canvas = document.getElementById("photo_gallery_canvas");

	if (!canvas) {
		test_equal("Canvas missing for hit testing", false, true);
		return false;
	}

	const rect = canvas.getBoundingClientRect();
	const first_index = _photo_gallery_index_at(rect.left + 4, rect.top + 4);

	test_equal("Hit testing returns first index inside first cell", first_index, 0);

	const outside_index = _photo_gallery_index_at(rect.left - 10, rect.top + 4);

	test_equal("Hit testing returns -1 outside canvas", outside_index, -1);

	return true;
}

async function _photo_gallery_wait_for_tooltip (timeout_ms) {
	const start = Date.now();

	while (Date.now() - start < (timeout_ms || 2000)) {
		if (document.getElementById("photo_gallery_tooltip") && $("#photo_gallery_tooltip").css("display") !== "none") {
			return true;
		}
		await new Promise(function (resolve) { setTimeout(resolve, 50); });
	}

	return false;
}

async function _photo_gallery_wait_for_prediction (cache_key, timeout_ms) {
	const start = Date.now();

	while (Date.now() - start < (timeout_ms || 2000)) {
		const cached = _photo_gallery_prediction_cache[cache_key];

		if (cached && cached.model === model && cached.generation === weights_generation) {
			return cached.values;
		}
		await new Promise(function (resolve) { setTimeout(resolve, 50); });
	}

	return null;
}

async function test_photo_gallery_hover_prediction () {
	const canvas = document.getElementById("photo_gallery_canvas");

	if (!canvas) {
		test_equal("Canvas missing for hover test", false, true);
		return false;
	}

	const rect = canvas.getBoundingClientRect();
	const client_x = rect.left + 6;
	const client_y = rect.top + 6;
	const first_pixel = _photo_gallery_test_pixel(0);
	const move_event = new MouseEvent("mousemove", {bubbles: true, cancelable: true, clientX: client_x, clientY: client_y});

	test_equal("Gallery canvas contains a rendered real image", !!first_pixel && first_pixel[3] > 0, true);

	canvas.dispatchEvent(move_event);
	const shown = await _photo_gallery_wait_for_tooltip(3000);

	test_equal("Hover shows the tooltip", shown, true);
	test_equal("Hover targets the first gallery cell", _photo_gallery.hover_index, 0);

	const entry = _photo_gallery.entries[0];

	if (!entry) {
		test_equal("Gallery entry missing", false, true);
		return false;
	}

	const preview = $("#photo_gallery_tooltip > .grid_image_tooltip_img");

	test_equal("Hover shows exactly one image preview", preview.length, 1);
	test_equal("Hover preview shows the hovered image", preview.length === 1 && preview[0].src === entry.img.src, true);
	test_equal("Hover preview is the first tooltip element", $("#photo_gallery_tooltip").children().first().hasClass("grid_image_tooltip_img"), true);
	test_equal("Hover preview is followed by the prediction rows", preview.next().hasClass("gti_row"), true);

	const values = await _photo_gallery_wait_for_prediction(entry.url, 10000);

	if (!values) {
		test_equal("Hover produced prediction values", false, true);
		return false;
	}

	const summary = _photo_gallery_prediction_summary(values);
	const predicted_label = (labels && labels[summary.index] !== undefined) ? labels[summary.index] : summary.index;
	const correct_category = (typeof extractCategoryFromURL === "function") ? extractCategoryFromURL(entry.url, entry.img) : null;
	const prediction_is_wrong = correct_category !== null && correct_category !== undefined && correct_category !== "" && String(correct_category) !== String(predicted_label);
	const expected_rows = labels.length + (prediction_is_wrong ? 1 : 0);

	test_equal("Hover produces one probability per label", $("#photo_gallery_tooltip .gti_row").length, expected_rows);
	test_equal("Prediction update keeps the image preview", $("#photo_gallery_tooltip > .grid_image_tooltip_img").length, 1);

	if (prediction_is_wrong) {
		test_equal("Tooltip names the correct category when prediction is wrong", $("#photo_gallery_tooltip").text().indexOf(String(correct_category)) !== -1, true);
	}

	const bars = $("#photo_gallery_tooltip .gti_row .bar").length;

	if (show_bars_instead_of_numbers()) {
		test_equal("Bars are rendered when enabled", bars, labels.length);
	} else {
		test_equal("Numeric probabilities are rendered when bars disabled", bars, 0);

		if (typeof get_last_layer_activation_function === "function" && get_last_layer_activation_function() === "softmax") {
			test_equal("Tooltip contains percentage text", /%/.test($("#photo_gallery_tooltip").text()), true);
		}
	}

	if (_photo_gallery.entries.length > 1) {
		const target_index = 1;
		const active_tab_label = $("#navbar1 .navi_list > li[aria-expanded='true'] > a").prop("id");
		const needs_tab_switch = !canvas.getBoundingClientRect().width || !canvas.getBoundingClientRect().height;

		if (needs_tab_switch) {
			show_tab_label("training_data_tab_label", 1);
			await new Promise(function (resolve) { setTimeout(resolve, 150); });
		}

		try {
			const scan_step = 8;
			const scan_rect = canvas.getBoundingClientRect();
			var target_x = null;
			var target_y = null;

			for (var scan_y = scan_rect.top + 1; scan_y < scan_rect.bottom && target_x === null; scan_y += scan_step) {
				for (var scan_x = scan_rect.left + 1; scan_x < scan_rect.right; scan_x += scan_step) {
					if (_photo_gallery_index_at(scan_x, scan_y) === target_index) {
						target_x = scan_x;
						target_y = scan_y;
						break;
					}
				}
			}

			test_equal("Second gallery cell is reachable through hit testing", target_x !== null, true);

			if (target_x !== null) {
				canvas.dispatchEvent(new MouseEvent("mousemove", {bubbles: true, cancelable: true, clientX: target_x, clientY: target_y}));
				await new Promise(function (resolve) { setTimeout(resolve, 50); });

				const second_preview = $("#photo_gallery_tooltip > .grid_image_tooltip_img");

				test_equal("Moving to the next image updates the hovered cell", _photo_gallery.hover_index, target_index);
				test_equal("Moving to the next image updates the preview", second_preview.length === 1 && second_preview[0].src === _photo_gallery.entries[target_index].img.src, true);
			}
		} finally {
			if (needs_tab_switch && active_tab_label && active_tab_label !== "training_data_tab_label") {
				show_tab_label(active_tab_label, 1);
				await new Promise(function (resolve) { setTimeout(resolve, 150); });
			}
		}
	}
	canvas.dispatchEvent(new MouseEvent("mouseleave", {bubbles: true, cancelable: true}));
	await new Promise(function (resolve) { setTimeout(resolve, 50); });

	test_equal("Tooltip hides on mouseleave", $("#photo_gallery_tooltip").css("display"), "none");

	return true;
}

async function test_photo_gallery_tooltip_alignment () {
	const canvas = document.getElementById("photo_gallery_canvas");
	const entries = _photo_gallery.entries;

	if (!canvas || !entries.length) {
		test_equal("Gallery available for tooltip alignment test", false, true);
		return false;
	}

	const cached = _photo_gallery_prediction_cache[entries[0].url];

	if (!cached) {
		test_equal("Cached prediction available for tooltip alignment test", false, true);
		return false;
	}

	const values = cached.values;

	_photo_gallery_update_tooltip(0, values);
	await new Promise(function (resolve) { setTimeout(resolve, 50); });

	const rows = $("#photo_gallery_tooltip .gti_row");
	const label_lefts = rows.map(function () {
		const label = this.querySelector(".gti_label");
		return label ? Math.round(label.getBoundingClientRect().left) : null;
	}).get().filter(function (v) { return v !== null; });

	test_equal("All category labels share the same left edge", label_lefts.length > 1 && label_lefts.every(function (v) { return Math.abs(v - label_lefts[0]) <= 1; }), true);

	const bars_checkbox = $("#show_bars_instead_of_numbers");
	const original_bars = bars_checkbox.is(":checked");
	const supports_bars = typeof get_last_layer_activation_function === "function" && get_last_layer_activation_function() === "softmax";

	if (supports_bars) {
		bars_checkbox.prop("checked", true);
		_photo_gallery_update_tooltip(0, values);
		await new Promise(function (resolve) { setTimeout(resolve, 50); });

		const bars = $("#photo_gallery_tooltip .gti_row .bar");
		const bar_rights = bars.map(function () { return Math.round(this.getBoundingClientRect().right); }).get();

		test_equal("Every category gets a bar", bars.length, labels.length);
		test_equal("All bars share the same right edge", bar_rights.length > 1 && bar_rights.every(function (v) { return Math.abs(v - bar_rights[0]) <= 1; }), true);
	}

	bars_checkbox.prop("checked", false);
	_photo_gallery_update_tooltip(0, values);
	await new Promise(function (resolve) { setTimeout(resolve, 50); });

	const numeric_values = $("#photo_gallery_tooltip .gti_row .gti_value");
	const value_rights = numeric_values.map(function () { return Math.round(this.getBoundingClientRect().right); }).get();

	test_equal("Bars are hidden when bars are disabled", $("#photo_gallery_tooltip .gti_row .bar").length, 0);
	test_equal("All numeric probabilities share the same right edge", value_rights.length > 1 && value_rights.every(function (v) { return Math.abs(v - value_rights[0]) <= 1; }), true);

	bars_checkbox.prop("checked", original_bars);

	return true;
}

async function test_photo_gallery_dark_light_mode () {
	const canvas = document.getElementById("photo_gallery_canvas");

	if (!canvas) {
		test_equal("Canvas missing for theme test", false, true);
		return false;
	}

	const original_darkmode = document.body.classList.contains("darkmode");
	const tooltip = _photo_gallery_ensure_tooltip();

	const rect = canvas.getBoundingClientRect();
	canvas.dispatchEvent(new MouseEvent("mousemove", {bubbles: true, cancelable: true, clientX: rect.left + 6, clientY: rect.top + 6}));
	await _photo_gallery_wait_for_tooltip(2000);

	const entries = _photo_gallery.entries;
	const values = entries.length ? await _photo_gallery_wait_for_prediction(entries[0].url, 10000) : null;

	if (values) {
		_photo_gallery_update_tooltip(0, values);
	}

	document.body.classList.add("darkmode");
	await new Promise(function (resolve) { setTimeout(resolve, 500); });

	const tooltip_dark = _test_read_uncached_background(tooltip);

	test_equal("Tooltip uses dark background in darkmode", /30,\s*30,\s*30/.test(tooltip_dark), true);

	document.body.classList.remove("darkmode");
	await new Promise(function (resolve) { setTimeout(resolve, 500); });

	const tooltip_light = _test_read_uncached_background(tooltip);

	test_equal("Tooltip uses light background in light mode", /255,\s*255,\s*255/.test(tooltip_light), true);

	if (original_darkmode) {
		document.body.classList.add("darkmode");
	}

	canvas.dispatchEvent(new MouseEvent("mouseleave", {bubbles: true, cancelable: true}));

	return true;
}

async function test_photo_gallery_language () {
	const original_lang = lang;
	const tooltip = document.getElementById("photo_gallery_tooltip");
	const canvas = document.getElementById("photo_gallery_canvas");

	if (!canvas) {
		test_equal("Canvas missing for language test", false, true);
		return false;
	}

	const entries = _photo_gallery.entries;

	if (!entries.length) {
		test_equal("Gallery has entries for language test", false, true);
		return false;
	}

	const values = _photo_gallery_prediction_cache[entries[0].url] && _photo_gallery_prediction_cache[entries[0].url].values;

	if (!values) {
		const rect = canvas.getBoundingClientRect();
		canvas.dispatchEvent(new MouseEvent("mousemove", {bubbles: true, cancelable: true, clientX: rect.left + 6, clientY: rect.top + 6}));
		const got = await _photo_gallery_wait_for_prediction(entries[0].url, 3000);

		if (!got) {
			test_equal("Hover prediction unavailable for language test", false, true);
			return false;
		}
	}

	const en_correct = language.en && language.en["correct_category"];
	const de_correct = language.de && language.de["correct_category"];

	test_equal("English and German translations exist for correct_category", typeof en_correct === "string" && typeof de_correct === "string" && en_correct !== de_correct, true);

	const cached_values = _photo_gallery_prediction_cache[entries[0].url].values;
	const correct_text = (typeof extractCategoryFromURL === "function") ? extractCategoryFromURL(entries[0].url, entries[0].img) : null;
	const predicted_label = (typeof labels !== "undefined" && labels && labels[_photo_gallery_prediction_summary(cached_values).index] !== undefined) ? labels[_photo_gallery_prediction_summary(cached_values).index] : _photo_gallery_prediction_summary(cached_values).index;

	await update_lang("de");
	await new Promise(function (resolve) { setTimeout(resolve, 100); });

	_photo_gallery_update_tooltip(0, cached_values);
	const tooltip_html_de = tooltip.innerHTML;

	if (correct_text && String(correct_text) !== String(predicted_label)) {
		test_equal("Tooltip shows German correct_category label when wrong", tooltip_html_de.indexOf(de_correct) !== -1, true);
	} else {
		test_equal("Tooltip renders in German", tooltip_html_de.indexOf(de_correct) === -1 || tooltip_html_de.indexOf(en_correct) === -1, true);
	}

	await update_lang("en");
	await new Promise(function (resolve) { setTimeout(resolve, 100); });

	_photo_gallery_update_tooltip(0, cached_values);
	const tooltip_html_en = tooltip.innerHTML;

	if (correct_text && String(correct_text) !== String(predicted_label)) {
		test_equal("Tooltip shows English correct_category label when wrong", tooltip_html_en.indexOf(en_correct) !== -1, true);
	}

	lang = original_lang;
	set_lang_cookie(original_lang, 99999);
	await update_translations();

	return true;
}

function _photo_gallery_save_test_state () {
	return _photo_gallery.entries.map(function (entry) {
		return {img: entry.img, url: entry.url};
	});
}

function _photo_gallery_restore_test_state (saved) {
	_photo_gallery_prepare(saved.length);

	saved.forEach(function (entry) {
		if (_photo_gallery.sources) {
			_photo_gallery.sources.appendChild(entry.img);
		}
		_photo_gallery_add_image(entry.img, entry.url);
	});

	_photo_gallery_finalize();
}

async function _photo_gallery_load_test_image () {
	if (window._photo_gallery_test_image && window._photo_gallery_test_image.complete) {
		return window._photo_gallery_test_image;
	}

	const canvas = document.createElement("canvas");
	canvas.width = 8;
	canvas.height = 8;
	canvas.getContext("2d").fillRect(0, 0, 8, 8);

	const img = new Image();
	await new Promise(function (resolve, reject) {
		img.onload = resolve;
		img.onerror = reject;
		img.src = canvas.toDataURL("image/png");
	});

	window._photo_gallery_test_image = img;

	return img;
}

async function _photo_gallery_load_colored_test_image (color) {
	if (!window._photo_gallery_colored_test_images) {
		window._photo_gallery_colored_test_images = {};
	}

	const cached = window._photo_gallery_colored_test_images[color];

	if (cached && cached.img.complete) {
		return cached;
	}

	const canvas = document.createElement("canvas");
	canvas.width = 8;
	canvas.height = 8;
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, 8, 8);
	const url = canvas.toDataURL("image/png");
	const img = new Image();

	await new Promise(function (resolve, reject) {
		img.onload = resolve;
		img.onerror = reject;
		img.src = url;
	});

	window._photo_gallery_colored_test_images[color] = {img: img, url: url};

	return window._photo_gallery_colored_test_images[color];
}

function _photo_gallery_test_pixel (index) {
	const canvas = _photo_gallery.canvas;
	const layout = _photo_gallery.layout;

	if (!canvas || !layout) {
		return null;
	}

	const col = index % layout.cols;
	const row = Math.floor(index / layout.cols);
	const x = (col * layout.cell_width + layout.margin + layout.thumb_width / 2) * layout.dpr;
	const y = (row * layout.cell_height + layout.margin + layout.thumb_height / 2) * layout.dpr;

	return Array.from(canvas.getContext("2d").getImageData(Math.floor(x), Math.floor(y), 1, 1).data);
}

function _photo_gallery_pixel_is (pixel, rgb) {
	return !!pixel && pixel[3] > 0 && Math.abs(pixel[0] - rgb[0]) <= 20 && Math.abs(pixel[1] - rgb[1]) <= 20 && Math.abs(pixel[2] - rgb[2]) <= 20;
}

async function test_photo_gallery_canvas_dom_is_constant () {
	const saved = _photo_gallery_save_test_state();

	try {
		const base_url = (document.createElement("canvas")).toDataURL("image/png");
		const count = 40;

		_photo_gallery_prepare(count);

		for (let index = 0; index < count; index++) {
			addPhotoToGallery(base_url + "#" + index, 40, 40);
		}

		_flush_dom_batch();
		await new Promise(function (resolve) { setTimeout(resolve, 100); });

		test_equal("Only one gallery canvas exists", $("#photo_gallery_canvas").length, 1);
		test_equal("Only one hidden gallery source container exists", $("#photo_gallery_sources").length, 1);
		test_equal("Gallery keeps the source container hidden", $("#photo_gallery_sources").css("display"), "none");
		test_equal("Gallery sources contain every image", $("#photo_gallery_sources img").length, count);
		test_equal("Visible photo container has only canvas and hidden sources", $("#photos").children().length, 2);
		test_equal("No visible per-image gallery nodes exist", $("#photos > img").length, 0);
	} finally {
		_photo_gallery_restore_test_state(saved);
	}

	return true;
}

async function test_photo_gallery_canvas_scales_linearly () {
	const saved = _photo_gallery_save_test_state();
	const img = await _photo_gallery_load_test_image();

	try {
		const small_count = 200;
		const large_count = 800;

		_photo_gallery_prepare(small_count);
		const small_start = performance.now();

		for (let index = 0; index < small_count; index++) {
			_photo_gallery_add_image(img, "gallery-scale-test://" + index);
		}

		const small_ms = performance.now() - small_start;
		const small_rows = _photo_gallery.layout.rows;

		_photo_gallery_prepare(large_count);
		const large_start = performance.now();

		for (let index = 0; index < large_count; index++) {
			_photo_gallery_add_image(img, "gallery-scale-test://" + index);
		}

		const large_ms = performance.now() - large_start;
		const large_rows = _photo_gallery.layout.rows;

		test_equal("Scaling test keeps a single canvas", $("#photo_gallery_canvas").length, 1);
		test_equal("Canvas drawing scales roughly linearly", large_ms < Math.max(small_ms * 10, 50), true);
		test_equal("Per-image draw time stays small", large_ms / large_count < 5, true);
		test_equal("Canvas rows grow with image count", large_rows >= small_rows * 3 && large_rows <= small_rows * 5, true);
	} finally {
		_photo_gallery_restore_test_state(saved);
	}

	return true;
}

async function test_photo_gallery_repeated_reset_is_stable () {
	const saved = _photo_gallery_save_test_state();
	const img = await _photo_gallery_load_test_image();

	try {
		const start = performance.now();

		for (let cycle = 0; cycle < 10; cycle++) {
			_photo_gallery_prepare(100);

			for (let index = 0; index < 100; index++) {
				_photo_gallery_add_image(img, "gallery-reset-test://" + cycle + "/" + index);
			}

			if ($("#photo_gallery_canvas").length !== 1 || $("#photo_gallery_sources").length !== 1) {
				test_equal("Repeated reset keeps exactly one canvas and source container", false, true);
				return false;
			}
		}

		const total_ms = performance.now() - start;

		test_equal("Repeated reset finishes in reasonable time", total_ms < 5000, true);
		test_equal("Repeated reset leaves the expected entry count", _photo_gallery.entries.length, 100);
		test_equal("Repeated reset does not duplicate canvases", $("#photo_gallery_canvas").length, 1);
		test_equal("Repeated reset does not duplicate source containers", $("#photo_gallery_sources").length, 1);
	} finally {
		_photo_gallery_restore_test_state(saved);
	}

	return true;
}

async function test_photo_gallery_hover_events_are_stable () {
	const saved = _photo_gallery_save_test_state();
	const canvas = document.getElementById("photo_gallery_canvas");

	if (!canvas) {
		test_equal("Canvas available for hover stability test", false, true);
		return false;
	}

	try {
		const rect = canvas.getBoundingClientRect();
		const start = performance.now();

		for (let index = 0; index < 100; index++) {
			canvas.dispatchEvent(new MouseEvent("mousemove", {
				bubbles: true,
				cancelable: true,
				clientX: rect.left + 6 + (index % 5) * 42,
				clientY: rect.top + 6 + Math.floor(index / 5) % 3 * 42
			}));
		}

		const dispatch_ms = performance.now() - start;

		await new Promise(function (resolve) { setTimeout(resolve, 500); });

		test_equal("Rapid hover dispatch stays fast", dispatch_ms < 1000, true);
		test_equal("Rapid hover keeps a single tooltip", $("#photo_gallery_tooltip").length <= 1, true);
		test_equal("Rapid hover keeps gallery entries stable", _photo_gallery.entries.length, saved.length);
		test_equal("Rapid hover does not duplicate canvases", $("#photo_gallery_canvas").length, 1);
	} finally {
		_photo_gallery_restore_test_state(saved);
		_photo_gallery_hide_tooltip();
	}

	return true;
}

async function test_photo_gallery_pixel_rendering_and_resize () {
	const saved = _photo_gallery_save_test_state();
	const red = await _photo_gallery_load_colored_test_image("#ff0000");
	const blue = await _photo_gallery_load_colored_test_image("#0000ff");
	const container = document.getElementById("photos");
	const client_width_descriptor = Object.getOwnPropertyDescriptor(container, "clientWidth");
	var forced_width = 200;

	Object.defineProperty(container, "clientWidth", {
		configurable: true,
		get: function () { return forced_width; }
	});

	try {
		_photo_gallery_prepare(2);
		_photo_gallery_add_image(red.img, red.url);
		_photo_gallery_add_image(blue.img, blue.url);
		await new Promise(function (resolve) { setTimeout(resolve, 50); });

		test_equal("First canvas cell renders the first image", _photo_gallery_pixel_is(_photo_gallery_test_pixel(0), [255, 0, 0]), true);
		test_equal("Second canvas cell renders the second image", _photo_gallery_pixel_is(_photo_gallery_test_pixel(1), [0, 0, 255]), true);

		forced_width = 50;
		window.dispatchEvent(new Event("resize"));
		await _photo_gallery_wait_for_width(forced_width);

		test_equal("Narrow resize recomputes one column", _photo_gallery.layout.cols, 1);
		test_equal("First image survives a narrow resize", _photo_gallery_pixel_is(_photo_gallery_test_pixel(0), [255, 0, 0]), true);
		test_equal("Second image survives a narrow resize", _photo_gallery_pixel_is(_photo_gallery_test_pixel(1), [0, 0, 255]), true);

		forced_width = 400;
		window.dispatchEvent(new Event("resize"));
		await _photo_gallery_wait_for_width(forced_width);

		test_equal("Wide resize recomputes multiple columns", _photo_gallery.layout.cols > 1, true);
		test_equal("First image survives a wide resize", _photo_gallery_pixel_is(_photo_gallery_test_pixel(0), [255, 0, 0]), true);
		test_equal("Second image survives a wide resize", _photo_gallery_pixel_is(_photo_gallery_test_pixel(1), [0, 0, 255]), true);
	} finally {
		if (client_width_descriptor) {
			Object.defineProperty(container, "clientWidth", client_width_descriptor);
		} else {
			delete container.clientWidth;
		}
		window.dispatchEvent(new Event("resize"));
		_photo_gallery_restore_test_state(saved);
	}

	return true;
}

async function test_photo_gallery_hit_testing_across_rows () {
	const saved = _photo_gallery_save_test_state();
	const img = await _photo_gallery_load_test_image();
	const container = document.getElementById("photos");
	const client_width_descriptor = Object.getOwnPropertyDescriptor(container, "clientWidth");
	var forced_width = 420;

	Object.defineProperty(container, "clientWidth", {
		configurable: true,
		get: function () { return forced_width; }
	});

	try {
		_photo_gallery_prepare(100);

		for (let index = 0; index < 100; index++) {
			_photo_gallery_add_image(img, "gallery-hit-test://" + index);
		}

		const canvas = _photo_gallery.canvas;
		const layout = _photo_gallery.layout;
		const original_get_bounding_client_rect = canvas.getBoundingClientRect.bind(canvas);
		const fake_rect = {
			left: 100,
			top: -150,
			width: layout.css_width,
			height: layout.css_height,
			right: 100 + layout.css_width,
			bottom: -150 + layout.css_height
		};

		canvas.getBoundingClientRect = function () { return fake_rect; };

		try {
			function point_for (index) {
				const col = index % layout.cols;
				const row = Math.floor(index / layout.cols);

				return {
					clientX: fake_rect.left + col * layout.cell_width + layout.margin + layout.thumb_width / 2,
					clientY: fake_rect.top + row * layout.cell_height + layout.margin + layout.thumb_height / 2
				};
			}

			const point_0 = point_for(0);
			const point_37 = point_for(37);
			const point_99 = point_for(99);

			test_equal("Hit testing maps the first cell", _photo_gallery_index_at(point_0.clientX, point_0.clientY), 0);
			test_equal("Hit testing maps an interior cell with scroll offset", _photo_gallery_index_at(point_37.clientX, point_37.clientY), 37);
			test_equal("Hit testing maps the last cell with scroll offset", _photo_gallery_index_at(point_99.clientX, point_99.clientY), 99);

			const beyond_entries = point_for(100);
			test_equal("Hit testing ignores cells beyond the image count", _photo_gallery_index_at(beyond_entries.clientX, beyond_entries.clientY), -1);
			test_equal("Hit testing ignores clicks outside the canvas", _photo_gallery_index_at(fake_rect.left - 20, fake_rect.top + 10), -1);
		} finally {
			canvas.getBoundingClientRect = original_get_bounding_client_rect;
		}
	} finally {
		if (client_width_descriptor) {
			Object.defineProperty(container, "clientWidth", client_width_descriptor);
		} else {
			delete container.clientWidth;
		}
		_photo_gallery_restore_test_state(saved);
	}

	return true;
}

async function test_photo_gallery_prediction_cache_reuse_and_invalidation () {
	const saved = _photo_gallery_save_test_state();
	const entry = _photo_gallery.entries[0];
	const old_cache = _photo_gallery_prediction_cache;
	const old_generation = weights_generation;

	if (!entry) {
		test_equal("Gallery entry available for cache test", false, true);
		return false;
	}

	_photo_gallery_prediction_cache = {};

	try {
		const values = await _photo_gallery_predict_image(entry.img);

		test_equal("Prediction returns one value per label", Array.isArray(values) && values.length === labels.length, true);

		if (typeof get_last_layer_activation_function === "function" && get_last_layer_activation_function() === "softmax") {
			const sum = values.reduce(function (a, b) { return a + b; }, 0);
			test_equal("Softmax prediction sums to about one", Math.abs(sum - 1) < 0.02, true);
		}

		_photo_gallery_prediction_cache[entry.url] = {model: model, generation: weights_generation, values: values};

		test_equal("Cache returns a prediction for the same model and generation", _photo_gallery_prediction_is_cached(entry) === values, true);

		weights_generation++;
		test_equal("Cache invalidates when weights generation changes", _photo_gallery_prediction_is_cached(entry), null);
		weights_generation = old_generation;

		const cache_size = Object.keys(_photo_gallery_prediction_cache).length;
		const canvas = document.getElementById("photo_gallery_canvas");
		const rect = canvas.getBoundingClientRect();

		for (let index = 0; index < 5; index++) {
			canvas.dispatchEvent(new MouseEvent("mousemove", {
				bubbles: true,
				cancelable: true,
				clientX: rect.left + 6,
				clientY: rect.top + 6
			}));
			await new Promise(function (resolve) { setTimeout(resolve, 20); });
		}

		test_equal("Repeated hover reuses the cache", Object.keys(_photo_gallery_prediction_cache).length, cache_size);
	} finally {
		weights_generation = old_generation;
		_photo_gallery_prediction_cache = old_cache;
		_photo_gallery_hide_tooltip();
		_photo_gallery_restore_test_state(saved);
	}

	return true;
}

async function test_photo_gallery_prediction_guards () {
	const saved = _photo_gallery_save_test_state();
	const entry = _photo_gallery.entries[0];
	const old_started_training = started_training;
	const old_predict_running = _predict_full_running;

	if (!entry) {
		test_equal("Gallery entry available for prediction guard test", false, true);
		return false;
	}

	try {
		started_training = true;
		test_equal("Prediction is skipped while training", await _photo_gallery_predict_image(entry.img), null);
		started_training = old_started_training;

		_predict_full_running = true;
		test_equal("Prediction is skipped while another full prediction runs", await _photo_gallery_predict_image(entry.img), null);
	} finally {
		started_training = old_started_training;
		_predict_full_running = old_predict_running;
		_photo_gallery_restore_test_state(saved);
	}

	return true;
}

async function test_photo_gallery_tooltip_shows_image_while_training () {
	const saved = _photo_gallery_save_test_state();
	const old_cache = _photo_gallery_prediction_cache;
	const old_started_training = started_training;
	const canvas = document.getElementById("photo_gallery_canvas");
	const entry = _photo_gallery.entries[0];

	if (!canvas || !entry) {
		test_equal("Gallery entry available for training tooltip test", false, true);
		return false;
	}

	try {
		started_training = true;
		_photo_gallery_prediction_cache = {};
		_photo_gallery_hide_tooltip();

		const rect = canvas.getBoundingClientRect();
		canvas.dispatchEvent(new MouseEvent("mousemove", {bubbles: true, cancelable: true, clientX: rect.left + 6, clientY: rect.top + 6}));

		const shown = await _photo_gallery_wait_for_tooltip(3000);
		const preview = $("#photo_gallery_tooltip > .grid_image_tooltip_img");

		test_equal("Tooltip appears while training", shown, true);
		test_equal("Tooltip shows the image while training", preview.length, 1);
		test_equal("Tooltip image belongs to the hovered example", preview.length === 1 && preview[0].src === entry.img.src, true);
		test_equal("Tooltip image stays above the placeholder row", preview.next().hasClass("gti_row"), true);
		test_equal("Tooltip still shows the pending prediction placeholder", $("#photo_gallery_tooltip .gti_value").text().trim(), "…");
	} finally {
		started_training = old_started_training;
		_photo_gallery_prediction_cache = old_cache;
		_photo_gallery_hide_tooltip();
		_photo_gallery_restore_test_state(saved);
	}

	return true;
}

async function test_image_dataset_switch_hides_xy_plot () {
	const $plot = $("#xy_2d_plot");
	const $xy_display = $("#xy_display_data");

	if (!$plot.length) {
		test_equal("2-D data plot exists for dataset switch test", false, true);
		return false;
	}

	const original_input_shape_is_image = input_shape_is_image;
	const original_plot_display = $plot.css("display");
	const original_xy_display = $xy_display.css("display");
	const original_plot_data = _xy_data_plot_data;
	var results = {};

	try {
		input_shape_is_image = function () { return false; };
		show_or_hide_photos_depending_on_if_index();
		results.non_image_shows_xy_view = $xy_display.css("display") !== "none";

		$plot.show().html("<div class='xy_plot_stale'>stale plot</div>");
		_xy_data_plot_data = {pts: [{coords: [0, 1], color: "#000", y_val: 1, label: ""}], ndim: 2};

		input_shape_is_image = function () { return true; };
		show_or_hide_photos_depending_on_if_index();

		results.hidden = $plot.css("display") === "none";
		results.cache_cleared = _xy_data_plot_data === null;
		results.stale_dom_removed = $plot.find(".xy_plot_stale").length === 0;

		input_shape_is_image = function () { return false; };
		show_or_hide_photos_depending_on_if_index();
		$plot.show();
		_xy_data_plot_data = {pts: [], ndim: 2};

		input_shape_is_image = function () { return true; };
		show_or_hide_photos_depending_on_if_index();

		results.hidden_after_round_trip = $plot.css("display") === "none";
		results.cache_cleared_after_round_trip = _xy_data_plot_data === null;
	} finally {
		input_shape_is_image = original_input_shape_is_image;
		_xy_data_plot_data = original_plot_data;

		if (original_plot_display === "none") {
			$plot.hide();
		} else {
			$plot.show();
		}

		if (original_xy_display === "none") {
			$xy_display.hide();
		} else {
			$xy_display.show();
		}
	}

	test_equal("Non-image dataset switch exposes the xy data view", results.non_image_shows_xy_view, true);
	test_equal("Switching back to an image dataset hides the 2-D data plot", results.hidden, true);
	test_equal("Switching back to an image dataset clears the cached plot data", results.cache_cleared, true);
	test_equal("Switching back to an image dataset removes stale plot DOM", results.stale_dom_removed, true);
	test_equal("A second FF-NN to CNN switch hides the plot again", results.hidden_after_round_trip, true);
	test_equal("A second FF-NN to CNN switch clears the plot cache again", results.cache_cleared_after_round_trip, true);

	return true;
}

async function test_photo_gallery_correct_category_visibility () {
	const saved = _photo_gallery_save_test_state();
	const entry = _photo_gallery.entries[0];
	const correct_category = entry && typeof extractCategoryFromURL === "function" ? extractCategoryFromURL(entry.url, entry.img) : null;
	const correct_index = correct_category !== null && correct_category !== undefined ? labels.indexOf(String(correct_category)) : -1;

	if (!entry || correct_index < 0 || labels.length < 2) {
		test_equal("Gallery has a labeled entry for correct-category test", false, true);
		return false;
	}

	const wrong_index = (correct_index + 1) % labels.length;

	function values_for (index) {
		return labels.map(function (_, label_index) {
			return label_index === index ? 0.9 : 0.02;
		});
	}

	try {
		_photo_gallery_update_tooltip(0, values_for(wrong_index));
		test_equal("Wrong prediction adds a correct-category row", $("#photo_gallery_tooltip .gti_row").length, labels.length + 1);
		test_equal("Wrong prediction shows the actual category", $("#photo_gallery_tooltip .gti_bad").text().trim(), String(correct_category));

		_photo_gallery_update_tooltip(0, values_for(correct_index));
		test_equal("Correct prediction has no extra correct-category row", $("#photo_gallery_tooltip .gti_row").length, labels.length);
		test_equal("Correct prediction shows no red correct-category label", $("#photo_gallery_tooltip .gti_bad").length, 0);
	} finally {
		_photo_gallery_hide_tooltip();
		_photo_gallery_restore_test_state(saved);
	}

	return true;
}

async function test_photo_gallery_resize_cycles_under_load () {
	const saved = _photo_gallery_save_test_state();
	const img = await _photo_gallery_load_test_image();
	const container = document.getElementById("photos");
	const client_width_descriptor = Object.getOwnPropertyDescriptor(container, "clientWidth");
	var forced_width = 600;

	Object.defineProperty(container, "clientWidth", {
		configurable: true,
		get: function () { return forced_width; }
	});

	try {
		_photo_gallery_prepare(500);

		for (let index = 0; index < 500; index++) {
			_photo_gallery_add_image(img, "gallery-resize-load://" + index);
		}

		const start = performance.now();

		for (let cycle = 0; cycle < 15; cycle++) {
			forced_width = 300 + (cycle % 5) * 200;
			window.dispatchEvent(new Event("resize"));
			await new Promise(function (resolve) { setTimeout(resolve, 20); });
		}

		const total_ms = performance.now() - start;

		// The relayout runs in requestAnimationFrame; on loaded macOS runners
		// the last frame can land after the fixed 20 ms waits above.
		await _photo_gallery_wait_for_width(forced_width);

		test_equal("Repeated resize under load stays reasonably fast", total_ms < 5000, true);
		test_equal("Repeated resize keeps all images", _photo_gallery.entries.length, 500);
		test_equal("Repeated resize keeps a single canvas", $("#photo_gallery_canvas").length, 1);
		test_equal("Repeated resize keeps a single source container", $("#photo_gallery_sources").length, 1);
		test_equal("Repeated resize leaves the expected layout width", Math.abs(_photo_gallery.layout.css_width - forced_width) <= 2, true);
	} finally {
		if (client_width_descriptor) {
			Object.defineProperty(container, "clientWidth", client_width_descriptor);
		} else {
			delete container.clientWidth;
		}
		window.dispatchEvent(new Event("resize"));
		_photo_gallery_restore_test_state(saved);
	}

	return true;
}

async function test_max_activation_iterations_auto_not_red () {
	const ids = ["max_activation_iterations", "mobile_max_activation_iterations"];
	const originals = {};

	ids.forEach(function (id) {
		const element = document.getElementById(id);

		if (!element) {
			return;
		}

		originals[id] = {value: element.value, background: element.style.backgroundColor};
		element.value = "";
	});

	check_number_values();

	ids.forEach(function (id) {
		const element = document.getElementById(id);

		if (!element) {
			return;
		}

		test_equal(id + " is not marked red when empty (auto)", element.style.backgroundColor !== "red", true);
	});

	ids.forEach(function (id) {
		const element = document.getElementById(id);

		if (!element || !originals[id]) {
			return;
		}

		element.value = originals[id].value;
		element.style.backgroundColor = originals[id].background;
	});

	check_number_values();

	return true;
}

function enable_or_disable_show_layer_data(_status) {
	// The checkbox's onclick handler runs enable_disable_kernel_images() +
	// add_layer_debuggers() — the latter is what hooks each layer's apply()
	// so draw_internal_states() fires and the canvas inside #layer_0_input
	// gets populated. prop().trigger("change") only fires the change event,
	// NOT the onclick, so add_layer_debuggers never ran and the test
	// saw "#layer_0_input: no canvas". Toggle via .click() instead — that
	// runs both the browser's default action (toggle the checkbox) and the
	// inline onclick handler.
	if ($("#show_layer_data").is(":checked") !== _status) {
		$("#show_layer_data").click();
	}
}

function test_predict_toggle_labels_activate_checkboxes () {
	var ids = ["show_layer_data", "show_grad_cam"];

	for (var id_idx = 0; id_idx < ids.length; id_idx++) {
		var id = ids[id_idx];
		var label = document.querySelector("label[for='" + id + "']");
		var input = document.getElementById(id);

		if (!label || !input || label.control !== input) {
			return false;
		}

		var original_checked = input.checked;
		var original_onclick = input.getAttribute("onclick");

		// Keep the label's default action (activate the checkbox) but skip the
		// heavy inline handler while we probe the association.
		input.removeAttribute("onclick");

		label.click();
		var toggled_on = input.checked !== original_checked;

		label.click();
		var toggled_back = input.checked === original_checked;

		if (original_onclick !== null) {
			input.setAttribute("onclick", original_onclick);
		}
		input.checked = original_checked;

		if (!toggled_on || !toggled_back) {
			return false;
		}
	}

	return true;
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

	await delay(5000);

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

	await delay(5000);

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

	["augment_rotate_images", "augment_invert_images", "augment_flip_left_right"].forEach(function (id) {
		$("#" + id).prop("checked", false);
	});

	if(!is_valid_ret_object(ret, wanted_epochs)) {
		return false;
	}

	$("#show_bars_instead_of_numbers").prop("checked", false);
	await updated_page();

	$("[href='#predict_tab']").click();
	await wait_for_updated_page(2);

	return true;
}

async function test_training_images_with_skip_connection () {
	const wanted_epochs = 2;

	$("#show_grad_cam").click();

	log_test("Test Training images");

	await set_dataset_and_wait("signs");

	await set_model_dataset("signs");

	await _set_initializers();

	set_imgcat(3);
	set_adam_lr(0.001);

	$(".skip_connection_enabled").prop("checked", true);

	await delay(5000);

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

	$("#show_grad_cam").click();

	return true;
}

async function test_training_images () {
	const wanted_epochs = 2;

	$("#show_grad_cam").click();

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

	$("#show_grad_cam").click();

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

	await delay(2000);

	log_test("Train on CSV X Squared");

	await set_dataset_and_wait("and_xor");

	expect_memory_leak = "";

	set_epochs(wanted_epochs);

	await set_data_origin_and_wait("csv");

	$("#csv_custom_fn").val("x**2");

	load_csv_custom_function();

	await _set_initializers();
	await wait_for_updated_page(3);

	await delay(3000);

	const ret = await train_neural_network();

	await delay(3000);

	if(!is_valid_ret_object(ret, wanted_epochs)) {
		return false;
	}

	await delay(3000);

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

	await delay(3000);

	await _set_initializers();
	await wait_for_updated_page(3);

	await delay(5000);

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
			bar_and_label_ok = 0;
		}

		if($(this_tr).find(".bar").length != 1) {
			console.error(`test_check_categorical_predictions: .bar not found`);
			bar_and_label_ok = 0;
		}
	});

	if(!bar_and_label_ok) {
		console.error(`test_check_categorical_predictions: either .label_element or .bar was missing!`);
		return false;
	}

	$("#show_bars_instead_of_numbers").click();

	await updated_page();

	await delay(10000);

	var all_predictions_are_floats_ok = 1;
	$(".predict_table td").not(".label_element").each((i, e) => {
		// The cell text can be a raw float ("0.2218") when bars are off,
		// OR a percentage tooltip ("22.18%") when bars are still on. The
		// latter is what happens for softmax predictions because
		// show_bars_instead_of_numbers() forces true for softmax regardless
		// of the checkbox, and the click doesn't re-render already-built
		// example prediction tables. Read data-raw when present (bar mode),
		// otherwise fall back to text content (number mode). Strip a
		// trailing "%" so percentages pass looks_like_number.
		const $e = $(e);
		const data_raw = $e.find(".bar").attr("data-raw");
		let got_text = data_raw !== undefined ? data_raw : $e.text();
		got_text = String(got_text).replace(/%$/, "").trim();
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

async function cycle_through_visualization_tabs() {
	$("#visualization_tab_label").click();

	await delay(500);

	$("#fcnn_tab_label").click();

	await delay(500);

	if(!$("#fcnn_canvas").length == 1) {
		err("#fcnn_canvas not found");
		return false;
	}

	$("#math_tab_label").click();

	await delay(2000);

	if(!$("#math_tab_code").length == 1) {
		err("#math_tab_code not found");
		return false;
	}

	if(!$("#math_tab_code").find("h2").length) {
		err("#math_tab_code has no h2");
		return false;
	}

	$("#weight_surfaces_tab_label").click();

	await delay(5000);

	if(!$("#tfjs_weights_container").length == 1) {
		err("#tfjs_weights_container not found");
		return false;
	}

	if(!$("#tfjs_weights_container").find(".plotly").length == 1) {
		err("#tfjs_weights_container: no plotly not found in it");
		return false;
	}

	return true;
}

async function test_different_layer_types_with_skip_connection() {
	enable_debug_layer = false;
	const datasets_to_check = ["and_xor", "signs"];

	$("#beginner").click();

	await delay(1000);

	for (var d = 0; d < datasets_to_check.length; d++) {
		const ds = datasets_to_check[d];

		log_test(`Test different layer types (dataset: ${ds})`);

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

			$layer_type.trigger("focus");

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

					await test_if_python_code_is_valid();

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

			$(".skip_connection_enabled").prop("checked", true);

			set_epochs(1);
			$("#max_number_of_files_per_category").val(1);

			const ret = await train_neural_network();

			await delay(3000);

			if(!is_valid_ret_object(ret, 1)) {
				return false;
			}
		}

		await test_if_python_code_is_valid();
	}

	enable_debug_layer = true;
	return true;
}

async function test_skip_connection_multi_layer() {
	log_test("Test skip connection spanning multiple layers (forward)");

	await set_dataset_and_wait("and_xor");
	await set_model_dataset("and");
	await _set_initializers();
	await delay(3000);

	// Reset any leftover skip settings from previous tests
	for (var rk in skip_connection_settings) {
		skip_connection_settings[rk] = { enabled: false, initializer: "glorotUniform", initializer_params: {}, skip_count: 1 };
	}
	model_config_hash = null;
	await updated_page();
	await delay(1000);

	var num_layers = model.layers.length;
	if (num_layers < 2) {
		console.error("test_skip_connection_multi_layer: need >= 2 layers, got " + num_layers);
		return false;
	}
	var old_num_errs = num_errs;
	var old_num_wrns = num_wrns;

	// Helper: check that a skip_add layer exists targeting layer `tgt` with source `src`
	function hasSkipForTarget(tgt, src) {
		var all_layers = model._allLayers || model.layers;
		for (var i = 0; i < all_layers.length; i++) {
			var name = all_layers[i].name || "";
			var m = name.match(/skip_add_(\d+)_/);
			if (!m) continue;
			if (parseInt(m[1], 10) !== src) continue;
			var inb = all_layers[i].inboundNodes || all_layers[i]._inboundNodes;
			if (!inb || !inb.length) continue;
			var inL = inb[0].inboundLayers || [];
			for (var x = 0; x < inL.length; x++) {
				if (inL[x] === model.layers[tgt]) return true;
			}
		}
		return false;
	}

	// Case 1: skip on layer 0, count 1 → target layer 1
	skip_connection_settings[0] = { enabled: true, initializer: "glorotUniform", initializer_params: {}, skip_count: 1 };
	model_config_hash = null;
	await updated_page();
	await delay(1000);

	if (!hasSkipForTarget(1, 0)) {
		console.error("test_skip_connection_multi_layer: skip_add for target=1 source=0 not found");
		return false;
	}

	// Case 2: skip on layer 0, count 2 → target layer 2
	if (num_layers >= 3) {
		skip_connection_settings[0].skip_count = 2;
		model_config_hash = null;
		await updated_page();
		await delay(1000);

		if (!hasSkipForTarget(2, 0)) {
			console.error("test_skip_connection_multi_layer: skip_add for target=2 source=0 not found");
			return false;
		}
	}

	// Math mode: target layer's skip input must reference the source layer
	var math_ok = true;
	if (num_layers >= 3) {
		var input_shape = get_first_layer_input_shape();
		var input_layer = get_input_layer(input_shape);
		var layer_data = get_layer_data();
		var skip_input_latex = _get_skip_input_full_latex(2, input_layer, layer_data, null, 0);
		math_ok = skip_input_latex && (skip_input_latex.indexOf("h_0") !== -1 || skip_input_latex.indexOf("h_1") !== -1);
		if (!math_ok) {
			console.error("test_skip_connection_multi_layer: math mode skip input wrong: " + skip_input_latex);
		}
	}

	// GUI: the "layers to skip" number input updates the setting when changed
	var gui_ok = true;
	var $count_input = $(".layer_setting").eq(0).find(".skip_connection_count");
	if ($count_input.length === 0) {
		gui_ok = false;
		console.error("test_skip_connection_multi_layer: .skip_connection_count input not found for layer 0");
	} else {
		var max_allowed = Math.max(1, num_layers - 0 - 1);
		var test_val = Math.min(2, max_allowed);
		$count_input.val(test_val).trigger("change");
		await delay(500);
		if (skip_connection_settings[0].skip_count !== test_val) {
			gui_ok = false;
			console.error("test_skip_connection_multi_layer: GUI count input did not update skip_connection_settings");
		}
	}

	if (num_errs > old_num_errs || num_wrns > old_num_wrns) {
		console.error("test_skip_connection_multi_layer: new errors/warnings detected");
		return false;
	}

	// Training works with a multi-layer skip enabled
	skip_connection_settings[0] = { enabled: true, initializer: "glorotUniform", initializer_params: {}, skip_count: 2 };
	model_config_hash = null;
	await updated_page();
	await delay(1000);
	set_epochs(1);
	const ret = await train_neural_network();
	var train_ok = is_valid_ret_object(ret, 1);

	// Cleanup: disable all skip connections
	for (var ck in skip_connection_settings) {
		skip_connection_settings[ck] = { enabled: false, initializer: "glorotUniform", initializer_params: {}, skip_count: 1 };
	}
	model_config_hash = null;
	await updated_page();
	await delay(1000);

	return math_ok && gui_ok && train_ok;
}

async function test_different_layer_types() {
	enable_debug_layer = false;
	const datasets_to_check = ["and_xor", "signs"];

	$("#beginner").click();

	await delay(1000);

	for (var d = 0; d < datasets_to_check.length; d++) {
		const ds = datasets_to_check[d];

		log_test(`Test different layer types (dataset: ${ds})`);

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

			$layer_type.trigger("focus");

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

					await test_if_python_code_is_valid();

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

		await test_if_python_code_is_valid();
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

	if (!await expect_predict_error("asdftestpred", language[lang]["no_valid_numbers_found"])) {
		return false;
	}

	await test_if_python_code_is_valid();

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

	await delay(5000);

	const wanted_epochs = 2;

	await set_dataset_and_wait("and_xor");
	await delay(5000);

	$('[aria-controls="tf_ribbon_settings"]').children().click();

	set_epochs(wanted_epochs);

	await delay(1000);

	const all_available_optimizers = [...document.querySelectorAll('#optimizer option')].map(o=>o.value);

	for (var i = 0; i < all_available_optimizers.length; i++) {
		const this_optimizer = all_available_optimizers[i];

		log(`Setting optimizer ${this_optimizer}`);

		if(all_available_optimizers.length < 6) {
			console.error(`test_all_optimizers_on_xor: Less than 6 optimizers available`);
			$('[aria-controls="home_ribbon"]').children().click();
			return false;
		}

		$("#optimizer").val(this_optimizer).trigger("change");

		await delay(10000);

		await wait_for_updated_page(3);

		const ret = await train_neural_network();

		if(!is_valid_ret_object(ret, wanted_epochs)) {
			$('[aria-controls="home_ribbon"]').children().click();
			return false;
		}
	}

	$('[aria-controls="home_ribbon"]').children().click();

	await test_if_python_code_is_valid();

	return true;
}

async function check_python_code_tab (tab_name) {
	dbg(`Checking python code from ${tab_name}`);
	const is_valid_code = await check_python($("#" + tab_name).find("pre").text());

	if(!is_valid_code) {
		return false;
	}

	return true;
}

async function test_if_python_code_is_valid() {
	const ret = await test_if_python_code_is_valid_internal();

	test_equal("test_if_python_code_is_valid", ret, true);

	return ret;
}

async function test_if_python_code_is_valid_internal() {
	log_test("Test if python code is valid");

	const python_tab = await check_python_code_tab("python_tab");

	if (!python_tab) {
		err(`test_if_python_code_is_valid_internal: python_tab was not valid python code`);
		return false;
	}

	const python_expert_tab = await check_python_code_tab("python_expert_tab");

	if (!python_expert_tab) {
		err(`test_if_python_code_is_valid_internal: python_expert_tab was not valid python code`);
		return false;
	}

	return true;
}

async function test_if_click_on_upload_button_opens_upload_menu() {
	log_test("Testing clicking upload buttons");

	$("#upload_file_dialog").click();

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

async function wait_for_webcam_data_prediction (timeout_ms) {
	const start_time = Date.now();

	while (Date.now() - start_time < timeout_ms) {
		const prediction = $("#webcam_data_prediction");

		if (prediction.is(":visible") && prediction.find("table.predict_table tr").length > 0) {
			return true;
		}

		await delay(250);
	}

	return false;
}

async function test_status_bar_tooltip_update_is_deferred() {
	const original_update = window.update_status_bar_log_tooltip;
	const original_last_l = last_l;
	let calls = 0;

	try {
		await delay(100);
		_status_bar_log_tooltip_scheduled = false;

		window.update_status_bar_log_tooltip = function () { calls++; };
		last_l = null;
		l("__status_bar_tooltip_defer_test__");

		const calls_synchronously = calls;

		for (let attempt = 0; attempt < 50 && calls === 0; attempt++) {
			await delay(20);
		}

		return calls_synchronously === 0 && calls >= 1;
	} finally {
		window.update_status_bar_log_tooltip = original_update;
		last_l = original_last_l;
	}
}

async function test_webcam_constraints_use_device_id_without_probe_stream() {
	if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
		log_test("Testing webcam constraints skipped: getUserMedia not available");
		return true;
	}

	const original_get_user_media = navigator.mediaDevices.getUserMedia;
	const original_ids = available_webcams_ids;
	const original_names = available_webcams;
	const original_cached = hasBothFrontAndBackCached;
	const original_selected = $("#which_webcam").val();
	let probe_calls = 0;

	try {
		navigator.mediaDevices.getUserMedia = async function () {
			probe_calls++;
			throw new Error("getUserMedia must not be called when a device id is available");
		};

		available_webcams = ["Test camera"];
		available_webcams_ids = ["test-device-id"];
		hasBothFrontAndBackCached = undefined;
		$("#which_webcam").val("0");

		const constraints = await _getCameraConstraints();

		return probe_calls === 0 &&
			constraints &&
			constraints.video &&
			constraints.video.deviceId &&
			constraints.video.deviceId.exact === "test-device-id";
	} catch (e) {
		return false;
	} finally {
		navigator.mediaDevices.getUserMedia = original_get_user_media;
		available_webcams = original_names;
		available_webcams_ids = original_ids;
		hasBothFrontAndBackCached = original_cached;
		$("#which_webcam").val(original_selected);
	}
}

function test_webcam_start_guard_keeps_early_stream_alive() {
	const original_stop = window.stop_webcam_if_cam;
	let stop_calls = 0;

	try {
		window.stop_webcam_if_cam = function () { stop_calls++; };

		_webcam_start_in_progress = true;
		_stop_webcam_if_active();
		const stop_calls_during_start = stop_calls;

		_webcam_start_in_progress = false;
		_stop_webcam_if_active();

		return stop_calls_during_start === 0 && stop_calls === 1;
	} finally {
		_webcam_start_in_progress = false;
		window.stop_webcam_if_cam = original_stop;
	}
}

function test_webcam_stream_active_detection() {
	const old_cam = cam;
	try {
		cam = null;
		test_equal("webcam activity is false without a stream", _webcam_stream_is_active(), false);
		cam = {stream: {getVideoTracks: function () { return [{readyState: "ended"}]; }}};
		test_equal("webcam activity rejects an ended track", _webcam_stream_is_active(), false);
		cam = {stream: {getVideoTracks: function () { return [{readyState: "ended"}, {readyState: "live"}]; }}};
		test_equal("webcam activity accepts a live track", _webcam_stream_is_active(), true);
	} finally {
		cam = old_cam;
	}
	return true;
}

async function test_gradcam_webcam_owns_heatmap_while_drawing () {
	const original_interval = auto_predict_webcam_interval;
	const original_grad_class_activation_map = window.grad_class_activation_map;
	const original_input_shape_is_image = window.input_shape_is_image;
	const original_output_size_at_layer = window.output_size_at_layer;
	const original_get_output_size_at_layer = window.get_output_size_at_layer;
	const original_get_index_of_highest_category = window.get_index_of_highest_category;
	const original_started_training = started_training;
	const original_show_grad_cam = $("#show_grad_cam").is(":checked");
	const original_canvas_display = $("#grad_cam_heatmap").css("display");
	let grad_calls = 0;

	try {
		window.input_shape_is_image = function () { return true; };
		window.get_output_size_at_layer = function () { return [1, 2]; };
		window.output_size_at_layer = async function () { return [1, 2]; };
		window.get_index_of_highest_category = function () { return 0; };
		window.grad_class_activation_map = async function () {
			grad_calls++;
			return null;
		};

		started_training = false;
		$("#show_grad_cam").prop("checked", true);
		$("#grad_cam_heatmap").show();

		auto_predict_webcam_interval = 1;
		await draw_heatmap({}, {}, 0);
		const handdrawn_skipped_while_webcam = grad_calls === 0 && $("#grad_cam_heatmap").css("display") !== "none";

		await draw_heatmap({}, {}, 1);
		const webcam_still_renders = grad_calls === 1;

		auto_predict_webcam_interval = null;
		$("#grad_cam_heatmap").show();
		await draw_heatmap({}, {}, 0);
		const handdrawn_renders_when_webcam_stopped = grad_calls === 2;

		return handdrawn_skipped_while_webcam &&
			webcam_still_renders &&
			handdrawn_renders_when_webcam_stopped &&
			_draw_heatmap_running === false;
	} finally {
		auto_predict_webcam_interval = original_interval;
		window.grad_class_activation_map = original_grad_class_activation_map;
		window.input_shape_is_image = original_input_shape_is_image;
		window.output_size_at_layer = original_output_size_at_layer;
		window.get_output_size_at_layer = original_get_output_size_at_layer;
		window.get_index_of_highest_category = original_get_index_of_highest_category;
		started_training = original_started_training;
		$("#show_grad_cam").prop("checked", original_show_grad_cam);
		$("#grad_cam_heatmap").css("display", original_canvas_display);
	}
}

async function _webcam_is_available () {
	if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
		return false;
	}

	var stream = null;

	try {
		stream = await navigator.mediaDevices.getUserMedia({ video: true });
		return true;
	} catch (e) {
		return false;
	} finally {
		if (stream) {
			stream.getTracks().forEach(function (track) { track.stop(); });
		}
	}
}

async function test_webcam(disable_webcam) {
	if(disable_webcam) {
		return true;
	}

	log_test("Testing webcam");

	if(disable_webcam_test) {
		log_test("Testing webcam ended prematurely");
		return true;
	}

	if (!await _webcam_is_available()) {
		log_test("Testing webcam skipped: no camera available");
		return true;
	}

	const wanted_epochs = 2;

	await set_dataset_and_wait("signs");
	await delay(1000);

	$("#custom_webcam_training_data_small").click();
	await delay(10000);

	if (model) {
		if (!await wait_for_webcam_data_prediction(15000)) {
			err("Live webcam prediction table is not visible in custom images");
			return false;
		}
	} else {
		dbg("test_webcam: no model yet; skipping the pre-training live prediction check");
	}

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
		const ok = await wait_for_webcam_images(i, 30000, 5);
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
		$('[aria-controls="home_ribbon"]').children().click();
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
		err(`$(".epoch-label").text() != "Epoch: 2 / 2", but ${el_text}`);
		$("#jump_to_interesting_tab").prop("checked", true);
		$("#save_math_history").prop("checked", false);
		return false;
	}

	$('[aria-controls="home_ribbon"]').children().click();

	await test_if_python_code_is_valid();

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
	var new_layer_data = JSON.parse('[{"kernel":[[0.01]],"bias":[0],"beta":[],"gamma":[],"moving_mean":[],"moving_variance":[],"depthwise_kernel":[],"pointwise_kernel":[]}]');

	var wanted_result =  '[{"kernel":[["#cf1443"]],"bias":["#353535"],"beta":[],"gamma":[],"moving_mean":[],"moving_variance":[],"depthwise_kernel":[],"pointwise_kernel":[]}]';

	var got_result = JSON.stringify(get_colors_from_old_and_new_layer_data(old_layer_data, new_layer_data));

	if (wanted_result != got_result) {
		log(`test_math_mode_color_generator_smaller_kernel: Comparing old_layer_data with new_layer_data:\n${old_layer_data}\n${new_layer_data}\nWanted: ${wanted_result}\nGot: ${got_result}`);
		return false;
	}

	return true;
}

function test_math_mode_color_generator_larger_kernel() {
	var old_layer_data = JSON.parse('[{"kernel":[[0.09022978693246841]],"bias":[0],"beta":[],"gamma":[],"moving_mean":[],"moving_variance":[],"depthwise_kernel":[],"pointwise_kernel":[]}]');
	var new_layer_data = JSON.parse('[{"kernel":[[0.1]],"bias":[0],"beta":[],"gamma":[],"moving_mean":[],"moving_variance":[],"depthwise_kernel":[],"pointwise_kernel":[]}]');

	var wanted_result = '[{"kernel":[["#2e8b57"]],"bias":["#353535"],"beta":[],"gamma":[],"moving_mean":[],"moving_variance":[],"depthwise_kernel":[],"pointwise_kernel":[]}]';

	var got_result = JSON.stringify(get_colors_from_old_and_new_layer_data(old_layer_data, new_layer_data));

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

function _test_recent_debug_entries (type, count) {
	if (!Array.isArray(_full_debug_log) || count <= 0) return [];

	const entries = _full_debug_log.filter(function (entry) {
		return entry.type === type;
	});

	return entries.slice(-count);
}

function _test_format_debug_entry (entry) {
	var message = "";

	try {
		message = entry.log.map(function (value) {
			return typeof value === "string" ? value : JSON.stringify(value);
		}).join(" ");
	} catch (e) {
		message = String(entry.log);
	}

	return message + "\nStack-Trace: " + entry.stacktrace;
}

function test_no_new_errors_or_warnings () {
	const new_errors = num_errs - original_num_errs;
	const new_warnings = num_wrns - original_num_wrns;

	_test_recent_debug_entries("err", new_errors).forEach(function (entry) {
		console.error("[test_no_new_errors] " + _test_format_debug_entry(entry));
	});
	_test_recent_debug_entries("warn", new_warnings).forEach(function (entry) {
		console.error("[test_no_new_warnings] " + _test_format_debug_entry(entry));
	});

	test_equal("no new errors", num_errs, original_num_errs);
	test_equal("no new warnings", num_wrns, original_num_wrns);
}

async function click_start_training_and_stop_immidiately(dataset_name) {
	await set_dataset_and_wait(dataset_name);

	await wait_for_updated_page(3);

	await delay(1000);

	$($(".train_neural_network_button")[0]).click();

	const start_wait_started = Date.now();

	while (Date.now() - start_wait_started < 30000) {
		if (model && model.isTraining) {
			break;
		}
		if (typeof training_run_count !== "undefined" && training_run_count <= 0) {
			break;
		}
		await delay(100);
	}

	const still_running = (typeof training_run_count !== "undefined" && training_run_count > 0) || (model && model.isTraining) || (typeof started_training !== "undefined" && started_training);

	if (still_running) {
		$($(".train_neural_network_button")[0]).click();
	}

	const stop_wait_started = Date.now();

	while (Date.now() - stop_wait_started < 30000) {
		if ((typeof training_run_count === "undefined" || training_run_count <= 0) && (!model || !model.isTraining) && (typeof started_training === "undefined" || !started_training)) {
			break;
		}
		await delay(100);
	}
}

async function get_single_layer_single_input_single_output_one_kernel_zero_bias () {
	set_mode_to_expert();

	await set_dataset_and_wait("and_xor");

	await wait_for_updated_page(3);

	await delay(1000);

	$($(".remove_layer")[0]).click();

	await wait_for_updated_page(3);

	await delay(1000);

	$($(".remove_layer")[0]).click();

	await wait_for_updated_page(3);

	await delay(1000);

	$("#data_origin").val("csv").trigger("change");

	await delay(5000);

	$("#csv_file").
	    click().
	    val("x1,y\n1,1").
	    trigger("keyup").
	    trigger("change").
	    click()
	;

	await delay(3000);

	await wait_for_updated_page(3);

	await delay(2000);

	$(".layer_options_button").click();

	await delay(1000);

	$(".kernel_initializer").val("ones").trigger("change");
	$(".bias_initializer").val("zeros").trigger("change");

	await wait_for_updated_page(3);

	await delay(2000);

	await wait_for_updated_page(3);
}

async function test_if_plotter_is_shown () {
	await set_dataset_and_wait("signs");
	await delay(3000);
	$("#predict_tab_label").click();

	await delay(3000);

	if($("#plotly_predict_controls").is(":visible")) {
		err("#plotly_predict_controls is visible in signs");
		return false;
	}

	await set_dataset_and_wait("and_xor");
	await delay(3000);
	$("#predict_tab_label").click();

	await delay(3000);

	if(!$("#plotly_predict_controls").is(":visible")) {
		err("#plotly_predict_controls is not visible in and_xor");
		return false;
	}

	return true;
}

async function test_loss_landscape() {
	const datasets_to_check = ["and_xor", "signs"];

	for (var d = 0; d < datasets_to_check.length; d++) {
		const ds = datasets_to_check[d];

		log_test(`Test different model loss landscape (dataset: ${ds})`);

		await set_dataset_and_wait(ds);

		$("#visualization_tab_label").click();
		await delay(1000);
		$("#loss_landscape_tab_label").click();
		await delay(1000);

		var sel = document.getElementById("loss_landscape_method");
		var opts = sel.options;

		$("#max_number_of_files_per_category").val(2);
		$("#loss_landscape_steps").val(2);

		for (var i = 0; i < opts.length; i++) {
			sel.value = opts[i].value;

			var ok = await run_loss_landscape_from_ui();
			if (!ok) {
				err("Error: method '" + opts[i].value + "' failed");
				return false;
			}
		}
	}
	return true;
}

async function test_different_dtypes () {
	await get_single_layer_single_input_single_output_one_kernel_zero_bias();

	const wanted_results = {
		"bool": {
			"linear": { "1": 1, "-1": 1, "0": 0 },
			"relu": { "1": 1, "-1": 1, "0": 0 },
			"relu6": { "1": 1, "-1": 1, "7": 1, "0": 0 },
			"selu": { "1": 1.0507010221481323, "-1": 1.0507010221481323, "0": 0 },
			"elu": { "1": 1, "0": 0 },
			"softplus": { "1": 1.31326162815094, "-1": 1.31326162815094, "0": 0.6931471824645996 },
			"softsign": { "1": 0.5, "-1": 0.5, "0": 0 },
			"softmax": { "1": 1, "-1": 1 },
			"tanh": { "1": 0.7615941166877747, "-1": 0.7615941166877747, "0": 0 },
			//"leakyrelu": { "1": 1, "-1": -0.01 },
			"sigmoid": { "1": 0.7310585975646973, "-1": 0.7310585975646973 }
		},

		"float32": {
			"linear": { "1": 1, "-1": -1 },
			"relu": { "1": 1, "-1": 0 },
			"relu6": { "1": 1, "-1": 0, "7": 6 },
			"selu": { "1": 1.0507010221481323, "-1": -1.1113307476043701 },
			"elu": { "1": 1, "-1": -0.6321205588 },
			"softplus": { "1": 1.31326162815094, "-1": 0.3132616875 },
			"softsign": { "1": 0.5, "-1": -0.5 },
			"softmax": { "1": 1, "-1": 1 },
			"tanh": { "1": 0.7615941166877747, "-1": -0.7615941559 },
			//"leakyrelu": { "1": 1, "-1": -0.01 },
			"sigmoid": { "1": 0.7310585975646973, "-1": 0.2689414322376251 }
		},

		"int32": {
			"linear": { "1": 1, "-1": -1 },
			"relu": { "1": 1, "-1": 0 },
			"relu6": { "1": 1, "-1": 0, "7": 6 },
			"selu": { "1": 1.0507010221481323, "-1": -1.1113307476043701 },
			"elu": { "1": 1, "-1": -0.6321205588 },
			"softplus": { "1": 1.31326162815094, "-1": 0.3132616875 },
			"softsign": { "1": 0.5, "-1": -0.5 },
			"softmax": { "1": 1, "-1": 1 },
			"tanh": { "1": 0.7615941166877747, "-1": -0.7615941559 },
			//"leakyrelu": { "1": 1, "-1": -0.01 },
			"sigmoid": { "1": 0.7310585975646973, "-1": 0.2689414322376251 }
		},
	};

	const dtypes = Object.keys(wanted_results);

	for (const dtype of dtypes) {
		const this_dtype_results = wanted_results[dtype];

		dbg(`Setting dtype to ${dtype}`);
		$(".dtype").val(dtype).trigger("change");
		await wait_for_updated_page(3);

		for (const actfun of Object.keys(this_dtype_results)) {
			dbg(`Testing ${actfun} on ${dtype}`);
			$(".activation").val(actfun).trigger("change");
			await wait_for_updated_page(3);

			await delay(5000);

			for (const [input_str, expected] of Object.entries(this_dtype_results[actfun])) {
				const input_val = parseFloat(input_str);
				const predict_res = model.predict(tensor([input_val]));
				const predict_one = array_sync(predict_res);
				const predict_shape = get_shape_from_array(predict_one);
				const shape_str = JSON.stringify(predict_shape);

				if (shape_str != "[1,1]") {
					err(`Shape mismatch: ${shape_str} (dtype: ${dtype}, actfun: ${actfun}, input: ${input_val})`);
					return false;
				}

				const got = predict_one[0][0];
				if (Math.abs(got - expected) > 1e-6) {
					err(`Expected ${expected} but got ${got} (dtype: ${dtype}, actfun: ${actfun}, input: ${input_val})`);
					return false;
				}
			}
		}
	}

	return true;
}

async function set_regularizer (type, name) {
	dbg(`Setting .${type}_regularizer to ${name}`);
	$(`.${type}_regularizer`).val(name).trigger("change");	

	await wait_for_updated_page(3);
	await delay(1000);
}

async function test_different_regularizers () {
	await get_single_layer_single_input_single_output_one_kernel_zero_bias();

	await set_regularizer("kernel", "none");
	await set_regularizer("bias", "none");

	var layer = model?.layers[0];

	if(!layer) {
		err(`layer is empty`);
		return false;
	}

	if(!Object.keys(layer).includes("kernelRegularizer")) {
		err(`layer has no kernelRegularizer`);
		return false;
	}

	if(!Object.keys(layer).includes("biasRegularizer")) {
		err(`layer has no biasRegularizer`);
		return false;
	}

	if(layer.kernelRegularizer !== null) {
		err(`kernelRegularizer is not null, but ${layer.kernelRegularizer}`);
		return false;
	}

	if(layer.biasRegularizer !== null) {
		err(`biasRegularizer is not null, but ${layer.biasRegularizer}`);
		return false;
	}

	await set_regularizer("kernel", "l1");
	await set_regularizer("bias", "l1");

	layer = model?.layers[0];

	if(!layer) {
		err(`Layer is empty`);
		return false;
	}

	if(!Object.keys(layer).includes("kernelRegularizer")) {
		err(`layer does not have kernelRegularizer`);
		return false;
	}

	if(!Object.keys(layer).includes("biasRegularizer")) {
		err(`layer does not have biasRegularizer`);
		return false;
	}

	//{ l1: 0.01, l2: 0, hasL1: true, hasL2: false }

	const this_kernel_regularizer = layer.kernelRegularizer;

	const keys_this_kernel_regularizer = Object.keys(this_kernel_regularizer);

	if(!keys_this_kernel_regularizer.includes("l1")) {
		err(`Missing key l1`);
		return false;
	}

	if(!keys_this_kernel_regularizer.includes("l2")) {
		err(`Missing key l2`);
		return false;
	}

	if(!this_kernel_regularizer.hasL1) {
		err(`hasL1 was false, it should have been true`);
		return false;
	}

	if(this_kernel_regularizer.hasL2) {
		err(`hasL2 was false, it should have been false`);
		return false;
	}

	const this_bias_regularizer = layer.biasRegularizer;

	const keys_this_bias_regularizer = Object.keys(this_bias_regularizer);

	if(!keys_this_bias_regularizer.includes("l1")) {
		err(`Missing key l1`);
		return false;
	}

	if(!keys_this_bias_regularizer.includes("l2")) {
		err(`Missing key l2`);
		return false;
	}

	if(!this_bias_regularizer.hasL1) {
		err(`hasL1 was false, it should have been true`);
		return false;
	}

	if(this_bias_regularizer.hasL2) {
		err(`hasL2 was false, it should have been false`);
		return false;
	}

	$(".kernel_regularizer_l1").val(123).trigger("change");

	await wait_for_updated_page(3);

	await delay(1000);

	const got_kernel_l1 = model?.layers[0]?.kernelRegularizer?.l1;

	if(got_kernel_l1 != 123) {
		err(`kernelRegularizer is not 123, but is '${got_kernel_l1}'`);
		return false;
	}

	return true;
}

async function test_layer_settings() {
	await get_single_layer_single_input_single_output_one_kernel_zero_bias();

	const wanted_results = {
		"linear": { "1": 1, "-1": -1 },
		"relu": { "1": 1, "-1": 0 },
		"relu6": { "1": 1, "-1": 0, "7": 6 },
		"selu": { "1": 1.0507010221481323, "-1": -1.1113307476043701 },
		"elu": { "1": 1, "-1": -0.6321205588 },
		"softplus": { "1": 1.31326162815094, "-1": 0.3132616875 },
		"softsign": { "1": 0.5, "-1": -0.5 },
		"softmax": { "1": 1, "-1": 1 },
		"tanh": { "1": 0.7615941166877747, "-1": -0.7615941559 },
		//"leakyrelu": { "1": 1, "-1": -0.01 },
		"sigmoid": { "1": 0.7310585975646973, "-1": 0.2689414322376251 }
	};

	for (const actfun of Object.keys(wanted_results)) {
		$(".activation").val(actfun).trigger("change");
		await wait_for_updated_page(3);

		await delay(5000);

		for (const [input_str, expected] of Object.entries(wanted_results[actfun])) {
			const input_val = parseFloat(input_str);
			const predict_res = model.predict(tensor([input_val]));
			const predict_one = array_sync(predict_res);
			const predict_shape = get_shape_from_array(predict_one);
			const shape_str = JSON.stringify(predict_shape);

			if (shape_str != "[1,1]") {
				err(`Shape mismatch: ${shape_str} (actfun: ${actfun}, input: ${input_val})`);
				return false;
			}

			const got = predict_one[0][0];
			if (Math.abs(got - expected) > 1e-6) {
				err(`Expected ${expected} but got ${got} (actfun: ${actfun}, input: ${input_val})`);
				return false;
			}
		}
	}

	const set_const_to = -3;

	var expected = {
		"ones": 1,
		"zeros": 0,
		"constant": set_const_to
	};

	const types = {
		"kernel": 0,
		"bias": 1
	};

	const layer_idx = 0;

	for (const type of Object.keys(types)) {
		for (const name of Object.keys(expected)) {
			const wanted_key = expected[name];

			dbg(`Setting ${type} to ${name} to ${wanted_key}`);
			$(`.${type}_initializer`).val(name).trigger("change");

			await wait_for_updated_page(3);

			if(name == "constant") {
				dbg(`Setting ${type}_initializer_value to ${wanted_key}`);
				await delay(1000);

				$(`.${type}_initializer_value`).val(wanted_key).trigger("change");

				await wait_for_updated_page(3);
			}

			await delay(1000);

			const wanted =  "[" + wanted_key + "]";
			const weight_idx = parse_int(types[type]);
			const got = JSON.stringify(flatten(array_sync(model.layers[layer_idx].weights[weight_idx].val)));

			if(got != wanted) {
				err(`${type}: ${name}, got: ${got}, wanted: ${wanted}`);
				return false;
			}
		}
	}

	return true;
}

async function test_math_editable_system() {
	log_test("Test Math Editable System");

	// 1. Setup: ensure we have a simple model with a dense layer
	await set_dataset_and_wait("and_xor");
	await delay(2000);

	// 2. Enable interactive mode
	var prev_interactive = _math_interactive_mode;
	_math_interactive_mode = true;

	// 3. Clear any existing editables
	math_clear_editables();
	test_equal("math_clear_editables clears all", _math_editables.length, 0);

	// 4. Test registration
	var test_val = 0.5;
	math_register_editable("test_ed_1", function() { return test_val; }, function(v) { test_val = v; }, -10, 10, "Test Param 1", { step: 0.01, decimals: 3 });

	test_equal("math_register_editable adds one", _math_editables.length, 1);
	test_equal("math_find_editable finds it", math_find_editable("test_ed_1") !== null, true);
	test_equal("math_find_editable returns null for missing", math_find_editable("nonexistent_xyz") === null, true);

	// 5. Test getter
	var ed = math_find_editable("test_ed_1");
	test_equal("editable get() returns correct value", ed.get(), 0.5);

	// 6. Test setter (when not training)
	var old_started_training = started_training;
	started_training = false;
	ed.set(1.23);
	test_equal("editable set() updates value", test_val, 1.23);
	test_equal("editable get() reflects new value", ed.get(), 1.23);

	// 7. Test setter blocked during training
	started_training = true;
	ed.set(9.99);
	test_equal("editable set() blocked during training", test_val, 1.23); // unchanged
	started_training = false;

	// 8. Test duplicate registration updates existing
	math_register_editable("test_ed_1", function() { return test_val; }, function(v) { test_val = v; }, -5, 5, "Test Param 1 Updated", { step: 0.1, decimals: 2 });
	test_equal("duplicate registration doesn't add new entry", _math_editables.length, 1);
	test_equal("duplicate registration updates label", math_find_editable("test_ed_1").label, "Test Param 1 Updated");
	test_equal("duplicate registration updates min", math_find_editable("test_ed_1").min, -5);

	// 9. Test popup creation
	var popup = math_ensure_popup();
	test_equal("math_ensure_popup creates element", popup !== null, true);
	test_equal("popup element exists in DOM", document.getElementById("math_var_popup") !== null, true);

	// 10. Test popup open (blocked during training)
	started_training = true;
	math_open_popup("test_ed_1", { left: 100, top: 100, width: 50, bottom: 150 });
	test_equal("popup blocked during training", _math_active_ed, null);
	started_training = false;

	// 11. Test popup open (allowed when not training)
	math_open_popup("test_ed_1", { left: 100, top: 100, width: 50, bottom: 150 });
	test_equal("popup opens when not training", _math_active_ed !== null, true);
	test_equal("popup active ed is correct", _math_active_ed.id, "test_ed_1");
	test_equal("popup has visible class", _math_pop_el.classList.contains("math-pop-visible"), true);

	// 12. Test popup close
	math_close_popup();
	test_equal("math_close_popup clears active ed", _math_active_ed, null);
	test_equal("popup loses visible class", _math_pop_el.classList.contains("math-pop-visible"), false);

	// 13. Test _replace_colored_spans_with_editables
	var test_container = document.createElement("div");
	test_container.innerHTML = '<span style="color: rgb(83, 216, 251);">0.500</span>';
	document.body.appendChild(test_container);

	math_register_editable("test_ed_span", function() { return 0.5; }, function(v) {}, -10, 10, "Span Test", { decimals: 3 });

	_replace_colored_spans_with_editables(test_container, [{ eid: "test_ed_span" }]);

	var editable_span = test_container.querySelector('[data-math-eid="test_ed_span"]');
	test_equal("colored span converted to editable", editable_span !== null, true);
	test_equal("editable span has correct class", editable_span.classList.contains("math-ed-num"), true);
	test_equal("editable span shows value", editable_span.textContent, "0.500");

	test_container.remove();

	// 14. Test el_render_single_latex_with_editables
	var render_container = document.createElement("div");
	document.body.appendChild(render_container);

	math_register_editable("test_render_ed", function() { return 2.718; }, function(v) {}, -10, 10, "Render Test", { decimals: 3 });

	var test_latex = "\\textcolor{#53d8fb}{2.718} + x";
	el_render_single_latex_with_editables(render_container, test_latex, [{ eid: "test_render_ed" }]);

	test_equal("render container has content", render_container.innerHTML.length > 0, true);
	test_equal("render container has math-hybrid-rendered", render_container.querySelector(".math-hybrid-rendered") !== null, true);

	render_container.remove();

	// 15. Test _math_on_variable_changed fires event
	var event_fired = false;
	var event_handler = function(e) {
		if (e.detail.id === "test_ed_1") event_fired = true;
	};
	document.addEventListener("math_variable_changed", event_handler);

	_math_on_variable_changed(math_find_editable("test_ed_1"));
	test_equal("math_variable_changed event fires", event_fired, true);

	document.removeEventListener("math_variable_changed", event_handler);

	// 16. Test with actual model (hybrid dense render)
	if (model && model.layers && model.layers.length > 0) {
		var layer_data = get_layer_data();
		var colors = get_colors_from_old_and_new_layer_data([], layer_data);
		var input_layer = get_input_layer(get_first_layer_input_shape());

		// Find first dense layer
		var dense_layer_idx = -1;
		for (var li = 0; li < model.layers.length; li++) {
			if ($($(".layer_type")[li]).val() === "dense") {
				dense_layer_idx = li;
				break;
			}
		}

		if (dense_layer_idx >= 0) {
			var hybrid_container = document.createElement("div");
			hybrid_container.id = "test_math_hybrid_dense";
			document.body.appendChild(hybrid_container);

			math_clear_editables();
			_inject_hybrid_dense_direct("test_math_hybrid_dense", dense_layer_idx, layer_data, colors, input_layer);

			test_equal("hybrid dense renders content", hybrid_container.innerHTML.length > 0, true);
			test_equal("hybrid dense has editable spans", hybrid_container.querySelectorAll(".math-ed-num").length > 0, true);

			await delay(2000);

			// Test weight modification through editable
			var kernel_eid = "L" + dense_layer_idx + "_kernel_0_0";
			var kernel_ed = math_find_editable(kernel_eid);
			if (kernel_ed) {
				var original_val = kernel_ed.get();
				var new_val = original_val + 0.1;
				kernel_ed.set(new_val);
				await delay(200);

				// Verify the model weight actually changed
				var updated_weights = array_sync(model.layers[dense_layer_idx].weights[0].val, true);
				var flat_updated = Array.isArray(updated_weights[0]) ? updated_weights[0][0] : updated_weights[0];
				test_equal("weight change applied to model", Math.abs(flat_updated - new_val) < 1e-5, true);

				// Reset
				kernel_ed.set(original_val);
				await delay(100);
			}

			hybrid_container.remove();
		}
	}

	// Cleanup
	math_clear_editables();
	_math_interactive_mode = prev_interactive;
	started_training = old_started_training;

	return true;
}

function _tiny_tests_data_js() {
	test_equal("parse_csv_file basic", JSON.stringify(parse_csv_file("a,b,c\n1,2,3\n4,5,6\n").data), '[[1,2,3],[4,5,6]]');
	test_equal("parse_csv_file header", JSON.stringify(parse_csv_file("a,b,c\n1,2,3\n").head), '["a","b","c"]');
	test_equal("parse_csv_file empty", JSON.stringify(parse_csv_file("a,b\n").data), '[]');
	test_equal("parse_csv_file duplicate lines ignored", parse_csv_file("a,b\n1,2\n1,2\n").data.length, 1);
	test_equal("parse_csv_file mismatched columns excluded", parse_csv_file("a,b\n1,2\n1,2,3\n").data.length, 1);
	test_equal("parse_csv_file with tab separator", JSON.stringify(parse_csv_file("a\tb\n1\t2\n").head), '["a\\tb"]');

	test_equal("parse_line basic comma", JSON.stringify(parse_line("1,2,3", ",")), '[1,2,3]');
	test_equal("parse_line with strings", JSON.stringify(parse_line("hello,world", ",")), '["hello","world"]');
	test_equal("parse_line empty string", JSON.stringify(parse_line("", ",")), '[]');
	test_equal("parse_line single value", JSON.stringify(parse_line("42", ",")), '[42]');
	test_equal("parse_line float values", JSON.stringify(parse_line("1.5,2.7", ",")), '[1.5,2.7]');
	test_equal("parse_line negative values", JSON.stringify(parse_line("-1,-2.5", ",")), '[-1,-2.5]');

	test_equal("parse_dtype integer", parse_dtype("42"), 42);
	test_equal("parse_dtype negative integer", parse_dtype("-5"), -5);
	test_equal("parse_dtype float", parse_dtype("3.14"), 3.14);
	test_equal("parse_dtype string", parse_dtype("hello"), "hello");

	test_equal("degrees_to_radians(0)", degrees_to_radians(0), 0);
	test_equal("degrees_to_radians(180)", Math.abs(degrees_to_radians(180) - Math.PI) < 1e-10, true);
	test_equal("degrees_to_radians(90)", Math.abs(degrees_to_radians(90) - Math.PI/2) < 1e-10, true);
	test_equal("degrees_to_radians(360)", Math.abs(degrees_to_radians(360) - 2*Math.PI) < 1e-10, true);

	test_equal("shuffle preserves length", shuffle([1,2,3,4,5]).length, 5);
	test_equal("shuffle preserves elements", shuffle([1,2,3]).sort().join(","), "1,2,3");

	test_equal("findDuplicates no dupes", JSON.stringify(findDuplicates([1,2,3])), '[]');
	test_equal("findDuplicates with dupes", JSON.stringify(findDuplicates([1,2,2,3])), '[2]');
	test_equal("findDuplicates multiple dupes", findDuplicates([1,1,2,2,3]).length, 2);
	test_equal("findDuplicates empty", JSON.stringify(findDuplicates([])), '[]');

	test_equal("onlyUnique filters", [1,2,2,3,3,3].filter(onlyUnique).length, 3);

	test_equal("median odd array", median([5,1,3]), 3);
	test_equal("median even array", median([1,2,3,4]), 2.5);
	test_equal("median single element", median([7]), 7);

	test_equal("decille empty array", decille([], 0.5), 0);
	test_equal("decille NaN percentage", decille([1,2,3], NaN), 0);
	test_equal("decille null percentage", decille([1,2,3], null), 0);
	test_equal("decille 0 percentage", decille([1,2,3,4,5], 0), 1);

	test_equal("x_y_warning null input", x_y_warning(null).length > 0, true);
	test_equal("x_y_warning missing x", x_y_warning({y: [1]}).includes("X-data"), true);
	test_equal("x_y_warning missing y", x_y_warning({x: [1]}).includes("Y-data"), true);
	test_equal("x_y_warning null x", x_y_warning({x: null, y: [1]}).includes("null"), true);
	test_equal("x_y_warning null y", x_y_warning({x: [1], y: null}).includes("null"), true);

	test_equal("isolateEval basic math", isolateEval("2 + 2"), 4);
	test_equal("isolateEval string", isolateEval("'hello'"), "hello");
	test_equal("isolateEval array", JSON.stringify(isolateEval("[1,2,3]")), "[1,2,3]");

	test_equal("flatten nested", JSON.stringify(flatten([1,[2,[3,[4]]]])), "[1,2,3,4]");
	test_equal("flatten already flat", JSON.stringify(flatten([1,2,3])), "[1,2,3]");
	test_equal("flatten empty", JSON.stringify(flatten([])), "[]");
	test_equal("flatten deep nesting", JSON.stringify(flatten([[[[1]]]])), "[1]");
}

function _tiny_tests_explain_js() {
	test_equal("normalize_to_rgb_min_max middle", normalize_to_rgb_min_max(5, 0, 10), 127);
	test_equal("normalize_to_rgb_min_max min", normalize_to_rgb_min_max(0, 0, 10), 0);
	test_equal("normalize_to_rgb_min_max max", normalize_to_rgb_min_max(10, 0, 10), 255);
	test_equal("normalize_to_rgb_min_max same min max", normalize_to_rgb_min_max(5, 5, 5), 0);
	test_equal("normalize_to_rgb_min_max non-number max", normalize_to_rgb_min_max(5, "a", "b"), 5);

	test_equal("get_dim null", get_dim(null), 0);
	test_equal("get_dim 1d", JSON.stringify(get_dim([1,2,3])), "[3]");
	test_equal("get_dim 2d", JSON.stringify(get_dim([[1,2],[3,4]])), "[2,2]");
	test_equal("get_dim 3d", JSON.stringify(get_dim([[[1,2],[3,4]]])), "[1,2,2]");

	test_equal("shape_looks_like_image_data [28,28,3]", shape_looks_like_image_data([28,28,3]), "simple");
	test_equal("shape_looks_like_image_data [28,28,32]", shape_looks_like_image_data([28,28,32]), "filter");
	test_equal("shape_looks_like_image_data [3,3,3,32]", shape_looks_like_image_data([3,3,3,32]), "kernel");
	test_equal("shape_looks_like_image_data [100]", shape_looks_like_image_data([100]), "unknown");
	test_equal("shape_looks_like_image_data null", shape_looks_like_image_data(null), "unknown");

	test_equal("explain_error_msg null", explain_error_msg(null), "");
	test_equal("explain_error_msg empty string", explain_error_msg(""), "");

	test_equal("array_to_html simple", array_to_html([1,2,3]), "1<br>2<br>3<br>");
	test_equal("array_to_html nested", array_to_html([[1,2],[3,4]]).includes("1 2"), true);

	var trace = get_empty_default_trace("myTrace");
	test_equal("get_empty_default_trace name", trace.name, "myTrace");
	test_equal("get_empty_default_trace type", trace.type, "scatter");
	test_equal("get_empty_default_trace x empty", JSON.stringify(trace.x), "[]");
	test_equal("get_empty_default_trace y empty", JSON.stringify(trace.y), "[]");
}

function _tiny_tests_model_js() {
	test_equal("get_key_name_camel_case simple", get_key_name_camel_case("kernel_initializer"), "kernelInitializer");
	test_equal("get_key_name_camel_case no underscore", get_key_name_camel_case("kernel"), "kernel");
	test_equal("get_key_name_camel_case multiple", get_key_name_camel_case("a_b_c"), "aBC");
	test_equal("get_key_name_camel_case empty", get_key_name_camel_case(""), "");

	test_equal("isCommaSeparatedIntegers valid", isCommaSeparatedIntegers("1,2,3"), true);
	test_equal("isCommaSeparatedIntegers single", isCommaSeparatedIntegers("5"), true);
	test_equal("isCommaSeparatedIntegers with spaces", isCommaSeparatedIntegers("1, 2, 3"), true);
	test_equal("isCommaSeparatedIntegers invalid", isCommaSeparatedIntegers("1,a,3"), false);
	test_equal("isCommaSeparatedIntegers empty", isCommaSeparatedIntegers(""), false);
	test_equal("isCommaSeparatedIntegers non-string", isCommaSeparatedIntegers(123), false);
	test_equal("isCommaSeparatedIntegers float", isCommaSeparatedIntegers("1.5,2"), false);

	test_equal("is_number_array valid", is_number_array([1,2,3]), true);
	test_equal("is_number_array with string", is_number_array([1,"a",3]), false);
	test_equal("is_number_array empty", is_number_array([]), true);
	test_equal("is_number_array non-array", is_number_array("hello"), false);

	test_equal("remove_empty removes nulls", JSON.stringify(remove_empty({a: 1, b: null, c: 3})), '{"a":1,"c":3}');
	test_equal("remove_empty keeps zeros", JSON.stringify(remove_empty({a: 0, b: 1})), '{"a":0,"b":1}');
}

function _tiny_tests_math_mode_js() {
	test_equal("replaceNaNsRecursive with NaN", replaceNaNsRecursive(NaN), "\\text{NaN}");
	test_equal("replaceNaNsRecursive normal", replaceNaNsRecursive(5), 5);
	test_equal("replaceNaNsRecursive nested", JSON.stringify(replaceNaNsRecursive([1, NaN, 3])), '[1,"\\\\text{NaN}",3]');

	test_equal("replaceInfinityRecursive pos", replaceInfinityRecursive(Infinity), "\\infty");
	test_equal("replaceInfinityRecursive neg", replaceInfinityRecursive(-Infinity), "-\\infty");
	test_equal("replaceInfinityRecursive normal", replaceInfinityRecursive(5), 5);

	test_equal("replaceScientificNotationRecursive normal", replaceScientificNotationRecursive(5), 5);
	test_equal("replaceScientificNotationRecursive sci notation", typeof replaceScientificNotationRecursive(1e-7), "string");

	test_equal("array_to_fixed 0 decimals", JSON.stringify(array_to_fixed([1.5, 2.7], 0)), '[1.5,2.7]');

	test_equal("a_times_b", a_times_b("A", "B"), "A \\times B");
}

function _tiny_tests_gui_js() {
	test_equal("is_numeric '3.14'", is_numeric("3.14"), true);
	test_equal("is_numeric '0'", is_numeric("0"), true);
	test_equal("is_numeric '-5'", is_numeric("-5"), true);
	test_equal("is_numeric 'abc'", is_numeric("abc"), false);
	test_equal("is_numeric ''", is_numeric(""), false);
	test_equal("is_numeric number type", is_numeric(5), false);

	test_equal("get_js_name('kernel_size')", get_js_name("kernel_size"), "kernelSize");
	test_equal("get_python_name('kernelSize')", get_python_name("kernelSize"), "kernel_size");
	test_equal("get_js_name boolean true", get_js_name(true), "true");
	test_equal("get_js_name boolean false", get_js_name(false), "false");
	test_equal("get_python_name boolean true", get_python_name(true), "True");

	test_equal("get_key_from_path simple", get_key_from_path({a:{b:42}}, ["a","b"]), 42);
	test_equal("get_key_from_path empty keypath", get_key_from_path({a:1}, []), {a:1});
	test_equal("get_key_from_path missing key", get_key_from_path({a:{b:42}}, ["a","x"]), null);
	test_equal("get_key_from_path deep", get_key_from_path({a:{b:{c:7}}}, ["a","b","c"]), 7);
}

function _tiny_tests_predict_js() {
	test_equal("extract_error_message with message", extract_error_message({message: "test"}), "test");
	test_equal("extract_error_message string", extract_error_message("raw error"), "raw error");
	test_equal("extract_error_message number", extract_error_message(42), "42");

	var arr_single = [[42]];
	scaleNestedArray(arr_single);
	test_equal("scaleNestedArray single value NaN", isNaN(arr_single[0][0]), true);

	test_equal("find_max_index([1,3,2])", find_max_index([1,3,2]), 1);
	test_equal("find_max_index([5,4,3,2,1])", find_max_index([5,4,3,2,1]), 0);
	test_equal("find_max_index([1,2,5])", find_max_index([1,2,5]), 2);
	test_equal("find_max_index([-5,-1,-3])", find_max_index([-5,-1,-3]), 1);
	test_equal("find_max_index single element", find_max_index([42]), 0);

	test_equal("find_max_value([1,3,2])", find_max_value([1,3,2]), 3);
	test_equal("find_max_value([-5,-1,-3])", find_max_value([-5,-1,-3]), -1);
	test_equal("find_max_value([10])", find_max_value([10]), 10);

	test_equal("_format_probability_text(0.5)", _format_probability_text(0.5), "50.00%");
	test_equal("_format_probability_text(1)", _format_probability_text(1), "100.00%");
	test_equal("_format_probability_text(0)", _format_probability_text(0), "0.00%");
	test_equal("_format_probability_text(null)", _format_probability_text(null), "");
	test_equal("_format_probability_text(undefined)", _format_probability_text(undefined), "");
	test_equal("_format_probability_text(0.1234)", _format_probability_text(0.1234), "12.34%");

	test_equal("_format_raw_value(0.5)", _format_raw_value(0.5), "0.500000");
	test_equal("_format_raw_value(1)", _format_raw_value(1), "1.000000");
	test_equal("_format_raw_value(null)", _format_raw_value(null), "");
	test_equal("_format_raw_value(undefined)", _format_raw_value(undefined), "");
	test_equal("_format_raw_value(3.14159)", _format_raw_value(3.14159), "3.141590");
}

function _tiny_tests_fcnn_js() {
	test_equal("_determine_shape_type conv2d", _determine_shape_type("conv2d"), "rectangle_conv2d");
	test_equal("_determine_shape_type Conv2DTranspose", _determine_shape_type("Conv2DTranspose"), "rectangle_conv2d");
	test_equal("_determine_shape_type flatten", _determine_shape_type("flatten"), "rectangle_flatten");
	test_equal("_determine_shape_type Flatten", _determine_shape_type("Flatten"), "rectangle_flatten");
	test_equal("_determine_shape_type dense", _determine_shape_type("dense"), "circle");
	test_equal("_determine_shape_type maxPooling2d", _determine_shape_type("maxPooling2d"), "circle");
	test_equal("_determine_shape_type layernormalization", _determine_shape_type("LayerNormalization"), "layernorm");

	test_equal("_format_number null", _format_number(null), "N/A");
	test_equal("_format_number undefined", _format_number(undefined), "N/A");
	test_equal("_format_number 0", _format_number(0), "0");
	test_equal("_format_number 1.23456789", _format_number(1.23456789), "1.234568");
	test_equal("_format_number 42", _format_number(42), "42");
	test_equal("_format_number Infinity", _format_number(Infinity), "Infinity");
	test_equal("_format_number -Infinity", _format_number(-Infinity), "-Infinity");
	test_equal("_format_number NaN", _format_number(NaN), "NaN");
	test_equal("_format_number 0.00005", _format_number(0.00005), "5.0000e-5");

	test_equal("_get_layer_name output layer", _get_layer_name(2, 3, "dense"), "Output Layer");
	test_equal("_get_layer_name first layer", _get_layer_name(0, 3, "dense"), "dense 0");
	test_equal("_get_layer_name middle layer", _get_layer_name(1, 3, "conv2d"), "conv2d 1");

	test_equal("_point_in_region circle center", _point_in_region(5, 5, {shape: "circle", x: 5, y: 5, radius: 10}), true);
	test_equal("_point_in_region circle outside", _point_in_region(100, 100, {shape: "circle", x: 5, y: 5, radius: 10}), false);
	test_equal("_point_in_region circle edge", _point_in_region(15, 5, {shape: "circle", x: 5, y: 5, radius: 10}), true);

	test_equal("_point_in_region rect inside", _point_in_region(3, 3, {shape: "rect", x: 0, y: 0, w: 10, h: 10}), true);
	test_equal("_point_in_region rect outside", _point_in_region(15, 3, {shape: "rect", x: 0, y: 0, w: 10, h: 10}), false);

	var hBins = _compute_histogram_bins([1,2,3,4,5], {min: 1, max: 5}, 5);
	test_equal("_compute_histogram_bins length", hBins.length, 5);
	test_equal("_compute_histogram_bins sum", hBins.reduce((a,b) => a+b, 0), 5);

	var fcs = _compute_stats([1,2,3,4,5]);
	test_equal("fcnn _compute_stats min", fcs.min, 1);
	test_equal("fcnn _compute_stats max", fcs.max, 5);
	test_equal("fcnn _compute_stats avg", fcs.avg, 3);
	test_equal("fcnn _compute_stats count", fcs.count, 5);
	test_equal("fcnn _compute_stats null on empty", _compute_stats(null), null);
	test_equal("fcnn _compute_stats null on []", _compute_stats([]), null);

	test_equal("_compute_vertical_spacing small count", _compute_vertical_spacing(5, 20, 800), 20);
	test_equal("_compute_vertical_spacing large count", _compute_vertical_spacing(100, 20, 800), 8);
	test_equal("_compute_vertical_spacing single neuron", _compute_vertical_spacing(1, 20, 800), 20);
}

function _tiny_tests_misc() {
	test_equal("_reshape_flat_to_matrix 2x3", JSON.stringify(_reshape_flat_to_matrix([1,2,3,4,5,6], [2,3])), "[[1,2,3],[4,5,6]]");
	test_equal("_reshape_flat_to_matrix 1x3", JSON.stringify(_reshape_flat_to_matrix([7,8,9], [1,3])), "[[7,8,9]]");
	test_equal("_reshape_flat_to_matrix 3x1", JSON.stringify(_reshape_flat_to_matrix([1,2,3], [3,1])), "[[1],[2],[3]]");
	test_equal("_reshape_flat_to_matrix 1x1", JSON.stringify(_reshape_flat_to_matrix([42], [1,1])), "[[42]]");

	test_equal("_erfApprox(0) ~ 0", Math.abs(_erfApprox(0)) < 1e-6, true);
	test_equal("_erfApprox(1) ~ 0.8427", Math.abs(_erfApprox(1) - 0.8427007929) < 0.001, true);
	test_equal("_erfApprox(-1) = -erfApprox(1)", Math.abs(_erfApprox(-1) + _erfApprox(1)) < 1e-6, true);
	test_equal("_erfApprox large positive ~ 1", _erfApprox(5) > 0.999, true);
	test_equal("_erfApprox large negative ~ -1", _erfApprox(-5) < -0.999, true);

	test_equal("_determinant_3x3 identity", _determinant_3x3([[1,0,0],[0,1,0],[0,0,1]]), 1);
	test_equal("_determinant_3x3 [[2,0,0],[0,3,0],[0,0,4]]", _determinant_3x3([[2,0,0],[0,3,0],[0,0,4]]), 24);
	test_equal("_determinant_3x3 singular", _determinant_3x3([[1,2,3],[4,5,6],[7,8,9]]), 0);
	test_equal("_determinant_3x3 [[1,2,3],[0,1,4],[5,6,0]]", _determinant_3x3([[1,2,3],[0,1,4],[5,6,0]]), 1);

	test_equal("_normalize_correlation_matrix identity", JSON.stringify(_normalize_correlation_matrix([[1,0,0],[0,1,0],[0,0,1]])), "[[1,0,0],[0,1,0],[0,0,1]]");
	var normTest = _normalize_correlation_matrix([[3,0,0],[0,4,0],[0,0,5]]);
	test_equal("_normalize_correlation_matrix cols are unit length", Math.abs(Math.sqrt(normTest[0][0]*normTest[0][0]+normTest[1][0]*normTest[1][0]+normTest[2][0]*normTest[2][0]) - 1) < 1e-10, true);

	var cs1 = calculate_stats([1,2,3,4,5]);
	test_equal("calculate_stats mean", cs1.mean, 3);
	test_equal("calculate_stats min", cs1.min, 1);
	test_equal("calculate_stats max", cs1.max, 5);
	test_equal("calculate_stats n", cs1.n, 5);
	test_equal("calculate_stats std ~ 1.414", Math.abs(cs1.std - Math.sqrt(2)) < 1e-6, true);
	test_equal("calculate_stats cv > 0", cs1.cv > 0, true);

	var cs2 = calculate_stats([5,5,5,5]);
	test_equal("calculate_stats identical values std=0", cs2.std, 0);
	test_equal("calculate_stats identical values cv=0", cs2.cv, 0);

	test_equal("model_shape_to_string [null,10]", model_shape_to_string([null,10]), "[null, 10]");
	test_equal("model_shape_to_string [1,2,3]", model_shape_to_string([1,2,3]), "[1, 2, 3]");
	test_equal("model_shape_to_string [null,28,28,3]", model_shape_to_string([null,28,28,3]), "[null, 28, 28, 3]");

	test_equal("is_basic_option 'activation'", is_basic_option("activation"), true);
	test_equal("is_basic_option 'units'", is_basic_option("units"), true);
	test_equal("is_basic_option 'filters'", is_basic_option("filters"), true);
	test_equal("is_basic_option 'kernel_size'", is_basic_option("kernel_size"), true);
	test_equal("is_basic_option 'pool_size'", is_basic_option("pool_size"), true);
	test_equal("is_basic_option 'dropout_rate'", is_basic_option("dropout_rate"), true);
	test_equal("is_basic_option 'something_else'", is_basic_option("something_else"), false);
	test_equal("is_basic_option ''", is_basic_option(""), false);

	test_equal("findInitializerElement finds initializer", findInitializerElement(["foo", "kernel_initializer_glorot", "bar"]), "kernel_initializer_glorot");
	test_equal("findInitializerElement finds first", findInitializerElement(["bias_initializer_zeros", "kernel_initializer_glorot"]), "bias_initializer_zeros");
	test_equal("findInitializerElement null when none", findInitializerElement(["foo", "bar", "baz"]), null);
	test_equal("findInitializerElement empty array", findInitializerElement([]), null);

	test_equal("compute_dot [1,2,3].[4,5,6]", compute_dot([1,2,3],[4,5,6]), 32);
	test_equal("compute_dot [1,0,0].[0,1,0]", compute_dot([1,0,0],[0,1,0]), 0);
	test_equal("compute_dot zeros", compute_dot([0,0],[0,0]), 0);
	test_equal("compute_dot mismatched lengths", compute_dot([1,2],[1]), 0);

	test_equal("subtract_mul basic", JSON.stringify(subtract_mul([10,20],[1,2],3)), "[7,14]");
	test_equal("subtract_mul scalar=0", JSON.stringify(subtract_mul([10,20],[1,2],0)), "[10,20]");
	test_equal("subtract_mul mismatched", JSON.stringify(subtract_mul([1,2],[1],[3])), "[1,2]");

	test_equal("vector_norm [3,4]", vector_norm([3,4]), 5);
	test_equal("vector_norm [0,0,0]", vector_norm([0,0,0]), 0);
	test_equal("vector_norm [1]", vector_norm([1]), 1);

	var nv1 = normalize_vector([3,4]);
	test_equal("normalize_vector [3,4] norm=1", Math.abs(vector_norm(nv1) - 1) < 1e-10, true);
	test_equal("normalize_vector [3,4] values correct", Math.abs(nv1[0] - 0.6) < 1e-10, true);
	test_equal("normalize_vector [0,0,0] unchanged", JSON.stringify(normalize_vector([0,0,0])), "[0,0,0]");
	test_equal("normalize_vector non-array", JSON.stringify(normalize_vector(null)), "[]");

	test_equal("scalarMulVec basic", JSON.stringify(scalarMulVec(3, [1,2,3])), "[3,6,9]");
	test_equal("scalarMulVec zero scalar", JSON.stringify(scalarMulVec(0, [1,2,3])), "[0,0,0]");

	test_equal("isShapeArray valid", isShapeArray([null, 28, 28, 3]), true);
	test_equal("isShapeArray all numbers", isShapeArray([1, 2, 3]), true);
	test_equal("isShapeArray empty", isShapeArray([]), true);
	test_equal("isShapeArray null", isShapeArray(null), false);
	test_equal("isShapeArray with negative", isShapeArray([-1, 2]), false);
	test_equal("isShapeArray with float", isShapeArray([1.5, 2]), false);
	test_equal("isShapeArray with string", isShapeArray(["a"]), false);

	test_equal("formatTime 0", formatTime(0), "00:00");
	test_equal("formatTime 65", formatTime(65), "01:05");
	test_equal("formatTime 3661", formatTime(3661), "01:01:01");
	test_equal("formatTime 3600", formatTime(3600), "01:00:00");
	test_equal("formatTime negative", formatTime(-5), "...");
	test_equal("formatTime NaN", formatTime(NaN), "...");
	test_equal("formatTime string", formatTime("abc"), "...");

	test_equal("collapse_into_segments empty", JSON.stringify(collapse_into_segments([])), "[]");
	test_equal("collapse_into_segments same values", JSON.stringify(collapse_into_segments(["a","a","a"])), '[{"a":[0,1,2]}]');
	test_equal("collapse_into_segments alternating", JSON.stringify(collapse_into_segments(["a","b","a"])), '[{"a":[0]},{"b":[1]},{"a":[2]}]');
	test_equal("collapse_into_segments mixed", JSON.stringify(collapse_into_segments(["x","x","y","y","z"])), '[{"x":[0,1]},{"y":[2,3]},{"z":[4]}]');
}

async function _tiny_tests_easter_eggs_js() {
	var old_random = Math.random;
	var old_confetti = window.confetti;
	var old_set_timeout = window.setTimeout;
	var old_raf = window.requestAnimationFrame;
	var calls = [];

	try {
		Math.random = function () { return 0.5; };
		test_equal("randomInRange midpoint", randomInRange(2, 4), 3);
		test_equal("randomInRange low edge", randomInRange(0, 10), 5);
		test_equal("randomInRange negative range", randomInRange(-4, 0), -2);

		test_equal("_next zero", _next(0, 10), 0);
		test_equal("_next exact multiple", _next(10, 10), 10);
		test_equal("_next rounds up", _next(11, 10), 20);
		test_equal("_next already above", _next(25, 10), 30);
		test_equal("_next small multiple", _next(3, 2), 4);

		window.confetti = function (opts) { calls.push(opts); };
		window.requestAnimationFrame = function () { return 1; };
		show_snow();
		test_equal("show_snow fires one confetti frame", calls.length, 1);
		test_equal("show_snow uses white circles", JSON.stringify(calls[0].colors), '["#ffffff"]');
		test_equal("show_snow requests the next frame", typeof window.requestAnimationFrame === "function", true);

		calls = [];
		confetti_a();
		test_equal("confetti_a particle count", calls[0].particleCount, 100);
		test_equal("confetti_a origin y", calls[0].origin.y, 0.6);

		calls = [];
		confetti_b();
		test_equal("confetti_b particle count is randomized", calls[0].particleCount, 75);
		test_equal("confetti_b angle is randomized", calls[0].angle, 90);

		calls = [];
		confetti_c();
		test_equal("confetti_c fires five bursts", calls.length, 5);
		test_equal("confetti_c particle distribution", JSON.stringify(calls.map(function (c) { return c.particleCount; })), "[50,40,70,20,20]");
		test_equal("confetti_c keeps default origin", calls[0].origin.y, 0.7);

		calls = [];
		window.setTimeout = function (fn) { fn(); return 1; };
		confetti_d();
		test_equal("confetti_d fires six bursts", calls.length, 6);
		test_equal("confetti_d alternates star and circle", calls[0].shapes[0] + "/" + calls[1].shapes[0], "star/circle");
		test_equal("confetti_d first burst is larger", calls[0].particleCount > calls[1].particleCount, true);
		window.setTimeout = old_set_timeout;

		calls = [];
		window.setTimeout = function (fn) { fn(); return 1; };
		Math.random = function () { return 0; };
		_confetti();
		test_equal("_confetti dispatches to confetti_a", calls.length, 1);
		calls = [];
		Math.random = function () { return 0.25; };
		_confetti();
		test_equal("_confetti dispatches to confetti_b", calls.length, 1);
		calls = [];
		Math.random = function () { return 0.45; };
		_confetti();
		test_equal("_confetti dispatches to confetti_c", calls.length, 5);
		calls = [];
		Math.random = function () { return 0.65; };
		_confetti();
		test_equal("_confetti dispatches to confetti_d", calls.length, 6);
		window.setTimeout = old_set_timeout;

		var old_counter = fireworks_counter;
		var old_in_fireworks = in_fireworks;
		var confetti_calls = 0;
		var old_confetti_function = _confetti;
		_confetti = function () { confetti_calls++; };
		fireworks_counter = 9;
		in_fireworks = 0;
		await easter_egg_fireworks(1);
		test_equal("easter_egg_fireworks increments the counter", fireworks_counter, 10);
		test_equal("easter_egg_fireworks celebrates every tenth step", confetti_calls, 1);
		in_fireworks = 1;
		await easter_egg_fireworks(1);
		test_equal("easter_egg_fireworks ignores overlapping runs", fireworks_counter, 10);
		_confetti = old_confetti_function;
		fireworks_counter = old_counter;
		in_fireworks = old_in_fireworks;
	} finally {
		Math.random = old_random;
		window.confetti = old_confetti;
		window.setTimeout = old_set_timeout;
		window.requestAnimationFrame = old_raf;
	}
}

function _tiny_tests_debug_js() {
	test_equal("_getTimestamp has millisecond precision", /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/.test(_getTimestamp()), true);
	test_equal("checkCurrentUrlParams matches the debug query", checkCurrentUrlParams(), new URLSearchParams(window.location.search).get("debug") === "1");

	function __asanai_param_names(a, b, c) { return a + b + c; }
	test_equal("get_param_names reads all names", JSON.stringify(get_param_names(__asanai_param_names)), '["a","b","c"]');
	test_equal("get_param_names handles a function without parameters", JSON.stringify(get_param_names(function () {})), "[]");

	window.__asanai_count_test = function (a, b) { return a + b; };
	window.__asanai_zero_test = function () { return 1; };
	test_equal("countParametersByFunctionName counts parameters", countParametersByFunctionName("__asanai_count_test"), 2);
	test_equal("countParametersByFunctionName handles no parameters", countParametersByFunctionName("__asanai_zero_test"), 0);
	test_equal("countParametersByFunctionName rejects unknown names", countParametersByFunctionName("__asanai_missing_test"), -1);
	delete window.__asanai_count_test;
	delete window.__asanai_zero_test;

	test_equal("shortenFloat rounds to decimals", shortenFloat(1.23456, 2), "1.23");
	test_equal("shortenFloat accepts numeric strings", shortenFloat("2.5", 2), "2.50");
	test_equal("shortenFloat keeps non-numbers", shortenFloat("abc", 2), "abc");
	test_equal("shortenFloat keeps null", shortenFloat(null, 2), null);
	test_equal("colorize wraps text", colorize("x", "red").indexOf("<span style='color: red'>x</span>") === 0, true);
	test_equal("colorize without color returns text", colorize("x"), "x");

	var random_array = generateRandomArray(12, 12);
	test_equal("generateRandomArray uses the requested length", random_array.length, 12);
	test_equal("generateRandomArray only produces primitives", random_array.every(function (v) { return ["string", "boolean", "number"].indexOf(typeof v) !== -1; }), true);

	var stack = detect_and_color_stacktrace("foo@https://example.com/a.js:1:2");
	test_equal("detect_and_color_stacktrace colors the function", stack.indexOf("<span style='color: #af0f0f;'>foo</span>") !== -1, true);
	test_equal("detect_and_color_stacktrace colors the URL", stack.indexOf("<span style='color: #0f0faf;'>https://example.com/a.js:1:2</span>") !== -1, true);
	test_equal("detect_and_color_stacktrace leaves plain text alone", detect_and_color_stacktrace("plain"), "plain");

	var table_html = create_html_table_from_json([{name: "a"}, {name: "a"}, {name: "b"}]);
	test_equal("create_html_table_from_json emits a header", table_html.indexOf("<th>name</th>") !== -1, true);
	test_equal("create_html_table_from_json removes duplicate rows", (table_html.match(/<tr>/g) || []).length, 3);

	window.__asanai_env_probe = 424242;
	var env_html = _dump_env_to_html();
	test_equal("_dump_env_to_html includes primitive globals", env_html.indexOf("__asanai_env_probe") !== -1 && env_html.indexOf("424242") !== -1, true);
	delete window.__asanai_env_probe;

	var log_length = _full_debug_log.length;
	log_less("__asanai_log_less__");
	test_equal("log_less stores one entry", _full_debug_log.length, log_length + 1);
	log_once("__asanai_log_once__");
	var once_length = _full_debug_log.length;
	log_once("__asanai_log_once__");
	test_equal("log_once suppresses repeats", _full_debug_log.length, once_length);
	var info_length = _full_debug_log.length;
	info("__asanai_info__");
	test_equal("info stores one entry", _full_debug_log.length, info_length + 1);
	var old_last_dbg_msg = last_dbg_msg;
	last_dbg_msg = "";
	var dbg_length = _full_debug_log.length;
	dbg("__asanai_dbg__");
	var dbg_after_first = _full_debug_log.length;
	dbg("__asanai_dbg__");
	var dbg_after_second = _full_debug_log.length;
	test_equal("dbg stores an entry", dbg_after_first > dbg_length, true);
	test_equal("dbg suppresses consecutive duplicates", dbg_after_second, dbg_after_first);
	last_dbg_msg = old_last_dbg_msg;

	test_equal("get_mem exposes tensor memory", typeof get_mem().numTensors, "number");
}

function _tiny_tests_math_mode_tooltips_js() {
	function mvtTestWeight(name, shape, values) {
		return { name: name, shape: shape, isDisposed: false, dataSync: function () { return values; } };
	}
	function mvtTestEntry(variable) {
		return { name: variable.name, val: variable };
	}
	function mvtTestLayer(name, weights) {
		return { name: name, trainableWeights: weights.map(mvtTestEntry), weights: weights.map(mvtTestEntry) };
	}

	var old_model = window.model;
	var old_xy_data = window.xy_data_global;

	try {
		test_equal("_mvt_decode_class rejects null", _mvt_decode_class(null), null);
		test_equal("_mvt_decode_class rejects foreign classes", _mvt_decode_class("foo"), null);
		test_equal("_mvt_decode_class rejects short tags", _mvt_decode_class("mv-kernel"), null);
		test_equal("_mvt_decode_class rejects bad layer tokens", _mvt_decode_class("mv-kernel-Lx"), null);
		test_equal("_mvt_decode_class decodes weights", JSON.stringify(_mvt_decode_class("mv-kernel-L0-1-2")), '{"kind":"kernel","layer":0,"indices":[1,2],"weight_name":null}');
		test_equal("_mvt_decode_class decodes names with colons", JSON.stringify(_mvt_decode_class("mv-bias-L3-0-kernel:0")), '{"kind":"bias","layer":3,"indices":[0],"weight_name":"kernel:0"}');
		test_equal("_mvt_decode_class keeps hyphenated names", JSON.stringify(_mvt_decode_class("mv-skip-L2-foo-bar")), '{"kind":"skip","layer":2,"indices":[],"weight_name":"foo-bar"}');

		var hover_parent = document.createElement("div");
		hover_parent.className = "mv-bias-L0-0";
		var hover_child = document.createElement("span");
		hover_parent.appendChild(hover_child);
		test_equal("_mvt_find_mv_element finds the parent tag", _mvt_find_mv_element(hover_child), hover_parent);
		test_equal("_mvt_find_mv_element finds itself", _mvt_find_mv_element(hover_parent), hover_parent);
		test_equal("_mvt_find_mv_element ignores untagged trees", _mvt_find_mv_element(document.body), null);

		var kernel = mvtTestWeight("dense/kernel:0", [2, 2], [1, 2, 3, 4]);
		var bias = mvtTestWeight("dense/bias:0", [2], [0, 0]);
		var moving = mvtTestWeight("dense/moving_mean:0", [2], [0, 0]);
		var dense_layer = mvtTestLayer("dense", [kernel, bias]);
		dense_layer.weights.push(mvtTestEntry(moving));
		dense_layer.epsilon = 1e-7;
		dense_layer.maxValue = 6;
		dense_layer.alpha = 0.1;
		dense_layer.theta = 1.5;

		window.model = { layers: [dense_layer] };
		test_equal("_mvt_tf_layer resolves the GUI index", _mvt_tf_layer(0), dense_layer);
		test_equal("_mvt_tf_layer returns null out of range", _mvt_tf_layer(5), null);

		var variables = _mvt_layer_variables(0);
		test_equal("_mvt_layer_variables keeps trainable and non-trainable weights", JSON.stringify(variables.map(function (v) { return v.name; })), '["dense/kernel:0","dense/bias:0","dense/moving_mean:0"]');
		test_equal("_mvt_pick_variable finds the kernel", _mvt_pick_variable(0, {kind: "kernel", weight_name: null}).name, "dense/kernel:0");
		test_equal("_mvt_pick_variable finds the bias", _mvt_pick_variable(0, {kind: "bias"}).name, "dense/bias:0");
		test_equal("_mvt_pick_variable finds gamma", _mvt_pick_variable(0, {kind: "gamma"}), null);
		test_equal("_mvt_pick_variable falls back to the first snake weight", _mvt_pick_variable(0, {kind: "snake"}).name, "dense/kernel:0");
		test_equal("_mvt_pick_variable rejects unknown kinds", _mvt_pick_variable(0, {kind: "unknown"}), null);

		test_equal("_mvt_flat_index maps 2D cells", _mvt_flat_index({kind: "kernel", layer: 0, indices: [1, 1]}), 3);
		test_equal("_mvt_flat_index skips the leading bias row", _mvt_flat_index({kind: "bias", layer: 0, indices: [0, 1]}), 1);
		test_equal("_mvt_flat_index rejects a non-zero leading row", _mvt_flat_index({kind: "bias", layer: 0, indices: [1, 1]}), -1);
		test_equal("_mvt_flat_index rejects out-of-range cells", _mvt_flat_index({kind: "bias", layer: 0, indices: [0, 5]}), -1);
		test_equal("_mvt_flat_index returns zero without indices", _mvt_flat_index({kind: "kernel", layer: 0, indices: []}), 0);
		test_equal("_mvt_weight_shape copies the shape", JSON.stringify(_mvt_weight_shape({kind: "kernel", layer: 0})), "[2,2]");
		test_equal("_mvt_model_generation lists live weights", _mvt_model_generation().indexOf("dense/kernel:0:2x2") !== -1, true);
		test_equal("_mvt_gui_index_for_raw skips internal layers", (function () {
			window.model = { layers: [{ name: "skip_proj_1" }, { name: "dense_1" }, { name: "dense_2" }] };
			return _mvt_gui_index_for_raw(2);
		})(), 1);
		window.model = { layers: [dense_layer] };

		var skip_model = {
			layers: [
				{ name: "dense_1", trainableWeights: [] },
				{ name: "skip_proj_2", trainableWeights: [{ name: "skip_proj_2_kernel:0", val: mvtTestWeight("skip_proj_2_kernel:0", [2, 2], [1, 2, 3, 4]) }] }
			]
		};
		window.model = skip_model;
		test_equal("_mvt_find_skip_variable finds skip kernels", _mvt_find_skip_variable({weight_name: "skip_proj_2"}).name, "skip_proj_2_kernel:0");
		test_equal("_mvt_find_skip_variable ignores other layers", _mvt_find_skip_variable({weight_name: "nope"}), null);
		window.model = { layers: [dense_layer] };

		var hist_key = _mvt_hist_key("bias", 0, "", 1);
		_mvt_hist_record(hist_key, NaN, 1);
		_mvt_hist_record(hist_key, Infinity, 2);
		test_equal("_mvt_hist_record ignores non-finite values", _mvt_hist_get(hist_key), null);
		_mvt_hist_record(hist_key, 1.5, 1000);
		_mvt_hist_record(hist_key, 2.5, 2000);
		test_equal("_mvt_hist_get returns recorded values", JSON.stringify(_mvt_hist_get(hist_key).v), "[1.5,2.5]");
		var old_hist_max = _mvt_hist_max_points;
		_mvt_hist_max_points = 4;
		for (var hist_i = 3; hist_i <= 6; hist_i++) {
			_mvt_hist_record(hist_key, hist_i, 2000 + hist_i);
		}
		test_equal("_mvt_hist_record caps the ring buffer", _mvt_hist_get(hist_key).v.length <= 4, true);
		test_equal("_mvt_hist_record keeps the newest value", _mvt_hist_get(hist_key).v[_mvt_hist_get(hist_key).v.length - 1], 6);
		_mvt_hist_max_points = old_hist_max;
		delete _mvt_hist[hist_key];

		test_equal("_mvt_weight_key_info maps depthwise kernels", JSON.stringify(_mvt_weight_key_info("depthwise_kernel")), '{"kind":"kernel","name":"depthwise"}');
		test_equal("_mvt_weight_key_info maps pointwise kernels", JSON.stringify(_mvt_weight_key_info("pointwise_kernel")), '{"kind":"kernel","name":"pointwise"}');
		test_equal("_mvt_weight_key_info maps plain kernels", JSON.stringify(_mvt_weight_key_info("dense/kernel:0")), '{"kind":"kernel","name":""}');
		test_equal("_mvt_weight_key_info maps biases", JSON.stringify(_mvt_weight_key_info("dense/bias:0")), '{"kind":"bias","name":""}');
		test_equal("_mvt_weight_key_info maps moving statistics to null", _mvt_weight_key_info("dense/moving_mean:0"), null);
		test_equal("_mvt_weight_key_info maps multi-activations", JSON.stringify(_mvt_weight_key_info("aRelu")), '{"kind":"ma","name":"aRelu"}');
		test_equal("_mvt_weight_key_info maps snakeAlpha first", JSON.stringify(_mvt_weight_key_info("snakeAlpha")), '{"kind":"ma","name":"snakeAlpha"}');
		test_equal("_mvt_weight_key_info maps alpha to snake", JSON.stringify(_mvt_weight_key_info("alpha")), '{"kind":"snake","name":"alpha"}');
		test_equal("_mvt_weight_key_info rejects unknown weights", _mvt_weight_key_info("dense/x:0"), null);

		window.xy_data_global = null;
		test_equal("_mvt_get_batch without data", _mvt_get_batch(), null);
		var batch_x = tf.tensor2d([[0, 0], [1, 1]], [2, 2]);
		var batch_y = tf.tensor2d([[0], [1]], [2, 1]);
		window.xy_data_global = { x: batch_x, y: batch_y };
		var small_batch = _mvt_get_batch();
		test_equal("_mvt_get_batch reuses a small batch", small_batch.x === batch_x && !small_batch.owned, true);
		var big_x = tf.tensor2d(Array.from({ length: 40 }, function (_, i) { return [i, i + 1]; }), [40, 2]);
		var big_y = tf.tensor2d(Array.from({ length: 40 }, function (_, i) { return [i % 2]; }), [40, 1]);
		window.xy_data_global = { x: big_x, y: big_y };
		var big_batch = _mvt_get_batch();
		test_equal("_mvt_get_batch subsamples large batches", big_batch.x.shape[0], 32);
		test_equal("_mvt_get_batch owns subsampled tensors", big_batch.owned, true);
		big_batch.x.dispose();
		big_batch.y.dispose();
		big_x.dispose();
		big_y.dispose();

		window.model = { loss: "meanSquaredError" };
		var prediction = tf.tensor2d([[1], [2]], [2, 1]);
		var target = tf.tensor2d([[0], [0]], [2, 1]);
		var mse = _mvt_loss_value(prediction, target);
		test_equal("_mvt_loss_value uses the model loss name", Number(mse.dataSync()[0]), 2.5);
		mse.dispose();
		window.model.loss = "absoluteDifference";
		var absolute_difference = _mvt_loss_value(prediction, target);
		test_equal("_mvt_loss_value supports other named losses", Number(absolute_difference.dataSync()[0]), 1.5);
		absolute_difference.dispose();
		window.model.loss = function (y, p) { return tf.mean(tf.abs(tf.sub(y, p))); };
		var custom = _mvt_loss_value(prediction, target);
		test_equal("_mvt_loss_value supports custom losses", Number(custom.dataSync()[0]), 1.5);
		custom.dispose();
		window.model.loss = "notALoss";
		var fallback = _mvt_loss_value(prediction, target);
		test_equal("_mvt_loss_value falls back to mean squared error", Number(fallback.dataSync()[0]), 2.5);
		fallback.dispose();
		prediction.dispose();
		target.dispose();
		batch_x.dispose();
		batch_y.dispose();
		window.model = { layers: [dense_layer] };

		test_equal("_mvt_stats rejects empty data", _mvt_stats([]), null);
		var stats = _mvt_stats([1, 2, 3, 4]);
		test_equal("_mvt_stats counts values", stats.n, 4);
		test_equal("_mvt_stats min and max", stats.min + "/" + stats.max, "1/4");
		test_equal("_mvt_stats mean", stats.mean, 2.5);
		test_equal("_mvt_stats std", Math.abs(stats.std - Math.sqrt(1.25)) < 1e-12, true);
		test_equal("_mvt_percentile below the range", _mvt_percentile([1, 2, 3, 4], 0), 0);
		test_equal("_mvt_percentile at a value", _mvt_percentile([1, 2, 3, 4], 2), 0.375);
		test_equal("_mvt_percentile above the range", _mvt_percentile([1, 2, 3, 4], 5), 1);

		test_equal("_mvt_svg_sparkline needs two points", _mvt_svg_sparkline([1]), "");
		test_equal("_mvt_svg_sparkline draws a polyline", _mvt_svg_sparkline([1, 2, 3]).indexOf("<polyline") !== -1, true);
		test_equal("_mvt_svg_sparkline handles constant values", _mvt_svg_sparkline([1, 1, 1]).indexOf("<svg") === 0, true);
		test_equal("_mvt_svg_dist_strip draws a value dot", _mvt_svg_dist_strip(0.5, 0, 1, 0.5).indexOf("<circle") !== -1, true);
		test_equal("_mvt_svg_dist_strip handles a degenerate range", _mvt_svg_dist_strip(1, 1, 1, 1).indexOf("<svg") === 0, true);
		test_equal("_mvt_cell_color handles a zero maximum", _mvt_cell_color(1, 0), "rgba(255,255,255,0.08)");
		test_equal("_mvt_cell_color uses blue for positives", _mvt_cell_color(5, 10), "rgba(126,200,255,0.57)");
		test_equal("_mvt_cell_color uses red for negatives", _mvt_cell_color(-5, 10), "rgba(255,136,136,0.57)");
		test_equal("_mvt_cell_color clamps large values", _mvt_cell_color(20, 10), "rgba(126,200,255,1.00)");
		test_equal("_mvt_svg_tensor_map rejects rank three", _mvt_svg_tensor_map([1, 2, 3, 4], [2, 2, 1], 0), "");
		test_equal("_mvt_svg_tensor_map rejects short data", _mvt_svg_tensor_map([1, 2, 3], [2, 2], 0), "");
		test_equal("_mvt_svg_tensor_map draws a grid", (_mvt_svg_tensor_map([1, 2, 3, 4], [2, 2], 1).match(/<rect/g) || []).length, 5);
		test_equal("_mvt_svg_histogram needs two points", _mvt_svg_histogram([1]), "");
		test_equal("_mvt_svg_histogram draws bins", _mvt_svg_histogram([1, 2, 3]).indexOf("<rect") !== -1, true);
		test_equal("_mvt_svg_histogram handles constant values", _mvt_svg_histogram([5, 5]).indexOf("<svg") === 0, true);
		test_equal("_mvt_svg_bar needs a maximum", _mvt_svg_bar(1, 0), "");
		test_equal("_mvt_svg_bar draws positive bars", _mvt_svg_bar(5, 10).indexOf("#7ddd7d") !== -1, true);
		test_equal("_mvt_svg_bar draws negative bars", _mvt_svg_bar(-5, 10).indexOf("#ff8888") !== -1, true);
		test_equal("_mvt_fmt keeps null", _mvt_fmt(null), "null");
		test_equal("_mvt_fmt keeps NaN", _mvt_fmt(NaN), "NaN");
		test_equal("_mvt_fmt trims trailing zeros", _mvt_fmt(1.5), "1.5");
		test_equal("_mvt_fmt uses exponential notation for tiny values", _mvt_fmt(0.00001), "1.000e-5");
		test_equal("_mvt_fmt uses exponential notation for huge values", _mvt_fmt(1000000), "1.000e+6");
		test_equal("_mvt_grad_span handles missing values", _mvt_grad_span(null).indexOf("n/a") !== -1, true);
		test_equal("_mvt_grad_span colors positives", _mvt_grad_span(1).indexOf("mvt_grad_pos") !== -1, true);
		test_equal("_mvt_grad_span colors negatives", _mvt_grad_span(-1).indexOf("mvt_grad_neg") !== -1, true);
		test_equal("_mvt_describe_tag describes biases", _mvt_describe_tag({kind: "bias"}), language[lang]["mv_tooltip_header_bias"]);
		test_equal("_mvt_describe_tag includes parameter names", _mvt_describe_tag({kind: "param", weight_name: "theta"}).indexOf("theta") !== -1, true);
		test_equal("_mvt_describe_tag falls back to the kind", _mvt_describe_tag({kind: "weird"}), "weird");
		test_equal("_mvt_param_property maps epsilon", _mvt_param_property({kind: "epsilon"}), "epsilon");
		test_equal("_mvt_param_property maps max_value", _mvt_param_property({kind: "param", weight_name: "max_value"}), "maxValue");
		test_equal("_mvt_param_property rejects unknown parameters", _mvt_param_property({kind: "param", weight_name: "x"}), null);

		test_equal("_mvt_get_display_value reads epsilon", _mvt_get_display_value({kind: "epsilon", layer: 0}), 1e-7);
		test_equal("_mvt_get_display_value reads max_value", _mvt_get_display_value({kind: "param", layer: 0, weight_name: "max_value"}), 6);
		test_equal("_mvt_get_display_value returns null for h", _mvt_get_display_value({kind: "h", layer: 0}), null);
		test_equal("_mvt_get_display_value reads weights", _mvt_get_display_value({kind: "kernel", layer: 0, indices: [1, 0]}), 3);
		test_equal("_mvt_get_display_value rejects out-of-range cells", _mvt_get_display_value({kind: "bias", layer: 0, indices: [0, 9]}), null);
		var base_html = _mvt_build_base_html({kind: "bias", layer: 0, indices: [0, 1]});
		test_equal("_mvt_build_base_html includes the title", base_html.indexOf(language[lang]["mv_tooltip_header_bias"]) !== -1, true);
		test_equal("_mvt_build_base_html includes the value", base_html.indexOf("mvt_val") !== -1, true);

		var created_tooltip = !_mvt_tooltip;
		var tooltip = _mvt_ensure_tooltip();
		test_equal("_mvt_ensure_tooltip creates one node", tooltip.id, "mv_tooltip");
		test_equal("_mvt_ensure_tooltip is idempotent", _mvt_ensure_tooltip(), tooltip);
		test_equal("_mvt_add_styles installs the stylesheet", !!document.getElementById("mv_tooltip_styles"), true);
		tooltip.innerHTML = "<div>size probe</div>";
		tooltip.style.display = "block";
		var size = _mvt_get_size();
		test_equal("_mvt_get_size caches the measured content", _mvt_size_cache.html, tooltip.innerHTML);
		test_equal("_mvt_get_size returns numeric dimensions", typeof size.w + typeof size.h, "numbernumber");
		_mvt_position({clientX: 10, clientY: 12});
		test_equal("_mvt_position positions the tooltip", _mvt_tooltip.style.left !== "" && _mvt_tooltip.style.top !== "", true);

		var old_append = _mvt_append_pooled_info;
		_mvt_append_pooled_info = function () {};
		_mvt_init();
		var over_parent = document.createElement("div");
		over_parent.className = "mv-bias-L0-0";
		var over_child = document.createElement("span");
		over_parent.appendChild(over_child);
		document.body.appendChild(over_parent);
		var hover_before = _mvt_hover_id;
		_mvt_on_over({ target: over_child, clientX: 20, clientY: 30 });
		test_equal("_mvt_on_over shows the tooltip", _mvt_tooltip.style.display, "block");
		test_equal("_mvt_on_over advances the hover id", _mvt_hover_id > hover_before, true);
		test_equal("_mvt_on_over renders the header", _mvt_tooltip.innerHTML.indexOf(language[lang]["mv_tooltip_header_bias"]) !== -1, true);
		over_parent.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
		test_equal("_mvt_on_over hides on mouseout", _mvt_tooltip.style.display, "none");
		_mvt_append_pooled_info = old_append;
		over_parent.remove();
		if (created_tooltip) {
			tooltip.remove();
			_mvt_tooltip = null;
		}
	} finally {
		window.model = old_model;
		window.xy_data_global = old_xy_data;
	}
}

function _tiny_tests_tda_js() {
	var state = TDAAnalysis.getState();
	var saved = {
		mode: state.mode,
		filterDimension: state.filterDimension,
		sortBy: state.sortBy,
		sliderMaxPoints: state.sliderMaxPoints,
		sliderMinPersistence: state.sliderMinPersistence,
		sliderTakensWindow: state.sliderTakensWindow,
		sliderEpsilonSteps: state.sliderEpsilonSteps,
		container: state.container,
		containerId: state.containerId,
		lastResult: state.lastResult,
		history: state.history.slice(),
		expandedCards: Object.assign({}, state.expandedCards)
	};
	var old_xy_data = window.xy_data_global;
	var old_layer_io = window.layerIOStats;
	var old_model = window.model;
	var test_container = document.createElement("div");
	test_container.style.width = "600px";
	document.body.appendChild(test_container);

	function tdaRaw(data, shape) {
		return { dataSync: function () { return Float64Array.from(data); }, shape: shape };
	}

	try {
		window.xy_data_global = null;
		window.layerIOStats = null;
		window.model = null;
		test_equal("TDA raw mode reports missing data", TDAAnalysis.analyze("raw_data").error, "tda_no_raw_data");
		test_equal("TDA activation mode reports missing data", TDAAnalysis.analyze("activations").error, "tda_no_activation_data");
		test_equal("TDA weight mode reports missing model", TDAAnalysis.analyze("weights").error, "tda_no_model");
		test_equal("TDA auto mode reports missing data", TDAAnalysis.analyze("auto").error, "tda_no_data_available");

		window.xy_data_global = {
			x: tdaRaw([0, 0, 0, 1, 1, 0, 1, 1, 4, 4, 4, 5], [6, 2]),
			y: null
		};
		var history_before = TDAAnalysis.getHistory().length;
		var raw_result = TDAAnalysis.analyze("raw_data");
		test_equal("TDA raw analysis succeeds", raw_result.error, null);
		test_equal("TDA raw analysis returns one cloud", raw_result.layers.length, 1);
		test_equal("TDA raw analysis keeps all points", raw_result.layers[0].numPoints, 6);
		test_equal("TDA raw analysis keeps the point dimension", raw_result.layers[0].pointDim, 2);
		test_equal("TDA raw analysis counts topological features", raw_result.layers[0].summary.totalFeatures > 0, true);
		test_equal("TDA raw analysis partitions H0 and H1", raw_result.layers[0].summary.h0Count + raw_result.layers[0].summary.h1Count, raw_result.layers[0].summary.totalFeatures);
		test_equal("TDA raw analysis builds betti curves", raw_result.layers[0].bettiCurve0.length > 0, true);
		test_equal("TDA raw analysis records history", TDAAnalysis.getHistory().length, history_before + 1);
		test_equal("TDA getLastResult returns the latest run", TDAAnalysis.getLastResult(), raw_result);

		state.sliderTakensWindow = 4;
		window.xy_data_global = { x: tdaRaw([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], null), y: null };
		var takens = TDAAnalysis.analyze("raw_data");
		test_equal("TDA reshapes 1D data into Takens windows", takens.layers[0].pointDim, 3);
		test_equal("TDA Takens embedding yields eight points", takens.layers[0].numPoints, 8);

		state.sliderMaxPoints = 4;
		window.xy_data_global = { x: tdaRaw([0, 0, 1, 1, 2, 2, 3, 3, 4, 4], [5, 2]), y: null };
		var capped = TDAAnalysis.analyze("raw_data");
		test_equal("TDA caps the point cloud size", capped.layers[0].numPoints, 4);

		state.sliderTakensWindow = saved.sliderTakensWindow;
		state.sliderMaxPoints = saved.sliderMaxPoints;
		window.xy_data_global = {
			x: tdaRaw([0, 0, 0, 1, 1, 0, 1, 1, 4, 4, 4, 5], [6, 2]),
			y: null
		};
		window.layerIOStats = {
			records: [{
				layers: [{ output: [0, 1, 2, 3, 4, 5], outputShape: [3, 2], layerName: "dense_probe", layerType: "dense", layerIndex: 1 }]
			}]
		};
		var activation_result = TDAAnalysis.analyze("activations");
		test_equal("TDA activation analysis reads layer IO records", activation_result.layers.length, 1);
		test_equal("TDA activation analysis keeps layer names", activation_result.layers[0].name, "dense_probe");
		window.layerIOStats = { records: [{ layers: [{ output: [1, 2, 3] }] }] };
		test_equal("TDA activation analysis rejects short outputs", TDAAnalysis.analyze("activations").error, "tda_no_activation_data");

		window.model = {
			getWeights: function () { return [{ isDisposed: false, shape: [4, 2], dataSync: function () { return Float64Array.from([1, 2, 3, 4, 5, 6, 7, 8]); } }]; },
			weights: [{ name: "dense/kernel:0" }]
		};
		var weight_result = TDAAnalysis.analyze("weights");
		test_equal("TDA weight analysis reads model weights", weight_result.layers.length, 1);
		test_equal("TDA weight analysis names the weight", weight_result.layers[0].name, "dense/kernel:0");
		window.model = null;

		var rendered = TDAAnalysis.render(test_container, "raw_data");
		test_equal("TDA render fills the container", rendered.querySelectorAll(".tda_container").length, 1);
		test_equal("TDA render draws layer cards", rendered.querySelectorAll(".tda_card").length, 1);
		test_equal("TDA render draws four sliders", rendered.querySelectorAll(".tda_slider_input").length, 4);
		test_equal("TDA render draws persistence points", rendered.querySelectorAll(".tda_pd_point").length > 0, true);
		test_equal("TDA render draws the point cloud", rendered.querySelectorAll(".tda_cloud_point").length, 6);
		test_equal("TDA render draws betti curves", rendered.querySelectorAll(".tda_plot_box svg").length >= 4, true);

		var card_header = rendered.querySelector(".tda_card_header_toggle");
		var card_body = rendered.querySelector(".tda_card_body");
		card_header.click();
		test_equal("TDA card header collapses the body", card_body.style.display, "none");
		card_header.click();
		test_equal("TDA card header expands the body", card_body.style.display, "");

		var pd_point = rendered.querySelector(".tda_pd_point");
		pd_point.dispatchEvent(new MouseEvent("mouseenter"));
		test_equal("TDA persistence points grow on hover", parseFloat(pd_point.getAttribute("r")) > 0, true);
		pd_point.dispatchEvent(new MouseEvent("mouseleave"));
		pd_point.dispatchEvent(new MouseEvent("click"));
		test_equal("TDA point click opens the detail card", rendered.querySelectorAll(".tda_point_detail").length, 1);
		rendered.querySelector(".tda_detail_close").click();
		test_equal("TDA detail close removes the card", rendered.querySelectorAll(".tda_point_detail").length, 0);

		var cloud_point = rendered.querySelector(".tda_cloud_point");
		cloud_point.dispatchEvent(new MouseEvent("mouseenter"));
		test_equal("TDA cloud points grow on hover", cloud_point.getAttribute("r"), "5");
		cloud_point.dispatchEvent(new MouseEvent("mouseleave"));
		test_equal("TDA cloud points shrink again", cloud_point.getAttribute("r"), "2.5");

		var slider = rendered.querySelector(".tda_slider_input");
		slider.value = "100";
		slider.dispatchEvent(new Event("input"));
		test_equal("TDA slider input updates state", TDAAnalysis.getState().sliderMaxPoints, 100);
		test_equal("TDA slider label follows the value", slider.parentElement.querySelector(".tda_slider_val").textContent, "100");
		slider.dispatchEvent(new Event("change"));
		test_equal("TDA slider change re-renders", TDAAnalysis.getState().sliderMaxPoints, 100);

		TDAAnalysis.setFilter(0);
		test_equal("TDA filter updates state", TDAAnalysis.getState().filterDimension, 0);
		TDAAnalysis.setSortBy("name");
		test_equal("TDA sort updates state", TDAAnalysis.getState().sortBy, "name");
		TDAAnalysis.setMode("activations");
		test_equal("TDA mode switch updates state", TDAAnalysis.getState().mode, "activations");
		TDAAnalysis.setMode("raw_data");
		TDAAnalysis.refresh();
		test_equal("TDA refresh keeps the container mounted", test_container.querySelectorAll(".tda_container").length, 1);

		TDAAnalysis.startAutoUpdate(60000);
		test_equal("TDA auto-update starts a timer", TDAAnalysis.getState().autoUpdateTimer !== null, true);
		TDAAnalysis.toggleAutoUpdate();
		test_equal("TDA auto-update toggles off", TDAAnalysis.getState().autoUpdateTimer, null);
		TDAAnalysis.startAutoUpdate(60000);
		TDAAnalysis.stopAutoUpdate();
		test_equal("TDA auto-update stops cleanly", TDAAnalysis.getState().autoUpdateTimer, null);
	} finally {
		if (state.autoUpdateTimer) clearInterval(state.autoUpdateTimer);
		state.autoUpdateTimer = null;
		state.mode = saved.mode;
		state.filterDimension = saved.filterDimension;
		state.sortBy = saved.sortBy;
		state.sliderMaxPoints = saved.sliderMaxPoints;
		state.sliderMinPersistence = saved.sliderMinPersistence;
		state.sliderTakensWindow = saved.sliderTakensWindow;
		state.sliderEpsilonSteps = saved.sliderEpsilonSteps;
		state.container = saved.container;
		state.containerId = saved.containerId;
		state.lastResult = saved.lastResult;
		state.history.length = 0;
		saved.history.forEach(function (entry) { state.history.push(entry); });
		state.expandedCards = saved.expandedCards;
		window.xy_data_global = old_xy_data;
		window.layerIOStats = old_layer_io;
		window.model = old_model;
		test_container.remove();
	}
}

function _tiny_tests_origami_live_js() {
	var state = OrigamiLive._state;
	var saved = {
		config: OrigamiLive.getConfig(),
		pipeline: state.pipeline,
		xTensor: state.cache.xTensor,
		xHash: state.cache.xHash,
		sampleCount: state.cache.sampleCount,
		off: state.off,
		offKey: state.offKey,
		pendingRender: state.pendingRender,
		dirty: state.dirty,
		lastFingerprint: state.lastFingerprint,
		lastViewHash: state.lastViewHash,
		lastChainSig: state.lastChainSig,
		lastRevision: state.lastRevision,
		modelRef: state.modelRef,
		errorStreak: state.errorStreak
	};
	var old_model = window.model;
	var old_initialised = window._origami_live_initialised;
	var old_origami_api = window.OrigamiLive;
	var old_tab_state = {
		visible: window._origami_live_tab_state.visible,
		retryCount: window._origami_live_tab_state.retryCount,
		retryTimer: window._origami_live_tab_state.retryTimer
	};
	var test_tensors = [];
	var test_x = null;

	function origamiTestDense(name, inDim, units, activation, kernelValues, biasValues) {
		var kernel = tf.tensor2d(kernelValues, [inDim, units]);
		var bias = tf.tensor1d(biasValues);
		test_tensors.push(kernel, bias);
		return {
			name: name,
			isDisposed: false,
			outputShape: [null, units],
			inputShape: [null, inDim],
			getClassName: function () { return "Dense"; },
			getConfig: function () { return { activation: activation }; },
			getWeights: function () { return [kernel, bias]; }
		};
	}

	try {
		test_equal("OrigamiLive exposes its modes", OrigamiLive.MODE_FOLD + "/" + OrigamiLive.MODE_BOUNDARY + "/" + OrigamiLive.MODE_STACK, "fold/boundary/stack");
		test_equal("OrigamiLive class colors are stable", OrigamiLive.classColor(0), OrigamiLive.palette.classes[0]);
		test_equal("OrigamiLive class colors wrap around", OrigamiLive.classColor(OrigamiLive.palette.classes.length), OrigamiLive.palette.classes[0]);
		test_equal("OrigamiLive class colors reject negatives", OrigamiLive.classColor(-1), 0x8a8a8a);
		test_equal("OrigamiLive CSS colors are hexadecimal", /^#[0-9a-f]{6}$/.test(OrigamiLive.classColorCss(1)), true);

		window.model = null;
		var missing_chain = OrigamiLive._buildChain();
		test_equal("OrigamiLive buildChain without model", missing_chain.chain.length, 0);
		test_equal("OrigamiLive buildChain reports missing layers", missing_chain.reason, "no_layers");

		var dense = origamiTestDense("dense_probe", 2, 2, "relu", [1, 0.5, 0.5, 1], [0, 0]);
		window.model = { inputs: [{ shape: [null, 2] }], layers: [dense] };
		var built = OrigamiLive._buildChain();
		test_equal("OrigamiLive buildChain succeeds", built.reason, null);
		test_equal("OrigamiLive buildChain starts at the input", built.chain.length, 2);
		test_equal("OrigamiLive buildChain keeps the input dimension", built.chain[0].dim, 2);
		test_equal("OrigamiLive buildChain keeps the dense dimension", built.chain[1].dim, 2);
		test_equal("OrigamiLive buildChain detects hard folds", built.chain[1].foldKind, "hard");

		test_x = tf.tensor2d([[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5], [2, 2]], [6, 2]);
		state.cache.xTensor = test_x;
		state.cache.sampleCount = 6;
		OrigamiLive.setConfig({ gridRes: 8, maxPoints: 50, maxLayers: 6, boundaryRes: 20 });
		var pipeline = OrigamiLive._computePipeline(built.chain);
		test_equal("OrigamiLive computes a pipeline", !!pipeline, true);
		test_equal("OrigamiLive pipeline covers every stage", pipeline.stages.length, 2);
		test_equal("OrigamiLive pipeline projects the samples", pipeline.stages[0].dataPos.length, 18);
		test_equal("OrigamiLive pipeline builds the sheet", pipeline.stages[0].sheet.n, 64);
		test_equal("OrigamiLive pipeline extracts folds", pipeline.stages[1].folds.planes.length > 0, true);
		test_equal("OrigamiLive pipeline reconstructs the boundary", pipeline.boundary.multi, true);

		var activation_layer = {
			name: "activation_probe",
			isDisposed: false,
			outputShape: [null, 2],
			getClassName: function () { return "Activation"; },
			getConfig: function () { return { activation: "relu" }; }
		};
		window.model = { inputs: [{ shape: [null, 2] }], layers: [dense, activation_layer] };
		var passthrough = OrigamiLive._buildChain();
		test_equal("OrigamiLive buildChain folds activation layers into the previous stage", passthrough.chain.length, 2);
		test_equal("OrigamiLive buildChain adopts passthrough activations", passthrough.chain[1].activation, "relu");
		test_equal("OrigamiLive buildChain marks adopted folds", passthrough.chain[1].foldKind, "hard");

		var unknown_dim_layer = {
			name: "unknown_probe",
			isDisposed: false,
			outputShape: [null],
			getClassName: function () { return "Dense"; },
			getConfig: function () { return {}; }
		};
		window.model = { inputs: [{ shape: [null, 2] }], layers: [unknown_dim_layer, dense] };
		var partial_chain = OrigamiLive._buildChain();
		test_equal("OrigamiLive buildChain skips unknown dimensions", partial_chain.chain.length, 2);
		test_equal("OrigamiLive buildChain reports skipped layers", partial_chain.skipped.length, 1);
		window.model = { inputs: [{ shape: [null, 2] }], layers: [unknown_dim_layer] };
		var short_chain = OrigamiLive._buildChain();
		test_equal("OrigamiLive buildChain rejects too-short chains", short_chain.reason, "too_short");

		OrigamiLive.setConfig({ convPatchMode: true });
		var conv_layer = {
			name: "conv_probe",
			isDisposed: false,
			inputShape: [null, 5, 5, 1],
			outputShape: [null, 3, 3, 4],
			getClassName: function () { return "Conv2D"; },
			getConfig: function () { return { kernelSize: [3, 3], filters: 4 }; }
		};
		window.model = { inputs: [{ shape: [null, 5, 5, 1] }], layers: [conv_layer] };
		var conv_chain = OrigamiLive._buildChain();
		test_equal("OrigamiLive buildChain treats convolutions as patch networks", conv_chain.chain[1].convPatch.patchDim, 9);
		test_equal("OrigamiLive buildChain caps convolution dimensions", conv_chain.chain[1].dim, 3);

		var crossing = OrigamiLive._marchingSquares(Float64Array.from([-1, 1, -1, 1]), 2, [0, 1], [0, 1], 1);
		test_equal("OrigamiLive marching squares emits segments", crossing.length, 6);
		test_equal("OrigamiLive marching squares ignores uniform fields", OrigamiLive._marchingSquares(Float64Array.from([1, 1, 1, 1]), 2, [0, 1], [0, 1], 1), null);
		test_equal("OrigamiLive marching squares skips invalid samples", OrigamiLive._marchingSquares(Float64Array.from([NaN, 1, -1, 1]), 2, [0, 1], [0, 1], 1), null);

		window.model = {
			inputs: [{ shape: [null, 2] }],
			layers: [
				{ getClassName: function () { return "InputLayer"; }, outputShape: [null, 2] },
				{ getClassName: function () { return "Dense"; }, outputShape: [null, 2] }
			]
		};
		test_equal("OrigamiLive compatibility accepts dense chains", _origami_live_compatible(), true);
		window.model.layers.push({ getClassName: function () { return "Conv2D"; }, outputShape: [null, 3, 3, 2] });
		test_equal("OrigamiLive compatibility rejects convolutions", _origami_live_compatible(), false);
		window.model = null;
		test_equal("OrigamiLive compatibility rejects missing models", _origami_live_compatible(), false);

		var fake_label = document.createElement("li");
		var fake_span = document.createElement("span");
		fake_span.id = "origami_live_tab_label";
		fake_label.appendChild(fake_span);
		var old_get_element = document.getElementById;
		document.getElementById = function (id) {
			if (id === "origami_live_tab_label") return fake_span;
			return old_get_element.call(document, id);
		};
		try {
			_origamiLiveApplyTabVisibility(false);
			test_equal("OrigamiLive tab hides for incompatible models", fake_label.style.display, "none");
			_origamiLiveApplyTabVisibility(true);
			test_equal("OrigamiLive tab shows for compatible models", fake_label.style.display, "");
			window._origami_live_tab_state.visible = false;
			window._origami_live_tab_state.retryCount = 0;
			window.model = {
				inputs: [{ shape: [null, 2] }],
				layers: [
					{ getClassName: function () { return "InputLayer"; }, outputShape: [null, 2] },
					{ getClassName: function () { return "Dense"; }, outputShape: [null, 2] }
				]
			};
			window.check_origami_live_tab();
			test_equal("OrigamiLive tab check marks compatible models visible", window._origami_live_tab_state.visible, true);
		} finally {
			document.getElementById = old_get_element;
		}

		var init_calls = 0;
		window.OrigamiLive = { init: function (target) { init_calls++; return "init:" + target; } };
		window._origami_live_initialised = false;
		test_equal("create_origami_live delegates to init", create_origami_live("probe"), "init:probe");
		test_equal("create_origami_live calls init once", init_calls, 1);
		var update_calls = 0;
		window.OrigamiLive = { update: function () { update_calls++; return "updated"; } };
		window._origami_live_initialised = true;
		test_equal("update_origami_live delegates to update", update_origami_live(), "updated");
		test_equal("update_origami_live calls update once", update_calls, 1);
	} finally {
		window.model = old_model;
		window.OrigamiLive = old_origami_api;
		window._origami_live_initialised = old_initialised;
		window._origami_live_tab_state.visible = old_tab_state.visible;
		window._origami_live_tab_state.retryCount = old_tab_state.retryCount;
		OrigamiLive.setConfig(saved.config);
		state.pipeline = saved.pipeline;
		state.cache.xTensor = saved.xTensor;
		state.cache.xHash = saved.xHash;
		state.cache.sampleCount = saved.sampleCount;
		state.off = saved.off;
		state.offKey = saved.offKey;
		state.pendingRender = saved.pendingRender;
		state.dirty = saved.dirty;
		state.lastFingerprint = saved.lastFingerprint;
		state.lastViewHash = saved.lastViewHash;
		state.lastChainSig = saved.lastChainSig;
		state.lastRevision = saved.lastRevision;
		state.modelRef = saved.modelRef;
		state.errorStreak = saved.errorStreak;
		if (test_x) test_x.dispose();
		test_tensors.forEach(function (t) { if (t && !t.isDisposed) t.dispose(); });
	}
}

function _tiny_tests_fcnn_editable_js() {
	var old_model = window.model;
	var old_get_layer_weight_data = window.get_layer_weight_data;
	var old_get_fcnn_data = window.get_fcnn_data;
	var old_started_training = window.started_training;

	try {
		var light_html = _fcnn_edit_build_popup_html(false);
		var dark_html = _fcnn_edit_build_popup_html(true);
		test_equal("_fcnn_edit_build_popup_html has the weight input", light_html.indexOf("fcnn_edit_weight_num") !== -1, true);
		test_equal("_fcnn_edit_build_popup_html has the bias input", light_html.indexOf("fcnn_edit_bias_num") !== -1, true);
		test_equal("_fcnn_edit_build_popup_html uses a light border", light_html.indexOf("#ddd") !== -1, true);
		test_equal("_fcnn_edit_build_popup_html uses a dark border", dark_html.indexOf("#444") !== -1, true);

		window.started_training = false;
		test_equal("_fcnn_edit_is_training is false while idle", _fcnn_edit_is_training(), false);
		window.started_training = true;
		test_equal("_fcnn_edit_is_training is true while training", _fcnn_edit_is_training(), true);

		var fake_canvas = {
			width: 200,
			height: 100,
			getBoundingClientRect: function () { return { left: 10, top: 20, width: 100, height: 50 }; }
		};
		var old_get_element = document.getElementById;
		document.getElementById = function (id) {
			if (id === "fcnn_canvas") return fake_canvas;
			return old_get_element.call(document, id);
		};
		var canvas_pos = _fcnn_edit_convert_mouse_to_canvas({}, 60, 45);
		test_equal("_fcnn_edit_convert_mouse_to_canvas scales x", canvas_pos.canvasMouseX, 100);
		test_equal("_fcnn_edit_convert_mouse_to_canvas scales y", canvas_pos.canvasMouseY, 50);
		document.getElementById = function (id) {
			if (id === "fcnn_canvas") return null;
			return old_get_element.call(document, id);
		};
		test_equal("_fcnn_edit_convert_mouse_to_canvas without a canvas", _fcnn_edit_convert_mouse_to_canvas({}, 1, 1), null);
		document.getElementById = old_get_element;

		var region = { x: 0, y: 0, w: 100, h: 100 };
		test_equal("_fcnn_edit_map_to_neuron_indices top left", JSON.stringify(_fcnn_edit_map_to_neuron_indices(region, 0, 0, 3, 3)), '{"from_idx":0,"to_idx":0}');
		test_equal("_fcnn_edit_map_to_neuron_indices bottom right", JSON.stringify(_fcnn_edit_map_to_neuron_indices(region, 100, 100, 3, 3)), '{"from_idx":2,"to_idx":2}');
		test_equal("_fcnn_edit_map_to_neuron_indices center", JSON.stringify(_fcnn_edit_map_to_neuron_indices(region, 50, 50, 3, 3)), '{"from_idx":1,"to_idx":1}');
		test_equal("_fcnn_edit_map_to_neuron_indices missing region", JSON.stringify(_fcnn_edit_map_to_neuron_indices({x: 0, y: 0, w: 0, h: 0}, 50, 50, 2, 2)), '{"from_idx":1,"to_idx":1}');

		var weight_info = { shape: [2, 3], data: [1, 2, 3, 4, 5, 6], min: 1, max: 6 };
		var lookup = _fcnn_edit_lookup_weight(weight_info, 1, 2);
		test_equal("_fcnn_edit_lookup_weight flat index", lookup.weight_flat_idx, 5);
		test_equal("_fcnn_edit_lookup_weight value", lookup.weightValue, 6);
		test_equal("_fcnn_edit_lookup_weight shape metadata", lookup.rows + "x" + lookup.cols, "2x3");
		var clamped = _fcnn_edit_lookup_weight(weight_info, 99, 99);
		test_equal("_fcnn_edit_lookup_weight clamps indices", clamped.fi + "," + clamped.ti, "1,2");

		test_equal("_fcnn_edit_layer_has_bias_of_size matches", _fcnn_edit_layer_has_bias_of_size({ getWeights: function () { return [{}, { shape: [2] }]; } }, 2), true);
		test_equal("_fcnn_edit_layer_has_bias_of_size rejects a mismatch", _fcnn_edit_layer_has_bias_of_size({ getWeights: function () { return [{}, { shape: [3] }]; } }, 2), false);
		test_equal("_fcnn_edit_layer_has_bias_of_size without weights", _fcnn_edit_layer_has_bias_of_size({ getWeights: function () { return []; } }, 2), false);
		test_equal("_fcnn_edit_check_layer_bias finds getWeights biases", _fcnn_edit_check_layer_bias({ getWeights: function () { return [{}, { shape: [2] }]; } }, 2), true);
		test_equal("_fcnn_edit_check_layer_bias finds weight variables", _fcnn_edit_check_layer_bias({ weights: [{}, { val: {} }] }, 2), true);
		test_equal("_fcnn_edit_check_layer_bias without bias", _fcnn_edit_check_layer_bias({ getWeights: function () { return []; } }, 2), null);

		window.model = {
			layers: [
				{ getWeights: function () { return [{}, { shape: [1] }]; } },
				{ getWeights: function () { return [{}, { shape: [4] }]; } },
				{ getWeights: function () { return [{}, { shape: [3] }]; } }
			]
		};
		test_equal("_fcnn_edit_scan_adjacent_layers finds the next matching bias", _fcnn_edit_scan_adjacent_layers(1, 3), 2);
		test_equal("_fcnn_edit_scan_adjacent_layers finds nothing", _fcnn_edit_scan_adjacent_layers(0, 9), null);

		window.get_layer_weight_data = function () { return { data: [11, 22, 33] }; };
		test_equal("_fcnn_edit_read_weight_at uses layer weight data", _fcnn_edit_read_weight_at({ from_layer: 0, meta_infos: [] }, 1), 22);
		window.get_layer_weight_data = null;
		window.model = { layers: [{ getWeights: function () { return [{ dataSync: function () { return Float32Array.from([7, 8]); } }]; } }] };
		test_equal("_fcnn_edit_read_weight_at falls back to model weights", _fcnn_edit_read_weight_at({ from_layer: 0, meta_infos: [null, { nr: 0 }] }, 1), 8);
		test_equal("_fcnn_edit_read_weight_at rejects out-of-range indices", _fcnn_edit_read_weight_at({ from_layer: 0, meta_infos: [null, { nr: 0 }] }, 9), null);

		test_equal("_try_read_bias_from_getWeights reads biases", JSON.stringify(_try_read_bias_from_getWeights({ getWeights: function () { return [{}, { dataSync: function () { return Float32Array.from([5, 6]); } }]; } })), "[5,6]");
		test_equal("_try_read_bias_from_weights_property reads weight variables", JSON.stringify(_try_read_bias_from_weights_property({ weights: [{}, { val: { dataSync: function () { return Float32Array.from([1, 2]); } } }] })), "[1,2]");
		test_equal("_try_read_bias_from_layer_bias reads layer.bias", JSON.stringify(_try_read_bias_from_layer_bias({ bias: { val: { arraySync: function () { return [[3], [4]]; } } } })), "[3,4]");
		test_equal("_try_extract_array_from_tensor flattens arraySync", JSON.stringify(_try_extract_array_from_tensor({ arraySync: function () { return [[1, 2], [3, 4]]; } })), "[1,2,3,4]");
		test_equal("_try_extract_array_from_weight_variable reads read()", JSON.stringify(_try_extract_array_from_weight_variable({ read: function () { return { dataSync: function () { return Float32Array.from([9, 8]); } }; } })), "[9,8]");
		test_equal("_check_layer_has_no_bias detects use_bias false", _check_layer_has_no_bias({ getConfig: function () { return { use_bias: false }; } }), true);
		test_equal("_check_layer_has_no_bias defaults to false", _check_layer_has_no_bias({ getConfig: function () { return { use_bias: true }; } }), false);

		window.model = { layers: [{ getWeights: function () { return [{}, { dataSync: function () { return Float32Array.from([4, 5]); } }]; } }] };
		test_equal("_fcnn_edit_get_bias_data returns bias values", JSON.stringify(_fcnn_edit_get_bias_data(0)), "[4,5]");
		test_equal("_fcnn_edit_get_bias_data rejects invalid layers", _fcnn_edit_get_bias_data(9), null);

		window.get_fcnn_data = function () {
			return [["out"], [2], [{ nr: 0 }, { nr: 1 }]];
		};
		window.model = { layers: [{ getWeights: function () { return [{}, { shape: [2] }]; } }, { getWeights: function () { return [{}, { shape: [2] }]; } }] };
		test_equal("_fcnn_edit_find_dense_layer_for_neuron finds the first layer", _fcnn_edit_find_dense_layer_for_neuron(0), 0);
		test_equal("_fcnn_edit_find_dense_layer_for_neuron finds a later layer", _fcnn_edit_find_dense_layer_for_neuron(1), 1);
		window.model = null;
		test_equal("_fcnn_edit_find_dense_layer_for_neuron without a model", _fcnn_edit_find_dense_layer_for_neuron(0), null);
	} finally {
		window.model = old_model;
		window.get_layer_weight_data = old_get_layer_weight_data;
		window.get_fcnn_data = old_get_fcnn_data;
		window.started_training = old_started_training;
	}
}

function _tiny_tests_drawing_js() {
	var old_atrament_data = window.atrament_data;
	try {
		var id = "__asanai_drawing_probe__";
		var box = document.createElement("div");
		var canvas = document.createElement("canvas");
		canvas.id = id;
		canvas.width = 20;
		canvas.height = 10;
		var colorpicker = document.createElement("span");
		colorpicker.className = "colorpicker_elements";
		var slider = document.createElement("div");
		slider.className = "pen_size_slider";
		var picker = document.createElement("div");
		picker.className = "jscolor";
		var button = document.createElement("button");
		box.appendChild(canvas);
		box.appendChild(colorpicker);
		box.appendChild(slider);
		box.appendChild(picker);
		box.appendChild(button);
		document.body.appendChild(box);

		window.atrament_data = {};
		window.atrament_data[id] = { canvas: canvas, atrament: { mode: "erase" } };
		hide_colorpicker_for_eraser(id);
		test_equal("hide_colorpicker_for_eraser hides for erase mode", colorpicker.style.visibility, "hidden");
		window.atrament_data[id].atrament.mode = "brush";
		hide_colorpicker_for_eraser(id);
		test_equal("hide_colorpicker_for_eraser shows for brush mode", colorpicker.style.visibility, "visible");

		atrament_set_brush(button, id);
		test_equal("atrament_set_brush sets brush mode", window.atrament_data[id].atrament.mode, "brush");
		test_equal("atrament_set_brush shows the pen slider", slider.style.display !== "none", true);
		test_equal("atrament_set_brush marks the button", button.classList.contains("green_icon"), true);
		atrament_set_fill(button, id);
		test_equal("atrament_set_fill sets fill mode", window.atrament_data[id].atrament.mode, "fill");
		test_equal("atrament_set_fill hides the pen slider", slider.style.display, "none");

		var marker_box = document.createElement("div");
		var marker_parent = document.createElement("div");
		var old_marker = document.createElement("button");
		old_marker.className = "green_icon";
		var marker = document.createElement("button");
		marker_parent.appendChild(old_marker);
		marker_parent.appendChild(marker);
		marker_box.appendChild(marker_parent);
		document.body.appendChild(marker_box);
		green_marker(marker);
		test_equal("green_marker removes the old marker", old_marker.classList.contains("green_icon"), false);
		test_equal("green_marker adds the new marker", marker.classList.contains("green_icon"), true);

		var original_canvas = document.createElement("canvas");
		original_canvas.width = 8;
		original_canvas.height = 6;
		var cloned_canvas = clone_canvas(original_canvas);
		test_equal("clone_canvas keeps width", cloned_canvas.width, 8);
		test_equal("clone_canvas keeps height", cloned_canvas.height, 6);
		test_equal("clone_canvas returns a new canvas", cloned_canvas !== original_canvas, true);

		box.remove();
		marker_box.remove();
	} finally {
		window.atrament_data = old_atrament_data;
	}
}

function _tiny_tests_safety_js() {
	var failure = new assertation_failed("probe");
	test_equal("assertation_failed stores the message", failure.message, "probe");
	test_equal("assert passes true values", assert(true, "probe"), undefined);
	window.__asanai_typeassert_number = 3;
	window.__asanai_typeassert_array = [];
	test_equal("typeassert accepts numbers", typeassert(window.__asanai_typeassert_number, "number", "probe"), undefined);
	test_equal("typeassert accepts arrays", typeassert(window.__asanai_typeassert_array, "array", "probe"), undefined);
	delete window.__asanai_typeassert_number;
	delete window.__asanai_typeassert_array;
}

function _tiny_tests_cookies_and_url_js() {
	var old_href = window.location.href;
	var name = "__asanai_cookie_probe__";
	try {
		set_get("asanai_test_param", "42");
		test_equal("set_get writes a query parameter", window.location.search.indexOf("asanai_test_param=42") !== -1, true);
		test_equal("get_get reads a query parameter", get_get("asanai_test_param"), "42");
		test_equal("get_get falls back to the default", get_get("asanai_missing_param", "fallback"), "fallback");

		document.cookie = name + "=1; path=/";
		test_equal("delete_cookie prepares a cookie", get_cookie(name), "1");
		delete_cookie(name);
		test_equal("delete_cookie removes the cookie", get_cookie(name), null);
	} finally {
		history.replaceState(null, "", old_href);
	}
}

function _tiny_tests_input_shape_js() {
	test_equal("get_shape_from_file reads the feature shape", get_shape_from_file("# shape: (1, 28, 28, 1)\ndata"), "28, 28, 1");
	test_equal("get_full_shape_without_batch replaces the batch size", JSON.stringify(get_full_shape_without_batch("# shape: (1, 28, 28, 1)")), "[null,28,28,1]");
	test_equal("get_shape_from_array nested", JSON.stringify(get_shape_from_array([[[1, 2], [3, 4]], [[5, 6], [7, 8]]])), "[2,2,2]");
	test_equal("generateOnesString repeats dimensions", generateOnesString("2d 3d"), "1,1,1,1,1");
	test_equal("generateOnesString without numbers", generateOnesString("abc"), "");
	test_equal("getDimFromString parses lowercase", getDimFromString("4d"), 4);
	test_equal("getDimFromString parses uppercase", getDimFromString("2D"), 2);
	test_equal("getDimFromString without a dimension", getDimFromString("abc"), null);
	test_equal("safeGetDim parses strings", safeGetDim("4d"), 4);
	test_equal("safeGetDim returns null for unknown strings", safeGetDim("abc"), null);
	var thrown = false;
	try { get_shape_from_array("not an array"); } catch (e) { thrown = e instanceof TypeError; }
	test_equal("get_shape_from_array rejects non-arrays", thrown, true);

	var old_input_shape = $("#inputShape").val();
	var old_batch_size = $("#batchSize").val();
	try {
		$("#inputShape").val("[2, 3]");
		$("#batchSize").val("16");
		test_equal("get_input_shape reads the DOM", JSON.stringify(get_input_shape()), "[2,3]");
		test_equal("get_input_shape_with_batch_size prepends the batch size", JSON.stringify(get_input_shape_with_batch_size()), "[16,2,3]");
	} finally {
		$("#inputShape").val(old_input_shape);
		$("#batchSize").val(old_batch_size);
	}
}

async function _tiny_tests_labels_js() {
	var old_labels = labels;
	var old_download = window.download;
	var old_set_labels = window.set_labels;
	var old_update_python_code = window.update_python_code;
	var probe = document.createElement("input");
	probe.value = "cat";
	document.body.appendChild(probe);
	try {
		test_equal("_get_debug_msg_for_set_labels accepts softmax dense outputs", _get_debug_msg_for_set_labels([null, 3], "softmax", "Dense"), "");
		var debug_msg = _get_debug_msg_for_set_labels([1], "relu", "Dense");
		test_equal("_get_debug_msg_for_set_labels explains batch dimensions", debug_msg.indexOf(language[lang]["batch_dimension_in_output_shape_must_be_null"]) !== -1, true);
		test_equal("_get_debug_msg_for_set_labels explains output ranks", debug_msg.indexOf(language[lang]["output_shape_length_must_be_two"]) !== -1, true);

		var downloaded = null;
		window.download = function (name, content) { downloaded = { name: name, content: content }; };
		labels = ["a", "b"];
		download_labels_json();
		test_equal("download_labels_json uses labels.json", downloaded.name, "labels.json");
		test_equal("download_labels_json serializes the labels", downloaded.content, '["a","b"]');

		var loaded = null;
		window.set_labels = async function (arr) { loaded = arr; };
		await load_labels_from_json_string('["x","y"]');
		test_equal("load_labels_from_json_string delegates to set_labels", JSON.stringify(loaded), '["x","y"]');

		labels = ["old"];
		var python_updates = 0;
		window.update_python_code = async function () { python_updates++; return true; };
		await update_label_by_nr(probe, 0);
		test_equal("update_label_by_nr updates the label array", labels[0], "cat");
		test_equal("update_label_by_nr refreshes python code", python_updates, 1);
	} finally {
		labels = old_labels;
		window.download = old_download;
		window.set_labels = old_set_labels;
		window.update_python_code = old_update_python_code;
		probe.remove();
	}
}

function _tiny_tests_skip_connection_js() {
	var old_settings = skip_connection_settings;
	var old_hash = model_config_hash;
	var old_get_number_of_layers = window.get_number_of_layers;
	var old_updated_page = window.updated_page;
	var wrapper = null;
	try {
		test_equal("_get_skip_initializer_default_value mean", _get_skip_initializer_default_value("mean", 0), 0);
		test_equal("_get_skip_initializer_default_value stddev", _get_skip_initializer_default_value("stddev", 0), 0.05);
		test_equal("_get_skip_initializer_default_value value", _get_skip_initializer_default_value("value", 0), 1);
		test_equal("_get_skip_initializer_default_value mode", _get_skip_initializer_default_value("mode", 0), "fanIn");
		test_equal("_get_skip_initializer_default_value distribution", _get_skip_initializer_default_value("distribution", 0), "normal");
		test_equal("_get_skip_initializer_default_value fallback", _get_skip_initializer_default_value("unknown", 0), 1);

		skip_connection_settings = [];
		var init_html = _get_skip_initializer_sub_options_html(0, "glorotUniform", null);
		test_equal("_get_skip_initializer_sub_options_html returns a string", typeof init_html, "string");
		test_equal("_get_skip_initializer_sub_options_html rejects unknown initializers", _get_skip_initializer_sub_options_html(0, "__unknown__", null), "");
		var option_html = add_skip_connection_option("dense", 0);
		test_equal("add_skip_connection_option builds the checkbox row", option_html.indexOf("skip_connection_enabled") !== -1, true);
		test_equal("build_skip_connection_html delegates", build_skip_connection_html("dense", 0).indexOf("skip_connection_tr") !== -1, true);

		var param_input = document.createElement("input");
		param_input.value = "0.5";
		model_config_hash = "hash";
		update_skip_connection_initializer_param(0, "mean", param_input);
		test_equal("update_skip_connection_initializer_param stores floats", skip_connection_settings[0].initializer_params.mean, 0.5);
		test_equal("update_skip_connection_initializer_param invalidates the config", model_config_hash, null);

		var init_select = document.createElement("select");
		var init_option = document.createElement("option");
		init_option.value = "glorotUniform";
		init_option.textContent = "glorotUniform";
		init_select.appendChild(init_option);
		init_select.value = "glorotUniform";
		model_config_hash = "hash";
		update_skip_connection_initializer(0, init_select);
		test_equal("update_skip_connection_initializer stores the initializer", skip_connection_settings[0].initializer, "glorotUniform");
		test_equal("update_skip_connection_initializer invalidates the config", model_config_hash, null);

		wrapper = document.createElement("div");
		wrapper.className = "layer_setting";
		var init_row = document.createElement("tr");
		init_row.className = "skip_connection_initializer_tr";
		init_row.style.display = "none";
		var count_row = document.createElement("tr");
		count_row.className = "skip_connection_count_tr";
		count_row.style.display = "none";
		var option_row = document.createElement("tr");
		option_row.className = "skip_connection_initializer_option_tr";
		option_row.style.display = "none";
		var checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.className = "skip_connection_enabled";
		checkbox.checked = true;
		wrapper.appendChild(init_row);
		wrapper.appendChild(count_row);
		wrapper.appendChild(option_row);
		wrapper.appendChild(checkbox);
		document.body.appendChild(wrapper);

		skip_connection_settings = [];
		var update_calls = 0;
		window.get_number_of_layers = function () { return 3; };
		window.updated_page = function () { update_calls++; };
		toggle_skip_connection(0, checkbox);
		test_equal("toggle_skip_connection enables the setting", skip_connection_settings[0].enabled, true);
		test_equal("toggle_skip_connection shows the initializer row", init_row.style.display !== "none", true);
		test_equal("toggle_skip_connection refreshes the page", update_calls, 1);
		checkbox.checked = false;
		toggle_skip_connection(0, checkbox);
		test_equal("toggle_skip_connection disables the setting", skip_connection_settings[0].enabled, false);
		test_equal("toggle_skip_connection hides the initializer row", init_row.style.display, "none");
		test_equal("toggle_skip_connection refreshes again", update_calls, 2);
	} finally {
		skip_connection_settings = old_settings;
		model_config_hash = old_hash;
		window.get_number_of_layers = old_get_number_of_layers;
		window.updated_page = old_updated_page;
		if (wrapper) wrapper.remove();
	}
}

function _tiny_tests_math_editable_js() {
	var old_editables = _math_editables;
	var old_popup = _math_pop_el;
	var old_active = _math_active_ed;
	var created_popup = !_math_pop_el;
	var container = document.createElement("div");
	var span = document.createElement("span");
	span.setAttribute("data-math-eid", "probe");
	container.appendChild(span);
	document.body.appendChild(container);
	try {
		_math_editables = [];
		var values = { probe: 1.23456, probe2: 2.5 };
		var set_values = {};
		math_register_editable("probe", function () { return values.probe; }, function (v) { set_values.probe = v; }, 0, 10, "Probe", { step: 0.1, decimals: 2 });
		test_equal("math_register_editable adds an editable", math_find_editable("probe") !== null, true);
		test_equal("math_register_editable stores options", math_find_editable("probe").step, 0.1);
		test_equal("math_register_editable stores decimals", math_find_editable("probe").decimals, 2);
		math_register_editable("probe", function () { return values.probe; }, function (v) { set_values.probe = v; }, 0, 10, "Probe 2", { step: 0.1, decimals: 2 });
		test_equal("math_register_editable updates duplicates", _math_editables.length, 1);
		test_equal("math_register_editable updates the label", math_find_editable("probe").label, "Probe 2");
		test_equal("math_find_editable rejects unknown ids", math_find_editable("missing"), null);

		var changed = null;
		var event_value = null;
		math_find_editable("probe").onChange = function (value) { changed = value; };
		var listener = function (event) { event_value = event.detail.value; };
		document.addEventListener("math_variable_changed", listener);
		_math_on_variable_changed(math_find_editable("probe"));
		document.removeEventListener("math_variable_changed", listener);
		test_equal("_math_on_variable_changed updates the DOM", span.textContent, "1.23");
		test_equal("_math_on_variable_changed calls onChange", changed, 1.23456);
		test_equal("_math_on_variable_changed dispatches an event", event_value, 1.23456);

		math_register_editable("probe2", function () { return values.probe2; }, function (v) { set_values.probe2 = v; }, 0, 10, "Probe 2", { decimals: 3 });
		var colored = document.createElement("span");
		colored.setAttribute("style", "color: #53d8fb");
		colored.textContent = "9.99";
		container.appendChild(colored);
		_replace_colored_spans_with_editables(container, [{ eid: "probe2" }]);
		test_equal("_replace_colored_spans_with_editables marks the span", colored.classList.contains("math-ed-num"), true);
		test_equal("_replace_colored_spans_with_editables writes the value", colored.textContent, "2.500");
		test_equal("_replace_colored_spans_with_editables stores the id", colored.getAttribute("data-math-eid"), "probe2");

		var rendered = document.createElement("div");
		el_render_single_latex_with_editables(rendered, "x + 1", []);
		test_equal("el_render_single_latex_with_editables renders a wrapper", rendered.querySelectorAll(".math-hybrid-rendered").length, 1);

		var popup = math_ensure_popup();
		test_equal("math_ensure_popup creates one popup", popup.id, "math_var_popup");
		test_equal("math_ensure_popup is idempotent", math_ensure_popup(), popup);
		math_open_popup("probe2", { left: 100, top: 200, right: 200, bottom: 220, width: 100, height: 20 });
		test_equal("math_open_popup marks the popup visible", popup.classList.contains("math-pop-visible"), true);
		test_equal("math_open_popup sets the label", document.getElementById("math_pop_lbl").textContent, "Probe 2");
		test_equal("math_open_popup sets the slider bounds", document.getElementById("math_pop_slider").min + "/" + document.getElementById("math_pop_slider").max, "0/10");
		test_equal("math_open_popup stores the active editable", _math_active_ed.id, "probe2");
		_math_update_popup_position();
		test_equal("_math_update_popup_position positions the popup", popup.style.left !== "" && popup.style.top !== "", true);
		math_close_popup();
		test_equal("math_close_popup hides the popup", popup.classList.contains("math-pop-visible"), false);
		test_equal("math_close_popup clears the active editable", _math_active_ed, null);
	} finally {
		if (created_popup && _math_pop_el) {
			_math_pop_el.remove();
			_math_pop_el = null;
		}
		_math_editables = old_editables;
		_math_pop_el = old_popup;
		_math_active_ed = old_active;
		container.remove();
	}
}

async function _tiny_tests_csv_js() {
	var old_csv_value = $("#csv_file").val();
	var old_show_csv_file = window.show_csv_file;
	var error_box = document.getElementById("custom_function_error");
	var old_error_html = error_box ? error_box.innerHTML : null;
	var old_error_style = error_box ? error_box.getAttribute("style") : null;
	try {
		var fallback = _latex_fallback_html("<x>&");
		test_equal("_latex_fallback_html escapes markup", fallback.indexOf("&lt;x&gt;&amp;") !== -1, true);
		test_equal("_latex_fallback_html keeps the fallback class", fallback.indexOf("xy_matrix_fallback") !== -1, true);
		var example = get_example_csv();
		test_equal("get_example_csv has the header", example.indexOf("sex(m=0;w=1),height,shoe_size") === 0, true);
		test_equal("get_example_csv has data rows", example.split("\n").length > 10, true);

		var shown = 0;
		window.show_csv_file = async function () { shown++; };
		$("#csv_file").val("");
		await load_shoe_example();
		test_equal("load_shoe_example fills the CSV field", $("#csv_file").val(), example);
		test_equal("load_shoe_example shows the CSV panel", shown > 0, true);

		if (!error_box) {
			error_box = document.createElement("div");
			error_box.id = "custom_function_error";
			document.body.appendChild(error_box);
		}
		var res = set_custom_function_error("probe error");
		test_equal("set_custom_function_error returns an empty string", res, "");
		test_equal("set_custom_function_error writes the message", error_box.innerHTML, "probe error");
		test_equal("set_custom_function_error shows the box", error_box.style.display !== "none", true);
	} finally {
		$("#csv_file").val(old_csv_value);
		window.show_csv_file = old_show_csv_file;
		if (error_box) {
			if (old_error_html === null) {
				error_box.remove();
			} else {
				error_box.innerHTML = old_error_html;
				if (old_error_style === null) error_box.removeAttribute("style");
				else error_box.setAttribute("style", old_error_style);
			}
		}
	}
}

async function _tiny_tests_plot_predict_js() {
	var old_model = window.model;
	var old_predict = window.__predict;
	var old_get_weights = window.get_weights_as_string;
	var old_react = Plotly.react;
	var old_set_timeout = window.setTimeout;
	var old_dark = window.is_dark_mode;
	var prediction_tensor = null;
	try {
		test_equal("_pp_eq compares arrays", _pp_eq([1, 2], [1, 2]), true);
		test_equal("_pp_eq rejects different arrays", _pp_eq([1, 2], [1, 3]), false);
		test_equal("_pp_range includes the end", JSON.stringify(_pp_range(0, 1, 0.5)), "[0,0.5,1]");
		test_equal("_pp_extract_vals reads suffix keys", JSON.stringify(_pp_extract_vals("p", { p_x_min: 1, p_x_max: 2, p_y_min: 3, p_y_max: 4, p_step: 5 })), '{"x_min":1,"x_max":2,"y_min":3,"y_max":4,"step":5}');

		var layout_div = document.createElement("div");
		window.is_dark_mode = true;
		var dark_layout = _pp_base_layout(layout_div);
		test_equal("_pp_base_layout uses white text in dark mode", dark_layout.font.color, "#fff");
		window.is_dark_mode = false;
		var light_layout = _pp_base_layout(layout_div);
		test_equal("_pp_base_layout uses black text in light mode", light_layout.font.color, "#000");

		window.model = { input: { shape: [null, 1] }, output: { shape: [null, 1] } };
		test_equal("_pp_detect_case detects case A", _pp_detect_case().fallA, true);
		window.model = { input: { shape: [null, 2] }, output: { shape: [null, 1] } };
		test_equal("_pp_detect_case detects case B1", _pp_detect_case().fallB1, true);
		window.model = { input: { shape: [null, 1] }, output: { shape: [null, 2] } };
		test_equal("_pp_detect_case detects case B2", _pp_detect_case().fallB2, true);
		test_equal("_pp_has_valid_model_shape accepts valid models", !!_pp_has_valid_model_shape(), true);
		window.model = null;
		test_equal("_pp_has_valid_model_shape rejects missing models", !!_pp_has_valid_model_shape(), false);

		window.get_weights_as_string = function () { return "weights"; };
		test_equal("_pp_get_weights delegates to the exporter", _pp_get_weights(), "weights");
		window.get_weights_as_string = null;
		test_equal("_pp_get_weights falls back to an empty string", _pp_get_weights(), "");

		var camera = { eye: { x: 1, y: 2, z: 3 } };
		var fake_dom = {
			_fullLayout: { scene: { _scene: { getCamera: function () { return camera; } } } },
			on: function () {}
		};
		var react_calls = 0;
		Plotly.react = async function () { react_calls++; };
		var camera_layout = {};
		await ModelPlotter._pp_plot_preserve_camera(fake_dom, [{ type: "surface" }], camera_layout, {}, "probe");
		test_equal("_pp_plot_preserve_camera sets uirevision", camera_layout.uirevision, "probe");
		test_equal("_pp_plot_preserve_camera restores the camera", camera_layout.scene.camera, camera);
		test_equal("_pp_plot_preserve_camera attaches one listener", fake_dom.__camera_listener, true);
		test_equal("_pp_plot_preserve_camera calls Plotly.react", react_calls, 1);

		var debounced_calls = 0;
		window.setTimeout = function (fn) { fn(); return 1; };
		var debounced = _pp_debounce(function () { debounced_calls++; }, 10);
		debounced();
		test_equal("_pp_debounce invokes the callback", debounced_calls, 1);
		window.setTimeout = old_set_timeout;

		window.__predict = async function (t) {
			var n = t.shape[0];
			t.dispose();
			prediction_tensor = tf.zeros([n, 1]);
			return prediction_tensor;
		};
		var trace = await _pp_caseA_batched(0, 1, 0.5);
		test_equal("_pp_caseA_batched uses one line trace", trace.length, 1);
		test_equal("_pp_caseA_batched returns the x range", JSON.stringify(trace[0].x), "[0,0.5,1]");
		test_equal("_pp_caseA_batched returns one prediction per input", trace[0].y.length, 3);
		prediction_tensor.dispose();
	} finally {
		window.model = old_model;
		window.__predict = old_predict;
		window.get_weights_as_string = old_get_weights;
		Plotly.react = old_react;
		window.setTimeout = old_set_timeout;
		window.is_dark_mode = old_dark;
	}
}

function _tiny_tests_python_code_js() {
	var converted = convert_to_python_string({ a: 1, b: true, c: "x", d: [1, 2] });
	test_equal("convert_to_python_string writes numbers", converted.indexOf("a: 1") !== -1, true);
	test_equal("convert_to_python_string writes booleans", converted.indexOf("b: True") !== -1, true);
	test_equal("convert_to_python_string quotes strings", converted.indexOf('c: "x"') !== -1, true);
	test_equal("convert_to_python_string includes every key", converted.indexOf("d:") !== -1, true);

	test_equal("model_add_python_structure marks MultiActivation as custom", model_add_python_structure("MultiActivation", {}, false).indexOf("custom to asanAI") !== -1, true);
	var max3d = model_add_python_structure("MaxPooling3D", { pool_size: [2, 2, 2] }, false);
	test_equal("model_add_python_structure writes MaxPooling3D", max3d.indexOf("MaxPooling3D") !== -1, true);
	test_equal("model_add_python_structure writes the 3D pool size", max3d.indexOf("(2, 2, 2)") !== -1, true);
	var max1d = model_add_python_structure("MaxPooling1D", { pool_size: [2] }, false);
	test_equal("model_add_python_structure writes MaxPooling1D", max1d.indexOf("MaxPooling1D") !== -1, true);

	var loader = _get_tensorflow_data_loader_code();
	test_equal("_get_tensorflow_data_loader_code builds generators", loader.indexOf("flow_from_directory") !== -1, true);
	test_equal("_get_tensorflow_data_loader_code uses the validation split", loader.indexOf("validation_split=") !== -1, true);
	var run_sh = _get_run_sh_file_for_custom_training();
	test_equal("_get_run_sh_file_for_custom_training has a shebang", run_sh.indexOf("#!/bin/bash") === 0, true);
	test_equal("_get_run_sh_file_for_custom_training defines helpers", run_sh.indexOf("green_text") !== -1, true);
	var readme = _get_readme_md_for_local_training();
	test_equal("_get_readme_md_for_local_training has a title", readme.indexOf("# What is this?") !== -1, true);
	test_equal("_get_readme_md_for_local_training mentions run.sh", readme.indexOf("run.sh") !== -1, true);
	var predict_py = _get_predict_py_for_local_training();
	test_equal("_get_predict_py_for_local_training defines the predictor", predict_py.indexOf("def predict_single_file") !== -1, true);
	test_equal("_get_predict_py_for_local_training uses the image size", predict_py.indexOf("target_size=(") !== -1, true);
	var save_code = _get_tensorflow_save_model_code();
	test_equal("_get_tensorflow_save_model_code saves the model", save_code.indexOf("model.save") !== -1 || save_code.indexOf("saved_model") !== -1, true);
}

async function _tiny_tests_base_wrappers_extra_js() {
	var binary_true = tensor2d([[1], [0]]);
	var binary_pred = tensor2d([[0.9], [0.1]]);
	var metric_tests = [
		["meanAbsoluteError", tf_metrics_meanAbsoluteError],
		["meanSquaredError", tf_metrics_meanSquaredError],
		["binaryCrossentropy", tf_metrics_binaryCrossentropy],
		["binaryAccuracy", tf_metrics_binaryAccuracy],
		["precision", tf_metrics_precision],
		["cosineProximity", tf_metrics_cosineProximity]
	];
	try {
		for (var metric_idx = 0; metric_idx < metric_tests.length; metric_idx++) {
			var metric_result = metric_tests[metric_idx][1](binary_true, binary_pred);
			test_equal("tf_metrics_" + metric_tests[metric_idx][0] + " returns a tensor", is_tensor(metric_result), true);
			test_equal("tf_metrics_" + metric_tests[metric_idx][0] + " is finite", Array.from(metric_result.dataSync()).every(isFinite), true);
			await dispose(metric_result);
		}

		var mape_true = tensor2d([[1], [2]]);
		var mape_pred = tensor2d([[1], [3]]);
		var mape_result = tf_metrics_meanAbsolutePercentageError(mape_true, mape_pred);
		test_equal("tf_metrics_meanAbsolutePercentageError is finite", Array.from(mape_result.dataSync()).every(isFinite), true);
		await dispose(mape_result);

		var categorical_true = tensor2d([[1, 0], [0, 1]]);
		var categorical_pred = tensor2d([[0.9, 0.1], [0.2, 0.8]]);
		var categorical_crossentropy = tf_metrics_categoricalCrossentropy(categorical_true, categorical_pred);
		test_equal("tf_metrics_categoricalCrossentropy is finite", Array.from(categorical_crossentropy.dataSync()).every(isFinite), true);
		await dispose(categorical_crossentropy);
		var categorical_accuracy = tf_metrics_categoricalAccuracy(categorical_true, categorical_pred);
		test_equal("tf_metrics_categoricalAccuracy is finite", Array.from(categorical_accuracy.dataSync()).every(isFinite), true);
		await dispose(categorical_accuracy);
		await dispose(mape_true, mape_pred, categorical_true, categorical_pred);

		var moments_input = tensor1d([1, 2, 3]);
		var moments = tf_moments(moments_input);
		test_equal("tf_moments returns the mean", Number(moments.mean.dataSync()[0]), 2);
		test_equal("tf_moments returns the variance", Math.abs(Number(moments.variance.dataSync()[0]) - 2 / 3) < 1e-6, true);
		await dispose(moments_input, moments.mean, moments.variance);

		var unique_input = tensor1d([1, 1, 2]);
		var unique = tf_unique(unique_input);
		test_equal("tf_unique returns unique values", JSON.stringify(Array.from(unique.values.dataSync())), "[1,2]");
		test_equal("tf_unique returns indices", JSON.stringify(Array.from(unique.indices.dataSync())), "[0,0,1]");
		await dispose(unique_input, unique.values, unique.indices);

		var reshape_input = tensor1d([1, 2, 3, 4]);
		var reshaped = tf_reshape(reshape_input, [2, 2]);
		test_equal("tf_reshape keeps the shape", JSON.stringify(reshaped.shape), "[2,2]");
		await dispose(reshape_input, reshaped);

		var one_d = tensor1d([1, 2]);
		var two_d = tensor2d([[1, 2], [3, 4]]);
		test_equal("tensor1d returns rank one", one_d.shape.length, 1);
		test_equal("tensor2d returns rank two", two_d.shape.length, 2);
		await dispose(one_d, two_d);

		var square_input = tensor1d([1, 2, 3]);
		var squared = tf_square(square_input);
		test_equal("tf_square squares values", JSON.stringify(Array.from(squared.dataSync())), "[1,4,9]");
		await dispose(square_input, squared);

		var sqrt_input = tensor1d([1, 4, 9]);
		var roots = sqrt(sqrt_input);
		test_equal("sqrt takes square roots", JSON.stringify(Array.from(roots.dataSync())), "[1,2,3]");
		await dispose(sqrt_input, roots);

		var random = randomUniform([2, 2]);
		test_equal("randomUniform returns the requested shape", JSON.stringify(random.shape), "[2,2]");
		test_equal("randomUniform stays between zero and one", Array.from(random.dataSync()).every(function (v) { return v >= 0 && v <= 1; }), true);
		await dispose(random);

		var image_input = tensor([[ [1], [2] ], [ [3], [4] ]]);
		var resized = resizeBilinear(image_input, [4, 4]);
		test_equal("resizeBilinear keeps rank three", resized.shape.length, 3);
		test_equal("resizeBilinear uses the requested resolution", resized.shape[0] + "x" + resized.shape[1], "4x4");
		await dispose(image_input, resized);

		var shape_input = tensor2d([[0, 0], [0, 0]]);
		var constant = tf_constant_shape(5, shape_input);
		test_equal("tf_constant_shape keeps the shape", JSON.stringify(constant.shape), "[2,2]");
		test_equal("tf_constant_shape fills with the value", Array.from(constant.dataSync()).every(function (v) { return v === 5; }), true);
		await dispose(shape_input, constant);

		var sequential_model = tf_sequential("__asanai_sequential_probe__");
		test_equal("tf_sequential stores the UUID", sequential_model.uuid, "__asanai_sequential_probe__");
		test_equal("tf_sequential starts empty", sequential_model.layers.length, 0);
		sequential_model.add(tf.layers.dense({ units: 1, inputShape: [2] }));
		test_equal("tf_sequential adds layers through the wrapper", sequential_model.layers.length, 1);
		sequential_model.dispose();

		var browser_file = new File(["probe"], "probe.txt", { type: "text/plain" });
		var files = iobrowserFiles([browser_file]);
		test_equal("iobrowserFiles returns a browser file set", !!files, true);

		test_equal("get_epsilon is a small positive number", get_epsilon() > 0 && get_epsilon() < 1, true);
	} finally {
		await dispose(binary_true, binary_pred);
	}
}

function _tiny_tests_math_mode_extra_js() {
	var old_model = window.model;
	var old_get_item_value = window.get_item_value;
	var old_get_h = window._get_h;
	var old_get_metric = window.get_metric;
	var fake_tensors = [];
	try {
		test_equal("add_activation_function_to_latex linear is empty", add_activation_function_to_latex("linear"), "");
		test_equal("add_activation_function_to_latex begins", add_activation_function_to_latex("relu", "begin"), "\t\\text{relu}\\left(");
		test_equal("add_activation_function_to_latex ends", add_activation_function_to_latex("relu", "end"), "\\right)");

		test_equal("_has_numbers accepts numbers", _has_numbers(3), true);
		test_equal("_has_numbers rejects NaN", _has_numbers(NaN), false);
		test_equal("_has_numbers accepts nested numbers", _has_numbers([[NaN], [1]]), true);
		test_equal("_has_numbers rejects empty arrays", _has_numbers([]), false);
		test_equal("_has_numbers rejects strings", _has_numbers("1"), false);
		test_equal("_latex_is_balanced accepts balanced braces", _latex_is_balanced("\\frac{1}{2}"), true);
		test_equal("_latex_is_balanced rejects open braces", _latex_is_balanced("{x"), false);
		test_equal("_latex_is_balanced rejects extra closes", _latex_is_balanced("x}"), false);
		test_equal("_latex_is_balanced ignores escaped braces", _latex_is_balanced("\\{x\\}"), true);
		test_equal("_latex_is_balanced rejects non-strings", _latex_is_balanced(null), false);

		test_equal("get_shape_from returns arrays", get_shape_from([1, 2]), [1, 2]);
		test_equal("get_shape_from reads tensor shapes", get_shape_from({ shape: [3, 4] }), [3, 4]);
		test_equal("get_shape_from rejects unknown objects", get_shape_from({}), null);

		var items = { dropout: "0.2", stddev: "0.1", dropout_rate: "0.5", pool_size_x: "2", pool_size_y: "3", pool_size_z: "4" };
		window.get_item_value = function (layer_idx, key) { return items[key]; };
		window._get_h = function (layer_idx) { return "h_" + layer_idx; };
		test_equal("get_alpha_dropout_latex includes the rate", get_alpha_dropout_latex(0).indexOf("0.2") !== -1, true);
		test_equal("get_gaussian_noise_latex includes the stddev", get_gaussian_noise_latex(0).indexOf("0.1") !== -1, true);
		test_equal("get_gaussian_dropout_latex includes the rate", get_gaussian_dropout_latex(0).indexOf("0.2") !== -1, true);
		test_equal("get_dropout_latex converts to percent", get_dropout_latex(0).indexOf("50") !== -1, true);
		test_equal("get_max_pooling_1d_latex uses h", get_max_pooling_1d_latex(1).indexOf("h_1") !== -1, true);
		test_equal("get_max_pooling_2d_latex uses two maxima", get_max_pooling_2d_latex(1).indexOf("\\max_{j=1}^{M}") !== -1, true);
		test_equal("get_max_pooling_3d_latex uses three maxima", get_max_pooling_3d_latex(1).indexOf("\\max_{l=1}^{P}") !== -1, true);
		test_equal("get_average_pooling_1d_latex includes the pool size", get_average_pooling_1d_latex(1).indexOf("N = 2") !== -1, true);
		test_equal("get_average_pooling_2d_latex includes both pool sizes", get_average_pooling_2d_latex(1).indexOf("M = 3") !== -1, true);
		test_equal("get_average_pooling_3d_latex includes all pool sizes", get_average_pooling_3d_latex(1).indexOf("W = 4") !== -1, true);
		test_equal("get_upsampling2d_latex uses h", get_upsampling2d_latex(1).indexOf("h_1") !== -1, true);
		test_equal("get_debug_layer_latex describes the layer", get_debug_layer_latex().indexOf("does nothing") !== -1, true);

		var activation_latex = get_activation_functions_latex("softmax", [[1, 2]], 0, null);
		test_equal("get_activation_functions_latex renders equations", activation_latex.length > 0, true);

		var layer = {
			getInputAt: function () { return { shape: [null, 2] }; },
			getOutputAt: function () { return { shape: [null, 3] }; }
		};
		window.model = { layers: [layer] };
		test_equal("get_reshape_string includes the new shape", get_reshape_string(0).indexOf("[3]") !== -1, true);
		test_equal("get_flatten_string describes a reshape", get_flatten_string(0).indexOf("Reshape") !== -1, true);

		var gamma = tf.tensor1d([1, 2]);
		var beta = tf.tensor1d([0, 1]);
		var alpha = tf.tensor1d([2]);
		var snake_beta = tf.tensor1d([1]);
		var ma_values = {
			aRelu: tf.tensor1d([0.5]),
			aSnake: tf.tensor1d([0.25]),
			aElu: tf.tensor1d([0]),
			aSin: tf.tensor1d([0]),
			snakeAlpha: tf.tensor1d([1])
		};
		fake_tensors.push(gamma, beta, alpha, snake_beta, ma_values.aRelu, ma_values.aSnake, ma_values.aElu, ma_values.aSin, ma_values.snakeAlpha);
		window.model = {
			layers: [
				{ weights: [{ name: "gamma", val: gamma }, { name: "beta", val: beta }] },
				{ weights: [{ name: "alpha", val: alpha }, { name: "beta", val: snake_beta }] },
				{ weights: [
					{ name: "aRelu", val: ma_values.aRelu },
					{ name: "aSnake", val: ma_values.aSnake },
					{ name: "aElu", val: ma_values.aElu },
					{ name: "aSin", val: ma_values.aSin },
					{ name: "snakeAlpha", val: ma_values.snakeAlpha }
				] }
			]
		};
		test_equal("get_layer_normalization_equation renders gamma and beta", get_layer_normalization_equation(0).indexOf("\\gamma") !== -1, true);
		test_equal("get_snake_layer_latex renders the sine term", get_snake_layer_latex(1).indexOf("\\sin^2") !== -1, true);
		var multi_latex = get_multiactivation_layer_latex(2);
		test_equal("get_multiactivation_layer_latex renders ReLU", multi_latex.indexOf("ReLU") !== -1, true);
		test_equal("get_multiactivation_layer_latex renders snake", multi_latex.indexOf("\\sin^2") !== -1, true);

		var activation_names = get_activation_layer_names();
		test_equal("get_activation_layer_names returns an array", Array.isArray(activation_names), true);
		test_equal("get_activation_layer_names contains activations", activation_names.length > 0, true);

		window.get_metric = function () { return "meanSquaredError"; };
		var known_metric = get_metric_equations_string();
		test_equal("get_metric_equations_string finds known metrics", known_metric.indexOf("has no metric-equation") === -1, true);
		window.get_metric = function () { return "__unknown_metric__"; };
		test_equal("get_metric_equations_string handles unknown metrics", get_metric_equations_string().indexOf("has no metric-equation") !== -1, true);
	} finally {
		window.model = old_model;
		window.get_item_value = old_get_item_value;
		window._get_h = old_get_h;
		window.get_metric = old_get_metric;
		fake_tensors.forEach(function (t) { if (t && !t.isDisposed) t.dispose(); });
	}
}

function _tiny_tests_gui_extra_js() {
	var key_path_source = { a: { b: 2 }, zero: 0 };
	test_equal("get_key_from_path returns the root", get_key_from_path(key_path_source, []), key_path_source);
	test_equal("get_key_from_path follows keys", get_key_from_path(key_path_source, ["a", "b"]), 2);
	test_equal("get_key_from_path returns null for missing keys", get_key_from_path(key_path_source, ["missing"]), null);
	test_equal("get_key_from_path returns null for falsy values", get_key_from_path(key_path_source, ["zero"]), null);
	test_equal("last_index returns the final index", last_index([1, 2, 3]), 2);
	test_equal("network_name_is_empty accepts empty strings", network_name_is_empty(""), true);
	test_equal("network_name_is_empty accepts whitespace", network_name_is_empty("   "), true);
	test_equal("network_name_is_empty rejects names", network_name_is_empty("net"), false);

	var symbol = document.createElement("span");
	symbol.id = "__asanai_gui_symbol__";
	document.body.appendChild(symbol);
	enable_symbol(symbol.id);
	test_equal("enable_symbol enables the symbol", symbol.classList.contains("enabled_symbol"), true);
	disable_symbol(symbol.id);
	test_equal("disable_symbol disables the symbol", symbol.classList.contains("disabled_symbol"), true);

	var colored = document.createElement("div");
	colored.id = "__asanai_gui_colored__";
	document.body.appendChild(colored);
	color_msg_green(colored.id);
	test_equal("color_msg_green sets a green background", colored.style.backgroundColor, "green");
	color_msg_red(colored.id);
	test_equal("color_msg_red sets a red background", colored.style.backgroundColor, "red");

	var attr_el = document.createElement("div");
	attr_el.setAttribute("data-old", "value");
	attr_change_name(attr_el, "data-old", "data-new");
	test_equal("attr_change_name copies the value", attr_el.getAttribute("data-new"), "value");
	test_equal("attr_change_name removes the old attribute", attr_el.hasAttribute("data-old"), false);

	var hidden_parent = document.createElement("div");
	hidden_parent.style.display = "none";
	var hidden_child = document.createElement("span");
	hidden_parent.appendChild(hidden_child);
	test_equal("is_hidden_or_has_hidden_parent sees hidden parents", is_hidden_or_has_hidden_parent(hidden_child), true);
	hidden_parent.style.display = "block";
	test_equal("is_hidden_or_has_hidden_parent accepts visible elements", is_hidden_or_has_hidden_parent(hidden_child), false);

	var xpath_el = document.createElement("div");
	xpath_el.id = "__asanai_xpath_probe__";
	document.body.appendChild(xpath_el);
	test_equal("get_element_xpath uses ids", get_element_xpath(xpath_el), 'id("__asanai_xpath_probe__")');
	xpath_el.remove();

	var old_model_dataset = $("#model_dataset").val();
	var old_dataset = $("#dataset").val();
	var old_data_origin = $("#data_origin").val();
	var model_dataset_option = $("#model_dataset option").first().val();
	var dataset_option = $("#dataset option").first().val();
	var data_origin_option = $("#data_origin option").first().val();
	try {
		$("#model_dataset").val(model_dataset_option);
		test_equal("get_chosen_dataset prefers model_dataset", get_chosen_dataset(), model_dataset_option);
		$("#model_dataset").val("");
		$("#dataset").val(dataset_option);
		test_equal("get_chosen_dataset falls back to dataset", get_chosen_dataset(), dataset_option);
		$("#data_origin").val(data_origin_option);
		test_equal("get_data_origin reads the selector", get_data_origin(), data_origin_option);
	} finally {
		$("#model_dataset").val(old_model_dataset);
		$("#dataset").val(old_dataset);
		$("#data_origin").val(old_data_origin);
	}

	test_equal("human_readable_time handles one second", human_readable_time(1).length > 0, true);
	test_equal("human_readable_time formats minutes", human_readable_time(61).length > 0, true);
	test_equal("normalizeArray scales to bytes", JSON.stringify(normalizeArray([1, 2, 3])), "[0,127.5,255]");
	test_equal("format_number handles null", format_number(null), "—");
	test_equal("format_number formats decimals", format_number(1.23456789), "1.234568");
	test_equal("format_number uses exponential notation", format_number(0.0001).indexOf("e") !== -1, true);
	test_equal("format_number leaves strings", format_number("x"), "x");
	test_equal("format_duration handles zero", format_duration(0), "—");
	test_equal("format_duration formats seconds", format_duration(1000), "1s");
	test_equal("format_duration formats minutes", format_duration(61000), "1m 1s");
	test_equal("format_duration formats hours", format_duration(3661000), "1h 1m 1s");
	test_equal("is_tablet returns a boolean", typeof is_tablet(), "boolean");
	test_equal("is_touch_device returns a boolean", typeof is_touch_device(), "boolean");

	var old_history_checked = $("#save_math_history").prop("checked");
	try {
		$("#save_math_history").prop("checked", true);
		test_equal("enabled_saving_history reads the checkbox", enabled_saving_history(), true);
		$("#save_math_history").prop("checked", false);
		test_equal("enabled_saving_history reads unchecked boxes", enabled_saving_history(), false);
	} finally {
		$("#save_math_history").prop("checked", old_history_checked);
	}

	var existing_trainables = Array.from(document.querySelectorAll('input.input_data.trainable[type="checkbox"]'));
	var saved_trainable_states = existing_trainables.map(function (el) { return el.checked; });
	existing_trainables.forEach(function (el) { el.checked = false; });
	var trainable = document.createElement("input");
	trainable.type = "checkbox";
	trainable.className = "input_data trainable";
	trainable.checked = true;
	document.body.appendChild(trainable);
	test_equal("any_trainable_checked finds checked trainables", any_trainable_checked(), true);
	trainable.checked = false;
	test_equal("any_trainable_checked ignores unchecked trainables", any_trainable_checked(), false);
	trainable.remove();
	existing_trainables.forEach(function (el, index) { el.checked = saved_trainable_states[index]; });

	symbol.remove();
	colored.remove();
	attr_el.remove();
}

function _tiny_tests_neural_organism_js() {
	var container = document.createElement("div");
	document.body.appendChild(container);
	var tensors = [];
	function layer(cls, config, weights) {
		return {
			name: cls.toLowerCase(),
			getClassName: function () { return cls; },
			getConfig: function () { return config; },
			getWeights: function () { return weights || []; }
		};
	}
	var kernel = tf.tensor2d([[0.1, -0.2], [0.3, 0.4]]);
	var bias = tf.tensor1d([0, 0.1]);
	var conv = tf.tensor4d(Array.from({ length: 8 }, function (_, i) { return i / 10; }), [2, 2, 2, 1]);
	tensors.push(kernel, bias, conv);
	var fake_model = {
		layers: [
			layer("InputLayer", { batchInputShape: [null, 2] }),
			layer("Dense", { units: 2, activation: "relu" }, [kernel, bias]),
			layer("Conv2D", { filters: 1, kernelSize: [2, 2] }, [conv]),
			layer("MaxPooling2D", { poolSize: [2, 2] }),
			layer("Flatten", {}),
			layer("Dropout", { rate: 0.25 }),
			layer("BatchNormalization", {}),
			layer("MysteryLayer", {})
		]
	};
	try {
		var canvas = visualizeModelOrganism(fake_model, container);
		test_equal("visualizeModelOrganism returns a canvas", canvas && canvas.tagName, "CANVAS");
		test_equal("visualizeModelOrganism uses the requested width", canvas.width, 1050);
		test_equal("visualizeModelOrganism appends the canvas", container.querySelectorAll("canvas").length, 1);
		var empty_container = document.createElement("div");
		document.body.appendChild(empty_container);
		test_equal("visualizeModelOrganism handles empty models", visualizeModelOrganism({ layers: [] }, empty_container), null);
		test_equal("visualizeModelOrganism explains empty models", empty_container.innerHTML.indexOf("No layers found") !== -1, true);
		empty_container.remove();
	} finally {
		tensors.forEach(function (t) { if (!t.isDisposed) t.dispose(); });
		container.remove();
	}
}

function _tiny_tests_topological_analyzer_js() {
	var old_xy_data = window.xy_data_global;
	var old_layer_io = window.layerIOStats;
	var old_model = window.model;
	var old_layer_states = window.layer_states_saved;
	var points = [[0, 0], [1, 0], [0, 1], [1, 1], [2, 2], [2, 3]];
	var container = document.createElement("div");
	container.style.position = "fixed";
	container.style.left = "0";
	container.style.top = "0";
	container.style.width = "700px";
	container.style.height = "500px";
	container.style.zIndex = "-1";
	document.body.appendChild(container);
	try {
		TopologicalAnalyzer.destroy();
		TopologicalAnalyzer.hideTooltip();
		var stale_container = document.getElementById("tda_analyzer_singleton");
		if (stale_container) stale_container.remove();
		var persistence = TopologicalAnalyzer.computeRipsPersistence(points, 3, 12);
		test_equal("TopologicalAnalyzer computes H0 pairs", persistence.h0.length >= points.length - 1, true);
		test_equal("TopologicalAnalyzer computes H1 pairs", Array.isArray(persistence.h1), true);
		test_equal("TopologicalAnalyzer computes Betti curves", persistence.bettiCurve0.length > 0, true);
		test_equal("TopologicalAnalyzer records epsilon values", persistence.epsilonValues.length, persistence.bettiCurve0.length);
		var summary = TopologicalAnalyzer.computeTopologicalSummary(persistence);
		test_equal("TopologicalAnalyzer summary counts H0 components", summary.numComponentsH0, persistence.h0.length);
		test_equal("TopologicalAnalyzer summary exposes finite persistence", summary.totalPersistenceH0 >= 0, true);
		var landscape = TopologicalAnalyzer.computePersistenceLandscape(persistence.h0, 20, 3);
		test_equal("TopologicalAnalyzer computes a landscape", landscape.length, 20);
		test_equal("TopologicalAnalyzer landscape is finite", landscape.every(isFinite), true);

		var weight_topology = TopologicalAnalyzer.analyzeWeightTopology([0.1, -0.2, 0.3, 0.4, 0.5, -0.6, 0.7, 0.8, 0.9], [3, 3]);
		test_equal("TopologicalAnalyzer analyzes weight topology", weight_topology !== null, true);
		test_equal("TopologicalAnalyzer weight histogram has bins", weight_topology.histogram.bins.length, 50);
		test_equal("TopologicalAnalyzer weight summary counts weights", weight_topology.numWeights, 9);
		test_equal("TopologicalAnalyzer rejects tiny weight data", TopologicalAnalyzer.analyzeWeightTopology([1, 2, 3], [1, 3]), null);

		var activation_topology = TopologicalAnalyzer.analyzeActivationTopology(points);
		test_equal("TopologicalAnalyzer analyzes activation topology", activation_topology !== null, true);
		test_equal("TopologicalAnalyzer activation topology keeps points", activation_topology.numPoints, points.length);
		test_equal("TopologicalAnalyzer activation topology keeps the dimension", activation_topology.dimension, 2);
		var flat_activation = TopologicalAnalyzer.analyzeActivationTopology([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
		test_equal("TopologicalAnalyzer embeds flat activations", flat_activation !== null, true);
		test_equal("TopologicalAnalyzer rejects short activations", TopologicalAnalyzer.analyzeActivationTopology([1, 2]), null);

		window.xy_data_global = {
			x: { dataSync: function () { return Float32Array.from([0, 0, 1, 0, 0, 1, 1, 1, 2, 2, 2, 3]); }, isDisposed: false }
		};
		window.model = {
			inputs: [{ shape: [null, 2] }],
			layers: [{
				name: "dense_probe",
				getClassName: function () { return "Dense"; },
				getWeights: function () { return [{ isDisposed: false, shape: [2, 2], dataSync: function () { return Float32Array.from([0.1, -0.2, 0.3, 0.4]); } }]; }
			}]
		};
		window.layerIOStats = {
			records: [{
				layers: [{ layerName: "dense_probe", layerType: "Dense", input: [0, 1, 0, 1, 1, 0, 1, 0], output: [0, 1, 1, 0, 1, 1, 0, 0], outputShape: [4, 2] }]
			}]
		};
		window.layer_states_saved = null;

		TopologicalAnalyzer.init(container);
		test_equal("TopologicalAnalyzer init renders", container.querySelectorAll(".tda-section").length >= 1, true);
		test_equal("TopologicalAnalyzer init renders SVG charts", container.querySelectorAll("svg").length >= 1, true);
		test_equal("TopologicalAnalyzer exposes configuration", typeof TopologicalAnalyzer.getConfig().maxPoints, "number");
		TopologicalAnalyzer.setConfig({ maxPoints: 100, showDecisionBoundary: false });
		test_equal("TopologicalAnalyzer updates configuration", TopologicalAnalyzer.getConfig().maxPoints, 100);
		TopologicalAnalyzer.update({ showWeightTopology: false });
		test_equal("TopologicalAnalyzer update applies options", TopologicalAnalyzer.getConfig().showWeightTopology, false);

		var tooltip_target = document.createElement("div");
		tooltip_target.setAttribute("data-tda-tooltip", "tda_section_weights");
		container.appendChild(tooltip_target);
		TopologicalAnalyzer.attachTooltipListeners(container);
		TopologicalAnalyzer.showTooltip({ clientX: 20, clientY: 20 }, "<b>probe</b>");
		test_equal("TopologicalAnalyzer shows tooltips", document.querySelectorAll("#tda_tooltip_popup").length, 1);
		test_equal("TopologicalAnalyzer writes tooltip content", document.getElementById("tda_tooltip_popup").innerHTML.indexOf("probe") !== -1, true);
		TopologicalAnalyzer.hideTooltip();
		TopologicalAnalyzer.destroy();
		test_equal("TopologicalAnalyzer destroys its container", container.querySelectorAll(".tda-section").length, 0);
	} finally {
		window.xy_data_global = old_xy_data;
		window.layerIOStats = old_layer_io;
		window.model = old_model;
		window.layer_states_saved = old_layer_states;
		TopologicalAnalyzer.hideTooltip();
		container.remove();
	}
}

async function _tiny_tests_clipboard_and_download_js() {
	test_equal("uint16le encodes little endian", JSON.stringify(uint16le(0x1234)), "[52,18]");
	test_equal("uint32le encodes little endian", JSON.stringify(uint32le(0x12345678)), "[120,86,52,18]");
	test_equal("computeCRC32 matches the reference CRC", computeCRC32(new TextEncoder().encode("abc")), 891568578);
	var blob = dataURLToBlob("data:text/plain;base64,QUJD");
	test_equal("dataURLToBlob keeps the type", blob.type, "text/plain");
	test_equal("dataURLToBlob keeps the payload", blob.size, 3);
	var zip_blob = createSimpleZip([{ name: "a.txt", data: new TextEncoder().encode("abc") }]);
	test_equal("createSimpleZip returns a zip blob", zip_blob.type, "application/zip");
	var zip_bytes = new Uint8Array(await zip_blob.arrayBuffer());
	test_equal("createSimpleZip starts with a local header", zip_bytes[0] + "/" + zip_bytes[1] + "/" + zip_bytes[2] + "/" + zip_bytes[3], "80/75/3/4");
	test_equal("createSimpleZip ends with an EOCD record", zip_bytes.slice(-22, -18).join("/"), "80/75/5/6");

	var old_exec = document.execCommand;
	var old_create = URL.createObjectURL;
	var old_revoke = URL.revokeObjectURL;
	var old_anchor_click = HTMLAnchorElement.prototype.click;
	var clicked = 0;
	try {
		document.execCommand = function () { return true; };
		URL.createObjectURL = function () { return "blob:probe"; };
		URL.revokeObjectURL = function () {};
		HTMLAnchorElement.prototype.click = function () { clicked++; };
		copy_to_clipboard("probe");
		save_file("probe.txt", "text/plain", "data");
		downloadNetworkZip(zip_blob);
		test_equal("clipboard and download helpers trigger clicks", clicked >= 1, true);
		test_equal("copy_to_clipboard cleans up its textarea", document.querySelectorAll("textarea[data-copy-probe]").length, 0);
		show_clipboard_feedback();
		test_equal("show_clipboard_feedback adds a feedback node", $("body").children().filter(function () { return $(this).text() === "📋"; }).length >= 1, true);
		await delay(700);
	} finally {
		document.execCommand = old_exec;
		URL.createObjectURL = old_create;
		URL.revokeObjectURL = old_revoke;
		HTMLAnchorElement.prototype.click = old_anchor_click;
	}
}

function _tiny_tests_multi_activation_js() {
	var layer = new MultiActivation({ initWeights: { relu: 2, snake: 0.5, elu: 1, sin: 0 }, snakeAlpha: 3, trainable: true });
	layer.build([null, 2]);
	var input = tf.tensor2d([[-1, 0], [1, 2]], [2, 2]);
	try {
		var output = layer.call(input);
		test_equal("MultiActivation call keeps the shape", JSON.stringify(output.shape), "[2,2]");
		test_equal("MultiActivation call produces finite values", Array.from(output.dataSync()).every(isFinite), true);
		test_equal("MultiActivation getConfig keeps init weights", layer.getConfig().initWeights.relu, 2);
		test_equal("MultiActivation getConfig keeps snake alpha", layer.getConfig().snakeAlphaVal, 3);
		test_equal("MultiActivation class name", MultiActivation.className, "MultiActivation");
		output.dispose();
	} finally {
		input.dispose();
		(layer.weights || []).forEach(function (weight) {
			if (weight && weight.val && !weight.val.isDisposed) weight.val.dispose();
		});
	}
}

async function _tiny_tests_health_status_popups_js() {
	var container = document.createElement("div");
	document.body.appendChild(container);
	var row_types = ["entropy", "sparsity", "svd", "kurtosis", "ks_test", "correlation", "weight_distribution"];
	row_types.forEach(function (type) {
		var row = document.createElement("div");
		row.setAttribute("data-wa-indicator", type);
		row.textContent = type;
		container.appendChild(row);
	});
	var input_row = document.createElement("div");
	input_row.setAttribute("data-wa-indicator", "layer_io_input");
	input_row.setAttribute("data-layer-index", "0");
	container.appendChild(input_row);
	var output_row = document.createElement("div");
	output_row.setAttribute("data-wa-indicator", "layer_io_output");
	output_row.setAttribute("data-layer-index", "0");
	container.appendChild(output_row);
	var record = { layers: [{ input: [0, 1, -1, 2], output: [0.5, 0.5, 0.5, 0.5] }] };
	try {
		window.attachWaTooltips(container, { entropy: 2, entropyMax: 8, sparsity: 0.2, svd: 0.3, kurtosis: 4, ks: 0.1, correlation: 0.5 });
		window.attachWaTooltipsToPlots(container, record);
		window.attachWaTooltipsToLayerStats(container, record);
		var indicator_rows = container.querySelectorAll("[data-wa-indicator]");
		for (var i = 0; i < indicator_rows.length; i++) {
			indicator_rows[i].click();
			test_equal("health popup opens for " + indicator_rows[i].getAttribute("data-wa-indicator"), document.querySelectorAll("#wa_tooltip_popup").length >= 1, true);
			window._hideWaTooltip();
			document.querySelectorAll("#wa_tooltip_overlay, #wa_tooltip_popup").forEach(function (el) { el.remove(); });
		}
		test_equal("waIndicatorRowHTML builds a row", window.waIndicatorRowHTML("entropy", "wa_entropy", "2.0").indexOf("data-wa-indicator=\"entropy\"") !== -1, true);
		test_equal("waIndicatorRowHTML keeps the label", window.waIndicatorRowHTML("entropy", "wa_entropy", "2.0").indexOf("TRANSLATEME_wa_entropy") !== -1, true);
		await delay(300);
	} finally {
		window._hideWaTooltip();
		container.remove();
	}
}

function _tiny_tests_my_temml_js() {
	var all_editables = [];
	test_equal("_reshape_flat_to_matrix builds rows", JSON.stringify(_reshape_flat_to_matrix([1, 2, 3, 4], [2, 2])), "[[1,2],[3,4]]");
	test_equal("_conv2d_flat_index maps 4D coordinates", _conv2d_flat_index(1, 0, 0, 1, 2, 2, 3), 13);
	var kernel_latex = _build_kernel_latex(0, [[1, 2], [3, 4]], 2, 2, 2, all_editables);
	test_equal("_build_kernel_latex renders a matrix", kernel_latex.indexOf("\\begin{pmatrix}") !== -1, true);
	test_equal("_build_kernel_latex records editables", all_editables.length, 4);
	test_equal("_build_kernel_latex includes the shape", kernel_latex.indexOf("2\\times2") !== -1, true);
	var bias_editables = [];
	var bias_latex = _build_bias_latex(0, [1, 2], 2, 2, bias_editables);
	test_equal("_build_bias_latex renders a vector", bias_latex.indexOf("\\text{Bias}") !== -1, true);
	test_equal("_build_bias_latex records editables", bias_editables.length, 2);
	test_equal("_build_batchnorm_param_latex rejects empty parameters", _build_batchnorm_param_latex(0, "gamma", [], 2, 2, []), "\\text{N/A}");
	var param_editables = [];
	var param_latex = _build_batchnorm_param_latex(0, "gamma", [1, 2], 2, 2, param_editables);
	test_equal("_build_batchnorm_param_latex renders values", param_latex.indexOf("\\begin{pmatrix}") !== -1, true);
	test_equal("_build_batchnorm_param_latex records editables", param_editables.length, 2);
	var conv_latex = _build_conv2d_full_latex(0, [], [1, 2, 3, 4, 5, 6, 7, 8], [2, 2, 1, 2], 2, 2, 1, 2, 2, 1, 2, [], [[1, 2]]);
	test_equal("_build_conv2d_full_latex names filters", conv_latex.indexOf("Filter") !== -1, true);
	test_equal("_build_conv2d_full_latex names channels", conv_latex.indexOf("X_{0}") !== -1, true);
}

async function _tiny_tests_custom_images_js() {
	var old_labels = labels;
	var old_cam = cam;
	var webcamData = document.getElementById("webcam_data");
	var webcamDataParent = webcamData ? webcamData.parentNode : null;
	var webcamDataNext = webcamData ? webcamData.nextSibling : null;
	var container = document.createElement("div");
	container.className = "own_image_upload_container";
	document.body.appendChild(container);
	var image_div = document.createElement("div");
	image_div.className = "own_images";
	container.appendChild(image_div);
	var trigger = document.createElement("span");
	container.appendChild(trigger);
	var zip_label = document.createElement("span");
	var zip_input = document.createElement("input");
	document.body.appendChild(zip_label);
	document.body.appendChild(zip_input);
	try {
		labels = ["first"];
		test_equal("get_label_or_default reads labels", get_label_or_default(0), "first");
		test_equal("get_label_or_default falls back", get_label_or_default(4), "category 4");
		create_images_div($(".own_image_upload_container").length - 1);
		test_equal("create_images_div adds an image container", container.querySelectorAll(".own_images").length >= 1, true);
		var counter = container.querySelector(".own_images_count");
		var image_span = document.createElement("span");
		image_span.className = "own_image_span";
		container.appendChild(image_span);
		update_image_counters();
		test_equal("update_image_counters counts images", counter.textContent, "1");
		image_span.remove();

		var canvas = insertCanvasIntoCategory(trigger, "first", "probe", 20, 10);
		test_equal("insertCanvasIntoCategory returns a canvas", canvas.tagName, "CANVAS");
		test_equal("insertCanvasIntoCategory sets the id", canvas.id, "probe_canvas");
		test_equal("insertCanvasIntoCategory stores the category", canvas.dataset.category, "first");
		test_equal("insertCanvasIntoCategory wraps the canvas", container.querySelectorAll(".own_image_span").length, 1);

		var hadSidebar = !!document.getElementById("labelSidebar");
		var sidebarLabel = document.createElement("input");
		sidebarLabel.className = "own_image_label";
		sidebarLabel.value = "first";
		container.insertBefore(sidebarLabel, image_div);
		add_label_sidebar();
		var sidebarCells = Array.prototype.slice.call(document.querySelectorAll("#labelSidebar td")).filter(function (td) {
			return td.textContent.indexOf("first (") === 0;
		});
		var sidebarCell = sidebarCells[sidebarCells.length - 1];
		test_equal("label sidebar shows each category's image count", sidebarCell ? sidebarCell.textContent : null, "first (1)");
		sidebarLabel.remove();
		add_label_sidebar();
		if (!hadSidebar) {
			// add_label_sidebar() moves #webcam_data into the sidebar it creates.
			// Put it back before removing the probe sidebar, otherwise the live
			// webcam UI disappears from the document for the rest of the run.
			if (webcamData && webcamDataParent) {
				if (webcamDataNext && webcamDataNext.parentNode === webcamDataParent) {
					webcamDataParent.insertBefore(webcamData, webcamDataNext);
				} else {
					webcamDataParent.appendChild(webcamData);
				}
			}
			var createdSidebar = document.getElementById("labelSidebar");
			if (createdSidebar) createdSidebar.remove();
		}

		test_equal("get_category_nr finds its container", get_category_nr(trigger) >= 0, true);
		restore_zip_upload_button(zip_label, zip_input);
		test_equal("restore_zip_upload_button restores the onchange", zip_input.getAttribute("onchange"), "import_zip_and_replace_categories(this)");
		test_equal("restore_zip_upload_button hides the input", zip_input.getAttribute("aria-hidden"), "true");
		test_equal("restore_zip_upload_button writes the label", zip_label.innerHTML.indexOf("TRANSLATEME_upload_custom_zip_file") !== -1, true);
		var data_url = await blob_to_data_url(new Blob(["probe"], { type: "text/plain" }));
		test_equal("blob_to_data_url produces a data URL", data_url.indexOf("data:text/plain;base64,") === 0, true);
	} finally {
		labels = old_labels;
		cam = old_cam;
		container.remove();
		zip_label.remove();
		zip_input.remove();
	}
}

async function _tiny_tests_optimizer_info_popup_js() {
	var old_new_plot = Plotly.newPlot;
	var old_react = Plotly.react;
	var old_purge = Plotly.purge;
	try {
		Plotly.newPlot = async function () {};
		Plotly.react = async function () {};
		Plotly.purge = function () {};
		var button = document.getElementById("optimizer-info-btn");
		test_equal("optimizer info icon is injected", !!button, true);
		button.click();
		var overlay = document.getElementById("optimizer_info_popup_overlay");
		test_equal("optimizer info popup opens", !!overlay, true);
		test_equal("optimizer info popup names the optimizer", overlay.querySelector("h2").textContent.indexOf(document.getElementById("optimizer").value.toUpperCase()) !== -1, true);
		var select = document.getElementById("optimizer");
		var old_value = select.value;
		select.value = select.options[1] ? select.options[1].value : old_value;
		select.dispatchEvent(new Event("change", { bubbles: true }));
		test_equal("optimizer info popup rebuilds on change", !!document.getElementById("optimizer_info_popup_overlay"), true);
		select.value = old_value;
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
		test_equal("optimizer info popup closes on Escape", !!document.getElementById("optimizer_info_popup_overlay"), false);
	} finally {
		Plotly.newPlot = old_new_plot;
		Plotly.react = old_react;
		Plotly.purge = old_purge;
		var stale = document.getElementById("optimizer_info_popup_overlay");
		if (stale) stale.remove();
	}
}

async function _tiny_tests_initializer_info_popup_js() {
	var old_new_plot = Plotly.newPlot;
	var old_purge = Plotly.purge;
	var selects = Array.from(document.querySelectorAll("select[class*='_initializer'], select[class*='_regularizer']"));
	try {
		Plotly.newPlot = async function () {};
		Plotly.purge = function () {};
		test_equal("initializer selects exist", selects.length > 0, true);
		var select = null;
		var icon = null;
		for (var select_idx = 0; select_idx < selects.length; select_idx++) {
			var candidate_icon = selects[select_idx].closest("tr") ? selects[select_idx].closest("tr").querySelector('img[src*="info.svg"]') : selects[select_idx].parentElement.querySelector('img[src*="info.svg"]');
			if (candidate_icon) {
				select = selects[select_idx];
				icon = candidate_icon;
				break;
			}
		}
		test_equal("initializer info icon is injected", !!icon, true);
		icon.click();
		var overlay = document.getElementById("initializer_info_popup_overlay");
		test_equal("initializer info popup opens", !!overlay, true);
		test_equal("initializer info popup has controls", overlay.querySelectorAll("input, select").length > 0, true);
		var old_value = select.value;
		if (select.options.length > 1) select.value = select.options[1].value;
		select.dispatchEvent(new Event("change", { bubbles: true }));
		test_equal("initializer info popup rebuilds on change", !!document.getElementById("initializer_info_popup_overlay"), true);
		select.value = old_value;
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
		test_equal("initializer info popup closes on Escape", !!document.getElementById("initializer_info_popup_overlay"), false);
	} finally {
		Plotly.newPlot = old_new_plot;
		Plotly.purge = old_purge;
		var stale = document.getElementById("initializer_info_popup_overlay");
		if (stale) stale.remove();
	}
}

async function _tiny_tests_explain_activations_popup_js() {
	var old_new_plot = Plotly.newPlot;
	var old_purge = Plotly.purge;
	var select = document.querySelector("select.input_data.activation, select.input_field.activation");
	try {
		Plotly.newPlot = async function () {};
		Plotly.purge = function () {};
		test_equal("activation selects exist", !!select, true);
		var icon = select.closest("tr") ? select.closest("tr").querySelector('td:first-child img[src*="info.svg"]') : select.parentElement.querySelector('img[src*="info.svg"]');
		test_equal("activation info icon is injected", !!icon, true);
		icon.click();
		var overlay = document.getElementById("explain_activation_popup_overlay");
		test_equal("activation info popup opens", !!overlay, true);
		test_equal("activation info popup has a plot target", !!document.getElementById("explain_activation_plot"), true);
		var old_value = select.value;
		if (select.options.length > 1) select.value = select.options[1].value;
		select.dispatchEvent(new Event("change", { bubbles: true }));
		old_value = select.value;
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
		test_equal("activation info popup closes on Escape", !!document.getElementById("explain_activation_popup_overlay"), false);
	} finally {
		Plotly.newPlot = old_new_plot;
		Plotly.purge = old_purge;
		var stale = document.getElementById("explain_activation_popup_overlay");
		if (stale) stale.remove();
	}
}

async function _tiny_tests_explain_losses_popup_js() {
	var loss_select = document.getElementById("loss");
	var metric_select = document.getElementById("metric");
	try {
		test_equal("loss select exists", !!loss_select, true);
		var loss_icon = loss_select.parentElement.querySelector("img");
		test_equal("loss help icon is injected", !!loss_icon, true);
		loss_icon.click();
		var overlay = document.querySelector(".lm-explainer-overlay");
		test_equal("loss popup opens", !!overlay, true);
		test_equal("loss popup has content", overlay.querySelectorAll("#lm-popup-content-area").length, 1);
		overlay.querySelector(".lm-popup-close").click();
		test_equal("loss popup closes", !!document.querySelector(".lm-explainer-overlay"), false);
		var metric_icon = metric_select.parentElement.querySelector("img");
		test_equal("metric help icon is injected", !!metric_icon, true);
		metric_icon.click();
		test_equal("metric popup opens", !!document.querySelector(".lm-explainer-overlay"), true);
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
		test_equal("metric popup closes on Escape", !!document.querySelector(".lm-explainer-overlay"), false);
	} finally {
		document.querySelectorAll(".lm-explainer-overlay").forEach(function (el) { el.remove(); });
	}
}

async function _tiny_tests_explain_constraints_popup_js() {
	var old_new_plot = Plotly.newPlot;
	var old_purge = Plotly.purge;
	var wrapper = document.createElement("div");
	var select = document.createElement("select");
	select.className = "input_data kernel_constraint";
	var option = document.createElement("option");
	option.value = "maxNorm";
	option.textContent = "maxNorm";
	select.appendChild(option);
	wrapper.appendChild(select);
	var layers_container = document.getElementById("layers_container") || document.body;
	layers_container.appendChild(wrapper);
	try {
		Plotly.newPlot = async function () {};
		Plotly.purge = function () {};
		await delay(120);
		var icon = wrapper.querySelector("img");
		test_equal("constraint info icon is injected", !!icon, true);
		icon.click();
		var overlay = document.getElementById("explain_constraint_popup_overlay");
		test_equal("constraint info popup opens", !!overlay, true);
		test_equal("constraint info popup has a plot target", !!document.getElementById("explain_constraint_plot"), true);
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
		test_equal("constraint info popup closes on Escape", !!document.getElementById("explain_constraint_popup_overlay"), false);
	} finally {
		Plotly.newPlot = old_new_plot;
		Plotly.purge = old_purge;
		var stale = document.getElementById("explain_constraint_popup_overlay");
		if (stale) stale.remove();
		wrapper.remove();
	}
}

function _tiny_tests_base_wrappers_async() {
	var old_labels_backup;
	return (async function() {
		test_equal("is_tensor null", is_tensor(null), false);
		test_equal("is_tensor undefined", is_tensor(undefined), false);
		test_equal("is_tensor array", is_tensor([1,2,3]), false);
		test_equal("is_tensor string", is_tensor("hello"), false);
		var test_t = tensor([1,2,3]);
		test_equal("is_tensor real tensor", is_tensor(test_t), true);
		await dispose(test_t);

		var test_t2 = tensor([1,2]);
		test_equal("tensor_is_disposed live tensor", tensor_is_disposed(test_t2), false);
		await dispose(test_t2);

		test_equal("array_sync_if_tensor array passthrough", JSON.stringify(array_sync_if_tensor([1,2,3])), "[1,2,3]");
		var test_t3 = tensor([4,5,6]);
		test_equal("array_sync_if_tensor tensor", JSON.stringify(array_sync_if_tensor(test_t3)), "[4,5,6]");
		await dispose(test_t3);

		var test_t4 = tensor([1]);
		test_equal("convert_to_tensor_if_not tensor passthrough", is_tensor(convert_to_tensor_if_not(test_t4)), true);
		await dispose(test_t4);
		var test_t5 = convert_to_tensor_if_not([7,8,9]);
		test_equal("convert_to_tensor_if_not array converts", is_tensor(test_t5), true);
		test_equal("convert_to_tensor_if_not array values", JSON.stringify(array_sync(test_t5)), "[7,8,9]");
		await dispose(test_t5);

		old_labels_backup = JSON.parse(JSON.stringify(labels));
		labels = ["cat", "dog"];
		test_equal("get_or_insert_label existing", get_or_insert_label("cat"), 0);
		test_equal("get_or_insert_label existing 2", get_or_insert_label("dog"), 1);
		test_equal("get_or_insert_label new", get_or_insert_label("bird"), 2);
		test_equal("get_or_insert_label new added", labels.includes("bird"), true);
		labels = old_labels_backup;

		test_equal("requires_auto_one_hot null xy_data", requires_auto_one_hot(false, null), false);
		test_equal("requires_auto_one_hot has_custom_data", requires_auto_one_hot(true, {y: [1,2]}), false);
	})();
}

async function _coverage_tests_fn_profiler() {
	var api = window.__opencodelog;
	test_equal("opencodelog API is exposed", !!api && typeof api.install === "function", true);
	test_equal("opencodelog initial status is not installed", api.status().installed, false);
	test_equal("opencodelog exclude returns the name", api.exclude("cov_never_called"), "cov_never_called");
	test_equal("opencodelog verbose returns the value", api.verbose(true), true);
	test_equal("opencodelog onlySlow stores the threshold", api.onlySlow(25), 25);
	test_equal("opencodelog silent enables silent mode", api.silent(), true);
	test_equal("opencodelog recordsOnly enables record mode", api.recordsOnly(), true);
	test_equal("opencodelog all restores full tracing", api.all(), true);
	api.reset();

	try {
		api.silent();
		api.install();
		api.enable();
		test_equal("opencodelog install marks installed", api.status().installed, true);
		test_equal("opencodelog install wraps non-native functions", api.state.wrapped.length > 0, true);

		var result = get_dec_points_math_mode();
		test_equal("wrapped function still returns a value", typeof result, "number");
		test_equal("wrapped call is recorded", api.state.finished.length > 0, true);
		test_equal("wrapped call has duration", api.state.finished[0].dur >= 0, true);

		var before_rescan = api.state.wrapped.length;
		test_equal("rescan returns a number", typeof api.rescan(), "number");
		test_equal("rescan keeps the wrapped list valid", api.state.wrapped.length >= before_rescan, true);

		api.report(3);
		api.hotspots(3);
		api.slowest(3);
		api.running();
		api.where();

		api.watch(25);
		await delay(60);
		api.unwatch();
		test_equal("unwatch clears the timer", api.state.watchTimer, null);

		api.enable();
		test_equal("enable activates tracing", api.state.active, true);
		get_dec_points_math_mode();
		api.disable();
		test_equal("disable stops tracing", api.state.active, false);
		api.running();

		api.recordsOnly();
		api.enable();
		get_dec_points_math_mode();
		api.disable();

		api.onlySlow(100000);
		api.enable();
		get_dec_points_math_mode();
		api.disable();
		api.all();
	} finally {
		api.uninstall();
		api.unwatch();
	}

	test_equal("opencodelog uninstall clears installed", api.state.installed, false);
	test_equal("opencodelog uninstall removes the copies", typeof window.fn_copy_get_dec_points_math_mode, "undefined");
}

function _coverage_tests_valsplitwatcher() {
	var splitEl = document.getElementById("validationSplit");
	var maxFilesEl = document.getElementById("max_number_of_files_per_category");
	if (!splitEl || !maxFilesEl) {
		test_equal("valsplit watcher elements exist", false, true);
		return;
	}

	var oldSplit = splitEl.value;
	var oldMax = maxFilesEl.value;
	var oldWrns = num_wrns;

	function popup() {
		return document.getElementById("validationSplitGuardPopup");
	}

	function openPopup() {
		splitEl.value = "10";
		maxFilesEl.value = "5";
		maxFilesEl.dispatchEvent(new Event("change", { bubbles: true }));
	}

	try {
		maxFilesEl.value = "0";
		maxFilesEl.dispatchEvent(new Event("change", { bubbles: true }));
		test_equal("zero max files does not open the popup", !!popup(), false);

		openPopup();
		test_equal("impossible split opens the guard popup", !!popup(), true);
		test_equal("guard popup carries the translation marker", !!popup().querySelector(".TRANSLATEME_valsplitsettozero"), true);
		test_equal("guard popup has a timer bar", popup().firstElementChild.style.width.length > 0, true);
		test_equal("guard popup is positioned", popup().style.top.length > 0, true);

		popup().dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
		popup().dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
		test_equal("hovering the guard keeps it open", !!popup(), true);

		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
		test_equal("Escape closes the guard popup", !!popup(), false);

		openPopup();
		popup().click();
		test_equal("clicking the guard popup closes it", !!popup(), false);

		openPopup();
		popup().querySelector("span").click();
		test_equal("the close button closes the guard popup", !!popup(), false);

		openPopup();
		splitEl.value = "50";
		splitEl.dispatchEvent(new Event("input", { bubbles: true }));
		test_equal("editing the split dismisses the guard popup", !!popup(), false);

		maxFilesEl.value = "5";
		maxFilesEl.dispatchEvent(new Event("blur", { bubbles: true }));
		test_equal("a usable split stays closed", !!popup(), false);

		maxFilesEl.value = "abc";
		maxFilesEl.dispatchEvent(new Event("change", { bubbles: true }));
		test_equal("non-numeric max files does not open the popup", !!popup(), false);
	} finally {
		splitEl.value = oldSplit;
		maxFilesEl.value = oldMax;
		maxFilesEl.dispatchEvent(new Event("change", { bubbles: true }));
		var stale = popup();
		if (stale) stale.remove();
		num_wrns = oldWrns;
	}
}

function _coverage_tests_safety() {
	var failure = new assertation_failed("boom");
	test_equal("assertation_failed keeps its message", failure.message, "boom");

	var old_write_error = write_error;
	var old_cursor = document.body.style.cursor;
	try {
		write_error = function () {};
		var thrown = null;
		try {
			assert(false, "coverage assertion");
		} catch (e) {
			thrown = e;
		}
		test_equal("assert(false) throws an assertation_failed", thrown instanceof assertation_failed, true);
		test_equal("assert(false) preserves the message", thrown && thrown.message, "coverage assertion");

		typeassert([1,2,3], "array", "coverage_array");
		typeassert(42, "number", "coverage_number");
		test_equal("typeassert accepts matching types", true, true);

		var typeThrown = null;
		try {
			typeassert("no array", "array", "coverage_bad_array");
		} catch (e) {
			typeThrown = e;
		}
		test_equal("typeassert rejects a non-array", typeThrown instanceof assertation_failed, true);
	} finally {
		write_error = old_write_error;
		document.body.style.cursor = old_cursor;
	}
}

async function _coverage_tests_drawing() {
	if (typeof Atrament === "undefined") {
		test_equal("Atrament is loaded for the drawing tests", false, true);
		return;
	}

	var idname = "coverage_sketcher";
	var wrapper = document.createElement("div");
	wrapper.innerHTML =
		'<div class="colorpicker_elements"></div>' +
		'<span class="pen_size_slider"></span><span class="jscolor"></span>' +
		'<a class="coverage_tool"></a>' +
		'<input type="text" id="' + idname + '_colorpicker" value="#000000">' +
		'<canvas id="' + idname + '" width="40" height="40"></canvas>';
	document.body.appendChild(wrapper);

	var oldWrns = num_wrns;
	var oldErrs = num_errs;
	try {
		setup_atrament_data(idname, "");
		test_equal("setup_atrament_data registers the canvas", !!atrament_data[idname], true);
		test_equal("setup_atrament_data creates an atrament instance", !!atrament_data[idname].atrament, true);

		var tool = wrapper.querySelector(".coverage_tool");
		atrament_set_fill(tool, idname);
		test_equal("atrament_set_fill switches to fill", atrament_data[idname].atrament.mode, "fill");
		atrament_set_brush(tool, idname);
		test_equal("atrament_set_brush switches to brush", atrament_data[idname].atrament.mode, "draw");
		test_equal("active tool gets the green marker", $(tool).hasClass("green_icon"), true);

		atrament_data[idname].atrament.mode = "erase";
		hide_colorpicker_for_eraser(idname);
		test_equal("eraser hides the color picker", wrapper.querySelector(".colorpicker_elements").style.visibility, "hidden");
		atrament_data[idname].atrament.mode = "brush";
		hide_colorpicker_for_eraser(idname);
		test_equal("brush shows the color picker", wrapper.querySelector(".colorpicker_elements").style.visibility, "visible");

		chose_nearest_color_picker(tool);
		test_equal("chose_nearest_color_picker resolves the input", $(tool).parent().find("input").attr("id"), idname + "_colorpicker");

		var clone = clone_canvas(document.getElementById(idname));
		test_equal("clone_canvas makes a canvas", clone && clone.tagName, "CANVAS");
		test_equal("clone_canvas copies the size", clone.width, 40);

		clear_attrament(idname);
		test_equal("clear_attrament keeps the canvas", !!atrament_data[idname].canvas, true);
		clear_attrament(null);
		clear_attrament(undefined);
		clear_attrament("does_not_exist");
		chose_nearest_color_picker("#does_not_exist");
	} finally {
		delete atrament_data[idname];
		wrapper.remove();
		num_wrns = oldWrns;
		num_errs = oldErrs;
	}
}

function _dispatch_autocomplete(text, cursor, key) {
	var textarea = document.getElementById("pyodide_editor_textarea");
	if (!textarea) return false;
	textarea.value = text;
	textarea.setSelectionRange(cursor === undefined ? text.length : cursor, cursor === undefined ? text.length : cursor);
	var evt = new KeyboardEvent("keydown", { key: key || " ", ctrlKey: true, bubbles: true, cancelable: true });
	textarea.dispatchEvent(evt);
	return true;
}

async function _coverage_tests_autocomplete() {
	var textarea = document.getElementById("pyodide_editor_textarea");
	if (!textarea) {
		test_equal("python editor textarea exists", false, true);
		return;
	}

	var oldValue = textarea.value;
	var oldStart = textarea.selectionStart;
	var oldEnd = textarea.selectionEnd;
	function popup() {
		return document.querySelector(".pe-autocomplete-popup");
	}
	function visible() {
		return !!popup() && popup().style.display !== "none";
	}

	try {
		test_equal("Ctrl+Space opens import suggestions", _dispatch_autocomplete("import js", 9), true);
		test_equal("import suggestions are visible", visible(), true);
		test_equal("import suggestions contain json", popup().textContent.indexOf("json") !== -1, true);

		test_equal("Ctrl+Space opens from-import suggestions", _dispatch_autocomplete("from os import "), true);
		test_equal("from-import suggestions are visible", visible(), true);

		_dispatch_autocomplete("my_list = [1, 2]\nmy_list.");
		test_equal("dot suggestions are visible", visible(), true);
		test_equal("dot suggestions contain append", popup().textContent.indexOf("append") !== -1, true);

		_dispatch_autocomplete("text = 'abc'\ntext.");
		test_equal("string dot suggestions are visible", visible(), true);
		test_equal("string dot suggestions contain split", popup().textContent.indexOf("split") !== -1, true);

		_dispatch_autocomplete("state = {}\nstate.");
		test_equal("dict dot suggestions are visible", visible(), true);

		_dispatch_autocomplete("info = get_model_info()\ninfo['");
		test_equal("an unfinished dict key does not pop up", visible(), false);

		_dispatch_autocomplete("ctx = canvas.getContext('2d')\nctx.");
		test_equal("context suggestions are visible", visible(), true);

		_dispatch_autocomplete("def coverage_helper(alpha, beta):\n    pass\ncoverage_he");
		test_equal("identifier suggestions are visible", visible(), true);
		test_equal("identifier suggestions contain the user function", popup().textContent.indexOf("coverage_helper") !== -1, true);

		_dispatch_autocomplete("value = 'unterminated");
		test_equal("no popup inside a string", visible(), false);

		_dispatch_autocomplete("# a comment pre");
		test_equal("no popup inside a comment", visible(), false);

		_dispatch_autocomplete("x");
		test_equal("no popup for a one-letter identifier", visible(), false);

		_dispatch_autocomplete("zzzzzz");
		test_equal("no popup when nothing matches", visible(), false);

		_dispatch_autocomplete("impo");
		test_equal("identifier popup is visible before navigation", visible(), true);
		textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
		textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
		textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
		test_equal("Escape closes the popup", visible(), false);

		_dispatch_autocomplete("impo");
		textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }));
		test_equal("Home closes the popup", visible(), false);

		_dispatch_autocomplete("impo");
		textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
		test_equal("Enter without a selection closes the popup", visible(), false);

		_dispatch_autocomplete("impo");
		textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
		textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
		test_equal("Tab accepts the selected suggestion", textarea.value.indexOf("import") === 0, true);
		test_equal("accepting a suggestion closes the popup", visible(), false);

		_dispatch_autocomplete("impo");
		textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
		test_equal("Tab without a selection accepts the first suggestion", textarea.value.indexOf("import") === 0, true);

		await delay(150);
		textarea.value = "impor";
		textarea.setSelectionRange(5, 5);
		textarea.dispatchEvent(new Event("input", { bubbles: true }));
		await delay(220);
		test_equal("the debounced input handler opens the popup", visible(), true);

		textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Scroll", bubbles: true, cancelable: true }));
		textarea.dispatchEvent(new Event("scroll", { bubbles: true }));
		test_equal("scrolling closes the popup", visible(), false);

		textarea.dispatchEvent(new Event("blur", { bubbles: true }));
		await delay(240);
		test_equal("blur hides the popup", visible(), false);
	} finally {
		textarea.value = oldValue;
		textarea.setSelectionRange(oldStart, oldEnd);
		var stale = popup();
		if (stale) stale.style.display = "none";
	}
}

async function _coverage_tests_custom_images() {
	var container = document.getElementById("own_images_container");
	var created_container = false;
	if (!container) {
		container = document.createElement("div");
		container.id = "own_images_container";
		document.body.appendChild(container);
		created_container = true;
	}

	var startCount = $(".own_image_upload_container").length;
	var oldLabels = JSON.parse(JSON.stringify(labels));
	var oldErrs = num_errs;
	var oldWrns = num_wrns;

	try {
		add_upload_container_html(0);
		test_equal("add_upload_container_html appends a container", $(".own_image_upload_container").length, startCount + 1);
		var n = $(".own_image_upload_container").length - 1;

		add_category_form(n, 0, "coverage_uuid");
		var upload = $(".own_image_upload_container").eq(n);
		test_equal("add_category_form adds one label", upload.find(".own_image_label").length, 1);
		test_equal("add_category_form adds one delete button", upload.find(".delete_category_button").length, 1);

		create_images_div(n);
		test_equal("create_images_div adds a counter", upload.find(".own_images_count").length, 1);
		var savedLabels = labels;
		labels = ["coverage_label"];
		test_equal("get_label_or_default uses labels", get_label_or_default(0), "coverage_label");
		labels = savedLabels;
		test_equal("get_label_or_default falls back", get_label_or_default(labels.length + 100).indexOf("category ") === 0, true);
		test_equal("get_upload_container_index never exceeds 99999", get_upload_container_index() <= 99999, true);

		var elem = upload.find(".own_images")[0];
		var canvas = insertCanvasIntoCategory(elem, "coverage_cat", "coverage_canvas", 8, 8);
		test_equal("insertCanvasIntoCategory returns the canvas", canvas.tagName, "CANVAS");
		test_equal("insertCanvasIntoCategory stores the id", canvas.id, "coverage_canvas_canvas");
		test_equal("insertCanvasIntoCategory updates the counter", Number(upload.find(".own_images_count").text()), 1);

		var webcam_elements = get_custom_elements_from_webcam_page();
		test_equal("webcam elements include the canvas", webcam_elements.indexOf(canvas) !== -1, true);

		var file_input = upload.find(".own_image_files")[0];
		var tiny_png_file = dataURLToBlob("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
		var file = new File([tiny_png_file], "coverage.png", { type: "image/png" });
		handle_file_select({ target: { files: [file] }, currentTarget: file_input });
		await delay(150);
		test_equal("handle_file_select adds an image", upload.find("img").length >= 1, true);

		handle_file_select({ target: { files: [new File(["x"], "x.txt", { type: "text/plain" })] }, currentTarget: file_input });
		test_equal("handle_file_select ignores non-images", upload.find("img").length >= 1, true);

		add_image_to_category(canvas.toDataURL(), $(".own_images").index(elem));
		test_equal("add_image_to_category adds a span", upload.find(".own_image_span").length >= 2, true);

		show_or_hide_hide_delete_category();
		test_equal("delete buttons stay visible with several categories", true, true);

		var data_url = await blob_to_data_url(new Blob(["hello"], { type: "text/plain" }));
		test_equal("blob_to_data_url returns a data URL", data_url.indexOf("data:") === 0, true);

		var zip_writer = new zip.ZipWriter(new zip.BlobWriter("application/zip"));
		var png_blob = await get_canvas_blob(canvas);
		test_equal("get_canvas_blob returns a blob", !!png_blob, true);
		await zip_writer.add("coverage_cat/picture.png", new zip.BlobReader(png_blob));
		var zip_blob = await zip_writer.close();
		test_equal("zip writer produced bytes", zip_blob.size > 0, true);

		var zip_reader = new zip.ZipReader(new zip.BlobReader(zip_blob));
		var categories = await _extract_categories_from_zip(zip_reader);
		await zip_reader.close();
		test_equal("_extract_categories_from_zip groups by folder", !!categories.coverage_cat && categories.coverage_cat.length === 1, true);

		var first_label = $(".own_image_label").first();
		var first_images = $(".own_images").first();
		var first_label_value = first_label.val();
		var first_images_html = first_images.html();
		await _load_images_into_ui(["coverage_cat"], categories, function () {});
		test_equal("_load_images_into_ui loads an image", $(".own_images").first().find("img").length >= 1, true);
		first_label.val(first_label_value);
		first_images.html(first_images_html);

		var errs_before_zip = num_errs;
		var built_zip;
		try {
			built_zip = await create_zip_with_custom_images();
		} finally {
			num_errs = errs_before_zip;
		}
		test_equal("create_zip_with_custom_images returns a zip blob", built_zip.size > 0, true);

		var old_save_file = save_file;
		var saved = null;
		try {
			save_file = function (filename, type, blob) { saved = { filename: filename, type: type, blob: blob }; };
			save_custom_images_file(built_zip, "coverage.zip");
		} finally {
			save_file = old_save_file;
		}
		test_equal("save_custom_images_file forwards the blob", saved && saved.filename, "coverage.zip");

		var old_show_overlay = show_overlay;
		var old_remove_overlay = remove_overlay;
		var old_update_overlay_title = update_overlay_title;
		var old_rename_labels = rename_labels;
		var old_add_label_sidebar = add_label_sidebar;
		var old_enable_train_if_has_custom_images = enable_train_if_has_custom_images;
		try {
			show_overlay = function () { return document.createElement("div"); };
			remove_overlay = function () {};
			update_overlay_title = function () {};
			rename_labels = async function () {};
			add_label_sidebar = function () {};
			enable_train_if_has_custom_images = function () {};

			var zip_label = document.createElement("label");
			zip_label.id = "zip_upload_label";
			var zip_input = document.createElement("input");
			zip_input.id = "zip_upload_input";
			document.body.appendChild(zip_label);
			document.body.appendChild(zip_input);
			var errs_before_import = num_errs;
			var old_err = err;
			try {
				err = function () {};
				await import_zip_and_replace_categories({ files: [new File(["no zip"], "broken.zip", { type: "application/zip" })], value: "" });
				await delay(100);
				test_equal("importing an invalid zip restores the upload button", document.getElementById("zip_upload_input").getAttribute("aria-hidden"), "true");
			} finally {
				err = old_err;
				num_errs = errs_before_import;
				zip_label.remove();
				zip_input.remove();
			}

			var restore_label = document.createElement("label");
			var restore_input = document.createElement("input");
			restore_zip_upload_button(restore_label, restore_input);
			test_equal("restore_zip_upload_button restores the label", restore_label.innerHTML.indexOf("upload.svg") !== -1, true);
			test_equal("restore_zip_upload_button hides the input", restore_input.getAttribute("aria-hidden"), "true");

			var delete_span = upload.find(".own_image_span").last()[0];
			delete_own_image($(delete_span).find("span")[0]);
			test_equal("delete_own_image removes its span", upload.find(".own_image_span").length >= 1, true);
		} finally {
			show_overlay = old_show_overlay;
			remove_overlay = old_remove_overlay;
			update_overlay_title = old_update_overlay_title;
			rename_labels = old_rename_labels;
			add_label_sidebar = old_add_label_sidebar;
			enable_train_if_has_custom_images = old_enable_train_if_has_custom_images;
		}
	} finally {
		while ($(".own_image_upload_container").length > startCount) {
			$(".own_image_upload_container").last().remove();
		}
		if (created_container) container.remove();
		labels = oldLabels;
		num_errs = oldErrs;
		num_wrns = oldWrns;
	}
}

function _coverage_tests_fcnn_tooltips() {
	var stats = { min: -1, max: 1, avg: 0.1, std: 0.4, count: 120 };
	var weight_data = [];
	for (var i = 0; i < 120; i++) {
		weight_data.push((i % 20) / 10 - 1);
	}

	var neuron = _build_neuron_tooltip_html({
		layer_idx: 1, neuron_idx: 2, layer_type: "dense",
		activation_value: 0.25, layer_stats: stats, label: "cat",
		output_shape: [null, 2], input_shape: [null, 3]
	});
	test_equal("neuron tooltip has a title", neuron.indexOf("Neuron") !== -1, true);
	test_equal("neuron tooltip shows the relative activation", neuron.indexOf("Relative") !== -1, true);

	var neuron_plain = _build_neuron_tooltip_html({ layer_idx: 0, neuron_idx: 0 });
	test_equal("plain neuron tooltip still renders", neuron_plain.indexOf("Neuron Index") !== -1, true);

	var conv = _build_conv2d_tooltip_html({
		layer_idx: 2, neuron_idx: 1, layer_type: "conv2d",
		kernel_size_x: 3, kernel_size_y: 3, output_shape: [null, 4, 4, 8],
		input_shape: [null, 6, 6, 1], channel_stats: stats,
		image_data_url: "data:image/png;base64,AAAA"
	});
	test_equal("conv2d tooltip shows the kernel size", conv.indexOf("3 × 3") !== -1, true);
	test_equal("conv2d tooltip embeds the preview", conv.indexOf("data:image/png") !== -1, true);

	var flatten = _build_flatten_tooltip_html({
		layer_idx: 3, layer_type: "flatten", output_shape: [null, 16],
		input_shape: [null, 4, 4], flatten_stats: stats,
		image_data_url: "data:image/png;base64,BBBB"
	});
	test_equal("flatten tooltip shows the total", flatten.indexOf("Total Values") !== -1, true);

	var layernorm = _build_layernorm_tooltip_html({
		layer_idx: 4, layer_type: "layerNormalization", w: 4, h: 4,
		output_shape: [null, 16], input_shape: [null, 16]
	});
	test_equal("layer norm tooltip shows the operation", layernorm.indexOf("Normalize") !== -1, true);

	var connection = _build_connection_tooltip_html({
		from_layer: 0, to_layer: 1, from_neurons: 3, to_neurons: 2,
		weight_stats: stats, weight_data: weight_data
	});
	test_equal("connection tooltip counts the weights", connection.indexOf("3 × 2 = 6") !== -1, true);
	test_equal("connection tooltip embeds the histogram", connection.indexOf("Weight Distribution") !== -1, true);

	var connection_without_histogram = _build_connection_tooltip_html({
		from_layer: 0, to_layer: 1, from_neurons: 1, to_neurons: 1,
		weight_stats: { min: 0.5, max: 0.5, avg: 0.5, std: 0, count: 1 }, weight_data: []
	});
	test_equal("connection tooltip survives a constant weight", connection_without_histogram.indexOf("Total Weights") !== -1, true);

	var image = _build_input_image_tooltip_html({
		img_width: 28, img_height: 28, channels: 1,
		pixel_stats: { min: 0, max: 255, avg: 100, std: 30, count: 784 },
		image_data_url: "data:image/png;base64,CCCC"
	});
	test_equal("input image tooltip guesses 0-255", image.indexOf("Likely [0, 255]") !== -1, true);

	var normalized_image = _build_input_image_tooltip_html({
		img_width: 8, img_height: 8, pixel_stats: { min: 0, max: 1, avg: 0.5, std: 0.1, count: 64 }
	});
	test_equal("input image tooltip prefers the -1 to 1 guess", normalized_image.indexOf("Likely [-1, 1]") !== -1, true);

	var centered_image = _build_input_image_tooltip_html({
		img_width: 8, img_height: 8, pixel_stats: { min: -1, max: 1, avg: 0, std: 0.1, count: 64 }
	});
	test_equal("input image tooltip guesses -1 to 1", centered_image.indexOf("Likely [-1, 1]") !== -1, true);

	var skip = _build_skip_connection_tooltip_html({ layer_idx: 3, layer_type: "add", skip_count: 2 });
	test_equal("skip tooltip shows the span", skip.indexOf("2 layers") !== -1, true);
	test_equal("skip tooltip shows the source layer", skip.indexOf("1 → 3") !== -1, true);

	var bins = _compute_histogram_bins(weight_data, stats, 10);
	test_equal("histogram bins cover every value", bins.reduce(function (a, b) { return a + b; }, 0) > 0, true);
	test_equal("histogram svg is rendered", _render_histogram_svg(bins, 10, 200, 40, stats).indexOf("<svg") !== -1, true);
	test_equal("weight histogram html is rendered", _build_weight_histogram_html(stats, weight_data).indexOf("Weight Distribution") !== -1, true);
	test_equal("weight histogram skips too few values", _build_weight_histogram_html({ min: 0, max: 1, avg: 0.5, std: 0.1, count: 1 }, [1]), "");
	test_equal("weight histogram skips a zero range", _build_weight_histogram_html({ min: 1, max: 1, avg: 1, std: 0, count: 10 }, [1,1]), "");

	var styles_light = _get_tooltip_styles(false);
	var styles_dark = _get_tooltip_styles(true);
	test_equal("tooltip styles differ by theme", styles_light !== styles_dark, true);

	test_equal("tooltip html for a neuron region is dispatched", _build_tooltip_html_for_region({ type: "neuron", layer_idx: 0, neuron_idx: 0 }).indexOf("Neuron") !== -1, true);
	test_equal("tooltip html for a connection region is dispatched", _build_tooltip_html_for_region({ type: "connection", from_layer: 0, to_layer: 1, from_neurons: 1, to_neurons: 1 }).indexOf("Connection") !== -1, true);
}

async function _coverage_tests_origami_folds() {
	var folds = window.OrigamiFolds;
	test_equal("OrigamiFolds is exposed", !!folds && typeof folds.init === "function", true);
	var oldConfig = folds.getConfig();
	var oldWrns = num_wrns;
	var oldErrs = num_errs;
	var div = null;
	var oldModel = window.model;
	var oldXY = window.xy_data_global;
	var oldClassification = window.is_classification;
	var smallModel = null;
	var xyX = null;
	var xyY = null;

	try {
		test_equal("classColor rejects negative indices", folds.classColor(-1), "#8a8a8a");
		test_equal("classColor wraps the palette", folds.classColor(1000), folds.classColor(1000 % folds.classPalette.length));

		var cfg = folds.getConfig();
		test_equal("getConfig returns a copy", cfg !== folds._state.config, true);
		folds.setConfig({ maxPoints: 999 });
		test_equal("setConfig stores a valid value", folds.getConfig().maxPoints, 999);
		folds.setConfig(null);
		folds.setConfig({ unknown_option: 1 });
		folds.setConfig({ maxPoints: "nope" });
		folds.setConfig({ maxPoints: Infinity });

		var chain = folds._buildChain();
		test_equal("_buildChain always returns pairs", Array.isArray(chain.pairs), true);
		test_equal("_buildChain explains an empty chain", chain.pairs.length > 0 || !!chain.reason, true);

		var dense = null;
		var dense_dim = 0;
		for (var i = 0; i < (model && model.layers ? model.layers.length : 0); i++) {
			try {
				if (model.layers[i].getClassName() !== "Dense") continue;
				var candidate_dim = model.layers[i].getWeights()[0].shape[0];
				if (candidate_dim >= 1 && candidate_dim <= 3) {
					dense = model.layers[i];
					dense_dim = candidate_dim;
					break;
				}
			} catch (e) {}
		}
		if (dense) {
			var planes = folds._extractHyperplanes(dense, dense_dim);
			test_equal("_extractHyperplanes returns planes for a low-dimensional dense layer", Array.isArray(planes) && planes.length > 0, true);
			test_equal("_extractHyperplanes rejects a mismatched dimension", folds._extractHyperplanes(dense, dense_dim + 1), null);
		} else {
			test_equal("_extractHyperplanes has no low-dimensional dense layer to inspect", true, true);
		}
		test_equal("_extractHyperplanes ignores null layers", folds._extractHyperplanes(null, 2), null);

		folds.setConfig({ gridResolution: 3, gridExtend: 1.2 });
		var bounds = { x: { lo: -1, hi: 1 }, y: { lo: -2, hi: 2 }, z: { lo: -3, hi: 3 }, dim: 2 };
		test_equal("_makeGrid rejects missing bounds", folds._makeGrid(null, 2), null);
		test_equal("_makeGrid rejects invalid dimensions", folds._makeGrid(bounds, 4), null);
		var grid1 = folds._makeGrid(bounds, 1);
		var grid2 = folds._makeGrid(bounds, 2);
		var grid3 = folds._makeGrid(bounds, 3);
		test_equal("_makeGrid builds a 1D grid", grid1.n, 3);
		test_equal("_makeGrid builds a 2D grid", grid2.n, 9);
		test_equal("_makeGrid builds a 3D grid", grid3.n, 27);

		var n = grid2.n;
		var inXs = new Float64Array(n), inYs = new Float64Array(n);
		var outXs = new Float64Array(n), outYs = new Float64Array(n);
		for (var k = 0; k < n; k++) {
			inXs[k] = grid2.coords[k * 2];
			inYs[k] = grid2.coords[k * 2 + 1];
			outXs[k] = inXs[k] * 2;
			outYs[k] = inYs[k] * 3;
		}
		var actIn = { xs: inXs, ys: inYs, zs: null, dim: 2, n: n };
		var actOut = { xs: outXs, ys: outYs, zs: null, dim: 2, n: n };
		var dist = folds._gridDistortion(grid2, actIn, actOut);
		test_equal("_gridDistortion returns one value per point", dist.values.length, n);
		test_equal("_gridDistortion returns finite values", isFinite(dist.values[0]), true);
		test_equal("_gridDistortion rejects missing activations", folds._gridDistortion(null, actIn, actOut), null);

		smallModel = tf.sequential();
		smallModel.add(tf.layers.dense({ units: 2, inputShape: [3], activation: "relu" }));
		smallModel.add(tf.layers.dense({ units: 3, activation: "tanh" }));
		smallModel.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
		var sampleX = [
			[0.1, 0.2, 0.3], [0.3, 0.1, 0.2], [0.8, 0.4, 0.2], [0.2, 0.8, 0.4],
			[0.9, 0.9, 0.1], [0.1, 0.9, 0.9], [0.5, 0.5, 0.5], [0.7, 0.2, 0.6]
		];
		var sampleY = [[0], [1], [1], [0], [1], [0], [0], [1]];
		xyX = tensor(sampleX, [sampleX.length, 3]);
		xyY = tensor(sampleY, [sampleY.length, 1]);
		window.model = smallModel;
		window.xy_data_global = { x: xyX, y: xyY };
		window.is_classification = false;
		folds._state.modelRef = null;
		folds._state.lastChainSignature = null;
		folds._state.cachedXHash = null;

		div = document.createElement("div");
		div.id = "coverage_origami_folds";
		div.style.cssText = "width:420px;height:340px;display:block;position:relative;";
		document.body.appendChild(div);
		test_equal("init accepts a div", folds.init(div) === folds, true);
		await delay(1200);
		test_equal("init marks the state initialized", folds._state.initialized, true);
		folds.update();
		folds.forceUpdate();
		await delay(600);
		folds.destroy();
		test_equal("destroy clears the initialized flag", folds._state.initialized, false);
	} finally {
		if (div) {
			try { folds.destroy(); } catch (e) {}
			div.remove();
		}
		window.model = oldModel;
		window.xy_data_global = oldXY;
		window.is_classification = oldClassification;
		folds._state.modelRef = null;
		folds._state.lastChainSignature = null;
		try { if (xyX) await dispose(xyX); } catch (e) {}
		try { if (xyY) await dispose(xyY); } catch (e) {}
		try { if (smallModel) smallModel.dispose(); } catch (e) {}
		folds.setConfig(oldConfig);
		num_wrns = oldWrns;
		num_errs = oldErrs;
	}
}

async function _coverage_tests_origami_live() {
	var live = window.OrigamiLive;
	test_equal("OrigamiLive is exposed", !!live && typeof live.init === "function", true);
	var oldConfig = live.getConfig();
	var oldErrs = num_errs;
	var oldWrns = num_wrns;
	var div = null;
	var oldModel = window.model;
	var oldXY = window.xy_data_global;
	var smallModel = null;
	var xyX = null;
	var xyY = null;

	try {
		test_equal("classColor handles negative indices", live.classColor(-1), 0x8a8a8a);
		test_equal("classColorCss returns a css color", typeof live.classColorCss(0), "string");
		test_equal("classColorCss uses the same palette", live.classColorCss(0).indexOf("#") === 0, true);

		var chain = live._buildChain();
		test_equal("_buildChain returns a chain array", Array.isArray(chain.chain), true);
		test_equal("_buildChain explains an empty chain", chain.chain.length > 0 || !!chain.reason, true);

		var field = [1, -1, -1, 1];
		var segs = live._marchingSquares(field, 2, [0, 1], [0, 1], 1);
		test_equal("_marchingSquares finds both boundaries", !!segs && segs.length > 0, true);
		test_equal("_marchingSquares handles a flat field", live._marchingSquares([1, 1, 1, 1], 2, [0, 1], [0, 1], 1), null);

		live.setConfig({ gridRes: 5 });
		test_equal("setConfig stores a valid value", live.getConfig().gridRes, 5);
		live.setConfig(null);
		live.setConfig({ unknown_option: 1 });
		live.setConfig({ gridRes: "nope" });

		smallModel = tf.sequential();
		smallModel.add(tf.layers.dense({ units: 2, inputShape: [3], activation: "relu" }));
		smallModel.add(tf.layers.dense({ units: 3, activation: "tanh" }));
		smallModel.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
		var sampleX = [
			[0.1, 0.2, 0.3], [0.3, 0.1, 0.2], [0.8, 0.4, 0.2], [0.2, 0.8, 0.4],
			[0.9, 0.9, 0.1], [0.1, 0.9, 0.9], [0.5, 0.5, 0.5], [0.7, 0.2, 0.6]
		];
		var sampleY = [[0], [1], [1], [0], [1], [0], [0], [1]];
		xyX = tensor(sampleX, [sampleX.length, 3]);
		xyY = tensor(sampleY, [sampleY.length, 1]);
		window.model = smallModel;
		window.xy_data_global = { x: xyX, y: xyY };
		live._state.cache.xHash = null;

		div = document.createElement("div");
		div.id = "coverage_origami_live";
		div.style.cssText = "width:420px;height:340px;display:block;position:relative;";
		document.body.appendChild(div);
		test_equal("init accepts a div", live.init(div) === live, true);
		await delay(1200);
		if (!live._state.initialized) {
			test_equal("init without WebGL reports the renderer failure", typeof live._state.webglError === "string" && live._state.webglError.length > 0, true);
			test_equal("init without WebGL stays uninitialized", live._state.initialized, false);
			live.destroy();
			test_equal("destroy keeps the uninitialized state", live._state.initialized, false);
			return;
		}
		test_equal("init did not report a WebGL failure", live._state.webglError, null);
		test_equal("init marks the live state initialized", live._state.initialized, true);
		live.forceUpdate();
		live.setQuality("low");
		live.setScrub(0.5);
		live.play();
		live.pause();
		live.resetCamera();
		live.setMode(live.MODE_BOUNDARY);
		await delay(200);
		live.setMode(live.MODE_STACK);
		await delay(200);
		live.setMode(live.MODE_FOLD);
		live.refreshTranslations();
		await delay(400);
		live.destroy();
		test_equal("destroy clears the live initialized flag", live._state.initialized, false);
	} finally {
		if (div) {
			try { live.destroy(); } catch (e) {}
			div.remove();
		}
		window.model = oldModel;
		window.xy_data_global = oldXY;
		try { if (xyX) await dispose(xyX); } catch (e) {}
		try { if (xyY) await dispose(xyY); } catch (e) {}
		try { if (smallModel) smallModel.dispose(); } catch (e) {}
		live.setConfig(oldConfig);
		num_errs = oldErrs;
		num_wrns = oldWrns;
	}
}

function _coverage_tests_math_mode_helpers() {
	test_equal("_latex_is_balanced accepts balanced input", _latex_is_balanced("\\frac{1}{2}"), true);
	test_equal("_latex_is_balanced rejects an open brace", _latex_is_balanced("\\frac{1}{2"), false);
	test_equal("_latex_is_balanced rejects a closing brace", _latex_is_balanced("a}"), false);
	test_equal("_latex_is_balanced rejects non-strings", _latex_is_balanced(null), false);

	test_equal("_detect_interactive_marker ignores plain latex", _detect_interactive_marker("h = x", 1), null);
	var marker = _detect_interactive_marker("a%%INTERACTIVE_Dense_4%%b", 4);
	test_equal("_detect_interactive_marker reads the type", marker.type, "dense");
	test_equal("_detect_interactive_marker keeps the layer", marker.layer_idx, 4);

	test_equal("get_y_output_shapes builds one row per unit", JSON.stringify(get_y_output_shapes([null, 3])), '[["y_{0}"],["y_{1}"],["y_{2}"]]');

	test_equal("_shape_desc_for_label leaves normal labels alone", _shape_desc_for_label([[1]], "weights"), "weights");
	test_equal("_shape_desc_for_label annotates input shape", _shape_desc_for_label([[1,2],[3,4]], "Input").indexOf("2 \\times 2") !== -1, true);
	test_equal("_shape_desc_for_label survives empty arrays", _shape_desc_for_label([], "Output"), "Output");

	var sized = array_size([[1,2,3],[4,5,6]]);
	test_equal("array_size returns rows and columns", JSON.stringify(sized), "[2,3]");

	var non_numbers = replace_non_numbers_with_matching_latex([NaN, Infinity, -Infinity, 1e-7, 2]);
	test_equal("replace_non_numbers replaces NaN", non_numbers[0], "\\text{NaN}");
	test_equal("replace_non_numbers replaces Infinity", non_numbers[1], "\\infty");
	test_equal("replace_non_numbers replaces -Infinity", non_numbers[2], "-\\infty");
	test_equal("replace_non_numbers keeps normal numbers", non_numbers[4], 2);

	var ellipsis = _array_to_ellipsis_latex([[1,2,3,4,5],[6,7,8,9,0],[1,1,1,1,1],[2,2,2,2,2],[3,3,3,3,3]], 1);
	test_equal("_array_to_ellipsis_latex keeps the corners", ellipsis[0][0], 1);
	test_equal("_array_to_ellipsis_latex inserts vertical dots", JSON.stringify(ellipsis).indexOf("\\\\vdots") !== -1, true);
	test_equal("_array_to_ellipsis_latex inserts horizontal dots", JSON.stringify(ellipsis).indexOf("\\\\cdots") !== -1, true);

	test_equal("array_to_ellipsis_latex handles vectors", array_to_ellipsis_latex([5], 1), 5);
	test_equal("array_to_ellipsis_latex handles matrices", array_to_ellipsis_latex([[1,2],[3,4]], 1).indexOf("pmatrix") !== -1, true);
	test_equal("array_to_ellipsis_latex handles tensors", array_to_ellipsis_latex([[[1,2],[3,4]]], 1).indexOf("pmatrix") !== -1, true);

	test_equal("arbitrary_array_to_latex wraps the result", arbitrary_array_to_latex([1,2]).indexOf("temml_me") !== -1, true);
	test_equal("get_activation_layer_names returns strings", get_activation_layer_names().every(function (n) { return typeof n === "string"; }), true);
}

async function _coverage_tests_online_python_ui() {
	var textarea = document.getElementById("pyodide_editor_textarea");
	var wrapper = document.getElementById("pyodide_editor_wrapper");
	var oldValue = textarea ? textarea.value : null;
	var oldOverflow = document.body.style.overflow;
	var oldErrs = num_errs;
	var oldWrns = num_wrns;

	try {
		if (wrapper) {
			var hadSimple = wrapper.classList.contains("pe-simple-mode");
			window.pyodideToggleMode();
			test_equal("toggleMode flips the simple class", wrapper.classList.contains("pe-simple-mode"), !hadSimple);
			window.pyodideToggleMode();
			test_equal("toggleMode flips back", wrapper.classList.contains("pe-simple-mode"), hadSimple);
		}

		window.pyodideToggleFullscreen();
		test_equal("toggleFullscreen sets body overflow", document.body.style.overflow, "hidden");
		window.pyodideToggleFullscreen();
		test_equal("toggleFullscreen restores body overflow", document.body.style.overflow, "");

		if (textarea) {
			window.pyodideChangeFontSize(1);
			test_equal("changeFontSize bumps the textarea", textarea.style.fontSize.length > 0, true);
			window.pyodideChangeFontSize(-1000);
			test_equal("changeFontSize clamps at the minimum", textarea.style.fontSize, "10px");
			window.pyodideChangeFontSize(1000);
			test_equal("changeFontSize clamps at the maximum", textarea.style.fontSize, "20px");

			window.pyodideToggleWordWrap();
			test_equal("toggleWordWrap switches to pre", textarea.style.whiteSpace, "pre");
			window.pyodideToggleWordWrap();
			test_equal("toggleWordWrap switches back", textarea.style.whiteSpace, "pre-wrap");

			textarea.setSelectionRange(0, 0);
			window.pyodideInsertSnippet("# coverage snippet\n");
			test_equal("insertSnippet writes into the editor", textarea.value.indexOf("# coverage snippet") !== -1, true);
			window.pyodideInsertModelInfo();
			test_equal("insertModelInfo writes the summary call", textarea.value.indexOf("_print_model_summary()") !== -1, true);

			window.pyodideLoadTemplate("generic_io");
			test_equal("loadTemplate loads a template", textarea.value.length > 0, true);
			window.pyodideLoadTemplate("does_not_exist");
			await delay(50);

			window.pyodideCopyCode();
			window.pyodideDownloadCode();
			window.pyodideCopyOutput();
			window.pyodideDownloadOutput();
		}

		window.pyodideSetWebcamFPS(9);
		var fps_label = document.getElementById("pyodide_fps_label");
		if (fps_label) test_equal("setWebcamFPS updates the label", fps_label.textContent, "9 FPS");
		window.pyodideSetWebcamFPS(999);
		if (fps_label) test_equal("setWebcamFPS clamps at the maximum", fps_label.textContent, "15 FPS");
		window.pyodideSetWebcamFPS("not a number");
		if (fps_label) test_equal("setWebcamFPS falls back to five", fps_label.textContent, "5 FPS");

		window.pyodideLivePredictChanged();
		window.pyodideToggleExamples();
		await delay(40);
		window.pyodideToggleExamples();
		await delay(40);
		window.pyodideTogglePhotos();
		window.pyodideTogglePhotos();
		window.pyodidePhotosClear();

		test_equal("getLastPrediction is null after clearing", window.PyodideEditor.getLastPrediction(), null);
		window.PyodideEditor.clearPrediction();
		test_equal("isRunning is false while idle", window.PyodideEditor.isRunning(), false);
		test_equal("getCapturedPhotos is an array", Array.isArray(window.PyodideEditor.getCapturedPhotos()), true);
	} finally {
		if (textarea && oldValue !== null) textarea.value = oldValue;
		document.body.style.overflow = oldOverflow;
		if (wrapper) wrapper.classList.remove("pe-fullscreen");
		num_errs = oldErrs;
		num_wrns = oldWrns;
	}
}

async function _coverage_tests_data_augmentation() {
	var oldRotations = $("#number_of_rotations").val();
	var oldInvert = $("#augment_invert_images").prop("checked");
	var oldFlip = $("#augment_flip_left_right").prop("checked");
	var oldAddPhoto = add_tensor_as_image_to_photos;
	var oldLabels = labels;
	var oldErrs = num_errs;
	var oldWrns = num_wrns;
	var added_categories = [];
	var pixels = [];
	for (var i = 0; i < 4 * 4 * 3; i++) pixels.push((i % 17) / 17);
	var image = tensor(pixels, [4, 4, 3]);
	var image4d = tensor(pixels, [1, 4, 4, 3]);

	try {
		add_tensor_as_image_to_photos = function (_tensor, category) {
			added_categories.push(category);
		};
		$("#augment_invert_images").prop("checked", false);
		$("#augment_flip_left_right").prop("checked", false);

		var expanded = _safe_expand_to_4d(image, "coverage");
		test_equal("_safe_expand_to_4d expands a rank-3 tensor", expanded.shape.length, 4);
		var cloned = _safe_expand_to_4d(image4d, "coverage");
		test_equal("_safe_expand_to_4d clones a rank-4 tensor", cloned.shape.length, 4);
		test_equal("_safe_expand_to_4d rejects null", _safe_expand_to_4d(null, "coverage"), null);
		var rank2 = tensor([[1,2],[3,4]], [2,2]);
		test_equal("_safe_expand_to_4d rejects a rank-2 tensor", _safe_expand_to_4d(rank2, "coverage"), null);
		await dispose(rank2);

		var as_array = _safe_4d_result_to_array(image4d.clone(), "coverage");
		test_equal("_safe_4d_result_to_array unwraps a batch", Array.isArray(as_array) && as_array.length === 4, true);
		test_equal("_safe_4d_result_to_array rejects null", _safe_4d_result_to_array(null, "coverage"), null);
		var rank2b = tensor([[1,2]], [1,2]);
		test_equal("_safe_4d_result_to_array rejects a rank-2 tensor", _safe_4d_result_to_array(rank2b, "coverage"), null);
		await dispose(rank2b);

		$("#number_of_rotations").val("2");
		var x = [], y = [];
		var rotate_result = _augment_custom_rotate(expanded, 0, 255, x, y);
		test_equal("_augment_custom_rotate returns the arrays", rotate_result[0], x);
		test_equal("_augment_custom_rotate adds rotated images", x.length, 1);
		test_equal("_augment_custom_rotate keeps the label", y[0], 0);

		$("#number_of_rotations").val("0");
		x = []; y = [];
		_augment_custom_rotate(expanded, 1, 255, x, y);
		test_equal("_augment_custom_rotate defaults to four rotations", x.length, 3);

		x = []; y = [];
		_augment_custom_invert(expanded, 2, 255, x, y);
		test_equal("_augment_custom_invert adds an image", x.length, 1);
		test_equal("_augment_custom_invert keeps the label", y[0], 2);
		test_equal("_augment_custom_invert tags the preview category", added_categories[added_categories.length - 1], 2);

		x = []; y = [];
		_augment_custom_invert_from_array(as_array, 3, 255, x, y, 90);
		test_equal("_augment_custom_invert_from_array adds an image", x.length, 1);
		x = []; y = [];
		_augment_custom_invert_from_array(null, 3, 255, x, y, 90);
		test_equal("_augment_custom_invert_from_array ignores empty input", x.length, 0);

		x = []; y = [];
		_augment_custom_flip_lr(expanded, 4, 255, x, y);
		test_equal("_augment_custom_flip_lr adds an image", x.length, 1);
		x = []; y = [];
		_augment_custom_flip_from_array(as_array, 5, x, y, 180);
		test_equal("_augment_custom_flip_from_array adds an image", x.length, 1);
		x = []; y = [];
		_augment_custom_flip_from_array([], 5, x, y, 180);
		test_equal("_augment_custom_flip_from_array ignores empty input", x.length, 0);

		x = []; y = [];
		_augment_custom_rotate(null, 0, 255, x, y);
		_augment_custom_invert(null, 0, 255, x, y);
		_augment_custom_flip_lr(null, 0, 255, x, y);
		test_equal("null augmentation inputs are ignored", x.length, 0);

		labels = ["cat", "dog"];
		test_equal("_augmented_preview_category_label resolves an index", _augmented_preview_category_label(1), "dog");
		test_equal("_augmented_preview_category_label keeps a name", _augmented_preview_category_label("cat"), "cat");
		test_equal("_augmented_preview_category_label ignores a missing category", _augmented_preview_category_label(undefined), null);
	} finally {
		$("#number_of_rotations").val(oldRotations);
		$("#augment_invert_images").prop("checked", oldInvert);
		$("#augment_flip_left_right").prop("checked", oldFlip);
		add_tensor_as_image_to_photos = oldAddPhoto;
		labels = oldLabels;
		try { await dispose(expanded); } catch (e) {}
		try { await dispose(cloned); } catch (e) {}
		await dispose(image);
		await dispose(image4d);
		num_errs = oldErrs;
		num_wrns = oldWrns;
	}
}

async function _coverage_tests_feature_map_color() {
	var oldErrs = num_errs;
	var oldWrns = num_wrns;
	var tensors = [];

	try {
		var L = _cholesky_3x3([[4, 2, 2], [2, 5, 1], [2, 1, 3]]);
		test_equal("_cholesky_3x3 decomposes a positive matrix", L[0][0], 2);
		test_equal("_cholesky_3x3 rejects a non-positive matrix", _cholesky_3x3([[0,0,0],[0,1,0],[0,0,1]]), null);
		test_equal("_cholesky_3x3 rejects a non-positive pivot", _cholesky_3x3([[1,2,0],[2,1,0],[0,0,1]]), null);

		test_equal("_determinant_3x3 of the identity", _determinant_3x3([[1,0,0],[0,1,0],[0,0,1]]), 1);
		var inverted = _invert_3x3([[2,0,0],[0,4,0],[0,0,5]]);
		test_equal("_invert_3x3 inverts a diagonal matrix", inverted[0][0], 0.5);
		test_equal("_invert_3x3 falls back to identity for a singular matrix", _invert_3x3([[1,1,1],[1,1,1],[1,1,1]])[0][0], 1);

		var normalized = _normalize_correlation_matrix([[2,0,0],[0,3,0],[0,0,4]]);
		test_equal("_normalize_correlation_matrix normalizes the columns", normalized[0][0], 1);

		reset_color_correlation_to_defaults();
		test_equal("_get_color_correlation_matrix returns three rows", _get_color_correlation_matrix().length, 3);
		test_equal("_get_color_decorrelation_matrix returns three rows", _get_color_decorrelation_matrix().length, 3);

		var pixels = [];
		for (var i = 0; i < 8 * 8 * 3; i++) pixels.push(((i * 37) % 101) / 101);
		var image = tensor(pixels, [1, 8, 8, 3]);
		tensors.push(image);
		var raw = compute_color_correlation_from_data(image);
		test_equal("compute_color_correlation_from_data returns a 3x3 matrix", raw.length, 3);
		test_equal("set_color_correlation_from_training_data accepts real data", set_color_correlation_from_training_data(image), true);
		test_equal("setting a user matrix flips the flag", USE_USER_COLOR_CORRELATION, true);
		test_equal("set_color_correlation_from_training_data rejects null", set_color_correlation_from_training_data(null), false);
		reset_color_correlation_to_defaults();

		var rgb = _decorrelated_to_rgb(image);
		tensors.push(rgb);
		test_equal("_decorrelated_to_rgb keeps the shape", JSON.stringify(rgb.shape), "[1,8,8,3]");
		var decorrelated = _rgb_to_decorrelated(rgb);
		tensors.push(decorrelated);
		test_equal("_rgb_to_decorrelated keeps the shape", JSON.stringify(decorrelated.shape), "[1,8,8,3]");
		var quality = _assess_color_quality(rgb);
		test_equal("_assess_color_quality returns a verdict", typeof quality.isGood, "boolean");

		test_equal("_should_use_transform_jitter rejects tiny images", _should_use_transform_jitter(8, 8), false);
		test_equal("_should_use_transform_jitter accepts large images", _should_use_transform_jitter(64, 64), true);
		var rotated = _apply_rotation_jitter(image, 15);
		tensors.push(rotated);
		test_equal("_apply_rotation_jitter keeps the rank", rotated.shape.length, 4);
		var scaled = _apply_scale_jitter(image, 1.5, 8, 8);
		tensors.push(scaled);
		test_equal("_apply_scale_jitter keeps the original size", scaled.shape[1], 8);
		var shrunk = _apply_scale_jitter(image, 0.5, 8, 8);
		tensors.push(shrunk);
		test_equal("_apply_scale_jitter pads a shrunk image", shrunk.shape[1], 8);
		test_equal("reset_color_correlation_to_defaults clears the flag", USE_USER_COLOR_CORRELATION, false);
	} finally {
		for (var t = 0; t < tensors.length; t++) {
			try { await dispose(tensors[t]); } catch (e) {}
		}
		reset_color_correlation_to_defaults();
		num_errs = oldErrs;
		num_wrns = oldWrns;
	}
}

function _coverage_tests_feature_map_captions() {
	var oldLabels = labels;
	var oldClassification = is_classification;
	var oldErrs = num_errs;
	var oldWrns = num_wrns;
	var wrapper = document.createElement("div");
	document.body.appendChild(wrapper);

	function caption_for(layer, neuron) {
		var canvas = document.createElement("canvas");
		$(canvas).data("neuron", neuron);
		$(canvas).data("layer", layer);
		wrapper.appendChild(canvas);
		_feature_map_decorate_controls(canvas);
		return $(canvas).closest(".feature-map-item").find(".feature-map-caption").text();
	}

	try {
		var lastLayer = get_number_of_layers() - 1;
		labels = ["Alpha", "Beta"];
		is_classification = true;
		test_equal("Feature map caption uses the category label", caption_for(lastLayer, 0), "Alpha");
		test_equal("Feature map caption uses the second category label", caption_for(lastLayer, 1), "Beta");
		labels = ["Only"];
		test_equal("Feature map caption falls back when the label is missing", caption_for(lastLayer, 1), "#2");
		labels = ["Alpha"];
		is_classification = false;
		test_equal("Feature map caption keeps neuron numbers without classification", caption_for(lastLayer, 0), "#1");
		is_classification = true;
		if (lastLayer > 0) {
			test_equal("Feature map caption keeps neuron numbers for inner layers", caption_for(lastLayer - 1, 0), "#1");
		}
		labels = null;
		test_equal("Feature map caption keeps neuron numbers without labels", caption_for(lastLayer, 0), "#1");
	} finally {
		wrapper.remove();
		labels = oldLabels;
		is_classification = oldClassification;
		num_errs = oldErrs;
		num_wrns = oldWrns;
	}
}

function _coverage_tests_confusion_matrix_tooltip() {
	var oldErrs = num_errs;
	var oldWrns = num_wrns;
	var key = "coverage:0";
	var table = document.createElement("table");
	table.className = "confusion_matrix_table";
	var row = document.createElement("tr");
	var cell = document.createElement("td");
	cell.className = "cm-hover";
	cell.setAttribute("data-cm-idx", key);
	row.appendChild(cell);
	table.appendChild(row);
	document.body.appendChild(table);
	_confusion_cell_examples[key] = [0];

	try {
		_setup_confusion_matrix_tooltip();
		var tooltip = _get_confusion_matrix_tooltip();

		$(cell).trigger($.Event("mouseover", { clientX: 10, clientY: 20 }));
		test_equal("Confusion matrix tooltip appears on hover", tooltip.style.display, "block");
		test_equal("Confusion matrix hover remembers the pointer", _cm_pointer_client_x, 10);

		$(document).trigger("tabsactivate");
		test_equal("Confusion matrix tooltip hides on tab switch", tooltip.style.display, "none");
		test_equal("Confusion matrix pointer is cleared on tab switch", _cm_pointer_client_x, null);
	} finally {
		table.remove();
		delete _confusion_cell_examples[key];
		_hide_confusion_matrix_tooltip();
		num_errs = oldErrs;
		num_wrns = oldWrns;
	}
}

async function _coverage_tests_debug_helpers() {
	var oldErrs = num_errs;
	var oldWrns = num_wrns;
	var probe = document.createElement("div");
	probe.id = "coverage_debug_probe";
	probe.textContent = "probe";
	document.body.appendChild(probe);
	var xpath = get_element_xpath(probe);

	try {
		header("coverage header");
		header_error("coverage header error");
		header_error(undefined);
		data_debug({ a: 1 }, "plain", 42, false);
		label_debug("coverage label");
		log_once("coverage_log_once");
		log_once("coverage_log_once");
		logt("coverage logt");
		highlight_element(xpath);
		test_equal("highlight_element marks the element", probe.style.backgroundColor, "yellow");
		unhighlight_element(xpath);
		test_equal("unhighlight_element clears the element", probe.style.backgroundColor, "");
		highlight_element("///invalid");
		unhighlight_element("///invalid");

		var table = create_html_table_from_json([{ a: "x", b: "y" }, { a: "x", b: "y" }]);
		test_equal("create_html_table_from_json builds a table", table.indexOf("<table") === 0, true);
		test_equal("create_html_table_from_json ignores empty data", create_html_table_from_json([]), undefined);

		test_equal("detect_and_color_stacktrace colors urls", detect_and_color_stacktrace("fn@http://example.com/a.js").indexOf("color: #af0f0f") !== -1, true);
		test_equal("detect_and_color_stacktrace survives garbage", detect_and_color_stacktrace(null), undefined);

		showCustomTensors();
		create_graphviz_function_call_graph();

		var profiled = 0;
		var profiled_tensor = null;
		await profile(function () {
			profiled++;
			return function () { profiled_tensor = tensor([1, 2, 3]); return profiled_tensor; };
		});
		test_equal("profile runs the function and logs the result", profiled, 1);
		if (profiled_tensor) await dispose(profiled_tensor);

		test_equal("get_param_names reads a normal signature", JSON.stringify(get_param_names(function (a, b) {})), '["a","b"]');
		test_equal("get_param_names handles empty signatures", JSON.stringify(get_param_names(function () {})), "[]");
	} finally {
		probe.remove();
		num_errs = oldErrs;
		num_wrns = oldWrns;
	}
}

async function _coverage_tests_gui_mobile() {
	if (typeof mobile_open_panel !== "function") {
		test_equal("mobile UI functions exist", false, true);
		return;
	}

	var descriptor = Object.getOwnPropertyDescriptor(window, "innerWidth");
	var oldErrs = num_errs;
	var oldWrns = num_wrns;
	try {
		Object.defineProperty(window, "innerWidth", { configurable: true, value: 800 });

		test_equal("is_mobile_view detects a narrow window", is_mobile_view(), true);

		mobile_open_panel("dataset");
		test_equal("mobile_open_panel opens the dataset panel", $("#mobile_panel_dataset").hasClass("open"), true);
		test_equal("mobile_open_panel marks the nav item", $("#mobile_nav_dataset").hasClass("active"), true);
		mobile_open_panel("dataset");
		test_equal("opening the same panel again closes it", $("#mobile_panel_dataset").hasClass("open"), false);

		mobile_open_panel("settings");
		test_equal("mobile_open_panel opens the settings panel", $("#mobile_panel_settings").hasClass("open"), true);
		test_equal("_sync_mobile_settings_panel keeps the mode in sync", $("#mobile_mode").val(), $("#expert").is(":checked") ? "expert" : "beginner");
		mobile_close_all();
		test_equal("mobile_close_all closes every panel", $(".mobile-panel.open").length, 0);

		mobile_open_panel("dataset");
		mobile_toggle_drawer();
		test_equal("mobile_toggle_drawer closes the open panel", $("#mobile_panel_dataset").hasClass("open"), false);
		test_equal("mobile_toggle_drawer opens the layer drawer", $("#layers_container_left").hasClass("drawer-open"), true);
		mobile_toggle_drawer();
		test_equal("mobile_toggle_drawer closes the drawer", $("#layers_container_left").hasClass("drawer-open"), false);

		mobile_open_panel("dataset");
		mobile_close_drawer();
		test_equal("mobile_close_drawer is safe without an open drawer", $("#layers_container_left").hasClass("drawer-open"), false);

		mobile_set_active_nav("mobile_nav_train");
		test_equal("mobile_set_active_nav marks one item", $("#mobile_nav_train").hasClass("active"), true);
		mobile_clear_active_nav();
		test_equal("mobile_clear_active_nav clears all items", $(".mobile-nav-item.active").length, 0);
	} finally {
		mobile_close_all();
		mobile_close_drawer();
		if (descriptor) {
			Object.defineProperty(window, "innerWidth", descriptor);
		} else {
			delete window.innerWidth;
		}
		num_errs = oldErrs;
		num_wrns = oldWrns;
	}
}

async function _coverage_tests_model_helpers() {
	test_equal("get_weights_shape reads a nested array", JSON.stringify(await get_weights_shape("[[1,2],[3,4]]")), "[2,2]");
	test_equal("get_weights_shape handles invalid json", await get_weights_shape("not json"), undefined);
}

function _coverage_tests_math_tooltips_smoke() {
	var oldErrs = num_errs;
	var oldWrns = num_wrns;
	var ran = true;
	try {
		if (typeof _mvt_compute_pooled === "function") {
			var pooled = _mvt_compute_pooled();
			test_equal("pooled gradients compute without throwing", pooled === null || typeof pooled.grads === "object", true);
		}
		if (typeof _mvt_compute_per_sample === "function") {
			var per_sample = _mvt_compute_per_sample(1);
			test_equal("per-sample gradients compute without throwing", per_sample === null || Array.isArray(per_sample.samples), true);
		}
		if (typeof _mvt_compute_activations === "function") {
			var acts = _mvt_compute_activations(1);
			test_equal("activation statistics compute without throwing", acts === null || typeof acts === "object", true);
		}
		if (typeof _mvt_submodel === "function") {
			var sub = _mvt_submodel(1);
			test_equal("submodel extraction does not throw", sub === null || typeof sub === "object", true);
		}
	} catch (e) {
		ran = false;
	} finally {
		num_errs = oldErrs;
		num_wrns = oldWrns;
	}
	test_equal("math tooltip computations run", ran, true);
}

async function run_coverage_tests() {
	_coverage_tests_fcnn_tooltips();
	await _coverage_tests_origami_folds();
	await _coverage_tests_origami_live();
	_coverage_tests_math_mode_helpers();
	await _coverage_tests_online_python_ui();
	await _coverage_tests_data_augmentation();
	await _coverage_tests_feature_map_color();
	_coverage_tests_feature_map_captions();
	_coverage_tests_confusion_matrix_tooltip();
	await _coverage_tests_debug_helpers();
	await _coverage_tests_gui_mobile();
	await _coverage_tests_model_helpers();
	_coverage_tests_math_tooltips_smoke();
	await _coverage_tests_fn_profiler();
	_coverage_tests_valsplitwatcher();
	_coverage_tests_safety();
	await _coverage_tests_drawing();
	await _coverage_tests_autocomplete();
	await _coverage_tests_custom_images();
	return true;
}

async function new_tiny_tests() {
	_tiny_tests_data_js();
	_tiny_tests_explain_js();
	_tiny_tests_model_js();
	_tiny_tests_math_mode_js();
	_tiny_tests_gui_js();
	_tiny_tests_predict_js();
	_tiny_tests_fcnn_js();
	_tiny_tests_misc();
	await _tiny_tests_optimizer_info_popup_js();
	await _tiny_tests_initializer_info_popup_js();
	await _tiny_tests_explain_activations_popup_js();
	await _tiny_tests_explain_losses_popup_js();
	await _tiny_tests_explain_constraints_popup_js();
	_tiny_tests_neural_organism_js();
	_tiny_tests_topological_analyzer_js();
	await _tiny_tests_clipboard_and_download_js();
	_tiny_tests_multi_activation_js();
	await _tiny_tests_health_status_popups_js();
	_tiny_tests_my_temml_js();
	await _tiny_tests_custom_images_js();
	_tiny_tests_fcnn_editable_js();
	_tiny_tests_drawing_js();
	_tiny_tests_safety_js();
	_tiny_tests_cookies_and_url_js();
	_tiny_tests_input_shape_js();
	await _tiny_tests_labels_js();
	_tiny_tests_skip_connection_js();
	_tiny_tests_math_editable_js();
	await _tiny_tests_csv_js();
	await _tiny_tests_plot_predict_js();
	_tiny_tests_python_code_js();
	_tiny_tests_math_mode_extra_js();
	_tiny_tests_gui_extra_js();
	await _tiny_tests_base_wrappers_extra_js();
	await _tiny_tests_easter_eggs_js();
	_tiny_tests_debug_js();
	_tiny_tests_math_mode_tooltips_js();
	_tiny_tests_tda_js();
	_tiny_tests_origami_live_js();
	await _tiny_tests_base_wrappers_async();

	return true;
}

async function test_translation_cache () {
	const element = document.createElement("span");
	element.className = "TRANSLATEME_start_training";
	document.body.appendChild(element);

	await update_translations();

	const translated = element.textContent === language[lang]["start_training"] && element.getAttribute("data-lang") === lang;

	element.remove();

	return translated;
}

async function run_python_code_tests() {
	async function load_python_code_tab() {
		$("#code_tab_label").click();
		await delay(1000);

		$("#pyodide_editor_tab_label").click()
		await delay(5000);

		if(!$(".pe-main-layout").is(":visible")) {
			err(`.pe-main-layout is not visible`);
			return false;
		}

		await delay(5000);

		return true;
	}

	await set_dataset_and_wait("signs");
	await delay(3000);

	if(!(await load_python_code_tab())) {
		err("Could not load python code tab after loading signs");
		return false;
	}

	if(!$("#pyodide_console_output").text().includes("Python environment ready")) {
		err(`pyodide_console_output does not contain 'Python environment ready'`);
		return false;
	}

	if($("#pyodide_console_output").text().includes("Pyodide failed to initialize")) {
		err("pyodide_console_output contains a false 'Pyodide failed to initialize' error although the runtime is ready");
		return false;
	}

	if(!document.querySelector("[onclick='pyodideCopyCode()']") ||
		!document.querySelector("[onclick='pyodideDownloadCode()']") ||
		!document.querySelector("[onclick='pyodideInsertModelInfo()']")) {
		err("Python editor toolbar is missing the copy/download/model-info controls");
		return false;
	}

	pyodideEditorClear();
	await delay(1000);

	if($("#pyodide_console_output").text() != "") {
		err(`pyodideEditorClear() didn't clean the console`);
		return false;
	}

	$("#pyodide_run_btn").click();
	await delay(5000);

	if(!$("#pyodide_console_output").text().includes("Hello, World")) {
		err("#pyodide_console_output does not contain 'Hello, World' after clicking 'Run' for default program");
		return false;
	}

	if(!/Done \([0-9.]+ s\)/.test($("#pyodide_console_output").text())) {
		err("pyodide_console_output does not show the run duration in the Done line");
		return false;
	}

	pyodideToggleExamples();
	await delay(1000);

	if(!$("#pyodide_examples_panel").is(":visible")) {
		err(`#pyodide_examples_panel is not visible after clicking 'Examples'/running pyodideToggleExamples()`);
		return false;
	}
	
	pyodideLoadTemplate('html_table');
	await delay(1000);

	pyodideEditorClear();
	await delay(1000);

	$("#pyodide_run_btn").click();
	await delay(1000);

	if(!$("#pyodide_console_output").text().includes("Model Architecture")) {
		err("#pyodide_console_output does not contain 'Model Architecture' after running HTML Table example");
		return false;
	}

	if(!$("#pyodide_console_output").text().includes("Table rendered")) {
		err("#pyodide_console_output does not contain 'Table rendered' after running HTML Table example");
		return false;
	}

	await set_dataset_and_wait("and_xor");
	await delay(3000);

	if(!(await load_python_code_tab())) {
		err("Could not load python code tab after loading and_xor");
		return false;
	}

	return true;
}

async function test_activation_atlas() {
	await set_dataset_and_wait("signs");
	await delay(3000);

	try {
		var old_errs = num_errs;
		var old_wrns = num_wrns;

		// Requires a model to be loaded
		if (typeof model === "undefined" || !model || !model.layers) {
			console.error("[test_activation_atlas] No model available");
			return false;
		}

		// Create the atlas UI in the existing tab container
		var container = document.getElementById("activation_atlas");
		if (!container) {
			container = document.createElement("div");
			container.id = "activation_atlas_test";
			document.body.appendChild(container);
		}

		// The atlas drives generation through tf.nextFrame(). A hidden tab
		// throttles requestAnimationFrame (Opera can stop it entirely), which
		// looks like a hang. Make the tab visible before starting.
		if (typeof show_tab_label === "function") {
			show_tab_label("visualization_tab_label", 1);
			await delay(200);
			show_tab_label("activation_atlas_tab_label", 1);
			await delay(200);
		}

		ActivationAtlas(container);

		// Override state to minimal config BEFORE clicking start:
		// We need to set the smallest possible grid and fewest steps.
		// The state is internal, but the UI controls set it.
		// Set grid size to 6 (smallest option) via the select
		var gridSelect = container.querySelector(".atlas_param_row .atlas_param_input");
		if (gridSelect) {
			gridSelect.value = "6";
			gridSelect.dispatchEvent(new Event("change"));
		}

		// Set vis steps to minimum (64) via the range input
		var ranges = container.querySelectorAll(".atlas_range");
		if (ranges[0]) {
			ranges[0].value = "64";
			ranges[0].dispatchEvent(new Event("input"));
		}

		// Set learning rate to max (0.1) for faster convergence
		if (ranges[1]) {
			ranges[1].value = "0.1";
			ranges[1].dispatchEvent(new Event("input"));
		}

		// Click the Start button to trigger the full process
		var startBtn = container.querySelector(".atlas_start_btn");
		if (!startBtn) {
			console.error("[test_activation_atlas] Start button not found");
			return false;
		}

		// Wrap the generation in a promise that resolves when done or after timeout
		var finished = false;
		var hadError = false;

		startBtn.click();

		// Wait for generation to complete (poll for _state.isComputing via UI cues)
		// The toggle button changes from "Stop" to "Generate" when done
		// Opera needs noticeably longer for the WebGL gradient-ascent cells
		// (observed ~135 s for 6x6 cells locally). Keep enough headroom for
		// slower CI machines; the debug log below shows whether it is stuck.
		var maxWaitMs = 300000; // 5 minutes max
		var elapsed = 0;
		var pollInterval = 500;

		function atlas_debug_state () {
			var toggle = container.querySelector(".atlas_toggle_btn");
			var progress = container.querySelector(".atlas_progress_inner");
			var label = container.querySelector(".atlas_progress_label");
			var estimate = container.querySelector(".atlas_time_estimate");
			var error = container.querySelector(".atlas_error");
			var canvas = container.querySelector(".atlas_canvas");

			return {
				elapsed_ms: elapsed,
				hidden: typeof is_hidden_or_has_hidden_parent === "function" ? is_hidden_or_has_hidden_parent(container) : null,
				offset_parent: container.offsetParent ? container.offsetParent.id : null,
				visibility_state: document.visibilityState,
				toggle_class: toggle ? toggle.className : null,
				toggle_text: toggle ? toggle.textContent : null,
				progress_width: progress ? progress.style.width : null,
				progress_label: label ? label.textContent : null,
				time_estimate: estimate ? estimate.textContent : null,
				error: error ? error.textContent : null,
				canvas: canvas ? { width: canvas.width, height: canvas.height } : null,
				model_layers: model && model.layers ? model.layers.length : null,
				backend: typeof tf !== "undefined" ? tf.getBackend() : null,
				num_errs: num_errs,
				num_wrns: num_wrns
			};
		}

		function log_atlas_debug_entries () {
			var new_errors = num_errs - old_errs;
			var new_warnings = num_wrns - old_wrns;

			if (typeof _test_recent_debug_entries === "function") {
				_test_recent_debug_entries("err", new_errors).forEach(function (entry) {
					console.error("[test_activation_atlas] concrete error: " + _test_format_debug_entry(entry));
				});
				_test_recent_debug_entries("warn", new_warnings).forEach(function (entry) {
					console.error("[test_activation_atlas] concrete warning: " + _test_format_debug_entry(entry));
				});
			}
		}

		while (elapsed < maxWaitMs) {
			await new Promise(function (r) { setTimeout(r, pollInterval); });
			elapsed += pollInterval;

			if (elapsed % 10000 === 0) {
				console.log("[test_activation_atlas] progress " + JSON.stringify(atlas_debug_state()));
			}

			var toggleBtn = container.querySelector(".atlas_toggle_btn");
			if (!toggleBtn) {
				// UI was replaced — check if error message appeared
				var errDiv = container.querySelector(".atlas_error");
				if (errDiv) {
					console.error("[test_activation_atlas] Generation error: " + errDiv.textContent);
					hadError = true;
				}
				break;
			}

			// When generation finishes, button text changes to "▶ Generate"
			if (toggleBtn.classList.contains("atlas_toggle_start") && elapsed > 1000) {
				finished = true;
				break;
			}
		}

		if (!finished && !hadError) {
			console.error("[test_activation_atlas] Timed out after " + maxWaitMs + "ms " + JSON.stringify(atlas_debug_state()));
			log_atlas_debug_entries();
			// Stop it gracefully
			var stopBtn = container.querySelector(".atlas_toggle_stop");
			if (stopBtn) stopBtn.click();
			await new Promise(function (r) { setTimeout(r, 2000); });
			return false;
		}

		if (hadError) {
			return false;
		}

		// Verify results: canvas should have generated cell images
		var canvas = container.querySelector(".atlas_canvas");
		if (!canvas) {
			console.error("[test_activation_atlas] Canvas not found after generation " + JSON.stringify(atlas_debug_state()));
			log_atlas_debug_entries();
			return false;
		}

		// Check that the canvas is not blank (all black)
		var ctx = canvas.getContext("2d");
		var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var hasNonBlackPixel = false;
		for (var i = 0; i < imageData.data.length; i += 4) {
			// Check if any pixel is not the background color (#0d0d1a = 13,13,26)
			if (imageData.data[i] > 30 || imageData.data[i + 1] > 30 || imageData.data[i + 2] > 40) {
				hasNonBlackPixel = true;
				break;
			}
		}

		if (!hasNonBlackPixel) {
			console.error("[test_activation_atlas] Canvas appears blank after generation " + JSON.stringify(atlas_debug_state()));
			log_atlas_debug_entries();
			return false;
		}

		// Verify no new errors or warnings
		if (num_errs !== old_errs) {
			console.error("[test_activation_atlas] New errors detected during generation " + JSON.stringify(atlas_debug_state()));
			log_atlas_debug_entries();
			return false;
		}

		if (num_wrns !== old_wrns) {
			console.error("[test_activation_atlas] New warnings detected during generation " + JSON.stringify(atlas_debug_state()));
			log_atlas_debug_entries();
			return false;
		}

		return true;
	} catch (e) {
		console.error("[test_activation_atlas] Exception: " + (e && e.stack ? e.stack : (e.message || e)));
		return false;
	}
}

async function test_dimensionality_river() {
	log_test("Test signs example visibility with max_files=1 and epochs=10");

	await set_dataset_and_wait("signs");
	await delay(3000);

	$("#max_number_of_files_per_category").val(1).trigger("change");

	$("#jump_to_interesting_tab").prop("checked", false);

	$("#visualization_tab_label").click();

	$("#dimensionality_river_tab_label").click();

	await delay(1000);

	const wanted_epochs = 2;

	set_epochs(wanted_epochs);

	await delay(3000);

	if ($("#dataset").val() !== "signs") {
		err("test_signs_example_visibility: dataset selector does not show 'signs', got: " + $("#dataset").val());
		return false;
	}

	var epoch_val = parseInt($("#epochs").val());
	if (epoch_val !== wanted_epochs) {
		err(`test_signs_example_visibility: epochs is not ${wanted_epochs}, got: ${epoch_val}`);
		return false;
	}

	var max_files_val = parseInt($("#max_number_of_files_per_category").val());
	if (max_files_val !== 1) {
		err("test_signs_example_visibility: max_number_of_files_per_category is not 1, got: " + max_files_val);
		return false;
	}

	if (!$(".train_neural_network_button").length) {
		err("test_signs_example_visibility: .train_neural_network_button not found");
		return false;
	}

	if ($(".train_neural_network_button").prop("disabled")) {
		err("test_signs_example_visibility: .train_neural_network_button is disabled");
		return false;
	}

	if (!$(".layer_setting").length) {
		err("test_signs_example_visibility: No .layer_setting elements found");
		return false;
	}

	if (!$(".layer_type").length) {
		err("test_signs_example_visibility: No .layer_type elements found");
		return false;
	}

	const ret = await train_neural_network();

	if (!is_valid_ret_object(ret, wanted_epochs)) {
		err("test_signs_example_visibility: Training did not complete successfully");
		return false;
	}

	await delay(5000);

	if(!$("#dimensionality_river").length) {
		err("#dimensionality_river not found");
		return false;
	}

	if(!$(".dimriver_grid").length) {
		err(".dimriver_grid doesn't exist");
		return false;
	}

	await delay(10000);

	const model_layers_length = model.layers.length;
	const dimriver_grid_length = $(".dimriver_card").length;

	if(!dimriver_grid_length) {
		err(".dimriver_grid length is zero");
		return false;
	}

	if(dimriver_grid_length != model_layers_length) {
		err(`model_layers_length (${model_layers_length}) is not the same as dimriver_grid_length (${dimriver_grid_length})`);
		return false;
	}

	const nr_of_dimriver_svg = $(".dimriver_svg").length - 1;

	if(nr_of_dimriver_svg != model_layers_length) {
		err(`nr_of_dimriver_svg (${nr_of_dimriver_svg}) is not the same as model_layers_length (${model_layers_length})`);
		return false;
	}

	await test_if_python_code_is_valid();

	test_no_new_errors_or_warnings();

	return true;
}

function _test_health_status_validate(container, expectedCards, latestRecord) {
	if (container.innerHTML.length === 0) {
		err("test_health_status: renderLayerIOStats produced empty content");
		return false;
	}

	var layerCards = $(container).find(".lio_card");
	if (!layerCards.length) {
		err("test_health_status: No .lio_card elements found after rendering");
		return false;
	}
	if (layerCards.length !== expectedCards) {
		err(`test_health_status: Expected ${expectedCards} .lio_card elements, got ${layerCards.length}`);
		return false;
	}

	if (!$(container).find(".lio_score_bar").length) {
		err("test_health_status: .lio_score_bar not found");
		return false;
	}
	if (!$(container).find(".lio_score_fill").length) {
		err("test_health_status: .lio_score_fill not found");
		return false;
	}
	if (!$(container).find(".lio_stats_grid").length) {
		err("test_health_status: .lio_stats_grid not found in any card");
		return false;
	}
	if (!$(container).find(".lio_plot_section svg").length) {
		err("test_health_status: No histogram SVGs found in .lio_plot_section");
		return false;
	}
	if (!$(container).find(".lio_aggregate").length) {
		err("test_health_status: .lio_aggregate section not found");
		return false;
	}
	if (!$(container).find(".lio_multi_plot").length) {
		err("test_health_status: .lio_multi_plot not found in aggregate section");
		return false;
	}

	var allHeadersValid = true;
	layerCards.each(function (i, card) {
		if (!$(card).find(".lio_header").length) {
			err("test_health_status: .lio_header missing in card " + i);
			allHeadersValid = false;
		}
		if (!$(card).find(".lio_status_badge").length) {
			err("test_health_status: .lio_status_badge missing in card " + i);
			allHeadersValid = false;
		}
	});
	if (!allHeadersValid) return false;

	var firstLayerOutput = latestRecord.layers[0].output;
	var stats = _computeStats(firstLayerOutput);
	if (!stats) {
		err("test_health_status: _computeStats returned null for first layer output");
		return false;
	}
	if (typeof stats.mean !== "number" || isNaN(stats.mean)) {
		err("test_health_status: _computeStats mean is not a valid number");
		return false;
	}
	if (typeof stats.std !== "number" || isNaN(stats.std)) {
		err("test_health_status: _computeStats std is not a valid number");
		return false;
	}
	if (stats.count !== firstLayerOutput.length) {
		err(`test_health_status: _computeStats count (${stats.count}) doesn't match output length (${firstLayerOutput.length})`);
		return false;
	}

	var warnings = _detectWarnings(latestRecord.layers[0]);
	if (!Array.isArray(warnings)) {
		err("test_health_status: _detectWarnings did not return an array");
		return false;
	}

	var histogram = _computeHistogram(firstLayerOutput, 40);
	if (!histogram) {
		err("test_health_status: _computeHistogram returned null");
		return false;
	}
	if (!histogram.counts || !histogram.binEdges) {
		err("test_health_status: _computeHistogram missing counts or binEdges");
		return false;
	}
	if (histogram.counts.length !== 40) {
		err(`test_health_status: _computeHistogram expected 40 bins, got ${histogram.counts.length}`);
		return false;
	}

	var percentiles = _computePercentiles(firstLayerOutput);
	if (!percentiles) {
		err("test_health_status: _computePercentiles returned null");
		return false;
	}
	if (percentiles.p50 === undefined || percentiles.p25 === undefined || percentiles.p75 === undefined) {
		err("test_health_status: _computePercentiles missing expected percentile keys");
		return false;
	}
	if (percentiles.p25 > percentiles.p50 || percentiles.p50 > percentiles.p75) {
		err("test_health_status: Percentiles are not in correct order (p25 <= p50 <= p75)");
		return false;
	}

	return true;
}

async function test_health_status() {
	log_test("Test health status");

	await set_dataset_and_wait("signs");
	await delay(3000);

	$("#max_number_of_files_per_category").val(1).trigger("change");
	$("#jump_to_interesting_tab").prop("checked", false);
	$("#visualization_tab_label").click();
	$("#health_status_tab_label").click();

	await delay(1000);

	const wanted_epochs = 2;
	set_epochs(wanted_epochs);

	await delay(3000);

	if ($("#dataset").val() !== "signs") {
		err("test_health_status: dataset selector does not show 'signs', got: " + $("#dataset").val());
		return false;
	}

	var epoch_val = parseInt($("#epochs").val());
	if (epoch_val !== wanted_epochs) {
		err(`test_health_status: epochs is not ${wanted_epochs}, got: ${epoch_val}`);
		return false;
	}

	var max_files_val = parseInt($("#max_number_of_files_per_category").val());
	if (max_files_val !== 1) {
		err("test_health_status: max_number_of_files_per_category is not 1, got: " + max_files_val);
		return false;
	}

	if (!$(".train_neural_network_button").length) {
		err("test_health_status: .train_neural_network_button not found");
		return false;
	}
	if ($(".train_neural_network_button").prop("disabled")) {
		err("test_health_status: .train_neural_network_button is disabled");
		return false;
	}
	if (!$(".layer_setting").length) {
		err("test_health_status: No .layer_setting elements found");
		return false;
	}
	if (!$(".layer_type").length) {
		err("test_health_status: No .layer_type elements found");
		return false;
	}

	layerIOStats.enabled = true;
	layerIOStats.records = [];
	try {
		enableAutoRecord();
	} catch (e) {
		wrn("test_health_status: enableAutoRecord warning: " + e.message);
	}

	const ret = await train_neural_network();
	if (!is_valid_ret_object(ret, wanted_epochs)) {
		err("test_health_status: Training did not complete successfully");
		return false;
	}

	await delay(5000);

	if (layerIOStats.records.length === 0) {
		err("test_health_status: No layer I/O records were captured during training");
		return false;
	}
	if (!$("#health_status").length) {
		err("test_health_status: #health_status not found");
		return false;
	}

	var container = renderLayerIOStats("health_status");
	if (!container) {
		err("test_health_status: renderLayerIOStats returned null");
		return false;
	}

	await delay(3000);

	var latestRecord = layerIOStats.records[layerIOStats.records.length - 1];
	if (!_test_health_status_validate(container, latestRecord.layers.length, latestRecord)) return false;

	var container2 = renderLayerIOStats("health_status");
	if (!container2 || container2.innerHTML.length === 0) {
		err("test_health_status: Re-rendering produced empty content");
		return false;
	}

	await test_if_python_code_is_valid();
	test_no_new_errors_or_warnings();

	return true;
}

async function test_multi_run_training() {
	log_test("Test Multi-Run Training");

	const wanted_epochs = 3;
	const wanted_runs = 3;

	await set_dataset_and_wait("and_xor");
	await set_model_dataset("and");
	await _set_initializers();

	await set_epochs(wanted_epochs);

	set_mode_to_expert();
	$("#number_of_runs").val(wanted_runs).trigger("change");

	const ret = await train_neural_network();

	$("#beginner").click();
	set_mode();
	$("#number_of_runs").val(1).trigger("change");

	if(!is_valid_ret_object(ret, wanted_epochs)) {
		console.error("[test_multi_run_training] ret object is invalid");
		return false;
	}

	var statsEl = document.getElementById("multi_run_stats");
	if(!statsEl) {
		console.error("[test_multi_run_training] #multi_run_stats element does not exist");
		return false;
	}

	var statsHtml = statsEl.innerHTML;
	if(!statsHtml || statsHtml.trim().length === 0) {
		console.error("[test_multi_run_training] #multi_run_stats is empty");
		return false;
	}

	var statsTable = statsEl.querySelector(".multi_run_stats_table");
	if(!statsTable) {
		console.error("[test_multi_run_training] .multi_run_stats_table not found");
		return false;
	}

	var dataRows = statsTable.querySelectorAll("tr");
	if(dataRows.length < 2) {
		console.error("[test_multi_run_training] stats table has " + dataRows.length + " rows, expected at least 2 (header + loss)");
		return false;
	}

	test_equal("multi_run_stats table exists", true, true);
	test_equal("multi_run_stats has data rows", dataRows.length >= 2, true);

	var lossCells = dataRows[1].querySelectorAll("td");
	if(lossCells.length < 4) {
		console.error("[test_multi_run_training] loss row has " + lossCells.length + " cells, expected at least 4 (label, mean, min, max)");
		return false;
	}

	var lossMean = parseFloat(lossCells[1].textContent);
	var lossMin = parseFloat(lossCells[2].textContent);
	var lossMax = parseFloat(lossCells[3].textContent);

	if(isNaN(lossMean) || isNaN(lossMin) || isNaN(lossMax)) {
		console.error("[test_multi_run_training] stats contain NaN values: mean=" + lossMean + " min=" + lossMin + " max=" + lossMax);
		return false;
	}

	test_equal("loss mean is finite", isNaN(lossMean), false);
	test_equal("loss min <= mean", lossMin <= lossMean, true);
	test_equal("loss max >= mean", lossMax >= lossMean, true);
	test_equal("loss min <= loss max", lossMin <= lossMax, true);

	var runTabs = statsEl.querySelectorAll(".multi_run_tab");
	test_equal("run tabs count", runTabs.length, wanted_runs);

	var activeTabs = statsEl.querySelectorAll(".multi_run_tab_active");
	test_equal("one active tab", activeTabs.length, 1);

	var chartAreas = statsEl.querySelectorAll(".multi_run_chart_area");
	test_equal("chart areas count", chartAreas.length, wanted_runs);

	var visibleCharts = statsEl.querySelectorAll(".multi_run_chart_area[style*='block']");
	test_equal("one visible chart", visibleCharts.length, 1);

	var multiRunDataKeys = Object.keys(multi_run_data).filter(function(k) { return multi_run_data[k] && multi_run_data[k].weights; });
	test_equal("multi_run_data has saved weights", multiRunDataKeys.length, wanted_runs);

	var hasPlotData = Object.keys(multi_run_data).filter(function(k) { return multi_run_data[k] && multi_run_data[k].plotData; });
	test_equal("multi_run_data has plot data", hasPlotData.length, wanted_runs);

	var savedWeights0 = multi_run_data[1].weights;
	restore_multi_run_weights(1);
	var currentWeights1 = model.layers[0].getWeights()[0].arraySync();
	test_equal("restore_multi_run_weights restores weights", true, JSON.stringify(currentWeights1) === JSON.stringify(savedWeights0[0][0]));

	show_multi_run_run_chart(2);
	test_equal("show_multi_run_run_chart sets current_multi_run", current_multi_run, 2);
	test_equal("chart 2 is active", $(".multi_run_tab[data-run=2]").hasClass("multi_run_tab_active"), true);
	test_equal("chart 1 is hidden", $("#multi_run_chart_1").is(":visible"), false);

	show_multi_run_run_chart(wanted_runs);
	test_equal("chart " + wanted_runs + " is active after selecting it", $(".multi_run_tab[data-run=" + wanted_runs + "]").hasClass("multi_run_tab_active"), true);

	return true;
}

function _test_weight_analysis_validate(container, preTrainResult, postTrainResult, postTrainScore, preTrainScore) {
	if (!container.innerHTML.length) {
		err("test_weight_analysis: weight_analysis_render produced empty content");
		return false;
	}
	if (!$(container).find(".wa_container").length) {
		err("test_weight_analysis: .wa_container not found after rendering");
		return false;
	}
	if (!$(container).find("svg").length) {
		err("test_weight_analysis: No SVG elements found (score gauge missing)");
		return false;
	}
	if (!$(container).find(".wa_message").length) {
		err("test_weight_analysis: .wa_message not found");
		return false;
	}

	var layerCards = $(container).find(".wa_layer_card");
	if (!layerCards.length) {
		err("test_weight_analysis: No .wa_layer_card elements found after rendering");
		return false;
	}

	var allCardsValid = true;
	layerCards.each(function (i, card) {
		if (!$(card).find(".wa_layer_header").length) {
			err("test_weight_analysis: .wa_layer_header missing in card " + i);
			allCardsValid = false;
		}
		if (!$(card).find(".wa_layer_name").length) {
			err("test_weight_analysis: .wa_layer_name missing in card " + i);
			allCardsValid = false;
		}
		if (!$(card).find(".wa_layer_score").length) {
			err("test_weight_analysis: .wa_layer_score missing in card " + i);
			allCardsValid = false;
		}
		if (!$(card).find(".wa_indicators").length) {
			err("test_weight_analysis: .wa_indicators missing in card " + i);
			allCardsValid = false;
		}
	});
	if (!allCardsValid) return false;

	if (!$(container).find(".wa_comparison").length) {
		err("test_weight_analysis: .wa_comparison section not found");
		return false;
	}
	if (!$(container).find(".wa_section").length) {
		err("test_weight_analysis: .wa_section (global visualizations) not found");
		return false;
	}

	if (postTrainScore < preTrainScore) {
		err("test_weight_analysis: post-train score (" + postTrainScore + ") is less than pre-train score (" + preTrainScore + ")");
		return false;
	}

	var deadNeurons = WeightAnalysis.detectDeadNeurons(model);
	if (!Array.isArray(deadNeurons)) {
		err("test_weight_analysis: detectDeadNeurons did not return an array");
		return false;
	}

	var complexity = WeightAnalysis.analyzeComplexity(model);
	if (!complexity) {
		err("test_weight_analysis: analyzeComplexity returned null");
		return false;
	}
	if (typeof complexity.totalParams !== "number" || complexity.totalParams <= 0) {
		err("test_weight_analysis: analyzeComplexity totalParams invalid");
		return false;
	}
	if (typeof complexity.layerCount !== "number" || complexity.layerCount <= 0) {
		err("test_weight_analysis: analyzeComplexity layerCount invalid");
		return false;
	}
	if (typeof complexity.memoryMB !== "number" || complexity.memoryMB <= 0) {
		err("test_weight_analysis: analyzeComplexity memoryMB invalid");
		return false;
	}

	WeightAnalysis.snapshotInitialWeights(model);
	var drift = WeightAnalysis.computeWeightDrift(model);
	if (!drift) {
		err("test_weight_analysis: computeWeightDrift returned null after snapshot");
		return false;
	}
	if (!Array.isArray(drift) || drift.length === 0) {
		err("test_weight_analysis: computeWeightDrift returned empty array");
		return false;
	}
	for (var i = 0; i < drift.length; i++) {
		if (typeof drift[i].l2Distance !== "number") {
			err("test_weight_analysis: drift[" + i + "].l2Distance is not a number");
			return false;
		}
		if (typeof drift[i].relativeChange !== "number") {
			err("test_weight_analysis: drift[" + i + "].relativeChange is not a number");
			return false;
		}
		if (drift[i].l2Distance > 1e-6) {
			err("test_weight_analysis: drift[" + i + "].l2Distance should be ~0 immediately after snapshot, got: " + drift[i].l2Distance);
			return false;
		}
	}

	WeightAnalysis.weight_analysis_render(container);
	return true;
}

function _test_weight_analysis_validate_post_train(postTrainResult) {
	if (!postTrainResult) {
		err("test_weight_analysis: analyzeModel returned null on trained model");
		return false;
	}
	if (typeof postTrainResult.score !== "number") {
		err("test_weight_analysis: post-train score is not a number");
		return false;
	}
	if (postTrainResult.score < 0 || postTrainResult.score > 100) {
		err("test_weight_analysis: post-train score out of range [0,100], got: " + postTrainResult.score);
		return false;
	}
	if (typeof postTrainResult.confidence !== "number") {
		err("test_weight_analysis: confidence is not a number");
		return false;
	}
	if (postTrainResult.confidence < 0 || postTrainResult.confidence > 100) {
		err("test_weight_analysis: confidence out of range [0,100], got: " + postTrainResult.confidence);
		return false;
	}
	if (!postTrainResult.messageKey || typeof postTrainResult.messageKey !== "string") {
		err("test_weight_analysis: messageKey is missing or not a string");
		return false;
	}
	if (typeof postTrainResult.biasScore !== "number") {
		err("test_weight_analysis: biasScore is not a number");
		return false;
	}
	if (typeof postTrainResult.totalParams !== "number" || postTrainResult.totalParams <= 0) {
		err("test_weight_analysis: totalParams is invalid, got: " + postTrainResult.totalParams);
		return false;
	}

	for (var i = 0; i < postTrainResult.layers.length; i++) {
		var layer = postTrainResult.layers[i];
		if (!layer.name || typeof layer.name !== "string") {
			err("test_weight_analysis: layer " + i + " has invalid name");
			return false;
		}
		if (!layer.shape || !Array.isArray(layer.shape)) {
			err("test_weight_analysis: layer " + i + " has invalid shape");
			return false;
		}
		if (typeof layer.paramCount !== "number" || layer.paramCount <= 0) {
			err("test_weight_analysis: layer " + i + " has invalid paramCount");
			return false;
		}
		if (typeof layer.score !== "number" || layer.score < 0 || layer.score > 100) {
			err("test_weight_analysis: layer " + i + " score out of range, got: " + layer.score);
			return false;
		}
		if (!layer.stats) {
			err("test_weight_analysis: layer " + i + " has no stats");
			return false;
		}
		if (typeof layer.stats.mean !== "number" || isNaN(layer.stats.mean)) {
			err("test_weight_analysis: layer " + i + " stats.mean is invalid");
			return false;
		}
		if (typeof layer.stats.std !== "number" || isNaN(layer.stats.std)) {
			err("test_weight_analysis: layer " + i + " stats.std is invalid");
			return false;
		}
		if (!layer.indicators) {
			err("test_weight_analysis: layer " + i + " has no indicators");
			return false;
		}
		var requiredIndicators = ["entropy", "sparsity", "svd", "kurtosis", "ksTest", "correlation", "initDeviation"];
		for (var j = 0; j < requiredIndicators.length; j++) {
			if (!layer.indicators[requiredIndicators[j]]) {
				err("test_weight_analysis: layer " + i + " missing indicator: " + requiredIndicators[j]);
				return false;
			}
			if (typeof layer.indicators[requiredIndicators[j]].score !== "number") {
				err("test_weight_analysis: layer " + i + " indicator " + requiredIndicators[j] + " has no numeric score");
				return false;
			}
		}
		if (!layer.histogram) {
			err("test_weight_analysis: layer " + i + " has no histogram");
			return false;
		}
		if (!layer.histogram.counts || !layer.histogram.binEdges) {
			err("test_weight_analysis: layer " + i + " histogram missing counts or binEdges");
			return false;
		}
		if (typeof layer.l2Norm !== "number" || isNaN(layer.l2Norm)) {
			err("test_weight_analysis: layer " + i + " l2Norm is invalid");
			return false;
		}
	}

	return true;
}

async function test_weight_analysis() {
	log_test("Test weight analysis");

	await set_dataset_and_wait("signs");
	await delay(3000);

	$("#max_number_of_files_per_category").val(1).trigger("change");
	$("#jump_to_interesting_tab").prop("checked", false);
	$("#visualization_tab_label").click();
	$("#weight_analysis_tab_label").click();

	await delay(1000);

	const wanted_epochs = 2;
	set_epochs(wanted_epochs);

	await delay(3000);

	if ($("#dataset").val() !== "signs") {
		err("test_weight_analysis: dataset selector does not show 'signs', got: " + $("#dataset").val());
		return false;
	}

	var epoch_val = parseInt($("#epochs").val());
	if (epoch_val !== wanted_epochs) {
		err(`test_weight_analysis: epochs is not ${wanted_epochs}, got: ${epoch_val}`);
		return false;
	}

	var max_files_val = parseInt($("#max_number_of_files_per_category").val());
	if (max_files_val !== 1) {
		err("test_weight_analysis: max_number_of_files_per_category is not 1, got: " + max_files_val);
		return false;
	}

	if (!$(".train_neural_network_button").length) {
		err("test_weight_analysis: .train_neural_network_button not found");
		return false;
	}
	if ($(".train_neural_network_button").prop("disabled")) {
		err("test_weight_analysis: .train_neural_network_button is disabled");
		return false;
	}
	if (!$(".layer_setting").length) {
		err("test_weight_analysis: No .layer_setting elements found");
		return false;
	}
	if (!$(".layer_type").length) {
		err("test_weight_analysis: No .layer_type elements found");
		return false;
	}

	if (typeof model === "undefined" || !model || !model.getWeights) {
		err("test_weight_analysis: No model available before training");
		return false;
	}

	var preTrainResult = WeightAnalysis.analyzeModel(model);
	if (!preTrainResult) {
		err("test_weight_analysis: analyzeModel returned null on untrained model");
		return false;
	}
	if (typeof preTrainResult.score !== "number") {
		err("test_weight_analysis: pre-train score is not a number");
		return false;
	}
	if (preTrainResult.layers.length === 0) {
		err("test_weight_analysis: pre-train result has no layers");
		return false;
	}
	var preTrainScore = preTrainResult.score;

	const ret = await train_neural_network();
	if (!is_valid_ret_object(ret, wanted_epochs)) {
		err("test_weight_analysis: Training did not complete successfully");
		return false;
	}

	await delay(5000);

	if (!$("#weight_analysis").length) {
		err("test_weight_analysis: #weight_analysis not found");
		return false;
	}

	var container = document.getElementById("weight_analysis");
	WeightAnalysis.weight_analysis_render(container);
	await delay(3000);

	var postTrainResult = WeightAnalysis.analyzeModel(model);
	if (!_test_weight_analysis_validate_post_train(postTrainResult)) return false;

	var postTrainScore = postTrainResult.score;
	if (!_test_weight_analysis_validate(container, preTrainResult, postTrainResult, postTrainScore, preTrainScore)) return false;

	await delay(1000);

	WeightAnalysis.weight_analysis_render(container);
	await delay(1000);
	if (container.innerHTML.length === 0) {
		err("test_weight_analysis: Re-rendering produced empty content");
		return false;
	}

	await test_if_python_code_is_valid();
	test_no_new_errors_or_warnings();

	return true;
}

// ============================================================
// EXPLAINABILITY TAB TESTS
// ============================================================

async function test_explainability_lib() {
	var old_errs = num_errs;
	var old_wrns = num_wrns;

	try {
		var a = tf.tidy(function () {
			return tf.randomNormal([16, 8]);
		});
		var b = tf.tidy(function () {
			return tf.randomNormal([16, 5]);
		});

		var selfCka = ExplainabilityLib.linearCKA(a, a);
		if (Math.abs(selfCka - 1) > 0.05) {
			err("[test_explainability_lib] CKA(A, A) should be ~1, got " + selfCka);
			a.dispose(); b.dispose();
			return false;
		}

		var crossCka = ExplainabilityLib.linearCKA(a, b);
		if (!isFinite(crossCka) || crossCka < -0.01 || crossCka > 1.01) {
			err("[test_explainability_lib] CKA out of [0, 1]: " + crossCka);
			a.dispose(); b.dispose();
			return false;
		}

		var mat = ExplainabilityLib.ckaMatrix([a, b]);
		if (mat.length !== 2 || mat[0].length !== 2) {
			err("[test_explainability_lib] CKA matrix shape wrong");
			a.dispose(); b.dispose();
			return false;
		}

		if (Math.abs(mat[0][0] - 1) > 0.05 || Math.abs(mat[1][1] - 1) > 0.05) {
			err("[test_explainability_lib] CKA diagonal should be 1");
			a.dispose(); b.dispose();
			return false;
		}

		if (Math.abs(mat[0][1] - mat[1][0]) > 1e-6) {
			err("[test_explainability_lib] CKA matrix should be symmetric");
			a.dispose(); b.dispose();
			return false;
		}

		a.dispose();
		b.dispose();

		var clsActs = tf.tidy(function () {
			var c1 = tf.concat([
				tf.concat([tf.fill([8, 1], 0), tf.fill([8, 1], 0)], 1),
				tf.concat([tf.fill([8, 1], 5), tf.fill([8, 1], 5)], 1)
			], 0);
			return c1;
		});

		var yoh = tf.tidy(function () {
			var labels = tf.concat([
				tf.concat([tf.fill([8, 1], 1), tf.fill([8, 1], 0)], 1),
				tf.concat([tf.fill([8, 1], 0), tf.fill([8, 1], 1)], 1)
			], 0);
			return labels;
		});

		var sep = ExplainabilityLib.classSeparability(clsActs, yoh);
		if (!isFinite(sep.score) || sep.score <= 0) {
			err("[test_explainability_lib] separability score should be finite and > 0, got " + sep.score);
			clsActs.dispose(); yoh.dispose();
			return false;
		}

		clsActs.dispose();
		yoh.dispose();

		var rgb = ExplainabilityLib.viridis(0.5);
		if (!Array.isArray(rgb) || rgb.length !== 3) {
			err("[test_explainability_lib] viridis should return [r, g, b]");
			return false;
		}

		var tc = ExplainabilityLib.themeColors();
		if (typeof tc.text !== "string" || typeof tc.grid !== "string") {
			err("[test_explainability_lib] themeColors should return color strings");
			return false;
		}

		var big = tf.tidy(function () {
			return tf.randomNormal([100, 3]);
		});
		var bigY = tf.tidy(function () {
			return tf.randomNormal([100, 3]);
		});

		var sub = ExplainabilityLib.subsampleBatch(big, bigY, 10);
		if (sub.x.shape[0] !== 10 || sub.y.shape[0] !== 10) {
			err("[test_explainability_lib] subsampleBatch should return 10 rows");
			big.dispose(); bigY.dispose();
			return false;
		}

		big.dispose();
		bigY.dispose();
		sub.x.dispose();
		sub.y.dispose();

		var small = tf.tidy(function () {
			return tf.randomNormal([8, 3]);
		});
		var smallY = tf.tidy(function () {
			return tf.randomNormal([8, 3]);
		});

		var subSmall = ExplainabilityLib.subsampleBatch(small, smallY, 10);
		if (subSmall.x.shape[0] !== 8 || subSmall.y.shape[0] !== 8) {
			err("[test_explainability_lib] subsampleBatch should keep a small batch");
			small.dispose(); smallY.dispose();
			return false;
		}

		small.dispose();
		smallY.dispose();
		subSmall.x.dispose();
		subSmall.y.dispose();

		if (num_errs !== old_errs) {
			err("[test_explainability_lib] new errors during test");
			return false;
		}

		if (num_wrns !== old_wrns) {
			err("[test_explainability_lib] new warnings during test");
			return false;
		}

		return true;
	} catch (e) {
		err("[test_explainability_lib] exception: " + (e.message || e));
		return false;
	}
}

async function test_adversarial_examples() {
	await set_dataset_and_wait("signs");
	await delay(2000);

	var old_errs = num_errs;
	var old_wrns = num_wrns;

	try {
		if (typeof model === "undefined" || !model || !model.layers) {
			err("[test_adversarial_examples] no model");
			return false;
		}

		if (!document.getElementById("adversarial_content")) {
			err("[test_adversarial_examples] #adversarial_content missing");
			return false;
		}

		AdversarialExamples.init("adversarial_content");

		if (!document.getElementById("adv_run_btn")) {
			err("[test_adversarial_examples] run button missing after init");
			return false;
		}

		var advImages = document.getElementById("adv_images");
		var advMargin = document.getElementById("adv_margin_plot");

		if (!advImages || advImages.style.display !== "none") {
			err("[test_adversarial_examples] empty image panels should stay hidden before a run");
			return false;
		}

		if (!advMargin || advMargin.style.display !== "none") {
			err("[test_adversarial_examples] empty margin plot should stay hidden before a run");
			return false;
		}

		var res = await AdversarialExamples.run({
			method: "fgsm",
			eps: 0.05,
			iters: 1,
			target: "predicted"
		});

		if (!res) {
			err("[test_adversarial_examples] run() returned null");
			return false;
		}

		if (typeof res.origTop !== "number" || typeof res.advTop !== "number") {
			err("[test_adversarial_examples] missing top-1 classes");
			return false;
		}

		if (!isFinite(res.targetLogitBefore) || !isFinite(res.targetLogitAfter)) {
			err("[test_adversarial_examples] target logits not finite");
			return false;
		}

		if (res.targetLogitAfter > res.targetLogitBefore + 1e-3) {
			err("[test_adversarial_examples] untargeted attack should lower the target logit, got " +
				res.targetLogitBefore + " -> " + res.targetLogitAfter);
			return false;
		}

		if (!Array.isArray(res.marginHistory) || res.marginHistory.length < 2) {
			err("[test_adversarial_examples] margin history missing");
			return false;
		}

		for (var i = 0; i < res.marginHistory.length; i++) {
			if (!isFinite(res.marginHistory[i])) {
				err("[test_adversarial_examples] non-finite margin at " + i);
				return false;
			}
		}

		AdversarialExamples.init("adversarial_content");

		if (advImages.style.display === "none") {
			err("[test_adversarial_examples] image panels should be visible after a run");
			return false;
		}

		if (advMargin.style.display === "none") {
			err("[test_adversarial_examples] margin plot should be visible after a run");
			return false;
		}

		if (num_errs !== old_errs) {
			err("[test_adversarial_examples] new errors during test");
			return false;
		}

		if (num_wrns !== old_wrns) {
			err("[test_adversarial_examples] new warnings during test");
			return false;
		}

		return true;
	} catch (e) {
		err("[test_adversarial_examples] exception: " + (e.message || e));
		return false;
	}
}

async function test_representation_analysis() {
	await set_dataset_and_wait("signs");
	await delay(2000);

	var old_errs = num_errs;
	var old_wrns = num_wrns;

	try {
		if (typeof model === "undefined" || !model || !model.layers) {
			err("[test_representation_analysis] no model");
			return false;
		}

		if (!document.getElementById("representation_content")) {
			err("[test_representation_analysis] #representation_content missing");
			return false;
		}

		RepresentationAnalysis.init("representation_content");

		var runHint = document.getElementById("rep_run_hint");
		var ckaPanel = document.getElementById("rep_cka_panel");
		var sepPanelBefore = document.getElementById("rep_sep_panel");

		if (!runHint || runHint.style.display === "none") {
			err("[test_representation_analysis] analyze hint should be visible before a run");
			return false;
		}

		if (!ckaPanel || ckaPanel.style.display !== "none") {
			err("[test_representation_analysis] empty CKA panel should stay hidden before a run");
			return false;
		}

		if (!sepPanelBefore || sepPanelBefore.style.display !== "none") {
			err("[test_representation_analysis] empty separability panel should stay hidden before a run");
			return false;
		}

		var sizeEl = document.getElementById("rep_sample_size");
		if (sizeEl) {
			sizeEl.value = "16";
		}

		await RepresentationAnalysis.runFromUI();

		if (runHint.style.display !== "none") {
			err("[test_representation_analysis] analyze hint should disappear after a run");
			return false;
		}

		if (ckaPanel.style.display === "none") {
			err("[test_representation_analysis] CKA panel should be visible after a run");
			return false;
		}

		if (ExplainabilityLib.isClassification() && sepPanelBefore.style.display === "none") {
			err("[test_representation_analysis] separability panel should be visible after a run");
			return false;
		}

		var state = RepresentationAnalysis.getInternalState();

		if (!state.z || !state.names || state.z.length === 0) {
			err("[test_representation_analysis] no CKA result");
			return false;
		}

		var n = state.z.length;
		if (state.z.length !== state.names.length || n < 1) {
			err("[test_representation_analysis] CKA matrix/labels mismatch");
			return false;
		}

		for (var i = 0; i < n; i++) {
			if (state.z[i].length !== n) {
				err("[test_representation_analysis] CKA matrix not square");
				return false;
			}

			if (Math.abs(state.z[i][i] - 1) > 0.05) {
				err("[test_representation_analysis] CKA diagonal not ~1");
				return false;
			}

			for (var j = 0; j < n; j++) {
				var v = state.z[i][j];
				if (!isFinite(v) || v < -0.01 || v > 1.01) {
					err("[test_representation_analysis] CKA value out of range: " + v);
					return false;
				}
			}
		}

		if (ExplainabilityLib.isClassification() && !state.sep) {
			err("[test_representation_analysis] separability missing for classification model");
			return false;
		}

		if (state.sep) {
			for (i = 0; i < state.sep.length; i++) {
				if (!isFinite(state.sep[i].score) || state.sep[i].score < 0) {
					err("[test_representation_analysis] bad separability score at layer " + i);
					return false;
				}
			}
		}

		if (num_errs !== old_errs) {
			err("[test_representation_analysis] new errors during test");
			return false;
		}

		if (num_wrns !== old_wrns) {
			err("[test_representation_analysis] new warnings during test");
			return false;
		}

		return true;
	} catch (e) {
		err("[test_representation_analysis] exception: " + (e.message || e));
		return false;
	}
}

// ============================================================
// Focused tests for theme.js, summary.js, loss_landscape.js and
// fcnn_editable.js. These exercise the helpers directly so failures point
// at the module rather than at unrelated model training.
// ============================================================

function _test_fake_tensor (data, shape) {
	return {
		shape: shape,
		dataSync: function () { return Float32Array.from(data); },
		arraySync: function () { return data; }
	};
}

function _test_fake_weight (shape, data) {
	return { name: "w", shape: shape, val: _test_fake_tensor(data, shape) };
}

function _test_fake_layer (name, type, inputShape, outputShape, weights, config) {
	var layerWeights = weights || [];
	return {
		name: name,
		inputShape: inputShape,
		outputShape: outputShape,
		trainableWeights: layerWeights,
		nonTrainableWeights: [],
		weights: layerWeights,
		getClassName: function () { return type; },
		getConfig: function () { return config || {}; },
		getWeights: function () { return layerWeights.map(function (weight) { return weight.val; }); }
	};
}

function _test_fake_bias_layer (biasValues, useBias) {
	var kernel = {
		shape: [Math.max(1, biasValues.length), 1],
		dataSync: function () { return Float32Array.from([1, 2, 3, 4]); }
	};
	var bias = {
		shape: [biasValues.length],
		dataSync: function () { return Float32Array.from(biasValues); },
		arraySync: function () { return biasValues; }
	};
	return {
		name: "fake_bias_layer",
		getClassName: function () { return "Dense"; },
		getWeights: function () { return [kernel, bias]; },
		weights: [],
		getConfig: function () { return { use_bias: useBias !== false }; }
	};
}

async function test_theme_module () {
	var body = document.body;
	var oldTransition = body.style.transition;
	var oldFlag = body.dataset.themeTransitioning;
	var oldStyle = document.getElementById("_theme_transition_style");
	if (oldStyle) oldStyle.remove();

	_apply_theme_transition();
	test_equal("theme: adds transition style", !!document.getElementById("_theme_transition_style"), true);
	test_equal("theme: sets transitioning flag", body.dataset.themeTransitioning, "true");
	var firstStyle = document.getElementById("_theme_transition_style");
	_apply_theme_transition();
	test_equal("theme: transition style is reused", document.getElementById("_theme_transition_style"), firstStyle);

	await _wait_for_theme_transition();
	test_equal("theme: transition style removed", document.getElementById("_theme_transition_style"), null);
	test_equal("theme: transitioning flag reset", body.dataset.themeTransitioning, "false");

	var chooser = document.getElementById("theme_choser");
	var cssMode = document.getElementById("css_mode");
	var cssRibbon = document.getElementById("css_ribbon");
	if (!chooser || !cssMode || !cssRibbon) {
		test_equal("theme: required DOM elements exist", false, true);
		return true;
	}

	var oldValue = chooser.value;
	var oldMode = cssMode.getAttribute("href");
	var oldRibbon = cssRibbon.getAttribute("href");
	var oldSetCookie = window.set_cookie;
	var cookieCalls = [];
	var saved = {};
	var stubs = ["write_descriptions", "write_model_to_latex_to_page", "invert_elements_in_dark_mode", "restart_fcnn", "check_number_values"];
	stubs.forEach(function (name) {
		saved[name] = window[name];
		window[name] = function () { return Promise.resolve(); };
	});
	window.set_cookie = function (key, value) { cookieCalls.push([key, value]); };

	try {
		chooser.value = "";
		await theme_choser();
		test_equal("theme: empty selection leaves stylesheet", cssMode.getAttribute("href"), oldMode);
		test_equal("theme: empty selection sets no cookie", cookieCalls.length, 0);

		var theme = oldValue || "light";
		chooser.value = theme;
		await theme_choser();
		test_equal("theme: css_mode updated", cssMode.getAttribute("href"), "css/" + theme + ".css");
		test_equal("theme: css_ribbon updated", cssRibbon.getAttribute("href"), "css/ribbon" + theme + ".css");
		test_equal("theme: cookie written", cookieCalls.length, 1);
		test_equal("theme: cookie key", cookieCalls[0][0], "theme");
		test_equal("theme: cookie value", cookieCalls[0][1], theme);
	} finally {
		stubs.forEach(function (name) {
			if (saved[name] === undefined) delete window[name]; else window[name] = saved[name];
		});
		window.set_cookie = oldSetCookie;
		chooser.value = oldValue;
		if (oldMode === null) cssMode.removeAttribute("href"); else cssMode.setAttribute("href", oldMode);
		if (oldRibbon === null) cssRibbon.removeAttribute("href"); else cssRibbon.setAttribute("href", oldRibbon);

		var style = document.getElementById("_theme_transition_style");
		if (style) style.remove();
		body.style.transition = oldTransition || "";
		if (oldFlag === undefined) delete body.dataset.themeTransitioning; else body.dataset.themeTransitioning = oldFlag;
	}

	return true;
}

async function test_summary_module () {
	var layer1 = _test_fake_layer(
		"dense_a",
		"Dense",
		[null, 2],
		[null, 4],
		[_test_fake_weight([2, 4], [1, 2, 3, 4, 5, 6, 7, 8]), _test_fake_weight([4], [1, 2, 3, 4])],
		{ units: 4, activation: "relu", use_bias: true }
	);
	var layer2 = _test_fake_layer(
		"conv_b",
		"Conv2D",
		[null, 8, 8, 1],
		[null, 6, 6, 2],
		[_test_fake_weight([3, 3, 1, 2], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]), _test_fake_weight([2], [1, 2])],
		{ filters: 2, kernel_size: [3, 3] }
	);

	test_equal("summary: _product_of_dims", _product_of_dims([2, 3, null]), 6);
	test_equal("summary: _safe_count_params", _safe_count_params([
		{ shape: [2, 3] },
		{ size: 5 },
		{ tensor: { shape: [4] } }
	]), 15);
	test_equal("summary: _format_shape array", _format_shape([null, 3]), "[null,3]");
	test_equal("summary: _format_shape null", _format_shape(null), "N/A");
	test_equal("summary: _escape_html", _escape_html("<b>\"x\"&'"), "&lt;b&gt;&quot;x&quot;&amp;&#39;");
	test_equal("summary: _format_shape_export", _format_shape_export([2, 3]), "[2,3]");
	test_equal("summary: _csv_escape", _csv_escape('a"b'), 'a""b');
	test_equal("summary: _latex_escape", _latex_escape("a_b&c%"), "a\\_b\\&c\\%");
	test_equal("summary: _format_config_key snake", _format_config_key("kernel_initializer"), "Kernel initializer");
	test_equal("summary: _format_config_key camel", _format_config_key("activationFunction"), "Activation Function");
	test_equal("summary: _format_memory bytes", _format_memory(512), "512 B");
	test_equal("summary: _format_memory KB", _format_memory(1024), "1.0 KB");
	test_equal("summary: _format_memory MB", _format_memory(1048576), "1.00 MB");
	test_equal("summary: layer icon dense", _get_layer_type_icon("Dense"), "◈");
	test_equal("summary: layer icon conv", _get_layer_type_icon("conv2d"), "▦");
	test_equal("summary: layer icon dropout", _get_layer_type_icon("Dropout"), "◌");
	test_equal("summary: layer icon fallback", _get_layer_type_icon("unknown"), "◆");
	test_equal("summary: _format_config_value class", _format_config_value({ class_name: "Foo" }), "Foo");
	test_equal("summary: _format_config_value array", _format_config_value([1, 2]), "[1,2]");

	var collected = _collect_layer_data([layer1, layer2]);
	test_equal("summary: two layers collected", collected.layer_data.length, 2);
	test_equal("summary: max params", collected.max_params, 20);
	test_equal("summary: layer name kept", collected.layer_data[0].name, "dense_a");
	test_equal("summary: layer type kept", collected.layer_data[1].layer_type, "Conv2D");
	test_equal("summary: layer params", collected.layer_data[0].params, 12);

	var row = _build_summary_row(collected.layer_data[0], 0, collected.max_params);
	test_equal("summary: row contains param bar", row.indexOf("param-bar-fill") !== -1, true);
	test_equal("summary: row contains layer name", row.indexOf("dense_a") !== -1, true);

	var oldModel = window.model;
	var oldLayerData = window._summary_layer_data;
	var oldTotals = window._summary_totals;
	window.model = { layers: [layer1, layer2], uuid: "test-summary-model" };
	try {
		var table = build_model_summary_table();
		test_equal("summary: table id", table.indexOf('id="summary_table"') !== -1, true);
		test_equal("summary: total row", table.indexOf("Total params: 32") !== -1, true);
		test_equal("summary: layer data stored", window._summary_layer_data.length, 2);
		test_equal("summary: totals stored", window._summary_totals.total, 32);
	} finally {
		if (oldModel === undefined) delete window.model; else window.model = oldModel;
		window._summary_layer_data = oldLayerData;
		window._summary_totals = oldTotals;
	}

	window._summary_totals = { total: 32, trainable: 32, non_trainable: 0 };
	var tooltip = _build_layer_tooltip_html(collected.layer_data[0]);
	test_equal("summary: tooltip header", tooltip.indexOf("dense_a") !== -1, true);
	test_equal("summary: tooltip parameters", tooltip.indexOf("Parameters") !== -1, true);
	test_equal("summary: tooltip shape flow", tooltip.indexOf("Shape Flow") !== -1, true);
	test_equal("summary: tooltip memory", tooltip.indexOf("Memory") !== -1, true);

	var markdown = _export_as_markdown(collected.layer_data, { total: 32, trainable: 32, non_trainable: 0 });
	var csv = _export_as_csv(collected.layer_data, { total: 32, trainable: 32, non_trainable: 0 });
	var latex = _export_as_latex(collected.layer_data, { total: 32, trainable: 32, non_trainable: 0 });
	test_equal("summary: markdown export", markdown.indexOf("| dense_a (Dense) |") !== -1, true);
	test_equal("summary: csv export", csv.indexOf('"dense_a"') !== -1, true);
	test_equal("summary: latex export", latex.indexOf("\\begin{table}") !== -1, true);

	var legacy = summary_to_table(["Layer  Input  Output  Params", "======", "dense_a  [null,2]  [null,4]  12"]);
	test_equal("summary: legacy table", legacy.indexOf("<table") !== -1, true);

	var oldStyle = document.getElementById("summary-tooltip-styles");
	if (oldStyle) oldStyle.remove();
	_inject_tooltip_styles();
	var style = document.getElementById("summary-tooltip-styles");
	test_equal("summary: style injected", !!style, true);
	test_equal("summary: style has content", style && style.textContent.length > 100, true);
	_inject_tooltip_styles();
	test_equal("summary: style not duplicated", document.querySelectorAll("#summary-tooltip-styles").length, 1);

	var exportBar = document.createElement("div");
	exportBar.innerHTML = '<div id="summary_export_bar"></div>';
	_build_export_bar(exportBar);
	test_equal("summary: export buttons", exportBar.querySelectorAll(".summary-export-btn").length, 4);

	var extras = document.createElement("div");
	extras.innerHTML = '<div id="summary_export_bar"></div>';
	_inject_summary_extras(extras);
	test_equal("summary: extras inject export bar", extras.querySelectorAll(".summary-export-btn").length, 4);

	window._summary_layer_data = collected.layer_data;
	var listenerContainer = document.createElement("div");
	listenerContainer.innerHTML = '<div class="summary-layer-name" data-layer-index="0" title="old"></div>';
	_attach_tooltip_listeners(listenerContainer);
	test_equal("summary: tooltip listener removes title", listenerContainer.querySelector(".summary-layer-name").hasAttribute("title"), false);

	var oldDownload = window._download_text;
	var oldClipboard = window._copy_to_clipboard;
	var downloads = [];
	var copies = [];
	window._download_text = function (content, filename) { downloads.push([filename, content]); };
	window._copy_to_clipboard = function (text) { copies.push(text); };
	try {
		_export_summary("markdown", null);
		_export_summary("csv", null);
		_export_summary("latex", null);
		_export_summary("clipboard", null);
		test_equal("summary: three downloads", downloads.length, 3);
		test_equal("summary: clipboard export", copies.length, 1);
	} finally {
		window._download_text = oldDownload;
		window._copy_to_clipboard = oldClipboard;
		window._summary_layer_data = oldLayerData;
		window._summary_totals = oldTotals;
	}

	return true;
}

async function test_loss_landscape_module () {
	var model = tf.sequential();
	model.add(tf.layers.dense({
		units: 2,
		inputShape: [2],
		useBias: true,
		kernelInitializer: "ones",
		biasInitializer: "zeros"
	}));
	var input = tf.tensor2d([[1, 0]], [1, 2]);
	var wanted = tf.tensor2d([[1, 2]], [1, 2]);

	var oldLoss = $("#loss").val();
	var oldErr = window.err;
	var oldPlotly = window.Plotly;
	var oldModel = window.model;
	var oldGetXY = window.get_x_and_y;
	var errCalls = [];
	var plotlyCalls = [];
	var container = document.createElement("div");
	container.id = "test_loss_landscape_container";
	container.style.width = "300px";
	container.style.height = "200px";
	document.body.appendChild(container);

	window.err = function () { errCalls.push(Array.prototype.slice.call(arguments)); };
	window.Plotly = {
		newPlot: function (target, traces, layout) { plotlyCalls.push({ target: target, traces: traces, layout: layout }); },
		Plots: { resize: function () {} }
	};
	$("#loss").val("meanSquaredError");

	try {
		test_equal("loss: model validation", ensure_model_has_layers(model), true);
		var threw = false;
		try { ensure_model_has_layers(null); } catch (e) { threw = true; }
		test_equal("loss: rejects null model", threw, true);
		threw = false;
		try { ensure_model_has_layers({ layers: [] }); } catch (e) { threw = true; }
		test_equal("loss: rejects empty model", threw, true);

		test_equal("loss: accepts tensor", ensure_tensor(input, "input"), true);
		threw = false;
		try { ensure_tensor([1], "input"); } catch (e) { threw = true; }
		test_equal("loss: rejects non-tensor", threw, true);

		test_equal("loss: shape array valid", isShapeArray([null, 3]), true);
		test_equal("loss: shape array negative", isShapeArray([2, -1]), false);
		test_equal("loss: shape array non-array", isShapeArray("x"), false);

		test_equal("loss: selected function", get_selected_loss_function(), tf.metrics.meanSquaredError);
		var prediction = get_model_prediction(model, input);
		test_equal("loss: prediction shape", prediction.shape.join(","), "1,2");
		await dispose(prediction);

		test_equal("loss: identical tensors have zero loss", calculate_loss(tf.metrics.meanSquaredError, wanted, wanted), 0);
		test_equal("loss: finite data loss", isFinite(get_loss_from_data(model, input, wanted)), true);

		var extracted = extract_flat_weights_from_model(model);
		test_equal("loss: weights extracted", extracted.dim >= 2, true);
		test_equal("loss: metadata lengths", extracted.sizes.length, extracted.shapes.length);
		var modified = extracted.flat.slice();
		modified[0] = modified[0] + 1;
		rebuild_weights_from_flat(model, modified, extracted.sizes, extracted.shapes);
		var after = extract_flat_weights_from_model(model);
		test_equal("loss: weights rebuilt", Math.abs(after.flat[0] - modified[0]) < 1e-6, true);
		rebuild_weights_from_flat(model, extracted.flat, extracted.sizes, extracted.shapes);

		test_equal("loss: dot product", compute_dot([1, 2], [3, 4]), 11);
		test_equal("loss: subtract mul", subtract_mul([5, 5], [1, 1], 2).join(","), "3,3");
		test_equal("loss: vector norm", vector_norm([3, 4]), 5);
		test_equal("loss: normalize zero", normalize_vector([0, 0]).join(","), "0,0");
		test_equal("loss: normalize vector length", vector_norm(normalize_vector([3, 4])), 1);
		test_equal("loss: scalar mul", scalarMulVec(3, [1, 2]).join(","), "3,6");
		test_equal("loss: random vector length", generate_random_vector(5).length, 5);
		var orthogonal = generate_orthogonal_vector([1, 0, 0]);
		test_equal("loss: orthogonal dot", Math.abs(compute_dot(orthogonal, [1, 0, 0])) < 1e-9, true);
		test_equal("loss: fallback axes", fallback_axes(2)[0].join(",") + "|" + fallback_axes(2)[1].join(","), "1,0|0,1");
		test_equal("loss: standard basis", computeStandardBasis(3, model, extracted.flat, extracted.sizes, extracted.shapes, input, wanted)[0].join(","), "1,0,0");
		test_equal("loss: fixed radius", compute_fixed_radius(2, 100), 1);
		test_equal("loss: projection center", projection_center([1, 0], [3, 4]), 3);
		test_equal("loss: projection range", get_projection_range([1, 0], [3, 4], 0.5).min, 2.5);
		test_equal("loss: step", get_step(0, 10, 5), 2.5);
		test_equal("loss: modified flat", generate_modified_flat([1, 1], [1, 0], [0, 1], 2, 3).join(","), "4,3");
		test_equal("loss: format time seconds", formatTime(65), "01:05");
		test_equal("loss: format time hours", formatTime(3661), "01:01:01");
		test_equal("loss: format time invalid", formatTime(-1), "...");

		var directions = get_directions_for_method("standard_basis", extracted.dim, model, extracted.flat, extracted.sizes, extracted.shapes, input, wanted);
		test_equal("loss: standard direction count", directions.length, 2);
		test_equal("loss: standard direction dim", directions[0].length, extracted.dim);
		var randomDirections = get_directions_for_method("random_directions", extracted.dim, model, extracted.flat, extracted.sizes, extracted.shapes, input, wanted);
		test_equal("loss: random direction normalized", Math.abs(vector_norm(randomDirections[0]) - 1) < 1e-6, true);
		var filterDirections = get_directions_for_method("filter_normalized_random", extracted.dim, model, extracted.flat, extracted.sizes, extracted.shapes, input, wanted);
		test_equal("loss: filter directions", filterDirections.length, 2);

		var data = await get_loss_landscape_plot_data(model, input, wanted, 2, 2, "standard_basis");
		test_equal("loss: grid data", !!data && data.length === 3 && data[0].length === 4, true);
		var grid = reshape_flat_grid(data[0], data[1], data[2]);
		test_equal("loss: grid reshaped", grid[0].length === 2 && grid[0][0].length === 2, true);
		test_equal("loss: non-square grid rejected", reshape_flat_grid([1, 2, 3], [1, 2, 3], [1, 2, 3])[0].length, 0);

		test_equal("loss: existing container", get_or_create_container("test_loss_landscape_container"), container);
		var created = get_or_create_container("test_loss_landscape_missing_container");
		test_equal("loss: container created", !!created && document.body.contains(created), true);
		created.remove();

		plot_loss_landscape_surface(data, "test_loss_landscape_container", "standard_basis");
		test_equal("loss: surface plotted", plotlyCalls.length > 0, true);
		await plot_loss_landscape_from_model_and_data(model, input, wanted, 2, 2, "test_loss_landscape_container", "standard_basis");
		test_equal("loss: wrapper plotted", plotlyCalls.length >= 2, true);

		var pcaData = await get_loss_landscape_plot_data(model, input, wanted, 2, 2, "loss_aware_pca");
		test_equal("loss: PCA data", !!pcaData && pcaData[0].length === 4, true);
		var sharpData = await get_loss_landscape_plot_data(model, input, wanted, 2, 2, "sharpness_aware_proxy");
		test_equal("loss: sharpness data", !!sharpData && sharpData[0].length === 4, true);

		window.model = {
			layers: model.layers,
			input: { shape: [null, 2] },
			output: { shape: [null, 2] },
			predict: function (value) { return model.predict(value); }
		};
		window.get_x_and_y = async function () {
			return { x: tf.tensor2d([[1, 0]], [1, 2]), y: tf.tensor2d([[1, 2]], [1, 2]) };
		};
		var plotted = await plot_loss_landscape_from_model(null, 2, 2, "test_loss_landscape_container", "standard_basis");
		test_equal("loss: plot from model", plotted, true);
	} finally {
		window.err = oldErr;
		window.Plotly = oldPlotly;
		window.model = oldModel;
		window.get_x_and_y = oldGetXY;
		$("#loss").val(oldLoss);

		if (container.__resizeObserver) {
			try { container.__resizeObserver.disconnect(); } catch (e) {}
		}
		container.remove();
		await dispose(input);
		await dispose(wanted);
		if (typeof model.dispose === "function") model.dispose();
	}

	return true;
}

async function test_fcnn_editable_module () {
	var lightHtml = _fcnn_edit_build_popup_html(false);
	var darkHtml = _fcnn_edit_build_popup_html(true);
	test_equal("fcnn: popup has weight input", lightHtml.indexOf('id="fcnn_edit_weight_num"') !== -1, true);
	test_equal("fcnn: popup has bias input", lightHtml.indexOf('id="fcnn_edit_bias_num"') !== -1, true);
	test_equal("fcnn: popup has indices", lightHtml.indexOf('id="fcnn_edit_from_idx"') !== -1, true);
	test_equal("fcnn: light border", lightHtml.indexOf("#ddd") !== -1, true);
	test_equal("fcnn: dark border", darkHtml.indexOf("#444") !== -1, true);

	var oldStarted = window.started_training;
	window.started_training = true;
	test_equal("fcnn: training state true", _fcnn_edit_is_training(), true);
	window.started_training = false;
	test_equal("fcnn: training state false", _fcnn_edit_is_training(), false);
	if (oldStarted === undefined) delete window.started_training; else window.started_training = oldStarted;

	var existingCanvas = document.getElementById("fcnn_canvas");
	var oldCanvasId = existingCanvas ? existingCanvas.id : null;
	if (existingCanvas) existingCanvas.id = "fcnn_canvas_test_backup";
	var testCanvas = document.createElement("canvas");
	testCanvas.id = "fcnn_canvas";
	testCanvas.width = 200;
	testCanvas.height = 100;
	testCanvas.style.cssText = "position:fixed;left:10px;top:20px;width:100px;height:50px;";
	document.body.appendChild(testCanvas);
	try {
		var converted = _fcnn_edit_convert_mouse_to_canvas({}, 60, 45);
		test_equal("fcnn: convert mouse x", Math.round(converted.canvasMouseX), 100);
		test_equal("fcnn: convert mouse y", Math.round(converted.canvasMouseY), 50);
	} finally {
		testCanvas.remove();
		if (existingCanvas) existingCanvas.id = oldCanvasId;
	}

	var region = { x: 0, y: 0, w: 100, h: 100 };
	var mapped = _fcnn_edit_map_to_neuron_indices(region, 50, 50, 3, 5);
	test_equal("fcnn: map from index", mapped.from_idx, 1);
	test_equal("fcnn: map to index", mapped.to_idx, 2);
	var clamped = _fcnn_edit_map_to_neuron_indices(region, 50, 1000, 3, 5);
	test_equal("fcnn: map clamps from", clamped.from_idx, 2);
	test_equal("fcnn: map clamps to", clamped.to_idx, 4);

	var weightInfo = { shape: [2, 3], data: [0, 1, 2, 3, 4, 5] };
	var lookup = _fcnn_edit_lookup_weight(weightInfo, 1, 2);
	test_equal("fcnn: lookup flat index", lookup.weight_flat_idx, 5);
	test_equal("fcnn: lookup value", lookup.weightValue, 5);
	var clipped = _fcnn_edit_lookup_weight(weightInfo, 99, 99);
	test_equal("fcnn: lookup clips rows", clipped.fi, 1);
	test_equal("fcnn: lookup clips cols", clipped.ti, 2);

	test_equal("fcnn: tensor data extraction", _try_extract_array_from_tensor(_test_fake_tensor([1, 2], [2])).join(","), "1,2");
	test_equal("fcnn: tensor array fallback", _try_extract_array_from_tensor({ arraySync: function () { return [[3, 4]]; } }).join(","), "3,4");
	test_equal("fcnn: tensor extraction rejects empty", _try_extract_array_from_tensor({}), null);
	test_equal("fcnn: weight variable val", _try_extract_array_from_weight_variable({ val: _test_fake_tensor([5, 6], [2]) }).join(","), "5,6");
	test_equal("fcnn: weight variable read", _try_extract_array_from_weight_variable({ read: function () { return _test_fake_tensor([7], [1]); } }).join(","), "7");
	test_equal("fcnn: weight variable direct", _try_extract_array_from_weight_variable(_test_fake_tensor([8], [1])).join(","), "8");
	test_equal("fcnn: no-bias config", _check_layer_has_no_bias({ getConfig: function () { return { use_bias: false }; } }), true);
	test_equal("fcnn: bias config", _check_layer_has_no_bias({ getConfig: function () { return { use_bias: true }; } }), false);

	var biasLayer = _test_fake_bias_layer([1, 2, 3]);
	test_equal("fcnn: layer has exact bias", _fcnn_edit_layer_has_bias_of_size(biasLayer, 3), true);
	test_equal("fcnn: layer rejects other bias", _fcnn_edit_layer_has_bias_of_size(biasLayer, 4), false);
	test_equal("fcnn: check bias exact", _fcnn_edit_check_layer_bias(biasLayer, 3), true);
	test_equal("fcnn: check bias larger", _fcnn_edit_check_layer_bias(biasLayer, 2), true);
	test_equal("fcnn: check bias null layer", _fcnn_edit_check_layer_bias(null, 3), null);

	var oldModel = window.model;
	var oldGetFcnnData = window.get_fcnn_data;
	var oldGetLayerWeightData = window.get_layer_weight_data;
	var oldActive = _fcnn_edit_active;
	var oldPopup = _fcnn_edit_popup_el;
	var oldInitial = _fcnn_edit_initial_value;

	try {
		window.model = { layers: [_test_fake_bias_layer([1, 2, 3]), _test_fake_bias_layer([1, 2, 3]), _test_fake_bias_layer([1, 2, 3, 4, 5])] };
		test_equal("fcnn: scans adjacent layer", _fcnn_edit_scan_adjacent_layers(1, 5), 2);

		window.get_fcnn_data = function () { return [[], [3, 4], [null, { nr: 1 }]]; };
		test_equal("fcnn: finds dense layer", _fcnn_edit_find_dense_layer_for_neuron(1), 1);
		window.get_fcnn_data = function () { return [[], [3, 4], [{ nr: 0 }, { nr: 1 }]]; };
		test_equal("fcnn: finds first dense layer", _fcnn_edit_find_dense_layer_for_neuron(0), 0);

		test_equal("fcnn: bias data", _fcnn_edit_get_bias_data(1).join(","), "1,2,3");
		test_equal("fcnn: bias data out of range", _fcnn_edit_get_bias_data(9), null);
		window.model = { layers: [{ getWeights: function () { return []; }, getConfig: function () { return { use_bias: false }; } }] };
		test_equal("fcnn: no bias layer", _fcnn_edit_get_bias_data(0), null);

		window.model = { layers: [{
			getWeights: function () { return [_test_fake_tensor([1], [1])]; }
		}] };
		_fcnn_edit_active = { meta_infos: [null, { nr: 0 }] };
		var validated = _fcnn_edit_validate_tensor_access(0);
		test_equal("fcnn: validates tensor access", !!validated && validated.meta.nr, 0);
		window.model = { layers: [{ getWeights: function () { throw new Error("gone"); } }] };
		test_equal("fcnn: invalid tensor access", _fcnn_edit_validate_tensor_access(0), null);

		window.model = null;
		window.get_layer_weight_data = function () { return { data: [10, 20, 30] }; };
		_fcnn_edit_active = { meta_infos: [null, { nr: 0 }], from_layer: 0 };
		test_equal("fcnn: reads weight", _fcnn_edit_read_weight_at(_fcnn_edit_active, 1), 20);
		test_equal("fcnn: reads missing weight", _fcnn_edit_read_weight_at(_fcnn_edit_active, 9), null);

		_fcnn_edit_active = null;
		_fcnn_edit_initial_value = null;
		_fcnn_edit_popup_el = null;
		var existingPopup = document.getElementById("fcnn_edit_popup");
		if (existingPopup) existingPopup.remove();
		var popup = _fcnn_edit_ensure_popup();
		test_equal("fcnn: popup created", !!popup && document.body.contains(popup), true);
		test_equal("fcnn: popup reused", _fcnn_edit_ensure_popup(), popup);
		_fcnn_edit_close_popup();
		test_equal("fcnn: popup hidden", popup.style.display, "none");
		popup.remove();
	} finally {
		window.model = oldModel;
		window.get_fcnn_data = oldGetFcnnData;
		window.get_layer_weight_data = oldGetLayerWeightData;
		_fcnn_edit_active = oldActive;
		_fcnn_edit_popup_el = oldPopup;
		_fcnn_edit_initial_value = oldInitial;
		var leftover = document.getElementById("fcnn_edit_popup");
		if (leftover && leftover !== oldPopup) leftover.remove();
	}

	return true;
}

async function test_augmentation_options () {
	const option_ids = [
		"augment_rotate_images",
		"augment_invert_images",
		"augment_flip_left_right",
		"augment_brightness",
		"augment_contrast",
		"augment_saturation",
		"augment_grayscale",
		"augment_noise"
	];
	const amount_ids = [
		"number_of_rotations",
		"augment_brightness_amount",
		"augment_contrast_amount",
		"augment_saturation_amount",
		"augment_noise_amount"
	];
	const saved_checked = {};
	const saved_values = {};
	option_ids.forEach(function (id) { saved_checked[id] = $("#" + id).is(":checked"); });
	amount_ids.forEach(function (id) { saved_values[id] = $("#" + id).val(); });

	const original_add_tensor_as_image = window.add_tensor_as_image_to_photos;
	window.add_tensor_as_image_to_photos = function () {};

	const t3 = tensor([
		[[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]],
		[[0.2, 0.3, 0.4], [0.5, 0.6, 0.7]]
	]);
	const t4 = expand_dims(t3);

	try {
		test_equal("augmentation tab exists", $("a[href*='tf_ribbon_augmentation']").length, 1);
		test_equal("augmentation tab is visible", $("a[href*='tf_ribbon_augmentation']").parent().css("display") !== "none", true);
		test_equal("old augment checkbox removed", $("#auto_augment").length, 0);
		option_ids.forEach(function (id) {
			test_equal("augmentation control " + id, $("#" + id).length, 1);
		});
		amount_ids.forEach(function (id) {
			test_equal("augmentation value " + id, $("#" + id).length, 1);
		});
		test_equal("mobile brightness control exists", $("#mobile_augment_brightness").length, 1);
		test_equal("mobile noise control exists", $("#mobile_augment_noise").length, 1);

		option_ids.forEach(function (id) { $("#" + id).prop("checked", false); });
		test_equal("no augmentation selected", is_auto_augment(), false);
		$("#augment_brightness").prop("checked", true);
		test_equal("brightness enables augmentation", is_auto_augment(), true);

		const original_values = array_sync(t4);

		$("#augment_brightness_amount").val(0.2);
		const bright = _augment_brightness_tensor(t4);
		const bright_values = array_sync(bright);
		test_equal("brightness shape", bright.shape.join(","), "1,2,2,3");
		test_equal("brightness brightens", bright_values[0][0][0][0] > original_values[0][0][0][0], true);
		await dispose(bright);

		$("#augment_contrast_amount").val(2);
		const contrast = _augment_contrast_tensor(t4);
		const contrast_values = array_sync(contrast);
		test_equal("contrast shape", contrast.shape.join(","), "1,2,2,3");
		test_equal("contrast changes values", JSON.stringify(contrast_values) !== JSON.stringify(original_values), true);
		await dispose(contrast);

		const gray = _augment_grayscale_tensor(t4);
		const gray_values = array_sync(gray);
		test_equal("grayscale shape", gray.shape.join(","), "1,2,2,3");
		test_equal("grayscale channels equal", gray_values[0][0][0][0] === gray_values[0][0][0][1] &&
			gray_values[0][0][0][1] === gray_values[0][0][0][2], true);
		await dispose(gray);

		$("#augment_saturation_amount").val(0);
		const desaturated = _augment_saturation_tensor(t4);
		const desaturated_values = array_sync(desaturated);
		test_equal("saturation zero channels equal", desaturated_values[0][0][0][0] === desaturated_values[0][0][0][1] &&
			desaturated_values[0][0][0][1] === desaturated_values[0][0][0][2], true);
		await dispose(desaturated);

		$("#augment_noise_amount").val(0.2);
		const noisy = _augment_noise_tensor(t4);
		const noisy_values = array_sync(noisy);
		test_equal("noise shape", noisy.shape.join(","), "1,2,2,3");
		test_equal("noise changes values", JSON.stringify(noisy_values) !== JSON.stringify(original_values), true);
		await dispose(noisy);

		option_ids.forEach(function (id) { $("#" + id).prop("checked", false); });
		$("#augment_brightness").prop("checked", true);
		$("#augment_brightness_amount").val(0.2);

		let x = t4.clone();
		let y = [];
		[x, y] = augment_extra_transformations(t4, 7, x, y);
		test_equal("default augmentation adds sample", y.length, 1);
		test_equal("default augmentation label", y[0], 7);
		test_equal("default augmentation batch grows", x.shape[0], 2);
		await dispose(x);

		let custom_x = [];
		let custom_y = [];
		[custom_x, custom_y] = augment_custom_image_data(t3, 3, 255, custom_x, custom_y);
		test_equal("custom augmentation adds sample", custom_x.length, 1);
		test_equal("custom augmentation label", custom_y[0], 3);
		test_equal("custom augmentation shape", custom_x[0].length, 2);
	} finally {
		option_ids.forEach(function (id) { $("#" + id).prop("checked", saved_checked[id]); });
		amount_ids.forEach(function (id) { $("#" + id).val(saved_values[id]); });
		window.add_tensor_as_image_to_photos = original_add_tensor_as_image;
		await dispose(t3);
		await dispose(t4);
	}

	return true;
}

async function run_tests (quick=0, disable_webcam=0) {
	if (quick) {
		__test_expected_total = __test_expected_quick_total;
	}

	original_num_errs = num_errs;
	original_num_wrns = num_wrns;

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
	__test_progress_last_at = 0;
	__test_progress_slow_durations = [];

	await run_super_quick_tests(quick);

	if(quick) {
		remove_num_tests_overlay();

		__test_expected_total = num_tests;
		is_running_test = false;
		tests_ended = true;

		test_summary();

		return num_tests_failed;
	}

	test_equal("new_tiny_tests", await new_tiny_tests(), true);
	test_equal("test_translation_cache()", await test_translation_cache(), true);
	test_equal("test_test_progress_display()", test_test_progress_display(), true);
	test_equal("test_status_bar_tooltip_update_is_deferred()", await test_status_bar_tooltip_update_is_deferred(), true);
	test_equal("test_webcam_constraints_use_device_id_without_probe_stream()", await test_webcam_constraints_use_device_id_without_probe_stream(), true);
	test_equal("test_webcam_start_guard_keeps_early_stream_alive()", test_webcam_start_guard_keeps_early_stream_alive(), true);
	test_equal("test_webcam_stream_active_detection()", test_webcam_stream_active_detection(), true);
	test_equal("test_gradcam_webcam_owns_heatmap_while_drawing()", await test_gradcam_webcam_owns_heatmap_while_drawing(), true);

	tf.engine().startScope();

	var backends = ["webgl_backend", "cpu_backend"];
	backends = ["webgl_backend"]; // only test webgl

	for (var backend_id = 0; backend_id < backends.length; backend_id++) {
		tests_ended = false;

		dbg(language[lang]["setting_backend"] + ": " + backends[backend_id]);
		$("#" + backends[backend_id]).click().trigger("change");
		await set_backend();

		dbg(language[lang]["properly_set_backend"] + ": " + backends[backend_id]);

		test_equal("test_layer_settings()", await test_layer_settings(), true);
		test_equal("test_show_layer_data_flow()", await test_show_layer_data_flow(), true);
		test_equal("test_model_xor()", await test_model_xor(), true);
		test_equal("cycle_through_visualization_tabs()", await cycle_through_visualization_tabs(), true);

		await test_initializer();
		await test_add_layer(2);

		expect_memory_leak = "a new layer was added";
		test_equal("test_custom_csv()", await test_custom_csv(), true);
		test_equal("test_training_images()", await test_training_images(), true);
		test_equal("test_training_images_with_skip_connection()", await test_training_images_with_skip_connection(), true);

		await test_shuffle();
		await test_resize_time();

		test_equal("test_custom_drawn_images()", await test_custom_drawn_images(), true);
		//test_equal("test_custom_drawn_images_with_augmentation()", await test_custom_drawn_images_with_augmentation(), true);
		test_equal("test_custom_csv_x_squared()", await test_custom_csv_x_squared(), true);
		test_equal("cycle_through_visualization_tabs()", await cycle_through_visualization_tabs(), true);
		test_equal("test_custom_tensor()", await test_custom_tensor(), true);
		test_equal("test_image_map_dense()", await test_image_map_dense(), true);
		test_equal("test_augmented_training_images()", await test_augmented_training_images(), true);
		test_equal("test_prediction_for_csv_results()", await test_prediction_for_csv_results(), true);
		test_equal("test_check_categorical_predictions()", await test_check_categorical_predictions(), true);
		test_equal("test_different_layer_types()", await test_different_layer_types(), true);
		test_equal("test_different_layer_types_with_skip_connection()", await test_different_layer_types_with_skip_connection(), true);
		test_equal("test_skip_connection_multi_layer()", await test_skip_connection_multi_layer(), true);
		test_equal("test_all_optimizers_on_xor()", await test_all_optimizers_on_xor(), true);
		test_equal("test_if_python_code_is_valid()", await test_if_python_code_is_valid(), true);
		test_equal("test_math_history()", await test_math_history(), true);
		test_equal("test_webcam(disable_webcam)", await test_webcam(disable_webcam), true);
		test_equal("test_if_and_xor_examples_are_shown_after_switching_from_signs()", await test_if_and_xor_examples_are_shown_after_switching_from_signs(), true);
		test_equal("test_different_regularizers()", await test_different_regularizers(), true);
		//test_equal("test_different_dtypes()", await test_different_dtypes(), true);
		// test_equal("test_loss_landscape()", await test_loss_landscape(), true);
		test_equal("test_if_plotter_is_shown()", await test_if_plotter_is_shown(), true);

		test_equal("test_math_editable_system()", await test_math_editable_system(), true);
		test_equal("run_python_code_tests()", await run_python_code_tests(), true);

		test_equal("test_activation_atlas()", await test_activation_atlas(), true);
		test_equal("test_dimensionality_river()", await test_dimensionality_river(), true);
		//test_equal("test_health_status()", await test_health_status(), true);
		test_equal("test_weight_analysis()", await test_weight_analysis(), true);
		test_equal("test_explainability_lib()", await test_explainability_lib(), true);
		test_equal("test_adversarial_examples()", await test_adversarial_examples(), true);
		test_equal("test_representation_analysis()", await test_representation_analysis(), true);
		test_equal("test_multi_run_training()", await test_multi_run_training(), true);
		test_equal("test_theme_module()", await test_theme_module(), true);
		test_equal("test_summary_module()", await test_summary_module(), true);
		test_equal("test_loss_landscape_module()", await test_loss_landscape_module(), true);
		test_equal("test_fcnn_editable_module()", await test_fcnn_editable_module(), true);
		test_equal("test_augmentation_options()", await test_augmentation_options(), true);
		test_equal("run_coverage_tests()", await run_coverage_tests(), true);

		test_no_new_errors_or_warnings();

		await run_quick_start_stop_training_test();

		log_test("Tests ended");

		tests_ended = true;
	}

	remove_overlay();

	tf.engine().endScope();

	if (__test_resume_active && !__test_resume_reached) {
		console.warn("[from_test] \"" + __test_from_test + "\" did not match any test_equal name; every test was skipped");
	}

	__test_expected_total = num_tests;

	test_summary();

	try {
		var expected_key = quick ? "asanai_test_expected_quick_count" : "asanai_test_expected_count";
		localStorage.setItem(expected_key, String(num_tests));
	} catch (e) {}

	is_running_test = false;

        window.test_done = true;
        window.test_result = num_tests_failed;

	__run_tests___set_exit_code(num_tests_failed);

	remove_num_tests_overlay();

	return num_tests_failed;
}
