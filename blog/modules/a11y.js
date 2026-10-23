(function () {
	"use strict";

	var DONE = "data-a11y-done";
	var pending = null;

	function textOf(el) {
		if (!el) return "";
		if (el.nodeType !== 1) return (el.textContent || "").replace(/\s+/g, " ").trim();
		var clone = el.cloneNode(true);
		clone.querySelectorAll(".val, .value, output, [aria-hidden='true']").forEach(function (n) { n.remove(); });
		return (clone.textContent || "").replace(/\s+/g, " ").replace(/[\s:：–—-]+$/, "").trim();
	}

	function humanize(id) {
		return String(id || "")
			.replace(/^[a-z]+[-_]/, "")
			.replace(/[-_]+/g, " ")
			.replace(/([a-z])([A-Z])/g, "$1 $2")
			.trim();
	}

	function labelFor(id) {
		if (!id) return null;
		var labels = document.getElementsByTagName("label");
		for (var i = 0; i < labels.length; i++) {
			if (labels[i].htmlFor === id || labels[i].getAttribute("for") === id) return labels[i];
		}
		return null;
	}

	function precedingText(el) {
		var n = el.previousSibling;
		while (n) {
			if (n.nodeType === 3 && n.textContent.trim()) return textOf(n);
			if (n.nodeType === 1) {
				if (/^(LABEL|SPAN|STRONG|B|EM|SMALL|DT|LEGEND|P)$/.test(n.tagName)) {
					var t = textOf(n);
					if (t) return t;
				}
				break;
			}
			n = n.previousSibling;
		}
		var prev = el.previousElementSibling;
		for (var hops = 0; prev && hops < 3; hops++) {
			if (/^(LABEL|SPAN|STRONG|B|EM|SMALL|DT|LEGEND)$/.test(prev.tagName)) {
				var pt = textOf(prev);
				if (pt) return pt;
			}
			prev = prev.previousElementSibling;
		}
		return "";
	}

	function followingText(el) {
		var n = el.nextSibling;
		while (n) {
			if (n.nodeType === 3 && n.textContent.trim()) return textOf(n);
			if (n.nodeType === 1) {
				if (/^(LABEL|SPAN|STRONG|B|EM|SMALL)$/.test(n.tagName)) {
					var t = textOf(n);
					if (t) return t;
				}
				break;
			}
			n = n.nextSibling;
		}
		return "";
	}

	function headingNear(el) {
		var node = el;
		while (node && node !== document.body) {
			var prev = node.previousElementSibling;
			while (prev) {
				if (/^H[1-6]$/.test(prev.tagName)) {
					var t = textOf(prev);
					if (t) return t;
				}
				var h = prev.querySelector && prev.querySelector("h1, h2, h3, h4, h5, h6");
				if (h) {
					var ht = textOf(h);
					if (ht) return ht;
				}
				prev = prev.previousElementSibling;
			}
			node = node.parentElement;
		}
		return "";
	}

	function nameControl(el) {
		if (el.hasAttribute(DONE)) return;
		el.setAttribute(DONE, "1");
		if (el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby")) return;
		if (el.closest("label")) return;
		var lab = labelFor(el.id);
		if (lab) {
			if (!lab.id) lab.id = "a11y-label-" + (el.id || Math.random().toString(36).slice(2));
			el.setAttribute("aria-labelledby", lab.id);
			return;
		}
		var name = precedingText(el) || followingText(el);
		if (!name) {
			var group = el.closest(".control-group, .slider-container, .og-control, .statlab-controls, .mn-lab-controls");
			if (group) {
				var gl = group.querySelector("label, .label, .label-left");
				if (gl) name = textOf(gl);
			}
		}
		if (!name) name = el.getAttribute("placeholder") || "";
		if (!name && el.id) name = humanize(el.id);
		if (name) el.setAttribute("aria-label", name);
	}

	function nameVisual(el) {
		if (el.hasAttribute(DONE)) return;
		el.setAttribute(DONE, "1");
		if (el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby")) return;
		var name = el.getAttribute("data-a11y-label") || el.getAttribute("title");
		if (!name && el.layout && el.layout.title) {
			name = typeof el.layout.title === "string" ? el.layout.title : el.layout.title.text;
		}
		if (!name && el.getOption) {
			try {
				var option = el.getOption();
				if (option && option.title) name = Array.isArray(option.title) ? (option.title[0] && option.title[0].text) : option.title.text;
			} catch (e) { /* ignore */ }
		}
		if (!name) name = headingNear(el);
		if (!name) name = "Interactive visualization";
		if (!el.hasAttribute("role")) el.setAttribute("role", "img");
		el.setAttribute("aria-label", name);
	}

	function activateOnKey(el) {
		if (el.hasAttribute(DONE)) return;
		el.setAttribute(DONE, "1");
		if (!el.hasAttribute("role")) el.setAttribute("role", "button");
		if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
		if (!el.hasAttribute("aria-label") && !el.hasAttribute("aria-labelledby")) {
			var name = textOf(el) || el.getAttribute("title") || "";
			if (name) el.setAttribute("aria-label", name);
		}
		el.addEventListener("keydown", function (e) {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				el.click();
			}
		});
	}

	function enhance() {
		document.querySelectorAll("button:not([type])").forEach(function (b) { b.type = "button"; });

		var readerBtn = document.getElementById("reader-toggle");
		if (readerBtn) readerBtn.setAttribute("aria-pressed", document.documentElement.classList.contains("reader-mode") ? "true" : "false");
		var themeBtn = document.getElementById("theme-toggle");
		if (themeBtn) themeBtn.setAttribute("aria-pressed", document.documentElement.classList.contains("dark") ? "true" : "false");

		document.querySelectorAll("input, select, textarea").forEach(function (el) {
			if (el.tagName === "INPUT" && el.type === "hidden") return;
			nameControl(el);
		});

		document.querySelectorAll("canvas, .js-plotly-plot, .plot-container, [id^='viz-'], [id^='plot-'], [id$='-chart']").forEach(function (el) {
			if (el.tagName === "CANVAS" && el.closest(".js-plotly-plot")) return;
			nameVisual(el);
		});

		document.querySelectorAll("[onclick]").forEach(function (el) {
			if (/^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(el.tagName)) return;
			activateOnKey(el);
		});

		document.querySelectorAll("button").forEach(function (b) {
			if (b.hasAttribute("aria-label") || b.hasAttribute("aria-labelledby") || b.hasAttribute("title")) return;
			if (textOf(b)) return;
			var svg = b.querySelector("svg[aria-label]");
			if (svg) {
				b.setAttribute("aria-label", svg.getAttribute("aria-label"));
			} else if (b.id) {
				b.setAttribute("aria-label", humanize(b.id));
			}
		});

		["sources-section", "footnotes-section"].forEach(function (id) {
			var section = document.getElementById(id);
			if (section && !section.hasAttribute("aria-label") && !section.hasAttribute("aria-labelledby")) {
				section.setAttribute("aria-label", id === "sources-section" ? "Sources" : "Footnotes");
			}
		});

		document.querySelectorAll("table").forEach(function (table) {
			if (!table.querySelector("caption") && !table.hasAttribute("aria-label") && !table.hasAttribute("aria-labelledby")) {
				var label = headingNear(table);
				if (label) table.setAttribute("aria-label", label);
			}
			table.querySelectorAll("th").forEach(function (th) {
				if (th.hasAttribute("scope")) return;
				th.setAttribute("scope", th.closest("thead") ? "col" : "row");
			});
		});

		document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
			if (!a.hasAttribute("rel")) a.setAttribute("rel", "noopener noreferrer");
			if (a.hasAttribute("data-a11y-external") || a.querySelector(".sr-only")) return;
			a.setAttribute("data-a11y-external", "1");
			var note = document.createElement("span");
			note.className = "sr-only";
			note.textContent = " (opens in a new tab)";
			a.appendChild(note);
		});

		document.querySelectorAll("button svg, a svg").forEach(function (svg) {
			var host = svg.closest("a, button");
			if (host && host.tagName === "A" && !textOf(host) && !host.hasAttribute("aria-label") && !host.hasAttribute("aria-labelledby")) return;
			if (!svg.hasAttribute("role") && !svg.hasAttribute("aria-label") && !svg.querySelector("title")) {
				svg.setAttribute("aria-hidden", "true");
				svg.setAttribute("focusable", "false");
			}
		});

		var debug = /\bdebug=1\b/.test(window.location.search) || window.__A11Y_AUDIT__ === true;
		if (debug) {
			var report = window.__a11yCheck();
			if (report.issues.length) console.info("a11y audit", report);
		}
	}

	function schedule() {
		clearTimeout(pending);
		pending = setTimeout(enhance, 120);
	}

	function boot() {
		enhance();
		if ("MutationObserver" in window) {
			new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
		}
	}

	window.__a11yCheck = function () {
		var issues = [];
		document.querySelectorAll("input, select, textarea").forEach(function (el) {
			if ((el.tagName === "INPUT" && el.type === "hidden") || el.closest("[inert]")) return;
			if (!el.hasAttribute("aria-label") && !el.hasAttribute("aria-labelledby") && !el.closest("label") && !labelFor(el.id)) {
				issues.push({ type: "unlabeled-control", tag: el.tagName, id: el.id || null });
			}
		});
		document.querySelectorAll("canvas, .js-plotly-plot, .plot-container").forEach(function (el) {
			if (!el.hasAttribute("aria-label") && !el.hasAttribute("aria-labelledby")) {
				issues.push({ type: "unlabeled-visual", tag: el.tagName, id: el.id || null });
			}
		});
		document.querySelectorAll("button").forEach(function (el) {
			if (!textOf(el) && !el.hasAttribute("aria-label") && !el.hasAttribute("aria-labelledby") && !el.hasAttribute("title")) {
				issues.push({ type: "unnamed-button", id: el.id || null });
			}
		});
		return { issues: issues, count: issues.length };
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 0); });
	} else {
		setTimeout(boot, 0);
	}
	window.addEventListener("blogPostLoadComplete", schedule);
	window.addEventListener("load", schedule);
})();
