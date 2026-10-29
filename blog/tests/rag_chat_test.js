/* Node test for the RAG chat widget formatting helpers.
 * Run with:  node tests/rag_chat_test.js
 */

'use strict';

var chat = require('../rag_chat.js');

var pass = 0, fail = 0;
function check(condition, message) {
	if (condition) pass++;
	else { fail++; console.log('  FAIL: ' + message); }
}

check(chat.statusText({ status: 'queued', position: 3, eta_seconds: 30 }) ===
	'Your answer is being generated. You are #3 in the queue. About 30 seconds.',
	'queued status shows position and ETA');

check(chat.statusText({ status: 'running', eta_seconds: 10 }) ===
	'Generating your answer… about 10 seconds.',
	'running status shows a remaining time');

check(chat.statusText({ status: 'done' }) === '', 'done status has no text');

var sources = [
	{ id: 'S1', title: 'Brief History of AI', heading: 'The Perceptron', url: 'history#the-perceptron' }
];
var html = chat.answerHtml('A perceptron is linear [S1].', sources);
check(html.indexOf('href="history#the-perceptron"') !== -1, 'citation links to its source');
check(html.indexOf('[1]') !== -1, 'citation keeps its number');
check(html.indexOf('Sources') !== -1, 'sources heading is rendered');
check(html.indexOf('The Perceptron') !== -1, 'source heading is rendered');

var unsafe = chat.answerHtml('<script>alert(1)</script> [S1]', sources);
check(unsafe.indexOf('<script>') === -1, 'answer HTML is escaped');
check(unsafe.indexOf('&lt;script&gt;') !== -1, 'escaped tags remain visible');

check(chat.esc('a & b < c "d"') === 'a &amp; b &lt; c &quot;d&quot;', 'escapes entities and quotes');

var missing = chat.answerHtml('no source here [S9]', sources);
check(missing.indexOf('[S9]') !== -1, 'unknown citation is left visible');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
