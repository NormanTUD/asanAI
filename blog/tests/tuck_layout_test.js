/* Node DOM-level integration test for the tuck/reveal LAYOUT code in
 * topics.js. Run with:  node tests/tuck_layout_test.js
 *
 * Uses a small but real element tree (not the flat mock of topics_test.js)
 * so sibling placement, section boundaries, grouped badges and the
 * end-of-article settle order can actually be verified:
 *
 *   T1  fold-away button sits at the SECTION end (sibling after trailing
 *       demos, before the next heading) — never a child of the block
 *   T2  a run of ≥2 consecutive tucked sections collapses into ONE group
 *       badge listing every section heading; member badges are removed
 *   T3  tapping the group badge reveals the whole run, removes the badge
 *       and leaves one fold-away button per section
 *   T4  visible content between two tucked sections BREAKS the run
 *       (two solo badges, no group)
 *   T5  learned button + course status box settle to the end of the
 *       article in the order: content → button → box → footnotes/sources
 *   T6  self-heal: a collapsed block that lost its badge gets it back on
 *       the next applyVisibility pass
 *   T7  idempotency: a second applyVisibility creates no duplicate badges
 *       and moves nothing
 */

'use strict';

/* ── mini DOM ────────────────────────────────────────────────── */
function matchPart(node, part) {
	if (!node || node.nodeType !== 1) return false;
	const p = part.trim();
	let tag = null, id = null;
	const cls = [], attrs = [];
	let i = 0;
	while (i < p.length) {
		const ch = p[i];
		if (ch === '#') { const m = p.slice(i).match(/^#([\w-]+)/); id = m[1]; i += m[0].length; }
		else if (ch === '.') { const m = p.slice(i).match(/^\.([\w-]+)/); cls.push(m[1]); i += m[0].length; }
		else if (ch === '[') { const m = p.slice(i).match(/^\[([\w-]+)(?:="([^"]*)")?\]/); attrs.push([m[1], m[2] === undefined ? null : m[2]]); i += m[0].length; }
		else if (ch === ':' || ch === ' ') { i += 1; } // pseudo-classes / combinators: not needed here
		else if (/[a-zA-Z]/.test(ch)) { const m = p.slice(i).match(/^[a-zA-Z][\w-]*/); tag = m[0].toUpperCase(); i += m[0].length; }
		else { i += 1; }
	}
	if (tag && node.tagName !== tag) return false;
	if (id && node.id !== id) return false;
	for (let c = 0; c < cls.length; c++) if (!node._cls[cls[c]]) return false;
	for (let a = 0; a < attrs.length; a++) {
		const av = node.getAttribute(attrs[a][0]);
		if (attrs[a][1] === null) { if (av === null) return false; }
		else if (av !== attrs[a][1]) return false;
	}
	return true;
}
function matchesSel(node, sel) {
	return String(sel).split(',').some(function (part) { return matchPart(node, part); });
}
function collect(root, out) {
	root.children.forEach(function (c) { out.push(c); collect(c, out); });
}
let _qToken = 0;
function queryAll(root, sel) {
	const out = [];
	String(sel).split(',').forEach(function (part) {
		const p = part.trim();
		if (p.indexOf(':scope > ') === 0) {
			// direct children of `root` matching the rest
			const rest = p.slice(':scope > '.length);
			root.children.forEach(function (c) { if (matchesSel(c, rest)) out.push(c); });
		} else {
			const all = [];
			collect(root, all);
			all.forEach(function (n) { if (matchesSel(n, p)) out.push(n); });
		}
	});
	const tok = ++_qToken;
	const res = [];
	out.forEach(function (n) { if (n.__qseen !== tok) { n.__qseen = tok; res.push(n); } });
	return res;
}

function makeEl(tag) {
	const el = {
		nodeType: 1,
		tagName: String(tag || 'div').toUpperCase(),
		_cls: Object.create(null),
		_attrs: Object.create(null),
		_listeners: {},
		children: [],
		parentNode: null,
		style: {},
		dataset: {},
		id: '',
		type: '',
		title: '',
		innerHTML: '',
		disabled: false,
		offsetWidth: 0,
		offsetHeight: 0,
		scrollHeight: 0
	};
	Object.defineProperty(el, 'textContent', {
		get: function () {
			return (el._text || '') + el.children.map(function (c) {
				return c.nodeType === 1 ? c.textContent : (c.textContent || '');
			}).join('');
		},
		set: function (v) { el._text = String(v); el.children.length = 0; }
	});
	el.classList = {
		add: function () { for (let i = 0; i < arguments.length; i++) el._cls[arguments[i]] = true; },
		remove: function () { for (let i = 0; i < arguments.length; i++) delete el._cls[arguments[i]]; },
		contains: function (c) { return !!el._cls[c]; },
		toggle: function (c, force) {
			const want = force === undefined ? !el._cls[c] : !!force;
			if (want) el._cls[c] = true; else delete el._cls[c];
			return want;
		}
	};
	Object.defineProperty(el, 'className', {
		get: function () { return Object.keys(el._cls).join(' '); },
		set: function (v) {
			el._cls = Object.create(null);
			String(v).split(/\s+/).filter(Boolean).forEach(function (c) { el._cls[c] = true; });
		}
	});
	el.setAttribute = function (k, v) { el._attrs[k] = String(v); if (k === 'id') el.id = String(v); };
	el.getAttribute = function (k) { return k in el._attrs ? el._attrs[k] : null; };
	el.appendChild = function (c) {
		// DOM spec: no-op when c is already the last child (browsers do not
		// move/reflow in that case — the production code relies on it).
		if (el.children.length && el.children[el.children.length - 1] === c) return c;
		if (c.parentNode) c.parentNode.removeChild(c);
		c.parentNode = el; el.children.push(c); return c;
	};
	el.removeChild = function (c) {
		const i = el.children.indexOf(c);
		if (i === -1) throw new Error('removeChild: not a child');
		el.children.splice(i, 1); c.parentNode = null; return c;
	};
	el.insertBefore = function (c, ref) {
		if (ref === null) return el.appendChild(c);
		const i = el.children.indexOf(ref);
		if (i === -1) throw new Error('insertBefore: reference node is not a child');
		// DOM spec: no-op when c is already the reference's previous sibling.
		if (el.children[i - 1] === c) return c;
		if (c.parentNode) c.parentNode.removeChild(c);
		c.parentNode = el; el.children.splice(i, 0, c); return c;
	};
	el.remove = function () { if (el.parentNode) el.parentNode.removeChild(el); };
	el.addEventListener = function (t, fn) { (el._listeners[t] = el._listeners[t] || []).push(fn); };
	el.removeEventListener = function (t, fn) {
		const l = el._listeners[t]; if (!l) return;
		const i = l.indexOf(fn); if (i !== -1) l.splice(i, 1);
	};
	el.click = function () {
		(el._listeners.click || []).slice().forEach(function (fn) {
			fn.call(el, { target: el, stopPropagation: function () {}, preventDefault: function () {} });
		});
	};
	el.getBoundingClientRect = function () { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }; };
	el.focus = function () {};
	el.blur = function () {};
	Object.defineProperty(el, 'parentElement', { get: function () { return el.parentNode; } });
	Object.defineProperty(el, 'nextElementSibling', { get: function () {
		if (!el.parentNode) return null;
		const s = el.parentNode.children, i = s.indexOf(el);
		return (i !== -1 && s[i + 1]) ? s[i + 1] : null;
	} });
	Object.defineProperty(el, 'previousElementSibling', { get: function () {
		if (!el.parentNode) return null;
		const s = el.parentNode.children, i = s.indexOf(el);
		return i > 0 ? s[i - 1] : null;
	} });
	Object.defineProperty(el, 'lastElementChild', { get: function () {
		return el.children.length ? el.children[el.children.length - 1] : null;
	} });
	Object.defineProperty(el, 'firstElementChild', { get: function () {
		return el.children.length ? el.children[0] : null;
	} });
	el.querySelectorAll = function (sel) { return queryAll(el, sel); };
	el.querySelector = function (sel) { return queryAll(el, sel)[0] || null; };
	el.matches = function (sel) { return matchesSel(el, sel); };
	el.closest = function (sel) {
		let n = el;
		while (n) { if (n.nodeType === 1 && matchesSel(n, sel)) return n; n = n.parentNode; }
		return null;
	};
	return el;
}

const _cookieMap = {};
const body = makeEl('body');
const doc = {
	readyState: 'loading', // keep init() from running; we drive the API directly
	nodeType: 9,
	body: body,
	get cookie() {
		return Object.keys(_cookieMap).filter(function (k) { return _cookieMap[k] !== ''; })
			.map(function (k) { return k + '=' + _cookieMap[k]; }).join('; ');
	},
	set cookie(value) {
		const eq = value.indexOf('=');
		if (eq === -1) return;
		const name = value.substring(0, eq).trim();
		const rest = value.substring(eq + 1);
		const semi = rest.indexOf(';');
		const v = (semi === -1 ? rest : rest.substring(0, semi)).trim();
		if (/expires=Thu,\s*01 Jan 1970/i.test(value)) delete _cookieMap[name];
		else _cookieMap[name] = v;
	},
	createElement: function (t) { return makeEl(t); },
	createTextNode: function (t) { return { nodeType: 3, textContent: t }; },
	getElementById: function (id) {
		const all = []; collect(body, all);
		return all.find(function (n) { return n.id === id; }) || null;
	},
	querySelectorAll: function (sel) { return queryAll(body, sel); },
	querySelector: function (sel) { return queryAll(body, sel)[0] || null; },
	addEventListener: function () {},
	dispatchEvent: function () {},
	__tbBadgeDeleg: false
};

global.document = doc;
global.window = global;
// Lesson id must be a LESSON_DEPS key with UNMET prerequisites
// ('math-ii' needs 'math-i', nothing learned) — only then is the math
// comfort gate active (depsMet bypasses the gate once learned / for
// lessons without prerequisites, by design).
global.location = { search: '', pathname: '/math_ii.php' };
global.localStorage = { getItem: function () { return null; }, setItem: function () {} };
global.matchMedia = function () { return { matches: true }; };
global.CustomEvent = function (name) { this.name = name; };
global.__moduleNavData = {
	current: 0,
	modules: [
		{ slug: 'math_i', title: 'Math I', url: '/math_i.php', part: 1, order: 1 },
		{ slug: 'math_ii', title: 'Math II', url: '/math_ii.php', part: 1, order: 2 },
		{ slug: 'history', title: 'History', url: '/history.php', part: 2, order: 1 },
		{ slug: 'turing', title: 'Turing', url: '/turing.php', part: 3, order: 1 }
	]
};

/* ── build the lesson DOM ────────────────────────────────────── */
function el(tag) { return makeEl(tag); }
function managedDiv(id, title) {
	const d = el('div');
	d.className = 'md topic-block';
	d.id = id;
	d.setAttribute('data-mathlevel', '80');
	d.setAttribute('data-optionaltitle', title);
	const h = el('h2'); h.textContent = title;
	d.appendChild(h);
	return d;
}

const contents = el('div'); contents.id = 'contents';
contents.setAttribute('data-lesson-id', 'math-ii');

const blkA = managedDiv('blkA', 'Sec A');
const demoA = el('div'); demoA.id = 'demoA';
const blkB = managedDiv('blkB', 'Sec B');
const demoB = el('div'); demoB.id = 'demoB';
const blkC = managedDiv('blkC', 'Sec C');
const head1 = el('h2'); head1.textContent = 'Next Section';
const blkD = managedDiv('blkD', 'Sec D');
const subH3 = el('h3'); subH3.textContent = 'Sub heading';
const blkE = managedDiv('blkE', 'Sec E');
const head2 = el('h2'); head2.textContent = 'Final';
const foot = el('section'); foot.id = 'footnotes-section';

[blkA, demoA, blkB, demoB, blkC, head1, blkD, subH3, blkE, head2, foot]
	.forEach(function (n) { contents.appendChild(n); });
body.appendChild(contents);

// Pre-build the course status box WITH its real sub-elements, exactly as
// showLearnedUI() would (the mini DOM does not parse innerHTML, so the
// function can then find and update it instead of creating it).
const boxPre = el('div'); boxPre.id = 'course-status-box'; boxPre.className = 'csb';
const tog = el('button'); tog.id = 'csb-toggle'; tog.className = 'csb-toggle';
const dot = el('span'); dot.className = 'csb-dot';
const lab = el('span'); lab.className = 'csb-label';
const bar = el('span'); bar.className = 'csb-bar';
const fill = el('span'); fill.className = 'csb-bar-fill'; bar.appendChild(fill);
const caret = el('span'); caret.className = 'csb-caret';
tog.appendChild(dot); tog.appendChild(lab); tog.appendChild(bar); tog.appendChild(caret);
const panelPre = el('div'); panelPre.id = 'csb-panel'; panelPre.className = 'csb-panel';
boxPre.appendChild(tog); boxPre.appendChild(panelPre);
contents.appendChild(boxPre);

// math comfort 0 → every math-80 section is tucked (why: math)
_cookieMap['topics_pref'] = encodeURIComponent(JSON.stringify({ topics: {}, mathLevel: 0 }));

require('../topics.js');
const BT = global.window.BlogTopics;
const I = BT._internals;

let pass = 0, fail = 0;
function check(cond, msg) {
	if (cond) pass++;
	else { fail++; console.log('  FAIL: ' + msg); }
}
function allGroupBadges() { return doc.querySelectorAll('.topic-block-group-badge'); }
function directChild(e, cls) {
	return e.children.find(function (c) { return c._cls && c._cls[cls]; }) || null;
}

/* ── initial pass: tuck + grouping ───────────────────────────── */
BT.applyVisibility({ animate: false });

check(blkA.classList.contains('topic-block-collapsed'), 'T2: blkA tucked (math gate)');
check(blkB.classList.contains('topic-block-collapsed'), 'T2: blkB tucked');
check(blkC.classList.contains('topic-block-collapsed'), 'T2: blkC tucked');
check(demoA.classList.contains('topic-demo-tucked'), 'T2: demoA tucked with its section');
check(demoB.classList.contains('topic-demo-tucked'), 'T2: demoB tucked with its section');

let groups = allGroupBadges();
check(groups.length === 1, 'T2: exactly ONE group badge for the 3-run (got ' + groups.length + ')');
const gb = groups[0];
check(!!gb && (gb._groupMembers || []).length === 3, 'T2: group badge covers 3 members');
check(!!gb && gb._groupMembers[0] === blkA && gb._groupMembers[1] === blkB && gb._groupMembers[2] === blkC, 'T2: group members in document order');
check(!!gb && /Sec A/.test(gb.innerHTML) && /Sec B/.test(gb.innerHTML) && /Sec C/.test(gb.innerHTML), 'T2: group badge lists all three section headings');
check(!!gb && gb.parentNode === contents && gb.previousElementSibling === blkC, 'T2: group badge sits at the run end (after last member, before next heading)');
check(!!gb && gb.nextElementSibling === head1, 'T2: group badge directly before the next heading');
check(!blkA.querySelector(':scope > .topic-block-fade-badge'), 'T2: member badge removed from blkA');
check(!blkB.querySelector(':scope > .topic-block-fade-badge'), 'T2: member badge removed from blkB');
check(!blkC.querySelector(':scope > .topic-block-fade-badge'), 'T2: member badge removed from blkC');

// visible sub-heading breaks the D/E run → two solo badges, no group
check(blkD.classList.contains('topic-block-collapsed') && blkE.classList.contains('topic-block-collapsed'), 'T4: blkD + blkE tucked');
check(!!directChild(blkD, 'topic-block-fade-badge'), 'T4: blkD keeps its own badge');
check(!!directChild(blkE, 'topic-block-fade-badge'), 'T4: blkE keeps its own badge');
check(allGroupBadges().length === 1, 'T4: no extra group badge for the separated D/E pair');

/* ── T3: tap the group badge → whole run reveals ─────────────── */
gb.click();
check(!blkA.classList.contains('topic-block-collapsed') && blkA.classList.contains('topic-block-revealed'), 'T3: blkA revealed');
check(!blkB.classList.contains('topic-block-collapsed') && blkB.classList.contains('topic-block-revealed'), 'T3: blkB revealed');
check(!blkC.classList.contains('topic-block-collapsed') && blkC.classList.contains('topic-block-revealed'), 'T3: blkC revealed');
check(!demoA.classList.contains('topic-demo-tucked'), 'T3: demoA un-tucked');
check(!demoB.classList.contains('topic-demo-tucked'), 'T3: demoB un-tucked');
check(allGroupBadges().length === 0, 'T3: group badge removed after reveal');

const recA = I.findRecollapse(blkA);
const recB = I.findRecollapse(blkB);
const recC = I.findRecollapse(blkC);
check(!!recA && !!recB && !!recC, 'T1: fold-away buttons exist for all revealed sections');
check(!!recA && !directChild(blkA, 'topic-block-recollapse'), 'T1: fold-away button is NOT a child of the block');
check(!!recA && recA.parentNode === contents, 'T1: fold-away button is an in-flow sibling');
check(!!recA && recA.nextElementSibling === blkB, 'T1: blkA button at section end (before next section), AFTER its demo');
check(!!recA && recA.previousElementSibling === demoA, 'T1: blkA button AFTER demoA (section includes its demo)');
check(!!recB && recB.nextElementSibling === blkC, 'T1: blkB button at section end (before blkC)');
check(!!recC && recC.nextElementSibling === head1, 'T1: blkC button at section end (before next heading)');

/* ── T1b: fold one section away again ────────────────────────── */
recC.click();
check(blkC.classList.contains('topic-block-collapsed'), 'T1b: blkC tucked again via fold-away');
check(!I.findRecollapse(blkC), 'T1b: fold-away button removed when tucked');
check(!!directChild(blkC, 'topic-block-fade-badge'), 'T1b: solo badge back on re-tucked blkC');
check(allGroupBadges().length === 0, 'T1b: no group (blkA/blkB revealed, blkC separated by heading)');
check(!!I.findRecollapse(blkA) && !!I.findRecollapse(blkB), 'T1b: other fold-away buttons untouched');

/* ── T6: self-heal a lost badge ──────────────────────────────── */
const lost = directChild(blkC, 'topic-block-fade-badge');
if (lost) lost.remove();
check(!directChild(blkC, 'topic-block-fade-badge'), 'T6: pre-condition — badge removed (simulated drift)');
BT.applyVisibility({ animate: false });
check(!!directChild(blkC, 'topic-block-fade-badge'), 'T6: self-heal restored the missing badge on next pass');

/* ── T7: idempotency — a second pass changes nothing ─────────── */
const groupCountBefore = allGroupBadges().length;
const recA2 = I.findRecollapse(blkA);
BT.applyVisibility({ animate: false });
check(allGroupBadges().length === groupCountBefore, 'T7: no duplicate group badges on re-pass');
check(I.findRecollapse(blkA) === recA2, 'T7: fold-away button not recreated on re-pass (same node)');
check(blkC.querySelectorAll(':scope > .topic-block-fade-badge').length === 1, 'T7: no duplicate solo badge');

/* ── T5: end-of-article settle order ─────────────────────────── */
I.showLearnedUI();
const box = doc.getElementById('course-status-box');
const learnedBtn = doc.getElementById('topic-learned-btn');
check(!!box, 'T5: course status box present');
check(!!learnedBtn, 'T5: learned button created');
check(!!box && box.parentNode === contents, 'T5: box is a direct child of #contents');
check(!!box && foot.previousElementSibling === box, 'T5: box sits right before the footnotes section (END of article, not top)');
check(!!box && box.previousElementSibling === learnedBtn, 'T5: learned button directly before the box');
check(!!box && /Lesson 2 of 4/.test(lab.textContent), 'T5: box label reads "Lesson 2 of 4" (math-ii is module 2)');
check(contents.firstElementChild !== box, 'T5: box is NOT at the top of the article');

// settle is idempotent: re-running showLearnedUI must not move anything
I.showLearnedUI();
check(foot.previousElementSibling === box && box.previousElementSibling === learnedBtn, 'T5: settle is a no-op once in place (no scroll jump)');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
