/* ══════════════════════════════════════════════════════════════════════
   math_iv_affine.js — Affine + Fold + Hopf interactive labs (rewrite)

   Structure
   1. Pure math core (DOM-free, exposed on window.__affineMath)
   2. Shared UI (palette cache, temml, matrix editor, presets, checks)
   3. Lab 2D  · affine warp of an 8×8 checkerboard
   4. Lab 3D  · affine warp of a checkerboard cube
   5. Lab F2  · the fold — piecewise-affine map, with 3D bent-paper view
   6. Lab U3  · Hopf link, unlinked by a fold
   7. Bootstrap
   ══════════════════════════════════════════════════════════════════════ */
(() => {
	'use strict';

	/* ═══ 1. PURE MATH CORE ═══════════════════════════════════════════ */

	const mulNxN = (A, B, n) => {
		const R = new Float64Array(n * n);
		for (let r = 0; r < n; r++)
			for (let c = 0; c < n; c++) {
				let s = 0;
				for (let k = 0; k < n; k++) s += A[r * n + k] * B[k * n + c];
				R[r * n + c] = s;
			}
		return R;
	};

	const apply3 = (A, p) => [
		A[0]*p[0] + A[1]*p[1] + A[2]*(p[2] ?? 1),
		A[3]*p[0] + A[4]*p[1] + A[5]*(p[2] ?? 1),
		A[6]*p[0] + A[7]*p[1] + A[8]*(p[2] ?? 1)
	];

	const apply4 = (A, p) => [
		A[0]*p[0] + A[1]*p[1] + A[2]*p[2]  + A[3]*(p[3] ?? 1),
		A[4]*p[0] + A[5]*p[1] + A[6]*p[2]  + A[7]*(p[3] ?? 1),
		A[8]*p[0] + A[9]*p[1] + A[10]*p[2] + A[11]*(p[3] ?? 1),
		A[12]*p[0]+ A[13]*p[1]+ A[14]*p[2] + A[15]*(p[3] ?? 1)
	];

	const det3 = A =>
		A[0]*(A[4]*A[8] - A[5]*A[7]) -
		A[1]*(A[3]*A[8] - A[5]*A[6]) +
		A[2]*(A[3]*A[7] - A[4]*A[6]);

	const inv3 = A => {
		const d = det3(A);
		if (!isFinite(d) || Math.abs(d) < 1e-12) return null;
		const id = 1 / d;
		return new Float64Array([
			 (A[4]*A[8]-A[5]*A[7])*id, -(A[1]*A[8]-A[2]*A[7])*id,  (A[1]*A[5]-A[2]*A[4])*id,
			-(A[3]*A[8]-A[5]*A[6])*id,  (A[0]*A[8]-A[2]*A[6])*id, -(A[0]*A[5]-A[2]*A[3])*id,
			 (A[3]*A[7]-A[4]*A[6])*id, -(A[0]*A[7]-A[1]*A[6])*id,  (A[0]*A[4]-A[1]*A[3])*id
		]);
	};

	const det4 = A => {
		const minor3 = (r, c) => {
			const M = new Float64Array(9);
			let k = 0;
			for (let i = 0; i < 4; i++)
				for (let j = 0; j < 4; j++)
					if (i !== r && j !== c) M[k++] = A[i*4 + j];
			return det3(M);
		};
		return A[0]*minor3(0,0) - A[1]*minor3(0,1) + A[2]*minor3(0,2) - A[3]*minor3(0,3);
	};

	const inv4 = A => {
		const M = new Float64Array(32);
		for (let r = 0; r < 4; r++) {
			for (let c = 0; c < 4; c++) M[r*8 + c] = A[r*4 + c];
			M[r*8 + 4 + r] = 1;
		}
		for (let col = 0; col < 4; col++) {
			let piv = col;
			for (let r = col + 1; r < 4; r++)
				if (Math.abs(M[r*8 + col]) > Math.abs(M[piv*8 + col])) piv = r;
			if (Math.abs(M[piv*8 + col]) < 1e-12) return null;
			if (piv !== col)
				for (let c = 0; c < 8; c++) {
					const t = M[col*8 + c]; M[col*8 + c] = M[piv*8 + c]; M[piv*8 + c] = t;
				}
			const d = M[col*8 + col];
			for (let c = 0; c < 8; c++) M[col*8 + c] /= d;
			for (let r = 0; r < 4; r++) {
				if (r === col) continue;
				const f = M[r*8 + col];
				if (f === 0) continue;
				for (let c = 0; c < 8; c++) M[r*8 + c] -= f * M[col*8 + c];
			}
		}
		const R = new Float64Array(16);
		for (let r = 0; r < 4; r++)
			for (let c = 0; c < 4; c++) R[r*4 + c] = M[r*8 + 4 + c];
		for (let i = 0; i < 16; i++) if (!isFinite(R[i])) return null;
		return R;
	};

	const rot2 = a => {
		const c = Math.cos(a), s = Math.sin(a);
		return new Float64Array([c, -s, 0, s, c, 0, 0, 0, 1]);
	};
	const rotX = a => {
		const c = Math.cos(a), s = Math.sin(a);
		return new Float64Array([1,0,0,0, 0,c,-s,0, 0,s,c,0, 0,0,0,1]);
	};
	const rotY = a => {
		const c = Math.cos(a), s = Math.sin(a);
		return new Float64Array([c,0,s,0, 0,1,0,0, -s,0,c,0, 0,0,0,1]);
	};
	const rotZ = a => {
		const c = Math.cos(a), s = Math.sin(a);
		return new Float64Array([c,-s,0,0, s,c,0,0, 0,0,1,0, 0,0,0,1]);
	};

	const Mat = { mul3:(A,B)=>mulNxN(A,B,3), mul4:(A,B)=>mulNxN(A,B,4),
	              apply3, apply4, det3, det4, inv3, inv4, rot2, rotX, rotY, rotZ };

	/* ─── checkerboard: nearest (crisp 0/1) + bilinear (smooth) ─── */
	const cbNearest = (u, v) => {
		if (u < 0 || u >= 1 || v < 0 || v >= 1) return -1;
		const i = Math.min(7, u * 8 | 0);
		const j = Math.min(7, v * 8 | 0);
		return (i + j) & 1;
	};
	const cbBilinear = (u, v) => {
		if (u < 0 || u >= 1 || v < 0 || v >= 1) return -1;
		const uu = u * 8 - 0.5, vv = v * 8 - 0.5;
		const i = Math.max(0, Math.min(uu | 0, 7));
		const j = Math.max(0, Math.min(vv | 0, 7));
		const fx = Math.max(0, Math.min(1, uu - i));
		const fy = Math.max(0, Math.min(1, vv - j));
		const v00 = (i + j) & 1, v10 = (i + 1 + j) & 1;
		const v01 = (i + j + 1) & 1, v11 = (i + j) & 1;
		return v00*(1-fx)*(1-fy) + v10*fx*(1-fy) + v01*(1-fx)*fy + v11*fx*fy;
	};

	/* ─── cube mesh (6 faces × K×K quads), built once ─── */
	const CUBE_FACES = [
		(u, v) => [u, v, 1],       (u, v) => [1 - u, v, 0],
		(u, v) => [1, v, 1 - u],   (u, v) => [0, v, u],
		(u, v) => [u, 1, 1 - v],   (u, v) => [u, 0, v]
	];
	const buildCubeQuads = K => {
		const quads = [];
		for (let f = 0; f < 6; f++) {
			const face = CUBE_FACES[f];
			for (let a = 0; a < K; a++)
				for (let b = 0; b < K; b++) {
					const u0=a/K, u1=(a+1)/K, v0=b/K, v1=(b+1)/K;
					const ci = (u0*4+1e-9)|0, cj = (v0*4+1e-9)|0;
					quads.push({
						pts:[face(u0,v0), face(u1,v0), face(u1,v1), face(u0,v1)],
						val:(ci+cj)&1, face:f
					});
				}
		}
		return quads;
	};

	/* ─── fold + Hopf ─── */
	const Fold = {
		normal2: t => [Math.cos(t), Math.sin(t)],
		normal3: (tilt, spin) => {
			const st = Math.sin(tilt), ct = Math.cos(tilt);
			return [st*Math.cos(spin), st*Math.sin(spin), ct];
		},
		apply2: (p, n, c, lam) => {
			const d = n[0]*p[0] + n[1]*p[1] - c;
			return d <= 0 ? [p[0], p[1]] : [p[0] - lam*d*n[0], p[1] - lam*d*n[1]];
		},
		apply3: (p, n, c, lam) => {
			const d = n[0]*p[0] + n[1]*p[1] + n[2]*p[2] - c;
			return d <= 0 ? [p[0], p[1], p[2]]
			              : [p[0]-lam*d*n[0], p[1]-lam*d*n[1], p[2]-lam*d*n[2]];
		},
		pieceMatrix2: (n, c, lam) => {
			const nx = n[0], ny = n[1];
			return new Float64Array([
				1-lam*nx*nx, -lam*nx*ny,   lam*c*nx,
				-lam*nx*ny,   1-lam*ny*ny, lam*c*ny,
				0, 0, 1
			]);
		},
		preimages2: (q, n, c, lam) => {
			const inBox = p => p[0]>=-1e-9 && p[0]<=1+1e-9 && p[1]>=-1e-9 && p[1]<=1+1e-9;
			const out = [];
			if (n[0]*q[0]+n[1]*q[1] <= c+1e-9 && inBox(q)) out.push({p:[q[0],q[1]], piece:1});
			const nx=n[0], ny=n[1];
			const a00=1-lam*nx*nx, a01=-lam*nx*ny, a11=1-lam*ny*ny;
			const det = a00*a11 - a01*a01;
			if (Math.abs(det) > 1e-9) {
				const bx = q[0] - lam*c*nx, by = q[1] - lam*c*ny;
				const px = (a11*bx - a01*by) / det;
				const py = (-a01*bx + a00*by) / det;
				if (nx*px+ny*py > c+1e-9 && inBox([px,py])) out.push({p:[px,py], piece:2});
			}
			return out;
		}
	};

	const Hopf = {
		coreA: u => [Math.cos(u), Math.sin(u), 0],
		coreB: t => [0, 0.5 + 0.7*Math.cos(t), 0.7*Math.sin(t)],
		tubeA: (u, v, r) => {
			const cu=Math.cos(u), su=Math.sin(u), cv=Math.cos(v), sv=Math.sin(v);
			return [cu + r*cv*cu, su + r*cv*su, r*sv];
		},
		tubeB: (u, v, r) => {
			const cu=Math.cos(u), su=Math.sin(u), cv=Math.cos(v), sv=Math.sin(v);
			return [r*sv, 0.5 + 0.7*cu + r*cv*cu, 0.7*su + r*cv*su];
		}
	};

	/* ─── small utils ─── */
	const vsub = (a,b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
	const vcross = (a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
	const vnorm = a => Math.hypot(a[0], a[1], a[2]);

	const sampleCore = (fn, N) => {
		const a = new Array(N);
		const step = 2 * Math.PI / N;
		for (let i = 0; i < N; i++) a[i] = fn(i * step);
		return a;
	};

	// Gauss linking number over polygonal curves — tight loop, no allocations.
	const gaussLink = (P, Q) => {
		const n = P.length, m = Q.length;
		let s = 0;
		for (let i = 0; i < n; i++) {
			const Pi = P[i], Pn = P[(i+1)%n];
			const dPx=Pn[0]-Pi[0], dPy=Pn[1]-Pi[1], dPz=Pn[2]-Pi[2];
			for (let j = 0; j < m; j++) {
				const Qj = Q[j], Qn = Q[(j+1)%m];
				const dQx=Qn[0]-Qj[0], dQy=Qn[1]-Qj[1], dQz=Qn[2]-Qj[2];
				const rx=Pi[0]-Qj[0], ry=Pi[1]-Qj[1], rz=Pi[2]-Qj[2];
				const rr = rx*rx + ry*ry + rz*rz;
				if (rr < 1e-12) return { lk: NaN };
				const cx = dPy*dQz - dPz*dQy;
				const cy = dPz*dQx - dPx*dQz;
				const cz = dPx*dQy - dPy*dQx;
				s += (rx*cx + ry*cy + rz*cz) / (rr * Math.sqrt(rr));
			}
		}
		return { lk: s / (4 * Math.PI) };
	};

	const minDist3 = (P, Q) => {
		let md = Infinity;
		for (let i = 0; i < P.length; i++)
			for (let j = 0; j < Q.length; j++) {
				const d = vnorm(vsub(P[i], Q[j]));
				if (d < md) md = d;
			}
		return md;
	};

	const polyArea = pts => {
		let a = 0;
		for (let i = 0; i < pts.length; i++) {
			const p = pts[i], q = pts[(i+1) % pts.length];
			a += p[0]*q[1] - q[0]*p[1];
		}
		return Math.abs(a) / 2;
	};

	const surfVolume = tris => {
		let v = 0;
		for (let i = 0; i + 2 < tris.length; i += 3) {
			const p0=tris[i], p1=tris[i+1], p2=tris[i+2];
			v += p0[0]*(p1[1]*p2[2] - p1[2]*p2[1])
			   - p0[1]*(p1[0]*p2[2] - p1[2]*p2[0])
			   + p0[2]*(p1[0]*p2[1] - p1[1]*p2[0]);
		}
		return v / 6;
	};

	const gbl = typeof window !== 'undefined' ? window
	          : typeof globalThis !== 'undefined' ? globalThis : null;
	if (gbl) gbl.__affineMath = { Mat, Fold, Hopf, cbNearest, cbBilinear,
	                              buildCubeQuads, surfVolume, polyArea,
	                              gaussLink, minDist3, sampleCore };

	if (typeof document === 'undefined') return;

	/* ═══ 2. SHARED UI ════════════════════════════════════════════════ */

	const $ = id => document.getElementById(id);
	const themeRedraws = [];

	// Cached palette — rebuilt only on theme change.
	let PAL = null;
	const buildPalette = () => {
		const dark = typeof isDarkMode === 'function' ? isDarkMode() : true;
		const p = dark ? {
			dark:true, bg:'#060812', panel:'#10141f',
			ink:'#e8ecf7', ink2:'#a0aec8',
			accent:'#7c9cff', cyan:'#22d3ee',
			good:'#4ade80', warn:'#fbbf24', bad:'#f87171',
			line:'#2a3350', ghost:'rgba(124,156,255,0.35)',
			c0:[13,16,26], c1:[226,232,245]
		} : {
			dark:false, bg:'#ffffff', panel:'#f4f1e9',
			ink:'#1e293b', ink2:'#5b6472',
			accent:'#4f46e5', cyan:'#0e7490',
			good:'#15803d', warn:'#b45309', bad:'#dc2626',
			line:'#d8cfc0', ghost:'rgba(79,70,229,0.35)',
			c0:[23,26,33], c1:[255,255,255]
		};
		p.bgRGB = [parseInt(p.bg.slice(1,3),16), parseInt(p.bg.slice(3,5),16), parseInt(p.bg.slice(5,7),16)];
		return p;
	};
	const pal = () => PAL || (PAL = buildPalette());
	const invalidatePal = () => { PAL = null; };

	/* ─── helpers ─── */
	const fmt = v => {
		if (!isFinite(v)) return '?';
		if (Math.abs(v) < 1e-4) v = 0;
		const a = Math.abs(v);
		return a >= 100 ? v.toFixed(1) : a >= 10 ? v.toFixed(2) : v.toFixed(3);
	};
	const round4 = v => Math.round(v * 10000) / 10000;
	const lerp3 = (a, b, t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
	const rgb = c => `rgb(${c[0]|0},${c[1]|0},${c[2]|0})`;

	const parseCell = s => {
		const clean = String(s).trim().replace(/,/g,'');
		if (!clean) return 0;
		try {
			const expr = clean
				.replace(/\bpi\b/gi, 'Math.PI').replace(/π/g, 'Math.PI')
				.replace(/\b(sin|cos|tan|sqrt|exp|abs|log)\(/g, 'Math.$1(')
				.replace(/(\d*\.?\d+)°/g, '($1*Math.PI/180)')
				.replace(/(\d*\.?\d+)deg/gi, '($1*Math.PI/180)');
			return Function('"use strict";return(' + expr + ')')();
		} catch { return NaN; }
	};

	const tex = (el, latex, display) => {
		if (!el) return;
		if (typeof temml !== 'undefined' && temml.renderToString) {
			try { el.innerHTML = temml.renderToString(latex, { displayMode: !!display, annotate: true }); return; }
			catch {}
		}
		el.textContent = latex;
	};

	// Turn a plain display string (e.g. "cos(30°)", "-sin(30°)") into LaTeX.
	const texify = s => String(s)
		.replace(/−/g, '-')
		.replace(/\b(sin|cos|tan|sqrt|log|exp)\(/g, '\\$1(')
		.replace(/π/g, '\\pi');

	// Render one row of M·p as real math: display strings (e.g. "cos(30°)")
	// keep their symbolic form, signs are folded in from the values.
	const termLineTex = (disp, A, r, stride, coords) => {
		const parts = [];
		for (let k = 0; k < stride; k++) {
			const coord = k < stride - 1 ? coords[k] : 1;
			const val = A[r * stride + k] * coord;
			const raw = disp ? disp[r * stride + k] : A[r * stride + k];
			const ds = String(raw ?? '').replace(/\s+/g,'').replace(/^[+\-−]/,'');
			let body = ds === '' ? fmt(Math.abs(val)) : texify(ds);
			if (k < stride - 1) body += '\\cdot ' + fmt(Math.abs(coord));
			parts.push({ neg: val < -1e-12, body });
		}
		return parts.map((p,i) => i === 0
			? (p.neg ? '-' : '') + p.body
			: (p.neg ? ' - ' : ' + ') + p.body
		).join('');
	};

	const showError = (anchorId, err) => {
		console.error('[affine lab]', err);
		const el = $(anchorId);
		if (!el) return;
		const box = document.createElement('div');
		box.className = 'af-err';
		box.textContent = 'Interactive failed to start: ' + (err?.message ?? err);
		el.appendChild(box);
	};

	const buildMatrixEditor = (hostId, rows, cols, initial, onChange) => {
		const host = $(hostId); if (!host) return null;
		host.innerHTML = '';
		const inputs = [];
		for (let r = 0; r < rows; r++) {
			const rowEl = document.createElement('div');
			rowEl.className = 'af-mxrow';
			for (let c = 0; c < cols; c++) {
				const inp = document.createElement('input');
				inp.type = 'text';
				inp.className = 'af-mx';
				inp.value = String(round4(initial[r*cols + c]));
				inp.addEventListener('input', () => {
					const v = parseCell(inp.value);
					const bad = !isFinite(v) || isNaN(v);
					inp.classList.toggle('bad', bad);
					if (!bad) onChange(v, r, c);
				});
				rowEl.appendChild(inp);
				inputs.push(inp);
			}
			host.appendChild(rowEl);
		}
		return {
			set:        m   => inputs.forEach((i,k) => i.value = String(round4(m[k]))),
			setStrings: arr => inputs.forEach((i,k) => k<arr.length && (i.value = arr[k])),
			values:     ()  => inputs.map(i => i.value)
		};
	};

	const buildPresets = (hostId, presets, onPick) => {
		const host = $(hostId); if (!host) return;
		host.innerHTML = '';
		presets.forEach(pr => {
			const b = document.createElement('button');
			b.type = 'button'; b.className = 'af-btn'; b.textContent = pr.name;
			b.addEventListener('click', () => { try { onPick(pr); } catch (e) { console.error(e); } });
			host.appendChild(b);
		});
	};

	// Batched RAF scheduler — coalesces hover/slider updates.
	const rafBatch = () => {
		let queued = false, tasks = [];
		return fn => {
			tasks.push(fn);
			if (queued) return;
			queued = true;
			requestAnimationFrame(() => {
				queued = false;
				const t = tasks; tasks = [];
				for (const f of t) { try { f(); } catch (e) { console.error(e); } }
			});
		};
	};
	const schedule = rafBatch();

	// Visibility guard — skip frame if the lab is off-screen or tab hidden.
	const isVisible = el => {
		if (document.hidden) return false;
		const r = el.getBoundingClientRect();
		return r.bottom > 0 && r.top < window.innerHeight;
	};

	/* ─── shared 3D navigation: wheel / pinch zoom, one-finger touch rotate ─── */
	const ZOOM_MIN = 0.35, ZOOM_MAX = 3;
	const setZoom = (state, z) => {
		state.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, isFinite(z) ? z : 1));
	};
	const bind3DNav = (cv, state, redraw) => {
		cv.addEventListener('wheel', e => {
			e.preventDefault();
			setZoom(state, state.zoom * Math.exp(-e.deltaY * 0.0012));
			schedule(redraw);
		}, { passive: false });
		let tState = null;
		const tdist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
		cv.addEventListener('touchstart', e => {
			if (e.touches.length === 1) tState = { mode: 'rot', x: e.touches[0].clientX, y: e.touches[0].clientY };
			else if (e.touches.length === 2) tState = { mode: 'pinch', d: tdist(e.touches), z: state.zoom };
			state.auto = false;
		}, { passive: true });
		cv.addEventListener('touchmove', e => {
			if (!tState) return;
			e.preventDefault();
			if (tState.mode === 'rot' && e.touches.length === 1) {
				state.yaw   += (e.touches[0].clientX - tState.x) * 0.01;
				state.pitch += (e.touches[0].clientY - tState.y) * 0.01;
				state.pitch = Math.max(-Math.PI/2 + 0.05, Math.min(Math.PI/2 - 0.05, state.pitch));
				tState.x = e.touches[0].clientX; tState.y = e.touches[0].clientY;
				schedule(redraw);
			} else if (tState.mode === 'pinch' && e.touches.length === 2) {
				setZoom(state, tState.z * tdist(e.touches) / Math.max(1, tState.d));
				schedule(redraw);
			}
		}, { passive: false });
		cv.addEventListener('touchend', () => { tState = null; });
	};

	/* ─── shared 3D axes: labeled x / y / z rays from a world origin ─── */
	const drawAxes3D = (ctx, project, P, origin, len) => {
		const spec = [
			[[1, 0, 0], P.bad,  'x'],
			[[0, 1, 0], P.good, 'y'],
			[[0, 0, 1], P.cyan, 'z']
		];
		ctx.save();
		ctx.lineWidth = 1.4;
		for (const [d, colour, label] of spec) {
			const o = project([origin[0], origin[1], origin[2]]);
			const e = project([origin[0] + d[0]*len, origin[1] + d[1]*len, origin[2] + d[2]*len]);
			if (!isFinite(o[0]) || !isFinite(e[0])) continue;
			ctx.strokeStyle = colour; ctx.globalAlpha = 0.7;
			ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
			ctx.globalAlpha = 1;
			ctx.fillStyle = colour; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'left';
			ctx.fillText(label, e[0] + 5, e[1] - 5);
		}
		ctx.restore();
	};

	/* ═══ 3. LAB 2D — affine warp of an 8×8 checkerboard ══════════════ */

	const D2 = {
		N: 8,
		win: -0.6, winEnd: 1.6,
		M: Mat.rot2(Math.PI / 6),
		track: [0.25, 0.75],
		bilinear: false,
		hover: null
	};

	const PRESETS_2D = [
		{ name: 'Identity',            m: () => new Float64Array([1,0,0, 0,1,0, 0,0,1]) },
		{ name: 'Rotate 30°',          m: () => Mat.rot2(Math.PI/6),
		  disp: ['cos(30°)','-sin(30°)','0','sin(30°)','cos(30°)','0','0','0','1'] },
		{ name: 'Rotate 90° @ center', m: () => new Float64Array([0,-1,1, 1,0,0, 0,0,1]) },
		{ name: 'Scale ×2',            m: () => new Float64Array([2,0,0, 0,2,0, 0,0,1]) },
		{ name: 'Shear',               m: () => new Float64Array([1,0.7,0, 0,1,0, 0,0,1]) },
		{ name: 'Translate',           m: () => new Float64Array([1,0,0.35, 0,1,-0.25, 0,0,1]) },
		{ name: 'Mirror x',            m: () => new Float64Array([-1,0,1, 0,1,0, 0,0,1]) },
		{ name: 'Projective',          m: () => new Float64Array([1,0,0, 0,1,0, 0.5,0,1]) }
	];

	const init2D = () => {
		const srcC = $('af2d-src'), outC = $('af2d-out');
		if (!srcC || !outC) return;
		const srcCtx = srcC.getContext('2d');
		const outCtx = outC.getContext('2d');
		if (!srcCtx || !outCtx) throw new Error('canvas 2D unavailable');

		const size = srcC.width;
		const span = D2.winEnd - D2.win;
		const px2w = px => D2.win + (px / size) * span;
		const py2w = py => D2.winEnd - (py / size) * span;
		const w2px = x => (x - D2.win) / span * size;
		const w2py = y => (D2.winEnd - y) / span * size;

		const drawGrid = (ctx, P) => {
			ctx.strokeStyle = P.line; ctx.lineWidth = 1;
			for (let t = 0; t <= 4; t++) {
				const wv = t * 0.5;
				ctx.globalAlpha = (wv === 0 || wv === 1) ? 0.9 : 0.35;
				ctx.beginPath();
				ctx.moveTo(w2px(wv), 0); ctx.lineTo(w2px(wv), size);
				ctx.moveTo(0, w2py(wv)); ctx.lineTo(size, w2py(wv));
				ctx.stroke();
			}
			ctx.globalAlpha = 1;
			ctx.fillStyle = P.ink2; ctx.font = '11px monospace'; ctx.textAlign = 'left';
			for (let t = 0; t <= 4; t++) {
				const wv = t * 0.5;
				ctx.fillText(String(wv), w2px(wv) + 3, w2py(0) + 14);
				ctx.fillText(String(wv), w2px(0) - 24, w2py(wv) - 3);
			}
		};

		const drawSource = () => {
			const P = pal();
			srcCtx.fillStyle = P.bg; srcCtx.fillRect(0, 0, size, size);
			drawGrid(srcCtx, P);
			const cell = size / span / D2.N;
			for (let j = 0; j < D2.N; j++)
				for (let i = 0; i < D2.N; i++) {
					srcCtx.fillStyle = rgb(((i+j)&1) ? P.c1 : P.c0);
					srcCtx.fillRect(w2px(i/D2.N), w2py((j+1)/D2.N), cell, cell);
				}
			srcCtx.strokeStyle = P.line;
			srcCtx.strokeRect(w2px(0), w2py(1), size/span, size/span);

			if (D2.hover && D2.hover.pin) {
				const [u, v] = D2.hover.pin;
				srcCtx.fillStyle = P.cyan;
				srcCtx.beginPath(); srcCtx.arc(w2px(u), w2py(v), 5, 0, Math.PI*2); srcCtx.fill();
				srcCtx.strokeStyle = P.cyan; srcCtx.lineWidth = 1.5;
				srcCtx.beginPath(); srcCtx.arc(w2px(u), w2py(v), 9, 0, Math.PI*2); srcCtx.stroke();
			}
			srcCtx.fillStyle = P.accent;
			srcCtx.beginPath(); srcCtx.arc(w2px(D2.track[0]), w2py(D2.track[1]), 6, 0, Math.PI*2); srcCtx.fill();
			srcCtx.strokeStyle = P.accent; srcCtx.lineWidth = 1.5;
			srcCtx.beginPath(); srcCtx.arc(w2px(D2.track[0]), w2py(D2.track[1]), 11, 0, Math.PI*2); srcCtx.stroke();
			srcCtx.font = 'bold 12px monospace'; srcCtx.textAlign = 'left';
			srcCtx.fillText('p', w2px(D2.track[0]) + 13, w2py(D2.track[1]) + 4);
		};

		// Forward-draw fallback when M is singular (no inverse).
		const drawForward = (ctx, P) => {
			for (let j = 0; j < D2.N; j++)
				for (let i = 0; i < D2.N; i++) {
					const val = (i+j) & 1;
					for (let a = 0; a < 4; a++)
						for (let b = 0; b < 4; b++) {
							const u0=(i+a/4)/D2.N, u1=(i+(a+1)/4)/D2.N;
							const v0=(j+b/4)/D2.N, v1=(j+(b+1)/4)/D2.N;
							const cs = [[u0,v0],[u1,v0],[u1,v1],[u0,v1]];
							const ps = []; let bad = false;
							for (const [x,y] of cs) {
								const w = apply3(D2.M, [x,y,1]);
								if (!isFinite(w[0]) || !isFinite(w[1]) || Math.abs(w[2]) < 1e-9) { bad=true; break; }
								ps.push([w2px(w[0]/w[2]), w2py(w[1]/w[2])]);
							}
							if (bad) continue;
							ctx.fillStyle = rgb(val ? P.c1 : P.c0);
							ctx.beginPath(); ctx.moveTo(ps[0][0], ps[0][1]);
							for (let k = 1; k < 4; k++) ctx.lineTo(ps[k][0], ps[k][1]);
							ctx.closePath(); ctx.fill();
						}
				}
		};

		// FAST: inverse warp with precomputed row-step.
		// For each output row we advance one source point per output pixel by adding Ainv column-0.
		const drawWarpFast = (Ainv, P) => {
			const img = outCtx.createImageData(size, size);
			const data = img.data;
			const [br, bg, bb] = P.bgRGB;
			const sampler = D2.bilinear ? cbBilinear : cbNearest;
			const [c0r,c0g,c0b] = P.c0, [c1r,c1g,c1b] = P.c1;

			// per-pixel step in source (u,v,w) when we move 1 output pixel in x/y
			const stepX_u = Ainv[0] * (span/size);
			const stepX_v = Ainv[3] * (span/size);
			const stepX_w = Ainv[6] * (span/size);
			const stepY_u = -Ainv[1] * (span/size);
			const stepY_v = -Ainv[4] * (span/size);
			const stepY_w = -Ainv[7] * (span/size);

			// start at pixel (0,0) → world (px2w(0), py2w(0))
			let rowU = Ainv[0]*px2w(0) + Ainv[1]*py2w(0) + Ainv[2];
			let rowV = Ainv[3]*px2w(0) + Ainv[4]*py2w(0) + Ainv[5];
			let rowW = Ainv[6]*px2w(0) + Ainv[7]*py2w(0) + Ainv[8];

			for (let py = 0, o = 0; py < size; py++) {
				let u = rowU, v = rowV, w = rowW;
				for (let px = 0; px < size; px++, o += 4) {
					if (Math.abs(w) < 1e-9) {
						data[o]=br; data[o+1]=bg; data[o+2]=bb; data[o+3]=255;
					} else {
						const val = sampler(u/w, v/w);
						if (val < 0) {
							data[o]=br; data[o+1]=bg; data[o+2]=bb;
						} else {
							data[o]   = c0r + (c1r-c0r)*val;
							data[o+1] = c0g + (c1g-c0g)*val;
							data[o+2] = c0b + (c1b-c0b)*val;
						}
						data[o+3] = 255;
					}
					u += stepX_u; v += stepX_v; w += stepX_w;
				}
				rowU += stepY_u; rowV += stepY_v; rowW += stepY_w;
			}
			outCtx.putImageData(img, 0, 0);
		};

		const drawOutput = () => {
			const P = pal();
			outCtx.fillStyle = P.bg; outCtx.fillRect(0, 0, size, size);
			const Ainv = inv3(D2.M);
			if (!Ainv) drawForward(outCtx, P);
			else drawWarpFast(Ainv, P);

			drawGrid(outCtx, P);
			const q = apply3(D2.M, [D2.track[0], D2.track[1], 1]);
			if (isFinite(q[0]) && Math.abs(q[2]) > 1e-9) {
				const x = q[0]/q[2], y = q[1]/q[2];
				outCtx.fillStyle = P.accent;
				outCtx.beginPath(); outCtx.arc(w2px(x), w2py(y), 6, 0, Math.PI*2); outCtx.fill();
				outCtx.strokeStyle = P.accent; outCtx.lineWidth = 1.5;
				outCtx.beginPath(); outCtx.arc(w2px(x), w2py(y), 11, 0, Math.PI*2); outCtx.stroke();
				outCtx.font = 'bold 12px monospace'; outCtx.textAlign = 'left';
				outCtx.fillText("p′", w2px(x)+13, w2py(y)+4);
			}
			if (D2.hover) {
				outCtx.strokeStyle = P.ink2; outCtx.globalAlpha = 0.6;
				outCtx.setLineDash([4,4]);
				outCtx.beginPath();
				outCtx.moveTo(w2px(D2.hover.wx), 0); outCtx.lineTo(w2px(D2.hover.wx), size);
				outCtx.moveTo(0, w2py(D2.hover.wy)); outCtx.lineTo(size, w2py(D2.hover.wy));
				outCtx.stroke();
				outCtx.setLineDash([]); outCtx.globalAlpha = 1;
			}
		};

		const updateEq = () => {
			const eq = $('af2d-eq');
			const d = editor?.values();
			const [x, y] = D2.track;
			const q = apply3(D2.M, [x, y, 1]);
			const dv = i => texify(d && d[i] !== '' ? d[i] : String(round4(D2.M[i])));
			const L = [
				`\\begin{bmatrix}x' \\\\ y' \\\\ w'\\end{bmatrix} &=` +
				`\\begin{bmatrix}${dv(0)} & ${dv(1)} & ${dv(2)} \\\\ ${dv(3)} & ${dv(4)} & ${dv(5)} \\\\ ${dv(6)} & ${dv(7)} & ${dv(8)}\\end{bmatrix}` +
				`\\begin{bmatrix}${fmt(x)} \\\\ ${fmt(y)} \\\\ 1\\end{bmatrix} \\\\`,
				`x' &= ${termLineTex(d, D2.M, 0, 3, [x, y])} = ${fmt(q[0])} \\\\`,
				`y' &= ${termLineTex(d, D2.M, 1, 3, [x, y])} = ${fmt(q[1])} \\\\`,
				`w' &= ${termLineTex(d, D2.M, 2, 3, [x, y])} = ${fmt(q[2])} \\\\`
			];
			if (Math.abs(q[2] - 1) > 1e-9) {
				L.push(`p' &= \\left(\\tfrac{x'}{w'},\\, \\tfrac{y'}{w'}\\right) = (${fmt(q[0]/q[2])},\\; ${fmt(q[1]/q[2])})`);
			} else {
				L.push(`p' &= (x',\\, y') = (${fmt(q[0])},\\; ${fmt(q[1])})`);
			}
			tex(eq, `\\begin{aligned}` + L.join(' ') + `\\end{aligned}`, true);
		};

		const updateStatus = () => {
			const st = $('af2d-status'); if (!st) return;
			st.innerHTML = '';
			const A = D2.M, det = det3(A);
			const affine = Math.abs(A[6])<1e-9 && Math.abs(A[7])<1e-9 && Math.abs(A[8]-1)<1e-9;
			const pill = (t, k) => {
				const s = document.createElement('span');
				s.className = 'af-pill' + (k ? ' ' + k : '');
				s.textContent = t;
				st.appendChild(s);
			};
			if (affine) {
				pill('area scale: × ' + fmt(Math.abs(det)), Math.abs(det)<1e-9 ? 'bad' : '');
				if (det < -1e-9) pill('det < 0 — mirror (orientation flipped)', 'warn');
			} else pill('last row ≠ [0, 0, 1] → projective', 'warn');
			if (Math.abs(det) < 1e-9) pill('singular: the image collapses', 'bad');
		};

		const redraw = () => {
			try {
				drawSource(); drawOutput();
				updateEq(); updateStatus();
			} catch (e) { showError('af-2d', e); }
		};

		const updateHover = () => {
			const ro = $('af2d-hover'); if (!ro) return;
			if (!D2.hover) {
				ro.textContent = 'Hover the warped image — each pixel is I(M⁻¹·q).';
				drawSource(); return;
			}
			const Ai = inv3(D2.M);
			if (!Ai) {
				ro.textContent = 'M is singular — no unique preimage.';
				D2.hover.pin = null;
			} else {
				const w = apply3(Ai, [D2.hover.wx, D2.hover.wy, 1]);
				if (Math.abs(w[2]) < 1e-9) {
					ro.textContent = 'w′ ≈ 0: this pixel maps to infinity.';
					D2.hover.pin = null;
				} else {
					const u = w[0]/w[2], v = w[1]/w[2];
					D2.hover.pin = [u,v];
					const val = cbNearest(u, v);
					ro.textContent = `q = (${fmt(D2.hover.wx)}, ${fmt(D2.hover.wy)}) → M⁻¹·q = (${fmt(u)}, ${fmt(v)}) → I = ${val<0 ? 'outside' : (val===0 ? '0 (black)' : '1 (white)')}`;
				}
			}
			drawSource();
		};

		const editor = buildMatrixEditor('af2d-mx', 3, 3, D2.M, (v, r, c) => {
			D2.M[r*3 + c] = v; redraw();
		});
		if (editor && PRESETS_2D[1].disp) editor.setStrings(PRESETS_2D[1].disp);
		buildPresets('af2d-presets', PRESETS_2D, pr => {
			D2.M = pr.m();
			if (editor) pr.disp ? editor.setStrings(pr.disp) : editor.set(D2.M);
			redraw();
		});
		const samp = $('af2d-samp');
		if (samp) samp.addEventListener('change', () => { D2.bilinear = samp.value === 'bilinear'; redraw(); });

		srcC.addEventListener('click', e => {
			const r = srcC.getBoundingClientRect();
			D2.track = [px2w((e.clientX-r.left)*(size/r.width)), py2w((e.clientY-r.top)*(size/r.height))];
			redraw();
		});
		outC.addEventListener('mousemove', e => {
			const r = outC.getBoundingClientRect();
			D2.hover = { wx: px2w((e.clientX-r.left)*(size/r.width)),
			             wy: py2w((e.clientY-r.top)*(size/r.height)) };
			schedule(updateHover);
		});
		outC.addEventListener('mouseleave', () => { D2.hover = null; updateHover(); });

		const h0 = $('af2d-hover');
		if (h0) h0.textContent = 'Hover the warped image — each pixel is I(M⁻¹·q).';
		themeRedraws.push(redraw);
		redraw();
	};

	/* ═══ 4. LAB 3D — affine warp of a checkerboard cube ══════════════ */

	const D3 = {
		M: (() => {
			const A = new Float64Array(16);
			for (let i = 0; i < 16; i++) A[i] = 0;
			A[0]=A[5]=A[10]=A[15]=1;
			return A;
		})(),
		yaw: 0.6, pitch: 0.35,
		auto: false, zoom: 1, drag: null, last: 0,
		K: 4,
		trackIdx: 6,
		quads: null
	};

	const PRESETS_3D = [
		{ name: 'Identity',       m: () => { const A=new Float64Array(16); A[0]=A[5]=A[10]=A[15]=1; return A; } },
		{ name: 'Rotate Y 45°',   m: () => Mat.rotY(Math.PI/4),
		  disp: ['cos(45°)','0','sin(45°)','0', '0','1','0','0', '-sin(45°)','0','cos(45°)','0', '0','0','0','1'] },
		{ name: 'Rotate X 30°',   m: () => Mat.rotX(Math.PI/6) },
		{ name: 'Rotate Z 60°',   m: () => Mat.rotZ(Math.PI/3) },
		{ name: 'Scale ×1.5',     m: () => { const A=new Float64Array(16); A[0]=A[5]=A[10]=1.5; A[15]=1; return A; } },
		{ name: 'Anisotropic',    m: () => { const A=new Float64Array(16); A[0]=1.5; A[5]=0.7; A[10]=1.2; A[15]=1; return A; } },
		{ name: 'Shear xz',       m: () => { const A=new Float64Array([1,0,0.6,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); return A; } },
		{ name: 'Translate',      m: () => { const A=new Float64Array([1,0,0,0.5, 0,1,0,-0.3, 0,0,1,0.2, 0,0,0,1]); return A; } },
		{ name: 'Mirror x',       m: () => { const A=new Float64Array(16); A[0]=-1; A[5]=A[10]=A[15]=1; A[3]=1; return A; } }
	];

	const init3D = () => {
		const cv = $('af3d-canvas'); if (!cv) return;
		const ctx = cv.getContext('2d');
		if (!ctx) throw new Error('canvas 2D unavailable');
		const W = cv.width, H = cv.height;

		D3.quads = buildCubeQuads(D3.K);
		const cubeCorners = [
			[0,0,0],[1,0,0],[1,1,0],[0,1,0],
			[0,0,1],[1,0,1],[1,1,1],[0,1,1]
		];
		const cubeEdges = [
			[0,1],[1,2],[2,3],[3,0],
			[4,5],[5,6],[6,7],[7,4],
			[0,4],[1,5],[2,6],[3,7]
		];

		// Camera projection: yaw around Y, pitch around X, orthographic + perspective divide.
		const project = p => {
			const cx = 0.5, cy = 0.5, cz = 0.5;
			let x = p[0]-cx, y = p[1]-cy, z = p[2]-cz;
			const cy1 = Math.cos(D3.yaw), sy1 = Math.sin(D3.yaw);
			const x1 = cy1*x + sy1*z, z1 = -sy1*x + cy1*z;
			const cx1 = Math.cos(D3.pitch), sx1 = Math.sin(D3.pitch);
			const y2 = cx1*y - sx1*z1, z2 = sx1*y + cx1*z1;
			const dist = 4, f = dist / (dist - z2);
			const scale = Math.min(W, H) * 0.28 * D3.zoom;
			return [ W*0.5 + x1*scale*f, H*0.5 - y2*scale*f, z2 ];
		};

		const drawQuad = (pts, val, alpha) => {
			const P = pal();
			const projs = pts.map(project);
			const zAvg = (projs[0][2]+projs[1][2]+projs[2][2]+projs[3][2]) * 0.25;
			return { projs, zAvg, val, alpha };
		};

		const drawEdges = (M, style, dashed) => {
			const P = pal();
			ctx.strokeStyle = style;
			ctx.lineWidth = 1.2;
			ctx.setLineDash(dashed ? [4, 4] : []);
			for (const [a, b] of cubeEdges) {
				const pa = apply4(M, [...cubeCorners[a], 1]);
				const pb = apply4(M, [...cubeCorners[b], 1]);
				if (!isFinite(pa[0]) || !isFinite(pb[0])) continue;
				const ea = project(pa), eb = project(pb);
				ctx.beginPath();
				ctx.moveTo(ea[0], ea[1]); ctx.lineTo(eb[0], eb[1]);
				ctx.stroke();
			}
			ctx.setLineDash([]);
		};

		const drawCorners = M => {
			const P = pal();
			for (let i = 0; i < 8; i++) {
				const p = apply4(M, [...cubeCorners[i], 1]);
				if (!isFinite(p[0])) continue;
				const s = project(p);
				const isTrack = i === D3.trackIdx;
				ctx.fillStyle = isTrack ? P.accent : P.ink2;
				ctx.beginPath();
				ctx.arc(s[0], s[1], isTrack ? 5 : 3, 0, Math.PI*2);
				ctx.fill();
			}
		};

		const draw = () => {
			const P = pal();
			ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);

			drawAxes3D(ctx, project, P, [0, 0, 0], 1.35);

			// ghost cube (identity)
			drawEdges(new Float64Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),
			          P.ghost, true);

			// warped quads (painters algorithm)
			const drawn = [];
			for (const q of D3.quads) {
				const pts = q.pts.map(p => apply4(D3.M, [...p, 1]));
				if (pts.some(p => !isFinite(p[0]))) continue;
				drawn.push(drawQuad(pts, q.val, 1));
			}
			drawn.sort((a, b) => a.zAvg - b.zAvg);
			for (const q of drawn) {
				ctx.fillStyle = rgb(q.val ? P.c1 : P.c0);
				ctx.strokeStyle = P.line;
				ctx.lineWidth = 0.6;
				ctx.beginPath();
				ctx.moveTo(q.projs[0][0], q.projs[0][1]);
				for (let k = 1; k < 4; k++) ctx.lineTo(q.projs[k][0], q.projs[k][1]);
				ctx.closePath();
				ctx.fill(); ctx.stroke();
			}
			drawEdges(D3.M, P.accent, false);
			drawCorners(D3.M);

			// tracked-corner trail
			const p0 = cubeCorners[D3.trackIdx];
			const p1 = apply4(D3.M, [...p0, 1]);
			if (isFinite(p1[0])) {
				const a = project(p0), b = project(p1);
				ctx.strokeStyle = P.accent; ctx.setLineDash([3, 4]); ctx.lineWidth = 1.2;
				ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
				ctx.setLineDash([]);
				ctx.fillStyle = P.accent;
				ctx.font = 'bold 12px monospace';
				ctx.fillText('p', a[0]+8, a[1]-6);
				ctx.fillText("p′", b[0]+8, b[1]-6);
			}
		};

		const updateEq = () => {
			const eq = $('af3d-eq');
			const d = editor?.values();
			const p = cubeCorners[D3.trackIdx];
			const q = apply4(D3.M, [...p, 1]);
			const dv = i => texify(d && d[i] !== '' ? d[i] : String(round4(D3.M[i])));
			const M4 = `\\begin{bmatrix}` +
				`${dv(0)} & ${dv(1)} & ${dv(2)} & ${dv(3)} \\\\ ` +
				`${dv(4)} & ${dv(5)} & ${dv(6)} & ${dv(7)} \\\\ ` +
				`${dv(8)} & ${dv(9)} & ${dv(10)} & ${dv(11)} \\\\ ` +
				`${dv(12)} & ${dv(13)} & ${dv(14)} & ${dv(15)}` +
				`\\end{bmatrix}`;
			const pv = `\\begin{bmatrix}${fmt(p[0])} \\\\ ${fmt(p[1])} \\\\ ${fmt(p[2])} \\\\ 1\\end{bmatrix}`;
			const L = [
				`\\begin{bmatrix}x' \\\\ y' \\\\ z' \\\\ w'\\end{bmatrix} &= ${M4}${pv} \\\\`,
				`x' &= ${termLineTex(d, D3.M, 0, 4, p)} = ${fmt(q[0])} \\\\`,
				`y' &= ${termLineTex(d, D3.M, 1, 4, p)} = ${fmt(q[1])} \\\\`,
				`z' &= ${termLineTex(d, D3.M, 2, 4, p)} = ${fmt(q[2])} \\\\`,
				`w' &= ${termLineTex(d, D3.M, 3, 4, p)} = ${fmt(q[3])} \\\\`
			];
			if (Math.abs(q[3] - 1) > 1e-9) {
				L.push(`p' &= \\left(\\tfrac{x'}{w'},\\, \\tfrac{y'}{w'},\\, \\tfrac{z'}{w'}\\right) = (${fmt(q[0]/q[3])},\\; ${fmt(q[1]/q[3])},\\; ${fmt(q[2]/q[3])})`);
			} else {
				L.push(`p' &= (x',\\, y',\\, z') = (${fmt(q[0])},\\; ${fmt(q[1])},\\; ${fmt(q[2])})`);
			}
			tex(eq, `\\begin{aligned}` + L.join(' ') + `\\end{aligned}`, true);
		};

		const updateStatus = () => {
			const st = $('af3d-status'); if (!st) return;
			st.innerHTML = '';
			const det = det4(D3.M);
			const A = D3.M;
			const affine = Math.abs(A[12])<1e-9 && Math.abs(A[13])<1e-9 && Math.abs(A[14])<1e-9 && Math.abs(A[15]-1)<1e-9;
			const pill = (t, k) => {
				const s = document.createElement('span');
				s.className = 'af-pill' + (k ? ' ' + k : '');
				s.textContent = t;
				st.appendChild(s);
			};
			if (affine) {
				pill('volume scale: × ' + fmt(Math.abs(det)), Math.abs(det)<1e-9 ? 'bad' : '');
				if (det < -1e-9) pill('det < 0 — mirror (orientation flipped)', 'warn');
			} else pill('last row ≠ [0,0,0,1] → projective', 'warn');
			if (Math.abs(det) < 1e-9) pill('singular: the cube collapses', 'bad');
		};

		const redraw = () => {
			try {
				draw(); updateEq(); updateStatus();
			} catch (e) { showError('af-3d', e); }
		};

		const editor = buildMatrixEditor('af3d-mx', 4, 4, D3.M, (v, r, c) => {
			D3.M[r*4 + c] = v; redraw();
		});
		buildPresets('af3d-presets', PRESETS_3D, pr => {
			D3.M = pr.m();
			if (editor) pr.disp ? editor.setStrings(pr.disp) : editor.set(D3.M);
			redraw();
		});
		const autoCb = $('af3d-auto');
		if (autoCb) autoCb.addEventListener('change', () => { D3.auto = autoCb.checked; });
		bind3DNav(cv, D3, redraw);

		cv.addEventListener('mousedown', e => {
			D3.drag = { x: e.clientX, y: e.clientY };
			D3.auto = false; if (autoCb) autoCb.checked = false;
		});
		window.addEventListener('mousemove', e => {
			if (!D3.drag) return;
			D3.yaw   += (e.clientX - D3.drag.x) * 0.01;
			D3.pitch += (e.clientY - D3.drag.y) * 0.01;
			D3.pitch = Math.max(-Math.PI/2 + 0.05, Math.min(Math.PI/2 - 0.05, D3.pitch));
			D3.drag = { x: e.clientX, y: e.clientY };
			schedule(redraw);
		});
		window.addEventListener('mouseup', () => { D3.drag = null; });

		// click a corner to track it
		cv.addEventListener('click', e => {
			if (D3.drag) return;
			const r = cv.getBoundingClientRect();
			const mx = (e.clientX - r.left) * (W / r.width);
			const my = (e.clientY - r.top) * (H / r.height);
			let best = -1, bd = 20;
			for (let i = 0; i < 8; i++) {
				const p = apply4(D3.M, [...cubeCorners[i], 1]);
				if (!isFinite(p[0])) continue;
				const s = project(p);
				const d = Math.hypot(s[0]-mx, s[1]-my);
				if (d < bd) { bd = d; best = i; }
			}
			if (best >= 0) { D3.trackIdx = best; redraw(); }
		});

		const loop = t => {
			if (D3.auto && isVisible(cv) && t - D3.last > 16) {
				D3.yaw += 0.006; D3.last = t; redraw();
			}
			requestAnimationFrame(loop);
		};
		requestAnimationFrame(loop);

		themeRedraws.push(redraw);
		redraw();
	};

	/* ═══ 5. LAB F2 — the fold ════════════════════════════════════════ */

	const F2 = {
		theta: 0, c: 0.5, lambda: 1.5,
		track: [0.25, 0.75],
		hover: null, hoverSrc: null,
		yaw: 0.7, pitch: 0.4, auto: false, zoom: 1, drag: null, last: 0
	};

	const PRESETS_F2 = [
		{ name: 'Identity (λ=0)',        theta:0,       c:0.5,  lambda:0.0 },
		{ name: 'Gentle bend (λ=0.5)',   theta:0,       c:0.5,  lambda:0.5 },
		{ name: 'Flatten (λ=1)',         theta:0,       c:0.5,  lambda:1.0 },
		{ name: 'Paper fold (λ=2)',      theta:0,       c:0.5,  lambda:2.0 },
		{ name: 'Overshoot (λ=2.5)',     theta:0,       c:0.5,  lambda:2.5 },
		{ name: 'Diagonal crease',       theta:45,      c:0.7,  lambda:2.0 },
		{ name: 'Vertical crease',       theta:90,      c:0.5,  lambda:2.0 }
	];

	const initF2 = () => {
		const src = $('fd2d-src');
		if (!src) return;
		const srcCtx = src.getContext('2d');
		if (!srcCtx) throw new Error('canvas 2D unavailable');

		const size = src.width;
		const win = -0.6, span = 2.2;
		const w2px = x => (x - win) / span * size;
		const w2py = y => (win + span - y) / span * size;
		const px2w = px => win + (px / size) * span;
		const py2w = py => win + span - (py / size) * span;

		const drawGrid = (ctx, P) => {
			ctx.strokeStyle = P.line; ctx.lineWidth = 1;
			for (let t = 0; t <= 4; t++) {
				const wv = t * 0.5;
				ctx.globalAlpha = (wv === 0 || wv === 1) ? 0.9 : 0.35;
				ctx.beginPath();
				ctx.moveTo(w2px(wv), 0); ctx.lineTo(w2px(wv), size);
				ctx.moveTo(0, w2py(wv)); ctx.lineTo(size, w2py(wv));
				ctx.stroke();
			}
			ctx.globalAlpha = 1;
		};

		const drawCrease = (ctx, P) => {
			const n = Fold.normal2(F2.theta * Math.PI / 180);
			// crease: n · p = c, drawn as a line across [win, win+span]²
			// Parametrise perpendicular to n.
			const t = [-n[1], n[0]];
			const p0 = [n[0]*F2.c, n[1]*F2.c];
			const L = 5;
			const a = [p0[0] - L*t[0], p0[1] - L*t[1]];
			const b = [p0[0] + L*t[0], p0[1] + L*t[1]];
			ctx.strokeStyle = P.cyan; ctx.lineWidth = 2; ctx.setLineDash([6,3]);
			ctx.beginPath();
			ctx.moveTo(w2px(a[0]), w2py(a[1])); ctx.lineTo(w2px(b[0]), w2py(b[1]));
			ctx.stroke();
			ctx.setLineDash([]);
		};

		const drawSource = () => {
			const P = pal();
			srcCtx.fillStyle = P.bg; srcCtx.fillRect(0, 0, size, size);
			drawGrid(srcCtx, P);
			const N = 8, cell = size/span/N;
			const n = Fold.normal2(F2.theta * Math.PI / 180);
			for (let j = 0; j < N; j++)
				for (let i = 0; i < N; i++) {
					const cx = (i+0.5)/N, cy = (j+0.5)/N;
					const d = n[0]*cx + n[1]*cy - F2.c;
					const isFar = d > 0;
					srcCtx.fillStyle = rgb(((i+j)&1) ? P.c1 : P.c0);
					srcCtx.globalAlpha = isFar ? 0.55 : 1;
					srcCtx.fillRect(w2px(i/N), w2py((j+1)/N), cell, cell);
				}
			srcCtx.globalAlpha = 1;
			srcCtx.strokeStyle = P.line;
			srcCtx.strokeRect(w2px(0), w2py(1), size/span, size/span);
			drawCrease(srcCtx, P);

			// hover preimages (from the 3-D paper hover)
			if (F2.hover && F2.hover.preims) {
				for (const pr of F2.hover.preims) {
					srcCtx.fillStyle = pr.piece === 1 ? P.cyan : P.warn;
					srcCtx.beginPath();
					srcCtx.arc(w2px(pr.p[0]), w2py(pr.p[1]), 5, 0, Math.PI*2);
					srcCtx.fill();
				}
			}
			// source-side hover crosshair + dot
			if (F2.hoverSrc) {
				srcCtx.strokeStyle = P.warn; srcCtx.globalAlpha = 0.6; srcCtx.setLineDash([4,4]);
				srcCtx.beginPath();
				srcCtx.moveTo(w2px(F2.hoverSrc[0]), 0); srcCtx.lineTo(w2px(F2.hoverSrc[0]), size);
				srcCtx.moveTo(0, w2py(F2.hoverSrc[1])); srcCtx.lineTo(size, w2py(F2.hoverSrc[1]));
				srcCtx.stroke();
				srcCtx.setLineDash([]); srcCtx.globalAlpha = 1;
				srcCtx.fillStyle = P.warn;
				srcCtx.beginPath();
				srcCtx.arc(w2px(F2.hoverSrc[0]), w2py(F2.hoverSrc[1]), 5, 0, Math.PI*2);
				srcCtx.fill();
			}
			// tracked point
			srcCtx.fillStyle = P.accent;
			srcCtx.beginPath();
			srcCtx.arc(w2px(F2.track[0]), w2py(F2.track[1]), 6, 0, Math.PI*2);
			srcCtx.fill();
			srcCtx.font = 'bold 12px monospace';
			srcCtx.fillText('p', w2px(F2.track[0])+9, w2py(F2.track[1])+4);

			// test line: horizontal, y=0.5
			srcCtx.strokeStyle = P.accent; srcCtx.globalAlpha = 0.4; srcCtx.lineWidth = 1.5;
			srcCtx.beginPath();
			srcCtx.moveTo(w2px(0), w2py(0.5)); srcCtx.lineTo(w2px(1), w2py(0.5));
			srcCtx.stroke();
			srcCtx.globalAlpha = 1;
		};

		/* ─── 3D bent-paper view ─── */
		const fd3d = $('fd3d-canvas');
		const fd3dCtx = fd3d?.getContext('2d');
		const W3 = fd3d ? fd3d.width : 0, H3 = fd3d ? fd3d.height : 0;

		const project3 = (p, yaw, pitch) => {
			// centre at (0.5, 0.5, 0)
			let x = p[0]-0.5, y = p[1]-0.5, z = p[2];
			const cy = Math.cos(yaw), sy = Math.sin(yaw);
			const x1 = cy*x + sy*z, z1 = -sy*x + cy*z;
			const cx = Math.cos(pitch), sx = Math.sin(pitch);
			const y2 = cx*y - sx*z1, z2 = sx*y + cx*z1;
			const dist = 4, f = dist / (dist - z2);
			const scale = Math.min(W3 * 0.42, H3 * 0.8) * F2.zoom;
			return [W3*0.5 + x1*scale*f, H3*0.5 - y2*scale*f, z2];
		};

		// Map a source point (u,v) to its 3-D position on the bent paper.
		const bend3d = (u, v) => {
			const n = Fold.normal2(F2.theta * Math.PI / 180);
			const d = n[0]*u + n[1]*v - F2.c;
			if (d <= 0) return [u, v, 0];
			const phi = Math.acos(Math.max(-1, Math.min(1, 1 - F2.lambda)));
			const cp = Math.cos(phi);
			return [u - d*n[0]*(1 - cp), v - d*n[1]*(1 - cp), d * Math.sin(phi)];
		};
		// Affine extension of the far half (no near/far branch) — spans the far patch plane.
		const farBend = (u, v) => {
			const n = Fold.normal2(F2.theta * Math.PI / 180);
			const d = n[0]*u + n[1]*v - F2.c;
			const phi = Math.acos(Math.max(-1, Math.min(1, 1 - F2.lambda)));
			const cp = Math.cos(phi);
			return [u - d*n[0]*(1 - cp), v - d*n[1]*(1 - cp), d * Math.sin(phi)];
		};
		// Raycast a screen point (mx,my) on the 3-D canvas onto the bent paper.
		// Returns { P:[x,y,z] world, uv:[u,v] source, t } or null.
		const raycastPaper = (mx, my) => {
			const n = Fold.normal2(F2.theta * Math.PI / 180);
			const cy = Math.cos(F2.yaw), sy = Math.sin(F2.yaw);
			const cx = Math.cos(F2.pitch), sx = Math.sin(F2.pitch);
			const dist = 4;
			const scale = Math.min(W3 * 0.42, H3 * 0.8) * F2.zoom;
			const X = (mx - W3*0.5) / scale, Y = (H3*0.5 - my) / scale;
			// camera-frame ray R(t) = (t·X, t·Y, dist·(1−t)); t=0 camera, t=1 image plane
			const camToWorld = (t) => {
				const x1 = t*X, y2 = t*Y, z2 = dist*(1 - t);
				const y = cx*y2 + sx*z2;
				const z1 = -sx*y2 + cx*z2;
				return [cy*x1 - sy*z1 + 0.5, y + 0.5, sy*x1 + cy*z1];
			};
			let hit = null;
			// near patch: flat plane z=0, domain [0,1]² with n·p ≤ c
			const Az = sy*X - cy*sx*Y, Bz = cy*cx*dist;      // z(t) = (Az−Bz)·t + Bz
			const tN = Bz / (Bz - Az);
			if (isFinite(tN) && tN > 0) {
				const w = camToWorld(tN), u = w[0], v = w[1];
				if (u >= -1e-6 && u <= 1+1e-6 && v >= -1e-6 && v <= 1+1e-6 && n[0]*u + n[1]*v - F2.c <= 1e-9)
					hit = { P: [u, v, 0], uv: [u, v], t: tN };
			}
			// far patch: affine image of the far half (plane spanned by farBend)
			const O = farBend(0,0), E1 = farBend(1,0), E2 = farBend(0,1);
			const C1 = [E1[0]-O[0], E1[1]-O[1], E1[2]-O[2]];
			const C2 = [E2[0]-O[0], E2[1]-O[1], E2[2]-O[2]];
			const Nr = [C1[1]*C2[2]-C1[2]*C2[1], C1[2]*C2[0]-C1[0]*C2[2], C1[0]*C2[1]-C1[1]*C2[0]];
			const W0 = camToWorld(0), W1 = camToWorld(1);
			const dir = [W1[0]-W0[0], W1[1]-W0[1], W1[2]-W0[2]];
			const denom = Nr[0]*dir[0] + Nr[1]*dir[1] + Nr[2]*dir[2];
			if (Math.abs(denom) > 1e-9) {
				const tF = (Nr[0]*O[0]+Nr[1]*O[1]+Nr[2]*O[2] - (Nr[0]*W0[0]+Nr[1]*W0[1]+Nr[2]*W0[2])) / denom;
				if (isFinite(tF) && tF > 0) {
					const W = [W0[0]+tF*dir[0], W0[1]+tF*dir[1], W0[2]+tF*dir[2]];
					const pairs = [[0,1],[0,2],[1,2]];
					let bi = 0, bj = 1, bd = 1e-12;
					for (const [i,j] of pairs) {
						const det = C1[i]*C2[j] - C1[j]*C2[i];
						if (Math.abs(det) > bd) { bd = Math.abs(det); bi = i; bj = j; }
					}
					const det = C1[bi]*C2[bj] - C1[bj]*C2[bi];
					const q1 = W[bi]-O[bi], q2 = W[bj]-O[bj];
					const u = (q1*C2[bj] - q2*C2[bi]) / det;
					const v = (C1[bi]*q2 - C1[bj]*q1) / det;
					if (u >= -1e-6 && u <= 1+1e-6 && v >= -1e-6 && v <= 1+1e-6 && n[0]*u + n[1]*v - F2.c >= -1e-9) {
						if (!hit || tF < hit.t) hit = { P: W, uv: [u, v], t: tF };
					}
				}
			}
			return hit;
		};

		const draw3D = () => {
			if (!fd3dCtx) return;
			const P = pal();
			fd3dCtx.fillStyle = P.bg; fd3dCtx.fillRect(0, 0, W3, H3);
			const n = Fold.normal2(F2.theta * Math.PI / 180);
			const phi = Math.acos(Math.max(-1, Math.min(1, 1 - F2.lambda)));
			const proj = p => project3(p, F2.yaw, F2.pitch);

			drawAxes3D(fd3dCtx, proj, P, [0, 0, 0], 1.25);

			// Flat shadow: the orthogonal projection of the bent paper onto z=0
			// is exactly the 2-D fold image above — draw its outline as a ghost.
			fd3dCtx.strokeStyle = P.ghost; fd3dCtx.lineWidth = 1; fd3dCtx.setLineDash([4,4]);
			fd3dCtx.beginPath();
			const NB = 64;
			for (let k = 0; k <= NB; k++) {
				const t = k / NB * 4, s = t % 1;
				const b = t < 1 ? [s, 0] : t < 2 ? [1, s] : t < 3 ? [1 - s, 1] : [0, 1 - s];
				const f2 = Fold.apply2(b, n, F2.c, F2.lambda);
				const q = proj([f2[0], f2[1], 0]);
				k ? fd3dCtx.lineTo(q[0], q[1]) : fd3dCtx.moveTo(q[0], q[1]);
			}
			fd3dCtx.stroke();
			fd3dCtx.setLineDash([]);
			const N = 8, S = 4;
			const quads = [];
			for (let j = 0; j < N; j++)
				for (let i = 0; i < N; i++) {
					const val = (i+j) & 1;
					for (let b = 0; b < S; b++)
						for (let a = 0; a < S; a++) {
							const u0=(i+a/S)/N, u1=(i+(a+1)/S)/N;
							const v0=(j+b/S)/N, v1=(j+(b+1)/S)/N;
							const cs = [[u0,v0],[u1,v0],[u1,v1],[u0,v1]];
							const ps = cs.map(([u, v]) => bend3d(u, v)).map(p => project3(p, F2.yaw, F2.pitch));
							const zAvg = (ps[0][2]+ps[1][2]+ps[2][2]+ps[3][2])*0.25;
							quads.push({ps, val, zAvg});
						}
				}
			quads.sort((a,b) => a.zAvg - b.zAvg);
			for (const q of quads) {
				fd3dCtx.fillStyle = rgb(q.val ? P.c1 : P.c0);
				fd3dCtx.strokeStyle = P.line; fd3dCtx.lineWidth = 0.6;
				fd3dCtx.beginPath();
				fd3dCtx.moveTo(q.ps[0][0], q.ps[0][1]);
				for (let k = 1; k < 4; k++) fd3dCtx.lineTo(q.ps[k][0], q.ps[k][1]);
				fd3dCtx.closePath(); fd3dCtx.fill(); fd3dCtx.stroke();
			}
			// crease line in 3D (z=0)
			const t = [-n[1], n[0]];
			const p0 = [n[0]*F2.c, n[1]*F2.c];
			const a = project3([p0[0]-t[0]*3, p0[1]-t[1]*3, 0], F2.yaw, F2.pitch);
			const b = project3([p0[0]+t[0]*3, p0[1]+t[1]*3, 0], F2.yaw, F2.pitch);
			fd3dCtx.strokeStyle = P.cyan; fd3dCtx.lineWidth = 2; fd3dCtx.setLineDash([6,3]);
			fd3dCtx.beginPath(); fd3dCtx.moveTo(a[0], a[1]); fd3dCtx.lineTo(b[0], b[1]); fd3dCtx.stroke();
			fd3dCtx.setLineDash([]);

			// test line (source y=0.5) drawn on the bent paper
			fd3dCtx.strokeStyle = P.accent; fd3dCtx.lineWidth = 2; fd3dCtx.globalAlpha = 0.75;
			fd3dCtx.beginPath();
			const NT = 80;
			for (let k = 0; k <= NT; k++) {
				const bp = bend3d(k/NT, 0.5);
				const cp3 = project3(bp, F2.yaw, F2.pitch);
				k ? fd3dCtx.lineTo(cp3[0], cp3[1]) : fd3dCtx.moveTo(cp3[0], cp3[1]);
			}
			fd3dCtx.stroke();
			fd3dCtx.globalAlpha = 1;

			// tracked point p on the paper + its image f(p) (flat shadow)
			const tp = bend3d(F2.track[0], F2.track[1]);
			const tcp = project3(tp, F2.yaw, F2.pitch);
			fd3dCtx.fillStyle = P.accent;
			fd3dCtx.beginPath(); fd3dCtx.arc(tcp[0], tcp[1], 6, 0, Math.PI*2); fd3dCtx.fill();
			fd3dCtx.font = 'bold 12px monospace';
			fd3dCtx.fillText('p', tcp[0]+9, tcp[1]+4);
			const fp = Fold.apply2(F2.track, n, F2.c, F2.lambda);
			const fpc = project3([fp[0], fp[1], 0], F2.yaw, F2.pitch);
			fd3dCtx.fillStyle = P.warn;
			fd3dCtx.beginPath(); fd3dCtx.arc(fpc[0], fpc[1], 5, 0, Math.PI*2); fd3dCtx.fill();
			fd3dCtx.fillText('f(p)', fpc[0]+9, fpc[1]+4);

			// 3-D hover cursor (on the paper)
			if (F2.hover && F2.hover.P) {
				const hp = project3(F2.hover.P, F2.yaw, F2.pitch);
				fd3dCtx.fillStyle = P.ink;
				fd3dCtx.beginPath(); fd3dCtx.arc(hp[0], hp[1], 6, 0, Math.PI*2); fd3dCtx.fill();
				fd3dCtx.strokeStyle = P.bg; fd3dCtx.lineWidth = 1.5;
				fd3dCtx.beginPath(); fd3dCtx.arc(hp[0], hp[1], 6, 0, Math.PI*2); fd3dCtx.stroke();
			}
			// source-side hover: where that source point lands on the paper
			if (F2.hoverSrc) {
				const sp = bend3d(F2.hoverSrc[0], F2.hoverSrc[1]);
				const spc = project3(sp, F2.yaw, F2.pitch);
				fd3dCtx.fillStyle = P.warn;
				fd3dCtx.beginPath(); fd3dCtx.arc(spc[0], spc[1], 6, 0, Math.PI*2); fd3dCtx.fill();
				fd3dCtx.strokeStyle = P.bg; fd3dCtx.lineWidth = 1.5;
				fd3dCtx.beginPath(); fd3dCtx.arc(spc[0], spc[1], 6, 0, Math.PI*2); fd3dCtx.stroke();
			}
			// φ label
			fd3dCtx.fillStyle = P.ink2; fd3dCtx.font = '12px monospace';
			fd3dCtx.fillText('φ = arccos(1−λ) = ' + fmt(phi*180/Math.PI) + '°', 12, H3-12);
		};

		/* ─── 1D fold view ─── */
		const fd1d = $('fd1d-canvas');
		const fd1dCtx = fd1d?.getContext('2d');
		const draw1D = () => {
			if (!fd1dCtx) return;
			const P = pal();
			const W1 = fd1d.width, H1 = fd1d.height;
			fd1dCtx.fillStyle = P.bg; fd1dCtx.fillRect(0, 0, W1, H1);
			const win = -1.5, span = 3.5;
			const x2px = x => (x - win)/span * W1;
			const y2py = y => H1*0.5 - (y - 0)/span * W1;
			// axes
			fd1dCtx.strokeStyle = P.line; fd1dCtx.lineWidth = 1;
			fd1dCtx.beginPath();
			fd1dCtx.moveTo(0, y2py(0)); fd1dCtx.lineTo(W1, y2py(0));
			fd1dCtx.moveTo(x2px(0), 0); fd1dCtx.lineTo(x2px(0), H1);
			fd1dCtx.stroke();
			// identity dashed
			fd1dCtx.strokeStyle = P.ink2; fd1dCtx.setLineDash([3,3]); fd1dCtx.lineWidth = 1;
			fd1dCtx.beginPath();
			fd1dCtx.moveTo(x2px(-1.5), y2py(-1.5));
			fd1dCtx.lineTo(x2px(2), y2py(2));
			fd1dCtx.stroke();
			fd1dCtx.setLineDash([]);
			// fold curve (c₁=0.5 for illustration)
			const c1 = 0.5;
			fd1dCtx.strokeStyle = P.accent; fd1dCtx.lineWidth = 2;
			fd1dCtx.beginPath();
			for (let k = 0; k <= 200; k++) {
				const x = -1.5 + k * 3.5/200;
				const relu = Math.max(0, x - c1);
				const y = x - F2.lambda * relu;
				const px = x2px(x), py = y2py(y);
				k ? fd1dCtx.lineTo(px, py) : fd1dCtx.moveTo(px, py);
			}
			fd1dCtx.stroke();
			fd1dCtx.fillStyle = P.ink2; fd1dCtx.font = '10px monospace';
			fd1dCtx.fillText('c₁=' + c1, x2px(c1)+4, H1-6);
		};

		/* ─── live equation (full step-by-step, right-clickable) ─── */
		const updateEq = () => {
			const eq = $('fd2d-eq');
			const n = Fold.normal2(F2.theta * Math.PI/180);
			const p = F2.track;
			const d = n[0]*p[0] + n[1]*p[1] - F2.c;
			const far = d > 0;
			const fp = Fold.apply2(p, n, F2.c, F2.lambda);
			const dotRow = termLineTex(null, new Float64Array([n[0], n[1], -F2.c]), 0, 3, [p[0], p[1]]);
			const L = [
				`f(\\mathbf{p}) &= \\mathbf{p} - \\lambda\\, \\mathrm{ReLU}(\\hat{\\mathbf{n}} \\cdot \\mathbf{p} - c)\\, \\hat{\\mathbf{n}} \\\\`,
				`\\hat{\\mathbf{n}} &= (\\cos\\theta,\\, \\sin\\theta) = (${fmt(n[0])},\\; ${fmt(n[1])}) \\qquad c = ${fmt(F2.c)} \\qquad \\lambda = ${fmt(F2.lambda)} \\\\`,
				`\\hat{\\mathbf{n}} \\cdot \\mathbf{p} - c &= ${dotRow} = ${fmt(d)} \\;\\Rightarrow\\; ${far ? '\\text{far side (push)}' : '\\text{near side (identity)}'} \\\\`
			];
			if (far) {
				const term = k => {
					const t = F2.lambda * d * n[k];
					return `${t > 0 ? '-' : '+'} ${fmt(F2.lambda)}\\cdot ${fmt(d)}\\cdot ${fmt(Math.abs(n[k]))}`;
				};
				L.push(`f(\\mathbf{p}) &= \\left(${fmt(p[0])} ${term(0)},\\; ${fmt(p[1])} ${term(1)}\\right) = (${fmt(fp[0])},\\; ${fmt(fp[1])})`);
			} else {
				L.push(`f(\\mathbf{p}) &= \\mathbf{p} = (${fmt(p[0])},\\; ${fmt(p[1])})`);
			}
			tex(eq, `\\begin{aligned}` + L.join(' ') + `\\end{aligned}`, true);
		};

		// The two affine pieces, as symbolic matrices (static — no slider values).
		tex($('fd2d-m1'), `\\begin{bmatrix}1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1\\end{bmatrix}`, true);
		tex($('fd2d-m2'),
			`\\begin{bmatrix}` +
			`1-\\lambda\\cos^{2}\\theta & -\\lambda\\sin\\theta\\cos\\theta & \\lambda c\\cos\\theta \\\\ ` +
			`-\\lambda\\sin\\theta\\cos\\theta & 1-\\lambda\\sin^{2}\\theta & \\lambda c\\sin\\theta \\\\ ` +
			`0 & 0 & 1` +
			`\\end{bmatrix}`, true);

		const updateHover = () => {
			const ro = $('fd2d-hover'); if (!ro) return;
			const n = Fold.normal2(F2.theta * Math.PI/180);
			if (F2.hover && F2.hover.preims) {
				const preims = F2.hover.preims;
				ro.textContent = preims.length === 0
					? `q = (${fmt(F2.hover.wx)}, ${fmt(F2.hover.wy)}) — outside image (0 preimages)`
					: preims.length === 1
						? `q = (${fmt(F2.hover.wx)}, ${fmt(F2.hover.wy)}) → 1 preimage at (${fmt(preims[0].p[0])}, ${fmt(preims[0].p[1])})`
						: `q = (${fmt(F2.hover.wx)}, ${fmt(F2.hover.wy)}) → 2 preimages (overlap): ${preims.map(pr => `(${fmt(pr.p[0])}, ${fmt(pr.p[1])})`).join(' & ')}`;
			} else if (F2.hoverSrc) {
				const p = F2.hoverSrc;
				const fp = Fold.apply2(p, n, F2.c, F2.lambda);
				ro.textContent = `p = (${fmt(p[0])}, ${fmt(p[1])}) → lands at f(p) = (${fmt(fp[0])}, ${fmt(fp[1])}) on the paper`;
			} else {
				ro.textContent = 'Hover the paper (3D) to count preimages · hover the source (2D) to trace a point · drag to rotate · scroll to zoom';
			}
			drawSource();
		};

		const redraw = () => {
			try { drawSource(); draw3D(); draw1D(); updateEq(); }
			catch (e) { showError('fold-2d', e); }
		};

		/* ─── controls ─── */
		const bindRange = (id, key, disp) => {
			const s = $(id), v = $(id + '-v');
			if (!s) return;
			s.addEventListener('input', () => {
				F2[key] = parseFloat(s.value);
				if (v) v.textContent = disp ? disp(F2[key]) : fmt(F2[key]);
				schedule(redraw);
			});
			if (v) v.textContent = disp ? disp(F2[key]) : fmt(F2[key]);
		};
		bindRange('fd2d-theta',  'theta',  x => x.toFixed(0)+'°');
		bindRange('fd2d-c',      'c',      x => x.toFixed(2));
		bindRange('fd2d-lambda', 'lambda', x => x.toFixed(2));

		buildPresets('fd2d-presets', PRESETS_F2, pr => {
			F2.theta  = pr.theta;
			F2.c      = pr.c;
			F2.lambda = pr.lambda;
			['theta','c','lambda'].forEach(k => {
				const s = $('fd2d-'+k), v = $('fd2d-'+k+'-v');
				if (s) s.value = F2[k];
				if (v) v.textContent = k==='theta' ? F2[k]+'°' : fmt(F2[k]);
			});
			redraw();
		});

		src.addEventListener('click', e => {
			const r = src.getBoundingClientRect();
			F2.track = [
				px2w((e.clientX - r.left) * (size/r.width)),
				py2w((e.clientY - r.top)  * (size/r.height))
			];
			redraw();
		});
		src.addEventListener('mousemove', e => {
			const r = src.getBoundingClientRect();
			const u = px2w((e.clientX - r.left) * (size/r.width));
			const v = py2w((e.clientY - r.top)  * (size/r.height));
			F2.hoverSrc = (u >= 0 && u <= 1 && v >= 0 && v <= 1) ? [u, v] : null;
			schedule(() => { updateHover(); draw3D(); });
		});
		src.addEventListener('mouseleave', () => {
			F2.hoverSrc = null;
			schedule(() => { updateHover(); draw3D(); });
		});

		if (fd3d) {
			bind3DNav(fd3d, F2, redraw);
			fd3d.addEventListener('mousedown', e => {
				F2.drag = {x:e.clientX, y:e.clientY}; F2.auto = false;
				F2.hover = null; schedule(() => { updateHover(); draw3D(); });
			});
			fd3d.addEventListener('mousemove', e => {
				if (F2.drag) return;
				const r = fd3d.getBoundingClientRect();
				const mx = (e.clientX - r.left) * (W3/r.width);
				const my = (e.clientY - r.top)  * (H3/r.height);
				const hit = raycastPaper(mx, my);
				if (hit) {
					const n = Fold.normal2(F2.theta * Math.PI/180);
					const q = [hit.P[0], hit.P[1]];
					F2.hover = { wx: q[0], wy: q[1], preims: Fold.preimages2(q, n, F2.c, F2.lambda), P: hit.P };
				} else {
					F2.hover = null;
				}
				schedule(() => { updateHover(); draw3D(); });
			});
			fd3d.addEventListener('mouseleave', () => {
				if (!F2.drag) { F2.hover = null; schedule(() => { updateHover(); draw3D(); }); }
			});
			window.addEventListener('mousemove', e => {
				if (!F2.drag) return;
				F2.yaw   += (e.clientX - F2.drag.x) * 0.01;
				F2.pitch += (e.clientY - F2.drag.y) * 0.01;
				F2.pitch = Math.max(-Math.PI/2+0.05, Math.min(Math.PI/2-0.05, F2.pitch));
				F2.drag = {x:e.clientX, y:e.clientY};
				schedule(() => draw3D());
			});
			window.addEventListener('mouseup', () => { F2.drag = null; });
		}

		themeRedraws.push(redraw);
		redraw();
	};

	/* ═══ 6. LAB U3 — Hopf link, unlinked by a fold ══════════════════ */

	const U3 = {
		tilt: 0, spin: 0, c: 0, lambda: 0, sep: 0,
		yaw: 0.6, pitch: 0.35, auto: false, zoom: 1, drag: null, last: 0,
		showCores: true,
		N: 96, r: 0.18,
		coreA: null, coreB: null,   // cached & only rebuilt on param change
		lastSig: '',
		lkCache: null
	};

	const PRESETS_U3 = [
		{ name: 'Untouched (λ=0)',   tilt:0,  spin:0,   c:0,    lambda:0 },
		{ name: 'Gentle fold',       tilt:60, spin:0,   c:0,    lambda:0.8 },
		{ name: 'Strong fold',       tilt:80, spin:0,   c:0.1,  lambda:1.8 },
		{ name: 'Cross-fold',        tilt:90, spin:45,  c:0,    lambda:2.0 }
	];

	const initU3 = () => {
		const cv = $('u3d-canvas'); if (!cv) return;
		const ctx = cv.getContext('2d');
		if (!ctx) throw new Error('canvas 2D unavailable');
		const W = cv.width, H = cv.height;

		const project = p => {
			const cy = Math.cos(U3.yaw), sy = Math.sin(U3.yaw);
			const x1 = cy*p[0] + sy*p[2], z1 = -sy*p[0] + cy*p[2];
			const cx = Math.cos(U3.pitch), sx = Math.sin(U3.pitch);
			const y2 = cx*p[1] - sx*z1, z2 = sx*p[1] + cx*z1;
			const dist = 5, f = dist / (dist - z2);
			const scale = Math.min(W, H) * 0.22 * U3.zoom;
			return [ W*0.5 + x1*scale*f, H*0.5 - y2*scale*f, z2 ];
		};

		const applyAll = (p, whichRing) => {
			// separate the rings apart (only after they are unlinked)
			const shift = whichRing === 'A'
				? [-U3.sep, 0, 0]
				: [ U3.sep, 0, 0];
			const n = Fold.normal3(U3.tilt*Math.PI/180, U3.spin*Math.PI/180);
			const folded = Fold.apply3(p, n, U3.c, U3.lambda);
			return [folded[0]+shift[0], folded[1]+shift[1], folded[2]+shift[2]];
		};

		const rebuildCores = () => {
			const sig = [U3.tilt,U3.spin,U3.c,U3.lambda,U3.sep,U3.N].join(',');
			if (sig === U3.lastSig) return;
			U3.lastSig = sig;
			U3.coreA = new Array(U3.N);
			U3.coreB = new Array(U3.N);
			const step = 2*Math.PI / U3.N;
			for (let i = 0; i < U3.N; i++) {
				U3.coreA[i] = applyAll(Hopf.coreA(i*step), 'A');
				U3.coreB[i] = applyAll(Hopf.coreB(i*step), 'B');
			}
			U3.lkCache = null;
		};

		const drawTube = (coreFn, colour, whichRing) => {
			const P = pal();
			const K = 48, T = 12;
			const quads = [];
			for (let u = 0; u < K; u++) {
				for (let v = 0; v < T; v++) {
					const cs = [
						[u/K,       v/T],       [(u+1)/K, v/T],
						[(u+1)/K, (v+1)/T],     [u/K,     (v+1)/T]
					];
					const ps = cs.map(([uu,vv]) => {
						const p = whichRing === 'A'
							? Hopf.tubeA(uu*2*Math.PI, vv*2*Math.PI, U3.r)
							: Hopf.tubeB(uu*2*Math.PI, vv*2*Math.PI, U3.r);
						return applyAll(p, whichRing);
					});
					const proj = ps.map(project);
					const zAvg = (proj[0][2]+proj[1][2]+proj[2][2]+proj[3][2])*0.25;
					quads.push({proj, zAvg, colour});
				}
			}
			return quads;
		};

		const draw = () => {
			const P = pal();
			ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
			drawAxes3D(ctx, project, P, [0, 0, 0], 1.5);
			rebuildCores();

			// crease plane (translucent quad)
			const n = Fold.normal3(U3.tilt*Math.PI/180, U3.spin*Math.PI/180);
			// pick two orthogonal in-plane directions
			const up = Math.abs(n[2]) > 0.9 ? [1,0,0] : [0,0,1];
			const t1 = vcross(n, up); { const L=vnorm(t1); t1[0]/=L; t1[1]/=L; t1[2]/=L; }
			const t2 = vcross(n, t1);
			const p0 = [n[0]*U3.c, n[1]*U3.c, n[2]*U3.c];
			const R = 2.4;
			const planeQuad = [
				[p0[0] - R*t1[0] - R*t2[0], p0[1] - R*t1[1] - R*t2[1], p0[2] - R*t1[2] - R*t2[2]],
				[p0[0] + R*t1[0] - R*t2[0], p0[1] + R*t1[1] - R*t2[1], p0[2] + R*t1[2] - R*t2[2]],
				[p0[0] + R*t1[0] + R*t2[0], p0[1] + R*t1[1] + R*t2[1], p0[2] + R*t1[2] + R*t2[2]],
				[p0[0] - R*t1[0] + R*t2[0], p0[1] - R*t1[1] + R*t2[1], p0[2] - R*t1[2] + R*t2[2]]
			];
			const planeProj = planeQuad.map(project);
			const planeZ = (planeProj[0][2]+planeProj[1][2]+planeProj[2][2]+planeProj[3][2])*0.25;

			// tube quads for both rings
			const qA = drawTube(Hopf.coreA, P.bad,  'A');
			const qB = drawTube(Hopf.coreB, P.accent,'B');
			const all = qA.concat(qB);

			// insert the plane at the correct z-depth
			all.push({ proj: planeProj, zAvg: planeZ, colour: P.cyan, isPlane: true });
			all.sort((a, b) => a.zAvg - b.zAvg);

			for (const q of all) {
				if (q.isPlane) {
					ctx.fillStyle = P.cyan; ctx.globalAlpha = 0.08;
					ctx.beginPath();
					ctx.moveTo(q.proj[0][0], q.proj[0][1]);
					for (let k = 1; k < 4; k++) ctx.lineTo(q.proj[k][0], q.proj[k][1]);
					ctx.closePath(); ctx.fill();
					ctx.globalAlpha = 0.5; ctx.strokeStyle = P.cyan; ctx.lineWidth = 1;
					ctx.setLineDash([5,4]); ctx.stroke(); ctx.setLineDash([]);
					ctx.globalAlpha = 1;
				} else {
					ctx.fillStyle = q.colour;
					ctx.strokeStyle = P.line; ctx.lineWidth = 0.4;
					ctx.beginPath();
					ctx.moveTo(q.proj[0][0], q.proj[0][1]);
					for (let k = 1; k < 4; k++) ctx.lineTo(q.proj[k][0], q.proj[k][1]);
					ctx.closePath(); ctx.fill(); ctx.stroke();
				}
			}

			// core circles overlay (for clarity)
			if (U3.showCores) {
				const drawCore = (core, colour) => {
					ctx.strokeStyle = colour; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
					ctx.beginPath();
					for (let i = 0; i <= core.length; i++) {
						const p = project(core[i % core.length]);
						i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
					}
					ctx.stroke(); ctx.globalAlpha = 1;
				};
				drawCore(U3.coreA, P.bad);
				drawCore(U3.coreB, P.accent);
			}

			// crease-plane label + normal arrow (the far side is pushed along −n̂)
			const pm = [(planeProj[0][0]+planeProj[3][0])/2, (planeProj[0][1]+planeProj[3][1])/2];
			ctx.fillStyle = P.cyan; ctx.globalAlpha = 0.75; ctx.font = '11px monospace';
			ctx.fillText('crease: n̂·p = c', pm[0] - 48, pm[1] + 14);
			const nA = project([n[0]*U3.c, n[1]*U3.c, n[2]*U3.c]);
			const nB = project([n[0]*(U3.c+0.55), n[1]*(U3.c+0.55), n[2]*(U3.c+0.55)]);
			const nAng = Math.atan2(nB[1]-nA[1], nB[0]-nA[0]);
			ctx.globalAlpha = 0.9; ctx.strokeStyle = P.cyan; ctx.fillStyle = P.cyan; ctx.lineWidth = 2;
			ctx.beginPath(); ctx.moveTo(nA[0], nA[1]); ctx.lineTo(nB[0], nB[1]); ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(nB[0], nB[1]);
			ctx.lineTo(nB[0] - 9*Math.cos(nAng - 0.45), nB[1] - 9*Math.sin(nAng - 0.45));
			ctx.lineTo(nB[0] - 9*Math.cos(nAng + 0.45), nB[1] - 9*Math.sin(nAng + 0.45));
			ctx.closePath(); ctx.fill();
			ctx.font = 'bold 13px monospace';
			ctx.fillText('n̂', nB[0] + 8, nB[1] - 6);
			// ring labels
			ctx.globalAlpha = 1;
			const la = project(U3.coreA[0]);
			const lb = project(U3.coreB[0]);
			ctx.fillStyle = P.bad; ctx.fillText('A', la[0] + 9, la[1] - 7);
			ctx.fillStyle = P.accent; ctx.fillText('B', lb[0] + 9, lb[1] - 7);
		};

		/* ─── linking number + status ─── */
		const computeLink = () => {
			if (U3.lkCache !== null) return U3.lkCache;
			// adaptive: fewer samples when things are far apart
			const N = U3.N;
			// downsample to at most 48 for the Gauss integral (O(N²) is expensive)
			const step = Math.max(1, Math.floor(N / 48));
			const sub = arr => {
				const out = [];
				for (let i = 0; i < arr.length; i += step) out.push(arr[i]);
				return out;
			};
			const { lk } = gaussLink(sub(U3.coreA), sub(U3.coreB));
			U3.lkCache = { lk, dist: minDist3(U3.coreA, U3.coreB) };
			return U3.lkCache;
		};

		const updateEq = () => {
			const eq = $('u3d-eq');
			const n = Fold.normal3(U3.tilt*Math.PI/180, U3.spin*Math.PI/180);
			const {lk, dist} = computeLink();
			const state = Math.abs(lk) > 0.5 ? '\\text{LINKED}'
				: Math.abs(lk) < 0.2 ? '\\text{unlinked}'
				: '\\text{mid-fold (transitioning)}';
			const L = [
				`\\mathrm{Lk}(A,B) &= \\frac{1}{4\\pi}\\oint_A\\oint_B \\frac{(\\mathbf{p}-\\mathbf{q})\\cdot(d\\mathbf{p}\\times d\\mathbf{q})}{|\\mathbf{p}-\\mathbf{q}|^3} \\approx ${lk.toFixed(3)} \\;\\Rightarrow\\; ${state} \\\\`,
				`\\hat{\\mathbf{n}} &= (${fmt(n[0])},\\; ${fmt(n[1])},\\; ${fmt(n[2])}) \\qquad c = ${fmt(U3.c)} \\qquad \\lambda = ${fmt(U3.lambda)} \\\\`,
				`\\text{separation} &= \\pm\\, ${fmt(U3.sep)} \\;\\text{ along } x \\qquad \\min\\; \\|A - B\\| \\approx ${fmt(dist)}`
			];
			tex(eq, `\\begin{aligned}` + L.join(' ') + `\\end{aligned}`, true);
		};

		const updateStatus = () => {
			const st = $('u3d-status'); if (!st) return;
			st.innerHTML = '';
			const pill = (t, k) => {
				const s = document.createElement('span');
				s.className = 'af-pill' + (k ? ' ' + k : '');
				s.textContent = t;
				st.appendChild(s);
			};
			const {lk, dist} = computeLink();
			if (Math.abs(lk) > 0.5) pill('Lk ≈ ±1 — HOPF LINK (chained)', 'bad');
			else if (Math.abs(lk) < 0.2) pill('Lk ≈ 0 — unlinked', 'good');
			else pill('Lk ≈ ' + lk.toFixed(2) + ' — mid-fold (transitioning)', 'warn');
			if (U3.lambda === 0) pill('λ = 0 → identity, no fold applied', '');
			else if (U3.lambda >= 1) pill('λ ≥ 1 → topology-changing fold', 'warn');
			if (dist < 0.02) pill('rings touch — Lk is undefined', 'bad');
		};

		const redraw = () => {
			try {
				U3.lkCache = null;
				draw(); updateEq(); updateStatus();
			} catch (e) { showError('unlink-3d', e); }
		};

		/* ─── controls ─── */
		const bindRange = (id, key, disp) => {
			const s = $(id), v = $(id + '-v');
			if (!s) return;
			s.addEventListener('input', () => {
				U3[key] = parseFloat(s.value);
				if (v) v.textContent = disp ? disp(U3[key]) : fmt(U3[key]);
				U3.lastSig = ''; // force core rebuild
				schedule(redraw);
			});
			if (v) v.textContent = disp ? disp(U3[key]) : fmt(U3[key]);
		};
		bindRange('u3d-tilt',   'tilt',   x => x.toFixed(0)+'°');
		bindRange('u3d-spin',   'spin',   x => x.toFixed(0)+'°');
		bindRange('u3d-c',      'c',      x => x.toFixed(2));
		bindRange('u3d-lambda', 'lambda', x => x.toFixed(2));
		bindRange('u3d-sep',    'sep',    x => x.toFixed(2));

		buildPresets('u3d-presets', PRESETS_U3, pr => {
			Object.assign(U3, pr, { sep: 0 });
			['tilt','spin','c','lambda','sep'].forEach(k => {
				const s = $('u3d-'+k), v = $('u3d-'+k+'-v');
				if (s) s.value = U3[k];
				if (v) v.textContent = (k==='tilt'||k==='spin') ? U3[k]+'°' : fmt(U3[k]);
			});
			U3.lastSig = '';
			redraw();
		});

		const sepBtn = $('u3d-sepbtn');
		if (sepBtn) sepBtn.addEventListener('click', () => {
			// animate sep from current → 1.2
			const start = performance.now(), from = U3.sep, to = 1.2, dur = 900;
			const step = t => {
				const k = Math.min(1, (t - start) / dur);
				U3.sep = from + (to - from) * (1 - Math.pow(1-k, 3));
				const s = $('u3d-sep'), v = $('u3d-sep-v');
				if (s) s.value = U3.sep;
				if (v) v.textContent = fmt(U3.sep);
				U3.lastSig = '';
				redraw();
				if (k < 1) requestAnimationFrame(step);
			};
			requestAnimationFrame(step);
		});

		const autoCb = $('u3d-auto');
		if (autoCb) autoCb.addEventListener('change', () => { U3.auto = autoCb.checked; });
		const coresCb = $('u3d-cores');
		if (coresCb) coresCb.addEventListener('change', () => { U3.showCores = coresCb.checked; redraw(); });
		bind3DNav(cv, U3, () => draw());

		cv.addEventListener('mousedown', e => {
			U3.drag = { x: e.clientX, y: e.clientY };
			U3.auto = false; if (autoCb) autoCb.checked = false;
		});
		window.addEventListener('mousemove', e => {
			if (!U3.drag) return;
			U3.yaw   += (e.clientX - U3.drag.x) * 0.01;
			U3.pitch += (e.clientY - U3.drag.y) * 0.01;
			U3.pitch = Math.max(-Math.PI/2+0.05, Math.min(Math.PI/2-0.05, U3.pitch));
			U3.drag = { x: e.clientX, y: e.clientY };
			schedule(() => draw());
		});
		window.addEventListener('mouseup', () => { U3.drag = null; });

		const loop = t => {
			if (U3.auto && isVisible(cv) && t - U3.last > 33) {
				U3.yaw += 0.004; U3.last = t;
				draw();
			}
			requestAnimationFrame(loop);
		};
		requestAnimationFrame(loop);

		themeRedraws.push(redraw);
		redraw();
	};

	/* ═══ 7. BOOTSTRAP ════════════════════════════════════════════════ */

	const bootAll = () => {
		try { init2D(); }  catch (e) { showError('af-2d', e); }
		try { init3D(); }  catch (e) { showError('af-3d', e); }
		try { initF2(); }  catch (e) { showError('fold-2d', e); }
		try { initU3(); }  catch (e) { showError('unlink-3d', e); }
	};

	// Theme re-render hook (Marnie/You.com theme toggle).
	const themeHook = () => {
		invalidatePal();
		for (const fn of themeRedraws) { try { fn(); } catch (e) { console.error(e); } }
	};
	if (typeof window !== 'undefined') {
		window.addEventListener('mn:theme', themeHook);
		if (window.matchMedia) {
			const mq = window.matchMedia('(prefers-color-scheme: dark)');
			(mq.addEventListener || mq.addListener).call(mq, 'change', themeHook);
		}
	}

	// Loader hook expected by the PHP host.
	if (typeof window !== 'undefined') {
		window.loadMathIVModule = async () => {
			if (typeof updateLoadingStatus === 'function') updateLoadingStatus('Loading Math IV…');
			return Promise.resolve();
		};
	}

	// Idle self-tests once when the tab is quiet — keeps startup snappy.
	const runWhenIdle = fn =>
		(typeof requestIdleCallback === 'function')
			? requestIdleCallback(fn, { timeout: 1500 })
			: setTimeout(fn, 200);

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => runWhenIdle(bootAll));
	} else {
		runWhenIdle(bootAll);
	}
})();
