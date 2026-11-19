/* TEN MINUTES — the meadow of words, ported from the full intuition lesson. */
(function () {
	"use strict";

	var cv = document.getElementById("meadow-canvas");
	if (!cv) return;

	var LANG = TM.lang();
	var DE = LANG === "de";
	var WORDS = DE ? ["Hund", "Katze", "Baum", "Haus", "Auto", "Buch", "Maus", "Lampe", "Blume", "Stein", "Tisch", "Stuhl", "Wasser", "Feuer", "Nacht", "Sonne", "Regen", "Mond", "Kaffee", "Stern", "Fluss", "Berg", "Vogel", "Fisch", "Milch", "Zucker", "Tür", "Fenster", "Brücke", "Feld", "Küche", "Garten", "Schiff", "Uhr", "Straße", "Stadt", "Brot", "Apfel", "Tee", "Hut", "Glocke"] : ["Dog", "Cat", "Tree", "House", "Car", "Book", "Mouse", "Lamp", "Flower", "Stone", "Table", "Chair", "Water", "Fire", "Night", "Sun", "Rain", "Moon", "Coffee", "Star", "River", "Mountain", "Bird", "Fish", "Milk", "Sugar", "Door", "Window", "Bridge", "Field", "Kitchen", "Garden", "Ship", "Clock", "Road", "City", "Bread", "Apple", "Tea", "Hat", "Bell"];
	var HUES = [188, 220, 260, 290, 320, 350, 15, 40, 60, 90, 140, 170, 200, 240, 280, 310, 340, 25, 50, 75, 120, 155, 195, 230, 270, 300, 330, 10, 45, 100, 160, 210, 250, 295, 335, 20, 65, 130, 185, 245, 305];
	var FIELD_SCALE = 2;
	var CW = 560 * FIELD_SCALE, CH = 196 * FIELD_SCALE;
	var currentN = 12;
	var T = 0.8;
	var K = 5;
	var anchors = [];
	var fieldCache = {};
	var gapFrac = 0;
	var pointer = { x: CW / 2, y: CH / 2 };

	var sN = document.getElementById("md-n");
	var sT = document.getElementById("md-temp");
	var sK = document.getElementById("md-k");
	var rN = document.getElementById("md-n-out");
	var rT = document.getElementById("md-temp-out");
	var rK = document.getElementById("md-k-out");
	var rWord = document.getElementById("md-word");
	var rProb = document.getElementById("md-chance");
	var rEdge = document.getElementById("md-margin");
	var rGap = document.getElementById("md-gap");
	var captionEl = document.getElementById("md-caption");

	function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
	function hexToRgb(hex) {
		var h = String(hex || "").replace("#", "");
		if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
		return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
	}
	function palette() {
		var c = TM.colors();
		var green = hexToRgb(c.green);
		return {
			dark: c.dark,
			surface: c.card,
			text: c.ink,
			muted: c.muted,
			border: c.lineStrong,
			edge: hexToRgb(c.inkSoft),
			gold: hexToRgb(c.gold),
			thought: c.green,
			thoughtFill: "rgba(" + green[0] + "," + green[1] + "," + green[2] + ",.13)",
			ink: c.ink
		};
	}
	function mulberry32(a) {
		return function () {
			a |= 0; a = a + 0x6D2B79F5 | 0;
			var t = Math.imul(a ^ a >>> 15, 1 | a);
			t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
			return ((t ^ t >>> 14) >>> 0) / 4294967296;
		};
	}
	function hsl(h, s, l) {
		s /= 100; l /= 100;
		var k = function (n) { return (n + h / 30) % 12; };
		var a = s * Math.min(l, 1 - l);
		var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
		return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
	}
	function smoothstep(a, b, t) {
		if (a === b) return t < a ? 0 : 1;
		t = clamp((t - a) / (b - a), 0, 1);
		return t * t * (3 - 2 * t);
	}
	function mix(c1, c2, t) {
		return [
			Math.round(c1[0] + (c2[0] - c1[0]) * t),
			Math.round(c1[1] + (c2[1] - c1[1]) * t),
			Math.round(c1[2] + (c2[2] - c1[2]) * t)
		];
	}
	function gen2D(n) {
		var rng = mulberry32(7 + n * 13);
		var cols = Math.ceil(Math.sqrt(n * CW / CH));
		var rows = Math.ceil(n / cols);
		var pts = [];
		for (var i = 0; i < n; i++) {
			var cx = i % cols;
			var cy = Math.floor(i / cols);
			var jx = (rng() - 0.5) * 0.72;
			var jy = (rng() - 0.5) * 0.72;
			pts.push({
				x: clamp((cx + 0.3 + jx) / cols * CW, 24, CW - 24),
				y: clamp((cy + 0.3 + jy) / rows * CH, 24, CH - 24),
				w: WORDS[i % WORDS.length],
				c: HUES[i % HUES.length]
			});
		}
		return pts;
	}
	function scaleFor(a) { return Math.sqrt(CW * CH / Math.max(1, a.length)) * 0.52; }
	function distTo(a, x, y) { return Math.hypot(x - a.x, y - a.y); }
	function nearestTwo(x, y, a) {
		var d1 = 1e18, d2 = 1e18, i1 = 0;
		for (var i = 0; i < a.length; i++) {
			var dx = x - a[i].x;
			var dy = y - a[i].y;
			var d = dx * dx + dy * dy;
			if (d < d1) { d2 = d1; i1 = i; d1 = d; }
			else if (d < d2) { d2 = d; }
		}
		var r1 = Math.sqrt(d1);
		var r2 = Math.sqrt(d2);
		return { i1: i1, d1: r1, d2: r2, m: r2 - r1 };
	}
	function colorFor(m, idx, pal, scale, arr) {
		var q = clamp(m / scale, 0, 1);
		var col = hsl(arr[idx].c, 34 + 16 * q, pal.dark ? 28 + 16 * q : 64 + 16 * q);
		var eps = 0.32 * scale;
		var edgePx = 2.4 * FIELD_SCALE;
		if (m < eps) col = mix(col, pal.gold, 0.55 * (1 - smoothstep(edgePx, eps, m)));
		if (m < edgePx) col = mix(pal.edge, col, smoothstep(0, edgePx * 0.75, m));
		return col;
	}
	function makeField(n, pal) {
		var a = gen2D(n);
		var scale = scaleFor(a);
		var c = document.createElement("canvas");
		c.width = CW; c.height = CH;
		var cctx = c.getContext("2d");
		var img = cctx.createImageData(CW, CH);
		var cnt = 0;
		var eps = 0.32 * scale;
		for (var y = 0; y < CH; y++) {
			for (var x = 0; x < CW; x++) {
				var n2 = nearestTwo(x, y, a);
				var col = colorFor(n2.m, n2.i1, pal, scale, a);
				var p = (y * CW + x) * 4;
				img.data[p] = col[0];
				img.data[p + 1] = col[1];
				img.data[p + 2] = col[2];
				img.data[p + 3] = 255;
				if (n2.m < eps) cnt++;
			}
		}
		cctx.putImageData(img, 0, 0);
		return { canvas: c, gapFrac: cnt / (CW * CH) };
	}
	function fieldKey(n, pal) { return n + "|" + (pal.dark ? "d" : "l"); }
	function ensureField(n, pal) {
		var key = fieldKey(n, pal);
		if (!fieldCache[key]) fieldCache[key] = makeField(n, pal);
		return fieldCache[key];
	}
	function setN(n) {
		currentN = n;
		anchors = gen2D(n);
		gapFrac = ensureField(n, palette()).gapFrac;
	}
	function drawWordPins(ctx, sx, sy, pal) {
		var n = anchors.length;
		var fs = n <= 20 ? 11 : (n <= 30 ? 9.5 : 8.5);
		for (var i = 0; i < n; i++) {
			var a = anchors[i];
			var ax = a.x * sx, ay = a.y * sy;
			ctx.save();
			ctx.shadowColor = "rgba(0,0,0,.18)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 1;
			ctx.beginPath(); ctx.arc(ax, ay, 6, 0, Math.PI * 2);
			ctx.fillStyle = pal.surface; ctx.fill();
			ctx.restore();
			ctx.beginPath(); ctx.arc(ax, ay, 6, 0, Math.PI * 2);
			ctx.strokeStyle = pal.ink; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.5; ctx.stroke();
			ctx.globalAlpha = 1;
			var ly = ay + 11;
			ctx.font = "600 " + fs + "px system-ui";
			ctx.textAlign = "center"; ctx.textBaseline = "top";
			var tw = ctx.measureText(a.w).width;
			ctx.globalAlpha = 0.88;
			ctx.fillStyle = pal.surface;
			ctx.fillRect(ax - tw / 2 - 3, ly - 2, tw + 6, fs + 5);
			ctx.globalAlpha = 1;
			ctx.fillStyle = pal.ink;
			ctx.fillText(a.w, ax, ly + 1);
		}
	}
	function drawThought(ctx, w, h, pal) {
		var scale = scaleFor(anchors);
		var px = clamp(pointer.x, 0, CW - 1);
		var py = clamp(pointer.y, 0, CH - 1);
		var mx = px * w / CW, my = py * h / CH;
		var radiusPx = T * scale * 1.2 * (w / CW);
		ctx.beginPath();
		ctx.arc(mx, my, radiusPx, 0, Math.PI * 2);
		ctx.strokeStyle = pal.thought;
		ctx.globalAlpha = 0.55; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
		ctx.globalAlpha = 1;
		ctx.fillStyle = pal.thoughtFill; ctx.fill();

		var allD = [];
		for (var i = 0; i < anchors.length; i++) allD.push({ i: i, d: distTo(anchors[i], px, py) });
		allD.sort(function (a, b) { return a.d - b.d; });
		var near = allD.slice(0, Math.min(K, allD.length));
		var sigma = Math.max(1e-6, T * scale * 0.5);
		var scores = near.map(function (cd) { return { i: cd.i, d: cd.d, s: Math.exp(-cd.d / sigma) }; });
		var sum = 0;
		for (var j = 0; j < scores.length; j++) sum += scores[j].s;
		if (!sum) sum = 1;

		var panelW = 178;
		var rowH = 24;
		var panelH = near.length * rowH + 22;
		var right = mx + radiusPx + 16;
		var panelX = (right + panelW > w - 8) ? clamp(mx - radiusPx - panelW - 16, 4, w - panelW - 8) : clamp(right, 4, w - panelW - 8);
		var panelY = clamp(my - panelH / 2, 8, h - panelH - 8);
		ctx.globalAlpha = 0.96;
		ctx.fillStyle = pal.surface;
		TM.roundRect(ctx, panelX, panelY, panelW, panelH, 10);
		ctx.fill();
		ctx.globalAlpha = 1;
		ctx.strokeStyle = pal.border; ctx.lineWidth = 1; ctx.stroke();
		ctx.font = "700 10px system-ui";
		ctx.fillStyle = pal.muted;
		ctx.textAlign = "left"; ctx.textBaseline = "middle";
		ctx.fillText(DE ? "CHANCEN" : "CHANCES", panelX + 10, panelY + 11);
		var barX = panelX + 68;
		var barMax = panelW - 68 - 44;
		for (var k = 0; k < scores.length; k++) {
			var cd = scores[k];
			var prob = cd.s / sum;
			var rowY = panelY + 26 + k * rowH;
			ctx.font = (k === 0 ? "700" : "400") + " 12px system-ui";
			ctx.fillStyle = k === 0 ? pal.thought : pal.text;
			ctx.textAlign = "left";
			ctx.fillText(anchors[cd.i].w, panelX + 10, rowY);
			var bw = Math.max(3, prob * barMax);
			ctx.fillStyle = pal.border;
			TM.roundRect(ctx, barX, rowY - 5, barMax, 10, 5);
			ctx.fill();
			ctx.fillStyle = k === 0 ? pal.thought : pal.muted;
			ctx.globalAlpha = k === 0 ? 1 : 0.5;
			TM.roundRect(ctx, barX, rowY - 5, bw, 10, 5);
			ctx.fill();
			ctx.globalAlpha = 1;
			ctx.font = "600 10px monospace";
			ctx.fillStyle = k === 0 ? pal.thought : pal.muted;
			ctx.textAlign = "right";
			ctx.fillText(Math.round(prob * 100) + "%", panelX + panelW - 8, rowY);
		}
		ctx.beginPath(); ctx.arc(mx, my, 7, 0, Math.PI * 2);
		ctx.fillStyle = pal.surface; ctx.fill();
		ctx.strokeStyle = pal.thought; ctx.lineWidth = 2.5; ctx.stroke();

		var winner = scores[0];
		var runner = scores[1];
		var seamGap = near.length > 1 ? near[1].d - near[0].d : 0;
		if (winner) {
			if (rWord) rWord.textContent = anchors[winner.i].w;
			if (rProb) rProb.textContent = Math.round(winner.s / sum * 100) + "%";
			if (rEdge) rEdge.textContent = (seamGap / scale).toFixed(2);
			if (rGap) rGap.textContent = Math.round(gapFrac * 100) + "%";
			if (captionEl) {
				if (seamGap / scale < 0.01) captionEl.textContent = DE
					? "Du stehst auf einer goldenen Naht: „" + anchors[winner.i].w + "“ und „" + (runner ? anchors[runner.i].w : "?") + "“ sind fast gleich nah."
					: "You are on a golden seam: “" + anchors[winner.i].w + "” and “" + (runner ? anchors[runner.i].w : "?") + "” are almost equally near.";
				else if (winner.s / sum > 0.8) captionEl.textContent = DE
					? "Tief in der Zelle von „" + anchors[winner.i].w + "“. Die nächste Naht ist weit weg."
					: "Deep inside the cell of “" + anchors[winner.i].w + "”. The nearest seam is far away.";
				else captionEl.textContent = DE
					? "In der Nähe des Territoriums von „" + anchors[winner.i].w + "“, aber „" + (runner ? anchors[runner.i].w : "?") + "“ ist nah."
					: "Near the territory of “" + anchors[winner.i].w + "”, but “" + (runner ? anchors[runner.i].w : "?") + "” is close.";
			}
		}
	}
	function draw(ctx, w, h) {
		if (!anchors.length) return;
		var pal = palette();
		var f = ensureField(currentN, pal);
		gapFrac = f.gapFrac;
		ctx.clearRect(0, 0, w, h);
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = "high";
		ctx.drawImage(f.canvas, 0, 0, w, h);
		drawWordPins(ctx, w / CW, h / CH, pal);
		drawThought(ctx, w, h, pal);
		if (rN) rN.textContent = currentN;
		if (rT) rT.textContent = T.toFixed(2);
		if (rK) rK.textContent = K;
	}

	var api = TM.initCanvas(cv, draw);
	if (!api) return;
	if (sN) sN.addEventListener("input", function () { setN(parseInt(sN.value, 10) || 12); if (rN) rN.textContent = currentN; api.redraw({ spinner: false }); });
	if (sT) sT.addEventListener("input", function () { T = clamp(parseFloat(sT.value) || 0.8, 0.2, 2.6); if (rT) rT.textContent = T.toFixed(2); api.redraw({ spinner: false }); });
	if (sK) sK.addEventListener("input", function () { K = clamp(parseInt(sK.value, 10) || 5, 1, 10); if (rK) rK.textContent = K; api.redraw({ spinner: false }); });
	function setPointer(ev) {
		var rect = cv.getBoundingClientRect();
		var cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
		var cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
		pointer.x = clamp((cx - rect.left) / rect.width * CW, 0, CW - 1);
		pointer.y = clamp((cy - rect.top) / rect.height * CH, 0, CH - 1);
		api.redraw({ spinner: false });
	}
	cv.addEventListener("pointermove", setPointer);
	cv.addEventListener("pointerdown", setPointer);
	window.addEventListener("tm:theme", function () {
		fieldCache = {};
		setN(currentN);
		api.redraw();
	});
	setN(currentN);
	api.redraw();
})();
