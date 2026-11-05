/* TEN MINUTES — render raw $...$ math inside the copied transformer demos. */
(function () {
	"use strict";

	var HOSTS = [
		"transformer_config", "transformer-train-card", "transformer-output-projection",
		"ffn-equations-container", "transformer-migration-plots-container",
		"transformer-vector-math-result", "transformer-pe-integration-results",
		"tled-editor-container", "transformer-viz-embeddings", "param-breakdown-table",
		"nr_params", "show_training_sentences", "training-loss-plot",
		"transformer-temperature-block"
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


	/* Position glossary tooltips inside the viewport instead of letting
	   them spill out of the train card. */
	function hideGlossaryTips() {
		document.querySelectorAll(".glossary-tooltip").forEach(function (tip) {
			tip.style.display = "none";
		});
	}
	function placeGlossaryTip(term) {
		var tip = term.querySelector(".glossary-tooltip");
		if (!tip) return;
		tip.style.display = "block";
		tip.style.position = "fixed";
		tip.style.visibility = "hidden";
		tip.style.left = "0px";
		tip.style.top = "0px";
		var r = term.getBoundingClientRect();
		var tw = tip.offsetWidth, th = tip.offsetHeight;
		var left = Math.max(8, Math.min(r.left + r.width / 2 - tw / 2, window.innerWidth - tw - 8));
		var top = r.top - th - 8;
		if (top < 8) top = r.bottom + 8;
		tip.style.left = left + "px";
		tip.style.top = top + "px";
		tip.style.visibility = "visible";
	}
	document.addEventListener("mouseover", function (e) {
		var term = e.target.closest && e.target.closest(".glossary-term");
		if (term) placeGlossaryTip(term);
	});
	document.addEventListener("mouseout", function (e) {
		var term = e.target.closest && e.target.closest(".glossary-term");
		if (!term) return;
		if (e.relatedTarget && term.contains(e.relatedTarget)) return;
		var tip = term.querySelector(".glossary-tooltip");
		if (tip) tip.style.display = "none";
	});
	document.addEventListener("focusin", function (e) {
		var term = e.target.closest && e.target.closest(".glossary-term");
		if (term) placeGlossaryTip(term);
	});
	document.addEventListener("focusout", hideGlossaryTips);
	window.addEventListener("scroll", hideGlossaryTips, { passive: true });
	window.addEventListener("resize", hideGlossaryTips);

	// Do not run inside the script-loading task: finish the file and let the
	// engine start first, then convert the few labels asynchronously.
	setTimeout(render, 0);
	setTimeout(render, 800);
	setTimeout(render, 2000);
})();
