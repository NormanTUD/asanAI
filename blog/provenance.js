/* ═══════════════════════════════════════════════════════════════════════
   provenance.js — "Where does this number come from?"
   ───────────────────────────────────────────────────────────────────────
   Instruments the Transformer page so that every rendered number in the
   per-layer equations can be hovered to reveal its full computation:
     • the formula with ALL input numbers underbraced (with English
       explanations as the brace labels),
     • a list of the input values as clickable chips that drill down
       one step further (provenance chain, breadcrumb navigation).

   How it works
   ────────────
   1. During the forward pass, `Prov.recordLayer / recordFfn / recordPre /
      recordFinal` store every intermediate matrix/vector/parameter in a
      central registry, keyed by a stable grid id (e.g. `L:1:norm`,
      `L:2:head:0:alpha`, `F:logit`).
   2. After Temml has rendered a section, `Prov.apply(el, mappings)` walks
      the rendered <math> DOM, value-matches each <mtd> cell against the
      registry and stamps it with `data-prov-id` + class `prov-cell`.
   3. A document-level mouseover listener shows the tooltip; node
      "materializers" lazily rebuild the formula + inputs from the
      registry whenever the tooltip content is needed.

   Number consistency:
     • Every displayed value is written with v.toFixed(nr_fixed) (4 dp).
       The registry therefore stores raw values and re-derives the
       expected 4-dp string for matching — cells that do not match the
       recorded data are simply not annotated (safe fallback).
     • When a grid is re-recorded with DIFFERENT data (e.g. the final
       pass overwriting the training-mode visualization), all cells that
       pointed at it are invalidated, so stale tooltips never appear.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
	'use strict';

	var S = (window.Prov = {
		_grids: new Map(),
		_matCache: Object.create(null),
		_layerMeta: new Map(),
		_finalMeta: null,
		_stack: [],
		_pinned: false,
		_hideTimer: null,
		_bound: false
	});

	/* ───────────────────────── small helpers ───────────────────────── */
	function num(v) { return (typeof v === 'number' && isFinite(v)) ? v : 0; }

	function fmt(v, dec) { return num(v).toFixed(dec === undefined ? 4 : dec); }

	function _cell(grid, i, j) {
		if (!grid) return undefined;
		if (grid.isVec) return grid.data[j];
		return grid.data[i] && grid.data[i][j];
	}

	function _rowNum(grid, r, c) {
		if (!grid) return undefined;
		return grid.isVec ? grid.data[c] : (grid.data[r] ? grid.data[r][c] : undefined);
	}

	function _entropy(probs) {
		return -probs.reduce(function (s, p) {
			return s + (p > 1e-12 ? p * Math.log2(p) : 0);
		}, 0);
	}

	/* Escape a string for use inside \text{...} in LaTeX. */
	function texSafe(s) {
		if (typeof s !== 'string') s = String(s);
		return s
			.replace(/\\/g, '\\textbackslash{}')
			.replace(/#/g, '\\#')
			.replace(/_/g, '\\_')
			.replace(/&/g, '\\&')
			.replace(/%/g, '\\%')
			.replace(/{/g, '\\{')
			.replace(/}/g, '\\}');
	}

	/* Escape a string for use inside an HTML attribute value. Node ids
	   are registry lookup keys and must round-trip unmodified, so they
	   must NOT go through texSafe (which would escape underscores). */
	function attrSafe(s) {
		if (typeof s !== 'string') s = String(s);
		return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	/* Token for display: spaces → ␣ */
	function dispToken(t) { return String(t).replace(/ /g, '␣'); }

	/* ───────────────────────── registry ───────────────────────── */
	function _invalidate(key) {
		var prefix = key + ':';
		var cells = document.querySelectorAll('[data-prov-id^="' + prefix + '"]');
		for (var i = 0; i < cells.length; i++) {
			cells[i].removeAttribute('data-prov-id');
			cells[i].classList.remove('prov-cell');
		}
	}

	function _record(key, data, opts) {
		if (data === undefined || data === null) return;
		opts = opts || {};
		var isVec = (opts.isVec !== undefined)
			? opts.isVec
			: (!Array.isArray(data) || !Array.isArray(data[0]));
		var sig;
		try { sig = JSON.stringify(data); } catch (e) { sig = String(data); }
		var prev = S._grids.get(key);
		if (prev && prev.sig !== sig) _invalidate(key);
		S._grids.set(key, {
			key: key,
			data: data,
			sig: sig,
			isVec: isVec,
			scale: opts.scale || 1,
			dec: opts.dec !== undefined ? opts.dec : (typeof nr_fixed !== 'undefined' ? nr_fixed : 4),
			nodeId: opts.nodeId || null,
			meta: opts.meta || null
		});
		// stale materialized nodes must be recomputed
		S._matCache = Object.create(null);
	}

	function _grid(key) { return S._grids.get(key) || null; }

	/* ─────────────────────── recording API ─────────────────────── */

	/**
	 * Record the initial hidden states h_0 = embedding + positional encoding
	 * for `tokens`. Called with the tokens that actually produced the h0
	 * that is being visualized.
	 */
	S.recordPre = function (tokens, d_model, embSpace) {
		embSpace = embSpace || (window.persistentEmbeddingSpace || {});
		var d = num(d_model) || 3;
		S._d_model = d;
		var scalar = (typeof posEmbedScalar !== 'undefined') ? posEmbedScalar : 1;
		var emb = [], pe = [], h0 = [];
		for (var p = 0; p < tokens.length; p++) {
			var token = tokens[p];
			var e = embSpace[token] || new Array(d).fill(0);
			var pev = [];
			for (var i = 0; i < d; i++) {
				var divTerm = Math.pow(10000, (2 * Math.floor(i / 2)) / d);
				pev[i] = ((i % 2 === 0) ? Math.sin(p / divTerm) : Math.cos(p / divTerm)) * scalar;
			}
			emb.push(e);
			pe.push(pev);
			h0.push(e.map(function (v, ii) { return v + pev[ii]; }));
		}
		_record('P:emb', emb, { meta: { tokens: tokens } });
		_record('P:pe', pe, { meta: { tokens: tokens } });
		_record('P:h0', h0, { meta: { tokens: tokens } });
	};

	/**
	 * Record the attention sublayer of layer `layerIndex` (0-based).
	 */
	S.recordLayer = function (layerIndex, opt) {
		var L = layerIndex + 1;
		var d_model = num(opt.d_model);
		var n_heads = num(opt.n_heads) || 1;
		var d_k = d_model / n_heads;
		var seqLen = opt.h_in ? opt.h_in.length : (opt.norm ? opt.norm.length : 0);
		S._layerMeta.set(L, {
			L: L,
			tokens: opt.tokens || null,
			d_model: d_model,
			n_heads: n_heads,
			d_k: d_k,
			seqLen: seqLen
		});

		_record('L:' + L + ':hin', opt.h_in);
		_record('L:' + L + ':norm', opt.norm);
		_record('L:' + L + ':gamma', opt.gamma, { isVec: true });
		_record('L:' + L + ':beta', opt.beta, { isVec: true });
		_record('L:' + L + ':Wo', opt.Wo);
		_record('L:' + L + ':concat', opt.concat);
		_record('L:' + L + ':proj', opt.proj);
		_record('L:' + L + ':h1', opt.h1);

		if (opt.h_in) {
			var mu = opt.h_in.map(function (row) {
				return row.reduce(function (a, b) { return a + b; }, 0) / row.length;
			});
			var vr = opt.h_in.map(function (row) {
				var m = row.reduce(function (a, b) { return a + b; }, 0) / row.length;
				return row.reduce(function (a, b) { return a + Math.pow(b - m, 2); }, 0) / row.length;
			});
			_record('L:' + L + ':mu', mu, { isVec: true });
			_record('L:' + L + ':var', vr, { isVec: true });
		}

		if (opt.headData && Array.isArray(opt.headData)) {
			var att = opt.attention || {};
			var Wq = att.query || [], Wk = att.key || [], Wv = att.value || [];
			for (var h = 0; h < opt.headData.length; h++) {
				var hd = opt.headData[h];
				var p = 'L:' + L + ':head:' + h;
				var off = h * d_k;
				_record(p + ':Wq', Wq.map(function (r) { return r.slice(off, off + d_k); }));
				_record(p + ':Wk', Wk.map(function (r) { return r.slice(off, off + d_k); }));
				_record(p + ':Wv', Wv.map(function (r) { return r.slice(off, off + d_k); }));
				_record(p + ':q', hd.q || hd.Qi);
				_record(p + ':k', hd.k || hd.Ki);
				_record(p + ':v', hd.v || hd.Vi);
				_record(p + ':scores', hd.scores);
				_record(p + ':alpha', hd.weights || hd.this_weights);
				_record(p + ':ctx', hd.context);
			}
		}
	};

	/**
	 * Record the FFN sublayer of layer `layerIndex` (0-based).
	 */
	S.recordFfn = function (layerIndex, opt) {
		var L = layerIndex + 1;
		_record('L:' + L + ':gamma2', opt.gamma2, { isVec: true });
		_record('L:' + L + ':beta2', opt.beta2, { isVec: true });
		_record('L:' + L + ':norm2', opt.norm2);
		_record('L:' + L + ':W1', opt.W1);
		_record('L:' + L + ':b1', opt.b1, { isVec: true });
		_record('L:' + L + ':outL1', opt.outL1);
		_record('L:' + L + ':W2', opt.W2);
		_record('L:' + L + ':b2', opt.b2, { isVec: true });
		_record('L:' + L + ':outFFN', opt.outFFN);
		_record('L:' + L + ':h2', opt.h2);

		if (opt.h1) {
			var mu = opt.h1.map(function (row) {
				return row.reduce(function (a, b) { return a + b; }, 0) / row.length;
			});
			var vr = opt.h1.map(function (row) {
				var m = row.reduce(function (a, b) { return a + b; }, 0) / row.length;
				return row.reduce(function (a, b) { return a + Math.pow(b - m, 2); }, 0) / row.length;
			});
			_record('L:' + L + ':mu2', mu, { isVec: true });
			_record('L:' + L + ':var2', vr, { isVec: true });
		}
	};

	/**
	 * Record the final (unembedding → softmax → temperature) stage.
	 */
	S.recordFinal = function (opt) {
		var logitValues = opt.logitValues;
		var originalProbs = opt.originalProbs;
		var scaledProbs = opt.scaledProbs;
		var temperature = num(opt.temperature) || 1;
		var vocabSize = num(opt.vocabSize) || 1;
		S._finalMeta = {
			vocabWords: opt.vocabulary || [],
			temperature: temperature,
			vocabSize: vocabSize,
			seqLen: opt.h_final ? opt.h_final.length : 0,
			lastLayer: num(opt.lastLayer) || 1
		};

		_record('F:h_last', opt.h_last, {
			isVec: true,
			nodeId: function (i, j) { return 'F:h_last:0:' + j; }
		});
		_record('F:Wv', opt.W_vocab);
		_record('F:logits', logitValues, {
			isVec: true,
			nodeId: function (i, j) { return 'F:logit:' + j; }
		});
		_record('F:probs', originalProbs, {
			isVec: true,
			nodeId: function (i, j) { return 'F:prob:' + j; }
		});
		_record('F:sprobs', scaledProbs, {
			isVec: true,
			nodeId: function (i, j) { return 'F:sprob:' + j; }
		});
		var diffs = originalProbs.map(function (p, i) { return scaledProbs[i] - p; });
		_record('F:delta', diffs, {
			isVec: true,
			nodeId: function (i, j) { return 'F:delta:' + j; }
		});
		var eo = _entropy(originalProbs);
		var es = _entropy(scaledProbs);
		var em = Math.log2(vocabSize);
		_record('F:ent_orig', [eo], { isVec: true, nodeId: function () { return 'F:ent:orig'; } });
		_record('F:ent_scaled', [es], { isVec: true, nodeId: function () { return 'F:ent:scaled'; } });
		_record('F:ent_max', [em], { isVec: true, nodeId: function () { return 'F:ent:max'; } });
		_record('F:probs_pct', originalProbs.map(function (p) { return p * 100; }), { isVec: true, dec: 2 });
		_record('F:sprobs_pct', scaledProbs.map(function (p) { return p * 100; }), { isVec: true, dec: 2 });
		_record('F:delta_pct', scaledProbs.map(function (p, i) { return (p - originalProbs[i]) * 100; }), { isVec: true, dec: 2 });
		var logitSum = logitValues.reduce(function (s, l) { return s + Math.exp(l); }, 0);
		var scaledLogitSum = logitValues.reduce(function (s, l) { return s + Math.exp(l / temperature); }, 0);
		_record('F:ssum', [logitSum], { isVec: true });
		_record('F:spowsum', [scaledLogitSum], { isVec: true });
	};

	/* ─────────────────────── DOM annotation ─────────────────────── */

	/**
	 * Extract the numeric value of a rendered <mtd>/<mn>. Returns null
	 * when the cell contains no parsable number.
	 */
	function _mnVal(el) {
		var t = (el.textContent || '').trim();
		// Temml renders the minus sign as U+2212; parseFloat only accepts ASCII '-'.
		t = t.replace(/\u2212/g, '-').replace(/\u2213/g, '-');
		t = t.replace(/%$/, '').replace(/^\+/, '');
		if (t === '') return null;
		var v = parseFloat(t);
		return isFinite(v) ? v : null;
	}

	function _tableCells(tbl) {
		var out = [];
		var mtrs = Array.prototype.filter.call(tbl.children, function (c) { return (c.tagName || '').toUpperCase() === 'MTR'; });
		for (var r = 0; r < mtrs.length; r++) {
			var cells = [];
			var mtds = Array.prototype.filter.call(mtrs[r].children, function (c) { return (c.tagName || '').toUpperCase() === 'MTD'; });
			for (var c = 0; c < mtds.length; c++) {
				var v = _mnVal(mtds[c]);
				if (v !== null) cells.push({ col: c, val: v, el: mtds[c] });
			}
			if (cells.length) out.push({ mtr: mtrs[r], cells: cells });
		}
		return out;
	}

	/* For full-matrix matching: does the table have a non-numeric label
	   column in front of the numbers? */
	function _offset(rows) {
		if (!rows.length) return 0;
		for (var i = 0; i < rows.length; i++) {
			var cells = rows[i].cells;
			if (cells.length && cells[0].col === 0) return 0;
		}
		return 1;
	}

	function _bind(el, grid, r, jc) {
		var raw = _rowNum(grid, r, jc);
		if (raw === undefined) return;
		var expected = (raw * grid.scale).toFixed(grid.dec);
		var v = _mnVal(el);
		if (v === null || v.toFixed(grid.dec) !== expected) return;
		var id = grid.nodeId
			? grid.nodeId(r, jc)
			: (grid.isVec ? grid.key + ':' + jc : grid.key + ':' + r + ':' + jc);
		el.setAttribute('data-prov-id', id);
		el.classList.add('prov-cell');
	}

	function _matchTable(tbl, entry) {
		var rows = _tableCells(tbl);
		if (!rows.length) return false;
		var match = 0, total = 0;
		var check = function (cell, r, grid, jc) {
			if (!grid) return;
			total++;
			var raw = _rowNum(grid, r, jc);
			if (raw === undefined) return;
			if (cell.val.toFixed(grid.dec) === (raw * grid.scale).toFixed(grid.dec)) match++;
		};

		if (entry.oneCol !== undefined) {
			var g1 = _grid(entry.grid);
			if (!g1) return false;
			for (var i = 0; i < rows.length; i++) {
				var c1 = rows[i].cells.filter(function (x) { return x.col === entry.oneCol; })[0];
				if (c1) check(c1, i, g1, i);
			}
		} else if (entry.cols) {
			for (var ci = 0; ci < entry.cols.length; ci++) {
				var spec = entry.cols[ci];
				var g2 = _grid(spec.grid);
				if (!g2) return false;
				for (var j = 0; j < rows.length; j++) {
					var c2 = rows[j].cells.filter(function (x) { return x.col === spec.col; })[0];
					if (c2) check(c2, j, g2, j);
				}
			}
		} else if (entry.vec !== undefined) {
			var gv = _grid(entry.vec);
			if (!gv) return false;
			var voff = _offset(rows);
			for (var vj = 0; vj < rows.length; vj++) {
				var vrow = rows[vj];
				for (var vm = 0; vm < vrow.cells.length; vm++) {
					check(vrow.cells[vm], 0, gv, vrow.cells[vm].col - voff);
				}
			}
		} else {
			var g3 = _grid(entry.grid);
			if (!g3) return false;
			var off = _offset(rows);
			for (var k = 0; k < rows.length; k++) {
				var row = rows[k];
				for (var m2 = 0; m2 < row.cells.length; m2++) {
					check(row.cells[m2], k, g3, row.cells[m2].col - off);
				}
			}
		}
		return total > 0 && (match / total) >= 0.8;
	}

	function _annotateTable(tbl, entry) {
		var rows = _tableCells(tbl);
		if (entry.oneCol !== undefined) {
			var g1 = _grid(entry.grid);
			if (!g1) return;
			for (var i = 0; i < rows.length; i++) {
				var c1 = rows[i].cells.filter(function (x) { return x.col === entry.oneCol; })[0];
				if (c1) _bind(c1.el, g1, i, i);
			}
			return;
		}
		if (entry.cols) {
			for (var ci = 0; ci < entry.cols.length; ci++) {
				var spec = entry.cols[ci];
				var g2 = _grid(spec.grid);
				if (!g2) continue;
				for (var j = 0; j < rows.length; j++) {
					var c2 = rows[j].cells.filter(function (x) { return x.col === spec.col; })[0];
					if (c2) _bind(c2.el, g2, j, j);
				}
			}
			return;
		}
		if (entry.vec !== undefined) {
			var gv = _grid(entry.vec);
			if (!gv) return;
			var voff = _offset(rows);
			for (var vj = 0; vj < rows.length; vj++) {
				var vrow = rows[vj];
				for (var vm = 0; vm < vrow.cells.length; vm++) {
					_bind(vrow.cells[vm].el, gv, 0, vrow.cells[vm].col - voff);
				}
			}
			return;
		}
		var g3 = _grid(entry.grid);
		if (!g3) return;
		var off = _offset(rows);
		for (var k = 0; k < rows.length; k++) {
			var row = rows[k];
			for (var m2 = 0; m2 < row.cells.length; m2++) {
				_bind(row.cells[m2].el, g3, k, row.cells[m2].col - off);
			}
		}
	}

	/**
	 * Annotate inline numbers (e.g. the h_last row and the entropy values)
	 * that are rendered as plain <mn> inside <math> (not inside a table).
	 * `grids` is an ordered list of grid keys; the DOM numbers are
	 * consumed in document order, each binding to the next matching entry.
	 */
	S._annotateInlineNums = function (container, grids) {
		var mns = Array.prototype.filter.call(
			container.querySelectorAll('math mn'),
			function (mn) { return !mn.closest('mtd'); }
		);
		var counts = grids.map(function () { return 0; });
		for (var i = 0; i < mns.length; i++) {
			var v = _inlineVal(mns[i]);
			if (v === null) continue;
			for (var gi = 0; gi < grids.length; gi++) {
				var grid = _grid(grids[gi]);
				if (!grid) continue;
				if (counts[gi] >= grid.data.length) continue;
				var expected = (grid.data[counts[gi]] * grid.scale).toFixed(grid.dec);
				if (v.toFixed(grid.dec) !== expected) continue;
				var id = grid.nodeId
					? grid.nodeId(0, counts[gi])
					: (grid.isVec ? grid.key + ':' + counts[gi] : grid.key + ':0:' + counts[gi]);
				mns[i].setAttribute('data-prov-id', id);
				mns[i].classList.add('prov-cell');
				counts[gi]++;
				break;
			}
		}
	};

	/* Numeric value of an inline <mn>, accounting for a preceding minus
	   sign rendered as a separate <mo> element by Temml. */
	function _inlineVal(mn) {
		var prev = mn.previousElementSibling;
		var t = (mn.textContent || '').trim();
		if (prev && (prev.tagName || '').toUpperCase() === 'MO' && /^[-\u2212]$/.test((prev.textContent || '').trim())) {
			t = '-' + t;
		}
		return _mnVal({ textContent: t });
	}

	/**
	 * Annotate a rendered container.
	 *   entries: [
	 *     { grid: 'L:1:norm' },                                  // full matrix
	 *     { grid: 'F:h_last', oneCol: 0 },                        // single column
	 *     { cols: [{ grid:'F:probs', col:1 }, { grid:'F:sprobs', col:2 }] },
	 *     { inline: true, grids: ['F:h_last', 'F:ent_orig'] }     // inline numbers
	 *   ]
	 */
	S.apply = function (el, entries) {
		if (!el || !el.querySelectorAll) return;
		entries = Array.isArray(entries) ? entries : [entries];
		var tables = Array.prototype.filter.call(
			el.querySelectorAll('math mtable'),
			function (t) { return (t.tagName || '').toUpperCase() === 'MTABLE'; }
		);
		var ti = 0;
		for (var i = 0; i < entries.length; i++) {
			var entry = entries[i];
			if (entry.inline) {
				S._annotateInlineNums(el, entry.grids);
				continue;
			}
			var hasGrid = entry.grid && _grid(entry.grid);
			var hasVec = entry.vec && _grid(entry.vec);
			var hasCols = Array.isArray(entry.cols) && entry.cols.some(function (s) { return _grid(s.grid); });
			if (!hasGrid && !hasCols && !hasVec) continue;
			for (var k = ti; k < tables.length; k++) {
				if (_matchTable(tables[k], entry)) {
					_annotateTable(tables[k], entry);
					ti = k + 1;
					break;
				}
			}
		}
	};

	/* ─────────────── materialized node helpers ─────────────── */

	function _gval(gridId, r, c) {
		var g = _grid(gridId);
		if (!g) return undefined;
		if (g.isVec) return g.data[c];
		if (g.data[r]) return g.data[r][c];
		return undefined;
	}

	function _ub(tex, label) {
		return '\\underbrace{' + tex + '}_{\\text{' + texSafe(label) + '}}';
	}

	function _node(o) {
		return { id: o.id, value: o.value, name: o.name, badge: o.badge, formula: o.formula, inputs: o.inputs || [] };
	}

	function _chip(id, name, badge, value) {
		return { id: id, name: name, badge: badge, value: value };
	}

	function _tokOf(layer) {
		var meta = S._layerMeta.get(layer);
		return meta ? meta.tokens : null;
	}

	function _tokDisp(layer, p) {
		var t = _tokOf(layer);
		if (!t || !t[p]) return 'token ' + p;
		return '"' + dispToken(t[p]) + '"';
	}

	function _dModel() {
		if (S._d_model) return S._d_model;
		var meta = S._layerMeta.values().next().value;
		return meta ? meta.d_model : 3;
	}

	/* join underbraced terms, trimming when there are more than `max` */
	function _plusTerms(terms, max) {
		var shown = terms.slice(0, max);
		var s = shown.map(function (t) { return t.tex; }).join(' + ');
		if (terms.length > max) s += ' + \\cdots';
		return s;
	}

	/* ─────────────── P: pre-attention materializers ─────────────── */

	function _matPScalar() {
		var scalar = (typeof posEmbedScalar !== 'undefined') ? posEmbedScalar : 1;
		return _node({
			id: 'P:scalar',
			value: scalar,
			name: 'posEmbedScalar',
			badge: 'config constant',
			formula: 'posEmbedScalar = ' + fmt(scalar),
			inputs: []
		});
	}

	function _matPbase(p, i) {
		var d = _dModel();
		var base = Math.pow(10000, (2 * Math.floor(i / 2)) / d);
		return _node({
			id: 'P:base:' + p + ':' + i,
			value: base,
			name: 'ω_{' + i + '}',
			badge: 'frequency, dimension ' + i,
			formula: '\\omega_{' + i + '} = 10000^{2\\lfloor ' + i + '/2\\rfloor/' + d + '} = ' + fmt(base),
			inputs: []
		});
	}

	function _matPtrig(p, i) {
		var d = _dModel();
		var base = Math.pow(10000, (2 * Math.floor(i / 2)) / d);
		var isSin = (i % 2 === 0);
		var trig = isSin ? Math.sin(p / base) : Math.cos(p / base);
		return _node({
			id: 'P:trig:' + p + ':' + i,
			value: trig,
			name: (isSin ? '\\sin' : '\\cos') + '(' + p + '\\cdot\\omega_{' + i + '}^{-1})',
			badge: 'positional trig term',
			formula: (isSin ? '\\sin' : '\\cos') + '\\left(' + _ub(fmt(trig), 'p = ' + p) + '\\right)',
			inputs: []
		});
	}

	function _matPemb(p, i) {
		var g = _grid('P:emb');
		var tok = g && g.meta && g.meta.tokens ? g.meta.tokens[p] : null;
		return _node({
			id: 'P:emb:' + p + ':' + i,
			value: _gval('P:emb', p, i),
			name: 'e_{' + p + '}[' + i + ']',
			badge: 'embedding of ' + (tok != null ? '"' + dispToken(tok) + '"' : 'token ' + p),
			formula: 'e_{' + p + '}[' + i + '] = ' + _ub(fmt(_gval('P:emb', p, i)), 'lookup of ' + (tok != null ? '"' + dispToken(tok) + '"' : 'token ' + p) + ' in the embedding table'),
			inputs: []
		});
	}

	function _matPpe(p, i) {
		var scalar = (typeof posEmbedScalar !== 'undefined') ? posEmbedScalar : 1;
		var d = _dModel();
		var base = Math.pow(10000, (2 * Math.floor(i / 2)) / d);
		var isSin = (i % 2 === 0);
		var trig = isSin ? Math.sin(p / base) : Math.cos(p / base);
		var val = _gval('P:pe', p, i);
		return _node({
			id: 'P:pe:' + p + ':' + i,
			value: val,
			name: 'PE_{' + p + '}[' + i + ']',
			badge: 'positional encoding, token ' + p + ', dim ' + i,
			formula: 'PE_{' + p + '}[' + i + '] = ' +
				_ub(fmt(scalar), 'posEmbedScalar') + '\\cdot' +
				_ub(fmt(trig), (isSin ? '\\sin' : '\\cos') + '(p\\cdot\\omega_{' + i + '}^{-1})') +
				'\\; =\\;' + _ub(fmt(val), 'scaled positional encoding'),
			inputs: [
				_chip('P:scalar', 'posEmbedScalar', 'config constant', scalar),
				_chip('P:base:' + p + ':' + i, 'ω_{' + i + '}', 'frequency', base),
				_chip('P:trig:' + p + ':' + i, (isSin ? '\\sin' : '\\cos') + ' term', 'positional trig term', trig)
			]
		});
	}

	function _matPh0(p, i) {
		var embV = _gval('P:emb', p, i);
		var peV = _gval('P:pe', p, i);
		var val = _gval('P:h0', p, i);
		return _node({
			id: 'P:h0:' + p + ':' + i,
			value: val,
			name: 'h_0[' + p + '][' + i + ']',
			badge: 'initial hidden state',
			formula: 'h_0[' + p + '][' + i + '] = ' +
				_ub(fmt(embV), 'embedding of ' + _tokDisp(0, p)) + ' + ' +
				_ub(fmt(peV), 'positional encoding') +
				'\\; =\\;' + _ub(fmt(val), 'h_0'),
			inputs: [
				_chip('P:emb:' + p + ':' + i, 'e_{' + p + '}[' + i + ']', 'embedding', embV),
				_chip('P:pe:' + p + ':' + i, 'PE_{' + p + '}[' + i + ']', 'positional encoding', peV)
			]
		});
	}

	/* ─────────────── LayerNorm materializer (shared) ─────────────── */

	function _lnNode(L, is2, p, i) {
		var sfx = is2 ? '2' : '';
		var base = 'L:' + L;
		var hin = is2 ? 'h1' : 'hin';
		var hInV = _gval(base + ':' + hin, p, i);
		var muV = _gval(base + ':mu' + sfx, 0, p);
		var varV = _gval(base + ':var' + sfx, 0, p);
		var eps = (typeof epsilon !== 'undefined') ? epsilon : 1e-6;
		var sigma = Math.sqrt(num(varV) + eps);
		var z = (hInV - muV) / sigma;
		var gammaV = _gval(base + ':gamma' + sfx, 0, i);
		var betaV = _gval(base + ':beta' + sfx, 0, i);
		var val = z * gammaV + betaV;
		var nm = (is2 ? 'ln_2' : 'ln_1') + '[' + p + '][' + i + ']';
		return _node({
			id: base + ':norm' + sfx + ':' + p + ':' + i,
			value: val,
			name: nm,
			badge: 'LayerNorm ' + (is2 ? '2' : '1') + ' output · Layer ' + L + ', token ' + p + ', dim ' + i,
			formula: nm + ' = \\left( ' +
				_ub(fmt(hInV), (is2 ? 'h_1' : 'h_{in}') + '[' + p + '][' + i + ']') + ' - ' +
				_ub(fmt(muV), 'mean μ over dims') +
				'\\right) \\Big/ \\underbrace{\\sqrt{' + fmt(varV) + ' + 10^{-6}}}_{\\text{std }} ' +
				'\\cdot ' + _ub(fmt(gammaV), 'scale γ_{' + i + '}') + ' + ' +
				_ub(fmt(betaV), 'shift β_{' + i + '}') +
				'\\; =\\;' + _ub(fmt(val), 'layer-normalized'),
			inputs: [
				_chip(base + ':' + hin + ':' + p + ':' + i, (is2 ? 'h_1' : 'h_{in}') + '[' + p + '][' + i + ']', 'input value', hInV),
				_chip(base + ':mu' + sfx + ':' + p, 'μ_{' + p + '}', 'mean over dims', muV),
				_chip(base + ':std' + sfx + ':' + p, 'σ_{' + p + '}', 'std = sqrt(var + ε)', sigma),
				_chip(base + ':gamma' + sfx + ':' + i, 'γ_{' + i + '}', 'learned scale', gammaV),
				_chip(base + ':beta' + sfx + ':' + i, 'β_{' + i + '}', 'learned shift', betaV)
			]
		});
	}

	function _matMuNode(L, is2, p) {
		var sfx = is2 ? '2' : '';
		var base = 'L:' + L;
		var d = _dModel();
		var hin = is2 ? 'h1' : 'hin';
		var terms = [];
		for (var k = 0; k < d; k++) {
			terms.push({ tex: _ub(fmt(_gval(base + ':' + hin, p, k)), (is2 ? 'h_1' : 'h_{in}') + '[' + p + '][' + k + ']') });
		}
		var val = _gval(base + ':mu' + sfx, 0, p);
		return _node({
			id: base + ':mu' + sfx + ':' + p,
			value: val,
			name: 'μ_{' + p + '}',
			badge: 'mean of ' + (is2 ? 'h_1' : 'h_{in}') + '[' + p + '][:]',
			formula: '\\mu_{' + p + '} = \\frac{1}{' + d + '}\\left( ' + _plusTerms(terms, 4) + ' \\right) = ' + _ub(fmt(val), 'mean'),
			inputs: []
		});
	}

	function _matVarNode(L, is2, p) {
		var sfx = is2 ? '2' : '';
		var base = 'L:' + L;
		var d = _dModel();
		var hin = is2 ? 'h1' : 'hin';
		var muV = _gval(base + ':mu' + sfx, 0, p);
		var terms = [];
		for (var k = 0; k < d; k++) {
			var diff = _gval(base + ':' + hin, p, k) - muV;
			terms.push({ tex: _ub(fmt(diff * diff), '(' + (is2 ? 'h_1' : 'h_{in}') + '[' + p + '][' + k + ']-μ)^2') });
		}
		var val = _gval(base + ':var' + sfx, 0, p);
		return _node({
			id: base + ':var' + sfx + ':' + p,
			value: val,
			name: 'var_{' + p + '}',
			badge: 'variance of ' + (is2 ? 'h_1' : 'h_{in}') + '[' + p + '][:]',
			formula: '\\mathrm{var}_{' + p + '} = \\frac{1}{' + d + '}\\left( ' + _plusTerms(terms, 4) + ' \\right) = ' + _ub(fmt(val), 'variance'),
			inputs: []
		});
	}

	function _matStdNode(L, is2, p) {
		var sfx = is2 ? '2' : '';
		var base = 'L:' + L;
		var varV = _gval(base + ':var' + sfx, 0, p);
		var eps = (typeof epsilon !== 'undefined') ? epsilon : 1e-6;
		var val = Math.sqrt(num(varV) + eps);
		return _node({
			id: base + ':std' + sfx + ':' + p,
			value: val,
			name: 'σ_{' + p + '}',
			badge: 'standard deviation',
			formula: '\\sigma_{' + p + '} = \\sqrt{' + fmt(varV) + ' + 10^{-6}} = ' + _ub(fmt(val), 'std dev'),
			inputs: [_chip(base + ':var' + sfx + ':' + p, 'var_{' + p + '}', 'variance', varV)]
		});
	}

	function _matZnode(L, is2, p, i) {
		var sfx = is2 ? '2' : '';
		var base = 'L:' + L;
		var hin = is2 ? 'h1' : 'hin';
		var hInV = _gval(base + ':' + hin, p, i);
		var muV = _gval(base + ':mu' + sfx, 0, p);
		var varV = _gval(base + ':var' + sfx, 0, p);
		var eps = (typeof epsilon !== 'undefined') ? epsilon : 1e-6;
		var val = (hInV - muV) / Math.sqrt(num(varV) + eps);
		return _node({
			id: base + ':znorm' + sfx + ':' + p + ':' + i,
			value: val,
			name: 'z_{' + p + '}[' + i + ']',
			badge: 'normalized (before γ/β)',
			formula: 'z = ' + _ub(fmt(hInV), (is2 ? 'h_1' : 'h_{in}') + '[' + p + '][' + i + ']') + ' - ' + _ub(fmt(muV), 'μ_{' + p + '}') +
				' \\Big/ \\underbrace{\\sqrt{' + fmt(varV) + '+10^{-6}}}_{\\sigma_{' + p + '}} = ' + _ub(fmt(val), 'z'),
			inputs: [
				_chip(base + ':' + hin + ':' + p + ':' + i, (is2 ? 'h_1' : 'h_{in}') + '[' + p + '][' + i + ']', 'input', hInV),
				_chip(base + ':mu' + sfx + ':' + p, 'μ_{' + p + '}', 'mean', muV),
				_chip(base + ':std' + sfx + ':' + p, 'σ_{' + p + '}', 'std dev', Math.sqrt(num(varV) + eps))
			]
		});
	}

	function _matGammaBeta(L, is2, i, which) {
		var sfx = is2 ? '2' : '';
		var base = 'L:' + L;
		var gridId = base + ':' + which + sfx;
		var val = _gval(gridId, 0, i);
		var label = which === 'gamma' ? 'scale' : 'shift';
		return _node({
			id: gridId + ':' + i,
			value: val,
			name: '\\' + which + '_{' + i + '}',
			badge: 'learned parameter · LayerNorm ' + (is2 ? 2 : 1),
			formula: '\\' + which + '_{' + i + '} = ' + _ub(fmt(val), 'LayerNorm ' + label),
			inputs: []
		});
	}

	/* ─────────────── attention head materializers ─────────────── */

	function _matHeadCell(L, h, kind, r, c) {
		var base = 'L:' + L + ':head:' + h + ':' + kind;
		var val = _gval(base, r, c);
		var labels = {
			q: { nm: 'q', badge: 'query, head ' + h },
			k: { nm: 'k', badge: 'key, head ' + h },
			v: { nm: 'v', badge: 'value, head ' + h },
			Wq: { nm: 'W^q', badge: 'query weights, head ' + h },
			Wk: { nm: 'W^k', badge: 'key weights, head ' + h },
			Wv: { nm: 'W^v', badge: 'value weights, head ' + h }
		};
		var Lb = labels[kind] || { nm: kind, badge: kind };
		return _node({
			id: base + ':' + r + ':' + c,
			value: val,
			name: Lb.nm + '_{' + r + '}[' + c + ']',
			badge: Lb.badge + ' · Layer ' + L,
			formula: Lb.nm + '_{' + r + '}[' + c + '] = ' + _ub(fmt(val), Lb.badge),
			inputs: []
		});
	}

	function _matQNode(L, h, p, i) {
		var base = 'L:' + L + ':head:' + h;
		var d = _dModel();
		var dk = _grid(base + ':q').data[0].length;
		var terms = [];
		for (var k = 0; k < d; k++) {
			terms.push({
				tex: _ub(fmt(_gval('L:' + L + ':hin', p, k)), 'h_{in}[' + p + '][' + k + ']') + '\\cdot' +
					_ub(fmt(_gval(base + ':Wq', k, i)), 'W^q_{' + k + '}[' + i + ']'),
				key: k
			});
		}
		var val = _gval(base + ':q', p, i);
		return _node({
			id: base + ':q:' + p + ':' + i,
			value: val,
			name: 'q_{' + p + '}[' + i + ']',
			badge: 'query, head ' + h + ' · Layer ' + L + ', token ' + p,
			formula: 'q_{' + p + '}[' + i + '] = ' + _plusTerms(terms, 3) + ' = ' + _ub(fmt(val), 'query'),
			inputs: [
				_chip('L:' + L + ':hin:' + p + ':0', 'h_{in}[' + p + '][0]', 'input', _gval('L:' + L + ':hin', p, 0)),
				_chip(base + ':Wq:0:' + i, 'W^q_{0}[' + i + ']', 'query weights', _gval(base + ':Wq', 0, i))
			]
		});
	}

	function _matScoreNode(L, h, p, j) {
		var base = 'L:' + L + ':head:' + h;
		var dk = _grid(base + ':k').data[0].length;
		var inv = 1 / Math.sqrt(dk);
		var terms = [];
		for (var k = 0; k < dk; k++) {
			terms.push({
				tex: _ub(fmt(_gval(base + ':q', p, k)), 'q_{' + p + '}[' + k + ']') + '\\cdot' +
					_ub(fmt(_gval(base + ':k', j, k)), 'k_{' + j + '}[' + k + ']'),
				key: k
			});
		}
		var val = _gval(base + ':scores', p, j);
		return _node({
			id: base + ':scores:' + p + ':' + j,
			value: val,
			name: 's_{' + p + ',' + j + '}',
			badge: 'attention score, head ' + h,
			formula: 's_{' + p + ',' + j + '} = ' + _ub(fmt(inv), '1/\\sqrt{d_k}') +
				'\\cdot\\left( ' + _plusTerms(terms, 3) + '\\right) = ' + _ub(fmt(val), 'score'),
			inputs: [
				_chip(base + ':q:' + p + ':0', 'q_{' + p + '}[0]', 'query', _gval(base + ':q', p, 0)),
				_chip(base + ':k:' + j + ':0', 'k_{' + j + '}[0]', 'key', _gval(base + ':k', j, 0)),
				_chip(base + ':q:' + p + ':' + (dk - 1), 'q_{' + p + '}[' + (dk - 1) + ']', 'query', _gval(base + ':q', p, dk - 1)),
				_chip(base + ':k:' + j + ':' + (dk - 1), 'k_{' + j + '}[' + (dk - 1) + ']', 'key', _gval(base + ':k', j, dk - 1))
			]
		});
	}

	function _matEScore(L, h, p, j) {
		var base = 'L:' + L + ':head:' + h;
		var s = _gval(base + ':scores', p, j);
		var val = Math.exp(num(s));
		return _node({
			id: base + ':escore:' + p + ':' + j,
			value: val,
			name: 'e^{s_{' + p + ',' + j + '}}',
			badge: 'unnormalized weight',
			formula: 'e^{s} = \\exp\\left(' + _ub(fmt(s), 'score s_{' + p + ',' + j + '}') + '\\right) = ' + _ub(fmt(val), 'exp'),
			inputs: [_chip(base + ':scores:' + p + ':' + j, 's_{' + p + ',' + j + '}', 'score', s)]
		});
	}

	function _matSSum(L, h, p) {
		var base = 'L:' + L + ':head:' + h;
		var seq = _grid(base + ':scores').data[p].length;
		var sum = 0;
		var terms = [];
		for (var j = 0; j < seq; j++) {
			var s = _gval(base + ':scores', p, j);
			var e = Math.exp(num(s));
			sum += e;
			terms.push({ tex: _ub(fmt(e), 'e^{s_{' + p + ',' + j + '}}') });
		}
		return _node({
			id: base + ':ssum:' + p,
			value: sum,
			name: 'Z_{' + p + '}',
			badge: 'softmax denominator, row ' + p,
			formula: 'Z_{' + p + '} = ' + _plusTerms(terms, 4) + ' = ' + _ub(fmt(sum), 'normalizer'),
			inputs: []
		});
	}

	function _matAlphaNode(L, h, p, j) {
		var base = 'L:' + L + ':head:' + h;
		var s = _gval(base + ':scores', p, j);
		var es = Math.exp(num(s));
		var Z = 0;
		var seq = _grid(base + ':scores').data[p].length;
		for (var t = 0; t < seq; t++) Z += Math.exp(num(_gval(base + ':scores', p, t)));
		var val = _gval(base + ':alpha', p, j);
		return _node({
			id: base + ':alpha:' + p + ':' + j,
			value: val,
			name: 'α_{' + p + ',' + j + '}',
			badge: 'attention weight, head ' + h,
			formula: '\\alpha_{' + p + ',' + j + '} = \\frac{' + _ub(fmt(es), 'e^{s_{' + p + ',' + j + '}}') + '}{' + _ub(fmt(Z), '\\sum_t e^{s_{' + p + ',t}}') + '} = ' + _ub(fmt(val), 'softmax'),
			inputs: [
				_chip(base + ':escore:' + p + ':' + j, 'e^{s_{' + p + ',' + j + '}}', 'numerator', es),
				_chip(base + ':ssum:' + p, 'Z_{' + p + '}', 'denominator', Z),
				_chip(base + ':scores:' + p + ':' + j, 's_{' + p + ',' + j + '}', 'score', s)
			]
		});
	}

	function _matCtxNode(L, h, p, i) {
		var base = 'L:' + L + ':head:' + h;
		var seq = _grid(base + ':alpha').data[p].length;
		var terms = [];
		for (var j = 0; j < seq; j++) {
			terms.push({
				tex: _ub(fmt(_gval(base + ':alpha', p, j)), 'α_{' + p + ',' + j + '}') + '\\cdot' +
					_ub(fmt(_gval(base + ':v', j, i)), 'v_{' + j + '}[' + i + ']')
			});
		}
		var val = _gval(base + ':ctx', p, i);
		return _node({
			id: base + ':ctx:' + p + ':' + i,
			value: val,
			name: 'c_{' + p + '}[' + i + ']',
			badge: 'weighted context, head ' + h,
			formula: 'c_{' + p + '}[' + i + '] = ' + _plusTerms(terms, 3) + ' = ' + _ub(fmt(val), 'context'),
			inputs: [
				_chip(base + ':alpha:' + p + ':0', 'α_{' + p + ',0}', 'weight', _gval(base + ':alpha', p, 0)),
				_chip(base + ':v:0:' + i, 'v_{0}[' + i + ']', 'value', _gval(base + ':v', 0, i))
			]
		});
	}

	/* ─────────────── output-of-attention materializers ─────────────── */

	function _matConcatCell(L, p, i) {
		var meta = S._layerMeta.get(L);
		var dk = meta ? meta.d_k : 1;
		var h = Math.floor(i / dk);
		var inner = i % dk;
		var val = _gval('L:' + L + ':concat', p, i);
		return _node({
			id: 'L:' + L + ':concat:' + p + ':' + i,
			value: val,
			name: 'cat_{' + p + '}[' + i + ']',
			badge: 'concatenation · Layer ' + L,
			formula: '\\mathrm{cat}_{' + p + '}[' + i + '] = ' + _ub(fmt(val), 'context of head ' + h + ', dim ' + inner),
			inputs: [
				_chip('L:' + L + ':head:' + h + ':ctx:' + p + ':' + inner,
					'c_{' + p + '}[' + inner + '] (head ' + h + ')', 'head ' + h + ' context',
					_gval('L:' + L + ':head:' + h + ':ctx', p, inner))
			]
		});
	}

	function _matProjCell(L, p, i) {
		var base = 'L:' + L;
		var d = _dModel();
		var terms = [];
		for (var k = 0; k < d; k++) {
			terms.push({
				tex: _ub(fmt(_gval(base + ':concat', p, k)), 'cat_{' + p + '}[' + k + ']') + '\\cdot' +
					_ub(fmt(_gval(base + ':Wo', k, i)), 'W_o{' + k + ',' + i + '}')
			});
		}
		var val = _gval(base + ':proj', p, i);
		return _node({
			id: base + ':proj:' + p + ':' + i,
			value: val,
			name: 'a_{' + p + '}[' + i + ']',
			badge: 'attention output (projected) · Layer ' + L,
			formula: 'a_{' + p + '}[' + i + '] = ' + _plusTerms(terms, 3) + ' = ' + _ub(fmt(val), 'attention output'),
			inputs: [
				_chip(base + ':concat:' + p + ':0', 'cat_{' + p + '}[0]', 'concat', _gval(base + ':concat', p, 0)),
				_chip(base + ':Wo:0:' + i, 'W_o{0,' + i + '}', 'output weights', _gval(base + ':Wo', 0, i))
			]
		});
	}

	function _matH1Cell(L, p, i) {
		var base = 'L:' + L;
		var lnV = _gval(base + ':norm', p, i);
		var aV = _gval(base + ':proj', p, i);
		var val = _gval(base + ':h1', p, i);
		return _node({
			id: base + ':h1:' + p + ':' + i,
			value: val,
			name: 'h_1[' + p + '][' + i + ']',
			badge: 'hidden state after attention · Layer ' + L,
			formula: 'h_1[' + p + '][' + i + '] = ' + _ub(fmt(lnV), 'LayerNorm output') + ' + ' +
				_ub(fmt(aV), 'attention output (residual)') + ' = ' + _ub(fmt(val), 'h_1'),
			inputs: [
				_chip(base + ':norm:' + p + ':' + i, 'ln_1[' + p + '][' + i + ']', 'LayerNorm 1', lnV),
				_chip(base + ':proj:' + p + ':' + i, 'a_{' + p + '}[' + i + ']', 'attention output', aV)
			]
		});
	}

	/* ─────────────── FFN materializers ─────────────── */

	function _matFFNW(L, which, i, j) {
		var key = 'L:' + L + ':W' + which;
		var val = _gval(key, i, j);
		return _node({
			id: key + ':' + i + ':' + j,
			value: val,
			name: 'W' + which + '_{' + i + ',' + j + '}',
			badge: 'FFN weight W' + which + ' · Layer ' + L,
			formula: 'W' + which + '_{' + i + ',' + j + '} = ' + _ub(fmt(val), 'FFN weight'),
			inputs: []
		});
	}

	function _matFFNbias(L, which, j) {
		var key = 'L:' + L + ':b' + which;
		var val = _gval(key, 0, j);
		return _node({
			id: key + ':' + j,
			value: val,
			name: 'b' + which + '_{' + j + '}',
			badge: 'FFN bias b' + which + ' · Layer ' + L,
			formula: 'b' + which + '_{' + j + '} = ' + _ub(fmt(val), 'FFN bias'),
			inputs: []
		});
	}

	/* pre-GELU linear activation u_j = Σ_i ln2[p][i]·W1[i][j] + b1[j] */
	function _matU(L, p, j) {
		var base = 'L:' + L;
		var d = _dModel();
		var terms = [];
		for (var i = 0; i < d; i++) {
			terms.push({
				tex: _ub(fmt(_gval(base + ':norm2', p, i)), 'ln_2[' + p + '][' + i + ']') + '\\cdot' +
					_ub(fmt(_gval(base + ':W1', i, j)), 'W1_{' + i + ',' + j + '}')
			});
		}
		var b = _gval(base + ':b1', 0, j);
		// raw pre-activation is not stored; recompute it
		var u = b;
		for (var k = 0; k < d; k++) u += _gval(base + ':norm2', p, k) * _gval(base + ':W1', k, j);
		return _node({
			id: base + ':u:' + p + ':' + j,
			value: u,
			name: 'u_{' + p + '}[' + j + ']',
			badge: 'FFN pre-activation · Layer ' + L,
			formula: 'u_{' + p + '}[' + j + '] = ' + _plusTerms(terms, 3) + ' + ' +
				_ub(fmt(b), 'bias b1_{' + j + '}') + ' = ' + _ub(fmt(u), 'pre-activation'),
			inputs: [
				_chip(base + ':norm2:' + p + ':0', 'ln_2[' + p + '][0]', 'LayerNorm 2', _gval(base + ':norm2', p, 0)),
				_chip(base + ':W1:0:' + j, 'W1_{0,' + j + '}', 'FFN weight', _gval(base + ':W1', 0, j)),
				_chip(base + ':b1:' + j, 'b1_{' + j + '}', 'FFN bias', b)
			]
		});
	}

	function _matGelu(L, p, j) {
		var base = 'L:' + L;
		var u = 0;
		var d = _dModel();
		for (var k = 0; k < d; k++) u += _gval(base + ':norm2', p, k) * _gval(base + ':W1', k, j);
		u += _gval(base + ':b1', 0, j);
		var val = _gval(base + ':outL1', p, j);
		return _node({
			id: base + ':gelu:' + p + ':' + j,
			value: val,
			name: 'GELU(u_{' + p + '}[' + j + '])',
			badge: 'GELU activation · Layer ' + L,
			formula: '\\mathrm{GELU}(u) = 0.5\\cdot' + _ub(fmt(u), 'u_{' + p + '}[' + j + ']') +
				'\\cdot\\left(1 + \\mathrm{erf}\\left(\\frac{u}{\\sqrt{2}}\\right)\\right) = ' + _ub(fmt(val), 'activated'),
			inputs: [_chip(base + ':u:' + p + ':' + j, 'u_{' + p + '}[' + j + ']', 'pre-activation', u)]
		});
	}

	function _matOutL1(L, p, j) {
		var base = 'L:' + L;
		var u = 0;
		var d = _dModel();
		for (var k = 0; k < d; k++) u += _gval(base + ':norm2', p, k) * _gval(base + ':W1', k, j);
		u += _gval(base + ':b1', 0, j);
		var val = _gval(base + ':outL1', p, j);
		return _node({
			id: base + ':outL1:' + p + ':' + j,
			value: val,
			name: '\\mathrm{out}_{L1}[' + p + '][' + j + ']',
			badge: 'FFN layer 1 output · Layer ' + L,
			formula: '\\mathrm{out}_{L1}[' + p + '][' + j + '] = \\mathrm{GELU}\\left(' +
				_ub(fmt(u), 'u_{' + p + '}[' + j + ']') + '\\right) = ' + _ub(fmt(val), 'FFN output'),
			inputs: [
				_chip(base + ':u:' + p + ':' + j, 'u_{' + p + '}[' + j + ']', 'pre-activation', u),
				_chip(base + ':gelu:' + p + ':' + j, 'GELU(u)', 'activation', val)
			]
		});
	}

	function _matOutFFN(L, p, i) {
		var base = 'L:' + L;
		var d = _grid(base + ':W2').data.length;
		var terms = [];
		for (var j = 0; j < d; j++) {
			terms.push({
				tex: _ub(fmt(_gval(base + ':outL1', p, j)), 'out_{L1}[' + p + '][' + j + ']') + '\\cdot' +
					_ub(fmt(_gval(base + ':W2', j, i)), 'W2_{' + j + ',' + i + '}')
			});
		}
		var b = _gval(base + ':b2', 0, i);
		var val = _gval(base + ':outFFN', p, i);
		return _node({
			id: base + ':outFFN:' + p + ':' + i,
			value: val,
			name: '\\mathrm{out}_{FFN}[' + p + '][' + i + ']',
			badge: 'FFN output · Layer ' + L,
			formula: '\\mathrm{out}_{FFN}[' + p + '][' + i + '] = ' + _plusTerms(terms, 3) + ' + ' +
				_ub(fmt(b), 'bias b2_{' + i + '}') + ' = ' + _ub(fmt(val), 'FFN output'),
			inputs: [
				_chip(base + ':outL1:' + p + ':0', 'out_{L1}[' + p + '][0]', 'FFN layer 1', _gval(base + ':outL1', p, 0)),
				_chip(base + ':W2:0:' + i, 'W2_{0,' + i + '}', 'FFN weight', _gval(base + ':W2', 0, i)),
				_chip(base + ':b2:' + i, 'b2_{' + i + '}', 'FFN bias', b)
			]
		});
	}

	function _matH2Cell(L, p, i) {
		var base = 'L:' + L;
		var h1v = _gval(base + ':h1', p, i);
		var fv = _gval(base + ':outFFN', p, i);
		var val = _gval(base + ':h2', p, i);
		return _node({
			id: base + ':h2:' + p + ':' + i,
			value: val,
			name: 'h_2[' + p + '][' + i + ']',
			badge: 'hidden state after FFN · Layer ' + L,
			formula: 'h_2[' + p + '][' + i + '] = ' + _ub(fmt(h1v), 'h_1[' + p + '][' + i + ']') + ' + ' +
				_ub(fmt(fv), 'FFN output (residual)') + ' = ' + _ub(fmt(val), 'h_2'),
			inputs: [
				_chip(base + ':h1:' + p + ':' + i, 'h_1[' + p + '][' + i + ']', 'pre-FFN', h1v),
				_chip(base + ':outFFN:' + p + ':' + i, 'out_{FFN}[' + p + '][' + i + ']', 'FFN output', fv)
			]
		});
	}

	/* ─────────────── final-stage materializers ─────────────── */

	function _matHLast(i) {
		var val = _gval('F:h_last', 0, i);
		var lastLayer = S._finalMeta ? S._finalMeta.lastLayer : null;
		return _node({
			id: 'F:h_last:0:' + i,
			value: val,
			name: 'h_{\\text{last}}[' + i + ']',
			badge: 'final hidden state' + (lastLayer ? ' · layer ' + lastLayer : ''),
			formula: 'h_{\\text{last}}[' + i + '] = ' + _ub(fmt(val), 'last line of the final layer output'),
			inputs: []
		});
	}

	function _matWvCell(i, j) {
		var val = _gval('F:Wv', i, j);
		var words = S._finalMeta ? S._finalMeta.vocabWords : [];
		var word = words[i] != null ? '"' + dispToken(words[i]) + '"' : 'word ' + i;
		return _node({
			id: 'F:Wv:' + i + ':' + j,
			value: val,
			name: 'W_{\\text{vocab}}[' + i + '][' + j + ']',
			badge: 'unembedding weight · ' + word,
			formula: 'W_{\\text{vocab}}[' + i + '][' + j + '] = ' + _ub(fmt(val), 'embedding row of ' + word),
			inputs: []
		});
	}

	function _matWoCell(L, i, j) {
		var base = 'L:' + L;
		var val = _gval(base + ':Wo', i, j);
		return _node({
			id: base + ':Wo:' + i + ':' + j,
			value: val,
			name: 'W_o{' + i + ',' + j + '}',
			badge: 'output projection weights · Layer ' + L,
			formula: 'W_o{' + i + ',' + j + '} = ' + _ub(fmt(val), 'output weight'),
			inputs: []
		});
	}

	function _matFsum(scaled) {
		var T = S._finalMeta ? S._finalMeta.temperature : 1;
		var logits = _grid('F:logits');
		var seq = logits.data.length;
		var sum = 0, terms = [];
		for (var t = 0; t < seq; t++) {
			var v = scaled ? Math.exp(_gval('F:logits', 0, t) / T) : Math.exp(_gval('F:logits', 0, t));
			sum += v;
			terms.push({ tex: _ub(fmt(v), (scaled ? 'e^{logit_' + t + '/T}' : 'e^{logit_' + t + '}')) });
		}
		return _node({
			id: scaled ? 'F:spowsum' : 'F:ssum',
			value: sum,
			name: (scaled ? 'Z_T' : 'Z'),
			badge: scaled ? 'softmax denominator (T-scaled)' : 'softmax denominator',
			formula: (scaled ? 'Z_T' : 'Z') + ' = ' + _plusTerms(terms, 4) + ' = ' + _ub(fmt(sum), 'normalizer'),
			inputs: []
		});
	}

	function _matFinalCell(kind, i) {
		var T = S._finalMeta ? S._finalMeta.temperature : 1;
		var d = _grid('F:h_last').data.length;
		if (kind === 'logit') {
			var terms = [];
			for (var j = 0; j < d; j++) {
				terms.push({
					tex: _ub(fmt(_gval('F:h_last', 0, j)), 'h_{\\text{last}}[' + j + ']') + '\\cdot' +
						_ub(fmt(_gval('F:Wv', i, j)), 'W_{\\text{vocab}}[' + i + '][' + j + ']')
				});
			}
			var val = _gval('F:logits', 0, i);
			return _node({
				id: 'F:logit:' + i,
				value: val,
				name: 'logit_{' + i + '}',
				badge: 'raw score for vocabulary word ' + i,
				formula: '\\mathrm{logit}_{' + i + '} = ' + _plusTerms(terms, 3) + ' = ' + _ub(fmt(val), 'logit'),
				inputs: [
					_chip('F:h_last:0:0', 'h_{\\text{last}}[0]', 'final hidden state', _gval('F:h_last', 0, 0)),
					_chip('F:Wv:' + i + ':0', 'W_{\\text{vocab}}[' + i + '][0]', 'unembedding', _gval('F:Wv', i, 0))
				]
			});
		}
		if (kind === 'exp') {
			var lg = _gval('F:logits', 0, i);
			var ev = Math.exp(lg);
			return _node({
				id: 'F:exp:' + i,
				value: ev,
				name: 'e^{\\mathrm{logit}_{' + i + '}}',
				badge: 'unnormalized probability',
				formula: 'e^{\\mathrm{logit}_{' + i + '}} = \\exp\\left(' + _ub(fmt(lg), 'logit_{' + i + '}') + '\\right) = ' + _ub(fmt(ev), 'exp'),
				inputs: [_chip('F:logit:' + i, 'logit_{' + i + '}', 'raw score', lg)]
			});
		}
		if (kind === 'prob') {
			var lg2 = _gval('F:logits', 0, i);
			var e2 = Math.exp(lg2);
			var Z = _grid('F:ssum').data[0];
			var val = _gval('F:probs', 0, i);
			return _node({
				id: 'F:prob:' + i,
				value: val,
				name: 'p_{' + i + '}',
				badge: 'probability (T=1)',
				formula: 'p_{' + i + '} = \\frac{' + _ub(fmt(e2), 'e^{\\mathrm{logit}_{' + i + '}}') + '}{' + _ub(fmt(Z), '\\sum_t e^{\\mathrm{logit}_t}') + '} = ' + _ub(fmt(val), 'softmax'),
				inputs: [
					_chip('F:exp:' + i, 'e^{\\mathrm{logit}_{' + i + '}}', 'numerator', e2),
					_chip('F:ssum', 'Z', 'denominator', Z),
					_chip('F:logit:' + i, 'logit_{' + i + '}', 'raw score', lg2)
				]
			});
		}
		if (kind === 'sprob') {
			var lg3 = _gval('F:logits', 0, i);
			var e3 = Math.exp(lg3 / T);
			var Zs = _grid('F:spowsum').data[0];
			var val = _gval('F:sprobs', 0, i);
			return _node({
				id: 'F:sprob:' + i,
				value: val,
				name: 's_{' + i + '}',
				badge: 'probability at T=' + T,
				formula: 's_{' + i + '} = \\frac{' + _ub(fmt(e3), 'e^{\\mathrm{logit}_{' + i + '}/T}') + '}{' + _ub(fmt(Zs), '\\sum_t e^{\\mathrm{logit}_t/T}') + '} = ' + _ub(fmt(val), 'temperature-scaled softmax'),
				inputs: [
					_chip('F:pow:' + i, 'e^{\\mathrm{logit}_{' + i + '}/T}', 'numerator', e3),
					_chip('F:spowsum', 'Z_T', 'denominator', Zs),
					_chip('F:logit:' + i, 'logit_{' + i + '}', 'raw score', lg3)
				]
			});
		}
		if (kind === 'pow') {
			var lg4 = _gval('F:logits', 0, i);
			var v4 = Math.exp(lg4 / T);
			return _node({
				id: 'F:pow:' + i,
				value: v4,
				name: 'e^{\\mathrm{logit}_{' + i + '}/T}',
				badge: 'T-scaled unnormalized weight',
				formula: 'e^{\\mathrm{logit}_{' + i + '}/T} = \\exp\\left(\\frac{' + _ub(fmt(lg4), 'logit_{' + i + '}') + '}{' + T + '}\\right) = ' + _ub(fmt(v4), 'scaled exp'),
				inputs: [_chip('F:logit:' + i, 'logit_{' + i + '}', 'raw score', lg4)]
			});
		}
		if (kind === 'delta') {
			var p1 = _gval('F:probs', 0, i);
			var p2 = _gval('F:sprobs', 0, i);
			var val = _gval('F:delta', 0, i);
			return _node({
				id: 'F:delta:' + i,
				value: val,
				name: '\\Delta_{' + i + '}',
				badge: 'probability change from scaling',
				formula: '\\Delta_{' + i + '} = ' + _ub(fmt(p2), 's_{' + i + '} (scaled)') + ' - ' +
					_ub(fmt(p1), 'p_{' + i + '} (original)') + ' = ' + _ub(fmt(val), 'change'),
				inputs: [
					_chip('F:sprob:' + i, 's_{' + i + '}', 'scaled probability', p2),
					_chip('F:prob:' + i, 'p_{' + i + '}', 'original probability', p1)
				]
			});
		}
		if (kind === 'probs_pct') {
			var pPct = _gval('F:probs_pct', 0, i);
			return _node({
				id: 'F:probs_pct:' + i,
				value: pPct,
				name: 'p_{' + i + '}',
				badge: 'probability (T=1) · %',
				formula: 'p_{' + i + '} = ' + _ub(fmt(pPct / 100), 'softmax prob') + ' = ' + _ub(fmt(pPct), 'percent'),
				inputs: [_chip('F:prob:' + i, 'p_{' + i + '}', 'probability (fraction)', _gval('F:probs', 0, i))]
			});
		}
		if (kind === 'sprobs_pct') {
			var sPct = _gval('F:sprobs_pct', 0, i);
			return _node({
				id: 'F:sprobs_pct:' + i,
				value: sPct,
				name: 's_{' + i + '}',
				badge: 'probability at T=' + T + ' · %',
				formula: 's_{' + i + '} = ' + _ub(fmt(sPct / 100), 'scaled softmax prob') + ' = ' + _ub(fmt(sPct), 'percent'),
				inputs: [_chip('F:sprob:' + i, 's_{' + i + '}', 'scaled probability (fraction)', _gval('F:sprobs', 0, i))]
			});
		}
		if (kind === 'delta_pct') {
			var dPct = _gval('F:delta_pct', 0, i);
			return _node({
				id: 'F:delta_pct:' + i,
				value: dPct,
				name: '\\Delta_{' + i + '}',
				badge: 'probability change from scaling · %',
				formula: '\\Delta_{' + i + '} = ' + _ub(fmt(dPct / 100), 'change in probability') + ' = ' + _ub(fmt(dPct), 'percent'),
				inputs: [_chip('F:delta:' + i, '\\Delta_{' + i + '}', 'change (fraction)', _gval('F:delta', 0, i))]
			});
		}
		return null;
	}

	function _matEntropy(nodeId) {
		var gridId, name, badge;
		var which = nodeId.replace('F:ent:', '');
		if (which === 'orig') {
			gridId = 'F:ent_orig'; name = 'H_{T=1}'; badge = 'entropy of the original distribution';
		} else if (which === 'scaled') {
			gridId = 'F:ent_scaled'; name = 'H_{T}'; badge = 'entropy after temperature scaling';
		} else {
			gridId = 'F:ent_max'; name = 'H_{\\max}'; badge = 'maximum entropy (uniform distribution)';
		}
		var val = _gval(gridId, 0, 0);
		return _node({
			id: nodeId,
			value: val,
			name: name,
			badge: badge,
			formula: name + ' = ' + _ub(fmt(val), badge) + ' \\text{ bits}',
			inputs: []
		});
	}

	/* __PROV_CHUNK3__ */

	/* ─────────────── dispatcher ─────────────── */

	S._mat = function (nodeId) {
		if (nodeId in S._matCache) return S._matCache[nodeId];
		var n = _matImpl(nodeId);
		if (!n) return null;
		S._matCache[nodeId] = n;
		return n;
	};

	function _matImpl(nodeId) {
		if (nodeId === 'P:scalar') return _matPScalar();
		var m;
		if ((m = /^P:(emb|base|trig|pe|h0):(\d+):(\d+)$/.exec(nodeId))) {
			var p = +m[2], i = +m[3];
			switch (m[1]) {
				case 'emb': return _matPemb(p, i);
				case 'base': return _matPbase(p, i);
				case 'trig': return _matPtrig(p, i);
				case 'pe': return _matPpe(p, i);
				case 'h0': return _matPh0(p, i);
			}
		}
		if ((m = /^L:(\d+):(mu|var|std)(\d?):(\d+)$/.exec(nodeId))) {
			var L = +m[1], is2 = m[3] === '2', pos = +m[4];
			if (m[2] === 'mu') return _matMuNode(L, is2, pos);
			if (m[2] === 'var') return _matVarNode(L, is2, pos);
			return _matStdNode(L, is2, pos);
		}
		if ((m = /^L:(\d+):(znorm)(\d?):(\d+):(\d+)$/.exec(nodeId))) {
			return _matZnode(+m[1], m[3] === '2', +m[4], +m[5]);
		}
		if ((m = /^L:(\d+):(norm)(\d?):(\d+):(\d+)$/.exec(nodeId))) {
			return _lnNode(+m[1], m[3] === '2', +m[4], +m[5]);
		}
		if ((m = /^L:(\d+):(gamma|beta)(\d?):(\d+)$/.exec(nodeId))) {
			return _matGammaBeta(+m[1], m[3] === '2', +m[4], m[2]);
		}
		if ((m = /^L:(\d+):hin:(\d+):(\d+)$/.exec(nodeId))) {
			var g = _grid('L:' + m[1] + ':hin');
			return _node({
				id: nodeId,
				value: _gval('L:' + m[1] + ':hin', +m[2], +m[3]),
				name: 'h_{in}[' + m[2] + '][' + m[3] + ']',
				badge: 'input to layer ' + m[1],
				formula: 'h_{in}[' + m[2] + '][' + m[3] + '] = ' + _ub(fmt(_gval('L:' + m[1] + ':hin', +m[2], +m[3])), 'hidden state'),
				inputs: g && m[1] == 1 ? [_chip('P:h0:' + m[2] + ':' + m[3], 'h_0[' + m[2] + '][' + m[3] + ']', 'initial state', _gval('P:h0', +m[2], +m[3]))] : []
			});
		}
		if ((m = /^L:(\d+):(concat|proj|h1|h2|Wo):(\d+):(\d+)$/.exec(nodeId))) {
			var kind = m[2], pp = +m[3], ii = +m[4], Lx = +m[1];
			if (kind === 'concat') return _matConcatCell(Lx, pp, ii);
			if (kind === 'proj') return _matProjCell(Lx, pp, ii);
			if (kind === 'Wo') return _matWoCell(Lx, pp, ii);
			if (kind === 'h1') return _matH1Cell(Lx, pp, ii);
			return _matH2Cell(Lx, pp, ii);
		}
		if ((m = /^L:(\d+):head:(\d+):(q|k|v|Wq|Wk|Wv):(\d+):(\d+)$/.exec(nodeId))) {
			return _matHeadCell(+m[1], +m[2], m[3], +m[4], +m[5]);
		}
		if ((m = /^L:(\d+):head:(\d+):(scores|alpha):(\d+):(\d+)$/.exec(nodeId))) {
			if (m[3] === 'scores') return _matScoreNode(+m[1], +m[2], +m[4], +m[5]);
			return _matAlphaNode(+m[1], +m[2], +m[4], +m[5]);
		}
		if ((m = /^L:(\d+):head:(\d+):escore:(\d+):(\d+)$/.exec(nodeId))) {
			return _matEScore(+m[1], +m[2], +m[3], +m[4]);
		}
		if ((m = /^L:(\d+):head:(\d+):ssum:(\d+)$/.exec(nodeId))) {
			return _matSSum(+m[1], +m[2], +m[3]);
		}
		if ((m = /^L:(\d+):head:(\d+):ctx:(\d+):(\d+)$/.exec(nodeId))) {
			return _matCtxNode(+m[1], +m[2], +m[3], +m[4]);
		}
		if ((m = /^L:(\d+):W1:(\d+):(\d+)$/.exec(nodeId))) {
			return _matFFNW(+m[1], 1, +m[2], +m[3]);
		}
		if ((m = /^L:(\d+):W2:(\d+):(\d+)$/.exec(nodeId))) {
			return _matFFNW(+m[1], 2, +m[2], +m[3]);
		}
		if ((m = /^L:(\d+):u:(\d+):(\d+)$/.exec(nodeId))) {
			return _matU(+m[1], +m[2], +m[3]);
		}
		if ((m = /^L:(\d+):b(\d):(\d+)$/.exec(nodeId))) {
			return _matFFNbias(+m[1], +m[2], +m[3]);
		}
		if ((m = /^L:(\d+):outL1:(\d+):(\d+)$/.exec(nodeId))) {
			return _matOutL1(+m[1], +m[2], +m[3]);
		}
		if ((m = /^L:(\d+):gelu:(\d+):(\d+)$/.exec(nodeId))) {
			return _matGelu(+m[1], +m[2], +m[3]);
		}
		if ((m = /^L:(\d+):outFFN:(\d+):(\d+)$/.exec(nodeId))) {
			return _matOutFFN(+m[1], +m[2], +m[3]);
		}
		if ((m = /^F:(h_last):0:(\d+)$/.exec(nodeId))) {
			return _matHLast(+m[2]);
		}
		if ((m = /^F:Wv:(\d+):(\d+)$/.exec(nodeId))) {
			return _matWvCell(+m[1], +m[2]);
		}
		if ((m = /^F:(logit|prob|sprob|delta|exp|pow|probs_pct|sprobs_pct|delta_pct):(\d+)$/.exec(nodeId))) {
			return _matFinalCell(m[1], +m[2]);
		}
		if ((m = /^F:(ssum|spowsum|ent):?(\w*)$/.exec(nodeId))) {
			if (m[1] === 'ssum') return _matFsum(false);
			if (m[1] === 'spowsum') return _matFsum(true);
			return _matEntropy(nodeId);
		}
		return null;
	}

	/* ─────────────────── tooltip UI ─────────────────── */

	var _tooltip = null;
	var _history = [];
	var _lastMouse = { x: 0, y: 0 };
	var _timer = null;
	var _hideTimer = null;
	var _stylesInjected = false;

	function _injectStyles() {
		if (_stylesInjected) return;
		_stylesInjected = true;
		var style = document.createElement('style');
		style.id = 'prov-styles';
		style.textContent =
			'#prov-tooltip{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;' +
			'background:#ffffff;color:#1e293b;border:1px solid #cbd5e1;border-radius:10px;' +
			'box-shadow:0 10px 30px rgba(15,23,42,.18);padding:12px 14px;max-width:560px;' +
			'display:none;position:fixed;z-index:2147483000;}' +
			'#prov-tooltip .prov-head{display:flex;align-items:center;gap:8px;margin-bottom:6px;}' +
			'#prov-tooltip .prov-badge{background:#eef2ff;color:#4338ca;font-size:11px;padding:2px 8px;' +
			'border-radius:999px;white-space:nowrap;max-width:230px;overflow:hidden;text-overflow:ellipsis;}' +
			'#prov-tooltip .prov-title{font-weight:600;font-size:14px;}' +
			'#prov-tooltip .prov-actions{margin-left:auto;display:flex;gap:4px;}' +
			'#prov-tooltip button.prov-btn{border:1px solid #cbd5e1;background:#f8fafc;border-radius:6px;' +
			'padding:2px 8px;font-size:12px;cursor:pointer;color:#334155;}' +
			'#prov-tooltip button.prov-btn:hover{background:#e0e7ff;}' +
			'#prov-tooltip .prov-value{font-size:18px;font-weight:700;font-variant-numeric:tabular-nums;' +
			'margin:2px 0 8px;color:#0f172a;}' +
			'#prov-tooltip .prov-formula{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;' +
			'padding:10px;overflow-x:auto;}' +
			'#prov-tooltip .prov-formula .md{margin:0;}' +
			'#prov-tooltip .prov-label{font-size:11px;text-transform:uppercase;letter-spacing:.05em;' +
			'color:#64748b;margin:10px 0 4px;}' +
			'#prov-tooltip .prov-inputs{display:flex;flex-wrap:wrap;gap:6px;}' +
			'#prov-tooltip .prov-chip{border:1px solid #6366f1;background:#eef2ff;color:#3730a3;' +
			'border-radius:999px;padding:3px 10px;font-size:12px;cursor:pointer;}' +
			'#prov-tooltip .prov-chip:hover{background:#e0e7ff;}' +
			'#prov-tooltip .prov-chipval{color:#6366f1;font-weight:600;}' +
			'#prov-tooltip .prov-crumb{margin-top:8px;font-size:11px;color:#94a3b8;}' +
			'#prov-tooltip .prov-hint{margin-top:8px;font-size:11px;color:#94a3b8;}' +
			'.prov-cell{transition:background .12s;}' +
			'.prov-cell:hover{background:rgba(99,102,241,.25);cursor:help;border-radius:3px;}' +
			'.prov-cell.prov-active{background:rgba(99,102,241,.35);}';
		document.head.appendChild(style);
	}

	function _renderTooltipMath(el) {
		if (el && typeof temml !== 'undefined' && typeof temml.renderMathInElement === 'function') {
			try {
				temml.renderMathInElement(el, {
					delimiters: [
						{ left: '$$', right: '$$', display: true },
						{ left: '$', right: '$', display: false }
					],
					throwOnError: false,
					annotate: true
				});
			} catch (e) { /* keep raw text */ }
		}
	}

	function _renderCurrent() {
		var nodeId = _history[_history.length - 1];
		var node = S._mat(nodeId);
		if (!node) { S.hide(); return; }

		var parts = [];
		parts.push('<div class="prov-head">' +
			'<span class="prov-badge">' + texSafe(node.badge) + '</span>' +
			'<span class="prov-title">$' + node.name + '$</span>' +
			'<div class="prov-actions">' +
			(_history.length > 1 ? '<button class="prov-btn" data-prov-act="back" title="Back">&larr;</button>' : '') +
			'<button class="prov-btn" data-prov-act="pin" title="Pin">' + (S._pinned ? 'Unpin' : 'Pin') + '</button>' +
			'<button class="prov-btn" data-prov-act="close" title="Close">&times;</button>' +
			'</div></div>');

		parts.push('<div class="prov-value">' + fmt(node.value) + '</div>');

		parts.push('<div class="prov-label">How it is computed</div>');
		parts.push('<div class="prov-formula"><span class="md">$$' + node.formula + '$$</span></div>');

		if (node.inputs && node.inputs.length) {
			parts.push('<div class="prov-label">Where it comes from</div>');
			parts.push('<div class="prov-inputs">' + node.inputs.map(function (inp) {
				return '<button class="prov-chip" data-prov-chip="' + attrSafe(inp.id) + '" title="' + texSafe(inp.badge) + '">' +
					'$' + inp.name + '$&nbsp;=&nbsp;<span class="prov-chipval">' + fmt(inp.value) + '</span></button>';
			}).join('') + '</div>');
		} else {
			parts.push('<div class="prov-label">Where it comes from</div>');
			parts.push('<div class="prov-inputs"><span style="font-size:12px;color:#64748b;">' +
				'Read directly from the recorded matrices (leaf value).</span></div>');
		}

		if (_history.length > 1) {
			parts.push('<div class="prov-crumb">Path: ' + _history.map(function (h, ix) {
				var n = S._mat(h);
				var label = n ? '$' + n.name + '$' : attrSafe(h);
				return (ix === _history.length - 1)
					? '<strong>' + label + '</strong>'
					: '<button class="prov-btn" data-prov-go="' + attrSafe(h) + '">' + label + '</button>';
			}).join(' &rarr; ') + '</div>');
		}

		parts.push('<div class="prov-hint">Hover any number in the equations, then click an input chip to trace it further back.</div>');

		_tooltip.innerHTML = parts.join('');
		_tooltip.style.display = 'block';
		_renderTooltipMath(_tooltip);
		_position();
	}

	function _position() {
		if (!_tooltip || _tooltip.style.display === 'none') return;
		var tw = _tooltip.offsetWidth || 300;
		var th = _tooltip.offsetHeight || 120;
		var left = _lastMouse.x + 14;
		var top = _lastMouse.y + 14;
		if (left + tw > window.innerWidth - 8) left = Math.max(8, _lastMouse.x - tw - 14);
		if (top + th > window.innerHeight - 8) top = Math.max(8, _lastMouse.y - th - 14);
		_tooltip.style.left = left + 'px';
		_tooltip.style.top = top + 'px';
	}

	S.show = function (nodeId) {
		if (!_tooltip) _ensureTooltip();
		_history = [nodeId];
		_renderCurrent();
	};

	S.hide = function () {
		if (_tooltip) _tooltip.style.display = 'none';
	};

	S.pin = function (on) {
		S._pinned = on ? true : false;
	};

	function _ensureTooltip() {
		if (_tooltip) return;
		_injectStyles();
		_tooltip = document.createElement('div');
		_tooltip.id = 'prov-tooltip';
		_tooltip.addEventListener('click', function (e) {
			var t = e.target;
			var chip = t.closest ? t.closest('[data-prov-chip]') : null;
			if (chip) {
				e.stopPropagation();
				_history.push(chip.getAttribute('data-prov-chip'));
				_renderCurrent();
				return;
			}
			var go = t.closest ? t.closest('[data-prov-go]') : null;
			if (go) {
				e.stopPropagation();
				_history.push(go.getAttribute('data-prov-go'));
				_renderCurrent();
				return;
			}
			var act = t.closest ? t.closest('[data-prov-act]') : null;
			if (!act) return;
			e.stopPropagation();
			var a = act.getAttribute('data-prov-act');
			if (a === 'close') { S.hide(); S._pinned = false; }
			else if (a === 'pin') { S._pinned = !S._pinned; _renderCurrent(); }
			else if (a === 'back') { _history.pop(); _renderCurrent(); }
		});
		_tooltip.addEventListener('mouseover', function () { _clearHide(); });
		document.body.appendChild(_tooltip);
	}

	function _clearHide() {
		if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null; }
	}

	function _onMouseOver(e) {
		var cell = e.target && e.target.closest ? e.target.closest('[data-prov-id]') : null;
		if (cell) {
			_clearHide();
			if (_timer) clearTimeout(_timer);
			_timer = setTimeout(function () {
				_timer = null;
				if (S._pinned) return;
				S._activeCell = cell;
				var active = document.querySelector('.prov-cell.prov-active');
				if (active) active.classList.remove('prov-active');
				cell.classList.add('prov-active');
				S.show(cell.getAttribute('data-prov-id'));
			}, 250);
		}
	}

	function _onMouseOut(e) {
		if (_timer) { clearTimeout(_timer); _timer = null; }
		var to = e.relatedTarget;
		if (S._pinned) return;
		var cell = e.target && e.target.closest ? e.target.closest('[data-prov-id]') : null;
		if (cell && !(to && to.closest && to.closest('#prov-tooltip'))) {
			_hideTimer = setTimeout(function () {
				if (!S._pinned) { S.hide(); }
			}, 200);
		}
	}

	function _onMouseMove(e) {
		_lastMouse.x = e.clientX;
		_lastMouse.y = e.clientY;
		if (_tooltip && _tooltip.style.display !== 'none' && !S._pinned) _position();
	}

	function _onDocClick(e) {
		if (S._pinned) return;
		if (e.target && e.target.closest && e.target.closest('#prov-tooltip')) return;
		if (e.target && e.target.closest && e.target.closest('[data-prov-id]')) return;
		S.hide();
	}

	function _onKeyDown(e) {
		if (e.key === 'Escape') {
			S._pinned = false;
			S.hide();
		}
	}

	function _bindEvents() {
		if (S._bound) return;
		S._bound = true;
		document.addEventListener('mouseover', _onMouseOver, true);
		document.addEventListener('mouseout', _onMouseOut, true);
		document.addEventListener('mousemove', _onMouseMove, true);
		document.addEventListener('click', _onDocClick, true);
		document.addEventListener('keydown', _onKeyDown, true);
	}

	S.init = function () {
		_injectStyles();
		_bindEvents();
	};

	/* auto-init when the page has loaded */
	if (typeof document !== 'undefined') {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', function () { S.init(); });
		} else {
			S.init();
		}
	}
})();
