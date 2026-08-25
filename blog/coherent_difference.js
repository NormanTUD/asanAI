/**
 * Coherent Difference — Interactive Demos
 *
 * Two demos accompanying the "Coherent Difference" chapter:
 *
 *   1. renderSheafGluing(container)
 *      Two open sets U1, U2 on a line with draggable overlap and
 *      draggable local sections. When the sections agree on the
 *      overlap (within a tolerance), they glue into a unique global
 *      section. Otherwise the sheaf axiom fails and the demo shows
 *      exactly *where* on the overlap the mismatch happens.
 *
 *   2. renderHomotopyCoherence(container)
 *      Three open sets Ui, Uj, Uk with pairwise equivalences
 *      α_ij, α_jk, α_ik parametrised by delays (like the lightning /
 *      thunder example). The triple-overlap coherence square
 *      α_ij ∘ α_jk ≃ α_ik is checked live and visualised as a
 *      commuting (or non-commuting) diagram.
 *
 * Both demos follow the visual language established in algorithms.js:
 *   - Segoe UI system font
 *   - card(title, body, color) blocks with coloured left borders
 *   - math rendered via temml through mathBlock/mathInline helpers
 *   - themeColor(hex) for dark-mode compatibility
 *   - Plotly for chart rendering, re-rendering on theme change
 */

