const TD_UNTRAINED_LOSS = 11.0;
const TD_E = 0.8;
const TD_A = 6.0;
const TD_ALPHAN = 0.076;
const TD_B = 8.0;
const TD_ALPHAD = 0.09;
const TD_JITTER = 1.6;
const TD_DECAY = 0.22;
const TD_MINLR = 0.04;
const TD_NOISE_BASE = 2.0;
const TD_TOTAL_STEPS = 240;
const TD_SUBSTEPS = 3;
const TD_TICK_MS = 25;
const TD_SPIKE_AMT = 2.5;
const TD_DIV_GROWTH = 0.06;
const TD_SPIKE_STEP = Math.floor(TD_TOTAL_STEPS * 0.45);
const TD_DIVERGE_STEP = Math.floor(TD_TOTAL_STEPS * 0.55);

const td = {
	running: false,
	timer: null,
	step: 0,
	loss: TD_UNTRAINED_LOSS,
	steps: [],
	losses: [],
	cfg: null
};

function tdReadCfg() {
	return {
		nM: Math.pow(2, parseFloat(document.getElementById('td-n').value)),
		dTok: Math.pow(10, parseFloat(document.getElementById('td-d').value)),
		batch: Math.pow(2, parseFloat(document.getElementById('td-batch').value)),
		sched: document.getElementById('td-schedule').value,
		spike: document.getElementById('td-spike').checked,
		diverge: document.getElementById('td-diverge').checked
	};
}

function tdFloor(nM, dTok) {
	const nTerm = TD_A * Math.pow(nM, -TD_ALPHAN);
	const dTerm = TD_B * Math.pow(dTok, -TD_ALPHAD);
	return TD_E + nTerm + dTerm;
}

function tdScheduleLR(t, sched) {
	if (sched === 'constant') return 1.0;
	if (sched === 'cosine') return 0.5 * (1 + Math.cos(Math.PI * t));
	if (sched === 'wsd') {
		if (t < 0.06) return t / 0.06;
		if (t < 0.82) return 1.0;
		return Math.max(0, 1 - (t - 0.82) / 0.18);
	}
	return 1.0;
}

function tdNextLoss(loss, step, cfg) {
	const floor = tdFloor(cfg.nM, cfg.dTok);
	const t = step / TD_TOTAL_STEPS;
	const lr = tdScheduleLR(t, cfg.sched);
	const effFloor = floor + TD_JITTER * lr;
	const pull = TD_DECAY * Math.max(lr, TD_MINLR);
	let out = loss + (effFloor - loss) * pull;
	out += (Math.random() - 0.5) * 2 * TD_NOISE_BASE / Math.sqrt(cfg.batch);
	if (cfg.spike && step === TD_SPIKE_STEP) out += TD_SPIKE_AMT;
	if (cfg.diverge && step >= TD_DIVERGE_STEP) out += out * TD_DIV_GROWTH;
	if (out < 0) out = 0;
	return out;
}

function tdIdealCurve(cfg) {
	const xs = [];
	const ys = [];
	let loss = TD_UNTRAINED_LOSS;
	for (let s = 0; s <= TD_TOTAL_STEPS; s++) {
		xs.push(s);
		if (s > 0) loss = tdNextLossNoNoise(loss, s, cfg);
		ys.push(loss);
	}
	return { xs, ys, floor: tdFloor(cfg.nM, cfg.dTok) };
}

function tdNextLossNoNoise(loss, step, cfg) {
	const floor = tdFloor(cfg.nM, cfg.dTok);
	const t = step / TD_TOTAL_STEPS;
	const lr = tdScheduleLR(t, cfg.sched);
	const effFloor = floor + TD_JITTER * lr;
	const pull = TD_DECAY * Math.max(lr, TD_MINLR);
	let out = loss + (effFloor - loss) * pull;
	if (out < 0) out = 0;
	return out;
}

function tdVerdict(perParam) {
	if (perParam < 10) return { txt: 'under-trained (GPT-3 regime: too big a model for the data)', color: '#f59e0b' };
	if (perParam <= 35) return { txt: 'near compute-optimal (Chinchilla ≈ 20 tokens/parameter)', color: '#10b981' };
	return { txt: 'over-trained for its size (modern regime: smaller model, cheaper inference)', color: '#0284c7' };
}

