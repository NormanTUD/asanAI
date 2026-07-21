"use strict";

var current_model = null;

"use strict";

(function () {
	// Override the toc() function from manual.js with an improved version
	// We wait for DOM and then rebuild the TOC
	document.addEventListener("DOMContentLoaded", function () {
		buildCollapsibleTOC();
	});

	function buildCollapsibleTOC() {
		var tocContainer = document.getElementById("toc");
		if (!tocContainer) return;

		// Inject styles
		var s = document.createElement("style");
		s.textContent = `
			#toc {
				font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
				background: #fafafa;
				border: 1px solid #e0e0e0;
				border-radius: 10px;
				margin: 24px auto;
				max-width: 900px;
				box-shadow: 0 2px 8px rgba(0,0,0,0.06);
				overflow: hidden;
			}

			#toc-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 14px 20px;
				background: #f0f4f8;
				border-bottom: 1px solid #e0e0e0;
				cursor: pointer;
				user-select: none;
				transition: background 0.2s;
			}

			#toc-header:hover {
				background: #e8eef4;
			}

			#toc-header h3 {
				margin: 0;
				font-size: 1em;
				font-weight: 600;
				color: #333;
				letter-spacing: 0.02em;
			}

			#toc-toggle-icon {
				font-size: 1.2em;
				color: #666;
				transition: transform 0.3s ease;
			}

			#toc-toggle-icon.collapsed {
				transform: rotate(-90deg);
			}

			#toc-body {
				padding: 12px 20px 16px;
				max-height: 70vh;
				overflow-y: auto;
				transition: max-height 0.4s ease, padding 0.3s ease, opacity 0.3s ease;
				opacity: 1;
			}

			#toc-body.collapsed {
				max-height: 0;
				padding-top: 0;
				padding-bottom: 0;
				opacity: 0;
				overflow: hidden;
			}

			/* Scrollbar styling */
			#toc-body::-webkit-scrollbar {
				width: 6px;
			}
			#toc-body::-webkit-scrollbar-track {
				background: transparent;
			}
			#toc-body::-webkit-scrollbar-thumb {
				background: #ccc;
				border-radius: 3px;
			}
			#toc-body::-webkit-scrollbar-thumb:hover {
				background: #aaa;
			}

			/* TOC list styling */
			#toc-body ul {
				list-style: none;
				margin: 0;
				padding: 0;
			}

			#toc-body > ul {
				padding-left: 0;
			}

			#toc-body ul ul {
				padding-left: 16px;
				border-left: 2px solid #e8e8e8;
				margin-left: 8px;
			}

			#toc-body li {
				margin: 0;
				padding: 0;
			}

			/* Collapsible section headers (h1-level items with children) */
			.toc-section {
				margin-bottom: 4px;
			}

			.toc-section-header {
				display: flex;
				align-items: center;
				gap: 6px;
				padding: 6px 8px;
				border-radius: 6px;
				cursor: pointer;
				user-select: none;
				transition: background 0.15s;
			}

			.toc-section-header:hover {
				background: #eef2f7;
			}

			.toc-section-arrow {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 18px;
				height: 18px;
				font-size: 0.7em;
				color: #888;
				transition: transform 0.25s ease;
				flex-shrink: 0;
			}

			.toc-section-arrow.collapsed {
				transform: rotate(-90deg);
			}

			.toc-section-header a {
				text-decoration: none;
				color: #1a1a2e;
				font-weight: 600;
				font-size: 0.92em;
				line-height: 1.4;
			}

			.toc-section-header a:hover {
				color: #0056b3;
				text-decoration: underline;
			}

			/* Sub-items (h2, h3, h4 level) */
			.toc-item {
				padding: 4px 8px 4px 26px;
				border-radius: 4px;
				transition: background 0.15s, transform 0.15s;
			}

			.toc-item:hover {
				background: #f4f7fa;
				transform: translateX(2px);
			}

			.toc-item a {
				text-decoration: none;
				color: #2c5282;
				font-size: 0.88em;
				line-height: 1.5;
			}

			.toc-item a:hover {
				color: #c53030;
				text-decoration: underline;
			}

			/* Depth-specific styling */
			.toc-depth-3 a {
				color: #4a6fa5;
				font-size: 0.85em;
			}

			.toc-depth-4 a {
				color: #718096;
				font-size: 0.82em;
				font-style: italic;
			}

			/* Collapsible children container */
			.toc-children {
				overflow: hidden;
				transition: max-height 0.35s ease, opacity 0.25s ease;
				opacity: 1;
			}

			.toc-children.collapsed {
				max-height: 0 !important;
				opacity: 0;
			}

			/* Active/current section highlight */
			.toc-item.active > a,
			.toc-section-header.active > a {
				background: #e3f2fd;
				border-radius: 3px;
				padding: 1px 6px;
				color: #1565c0;
			}

			/* Search/filter box */
			#toc-search-wrapper {
				padding: 8px 0 10px;
			}

			#toc-search {
				width: 100%;
				padding: 8px 12px;
				border: 1px solid #ddd;
				border-radius: 6px;
				font-size: 0.88em;
				outline: none;
				transition: border-color 0.2s, box-shadow 0.2s;
				box-sizing: border-box;
				background: #fff;
			}

			#toc-search:focus {
				border-color: #90b4d8;
				box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
			}

			#toc-search::placeholder {
				color: #aaa;
			}

			/* Expand/Collapse all controls */
			#toc-controls {
				display: flex;
				gap: 8px;
				padding: 4px 0 8px;
			}

			#toc-controls button {
				background: none;
				border: 1px solid #ddd;
				border-radius: 4px;
				padding: 3px 10px;
				font-size: 0.78em;
				color: #555;
				cursor: pointer;
				transition: background 0.15s, border-color 0.15s;
			}

			#toc-controls button:hover {
				background: #f0f4f8;
				border-color: #bbb;
			}

			/* Hide items that don't match search */
			.toc-hidden {
				display: none !important;
			}
		`;
		document.head.appendChild(s);

		// Parse headings from #contents
		var contents = document.getElementById("contents");
		if (!contents) return;

		var headings = contents.querySelectorAll("h1, h2, h3, h4");
		var tree = buildTree(headings);

		// Also inject anchors into headings (same as original toc())
		headings.forEach(function (h) {
			var anchor = h.textContent.replace(/\s+/g, "_");
			if (!h.querySelector("a[name]")) {
				var a = document.createElement("a");
				a.setAttribute("name", anchor);
				h.insertBefore(a, h.firstChild);
			}
		});

		// Build TOC HTML
		var html = '';
		html += '<div id="toc-header">';
		html += '  <h3>📖 Table of Contents</h3>';
		html += '  <span id="toc-toggle-icon">▼</span>';
		html += '</div>';
		html += '<div id="toc-body">';
		html += '  <div id="toc-search-wrapper">';
		html += '    <input type="text" id="toc-search" placeholder="Filter sections..." />';
		html += '  </div>';
		html += '  <div id="toc-controls">';
		html += '    <button id="toc-expand-all">Expand all</button>';
		html += '    <button id="toc-collapse-all">Collapse all</button>';
		html += '  </div>';
		html += '  <ul id="toc-list">';
		html += renderTree(tree, 1);
		html += '  </ul>';
		html += '</div>';

		tocContainer.innerHTML = html;

		// --- Event Listeners ---

		// Toggle entire TOC
		var tocHeader = document.getElementById("toc-header");
		var tocBody = document.getElementById("toc-body");
		var tocIcon = document.getElementById("toc-toggle-icon");

		tocHeader.addEventListener("click", function () {
			tocBody.classList.toggle("collapsed");
			tocIcon.classList.toggle("collapsed");
		});

		// Section collapse/expand
		document.querySelectorAll(".toc-section-header").forEach(function (header) {
			header.addEventListener("click", function (e) {
				// Don't toggle if clicking the link itself
				if (e.target.tagName === "A") return;

				var section = header.closest(".toc-section");
				var children = section.querySelector(".toc-children");
				var arrow = header.querySelector(".toc-section-arrow");

				if (children) {
					if (children.classList.contains("collapsed")) {
						children.style.maxHeight = children.scrollHeight + "px";
						children.classList.remove("collapsed");
						if (arrow) arrow.classList.remove("collapsed");
					} else {
						children.style.maxHeight = children.scrollHeight + "px";
						// Force reflow
						children.offsetHeight;
						children.style.maxHeight = "0";
						children.classList.add("collapsed");
						if (arrow) arrow.classList.add("collapsed");
					}
				}
			});
		});

		// Set initial max-heights for smooth animation
		document.querySelectorAll(".toc-children").forEach(function (el) {
			el.style.maxHeight = el.scrollHeight + "px";
		});

		// Expand all / Collapse all
		document.getElementById("toc-expand-all").addEventListener("click", function () {
			document.querySelectorAll(".toc-children").forEach(function (el) {
				el.style.maxHeight = el.scrollHeight + "px";
				el.classList.remove("collapsed");
			});
			document.querySelectorAll(".toc-section-arrow").forEach(function (el) {
				el.classList.remove("collapsed");
			});
		});

		document.getElementById("toc-collapse-all").addEventListener("click", function () {
			document.querySelectorAll(".toc-children").forEach(function (el) {
				el.style.maxHeight = "0";
				el.classList.add("collapsed");
			});
			document.querySelectorAll(".toc-section-arrow").forEach(function (el) {
				el.classList.add("collapsed");
			});
		});

		// Search/filter
		var searchInput = document.getElementById("toc-search");
		searchInput.addEventListener("input", function () {
			var query = this.value.toLowerCase().trim();
			var allItems = document.querySelectorAll("#toc-list li");

			if (!query) {
				// Show everything
				allItems.forEach(function (li) {
					li.classList.remove("toc-hidden");
				});
				document.querySelectorAll(".toc-children").forEach(function (el) {
					el.style.maxHeight = el.scrollHeight + "px";
					el.classList.remove("collapsed");
				});
				document.querySelectorAll(".toc-section-arrow").forEach(function (el) {
					el.classList.remove("collapsed");
				});
				return;
			}

			// Hide all first
			allItems.forEach(function (li) {
				var link = li.querySelector("a");
				var text = link ? link.textContent.toLowerCase() : "";
				if (text.includes(query)) {
					li.classList.remove("toc-hidden");
					// Show all parents
					var parent = li.parentElement;
					while (parent && parent.id !== "toc-list") {
						if (parent.tagName === "LI") {
							parent.classList.remove("toc-hidden");
						}
						if (parent.classList && parent.classList.contains("toc-children")) {
							parent.style.maxHeight = "none";
							parent.classList.remove("collapsed");
						}
						parent = parent.parentElement;
					}
				} else {
					li.classList.add("toc-hidden");
				}
			});

			// Expand all sections to show results
			document.querySelectorAll(".toc-section-arrow").forEach(function (el) {
				el.classList.remove("collapsed");
			});
		});
	}

	// Build a tree structure from flat heading list
	function buildTree(headings) {
		var root = { children: [], level: 0 };
		var stack = [root];

		headings.forEach(function (h) {
			var level = parseInt(h.tagName.charAt(1));
			var text = h.textContent.trim();
			var anchor = text.replace(/\s+/g, "_");

			var node = {
				text: text,
				anchor: anchor,
				level: level,
				children: []
			};

			// Pop stack until we find a parent with a lower level
			while (stack.length > 1 && stack[stack.length - 1].level >= level) {
				stack.pop();
			}

			stack[stack.length - 1].children.push(node);
			stack.push(node);
		});

		return root.children;
	}

	// Render tree to HTML
	function renderTree(nodes, depth) {
		var html = '';

		nodes.forEach(function (node) {
			var hasChildren = node.children && node.children.length > 0;

			if (hasChildren && depth <= 2) {
				// Render as collapsible section
				html += '<li class="toc-section">';
				html += '  <div class="toc-section-header">';
				html += '    <span class="toc-section-arrow">▼</span>';
				html += '    <a href="#' + node.anchor + '">' + node.text + '</a>';
				html += '  </div>';
				html += '  <div class="toc-children">';
				html += '    <ul>';
				html += renderTree(node.children, depth + 1);
				html += '    </ul>';
				html += '  </div>';
				html += '</li>';
			} else if (hasChildren) {
				// Deeper sections: render inline with children
				html += '<li class="toc-item toc-depth-' + depth + '">';
				html += '  <a href="#' + node.anchor + '">' + node.text + '</a>';
				html += '  <ul>';
				html += renderTree(node.children, depth + 1);
				html += '  </ul>';
				html += '</li>';
			} else {
				// Leaf node
				html += '<li class="toc-item toc-depth-' + depth + '">';
				html += '  <a href="#' + node.anchor + '">' + node.text + '</a>';
				html += '</li>';
			}
		});

		return html;
	}
})();

