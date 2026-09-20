/* Node smoke test for the math-alternative-text mechanism in topics.js.
 * Run with:  node tests/math_alt_test.js
 *
 * Convention (an author ships a heavy equation plus a plain-language twin):
 *   <div class="math-opt" data-math-opt="math-heavy">
 *     $$…the heavy LaTeX…$$        → temml renders this to a <math> element
 *     <span class="math-alt">…the simpler words…</span>
 *   </div>
 * While the 'math-heavy' tone is ON the equation shows; as soon as it is
 * switched OFF the <math> is hidden and the .math-alt twin is shown.
 * This is the ONE demo/test that carries the mechanism — no course
 * content uses it yet.
 */

'use strict';

/* ── tiny DOM mock ───────────────────────────────────────────── */
function baseNode() {
	return {
		style: {},
		dataset: {},
		innerHTML: '',
		textContent: '',
		addEventListener() {},
		appendChild() {},
		remove() {},
		setAttribute() {},
		getAttribute() { return ''; },
		querySelector() { return null; },
		querySelectorAll() { return []; },
		focus() {},
		children: [],
		firstChild: null,
		insertBefore() {},
		getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0 }; }
	};
}

function withClassList(node) {
	const set = new Set();
	node.classList = {
		add(c) { set.add(c); },
		remove(c) { set.delete(c); },
		contains(c) { return set.has(c); },
		toggle(c, force) {
			if (force === undefined) { if (set.has(c)) set.delete(c); else set.add(c); }
			else if (force) set.add(c); else set.delete(c);
		}
	};
	return node;
}

function fakeMathOpt(attrs) {
	const node = withClassList(baseNode());
	node._attrs = attrs || {};
	node._eqs = (attrs && attrs._eqs) || [];
	node._alt = (attrs && attrs._alt) || null;
	node.getAttribute = function (n) { return node._attrs[n] !== undefined ? node._attrs[n] : ''; };
	node.querySelector = function (sel) { return sel === '.math-alt' ? node._alt : null; };
	node.querySelectorAll = function (sel) { return sel === 'math' ? node._eqs : []; };
	return node;
}

// one math-opt host: a rendered <math> plus a .math-alt twin
const mathEl = withClassList(baseNode());
const altEl  = withClassList(baseNode());
const hostEl = fakeMathOpt({ 'data-math-opt': 'math-heavy', _eqs: [mathEl], _alt: altEl });

const _cookieMap = {};
global.document = {
	readyState: 'loading', // keep init() from running side-effects on load
	get cookie() {
		return Object.keys(_cookieMap)
			.filter(function (k) { return _cookieMap[k] !== ''; })
			.map(function (k) { return k + '=' + _cookieMap[k]; })
			.join('; ');
	},
	set cookie(value) {
		const eq = value.indexOf('=');
		if (eq === -1) return;
		const name = value.substring(0, eq).trim();
		const rest = value.substring(eq + 1);
		const semi = rest.indexOf(';');
		_cookieMap[name] = (semi === -1 ? rest : rest.substring(0, semi)).trim();
	},
	createElement: function () { return withClassList(baseNode()); },
	createTextNode: function () { return {}; },
	getElementById: function () { return null; },
	querySelectorAll: function (sel) {
		if (sel === '[data-math-opt]') return [hostEl];
		return [];
	},
	body: { appendChild() {}, style: {} },
	addEventListener() {},
	dispatchEvent() {}
};
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CustomEvent = function (name) { this.name = name; };
global.requestAnimationFrame = function () { return 0; };

require('../topics.js');
const BT = global.window.BlogTopics;

let pass = 0, fail = 0;
function check(cond, msg) { if (cond) pass++; else { fail++; console.log('  FAIL: ' + msg); } }

// Default: math-heavy ON → equation visible, twin hidden
BT.applyMathAlts();
check(mathEl.style.display !== 'none', 'math-heavy ON → <math> shown by default');
check(altEl.style.display === 'none', 'math-heavy ON → .math-alt hidden by default');

// Switch math-heavy OFF → equation hidden, twin shown
document.cookie = 'topics_pref=' + encodeURIComponent(JSON.stringify({ categories: { 'math-heavy': false } }));
BT.applyMathAlts();
check(mathEl.style.display === 'none', 'math-heavy OFF → <math> hidden');
check(altEl.style.display === 'block', 'math-heavy OFF → .math-alt shown');
check(hostEl.classList.contains('math-opt-simplified'), 'host flagged math-opt-simplified when simplified');

// Switch back ON
document.cookie = 'topics_pref=' + encodeURIComponent(JSON.stringify({ categories: { 'math-heavy': true } }));
BT.applyMathAlts();
check(mathEl.style.display !== 'none', 'math-heavy back ON → <math> shown again');
check(altEl.style.display === 'none', 'math-heavy back ON → .math-alt hidden again');

// A different tone (logic-heavy) must not affect a math-heavy opt
document.cookie = 'topics_pref=' + encodeURIComponent(JSON.stringify({ categories: { 'logic-heavy': false } }));
BT.applyMathAlts();
check(mathEl.style.display !== 'none', 'logic-heavy OFF does not hide a math-heavy equation');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
