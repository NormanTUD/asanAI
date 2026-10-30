/* Node smoke test for modules/youtube.js — the [youtube]ID[/youtube] macro.
 * Run with:  node tests/youtube_test.js
 *
 * Verifies:
 *   • a valid 11-character id becomes a click-to-load card
 *   • malformed ids (wrong length, markup, spaces) are left untouched
 *   • no iframe exists before the reader presses play
 *   • pressing play inserts a youtube-nocookie iframe with autoplay
 */

'use strict';

const assert = require('assert');

let clickHandler = null;

function makeElement(tag) {
	const el = {
		tagName: tag.toUpperCase(),
		textContent: '',
		children: [],
		attributes: {},
		setAttribute(name, value) { el.attributes[name] = String(value); },
		getAttribute(name) { return el.attributes[name]; },
		appendChild(child) { el.children.push(child); return child; }
	};
	return el;
}

global.window = global;
global.document = {
	readyState: 'complete',
	addEventListener(name, fn) {
		if (name === 'click') clickHandler = fn;
	},
	createElement(tag) { return makeElement(tag); }
};

require('../modules/youtube.js');

assert.strictEqual(typeof BlogYouTube.preprocess, 'function', 'preprocess is exported');

const valid = BlogYouTube.preprocess('Before\n[youtube]8Wdz1Tj5084[/youtube]\nAfter');
assert.ok(valid.indexOf('class="mn-youtube"') !== -1, 'valid marker becomes a card');
assert.ok(valid.indexOf('data-youtube-id="8Wdz1Tj5084"') !== -1, 'id is preserved');
assert.ok(valid.indexOf('<iframe') === -1, 'no iframe before play');
assert.ok(valid.indexOf('Before') !== -1 && valid.indexOf('After') !== -1, 'surrounding text survives');

const spaced = BlogYouTube.preprocess('[youtube]  8Wdz1Tj5084  [/youtube]');
assert.ok(spaced.indexOf('data-youtube-id="8Wdz1Tj5084"') !== -1, 'surrounding whitespace is tolerated');

const short = BlogYouTube.preprocess('[youtube]abc[/youtube]');
assert.strictEqual(short, '[youtube]abc[/youtube]', 'short id is left alone');

const injection = BlogYouTube.preprocess('[youtube]abc" onmouseover="x[/youtube]');
assert.strictEqual(injection, '[youtube]abc" onmouseover="x[/youtube]', 'markup in id is refused');

const plain = 'No video here.';
assert.strictEqual(BlogYouTube.preprocess(plain), plain, 'plain text is unchanged');

const host = makeElement('div');
host.attributes['data-youtube-id'] = '8Wdz1Tj5084';
const button = makeElement('button');
button.closest = function (selector) {
	if (selector === '.mn-youtube-play') return button;
	if (selector === '.mn-youtube') return host;
	return null;
};

assert.strictEqual(host.children.length, 0, 'card starts empty');
clickHandler({ target: button });

assert.strictEqual(host.children.length, 1, 'click inserts one child');
const iframe = host.children[0];
assert.strictEqual(iframe.tagName, 'IFRAME', 'the child is an iframe');
assert.ok(iframe.src.indexOf('youtube-nocookie.com/embed/8Wdz1Tj5084') !== -1, 'nocookie embed URL');
assert.ok(iframe.src.indexOf('autoplay=1') !== -1, 'autoplay after an explicit click');
assert.strictEqual(iframe.allowFullscreen, true, 'fullscreen is allowed');

console.log('youtube macro: all checks passed');