async function get_network_type_result_by_array (layer_type, _array, config, expand_dims=1, uuid) {
	assert(typeof(layer_type) == "string", "Layer type must be string, is " + typeof(layer_type));

	var _tensor = tensor(_array);
	config["inputShape"] = _tensor.shape;
	var layer = null;
	var reg = ["bias", "kernel", "depthwise", "pointwise"];

	for (var reg_idx = 0; reg_idx < reg.length; reg_idx++) {
		var type = reg[reg_idx];
		if(Object.keys(config).includes(type + "Regularizer")) {
			if(config[type + "Regularizer"].hasL1 && config[type + "Regularizer"].hasL2) {
				let cfg = {"className": "L1L2", config: { "l1": config[type + "Regularizer"]["l1"], "l2": config[type + "Regularizer"]["l2"], hasL1: true, hasL2: true }};
				config[type + "Regularizer"] = cfg;
			} else if(config[type + "Regularizer"].hasL1 && !config[type + "Regularizer"].hasL2) {
				let cfg = {"className": "L1", config: { "l1": config[type + "Regularizer"]["l1"], hasL1: true, hasL2: false }};
				config[type + "Regularizer"] = cfg;
			} else if(!config[type + "Regularizer"].hasL1 && config[type + "Regularizer"].hasL2) {
				let cfg = {"className": "L1L2", config: { "l1": 0.01, "l2": config[type + "Regularizer"]["l2"], hasL1: false, hasL2: true }};
				config[type + "Regularizer"] = cfg;
			} else {
				delete config[type + "Regularizer"];
			}
		}

		if(Object.keys(config).includes(type + "Constraint")) {
			if(config[type + "Constraint"] == "") {
				delete config[type + "Constraint"];
			}
		}
	}

	var kwargs = {};

	if($("#" + uuid + "_is_training").length && $("#" + uuid + "_is_training").is(":checked")) {
		kwargs = {
			training: true
		};
	}

	try {
		eval("layer = tf.layers." + layer_type + "(config)");
		$("#" + uuid + "_error").html("");
	} catch (e) {
		$("#" + uuid + "_error").html(e);
		wrn(e);
		output_shape = input_shape;
	}

	var input_shape, output_shape;

	if(layer) {
		if(expand_dims) {
			_tensor = _tensor.expandDims();
		}

		var res;

		try {
			input_shape = _tensor.shape;
			var tensor_res = await layer.apply(_tensor, kwargs);
			res = array_sync(tensor_res);
			output_shape = tensor_res.shape;
			$("#" + uuid + "_error").html("");
		} catch (e) {
			void(0); log(" !!! Failed applying:", e);
			$("#" + uuid + "_error").html(e);
			res = [e, e];
			output_shape = input_shape;
		}
	} else {
		err("[get_network_type_result_by_array] layer is empty");
	}

	return [res, layer, input_shape, output_shape];
}