(function () {
	'use strict';

	// ─── Shared helpers ────────────────────────────────────────────

	function mathBlock(tex) {
		return `<div class="math-block" data-tex="${tex.replace(/"/g, '&quot;')}" style="text-align:center; margin:14px 0; font-size:1.1em; overflow-x:auto;"></div>`;
	}

	function mathInline(tex) {
		return `<span class="math-inline" data-tex="${tex.replace(/"/g, '&quot;')}"></span>`;
	}

	function renderMathIn(root) {
		if (typeof temml === 'undefined') return;
		root.querySelectorAll('.math-block').forEach(el => {
			try { temml.render(el.getAttribute('data-tex'), el, { displayMode: true }); }
			catch (e) { el.textContent = el.getAttribute('data-tex'); }
		});
		root.querySelectorAll('.math-inline').forEach(el => {
			try { temml.render(el.getAttribute('data-tex'), el, { displayMode: false }); }
			catch (e) { el.textContent = el.getAttribute('data-tex'); }
		});
	}

	function card(title, body, color) {
		color = color || '#3b82f6';
		return `<div style="background:${themeColor('#fff')}; border-radius:10px; border-left:4px solid ${color}; padding:16px 20px; margin:12px 0; box-shadow:0 1px 6px rgba(0,0,0,0.05);">
			<h3 style="margin:0 0 8px 0; color:${color}; font-size:1.02em;">${title}</h3>
			<div style="color:${themeColor('#334155')}; line-height:1.7; font-size:0.95em;">${body}</div>
		</div>`;
	}

	function resolveContainer(container, fnName) {
		const root = typeof container === 'string' ? document.getElementById(container) : container;
		if (!root) { console.error(`${fnName}: container not found`); return null; }
		return root;
	}

	function baseRootStyle(root) {
		root.style.fontFamily = "'Segoe UI', system-ui, -apple-system, sans-serif";
		root.style.maxWidth = '900px';
		root.style.margin = '0 auto';
	}

	// Register a re-render on theme flip so plots/canvas update palette.
	function onThemeChange(fn) {
		if (window.__MN_DARK && typeof window.__MN_DARK.onChange === 'function') {
			window.__MN_DARK.onChange(fn);
		}
	}

	// ═══════════════════════════════════════════════════════════════
	//   DEMO 1 — SHEAF GLUING
	// ═══════════════════════════════════════════════════════════════

	function renderSheafGluing(container) {
		const root = resolveContainer(container, 'renderSheafGluing');
		if (!root) return;

		baseRootStyle(root);

		// ─── State ─────────────────────────────────────────────
		//
		// Two open sets U1, U2 on the real line [0, 10].
		// Each U_i is an interval (a_i, b_i). U1 is left, U2 is right.
		// Each has a local section which is an affine function
		// s_i(x) = m_i * x + c_i, controlled by two draggable handles
		// per section (one at each endpoint).
		//
		// We check: do s_1 and s_2 agree on U1 ∩ U2 = (a_2, b_1)?
		// Within tolerance ⇒ glue. Otherwise ⇒ obstruction.

		const state = {
			u1: { a: 1.0, b: 6.0 },     // U1 = (1, 6)
			u2: { a: 4.0, b: 9.0 },     // U2 = (4, 9)
			// Section values at four control points
			s1_left:  0.6,   // value of s1 at x = u1.a
			s1_right: 2.6,   // value of s1 at x = u1.b
			s2_left:  1.4,   // value of s2 at x = u2.a
			s2_right: 3.4,   // value of s2 at x = u2.b
			tolerance: 0.15
		};

		let dragging = null;   // { key, offsetY } while a handle is held

		// ─── Layout ────────────────────────────────────────────

		root.innerHTML = `
			<div style="text-align:center; margin-bottom:16px;">
				<h3 style="color:${themeColor('#1e293b')}; margin:0 0 6px 0;">The Sheaf Gluing Condition</h3>
				<p style="color:${themeColor('#64748b')}; margin:0; font-size:0.92em;">
					Two open sets. Two local sections. Do they glue into one global section?
				</p>
			</div>

			<div style="background:${themeColor('#f8fafc')}; border:1px solid ${themeColor('#e2e8f0')}; border-radius:10px; padding:14px 18px; margin-bottom:14px; display:flex; flex-wrap:wrap; gap:14px; align-items:center;">
				<label style="font-size:0.88em; font-weight:600; color:${themeColor('#334155')};">
					Tolerance ε:
					<input type="range" id="sg-tol" min="0.01" max="0.6" step="0.01" value="${state.tolerance}" style="width:160px; vertical-align:middle;">
					<span id="sg-tol-val" style="font-family:monospace; color:#3b82f6; font-weight:bold;">${state.tolerance.toFixed(2)}</span>
				</label>
				<button id="sg-agree" style="padding:6px 14px; border:1px solid #10b981; border-radius:5px; background:#ecfdf5; color:#047857; font-size:0.85em; cursor:pointer; font-weight:600;">Auto-glue (make agree)</button>
				<button id="sg-disagree" style="padding:6px 14px; border:1px solid #ef4444; border-radius:5px; background:#fef2f2; color:#b91c1c; font-size:0.85em; cursor:pointer; font-weight:600;">Force disagreement</button>
				<button id="sg-reset" style="padding:6px 14px; border:1px solid ${themeColor('#cbd5e1')}; border-radius:5px; background:${themeColor('#fff')}; color:${themeColor('#334155')}; font-size:0.85em; cursor:pointer; font-weight:600;">Reset</button>
			</div>

			<div style="position:relative; background:${themeColor('#fff')}; border:1px solid ${themeColor('#e2e8f0')}; border-radius:10px; padding:8px; margin-bottom:12px;">
				<canvas id="sg-canvas" width="880" height="380" style="width:100%; height:auto; display:block; cursor:default; touch-action:none;"></canvas>
			</div>

			<div id="sg-status" style="padding:14px 18px; border-radius:10px; margin-bottom:14px; font-size:0.96em; line-height:1.6;"></div>

			<div id="sg-cards"></div>
		`;

		const canvas = root.querySelector('#sg-canvas');
		const ctx = canvas.getContext('2d');
		const statusBox = root.querySelector('#sg-status');
		const cardsBox = root.querySelector('#sg-cards');
		const tolSlider = root.querySelector('#sg-tol');
		const tolReadout = root.querySelector('#sg-tol-val');

		// Static explanatory cards (rendered once)
		cardsBox.innerHTML = `
			${card('The setup', `
				<p>We have two open sets on the real line: ${mathInline('U_1')} (blue) and ${mathInline('U_2')} (orange). Their intersection ${mathInline('U_1 \\cap U_2')} is shaded in green.</p>
				<p>Each open set carries a <em>local section</em>: for ${mathInline('U_1')} we have ${mathInline('s_1 \\in \\mathcal{F}(U_1)')}, drawn as a blue line; for ${mathInline('U_2')} we have ${mathInline('s_2 \\in \\mathcal{F}(U_2)')}, drawn as an orange line. Drag the round handles to change either section's value at its endpoints.</p>
			`, '#3b82f6')}
			${card('The gluing axiom', `
				${mathBlock(`s_1\\big|_{U_1 \\cap U_2} \\;=\\; s_2\\big|_{U_1 \\cap U_2} \\quad\\Longrightarrow\\quad \\exists!\\, s \\in \\mathcal{F}(U_1 \\cup U_2) \\text{ with } s\\big|_{U_i} = s_i`)}
				<p>The restrictions of ${mathInline('s_1')} and ${mathInline('s_2')} to the overlap must agree. If they do, there is a <strong>unique</strong> global section ${mathInline('s')} on the union. If they don't, the local data is called an <em>obstruction</em> and no global section exists.</p>
			`, '#059669')}
			${card('What "tolerance" means here', `
				<p>Real sheaves in mathematics ask for <em>exact</em> equality on the overlap. In this demo we allow a small tolerance ${mathInline('\\varepsilon')} because dragging pixels doesn't give infinite precision. Set ${mathInline('\\varepsilon = 0')} in your head to recover the true axiom.</p>
				<p>The green "obstruction" line in the middle panel shows the pointwise difference ${mathInline('s_1(x) - s_2(x)')} on the overlap. When this line is inside the ${mathInline('\\pm\\varepsilon')} band everywhere, gluing succeeds.</p>
			`, '#f59e0b')}
		`;
		renderMathIn(cardsBox);

		// ─── Coordinate mapping ────────────────────────────────
		//
		// Domain x ∈ [0, 10]. We draw two rows:
		//   Row A (top):    open-set intervals on the x-axis
		//   Row B (middle): the two local sections as line graphs
		//                    over their opens, and the overlap difference
		//
		// Canvas is 880 × 380.

		const CANVAS_W = 880;
		const CANVAS_H = 380;
		const MARGIN_L = 60;
		const MARGIN_R = 40;
		const PLOT_W = CANVAS_W - MARGIN_L - MARGIN_R;

		const ROW_A_Y = 60;    // open set bar row (y-position centre)
		const ROW_B_TOP = 110; // sections plot area top
		const ROW_B_BOT = 340; // sections plot area bottom
		const Y_MIN = -0.5;
		const Y_MAX = 4.5;

		const xToPx = (x) => MARGIN_L + (x / 10) * PLOT_W;
		const yToPx = (y) => ROW_B_BOT - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (ROW_B_BOT - ROW_B_TOP);
		const pxToY = (py) => Y_MIN + ((ROW_B_BOT - py) / (ROW_B_BOT - ROW_B_TOP)) * (Y_MAX - Y_MIN);

		// ─── Section evaluation ────────────────────────────────

		function s1At(x) {
			const t = (x - state.u1.a) / (state.u1.b - state.u1.a);
			return state.s1_left + t * (state.s1_right - state.s1_left);
		}
		function s2At(x) {
			const t = (x - state.u2.a) / (state.u2.b - state.u2.a);
			return state.s2_left + t * (state.s2_right - state.s2_left);
		}

		// ─── Handles for dragging ──────────────────────────────
		//
		// Each handle sits at a canvas position (px, py) and mutates
		// one state field when dragged vertically.

		function getHandles() {
			return [
				{ key: 's1_left',  x: xToPx(state.u1.a), y: yToPx(state.s1_left),  color: '#3b82f6', label: 's₁ left' },
				{ key: 's1_right', x: xToPx(state.u1.b), y: yToPx(state.s1_right), color: '#3b82f6', label: 's₁ right' },
				{ key: 's2_left',  x: xToPx(state.u2.a), y: yToPx(state.s2_left),  color: '#f59e0b', label: 's₂ left' },
				{ key: 's2_right', x: xToPx(state.u2.b), y: yToPx(state.s2_right), color: '#f59e0b', label: 's₂ right' },
			];
		}

		function hitHandle(mx, my) {
			const handles = getHandles();
			for (const h of handles) {
				const dx = mx - h.x;
				const dy = my - h.y;
				if (dx*dx + dy*dy <= 12*12) return h;
			}
			return null;
		}

		// ─── Gluing check ──────────────────────────────────────

		function checkGluing() {
			const overlapA = Math.max(state.u1.a, state.u2.a);
			const overlapB = Math.min(state.u1.b, state.u2.b);
			if (overlapB <= overlapA) {
				return { valid: false, hasOverlap: false, maxDiff: 0, argMaxX: 0, diffs: [] };
			}
			// Sample the difference on the overlap
			const N = 80;
			const diffs = [];
			let maxAbs = 0;
			let argMaxX = overlapA;
			for (let i = 0; i <= N; i++) {
				const x = overlapA + (overlapB - overlapA) * (i / N);
				const d = s1At(x) - s2At(x);
				diffs.push({ x, d });
				const ad = Math.abs(d);
				if (ad > maxAbs) { maxAbs = ad; argMaxX = x; }
			}
			return {
				valid: maxAbs <= state.tolerance,
				hasOverlap: true,
				overlapA, overlapB,
				maxDiff: maxAbs,
				argMaxX,
				diffs
			};
		}

		// ─── Drawing ───────────────────────────────────────────

		function draw() {
			const dark = isDarkMode();
			const bg     = themeColor('#fff');
			const grid   = themeColor('#e2e8f0');
			const axis   = themeColor('#94a3b8');
			const text   = themeColor('#334155');
			const subtle = themeColor('#64748b');

			ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

			const result = checkGluing();

			// Row A background line
			ctx.strokeStyle = axis;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(MARGIN_L, ROW_A_Y);
			ctx.lineTo(CANVAS_W - MARGIN_R, ROW_A_Y);
			ctx.stroke();

			// Overlap band (Row A: shaded green rectangle over the intersection)
			if (result.hasOverlap) {
				ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
				const x0 = xToPx(result.overlapA);
				const x1 = xToPx(result.overlapB);
				ctx.fillRect(x0, ROW_A_Y - 22, x1 - x0, 44);

				// Extend a very faint vertical band into the plot area
				ctx.fillStyle = 'rgba(16, 185, 129, 0.07)';
				ctx.fillRect(x0, ROW_B_TOP, x1 - x0, ROW_B_BOT - ROW_B_TOP);
			}

			// Row A: U1 bar (blue)
			drawIntervalBar(state.u1.a, state.u1.b, ROW_A_Y - 8, '#3b82f6', 'U₁');
			// Row A: U2 bar (orange)
			drawIntervalBar(state.u2.a, state.u2.b, ROW_A_Y + 8, '#f59e0b', 'U₂');

			// Row A tick labels
			ctx.fillStyle = subtle;
			ctx.font = '10px monospace';
			ctx.textAlign = 'center';
			for (let x = 0; x <= 10; x += 1) {
				const px = xToPx(x);
				ctx.beginPath();
				ctx.moveTo(px, ROW_A_Y + 22);
				ctx.lineTo(px, ROW_A_Y + 26);
				ctx.strokeStyle = axis;
				ctx.stroke();
				ctx.fillText(String(x), px, ROW_A_Y + 38);
			}

			// Row B: plot area frame
			ctx.strokeStyle = grid;
			ctx.lineWidth = 1;
			ctx.strokeRect(MARGIN_L, ROW_B_TOP, PLOT_W, ROW_B_BOT - ROW_B_TOP);

			// Row B: y-axis gridlines
			ctx.font = '10px monospace';
			ctx.fillStyle = subtle;
			ctx.textAlign = 'right';
			for (let y = 0; y <= 4; y += 1) {
				const py = yToPx(y);
				ctx.strokeStyle = grid;
				ctx.beginPath();
				ctx.moveTo(MARGIN_L, py);
				ctx.lineTo(MARGIN_L + PLOT_W, py);
				ctx.stroke();
				ctx.fillText(y.toFixed(0), MARGIN_L - 8, py + 3);
			}

			// Row B: y-axis label
			ctx.save();
			ctx.translate(18, (ROW_B_TOP + ROW_B_BOT) / 2);
			ctx.rotate(-Math.PI / 2);
			ctx.fillStyle = subtle;
			ctx.font = '11px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText('section value', 0, 0);
			ctx.restore();

			// Row B: x-axis label
			ctx.fillStyle = subtle;
			ctx.font = '11px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText('x  (position on the base space)', (MARGIN_L + CANVAS_W - MARGIN_R) / 2, ROW_B_BOT + 22);

			// Tolerance band (a horizontal ε envelope around s1 on the overlap)
			if (result.hasOverlap) {
				ctx.fillStyle = result.valid
					? 'rgba(16, 185, 129, 0.12)'
					: 'rgba(239, 68, 68, 0.10)';
				const N = 60;
				ctx.beginPath();
				for (let i = 0; i <= N; i++) {
					const x = result.overlapA + (result.overlapB - result.overlapA) * (i / N);
					const y = s1At(x) + state.tolerance;
					const px = xToPx(x), py = yToPx(y);
					if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
				}
				for (let i = N; i >= 0; i--) {
					const x = result.overlapA + (result.overlapB - result.overlapA) * (i / N);
					const y = s1At(x) - state.tolerance;
					const px = xToPx(x), py = yToPx(y);
					ctx.lineTo(px, py);
				}
				ctx.closePath();
				ctx.fill();
			}

			// Draw s1 as a blue line over U1
			drawSection(state.u1.a, state.u1.b, s1At, '#3b82f6', 3);

			// Draw s2 as an orange line over U2
			drawSection(state.u2.a, state.u2.b, s2At, '#f59e0b', 3);

			// If gluing works, draw the glued global section as a
			// dashed dark-green line spanning U1 ∪ U2.
			if (result.valid && result.hasOverlap) {
				drawGluedSection();
			}

			// Highlight max-mismatch point when the axiom fails
			if (result.hasOverlap && !result.valid) {
				const x = result.argMaxX;
				const y1 = s1At(x), y2 = s2At(x);
				const px = xToPx(x);
				const py1 = yToPx(y1), py2 = yToPx(y2);
				ctx.strokeStyle = '#ef4444';
				ctx.lineWidth = 2;
				ctx.setLineDash([5, 4]);
				ctx.beginPath();
				ctx.moveTo(px, py1);
				ctx.lineTo(px, py2);
				ctx.stroke();
				ctx.setLineDash([]);
				// Label
				ctx.fillStyle = '#ef4444';
				ctx.font = 'bold 11px sans-serif';
				ctx.textAlign = 'left';
				ctx.fillText(`Δ = ${(y1 - y2).toFixed(3)}`, px + 6, (py1 + py2) / 2);
			}

			// Draw handles last so they sit on top
			const handles = getHandles();
			for (const h of handles) {
				ctx.beginPath();
				ctx.arc(h.x, h.y, 8, 0, Math.PI * 2);
				ctx.fillStyle = h.color;
				ctx.fill();
				ctx.lineWidth = 2;
				ctx.strokeStyle = bg;
				ctx.stroke();
				// Outer ring for affordance
				ctx.beginPath();
				ctx.arc(h.x, h.y, 11, 0, Math.PI * 2);
				ctx.strokeStyle = h.color + '55';
				ctx.lineWidth = 1.5;
				ctx.stroke();
			}

			// ─── Status box ────────────────────────────────

			if (!result.hasOverlap) {
				statusBox.style.background = themeColor('#fef2f2');
				statusBox.style.borderLeft = `4px solid #ef4444`;
				statusBox.style.color = themeColor('#7f1d1d');
				statusBox.innerHTML = `<strong>No overlap.</strong> The two open sets are disjoint (${mathInline('U_1 \\cap U_2 = \\emptyset')}), so the gluing axiom has no content here. Move the open sets so they overlap by dragging &mdash; or click one of the buttons above.`;
			} else if (result.valid) {
				statusBox.style.background = themeColor('#ecfdf5');
				statusBox.style.borderLeft = `4px solid #10b981`;
				statusBox.style.color = themeColor('#064e3b');
				statusBox.innerHTML = `<strong>&#10003; Gluing succeeds.</strong> The two local sections agree on the overlap ${mathInline('U_1 \\cap U_2 = (' + result.overlapA.toFixed(2) + ',\\, ' + result.overlapB.toFixed(2) + ')')} within tolerance ${mathInline('\\varepsilon = ' + state.tolerance.toFixed(2))} (max deviation ${result.maxDiff.toFixed(4)}). A unique global section ${mathInline('s \\in \\mathcal{F}(U_1 \\cup U_2)')} exists &mdash; drawn as the dashed dark-green line.`;
			} else {
				statusBox.style.background = themeColor('#fef2f2');
				statusBox.style.borderLeft = `4px solid #ef4444`;
				statusBox.style.color = themeColor('#7f1d1d');
				statusBox.innerHTML = `<strong>&#10007; Gluing fails.</strong> On the overlap ${mathInline('U_1 \\cap U_2 = (' + result.overlapA.toFixed(2) + ',\\, ' + result.overlapB.toFixed(2) + ')')} the sections disagree by up to ${mathInline('|\\Delta| = ' + result.maxDiff.toFixed(4))} &mdash; larger than the tolerance ${mathInline('\\varepsilon = ' + state.tolerance.toFixed(2))}. The presheaf data is <em>incompatible</em>: no global section restricts to both ${mathInline('s_1')} and ${mathInline('s_2')}. The red dashed segment marks the point of worst disagreement.`;
			}
			renderMathIn(statusBox);
		}

		function drawIntervalBar(a, b, y, color, label) {
			const x0 = xToPx(a), x1 = xToPx(b);
			// Rounded rectangle look
			ctx.fillStyle = color;
			ctx.globalAlpha = 0.85;
			ctx.beginPath();
			if (ctx.roundRect) ctx.roundRect(x0, y - 6, x1 - x0, 12, 6);
			else ctx.rect(x0, y - 6, x1 - x0, 12);
			ctx.fill();
			ctx.globalAlpha = 1;
			// Open-set brackets (parentheses to signal "open")
			ctx.fillStyle = color;
			ctx.font = 'bold 14px sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('(', x0, y);
			ctx.fillText(')', x1, y);
			// Label just outside on the left
			ctx.fillStyle = color;
			ctx.font = 'bold 12px sans-serif';
			ctx.textAlign = 'right';
			ctx.textBaseline = 'middle';
			ctx.fillText(label, x0 - 8, y);
		}

		function drawSection(a, b, fn, color, width) {
			ctx.strokeStyle = color;
			ctx.lineWidth = width;
			ctx.beginPath();
			const N = 60;
			for (let i = 0; i <= N; i++) {
				const x = a + (b - a) * (i / N);
				const y = fn(x);
				const px = xToPx(x);
				const py = yToPx(y);
				if (i === 0) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			}
			ctx.stroke();
		}

		function drawGluedSection() {
			// The glued section is defined piecewise: s1 on U1, s2 on U2.
			// Because they agree on the overlap (up to ε), we draw a single
			// dashed line that follows s1 on [u1.a, overlap midpoint] and
			// s2 on [overlap midpoint, u2.b], but visually it looks like one
			// continuous curve because they agree.
			const totalA = Math.min(state.u1.a, state.u2.a);
			const totalB = Math.max(state.u1.b, state.u2.b);
			ctx.strokeStyle = '#065f46';
			ctx.lineWidth = 2;
			ctx.setLineDash([7, 4]);
			ctx.beginPath();
			const N = 100;
			for (let i = 0; i <= N; i++) {
				const x = totalA + (totalB - totalA) * (i / N);
				let y;
				const inU1 = x >= state.u1.a && x <= state.u1.b;
				const inU2 = x >= state.u2.a && x <= state.u2.b;
				if (inU1 && inU2) {
					// Average on the overlap (any point on either works within ε)
					y = 0.5 * (s1At(x) + s2At(x));
				} else if (inU1) {
					y = s1At(x);
				} else if (inU2) {
					y = s2At(x);
				} else {
					continue; // gap (shouldn't happen when overlap exists)
				}
				const px = xToPx(x), py = yToPx(y);
				if (i === 0) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			}
			ctx.stroke();
			ctx.setLineDash([]);

			// Label
			const midX = (totalA + totalB) / 2;
			const midY = 0.5 * (s1At(midX) + s2At(midX));
			ctx.fillStyle = '#065f46';
			ctx.font = 'italic bold 11px sans-serif';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'bottom';
			ctx.fillText('global s ∈ ℱ(U₁∪U₂)', xToPx(midX) + 6, yToPx(midY) - 6);
		}

		// ─── Interaction: dragging handles ─────────────────

		function eventPos(e) {
			const rect = canvas.getBoundingClientRect();
			const scaleX = canvas.width / rect.width;
			const scaleY = canvas.height / rect.height;
			const t = e.touches ? e.touches[0] : e;
			return {
				x: (t.clientX - rect.left) * scaleX,
				y: (t.clientY - rect.top) * scaleY
			};
		}

		function onPointerDown(e) {
			const { x, y } = eventPos(e);
			const h = hitHandle(x, y);
			if (h) {
				dragging = { key: h.key };
				canvas.style.cursor = 'grabbing';
				e.preventDefault();
			}
		}

		function onPointerMove(e) {
			const { x, y } = eventPos(e);
			if (!dragging) {
				const h = hitHandle(x, y);
				canvas.style.cursor = h ? 'grab' : 'default';
				return;
			}
			// Convert y to section value and clamp
			let val = pxToY(y);
			if (val > Y_MAX - 0.2) val = Y_MAX - 0.2;
			if (val < Y_MIN + 0.2) val = Y_MIN + 0.2;
			state[dragging.key] = val;
			draw();
			e.preventDefault();
		}

		function onPointerUp() {
			if (dragging) {
				dragging = null;
				canvas.style.cursor = 'default';
			}
		}

		canvas.addEventListener('mousedown', onPointerDown);
		window.addEventListener('mousemove', onPointerMove);
		window.addEventListener('mouseup', onPointerUp);
		canvas.addEventListener('touchstart', onPointerDown, { passive: false });
		window.addEventListener('touchmove', onPointerMove, { passive: false });
		window.addEventListener('touchend', onPointerUp);

		// ─── Buttons ───────────────────────────────────────

		tolSlider.addEventListener('input', () => {
			state.tolerance = parseFloat(tolSlider.value);
			tolReadout.textContent = state.tolerance.toFixed(2);
			draw();
		});

		root.querySelector('#sg-agree').addEventListener('click', () => {
			// Snap s2 so that it matches s1 exactly on the overlap.
			// s1 and s2 are both affine; forcing agreement at two overlap
			// endpoints is enough (then they agree on the whole overlap).
			const oA = Math.max(state.u1.a, state.u2.a);
			const oB = Math.min(state.u1.b, state.u2.b);
			if (oB <= oA) return;
			const vAtOA = s1At(oA);
			const vAtOB = s1At(oB);
			// Extrapolate s2 from those two values (s2 is affine on U2)
			const t_a = (oA - state.u2.a) / (state.u2.b - state.u2.a);
			const t_b = (oB - state.u2.a) / (state.u2.b - state.u2.a);
			// Solve: s2_left + t_a * (s2_right - s2_left) = vAtOA
			//        s2_left + t_b * (s2_right - s2_left) = vAtOB
			const denom = (t_b - t_a);
			if (Math.abs(denom) < 1e-6) return;
			const dV = (vAtOB - vAtOA) / denom;
			const s2_left = vAtOA - t_a * dV;
			const s2_right = s2_left + dV;
			state.s2_left = s2_left;
			state.s2_right = s2_right;
			draw();
		});

		root.querySelector('#sg-disagree').addEventListener('click', () => {
			// Push s2 up so mid-overlap deviation is well above tolerance.
			state.s2_left = state.s1_left + 1.2;
			state.s2_right = state.s1_right - 0.9;
			draw();
		});

		root.querySelector('#sg-reset').addEventListener('click', () => {
			state.u1 = { a: 1.0, b: 6.0 };
			state.u2 = { a: 4.0, b: 9.0 };
			state.s1_left  = 0.6;
			state.s1_right = 2.6;
			state.s2_left  = 1.4;
			state.s2_right = 3.4;
			state.tolerance = 0.15;
			tolSlider.value = state.tolerance;
			tolReadout.textContent = state.tolerance.toFixed(2);
			draw();
		});

		// Initial paint
		draw();
		onThemeChange(() => draw());
	}

	// ═══════════════════════════════════════════════════════════════
	//   DEMO 2 — HOMOTOPY COHERENCE
	// ═══════════════════════════════════════════════════════════════

	function renderHomotopyCoherence(container) {
		const root = resolveContainer(container, 'renderHomotopyCoherence');
		if (!root) return;

		baseRootStyle(root);

		// ─── State ─────────────────────────────────────────────
		//
		// Three "sensors" i, j, k measuring the same underlying event
		// (a lightning strike). Each records the event at a time
		// t_i, t_j, t_k. The equivalences α_ij, α_jk, α_ik are the
		// time-translation homotopies:
		//
		//   α_ij : shifts by δ_ij
		//   α_jk : shifts by δ_jk
		//   α_ik : shifts by δ_ik
		//
		// The COHERENCE axiom on the triple overlap:
		//
		//   α_ik  ≃  α_ij ∘ α_jk    (i.e. δ_ik = δ_ij + δ_jk)
		//
		// The user picks δ_ij, δ_jk, δ_ik. The demo reports whether
		// the diagram commutes (up to a tolerance).

		const state = {
			delta_ij: 0.30,
			delta_jk: 0.45,
			delta_ik: 0.75,   // coherent value = 0.30 + 0.45 = 0.75
			tolerance: 0.05
		};

		// ─── Layout ────────────────────────────────────────────

		root.innerHTML = `
			<div style="text-align:center; margin-bottom:16px;">
				<h3 style="color:${themeColor('#1e293b')}; margin:0 0 6px 0;">Homotopy Coherence on a Triple Overlap</h3>
				<p style="color:${themeColor('#64748b')}; margin:0; font-size:0.92em;">
					Three sensors observing one event. Their pairwise identifications must compose consistently.
				</p>
			</div>

			<div style="background:${themeColor('#f8fafc')}; border:1px solid ${themeColor('#e2e8f0')}; border-radius:10px; padding:16px 20px; margin-bottom:14px;">
				<p style="margin:0 0 10px 0; font-size:0.9em; color:${themeColor('#334155')};">
					Adjust the three time-shifts (in seconds). Two of them fix ${mathInline('\\alpha_{ij}')} and ${mathInline('\\alpha_{jk}')}; the third is your independent guess for ${mathInline('\\alpha_{ik}')}. If the diagram commutes, ${mathInline('\\delta_{ik}')} must equal ${mathInline('\\delta_{ij} + \\delta_{jk}')}.
				</p>
				<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; align-items:center;">
					<div>
						<label style="font-size:0.85em; font-weight:600; color:#3b82f6;">δ<sub>ij</sub> (seconds)</label>
						<input type="range" id="hc-ij" min="-1.5" max="1.5" step="0.01" value="${state.delta_ij}" style="width:100%;">
						<div style="font-family:monospace; text-align:center; color:#3b82f6; font-weight:bold;" id="hc-ij-val">${state.delta_ij.toFixed(2)}</div>
					</div>
					<div>
						<label style="font-size:0.85em; font-weight:600; color:#f59e0b;">δ<sub>jk</sub> (seconds)</label>
						<input type="range" id="hc-jk" min="-1.5" max="1.5" step="0.01" value="${state.delta_jk}" style="width:100%;">
						<div style="font-family:monospace; text-align:center; color:#f59e0b; font-weight:bold;" id="hc-jk-val">${state.delta_jk.toFixed(2)}</div>
					</div>
					<div>
						<label style="font-size:0.85em; font-weight:600; color:#8b5cf6;">δ<sub>ik</sub> (seconds)</label>
						<input type="range" id="hc-ik" min="-3" max="3" step="0.01" value="${state.delta_ik}" style="width:100%;">
						<div style="font-family:monospace; text-align:center; color:#8b5cf6; font-weight:bold;" id="hc-ik-val">${state.delta_ik.toFixed(2)}</div>
					</div>
				</div>
				<div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
					<label style="font-size:0.85em; font-weight:600; color:${themeColor('#334155')};">
						Tolerance:
						<input type="range" id="hc-tol" min="0.005" max="0.3" step="0.005" value="${state.tolerance}" style="width:140px; vertical-align:middle;">
						<span id="hc-tol-val" style="font-family:monospace; color:#3b82f6; font-weight:bold;">${state.tolerance.toFixed(3)}</span>
					</label>
					<button id="hc-fix" style="padding:6px 14px; border:1px solid #10b981; border-radius:5px; background:#ecfdf5; color:#047857; font-size:0.85em; cursor:pointer; font-weight:600;">Snap δ<sub>ik</sub> to make coherent</button>
					<button id="hc-break" style="padding:6px 14px; border:1px solid #ef4444; border-radius:5px; background:#fef2f2; color:#b91c1c; font-size:0.85em; cursor:pointer; font-weight:600;">Break coherence</button>
					<button id="hc-reset" style="padding:6px 14px; border:1px solid ${themeColor('#cbd5e1')}; border-radius:5px; background:${themeColor('#fff')}; color:${themeColor('#334155')}; font-size:0.85em; cursor:pointer; font-weight:600;">Reset</button>
				</div>
			</div>

			<div style="background:${themeColor('#fff')}; border:1px solid ${themeColor('#e2e8f0')}; border-radius:10px; padding:8px; margin-bottom:12px;">
				<canvas id="hc-canvas" width="880" height="420" style="width:100%; height:auto; display:block;"></canvas>
			</div>

			<div id="hc-status" style="padding:14px 18px; border-radius:10px; margin-bottom:14px; font-size:0.96em; line-height:1.6;"></div>

			<div id="hc-cards"></div>
		`;

		const canvas = root.querySelector('#hc-canvas');
		const ctx = canvas.getContext('2d');
		const statusBox = root.querySelector('#hc-status');
		const cardsBox = root.querySelector('#hc-cards');

		// Static explanatory cards
		cardsBox.innerHTML = `
			${card('The setup', `
				<p>Three sensors ${mathInline('i, j, k')} observe the same lightning strike. Each records the moment of the strike at its own local time. On any pairwise overlap ${mathInline('U_i \\cap U_j')} we have an <em>equivalence</em> (not an equality) between the two local sections:</p>
				${mathBlock(`\\alpha_{ij} : \\; s_i\\big|_{U_i \\cap U_j} \\;\\simeq\\; s_j\\big|_{U_i \\cap U_j}`)}
				<p>In this concrete example the equivalence is a time-translation by ${mathInline('\\delta_{ij}')} seconds. The three panels above show the three signals ${mathInline('s_i, s_j, s_k')} on a shared time axis.</p>
			`, '#3b82f6')}
			${card('The coherence condition on the triple overlap', `
				<p>On the triple overlap ${mathInline('U_i \\cap U_j \\cap U_k')}, the pairwise equivalences must themselves be equivalent up to a higher homotopy:</p>
				${mathBlock(`\\alpha_{ik} \\;\\simeq\\; \\alpha_{ij} \\circ \\alpha_{jk}`)}
				<p>In our concrete setup this becomes a simple arithmetic condition:</p>
				${mathBlock(`\\delta_{ik} \\;=\\; \\delta_{ij} + \\delta_{jk}`)}
				<p>If it holds, the three sensors have a <em>coherent</em> shared story about when the strike happened. If it fails, they do not &mdash; and no global object glues from this data.</p>
			`, '#059669')}
			${card('Why this generalises "equality on the overlap"', `
				<p>A classical (set-theoretic) sheaf demands ${mathInline('s_i\\big|_{U_i \\cap U_j} = s_j\\big|_{U_i \\cap U_j}')} &mdash; strict equality of elements. But real phenomena (light and thunder, video and audio, two clocks on a train) are almost never <em>equal</em>; they are related by a <em>coherent transformation</em> that carries a parameter (here: distance ${mathInline('\\Leftrightarrow')} time-delay).</p>
				<p>The ${mathInline('\\infty')}-sheaf and Homotopy Type Theory pictures replace flat equality by equivalence-plus-coherence, at every level. This demo is the first non-trivial level: three sections, three pairwise equivalences, and one coherence square.</p>
			`, '#f59e0b')}
		`;
		renderMathIn(cardsBox);

		// ─── Canvas dimensions ─────────────────────────────

		const CW = 880, CH = 420;
		// Left column: three horizontal time-lines showing s_i, s_j, s_k
		//   spikes are drawn at their measurement times
		// Right column: the commuting-triangle diagram
		const AXIS_L = 30;
		const AXIS_R = 470;      // left panel ends
		const AXIS_W = AXIS_R - AXIS_L - 20;
		const TIME_MIN = -1.0;
		const TIME_MAX = 3.5;

		const tToPx = (t) => AXIS_L + 10 + ((t - TIME_MIN) / (TIME_MAX - TIME_MIN)) * (AXIS_W);

		// Vertical y-positions of the three lines
		const Y_I = 90;
		const Y_J = 200;
		const Y_K = 310;

		// Sensor "measured" time (i measures at t = 0.5; the others follow via δ)
		const T_I = 0.5;

		function getTimes() {
			// If sensor i sees the strike at t=T_I in its frame, then
			// sensor j sees "the same strike" at time (T_I + δ_ij) in
			// j's frame, i.e. α_ij translates i-time to j-time by δ_ij.
			// Likewise δ_jk carries j-time to k-time.
			// The demo lets the user choose δ_ik independently, which
			// gives sensor k a time (T_I + δ_ik). If δ_ik ≠ δ_ij + δ_jk,
			// the three sensors disagree about "when it happened" and
			// the coherence square fails.
			return {
				ti: T_I,
				tj: T_I + state.delta_ij,
				tk_from_ik: T_I + state.delta_ik,
				tk_via_j: T_I + state.delta_ij + state.delta_jk,
			};
		}

		function coherenceGap() {
			// gap between the two ways of computing k's time
			return state.delta_ik - (state.delta_ij + state.delta_jk);
		}

		// ─── Draw ──────────────────────────────────────────

		function drawTimeAxis(y, label, color) {
			const grid = themeColor('#e2e8f0');
			const axis = themeColor('#94a3b8');
			const text = themeColor('#334155');
			// Axis line
			ctx.strokeStyle = axis;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(AXIS_L, y);
			ctx.lineTo(AXIS_R, y);
			ctx.stroke();

			// Time ticks
			ctx.font = '9px monospace';
			ctx.fillStyle = themeColor('#64748b');
			ctx.textAlign = 'center';
			for (let t = Math.ceil(TIME_MIN); t <= Math.floor(TIME_MAX); t++) {
				const px = tToPx(t);
				ctx.strokeStyle = grid;
				ctx.beginPath();
				ctx.moveTo(px, y - 4);
				ctx.lineTo(px, y + 4);
				ctx.stroke();
				ctx.fillStyle = themeColor('#64748b');
				ctx.fillText(t + 's', px, y + 16);
			}

			// Sensor label on the left
			ctx.fillStyle = color;
			ctx.font = 'bold 12px sans-serif';
			ctx.textAlign = 'right';
			ctx.textBaseline = 'middle';
			ctx.fillText(label, AXIS_L - 4, y);
		}

		function drawStrikeMarker(t, y, color, label) {
			const px = tToPx(t);
			// Vertical stem
			ctx.strokeStyle = color;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(px, y - 22);
			ctx.lineTo(px, y + 22);
			ctx.stroke();
			// Lightning bolt (a stylised zig-zag on top)
			ctx.beginPath();
			ctx.moveTo(px - 5, y - 28);
			ctx.lineTo(px + 2, y - 18);
			ctx.lineTo(px - 2, y - 14);
			ctx.lineTo(px + 5, y - 4);
			ctx.stroke();
			// Time label
			ctx.fillStyle = color;
			ctx.font = 'bold 10px monospace';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'bottom';
			ctx.fillText(`t=${t.toFixed(2)}s`, px, y - 30);
		}

		function drawArrow(fromPx, toPx, y, color, label) {
			// Horizontal arrow linking two markers on different rows
			ctx.strokeStyle = color;
			ctx.lineWidth = 1.5;
			ctx.setLineDash([4, 3]);
			ctx.beginPath();
			ctx.moveTo(fromPx, y);
			ctx.lineTo(toPx, y);
			ctx.stroke();
			ctx.setLineDash([]);
			// Arrowhead
			const dir = Math.sign(toPx - fromPx) || 1;
			ctx.beginPath();
			ctx.moveTo(toPx - 7 * dir, y - 4);
			ctx.lineTo(toPx, y);
			ctx.lineTo(toPx - 7 * dir, y + 4);
			ctx.stroke();
			// Label
			ctx.fillStyle = color;
			ctx.font = 'italic 10px sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'bottom';
			ctx.fillText(label, (fromPx + toPx) / 2, y - 4);
		}

		function draw() {
			const bg = themeColor('#fff');
			ctx.clearRect(0, 0, CW, CH);
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, CW, CH);

			// ── Left panel: three time axes ──────────────
			drawTimeAxis(Y_I, 'sensor i', '#3b82f6');
			drawTimeAxis(Y_J, 'sensor j', '#f59e0b');
			drawTimeAxis(Y_K, 'sensor k', '#8b5cf6');

			const times = getTimes();

			// Draw strike markers on each sensor
			drawStrikeMarker(times.ti, Y_I, '#3b82f6', 'i');
			drawStrikeMarker(times.tj, Y_J, '#f59e0b', 'j');
			drawStrikeMarker(times.tk_from_ik, Y_K, '#8b5cf6', 'k');

			// Draw the "via j" prediction on the k axis as a ghost marker
			// so users see whether it lines up with the actual k marker.
			const gap = coherenceGap();
			if (Math.abs(gap) > 0.001) {
				const pxGhost = tToPx(times.tk_via_j);
				ctx.strokeStyle = '#ef4444';
				ctx.lineWidth = 1.5;
				ctx.setLineDash([3, 3]);
				ctx.beginPath();
				ctx.moveTo(pxGhost, Y_K - 22);
				ctx.lineTo(pxGhost, Y_K + 22);
				ctx.stroke();
				ctx.setLineDash([]);
				ctx.fillStyle = '#ef4444';
				ctx.font = 'bold 9px monospace';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'top';
				ctx.fillText(`α_ij∘α_jk → t=${times.tk_via_j.toFixed(2)}s`, pxGhost, Y_K + 22);
				// Gap indicator between the two k-times
				const pxDirect = tToPx(times.tk_from_ik);
				ctx.strokeStyle = '#ef4444';
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(pxDirect, Y_K);
				ctx.lineTo(pxGhost, Y_K);
				ctx.stroke();
				ctx.fillStyle = '#ef4444';
				ctx.font = 'bold 10px monospace';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'bottom';
				ctx.fillText(`Δ=${gap.toFixed(3)}s`, (pxDirect + pxGhost) / 2, Y_K - 4);
			}

			// Draw δ_ij and δ_jk shift arrows between the axes
			drawArrow(tToPx(times.ti), tToPx(times.tj), (Y_I + Y_J) / 2, '#3b82f6', `α_ij shift δ_ij=${state.delta_ij.toFixed(2)}s`);
			drawArrow(tToPx(times.tj), tToPx(times.tk_via_j), (Y_J + Y_K) / 2, '#f59e0b', `α_jk shift δ_jk=${state.delta_jk.toFixed(2)}s`);

			// ── Right panel: coherence square diagram ────
			drawCoherenceSquare();
		}

		function drawCoherenceSquare() {
			// A commuting-square diagram to the right of the time axes:
			//        α_ij
			//    i  ─────►  j
			//    │           │
			// α_ik           │ α_jk
			//    ▼           ▼
			//    k  ◄─────  (j-then-k)
			//         should equal α_ik
			const cx0 = 570, cy0 = 90;      // top-left node (i)
			const cx1 = 810, cy1 = 90;      // top-right node (j)
			const cx2 = 570, cy2 = 330;     // bottom-left node (k, via i→k)
			const cx3 = 810, cy3 = 330;     // bottom-right node (k, via i→j→k)

			const gap = coherenceGap();
			const commutes = Math.abs(gap) <= state.tolerance;
			const okColor = '#10b981';
			const badColor = '#ef4444';
			const edgeColor = commutes ? okColor : badColor;

			// Panel background
			ctx.fillStyle = themeColor('#f8fafc');
			ctx.strokeStyle = themeColor('#e2e8f0');
			ctx.lineWidth = 1;
			ctx.beginPath();
			if (ctx.roundRect) ctx.roundRect(540, 55, 320, 320, 10);
			else ctx.rect(540, 55, 320, 320);
			ctx.fill();
			ctx.stroke();

			// Title
			ctx.fillStyle = themeColor('#334155');
			ctx.font = 'bold 12px sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			ctx.fillText('Coherence square', (540 + 860) / 2, 62);

			// Draw nodes
			drawNode(cx0, cy0, 'i', '#3b82f6');
			drawNode(cx1, cy1, 'j', '#f59e0b');
			drawNode(cx2, cy2, 'k', '#8b5cf6');
			drawNode(cx3, cy3, 'k', '#8b5cf6');  // second copy: "k via j"

			// Edges with labels
			drawEdge(cx0, cy0, cx1, cy1, '#3b82f6', `α_ij (${state.delta_ij.toFixed(2)}s)`, 'top');
			drawEdge(cx1, cy1, cx3, cy3, '#f59e0b', `α_jk (${state.delta_jk.toFixed(2)}s)`, 'right');
			drawEdge(cx0, cy0, cx2, cy2, '#8b5cf6', `α_ik (${state.delta_ik.toFixed(2)}s)`, 'left');

			// Bottom equivalence edge between the two k copies
			ctx.strokeStyle = edgeColor;
			ctx.lineWidth = 2.5;
			ctx.setLineDash(commutes ? [] : [6, 4]);
			ctx.beginPath();
			ctx.moveTo(cx2 + 22, cy2);
			ctx.lineTo(cx3 - 22, cy3);
			ctx.stroke();
			ctx.setLineDash([]);
			// Double-arrow tips (2-morphism)
			ctx.beginPath();
			ctx.moveTo(cx3 - 22 - 7, cy3 - 4);
			ctx.lineTo(cx3 - 22, cy3);
			ctx.lineTo(cx3 - 22 - 7, cy3 + 4);
			ctx.moveTo(cx3 - 22 - 10, cy3 - 4);
			ctx.lineTo(cx3 - 22 - 3, cy3);
			ctx.lineTo(cx3 - 22 - 10, cy3 + 4);
			ctx.stroke();

			// Label the 2-morphism
			ctx.fillStyle = edgeColor;
			ctx.font = 'italic bold 11px sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			ctx.fillText(commutes ? '≃ (coherent)' : '≄ (incoherent)', (cx2 + cx3) / 2, cy2 + 8);

			// Big verdict emoji in the centre of the square
			ctx.fillStyle = commutes ? okColor : badColor;
			ctx.font = 'bold 46px sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(commutes ? '✓' : '✗', (cx0 + cx3) / 2, (cy0 + cy3) / 2);

			// Small gap readout
			ctx.fillStyle = themeColor('#334155');
			ctx.font = '10px monospace';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			ctx.fillText(`gap = δ_ik − (δ_ij+δ_jk) = ${gap.toFixed(3)}s`, (cx0 + cx3) / 2, (cy0 + cy3) / 2 + 32);
			ctx.fillText(`tolerance ε = ${state.tolerance.toFixed(3)}s`, (cx0 + cx3) / 2, (cy0 + cy3) / 2 + 46);
		}

		function drawNode(cx, cy, label, color) {
			ctx.fillStyle = themeColor('#fff');
			ctx.strokeStyle = color;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(cx, cy, 20, 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = color;
			ctx.font = 'bold 15px serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(label, cx, cy);
		}

		function drawEdge(x0, y0, x1, y1, color, label, side) {
			// Trim to node radius
			const r = 22;
			const dx = x1 - x0, dy = y1 - y0;
			const len = Math.hypot(dx, dy);
			const ux = dx / len, uy = dy / len;
			const fx = x0 + ux * r, fy = y0 + uy * r;
			const tx = x1 - ux * r, ty = y1 - uy * r;

			ctx.strokeStyle = color;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(fx, fy);
			ctx.lineTo(tx, ty);
			ctx.stroke();

			// Arrowhead
			const ang = Math.atan2(uy, ux);
			ctx.beginPath();
			ctx.moveTo(tx, ty);
			ctx.lineTo(tx - 8 * Math.cos(ang - 0.4), ty - 8 * Math.sin(ang - 0.4));
			ctx.moveTo(tx, ty);
			ctx.lineTo(tx - 8 * Math.cos(ang + 0.4), ty - 8 * Math.sin(ang + 0.4));
			ctx.stroke();

			// Label position
			let lx = (fx + tx) / 2, ly = (fy + ty) / 2;
			if (side === 'top') ly -= 10;
			else if (side === 'right') lx += 10;
			else if (side === 'left') lx -= 10;
			ctx.fillStyle = color;
			ctx.font = 'italic 10px sans-serif';
			ctx.textAlign = side === 'left' ? 'right' : (side === 'right' ? 'left' : 'center');
			ctx.textBaseline = 'middle';
			ctx.fillText(label, lx, ly);
		}

		// ── Status update ──────────────────────────────

		function updateStatus() {
			const gap = coherenceGap();
			const commutes = Math.abs(gap) <= state.tolerance;
			if (commutes) {
				statusBox.style.background = themeColor('#ecfdf5');
				statusBox.style.borderLeft = '4px solid #10b981';
				statusBox.style.color = themeColor('#064e3b');
				statusBox.innerHTML = `<strong>&#10003; The triangle commutes.</strong> The two ways of going from sensor <em>i</em> to sensor <em>k</em> agree within tolerance: the direct equivalence ${mathInline('\\alpha_{ik}')} matches the composite ${mathInline('\\alpha_{ij} \\circ \\alpha_{jk}')} to within ${mathInline('|\\Delta| = ' + Math.abs(gap).toFixed(4) + ' \\leq \\varepsilon = ' + state.tolerance.toFixed(3))}. All three sensors share a coherent story about when the strike happened.`;
			} else {
				statusBox.style.background = themeColor('#fef2f2');
				statusBox.style.borderLeft = '4px solid #ef4444';
				statusBox.style.color = themeColor('#7f1d1d');
				statusBox.innerHTML = `<strong>&#10007; The triangle does not commute.</strong> Going from <em>i</em> to <em>k</em> via <em>j</em> gives a time-shift of ${mathInline((state.delta_ij + state.delta_jk).toFixed(3) + '\\text{s}')}, but the direct equivalence ${mathInline('\\alpha_{ik}')} gives ${mathInline(state.delta_ik.toFixed(3) + '\\text{s}')} — a gap of ${mathInline('\\Delta = ' + gap.toFixed(4) + '\\text{s}')} which exceeds the tolerance ${mathInline('\\varepsilon = ' + state.tolerance.toFixed(3))}. The three sensors <em>cannot</em> be glued into a single coherent global event: the sheaf-with-coherence axiom fails on the triple overlap.`;
			}
			renderMathIn(statusBox);
		}

		// ── Wire up UI ─────────────────────────────────

		const ijSlider = root.querySelector('#hc-ij');
		const jkSlider = root.querySelector('#hc-jk');
		const ikSlider = root.querySelector('#hc-ik');
		const tolSlider = root.querySelector('#hc-tol');
		const ijVal = root.querySelector('#hc-ij-val');
		const jkVal = root.querySelector('#hc-jk-val');
		const ikVal = root.querySelector('#hc-ik-val');
		const tolVal = root.querySelector('#hc-tol-val');

		function refresh() {
			ijVal.textContent = state.delta_ij.toFixed(2);
			jkVal.textContent = state.delta_jk.toFixed(2);
			ikVal.textContent = state.delta_ik.toFixed(2);
			tolVal.textContent = state.tolerance.toFixed(3);
			draw();
			updateStatus();
		}

		ijSlider.addEventListener('input', () => {
			state.delta_ij = parseFloat(ijSlider.value);
			refresh();
		});
		jkSlider.addEventListener('input', () => {
			state.delta_jk = parseFloat(jkSlider.value);
			refresh();
		});
		ikSlider.addEventListener('input', () => {
			state.delta_ik = parseFloat(ikSlider.value);
			refresh();
		});
		tolSlider.addEventListener('input', () => {
			state.tolerance = parseFloat(tolSlider.value);
			refresh();
		});

		root.querySelector('#hc-fix').addEventListener('click', () => {
			state.delta_ik = state.delta_ij + state.delta_jk;
			// Clamp to slider range
			if (state.delta_ik > 3) state.delta_ik = 3;
			if (state.delta_ik < -3) state.delta_ik = -3;
			ikSlider.value = state.delta_ik;
			refresh();
		});

		root.querySelector('#hc-break').addEventListener('click', () => {
			// Push δ_ik far away from the coherent value
			const coherent = state.delta_ij + state.delta_jk;
			state.delta_ik = coherent + (coherent >= 0 ? -0.9 : 0.9);
			if (state.delta_ik > 3) state.delta_ik = 3;
			if (state.delta_ik < -3) state.delta_ik = -3;
			ikSlider.value = state.delta_ik;
			refresh();
		});

		root.querySelector('#hc-reset').addEventListener('click', () => {
			state.delta_ij = 0.30;
			state.delta_jk = 0.45;
			state.delta_ik = 0.75;
			state.tolerance = 0.05;
			ijSlider.value = state.delta_ij;
			jkSlider.value = state.delta_jk;
			ikSlider.value = state.delta_ik;
			tolSlider.value = state.tolerance;
			refresh();
		});

		// Initial paint
		refresh();
		onThemeChange(refresh);
	}

	// ═══════════════════════════════════════════════════════════════
	//   PUBLIC EXPORT + AUTO-INIT
	// ═══════════════════════════════════════════════════════════════

	window.renderSheafGluing = renderSheafGluing;
	window.renderHomotopyCoherence = renderHomotopyCoherence;

	function mountDemos() {
		const g = document.getElementById('sheaf-gluing-container');
		if (g) { try { renderSheafGluing(g); } catch (e) { console.error(e); } }
		const h = document.getElementById('homotopy-coherence-container');
		if (h) { try { renderHomotopyCoherence(h); } catch (e) { console.error(e); } }
	}

	// Mount AFTER renderMarkdown() has finished. DOMContentLoaded is too
	// early: the outer .md container's innerHTML gets rewritten later in
	// runPostLoad(), which destroys the canvas we draw into and leaves
	// the visible container with an empty <canvas>. The blogPostLoadComplete
	// event (dispatched at the end of runPostLoad in functions.php) fires
	// once everything is settled, so mounting here gives the demos a DOM
	// that survives the rest of the post-load pipeline.
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function () {
			window.addEventListener('blogPostLoadComplete', mountDemos, { once: true });
		});
	} else {
		window.addEventListener('blogPostLoadComplete', mountDemos, { once: true });
	}
})();
