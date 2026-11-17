(function () {
  "use strict";
  var core = window.LearnSysDemoCore;
  if (!core) return;
  var V = window.LearnSysVisuals;

  if (!document.getElementById("ls-grokking-style")) {
    var st = document.createElement("style");
    st.id = "ls-grokking-style";
    st.textContent = ".ls-grokking-scene{position:relative;width:100%;height:100%;min-height:460px;overflow:hidden;background:var(--tm-paper,#fff)}.ls-grokking-scene canvas{display:block;width:100%;height:100%;min-height:460px}.ls-grokking-controls{position:absolute;left:14px;right:14px;bottom:12px;z-index:5;display:none;align-items:center;gap:10px;flex-wrap:wrap;padding:7px 9px;background:rgba(255,255,255,.95);border:1px solid var(--tm-line-strong,#b9c8c3);box-shadow:0 8px 24px rgba(0,20,30,.10);font:600 10px/1.2 'Open Sans',sans-serif;color:var(--tm-ink-soft,#2c464d)}.ls-grokking-controls.is-on{display:flex}.ls-grokking-controls label{display:inline-flex;align-items:center;gap:5px;white-space:nowrap}.ls-grokking-controls input[type=range]{width:min(118px,22vw);accent-color:var(--tm-petrol,#004b6f)}.ls-grokking-controls output{min-width:2.2em;font:700 10px/1 'Barlow','Open Sans',sans-serif;color:var(--tm-petrol,#004b6f);font-variant-numeric:tabular-nums}.ls-grokking-controls button{border:1px solid var(--tm-petrol,#004b6f);background:var(--tm-petrol,#004b6f);color:#fff;padding:5px 9px;font:700 10px/1 'Open Sans',sans-serif;cursor:pointer;border-radius:0}.ls-grokking-controls button:hover{background:#003a56}@media(max-width:640px){.ls-grokking-controls{left:8px;right:8px;bottom:8px;gap:6px}.ls-grokking-controls input[type=range]{width:82px}}";
    document.head.appendChild(st);
  }

  function grokkingScene(root, api) {
    var DE = api.lang === "de";
    var C = api.colors();
    var host = document.createElement("div");
    host.className = "ls-grokking-scene";
    var canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img");
    host.appendChild(canvas);
    var controls = document.createElement("div");
    controls.className = "ls-grokking-controls";
    controls.innerHTML =
      '<label>a <input type="range" min="0" max="112" step="1" value="41" data-grok="a"><output data-grok-out="a">41</output></label>' +
      '<label>b <input type="range" min="0" max="112" step="1" value="52" data-grok="b"><output data-grok-out="b">52</output></label>' +
      '<button type="button" data-grok="rotate">' + (DE ? "Drehen" : "Rotate") + '</button>' +
      '<span data-grok-result>41 + 52 ≡ 93 (mod 113)</span>';
    host.appendChild(controls);
    root.appendChild(host);
    var ctx = canvas.getContext("2d");
    var W = 1, H = 1;
    var mode = "loss";
    var EPOCH_MAX = 14000;
    var scrubEpoch = 10800;
    var scrubbing = false;
    var MAX_LOSS = 3.1;
    var fourierA = 41;
    var fourierB = 52;
    var rotT = 1;
    var rotating = false;
    var rotRaf = 0;
    var controlsBound = false;

    function bindControls() {
      if (controlsBound) return;
      controlsBound = true;
      var rangeA = controls.querySelector('[data-grok="a"]');
      var rangeB = controls.querySelector('[data-grok="b"]');
      var outA = controls.querySelector('[data-grok-out="a"]');
      var outB = controls.querySelector('[data-grok-out="b"]');
      var result = controls.querySelector('[data-grok-result]');
      function sync() {
        fourierA = parseInt(rangeA.value, 10) || 0;
        fourierB = parseInt(rangeB.value, 10) || 0;
        outA.textContent = String(fourierA);
        outB.textContent = String(fourierB);
        var cval = (fourierA + fourierB) % 113;
        result.textContent = fourierA + " + " + fourierB + " ≡ " + cval + " (mod 113)";
        rotT = 1;
        stopRotate();
        draw();
      }
      rangeA.addEventListener("input", sync);
      rangeB.addEventListener("input", sync);
      controls.querySelector('[data-grok="rotate"]').addEventListener("click", function () {
        if (rotating) { stopRotate(); rotT = 1; draw(); return; }
        startRotate();
      });
    }

    function setControls(on) {
      controls.classList.toggle("is-on", !!on);
      if (on) bindControls();
      else stopRotate();
    }

    function startRotate() {
      if (!window.requestAnimationFrame) { rotT = 1; draw(); return; }
      rotating = true;
      rotT = 0;
      var start = performance.now();
      function step(now) {
        if (!rotating) return;
        rotT = Math.min(1, (now - start) / 900);
        draw();
        if (rotT < 1) rotRaf = requestAnimationFrame(step);
        else { rotating = false; rotT = 1; draw(); }
      }
      rotRaf = requestAnimationFrame(step);
    }

    function stopRotate() {
      rotating = false;
      if (rotRaf) cancelAnimationFrame(rotRaf);
      rotRaf = 0;
    }
    var ARIA = {
      loss: DE
        ? "Schematische Loss-Kurven: der Trainings-Loss fällt früh, der Test-Loss bleibt lange flach und fällt erst beim Grokking spät ab."
        : "Schematic loss curves: training loss falls early, test loss stays flat for a long time and drops late at grokking.",
      fourier: DE
        ? "Frequenzspektrum mit fünf hervorgehobenen Frequenzen und einem Kreis für die Winkeladdition a plus b modulo 113."
        : "Frequency spectrum with five highlighted frequencies and a circle for angle addition a plus b modulo 113.",
      measures: DE
        ? "Drei synchronisierte Fortschrittsmaße über dieselben drei Phasen: Restricted Loss, Excluded Loss und ein Gewichtsmaß."
        : "Three synchronized progress measures over the same three phases: restricted loss, excluded loss and a weight measure."
    };

    function txt(c, s, x, y, o) {
      var opt = o || {};
      var size = typeof opt.size === "number" ? opt.size : 11;
      V.label(c, s, x, y, {
        size: size,
        font: opt.font || '400 ' + size + 'px "Open Sans", "Segoe UI", sans-serif',
        color: opt.color || C.soft,
        align: opt.align || "left",
        baseline: opt.baseline || "middle",
        alpha: typeof opt.alpha === "number" ? opt.alpha : 1,
        bg: opt.bg === undefined ? false : opt.bg,
        bgAlpha: opt.bgAlpha
      });
    }

    function head(c, s, x, y, o) {
      var opt = o || {};
      var size = typeof opt.size === "number" ? opt.size : 24;
      txt(c, s, x, y, {
        size: size,
        font: '700 ' + size + 'px "Barlow", "Open Sans", sans-serif',
        color: opt.color || C.ink,
        align: opt.align || "left"
      });
    }

    function accent(c, x, y, w) {
      c.save();
      c.strokeStyle = C.gold;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + w, y);
      c.stroke();
      c.restore();
    }

    function sigmoid(z) {
      return 1 / (1 + Math.exp(-z));
    }

    function logFrac(e) {
      return Math.log(1 + e) / Math.log(1 + EPOCH_MAX);
    }

    function fmtEpoch(e) {
      return e >= 1000 ? (e / 1000).toFixed(1).replace(".", ",") + "k" : String(Math.round(e));
    }

    function phaseAt(e) {
      var phases = phaseData();
      for (var i = 0; i < phases.length; i++) {
        if (e >= phases[i].start && e < phases[i].end) return phases[i];
      }
      return phases[phases.length - 1];
    }

    function drawScrubber(c, x0, x1, y) {
      var f = logFrac(scrubEpoch);
      var sx = x0 + f * (x1 - x0);
      c.save();
      c.strokeStyle = V.alpha(C.lineStrong, 0.9);
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x0, y);
      c.lineTo(x1, y);
      c.stroke();
      c.strokeStyle = V.alpha(C.gold, 0.45);
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(x0, y);
      c.lineTo(sx, y);
      c.stroke();
      c.fillStyle = C.gold;
      c.beginPath();
      c.arc(sx, y, 6, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = C.paper;
      c.lineWidth = 1.5;
      c.stroke();
      c.restore();
      var ph = phaseAt(scrubEpoch);
      txt(c, (DE ? "Epoche " : "epoch ") + fmtEpoch(scrubEpoch) + " · " + ph.name, x0, y - 14, {
        size: 9.5,
        color: C.ink,
        font: '600 9.5px "Open Sans", sans-serif'
      });
      txt(c, DE ? "ziehe" : "drag", x1, y - 14, {
        align: "right",
        size: 8.5,
        color: C.muted
      });
    }

    function scrubAt(e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left;
      var y = e.clientY - r.top;
      if (y < H - 98 || y > H - 48) return false;
      var pad = Math.max(18, Math.min(30, W * 0.04));
      var x0, x1;
      if (mode === "measures") {
        x0 = pad + (W < 620 ? 88 : 118);
        x1 = W - pad;
      } else {
        x0 = pad + (W < 620 ? 42 : 52);
        x1 = W - pad - 10;
      }
      if (x < x0 - 8 || x > x1 + 8) return false;
      var f = V.clamp((x - x0) / (x1 - x0), 0, 1);
      scrubEpoch = Math.pow(1 + EPOCH_MAX, f) - 1;
      draw();
      return true;
    }

    function phaseData() {
      return [
        { start: 0, end: 1400, color: C.lilac, name: DE ? "Memorisierung" : "Memorization", range: DE ? "0-1,4k" : "0-1.4k" },
        { start: 1400, end: 9400, color: C.sky, name: DE ? "Schaltkreisbildung" : "Circuit formation", range: DE ? "1,4-9,4k" : "1.4-9.4k" },
        { start: 9400, end: EPOCH_MAX, color: C.green, name: DE ? "Aufräumen" : "Cleanup", range: DE ? "9,4-14k" : "9.4-14k" }
      ];
    }

    function drawBackground(c) {
      c.clearRect(0, 0, W, H);
      c.fillStyle = C.paper;
      c.fillRect(0, 0, W, H);
      var g = c.createRadialGradient(W * 0.18, H * 0.06, 0, W * 0.18, H * 0.06, Math.max(W, H) * 0.95);
      g.addColorStop(0, V.alpha(C.petrol, 0.16));
      g.addColorStop(0.44, V.alpha(C.sky, 0.06));
      g.addColorStop(1, V.alpha(C.paper, 0));
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      var g2 = c.createRadialGradient(W * 0.9, H * 0.9, 0, W * 0.9, H * 0.9, Math.max(W, H) * 0.7);
      g2.addColorStop(0, V.alpha(C.green, 0.045));
      g2.addColorStop(1, V.alpha(C.paper, 0));
      c.fillStyle = g2;
      c.fillRect(0, 0, W, H);
      var vig = c.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.24, W * 0.5, H * 0.5, Math.max(W, H) * 0.74);
      vig.addColorStop(0, V.alpha(C.petrol, 0));
      vig.addColorStop(1, V.alpha(C.petrol, 0.09));
      c.fillStyle = vig;
      c.fillRect(0, 0, W, H);
      c.save();
      c.fillStyle = V.alpha(C.petrol, 0.05);
      for (var gx = 24; gx < W; gx += 30) {
        for (var gy = 24; gy < H; gy += 30) c.fillRect(gx, gy, 1, 1);
      }
      c.restore();
      c.strokeStyle = V.alpha(C.line, 0.8);
      c.lineWidth = 1;
      c.strokeRect(0.5, 0.5, W - 1, H - 1);
    }

    function drawPhaseBands(c, phases, x0, x1, y0, y1) {
      var pw = x1 - x0;
      var i, p, xa, xb;
      for (i = 0; i < phases.length; i++) {
        p = phases[i];
        xa = x0 + logFrac(p.start) * pw;
        xb = x0 + logFrac(p.end) * pw;
        c.fillStyle = V.alpha(p.color, 0.075);
        c.fillRect(xa, y0, xb - xa, y1 - y0);
      }
      for (i = 1; i < phases.length; i++) {
        xa = x0 + logFrac(phases[i].start) * pw;
        c.save();
        c.strokeStyle = V.alpha(C.lineStrong, 0.55);
        c.lineWidth = 1;
        c.setLineDash([4, 4]);
        c.beginPath();
        c.moveTo(xa, y0);
        c.lineTo(xa, y1);
        c.stroke();
        c.restore();
      }
    }

    function drawLegend(c, x, y, color, label, size) {
      c.save();
      c.strokeStyle = color;
      c.lineWidth = 2.4;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 14, y);
      c.stroke();
      c.font = '600 ' + size + 'px "Open Sans", "Segoe UI", sans-serif';
      c.textAlign = "left";
      c.textBaseline = "middle";
      c.fillStyle = C.soft;
      c.fillText(label, x + 19, y + 0.5);
      var w = 19 + c.measureText(label).width;
      c.restore();
      return w;
    }

    function drawTicks(c, x0, x1, y1, small) {
      var pw = x1 - x0;
      var ticks = [
        [0, "0"],
        [1400, DE ? "1,4k" : "1.4k"],
        [9400, DE ? "9,4k" : "9.4k"],
        [EPOCH_MAX, "14k"]
      ];
      var i, xa;
      for (i = 0; i < ticks.length; i++) {
        xa = x0 + logFrac(ticks[i][0]) * pw;
        c.save();
        c.strokeStyle = V.alpha(C.lineStrong, 0.9);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(xa, y1);
        c.lineTo(xa, y1 + 4);
        c.stroke();
        c.restore();
        txt(c, ticks[i][1], xa, y1 + 15, {
          align: i === 0 ? "left" : i === ticks.length - 1 ? "right" : "center",
          size: small ? 8 : 8.5,
          color: C.muted
        });
      }
      txt(c, DE ? "Epochen (log)" : "epochs (log)", x1, y1 + 29, { align: "right", size: 8.2, color: C.muted });
    }

    function drawLoss(c) {
      var pad = Math.max(18, Math.min(30, W * 0.04));
      var small = W < 620;
      var phases = phaseData();
      head(c, "Grokking", pad, 30, { size: small ? 22 : 26 });
      txt(c, DE ? "Verzögertes Generalisieren bei mod 113" : "Delayed generalisation on mod 113", pad, 52, {
        size: small ? 10.5 : 12,
        color: C.muted
      });
      accent(c, pad, 66, 40);
      txt(c, DE ? "schematisch · Hauptlauf P=113" : "schematic · main run P=113", W - pad, 30, {
        align: "right",
        size: 8.5,
        color: C.muted
      });

      var x0 = pad + (small ? 42 : 52);
      var x1 = W - pad - 10;
      var y0 = 104;
      var y1 = H - 96;
      var pw = x1 - x0;
      var ph = y1 - y0;
      if (pw < 40 || ph < 60) return;

      function yOf(v) {
        return y1 - (v / MAX_LOSS) * ph;
      }

      c.fillStyle = V.alpha(C.paper2, 0.55);
      c.fillRect(x0, y0, pw, ph);
      drawPhaseBands(c, phases, x0, x1, y0, y1);

      c.save();
      c.strokeStyle = V.alpha(C.line, 0.6);
      c.lineWidth = 1;
      c.setLineDash([2, 5]);
      for (var g = 0; g <= 3; g++) {
        var gy = yOf(g);
        c.beginPath();
        c.moveTo(x0, gy);
        c.lineTo(x1, gy);
        c.stroke();
      }
      c.restore();

      for (var gg = 0; gg <= 3; gg++) {
        txt(c, String(gg), x0 - 8, yOf(gg), { align: "right", size: 8.5, color: C.muted });
      }
      txt(c, "Loss", x0, y0 - 7, { size: 8.5, color: C.muted });
      txt(c, phases[0].name + " " + phases[0].range, x0, y0 - 22, { size: 8.2, color: C.soft });
      txt(c, phases[1].name + " " + phases[1].range, x1, y0 - 22, { align: "right", size: 8.2, color: C.soft });
      txt(c, phases[2].name + " " + phases[2].range, x1, y0 - 8, { align: "right", size: 8.2, color: C.soft });

      c.save();
      c.strokeStyle = V.alpha(C.lineStrong, 0.9);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x0, y1);
      c.lineTo(x1, y1);
      c.stroke();
      c.restore();

      drawTicks(c, x0, x1, y1, small);

      function trainLoss(e) {
        return 0.02 + 2.35 * Math.exp(-e / 210);
      }

      function testLoss(e) {
        return 0.03 + 2.40 * Math.exp(-e / 230) + 0.44 - 0.41 * sigmoid((e - 10800) / 380);
      }

      function strokeCurve(fn, color) {
        c.save();
        c.beginPath();
        c.lineWidth = 2.2;
        c.lineJoin = "round";
        c.lineCap = "round";
        for (var k = 0; k <= 240; k++) {
          var f = k / 240;
          var e = Math.pow(1 + EPOCH_MAX, f) - 1;
          var px = x0 + f * pw;
          var py = yOf(fn(e));
          if (k === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.strokeStyle = color;
        c.stroke();
        c.restore();
      }

      strokeCurve(trainLoss, C.green);
      strokeCurve(testLoss, C.blue);

      var gx = x0 + logFrac(10800) * pw;
      c.save();
      c.strokeStyle = V.alpha(C.gold, 0.42);
      c.lineWidth = 1;
      c.setLineDash([3, 4]);
      c.beginPath();
      c.moveTo(gx, y0);
      c.lineTo(gx, y1);
      c.stroke();
      c.restore();

      var gy2 = yOf(testLoss(10800));
      c.save();
      c.fillStyle = C.gold;
      c.beginPath();
      c.arc(gx, gy2, 3.4, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = C.paper;
      c.lineWidth = 1.4;
      c.stroke();
      c.restore();
      txt(c, "Grokking", gx - 7, gy2 - 17, {
        align: "right",
        size: 10.5,
        font: '700 10.5px "Barlow", "Open Sans", sans-serif',
        color: C.gold,
        bg: C.paper,
        bgAlpha: 0.92
      });

      var sx = x0 + logFrac(scrubEpoch) * pw;
      c.save();
      c.strokeStyle = V.alpha(C.gold, 0.55);
      c.lineWidth = 1.2;
      c.setLineDash([3, 4]);
      c.beginPath();
      c.moveTo(sx, y0);
      c.lineTo(sx, y1);
      c.stroke();
      c.restore();
      c.fillStyle = C.gold;
      c.beginPath();
      c.arc(sx, yOf(testLoss(scrubEpoch)), 3.4, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = C.paper;
      c.lineWidth = 1.3;
      c.stroke();

      drawScrubber(c, x0, x1, H - 72);

      var ly = H - 50;
      var lx = pad;
      lx += drawLegend(c, lx, ly, C.green, DE ? "Trainings-Loss" : "training loss", 9.5) + 18;
      drawLegend(c, lx, ly, C.blue, DE ? "Test-Loss" : "test loss", 9.5);

      txt(c, DE
        ? "c = a + b mod 113 · einlagiger Transformer · 30 % der Paare · λ = 1"
        : "c = a + b mod 113 · one-layer transformer · 30% of pairs · λ = 1",
        pad, H - 32, { size: 8.4, color: C.muted });
      txt(c, "Nanda et al. (2023) · arXiv:2301.05217", pad, H - 14, { size: 8.2, color: C.muted });
    }

    function drawSpectrum(c, x0, x1, y0, y1, small) {
      var keyed = { 14: 0.56, 35: 0.75, 41: 0.93, 42: 0.83, 52: 0.67 };
      var order = [14, 35, 41, 42, 52];
      var cols = [C.green, C.sky, C.gold, C.lilac, C.lime];
      var n = 57;
      var step = (x1 - x0) / n;
      var bw = Math.max(1, step * 0.58);
      var k, amp, h, bx;

      c.fillStyle = V.alpha(C.line, 0.55);
      c.fillRect(x0, y1, x1 - x0, 1);

      for (k = 0; k < n; k++) {
        amp = keyed[k];
        if (typeof amp === "number") {
          h = amp * (y1 - y0);
          c.fillStyle = cols[order.indexOf(k)];
        } else {
          h = (0.06 + 0.025 * Math.abs(Math.sin(k * 0.9))) * (y1 - y0);
          c.fillStyle = V.alpha(C.lineStrong, 0.48);
        }
        bx = x0 + k * step + (step - bw) / 2;
        c.fillRect(bx, y1 - h, bw, h);
      }

      txt(c, DE ? "Amplitude" : "amplitude", x0, y0 - 5, { size: 8.2, color: C.muted });
      txt(c, "k", x1, y1 + 15, { align: "right", size: 8.5, color: C.muted });

      var tickK = [0, 28, 56];
      for (k = 0; k < tickK.length; k++) {
        bx = x0 + (tickK[k] + 0.5) * step;
        c.save();
        c.strokeStyle = V.alpha(C.lineStrong, 0.8);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(bx, y1);
        c.lineTo(bx, y1 + 4);
        c.stroke();
        c.restore();
        txt(c, String(tickK[k]), bx, y1 + 14, {
          align: k === 0 ? "left" : k === tickK.length - 1 ? "right" : "center",
          size: small ? 7.6 : 8,
          color: C.muted
        });
      }

      txt(c, "k = 14 · 35 · 41 · 42 · 52", x0, y1 + 31, { size: small ? 7.8 : 8.4, color: C.soft });
    }

    function drawAngleCircle(c, cx, cy, r, small, a, b, rot) {
      var mod = 113;
      var t = typeof rot === "number" ? rot : 1;
      var bEff = b * t;
      var cval = (a + bEff) % mod;
      var base = -Math.PI / 2;
      function ang(v) { return base + (v / mod) * Math.PI * 2; }
      var aa = ang(a);
      var ab = ang(b);
      var ar = ang(cval);
      var i;

      c.save();
      c.fillStyle = V.alpha(C.paper, 0.62);
      c.beginPath();
      c.arc(cx, cy, r + 12, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = V.alpha(C.petrol, 0.18);
      c.lineWidth = 1;
      c.beginPath();
      c.arc(cx, cy, r + 12, 0, Math.PI * 2);
      c.stroke();
      c.restore();

      c.save();
      c.strokeStyle = V.alpha(C.lineStrong, 0.8);
      c.lineWidth = 1;
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.stroke();
      c.restore();

      for (i = 0; i < 24; i++) {
        var tickA = base + (i / 24) * Math.PI * 2;
        var major = i % 2 === 0;
        c.save();
        c.strokeStyle = V.alpha(major ? C.petrol : C.lineStrong, major ? 0.38 : 0.28);
        c.lineWidth = major ? 1.1 : 0.8;
        c.beginPath();
        c.moveTo(cx + Math.cos(tickA) * r * (major ? 0.90 : 0.94), cy + Math.sin(tickA) * r * (major ? 0.90 : 0.94));
        c.lineTo(cx + Math.cos(tickA) * r, cy + Math.sin(tickA) * r);
        c.stroke();
        c.restore();
      }

      for (i = 0; i < 4; i++) {
        var qv = Math.round(i * 113 / 4);
        var qa = base + i * Math.PI / 2;
        txt(c, String(qv), cx + Math.cos(qa) * r * 0.78, cy + Math.sin(qa) * r * 0.78, {
          align: "center",
          size: small ? 7.2 : 7.8,
          color: C.muted
        });
      }

      c.save();
      c.strokeStyle = V.alpha(C.gold, 0.8);
      c.lineWidth = 2.2;
      c.lineCap = "round";
      c.beginPath();
      c.arc(cx, cy, r * 0.56, aa, ar);
      c.stroke();
      c.restore();

      // Ghost: where a was before the rotation.
      V.arrow(c, cx, cy, cx + Math.cos(aa) * r * 0.82, cy + Math.sin(aa) * r * 0.82, V.alpha(C.green, 0.32), 1.6, 5);
      V.arrow(c, cx, cy, cx + Math.cos(ab) * r * 0.82, cy + Math.sin(ab) * r * 0.82, V.alpha(C.sky, 0.45), 1.6, 5);
      V.arrow(c, cx, cy, cx + Math.cos(ar) * r * 0.82, cy + Math.sin(ar) * r * 0.82, C.gold, 2.6, 7);

      c.save();
      c.fillStyle = C.petrol;
      c.beginPath();
      c.arc(cx, cy, 2.6, 0, Math.PI * 2);
      c.fill();
      c.restore();

      function tipLabel(text, angVal, color) {
        var tx = cx + Math.cos(angVal) * (r + 14);
        var ty = cy + Math.sin(angVal) * (r + 14);
        var align = Math.cos(angVal) > 0.25 ? "left" : Math.cos(angVal) < -0.25 ? "right" : "center";
        txt(c, text, tx, ty, {
          align: align,
          size: small ? 9.5 : 11,
          font: '700 ' + (small ? 9.5 : 11) + 'px "Barlow", "Open Sans", sans-serif',
          color: color
        });
      }
      tipLabel("a=" + a, aa, C.green);
      tipLabel("b=" + b, ab, C.sky);
      tipLabel(t < 0.999 ? "a+b·t" : "c=" + Math.round(cval), ar, C.gold);

      if (t < 0.999) {
        var mid = (aa + ar) / 2;
        txt(c, "dreht", cx + Math.cos(mid) * r * 0.7, cy + Math.sin(mid) * r * 0.7, {
          align: "center",
          size: small ? 8.2 : 9.2,
          color: C.gold
        });
      }

      txt(c, DE ? "Zahl → Winkel" : "number → angle", cx, cy - r - (small ? 13 : 17), {
        align: "center",
        size: 8.6,
        color: C.muted
      });
      txt(c, "a + b mod 113 = c", cx, cy + r + (small ? 20 : 24), {
        align: "center",
        size: small ? 10 : 11,
        font: '700 ' + (small ? 10 : 11) + 'px "Barlow", "Open Sans", sans-serif',
        color: C.ink
      });
      txt(c, a + " + " + Math.round(bEff) + " ≡ " + Math.round(cval) + " (mod 113)", cx, cy + r + (small ? 34 : 40), {
        align: "center",
        size: small ? 8.5 : 9.2,
        color: C.muted
      });
    }

    function drawFrequencyBank(c, x, y, w, h, small, a, b, rot) {
      var ks = [14, 35, 41, 42, 52];
      var cols = [C.green, C.sky, C.gold, C.lilac, C.lime];
      var gap = small ? 8 : 12;
      var r = Math.max(10, Math.min(18, (w - gap * 4) / 12));
      var cx0 = x + r + 6;
      var cy = y + h / 2 + 2;
      txt(c, DE ? "Fünf Frequenzen, fünf Uhren" : "Five frequencies, five clocks", x, y + 9, {
        size: small ? 7.8 : 8.8,
        color: C.muted
      });
      for (var i = 0; i < ks.length; i++) {
        var k = ks[i];
        var cx = cx0 + i * (2 * r + gap);
        c.save();
        c.strokeStyle = V.alpha(cols[i], 0.34);
        c.lineWidth = 1;
        c.beginPath();
        c.arc(cx, cy, r, 0, Math.PI * 2);
        c.stroke();
        c.restore();
        var angleA = -Math.PI / 2 + (k * a / 113) * Math.PI * 2;
        var angleC = -Math.PI / 2 + (k * (a + b * rot) / 113) * Math.PI * 2;
        c.save();
        c.strokeStyle = V.alpha(cols[i], 0.35);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(cx, cy);
        c.lineTo(cx + Math.cos(angleA) * r * 0.78, cy + Math.sin(angleA) * r * 0.78);
        c.stroke();
        c.restore();
        c.fillStyle = cols[i];
        c.beginPath();
        c.arc(cx + Math.cos(angleC) * r * 0.78, cy + Math.sin(angleC) * r * 0.78, Math.max(2.4, r * 0.16), 0, Math.PI * 2);
        c.fill();
        txt(c, "k=" + k, cx, cy + r + 10, {
          align: "center",
          size: small ? 7.2 : 7.8,
          color: cols[i],
          font: '700 ' + (small ? 7.2 : 7.8) + 'px "Open Sans", sans-serif'
        });
      }
    }

    function drawFourier(c) {
      var pad = Math.max(18, Math.min(30, W * 0.04));
      var small = W < 620;
      var foot = 58;
      head(c, DE ? "Addition als Drehung" : "Addition as rotation", pad, 30, { size: small ? 20 : 25 });
      txt(c, DE ? "Fünf Frequenzen tragen die Addition auf dem Kreis." : "Five frequencies carry the addition on a circle.", pad, 52, {
        size: small ? 10.2 : 11.6,
        color: C.muted
      });
      accent(c, pad, 66, 40);
      txt(c, DE ? "95 % der Logit-Varianz" : "95% of logit variance", W - pad, 30, {
        align: "right",
        size: 8.5,
        color: C.muted
      });
      txt(c, "e^(iθa) · e^(iθb) = e^(i(θa+θb))", W - pad, 48, {
        align: "right",
        size: small ? 8.4 : 9.2,
        color: C.petrol,
        font: '700 ' + (small ? 8.4 : 9.2) + 'px "Open Sans", sans-serif'
      });

      var stepsY = 80;
      var steps = DE
        ? ["1  Zahl → Winkel", "2  addieren → drehen", "3  Winkel → Zahl"]
        : ["1  number → angle", "2  add → rotate", "3  angle → number"];
      var stepW = small ? W - 2 * pad : Math.min((W - 2 * pad) / 3, 190);
      for (var si = 0; si < 3; si++) {
        var sx = pad + si * (small ? 0 : stepW + 8);
        var sy = stepsY + (small ? si * 14 : 0);
        txt(c, steps[si], sx, sy, {
          size: small ? 8.2 : 9.2,
          color: si === 0 ? C.green : si === 1 ? C.gold : C.sky,
          font: '700 ' + (small ? 8.2 : 9.2) + 'px "Open Sans", sans-serif'
        });
      }

      var top = small ? 138 : 112;
      var split = small ? W : W * 0.50;
      var sx0 = pad + 6;
      var sx1 = small ? W - pad - 6 : split - 24;
      var sy0 = small ? top : top + 18;
      var sy1 = small ? top + 94 : H - foot - 142;
      if (sy1 - sy0 < 44) sy1 = sy0 + 44;
      drawSpectrum(c, sx0, sx1, sy0, sy1, small);

      var cx, cy, r;
      if (small) {
        var cTop = sy1 + 36;
        var cBottom = H - foot - 42;
        cx = W / 2;
        cy = (cTop + cBottom) / 2;
        r = Math.max(38, Math.min((W - pad) / 2 - 34, (cBottom - cTop) / 2 - 4));
      } else {
        var wTop = top;
        var wBottom = H - foot - 118;
        cx = split + (W - pad - split) / 2;
        cy = (wTop + wBottom) / 2;
        r = Math.max(52, Math.min((W - pad - split) / 2 - 34, (wBottom - wTop) / 2 - 18));
      }
      drawAngleCircle(c, cx, cy, r, small, fourierA, fourierB, rotT);

      if (!small) {
        drawFrequencyBank(c, split + 8, H - foot - 108, W - pad - split - 8, 94, small, fourierA, fourierB, rotT);
      }

      txt(c, DE
        ? "c = a + b mod 113 · fünf Frequenzen · 95 % der Logit-Varianz"
        : "c = a + b mod 113 · five frequencies · 95% of logit variance",
        pad, H - foot - 24, { size: 8.4, color: C.muted });
      txt(c, "Nanda et al. (2023) · arXiv:2301.05217", pad, H - foot - 10, { size: 8.2, color: C.muted });
    }

    function drawMeasures(c) {
      var pad = Math.max(18, Math.min(30, W * 0.04));
      var small = W < 620;
      var phases = phaseData();
      head(c, DE ? "Fortschrittsmaße" : "Progress measures", pad, 30, { size: small ? 22 : 26 });
      txt(c, DE ? "Dieselben drei Phasen, drei Signale." : "The same three phases, three signals.", pad, 52, {
        size: small ? 10.5 : 12,
        color: C.muted
      });
      accent(c, pad, 66, 40);
      txt(c, DE ? "schematisch" : "schematic", W - pad, 30, { align: "right", size: 8.5, color: C.muted });

      var lx = pad;
      for (var q = 0; q < phases.length; q++) {
        c.save();
        c.fillStyle = V.alpha(phases[q].color, 0.85);
        c.fillRect(lx, 75, 7, 7);
        c.font = '600 ' + (small ? 7.6 : 8.4) + 'px "Open Sans", "Segoe UI", sans-serif';
        c.textAlign = "left";
        c.textBaseline = "middle";
        c.fillStyle = C.soft;
        c.fillText(phases[q].name, lx + 10, 79);
        lx += 10 + c.measureText(phases[q].name).width + (small ? 10 : 16);
        c.restore();
      }

      var labelW = small ? 88 : 118;
      var x0 = pad + labelW;
      var x1 = W - pad;
      var y0 = 96;
      var y1 = H - 96;
      var gap = 12;
      var rowH = (y1 - y0 - gap * 2) / 3;
      if (rowH < 34) rowH = 34;
      var rows = [
        {
          title: "Restricted Loss",
          sub: DE ? "fällt früh" : "falls early",
          color: C.green,
          fn: function (e) { return 0.08 + 0.92 * Math.exp(-e / 260); }
        },
        {
          title: "Excluded Loss",
          sub: DE ? "steigt, dann" : "rises, then",
          color: C.lilac,
          fn: function (e) { return 0.14 + 0.66 * sigmoid((e - 4800) / 1500) - 0.40 * sigmoid((e - 10800) / 380); }
        },
        {
          title: DE ? "Gewicht / Gini" : "Weight / Gini",
          sub: DE ? "kippt spät" : "shifts late",
          color: C.blue,
          fn: function (e) { return 0.16 + 0.06 * sigmoid((e - 5000) / 1200) + 0.58 * sigmoid((e - 10600) / 320); }
        }
      ];

      for (var r = 0; r < rows.length; r++) {
        var ry0 = y0 + r * (rowH + gap);
        var ry1 = ry0 + rowH;
        drawPhaseBands(c, phases, x0, x1, ry0, ry1);
        c.save();
        c.strokeStyle = V.alpha(C.lineStrong, 0.85);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x0, ry1);
        c.lineTo(x1, ry1);
        c.stroke();
        c.restore();

        c.save();
        c.beginPath();
        c.lineWidth = 2;
        c.lineJoin = "round";
        c.lineCap = "round";
        for (var k = 0; k <= 180; k++) {
          var f = k / 180;
          var e = Math.pow(1 + EPOCH_MAX, f) - 1;
          var px = x0 + f * (x1 - x0);
          var py = ry1 - 4 - V.clamp(rows[r].fn(e), 0, 1) * (rowH - 8);
          if (k === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.strokeStyle = rows[r].color;
        c.stroke();
        c.restore();

        txt(c, rows[r].title, pad, ry0 + rowH / 2 - 8, {
          size: small ? 10 : 11.2,
          font: '700 ' + (small ? 10 : 11.2) + 'px "Barlow", "Open Sans", sans-serif',
          color: C.ink
        });
        txt(c, rows[r].sub, pad, ry0 + rowH / 2 + 8, {
          size: 8.2,
          color: C.muted
        });
      }

      var sy = x0 + logFrac(scrubEpoch) * (x1 - x0);
      c.save();
      c.strokeStyle = V.alpha(C.gold, 0.55);
      c.lineWidth = 1.2;
      c.setLineDash([3, 4]);
      c.beginPath();
      c.moveTo(sy, y0);
      c.lineTo(sy, y1);
      c.stroke();
      c.restore();
      for (var sr = 0; sr < rows.length; sr++) {
        var ry = y0 + sr * (rowH + gap) + rowH;
        var py2 = ry - 4 - V.clamp(rows[sr].fn(scrubEpoch), 0, 1) * (rowH - 8);
        c.fillStyle = rows[sr].color;
        c.beginPath();
        c.arc(sy, py2, 2.8, 0, Math.PI * 2);
        c.fill();
      }

      drawScrubber(c, x0, x1, H - 72);
      drawTicks(c, x0, x1, y1, small);

      txt(c, DE
        ? "c = a + b mod 113 · einlagiger Transformer · 30 % der Paare · λ = 1"
        : "c = a + b mod 113 · one-layer transformer · 30% of pairs · λ = 1",
        pad, H - 32, { size: 8.4, color: C.muted });
      txt(c, "Nanda et al. (2023) · arXiv:2301.05217", pad, H - 14, { size: 8.2, color: C.muted });
    }

    function draw() {
      if (!W || !H) return;
      drawBackground(ctx);
      if (mode === "fourier") drawFourier(ctx);
      else if (mode === "measures") drawMeasures(ctx);
      else drawLoss(ctx);
    }

    function fit() {
      var r = api.fit(canvas, host);
      W = r.w;
      H = r.h;
      ctx = r.ctx;
      draw();
    }

    function setMode(next) {
      if (next !== "loss" && next !== "fourier" && next !== "measures") return;
      if (next === mode) return;
      mode = next;
      setControls(mode === "fourier");
      canvas.setAttribute("aria-label", ARIA[mode] || ARIA.loss);
      draw();
    }

    function onTheme() {
      C = api.colors();
      draw();
    }

    window.addEventListener("tm:theme", onTheme);
    window.addEventListener("resize", fit);
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { fit(); });
      ro.observe(host);
    }
    canvas.setAttribute("aria-label", ARIA[mode]);
    canvas.addEventListener("pointerdown", function (e) {
      if (mode === "fourier") return;
      if (scrubAt(e)) {
        scrubbing = true;
        e.preventDefault();
        try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      }
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!scrubbing) return;
      scrubAt(e);
      e.preventDefault();
    });
    function endScrub(e) {
      scrubbing = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    canvas.addEventListener("pointerup", endScrub);
    canvas.addEventListener("pointercancel", endScrub);
    fit();
    setControls(mode === "fourier");

    return {
      update: function (s) {
        if (s && s.mode) setMode(s.mode);
        setControls(mode === "fourier");
      },
      resize: fit,
      destroy: function () {
        window.removeEventListener("tm:theme", onTheme);
        window.removeEventListener("resize", fit);
        stopRotate();
        if (ro) ro.disconnect();
        host.remove();
      }
    };
  }

  core.register("grokking", grokkingScene);
})();