function looks_like_number(item) {
	if(Number.isNaN(item)) {
		return false;
	}

	if(typeof(item) == "number") {
		return true;
	}

	if (/^[+-]?(?:(?:\d+(?:\.\d+)?))$/.test(item)) {
		return true;
	}

	return false;
}

function get_element (item) {
	if($(item).is(":checkbox")) {
		return $(item).is(":checked");
	} else if ($(item).is("input")) {
		if(
			$(item).hasClass("poolSize") ||
			$(item).hasClass("kernelSize") ||
			$(item).hasClass("dilationRate") ||
			$(item).hasClass("kernelSize") ||
			$(item).hasClass("strides") ||
			$(item).hasClass("size")
		) {
			var str = $(item).val();
			var values = str.split(/\s*,\s*/);
			values = values.map(function (x) {
				if(looks_like_number(x)) {
					return parse_int(x);
				} else {
					err(`${x} does not look like a number (type: ${typeof(x)})`);
					return null;
				}
			});

			return values;
		} else if ($(item).hasClass("rate") || $(item).hasClass("stddev")) {
			return parse_float($(item).val());
		} else {
			var new_nr = $(item).val();
			if(looks_like_number(new_nr)) {
				return parse_int(new_nr);
			} else {
				err(`${new_nr} does not look like a number (type: ${typeof(new_nr)})`);
				console.log("item:", item);
				return null;
			}
		}
	} else if ($(item).is("select")) {
		return $(item).val();
	}
}

