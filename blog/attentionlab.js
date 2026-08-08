/**
 * Optimized 2D Transformer & Attention Simulation
 */
/**
 * THE NEURAL UNIVERSE
 */

// Numerically stable softmax: subtract the max before exponentiating
// so the result is unaffected by a constant shift of the inputs.
// Used by both the LDD demo and the Anatomy-of-Attention module.
function softmax(scores) {
	const max = Math.max(...scores);
	const exps = scores.map(s => Math.exp(s - max));
	const sum  = exps.reduce((a, b) => a + b, 0);
	return exps.map(e => e / sum);
}

const universeVocab = {
	'happy': [2, 8, 2], 'sad': [-2, 2, 1], 'love': [4, 9, 3], 'hate': [-4, 1, 0],
	'king': [8, 5, 10], 'queen': [8, 9, 10], 'man': [1, 5, 5], 'woman': [1, 9, 5],
	'dog': [0, 2, -8], 'cat': [0, 4, -9], 'puppy': [-2, 2, -10], 'kitten': [-2, 4, -10],
	'pizza': [10, 2, -5], 'apple': [8, 4, -6], 'burger': [10, 3, -7],
	'the': [0,0,0], 'is': [0,1,0], 'his': [1,0,0], 'a': [0,0,1]
};

function runUniverse() {
	const inputField = document.getElementById('universe-input');
	if (!inputField) return;

	const tokens = inputField.value.toLowerCase().split(/\s+/).filter(t => universeVocab[t]);
	const container = 'universe-plot';

	let traces = [];

	// 1. Hintergrund (Latent Space) - visible against current theme
	const allWords = Object.keys(universeVocab);
	traces.push({
		x: allWords.map(w => universeVocab[w][0]),
		y: allWords.map(w => universeVocab[w][1]),
		z: allWords.map(w => universeVocab[w][2]),
		mode: 'markers',
		marker: { size: 5, color: themeColor('#475569'), opacity: 0.7 },
		type: 'scatter3d'
	});

	// 2. Aktive Tokens & Attention Lines
	if (tokens.length > 0) {
		tokens.forEach(t => {
			const p = universeVocab[t];
			traces.push({
				x: [p[0]], y: [p[1]], z: [p[2]],
				mode: 'markers+text',
				text: t,
				textfont: { color: themeColor('#1e293b') },
				marker: { size: 12, color: '#2563eb', line: {color: themeColor('#fff'), width: 2} },
				type: 'scatter3d'
			});
		});
	}

	const layout = {
		margin: { l: 0, r: 0, b: 0, t: 0 },
		paper_bgcolor: themeColor('#fff'),
		scene: {
			xaxis: {
				gridcolor:    themeColor('#cbd5e1'),
				gridwidth: 1,
				showgrid: true,
				zeroline: true,
				zerolinecolor: themeColor('#94a3b8'),
				zerolinewidth: 3,
				backgroundcolor: themeColor('#fff'),
				tickfont: { color: themeColor('#64748b') }
			},
			yaxis: {
				gridcolor:    themeColor('#cbd5e1'),
				gridwidth: 1,
				showgrid: true,
				zeroline: true,
				zerolinecolor: themeColor('#94a3b8'),
				zerolinewidth: 3,
				backgroundcolor: themeColor('#fff'),
				tickfont: { color: themeColor('#64748b') }
			},
			zaxis: {
				gridcolor:    themeColor('#cbd5e1'),
				gridwidth: 1,
				showgrid: true,
				zeroline: true,
				zerolinecolor: themeColor('#94a3b8'),
				zerolinewidth: 3,
				backgroundcolor: themeColor('#fff'),
				tickfont: { color: themeColor('#64748b') }
			},
			bgcolor: themeColor('#fff')
		},
		showlegend: false
	};

	Plotly.react(container, traces, layout, { responsive: true, displaylogo: false });
}

function log(type, msg) {
	const el = document.getElementById(type + '-console');
	if (el) el.innerText = msg;
}

// Renamed to SelfAttentionLab to avoid generic naming conflicts
const SelfAttentionLab = {
	data: {
		tokens: ["The", "hunter", "sees", "the", "bear"],
		matrix: [
			[0.10, 0.85, 0.05, 0.00, 0.00],
			[0.10, 0.60, 0.25, 0.00, 0.05],
			[0.00, 0.45, 0.10, 0.00, 0.45],
			[0.00, 0.00, 0.05, 0.10, 0.85],
			[0.00, 0.05, 0.45, 0.05, 0.45]
		]
	},
	hoverIndex: null,

	init: function() {
		this.renderTokens();
		this.drawTable();
		// Specific namespaced event listener
		window.addEventListener('resize', () => this.drawWeb());
		this.drawWeb();
	},

	renderTokens: function() {
		// Updated to namespaced ID: sa-token-stream
		const container = document.getElementById('sa-token-stream');
		if (!container) return;

		container.innerHTML = this.data.tokens.map((word, i) => `
	    <div class="sa-token-block"
		 onmouseover="SelfAttentionLab.hoverIndex=${i}; SelfAttentionLab.drawWeb();"
		 onmouseout="SelfAttentionLab.hoverIndex=null; SelfAttentionLab.drawWeb();">
		${word}
	    </div>
	`).join('');
	},

	drawWeb: function() {
		const canvas = document.getElementById('sa-attn-canvas');
		const container = document.getElementById('sa-attention-container');
		const chips = document.querySelectorAll('.sa-token-block');

		if (!canvas || !container || chips.length === 0) return;

		const ctx = canvas.getContext('2d');

		// Get precise dimensions to avoid incremental growth rounding issues
		const containerRect = container.getBoundingClientRect();

		// Only update if dimensions actually changed to prevent feedback loops
		if (canvas.width !== Math.floor(containerRect.width) ||
			canvas.height !== Math.floor(containerRect.height)) {
			canvas.width = containerRect.width;
			canvas.height = containerRect.height;
		}

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		this.data.tokens.forEach((_, i) => {
			this.data.tokens.forEach((_, j) => {
				if (i === j) return;

				const strength = this.data.matrix[i][j];
				if (strength < 0.01) return;

				const chip1 = chips[i].getBoundingClientRect();
				const chip2 = chips[j].getBoundingClientRect();

				const x1 = (chip1.left + chip1.width / 2) - containerRect.left;
				const x2 = (chip2.left + chip2.width / 2) - containerRect.left;
				const baseY = (chip1.top - containerRect.top);

				const isSource = (this.hoverIndex === i);

				ctx.beginPath();
				if (isSource) {
					ctx.lineWidth = 2 + strength * 20;
					ctx.strokeStyle = isDarkMode()
						? `rgba(96, 165, 250, ${0.3 + strength * 0.7})`
						: `rgba(37, 99, 235, ${0.3 + strength * 0.7})`;
				} else {
					ctx.lineWidth = 1;
					ctx.strokeStyle = isDarkMode()
						? 'rgba(71, 85, 105, 0.35)'
						: 'rgba(203, 213, 225, 0.2)';
				}

				const dist = Math.abs(x2 - x1);
				const h = Math.min(dist * 0.5, 150);

				ctx.moveTo(x1, baseY);
				ctx.bezierCurveTo(x1, baseY - h, x2, baseY - h, x2, baseY);
				ctx.stroke();

				if (isSource && strength > 0.05) {
					ctx.fillStyle = isDarkMode() ? '#bfdbfe' : '#1e40af';
					ctx.font = "bold 14px Inter, sans-serif";
					const txt = Math.round(strength * 100) + "%";
					ctx.fillText(txt, (x1 + x2)/2 - 10, baseY - h/1.5);
				}
			});
		});
	},

	drawTable: function() {
		const { tokens, matrix } = this.data;
		// In dark mode the blue cell colour washes out, so pick a brighter
		// blue for the highlight colour and a darker text colour otherwise.
		const baseBlue   = isDarkMode() ? 'rgba(96, 165, 250, ' : 'rgba(37, 99, 235, ';
		const textOnCell = '#ffffff';
		const textOff    = themeColor('#475569');
		let html = '<table class="sa-attn-table"><tr><th>Source Word</th>';
		tokens.forEach(w => html += `<th>Attends to: ${w}</th>`);
		html += '</tr>';

		tokens.forEach((w, i) => {
			html += `<tr><td class="sa-row-label">${w}</td>`;
			matrix[i].forEach(val => {
				const color = `${baseBlue}${val})`;
				const textColor = val > 0.3 ? textOnCell : textOff;
				html += `<td style="background:${color}; color:${textColor}">${(val * 100).toFixed(0)}%</td>`;
			});
			html += '</tr>';
		});
		document.getElementById('sa-matrix-container').innerHTML = html + '</table>';
	}
};

/* ═══════════════════════════════════════════════════════════
   ANATOMY OF ATTENTION — STEP-BY-STEP BUILD-UP
   Click "Next" to advance through each part of the equation,
   watching the 2D vector scene and score bars evolve together.
   ═══════════════════════════════════════════════════════════ */

// Four tokens. Token 0 is the query; tokens 1..3 are the keys/values.
const ATTN_TOKENS = [
	{ name: 'it',  color: '#ef4444' },
	{ name: 'cat', color: '#2563eb' },
	{ name: 'dog', color: '#3b82f6' },
	{ name: 'sat', color: '#60a5fa' }
];

// 2D query / keys / values. d_k = 2 keeps the geometry clean: the dot
// product is just (q[1]·k[1]) + (q[2]·k[2]) — two numbers, one vector.
// Everything is recomputed from the first `numTokens` tokens, so the
// demo can start with the simplest possible case (query + one other
// token: one key, one angle, one weight) and add more tokens later.
const matMul = (W, v) => [W[0][0]*v[0] + W[0][1]*v[1],
                           W[1][0]*v[0] + W[1][1]*v[1]];

// Map a dot-path field identifier to a human-readable variable name
// shown in tooltips. e.g. "keys.0.1" → "k₁[2]".
function fieldToName(field) {
	const parts = field.split('.');
	const root = parts[0], sub = parts[1];
	if (root === 'q') return 'q[' + (parseInt(sub) + 1) + ']';
	if (root === 'keys') return 'k' + (parseInt(sub) + 1) + '[' + (parseInt(parts[2]) + 1) + ']';
	if (root === 'vals') return 'v' + (parseInt(sub) + 1) + '[' + (parseInt(parts[2]) + 1) + ']';
	if (root === 'demo' && sub === 'x') return 'x[' + (parseInt(parts[2]) + 1) + ']';
	if (root === 'demo' && /^W_/.test(sub)) return sub + '[' + (parseInt(parts[2]) + 1) + '][' + (parseInt(parts[3]) + 1) + ']';
	return field;
}

// Emit a Temml `\text{◆FIELD|VALUE}` marker. The whole thing
// renders as one <mtext> element after Temml, which we then find
// and replace with an editable HTML span. Using \text{} (a basic
// amsmath command, trusted by default) avoids Temml's trust
// restrictions on \class / \htmlData / \style.
//
// Underscores in the field name (e.g. W_Q) MUST be escaped to \_
// otherwise LaTeX treats them as subscript operators and the
// formula throws ParseError.
function ed(field, value) {
	const safeField = field.replace(/_/g, '\\_');
	return '\\text{◆' + safeField + '|' + value + '}';
}

// ── Predefined token sets ─────────────────────────────────────────
// Each set is a self-contained scene: query q (always "it"), the other
// tokens, their keys, values, and queries (for the full-matrix view).
// The sets are designed to showcase different attention regimes:
//
//   0. Clear winner   — one key is close to q, dominates
//   1. Two-way race   — two keys are roughly tied
//   2. Nothing relates — keys are scattered, softmax is near-uniform
//   3. Strong winner  — one key is almost parallel to q, ~95% weight
//
// Each token entry: { name, k, v, q } where k/v live in the key/value
// subspace and q is the token's query (for self-attention).
const ATTN_SETS = [
	{
		label: 'Clear winner — "The cat sat."',
		full: 'The cat sat on the mat.',
		tokens: [
			{ name: 'sat', k: [-0.60, -0.70], v: [-0.70, -0.55], q: [-0.60, -0.70] },
			{ name: 'cat', k: [ 0.90,  0.45], v: [ 0.80,  0.55], q: [ 0.90,  0.45] },
			{ name: 'mat', k: [-0.50,  0.80], v: [-0.30,  0.70], q: [-0.50,  0.80] }
		]
	},
	{
		label: 'Two-way race — "She loved him."',
		full: 'She loved him deeply.',
		tokens: [
			{ name: 'loved', k: [-0.90, -0.30], v: [ 0.10, -0.90], q: [-0.90, -0.30] },
			{ name: 'she',   k: [ 0.85,  0.50], v: [ 0.70,  0.60], q: [ 0.85,  0.50] },
			{ name: 'him',   k: [ 0.80,  0.45], v: [-0.60,  0.70], q: [ 0.80,  0.45] }
		]
	},
	{
		label: 'Nothing relates — "xyz foo bar."',
		full: 'xyz foo bar qux quux.',
		tokens: [
			{ name: 'xyz',  k: [-0.30,  0.20], v: [ 0.60,  0.30], q: [-0.30,  0.20] },
			{ name: 'foo',  k: [ 0.10, -0.40], v: [-0.20,  0.70], q: [ 0.10, -0.40] },
			{ name: 'bar',  k: [ 0.20,  0.10], v: [ 0.80, -0.50], q: [ 0.20,  0.10] }
		]
	},
	{
		label: 'Strong winner — "The beautiful sunset glowed."',
		full: 'The beautiful sunset glowed.',
		tokens: [
			{ name: 'glowed',    k: [-0.90, -0.80], v: [ 0.20, -0.70], q: [-0.90, -0.80] },
			{ name: 'sunset',    k: [ 0.98,  0.42], v: [ 0.90,  0.30], q: [ 0.98,  0.42] },
			{ name: 'beautiful', k: [-0.80,  0.90], v: [-0.60,  0.80], q: [-0.80,  0.90] }
		]
	}
];

const ATTN_2D = {
	q: [ 1.00, 0.40 ],                       // current query (set on init)
	_allKeys:  [],
	_allVals:  [],
	_allQueries: [],
	exampleIdx: 0,                            // current predefined set
	d_k: 2,
	numTokens: 3,  // FIX: was 2, which meant only the first 2 keys were ever
	             // drawn. Hovering over the 3rd key ("mat") had no arrow
	             // to highlight — completely silent failure.
	hoveredToken: -1,          // -1 = none; 0 = it; 1 = cat; …
	hoveredFormula: null,      // { step, idx } or null — which formula is hovered

	// Live views over the full arrays — always reflect the CURRENT
	// numTokens. These were MISSING from the original object, which
	// meant `this.keys` / `this.vals` were undefined and the old
	// `setNumTokens` had to assign them directly (shadowing whatever
	// value was there). With these getters, `setNumTokens` just sets
	// `numTokens` and everything else derives fresh.
	get keys()    { return this._allKeys.slice(0, this.numTokens); },
	get vals()    { return this._allVals.slice(0, this.numTokens); },
	get queries() { return this._allQueries.slice(0, this.numTokens + 1); },

	// ── Demo data for the "learnable projections" step ────────────
	// Static W matrices (identity / 90° rotation / shear) that make the
	// concept visually obvious. The input x is RECOMPUTED from the first
	// token of the current example in setExample() so switching sets
	// changes what the first slide shows.
	demo: {
		x:  [0.80, 0.60],
		W_Q: [[1.0, 0.0], [0.0, 1.0]],
		W_K: [[0.0, 1.0], [-1.0, 0.0]],
		W_V: [[1.0, 0.5], [0.0, 1.0]],
		q:  [0.80, 0.60],
		k:  [-0.60, 0.80],
		v:  [1.10, 0.60],
		qk: -0.12
	},

	// Recompute the demo x from the first token of the current example,
	// so the projections step changes when the user switches examples.
	_updateDemo: function() {
		const set = ATTN_SETS[this.exampleIdx];
		if (!set || !set.tokens[0]) return;
		const tk = set.tokens[0];
		// q = W^Q · x, so x = W^Q⁻¹ · q. W^Q is identity, so x = q.
		this.demo.x = [ tk.q[0], tk.q[1] ];
		this.demo.q = matMul(this.demo.W_Q, this.demo.x);
		this.demo.k = matMul(this.demo.W_K, this.demo.x);
		this.demo.v = matMul(this.demo.W_V, this.demo.x);
		this.demo.qk = this.demo.q[0]*this.demo.k[0] + this.demo.q[1]*this.demo.k[1];
	},

	// Standard softmax: exp(s) / Σ. Causal mask zeroes out keys at
	// positions > query position (only matters for the full-matrix view).
	recomputeWeights: function() {
		const exps = this.scaled.map(s => Math.exp(s));
		const sum = exps.reduce((a, b) => a + b, 0) || 1;
		this.exps = exps;
		this.weights = exps.map(e => e / sum);
		this.output = [0, 0];
		this.vals.forEach((v, j) => {
			this.output[0] += this.weights[j] * v[0];
			this.output[1] += this.weights[j] * v[1];
		});
		this.weightedVals = this.vals.map((v, j) =>
			[this.weights[j] * v[0], this.weights[j] * v[1]]);
	},

	// Full n×n attention matrix: α[i][j] = how much query i attends to
	// key j. The matrix is capped at the available key/value count
	// (we have one fewer k/v than total tokens — "it" doesn't carry its
	// own key in the single-query demo), so for n tokens the matrix is
	// at most n × (n-1).
	recomputeMatrix: function() {
		const n = this.numTokens;
		const m = Math.min(n, this._allKeys.length + 1);  // +1: "it" is implicit query, not key
		const queries = this._allQueries.slice(0, n);
		const keys    = this._allKeys.slice(0, m - 1);
		const vals    = this._allVals.slice(0, m - 1);
		const dot = (a, b) => a[0]*b[0] + a[1]*b[1];

		const M = [], Z = [];
		for (let i = 0; i < n; i++) {
			const scores = keys.map(k => dot(queries[i], k) / this.sqrtDk);
			const exps = scores.map(s => Math.exp(s));
			const sum = exps.reduce((a, b) => a + b, 0) || 1;
			const row = exps.map(e => e / sum);
			M.push(row);
			const z = [0, 0];
			for (let j = 0; j < m - 1; j++) {
				z[0] += row[j] * vals[j][0];
				z[1] += row[j] * vals[j][1];
			}
			Z.push(z);
		}
		this.matrix = M;
		this.selfOutputs = Z;
		const last = n - 1;
		this.weights = M[last] || [];
		this.output  = Z[last] || [0, 0];
		this.weightedVals = vals.map((v, j) =>
			[(this.weights[j] || 0) * v[0], (this.weights[j] || 0) * v[1]]);
	},

	setNumTokens: function(n) {
		n = Math.max(1, Math.min(this._allKeys.length, n));
		console.log('[attn] setNumTokens: n=' + n + ' _allKeys.length=' + this._allKeys.length);
		this.numTokens = n;
		// NOTE: do NOT assign this.keys / this.vals here — they're
		// getters (see ATTN_2D declaration). Assigning would shadow the
		// getter with a stale snapshot, which is why hover over the 3rd
		// key (mat) had no arrow in the DOM even though numTokens=3
		// said it should.
		// this.keys = this._allKeys.slice(0, n - 1);  ← BUG: shadowed getter, off-by-one
		// this.vals = this._allVals.slice(0, n - 1);
		this.sqrtDk = Math.sqrt(this.d_k);
		const dot = (a, b) => a[0]*b[0] + a[1]*b[1];
		const keysArr = this.keys;   // getter call
		this.scores = keysArr.map(k => dot(this.q, k));
		this.scaled = this.scores.map(s => s / this.sqrtDk);
		this.recomputeWeights();
		this.recomputeMatrix();
		console.log('[attn] setNumTokens done: numTokens=' + this.numTokens + ' keysLen=' + this.keys.length);
	},

	// Switch to a predefined token set (0..3). Updates q, keys, vals,
	// queries and the token name list, then re-derives everything.
	setExample: function(idx) {
		if (idx < 0 || idx >= ATTN_SETS.length) return;
		this.exampleIdx = idx;
		const set = ATTN_SETS[idx];
		this.q = [ 1.00, 0.40 ];  // the query "it" stays fixed across sets
		this._allKeys    = set.tokens.map(t => t.k);
		this._allVals    = set.tokens.map(t => t.v);
		this._allQueries = [ this.q, ...set.tokens.map(t => t.q) ];
		// Update the displayed token names.
		ATTN_TOKENS[0].name = 'it';
		for (let i = 0; i < set.tokens.length; i++) {
			ATTN_TOKENS[i + 1].name = set.tokens[i].name;
		}
		// Recompute the demo input x from the first token's q (since
		// W^Q is identity in the demo, x = q). This makes the first
		// slide change when the user switches examples.
		this._updateDemo();
		this.setNumTokens(this.numTokens);
	}
};
ATTN_2D.setExample(0);

// Eight steps. `mode` decides what the 2D plot draws:
//   'keys'   → query + keys (steps 1-6)
//   'values' → query + values (step 7)
//   'output' → values + weighted values + output z with tip-to-tail (step 8)
// `computation` picks a template that shows the actual numerical math.
// `eqActive` lists the regions of the equation that should glow on this step.
const ATTN_STEPS = [
	{
		title: 'The learnable projections $W^Q$, $W^K$, $W^V$',
		computation: 'projections',
		intuition: 'projections',
		eqActive: [],
		desc: 'Every token starts as the <b>same embedding vector</b> <b>x</b> (gray). Three <i>different</i> learned matrices — <b style="color:#ef4444">W^Q</b>, <b style="color:#2563eb">W^K</b>, <b style="color:#16a34a">W^V</b> — project x into three <i>different</i> 2D vectors: <b style="color:#ef4444">q</b>, <b style="color:#2563eb">k</b>, <b style="color:#16a34a">v</b>. Hover any arrow for the W matrix and the resulting vector.',
		mode: 'projections'
	},
	{
		title: 'From embeddings to $q$, $k$, $v$',
		computation: 'setup',
		intuition: 'setup',
		eqActive: [],
		desc: 'The current example\'s tokens and their q/k/v vectors. Hover any arrow for the coordinates.',
		mode: 'keys'
	},
	{
		title: 'Element-wise product $q[d] \\cdot k_j[d]$',
		computation: 'components',
		intuition: 'components',
		eqActive: ['dot'],
		desc: 'The dot product is built from per-dimension products: $q[d] \\cdot k_j[d]$. For $d=1,2$ each token contributes two rectangles (one per axis). Same sign → positive (they agree on this axis); opposite sign → negative (disagree).',
		mode: 'keys', highlightKey: 0
	},
	{
		title: 'Sum: the dot product $q \\cdot k_j$',
		computation: 'dot',
		intuition: 'dot',
		eqActive: ['dot'],
		desc: 'Add the two per-dimension products for each key. Positive score = same direction as $q$; negative = opposite. Hover any arc to see the exact score and resulting weight.',
		mode: 'keys'
	},
	{
		title: 'Scale by $1/\\sqrt{d_k}$',
		computation: 'scaled',
		intuition: 'scaled',
		eqActive: ['sqrt'],
		desc: 'Divide each score by $\\sqrt{2} \\approx 1.414$. Keeps the variance of scores near <b>1</b> regardless of $d_k$ — without it, softmax in a real $d_k$=64 Transformer would saturate to a hard one-hot.',
		mode: 'keys'
	},
	{
		title: 'Exponentiate: $e^{\\text{score}}$',
		computation: 'exps',
		intuition: 'exps',
		eqActive: ['exp'],
		desc: 'Apply $\\exp()$ to each scaled score. <b>Dashed ghost bars</b> = scaled scores (negative ones hang below the line); <b>solid bars</b> = $\\exp$ values (all positive). Positive scores grow, negative scores flip above zero and shrink.',
		mode: 'keys'
	},
	{
		title: 'Normalize: $\\alpha_j = e^{s_j} \\big/ \\sum_n e^{s_n}$',
		computation: 'weights',
		intuition: 'weights',
		eqActive: ['denom'],
		desc: 'Divide each $\\exp(\\text{score})$ by the sum. The numbers now sum to exactly 1 — a probability distribution. These are the <b>attention weights</b> $\\alpha_j$.',
		mode: 'keys'
	},
	{
		title: 'Switch to value vectors $v_j$',
		computation: 'values',
		intuition: 'values',
		eqActive: ['value'],
		desc: 'Drop the keys. Bring in the <b>Value</b> vectors $v_j$ — they carry the actual semantic content. The attention weights carry over unchanged.',
		mode: 'values'
	},
	{
		title: 'Weighted sum: $z = \\sum_j \\alpha_j \\, v_j$',
		computation: 'output',
		intuition: 'output',
		eqActive: ['sum', 'alpha', 'value'],
		desc: 'Each value is scaled by its weight, then tip-to-tail added. The final $z$ lives <b>inside the convex hull</b> of the $v_j$ — attention can only interpolate.',
		mode: 'output'
	},
	{
		title: 'The full attention matrix $\\alpha_{ij}$',
		computation: 'matrix',
		intuition: 'matrix',
		eqActive: ['alpha'],
		desc: 'Every token is a <b>query</b> AND a <b>key</b>. The full $\\alpha$-matrix shows how every token attends to every other. Each row = one query\'s softmax distribution over all keys. Hover any cell for the exact score and weight.',
		mode: 'matrix'
	},
	{
		title: 'Self-attention: $z_i = \\sum_j \\alpha_{ij} \\, v_j$',
		computation: 'selfattn',
		intuition: 'selfattn',
		eqActive: ['sum', 'alpha', 'value'],
		desc: 'Every token gets its <b>own output</b> $z_i$ — a weighted blend of all values, according to its own attention row. This is what a Transformer layer actually computes.',
		mode: 'selfattn'
	}
];

