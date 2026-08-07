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
const ATTN_2D = {
	q: [ 1.00, 0.40 ],
	_allKeys: [
		[ 0.90, 0.45 ],   // k₁: "cat" — close to q, should win attention
		[-0.50, 0.80 ],   // k₂: "dog" — somewhat orthogonal
		[-0.60, -0.70 ]   // k₃: "sat" — pointing opposite-ish
	],
	_allVals: [
		[ 0.80, 0.55 ],   // v₁
		[-0.30, 0.70 ],   // v₂
		[-0.70, -0.55 ]   // v₃
	],
	d_k: 2,
	numTokens: 2,

	setNumTokens: function(n) {
		this.numTokens = n;
		this.keys = this._allKeys.slice(0, n - 1);
		this.vals = this._allVals.slice(0, n - 1);
		this.sqrtDk = Math.sqrt(this.d_k);
		const dot = (a, b) => a[0]*b[0] + a[1]*b[1];
		this.scores = this.keys.map(k => dot(this.q, k));
		this.scaled = this.scores.map(s => s / this.sqrtDk);
		this.exps   = this.scaled.map(s => Math.exp(s));
		this.weights = softmax(this.scaled);
		this.output = [0, 0];
		this.vals.forEach((v, j) => {
			this.output[0] += this.weights[j] * v[0];
			this.output[1] += this.weights[j] * v[1];
		});
		this.weightedVals = this.vals.map((v, j) => [this.weights[j] * v[0], this.weights[j] * v[1]]);
	}
};
ATTN_2D.setNumTokens(2);