function add_table (layer_type, config, onchange, uuid) {
	var this_layer_options = layer_options[layer_type]["options"];
	var rows = []; // Use an array for cleaner string building
	var on_change = "eval_base64(\"" + onchange + "\", \"" + uuid + "\")";
	var events = "onchange='" + on_change + "' oninput='" + on_change + "'";

	for (var layer_option_idx = 0; layer_option_idx < this_layer_options.length; layer_option_idx++) {
		var layer_option = this_layer_options[layer_option_idx];
		if(["trainable", "dtype", "visualize"].includes(layer_option)) continue;

		let label = python_names_to_js_names[layer_option] || layer_option;
		let input_html = "";

		/*
		if(layer_option.endsWith("regularizer")) {
			input_html = "<select onchange='" + on_change + "' class='gui_option " + label + "'>";
			var regularizer_keys = Object.keys(regularizer_options);
			for (let k = 0; k < regularizer_keys.length; k++) {
				let selected = "";
				if(Object.keys(config).includes(label)) {
					var cfg_itm = config[label];
					if(cfg_itm.hasL1 && cfg_itm.hasL2 && regularizer_keys[k] == "l1l2") selected = "selected";
					else if(cfg_itm.hasL1 && !cfg_itm.hasL2 && regularizer_keys[k] == "l1") selected = "selected";
					else if(!cfg_itm.hasL1 && cfg_itm.hasL2 && regularizer_keys[k] == "l2") selected = "selected";
				}
				input_html += "<option " + selected + " value='" + regularizer_keys[k] + "'>" + regularizer_keys[k] + "</option>";
			}
			input_html += "</select>";

		} else */

		if(["strides", "pool_size", "size", "kernel_size", "dilation_rate"].some(s => layer_option.includes(s))) {
			let val = config[label] || config[layer_option];
			if(Array.isArray(val)) val = val.join(",");
			input_html = "<input " + events + " class='gui_option " + label + "' type='text' value='" + val + "' />";

		} else if(["dropout_rate", "stddev", "rate", "depth_multiplier"].some(s => layer_option.includes(s))) {
			let val = config.rate || config.stddev || config.depthMultiplier || 0.5;
			input_html = "<input " + events + " class='gui_option " + (layer_option === "dropout_rate" ? "rate" : layer_option) + "' type='number' min=0 step='0.05' max=1 value='" + val + "' />";

		} else if(layer_option.endsWith("filters")) {
			input_html = "<input " + events + " class='gui_option " + label + "' type='number' min=1 step=1 value='" + config.filters + "' />";

		} else if(layer_option.endsWith("use_bias")) {
			input_html = "<input " + events + " class='gui_option " + label + "' type='checkbox' " + (config.useBias ? "checked" : "") + " />";

		} else if(["activation", "interpolation", "padding", "initializer"].some(s => layer_option.endsWith(s))) {
			let options_map = { activation: activations, interpolation: interpolation, constraint: constraints, padding: padding_options, initializer: initializer_options };
			let key = Object.keys(options_map).find(k => layer_option.endsWith(k));

			delete options_map["initializer"]["orthogonal"];
			delete options_map["initializer"]["constant"];

			input_html = "<select " + events + " class='gui_option " + label + "'>";
			Object.keys(options_map[key]).forEach(opt => {
				if(key === "initializer" && opt === "identity") return;
				let selected = (config[label] == opt || config[layer_option] == opt) ? "selected" : "";
				input_html += "<option " + selected + " value='" + opt + "'>" + opt + "</option>";
			});
			input_html += "</select>";
		}

		if (input_html) {
			rows.push("<tr><td>" + label + "</td><td>" + input_html + "</td></tr>");
		}
	}

	if(layer_type.includes("ropout") || layer_type.includes("oise")) {
		rows.push("<tr><td>is_training</td><td><input type='checkbox' " + events + " id='" + uuid + "_is_training' checked='checked' /></td></tr>");
	}

	$("#" + uuid + "_layer_gui").html(rows.join(''));
	eval_base64(onchange, uuid);
}

