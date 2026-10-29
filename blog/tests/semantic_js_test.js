/* Node test for semantic_search.js and the generated semantic index.
 * Run with:  node tests/semantic_js_test.js
 */

'use strict';

var fs = require('fs');
var path = require('path');

global.document = { baseURI: 'http://localhost/blog/' };
global.window = { location: {}, dispatchEvent: function() {} };
global.CustomEvent = function() {};

var semantic = require('../semantic_search.js');
var I = semantic;
var pass = 0, fail = 0;
function check(cond, message) {
	if (cond) pass++;
	else { fail++; console.log('  FAIL: ' + message); }
}

function vectorBuffer(vectors, scales) {
	var count = vectors.length;
	var dims = vectors[0].length;
	var buffer = new ArrayBuffer(16 + count * 4 + count * dims);
	var view = new DataView(buffer);
	view.setUint32(0, 0x4D4E5356, true);
	view.setUint32(4, 1, true);
	view.setUint32(8, count, true);
	view.setUint32(12, dims, true);
	scales.forEach(function(scale, i) { view.setFloat32(16 + i * 4, scale, true); });
	var out = new Int8Array(buffer, 16 + count * 4, count * dims);
	vectors.forEach(function(vector, i) {
		vector.forEach(function(value, d) { out[i * dims + d] = value; });
	});
	return buffer;
}

function syntheticTest() {
	var meta = {
		dims: 4,
		chunks: [
			{ p: 'one', pt: 'One', t: 'content', h: 'Heading one', x: 'first', u: 'one#heading-one', i: '' },
			{ p: 'two', pt: 'Two', t: 'content', h: 'Heading two', x: 'second', u: 'two#heading-two', i: '' },
			{ p: 'three', pt: 'Three', t: 'content', h: 'Heading three', x: 'third', u: 'three#heading-three', i: '' }
		]
	};
	var buffer = vectorBuffer(
		[[127, 0, 0, 0], [0, 127, 0, 0], [0, 0, 127, 0]],
		[1 / 127, 1 / 127, 1 / 127]
	);
	var parsed = I.parseVectors(buffer, meta);
	var ranked = I.rank(meta, parsed, new Float32Array([1, 0, 0, 0]), { limit: 3, maxPerPage: 5 });
	check(ranked.length === 3, 'synthetic rank returns every chunk');
	check(ranked[0].page === 'one', 'synthetic rank puts the best cosine first');
	check(Math.abs(ranked[0].score - 1) < 0.01, 'synthetic cosine is close to 1');
	check(ranked[0].title === 'Heading one', 'result title uses the heading');
	check(ranked[0].semantic === true, 'result is tagged as semantic');

	var samePage = {
		dims: 4,
		chunks: [
			{ p: 'one', pt: 'One', t: 'content', h: 'A', x: 'a', u: 'one#a', i: '' },
			{ p: 'one', pt: 'One', t: 'content', h: 'B', x: 'b', u: 'one#b', i: '' },
			{ p: 'one', pt: 'One', t: 'content', h: 'C', x: 'c', u: 'one#c', i: '' }
		]
	};
	var perPageBuffer = I.parseVectors(vectorBuffer(
		[[127, 0, 0, 0], [100, 0, 0, 0], [90, 0, 0, 0]],
		[1 / 127, 1 / 127, 1 / 127]
	), samePage);
	var perPage = I.rank(samePage, perPageBuffer, new Float32Array([1, 0, 0, 0]), { limit: 3, maxPerPage: 2 });
	check(perPage.length === 2, 'maxPerPage caps one page');

	var duplicate = {
		dims: 4,
		chunks: [
			{ p: 'one', pt: 'One', t: 'heading', h: 'Same', x: 'heading', u: 'one#same', i: '' },
			{ p: 'one', pt: 'One', t: 'content', h: 'Same', x: 'body', u: 'one#same', i: '' }
		]
	};
	var duplicateBuffer = I.parseVectors(vectorBuffer(
		[[127, 0, 0, 0], [120, 0, 0, 0]],
		[1 / 127, 1 / 127]
	), duplicate);
	var deduped = I.rank(duplicate, duplicateBuffer, new Float32Array([1, 0, 0, 0]), { limit: 2, maxPerPage: 5 });
	check(deduped.length === 1, 'one result per URL');
}

async function realTest() {
	var root = path.resolve(__dirname, '..');
	var meta = JSON.parse(fs.readFileSync(path.join(root, 'semantic_index.json'), 'utf8'));
	var bytes = fs.readFileSync(path.join(root, 'semantic_vectors.bin'));
	var buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
	var parsed = I.parseVectors(buffer, meta);

	check(meta.version === 1, 'index version is 1');
	check(meta.dims === 256, 'index has 256 dimensions');
	check(parsed.count === meta.chunks.length, 'vector count matches chunk count');
	check(meta.chunks.length > 1000, 'index contains the course chunks');
	check(meta.chunks.every(function(chunk) {
		return chunk.p && chunk.pt && chunk.x && chunk.u && chunk.t;
	}), 'every chunk carries page, title, snippet, url and type');

	var mod = await import(require('url').pathToFileURL(
		path.join(root, 'vendor/model2vec/model.js')
	).href);
	var modelBytes = fs.readFileSync(path.join(root, 'vendor/model2vec/models/potion-base-8M.bin'));
	var model = mod.StaticModel.fromBytes(new Uint8Array(modelBytes));

	var activation = I.rank(meta, parsed, model.embed(
		'why do neural networks need nonlinear activation functions'
	), { limit: 5, maxPerPage: 5 });
	check(activation.length > 0, 'real query returns results');
	check(activation[0].page === 'activationlab', 'activation question finds the activation lesson');
	check(activation[0].score > 0.6, 'activation question has a confident match');

	var offTopic = I.rank(meta, parsed, model.embed('sourdough bread recipe'), { limit: 3, maxPerPage: 5 });
	check(offTopic.length > 0, 'off-topic query still returns nearest chunks');
	check(offTopic[0].score < 0.4, 'off-topic query has a low best score');

	var query = model.embed('how does attention let a model look at earlier words');
	var queryBoth = I.rank(meta, parsed, query, { limit: 5, maxPerPage: 5 });
	var queryPages = queryBoth.map(function(result) { return result.page; });
	check(queryPages.indexOf('intuition') !== -1 || queryPages.indexOf('attentionlab') !== -1,
		'attention question finds an attention lesson');
}

syntheticTest();
realTest().then(function() {
	console.log('\n' + pass + ' passed, ' + fail + ' failed');
	if (fail > 0) process.exit(1);
}).catch(function(error) {
	console.error('  FAIL: ' + (error && error.stack ? error.stack : error));
	process.exit(1);
});
