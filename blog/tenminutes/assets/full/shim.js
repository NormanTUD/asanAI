/* TEN MINUTES — shim for the copied transformer demo engine. */
(function () {
	"use strict";

	if (window.tf && tf.setBackend) { try { tf.setBackend("cpu"); } catch (e) {} }

	function isDark() {
		return document.documentElement.getAttribute("data-theme") === "dark";
	}
	function themeColor(color) {
		if (!color) return color;
		if (!isDark()) return color;
		var map = {
			"#fff": "#0d2a35", "#ffffff": "#0d2a35",
			"#f9fafb": "#0a222c", "#f8fafc": "#0a222c", "#f8f9ff": "#0a222c",
			"#f1f5f9": "#0a222c", "#f0f4f8": "#0a222c", "#ecfdf5": "#0d2a35",
			"#e2e8f0": "#1e3a46", "#cbd5e1": "#2c4a55", "#e5e7eb": "#1e3a46",
			"#64748b": "#9db5b5", "#475569": "#c4d8d6", "#94a3b8": "#9db5b5",
			"#0f172a": "#e9f2ee", "#1e293b": "#e9f2ee", "#334155": "#c4d8d6",
			"#000": "#e9f2ee", "#000000": "#e9f2ee"
		};
		var key = String(color).toLowerCase();
		return map[key] || color;
	}
	function escapeHtml(value) {
		return String(value == null ? "" : value)
			.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
	}
	function renderRawMath(scope) {
		if (!scope || !scope.querySelectorAll) return;
		function skipEl(el) {
			return !el || !el.closest || el.closest("script,style,code,pre,textarea,math,[data-tex],[data-no-math],.no-math");
		}
		var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null);
		var nodes = [];
		while (walker.nextNode()) nodes.push(walker.currentNode);
		nodes.forEach(function (node) {
			if (skipEl(node.parentElement)) return;
			var text = node.nodeValue;
			if (!text || text.indexOf("$") === -1) return;
			var re = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
			var match, last = 0, frag = document.createDocumentFragment(), changed = false;
			while ((match = re.exec(text))) {
				changed = true;
				if (match.index > last) frag.appendChild(document.createTextNode(text.slice(last, match.index)));
				var span = document.createElement("span");
				span.setAttribute("data-tex", match[1] != null ? match[1] : match[2]);
				span.setAttribute("data-tex-display", match[1] != null ? "true" : "false");
				frag.appendChild(span);
				last = re.lastIndex;
			}
			if (!changed) return;
			if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
			node.parentNode.replaceChild(frag, node);
		});
	}
	function render_temml(root) {
		var scope = root && root.querySelectorAll ? root : document;
		if (scope !== document) renderRawMath(scope);
		if (window.TM && TM.typesetMath) {
			TM.typesetMath(scope);
			return;
		}
		var nodes = scope.querySelectorAll("[data-tex]");
		for (var i = 0; i < nodes.length; i++) {
			var el = nodes[i];
			if (el.getAttribute("data-tex-rendered") === "1") continue;
			var tex = el.getAttribute("data-tex");
			var display = el.getAttribute("data-tex-display") !== "false";
			try {
				el.innerHTML = temml.renderToString(tex, { displayMode: display });
				el.setAttribute("data-tex-rendered", "1");
			} catch (e) {
				el.textContent = tex;
			}
		}
	}

	function tokenColor(str) {
		var hash = 0;
		for (var i = 0; i < str.length; i++) {
			hash = ((hash << 7) - hash) + str.charCodeAt(i);
			hash |= 0;
		}
		var hue = Math.abs(hash) % 360;
		var hue2 = (hue + 30) % 360;
		return {
			hue: hue,
			id: Math.abs(hash) % 10000,
			bg: "linear-gradient(135deg, hsl(" + hue + ", 70%, 42%), hsl(" + hue2 + ", 80%, 32%))",
			glow: "hsla(" + hue + ", 80%, 50%, 0.35)",
			border: "hsla(" + hue + ", 60%, 70%, 0.25)"
		};
	}
	window.Prov = window.Prov || {
		recordPre: function () {}, recordLayer: function () {}, recordFfn: function () {},
		recordFinal: function () {}, apply: function () {}, init: function () {}
	};

	window.isDarkMode = isDark;
	window.themeColor = themeColor;
	window.cssVar = function (name) {
		return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	};
	window.escapeHtml = escapeHtml;
	window.tokenColor = tokenColor;
	window.render_temml = render_temml;
	window.updateLoadingStatus = function () {};
	window.showTrainingProgressBar = function () {};
	window.hideTrainingProgressBar = function () {};
	window.updateTrainingProgressBar = function () {};

	window.add = function () { return tf.add.apply(tf, arguments); };
	window.addN = function () { return tf.addN.apply(tf, arguments); };
	window.tensor1d = function () { return tf.tensor1d.apply(tf, arguments); };
	window.tensor2d = function () { return tf.tensor2d.apply(tf, arguments); };
	window.scalar = function () { return tf.scalar.apply(tf, arguments); };
	window.tidy = function () { return tf.tidy.apply(tf, arguments); };
	window.dispose = function () {
		for (var i = 0; i < arguments.length; i++) {
			try { if (arguments[i]) arguments[i].dispose(); } catch (e) {}
		}
	};
})();
