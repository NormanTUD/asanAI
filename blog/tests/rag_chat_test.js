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
	'Your answer is being generated. You are #3 in the queue. About 30 seconds. ' +
	'You can close this window and come back later.',
	'queued status shows position, ETA and leave-and-return hint');

check(chat.statusText({ status: 'running', eta_seconds: 10 }) ===
	'Generating your answer… about 10 seconds. ' +
	'You can close this window and come back later.',
	'running status shows time and leave-and-return hint');

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

var bare = chat.answerHtml('See [1].', sources);
check(bare.indexOf('href="history#the-perceptron"') !== -1, 'bare citation numbers link to sources');

var markdown = chat.answerHtml('**bold** and *italic* and `code`', []);
check(markdown.indexOf('<strong>bold</strong>') !== -1, 'bold markdown renders');
check(markdown.indexOf('<em>italic</em>') !== -1, 'italic markdown renders');
check(markdown.indexOf('<code>code</code>') !== -1, 'inline code renders');
check(chat.answerHtml('`**not bold**`', []).indexOf('<strong>') === -1,
	'markdown inside code stays literal');
check(chat.answerHtml('[lesson](history#the-perceptron)', []).indexOf('href="history#the-perceptron"') !== -1,
	'relative lesson links render');
check(chat.answerHtml('[ext](https://example.com)', []).indexOf('href=') === -1,
	'external links are not rendered');
check(chat.answerHtml('[bad](javascript:alert(1))', []).indexOf('href=') === -1,
	'unsafe link schemes are not rendered');
check(chat.answerHtml('See [S1].', [{ id: 'S1', title: 'Bad', url: 'javascript:alert(1)' }])
	.indexOf('href=') === -1, 'unsafe source URLs are not linked');

var inlineImage = chat.answerHtml('![Portrait](frank_rosenblatt_portrait.jpg)', []);
check(inlineImage.indexOf('<img') !== -1 &&
	inlineImage.indexOf('src="frank_rosenblatt_portrait.jpg"') !== -1,
	'safe inline markdown images render');
check(chat.answerHtml('![x](https://evil.example/x.png)', []).indexOf('<img') === -1,
	'external inline images are blocked');
check(chat.answerHtml('The equation:\n\\[ a^2 + b^2 = c^2 \\]', []).indexOf('$$ a^2 + b^2 = c^2 $$') !== -1,
	'display LaTeX delimiters are normalized');
check(chat.answerHtml('Use \\(x_i\\) here', []).indexOf('$x_i$') !== -1,
	'inline LaTeX delimiters are normalized');
var sourceImage = chat.answerHtml('See [S1].', [{
	id: 'S1', title: 'History', url: 'history#perceptron',
	img: 'frank_rosenblatt_portrait.jpg', imgCaption: 'Portrait'
}]);
check(sourceImage.indexOf('rag-source-thumb') !== -1, 'source figures render as thumbnails');
check(chat.answerHtml('See [S1].', [{
	id: 'S1', title: 'Bad', url: 'history#x', img: 'javascript:alert(1)'
}]).indexOf('rag-source-thumb') === -1, 'unsafe source images are blocked');
check(chat.answerHtml('[query](image.php?f=x&w=2)', []).indexOf('src=') === -1 &&
	chat.answerHtml('[query](image.php?f=x&w=2)', []).indexOf('href="image.php?f=x&amp;w=2"') !== -1,
	'URL query ampersands survive escaping');

check(chat.errorText({ error: 'unknown_job' }).indexOf('restarted') !== -1,
	'lost-job error suggests retrying');
check(chat.errorText({ error: 'rate_limited', retry_after: 7 }).indexOf('7') !== -1,
	'rate-limit error includes the retry delay');
check(chat.errorText({ error: 'queue_full' }).toLowerCase().indexOf('queue is full') !== -1,
	'a full queue gets its own message');

check(chat.visiblePartial('foo [[NOT_IN_COURSE]] bar') === 'foo  bar',
	'double-bracket refusal marker is hidden');
check(chat.visiblePartial('foo [NOT_IN_COURSE] bar') === 'foo  bar',
	'single-bracket refusal marker is hidden');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
