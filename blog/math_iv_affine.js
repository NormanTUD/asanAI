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

	/* Expose the pure core for external self-testing (node CI, etc.) */
	const gbl = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : null);
	if (gbl) gbl.__affineMath = { Affine: Affine, cbVal: cbVal, cbBilinear: cbBilinear, buildCubeQuads: buildCubeQuads, cubeSurfaceVolume: cubeSurfaceVolume, polyArea: polyArea };

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
				.replace(/sin\(/g, 'Math.sin(')
				.replace(/cos\(/g, 'Math.cos(')
				.replace(/tan\(/g, 'Math.tan(')
				.replace(/sqrt\(/g, 'Math.sqrt(')
				.replace(/PI/g, 'Math.PI')
				.replace(/exp\(/g, 'Math.exp(')
				.replace(/abs\(/g, 'Math.abs(');
			
			// Basic degree-to-radian conversion if user enters 'deg'
			// This is a bit hacky for a CLI tool, but works for the requirement.
			// We'll assume standard Math functions and if they want degrees,
			// they can write 'cos(30 * PI / 180)' or we can pre-process.
			// Let's try to handle 'deg' as a suffix.
			
			// Simple degree detection: if it's not a standard math function, 
			// maybe it's a degree-based one.
			let val = Function(`"use strict"; return (${expr})`)();
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
				try { onPick(pr.m()); } catch (e) { console.error('[affine lab] preset failed', e); }
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
		{ name: 'Rotate 30°', m: function () { return Affine.rot2(Math.PI / 6); } },
		{ name: 'Rotate 90° @ center', m: function () { return [0, -1, 1, 1, 0, 0, 0, 0, 1]; } },
		{ name: 'Scale ×2', m: function () { return [2, 0, 0, 0, 2, 0, 0, 0, 1]; } },
		{ name: 'Scale ×1.5 @ center', m: function () { return [1.5, 0, -0.25, 0, 1.5, -0.25, 0, 0, 1]; } },
		{ name: 'Shear', m: function () { return [1, 0.7, 0, 0, 1, 0, 0, 0, 1]; } },
		{ name: 'Translate', m: function () { return [1, 0, 0.35, 0, 1, -0.25, 0, 0, 1]; } },
		{ name: 'Mirror x', m: function () { return [-1, 0, 1, 0, 1, 0, 0, 0, 1]; } },
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
			const m = function (i) { return fmtNum(A[i]); };
			const tex = "\\left[\\begin{matrix} x' \\\\ y' \\\\ w' \\end{matrix}\\right] = \\left[\\begin{matrix}" +
				m(0) + ' & ' + m(1) + ' & ' + m(2) + '\\\\ ' +
				m(3) + ' & ' + m(4) + ' & ' + m(5) + '\\\\ ' +
				m(6) + ' & ' + m(7) + ' & ' + m(8) +
				"\\end{matrix}\\right] \\left[\\begin{matrix} " + fmtNum(x) + ' \\\\ ' + fmtNum(y) + ' \\\\ 1 \\end{matrix}\\right]';
			texInto(eq, tex, true);
			const q = Affine.apply3(A, [x, y, 1]);
			const L = [];
			const termsX = [A[0] * x, A[1] * y, A[2]];
			const termsY = [A[3] * x, A[4] * y, A[5]];
			const termsW = [A[6] * x, A[7] * y, A[8]];
			const line = function (label, t, tot) {
				L.push(label + " = " + fmtNum(t[0]) + ' + ' + (t[1] < 0 ? '\u2212 ' + fmtNum(Math.abs(t[1])) : fmtNum(t[1])) + ' + ' + (t[2] < 0 ? '\u2212 ' + fmtNum(Math.abs(t[2])) : fmtNum(t[2])));
				L.push('    = ' + fmtNum(tot));
			};
			line("x'", termsX, q[0]);
			line("y'", termsY, q[1]);
			line("w'", termsW, q[2]);
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
		buildPresetRow('aff2d-presets', PRESETS2, function (m) {
			D2.M = m;
			if (mxEditor) mxEditor.set(m);
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
		{ name: 'Rotate Y 30°', m: function () { return Affine.rotY(Math.PI / 6); } },
		{ name: 'Rotate X 20°', m: function () { return Affine.rotX(20 * Math.PI / 180); } },
		{ name: 'RotX 20° \u00B7 RotY 30°', m: function () { return Affine.mul4(Affine.rotX(20 * Math.PI / 180), Affine.rotY(Math.PI / 6)); } },
		{ name: 'Scale (1.4, 1, 0.6)', m: function () { return [1.4, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.6, 0, 0, 0, 0, 1]; } },
		{ name: 'Shear', m: function () { return [1, 0.5, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; } },
		{ name: 'Translate', m: function () { return [1, 0, 0, 0.15, 0, 1, 0, 0.35, 0, 0, 1, 0, 0, 0, 0, 1]; } },
		{ name: 'Mirror x', m: function () { return [-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; } },
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
			const m = function (i) { return fmtNum(A[i]); };
			const rows = [0, 4, 8, 12];
			let tex = '\\left[\\begin{matrix}';
			for (let r = 0; r < 4; r++) {
				tex += m(rows[r] + 0) + ' & ' + m(rows[r] + 1) + ' & ' + m(rows[r] + 2) + ' & ' + m(rows[r] + 3);
				tex += (r < 3) ? ' \\\\ ' : '';
			}
			tex += "\\end{matrix}\\right] \\left[\\begin{matrix} " + p[0] + ' \\\\ ' + p[1] + ' \\\\ ' + p[2] + ' \\\\ 1 \\end{matrix}\\right]';
			texInto(eq, tex, true);
			const q = Affine.apply4(A, [p[0], p[1], p[2], 1]);
			const L = [];
			const names = ["x'", "y'", "z'", "w'"];
			for (let r = 0; r < 4; r++) {
				const t = [A[rows[r]] * p[0], A[rows[r] + 1] * p[1], A[rows[r] + 2] * p[2], A[rows[r] + 3]];
				L.push(names[r] + ' = ' + fmtNum(t[0]) + ' + ' + (t[1] < 0 ? '\u2212 ' + fmtNum(Math.abs(t[1])) : fmtNum(t[1])) +
					' + ' + (t[2] < 0 ? '\u2212 ' + fmtNum(Math.abs(t[2])) : fmtNum(t[2])) +
					' + ' + (t[3] < 0 ? '\u2212 ' + fmtNum(Math.abs(t[3])) : fmtNum(t[3])));
				L.push('    = ' + fmtNum(q[r]));
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
		buildPresetRow('aff3d-presets', PRESETS3, function (m) {
			D3.M = m;
			if (mxEditor) mxEditor.set(m);
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
	   Bootstrap
	   ══════════════════════════════════════════════════════════════ */

	const themeRedraws = [];

	let inited = false;
	function initAffineLab() {
		if (inited) return;
		inited = true;
		try { init2d(); } catch (e) { showLabError('aff-2d', e); }
		try { init3d(); } catch (e) { showLabError('aff-3d', e); }
		if (window.__MN_DARK && __MN_DARK.onChange) {
			__MN_DARK.onChange(function () {
				themeRedraws.forEach(function (fn) {
					try { fn(); } catch (e) { /* ignore */ }
				});
			});
		}
	}

	window.affineLab = { state2d: D2, state3d: D3 };

	if (document.readyState === 'complete') {
		initAffineLab();
	} else {
		window.addEventListener('blogPostLoadComplete', initAffineLab, { once: true });
		window.addEventListener('load', function () { setTimeout(initAffineLab, 80); }, { once: true });
	}
})();