// Per-step "Currently computing" panels. Each shows the actual numerical
// computation on the real data, so the user sees exactly what the active
// sub-expression of the equation is doing with concrete numbers.
const ATTN_COMPUTATIONS = {
	// Every numeric row is now a full Temml equation with \underbrace
	// annotations, so the computation reads as one continuous chain.
	// Each row carries data-tip/data-idx so hovering it pops up the
	// same tooltip as the corresponding plot element.
	projections: () => {
		const d = ATTN_2D.demo;
		const fmtM = (W, name) => `\\begin{pmatrix} ${ed(`demo.${name}.0.0`, W[0][0].toFixed(2))} & ${ed(`demo.${name}.0.1`, W[0][1].toFixed(2))} \\\\ ${ed(`demo.${name}.1.0`, W[1][0].toFixed(2))} & ${ed(`demo.${name}.1.1`, W[1][1].toFixed(2))} \\end{pmatrix}`;
		const html = `
		<div class="comp-header">▶ One input $\\mathbf{x}$, three different learned projections</div>
		<div class="comp-body">
			<div class="comp-eq" data-tip="proj-input">$$ \\underbrace{\\mathbf{x} = (${ed('demo.x.0', d.x[0].toFixed(2))},\\, ${ed('demo.x.1', d.x[1].toFixed(2))})}_{\\text{input embedding}} $$</div>
			<div class="comp-eq" data-tip="proj-q">$$ \\underbrace{${fmtM(d.W_Q, 'W_Q')}}_{\\mathbf{W}^Q} \\cdot \\underbrace{\\mathbf{x}}_{\\text{input}} = \\underbrace{\\mathbf{q} = (${d.q[0].toFixed(2)},\\, ${d.q[1].toFixed(2)})}_{\\text{query}} $$</div>
			<div class="comp-eq" data-tip="proj-k">$$ \\underbrace{${fmtM(d.W_K, 'W_K')}}_{\\mathbf{W}^K} \\cdot \\underbrace{\\mathbf{x}}_{\\text{input}} = \\underbrace{\\mathbf{k} = (${d.k[0].toFixed(2)},\\, ${d.k[1].toFixed(2)})}_{\\text{key}} $$</div>
			<div class="comp-eq" data-tip="proj-v">$$ \\underbrace{${fmtM(d.W_V, 'W_V')}}_{\\mathbf{W}^V} \\cdot \\underbrace{\\mathbf{x}}_{\\text{input}} = \\underbrace{\\mathbf{v} = (${d.v[0].toFixed(2)},\\, ${d.v[1].toFixed(2)})}_{\\text{value}} $$</div>
			<div class="comp-eq" data-tip="proj-qk">$$ \\mathbf{q} \\cdot \\mathbf{k} = (${d.q[0].toFixed(2)})(${d.k[0].toFixed(2)}) + (${d.q[1].toFixed(2)})(${d.k[1].toFixed(2)}) = ${d.qk.toFixed(3)} $$</div>
			<div class="comp-note">The three W's are <b>different</b>, so the three outputs are <b>different</b> — click any number (including the W matrices) to edit and watch everything update.</div>
		</div>`;
		const liveVals = AttentionAnatomy._liveValsHTMLProjection();
		return { html, liveVals };
	},
	setup: () => {
		const q = ATTN_2D.q;
		const rows = ATTN_2D.keys.map((k, j) =>
			`<div class="comp-eq" data-tip="k" data-idx="${j}">$$ \\underbrace{\\mathbf{k}_{${j+1}} = (${ed('keys.'+j+'.0', k[0].toFixed(2))},\\, ${ed('keys.'+j+'.1', k[1].toFixed(2))})}_{\\text{key "${ATTN_TOKENS[j+1].name}"}} $$</div>`
		).join('');
		const html = `
		<div class="comp-header">▶ The players — the inputs to the equation</div>
		<div class="comp-body">
			<div class="comp-eq" data-tip="q" data-idx="0">$$ \\underbrace{\\mathbf{q} = (${ed('q.0', q[0].toFixed(2))},\\, ${ed('q.1', q[1].toFixed(2))})}_{\\text{query "it"}} $$</div>
			${rows}
			<div class="comp-note">No computation yet — click any number to edit, or change the example above.</div>
		</div>`;
		const liveVals = AttentionAnatomy._liveValsHTML();
		return { html, liveVals };
	},
	components: () => {
		const q = ATTN_2D.q, k = ATTN_2D.keys[0];
		const html = `
		<div class="comp-header">▶ Currently computing: $q[d] \\cdot k_1[d]$ — element-wise product</div>
		<div class="comp-body">
			<div class="comp-eq" data-tip="comprect" data-idx="0">$$
				\\underbrace{(${ed('q.0', q[0].toFixed(2))})\\cdot(${ed('keys.0.0', k[0].toFixed(2))})}_{q_1[1]\\,=\\,${(q[0]*k[0]).toFixed(3)}} \\qquad
				\\underbrace{(${ed('q.1', q[1].toFixed(2))})\\cdot(${ed('keys.0.1', k[1].toFixed(2))})}_{q_1[2]\\,=\\,${(q[1]*k[1]).toFixed(3)}}
			$$</div>
			<div class="comp-note">Two rectangles, one per dimension — the area of each is one product. Next step adds them together.</div>
		</div>`;
		const liveVals = AttentionAnatomy._liveValsHTML();
		return { html, liveVals };
	},
	dot: () => {
		const q = ATTN_2D.q;
		const rows = ATTN_2D.keys.map((k, j) => {
			const tj = j + 1;
			const p1 = q[0]*k[0], p2 = q[1]*k[1];
			const score = ATTN_2D.scores[j].toFixed(3);
			return `<div class="comp-eq-group${j === 0 ? ' first' : ''}" data-cone-step="dot" data-cone-idx="${j}">` +
				`<div class="comp-eq-line">$$ (${ed('q.0', q[0].toFixed(2))})\\cdot(${ed('keys.'+j+'.0', k[0].toFixed(2))}) \\;+\\; (${ed('q.1', q[1].toFixed(2))})\\cdot(${ed('keys.'+j+'.1', k[1].toFixed(2))}) $$</div>` +
				`<div class="comp-eq-line">$$ = ${p1.toFixed(3)} + ${p2.toFixed(3)} $$</div>` +
				`<div class="comp-eq-line">$$ q \\cdot k_{${tj}} = \\underbrace{${score}}_{\\text{score}} $$</div>` +
			`</div>`;
		}).join('');
		const html = `
		<div class="comp-header">▶ Currently computing: $q \\cdot k_j$ — add the component products</div>
		<div class="comp-body">
			${rows}
			<div class="comp-note">Positive score = same direction as $\\mathbf{q}$; negative = opposite. This is the raw attention input.</div>
		</div>`;
		const liveVals = AttentionAnatomy._liveValsHTML();
		return { html, liveVals };
	},
	scaled: () => {
		const rows = ATTN_2D.scores.map((s, j) => `
			<div class="comp-eq" data-tip="bar-scaled" data-idx="${j}" data-cone-step="scaled" data-cone-idx="${j}">$$ s_{${j+1}} = \\frac{q \\cdot k_{${j+1}}}{\\sqrt{2}} = \\frac{${s.toFixed(3)}}{1.414} = ${ATTN_2D.scaled[j].toFixed(3)} $$</div>`
		).join('');
		const html = `
		<div class="comp-header">▶ Currently computing: $\\dfrac{q \\cdot k_j}{\\sqrt{d_k}}$ — variance control</div>
		<div class="comp-body">
			${rows}
			<div class="comp-note">Dividing by $\\sqrt{2} \\approx 1.414$ keeps every score near magnitude $1$ — the same trick a real $d_k = 64$ model uses.</div>
		</div>`;
		const liveVals = AttentionAnatomy._liveValsHTML();
		return { html, liveVals };
	},
	exps: () => {
		const rows = ATTN_2D.scaled.map((sc, j) => `
			<div class="comp-eq" data-tip="bar-exp" data-idx="${j}" data-cone-step="exps" data-cone-idx="${j}">$$ e^{s_{${j+1}}} = e^{${sc.toFixed(3)}} = ${ATTN_2D.exps[j].toFixed(3)} $$</div>`
		).join('');
		const html = `
		<div class="comp-header">▶ Currently computing: $e^{s_j}$ — amplify differences</div>
		<div class="comp-body">
			${rows}
			<div class="comp-note">Positive scores grow, negative scores shrink toward $0$. The biggest input now towers over the rest.</div>
		</div>`;
		const liveVals = AttentionAnatomy._liveValsHTML();
		return { html, liveVals };
	},
	weights: () => {
		const ex  = ATTN_2D.exps;
		const sum = ex.reduce((a, b) => a + b, 0);
		const sumRow = `<div class="comp-eq-group first">` +
			`<div class="comp-eq-line">$$ \\sum_j e^{s_j} = ${ex.map((e) => e.toFixed(3)).join(' + ')} = ${sum.toFixed(3)} $$</div>` +
		`</div>`;
		const 		rows = ex.map((e, j) => {
			const tj = j + 1;
			const w = ATTN_2D.weights[j];
			return `<div class="comp-eq-group${j === 0 ? ' first' : ''}" data-cone-step="weights" data-cone-idx="${j}">` +
				`<div class="comp-eq-line">$$ \\alpha_{${tj}} = \\frac{e^{s_{${tj}}}}{\\Sigma} $$</div>` +
				`<div class="comp-eq-line">$$ = \\frac{${e.toFixed(3)}}{${sum.toFixed(3)}} $$</div>` +
				`<div class="comp-eq-line">$$ = ${w.toFixed(3)} = ${(w*100).toFixed(1)}\\% $$</div>` +
			`</div>`;
		}).join('');
		const html = `
		<div class="comp-header">▶ Currently computing: softmax — divide each $e^{s_j}$ by the sum</div>
		<div class="comp-body">
			${sumRow}
			${rows}
			<div class="comp-note">The weights now sum to $100\\%$ — a finite budget of attention, split by relevance.</div>
		</div>`;
		const liveVals = AttentionAnatomy._liveValsHTML();
		return { html, liveVals };
	},
	values: () => {
		const rows = ATTN_2D.vals.map((v, j) => `
			<div class="comp-eq" data-tip="v" data-idx="${j}">$$ \\underbrace{\\mathbf{v}_{${j+1}} = (${ed('vals.'+j+'.0', v[0].toFixed(2))},\\, ${ed('vals.'+j+'.1', v[1].toFixed(2))})}_{\\text{value "${ATTN_TOKENS[j+1].name}"}} \\qquad \\underbrace{\\alpha_{${j+1}} = ${(ATTN_2D.weights[j]*100).toFixed(1)}\\,\\%}_{\\text{weight carries over}} $$</div>`
		).join('');
		const html = `
		<div class="comp-header">▶ Switching from keys to value vectors</div>
		<div class="comp-body">
			${rows}
			<div class="comp-note">Keys said <em>what</em> to attend to; values carry the actual content. The attention weights ride along unchanged.</div>
		</div>`;
		const liveVals = AttentionAnatomy._liveValsHTML();
		return { html, liveVals };
	},
	output: () => {
		const rows = ATTN_2D.vals.map((v, j) => {
			const wv = ATTN_2D.weightedVals[j];
			return `<div class="comp-eq" data-tip="weightedV" data-idx="${j}" data-cone-step="output" data-cone-idx="${j}">$$ \\alpha_{${j+1}}\\mathbf{v}_{${j+1}} = (${(ATTN_2D.weights[j]*100).toFixed(1)}\\%)\\times (${ed('vals.'+j+'.0', v[0].toFixed(2))},\\, ${ed('vals.'+j+'.1', v[1].toFixed(2))}) = \\underbrace{(${wv[0].toFixed(3)},\\, ${wv[1].toFixed(3)})}_{\\text{weighted value}} $$</div>`;
		}).join('');
		const z = ATTN_2D.output;
		const sumParts = ATTN_2D.weightedVals.map((wv) => `(${wv[0].toFixed(3)},\\, ${wv[1].toFixed(3)})`).join(' + ');
		const html = `
		<div class="comp-header">▶ Currently computing: $\\mathbf{z} = \\sum_j \\alpha_j \\mathbf{v}_j$ — the weighted sum</div>
		<div class="comp-body">
			${rows}
			<div class="comp-eq" data-tip="eq-z">$$ \\mathbf{z} = \\underbrace{${sumParts}}_{\\text{component-wise sum}} = \\underbrace{(${z[0].toFixed(3)},\\, ${z[1].toFixed(3)})}_{\\mathbf{z}} $$</div>
			<div class="comp-note">$\\mathbf{z}$ is a convex combination — it lies <b>inside the span</b> of the $\\mathbf{v}_j$ (a point in 2 tokens, a segment in 3, a triangle in 4).</div>
		</div>`;
		const liveVals = AttentionAnatomy._liveValsHTML();
		return { html, liveVals };
	},
	matrix: () => {
		const M = ATTN_2D.matrix;
		const n = M.length;
		const m = Math.min(M[0]?.length || 0, ATTN_2D._allKeys.length);
		const queries = ATTN_2D._allQueries.slice(0, n);
		const keys    = ATTN_2D._allKeys.slice(0, m);

		// Build an HTML table with mouseover info on every cell.
		// The matrix is NOT drawn in the 2D SVG (no dim1/dim2 background
		// here) — it's a proper table the user can read cell-by-cell.
		const pm = (v) => `\\begin{pmatrix} ${v[0].toFixed(2)} \\\\ ${v[1].toFixed(2)} \\end{pmatrix}`;

		// Column header cells (k_j): show the actual key vector on hover
		let colHeaders = '<th class="attn-matrix-corner"></th>';
		for (let j = 0; j < m; j++) {
			const k = keys[j];
			const name = ATTN_TOKENS[j + 1].name;
			colHeaders += `<th class="attn-matrix-colhead" data-tip-key="${j}">
				<div class="attn-matrix-colhead-name" style="color:${ATTN_TOKENS[j+1].color}">k<sub>${j+1}</sub> = ${name}</div>
				<div class="attn-matrix-colhead-form">$$\\mathbf{k}_{${j+1}} = ${pm(k)}$$</div>
			</th>`;
		}

		// Body rows (q_i): row header explains what q_i is, each cell
		// shows α_{ij} with a hover tooltip showing the full derivation.
		let bodyRows = '';
		for (let i = 0; i < n; i++) {
			const q = queries[i];
			const name = ATTN_TOKENS[i].name;
			let row = `<tr>
				<th class="attn-matrix-rowhead" data-tip-row="${i}">
					<div class="attn-matrix-rowhead-name" style="color:${ATTN_TOKENS[i].color}">q<sub>${i+1}</sub> = ${name}</div>
					<div class="attn-matrix-rowhead-form">$$\\mathbf{q}_{${i+1}} = ${pm(q)}$$</div>
				</th>`;
			for (let j = 0; j < m; j++) {
				const w = (M[i] || [])[j] || 0;
				const alpha = w;
				// Recompute the score for this cell so the tooltip is exact
				const score = q[0]*keys[j][0] + q[1]*keys[j][1];
				const scaled = score / Math.SQRT2;
				const expVal = Math.exp(scaled);
				const sumExp = ATTN_2D.exps.reduce((a,b) => a+b, 0);
				const bg = `rgba(37,99,235,${(0.08 + w * 0.85).toFixed(3)})`;
				const fg = w > 0.45 ? '#fff' : '#1e293b';
				row += `<td class="attn-matrix-cell" style="background:${bg}; color:${fg};"
					data-tip-cell="${i},${j}"
					data-cell-q="${q[0].toFixed(2)},${q[1].toFixed(2)}"
					data-cell-k="${keys[j][0].toFixed(2)},${keys[j][1].toFixed(2)}"
					data-cell-score="${score.toFixed(3)}"
					data-cell-scaled="${scaled.toFixed(3)}"
					data-cell-exp="${expVal.toFixed(3)}"
					data-cell-sum="${sumExp.toFixed(3)}"
					data-cell-alpha="${alpha.toFixed(3)}"
				><b>${(w*100).toFixed(1)}%</b><br><span style="font-size:0.7em; opacity:0.85">s=${score.toFixed(2)}</span></td>`;
			}
			row += '</tr>';
			bodyRows += row;
		}

		const html = `
		<div class="comp-header">▶ Full attention matrix — $\\alpha_{ij}$ for every (query, key) pair</div>
		<div class="comp-body">
			<div class="comp-note" style="margin-bottom:8px;">Each <b>row</b> is one query token's softmax distribution over all keys. Each <b>column</b> is one key. Hover any <b>cell</b> for the exact computation, or hover any <b>row/column header</b> to see what that q or k vector actually is and how it was computed.</div>
			<div class="attn-matrix-wrap">
			<table class="attn-matrix-table">
				<thead><tr>${colHeaders}</tr></thead>
				<tbody>${bodyRows}</tbody>
			</table>
			</div>
			<div class="comp-note" style="margin-top:8px;">Each <b>row</b> sums to 100% — it's a probability distribution. The <b>diagonal</b> is often strong: $\\alpha_{ii}$ tends to be large because $\\mathbf{q}_i \\cdot \\mathbf{k}_i = \\lVert \\mathbf{k}_i \\rVert^2 > 0$.</div>
		</div>`;
		const liveVals = AttentionAnatomy._liveValsHTML();
		return { html, liveVals };
	},
	selfattn: () => {
		const M = ATTN_2D.matrix;
		const Z = ATTN_2D.selfOutputs;
		const rows = M.map((row, i) => {
			// Only iterate up to row.length — for 2 tokens M[i] has
			// 1 element (1 key) so row[1] would be undefined → NaN.
			const wvParts = [];
			for (let j = 0; j < row.length && j < ATTN_2D._allVals.length; j++) {
				const v = ATTN_2D._allVals[j];
				const w = row[j] || 0;
				wvParts.push(`${(w*100).toFixed(1)}\\% \\cdot (${ed('vals.'+j+'.0', v[0].toFixed(2))},\\, ${ed('vals.'+j+'.1', v[1].toFixed(2))})`);
			}
			const wv = wvParts.join(' + ');
			const z = Z[i];
			const label = ATTN_TOKENS[i].name;
			return `<div class="comp-eq" data-tip="self-z" data-idx="${i}">$$ \\mathbf{z}_{\\text{${label}}} = \\underbrace{${wv}}_{\\text{weighted blend}} = \\underbrace{(${z[0].toFixed(3)},\\, ${z[1].toFixed(3)})}_{\\text{output for "${label}"}} $$</div>`;
		}).join('');
		const html = `
		<div class="comp-header">▶ Self-attention: every token gets its own output $\\mathbf{z}$</div>
		<div class="comp-body">
			${rows}
			<div class="comp-note">This is what a Transformer layer <i>actually</i> computes: each token's output is a different weighted blend of <b>all</b> the values, with the blending pattern determined by that token's own attention row.</div>
		</div>`;
		const liveVals = AttentionAnatomy._liveValsHTML();
		return { html, liveVals };
	}
};

// Per-step "Geometric intuition" panels. Each contains:
//   - A Temml-rendered formula (just set as innerHTML, then call render_temml())
//   - "What this does" — a plain-language explanation of the operation alone
//   - "Big picture" — how it serves the overall attention computation
const ATTN_INTUITIONS = {
	projections: () => `
		<div class="intuition-header">💡 Three views of the same token</div>
		<div class="intuition-math">$$\\mathbf{q} = \\mathbf{W}^Q \\mathbf{x}, \\quad \\mathbf{k} = \\mathbf{W}^K \\mathbf{x}, \\quad \\mathbf{v} = \\mathbf{W}^V \\mathbf{x}$$</div>
		<div class="intuition-section">Three learned linear maps — each one a different rotation/scale/shear of the input space.</div>
	`,
	setup: () => `
		<div class="intuition-header">💡 Where do Q, K, V come from?</div>
		<div class="intuition-math">$$q_i = x_i W^Q, \\quad k_j = x_j W^K, \\quad v_j = x_j W^V$$</div>
		<div class="intuition-section">Three learned projections of the same token embedding.</div>
	`,
	components: () => `
		<div class="intuition-header">💡 Element-wise product</div>
		<div class="intuition-math">$$q[d] \\cdot k_1[d] \\quad d \\in \\{1, 2\\}$$</div>
		<div class="intuition-section">Per-axis product. Same sign → positive (agree); opposite sign → negative (disagree).</div>
	`,
	dot: () => `
		<div class="intuition-header">💡 The dot product</div>
		<div class="intuition-math">$$q \\cdot k_j = \\lVert q \\rVert \\cdot \\lVert k_j \\rVert \\cdot \\cos\\theta$$</div>
		<div class="intuition-section">Add the components → one scalar per key. Positive = same direction; negative = opposite.</div>
	`,
	scaled: () => `
		<div class="intuition-header">💡 Scale by √d_k</div>
		<div class="intuition-math">$$\\frac{q \\cdot k_j}{\\sqrt{d_k}}$$</div>
		<div class="intuition-section">Keeps variance at ~1 so softmax behaves at any dimension.</div>
	`,
	exps: () => `
		<div class="intuition-header">💡 Exponentiate</div>
		<div class="intuition-math">$$e^{\\text{score}_j}$$</div>
		<div class="intuition-section">Flips negatives above zero <i>and</i> amplifies the leader. Softmax needs positive values.</div>
	`,
	values: () => `
		<div class="intuition-header">💡 Keys vs values</div>
		<div class="intuition-math">$$\\text{keys} \\;=\\; \\text{WHAT to attend to}$$</div>
		<div class="intuition-math">$$\\text{values} \\;=\\; \\text{WHAT to retrieve}$$</div>
		<div class="intuition-section">Weights carry over unchanged — they were computed from the keys.</div>
	`,
	output: () => `
		<div class="intuition-header">💡 The weighted sum</div>
		<div class="intuition-math">$$\\mathbf{z} = \\sum_j \\alpha_j \\, \\mathbf{v}_j$$</div>
		<div class="intuition-section">A convex combination — z always lies inside the convex hull of the values.</div>
	`,
	matrix: () => `
		<div class="intuition-header">💡 The attention matrix</div>
		<div class="intuition-math">$$\\alpha_{ij} = \\dfrac{e^{\\mathbf{q}_i \\cdot \\mathbf{k}_j \\,/\\, \\sqrt{d_k}}}{\\sum_n e^{\\mathbf{q}_i \\cdot \\mathbf{k}_n \\,/\\, \\sqrt{d_k}}}$$</div>
		<div class="intuition-section">Each row = one token's softmax over all keys. Diagonal often lights up (q·k = ‖k‖² > 0).</div>
	`,
	selfattn: () => `
		<div class="intuition-header">💡 Self-attention</div>
		<div class="intuition-math">$$\\mathbf{z}_i = \\sum_j \\alpha_{ij} \\, \\mathbf{v}_j \\quad \\text{for every } i$$</div>
		<div class="intuition-section">Every token gets its own output — a weighted blend of all values, using its own attention row.</div>
	`
};

// The exact Temml formula + plain-language explanation for each arrow
// type that can appear in the 2D plot. Used by the hover tooltip.
// `intuition` is the plain-language "what this MEANS" headline shown
// first; the formula + desc below it are the math, for when you want it.
const VECTOR_FORMULAS = {
	q: {
		name: 'q  (the query)',
		formula: 'q_i \\;=\\; x_i \\, W^Q',
		unicode: 'qᵢ = xᵢ · W^Q',
		intuition: 'The arrow of <b>“it”</b> — the direction it is <i>looking for</i> a match. Every other arrow is compared against this one.',
		desc: 'The query of token $i$. Computed by multiplying the token embedding $x_i$ by the learned query projection matrix $W^Q$.'
	},
	k: {
		name: 'k  (the key)',
		formula: 'k_j \\;=\\; x_j \\, W^K',
		unicode: 'kⱼ = xⱼ · W^K',
		intuition: 'A word <i>advertising</i> what it contains. How closely it points along the query tells you how much it should matter.',
		desc: 'The key of token $j$. Computed by multiplying the token embedding $x_j$ by the learned key projection matrix $W^K$. Used to score relevance against queries.'
	},
	v: {
		name: 'v  (the value)',
		formula: 'v_j \\;=\\; x_j \\, W^V',
		unicode: 'vⱼ = xⱼ · W^V',
		intuition: 'The word’s actual <i>payload</i> — the content that gets pulled into the output when it wins attention.',
		desc: 'The value of token $j$. The actual semantic content this token carries — what gets blended into the output.'
	},
	weightedV: {
		name: 'αⱼ · vⱼ  (attention-weighted value)',
		formula: '\\alpha_j \\, v_j, \\quad \\alpha_j \\;=\\; \\dfrac{e^{q \\cdot k_j \\,/\\, \\sqrt{d_k}}}{\\sum_n e^{q \\cdot k_n \\,/\\, \\sqrt{d_k}}}',
		unicode: 'αⱼ vⱼ,  where  αⱼ = softmax(q · kⱼ / √dₖ)',
		intuition: 'The same payload, shrunk by its attention share — “how much of this word makes it into the answer”.',
		desc: 'Value $v_j$ scaled by its attention weight $\\alpha_j$. $\\alpha_j$ is the softmax of the scaled dot product — a soft "how much does this token matter?" between $0$ and $1$.'
	},
	z: {
		name: 'z  (the contextualised output)',
		formula: 'z \\;=\\; \\sum_j \\alpha_j \\, v_j',
		unicode: 'z = Σⱼ αⱼ vⱼ',
		intuition: 'The <i>blended answer</i>: the weighted middle of all the values. “it” ends up pointing somewhere between them — closest to the ones that won attention.',
		desc: 'The contextualised output. A convex combination of all values, each weighted by its attention weight. Always lives inside the convex hull of the values.'
	},
	angle: {
		name: 'angle',
		formula: '\\cos\\theta = \\dfrac{q \\cdot k_j}{\\lVert q \\rVert \\, \\lVert k_j \\rVert}',
		unicode: 'cos θ = q·k / (‖q‖·‖k‖)',
		intuition: '',
		desc: ''
	},

	// ── Hoverable parts of the big equation at the top ──────────────
	// Each entry's `formula` is the general form (pre-rendered once);
	// the tooltip body is built dynamically by _buildExtraInfo() with
	// the concrete numbers for the current token count.
	'eq-qi': {
		name: 'qᵢ — the query',
		formula: 'q_i = x_i \\, W^Q',
		unicode: 'qᵢ = xᵢ · W^Q',
		intuition: '',
		desc: ''
	},
	'eq-kj': {
		name: 'kⱼ — the keys',
		formula: 'k_j = x_j \\, W^K',
		unicode: 'kⱼ = xⱼ · W^K',
		intuition: '',
		desc: ''
	},
	'eq-vj': {
		name: 'vⱼ — the values',
		formula: 'v_j = x_j \\, W^V',
		unicode: 'vⱼ = xⱼ · W^V',
		intuition: '',
		desc: ''
	},
	'eq-alpha': {
		name: 'αᵢⱼ — the attention weight',
		formula: '\\alpha_{ij} = \\dfrac{e^{q_i \\cdot k_j \\,/\\, \\sqrt{d_k}}}{\\sum_n e^{q_i \\cdot k_n \\,/\\, \\sqrt{d_k}}}',
		unicode: 'αᵢⱼ = e^(qᵢ·kⱼ/√dₖ) / Σₙ e^(qᵢ·kₙ/√dₖ)',
		intuition: '',
		desc: ''
	},
	'eq-exp': {
		name: 'exp — exponentiate',
		formula: 'e^{\\text{score}_j}',
		unicode: 'e^score',
		intuition: '',
		desc: ''
	},
	'eq-sum': {
		name: 'Σ — the normalization sum',
		formula: '\\sum_n e^{q_i \\cdot k_n \\,/\\, \\sqrt{d_k}}',
		unicode: 'Σₙ e^(qᵢ·kₙ/√dₖ)',
		intuition: '',
		desc: ''
	},
	'eq-dot': {
		name: 'qᵢ · kⱼ — the dot product',
		formula: 'q_i \\cdot k_j = \\lVert q_i \\rVert \\, \\lVert k_j \\rVert \\, \\cos\\theta',
		unicode: 'qᵢ·kⱼ = ‖qᵢ‖‖kⱼ‖cosθ',
		intuition: '',
		desc: ''
	},
	'eq-sqrt': {
		name: '√dₖ — variance control',
		formula: '\\sqrt{d_k}',
		unicode: '√dₖ  (here √2 ≈ 1.414)',
		intuition: '',
		desc: ''
	},
	'eq-z': {
		name: 'zᵢ — the contextualised output',
		formula: 'z_i = \\sum_j \\alpha_{ij} \\, v_j',
		unicode: 'zᵢ = Σⱼ αᵢⱼ vⱼ',
		intuition: '',
		desc: ''
	},

	// ── Hoverable plot overlays (bars, rectangles, projections) ─────
	'bar-score': {
		name: 'score',
		formula: 'q \\cdot k_j',
		unicode: 'q·kⱼ',
		intuition: '',
		desc: ''
	},
	'bar-scaled': {
		name: 'scaled score',
		formula: '\\dfrac{q \\cdot k_j}{\\sqrt{d_k}}',
		unicode: '(q·kⱼ)/√dₖ',
		intuition: '',
		desc: ''
	},
	'bar-exp': {
		name: 'exp(score)',
		formula: 'e^{s_j}',
		unicode: 'e^s',
		intuition: '',
		desc: ''
	},
	wbar: {
		name: 'attention weight',
		formula: '\\alpha_{ij} = \\dfrac{e^{q_i \\cdot k_j \\,/\\, \\sqrt{d_k}}}{\\sum_n e^{q_i \\cdot k_n \\,/\\, \\sqrt{d_k}}}',
		unicode: 'αᵢⱼ',
		intuition: '',
		desc: ''
	},
	comprect: {
		name: 'element-wise product',
		formula: 'q[d] \\cdot k_j[d]',
		unicode: 'q[d]·kⱼ[d]',
		intuition: '',
		desc: ''
	},
	proj: {
		name: 'projection of q onto kⱼ',
		formula: '\\mathrm{proj}_{\\mathbf{k}_j} \\, \\mathbf{q} = \\dfrac{q \\cdot k_j}{\\lVert k_j \\rVert}',
		unicode: 'proj = q·kⱼ / ‖kⱼ‖',
		intuition: '',
		desc: ''
	},
	span: {
		name: 'the span of the values',
		formula: '\\mathrm{conv}\\big(\\mathbf{v}_1, \\ldots, \\mathbf{v}_m\\big)',
		unicode: 'conv(v₁,…,vₘ)',
		intuition: '',
		desc: ''
	},

	// ── Learnable projections step ─────────────────────────────────
	'proj-input': {
		name: 'x — input embedding',
		formula: '\\mathbf{x}',
		unicode: 'x',
		intuition: '',
		desc: ''
	},
	'proj-q': {
		name: 'q — query',
		formula: '\\mathbf{q} = \\mathbf{W}^Q \\mathbf{x}',
		unicode: 'q = W^Q x',
		intuition: '',
		desc: ''
	},
	'proj-k': {
		name: 'k — key',
		formula: '\\mathbf{k} = \\mathbf{W}^K \\mathbf{x}',
		unicode: 'k = W^K x',
		intuition: '',
		desc: ''
	},
	'proj-v': {
		name: 'v — value',
		formula: '\\mathbf{v} = \\mathbf{W}^V \\mathbf{x}',
		unicode: 'v = W^V x',
		intuition: '',
		desc: ''
	},
	'proj-qk': {
		name: 'q · k',
		formula: '\\mathbf{q} \\cdot \\mathbf{k}',
		unicode: 'q·k',
		intuition: '',
		desc: ''
	},
	'matrix-cell': {
		name: 'α[i][j]',
		formula: '\\alpha_{ij} = \\dfrac{e^{\\mathbf{q}_i \\cdot \\mathbf{k}_j \\,/\\, \\sqrt{d_k}}}{\\sum_n e^{\\mathbf{q}_i \\cdot \\mathbf{k}_n \\,/\\, \\sqrt{d_k}}}',
		unicode: 'α[i][j]',
		intuition: '',
		desc: ''
	}
};

// Pre-rendered MathML for each vector formula. Filled once by
// AttentionAnatomy._renderFormulas() so the hover tooltip can swap
// content instantly without re-running Temml on every hover.
let TEMML_RENDERED = {};

