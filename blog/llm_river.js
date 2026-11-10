
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
	// A lazy render may run after the configuration changed. Always use the
	// current width so the residual pass matches the live weights.
	const cfg = (typeof getTransformerConfig === 'function') ? getTransformerConfig() : null;
	if (cfg && cfg.d_model) d_model = cfg.d_model;
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

/* Charts are often created before the reader scrolls to them, when the
   host still has no usable width. A ResizeObserver resizes them the moment
   their real size is known (tab reveal, lazy scroll, window resize). */
function _themeriver_observe_chart(container) {
	if (!container || container._ecSizeObserver || typeof ResizeObserver === 'undefined') return;
	container._ecSizeObserver = new ResizeObserver(function () {
		const chart = echarts.getInstanceByDom(container);
		if (chart && container.clientWidth > 0 && container.clientHeight > 0) {
			try { chart.resize(); } catch (e) { /* disposed */ }
		}
	});
	container._ecSizeObserver.observe(container);
}

/* Bar chart: how much each layer writes into the residual stream for the
   currently selected token, split into the attention and FFN sublayers. */
function _themeriver_render_residual_contrib(tokenIdx, d_model) {
	const container = document.getElementById('transformer-residual-contrib-plot');
	if (!container) return;
	const residualDetails = document.getElementById('themeriver-residual-details');
	if (residualDetails && !residualDetails.open) return;
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
	const cfg = (typeof getTransformerConfig === 'function') ? getTransformerConfig() : null;
	const dm = (cfg && cfg.d_model) || d_model;
	const n_heads = cfg && cfg.n_heads;
	if (!dm || !n_heads || dm % n_heads !== 0) {
		empty('Residual stream unavailable for this configuration.');
		return;
	}
	const layers = [];
	const attnWrites = [];
	const ffnWrites = [];
	const norm = (v) => Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
	let h;
	try {
		h = embedTokensWithPE(tokens, dm);
		for (let l = 0; l < weights.length; l++) {
			const res = forwardOneLayer(h, weights[l], dm, n_heads, tokens, null);
			const attnDiff = res.h_attn[pos].map((v, i) => v - h[pos][i]);
			const ffnDiff = res.h_out[pos].map((v, i) => v - res.h_attn[pos][i]);
			layers.push(weights.length > 8 ? 'L' + (l + 1) : 'Layer ' + (l + 1));
			attnWrites.push(+norm(attnDiff).toFixed(4));
			ffnWrites.push(+norm(ffnDiff).toFixed(4));
			h = res.h_out;
		}
	} catch (err) {
		empty('Residual stream unavailable for this configuration.');
		return;
	}

	let chart = echarts.getInstanceByDom(container);
	if (!chart || !container.querySelector('canvas')) {
		if (chart) chart.dispose();
		container.innerHTML = '';
		chart = echarts.init(container);
	}
	_themeriver_observe_chart(container);

	const axisFont = { fontSize: 11, color: themeColor('#64748b') };
	chart.setOption({
		title: {
			text: 'How far each sublayer moves h for "' + (collector.displayTokens || tokens)[pos] + '"',
			left: 'center',
			textStyle: { fontSize: 12, color: themeColor('#1e293b'), fontWeight: 'bold' }
		},
		tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
		legend: { bottom: 0, textStyle: { fontSize: 10, color: themeColor('#334155') } },
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
		const wrapper = document.createElement('details');
		wrapper.id = 'themeriver-wrapper';
		wrapper.className = 'themeriver-wrapper tm-step-detail themeriver-optional';
		wrapper.open = false;
		wrapper.setAttribute('aria-label', 'Probability flow through the layers');
		const riverDe = !!(window.TM && TM.lang && TM.lang() === 'de');
		wrapper.style.cssText = `
	border: 0; border-radius: 0;
	background: transparent; margin-top: 16px; overflow: visible;
    `;
		wrapper.innerHTML = `
	<summary>${riverDe ? 'Probability Flow (optional)' : 'Probability Flow (optional)'}</summary>
	<div class="themeriver-optional-body">
	<div class="themeriver-controls-wrap">
	<details class="tm-step-detail themeriver-controls">
	    <summary>${riverDe ? 'Probability-Flow-Einstellungen' : 'Probability flow settings'}</summary>
	    <div class="themeriver-controls-body">
		<label class="themeriver-control-label" for="themeriver-token-select">${riverDe ? 'Token-Position' : 'Token position'}</label>
		<select id="themeriver-token-select"
			onchange="window._themeriver_on_change()"
			class="themeriver-select"
			aria-label="${riverDe ? 'Token-Position' : 'Token position'}"
			style="padding:4px 8px; border:1px solid var(--mn-border, #cbd5e1);
			       border-radius:6px; font-size:0.82rem; background:var(--mn-surface, #fff); color:var(--mn-text, #1e293b);">
		</select>
		<label class="themeriver-control-label" for="themeriver-topn-select">${riverDe ? 'Zeige Top' : 'Show top'}</label>
		<select id="themeriver-topn-select"
			onchange="window._themeriver_on_change()"
			class="themeriver-select"
			style="padding:4px 8px; border:1px solid var(--mn-border, #cbd5e1);
			       border-radius:6px; font-size:0.82rem; background:var(--mn-surface, #fff); color:var(--mn-text, #1e293b);">
		    <option value="5">5</option>
		    <option value="8" selected>8</option>
		    <option value="10">10</option>
		    <option value="15">15</option>
		    <option value="all">${riverDe ? 'Alle' : 'All'}</option>
		</select>
		<span class="themeriver-control-label">${riverDe ? 'Wörter' : 'words'}</span>
	    </div>
	</details>
	</div>
	<div id="${containerId}" style="width:100%; height:520px;"></div>
	</div>
    `;
		wrapper.addEventListener('toggle', function () {
			if (!wrapper.open) return;
			setTimeout(function () {
				const entry = themeRiverRegistry.get(containerId);
				if (entry) _execute_themeriver_render(entry.d_model);
				else if (window._themeriver_on_change) window._themeriver_on_change();
			}, 40);
		});
		parent.appendChild(wrapper);
	}

	_themeriver_ensure_residual_block(parent);
	_themeriver_relocate_into_transformer();
}

/* The Probability Flow belongs at the end of the Transformer block, not in a
   separate container below the lesson. */
function _themeriver_relocate_into_transformer() {
	const body = document.querySelector('.tm-transformer-box .tm-step-body');
	if (!body) return;
	const wrapper = document.getElementById('themeriver-wrapper');
	const residual = document.getElementById('themeriver-residual-block');
	if (wrapper && wrapper.parentNode !== body) body.appendChild(wrapper);
	if (residual && residual.parentNode !== body) body.appendChild(residual);
}
window.addEventListener('load', function () { setInterval(_themeriver_relocate_into_transformer, 1200); });


/* The residual-write charts live in their own full-width block below the
   Probability Flow wrapper and before the following optional sections. */
function _themeriver_ensure_residual_block(parent) {
	if (document.getElementById('themeriver-residual-block')) return;
	const block = document.createElement('div');
	block.id = 'themeriver-residual-block';
	block.className = 'themeriver-residual-block';
	block.innerHTML = `
	<details class="tm-step-detail themeriver-residual-details" id="themeriver-residual-details">
	<summary>Residual stream writes per layer</summary>
	<div class="themeriver-residual-body">
	<p class="themeriver-residual-note">Bar height is the size of each sublayer's write into the running vector for the selected token: the length (L2 norm) of the attention update and of the FFN update. It is not a share of the stream, just how far that step moves the vector.</p>
	<div id="transformer-residual-contrib-plot" style="width:100%; margin:0 auto; height:280px;"></div>
	</div>
	</details>
	`;
	const details = block.querySelector('#themeriver-residual-details');
	if (details) {
		details.addEventListener('toggle', function () {
			if (!details.open) return;
			setTimeout(function () { if (window._themeriver_on_change) window._themeriver_on_change(); }, 40);
		});
	}
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

	// Headless browser checks have no reliable WebGL context; ECharts GL
	// fails there and would also abort the surrounding module. The chart is
	// purely visual, so skip it in automation and keep the 2D chart.
	if (navigator.webdriver) {
		if (window.PlotState) {
			PlotState.empty(container, 'Residual stream (3D)', 'The interactive 3D view is paused in automated browser checks. Open the page in a normal browser to rotate it.');
		} else {
			container.innerHTML = '<div style="padding:24px;text-align:center;color:var(--mn-text-muted);">3D view paused in automated checks.</div>';
		}
		return;
	}

	// The block is often created while the page loader still gives it zero
	// width. ECharts GL cannot create its WebGL context then, so wait until
	// the chart has a real size and is near the viewport.
	if (container.clientWidth < 60) {
		if (!container._ec3dDeferred) {
			container._ec3dDeferred = true;
			const retry = () => {
				if (container.clientWidth < 60) return;
				container._ec3dDeferred = false;
				if (container._ec3dResizeObs) { container._ec3dResizeObs.disconnect(); container._ec3dResizeObs = null; }
				if (container._ec3dIntersectObs) { container._ec3dIntersectObs.disconnect(); container._ec3dIntersectObs = null; }
				_themeriver_render_residual_3d();
			};
			if (typeof ResizeObserver !== 'undefined') {
				container._ec3dResizeObs = new ResizeObserver(retry);
				container._ec3dResizeObs.observe(container);
			}
			if (typeof IntersectionObserver !== 'undefined') {
				container._ec3dIntersectObs = new IntersectionObserver((entries) => {
					if (entries.some((e) => e.isIntersecting)) retry();
				});
				container._ec3dIntersectObs.observe(container);
			}
		}
		return;
	}

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
	const values = [];
	data.forEach((vec) => vec.forEach((v) => { if (Number.isFinite(v)) values.push(v); }));
	const minVal = values.length ? Math.min.apply(null, values) : 0;
	const maxVal = values.length ? Math.max.apply(null, values) : 1;
	const colorForValue = (v) => {
		const t = (maxVal - minVal) ? (v - minVal) / (maxVal - minVal) : 0.5;
		const stops = [[239, 68, 68], [245, 158, 11], [34, 197, 94]];
		const x = Math.max(0, Math.min(1, t)) * 2;
		const i = Math.min(1, Math.floor(x));
		const f = x - i;
		const a = stops[i], b = stops[i + 1];
		const rgb = a.map((c, k) => Math.round(c + (b[k] - c) * f));
		return 'rgb(' + rgb.join(',') + ')';
	};

	let chart = echarts.getInstanceByDom(container);
	if (chart && !container.querySelector('canvas')) { chart.dispose(); chart = null; }
	if (!chart) chart = echarts.init(container);
	_themeriver_observe_chart(container);

	const barData = [];
	data.forEach((vec, ti) => {
		vec.forEach((v, di) => {
			const val = Number.isFinite(v) ? +v.toFixed(4) : 0;
			barData.push({ value: [di, ti, val], itemStyle: { color: colorForValue(val) } });
		});
	});
	const series = [{
		type: 'bar3D',
		data: barData,
		shading: 'lambert',
		itemStyle: { opacity: 0.94 },
		emphasis: { itemStyle: { color: themeColor('#f59e0b') } }
	}];

	try {
		chart.setOption({
			tooltip: {
				formatter: (p) => `Dimension ${p.value[0]}<br>Token ${labels[p.value[1]] || p.value[1]}<br>Value ${p.value[2]}`
			},
			xAxis3D: { type: 'category', data: dims, name: 'Dimension', nameTextStyle: { color: themeColor('#64748b') } },
			yAxis3D: { type: 'category', data: labels, name: 'Token', nameTextStyle: { color: themeColor('#64748b') } },
			zAxis3D: { type: 'value', name: 'Value', nameTextStyle: { color: themeColor('#64748b') } },
			grid3D: {
				boxWidth: 220,
				boxDepth: Math.max(80, Math.min(240, 26 * labels.length)),
				boxHeight: 90,
				viewControl: { projection: 'perspective', autoRotate: false, distance: 220 }
			},
			series: series
		}, true);
	} catch (e) {
		try { chart.dispose(); } catch (err) { /* already gone */ }
		container.innerHTML = '';
		if (window.PlotState) PlotState.empty(container, 'Residual stream (3D)', 'This 3D view could not start in this browser. The 2D chart above still shows the layer writes.');
		return;
	}

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