// Eight steps. `mode` decides what the 2D plot draws:
//   'keys'   → query + keys (steps 1-6)
//   'values' → query + values (step 7)
//   'output' → values + weighted values + output z with tip-to-tail (step 8)
// `computation` picks a template that shows the actual numerical math.
// `eqActive` lists the regions of the equation that should glow on this step.
const ATTN_STEPS = [
	{
		title: 'From embeddings to Q, K, V',
		computation: 'setup',
		intuition: 'setup',
		eqActive: [],
		desc: 'Each token starts as an <b>embedding vector</b> <b>x</b>. Three learned projections turn it into the three vectors we will use in attention: the query <b style="color:#ef4444">q</b> (asks "what am I looking for?"), the key <b style="color:#2563eb">k</b> (advertises "here is what I contain"), and the value <b style="color:#16a34a">v</b> (carries the actual content).',
		mode: 'keys'
	},
	{
		title: 'Element-wise product',
		computation: 'components',
		intuition: 'components',
		eqActive: ['dot'],
		desc: 'The dot product is built from component products: <b>q[1]·k₁[1] + q[2]·k₁[2]</b>. Each product captures alignment along one axis. k₂ and k₃ are dimmed to focus on what is being computed for k₁.',
		mode: 'keys', highlightKey: 0
	},
	{
		title: 'Sum: the dot product q · kⱼ',
		computation: 'dot',
		intuition: 'dot',
		eqActive: ['dot'],
		desc: 'Add the components for each key: <b>q·k₁</b> = 0.900 + 0.180 = <b>1.080</b>. Positive score = same direction; negative = opposite. k₁ wins because it points closest to q.',
		mode: 'keys'
	},
	{
		title: 'Scale by 1/√d_k',
		computation: 'scaled',
		intuition: 'scaled',
		eqActive: ['sqrt'],
		desc: 'Divide each score by √2 ≈ 1.414. This keeps the variance of scores near <b>1</b> regardless of d<sub>k</sub> — without it, softmax in a real d<sub>k</sub>=64 Transformer would saturate to a hard one-hot.',
		mode: 'keys'
	},
	{
		title: 'Exponentiate: eˢᶜᵒʳᵉ',
		computation: 'exps',
		intuition: 'exps',
		eqActive: ['exp'],
		desc: 'Apply exp() to each scaled score. Differences <b>amplify</b>: the largest score (0.764) becomes 2.146, but a small score (0.127) only grows to 0.881. The biggest input starts to dominate.',
		mode: 'keys'
	},
	{
		title: 'Normalize (softmax)',
		computation: 'weights',
		intuition: 'weights',
		eqActive: ['denom'],
		desc: 'Divide each exp(score) by the <b>sum</b> of all three. The numbers now sum to exactly 1 — a probability distribution. These are the <b>attention weights</b> α<sub>ij</sub>: α₁=60.2%, α₂=24.7%, α₃=15.1%.',
		mode: 'keys'
	},
	{
		title: 'Switch to value vectors',
		computation: 'values',
		intuition: 'values',
		eqActive: ['value'],
		desc: 'Drop the keys. Bring in the <b>Value</b> vectors <b style="color:#16a34a">v₁</b>, <b style="color:#15803d">v₂</b>, <b style="color:#166534">v₃</b> (green) — they live in a separate subspace and carry the actual semantic content. The attention weights carry over unchanged.',
		mode: 'values'
	},
	{
		title: 'Weighted sum → output z',
		computation: 'output',
		intuition: 'output',
		eqActive: ['sum', 'alpha', 'value'],
		desc: 'Compute <b>z = α₁v₁ + α₂v₂ + α₃v₃</b>. Each value is scaled by its weight (the dark-green dashed arrows), then tip-to-tail added together (gray dashed chain). The final <b style="color:#f59e0b">z</b> (orange) lives <b>inside the convex hull</b> of v₁, v₂, v₃ — attention can only interpolate.',
		mode: 'output'
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
	setup: () => {
		const q = ATTN_2D.q;
		const rows = ATTN_2D.keys.map((k, j) =>
			`<div class="comp-eq" data-tip="k" data-idx="${j}">$$ \\underbrace{\\mathbf{k}_{${j+1}} = (${k[0].toFixed(2)},\\; ${k[1].toFixed(2)})}_{\\text{key “${ATTN_TOKENS[j+1].name}”}} $$</div>`).join('');
		return `
		<div class="comp-header">▶ The players — the inputs to the equation</div>
		<div class="comp-body">
			<div class="comp-eq" data-tip="q" data-idx="0">$$ \\underbrace{\\mathbf{q} = (${q[0].toFixed(2)},\\; ${q[1].toFixed(2)})}_{\\text{query “it”}} $$</div>
			${rows}
			<div class="comp-note">No computation yet — these are the vectors the equation will operate on. Hover any of them.</div>
		</div>
	`;
	},
	components: () => {
		const q = ATTN_2D.q, k = ATTN_2D.keys[0];
		return `
		<div class="comp-header">▶ Currently computing: $q[d] \\cdot k_1[d]$ — element-wise product</div>
		<div class="comp-body">
			<div class="comp-eq" data-tip="comprect" data-idx="0">
				$$ \\underbrace{(${q[0].toFixed(2)})\\cdot(${k[0].toFixed(2)})}_{q[1]\\cdot k_1[1]\\,=\\,${(q[0]*k[0]).toFixed(3)}} \\qquad
				\\underbrace{(${q[1].toFixed(2)})\\cdot(${k[1].toFixed(2)})}_{q[2]\\cdot k_1[2]\\,=\\,${(q[1]*k[1]).toFixed(3)}} $$
			</div>
			<div class="comp-note">Two rectangles, one per dimension — the area of each is one product. Next step adds them together.</div>
		</div>
	`;
	},
	dot: () => {
		const q = ATTN_2D.q;
		const rows = ATTN_2D.keys.map((k, j) => {
			const p1 = (q[0]*k[0]).toFixed(3), p2 = (q[1]*k[1]).toFixed(3);
			return `<div class="comp-eq" data-tip="bar-score" data-idx="${j}">$$
				q\\cdot k_{${j+1}} = \\underbrace{(${q[0].toFixed(2)})(${k[0].toFixed(2)}) + (${q[1].toFixed(2)})(${k[1].toFixed(2)})}_{${p1} + ${p2}} = \\underbrace{${ATTN_2D.scores[j].toFixed(3)}}_{\\text{score}}
				$$</div>`;
		}).join('');
		return `
		<div class="comp-header">▶ Currently computing: $q \\cdot k_j$ — add the component products</div>
		<div class="comp-body">
			${rows}
			<div class="comp-note">Positive score = same direction as $\\mathbf{q}$; negative = opposite. This is the raw attention input.</div>
		</div>`;
	},
	scaled: () => {
		const rows = ATTN_2D.scores.map((s, j) => `
			<div class="comp-eq" data-tip="bar-scaled" data-idx="${j}">$$
				s_{${j+1}} = \\frac{q\\cdot k_{${j+1}}}{\\sqrt{d_k}} = \\frac{${s.toFixed(3)}}{\\underbrace{1.414}_{\\sqrt{2}}} = \\underbrace{${ATTN_2D.scaled[j].toFixed(3)}}_{\\text{scaled score}}
				$$</div>`).join('');
		return `
		<div class="comp-header">▶ Currently computing: $\\dfrac{q \\cdot k_j}{\\sqrt{d_k}}$ — variance control</div>
		<div class="comp-body">
			${rows}
			<div class="comp-note">Dividing by $\\sqrt{2} \\approx 1.414$ keeps every score near magnitude $1$ — the same trick a real $d_k = 64$ model uses.</div>
		</div>`;
	},
	exps: () => {
		const rows = ATTN_2D.scaled.map((sc, j) => `
			<div class="comp-eq" data-tip="bar-exp" data-idx="${j}">$$
				e^{s_{${j+1}}} = e^{${sc.toFixed(3)}} = \\underbrace{${ATTN_2D.exps[j].toFixed(3)}}_{\\text{positive number}}
				$$</div>`).join('');
		return `
		<div class="comp-header">▶ Currently computing: $e^{s_j}$ — amplify differences</div>
		<div class="comp-body">
			${rows}
			<div class="comp-note">Positive scores grow, negative scores shrink toward $0$. The biggest input now towers over the rest.</div>
		</div>`;
	},
	weights: () => {
		const ex  = ATTN_2D.exps;
		const sum = ex.reduce((a, b) => a + b, 0);
		const sumRow = `<div class="comp-eq" data-tip="eq-sum">$$ \\underbrace{${ex.map((e) => e.toFixed(3)).join(' + ')}}_{\\text{e}^{s_j}} = \\underbrace{${sum.toFixed(3)}}_{\\text{sum}} $$</div>`;
		const rows = ex.map((e, j) => `
			<div class="comp-eq" data-tip="wbar" data-idx="${j}">$$
				\\alpha_{${j+1}} = \\frac{${e.toFixed(3)}}{${sum.toFixed(3)}} = \\underbrace{${ATTN_2D.weights[j].toFixed(3)}}_{\\text{weight}} = ${(ATTN_2D.weights[j]*100).toFixed(1)}\\,\\%
				$$</div>`).join('');
		return `
		<div class="comp-header">▶ Currently computing: softmax — divide each $e^{s_j}$ by the sum</div>
		<div class="comp-body">
			${sumRow}
			${rows}
			<div class="comp-note">The weights now sum to $100\\%$ — a finite budget of attention, split by relevance.</div>
		</div>`;
	},
	values: () => {
		const rows = ATTN_2D.vals.map((v, j) => `
			<div class="comp-eq" data-tip="v" data-idx="${j}">$$
				\\underbrace{\\mathbf{v}_{${j+1}} = (${v[0].toFixed(2)},\\; ${v[1].toFixed(2)})}_{\\text{value “${ATTN_TOKENS[j+1].name}”}} \\qquad \\underbrace{\\alpha_{${j+1}} = ${(ATTN_2D.weights[j]*100).toFixed(1)}\\,\\%}_{\\text{weight carries over}}
				$$</div>`).join('');
		return `
		<div class="comp-header">▶ Switching from keys to value vectors</div>
		<div class="comp-body">
			${rows}
			<div class="comp-note">Keys said <em>what</em> to attend to; values carry the actual content. The attention weights ride along unchanged.</div>
		</div>`;
	},
	output: () => {
		const rows = ATTN_2D.vals.map((v, j) => {
			const wv = ATTN_2D.weightedVals[j];
			return `<div class="comp-eq" data-tip="weightedV" data-idx="${j}">$$
				\\alpha_{${j+1}}\\mathbf{v}_{${j+1}} = (${(ATTN_2D.weights[j]*100).toFixed(1)}\\%)\\times (${v[0].toFixed(2)},\\; ${v[1].toFixed(2)}) = \\underbrace{(${wv[0].toFixed(3)},\\; ${wv[1].toFixed(3)})}_{\\text{weighted value}}
				$$</div>`;
		}).join('');
		const z = ATTN_2D.output;
		const sumParts = ATTN_2D.weightedVals.map((wv) => `(${wv[0].toFixed(3)},\\; ${wv[1].toFixed(3)})`).join(' + ');
		return `
		<div class="comp-header">▶ Currently computing: $\\mathbf{z} = \\sum_j \\alpha_j \\mathbf{v}_j$ — the weighted sum</div>
		<div class="comp-body">
			${rows}
			<div class="comp-eq" data-tip="eq-z">$$
				\\mathbf{z} = \\underbrace{${sumParts}}_{\\text{component-wise sum}} = \\underbrace{(${z[0].toFixed(3)},\\; ${z[1].toFixed(3)})}_{\\mathbf{z}}
				$$</div>
			<div class="comp-note">$\\mathbf{z}$ is a convex combination — it lies <b>inside the span</b> of the $\\mathbf{v}_j$ (a point in 2 tokens, a segment in 3, a triangle in 4).</div>
		</div>`;
	}
};

// Per-step "Geometric intuition" panels. Each contains:
//   - A Temml-rendered formula (just set as innerHTML, then call render_temml())
//   - "What this does" — a plain-language explanation of the operation alone
//   - "Big picture" — how it serves the overall attention computation
const ATTN_INTUITIONS = {
	setup: () => `
		<div class="intuition-header">💡 Where do Q, K, V come from?</div>
		<div class="intuition-math">$$q_i = x_i W^Q, \\quad k_j = x_j W^K, \\quad v_j = x_j W^V$$</div>
		<div class="intuition-section">
			<strong>What this does:</strong> each token's <b>embedding</b> <i>x</i> is multiplied by three <b>learned matrices</b> to produce the query, key, and value.
		</div>
		<div class="intuition-section intuition-why">
			<strong>Big picture:</strong> Q, K, V are three different "views" of the same token — same input, different roles. This is the first place the model <i>learns</i> anything.
		</div>
	`,
	components: () => `
		<div class="intuition-header">💡 Geometric intuition — Element-wise product</div>
		<div class="intuition-math">$$q[d] \\cdot k_1[d] \\quad d \\in \\{1, 2\\}$$</div>
		<div class="intuition-section">
			<strong>What this does:</strong> per-axis product. Same sign = positive (agree); opposite sign = negative (disagree).
		</div>
		<div class="intuition-section intuition-why">
			<strong>Big picture:</strong> the atoms of the dot product — sum them next.
		</div>
	`,
	dot: () => `
		<div class="intuition-header">💡 Geometric intuition — The dot product</div>
		<div class="intuition-math">$$q \\cdot k_j = \\lVert q \\rVert \\cdot \\lVert k_j \\rVert \\cdot \\cos\\theta$$</div>
		<div class="intuition-section">
			<strong>What this does:</strong> add the components → one scalar per key. Positive = same direction; negative = opposite.
		</div>
		<div class="intuition-section intuition-why">
			<strong>Big picture:</strong> the projection of <i>q</i> onto <i>k</i> — how much of <i>q</i> fits inside <i>k</i>.
		</div>
	`,
	scaled: () => `
		<div class="intuition-header">💡 Geometric intuition — Scale by √d_k</div>
		<div class="intuition-math">$$\\frac{q \\cdot k_j}{\\sqrt{d_k}}$$</div>
		<div class="intuition-section">
			<strong>What this does:</strong> divide each score by √d_k.
		</div>
		<div class="intuition-section intuition-why">
			<strong>Big picture:</strong> keeps variance at ~1 so softmax behaves at any dimension.
		</div>
	`,
	exps: () => `
		<div class="intuition-header">💡 Geometric intuition — Exponentiate</div>
		<div class="intuition-math">$$e^{\\text{score}_j}$$</div>
		<div class="intuition-section">
			<strong>What this does:</strong> apply exp() — positive scores grow, negative scores shrink.
		</div>
		<div class="intuition-section intuition-why">
			<strong>Big picture:</strong> makes softmax a <i>soft argmax</i> — biggest score wins exponentially.
		</div>
	`,
	weights: () => `
		<div class="intuition-header">💡 Geometric intuition — Normalize (softmax)</div>
		<div class="intuition-math">$$\\alpha_{ij} = \\frac{e^{\\text{score}_j}}{\\sum_n e^{\\text{score}_n}}$$</div>
		<div class="intuition-section">
			<strong>What this does:</strong> divide each exp(score) by the sum.
		</div>
		<div class="intuition-section intuition-why">
			<strong>Big picture:</strong> the weights sum to 100% — a finite resource of attention.
		</div>
	`,
	values: () => `
		<div class="intuition-header">💡 Geometric intuition — Switch to values</div>
		<div class="intuition-math">$$v_j \\in \\mathbb{R}^{d_v}, \\quad \\alpha_{ij}$$</div>
		<div class="intuition-section">
			<strong>What this does:</strong> drop the keys, bring in vⱼ — the actual content to blend.
		</div>
		<div class="intuition-section intuition-why">
			<strong>Big picture:</strong> keys = WHAT to attend to, values = WHAT to retrieve.
		</div>
	`,
	output: () => `
		<div class="intuition-header">💡 Geometric intuition — Weighted sum</div>
		<div class="intuition-math">$$\\mathbf{z} = \\sum_j \\alpha_j \\mathbf{v}_j$$</div>
		<div class="intuition-section">
			<strong>What this does:</strong> multiply each value by its weight, then add.
		</div>
		<div class="intuition-section intuition-why">
			<strong>Big picture:</strong> z stays inside the span of the values — attention can only blend what is already there.
		</div>
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

		// Pre-render the vector formula LaTeX to MathML via Temml, once.
		// The hover tooltip then just swaps innerHTML — instant, no
		// re-render cost per hover.
		this._renderFormulas();

		// Draw the static background (grid + axes) ONCE.
		this._initSVG();

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
		const fmtVec = (v) => `[${fmt(v[0])},\\; ${fmt(v[1])}]`;
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

				let intuition;
				if (cosT > 0.85) {
					intuition = `Almost <b>exactly parallel</b> to the query — “${t}” is basically what “it” is looking for, so the score $q \\cdot k$ is large and positive and it <b>wins nearly all the attention</b>.`;
				} else if (cosT > 0.3) {
					intuition = `Points <b>roughly the same way</b> as the query — “${t}” partially matches the search and earns a positive score.`;
				} else if (cosT > -0.3) {
					intuition = `Roughly at <b>right angles</b> to the query — “${t}” shares almost nothing with the search, so $q \\cdot k \\approx 0$ and it gets <b>little attention</b>.`;
				} else {
					intuition = `Points <b>the opposite way</b> from the query — “${t}” contradicts the search, so the score is strongly negative and it gets <b>almost no attention</b>.`;
				}

				return {
					name: `angle between q (“it”) and k${idx+1} (“${t}”)`,
					intuition,
					concreteLatex: `\\underbrace{\\cos\\theta = ${cosT.toFixed(3)}}_{\\theta \\approx ${deg}^\\circ}`,
					formulaLatex: '\\cos\\theta = \\dfrac{q \\cdot k_j}{\\lVert q \\rVert \\, \\lVert k_j \\rVert}',
					unicode: `cos θ = q·k / (‖q‖·‖k‖)  →  θ ≈ ${deg}°`,
					desc: `The angle is just a geometric picture of the attention score: $q \\cdot k_j = \\lVert q \\rVert \\lVert k_j \\rVert \\cos\\theta$. Small angle $\\to$ large positive score, right angle $\\to$ zero, obtuse $\\to$ negative.`
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
				const k = ATTN_2D.keys[0];
				const d = idx + 1;                       // 1-based dimension
				const a = q[d - 1], b = k[d - 1];
				return {
					name: `q[${d}] · k₁[${d}]  (dimension ${d})`,
					intuition: `The <b>area of this rectangle</b> is one element-wise product: ${fmt(a)} × ${fmt(b)}. Same sign → positive (they agree on this axis).`,
					concreteLatex: `(${fmt(a)})(${fmt(b)}) = ${(a * b).toFixed(3)}`,
					formulaLatex: VF.comprect.formula,
					unicode: `q[${d}]·k₁[${d}] = ${(a * b).toFixed(3)}`,
					desc: 'The dot product is a sum of these per-dimension products: $q \\cdot k_1 = q[1]\\,k_1[1] + q[2]\\,k_1[2]$.'
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
		if (numEl)   numEl.textContent   = `Step ${this.step + 1}`;
		if (titleEl) titleEl.textContent = `— ${data.title}`;

		// Update each panel
		this.renderEquation(data);
		this.renderComputation(data);
		this.renderIntuition(data);
		this.render2D(data);

		// Temml is loaded by load_base_js(); it scans the document for
		// $...$ / $$...$$ blocks and replaces them with MathML.
		if (typeof render_temml === 'function') {
			try { render_temml(); } catch (e) { /* ignore */ }
		}

		// Fade back in on the next frame so the transition is visible.
		requestAnimationFrame(() => {
			fadeTargets.forEach(el => { el.style.opacity = ''; });
		});

		document.getElementById('attn-anatomy-prev').disabled = (this.step === 0);
		document.getElementById('attn-anatomy-next').disabled = (this.step === ATTN_STEPS.length - 1);
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
		if (fn) el.innerHTML = fn();
		else el.innerHTML = '';
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
		yl.setAttribute('x', 0.06); yl.setAttribute('y', -1.42);
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
			const labelA = (Math.abs(d) < 0.21) ? aq - 0.14 : aq + d / 2;
			const lx = (r + 0.17) * Math.cos(labelA);
			const ly = -(r + 0.17) * Math.sin(labelA);
			const mkLabel = (halo) => {
				const t = document.createElementNS(NS, 'text');
				t.setAttribute('x', lx); t.setAttribute('y', ly);
				t.setAttribute('text-anchor', 'middle');
				t.setAttribute('dominant-baseline', 'middle');
				if (halo) {
					t.setAttribute('fill', '#fff');
					t.setAttribute('stroke', '#fff');
					t.setAttribute('stroke-width', '0.014');
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
	_addSVGArrow: function(parent, labelsParent, start, end, color, label, formula, idx, dashed, dim, lpos) {
		const NS = this._SVG_NS;
		const opacity = dim ? 0.35 : 1.0;

		// Flip y for SVG (SVG y goes down, our data y goes up)
		const sx = start[0], sy = -start[1];
		const ex = end[0],   ey = -end[1];

		// Invisible fat hit-area for forgiving hover
		const hit = document.createElementNS(NS, 'line');
		hit.setAttribute('x1', sx); hit.setAttribute('y1', sy);
		hit.setAttribute('x2', ex); hit.setAttribute('y2', ey);
		hit.setAttribute('stroke', 'transparent');
		hit.setAttribute('stroke-width', '0.18');
		hit.classList.add('attn-arrow-hit');
		parent.appendChild(hit);

		// Visible shaft
		const line = document.createElementNS(NS, 'line');
		line.setAttribute('x1', sx); line.setAttribute('y1', sy);
		line.setAttribute('x2', ex); line.setAttribute('y2', ey);
		line.setAttribute('stroke', color);
		line.setAttribute('stroke-width', '0.028');
		line.setAttribute('opacity', opacity);
		line.style.pointerEvents = 'none';
		if (dashed) line.setAttribute('stroke-dasharray', '0.06 0.05');
		parent.appendChild(line);

		// Arrowhead (triangle pointing along the vector)
		const dx = ex - sx, dy = ey - sy;
		const len = Math.sqrt(dx * dx + dy * dy);
		if (len > 0.01) {
			const ux = dx / len, uy = dy / len;
			const s = 0.11;                     // arrowhead size in data units
			const c = Math.cos(Math.PI / 6), si = Math.sin(Math.PI / 6);
			// Rotate (ux,uy) by ±30°
			const ax1 = ex - s * (ux * c - uy * si);
			const ay1 = ey - s * (ux * si + uy * c);
			const ax2 = ex - s * (ux * c + uy * si);
			const ay2 = ey - s * (-ux * si + uy * c);
			const head = document.createElementNS(NS, 'polygon');
			head.setAttribute('points', `${ex},${ey} ${ax1},${ay1} ${ax2},${ay2}`);
			head.setAttribute('fill', color);
			head.setAttribute('opacity', opacity);
			head.style.pointerEvents = 'none';
			parent.appendChild(head);
		}

		// Label (with a THIN white halo for readability over the grid —
		// a wide stroke around every glyph looks like a messy outline)
		if (label) {
			const lx = ex + (lpos ? lpos[0] : 0.14);
			const ly = ey + (lpos ? lpos[1] : -0.04);
			const halo = document.createElementNS(NS, 'text');
			halo.setAttribute('x', lx); halo.setAttribute('y', ly);
			halo.setAttribute('text-anchor', 'start');
			halo.setAttribute('dominant-baseline', 'middle');
			halo.setAttribute('fill', '#fff'); halo.setAttribute('stroke', '#fff');
			halo.setAttribute('stroke-width', '0.012'); halo.setAttribute('paint-order', 'stroke');
			halo.setAttribute('font-size', '0.1');
			halo.setAttribute('font-family', 'Inter, sans-serif');
			halo.textContent = label;
			halo.style.pointerEvents = 'none';
			labelsParent.appendChild(halo);
			const txt = document.createElementNS(NS, 'text');
			txt.setAttribute('x', lx); txt.setAttribute('y', ly);
			txt.setAttribute('text-anchor', 'start');
			txt.setAttribute('dominant-baseline', 'middle');
			txt.setAttribute('fill', color);
			txt.setAttribute('font-size', '0.1');
			txt.setAttribute('opacity', opacity);
			txt.setAttribute('font-family', 'Inter, sans-serif');
			txt.textContent = label;
			txt.style.pointerEvents = 'none';
			labelsParent.appendChild(txt);
		}

		// Mouse events fire DIRECTLY on this element. No Plotly, no
		// overlay, no event-delegation hacks — just plain DOM events.
		if (formula) {
			hit.addEventListener('mouseenter', (e) => this._showTooltip(formula, idx, e.clientX, e.clientY));
			hit.addEventListener('mousemove',  (e) => this._showTooltip(formula, idx, e.clientX, e.clientY));
			hit.addEventListener('mouseleave', () => this._hideTooltip());
		}
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

		// Position near cursor with edge-flipping
		const pad = 16;
		let x = clientX + pad, y = clientY + pad;
		const r = tip.getBoundingClientRect();
		if (x + r.width  > window.innerWidth)  x = clientX - r.width  - pad;
		if (y + r.height > window.innerHeight) y = clientY - r.height - pad;
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
			halo.setAttribute('stroke-width', '0.012'); halo.setAttribute('paint-order', 'stroke');
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
			const off = 0.14;
			const sx = 0.5 * k[0] - u[1] * off;
			const sy = 0.5 * k[1] + u[0] * off;
			mk(sx, -sy, `‖k${j+1}‖=${n.toFixed(2)}`, 'middle');
		});
	},

	// Step "components": q[d]·k[d] as rectangle AREAS — one rectangle
	// per dimension (area = product), plus dashed drop-lines from the
	// highlighted key tip and the query tip down to each axis.
	_drawComponents2D: function(constructionG, labelsG, hi) {
		if (hi === undefined || !ATTN_2D.keys[hi]) return;
		const NS = this._SVG_NS;
		const q = ATTN_2D.q;
		const k = ATTN_2D.keys[hi];
		const color = ATTN_TOKENS[hi + 1].color;
		const px = (q[0] * k[0]).toFixed(3);
		const py = (q[1] * k[1]).toFixed(3);

		// data coords, y up → SVG y is negated
		const addRect = (x0, y0, x1, y1, label, dim) => {
			const rect = document.createElementNS(NS, 'rect');
			rect.setAttribute('x',  Math.min(x0, x1));
			rect.setAttribute('y',  -Math.max(y0, y1));
			rect.setAttribute('width',  Math.abs(x1 - x0));
			rect.setAttribute('height', Math.abs(y1 - y0));
			rect.setAttribute('fill', color);
			rect.setAttribute('fill-opacity', '0.10');
			rect.setAttribute('stroke', color);
			rect.setAttribute('stroke-opacity', '0.45');
			rect.setAttribute('stroke-width', '0.008');
			rect.setAttribute('stroke-dasharray', '0.03 0.03');
			rect.style.pointerEvents = 'all';
			rect.style.cursor = 'help';
			constructionG.appendChild(rect);
			rect.addEventListener('mouseenter', (e) => this._showTooltip('comprect', dim, e.clientX, e.clientY));
			rect.addEventListener('mousemove',  (e) => this._showTooltip('comprect', dim, e.clientX, e.clientY));
			rect.addEventListener('mouseleave', () => this._hideTooltip());
			if (label) {
				const t = document.createElementNS(NS, 'text');
				t.setAttribute('x', Math.min(x0, x1) + 0.05);
				// Caption ABOVE the rect (not inside): the rectangles sit
				// right where the angle arcs + their θ labels live, so an
				// in-rect label would collide with them.
				t.setAttribute('y', -Math.max(y0, y1) - 0.055);
				t.setAttribute('fill', color);
				t.setAttribute('font-size', '0.085');
				t.setAttribute('font-family', 'Inter, sans-serif');
				t.textContent = label;
				t.style.pointerEvents = 'none';
				labelsG.appendChild(t);
			}
		};

		// Dim-1 product: width q[1], height k[1]  →  area = q[1]·k[1]
		addRect(0, 0, q[0], k[0], `q₁·k₁ = ${px}`, 0);
		// Dim-2 product: width q[2], height k[2]  →  area = q[2]·k[2]
		addRect(0, 0, q[1], k[1], `q₂·k₂ = ${py}`, 1);

		// Drop-lines from the highlighted key tip and the query tip to
		// each axis, so you can read off the components being multiplied.
		const drop = (tip, vertical) => {
			const line = document.createElementNS(NS, 'line');
			if (vertical) {
				line.setAttribute('x1', tip[0]); line.setAttribute('y1', 0);
				line.setAttribute('x2', tip[0]); line.setAttribute('y2', -tip[1]);
			} else {
				line.setAttribute('x1', 0);        line.setAttribute('y1', -tip[1]);
				line.setAttribute('x2', tip[0]);   line.setAttribute('y2', -tip[1]);
			}
			line.setAttribute('stroke', color);
			line.setAttribute('stroke-opacity', '0.55');
			line.setAttribute('stroke-width', '0.008');
			line.setAttribute('stroke-dasharray', '0.025 0.025');
			line.style.pointerEvents = 'none';
			constructionG.appendChild(line);
		};
		drop(k, true);  drop(k, false);
		drop(q, true);  drop(q, false);
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
			cap.setAttribute('y', baseY - maxH - 0.10);
			cap.setAttribute('text-anchor', 'middle');
			cap.setAttribute('fill', themeColor('#334155'));
			cap.setAttribute('font-size', '0.065');
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
		const stripY = -1.43, stripH = 0.07;
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

		// "exp" tag on the strip + the ÷ Σ divider.
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
		div.setAttribute('x', 0);
		div.setAttribute('y', -1.30);
		div.setAttribute('text-anchor', 'middle');
		div.setAttribute('fill', themeColor('#64748b'));
		div.setAttribute('font-size', '0.07');
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
			t.setAttribute('y', baseY + h + 0.10);
			t.setAttribute('text-anchor', 'middle');
			t.setAttribute('fill', ATTN_TOKENS[j + 1].color);
			t.setAttribute('font-size', '0.085');
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

		const mode = data.mode;
		const comp = data.computation;

		if (mode === 'keys' || mode === 'values') {
			this._addSVGArrow(arrowsG, labelsG, [0, 0], ATTN_2D.q, '#ef4444', 'q', 'q', 0, false, false);
		}

		if (mode === 'keys') {
			ATTN_2D.keys.forEach((k, j) => {
				const isHi = (data.highlightKey === j);
				const dim  = (data.highlightKey !== undefined && !isHi);
				const color = isHi ? '#1e3a8a' : ATTN_TOKENS[j + 1].color;

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

				this._addSVGArrow(arrowsG, labelsG, [0, 0], k, color, `k${j+1}`, 'k', j, false, dim, lpos);
				if (anglesG) this._addAngleArc(anglesG, labelsG, ATTN_2D.q, k, color, j, dim);
			});

			// The lengths that feed cos θ = q·k/(‖q‖‖k‖), as muted
			// sub-labels — so the score's geometric ingredients are
			// visible in the scene, not only in a tooltip.
			this._addMagnitudeLabels2D(labelsG, data);

			// Per-step overlays: show the vectors being worked on —
			// product rectangles, projections, score bars, weight bar.
			// Each later step shows the previous step's bars as a faint
			// "ghost" so the chain score → scaled → exp is visible.
			const tokenColors = ATTN_TOKENS.slice(1).map((t) => t.color);
			if (comp === 'components') {
				this._drawComponents2D(constructionG, labelsG, data.highlightKey);
			} else if (comp === 'dot') {
				this._drawProjections2D(constructionG);
				this._drawScoreBlocks2D(constructionG, labelsG);
			} else if (comp === 'scaled') {
				this._drawProjections2D(constructionG);
				this._drawScaledBars2D(constructionG, labelsG);
			} else if (comp === 'exps') {
				this._drawProjections2D(constructionG);
				this._drawExpBars2D(constructionG, labelsG);
			} else if (comp === 'weights') {
				this._drawProjections2D(constructionG);
				this._drawWeightBar2D(constructionG, labelsG);
			}
		} else if (mode === 'values' || mode === 'output') {
			const valColors = ['#16a34a', '#15803d', '#166534'];
			ATTN_2D.vals.forEach((v, j) => {
				const dim = (mode === 'output');
				// When a value coincides with z (2-token case) push its
				// label up so it doesn't collide with "z = output". In the
				// output step the values are dimmed context anyway, so keep
				// their labels clear of the bright z label / weighted-v
				// cluster by hugging the value tip instead of floating.
				const sameAsZ = (mode === 'output' &&
					Math.hypot(v[0] - ATTN_2D.output[0], v[1] - ATTN_2D.output[1]) < 0.05);
				this._addSVGArrow(arrowsG, labelsG, [0, 0], v, valColors[j], `v${j+1}`, 'v', j, false, dim,
					sameAsZ ? [0.14, -0.20] : (mode === 'output' ? [0.14, 0.02] : undefined));
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

				this._addSVGArrow(arrowsG, labelsG, [0, 0], ATTN_2D.output, '#f59e0b', 'z = output', 'z', 0, false, false);
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
