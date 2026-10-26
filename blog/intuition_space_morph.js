(function () {
	"use strict";

	const DUR = 1000;
	const TAU = Math.PI * 2;

	let wrap = null;
	let canvas = null;
	let ctx = null;
	let W = 0, H = 0, DPR = 1;
	let visible = false;
	let rafId = 0;
	let inited = false;
	let cur = 0, prevIdx = 0, t0 = 0;
	let viewA = 0, viewB = -Math.PI / 2;
	let dragA = 0, dragB = 0, dragging = false, lastX = 0, lastY = 0;
	let FIT = 1, YOFF = 0;

	let rng = 42;
	const rnd = () => (rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
	const PTS = [];
	for (let i = 0; i < 140; i++) {
		const a = rnd() * TAU, r = Math.sqrt(rnd()) * 0.40;
		PTS.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, c: 0 });
	}
	for (let i = 0; i < 220; i++) {
		const a = rnd() * TAU, r = 0.82 + Math.sqrt(rnd()) * 0.26;
		PTS.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, c: 1 });
	}

	const KZ = 1.15, KB = 0.40, PLANE_Z = 0.18;
	const SCORE = (x, y) => (x * x + y * y) * KZ - KB - PLANE_Z;
	const SMIN = -0.62, SMAX = 1.05;
	const LIFT = (x, y, t) => {
		const r2 = x * x + y * y;
		return {
			x: x * (1 - 0.12 * t * r2),
			y: y * (1 - 0.12 * t * r2),
			z: (r2 * KZ - KB) * t
		};
	};

	const SCENES = [
		{
			title: "Two classes, no straight line",
			body: "An inner core of red points sits inside a blue ring. No straight line separates them: any line drawn across the plane has to cut through the ring.",
			lift: 0, camA: 0, camB: -Math.PI / 2, persp: 0, plane: 0, squash: 0, fail: 0, labels: 0, project: 0, box: 0
		},
		{
			title: "Every straight cut fails",
			body: "A linear classifier draws a straight line. Around a closed ring, every line leaves points of both classes on both sides. The obstruction is topological, not a matter of finding a better angle.",
			lift: 0, camA: 0, camB: -Math.PI / 2, persp: 0, plane: 0, squash: 0, fail: 1, labels: 0, project: 0, box: 0
		},
		{
			title: "One more dimension of room",
			body: "Keep the old plane as a floor and open a third axis above it. The data has not changed; the space it lives in has. That extra room is the raw material every layer works with.",
			lift: 0, camA: 0.38, camB: -0.62, persp: 1, plane: 0, squash: 0, fail: 0, labels: 0, project: 0, box: 1
		},
		{
			title: "The layer bends space",
			body: "The layer lifts the grid into a bowl: z = r². Inside the ring sinks, outside it rises. The bend is smooth and reversible. It stretches the space without tearing it or gluing distinct points together.",
			lift: 1, camA: 0, camB: 0, persp: 1, plane: 0, squash: 0, fail: 0, labels: 0, project: 0, box: 0
		},
		{
			title: "A flat plane fits between",
			body: "Nothing was added to the data and no class was moved. The curved space now has a gap, and one flat plane slides cleanly between the two classes.",
			lift: 1, camA: 0, camB: 0, persp: 1, plane: 1, squash: 0, fail: 0, labels: 0, project: 0, box: 0
		},
		{
			title: "The plane becomes a line",
			body: "Look edge-on and squeeze the separating plane along the view direction. The sheet collapses to a line without changing which points lie on which side.",
			lift: 1, camA: 0, camB: 0, persp: 1, plane: 1, squash: 1, fail: 0, labels: 1, project: 0, box: 0
		},
		{
			title: "Space collapses to a line",
			body: "Now collapse the whole space the same way. Every point keeps its side of the boundary, and the classifier becomes one threshold on a one-dimensional score: s = 0.",
			lift: 1, camA: 0, camB: 0, persp: 1, plane: 0, squash: 1, fail: 0, labels: 0, project: 1, box: 0
		}
	];

	const ease = u => u * u * u * (u * (u * 6 - 15) + 10);
	const lerp = (a, b, u) => a + (b - a) * u;
	const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
	const sub = (t, a, b) => ease(clamp((t - a) / (b - a), 0, 1));

	function palette() {
		return {
			text: cssVar("--mn-heading") || "#0f172a",
			sub: cssVar("--mn-text-secondary") || "#475569",
			muted: cssVar("--mn-text-muted") || "#94a3b8",
			border: cssVar("--mn-border") || "#cbd5e1",
			grid: themeColor("#64748b"),
			inner: themeColor("#ef4444"),
			outer: themeColor("#3b82f6"),
			plane: themeColor("#f59e0b"),
			planeStrong: themeColor("#d97706"),
			axis: themeColor("#94a3b8"),
			axisZero: themeColor("#d97706")
		};
	}

	function copyEl(id) {
		return document.getElementById(id);
	}

	function renderCopy() {
		const s = SCENES[cur];
		const title = copyEl("ism-title");
		const body = copyEl("ism-body");
		const counter = copyEl("ism-counter");
		if (title) title.textContent = s.title;
		if (body) body.textContent = s.body;
		if (counter) counter.textContent = (cur + 1) + " / " + SCENES.length;

		const dots = copyEl("ism-dots");
		if (!dots) return;
		Array.prototype.forEach.call(dots.children, (dot, i) => {
			dot.classList.toggle("is-active", i === cur);
			dot.setAttribute("aria-current", i === cur ? "step" : "false");
		});
	}

	function setStep(n) {
		n = clamp(n, 0, SCENES.length - 1);
		if (n === cur) return;
		prevIdx = cur;
		cur = n;
		t0 = performance.now();
		renderCopy();
		requestDraw();
	}

	function next() {
		setStep(cur + 1);
	}

	function prev() {
		setStep(cur - 1);
	}

	function buildDots() {
		const dots = copyEl("ism-dots");
		if (!dots) return;
		SCENES.forEach(scene => {
			const dot = document.createElement("span");
			dot.className = "ism-dot";
			dot.title = scene.title;
			dots.appendChild(dot);
		});
	}

	function base() {
		return Math.min(W, H) * 0.30;
	}

	function proj(p) {
		const A = viewA + dragA;
		const B = viewB + dragB;
		const scale = base() * FIT;
		const x = p.x * Math.cos(A) - p.y * Math.sin(A);
		const y = p.x * Math.sin(A) + p.y * Math.cos(A);
		const y2 = -y * Math.sin(B) + p.z * Math.cos(B);
		const z2 = y * Math.cos(B) + p.z * Math.sin(B);
		const d = 4.6;
		const k = persp < 0.02 ? 1 : d / (d + z2 * 0.80 * persp);
		return { X: W / 2 + x * scale * k, Y: H / 2 - y2 * scale * k + YOFF, d: z2, k: k };
	}

	let persp = 1;
	let AX_Y = 0, AX_L = 0, AX_R = 0;

	function axisGeom() {
		AX_Y = H * 0.80;
		const scale = base();
		AX_L = W / 2 - scale * 1.05;
		AX_R = W / 2 + scale * 1.05;
	}

	const sx = score => AX_L + (AX_R - AX_L) * clamp((score - SMIN) / (SMAX - SMIN), 0, 1);

	function warp(x, y, lift, project) {
		const p = proj(LIFT(x, y, lift));
		if (project < 0.0005) return { X: p.X, Y: p.Y, k: p.k };
		const tx = sx(SCORE(x, y));
		const ty = AX_Y - 46 * (1 - project);
		const arc = Math.sin(project * Math.PI) * 34;
		return {
			X: lerp(p.X, tx, project),
			Y: lerp(p.Y, ty, project) - arc,
			k: lerp(p.k, 1, project)
		};
	}

	function drawBox(alpha, C) {
		if (alpha < 0.01) return;
		const E = 1.12, ZT = 1.35, G = 10;

		ctx.globalAlpha = alpha * 0.40;
		ctx.strokeStyle = C.axis;
		ctx.lineWidth = 0.9;
		for (let i = 0; i <= G; i++) {
			const v = -E + 2 * E * i / G;
			let p = proj({ x: -E, y: v, z: 0 });
			let q = proj({ x: E, y: v, z: 0 });
			ctx.beginPath();
			ctx.moveTo(p.X, p.Y);
			ctx.lineTo(q.X, q.Y);
			ctx.stroke();
			p = proj({ x: v, y: -E, z: 0 });
			q = proj({ x: v, y: E, z: 0 });
			ctx.beginPath();
			ctx.moveTo(p.X, p.Y);
			ctx.lineTo(q.X, q.Y);
			ctx.stroke();
		}

		ctx.globalAlpha = alpha * 0.35;
		ctx.strokeStyle = C.axis;
		ctx.setLineDash([2, 6]);
		[0.45, 0.90].forEach(zv => {
			const s = 0.42;
			const r = [
				proj({ x: -s, y: -s, z: zv }),
				proj({ x: s, y: -s, z: zv }),
				proj({ x: s, y: s, z: zv }),
				proj({ x: -s, y: s, z: zv })
			];
			ctx.beginPath();
			ctx.moveTo(r[0].X, r[0].Y);
			for (let i = 1; i < 4; i++) ctx.lineTo(r[i].X, r[i].Y);
			ctx.closePath();
			ctx.stroke();
		});
		ctx.setLineDash([]);

		ctx.globalAlpha = alpha * 0.85;
		ctx.strokeStyle = C.sub;
		ctx.lineWidth = 1.6;
		const o = proj({ x: 0, y: 0, z: 0 });
		const tp = proj({ x: 0, y: 0, z: ZT });
		ctx.beginPath();
		ctx.moveTo(o.X, o.Y);
		ctx.lineTo(tp.X, tp.Y);
		ctx.stroke();

		ctx.fillStyle = C.sub;
		ctx.beginPath();
		ctx.moveTo(tp.X, tp.Y - 1);
		ctx.lineTo(tp.X - 4.5, tp.Y + 11);
		ctx.lineTo(tp.X + 4.5, tp.Y + 11);
		ctx.closePath();
		ctx.fill();

		ctx.lineWidth = 1.2;
		[0.45, 0.90].forEach(zv => {
			const m = proj({ x: 0, y: 0, z: zv });
			ctx.beginPath();
			ctx.moveTo(m.X - 5, m.Y);
			ctx.lineTo(m.X + 5, m.Y);
			ctx.stroke();
		});
		ctx.font = "italic 16px Georgia, serif";
		ctx.fillStyle = C.sub;
		ctx.fillText("z", tp.X + 12, tp.Y + 5);
		ctx.globalAlpha = 1;
	}

	function drawAxis(alpha, C) {
		if (alpha < 0.01) return;
		ctx.globalAlpha = alpha;
		ctx.strokeStyle = C.axis;
		ctx.lineWidth = 1.6;
		ctx.beginPath();
		ctx.moveTo(AX_L, AX_Y);
		ctx.lineTo(AX_R, AX_Y);
		ctx.stroke();
		for (let i = 0; i <= 10; i++) {
			const X = lerp(AX_L, AX_R, i / 10);
			ctx.beginPath();
			ctx.moveTo(X, AX_Y - 4);
			ctx.lineTo(X, AX_Y + 4);
			ctx.stroke();
		}
		const TX = sx(0);
		ctx.strokeStyle = C.axisZero;
		ctx.lineWidth = 2.6;
		ctx.beginPath();
		ctx.moveTo(TX, AX_Y - 36);
		ctx.lineTo(TX, AX_Y + 36);
		ctx.stroke();

		ctx.textAlign = "center";
		ctx.fillStyle = C.planeStrong;
		ctx.font = "13px Georgia, serif";
		ctx.fillText("s = 0", TX, AX_Y + 58);
		ctx.font = "600 13px system-ui, sans-serif";
		ctx.fillStyle = C.inner;
		ctx.fillText("s < 0   inner core", lerp(AX_L, TX, 0.40), AX_Y + 58);
		ctx.fillStyle = C.outer;
		ctx.fillText("s > 0   outer ring", lerp(TX, AX_R, 0.55), AX_Y + 58);
		ctx.textAlign = "left";
		ctx.globalAlpha = 1;
	}

	function gridSegments(lift, project) {
		const N = 14, EXT = 1.12, RES = 64;
		const out = [];
		for (let i = 0; i <= N; i++) {
			const v = -EXT + 2 * EXT * i / N;
			for (const swap of [0, 1]) {
				const pts = [];
				for (let j = 0; j <= RES; j++) {
					const u = -EXT + 2 * EXT * j / RES;
					pts.push(warp(swap ? v : u, swap ? u : v, lift, project));
				}
				out.push(pts);
			}
		}
		return out;
	}

	function drawFailedLines(alpha, C) {
		if (alpha < 0.01) return;
		ctx.globalAlpha = alpha * 0.7;
		ctx.lineWidth = 1.6;
		ctx.strokeStyle = C.muted;
		ctx.setLineDash([5, 5]);
		for (let k = 0; k < 5; k++) {
			const t = k * 0.63 + 0.2;
			const p = proj({ x: Math.cos(t) * -1.2, y: Math.sin(t) * -1.2, z: 0 });
			const q = proj({ x: Math.cos(t) * 1.2, y: Math.sin(t) * 1.2, z: 0 });
			ctx.beginPath();
			ctx.moveTo(p.X, p.Y);
			ctx.lineTo(q.X, q.Y);
			ctx.stroke();
		}
		ctx.setLineDash([]);
		ctx.globalAlpha = 1;
	}

	function drawShadow(alpha, C) {
		if (alpha < 0.01) return;
		ctx.globalAlpha = alpha * 0.30;
		ctx.fillStyle = C.text;
		PTS.forEach(p => {
			const s = proj({ x: p.x, y: p.y, z: 0 });
			ctx.beginPath();
			ctx.ellipse(s.X, s.Y, 3.2 * s.k, 1.5 * s.k, 0, 0, TAU);
			ctx.fill();
		});
		ctx.globalAlpha = 1;
	}

	function planeRows(plane, squash) {
		const E = 0.92, M = 7, rows = [];
		for (let i = 0; i <= M; i++) {
			const yv = (-E + 2 * E * i / M) * (1 - squash);
			const row = [];
			for (let j = 0; j <= M; j++) {
				row.push(proj({ x: -E + 2 * E * j / M, y: yv, z: PLANE_Z }));
			}
			rows.push(row);
		}
		return rows;
	}

	function drawPlane(it, C) {
		const R = it.rows;
		const M = R.length - 1;

		ctx.globalAlpha = it.a * 0.17 * (1 - it.squash);
		ctx.fillStyle = C.plane;
		ctx.beginPath();
		ctx.moveTo(R[0][0].X, R[0][0].Y);
		for (let j = 1; j <= M; j++) ctx.lineTo(R[0][j].X, R[0][j].Y);
		for (let j = M; j >= 0; j--) ctx.lineTo(R[M][j].X, R[M][j].Y);
		ctx.closePath();
		ctx.fill();

		ctx.globalAlpha = it.a * 0.42 * (1 - it.squash);
		ctx.strokeStyle = C.plane;
		ctx.lineWidth = 1;
		for (let i = 0; i <= M; i++) {
			ctx.beginPath();
			R[i].forEach((p, j) => j ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y));
			ctx.stroke();
		}
		for (let j = 0; j <= M; j++) {
			ctx.beginPath();
			for (let i = 0; i <= M; i++) {
				const p = R[i][j];
				i ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y);
			}
			ctx.stroke();
		}

		const mid = R[Math.floor(M / 2)];
		ctx.globalAlpha = it.a * (0.45 + 0.55 * it.squash);
		ctx.lineWidth = 1.4 + 2.4 * it.squash;
		ctx.strokeStyle = C.planeStrong;
		ctx.beginPath();
		mid.forEach((p, j) => j ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y));
		ctx.stroke();
		ctx.globalAlpha = 1;
	}

	function drawClassLabels(alpha, C) {
		if (alpha < 0.01) return;
		const c0 = proj({ x: 0, y: 0, z: PLANE_Z });
		const LX = Math.min(W - 16, W / 2 + base() * FIT * 1.12);
		ctx.globalAlpha = alpha;
		ctx.textAlign = "right";
		ctx.font = "600 14px system-ui, sans-serif";
		ctx.fillStyle = C.outer;
		ctx.fillText("Class B — outer ring", LX, c0.Y - 58);
		ctx.fillStyle = C.inner;
		ctx.fillText("Class A — inner core", LX, c0.Y + 66);
		ctx.fillStyle = C.planeStrong;
		ctx.font = "13px Georgia, serif";
		ctx.fillText("separating plane", LX, c0.Y + 4);
		ctx.textAlign = "left";
		ctx.globalAlpha = 1;
	}

	function draw(raw) {
		if (!ctx || !W || !H) return;

		const a = SCENES[prevIdx];
		const b = SCENES[cur];
		const u = ease(raw);

		const lift = lerp(a.lift, b.lift, u);
		persp = lerp(a.persp, b.persp, u);
		viewA = lerp(a.camA, b.camA, u);
		viewB = lerp(a.camB, b.camB, u);

		const flat = 1 - clamp(Math.abs(viewB + dragB) / (Math.PI / 2), 0, 1);
		FIT = lerp(1, 0.34, flat);
		YOFF = lerp(0, H * 0.10, flat);

		const planeAlpha = lerp(a.plane, b.plane, u);
		const squash = lerp(a.squash, b.squash, u);
		const fail = lerp(a.fail, b.fail, u);
		const labels = lerp(a.labels, b.labels, u);
		const box = lerp(a.box, b.box, u);

		const projectRaw = lerp(a.project, b.project, raw);
		const forward = b.project > a.project;
		const project = forward ? sub(projectRaw, 0, 1) : 1 - sub(1 - projectRaw, 0, 1);
		const axisAlpha = forward ? sub(projectRaw, 0.05, 0.5) : 1 - sub(1 - projectRaw, 0.05, 0.5);

		const C = palette();
		ctx.clearRect(0, 0, W, H);
		axisGeom();

		drawBox(box, C);
		drawAxis(axisAlpha, C);

		const gridAlpha = (0.22 + 0.24 * lift) * (1 - project * 0.35);
		ctx.lineWidth = 1;
		ctx.strokeStyle = C.grid;
		ctx.globalAlpha = gridAlpha;
		gridSegments(lift, project).forEach(segment => {
			ctx.beginPath();
			segment.forEach((p, i) => i ? ctx.lineTo(p.X, p.Y) : ctx.moveTo(p.X, p.Y));
			ctx.stroke();
		});
		ctx.globalAlpha = 1;

		drawFailedLines(fail, C);
		if (box > 0.01 && lift < 0.5) drawShadow(box, C);

		const items = [];
		PTS.forEach(p => {
			const P = warp(p.x, p.y, lift, project);
			const depth = proj(LIFT(p.x, p.y, lift)).d;
			items.push({ type: "point", depth: depth, at: P, c: p.c });
		});

		if (planeAlpha > 0.01) {
			items.push({
				type: "plane",
				depth: PLANE_Z,
				rows: planeRows(planeAlpha, squash),
				a: planeAlpha,
				squash: squash
			});
		}

		items.sort((p, q) => p.depth - q.depth);
		items.forEach(item => {
			if (item.type === "plane") {
				drawPlane(item, C);
				return;
			}
			const r = (2.8 + 0.7 * item.at.k) * item.at.k;
			ctx.beginPath();
			ctx.arc(item.at.X, item.at.Y, r, 0, TAU);
			ctx.fillStyle = item.c ? C.outer : C.inner;
			ctx.globalAlpha = 0.55 + 0.45 * item.at.k;
			ctx.fill();
			ctx.globalAlpha = 1;
		});

		drawClassLabels(labels, C);
	}

	function resizeCanvas() {
		if (!wrap || !canvas) return;
		const rect = wrap.getBoundingClientRect();
		if (rect.width < 40 || rect.height < 40) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		if (Math.abs(rect.width - W) < 0.5 && Math.abs(rect.height - H) < 0.5 && dpr === DPR) return;
		W = rect.width;
		H = rect.height;
		DPR = dpr;
		canvas.width = Math.round(W * DPR);
		canvas.height = Math.round(H * DPR);
		ctx = canvas.getContext("2d");
		if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
	}

	function frame(now) {
		rafId = 0;
		if (!visible) return;
		resizeCanvas();
		const raw = clamp((now - t0) / DUR, 0, 1);
		draw(raw);
		if (raw < 1) requestDraw();
	}

	function requestDraw() {
		if (!visible || rafId) return;
		rafId = requestAnimationFrame(frame);
	}

	function endDrag(event) {
		if (!dragging) return;
		dragging = false;
		if (canvas) {
			canvas.classList.remove("is-dragging");
			if (canvas.hasPointerCapture && canvas.hasPointerCapture(event.pointerId)) {
				canvas.releasePointerCapture(event.pointerId);
			}
		}
		requestDraw();
	}

	function bindDrag() {
		if (!canvas) return;
		canvas.addEventListener("pointerdown", event => {
			dragging = true;
			lastX = event.clientX;
			lastY = event.clientY;
			canvas.classList.add("is-dragging");
			if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
		});
		canvas.addEventListener("pointermove", event => {
			if (!dragging) return;
			dragA += (event.clientX - lastX) * 0.006;
			dragB += (event.clientY - lastY) * 0.005;
			lastX = event.clientX;
			lastY = event.clientY;
			requestDraw();
		});
		canvas.addEventListener("pointerup", endDrag);
		canvas.addEventListener("pointercancel", endDrag);
	}

	function observe() {
		if (!("IntersectionObserver" in window) || !wrap) {
			visible = true;
			t0 = performance.now();
			requestDraw();
			return;
		}
		const observer = new IntersectionObserver(entries => {
			visible = entries.some(entry => entry.isIntersecting);
			if (visible) {
				prevIdx = cur;
				t0 = performance.now();
				requestDraw();
			} else {
				if (rafId) {
					cancelAnimationFrame(rafId);
					rafId = 0;
				}
			}
		}, { rootMargin: "200px", threshold: 0.05 });
		observer.observe(wrap);
	}

	function init() {
		if (inited) return;
		wrap = document.getElementById("ism-wrap");
		canvas = document.getElementById("ism-canvas");
		if (!wrap || !canvas) return;
		inited = true;
		ctx = canvas.getContext("2d");
		buildDots();
		renderCopy();
		bindDrag();

		const nextBtn = copyEl("ism-next");
		const prevBtn = copyEl("ism-prev");
		if (nextBtn) nextBtn.addEventListener("click", next);
		if (prevBtn) prevBtn.addEventListener("click", prev);

		window.addEventListener("resize", requestDraw);
		if (window.ResizeObserver) new ResizeObserver(requestDraw).observe(wrap);
		if (window.__MN_DARK && window.__MN_DARK.onChange) {
			window.__MN_DARK.onChange(requestDraw);
		}
		observe();
	}

	window.IntuitionSpaceMorph = { init: init, next: next, prev: prev, reset: () => setStep(0) };
})();

function loadIntuitionSpaceMorphModule() {
	if (typeof updateLoadingStatus === "function") {
		updateLoadingStatus("Loading section about bending space...");
	}
	if (window.IntuitionSpaceMorph) window.IntuitionSpaceMorph.init();
}
