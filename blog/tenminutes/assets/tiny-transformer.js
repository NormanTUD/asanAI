/* TEN MINUTES — a small, real character-level transformer trained with TF.js. */
(function () {
	"use strict";

	var root = document.getElementById("tiny-transformer-demo");
	if (!root) return;
	var DE = window.TM && TM.lang ? TM.lang() === "de" : false;
	var tf = window.tf;
	var corpusEl = root.querySelector("[data-tiny-corpus]");
	var dEl = root.querySelector("[data-tiny-d]");
	var headsEl = root.querySelector("[data-tiny-heads]");
	var layersEl = root.querySelector("[data-tiny-layers]");
	var contextEl = root.querySelector("[data-tiny-context]");
	var trainBtn = root.querySelector("[data-tiny-train]");
	var resetBtn = root.querySelector("[data-tiny-reset]");
	var sampleBtn = root.querySelector("[data-tiny-sample]");
	var epochsEl = root.querySelector("[data-tiny-epochs]");
	var lrEl = root.querySelector("[data-tiny-lr]");
	var paramsEl = root.querySelector("[data-tiny-params]");
	var lossEl = root.querySelector("[data-tiny-loss]");
	var epochEl = root.querySelector("[data-tiny-epoch]");
	var statusEl = root.querySelector("[data-tiny-status]");
	var sampleOut = root.querySelector("[data-tiny-sample-out]");
	var lossCanvas = root.querySelector("[data-tiny-loss-canvas]");
	var attnCanvas = root.querySelector("[data-tiny-attn-canvas]");
	var lossApi = lossCanvas && TM.initCanvas ? TM.initCanvas(lossCanvas, drawLoss) : null;
	var attnApi = attnCanvas && TM.initCanvas ? TM.initCanvas(attnCanvas, drawAttention) : null;

	var cfg = { d: 8, heads: 2, layers: 1, context: 16 };
	var vocab = [], stoi = {}, itos = [];
	var ids = [], targets = [];
	var model = null, opt = null, params = [], maskT = null;
	var lossHistory = [], attnHeads = [];
	var training = false;
	var lastLoss = null;
	var sampleText = "";

	function txt(en, de) { return DE ? de : en; }

	function readConfig() {
		cfg.d = parseInt(dEl.value, 10) || 8;
		cfg.heads = parseInt(headsEl.value, 10) || 2;
		cfg.layers = parseInt(layersEl.value, 10) || 1;
		cfg.context = parseInt(contextEl.value, 10) || 16;
		if (cfg.d % cfg.heads !== 0) {
			cfg.heads = 1;
			headsEl.value = "1";
		}
	}

	function buildVocab() {
		var text = (corpusEl.value || "").replace(/\s+/g, " ");
		var chars = {};
		for (var i = 0; i < text.length; i++) chars[text[i]] = true;
		if (!chars[" "]) chars[" "] = true;
		vocab = Object.keys(chars).sort();
		stoi = {};
		itos = vocab.slice();
		vocab.forEach(function (c, i) { stoi[c] = i; });
		var T = cfg.context;
		var padded = text;
		while (padded.length < T + 1) padded += " " + text;
		ids = [];
		targets = [];
		for (var j = 0; j < T; j++) {
			ids.push(stoi[padded[j]] || 0);
			targets.push(stoi[padded[j + 1]] || 0);
		}
	}

	function makeMask(T) {
		var a = [];
		for (var i = 0; i < T; i++) {
			for (var j = 0; j < T; j++) a.push(j <= i ? 0 : -1e9);
		}
		return tf.tensor3d(a, [1, T, T]);
	}

	function makeVar(shape, scale) {
		return tf.variable(tf.randomNormal(shape, 0, scale));
	}
	function zeroVar(shape) { return tf.variable(tf.zeros(shape)); }
	function oneVar(shape) { return tf.variable(tf.ones(shape)); }

	function disposeModel() {
		params.forEach(function (p) { try { p.dispose(); } catch (e) {} });
		params = [];
		if (maskT) { maskT.dispose(); maskT = null; }
		model = null;
		opt = null;
	}

	function buildModel() {
		disposeModel();
		var d = cfg.d, h = cfg.heads, T = cfg.context, V = vocab.length;
		model = {
			E: makeVar([V, d], 0.15),
			P: makeVar([T, d], 0.15),
			layers: [],
			gF: oneVar([d]),
			bF: zeroVar([d]),
			U: makeVar([d, V], 0.15)
		};
		for (var l = 0; l < cfg.layers; l++) {
			model.layers.push({
				Wq: makeVar([d, d], 0.15), Wk: makeVar([d, d], 0.15),
				Wv: makeVar([d, d], 0.15), Wo: makeVar([d, d], 0.15),
				g1: oneVar([d]), b1: zeroVar([d]),
				g2: oneVar([d]), b2: zeroVar([d]),
				W1: makeVar([d, d * 4], 0.15), b1ff: zeroVar([d * 4]),
				W2: makeVar([d * 4, d], 0.15), b2ff: zeroVar([d])
			});
		}
		maskT = makeMask(T);
		params = [model.E, model.P, model.gF, model.bF, model.U];
		model.layers.forEach(function (L) {
			params.push(L.Wq, L.Wk, L.Wv, L.Wo, L.g1, L.b1, L.g2, L.b2, L.W1, L.b1ff, L.W2, L.b2ff);
		});
		opt = tf.train.adam(parseFloat(lrEl.value) || 0.01);
		if (paramsEl) paramsEl.textContent = params.reduce(function (s, p) { return s + p.size; }, 0).toLocaleString();
		lossHistory = [];
		attnHeads = [];
		lastLoss = null;
		sampleText = "";
		updateReadout();
		if (lossApi) lossApi.redraw();
		if (attnApi) attnApi.redraw();
	}

	function layerNorm(x, g, b) {
		var mean = tf.mean(x, 1, true);
		var v = tf.mean(tf.square(tf.sub(x, mean)), 1, true);
		return tf.add(tf.mul(tf.div(tf.sub(x, mean), tf.sqrt(tf.add(v, 1e-5))), g), b);
	}

	function forward(seq, wantAttn) {
		return tf.tidy(function () {
			var d = cfg.d, h = cfg.heads, T = seq.length, dk = d / h, V = vocab.length;
			var x = tf.add(tf.gather(model.E, tf.tensor1d(seq, "int32")), model.P.slice([0, 0], [T, d]));
			var attn = [];
			model.layers.forEach(function (L) {
				var h1 = layerNorm(x, L.g1, L.b1);
				var q = tf.matMul(h1, L.Wq);
				var k = tf.matMul(h1, L.Wk);
				var v = tf.matMul(h1, L.Wv);
				var qh = tf.transpose(tf.reshape(q, [T, h, dk]), [1, 0, 2]);
				var kh = tf.transpose(tf.reshape(k, [T, h, dk]), [1, 0, 2]);
				var vh = tf.transpose(tf.reshape(v, [T, h, dk]), [1, 0, 2]);
				var scores = tf.div(tf.matMul(qh, kh, false, true), Math.sqrt(dk));
				var masked = tf.add(scores, maskT.slice([0, 0, 0], [1, T, T]));
				var att = tf.softmax(masked, -1);
				if (wantAttn) attn.push({ data: Array.from(att.dataSync()), heads: h, T: T });
				var ctx = tf.matMul(att, vh);
				var merged = tf.reshape(tf.transpose(ctx, [1, 0, 2]), [T, d]);
				x = tf.add(x, tf.matMul(merged, L.Wo));
				var h2 = layerNorm(x, L.g2, L.b2);
				var ff = tf.add(tf.matMul(tf.relu(tf.add(tf.matMul(h2, L.W1), L.b1ff)), L.W2), L.b2ff);
				x = tf.add(x, ff);
			});
			var logits = tf.matMul(layerNorm(x, model.gF, model.bF), model.U);
			return wantAttn ? [logits, attn] : logits;
		});
	}

	function lossFn() {
		return tf.tidy(function () {
			var logits = forward(ids, false);
			var onehot = tf.oneHot(tf.tensor1d(targets, "int32"), vocab.length);
			return tf.losses.softmaxCrossEntropy(onehot, logits);
		});
	}

	function updateReadout() {
		if (lossEl) lossEl.textContent = lastLoss == null ? "..." : lastLoss.toFixed(3);
		if (epochEl) epochEl.textContent = String(lossHistory.length);
		if (statusEl) statusEl.textContent = training ? txt("training…", "trainiert…") : (lastLoss == null ? txt("ready", "bereit") : txt("trained", "trainiert"));
	}

	async function train() {
		if (!tf || training) return;
		readConfig();
		buildVocab();
		if (vocab.length < 2) { if (statusEl) statusEl.textContent = txt("corpus too small", "Korpus zu klein"); return; }
		buildModel();
		opt = tf.train.adam(parseFloat(lrEl.value) || 0.01);
		var epochs = Math.max(1, parseInt(epochsEl.value, 10) || 300);
		training = true;
		trainBtn.disabled = true;
		resetBtn.disabled = true;
		sampleBtn.disabled = true;
		updateReadout();
		for (var e = 0; e < epochs; e++) {
			var loss = opt.minimize(lossFn, true, params);
			lastLoss = loss.dataSync()[0];
			loss.dispose();
			lossHistory.push(lastLoss);
			if (e % 5 === 0 || e === epochs - 1) {
				updateReadout();
				if (lossApi) lossApi.redraw();
				await tf.nextFrame();
			}
		}
		training = false;
		trainBtn.disabled = false;
		resetBtn.disabled = false;
		sampleBtn.disabled = false;
		updateReadout();
		showAttention();
		sample();
	}

	function showAttention() {
		if (!tf || !model) return;
		var out = forward(ids, true);
		var logits = out[0];
		attnHeads = out[1] && out[1].length ? out[1][out[1].length - 1] : null;
		logits.dispose();
		if (attnApi) attnApi.redraw();
	}

	function drawLoss(ctx, w, h) {
		var c = TM.colors();
		ctx.clearRect(0, 0, w, h);
		var padL = 42, padR = 12, padT = 10, padB = 22;
		ctx.strokeStyle = c.line;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(padL, padT); ctx.lineTo(padL, h - padB); ctx.lineTo(w - padR, h - padB);
		ctx.stroke();
		if (!lossHistory.length) return;
		var max = Math.max.apply(null, lossHistory), min = Math.min.apply(null, lossHistory);
		var span = Math.max(max - min, 1e-6);
		ctx.beginPath();
		lossHistory.forEach(function (v, i) {
			var x = lossHistory.length === 1 ? padL : padL + i / (lossHistory.length - 1) * (w - padL - padR);
			var y = h - padB - (v - min) / span * (h - padT - padB);
			if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
		});
		ctx.strokeStyle = c.green;
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.fillStyle = c.muted;
		ctx.font = "600 9px Barlow, system-ui, sans-serif";
		ctx.textAlign = "right";
		ctx.fillText(max.toFixed(2), padL - 5, padT + 8);
		ctx.fillText(min.toFixed(2), padL - 5, h - padB);
		ctx.textAlign = "left";
		ctx.fillText(txt("loss", "Fehler"), padL + 4, padT + 8);
		ctx.textAlign = "right";
		ctx.fillText(txt("epoch", "Epoche"), w - padR, h - 6);
		ctx.textAlign = "left";
	}

	function drawAttention(ctx, w, h) {
		var c = TM.colors();
		ctx.clearRect(0, 0, w, h);
		if (!attnHeads) {
			ctx.fillStyle = c.muted;
			ctx.font = "600 11px Barlow, system-ui, sans-serif";
			ctx.textAlign = "center";
			ctx.fillText(txt("Train the model to see real attention heads.", "Trainiere das Modell, um echte Attention-Heads zu sehen."), w / 2, h / 2);
			ctx.textAlign = "left";
			return;
		}
		var data = attnHeads.data, H = attnHeads.heads, T = attnHeads.T;
		var gap = 14, pad = 12;
		var panelW = (w - pad * 2 - gap * (H - 1)) / H;
		var size = Math.max(4, Math.min(panelW / T, (h - 34) / T));
		var totalW = size * T;
		for (var hh = 0; hh < H; hh++) {
			var ox = pad + hh * (panelW + gap) + (panelW - totalW) / 2;
			var oy = 20;
			ctx.fillStyle = c.muted;
			ctx.font = "600 9px Barlow, system-ui, sans-serif";
			ctx.textAlign = "center";
			ctx.fillText(txt("head ", "Head ") + (hh + 1), ox + totalW / 2, 10);
			for (var i = 0; i < T; i++) {
				for (var j = 0; j < T; j++) {
					var v = data[(hh * T + i) * T + j] || 0;
					ctx.fillStyle = v <= 0.001
						? (c.dark ? "rgba(120,140,150,.10)" : "rgba(120,140,150,.08)")
						: "color-mix(in srgb, " + c.green + " " + Math.min(100, v * 180).toFixed(1) + "%, " + c.paper2 + ")";
					ctx.fillRect(ox + j * size, oy + i * size, Math.max(1, size - 1), Math.max(1, size - 1));
				}
			}
			ctx.fillStyle = c.muted;
			ctx.font = "600 7px Barlow, system-ui, sans-serif";
			for (var k = 0; k < T; k++) {
				ctx.textAlign = "center";
				ctx.fillText(itos[ids[k]] === " " ? "␣" : itos[ids[k]], ox + k * size + size / 2, oy - 3);
				ctx.textAlign = "right";
				ctx.fillText(itos[ids[k]] === " " ? "␣" : itos[ids[k]], ox - 3, oy + k * size + size / 2 + 3);
			}
		}
		ctx.textAlign = "left";
	}

	function sample() {
		if (!tf || !model || training) return;
		var prompt = "the ";
		var seq = prompt.split("").map(function (c) { return stoi[c]; }).filter(function (v) { return v != null; });
		if (!seq.length) seq = ids.slice(0, Math.min(3, ids.length));
		var T = cfg.context;
		var out = prompt;
		for (var step = 0; step < 24; step++) {
			var ctxIds = seq.slice(-T);
			while (ctxIds.length < T) ctxIds.unshift(0);
			var logits = forward(ctxIds, false);
			var last = logits.slice([T - 1, 0], [1, vocab.length]);
			var probs = tf.softmax(tf.div(last, 0.8), -1);
			var arr = probs.dataSync();
			var r = Math.random(), acc = 0, pick = 0;
			for (var i = 0; i < arr.length; i++) { acc += arr[i]; if (r <= acc) { pick = i; break; } }
			logits.dispose(); last.dispose(); probs.dispose();
			var ch = itos[pick] || "?";
			out += ch;
			seq.push(pick);
			if (ch === "." && out.length > prompt.length + 6) break;
		}
		sampleText = out;
		if (sampleOut) sampleOut.textContent = txt("Sample: ", "Beispiel: ") + "“" + sampleText + "”";
	}

	function reset() {
		if (training) return;
		readConfig();
		buildVocab();
		buildModel();
		if (sampleOut) sampleOut.textContent = txt("Train the model, then press Sample to generate a short continuation.", "Trainiere das Modell und drücke dann Sample für eine kurze Fortsetzung.");
		if (statusEl) statusEl.textContent = txt("ready", "bereit");
		if (lossApi) lossApi.redraw();
		if (attnApi) attnApi.redraw();
	}

	if (!tf) {
		if (statusEl) statusEl.textContent = txt("TensorFlow.js not loaded", "TensorFlow.js nicht geladen");
		if (trainBtn) trainBtn.disabled = true;
		return;
	}

	[trainBtn, resetBtn, sampleBtn].forEach(function (b) { if (b) b.disabled = false; });
	if (trainBtn) trainBtn.addEventListener("click", train);
	if (resetBtn) resetBtn.addEventListener("click", reset);
	if (sampleBtn) sampleBtn.addEventListener("click", sample);
	[dEl, headsEl, layersEl, contextEl].forEach(function (el) { if (el) el.addEventListener("change", reset); });
	var corpusTimer = null;
	if (corpusEl) corpusEl.addEventListener("input", function () {
		if (corpusTimer) clearTimeout(corpusTimer);
		corpusTimer = setTimeout(reset, 350);
	});
	window.addEventListener("tm:theme", function () {
		if (lossApi) lossApi.redraw();
		if (attnApi) attnApi.redraw();
	});
	reset();
})();
