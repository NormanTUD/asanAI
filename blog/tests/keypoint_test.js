/* Node smoke test for keypoint.js — turning `>` blockquotes into
 * .kp-block cards. Run with:  node tests/keypoint_test.js
 *
 * Uses a small DOM stub (with a read-only `firstChild` getter, like a
 * real DOM) so the DOM-mutation logic is actually exercised. Verifies:
 *   • a short statement blockquote → .kp-block, data-kp="summary"
 *   • a `?`-ending blockquote → data-kp="question"
 *   • an attributed quote (byline on its own line) → card + .kp-source
 *   • an attributed quote whose byline holds a citation link is NOT
 *     mistaken for the formal quote system
 *   • >2 paragraphs, >500 chars, complex content, formal <footer>,
 *     empty, outside .md, and already-tagged nodes are all left alone
 *   • the DOM swap actually lands (div replaces the blockquote)
 */

'use strict';

global.window = global;

/* ── tiny DOM element stub ─────────────────────────────────── */
function makeEl(tag, opts) {
	opts = opts || {};
	const el = {
		nodeType: 1,
		tagName: (tag || 'div').toUpperCase(),
		children: [],
		parentNode: opts.parent || null,
		dataset: Object.assign({}, opts.dataset || {}),
		className: opts.className || '',
		_ownText: (typeof opts.text === 'string') ? opts.text : ''
	};
	// textContent: own text + descendants (real-DOM-like)
	Object.defineProperty(el, 'textContent', {
		get: function () {
			return el._ownText + el.children.map(function (c) { return c.textContent || ''; }).join('');
		},
		set: function (v) { el._ownText = String(v); }
	});
	const classSet = new Set((opts.className || '').split(/\s+/).filter(Boolean));
	el.classList = {
		contains: function (c) { return classSet.has(c); },
		add: function (c) { classSet.add(c); },
		remove: function (c) { classSet.delete(c); }
	};
	el.appendChild = function (child) {
		if (!child) return child;
		if (child.parentNode) child.parentNode.removeChild(child);
		child.parentNode = el;
		el.children.push(child);
		return child;
	};
	el.removeChild = function (child) {
		const i = el.children.indexOf(child);
		if (i !== -1) el.children.splice(i, 1);
		child.parentNode = null;
		return child;
	};
	el.replaceChild = function (newNode, oldNode) {
		const i = el.children.indexOf(oldNode);
		if (i === -1) { console.error('replaceChild: oldNode not a child'); return oldNode; }
		if (newNode.parentNode) newNode.parentNode.removeChild(newNode);
		el.children[i] = newNode;
		newNode.parentNode = el;
		oldNode.parentNode = null;
		return oldNode;
	};
	// firstChild is a READ-ONLY getter in a real DOM
	Object.defineProperty(el, 'firstChild', {
		get: function () { return el.children.length ? el.children[0] : null; }
	});
	el.closest = function (sel) {
		const cls = sel && sel.charAt(0) === '.' ? sel.slice(1) : null;
		let n = el;
		while (n) {
			if (cls && n.classList && n.classList.contains(cls)) return n;
			if (sel && !cls && n.tagName && n.tagName.toLowerCase() === sel.toLowerCase()) return n;
			n = n.parentNode;
		}
		return null;
	};
	el.setAttribute = function (name, value) {
		if (name.indexOf('data-') === 0) {
			const key = name.slice(5).replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); });
			el.dataset[key] = value;
		} else el[name] = value;
	};
	el.querySelectorAll = function (sel) {
		sel = (sel || '').trim();
		if (sel === 'blockquote') {
			const out = [];
			(function walk(n) {
				(n.children || []).forEach(function (c) {
					if (c.tagName && c.tagName.toLowerCase() === 'blockquote') out.push(c);
					walk(c);
				});
			})(el);
			return out;
		}
		if (sel === ':scope > p') {
			return (el.children || []).filter(function (c) { return c.tagName && c.tagName.toLowerCase() === 'p'; });
		}
		return [];
	};
	return el;
}

global.document = { createElement: function (tag) { return makeEl(tag); } };

require('../keypoint.js');

var pass = 0, fail = 0;
function check(cond, msg) {
	if (cond) { pass++; }
	else { fail++; console.log('  FAIL: ' + msg); }
}

const KP = global.window.BlogKeypoints;
check(typeof KP === 'object', 'BlogKeypoints is exposed');
check(typeof KP.classifyBlockquote === 'function', 'classifyBlockquote is a function');
check(typeof KP.upgradeBlockquote === 'function', 'upgradeBlockquote is a function');
check(typeof KP.upgradeBlockquotes === 'function', 'upgradeBlockquotes is a function');

/* helpers to build a .md > blockquote > p(...) tree */
function inMd() { return makeEl('div', { className: 'md' }); }
function para(text, opts) { return makeEl('p', Object.assign({ text: text }, opts || {})); }
function bqWith(md, paragraphs) {
	const bq = makeEl('blockquote');
	md.appendChild(bq);
	paragraphs.forEach(function (p) { bq.appendChild(p); });
	return bq;
}

// 1. short statement → summary
{
	const md = inMd();
	const bq = bqWith(md, [para('A network with one hidden layer approximates any function.')]);
	const r = KP.classifyBlockquote(bq);
	check(r && r.kind === 'summary' && !r.source, 'statement → summary, no source');
}

