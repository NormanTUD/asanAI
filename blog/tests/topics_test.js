/* Node smoke test for topics.js internals.
 * Run with:  node tests/topics_test.js
 *
 * Verifies:
 *   • topic registry + the new tone-category registry (math-heavy, …)
 *   • cookie round-trip for both topics and categories
 *   • isEnabled / anyEnabled / isCatEnabled defaults are sane
 *   • scoreUnit() 3-state logic (full / partial / off) incl. reasons
 *   • the layman "include" lens
 *   • marked extension recognises [[t:topic]]…[[/t]] markers and
 *     multi-topic / nesting behaviour.
 */

'use strict';

function makeNode() {
	return {
		classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
		style: {},
		dataset: {},
		innerHTML: '',
		value: '',
		textContent: '',
		addEventListener() {},
		appendChild() {},
		removeChild() {},
		setAttribute() {},
		getAttribute() { return ''; },
		querySelector() { return makeNode(); },
		querySelectorAll() { return []; },
		focus() {},
		children: [],
		firstChild: null,
		insertBefore() {},
		remove() {},
		click() {}
	};
}

// document.cookie is a magic getter/setter in browsers — we model
// it with a tiny backing map so persistence actually round-trips.
const _cookieMap = {};
global.document = {
	readyState: 'loading',  // prevents init() side-effects on load
	get cookie() {
		return Object.keys(_cookieMap)
			.filter(function (k) { return _cookieMap[k] !== ''; })
			.map(function (k) { return k + '=' + _cookieMap[k]; })
			.join('; ');
	},
	set cookie(value) {
		const eq = value.indexOf('=');
		if (eq === -1) { return; }
		const name = value.substring(0, eq).trim();
		const rest = value.substring(eq + 1);
		const semi = rest.indexOf(';');
		const v = (semi === -1 ? rest : rest.substring(0, semi)).trim();
		if (/expires=Thu,\s*01 Jan 1970/i.test(value)) {
			delete _cookieMap[name];
		} else {
			_cookieMap[name] = v;
		}
	},
	createElement: function() { return makeNode(); },
	createTextNode: function() { return {}; },
	getElementById: function() { return null; },
	querySelectorAll: function() { return []; },
	body: { appendChild() {}, style: {} },
	addEventListener() {},
	dispatchEvent() {}
};
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.CustomEvent = function(name, init) { this.name = name; };

// Marked mock: exposes .use() + a tagged renderer that recognises the
// topic-block extension's output (see the real one in topics.js).
global.marked = {
	use(cfg) { this._extension = cfg.extensions[0]; },
	parse(src) {
		const ext = this._extension;
		if (!ext) return '<p>' + src + '</p>';
		const ctx = {
			lexer: {
				blockTokens(inner) {
					return [{ type: 'paragraph', text: inner, tokens: [
						{ type: 'text', text: inner, tokens: [] }
					]}];
				}
			},
			parser: { parse(tokens) { return '<p>' + (tokens[0].text || '') + '</p>'; } }
		};
		let out = '';
		let rest = src;
		while (true) {
			const i = ext.start(rest);
			if (i === undefined || i < 0) { out += rest; break; }
			out += rest.substring(0, i);
			rest = rest.substring(i);
			const tok = ext.tokenizer.call(ctx, rest);
			if (!tok) {
				out += rest.charAt(0);
				rest = rest.substring(1);
				continue;
			}
			out += ext.renderer.call(ctx, tok);
			rest = rest.substring(tok.raw.length);
		}
		return out;
	}
};

require('../topics.js');

var pass = 0, fail = 0;
function check(cond, msg) {
	if (cond) { pass++; }
	else { fail++; console.log('  FAIL: ' + msg); }
}

const BT = global.window.BlogTopics;
check(typeof BT === 'object', 'BlogTopics is exposed');
check(Array.isArray(BT.TOPICS), 'TOPICS is an array');
check(BT.TOPICS.length >= 25, 'TOPICS has the expected interests (got ' + BT.TOPICS.length + ')');
['math-i', 'math-ii', 'math-iii', 'history', 'philosophy', 'language', 'programming']
	.forEach(function (id) {
		check(BT.TOPICS.some(function (t) { return t.id === id; }), 'TOPICS contains "' + id + '"');
	});

/* ── tone categories ───────────────────────────────────────── */
check(Array.isArray(BT.CATEGORIES), 'CATEGORIES is an array');
const catIds = BT.CATEGORIES.map(function (c) { return c.id; }).sort();
check(JSON.stringify(catIds) === JSON.stringify(['code-heavy', 'interested-layman', 'language-heavy', 'logic-heavy', 'math-heavy']),
	'CATEGORIES has exactly the 5 tone categories (got ' + catIds.join(', ') + ')');