function eval_base64 (b, uuid) {
	try {
		var code = atob(b);
		eval(code);
		$("#" + uuid + "_error").html("");
	} catch (e) {
		void(0); log("" + e);
		$("#" + uuid + "_error").html(e);
	}

}

function add_html_for_layer_types (layer_type) {
	var div_to_add_to = layer_type + "_example";
	var uuid = uuidv4();
	var base_img_id = uuid + "_" + "base_img";
	var internal_canvasses_id = uuid + "_internal_canvasses";
	var out_canvasses_id = uuid + "_out_canvasses";
	var kernel_canvasses_id = uuid + "_kernel_canvasses";
	var shapes_id = uuid + "_shapes";

	var onchange_code = btoa(`simulate_layer_on_image("${base_img_id}", "${internal_canvasses_id}", "${out_canvasses_id}", "${layer_type}", "${uuid}");`);

	var html = `
	<div class="layer-visual-container" style="overflow-y: clip; display: flex; align-items: center; gap: 8px; min-height: 120px; overflow-x: auto; white-space: nowrap;">
	    <div class="math-group input_data" style="display: flex; align-items: center; flex-shrink: 0;">
		<span class="bracket" style="font-size: 100px; font-family: serif; line-height: 1;">[</span>
		<img id="${base_img_id}" src="manual/example.jpg" style="height: 100px; width: auto; border-radius: 4px;">
		<span class="bracket" style="font-size: 100px; font-family: serif; line-height: 1;">]</span>
		
		<div id="${kernel_canvasses_id}" style="display: none; align-items: center;">
		    <span style="font-size: 30px; padding: 0 10px;">&sdot;</span>
		    <span class="bracket" style="font-size: 100px; font-family: serif; line-height: 1;">[</span>
		    <div id="${internal_canvasses_id}" style="display: flex; gap: 4px; align-items: center;"></div>
		    <span class="bracket" style="font-size: 100px; font-family: serif; line-height: 1;">]</span>
		</div>
	    </div>

	    <span style="font-size: 40px; padding: 0 10px; flex-shrink: 0;">&rarr;</span>

	    <div class="math-group output_data" style="display: flex; align-items: center; flex-shrink: 0;">
		<span class="bracket">[</span>
		<div id="${out_canvasses_id}" style="display: flex; gap: 4px; align-items: center;">
		    </div>
		<span class="bracket">]</span>
	    </div>
	</div>
	<div id="${shapes_id}" style="font-family: monospace; font-size: 14px; background: #f0f0f0; padding: 4px 8px; display: inline-block; border-radius: 4px;"></div>
	<div class='error_msg' id="${uuid}_error"></div>
	<table id="${uuid}_layer_gui"></table>`;

	$("#" + div_to_add_to).html(html);
	add_table(layer_type, window["default_config_" + layer_type] || {}, onchange_code, uuid);
}

