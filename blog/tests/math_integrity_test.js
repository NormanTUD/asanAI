/* Node integrity test for the math-rendering pipeline.
 * Run with:  node tests/math_integrity_test.js
 *
 * Background (the Chromium-only equation leak):
 * temml renders equations with annotate:true, which parks the raw LaTeX
 * source in an <annotation> child of the rendered <math>. renderMarkdown()
 * runs by design more than once (init.js onload + runPostLoad), and each
 * later pass re-parses the SERIALIZED container HTML through marked. The
 * math-protection hook must therefore stash already-rendered <math>
 * elements in addition to the $…$/$$…$$ regions — otherwise the raw source
 * is fed through markdown emphasis (…_{x}… → <em>…), and Chromium's HTML
 * parser then hoists the <em> OUT of the <math>, printing raw LaTeX next
 * to the equation (Firefox hides the mangled text inside the annotation).
 *
 * Covered here:
 *   1. The REAL installMathProtection hook (extracted from helper.js):
 *      rendered <math> (incl. nested eqref math) survives marked.parse
 *      verbatim and re-parsing is idempotent; the pre-existing behaviour
 *      is unchanged ($$…$$/$…$ protection, $100 currency heuristic,
 *      ordinary markdown).
 *   2. The real _stampMathTex / _extractLatex contracts (extracted from
 *      start.js): data-tex is stamped from pristine annotations only,
 *      never overwritten, and outranks a mangled annotation.
 *   3. The real stashContainerMath/restoreContainerMath DOM backstop
 *      (extracted from helper.js): node identity, lost-placeholder
 *      recovery.
 *   4. Static guardrails: CSS hides annotations, _temmlOpts ignores
 *      <math>, _extractLatex prefers data-tex, the runtime integrity scan
 *      exists.
 */

'use strict';

const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function check(cond, msg) { if (cond) pass++; else { fail++; console.log('  FAIL: ' + msg); } }

const BLOG = path.join(__dirname, '..');

/* Extract a top-level `function name` source by brace matching. */
function extractFunction(src, name) {
	const start = src.indexOf('function ' + name);
	if (start === -1) return null;
	const i = src.indexOf('{', start);
	if (i === -1) return null;
	let depth = 0;
	for (let j = i; j < src.length; j++) {
		if (src[j] === '{') depth++;
		else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
	}
	return null;
}

const helperSrc = fs.readFileSync(path.join(BLOG, 'helper.js'), 'utf8');
const startSrc = fs.readFileSync(path.join(BLOG, 'start.js'), 'utf8');
const styleSrc = fs.readFileSync(path.join(BLOG, 'style.css'), 'utf8');

/* ══ 1. The real math-protection hook (helper.js) ══════════════════ */

const hookMarker = '(function installMathProtection() {';
const hookAt = helperSrc.indexOf(hookMarker);
check(hookAt !== -1, 'installMathProtection IIFE found in helper.js');

	let hookSrc = null;
	if (hookAt !== -1) {
		const firstBrace = helperSrc.indexOf('{', hookAt + hookMarker.length - 1);
		let depth = 0;
		for (let j = firstBrace; j < helperSrc.length; j++) {
			if (helperSrc[j] === '{') depth++;
			else if (helperSrc[j] === '}') {
				depth--;
				if (depth === 0) {
					// include the IIFE's trailing '})();' so the statement is complete
					const tail = helperSrc.slice(j, j + 5);
					hookSrc = helperSrc.slice(hookAt, tail === '})();' ? j + 5 : j + 1);
					break;
				}
			}
		}
	}
check(!!hookSrc, 'installMathProtection IIFE source extracted');

const marked = require(path.join(BLOG, 'marked.min.js')).marked;
const fakeWindow = {};
fakeWindow.marked = marked;
const hookFactory = new Function('window', hookSrc); // IIFE self-executes
hookFactory(fakeWindow);
check(fakeWindow.__mathHooksInstalled === true, 'hook installed on the marked instance');

