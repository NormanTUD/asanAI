(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var SHARED = core.SHARED, TEMP = core.TEMP, WORDS = core.WORDS, WORD_IDS = core.WORD_IDS, EXAMPLES = core.EXAMPLES, PAIRS = core.PAIRS;
  var esc = core.esc, clamp = core.clamp, lerp = core.lerp, ease = core.ease;
  function stackScene(root, api) {
    var DE = api.lang === "de";
    var stages = DE ? [
      { id: "tokenizer", label: "Tokenizer", sub: "Kontext → Tokens" },
      { id: "embed", label: "Embedding", sub: "Tokens → Vektoren" },
      { id: "layers", label: "Schichten × N", sub: "Attention + FFN" },
      { id: "unembed", label: "Unembedding", sub: "Vektor → Scores" }
    ] : [
      { id: "tokenizer", label: "Tokenizer", sub: "context → tokens" },
      { id: "embed", label: "Embedding", sub: "tokens → vectors" },
      { id: "layers", label: "Layers × N", sub: "attention + FFN" },
      { id: "unembed", label: "Unembedding", sub: "vector → scores" }
    ];
    var el = document.createElement("div");
    el.className = "ls-stack-scene";
    el.innerHTML = '<div class="ls-stack-stage"><canvas class="ls-canvas" role="img"></canvas></div><div class="ls-stack-readout" aria-live="polite"></div>';
    root.appendChild(el);
    var stage = el.querySelector(".ls-stack-stage");
    var canvas = el.querySelector("canvas");
    var readout = el.querySelector(".ls-stack-readout");
    var ctx = null, size = null, mode = "pipeline", hits = [];
    var C = api.colors();
    function draw() {
      if (!size) return;
      ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      var w = size.w, h = size.h, pad = 24;
      hits = [];
      if (mode === "layer") {
        var n = 5;
        var cell = Math.min((w - pad * 2) / n, (h - pad * 2 - 30) / n);
        var x0 = w / 2 - cell * n / 2, y0 = 44;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        var labels = DE ? ["Die", "Hauptstadt", "von", "Frankreich", "ist"] : ["The", "capital", "of", "France", "is"];
        labels.forEach(function (l, i) {
          ctx.fillStyle = C.muted; ctx.fillText(l, x0 + i * cell + cell / 2, y0 - 8);
          ctx.fillText(l, x0 - 8, y0 + i * cell + cell / 2 + 3);
        });
        for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
          var on = j <= i;
          var wgt = on ? (1 / (i + 1)) : 0;
          ctx.fillStyle = on ? "rgba(18,117,172," + (0.15 + wgt * 0.7) + ")" : "rgba(0,75,111,.04)";
          ctx.fillRect(x0 + j * cell, y0 + i * cell, cell - 1, cell - 1);
          if (on) { ctx.fillStyle = "#fff"; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; ctx.fillText((wgt * 100).toFixed(0), x0 + j * cell + cell / 2, y0 + i * cell + cell / 2 + 3); }
        }
        ctx.fillStyle = C.soft; ctx.font = '600 ' + api.font("canvas") + 'px "Open Sans", sans-serif'; ctx.textAlign = "left";
        ctx.fillText(DE ? "Kausale Self-Attention: Zeile fragt, Spalte antwortet" : "Causal self-attention: row asks, column answers", pad, 22);
        readout.innerHTML = '<span>' + (DE ? "Maskiert" : "Masked") + ' <b>' + (DE ? "oberes Dreieck" : "upper triangle") + '</b></span><span>' + (DE ? "Jede Zeile summiert zu 1" : "Every row sums to 1") + '</span>';
        return;
      }
      if (mode === "block") {
        var by = h * 0.40;
        var bw = Math.min(126, (w - pad * 2) / 5 - 10);
        var stepX = (w - pad * 2 - bw) / 4;
        var startX = pad + bw / 2;
        function blockNode(i, title, sub, fill, stroke, ink) {
          var x = startX + i * stepX;
          ctx.fillStyle = fill;
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 1.4;
          ctx.fillRect(x - bw / 2, by - 28, bw, 56);
          ctx.strokeRect(x - bw / 2, by - 28, bw, 56);
          ctx.fillStyle = ink || C.ink;
          ctx.font = '700 ' + api.font("canvas") + 'px "Barlow", sans-serif';
          ctx.textAlign = "center";
          ctx.fillText(title, x, by - 2);
          if (sub) {
            ctx.fillStyle = C.muted;
            ctx.font = api.font("canvas-sm") + 'px "Open Sans", sans-serif';
            ctx.fillText(sub, x, by + 14);
          }
          return x;
        }
        var x0 = blockNode(0, DE ? "x" : "x", DE ? "Token + Position" : "token + position", "rgba(247,249,248,.92)", C.lineStrong, C.ink);
        var x1 = blockNode(1, "Attention", DE ? "mischt Tokens" : "mixes tokens", "rgba(99,164,75,.14)", C.green, C.petrol);
        var x2 = blockNode(2, "+", "", "rgba(255,255,255,.9)", C.lineStrong, C.green);
        var x3 = blockNode(3, "FFN", DE ? "rechnet pro Token" : "computes per token", "rgba(255,255,255,.72)", C.lineStrong, C.ink);
        var x4 = blockNode(4, DE ? "x′" : "x′", DE ? "nächster Block" : "next block", "rgba(247,249,248,.92)", C.lineStrong, C.ink);
        function link(a, b, col) {
          ctx.strokeStyle = col || C.lineStrong;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(a + bw / 2, by); ctx.lineTo(b - bw / 2, by); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(b - bw / 2, by); ctx.lineTo(b - bw / 2 - 6, by - 4); ctx.lineTo(b - bw / 2 - 6, by + 4); ctx.closePath(); ctx.fillStyle = col || C.lineStrong; ctx.fill();
        }
        link(x0, x1); link(x1, x2); link(x2, x3); link(x3, x4);
        ctx.strokeStyle = C.gold;
        ctx.lineWidth = 1.3;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(x0, by + 28); ctx.quadraticCurveTo((x0 + x2) / 2, by + 96, x2, by + 28); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x2, by + 28); ctx.quadraticCurveTo((x2 + x3) / 2, by + 72, x3, by + 28); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.gold;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(DE ? "Residual +" : "residual +", (x0 + x2) / 2, by + 88);
        ctx.fillStyle = C.green;
        ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.fillText(DE ? "hier zoomt die nächste Folie hinein" : "the next slide zooms in here", x1, by - 42);
        readout.innerHTML = '<span>' + (DE ? "Block" : "Block") + ' <b>Attention + FFN</b></span><span>' + (DE ? "beide mit Residual" : "both with residual") + '</span><span>' + (DE ? "Attention mischt Tokens, FFN rechnet pro Token" : "attention mixes tokens, FFN computes per token") + '</span>';
        return;
      }
      var gap = Math.min(150, (w - pad * 2) / 4);
      var start = w / 2 - gap * 1.5;
      var y = h * 0.5;
      stages.forEach(function (s, i) {
        var x = start + i * gap;
        var on = hits.some(function (h2) { return h2.id === s.id && h2.on; });
        ctx.fillStyle = i === 2 ? "rgba(99,164,75,.12)" : "rgba(255,255,255,.72)";
        ctx.strokeStyle = i === 2 ? C.green : C.lineStrong;
        ctx.fillRect(x - 58, y - 26, 116, 52);
        ctx.strokeRect(x - 58, y - 26, 116, 52);
        ctx.fillStyle = C.ink; ctx.font = '700 ' + api.font("canvas") + 'px "Barlow", sans-serif'; ctx.textAlign = "center";
        ctx.fillText(s.label, x, y - 2);
        ctx.fillStyle = C.muted; ctx.font = api.font("canvas-sm") + 'px "Open Sans", sans-serif';
        ctx.fillText(s.sub, x, y + 13);
        hits.push({ id: s.id, x: x, y: y, r: 62, on: false });
        if (i < stages.length - 1) {
          ctx.strokeStyle = C.lineStrong; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(x + 58, y); ctx.lineTo(x + gap - 58, y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + gap - 58, y); ctx.lineTo(x + gap - 64, y - 4); ctx.lineTo(x + gap - 64, y + 4); ctx.closePath(); ctx.fillStyle = C.lineStrong; ctx.fill();
        }
      });
      if (mode === "loop") {
        ctx.strokeStyle = C.green; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(start + 58, y + 26); ctx.lineTo(start + 58, y + 58); ctx.lineTo(start + 3 * gap - 58, y + 58); ctx.lineTo(start + 3 * gap - 58, y + 26); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.green; ctx.font = '600 ' + api.font("canvas-sm") + 'px "Open Sans", sans-serif'; ctx.textAlign = "center";
        ctx.fillText(DE ? "Token anhängen und wiederholen" : "append token and repeat", w / 2, y + 76);
      }
      readout.innerHTML = '<span>' + (DE ? "Stufen" : "Stages") + ' <b>' + stages.map(function (s) { return s.label; }).join(" → ") + '</b></span>';
    }
    function resize() { size = api.fit(canvas, stage); draw(); }
    canvas.addEventListener("pointerup", function (e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      hits.forEach(function (h2) { if (Math.hypot(h2.x - x, h2.y - y) < h2.r) { h2.on = true; readout.innerHTML = '<span><b>' + api.esc(stages.filter(function (s) { return s.id === h2.id; })[0].label) + '</b> ' + (DE ? "ist eine Stufe im Stapel." : "is one stage in the stack.") + '</span>'; } });
    });
    window.addEventListener("resize", resize);
    resize();
    return { update: function (s) { if (s && s.mode) { mode = s.mode; draw(); } }, resize: resize, destroy: function () { window.removeEventListener("resize", resize); el.remove(); } };
  }

  core.register("stack", stackScene);
})();
