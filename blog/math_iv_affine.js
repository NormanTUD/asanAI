/* ══════════════════════════════════════════════════════════════════
   Affine Transformation Lab — woven into Math IV ("Affine
   Transformations: Moving Space Itself").

   Two hands-on machines:
   · 2D: an 8×8 checkerboard image (a literal 0/1 matrix, 0 = black,
     1 = white) warped live by a user-editable 3×3 homogeneous
     matrix, with the matrix-vector product shown term by term.
   · 3D: a checkerboard cube warped by a user-editable 4×4
     homogeneous matrix, rendered on a plain 2D canvas (software
     pipeline: map → view-rotate → perspective → painter's sort).

   Conventions followed from the rest of this blog:
   - Theme-aware: isDarkMode() / __MN_DARK.onChange()
   - Math via the blog's own temml renderer (with plain-text fallback)
   - Everything initialises on `blogPostLoadComplete`, AFTER
     renderMarkdown() has restructured the DOM.
   - Failsafe: every piece is wrapped so a failure degrades the lab
     to a readable error box instead of breaking the page. The pure
     math core is DOM-free, exposed on window.__affineMath, and is
     exercised by visible in-page self-tests (and externally in CI).
   ══════════════════════════════════════════════════════════════════ */
(function () {
	'use strict';

	/* ── pure math core (no DOM — safe to load in node for testing) ── */

	const Affine = {
		mul3: function (A, B) {
			const R = new Array(9);
			for (let r = 0; r < 3; r++)
				for (let c = 0; c < 3; c++) {
					let s = 0;
					for (let k = 0; k < 3; k++) s += A[r * 3 + k] * B[k * 3 + c];
					R[r * 3 + c] = s;
				}
			return R;
		},
		mul4: function (A, B) {
			const R = new Array(16);
			for (let r = 0; r < 4; r++)
				for (let c = 0; c < 4; c++) {
					let s = 0;
					for (let k = 0; k < 4; k++) s += A[r * 4 + k] * B[k * 4 + c];
					R[r * 4 + c] = s;
				}
			return R;
		},
		apply3: function (A, p) {
			return [
				A[0] * p[0] + A[1] * p[1] + A[2],
				A[3] * p[0] + A[4] * p[1] + A[5],
				A[6] * p[0] + A[7] * p[1] + A[8]
			];
		},
		apply4: function (A, p) {
			return [
				A[0] * p[0] + A[1] * p[1] + A[2] * p[2] + A[3],
				A[4] * p[0] + A[5] * p[1] + A[6] * p[2] + A[7],
				A[8] * p[0] + A[9] * p[1] + A[10] * p[2] + A[11],
				A[12] * p[0] + A[13] * p[1] + A[14] * p[2] + A[15]
			];
		},
		det3: function (A) {
			return A[0] * (A[4] * A[8] - A[5] * A[7])
				- A[1] * (A[3] * A[8] - A[5] * A[6])
				+ A[2] * (A[3] * A[7] - A[4] * A[6]);
		},
		det4: function (A) {
			const minor = function (r, c) {
				const M = new Array(9);
				let k = 0;
				for (let i = 0; i < 4; i++)
					for (let j = 0; j < 4; j++)
						if (i !== r && j !== c) M[k++] = A[i * 4 + j];
				return Affine.det3(M);
			};
			return A[0] * minor(0, 0) - A[1] * minor(0, 1) + A[2] * minor(0, 2) - A[3] * minor(0, 3);
		},
		inv3: function (A) {
			const d = Affine.det3(A);
			if (!isFinite(d) || Math.abs(d) < 1e-12) return null;
			const id = 1 / d;
			const C = [
				A[4] * A[8] - A[5] * A[7], -(A[1] * A[8] - A[2] * A[7]), A[1] * A[5] - A[2] * A[4],
				-(A[3] * A[8] - A[5] * A[6]), A[0] * A[8] - A[2] * A[6], -(A[0] * A[5] - A[2] * A[3]),
				A[3] * A[7] - A[4] * A[6], -(A[0] * A[7] - A[1] * A[6]), A[0] * A[4] - A[1] * A[3]
			];
			for (let i = 0; i < 9; i++) C[i] *= id;
			return C;
		},
		inv4: function (A) {
			const M = new Array(32);
			for (let r = 0; r < 4; r++) {
				for (let c = 0; c < 4; c++) M[r * 8 + c] = A[r * 4 + c];
				for (let c = 0; c < 4; c++) M[r * 8 + 4 + c] = (r === c) ? 1 : 0;
			}
			for (let col = 0; col < 4; col++) {
				let piv = col;
				for (let r = col + 1; r < 4; r++)
					if (Math.abs(M[r * 8 + col]) > Math.abs(M[piv * 8 + col])) piv = r;
				if (Math.abs(M[piv * 8 + col]) < 1e-12) return null;
				if (piv !== col) {
					for (let c = 0; c < 8; c++) {
						const t = M[col * 8 + c];
						M[col * 8 + c] = M[piv * 8 + c];
						M[piv * 8 + c] = t;
					}
				}
				const d = M[col * 8 + col];
				for (let c = 0; c < 8; c++) M[col * 8 + c] /= d;
				for (let r = 0; r < 4; r++) {
					if (r === col) continue;
					const f = M[r * 8 + col];
					if (f === 0) continue;
					for (let c = 0; c < 8; c++) M[r * 8 + c] -= f * M[col * 8 + c];
				}
			}
			const R = new Array(16);
			for (let r = 0; r < 4; r++)
				for (let c = 0; c < 4; c++) R[r * 4 + c] = M[r * 8 + 4 + c];
			for (let i = 0; i < 16; i++)
				if (!isFinite(R[i])) return null;
			return R;
		},
		rot2: function (a) {
			const c = Math.cos(a), s = Math.sin(a);
			return [c, -s, 0, s, c, 0, 0, 0, 1];
		},
		rotX: function (a) {
			const c = Math.cos(a), s = Math.sin(a);
			return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1];
		},
		rotY: function (a) {
			const c = Math.cos(a), s = Math.sin(a);
			return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1];
		},
		rotZ: function (a) {
			const c = Math.cos(a), s = Math.sin(a);
			return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		}
	};

	/* 2D checkerboard: the unit square [0,1]² cut into 8×8 cells.
	   Cell (i, j) covers u ∈ [i/8,(i+1)/8], v ∈ [j/8,(j+1)/8] and is
	   I[i][j] = (i+j) mod 2  →  0 = black, 1 = white. */
	function cbVal(u, v) {
		if (u < 0 || u >= 1 || v < 0 || v >= 1) return null;
		const i = Math.min(7, Math.floor(u * 8));
		const j = Math.min(7, Math.floor(v * 8));
		return (i + j) % 2;
	}

	/* Bilinear (interpolated) checker value in [0,1], null outside.
	   The 8×8 0/1 matrix is treated as an 8×8 pixel image: pixels are
	   centred at (i+½)/8, so a square's interior stays pure 0 or 1 and
	   only a thin seam blends across each boundary. */
	function cbBilinear(u, v) {
		if (u < 0 || u >= 1 || v < 0 || v >= 1) return null;
		const uu = u * 8 - 0.5, vv = v * 8 - 0.5;
		let i = Math.floor(uu), j = Math.floor(vv);
		i = Math.max(0, Math.min(i, 7));
		j = Math.max(0, Math.min(j, 7));
		const fx = Math.max(0, Math.min(1, uu - i));
		const fy = Math.max(0, Math.min(1, vv - j));
		const v00 = (i + j) % 2;
		const v10 = (i + 1 + j) % 2;
		const v01 = (i + j + 1) % 2;
		const v11 = (i + 1 + j + 1) % 2;
		return v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) + v01 * (1 - fx) * fy + v11 * fx * fy;
	}

	/* Cube [0,1]³, each face carrying a 4×4 checkerboard.
	   Faces are parameterised so that (u,v) ∈ [0,1]² maps onto the
	   face and (0,0) is a corner. K subdivisions per edge. */
	const CUBE_FACES = [
		function (u, v) { return [u, v, 1]; },
		function (u, v) { return [1 - u, v, 0]; },
		function (u, v) { return [1, v, 1 - u]; },
		function (u, v) { return [0, v, u]; },
		function (u, v) { return [u, 1, 1 - v]; },
		function (u, v) { return [u, 0, v]; }
	];

	/* Build the cube's quad mesh: 6 faces × K×K quads, each quad
	   carries its 4 object-space corners and its checker value. */
	function buildCubeQuads(K) {
		const quads = [];
		for (let f = 0; f < 6; f++) {
			const faceFn = CUBE_FACES[f];
			for (let a = 0; a < K; a++)
				for (let b = 0; b < K; b++) {
					const u0 = a / K, u1 = (a + 1) / K, v0 = b / K, v1 = (b + 1) / K;
					const ci = Math.floor(u0 * 4 + 1e-9), cj = Math.floor(v0 * 4 + 1e-9);
					quads.push({
						pts: [faceFn(u0, v0), faceFn(u1, v0), faceFn(u1, v1), faceFn(u0, v1)],
						val: (ci + cj) % 2,
						face: f
					});
				}
		}
		return quads;
	}

	/* Closed-surface volume by the divergence theorem:
	   V = Σ_tri p0 · (p1 × p2) / 6. Expects a closed triangulation
	   (the cube's subdivided surface, 2 triangles per quad). */
	function cubeSurfaceVolume(surfacePts) {
		let v = 0;
		for (let i = 0; i + 2 < surfacePts.length; i += 3) {
			const p0 = surfacePts[i], p1 = surfacePts[i + 1], p2 = surfacePts[i + 2];
			v += p0[0] * (p1[1] * p2[2] - p1[2] * p2[1])
				- p0[1] * (p1[0] * p2[2] - p1[2] * p2[0])
				+ p0[2] * (p1[0] * p2[1] - p1[1] * p2[0]);
		}
		return v / 6;
	}

	/* Shoelace area of a closed polygon (2D points). */
	function polyArea(pts) {
		let a = 0;
		for (let i = 0; i < pts.length; i++) {
			const p = pts[i], q = pts[(i + 1) % pts.length];
			a += p[0] * q[1] - q[0] * p[1];
		}
		return Math.abs(a) / 2;
	}

	/* ── fold + Hopf-link core (pure math, DOM-free) ──
	   The fold:  f(p) = p − λ·ReLU(n̂·p − c)·n̂.  Piecewise-affine:
	   the identity on the near side (n̂·p ≤ c), an affine push on the
	   far side.  λ=2 is a mirror in the crease; λ>1 overlaps space. */

	const Fold = {
		normal2: function (theta) { return [Math.cos(theta), Math.sin(theta)]; },
		normal3: function (tilt, spin) {
			const st = Math.sin(tilt), ct = Math.cos(tilt);
			return [st * Math.cos(spin), st * Math.sin(spin), ct];
		},
		apply2: function (p, n, c, lam) {
			const d = n[0] * p[0] + n[1] * p[1] - c;
			if (d <= 0) return [p[0], p[1]];
			return [p[0] - lam * d * n[0], p[1] - lam * d * n[1]];
		},
		apply3: function (p, n, c, lam) {
			const d = n[0] * p[0] + n[1] * p[1] + n[2] * p[2] - c;
			if (d <= 0) return [p[0], p[1], p[2]];
			return [p[0] - lam * d * n[0], p[1] - lam * d * n[1], p[2] - lam * d * n[2]];
		},
		/* 3×3 homogeneous matrix of the far affine piece (n̂·p > c):
		   f(p) = (I − λ n̂n̂ᵀ) p + λ c n̂ */
		pieceMatrix2: function (n, c, lam) {
			const nx = n[0], ny = n[1];
			return [
				1 - lam * nx * nx, -lam * nx * ny, lam * c * nx,
				-lam * nx * ny, 1 - lam * ny * ny, lam * c * ny,
				0, 0, 1
			];
		},
		/* Preimages of q under the 2-D fold, restricted to the board
		   [0,1]².  Each entry is {p:[x,y], piece:1|2}.  In the overlap
		   region there are two; outside the image, none. */
		preimages2: function (q, n, c, lam) {
			const inB = function (p) { return p[0] >= -1e-9 && p[0] <= 1 + 1e-9 && p[1] >= -1e-9 && p[1] <= 1 + 1e-9; };
			const out = [];
			if (n[0] * q[0] + n[1] * q[1] <= c + 1e-9 && inB(q)) out.push({ p: [q[0], q[1]], piece: 1 });
			const nx = n[0], ny = n[1];
			const a00 = 1 - lam * nx * nx, a01 = -lam * nx * ny;
			const a10 = -lam * nx * ny, a11 = 1 - lam * ny * ny;
			const det = a00 * a11 - a01 * a10;
			if (Math.abs(det) > 1e-9) {
				const bx = q[0] - lam * c * nx, by = q[1] - lam * c * ny;
				const px = (a11 * bx - a01 * by) / det;
				const py = (-a10 * bx + a00 * by) / det;
				if (nx * px + ny * py > c + 1e-9 && inB([px, py])) out.push({ p: [px, py], piece: 2 });
			}
			return out;
		}
	};

	/* Hopf link: two chained circles (the cores of two solid tori).
	   A: the unit circle in the z=0 plane.  B: a circle in the x=0
	   plane, centre (0, 0.5, 0), radius 0.7 — it threads through A's
	   hole once, so the pair is the Hopf link (|Lk| = 1). */
	const Hopf = {
		coreA: function (u) { return [Math.cos(u), Math.sin(u), 0]; },
		coreB: function (t) { return [0, 0.5 + 0.7 * Math.cos(t), 0.7 * Math.sin(t)]; },
		tubeA: function (u, v, r) {
			const e1 = [Math.cos(u), Math.sin(u), 0], e2 = [0, 0, 1];
			return [
				Math.cos(u) + r * (Math.cos(v) * e1[0] + Math.sin(v) * e2[0]),
				Math.sin(u) + r * (Math.cos(v) * e1[1] + Math.sin(v) * e2[1]),
				r * (Math.cos(v) * e1[2] + Math.sin(v) * e2[2])
			];
		},
		tubeB: function (u, v, r) {
			const e1 = [0, Math.cos(u), Math.sin(u)], e2 = [1, 0, 0];
			return [
				r * (Math.cos(v) * e1[0] + Math.sin(v) * e2[0]),
				0.5 + 0.7 * Math.cos(u) + r * (Math.cos(v) * e1[1] + Math.sin(v) * e2[1]),
				0.7 * Math.sin(u) + r * (Math.cos(v) * e1[2] + Math.sin(v) * e2[2])
			];
		}
	};

	function vsub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
	function vdot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
	function vcross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
	function vnorm(a) { return Math.hypot(a[0], a[1], a[2]); }

	function sampleCore(fn, N) {
		const a = [];
		for (let i = 0; i < N; i++) a.push(fn(i / N * 2 * Math.PI));
		return a;
	}

	/* Gauss linking number of two closed polygonal curves (discrete):
	   Lk = (1/4π) ΣΣ (Pᵢ−Qⱼ)·(ΔPᵢ × ΔQⱼ) / |Pᵢ−Qⱼ|³. */
	function gaussLink(P, Q) {
		let s = 0;
		const n = P.length, m = Q.length;
		for (let i = 0; i < n; i++) {
			const Pi = P[i], dP = vsub(P[(i + 1) % n], Pi);
			for (let j = 0; j < m; j++) {
				const Qj = Q[j], dQ = vsub(Q[(j + 1) % m], Qj);
				const r = vsub(Pi, Qj);
				const rr = r[0] * r[0] + r[1] * r[1] + r[2] * r[2];
				if (rr < 1e-12) return { lk: NaN };
				s += vdot(r, vcross(dP, dQ)) / Math.pow(rr, 1.5);
			}
		}
		return { lk: s / (4 * Math.PI) };
	}

	function minDist3(P, Q) {
		let md = Infinity;
		for (let i = 0; i < P.length; i++)
			for (let j = 0; j < Q.length; j++) {
				const d = vnorm(vsub(P[i], Q[j]));
				if (d < md) md = d;
			}
		return md;
	}

	/* Expose the pure core for external self-testing (node CI, etc.) */
	const gbl = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : null);
	if (gbl) gbl.__affineMath = {
		Affine: Affine, Fold: Fold, Hopf: Hopf,
		cbVal: cbVal, cbBilinear: cbBilinear, buildCubeQuads: buildCubeQuads,
		cubeSurfaceVolume: cubeSurfaceVolume, polyArea: polyArea,
		gaussLink: gaussLink, minDist3: minDist3, sampleCore: sampleCore
	};

	/* ── browser-only from here on ──────────────────────────────── */
	if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;

	const $ = function (id) { return document.getElementById(id); };

	function pal() {
		const dark = (typeof isDarkMode === 'function') ? isDarkMode() : true;
		return dark ? {
			dark: true,
			bg: '#060812', panel: '#10141f',
			ink: '#e8ecf7', ink2: '#a0aec8',
			accent: '#7c9cff', cyan: '#22d3ee',
			good: '#4ade80', warn: '#fbbf24', bad: '#f87171',
			line: '#2a3350',
			c0: [13, 16, 26], c1: [226, 232, 245],
			ghost: 'rgba(124,156,255,0.35)'
		} : {
			dark: false,
			bg: '#ffffff', panel: '#f4f1e9',
			ink: '#1e293b', ink2: '#5b6472',
			accent: '#4f46e5', cyan: '#0e7490',
			good: '#15803d', warn: '#b45309', bad: '#dc2626',
			line: '#d8cfc0',
			c0: [23, 26, 33], c1: [255, 255, 255],
			ghost: 'rgba(79,70,229,0.35)'
		};
	}

	function texInto(el, latex, display) {
		if (!el) return;
		if (typeof temml !== 'undefined' && temml.renderToString) {
			try {
				el.innerHTML = temml.renderToString(latex, { displayMode: !!display });
				return;
			} catch (e) { /* fall through to plain text */ }
		}
		el.textContent = latex;
	}

	function fmtNum(v) {
		if (!isFinite(v)) return '?';
		if (v > -0.0001 && v < 0.0001) v = 0;
		const a = Math.abs(v);
		if (a >= 100) return v.toFixed(1);
		if (a >= 10) return v.toFixed(2);
		return v.toFixed(3);
	}

	const round4 = function (v) { return Math.round(v * 10000) / 10000; };
	const lerp3 = function (a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
	const rgbStr = function (c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; };

	/* Plain-text term-by-term of one output coordinate: shows the (symbolic)
	   coefficient times the input coordinate, so the reader sees the matrix
	   actually being applied. `disp` holds the current cell strings. */
	function termLineText(disp, A, r, stride, coords) {
		const parts = [];
		for (let k = 0; k < stride; k++) {
			const coord = (k < stride - 1) ? coords[k] : 1;
			const val = A[r * stride + k] * coord;
			const raw = (disp == null) ? A[r * stride + k] : disp[r * stride + k];
			const ds = String(raw == null ? '' : raw).replace(/\s+/g, '').replace(/^[+\-\u2212]/, '');
			let body = (ds === '') ? fmtNum(Math.abs(val)) : ds;
			if (k < stride - 1) body += '\u00B7' + fmtNum(Math.abs(coord));
			parts.push({ neg: val < -1e-12, body: body });
		}
		let s = '';
		for (let i = 0; i < parts.length; i++) {
			const p = parts[i];
			if (i === 0) s += (p.neg ? '\u2212' : '') + p.body;
			else s += (p.neg ? ' \u2212 ' : ' + ') + p.body;
		}
		return s;
	}

	function showLabError(anchorId, err) {
		console.error('[affine lab]', err);
		const el = $(anchorId);
		if (!el) return;
		const box = document.createElement('div');
		box.className = 'aff-error';
		box.textContent = 'This interactive could not start: ' + (err && err.message ? err.message : String(err));
		el.appendChild(box);
	}

	function makePill(el, text, kind) {
		if (!el) return;
		el.className = 'aff-pill' + (kind ? ' ' + kind : '');
		el.textContent = text;
	}

	/* Shared: build a rows×cols matrix editor of number inputs.
	   Returns { set(m) } or null. onChange(value, r, c) fires on edit. */
	function buildMatrixEditor(hostId, rows, cols, initial, onChange) {
		const host = $(hostId);
		if (!host) return null;
		host.innerHTML = '';
		const inputs = [];
		for (let r = 0; r < rows; r++) {
			const rowEl = document.createElement('div');
			rowEl.className = 'aff-mxrow';
			for (let c = 0; c < cols; c++) {
				const inp = document.createElement('input');
				inp.type = 'text'; // Changed from number to text for symbolic entries
				inp.className = 'aff-mx';
				inp.placeholder = '0';
				inp.value = String(round4(initial[r * cols + c]));
				inp.addEventListener('input', function () {
					const v = parseSymbolic(inp.value);
					if (!isFinite(v)) {
						inp.classList.add('aff-bad');
						return;
					}
					inp.classList.toggle('aff-bad', isNaN(v));
					onChange(v, r, c);
				});
				rowEl.appendChild(inp);
				inputs.push(inp);
			}
			host.appendChild(rowEl);
		}
		return {
			set: function (m) {
				for (let i = 0; i < inputs.length; i++) inputs[i].value = String(round4(m[i]));
			},
			setStrings: function (arr) {
				for (let i = 0; i < inputs.length && i < arr.length; i++) inputs[i].value = arr[i];
			},
			values: function () {
				const out = [];
				for (let i = 0; i < inputs.length; i++) out.push(inputs[i].value);
				return out;
			}
		};
	}

	/**
	 * Parses a string into a number. Supports simple symbolic entries like 'cos(30)'.
	 * @param {string} s 
	 * @returns {number}
	 */
	function parseSymbolic(s) {
		const clean = s.trim().replace(/,/g, '');
		if (clean === '') return 0;
		try {
			// Use a very restricted set of allowed functions for "safety"
			// Note: In a real app, use a real math parser. For this lab, 
			// we use a controlled eval-like pattern or Math object mapping.
			const expr = clean
				.replace(/\bpi\b/gi, 'Math.PI').replace(/\u03C0/g, 'Math.PI')
				.replace(/\bsin\(/g, 'Math.sin(')
				.replace(/\bcos\(/g, 'Math.cos(')
				.replace(/\btan\(/g, 'Math.tan(')
				.replace(/\bsqrt\(/g, 'Math.sqrt(')
				.replace(/\bexp\(/g, 'Math.exp(')
				.replace(/\babs\(/g, 'Math.abs(')
				.replace(/(\d*\.?\d+)\u00B0/g, '($1*Math.PI/180)')
				.replace(/(\d*\.?\d+)deg/gi, '($1*Math.PI/180)');

			// Evaluate the sanitised expression; anything that throws → NaN.
			let val = new Function('"use strict"; return (' + expr + ')')();
			return val;
		} catch (e) {
			return NaN;
		}
	}

	function buildPresetRow(hostId, presets, onPick) {
		const host = $(hostId);
		if (!host) return;
		host.innerHTML = '';
		presets.forEach(function (pr) {
			const b = document.createElement('button');
			b.type = 'button';
			b.className = 'aff-btn';
			b.textContent = pr.name;
			b.addEventListener('click', function () {
				try { onPick(pr); } catch (e) { console.error('[affine lab] preset failed', e); }
			});
			host.appendChild(b);
		});
	}

	function renderChecks(el, results) {
		if (!el) return;
		el.innerHTML = '';
		let pass = 0, total = 0;
		results.forEach(function (r) {
			total++;
			const ok = r[1] === true;
			const na = r[1] === 'n/a' || (typeof r[1] === 'string');
			if (ok) pass++;
			const d = document.createElement('span');
			d.className = 'aff-check' + (ok ? ' good' : (na ? ' na' : ' bad'));
			d.textContent = (ok ? '✓ ' : (na ? '– ' : '✗ ')) + r[0];
			el.appendChild(d);
			if (na && !ok) el.appendChild(document.createTextNode(' ' + r[1] + '  '));
		});
		const sum = document.createElement('span');
		sum.className = 'aff-checksum' + (pass === total ? ' good' : (pass > 0 ? ' warn' : ' bad'));
		sum.textContent = ' self-tests: ' + pass + '/' + total + ' passed';
		el.appendChild(sum);
	}

	/* ══════════════════════════════════════════════════════════════
	   2D LAB
	   ══════════════════════════════════════════════════════════════ */

	const D2 = {
		N: 8,
		win: -0.6, winEnd: 1.6,
		M: Affine.rot2(Math.PI / 6),
		track: [0.25, 0.75],
		bilinear: false,
		singular: false,
		hover: null,
		hoverQueued: false,
		hoverCell: -1,
		trackCell: -1
	};

	const PRESETS2 = [
		{ name: 'Identity', m: function () { return [1, 0, 0, 0, 1, 0, 0, 0, 1]; } },
		{ name: 'Rotate 30°', m: function () { return Affine.rot2(Math.PI / 6); }, disp: ['cos(30°)', '-sin(30°)', '0', 'sin(30°)', 'cos(30°)', '0', '0', '0', '1'] },
		{ name: 'Rotate 90° @ center', m: function () { return [0, -1, 1, 1, 0, 0, 0, 0, 1]; }, disp: ['0', '-1', '1', '1', '0', '0', '0', '0', '1'] },
		{ name: 'Scale ×2', m: function () { return [2, 0, 0, 0, 2, 0, 0, 0, 1]; } },
		{ name: 'Scale ×1.5 @ center', m: function () { return [1.5, 0, -0.25, 0, 1.5, -0.25, 0, 0, 1]; } },
		{ name: 'Shear', m: function () { return [1, 0.7, 0, 0, 1, 0, 0, 0, 1]; } },
		{ name: 'Translate', m: function () { return [1, 0, 0.35, 0, 1, -0.25, 0, 0, 1]; } },
		{ name: 'Mirror x', m: function () { return [-1, 0, 1, 0, 1, 0, 0, 0, 1]; } },
		{ name: 'Projective (perspective)', m: function () { return [1, 0, 0, 0, 1, 0, 0.5, 0, 1]; } },
		{ name: 'Random', m: function () {
			const r = function () { return round4((Math.random() * 2 - 1)); };
			return [r(), r(), r(), r(), r(), r(), 0, 0, 1];
		} }
	];

	function init2d() {
		const srcC = $('aff2d-src'), outC = $('aff2d-out');
		if (!srcC || !outC) return;
		const srcCtx = srcC.getContext('2d');
		const outCtx = outC.getContext('2d');
		if (!srcCtx || !outCtx) {
			showLabError('aff-2d', new Error('Canvas 2D context unavailable'));
			return;
		}
		const size = srcC.width;
		const span = D2.winEnd - D2.win;
		const pxToWorld = function (px) { return D2.win + (px / size) * span; };
		const pyToWorld = function (py) { return D2.winEnd - (py / size) * span; };
		const worldToPx = function (x) { return (x - D2.win) / span * size; };
		const worldToPy = function (y) { return (D2.winEnd - y) / span * size; };

		/* 0/1 matrix display (the image, as data) */
		const matCells = [];
		const matGrid = $('aff2d-matgrid');
		if (matGrid) {
			matGrid.innerHTML = '';
			for (let j = 0; j < D2.N; j++) {
				const row = document.createElement('div');
				row.className = 'aff-matrow';
				for (let i = 0; i < D2.N; i++) {
					const cell = document.createElement('div');
					const val = (i + j) % 2;
					cell.className = 'aff-matcell' + (val ? ' on' : '');
					cell.textContent = String(val);
					row.appendChild(cell);
					matCells.push(cell);
				}
				matGrid.appendChild(row);
			}
		}
		function highlight2dCells() {
			matCells.forEach(function (c, idx) {
				c.classList.toggle('aff-tr', idx === D2.trackCell);
				c.classList.toggle('aff-hv', idx === D2.hoverCell);
			});
		}

		/* Inverse-mapping warp: value seen at output world point (x,y) */
		function warpValue(Ainv, x, y) {
			const w = Affine.apply3(Ainv, [x, y, 1]);
			if (Math.abs(w[2]) < 1e-9) return null;
			const u = w[0] / w[2], v = w[1] / w[2];
			return D2.bilinear ? cbBilinear(u, v) : cbVal(u, v);
		}

		function drawFrame(ctx, P) {
			ctx.strokeStyle = P.line;
			ctx.lineWidth = 1;
			for (let t = 0; t <= 4; t++) {
				const wv = t * 0.5;
				const px = worldToPx(wv), py = worldToPy(wv);
				ctx.globalAlpha = (wv === 0 || wv === 1) ? 0.9 : 0.35;
				ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, size); ctx.stroke();
				ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(size, py); ctx.stroke();
			}
			ctx.globalAlpha = 1;
			ctx.fillStyle = P.ink2;
			ctx.font = '11px monospace';
			ctx.textAlign = 'left';
			for (let t = 0; t <= 4; t++) {
				const wv = t * 0.5;
				ctx.fillText(String(wv), worldToPx(wv) + 3, worldToPy(0) + 14);
				ctx.fillText(String(wv), worldToPx(0) - 24, worldToPy(wv) - 3);
			}
		}

		function drawDot(ctx, x, y, color, r) {
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(worldToPx(x), worldToPy(y), r, 0, Math.PI * 2);
			ctx.fill();
		}

		function draw2dSource() {
			const P = pal();
			srcCtx.fillStyle = P.bg;
			srcCtx.fillRect(0, 0, size, size);
			drawFrame(srcCtx, P);
			for (let j = 0; j < D2.N; j++)
				for (let i = 0; i < D2.N; i++) {
					const u0 = i / D2.N, u1 = (i + 1) / D2.N, v0 = j / D2.N, v1 = (j + 1) / D2.N;
					srcCtx.fillStyle = rgbStr(((i + j) % 2) ? P.c1 : P.c0);
					srcCtx.fillRect(worldToPx(u0), worldToPy(v1), (u1 - u0) / span * size, (v1 - v0) / span * size);
				}
			srcCtx.strokeStyle = P.line;
			srcCtx.strokeRect(worldToPx(0), worldToPy(1), size / span, size / span);
			const hp = D2.hover && D2.hover.pin;
			if (hp) {
				drawDot(srcCtx, hp[0], hp[1], P.cyan, 5);
				srcCtx.strokeStyle = P.cyan;
				srcCtx.lineWidth = 1.5;
				srcCtx.beginPath();
				srcCtx.arc(worldToPx(hp[0]), worldToPy(hp[1]), 9, 0, Math.PI * 2);
				srcCtx.stroke();
				srcCtx.fillStyle = P.cyan;
				srcCtx.font = '11px monospace';
				srcCtx.textAlign = 'left';
				srcCtx.fillText("M\u207B\u00B9p", worldToPx(hp[0]) + 12, worldToPy(hp[1]) - 8);
			}
			drawDot(srcCtx, D2.track[0], D2.track[1], P.accent, 6);
			srcCtx.strokeStyle = P.accent;
			srcCtx.lineWidth = 1.5;
			srcCtx.beginPath();
			srcCtx.arc(worldToPx(D2.track[0]), worldToPy(D2.track[1]), 11, 0, Math.PI * 2);
			srcCtx.stroke();
			srcCtx.fillStyle = P.accent;
			srcCtx.font = 'bold 12px monospace';
			srcCtx.fillText('p', worldToPx(D2.track[0]) + 13, worldToPy(D2.track[1]) + 4);
		}

		function draw2dForward(ctx, P) {
			const A = D2.M;
			for (let j = 0; j < D2.N; j++)
				for (let i = 0; i < D2.N; i++) {
					const val = (i + j) % 2;
					for (let a = 0; a < 4; a++)
						for (let b = 0; b < 4; b++) {
							const u0 = (i + a / 4) / D2.N, u1 = (i + (a + 1) / 4) / D2.N;
							const v0 = (j + b / 4) / D2.N, v1 = (j + (b + 1) / 4) / D2.N;
							const cs = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
							const ps = [];
							let bad = false;
							for (let k = 0; k < 4; k++) {
								const w = Affine.apply3(A, [cs[k][0], cs[k][1], 1]);
								if (!isFinite(w[0]) || !isFinite(w[1]) || Math.abs(w[2]) < 1e-9) { bad = true; break; }
								ps.push([worldToPx(w[0] / w[2]), worldToPy(w[1] / w[2])]);
							}
							if (bad) continue;
							ctx.fillStyle = rgbStr(val ? P.c1 : P.c0);
							ctx.beginPath();
							ctx.moveTo(ps[0][0], ps[0][1]);
							for (let k = 1; k < 4; k++) ctx.lineTo(ps[k][0], ps[k][1]);
							ctx.closePath();
							ctx.fill();
						}
				}
		}

		function draw2dOutput() {
			const P = pal();
			outCtx.fillStyle = P.bg;
			outCtx.fillRect(0, 0, size, size);
			const Ainv = Affine.inv3(D2.M);
			D2.singular = !Ainv;
			if (!Ainv) {
				draw2dForward(outCtx, P);
			} else {
				const img = outCtx.createImageData(size, size);
				const data = img.data;
				for (let py = 0; py < size; py++) {
					const wy = pyToWorld(py);
					for (let px = 0; px < size; px++) {
						const val = warpValue(Ainv, pxToWorld(px), wy);
						const o = (py * size + px) * 4;
						if (val === null) {
							data[o] = parseInt(P.bg.slice(1, 3), 16);
							data[o + 1] = parseInt(P.bg.slice(3, 5), 16);
							data[o + 2] = parseInt(P.bg.slice(5, 7), 16);
						} else {
							const c = lerp3(P.c0, P.c1, val);
							data[o] = c[0]; data[o + 1] = c[1]; data[o + 2] = c[2];
						}
						data[o + 3] = 255;
					}
				}
				outCtx.putImageData(img, 0, 0);
			}
			drawFrame(outCtx, P);
			const A = D2.M;
			const q = Affine.apply3(A, [D2.track[0], D2.track[1], 1]);
			if (isFinite(q[0]) && isFinite(q[1]) && Math.abs(q[2]) > 1e-9) {
				const x = q[0] / q[2], y = q[1] / q[2];
				drawDot(outCtx, x, y, P.accent, 6);
				outCtx.strokeStyle = P.accent;
				outCtx.lineWidth = 1.5;
				outCtx.beginPath();
				outCtx.arc(worldToPx(x), worldToPy(y), 11, 0, Math.PI * 2);
				outCtx.stroke();
				outCtx.fillStyle = P.accent;
				outCtx.font = 'bold 12px monospace';
				outCtx.textAlign = 'left';
				outCtx.fillText("p\u2032", worldToPx(x) + 13, worldToPy(y) + 4);
			}
			if (D2.hover) {
				outCtx.strokeStyle = P.ink2;
				outCtx.globalAlpha = 0.6;
				outCtx.lineWidth = 1;
				outCtx.setLineDash([4, 4]);
				outCtx.beginPath();
				outCtx.moveTo(worldToPx(D2.hover.wx), 0);
				outCtx.lineTo(worldToPx(D2.hover.wx), size);
				outCtx.moveTo(0, worldToPy(D2.hover.wy));
				outCtx.lineTo(size, worldToPy(D2.hover.wy));
				outCtx.stroke();
				outCtx.setLineDash([]);
				outCtx.globalAlpha = 1;
			}
		}

		function upd2dEq() {
			const A = D2.M;
			const x = D2.track[0], y = D2.track[1];
			const eq = $('aff2d-eq');
			const mono = $('aff2d-eqmono');
			const d = (mxEditor && mxEditor.values) ? mxEditor.values() : null;
			const qr = Affine.apply3(A, [x, y, 1]);
			const xpr = (Math.abs(qr[2]) > 1e-12) ? qr[0] / qr[2] : NaN;
			const ypr = (Math.abs(qr[2]) > 1e-12) ? qr[1] / qr[2] : NaN;
			texInto(eq, "p = (" + fmtNum(x) + ", " + fmtNum(y) + ") \\;\\mapsto\\; p' = (" + fmtNum(xpr) + ", " + fmtNum(ypr) + ")", true);
			const q = Affine.apply3(A, [x, y, 1]);
			const L = [];
			L.push("x' = " + termLineText(d, A, 0, 3, [x, y]) + " = " + fmtNum(q[0]));
			L.push("y' = " + termLineText(d, A, 1, 3, [x, y]) + " = " + fmtNum(q[1]));
			L.push("w' = " + termLineText(d, A, 2, 3, [x, y]) + " = " + fmtNum(q[2]));
			if (Math.abs(q[2] - 1) > 1e-9) {
				L.push("");
				L.push('w\u2032 \u2260 1  \u2192  this is a projective map: final point is (x\u2032/w\u2032, y\u2032/w\u2032) = (' + fmtNum(q[0] / q[2]) + ', ' + fmtNum(q[1] / q[2]) + ')');
			}
			if (mono) mono.textContent = L.join('\n');
		}

		function upd2dStatus() {
			const st = $('aff2d-status');
			if (!st) return;
			st.innerHTML = '';
			const A = D2.M;
			const det = Affine.det3(A);
			const affineRow = Math.abs(A[6]) < 1e-9 && Math.abs(A[7]) < 1e-9 && Math.abs(A[8] - 1) < 1e-9;
			const mk = function (text, kind) {
				const s = document.createElement('span');
				s.className = 'aff-pill' + (kind ? ' ' + kind : '');
				s.textContent = text;
				st.appendChild(s);
			};
			if (affineRow) {
				mk('area scale: \u00D7 ' + fmtNum(Math.abs(det)), Math.abs(det) < 1e-9 ? 'bad' : '');
				if (det < -1e-9) mk('det < 0: orientation flipped (mirror)', 'warn');
			} else {
				mk('last row \u2260 [0, 0, 1] \u2192 projective, not affine', 'warn');
			}
			if (Math.abs(det) < 1e-9) mk('singular: the image collapses to a line/point', 'bad');
		}

		/* Implementation self-tests (run once at init, shown live) */
		function run2dSelfTests() {
			const res = [];
			let ok1 = true;
			const A = Affine.rot2(Math.PI / 5);
			const Ainv = Affine.inv3(A);
			if (!Ainv) ok1 = false;
			else
				for (let t = 0; t < 16; t++) {
					const p = [(t * 0.137) % 1, (0.7 + t * 0.311) % 1];
					const q = Affine.apply3(A, [p[0], p[1], 1]);
					const r = Affine.apply3(Ainv, [q[0], q[1], q[2]]);
					if (Math.abs(r[0] - p[0]) > 1e-9 || Math.abs(r[1] - p[1]) > 1e-9) { ok1 = false; break; }
				}
			res.push(['inverse round-trip: M\u207B\u00B9\u00B7M = id', ok1]);
			let bad2 = 0;
			for (let i = 1; i < 16; i++)
				for (let j = 1; j < 16; j++) {
					const u = i / 16, v = j / 16;
					if (warpValue(Affine.inv3([1, 0, 0, 0, 1, 0, 0, 0, 1]), u, v) !== cbVal(u, v)) bad2++;
				}
			res.push(['identity warp leaves the image unchanged', bad2 === 0]);
			let bad3 = 0;
			const R90inv = Affine.inv3([0, -1, 1, 1, 0, 0, 0, 0, 1]);
			for (let i = 1; i < 16; i++)
				for (let j = 1; j < 16; j++) {
					const u = i / 16, v = j / 16;
					const s = warpValue(R90inv, u, v);
					if (s === null || s !== 1 - cbVal(u, v)) bad3++;
				}
			res.push(['90° rotation flips every square\u2019s color', bad3 === 0]);
			const c0 = Affine.apply3(D2.M, [0, 0, 1]);
			const c1 = Affine.apply3(D2.M, [1, 0, 1]);
			const c2 = Affine.apply3(D2.M, [1, 1, 1]);
			const c3 = Affine.apply3(D2.M, [0, 1, 1]);
			const detAbs = Math.abs(Affine.det3(D2.M));
			const ok4 = Math.abs(polyArea([[c0[0], c0[1]], [c1[0], c1[1]], [c2[0], c2[1]], [c3[0], c3[1]]]) - detAbs) < 0.02 * Math.max(1, detAbs);
			res.push(['det M = area of the warped unit square', ok4]);
			return res;
		}

		function redraw2d() {
			try {
				D2.trackCell = (D2.track[0] >= 0 && D2.track[0] < 1 && D2.track[1] >= 0 && D2.track[1] < 1)
					? Math.min(7, Math.floor(D2.track[1] * 8)) * 8 + Math.min(7, Math.floor(D2.track[0] * 8))
					: -1;
				draw2dSource();
				draw2dOutput();
				upd2dEq();
				upd2dStatus();
				highlight2dCells();
			} catch (e) {
				showLabError('aff-2d', e);
			}
		}

		function update2dHover() {
			const ro = $('aff2d-hover');
			if (!ro) return;
			if (!D2.hover) {
				D2.hoverCell = -1;
				ro.textContent = 'Hover the warped image: each pixel is a lookup  I(M\u207B\u00B9 \u00B7 p)  in the 0/1 matrix.';
				highlight2dCells();
				draw2dSource();
				return;
			}
			const Ainv = Affine.inv3(D2.M);
			let txt;
			if (!Ainv) {
				txt = 'M is singular \u2014 no inverse exists, so this pixel has no unique preimage.';
				D2.hover.pin = null;
				D2.hoverCell = -1;
			} else {
				const w = Affine.apply3(Ainv, [D2.hover.wx, D2.hover.wy, 1]);
				if (Math.abs(w[2]) < 1e-9) {
					txt = 'w\u2032 \u2248 0: this pixel maps to infinity (behind the line at infinity).';
					D2.hover.pin = null;
					D2.hoverCell = -1;
				} else {
					const u = w[0] / w[2], v = w[1] / w[2];
					D2.hover.pin = [u, v];
					const val = cbVal(u, v);
					D2.hoverCell = (val === null) ? -1 : Math.floor(v * 8) * 8 + Math.floor(u * 8);
					txt = 'p_out = (' + fmtNum(D2.hover.wx) + ', ' + fmtNum(D2.hover.wy) + ')  \u2192  M\u207B\u00B9\u00B7p = (' + fmtNum(u) + ', ' + fmtNum(v) + ')  \u2192  I = ' +
						(val === null ? 'outside the image' : (val === 0 ? '0 (black)' : '1 (white)'));
				}
			}
			ro.textContent = txt;
			highlight2dCells();
			draw2dSource();
		}

		/* events */
		const mxEditor = buildMatrixEditor('aff2d-mx', 3, 3, D2.M, function (v, r, c) {
			D2.M[r * 3 + c] = v;
			redraw2d();
		});
		if (mxEditor && PRESETS2[1] && PRESETS2[1].disp) mxEditor.setStrings(PRESETS2[1].disp);
		buildPresetRow('aff2d-presets', PRESETS2, function (pr) {
			D2.M = pr.m();
			if (mxEditor) { if (pr.disp) mxEditor.setStrings(pr.disp); else mxEditor.set(D2.M); }
			redraw2d();
		});
		const bilSel = $('aff2d-bilinear');
		if (bilSel) bilSel.addEventListener('change', function () {
			D2.bilinear = bilSel.value === 'bilinear';
			redraw2d();
		});
		srcC.addEventListener('click', function (e) {
			const r = srcC.getBoundingClientRect();
			if (r.width < 5) return;
			const px = (e.clientX - r.left) * (srcC.width / r.width);
			const py = (e.clientY - r.top) * (srcC.height / r.height);
			D2.track = [pxToWorld(px), pyToWorld(py)];
			redraw2d();
		});
		outC.addEventListener('mousemove', function (e) {
			const r = outC.getBoundingClientRect();
			if (r.width < 5) return;
			const px = (e.clientX - r.left) * (outC.width / r.width);
			const py = (e.clientY - r.top) * (outC.height / r.height);
			D2.hover = { wx: pxToWorld(px), wy: pyToWorld(py) };
			if (!D2.hoverQueued) {
				D2.hoverQueued = true;
				if (typeof requestAnimationFrame === 'function')
					requestAnimationFrame(function () { D2.hoverQueued = false; update2dHover(); });
				else update2dHover();
			}
		});
		outC.addEventListener('mouseleave', function () {
			D2.hover = null;
			update2dHover();
		});

		renderChecks($('aff2d-checks'), run2dSelfTests());
		const hover0 = $('aff2d-hover');
		if (hover0) hover0.textContent = 'Hover the warped image: each pixel is a lookup  I(M\u207B\u00B9 \u00B7 p)  in the 0/1 matrix. Click the source image to move the tracked point p.';
		themeRedraws.push(redraw2d);
		redraw2d();
	}

	/* ══════════════════════════════════════════════════════════════
	   FOLD 2D LAB — the checkerboard through a crease
	   ══════════════════════════════════════════════════════════════ */

	const F2 = {
		N: 8,
		win: -0.6, winEnd: 1.6,
		theta: 0, c: 0.5, lam: 1.5,
		track: [0.25, 0.75],
		hover: null, hoverQueued: false, hoverPre: [],
		x1d: 1.3, c1d: 1.0,
		demo: [[0.15, 0.2], [0.85, 0.7]],
		yaw3d: 0.55, pitch3d: 0.5, drag3d: null,
		zoom: 1, wcX: 0.5, wcY: 0.5, zoom3d: 1
	};

	const PRESETS_F2 = [
		{ name: 'No fold (λ=0)', s: { theta: 0, c: 0.5, lam: 0 } },
		{ name: 'Crease (λ=0.5)', s: { theta: 0, c: 0.5, lam: 0.5 } },
		{ name: 'Hammer (λ=1)', s: { theta: 0, c: 0.5, lam: 1 } },
		{ name: 'Paper fold (λ=2)', s: { theta: 0, c: 0.5, lam: 2 } },
		{ name: 'Overshoot (λ=2.4)', s: { theta: 0, c: 0.5, lam: 2.4 } },
		{ name: 'Diagonal crease', s: { theta: 45, c: 0.4, lam: 1.6 } },
		{ name: 'Mirror (λ=2, ⊥)', s: { theta: 90, c: 0.5, lam: 2 } }
	];

	function hexRgb(h) {
		return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
	}

	function initFold2d() {
		const srcC = $('fold2d-src'), outC = $('fold2d-out'), stripC = $('fold1d-canvas');
		if (!srcC || !outC) return;
		const srcCtx = srcC.getContext('2d'), outCtx = outC.getContext('2d'), stripCtx = stripC ? stripC.getContext('2d') : null;
		if (!srcCtx || !outCtx) { showLabError('fold-2d', new Error('Canvas 2D context unavailable')); return; }
		const size = srcC.width;
		const baseSpan = F2.winEnd - F2.win;
		const curSpan = function () { return baseSpan / F2.zoom; };
		const curWinX = function () { return F2.wcX - curSpan() / 2; };
		const curMaxY = function () { return F2.wcY + curSpan() / 2; };
		const w2px = function (x) { return (x - curWinX()) / curSpan() * size; };
		const w2py = function (y) { return (curMaxY() - y) / curSpan() * size; };
		const px2w = function (px) { return curWinX() + (px / size) * curSpan(); };
		const py2w = function (py) { return curMaxY() - (py / size) * curSpan(); };
		const n2 = function () { return Fold.normal2(F2.theta * Math.PI / 180); };

		function grid(ctx, P) {
			ctx.strokeStyle = P.line; ctx.lineWidth = 1;
			for (let t = 0; t <= 4; t++) {
				const wv = t * 0.5, px = w2px(wv), py = w2py(wv);
				ctx.globalAlpha = (wv === 0 || wv === 1) ? 0.9 : 0.35;
				ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, size); ctx.stroke();
				ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(size, py); ctx.stroke();
			}
			ctx.globalAlpha = 1;
			ctx.fillStyle = P.ink2; ctx.font = '11px monospace'; ctx.textAlign = 'left';
			for (let t = 0; t <= 4; t++) {
				const wv = t * 0.5;
				ctx.fillText(String(wv), w2px(wv) + 3, w2py(0) + 14);
				ctx.fillText(String(wv), w2px(0) - 24, w2py(wv) - 3);
			}
		}

		/* the crease line n̂·p = c, plus an arrow along n̂ (the push direction) */
		function crease(ctx, P) {
			const n = n2();
			const p0 = [F2.c * n[0], F2.c * n[1]];
			const d = [-n[1], n[0]];
			ctx.save();
			ctx.strokeStyle = P.accent; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
			ctx.beginPath();
			ctx.moveTo(w2px(p0[0] - 2.4 * d[0]), w2py(p0[1] - 2.4 * d[1]));
			ctx.lineTo(w2px(p0[0] + 2.4 * d[0]), w2py(p0[1] + 2.4 * d[1]));
			ctx.stroke(); ctx.setLineDash([]);
			/* push-direction arrow (the far side is pushed along −n̂; show n̂) */
			const ax = w2px(p0[0]), ay = w2py(p0[1]);
			const bx = w2px(p0[0] + 0.42 * n[0]), by = w2py(p0[1] + 0.42 * n[1]);
			ctx.strokeStyle = P.accent; ctx.fillStyle = P.accent; ctx.lineWidth = 2;
			ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
			const ang = Math.atan2(by - ay, bx - ax);
			ctx.beginPath();
			ctx.moveTo(bx, by);
			ctx.lineTo(bx - 8 * Math.cos(ang - 0.4), by - 8 * Math.sin(ang - 0.4));
			ctx.lineTo(bx - 8 * Math.cos(ang + 0.4), by - 8 * Math.sin(ang + 0.4));
			ctx.closePath(); ctx.fill();
			ctx.font = 'italic 12px monospace';
			ctx.fillText('n\u0302', bx + 6, by - 6);
			ctx.restore();
		}

		function drawFoldSource() {
			const P = pal();
			srcCtx.fillStyle = P.bg; srcCtx.fillRect(0, 0, size, size);
			grid(srcCtx, P);
			for (let j = 0; j < F2.N; j++)
				for (let i = 0; i < F2.N; i++) {
					const u0 = i / F2.N, u1 = (i + 1) / F2.N, v0 = j / F2.N, v1 = (j + 1) / F2.N;
					srcCtx.fillStyle = rgbStr(((i + j) % 2) ? P.c1 : P.c0);
					srcCtx.fillRect(w2px(u0), w2py(v1), (u1 - u0) / curSpan() * size, (v1 - v0) / curSpan() * size);
				}
			srcCtx.strokeStyle = P.line; srcCtx.strokeRect(w2px(0), w2py(1), size / curSpan(), size / curSpan());
			/* demo line crossing the crease */
			srcCtx.strokeStyle = P.cyan; srcCtx.lineWidth = 1.5;
			srcCtx.beginPath();
			srcCtx.moveTo(w2px(F2.demo[0][0]), w2py(F2.demo[0][1]));
			srcCtx.lineTo(w2px(F2.demo[1][0]), w2py(F2.demo[1][1]));
			srcCtx.stroke();
			crease(srcCtx, P);
			/* preimage markers */
			F2.hoverPre.forEach(function (pr, k) {
				srcCtx.fillStyle = P.warn;
				srcCtx.beginPath(); srcCtx.arc(w2px(pr.p[0]), w2py(pr.p[1]), 5, 0, Math.PI * 2); srcCtx.fill();
				srcCtx.strokeStyle = P.warn; srcCtx.lineWidth = 1.5;
				srcCtx.beginPath(); srcCtx.arc(w2px(pr.p[0]), w2py(pr.p[1]), 9, 0, Math.PI * 2); srcCtx.stroke();
				srcCtx.fillStyle = P.warn; srcCtx.font = '11px monospace'; srcCtx.textAlign = 'left';
				srcCtx.fillText('p' + (k === 0 ? '\u2081' : '\u2082'), w2px(pr.p[0]) + 11, w2py(pr.p[1]) - 8);
			});
			/* tracked point */
			srcCtx.fillStyle = P.accent;
			srcCtx.beginPath(); srcCtx.arc(w2px(F2.track[0]), w2py(F2.track[1]), 6, 0, Math.PI * 2); srcCtx.fill();
			srcCtx.strokeStyle = P.accent; srcCtx.lineWidth = 1.5;
			srcCtx.beginPath(); srcCtx.arc(w2px(F2.track[0]), w2py(F2.track[1]), 11, 0, Math.PI * 2); srcCtx.stroke();
			srcCtx.fillStyle = P.accent; srcCtx.font = 'bold 12px monospace';
			srcCtx.fillText('p', w2px(F2.track[0]) + 13, w2py(F2.track[1]) + 4);
		}

		function drawFoldOutput() {
			const P = pal();
			outCtx.fillStyle = P.bg; outCtx.fillRect(0, 0, size, size);
			const n = n2();
			const acc = hexRgb(P.accent);
			/* forward-map the board: near side opaque, far side tinted + translucent */
			for (let j = 0; j < F2.N; j++)
				for (let i = 0; i < F2.N; i++) {
					const val = (i + j) % 2;
					const cu = (i + 0.5) / F2.N, cv = (j + 0.5) / F2.N;
					const far = n[0] * cu + n[1] * cv - F2.c > 0;
					for (let a = 0; a < 4; a++)
						for (let b = 0; b < 4; b++) {
							const u0 = (i + a / 4) / F2.N, u1 = (i + (a + 1) / 4) / F2.N;
							const v0 = (j + b / 4) / F2.N, v1 = (j + (b + 1) / 4) / F2.N;
							const cs = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
							const ps = cs.map(function (pt) {
								const q = Fold.apply2(pt, n, F2.c, F2.lam);
								return [w2px(q[0]), w2py(q[1])];
							});
							const base = val ? P.c1 : P.c0;
							const col = far ? [base[0] + (acc[0] - base[0]) * 0.5, base[1] + (acc[1] - base[1]) * 0.5, base[2] + (acc[2] - base[2]) * 0.5] : base;
							outCtx.globalAlpha = far ? 0.72 : 1;
							outCtx.fillStyle = rgbStr(col);
							outCtx.beginPath();
							outCtx.moveTo(ps[0][0], ps[0][1]);
							for (let k = 1; k < 4; k++) outCtx.lineTo(ps[k][0], ps[k][1]);
							outCtx.closePath(); outCtx.fill();
						}
					outCtx.globalAlpha = 1;
				}
			/* demo line image: a straight line arrives as two pieces with a corner */
			outCtx.strokeStyle = P.cyan; outCtx.lineWidth = 2; outCtx.beginPath();
			const SEG = 48;
			for (let s = 0; s <= SEG; s++) {
				const t = s / SEG;
				const x = F2.demo[0][0] + (F2.demo[1][0] - F2.demo[0][0]) * t;
				const y = F2.demo[0][1] + (F2.demo[1][1] - F2.demo[0][1]) * t;
				const q = Fold.apply2([x, y], n, F2.c, F2.lam);
				if (s === 0) outCtx.moveTo(w2px(q[0]), w2py(q[1]));
				else outCtx.lineTo(w2px(q[0]), w2py(q[1]));
			}
			outCtx.stroke();
			crease(outCtx, P);
			/* tracked point image */
			const q = Fold.apply2(F2.track, n, F2.c, F2.lam);
			outCtx.fillStyle = P.accent;
			outCtx.beginPath(); outCtx.arc(w2px(q[0]), w2py(q[1]), 6, 0, Math.PI * 2); outCtx.fill();
			outCtx.strokeStyle = P.accent; outCtx.lineWidth = 1.5;
			outCtx.beginPath(); outCtx.arc(w2px(q[0]), w2py(q[1]), 11, 0, Math.PI * 2); outCtx.stroke();
			outCtx.fillStyle = P.accent; outCtx.font = 'bold 12px monospace'; outCtx.textAlign = 'left';
			outCtx.fillText("p\u2032", w2px(q[0]) + 13, w2py(q[1]) + 4);
			/* hover crosshair */
			if (F2.hover) {
				outCtx.strokeStyle = P.ink2; outCtx.globalAlpha = 0.6; outCtx.lineWidth = 1;
				outCtx.setLineDash([4, 4]);
				outCtx.beginPath();
				outCtx.moveTo(w2px(F2.hover[0]), 0); outCtx.lineTo(w2px(F2.hover[0]), size);
				outCtx.moveTo(0, w2py(F2.hover[1])); outCtx.lineTo(size, w2py(F2.hover[1]));
				outCtx.stroke(); outCtx.setLineDash([]); outCtx.globalAlpha = 1;
			}
			grid(outCtx, P);
		}

		/* the 1-D fold, plotted as y = f(x) */
		function drawFold1d() {
			if (!stripCtx) return;
			const P = pal();
			const W = stripC.width, H = stripC.height;
			const ml = 34, mr = 14, mt = 14, mb = 24;
			const X = function (x) { return ml + (x / 2) * (W - ml - mr); };
			const Y = function (y) { return (H - mb) - (y / 2) * (H - mt - mb); };
			stripCtx.fillStyle = P.bg; stripCtx.fillRect(0, 0, W, H);
			stripCtx.strokeStyle = P.line; stripCtx.lineWidth = 1;
			stripCtx.strokeRect(X(0), Y(2), X(2) - X(0), Y(0) - Y(2));
			stripCtx.fillStyle = P.ink2; stripCtx.font = '10px monospace';
			stripCtx.textAlign = 'center';
			for (let x = 0; x <= 4; x++) { stripCtx.fillText(String(x / 2), X(x / 2), H - mb + 14); }
			stripCtx.textAlign = 'right';
			for (let y = 0; y <= 4; y++) { stripCtx.fillText(String(y / 2), ml - 5, Y(y / 2) + 3); }
			/* identity y = x (dashed) */
			stripCtx.strokeStyle = P.ink2; stripCtx.globalAlpha = 0.5; stripCtx.setLineDash([4, 4]);
			stripCtx.beginPath(); stripCtx.moveTo(X(0), Y(0)); stripCtx.lineTo(X(2), Y(2)); stripCtx.stroke();
			stripCtx.setLineDash([]); stripCtx.globalAlpha = 1;
			/* overlap band on the image axis when λ > 1 */
			if (F2.lam > 1.001) {
				const lo = Math.max(0, (1 - F2.lam) * 2 + F2.lam * F2.c1d);
				const hi = Math.min(2, F2.c1d);
				if (hi > lo) {
					stripCtx.fillStyle = P.warn; stripCtx.globalAlpha = 0.18;
					stripCtx.fillRect(X(0), Y(hi), X(2) - X(0), Y(lo) - Y(hi));
					stripCtx.globalAlpha = 1;
					stripCtx.fillStyle = P.warn; stripCtx.textAlign = 'left';
					stripCtx.fillText('overlap', X(2) - 46, Y((lo + hi) / 2) + 3);
				}
			}
			/* f(x): slope 1 below the crease, slope (1−λ) above */
			stripCtx.strokeStyle = P.accent; stripCtx.lineWidth = 2; stripCtx.beginPath();
			const S = 200;
			for (let s = 0; s <= S; s++) {
				const x = (s / S) * 2;
				const y = (x <= F2.c1d) ? x : (1 - F2.lam) * x + F2.lam * F2.c1d;
				if (s === 0) stripCtx.moveTo(X(x), Y(y));
				else stripCtx.lineTo(X(x), Y(y));
			}
			stripCtx.stroke();
			/* crease tick */
			stripCtx.strokeStyle = P.cyan; stripCtx.lineWidth = 1; stripCtx.setLineDash([3, 3]);
			stripCtx.beginPath(); stripCtx.moveTo(X(F2.c1d), Y(0)); stripCtx.lineTo(X(F2.c1d), Y(2)); stripCtx.stroke();
			stripCtx.setLineDash([]);
			/* tracked 1-D point */
			const x = F2.x1d, y = (x <= F2.c1d) ? x : (1 - F2.lam) * x + F2.lam * F2.c1d;
			stripCtx.strokeStyle = P.ink2; stripCtx.globalAlpha = 0.4; stripCtx.lineWidth = 1;
			stripCtx.beginPath(); stripCtx.moveTo(X(x), Y(0)); stripCtx.lineTo(X(x), Y(y)); stripCtx.lineTo(X(0), Y(y)); stripCtx.stroke();
			stripCtx.globalAlpha = 1;
			stripCtx.fillStyle = P.accent;
			stripCtx.beginPath(); stripCtx.arc(X(x), Y(y), 5, 0, Math.PI * 2); stripCtx.fill();
			stripCtx.fillStyle = P.ink2; stripCtx.textAlign = 'left';
			stripCtx.fillText('x\u2192x\u2212λ·ReLU(x\u2212c\u2081)', X(0) + 4, Y(2) - 6);
		}

		/* read-only 3×3 matrix view */
		function makeMatrixView(hostId) {
			const host = $(hostId);
			if (!host) return null;
			host.innerHTML = '';
			const cells = [];
			for (let r = 0; r < 3; r++) {
				const row = document.createElement('div');
				row.className = 'aff-matrow';
				for (let c = 0; c < 3; c++) {
					const cell = document.createElement('div');
					cell.className = 'aff-matcell aff-matro';
					row.appendChild(cell);
					cells.push(cell);
				}
				host.appendChild(row);
			}
			return function (m) {
				for (let i = 0; i < 9; i++) cells[i].textContent = fmtNum(m[i]);
			};
		}

		function updFoldMats() {
			const n = n2();
			if (setM1) setM1([1, 0, 0, 0, 1, 0, 0, 0, 1]);
			if (setM2) setM2(Fold.pieceMatrix2(n, F2.c, F2.lam));
		}

		function updFoldEq() {
			const eq = $('fold2d-eq'), mono = $('fold2d-eqmono');
			if (!eq) return;
			const n = n2();
			const x = F2.track[0], y = F2.track[1];
			const d = n[0] * x + n[1] * y - F2.c;
			const q = Fold.apply2([x, y], n, F2.c, F2.lam);
			texInto(eq, "p = (" + fmtNum(x) + ", " + fmtNum(y) + ") \\;\\mapsto\\; p' = (" + fmtNum(q[0]) + ", " + fmtNum(q[1]) + ")", true);
			const L = [];
			L.push("n\u0302\u00B7p \u2212 c = " + fmtNum(d) + (d <= 0 ? "  \u2264 0  \u2192  piece 1 (identity): p' = p" : "  > 0  \u2192  piece 2 (the affine push)"));
			if (d > 0) {
				const M = Fold.pieceMatrix2(n, F2.c, F2.lam);
				L.push("x' = " + termLineText(null, M, 0, 3, [x, y]) + " = " + fmtNum(M[0] * x + M[1] * y + M[2]));
				L.push("y' = " + termLineText(null, M, 1, 3, [x, y]) + " = " + fmtNum(M[3] * x + M[4] * y + M[5]));
			} else {
				L.push("x' = x = " + fmtNum(x));
				L.push("y' = y = " + fmtNum(y));
			}
			if (mono) mono.textContent = L.join('\n');
		}

		function updFoldStatus() {
			const st = $('fold2d-status');
			if (!st) return;
			st.innerHTML = '';
			const mk = function (text, kind) {
				const s = document.createElement('span');
				s.className = 'aff-pill' + (kind ? ' ' + kind : '');
				s.textContent = text;
				st.appendChild(s);
			};
			mk('piecewise affine: 2 affine pieces + 1 crease');
			if (F2.lam < 1e-9) mk('\u03BB = 0: the identity — still affine');
			else if (F2.lam < 1 - 1e-9) mk('bent, still one-to-one (injective)');
			else if (F2.lam < 1 + 1e-9) mk('\u03BB = 1: the far half flattened onto the crease — maximum overlap', 'warn');
			else if (F2.lam < 2 - 1e-9) mk('non-injective: the far half overlaps the near half', 'warn');
			else if (F2.lam < 2 + 1e-9) mk('\u03BB = 2: the paper fold (a mirror in the crease)');
			else mk('overshoot: the far half passes through the near half', 'warn');
		}

		function runFoldSelfTests() {
			const res = [];
			let ok1 = true;
			for (let i = 0; i <= 6 && ok1; i++)
				for (let j = 0; j <= 6; j++) {
					const p = [i / 6, j / 6];
					const q = Fold.apply2(p, [1, 0], 0.5, 0);
					if (Math.abs(q[0] - p[0]) > 1e-12 || Math.abs(q[1] - p[1]) > 1e-12) ok1 = false;
				}
			res.push(['\u03BB = 0 is the identity (affine)', ok1]);
			let ok2 = true;
			for (let i = 0; i <= 6 && ok2; i++)
				for (let j = 0; j <= 6; j++) {
					const p = [i / 6, j / 6];
					const q = Fold.apply2(p, [1, 0], 0.5, 2);
					if (Math.abs(q[0] - (1 - p[0])) > 1e-9 || Math.abs(q[1] - p[1]) > 1e-9) ok2 = false;
				}
			res.push(['\u03BB = 2 mirrors in the crease line', ok2]);
			const pr = Fold.preimages2([0.4, 0.3], [1, 0], 0.5, 1.5);
			res.push(['overlap pixel \u2192 2 preimages', pr.length === 2]);
			let ok4 = true;
			const seen = {};
			for (let i = 0; i < 40 && ok4; i++)
				for (let j = 0; j < 40; j++) {
					const p = [i / 39, j / 39];
					const q = Fold.apply2(p, [1, 0], 0.5, 0.5);
					const key = Math.round(q[0] * 1e5) + ',' + Math.round(q[1] * 1e5);
					if (seen[key]) ok4 = false;
					seen[key] = 1;
				}
			res.push(['0 < \u03BB < 1 stays one-to-one', ok4]);
			let ok5 = true;
			for (let i = 0; i < 12; i++) {
				const y = (i + 0.5) / 12, e = 1e-4;
				const a = Fold.apply2([0.5 - e, y], [1, 0], 0.5, F2.lam);
				const b = Fold.apply2([0.5 + e, y], [1, 0], 0.5, F2.lam);
				if (Math.abs(a[0] - b[0]) > 1e-6 || Math.abs(a[1] - b[1]) > 1e-6) ok5 = false;
			}
			res.push(['continuous at the crease (no tear)', ok5]);
			return res;
		}

		function redraw() {
			try {
				drawFoldSource();
				drawFoldOutput();
				drawFold1d();
				updFoldMats();
				updFoldEq();
				updFoldStatus();
			} catch (e) { showLabError('fold-2d', e); }
		}

		function updateHover() {
			const ro = $('fold2d-hover');
			if (!ro) return;
			if (!F2.hover) {
				F2.hoverPre = [];
				ro.textContent = 'Hover the warped board: the machine solves for the preimage(s) of the pixel you point at. In the overlap it finds two.';
				drawFoldSource();
				return;
			}
			const q = F2.hover;
			const pre = Fold.preimages2(q, n2(), F2.c, F2.lam);
			F2.hoverPre = pre;
			let txt = 'q = (' + fmtNum(q[0]) + ', ' + fmtNum(q[1]) + ')  \u2192  ';
			if (pre.length === 0) txt += 'no preimage — this pixel is not in the image of the fold.';
			else if (pre.length === 1) txt += '1 preimage: (' + fmtNum(pre[0].p[0]) + ', ' + fmtNum(pre[0].p[1]) + ') — covered once.';
			else txt = 'q = (' + fmtNum(q[0]) + ', ' + fmtNum(q[1]) + ')  \u2192  2 preimages: (' + fmtNum(pre[0].p[0]) + ', ' + fmtNum(pre[0].p[1]) + ') and (' + fmtNum(pre[1].p[0]) + ', ' + fmtNum(pre[1].p[1]) + ') — covered twice (space overlaps here).';
			ro.textContent = txt;
			drawFoldSource();
		}

		const setM1 = makeMatrixView('fold2d-m1');
		const setM2 = makeMatrixView('fold2d-m2');

		/* slider sync */
		const sTheta = $('fold2d-theta'), sC = $('fold2d-c'), sLam = $('fold2d-lambda');
		function syncFoldSliders() {
			if (sTheta) sTheta.value = String(Math.round(F2.theta));
			if (sC) sC.value = String(F2.c);
			if (sLam) sLam.value = String(F2.lam);
		}
		function labelFoldSliders() {
			const tv = $('fold2d-theta-v'), cv = $('fold2d-c-v'), lv = $('fold2d-lambda-v');
			if (tv) tv.textContent = Math.round(F2.theta) + '\u00B0';
			if (cv) cv.textContent = F2.c.toFixed(2);
			if (lv) lv.textContent = F2.lam.toFixed(2);
		}
		function onSlider() {
			if (sTheta) F2.theta = parseFloat(sTheta.value);
			if (sC) F2.c = parseFloat(sC.value);
			if (sLam) F2.lam = parseFloat(sLam.value);
			labelFoldSliders();
			redraw();
		}
		if (sTheta) sTheta.addEventListener('input', onSlider);
		if (sC) sC.addEventListener('input', onSlider);
		if (sLam) sLam.addEventListener('input', onSlider);

		buildPresetRow('fold2d-presets', PRESETS_F2, function (pr) {
			F2.theta = pr.s.theta; F2.c = pr.s.c; F2.lam = pr.s.lam;
			syncFoldSliders(); labelFoldSliders(); redraw();
		});

		srcC.addEventListener('click', function (e) {
			const r = srcC.getBoundingClientRect();
			if (r.width < 5) return;
			const px = (e.clientX - r.left) * (srcC.width / r.width);
			const py = (e.clientY - r.top) * (srcC.height / r.height);
			F2.track = [Math.max(0, Math.min(1, px2w(px))), Math.max(0, Math.min(1, py2w(py)))];
			redraw();
		});
		outC.addEventListener('mousemove', function (e) {
			const r = outC.getBoundingClientRect();
			if (r.width < 5) return;
			const px = (e.clientX - r.left) * (outC.width / r.width);
			const py = (e.clientY - r.top) * (outC.height / r.height);
			F2.hover = [px2w(px), py2w(py)];
			if (!F2.hoverQueued) {
				F2.hoverQueued = true;
				if (typeof requestAnimationFrame === 'function')
					requestAnimationFrame(function () { F2.hoverQueued = false; updateHover(); });
				else updateHover();
			}
		});
		outC.addEventListener('mouseleave', function () { F2.hover = null; updateHover(); });
		function wheelZoom2d(e) {
			e.preventDefault();
			const r = e.currentTarget.getBoundingClientRect();
			if (r.width < 5) return;
			const mx = (e.clientX - r.left) * (e.currentTarget.width / r.width);
			const my = (e.clientY - r.top) * (e.currentTarget.height / r.height);
			const s0 = curSpan();
			const wx = px2w(mx), wy = py2w(my);
			F2.zoom = Math.max(0.4, Math.min(8, F2.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
			const s1 = curSpan();
			F2.wcX = wx - (mx / size - 0.5) * s1;
			F2.wcY = wy + (my / size - 0.5) * s1;
			redraw();
			updateHover();
		}
		srcC.addEventListener('wheel', wheelZoom2d, { passive: false });
		outC.addEventListener('wheel', wheelZoom2d, { passive: false });
		if (stripC) stripC.addEventListener('click', function (e) {
			const r = stripC.getBoundingClientRect();
			if (r.width < 5) return;
			const px = (e.clientX - r.left) * (stripC.width / r.width);
			const ml = 34, mr = 14;
			const x = Math.max(0, Math.min(2, (px - ml) / (stripC.width - ml - mr) * 2));
			F2.x1d = x;
			drawFold1d();
		});

		/* ── 3-D view: the fold as bent paper ──
		   The far half is rotated rigidly about the crease line by
		   φ = arccos(1−λ). Its flat shadow (drop z) is exactly the
		   2-D fold map, so this is the same image, seen in space. */
		const c3 = $('fold3d-canvas');
		if (c3) (function () {
			const ctx3 = c3.getContext('2d');
			if (!ctx3) return;
			const W = c3.width, H = c3.height, cx3 = W / 2, cy3 = H / 2;
			const CAM = 3.4, S0 = 250, G = 24;

			function foldLift3(p2) {
				const n = n2();
				const d = n[0] * p2[0] + n[1] * p2[1] - F2.c;
				if (d <= 0) return [p2[0], p2[1], 0];
				const phi = Math.acos(Math.max(-1, Math.min(1, 1 - F2.lam)));
				const qx = p2[0] - d * n[0], qy = p2[1] - d * n[1];
				return [qx + d * Math.cos(phi) * n[0], qy + d * Math.cos(phi) * n[1], d * Math.sin(phi)];
			}
			function vrot(p) {
				const cyw = Math.cos(F2.yaw3d), sw = Math.sin(F2.yaw3d);
				const cp = Math.cos(F2.pitch3d), sp = Math.sin(F2.pitch3d);
				const x1 = cyw * p[0] + sw * p[2];
				const y1 = p[1];
				const z1 = -sw * p[0] + cyw * p[2];
				return [x1, cp * y1 - sp * z1, sp * y1 + cp * z1];
			}
			function proj3(v) {
				const depth = v[2] + CAM;
				if (depth < 0.08) return null;
				const s = S0 * F2.zoom3d * CAM / depth;
				return [cx3 + v[0] * s, cy3 - v[1] * s, depth];
			}
			function drawFold3d() {
				const P = pal();
				ctx3.fillStyle = P.bg; ctx3.fillRect(0, 0, W, H);
				const list = [];
				for (let j = 0; j < G; j++)
					for (let i = 0; i < G; i++) {
						const u0 = i / G, u1 = (i + 1) / G, v0 = j / G, v1 = (j + 1) / G;
						const ob = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
						const vpts = [];
						let bad = false;
						for (let k = 0; k < 4; k++) {
							const v = vrot(foldLift3(ob[k]));
							vpts.push(v);
						}
						const ps = [];
						let depth = 0;
						for (let k = 0; k < 4; k++) {
							const pr = proj3(vpts[k]);
							if (!pr) { bad = true; break; }
							ps.push(pr); depth += pr[2];
						}
						if (bad) continue;
						const e1 = [vpts[1][0] - vpts[0][0], vpts[1][1] - vpts[0][1], vpts[1][2] - vpts[0][2]];
						const e2 = [vpts[3][0] - vpts[0][0], vpts[3][1] - vpts[0][1], vpts[3][2] - vpts[0][2]];
						const nn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
						const nl = Math.hypot(nn[0], nn[1], nn[2]) || 1;
						const Ld = [-0.4, 0.75, -0.5], ll = Math.hypot(Ld[0], Ld[1], Ld[2]);
						const sh = 0.62 + 0.38 * Math.abs((nn[0] * Ld[0] + nn[1] * Ld[1] + nn[2] * Ld[2]) / (nl * ll));
						list.push({ ps: ps, val: (i + j) % 2, depth: depth / 4, sh: sh });
					}
				list.sort(function (a, b) { return b.depth - a.depth; });
				for (let i = 0; i < list.length; i++) {
					const it = list[i];
					const base = it.val ? P.c1 : P.c0;
					ctx3.fillStyle = rgbStr([base[0] * it.sh, base[1] * it.sh, base[2] * it.sh]);
					ctx3.strokeStyle = P.dark ? 'rgba(6,8,18,0.5)' : 'rgba(120,110,90,0.25)';
					ctx3.lineWidth = 0.5;
					ctx3.beginPath(); ctx3.moveTo(it.ps[0][0], it.ps[0][1]);
					for (let k = 1; k < 4; k++) ctx3.lineTo(it.ps[k][0], it.ps[k][1]);
					ctx3.closePath(); ctx3.fill(); ctx3.stroke();
				}
				ctx3.fillStyle = P.ink2; ctx3.font = '11px monospace'; ctx3.textAlign = 'left';
				ctx3.fillText('drag to rotate · the far half is the shaded side, lifted out of the plane', 10, H - 10);
			}
			c3.addEventListener('pointerdown', function (e) {
				F2.drag3d = { x: e.clientX, y: e.clientY };
				try { c3.setPointerCapture(e.pointerId); } catch (err) { /* optional */ }
			});
			c3.addEventListener('pointermove', function (e) {
				if (!F2.drag3d) return;
				const dx = e.clientX - F2.drag3d.x, dy = e.clientY - F2.drag3d.y;
				F2.drag3d.x = e.clientX; F2.drag3d.y = e.clientY;
				F2.yaw3d += dx * 0.01;
				F2.pitch3d = Math.max(-1.45, Math.min(1.45, F2.pitch3d + dy * 0.01));
			});
			c3.addEventListener('pointerup', function () { F2.drag3d = null; });
			c3.addEventListener('pointercancel', function () { F2.drag3d = null; });
			c3.addEventListener('wheel', function (e) {
				e.preventDefault();
				F2.zoom3d = Math.max(0.4, Math.min(6, F2.zoom3d * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
			}, { passive: false });
			let errStreak = 0;
			function frame3() {
				if (document.visibilityState !== 'visible') { requestAnimationFrame(frame3); return; }
				try {
					if (!F2.drag3d) F2.yaw3d += 0.0016;
					drawFold3d();
					errStreak = 0;
				} catch (e) {
					if (++errStreak > 5) { showLabError('fold-2d', e); return; }
				}
				requestAnimationFrame(frame3);
			}
			requestAnimationFrame(frame3);
		})();

		renderChecks($('fold2d-checks'), runFoldSelfTests());
		syncFoldSliders(); labelFoldSliders();
		themeRedraws.push(redraw);
		redraw();
	}

	/* ══════════════════════════════════════════════════════════════
	   3D LAB
	   ══════════════════════════════════════════════════════════════ */

	const D3 = {
		M: Affine.rotY(Math.PI / 6),
		yaw: 0.65,
		pitch: 0.42,
		auto: true,
		drag: null,
		corner: [1, 0, 1],
		CAM: 3.6,
		S0: 130
	};

	const PRESETS3 = [
		{ name: 'Identity', m: function () { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; } },
		{ name: 'Rotate Y 30°', m: function () { return Affine.rotY(Math.PI / 6); }, disp: ['cos(30°)', '0', 'sin(30°)', '0', '0', '1', '0', '0', '-sin(30°)', '0', 'cos(30°)', '0', '0', '0', '0', '1'] },
		{ name: 'Rotate X 20°', m: function () { return Affine.rotX(20 * Math.PI / 180); }, disp: ['1', '0', '0', '0', '0', 'cos(20°)', '-sin(20°)', '0', '0', 'sin(20°)', 'cos(20°)', '0', '0', '0', '0', '1'] },
		{ name: 'RotX 20° \u00B7 RotY 30°', m: function () { return Affine.mul4(Affine.rotX(20 * Math.PI / 180), Affine.rotY(Math.PI / 6)); } },
		{ name: 'Scale (1.4, 1, 0.6)', m: function () { return [1.4, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.6, 0, 0, 0, 0, 1]; } },
		{ name: 'Shear', m: function () { return [1, 0.5, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; } },
		{ name: 'Translate', m: function () { return [1, 0, 0, 0.15, 0, 1, 0, 0.35, 0, 0, 1, 0, 0, 0, 0, 1]; } },
		{ name: 'Mirror x', m: function () { return [-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; } },
		{ name: 'Projective (perspective)', m: function () { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.4, 0, 0, 1]; } },
		{ name: 'Random', m: function () {
			const r = function () { return round4(Math.random() * 2 - 1); };
			return [r(), r(), r(), r(), r(), r(), r(), r(), r(), r(), r(), r(), 0, 0, 0, 1];
		} }
	];

	function init3d() {
		const c = $('aff3d-canvas');
		if (!c) return;
		const ctx = c.getContext('2d');
		if (!ctx) {
			showLabError('aff-3d', new Error('Canvas 2D context unavailable'));
			return;
		}
		const W = c.width, H = c.height;
		const cx = W / 2, cy = H / 2;
		const K = 8;
		const quads = buildCubeQuads(K);
		const corners3d = [];
		for (let i = 0; i < 8; i++)
			corners3d.push([(i & 1) ? 1 : 0, (i & 2) ? 1 : 0, (i & 4) ? 1 : 0]);
		const edges3d = [[0, 1], [0, 2], [1, 3], [2, 3], [4, 5], [4, 6], [5, 7], [6, 7], [0, 4], [1, 5], [2, 6], [3, 7]];

		function viewRotate(p) {
			const cyw = Math.cos(D3.yaw), sw = Math.sin(D3.yaw);
			const cp = Math.cos(D3.pitch), sp = Math.sin(D3.pitch);
			const x1 = cyw * p[0] + sw * p[2];
			const y1 = p[1];
			const z1 = -sw * p[0] + cyw * p[2];
			return [x1, cp * y1 - sp * z1, sp * y1 + cp * z1];
		}

		function project(v) {
			const depth = v[2] + D3.CAM;
			if (depth < 0.08) return null;
			const s = D3.S0 * D3.CAM / depth;
			return [cx + v[0] * s, cy - v[1] * s, depth];
		}

		/* Map an object point through M (with w-division), then view + project */
		function mapPoint(p) {
			const q = Affine.apply4(D3.M, [p[0], p[1], p[2], 1]);
			if (!isFinite(q[0]) || !isFinite(q[1]) || !isFinite(q[2]) || !isFinite(q[3])) return null;
			if (Math.abs(q[3]) < 1e-6) return null;
			return viewRotate([q[0] / q[3], q[1] / q[3], q[2] / q[3]]);
		}

		function draw3dGhost() {
			const P = pal();
			const pts = [];
			for (let i = 0; i < 8; i++) {
				const v = viewRotate(corners3d[i]);
				pts.push(project(v));
			}
			ctx.strokeStyle = P.ghost;
			ctx.lineWidth = 1;
			ctx.setLineDash([5, 5]);
			for (let e = 0; e < edges3d.length; e++) {
				const a = pts[edges3d[e][0]], b = pts[edges3d[e][1]];
				if (!a || !b) continue;
				ctx.beginPath();
				ctx.moveTo(a[0], a[1]);
				ctx.lineTo(b[0], b[1]);
				ctx.stroke();
			}
			ctx.setLineDash([]);
			/* ghost marker for the tracked corner */
			let gi = 7;
			for (let i = 0; i < 8; i++)
				if (corners3d[i][0] === D3.corner[0] && corners3d[i][1] === D3.corner[1] && corners3d[i][2] === D3.corner[2]) gi = i;
			const gp = pts[gi];
			if (gp) {
				ctx.fillStyle = P.ghost;
				ctx.beginPath();
				ctx.arc(gp[0], gp[1], 4, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		function draw3dFrame() {
			const P = pal();
			ctx.fillStyle = P.bg;
			ctx.fillRect(0, 0, W, H);
			draw3dGhost();
			const list = [];
			for (let qi = 0; qi < quads.length; qi++) {
				const q = quads[qi];
				const vpts = [];
				let bad = false;
				for (let k = 0; k < 4; k++) {
					const v = mapPoint(q.pts[k]);
					if (!v) { bad = true; break; }
					vpts.push(v);
				}
				if (bad) continue;
				const ps = [];
				let depth = 0;
				for (let k = 0; k < 4; k++) {
					const pr = project(vpts[k]);
					if (!pr) { bad = true; break; }
					ps.push(pr);
					depth += pr[2];
				}
				if (bad) continue;
				list.push({ ps: ps, val: q.val, face: q.face, depth: depth / 4 });
			}
			list.sort(function (a, b) { return b.depth - a.depth; });
			/* per-face shading from the transformed face normal */
			const faceShade = {};
			for (let f = 0; f < 6; f++) {
				const o = mapPoint(CUBE_FACES[f](0, 0));
				const eu = mapPoint(CUBE_FACES[f](0.5, 0));
				const ev = mapPoint(CUBE_FACES[f](0, 0.5));
				let sh = 0.9;
				if (o && eu && ev) {
					const e1 = [eu[0] - o[0], eu[1] - o[1], eu[2] - o[2]];
					const e2 = [ev[0] - o[0], ev[1] - o[1], ev[2] - o[2]];
					const n = [
						e1[1] * e2[2] - e1[2] * e2[1],
						e1[2] * e2[0] - e1[0] * e2[2],
						e1[0] * e2[1] - e1[1] * e2[0]
					];
					const nl = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
					if (nl > 1e-9) {
						const Ld = [-0.45, 0.75, -0.5];
						const ll = Math.sqrt(Ld[0] * Ld[0] + Ld[1] * Ld[1] + Ld[2] * Ld[2]);
						const d = Math.abs((n[0] * Ld[0] + n[1] * Ld[1] + n[2] * Ld[2]) / (nl * ll));
						sh = 0.72 + 0.28 * d;
					}
				}
				faceShade[f] = sh;
			}
			for (let i = 0; i < list.length; i++) {
				const it = list[i];
				const base = lerp3(P.c0, P.c1, it.val);
				const col = [base[0] * faceShade[it.face], base[1] * faceShade[it.face], base[2] * faceShade[it.face]];
				ctx.fillStyle = rgbStr(col);
				ctx.strokeStyle = P.dark ? 'rgba(6,8,18,0.55)' : 'rgba(120,110,90,0.25)';
				ctx.lineWidth = 0.6;
				ctx.beginPath();
				ctx.moveTo(it.ps[0][0], it.ps[0][1]);
				for (let k = 1; k < 4; k++) ctx.lineTo(it.ps[k][0], it.ps[k][1]);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
			}
			/* tracked corner: p (ghost) → M·p (solid), joined */
			const mv = mapPoint(D3.corner);
			if (mv) {
				const pr = project(mv);
				if (pr) {
					const gp = project(viewRotate(D3.corner));
					if (gp) {
						ctx.strokeStyle = P.accent;
						ctx.lineWidth = 1.5;
						ctx.setLineDash([4, 4]);
						ctx.beginPath();
						ctx.moveTo(gp[0], gp[1]);
						ctx.lineTo(pr[0], pr[1]);
						ctx.stroke();
						ctx.setLineDash([]);
					}
					ctx.fillStyle = P.accent;
					ctx.beginPath();
					ctx.arc(pr[0], pr[1], 6, 0, Math.PI * 2);
					ctx.fill();
					ctx.strokeStyle = P.accent;
					ctx.beginPath();
					ctx.arc(pr[0], pr[1], 11, 0, Math.PI * 2);
					ctx.stroke();
					ctx.font = 'bold 12px monospace';
					ctx.textAlign = 'left';
					ctx.fillText("p\u2032", pr[0] + 13, pr[1] + 4);
				}
			}
			ctx.fillStyle = P.ink2;
			ctx.font = '11px monospace';
			ctx.textAlign = 'left';
			ctx.fillText('drag to rotate \u00B7 click a corner to track it', 10, H - 10);
		}

		function upd3dEq() {
			const A = D3.M;
			const p = D3.corner;
			const eq = $('aff3d-eq');
			const mono = $('aff3d-eqmono');
			const d = (mxEditor && mxEditor.values) ? mxEditor.values() : null;
			const qr = Affine.apply4(A, [p[0], p[1], p[2], 1]);
			const xpr = (Math.abs(qr[3]) > 1e-12) ? qr[0] / qr[3] : NaN;
			const ypr = (Math.abs(qr[3]) > 1e-12) ? qr[1] / qr[3] : NaN;
			const zpr = (Math.abs(qr[3]) > 1e-12) ? qr[2] / qr[3] : NaN;
			texInto(eq, "p = (" + fmtNum(p[0]) + ", " + fmtNum(p[1]) + ", " + fmtNum(p[2]) + ") \\;\\mapsto\\; p' = (" + fmtNum(xpr) + ", " + fmtNum(ypr) + ", " + fmtNum(zpr) + ")", true);
			const q = Affine.apply4(A, [p[0], p[1], p[2], 1]);
			const L = [];
			const names = ["x'", "y'", "z'", "w'"];
			const cs = [p[0], p[1], p[2]];
			for (let r = 0; r < 4; r++) {
				L.push(names[r] + ' = ' + termLineText(d, A, r, 4, cs) + ' = ' + fmtNum(q[r]));
			}
			if (Math.abs(q[3] - 1) > 1e-9)
				L.push('w\u2032 \u2260 1 \u2192 projective: final point = (x\u2032, y\u2032, z\u2032)/w\u2032');
			if (mono) mono.textContent = L.join('\n');
		}

		function upd3dStatus() {
			const st = $('aff3d-status');
			if (!st) return;
			st.innerHTML = '';
			const A = D3.M;
			const det = Affine.det4(A);
			const lin = [A[0], A[1], A[2], A[4], A[5], A[6], A[8], A[9], A[10]];
			const detLin = Affine.det3(lin);
			const affineRow = Math.abs(A[12]) < 1e-9 && Math.abs(A[13]) < 1e-9 && Math.abs(A[14]) < 1e-9 && Math.abs(A[15] - 1) < 1e-9;
			const mk = function (text, kind) {
				const s = document.createElement('span');
				s.className = 'aff-pill' + (kind ? ' ' + kind : '');
				s.textContent = text;
				st.appendChild(s);
			};
			if (affineRow) {
				mk('volume scale: \u00D7 ' + fmtNum(Math.abs(detLin)), Math.abs(detLin) < 1e-9 ? 'bad' : '');
				if (detLin < -1e-9) mk('det < 0: orientation flipped (mirror)', 'warn');
			} else {
				mk('last row \u2260 [0, 0, 0, 1] \u2192 projective, not affine', 'warn');
			}
			if (Math.abs(det) < 1e-9) mk('singular: the cube collapses to zero volume', 'bad');
		}

		/* Implementation self-tests */
		function run3dSelfTests() {
			const res = [];
			const A = Affine.rotY(0.6);
			const Ainv = Affine.inv4(A);
			let ok1 = Ainv !== null;
			if (ok1) {
				const prod = Affine.mul4(Ainv, A);
				for (let i = 0; i < 16; i++) {
					const want = (i % 5 === 0) ? 1 : 0;
					if (Math.abs(prod[i] - want) > 1e-9) { ok1 = false; break; }
				}
			}
			res.push(['inverse round-trip: M\u207B\u00B9\u00B7M = I', ok1]);
			const T = Affine.mul4(Affine.rotY(0.35), [1.2, 0, 0, 0.1, 0, 1.1, 0, 0, 0, 0, 0.9, 0, 0, 0, 0, 1]);
			const surf = [];
			for (let f = 0; f < 6; f++) {
				const grid = [];
				for (let b = 0; b <= K; b++) {
					for (let a = 0; a <= K; a++) {
						const p = CUBE_FACES[f](a / K, b / K);
						const q = Affine.apply4(T, [p[0], p[1], p[2], 1]);
						grid.push([q[0] / q[3], q[1] / q[3], q[2] / q[3]]);
					}
				}
				for (let b = 0; b < K; b++)
					for (let a = 0; a < K; a++) {
						const i00 = b * (K + 1) + a, i10 = i00 + 1, i01 = i00 + K + 1, i11 = i01 + 1;
						surf.push(grid[i00], grid[i10], grid[i11]);
						surf.push(grid[i00], grid[i11], grid[i01]);
					}
			}
			const vol = Math.abs(cubeSurfaceVolume(surf));
			const detLin = Math.abs(Affine.det3([1.2, 0, 0, 0, 1.1, 0, 0, 0, 0.9]));
			res.push(['det M = volume of the warped cube', Math.abs(vol - detLin) < 0.03 * detLin]);
			let bad3 = 0;
			const R = Affine.rotY(Math.PI / 7);
			for (let i = 0; i < 8; i++)
				for (let j = i + 1; j < 8; j++) {
					const a = Affine.apply4(R, [corners3d[i][0], corners3d[i][1], corners3d[i][2], 1]);
					const b2 = Affine.apply4(R, [corners3d[j][0], corners3d[j][1], corners3d[j][2], 1]);
					const d0 = Math.sqrt(Math.pow(corners3d[i][0] - corners3d[j][0], 2) + Math.pow(corners3d[i][1] - corners3d[j][1], 2) + Math.pow(corners3d[i][2] - corners3d[j][2], 2));
					const d1 = Math.sqrt(Math.pow(a[0] - b2[0], 2) + Math.pow(a[1] - b2[1], 2) + Math.pow(a[2] - b2[2], 2));
					if (Math.abs(d0 - d1) > 1e-9) bad3++;
				}
			res.push(['rotation preserves all corner distances', bad3 === 0]);
			let bad4 = 0;
			const I4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
			for (let i = 0; i < 8; i++) {
				const a = Affine.apply4(I4, [corners3d[i][0], corners3d[i][1], corners3d[i][2], 1]);
				if (Math.abs(a[0] - corners3d[i][0]) > 1e-12 || Math.abs(a[1] - corners3d[i][1]) > 1e-12 || Math.abs(a[2] - corners3d[i][2]) > 1e-12) bad4++;
			}
			res.push(['identity map fixes every corner', bad4 === 0]);
			return res;
		}

		/* events */
		const mxEditor = buildMatrixEditor('aff3d-mx', 4, 4, D3.M, function (v, r, c) {
			D3.M[r * 4 + c] = v;
			upd3dEq();
			upd3dStatus();
		});
		if (mxEditor && PRESETS3[1] && PRESETS3[1].disp) mxEditor.setStrings(PRESETS3[1].disp);
		buildPresetRow('aff3d-presets', PRESETS3, function (pr) {
			D3.M = pr.m();
			if (mxEditor) { if (pr.disp) mxEditor.setStrings(pr.disp); else mxEditor.set(D3.M); }
			upd3dEq();
			upd3dStatus();
		});
		const autoChk = $('aff3d-auto');
		if (autoChk) autoChk.addEventListener('change', function () { D3.auto = autoChk.checked; });

		c.addEventListener('pointerdown', function (e) {
			D3.drag = { x: e.clientX, y: e.clientY, moved: 0 };
			try { c.setPointerCapture(e.pointerId); } catch (err) { /* optional */ }
		});
		c.addEventListener('pointermove', function (e) {
			if (!D3.drag) return;
			const dx = e.clientX - D3.drag.x;
			const dy = e.clientY - D3.drag.y;
			D3.drag.moved += Math.abs(dx) + Math.abs(dy);
			D3.drag.x = e.clientX;
			D3.drag.y = e.clientY;
			D3.yaw += dx * 0.01;
			D3.pitch = Math.max(-1.45, Math.min(1.45, D3.pitch + dy * 0.01));
		});
		c.addEventListener('pointerup', function (e) {
			if (!D3.drag) return;
			const wasClick = D3.drag.moved < 5;
			D3.drag = null;
			if (!wasClick) return;
			/* corner picking on the transformed cube */
			const r = c.getBoundingClientRect();
			const sx = (e.clientX - r.left) * (c.width / r.width);
			const sy = (e.clientY - r.top) * (c.height / r.height);
			let best = -1, bestD = 16;
			for (let i = 0; i < 8; i++) {
				const v = mapPoint(corners3d[i]);
				if (!v) continue;
				const pr = project(v);
				if (!pr) continue;
				const d = Math.sqrt(Math.pow(pr[0] - sx, 2) + Math.pow(pr[1] - sy, 2));
				if (d < bestD) { bestD = d; best = i; }
			}
			if (best >= 0) {
				D3.corner = corners3d[best].slice();
				upd3dEq();
			}
		});
		c.addEventListener('pointercancel', function () { D3.drag = null; });

		renderChecks($('aff3d-checks'), run3dSelfTests());
		upd3dEq();
		upd3dStatus();

		let errStreak = 0;
		function frame3d() {
			if (document.visibilityState !== 'visible') {
				requestAnimationFrame(frame3d);
				return;
			}
			try {
				if (D3.auto && !D3.drag) D3.yaw += 0.0022;
				draw3dFrame();
				errStreak = 0;
			} catch (e) {
				if (++errStreak > 5) {
					showLabError('aff-3d', e);
					return;
				}
			}
			requestAnimationFrame(frame3d);
		}
		requestAnimationFrame(frame3d);
	}

	/* ══════════════════════════════════════════════════════════════
	   UNLINK 3D LAB — two chained solid tori through a fold
	   ══════════════════════════════════════════════════════════════ */

	const U3 = {
		tilt: 0, spin: 0, c: 0, lam: 0,
		sep: 0, separating: false,
		affineM: null,
		yaw: 0.7, pitch: 0.46,
		auto: true, drag: null,
		showCores: true,
		lk: 1, min: 0.2,
		zoom: 1,
		CAM: 4.4, S0: 150
	};
	const U3RHO = 0.08, U3NU = 40, U3NV = 12, U3NC = 200;

	const PRESETS_U3 = [
		{ name: 'The chain', f: function () { U3.tilt = 0; U3.spin = 0; U3.c = 0; U3.lam = 0; U3.sep = 0; U3.affineM = null; } },
		{ name: 'Bend (λ=0.5)', f: function () { U3.tilt = 0; U3.spin = 0; U3.c = 0; U3.lam = 0.5; U3.sep = 0; U3.affineM = null; } },
		{ name: 'Hammer (λ=1)', f: function () { U3.tilt = 0; U3.spin = 0; U3.c = 0; U3.lam = 1; U3.sep = 0; U3.affineM = null; } },
		{ name: 'Unlink! (λ=2)', f: function () { U3.tilt = 0; U3.spin = 0; U3.c = 0; U3.lam = 2; U3.sep = 0; U3.affineM = null; } },
		{ name: 'Rotate 30° (affine)', f: function () { U3.tilt = 0; U3.spin = 0; U3.c = 0; U3.lam = 0; U3.sep = 0; U3.affineM = Affine.rotY(Math.PI / 6); } }
	];

	function initUnlink3d() {
		const c = $('unlink3d-canvas');
		if (!c) return;
		const ctx = c.getContext('2d');
		if (!ctx) { showLabError('unlink-3d', new Error('Canvas 2D context unavailable')); return; }
		const W = c.width, H = c.height, cx = W / 2, cy = H / 2;

		const meshA = (function () {
			const q = [];
			for (let i = 0; i < U3NU; i++)
				for (let j = 0; j < U3NV; j++) {
					const u0 = i / U3NU * 2 * Math.PI, u1 = (i + 1) / U3NU * 2 * Math.PI;
					const v0 = j / U3NV * 2 * Math.PI, v1 = (j + 1) / U3NV * 2 * Math.PI;
					q.push([Hopf.tubeA(u0, v0, U3RHO), Hopf.tubeA(u1, v0, U3RHO), Hopf.tubeA(u1, v1, U3RHO), Hopf.tubeA(u0, v1, U3RHO)]);
				}
			return q;
		})();
		const meshB = (function () {
			const q = [];
			for (let i = 0; i < U3NU; i++)
				for (let j = 0; j < U3NV; j++) {
					const u0 = i / U3NU * 2 * Math.PI, u1 = (i + 1) / U3NU * 2 * Math.PI;
					const v0 = j / U3NV * 2 * Math.PI, v1 = (j + 1) / U3NV * 2 * Math.PI;
					q.push([Hopf.tubeB(u0, v0, U3RHO), Hopf.tubeB(u1, v0, U3RHO), Hopf.tubeB(u1, v1, U3RHO), Hopf.tubeB(u0, v1, U3RHO)]);
				}
			return q;
		})();

		const n3 = function () { return Fold.normal3(U3.tilt * Math.PI / 180, U3.spin * Math.PI / 180); };

		function u3dViewRotate(p) {
			const cyw = Math.cos(U3.yaw), sw = Math.sin(U3.yaw);
			const cp = Math.cos(U3.pitch), sp = Math.sin(U3.pitch);
			const x1 = cyw * p[0] + sw * p[2];
			const y1 = p[1];
			const z1 = -sw * p[0] + cyw * p[2];
			return [x1, cp * y1 - sp * z1, sp * y1 + cp * z1];
		}
		function proj(v) {
			const depth = v[2] + U3.CAM;
			if (depth < 0.08) return null;
			const s = U3.S0 * U3.zoom * U3.CAM / depth;
			return [cx + v[0] * s, cy - v[1] * s, depth];
		}
		/* object point → folded (+ separated for ring B, + affine) → view-rotated */
		function map3(p, isB) {
			const n = n3();
			let q = Fold.apply3(p, n, U3.c, U3.lam);
			if (isB && U3.sep > 1e-9) q = [q[0] - U3.sep * n[0], q[1] - U3.sep * n[1], q[2] - U3.sep * n[2]];
			if (U3.affineM) {
				const r = Affine.apply4(U3.affineM, [q[0], q[1], q[2], 1]);
				if (!isFinite(r[0]) || Math.abs(r[3]) < 1e-6) return null;
				q = [r[0] / r[3], r[1] / r[3], r[2] / r[3]];
			}
			return u3dViewRotate(q);
		}
		/* same transform, without the view rotation (for the Gauss integral) */
		function foldedPt(p, isB) {
			const n = n3();
			let q = Fold.apply3(p, n, U3.c, U3.lam);
			if (isB && U3.sep > 1e-9) q = [q[0] - U3.sep * n[0], q[1] - U3.sep * n[1], q[2] - U3.sep * n[2]];
			if (U3.affineM) {
				const r = Affine.apply4(U3.affineM, [q[0], q[1], q[2], 1]);
				if (Math.abs(r[3]) < 1e-6) return q;
				q = [r[0] / r[3], r[1] / r[3], r[2] / r[3]];
			}
			return q;
		}
		/* ring-B point with an explicit separation amount (for the ghost + arrow) */
		function bMapped(p, sep) {
			const n = n3();
			let q = Fold.apply3(p, n, U3.c, U3.lam);
			if (sep > 1e-9) q = [q[0] - sep * n[0], q[1] - sep * n[1], q[2] - sep * n[2]];
			if (U3.affineM) {
				const r = Affine.apply4(U3.affineM, [q[0], q[1], q[2], 1]);
				if (!isFinite(r[0]) || Math.abs(r[3]) < 1e-6) return null;
				q = [r[0] / r[3], r[1] / r[3], r[2] / r[3]];
			}
			return u3dViewRotate(q);
		}

		function ringColA(P) { return P.dark ? [124, 156, 255] : [79, 70, 229]; }
		function ringColB(P) { return P.dark ? [34, 211, 238] : [14, 116, 144]; }

		function drawGhost(P) {
			ctx.strokeStyle = P.ghost; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
			[Hopf.coreA, Hopf.coreB].forEach(function (fn) {
				ctx.beginPath(); let started = false;
				for (let i = 0; i <= 96; i++) {
					const pr = proj(u3dViewRotate(fn(i / 96 * 2 * Math.PI)));
					if (!pr) { started = false; continue; }
					if (!started) { ctx.moveTo(pr[0], pr[1]); started = true; }
					else ctx.lineTo(pr[0], pr[1]);
				}
				ctx.stroke();
			});
			ctx.setLineDash([]);
		}

		function drawCreasePlane(P) {
			const n = n3();
			const ref = Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
			let e1 = [ref[1] * n[2] - ref[2] * n[1], ref[2] * n[0] - ref[0] * n[2], ref[0] * n[1] - ref[1] * n[0]];
			const l1 = Math.hypot(e1[0], e1[1], e1[2]) || 1;
			e1 = [e1[0] / l1, e1[1] / l1, e1[2] / l1];
			const e2 = [n[1] * e1[2] - n[2] * e1[1], n[2] * e1[0] - n[0] * e1[2], n[0] * e1[1] - n[1] * e1[0]];
			const ctr = [n[0] * U3.c, n[1] * U3.c, n[2] * U3.c];
			const s = 1.5, corners = [];
			for (const a of [[-s, -s], [s, -s], [s, s], [-s, s]]) {
				const p = [ctr[0] + a[0] * e1[0] + a[1] * e2[0], ctr[1] + a[0] * e1[1] + a[1] * e2[1], ctr[2] + a[0] * e1[2] + a[1] * e2[2]];
				const pr = proj(map3(p, false));
				if (!pr) return;
				corners.push(pr);
			}
			ctx.fillStyle = P.dark ? 'rgba(124,156,255,0.05)' : 'rgba(79,70,229,0.05)';
			ctx.strokeStyle = P.dark ? 'rgba(124,156,255,0.28)' : 'rgba(79,70,229,0.28)';
			ctx.lineWidth = 1;
			ctx.beginPath(); ctx.moveTo(corners[0][0], corners[0][1]);
			for (let k = 1; k < 4; k++) ctx.lineTo(corners[k][0], corners[k][1]);
			ctx.closePath(); ctx.fill(); ctx.stroke();
		}

		function drawCoreLine(fn, col, isB) {
			ctx.strokeStyle = rgbStr(col); ctx.lineWidth = 2;
			ctx.beginPath(); let started = false;
			for (let i = 0; i <= 96; i++) {
				const pr = proj(map3(fn(i / 96 * 2 * Math.PI), isB));
				if (!pr) { started = false; continue; }
				if (!started) { ctx.moveTo(pr[0], pr[1]); started = true; }
				else ctx.lineTo(pr[0], pr[1]);
			}
			ctx.stroke();
		}

		function drawU3dFrame() {
			const P = pal();
			ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
			drawGhost(P);
			if (U3.lam > 0.01 || U3.sep > 1e-3) drawCreasePlane(P);
			const list = [];
			for (let ring = 0; ring < 2; ring++) {
				const mesh = (ring === 0) ? meshA : meshB;
				for (let qi = 0; qi < mesh.length; qi++) {
					const q = mesh[qi];
					const vpts = [];
					let bad = false;
					for (let k = 0; k < 4; k++) {
						const v = map3(q[k], ring === 1);
						if (!v) { bad = true; break; }
						vpts.push(v);
					}
					if (bad) continue;
					const ps = [];
					let depth = 0;
					for (let k = 0; k < 4; k++) {
						const pr = proj(vpts[k]);
						if (!pr) { bad = true; break; }
						ps.push(pr); depth += pr[2];
					}
					if (bad) continue;
					const n = n3();
					const cxx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4;
					const cyy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
					const czz = (q[0][2] + q[1][2] + q[2][2] + q[3][2]) / 4;
					const folded = (n[0] * cxx + n[1] * cyy + n[2] * czz - U3.c) > 0 && U3.lam > 1e-6;
					list.push({ ps: ps, vpts: vpts, ring: ring, depth: depth / 4, folded: folded });
				}
			}
			list.sort(function (a, b) { return b.depth - a.depth; });
			const Ld = [-0.4, 0.8, -0.45], ll = Math.hypot(Ld[0], Ld[1], Ld[2]);
			for (let i = 0; i < list.length; i++) {
				const it = list[i];
				const base = (it.ring === 0) ? ringColA(P) : ringColB(P);
				const e1 = [it.vpts[1][0] - it.vpts[0][0], it.vpts[1][1] - it.vpts[0][1], it.vpts[1][2] - it.vpts[0][2]];
				const e2 = [it.vpts[2][0] - it.vpts[0][0], it.vpts[2][1] - it.vpts[0][1], it.vpts[2][2] - it.vpts[0][2]];
				const nn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
				const nl = Math.hypot(nn[0], nn[1], nn[2]) || 1;
				const sh = 0.6 + 0.4 * Math.abs((nn[0] * Ld[0] + nn[1] * Ld[1] + nn[2] * Ld[2]) / (nl * ll));
				let col = [base[0] * sh, base[1] * sh, base[2] * sh];
				if (it.folded) col = [col[0] * 1.18 + 14, col[1] * 1.18 + 14, col[2] * 1.18 + 14];
				ctx.fillStyle = rgbStr(col);
				ctx.strokeStyle = P.dark ? 'rgba(6,8,18,0.5)' : 'rgba(120,110,90,0.25)';
				ctx.lineWidth = 0.5;
				ctx.beginPath(); ctx.moveTo(it.ps[0][0], it.ps[0][1]);
				for (let k = 1; k < 4; k++) ctx.lineTo(it.ps[k][0], it.ps[k][1]);
				ctx.closePath(); ctx.fill(); ctx.stroke();
			}
			if (U3.showCores) {
				drawCoreLine(Hopf.coreA, ringColA(P), false);
				drawCoreLine(Hopf.coreB, ringColB(P), true);
			}
			/* separation reads as a transformation: ghost of B before the pull + the translation arrow */
			if (U3.sep > 1e-3) {
				ctx.strokeStyle = P.ghost; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
				ctx.beginPath(); let started = false;
				for (let i = 0; i <= 96; i++) {
					const pr = proj(bMapped(Hopf.coreB(i / 96 * 2 * Math.PI), 0));
					if (!pr) { started = false; continue; }
					if (!started) { ctx.moveTo(pr[0], pr[1]); started = true; }
					else ctx.lineTo(pr[0], pr[1]);
				}
				ctx.stroke(); ctx.setLineDash([]);
				let a0 = [0, 0, 0], a1 = [0, 0, 0], na = 0, nb = 0;
				for (let i = 0; i < 24; i++) {
					const p = Hopf.coreB(i / 24 * 2 * Math.PI);
					const m0 = bMapped(p, 0), m1 = bMapped(p, U3.sep);
					if (m0) { a0 = [a0[0] + m0[0], a0[1] + m0[1], a0[2] + m0[2]]; na++; }
					if (m1) { a1 = [a1[0] + m1[0], a1[1] + m1[1], a1[2] + m1[2]]; nb++; }
				}
				if (na && nb) {
					a0 = [a0[0] / na, a0[1] / na, a0[2] / na];
					a1 = [a1[0] / nb, a1[1] / nb, a1[2] / nb];
					const p0 = proj(a0), p1 = proj(a1);
					if (p0 && p1) {
						const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
						ctx.strokeStyle = P.warn; ctx.fillStyle = P.warn; ctx.lineWidth = 2.5;
						ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
						ctx.beginPath();
						ctx.moveTo(p1[0], p1[1]);
						ctx.lineTo(p1[0] - 11 * Math.cos(ang - 0.4), p1[1] - 11 * Math.sin(ang - 0.4));
						ctx.lineTo(p1[0] - 11 * Math.cos(ang + 0.4), p1[1] - 11 * Math.sin(ang + 0.4));
						ctx.closePath(); ctx.fill();
						ctx.font = '11px monospace'; ctx.textAlign = 'left';
						ctx.fillText('B slides along \u2212n\u0302 — straight out of the crease plane (\u22A5)', 10, 18);
					}
				}
				/* right-angle marker at the crease centre: the pull direction (−n̂) is ⊥ to the crease plane */
				const nSep = n3();
				const ctrSep = [nSep[0] * U3.c, nSep[1] * U3.c, nSep[2] * U3.c];
				const refSep = Math.abs(nSep[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
				const e1Sep = [refSep[1] * nSep[2] - refSep[2] * nSep[1], refSep[2] * nSep[0] - refSep[0] * nSep[2], refSep[0] * nSep[1] - refSep[1] * nSep[0]];
				const lSep = Math.hypot(e1Sep[0], e1Sep[1], e1Sep[2]) || 1;
				const e1u = [e1Sep[0] / lSep, e1Sep[1] / lSep, e1Sep[2] / lSep];
				const dSep = 0.5;
				const ctrP = proj(u3dViewRotate(ctrSep));
				const plP = proj(u3dViewRotate([ctrSep[0] + dSep * e1u[0], ctrSep[1] + dSep * e1u[1], ctrSep[2] + dSep * e1u[2]]));
				const spP = proj(u3dViewRotate([ctrSep[0] - dSep * nSep[0], ctrSep[1] - dSep * nSep[1], ctrSep[2] - dSep * nSep[2]]));
				if (ctrP && plP && spP) {
					const sRA = 12;
					const w1 = [plP[0] - ctrP[0], plP[1] - ctrP[1]], w1l = Math.hypot(w1[0], w1[1]) || 1;
					const w2 = [spP[0] - ctrP[0], spP[1] - ctrP[1]], w2l = Math.hypot(w2[0], w2[1]) || 1;
					const u1 = [w1[0] / w1l, w1[1] / w1l], u2 = [w2[0] / w2l, w2[1] / w2l];
					ctx.strokeStyle = P.warn; ctx.lineWidth = 1.5;
					ctx.beginPath();
					ctx.moveTo(ctrP[0] + sRA * u1[0], ctrP[1] + sRA * u1[1]);
					ctx.lineTo(ctrP[0] + sRA * u1[0] + sRA * u2[0], ctrP[1] + sRA * u1[1] + sRA * u2[1]);
					ctx.lineTo(ctrP[0] + sRA * u2[0], ctrP[1] + sRA * u2[1]);
					ctx.stroke();
				}
			}
			ctx.fillStyle = P.ink2; ctx.font = '11px monospace'; ctx.textAlign = 'left';
			ctx.fillText('drag to rotate · scroll to zoom', 10, H - 10);
		}

		function computeLink() {
			const A = sampleCore(Hopf.coreA, U3NC).map(function (p) { return foldedPt(p, false); });
			const B = sampleCore(Hopf.coreB, U3NC).map(function (p) { return foldedPt(p, true); });
			U3.lk = gaussLink(A, B).lk;
			U3.min = minDist3(A, B);
		}

		function updReadout() {
			const eq = $('unlink3d-eq'), mono = $('unlink3d-eqmono');
			if (!eq) return;
			if (U3.min < 0.08 || !isFinite(U3.lk)) {
				texInto(eq, '\\text{the rings are crossing — the unthreading moment}', true);
				if (mono) mono.textContent = 'the two core circles touch, so the Gauss integral has a singularity and Lk is undefined here. Slide λ back a little, or push past it.';
				return;
			}
			const r = Math.round(U3.lk);
			texInto(eq, 'Lk = ' + (r < 0 ? '-' : '') + Math.abs(r) + ' \\qquad \\left(\\text{Gauss integral } ' + U3.lk.toFixed(3) + '\\right)', true);
			const L = [];
			L.push('Lk = (1/4\u03C0) \u222E\u222E (P\u2212Q)\u00B7(dP\u00D7dQ)/|P\u2212Q|\u00B3');
			L.push('  = ' + U3.lk.toFixed(4) + '   over ' + (U3NC * U3NC) + ' sample pairs of the two cores');
			L.push('  min core distance = ' + U3.min.toFixed(3));
			L.push('');
			if (U3.affineM) L.push('pure affine motion of the pair  \u2192  one-to-one  \u2192  Lk is invariant');
			else if (U3.lam < 1e-9) L.push('no fold (affine identity)  \u2192  Lk is invariant');
			else if (U3.lam < 1 - 1e-9) L.push('one-to-one fold (\u03BB \u2264 1)  \u2192  a homeomorphism  \u2192  Lk cannot change');
			else L.push('non-injective fold (\u03BB > 1)  \u2192  space overlaps  \u2192  Lk may change');
			if (U3.sep > 1e-9) L.push('separation: ring B pulled ' + U3.sep.toFixed(2) + ' along \u2212n\u0302');
			if (mono) mono.textContent = L.join('\n');
		}

		function updStatus() {
			const st = $('unlink3d-status');
			if (!st) return;
			st.innerHTML = '';
			const mk = function (text, kind) {
				const s = document.createElement('span');
				s.className = 'aff-pill' + (kind ? ' ' + kind : '');
				s.textContent = text;
				st.appendChild(s);
			};
			if (U3.min < 0.08 || !isFinite(U3.lk)) { mk('rings crossing — unthreading in progress', 'warn'); return; }
			const r = Math.round(U3.lk);
			if (Math.abs(r) >= 1) mk('linked: Lk = ' + (r < 0 ? '\u22121' : '+1'));
			else mk('unlinked: Lk = 0', 'good');
			if (U3.affineM) mk('affine motion: one-to-one, Lk invariant');
			else if (U3.lam < 1e-9) mk('no fold (affine)');
			else if (U3.lam < 1 - 1e-9) mk('one-to-one (\u03BB \u2264 1): Lk stuck');
			else mk('overlap (\u03BB > 1): Lk can fall', 'warn');
			if (U3.sep > 1e-9 && Math.abs(r) < 1) mk('separated', 'good');
		}

		function runUnlinkSelfTests() {
			const res = [];
			const A = sampleCore(Hopf.coreA, 288), B = sampleCore(Hopf.coreB, 288);
			res.push(['the chain has |Lk| = 1', Math.abs(Math.abs(gaussLink(A, B).lk) - 1) < 0.03]);
			const Bf = B.map(function (p) { return [p[0] + 5, p[1], p[2]]; });
			res.push(['far-apart circles have Lk = 0', Math.abs(gaussLink(A, Bf).lk) < 0.03]);
			let okc = true;
			const nz = [0, 0, 1];
			for (let i = 0; i < 12; i++) {
				const e = 1e-5, x = 0.3 * i;
				const a = Fold.apply3([x, 0.2, -e], nz, 0, 2), b = Fold.apply3([x, 0.2, e], nz, 0, 2);
				if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) > 1e-6) okc = false;
			}
			res.push(['the fold is continuous at the crease', okc]);
			let okj = true;
			const seen = {};
			for (let i = 0; i < 3000 && okj; i++) {
				const p = [Math.random() * 3 - 1.5, Math.random() * 3 - 1.5, Math.random() * 3 - 1.5];
				const q = Fold.apply3(p, nz, 0, 0.5);
				const key = Math.round(q[0] * 1e4) + ',' + Math.round(q[1] * 1e4) + ',' + Math.round(q[2] * 1e4);
				if (seen[key]) okj = false;
				seen[key] = 1;
			}
			res.push(['\u03BB < 1 fold is one-to-one', okj]);
			const A2 = A.map(function (p) { return Fold.apply3(p, nz, 0, 2); });
			const B2 = B.map(function (p) { return Fold.apply3(p, nz, 0, 2); });
			res.push(['\u1E91-fold at \u03BB = 2 unlinks (Lk = 0)', Math.abs(gaussLink(A2, B2).lk) < 0.05]);
			const R = Affine.rotY(0.6);
			const Ar = A.map(function (p) { const r = Affine.apply4(R, [p[0], p[1], p[2], 1]); return [r[0], r[1], r[2]]; });
			const Br = B.map(function (p) { const r = Affine.apply4(R, [p[0], p[1], p[2], 1]); return [r[0], r[1], r[2]]; });
			res.push(['an affine rotation keeps |Lk| = 1', Math.abs(Math.abs(gaussLink(Ar, Br).lk) - 1) < 0.03]);
			return res;
		}

		/* controls */
		const sTilt = $('u3d-tilt'), sSpin = $('u3d-spin'), sC = $('u3d-c'), sLam = $('u3d-lambda'), sSep = $('u3d-sep');
		function syncU3dSliders() {
			if (sTilt) sTilt.value = String(Math.round(U3.tilt));
			if (sSpin) sSpin.value = String(Math.round(U3.spin));
			if (sC) sC.value = String(U3.c);
			if (sLam) sLam.value = String(U3.lam);
			if (sSep) sSep.value = String(U3.sep);
		}
		function labelU3dSliders() {
			const tv = $('u3d-tilt-v'), sv = $('u3d-spin-v'), cv = $('u3d-c-v'), lv = $('u3d-lambda-v'), ev = $('u3d-sep-v');
			if (tv) tv.textContent = Math.round(U3.tilt) + '\u00B0';
			if (sv) sv.textContent = Math.round(U3.spin) + '\u00B0';
			if (cv) cv.textContent = U3.c.toFixed(2);
			if (lv) lv.textContent = U3.lam.toFixed(2);
			if (ev) ev.textContent = U3.sep.toFixed(2);
		}
		function recompute() {
			try { computeLink(); updReadout(); updStatus(); } catch (e) { showLabError('unlink-3d', e); }
		}
		function onFoldSlider() {
			if (sTilt) U3.tilt = parseFloat(sTilt.value);
			if (sSpin) U3.spin = parseFloat(sSpin.value);
			if (sC) U3.c = parseFloat(sC.value);
			if (sLam) U3.lam = parseFloat(sLam.value);
			U3.affineM = null;
			labelU3dSliders();
			recompute();
		}
		function onSepSlider() {
			if (sSep) U3.sep = parseFloat(sSep.value);
			U3.separating = false;
			labelU3dSliders();
			recompute();
		}
		if (sTilt) sTilt.addEventListener('input', onFoldSlider);
		if (sSpin) sSpin.addEventListener('input', onFoldSlider);
		if (sC) sC.addEventListener('input', onFoldSlider);
		if (sLam) sLam.addEventListener('input', onFoldSlider);
		if (sSep) sSep.addEventListener('input', onSepSlider);

		buildPresetRow('unlink3d-presets', PRESETS_U3, function (pr) {
			pr.f();
			syncU3dSliders(); labelU3dSliders(); recompute();
		});

		const sepBtn = $('unlink3d-sepbtn');
		if (sepBtn) sepBtn.addEventListener('click', function () { U3.separating = true; });
		const autoChk = $('unlink3d-auto');
		if (autoChk) autoChk.addEventListener('change', function () { U3.auto = autoChk.checked; });
		const coresChk = $('unlink3d-cores');
		if (coresChk) coresChk.addEventListener('change', function () { U3.showCores = coresChk.checked; });

		c.addEventListener('pointerdown', function (e) {
			U3.drag = { x: e.clientX, y: e.clientY };
			try { c.setPointerCapture(e.pointerId); } catch (err) { /* optional */ }
		});
		c.addEventListener('pointermove', function (e) {
			if (!U3.drag) return;
			const dx = e.clientX - U3.drag.x, dy = e.clientY - U3.drag.y;
			U3.drag.x = e.clientX; U3.drag.y = e.clientY;
			U3.yaw += dx * 0.01;
			U3.pitch = Math.max(-1.45, Math.min(1.45, U3.pitch + dy * 0.01));
		});
		c.addEventListener('pointerup', function () { U3.drag = null; });
		c.addEventListener('pointercancel', function () { U3.drag = null; });
		c.addEventListener('wheel', function (e) {
			e.preventDefault();
			U3.zoom = Math.max(0.4, Math.min(6, U3.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
		}, { passive: false });

		renderChecks($('unlink3d-checks'), runUnlinkSelfTests());
		syncU3dSliders(); labelU3dSliders();
		recompute();

		let errStreak = 0;
		function frame() {
			if (document.visibilityState !== 'visible') { requestAnimationFrame(frame); return; }
			try {
				if (U3.separating) {
					U3.sep = Math.min(1.2, U3.sep + 0.015);
					if (U3.sep >= 1.199) { U3.sep = 1.2; U3.separating = false; }
					if (sSep) sSep.value = String(U3.sep);
					const ev = $('u3d-sep-v');
					if (ev) ev.textContent = U3.sep.toFixed(2);
					recompute();
				}
				if (U3.auto && !U3.drag) U3.yaw += 0.0022;
				drawU3dFrame();
				errStreak = 0;
			} catch (e) {
				if (++errStreak > 5) { showLabError('unlink-3d', e); return; }
			}
			requestAnimationFrame(frame);
		}
		requestAnimationFrame(frame);
	}

	/* ══════════════════════════════════════════════════════════════
	   Bootstrap
	   ══════════════════════════════════════════════════════════════ */

	const themeRedraws = [];

	let inited = false;
	function initAffineLab() {
		if (inited) return;
		inited = true;
		try { init2d(); } catch (e) { showLabError('aff-2d', e); }
		try { init3d(); } catch (e) { showLabError('aff-3d', e); }
		try { initFold2d(); } catch (e) { showLabError('fold-2d', e); }
		try { initUnlink3d(); } catch (e) { showLabError('unlink-3d', e); }
		if (window.__MN_DARK && __MN_DARK.onChange) {
			__MN_DARK.onChange(function () {
				themeRedraws.forEach(function (fn) {
					try { fn(); } catch (e) { /* ignore */ }
				});
			});
		}
	}

	window.affineLab = { state2d: D2, state3d: D3, stateFold2d: F2, stateUnlink3d: U3 };

	if (document.readyState === 'complete') {
		initAffineLab();
	} else {
		window.addEventListener('blogPostLoadComplete', initAffineLab, { once: true });
		window.addEventListener('load', function () { setTimeout(initAffineLab, 80); }, { once: true });
	}
})();
