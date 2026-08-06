"use strict";

/*
 * TDALive — live topological data analysis of the residual stream,
 * weight deltas (W - W_prev) and weights of the blog transformer.
 *
 * Provides:
 *  - a phase diagram (vector field of the residual stream dynamics),
 *  - attractor / repeller detection from the flow divergence,
 *  - streamlines + basin-of-attraction maps,
 *  - persistent homology (H0/H1) of the point cloud,
 *  - weight-space trajectories (PCA) of ΔW and W.
 *
 * Hooks: transformer.js calls TDALive.beginSession()/endSession() and
 * captureEpoch() per epoch; attention_engine.js fires AttentionEngine
 * onForward hooks which TDALive subscribes to for attention flow data.
 */
(function () {
	"use strict";

	const S = {
		cur: null,
		epochs: [],
		attention: [],
		maxHistory: 30,
		active: false,
		frame: null,
		frameSig: "",
		renderedSig: "",
		vfSig: "",
		lastRender: 0,
		raf: 0,
	};

	const CFG = {
		mode: "residual",
		dims: "3d",
		projection: "auto",
		layer: -1,
		colorby: "token",
		flow: "solo",
		showVf: true,
		showStream: true,
		showTrails: true,
		showAttractors: true,
		showBasins: false,
		showAttn: false,
		auto: true,
		gridRes: 9,
		epsSteps: 40,
		history: 30,
		sliceAxes: [0, 1, 2],
	};

	const GROUP_KEYS = ["query", "key", "value", "output"];
	const GROUP_NAMES = ["Wq", "Wk", "Wv", "Wo", "γ1", "β1", "γ2", "β2", "W1", "b1", "W2", "b2"];

	// ── small helpers ────────────────────────────────────────────
	function el(id) { return document.getElementById(id); }
	function tc(c) { return typeof themeColor === "function" ? themeColor(c) : c; }
	function hasGlobal(name) { return typeof window[name] === "function"; }
	function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
	function isPanelVisible() {
		const sec = el("tda-live-section");
		if (!sec) return false;
		const st = window.getComputedStyle(sec);
		if (st.display === "none") return false;
		const r = sec.getBoundingClientRect();
		return r.height > 0;
	}
	function hueFromToken(str) {
		if (hasGlobal("getHueFromToken")) { try { return window.getHueFromToken(str); } catch (e) { } }
		let h = 0;
		const s = String(str);
		for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
		return h;
	}
	function tokenLabel(t) {
		if (hasGlobal("displayToken")) { try { return window.displayToken(t); } catch (e) { } }
		return String(t).replace(/ /g, "\u2423");
	}
	function tokenColor(str, alpha) {
		const a = alpha == null ? 0.9 : alpha;
		return `hsla(${hueFromToken(str)}, 72%, 52%, ${a})`;
	}

	// ── linear algebra ───────────────────────────────────────────
	function vDot(a, b) { let s = 0; const n = Math.min(a.length, b.length); for (let i = 0; i < n; i++) s += a[i] * b[i]; return s; }
	function vNorm(a) { return Math.sqrt(vDot(a, a)); }
	function vSub(a, b) { return a.map((v, i) => v - (b[i] || 0)); }
	function vAdd(a, b) { return a.map((v, i) => v + (b[i] || 0)); }
	function vScale(a, s) { return a.map(v => v * s); }
	function matVec(M, v) {
		if (!M || !v) return new Array(v ? v.length : 0).fill(0);
		return M.map(row => vDot(row, v));
	}
	function matSub(A, B) { return A.map((row, i) => row.map((v, j) => v - B[i][j])); }
	function matFrob(A) { if (!A) return 0; let s = 0; for (const row of A) for (const v of row) s += v * v; return Math.sqrt(s); }
	function flatten2d(A, out) { if (!A) return; for (const row of A) for (const v of row) out.push(v); }
	function flatten1d(A, out) { if (!A) return; for (const v of A) out.push(v); }

	// ── PCA (dual trick for wide data) ───────────────────────────
	function dominantEigVec(M, n, maxIter) {
		maxIter = maxIter || 300;
		let v = new Array(n);
		const v0 = 1 / Math.sqrt(n);
		for (let i = 0; i < n; i++) v[i] = v0;
		let lambda = 0;
		for (let it = 0; it < maxIter; it++) {
			const w = new Array(n).fill(0);
			for (let i = 0; i < n; i++) {
				let s = 0;
				for (let j = 0; j < n; j++) s += M[i][j] * v[j];
				w[i] = s;
			}
			let norm = Math.sqrt(vDot(w, w));
			if (norm < 1e-12) break;
			for (let i = 0; i < n; i++) v[i] = w[i] / norm;
			const l2 = vDot(v, matVec(M, v));
			if (Math.abs(l2 - lambda) < 1e-11 * Math.max(1, Math.abs(l2))) { lambda = l2; break; }
			lambda = l2;
		}
		return { vec: v, val: lambda };
	}

	function covMatrix(X) {
		const n = X.length, d = X[0].length;
		const mean = new Array(d).fill(0);
		for (const r of X) for (let i = 0; i < d; i++) mean[i] += r[i] / n;
		const C = [];
		for (let i = 0; i < d; i++) {
			C.push(new Array(d).fill(0));
			for (let j = 0; j <= i; j++) {
				let s = 0;
				for (const r of X) s += (r[i] - mean[i]) * (r[j] - mean[j]);
				s /= n;
				C[i][j] = s; C[j][i] = s;
			}
		}
		return { C, mean, d };
	}

	function gramMatrix(X) {
		const n = X.length;
		const G = [];
		for (let i = 0; i < n; i++) {
			G.push(new Array(n).fill(0));
			for (let j = 0; j <= i; j++) {
				let s = 0;
				for (let k = 0; k < X[0].length; k++) s += X[i][k] * X[j][k];
				G[i][j] = s; G[j][i] = s;
			}
		}
		return G;
	}

	function projectRow(x, vec, mean) {
		return vDot(x, vec) - vDot(mean, vec);
	}

	// Returns { coords: [n][k], basis: [k][d], mean: [d], explained: [] }
	// Uses covariance when d is small, Gram (dual) trick when d is large.
	function pcaRows(X, targetDim) {
		const n = X.length;
		if (n < 2) return null;
		const d = X[0].length;
		targetDim = Math.min(targetDim, n, d);
		if (targetDim < 1) return null;
		const k = Math.min(targetDim, 3);

		let basis = [], mean = [], coords = [], explained = [];

		if (d <= 80) {
			const { C, mean: m } = covMatrix(X);
			mean = m;
			let residual = C;
			for (let c = 0; c < k; c++) {
				const { vec } = dominantEigVec(residual, d);
				basis.push(vec);
				const lam = vDot(vec, matVec(C, vec));
				explained.push(lam);
				// deflate
				const rank1 = vec.map(a => vec.map(b => a * b * lam));
				residual = matSub(residual, rank1);
			}
		} else {
			const G = gramMatrix(X);
			const m = new Array(d).fill(0);
			for (const r of X) for (let i = 0; i < d; i++) m[i] += r[i] / n;
			mean = m;
			let residualG = G;
			for (let c = 0; c < k; c++) {
				const { vec: u, val } = dominantEigVec(residualG, n);
				const sigma = Math.sqrt(Math.max(0, val));
				// v_i = X^T u / sigma
				const v = new Array(d).fill(0);
				for (let i = 0; i < d; i++) {
					let s = 0;
					for (let j = 0; j < n; j++) s += X[j][i] * u[j];
					v[i] = sigma > 1e-9 ? s / sigma : 0;
				}
				const vn = vNorm(v);
				if (vn > 1e-9) for (let i = 0; i < d; i++) v[i] /= vn;
				basis.push(v);
				explained.push(val);
				const rank1 = u.map(a => u.map(b => a * b * val));
				residualG = matSub(residualG, rank1);
			}
		}

		for (const row of X) {
			coords.push(basis.map(v => projectRow(row, v, mean)));
		}
		const tot = explained.reduce((a, b) => a + b, 0);
		return {
			coords,
			basis,
			mean,
			explained: tot > 0 ? explained.map(e => e / tot) : explained,
		};
	}

	// ── projection maps between model space and display space ─────
	// proj: d-vector -> k-vector (display), lift: k-vector -> d-vector
	function makeProjector(points, d_model, dims, method, sliceAxes) {
		const k = dims === "2d" ? 2 : 3;
		// slice mode: pick specific model dimensions as the x/y/z axes, so the
		// user can look at actual 2D/3D slices of the higher-D state space.
		if (method === "slice") {
			const ax = (sliceAxes || [0, 1, 2]).map(a => clamp(Math.round(a) || 0, 0, Math.max(0, d_model - 1)));
			const rows = [];
			for (let i = 0; i < k; i++) {
				const row = new Array(d_model).fill(0);
				if (i < ax.length) row[ax[i]] = 1;
				rows.push(row);
			}
			return {
				method: "slice",
				k, d: d_model,
				sliceAxes: ax.slice(0, k),
				center: new Array(d_model).fill(0),
				B: rows,
				basis: rows,
				toDisp: v => rows.map(r => vDot(r, v)),
				toModel: disp => {
					const out = new Array(d_model).fill(0);
					for (let i = 0; i < Math.min(k, ax.length); i++) out[ax[i]] = disp[i] || 0;
					return out;
				},
				projVec: delta => rows.map(r => vDot(r, delta)),
			};
		}
		if (method === "native" || (method === "auto" && d_model <= 3 && d_model >= k)) {
			const identity = [];
			for (let i = 0; i < k; i++) {
				const row = new Array(d_model).fill(0);
				if (i < d_model) row[i] = 1;
				identity.push(row);
			}
			return {
				method: "native",
				k,
				d: d_model,
				center: new Array(d_model).fill(0),
				B: identity,
				basis: identity.map(r => [...r]),
				toDisp: v => identity.map(r => vDot(r, v)),
				toModel: disp => {
					const out = new Array(d_model).fill(0);
					for (let i = 0; i < Math.min(k, d_model); i++) out[i] = disp[i] || 0;
					return out;
				},
				projVec: delta => identity.map(r => vDot(r, delta)),
			};
		}
		// PCA path
		const fit = pcaRows(points, k);
		if (fit && fit.coords && fit.coords.length === points.length) {
			const B = fit.basis; // k x d
			const center = fit.mean;
			return {
				method: "pca",
				k, d: d_model,
				center, B,
				basis: B,
				explained: fit.explained,
				toDisp: v => B.map(r => vDot(r, v)),
				toModel: disp => {
					const out = center.slice();
					for (let j = 0; j < k; j++) {
						const c = disp[j] || 0;
						for (let i = 0; i < d_model; i++) out[i] += c * B[j][i];
					}
					return out;
				},
				projVec: delta => B.map(r => vDot(r, delta)),
			};
		}
		// fallback: first k dims
		const identity = [];
		for (let i = 0; i < k; i++) {
			const row = new Array(d_model).fill(0);
			if (i < d_model) row[i] = 1;
			identity.push(row);
		}
		return {
			method: "native",
			k, d: d_model,
			center: new Array(d_model).fill(0),
			B: identity,
			basis: identity,
			toDisp: v => identity.map(r => vDot(r, v)),
			toModel: disp => {
				const out = new Array(d_model).fill(0);
				for (let i = 0; i < Math.min(k, d_model); i++) out[i] = disp[i] || 0;
				return out;
			},
			projVec: delta => identity.map(r => vDot(r, delta)),
		};
	}

	// ── persistent homology ───────────────────────────────────────
	function distMatrix(points) {
		const n = points.length;
		const D = [];
		let maxD = 0;
		for (let i = 0; i < n; i++) {
			D.push(new Array(n).fill(0));
			for (let j = 0; j < n; j++) {
				if (i === j) continue;
				const dd = vSub(points[i], points[j]);
				const d = vNorm(dd);
				D[i][j] = d;
				if (d > maxD) maxD = d;
			}
		}
		return { matrix: D, n, maxD };
	}

	function unionFind(n) {
		const parent = new Int32Array(n), rank = new Int32Array(n), size = new Int32Array(n);
		for (let i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
		return {
			find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; },
			union(x, y) {
				let rx = this.find(x), ry = this.find(y);
				if (rx === ry) return false;
				if (rank[rx] < rank[ry]) { const t = rx; rx = ry; ry = t; }
				parent[ry] = rx; size[rx] += size[ry];
				if (rank[rx] === rank[ry]) rank[rx]++;
				return true;
			},
			size,
		};
	}

	function bfsPathLen(adjacency, start, end, maxDepth) {
		if (start === end) return 0;
		const visited = new Uint8Array(adjacency.length);
		const queue = [{ node: start, depth: 0 }];
		visited[start] = 1;
		let head = 0;
		while (head < queue.length) {
			const cur = queue[head++];
			if (cur.depth > maxDepth) return Infinity;
			for (const nb of adjacency[cur.node]) {
				if (nb.node === end) return cur.depth + 1;
				if (!visited[nb.node]) { visited[nb.node] = 1; queue.push({ node: nb.node, depth: cur.depth + 1 }); }
			}
		}
		return Infinity;
	}

	function computeH0Persistence(dist, minPers) {
		const n = dist.n, D = dist.matrix;
		const edges = [];
		for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
			const d = D[i][j];
			if (isFinite(d) && d > 0) edges.push({ i, j, d });
		}
		edges.sort((a, b) => a.d - b.d);
		const uf = unionFind(n);
		const pers = [];
		for (const e of edges) {
			if (uf.find(e.i) !== uf.find(e.j)) {
				if (e.d > minPers) pers.push({ birth: 0, death: e.d, persistence: e.d, dimension: 0, rep: [e.i, e.j] });
				uf.union(e.i, e.j);
			}
		}
		pers.push({ birth: 0, death: Infinity, persistence: Infinity, dimension: 0, rep: null });
		return pers;
	}

	function computeH1Persistence(dist, minPers) {
		const n = dist.n, D = dist.matrix;
		if (n < 3) return [];
		const edges = [];
		for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
			const d = D[i][j];
			if (isFinite(d) && d > 0) edges.push({ i, j, d });
		}
		if (edges.length < 3) return [];
		edges.sort((a, b) => a.d - b.d);
		edges.splice(Math.min(edges.length, 900));
		const adjacency = new Array(n);
		for (let i = 0; i < n; i++) adjacency[i] = [];
		const uf = unionFind(n);
		const seen = {};
		const pers = [];
		for (const e of edges) {
			const ri = uf.find(e.i), rj = uf.find(e.j);
			if (ri === rj) {
				const birth = e.d;
				const pathLen = bfsPathLen(adjacency, e.i, e.j, 10);
				if (pathLen >= 2 && pathLen <= 10) {
					const death = birth * (1 + 0.5 / pathLen);
					const p = death - birth;
					const key = Math.min(e.i, e.j) + "_" + Math.max(e.i, e.j) + "_" + pathLen;
					if (!seen[key] && p > minPers) {
						seen[key] = true;
						pers.push({ birth, death, persistence: p, dimension: 1, rep: [e.i, e.j], cycleLength: pathLen + 1 });
					}
				}
			} else {
				uf.union(e.i, e.j);
			}
			adjacency[e.i].push({ node: e.j, d: e.d });
			adjacency[e.j].push({ node: e.i, d: e.d });
		}
		pers.sort((a, b) => b.persistence - a.persistence);
		return pers.slice(0, 40);
	}

	function computeBettiCurve(persistence, maxDist, steps, dim) {
		const curve = [];
		for (let s = 0; s <= steps; s++) {
			const eps = (s / steps) * (maxDist || 1);
			let count = 0;
			for (const p of persistence) {
				if (p.dimension !== dim) continue;
				if (p.birth <= eps && (p.death > eps || !isFinite(p.death))) count++;
			}
			curve.push({ epsilon: eps, betti: count });
		}
		return curve;
	}

	function topoSummary(persistence) {
		const h0 = [], h1 = [], finite = [];
		for (const p of persistence) {
			if (p.dimension === 0) h0.push(p);
			if (p.dimension === 1) h1.push(p);
			if (isFinite(p.persistence)) finite.push(p.persistence);
		}
		const maxP = finite.length ? Math.max(...finite) : 0;
		const sumP = finite.reduce((a, b) => a + b, 0);
		const meanP = finite.length ? sumP / finite.length : 0;
		return { h0: h0.length, h1: h1.length, maxP, meanP, sumP };
	}

	// ── weight helpers ────────────────────────────────────────────
	function flattenLayerWeights(layer) {
		const out = [];
		const att = (layer && layer.attention) || {};
		for (const k of GROUP_KEYS) flatten2d(att[k], out);
		flatten1d(layer.gamma, out);
		flatten1d(layer.beta, out);
		flatten1d(layer.gamma2, out);
		flatten1d(layer.beta2, out);
		flatten2d(layer.W1, out);
		flatten1d(layer.b1, out);
		flatten2d(layer.W2, out);
		flatten1d(layer.b2, out);
		return out;
	}

	function collectFlat(weights) {
		if (!weights || !weights.length) return null;
		const flat = [];
		for (const layer of weights) {
			const f = flattenLayerWeights(layer);
			for (const v of f) flat.push(v);
		}
		// embeddings
		if (window.persistentEmbeddingSpace) {
			for (const word of Object.keys(window.persistentEmbeddingSpace)) {
				const vec = window.persistentEmbeddingSpace[word];
				if (vec) for (const v of vec) flat.push(v);
			}
		}
		return flat;
	}

	function computeWeightDeltas(prev, next) {
		const deltas = [];
		const n = Math.min(prev.length, next.length);
		for (let l = 0; l < n; l++) {
			const p = prev[l], q = next[l];
			const groupNorms = {};
			const groups = {
				query: [p.attention.query, q.attention.query],
				key: [p.attention.key, q.attention.key],
				value: [p.attention.value, q.attention.value],
				output: [p.attention.output, q.attention.output],
				gamma: [p.gamma, q.gamma],
				beta: [p.beta, q.beta],
				gamma2: [p.gamma2, q.gamma2],
				beta2: [p.beta2, q.beta2],
				W1: [p.W1, q.W1],
				b1: [p.b1, q.b1],
				W2: [p.W2, q.W2],
				b2: [p.b2, q.b2],
			};
			let total = 0;
			const names = Object.keys(groups);
			names.forEach((g, gi) => {
				let nrm = 0;
				const [pa, qa] = groups[g];
				if (Array.isArray(pa) && Array.isArray(qa)) {
					if (Array.isArray(pa[0])) {
						nrm = matFrob(matSub(qa, pa));
					} else {
						let s = 0;
						for (let i = 0; i < Math.min(pa.length, qa.length); i++) s += (qa[i] - pa[i]) * (qa[i] - pa[i]);
						nrm = Math.sqrt(s);
					}
				}
				groupNorms[GROUP_NAMES[gi]] = nrm;
				total += nrm * nrm;
			});
			deltas.push({ groupNorms, totalNorm: Math.sqrt(total) });
		}
		return deltas;
	}

	// ── residual stream ───────────────────────────────────────────
	function buildResidualStream(tokens, weights, d_model, n_heads, n_layers) {
		if (!hasGlobal("embedTokensWithPE") || !hasGlobal("forwardOneLayer")) return null;
		if (!tokens || !tokens.length) return null;
		const layers = [];
		let h = window.embedTokensWithPE(tokens, d_model);
		layers.push(h);
		for (let l = 0; l < n_layers; l++) {
			try {
				const res = window.forwardOneLayer(h, weights[l], d_model, n_heads, tokens, null, null);
				h = res.h_out;
			} catch (e) {
				break;
			}
			layers.push(h);
		}
		return layers;
	}

	// ── flow field (phase diagram) ────────────────────────────────
	function evalFlowAt(layerIdx, dispPoint, proj, realContext, d_model, n_heads, flowMode) {
		if (!hasGlobal("forwardOneLayer")) return { dx: 0, dy: 0, dz: 0, mag: 0 };
		const modelIn = proj.toModel(dispPoint);
		let context;
		if (flowMode === "context" && realContext && realContext.length) {
			context = realContext.map(row => [...row]);
			context[context.length - 1] = modelIn.slice();
		} else {
			context = [modelIn.slice()];
		}
		let out;
		try {
			const res = window.forwardOneLayer(context, window.currentWeights[layerIdx], d_model, n_heads, null, null, null);
			out = res.h_out[res.h_out.length - 1];
		} catch (e) {
			return { dx: 0, dy: 0, dz: 0, mag: 0 };
		}
		const delta = modelIn.map((v, i) => (out[i] || 0) - v);
		const dispDelta = proj.projVec(delta);
		const dx = dispDelta[0] || 0;
		const dy = dispDelta[1] || 0;
		const dz = dispDelta[2] || 0;
		return { dx, dy, dz, mag: Math.hypot(dx, dy, dz) };
	}

	function computeBounds(dispPoints, dims) {
		const k = dims === "2d" ? 2 : 3;
		const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
		for (const p of dispPoints) {
			for (let i = 0; i < k; i++) {
				const v = p[i] || 0;
				if (v < lo[i]) lo[i] = v;
				if (v > hi[i]) hi[i] = v;
			}
		}
		for (let i = 0; i < k; i++) {
			if (!isFinite(lo[i]) || !isFinite(hi[i])) { lo[i] = -1; hi[i] = 1; }
			if (lo[i] === hi[i]) { lo[i] -= 1; hi[i] += 1; }
			const pad = (hi[i] - lo[i]) * 0.35;
			lo[i] -= pad; hi[i] += pad;
		}
		return { lo, hi, k };
	}

	function computeVectorField(layerIdx, dispPoints, proj, realContext, d_model, n_heads, flowMode, gridRes, dims, bounds) {
		// A shared `bounds` can be passed in so multiple vector fields (e.g. one
		// per layer) live in the same coordinate frame and stay comparable.
		const bnds = bounds || computeBounds(dispPoints, dims);
		const k = bnds.k;
		const is3d = k === 3;
		const res = Math.max(3, gridRes | 0);
		const grid = [];
		const maxDiv = 0.001;
		let maxMag = 0;

		const coordAxis = (axis, t) =>
			bnds.lo[axis] + (bnds.hi[axis] - bnds.lo[axis]) * (res === 1 ? 0.5 : t / (res - 1));

		// flat grid of cells, each carrying its coordinates + flow vector.
		// 2D: idx = j*res + i ; 3D: idx = (k*res + j)*res + i
		if (!is3d) {
			for (let j = 0; j < res; j++) {
				for (let i = 0; i < res; i++) {
					const x = coordAxis(0, i), y = coordAxis(1, j);
					const f = evalFlowAt(layerIdx, [x, y], proj, realContext, d_model, n_heads, flowMode);
					f.i = i; f.j = j; f.k = 0; f.x = x; f.y = y; f.z = 0;
					grid.push(f);
					if (f.mag > maxMag) maxMag = f.mag;
				}
			}
		} else {
			for (let kk = 0; kk < res; kk++) {
				for (let j = 0; j < res; j++) {
					for (let i = 0; i < res; i++) {
						const x = coordAxis(0, i), y = coordAxis(1, j), z = coordAxis(2, kk);
						const f = evalFlowAt(layerIdx, [x, y, z], proj, realContext, d_model, n_heads, flowMode);
						f.i = i; f.j = j; f.k = kk; f.x = x; f.y = y; f.z = z;
						grid.push(f);
						if (f.mag > maxMag) maxMag = f.mag;
					}
				}
			}
		}

		// divergence via central differences
		const n = grid.length;
		const div = new Float64Array(n);
		for (let c = 0; c < n; c++) {
			const cell = grid[c];
			if (!is3d) {
				const il = Math.max(0, cell.i - 1), ir = Math.min(res - 1, cell.i + 1);
				const jl = Math.max(0, cell.j - 1), jr = Math.min(res - 1, cell.j + 1);
				const dx = (grid[cell.j * res + ir].dx - grid[cell.j * res + il].dx) / Math.max(1, ir - il);
				const dy = (grid[jr * res + cell.i].dy - grid[jl * res + cell.i].dy) / Math.max(1, jr - jl);
				div[c] = dx + dy;
			} else {
				const il = Math.max(0, cell.i - 1), ir = Math.min(res - 1, cell.i + 1);
				const jl = Math.max(0, cell.j - 1), jr = Math.min(res - 1, cell.j + 1);
				const kl = Math.max(0, cell.k - 1), kr = Math.min(res - 1, cell.k + 1);
				const dx = (grid[(cell.k * res + cell.j) * res + ir].dx - grid[(cell.k * res + cell.j) * res + il].dx) / Math.max(1, ir - il);
				const dy = (grid[(cell.k * res + jr) * res + cell.i].dy - grid[(cell.k * res + jl) * res + cell.i].dy) / Math.max(1, jr - jl);
				const dz = (grid[(kr * res + cell.j) * res + cell.i].dz - grid[(kl * res + cell.j) * res + cell.i].dz) / Math.max(1, kr - kl);
				div[c] = dx + dy + dz;
			}
			cell.div = div[c];
		}
		const dMin = Math.min(...div), dMax = Math.max(...div);
		const dAbs = Math.max(Math.abs(dMin), Math.abs(dMax), maxDiv);

		// attractors (sinks) / repellers (sources)
		const attractors = detectExtrema(grid, div, is3d, res, true, dAbs);
		const repellers = detectExtrema(grid, div, is3d, res, false, dAbs);

		return {
			bounds: bnds, grid, cols: res, rows: res, res, k, is3d, div, dMin, dMax, dAbs, maxMag,
			attractors, repellers,
		};
	}

	function detectExtrema(grid, div, is3d, res, wantNegative, dAbs) {
		const n = grid.length;
		const cands = [];
		for (let c = 0; c < n; c++) {
			const d = div[c];
			if (wantNegative && d < -0.25 * dAbs) cands.push(grid[c]);
			else if (!wantNegative && d > 0.25 * dAbs) cands.push(grid[c]);
		}
		cands.sort((a, b) => wantNegative ? a.div - b.div : b.div - a.div);
		const picks = [];
		for (const c of cands) {
			if (picks.some(p => Math.abs(p.i - c.i) + Math.abs(p.j - c.j) + Math.abs(p.k - c.k) < (is3d ? 2 : 3))) continue;
			picks.push(c);
			if (picks.length >= (is3d ? 8 : 5)) break;
		}
		return picks.map(c => ({ x: c.x, y: c.y, z: c.z, d: c.div, mag: c.mag, i: c.i, j: c.j, k: c.k }));
	}

	function flowAtDisplayPoint(disp, layerIdx, proj, realContext, d_model, n_heads, flowMode) {
		return evalFlowAt(layerIdx, disp, proj, realContext, d_model, n_heads, flowMode);
	}

	function integrateStreamlines(seeds, layerIdx, proj, realContext, d_model, n_heads, flowMode, bounds, k, maxSteps) {
		const trails = [];
		const diag = Math.hypot(bounds.hi[0] - bounds.lo[0], bounds.hi[1] - bounds.lo[1], bounds.hi[2] - bounds.lo[2]) || 1;
		for (const seed of seeds) {
			let p = [seed[0], seed[1], seed[2] || 0];
			const trail = [p.slice()];
			let converged = false;
			for (let s = 0; s < maxSteps; s++) {
				const v = flowAtDisplayPoint(p, layerIdx, proj, realContext, d_model, n_heads, flowMode);
				if (v.mag < 1e-6) { converged = true; break; }
				const step = 0.5 * (diag / Math.max(8, Math.cbrt(maxSteps || 16)));
				const nx = p[0] + v.dx * step;
				const ny = p[1] + v.dy * step;
				const nz = k === 3 ? p[2] + v.dz * step : 0;
				if (nx < bounds.lo[0] || nx > bounds.hi[0] || ny < bounds.lo[1] || ny > bounds.hi[1]) break;
				if (k === 3 && (nz < bounds.lo[2] || nz > bounds.hi[2])) break;
				p = [nx, ny, nz];
				trail.push(p.slice());
				if (trail.length > 2 && Math.hypot(p[0] - seed[0], p[1] - seed[1], p[2] - seed[2]) > diag * 1.4) break;
			}
			if (trail.length > 1 || converged) trails.push({ trail, converged, seed });
		}
		return trails;
	}

	function computeBasins(vf, layerIdx, proj, realContext, d_model, n_heads, flowMode) {
		if (!vf || vf.is3d) return null;
		const { cols, rows, bounds, attractors } = vf;
		if (!attractors.length) return null;
		const ids = attractors.map((a, idx) => ({ x: a.x, y: a.y, id: idx }));
		const z = [];
		let used = 0;
		for (let j = 0; j < rows; j++) {
			z.push([]);
			for (let i = 0; i < cols; i++) {
				const x = bounds.lo[0] + (bounds.hi[0] - bounds.lo[0]) * (cols === 1 ? 0.5 : i / (cols - 1));
				const y = bounds.lo[1] + (bounds.hi[1] - bounds.lo[1]) * (rows === 1 ? 0.5 : j / (rows - 1));
				// integrate a few steps
				let p = [x, y];
				for (let s = 0; s < 5; s++) {
					const v = flowAtDisplayPoint(p, layerIdx, proj, realContext, d_model, n_heads, flowMode);
					if (v.mag < 1e-6) break;
					p = [p[0] + v.dx * 0.35, p[1] + v.dy * 0.35];
					if (p[0] < bounds.lo[0] || p[0] > bounds.hi[0] || p[1] < bounds.lo[1] || p[1] > bounds.hi[1]) break;
				}
				let best = -1, bd = Infinity;
				for (const a of ids) {
					const dd = Math.hypot(p[0] - a.x, p[1] - a.y);
					if (dd < bd) { bd = dd; best = a.id; }
				}
				if (best >= 0) used++;
				z[j].push(best);
			}
		}
		return { z, cols, rows, ids, used, total: cols * rows };
	}

	// ── snapshot ──────────────────────────────────────────────────
	function buildSnapshot(snap) {
		const residual = buildResidualStream(snap.tokens, snap.weights, snap.d_model, snap.n_heads, snap.n_layers);
		const deltas = snap.prevWeights ? computeWeightDeltas(snap.prevWeights, snap.weights) : null;
		const attention = S.attention.length ? S.attention.slice(-Math.max(1, snap.n_layers)) : [];
		return {
			epoch: snap.epoch,
			loss: snap.loss,
			tokens: (snap.tokens || []).slice(),
			d_model: snap.d_model,
			n_layers: snap.n_layers,
			n_heads: snap.n_heads,
			residual,
			deltas,
			attention,
			weights: snap.weights,
			embeddings: window.persistentEmbeddingSpace ? Object.keys(window.persistentEmbeddingSpace) : [],
		};
	}

	// ── analysis frame ────────────────────────────────────────────
	function analysisPointCloud() {
		if (!S.cur) return null;
		const mode = CFG.mode;
		if (mode === "residual") {
			const { residual, tokens, d_model } = S.cur;
			if (!residual) return null;
			const pts = [];
			const labels = [];
			const layerIdx = [];
			const tokenIdx = [];
			const selLayer = CFG.layer;
			if (selLayer < 0) {
				// all layers of the current snapshot
				residual.forEach((layer, li) => {
					layer.forEach((vec, ti) => {
						pts.push(vec);
						labels.push(tokenLabel(tokens[ti]));
						layerIdx.push(li);
						tokenIdx.push(ti);
					});
				});
			} else {
				// selected layer across the last K epochs
				const hist = S.epochs.filter(e => e.residual && e.residual[selLayer]).slice(-CFG.history);
				if (hist.length === 0 && S.cur.residual[selLayer]) hist.push(S.cur);
				hist.forEach((snap, hi) => {
					const layer = snap.residual[selLayer];
					layer.forEach((vec, ti) => {
						pts.push(vec);
						labels.push(tokenLabel(snap.tokens[ti] || "?"));
						layerIdx.push(hi);
						tokenIdx.push(ti);
					});
				});
			}
			void d_model;
			return { pts, labels, layerIdx, tokenIdx };
		}
		// weight modes: each epoch = one point
		const rows = S.epochs.filter(e => e.epoch >= 0);
		const flat = [];
		const epIdx = [];
		for (const e of rows) {
			if (CFG.mode === "delta" && e.deltas) {
				const f = [];
				for (const dl of e.deltas) {
					for (const g of GROUP_NAMES) f.push(dl.groupNorms[g] || 0);
				}
				if (!f.length) continue;
				flat.push(f);
			} else if (CFG.mode === "weights") {
				const f = collectFlat(e.weights);
				if (!f) continue;
				flat.push(f);
			}
			epIdx.push(e.epoch);
		}
		if (flat.length < 2) return null;
		return { flat, epIdx, pts: flat };
	}

	function topoPoints() {
		const pc = analysisPointCloud();
		if (!pc) return null;
		const { pts } = pc;
		if (pts.length < 3) return null;
		const dist = distMatrix(pts);
		const h0 = computeH0Persistence(dist, 1e-4);
		const h1 = computeH1Persistence(dist, 1e-4);
		const betti0 = computeBettiCurve(h0.concat(h1), dist.maxD, CFG.epsSteps, 0);
		const betti1 = computeBettiCurve(h0.concat(h1), dist.maxD, CFG.epsSteps, 1);
		return { dist, h0, h1, betti0, betti1, maxD: dist.maxD };
	}

	function computeFrame() {
		const pc = analysisPointCloud();
		const topo = pc ? topoPoints() : null;

		// vector field (only for residual mode + native/PCA projector)
		let vf = null;
		let proj = null;
		let projPoints = null;
		if (CFG.mode === "residual" && pc && S.cur) {
			const d_model = S.cur.d_model;
			const selLayer = CFG.layer;
			const flowLayer = selLayer < 0 ? S.cur.n_layers - 1 : Math.min(selLayer, S.cur.n_layers - 1);
			const method = CFG.projection === "pca" ? "pca" : (CFG.projection === "native" ? "native" : (CFG.projection === "slice" ? "slice" : "auto"));
			const projector = makeProjector(pc.pts, d_model, CFG.dims, method, CFG.sliceAxes);
			proj = projector;
			projPoints = pc.pts.map(p => projector.toDisp(p));

			// real context for 'context' flow mode
			let realContext = null;
			if (CFG.flow === "context" && S.cur.residual) {
				const ctxLayer = Math.min(flowLayer, S.cur.residual.length - 1);
				realContext = S.cur.residual[ctxLayer];
			}
			const vfSig = [S.cur.epoch, CFG.mode, flowLayer, CFG.gridRes, CFG.dims, CFG.flow, CFG.projection,
				CFG.showStream, CFG.showBasins].join("|");
			if (S.vfSig === vfSig && S.frame && S.frame.vf) {
				vf = S.frame.vf;
			} else {
				vf = computeVectorField(flowLayer, projPoints, proj, realContext, d_model, S.cur.n_heads, CFG.flow, CFG.gridRes, CFG.dims);
				// streamlines
				if (CFG.showStream) {
					const seeds = [];
					const { bounds, cols, rows } = vf;
					const add = (x, y, z) => seeds.push([x, y, z]);
					for (const a of vf.attractors.slice(0, 4)) add(a.x, a.y, a.z);
					for (const r of vf.repellers.slice(0, 4)) add(r.x, r.y, r.z);
					const k = vf.k;
					const midX = (bounds.lo[0] + bounds.hi[0]) / 2;
					const midY = (bounds.lo[1] + bounds.hi[1]) / 2;
					const midZ = (bounds.lo[2] + bounds.hi[2]) / 2;
					if (k === 3) {
						add(bounds.lo[0], midY, midZ); add(bounds.hi[0], midY, midZ);
						add(midX, bounds.lo[1], midZ); add(midX, bounds.hi[1], midZ);
						add(midX, midY, bounds.lo[2]); add(midX, midY, bounds.hi[2]);
					} else {
						add(bounds.lo[0], bounds.lo[1], 0); add(bounds.hi[0], bounds.lo[1], 0);
						add(bounds.lo[0], bounds.hi[1], 0); add(bounds.hi[0], bounds.hi[1], 0);
						add(midX, bounds.lo[1], 0); add(midX, bounds.hi[1], 0);
						add(bounds.lo[0], midY, 0); add(bounds.hi[0], midY, 0);
					}
					void cols; void rows;
					vf.streamlines = integrateStreamlines(
						seeds, flowLayer, proj, realContext, d_model, S.cur.n_heads, CFG.flow, bounds, k, 16
					);
				} else {
					vf.streamlines = [];
				}
				if (CFG.showBasins && !vf.is3d) {
					vf.basins = computeBasins(vf, flowLayer, proj, realContext, d_model, S.cur.n_heads, CFG.flow);
				} else {
					vf.basins = null;
				}
				S.vfSig = vfSig;
			}
		}

		// per-layer sweep: attractor/repeller emergence through the layers + forms
		let sweep = null;
		let topoByLayer = null;
		if (CFG.mode === "residual" && pc && S.cur && proj && projPoints) {
			const bounds = vf ? vf.bounds : null;
			sweep = computeLayerSweep(proj, S.cur.d_model, S.cur.n_heads, CFG.dims, bounds);
			topoByLayer = computeTopoByLayer();
		}

		return { pc, topo, proj, projPoints, vf, sweep, topoByLayer, mode: CFG.mode, cur: S.cur };
	}

	// ── per-layer emergence sweep ─────────────────────────────────
	// For every residual layer we compute the flow field on a coarse grid in a
	// shared display frame, detect attractors/repellers, and measure their
	// "form": how many of that layer's token states each one captures. Centers
	// are then matched across consecutive layers to build tracks, so the plot
	// shows where each attractor/repeller is born and how it evolves.
	function computeLayerSweep(proj, d_model, n_heads, dims, bounds) {
		const { residual, n_layers } = S.cur;
		if (!residual || !residual.length) return null;
		const k = dims === "2d" ? 2 : 3;
		const sweepRes = k === 3 ? 6 : 9;
		const allDisp = [];
		for (const layer of residual) for (const v of layer) allDisp.push(proj.toDisp(v));
		const bnds = bounds || computeBounds(allDisp, dims);
		const diag = Math.hypot(bnds.hi[0] - bnds.lo[0], bnds.hi[1] - bnds.lo[1], k === 3 ? bnds.hi[2] - bnds.lo[2] : 0) || 1;
		const thresh = 0.5 * diag;

		const layers = [];
		for (let L = 0; L < residual.length; L++) {
			const layerRes = residual[L];
			const realContext = CFG.flow === "context" ? residual[L] : null;
			const disp = layerRes.map(v => proj.toDisp(v));
			const vf = computeVectorField(L, disp, proj, realContext, d_model, n_heads, CFG.flow, sweepRes, dims, bnds);

			const ownedBy = centers => {
				const counts = new Array(centers.length).fill(0);
				for (const p of disp) {
					let best = -1, bd = Infinity;
					centers.forEach((c, ci) => {
						const dx = p[0] - c.x, dy = p[1] - c.y, dz = k === 3 ? (p[2] || 0) - c.z : 0;
						const dd = Math.hypot(dx, dy, dz);
						if (dd < bd) { bd = dd; best = ci; }
					});
					if (best >= 0 && bd < thresh) counts[best]++;
				}
				return counts;
			};
			const attrOwn = ownedBy(vf.attractors);
			const repOwn = ownedBy(vf.repellers);
			let drift = 0;
			for (const p of disp) drift += flowAtDisplayPoint(p, L, proj, realContext, d_model, n_heads, CFG.flow).mag;
			drift = disp.length ? drift / disp.length : 0;

			layers.push({
				L,
				attractors: vf.attractors.map((a, i) => ({ x: a.x, y: a.y, z: a.z, d: a.d, owned: attrOwn[i] })),
				repellers: vf.repellers.map((r, i) => ({ x: r.x, y: r.y, z: r.z, d: r.d, owned: repOwn[i] })),
				dMin: vf.dMin, dMax: vf.dMax, drift,
			});
		}

		// match centers across consecutive layers into tracks
		const ATTR_PAL = ["#2563eb", "#06b6d4", "#6366f1", "#0ea5e9", "#8b5cf6"];
		const REP_PAL = ["#dc2626", "#f97316", "#ef4444", "#f43f5e", "#fb923c"];
		let idSeq = 0;
		const tracks = [];
		const prevBySign = { attr: [], rep: [] };
		for (const ly of layers) {
			for (const sign of ["attr", "rep"]) {
				const cur = ly[sign === "attr" ? "attractors" : "repellers"];
				const prev = prevBySign[sign];
				const next = [];
				cur.forEach(c => {
					let best = -1, bd = 1e9;
					prev.forEach((p, pi) => {
						if (!p._used) {
							const dd = Math.hypot(c.x - p.x, c.y - p.y, c.z - p.z);
							if (dd < bd) { bd = dd; best = pi; }
						}
					});
					let tr;
					if (best >= 0 && bd < diag * 0.4) {
						prev[best]._used = true;
						tr = prev[best].track;
					} else {
						const color = sign === "attr" ? ATTR_PAL[idSeq % ATTR_PAL.length] : REP_PAL[idSeq % REP_PAL.length];
						tr = { id: ++idSeq, sign, color, points: [] };
						tracks.push(tr);
					}
					tr.points.push({ L: ly.L, x: c.x, y: c.y, z: c.z, d: c.d, owned: c.owned });
					next.push({ ...c, track: tr });
				});
				prevBySign[sign] = next;
			}
		}
		tracks.forEach(t => {
			t.birth = Math.min(...t.points.map(p => p.L));
			t.death = Math.max(...t.points.map(p => p.L));
			t.points.sort((a, b) => a.L - b.L);
		});
		void n_layers;
		return { layers, tracks, bounds: bnds, diag };
	}

	// ── topology per layer ────────────────────────────────────────
	// How many clusters (β₀) and loops (β₁) the state cloud of each layer forms.
	function computeTopoByLayer() {
		const { residual } = S.cur;
		if (!residual) return null;
		const out = [];
		residual.forEach((layer, L) => {
			if (!layer || layer.length < 3) return;
			const dist = distMatrix(layer);
			const h0 = computeH0Persistence(dist, 1e-4);
			const h1 = computeH1Persistence(dist, 1e-4);
			out.push({ L, n: layer.length, h0: h0.length, h1: h1.length, maxD: dist.maxD });
		});
		return out;
	}

	// ── attention hook ────────────────────────────────────────────
	function attnHook(engine, headData, h0, tokens, tokenStrings) {
		try {
			if (!engine || !headData) return;
			const n = headData.length;
			const concat = (h0 || []).map((_, i) => {
				const parts = [];
				for (let h = 0; h < n; h++) {
					const ctx = headData[h] && headData[h].context;
					if (ctx && ctx[i]) parts.push(...ctx[i]);
				}
				return parts;
			});
			const vel = concat.map(row => matVec(engine.this_weights.output, row));
			const attn = headData.map(hd => (hd && hd.this_weights) || null);
			const tstr = (tokenStrings && tokenStrings.length) ? tokenStrings.slice() : (tokens || []);
			S.attention.push({ vel, attn, tokens: tstr, d_model: engine.d_model });
			if (S.attention.length > 90) S.attention.splice(0, S.attention.length - 90);
		} catch (e) { }
	}

	// ── rendering: phase plot ─────────────────────────────────────
	function layoutBase(title) {
		return {
			title: { text: title, font: { size: 12, color: tc("#1e293b") } },
			paper_bgcolor: "rgba(0,0,0,0)",
			plot_bgcolor: "rgba(0,0,0,0)",
			font: { color: tc("#475569"), size: 11 },
			margin: { t: 28, b: 24, l: 46, r: 14 },
			hovermode: "closest",
			showlegend: false,
			autosize: true,
			uirevision: "tda-live",
		};
	}

	function scene3D() {
		const gridC = tc("#e2e8f0"), zeroC = tc("#cbd5e1"), tickC = tc("#64748b");
		return {
			uirevision: "tda-live",
			aspectmode: "cube",
			bgcolor: "rgba(0,0,0,0)",
			xaxis: { gridcolor: gridC, zerolinecolor: zeroC, tickfont: { color: tickC, size: 9 }, title: "" },
			yaxis: { gridcolor: gridC, zerolinecolor: zeroC, tickfont: { color: tickC, size: 9 }, title: "" },
			zaxis: { gridcolor: gridC, zerolinecolor: zeroC, tickfont: { color: tickC, size: 9 }, title: "" },
		};
	}

	// Plotly <2.25 ignores `uirevision` for the 3D camera across data-changing
	// `Plotly.react` calls, snapping back to the default view. Re-apply the
	// current live camera (post-drag) on every 3D re-render so the plot stays
	// rotatable even while training redraws it every few hundred ms.
	function normCamVec(v) {
		if (!v) return null;
		if (Array.isArray(v)) return v.length >= 3 ? { x: v[0], y: v[1], z: v[2] } : null;
		if (typeof v === "object" && v.x !== undefined && v.y !== undefined && v.z !== undefined) {
			return { x: v.x, y: v.y, z: v.z };
		}
		return null;
	}

	function readCurrentCamera(container) {
		try {
			const gd = typeof container === "string" ? el(container) : container;
			if (!gd || !gd._fullLayout || !gd._fullLayout.scene) return null;
			const scene = gd._fullLayout.scene;
			const live = scene._scene && scene._scene.camera;
			const cam = (live && (live.eye || live.center || live.up)) ? live : scene.camera;
			if (!cam) return null;
			const eye = normCamVec(cam.eye), center = normCamVec(cam.center), up = normCamVec(cam.up);
			if (!eye || !center || !up) return null;
			return { eye, center, up };
		} catch (e) { return null; }
	}

	function renderPhase() {
		const container = el("tda-live-phase");
		if (!container) return;
		if (!S.cur) {
			Plotly.react(container, [], layoutBase("TDA Live — run the demo or press Train to see attractors form"), { responsive: true });
			return;
		}
		const frame = S.frame;
		if (!frame) {
			Plotly.react(container, [], layoutBase("TDA Live — computing…"), { responsive: true });
			return;
		}
		if (frame.mode === "residual") renderResidualPhase(container, frame);
		else renderWeightPhase(container, frame);
	}

	function densityOf(pts, projPoints) {
		const n = projPoints.length;
		if (n < 2) return new Array(n).fill(0.5);
		let maxD = 0;
		for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
			const d = vNorm(vSub(projPoints[i], projPoints[j]));
			if (d > maxD) maxD = d;
		}
		const radius = Math.max(1e-6, maxD) * 0.14;
		const dens = [];
		for (let i = 0; i < n; i++) {
			let c = 0;
			for (let j = 0; j < n; j++) {
				if (i === j) continue;
				if (vNorm(vSub(projPoints[i], projPoints[j])) < radius) c++;
			}
			dens.push(c);
		}
		const mx = Math.max(...dens, 1);
		return dens.map(d => d / mx);
	}

	function renderResidualPhase(container, frame) {
		const { pc, projPoints, proj, vf, cur } = frame;
		const traces = [];
		const is3d = CFG.dims === "3d";
		const k = CFG.dims === "2d" ? 2 : 3;

		// ---- basins heatmap (2D) ----
		if (CFG.showBasins && vf && vf.basins) {
			const b = vf.basins;
			const colors = ["#1e3a8a", "#2563eb", "#06b6d4", "#10b981", "#84cc16", "#f59e0b", "#f97316", "#ef4444"];
			const cs = [];
			for (let i2 = 0; i2 < b.ids.length; i2++) {
				cs.push([(i2 + 1) / (b.ids.length + 1), colors[b.ids[i2].id % colors.length]]);
			}
			cs.push([1, colors[b.ids[b.ids.length - 1].id % colors.length]]);
			traces.push({
				type: "heatmap",
				x: Array.from({ length: b.cols }, (_, i) => vf.bounds.lo[0] + (vf.bounds.hi[0] - vf.bounds.lo[0]) * (b.cols === 1 ? 0.5 : i / (b.cols - 1))),
				y: Array.from({ length: b.rows }, (_, j) => vf.bounds.lo[1] + (vf.bounds.hi[1] - vf.bounds.lo[1]) * (b.rows === 1 ? 0.5 : j / (b.rows - 1))),
				z: b.z,
				zmin: -1, zmax: b.ids.length - 1,
				colorscale: [[0, "#e2e8f0"]].concat(cs),
				showscale: false,
				opacity: 0.35,
				hoverinfo: "skip",
			});
		}

		// ---- divergence contour (2D) ----
		if (CFG.showVf && vf && !vf.is3d) {
			const rows = vf.rows, cols = vf.cols;
			const z = [];
			for (let j = 0; j < rows; j++) {
				z.push([]);
				for (let i = 0; i < cols; i++) z[j].push(vf.div[j * cols + i]);
			}
			traces.push({
				type: "heatmap",
				x: Array.from({ length: cols }, (_, i) => vf.bounds.lo[0] + (vf.bounds.hi[0] - vf.bounds.lo[0]) * (cols === 1 ? 0.5 : i / (cols - 1))),
				y: Array.from({ length: rows }, (_, j) => vf.bounds.lo[1] + (vf.bounds.hi[1] - vf.bounds.lo[1]) * (rows === 1 ? 0.5 : j / (rows - 1))),
				z,
				zmin: -vf.dAbs, zmax: vf.dAbs,
				colorscale: [[0, "#1e40af"], [0.5, "rgba(226,232,240,0.4)"], [1, "#dc2626"]],
				showscale: false,
				opacity: 0.28,
				hoverinfo: "skip",
			});
		}

		// ---- vector field: 2D arrows ----
		if (CFG.showVf && vf && !vf.is3d) {
			const xseg = [], yseg = [];
			const { grid, maxMag } = vf;
			const cellW = (vf.bounds.hi[0] - vf.bounds.lo[0]) / Math.max(1, vf.res - 1);
			const cellH = (vf.bounds.hi[1] - vf.bounds.lo[1]) / Math.max(1, vf.res - 1);
			const maxLen = Math.min(cellW, cellH) * 0.5;
			const xs = [], ys = [], colors = [];
			for (const f of grid) {
				const mag = f.mag / (maxMag || 1);
				const len = maxLen * Math.min(1, mag);
				if (len < 1e-6) continue;
				const nx = f.dx / (f.mag || 1), ny = f.dy / (f.mag || 1);
				const x0 = f.x - nx * len * 0.5, y0 = f.y - ny * len * 0.5;
				const x1 = f.x + nx * len * 0.5, y1 = f.y + ny * len * 0.5;
				xseg.push(x0, x1, null); yseg.push(y0, y1, null);
				xs.push(x1); ys.push(y1);
				colors.push(f.div > 0 ? `rgba(220,38,38,${0.3 + 0.6 * mag})` : `rgba(37,99,235,${0.3 + 0.6 * mag})`);
			}
			if (xseg.length) {
				traces.push({
					type: "scatter", mode: "lines",
					x: xseg, y: yseg,
					line: { color: "rgba(100,116,139,0.45)", width: 1.2 },
					hoverinfo: "skip",
				});
				traces.push({
					type: "scatter", mode: "markers",
					x: xs, y: ys,
					marker: { color: colors, size: 4, symbol: "circle" },
					hovertemplate: "flow — divergence %{customdata[0]}<extra>Vector field</extra>",
					customdata: grid.filter(f => (f.mag / (maxMag || 1)) * (Math.min(cellW, cellH) * 0.5) >= 1e-6).map(f => [f.div.toFixed(2)]),
				});
			}
		}

		// ---- vector field: 3D cones (fill the volume) ----
		if (CFG.showVf && vf && vf.is3d) {
			const xs = [], ys = [], zs = [], us = [], vs = [], ws = [], divs = [];
			const { grid, maxMag } = vf;
			const active = [];
			for (const f of grid) {
				if (f.mag < maxMag * 0.03) continue;
				active.push(f);
			}
			const stride = active.length > 600 ? Math.ceil(active.length / 600) : 1;
			for (let a = 0; a < active.length; a += stride) {
				const f = active[a];
				xs.push(f.x); ys.push(f.y); zs.push(f.z);
				us.push(f.dx); vs.push(f.dy); ws.push(f.dz);
				divs.push(f.div);
			}
			if (xs.length) {
				traces.push({
					type: "cone",
					x: xs, y: ys, z: zs, u: us, v: vs, w: ws,
					sizemode: "absolute",
					sizeref: Math.max(maxMag, 1e-6),
					anchor: "tail",
					cauto: false,
					cmin: -vf.dAbs, cmax: vf.dAbs,
					colorscale: [[0, "#2563eb"], [0.5, "#94a3b8"], [1, "#dc2626"]],
					opacity: 0.75,
					customdata: divs,
					hovertemplate: "divergence %{customdata:.2f} — %{customdata:.2f} > 0 pushes away, < 0 pulls in<br>(%{x:.2f}, %{y:.2f}, %{z:.2f})<extra>Flow cone</extra>",
					colorbar: { thickness: 8, title: { text: "div", side: "right" }, tickfont: { size: 9 } },
				});
			}
		}

		// ---- streamlines ----
		if (CFG.showStream && vf && vf.streamlines) {
			for (const st of vf.streamlines) {
				const x = [], y = [], z = [];
				st.trail.forEach((p, ti) => {
					x.push(p[0]); y.push(p[1]);
					if (k === 3) z.push(p[2] || 0);
				});
				const trace = {
					type: is3d ? "scatter3d" : "scatter",
					mode: "lines",
					x, y,
					line: { width: 1.6, color: st.converged ? "rgba(16,185,129,0.75)" : "rgba(168,85,247,0.55)" },
					hovertemplate: st.converged
						? "streamline — settled into an attractor<extra></extra>"
						: "streamline — drift path of a state<extra></extra>",
				};
				if (is3d) { trace.z = z; trace.line = { ...trace.line, color: st.converged ? "rgba(16,185,129,0.8)" : "rgba(168,85,247,0.6)" }; }
				traces.push(trace);
			}
		}

		// ---- attractor / repeller markers ----
		if (CFG.showAttractors && vf) {
			const aX = [], aY = [], aZ = [], rX = [], rY = [], rZ = [], aDiv = [], rDiv = [];
			for (const a of vf.attractors) { aX.push(a.x); aY.push(a.y); aZ.push(a.z); aDiv.push(a.d); }
			for (const r of vf.repellers) { rX.push(r.x); rY.push(r.y); rZ.push(r.z); rDiv.push(r.d); }
			if (aX.length || rX.length) {
				const mkr = (x, y, z, color, sym, isAtt, divs) => {
					const t = {
						type: is3d ? "scatter3d" : "scatter",
						mode: "markers",
						x, y,
						marker: { color, size: 11, symbol: sym, line: { color: "#fff", width: 1 } },
						hovertemplate: (isAtt ? "<b>Attractor</b> — pulls states in (divergence %{customdata:.2f} < 0)" : "<b>Repeller</b> — pushes states away (divergence %{customdata:.2f} > 0)") + "<br>(%{x:.2f}, %{y:.2f}, %{z:.2f})<extra></extra>",
						customdata: divs,
						name: isAtt ? "Attractor" : "Repeller",
					};
					if (is3d) t.z = z;
					return t;
				};
				if (aX.length) traces.push(mkr(aX, aY, aZ, "#2563eb", "diamond", true, aDiv));
				if (rX.length) traces.push(mkr(rX, rY, rZ, "#dc2626", "x", false, rDiv));
			}
		}

		// ---- point cloud ----
		const disp = projPoints;
		const n = disp.length;
		const pcLabels = pc.labels || [];
		const colorBy = CFG.colorby;
		const dens = colorBy === "density" ? densityOf(pc.pts, projPoints) : null;
		const colors = new Array(n).fill(null);
		for (let i = 0; i < n; i++) {
			if (colorBy === "token") colors[i] = tokenColor(pcLabels[i] || "?", 0.9);
			else if (colorBy === "layer") {
				const li = pc.layerIdx[i] || 0;
				const maxL = CFG.layer < 0 ? (S.cur.n_layers || 1) : CFG.history;
				const t = maxL > 1 ? li / (maxL - 1) : 0;
				colors[i] = `hsl(${200 + 60 * t}, 70%, ${52 - 14 * t}%)`;
			} else if (colorBy === "density") {
				const d = dens[i];
				colors[i] = `rgba(239,68,68,${0.25 + 0.75 * d})`;
			} else if (colorBy === "velocity") {
				const f = vf ? nearestFlow(disp[i], vf) : null;
				const m = f ? f.mag / (vf.maxMag || 1) : 0.4;
				colors[i] = `rgba(59,130,246,${0.3 + 0.7 * m})`;
			}
		}
		const sizes = new Array(n).fill(7);
		const isEpochMode = CFG.layer >= 0;
		if (isEpochMode) {
			const histLen = Math.min(CFG.history, Math.max(1, S.epochs.length + 1));
			pc.layerIdx.forEach((hi, i) => {
				const t = histLen > 1 ? hi / (histLen - 1) : 0;
				sizes[i] = 3 + 7 * t;
				if (colorBy === "token") colors[i] = tokenColor(pcLabels[i] || "?", 0.35 + 0.6 * t);
			});
		}

		const hoverText = pcLabels.map((lbl, i) => {
			const li = pc.layerIdx[i] || 0;
			const where = CFG.layer < 0 ? `layer ${li + 1}` : `snapshot ${li + 1}`;
			return `${lbl} · ${where}`;
		});
		const ptTrace = {
			type: is3d ? "scatter3d" : "scatter",
			mode: "markers",
			x: disp.map(p => p[0]), y: disp.map(p => p[1]),
			marker: { color: colors, size: sizes, opacity: 0.9, line: { width: 0 } },
			text: hoverText,
			hovertemplate: is3d
				? "<b>%{text}</b><br>residual state (%{x:.3f}, %{y:.3f}, %{z:.3f})<extra></extra>"
				: "<b>%{text}</b><br>residual state (%{x:.3f}, %{y:.3f})<extra></extra>",
			name: "Residual",
		};
		if (is3d) ptTrace.z = disp.map(p => p[2] || 0);
		traces.push(ptTrace);

		// ---- layer paths (current snapshot, all layers) ----
		if (CFG.showTrails && CFG.layer < 0 && S.cur.residual) {
			const selProj = proj;
			const paths = [];
			const res = S.cur.residual;
			const tokenCount = res[0] ? res[0].length : 0;
			for (let ti = 0; ti < tokenCount; ti++) {
				const x = [], y = [], z = [];
				for (let li = 0; li < res.length; li++) {
					const d = selProj.toDisp(res[li][ti]);
					x.push(d[0]); y.push(d[1]);
					if (k === 3) z.push(d[2] || 0);
				}
				const trace = {
					type: is3d ? "scatter3d" : "scatter",
					mode: "lines",
					x, y,
					line: { width: 1.8, color: tokenColor(pcLabels[ti] || "?", 0.8) },
					hoverinfo: "skip",
				};
				if (is3d) trace.z = z;
				paths.push(trace);
			}
			traces.push(...paths);
		}

		// ---- epoch trails (selected layer across epochs) ----
		if (CFG.showTrails && CFG.layer >= 0) {
			const L = CFG.layer;
			const hist = S.epochs.filter(e => e.residual && e.residual[L]).slice(-CFG.history);
			if (hist.length > 1) {
				const tokenCount = hist[0].residual[L].length;
				for (let ti = 0; ti < tokenCount; ti++) {
					const x = [], y = [], z = [];
					for (const snap of hist) {
						const d = proj.toDisp(snap.residual[L][ti]);
						x.push(d[0]); y.push(d[1]);
						if (k === 3) z.push(d[2] || 0);
					}
					const trace = {
						type: is3d ? "scatter3d" : "scatter",
						mode: "lines+markers",
						x, y,
						marker: { size: 2, color: tokenColor(pcLabels[ti] || "?", 0.7) },
						line: { width: 1.2, color: tokenColor(pcLabels[ti] || "?", 0.45), dash: "dot" },
						hoverinfo: "skip",
					};
					if (is3d) trace.z = z;
					traces.push(trace);
				}
			}
		}

		// ---- attention flow ----
		if (CFG.showAttn && S.cur.attention.length) {
			const attnLayer = CFG.layer < 0 ? 0 : CFG.layer;
			const entry = S.cur.attention[Math.min(attnLayer, S.cur.attention.length - 1)];
			if (entry && entry.vel && proj) {
				const resLayer = Math.min(CFG.layer < 0 ? 0 : CFG.layer, (S.cur.residual || []).length - 1);
				const base = S.cur.residual[resLayer];
				const x = [], y = [], z = [];
				const npts = Math.min(base.length, entry.vel.length);
				for (let i = 0; i < npts; i++) {
					const p0 = proj.toDisp(base[i]);
					const delta = proj.projVec(entry.vel[i]);
					const p1 = [p0[0] + delta[0], p0[1] + delta[1], (p0[2] || 0) + (delta[2] || 0)];
					x.push(p0[0], p1[0], null);
					y.push(p0[1], p1[1], null);
					if (k === 3) z.push(p0[2] || 0, p1[2] || 0, null);
				}
				const trace = {
					type: is3d ? "scatter3d" : "scatter",
					mode: "lines",
					x, y,
					line: { width: 2, color: "rgba(245,158,11,0.85)" },
					hoverinfo: "skip",
				};
				if (is3d) trace.z = z;
				traces.push(trace);
			}
		}

		const title = `Phase space — ${CFG.layer < 0 ? "all residual layers" : "layer " + (CFG.layer + 1) + " across epochs"} (${S.cur.epoch >= 0 ? "epoch " + S.cur.epoch : "idle"})${proj && proj.method === "pca" ? " · PCA" : ""}`;
		const layout = layoutBase(title);
		if (is3d) {
			layout.scene = scene3D();
			const cam = readCurrentCamera(container);
			if (cam) layout.scene.camera = cam;
		}
		else {
			layout.xaxis = { gridcolor: tc("#f1f5f9"), zerolinecolor: tc("#e2e8f0") };
			layout.yaxis = { gridcolor: tc("#f1f5f9"), zerolinecolor: tc("#e2e8f0") };
		}
		Plotly.react(container, traces, layout, { responsive: true });
	}

	function nearestFlow(disp, vf) {
		let best = null, bd = Infinity;
		for (const f of vf.grid) {
			const dd = Math.hypot(f.x - disp[0], f.y - disp[1], (f.z || 0) - (disp[2] || 0));
			if (dd < bd) { bd = dd; best = f; }
		}
		return best;
	}

	function renderWeightPhase(container, frame) {
		const rows = S.epochs.filter(e => e.epoch >= 0);
		const is3d = CFG.dims === "3d";
		const flat = [];
		const epIdx = [];
		for (const e of rows) {
			const f = (CFG.mode === "delta")
				? (e.deltas ? e.deltas.flatMap(dl => GROUP_NAMES.map(g => dl.groupNorms[g] || 0)) : null)
				: collectFlat(e.weights);
			if (!f || !f.length) continue;
			flat.push(f);
			epIdx.push(e.epoch);
		}
		if (flat.length < 2) {
			Plotly.react(container, [], layoutBase("Weight space — train a few epochs to see the trajectory"), { responsive: true });
			return;
		}
		const fit = pcaRows(flat, is3d ? 3 : 2);
		if (!fit) return;
		const traces = [];
		const coords = fit.coords;
		const x = coords.map(c => c[0]), y = coords.map(c => c[1]), z = coords.map(c => c[2] || 0);
		const colors = coords.map((_, i) => {
			const t = epIdx.length > 1 ? i / (epIdx.length - 1) : 0;
			return `hsl(${210 - 140 * t}, 75%, ${40 + 20 * t}%)`;
		});

		const pt = {
			type: is3d ? "scatter3d" : "scatter",
			mode: "markers",
			x, y,
			marker: { color: colors, size: 9, line: { color: "#fff", width: 0.5 } },
			text: epIdx.map(e => "epoch " + e),
			hovertemplate: is3d ? "%{text}<br>(%{x:.3f}, %{y:.3f}, %{z:.3f})" : "%{text}<br>(%{x:.3f}, %{y:.3f})",
			name: CFG.mode === "delta" ? "ΔW trajectory" : "W trajectory",
		};
		if (is3d) pt.z = z;
		traces.push(pt);

		const ln = {
			type: is3d ? "scatter3d" : "scatter",
			mode: "lines",
			x, y,
			line: { width: 2, color: "rgba(99,102,241,0.6)" },
			hoverinfo: "skip",
		};
		if (is3d) ln.z = z;
		traces.push(ln);

		// convergence marker: last epoch
		if (coords.length > 1) {
			const last = coords[coords.length - 1];
			const mk = {
				type: is3d ? "scatter3d" : "scatter",
				mode: "markers",
				x: [last[0]], y: [last[1]],
				marker: { color: "#10b981", size: 14, symbol: "diamond", line: { color: "#fff", width: 1 } },
				text: ["latest"],
				hoverinfo: "text",
			};
			if (is3d) mk.z = [last[2] || 0];
			traces.push(mk);
		}

		const title = (CFG.mode === "delta" ? "Weight deltas ΔW (PCA)" : "Weights W (PCA)") + " · " + (is3d ? "3D" : "2D");
		const layout = layoutBase(title);
		if (is3d) {
			layout.scene = scene3D();
			const cam = readCurrentCamera(container);
			if (cam) layout.scene.camera = cam;
		}
		else {
			layout.xaxis = { gridcolor: tc("#f1f5f9"), zerolinecolor: tc("#e2e8f0") };
			layout.yaxis = { gridcolor: tc("#f1f5f9"), zerolinecolor: tc("#e2e8f0") };
		}
		Plotly.react(container, traces, layout, { responsive: true });
	}

	// ── rendering: TDA panels ─────────────────────────────────────
	function renderPersistence() {
		const container = el("tda-live-persistence");
		if (!container) return;
		const topo = S.frame && S.frame.topo;
		if (!topo) {
			Plotly.react(container, [], layoutBase("Persistence diagram — needs ≥3 points"), { responsive: true });
			return;
		}
		const maxD = topo.maxD || 1;
		const h0x = [], h0y = [], h1x = [], h1y = [];
		for (const p of topo.h0) {
			if (isFinite(p.death)) { h0x.push(p.birth); h0y.push(p.death); }
		}
		for (const p of topo.h1) { h1x.push(p.birth); h1y.push(p.death); }
		const diagX = [0, maxD], diagY = [0, maxD];
		const traces = [
			{ type: "scatter", mode: "lines", x: diagX, y: diagY, line: { color: tc("#cbd5e1"), dash: "dot", width: 1 }, hoverinfo: "skip" },
			{ type: "scatter", mode: "markers", x: h0x, y: h0y, name: "H0", marker: { color: "#ef4444", size: 7, opacity: 0.85 }, hovertemplate: "H0 (birth=%{x:.3f}, death=%{y:.3f})" },
			{ type: "scatter", mode: "markers", x: h1x, y: h1y, name: "H1", marker: { color: "#3b82f6", size: 7, opacity: 0.85 }, hovertemplate: "H1 (birth=%{x:.3f}, death=%{y:.3f})" },
		];
		const layout = layoutBase("Persistence diagram (H₀ red / H₁ blue)");
		layout.xaxis = { title: "birth", range: [0, maxD], gridcolor: tc("#f1f5f9") };
		layout.yaxis = { title: "death", range: [0, maxD], gridcolor: tc("#f1f5f9") };
		layout.margin = { t: 28, b: 30, l: 46, r: 10 };
		Plotly.react(container, traces, layout, { responsive: true });
	}

	function renderBarcode() {
		const container = el("tda-live-barcode");
		if (!container) return;
		const topo = S.frame && S.frame.topo;
		if (!topo) {
			Plotly.react(container, [], layoutBase("Persistence barcode — needs ≥3 points"), { responsive: true });
			return;
		}
		const items = [];
		topo.h0.forEach(p => items.push({ ...p, dim: 0 }));
		topo.h1.forEach(p => items.push({ ...p, dim: 1 }));
		items.sort((a, b) => {
			if (a.dim !== b.dim) return a.dim - b.dim;
			return (isFinite(b.persistence) ? b.persistence : Infinity) - (isFinite(a.persistence) ? a.persistence : Infinity);
		});
		const maxD = topo.maxD || 1;
		const x = [], y = [];
		items.forEach((p, i) => {
			const death = isFinite(p.death) ? p.death : maxD * 1.15;
			x.push(p.birth, death, null);
			y.push(i, i, null);
		});
		const colors = items.flatMap(p => [p.dim === 0 ? "#ef4444" : "#3b82f6", p.dim === 0 ? "#ef4444" : "#3b82f6", "rgba(0,0,0,0)"]);
		const layout = layoutBase("Persistence barcode (top = most persistent)");
		layout.xaxis = { title: "ε", range: [0, maxD * 1.2], gridcolor: tc("#f1f5f9") };
		layout.yaxis = { showticklabels: false, gridcolor: tc("#f1f5f9") };
		layout.margin = { t: 28, b: 30, l: 12, r: 10 };
		const trace = { type: "scatter", mode: "lines", x, y, line: { width: 6 }, marker: { color: colors, size: 6 }, hoverinfo: "skip" };
		Plotly.react(container, [trace], layout, { responsive: true });
	}

	function renderBetti() {
		const container = el("tda-live-betti");
		if (!container) return;
		const topo = S.frame && S.frame.topo;
		if (!topo) {
			Plotly.react(container, [], layoutBase("Betti curves — needs ≥3 points"), { responsive: true });
			return;
		}
		const t0 = { type: "scatter", mode: "lines", name: "β0", x: topo.betti0.map(b => b.epsilon), y: topo.betti0.map(b => b.betti), line: { color: "#ef4444", width: 2 } };
		const t1 = { type: "scatter", mode: "lines", name: "β1", x: topo.betti1.map(b => b.epsilon), y: topo.betti1.map(b => b.betti), line: { color: "#3b82f6", width: 2 } };
		const layout = layoutBase("Betti curves β₀ / β₁ over scale ε");
		layout.xaxis = { title: "ε", gridcolor: tc("#f1f5f9") };
		layout.yaxis = { title: "β", gridcolor: tc("#f1f5f9") };
		layout.showlegend = true;
		layout.legend = { orientation: "h", x: 0.6, y: 1.05, font: { size: 10 } };
		layout.margin = { t: 28, b: 30, l: 40, r: 10 };
		Plotly.react(container, [t0, t1], layout, { responsive: true });
	}

	function renderWeightsPanel() {
		const container = el("tda-live-weights");
		if (!container) return;
		if (!S.cur) {
			Plotly.react(container, [], layoutBase("Learning field — ‖ΔW‖ per matrix"), { responsive: true });
			return;
		}
		const useDelta = CFG.mode === "delta" && S.cur.deltas;
		const z = [];
		const layers = [];
		const nLayers = Math.max(1, S.cur.n_layers || 1);
		for (let l = 0; l < nLayers; l++) {
			layers.push("L" + (l + 1));
			z.push([]);
			for (let g = 0; g < GROUP_NAMES.length; g++) {
				let v = 0;
				if (useDelta && S.cur.deltas[l]) v = S.cur.deltas[l].groupNorms[GROUP_NAMES[g]] || 0;
				else if (CFG.mode === "weights" && S.cur.weights && S.cur.weights[l]) {
					const layer = S.cur.weights[l];
					const att = layer.attention || {};
					if (g === 0) v = matFrob(att.query);
					else if (g === 1) v = matFrob(att.key);
					else if (g === 2) v = matFrob(att.value);
					else if (g === 3) v = matFrob(att.output);
					else if (g === 4) v = vNorm(layer.gamma || []);
					else if (g === 5) v = vNorm(layer.beta || []);
					else if (g === 6) v = vNorm(layer.gamma2 || []);
					else if (g === 7) v = vNorm(layer.beta2 || []);
					else if (g === 8) v = matFrob(layer.W1);
					else if (g === 9) v = vNorm(layer.b1 || []);
					else if (g === 10) v = matFrob(layer.W2);
					else if (g === 11) v = vNorm(layer.b2 || []);
				}
				z[z.length - 1].push(v);
			}
		}
		const hasData = z.some(row => row.some(v => v > 1e-9));
		if (!hasData) {
			Plotly.react(container, [], layoutBase("Learning field — ‖ΔW‖ (available after the first epoch)"), { responsive: true });
			return;
		}
		const trace = {
			type: "heatmap",
			z,
			x: GROUP_NAMES,
			y: layers,
			colorscale: [[0, "#f8fafc"], [0.4, "#93c5fd"], [1, "#1e40af"]],
			showscale: true,
			colorbar: { thickness: 8, tickfont: { size: 9 } },
			hovertemplate: "%{y} %{x} = %{z:.4f}",
		};
		const layout = layoutBase(useDelta ? "Learning field — ‖ΔW‖ per matrix (latest epoch)" : "Weights — ‖W‖ per matrix");
		layout.xaxis = { tickfont: { size: 9 } };
		layout.yaxis = { tickfont: { size: 9 } };
		layout.margin = { t: 28, b: 30, l: 34, r: 44 };
		Plotly.react(container, [trace], layout, { responsive: true });
	}

	function renderSweep() {
		const container = el("tda-live-sweep");
		if (!container) return;
		const frame = S.frame;
		if (!S.cur || CFG.mode !== "residual" || !frame || !frame.sweep) {
			Plotly.react(container, [], layoutBase("Attractor & repeller emergence — available in Residual stream mode"), { responsive: true });
			return;
		}
		const sweep = frame.sweep;
		if (!sweep.tracks.length) {
			Plotly.react(container, [], layoutBase("No attractors / repellers detected yet — train a few epochs"), { responsive: true });
			return;
		}
		const traces = [
			{ type: "scatter", mode: "lines", x: [0, Math.max(1, sweep.layers.length - 1)], y: [0, 0], line: { color: tc("#cbd5e1"), width: 1, dash: "dot" }, hoverinfo: "skip" },
		];
		for (const t of sweep.tracks) {
			const xs = t.points.map(p => p.L);
			const ys = t.points.map(p => p.d);
			const sizes = t.points.map(p => 8 + 10 * Math.min(1, p.owned / 4));
			traces.push({
				type: "scatter", mode: "lines", x: xs, y: ys,
				line: { color: t.color, width: 1.5 }, hoverinfo: "skip",
			});
			traces.push({
				type: "scatter", mode: "markers", x: xs, y: ys,
				marker: { size: sizes, color: t.color, symbol: t.sign === "attr" ? "circle" : "x", line: { width: 1, color: "#fff" } },
				customdata: xs.map((_, i) => [t.id, t.sign, t.points[i].owned, t.birth]),
				hovertemplate: t.sign === "attr"
					? "Attractor #%{customdata[0]}<br>born layer %{customdata[3]}<br>divergence %{y:.3f}<br>owns %{customdata[2]} token state(s)"
					: "Repeller #%{customdata[0]}<br>born layer %{customdata[3]}<br>divergence %{y:.3f}<br>repels %{customdata[2]} token state(s)",
			});
		}
		const layout = layoutBase("Attractors & repellers across layers — where they are born and how they move (dot size = tokens captured)");
		layout.xaxis = { title: "layer", dtick: 1, gridcolor: tc("#f1f5f9") };
		layout.yaxis = { title: "divergence", gridcolor: tc("#f1f5f9"), zeroline: false };
		layout.margin = { t: 28, b: 30, l: 46, r: 10 };
		Plotly.react(container, traces, layout, { responsive: true });

		const sum = el("tda-live-sweep-summary");
		if (sum) {
			const parts = sweep.layers.map(ly => {
				const a = ly.attractors.length ? `<b style="color:${tc("#2563eb")};">${ly.attractors.length} attr</b>` : "0 attr";
				const r = ly.repellers.length ? `<b style="color:${tc("#dc2626")};">${ly.repellers.length} rep</b>` : "0 rep";
				const active = CFG.layer === ly.L;
				const title = CFG.layer === ly.L ? "Layer " + (ly.L + 1) + " — shown in the phase plot" : "Click to view layer " + (ly.L + 1) + " in the phase plot";
				return `<span data-layer="${ly.L}" title="${title}" style="cursor:pointer;white-space:nowrap;${active ? "text-decoration:underline;text-underline-offset:3px;font-weight:700;" : ""}">L${ly.L}: ${a} / ${r} · drift ${ly.drift.toFixed(3)}</span>`;
			});
			const html = parts.join("&nbsp;&nbsp;·&nbsp;&nbsp;");
			if (sum._last !== html) { sum._last = html; sum.innerHTML = html; }
		}
	}

	function renderTopoLayer() {
		const container = el("tda-live-topo");
		if (!container) return;
		const frame = S.frame;
		if (!S.cur || CFG.mode !== "residual" || !frame || !frame.topoByLayer || frame.topoByLayer.length < 2) {
			Plotly.react(container, [], layoutBase("Topology by layer — β₀ / β₁ per residual layer"), { responsive: true });
			return;
		}
		const d = frame.topoByLayer;
		const t0 = { type: "scatter", mode: "lines+markers", name: "β₀ components", x: d.map(x => x.L), y: d.map(x => x.h0), line: { color: "#ef4444", width: 2 }, marker: { size: 6 } };
		const t1 = { type: "scatter", mode: "lines+markers", name: "β₁ loops", x: d.map(x => x.L), y: d.map(x => x.h1), line: { color: "#3b82f6", width: 2 }, marker: { size: 6 } };
		const layout = layoutBase("Topology by layer — how the cloud's shape changes through layers");
		layout.xaxis = { title: "layer", dtick: 1, gridcolor: tc("#f1f5f9") };
		layout.yaxis = { title: "count", gridcolor: tc("#f1f5f9") };
		layout.showlegend = true;
		layout.legend = { orientation: "h", x: 0.6, y: 1.05, font: { size: 10 } };
		layout.margin = { t: 28, b: 30, l: 40, r: 10 };
		Plotly.react(container, [t0, t1], layout, { responsive: true });
	}


	function renderStats() {
		const box = el("tda-live-stats");
		if (!box) return;
		if (!S.cur) { if (box.firstChild) box.replaceChildren(); return; }
		const topo = S.frame && S.frame.topo;
		const vf = S.frame && S.frame.vf;
		const items = [];
		const add = (label, value, color) => { items.push({ label, value, color }); };
		add("view", CFG.layer < 0 ? "all layers" : "layer " + (CFG.layer + 1), CFG.layer < 0 ? "#e0e7ff" : "#dbeafe");
		add("epoch", S.cur.epoch >= 0 ? String(S.cur.epoch) : "idle", "#e0f2fe");
		if (S.cur.loss != null) add("loss", S.cur.loss.toFixed(4), "#dcfce7");
		if (topo) {
			add("β₀ components", String(topo.h0.length), "#fee2e2");
			add("β₁ loops", String(topo.h1.length), "#dbeafe");
			add("max persist", topo.maxD.toFixed(3), "#fef3c7");
		}
		if (vf) {
			add("attractors", String(vf.attractors.length), "#dbeafe");
			add("repellers", String(vf.repellers.length), "#fee2e2");
			add("divergence", vf.dMin.toFixed(2) + " … " + vf.dMax.toFixed(2), "#f1f5f9");
		}
		if (S.cur.deltas && S.cur.deltas.length) {
			const meanD = S.cur.deltas.reduce((a, d) => a + d.totalNorm, 0) / S.cur.deltas.length;
			add("mean ‖ΔW‖", meanD.toFixed(4), "#f5f3ff");
		}
		// Update chips in place: reuse existing chip elements, only touch text
		// that actually changed and only reorder when needed. Rebuilding the
		// row on every update is what made it flicker during live training.
		const existing = Array.from(box.children).filter(c => c.classList.contains("tda-chip"));
		const wanted = new Set(items.map(it => it.label));
		for (const c of existing) if (!wanted.has(c.dataset.label)) c.remove();
		let prev = null;
		for (const it of items) {
			let chip = existing.find(c => c.dataset.label === it.label);
			if (!chip) {
				chip = document.createElement("span");
				chip.className = "tda-chip";
				chip.dataset.label = it.label;
				chip.style.cssText = "display:inline-flex;gap:5px;align-items:baseline;padding:3px 10px;border-radius:6px;color:var(--mn-text,#0f172a);font-size:0.85rem;font-weight:600;";
				chip.innerHTML = `<span style="opacity:0.65;font-weight:700;text-transform:uppercase;font-size:0.68rem;letter-spacing:0.04em;"></span><span style="font-variant-numeric:tabular-nums;"></span>`;
			}
			const lab = chip.children[0], val = chip.children[1];
			if (lab.textContent !== it.label) lab.textContent = it.label;
			if (val.textContent !== it.value) val.textContent = it.value;
			const bg = tc(it.color || "#eef2ff");
			if (chip._bg !== bg) { chip.style.background = bg; chip._bg = bg; }
			if (prev === null) {
				if (box.firstChild !== chip) { box.insertBefore(chip, box.firstChild); }
			} else if (chip.previousElementSibling !== prev) {
				prev.after(chip);
			}
			prev = chip;
		}
	}

	function renderLegend() {
		const box = el("tda-live-legend");
		if (!box) return;
		const items = [];
		if (CFG.mode === "residual") {
			if (CFG.showVf && S.frame && S.frame.vf) {
				items.push({ sw: "linear-gradient(90deg,#dc2626,#94a3b8,#2563eb)", label: "Flow vector", text: "red = repeller (divergence > 0, pushes away), blue = attractor (divergence < 0, pulls in)" });
			}
			if (CFG.showAttractors && S.frame && S.frame.vf && S.frame.vf.attractors.length) {
				items.push({ sw: "#2563eb", shape: "diamond", label: "Attractor", text: "center where states get pulled in — a learned fixed point" });
			}
			if (CFG.showAttractors && S.frame && S.frame.vf && S.frame.vf.repellers.length) {
				items.push({ sw: "#dc2626", shape: "cross", label: "Repeller", text: "center where states get pushed away" });
			}
			if (CFG.showStream) {
				items.push({ sw: "linear-gradient(90deg,rgba(16,185,129,0.7),rgba(168,85,247,0.7))", label: "Streamline", text: "the drift path of a state — settle green = reached an attractor" });
			}
			if (S.frame && S.frame.projPoints) {
				items.push({ sw: "radial-gradient(circle,#3b82f6,#f472b6)", label: "Token states", text: "residual hidden state of each token after each layer (color = token)" });
			}
			if (CFG.showTrails && CFG.layer >= 0) {
				items.push({ sw: "repeating-linear-gradient(90deg,rgba(99,102,241,0.5) 0 4px,transparent 4px 8px)", label: "Epoch trail", text: "how one token's state moved across epochs" });
			}
		} else {
			items.push({ sw: "radial-gradient(circle,#6366f1,#22d3ee)", label: "Epoch point", text: "the whole weight set (or its delta) of one epoch, PCA-projected to 3D/2D" });
			items.push({ sw: "linear-gradient(90deg,#6366f1,#10b981)", label: "Trajectory", text: "the training path through weight space" });
		}
		// In-place diff so an unchanged legend never causes DOM writes/repaints.
		const existing = Array.from(box.children);
		const wanted = new Set(items.map(it => it.label));
		for (const c of existing) if (!wanted.has(c.dataset.label)) c.remove();
		let prev = null;
		items.forEach(it => {
			let el = existing.find(c => c.dataset.label === it.label);
			if (!el) {
				el = document.createElement("span");
				el.dataset.label = it.label;
				el.style.cssText = "display:inline-flex;gap:6px;align-items:center;margin-right:14px;font-size:0.78rem;color:var(--mn-text,#334155);";
				el.innerHTML = `<span style="display:inline-block;flex:0 0 auto;"></span><span></span>`;
			}
			let sw;
			if (it.shape === "diamond") sw = "width:11px;height:11px;transform:rotate(45deg);background:#2563eb;border:1px solid var(--mn-surface,#fff);border-radius:2px;";
			else if (it.shape === "cross") sw = "width:11px;height:11px;background:transparent;border:2px solid #dc2626;border-radius:2px;";
			else sw = `width:18px;height:8px;border-radius:4px;background:${it.sw};`;
			const swEl = el.children[0], txtEl = el.children[1];
			if (swEl.style.cssText !== sw) swEl.style.cssText = sw;
			const txt = `<b>${it.label}</b> — ${it.text}`;
			if (txtEl.innerHTML !== txt) txtEl.innerHTML = txt;
			if (prev === null) {
				if (box.firstChild !== el) box.insertBefore(el, box.firstChild);
			} else if (el.previousElementSibling !== prev) {
				prev.after(el);
			}
			prev = el;
		});
	}

	function renderExplain() {
		const box = el("tda-live-explain");
		if (!box) return;
		const vf = S.frame && S.frame.vf;
		const topo = S.frame && S.frame.topo;
		let html = "";
		if (CFG.mode === "residual") {
			html = "<b>Phase diagram of the residual stream.</b> Every dot is the hidden state of a token after a layer. The flow tells you where that state moves after one more layer.";
			if (vf) {
				if (vf.attractors.length || vf.repellers.length) {
					html += ` <b>${vf.attractors.length} attractor(s)</b> (pull in) and <b>${vf.repellers.length} repeller(s)</b> (push away) have formed.`;
				} else {
					html += " No strong attractors yet — the flow is still diffuse. Train more epochs and watch them form.";
				}
				if (S.cur.epoch < 0) html += " Idle model — click <b>Train Model</b> to watch the attractors organize in real time.";
			}
			const sweep = S.frame && S.frame.sweep;
			if (sweep && sweep.tracks.length) {
				const born = sweep.tracks.filter(t => t.birth > 0);
				html += ` The <b>emergence panel</b> traces ${sweep.tracks.length} attractor/repeller track(s) through the layers; ${born.length ? born.length + " emerge" : "none emerge"} after the first layer.`;
			}
			if (CFG.projection === "slice") {
				html += ` Currently slicing model dims <b>${CFG.sliceAxes.slice(0, CFG.dims === "2d" ? 2 : 3).join(", ")}</b> — raw coordinates, no projection.`;
			}
			if (CFG.layer < 0) {
				html += ` Showing <b>all layers</b> stacked (every dot is labeled by its layer). To focus one layer, pick <b>Layer</b> in the controls below or click a layer in the <b>emergence summary</b>.`;
			} else {
				html += ` Currently viewing <b>layer ${CFG.layer + 1}</b> only, drawn across the last ${Math.max(2, CFG.history)} epochs as a trail. Pick <b>All layers</b> to see the full stack again.`;
			}
		} else if (CFG.mode === "delta") {
			html = "<b>Weight deltas ΔW = W − W_prev per epoch.</b> Each point is one epoch, PCA-projected. Points clustering close together = the weight update is settling down.";
		} else {
			html = "<b>Weights W per epoch (PCA).</b> Each point is the whole weight set of an epoch. The trajectory shows how the model walks through weight space while learning.";
		}
		if (topo && topo.maxD) {
			html += ` <b>Persistence:</b> β₀ = ${topo.h0.length} components, β₁ = ${topo.h1.length} loops — the "shape" of the structure at the current scale.`;
		}
		if (box._last !== html) { box._last = html; box.innerHTML = html; }
	}

	// ── render driver ─────────────────────────────────────────────
	function computeAndRender(force) {
		if (!S.cur) {
			renderPhase();
			renderStats();
			return;
		}
		const sig = [
			CFG.mode, CFG.dims, CFG.projection, CFG.layer, CFG.colorby,
			CFG.flow, CFG.showVf, CFG.showStream, CFG.showTrails, CFG.showAttractors,
			CFG.showBasins, CFG.showAttn, CFG.gridRes, CFG.epsSteps, CFG.history,
			CFG.sliceAxes.join(","),
			S.cur.epoch, S.cur.n_layers, S.cur.d_model,
		].join("|");
		const changed = force || S.frameSig !== sig;
		if (changed) {
			S.frame = computeFrame();
			S.frameSig = sig;
		}
		// Only touch the Plotly graphs when something actually changed.
		// While idle or rotating, `sig` is stable and no Plotly.react runs,
		// so the camera never resets mid-interaction.
		if (changed || S.renderedSig !== sig || !el("tda-live-phase").querySelector(".plot-container")) {
			S.renderedSig = sig;
			renderPhase();
			renderPersistence();
			renderBarcode();
			renderBetti();
			renderSweep();
			renderTopoLayer();
			renderWeightsPanel();
		}
		renderLegend();
		renderExplain();
		renderStats();
	}

	function queueRender() {
		if (S.raf) return;
		S.raf = requestAnimationFrame(() => {
			S.raf = 0;
			const now = performance.now();
			if (now - S.lastRender < 120) { S.lastRender = now; return; }
			if (!isPanelVisible()) return;
			if (typeof Plotly === "undefined") return;
			S.lastRender = now;
			computeAndRender();
		});
	}

	// ── UI wiring ─────────────────────────────────────────────────
	function populateLayerSelect() {
		const sel = el("tda-live-layer");
		if (!sel) return;
		const n = (S.cur && S.cur.n_layers) || (hasGlobal("getTransformerConfig") ? (window.getTransformerConfig().n_layers || 1) : 1);
		let prev = sel.value;
		sel.innerHTML = "";
		const optAll = document.createElement("option");
		optAll.value = "-1"; optAll.textContent = "All layers";
		sel.appendChild(optAll);
		for (let i = 0; i < n; i++) {
			const o = document.createElement("option");
			o.value = String(i); o.textContent = "Layer " + (i + 1);
			sel.appendChild(o);
		}
		if (sel.querySelector(`option[value="${prev}"]`)) sel.value = prev;
		else sel.value = "-1";
		CFG.layer = parseInt(sel.value, 10);
	}

	function selectLayer(L) {
		const sel = el("tda-live-layer");
		if (sel && sel.querySelector(`option[value="${L}"]`)) sel.value = String(L);
		syncCfg();
		S.frameSig = "";
		S.vfSig = "";
		queueRender();
	}

	function syncCfg() {
		const num = id => { const v = parseFloat(el(id).value); return isNaN(v) ? 0 : v; };
		CFG.mode = el("tda-live-mode").value;
		CFG.dims = el("tda-live-dim").value;
		CFG.projection = el("tda-live-projection").value;
		CFG.layer = parseInt(el("tda-live-layer").value, 10);
		CFG.colorby = el("tda-live-colorby").value;
		CFG.flow = el("tda-live-flow").value;
		CFG.showVf = el("tda-live-vf").checked;
		CFG.showStream = el("tda-live-stream").checked;
		CFG.showTrails = el("tda-live-trails").checked;
		CFG.showAttractors = el("tda-live-attractors").checked;
		CFG.showBasins = el("tda-live-basins").checked;
		CFG.showAttn = el("tda-live-attn").checked;
		CFG.auto = el("tda-live-auto").checked;
		CFG.gridRes = num("tda-live-grid");
		CFG.epsSteps = num("tda-live-eps");
		CFG.history = num("tda-live-hist");
		S.maxHistory = CFG.history;
		el("tda-live-grid-val").textContent = CFG.gridRes;
		el("tda-live-eps-val").textContent = CFG.epsSteps;
		el("tda-live-hist-val").textContent = CFG.history;
		const ax0 = el("tda-live-axis0"), ax1 = el("tda-live-axis1"), ax2 = el("tda-live-axis2");
		if (ax0 && ax1 && ax2) CFG.sliceAxes = [parseInt(ax0.value, 10) || 0, parseInt(ax1.value, 10) || 1, parseInt(ax2.value, 10) || 2];
		const sc = el("tda-live-slice-controls");
		if (sc) sc.style.display = CFG.projection === "slice" ? "inline-flex" : "none";
	}

	function wireControls() {
		const ids = ["tda-live-mode", "tda-live-dim", "tda-live-projection", "tda-live-layer",
			"tda-live-colorby", "tda-live-flow", "tda-live-grid", "tda-live-eps", "tda-live-hist",
			"tda-live-axis0", "tda-live-axis1", "tda-live-axis2"];
		ids.forEach(id => {
			const c = el(id);
			if (c) c.addEventListener("input", () => { syncCfg(); S.frameSig = ""; S.vfSig = ""; queueRender(); });
		});
		const checks = ["tda-live-vf", "tda-live-stream", "tda-live-trails", "tda-live-attractors",
			"tda-live-basins", "tda-live-attn", "tda-live-auto"];
		checks.forEach(id => {
			const c = el(id);
			if (c) c.addEventListener("change", () => { syncCfg(); S.frameSig = ""; S.vfSig = ""; queueRender(); });
		});
		const rc = el("tda-live-recompute");
		if (rc) rc.addEventListener("click", () => { S.frameSig = ""; S.vfSig = ""; queueRender(); });
		const rst = el("tda-live-reset");
		if (rst) rst.addEventListener("click", () => { resetHistory(); });
		const sumEl = el("tda-live-sweep-summary");
		if (sumEl && !sumEl._wired) {
			sumEl._wired = true;
			sumEl.addEventListener("click", (ev) => {
				const t = ev.target && ev.target.closest && ev.target.closest("[data-layer]");
				if (t) selectLayer(parseInt(t.dataset.layer, 10));
			});
		}
		// periodic re-render so the view stays live even while scrolling
		setInterval(() => { if (CFG.auto && S.cur && isPanelVisible()) queueRender(); }, 500);
	}

	// ── public API ────────────────────────────────────────────────
	function beginSession() {
		if (!el("tda-live-phase")) return;
		S.active = true;
		populateLayerSelect();
		syncCfg();
		S.frameSig = "";
		S.vfSig = "";
		queueRender();
	}

	function endSession() {
		if (!el("tda-live-phase")) return;
		S.active = false;
		S.frameSig = "";
		S.vfSig = "";
		queueRender();
	}

	function captureEpoch(snap) {
		if (!el("tda-live-phase")) return;
		S.cur = buildSnapshot(snap);
		if (snap.epoch >= 0) {
			S.epochs.push(S.cur);
			if (S.epochs.length > S.maxHistory) S.epochs.splice(0, S.epochs.length - S.maxHistory);
		}
		S.frameSig = "";
		S.vfSig = "";
		if (CFG.auto) queueRender();
	}

	function resetHistory() {
		S.epochs = [];
		S.attention = [];
		S.cur = null;
		S.frame = null;
		S.frameSig = "";
		S.vfSig = "";
		queueRender();
	}

	function recompute() {
		S.frameSig = "";
		S.vfSig = "";
		computeAndRender(true);
	}

	function isActive() { return S.active; }

	function init() {
		if (!el("tda-live-phase")) return;
		if (typeof AttentionEngine !== "undefined" && AttentionEngine.onForward) {
			AttentionEngine.onForward(attnHook);
		}
		populateLayerSelect();
		syncCfg();
		wireControls();
		const s = el("tda-live-status");
		if (s) s.textContent = "hooks: transformer.js + attention_engine.js";
	}

	window.TDALive = {
		beginSession,
		endSession,
		captureEpoch,
		isActive,
		reset: resetHistory,
		recompute,
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
