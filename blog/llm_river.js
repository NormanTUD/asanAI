
// ─── Data Collection ────────────────────────────────────────

/**
 * At each processing stage, projects the hidden state of the
 * chosen token position onto the vocabulary to obtain a
 * softmax probability distribution.
 *
 * @returns {{ vocab: string[], stages: { name: string, probs: number[] }[] } | null}
 */
function _themeriver_collect_probs(tokenIdx, d_model) {
	const collector = window.tlab_trajectory_collector;
	if (!collector || !collector.steps) return null;

	const sortedKeys = Object.keys(collector.steps).sort();
	if (sortedKeys.length < 2) return null;

	const vocab = Object.keys(window.persistentEmbeddingSpace || {});
	if (vocab.length === 0) return null;

	const embMatrix = vocab.map(word =>
		window.persistentEmbeddingSpace[word] || new Array(d_model).fill(0)
	);

	const stages = [];

	sortedKeys.forEach(key => {
		const step = collector.steps[key];
		if (!step.data || !step.data[tokenIdx]) return;

		const h = step.data[tokenIdx];

		// logits = h · E^T  (dot product with every vocab embedding)
		const logits = embMatrix.map(embRow => {
			let sum = 0;
			for (let d = 0; d < h.length; d++) sum += h[d] * (embRow[d] || 0);
			return sum;
		});

		stages.push({ name: step.name, probs: softmax(logits) });
	});

	return stages.length >= 2 ? { vocab, stages } : null;
}

// ─── Rendering ──────────────────────────────────────────────

/**
 * Core ECharts rendering logic.
 */
function _execute_themeriver_render(d_model) {
	const containerId = 'transformer-themeriver-plot';
	const container = document.getElementById(containerId);
	if (!container) return;

	// Read user selections
	const tokenSelect = document.getElementById('themeriver-token-select');
	const topNSelect  = document.getElementById('themeriver-topn-select');
	const tokenIdx    = tokenSelect ? parseInt(tokenSelect.value) || 0 : 0;
	const topNValue   = topNSelect  ? topNSelect.value : '8';

	// Collect probabilities at every stage
	const collected = _themeriver_collect_probs(tokenIdx, d_model);
	if (!collected) {
		container.innerHTML =
			'<div style="padding:40px;text-align:center;color:#94a3b8;">' +
			'Need at least 2 processing stages. Try choosing another word.</div>';
		return;
	}

	const { vocab, stages } = collected;

	// Determine which words to display
	const topN = topNValue === 'all'
		? vocab.length
		: Math.min(parseInt(topNValue), vocab.length);

	const { topWords, topIndices, showOther } =
		_themeriver_select_top_words(vocab, stages, topN);

	// Assemble the data array: [stageName, probability, word]
	const riverData = _themeriver_build_data(stages, vocab, topWords, topIndices, showOther);

	// Token label for the title
	const collector = window.tlab_trajectory_collector;
	const labels = collector.displayTokens || collector.tokens;
	const tokenLabel = labels[tokenIdx] || `pos ${tokenIdx}`;

	// Render chart
	let chart = echarts.getInstanceByDom(container);
	if (!chart) chart = echarts.init(container);
	container.setAttribute('data-d-model', String(d_model));

	chart.setOption(
		_themeriver_build_option(riverData, stages, tokenLabel, tokenIdx, showOther),
		true   // full replace — safe when word count changes
	);

	_themeriver_wire_resize(container);
	_themeriver_render_residual_contrib(tokenIdx, d_model);
	_themeriver_render_residual_3d();
}

/* Bar chart: how much each layer writes into the residual stream for the
   currently selected token, split into the attention and FFN sublayers. */
