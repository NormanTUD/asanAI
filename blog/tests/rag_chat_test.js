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

var table = chat.answerHtml([
	'| Model Type | Description | Layers |',
	'| --- | --- | --- |',
	'| Transformer | A type of neural network architecture | N × |',
	'| GPT-3 | A specific type of LLM | 96 |'
].join('\n'), []);
check(table.indexOf('<table class="rag-table">') !== -1, 'pipe tables render as HTML tables');
check(table.indexOf('<th>Model Type</th>') !== -1, 'table header cells render');
check(table.indexOf('<td>Transformer</td>') !== -1, 'table body cells render');
check(table.indexOf('<p>') === -1, 'a lone table is not wrapped in a paragraph');
check(chat.answerHtml('a | b is not a table', []).indexOf('<table') === -1,
	'pipes in ordinary prose do not create a table');
var mixedTable = chat.answerHtml('Intro\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\nOutro', []);
check(mixedTable.indexOf('<p>Intro</p>') !== -1 && mixedTable.indexOf('<p>Outro</p>') !== -1,
	'text around a table stays in separate paragraphs');
var alignedTable = chat.answerHtml('| L | C | R |\n| :--- | :---: | ---: |\n| a | b | c |', []);
check(alignedTable.indexOf('rag-tbl-left') !== -1 &&
	alignedTable.indexOf('rag-tbl-center') !== -1 &&
	alignedTable.indexOf('rag-tbl-right') !== -1, 'table alignment from the delimiter row renders');
var tableWithMarkup = chat.answerHtml(
	'| A | B |\n| --- | --- |\n| <img src=x onerror=alert(1)> | **bold** |', []);
check(tableWithMarkup.indexOf('<img') === -1 && tableWithMarkup.indexOf('&lt;img') !== -1,
	'table cell HTML is escaped');
check(tableWithMarkup.indexOf('<strong>bold</strong>') !== -1,
	'inline markdown renders inside table cells');
check(chat.answerHtml('| A |\n| --- |\n| [S1] |', sources)
	.indexOf('href="history#the-perceptron"') !== -1,
	'citations inside table cells link to their sources');
check(chat.answerHtml('| A | B |\n| --- | --- |', []).indexOf('<table') !== -1,
	'a partial table still renders its header while streaming');

var pythonBlock = chat.answerHtml('```python\nprint("hi")\n```', []);
check(pythonBlock.indexOf('<pre class="rag-code">') !== -1, 'fenced code blocks render as pre/code');
check(pythonBlock.indexOf('class="language-python"') !== -1, 'the fence language becomes a Prism class');
check(pythonBlock.indexOf('```') === -1, 'code fence markers are consumed');
check(pythonBlock.indexOf('<p>') === -1, 'a lone code block is not wrapped in a paragraph');
check(pythonBlock.indexOf('print') !== -1 && pythonBlock.indexOf('&lt;') === -1,
	'code content is preserved');
var literalCode = chat.answerHtml('```\n**bold** [link](history) [S1]\n```', sources);
var literalBody = literalCode.slice(literalCode.indexOf('<code'),
	literalCode.indexOf('</code>'));
check(literalBody.indexOf('<strong>') === -1 && literalBody.indexOf('href=') === -1,
	'markdown inside code stays literal');
check(chat.answerHtml('```python\nprint(1)', []).indexOf('rag-code') !== -1,
	'an unclosed fence still renders while streaming');
check(chat.answerHtml('~~~js\nlet a = 1;\n~~~', []).indexOf('language-js') !== -1,
	'tilde fences render too');
check(chat.answerHtml('```"><script>\nx\n```', []).indexOf('language-') === -1,
	'unsafe fence info strings are dropped');
var codeAndTable = chat.answerHtml(
	'```python\nx = 1\n```\n\n| A | B |\n| --- | --- |\n| 1 | 2 |', []);
check(codeAndTable.indexOf('rag-code') !== -1 && codeAndTable.indexOf('rag-table') !== -1,
	'a code block and a table can live in the same answer');

check(chat.hasCodeBlock('```python\nprint(1)\n```') === true,
	'code-block detection finds fenced answers');
check(chat.hasCodeBlock('~~~js\nlet a = 1;\n~~~') === true,
	'code-block detection accepts tilde fences');
check(chat.hasCodeBlock('no code here') === false,
	'code-block detection ignores plain prose');

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

check(chat.pageSlugFrom({ current: 3, modules: [{ slug: 'a' }, { slug: 'b' },
	{ slug: 'c' }, { slug: 'minimalneuron' }] }, '') === 'minimalneuron',
	'the current course module supplies the page-scope slug');
check(chat.pageSlugFrom({ current: -1, modules: [] }, 'history') === 'history',
	'the lesson block supplies the page-scope slug when nav is absent');
check(chat.pageSlugFrom({ current: -1, modules: [] }, '') === '',
	'the course index has no page scope');
check(chat.pageSlugFrom({ current: 0, modules: [{ slug: 'index_full' }] }, '') === '',
	'index pages are never offered as a page scope');
check(chat.pageSlugFrom(null, 'INDEX') === '',
	'the page-scope slug is normalized and rejected case-insensitively');

var originalTitle = 'Brief History of AI';
global.document = { title: originalTitle };
chat.marqueeTitle('Answer ready', { duration: 80, frame: 10 });
check(document.title.indexOf('Answer ready') !== -1,
	'title marquee shows the completion message');
setTimeout(function() {
	check(document.title === originalTitle,
		'title marquee restores the original title');
	console.log('\n' + pass + ' passed, ' + fail + ' failed');
	if (fail > 0) process.exit(1);
}, 200);
