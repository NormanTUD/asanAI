/* TEN MINUTES — render raw $...$ math inside the copied transformer demos. */
(function () {
	"use strict";

	function skip(el) {
		return !el || !el.closest || el.closest("script,style,code,pre,textarea,math,[data-tex],[data-no-math],.no-math");
	}

	function tex(el, source, display) {
		var span = document.createElement("span");
		span.setAttribute("data-tex", source);
		if (display) span.setAttribute("data-tex-display", "true");
		else span.setAttribute("data-tex-display", "false");
		return span;
	}

	function replaceInText(node) {
		if (skip(node.parentElement)) return false;
		var text = node.nodeValue;
		if (!text || text.indexOf("$") === -1) return false;
		var re = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
		var match, last = 0, frag = document.createDocumentFragment(), changed = false;
		while ((match = re.exec(text))) {
			changed = true;
			if (match.index > last) frag.appendChild(document.createTextNode(text.slice(last, match.index)));
			if (match[1] != null) frag.appendChild(tex(node, match[1], true));
			else frag.appendChild(tex(node, match[2], false));
			last = re.lastIndex;
		}
		if (!changed) return false;
		if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
		node.parentNode.replaceChild(frag, node);
		return true;
	}

	function walk(root) {
		if (!root) return false;
		var changed = false;
		var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
		var nodes = [];
		while (walker.nextNode()) nodes.push(walker.currentNode);
		nodes.forEach(function (node) { if (replaceInText(node)) changed = true; });
		return changed;
	}

	function render() {
		var changed = false;
		try {
			changed = walk(document.getElementById("transformer_site") || document.body);
			// The demos are distributed across sections; also cover the known demo hosts.
			[
				"transformer_config", "transformer-train-card", "transformer-output-projection",
				"ffn-equations-container", "transformer-migration-plots-container",
				"transformer-vector-math-result", "transformer-pe-integration-results",
				"tled-editor-container", "transformer-viz-embeddings", "param-breakdown-table",
				"nr_params", "show_training_sentences", "transformer_layer_summary"
			].forEach(function (id) {
				var el = document.getElementById(id);
				if (el && walk(el)) changed = true;
			});
			if (changed && window.TM && TM.typesetMath) TM.typesetMath(document.body);
		} catch (e) {}
	}

	var timer = null;
	function schedule() {
		if (timer) return;
		timer = setTimeout(function () { timer = null; render(); }, 300);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", render);
	} else {
		render();
	}
	var observer = new MutationObserver(schedule);
	observer.observe(document.body, { childList: true, subtree: true });
	window.addEventListener("load", render);
})();