async function simulate_layer_on_image (img_element_id, internal_canvas_div_id, out_canvas_div_id, layer_type, uuid) {
	tf.engine().startScope();

	var img_element = $("#" + img_element_id)[0];
	if (!img_element) return;

	// Show loading indicator
	var shapesEl = document.getElementById(uuid + "_shapes");
	if (shapesEl) shapesEl.innerHTML = '<span style="color:#888; font-style:italic;">Processing...</span>';

	if (!img_element.complete || img_element.naturalWidth === 0) {
		img_element.onload = function() {
			simulate_layer_on_image(img_element_id, internal_canvas_div_id, out_canvas_div_id, layer_type, uuid); // await not possible
		};
		return;
	}

	try {
		var img = fromPixels(img_element);
		img = img.div(255);

		var config = {};
		var options = $("#" + uuid + "_layer_gui").find(".gui_option");

		for (var option_idx = 0; option_idx < options.length; option_idx++) {
			var this_option = options[option_idx];
			var classes = this_option.className.split(/\s+/);
			var element = classes.find(c => c !== "gui_option");
			if (element) config[element] = get_element(this_option);
		}

		var res = await get_network_type_result_by_array(layer_type, array_sync(img), config, 1, uuid);

		if(res && res.length >= 4) {
			var result = res[0];
			var layer = res[1];
			if (!Array.isArray(res) || !Array.isArray(res[2]) || !Array.isArray(res[3])) {
				throw new TypeError(
					"Invalid settings detected"
				);
			}

			var input_shape = res[2].join(",");
			var output_shape = res[3].join(",");

			const height = res[3][1];
			const width = res[3][2];

			$("#" + uuid + "_error").html("");
			$("#" + uuid + "_shapes").html(`\\( \\text{Shape: } [${input_shape}] \\rightarrow [${output_shape}] \\)`);

			if (window.MathJax && MathJax.typesetPromise) {
				MathJax.typesetPromise([document.getElementById(uuid + "_shapes")]).catch((err) => console.log(err));
			}

			if(result) {
				var _tensor = tensor(result);
				_tensor = _tensor.transpose([3, 1, 2, 0]);

				$("#" + internal_canvas_div_id).html("");
				var out_canvas_div = $("#" + out_canvas_div_id).html("");

				if(layer && layer.kernel && layer.kernel.val) {
					$("#" + uuid + "_kernel_canvasses").css("display", "flex"); 

					var layer_kernel_tensor = layer.kernel.val.transpose([3, 2, 1, 0]);
					var layer_kernel = array_sync(layer_kernel_tensor);

					var internal_canvas_div = $("#" + internal_canvas_div_id).html("");

					for (var f = 0; f < layer_kernel_tensor.shape[0]; f++) {
						for (var c = 0; c < layer_kernel_tensor.shape[1]; c++) {
							let id = uuidv4();
							$("<canvas class='kernel_images' id='" + id + "' style='height:80px; width:auto;'></canvas>").appendTo(internal_canvas_div);
							const elem = document.getElementById(id);
							draw_grid(elem, kernel_pixel_size, layer_kernel[f][c], 1, 1);
						}
					}
				}

				// Output visualization with fade-in
				var min = tf.min(_tensor);
				var max = tf.max(_tensor);
				var normalized = tf.div(tf.sub(_tensor, min), tf.sub(max, min).add(1e-5));
				var norm_data = array_sync(normalized);

				out_canvas_div.html("");
				for (var t_idx = 0; t_idx < _tensor.shape[0]; t_idx++) {
					let id = uuidv4();
					$("<canvas class='out_images' id='" + id + "' style='opacity:0; transition:opacity 0.3s;'></canvas>").appendTo(out_canvas_div);
					const elem = document.getElementById(id);
					await toPixels(tensor(norm_data[t_idx]), elem);
					// Fade in after rendering
					requestAnimationFrame(function() { elem.style.opacity = '1'; });
				}
			}
		}
	} catch (e) {
		console.error(e);
		$("#" + uuid + "_error").html(e.message || e);
	}

	tf.engine().endScope();
}

