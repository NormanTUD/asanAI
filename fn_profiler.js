"use strict";

/*
 * fn_profiler.js — automatic window-function profiler ("opencodelog").
 *
 * What it does
 *   Wraps every function property directly on `window`: the original is copied
 *   to `window.fn_copy_<name>` (never instrumented) and `window.<name>` becomes
 *   a wrapper that calls the copy and measures its duration.
 *
 * Output (default mode)
 *   A full nested trace of every call:
 *     -> anfang model_to_latex   [in updated_page > write_model_to_latex_to_page]
 *     <- ende model_to_latex 0.500s (self 0.120s)   [in updated_page > write_model_to_latex_to_page]
 *   Indentation = call depth; `[in ...]` = the call stack (callers); `self` =
 *   time spent in the function itself, excluding the functions it calls.
 *
 * Usage (browser console)
 *   __opencodelog.enable()        start logging + print running stack 1/s
 *   __opencodelog.disable()       stop logging (wrapping stays, ~free)
 *   ... reproduce your use case ...
 *   __opencodelog.report(30)      top 30 functions by total time  <-- start here
 *   __opencodelog.hotspots(30)    top 30 functions by own (self) time  <-- CPU hog
 *   __opencodelog.where()         call path of the single slowest call  <-- where it hangs
 *   __opencodelog.running()       functions running right now (name + elapsed)
 *   __opencodelog.slowest(20)     the 20 slowest finished calls
 *   __opencodelog.reset()         clear history + aggregates + baseline
 *   __opencodelog.watch(1000)     auto-print the running stack every 1000 ms
 *   __opencodelog.unwatch()
 *   __opencodelog.onlySlow(500)   only print calls >= 500 ms
 *   __opencodelog.silent()        no per-call printing, aggregate only
 *   __opencodelog.recordsOnly()   only print calls slower than every earlier one
 *   __opencodelog.all()           back to the full trace (the default)
 *   __opencodelog.status()        what is installed / active
 *   __opencodelog.rescan()        wrap functions created after load
 *   __opencodelog.uninstall()     restore all originals
 *
 * Auto-installs on window `load`; auto-enables when the URL contains
 * `?opencodelog=1`. Live prefix in the console: [opencodelog].
 */