// 2. question → question
{
	const md = inMd();
	const bq = bqWith(md, [para('Why does depth beat width?')]);
	const r = KP.classifyBlockquote(bq);
	check(r && r.kind === 'question', 'trailing ? → question');
}

// 3. attributed quote (byline) → summary + source line
{
	const md = inMd();
	const quoteP = para('I believe one will be able to speak of machines thinking.');
	const bylineP = para('\u2014 Alan Turing (1950)');
	const bq = bqWith(md, [quoteP, bylineP]);
	const r = KP.classifyBlockquote(bq);
	check(r && r.kind === 'summary' && r.source === bylineP, 'byline detected as source');
	check(KP.upgradeBlockquote(bq, r) === true, 'attributed quote upgraded');
	const div = md.children[0];
	check(div && div.className === 'kp-block' && div.dataset.kp === 'summary', 'blockquote replaced by .kp-block[summary]');
	check(div.children.length === 2, 'card keeps both paragraphs');
	check(div.children[1].classList.contains('kp-source'), 'byline restyled as .kp-source');
}

// 4. byline with a citation link is NOT mistaken for the formal quote system
{
	const md = inMd();
	const a = makeEl('a', { className: 'cite-stealth', dataset: { target: 'bib-turing1950computing' }, text: 'Alan Turing' });
	const icon = makeEl('span', { className: 'bibtexify_auto_link_icon', dataset: { citeUrl: 'https://x' } }, );
	a.appendChild(icon);
	const bylineP = makeEl('p', { text: '\u2014 ' });
	bylineP.appendChild(a);
	const bq = bqWith(md, [para('Machines will be able to think.'), bylineP]);
	const r = KP.classifyBlockquote(bq);
	check(r && r.source === bylineP, 'cite-stealth byline is still a keypoint source (not the formal system)');
}

// 4b. single-<p> inline byline (marked joins the two > lines into one
//     paragraph) → still becomes a card; the byline stays inline
{
	const md = inMd();
	const p = makeEl('p', { text: 'I believe one will be able to speak of machines thinking. \u2014 Alan Turing (1950)' });
	const bq = makeEl('blockquote');
	md.appendChild(bq);
	bq.appendChild(p);
	const r = KP.classifyBlockquote(bq);
	check(r && r.kind === 'summary', 'inline-byline single-<p> still qualifies');
	check(KP.upgradeBlockquote(bq, r) === true, 'inline-byline single-<p> upgraded to a card');
	check(md.children[0].className === 'kp-block', 'inline-byline blockquote became a .kp-block');
}

// 5. >2 paragraphs → skip
{
	const md = inMd();
	const bq = bqWith(md, [para('one'), para('two'), para('three')]);
	check(KP.classifyBlockquote(bq) === null, '>2 paragraphs skipped');
}

// 6. too long → skip
{
	const md = inMd();
	const long = 'x'.repeat(600);
	const bq = bqWith(md, [para(long)]);
	check(KP.classifyBlockquote(bq) === null, '>500 chars skipped');
}

// 7. complex content (<pre>) → skip
{
	const md = inMd();
	const bq = makeEl('blockquote');
	md.appendChild(bq);
	bq.appendChild(para('code follows'));
	bq.appendChild(makeEl('pre', { text: 'x = 1' }));
	check(KP.classifyBlockquote(bq) === null, 'blockquote with <pre> skipped');
}

// 8. formal attribution (<footer>) → skip
{
	const md = inMd();
	const bq = makeEl('blockquote');
	md.appendChild(bq);
	bq.appendChild(para('some words'));
	bq.appendChild(makeEl('footer', { text: '\u2014 someone' }));
	check(KP.classifyBlockquote(bq) === null, 'blockquote with <footer> left to the quote system');
}

// 9. empty → skip
{
	const md = inMd();
	const bq = makeEl('blockquote');
	md.appendChild(bq);
	check(KP.classifyBlockquote(bq) === null, 'empty blockquote skipped');
}

// 10. outside .md → skip
{
	const plain = makeEl('div', {});
	const bq = makeEl('blockquote');
	plain.appendChild(bq);
	bq.appendChild(para('not in content'));
	check(KP.classifyBlockquote(bq) === null, 'blockquote outside .md skipped');
}

// 11. already tagged → skip (idempotent)
{
	const md = inMd();
	const bq = makeEl('blockquote', { dataset: { kp: 'summary' } });
	md.appendChild(bq);
	bq.appendChild(para('again'));
	check(KP.classifyBlockquote(bq) === null, 'already-tagged blockquote skipped');
}

// 12. upgradeBlockquotes walks a container and upgrades only qualifiers
{
	const md = inMd();
	const good = bqWith(md, [para('A short key point.')]);
	const long = bqWith(md, [para(new Array(600).join('y'))]);
	const res = KP.upgradeBlockquotes(md);
	check(res.upgraded === 1 && res.skipped === 1, 'upgradeBlockquotes: 1 upgraded, 1 skipped (got ' + res.upgraded + '/' + res.skipped + ')');
	const kpDivs = md.children.filter(function (c) { return c.className === 'kp-block'; });
	check(kpDivs.length === 1, 'exactly one .kp-block div in the container');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