// ─── Lightbox ───────────────────────────────────────────────────────────────
function openLightbox(src) {
	var overlay = document.getElementById('lightbox');
	var img = document.getElementById('lightbox-img');
	if (!overlay || !img) return;
	img.src = src;
	overlay.classList.add('active');
}
function closeLightbox() {
	var overlay = document.getElementById('lightbox');
	if (overlay) overlay.classList.remove('active');
}
document.addEventListener('keydown', function(e) {
	if (e.key === 'Escape') closeLightbox();
});
function initLightbox() {
	document.querySelectorAll('#contents img').forEach(function(img) {
		if (img.closest('.layer-visual-container') || img.closest('.interactive-demo')) return;
		img.style.cursor = 'zoom-in';
		img.addEventListener('click', function(e) {
			e.stopPropagation();
			openLightbox(this.src);
		});
	});
}

// ─── TOC Scroll-Spy ─────────────────────────────────────────────────────────
function initScrollSpy() {
	var tocLinks = document.querySelectorAll('#toc a');
	if (!tocLinks.length) return;
	var headings = [];
	tocLinks.forEach(function(link) {
		var name = link.getAttribute('href');
		if (name && name.startsWith('#')) {
			var anchor = document.querySelector("a[name='" + name.substring(1) + "']");
			if (anchor) headings.push({ el: anchor.parentElement || anchor, link: link });
		}
	});
	if (!headings.length) return;
	function onScroll() {
		var scrollY = window.scrollY + 60;
		var current = headings[0];
		for (var i = 0; i < headings.length; i++) {
			if (headings[i].el.offsetTop <= scrollY) current = headings[i];
		}
		tocLinks.forEach(function(l) { l.style.background = ''; l.style.borderRadius = ''; l.style.padding = ''; });
		if (current) {
			current.link.style.background = '#e3f2fd';
			current.link.style.borderRadius = '3px';
			current.link.style.padding = '2px 6px';
		}
	}
	var ticking = false;
	window.addEventListener('scroll', function() {
		if (!ticking) { requestAnimationFrame(function() { onScroll(); ticking = false; }); ticking = true; }
	});
	onScroll();
}