function _themeriver_render_residual_contrib(tokenIdx, d_model) {
	const container = document.getElementById('transformer-residual-contrib-plot');
	if (!container) return;
	const empty = (msg) => {
		const old = echarts.getInstanceByDom(container);
		if (old) old.dispose();
		if (window.PlotState) PlotState.empty(container, 'Residual stream', msg);
		else container.innerHTML = '<div style="padding:24px;text-align:center;color:var(--mn-text-muted);">' + msg + '</div>';
	};

	const weights = window.currentWeights;
	const collector = window.tlab_trajectory_collector;
	if (!Array.isArray(weights) || !weights.length || !collector || !collector.tokens) {
		empty('Train the model to see what each layer adds to the residual stream.');
		return;
	}

	const tokens = collector.tokens;
	const pos = Math.max(0, Math.min(tokenIdx, tokens.length - 1));
	const n_heads = getTransformerConfig().n_heads;
	const layers = [];
	const attnWrites = [];
	const ffnWrites = [];
	let h = embedTokensWithPE(tokens, d_model);
	const norm = (v) => Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));

	for (let l = 0; l < weights.length; l++) {
		const res = forwardOneLayer(h, weights[l], d_model, n_heads, tokens, null);
		const attnDiff = res.h_attn[pos].map((v, i) => v - h[pos][i]);
		const ffnDiff = res.h_out[pos].map((v, i) => v - res.h_attn[pos][i]);
		layers.push('L' + (l + 1));
		attnWrites.push(+norm(attnDiff).toFixed(4));
		ffnWrites.push(+norm(ffnDiff).toFixed(4));
		h = res.h_out;
	}

	let chart = echarts.getInstanceByDom(container);
	if (!chart || !container.querySelector('canvas')) {
		if (chart) chart.dispose();
		container.innerHTML = '';
		chart = echarts.init(container);
	}

	const axisFont = { fontSize: 11, color: themeColor('#64748b') };
	chart.setOption({
		title: {
			text: 'What each layer adds to h for "' + (collector.displayTokens || tokens)[pos] + '"',
			left: 'center',
			textStyle: { fontSize: 12, color: themeColor('#1e293b'), fontWeight: 'bold' }
		},
		tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
		legend: { bottom: 0, textStyle: { fontSize: 10 } },
		grid: { top: 40, bottom: 42, left: 48, right: 16 },
		xAxis: { type: 'category', data: layers, axisLabel: axisFont, axisLine: { lineStyle: { color: themeColor('#cbd5e1') } } },
		yAxis: {
			type: 'value',
			name: '‖write‖',
			nameTextStyle: axisFont,
			axisLabel: axisFont,
			splitLine: { lineStyle: { color: themeColor('#e2e8f0') } }
		},
		series: [
			{ name: 'Attention', type: 'bar', data: attnWrites, itemStyle: { color: themeColor('#3b82f6') } },
			{ name: 'FFN', type: 'bar', data: ffnWrites, itemStyle: { color: themeColor('#8b5cf6') } }
		]
	}, true);

	if (!container._ecResidualResize) {
		container._ecResidualResize = () => {
			const c = echarts.getInstanceByDom(container);
			if (c) c.resize();
		};
		window.addEventListener('resize', container._ecResidualResize);
	}
}

/**
 * Picks the top-N vocabulary words by their maximum probability
 * across all stages.
 */
function _themeriver_select_top_words(vocab, stages, topN) {
	const stats = vocab.map((word, i) => ({
		word, idx: i,
		maxProb: Math.max(...stages.map(s => s.probs[i]))
	}));
	stats.sort((a, b) => b.maxProb - a.maxProb);

	const topWords   = stats.slice(0, topN);
	const topIndices = new Set(topWords.map(w => w.idx));
	const showOther  = vocab.length > topN;

	return { topWords, topIndices, showOther };
}

/**
 * Builds the flat ThemeRiver data array.
 */
function _themeriver_build_data(stages, vocab, topWords, topIndices, showOther) {
	const data = [];

	stages.forEach((stage, stageIdx) => {
		// ★ Use numeric index, NOT the stage name string
		topWords.forEach(tw => {
			data.push([stageIdx, stage.probs[tw.idx], tw.word]);
		});

		if (showOther) {
			let otherProb = 0;
			vocab.forEach((_, i) => {
				if (!topIndices.has(i)) otherProb += stage.probs[i];
			});
			data.push([stageIdx, otherProb, '(other)']);
		}
	});

	return data;
}

/**
 * Returns the full ECharts option object for the ThemeRiver.
 */
