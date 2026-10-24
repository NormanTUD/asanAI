/*
 * In-memory capture for reader feedback bug reports.
 *
 * Nothing is sent anywhere by this file. It keeps a small ring buffer of
 * console output, uncaught errors and recent clicks so the feedback panel
 * can attach them to a bug report — but only after the reader ticks the
 * explicit consent checkbox. The buffer is discarded on navigation.
 */
(function () {
	"use strict";

	if (window.__MNFeedbackCapture) {
		return;
	}

	var MAX_LOGS = 200;
	var MAX_LOG_CHARS = 64000;
	var MAX_CLICKS = 20;
	var logs = [];
	var logChars = 0;
	var clicks = [];
	var lastError = null;

	function now() {
		return Date.now();
	}

	function safeString(value, depth) {
		depth = depth || 0;
		if (value === null) return "null";
		if (typeof value === "undefined") return "undefined";
		if (typeof value === "string") return value;
		if (typeof value === "number" || typeof value === "boolean") return String(value);
		if (typeof value === "function") return "[function " + (value.name || "anonymous") + "]";
		if (value instanceof Error) {
			return (value.name || "Error") + ": " + (value.message || "") +
				(value.stack ? "\n" + value.stack : "");
		}
		if (typeof Node !== "undefined" && value instanceof Node) {
			return "<" + String(value.nodeName || "node").toLowerCase() + ">";
		}
		if (depth >= 3) return "[object]";
		try {
			var seen = [];
			var json = JSON.stringify(value, function (key, item) {
				if (typeof item === "object" && item !== null) {
					if (seen.indexOf(item) >= 0) return "[circular]";
					seen.push(item);
				}
				if (typeof item === "function") return "[function]";
				return item;
			});
			if (typeof json === "string") {
				return json.length > 4000 ? json.slice(0, 4000) + "…" : json;
			}
		} catch (e) {
			/* fall through */
		}
		try {
			return String(value);
		} catch (e2) {
			return "[unserialisable]";
		}
	}

	function pushLog(level, args) {
		var text = "";
		for (var i = 0; i < args.length; i++) {
			if (i) text += " ";
			text += safeString(args[i], 0);
		}
		if (text.length > 8000) text = text.slice(0, 8000) + "…";
		var entry = { t: now(), level: level, text: text };
		logs.push(entry);
		logChars += text.length;
		while (logs.length > MAX_LOGS || logChars > MAX_LOG_CHARS) {
			var removed = logs.shift();
			if (removed) logChars -= removed.text.length;
		}
	}

	var levels = ["log", "info", "warn", "error", "debug"];
	levels.forEach(function (level) {
		var original = console && console[level];
		if (typeof original !== "function") return;
		console[level] = function () {
			try {
				pushLog(level, Array.prototype.slice.call(arguments));
			} catch (e) { /* capture must never break the console */ }
			return original.apply(console, arguments);
		};
	});

	function recordError(message, source, line, column, stack) {
		lastError = {
			t: now(),
			message: String(message || ""),
			source: String(source || ""),
			line: line || 0,
			column: column || 0,
			stack: String(stack || "")
		};
	}

	window.addEventListener("error", function (event) {
		try {
			var err = event && event.error;
			recordError(
				event && event.message ? event.message : (err && err.message ? err.message : "unknown error"),
				event && event.filename ? event.filename : "",
				event && event.lineno ? event.lineno : 0,
				event && event.colno ? event.colno : 0,
				err && err.stack ? err.stack : ""
			);
		} catch (e) { /* ignore */ }
	});

	window.addEventListener("unhandledrejection", function (event) {
		try {
			var reason = event && event.reason;
			recordError(
				reason && reason.message ? reason.message : String(reason || "unhandled rejection"),
				"",
				0,
				0,
				reason && reason.stack ? reason.stack : ""
			);
		} catch (e) { /* ignore */ }
	});

	function selectorOf(el) {
		if (!el || !el.tagName) return "";
		var parts = [];
		var node = el;
		var hops = 0;
		while (node && node.nodeType === 1 && hops < 5) {
			var part = node.tagName.toLowerCase();
			if (node.id) {
				part += "#" + node.id;
				parts.unshift(part);
				break;
			}
			var cls = String(node.className || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
			if (cls.length) part += "." + cls.join(".");
			var parent = node.parentElement;
			if (parent) {
				var index = 0;
				var child = parent.firstElementChild;
				while (child) {
					if (child === node) break;
					if (child.tagName === node.tagName) index++;
					child = child.nextElementSibling;
				}
				if (index > 0) part += ":nth-of-type(" + (index + 1) + ")";
			}
			parts.unshift(part);
			node = parent;
			hops++;
		}
		return parts.join(" > ");
	}

	function textOf(el) {
		if (!el) return "";
		var text = "";
		try {
			text = String(el.getAttribute("aria-label") || el.textContent || "");
		} catch (e) { /* ignore */ }
		return text.replace(/\s+/g, " ").trim().slice(0, 80);
	}

	function headingNear(el) {
		var node = el;
		while (node && node !== document.body) {
			var prev = node.previousElementSibling;
			while (prev) {
				if (/^H[1-6]$/.test(prev.tagName)) {
					return String(prev.textContent || "").replace(/\s+/g, " ").trim().slice(0, 100);
				}
				prev = prev.previousElementSibling;
			}
			node = node.parentElement;
		}
		return "";
	}

	document.addEventListener("click", function (event) {
		try {
			var target = event.target;
			if (!target || !target.closest) return;
			if (target.closest("#mn-feedback-layer")) return;
			var el = target.closest("button, a, input, select, textarea, summary, [role='button'], [onclick]");
			if (!el) return;
			var descriptor = {
				t: now(),
				tag: String(el.tagName || "").toLowerCase(),
				id: String(el.id || ""),
				classes: String(el.className || "").trim().slice(0, 120),
				text: textOf(el),
				role: String(el.getAttribute("role") || ""),
				section: headingNear(el),
				selector: selectorOf(el)
			};
			clicks.push(descriptor);
			while (clicks.length > MAX_CLICKS) clicks.shift();
		} catch (e) { /* ignore */ }
	}, true);

	window.__MNFeedbackCapture = {
		snapshot: function (consent) {
			var out = {
				logs: [],
				clicks: [],
				last_error: null
			};
			if (!consent) {
				return out;
			}
			out.logs = logs.slice();
			out.clicks = clicks.slice();
			out.last_error = lastError;
			return out;
		},
		clear: function () {
			logs = [];
			logChars = 0;
			clicks = [];
			lastError = null;
		}
	};
})();