check(BT.CATEGORIES.filter(function (c) { return c.kind === 'suppress'; }).length === 4, '4 suppress categories');
check(BT.CATEGORIES.filter(function (c) { return c.kind === 'include'; }).length === 1, '1 include category');
check(BT.isCategory('math-heavy') === true, 'isCategory(math-heavy)');
check(BT.isCategory('history') === false, 'isCategory(history) → false');

/* ── defaults ──────────────────────────────────────────────── */
check(BT.isEnabled('math-i') === true, 'math-i enabled by default');
check(BT.isEnabled('nonexistent') === true, 'unknown topics enabled by default');
check(BT.isCatEnabled('math-heavy') === true, 'suppress category ON by default');
check(BT.isCatEnabled('interested-layman') === false, 'include category OFF by default');
check(BT.anyEnabled(['math-i', 'nonexistent']) === true, 'anyEnabled OR-logic');

/* ── scoreUnit 3-state ─────────────────────────────────────── */
function withPref(obj) {
	if (obj === null) { delete _cookieMap['topics_pref']; }
	else { _cookieMap['topics_pref'] = encodeURIComponent(JSON.stringify(obj)); }
}

// default (everything on): a single-interest unit is full
withPref(null);
check(BT.scoreUnit(['history']).state === 'full', 'all on → single interest = full');
check(BT.scoreUnit(['history', 'math-i']).state === 'full', 'all on → multi interest = full');

// one of two interests off → partial, with a reason naming it
withPref({ topics: { 'math-i': false } });
const part = BT.scoreUnit(['history', 'math-i']);
check(part.state === 'partial', 'one of two interests off → partial');
check(/Math I/.test(part.reason), 'partial reason names the switched-off topic');

// all interests off → off
withPref({ topics: { history: false, 'math-i': false } });
check(BT.scoreUnit(['history', 'math-i']).state === 'off', 'all interests off → off');

// a carried suppress category switched off → off, reason names it
withPref({ categories: { 'math-heavy': false } });
const sup = BT.scoreUnit(['math-i', 'math-heavy']);
check(sup.state === 'off', 'carried math-heavy + switched off → off');
check(/Math-heavy/.test(sup.reason), 'off reason names Math-heavy');

// turning that category back on restores the unit
withPref({ categories: { 'math-heavy': true } });
check(BT.scoreUnit(['math-i', 'math-heavy']).state === 'full', 'category back on → full again');

// layman lens: ON + unit not layman-tagged → partial
withPref({ categories: { 'interested-layman': true } });
check(BT.scoreUnit(['history']).state === 'partial', 'layman on + not layman-tagged → partial');
check(BT.scoreUnit(['history', 'interested-layman']).state === 'full', 'layman on + layman-tagged → full');

/* ── category round-trip ───────────────────────────────────── */
withPref(null);
BT.setCatEnabled('math-heavy', false);
check(BT.isCatEnabled('math-heavy') === false, 'setCatEnabled(math-heavy, false)');
check(document.cookie.indexOf('topics_pref=') !== -1, 'category change persisted to cookie');
BT.setCatEnabled('math-heavy', true);
check(BT.isCatEnabled('math-heavy') === true, 'setCatEnabled(math-heavy, true)');
withPref(null);

/* ── marked extension behaviour ────────────────────────────── */
BT.preprocess('');
function render(src) { return marked.parse(src); }

const html1 = render('[[t:math]]\n## M\n\ncontent\n[[/t]]');
check(/<div class="topic-block" data-topic="math">/.test(html1), 'single-topic block renders');

const html2 = render('[[t:math,history]]\nmulti\n[[/t]]');
check(/data-topic="math history"/.test(html2), 'multi-topic block space-separated');

const html3 = render('[[t:math]]\nA\n[[/t]]\n\n[[t:history]]\nB\n[[/t]]');
const m3 = (html3.match(/data-topic="([^"]+)"/g) || []);
check(m3.length === 2, 'two blocks produce two data-topic attrs (got ' + m3.length + ')');

const html4 = render('[[t:math]]A[[/t]][[t:history]]B[[/t]]');
const m4 = (html4.match(/data-topic="[^"]+"/g) || []);
check(m4.length === 2, 'two adjacent blocks render (got ' + m4.length + ')');

const html5 = render('[[t:MATH]]\nX\n[[/t]]');
check(/data-topic="math"/.test(html5), 'topic id lowercased');

const html6 = render('before [[t:math]]\nblock\n[[/t]] after');
check(/data-topic="math"/.test(html6), 'mid-paragraph marker still produces a block');

const html7 = render('[[t:math]]\nUnclosed\n\nNot closed');
check(!/<div class="topic-block"/.test(html7), 'unclosed marker does not produce a block');

// a category id inside a marker still round-trips into data-topic
const html8 = render('[[t:math-i,math-heavy]]\nbody\n[[/t]]');
check(/data-topic="math-i math-heavy"/.test(html8), 'category id coexists in data-topic');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