function _themeriver_build_option(riverData, stages, tokenLabel, tokenIdx, showOther) {
	const palette = [
		'#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
		'#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
		'#06b6d4', '#e11d48', '#a855f7', '#22c55e', '#eab308'
	];
	if (showOther) palette.push(themeColor('#94a3b8'));

	// Cache stage names for axis formatter + tooltip
	const stageNames = stages.map(s => s.name);

	return {
		title: {
			text: `Probability Flow — "${tokenLabel}" (position ${tokenIdx + 1})`,
			subtext: 'Band width = predicted probability at each processing stage',
			left: 'center',
			textStyle:    { fontSize: 13, color: themeColor('#1e293b'), fontWeight: 'bold' },
			subtextStyle: { fontSize: 11, color: themeColor('#64748b') }
		},
		tooltip: {
			trigger: 'item',
			formatter: function (p) {
				const stageIdx = Math.round(p.data[0]);
				const stageName = stageNames[stageIdx] || `Stage ${stageIdx}`;
				let strdata = p.data[2];
				if(/^\s\s*$/.test(strdata)){
					strdata = "␣";
				}
				return `<b>${strdata}</b><br>` +
					`Stage: ${stageName}<br>` +
					`Probability: ${(p.data[1] * 100).toFixed(1)}%`;
			}
		},
		legend: {
			bottom: 5,
			left: 'center',
			textStyle: { fontSize: 11 }
		},
		singleAxis: {
			// ★ KEY FIX: 'value' instead of 'category'
			type: 'value',
			min: 0,
			max: stages.length - 1,
			left: '5%',
			right: '5%',
			top: 80,
			bottom: 65,      // room for legend
			splitNumber: stages.length - 1,
			axisLabel: {
				formatter: function (val) {
					// Only show labels at integer positions
					const idx = Math.round(val);
					if (Math.abs(val - idx) < 0.01 && idx >= 0 && idx < stageNames.length) {
						return stageNames[idx];
					}
					return '';
				},
				rotate: 25,
				fontSize: 10,
				color: themeColor('#475569'),
				interval: 0
			},
			axisTick: {
				alignWithLabel: true
			},
			axisLine: { lineStyle: { color: themeColor('#cbd5e1') } }
		},
		series: [{
			type: 'themeRiver',
			data: riverData,
			label: {
				// ★ FIX: Disable inline labels to prevent overlap.
				// Words are identified via legend + tooltip instead.
				show: false
			},
			emphasis: {
				itemStyle: {
					shadowBlur: 20,
					shadowColor: 'rgba(0, 0, 0, 0.25)'
				}
			}
		}],
		color: palette
	};
}

/**
 * Wires a resize handler (once) for the ThemeRiver container.
 */
function _themeriver_wire_resize(container) {
	if (container._ecThemeRiverResize) return;
	container._ecThemeRiverResize = () => {
		const c = echarts.getInstanceByDom(container);
		if (c) c.resize();
	};
	window.addEventListener('resize', container._ecThemeRiverResize);

	if (window.__MN_DARK && !window._themeriverThemeBound) {
		window._themeriverThemeBound = true;
		__MN_DARK.onChange(() => {
			const el = document.getElementById('transformer-themeriver-plot');
			const dm = el ? parseInt(el.getAttribute('data-d-model') || '0') : 0;
			if (dm) _execute_themeriver_render(dm);
		});
	}
}

/**
 * Forces re-render of the ThemeRiver if it is already visible
 * (needed during training, where the observer won't re-fire).
 */
function forceRerenderVisibleThemeRiver(d_model) {
	const id = 'transformer-themeriver-plot';
	const entry = themeRiverRegistry.get(id);
	if (entry && !entry.rendered) {
		const el = document.getElementById(id);
		if (el && isElementInViewport(el)) {
			_execute_themeriver_render(d_model);
			entry.rendered = true;
		}
	}
}

/**
 * Entry point: ensures the DOM container exists, populates the
 * token selector, and registers the chart for lazy rendering.
 */