const AttentionAnatomy = {
	step: 0,

	init: function() {
		if (!document.getElementById('attn-anatomy-2d-svg')) return;

		document.getElementById('attn-anatomy-prev').addEventListener('click', () => this.prev());
		document.getElementById('attn-anatomy-next').addEventListener('click', () => this.next());

		// Token-count selector. Recomputes every derived quantity and
		// re-renders; starts at the simplest case (2 tokens).
		const tokenBtns = Array.from(document.querySelectorAll('.attn-token-select button[data-attn-tokens]'));
		tokenBtns.forEach((btn) => {
			btn.addEventListener('click', () => {
				const n = parseInt(btn.dataset.attnTokens, 10);
				if (n === ATTN_2D.numTokens) return;
				ATTN_2D.setNumTokens(n);
				tokenBtns.forEach((b) => b.classList.toggle('active', b === btn));
				this.render();
			});
		});

		// Predefined token-set dropdown. Switching the set swaps all
		// keys/values/queries (and token names) at once so the user
		// can compare attention regimes side by side: clear winner,
		// two-way race, nothing relates, strong winner.
		const setSelect = document.getElementById('attn-set-select');
		if (setSelect) {
			// Populate the options from ATTN_SETS.
			setSelect.innerHTML = '';
			ATTN_SETS.forEach((s, i) => {
				const opt = document.createElement('option');
				opt.value = String(i);
				opt.textContent = s.label;
				if (i === ATTN_2D.exampleIdx) opt.selected = true;
				setSelect.appendChild(opt);
			});
			setSelect.addEventListener('change', () => {
				const idx = parseInt(setSelect.value, 10);
				if (idx === ATTN_2D.exampleIdx) return;
				ATTN_2D.setExample(idx);
				this.render();
			});
		}

		// Pre-render the vector formula LaTeX to MathML via Temml, once.
		// The hover tooltip then just swaps innerHTML — instant, no
		// re-render cost per hover.
		this._renderFormulas();
		this._setupSentenceHover();
		this._setupFormulaHover();

		// Global error catcher — any uncaught JS error gets logged AND
		// shown in the debug panel so the user can paste it verbatim.
		window.addEventListener('error', (ev) => {
			const msg = `${ev.message}  @${ev.filename}:${ev.lineno}:${ev.colno}`;
			this._dbg('ERROR', `window.error: ${msg}`);
		});
		window.addEventListener('unhandledrejection', (ev) => {
			this._dbg('ERROR', `unhandledrejection: ${ev.reason}`);
		});

		// Draw the static background (grid + axes) ONCE.
		this._initSVG();

		// First debug paint so the panel is populated even before any
		// hover event.
		this._updateDebug();

		// ── SELFTEST ────────────────────────────────────────────────
		// Verify every token span in the rendered sentence has a
		// valid data-token attribute. This catches regex / escape /
		// rendering bugs BEFORE the user hovers anything.
		const sentTokens = document.querySelectorAll('#attn-sentence .attn-token');
		this._dbg('INFO', `SELFTEST: found ${sentTokens.length} token spans in sentence`);
		sentTokens.forEach((span, i) => {
			const dt = span.dataset.token;
			const idx = parseInt(dt, 10);
			const expected = ATTN_TOKENS.findIndex(t => t.name === span.textContent);
			const ok = idx === expected;
			this._dbg(ok ? 'OK' : 'ERROR',
				`SELFTEST[${i}] "${span.textContent}" data-token="${dt}" parsed=${idx} expected=${expected}`);
		});

		this._dbg('INFO', `init() done, step=${this.step}, example=${ATTN_2D.exampleIdx}`);

		// Hover tooltips on the parts of the big equation. The equation
		// is rebuilt on every step, so we use event delegation on the
		// container instead of attaching handlers to each fragment.
		const eqEl = document.getElementById('attn-anatomy-equation');
		if (eqEl) {
			eqEl.addEventListener('mouseover', (e) => {
				const t = e.target.closest ? e.target.closest('.eq-tip') : null;
				if (t) this._showTooltip(t.dataset.tip, null, e.clientX, e.clientY);
				else this._hideTooltip();
			});
			eqEl.addEventListener('mousemove', (e) => {
				const t = e.target.closest ? e.target.closest('.eq-tip') : null;
				if (t) this._showTooltip(t.dataset.tip, null, e.clientX, e.clientY);
			});
			eqEl.addEventListener('mouseleave', () => this._hideTooltip());
		}

		// Hover tooltips on the rows of the "Currently computing" panel.
		// Same delegation pattern — the rows are rebuilt on every step.
		const compEl = document.getElementById('attn-section-computation');
		if (compEl) {
			const compRow = (e) => e.target.closest ? e.target.closest('.comp-eq') : null;
			const showComp = (e) => {
				const t = compRow(e);
				if (!t) return false;
				const idx = t.dataset.idx != null ? parseInt(t.dataset.idx, 10) : null;
				this._showTooltip(t.dataset.tip, idx, e.clientX, e.clientY);
				return true;
			};
			compEl.addEventListener('mouseover', (e) => {
				if (!showComp(e)) this._hideTooltip();
			});
			compEl.addEventListener('mousemove', showComp);
			compEl.addEventListener('mouseleave', () => this._hideTooltip());
		}

		// Keyboard navigation: ← / → step through. Skipped while typing
		// in form fields so this never steals input events.
		this._keyHandler = (e) => {
			const t = e.target;
			if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
			if (e.key === 'ArrowLeft')  { e.preventDefault(); this.prev(); }
			if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
		};
		document.addEventListener('keydown', this._keyHandler);

		// First render — fills in the arrows for step 1.
		this.render();

		if (window.__MN_DARK) {
			window.__MN_DARK.onChange(() => { this._themeSVG(); this.render(); });
		}
	},

	// Build the tooltip body for an arrow (or an angle arc). Returns:
	//   { name, intuition, concreteLatex, formulaLatex, unicode, desc }
	// - intuition is the plain-language "what this MEANS" headline
	// - concreteLatex is the concrete equation with the values filled
	//   in, e.g. "k₁ = [0.90, 0.45]" — underbraced with a label
	// - formulaLatex is the Temml LaTeX for the general formula
	// - unicode is the fallback text shown if Temml can't render
	// - desc is the mathematical explanation underneath
	_buildArrowInfo: function(key, idx) {
		const fmt    = (v) => v.toFixed(2);
		const fmtVec = (v) => v ? `[${fmt(v[0])},\\; ${fmt(v[1])}]` : '\\text{n/a}';
		const VF = VECTOR_FORMULAS;
		switch (key) {
			case 'q':
				return {
					name: 'q  (the query)',
					intuition: VF.q.intuition,
					concreteLatex: `\\underbrace{\\mathbf{q} = ${fmtVec(ATTN_2D.q)}}_{\\text{query}}`,
					formulaLatex: VF.q.formula,
					unicode: VF.q.unicode,
					desc: VF.q.desc
				};
			case 'k': {
				const k = ATTN_2D.keys[idx];
				const t = ATTN_TOKENS[idx + 1].name;
				return {
					name: `k${idx+1}  (key of “${t}”)`,
					intuition: `The arrow of <b>“${t}”</b> — what this word <i>advertises</i> it contains. ${VF.k.intuition}`,
					concreteLatex: `\\underbrace{\\mathbf{k}_{${idx+1}} = ${fmtVec(k)}}_{\\text{key of “${t}”}}`,
					formulaLatex: VF.k.formula,
					unicode: VF.k.unicode,
					desc: VF.k.desc
				};
			}
			case 'v': {
				const v = ATTN_2D.vals[idx];
				const t = ATTN_TOKENS[idx + 1].name;
				return {
					name: `v${idx+1}  (value of “${t}”)`,
					intuition: `What <b>“${t}”</b> actually contributes to the answer. ${VF.v.intuition}`,
					concreteLatex: `\\underbrace{\\mathbf{v}_{${idx+1}} = ${fmtVec(v)}}_{\\text{value of “${t}”}}`,
					formulaLatex: VF.v.formula,
					unicode: VF.v.unicode,
					desc: VF.v.desc
				};
			}
			case 'weightedV': {
				const wv = ATTN_2D.weightedVals[idx];
				const t = ATTN_TOKENS[idx + 1].name;
				return {
					name: `α${idx+1}·v${idx+1}  (“${t}”, scaled)`,
					intuition: `How much of <b>“${t}”</b> makes it into the answer. ${VF.weightedV.intuition}`,
					concreteLatex: `\\underbrace{\\alpha_{${idx+1}} \\, \\mathbf{v}_{${idx+1}} = ${fmtVec(wv)}}_{\\text{weight} \\times \\text{value}}`,
					formulaLatex: VF.weightedV.formula,
					unicode: VF.weightedV.unicode,
					desc: VF.weightedV.desc
				};
			}
			case 'z':
				return {
					name: 'z  (the output)',
					intuition: VF.z.intuition,
					concreteLatex: `\\underbrace{\\mathbf{z} = ${fmtVec(ATTN_2D.output)}}_{\\text{contextualised output}}`,
					formulaLatex: VF.z.formula,
					unicode: VF.z.unicode,
					desc: VF.z.desc
				};
			case 'angle': {
				const q = ATTN_2D.q;
				const k = ATTN_2D.keys[idx];
				const t = ATTN_TOKENS[idx + 1].name;
				const norm = (v) => Math.hypot(v[0], v[1]);
				const nq = norm(q), nk = norm(k);
				const cosT = Math.max(-1, Math.min(1, (q[0]*k[0] + q[1]*k[1]) / (nq * nk)));
				const deg = Math.round(Math.acos(cosT) * 180 / Math.PI);
				const score = q[0]*k[0] + q[1]*k[1];
				const scaled = score / Math.sqrt(ATTN_2D.d_k);
				const w = (ATTN_2D.weights[idx] || 0);

				let intuition;
				if (cosT > 0.85) {
					intuition = `<b>${(w*100).toFixed(1)}%</b> of the attention. “${t}” is almost parallel to the query — large positive score, winner.`;
				} else if (cosT > 0.3) {
					intuition = `<b>${(w*100).toFixed(1)}%</b> of the attention. “${t}” points roughly the same way — positive score, partial match.`;
				} else if (cosT > -0.3) {
					intuition = `<b>${(w*100).toFixed(1)}%</b> of the attention. “${t}” is near right angles — near-zero score, near-uniform share.`;
				} else {
					intuition = `<b>${(w*100).toFixed(1)}%</b> of the attention. “${t}” points the opposite way — negative score, almost no weight.`;
				}

				return {
					name: `angle: q (“it”) ↔ k${idx+1} (“${t}”)`,
					intuition,
					concreteLatex: `\\underbrace{\\theta \\approx ${deg}^\\circ}_{\\cos\\theta \\approx ${cosT.toFixed(3)}}`,
					formulaLatex: '\\cos\\theta = \\dfrac{q \\cdot k_j}{\\lVert q \\rVert \\, \\lVert k_j \\rVert}',
					unicode: `cos θ ≈ ${cosT.toFixed(2)}  →  θ ≈ ${deg}°`,
					desc: `Score: $q \\cdot k_{${idx+1}} = (${q[0].toFixed(2)})(${k[0].toFixed(2)}) + (${q[1].toFixed(2)})(${k[1].toFixed(2)}) = ${score.toFixed(3)}$. Scaled by $\\sqrt{d_k}$: ${scaled.toFixed(3)}. After softmax: $\\alpha_{${idx+1}} = ${w.toFixed(3)} = ${(w*100).toFixed(1)}\\%$.`
				};
			}
		}
		return this._buildExtraInfo(key, idx);
	},

	// Tooltip content for everything else that is hoverable but is not a
	// plain arrow: the parts of the big equation (q_i, k_j, α_ij, Σ, exp,
	// √d_k, v_j, z), the bars, the component-product rectangles, the
	// projection dots, the weight-bar segments and the span fill. Each
	// one shows the general formula AND the live numbers so hovering is
	// always enough to "see" where a value comes from.
	_buildExtraInfo: function(key, idx) {
		const AT  = ATTN_TOKENS;
		const q   = ATTN_2D.q;
		const VF  = VECTOR_FORMULAS;
		const fmt = (n) => n.toFixed(2);
		const sum = ATTN_2D.exps.reduce((a, b) => a + b, 0);
		const d   = ATTN_2D.demo;
		const klist  = ATTN_2D.keys.map((k, j) => `\\mathbf{k}_{${j+1}} = (${fmt(k[0])},\\; ${fmt(k[1])})`).join(',\\qquad ');
		const vtoks  = ATTN_2D.vals.map((v, j) => `\\mathbf{v}_{${j+1}} = (${fmt(v[0])},\\; ${fmt(v[1])})`).join(',\\qquad ');
		const alphas = ATTN_2D.weights.map((w, j) => `\\alpha_{${j+1}} = ${(w * 100).toFixed(1)}\\%`).join(',\\qquad ');

		switch (key) {
			case 'eq-qi':
				return {
					name: 'qᵢ — the query',
					intuition: 'The arrow of <b>“it”</b>: the direction it is <i>looking for</i> a match. Every other vector is scored against this one.',
					concreteLatex: `\\mathbf{q} = (${fmt(q[0])},\\; ${fmt(q[1])})`,
					formulaLatex: VF['eq-qi'].formula,
					unicode: 'qᵢ = xᵢ · W^Q',
					desc: 'Token $i$ (“it”) is multiplied by the learned query matrix $W^Q$. The result is the direction attention searches along.'
				};
			case 'eq-kj':
				return {
					name: 'kⱼ — the keys',
					intuition: 'The words that <b>advertise</b> what they contain. The closer a key points to the query, the more “it” attends to it.',
					concreteLatex: klist,
					formulaLatex: VF['eq-kj'].formula,
					unicode: 'kⱼ = xⱼ · W^K',
					desc: `Each key is the projection of its token: $k_j = x_j W^K$. Active keys here: ${ATTN_2D.keys.map((k, j) => `${AT[j+1].name}`).join(', ')}.`
				};
			case 'eq-vj':
				return {
					name: 'vⱼ — the values',
					intuition: 'The actual <b>payload</b> each token contributes to the blended answer. Keys say <i>what</i> to attend to; values carry the content.',
					concreteLatex: vtoks,
					formulaLatex: VF['eq-vj'].formula,
					unicode: 'vⱼ = xⱼ · W^V',
					desc: 'The value vectors get blended into the output, each weighted by its attention weight.'
				};
			case 'eq-alpha':
				return {
					name: 'αᵢⱼ — the attention weight',
					intuition: 'How much of each token’s value “it” mixes in. The weights <b>sum to exactly 100%</b> — a finite budget of attention.',
					concreteLatex: alphas,
					formulaLatex: VF['eq-alpha'].formula,
					unicode: 'αᵢⱼ = e^(qᵢ·kⱼ/√dₖ) / Σₙ e^(qᵢ·kₙ/√dₖ)',
					desc: 'The softmax weight of key $j$ for query $i$. Always between $0$ and $1$, and $\\sum_j \\alpha_{ij} = 1$.'
				};
			case 'eq-exp':
				return {
					name: 'exp — exponentiate',
					intuition: 'exp turns every score <b>positive</b> and amplifies differences: the biggest input grows the most, so it starts to dominate.',
					concreteLatex: ATTN_2D.exps.map((e, j) => `e^{${ATTN_2D.scaled[j].toFixed(3)}} = ${e.toFixed(3)}`).join(',\\qquad '),
					formulaLatex: VF['eq-exp'].formula,
					unicode: 'e^score',
					desc: 'Exponentiating the scaled score makes all values positive. Only the relative sizes then matter — which is exactly what softmax normalizes away.'
				};
			case 'eq-sum':
				return {
					name: 'Σ — the normalization sum',
					intuition: 'The <b>total</b> of all exp(score)s. Dividing each exp(score) by this total turns them into weights that sum to 100%.',
					concreteLatex: `${ATTN_2D.exps.map((e) => e.toFixed(3)).join(' + ')} = ${sum.toFixed(3)}`,
					formulaLatex: VF['eq-sum'].formula,
					unicode: 'Σₙ e^(qᵢ·kₙ/√dₖ)',
					desc: 'The denominator of softmax — the sum over all keys of their exponentiated scaled scores.'
				};
			case 'eq-dot':
				return {
					name: 'qᵢ · kⱼ — the dot product',
					intuition: 'Directional <b>agreement</b>: positive means the same way, negative means opposite. These are the raw attention scores.',
					concreteLatex: `q\\cdot k_{1} = (${fmt(q[0])})(${fmt(ATTN_2D.keys[0][0])}) + (${fmt(q[1])})(${fmt(ATTN_2D.keys[0][1])}) = ${ATTN_2D.scores[0].toFixed(3)}` + ATTN_2D.keys.slice(1).map((k, j) => `,\\; q\\cdot k_{${j+2}} = ${ATTN_2D.scores[j+1].toFixed(3)}`).join(''),
					formulaLatex: VF['eq-dot'].formula,
					unicode: 'qᵢ·kⱼ = ‖qᵢ‖‖kⱼ‖cosθ',
					desc: 'The dot product is the projection of $\\mathbf{q}$ onto $\\mathbf{k}$, scaled by $\\lVert\\mathbf{k}\\rVert$.'
				};
			case 'eq-sqrt':
				return {
					name: '√dₖ — variance control',
					intuition: 'Dividing by $\\sqrt{2} \\approx 1.414$ keeps the scores near magnitude $1$. In a real model $d_k = 64$, so $\\sqrt{64} = 8$ — without this the softmax would saturate to a hard one-hot.',
					concreteLatex: '\\sqrt{d_k} = \\sqrt{2} = 1.414',
					formulaLatex: VF['eq-sqrt'].formula,
					unicode: '√dₖ  (here √2 ≈ 1.414)',
					desc: 'Scaling factor that keeps the variance of the scores near $1$, independent of the key dimension $d_k$.'
				};
			case 'eq-z':
				return {
					name: 'zᵢ — the contextualised output',
					intuition: 'The <b>blended answer</b> for “it”: the weighted middle of all values, pulled toward the ones that won attention.',
					concreteLatex: `\\mathbf{z} = (${fmt(ATTN_2D.output[0])},\\; ${fmt(ATTN_2D.output[1])})`,
					formulaLatex: VF['eq-z'].formula,
					unicode: 'zᵢ = Σⱼ αᵢⱼ vⱼ',
					desc: 'A convex combination — z always lies inside the span of the value vectors.'
				};

			case 'bar-score': {
				const k = ATTN_2D.keys[idx];
				const s = ATTN_2D.scores[idx];
				return {
					name: `score q·k${idx+1}  (“${AT[idx+1].name}”)`,
					intuition: `How strongly <b>“${AT[idx+1].name}”</b> aligns with “it”. Positive = same direction, negative = opposite. This is the raw input to softmax.`,
					concreteLatex: `q\\cdot k_{${idx+1}} = (${fmt(q[0])})(${fmt(k[0])}) + (${fmt(q[1])})(${fmt(k[1])}) = ${s.toFixed(3)}`,
					formulaLatex: VF['bar-score'].formula,
					unicode: `q·k${idx+1} = ${s.toFixed(3)}`,
					desc: `The bar’s height is the attention score of key ${idx+1}, before any scaling.`
				};
			}
			case 'bar-scaled': {
				const s = ATTN_2D.scores[idx], sc = ATTN_2D.scaled[idx];
				return {
					name: `scaled score s${idx+1}  (“${AT[idx+1].name}”)`,
					intuition: `The score divided by $\\sqrt{2} \\approx 1.414$. The bar <b>shrank</b> — this keeps the numbers near magnitude $1$ so softmax stays smooth.`,
					concreteLatex: `\\frac{${s.toFixed(3)}}{\\sqrt{2}} = ${sc.toFixed(3)}`,
					formulaLatex: VF['bar-scaled'].formula,
					unicode: `s${idx+1} = ${sc.toFixed(3)}`,
					desc: `The scaled attention score of key ${idx+1}: $\\frac{q \\cdot k_{${idx+1}}}{\\sqrt{d_k}}$.`
				};
			}
			case 'bar-exp': {
				const sc = ATTN_2D.scaled[idx], ex = ATTN_2D.exps[idx];
				return {
					name: `exp(score)  (“${AT[idx+1].name}”)`,
					intuition: `The bar <b>grew</b>: exp turns every number positive and amplifies the biggest one the most. “${AT[idx+1].name}” now towers over the rest.`,
					concreteLatex: `e^{${sc.toFixed(3)}} = ${ex.toFixed(3)}`,
					formulaLatex: VF['bar-exp'].formula,
					unicode: `e^s = ${ex.toFixed(3)}`,
					desc: `The exponentiated scaled score of key ${idx+1}. Always positive; a bigger input yields a much bigger output.`
				};
			}
			case 'wbar': {
				const w = ATTN_2D.weights[idx];
				return {
					name: `α${idx+1} — attention weight (“${AT[idx+1].name}”)`,
					intuition: `“${AT[idx+1].name}” receives <b>${(w * 100).toFixed(1)}%</b> of “it”’s attention. The segments together exactly fill the bar — a 100% budget.`,
					concreteLatex: `\\alpha_{${idx+1}} = \\frac{${ATTN_2D.exps[idx].toFixed(3)}}{${sum.toFixed(3)}} = ${w.toFixed(3)}`,
					formulaLatex: VF.wbar.formula,
					unicode: `α${idx+1} = ${w.toFixed(3)}`,
					desc: `The share of the attention budget that key ${idx+1} wins. Summed over all keys it equals $1$.`
				};
			}
			case 'comprect': {
				const j = Math.floor(idx / 2);   // key index
				const d = idx % 2;                // dimension (0 or 1)
				const kj = ATTN_2D.keys[j];
				const a = q[d], b = kj[d];
				const tk = ATTN_TOKENS[j + 1].name;
				const dim = d + 1;
				return {
					name: `q[${dim}] · k${j+1}[${dim}]  (${tk}, dim ${dim})`,
					intuition: `The <b>area of this rectangle</b> is the per-dimension product ${fmt(a)} × ${fmt(b)}. Same sign → positive; opposite → negative.`,
					concreteLatex: `(${fmt(a)})(${fmt(b)}) = ${(a * b).toFixed(3)}`,
					formulaLatex: VF.comprect.formula,
					unicode: `q[${dim}]·k${j+1}[${dim}] = ${(a * b).toFixed(3)}`,
					desc: `The dot product for key ${j+1} is the sum of its two rectangles: $q \\cdot k_{${j+1}} = q[1]\\,k_{${j+1}}[1] + q[2]\\,k_{${j+1}}[2] = ${(a*b).toFixed(3)} + ${(q[1-d]*kj[1-d]).toFixed(3)} = ${ATTN_2D.scores[j].toFixed(3)}$.`
				};
			}
			case 'proj': {
				const k = ATTN_2D.keys[idx];
				const nk = Math.hypot(k[0], k[1]);
				const dot = ATTN_2D.scores[idx];
				const len = dot / nk;
				return {
					name: `projection of q onto k${idx+1} (“${AT[idx+1].name}”)`,
					intuition: `The dashed line drops “it”’s arrow <b>perpendicularly</b> onto k${idx+1}’s line. The dot shows how much of “it” points along “${AT[idx+1].name}”: length ${len.toFixed(2)}. Positive → same way, negative → it lands behind the origin.`,
					concreteLatex: `\\frac{q \\cdot k_{${idx+1}}}{\\lVert k_{${idx+1}} \\rVert} = \\frac{${dot.toFixed(3)}}{${nk.toFixed(3)}} = ${len.toFixed(3)}`,
					formulaLatex: VF.proj.formula,
					unicode: `proj = ${len.toFixed(3)}`,
					desc: `The scalar projection of $\\mathbf{q}$ onto $\\mathbf{k}_{${idx+1}}$. Multiply it by $\\lVert\\mathbf{k}_{${idx+1}}\\rVert$ and you recover the score $q\\cdot k_{${idx+1}} = ${dot.toFixed(3)}$.`
				};
			}
			case 'span':
				return {
					name: 'the span of the values',
					intuition: 'z is a <b>weighted average</b> of the value tips, so it can never leave this region. Attention can only interpolate what is already there — it cannot create new directions.',
					concreteLatex: `\\mathrm{conv}\\big(\\mathbf{v}_1, \\ldots, \\mathbf{v}_{${ATTN_2D.vals.length}}\\big)`,
					formulaLatex: VF.span.formula,
					unicode: 'conv(v₁,…,vₘ)',
					desc: `The convex hull of the value tips. Since $\\mathbf{z} = \\sum_j \\alpha_j \\mathbf{v}_j$ with $\\alpha_j \\ge 0$ and $\\sum_j \\alpha_j = 1$, $\\mathbf{z}$ always lands inside this region.`
				};
			case 'proj-input':
				return {
					name: 'x — the input embedding',
					intuition: 'The <b>raw</b> token representation, before any learned projection. Same x feeds all three branches below.',
					concreteLatex: `\\mathbf{x} = (${d.x[0].toFixed(2)},\\; ${d.x[1].toFixed(2)})`,
					formulaLatex: '\\mathbf{x}',
					unicode: 'x',
					desc: 'In a real model, $\\mathbf{x}$ is the token embedding (e.g. the 768-dim output of the previous layer for GPT-2). Here it is 2D so the geometry stays visible.'
				};
			case 'proj-q':
				return {
					name: 'q — the query (W^Q · x)',
					intuition: 'The <b>search direction</b>. W^Q is the identity here, so q points exactly along x — the query is just the raw token direction.',
					concreteLatex: `\\mathbf{q} = \\mathbf{W}^Q \\mathbf{x} = (${d.q[0].toFixed(2)},\\; ${d.q[1].toFixed(2)})`,
					formulaLatex: '\\mathbf{q} = \\mathbf{W}^Q \\mathbf{x}',
					unicode: 'q = W^Q x',
					desc: '$\\mathbf{W}^Q$ is a $d_k \\times d_{\\text{model}}$ matrix in a real Transformer — here a $2 \\times 2$ matrix so we can see it. Trained end-to-end so related queries point similar ways.'
				};
			case 'proj-k':
				return {
					name: 'k — the key (W^K · x)',
					intuition: 'The <b>advertised content</b>. W^K here is a 90° rotation, so k points perpendicular to x — a deliberately different "view" of the same token.',
					concreteLatex: `\\mathbf{k} = \\mathbf{W}^K \\mathbf{x} = (${d.k[0].toFixed(2)},\\; ${d.k[1].toFixed(2)})`,
					formulaLatex: '\\mathbf{k} = \\mathbf{W}^K \\mathbf{x}',
					unicode: 'k = W^K x',
					desc: '$\\mathbf{W}^K$ is trained so related keys point similar ways — so they can be matched by similar queries via $\\mathbf{q} \\cdot \\mathbf{k}$.'
				};
			case 'proj-v':
				return {
					name: 'v — the value (W^V · x)',
					intuition: 'The <b>payload</b>. W^V here is a horizontal shear, so v is x stretched along Dim 1 — a third independent "view".',
					concreteLatex: `\\mathbf{v} = \\mathbf{W}^V \\mathbf{x} = (${d.v[0].toFixed(2)},\\; ${d.v[1].toFixed(2)})`,
					formulaLatex: '\\mathbf{v} = \\mathbf{W}^V \\mathbf{x}',
					unicode: 'v = W^V x',
					desc: '$\\mathbf{W}^V$ is trained to put the token\'s content in a space where the weighted average $\\sum_j \\alpha_j \\mathbf{v}_j$ produces a useful output. The keys and values live in <i>different</i> spaces — keys serve matching, values serve blending.'
				};
			case 'proj-qk':
				return {
					name: 'q · k — the dot product',
					intuition: 'How well the search direction matches the advertised content. Large = strong attention.',
					concreteLatex: `\\mathbf{q} \\cdot \\mathbf{k} = ${d.qk.toFixed(3)}`,
					formulaLatex: '\\mathbf{q} \\cdot \\mathbf{k}',
					unicode: `q·k = ${d.qk.toFixed(3)}`,
					desc: 'This scalar is the input to the rest of the pipeline: scaled by $1/\\sqrt{d_k}$, exponentiated, then softmax-normalised into the attention weight $\\alpha$.'
				};
			case 'matrix-cell': {
				const i = Math.floor(idx / 10);
				const j = idx % 10;
				// Guard: matrix has _allKeys.length columns, not n. The
				// trailing column(s) would index an undefined key — return
				// a minimal tooltip instead of crashing.
				if (i >= ATTN_2D._allQueries.length || j >= ATTN_2D._allKeys.length) {
					return {
						name: `α[${i+1}][${j+1}]`,
						intuition: 'no key for this position in the single-query demo',
						concreteLatex: '\\text{n/a}',
						formulaLatex: '\\alpha_{ij}',
						unicode: 'α[i][j] = n/a',
						desc: 'This cell is outside the available key range.'
					};
				}
				const qi = ATTN_2D._allQueries[i], kj = ATTN_2D._allKeys[j];
				const score = qi[0]*kj[0] + qi[1]*kj[1];
				const scaled = score / Math.sqrt(ATTN_2D.d_k);
				const w = (ATTN_2D.matrix[i] || [])[j] || 0;
				const qName = ATTN_TOKENS[i].name, kName = ATTN_TOKENS[j].name;
				return {
					name: `α[${i+1}][${j+1}]  —  ${qName} → ${kName}`,
					intuition: `How much <b>${qName}</b> attends to <b>${kName}</b>.`,
					concreteLatex: `\\alpha_{${i+1},${j+1}} = ${w.toFixed(3)} = ${(w*100).toFixed(1)}\\%`,
					formulaLatex: '\\alpha_{ij} = \\dfrac{e^{\\mathbf{q}_i \\cdot \\mathbf{k}_j \\,/\\, \\sqrt{d_k}}}{\\sum_n e^{\\mathbf{q}_i \\cdot \\mathbf{k}_n \\,/\\, \\sqrt{d_k}}}',
					unicode: `α[${i+1}][${j+1}] = ${(w*100).toFixed(1)}%`,
					desc: `Score: $\\mathbf{q}_{${i+1}} \\cdot \\mathbf{k}_{${j+1}} = (${qi[0].toFixed(2)})(${kj[0].toFixed(2)}) + (${qi[1].toFixed(2)})(${kj[1].toFixed(2)}) = ${score.toFixed(3)}$. Scaled: ${scaled.toFixed(3)}. After softmax over all keys for this query: weight = ${w.toFixed(3)}.`
				};
			}
		}
		return null;
	},

	// Pre-render each VECTOR_FORMULAS entry's LaTeX to MathML via Temml.
	// Bulletproof: tries up to 20 times with 25ms delays so even if Temml
	// loads asynchronously we still get rendered MathML in the end.
	_renderFormulas: function() {
		const tmp = document.createElement('div');
		tmp.style.position = 'absolute';
		tmp.style.left = '0';
		tmp.style.top = '0';
		tmp.style.width = '600px';
		tmp.style.visibility = 'hidden';
		tmp.style.pointerEvents = 'none';
		document.body.appendChild(tmp);

		const sleep = (ms) => {
			const s = Date.now();
			while (Date.now() - s < ms) { /* synchronous wait */ }
		};

		for (const key in VECTOR_FORMULAS) {
			const info = VECTOR_FORMULAS[key];
			const latex = info.formula;
			let rendered = '';

		for (let attempt = 0; attempt < 20; attempt++) {
			tmp.innerHTML = `$$ ${latex} $$`;
			if (typeof render_temml === 'function') {
				try { render_temml(tmp); } catch (e) { /* swallow */ }
			}
				if (tmp.innerHTML.indexOf('$$') === -1) {
					rendered = tmp.innerHTML;
					break;
				}
				sleep(25);
			}
			TEMML_RENDERED[key] = rendered;
		}
		document.body.removeChild(tmp);
	},

	next: function() {
		if (this.step < ATTN_STEPS.length - 1) {
			this.step++;
			this.render();
		}
	},

	prev: function() {
		if (this.step > 0) {
			this.step--;
			this.render();
		}
	},

	goto: function(n) {
		this.step = Math.max(0, Math.min(ATTN_STEPS.length - 1, n));
		this.render();
	},

	render: function() {
		const data = ATTN_STEPS[this.step];

		// The tooltip caches content per (key, idx); after a re-render
		// the numbers may have changed (e.g. token count), so drop it.
		this._tipContentKey = null;

		// Brief opacity dip on the left column while we swap content.
		// The right column (plot/bars) just transitions its traces, no fade.
		const fadeTargets = [
			document.getElementById('attn-anatomy-equation'),
			document.getElementById('attn-anatomy-computation'),
			document.getElementById('attn-anatomy-intuition')
		].filter(Boolean);
		fadeTargets.forEach(el => { el.style.opacity = '0.35'; });

		// Header bits
		const titleEl = document.getElementById('attn-anatomy-step-title');
		const numEl   = document.getElementById('attn-anatomy-step-num');
		const totalEl = document.querySelector('.step-total');
		if (numEl)   numEl.textContent   = `Step ${this.step + 1}`;
		if (totalEl) totalEl.textContent = `of ${ATTN_STEPS.length}`;
		if (titleEl) titleEl.innerHTML    = `— ${data.title}`;

		// Update each panel
		this.renderEquation(data);
		this.renderComputation(data);
		this.renderIntuition(data);
		this._renderSentence();
		this.render2D(data);
		this._renderBarPlots(data);

		// Temml is loaded by load_base_js(); it scans the document for
		// $...$ / $$...$$ blocks and replaces them with MathML. After
		// that, swap every <mn data-field="..."> in the computation
		// panel for an editable HTML span so the rendered formulas
		// stay click-to-edit.
		if (typeof render_temml === 'function') {
			try { render_temml(); } catch (e) { /* ignore */ }
		}
		this._makeMathEditable();

		// Fade back in on the next frame so the transition is visible.
		requestAnimationFrame(() => {
			fadeTargets.forEach(el => { el.style.opacity = ''; });
		});

		document.getElementById('attn-anatomy-prev').disabled = (this.step === 0);
		document.getElementById('attn-anatomy-next').disabled = (this.step === ATTN_STEPS.length - 1);

		// Refresh the debug panel so it reflects the current step.
		this._updateDebug();
	},

	// Render the FULL equation as Temml / LaTeX. Active sub-expressions
	// (those listed in `data.eqActive`) are wrapped in \color{#2563eb}
	// + \mathbf{} so they appear blue and bold after Temml renders them.
	renderEquation: function(data) {
		const el = document.getElementById('attn-anatomy-equation');
		if (!el) return;

		const active = new Set(data.eqActive || []);
		// Active sub-expression gets boxed + bold blue so the user can
		// see exactly which part of the equation the current step is
		// computing. \boxed comes from amsmath; \color from xcolor.
		const hl = (latex, region) => {
			if (active.has(region)) return `\\boxed{\\color{#2563eb}\\mathbf{${latex}}}`;
			return latex;
		};

		// Every sub-expression is wrapped in its own span (data-tip =
		// tooltip key) and rendered as INLINE math ($...$ not $$...$$,
		// so all fragments sit on one shared baseline and the line reads
		// as a single equation) but each piece is individually hoverable.
		const frag = (tip, latex) => `<span class="eq-tip" data-tip="${tip}">$${latex}$</span>`;
		const sym  = (txt) => `<span class="eq-sym">${txt}</span>`;

		// Output line: z_i = Σ_j α_ij · v_j
		const outputLine =
			frag('eq-z', hl('z_i', '')) +
			sym('=') +
			frag('eq-sum', hl('\\sum_j', 'sum')) +
			frag('eq-alpha', hl('\\alpha_{ij}', 'alpha')) +
			sym('·') +
			frag('eq-vj', hl('v_j', 'value'));

		// Weight line: α_ij = exp( q_i · k_j / √d_k ) ÷ Σ_n exp( q_i · k_n / √d_k )
		// When the 'dot' region is active, box both q_i and k_j so the
		// product reads as one highlighted unit.
		const dotHL = (latex) => hl(latex, 'dot');
		const weightLine =
			frag('eq-alpha', hl('\\alpha_{ij}', 'alpha')) +
			sym('=') +
			frag('eq-exp', hl('\\mathrm{exp}', 'exp')) +
			sym('(') +
			frag('eq-qi', dotHL('q_i')) +
			sym('·') +
			frag('eq-kj', dotHL('k_j')) +
			sym('/') +
			frag('eq-sqrt', hl('\\sqrt{d_k}', 'sqrt')) +
			sym(')') +
			sym('÷') +
			frag('eq-sum', hl('\\sum_n \\mathrm{exp}(q_i \\cdot k_n \\big/ \\sqrt{d_k})', 'denom'));

		el.innerHTML =
			'<div class="eq-line" id="attn-section-output">' +
				'<div class="eq-label">Output</div>' +
				'<div class="eq-formula">' + outputLine + '</div>' +
			'</div>' +
			'<div class="eq-line" id="attn-section-weight">' +
				'<div class="eq-label">Weight</div>' +
				'<div class="eq-formula">' + weightLine + '</div>' +
			'</div>';
	},

	// Populate the "Currently computing" panel with the actual numerical
	// computation for this step. Shows real numbers so the user can see
	// exactly what the active sub-expression of the equation does.
	renderComputation: function(data) {
		const el = document.getElementById('attn-section-computation');
		if (!el) return;
		const fn = ATTN_COMPUTATIONS[data.computation];
		// Each computation function returns a SECOND value (optional): a
		// list of "live value" rows to prepend — a compact overview of
		// every editable value relevant to this step.
		const result = fn ? fn() : '';
		let body = '';
		if (typeof result === 'object' && result.html !== undefined) {
			body = (result.liveVals || '') + result.html;
		} else {
			body = result;
		}
		el.innerHTML = body;
		// Wire up click-to-edit on every <span.ed> we just emitted.
		this._attachEditors(el);
	},

	// Build the "live values" overview panel rendered as Temml math.
	// Each editable value uses \text{◆FIELD|VALUE} so _makeMathEditable
	// can find and replace it with a click-to-edit HTML span after Temml
	// has rendered the surrounding math.
	_liveValsHTML: function(extra) {
		const q = ATTN_2D.q;
		let html = '<div class="attn-live-panel">';
		html += '<div class="attn-live-header">▶ Live values — click any number to edit</div>';
		html += '<div class="attn-live-row">$$ \\mathbf{q} = (\\text{◆q.0|' + q[0].toFixed(2) + '},\\, \\text{◆q.1|' + q[1].toFixed(2) + '}) $$</div>';
		ATTN_TOKENS.slice(1).forEach((tk, j) => {
			if (j >= ATTN_2D.keys.length) return;
			const k = ATTN_2D.keys[j];
			const v = ATTN_2D.vals[j];
			html += '<div class="attn-live-row">$$ \\mathbf{' + tk.name + '} = (\\text{◆keys.' + j + '.0|' + k[0].toFixed(2) + '},\\, \\text{◆keys.' + j + '.1|' + k[1].toFixed(2) + '}) \\;\\; (\\text{◆vals.' + j + '.0|' + v[0].toFixed(2) + '},\\, \\text{◆vals.' + j + '.1|' + v[1].toFixed(2) + '}) $$</div>';
		});
		if (extra) html += extra;
		html += '</div>';
		return html;
	},

	// Same as _liveValsHTML but for the projections step — adds the W
	// matrices as 2×2 editable grids, all rendered as Temml math.
	_liveValsHTMLProjection: function() {
		const d = ATTN_2D.demo;
		const cell = (path, val) => '\\text{◆' + path.replace(/_/g, '\\_') + '|' + val + '}';
		const grid = (W, name) => {
			let g = '\\begin{pmatrix} ';
			for (let i = 0; i < 2; i++) {
				if (i > 0) g += ' \\; ';
				for (let j = 0; j < 2; j++) {
					if (j > 0) g += ' & ';
					g += cell(`demo.${name}.${i}.${j}`, W[i][j].toFixed(2));
				}
			}
			g += ' \\end{pmatrix}';
			return g;
		};
		let html = '<div class="attn-live-panel">';
		html += '<div class="attn-live-header">▶ Live values — click any number to edit (W matrices included)</div>';
		html += '<div class="attn-live-row">$$ \\mathbf{x} = (\\text{◆demo.x.0|' + d.x[0].toFixed(2) + '},\\, \\text{◆demo.x.1|' + d.x[1].toFixed(2) + '}) $$</div>';
		html += '<div class="attn-live-row">$$ \\mathbf{W}^Q = ' + grid(d.W_Q, 'W_Q') + ' $$</div>';
		html += '<div class="attn-live-row">$$ \\mathbf{W}^K = ' + grid(d.W_K, 'W_K') + ' $$</div>';
		html += '<div class="attn-live-row">$$ \\mathbf{W}^V = ' + grid(d.W_V, 'W_V') + ' $$</div>';
		html += '</div>';
		return html;
	},

	// Populate the "Geometric intuition" panel: Temml-rendered math +
	// human-readable explanation of what this step does, where it came
	// from, and how it serves the overall attention computation.
	renderIntuition: function(data) {
		const el = document.getElementById('attn-section-intuition');
		if (!el) return;
		const fn = ATTN_INTUITIONS[data.intuition];
		if (fn) el.innerHTML = fn();
		else el.innerHTML = '';
	},

	// ─── Live-editable values ──────────────────────────────────────
	// Every numeric value in the computation formulas is rendered as a
	// clickable <span class="ed" data-field="..." data-name="...">. Click
	// it → it turns into a number input → Enter/blur → value is written
	// back into the matching ATTN_2D field and the whole scene re-renders.

	// Resolve a dot-separated path to a value on ATTN_2D. Examples:
	//   "q.0"        → ATTN_2D.q[0]
	//   "keys.1.1"   → ATTN_2D.keys[1][1]
	//   "demo.W_Q.0.0" → ATTN_2D.demo.W_Q[0][0]
	//   "demo.x.0"   → ATTN_2D.demo.x[0]
	_resolveField: function(path) {
		return path.split('.').reduce(function(o, k) {
			return o[isNaN(k) ? k : parseInt(k)];
		}, ATTN_2D);
	},

	// Write a value back through a dot-path. Returns true if it was a
	// finite number and the write went through; false otherwise.
	_setField: function(path, value) {
		if (!isFinite(value)) return false;
		const parts = path.split('.');
		const last = parts.pop();
		const obj = parts.reduce(function(o, k) {
			return o[isNaN(k) ? k : parseInt(k)];
		}, ATTN_2D);
		obj[isNaN(last) ? last : parseInt(last)] = value;
		return true;
	},

	// Attach click-to-edit behaviour to every <span.ed> inside `root`.
	// Each editable span becomes an <input type="number"> on click; on
	// Enter or blur the value is committed and everything re-renders.
	_attachEditors: function(root) {
		if (!root) return;
		const self = this;
		root.querySelectorAll('span.ed').forEach(function(span) {
			if (span._editableBound) return;
			span._editableBound = true;
			span.title = 'click to edit — ' + (span.dataset.name || span.dataset.field);
			span.addEventListener('click', function(ev) {
				ev.stopPropagation();
				if (span.querySelector('input')) return;
				const cur = self._resolveField(span.dataset.field);
				const input = document.createElement('input');
				input.type = 'number';
				input.step = '0.01';
				input.value = Number(cur).toFixed(3);
				input.style.width = '4.5em';
				span.textContent = '';
				span.appendChild(input);
				input.focus();
				input.select();
				const commit = function() {
					const v = parseFloat(input.value);
					if (self._setField(span.dataset.field, v)) {
						// Re-derive everything that depends on base values.
						if (span.dataset.field.indexOf('demo') === 0) {
							ATTN_2D._updateDemo();
						}
						ATTN_2D.recomputeWeights();
						ATTN_2D.recomputeMatrix();
						self.render();
						self._tipContentKey = null;
					} else {
						span.textContent = Number(cur).toFixed(3);
					}
				};
				input.addEventListener('blur', commit);
				input.addEventListener('keydown', function(e) {
					if (e.key === 'Enter') { input.blur(); }
					if (e.key === 'Escape') { span.textContent = Number(cur).toFixed(3); }
				});
			});
		});
	},

	// After Temml converts the LaTeX → MathML, every \text{◆FIELD|VALUE}
	// marker becomes a <mtext> element. This method walks the computation
	// panel, finds each of those <mtext> elements, parses out the field
	// path and value, and replaces it with an editable HTML <span.ed> so
	// the user can click any number in a rendered formula and change it.
	_makeMathEditable: function() {
		const compEl = document.getElementById('attn-section-computation');
		if (!compEl) return;
		const self = this;
		const mtexts = compEl.querySelectorAll('mtext');
		mtexts.forEach(function(mtext) {
			const text = mtext.textContent || '';
			// Match "◆FIELD|VALUE" — the marker is rendered as text content.
			const m = text.match(/◆([^|]+)\|([\s\S]+)/);
			if (!m) return;
			// Unescape LaTeX-mandated \_ back to literal _ so the
			// dataset field matches the ATTN_2D path (e.g. W_Q not W\_Q).
			const field = m[1].replace(/\\_/g, '_');
			const value = m[2];
			const span = document.createElement('span');
			span.className = 'ed';
			span.dataset.field = field;
			span.dataset.name = fieldToName(field);
			span.textContent = value;
			if (mtext.parentNode) mtext.parentNode.replaceChild(span, mtext);
		});
		this._attachEditors(compEl);
	},

	// ─── 2D vector scene ────────────────────────────────────────────
	// SVG namespace constant (Plotly is gone — we render raw SVG now)
	_SVG_NS: 'http://www.w3.org/2000/svg',

	// Draw the static background: grid lines + axes + axis labels.
	// Called once from init().
	_initSVG: function() {
		const svg = document.getElementById('attn-anatomy-2d-svg');
		if (!svg) return;

		const NS = this._SVG_NS;
		const gridG   = svg.querySelector('.attn-grid');
		const axesG   = svg.querySelector('.attn-axes');

		// Grid lines at every 0.5
		for (let i = -1; i <= 1; i += 0.5) {
			if (i === 0) continue;
			const h = document.createElementNS(NS, 'line');
			h.setAttribute('x1', -1.4); h.setAttribute('y1', -i);
			h.setAttribute('x2',  1.4); h.setAttribute('y2', -i);
			h.setAttribute('stroke', '#e2e8f0'); h.setAttribute('stroke-width', '0.005');
			gridG.appendChild(h);
			const v = document.createElementNS(NS, 'line');
			v.setAttribute('x1', i); v.setAttribute('y1', -1.4);
			v.setAttribute('x2', i); v.setAttribute('y2',  1.4);
			v.setAttribute('stroke', '#e2e8f0'); v.setAttribute('stroke-width', '0.005');
			gridG.appendChild(v);
		}

		// Axes (thicker, darker)
		const xa = document.createElementNS(NS, 'line');
		xa.setAttribute('x1', -1.4); xa.setAttribute('y1', 0);
		xa.setAttribute('x2',  1.4); xa.setAttribute('y2', 0);
		xa.setAttribute('stroke', '#94a3b8'); xa.setAttribute('stroke-width', '0.012');
		axesG.appendChild(xa);
		const ya = document.createElementNS(NS, 'line');
		ya.setAttribute('x1', 0); ya.setAttribute('y1', -1.4);
		ya.setAttribute('x2', 0); ya.setAttribute('y2',  1.4);
		ya.setAttribute('stroke', '#94a3b8'); ya.setAttribute('stroke-width', '0.012');
		axesG.appendChild(ya);

		// Axis labels
		const xl = document.createElementNS(NS, 'text');
		xl.setAttribute('x', 1.42); xl.setAttribute('y', 0.06);
		xl.setAttribute('fill', '#475569'); xl.setAttribute('font-size', '0.09');
		xl.setAttribute('font-family', 'Inter, sans-serif');
		xl.textContent = 'Dim 1';
		axesG.appendChild(xl);
		const yl = document.createElementNS(NS, 'text');
		yl.setAttribute('x', 0.06); yl.setAttribute('y', -1.48);
		yl.setAttribute('fill', '#475569'); yl.setAttribute('font-size', '0.09');
		yl.setAttribute('font-family', 'Inter, sans-serif');
		yl.textContent = 'Dim 2';
		axesG.appendChild(yl);

		// Kill ALL click/drag/select side-effects on the SVG itself
		// (mousedown is what starts a browser drag — blocking click
		// alone is too late).
		const swallow = (e) => { e.preventDefault(); e.stopPropagation(); };
		svg.addEventListener('mousedown',   swallow, true);
		svg.addEventListener('dragstart',   swallow, true);
		svg.addEventListener('selectstart', swallow, true);
	},

	// Recolour the static background (grid, axes, labels) for the
	// current theme. Called from the theme-change listener because
	// _initSVG only runs once.
	_themeSVG: function() {
		const svg = document.getElementById('attn-anatomy-2d-svg');
		if (!svg) return;
		svg.querySelectorAll('.attn-grid line').forEach((l) => l.setAttribute('stroke', themeColor('#e2e8f0')));
		svg.querySelectorAll('.attn-axes line').forEach((l) => l.setAttribute('stroke', themeColor('#94a3b8')));
		svg.querySelectorAll('.attn-axes text').forEach((t) => t.setAttribute('fill', themeColor('#475569')));
	},

	// Render the sentence row above the 2D plot. Each token is a
	// hoverable span — hovering focuses the 2D plot on that token's
	// vectors and shows its full info in a popup.
	_renderSentence: function() {
		// Show the FULL sentence (context) with the focused tokens
		// highlighted as clickable spans. The rest of the sentence is
		// dimmed but visible — so a human reader can tell what the model
		// is attending TO.
		const el = document.getElementById('attn-sentence');
		if (!el) return;
		const set = ATTN_SETS[ATTN_2D.exampleIdx];
		if (!set || !set.full) {
			el.innerHTML = ATTN_TOKENS.map((tk, j) =>
				`<span class="attn-token ${j === 0 ? 'it' : 't' + j}" data-token="${j}">${tk.name}</span>`
			).join(' ');
			this._updateDebug();
			return;
		}
		// Escape any HTML in the full sentence, then highlight token
		// names. Use word boundaries so "cat" doesn't match inside
		// "scatter".
		const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		const names = ATTN_TOKENS.map((tk) => tk.name);
		this._assert(names.length === ATTN_TOKENS.length, 'names mismatch');
		this._assert(names[0] === 'it', 'first token must be it');
		const pattern = new RegExp('\\b(' + names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'g');
		const matched = [];
		const highlighted = esc(set.full).replace(pattern, (m) => {
			const idx = names.indexOf(m);
			this._assert(idx >= 0, `regex matched "${m}" but not found in names=[${names}]`);
			matched.push(`${m}→${idx}`);
			const cls = 'attn-token ' + (idx === 0 ? 'it' : 't' + idx);
			return `<span class="${cls}" data-token="${idx}">${m}</span>`;
		});
		el.innerHTML = highlighted;
		this._dbg('INFO', `renderSentence: matched=[${matched.join(', ')}]`);
		this._updateDebug();
	},

	// Attach hover handlers to the sentence tokens. Called ONCE from
	// init() — NOT from render() — so we don't re-bind every frame and
	// don't loop forever.
	// Lightweight hover update — only re-draws the 2D SVG (for token
	// dimming) without fading the equation/computation panels. This
	// prevents the screen from jumping when the user moves the mouse
	// over tokens.
	_renderHoverOnly: function() {
		const data = ATTN_STEPS[this.step];
		this._assert(data, `_renderHoverOnly: ATTN_STEPS[${this.step}] is undefined`);
		if (!data) return;
		this._dbg('INFO', `render2D(step=${this.step}, mode=${data.mode}, hovered=${ATTN_2D.hoveredToken})`);
		this.render2D(data);
	},

	_setupSentenceHover: function() {
		const el = document.getElementById('attn-sentence');
		if (!el) { this._dbg('ERROR', 'attn-sentence element not found'); return; }
		const self = this;
		// Use BOTH mouseover (event delegation) AND a direct listener on
		// every token span as a fallback — if mouseover doesn't fire
		// (e.g. due to some browser quirk or a bubbling issue), the
		// direct listener will catch it.
		const refresh = () => {
			self._showTokenInfo(ATTN_2D.hoveredToken);
			self._renderHoverOnly();
			self._updateDebug();
		};
		el.addEventListener('mouseover', function(e) {
			const span = e.target.closest('.attn-token');
			if (!span) return;
			const raw = span.dataset.token;
			const idx = parseInt(raw, 10);
			self._assert(!isNaN(idx), `mouseover: dataset.token="${raw}" is NaN, span="${span.textContent}", dataset=${JSON.stringify(span.dataset)}`);
			self._assert(idx >= 0 && idx < ATTN_TOKENS.length, `mouseover: idx=${idx} out of range (tokens=${ATTN_TOKENS.length})`);
			const prev = ATTN_2D.hoveredToken;
			// NO early-return: always re-render. The visual may be out of
			// sync with state (e.g. after a mouseout that didn't fire), and
			// re-rendering is cheap. This was the root cause of "step 4
			// mat — no change" when hovering the same token twice.
			ATTN_2D.hoveredToken = idx;
			if (prev === idx) {
				self._dbg('INFO', `mouseover: "${span.textContent}" (idx=${idx}) — same as before, forcing re-render`);
			} else {
				self._dbg('INFO', `mouseover: "${span.textContent}" idx ${prev}→${idx}`);
			}
			refresh();
		});
		el.addEventListener('mousemove', function(e) {
			// mousemove is a reliable backup — if mouseover didn't fire
			// (rare but observed), mousemove will pick it up.
			const span = e.target.closest('.attn-token');
			if (!span) return;
			const idx = parseInt(span.dataset.token, 10);
			if (isNaN(idx) || ATTN_2D.hoveredToken === idx) return;
			ATTN_2D.hoveredToken = idx;
			self._dbg('INFO', `mousemove(backup): idx→${idx} "${span.textContent}"`);
			refresh();
		});
		el.addEventListener('mouseout', function(e) {
			const span = e.target.closest('.attn-token');
			if (!span) return;
			const to = e.relatedTarget;
			if (to && span.contains(to)) return;
			// Only clear if leaving the whole sentence area
			if (to && el.contains(to)) return;
			if (ATTN_2D.hoveredToken === -1) return;
			self._dbg('INFO', `mouseout: clearing hoveredToken`);
			ATTN_2D.hoveredToken = -1;
			self._refreshPopup();
			self._renderHoverOnly();
			self._updateDebug();
		});
	},

	// Light-cone hover: when the mouse enters a formula in the
	// computation panel, show the derivation chain in the popup.
	// Delegation on the computation container — same pattern as
	// _setupSentenceHover() — so it survives formula re-renders.
	_setupFormulaHover: function() {
		const el = document.getElementById('attn-section-computation');
		if (!el) return;
		const self = this;
		// Formula nodes (dot/scaled/exps/weights/output)
		el.addEventListener('mouseover', function(e) {
			// 1) Formula light-cone
			const node = e.target.closest('[data-cone-step]');
			if (node) {
				const step = node.dataset.coneStep;
				const idx  = parseInt(node.dataset.coneIdx, 10);
				ATTN_2D.hoveredFormula = { step, idx };
				self._showFormulaCone(step, idx);
				return;
			}
			// 2) Matrix cell — show the exact α_{ij} computation
			const cell = e.target.closest('.attn-matrix-cell');
			if (cell) {
				const d = cell.dataset;
				self._showMatrixCellInfo(d);
				return;
			}
			// 3) Matrix row/col header — show what q_i or k_j is
			const rh = e.target.closest('.attn-matrix-rowhead');
			if (rh) {
				self._showMatrixRowInfo(parseInt(rh.dataset.tipRow, 10));
				return;
			}
			const ch = e.target.closest('.attn-matrix-colhead');
			if (ch) {
				self._showMatrixColInfo(parseInt(ch.dataset.tipKey, 10));
				return;
			}
		});
		el.addEventListener('mouseout', function(e) {
			const node = e.target.closest('[data-cone-step], .attn-matrix-cell, .attn-matrix-rowhead, .attn-matrix-colhead');
			if (!node) return;
			const to = e.relatedTarget;
			if (to && node.contains(to)) return;
			if (to && to.closest && to.closest('[data-cone-step], .attn-matrix-cell, .attn-matrix-rowhead, .attn-matrix-colhead')) return;
			ATTN_2D.hoveredFormula = null;
			self._refreshPopup();
		});
	},

	// Show the full computation for a single matrix cell α_{ij}.
	_showMatrixCellInfo: function(d) {
		const el = document.getElementById('attn-token-info');
		if (!el) return;
		const [qi, qj] = d.tipCell.split(',').map(Number);
		const [q0, q1] = d.cellQ.split(',').map(Number);
		const [k0, k1] = d.cellK.split(',').map(Number);
		const score   = d.cellScore;
		const scaled  = d.cellScaled;
		const expVal  = d.cellExp;
		const sumExp  = d.cellSum;
		const alpha   = d.cellAlpha;
		const qn = ATTN_TOKENS[qi]?.name || `q${qi+1}`;
		const kn = ATTN_TOKENS[qj+1]?.name || `k${qj+1}`;
		const pm = (a, b) => `\\begin{pmatrix} ${a} \\\\ ${b} \\end{pmatrix}`;
		const html = `<h4>α<sub>${qi+1},${qj+1}</sub> — how much <span style="color:${ATTN_TOKENS[qi]?.color || '#ef4444'}">${qn}</span> attends to <span style="color:${ATTN_TOKENS[qj+1]?.color || '#2563eb'}">${kn}</span></h4>` +
			`<div class="ti-row">$$\\mathbf{q}_{${qi+1}} = ${pm(q0, q1)}, \\quad \\mathbf{k}_{${qj+1}} = ${pm(k0, k1)}$$</div>` +
			`<div class="ti-row">$$\\mathbf{q}_{${qi+1}} \\cdot \\mathbf{k}_{${qj+1}} = (${q0})(${k0}) + (${q1})(${k1}) = ${score}$$</div>` +
			`<div class="ti-row">$$s_{${qj+1}} = \\frac{${score}}{\\sqrt{2}} = \\frac{${score}}{1.414} = ${scaled}$$</div>` +
			`<div class="ti-row">$$e^{s_{${qj+1}}} = e^{${scaled}} = ${expVal}$$</div>` +
			`<div class="ti-row">$$\\Sigma = \\sum_n e^{s_n} = ${sumExp}$$</div>` +
			`<div class="ti-row"><b>Result:</b> $$\\alpha_{${qi+1},${qj+1}} = \\frac{${expVal}}{${sumExp}} = ${alpha} = ${(alpha*100).toFixed(1)}\\%$$</div>`;
		el.innerHTML = html;
		el.classList.remove('is-empty');
		if (typeof render_temml === 'function') render_temml(el);
	},

	// Show what q_i is and where it comes from.
	_showMatrixRowInfo: function(i) {
		const el = document.getElementById('attn-token-info');
		if (!el) return;
		const q = ATTN_2D._allQueries[i];
		const name = ATTN_TOKENS[i].name;
		const role = (i === 0) ? 'the query token "it"' : `the ${i+1}${i===1?'st':i===2?'nd':'th'} token in the sentence`;
		const pm = (v) => `\\begin{pmatrix} ${v[0].toFixed(2)} \\\\ ${v[1].toFixed(2)} \\end{pmatrix}`;
		let html = `<h4>q<sub>${i+1}</sub> = <span style="color:${ATTN_TOKENS[i].color}">${name}</span></h4>`;
		html += `<div class="ti-row"><b>Role:</b> ${role}</div>`;
		html += `<div class="ti-row">$$\\mathbf{q}_{${i+1}} = ${pm(q)}$$</div>`;
		if (i === 0) {
			html += `<div class="ti-row">The query is <b>fixed</b> at $\\mathbf{q} = ${pm(q)}$ across all examples.</div>`;
		} else {
			html += `<div class="ti-row">For this token, $\\mathbf{q}$ is part of the token's learned embedding — it's the same as its $\\mathbf{k}$ vector in this demo (self-attention setup).</div>`;
			const k = ATTN_2D._allKeys[i-1];
			html += `<div class="ti-row">Compare: $\\mathbf{k}_{${i+1}} = ${pm(k)}$</div>`;
		}
		html += `<div class="ti-row">In a real Transformer, $\\mathbf{q}_i = \\mathbf{W}^Q \\mathbf{x}_i$ — a learned linear projection of the token embedding $\\mathbf{x}_i$.</div>`;
		el.innerHTML = html;
		el.classList.remove('is-empty');
		if (typeof render_temml === 'function') render_temml(el);
	},

	// Show what k_j is and where it comes from.
	_showMatrixColInfo: function(j) {
		const el = document.getElementById('attn-token-info');
		if (!el) return;
		const k = ATTN_2D._allKeys[j];
		const name = ATTN_TOKENS[j+1].name;
		const pm = (v) => `\\begin{pmatrix} ${v[0].toFixed(2)} \\\\ ${v[1].toFixed(2)} \\end{pmatrix}`;
		const html = `<h4>k<sub>${j+1}</sub> = <span style="color:${ATTN_TOKENS[j+1].color}">${name}</span></h4>` +
			`<div class="ti-row"><b>Role:</b> the key vector of "${name}" — what other queries attend <em>to</em></div>` +
			`<div class="ti-row">$$\\mathbf{k}_{${j+1}} = ${pm(k)}$$</div>` +
			`<div class="ti-row">$\\|\\mathbf{k}_{${j+1}}\\| = \\sqrt{(${k[0].toFixed(2)})^2 + (${k[1].toFixed(2)})^2} = ${Math.hypot(k[0],k[1]).toFixed(2)}$</div>` +
			`<div class="ti-row">The angle $\\theta$ between $\\mathbf{q}_i$ and $\\mathbf{k}_{${j+1}}$ determines the attention: $\\mathbf{q}_i \\cdot \\mathbf{k}_{${j+1}} = \\|\\mathbf{q}_i\\| \\cdot \\|\\mathbf{k}_{${j+1}}\\| \\cdot \\cos\\theta$.</div>` +
			`<div class="ti-row">In a real Transformer, $\\mathbf{k}_j = \\mathbf{W}^K \\mathbf{x}_j$ — a learned linear projection of token "${name}"'s embedding.</div>`;
		el.innerHTML = html;
		el.classList.remove('is-empty');
		if (typeof render_temml === 'function') render_temml(el);
	},

	// Decide what to show in the popup based on current hover state.
	// Priority: hoveredFormula > hoveredToken > hide.
	_refreshPopup: function() {
		if (ATTN_2D.hoveredFormula) {
			const { step, idx } = ATTN_2D.hoveredFormula;
			this._showFormulaCone(step, idx);
		} else if (ATTN_2D.hoveredToken >= 0) {
			this._showTokenInfo(ATTN_2D.hoveredToken);
		} else {
			this._hideTokenInfo();
		}
	},

	// Token info popup — inline below the sentence. Shows q, k, v, α for
	// the hovered token, all rendered with Temml using pmatrix notation.
	_showTokenInfo: function(idx) {
		const el = document.getElementById('attn-token-info');
		if (!el) return;
		if (idx < 0 || idx >= ATTN_TOKENS.length) { this._hideTokenInfo(); return; }
		const tk = ATTN_TOKENS[idx];
		const q = idx < ATTN_2D._allQueries.length ? ATTN_2D._allQueries[idx] : null;
		const pm = (v) => `\\begin{pmatrix} ${v[0].toFixed(2)} \\\\ ${v[1].toFixed(2)} \\end{pmatrix}`;
		let html = `<h4>Token: <span style="color:${tk.color}">${tk.name}</span></h4>`;
		if (q) {
			html += `<div class="ti-row">$$\\mathbf{q} = ${pm(q)}$$</div>`;
		}
		const j = idx - 1;
		const hasKV = j >= 0 && j < ATTN_2D.keys.length && j < ATTN_2D.vals.length;
		if (hasKV) {
			const k = ATTN_2D.keys[j], v = ATTN_2D.vals[j];
			const w = ATTN_2D.weights[j] || 0;
			html += `<div class="ti-row">$$\\mathbf{k} = ${pm(k)}$$</div>`;
			html += `<div class="ti-row">$$\\mathbf{v} = ${pm(v)}$$</div>`;
			html += `<div class="ti-row">$$\\alpha = ${(w*100).toFixed(1)}\\%$$</div>`;
			html += `<div class="ti-row">$$\\|\\mathbf{k}\\| = \\sqrt{(${k[0].toFixed(2)})^2 + (${k[1].toFixed(2)})^2} = ${Math.hypot(k[0],k[1]).toFixed(2)}$$</div>`;
			if (q) {
				const dot = q[0]*k[0]+q[1]*k[1];
				html += `<div class="ti-row">$$\\mathbf{q}\\cdot\\mathbf{k} = (${q[0].toFixed(2)})(${k[0].toFixed(2)}) + (${q[1].toFixed(2)})(${k[1].toFixed(2)}) = ${dot.toFixed(3)}$$</div>`;
			}
		} else {
			html += `<div class="ti-row"><b>Role:</b> query — the token we're attending <em>from</em>. Its q-vector is fixed: <span class="ti-form">$$\\mathbf{q} = ${pm(q)}$$</span></div>`;
		}
		el.innerHTML = html;
		el.classList.remove('is-empty');
		if (typeof render_temml === 'function') render_temml(el);
	},

	// Light cone — show the full derivation chain for a formula value.
	// Called when hovering over a formula in the computation panel.
	// stepName: 'dot' | 'scaled' | 'exps' | 'weights' | 'output'
	// tokenIdx: 0..n-1 (which token's value is being explained)
	_showFormulaCone: function(stepName, tokenIdx) {
		const el = document.getElementById('attn-token-info');
		if (!el) return;
		const q = ATTN_2D.q;
		const cone = [];
		cone.push(`<div class="ti-cone"><b>Light cone — how this value came to be:</b>`);
		if (stepName === 'dot') {
			const k = ATTN_2D.keys[tokenIdx];
			const score = (q[0]*k[0] + q[1]*k[1]).toFixed(3);
			cone.push(`<div class="ti-cone-line">$$\\mathbf{q}\\cdot\\mathbf{k}_{${tokenIdx+1}} = (${q[0].toFixed(2)})(${k[0].toFixed(2)}) + (${q[1].toFixed(2)})(${k[1].toFixed(2)}) = ${score}$$</div>`);
			cone.push(`<div class="ti-cone-line">← starts from $\\mathbf{q} = (${q[0].toFixed(2)},\\,${q[1].toFixed(2)})$ and $\\mathbf{k}_{${tokenIdx+1}} = (${k[0].toFixed(2)},\\,${k[1].toFixed(2)})$</div>`);
		} else if (stepName === 'scaled') {
			const k = ATTN_2D.keys[tokenIdx];
			const score = (q[0]*k[0] + q[1]*k[1]).toFixed(3);
			const scaled = ATTN_2D.scaled[tokenIdx].toFixed(3);
			cone.push(`<div class="ti-cone-line">$$s_{${tokenIdx+1}} = \\frac{${score}}{\\sqrt{2}} = \\frac{${score}}{1.414} = ${scaled}$$</div>`);
			cone.push(`<div class="ti-cone-line">← $s_{${tokenIdx+1}} = \\dfrac{q\\cdot k_{${tokenIdx+1}}}{\\sqrt{d_k}}$</div>`);
			cone.push(`<div class="ti-cone-line">← $q\\cdot k_{${tokenIdx+1}} = ${score}$ (dot product)</div>`);
		} else if (stepName === 'exps') {
			const sc = ATTN_2D.scaled[tokenIdx].toFixed(3);
			const e  = ATTN_2D.exps[tokenIdx].toFixed(3);
			cone.push(`<div class="ti-cone-line">$$e^{s_{${tokenIdx+1}}} = e^{${sc}} = ${e}$$</div>`);
			cone.push(`<div class="ti-cone-line">← $s_{${tokenIdx+1}} = ${sc}$ (scaled score)</div>`);
			cone.push(`<div class="ti-cone-line">← $q\\cdot k_{${tokenIdx+1}} = ${(q[0]*ATTN_2D.keys[tokenIdx][0] + q[1]*ATTN_2D.keys[tokenIdx][1]).toFixed(3)}$</div>`);
		} else if (stepName === 'weights') {
			const e   = ATTN_2D.exps[tokenIdx].toFixed(3);
			const sum = ATTN_2D.exps.reduce((a, b) => a + b, 0).toFixed(3);
			const w   = (ATTN_2D.weights[tokenIdx]*100).toFixed(1);
			cone.push(`<div class="ti-cone-line">$$\\alpha_{${tokenIdx+1}} = \\frac{e^{s_{${tokenIdx+1}}}}{\\Sigma} = \\frac{${e}}{${sum}} = ${w}\\%$$</div>`);
			cone.push(`<div class="ti-cone-line">← $e^{s_{${tokenIdx+1}}} = ${e}$</div>`);
			cone.push(`<div class="ti-cone-line">← $s_{${tokenIdx+1}} = ${ATTN_2D.scaled[tokenIdx].toFixed(3)}$</div>`);
			cone.push(`<div class="ti-cone-line">← $q\\cdot k_{${tokenIdx+1}} = ${(q[0]*ATTN_2D.keys[tokenIdx][0] + q[1]*ATTN_2D.keys[tokenIdx][1]).toFixed(3)}$</div>`);
		} else if (stepName === 'output') {
			const wv = ATTN_2D.weightedVals[tokenIdx];
			const w  = (ATTN_2D.weights[tokenIdx]*100).toFixed(1);
			const v  = ATTN_2D.vals[tokenIdx];
			cone.push(`<div class="ti-cone-line">$$\\alpha_{${tokenIdx+1}}\\mathbf{v}_{${tokenIdx+1}} = (${w}\\%)\\times(${v[0].toFixed(2)},\\,${v[1].toFixed(2)}) = (${wv[0].toFixed(3)},\\,${wv[1].toFixed(3)})$$</div>`);
			cone.push(`<div class="ti-cone-line">← $\\alpha_{${tokenIdx+1}} = ${w}\\%$ (softmax weight)</div>`);
			cone.push(`<div class="ti-cone-line">← $\\mathbf{v}_{${tokenIdx+1}} = (${v[0].toFixed(2)},\\,${v[1].toFixed(2)})$</div>`);
		}
		cone.push(`</div>`);
		el.innerHTML = cone.join('');
		el.classList.remove('is-empty');
		if (typeof render_temml === 'function') render_temml(el);
	},

	_hideTokenInfo: function() {
		const el = document.getElementById('attn-token-info');
		if (el) el.classList.add('is-empty');
	},

	// Render the bar plots BELOW the 2D scene in their own SVG.
	// This avoids any overlap with the vectors / angle arcs in the
	// main plot.
	_renderBarPlots: function(data) {
		const svg = document.getElementById('attn-bar-plots-svg');
		if (!svg) return;
		const constructionG = svg.querySelector('.attn-bar-construction');
		const labelsG = svg.querySelector('.attn-bar-labels');
		if (!constructionG || !labelsG) return;
		// Clear previous
		constructionG.innerHTML = '';
		labelsG.innerHTML = '';
		const comp = data.computation;
		const hasBars = (comp === 'dot' || comp === 'scaled' || comp === 'exps' || comp === 'weights');
		// Hide the SVG entirely when this step doesn't use bar plots,
		// so it doesn't reserve dead space.
		svg.style.display = hasBars ? 'block' : 'none';
		if (!hasBars) return;
		if (comp === 'dot') {
			this._drawScoreBlocks2D(constructionG, labelsG);
		} else if (comp === 'scaled') {
			this._drawScaledBars2D(constructionG, labelsG);
		} else if (comp === 'exps') {
			this._drawExpBars2D(constructionG, labelsG);
		} else if (comp === 'weights') {
			this._drawWeightBar2D(constructionG, labelsG);
		}
	},

	// Apply the per-token hover dimming to an opacity value. When a
	// specific token is hovered, only that token's visuals stay at
	// full opacity; everything else fades.
	// Returns true if THIS token is the currently hovered one — used by
	// every per-token draw call so the hovered arrow can be made
	// clearly visible (thicker stroke, glow, label stays bright).
	_tokenIsHovered: function(jPlus1) {
		const h = ATTN_2D.hoveredToken;
		if (h < 0) return false;
		return h === jPlus1;
	},

	// Apply hover dimming to an opacity value. When a token is hovered,
	// it stays at full opacity (1.0) so it stays bright; everything
	// else fades to 0.12 so the hovered one is clearly the focus.
	_tokenOpacity: function(jPlus1) {
		const h = ATTN_2D.hoveredToken;
		this._assert(typeof jPlus1 === 'number' && !isNaN(jPlus1), `_tokenOpacity: jPlus1=${jPlus1} not a number`);
		this._assert(typeof h === 'number' && !isNaN(h), `_tokenOpacity: hoveredToken=${h} not a number`);
		if (h < 0) return 1;
		if (h === jPlus1) return 1;
		return 0.12;
	},

	// Apply hover dimming to a color: non-hovered tokens go to a muted
	// light grey so the hovered one pops in its original colour.
	_tokenColor: function(color, jPlus1) {
		const h = ATTN_2D.hoveredToken;
		this._assert(typeof jPlus1 === 'number' && !isNaN(jPlus1), `_tokenColor: jPlus1=${jPlus1} not a number`);
		if (h < 0) return color;
		if (h === jPlus1) return color;
		return '#cbd5e1';
	},

	// ── DEBUG HELPERS ────────────────────────────────────────────────
	// All debug output goes to BOTH console AND the on-page debug
	// panel so it can be selected-all and pasted into a bug report.
	_dbgLastEvent: 'page loaded',
	_dbgLastError: '',
	_dbg: function(level, msg) {
		const line = `[${level}] ${msg}`;
		if (level === 'ERROR') {
			console.error('[attn]', msg);
			this._dbgLastError = msg;
		} else {
			console.log('[attn]', line);
		}
		this._dbgLastEvent = line;
		this._updateDebug();
	},
	_assert: function(cond, msg) {
		if (!cond) {
			this._dbg('ERROR', `ASSERTION FAILED: ${msg}`);
			console.trace();
		}
		return !!cond;
	},
	_updateDebug: function() {
		try {
			const el = document.getElementById('attn-debug');
			if (!el) return;
			const step = ATTN_STEPS[this.step];
			const tokens = ATTN_TOKENS.map((t, i) => `${i}=${t.name}`).join(' ');
			// Show BOTH _allKeys (full set) AND keys (what's actually drawn).
			const allKeys = (ATTN_2D._allKeys || []).map(k => `(${k[0].toFixed(2)},${k[1].toFixed(2)})`).join(' ');
			const drawnKeys = (ATTN_2D.keys || []).map(k => `(${k[0].toFixed(2)},${k[1].toFixed(2)})`).join(' ');
			const set = ATTN_SETS[ATTN_2D.exampleIdx];
			const hov  = ATTN_2D.hoveredToken;
			const hovName = hov >= 0 ? (ATTN_TOKENS[hov]?.name || '?') : 'none';
			const hovRole = hov >= 0 ? (hov === 0 ? 'query' : 'key') : '—';
			// Check whether the hovered token's arrow is actually drawn
			const drawnCount = ATTN_2D.keys ? ATTN_2D.keys.length : 0;
			const hovInDrawn = (hov >= 0 && hov > 0 && hov <= drawnCount);
			const hovWarn = (hov >= 0 && !hovInDrawn)
				? `\n<span class="dbg-err">⚠ hoveredToken=${hov} ("${hovName}") is OUTSIDE drawn keys (only ${drawnCount} drawn)! Arrow does not exist in DOM.</span>`
				: '';
			const err = this._dbgLastError ? `\n<span class="dbg-err">⚠ ${this._dbgLastError}</span>` : '';
			el.innerHTML =
				`<span class="dbg-label">step</span>  ${this.step + 1}/${ATTN_STEPS.length}  mode=${step?.mode ?? '?'}  comp=${step?.computation ?? '?'}\n` +
				`<span class="dbg-label">set </span>  ${ATTN_2D.exampleIdx} = "${set?.label ?? '?'}"\n` +
				`<span class="dbg-label">tok </span>  ${tokens}\n` +
				`<span class="dbg-label">allK</span>  ${allKeys}  (numTokens=${ATTN_2D.numTokens})\n` +
				`<span class="dbg-label">drwn</span>  ${drawnKeys}  ← what render2D actually draws\n` +
				`<span class="dbg-label">hov </span>  ${hov} (${hovName}, ${hovRole})  drawn=${hovInDrawn ? 'YES' : 'NO'}${hovWarn}\n` +
				`<span class="dbg-label">last</span>  ${this._dbgLastEvent}${err}`;
		} catch (e) {
			console.error('[attn] _updateDebug crashed:', e);
		}
	},


	// Draw a hoverable angle arc between the query direction and one
	// key direction (both drawn from the origin). A fat transparent
	// copy of the arc acts as the hit-area; hovering it shows the
	// intuitive meaning of that angle.
	_addAngleArc: function(parent, labelsParent, q, k, color, idx, dim) {
		const NS = this._SVG_NS;
		const r = 0.45;

		const aq = Math.atan2(q[1], q[0]);
		const ak = Math.atan2(k[1], k[0]);
		const d  = Math.atan2(Math.sin(ak - aq), Math.cos(ak - aq)); // short signed angle in (-π, π]

		const steps = 32;
		let dstr = `M ${(r * Math.cos(aq)).toFixed(4)} ${(-r * Math.sin(aq)).toFixed(4)}`;
		for (let i = 1; i <= steps; i++) {
			const a = aq + d * (i / steps);
			dstr += ` L ${(r * Math.cos(a)).toFixed(4)} ${(-r * Math.sin(a)).toFixed(4)}`;
		}

		// Fat invisible hit-area for forgiving hover
		const hit = document.createElementNS(NS, 'path');
		hit.setAttribute('d', dstr);
		hit.setAttribute('fill', 'none');
		hit.setAttribute('stroke', 'transparent');
		hit.setAttribute('stroke-width', '0.18');
		hit.setAttribute('stroke-linecap', 'round');
		parent.appendChild(hit);

		// Visible arc
		const arc = document.createElementNS(NS, 'path');
		arc.setAttribute('d', dstr);
		arc.setAttribute('fill', 'none');
		arc.setAttribute('stroke', color);
		arc.setAttribute('stroke-width', '0.018');
		arc.setAttribute('opacity', dim ? 0.35 : 0.9);
		arc.style.pointerEvents = 'none';
		parent.appendChild(arc);

		hit.addEventListener('mouseenter', (e) => this._showTooltip('angle', idx, e.clientX, e.clientY));
		hit.addEventListener('mousemove',  (e) => this._showTooltip('angle', idx, e.clientX, e.clientY));
		hit.addEventListener('mouseleave', () => this._hideTooltip());

		// When the angle is meaningful (this key is not dimmed) show its
		// degree value right on the arc. This is the whole story of WHY
		// attention works: k₁ sits ~5° from q → huge score; k₃ ~152° →
		// strongly negative. Small angle = same direction = attention.
		if (!dim) {
			const cosT = Math.max(-1, Math.min(1, (q[0]*k[0] + q[1]*k[1]) /
				(Math.hypot(q[0], q[1]) * Math.hypot(k[0], k[1]))));
			const deg = Math.round(Math.acos(cosT) * 180 / Math.PI);
			// When the wedge between q and k is very narrow the bisector
			// label straddles both shafts, so park it just OUTSIDE the
			// wedge on the q side. For wide angles the wedge interior is
			// spacious and the bisector reads better.
			const labelA = (Math.abs(d) < 0.21) ? aq - 0.19 : aq + d / 2;
			const rad = (Math.abs(d) < 0.21) ? r + 0.19 : r + 0.17;
			const lx = rad * Math.cos(labelA);
			const ly = -rad * Math.sin(labelA);
			const mkLabel = (halo) => {
				const t = document.createElementNS(NS, 'text');
				t.setAttribute('x', lx); t.setAttribute('y', ly);
				t.setAttribute('text-anchor', 'middle');
				t.setAttribute('dominant-baseline', 'middle');
				if (halo) {
					t.setAttribute('fill', '#fff');
					t.setAttribute('stroke', '#fff');
					t.setAttribute('stroke-width', '0.005');
					t.setAttribute('paint-order', 'stroke');
				} else {
					t.setAttribute('fill', color);
				}
				t.setAttribute('font-size', '0.072');
				t.setAttribute('font-family', 'Inter, sans-serif');
				t.textContent = `θ≈${deg}°`;
				t.style.pointerEvents = 'none';
				labelsParent.appendChild(t);
			};
			mkLabel(true);
			mkLabel(false);
		}
	},

	// Draw an arrow from `start` to `end` in the 2D plot. Adds the
	// hit-area, shaft, arrowhead, and (optional) label to the SVG.
	// Mouse events fire directly on the hit-area — no Plotly needed.
	// `lpos` optionally overrides the label offset ([dx, dy]) so labels
	// that would otherwise stack (e.g. z + its weighted values) can be
	// fanned out.
	_addSVGArrow: function(parent, labelsParent, start, end, color, label, formula, idx, dashed, dim, lpos, lanchor, opacity) {
		const NS = this._SVG_NS;
		const finalOpacity = (opacity !== undefined) ? opacity : (dim ? 0.35 : 1.0);

		// HOVER HIGHLIGHT: when a token is hovered AND this arrow is at
		// full opacity (i.e. it belongs to the hovered token), make it
		// IMPOSSIBLE to miss — bright magenta, 3× thicker, big arrowhead,
		// pulsing glow halo, AND a CSS scale animation on the shaft.
		// Previous attempts used indigo / thicker-only which was too subtle
		// when the arrow was already naturally prominent (cat/mat case).
		const isHovered = (ATTN_2D.hoveredToken >= 0 && finalOpacity >= 0.99 && opacity !== undefined);
		// Assertion: every drawn arrow that THINKS it's hovered must
		// match the hoveredToken exactly. If not, that's a bug we want
		// to surface in the debug panel.
		if (isHovered && label) {
			this._dbg('INFO', `draw ARROW "${label}" idx=${idx} AS HOVERED (magenta, thick)`);
		}
		const sw  = isHovered ? 0.080 : 0.028;            // ~185% thicker when hovered
		const fs  = isHovered ? 0.17  : 0.10;             // much bigger label when hovered
		const swH = isHovered ? 0.24  : 0.11;              // much bigger arrowhead when hovered
		// Bright magenta — maximally distinct from every other arrow colour
		// (red q, blue k, green v, amber z, grey dimmed).
		const finalColor = isHovered ? '#d946ef' : color;

		// Flip y for SVG (SVG y goes down, our data y goes up)
		const sx = start[0], sy = -start[1];
		const ex = end[0],   ey = -end[1];
		const anchor = lanchor || 'start';

		// Tag every animatable arrow so we can find it later if needed.
		const arrowCls = 'attn-arrow-' + (idx !== undefined ? idx : 'misc');

		// Invisible fat hit-area for forgiving hover
		const hit = document.createElementNS(NS, 'line');
		hit.setAttribute('x1', sx); hit.setAttribute('y1', sy);
		hit.setAttribute('x2', ex); hit.setAttribute('y2', ey);
		hit.setAttribute('stroke', 'transparent');
		hit.setAttribute('stroke-width', '0.18');
		hit.classList.add('attn-arrow-hit');
		hit.classList.add(arrowCls);
		parent.appendChild(hit);

		// Glow halo: drawn UNDER the shaft only when hovered. Static
		// (no CSS animation — those caused ugly pulsing per the user).
		if (isHovered) {
			const glow = document.createElementNS(NS, 'line');
			glow.setAttribute('x1', sx); glow.setAttribute('y1', sy);
			glow.setAttribute('x2', ex); glow.setAttribute('y2', ey);
			glow.setAttribute('stroke', finalColor);
			glow.setAttribute('stroke-width', '0.22');
			glow.setAttribute('stroke-opacity', '0.35');
			glow.setAttribute('stroke-linecap', 'round');
			glow.style.pointerEvents = 'none';
			parent.appendChild(glow);
		}

		// Visible shaft
		const line = document.createElementNS(NS, 'line');
		line.setAttribute('x1', sx); line.setAttribute('y1', sy);
		line.setAttribute('x2', ex); line.setAttribute('y2', ey);
		line.setAttribute('stroke', finalColor);
		line.setAttribute('stroke-width', sw);
		line.setAttribute("opacity", finalOpacity);
		line.style.pointerEvents = 'none';
		if (dashed) line.setAttribute('stroke-dasharray', '0.06 0.05');
		line.classList.add(arrowCls);
		parent.appendChild(line);

		// Arrowhead (triangle pointing along the vector)
		const dx = ex - sx, dy = ey - sy;
		const len = Math.sqrt(dx * dx + dy * dy);
		let head = null;
		if (len > 0.01) {
			const ux = dx / len, uy = dy / len;
			const s = swH;                       // arrowhead size in data units
			const c = Math.cos(Math.PI / 6), si = Math.sin(Math.PI / 6);
			// Rotate (ux,uy) by ±30°
			const ax1 = ex - s * (ux * c - uy * si);
			const ay1 = ey - s * (ux * si + uy * c);
			const ax2 = ex - s * (ux * c + uy * si);
			const ay2 = ey - s * (-ux * si + uy * c);
			head = document.createElementNS(NS, 'polygon');
			head.setAttribute('points', `${ex},${ey} ${ex-s*(ux*c-uy*si)},${ey-s*(ux*si+uy*c)} ${ex-s*(ux*c+uy*si)},${ey-s*(-ux*si+uy*c)}`);
			head.setAttribute('fill', finalColor);
			head.setAttribute("opacity", finalOpacity);
			head.style.pointerEvents = 'none';
			head.classList.add(arrowCls);
			parent.appendChild(head);
		}

		// Label (with a THIN white halo for readability over the grid —
		// a wide stroke around every glyph looks like a messy outline)
		let labelHalo = null, labelTxt = null;
		if (label) {
			const lx = ex + (lpos ? lpos[0] : 0.14);
			const ly = ey + (lpos ? lpos[1] : -0.04);
			labelHalo = document.createElementNS(NS, 'text');
			labelHalo.setAttribute('x', lx); labelHalo.setAttribute('y', ly);
			labelHalo.setAttribute('text-anchor', anchor);
			labelHalo.setAttribute('dominant-baseline', 'middle');
			labelHalo.setAttribute('fill', '#fff'); labelHalo.setAttribute('stroke', '#fff');
			labelHalo.setAttribute('stroke-width', '0.005'); labelHalo.setAttribute('paint-order', 'stroke');
			labelHalo.setAttribute('font-size', fs);
			labelHalo.setAttribute('font-family', 'Inter, sans-serif');
			labelHalo.textContent = label;
			labelHalo.style.pointerEvents = 'none';
			labelHalo.classList.add(arrowCls);
			labelsParent.appendChild(labelHalo);
			labelTxt = document.createElementNS(NS, 'text');
			labelTxt.setAttribute('x', lx); labelTxt.setAttribute('y', ly);
			labelTxt.setAttribute('text-anchor', anchor);
			labelTxt.setAttribute('dominant-baseline', 'middle');
			labelTxt.setAttribute('fill', finalColor);
			labelTxt.setAttribute('font-size', fs);
			labelTxt.setAttribute("opacity", finalOpacity);
			labelTxt.setAttribute('font-family', 'Inter, sans-serif');
			labelTxt.setAttribute('font-weight', isHovered ? '700' : '600');
			labelTxt.textContent = label;
			labelTxt.style.pointerEvents = 'none';
			labelTxt.classList.add(arrowCls);
			labelsParent.appendChild(labelTxt);
		}

		// Mouse events fire DIRECTLY on this element. No Plotly, no
		// overlay, no event-delegation hacks — just plain DOM events.
		// Every arrow with a `formula` argument gets its own tooltip.
		if (formula) {
			hit.addEventListener('mouseenter', (e) => this._showTooltip(formula, idx, e.clientX, e.clientY));
			hit.addEventListener('mousemove',  (e) => this._showTooltip(formula, idx, e.clientX, e.clientY));
			hit.addEventListener('mouseleave', () => this._hideTooltip());
		}

		// Return the elements so callers can animate them if needed.
		return { hit, line, head, labelHalo, labelTxt, lpos, anchor, start, end };
	},

	// Standalone tooltip show/hide. Called from SVG mouse events.
	_showTooltip: function(key, idx, clientX, clientY) {
		const tip = document.getElementById('attn-vector-tooltip');
		if (!tip) return;
		const info = this._buildArrowInfo(key, idx);
		if (!info) return;

		// mousemove fires constantly while the cursor sits on an arrow —
		// only rebuild + re-render when the arrow actually changes.
		const contentKey = key + '|' + idx;
		if (this._tipContentKey !== contentKey) {
			this._tipContentKey = contentKey;

			const formulaHtml = TEMML_RENDERED[key] || `$$ ${info.formulaLatex} $$`;

			tip.innerHTML =
				'<div class="tt-name"></div>' +
				'<div class="tt-intuition"></div>' +
				`<div class="tt-concrete">$$ ${info.concreteLatex} $$</div>` +
				`<div class="tt-formula">${formulaHtml}</div>` +
				'<div class="tt-desc"></div>';

			tip.querySelector('.tt-name').textContent    = info.name;
			tip.querySelector('.tt-intuition').innerHTML = info.intuition || '';
			tip.querySelector('.tt-desc').innerHTML      = info.desc;

			// Show BEFORE rendering so MathML gets real layout dimensions
			// (a display:none element would still render, but measuring
			// is only reliable once visible).
			tip.classList.add('active');

			// Render concrete equation + description math via Temml.
			// Scoped to the tooltip — the general formula is already
			// pre-rendered.
			this._renderTooltipMath(tip);

			// If the general formula still failed to render, fall back
			// to readable Unicode math so the user always sees
			// *something*.
			const formulaEl = tip.querySelector('.tt-formula');
			if (formulaEl.innerHTML.indexOf('$$') !== -1) {
				formulaEl.innerHTML = `<code style="font-family:'SF Mono','Menlo','Consolas',monospace;font-size:13px;padding:2px 4px">${info.unicode}</code>`;
			}
		} else {
			tip.classList.add('active');
		}

		// Position near cursor with edge-flipping, then clamp to the
		// viewport so a wide formula (now sized to its natural width)
		// never spills off either edge.
		const pad = 16;
		const vw = window.innerWidth, vh = window.innerHeight;
		let x = clientX + pad, y = clientY + pad;
		const r = tip.getBoundingClientRect();
		if (x + r.width  > vw) x = clientX - r.width  - pad;
		if (y + r.height > vh) y = clientY - r.height - pad;
		// If still wider than viewport, center it horizontally.
		if (r.width > vw - 2 * pad) x = Math.max(pad, (vw - r.width) / 2);
		// Hard clamp so neither edge can go negative.
		if (x < pad) x = pad;
		if (x + r.width  > vw - pad) x = Math.max(pad, vw - pad - r.width);
		if (y < pad) y = pad;
		if (y + r.height > vh - pad) y = Math.max(pad, vh - pad - r.height);
		tip.style.left = x + 'px';
		tip.style.top  = y + 'px';
	},

	// Render every remaining $...$ / $$...$$ block inside `root` with
	// Temml. Retries briefly in case Temml loads asynchronously, then
	// gives up so the caller can apply its own fallback.
	_renderTooltipMath: function(root) {
		if (typeof render_temml !== 'function') return;
		const sleep = (ms) => { const s = Date.now(); while (Date.now() - s < ms) {} };
		for (let i = 0; i < 10; i++) {
			try { render_temml(root); } catch (e) { /* swallow */ }
			if (root.innerHTML.indexOf('$') === -1) break;
			sleep(20);
		}
	},

	_hideTooltip: function() {
		const tip = document.getElementById('attn-vector-tooltip');
		if (tip) tip.classList.remove('active');
	},

	// ─── Per-step geometric overlays ───────────────────────────────
	// These draw the actual "working" on top of the plain arrows so each
	// step visibly takes the vectors and transforms them, instead of
	// only the left panels changing. Everything renders into the
	// construction/labels layers, which render2D clears on every step.

	// Darken a hex color by a factor (0..1). Used to distinguish the two
	// per-dimension product blocks that build up each score bar.
	_shade: function(hex, f) {
		const n = parseInt(hex.slice(1), 16);
		const r = Math.round(((n >> 16) & 255) * f);
		const g = Math.round(((n >> 8) & 255) * f);
		const b = Math.round((n & 255) * f);
		return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
	},

	// Muted sub-labels showing the LENGTH of the query and each key —
	// the two ingredients of cos θ = q·k/(‖q‖‖k‖). Reads as a pair with
	// the arrow labels ("k₁" + "‖k₁‖=1.01") so the geometry behind the
	// attention score is visible without hovering.
	_addMagnitudeLabels2D: function(labelsG, data) {
		const NS = this._SVG_NS;
		const norm = (v) => Math.hypot(v[0], v[1]);
		const mk = (x, y, str, anchor) => {
			const a = anchor || 'start';
			const halo = document.createElementNS(NS, 'text');
			halo.setAttribute('x', x); halo.setAttribute('y', y);
			halo.setAttribute('text-anchor', a);
			halo.setAttribute('dominant-baseline', 'middle');
			halo.setAttribute('fill', '#fff'); halo.setAttribute('stroke', '#fff');
			halo.setAttribute('stroke-width', '0.005'); halo.setAttribute('paint-order', 'stroke');
			halo.setAttribute('font-size', '0.065');
			halo.setAttribute('font-family', 'Inter, sans-serif');
			halo.textContent = str;
			halo.style.pointerEvents = 'none';
			labelsG.appendChild(halo);
			const txt = document.createElementNS(NS, 'text');
			txt.setAttribute('x', x); txt.setAttribute('y', y);
			txt.setAttribute('text-anchor', a);
			txt.setAttribute('dominant-baseline', 'middle');
			txt.setAttribute('fill', themeColor('#64748b'));
			txt.setAttribute('font-size', '0.065');
			txt.setAttribute('font-family', 'Inter, sans-serif');
			txt.textContent = str;
			txt.style.pointerEvents = 'none';
			labelsG.appendChild(txt);
		};

		const q = ATTN_2D.q;

		// Query magnitude: tucked just below q's tip label (which sits
		// above the tip at (q + 0.14, -q - 0.04)), so the two never touch.
		mk(q[0] + 0.10, -q[1] + 0.12, `‖q‖=${norm(q).toFixed(2)}`);

		ATTN_2D.keys.forEach((k, j) => {
			if (data.highlightKey !== undefined && data.highlightKey !== j) return;
			// Ride the shaft itself: anchored mid-vector and offset
			// perpendicular to the direction. This clears the tip label,
			// the arrowhead (which opens backward toward the origin), and
			// — for keys nearly collinear with q — q's own labels too.
			const n = norm(k);
			const u = [k[0] / n, k[1] / n];
			// k1's shaft is nearly horizontal, so a small offset clears it;
			// the steeper k2/k3 shafts reach toward a label corner, so they
			// need a larger perpendicular offset to keep their glyphs clear.
			const off = (j === 0) ? 0.14 : 0.22;
			const sx = 0.5 * k[0] - u[1] * off;
			const sy = 0.5 * k[1] + u[0] * off;
			mk(sx, -sy, `‖k${j+1}‖=${n.toFixed(2)}`, 'middle');
		});
	},

	// Numerical value labels next to each key, so the score / scaled /
	// exp / weight is readable at a glance. Positioned just inside the
	// arrowhead so they don't collide with the tip label.
	_addValueLabels2D: function(labelsG, comp) {
		const NS = this._SVG_NS;
		let label = null;
		if (comp === 'dot' || comp === 'components') {
			label = (j) => `s = ${ATTN_2D.scores[j].toFixed(3)}`;
		} else if (comp === 'scaled') {
			label = (j) => `s/√d = ${ATTN_2D.scaled[j].toFixed(3)}`;
		} else if (comp === 'exps') {
			label = (j) => `eˢ = ${ATTN_2D.exps[j].toFixed(3)}`;
		} else if (comp === 'weights') {
			label = (j) => `α = ${(ATTN_2D.weights[j]*100).toFixed(1)}%`;
		}
		if (!label) return;

		ATTN_2D.keys.forEach((k, j) => {
			const color = ATTN_TOKENS[j + 1].color;
			// Position at the shaft midpoint, offset toward the tip
			// so it sits between the origin and the tip label.
			const mx = 0.62 * k[0], my = 0.62 * k[1];
			const t = document.createElementNS(NS, 'text');
			t.setAttribute('x', mx);
			t.setAttribute('y', -my + 0.10);
			t.setAttribute('text-anchor', 'middle');
			t.setAttribute('dominant-baseline', 'middle');
			t.setAttribute('fill', '#fff');
			t.setAttribute('stroke', '#fff');
			t.setAttribute('stroke-width', '0.005');
			t.setAttribute('paint-order', 'stroke');
			t.setAttribute('font-size', '0.07');
			t.setAttribute('font-weight', 'bold');
			t.setAttribute('font-family', 'Inter, sans-serif');
			t.textContent = label(j);
			t.style.pointerEvents = 'none';
			labelsG.appendChild(t);

			const txt = document.createElementNS(NS, 'text');
			txt.setAttribute('x', mx);
			txt.setAttribute('y', -my + 0.10);
			txt.setAttribute('text-anchor', 'middle');
			txt.setAttribute('dominant-baseline', 'middle');
			txt.setAttribute('fill', color);
			txt.setAttribute('font-size', '0.07');
			txt.setAttribute('font-weight', 'bold');
			txt.setAttribute('font-family', 'Inter, sans-serif');
			txt.textContent = label(j);
			txt.style.pointerEvents = 'none';
			labelsG.appendChild(txt);
		});
	},

	// Step "components": q[d]·k[d] as rectangle AREAS — one rectangle
	// per dimension (area = product), plus dashed drop-lines from the
	// highlighted key tip and the query tip down to each axis.
	_drawComponents2D: function(constructionG, labelsG, hi) {
		const NS = this._SVG_NS;
		const q = ATTN_2D.q;
		const keys = ATTN_2D.keys;

		const addRect = (x0, y0, x1, y1, color, label, idx, dim) => {
			const rect = document.createElementNS(NS, 'rect');
			const rx = Math.min(x0, x1), ry = Math.min(y0, y1);
			rect.setAttribute('x',  rx);
			rect.setAttribute('y',  -Math.max(y0, y1));
			rect.setAttribute('width',  Math.abs(x1 - x0));
			rect.setAttribute('height', Math.abs(y1 - y0));
			rect.setAttribute('fill', color);
			rect.setAttribute('fill-opacity', '0.12');
			rect.setAttribute('stroke', color);
			rect.setAttribute('stroke-opacity', '0.55');
			rect.setAttribute('stroke-width', '0.008');
			rect.setAttribute('stroke-dasharray', '0.03 0.03');
			rect.style.pointerEvents = 'all';
			rect.style.cursor = 'help';
			constructionG.appendChild(rect);
			rect.addEventListener('mouseenter', (e) => this._showTooltip('comprect', idx * 2 + dim, e.clientX, e.clientY));
			rect.addEventListener('mousemove',  (e) => this._showTooltip('comprect', idx * 2 + dim, e.clientX, e.clientY));
			rect.addEventListener('mouseleave', () => this._hideTooltip());
			if (label) {
				const t = document.createElementNS(NS, 'text');
				t.setAttribute('x', rx + 0.03);
				t.setAttribute('y', -Math.max(y0, y1) - 0.04);
				t.setAttribute('fill', color);
				t.setAttribute('font-size', '0.075');
				t.setAttribute('font-family', 'Inter, sans-serif');
				t.textContent = label;
				t.style.pointerEvents = 'none';
				labelsG.appendChild(t);
			}
		};

		// All keys: 2 rectangles each (one per dimension). The product
		// of width × height is q[d] · k_j[d]. The sum across d=1,2 gives
		// the dot product for key j.
		keys.forEach((k, j) => {
			const color = ATTN_TOKENS[j + 1].color;
			const isHi = (j === hi);
			const op = isHi ? '0.18' : '0.08';
			const px = (q[0] * k[0]).toFixed(3);
			const py = (q[1] * k[1]).toFixed(3);
			const dim1 = document.createElementNS(NS, 'rect');
			dim1.setAttribute('x',  Math.min(0, q[0]));
			dim1.setAttribute('y',  -Math.max(0, k[0]));
			dim1.setAttribute('width',  Math.abs(q[0]));
			dim1.setAttribute('height', Math.abs(k[0]));
			dim1.setAttribute('fill', color);
			dim1.setAttribute('fill-opacity', op);
			dim1.setAttribute('stroke', color);
			dim1.setAttribute('stroke-opacity', isHi ? '0.6' : '0.35');
			dim1.setAttribute('stroke-width', '0.008');
			dim1.setAttribute('stroke-dasharray', '0.03 0.03');
			dim1.style.pointerEvents = 'all'; dim1.style.cursor = 'help';
			constructionG.appendChild(dim1);
			dim1.addEventListener('mouseenter', (e) => this._showTooltip('comprect', j * 2 + 0, e.clientX, e.clientY));
			dim1.addEventListener('mousemove',  (e) => this._showTooltip('comprect', j * 2 + 0, e.clientX, e.clientY));
			dim1.addEventListener('mouseleave', () => this._hideTooltip());

			const dim2 = document.createElementNS(NS, 'rect');
			dim2.setAttribute('x',  Math.min(0, q[1]));
			dim2.setAttribute('y',  -Math.max(0, k[1]));
			dim2.setAttribute('width',  Math.abs(q[1]));
			dim2.setAttribute('height', Math.abs(k[1]));
			dim2.setAttribute('fill', color);
			dim2.setAttribute('fill-opacity', op);
			dim2.setAttribute('stroke', color);
			dim2.setAttribute('stroke-opacity', isHi ? '0.6' : '0.35');
			dim2.setAttribute('stroke-width', '0.008');
			dim2.setAttribute('stroke-dasharray', '0.03 0.03');
			dim2.style.pointerEvents = 'all'; dim2.style.cursor = 'help';
			constructionG.appendChild(dim2);
			dim2.addEventListener('mouseenter', (e) => this._showTooltip('comprect', j * 2 + 1, e.clientX, e.clientY));
			dim2.addEventListener('mousemove',  (e) => this._showTooltip('comprect', j * 2 + 1, e.clientX, e.clientY));
			dim2.addEventListener('mouseleave', () => this._hideTooltip());

			// Label above the dim-1 rect (positioned at its top-right).
			// Bold + larger font + dark color so it's actually readable.
			const lbl = document.createElementNS(NS, 'text');
			lbl.setAttribute('x', Math.min(0, q[0]) + 0.04);
			lbl.setAttribute('y', -Math.max(0, k[0]) - 0.04);
			lbl.setAttribute('fill', '#1e293b');
			lbl.setAttribute('font-size', '0.085');
			lbl.setAttribute('font-weight', '700');
			lbl.setAttribute('font-family', 'Inter, sans-serif');
			lbl.textContent = `k${j+1}: ${px} + ${py}`;
			lbl.style.pointerEvents = 'none';
			labelsG.appendChild(lbl);
		});
	},

	// Step "The learnable projections": one input embedding x, projected
	// by three DIFFERENT learned matrices W^Q, W^K, W^V into three
	// different vectors q, k, v. The visual story: same input, three
	// different outputs — because the W's are different.
	_drawLearnableProjections2D: function(constructionG, labelsG, arrowsG) {
		const NS = this._SVG_NS;
		const d = ATTN_2D.demo;

		// The four arrows from the origin: x (gray, the input) and its
		// three projections. Each one carries a tip label and a small
		// "W^X" badge near the tip so the matrix is visible in the scene.
		const arrows = [
			{ v: d.x, color: '#64748b', label: 'x',  tip: 'proj-input', badge: 'input',          dashed: false },
			{ v: d.q, color: '#ef4444', label: 'q',  tip: 'proj-q',     badge: 'W^Q · x',        dashed: false },
			{ v: d.k, color: '#2563eb', label: 'k',  tip: 'proj-k',     badge: 'W^K · x',        dashed: false },
			{ v: d.v, color: '#16a34a', label: 'v',  tip: 'proj-v',     badge: 'W^V · x',        dashed: false }
		];

		arrows.forEach((a, i) => {
			// Offset each arrow slightly along its perpendicular so they
			// don't all sit on top of each other at the origin (they
			// share a common tail at (0,0)).
			const n = Math.hypot(a.v[0], a.v[1]) || 1;
			const ux = a.v[0] / n, uy = a.v[1] / n;
			// Perpendicular unit vector (rotate 90° CCW in data space)
			const px = -uy, py = ux;
			// Fan out: x at 0, q/k/v at small offsets along their own
			// perpendicular so the badge labels never overlap.
			const off = [0, 0.00, 0.00, 0.00][i];
			const sx = off * px, sy = off * py;

			// Hover feedback for step 1: when a token is hovered, the
			// input "x" arrow dims slightly (it's the embedding of the
			// token being attended FROM) while q/k/v stay bright.
			const anyHovered = (ATTN_2D.hoveredToken >= 0);
			const baseOp = i === 0 ? 0.55 : 1;
			const shaftOp = (anyHovered && i === 0) ? 0.30 : baseOp;

			// Shaft (with a fat transparent hit-area for the tooltip)
			const hit = document.createElementNS(NS, 'line');
			hit.setAttribute('x1', sx); hit.setAttribute('y1', -sy);
			hit.setAttribute('x2', a.v[0] + sx); hit.setAttribute('y2', -(a.v[1] + sy));
			hit.setAttribute('stroke', 'transparent');
			hit.setAttribute('stroke-width', '0.12');
			hit.style.cursor = 'help';
			arrowsG.appendChild(hit);
			hit.addEventListener('mouseenter', (e) => this._showTooltip(a.tip, 0, e.clientX, e.clientY));
			hit.addEventListener('mousemove',  (e) => this._showTooltip(a.tip, 0, e.clientX, e.clientY));
			hit.addEventListener('mouseleave', () => this._hideTooltip());

			const shaft = document.createElementNS(NS, 'line');
			shaft.setAttribute('x1', sx); shaft.setAttribute('y1', -sy);
			shaft.setAttribute('x2', a.v[0] + sx); shaft.setAttribute('y2', -(a.v[1] + sy));
			shaft.setAttribute('stroke', a.color);
			shaft.setAttribute('stroke-width', i === 0 ? '0.022' : '0.028');
			shaft.setAttribute('opacity', shaftOp);
			shaft.setAttribute('stroke-linecap', 'round');
			if (a.dashed) shaft.setAttribute('stroke-dasharray', '0.03 0.03');
			shaft.style.pointerEvents = 'none';
			arrowsG.appendChild(shaft);

			// Arrowhead
			if (i > 0) {
				const headLen = 0.10;
				const headAng = Math.PI / 6;
				const ang = Math.atan2(a.v[1], a.v[0]);
				const tipX = a.v[0] + sx, tipY = -(a.v[1] + sy);
				const p1x = tipX - headLen * Math.cos(ang - headAng);
				const p1y = tipY - headLen * Math.sin(ang - headAng);
				const p2x = tipX - headLen * Math.cos(ang + headAng);
				const p2y = tipY - headLen * Math.sin(ang + headAng);
				const head = document.createElementNS(NS, 'polygon');
				head.setAttribute('points', `${tipX},${tipY} ${p1x},${p1y} ${p2x},${p2y}`);
				head.setAttribute('fill', a.color);
				head.style.pointerEvents = 'none';
				arrowsG.appendChild(head);
			}

			// Tip label (q / k / v / x)
			const tipLabel = document.createElementNS(NS, 'text');
			const lx = a.v[0] + sx + 0.08;
			const ly = -(a.v[1] + sy) - 0.02;
			tipLabel.setAttribute('x', lx);
			tipLabel.setAttribute('y', ly);
			tipLabel.setAttribute('text-anchor', 'start');
			tipLabel.setAttribute('dominant-baseline', 'middle');
			tipLabel.setAttribute('fill', '#fff');
			tipLabel.setAttribute('stroke', '#fff');
			tipLabel.setAttribute('stroke-width', '0.012');
			tipLabel.setAttribute('paint-order', 'stroke');
			tipLabel.setAttribute('font-size', '0.1');
			tipLabel.setAttribute('font-family', 'Inter, sans-serif');
			tipLabel.textContent = a.label;
			tipLabel.style.pointerEvents = 'none';
			labelsG.appendChild(tipLabel);

			// Coloured fill on top of the halo
			const tipLabelFill = document.createElementNS(NS, 'text');
			tipLabelFill.setAttribute('x', lx);
			tipLabelFill.setAttribute('y', ly);
			tipLabelFill.setAttribute('text-anchor', 'start');
			tipLabelFill.setAttribute('dominant-baseline', 'middle');
			tipLabelFill.setAttribute('fill', a.color);
			tipLabelFill.setAttribute('font-size', '0.1');
			tipLabelFill.setAttribute('font-family', 'Inter, sans-serif');
			tipLabelFill.textContent = a.label;
			tipLabelFill.style.pointerEvents = 'none';
			labelsG.appendChild(tipLabelFill);

			// Badge: the W matrix that produced this vector. Below the
			// tip label so the visual reads "arrow → tip label → matrix".
			const badge = document.createElementNS(NS, 'text');
			badge.setAttribute('x', lx);
			badge.setAttribute('y', ly - 0.11);
			badge.setAttribute('text-anchor', 'start');
			badge.setAttribute('dominant-baseline', 'middle');
			badge.setAttribute('fill', themeColor('#475569'));
			badge.setAttribute('font-size', '0.07');
			badge.setAttribute('font-family', 'Inter, sans-serif');
			badge.textContent = a.badge;
			badge.style.pointerEvents = 'none';
			labelsG.appendChild(badge);
		});
	},

	// Step "The full attention matrix": render α[i][j] as an n×n heatmap.
	// Rows = queries, columns = keys. Each cell's blue intensity is the
	// weight; the value is written in the centre. Hovering a cell shows
	// the exact score and weight in the tooltip.
	// Step 10 (matrix): the actual matrix is now an HTML table in the
	// computation panel. Here in the 2D SVG we just show a pointer so the
	// area isn't empty. No dim1/dim2 background (grid/axes are hidden
	// in render2D for this mode).
	_drawMatrixRedirect2D: function(constructionG, labelsG) {
		const NS = this._SVG_NS;
		const n = ATTN_2D.numTokens;
		const titles = [
			'↑ The full attention matrix lives in the computation panel ↑',
			'Each row = one query\'s softmax over all keys.',
			'Hover any cell to see the exact computation.'
		];
		// Center the message vertically in the [-1.4, 1.4] viewBox.
		titles.forEach((line, i) => {
			const t = document.createElementNS(NS, 'text');
			t.setAttribute('x', 0);
			t.setAttribute('y', 0.4 - i * 0.22);
			t.setAttribute('text-anchor', 'middle');
			t.setAttribute('fill', themeColor(i === 0 ? '#1e3a8a' : '#475569'));
			t.setAttribute('font-size', i === 0 ? '0.12' : '0.08');
			t.setAttribute('font-weight', i === 0 ? '700' : '400');
			t.setAttribute('font-family', 'Inter, sans-serif');
			t.textContent = line;
			t.style.pointerEvents = 'none';
			labelsG.appendChild(t);
		});
		// A small downward arrow
		const arrow = document.createElementNS(NS, 'path');
		arrow.setAttribute('d', 'M -0.06 -0.05 L 0 -0.20 L 0.06 -0.05 M 0 -0.20 L 0 -0.45');
		arrow.setAttribute('stroke', '#1e3a8a');
		arrow.setAttribute('stroke-width', '0.012');
		arrow.setAttribute('fill', 'none');
		arrow.setAttribute('stroke-linecap', 'round');
		arrow.setAttribute('stroke-linejoin', 'round');
		constructionG.appendChild(arrow);
	},

	_drawAttentionMatrix2D: function(constructionG, labelsG) {
		const NS = this._SVG_NS;
		const M = ATTN_2D.matrix;
		const n = M.length;
		if (!n) return;
		const queries = ATTN_2D._allQueries.slice(0, n);
		// Matrix is n queries × keys.length columns (one fewer than n
		// for the single-query demo, where "it" doesn't carry its own key).
		const m = Math.min(M[0]?.length || 0, ATTN_2D._allKeys.length);
		const keys    = ATTN_2D._allKeys.slice(0, m);

		const cell = 0.32, gap = 0.02;
		const gridW = m * cell + (m - 1) * gap;
		// Centre the grid horizontally; top edge at y = 0.85 so column
		// labels have room and the whole thing fits in the [-1.4,1.4]
		// viewport with room for row labels on the left.
		const x0 = -gridW / 2;
		const y0 = 0.85;
		const labelGap = 0.12;

		// Column headers: key tokens
		for (let j = 0; j < m; j++) {
			const cx = x0 + j * (cell + gap) + cell / 2;
			const t = document.createElementNS(NS, 'text');
			t.setAttribute('x', cx); t.setAttribute('y', y0 + 0.16);
			t.setAttribute('text-anchor', 'middle');
			t.setAttribute('fill', themeColor('#475569'));
			t.setAttribute('font-size', '0.09');
			t.setAttribute('font-family', 'Inter, sans-serif');
			t.textContent = `k${j+1}`;
			t.style.pointerEvents = 'none';
			labelsG.appendChild(t);
		}

		// Row headers: query tokens
		for (let i = 0; i < n; i++) {
			const cy = y0 - i * (cell + gap) - cell / 2 + 0.03;
			const t = document.createElementNS(NS, 'text');
			t.setAttribute('x', x0 - labelGap); t.setAttribute('y', cy);
			t.setAttribute('text-anchor', 'end');
			t.setAttribute('fill', themeColor('#475569'));
			t.setAttribute('font-size', '0.09');
			t.setAttribute('font-family', 'Inter, sans-serif');
			t.textContent = `q${i+1}`;
			t.style.pointerEvents = 'none';
			labelsG.appendChild(t);
		}

		// Axis titles
		const xt = document.createElementNS(NS, 'text');
		xt.setAttribute('x', x0 + gridW / 2);
		xt.setAttribute('y', y0 + 0.32);
		xt.setAttribute('text-anchor', 'middle');
		xt.setAttribute('fill', themeColor('#64748b'));
		xt.setAttribute('font-size', '0.08');
		xt.setAttribute('font-family', 'Inter, sans-serif');
		xt.textContent = 'key  →';
		xt.style.pointerEvents = 'none';
		labelsG.appendChild(xt);

		const yt = document.createElementNS(NS, 'text');
		yt.setAttribute('x', x0 - labelGap - 0.02);
		yt.setAttribute('y', y0 - n * (cell + gap) - 0.05);
		yt.setAttribute('text-anchor', 'end');
		yt.setAttribute('fill', themeColor('#64748b'));
		yt.setAttribute('font-size', '0.08');
		yt.setAttribute('font-family', 'Inter, sans-serif');
		yt.textContent = '↑ query';
		yt.style.pointerEvents = 'none';
		labelsG.appendChild(yt);

		// Cells — only n × m (not n × n), avoiding the undefined last column.
		for (let i = 0; i < n; i++) {
			for (let j = 0; j < m; j++) {
				const w = (M[i] || [])[j] || 0;
				const cx = x0 + j * (cell + gap);
				const cy = y0 - i * (cell + gap) - cell;
				const r = document.createElementNS(NS, 'rect');
				r.setAttribute('x', cx); r.setAttribute('y', cy);
				r.setAttribute('width', cell); r.setAttribute('height', cell);
				// Blue intensity scales with weight. Floor at 0.08 so even
				// very small weights are faintly visible.
				const alpha = 0.08 + w * 0.85;
				r.setAttribute('fill', '#2563eb');
				r.setAttribute('fill-opacity', alpha.toFixed(3));
				r.setAttribute('stroke', '#1e3a8a');
				r.setAttribute('stroke-width', '0.005');
				r.style.cursor = 'help';
				constructionG.appendChild(r);

				// Cell label
				const t = document.createElementNS(NS, 'text');
				t.setAttribute('x', cx + cell / 2);
				t.setAttribute('y', cy + cell / 2 + 0.03);
				t.setAttribute('text-anchor', 'middle');
				t.setAttribute('fill', w > 0.45 ? '#fff' : themeColor('#1e293b'));
				t.setAttribute('font-size', '0.07');
				t.setAttribute('font-family', 'Inter, sans-serif');
				t.textContent = `${(w*100).toFixed(0)}%`;
				t.style.pointerEvents = 'none';
				labelsG.appendChild(t);

				// Invisible hover target so the tooltip works on the whole cell
				const hit = document.createElementNS(NS, 'rect');
				hit.setAttribute('x', cx); hit.setAttribute('y', cy);
				hit.setAttribute('width', cell); hit.setAttribute('height', cell);
				hit.setAttribute('fill', 'transparent');
				hit.style.cursor = 'help';
				constructionG.appendChild(hit);
				const qi = i, qj = j;
				hit.addEventListener('mouseenter', (e) => this._showTooltip('matrix-cell', qi * 10 + qj, e.clientX, e.clientY));
				hit.addEventListener('mousemove',  (e) => this._showTooltip('matrix-cell', qi * 10 + qj, e.clientX, e.clientY));
				hit.addEventListener('mouseleave', () => this._hideTooltip());
			}
		}
	},

	// Step "Self-attention for every token": draw each token's query, key,
	// and output z as arrows in its OWN mini-plot. No dim1/dim2 background
	// (the main grid/axes are hidden for this step in render2D). Every
	// arrow has its own mouseover tooltip.
	_drawSelfAttention2D: function(constructionG, labelsG, arrowsG) {
		const NS = this._SVG_NS;
		const n = ATTN_2D.numTokens;
		const queries = ATTN_2D._allQueries.slice(0, n);
		const keys    = ATTN_2D._allKeys.slice(0, n);
		// Guarantee selfOutputs is computed even if recomputeMatrix was
		// skipped for some reason — otherwise the z mini-arrows render
		// at NaN coordinates and show as broken boxes.
		if (!ATTN_2D.selfOutputs || ATTN_2D.selfOutputs.length < n) {
			ATTN_2D.recomputeMatrix();
		}
		const Z       = ATTN_2D.selfOutputs || [];

		// Layout: each token gets its own panel in a row.
		// Each panel is a self-contained mini-plot with its own q, k, z
		// arrows, labels, and axis. Bigger than before for readability.
		const panelW = 2.6 / n;
		const panelH = 0.85;
		const stripY = -0.55; // top edge of the panel row

		// Strip title — explains what these mini-plots are.
		const title = document.createElementNS(NS, 'text');
		title.setAttribute('x', 0); title.setAttribute('y', stripY - 0.22);
		title.setAttribute('text-anchor', 'middle');
		title.setAttribute('fill', themeColor('#475569'));
		title.setAttribute('font-size', '0.10');
		title.setAttribute('font-weight', '700');
		title.setAttribute('font-family', 'Inter, sans-serif');
		title.textContent = 'self-attention output per token — each gets its own z = Σ αⱼ·vⱼ';
		title.style.pointerEvents = 'none';
		labelsG.appendChild(title);

		const self = this;
		for (let i = 0; i < n; i++) {
			const cx = -1.3 + i * panelW + panelW / 2;
			const tokenName = ATTN_TOKENS[i].name;

			// Panel background — bigger and clearer
			const panelBg = document.createElementNS(NS, 'rect');
			panelBg.setAttribute('x', cx - panelW / 2 + 0.05);
			panelBg.setAttribute('y', stripY);
			panelBg.setAttribute('width', panelW - 0.10);
			panelBg.setAttribute('height', panelH);
			panelBg.setAttribute('fill', themeColor('#f8fafc'));
			panelBg.setAttribute('stroke', themeColor('#cbd5e1'));
			panelBg.setAttribute('stroke-width', '0.005');
			panelBg.setAttribute('rx', '0.03');
			constructionG.appendChild(panelBg);

			// Token header — big and bold, above the panel
			const head = document.createElementNS(NS, 'text');
			head.setAttribute('x', cx); head.setAttribute('y', stripY - 0.05);
			head.setAttribute('text-anchor', 'middle');
			head.setAttribute('fill', ATTN_TOKENS[i].color);
			head.setAttribute('font-size', '0.12');
			head.setAttribute('font-weight', 'bold');
			head.setAttribute('font-family', 'Inter, sans-serif');
			head.textContent = tokenName;
			head.style.pointerEvents = 'none';
			labelsG.appendChild(head);

			// Mini 2D axes (origin at center-bottom of the panel)
			const ox = cx, oy = stripY + 0.55; // origin
			const ax = document.createElementNS(NS, 'line');
			ax.setAttribute('x1', cx - 0.40); ax.setAttribute('y1', oy);
			ax.setAttribute('x2', cx + 0.40); ax.setAttribute('y2', oy);
			ax.setAttribute('stroke', themeColor('#94a3b8'));
			ax.setAttribute('stroke-width', '0.008');
			ax.style.pointerEvents = 'none';
			constructionG.appendChild(ax);
			const ay = document.createElementNS(NS, 'line');
			ay.setAttribute('x1', ox); ay.setAttribute('y1', oy - 0.40);
			ay.setAttribute('x2', ox); ay.setAttribute('y2', oy + 0.10);
			ay.setAttribute('stroke', themeColor('#94a3b8'));
			ay.setAttribute('stroke-width', '0.008');
			ay.style.pointerEvents = 'none';
			constructionG.appendChild(ay);

			// Mini-arrow draw function with hover tooltip.
			// `offset` is a perpendicular shift so q, k, v, z (which
			// share the same tail) don't overlap when they're parallel
			// or identical (q == k in self-attention).
			const scale = 0.16;
			const drawMini = (v, color, label, tipKey, offset) => {
				if (!v || !isFinite(v[0]) || !isFinite(v[1])) {
					const dot = document.createElementNS(NS, 'circle');
					dot.setAttribute('cx', ox);
					dot.setAttribute('cy', oy);
					dot.setAttribute('r', '0.03');
					dot.setAttribute('fill', themeColor('#94a3b8'));
					dot.style.pointerEvents = 'none';
					constructionG.appendChild(dot);
					return;
				}
				// Perpendicular offset (in data units) so overlapping
				// arrows get fanned out visually.
				const off = offset || 0;
				const nx = -v[1], ny = v[0];
				const nlen = Math.hypot(nx, ny) || 1;
				const px = (nx / nlen) * off;
				const py = (ny / nlen) * off;
				const ex = ox + v[0] * scale + px;
				const ey = oy - v[1] * scale - py;
				const sx = ox + px;
				const sy = oy - py;
				const line = document.createElementNS(NS, 'line');
				line.setAttribute('x1', sx); line.setAttribute('y1', sy);
				line.setAttribute('x2', ex); line.setAttribute('y2', ey);
				line.setAttribute('stroke', color);
				line.setAttribute('stroke-width', '0.020');
				line.setAttribute('stroke-linecap', 'round');
				line.style.pointerEvents = 'none';
				constructionG.appendChild(line);
				// Arrowhead
				const dx = ex - sx, dy2 = ey - sy;
				const len = Math.sqrt(dx*dx + dy2*dy2);
				if (len > 0.02) {
					const ux = dx/len, uy = dy2/len;
					const s = 0.045;
					const c = Math.cos(Math.PI/6), si = Math.sin(Math.PI/6);
					const head = document.createElementNS(NS, 'polygon');
					head.setAttribute('points', `${ex},${ey} ${ex-s*(ux*c-uy*si)},${ey-s*(ux*si+uy*c)} ${ex-s*(ux*c+uy*si)},${ey-s*(-ux*si+uy*c)}`);
					head.setAttribute('fill', color);
					head.style.pointerEvents = 'none';
					constructionG.appendChild(head);
				}
				// Label at the tip — pushed further out when offset
				const t = document.createElementNS(NS, 'text');
				t.setAttribute('x', ex + 0.05 + px * 0.5);
				t.setAttribute('y', ey - 0.03 - py * 0.5);
				t.setAttribute('text-anchor', 'start');
				t.setAttribute('fill', color);
				t.setAttribute('font-size', '0.11');
				t.setAttribute('font-weight', '700');
				t.setAttribute('font-family', 'Inter, sans-serif');
				t.textContent = label;
				t.style.pointerEvents = 'none';
				labelsG.appendChild(t);

				// Hover tooltip for this mini-arrow — generous hit area
				const hit = document.createElementNS(NS, 'rect');
				hit.setAttribute('x', Math.min(sx, ex) - 0.05);
				hit.setAttribute('y', Math.min(sy, ey) - 0.05);
				hit.setAttribute('width', Math.abs(ex - sx) + 0.12);
				hit.setAttribute('height', Math.abs(ey - sy) + 0.12);
				hit.setAttribute('fill', 'transparent');
				hit.style.cursor = 'help';
				constructionG.appendChild(hit);
				hit.addEventListener('mouseenter', (e) => self._showTooltip(tipKey, i, e.clientX, e.clientY));
				hit.addEventListener('mousemove',  (e) => self._showTooltip(tipKey, i, e.clientX, e.clientY));
				hit.addEventListener('mouseleave', () => self._hideTooltip());
			};
			// Draw q, k, v, z each with its own mouseover. Use small
			// perpendicular offsets so parallel arrows don't stack on
			// top of each other (q and k are identical in self-attention).
			const v = (i === 0) ? null : ATTN_2D._allVals[i-1];
			drawMini(queries[i], '#ef4444', 'q', 'q',  0.035);
			drawMini(keys[i],    '#2563eb', 'k', 'k', -0.035);
			if (v) drawMini(v,   '#10b981', 'v', 'self-v', 0);
			drawMini(Z[i],       '#f59e0b', 'z', 'z', 0);

			// z value label below the panel — bigger font
			if (Z[i] && isFinite(Z[i][0])) {
				const zv = document.createElementNS(NS, 'text');
				zv.setAttribute('x', cx); zv.setAttribute('y', stripY + panelH + 0.14);
				zv.setAttribute('text-anchor', 'middle');
				zv.setAttribute('fill', themeColor('#475569'));
				zv.setAttribute('font-size', '0.085');
				zv.setAttribute('font-family', 'monospace');
				zv.textContent = `z = (${Z[i][0].toFixed(2)}, ${Z[i][1].toFixed(2)})`;
				zv.style.pointerEvents = 'none';
				labelsG.appendChild(zv);
			}
		}
	},

	// Steps "dot"/"scaled"/"exps": the projection of the query onto each
	// key's line. A dashed perpendicular from the query tip down to the
	// key line, the origin→projection length thickened, and a dot at the
	// landing point — the classic geometric picture of q·k = |q||k|cosθ.
	_drawProjections2D: function(constructionG) {
		const NS = this._SVG_NS;
		const q = ATTN_2D.q;
		ATTN_2D.keys.forEach((k, j) => {
			const color = ATTN_TOKENS[j + 1].color;
			const nk = Math.hypot(k[0], k[1]);
			const t = (q[0] * k[0] + q[1] * k[1]) / (nk * nk);   // signed projection factor
			const P = [ t * k[0], t * k[1] ];

			// Perpendicular from the query tip down onto the key's line
			const drop = document.createElementNS(NS, 'line');
			drop.setAttribute('x1', q[0]); drop.setAttribute('y1', -q[1]);
			drop.setAttribute('x2', P[0]); drop.setAttribute('y2', -P[1]);
			drop.setAttribute('stroke', color);
			drop.setAttribute('stroke-opacity', '0.45');
			drop.setAttribute('stroke-width', '0.008');
			drop.setAttribute('stroke-dasharray', '0.025 0.025');
			drop.style.pointerEvents = 'none';
			constructionG.appendChild(drop);

			// The projected length along the key (origin → P), thickened
			const seg = document.createElementNS(NS, 'line');
			seg.setAttribute('x1', 0);     seg.setAttribute('y1', 0);
			seg.setAttribute('x2', P[0]);  seg.setAttribute('y2', -P[1]);
			seg.setAttribute('stroke', color);
			seg.setAttribute('stroke-opacity', '0.3');
			seg.setAttribute('stroke-width', '0.05');
			seg.setAttribute('stroke-linecap', 'round');
			seg.style.pointerEvents = 'none';
			constructionG.appendChild(seg);

			// Dot at the projection point (+ an invisible, more forgiving
			// hover target around it showing the projection tooltip)
			const dot = document.createElementNS(NS, 'circle');
			dot.setAttribute('cx', P[0]);
			dot.setAttribute('cy', -P[1]);
			dot.setAttribute('r', '0.025');
			dot.setAttribute('fill', color);
			dot.style.pointerEvents = 'none';
			constructionG.appendChild(dot);

			const hit = document.createElementNS(NS, 'circle');
			hit.setAttribute('cx', P[0]);
			hit.setAttribute('cy', -P[1]);
			hit.setAttribute('r', '0.09');
			hit.setAttribute('fill', 'transparent');
			hit.style.cursor = 'help';
			constructionG.appendChild(hit);
			hit.addEventListener('mouseenter', (e) => this._showTooltip('proj', j, e.clientX, e.clientY));
			hit.addEventListener('mousemove',  (e) => this._showTooltip('proj', j, e.clientX, e.clientY));
			hit.addEventListener('mouseleave', () => this._hideTooltip());
		});
	},

	// The score bars are drawn as STACKED BUILDING BLOCKS so the user can
	// see where each bar comes from: the dot product is just the sum of
	// the per-dimension products q[1]·kⱼ[1] and q[2]·kⱼ[2]. Positive
	// products stack downward from the baseline, negative ones upward, so
	// an agreeing key makes a tall bar while a mixed key visibly cancels.
	// The per-key caption "0.90 + 0.18 = 1.08" spells out the blocks.
	_drawScoreBlocks2D: function(constructionG, labelsG) {
		const NS = this._SVG_NS;
		const q = ATTN_2D.q;
		const m = ATTN_2D.keys.length;
		if (!m) return;
		const maxA = Math.max.apply(null, ATTN_2D.scores.map((v) => Math.abs(v)).concat([1e-9]));
		const x0 = -1.2, x1 = 1.2;
		const w = (x1 - x0) / m;
		const baseY = -1.14;
		const maxH  = 0.20;

		// Baseline (zero)
		const axis = document.createElementNS(NS, 'line');
		axis.setAttribute('x1', x0); axis.setAttribute('y1', baseY);
		axis.setAttribute('x2', x1); axis.setAttribute('y2', baseY);
		axis.setAttribute('stroke', themeColor('#94a3b8'));
		axis.setAttribute('stroke-width', '0.006');
		axis.style.pointerEvents = 'none';
		constructionG.appendChild(axis);

		ATTN_2D.keys.forEach((k, j) => {
			const color = ATTN_TOKENS[j + 1].color;
			const p1 = q[0] * k[0], p2 = q[1] * k[1];
			const products = [p1, p2];
			const cx = x0 + w * (j + 0.5);
			const bw = Math.max(w - 0.14, 0.06);
			const hOf = (p) => (Math.abs(p) / maxA) * maxH;

			// Running edge (SVG y, grows downward); start on the baseline.
			let edge = baseY;
			products.forEach((p, di) => {
				const h = hOf(p);
				const y0 = (p >= 0) ? edge : edge - h;
				const rect = document.createElementNS(NS, 'rect');
				rect.setAttribute('x', cx - bw / 2);
				rect.setAttribute('y', y0);
				rect.setAttribute('width', bw);
				rect.setAttribute('height', Math.max(h, 0.006));
				rect.setAttribute('fill', di === 0 ? color : this._shade(color, 0.5));
				rect.setAttribute('fill-opacity', '0.9');
				rect.setAttribute('stroke', color);
				rect.setAttribute('stroke-opacity', '0.5');
				rect.setAttribute('stroke-width', '0.008');
				rect.style.cursor = 'help';
				constructionG.appendChild(rect);
				rect.addEventListener('mouseenter', (e) => this._showTooltip('bar-score', j, e.clientX, e.clientY));
				rect.addEventListener('mousemove',  (e) => this._showTooltip('bar-score', j, e.clientX, e.clientY));
				rect.addEventListener('mouseleave', () => this._hideTooltip());
				edge += (p >= 0 ? 1 : -1) * h;
			});

			// Caption above this key's stack: the blocks as one equation.
			const signed = (x) => (x < 0 ? '-' + Math.abs(x).toFixed(2) : x.toFixed(2));
			const cap = document.createElementNS(NS, 'text');
			cap.setAttribute('x', cx);
			cap.setAttribute('y', baseY - maxH - 0.06);
			cap.setAttribute('text-anchor', 'middle');
			cap.setAttribute('fill', themeColor('#334155'));
			cap.setAttribute('font-size', '0.075');
			cap.setAttribute('font-family', 'Inter, sans-serif');
			cap.textContent = `${signed(p1)} ${p2 < 0 ? '−' : '+'} ${signed(p2)} = ${signed(ATTN_2D.scores[j])}`;
			cap.style.pointerEvents = 'none';
			labelsG.appendChild(cap);
		});
	},

	// Step "scaled": the previous step's score bars shown as faint dashed
	// ghosts behind the solid scaled bars, so the "÷ √2" shrink is visible
	// bar by bar. Same baseline, same max scale, so the ghosts sit exactly
	// where the score bars were one step ago.
	_drawScaledBars2D: function(constructionG, labelsG) {
		this._drawBeforeAfterBars2D(constructionG, labelsG, ATTN_2D.scores, ATTN_2D.scaled, 'bar-score', 'bar-scaled', '÷ √2');
	},

	// Step "exps": the scaled scores as ghosts behind the exp() bars.
	// Positive inputs grow, negative inputs flip above the line and
	// shrink toward 0 — the whole softmax amplification in one picture.
	_drawExpBars2D: function(constructionG, labelsG) {
		this._drawBeforeAfterBars2D(constructionG, labelsG, ATTN_2D.scaled, ATTN_2D.exps, 'bar-scaled', 'bar-exp', 'eˣ');
	},

	// Shared engine for the before/after bar steps: for each key draw the
	// ghost bar (the input value, dashed + translucent) and the solid bar
	// (the output value) on top, both hanging from the same baseline and
	// scaled against the SAME max, so the eye directly reads the growth
	// or the shrink. `opTag` is the operation label ("÷ √2", "eˣ") shown
	// at the left edge of the row.
	_drawBeforeAfterBars2D: function(constructionG, labelsG, inputVals, outputVals, tipIn, tipOut, opTag) {
		const NS = this._SVG_NS;
		const m = inputVals.length;
		if (!m) return;
		const maxA = Math.max.apply(null, ATTN_2D.scores.map((v) => Math.abs(v)).concat([1e-9]));
		const x0 = -1.2, x1 = 1.2;
		const w = (x1 - x0) / m;
		const baseY = -1.14;
		const maxH  = 0.20;

		// Baseline (zero)
		const axis = document.createElementNS(NS, 'line');
		axis.setAttribute('x1', x0); axis.setAttribute('y1', baseY);
		axis.setAttribute('x2', x1); axis.setAttribute('y2', baseY);
		axis.setAttribute('stroke', themeColor('#94a3b8'));
		axis.setAttribute('stroke-width', '0.006');
		axis.style.pointerEvents = 'none';
		constructionG.appendChild(axis);

		// Operation label at the left edge of the row, e.g. "÷ √2".
		if (opTag) {
			const t = document.createElementNS(NS, 'text');
			t.setAttribute('x', x0); t.setAttribute('y', baseY - 0.10);
			t.setAttribute('text-anchor', 'start');
			t.setAttribute('fill', themeColor('#64748b'));
			t.setAttribute('font-size', '0.07');
			t.setAttribute('font-family', 'Inter, sans-serif');
			t.textContent = opTag;
			t.style.pointerEvents = 'none';
			labelsG.appendChild(t);
		}

		const barRect = (v, cx, bw) => {
			const h = (Math.abs(v) / maxA) * maxH;
			const rect = document.createElementNS(NS, 'rect');
			if (v >= 0) { rect.setAttribute('x', cx - bw / 2); rect.setAttribute('y', baseY); rect.setAttribute('height', h); }
			else        { rect.setAttribute('x', cx - bw / 2); rect.setAttribute('y', baseY - h); rect.setAttribute('height', h); }
			return rect;
		};

		ATTN_2D.keys.forEach((k, j) => {
			const color = ATTN_TOKENS[j + 1].color;
			const cx = x0 + w * (j + 0.5);
			const bw = Math.max(w - 0.14, 0.06);
			const vin = inputVals[j], vout = outputVals[j];

			// Ghost: the input bar, just outlines so the solid bar shows through.
			const ghost = barRect(vin, cx, bw);
			ghost.setAttribute('fill', color);
			ghost.setAttribute('fill-opacity', '0.14');
			ghost.setAttribute('stroke', color);
			ghost.setAttribute('stroke-opacity', '0.45');
			ghost.setAttribute('stroke-width', '0.008');
			ghost.setAttribute('stroke-dasharray', '0.025 0.025');
			ghost.style.cursor = 'help';
			constructionG.appendChild(ghost);
			ghost.addEventListener('mouseenter', (e) => this._showTooltip(tipIn, j, e.clientX, e.clientY));
			ghost.addEventListener('mousemove',  (e) => this._showTooltip(tipIn, j, e.clientX, e.clientY));
			ghost.addEventListener('mouseleave', () => this._hideTooltip());

			// Solid: the output bar.
			const solid = barRect(vout, cx, bw);
			solid.setAttribute('fill', color);
			solid.setAttribute('fill-opacity', '0.9');
			solid.setAttribute('stroke', color);
			solid.setAttribute('stroke-opacity', '0.5');
			solid.setAttribute('stroke-width', '0.008');
			solid.style.cursor = 'help';
			constructionG.appendChild(solid);
			solid.addEventListener('mouseenter', (e) => this._showTooltip(tipOut, j, e.clientX, e.clientY));
			solid.addEventListener('mousemove',  (e) => this._showTooltip(tipOut, j, e.clientX, e.clientY));
			solid.addEventListener('mouseleave', () => this._hideTooltip());

			// Caption above the pair, e.g. "k₁: 1.08 → 0.76".
			const cap = document.createElementNS(NS, 'text');
			cap.setAttribute('x', cx);
			cap.setAttribute('y', baseY - maxH - 0.10);
			cap.setAttribute('text-anchor', 'middle');
			cap.setAttribute('fill', themeColor('#334155'));
			cap.setAttribute('font-size', '0.065');
			cap.setAttribute('font-family', 'Inter, sans-serif');
			cap.textContent = `${vin.toFixed(2)} → ${vout.toFixed(2)}`;
			cap.style.pointerEvents = 'none';
			labelsG.appendChild(cap);
		});
	},

	// Step "weights": softmax as a RENORMALIZATION. The raw exp(score)
	// values are drawn as a full-width strip above (same proportional
	// segments as the weight bar — because weight_j = exp_j / Σ). The
	// "÷ Σ" divider between them is the entire operation: divide the
	// exp strip by the sum and you get the attention bar, unchanged in
	// shape, re-scaled so it sums to exactly 100%.
	_drawWeightBar2D: function(constructionG, labelsG) {
		const NS = this._SVG_NS;
		const w = ATTN_2D.weights;
		const ex = ATTN_2D.exps;
		const sumEx = ex.reduce((a, b) => a + b, 0);
		const x0 = -1.2, x1 = 1.2;
		const span = x1 - x0;
		const baseY = -1.14, h = 0.16;

		// The raw exp(score) strip — the INPUT to softmax.
		const stripY = -1.38, stripH = 0.07;
		let acc = 0;
		ex.forEach((e, j) => {
			const xl = x0 + acc * span;
			const xr = x0 + (acc + e / sumEx) * span;
			const rect = document.createElementNS(NS, 'rect');
			rect.setAttribute('x', xl);
			rect.setAttribute('y', stripY);
			rect.setAttribute('width', Math.max(xr - xl, 0.01));
			rect.setAttribute('height', stripH);
			rect.setAttribute('fill', this._shade(ATTN_TOKENS[j + 1].color, 0.7));
			rect.setAttribute('fill-opacity', '0.9');
			rect.style.cursor = 'help';
			constructionG.appendChild(rect);
			rect.addEventListener('mouseenter', (e) => this._showTooltip('bar-exp', j, e.clientX, e.clientY));
			rect.addEventListener('mousemove',  (e) => this._showTooltip('bar-exp', j, e.clientX, e.clientY));
			rect.addEventListener('mouseleave', () => this._hideTooltip());

			const t = document.createElementNS(NS, 'text');
			t.setAttribute('x', (xl + xr) / 2);
			t.setAttribute('y', stripY + stripH / 2);
			t.setAttribute('text-anchor', 'middle');
			t.setAttribute('dominant-baseline', 'middle');
			t.setAttribute('fill', '#fff');
			t.setAttribute('font-size', '0.062');
			t.setAttribute('font-weight', 'bold');
			t.setAttribute('font-family', 'Inter, sans-serif');
			t.textContent = e.toFixed(2);
			t.style.pointerEvents = 'none';
			labelsG.appendChild(t);
			acc += e / sumEx;
		});

		// "exp" tag on the strip + the ÷ Σ divider. Both ride the same
		// caption line below the strip — the divider centered under the
		// strip would collide with the wide first segment's e-value label.
		const tag = document.createElementNS(NS, 'text');
		tag.setAttribute('x', x0);
		tag.setAttribute('y', stripY - 0.05);
		tag.setAttribute('text-anchor', 'start');
		tag.setAttribute('fill', themeColor('#64748b'));
		tag.setAttribute('font-size', '0.062');
		tag.setAttribute('font-family', 'Inter, sans-serif');
		tag.textContent = 'eˢ';
		tag.style.pointerEvents = 'none';
		labelsG.appendChild(tag);

		const div = document.createElementNS(NS, 'text');
		div.setAttribute('x', x0 + 0.10);
		div.setAttribute('y', stripY - 0.05);
		div.setAttribute('text-anchor', 'start');
		div.setAttribute('fill', themeColor('#64748b'));
		div.setAttribute('font-size', '0.062');
		div.setAttribute('font-family', 'Inter, sans-serif');
		div.textContent = `÷ Σ = ${sumEx.toFixed(3)}`;
		div.style.pointerEvents = 'none';
		labelsG.appendChild(div);

		const title = document.createElementNS(NS, 'text');
		title.setAttribute('x', 0);
		title.setAttribute('y', baseY - 0.065);
		title.setAttribute('text-anchor', 'middle');
		title.setAttribute('fill', themeColor('#64748b'));
		title.setAttribute('font-size', '0.075');
		title.setAttribute('font-family', 'Inter, sans-serif');
		title.textContent = 'attention weights α — sum = 100%';
		title.style.pointerEvents = 'none';
		labelsG.appendChild(title);

		acc = 0;
		w.forEach((wi, j) => {
			const xl = x0 + acc * span;
			const xr = x0 + (acc + wi) * span;
			const rect = document.createElementNS(NS, 'rect');
			rect.setAttribute('x', xl);
			rect.setAttribute('y', baseY);
			rect.setAttribute('width', Math.max(xr - xl, 0.01));
			rect.setAttribute('height', h);
			rect.setAttribute('fill', ATTN_TOKENS[j + 1].color);
			rect.setAttribute('fill-opacity', '0.85');
			rect.style.cursor = 'help';
			constructionG.appendChild(rect);
			rect.addEventListener('mouseenter', (e) => this._showTooltip('wbar', j, e.clientX, e.clientY));
			rect.addEventListener('mousemove',  (e) => this._showTooltip('wbar', j, e.clientX, e.clientY));
			rect.addEventListener('mouseleave', () => this._hideTooltip());

			const t = document.createElementNS(NS, 'text');
			t.setAttribute('x', (xl + xr) / 2);
			t.setAttribute('y', baseY + h / 2);
			t.setAttribute('text-anchor', 'middle');
			t.setAttribute('fill', '#fff');
			t.setAttribute('font-size', '0.07');
			t.setAttribute('font-weight', 'bold');
			t.setAttribute('font-family', 'Inter, sans-serif');
			t.textContent = `α${j+1} ${(wi * 100).toFixed(1)}%`;
			t.style.pointerEvents = 'none';
			labelsG.appendChild(t);
			acc += wi;
		});
	},

	// Step "values": annotate each value arrow with its attention weight,
	// so you can see the weights carry over from the keys to the values.
	// Each label is hoverable (same tooltip as the weight-bar segments).
	_drawValueWeights2D: function(labelsG) {
		const NS = this._SVG_NS;
		ATTN_2D.weights.forEach((wi, j) => {
			const v = ATTN_2D.vals[j];
			const t = document.createElementNS(NS, 'text');
			t.setAttribute('x', v[0] + 0.14);
			// Below the value's tip label (which sits at -v[1]-0.04), far
			// enough that the two stacked labels never touch.
			t.setAttribute('y', -v[1] - 0.16);
			t.setAttribute('fill', '#15803d');
			t.setAttribute('font-size', '0.08');
			t.setAttribute('font-family', 'Inter, sans-serif');
			t.textContent = `α${j+1} = ${(wi * 100).toFixed(1)}%`;
			t.style.cursor = 'help';
			labelsG.appendChild(t);
			t.addEventListener('mouseenter', (e) => this._showTooltip('wbar', j, e.clientX, e.clientY));
			t.addEventListener('mousemove',  (e) => this._showTooltip('wbar', j, e.clientX, e.clientY));
			t.addEventListener('mouseleave', () => this._hideTooltip());
		});
	},

	// Step "output": fill the span (convex hull) of the value tips with
	// a translucent triangle/segment, so z visibly lands inside it.
	// The whole region is hoverable.
	_drawSpanFill2D: function(constructionG) {
		const NS = this._SVG_NS;
		const vals = ATTN_2D.vals;
		if (vals.length < 2) return;
		const pts = vals.map((v) => `${v[0].toFixed(4)},${(-v[1]).toFixed(4)}`).join(' ');
		const bind = (el) => {
			el.style.cursor = 'help';
			constructionG.appendChild(el);
			el.addEventListener('mouseenter', (e) => this._showTooltip('span', 0, e.clientX, e.clientY));
			el.addEventListener('mousemove',  (e) => this._showTooltip('span', 0, e.clientX, e.clientY));
			el.addEventListener('mouseleave', () => this._hideTooltip());
		};
		if (vals.length === 2) {
			const line = document.createElementNS(NS, 'line');
			line.setAttribute('x1', vals[0][0]); line.setAttribute('y1', -vals[0][1]);
			line.setAttribute('x2', vals[1][0]); line.setAttribute('y2', -vals[1][1]);
			line.setAttribute('stroke', '#f59e0b');
			line.setAttribute('stroke-opacity', '0.6');
			line.setAttribute('stroke-width', '0.05');   // fat enough to hover
			line.setAttribute('stroke-dasharray', '0.04 0.04');
			bind(line);
			// thin visible version
			const vis = document.createElementNS(NS, 'line');
			vis.setAttribute('x1', vals[0][0]); vis.setAttribute('y1', -vals[0][1]);
			vis.setAttribute('x2', vals[1][0]); vis.setAttribute('y2', -vals[1][1]);
			vis.setAttribute('stroke', '#f59e0b');
			vis.setAttribute('stroke-opacity', '0.6');
			vis.setAttribute('stroke-width', '0.014');
			vis.setAttribute('stroke-dasharray', '0.04 0.04');
			vis.style.pointerEvents = 'none';
			constructionG.appendChild(vis);
		} else {
			const poly = document.createElementNS(NS, 'polygon');
			poly.setAttribute('points', pts);
			poly.setAttribute('fill', '#f59e0b');
			poly.setAttribute('fill-opacity', '0.08');
			poly.setAttribute('stroke', '#f59e0b');
			poly.setAttribute('stroke-opacity', '0.45');
			poly.setAttribute('stroke-width', '0.008');
			poly.setAttribute('stroke-dasharray', '0.03 0.03');
			bind(poly);
		}
	},

	// Replaces the old Plotly-based render2D. Draws arrows as SVG.
	render2D: function(data) {
		const svg = document.getElementById('attn-anatomy-2d-svg');
		if (!svg) return;

		const arrowsG       = svg.querySelector('.attn-arrows');
		const labelsG       = svg.querySelector('.attn-labels');
		const constructionG = svg.querySelector('.attn-construction');
		const anglesG       = svg.querySelector('.attn-angles');
		arrowsG.innerHTML       = '';
		labelsG.innerHTML       = '';
		constructionG.innerHTML = '';
		if (anglesG) anglesG.innerHTML = '';

		// Sanity checks before drawing — catch data corruption early
		this._assert(data && typeof data.mode === 'string', `render2D: bad data, mode=${data && data.mode}`);
		this._assert(ATTN_2D.keys && ATTN_2D.keys.length > 0, 'render2D: ATTN_2D.keys is empty');
		this._assert(ATTN_2D.q && ATTN_2D.q.length === 2 && !isNaN(ATTN_2D.q[0]) && !isNaN(ATTN_2D.q[1]),
			`render2D: ATTN_2D.q is bad: ${JSON.stringify(ATTN_2D.q)}`);
		ATTN_2D.keys.forEach((k, i) => {
			if (!k || isNaN(k[0]) || isNaN(k[1])) {
				this._dbg('ERROR', `render2D: ATTN_2D.keys[${i}] is bad: ${JSON.stringify(k)}`);
			}
		});

		const mode = data.mode;
		const comp = data.computation;

		if (mode === 'keys' || mode === 'values') {
			this._addSVGArrow(arrowsG, labelsG, [0, 0], ATTN_2D.q, this._tokenColor('#ef4444', 0), 'q', 'q', 0, false, false, undefined, undefined, this._tokenOpacity(0));
		}

		if (mode === 'projections') {
			this._drawLearnableProjections2D(constructionG, labelsG, arrowsG);
		}

		if (mode === 'matrix') {
			// The full α-matrix is rendered as an HTML table in the
			// computation panel (with hover info on every cell). Here we
			// just show a brief pointer so the 2D plot isn't empty.
			this._drawMatrixRedirect2D(constructionG, labelsG);
		}

		if (mode === 'selfattn') {
			this._drawSelfAttention2D(constructionG, labelsG, arrowsG);
		}

		// Hide the dim1/dim2 grid + axes for matrix & selfattn steps —
		// they have no geometric meaning there (the matrix is a table,
		// self-attention uses its own mini-plots).
		if (svg) {
			const hideBg = (mode === 'matrix' || mode === 'selfattn');
			svg.querySelector('.attn-grid').style.display = hideBg ? 'none' : '';
			svg.querySelector('.attn-axes').style.display = hideBg ? 'none' : '';
		}

		if (mode === 'keys') {
			// Hover dimming: when a token is hovered, fade the others.
			// The query (idx 0) dims when "it" is NOT hovered.
			const qOpacity = this._tokenOpacity(0);
			const qColor   = this._tokenColor('#ef4444', 0);

			ATTN_2D.keys.forEach((k, j) => {
				const isHi = (data.highlightKey === j);
				const dim  = (data.highlightKey !== undefined && !isHi);
				const tkOpacity = this._tokenOpacity(j + 1);
				const color = isHi ? '#1e3a8a' : ATTN_TOKENS[j + 1].color;
				const drawColor = (tkOpacity < 1) ? this._tokenColor(color, j + 1) : color;

				// A key that sits within ~25° of the query is so close that
				// its tip label would sit right on top of q's — push it a
				// little further out along the shaft instead. And in the
				// weights step the weight-bar's α labels live in a band
				// below the plot center, so any key whose tip label would
				// land in that band flips to the far side of the arrowhead.
				const ang = Math.atan2(k[1], k[0]);
				const aq  = Math.atan2(ATTN_2D.q[1], ATTN_2D.q[0]);
				const gap = Math.abs(Math.atan2(Math.sin(ang - aq), Math.cos(ang - aq)));
				const nearQ = gap < 25 * Math.PI / 180;
				const labelY = -k[1] - 0.04;
				const inBarBand = (comp === 'weights' && labelY >= -1.05 && labelY <= -0.75);
				const lpos = inBarBand ? [-0.20, 0.04]
					: (nearQ ? [0.14, -0.14] : undefined);

				this._addSVGArrow(arrowsG, labelsG, [0, 0], k, drawColor, `k${j+1}`, 'k', j, false, dim, lpos, undefined, tkOpacity);
				if (anglesG) this._addAngleArc(anglesG, labelsG, ATTN_2D.q, k, drawColor, j, dim || tkOpacity < 1);
			});

			// The lengths that feed cos θ = q·k/(‖q‖‖k‖), as muted
			// sub-labels — so the score's geometric ingredients are
			// visible in the scene, not only in a tooltip.
			this._addMagnitudeLabels2D(labelsG, data);

			// Numerical value labels next to each key, so the user can
			// read off the score / scaled / exp / weight at a glance.
			this._addValueLabels2D(labelsG, comp);

			// Per-step overlays: show the vectors being worked on —
			// Per-step overlays: product rectangles, projections stay in
			// the 2D scene. The bar plots (score / scaled / exp / weight)
			// are drawn in their own SVG below — see _renderBarPlots().
			const tokenColors = ATTN_TOKENS.slice(1).map((t) => t.color);
			if (comp === 'components') {
				this._drawComponents2D(constructionG, labelsG, data.highlightKey);
			} else {
				// Projections (dashed perpendicular from q tip to key line)
				// stay in the main 2D plot — they're geometric, not a bar.
				this._drawProjections2D(constructionG);
			}
		} else if (mode === 'values' || mode === 'output') {
			// Values use the SAME hue family as the keys but shifted toward
			// green so the visual story "this key matches this value" holds:
			// each value is the green-shifted twin of its key.
			const valColors = ATTN_TOKENS.slice(1).map((t) => this._shade(t.color, 0.55));
			ATTN_2D.vals.forEach((v, j) => {
				const dim = (mode === 'output');
				// When a value coincides with z (2-token case) push its
				// label up so it doesn't collide with "z = output". In the
				// output step the values are dimmed context anyway, so keep
				// their labels clear of the bright z label / weighted-v
				// cluster by hugging the value tip instead of floating.
				const sameAsZ = (mode === 'output' &&
					Math.hypot(v[0] - ATTN_2D.output[0], v[1] - ATTN_2D.output[1]) < 0.05);
				// In output mode "z = output" is anchored left of the z tip,
				// so value labels hugging their tip would collide with it.
				// v2 sits closest to z, so drop it below its own tip instead.
				const opos = (mode === 'output')
					? (j === 1 ? [0.16, -0.16] : [0.14, 0.02])
					: undefined;
				this._addSVGArrow(arrowsG, labelsG, [0, 0], v, valColors[j], `v${j+1}`, 'v', j, false, dim,
					sameAsZ ? [0.14, -0.20] : opos);
			});
			if (mode === 'values') this._drawValueWeights2D(labelsG);

			if (mode === 'output') {
				// The weighted values: dashed arrows from the origin,
				// fanned-out labels so they never stack on each other
				// or on z. In the degenerate 2-token case (α₁ = 1) the
				// weighted value coincides with z — skip the duplicate
				// arrow and let z speak for itself.
				ATTN_2D.weightedVals.forEach((wv, j) => {
					const sameAsZ = Math.hypot(wv[0] - ATTN_2D.output[0], wv[1] - ATTN_2D.output[1]) < 0.05;
					if (sameAsZ) return;
					this._addSVGArrow(arrowsG, labelsG, [0, 0], wv, '#15803d', `α${j+1}·v${j+1}`, 'weightedV', j, true, false,
						[0.16, 0.08 + j * 0.18]);
				});

				// Tip-to-tail construction lines (no formula, no events)
				const NS = this._SVG_NS;
				let tip = [0, 0];
				ATTN_2D.weightedVals.forEach((wv, j) => {
					const next = [tip[0] + wv[0], tip[1] + wv[1]];
					const line = document.createElementNS(NS, 'line');
					line.setAttribute('x1', tip[0]); line.setAttribute('y1', -tip[1]);
					line.setAttribute('x2', next[0]); line.setAttribute('y2', -next[1]);
					line.setAttribute('stroke', '#94a3b8');
					line.setAttribute('stroke-width', '0.014');
					line.setAttribute('stroke-dasharray', '0.03 0.03');
					line.setAttribute('opacity', '0.65');
					line.style.pointerEvents = 'none';
					constructionG.appendChild(line);
					tip = next;
				});

				// Blend lines: each original value tip → z. This shows z
				// as the weighted CENTER of the values, not a new vector.
				ATTN_2D.vals.forEach((v, j) => {
					if (Math.hypot(v[0] - ATTN_2D.output[0], v[1] - ATTN_2D.output[1]) < 0.05) return;
					const line = document.createElementNS(NS, 'line');
					line.setAttribute('x1', v[0]);      line.setAttribute('y1', -v[1]);
					line.setAttribute('x2', ATTN_2D.output[0]); line.setAttribute('y2', -ATTN_2D.output[1]);
					line.setAttribute('stroke', '#94a3b8');
					line.setAttribute('stroke-width', '0.007');
					line.setAttribute('stroke-dasharray', '0.02 0.025');
					line.setAttribute('opacity', '0.45');
					line.style.pointerEvents = 'none';
					constructionG.appendChild(line);
				});

				// Fill the span of the value tips so z visibly lands inside it
				this._drawSpanFill2D(constructionG);

				this._addSVGArrow(arrowsG, labelsG, [0, 0], ATTN_2D.output, '#f59e0b', 'z = output', 'z', 0, false, false,
					[-0.16, -0.04], 'end');
			}
		}
	},

	// (Old Plotly-based addArrow2D removed — replaced by _addSVGArrow above.)


	// (Old renderBars removed — the bar chart was redundant with the
	// "Currently computing" panel, which already shows the same numbers.)
	// (Old highlightEquation removed — highlighting is now done via
	// \color in the LaTeX rendered by renderEquation.)
};

