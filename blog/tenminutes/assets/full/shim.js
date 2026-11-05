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
	var TM_TEX_MAP = {
		"attention weight": "Attention-Gewicht",
		"weight": "Gewicht",
		"Value vector": "Value-Vektor",
		"of token": "von Token",
		"of token ": "von Token ",
		"Attention Weights": "Attention-Gewichte",
		"rows": "Zeilen",
		"cols": "Spalten",
		"query": "Query",
		"key": "Key",
		"head": "Head",
		"Output of attention sublayer": "Ausgabe der Attention-Unterschicht",
		"Projected attention output": "Projizierte Attention-Ausgabe",
		"Output Projection Matrix": "Ausgabeprojektionsmatrix",
		"Concatenated head contexts": "Konkatenierte Head-Kontexte",
		"emb. + PE": "Embedding + PE",
		"after attn residual": "nach Attention-Residual",
		"after W^O proj": "nach W^O-Projektion",
		"concat heads": "konkatenierte Heads",
		"after LN": "nach LN",
		"after LN₂": "nach LN₂",
		"after GELU": "nach GELU",
		"FFN output": "FFN-Ausgabe",
		"layer output": "Schicht-Ausgabe",
		"Layer output": "Schicht-Ausgabe",
		"Normalized input": "Normalisierte Eingabe",
		"Hidden layer (expanded)": "Versteckte Schicht (expandiert)",
		"FFN output (compressed)": "FFN-Ausgabe (komprimiert)",
		"Activation": "Aktivierung",
		"Expansion": "Expansion",
		"Weight Matrix": "Gewichtsmatrix",
		"Expansion Bias": "Expansions-Bias",
		"Compression": "Kompression",
		"Compression Bias": "Kompressions-Bias",
		"Learnable": "Lernbar",
		"Scale Parameter": "Skalierungsparameter",
		"Shift Parameter": "Verschiebungsparameter",
		"Hadamard": "Hadamard",
		"Product": "Produkt",
		"Mean of ": "Mittelwert von ",
		"Variance of ": "Varianz von ",
		"Parameter": "Parameter",
		"words": "Wörter",
		"word": "Wort",
		"word probabilities": "Wortwahrscheinlichkeiten",
		"Raw score": "Roher Score",
		"for word ": "für Wort ",
		"Temperature": "Temperatur",
		"flattens": "flacht ab",
		" flattens": " flacht ab",
		"sharpens": "schärft",
		" sharpens": " schärft",
		"probability": "Wahrscheinlichkeit",
		"Scaled": "Skalierte",
		"Original": "Ursprüngliche",
		"Change from": "Änderung durch",
		"scaling": "Skalierung",
		"Entropy of": "Entropie der",
		"unscaled distribution": "ungeskalierten Verteilung",
		"Entropy after": "Entropie nach",
		"temperature scaling": "Temperatur-Skalierung",
		"Maximum possible entropy": "Maximal mögliche Entropie",
		"uniform distribution": "Gleichverteilung",
		"over all": "über alle",
		"bits": "Bits",
		"Total ": "Gesamt ",
		"one tiny decoder block, repeated": "ein winziger Decoder-Block, wiederholt",
		"cross-entropy loss": "Cross-Entropy-Loss",
		"Adam update": "Adam-Update",
		"what the Train button does": "was der Trainieren-Button macht"
	};
	function tmTranslateTex(tex) {
		if (!(window.TM && TM.lang && TM.lang() === "de")) return tex;
		return String(tex).replace(/\\text\{([^{}]*)\}/g, function (match, label) {
			return TM_TEX_MAP[label] ? "\\text{" + TM_TEX_MAP[label] + "}" : match;
		})
			.replace(/\\text\{out layer (\d+)\}/g, "\\text{Ausgabe Schicht $1}")
			.replace(/\\text\{hidden dim (\d+)\}/g, "\\text{Hidden-Dimension $1}")
			.replace(/\\text\{(\d+) words\}/g, "\\text{$1 Wörter}")
			.replace(/\\text\{\(Temperature = 1\)\}/g, "\\text{(Temperatur = 1)}")
			.replace(/\\text\{\(T = ([\d.]+)\)\}/g, "\\text{(T = $1)}")
			.replace(/\\text\{head (\d+) ctx\}/g, "\\text{Head $1 Kontext}")
			.replace(/\\text\{after concat\}/g, "\\text{nach Konkat}");
	}
	function tmTranslateTexElements(scope) {
		if (!scope || !scope.querySelectorAll) return;
		scope.querySelectorAll("[data-tex]").forEach(function (el) {
			if (el.getAttribute("data-tex-rendered") === "1") return;
			var tex = el.getAttribute("data-tex");
			if (tex) el.setAttribute("data-tex", tmTranslateTex(tex));
		});
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
		tmTranslateTexElements(scope);
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
	window.themeRiverRegistry = window.themeRiverRegistry || new Map();
	window.tlab_render_themeriver = function () {};
	window._execute_themeriver_render = function () {};
	window.forceRerenderVisibleThemeRiver = function () {};

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
	window.tmTranslateTex = tmTranslateTex;
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