function tlab_render_themeriver(d_model) {
	if (!window.tlab_trajectory_collector) return;

	const sortedKeys = Object.keys(window.tlab_trajectory_collector.steps || {}).sort();
	if (sortedKeys.length < 2) return;

	const containerId = 'transformer-themeriver-plot';
	_themeriver_ensure_dom(containerId);
	_themeriver_populate_token_selector();
	_themeriver_populate_stage_selector();

	registerLazyRenderable(
		containerId,
		themeRiverRegistry,
		themeRiverObserver,
		{ d_model },
		() => _execute_themeriver_render(d_model),
		`<div style="padding:30px; color:#94a3b8; text-align:center;">
	    Loading Probability Flow…
	</div>`
	);
}

// ─── DOM Setup ──────────────────────────────────────────────

/**
 * Creates the ThemeRiver wrapper (toolbar + chart div) if it
 * doesn't already exist.
 */
function _themeriver_ensure_dom(containerId) {
	const parent = document.getElementById('transformer-migration-plots-container');
	if (!parent) return;

	if (!document.getElementById(containerId)) {
		const wrapper = document.createElement('div');
		wrapper.id = 'themeriver-wrapper';
		wrapper.className = 'themeriver-wrapper';
		wrapper.style.cssText = `
	border: 2px solid ${themeColor('#c4b5fd')}; border-radius: 12px;
	background: ${themeColor('#faf5ff')}; margin-top: 24px; overflow: hidden;
    `;
		wrapper.innerHTML = `
	<div class="themeriver-header" style="display:flex; align-items:center; gap:12px; padding:12px 16px;
		    background:${themeColor('#ede9fe')}; border-bottom:1px solid ${themeColor('#c4b5fd')}; flex-wrap:wrap;">
	    <span style="font-weight:700; color:${themeColor('#5b21b6')}; font-size:0.95rem;">
		🌊 Probability Flow
	    </span>
	    <label style="color:${themeColor('#7c3aed')}; font-size:0.8rem;">Token position:</label>
	    <select id="themeriver-token-select"
		    onchange="window._themeriver_on_change()"
		    class="themeriver-select"
		    style="padding:4px 8px; border:1px solid ${themeColor('#c4b5fd')};
			   border-radius:6px; font-size:0.82rem; background:${themeColor('#fff')};">
	    </select>
	    <label style="color:${themeColor('#7c3aed')}; font-size:0.8rem; margin-left:auto;">Show top</label>
	    <select id="themeriver-topn-select"
		    onchange="window._themeriver_on_change()"
		    class="themeriver-select"
		    style="padding:4px 8px; border:1px solid ${themeColor('#c4b5fd')};
			   border-radius:6px; font-size:0.82rem; background:${themeColor('#fff')};">
		<option value="5">5</option>
		<option value="8" selected>8</option>
		<option value="10">10</option>
		<option value="15">15</option>
		<option value="all">All</option>
	    </select>
	    <span style="color:${themeColor('#7c3aed')}; font-size:0.8rem;">words</span>
	</div>
	<div id="${containerId}" style="width:100%; height:520px;"></div>
    `;
		parent.appendChild(wrapper);
	}

	_themeriver_ensure_residual_block(parent);
}

/* The residual-write charts live in their own full-width block below the
   Probability Flow wrapper and before the following optional sections. */
function _themeriver_ensure_residual_block(parent) {
	if (document.getElementById('themeriver-residual-block')) return;
	const block = document.createElement('div');
	block.id = 'themeriver-residual-block';
	block.className = 'themeriver-residual-block';
	block.innerHTML = `
	<div class="themeriver-residual-head">Residual stream writes per layer</div>
	<div id="transformer-residual-contrib-plot" style="width:100%; height:280px;"></div>
	<div class="themeriver-residual-head" style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
		<span>Residual stream development (3D) — all tokens, all dimensions</span>
		<label style="font-weight:400; font-size:.78rem; color:var(--mn-text-muted); margin-left:auto;">Stage
			<select id="residual-3d-stage" class="themeriver-select" onchange="window._themeriver_render_residual_3d_from_select()"></select>
		</label>
	</div>
	<div id="transformer-residual-stream-3d" style="width:100%; height:480px;"></div>
	`;
	parent.appendChild(block);
}