function initAttentionAnatomy() {
	AttentionAnatomy.init();
}


/**
 * Lazy-loaded Q/K/V subspace projection visualization.
 * Shows how W^Q, W^K, W^V project 3D embeddings onto different 2D planes.
 * Call initQKVSubspaceViz() once after the DOM is ready.
 */
function initQKVSubspaceViz() {
	const containerId = 'qkv-subspace-projection-viz';
	const container = document.getElementById(containerId);
	if (!container) return;

	const render = () => _renderQKVSubspaceViz(containerId);

	// Re-render whenever the theme flips so colors stay in sync —
	// but only while the (heavy Plotly) section is actually on screen.
	if (window.__MN_DARK) {
		window.__MN_DARK.onChange(() => {
			const r = container.getBoundingClientRect();
			const vh = window.innerHeight || document.documentElement.clientHeight;
			if (r.top < vh && r.bottom > 0) render();
		});
	}

	// Lazy-load: only build the (heavy) Plotly scene when the user
	// scrolls it into view. Falls back to immediate render if the
	// container is already on screen at module-load time.
	const rect = container.getBoundingClientRect();
	const vh = window.innerHeight || document.documentElement.clientHeight;
	const alreadyVisible = rect.top < vh && rect.bottom > 0;

	if (alreadyVisible) {
		render();
		return;
	}

	if ('IntersectionObserver' in window) {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					render();
					observer.unobserve(entry.target);
				}
			});
		}, { threshold: 0 });
		observer.observe(container);
	} else {
		// Old browser — just render after a tick.
		setTimeout(render, 0);
	}
}