// ─── Layer Simulation: Re-randomize & Reset ─────────────────────────────────
function addLayerSimButtons(uuid, layer_type, onchange_code) {
	var container = document.getElementById(uuid + '_layer_gui');
	if (!container) return;
	var btnRow = document.createElement('div');
	btnRow.style.cssText = 'display:flex; gap:8px; margin-top:8px;';
	
	var rerandBtn = document.createElement('button');
	rerandBtn.textContent = 'Re-randomize';
	rerandBtn.style.cssText = 'background:#7e57c2; color:#fff; border:none; border-radius:4px; padding:5px 12px; cursor:pointer; font-size:0.85em;';
	rerandBtn.addEventListener('click', function() { eval_base64(onchange_code, uuid); });
	btnRow.appendChild(rerandBtn);
	
	var resetBtn = document.createElement('button');
	resetBtn.textContent = 'Reset to defaults';
	resetBtn.style.cssText = 'background:#78909c; color:#fff; border:none; border-radius:4px; padding:5px 12px; cursor:pointer; font-size:0.85em;';
	resetBtn.addEventListener('click', function() {
		var defaultCfg = window["default_config_" + layer_type] || {};
		var guiOpts = container.querySelectorAll('.gui_option');
		guiOpts.forEach(function(opt) {
			var classes = opt.className.split(/\s+/);
			var key = classes.find(function(c) { return c !== 'gui_option'; });
			if (!key) return;
			var val = defaultCfg[key];
			if (val === undefined) return;
			if (opt.type === 'checkbox') {
				opt.checked = !!val;
			} else if (opt.tagName === 'SELECT') {
				opt.value = val;
			} else {
				opt.value = Array.isArray(val) ? val.join(',') : val;
			}
		});
		eval_base64(onchange_code, uuid);
	});
	btnRow.appendChild(resetBtn);
	container.parentNode.insertBefore(btnRow, container.nextSibling);
}

// Wrap existing add_html_for_layer_types to inject buttons
var _orig_add_html = typeof add_html_for_layer_types === 'function' ? add_html_for_layer_types : null;
var _orig_add_table = typeof add_table === 'function' ? add_table : null;

// Patch add_table to add buttons after it runs
var _last_layer_type = '';
var _last_onchange = '';
var _last_uuid = '';
var _orig_add_table_fn = add_table;
add_table = function(layer_type, config, onchange, uuid) {
	_orig_add_table_fn(layer_type, config, onchange, uuid);
	_last_layer_type = layer_type;
	_last_onchange = onchange;
	_last_uuid = uuid;
	setTimeout(function() { addLayerSimButtons(uuid, layer_type, onchange); }, 50);
};

// ─── Init All ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
	initLightbox();
	initScrollSpy();
});

function lazy_load_layer_html(layer_type) {
	const targetId = layer_type + "_example";
	const targetElement = document.getElementById(targetId);

	if (!targetElement) return;

	const observer = new IntersectionObserver((entries, observer) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				// Execute the heavy function
				add_html_for_layer_types(layer_type);

				// Stop observing once loaded to prevent re-execution
				observer.unobserve(entry.target);
				console.log(`Lazy-loaded: ${layer_type}`);
			}
		});
	}, {
		rootMargin: "100px" // Start loading 100px before it enters the screen for smoothness
	});

	observer.observe(targetElement);
}

[
	"conv2d", "upSampling2d", "maxPooling2d", "averagePooling2d", 
	"alphaDropout", "dropout", "gaussianDropout", "gaussianNoise", 
	"conv2dTranspose", "separableConv2d", "depthwiseConv2d"
].forEach(lazy_load_layer_html);