/* The exact shape of a temml-rendered display equation (annotate:true). */
const RENDERED_MATH =
	'<math display="block" class="tml-display" style="display:block math;">' +
	'<semantics><mrow><munder><mi>A</mi><mo stretchy="true" style="math-depth:0;">⏟</mo></munder>' +
	'<mstyle scriptlevel="1"><mtable class="tml-small"><mtr><mtd style="padding-left:0em;padding-right:0em;">' +
	'<mi>B</mi></mtd></mtr></mtable></mstyle></munder></mrow>' +
	'<annotation encoding="application/x-tex">\\underbrace{A}_{\\substack{B}} \\underbrace{C}_{D}</annotation>' +
	'</semantics></math>';
const ANNOTATION_TEX = '\\underbrace{A}_{\\substack{B}} \\underbrace{C}_{D}';

// T1 — a rendered equation with a mangle-prone source survives marked.parse
const t1in = '<p><span>' + RENDERED_MATH + '</span></p>';
const t1 = marked.parse(t1in);
check(t1.indexOf(RENDERED_MATH) !== -1, 'rendered <math> survives marked.parse verbatim');
check(t1.indexOf('<em>') === -1, 'no <em> produced inside rendered math (T1)');
check(t1.indexOf(ANNOTATION_TEX) !== -1, 'annotation source stays pristine (T1)');
check(marked.parse(t1) === t1, 're-parsing rendered HTML is idempotent (T1)');

// T2 — nested math (temml eqref emits a <math> inside an mtext)
const t2 = '<p><math><mtext>see <math>\\ref{eq1}</math> here</mtext></math></p>';
const t2out = marked.parse(t2);
check(t2out.indexOf(t2.slice(4, -5)) !== -1, 'nested <math> survives as one unit (T2)');
check(marked.parse(t2out) === t2out, 'nested math re-parse idempotent (T2)');

// T3 — block math protection still works (the original bug shape)
const t3 = 'Before $$\\underbrace{A}_{\\substack{B}}$$ after';
const t3out = marked.parse(t3);
check(t3out.indexOf('$$\\underbrace{A}_{\\substack{B}}$$') !== -1, '$$…$$ stashed & restored (T3)');
check(t3out.indexOf('<em>') === -1, 'no <em> inside $$…$$ (T3)');

// T4 — inline math protection still works
const t4 = 'The term $x_{ij}$ matters';
const t4out = marked.parse(t4);
check(t4out.indexOf('$x_{ij}$') !== -1, '$…$ stashed & restored (T4)');
check(t4out.indexOf('<em>') === -1, 'no <em> inside $…$ (T4)');

// T5 — currency heuristic still untouched
const t5 = 'It costs $100 and $200 total';
const t5out = marked.parse(t5);
check(t5out.indexOf('$100 and $200') !== -1, 'currency stays literal (T5)');

// T6 — mixed content: markdown still markdown, math stays math
// (a leading <div> would make the whole chunk a raw HTML block, so use
//  real paragraph flow instead)
const t6in = 'Use **bold** and $a_{i}$ plus\n\n' + RENDERED_MATH;
const t6out = marked.parse(t6in);
check(t6out.indexOf('<strong>bold</strong>') !== -1, 'emphasis still parsed in prose (T6)');
check(t6out.indexOf(RENDERED_MATH) !== -1, 'rendered math intact in mixed container (T6)');
check(t6out.indexOf('$a_{i}$') !== -1, 'inline math intact in mixed container (T6)');
check(t6out.indexOf('<em>') === -1, 'no <em> anywhere in mixed container (T6)');

// T7 — <mathematic> (alphanumeric after <math) is NOT a math element
const t7 = '<p><mathematic>foo</mathematic></p>';
const t7out = marked.parse(t7);
check(t7out.indexOf('<mathematic>foo</mathematic>') !== -1, '<mathematic> untouched (T7)');

// T8 — unbalanced <math (no close) is left alone, no crash
let t8ok = true;
let t8out = '';
try { t8out = marked.parse('<p><math display="block"><mrow><mi>x</mi>'); } catch (e) { t8ok = false; }
check(t8ok, 'unbalanced <math does not throw (T8)');
check(t8out.indexOf('<math display="block">') !== -1, 'unbalanced <math passes through (T8)');

/* ══ 2. data-tex stamping + extraction (start.js) ══════════════════ */

const stampSrc = extractFunction(startSrc, '_stampMathTex');
check(!!stampSrc, '_stampMathTex exists in start.js');

