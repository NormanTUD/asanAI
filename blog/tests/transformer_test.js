/* Node test for the transformer lesson.
 *
 * Covers the pure attention maths in transformer.js / attention_engine.js,
 * the causal mask, the training-plot placeholder, and the lesson source
 * (tooltip ids, quiz shape, citation keys).
 *
 * Run with:  node blog/tests/transformer_test.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BLOG = path.join(__dirname, '..');
let pass = 0;
let fail = 0;

function check(cond, message) {
	if (cond) {
		pass++;
	} else {
		fail++;
		console.log('  FAIL: ' + message);
	}
}

function approx(a, b, eps) {
	const tol = eps == null ? 1e-9 : eps;
	return Math.abs(a - b) <= tol;
}

function allApprox(actual, expected, eps) {
	if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
	if (actual.length !== expected.length) return false;
	for (let i = 0; i < actual.length; i++) {
		if (Array.isArray(expected[i])) {
			if (!allApprox(actual[i], expected[i], eps)) return false;
		} else if (!approx(actual[i], expected[i], eps)) {
			return false;
		}
	}
	return true;
}

function rowSum(row) {
	return row.reduce((a, b) => a + b, 0);
}

function fakeElement() {
	const style = {};
	return {
		style,
		classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
		dataset: {},
		children: [],
		childNodes: [],
		parentNode: null,
		tagName: 'DIV',
		textContent: '',
		innerHTML: '',
		value: '',
		isConnected: true,
		offsetWidth: 1,
		offsetHeight: 1,
		addEventListener() {},
		removeEventListener() {},
		appendChild() {},
		removeChild() {},
		insertBefore() {},
		remove() {},
		setAttribute() {},
		removeAttribute() {},
		getAttribute() { return null; },
		hasAttribute() { return false; },
		querySelector() { return null; },
		querySelectorAll() { return []; },
		getBoundingClientRect() {
			return { x: 0, y: 0, width: 1, height: 1, top: 0, bottom: 1, left: 0, right: 1 };
		},
		getElementsByTagName() { return []; },
		matches() { return false; },
		closest() { return null; },
		focus() {},
		click() {},
	};
}

function loadSandbox() {
	const plot = fakeElement();
	const reactCalls = [];
	const purgeCalls = [];
	const sandbox = {
		console,
		performance: { now() { return 0; } },
		setTimeout() { return 0; },
		clearTimeout() {},
		setInterval() { return 0; },
		clearInterval() {},
		requestAnimationFrame() { return 0; },
		cancelAnimationFrame() {},
		IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
		MutationObserver: class { observe() {} disconnect() {} takeRecords() { return []; } },
		ResizeObserver: class { observe() {} disconnect() {} },
		localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
		addEventListener() {},
		removeEventListener() {},
		dispatchEvent() {},
		innerWidth: 1200,
		innerHeight: 800,
		document: {
			readyState: 'complete',
			documentElement: fakeElement(),
			body: fakeElement(),
			head: fakeElement(),
			activeElement: null,
			getElementById(id) { return id === 'training-loss-plot' ? plot : null; },
			querySelector() { return null; },
			querySelectorAll() { return []; },
			createElement() { return fakeElement(); },
			createElementNS() { return fakeElement(); },
			createTextNode() { return fakeElement(); },
			createDocumentFragment() { return fakeElement(); },
			addEventListener() {},
			removeEventListener() {},
			dispatchEvent() {},
		},
		Plotly: {
			react() { reactCalls.push(Array.prototype.slice.call(arguments)); },
			purge() { purgeCalls.push(Array.prototype.slice.call(arguments)); },
			Plots: { resize() {} },
		},
		echarts: { getInstanceByDom() { return null; }, dispose() {} },
		tf: {},
		tidy(fn) { return fn && fn(); },
		scalar() { return {}; },
		add() { return {}; },
		addN() { return { div() { return {}; } }; },
		dispose() {},
		$() { return { hide() {}, show() {} }; },
		jQuery() { return { hide() {}, show() {} }; },
		themeColor(c) { return c; },
		isDark() { return false; },
		cssVar(c) { return c; },
		debounce(fn) { return fn; },
		updateLoadingStatus() {},
		gaussianRandom() { return 0; },
	};
	sandbox.window = sandbox;
	sandbox.globalThis = sandbox;
	sandbox.self = sandbox;

	const ctx = vm.createContext(sandbox);
	for (const file of ['transformer.js', 'attention_engine.js']) {
		const code = fs.readFileSync(path.join(BLOG, file), 'utf8');
		vm.runInContext(code, ctx, { filename: file });
	}
	ctx.__plot = plot;
	ctx.__reactCalls = reactCalls;
	ctx.__purgeCalls = purgeCalls;
	return ctx;
}

function testSoftmax(ctx) {
	const s = ctx.softmax([1, 2, 3]);
	check(allApprox(s, [
		0.09003057317038046,
		0.24472847105479764,
		0.6652409557748218,
	], 1e-12), 'softmax matches the closed form');
	check(approx(rowSum(s), 1, 1e-12), 'softmax row sums to 1');
	check(s.every(v => v > 0 && v < 1), 'softmax values are probabilities');

	const stable = ctx.softmax([1000, 1001, 1002]);
	check(stable.every(Number.isFinite), 'softmax is numerically stable for large logits');
	check(approx(rowSum(stable), 1, 1e-12), 'stable softmax still sums to 1');

	const masked = ctx.softmax([0, -1e9, -1e9]);
	check(approx(masked[0], 1, 1e-12) && masked[1] === 0 && masked[2] === 0,
		'a -1e9 causal mask gives exactly zero probability');

	check(allApprox(ctx.softmax([5]), [1]), 'softmax of a single element is 1');
}

function testMatMul(ctx) {
	const identity = [[1, 0], [0, 1]];
	const m = [[1, 2], [3, 4]];
	check(allApprox(ctx.matMul(m, identity), m), 'matMul with identity is the identity');

	const w = [[1, 0], [0, 2]];
	check(allApprox(ctx.matMul(m, w), [[1, 4], [3, 8]]), 'matMul computes the matrix product');

	const biased = ctx.matMul([[1, 1]], [[2, 0], [0, 2]], [10, 20]);
	check(allApprox(biased, [[12, 22]]), 'matMul applies the optional bias');
}

function testInitWeights(ctx) {
	const limit = Math.sqrt(6 / (4 + 6));
	for (let run = 0; run < 20; run++) {
		const w = ctx.initWeights(4, 6);
		check(w.length === 4 && w.every(row => row.length === 6), 'initWeights shape is [rows][cols]');
		check(w.every(row => row.every(v => v >= -limit && v <= limit)),
			'initWeights stays inside the Glorot-uniform bound');
	}
}

function testPositionalEncoding(ctx) {
	check(allApprox(ctx.computePositionalEncoding(0, 4), [0, 1, 0, 1], 1e-12),
		'position 0 encodes as [sin(0), cos(0), sin(0), cos(0)]');
	const pe = ctx.computePositionalEncoding(1, 4);
	check(allApprox(pe, [Math.sin(1), Math.cos(1), Math.sin(1 / 100), Math.cos(1 / 100)], 1e-12),
		'positional encoding follows sin/cos(10000^(2i/d))');

	const added = ctx.addPositionalEncoding([1, 1, 1, 1], 1, 4);
	check(allApprox(added, pe.map(v => v + 1)), 'addPositionalEncoding adds elementwise');
}

function testCausalAttention(ctx) {
	const dModel = 4;
	const nHeads = 2;
	const h0 = [
		[1, 0, 0, 0],
		[0, 1, 0, 0],
		[0, 0, 1, 0],
	];
	const weights = {
		query: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
		key: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
		value: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
		output: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
	};
	const heads = ctx.causalMultiHeadAttention(h0, weights, dModel, nHeads);

	check(heads.length === nHeads, 'causal attention returns one entry per head');
	for (const [hi, head] of heads.entries()) {
		check(head.weights.length === 3 && head.weights.every(r => r.length === 3),
			'head ' + hi + ' attention weights are [tokens][tokens]');
		check(head.context.length === 3 && head.context.every(r => r.length === 2),
			'head ' + hi + ' context is [tokens][d_k]');
		for (let i = 0; i < 3; i++) {
			check(approx(rowSum(head.weights[i]), 1, 1e-12),
				'head ' + hi + ' row ' + i + ' sums to 1');
			for (let j = i + 1; j < 3; j++) {
				check(head.weights[i][j] === 0,
					'head ' + hi + ' masks future position ' + j + ' from ' + i);
			}
		}
		check(allApprox(head.context[0], head.v[0], 1e-9),
			'head ' + hi + ' first token attends only to itself');
	}

	// Cross-check against a small independent reference implementation.
	const head = heads[0];
	const scores = [];
	for (let i = 0; i < 3; i++) {
		const row = [];
		for (let j = 0; j < 3; j++) {
			let dot = 0;
			for (let d = 0; d < 2; d++) dot += head.q[i][d] * head.k[j][d];
			row.push(j > i ? -Infinity : dot / Math.sqrt(2));
		}
		scores.push(row);
	}
	const refWeights = scores.map(row => {
		const m = Math.max.apply(null, row);
		const exps = row.map(v => Math.exp(v - m));
		const total = exps.reduce((a, b) => a + b, 0);
		return exps.map(v => v / total);
	});
	const refContext = refWeights.map((row, i) => {
		const out = [0, 0];
		for (let j = 0; j < 3; j++) {
			for (let d = 0; d < 2; d++) out[d] += row[j] * head.v[j][d];
		}
		return out;
	});
	check(allApprox(head.weights, refWeights, 1e-9),
		'causal attention weights match the reference softmax(QK^T/sqrt(d_k))');
	check(allApprox(head.context, refContext, 1e-9),
		'causal attention context matches the reference A·V');
}

function testAttentionEngine(ctx) {
	const Engine = vm.runInContext('AttentionEngine', ctx);
	const dModel = 4;
	const nHeads = 2;
	const h0 = [
		[0.2, -0.1, 0.3, 0.4],
		[-0.4, 0.5, 0.1, -0.2],
		[0.7, 0.2, -0.3, 0.1],
	];
	const weights = {
		query: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
		key: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
		value: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
		output: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
	};
	const engine = new Engine({ d_model: dModel, n_heads: nHeads, containerId: 'missing', weights });
	engine.renderUI = function () {};

	let hookArgs = null;
	Engine.onForward((eng, headData, hidden, tokens) => { hookArgs = { eng, headData, hidden, tokens }; });

	const headData = engine.forward(h0, ['a', 'b', 'c'], ['a', 'b', 'c']);
	check(headData.length === nHeads, 'AttentionEngine.forward returns one entry per head');
	check(hookArgs && hookArgs.headData === headData && hookArgs.tokens.length === 3,
		'AttentionEngine.onForward fires with the forward-pass data');
	check(headData[0].Qi.length === 3 && headData[0].Qi[0].length === 2,
		'AttentionEngine Q is sliced to d_k per head');
	check(headData[0].context.length === 3 && headData[0].context[0].length === 2,
		'AttentionEngine context is [tokens][d_k]');
	for (let i = 0; i < 3; i++) {
		check(approx(rowSum(headData[0].this_weights[i]), 1, 1e-9),
			'AttentionEngine row ' + i + ' sums to 1');
		for (let j = i + 1; j < 3; j++) {
			check(headData[0].this_weights[i][j] === 0,
				'AttentionEngine masks future position ' + j + ' from ' + i);
		}
	}

	const reference = ctx.causalMultiHeadAttention(h0, weights, dModel, nHeads);
	for (let h = 0; h < nHeads; h++) {
		check(allApprox(headData[h].this_weights, reference[h].weights, 1e-9),
			'AttentionEngine head ' + h + ' weights match causalMultiHeadAttention');
		check(allApprox(headData[h].context, reference[h].context, 1e-9),
			'AttentionEngine head ' + h + ' context matches causalMultiHeadAttention');
	}

	// A weight change must be reflected immediately (weights are not cached).
	engine.this_weights.value[0][0] = 3;
	const changed = engine.forward(h0, ['a', 'b', 'c']);
	check(!allApprox(changed[0].context, headData[0].context, 1e-9),
		'AttentionEngine uses the current weights, not a cached forward pass');
}

function testTrainingPlot(ctx) {
	const calls = ctx.__reactCalls;
	const purges = ctx.__purgeCalls;

	calls.length = 0;
	purges.length = 0;
	ctx.drawTrainingPlaceholder();
	check(calls.length === 1, 'drawTrainingPlaceholder renders exactly one plot');
	if (calls.length) {
		const [element, data, layout, config] = calls[0];
		check(element === ctx.__plot, 'placeholder renders into #training-loss-plot');
		check(Array.isArray(data) && data.length === 0, 'placeholder has no data traces');
		const ann = layout.annotations && layout.annotations[0];
		check(ann && ann.x === 0.5 && ann.y === 0.5 &&
			ann.xref === 'paper' && ann.yref === 'paper',
			'placeholder annotation sits at the paper centre');
		check(ann && ann.xanchor === 'center' && ann.yanchor === 'middle' && ann.align === 'center',
			'placeholder annotation is explicitly centred');
		check(layout.dragmode === false, 'placeholder disables Plotly drag-to-zoom');
		check(config && config.displayModeBar === false, 'placeholder hides the Plotly modebar');
	}

	// An empty loss history must fall back to the placeholder, not an empty chart.
	calls.length = 0;
	ctx.window.lossHistory = [];
	ctx.renderLossGraph();
	check(calls.length === 1 && calls[0][1].length === 0 &&
		calls[0][2].annotations && calls[0][2].annotations.length === 1,
		'renderLossGraph shows the placeholder while there is no loss history');

	// Once epochs exist, the real loss trace is drawn.
	calls.length = 0;
	ctx.window.lossHistory = [1.5, 0.9, 0.4];
	ctx.renderLossGraph();
	check(calls.length === 1, 'renderLossGraph draws one chart with loss data');
	if (calls.length) {
		const [, data, layout, config] = calls[0];
		check(data.length === 1 && data[0].type === 'scatter', 'loss chart is a scatter trace');
		check(allApprox(data[0].y, [1.5, 0.9, 0.4]), 'loss chart keeps the epoch losses');
		check(layout.title.text === 'Training Loss', 'loss chart has the Training Loss title');
		check(layout.dragmode === false, 'loss chart disables drag-to-zoom');
		check(config && config.displayModeBar === false, 'loss chart hides the modebar');
	}

	// reset_graph must restore the placeholder after purging the old chart.
	calls.length = 0;
	purges.length = 0;
	ctx.reset_graph();
	check(purges.length === 1, 'reset_graph purges the existing Plotly chart');
	check(calls.length === 1 && calls[0][1].length === 0 &&
		calls[0][2].annotations && calls[0][2].annotations.length === 1,
		'reset_graph redraws the placeholder instead of leaving a blank box');
}

function testLessonSource() {
	const php = fs.readFileSync(path.join(BLOG, 'transformer.php'), 'utf8');

	for (const id of [
		'train-epochs', 'train-lr', 'train-optimizer', 'training-status',
		'training-loss-plot', 'tda-toggle-training-windows',
	]) {
		check(php.includes('id="' + id + '"'), 'lesson keeps id "' + id + '"');
	}
	check(php.includes('name="train-optimizer-choice"'),
		'lesson keeps the train-optimizer-choice radio name');

	check(!/class\s*=\s*[“”]/.test(php), 'no smart quotes inside class attributes');
	for (const id of ['tt-train-adam', 'tt-train-sgd', 'tt-train-rmsprop']) {
		check(php.includes('data-tooltip-id="' + id + '"'), 'optimizer tooltip ' + id + ' is wired');
	}
	const tooltipTags = php.match(/<span\b[^>]*class="glossary-tooltip"[^>]*>/g) || [];
	check(tooltipTags.length >= 3, 'lesson still has glossary tooltips');
	check(tooltipTags.every(tag => /data-tooltip-id="/.test(tag)),
		'every glossary tooltip has a data-tooltip-id so the portal can position it');

	// Quiz JSON must be valid and shaped like the quiz module expects.
	const quizMatch = php.match(/<div class="mn-quiz" data-quiz="transformer">\s*<script type="application\/json">([\s\S]*?)<\/script>/);
	check(!!quizMatch, 'transformer quiz block is present');
	if (quizMatch) {
		let quiz = null;
		try { quiz = JSON.parse(quizMatch[1]); } catch (e) { /* checked below */ }
		check(!!quiz, 'quiz JSON parses');
		if (quiz) {
			check(Array.isArray(quiz.questions) && quiz.questions.length >= 3,
				'quiz has at least three questions');
			for (const q of quiz.questions || []) {
				check(typeof q.q === 'string' && q.q.length > 10, 'quiz question text is present');
				check(Array.isArray(q.options) && q.options.length === 4,
					'every quiz question has four options');
				check(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4,
					'quiz answer index is in range');
				check(typeof q.explain === 'string' && q.explain.length > 10,
					'quiz answer has an explanation');
			}
		}
	}
}

