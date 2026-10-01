/**
 * Loss Landscape 3-D widget — a tiny non-convex surface
 * one wide basin (generalizing) + one narrow spike (sharp/memorizing)
 * ball follows -∇L with optional mini-batch noise
 */
"use strict";

var LossLandscape3D = (function () {
	const N = 41;
	const W_RANGE = [-3, 3];
	let L = [];                 // loss surface
	let gradX = [], gradY = []; // gradients
	let ball = { x: 2.4, y: -2.4 };
	let lr = 0.08;
	let noise = false;
	let path = [];
	let running = false;
	let surfaceData, currentTrace, pathTrace;
	let container;

	function loss(x, y) {
		const wideBowl  = 0.20 * (x * x + y * y) - 0.55 * Math.exp(-((x - 0.4) * (x - 0.4) + (y + 0.3) * (y + 0.3)) * 1.4);
		const sharpSpike = -1.40 * Math.exp(-((x + 1.3) * (x + 1.3) + (y - 1.1) * (y - 1.1)) * 5.5);
		return wideBowl + sharpSpike;
	}

	function dLdx(x, y) {
		const h = 1e-4;
		return (loss(x + h, y) - loss(x - h, y)) / (2 * h);
	}
	function dLdy(x, y) {
		const h = 1e-4;
		return (loss(x, y + h) - loss(x, y - h)) / (2 * h);
	}

	function buildSurface() {
		const xs = [], ys = [], z = [];
		const step = (W_RANGE[1] - W_RANGE[0]) / (N - 1);
		for (let i = 0; i < N; i++) {
			xs.push(W_RANGE[0] + i * step);
			ys.push(W_RANGE[0] + i * step);
		}
		for (let i = 0; i < N; i++) {
			const row = [];
			for (let j = 0; j < N; j++) {
				row.push(loss(xs[i], ys[j]));
			}
			z.push(row);
		}
		L = z;
		return { x: xs, y: ys, z: z };
	}

	function buildGradients() {
		const step = (W_RANGE[1] - W_RANGE[0]) / (N - 1);
		for (let i = 0; i < N; i++) {
			const x = W_RANGE[0] + i * step;
			gradX.push([]); gradY.push([]);
			for (let j = 0; j < N; j++) {
				const y = W_RANGE[0] + j * step;
				gradX[i].push(dLdx(x, y));
				gradY[i].push(dLdy(x, y));
			}
		}
	}

	function plot() {
		container = document.getElementById("loss-landscape-3d");
		if (!container) return;

		surfaceData = [{
			x: buildSurface().x,
			y: buildSurface().y,
			z: L,
			type: "surface",
			colorscale: "Viridis",
			opacity: 0.85,
			showscale: false,
			contours: { z: { show: true, usecolormap: true, highlightcolor: "#fff", project: { z: false } } },
			hovertemplate: "x: %{x:.2f}<br>y: %{y:.2f}<br>L: %{z:.2f}<extra></extra>"
		}];

		currentTrace = {
			x: [ball.x], y: [ball.y], z: [loss(ball.x, ball.y) + 0.02],
			mode: "markers+text", type: "scatter3d",
			marker: { size: 9, color: "#ef4444", symbol: "diamond", line: { color: "white", width: 2 } },
			text: ["ball"], textposition: "top center", textfont: { color: "#ef4444", size: 11 },
			hovertemplate: "ball @ (%{x:.2f}, %{y:.2f})<br>L = %{z:.2f}<extra></extra>"
		};

		pathTrace = {
			x: [], y: [], z: [], mode: "lines", type: "scatter3d",
			line: { color: "#fbbf24", width: 4 }, hoverinfo: "skip"
		};

		const layout = {
			scene: {
				xaxis: { title: "w₁", range: W_RANGE, backgroundcolor: "rgba(0,0,0,0)" },
				yaxis: { title: "w₂", range: W_RANGE, backgroundcolor: "rgba(0,0,0,0)" },
				zaxis: { title: "L", backgroundcolor: "rgba(0,0,0,0)" },
				camera: { eye: { x: 1.5, y: 1.5, z: 0.9 } },
				aspectratio: { x: 1, y: 1, z: 0.6 }
			},
			margin: { l: 0, r: 0, b: 0, t: 0 },
			paper_bgcolor: "rgba(0,0,0,0)",
			showlegend: false
		};

		Plotly.newPlot(container, [surfaceData, currentTrace, pathTrace], layout, { displayModeBar: false, responsive: true });

		container.on("plotly_click", function (ev) {
			if (running) return;
			const pt = ev.points[0];
			if (pt.x === undefined || pt.y === undefined) return;
			ball.x = pt.x; ball.y = pt.y;
			path = [];
			updateBall();
			updateStatus();
		});
	}

	function updateBall() {
		Plotly.restyle(container, {
			x: [[ball.x]], y: [[ball.y]], z: [[loss(ball.x, ball.y) + 0.02]]
		}, [1]);
		if (path.length > 0) {
			Plotly.restyle(container, {
				x: [path.map(p => p.x)],
				y: [path.map(p => p.y)],
				z: [path.map(p => loss(p.x, p.y) + 0.015)]
			}, [2]);
		}
	}

	function updateStatus() {
		const el = document.getElementById("ll-status");
		if (!el) return;
		const Lhere = loss(ball.x, ball.y);
		const gradNorm = Math.sqrt(dLdx(ball.x, ball.y) ** 2 + dLdy(ball.x, ball.y) ** 2);
		el.innerHTML = `L = <b>${Lhere.toFixed(3)}</b>, |∇L| = ${gradNorm.toFixed(3)}, step ${path.length}`;
	}

	function step() {
		let gx = dLdx(ball.x, ball.y);
		let gy = dLdy(ball.x, ball.y);
		if (noise) {
			gx += (Math.random() - 0.5) * 0.6;
			gy += (Math.random() - 0.5) * 0.6;
		}
		ball.x -= lr * gx;
		ball.y -= lr * gy;
		if (ball.x < W_RANGE[0]) ball.x = W_RANGE[0];
		if (ball.x > W_RANGE[1]) ball.x = W_RANGE[1];
		if (ball.y < W_RANGE[0]) ball.y = W_RANGE[0];
		if (ball.y > W_RANGE[1]) ball.y = W_RANGE[1];
		path.push({ x: ball.x, y: ball.y });
		updateBall();
		updateStatus();
	}

	async function animate() {
		if (running) return;
		running = true;
		for (let i = 0; i < 400; i++) {
			if (!running) break;
			const gradNorm = Math.sqrt(dLdx(ball.x, ball.y) ** 2 + dLdy(ball.x, ball.y) ** 2);
			if (gradNorm < 1e-3 && !noise) break;
			step();
			await new Promise(r => setTimeout(r, 35));
		}
		running = false;
	}

	function reset() {
		running = false;
		ball = { x: 2.4, y: -2.4 };
		path = [];
		updateBall();
		updateStatus();
	}

	function setLr(v) {
		lr = parseFloat(v);
		const out = document.getElementById("ll-lr-val");
		if (out) out.innerText = v;
	}

	function setNoise(v) { noise = v; }

	function init() {
		buildGradients();
		plot();
		updateStatus();
		const lrEl = document.getElementById("ll-lr");
		if (lrEl) {
			lrEl.addEventListener("input", function () { setLr(this.value); });
			setLr(lrEl.value);
		}
	}

	return { init: init, reset: reset, setLr: setLr, setNoise: setNoise };
})();

function loadLossLandscapeModule() {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", function () { LossLandscape3D.init(); });
	} else {
		LossLandscape3D.init();
	}
}
