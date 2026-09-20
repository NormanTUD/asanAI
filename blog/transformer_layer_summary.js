(function () {
	'use strict';

	var win = window;

	var S = {
		main: null,
		statusEl: null,
		layersEl: null,
		sparkWrap: null,
		sparkSvg: null,
		sparkLegend: null,
		latest: null,
		samples: [],
		lastRef: null,
		lastLen: -1,
		lastSampleAt: 0
	};

	win.TransformerLayerSummary = {
		refresh: function () {
			var r = compute();
			if (r) { S.latest = r; render(); }
			return r;
		},
		current: function () { return S.latest; }
	};

	win.tlsLog = [];
	function log(msg) { if (win.tlsLog.length < 400) win.tlsLog.push(msg); }

	function $(sel, root) { return (root || document).querySelector(sel); }

	function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

	function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

	function pct(v) { return (100 * clamp(v, 0, 1)).toFixed(0) + '%'; }

	function fx(v, n) {
		n = n === undefined ? 2 : n;
		var s = Number(v).toFixed(n).replace(/\.?0+$/, '');
		return s === '' || s === '-' ? '0' : s;
	}

	function mean(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }

	function ones(n) { return new Array(n).fill(1); }

	function zeros(n) { return new Array(n).fill(0); }

	function transpose(M) {
		var r = M.length, c = M[0].length, O = new Array(c);
		for (var j = 0; j < c; j++) {
			var col = new Array(r);
			for (var i = 0; i < r; i++) col[i] = M[i][j];
			O[j] = col;
		}
		return O;
	}

	function mul(A, B) {
		var r = A.length, k = A[0].length, c = B[0].length, O = new Array(r);
		for (var i = 0; i < r; i++) {
			var row = new Array(c);
			for (var j = 0; j < c; j++) {
				var s = 0;
				for (var t = 0; t < k; t++) s += A[i][t] * B[t][j];
				row[j] = s;
			}
			O[i] = row;
		}
		return O;
	}

	function fro(M) {
		var s = 0;
		for (var i = 0; i < M.length; i++) {
			var row = M[i];
			for (var j = 0; j < row.length; j++) s += row[j] * row[j];
		}
		return Math.sqrt(s);
	}

	function sigmaMax(M) {
		var r = M.length, c = M[0].length;
		if (!r || !c) return 0;
		var v = new Array(c).fill(1 / Math.sqrt(c));
		var u = new Array(r);
		var sig = 0;
		for (var it = 0; it < 42; it++) {
			var un = 0;
			for (var i = 0; i < r; i++) {
				var s = 0;
				var row = M[i];
				for (var j = 0; j < c; j++) s += row[j] * v[j];
				u[i] = s;
				un += s * s;
			}
			un = Math.sqrt(un) || 1e-40;
			sig = un;
			for (var i2 = 0; i2 < r; i2++) u[i2] /= un;
			var vn = 0;
			for (var j2 = 0; j2 < c; j2++) {
				var s2 = 0;
				for (var i3 = 0; i3 < r; i3++) s2 += M[i3][j2] * u[i3];
				v[j2] = s2;
				vn += s2 * s2;
			}
			vn = Math.sqrt(vn) || 1e-40;
			for (var j3 = 0; j3 < c; j3++) v[j3] /= vn;
		}
		return sig;
	}

	function stableRank(M) {
		var f = fro(M);
		var f2 = f * f;
		if (f2 < 1e-30 || !M.length || !M[0].length) return 0;
		var s = sigmaMax(M);
		return s * s > 1e-30 ? f2 / (s * s) : 0;
	}

	function cosFlat(A, B) {
		var n = 0, na = 0, nb = 0;
		for (var i = 0; i < A.length; i++) {
			var ra = A[i], rb = B[i];
			if (!rb) return 0;
			for (var j = 0; j < ra.length; j++) {
				var a = ra[j], b = rb[j];
				n += a * b; na += a * a; nb += b * b;
			}
		}
		na = Math.sqrt(na); nb = Math.sqrt(nb);
		return (na > 1e-30 && nb > 1e-30) ? clamp(n / (na * nb), -1, 1) : 0;
	}

	function colsOf(M, off, len) { return M.map(function (row) { return row.slice(off, off + len); }); }

	function entropBits(row) {
		var s = 0;
		for (var j = 0; j < row.length; j++) {
			var p = row[j];
			if (p > 1e-12) s += p * Math.log2(p);
		}
		return -s;
	}

	function attnEntropy(A) {
		var T = A.length, s = 0, c = 0;
		for (var i = 1; i < T; i++) { s += entropBits(A[i]); c++; }
		return c ? s / c : 0;
	}

	function headSimilarity(heads) {
		var n = heads.length;
		if (n < 2) return 1;
		var sd = 0, sf = 0, c = 0;
		for (var a = 0; a < n; a++) {
			sf += fro(heads[a]);
			for (var b = a + 1; b < n; b++) {
				var Ma = heads[a], Mb = heads[b];
				var d = 0;
				for (var i = 0; i < Ma.length; i++) {
					var ra = Ma[i], rb = Mb[i];
					for (var j = 0; j < ra.length; j++) {
						var t = ra[j] - rb[j];
						d += t * t;
					}
				}
				sd += Math.sqrt(d);
				c++;
			}
		}
		var meanF = sf / n;
		return (c && meanF > 1e-12) ? (sd / c) / meanF : 1;
	}

	function gammaStats(g) {
		if (!g || !g.length) return { mean: 1, spread: 0 };
		var s = 0, mx = -Infinity, mn = Infinity;
		for (var i = 0; i < g.length; i++) {
			s += g[i];
			if (g[i] > mx) mx = g[i];
			if (g[i] < mn) mn = g[i];
		}
		return { mean: s / g.length, spread: (mx - mn) / 2 };
	}

	function probeTokens() {
		var el = document.getElementById('transformer-training-data');
		var text = (el && el.value ? el.value : '').trim();
		if (!text) text = 'the cat sat on the mat and the dog slept beside the fire';
		var tkr = win.transformer_tokenize_render;
		var toks = tkr ? tkr(text, null) : null;
		if (!Array.isArray(toks) || !toks.length) toks = text.split(/\s+/);
		if (!toks.length) toks = ['the'];
		return toks.slice(0, 24);
	}

	function compute() {
		var g = win;
		if (!g.calculateLayerNorm || !g.geluApprox || !g.matMul || !g.softmax || !g.forwardOneLayer || !g.embedTokensWithPE) return null;
		var W = win.currentWeights;
		if (!Array.isArray(W) || !W.length) return null;
		if (!win.persistentEmbeddingSpace) return null;
		var cfg = g.getTransformerConfig ? g.getTransformerConfig() : null;
		var dmodel = cfg ? Math.max(1, cfg.d_model) : 3;
		var nheads = cfg ? Math.max(1, cfg.n_heads) : 1;
		var tokens = probeTokens();
		if (tokens.length < 2) tokens = ['the', 'cat'];
		var T = tokens.length;
		var dk = Math.floor(dmodel / nheads);
		var maxBits = 0;
		for (var i = 0; i < T - 1; i++) maxBits += Math.log2(i + 2);
		maxBits = T > 1 ? maxBits / (T - 1) : 0;

		var h = g.embedTokensWithPE(tokens, dmodel);
		var layers = [];

		for (var l = 0; l < W.length; l++) {
			var w = W[l];
			if (!w || !w.attention || !w.attention.query) { layers.push({ lack: true, l: l }); continue; }
			var res;
			try { res = g.forwardOneLayer(h, w, dmodel, nheads, tokens); }
			catch (e) { layers.push({ lack: true, err: String(e), l: l }); break; }

			var ents = res.headData.map(function (hd) { return attnEntropy(hd.weights); });
			var focus = ents.map(function (e) { return maxBits > 0.05 ? clamp(1 - e / maxBits, 0, 1) : 0; });

			var qkSR = [], voSR = [];
			if (dk >= 1) {
				var nh = Math.min(nheads, res.headData.length);
				for (var hh = 0; hh < nh; hh++) {
					var off = hh * dk;
					var Qh = w.attention.query.slice(off, off + dk);
					var Kh = w.attention.key.slice(off, off + dk);
					qkSR.push(stableRank(mul(Qh, transpose(Kh))));
					var Vh = colsOf(w.attention.value, off, dk);
					var Oh = w.attention.output.slice(off, off + dk);
					voSR.push(stableRank(mul(Vh, Oh)));
				}
			}
			var headSim = headSimilarity(res.headData.map(function (hd) { return hd.weights; }));

			var norm2 = g.calculateLayerNorm(res.h_attn, w.gamma2 || ones(dmodel), w.beta2 || zeros(dmodel));
			var pre = g.matMul(norm2, w.W1, w.b1);
			var act = pre.map(function (row) { return row.map(function (v) { return g.geluApprox(v); }); });
			var dff = pre.length && pre[0].length ? pre[0].length : 0;
			var dead = 0;
			if (dff) {
				for (var u = 0; u < dff; u++) {
					var m = 0;
					for (var t2 = 0; t2 < act.length; t2++) {
						var av = Math.abs(act[t2][u]);
						if (av > m) m = av;
					}
					if (m < 1e-3) dead++;
				}
			}
			var ffnOut = g.matMul(act, w.W2, w.b2);
			var wn = fro(h) || 1e-9;

			layers.push({
				l: l + 1,
				nHeads: res.headData.length,
				ents: ents,
				focus: focus,
				maxBits: maxBits,
				qkSR: qkSR,
				voSR: voSR,
				dk: dk,
				headSim: headSim,
				ffn: { dff: dff, dead: dead, deadPct: dff ? dead / dff : 0, w1sr: stableRank(w.W1) },
				write: {
					attnRel: fro(res.projected) / wn,
					ffnRel: fro(ffnOut) / wn,
					cosAF: cosFlat(res.projected, ffnOut),
					cosKeep: cosFlat(h, res.h_out)
				},
				g1: gammaStats(w.gamma),
				g2: gammaStats(w.gamma2)
			});
			h = res.h_out;
		}

		var loss = win.lossHistory && win.lossHistory.length ? win.lossHistory[win.lossHistory.length - 1] : undefined;
		return {
			dmodel: dmodel, nheads: nheads, dk: dk, T: T, tokens: tokens, maxBits: maxBits,
			epoch: win.lossHistory ? win.lossHistory.length : 0,
			loss: loss,
			training: !!win.isTraining,
			layers: layers
		};
	}

	function describeAttention(L) {
		var A = [];
		if (L.nHeads > 1) {
			var fa = mean(L.focus);
			if (fa > 0.7) A.push('attention is sharply focused (' + pct(fa) + ' of the causal maximum concentration): every token spends almost all of its weight on one or two past positions — a targeted copier/router.');
			else if (fa > 0.35) A.push('attention is moderately focused (' + pct(fa) + '): tokens spread their weight over a few past positions without a single hot target.');
			else A.push('attention is diffuse (' + pct(fa) + ' of maximum concentration): each token averages over much of its past like a moving average — a place that has not specialised yet.');
			if (L.headSim < 0.4) A.push('the heads are near-copies of each other (pairwise distance ≈ ' + fx(L.headSim) + ' of the mean head size): most of the ' + L.nHeads + ' heads behave alike, so effectively fewer distinct attention behaviours than the dial claims.');
		} else {
			var f1 = L.focus[0] || 0;
			A.push(f1 > 0.7 ? 'the single head is sharply focused (' + pct(f1) + '): a targeted copier/router.'
				: (f1 > 0.35 ? 'the single head is moderately focused (' + pct(f1) + ').'
					: 'the single head is diffuse (' + pct(f1) + ') — almost a moving average.'));
		}
		if (L.dk > 1) {
			var qk = mean(L.qkSR);
			var vo = mean(L.voSR);
			A.push('the query-key block has effective rank ≈ ' + fx(qk) + ' of ' + L.dk + (qk < 1.4 ? ' — it looks for essentially one thing, retrieval-style.'
				: ' — a couple of independent query directions are in use.'));
			A.push('the value→output block has effective rank ≈ ' + fx(vo) + ' of ' + L.dk + (vo < 1.4 ? ': each head writes along a single dominant direction of the residual stream (a rank-≈1 write circuit).'
				: ': each head writes into a distinctly multi-dimensional subspace.'));
		}
		return A.join(' ');
	}

	function describeFfn(L) {
		var F = [];
		var dp = L.ffn.deadPct;
		if (dp > 0.6) F.push((100 * dp).toFixed(0) + '% of FFN units never fire on these tokens: the nonlinear branch is almost silent, so this sublayer behaves close to a low-rank gate.');
		else if (dp > 0.25) F.push((100 * dp).toFixed(0) + '% of FFN units stay silent while the rest carry the nonlinearity — a sparse gate.');
		else F.push('only ' + (100 * dp).toFixed(0) + '% of FFN units are dead — the nonlinear branch fires densely and is actively reshaping features.');
		F.push('the expansion weight has effective rank ≈ ' + fx(L.ffn.w1sr) + ' of ' + Math.min(L.ffn.dff, L.dk * L.nHeads) + '.');
		return F.join(' ');
	}

	function describeStream(L) {
		var W2 = [];
		W2.push('the layer writes Δ_attn ≈ ' + pct(L.write.attnRel) + ' of ‖x‖ and Δ_ffn ≈ ' + pct(L.write.ffnRel) + ' of ‖x‖ into the residual stream.');
		if (L.write.cosAF > 0.6) W2.push('attention and FFN write along nearly the same direction (cos θ ≈ ' + fx(L.write.cosAF, 3) + ') — two low-rank updates reinforcing one direction, a common stabilising pattern.');
		if (L.write.cosKeep > 0.98) W2.push('the layer barely rotates the stream (cos(x, h_out) ≈ ' + fx(L.write.cosKeep, 3) + '): for these tokens it is close to a skip that mostly re-scales.');
		return W2.join(' ');
	}

	function oneLineVerdict(L) {
		var fa = mean(L.focus);
		var attnWord = fa > 0.7 ? 'focused' : (fa < 0.35 ? 'diffuse' : 'mixed');
		return attnWord + ' attention · ' + Math.round(100 * L.ffn.deadPct) + '% dead FFN · writes ' + pct(L.write.attnRel + L.write.ffnRel) + ' of ‖x‖';
	}

	function barRow(items) {
		return '' +
			'<div style="display:flex; gap:6px; align-items:flex-end; height:56px; margin:6px 0 2px;">' +
			items.map(function (it) {
				var hh = Math.max(3, Math.round(clamp(it.v, 0, 1) * 50));
				return '<div style="display:flex; flex-direction:column; align-items:center; justify-content:flex-end;">' +
					'<div style="width:14px; height:' + hh + 'px; background:' + it.c + '; border-radius:3px 3px 0 0;"></div>' +
					'<div style="font-size:.6rem; color:var(--mn-text-muted,#64748b); margin-top:2px;">' + it.label + '</div>' +
					'</div>';
			}).join('') +
			'</div>';
	}

	function mathTable(rows) {
		return '<table style="border-collapse:collapse; font-size:.78rem; width:100%; margin-top:4px;"><tbody>' +
			rows.map(function (r) {
				return '<tr><td style="padding:2px 10px 2px 0; color:var(--mn-text-muted,#64748b); text-align:left;">' + r[0] + '</td>' +
					'<td style="padding:2px 0; text-align:right; font-variant-numeric:tabular-nums;">' + r[1] + '</td></tr>';
			}).join('') +
			'</tbody></table>';
	}

	function listOf(a, d) { return a.map(function (v) { return fx(v, d); }).join(', '); }

	function moreDetails(id, title, body) {
		return '<details id="' + id + '" style="margin-top:6px; font-size:.8rem;"><summary style="cursor:pointer; font-weight:600; color:var(--mn-text,#334155);">' + title + '</summary>' + body + '</details>';
	}

	function layerHtml(L) {
		if (L.lack) {
			return '<div class="tls-card" style="border:1px solid #e2e8f0; border-radius:10px; padding:12px 14px; margin:10px 0; background:var(--mn-surface,#fff); font-size:.85rem; color:var(--mn-text-muted,#64748b);">Layer ' + (L.l + 1) + (L.err ? ' — could not be measured (' + fx(L.err) + ').' : ' — not measured.') + '</div>';
		}

		var headsBars = L.nHeads > 1
			? barRow(L.focus.map(function (f, i) { return { v: f, c: '#2563eb', label: 'h' + (i + 1) }; }))
			: '';
		var ffnBars = barRow([
			{ v: L.ffn.deadPct, c: '#dc2626', label: 'dead' },
			{ v: 1 - L.ffn.deadPct, c: '#059669', label: 'fire' }
		]);
		var streamBars = barRow([
			{ v: Math.min(L.write.attnRel, 1), c: '#2563eb', label: 'attn Δ' },
			{ v: Math.min(L.write.ffnRel, 1), c: '#d97706', label: 'ffn Δ' },
			{ v: Math.max(0, Math.min((L.write.cosAF + 1) / 2, 1)), c: '#7c3aed', label: 'cos' }
		]);

		var attnMore = moreDetails('tls-l' + L.l + '-attn-more', 'I want to know more — the measured math', mathTable([
			['tokens / d_model / heads / d_k', L.maxBits ? L.nHeads + ' heads × ' + L.dk : (L.dk + '×' + L.nHeads)],
			['attention bits per token, H̄', fx(mean(L.ents), 2) + ' bits (max ≈ ' + fx(L.maxBits, 2) + ')'],
			['concentration per head, C_h', listOf(L.focus.map(function (f) { return f * 100; }), 0) + '%'],
			['sr(Q·Kᵀ) per head', L.qkSR.length ? listOf(L.qkSR, 2) : '—'],
			['sr(V·O) per head', L.voSR.length ? listOf(L.voSR, 2) : '—'],
			['head similarity (0 = copies)', fx(L.headSim, 2)],
			['LayerNorm γ₁ mean / spread', fx(L.g1.mean, 3) + ' / ' + fx(L.g1.spread, 3)]
		]));

		var ffnMore = moreDetails('tls-l' + L.l + '-ffn-more', 'I want to know more — the measured math', mathTable([
			['FFN dead units', L.ffn.dead + ' of ' + L.ffn.dff + ' (' + pct(L.ffn.deadPct) + ')'],
			['effective rank of W₁', fx(L.ffn.w1sr, 2) + ' of ≤' + Math.min(L.ffn.dff, L.dk * L.nHeads)],
			['LayerNorm γ₂ mean / spread', fx(L.g2.mean, 3) + ' / ' + fx(L.g2.spread, 3)]
		]));

		var streamMore = moreDetails('tls-l' + L.l + '-stream-more', 'I want to know more — the measured math', mathTable([
			['attention write  ‖Δ_attn‖/‖x‖', pct(L.write.attnRel)],
			['FFN write       ‖Δ_ffn‖/‖x‖', pct(L.write.ffnRel)],
			['cos(Δ_attn, Δ_ffn)', fx(L.write.cosAF, 3)],
			['cos(x, h_out)', fx(L.write.cosKeep, 3)]
		]));

		return '<div class="tls-card" style="border:1px solid #e2e8f0; border-radius:10px; padding:12px 14px; margin:10px 0; background:var(--mn-surface,#fff);">' +
			'<div style="font-weight:700; color:var(--mn-text,#0f172a); margin-bottom:2px;">Layer ' + L.l + ' <span class="tls-live" style="font-weight:400; font-size:.8rem; color:var(--mn-text-muted,#64748b);">— ' + oneLineVerdict(L) + '</span></div>' +
			'<div style="display:grid; gap:12px 14px; margin-top:10px; grid-template-columns:repeat(auto-fit,minmax(250px,1fr));">' +

			'<div style="border-right:0; min-width:0;">' +
			'<details id="tls-l' + L.l + '-attn" open>' +
			'<summary style="cursor:pointer; font-weight:700; color:var(--mn-accent,#2563eb); font-size:.88rem;">Attention sublayer</summary>' +
			'<p style="font-size:.84rem; line-height:1.55; color:var(--mn-text,#1e293b); margin:6px 0 4px;">' + describeAttention(L) + '</p>' +
			headsBars +
			attnMore +
			'</details>' +
			'</div>' +

			'<div style="min-width:0;">' +
			'<details id="tls-l' + L.l + '-ffn" open>' +
			'<summary style="cursor:pointer; font-weight:700; color:var(--mn-accent,#2563eb); font-size:.88rem;">FFN sublayer</summary>' +
			'<p style="font-size:.84rem; line-height:1.55; color:var(--mn-text,#1e293b); margin:6px 0 4px;">' + describeFfn(L) + '</p>' +
			ffnBars +
			ffnMore +
			'</details>' +
			'</div>' +

			'<div style="min-width:0;">' +
			'<details id="tls-l' + L.l + '-stream" open>' +
			'<summary style="cursor:pointer; font-weight:700; color:var(--mn-accent,#2563eb); font-size:.88rem;">Residual stream</summary>' +
			'<p style="font-size:.84rem; line-height:1.55; color:var(--mn-text,#1e293b); margin:6px 0 4px;">' + describeStream(L) + '</p>' +
			streamBars +
			streamMore +
			'</details>' +
			'</div>' +

			'</div>' +
			'</div>';
	}

	function layersHtml(L) {
		if (!L.layers.length) return '<div style="font-size:.85rem; color:var(--mn-text-muted,#64748b);">No layer weights available yet.</div>';
		return L.layers.map(layerHtml).join('');
	}

	function statusHtml(L) {
		var el = S.statusEl;
		if (!el) return;
		var probeTxt = L.tokens.join(' ').replace(/\s+/g, ' ').slice(0, 46);
		var base = 'Measured on a ' + L.T + '-token window: “' + probeTxt + (L.tokens.join(' ').length > 46 ? '…' : '') + '”. ';
		var txt;
		if (L.training) txt = base + '🔄 Measuring live during training — epoch ' + L.epoch + (L.loss !== undefined ? ', loss ' + fx(L.loss, 3) : '') + '.';
		else txt = base + '◼ Prediction / read-only mode — metrics are frozen at the last checkpoint' + (S.samples.length ? ' (' + L.epoch + ' epochs observed)' : '') + '.';
		el.innerHTML = txt;
	}

	function render() {
		try {
			var L = S.latest;
			if (!L || !S.layersEl) return;
			statusHtml(L);
			var prevOpen = {};
			Array.prototype.forEach.call(S.layersEl.querySelectorAll('details'), function (d) { prevOpen[d.id] = d.open; });
			S.layersEl.innerHTML = layersHtml(L);
			Array.prototype.forEach.call(S.layersEl.querySelectorAll('details'), function (d) {
				if (prevOpen[d.id] !== undefined) d.open = prevOpen[d.id];
			});
			renderSpark(L);
		} catch (e) {
			if (S.statusEl) S.statusEl.textContent = 'Error while measuring: ' + e.message;
			log('render error: ' + e.message);
			throw e;
		}
	}

	function pushSample(L) {
		var f = mean(L.layers.filter(function (x) { return !x.lack; }).map(function (x) { return mean(x.focus); }));
		var d = mean(L.layers.filter(function (x) { return !x.lack; }).map(function (x) { return x.ffn.deadPct; }));
		S.samples.push({ e: L.epoch, f: 100 * f, d: 100 * d });
		if (S.samples.length > 120) S.samples = S.samples.filter(function (_, i) { return i % 2 === 0; });
	}

	function renderSpark(L) {
		if (!S.sparkWrap || !S.sparkSvg) return;
		var s = S.samples;
		if (s.length < 2) {
			S.sparkWrap.hidden = true;
			S.sparkSvg.innerHTML = '';
			return;
		}
		var n = s.length;
		function pts(key) {
			return s.map(function (y, i) {
				return ((n === 1 ? 0 : i / (n - 1)) * 100).toFixed(2) + ',' + (46 - 2 - clamp(y[key], 0, 100) / 100 * 42).toFixed(2);
			}).join(' ');
		}
		S.sparkWrap.hidden = false;
		S.sparkSvg.innerHTML =
			'<polyline points="' + pts('f') + '" fill="none" stroke="#2563eb" stroke-width="1.2" vector-effect="non-scaling-stroke"/>' +
			'<polyline points="' + pts('d') + '" fill="none" stroke="#dc2626" stroke-width="1.2" vector-effect="non-scaling-stroke"/>';
		if (S.sparkLegend) S.sparkLegend.innerHTML =
			'<span style="color:#2563eb;">● attention focus, mean %</span>' +
			'<span style="color:#dc2626;">● dead FFN units, mean %</span>' +
			'<span style="color:var(--mn-text-muted,#64748b);"> · ' + n + ' checkpoints · epoch ' + (L ? L.epoch : s[n - 1].e) + '</span>';
	}

	function statusWaiting() {
		var el = S.statusEl;
		if (el) el.textContent = 'Weights are not initialised yet — start a training run (or re-run the demo) and the panel will begin measuring them live.';
	}

	function buildChrome() {
		log('chrome start readyState=' + document.readyState);
		var eq = [
			'<h3 style="margin-top:6px;">The bare equations behind these numbers</h3>',
			'',
			'For token $i$ attending to $j\\le i$ in a window of $T$ tokens, head $h$ of layer $\\ell$ forms scores with $d_k=d_{\\mathrm{model}}/n_{\\mathrm{heads}}$ dimensions per head,',
			'',
			'$$p_{ij}^{(h,\\ell)} = \\operatorname{softmax}_j\\!\\left(\\frac{(x_i^\\top W_Q^{(h,\\ell)})(x_j^\\top W_K^{(h,\\ell)})^\\top}{\\sqrt{d_k}} \\;+\\; \\underbrace{\\text{causal mask}}_{j>i\\, \\Rightarrow\\, -\\infty}\\right), \\qquad v_j^{(h,\\ell)} = x_j^\\top W_V^{(h,\\ell)}.$$',
			'',
			'The **concentration** reported for each head compares that head\'s attention entropy with the causal maximum $\\log_2(i{+}1)$ available to row $i$, averaged over rows $i=1,\\dots,T-1$:',
			'',
			'$$C_h = 1-\\frac{\\overline{H}_h}{H^{\\max}}, \\qquad H_h = -\\frac1T\\!\\sum_{i=1}^{T-1}\\sum_{j\\le i} p_{ij}^{(h,\\ell)}\\log_2 p_{ij}^{(h,\\ell)}, \\qquad H^{\\max} = \\frac1T\\!\\sum_{i=1}^{T-1}\\log_2(i{+}1).$$',
			'',
			'$C_h\\to 1$ means a near-deterministic router; $C_h\\to 0$ an averaging gate. Attention entropy **collapse** — heads drifting toward uniform, rank loss — is a known training failure that entropy-promoting regularisers target [Zhai et al. (2023)](https://arxiv.org/abs/2303.06296).',
			'',
			'“Effective rank ≈ r” means the *stable rank* $\\operatorname{sr}(M)=\\|M\\|_F^{\\,2}/\\sigma_{\\max}(M)^2$, the Frobenius norm squared against the largest singular value. Two products matter per head:',
			'',
			'$$\\operatorname{sr}(W_Q^{(h,\\ell)}W_K^{(h,\\ell)\\top}) = \\text{how many query directions}, \\qquad \\operatorname{sr}(W_V^{(h,\\ell)}W_O^{(h,\\ell)}) = \\text{how many write directions}.$$',
			'',
			'Rank-≈1 value→output circuits are the canonical minimal “write” of the shared residual stream [Elhage et al. (2021), *A Mathematical Framework for Transformer Circuits*](https://transformer-circuits.pub/2021/framework/index.html); when operator ranks across the stream compress, **dimensional collapse** [Wang et al. (2025)](https://arxiv.org/abs/2508.16929) can follow.',
			'',
			'A unit $u$ of the FFN is **dead** when its GeLU gate never opens on the probe tokens: $\\max_i\\big|\\mathrm{GeLU}(\\hat{x}_i^\\top W_1[:,u] + b_{1,u})\\big| < 10^{-3}$.',
			'',
			'Each layer writes $\\mathrm{Attn}(x) = \\big(\\textstyle\\mathrm{concat}_h\\, A^{(h,\\ell)}V^{(h,\\ell)}x\\big)W_O^{\\ell}$ then $\\mathrm{FFN}(x+\\mathrm{Attn})$, so the “write / ‖x‖” figures are $\\|\\mathrm{Attn}\\|_F/\\|x\\|_F$ and $\\|\\mathrm{FFN}\\|_F/\\|x\\|_F$. When heads steer one another through shared channels, inter-head “talking heads” behaviour appears [Merullo, Eickhoff &amp; Pavlick (2024)](https://arxiv.org/abs/2406.09519).'
		].join('\n');

		var panel = document.createElement('div');
		panel.id = 'transformer-layer-summary';
		panel.style.cssText = 'margin:20px 0; padding:18px; background:var(--mn-bg-subtle,#f8fafc); border:1px solid #e2e8f0; border-radius:12px;';

		panel.innerHTML =
			'<details id="tls-main" open>' +
			'<summary style="cursor:pointer; font-size:1.05rem; font-weight:700; color:var(--mn-text,#0f172a); padding:6px 0;">🧩 What each layer is doing — measured live from the weights</summary>' +
			'<p style="font-size:.85rem; color:var(--mn-text-muted,#64748b); margin:6px 0 12px; max-width:900px;">' +
			'Every layer reads and writes a shared <b>residual stream</b>. This panel reads the live weights and measures, purely by the math, how focused each attention head is, how deep (rank) its query-key and value-output circuits are, how many FFN units are dead, and how hard the layer pushes on the stream. Read the plain-language line first; “I want to know more” unfolds the numbers; the bare equations sit at the bottom.</p>' +
			'<div id="tls-status" style="font-size:.8rem; color:var(--mn-text-muted,#64748b); margin:0 0 10px;"></div>' +
			'<div id="tls-layers"></div>' +
			'<div id="tls-spark-wrap" hidden style="margin-top:12px; font-size:.8rem; color:var(--mn-text-muted,#475569);">' +
			'<div style="font-weight:700; margin-bottom:4px;">Training ↔ prediction, live</div>' +
			'<svg id="tls-spark" viewBox="0 0 100 46" preserveAspectRatio="none" style="width:100%; max-width:720px; height:56px; display:block; background:var(--mn-surface,#fff); border:1px solid #e2e8f0; border-radius:8px;"></svg>' +
			'<div id="tls-spark-legend" style="display:flex; gap:14px; flex-wrap:wrap; margin-top:4px;"></div>' +
			'</div>' +
			'<details id="tls-equations" style="margin-top:12px; font-size:.85rem;">' +
			'<summary style="cursor:pointer; font-weight:700; color:var(--mn-text,#334155);">… and the bare equations behind these numbers</summary>' +
			'<div class="md" style="max-width:900px; margin-top:8px;">' + eq + '</div>' +
			'</details>' +
			'</details>';

		var target = document.getElementById('tda-live-section');
		var fallback = document.getElementById('transformer_site');
		if (target && target.parentNode) target.parentNode.insertBefore(panel, target);
		else if (fallback) fallback.appendChild(panel);
		else document.body.appendChild(panel);

		S.main = panel;
		S.statusEl = $('#tls-status', panel);
		S.layersEl = $('#tls-layers', panel);
		S.sparkWrap = $('#tls-spark-wrap', panel);
		S.sparkSvg = $('#tls-spark', panel);
		S.sparkLegend = $('#tls-spark-legend', panel);
		log('chrome done');
	}

	function tick() {
		var w = win.currentWeights;
		if (!Array.isArray(w) || !w.length) { statusWaiting(); return; }
		var training = !!win.isTraining;
		var changed = training || w !== S.lastRef || w.length !== S.lastLen;
		if (!changed) return;
		var now = Date.now();
		var r;
		try { r = compute(); } catch (e) { log('compute error: ' + e.message); return; }
		if (!r) { statusWaiting(); return; }
		S.latest = r;
		if (training) {
			if (now - S.lastSampleAt > 1800) { S.lastSampleAt = now; pushSample(r); }
		} else {
			S.lastRef = w;
			S.lastLen = w.length;
		}
		render();
	}

	function boot() {
		log('boot');
		tick();
		win.setInterval(tick, 1200);
	}

	function start() {
		if (!Document.prototype.querySelector || !win.addEventListener) return;
		log('start');
		buildChrome();
		statusWaiting();
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', boot);
		} else {
			boot();
		}
		log('start done');
	}

	start();
})();