function stubAnn(pristine, text) {
	const textNode = { nodeType: 3, textContent: text };
	return {
		nodeType: 1,
		childNodes: pristine ? [textNode] : [{ nodeType: 1 }, textNode],
		firstChild: pristine ? textNode : { nodeType: 1 },
		textContent: text
	};
}
function stubMath(attrs, ann) {
	const m = {
		nodeType: 1,
		_attrs: Object.assign({}, attrs || {}),
		getAttribute(n) { return this._attrs[n] !== undefined ? this._attrs[n] : null; },
		setAttribute(n, v) { this._attrs[n] = v; },
		querySelector(sel) { return sel === 'annotation[encoding="application/x-tex"]' ? ann : null; }
	};
	return m;
}
if (stampSrc) {
	const _stampMathTex = new Function(stampSrc + '\nreturn _stampMathTex;')();

	const m1 = stubMath({}, stubAnn(true, '  \\frac{a}{b}  '));
	const m2 = stubMath({}, stubAnn(false, '\\frac{a}{b}'));
	const m3 = stubMath({ 'data-tex': 'original' }, stubAnn(true, 'corrupted-later'));
	const root = { nodeType: 1, querySelectorAll: (sel) => (sel === 'math' ? [m1, m2, m3] : []) };
	_stampMathTex(root);
	check(m1.getAttribute('data-tex') === '\\frac{a}{b}', 'stamps trimmed source from pristine annotation (B1)');
	check(m2.getAttribute('data-tex') === null, 'does NOT stamp from a mangled annotation (B2)');
	check(m3.getAttribute('data-tex') === 'original', 'never overwrites an existing data-tex (B3)');
	_stampMathTex(root);
	check(m1.getAttribute('data-tex') === '\\frac{a}{b}', 'stamping is idempotent (B4)');
}

const extractSrc = extractFunction(startSrc, '_extractLatex');
check(!!extractSrc, '_extractLatex exists in start.js');
if (extractSrc) {
	const _extractLatex = new Function(extractSrc + '\nreturn _extractLatex;')();
	const ann = { textContent: 'PRISTINE' };
	const mBoth = {
		dataset: { tex: '  CANONICAL ' },
		querySelector: (sel) => (sel === 'annotation[encoding="application/x-tex"]' ? ann : null),
		closest: () => null
	};
	check(_extractLatex(mBoth) === 'CANONICAL', 'data-tex outranks the annotation (P1)');
	const mAnn = {
		dataset: {},
		querySelector: (sel) => (sel === 'annotation[encoding="application/x-tex"]' ? ann : null),
		closest: () => null
	};
	check(_extractLatex(mAnn) === 'PRISTINE', 'falls back to annotation without data-tex (P2)');
	const mWrap = {
		dataset: {},
		querySelector: () => null,
		closest: (sel) => (sel === '.temml' ? { dataset: { tex: 'wrapper' } } : null)
	};
	check(_extractLatex(mWrap) === 'wrapper', 'falls back to .temml wrapper data-tex (P3)');
	check(_extractLatex({ dataset: {}, querySelector: () => null, closest: () => null }) === null, 'null when no source at all (P4)');
}

/* ══ 3. renderMarkdown DOM backstop (helper.js) ════════════════════ */

const stashSrc = extractFunction(helperSrc, 'stashContainerMath');
const restoreSrc = extractFunction(helperSrc, 'restoreContainerMath');
check(!!stashSrc, 'stashContainerMath exists in helper.js');
check(!!restoreSrc, 'restoreContainerMath exists in helper.js');