function _themeriver_populate_stage_selector() {
	const select = document.getElementById('residual-3d-stage');
	const collector = window.tlab_trajectory_collector;
	if (!select || !collector || !collector.steps) return;
	const keys = Object.keys(collector.steps).sort();
	const prev = select.value;
	select.innerHTML = '';
	keys.forEach((key) => {
		const opt = document.createElement('option');
		opt.value = key;
		opt.textContent = collector.steps[key].name || key;
		select.appendChild(opt);
	});
	if (prev && keys.indexOf(prev) !== -1) select.value = prev;
	else if (keys.length) select.value = keys[keys.length - 1];
}

window._themeriver_render_residual_3d_from_select = function () {
	_themeriver_render_residual_3d();
};

function _themeriver_render_residual_3d() {
	const container = document.getElementById('transformer-residual-stream-3d');
	if (!container) return;
	const collector = window.tlab_trajectory_collector;
	if (!collector || !collector.steps) {
		if (window.PlotState) PlotState.empty(container, 'Residual stream', 'Run the demo to see the residual stream by token and dimension.');
		return;
	}
	const select = document.getElementById('residual-3d-stage');
	const keys = Object.keys(collector.steps).sort();
	const key = (select && select.value) || keys[keys.length - 1];
	const step = collector.steps[key];
	const data = step && step.data;
	if (!Array.isArray(data) || !data.length || !data[0] || !data[0].length) {
		if (window.PlotState) PlotState.empty(container, 'Residual stream', 'No residual stream recorded for this stage yet.');
		return;
	}

	const d_model = data[0].length;
	const labels = (collector.displayTokens || collector.tokens || []).map((t) => String(t).replace(/ /g, '␣'));
	const dims = Array.from({ length: d_model }, (_, i) => 'd' + i);
	const bars = [];
	data.forEach((vec, ti) => {
		vec.forEach((v, di) => {
			if (Number.isFinite(v)) bars.push([di, ti, +v.toFixed(4)]);
		});
	});

	let chart = echarts.getInstanceByDom(container);
	if (!chart) chart = echarts.init(container);
	chart.setOption({
		tooltip: {
			formatter: (p) => `dim ${p.value[0]} · token ${labels[p.value[1]] || p.value[1]}<br>value ${p.value[2]}`
		},
		xAxis3D: { type: 'category', data: dims, name: 'dimension' },
		yAxis3D: { type: 'category', data: labels, name: 'token' },
		zAxis3D: { type: 'value', name: 'value' },
		grid3D: {
			boxWidth: 220,
			boxDepth: Math.max(80, Math.min(240, 26 * labels.length)),
			boxHeight: 90,
			viewControl: { projection: 'perspective', autoRotate: false, distance: 220 }
		},
		series: [{
			type: 'bar3D',
			data: bars,
			shading: 'lambert',
			itemStyle: { color: themeColor('#3b82f6'), opacity: 0.92 },
			emphasis: { itemStyle: { color: themeColor('#f59e0b') } }
		}]
	}, true);

	if (!container._ecResidual3dResize) {
		container._ecResidual3dResize = () => {
			const c = echarts.getInstanceByDom(container);
			if (c) c.resize();
		};
		window.addEventListener('resize', container._ecResidual3dResize);
	}
}

/**
 * Populates the token-position dropdown from the trajectory collector.
 */
function _themeriver_populate_token_selector() {
	const select = document.getElementById('themeriver-token-select');
	if (!select) return;

	const collector = window.tlab_trajectory_collector;
	if (!collector) return;

	const labels = collector.displayTokens || collector.tokens.map((t, i) =>
		typeof t === 'string' ? t : `Token ${i}`
	);

	const prevValue = select.value;
	select.innerHTML = '';

	labels.forEach((label, i) => {
		const opt = document.createElement('option');
		opt.value = i;
		opt.textContent = `${i}: "${label}"` + (i === labels.length - 1 ? ' ← last' : '');
		select.appendChild(opt);
	});

	// Default: last token (the prediction target)
	select.value = (prevValue && parseInt(prevValue) < labels.length)
		? prevValue
		: String(labels.length - 1);
}
