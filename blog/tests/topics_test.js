/* Node smoke test for topics.js internals.
 * Run with:  node tests/topics_test.js
 *
 * Verifies:
 *   • topic registry has the 15 expected entries
 *   • cookie round-trip works
 *   • isEnabled / anyEnabled defaults are sane
 *   • marked extension recognises [[t:topic]]…[[/t]] markers,
 *     renders them as <div class="topic-block" data-topic="…">,
 *     handles multi-topic markers (math,history), and doesn't
 *     eat its own /t close when nesting occurs.
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
// it with a tiny backing map so writeCookieMap() actually persists.
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
		// strip attributes like "; path=/; max-age=..." by taking only the value
		const semi = rest.indexOf(';');
		const v = (semi === -1 ? rest : rest.substring(0, semi)).trim();
		// if expires is in the past, delete
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

// Marked mock that exposes .use() and a tagged-template renderer
// capable of recognising our extension's output.
global.marked = {
	use(cfg) { this._extension = cfg.extensions[0]; },
	parse(src) {
		const ext = this._extension;
		if (!ext) return '<p>' + src + '</p>';
		const ctx = {
			lexer: {
				blockTokens(inner) {
					// produce a single paragraph token whose text is the raw inner
					return [{ type: 'paragraph', text: inner, tokens: [
						{ type: 'text', text: inner, tokens: [] }
					]}];
				}
			},
			parser: { parse(tokens) { return '<p>' + (tokens[0].text || '') + '</p>'; } }
		};
		// Run the extension's tokenizer until it stops matching.
		let out = '';
		let rest = src;
		while (true) {
			const i = ext.start(rest);
			if (i === undefined || i < 0) { out += rest; break; }
			out += rest.substring(0, i);
			rest = rest.substring(i);
			const tok = ext.tokenizer.call(ctx, rest);
			if (!tok) {
				// not at a valid marker start — emit one char and advance
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
check(BT.TOPICS.length === 15, 'TOPICS has exactly 15 entries (got ' + BT.TOPICS.length + ')');

const expectedIds = [
	'math', 'statistics', 'programming', 'architecture', 'data',
	'hardware', 'vision', 'audio', 'agents', 'language',
	'history', 'philosophy', 'ethics', 'society', 'interactive'
];
expectedIds.forEach(function (id) {
	check(BT.TOPICS.some(function (t) { return t.id === id; }),
		'TOPICS contains "' + id + '"');
});

// defaults
check(BT.isEnabled('math') === true, 'math is enabled by default');
check(BT.isEnabled('nonexistent') === true, 'unknown topics are enabled by default');

// OR-logic on multi-topic blocks
check(BT.anyEnabled(['nonexistent']) === true, 'anyEnabled on unknown-only → true');
check(BT.anyEnabled(['math', 'nonexistent']) === true, 'anyEnabled(math,unknown) → true');

// Cookie round-trip
BT.setEnabled('math', false);
check(BT.isEnabled('math') === false, 'after setEnabled(math, false) — disabled');
check(document.cookie.indexOf('topics_pref=') !== -1, 'cookie written');
BT.setEnabled('math', true);
check(BT.isEnabled('math') === true, 'after setEnabled(math, true) — enabled');

// Cookie format
document.cookie = 'topics_pref=' + encodeURIComponent(JSON.stringify({ math: false, history: true }));
check(BT.isEnabled('math') === false, 'cookie state respected (math off)');
check(BT.isEnabled('history') === true, 'cookie state respected (history on)');
// cleanup
document.cookie = 'topics_pref=; expires=Thu, 01 Jan 1970 00:00:00 GMT';

// ── Marked extension behaviour ──
// preprocess() is what registers the extension in real use; do it once.
BT.preprocess('');

function render(src) { return marked.parse(src); }

const sample1 = '[[t:math]]\n## M\n\ncontent\n[[/t]]';
const html1 = render(sample1);
check(/<div class="topic-block" data-topic="math">/.test(html1),
	'single-topic block renders <div data-topic="math">');

const sample2 = '[[t:math,history]]\nmulti\n[[/t]]';
const html2 = render(sample2);
check(/data-topic="math history"/.test(html2),
	'multi-topic block space-separated in data-topic');

const sample3 = '[[t:math]]\nA\n[[/t]]\n\n[[t:history]]\nB\n[[/t]]';
const html3 = render(sample3);
const matches = html3.match(/data-topic="([^"]+)"/g) || [];
check(matches.length === 2,
	'two separate blocks produce two data-topic attrs (got ' + matches.length + ')');
check(/data-topic="math"/.test(html3), 'first block is math');
check(/data-topic="history"/.test(html3), 'second block is history');

// Adjacent markers — closing then immediately opening another
const sample4 = '[[t:math]]A[[/t]][[t:history]]B[[/t]]';
const html4 = render(sample4);
const adjMatches = html4.match(/data-topic="[^"]+"/g) || [];
check(adjMatches.length === 2,
	'two adjacent blocks render (got ' + adjMatches.length + ')');
check(/data-topic="math"/.test(html4) && /data-topic="history"/.test(html4),
	'adjacent blocks produce distinct topic attrs');

// Case insensitive
const sample5 = '[[t:MATH]]\nX\n[[/t]]';
const html5 = render(sample5);
check(/data-topic="math"/.test(html5), 'topic id lowercased');

// Markers mid-paragraph still work (marked treats them as blocks)
const sample6 = 'before [[t:math]]\nblock\n[[/t]] after';
const html6 = render(sample6);
check(/data-topic="math"/.test(html6), 'mid-paragraph marker still produces a block');

// Missing close marker leaves content untouched
const sample7 = '[[t:math]]\nUnclosed\n\nNot closed';
const html7 = render(sample7);
check(!/<div class="topic-block"/.test(html7),
	'unclosed marker does not produce a topic block');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
