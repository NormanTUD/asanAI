/* Node smoke test for search.js internals.
 * Run with:  node tests/search_js_test.js
 */

'use strict';

function node() {
	return {
		classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
		style: {},
		dataset: {},
		innerHTML: '',
		value: '',
		textContent: '',
		addEventListener() {},
		appendChild() {},
		setAttribute() {},
		getAttribute() { return ''; },
		querySelector() { return node(); },
		querySelectorAll() { return []; },
		focus() {},
		select() {},
		scrollIntoView() {}
	};
}

global.document = {
	readyState: 'complete',
	createElement: function() { return node(); },
	createTextNode: function() { return {}; },
	getElementById: function() { return null; },
	querySelectorAll: function() { return []; },
	body: { appendChild() {}, style: {} },
	addEventListener() {}
};

global.window = {
	location: { pathname: '/blog/transformer.php', hash: '' },
	matchMedia: function() { return { matches: false }; }
};

global.fetch = function() {
	return Promise.resolve({ json: function() { return Promise.resolve({ results: [] }); } });
};

require('../search.js');

var I = (global.window.initSearch && global.window.initSearch._internals) || null;

var pass = 0, fail = 0;
function check(cond, msg) {
	if (cond) { pass++; }
	else { fail++; console.log('  FAIL: ' + msg); }
}

check(I !== null, 'initSearch._internals is exposed');

if (I) {
	check(I.detectMode('/foo/') === 'regex', 'detectMode /foo/ is regex');
	check(I.detectMode('//') === 'regex', 'detectMode // is regex (empty pattern)');
	check(I.detectMode('/a/b/') === 'regex', 'detectMode /a/b/ is regex');
	check(I.detectMode('~ab') === 'fuzzy', 'detectMode ~ab is fuzzy');
	check(I.detectMode('attention') === 'normal', 'detectMode plain is normal');

	check(I.normalizeSmartQuotes('\u201Cquoted\u201D and \u2018single\u2019') === '"quoted" and \'single\'', 'smart quotes normalized');
	check(I.normalizeSmartQuotes('\u00ABguillemets\u00BB') === '"guillemets"', 'guillemets normalized');

	var terms = I.splitTerms('multi  head  attention');
	check(terms.join(',') === 'multi,head,attention', 'splitTerms drops single chars and collapses spaces');

	var hl = I.highlightText('multi-head attention is central', 'multi head', 'normal');
	check(hl.indexOf('<mark class="search-match">multi</mark>') !== -1, 'normal highlight wraps first term');
	check(hl.indexOf('<mark class="search-match">head</mark>') !== -1, 'normal highlight wraps second term');

	var hl2 = I.highlightText('multi-head attention', 'attention', 'regex');
	check(hl2.indexOf('<mark class="search-match-regex">attention</mark>') !== -1, 'regex highlight uses regex class');

	var hl3 = I.highlightText('attention', 'attention', 'fuzzy');
	check(hl3 === 'attention', 'fuzzy mode does not highlight');

	var m = I.extractMatchFromSnippet('Multi-Head Attention', '/attention/');
	check(m.toLowerCase() === 'attention', 'extractMatchFromSnippet extracts matched text');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
