async function _temml() {
	try {
		$(".temml_me").each(async (i, e) => {
			await process_temml_element(e);
		});
	} catch (e) {
		wrn("" + e);
	}
}

async function process_temml_element(e) {
	const $e = $(e);
	if (should_skip_element($e, e)) return;

	try {
		await wait_for_no_blocker();
		add_blocker();

		const original_latex = e.textContent.trim();
		const { old_width, old_height } = measure_element_size($e);

		prepare_placeholder($e, old_width, old_height);
		const tmp_element = create_tmp_element();

		await render_if_needed($e, tmp_element, original_latex);
		cleanup_tmp_element(tmp_element);

		attach_context_menu($e, original_latex);
		reset_element_size($e);

		remove_blocker();
	} catch (_err) {
		wrn("" + _err);
		remove_blocker();
		reset_element_size($e);
	}
}

function should_skip_element($e, e) {
	return $e.attr("data-rendered") == 1 || !$e.is(":visible") || !e.textContent;
}

async function wait_for_no_blocker() {
	while ($("#temml_blocker").length) await delay(10);
}

function add_blocker() {
	$("<span id='temml_blocker' style='display:none'></span>").appendTo("body");
}

function remove_blocker() {
	$("#temml_blocker").remove();
}

function measure_element_size($e) {
	return {
		old_width: $e.outerWidth(),
		old_height: $e.outerHeight(),
	};
}

function prepare_placeholder($e, width, height) {
	$e.css({ width, height, display: "inline-block" });
	$e.html(`<div class="spinner" style="width:${width}px;height:${height}px"></div>`);
}

function create_tmp_element() {
	return $("<span id='tmp_equation' style='display:none'></span>").appendTo("body");
}

async function render_if_needed($e, tmp_element, original_latex) {
	if ($e.attr("data-latex") === original_latex && $e.attr("data-rendered") == 1) return;

	temml.render(original_latex, tmp_element[0]);
	const rendered_html = tmp_element.html();

	$e.html(rendered_html)
		.attr("data-rendered", 1)
		.attr("data-latex", original_latex);
}

function cleanup_tmp_element(tmp_element) {
	tmp_element.remove();
}

function attach_context_menu($e, original_latex) {
	$e.on("contextmenu", ev => {
		ev.preventDefault();
		create_centered_window_with_text(original_latex);
	});
}

function reset_element_size($e) {
	$e.css({ width: "", height: "" });
}