(function () {
	var LOGTAG = "opencodelog";
	var COPY_PREFIX = "fn_copy_";
	var native_re = /\{\s*\[native code\]\s*\}/;

	var state = {
		active: false,
		verbose: true,
		minMs: 0,
		recordOnly: false,
		maxDur: 0,
		installed: false,
		stack: [],
		finished: [],
		agg: {},
		wrapped: [],
		skipped: [],
		watchTimer: null
	};

	var EXCLUDE_LIST = [
		"$", "jQuery", "_",
		"log", "dbg", "info", "wrn", "err", "assert",
		"Console", "console"
	];
	var excludeSet = {};
	EXCLUDE_LIST.forEach(function (n) { excludeSet[n] = true; });

	function isExcluded(name) {
		if (excludeSet[name]) return true;
		if (name.indexOf(COPY_PREFIX) === 0) return true;
		if (name.indexOf("_oc") === 0) return true;
		if (name.indexOf("__opencodelog") === 0) return true;
		if (name.indexOf("webkit") === 0) return true;
		return false;
	}

	function isNative(fn) {
		try {
			return native_re.test(Function.prototype.toString.call(fn));
		} catch (e) {
			return true;
		}
	}

	function indent(n) {
		var s = "";
		for (var i = 0; i < n; i++) s += "  ";
		return s;
	}

	function secs(ms) {
		return (ms / 1000).toFixed(3);
	}

	function pathOf(count) {
		var names = [];
		var n = (typeof count === "number") ? count : state.stack.length;
		for (var i = 0; i < n; i++) names.push(state.stack[i].name);
		return names.join(" > ");
	}

	function pad(s, n) {
		s = String(s);
		while (s.length < n) s += " ";
		return s;
	}

	function bumpAgg(rec) {
		var a = state.agg[rec.name];
		if (!a) a = state.agg[rec.name] = { count: 0, total: 0, self: 0, max: 0 };
		a.count++;
		a.total += rec.dur;
		a.self += rec.self;
		if (rec.dur > a.max) a.max = rec.dur;
	}

	function makeWrapper(name, orig) {
		function wrapper() {
			if (!state.active) {
				if (new.target) return Reflect.construct(orig, arguments, new.target);
				return orig.apply(this, arguments);
			}
			var rec = {
				name: name,
				t0: performance.now(),
				depth: state.stack.length,
				child: 0,
				callers: pathOf(),
				parent: state.stack.length ? state.stack[state.stack.length - 1] : null
			};
			state.stack.push(rec);
			if (state.verbose && !state.recordOnly && rec.depth) {
				console.log("[" + LOGTAG + "] " + indent(rec.depth) + "-> anfang " + name + "   [in " + rec.callers + "]");
			} else if (state.verbose && !state.recordOnly) {
				console.log("[" + LOGTAG + "] " + indent(rec.depth) + "-> anfang " + name);
			}
			try {
				if (new.target) return Reflect.construct(orig, arguments, new.target);
				return orig.apply(this, arguments);
			} finally {
				var idx = state.stack.lastIndexOf(rec);
				if (idx >= 0) state.stack.splice(idx, 1);
				var dur = performance.now() - rec.t0;
				rec.dur = dur;
				rec.self = dur - rec.child;
				if (rec.parent) rec.parent.child += dur;
				state.finished.push(rec);
				bumpAgg(rec);
				var record = dur > state.maxDur;
				if (record) state.maxDur = dur;
				reportEnd(rec, record);
			}
		}
		copyMeta(wrapper, orig, name);
		return wrapper;
	}

	function reportEnd(rec, record) {
		var callers = rec.callers ? "   [in " + rec.callers + "]" : "";
		var tag = record ? "  (bisher langsamste)" : "";
		if (state.recordOnly) {
			if (record) {
				console.log("[" + LOGTAG + "] " + indent(rec.depth) + "<- ende " + rec.name + " " + secs(rec.dur) + "s" + callers + tag);
			}
			return;
		}
		if (!state.verbose && rec.dur < state.minMs) return;
		console.log("[" + LOGTAG + "] " + indent(rec.depth) + "<- ende " + rec.name + " " + secs(rec.dur) +
			"s (self " + secs(rec.self) + "s)" + callers + tag);
	}

	function copyMeta(wrapper, orig, name) {
		try { Object.defineProperty(wrapper, "name", { value: name, configurable: true }); } catch (e) {}
		if (orig.prototype) {
			try { wrapper.prototype = orig.prototype; } catch (e) {}
		}
		var props;
		try { props = Object.getOwnPropertyNames(orig); } catch (e) { return; }
		for (var i = 0; i < props.length; i++) {
			var p = props[i];
			if (p === "length" || p === "name" || p === "arguments" || p === "caller" || p === "prototype") continue;
			try {
				var d = Object.getOwnPropertyDescriptor(orig, p);
				if (d) Object.defineProperty(wrapper, p, d);
			} catch (e) {}
		}
	}

	function wrapOne(name) {
		if (isExcluded(name)) return false;
		var d;
		try { d = Object.getOwnPropertyDescriptor(window, name); } catch (e) { return false; }
		if (!d || typeof d.value !== "function") return false;
		var fn = d.value;
		if (fn.__opencodelog_wrapped) return false;
		if (fn === install || fn === rescan || fn === wrapOne) return false;
		if (isNative(fn)) { state.skipped.push(name); return false; }
		try {
			window[COPY_PREFIX + name] = fn;
			window[name] = makeWrapper(name, fn);
			state.wrapped.push(name);
			return true;
		} catch (e) {
			state.skipped.push(name);
			return false;
		}
	}

	function scan() {
		var names = Object.keys(window);
		var n = 0;
		for (var i = 0; i < names.length; i++) {
			if (wrapOne(names[i])) n++;
		}
		return n;
	}

	function install() {
		if (state.installed) return;
		var n = scan();
		state.installed = true;
		console.log("[" + LOGTAG + "] installed " + n + " functions, skipped " + state.skipped.length);
	}

	function rescan() {
		var n = scan();
		console.log("[" + LOGTAG + "] rescan wrapped " + n + " new functions");
		return n;
	}

	function printRunning(silentIfEmpty) {
		var now = performance.now();
		if (!state.stack.length) {
			if (!silentIfEmpty) console.log("[" + LOGTAG + "] running: (none)");
			return;
		}
		console.log("[" + LOGTAG + "] running (" + state.stack.length + "):");
		for (var i = 0; i < state.stack.length; i++) {
			var r = state.stack[i];
			console.log("[" + LOGTAG + "]   " + indent(i) + r.name + "  " + secs(now - r.t0) + "s");
		}
	}

	function slowest(n) {
		var arr = state.finished.slice().sort(function (a, b) { return b.dur - a.dur; });
		if (n && n > 0) arr = arr.slice(0, n);
		for (var i = 0; i < arr.length; i++) {
			console.log("[" + LOGTAG + "] #" + (i + 1) + " " + arr[i].name + "  " + secs(arr[i].dur) + "s");
		}
		return arr;
	}

	function aggregateRows() {
		var rows = [];
		for (var k in state.agg) {
			var a = state.agg[k];
			rows.push({ name: k, count: a.count, total: a.total, self: a.self, max: a.max });
		}
		return rows;
	}

	function printTable(rows, by, title) {
		rows.sort(function (x, y) { return y[by] - x[by]; });
		console.log("[" + LOGTAG + "] " + title + " (" + rows.length + " functions):");
		console.log("[" + LOGTAG + "]   " + pad("self", 9) + " " + pad("total", 9) + " " + pad("max", 9) + " " + pad("calls", 6) + " function");
		for (var i = 0; i < rows.length; i++) {
			var r = rows[i];
			console.log("[" + LOGTAG + "]   " + pad(secs(r.self) + "s", 9) + " " + pad(secs(r.total) + "s", 9) +
				" " + pad(secs(r.max) + "s", 9) + " " + pad(r.count, 6) + " " + r.name);
		}
	}

	function report(n) {
		var rows = aggregateRows();
		if (n && n > 0) {
			rows.sort(function (x, y) { return y.total - x.total; });
			rows = rows.slice(0, n);
		}
		printTable(rows, "total", "report — slowest by total time");
		return rows;
	}

	function hotspots(n) {
		var rows = aggregateRows();
		if (n && n > 0) {
			rows.sort(function (x, y) { return y.self - x.self; });
			rows = rows.slice(0, n);
		}
		printTable(rows, "self", "hotspots — slowest by own (self) time");
		return rows;
	}

	function where() {
		var max = null;
		for (var i = 0; i < state.finished.length; i++) {
			var r = state.finished[i];
			if (!max || r.dur > max.dur) max = r;
		}
		if (!max) { console.log("[" + LOGTAG + "] no finished calls"); return null; }
		console.log("[" + LOGTAG + "] slowest single call: " + max.name + " " + secs(max.dur) + "s (self " + secs(max.self) + "s)");
		console.log("[" + LOGTAG + "]   path: " + (max.callers ? max.callers + " > " + max.name : max.name));
		return max;
	}

	function watch(ms) {
		if (state.watchTimer) clearInterval(state.watchTimer);
		state.watchTimer = setInterval(function () { printRunning(true); }, ms || 1000);
		console.log("[" + LOGTAG + "] watching running stack every " + (ms || 1000) + " ms");
	}

	function unwatch() {
		if (state.watchTimer) clearInterval(state.watchTimer);
		state.watchTimer = null;
	}

	function uninstall() {
		for (var i = 0; i < state.wrapped.length; i++) {
			var name = state.wrapped[i];
			var copy = window[COPY_PREFIX + name];
			if (typeof copy === "function") window[name] = copy;
			try { delete window[COPY_PREFIX + name]; } catch (e) {}
		}
		state.wrapped = [];
		state.installed = false;
		console.log("[" + LOGTAG + "] uninstalled");
	}

	window.__opencodelog = {
		install: install,
		rescan: rescan,
		uninstall: uninstall,
		enable: function () {
			state.active = true;
			state.maxDur = 0;
			install();
			watch(1000);
			console.log("[" + LOGTAG + "] enabled (" + (state.recordOnly ? "only calls slower than every earlier one" : "full trace: anfang/ende incl. call stack and self-time") + ")");
		},
		disable: function () {
			state.active = false;
			unwatch();
			console.log("[" + LOGTAG + "] disabled");
		},
		running: function () { printRunning(false); },
		watch: watch,
		unwatch: unwatch,
		slowest: slowest,
		report: report,
		hotspots: hotspots,
		where: where,
		reset: function () { state.finished = []; state.agg = {}; state.maxDur = 0; return state; },
		verbose: function (v) { state.verbose = !!v; state.recordOnly = false; return state.verbose; },
		onlySlow: function (ms) { state.minMs = ms || 0; state.verbose = false; state.recordOnly = false; return state.minMs; },
		silent: function () { state.verbose = false; state.recordOnly = false; state.minMs = Infinity; return true; },
		recordsOnly: function () { state.recordOnly = true; state.maxDur = 0; return true; },
		all: function () { state.recordOnly = false; state.verbose = true; state.minMs = 0; return true; },
		exclude: function (name) { excludeSet[name] = true; return name; },
		status: function () {
			console.log("[" + LOGTAG + "] installed=" + state.installed +
				" active=" + state.active +
				" wrapped=" + state.wrapped.length +
				" skipped=" + state.skipped.length +
				" running=" + state.stack.length +
				" finished=" + state.finished.length);
			return state;
		},
		state: state
	};

	if (document.readyState === "complete") {
		install();
	} else {
		window.addEventListener("load", function () { install(); });
	}
	if (/[?&]opencodelog=1(&|$)/.test(window.location.search)) {
		state.active = true;
		console.log("[" + LOGTAG + "] auto-enabled via ?opencodelog=1");
	}
})();