/**
 * Internal render function — builds the Plotly 3D scene showing
 * original embeddings and their projections onto three different 2D planes.
 */
function _renderQKVSubspaceViz(containerId) {
	const container = document.getElementById(containerId);
	if (!container) return;
	container.innerHTML = '';

	// --- 1. Define sample 3D token embeddings ---
	const tokens = {
		'king':   [2.0,  1.5,  0.8],
		'queen':  [2.1,  1.6, -0.7],
		'man':    [0.5,  1.8,  1.0],
		'woman':  [0.6,  1.9, -0.5],
		'throne': [2.5,  0.3,  0.1],
		'rules':  [1.8,  0.8,  0.5],
	};

	const tokenNames = Object.keys(tokens);
	const tokenColors = [
		'#ef4444', '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'
	];

	// --- 2. Define three different 2×3 projection matrices (W^Q, W^K, W^V) ---
	// Each projects from 3D → 2D (simulating d_model=3, d_k=2)
	// We define them as two 3D basis vectors spanning the target plane.
	const projections = {
		Q: {
			label: 'W^Q plane',
			color: 'rgba(239,68,68,0.12)',
			borderColor: '#ef4444',
			// Plane spanned by these two orthonormal-ish basis vectors
			u: [0.8, 0.6, 0.0],
			v: [0.0, 0.0, 1.0]
		},
		K: {
			label: 'W^K plane',
			color: 'rgba(59,130,246,0.12)',
			borderColor: '#3b82f6',
			u: [0.57, -0.57, 0.57],
			v: [0.71,  0.71, 0.0]
		},
		V: {
			label: 'W^V plane',
			color: 'rgba(34,197,94,0.12)',
			borderColor: '#22c55e',
			u: [1.0, 0.0, 0.0],
			v: [0.0, 0.57, 0.82]
		}
	};

	// Normalize basis vectors
	function normalize(v) {
		const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
		return v.map(x => x / mag);
	}

	for (const key in projections) {
		projections[key].u = normalize(projections[key].u);
		projections[key].v = normalize(projections[key].v);
	}

	// Project a 3D point onto the plane spanned by u, v
	function projectOntoPlane(point, u, v) {
		const dotU = point[0]*u[0] + point[1]*u[1] + point[2]*u[2];
		const dotV = point[0]*v[0] + point[1]*v[1] + point[2]*v[2];
		return [
			dotU * u[0] + dotV * v[0],
			dotU * u[1] + dotV * v[1],
			dotU * u[2] + dotV * v[2]
		];
	}

	// --- 3. Build tab UI for Q / K / V ---
	const tabBar = document.createElement('div');
	tabBar.style.cssText = `display:flex; gap:8px; padding:10px 15px;
		background:${themeColor('#fff')}; border-bottom:1px solid ${themeColor('#e2e8f0')};`;

	const plotDiv = document.createElement('div');
	plotDiv.id = containerId + '-plot';
	plotDiv.style.cssText = `width:100%; height:480px; background:${themeColor('#fff')};`;

	const tabBtns = {};
	['Q', 'K', 'V'].forEach((key) => {
		const btn = document.createElement('button');
		btn.textContent = `W^${key} Projection`;
		btn.style.cssText = `padding:8px 20px; border-radius:8px; border:2px solid ${projections[key].borderColor};
	    background:${themeColor('#fff')};
	    color:${projections[key].borderColor};
	    font-weight:bold; cursor:pointer; font-size:0.9rem; transition:all 0.15s;`;
		btn.addEventListener('click', () => {
			Object.entries(tabBtns).forEach(([k, b]) => {
				const isActive = (k === key);
				b.style.background = isActive ? projections[k].borderColor : themeColor('#fff');
				b.style.color      = isActive ? themeColor('#fff')        : projections[k].borderColor;
			});
			renderProjection(key);
		});
		tabBar.appendChild(btn);
		tabBtns[key] = btn;
	});

	container.appendChild(tabBar);
	container.appendChild(plotDiv);

	// Mark Q as the default-active tab.
	tabBtns['Q'].style.background = projections['Q'].borderColor;
	tabBtns['Q'].style.color      = themeColor('#fff');

	function renderProjection(key) {
		const proj = projections[key];
		const traces = [];

		// --- Original 3D points (grey) ---
		traces.push({
			type: 'scatter3d',
			x: tokenNames.map(t => tokens[t][0]),
			y: tokenNames.map(t => tokens[t][1]),
			z: tokenNames.map(t => tokens[t][2]),
			mode: 'markers+text',
			text: tokenNames,
			textposition: 'top center',
			textfont: { size: 11, color: themeColor('#64748b') },
			marker: { size: 5, color: themeColor('#94a3b8'), opacity: 0.6 },
			name: 'Original (3D)',
			hovertemplate: '<b>%{text}</b><br>(%{x:.2f}, %{y:.2f}, %{z:.2f})<extra>Original</extra>'
		});

		// --- Projected points + drop lines ---
		tokenNames.forEach((token, i) => {
			const orig = tokens[token];
			const projected = projectOntoPlane(orig, proj.u, proj.v);

			// Drop line from original to projected
			traces.push({
				type: 'scatter3d',
				x: [orig[0], projected[0]],
				y: [orig[1], projected[1]],
				z: [orig[2], projected[2]],
				mode: 'lines',
				line: { color: tokenColors[i], width: 2, dash: 'dot' },
				showlegend: false,
				hoverinfo: 'skip'
			});

			// Projected point
			traces.push({
				type: 'scatter3d',
				x: [projected[0]],
				y: [projected[1]],
				z: [projected[2]],
				mode: 'markers+text',
				text: [token],
				textposition: 'bottom center',
				textfont: { size: 12, color: tokenColors[i], family: 'Inter, sans-serif' },
				marker: { size: 7, color: tokenColors[i], symbol: 'diamond',
					line: { width: 1, color: themeColor('#fff') } },
				name: `${token} (${key})`,
				hovertemplate: `<b>${token}</b> projected by W<sup>${key}</sup><br>(%{x:.2f}, %{y:.2f}, %{z:.2f})<extra></extra>`
			});
		});

		// --- Draw the plane as a mesh surface ---
		const planeSize = 3.5;
		const corners = [
			[ planeSize,  planeSize],
			[ planeSize, -planeSize],
			[-planeSize, -planeSize],
			[-planeSize,  planeSize]
		];
		const px = [], py = [], pz = [];
		corners.forEach(([a, b]) => {
			px.push(a * proj.u[0] + b * proj.v[0]);
			py.push(a * proj.u[1] + b * proj.v[1]);
			pz.push(a * proj.u[2] + b * proj.v[2]);
		});

		traces.push({
			type: 'mesh3d',
			x: px, y: py, z: pz,
			i: [0, 0], j: [1, 2], k: [2, 3],
			color: proj.borderColor,
			opacity: 0.1,
			name: proj.label,
			hoverinfo: 'name',
			flatshading: true
		});

		// --- Plane border outline ---
		traces.push({
			type: 'scatter3d',
			x: [...px, px[0]],
			y: [...py, py[0]],
			z: [...pz, pz[0]],
			mode: 'lines',
			line: { color: proj.borderColor, width: 3 },
			showlegend: false,
			hoverinfo: 'skip'
		});

		const layout = {
			title: {
				text: `<b>${proj.label}</b>: Projecting 3D embeddings onto a 2D subspace`,
				font: { size: 14, color: themeColor('#1e293b'), family: 'Inter, system-ui, sans-serif' }
			},
			scene: {
				xaxis: { title: 'Dim 0', range: [-4, 4],
				         gridcolor: themeColor('#e2e8f0'),
				         zerolinecolor: themeColor('#94a3b8'),
				         backgroundcolor: themeColor('#fff'),
				         tickfont: { color: themeColor('#64748b') } },
				yaxis: { title: 'Dim 1', range: [-4, 4],
				         gridcolor: themeColor('#e2e8f0'),
				         zerolinecolor: themeColor('#94a3b8'),
				         backgroundcolor: themeColor('#fff'),
				         tickfont: { color: themeColor('#64748b') } },
				zaxis: { title: 'Dim 2', range: [-4, 4],
				         gridcolor: themeColor('#e2e8f0'),
				         zerolinecolor: themeColor('#94a3b8'),
				         backgroundcolor: themeColor('#fff'),
				         tickfont: { color: themeColor('#64748b') } },
				camera: { eye: { x: 1.8, y: 1.4, z: 1.2 } },
				aspectmode: 'cube',
				bgcolor: themeColor('#fff')
			},
			paper_bgcolor: themeColor('#fff'),
			plot_bgcolor: themeColor('#fff'),
			margin: { l: 0, r: 0, b: 10, t: 45 },
			showlegend: true,
			legend: {
				orientation: 'h', x: 0.5, xanchor: 'center', y: -0.02,
				font: { size: 11, color: themeColor('#1e293b') },
				bgcolor: 'rgba(0,0,0,0)'
			},
			hoverlabel: { bgcolor: themeColor('#1e293b'), font: { color: '#fff' } }
		};

		Plotly.react(plotDiv.id, traces, layout, { responsive: true, displaylogo: false });
	}

	// Initial render with Q
	renderProjection('Q');
}