function tdFmtN(nM) {
	return nM >= 1000 ? (nM / 1000).toFixed(1) + 'B' : Math.round(nM) + 'M';
}

function tdFmtD(d) {
	if (d >= 1e12) return (d / 1e12).toFixed(1) + 'T';
	if (d >= 1e9) return (d / 1e9).toFixed(1) + 'B';
	if (d >= 1e6) return (d / 1e6).toFixed(1) + 'M';
	return String(Math.round(d));
}

function tdFmtBatch(b) {
	return b >= 1000 ? (b / 1000).toFixed(1) + 'k' : String(Math.round(b));
}

function tdFmtSteps(v) {
	if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
	if (v >= 1e3) return Math.round(v / 1e3) + 'k';
	return String(Math.round(v));
}

function tdPlot(xs, ys, floor, realTotal) {
	const floorX = [0, realTotal];
	const floorY = [floor, floor];
	const data = [
		{
			x: xs, y: ys,
			name: 'Training loss',
			mode: 'lines',
			line: { color: themeColor('#0284c7'), width: 2.5 },
			hovertemplate: 'steps: %{x:.3g}<br>loss: %{y:.3f}<extra></extra>'
		},
		{
			x: floorX, y: floorY,
			name: 'Scaling-law floor L\u2098\u1d62\u2099',
			mode: 'lines',
			line: { color: themeColor('#10b981'), width: 1.5, dash: 'dash' },
			hovertemplate: 'floor: %{y:.3f}<extra></extra>'
		}
	];
	const tickvals = [0, realTotal * 0.25, realTotal * 0.5, realTotal * 0.75, realTotal];
	const ticktext = tickvals.map(tdFmtSteps);
	const layout = {
		margin: { t: 30, b: 44, l: 55, r: 15 },
		showlegend: true,
		legend: { x: 0.01, y: 0.99, bgcolor: isDarkMode() ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)', bordercolor: themeColor('#e2e8f0'), borderwidth: 1, font: { size: 11 } },
		xaxis: {
			range: [0, realTotal], fixedrange: true, gridcolor: themeColor('#f1f5f9'),
			tickvals, ticktext,
			title: { text: 'Optimizer steps', font: { size: 12, color: themeColor('#64748b') } }
		},
		yaxis: {
			gridcolor: themeColor('#f1f5f9'),
			title: { text: 'Loss (nats)', font: { size: 12, color: themeColor('#64748b') } }
		},
		plot_bgcolor: themeColor('#ffffff'),
		paper_bgcolor: themeColor('#ffffff'),
		hoverlabel: { bgcolor: themeColor('#1e293b'), font: { color: themeColor('#f8fafc'), size: 12 } }
	};
	Plotly.react('td-plot', data, layout, { displayModeBar: false });
}

function tdUpdateStats(cfg, loss, step) {
	const realTotal = cfg.dTok / cfg.batch;
	const seen = (step / TD_TOTAL_STEPS) * realTotal;
	const perParam = cfg.dTok / (cfg.nM * 1e6);
	const verdict = tdVerdict(perParam);

	const lossEl = document.getElementById('td-stat-loss');
	if (lossEl) lossEl.innerText = loss.toFixed(3);

	const tokEl = document.getElementById('td-stat-tokens');
	if (tokEl) tokEl.innerText = tdFmtD((step / TD_TOTAL_STEPS) * cfg.dTok);

	const stepsEl = document.getElementById('td-stat-steps');
	if (stepsEl) stepsEl.innerText = tdFmtSteps(seen);

	const ratioEl = document.getElementById('td-stat-ratio');
	if (ratioEl) {
		ratioEl.innerText = perParam.toFixed(1) + ' tok/param';
		ratioEl.style.color = verdict.color;
	}
	return verdict;
}

function tdLog(msg) {
	const c = document.getElementById('td-console');
	if (!c) return;
	const head = c.innerHTML;
	c.innerHTML = `<div>${msg}</div>` + head;
	while (c.children.length > 40) c.removeChild(c.lastChild);
}

