"use strict";

let _temml_running = false;
let _temml_queued = false;

function _temml() {
	if (_temml_running) {
		_temml_queued = true;
		return;
	}

	_temml_running = true;
	_temml_queued = false;

	try {
		const elements = $(".temml_me").toArray().filter(e =>
			e.textContent.trim() &&
			!e.dataset.rendered &&
			$(e).is(":visible")
		);

		if (!elements.length) {
			_temml_running = false;
			if (_temml_queued) {
				_temml_queued = false;
				setTimeout(_temml, 0);
			}
			return;
		}

		const batch_size = 20;
		let i = 0;

		function render_batch() {
			const batch = elements.slice(i, i + batch_size);
			for (const e of batch) render_temml_quick(e);
			i += batch_size;
			if (i < elements.length) {
				setTimeout(render_batch, 0);
			} else {
				_temml_running = false;
				if (_temml_queued) {
					_temml_queued = false;
					setTimeout(_temml, 0);
				}
			}
		}

		render_batch();
	} catch (e) {
		console.error("temml:", e);
		_temml_running = false;
		if (_temml_queued) {
			_temml_queued = false;
			setTimeout(_temml, 0);
		}
	}
}

function render_temml_quick(e) {
	const $e = $(e);
	const latex = e.textContent.trim();
	if (!latex) return;

	try {
		const tmp = document.createElement("span");
		temml.render(latex, tmp);
		e.innerHTML = tmp.innerHTML;
		e.dataset.rendered = "1";
		e.dataset.latex = latex;
		$e.off("contextmenu.temml").on("contextmenu.temml", ev => {
			ev.preventDefault();
			create_centered_window_with_text(latex);
		});
	} catch (err) {
		console.warn("temml error:", err);
		console.warn(latex);
	}
}