/* ═══════════════════════════════════════════════════════════════
   LONG DISTANCE DEPENDENCIES
   ═══════════════════════════════════════════════════════════════ */

// Minimal canvas text helper used by the LDD bar chart below.
function drawLabel(ctx, text, x, y, color, size, align, bold) {
	ctx.font = `${bold ? 'bold ' : ''}${size || 13}px Inter, system-ui, sans-serif`;
	ctx.fillStyle = color || themeColor('#1e293b');
	ctx.textAlign = align || 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(text, x, y);
}

const LDD = {
    subject: { word: 'cat', color: '#2563eb' },
    pronoun: { word: 'its', color: '#f59e0b' },
    distractors: ['that','the','dog','chased','across','the','yard',
                  'and','through','the','garden','gate','finally','climbed','the'],
    // Raw dot products q · k for the pronoun's query against each token.
    qk_subject: 3.2,
    qk_distractor: 0.2,
    qk_self: 0.5,
    // Head dimension. With h=8 heads and d_model=512, d_k = 64. The
    // paper's √d_k scaling keeps softmax inputs on a sane scale.
    d_k: 64,
    // RNN state-decay per step (multiplicative gate ≈ 0.82).
    rnn_decay: 0.82
};

function updateLDD() {
    const n = parseInt(document.getElementById('ldd-distance').value);
    document.getElementById('ldd-distance-val').innerText = n;

    // Build tokens
    const tokens = [{word:'The', type:'filler'}];
    tokens.push({word: LDD.subject.word, type:'subject'});
    for (let i = 0; i < n; i++) tokens.push({word: LDD.distractors[i % LDD.distractors.length], type:'distractor'});
    tokens.push({word: LDD.pronoun.word, type:'pronoun'});

    const subjectIdx = 1;
    const pronounIdx = tokens.length - 1;
    const distance = pronounIdx - subjectIdx;

    // ── Self-attention from the pronoun's perspective ──
    //   score_ij = q · k_j   (already scaled to a plausible 3.2/0.2/0.5 magnitude
    //   matching q,k entries ~ N(0,1) at d_k = 64)
    //   alpha_ij = softmax_j(score_ij / √d_k)
    const rawScores = tokens.map((tok, i) => {
        if (i === subjectIdx) return LDD.qk_subject;
        if (i === pronounIdx) return LDD.qk_self;
        // Tiny jitter so the distractor bars aren't perfectly equal.
        return LDD.qk_distractor + (Math.random() * 0.1 - 0.05);
    });
    const scaled = rawScores.map(s => s / Math.sqrt(LDD.d_k));
    const attn = softmax(scaled);

    // Sentence display
    const sentenceEl = document.getElementById('ldd-sentence');
    const subjBg = isDarkMode() ? '#1e3a8a' : '#dbeafe';
    const proBg  = isDarkMode() ? '#451a03' : '#fef3c7';
    sentenceEl.innerHTML = tokens.map(tok => {
        let s = 'padding:2px 4px; border-radius:3px; margin:0 1px;';
        if (tok.type === 'subject') s += `background:${subjBg}; color:${LDD.subject.color}; font-weight:bold;`;
        else if (tok.type === 'pronoun') s += `background:${proBg}; color:${LDD.pronoun.color}; font-weight:bold;`;
        else if (tok.type === 'distractor') s += `color:${themeColor('#94a3b8')};`;
        else s += `color:${themeColor('#64748b')};`;
        return `<span style="${s}">${tok.word}</span>`;
    }).join(' ') + `<br><span style="font-size:0.8rem; color:${themeColor('#64748b')}; font-style:normal;">` +
    `Distance: <b>${distance}</b> tokens between ` +
    `<span style="color:${LDD.subject.color}; font-weight:bold;">"${LDD.subject.word}"</span> and ` +
    `<span style="color:${LDD.pronoun.color}; font-weight:bold;">"${LDD.pronoun.word}"</span></span>`;

    // Canvas
    const canvas = document.getElementById('ldd-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        requestAnimationFrame(updateLDD);
        return;
    }
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = rect.width, H = rect.height;
    ctx.clearRect(0, 0, W, H);

    const padL = 50, padR = 20, padT = 30, padB = 50;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const numTokens = tokens.length;
    const gap = chartW / numTokens;
    const barW = Math.min(28, gap * 0.65);
    const maxVal = Math.max(...attn) * 1.2;
    const toY = v => padT + chartH * (1 - v / maxVal);
    const toBarX = i => padL + gap * i + gap / 2;

    // Grid
    ctx.strokeStyle = themeColor('#f1f5f9'); ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) {
        const gy = padT + (chartH / 4) * g;
        ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(W - padR, gy); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = themeColor('#94a3b8'); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + chartH); ctx.lineTo(W - padR, padT + chartH); ctx.stroke();

    // Y ticks + axis title
    ctx.font = '10px Inter, system-ui, sans-serif'; ctx.fillStyle = themeColor('#94a3b8'); ctx.textAlign = 'right';
    for (let g = 0; g <= 4; g++) {
        const val = (maxVal / 4) * (4 - g);
        ctx.fillText((val * 100).toFixed(0) + '%', padL - 6, padT + (chartH / 4) * g + 4);
    }
    // Y-axis title (rotated, on the left)
    ctx.save();
    ctx.translate(14, padT + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = themeColor('#475569');
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillText('Attention / Signal Strength (%)', 0, 0);
    ctx.restore();

    // X-axis title
    ctx.textAlign = 'center';
    ctx.fillStyle = themeColor('#475569');
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillText('Token Position', padL + chartW / 2, H - 6);

    // Bars
    tokens.forEach((tok, i) => {
        const x = toBarX(i);
        const barH = (attn[i] / maxVal) * chartH;
        const barY = padT + chartH - barH;
        let color = themeColor('#e2e8f0');
        if (tok.type === 'subject') color = LDD.subject.color;
        else if (tok.type === 'pronoun') color = LDD.pronoun.color;

        ctx.globalAlpha = tok.type === 'distractor' ? 0.4 : 0.85;
        ctx.fillStyle = color;
        ctx.fillRect(x - barW / 2, barY, barW, barH);
        ctx.globalAlpha = 1;

        // Labels
        ctx.save();
        ctx.translate(x, padT + chartH + 8);
        if (numTokens > 10) ctx.rotate(-Math.PI / 4);
        const lc = tok.type === 'subject' ? LDD.subject.color : tok.type === 'pronoun' ? LDD.pronoun.color : themeColor('#94a3b8');
        drawLabel(ctx, tok.word, 0, 0, lc, numTokens > 12 ? 9 : 10, numTokens > 10 ? 'right' : 'center', tok.type !== 'distractor');
        ctx.restore();

        if (attn[i] > 0.03) drawLabel(ctx, (attn[i]*100).toFixed(0)+'%', x, barY - 8, color, 10, 'center', true);
    });

    // RNN decay curve — thick, with markers at each token. This is the
    // signal an RNN would carry forward step-by-step.
    const rnnStart = attn[subjectIdx];
    const rnnPoints = [];
    for (let i = subjectIdx; i <= pronounIdx; i++) {
        const x = toBarX(i);
        const rnnVal = rnnStart * Math.pow(LDD.rnn_decay, i - subjectIdx);
        rnnPoints.push({ x, y: toY(rnnVal) });
    }
    // Draw as a smooth curve (quadratic through points) so it pops visually
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    rnnPoints.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else {
            const prev = rnnPoints[i - 1];
            const cx = (prev.x + p.x) / 2;
            ctx.bezierCurveTo(cx, prev.y, cx, p.y, p.x, p.y);
        }
    });
    ctx.stroke();
    // Markers along the RNN curve
    rnnPoints.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
    });

    // Transformer flat line — self-attention reaches every position in
    // one step, so signal strength does NOT decay with distance.
    const tY = toY(attn[subjectIdx]);
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(toBarX(subjectIdx), tY);
    ctx.lineTo(toBarX(pronounIdx), tY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Legend (top-right corner of the chart)
    const legX = W - padR - 175;
    const legY = padT + 8;
    ctx.fillStyle = isDarkMode() ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.92)';
    ctx.fillRect(legX, legY, 170, 46);
    ctx.strokeStyle = themeColor('#cbd5e1');
    ctx.lineWidth = 1;
    ctx.strokeRect(legX, legY, 170, 46);
    // Transformer swatch
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3; ctx.setLineDash([4, 4]);
    ctx.moveTo(legX + 8, legY + 14);
    ctx.lineTo(legX + 28, legY + 14);
    ctx.stroke(); ctx.setLineDash([]);
    drawLabel(ctx, 'Transformer (flat)', legX + 34, legY + 14, themeColor('#1e293b'), 10, 'left', true);
    // RNN swatch
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.moveTo(legX + 8, legY + 34);
    ctx.lineTo(legX + 28, legY + 34);
    ctx.stroke();
    drawLabel(ctx, 'RNN (×' + LDD.rnn_decay + '/step)', legX + 34, legY + 34, themeColor('#1e293b'), 10, 'left', true);

    // Math summary
    const rnnFinal = Math.pow(LDD.rnn_decay, distance);
    const ratio = (1 / rnnFinal);
    const trBg = isDarkMode() ? 'rgba(37, 99, 235, 0.10)' : '#eff6ff';
    const rnBg = isDarkMode() ? 'rgba(239, 68, 68, 0.10)'  : '#fef2f2';
    document.getElementById('ldd-math').innerHTML = `<table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
    <tr style="border-bottom:2px solid ${themeColor('#cbd5e1')}; color:${themeColor('#64748b')};">
        <th style="text-align:left; padding:3px 8px;">Model</th>
        <th style="text-align:left; padding:3px 8px;">Signal after ${distance} steps</th>
        <th style="text-align:right; padding:3px 8px;">Strength</th>
    </tr>
    <tr style="background:${trBg};">
        <td style="color:#2563eb; font-weight:bold; padding:3px 8px;">Transformer</td>
        <td style="padding:3px 8px; font-family:monospace;">softmax(q·k / √${LDD.d_k}) — distance-invariant</td>
        <td style="text-align:right; padding:3px 8px;"><b style="color:#2563eb;">${(attn[subjectIdx]*100).toFixed(1)}%</b></td>
    </tr>
    <tr style="background:${rnBg};">
        <td style="color:#ef4444; font-weight:bold; padding:3px 8px;">RNN</td>
        <td style="padding:3px 8px; font-family:monospace;">${LDD.rnn_decay}<sup>${distance}</sup> = ${rnnFinal.toFixed(4)}</td>
        <td style="text-align:right; padding:3px 8px;"><b style="color:#ef4444;">${(rnnFinal*100).toFixed(1)}%</b></td>
    </tr>
    <tr style="border-top:2px solid ${themeColor('#1e293b')};">
        <td colspan="2" style="text-align:right; padding:6px 8px; font-weight:bold;">Transformer advantage:</td>
        <td style="text-align:right; padding:6px 8px;"><b style="color:#059669; font-size:1.1rem;">${ratio.toFixed(1)}×</b></td>
    </tr></table>`;
}

// ─────────────────── INITIALIZATION ───────────────────

async function loadAttentionModule() {
	updateLoadingStatus("Loading section about activation functions...");
	SelfAttentionLab.init();
	initAttentionAnatomy();
	runUniverse();
	initQKVSubspaceViz();
	requestAnimationFrame(updateLDD);

	// Re-render the canvases / Plotly figures when the user flips
	// dark mode so themeColor() picks up the new palette.
	// AttentionAnatomy and the Q/K/V subspace viz each register their
	// OWN theme listener (in init()), so only the standalone pieces are
	// handled here — guarded on visibility so off-screen sections don't
	// do heavy re-renders on every toggle.
	const sectionVisible = (id) => {
		const el = document.getElementById(id);
		if (!el) return false;
		const r = el.getBoundingClientRect();
		return r.top < (window.innerHeight || 768) && r.bottom > 0;
	};
	if (window.__MN_DARK) {
		window.__MN_DARK.onChange(() => {
			if (sectionVisible('ldd-canvas')) {
				try { updateLDD(); } catch (e) { /* ignore */ }
			}
			if (sectionVisible('universe-input')) {
				try { runUniverse(); } catch (e) { /* ignore */ }
			}
		});
	}

	return Promise.resolve();
}