function tdSyncSliderLabels(cfg) {
	const nVal = document.getElementById('td-n-val');
	const dVal = document.getElementById('td-d-val');
	const bVal = document.getElementById('td-batch-val');
	if (nVal) nVal.innerText = tdFmtN(cfg.nM);
	if (dVal) dVal.innerText = tdFmtD(cfg.dTok);
	if (bVal) bVal.innerText = tdFmtBatch(cfg.batch);
}

function tdShowIdeal() {
	const cfg = tdReadCfg();
	const { xs, ys, floor } = tdIdealCurve(cfg);
	const realTotal = cfg.dTok / cfg.batch;
	tdPlot(xs.map(s => (s / TD_TOTAL_STEPS) * realTotal), ys, floor, realTotal);
	tdUpdateStats(cfg, ys[ys.length - 1], TD_TOTAL_STEPS);
	tdSyncSliderLabels(cfg);
}

function tdAdvance() {
	const cfg = td.cfg;
	const realTotal = cfg.dTok / cfg.batch;
	for (let i = 0; i < TD_SUBSTEPS && td.step < TD_TOTAL_STEPS; i++) {
		td.step++;
		td.loss = tdNextLoss(td.loss, td.step, cfg);
		td.steps.push(td.step);
		td.losses.push(td.loss);
	}
	const xs = td.steps.map(s => (s / TD_TOTAL_STEPS) * realTotal);
	tdPlot(xs, td.losses, tdFloor(cfg.nM, cfg.dTok), realTotal);
	tdUpdateStats(cfg, td.loss, td.step);
	if (td.step >= TD_TOTAL_STEPS) tdFinish();
}

function tdStart() {
	const cfg = tdReadCfg();
	td.cfg = cfg;
	td.running = true;
	td.step = 0;
	td.loss = TD_UNTRAINED_LOSS;
	td.steps = [0];
	td.losses = [td.loss];

	const btn = document.getElementById('btn-td-train');
	if (btn) btn.innerHTML = '⏸ Pause';

	['td-n', 'td-d', 'td-batch'].forEach(id => { const el = document.getElementById(id); if (el) el.disabled = true; });
	const sched = document.getElementById('td-schedule');
	if (sched) sched.disabled = true;

	const perParam = cfg.dTok / (cfg.nM * 1e6);
	const verdict = tdVerdict(perParam);
	const c = document.getElementById('td-console');
	if (c) c.innerHTML = '';
	tdLog(`<span style="color:#60a5fa">━━━ Run started ━━━</span> N=${tdFmtN(cfg.nM)} · D=${tdFmtD(cfg.dTok)} · batch=${tdFmtBatch(cfg.batch)} · <b>${cfg.sched}</b> schedule`);
	tdLog(`D/N = <b>${perParam.toFixed(1)}</b> tok/param → <span style="color:${verdict.color}">${verdict.txt}</span>`);
	if (cfg.spike) tdLog('A loss spike will be injected mid-run (then recovered).');
	if (cfg.diverge) tdLog('Divergence enabled — the run will blow up past the edge of stability.');

	tdTimer = setInterval(tdAdvance, TD_TICK_MS);
}

function tdPause() {
	if (tdTimer) clearInterval(tdTimer);
	tdTimer = null;
	td.running = false;
	const btn = document.getElementById('btn-td-train');
	if (btn) btn.innerHTML = '▶ Resume';
	['td-n', 'td-d', 'td-batch'].forEach(id => { const el = document.getElementById(id); if (el) el.disabled = false; });
	const sched = document.getElementById('td-schedule');
	if (sched) sched.disabled = false;
	tdLog(`<span style="color:#94a3b8">⏸ Paused at step ${tdFmtSteps((td.step / TD_TOTAL_STEPS) * td.cfg.dTok / td.cfg.batch)} — press Train to resume.</span>`);
}

