async function _temml() {
	try {
		const elements = $(".temml_me").toArray().filter(e =>
			e.textContent.trim() &&
			!e.dataset.rendered &&
			$(e).is(":visible")
		);

		if (!elements.length) return;

		const batch_size = 20; // tune: 20 = fast + safe
		let i = 0;

		function render_batch() {
			const batch = elements.slice(i, i + batch_size);
			for (const e of batch) render_temml_quick(e);
			i += batch_size;
			if (i < elements.length)
				setTimeout(render_batch, 0); // let UI breathe
		}

		render_batch();
	} catch (e) {
		console.error("temml:", e);
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
	}
}
