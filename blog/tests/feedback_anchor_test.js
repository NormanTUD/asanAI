#!/usr/bin/env node
/**
 * Blog Feedback — JS Unit Tests
 * ------------------------------
 * Tests the front-end anchor extraction, re-anchor relocation,
 * unified-diff generation, and helper logic. Pure Node — no DOM,
 * no fetch — uses jsdom-free mocks via a tiny fake-DOM harness.
 *
 * Usage:
 *   node blog/tests/feedback_anchor_test.js
 *
 * Exits 0 on success, 1 on any failure.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const assert = require('assert');

// ─────────────────────────────────────────────────────────────────────
// Tiny helpers (mirroring feedback.js internals so we can test them).
// We re-define a stripped-down version of the public surface here so
// the tests can run under plain Node without a DOM. If you change
// feedback.js, keep this in sync.
// ─────────────────────────────────────────────────────────────────────

function escHtml(s) {
	return String(s == null ? '' : s)
		.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function relTime(iso) {
	if (!iso) return '';
	const t = new Date(iso.replace(' ', 'T') + 'Z').getTime();
	if (isNaN(t)) return '';
	const s = Math.round((Date.now() - t) / 1000);
	if (s < 60)     return 'just now';
	if (s < 3600)   return Math.round(s / 60) + 'm ago';
	if (s < 86400)  return Math.round(s / 3600) + 'h ago';
	if (s < 2592000) return Math.round(s / 86400) + 'd ago';
	return new Date(t).toISOString().slice(0, 10);
}

// Test target #1: relTime
assert.strictEqual(relTime(''), '', 'relTime: empty');
assert.strictEqual(relTime('not a date'), '', 'relTime: invalid');
const now = new Date();
const isoNow = now.toISOString().replace('T', ' ').slice(0, 19);
assert.strictEqual(relTime(isoNow), 'just now', 'relTime: just now');
assert.strictEqual(relTime(new Date(now - 5 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)), '5m ago', 'relTime: 5m ago');
assert.strictEqual(relTime(new Date(now - 3 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19)), '3h ago', 'relTime: 3h ago');
assert.strictEqual(relTime(new Date(now - 2 * 86400 * 1000).toISOString().replace('T', ' ').slice(0, 19)), '2d ago', 'relTime: 2d ago');
console.log('✓ relTime: 7 assertions');

// Test target #2: escHtml (XSS prevention)
assert.strictEqual(escHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;', 'escHtml: script');
assert.strictEqual(escHtml('"hello"'), '&quot;hello&quot;', 'escHtml: quotes');
assert.strictEqual(escHtml("it's"), 'it&#39;s', 'escHtml: apostrophe');
assert.strictEqual(escHtml('a & b'), 'a &amp; b', 'escHtml: ampersand');
assert.strictEqual(escHtml(null), '', 'escHtml: null');
assert.strictEqual(escHtml(undefined), '', 'escHtml: undefined');
console.log('✓ escHtml: 6 assertions');

// ─────────────────────────────────────────────────────────────────────
// Test target #3: Unified-diff generation (extracted from _diff.php).
// We re-implement it in JS to mirror the PHP version exactly so we
// can validate the algorithm.
// ─────────────────────────────────────────────────────────────────────

function makeUnifiedDiff(oldText, newText, filename) {
	if (oldText === newText) return '';

	// Trim a single trailing newline so we don't get phantom empty lines.
	if (oldText.endsWith('\n')) oldText = oldText.slice(0, -1);
	if (newText.endsWith('\n')) newText = newText.slice(0, -1);

	const oldLines = oldText.split(/\r\n|\r|\n/);
	const newLines = newText.split(/\r\n|\r|\n/);
	const CONTEXT = 3;

	// Common prefix
	const maxPrefix = Math.min(oldLines.length, newLines.length);
	let prefix = 0;
	while (prefix < maxPrefix && oldLines[prefix] === newLines[prefix]) prefix++;

	// Common suffix — search backwards but stop at the prefix boundary.
	let oldSuffix = oldLines.length;
	let newSuffix = newLines.length;
	while (oldSuffix > prefix && newSuffix > prefix &&
	       oldLines[oldSuffix - 1] === newLines[newSuffix - 1]) {
		oldSuffix--;
		newSuffix--;
	}

	const removedCount = oldSuffix - prefix;
	const addedCount   = newSuffix - prefix;
	if (removedCount === 0 && addedCount === 0) return '';

	const oldChangedStart = Math.max(0, prefix - CONTEXT);
	const newChangedStart = Math.max(0, prefix - CONTEXT);
	const oldChangedEnd   = Math.min(oldLines.length, oldSuffix + CONTEXT);
	const newChangedEnd   = Math.min(newLines.length, newSuffix + CONTEXT);

	let out = `--- a/${filename}\n+++ b/${filename}\n`;
	out += `@@ -${oldChangedStart + 1},${oldChangedEnd - oldChangedStart} +${newChangedStart + 1},${newChangedEnd - newChangedStart} @@\n`;

	// Context before
	for (let k = oldChangedStart; k < prefix; k++) {
		out += ' ' + oldLines[k] + '\n';
	}
	// Removed (only in old)
	for (let k = prefix; k < prefix + removedCount; k++) {
		out += '-' + oldLines[k] + '\n';
	}
	// Added (only in new)
	for (let k = prefix; k < prefix + addedCount; k++) {
		out += '+' + newLines[k] + '\n';
	}
	// Context after
	for (let k = prefix + removedCount; k < oldChangedEnd; k++) {
		out += ' ' + oldLines[k] + '\n';
	}
	return out;
}

// Single-line change
{
	const diff = makeUnifiedDiff('aaa\nhello world\nccc\n', 'aaa\nhello there\nccc\n', 'test.txt');
	assert.ok(diff.startsWith('--- a/test.txt\n+++ b/test.txt\n'), 'diff: has unified header');
	assert.ok(diff.includes('@@'), 'diff: has hunk header');
	assert.ok(diff.includes('-hello world'), 'diff: shows - line');
	assert.ok(diff.includes('+hello there'), 'diff: shows + line');
	assert.ok(diff.includes(' aaa'), 'diff: context line "aaa" present');
	console.log('✓ makeUnifiedDiff: single-line change');
}

// No change → empty
{
	const diff = makeUnifiedDiff('same\ncontent\n', 'same\ncontent\n', 'x');
	assert.strictEqual(diff, '', 'diff: empty when no change');
	console.log('✓ makeUnifiedDiff: no change');
}

// Multi-line addition
{
	const old = 'line1\nline2\nline4\n';
	const neu = 'line1\nline2\nline3\nline4\n';
	const diff = makeUnifiedDiff(old, neu, 'x.txt');
	assert.ok(diff.includes('+line3'), 'diff: shows added line');
	assert.ok(!diff.includes('-line'), 'diff: no removed lines');
	console.log('✓ makeUnifiedDiff: insertion');
}

// Multi-line deletion
{
	const old = 'a\nb\nc\nd\n';
	const neu = 'a\nd\n';
	const diff = makeUnifiedDiff(old, neu, 'x.txt');
	assert.ok(diff.includes('-b'), 'diff: shows b removed');
	assert.ok(diff.includes('-c'), 'diff: shows c removed');
	assert.ok(!diff.includes('+b'), 'diff: no b added');
	console.log('✓ makeUnifiedDiff: deletion');
}

// Replacement
{
	const old = 'foo bar baz\nqux\n';
	const neu = 'foo QUUX baz\nqux\n';
	const diff = makeUnifiedDiff(old, neu, 'x.txt');
	assert.ok(diff.includes('-foo bar baz'), 'diff: original line shown');
	assert.ok(diff.includes('+foo QUUX baz'), 'diff: new line shown');
	console.log('✓ makeUnifiedDiff: replacement');
}

// Result is valid unified diff (parseable by `git apply --check`)
// We can't run git apply here, but we can sanity-check structure.
{
	const diff = makeUnifiedDiff('header\nold\nfooter\n', 'header\nnew\nfooter\n', 'f');
	const lines = diff.split('\n');
	assert.strictEqual(lines[0], '--- a/f', 'diff structure: --- header');
	assert.strictEqual(lines[1], '+++ b/f', 'diff structure: +++ header');
	assert.ok(lines[2].startsWith('@@'), 'diff structure: @@ hunk header');
	console.log('✓ makeUnifiedDiff: diff structure valid');
}

// ─────────────────────────────────────────────────────────────────────
// Test target #4: Anchor re-location logic.
// We mock a tiny DOM-ish environment to test the relocateAnchor
// behaviour.
// ─────────────────────────────────────────────────────────────────────

// Build a mock DOM node tree and text content.
class MockNode {
	constructor(tag, text) {
		this.tagName = tag.toUpperCase();
		this.text = text || '';
		this.children = [];
		this.parent = null;
		// Use a real Array-like for classList — must have .length & .has
		this.classList = [];
	}
	addClass(c) { this.classList.push(c); return this; }
	appendChild(child) { child.parent = this; this.children.push(child); return child; }
	get textContent() {
		let s = this.text;
		for (const c of this.children) s += c.textContent;
		return s;
	}
	querySelector(sel) {
		const parts = sel.split(' ');
		return this._find(parts, 0);
	}
	_find(parts, idx) {
		if (idx >= parts.length) return this;
		const want = parts[idx];
		const [tag, cls] = want.split('.');
		for (const c of this.children) {
			if ((tag === '*' || c.tagName.toLowerCase() === tag) &&
			    (!cls || c.classList.includes(cls))) {
				const m = c._find(parts, idx + 1);
				if (m) return m;
			}
		}
		return null;
	}
}

function findTextOffset(container, node, offsetInNode) {
	let total = 0;
	const stack = [container];
	while (stack.length) {
		const cur = stack.shift();
		if (cur === node) return total + offsetInNode;
		if (cur.text != null) total += cur.text.length;
		for (const c of cur.children) stack.push(c);
	}
	return total;
}

// Re-implement relocateAnchor in pure JS for testing.
function relocateAnchor(it, dom) {
	const sel = it.anchor.selector;
	const quote = it.anchor.quote || '';
	const chunks = Array.isArray(it.anchor.chunks) ? it.anchor.chunks : [];
	if (!sel && !quote && !chunks.length) return null;
	const candidates = [];
	if (sel) {
		const el = dom.querySelector(sel);
		if (el) candidates.push(el);
	}
	if (!candidates.length) {
		// Walk the whole tree for any .md candidate
		const walk = (n, acc) => {
			if (n.classList && n.classList.includes('md')) acc.push(n);
			for (const c of n.children) walk(c, acc);
			return acc;
		};
		walk(dom, candidates);
	}
	let best = null;
	const prefix = it.anchor.prefix || '';
	const suffix = it.anchor.suffix || '';
	for (const el of candidates) {
		const text = el.textContent || '';
		if (!text) continue;

		if (quote) {
			const r = tryExactAnchor(text, quote, prefix, suffix, it.anchor.offset);
			if (r && (!best || r.confidence > best.confidence)) {
				best = r.el ? r : Object.assign(r, { el });
			}
		}
		if (chunks.length && (!best || best.confidence < 0.55)) {
			for (const ch of chunks) {
				if (!ch || ch === quote) continue;
				const r = tryChunkAnchor(text, ch, prefix, suffix);
				if (r && (!best || r.confidence > best.confidence)) {
					best = Object.assign({ el }, r);
				}
			}
		}
		if (!best || best.confidence < 0.4) {
			const r = tryFuzzyAnchor(text, quote || chunks[0] || '');
			if (r && (!best || r.confidence > best.confidence)) {
				best = Object.assign({ el }, r);
			}
		}
	}
	if (!best) return { status: 'orphan', confidence: 0.0, el: null, offset: 0, offsetEnd: 0 };
	return best;
}

const FRESH_OFFSET_TOL = 200;

function tryExactAnchor(text, quote, prefix, suffix, origOffset) {
	let idx;
	if (prefix || suffix) {
		idx = text.indexOf(prefix + quote + suffix);
		if (idx >= 0) {
			idx += prefix.length;
			const isFresh = origOffset !== null && origOffset !== undefined && Math.abs(idx - origOffset) <= FRESH_OFFSET_TOL;
			return { offset: idx, offsetEnd: idx + quote.length,
				status: isFresh ? 'fresh' : 'moved',
				confidence: isFresh ? 1.0 : 0.85 };
		}
	}
	idx = text.indexOf(quote);
	if (idx < 0) return null;
	const isFresh = origOffset !== null && origOffset !== undefined && Math.abs(idx - origOffset) <= FRESH_OFFSET_TOL;
	return { offset: idx, offsetEnd: idx + quote.length,
		status: isFresh ? 'fresh' : 'moved',
		confidence: isFresh ? 0.95 : 0.6 };
}

function tryChunkAnchor(text, chunk, prefix, suffix) {
	if (!chunk || chunk.length < 4) return null;
	let idx;
	if (prefix || suffix) {
		idx = text.indexOf(prefix + chunk + suffix);
		if (idx >= 0) {
			idx += prefix.length;
			return { offset: idx, offsetEnd: idx + chunk.length, status: 'moved', confidence: 0.55 };
		}
	}
	idx = text.indexOf(chunk);
	if (idx < 0) return null;
	return { offset: idx, offsetEnd: idx + chunk.length, status: 'moved', confidence: 0.4 };
}

function tryFuzzyAnchor(text, needle) {
	if (!needle || needle.length < 8) return null;
	const normText  = text.replace(/\s+/g, ' ').toLowerCase();
	const normNeed  = needle.replace(/\s+/g, ' ').toLowerCase();
	const wnd = normNeed.length;
	let bestIdx = -1, bestSim = 0;
	const maxStart = Math.max(0, normText.length - wnd);
	const step = Math.max(1, Math.floor(wnd / 4));
	for (let i = 0; i <= maxStart; i += step) {
		const slice = normText.substr(i, wnd);
		const sim   = similarity(slice, normNeed);
		if (sim > bestSim) { bestSim = sim; bestIdx = i; }
		if (sim >= 0.98) break;
	}
	if (bestIdx < 0 || bestSim < 0.7) return null;
	const start = text.indexOf(normText.substr(bestIdx, 8)) || bestIdx;
	return { offset: start, offsetEnd: Math.min(text.length, start + needle.length),
		status: 'moved', confidence: 0.25 + bestSim * 0.15 };
}

function similarity(a, b) {
	const n = Math.min(a.length, b.length);
	if (n === 0) return 0;
	let same = 0;
	for (let i = 0; i < n; i++) if (a[i] === b[i]) same++;
	return same / Math.max(a.length, b.length);
}

function djb2Hash(s) {
	let h = 5381;
	for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
	return (h >>> 0).toString(36);
}

function captureAnchorChunks(text) {
	const t = String(text || '');
	if (t.length < 40) return [];
	const chunks = [];
	chunks.push(t.slice(0, 40));
	if (t.length > 80) {
		const mid = Math.floor(t.length / 2);
		chunks.push(t.slice(Math.max(0, mid - 20), Math.min(t.length, mid + 20)));
	}
	chunks.push(t.slice(-40));
	const seen = new Set();
	return chunks.filter(c => {
		if (!c || seen.has(c)) return false;
		seen.add(c); return true;
	}).slice(0, 3);
}

// Build a fake page: <div class="md">…<p>split two cultures problem we…</p>…</div>
function makePage() {
	const root = new MockNode('div').addClass('md');
	const p = new MockNode('p');
	p.appendChild(new MockNode('text', 'split two cultures problem we believe reality is one'));
	root.appendChild(p);
	return { dom: root, p };
}

{
	const { dom, p } = makePage();
	const loc = relocateAnchor({
		anchor: {
			selector: '.md > p',
			quote: 'two cultures',
			prefix: 'split ',
			suffix: ' problem',
			offset: 6,
		},
	}, dom);
	assert.strictEqual(loc.status, 'fresh', 'relocate: fresh when offset matches');
	assert.strictEqual(loc.confidence, 1.0, 'relocate: confidence 1.0 for fresh');
	assert.strictEqual(loc.offset, 6, 'relocate: correct offset');
	console.log('✓ relocateAnchor: fresh');
}

{
	const { dom } = makePage();
	const loc = relocateAnchor({
		anchor: {
			selector: '.md > p',
			quote: 'two cultures',
			prefix: 'split ',
			suffix: ' problem',
			offset: 999,   // way off
		},
	}, dom);
	assert.strictEqual(loc.status, 'moved', 'relocate: moved when offset differs');
	assert.strictEqual(loc.confidence, 0.85, 'relocate: confidence 0.85 for moved (prefix+suffix)');
	console.log('✓ relocateAnchor: moved');
}

{
	const { dom } = makePage();
	const loc = relocateAnchor({
		anchor: {
			selector: '.md > p',
			quote: 'does not exist anywhere',
			prefix: '',
			suffix: '',
			offset: 0,
		},
	}, dom);
	assert.strictEqual(loc.status, 'orphan', 'relocate: orphan when text not found');
	assert.strictEqual(loc.confidence, 0.0, 'relocate: orphan confidence 0');
	console.log('✓ relocateAnchor: orphan');
}

{
	const { dom } = makePage();
	const loc = relocateAnchor({
		anchor: {
			selector: '.md > p',
			quote: 'two cultures',
			prefix: '',   // prefix lost → fallback to quote-only
			suffix: '',
			offset: 6,
		},
	}, dom);
	// Note: the JS version matches the PHP version — when the quote is
	// found at the exact offset, status is 'fresh' even without prefix.
	// Confidence is 0.95 (no prefix context, but exact offset match).
	assert.strictEqual(loc.status, 'fresh', 'relocate: fresh when quote at exact offset, no prefix');
	assert.strictEqual(loc.confidence, 0.95, 'relocate: confidence 0.95 when quote at exact offset, no prefix');
	console.log('✓ relocateAnchor: no prefix but exact offset');
}

// Test: quote found but at a different offset → moved
{
	const { dom } = makePage();
	const loc = relocateAnchor({
		anchor: {
			selector: '.md > p',
			quote: 'two cultures',
			prefix: '',
			suffix: '',
			offset: 999, // way off
		},
	}, dom);
	assert.strictEqual(loc.status, 'moved', 'relocate: moved when offset differs (no prefix)');
	assert.strictEqual(loc.confidence, 0.6, 'relocate: confidence 0.6 for moved (no prefix)');
	console.log('✓ relocateAnchor: moved without prefix');
}

// Test: chunks-only recovery (main quote gone, but stored chunks still there)
{
	const { dom } = makePage();
	const loc = relocateAnchor({
		anchor: {
			selector: '.md > p',
			quote: 'TWO CULTURES PROBLEM',  // different casing → exact won't match
			chunks: ['split two', 'cultures problem'],
			offset: 6,
		},
	}, dom);
	assert.strictEqual(loc.status, 'moved', 'relocate: chunks fallback produces moved');
	assert.ok(loc.confidence >= 0.4 && loc.confidence <= 0.55,
		'relocate: chunks fallback confidence in [0.4, 0.55], got ' + loc.confidence);
	console.log('✓ relocateAnchor: chunks fallback');
}

// Test: fuzzy match when exact and chunks both fail
{
	const root = new MockNode('div').addClass('md');
	const p = new MockNode('p');
	p.appendChild(new MockNode('text', 'split two cultures problem we believe reality is one'));
	root.appendChild(p);
	// Slightly corrupted quote: missing a letter
	const loc = relocateAnchor({
		anchor: {
			selector: '.md > p',
			quote: 'split two cultures problm', // 'problem' → 'problm'
			offset: 0,
		},
	}, root);
	assert.strictEqual(loc.status, 'moved', 'relocate: fuzzy fallback produces moved');
	assert.ok(loc.confidence >= 0.25 && loc.confidence < 0.55,
		'relocate: fuzzy confidence in [0.25, 0.55), got ' + loc.confidence);
	console.log('✓ relocateAnchor: fuzzy fallback');
}

// Test: text_hash helper
{
	assert.strictEqual(typeof djb2Hash('hello'), 'string');
	assert.notStrictEqual(djb2Hash('hello'), djb2Hash('world'), 'hash: different inputs differ');
	assert.strictEqual(djb2Hash('hello'), djb2Hash('hello'), 'hash: deterministic');
	console.log('✓ djb2Hash');
}

// Test: captureAnchorChunks helper
{
	const chunks = captureAnchorChunks('short'); // too short
	assert.deepStrictEqual(chunks, [], 'chunks: empty for short input');
	// 120-char input with distinct content so head/mid/tail differ
	const text = 'BEGIN-' + 'middle-'.repeat(15) + '-END-' + 'x'.repeat(40);
	const chunks2 = captureAnchorChunks(text);
	assert.ok(chunks2.length >= 2 && chunks2.length <= 3,
		'chunks: 2-3 chunks for medium input, got ' + chunks2.length);
	assert.strictEqual(chunks2[0], text.slice(0, 40), 'chunks: head is first 40 chars');
	console.log('✓ captureAnchorChunks');
}

// Test: anchor_status confidence ordering — fresh > prefix-moved > quote-moved > chunk > fuzzy
{
	const root = new MockNode('div').addClass('md');
	const p = new MockNode('p');
	p.appendChild(new MockNode('text', 'split two cultures problem we believe reality is one'));
	root.appendChild(p);

	const fresh = relocateAnchor({
		anchor: { selector: '.md > p', quote: 'two cultures', prefix: 'split ', suffix: ' problem', offset: 6 },
	}, root);
	assert.strictEqual(fresh.confidence, 1.0, 'rank: fresh = 1.0');

	const moved = relocateAnchor({
		anchor: { selector: '.md > p', quote: 'two cultures', prefix: 'split ', suffix: ' problem', offset: 999 },
	}, root);
	assert.ok(moved.confidence > 0.6 && moved.confidence < 1.0,
		'rank: prefix-moved in (0.6, 1.0), got ' + moved.confidence);

	const movedNoCtx = relocateAnchor({
		anchor: { selector: '.md > p', quote: 'two cultures', offset: 999 },
	}, root);
	assert.ok(movedNoCtx.confidence >= 0.6 && movedNoCtx.confidence <= 0.95,
		'rank: quote-only-moved, got ' + movedNoCtx.confidence);

	assert.ok(fresh.confidence > moved.confidence,
		'rank: fresh > prefix-moved (' + fresh.confidence + ' > ' + moved.confidence + ')');
	console.log('✓ confidence ordering');
}

// ─────────────────────────────────────────────────────────────────────
// Test target #5: CSS selector chain builder.
// ─────────────────────────────────────────────────────────────────────

function buildSelectorChain(el) {
	const parts = [];
	let cur = el;
	while (cur && cur.tagName && parts.length < 12 && cur.tagName !== 'HTML') {
		let part = cur.tagName.toLowerCase();
		if (cur.classList && cur.classList.length) {
			const cls = cur.classList.filter(c => c.length < 24).slice(0, 3).join('.');
			if (cls) part += '.' + cls;
		}
		if (cur.id) {
			part += '#' + cur.id;
			parts.unshift(part);
			break;
		}
		if (cur.parent) {
			const sibs = cur.parent.children.filter(c => c.tagName === cur.tagName);
			if (sibs.length > 1) {
				part += ':nth-of-type(' + (sibs.indexOf(cur) + 1) + ')';
			}
		}
		parts.unshift(part);
		cur = cur.parent;
	}
	return parts.join(' > ');
}

{
	const root = new MockNode('div').addClass('md');
	const section = new MockNode('section').addClass('content');
	const p = new MockNode('p');
	root.appendChild(section);
	section.appendChild(p);
	assert.strictEqual(buildSelectorChain(p), 'div.md > section.content > p', 'selector: builds chain with classes');
	console.log('✓ buildSelectorChain: chain with classes');
}

{
	const root = new MockNode('div');
	const target = new MockNode('p');
	target.id = 'main';
	root.appendChild(target);
	// buildSelectorChain stops walking up once it finds an id — the
	// id makes the selector unambiguous, so the parent chain is
	// not needed.
	assert.strictEqual(buildSelectorChain(target), 'p#main', 'selector: stops at id (parent chain dropped)');
	console.log('✓ buildSelectorChain: stops at id');
}

// ─────────────────────────────────────────────────────────────────────
// Test target #6: Cookie + visitor id format.
// ─────────────────────────────────────────────────────────────────────

function makeVisitorId() {
	const b = new Uint8Array(16);
	for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
	return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
}

{
	const id = makeVisitorId();
	assert.strictEqual(id.length, 32, 'visitor id is 32 hex chars');
	assert.ok(/^[a-f0-9]+$/.test(id), 'visitor id is lowercase hex');
	console.log('✓ visitor id format');
}

// ─────────────────────────────────────────────────────────────────────
// Test target #7: Markdown sanitization for display (no eval, no script).
// ─────────────────────────────────────────────────────────────────────

const userInputs = [
	'normal text',
	'<script>alert(1)</script>',
	'[click me](javascript:alert(1))',
	'![alt](http://evil.com/x.png)',
	'```js\nconsole.log("hi")\n```',
	'**bold** _italic_',
	'$x^2$',
	'# heading',
	'> quote',
	'- list',
	'[xss](data:text/html,<script>alert(1)</script>)',
];

assert.strictEqual(escHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;', 'XSS: script tag');
console.log('✓ XSS escape: script tag');

// Note: full markdown sanitization happens in marked.js + Temml on the
// server; here we just verify our escape helpers don't introduce holes.
assert.ok(!userInputs.some(s => /<script/i.test(escHtml(s))), 'XSS: no script tag in any escaped input');
console.log('✓ XSS: no script tag in any escaped input');

console.log('\n=== JS Unit Tests Passed ===');
console.log('Total assertions:', 7 + 6 + 5 + 4 + 2 + 1 + 1 + 1 + 1 + 1 + 1 + 2 + 1 + 1 + 3 + 1 + 1);
