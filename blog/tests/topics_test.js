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
	querySelector: function() { return null; },
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

// PHP ships the linear course as window.__moduleNavData on every lesson page.
// Model a tiny course so the learned/progress helpers have data to read.
// (window === global in this harness, so global.__moduleNavData is window's.)
global.__moduleNavData = {
	current: 1,
	modules: [
		{ slug: 'math_i',  title: 'Math I',   url: '/math_i.php',  part: 1, order: 1 },
		{ slug: 'math_ii', title: 'Math II',  url: '/math_ii.php', part: 1, order: 2 },
		{ slug: 'history', title: 'History',  url: '/history.php', part: 2, order: 1 },
		{ slug: 'turing',  title: 'Turing',   url: '/turing.php',  part: 3, order: 1 }
	]
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

/* ── math level ──────────────────────────────────────────────── */
check(typeof BT.getMathLevel === 'function', 'getMathLevel exposed');
check(typeof BT.setMathLevel === 'function', 'setMathLevel exposed');
check(BT.getMathLevel() === 50, 'default math level is 50 (University stop)');
BT.setMathLevel(80, { pushHistory: false });
check(BT.getMathLevel() === 80, 'setMathLevel(80)');
BT.setMathLevel(10, { pushHistory: false });
check(BT.getMathLevel() === 10, 'setMathLevel(10)');
BT.setMathLevel(150, { pushHistory: false });
check(BT.getMathLevel() === 100, 'setMathLevel clamps to max');
BT.setMathLevel(-10, { pushHistory: false });
check(BT.getMathLevel() === 0, 'setMathLevel clamps to min');
BT.setMathLevel(60, { pushHistory: false });

/* ── math comfort 5-stop slider ──────────────────────────────── */
check(Array.isArray(BT.MATH_LEVELS) && BT.MATH_LEVELS.length === 5, 'MATH_LEVELS has 5 stops');
check(BT.MATH_LEVELS.map(l => l.v).join(',') === '0,25,50,75,100', 'MATH_LEVELS stops are 0/25/50/75/100');
check(BT.MATH_LEVELS.every(l => typeof l.label === 'string' && l.label.length > 0), 'MATH_LEVELS labels are non-empty strings');
check(BT.snapMath(0) === 0 && BT.snapMath(25) === 25 && BT.snapMath(50) === 50 && BT.snapMath(75) === 75 && BT.snapMath(100) === 100, 'snapMath is identity on the five stops');
check(BT.snapMath(60) === 50 && BT.snapMath(72) === 75 && BT.snapMath(30) === 25 && BT.snapMath(10) === 0, 'snapMath picks the nearest stop');
check(BT.snapMath(NaN) === 50 && BT.snapMath('x') === 50 && BT.snapMath(null) === 50, 'snapMath guards non-numeric input → middle stop');
check(BT.mathLevelLabel(0) === 'No math' && BT.mathLevelLabel(25) === 'High school' && BT.mathLevelLabel(50) === 'University' && BT.mathLevelLabel(75) === 'Graduate' && BT.mathLevelLabel(100) === 'Research', 'mathLevelLabel maps each stop to its name');
check(BT.mathLevelLabel(60) === 'University' && BT.mathLevelLabel(90) === 'Research' && BT.mathLevelLabel(NaN) === 'University', 'mathLevelLabel snaps arbitrary/invalid values');

/* ── CORE_PERSONAS ───────────────────────────────────────────── */
check(Array.isArray(BT.CORE_PERSONAS), 'CORE_PERSONAS is an array');
check(BT.CORE_PERSONAS.length === 4, 'CORE_PERSONAS has exactly 4 entries');
check(BT.CORE_PERSONAS.every(p => typeof p.id === 'string' && typeof p.math === 'number' && Array.isArray(p.topics)), 'CORE_PERSONAS structure valid');

/* ── scoreUnit math gate ─────────────────────────────────────── */
withPref({ mathLevel: 20 });
const mathHigh = BT.scoreUnit(['math-i'], { mathReq: 70 });
check(mathHigh.state === 'off', 'mathLevel 20 + mathReq 70 → off');
check(mathHigh.why === 'math', 'math gate reason is "math"');

withPref({ mathLevel: 80 });
const mathOk = BT.scoreUnit(['math-i'], { mathReq: 70 });
check(mathOk.state === 'full', 'mathLevel 80 + mathReq 70 → full');
withPref(null);

/* ── math gate → masking (tuck) contract ──────────────────────
   A math-gated block is tucked when its comfort is below the
   requirement. `why === 'math'` is the signal the block state uses to
   collapse (mask) the block rather than merely dim it, and the reason
   string is what the reveal badge shows. */
withPref({ mathLevel: 0, topics: {} });
const mathMask = BT.scoreUnit(['math-i', 'math-ii'], { mathReq: 45 });
check(mathMask.state === 'off' && mathMask.why === 'math', 'math gate tucks the block (why=math) even with all interests on');
check(/needs .*math \(you are at .*\)/.test(mathMask.reason), 'math-off reason reads "needs … math (you are at …)" for the badge');

// boundary: comfort exactly at the requirement is NOT tucked (gate is <)
withPref({ mathLevel: 45, topics: {} });
check(BT.scoreUnit(['math-i'], { mathReq: 45 }).state === 'full', 'mathLevel == mathReq → full (gate is strictly below)');

// a switched-off suppress category is the binding reason before math
withPref({ mathLevel: 0, topics: {}, categories: { 'math-heavy': false } });
const catWins = BT.scoreUnit(['math-i', 'math-heavy'], { mathReq: 99 });
check(catWins.state === 'off' && catWins.why === 'category', 'a switched-off suppress category outranks the math gate');
withPref(null);

/* ── learned state + course progress ─────────────────────────── */
check(Array.isArray(BT.courseOrder()) && BT.courseOrder().length === 4, 'courseOrder() exposes the course modules');
check(BT.courseIndexOf('math_i') === 0, 'courseIndexOf by underscore slug');
check(BT.courseIndexOf('math-i') === 0, 'courseIndexOf by hyphen lesson id');
check(BT.courseIndexOf('turing') === 3, 'courseIndexOf last module');
check(BT.courseIndexOf('nope') === -1, 'courseIndexOf unknown → -1');

check(BT.depsMet('math-i') === true, 'depsMet base lesson (no deps) → true');
check(BT.depsMet('math-ii') === false, 'depsMet math-ii (needs math-i) → false');

withPref(null);
check(BT.countLearned() === 0, 'countLearned() 0 when nothing learned');

// seed learned state directly (needs a v2 pref so `learned` is preserved)
withPref({ topics: {}, learned: { 'math_i': true } });
check(BT.isLearned('math_i') === true, 'isLearned (slug form) from stored pref');
check(BT.countLearned() === 1, 'countLearned counts a learned module (slug form)');

withPref({ topics: {}, learned: { 'math-ii': true } });
check(BT.countLearned() === 1, 'countLearned counts a learned module (hyphen form)');

// toggleLearned round-trip on a LESSON_DEPS key
withPref(null);
check(BT.isLearned('math-i') === false, 'math-i not learned initially');
BT.toggleLearned('math-i');
check(BT.isLearned('math-i') === true, 'toggleLearned marks math-i learned');
check(BT.depsMet('math-ii') === true, 'depsMet math-ii after learning math-i');
check(BT.countLearned() === 1, 'countLearned 1 after toggling math-i');
BT.toggleLearned('math-i');
check(BT.isLearned('math-i') === false, 'toggleLearned again un-learns math-i');
check(BT.countLearned() === 0, 'countLearned 0 after un-learning');

// toggleLearned accepts ANY real course lesson (not just LESSON_DEPS keys)
BT.toggleLearned('turing');
check(BT.isLearned('turing') === true, 'toggleLearned accepts a plain course lesson');
check(BT.countLearned() === 1, 'countLearned counts the course lesson');

// guard: an id that is neither a LESSON_DEPS key nor a course lesson is a no-op
const before = BT.countLearned();
BT.toggleLearned('definitely-not-a-lesson');
check(BT.isLearned('definitely-not-a-lesson') === false, 'toggleLearned rejects unknown id (no-op)');
check(BT.countLearned() === before, 'countLearned unchanged after rejected toggle');
withPref(null);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