if (stashSrc && restoreSrc) {
	const fns = new Function(stashSrc + '\n' + restoreSrc + '\nreturn { stashContainerMath, restoreContainerMath };')();

	let errors = [];
	const realErr = console.error;
	console.error = (m) => { errors.push(String(m)); };

	const mathNode = {
		replaceWith(ph) { this._replacedBy = ph; },
		appendChild() {},
		get isConnected() { return this._connected === true; }
	};
	mathNode._connected = false;
	const placeholder = {
		_attrs: {},
		setAttribute(n, v) { this._attrs[n] = v; },
		getAttribute(n) { return this._attrs[n] !== undefined ? this._attrs[n] : null; },
		replaceWith(m) { m._connected = true; this._removed = true; },
		remove() { this._removed = true; }
	};
	const container = {
		_ph: placeholder,
		querySelectorAll(sel) {
			if (sel === 'math') return [mathNode];
			if (sel === '[data-mn-math-ph]') return placeholder._removed ? [] : [placeholder];
			return [];
		},
		appendChild(m) { m._connected = true; this._appended = m; }
	};
	global.document = { createElement: () => placeholder };

	const stashed = fns.stashContainerMath(container);
	check(stashed.length === 1 && stashed[0] === mathNode, 'stash returns the math nodes (D1)');
	check(placeholder._attrs['data-mn-math-ph'] === '0', 'placeholder carries its index (D1)');
	check(mathNode._replacedBy === placeholder, 'math node replaced by placeholder (D1)');

	fns.restoreContainerMath(container, stashed);
	check(mathNode.isConnected === true, 'restored node is re-connected (D2)');
	check(placeholder._removed === true, 'placeholder removed after restore (D2)');

	// lost-placeholder recovery
	const lostNode = { _connected: false, replaceWith() {}, appendChild() {}, get isConnected() { return this._connected === true; } };
	const lostContainer = {
		querySelectorAll() { return []; },
		appendChild(m) { m._connected = true; this._appended = m; }
	};
	fns.restoreContainerMath(lostContainer, [lostNode]);
	check(lostNode.isConnected === true && lostContainer._appended === lostNode, 'lost placeholder → math re-appended (D3)');
	check(errors.some(e => e.indexOf('<math> placeholder lost') !== -1), 'lost placeholder raises a loud error (D3)');

	console.error = realErr;
}

/* ══ 4. Static guardrails ══════════════════════════════════════════ */

// S1 — the temml walker must ignore already-rendered math (and keep defaults)
const ig = startSrc.match(/_temmlOpts\s*=\s*\{[\s\S]*?ignoredTags:\s*\[([^\]]*)\]/);
check(!!ig, '_temmlOpts.ignoredTags present (S1)');
if (ig) {
	const tags = ig[1];
	check(/["']math["']/.test(tags), 'ignoredTags contains "math" (S1)');
	['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'].forEach(t => {
		check(tags.indexOf(t) !== -1, 'ignoredTags keeps default tag ' + t + ' (S1)');
	});
}

// S2 — popup source of record: data-tex before annotation
if (extractSrc) {
	check(extractSrc.indexOf('dataset.tex') !== -1 &&
	      extractSrc.indexOf('dataset.tex') < extractSrc.indexOf('annotation[encoding'),
	      '_extractLatex reads data-tex before the annotation (S2)');
}

// S3 — stamping wired into every render path
const stampCalls = (startSrc.match(/_stampMathTex\(/g) || []).length;
check(stampCalls >= 5, '_stampMathTex defined + called on all render paths (S3, found ' + stampCalls + ')');

// S4 — CSS hides annotations in every browser
check(/math\s+annotation\s*\{[^}]*display:\s*none/.test(styleSrc), 'style.css hides math annotations (S4)');

// S5 — renderMarkdown DOM backstop wired into all three parse targets
const stashCalls = (helperSrc.match(/stashContainerMath\(/g) || []).length;
const restoreCalls = (helperSrc.match(/restoreContainerMath\(/g) || []).length;
check(stashCalls >= 4, 'stashContainerMath wired into md + footnotes + sources (S5, found ' + stashCalls + ')');
check(restoreCalls >= 4, 'restoreContainerMath wired into md + footnotes + sources (S5, found ' + restoreCalls + ')');

// S6 — runtime integrity scan (silent when healthy, SEVERE on violation)
check(startSrc.indexOf('mathIntegrityScan') !== -1, 'runtime mathIntegrityScan exists (S6)');
const scanSrc = startSrc.slice(startSrc.indexOf('function mathIntegrityScan'));
check(scanSrc.indexOf('console.error') !== -1, 'integrity scan raises SEVERE on violation (S6)');
check(scanSrc.indexOf('annotation is visible') !== -1, 'integrity scan checks annotation visibility (S6)');
check(scanSrc.indexOf('.lp-overlay') !== -1, 'integrity scan skips the popup preview clone (S6)');

/* ══════════════════════════════════════════════════════════════════ */
console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
