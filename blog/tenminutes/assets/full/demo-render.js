/* TEN MINUTES — render raw $...$ math inside the copied transformer demos. */
(function () {
	"use strict";

	var HOSTS = [
		"transformer_config", "transformer-train-card", "transformer-output-projection",
		"ffn-equations-container", "transformer-migration-plots-container",
		"transformer-vector-math-result", "transformer-pe-integration-results",
		"tled-editor-container", "transformer-viz-embeddings", "param-breakdown-table",
		"nr_params", "show_training_sentences", "training-loss-plot"
	];

	function skip(el) {
		return !el || !el.closest || el.closest("script,style,code,pre,textarea,math,[data-tex],[data-no-math],.no-math");
	}

	function tex(source, display) {
		var span = document.createElement("span");
		span.setAttribute("data-tex", source);
		span.setAttribute("data-tex-display", display ? "true" : "false");
		return span;
	}

	function replaceInText(node, created) {
		if (skip(node.parentElement)) return;
		var text = node.nodeValue;
		if (!text || text.indexOf("$") === -1) return;
		var re = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
		var match, last = 0, frag = document.createDocumentFragment(), changed = false;
		while ((match = re.exec(text))) {
			changed = true;
			if (match.index > last) frag.appendChild(document.createTextNode(text.slice(last, match.index)));
			var span = match[1] != null ? tex(match[1], true) : tex(match[2], false);
			frag.appendChild(span);
			created.push(span);
			last = re.lastIndex;
		}
		if (!changed) return;
		if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
		node.parentNode.replaceChild(frag, node);
	}

	function walk(root, created) {
		if (!root) return;
		var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
		var nodes = [];
		while (walker.nextNode()) nodes.push(walker.currentNode);
		nodes.forEach(function (node) { replaceInText(node, created); });
	}

	function render() {
		var created = [];
		HOSTS.forEach(function (id) {
			var el = document.getElementById(id);
			if (el) walk(el, created);
		});
		if (!created.length || !window.TM || !TM.typesetMath) return;
		var seen = [];
		created.forEach(function (span) {
			var parent = span.parentNode;
			if (!parent || seen.indexOf(parent) !== -1) return;
			seen.push(parent);
			TM.typesetMath(parent);
		});
	}

	// Do not run inside the script-loading task: finish the file and let the
	// engine start first, then convert the few labels asynchronously.
	setTimeout(render, 0);
	setTimeout(render, 800);
	setTimeout(render, 2000);
})();