function tdFinish() {
	if (tdTimer) clearInterval(tdTimer);
	tdTimer = null;
	td.running = false;
	const cfg = td.cfg;
	const btn = document.getElementById('btn-td-train');
	if (btn) btn.innerHTML = '▶ Train';
	['td-n', 'td-d', 'td-batch'].forEach(id => { const el = document.getElementById(id); if (el) el.disabled = false; });
	const sched = document.getElementById('td-schedule');
	if (sched) sched.disabled = false;

	if (cfg.diverge) {
		tdLog(`<b style="color:#ef4444">✗ Diverged — the learning rate was too high; the loss is running away. This is the shape of a lost run.</b>`);
	} else {
		const perParam = cfg.dTok / (cfg.nM * 1e6);
		const floor = tdFloor(cfg.nM, cfg.dTok);
		const gap = td.loss - floor;
		const note = gap < 0.5 ? 'settled close to the floor' : 'settled above the floor (high-LR jitter)';
		tdLog(`<b style="color:#10b981">✓ Run complete</b> — final loss ${td.loss.toFixed(3)}, ${note}. ${cfg.spike ? 'The spike recovered. ' : ''}D/N = ${perParam.toFixed(1)} tok/param.`);
	}
}

function tdReset() {
	if (tdTimer) clearInterval(tdTimer);
	tdTimer = null;
	td.running = false;
	const btn = document.getElementById('btn-td-train');
	if (btn) btn.innerHTML = '▶ Train';
	['td-n', 'td-d', 'td-batch'].forEach(id => { const el = document.getElementById(id); if (el) el.disabled = false; });
	const sched = document.getElementById('td-schedule');
	if (sched) sched.disabled = false;
	tdShowIdeal();
	const c = document.getElementById('td-console');
	if (c) c.innerHTML = 'Showing the <b>idealized</b> curve (no noise, no spikes). Adjust the knobs and press <b>Train</b> to run the real (noisy) simulation.';
}

function tdTrain() {
	if (td.running) tdPause();
	else tdStart();
}

function tdUpdateInfoBanner() {
	const sched = document.getElementById('td-schedule').value;
	const info = document.getElementById('td-info');
	const texts = {
		constant: 'Constant: peak learning rate held the whole run. The curve flattens at a <b>higher</b> level — it never settles to the true floor.',
		cosine: 'Cosine decay: the learning rate decays along a cosine from peak to zero. The curve bends smoothly down to the floor.',
		wsd: 'WSD (warmup–stable–decay): a short warmup, a long stable phase at peak LR, then a hard decay. Watch the flat plateau, then the final drop.'
	};
	if (info) info.innerHTML = `<b>\u{1F4D6} Simulator:</b> a stylized training run. Set the model, the data, the batch, and the learning-rate schedule, then press <b>Train</b> and watch the loss decay toward its power-law floor. — <i>${texts[sched]}</i>`;
}

function tdInit() {
	const cfg = tdReadCfg();
	td.cfg = cfg;
	tdShowIdeal();
	tdUpdateInfoBanner();

	const reideal = () => { if (!td.running) tdShowIdeal(); };
	['td-n', 'td-d', 'td-batch'].forEach(id => {
		const el = document.getElementById(id);
		if (el) el.oninput = reideal;
	});
	const sched = document.getElementById('td-schedule');
	if (sched) sched.onchange = () => { tdUpdateInfoBanner(); reideal(); };
	['td-spike', 'td-diverge'].forEach(id => {
		const el = document.getElementById(id);
		if (el) el.onchange = reideal;
	});
}

async function loadTrainingDynamicsModule() {
	updateLoadingStatus('Loading section about the training run...');
	tdInit();

	if (window.__MN_DARK) {
		window.__MN_DARK.onChange(() => {
			try {
				if (!td.running) tdShowIdeal();
				else if (td.steps.length) {
					const cfg = td.cfg;
					const realTotal = cfg.dTok / cfg.batch;
					const xs = td.steps.map(s => (s / TD_TOTAL_STEPS) * realTotal);
					tdPlot(xs, td.losses, tdFloor(cfg.nM, cfg.dTok), realTotal);
				}
			} catch (e) { /* ignore */ }
		});
	}

	return Promise.resolve();
}