function testCitations() {
	const php = fs.readFileSync(path.join(BLOG, 'transformer.php'), 'utf8');
	const literature = fs.readFileSync(path.join(BLOG, 'literature.js'), 'utf8');
	const ctx = vm.createContext({ window: {} });
	vm.runInContext(literature, ctx, { filename: 'literature.js' });
	const bib = ctx.window.bibData;
	check(!!bib && typeof bib === 'object', 'literature.js exposes window.bibData');

	const keys = new Set();
	const re = /\\cite(?:author|authorlastnameand|title|alternativetitle|year|url|footcite)?(?:\[[^\]]*\])?\{([^}]*)\}/g;
	let m;
	while ((m = re.exec(php)) !== null) {
		for (const key of m[1].split(',')) {
			const k = key.trim();
			if (k) keys.add(k);
		}
	}
	check(keys.has('vaswani2017attention'), 'lesson cites Attention Is All You Need');
	check(keys.size > 10, 'lesson carries a meaningful citation set');
	const missing = [...keys].filter(k => !Object.prototype.hasOwnProperty.call(bib, k));
	check(missing.length === 0, 'every transformer citation key exists in literature.js' +
		(missing.length ? ' (missing: ' + missing.join(', ') + ')' : ''));
}

function main() {
	const ctx = loadSandbox();
	testSoftmax(ctx);
	testMatMul(ctx);
	testInitWeights(ctx);
	testPositionalEncoding(ctx);
	testCausalAttention(ctx);
	testAttentionEngine(ctx);
	testTrainingPlot(ctx);
	testLessonSource();
	testCitations();

	console.log('\ntransformer tests: ' + pass + ' passed, ' + fail + ' failed');
	process.exit(fail ? 1 : 0);
}

main();
