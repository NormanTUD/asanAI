"use strict";

/*
 * Optional whole-sphere TDA block for the transformer lesson.
 *
 * Collects the directions of every token state from every layer, normalizes
 * them to the unit sphere, and runs the exact H0/H1 persistence code from
 * tda_ffn.js on the pooled cloud. The block also draws a lat/lon coverage
 * map and the connected components at the chosen filtration radius.
 */

(function () {
	var MAX_TDA_POINTS = 96;
	var MAX_EDGES = 1800;
	var MAX_CLUSTERS = 12;

	var state = {
		data: null,
		projection: null,
		topo: null,
		groups: null,
		edges: [],
		eps: 0.35,
		options: null,
		lastCompute: 0
	};

	var debounceTimer = null;
	var resizeTimer = null;

	function el(id) {
		return document.getElementById(id);
	}

	function tc(color) {
		return typeof themeColor === "function" ? themeColor(color) : color;
	}

	function setStatus(text) {
		var node = el("tda-sphere-status");
		if (node) node.textContent = text || "";
	}

	function unit(vec) {
		if (!vec || !vec.length) return null;
		var sum = 0;
		for (var i = 0; i < vec.length; i++) {
			var v = Number(vec[i]) || 0;
			sum += v * v;
		}
		var length = Math.sqrt(sum);
		if (!isFinite(length) || length < 1e-12) return null;
		return vec.map(function (v) { return (Number(v) || 0) / length; });
	}

	function readOptions() {
		return {
			states: (el("tda-sphere-states") || {}).value || "layers",
			tokens: (el("tda-sphere-tokens") || {}).value || "all",
			color: (el("tda-sphere-color") || {}).value || "layer",
			raw: !!(el("tda-sphere-raw") || {}).checked,
			edges: !!(el("tda-sphere-edges") || {}).checked
		};
	}

	function readEps() {
		var slider = el("tda-sphere-eps");
		var value = slider ? Number(slider.value) : 35;
		if (!isFinite(value)) value = 35;
		return Math.max(0, Math.min(1, value / 100));
	}

	function updateEpsLabel() {
		var label = el("tda-sphere-eps-val");
		if (label) label.textContent = state.eps.toFixed(2) + " (normalised)";
	}

	function collect(options) {
		var traces = window.__tmLayerTrace || [];
		if (!traces.length) return null;
		var base = traces[0];
		var tokens = (base.tokenStrings && base.tokenStrings.length)
			? base.tokenStrings.slice()
			: ((window.tlab_trajectory_collector && window.tlab_trajectory_collector.tokens) || []);
		if (!tokens.length) return null;

		var indices = tokens.map(function (_, i) { return i; });
		if (options.tokens === "last") indices = [tokens.length - 1];

		var includeSub = options.states === "sublayers";
		var steps = window.tlab_trajectory_collector && window.tlab_trajectory_collector.steps;
		var rawData = options.raw && steps && steps["00_raw"] && steps["00_raw"].data
			? steps["00_raw"].data
			: null;
		var stagesPerToken = 1 + traces.length * (includeSub ? 2 : 1) + (rawData ? 1 : 0);

		var used = indices.slice();
		var capped = false;
		if (used.length * stagesPerToken > MAX_TDA_POINTS) {
			var keep = Math.max(2, Math.floor(MAX_TDA_POINTS / stagesPerToken));
			used = [];
			for (var k = 0; k < keep; k++) {
				var at = Math.round(k * (indices.length - 1) / Math.max(1, keep - 1));
				used.push(indices[at]);
			}
			capped = true;
		}
		used = Array.from(new Set(used));

		var points = [];
		function add(vec, tokenIndex, layer, stage) {
			var direction = unit(vec);
			if (!direction) return;
			points.push({
				v: direction,
				token: tokens[tokenIndex],
				tokenIndex: tokenIndex,
				layer: layer,
				stage: stage
			});
		}

		used.forEach(function (tokenIndex) {
			if (rawData && rawData[tokenIndex]) add(rawData[tokenIndex], tokenIndex, -1, "raw");
			if (base.h_in && base.h_in[tokenIndex]) add(base.h_in[tokenIndex], tokenIndex, 0, "h₀");
			traces.forEach(function (trace, layerIndex) {
				if (includeSub && trace.h_attn && trace.h_attn[tokenIndex]) {
					add(trace.h_attn[tokenIndex], tokenIndex, layerIndex + 1, "attention");
				}
				if (trace.h_out && trace.h_out[tokenIndex]) {
					add(trace.h_out[tokenIndex], tokenIndex, layerIndex + 1, "FFN");
				}
			});
		});

		return {
			points: points,
			tokens: tokens,
			used: used,
			nLayers: traces.length,
			includeSub: includeSub,
			raw: !!rawData,
			capped: capped,
			totalTokens: tokens.length
		};
	}

	function project(points) {
		var dim = points.length ? points[0].v.length : 0;
		if (dim <= 3) {
			return {
				dim: dim,
				projected: false,
				points: points.map(function (point) {
					var v = point.v.slice();
					while (v.length < 3) v.push(0);
					return { point: point, pos: [v[0], v[1], v[2]] };
				})
			};
		}
		var all = points.map(function (point) { return point.v; });
		var coords = typeof window.tmPCA3 === "function"
			? window.tmPCA3(all)
			: all.map(function (v) { return v.slice(0, 3); });
		return {
			dim: dim,
			projected: true,
			points: points.map(function (point, i) {
				var c = coords[i] || [0, 0, 0];
				var length = Math.sqrt(c[0] * c[0] + c[1] * c[1] + c[2] * c[2]);
				if (!isFinite(length) || length < 1e-12) return { point: point, pos: [0, 0, 0] };
				return { point: point, pos: [c[0] / length, c[1] / length, c[2] / length] };
			})
		};
	}

	function coverageOf(projected, latBins, lonBins) {
		latBins = latBins || 18;
		lonBins = lonBins || 36;
		var z = [];
		for (var i = 0; i < latBins; i++) z.push(new Array(lonBins).fill(0));
		var max = 0;
		projected.forEach(function (item) {
			var x = item.pos[0], y = item.pos[1], zz = item.pos[2];
			var lat = Math.asin(Math.max(-1, Math.min(1, zz)));
			var lon = Math.atan2(y, x);
			var li = Math.min(latBins - 1, Math.floor((lat + Math.PI / 2) / Math.PI * latBins));
			var oi = Math.min(lonBins - 1, Math.floor((lon + Math.PI) / (2 * Math.PI) * lonBins));
			z[li][oi] += 1;
			if (z[li][oi] > max) max = z[li][oi];
		});
		var occupied = 0;
		for (var r = 0; r < latBins; r++) {
			for (var c = 0; c < lonBins; c++) {
				if (z[r][c] > 0) occupied += 1;
			}
		}
		return {
			z: z,
			latBins: latBins,
			lonBins: lonBins,
			occupied: occupied,
			total: latBins * lonBins,
			max: max
		};
	}

	function components(projected, topo, eps) {
		var n = projected.length;
		var parent = new Array(n);
		for (var i = 0; i < n; i++) parent[i] = i;
		function find(x) {
			while (parent[x] !== x) {
				parent[x] = parent[parent[x]];
				x = parent[x];
			}
			return x;
		}
		function union(a, b) {
			a = find(a);
			b = find(b);
			if (a !== b) parent[b] = a;
		}
		var scale = topo && topo.scale ? topo.scale : 1;
		var edges = [];
		for (var p = 0; p < n; p++) {
			for (var q = p + 1; q < n; q++) {
				var distance = topo && topo.dist ? topo.dist[p][q] / scale : 0;
				if (distance <= eps) {
					union(p, q);
					edges.push([p, q, distance]);
				}
			}
		}
		var grouped = new Map();
		for (var j = 0; j < n; j++) {
			var root = find(j);
			if (!grouped.has(root)) grouped.set(root, []);
			grouped.get(root).push(j);
		}
		var groups = Array.from(grouped.values()).map(function (idxs) {
			return { idxs: idxs };
		});
		groups.sort(function (a, b) { return b.idxs.length - a.idxs.length; });
		return { groups: groups, edges: edges };
	}

	function layerLabel(layer) {
		if (layer < 0) return "raw";
		if (layer === 0) return "h₀";
		return "layer " + layer;
	}

	function layerColor(layer, nLayers) {
		if (layer < 0) return "#94a3b8";
		return typeof getPositionColor === "function"
			? getPositionColor(Math.max(0, layer), Math.max(1, nLayers + 1))
			: "#3b82f6";
	}

	function clusterColor(index) {
		return "hsl(" + ((index * 137.508) % 360).toFixed(1) + ", 65%, 55%)";
	}

	function clusterForPoint(index) {
		if (!state.groups) return -1;
		for (var i = 0; i < state.groups.groups.length; i++) {
			if (state.groups.groups[i].idxs.indexOf(index) !== -1) return i;
		}
		return -1;
	}

	function sphereTrace() {
		var nLat = 20, nLon = 40;
		var x = [], y = [], z = [];
		for (var i = 0; i <= nLat; i++) {
			var lat = -Math.PI / 2 + Math.PI * i / nLat;
			var rowX = [], rowY = [], rowZ = [];
			for (var j = 0; j <= nLon; j++) {
				var lon = -Math.PI + 2 * Math.PI * j / nLon;
				rowX.push(Math.cos(lat) * Math.cos(lon));
				rowY.push(Math.cos(lat) * Math.sin(lon));
				rowZ.push(Math.sin(lat));
			}
			x.push(rowX);
			y.push(rowY);
			z.push(rowZ);
		}
		return {
			type: "surface",
			x: x, y: y, z: z,
			opacity: 0.07,
			showscale: false,
			colorscale: [[0, "#94a3b8"], [1, "#94a3b8"]],
			hoverinfo: "skip",
			showlegend: false
		};
	}

	function renderSphere() {
		var node = el("tda-sphere-3d");
		if (!node || !window.Plotly || !state.projection) return;
		var projected = state.projection.points;
		var opts = state.options || readOptions();
		var colorByCluster = opts.color === "cluster";
		var xs = [], ys = [], zs = [], colors = [], hover = [];
		projected.forEach(function (item, i) {
			var point = item.point;
			xs.push(item.pos[0]);
			ys.push(item.pos[1]);
			zs.push(item.pos[2]);
			if (colorByCluster) {
				var ci = clusterForPoint(i);
				colors.push(ci < 0 ? "#94a3b8" : clusterColor(ci));
			} else {
				colors.push(layerColor(point.layer, state.data.nLayers));
			}
			hover.push(
				"<b>" + String(point.token) + "</b><br>" +
				point.stage + " · " + layerLabel(point.layer) +
				"<br>direction: [" + item.pos.map(function (v) { return v.toFixed(2); }).join(", ") + "]"
			);
		});
		var traces = [sphereTrace(), {
			type: "scatter3d",
			mode: "markers",
			x: xs, y: ys, z: zs,
			marker: { size: 4, color: colors, opacity: 0.92 },
			text: hover,
			hovertemplate: "%{text}<extra></extra>",
			showlegend: false
		}];

		if (opts.edges && state.groups && state.groups.edges.length) {
			var ex = [], ey = [], ez = [];
			var edges = state.groups.edges.slice(0, MAX_EDGES);
			edges.forEach(function (edge) {
				var a = projected[edge[0]].pos;
				var b = projected[edge[1]].pos;
				ex.push(a[0], b[0], null);
				ey.push(a[1], b[1], null);
				ez.push(a[2], b[2], null);
			});
			traces.push({
				type: "scatter3d",
				mode: "lines",
				x: ex, y: ey, z: ez,
				line: { color: "rgba(100,116,139,0.24)", width: 1 },
				hoverinfo: "skip",
				showlegend: false
			});
		}

		var axes = state.projection.projected
			? ["PC 1", "PC 2", "PC 3"]
			: ["Dir 0", "Dir 1", "Dir 2"];
		var title = xs.length + " directions · " + state.data.used.length + " of " +
			state.data.totalTokens + " tokens · " + state.data.nLayers + " layers";
		var layout;
		if (window.tmPlotly && window.tmPlotly.layout3D) {
			layout = window.tmPlotly.layout3D(title, axes);
			window.tmPlotly.equalize3D(layout, traces, 1.05);
		} else {
			layout = {
				title: { text: title },
				paper_bgcolor: "rgba(0,0,0,0)",
				plot_bgcolor: "rgba(0,0,0,0)",
				scene: { aspectmode: "cube", xaxis: { range: [-1.05, 1.05] }, yaxis: { range: [-1.05, 1.05] }, zaxis: { range: [-1.05, 1.05] } }
			};
		}
		Plotly.react(node, traces, layout, { responsive: true, displayModeBar: false });
	}

	function renderCoverage() {
		var node = el("tda-sphere-coverage");
		var stats = el("tda-sphere-coverage-stats");
		if (!node || !window.Plotly || !state.projection) return;
		var coverage = coverageOf(state.projection.points, 12, 24);
		var xs = [], ys = [];
		for (var c = 0; c < coverage.lonBins; c++) xs.push(-180 + (c + 0.5) * 360 / coverage.lonBins);
		for (var r = 0; r < coverage.latBins; r++) ys.push(-90 + (r + 0.5) * 180 / coverage.latBins);
		var layout = {
			margin: { l: 42, r: 8, t: 8, b: 34 },
			paper_bgcolor: "rgba(0,0,0,0)",
			plot_bgcolor: "rgba(0,0,0,0)",
			font: { color: tc("#334155"), size: 10 },
			xaxis: { title: { text: "longitude", font: { size: 10 } }, tickfont: { size: 9 } },
			yaxis: { title: { text: "latitude", font: { size: 10 } }, tickfont: { size: 9 } }
		};
		Plotly.react(node, [{
			type: "heatmap",
			x: xs, y: ys, z: coverage.z,
			colorscale: [[0, tc("#f8fafc")], [1, tc("#1d4ed8")]],
			showscale: true,
			colorbar: { title: { text: "states", side: "right" }, thickness: 10, len: 0.8 },
			hovertemplate: "longitude %{x}°<br>latitude %{y}°<br>%{z} states<extra></extra>"
		}], layout, { responsive: true, displayModeBar: false });

		if (stats) {
			var pct = coverage.total ? (100 * coverage.occupied / coverage.total) : 0;
			var note = state.projection.projected
				? " Coordinates are a PCA projection of the unit directions, so coverage is a projection of the sphere."
				: "";
			stats.innerHTML =
				"<b>" + coverage.occupied + " / " + coverage.total + "</b> bins occupied (" +
				pct.toFixed(1) + "%). Densest bin: <b>" + coverage.max + "</b> state" +
				(coverage.max === 1 ? "" : "s") + "." + note;
		}
	}

	function drawBarcode() {
		var canvas = el("tda-sphere-barcode");
		if (!canvas) return;
		var width = Math.max(260, canvas.clientWidth || 520);
		var height = Math.max(160, canvas.clientHeight || 260);
		var dpr = window.devicePixelRatio || 1;
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		var ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, width, height);
		var ink = tc("#334155"), muted = tc("#64748b"), line = tc("#e2e8f0");
		ctx.font = "11px Barlow, system-ui, sans-serif";
		ctx.textBaseline = "middle";
		if (!state.topo) {
			ctx.fillStyle = muted;
			ctx.textAlign = "center";
			ctx.fillText("Run the demo to build the barcode.", width / 2, height / 2);
			return;
		}
		var left = 58, right = 16, top = 22, bottom = 28;
		var plotW = width - left - right;
		var plotH = height - top - bottom;
		var groupH = plotH / 2;
		function xOf(value) {
			return left + Math.max(0, Math.min(1, value)) * plotW;
		}
		ctx.strokeStyle = line;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(left, top + plotH);
		ctx.lineTo(left + plotW, top + plotH);
		ctx.stroke();
		[0, 0.25, 0.5, 0.75, 1].forEach(function (value) {
			var x = xOf(value);
			ctx.strokeStyle = line;
			ctx.beginPath();
			ctx.moveTo(x, top);
			ctx.lineTo(x, top + plotH);
			ctx.stroke();
			ctx.fillStyle = muted;
			ctx.textAlign = "center";
			ctx.fillText(value === 0 ? "0" : value === 1 ? "1" : value.toFixed(2).replace("0.", "."), x, top + plotH + 12);
		});
		var groups = [
			{ name: "H₀ clusters", bars: state.topo.h0, color: "#3b82f6", y0: top },
			{ name: "H₁ loops", bars: state.topo.h1, color: "#8b5cf6", y0: top + groupH }
		];
		groups.forEach(function (group) {
			ctx.textAlign = "left";
			ctx.fillStyle = ink;
			ctx.font = "600 11px Barlow, system-ui, sans-serif";
			ctx.fillText(group.name, 4, group.y0 + 10);
			var bars = group.bars.slice(0, 32);
			if (!bars.length) {
				ctx.fillStyle = muted;
				ctx.font = "10px Barlow, system-ui, sans-serif";
				ctx.fillText("no " + (group.name.indexOf("H₀") === 0 ? "H₀" : "H₁") + " bars", left + 6, group.y0 + groupH / 2);
				return;
			}
			var step = (groupH - 24) / Math.max(1, bars.length);
			var barH = Math.max(1.5, Math.min(5, step * 0.68));
			bars.forEach(function (bar, index) {
				var death = isFinite(bar.death) ? bar.death : 1;
				var persistence = isFinite(bar.death) ? bar.death - bar.birth : Infinity;
				ctx.globalAlpha = persistence < 0.03 ? 0.35 : 0.9;
				ctx.strokeStyle = group.color;
				ctx.lineWidth = barH;
				ctx.beginPath();
				ctx.moveTo(xOf(bar.birth), group.y0 + 20 + index * step);
				ctx.lineTo(xOf(death), group.y0 + 20 + index * step);
				ctx.stroke();
			});
			ctx.globalAlpha = 1;
		});
		var epsX = xOf(state.eps);
		ctx.strokeStyle = "#ef4444";
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.moveTo(epsX, top);
		ctx.lineTo(epsX, top + plotH);
		ctx.stroke();
		ctx.fillStyle = "#ef4444";
		ctx.textAlign = epsX > width - 50 ? "right" : "left";
		ctx.font = "10px Barlow, system-ui, sans-serif";
		ctx.fillText("ε=" + state.eps.toFixed(2), epsX + (ctx.textAlign === "right" ? -4 : 4), top + 10);
		var betti = el("tda-sphere-betti");
		if (betti) {
			var h0 = window.TDAFFN ? window.TDAFFN.bettiAt(state.topo.h0, state.eps) : 0;
			var h1 = window.TDAFFN ? window.TDAFFN.bettiAt(state.topo.h1, state.eps) : 0;
			betti.innerHTML =
				"<span class='tda-sphere-chip'>β₀ = <b>" + h0 + "</b> clusters at ε</span>" +
				"<span class='tda-sphere-chip'>β₁ = <b>" + h1 + "</b> loops at ε</span>" +
				"<span class='tda-sphere-chip'>" + state.topo.h0.length + " H₀ bars · " +
				state.topo.h1.length + " H₁ bars</span>";
		}
	}

	function clusterSummary(group, index) {
		var layers = new Set();
		var tokens = new Set();
		group.idxs.forEach(function (pointIndex) {
			var point = state.data.points[pointIndex];
			layers.add(layerLabel(point.layer));
			tokens.add(String(point.token));
		});
		var tokenList = Array.from(tokens);
		var layerList = Array.from(layers);
		var tokenText = tokenList.slice(0, 5).join(", ") + (tokenList.length > 5 ? ", …" : "");
		var layerText = layerList.slice(0, 5).join(", ") + (layerList.length > 5 ? ", …" : "");
		var color = clusterColor(index);
		return "<div class='tda-sphere-cluster' style='border-left-color:" + color + ";'>" +
			"<b style='color:" + color + ";'>Cluster " + (index + 1) + "</b> · " +
			group.idxs.length + " state" + (group.idxs.length === 1 ? "" : "s") +
			"<br>tokens: " + tokenText +
			"<br>layers: " + layerText + "</div>";
	}

	function renderClusters() {
		var node = el("tda-sphere-clusters");
		if (!node) return;
		if (!state.data || !state.groups) {
			node.innerHTML = "<p style='font-size:0.8rem;color:var(--mn-text-muted,#64748b);'>No clusters yet.</p>";
			return;
		}
		var groups = state.groups.groups;
		var html = "<div style='font-size:0.8rem;color:var(--mn-text-muted,#64748b);margin-bottom:6px;'>" +
			groups.length + " component" + (groups.length === 1 ? "" : "s") +
			" at ε = " + state.eps.toFixed(2) +
			" · largest " + (groups.length ? groups[0].idxs.length : 0) +
			" of " + state.data.points.length + " states</div>";
		groups.slice(0, MAX_CLUSTERS).forEach(function (group, i) {
			html += clusterSummary(group, i);
		});
		if (groups.length > MAX_CLUSTERS) {
			html += "<p style='font-size:0.78rem;color:var(--mn-text-muted,#64748b);'>… " +
				(groups.length - MAX_CLUSTERS) + " more components.</p>";
		}
		node.innerHTML = html;
	}

	function renderAll() {
		updateEpsLabel();
		renderSphere();
		renderCoverage();
		drawBarcode();
		renderClusters();
	}

	function refreshGroups() {
		if (!state.projection || !state.topo) {
			state.groups = null;
			state.edges = [];
			return;
		}
		var result = components(state.projection.points, state.topo, state.eps);
		state.groups = result;
		state.edges = result.edges;
	}

	function computeNow() {
		var options = readOptions();
		state.options = options;
		state.eps = readEps();
		var started = performance.now();
		setStatus("Computing H₀/H₁…");
		var collected = collect(options);
		if (!collected || collected.points.length < 2) {
			state.data = null;
			state.topo = null;
			state.projection = null;
			state.groups = null;
			setStatus("Need at least two token states. Run the demo or train the model.");
			renderClusters();
			return;
		}
		if (!window.TDAFFN || typeof window.TDAFFN.persistence !== "function") {
			setStatus("TDA library not loaded.");
			return;
		}
		var topo = window.TDAFFN.persistence(collected.points.map(function (point) { return point.v; }));
		state.data = collected;
		state.topo = topo;
		state.projection = project(collected.points);
		state.eps = readEps();
		refreshGroups();
		state.lastCompute = performance.now() - started;
		renderAll();
		var message = collected.points.length + " states · " + collected.used.length + " of " +
			collected.totalTokens + " tokens · " + collected.nLayers + " layers · " +
			state.lastCompute.toFixed(0) + " ms";
		if (collected.capped) message += " · sampled to " + collected.used.length + " tokens for the filtration";
		if (state.projection.projected) message += " · PCA projection for d>3";
		if (state.groups && state.groups.edges.length > MAX_EDGES) {
			message += " · drawing " + MAX_EDGES + " of " + state.groups.edges.length + " edges";
		}
		setStatus(message);
	}

	function scheduleCompute() {
		setStatus("Computing H₀/H₁…");
		window.requestAnimationFrame(function () {
			setTimeout(computeNow, 0);
		});
	}

	function wire() {
		var recompute = el("tda-sphere-recompute");
		if (recompute) recompute.addEventListener("click", scheduleCompute);
		["tda-sphere-states", "tda-sphere-tokens", "tda-sphere-raw"].forEach(function (id) {
			var node = el(id);
			if (node) node.addEventListener("change", scheduleCompute);
		});
		["tda-sphere-color", "tda-sphere-edges"].forEach(function (id) {
			var node = el(id);
			if (node) node.addEventListener("change", function () {
				state.options = readOptions();
				renderSphere();
			});
		});
		var eps = el("tda-sphere-eps");
		if (eps) {
			eps.addEventListener("input", function () {
				state.eps = readEps();
				refreshGroups();
				updateEpsLabel();
				renderSphere();
				drawBarcode();
				renderClusters();
			});
		}
		window.addEventListener("tm:theme", renderAll);
		window.addEventListener("resize", function () {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(function () {
				["tda-sphere-3d", "tda-sphere-coverage"].forEach(function (id) {
					var node = el(id);
					if (node && window.Plotly && Plotly.Plots) {
						try { Plotly.Plots.resize(node); } catch (e) { /* not rendered yet */ }
					}
				});
				drawBarcode();
			}, 180);
		});
		window.addEventListener("tm:training-end", function () {
			if (isOpen()) scheduleCompute();
		});
		window.addEventListener("tm:transformer-data", function () {
			if (window.isTraining || !isOpen()) return;
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(scheduleCompute, 500);
		});
		if (window.__MN_DARK && typeof window.__MN_DARK.onChange === "function") {
			window.__MN_DARK.onChange(renderAll);
		}
	}

	function isOpen() {
		var block = el("tda-sphere-optional");
		if (!block) return false;
		var header = block.querySelector(".optional-header");
		var content = block.querySelector(".optional-content");
		return !!content && content.style.display !== "none" &&
			!!header && header.getAttribute("aria-expanded") === "true";
	}

	function boot() {
		if (window.__tdaSphereInit) return;
		var block = el("tda-sphere-optional");
		if (!block) return;
		var header = block.querySelector(".optional-header");
		var content = block.querySelector(".optional-content");
		if (!header || !content) {
			setTimeout(boot, 150);
			return;
		}
		if (content.style.display === "none" || !isOpen()) {
			if (!header.__tdaSphereBound) {
				header.__tdaSphereBound = true;
				header.addEventListener("click", function () {
					setTimeout(boot, 260);
				});
			}
			return;
		}
		var plot = el("tda-sphere-3d");
		if (!plot || plot.clientWidth < 40) {
			setTimeout(boot, 150);
			return;
		}
		window.__tdaSphereInit = true;
		wire();
		setTimeout(scheduleCompute, 80);
	}

	window.__tdaSphereState = function () {
		return {
			points: state.data ? state.data.points.length : 0,
			tokens: state.data ? state.data.used.length : 0,
			layers: state.data ? state.data.nLayers : 0,
			eps: state.eps,
			h0: state.topo ? state.topo.h0.length : 0,
			h1: state.topo ? state.topo.h1.length : 0,
			groups: state.groups ? state.groups.groups.length : 0
		};
	};
	window.__tdaSphereRecompute = scheduleCompute;

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 0); });
	} else {
		setTimeout(boot, 0);
	}
})();
